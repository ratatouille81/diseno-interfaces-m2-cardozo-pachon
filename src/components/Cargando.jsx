// Componente de retroalimentación: indicador de carga con texto visible
// (visibilidad del estado del sistema, heurística 1 de Nielsen).
function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="d-flex align-items-center gap-2 py-4" role="status" aria-live="polite">
      <div className="spinner-border spinner-border-sm text-primary" aria-hidden="true"></div>
      <span>{texto}</span>
    </div>
  )
}

export default Cargando
