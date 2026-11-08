// Encabezado de pantalla del prototipo (componente "Encabezado", 64 px, fondo blanco y borde inferior).
// A la izquierda: botón Atrás opcional y título. A la derecha: un elemento opcional
// (por ejemplo "Paso 3 de 4" o el botón "Aa Letra más grande").
import { IconoAtras } from './Iconos'

function Encabezado({ titulo, alVolver, derecha }) {
  return (
    <header className="encabezado">
      <div className="contenedor-app d-flex align-items-center justify-content-between gap-2 h-100">
        <div className="d-flex align-items-center gap-1 min-w-0">
          {alVolver && (
            <button type="button" className="boton-icono" onClick={alVolver} aria-label="Atrás">
              <IconoAtras />
            </button>
          )}
          <p className="encabezado-titulo m-0 text-truncate">{titulo}</p>
        </div>
        {derecha}
      </div>
    </header>
  )
}

export default Encabezado
