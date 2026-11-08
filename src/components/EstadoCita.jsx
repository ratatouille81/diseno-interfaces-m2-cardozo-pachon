// Etiqueta de estado de una cita: color + punto + texto escrito.
// El estado se entiende aunque la persona no distinga colores (WCAG 1.4.1, decisión del módulo 1).
// Colores del prototipo, con contraste AA verificado en el módulo 1.
const ESTILOS = {
  Confirmada: { color: 'var(--mc-confirmada)', fondo: 'var(--mc-confirmada-fondo)' },
  Cancelada: { color: 'var(--mc-cancelada)', fondo: '#fdecea' },
  Atendida: { color: 'var(--mc-texto-secundario)', fondo: '#eef0f3' },
}

function EstadoCita({ estado }) {
  const estilo = ESTILOS[estado] ?? ESTILOS.Atendida
  return (
    <span
      className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1 small fw-semibold"
      style={{ color: estilo.color, backgroundColor: estilo.fondo }}
    >
      <span aria-hidden="true">●</span>
      {estado}
    </span>
  )
}

export default EstadoCita
