import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { Readable } from 'node:stream'
import fs from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'

// Solo para desarrollo local: ejecuta las funciones de la carpeta /api igual que Vercel,
// para probar el asistente sin publicar. En Vercel este plugin no se usa.
function funcionesLocales() {
  return {
    name: 'funciones-locales',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/asistente', async (req, res) => {
        try {
          const modulo = await server.ssrLoadModule('/api/asistente.js')
          const manejador = modulo[req.method]
          if (!manejador) {
            res.statusCode = 405
            res.end()
            return
          }
          const solicitud = new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: req.headers,
            body: req.method === 'GET' ? undefined : Readable.toWeb(req),
            duplex: 'half',
          })
          const respuesta = await manejador(solicitud)
          res.statusCode = respuesta.status
          respuesta.headers.forEach((valor, nombre) => res.setHeader(nombre, valor))
          if (respuesta.body) Readable.fromWeb(respuesta.body).pipe(res)
          else res.end()
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

export default defineConfig(({ command }) => {
  // Solo en el servidor local: copia todas las variables del .env (también las que no empiezan por VITE_)
  // a process.env, para que la función del asistente las lea igual que en Vercel.
  // Se asignan una por una para que un cambio en el .env reemplace el valor anterior en memoria.
  // Vite nunca mete en el código del navegador las variables sin el prefijo VITE_.
  if (command === 'serve') {
    const archivo = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(archivo)) {
      for (const [nombre, valor] of Object.entries(parseEnv(fs.readFileSync(archivo, 'utf8')))) {
        process.env[nombre] = valor
      }
    }
  }
  return {
    plugins: [react(), funcionesLocales()],
  }
})
