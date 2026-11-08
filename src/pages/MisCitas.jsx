// Mis citas: componente de listado de datos.
// Muestra las citas del usuario (RLS garantiza que solo lleguen las suyas) y permite cancelar las próximas.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fechaLarga, hora } from '../lib/formato'
import Cargando from '../components/Cargando'
import Alerta from '../components/Alerta'
import EstadoCita from '../components/EstadoCita'
import DialogoConfirmacion from '../components/DialogoConfirmacion'

// Una cita confirmada cuya hora ya pasó se muestra como "Atendida"
function estadoVisible(cita) {
  if (cita.estado === 'Confirmada' && new Date(cita.agenda.fecha_hora) < new Date()) return 'Atendida'
  return cita.estado
}

function TarjetaCita({ cita, alCancelar }) {
  const estado = estadoVisible(cita)
  return (
    <li className="card card-body mb-3">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <h3 className="h6 m-0">{cita.agenda.especialidad.nombre}</h3>
        <EstadoCita estado={estado} />
      </div>
      <p className="mb-1">{fechaLarga(cita.agenda.fecha_hora)}, {hora(cita.agenda.fecha_hora)}</p>
      <p className="mb-1 text-secondary">{cita.agenda.sede.nombre}, {cita.agenda.sede.direccion}</p>
      <p className="mb-0 small text-secondary">Paciente: {cita.paciente} · Cita n.º {cita.id}</p>
      {estado === 'Confirmada' && (
        <button type="button" className="btn btn-outline-danger mt-3 align-self-start boton-atras" onClick={() => alCancelar(cita)}>
          Cancelar cita
        </button>
      )}
    </li>
  )
}

function MisCitas({ alAgendar }) {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [porCancelar, setPorCancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)

  // Cada vez que "version" cambia, se vuelven a pedir las citas (al abrir, al reintentar y al cancelar)
  const [version, setVersion] = useState(0)
  const recargar = () => setVersion((v) => v + 1)

  useEffect(() => {
    let vigente = true
    supabase
      .from('citas')
      .select('id, paciente, estado, agenda:agenda_id (fecha_hora, especialidad:especialidad_id (nombre), sede:sede_id (nombre, direccion))')
      .then(({ data, error: errorConsulta }) => {
        if (!vigente) return
        if (errorConsulta) {
          setError('No pudimos cargar tus citas. Revisa tu conexión e intenta de nuevo.')
        } else {
          setError(null)
          // Ordena por fecha de la cita, de la más cercana a la más lejana
          setCitas([...data].sort((a, b) => new Date(a.agenda.fecha_hora) - new Date(b.agenda.fecha_hora)))
        }
        setCargando(false)
      })
    return () => { vigente = false }
  }, [version])

  async function confirmarCancelacion() {
    setCancelando(true)
    const { error: errorUpdate } = await supabase
      .from('citas')
      .update({ estado: 'Cancelada' })
      .eq('id', porCancelar.id)
    setCancelando(false)
    setPorCancelar(null)
    if (errorUpdate) {
      setAviso({ tipo: 'error', texto: 'No pudimos cancelar la cita. Sigue confirmada; intenta de nuevo en un momento.' })
    } else {
      setAviso({ tipo: 'exito', texto: `La cita n.º ${porCancelar.id} quedó cancelada. Esa hora ya está libre para otra persona.` })
      recargar()
    }
  }

  if (cargando) return <Cargando texto="Cargando tus citas…" />

  const proximas = citas.filter((c) => estadoVisible(c) === 'Confirmada')
  const historial = citas.filter((c) => estadoVisible(c) !== 'Confirmada')

  return (
    <section aria-labelledby="titulo-mis-citas" className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <h1 id="titulo-mis-citas" className="h3 mb-3">Mis citas</h1>

        {error && (
          <Alerta tipo="error">
            {error}{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={recargar}>Reintentar</button>
          </Alerta>
        )}
        {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

        <h2 className="h5 mt-2">Próximas</h2>
        {proximas.length === 0 ? (
          <div className="card card-body mb-4">
            <p className="mb-3">No tienes citas próximas.</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={alAgendar}>Agendar una cita</button>
          </div>
        ) : (
          <ul className="list-unstyled mb-4">
            {proximas.map((c) => <TarjetaCita key={c.id} cita={c} alCancelar={setPorCancelar} />)}
          </ul>
        )}

        {historial.length > 0 && (
          <>
            <h2 className="h5">Historial</h2>
            <ul className="list-unstyled">
              {historial.map((c) => <TarjetaCita key={c.id} cita={c} alCancelar={setPorCancelar} />)}
            </ul>
          </>
        )}
      </div>

      <DialogoConfirmacion
        abierto={Boolean(porCancelar)}
        titulo="¿Cancelar esta cita?"
        textoConfirmar="Sí, cancelar la cita"
        procesando={cancelando}
        alConfirmar={confirmarCancelacion}
        alCerrar={() => setPorCancelar(null)}
      >
        {porCancelar && (
          <p className="mb-0">
            {porCancelar.agenda.especialidad.nombre}, {fechaLarga(porCancelar.agenda.fecha_hora)}, {hora(porCancelar.agenda.fecha_hora)}
            <span className="d-block mt-2">La hora quedará libre para otra persona.</span>
          </p>
        )}
      </DialogoConfirmacion>
    </section>
  )
}

export default MisCitas
