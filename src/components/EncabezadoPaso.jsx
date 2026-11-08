// Encabezado de cada paso del flujo de agendamiento: botón Atrás, indicador "Paso X de 4" y título.
// Responde las preguntas ¿dónde estoy? y ¿cómo vuelvo? (heurísticas 1 y 3 de Nielsen).
import { useEffect, useRef } from 'react'

function EncabezadoPaso({ paso, total = 4, titulo, alVolver }) {
  const tituloRef = useRef(null)

  // Al cambiar de paso, el foco va al título para que el lector de pantalla anuncie dónde está el usuario
  useEffect(() => {
    tituloRef.current?.focus()
  }, [paso])

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <button type="button" className="btn btn-outline-secondary boton-atras" onClick={alVolver}>
          <span aria-hidden="true">←</span> Atrás
        </button>
        <span className="small text-secondary">Paso {paso} de {total}</span>
      </div>
      <div
        className="progress mb-3"
        role="progressbar"
        aria-label={`Paso ${paso} de ${total}`}
        aria-valuenow={paso}
        aria-valuemin={1}
        aria-valuemax={total}
        style={{ height: '6px' }}
      >
        <div className="progress-bar" style={{ width: `${(paso / total) * 100}%` }}></div>
      </div>
      <h1 ref={tituloRef} tabIndex={-1} className="h3">{titulo}</h1>
    </div>
  )
}

export default EncabezadoPaso
