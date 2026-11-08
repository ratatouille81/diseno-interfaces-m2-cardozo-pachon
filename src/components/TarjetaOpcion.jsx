// Tarjeta de opción del prototipo (componente "Tarjeta de opción": círculo con inicial, título y detalle).
// Variante "seleccion": por dentro es un radio button real (teclado y lector de pantalla); la elegida
// cambia de borde, fondo y peso del texto, no solo de color (WCAG 1.4.1).
// Variante "acceso": es un botón que lleva a otra pantalla y muestra la flecha "›".
import { IconoSiguiente } from './Iconos'

function Inicial({ texto }) {
  return <span className="tarjeta-inicial" aria-hidden="true">{texto.trim().charAt(0).toUpperCase()}</span>
}

export function TarjetaAcceso({ titulo, descripcion, alElegir }) {
  return (
    <button type="button" className="tarjeta-opcion w-100 text-start" onClick={alElegir}>
      <Inicial texto={titulo} />
      <span className="flex-grow-1">
        <span className="d-block fw-semibold">{titulo}</span>
        {descripcion && <span className="d-block small text-secondary">{descripcion}</span>}
      </span>
      <IconoSiguiente className="text-secondary flex-shrink-0" />
    </button>
  )
}

function TarjetaOpcion({ nombre, valor, seleccionado, alElegir, titulo, descripcion }) {
  const id = `${nombre}-${valor}`
  return (
    <label htmlFor={id} className={`tarjeta-opcion ${seleccionado ? 'tarjeta-opcion--activa' : ''}`}>
      <input
        id={id}
        type="radio"
        name={nombre}
        value={valor}
        checked={seleccionado}
        onChange={() => alElegir(valor)}
        className="visually-hidden"
      />
      <Inicial texto={titulo} />
      <span className="flex-grow-1">
        <span className={`d-block ${seleccionado ? 'fw-bold' : 'fw-semibold'}`}>{titulo}</span>
        {descripcion && <span className="d-block small text-secondary">{descripcion}</span>}
      </span>
      <span className={`tarjeta-marca ${seleccionado ? 'tarjeta-marca--activa' : ''}`} aria-hidden="true" />
    </label>
  )
}

export default TarjetaOpcion
