// Pantalla para crear una contraseña nueva. Aparece cuando el usuario abre el enlace
// de recuperación que Supabase le envió por correo (evento PASSWORD_RECOVERY).
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Alerta from '../components/Alerta'

function NuevaContrasena({ alTerminar }) {
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)

  async function guardar(evento) {
    evento.preventDefault()
    const encontrados = {}
    if (clave.length < 8) encontrados.clave = 'La contraseña debe tener al menos 8 caracteres.'
    if (confirmacion !== clave) encontrados.confirmacion = 'Las dos contraseñas no coinciden. Escríbelas de nuevo.'
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setGuardando(true)
    const { error } = await supabase.auth.updateUser({ password: clave })
    setGuardando(false)
    if (error) {
      setAviso({
        tipo: 'error',
        texto: error.code === 'same_password'
          ? 'La contraseña nueva debe ser distinta a la anterior.'
          : 'No pudimos cambiar la contraseña. El enlace pudo haber vencido; pide uno nuevo desde "¿Olvidaste tu contraseña?".',
      })
      return
    }
    setAviso({ tipo: 'exito', texto: 'Listo, tu contraseña quedó actualizada.' })
  }

  return (
    <main className="contenedor-app contenido" aria-labelledby="titulo-nueva">
      <p className="marca mb-2" aria-hidden="true">Mi Cita</p>
      <h1 id="titulo-nueva" className="h4 fw-bold mb-1">Crea una contraseña nueva</h1>
      <p className="text-secondary mb-4">Usa al menos 8 caracteres.</p>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      {aviso?.tipo === 'exito' ? (
        <button type="button" className="btn btn-primary btn-lg w-100" onClick={alTerminar}>Continuar a Mi Cita</button>
      ) : (
        <form onSubmit={guardar} noValidate>
          <div className="mb-3">
            <label htmlFor="clave-nueva" className="form-label">Contraseña nueva</label>
            <input id="clave-nueva" type="password" autoComplete="new-password"
              className={`form-control form-control-lg ${errores.clave ? 'is-invalid' : ''}`}
              value={clave} onChange={(e) => setClave(e.target.value)}
              aria-invalid={Boolean(errores.clave)} aria-describedby={errores.clave ? 'error-clave-nueva' : undefined} />
            {errores.clave && <div id="error-clave-nueva" className="invalid-feedback">{errores.clave}</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="clave-confirmacion" className="form-label">Repite la contraseña</label>
            <input id="clave-confirmacion" type="password" autoComplete="new-password"
              className={`form-control form-control-lg ${errores.confirmacion ? 'is-invalid' : ''}`}
              value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
              aria-invalid={Boolean(errores.confirmacion)} aria-describedby={errores.confirmacion ? 'error-clave-confirmacion' : undefined} />
            {errores.confirmacion && <div id="error-clave-confirmacion" className="invalid-feedback">{errores.confirmacion}</div>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </main>
  )
}

export default NuevaContrasena
