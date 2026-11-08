// Perfil (pantalla 10 del prototipo): tamaño de letra y cierre de sesión.
import Encabezado from '../components/Encabezado'
import GrupoFamiliar from '../components/GrupoFamiliar'

function Perfil({ correo, letraGrande, alCambiarLetra, alCerrarSesion }) {
  return (
    <>
      <Encabezado titulo="Perfil" />
      <main className="contenedor-app contenido">
        <h1 className="titulo-pantalla mb-1">Tu cuenta</h1>
        <p className="text-secondary mb-4">{correo}</p>

        <fieldset className="mb-2">
          <legend className="h6 fw-bold mb-3">Tamaño de letra</legend>
          <div className="d-flex gap-3">
            <button type="button" className="pastilla flex-fill" aria-pressed={!letraGrande} onClick={() => alCambiarLetra(false)}>
              Normal
            </button>
            <button type="button" className="pastilla flex-fill" aria-pressed={letraGrande} onClick={() => alCambiarLetra(true)}>
              Más grande
            </button>
          </div>
        </fieldset>
        <p className="small text-secondary mb-5">
          La letra más grande se aplica en toda la aplicación y se mantiene la próxima vez que entres desde este dispositivo.
        </p>

        <GrupoFamiliar />

        <button type="button" className="btn btn-outline-primary btn-lg w-100" onClick={alCerrarSesion}>
          Cerrar sesión
        </button>
      </main>
    </>
  )
}

export default Perfil
