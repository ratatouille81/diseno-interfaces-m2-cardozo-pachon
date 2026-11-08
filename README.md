# Mi Cita

Aplicación web para agendar citas médicas en una EPS en pocos pasos y saber con certeza que la cita quedó confirmada. Continúa el prototipo diseñado en el módulo 1 de Diseño de Interfaces de Usuario (Fundación Universitaria Konrad Lorenz).

Mi Cita es un proyecto académico genérico: no corresponde a ninguna EPS real.

> Proyecto en construcción. Este README se completa a medida que avanzan las funcionalidades.

## Cuenta de prueba

Para revisar la demo sin registrarse:

- Correo: `demo@example.com`
- Contraseña: `MiCitaDemo2026`

Es una cuenta de demostración y no contiene datos reales. También puedes crear tu propia cuenta: el registro no pide confirmar el correo, para que la demo funcione sin configuración adicional.

## Integrantes

- Omar Eduardo Cardozo Pachón (trabajo individual)

## Tecnologías

- React 19 con Vite 8
- Bootstrap 5.3

- Supabase JS 2 (autenticación y base de datos)
- API REST Nager.Date v3 (festivos)

- API de Gemini, modelo gemini-3.5-flash-lite (asistente)

(Se completa con Vercel al publicar.)

## Instalación y ejecución en local

Requisitos: Node.js 20 o superior y npm.

```bash
git clone <URL del repositorio>
cd mi-cita-m2
npm install
cp .env.example .env   # y llena los valores
npm run dev
```

## Arquitectura

![Diagrama de arquitectura técnica de Mi Cita](docs/arquitectura.png)

Fondo azul: frontend. Fondo verde: servicios cloud. Fondo amarillo: API externas. Detalle de cada capa en la [planificación](docs/planificacion.md#4-arquitectura-técnica).

## API REST externa: festivos de Colombia

- API: [Nager.Date](https://date.nager.at), endpoint `GET https://date.nager.at/api/v3/PublicHolidays/{año}/CO`.
- Para qué se usa: en el paso 3 del agendamiento, la app bloquea los días festivos de Colombia y muestra el nombre del festivo, para no ofrecer citas en días sin atención. Los festivos colombianos se trasladan a lunes y cambian cada año, por eso se consultan en vez de escribirlos en el código.
- Autenticación: ninguna. Es una API pública y gratuita; no requiere clave.
- Estados en la interfaz: mientras carga muestra "Consultando los festivos de Colombia…"; si la API falla, avisa y deja seguir agendando; si responde, bloquea los festivos. La respuesta se guarda en memoria para no repetir la petición.
- Código: [`src/lib/festivos.js`](src/lib/festivos.js).

## Funcionalidad inteligente: asistente para preparar la cita

- Qué hace: responde dudas del paciente sobre cómo prepararse (documentos, llegada, ayuno en términos generales) y cómo usar Mi Cita. No diagnostica, no interpreta síntomas ni recomienda medicamentos; ante señales de urgencia indica ir a urgencias o llamar al 123.
- Modelo: API de Gemini (Google), modelo `gemini-3.5-flash-lite` (configurable con la variable `GEMINI_MODEL`), nivel gratuito.
- Seguridad de la clave: la llamada a Gemini la hace la función serverless [`api/asistente.js`](api/asistente.js), que corre en Vercel. La clave `GEMINI_API_KEY` solo existe como variable de entorno del servidor (sin prefijo `VITE_`), así que nunca llega al navegador. Se verificó que no aparece en el código compilado (`dist/`).
- Protección del cupo: la función solo responde a usuarios con sesión activa; valida el token con Supabase y rechaza con 401 a quien no lo tenga. También limita la pregunta a 500 caracteres y la conversación a los últimos 6 mensajes.
- Respuesta en tiempo real: la función reenvía el streaming de Gemini y la interfaz muestra el texto a medida que llega.
- Transparencia: aviso visible de que es una inteligencia artificial, de sus límites y de que no se deben escribir datos personales ni de salud. Los errores (sin conexión, límite de consultas, servicio no disponible) se muestran con mensajes claros y la pregunta no se pierde.

## Base de datos y seguridad

La base de datos está en Supabase (PostgreSQL). El esquema y los datos de ejemplo están versionados en [`supabase/migrations/`](supabase/migrations/).

- Todas las tablas tienen RLS (seguridad por fila) activada. Los catálogos (especialidades, sedes y agenda) solo se pueden leer, y solo con sesión iniciada. Cada usuario ve, crea y cancela únicamente sus propias citas.
- Cancelar una cita cambia su estado a "Cancelada"; no la borra, para conservar el historial.
- Un índice único impide que dos usuarios confirmen el mismo espacio de agenda.
- La función `horarios_disponibles` es `SECURITY DEFINER` a propósito: necesita saber qué espacios están ocupados por citas de otros usuarios, que RLS no deja ver. Solo devuelve el id y la hora del espacio libre, nunca datos de otras personas, y no la pueden ejecutar visitantes sin sesión. El asesor de seguridad de Supabase la reporta como advertencia; se revisó y se mantiene por esta razón.

## Documentación

- Planificación del proyecto: [docs/planificacion.md](docs/planificacion.md)

## Pendiente

Enlace a la demo, funcionalidades implementadas, pruebas, créditos de API y servicios, y declaración de uso de inteligencia artificial.
