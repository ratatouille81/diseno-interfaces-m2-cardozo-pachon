// Pantalla de ingreso y registro.
// Componente de formulario con validación: no deja enviar datos incompletos y explica qué corregir.
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Alerta from '../components/Alerta'

// Traduce los errores de Supabase a mensajes que dicen qué pasó y qué hacer (heurística 9 de Nielsen)
function mensajeDeError(error) {
  const codigo = error?.code || ''
  if (codigo === 'invalid_credentials') return 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.'
  if (codigo === 'email_not_confirmed') return 'Tu correo aún no está confirmado. Abre el enlace que te enviamos y vuelve a ingresar.'
  if (codigo === 'user_already_exists') return 'Ya existe una cuenta con ese correo. Usa la opción Ingresar.'
  if (codigo === 'weak_password') return 'La contraseña es muy débil. Usa al menos 8 caracteres.'
  if (codigo === 'over_email_send_rate_limit' || codigo === 'over_request_rate_limit')
    return 'Hiciste muchos intentos seguidos. Espera unos minutos y vuelve a intentarlo.'
  if (error?.message?.includes('fetch')) return 'No pudimos conectarnos. Revisa tu conexión a internet e intenta de nuevo.'
  return 'Algo salió mal y no pudimos completar la solicitud. Intenta de nuevo en un momento.'
}

function validar({ correo, contrasena }) {
  const errores = {}
  if (!correo.trim()) errores.correo = 'Escribe tu correo.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.correo = 'Revisa el correo. Debe tener la forma nombre@dominio.com.'
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.'
  else if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.'
  return errores
}

function Ingreso() {
  const [modo, setModo] = useState('ingresar') // 'ingresar' o 'registrarse'
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null) // { tipo, texto }
  const [mostrarClave, setMostrarClave] = useState(false)

  const esRegistro = modo === 'registrarse'

  async function enviar(evento) {
    evento.preventDefault()
    setAviso(null)
    const encontrados = validar({ correo, contrasena })
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    const credenciales = { email: correo.trim(), password: contrasena }
    const { data, error } = esRegistro
      ? await supabase.auth.signUp(credenciales)
      : await supabase.auth.signInWithPassword(credenciales)
    setEnviando(false)

    if (error) {
      setAviso({ tipo: 'error', texto: mensajeDeError(error) })
      return
    }
    // Si el proyecto exige confirmar el correo, el registro no abre sesión todavía
    if (esRegistro && !data.session) {
      setAviso({ tipo: 'exito', texto: 'Cuenta creada. Te enviamos un correo: abre el enlace para confirmarla y luego ingresa.' })
    }
    // Si hubo sesión, App detecta el cambio y muestra el inicio
  }

  function cambiarModo() {
    setModo(esRegistro ? 'ingresar' : 'registrarse')
    setErrores({})
    setAviso(null)
  }

  return (
    <main className="contenedor-app contenido" aria-labelledby="titulo-ingreso">
      <div>
        <p className="marca mb-2" aria-hidden="true">Mi Cita</p>
        <h1 id="titulo-ingreso" className="h4 fw-bold mb-1">{esRegistro ? 'Crea tu cuenta' : 'Ingresa a tu cuenta'}</h1>
        <p className="text-secondary mb-4">
          {esRegistro ? 'Con tu cuenta agendas y consultas tus citas.' : 'Agenda tu cita médica en pocos pasos y sin llamar.'}
        </p>

        {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

        <form onSubmit={enviar} noValidate>
          <div className="mb-3">
            <label htmlFor="correo" className="form-label">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              className={`form-control form-control-lg ${errores.correo ? 'is-invalid' : ''}`}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={Boolean(errores.correo)}
              aria-describedby={errores.correo ? 'error-correo' : undefined}
            />
            {errores.correo && <div id="error-correo" className="invalid-feedback">{errores.correo}</div>}
          </div>

          <div className="mb-4">
            <label htmlFor="contrasena" className="form-label">Contraseña</label>
            <div className="position-relative">
            <input
              id="contrasena"
              type={mostrarClave ? 'text' : 'password'}
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              className={`form-control form-control-lg ${errores.contrasena ? 'is-invalid' : ''}`}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              aria-invalid={Boolean(errores.contrasena)}
              aria-describedby={errores.contrasena ? 'error-contrasena' : 'ayuda-contrasena'}
              style={{ paddingRight: '96px' }}
            />
            {/* "Mostrar" como en el prototipo: ayuda a no equivocarse al escribir (heurística 5) */}
            <button type="button" className="btn btn-link boton-mostrar" onClick={() => setMostrarClave(!mostrarClave)}
              aria-pressed={mostrarClave} aria-controls="contrasena">
              {mostrarClave ? 'Ocultar' : 'Mostrar'}
            </button>
            </div>
            {errores.contrasena
              ? <div id="error-contrasena" className="invalid-feedback d-block">{errores.contrasena}</div>
              : <div id="ayuda-contrasena" className="form-text">Mínimo 8 caracteres.</div>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={enviando}>
            {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center mt-3">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={cambiarModo}>
            {esRegistro ? 'Ingresar' : 'Crear una cuenta'}
          </button>
        </p>
      </div>
    </main>
  )
}

export default Ingreso
