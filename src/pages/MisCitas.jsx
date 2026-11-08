// Mis citas: componente de listado de datos.
// Muestra las citas del usuario (RLS garantiza que solo lleguen las suyas) y permite cancelar las próximas.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fechaLarga, hora } from '../lib/formato'
import Cargando from '../components/Cargando'
import Alerta from '../components/Alerta'
import Encabezado from '../components/Encabezado'
import EstadoCita from '../components/EstadoCita'
import DialogoConfirmacion from '../components/DialogoConfirmacion'

// Una cita confirmada cuya hora ya pasó se muestra como "Atendida"
function estadoVisible(cita) {
  if (cita.estado === 'Confirmada' && new Date(cita.agenda.fecha_hora) < new Date()) return 'Atendida'
  return cita.estado
}

function TarjetaCita({ cita, alCancelar, alReprogramar }) {
  const estado = estadoVisible(cita)
  return (
    <li className="tarjeta mb-3">
      {/* Tarjeta de cita de la pantalla 09 del prototipo: especialidad, detalle, estado y acción */}
      <h3 className="h6 fw-bold mb-2">{cita.agenda.especialidad.nombre}</h3>
      <p className="mb-2">
        {cita.paciente}. {fechaLarga(cita.agenda.fecha_hora)}, {hora(cita.agenda.fecha_hora)} {cita.agenda.sede.nombre}.
      </p>
      <EstadoCita estado={estado} />
      <p className="small text-secondary mt-2 mb-0">Cita n.º {cita.id}</p>
      {estado === 'Confirmada' && (
        // Acciones de la pantalla 09 del prototipo: Reprogramar y Cancelar
        <div className="d-flex gap-4 mt-2">
          <button type="button" className="btn btn-link p-0 boton-enlace" onClick={() => alReprogramar(cita)}>
            Reprogramar
          </button>
          <button type="button" className="btn btn-link p-0 boton-enlace" onClick={() => alCancelar(cita)}>
            Cancelar cita
          </button>
        </div>
      )}
    </li>
  )
}

function MisCitas({ alAgendar, alReprogramar }) {
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
      .select('id, paciente, estado, familiar_id, agenda:agenda_id (fecha_hora, especialidad_id, sede_id, especialidad:especialidad_id (nombre), sede:sede_id (nombre, direccion))')
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

  if (cargando) {
    return (
      <>
        <Encabezado titulo="Mis citas" />
        <main className="contenedor-app contenido"><Cargando texto="Cargando tus citas…" /></main>
      </>
    )
  }

  const proximas = citas.filter((c) => estadoVisible(c) === 'Confirmada')
  const historial = citas.filter((c) => estadoVisible(c) !== 'Confirmada')

  return (
    <>
      <Encabezado titulo="Mis citas" />
      <main className="contenedor-app contenido" aria-labelledby="titulo-mis-citas">
        <h1 id="titulo-mis-citas" className="visually-hidden">Mis citas</h1>

        {error && (
          <Alerta tipo="error">
            {error}{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={recargar}>Reintentar</button>
          </Alerta>
        )}
        {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

        <h2 className="h6 fw-bold mb-3">Próximas</h2>
        {proximas.length === 0 ? (
          <div className="tarjeta mb-4">
            <p className="mb-3">No tienes citas próximas.</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={alAgendar}>Agendar una cita</button>
          </div>
        ) : (
          <ul className="list-unstyled mb-4">
            {proximas.map((c) => <TarjetaCita key={c.id} cita={c} alCancelar={setPorCancelar} alReprogramar={alReprogramar} />)}
          </ul>
        )}

        {historial.length > 0 && (
          <>
            <h2 className="h6 fw-bold mb-3">Historial</h2>
            <ul className="list-unstyled mb-0">
              {historial.map((c) => <TarjetaCita key={c.id} cita={c} alCancelar={setPorCancelar} alReprogramar={alReprogramar} />)}
            </ul>
          </>
        )}
      </main>

      <DialogoConfirmacion
        abierto={Boolean(porCancelar)}
        titulo="¿Cancelar esta cita?"
        textoConfirmar="Sí, cancelar la cita"
        textoCancelar="No, mantener la cita"
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
    </>
  )
}

export default MisCitas
