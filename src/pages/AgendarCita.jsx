// Flujo para agendar una cita en cuatro pasos (diseñado en el módulo 1):
// 1. Para quién es la cita  2. Especialidad  3. Sede, día y hora  4. Revisar y confirmar
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diaISO, diaLegible, fechaLarga, hora } from '../lib/formato'
import EncabezadoPaso from '../components/EncabezadoPaso'
import TarjetaOpcion from '../components/TarjetaOpcion'
import Cargando from '../components/Cargando'
import Alerta from '../components/Alerta'

const TITULOS = {
  1: '¿Para quién es la cita?',
  2: 'Elige la especialidad',
  3: 'Elige sede, día y hora',
  4: 'Revisa y confirma tu cita',
}

function AgendarCita({ alTerminar }) {
  const [paso, setPaso] = useState(1)

  // Datos de la cita que se va armando
  const [paraQuien, setParaQuien] = useState('yo') // 'yo' o 'familiar'
  const [nombre, setNombre] = useState('')
  const [especialidadId, setEspecialidadId] = useState(null)
  const [sedeId, setSedeId] = useState(null)
  const [dia, setDia] = useState(diaISO(1))
  const [espacio, setEspacio] = useState(null) // { agenda_id, fecha_hora }

  // Catálogos que vienen de Supabase
  const [especialidades, setEspecialidades] = useState([])
  const [sedes, setSedes] = useState([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState(null)

  // Horas disponibles del día elegido
  const [horas, setHoras] = useState([])
  const [cargandoHoras, setCargandoHoras] = useState(false)
  const [errorHoras, setErrorHoras] = useState(null)

  const [errorPaso, setErrorPaso] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [citaCreada, setCitaCreada] = useState(null)

  // Carga especialidades y sedes una sola vez
  useEffect(() => {
    async function cargar() {
      const [esp, sed] = await Promise.all([
        supabase.from('especialidades').select('id, nombre, descripcion').order('nombre'),
        supabase.from('sedes').select('id, nombre, direccion').order('nombre'),
      ])
      if (esp.error || sed.error) {
        setErrorCatalogos('No pudimos cargar las especialidades y sedes. Revisa tu conexión y vuelve a intentarlo.')
      } else {
        setEspecialidades(esp.data)
        setSedes(sed.data)
      }
      setCargandoCatalogos(false)
    }
    cargar()
  }, [])

  // Cada vez que cambian especialidad, sede o día, consulta las horas con cupo
  useEffect(() => {
    if (paso !== 3 || !especialidadId || !sedeId || !dia) return
    let vigente = true
    async function cargarHoras() {
      setCargandoHoras(true)
      setErrorHoras(null)
      setEspacio(null)
      const { data, error } = await supabase.rpc('horarios_disponibles', {
        p_especialidad: especialidadId,
        p_sede: sedeId,
        p_dia: dia,
      })
      if (!vigente) return
      if (error) setErrorHoras('No pudimos consultar los horarios. Intenta de nuevo en un momento.')
      else setHoras(data)
      setCargandoHoras(false)
    }
    cargarHoras()
    return () => { vigente = false }
  }, [paso, especialidadId, sedeId, dia])

  const especialidad = especialidades.find((e) => e.id === especialidadId)
  const sede = sedes.find((s) => s.id === sedeId)
  const nombrePaciente = paraQuien === 'yo' ? 'Yo (titular de la cuenta)' : nombre.trim()

  // Al elegir una opción se borra el aviso: el usuario ya corrigió lo que faltaba
  const conLimpieza = (setter) => (valor) => {
    setter(valor)
    setErrorPaso(null)
  }

  function irA(nuevoPaso) {
    setErrorPaso(null)
    setPaso(nuevoPaso)
  }

  function siguiente() {
    // Prevención de errores: no deja avanzar sin completar el paso (heurística 5 de Nielsen)
    if (paso === 1 && paraQuien === 'familiar' && nombre.trim().length < 3) {
      setErrorPaso('Escribe el nombre completo del familiar para continuar.')
      return
    }
    if (paso === 2 && !especialidadId) {
      setErrorPaso('Elige una especialidad para continuar.')
      return
    }
    if (paso === 3 && !espacio) {
      setErrorPaso('Elige una hora disponible para continuar.')
      return
    }
    irA(paso + 1)
  }

  function atras() {
    if (paso === 1) alTerminar()
    else irA(paso - 1)
  }

  async function confirmar() {
    setConfirmando(true)
    setErrorPaso(null)
    const { data, error } = await supabase
      .from('citas')
      .insert({ agenda_id: espacio.agenda_id, paciente: nombrePaciente })
      .select('id')
      .single()
    setConfirmando(false)

    if (error) {
      // 23505 = otra persona confirmó ese mismo espacio un instante antes (índice único de la base de datos)
      if (error.code === '23505') {
        setEspacio(null)
        setPaso(3)
        setErrorPaso('Alguien acaba de tomar esa hora. Elige otra de las disponibles.')
      } else {
        setErrorPaso('No pudimos guardar tu cita. Revisa tu conexión e intenta de nuevo; no se ha agendado nada.')
      }
      return
    }
    setCitaCreada(data)
  }

  // Pantalla de éxito: confirma con número de cita (visibilidad del estado del sistema)
  if (citaCreada) {
    return (
      <section aria-labelledby="titulo-confirmada" className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <Alerta tipo="exito" titulo="¡Tu cita quedó confirmada!">
            Número de cita: <strong>{citaCreada.id}</strong>
          </Alerta>
          <h1 id="titulo-confirmada" className="h4">Detalle de tu cita</h1>
          <ul className="list-group mb-4">
            <li className="list-group-item">Paciente: {nombrePaciente}</li>
            <li className="list-group-item">Especialidad: {especialidad?.nombre}</li>
            <li className="list-group-item">Sede: {sede?.nombre}, {sede?.direccion}</li>
            <li className="list-group-item">
              Fecha: {fechaLarga(espacio.fecha_hora)}, {hora(espacio.fecha_hora)}
            </li>
          </ul>
          <p className="text-secondary">Recuerda llegar 20 minutos antes con tu documento de identidad.</p>
          <button type="button" className="btn btn-primary btn-lg w-100" onClick={alTerminar}>
            Volver al inicio
          </button>
        </div>
      </section>
    )
  }

  if (cargandoCatalogos) return <Cargando texto="Preparando el agendamiento…" />
  if (errorCatalogos) return <Alerta tipo="error">{errorCatalogos}</Alerta>

  return (
    <section className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <EncabezadoPaso paso={paso} titulo={TITULOS[paso]} alVolver={atras} />

        {paso === 1 && (
          <fieldset>
            <legend className="visually-hidden">Para quién es la cita</legend>
            <TarjetaOpcion nombre="para-quien" valor="yo" seleccionado={paraQuien === 'yo'}
              alElegir={conLimpieza(setParaQuien)} titulo="Para mí" descripcion="Soy el titular de la cuenta" />
            <TarjetaOpcion nombre="para-quien" valor="familiar" seleccionado={paraQuien === 'familiar'}
              alElegir={conLimpieza(setParaQuien)} titulo="Para un familiar" descripcion="Hijo, hija, padre, madre u otro beneficiario" />
            {paraQuien === 'familiar' && (
              <div className="mt-3">
                <label htmlFor="nombre-familiar" className="form-label">Nombre completo del familiar</label>
                <input id="nombre-familiar" className="form-control form-control-lg" value={nombre}
                  onChange={(e) => conLimpieza(setNombre)(e.target.value)} autoComplete="off" />
              </div>
            )}
          </fieldset>
        )}

        {paso === 2 && (
          <fieldset>
            <legend className="visually-hidden">Especialidad</legend>
            {especialidades.map((e) => (
              <TarjetaOpcion key={e.id} nombre="especialidad" valor={e.id} seleccionado={especialidadId === e.id}
                alElegir={conLimpieza(setEspecialidadId)} titulo={e.nombre} descripcion={e.descripcion} />
            ))}
          </fieldset>
        )}

        {paso === 3 && (
          <>
            <fieldset className="mb-3">
              <legend className="h6">Sede</legend>
              {sedes.map((s) => (
                <TarjetaOpcion key={s.id} nombre="sede" valor={s.id} seleccionado={sedeId === s.id}
                  alElegir={setSedeId} titulo={s.nombre} descripcion={s.direccion} />
              ))}
            </fieldset>

            <div className="mb-3">
              <label htmlFor="dia" className="form-label h6">Día</label>
              <input id="dia" type="date" className="form-control form-control-lg" value={dia}
                min={diaISO(1)} max={diaISO(45)} onChange={(e) => setDia(e.target.value)} />
              <div className="form-text">Atención de lunes a viernes. Puedes agendar hasta con 45 días de anticipación.</div>
            </div>

            {!sedeId ? (
              <p className="text-secondary">Elige una sede para ver las horas disponibles.</p>
            ) : cargandoHoras ? (
              <Cargando texto="Buscando horas con cupo…" />
            ) : errorHoras ? (
              <Alerta tipo="error">{errorHoras}</Alerta>
            ) : horas.length === 0 ? (
              <Alerta tipo="aviso" titulo="No hay horas con cupo ese día">
                No es un error tuyo: ese día no hay agenda en esta sede. Prueba otro día o elige otra sede.
              </Alerta>
            ) : (
              <fieldset>
                <legend className="h6">Hora ({diaLegible(dia)})</legend>
                <div className="d-flex flex-wrap gap-2">
                  {horas.map((h) => {
                    const elegido = espacio?.agenda_id === h.agenda_id
                    return (
                      <button key={h.agenda_id} type="button" aria-pressed={elegido}
                        className={`btn btn-lg boton-hora ${elegido ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => conLimpieza(setEspacio)(h)}>
                        {hora(h.fecha_hora)}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </>
        )}

        {paso === 4 && (
          <>
            <ul className="list-group mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-start gap-2">
                <span><span className="d-block small text-secondary">Paciente</span>{nombrePaciente}</span>
                <button type="button" className="btn btn-link p-0" onClick={() => irA(1)}>Cambiar</button>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-start gap-2">
                <span><span className="d-block small text-secondary">Especialidad</span>{especialidad?.nombre}</span>
                <button type="button" className="btn btn-link p-0" onClick={() => irA(2)}>Cambiar</button>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-start gap-2">
                <span>
                  <span className="d-block small text-secondary">Sede, día y hora</span>
                  {sede?.nombre}, {fechaLarga(espacio.fecha_hora)}, {hora(espacio.fecha_hora)}
                </span>
                <button type="button" className="btn btn-link p-0" onClick={() => irA(3)}>Cambiar</button>
              </li>
            </ul>
            <p className="small text-secondary">Recuerda llegar 20 minutos antes con tu documento de identidad.</p>
          </>
        )}

        <div className="mt-4">
          {/* El aviso va junto al botón: es donde está mirando el usuario cuando intenta avanzar */}
          {errorPaso && <Alerta tipo="error">{errorPaso}</Alerta>}
          {paso < 4 ? (
            <button type="button" className="btn btn-primary btn-lg w-100" onClick={siguiente}>Continuar</button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg w-100" onClick={confirmar} disabled={confirmando}>
              {confirmando ? 'Confirmando…' : 'Confirmar cita'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default AgendarCita
