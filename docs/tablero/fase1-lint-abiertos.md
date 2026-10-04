# Fase 1, limpieza de lint y fichas abiertas (X.1–X.3, F1.4, L.1–L.2)

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

## Fase 1 de la hoja de ruta — riesgos urgentes

- [x] **IDOR en cursos** — `GET /courses/:id`, `POST /courses/:id/enroll`, `GET /courses/:id/students` no verificaban dueño del curso. Cerrado por Claude Code: los tres pasan ahora por `CourseAuthorizationService` (`courseSettings`/`enrollment`), con test de regresión en `courses.service.spec.ts`. Commit `eef4470` (el cambio había quedado sin commitear hasta la consolidación de higiene del 2026-09-05).
- [x] **"Olvidé mi contraseña"** — el frontend prometía `POST /auth/forgot-password` y `POST /auth/reset-password` y el backend no los tenía. Cerrado por Claude Code:
  - Modelo `PasswordResetToken` (`prisma/migrations/20260905120000_add_password_reset_token/`): guarda sólo el hash SHA-256 del token, `expiresAt` (30 min), `usedAt` (un solo uso). Pedir un token nuevo invalida los anteriores; al restablecer se marcan usados todos los tokens vivos del usuario en la misma transacción que el cambio de contraseña.
  - `AuthService.forgotPassword` / `resetPassword`; endpoints con `@Throttle({ limit: 5, ttl: 60_000 })` + `ThrottlerGuard`. La respuesta de `forgot-password` es idéntica exista o no el correo (no enumera cuentas). Hash de contraseña con bcryptjs costo 12, igual que el resto de auth.
  - Prueba de paridad: `src/auth/auth.service.password-reset.spec.ts` (token inválido/expirado/ya usado, no filtra si el email existe, no reutilización, no `devToken` en producción).
  - **PENDIENTE antes de producción — decisión aparte (`TODO(email-provider)` en `auth.service.ts`):** hoy NO se envía correo. En `NODE_ENV !== 'production'` el token en claro se loguea (`console.warn` marcado "DEV ONLY — no enviar así a producción") y se devuelve en `devToken`. Antes de ir a producción hay que conectar un proveedor real de email (SES / Resend / SMTP), enviar el enlace por correo y eliminar tanto el log como el campo `devToken` de la respuesta.
- [x] **Concurrencia de guardado de slide y de juegos en vivo** — Cerrado por Cursor, **verificado por Claude Code** (F1.4 `hecho`):
  - `Slide.contentVersion` (migración `20260905140000_f1_4_slide_version_torneo_unique`) + `UpdateSlideDto.expectedVersion` → `updateMany` condicional; mismatch → `409 ConflictException` con `currentVersion`.
  - Torneo: `@@unique([torneoId, questionIndex, studentId])` + catch `P2002` en `saveAnswer` (idempotente bajo carrera).
  - Gamificación de sesión: lock Redis `SET NX` por `sessionId` alrededor del get→mutate→set del blob JSON.
  - Specs: `classes.service.transaction.spec.ts` (optimistic locking) + `session-gamification.concurrency.spec.ts` + `torneo.service.concurrency.spec.ts`.
- [x] **Rate limiting y timeout en llamadas de IA** — Cerrado por Claude Code:
  - Timeout: `completeJson`/`postJson` en `src/ai-features/ai-providers.ts` ahora pasan `AbortSignal.timeout()` a `fetch` (60 s en generación, 20 s en el ping de verificación de clave). Un timeout se traduce a `503` con mensaje claro y sin filtrar la clave.
  - Rate limiting: `AiFeaturesController` (`/ai/quiz|activity|content-assistant|evaluate-response|generate-from-document|refine-structure`) y `CourseAiController` (`/courses/:courseId/ai/student-feedback|class-summary`) no tenían ningún `@Throttle` — cada endpoint dispara una llamada de generación cara. Ahora ambos con `@UseGuards(ThrottlerGuard)` + `@Throttle({ limit: 20, ttl: 60_000 })`. `AiKeysController` ya lo tenía.
  - Pruebas: `src/ai-features/ai-providers.spec.ts` (AbortSignal en fetch, timeout → 503 sin filtrar clave) y `src/ai-features/ai-rate-limit.spec.ts` (metadata de `@Throttle` en ambos controllers).

## Reparto activo — limpieza de lint (Regla 9)

**Antes de tomar un ítem: marcarlo `[en curso: <herramienta>]` en este mismo archivo y hacer commit de ese cambio primero.** Así ninguna de las tres herramientas pisa el trabajo de otra. Al terminar un ítem: correr `pnpm lint` en el paquete correspondiente, confirmar que el conteo bajó (no subió), y marcarlo `[hecho]`.

Estado de partida: `lumina-backend` 219 problemas (209 errores/10 warnings) — `lumina-frontend` 266 problemas (165 errores/101 warnings). Listas exactas de archivos por cluster: `LINT_CLEANUP_BACKLOG.md`.

| Cluster | Archivo(s) | Asignado | Estado |
|---|---|---|---|
| Cypress `any` (video interactivo) | 6 archivos en `cypress/` | Claude Code | **[hecho]** — 144→0, ver `cypress/support/test-window.ts` |
| Overrides de seguridad silenciados | `lumina-frontend/package.json` → `pnpm-workspace.yaml` | Claude Code | **[hecho]** — lodash/ws/qs/etc. no se estaban aplicando |
| `pptx.service.ts` (xml2js sin tipar) | `lumina-backend/src/pptx/pptx.service.ts` | Claude Code | **[hecho]** — 117→0. Tipos OOXML en el propio archivo + `src/types/pizzip.d.ts` nuevo (sin `@types/pizzip` disponible) |
| Scoring + sesiones autónomas | `lumina-backend/src/classes/activity-scoring.ts` + `lumina-backend/src/autonomous-sessions/*` | Cursor | **[hecho]** — 68→0. `asString`/`asUnknownArray` en scoring; `extractActivityDefinition` + `CurrentUser`/`JwtAuthUser` en autonomous-sessions |
| Cola larga backend | 17 archivos exactos — ver `LINT_CLEANUP_BACKLOG.md` | Antigravity | **[hecho]** — 35→0. Tipado DTOs @Transform, mocks en specs, tipado seguro en AI/gateway |
| Cola larga frontend (`no-unused-vars` / `no-explicit-any` restante) | 53 archivos exactos — ver `LINT_CLEANUP_BACKLOG.md` | Antigravity + Claude Code | **[hecho]** — Antigravity bajó 120→76; Claude Code cerró en **L.2** los 6 `error` que quedaban fuera del cluster congelado. `cd lumina-frontend && pnpm lint` → **0 error** (70 warnings), `tsc` limpio, `test:unit` 446/446 |
| `react-hooks/*` + React Compiler del motor del canvas (**cluster congelado E5**) | **Exactamente `canvas-area.tsx`** (y `slide-renderer.tsx` si reaparece). NO están congelados: `flyout-left-panels.tsx`, `popup-parts.tsx`, `tooltip-parts.tsx`, `diagrama-properties.tsx`, componentes de Timeline (solo `warning`) | Cursor (E5.4) | **[hecho en E5.4]** — override de `eslint.config.mjs` eliminado; `canvas-area.tsx` en lint estricto (0 `error`). `slide-renderer.tsx` sigue con su `switch` hasta E5.5–E5.7. |

**Regla 9 cerrada:** `pnpm lint` está en 0 `error` en los dos paquetes. El override de `canvas-area.tsx` se retiró en E5.4. El lint estricto del CI ya es bloqueante de verdad → **`E1` desbloqueado**.

---

## Tablero de pasos

Formato y protocolo: **Regla 10**. Estados: `pendiente` · `[en curso: <op>]` · `en revisión` · `hecho` · `bloqueado por <ID>`.
El historial de los pasos ya cerrados vive en «Fase 1 — riesgos urgentes» y «Reparto activo — lint»; acá van solo los abiertos y las fichas de la migración.

### Abiertos ahora

#### X.1 — Borrar `canvas-editor.tsx` (código muerto, 0 referencias)
- **Operador:** Antigravity
- **Estado:** **hecho** — verificado por Claude Code. `canvas-editor.tsx` (635 líneas) borrado, `grep -rn "canvas-editor\|CanvasEditor" lumina-frontend/src` → 0 referencias; `npx tsc --noEmit` limpio, `pnpm lint` 0 error (70 warnings), `pnpm test:unit` 446/446. **Defecto de proceso (Regla 11, no se revierte — ya empujado):** el `git rm` quedó incluido en el commit `8342910` («chore(tablero): tomar E5.1 con Codex»), no en un commit de X.1; `2fc846d` («chore: borrar canvas-editor.tsx huérfano») solo cambió el estado en `AGENTS.md`, sin borrado. Causa: un `git add` no explícito arrastró trabajo sin commitear de otro operador del árbol compartido. Recordatorio a los 4 operadores: stagear **siempre rutas explícitas**.
- **Precondición:** ninguna — disjunto de E5 (E5 no toca este archivo; no está en ninguna sub-ficha E5.x).
- **Contexto:** `lumina-frontend/src/app/(app)/classes/[id]/editor/canvas-editor.tsx` (21 KB, `export default CanvasEditor`) no lo importa nadie — `grep -rn "canvas-editor\|CanvasEditor" src/` solo devuelve auto-referencias dentro del propio archivo. Es un editor `EditorDoc` (`parseEditorContent`/`serializeDoc`) que quedó huérfano; el editor real es `editor-client.tsx` + `components/canvas-area.tsx`. No tiene spec.
- **Alcance — PUEDE tocar:** borrar `lumina-frontend/src/app/(app)/classes/[id]/editor/canvas-editor.tsx` y **solo** eso. Si `tsc`/lint/build señalan un import roto tras borrarlo (no debería), se **para** y se deja `bloqueado` — no se borra nada más ni se toca otro archivo.
- **Alcance — NO toca:** cualquier otro archivo. Nada de `canvas-area.tsx`, `slide-renderer.tsx`, `editor-client.tsx`.
- **Entregable:** el archivo no existe. Verificación: `cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm build && pnpm test:unit` — 0 error de lint (70 warnings), tsc limpio, build OK, `test:unit` 446/446 (sin cambio de conteo).
- **Cierre:** no aplica Regla 4 (no es migración; es un archivo huérfano, adelanto de E7). Commit `chore: borrar canvas-editor.tsx huérfano`.

#### F1.4 — Concurrencia de guardado de slide y de juegos en vivo
- **Operador:** Cursor
- **Estado:** **hecho** — verificado por Claude Code (E4.1 en curso en paralelo, alcance disjunto: F1.4 es backend puro). Revisado contra la ficha: (1) `Slide.contentVersion` + `UpdateSlideDto.expectedVersion` → `updateMany` condicional atómico; `count === 0` → 404 si no existe, si no `409 ConflictException` con `currentVersion` + `expectedVersion`; sin `expectedVersion` sigue LWW pero incrementa versión (compat documentada). (2) `saveAnswer`: fast-path `findFirst` + `create` en try/catch → P2002 ⇒ `null` (la unique DB es la fuente de verdad ante check-then-insert). (3) `withSessionLock`: `SET key token EX ttl NX` + retry acotado + release solo si el token coincide; las 3 mutaciones del blob pasan por él. Migración aditiva y segura (dedup conserva la respuesta más antigua antes del índice único). Specs de carrera reales (no verdes triviales): `session-gamification.concurrency.spec.ts` retrasa `redis.get` para forzar solape; `torneo.service.concurrency.spec.ts` usa un gate sobre `create` + Prisma fake con la unique. Verif (`cd lumina-backend`): `npx tsc --noEmit` OK · `pnpm lint` 0 · `pnpm test` **243/243** (28 suites; 238 base + 5 de F1.4 — `pnpm test` ya corre, el bloqueo de install se resolvió al cerrar E1.1). Sin archivos fuera de alcance; motor React del canvas intacto.
- **Precondición:** ninguna — es un riesgo de Fase 1, corre en paralelo a la migración.
- **Alcance — PUEDE tocar:** `lumina-backend/src/classes/` (persistencia de slide: transacción / control de versión optimista), `lumina-backend/src/classes/classes.gateway.ts`, `lumina-backend/src/live-sessions/`, `lumina-backend/src/torneo/`, `lumina-backend/src/gamification/session-gamification.service.ts`, `lumina-backend/src/quiz-live/`, y sus `*.spec.ts`.
- **Alcance — NO toca:** el motor React del canvas (`lumina-frontend/src/**/canvas-*`, `slide-renderer.tsx`, componentes de Timeline) — es el cluster `react-hooks` congelado para E5. Si el fix necesitara tocarlo, se para y se deja el estado en `bloqueado por E5`.
- **Entregable:** (1) guardado de slide concurrente sin "última escritura gana" silenciosa — versión / `updatedAt` con rechazo `409` o merge explícito; (2) actualización de puntaje en vivo (torneo/gamificación de sesión) sin condición de carrera — transacción o lock por sesión en Redis. Prueba: ampliar `classes.service.transaction.spec.ts` + un spec nuevo de carrera sobre el servicio/gateway de sesión. Verificación: `cd lumina-backend && npx tsc --noEmit && pnpm lint && pnpm test` (sin bajar el conteo de tests).
- **Cierre:** no aplica Regla 4 (no es migración). Marcar el ítem en «Fase 1 — riesgos urgentes» como `[x]` con el resumen.

#### L.1 — Cola larga de lint del frontend · **hecho**
Antigravity bajó 120→76 problemas sobre los 53 archivos; los 6 `error` restantes fuera del cluster congelado los cerró Claude Code en **L.2**. Detalle en la tabla «Reparto activo — lint».

#### L.2 — Cerrar los 6 errores fuera del cluster congelado + degradar `canvas-area.tsx` · **hecho**
- **Operador:** Claude Code · commit `7cbbae4`
- **Qué se hizo:**
  - `flyout-left-panels.tsx` — 3× `no-explicit-any` → tipo `LegacySlideIA` (`{ tipo?; type?; title?; bulletPoints? }`) en `layoutDesdeSlideIA` y en el branch de esquema legado.
  - `popup-parts.tsx` / `tooltip-parts.tsx` — `react-hooks/static-components` → el ícono Lucide se instancia con `createElement(resolve…Icon(cfg), props)` en vez de `const Icon = …` + `<Icon/>`.
  - `diagrama-properties.tsx` — `react-hooks/purity` (`Date.now()` en render) → sufijo de id determinista: `Math.max(count, maxSeq+1)` sobre las secuencias numéricas de los nodos existentes (también evita colisión tras borrar un nodo).
  - `lumina-frontend/eslint.config.mjs` — bloque `files: ["**/editor/components/canvas-area.tsx"]` que baja `react-hooks/{rules-of-hooks,immutability,preserve-manual-memoization,purity,static-components}` a `warn`, con `TODO(migración-etapa-5)`.
- **Verificación:** `cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit` → 0 `error` (70 warnings), tsc limpio, 446/446. `cd lumina-backend && pnpm lint` → 0.

#### X.2 — "Guía de Lumina": clase de sistema de solo lectura para docentes nuevos
- **Operador:** Claude Code
- **Estado:** **en revisión** — implementado de punta a punta (backend + frontend), con las correcciones de la revisión aplicadas (sin "Materialize", sin reutilizar un duplicado que no existía, endpoint de lectura propio en vez del visor estándar, `startSession` bloqueado además de editar/publicar/eliminar, `status: PUBLISHED` desde la creación).
  - **Backend:** `Class.isSystemTemplate/templateKey/templateVersion` + `User.welcomeGuideDismissedAt` (migración manual `20260924000000_help_guide_template` — sin DB disponible en esta sesión para `prisma migrate dev`, escrita a mano siguiendo el formato exacto de las migraciones previas; `prisma generate` sí corrió y validó el schema). `HelpGuideModule` (`GET/POST duplicate/PATCH dismiss` en `/help/guide`, rol TEACHER, sin `CourseAuthorizationService` — a propósito). Guardas `assertNotSystemTemplate` en `update`/`publish`/`remove`/`startSession` de `ClassesService`, antes de `verifyOwnership` (que deja pasar a SUPERADMIN). Filtro defensivo `isSystemTemplate: false` en el listado de presentaciones personales. `seed-help-guide.ts` (idempotente por `templateKey`, exige SUPERADMIN ya creado) + `templates/welcome-teacher.json` (3 slides, solo bloques `texto`) + `scripts/export-class-template.ts` (autoría futura desde el editor real).
  - **Frontend:** `use-help-guide.ts` (no reusa `useClass`), tarjeta en `TeacherDashboard` (`help-guide-dashboard-card.tsx`), página de solo lectura `/help/guide` (`help-guide-client.tsx`, renderiza con `<SlideRenderer modo="viewer">` como `preview-client.tsx`, sin pasar por el endpoint estándar de clase), entrada "Guía de Lumina" en `layout-11.config.tsx` (rol TEACHER).
  - **Test de contrato:** `lib/help-guide-template.contract.spec.ts` — importa el JSON del backend y lo corre por `classSlideToRendererSlide` (el mismo pipeline real que usa el editor/visor) + verifica cada `tipo` contra `elementRegistry` real de `@lumina/element-kit` (no un esquema paralelo).
  - **Verificación corrida:** `cd lumina-backend && npx prisma generate && npx tsc --noEmit && pnpm lint && npx jest` → tsc limpio, lint 0 errores, **371/371** tests (11 nuevos: 6 de `HelpGuideService`, 5 de las guardas de la clase de sistema). `cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build` → tsc limpio, lint 0 errores (43 warnings preexistentes), **328/328** tests (4 nuevos de contrato), build OK (`/help/guide` generada, 21/21 páginas).
  - **Pendiente (fuera de esta sesión):** correr `prisma migrate dev`/`migrate deploy` contra una base real (no había DB disponible aquí) y `npx ts-node prisma/seed-help-guide.ts` para poblar la clase de sistema; QA manual en navegador (crear/loguear un TEACHER, ver la tarjeta, duplicar, editar la copia, confirmar que el original no cambia).
- **Precondición:** ninguna — no es migración (Reglas 1–4 no aplican), Reglas 0, 5–11 vigentes.
- **Contexto y correcciones aplicadas tras revisión de un plan previo (análisis de otra sesión + prompt de ejecución):**
  - El plan original decía "seguir el patrón visual Materialize" — **incorrecto**, el sistema de diseño real es `@lumina/ui` (E7.6.2). Se descarta esa referencia.
  - El plan asumía "reutilizar la lógica de duplicado existente" — **no existe** ningún clonado de clase+slides hoy (confirmado por grep); se construye desde cero (nuevos IDs de slide/clase, `contentVersion` reseteado a 0).
  - Riesgo real confirmado leyendo `classes.service.ts:400-481` (`findOne`): una clase sin `courseId` (`isPersonalPresentation`) solo es legible por su `authorId` o por ADMIN/SUPERADMIN — un docente cualquiera recibe `403` si se reutiliza el flujo estándar (`useClass`/`/classes/:id`) para ver la clase de sistema (propiedad de un SUPERADMIN). **Decisión:** la guía NO reusa `useClass`/la ruta estándar — expone su propio endpoint de lectura (`GET /help/guide`, sin chequeo de propiedad, acotado a rol TEACHER) y su propia página de solo lectura en el frontend, que renderiza con `<SlideRenderer modo="viewer">` (igual que `preview-client.tsx`) alimentada por ese payload.
  - `verifyOwnership` (línea 1592) deja pasar a ADMIN/SUPERADMIN **antes** de cualquier chequeo — así que "prohibir editar/publicar/eliminar/iniciar sesión en vivo" se implementa como guardas explícitas por `isSystemTemplate` en `update`/`publish`/`remove`/`startSession`, **antes** de `verifyOwnership`, para que ni siquiera un SUPERADMIN lo toque por los endpoints normales (solo el seed).
  - `status: 'PUBLISHED'` ya es el valor que usa `create()` para presentaciones personales (línea 69) — la clase de sistema se crea igual, evitando la contradicción "prohibir publicar" vs. "el visor necesita PUBLISHED".
  - Se agrega explícitamente el bloqueo de `startSession` (no solo editar/eliminar/publicar) a las prohibiciones — evita que se genere telemetría/`ClassResult` real sobre la plantilla.
  - Contrato de contenido: se ancla a tipos reales de `@lumina/element-kit`/`@lumina/types` (solo bloques `texto`), no a un esquema paralelo inventado.
- **Alcance — PUEDE tocar:**
  - `lumina-backend/prisma/schema.prisma` + migración nueva (aditiva): `Class.isSystemTemplate Boolean @default(false)`, `Class.templateKey String? @unique`, `Class.templateVersion Int?`; `User.welcomeGuideDismissedAt DateTime?`.
  - `lumina-backend/src/classes/classes.service.ts` — `findOneRaw` gana `isSystemTemplate` en el `select`; guardas tempranas en `update`/`publish`/`remove`/`startSession`.
  - Nuevo `lumina-backend/src/help-guide/**` (module, controller, service, spec) + `lumina-backend/src/help-guide/templates/welcome-teacher.json` (3 slides, solo bloques `texto`).
  - `lumina-backend/prisma/seed-help-guide.ts` (upsert idempotente por `templateKey`, exige que ya exista un SUPERADMIN) + `lumina-backend/prisma/scripts/export-class-template.ts` (autoría futura).
  - `lumina-backend/src/app.module.ts` — registrar `HelpGuideModule`.
  - Frontend: `lumina-frontend/src/hooks/api/use-help-guide.ts`, `lumina-frontend/src/app/(app)/help/guide/*`, tarjeta nueva en `dashboard-client.tsx` (rama `TeacherDashboard`), entrada en `lumina-frontend/src/config/layout-11.config.tsx` (rol `TEACHER`), test de contrato del template JSON.
- **Alcance — NO toca:** `@lumina/scoring`, el motor del canvas (`canvas-area.tsx`/`slide-renderer.tsx` en sí, solo se **consume** `<SlideRenderer>` como ya hace `preview-client.tsx`), rol `STUDENT` (fuera de alcance, decisión cerrada), tour guiado (`react-joyride` — paso posterior, no se instala ninguna librería nueva).
- **Entregable:** docente nuevo ve la tarjeta en el dashboard, la cierra (persiste), abre "Guía de Lumina" desde el menú lateral, la ve en solo lectura, la duplica a su espacio y edita la copia sin afectar el original. Verificación: `cd lumina-backend && npx prisma generate && npx tsc --noEmit && pnpm lint && pnpm test` + `cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build`, sin bajar conteos.
- **Cierre:** no aplica Regla 4 (aditivo). Commit sugerido (sin ejecutar git en esta sesión salvo que el usuario lo pida): `feat(help-guide): guía de Lumina de solo lectura para docentes`.

#### X.3 — Bloque propio «Ecuación» (`tipo: 'ecuacion'`) con panel de propiedades
- **Operador:** Claude Code
- **Estado:** **en revisión** — la ecuación pasa de nodo `math` dentro de un texto a `EquationBlock` (`@lumina/types`), `ElementDefinition` en `packages/element-kit/src/{blocks,elements}/ecuacion/` (Editor/Viewer/Propiedades, `catalogo`, registro único). Render KaTeX perezoso con ajuste a la caja (`ajustar`), tamaño/color/fondo/alineación y descripción accesible. Panel: `EquationComposer` (editor-shared) ampliado con 7 pestañas de símbolos y fórmulas frecuentes, vista previa con error visible, deshacer/rehacer propio y Tab entre huecos (`nextMathSlot`). Inserción desde el riel Matemáticas («Colocar en el slide») y desde «Ecuación» en el panel de elementos. Tocó los switches de posición (`block-pos`, `use-block-drag`, `canvas-layers`, `properties-panel`). Las fórmulas viejas (nodo `math` en texto) siguen renderizando; no hay migración automática.
- **Verif:** `@lumina/editor-shared` test 301/301 · `@lumina/element-kit` build/lint 0 error/test 497/497 · `lumina-frontend` tsc limpio/lint 0 error/test:unit 337/337. **Sin QA manual en navegador** (pendiente: seleccionar la ecuación, editar en el panel, redimensionar, presentar en viewer).

