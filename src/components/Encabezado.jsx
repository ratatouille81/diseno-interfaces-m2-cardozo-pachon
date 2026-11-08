// Componente de navegación: nombre de la app, menú principal y botón para salir.
// El menú marca la sección actual con aria-current y con un subrayado, no solo con color.
const SECCIONES = [
  { id: 'inicio', texto: 'Inicio' },
  { id: 'mis-citas', texto: 'Mis citas' },
  { id: 'asistente', texto: 'Asistente' },
]

function Encabezado({ correo, vista, alNavegar, alCerrarSesion }) {
  return (
    <header className="bg-primary text-white">
      <div className="container d-flex justify-content-between align-items-center gap-3 py-3">
        <p className="h4 m-0">Mi Cita</p>
        {correo && (
          <div className="d-flex align-items-center gap-3">
            <span className="small d-none d-md-inline">{correo}</span>
            <button type="button" className="btn btn-light btn-sm" onClick={alCerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      {correo && (
        <nav aria-label="Principal" className="container">
          <ul className="nav gap-1">
            {SECCIONES.map((s) => {
              const actual = vista === s.id || (s.id === 'inicio' && vista === 'agendar')
              return (
                <li key={s.id} className="nav-item">
                  <button
                    type="button"
                    className={`nav-link text-white px-3 py-2 enlace-menu ${actual ? 'enlace-menu--actual' : ''}`}
                    aria-current={actual ? 'page' : undefined}
                    onClick={() => alNavegar(s.id)}
                  >
                    {s.texto}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Encabezado
