// Función serverless del asistente de Mi Cita (Vercel Functions, runtime Node.js).
// Es la ÚNICA pieza que conoce la clave de Gemini: el navegador nunca la ve.
// Recibe la pregunta, verifica que quien pregunta haya iniciado sesión, llama a Gemini
// y devuelve la respuesta en streaming (texto que llega por partes).

const MODELO = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:streamGenerateContent?alt=sse`
const MAX_CARACTERES = 500
const MAX_TURNOS = 6

// Instrucciones fijas del asistente: alcance, tono y límites (no diagnostica)
const INSTRUCCIONES = `Eres el asistente de Mi Cita, una aplicación académica y genérica para agendar citas médicas en una EPS de Colombia. No representas a ninguna EPS real.
Tu tarea: ayudar a los pacientes a preparar su cita y a usar la aplicación.
Puedes explicar: qué documentos llevar (documento de identidad y, si los tiene, órdenes médicas, exámenes previos y lista de medicamentos que toma), llegar 20 minutos antes, cómo agendar en Mi Cita (cuatro pasos: para quién es la cita, especialidad, sede con día y hora, revisión y confirmación) y cómo cancelar (pantalla Mis citas, botón Cancelar cita).
Sobre ayuno u otras preparaciones: da orientación general y aclara siempre que la indicación que vale es la de su médico o la de la orden del examen.
Límites obligatorios:
- No diagnosticas, no interpretas síntomas, no recomiendas medicamentos ni dosis y no sugieres especialidades según síntomas.
- Si la persona describe síntomas graves o una urgencia (dolor en el pecho, dificultad para respirar, sangrado abundante, pérdida de conciencia, ideas de hacerse daño), dile que acuda de inmediato a urgencias o llame a la línea de emergencias 123.
- No inventes teléfonos, direcciones, horarios ni trámites de EPS reales. Si no sabes algo, dilo.
- No pidas datos personales ni de salud.
Estilo: español de Colombia, trato de "tú", lenguaje sencillo, máximo 120 palabras, sin tecnicismos. Responde en texto plano, sin formato Markdown: no uses asteriscos ni almohadillas; para listas usa líneas que empiecen con un guion y un espacio.`

function respuestaError(estado, mensaje) {
  return new Response(JSON.stringify({ error: mensaje }), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// Comprueba con Supabase que el token corresponde a un usuario real con sesión activa.
// Así nadie de afuera puede gastar el cupo de Gemini llamando directamente a esta función.
async function usuarioValido(request) {
  const autorizacion = request.headers.get('authorization') || ''
  if (!autorizacion.startsWith('Bearer ')) return false
  const respuesta = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: autorizacion },
  })
  return respuesta.ok
}

// Valida la conversación que manda el navegador: solo turnos "user" y "model", con texto corto
function conversacionLimpia(cuerpo) {
  const mensajes = Array.isArray(cuerpo?.mensajes) ? cuerpo.mensajes.slice(-MAX_TURNOS) : []
  if (mensajes.length === 0 || mensajes.at(-1).rol !== 'user') return null
  const limpios = []
  for (const m of mensajes) {
    if (!['user', 'model'].includes(m?.rol) || typeof m?.texto !== 'string') return null
    const texto = m.texto.trim()
    if (!texto || texto.length > (m.rol === 'user' ? MAX_CARACTERES : 2000)) return null
    limpios.push({ role: m.rol, parts: [{ text: texto }] })
  }
  return limpios
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return respuestaError(500, 'El asistente no está configurado en este momento. Intenta más tarde.')
  }
  if (!(await usuarioValido(request))) {
    return respuestaError(401, 'Tu sesión expiró. Vuelve a ingresar para usar el asistente.')
  }

  let cuerpo
  try {
    cuerpo = await request.json()
  } catch {
    return respuestaError(400, 'No entendimos la pregunta. Escríbela de nuevo.')
  }
  const contents = conversacionLimpia(cuerpo)
  if (!contents) {
    return respuestaError(400, `Escribe una pregunta de máximo ${MAX_CARACTERES} caracteres.`)
  }

  const respuestaGemini = await fetch(URL_GEMINI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCCIONES }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    }),
  })

  if (!respuestaGemini.ok) {
    // El detalle técnico queda en los registros del servidor; al paciente le llega un mensaje claro
    console.error('Gemini respondió', respuestaGemini.status, await respuestaGemini.text())
    if (respuestaGemini.status === 429) {
      return respuestaError(429, 'El asistente alcanzó su límite de consultas por ahora. Intenta de nuevo más tarde.')
    }
    return respuestaError(502, 'El asistente no está disponible en este momento. Intenta de nuevo en unos minutos.')
  }

  // Gemini responde en formato SSE ("data: {...}" por línea). Se extrae solo el texto
  // y se reenvía al navegador a medida que llega.
  const lector = respuestaGemini.body.getReader()
  const decodificador = new TextDecoder()
  const codificador = new TextEncoder()
  let pendiente = ''

  const flujo = new ReadableStream({
    async pull(controlador) {
      const { done, value } = await lector.read()
      if (done) {
        controlador.close()
        return
      }
      pendiente += decodificador.decode(value, { stream: true })
      const lineas = pendiente.split('\n')
      pendiente = lineas.pop() // la última puede venir incompleta
      for (const linea of lineas) {
        if (!linea.startsWith('data:')) continue
        try {
          const dato = JSON.parse(linea.slice(5))
          const texto = (dato.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')
          if (texto) controlador.enqueue(codificador.encode(texto))
        } catch {
          // fragmento que no es JSON completo: se ignora
        }
      }
    },
    cancel() {
      lector.cancel()
    },
  })

  return new Response(flujo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
