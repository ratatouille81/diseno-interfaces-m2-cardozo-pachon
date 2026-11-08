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
| Estilos | Bootstrap y tipografía Inter (la del prototipo) | Bootstrap 5.3.8 |
| Servicio cloud | Supabase (Auth y PostgreSQL), cliente `@supabase/supabase-js` | 2.119.0 |
| API REST externa | Nager.Date | API v3 |
| Inteligencia artificial | API de Gemini, modelo `gemini-3.5-flash-lite` | v1beta |
| Función serverless y despliegue | Vercel Functions (Node.js) y Vercel Hosting, plan Hobby | |
| Control de versiones | Git y GitHub con Gitflow | |

## Funcionalidades implementadas

1. Registro, ingreso y cierre de sesión con Supabase Auth, con opción "Recordarme" y recuperación de contraseña por correo.
2. Inicio con la próxima cita, botón para agendar y accesos rápidos, incluido "Repetir última cita".
3. Agendar una cita en cuatro pasos: para quién (titular, un familiar del grupo u otra persona), especialidad con buscador, sede con día y hora, y revisión con enlaces "Cambiar". Solo se ofrecen horas con cupo.
4. Alternativas cuando no hay cupo o el horario no sirve: otras sedes con cupo el mismo día y el siguiente día hábil con cupo.
5. Mis citas: próximas e historial, estado escrito además del color, reprogramar y cancelar con ventana de confirmación.
6. Grupo familiar en Perfil: agregar y quitar familiares para agendarles citas eligiéndolos de una lista.
7. Bloqueo de festivos de Colombia con la API REST Nager.Date.
8. Asistente con IA para preparar la cita, con respuesta en tiempo real.
9. Letra más grande en toda la aplicación, desde Inicio o Perfil, que se recuerda en el dispositivo.
10. Retroalimentación en cada pantalla: indicadores de carga, mensajes de éxito y mensajes de error que explican qué pasó y qué hacer.
11. Interfaz responsiva y accesible: HTML semántico, etiquetas en todos los campos, foco visible, contraste AA, áreas táctiles de al menos 44 px y nombres accesibles que incluyen el texto visible.

Componentes reutilizables que exige la guía: navegación (`BarraInferior`, `Encabezado`), formulario con validación (`Ingreso`, `AgendarCita`, `GrupoFamiliar`, `NuevaContrasena`), listado de datos (`MisCitas`, `GrupoFamiliar`) y retroalimentación (`Alerta`, `Cargando`, `DialogoConfirmacion`, `EstadoCita`). Otros componentes compartidos: `TarjetaOpcion`, `TarjetaAcceso` e `Iconos`.

## Continuidad con el prototipo del módulo 1

La interfaz implementa el prototipo de alta fidelidad del módulo 1 (Figma): sus variables de color, la tipografía Inter, los componentes (encabezado, barra inferior, tarjeta de opción, pastilla de selección, etiqueta de estado, botones de 52 px) y sus pantallas.

| Pantalla del prototipo | En la aplicación |
|---|---|
| 01 Ingreso | Marca, campos con "Mostrar", "Recordarme" con aviso de sesión y "¿Olvidaste tu contraseña?" |
| 02 y 02b Inicio | Próxima cita, "Agendar cita", "Repetir última cita" y "Aa Letra más grande" |
| 03 Para quién | Titular y grupo familiar con nombre y parentesco ("Hijo, 3 años") |
| 04 Especialidad | Tarjetas, buscador y ayuda "¿No sabes cuál elegir?" |
| 05 Sede, día y hora | Pastillas de día y hora, solo horas con cupo y "No encuentro un horario que me sirva" |
| 06 Sin agenda | Explicación de que no es un error del usuario y alternativas reales con cupo |
| 07 Revisar y confirmar | Resumen con "Cambiar" en cada dato y recordatorio de llegada |
| 08 Cita confirmada | Ícono, número de cita y detalle |
| 09 Mis citas | Tarjetas con estado, Reprogramar y Cancelar |
| 10 Perfil | Tamaño de letra, grupo familiar y cerrar sesión |

Diferencias con el prototipo, decididas por alcance o por la plataforma:

- El ingreso usa correo electrónico y no número de documento, porque así funciona Supabase Auth.
- No se implementó el ingreso con huella: una aplicación web no puede leer la huella de forma confiable en todos los navegadores.
- No se implementaron "Mis autorizaciones" ni el estado "Pendiente de autorización": requieren un sistema de autorizaciones de una EPS, fuera del alcance de la guía.
- No se implementó "Agregar a mi calendario" ni "Datos de contacto" en Perfil.
- Se agregó la sección "Asistente" a la barra inferior, que no existía en el prototipo, para la funcionalidad inteligente que pide este módulo.

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

- Todas las tablas tienen RLS (seguridad por fila) activada. Los catálogos (especialidades, sedes y agenda) solo se pueden leer, y solo con sesión iniciada. Cada usuario ve, crea y cancela únicamente sus propias citas, y ve y administra únicamente su propio grupo familiar.
- Una cita solo puede asociarse a un familiar del mismo usuario: las políticas de crear y cancelar citas lo exigen. Se probó simulando otro usuario: no ve familiares ajenos y la base de datos rechaza la cita.
- Cancelar una cita cambia su estado a "Cancelada"; no la borra, para conservar el historial.
- Un índice único impide que dos usuarios confirmen el mismo espacio de agenda.
- La función `horarios_disponibles` es `SECURITY DEFINER` a propósito: necesita saber qué espacios están ocupados por citas de otros usuarios, que RLS no deja ver. Solo devuelve el id y la hora del espacio libre, nunca datos de otras personas, y no la pueden ejecutar visitantes sin sesión. El asesor de seguridad de Supabase la reporta como advertencia; se revisó y se mantiene por esta razón.

## Limitaciones conocidas

- Recuperación de contraseña: sin un servidor de correo propio, Supabase solo entrega correos a los miembros del equipo del proyecto y como máximo 2 por hora. La función está implementada y se puede probar con el correo del autor; con otros correos Supabase rechaza el envío y la app muestra un mensaje claro. Fuente: [Supabase, Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- Protección contra contraseñas filtradas: el asesor de seguridad de Supabase recomienda activarla; no está activa en este proyecto.
- El nivel gratuito de Gemini tiene un límite diario de consultas que Google puede cambiar; si se agota, el asistente lo informa con un mensaje claro.

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

- Gitflow: `main` (versión entregada), `develop` (integración) y una rama `feature/...` por funcionalidad, unida a `develop` con un pull request que describe el cambio y lo que se probó. Desde la conexión con Vercel, cada pull request se construye y se publica automáticamente como versión de prueba antes de unirse.
- Ramas: `feature/diagrama-arquitectura`, `feature/base-de-datos`, `feature/autenticacion`, `feature/agendar-cita`, `feature/mis-citas`, `feature/festivos-api`, `feature/asistente-ia`, `feature/despliegue`, `feature/ui-prototipo`, `feature/grupo-familiar`, `feature/pantallas-m1` y `feature/documentacion`.
- Mensajes de commit con prefijos `feat:`, `docs:` y `chore:`.
- Versión final marcada con el tag `v1.0.0`.

## Pruebas

Pruebas manuales sobre la demo y el entorno local, más consultas directas a la base de datos. Las capturas están en [`docs/capturas/`](docs/capturas/). Salvo que se indique otra cosa, se tomaron en Chrome simulando un celular de 390 x 844 px.

| Qué se probó | Resultado | Evidencia |
|---|---|---|
| Ingreso con "Recordarme" | Sin marcar, la sesión va a sessionStorage y se borra al cerrar la pestaña; marcado, va a localStorage; al salir se borra de ambos | [captura](docs/capturas/01_ingreso_recordarme.png) |
| Ingreso con datos que no existen | Mensaje "El correo o la contraseña no coinciden" | [captura](docs/capturas/01b_ingreso_error.png) |
| Recuperar contraseña con un correo no autorizado | Supabase rechaza el envío y la app muestra un mensaje claro | [captura](docs/capturas/01c_recuperar.png) |
| Inicio y letra más grande | Toda la interfaz crece y la preferencia se recuerda | [normal](docs/capturas/02_inicio.png), [grande](docs/capturas/02b_inicio_letra_grande.png) |
| Grupo familiar: formulario vacío y alta de un familiar | Pide nombre y parentesco; el familiar aparece como "Hijo, 3 años" | [validación](docs/capturas/10b_familiar_validacion.png), [lista](docs/capturas/10c_grupo_familiar.png) (escritorio, 945 px) |
| Para quién es la cita | Titular, familiar del grupo y otra persona | [captura](docs/capturas/03_para_quien_familia.png) (escritorio, 945 px) |
| Buscador y avanzar sin elegir especialidad | "odonto" encuentra Odontología; aviso junto al botón Continuar | [captura](docs/capturas/04b_especialidad_error.png) |
| Día festivo (16 de noviembre de 2026) | Pastilla tachada y deshabilitada, anunciada como festivo | [captura](docs/capturas/05c_festivo_pastilla.png) |
| API de festivos caída (conexión bloqueada a propósito) | Aviso y se puede seguir agendando | Prueba automatizada |
| "No encuentro un horario que me sirva" | Dos sedes con cupo el mismo día y el martes 17, saltando el festivo | [captura](docs/capturas/06_alternativas.png) |
| Revisión y confirmación | Cita guardada en Supabase con su número | [revisión](docs/capturas/07_revisar.png), [confirmada](docs/capturas/08_confirmada.png) |
| Reprogramar | La cita nueva queda Confirmada y la anterior Cancelada | [lista](docs/capturas/09d_mis_citas_reprogramar.png), [revisión](docs/capturas/07b_revisar_reprogramar.png), [resultado](docs/capturas/08b_reprogramada.png) |
| Mis citas y cancelación | Confirmación previa ("No, mantener la cita" primero); la hora se libera | [lista](docs/capturas/09_mis_citas.png), [ventana](docs/capturas/09b_cancelar.png), [cancelada](docs/capturas/09c_cancelada.png) |
| Dos citas en el mismo espacio | La segunda se rechaza por el índice único | Consulta SQL |
| Catálogos sin sesión y familiares de otro usuario (RLS) | 0 filas; la cita con familiar ajeno se rechaza | Consultas SQL |
| Asistente: pregunta frecuente | Respuesta en partes en menos de 2 s, en texto plano | [captura](docs/capturas/11_asistente.png) |
| Asistente: síntomas de urgencia y llamada sin sesión | Remite a urgencias y al 123; sin sesión responde 401 | Prueba automatizada |
| Ancho de la página en celular | Igual al de la pantalla, sin desplazamiento horizontal | Prueba automatizada |
| Flujo completo en la demo publicada | Ingreso, festivo, agendar, cancelar y asistente funcionan | Prueba automatizada |
| Flujo completo en Firefox | [PENDIENTE: prueba de Omar] | |
| Flujo completo en celular real | [PENDIENTE: prueba de Omar, modelo del celular] | |

Errores encontrados y corregidos durante las pruebas: la fila de días ensanchaba la página a 2.838 px en el celular (ancho mínimo del fieldset y texto oculto con posición absoluta); avisos de error fuera de la vista en el celular; avisos que no se borraban al corregir; colores de Bootstrap distintos a la paleta del módulo 1; la hora partida en dos líneas y con doble punto; respuestas del asistente con símbolos de Markdown; y el servidor local que conservaba en memoria una clave anterior del `.env`.

## Créditos de API y servicios externos

- [Supabase](https://supabase.com): autenticación y base de datos PostgreSQL.
- [Nager.Date](https://date.nager.at): API pública de días festivos.
- [Gemini API de Google](https://ai.google.dev): modelo de lenguaje del asistente.
- [Vercel](https://vercel.com): hosting y funciones serverless.
- [Bootstrap](https://getbootstrap.com): componentes y cuadrícula responsiva.
- [React](https://react.dev) y [Vite](https://vite.dev): construcción de la interfaz.
- [Inter](https://rsms.me/inter/) mediante [Fontsource](https://fontsource.org): tipografía.
- [FigJam](https://www.figma.com/figjam/): diagrama de arquitectura.

## Documentación adicional

- [Planificación del proyecto](docs/planificacion.md)
- Prototipo del módulo 1 en Figma: https://www.figma.com/design/SEBFD8PVexz46HlPNnz3zR
