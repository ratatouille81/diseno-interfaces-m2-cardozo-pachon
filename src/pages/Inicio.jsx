// Pantalla de inicio (pantalla 02 del prototipo): próxima cita, acción principal y accesos rápidos.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fechaLarga, hora } from '../lib/formato'
import Encabezado from '../components/Encabezado'
import EstadoCita from '../components/EstadoCita'
import { TarjetaAcceso } from '../components/TarjetaOpcion'

const CONSULTA = 'id, estado, creada_en, agenda:agenda_id (fecha_hora, especialidad_id, sede_id, especialidad:especialidad_id (nombre), sede:sede_id (nombre))'

function Inicio({ alAgendar, alVerCitas, alAsistente, letraGrande, alCambiarLetra }) {
  // null = cargando; después { proxima, ultima }
  const [resumen, setResumen] = useState(null)

  useEffect(() => {
    let vigente = true
    supabase.from('citas').select(CONSULTA).then(({ data, error }) => {
      if (!vigente) return
      const citas = error ? [] : data
      const ahora = new Date()
      const proxima = citas
        .filter((c) => c.estado === 'Confirmada' && new Date(c.agenda.fecha_hora) > ahora)
        .sort((a, b) => new Date(a.agenda.fecha_hora) - new Date(b.agenda.fecha_hora))[0]
      // "Repetir última cita": la cita creada más recientemente, sin importar su estado
      const ultima = [...citas].sort((a, b) => new Date(b.creada_en) - new Date(a.creada_en))[0]
      setResumen({ proxima, ultima })
    })
    return () => { vigente = false }
  }, [])

  const proxima = resumen?.proxima
  const ultima = resumen?.ultima

  return (
    <>
      <Encabezado
        titulo="Hola"
        derecha={
          <button type="button" className="boton-letra" aria-pressed={letraGrande} onClick={() => alCambiarLetra(!letraGrande)}>
            <span aria-hidden="true">Aa </span>{letraGrande ? 'Letra normal' : 'Letra más grande'}
          </button>
        }
      />
      <main className="contenedor-app contenido">
        <h1 className="visually-hidden">Inicio</h1>

        {resumen === null ? (
          <div className="tarjeta mb-3" role="status">Buscando tu próxima cita…</div>
        ) : proxima ? (
          <section className="tarjeta mb-3" aria-labelledby="titulo-proxima">
            <h2 id="titulo-proxima" className="small text-secondary fw-semibold mb-1">Tu próxima cita</h2>
            <p className="h5 fw-bold mb-1">{proxima.agenda.especialidad.nombre}</p>
            <p className="mb-2">
              {fechaLarga(proxima.agenda.fecha_hora)}, {hora(proxima.agenda.fecha_hora)}
              <br />
              {proxima.agenda.sede.nombre}
            </p>
            <EstadoCita estado="Confirmada" />
          </section>
        ) : (
          <section className="tarjeta mb-3">
            <h2 className="small text-secondary fw-semibold mb-1">Tu próxima cita</h2>
            <p className="mb-0">No tienes citas próximas.</p>
          </section>
        )}

        <button type="button" className="btn btn-primary btn-lg btn-xl w-100 mb-4" onClick={() => alAgendar()}>
          Agendar cita
        </button>

        <h2 className="h6 fw-bold mb-3">Accesos rápidos</h2>
        {ultima && (
          <TarjetaAcceso
            titulo="Repetir última cita"
            descripcion={`${ultima.agenda.especialidad.nombre}, ${ultima.agenda.sede.nombre}`}
            alElegir={() => alAgendar({ especialidadId: ultima.agenda.especialidad_id, sedeId: ultima.agenda.sede_id })}
          />
        )}
        <TarjetaAcceso titulo="Mis citas" descripcion="Consulta o cancela tus citas" alElegir={alVerCitas} />
        <TarjetaAcceso titulo="Asistente para preparar tu cita" descripcion="Resuelve dudas antes de ir" alElegir={alAsistente} />
      </main>
    </>
  )
}

export default Inicio
