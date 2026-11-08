// Tarjeta seleccionable reutilizable (para quién, especialidad, sede).
// Por dentro es un radio button real: funciona con teclado y con lector de pantalla.
// La opción elegida cambia de borde y de peso del texto, no solo de color (WCAG 1.4.1).
function TarjetaOpcion({ nombre, valor, seleccionado, alElegir, titulo, descripcion }) {
  const id = `${nombre}-${valor}`
  return (
    <label
      htmlFor={id}
      className={`card card-body mb-2 tarjeta-opcion ${seleccionado ? 'tarjeta-opcion--activa' : ''}`}
    >
      <span className="d-flex align-items-start gap-3">
        <input
          id={id}
          type="radio"
          name={nombre}
          value={valor}
          checked={seleccionado}
          onChange={() => alElegir(valor)}
          className="form-check-input mt-1 flex-shrink-0"
        />
        <span>
          <span className={`d-block ${seleccionado ? 'fw-bold' : 'fw-semibold'}`}>{titulo}</span>
          {descripcion && <span className="d-block small text-secondary">{descripcion}</span>}
        </span>
      </span>
    </label>
  )
}

export default TarjetaOpcion
