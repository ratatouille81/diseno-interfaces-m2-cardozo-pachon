// Mi Cita: estructura general de la aplicación.
// Escucha la sesión de Supabase y decide qué mostrar: cargando, ingreso o inicio.
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Encabezado from './components/Encabezado'
import Cargando from './components/Cargando'
import Ingreso from './pages/Ingreso'
import Inicio from './pages/Inicio'
import AgendarCita from './pages/AgendarCita'
import MisCitas from './pages/MisCitas'

function App() {
  const [sesion, setSesion] = useState(null)
  const [revisando, setRevisando] = useState(true)
  const [vista, setVista] = useState('inicio') // 'inicio', 'agendar' o 'mis-citas'

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

  return (
    <>
      <Encabezado
        correo={sesion?.user?.email}
        vista={vista}
        alNavegar={setVista}
        alCerrarSesion={() => { setVista('inicio'); supabase.auth.signOut() }}
      />

      <main className="container py-4">
        {revisando ? (
          <Cargando texto="Revisando tu sesión…" />
        ) : sesion ? (
          vista === 'agendar' ? (
            <AgendarCita alTerminar={() => setVista('inicio')} alVerCitas={() => setVista('mis-citas')} />
          ) : vista === 'mis-citas' ? (
            <MisCitas alAgendar={() => setVista('agendar')} />
          ) : (
            <Inicio alAgendar={() => setVista('agendar')} />
          )
        ) : (
          <Ingreso />
        )}
      </main>

      <footer className="container py-3 small text-secondary">
        Mi Cita es un proyecto académico. No corresponde a ninguna EPS real.
      </footer>
    </>
  )
}

export default App
