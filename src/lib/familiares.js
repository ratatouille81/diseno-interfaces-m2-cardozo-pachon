// Grupo familiar: consulta y texto descriptivo de cada familiar ("Hijo, 3 años").
import { supabase } from './supabase'

export const PARENTESCOS = ['Hijo', 'Hija', 'Padre', 'Madre', 'Pareja', 'Hermano', 'Hermana', 'Otro']

export function listarFamiliares() {
  return supabase.from('familiares').select('id, nombre, parentesco, fecha_nacimiento').order('nombre')
}

// Edad en años cumplidos a partir de la fecha de nacimiento (AAAA-MM-DD)
function edad(fechaNacimiento) {
  const [a, m, d] = fechaNacimiento.split('-').map(Number)
  const hoy = new Date()
  let anios = hoy.getFullYear() - a
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) anios -= 1
  return anios
}

export function descripcionFamiliar(familiar) {
  if (!familiar.fecha_nacimiento) return familiar.parentesco
  const anios = edad(familiar.fecha_nacimiento)
  const textoEdad = anios < 1 ? 'menos de 1 año' : anios === 1 ? '1 año' : `${anios} años`
  return `${familiar.parentesco}, ${textoEdad}`
}
