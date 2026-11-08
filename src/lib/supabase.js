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

export const supabase = createClient(url, clavePublica, {
  auth: {
    persistSession: true, // la sesión queda guardada: el paciente no escribe la contraseña cada vez
    autoRefreshToken: true,
  },
})
