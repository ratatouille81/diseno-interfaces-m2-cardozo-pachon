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
  })
    .format(new Date(valor))
    .replace(/\s/g, '\u00a0') // espacios que no se parten: "9:00 a. m." nunca queda dividido en dos líneas
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

// Días hábiles (lunes a viernes) desde mañana hasta dentro de n días, para las pastillas de día.
// Cada día trae su fecha AAAA-MM-DD y su rótulo corto, por ejemplo "Lun 9" y "nov".
export function diasHabiles(hasta = 45) {
  const dias = []
  for (let i = 1; i <= hasta; i++) {
    const iso = diaISO(i)
    const [a, m, d] = iso.split('-').map(Number)
    const fecha = new Date(a, m - 1, d)
    const diaSemana = fecha.getDay()
    if (diaSemana === 0 || diaSemana === 6) continue
    const corto = new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fecha).replace('.', '')
    const mes = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(fecha).replace('.', '')
    dias.push({ iso, rotulo: `${corto.charAt(0).toUpperCase()}${corto.slice(1)} ${d}`, mes })
  }
  return dias
}
