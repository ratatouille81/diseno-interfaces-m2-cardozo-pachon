// Íconos de línea usados en el prototipo del módulo 1 (inicio, calendario, perfil, flechas).
// Son decorativos: el texto que los acompaña es el que leen los lectores de pantalla (aria-hidden).
const base = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false',
}

export const IconoInicio = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></svg>
)
export const IconoCalendario = (p) => (
  <svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)
export const IconoAsistente = (p) => (
  <svg {...base} {...p}><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" /><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" /></svg>
)
export const IconoPerfil = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>
)
export const IconoAtras = (p) => (
  <svg {...base} {...p}><path d="M15 5 8 12l7 7" /></svg>
)
export const IconoSiguiente = (p) => (
  <svg {...base} {...p}><path d="m9 5 7 7-7 7" /></svg>
)
export const IconoConfirmada = (p) => (
  <svg {...base} width={88} height={88} viewBox="0 0 88 88" strokeWidth={4} {...p}>
    <circle cx="44" cy="44" r="40" fill="var(--mc-confirmada-fondo)" stroke="var(--mc-confirmada)" />
    <path d="m28 45 11 11 22-23" stroke="var(--mc-confirmada)" />
  </svg>
)
