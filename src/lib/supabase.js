// Cliente de Supabase: una sola conexión compartida por toda la aplicación.
// La URL y la clave pública vienen del archivo .env (nunca se escriben aquí).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const clavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !clavePublica) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example como .env y llena los valores.',
  )
}

// "Recordarme" (pantalla 01 del prototipo, pensado en Jorge):
// - marcado: la sesión se guarda en localStorage y sigue abierta aunque se cierre el navegador;
// - sin marcar: se guarda en sessionStorage y se borra al cerrar la pestaña (computadores compartidos).
const CLAVE_RECORDAR = 'mi-cita-recordarme'

function almacen(nombre) {
  try {
    return window[nombre]
  } catch {
    return null // navegador sin almacenamiento disponible (por ejemplo, ciertos modos privados)
  }
}

export function guardarPreferenciaRecordar(recordar) {
  try {
    localStorage.setItem(CLAVE_RECORDAR, recordar ? 'si' : 'no')
  } catch {
    // sin almacenamiento: se usa el comportamiento por defecto
  }
}

function recordar() {
  try {
    return localStorage.getItem(CLAVE_RECORDAR) !== 'no'
  } catch {
    return false
  }
}

const almacenSesion = {
  getItem: (clave) => almacen('localStorage')?.getItem(clave) ?? almacen('sessionStorage')?.getItem(clave) ?? null,
  setItem: (clave, valor) => {
    const destino = recordar() ? 'localStorage' : 'sessionStorage'
    const otro = destino === 'localStorage' ? 'sessionStorage' : 'localStorage'
    almacen(destino)?.setItem(clave, valor)
    almacen(otro)?.removeItem(clave)
  },
  removeItem: (clave) => {
    almacen('localStorage')?.removeItem(clave)
    almacen('sessionStorage')?.removeItem(clave)
  },
}

export const supabase = createClient(url, clavePublica, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: almacenSesion,
  },
})
