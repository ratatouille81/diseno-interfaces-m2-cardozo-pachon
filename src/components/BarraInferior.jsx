// Componente de navegación: barra inferior del prototipo, al alcance del pulgar.
// Cada sección lleva ícono y texto; la actual se marca con color, peso y aria-current (no solo color).
import { IconoAsistente, IconoCalendario, IconoInicio, IconoPerfil } from './Iconos'

const SECCIONES = [
  { id: 'inicio', texto: 'Inicio', Icono: IconoInicio },
  { id: 'mis-citas', texto: 'Mis citas', Icono: IconoCalendario },
  { id: 'asistente', texto: 'Asistente', Icono: IconoAsistente },
  { id: 'perfil', texto: 'Perfil', Icono: IconoPerfil },
]

function BarraInferior({ vista, alNavegar }) {
  return (
    <nav className="barra-inferior" aria-label="Principal">
      <ul className="contenedor-app d-flex justify-content-around list-unstyled m-0 h-100">
        {SECCIONES.map(({ id, texto, Icono }) => {
          const actual = vista === id || (id === 'inicio' && vista === 'agendar')
          return (
            <li key={id} className="flex-fill">
              <button
                type="button"
                className={`barra-inferior-boton ${actual ? 'barra-inferior-boton--actual' : ''}`}
                aria-current={actual ? 'page' : undefined}
                onClick={() => alNavegar(id)}
              >
                <Icono />
                <span>{texto}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BarraInferior
