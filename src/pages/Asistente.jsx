// Asistente para preparar la cita: funcionalidad inteligente con la API de Gemini.
// La pregunta va a la función serverless /api/asistente (que guarda la clave) y la respuesta
// aparece en tiempo real, a medida que llega (streaming).
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Alerta from '../components/Alerta'
import Encabezado from '../components/Encabezado'

const MAX_CARACTERES = 500
const SUGERENCIAS = [
  '¿Qué documentos llevo a mi cita?',
  '¿Tengo que ir en ayunas a un examen de sangre?',
  '¿Cómo cancelo una cita?',
]

function Asistente() {
  const [mensajes, setMensajes] = useState([]) // [{ rol: 'user' | 'model', texto }]
  const [pregunta, setPregunta] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [error, setError] = useState(null)
  const campoRef = useRef(null)

  async function preguntar(textoPregunta) {
    const texto = textoPregunta.trim()
    if (!texto) {
      setError('Escribe tu pregunta antes de enviarla.')
      campoRef.current?.focus()
      return
    }
    if (texto.length > MAX_CARACTERES) {
      setError(`Tu pregunta es muy larga. Usa máximo ${MAX_CARACTERES} caracteres.`)
      return
    }

    setError(null)
    setPregunta('')
    const conversacion = [...mensajes, { rol: 'user', texto }]
    // Se agrega la respuesta vacía de una vez; se irá llenando a medida que llegue el texto
    setMensajes([...conversacion, { rol: 'model', texto: '' }])
    setEscribiendo(true)

    try {
      const { data } = await supabase.auth.getSession()
      const respuesta = await fetch('/api/asistente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({ mensajes: conversacion }),
      })

      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}))
        throw new Error(cuerpo.error || 'El asistente no está disponible en este momento. Intenta de nuevo en unos minutos.')
      }

      // Lee la respuesta por partes y la va mostrando (efecto de escritura en tiempo real)
      const lector = respuesta.body.getReader()
      const decodificador = new TextDecoder()
      let acumulado = ''
      for (;;) {
        const { done, value } = await lector.read()
        if (done) break
        acumulado += decodificador.decode(value, { stream: true })
        const parcial = acumulado
        setMensajes((previos) => [...previos.slice(0, -1), { rol: 'model', texto: parcial }])
      }
      if (!acumulado.trim()) throw new Error('El asistente no devolvió respuesta. Intenta preguntar de otra forma.')
    } catch (e) {
      const mensaje = e instanceof TypeError
        ? 'No pudimos conectarnos. Revisa tu conexión a internet e intenta de nuevo.'
        : e.message
      setError(mensaje)
      // Quita la respuesta vacía y devuelve la pregunta al campo para no perderla
      setMensajes(conversacion.slice(0, -1))
      setPregunta(texto)
    } finally {
      setEscribiendo(false)
    }
  }

  function enviar(evento) {
    evento.preventDefault()
    preguntar(pregunta)
  }

  return (
    <>
      <Encabezado titulo="Asistente" />
      <main className="contenedor-app contenido" aria-labelledby="titulo-asistente">
        <h1 id="titulo-asistente" className="titulo-pantalla">Prepara tu cita</h1>

        {/* Transparencia: deja claro que es una IA, qué hace y qué no (diseñar para IA, módulo 1) */}
        <Alerta tipo="info" titulo="Este asistente es una inteligencia artificial">
          Te orienta sobre cómo prepararte y cómo usar Mi Cita. No da diagnósticos ni reemplaza a tu médico.
          Si tienes una urgencia, ve a urgencias o llama al 123. No escribas datos personales ni de salud.
        </Alerta>

        {mensajes.length === 0 && (
          <div className="mb-3">
            <p className="small text-secondary mb-2">Puedes empezar con una de estas preguntas:</p>
            <div className="d-flex flex-column gap-2">
              {SUGERENCIAS.map((s) => (
                <button key={s} type="button" className="btn btn-outline-primary btn-lg text-start fw-normal" onClick={() => preguntar(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <ol className="list-unstyled mb-3" aria-label="Conversación">
          {mensajes.map((m, i) => (
            <li key={i} className={`tarjeta mb-2 ${m.rol === 'user' ? 'mensaje-paciente' : ''}`}>
              <span className="small fw-semibold d-block mb-1">{m.rol === 'user' ? 'Tú' : 'Asistente (IA)'}</span>
              <span className="mensaje-texto" aria-live={m.rol === 'model' && i === mensajes.length - 1 ? 'polite' : undefined}>
                {m.texto || (escribiendo && i === mensajes.length - 1 ? 'Escribiendo…' : '')}
              </span>
            </li>
          ))}
        </ol>

        {error && <Alerta tipo="error">{error}</Alerta>}

        <form onSubmit={enviar} noValidate>
          <label htmlFor="pregunta" className="form-label">Tu pregunta</label>
          <textarea
            id="pregunta"
            ref={campoRef}
            className="form-control form-control-lg mb-1"
            rows={3}
            maxLength={MAX_CARACTERES}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            aria-describedby="contador-pregunta"
            disabled={escribiendo}
          />
          <div id="contador-pregunta" className="form-text mb-3">
            {pregunta.length} de {MAX_CARACTERES} caracteres
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={escribiendo}>
            {escribiendo ? 'El asistente está respondiendo…' : 'Preguntar'}
          </button>
        </form>
      </main>
    </>
  )
}

export default Asistente
