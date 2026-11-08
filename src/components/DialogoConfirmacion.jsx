// Ventana de confirmación antes de una acción que no se puede deshacer fácilmente (prevención de errores, heurística 5).
// Usa el elemento <dialog> nativo de HTML: atrapa el foco, se cierra con Escape y lo anuncian los lectores de pantalla.
import { useEffect, useRef } from 'react'

function DialogoConfirmacion({ abierto, titulo, children, textoConfirmar, textoCancelar = 'No, volver', procesando, alConfirmar, alCerrar }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      className="dialogo rounded-3 border-0 shadow p-0"
      aria-labelledby="titulo-dialogo"
      onCancel={(e) => { e.preventDefault(); alCerrar() }}
    >
      <div className="p-4">
        <h2 id="titulo-dialogo" className="h5">{titulo}</h2>
        <div className="mb-4">{children}</div>
        <div className="d-flex flex-column gap-2">
          <button type="button" className="btn btn-danger btn-lg" onClick={alConfirmar} disabled={procesando}>
            {procesando ? 'Un momento…' : textoConfirmar}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-lg" onClick={alCerrar} disabled={procesando}>
            {textoCancelar}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default DialogoConfirmacion
