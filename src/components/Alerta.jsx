// Componente de retroalimentación: muestra un mensaje de éxito, aviso o error.
// role="alert" hace que los lectores de pantalla lo anuncien en cuanto aparece.
const ESTILOS = {
  exito: 'alert-success',
  aviso: 'alert-warning',
  error: 'alert-danger',
  info: 'alert-info',
}

function Alerta({ tipo = 'info', titulo, children }) {
  return (
    <div className={`alert ${ESTILOS[tipo]} mb-3`} role="alert">
      {titulo && <p className="fw-semibold mb-1">{titulo}</p>}
      <div className="mb-0">{children}</div>
    </div>
  )
}

export default Alerta
