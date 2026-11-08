# Mi Cita

Aplicación web para agendar citas médicas en una EPS en pocos pasos y saber con certeza que la cita quedó confirmada. Continúa el problema y el prototipo del módulo 1 de Diseño de Interfaces de Usuario (Fundación Universitaria Konrad Lorenz, Tecnología en Desarrollo de Software).

Problema (módulo 1): "Un afiliado a una EPS que necesita atención médica necesita agendar su cita desde el celular en pocos pasos y saber con certeza que quedó confirmada, porque las aplicaciones actuales lo devuelven al menú, lo remiten a una línea telefónica o no le muestran el estado de su solicitud." El análisis de 600 reseñas de aplicaciones de EPS que sustenta este problema está en la [planificación](docs/planificacion.md).

Mi Cita es un proyecto académico genérico: no corresponde a ninguna EPS real. Sedes, especialidades y horarios son datos inventados.

## Demo en línea

https://diseno-interfaces-m2-cardozo-pachon.vercel.app

Cuenta de prueba (no contiene datos reales):

- Correo: `demo@example.com`
- Contraseña: `MiCitaDemo2026`

También puedes crear tu propia cuenta: el registro no pide confirmar el correo, para que la demo funcione sin configuración adicional.

## Integrantes

- Omar Eduardo Cardozo Pachón. Trabajo individual: el historial de Git tiene un solo autor porque el proyecto se desarrolló sin equipo.

## Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React con Vite | React 19.3.1, Vite 8.3.6 |
| Estilos | Bootstrap | 5.3.8 |
| Servicio cloud | Supabase (Auth y PostgreSQL), cliente `@supabase/supabase-js` | 2.119.0 |
| API REST externa | Nager.Date | API v3 |
| Inteligencia artificial | API de Gemini, modelo `gemini-3.5-flash-lite` | v1beta |
| Función serverless y despliegue | Vercel Functions (Node.js) y Vercel Hosting, plan Hobby | |
| Control de versiones | Git y GitHub con Gitflow | |

## Funcionalidades implementadas

1. Registro, ingreso y cierre de sesión con Supabase Auth; la sesión se mantiene al recargar.
2. Agendar una cita en cuatro pasos (para quién, especialidad, sede con día y hora, revisión), con indicador de paso, botón Atrás y enlaces "Cambiar"; solo se ofrecen horas con cupo.
3. Mis citas: próximas e historial, estado escrito además del color y cancelación con ventana de confirmación.
4. Bloqueo de festivos de Colombia con la API REST Nager.Date.
5. Asistente con IA para preparar la cita, con respuesta en tiempo real.
6. Retroalimentación en cada pantalla: indicadores de carga, mensajes de éxito y mensajes de error que explican qué pasó y qué hacer.
7. Interfaz responsiva y accesible: HTML semántico, etiquetas en todos los campos, foco visible, contraste AA con la paleta del módulo 1 y áreas táctiles de al menos 48 px.

Componentes reutilizables que exige la guía: navegación (`Encabezado`), formulario con validación (`Ingreso`, `AgendarCita`), listado de datos (`MisCitas`) y retroalimentación (`Alerta`, `Cargando`, `DialogoConfirmacion`, `EstadoCita`).

## Arquitectura

![Diagrama de arquitectura técnica de Mi Cita](docs/arquitectura.png)

Fondo azul: frontend. Fondo verde: servicios cloud. Fondo amarillo: API externas. El detalle de cada capa, con la justificación de cada tecnología, está en la [planificación](docs/planificacion.md#4-arquitectura-técnica).

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

## Instalación y ejecución en local

Requisitos: Node.js 20 o superior y npm.

```bash
git clone https://github.com/ratatouille81/diseno-interfaces-m2-cardozo-pachon.git
cd diseno-interfaces-m2-cardozo-pachon
npm install
cp .env.example .env   # y llena los valores
npm run dev
```

La base de datos se crea aplicando en Supabase los archivos de [`supabase/migrations/`](supabase/migrations/), en orden. El servidor local de Vite también ejecuta la función `api/asistente.js`, así que el asistente se puede probar sin publicar.

## Gestión del proyecto

- Gitflow: `main` (versión entregada), `develop` (integración) y una rama `feature/...` por funcionalidad, unida a `develop` con un pull request que describe el cambio y lo que se probó.
- Ramas: `feature/diagrama-arquitectura`, `feature/base-de-datos`, `feature/autenticacion`, `feature/agendar-cita`, `feature/mis-citas`, `feature/festivos-api`, `feature/asistente-ia`, `feature/despliegue` y `feature/documentacion`.
- Mensajes de commit con prefijos `feat:`, `docs:` y `chore:`.
- Versión final marcada con el tag `v1.0.0`.

## Pruebas

Pruebas manuales sobre la demo y el entorno local. Las capturas están en [`docs/capturas/`](docs/capturas/).

| Qué se probó | Dónde | Resultado | Evidencia |
|---|---|---|---|
| Formulario de ingreso vacío | Chrome, simulación de celular 390 x 844 | Cada campo indica qué falta | [captura](docs/capturas/ingreso_movil.png) |
| Ingreso con datos que no existen | Chrome, 945 px | Mensaje "El correo o la contraseña no coinciden" | [captura](docs/capturas/ingreso_error_credenciales.png) |
| Avanzar sin elegir especialidad | Chrome, 390 x 844 | Aviso junto al botón Continuar | [captura](docs/capturas/agendar_paso2_error.png) |
| Horas disponibles de un día hábil | Chrome, 390 x 844 | 20 horas de 7:00 a. m. a 4:30 p. m. | [captura](docs/capturas/agendar_paso3_horas.png) |
| Día festivo (16 de noviembre de 2026) | Chrome, 390 x 844 | Aviso "Ese día es festivo (Independencia de Cartagena)" | [captura](docs/capturas/festivo_aviso.png) |
| API de festivos caída (conexión bloqueada a propósito) | Chrome, 390 x 844 | Aviso y se puede seguir agendando | Prueba automatizada |
| Revisión y confirmación de la cita | Chrome, 390 x 844 | Cita guardada en Supabase con su número | [revisión](docs/capturas/agendar_paso4_revision.png), [confirmada](docs/capturas/agendar_confirmada.png) |
| Dos citas en el mismo espacio | Base de datos | La segunda se rechaza por el índice único | Consulta SQL |
| Mis citas y cancelación | Chrome, 390 x 844 | Confirmación previa; la cita pasa a Cancelada y la hora se libera | [lista](docs/capturas/mis_citas.png), [ventana](docs/capturas/mis_citas_dialogo.png), [cancelada](docs/capturas/mis_citas_cancelada.png) |
| Catálogos sin sesión (RLS) | Petición directa a Supabase | Devuelve 0 filas | Prueba automatizada |
| Asistente: pregunta frecuente | Demo en Vercel, Chrome | Respuesta en partes en 1,8 s | [captura](docs/capturas/vercel_asistente.png) |
| Asistente: síntomas de urgencia | Local | No sugiere especialidad; remite a urgencias y al 123 | Prueba automatizada |
| Asistente sin sesión | Local | Responde 401 y no llama a Gemini | Prueba automatizada |
| Flujo completo en la demo publicada | Demo en Vercel, Chrome | Ingreso, festivo, agendar, cancelar y asistente funcionan | Prueba automatizada |
| Flujo completo en Firefox | Demo en Vercel, Firefox | [PENDIENTE: prueba de Omar] | |
| Flujo completo en celular real | Demo en Vercel, [PENDIENTE: modelo del celular] | [PENDIENTE: prueba de Omar] | |

Errores encontrados y corregidos durante las pruebas: avisos de error que quedaban fuera de la vista en el celular (se movieron junto al botón), avisos que no se borraban al corregir, colores de Bootstrap distintos a la paleta del módulo 1, la hora partida en dos líneas, la ventana de confirmación pegada arriba y respuestas del asistente con símbolos de Markdown.

## Uso de inteligencia artificial

[PENDIENTE: declaración de Omar]

## Créditos de API y servicios externos

- [Supabase](https://supabase.com): autenticación y base de datos PostgreSQL.
- [Nager.Date](https://date.nager.at): API pública de días festivos.
- [Gemini API de Google](https://ai.google.dev): modelo de lenguaje del asistente.
- [Vercel](https://vercel.com): hosting y funciones serverless.
- [Bootstrap](https://getbootstrap.com): componentes y cuadrícula responsiva.
- [React](https://react.dev) y [Vite](https://vite.dev): construcción de la interfaz.
- [FigJam](https://www.figma.com/figjam/): diagrama de arquitectura.

## Documentación adicional

- [Planificación del proyecto](docs/planificacion.md)
