// Preferencia de tamaño de letra (decisión del módulo 1 pensada en Jorge, que ve mal de cerca).
// Se guarda en el navegador para que se mantenga al volver. Si el navegador no deja guardar
// (modo privado, por ejemplo), la app sigue funcionando con la letra normal.
import { useEffect, useState } from 'react'

const CLAVE = 'mi-cita-letra-grande'

function leer() {
  try {
    return localStorage.getItem(CLAVE) === 'si'
  } catch {
    return false
  }
}

export function useLetraGrande() {
  const [letraGrande, setLetraGrande] = useState(leer)

  useEffect(() => {
    // La clase en <html> agranda todo el texto: Bootstrap mide los tamaños en rem
    document.documentElement.classList.toggle('letra-grande', letraGrande)
    try {
      localStorage.setItem(CLAVE, letraGrande ? 'si' : 'no')
    } catch {
      // sin almacenamiento: la preferencia dura solo esta visita
    }
  }, [letraGrande])

  return [letraGrande, setLetraGrande]
}
