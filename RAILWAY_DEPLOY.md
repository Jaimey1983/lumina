# Despliegue de `lumina-backend` en Railway

## Historial de fixes

1. `npm` en vez de `pnpm` (Root Directory ocultaba el lockfile raíz) — ver
   "Causa raíz confirmada" abajo.
2. **`start:prod` apuntaba a un archivo que nunca existió.** El build
   pasaba con pnpm, pero el contenedor moría al arrancar:
   `Error: Cannot find module '/app/lumina-backend/dist/main'`.
   `lumina-backend/tsconfig.build.json` no excluye `prisma/*.ts` (los scripts
   de seed), así que `tsc` calcula el `rootDir` implícito como la raíz del
   paquete (no `src/`) y refleja esa estructura en el output:
   `dist/src/main.js` + `dist/prisma/*.js`, no `dist/main.js`. El script
   `start:prod` (`node dist/main`) apuntaba mal desde siempre — nunca se
   había ejecutado antes: el dev local usa `nest start`/`start:dev` (no pasa
   por `dist/`) y el job `backend` de CI solo corre `pnpm build`, nunca
   `start:prod`. Confirmado corriendo el build chain completo en local:
   `dist/main.js` no existe, `dist/src/main.js` sí. Fix: `start:prod` pasa a
   `"node dist/src/main"` en `lumina-backend/package.json` (commit que agrega
   esta línea). Verificado arrancando `node dist/src/main` con env vars
   dummy: el proceso ya no crashea por `MODULE_NOT_FOUND` (cuelga en la
   conexión a Postgres/Redis, que es el comportamiento esperado sin una base
   real — eso no es parte de este fix).
3. **`Cannot find module 'express'` — dependencia fantasma.**
   `src/main.ts:5` hace `import { json, urlencoded } from 'express'`
   directo, pero `express` **no está declarado** en las `dependencies` de
   `lumina-backend/package.json` — solo llega de forma transitiva vía
   `@nestjs/platform-express` (que sí lo trae en su propio `package.json`).
   Localmente esto "funcionaba" solo porque pnpm hoistea paquetes
   transitivos al `node_modules` de la **raíz del workspace**
   (`node_modules/express` en la raíz, no en `lumina-backend/node_modules/`),
   y `require('express')` desde `lumina-backend/dist/src/main.js` resuelve
   subiendo directorios hasta encontrarlo ahí — un patrón de "phantom
   dependency" que no está garantizado y evidentemente no se reprodujo igual
   en el contenedor de Railway. Fix real (no un parche): declarar `express`
   como dependencia directa en `lumina-backend/package.json`, con la misma
   versión ya resuelta en el lockfile (`^5.2.1`, confirmado en
   `pnpm-lock.yaml` — no se cambió ninguna resolución). Verificado con
   `ls -la lumina-backend/node_modules/express` (symlink real al store de
   pnpm, ya no depende de hoisting a la raíz) y arrancando el proceso
   completo: bootea Nest, mapea todas las rutas, y llega a
   `Nest application successfully started` / `🚀 Lumina Backend corriendo en
   puerto ...` — solo queda el `ECONNREFUSED` esperado de Redis (sin
   instancia local en esta verificación).
4. **`POST /auth/register` devuelve 500 — probable falta de migraciones en
   la base de Railway.** Con los 3 fixes anteriores el proceso ya arranca y
   escucha, pero un `curl` real contra `/auth/register` devolvió
   `{"statusCode":500,"message":"Internal server error"}`. **No confirmado
   con el log real** (no hay acceso desde acá a
   `postgres.railway.internal`, solo alcanzable dentro de la red de
   Railway, ni a los Deploy Logs) — pero el pipeline nunca corrió
   `prisma migrate deploy` contra la base de producción: `buildCommand`
   solo hace `prisma generate` (genera el cliente, no toca el schema real),
   y no había ningún `preDeployCommand`. Con un Postgres nuevo del plugin de
   Railway (vacío) y 34 carpetas en `prisma/migrations/` nunca aplicadas,
   la tabla `User` probablemente no existe — cualquier query de Prisma
   explota con un error que Nest devuelve como 500 genérico. Fix: se agregó
   `deploy.preDeployCommand: "pnpm --filter lumina-backend exec prisma
   migrate deploy"` a `railway.json` (corre justo antes de arrancar el
   contenedor, con las variables de entorno reales del deploy — a
   diferencia del build, donde no es tan seguro que `DATABASE_URL` esté
   disponible). `prisma migrate deploy` es idempotente — no rompe nada si
   ya estaban aplicadas.

   **Confirmado con el log real** (Deploy Logs de Railway, no supuesto):
   `[Nest] ERROR [ExceptionsHandler] PrismaClientKnownRequestError: Invalid
   'prisma.user.findUnique()' invocation: The table 'public.users' does not
   exist in the current database.` — coincide exacto con `@@map("users")`
   del modelo `User` en `schema.prisma` (no es un desajuste de nombre, la
   tabla lisa y llanamente no existe).

   **Bug propio, encontrado al verificar el fix anterior:** el commit que
   agregó `preDeployCommand` (el que solo tocaba `railway.json` y este
   archivo) quedó **`SKIPPED — No changes to watched files`** en el historial
   de Deployments de Railway — `watchPatterns` (agregado en el fix 1 para no
   redesplegar en cada cambio ajeno) no incluía `railway.json` a sí mismo,
   así que Railway nunca construyó ni desplegó ese commit. El
   `preDeployCommand` literalmente nunca corrió. Fix: `railway.json` se
   agrega a su propio `watchPatterns`.

   **Segundo bug propio, encontrado tras corregir el anterior:** con el
   watch pattern arreglado, el deploy sí corrió sobre el commit correcto
   (confirmado por timestamp — mismo minuto exacto del push) y llegó a
   `Nest application successfully started`, pero **ningún** rastro de
   `prisma migrate deploy` apareció en Deploy Logs, ni con marcadores
   `echo` explícitos agregados a propósito para diagnosticar. Causa real:
   `deploy.preDeployCommand` en el schema de `railway.json` es un
   **array de strings**, no un string plano — la doc oficial de Railway lo
   muestra como `"preDeployCommand": ["npm run db:migrate"]`. Lo tenía como
   string suelto (`"preDeployCommand": "echo ... && pnpm ..."`), que
   Railway aparentemente descarta en silencio por no matchear el schema (a
   diferencia de `build.buildCommand`, que sí es string plano — por eso ese
   funcionaba desde el principio). Fix: envolver el valor en un array de un
   solo elemento.

   **Tercer intento — se abandonó `preDeployCommand` por completo.** Con el
   array ya correcto, se volvió a desplegar y se confirmó con el timestamp
   exacto de `Starting Container` vs. `Nest application successfully
   started` (**39ms** de diferencia entre ambas líneas en Deploy Logs) que
   no hay ningún paso intermedio corriendo — `preDeployCommand` sigue sin
   ejecutarse, aun con el tipo correcto. No se investigó más a fondo por qué
   (posible limitación específica de esta combinación
   Railpack+monorepo+pnpm, o algo del lado de Railway no documentado) — se
   optó por la vía más robusta: **`prisma migrate deploy` pasa a ser parte
   del `startCommand`**, encadenado antes de `start:prod`
   (`"pnpm --filter lumina-backend exec prisma migrate deploy && pnpm
   --filter lumina-backend start:prod"`). `startCommand` ya está confirmado
   al 100% que se ejecuta (es donde corre `node dist/src/main`, fix 2). Esto
   corre la migración en cada arranque/restart del contenedor, no solo en
   deploys — aceptable porque `prisma migrate deploy` es idempotente y usa
   un lock a nivel de tabla de migraciones (seguro incluso si llegara a
   correr en paralelo con más de 1 réplica, aunque hoy el servicio corre con
   1 réplica). `deploy.preDeployCommand` se **eliminó** de `railway.json`
   (Regla 4 — no se dejan dos caminos a medias).
5. **Redis: `NOAUTH Authentication required` en loop** —
   `session-gamification.service.ts` / `torneo.service.ts` conectan con
   `new Redis({ host: REDIS_HOST, port: REDIS_PORT })`, sin password, pero
   el Redis de Railway sí exige auth (confirmado por el error real en Deploy
   Logs — ya no es la hipótesis de la sección de variables de entorno de
   abajo, es el comportamiento observado). Railway inyecta `REDIS_HOST` /
   `REDIS_PORT` como variables del servicio, pero **no** una de password
   mapeada a lo que el código espera — hay que revisar qué variable expone
   el plugin de Redis para la password (`REDISPASSWORD` u otra) y pasarla al
   constructor de `ioredis` en esos dos archivos. **No se arregló en esta
   sesión** — el `curl` a `/auth/register` no depende de Redis, así que no
   bloquea la creación del usuario de prueba, pero se deja documentado para
   no perderlo: sin este fix, cualquier feature de gamificación/torneo en
   vivo va a fallar en producción.

## Causa raíz confirmada (fix 1 — pnpm vs npm)

El build en Railway fallaba con:

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

**No era un problema de detección de `packageManager`** (la raíz del repo ya
tenía `"packageManager": "pnpm@11.25.0"` en `package.json` antes de este fix).
La causa real es el **Root Directory** del servicio en Railway: estaba
configurado como `lumina-backend`. Railpack (el builder de Railway) trata el
Root Directory como el *contexto de build* — solo sube al remoto los archivos
de esa subcarpeta. Eso significa que, durante el build, Railpack **no veía**:

- `pnpm-lock.yaml` (vive en la raíz del monorepo)
- `pnpm-workspace.yaml` (vive en la raíz)
- el `package.json` raíz con el campo `packageManager`

Sin nada de eso a la vista, Railpack no tiene forma de detectar pnpm y cae a
`npm install` por defecto — que no entiende el protocolo `workspace:*` que usa
`lumina-backend/package.json` para sus dependencias internas
(`@lumina/scoring`, `@lumina/curriculum-data`).

## Qué se cambió en el repo

1. **`railway.json`** (nuevo, en la raíz) — Config as Code de Railway. Define:
   - `build.buildCommand`: la misma cadena de comandos que ya usa
     `.github/workflows/ci.yml` en el job `backend` (probada en CI) —
     construye `@lumina/types` → `@lumina/curriculum-data` → `@lumina/scoring`
     (en ese orden, porque `lumina-backend` los consume desde su `dist/`
     compilado, no desde `src/`), corre `prisma generate`, y por último
     construye `lumina-backend`.
   - `deploy.startCommand`: `pnpm --filter lumina-backend start:prod` (=
     `node dist/main`, ejecutado con el cwd de `lumina-backend`).
   - `watchPatterns`: limita los redeploys automáticos a los paths que
     realmente afectan a este servicio (el backend y los 3 paquetes de los
     que depende), para no redesplegar en cada cambio de `lumina-frontend`.
   - No se usó `pnpm install --frozen-lockfile` explícito dentro de
     `buildCommand`: ese paso lo corre Railpack automáticamente en su fase de
     instalación, *antes* de `buildCommand` — es justamente esa fase la que
     hoy elige `npm` por error. `buildCommand` no puede arreglar la fase de
     instalación (no existe un campo `installCommand` en el schema de
     `railway.json`); el fix de esa fase es el punto 2 de abajo.

2. **`package.json` raíz** — ya tenía `"packageManager": "pnpm@11.25.0"`, sin
   cambios. Queda documentado acá porque es una precondición del fix, no
   porque haya sido tocado.

## Qué falta cambiar en el dashboard de Railway (no se puede hacer desde el repo)

El campo **Root Directory** de un servicio **no se puede fijar desde
`railway.json`** — es una propiedad de la instancia del servicio, solo
editable desde el dashboard o `railway environment edit --service-config`.
Nadie con acceso al repo puede hacer este cambio por código; hay que entrar al
dashboard de Railway:

1. Abrir el servicio de `lumina-backend` en Railway → **Settings** → **Source**.
2. **Vaciar el campo "Root Directory"** (dejarlo en blanco, o `/`) — **no**
   debe decir `lumina-backend`. Esto expone la raíz del monorepo (con
   `pnpm-lock.yaml` + `pnpm-workspace.yaml` + el `package.json` con
   `packageManager`) al build, que es lo que le permite a Railpack detectar
   pnpm correctamente.
3. Confirmar que Railway sigue encontrando `railway.json` en la raíz del repo
   automáticamente (es la ubicación por defecto; no hace falta configurar un
   "Config File Path" custom salvo que el archivo se mueva de ahí).
4. Disparar un redeploy manual para confirmar.

Si por alguna razón el equipo prefiere **no** tocar el Root Directory (por
ejemplo, si en el futuro se agrega un segundo servicio de Railway al mismo
proyecto y se quiere aislar el contexto de build), la alternativa es dejar de
usar `workspace:*` para las dependencias internas del backend y en su lugar
empaquetarlas/publicarlas aparte — pero eso es un cambio de arquitectura
mucho más grande y no hace falta mientras el backend siga siendo el único
servicio de este repo en Railway.

## Variables de entorno requeridas en el servicio de Railway

Ver `lumina-backend/.env.example` para la lista completa y su propósito. Las
imprescindibles para que el proceso arranque:

- `DATABASE_URL` — Postgres (usar el plugin de Postgres de Railway, o uno
  externo).
- `JWT_SECRET`
- `AI_KEYS_MASTER_SECRET` — mínimo 32 caracteres aleatorios (ver el comentario
  en `.env.example` sobre cómo generarlo). Sin esto, el módulo de claves BYOK
  no arranca.
- `FRONTEND_URL` — usado para CORS; debe apuntar al dominio real del frontend
  en producción.
- `GEMINI_API_KEY` — fallback de IA de plataforma (Curriculum/Achievements aún
  no son BYOK).
- `REDIS_HOST` / `REDIS_PORT` — confirmado en el código
  (`session-gamification.service.ts` y `torneo.service.ts`):
  `new Redis({ host: process.env.REDIS_HOST || 'localhost', port:
  Number(process.env.REDIS_PORT) || 6379 })`, **sin contraseña**. Si se usa el
  plugin de Redis de Railway, sus variables inyectadas normalmente son
  `REDISHOST` / `REDISPORT` / `REDISPASSWORD` (nombres distintos, y con
  password) — hay que mapearlas a mano en las variables del servicio
  (`REDIS_HOST=${{Redis.REDISHOST}}`, `REDIS_PORT=${{Redis.REDISPORT}}`, con
  la sintaxis de referencia de variables de Railway) **o** ajustar estos dos
  archivos para leer `REDISPASSWORD`/las variables que el plugin realmente
  expone — si el Redis de Railway requiere auth, el constructor actual
  fallará en silencio hasta el primer uso. Confirmar el nombre exacto de las
  variables en el plugin de Redis elegido antes de desplegar; no se agregó
  soporte de password en esta sesión por quedar fuera del alcance del fix de
  build (era la tarea pedida: arreglar `npm`→`pnpm`, no auditar cada
  integración de infraestructura).

**No fijar `PORT` a mano.** `src/main.ts` hace
`config.getOrThrow<number>('PORT')` y Railway inyecta su propio `PORT` en
runtime para el puerto público del servicio — si se sobreescribe con un valor
fijo en las variables del servicio, el healthcheck de Railway puede fallar
por apuntar a un puerto que el proceso no está escuchando.

## Por qué no se usó Docker

Se evaluó pero se descartó para este fix: el error es de detección de gestor
de paquetes en el build, no de un problema irresoluble del builder Railpack —
una vez que el Root Directory expone la raíz del monorepo, Railpack ya sabe
manejar workspaces de pnpm de forma nativa (lo confirma la documentación de
Railway: soporta monorepos con pnpm/npm/yarn/bun sin configuración especial
cuando el lockfile del workspace es visible). Un Dockerfile a mano es más
control pero también más mantenimiento; se deja como alternativa si este
fix no alcanza.
