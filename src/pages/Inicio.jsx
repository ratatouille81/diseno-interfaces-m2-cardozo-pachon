// Pantalla de inicio: una sola acción principal destacada (heurística 8, diseño minimalista)
function Inicio({ alAgendar, alAsistente }) {
  return (
    <section aria-labelledby="titulo-inicio" className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <h1 id="titulo-inicio" className="h3">¿Qué necesitas hoy?</h1>
        <p className="text-secondary">Agenda tu cita en cuatro pasos y recibe la confirmación al instante.</p>
        <button type="button" className="btn btn-primary btn-lg w-100" onClick={alAgendar}>
          Agendar cita
        </button>
        <button type="button" className="btn btn-link w-100 mt-2" onClick={alAsistente}>
          ¿Dudas para preparar tu cita? Pregúntale al asistente
        </button>
      </div>
    </section>
  )
}

export default Inicio
