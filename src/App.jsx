// Estructura base de Mi Cita: encabezado, contenido principal y pie, con etiquetas semánticas de HTML5
function App() {
  return (
    <>
      <header className="bg-primary text-white py-3">
        <div className="container">
          <h1 className="h4 m-0">Mi Cita</h1>
        </div>
      </header>

      <main className="container py-4">
        <section aria-labelledby="titulo-bienvenida">
          <h2 id="titulo-bienvenida" className="h5">Agenda tu cita médica en pocos pasos</h2>
          <p className="text-secondary">Proyecto en construcción.</p>
        </section>
      </main>

      <footer className="container py-3 small text-secondary">
        Mi Cita es un proyecto académico. No corresponde a ninguna EPS real.
      </footer>
    </>
  )
}

export default App
