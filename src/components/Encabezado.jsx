// Componente de navegación: encabezado con el nombre de la app y, si hay sesión, el botón para salir.
function Encabezado({ correo, alCerrarSesion }) {
  return (
    <header className="bg-primary text-white py-3">
      <div className="container d-flex justify-content-between align-items-center gap-3">
        <p className="h4 m-0">Mi Cita</p>
        {correo && (
          <nav aria-label="Cuenta" className="d-flex align-items-center gap-3">
            <span className="small d-none d-sm-inline">{correo}</span>
            <button type="button" className="btn btn-light btn-sm" onClick={alCerrarSesion}>
              Cerrar sesión
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Encabezado
