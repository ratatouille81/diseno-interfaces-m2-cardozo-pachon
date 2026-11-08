// Formatos de fecha y hora en español de Colombia, siempre en la hora de Bogotá
const ZONA = 'America/Bogota'

export function fechaLarga(valor) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA,
  }).format(new Date(valor))
}

export function hora(valor) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ZONA,
  }).format(new Date(valor))
}

// Fecha de hoy + n días en formato AAAA-MM-DD (el que usan los campos de fecha y la base de datos)
export function diaISO(sumarDias = 0) {
  const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: ZONA }))
  hoy.setDate(hoy.getDate() + sumarDias)
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mm}-${dd}`
}

// Convierte "2026-11-09" en un texto legible sin que la zona horaria lo corra un día
export function diaLegible(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(a, m - 1, d))
}
