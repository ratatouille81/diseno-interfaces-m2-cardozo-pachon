// Mi Cita: estructura general de la aplicación.
// Escucha la sesión de Supabase y decide qué mostrar: cargando, ingreso o la pantalla elegida
// en la barra inferior (Inicio, Mis citas, Asistente o Perfil).
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useLetraGrande } from './lib/preferencias'
import BarraInferior from './components/BarraInferior'
import Cargando from './components/Cargando'
import Ingreso from './pages/Ingreso'
import Inicio from './pages/Inicio'
import AgendarCita from './pages/AgendarCita'
import MisCitas from './pages/MisCitas'
import Asistente from './pages/Asistente'
import Perfil from './pages/Perfil'

function App() {
  const [sesion, setSesion] = useState(null)
  const [revisando, setRevisando] = useState(true)
  const [vista, setVista] = useState('inicio') // 'inicio', 'agendar', 'mis-citas', 'asistente' o 'perfil'
  const [agendaInicial, setAgendaInicial] = useState(null) // datos para "Repetir última cita"
  const [letraGrande, setLetraGrande] = useLetraGrande()

  useEffect(() => {
    // 1. Al abrir la app, revisa si ya había una sesión guardada
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setRevisando(false)
    })
    // 2. Desde ahí, escucha cada ingreso o salida para actualizar la pantalla
    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
    })
    return () => suscripcion.subscription.unsubscribe()
  }, [])

  function navegar(destino) {
    setVista(destino)
    window.scrollTo(0, 0)
  }

  function agendar(inicial = null) {
    setAgendaInicial(inicial)
    navegar('agendar')
  }

  function cerrarSesion() {
    setVista('inicio')
    supabase.auth.signOut()
  }

  if (revisando) {
    return <main className="contenedor-app contenido"><Cargando texto="Revisando tu sesión…" /></main>
  }
  if (!sesion) return <Ingreso />

  const preferenciasLetra = { letraGrande, alCambiarLetra: setLetraGrande }

  return (
    <>
      {vista === 'agendar' ? (
        <AgendarCita
          inicial={agendaInicial}
          alTerminar={() => navegar('inicio')}
          alVerCitas={() => navegar('mis-citas')}
        />
      ) : vista === 'mis-citas' ? (
        <MisCitas alAgendar={() => agendar()} />
      ) : vista === 'asistente' ? (
        <Asistente />
      ) : vista === 'perfil' ? (
        <Perfil correo={sesion.user.email} alCerrarSesion={cerrarSesion} {...preferenciasLetra} />
      ) : (
        <Inicio
          alAgendar={agendar}
          alVerCitas={() => navegar('mis-citas')}
          alAsistente={() => navegar('asistente')}
          {...preferenciasLetra}
        />
      )}
      <BarraInferior vista={vista} alNavegar={navegar} />
      <footer className="visually-hidden">Mi Cita es un proyecto académico. No corresponde a ninguna EPS real.</footer>
    </>
  )
}

export default App
