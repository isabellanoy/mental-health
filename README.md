# Apoyo psicológico primario

Monorepo con dos proyectos:

- `frontend/`: React + Vite + TypeScript + Tailwind CSS + React Router + Framer Motion.
- `backend/`: NestJS + TypeScript, preparado para desplegarse en Vercel (serverless).

## Requisitos

Node.js 20+ y npm.

## Backend (`/backend`)

NestJS 12 (ESM) + Prisma 7 sobre Supabase Postgres + Supabase Storage. Se despliega en Vercel como función serverless.

### 1. Crear las tablas en Supabase

1. Abre tu proyecto en Supabase → **SQL Editor** → *New query*.
2. Pega el contenido de [`backend/sql/schema.sql`](backend/sql/schema.sql) y pulsa **Run**. Es idempotente (puedes ejecutarlo varias veces).

Crea las tablas `submissions`, `roulette_images`, `allies`, `volunteers` y `admins` con RLS activado y **sin políticas públicas** (solo el backend accede), y los buckets públicos de lectura `roulette` y `allies` en Storage.

### 2. Variables de entorno

```bash
cd backend
cp .env.example .env   # completa los valores
```

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto local (por defecto 3000). |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma (ej. `http://localhost:5173`). |
| `DATABASE_URL` | Cadena del **Transaction pooler** de Supabase (puerto 6543). Puedes añadir `?pgbouncer=true&connection_limit=1`. |
| `SUPABASE_URL` | URL del proyecto (`https://<ref>.supabase.co`). |
| `SUPABASE_SERVICE_KEY` | Clave secreta (service role). Solo en el backend. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Superadmin inicial. Se crea en la tabla `admins` (contraseña con bcrypt) en su primer login; después manda la tabla y puedes cambiar la contraseña desde el panel. |
| `JWT_SECRET` | Mínimo 32 caracteres aleatorios. |

Si falta alguna variable obligatoria, el backend no arranca y lo indica con un mensaje claro.

### 3. Arrancar

```bash
npm install            # también genera el cliente de Prisma (postinstall)
npm run start:dev      # http://localhost:3000/api
```

Comandos útiles: `npm run build`, `npm run lint`, `npm test` (unitarias), `npm run test:e2e` (API completa con Prisma y Supabase simulados), `npm run prisma:generate`.

### Endpoints

Todas las rutas llevan el prefijo `/api`.

| Método y ruta | Acceso | Descripción |
| --- | --- | --- |
| `GET /api` | público | Comprobación de salud. |
| `POST /api/submissions` | público (5/min por IP) | Guarda un envío del formulario. Recalcula `priority` en el servidor. Honeypot: si `website` viene relleno responde 201 sin guardar. |
| `POST /api/volunteers` | público (5/min por IP) | Guarda una solicitud de voluntariado. Valida con class-validator, exige `consent: true`, limpia los textos y aplica honeypot (`website` relleno → 201 sin guardar). |
| `GET /api/roulette-images` | público | `[{ id, imageUrl }]` de imágenes activas. |
| `GET /api/allies` | público | `[{ id, name, logoUrl, websiteUrl }]` de aliados activos, por `position`. |
| `POST /api/admin/login` | público (5/min por IP) | `{ email, password }` → `{ accessToken, tokenType, expiresIn, admin }` (JWT de 8 h con `sub`, `email` y `role`). Valida contra la tabla `admins`; cuenta inactiva → 403. |
| `GET /api/admin/me` | admin | Datos del usuario autenticado. |
| `PATCH /api/admin/me/password` | admin (5/min por IP) | `{ currentPassword, newPassword }` (mín. 10 caracteres) → 204. |
| `GET/POST /api/admin/admins` | superadmin | Lista y creación (`{ name, email, password, role }`). Nunca devuelven `password_hash`. |
| `PATCH/DELETE /api/admin/admins/:id` | superadmin | PATCH `{ name?, role?, active?, password? }`. No puedes eliminarte, desactivarte ni cambiarte el rol a ti mismo, y siempre debe quedar un superadmin activo. |
| `GET /api/admin/stats` | admin | `{ total, nuevos, prioridadAlta, voluntariosTotal, voluntariosNuevos, enviosPorDia[14] }` (días en UTC). |
| `GET /api/admin/submissions` | admin | Paginación `page`, `pageSize` (máx. 100) y filtros `status`, `priority`; orden por fecha desc. |
| `GET /api/admin/submissions/export` | admin | CSV (UTF-8 con BOM). Filtros opcionales y `delimiter=;` para Excel en español. |
| `PATCH /api/admin/submissions/:id` | admin | `{ status?, notes? }` (`nuevo` \| `contactado` \| `cerrado`). |
| `DELETE /api/admin/submissions/:id` | admin | Elimina el envío (204). |
| `GET /api/admin/volunteers` | admin | Paginación `page`, `pageSize` (máx. 100), filtro `status` y búsqueda `search` por nombre, apellido o correo; orden por fecha desc. |
| `GET /api/admin/volunteers/export` | admin | CSV (UTF-8 con BOM, con la misma protección contra fórmulas). Filtros opcionales y `delimiter=;`. |
| `PATCH /api/admin/volunteers/:id` | admin | `{ status?, notes? }` (`nuevo` \| `contactado` \| `activo` \| `descartado`). |
| `DELETE /api/admin/volunteers/:id` | admin | Elimina al voluntario (204). |
| `GET/POST/PATCH/DELETE /api/admin/roulette-images` | admin | POST multipart con `files` (varios; jpg, png, webp; máx. 5 MB c/u). PATCH `{ active }`. DELETE borra también el archivo de Storage. |
| `GET/POST/PATCH/DELETE /api/admin/allies` | admin | POST multipart: `logo` (png, jpg, webp, svg; máx. 2 MB) + `name` + `website_url` (http/https) + `position`/`active` opcionales. PATCH acepta JSON o multipart (para cambiar el logo). |

`POST /api/submissions` acepta los mismos campos que envía el frontend (`name`, `age`, `mood`, `emotions`, `duration`, `impact`, `sleep`, `appetite`, `selfHarm` = `no` \| `a_veces` \| `con_frecuencia`, `email`, `phone`, `bestTime`, `consent`; `priority` se ignora). `POST /api/volunteers` recibe `firstName`, `lastName`, `career`, `semester?`, `email`, `phone`, `helpAreas` (lista con `atencion_psicologica`, `escucha_acompanamiento`, `difusion_redes`, `eventos`, `logistica_admin`, `diseno_comunicacion`, `tecnologia`, `donaciones`, `otra`), `availability` (`pocas_horas` \| `semanal` \| `medio_tiempo` \| `tiempo_completo`), `message?` (máx. 500) y `consent`. Las respuestas de la API admin usan camelCase (`createdAt`, `imageUrl`, `storagePath`, `websiteUrl`, `selfHarmThoughts`…). Los errores llegan siempre en español: `{ statusCode, error, message }`.

### Probar con curl

```bash
API=http://localhost:3000/api

# Salud y envío del formulario
curl $API
curl -X POST $API/submissions -H 'Content-Type: application/json' -d '{
  "name":"Ana","age":27,"mood":3,"emotions":["ansiedad"],"duration":"algunas_semanas",
  "impact":5,"sleep":"regular","appetite":"mal","selfHarm":"a_veces",
  "email":"ana@correo.com","phone":"","bestTime":"tarde","consent":true}'

# Voluntarios (público)
curl -X POST $API/volunteers -H 'Content-Type: application/json' -d '{
  "firstName":"Lucía","lastName":"Pérez","career":"Psicología","semester":"6.º semestre",
  "email":"lucia@correo.com","phone":"+58 412 000 0000",
  "helpAreas":["escucha_acompanamiento","difusion_redes"],"availability":"semanal",
  "message":"Me encantaría ayudar","consent":true}'

# Contenido público
curl $API/roulette-images
curl $API/allies

# Login (guarda el token)
TOKEN=$(curl -s -X POST $API/admin/login -H 'Content-Type: application/json' \
  -d '{"email":"TU_ADMIN_EMAIL","password":"TU_ADMIN_PASSWORD"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).accessToken")
AUTH="Authorization: Bearer $TOKEN"

# Mi cuenta y administradores (los de gestión exigen rol superadmin; con rol admin responden 403)
curl -H "$AUTH" $API/admin/me
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"actual-123456","newPassword":"nueva-contrasena-segura"}' $API/admin/me/password
curl -H "$AUTH" $API/admin/admins
curl -X POST -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"Beto","email":"beto@correo.com","password":"una-contrasena-larga","role":"admin"}' $API/admin/admins
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' -d '{"active":false}' $API/admin/admins/<ID>
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' -d '{"password":"otra-contrasena-larga"}' $API/admin/admins/<ID>
curl -X DELETE -H "$AUTH" $API/admin/admins/<ID>

# Solicitudes
curl -H "$AUTH" "$API/admin/stats"
curl -H "$AUTH" "$API/admin/submissions?page=1&pageSize=20&status=nuevo&priority=alta"
curl -H "$AUTH" -o solicitudes.csv "$API/admin/submissions/export?delimiter=;"
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"status":"contactado","notes":"Se llamó el lunes"}' "$API/admin/submissions/<ID>"
curl -X DELETE -H "$AUTH" "$API/admin/submissions/<ID>"

# Voluntarios
curl -H "$AUTH" "$API/admin/volunteers?page=1&pageSize=20&status=nuevo&search=lucia"
curl -H "$AUTH" -o voluntarios.csv "$API/admin/volunteers/export?delimiter=;"
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"status":"contactado","notes":"Se le escribió por WhatsApp"}' "$API/admin/volunteers/<ID>"
curl -X DELETE -H "$AUTH" "$API/admin/volunteers/<ID>"

# Ruleta (puedes repetir -F files=@... para subir varias a la vez)
curl -H "$AUTH" $API/admin/roulette-images
curl -X POST -H "$AUTH" -F "files=@frase1.png" $API/admin/roulette-images
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' -d '{"active":false}' $API/admin/roulette-images/<ID>
curl -X DELETE -H "$AUTH" $API/admin/roulette-images/<ID>

# Aliados
curl -H "$AUTH" $API/admin/allies
curl -X POST -H "$AUTH" -F "name=Fundación Luz" -F "website_url=https://luz.org" -F "logo=@logo.png" $API/admin/allies
curl -X PATCH -H "$AUTH" -H 'Content-Type: application/json' -d '{"position":0,"active":true}' $API/admin/allies/<ID>
curl -X PATCH -H "$AUTH" -F "logo=@nuevo-logo.png" $API/admin/allies/<ID>
curl -X DELETE -H "$AUTH" $API/admin/allies/<ID>
```

### Despliegue en Vercel y limitaciones

Importa la carpeta `backend` como proyecto en Vercel y define las variables de `.env.example`. El punto de entrada serverless es `api/index.ts` (arranca Nest una vez por instancia y reutiliza la app) y `vercel.json` redirige todas las rutas hacia él. `postinstall` genera el cliente de Prisma durante la instalación.

- **Límite de tamaño de body en Vercel (~4,5 MB):** las funciones serverless rechazan peticiones más grandes, aunque el backend acepte hasta 5 MB por imagen. Sube las imágenes **de una en una** o comprimidas (menos de ~4 MB en total por petición).
- **Límite de peticiones en memoria:** `@nestjs/throttler` guarda los contadores en la memoria de cada instancia, así que en serverless es un freno de mejor esfuerzo (no un contador global exacto).
- **Conexión a la base de datos:** una conexión por instancia, con SSL sin verificar el certificado del pooler de Supabase (`rejectUnauthorized: false`).
- **CSV:** las celdas que empiezan con `=`, `+`, `-` o `@` se prefijan con `'` para evitar inyección de fórmulas en Excel (por eso un teléfono como `+58…` aparece con `'` delante).
- No probado aún en un despliegue real en Vercel: se verificó el handler serverless en local contra Postgres.

## Frontend (`/frontend`)

```bash
cd frontend
cp .env.example .env   # VITE_API_URL apunta al backend
npm install
npm run dev            # http://localhost:5173
```

Otros comandos: `npm run build`, `npm run preview`.

Rutas públicas: `/`, `/ruleta`, `/formulario`, `/voluntarios` y `/gracias`. Panel (carga aparte, con `noindex`): `/admin/login`, `/admin` (Resumen), `/admin/solicitudes`, `/admin/voluntarios`, `/admin/ruleta`, `/admin/aliados`, `/admin/administradores` (solo superadmin) y `/admin/cuenta`.

`/gracias` solo se puede ver tras enviar el formulario con éxito (marca en `sessionStorage`); si se entra directo, redirige a `/`. Los aliados se leen de `GET {VITE_API_URL}/allies` (`[{ id, name, logoUrl, websiteUrl }]`; se descartan los que no tengan un `websiteUrl` http/https).

### Panel de administración (`/admin`)

Entra en `/admin/login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` (el primer login crea al superadmin en la tabla `admins`). El token se guarda en `sessionStorage` y la sesión se cierra sola ante un 401 o al vencer el token (8 h). El rol y el estado se comprueban en el servidor en cada petición: desactivar o degradar a alguien surte efecto al instante. Subidas de ruleta: JPG/PNG/WebP de máx. 5 MB, de a una; si el backend está en Vercel conviene que pesen menos de 4 MB.

### Ruleta (`/ruleta`)

El modal del mensaje ofrece tres acciones: **Necesito más ayuda** (cierra el modal, baja con scroll suave —sin animación si el usuario prefiere menos movimiento— hasta el bloque del formulario de ayuda y lo resalta un instante), **Girar de nuevo** y **Ayúdanos a salvar vidas** (va a `/voluntarios`). El bloque "Sabemos que hay días…" y su botón "Llenar formulario" están siempre visibles. El componente `VolunteerCTA` (variantes `card` y `compact`) y `SiteFooter` llevan a `/voluntarios` desde inicio, ruleta, gracias y el pie de página.

### Voluntarios (`/voluntarios`)

Formulario de 3 pasos (react-hook-form + zod, borrador en `sessionStorage` con la clave `mh-volunteer-draft-v1`, honeypot y bloqueo de doble envío). Al terminar hace `POST {VITE_API_URL}/volunteers` (`createVolunteer` en `services/api.ts`); si falla muestra un mensaje amable y el botón "Reintentar", y si funciona muestra una pantalla de agradecimiento propia.

### Formulario (`/formulario`)

Formulario conversacional de 9 pasos (react-hook-form + zod). El progreso se guarda en `sessionStorage` y se borra al enviar. Al terminar hace `POST {VITE_API_URL}/submissions` con este JSON:

```json
{
  "name": "Ana", "age": 27, "mood": 3,
  "emotions": ["ansiedad"], "duration": "algunas_semanas", "impact": 5,
  "sleep": "regular", "appetite": "mal", "selfHarm": "a_veces",
  "email": "ana@correo.com", "phone": "", "bestTime": "tarde",
  "consent": true, "priority": "alta"
}
```

`priority` es `"alta"` si `selfHarm` es `"a_veces"` o `"con_frecuencia"`, y `"normal"` en otro caso. Los textos de ayuda urgente se editan en `frontend/src/constants/urgentHelp.ts` (reemplaza los placeholders por líneas de ayuda locales).
