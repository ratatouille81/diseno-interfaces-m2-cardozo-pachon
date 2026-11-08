// Grupo familiar en Perfil (pantalla 10 del prototipo): lista, agregar y quitar familiares.
// Componente de formulario con validación y de listado de datos.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diaISO } from '../lib/formato'
import { PARENTESCOS, descripcionFamiliar, listarFamiliares } from '../lib/familiares'
import Alerta from './Alerta'
import Cargando from './Cargando'
import DialogoConfirmacion from './DialogoConfirmacion'

const VACIO = { nombre: '', parentesco: '', fechaNacimiento: '' }

function validar(datos) {
  const errores = {}
  const nombre = datos.nombre.trim()
  if (nombre.length < 3) errores.nombre = 'Escribe el nombre completo (mínimo 3 letras).'
  else if (nombre.length > 80) errores.nombre = 'El nombre es muy largo. Usa máximo 80 caracteres.'
  if (!datos.parentesco) errores.parentesco = 'Elige el parentesco.'
  if (datos.fechaNacimiento && datos.fechaNacimiento > diaISO(0)) errores.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
  return errores
}

function GrupoFamiliar() {
  const [familiares, setFamiliares] = useState(null) // null = cargando
  const [errorCarga, setErrorCarga] = useState(null)
  const [version, setVersion] = useState(0)
  const [formAbierto, setFormAbierto] = useState(false)
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [porQuitar, setPorQuitar] = useState(null)
  const [quitando, setQuitando] = useState(false)

  useEffect(() => {
    let vigente = true
    listarFamiliares().then(({ data, error }) => {
      if (!vigente) return
      if (error) setErrorCarga('No pudimos cargar tu grupo familiar. Revisa tu conexión e intenta de nuevo.')
      else {
        setErrorCarga(null)
        setFamiliares(data)
      }
    })
    return () => { vigente = false }
  }, [version])

  const cambiar = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value })
    setErrores({ ...errores, [campo]: undefined })
  }

  async function guardar(evento) {
    evento.preventDefault()
    const encontrados = validar(datos)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return
    setGuardando(true)
    const { error } = await supabase.from('familiares').insert({
      nombre: datos.nombre.trim(),
      parentesco: datos.parentesco,
      fecha_nacimiento: datos.fechaNacimiento || null,
    })
    setGuardando(false)
    if (error) {
      setAviso({ tipo: 'error', texto: 'No pudimos guardar el familiar. Revisa tu conexión e intenta de nuevo.' })
      return
    }
    setAviso({ tipo: 'exito', texto: `${datos.nombre.trim()} quedó en tu grupo familiar. Ya puedes agendarle citas.` })
    setDatos(VACIO)
    setFormAbierto(false)
    setVersion((v) => v + 1)
  }

  async function quitar() {
    setQuitando(true)
    const { error } = await supabase.from('familiares').delete().eq('id', porQuitar.id)
    setQuitando(false)
    setPorQuitar(null)
    if (error) setAviso({ tipo: 'error', texto: 'No pudimos quitar al familiar. Intenta de nuevo.' })
    else {
      setAviso({ tipo: 'exito', texto: `${porQuitar.nombre} ya no está en tu grupo familiar. Sus citas se conservan.` })
      setVersion((v) => v + 1)
    }
  }

  return (
    <section aria-labelledby="titulo-familia" className="mb-5">
      <h2 id="titulo-familia" className="h6 fw-bold mb-1">Grupo familiar</h2>
      <p className="small text-secondary mb-3">Las personas a las que les agendas citas. Aparecen como opción en el primer paso.</p>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      {familiares === null && !errorCarga ? (
        <Cargando texto="Cargando tu grupo familiar…" />
      ) : (
        <ul className="list-unstyled mb-3">
          {(familiares ?? []).map((f) => (
            <li key={f.id} className="tarjeta-opcion" style={{ cursor: 'default' }}>
              <span className="tarjeta-inicial" aria-hidden="true">{f.nombre.charAt(0).toUpperCase()}</span>
              <span className="flex-grow-1">
                <span className="d-block fw-semibold">{f.nombre}</span>
                <span className="d-block small text-secondary">{descripcionFamiliar(f)}</span>
              </span>
              <button type="button" className="btn btn-link boton-enlace p-0" onClick={() => setPorQuitar(f)}
                aria-label={`Quitar a ${f.nombre}`}>
                Quitar
              </button>
            </li>
          ))}
          {familiares?.length === 0 && <li className="text-secondary mb-2">Aún no has agregado familiares.</li>}
        </ul>
      )}

      {formAbierto ? (
        <form onSubmit={guardar} noValidate className="tarjeta">
          <div className="mb-3">
            <label htmlFor="familiar-nombre" className="form-label">Nombre completo</label>
            <input id="familiar-nombre" className={`form-control form-control-lg ${errores.nombre ? 'is-invalid' : ''}`}
              value={datos.nombre} onChange={cambiar('nombre')} autoComplete="off" maxLength={80}
              aria-invalid={Boolean(errores.nombre)} aria-describedby={errores.nombre ? 'error-familiar-nombre' : undefined} />
            {errores.nombre && <div id="error-familiar-nombre" className="invalid-feedback">{errores.nombre}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="familiar-parentesco" className="form-label">Parentesco</label>
            <select id="familiar-parentesco" className={`form-select form-control-lg ${errores.parentesco ? 'is-invalid' : ''}`}
              value={datos.parentesco} onChange={cambiar('parentesco')}
              aria-invalid={Boolean(errores.parentesco)} aria-describedby={errores.parentesco ? 'error-familiar-parentesco' : undefined}>
              <option value="">Elige una opción</option>
              {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errores.parentesco && <div id="error-familiar-parentesco" className="invalid-feedback">{errores.parentesco}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="familiar-nacimiento" className="form-label">Fecha de nacimiento (opcional)</label>
            <input id="familiar-nacimiento" type="date" max={diaISO(0)}
              className={`form-control form-control-lg ${errores.fechaNacimiento ? 'is-invalid' : ''}`}
              value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')}
              aria-invalid={Boolean(errores.fechaNacimiento)}
              aria-describedby={errores.fechaNacimiento ? 'error-familiar-nacimiento' : 'ayuda-familiar-nacimiento'} />
            {errores.fechaNacimiento
              ? <div id="error-familiar-nacimiento" className="invalid-feedback">{errores.fechaNacimiento}</div>
              : <div id="ayuda-familiar-nacimiento" className="form-text">Sirve para mostrar la edad, por ejemplo "Hijo, 3 años".</div>}
          </div>
          <div className="d-flex flex-column gap-2">
            <button type="submit" className="btn btn-primary btn-lg" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar familiar'}
            </button>
            <button type="button" className="btn btn-outline-primary btn-lg"
              onClick={() => { setFormAbierto(false); setDatos(VACIO); setErrores({}) }}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-outline-primary btn-lg w-100" onClick={() => { setFormAbierto(true); setAviso(null) }}>
          Agregar familiar
        </button>
      )}

      <DialogoConfirmacion
        abierto={Boolean(porQuitar)}
        titulo="¿Quitar a este familiar?"
        textoConfirmar="Sí, quitar"
        textoCancelar="No, mantenerlo"
        procesando={quitando}
        alConfirmar={quitar}
        alCerrar={() => setPorQuitar(null)}
      >
        {porQuitar && (
          <p className="mb-0">
            {porQuitar.nombre} ya no aparecerá al agendar. Las citas que ya tiene se conservan.
          </p>
        )}
      </DialogoConfirmacion>
    </section>
  )
}

export default GrupoFamiliar
