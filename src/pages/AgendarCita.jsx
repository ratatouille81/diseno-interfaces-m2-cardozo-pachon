// Flujo para agendar una cita en cuatro pasos (pantallas 03 a 08 del prototipo del módulo 1):
// 1. Para quién es la cita  2. Especialidad  3. Sede, día y hora  4. Revisar y confirmar
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diaLegible, diasHabiles, fechaLarga, hora } from '../lib/formato'
import { obtenerFestivos } from '../lib/festivos'
import Encabezado from '../components/Encabezado'
import TarjetaOpcion from '../components/TarjetaOpcion'
import Cargando from '../components/Cargando'
import Alerta from '../components/Alerta'
import EstadoCita from '../components/EstadoCita'
import { IconoConfirmada } from '../components/Iconos'

const TITULOS = {
  1: '¿Para quién es la cita?',
  2: '¿Qué especialidad necesitas?',
  3: 'Elige sede, día y hora',
  4: 'Revisa y confirma tu cita',
}

const DIAS = diasHabiles(45)

// "inicial" llega desde "Repetir última cita" con la especialidad y la sede ya elegidas
function AgendarCita({ inicial, alTerminar, alVerCitas }) {
  const [paso, setPaso] = useState(inicial ? 3 : 1)

  // Datos de la cita que se va armando
  const [paraQuien, setParaQuien] = useState('yo') // 'yo' o 'familiar'
  const [nombre, setNombre] = useState('')
  const [especialidadId, setEspecialidadId] = useState(inicial?.especialidadId ?? null)
  const [sedeId, setSedeId] = useState(inicial?.sedeId ?? null)
  const [dia, setDia] = useState(DIAS[0]?.iso ?? '')
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

  // Festivos de Colombia desde la API REST Nager.Date: 'cargando', 'listo' o 'error'
  const [festivos, setFestivos] = useState(new Map())
  const [estadoFestivos, setEstadoFestivos] = useState('cargando')

  const [errorPaso, setErrorPaso] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [citaCreada, setCitaCreada] = useState(null)

  // Al cambiar de paso, el foco va al título para que el lector de pantalla anuncie dónde está el usuario
  const tituloRef = useRef(null)
  useEffect(() => {
    tituloRef.current?.focus()
  }, [paso, citaCreada])

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

  // Pide los festivos de los años que cubre la agenda (puede pasar de diciembre a enero)
  useEffect(() => {
    let vigente = true
    const anios = [...new Set(DIAS.map((d) => Number(d.iso.slice(0, 4))))]
    obtenerFestivos(anios)
      .then((mapa) => {
        if (!vigente) return
        setFestivos(mapa)
        setEstadoFestivos('listo')
      })
      .catch(() => {
        if (vigente) setEstadoFestivos('error')
      })
    return () => { vigente = false }
  }, [])

  // Cada vez que cambian especialidad, sede o día, consulta las horas con cupo
  useEffect(() => {
    if (paso !== 3 || !especialidadId || !sedeId || !dia) return
    let vigente = true
    async function cargarHoras() {
      setCargandoHoras(true)
      setErrorHoras(null)
      setEspacio(null)
      // Si el día es festivo no se consulta la agenda: ese día no hay atención
      if (festivos.has(dia)) {
        setHoras([])
        setCargandoHoras(false)
        return
      }
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
  }, [paso, especialidadId, sedeId, dia, festivos])

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
    window.scrollTo(0, 0)
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
    if (paso === 3 && !sedeId) {
      setErrorPaso('Elige una sede para continuar.')
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
    window.scrollTo(0, 0)
    setCitaCreada(data)
  }

  // Pantalla 08 del prototipo: cita confirmada, con número de cita (visibilidad del estado del sistema)
  if (citaCreada) {
    return (
      <main className="contenedor-app contenido contenido--con-acciones text-center" aria-labelledby="titulo-confirmada">
        <IconoConfirmada className="mt-4 mb-3" />
        <h1 id="titulo-confirmada" ref={tituloRef} tabIndex={-1} className="titulo-pantalla mb-1">
          ¡Tu cita quedó confirmada!
        </h1>
        <p className="fw-semibold mb-3">Número de cita: {citaCreada.id}</p>
        <div className="tarjeta text-start mb-3">
          <p className="mb-2">
            {especialidad?.nombre}. {nombrePaciente}.
            <br />
            {fechaLarga(espacio.fecha_hora)}, {hora(espacio.fecha_hora)}
            <br />
            {sede?.nombre}, {sede?.direccion}.
          </p>
          <EstadoCita estado="Confirmada" />
        </div>
        <p className="small text-secondary">Recuerda llegar 20 minutos antes con tu documento de identidad.</p>
        <div className="acciones-fijas">
          <div className="contenedor-app d-flex flex-column gap-2">
            <button type="button" className="btn btn-primary btn-lg w-100" onClick={alVerCitas}>Ver mis citas</button>
            <button type="button" className="btn btn-outline-primary btn-lg w-100" onClick={alTerminar}>Volver al inicio</button>
          </div>
        </div>
      </main>
    )
  }

  const derechaPaso = <span className="small text-secondary text-nowrap">Paso {paso} de 4</span>

  if (cargandoCatalogos || errorCatalogos) {
    return (
      <>
        <Encabezado titulo="Agendar cita" alVolver={alTerminar} derecha={derechaPaso} />
        <main className="contenedor-app contenido">
          {errorCatalogos ? <Alerta tipo="error">{errorCatalogos}</Alerta> : <Cargando texto="Preparando el agendamiento…" />}
        </main>
      </>
    )
  }

  const diaElegido = DIAS.find((d) => d.iso === dia)

  return (
    <>
      <Encabezado titulo="Agendar cita" alVolver={atras} derecha={derechaPaso} />
      <main className="contenedor-app contenido contenido--con-acciones">
        <h1 ref={tituloRef} tabIndex={-1} className="titulo-pantalla">{TITULOS[paso]}</h1>

        {paso === 1 && (
          <fieldset>
            <legend className="text-secondary fs-6 mb-3">Puedes agendar para ti o para un familiar.</legend>
            <TarjetaOpcion nombre="para-quien" valor="yo" seleccionado={paraQuien === 'yo'}
              alElegir={conLimpieza(setParaQuien)} titulo="Para mí" descripcion="Titular de la cuenta" />
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
            {/* Ayuda contextual de la pantalla 04 del prototipo (heurística 10) */}
            <div className="tarjeta mt-3" style={{ background: 'var(--mc-primario-claro)', borderColor: '#c9dcf2' }}>
              <p className="fw-semibold mb-1">¿No sabes cuál elegir?</p>
              <p className="mb-0 small">
                Si no tienes una orden médica para un especialista, empieza por Medicina general. Si tienes dudas sobre
                cómo prepararte, pregúntale al Asistente.
              </p>
            </div>
          </fieldset>
        )}

        {paso === 3 && (
          <>
            <fieldset className="mb-3">
              <legend className="h6 fw-bold mb-3">Sede</legend>
              {sedes.map((s) => (
                <TarjetaOpcion key={s.id} nombre="sede" valor={s.id} seleccionado={sedeId === s.id}
                  alElegir={conLimpieza(setSedeId)} titulo={s.nombre} descripcion={s.direccion} />
              ))}
            </fieldset>

            <fieldset className="mb-3">
              <legend className="h6 fw-bold mb-1">Día</legend>
              <p className="small text-secondary mb-2">
                Lunes a viernes, excepto festivos.
                {estadoFestivos === 'cargando' && <span role="status"> Consultando los festivos de Colombia…</span>}
              </p>
              {estadoFestivos === 'error' && (
                <p className="small text-danger mb-2">
                  No pudimos consultar los festivos. Puedes seguir agendando; si eliges un festivo, la sede no tendrá agenda ese día.
                </p>
              )}
              <div className="fila-dias" role="group" aria-label="Días disponibles">
                {DIAS.map((d) => {
                  const festivo = festivos.get(d.iso)
                  return (
                    <button key={d.iso} type="button" className="pastilla" aria-pressed={dia === d.iso}
                      disabled={Boolean(festivo)} title={festivo ? `Festivo: ${festivo}` : undefined}
                      onClick={() => conLimpieza(setDia)(d.iso)}>
                      {d.rotulo}
                      {/* Texto extra solo para lectores de pantalla: el nombre conserva lo visible (WCAG 2.5.3) */}
                      <span className="visually-hidden"> de {d.mes}{festivo ? `, festivo (${festivo}), sin atención` : ''}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <h2 className="h6 fw-bold mb-1">Hora disponible</h2>
            <p className="small text-secondary mb-2">
              {diaElegido ? `${diaLegible(dia)}. ` : ''}Solo mostramos horas con cupo.
            </p>
            {!sedeId ? (
              <p className="text-secondary">Elige una sede para ver las horas disponibles.</p>
            ) : festivos.has(dia) ? (
              <Alerta tipo="aviso" titulo="Ese día es festivo">
                El {diaLegible(dia)} es festivo en Colombia ({festivos.get(dia)}) y no hay atención. Elige otro día.
              </Alerta>
            ) : cargandoHoras ? (
              <Cargando texto="Buscando horas con cupo…" />
            ) : errorHoras ? (
              <Alerta tipo="error">{errorHoras}</Alerta>
            ) : horas.length === 0 ? (
              // Pantalla 06 del prototipo: explica que no es un error del usuario y qué puede hacer (heurística 9)
              <Alerta tipo="aviso" titulo="No hay horas con cupo ese día">
                No es un error tuyo: ese día no hay agenda en esta sede. Prueba otro día o elige otra sede.
              </Alerta>
            ) : (
              <div className="rejilla-horas" role="group" aria-label="Horas disponibles">
                {horas.map((h) => (
                  <button key={h.agenda_id} type="button" className="pastilla" aria-pressed={espacio?.agenda_id === h.agenda_id}
                    onClick={() => conLimpieza(setEspacio)(h)}>
                    {hora(h.fecha_hora)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {paso === 4 && (
          <>
            <div className="tarjeta mb-3">
              {[
                ['Paciente', nombrePaciente, 1],
                ['Especialidad', especialidad?.nombre, 2],
                ['Sede', `${sede?.nombre}, ${sede?.direccion}`, 3],
                ['Fecha y hora', `${fechaLarga(espacio.fecha_hora)}, ${hora(espacio.fecha_hora)}`, 3],
              ].map(([rotulo, valor, pasoDestino], i) => (
                <div key={rotulo} className={`d-flex justify-content-between align-items-start gap-3 ${i > 0 ? 'pt-3 mt-3 border-top' : ''}`}>
                  <div>
                    <p className="small text-secondary mb-0">{rotulo}</p>
                    <p className="fw-semibold mb-0">{valor}</p>
                  </div>
                  <button type="button" className="btn btn-link p-0" onClick={() => irA(pasoDestino)}
                    aria-label={`Cambiar ${rotulo.toLowerCase()}`}>
                    Cambiar
                  </button>
                </div>
              ))}
            </div>
            <div className="tarjeta" style={{ background: 'var(--mc-pendiente-fondo)', borderColor: '#f3d48a' }}>
              <p className="mb-0 small">Recuerda llegar 20 minutos antes con tu documento de identidad.</p>
            </div>
          </>
        )}

        <div className="acciones-fijas">
          <div className="contenedor-app">
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
      </main>
    </>
  )
}

export default AgendarCita
