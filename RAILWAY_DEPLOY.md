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
