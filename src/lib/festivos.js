// Integración con la API REST pública Nager.Date (https://date.nager.at): festivos de Colombia.
// No requiere clave. Responde un JSON con la fecha (AAAA-MM-DD) y el nombre local de cada festivo.
const URL_BASE = 'https://date.nager.at/api/v3/PublicHolidays'

// Guarda las respuestas por año para no repetir la misma petición
const memoria = new Map()

async function festivosDelAnio(anio) {
  if (memoria.has(anio)) return memoria.get(anio)

  const respuesta = await fetch(`${URL_BASE}/${anio}/CO`)
  // fetch no falla con códigos 4xx o 5xx: hay que revisar "ok" a mano
  if (!respuesta.ok) throw new Error(`Nager.Date respondió ${respuesta.status}`)

  const lista = await respuesta.json()
  memoria.set(anio, lista)
  return lista
}

// Devuelve un Map { 'AAAA-MM-DD' => 'Nombre del festivo' } con los años pedidos
export async function obtenerFestivos(anios) {
  const listas = await Promise.all(anios.map(festivosDelAnio))
  return new Map(listas.flat().map((f) => [f.date, f.localName]))
}
