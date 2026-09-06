# Lumina — Convenciones de trabajo (fuente única)

Este archivo es la **única** fuente de verdad para cómo se trabaja en este repositorio mientras dure la migración a la Estructura Única (`@lumina/element-kit`). Lo leen, sin excepción y con el mismo contenido:

- **Claude Code** — vía `CLAUDE.md` en la raíz (`@AGENTS.md`) y en cada paquete.
- **Cursor** — de forma nativa como regla base, más `.cursor/rules/*.mdc` para reglas ya existentes con alcance específico (editor de canvas). Ningún `.mdc` nuevo redefine lo que dice este archivo — solo puede apuntar aquí.
- **Antigravity** — de forma nativa desde v1.20.3. **No crear un `GEMINI.md` en la raíz**: si existe, Antigravity le da prioridad sobre este archivo para reglas en conflicto, y volveríamos a tener dos fuentes de verdad por la puerta de atrás.

Si una herramienta sugiere algo que contradice este documento, **este documento gana siempre**. Si hace falta una regla nueva, se agrega acá — nunca en un archivo paralelo.

Contexto completo del diagnóstico y la hoja de ruta: informe "Plano Lumina" (peritaje + hoja de ruta de corrección + estructura única, 7 etapas). `LUMINA_CONTEXT_V41.md` en la raíz tiene el historial de producto previo a esta migración.

---

## Regla 0 — Jerarquía

1. Este archivo.
2. Los contratos ya existentes y vigentes (ej. `.cursor/rules/lumina-canvas-editor-contracts.mdc` para el editor de canvas, mientras esa parte no haya migrado al nuevo contrato).
3. La convención de la herramienta que estés usando.
4. Preferencia personal — **no aplica** en este proyecto durante la migración.

## Regla 1 — Orden de migración obligatorio, sin saltos

Las etapas se ejecutan en este orden y no se empieza una sin haber cerrado la anterior (ver sección "Cierre obligatorio" de cada una en el informe):

1. Diseñar `@lumina/element-kit` + piloto con Botón.
2. Migrar **actividades** (fusionar los dos registros existentes en uno, conectar `@lumina/scoring`).
3. Migrar **widgets** (piloto: Ruleta).
4. Migrar **bloques de canvas y formas vectoriales** (incluye el editor Paper.js).
5. Unificar **estado del editor** (reducer central, persistencia por diferencia, historial por diferencia).
6. Conectar **Lumina Core con Lumina Edu** sobre el mismo motor de puntuación.
7. Retirar todo registro/switch/archivo viejo que ya nadie referencia.

No se trabaja la Etapa 4 antes de haber cerrado (código viejo borrado) las Etapas 2 y 3. No se toca la Etapa 5 antes de que exista un elemento migrado de cada categoría.

## Regla 2 — El contrato de elemento

- Paquete: `packages/element-kit` dentro del workspace pnpm real (`packages:` en `pnpm-workspace.yaml` — si todavía no existe, es lo primero que se crea).
- Toda instancia de `ElementDefinition` declara, como mínimo: `tipo`, `crearPorDefecto()`, `Editor`, `Viewer`, `Propiedades`, `apariencia` (color/tipografía/animación), y opcionalmente `puntuacion` (delegado a `@lumina/scoring`).
- Un único punto de registro: `ElementRegistry.registrar(definicion)`. No se crean registros paralelos por dominio (widgets/actividades/bloques ya no son sistemas distintos).

## Regla 3 — Ley de la migración: nada nuevo en el sistema viejo

Desde el momento en que `@lumina/element-kit` existe (fin de Etapa 1):

- **Prohibido** agregar un tipo de actividad, widget o bloque nuevo a `activity-registry.ts`, `widget-registry.ts` o al union de `Block` viejo. Todo elemento nuevo nace directo como `ElementDefinition`.
- Esto aplica incluso si el elemento nuevo pertenece a una categoría que todavía no migró del todo — se migra ese elemento puntual primero, o se bloquea el PR.

## Regla 4 — Cierre obligatorio (no quedan dos caminos)

Ningún PR de migración se da por terminado dejando el código viejo "por si acaso". Dos únicas salidas:

- El PR borra el código/registro viejo del elemento migrado, **o**
- El PR deja un comentario `TODO(migración-etapa-N)` con el nombre exacto del archivo a borrar y un issue/ticket vinculado con fecha.

"Dejar ambos caminos indefinidamente" no es una opción válida — es exactamente el patrón que causó la fragmentación original.

## Regla 5 — Autorización, sin excepciones

- Toda ruta del backend con alcance de curso llama a `CourseAuthorizationService`. No hay checks de propiedad hechos a mano dentro de un service.
- Toda ruta nueva declara `@Roles(...)` explícito. Una ruta sin `@Roles()` es motivo de rechazo en revisión, no una advertencia.
- El guard de roles es "denegar por defecto" — si en algún momento se cambia esa lógica, es una decisión de este documento, no de un PR individual.

## Regla 6 — Commits

Se mantiene la convención ya usada en el repo (`feat:`, `fix:`, `chore:`, en español, con descripción corta). Para esta migración, usar además:

- `refactor(element-kit): migrar <Elemento> a ElementDefinition`
- `chore(element-kit): retirar registro viejo de <Elemento>`
- `feat(element-kit): <funcionalidad nueva construida sobre el contrato>`

## Regla 7 — Nada se migra sin red de seguridad

- CI (lint + test + build) debe estar corriendo en cada PR antes de tocar la Etapa 2. Si todavía no existe, es lo primero de todo, antes que el propio `element-kit`.
- Todo elemento migrado necesita una prueba que compare su comportamiento contra el elemento viejo (misma entrada → misma salida visible) antes de borrar el código viejo.
- `pnpm test` en `lumina-backend` tiene que correr sin errores antes de empezar — hoy está roto por una referencia a un script eliminado; es un bloqueante de Regla 7, no un detalle aparte.

## Regla 8 — Un solo archivo de reglas, siempre

Nadie crea un segundo documento de convenciones en ninguna herramienta (otro `.md` de reglas, otro `.mdc` que repita en vez de referenciar, notas sueltas en el README de un paquete). Ampliaciones y excepciones se agregan **en este archivo**, con su propio commit, para que las tres herramientas las vean al mismo tiempo.

## Regla 9 — Protocolo obligatorio de corrección de errores (lint, tipos, CI)

Aplica a cualquier error preexistente que se decida corregir (empezando por los 209 de `lumina-backend` y 165 de `lumina-frontend` detectados al activar CI). No se "arregla sobre la marcha" — se sigue este orden, sin saltarse pasos:

1. **Revisar a profundidad** — entender la causa real del error, no solo silenciarlo (nunca `// eslint-disable` como primera opción).
2. **Verificar el alcance** — ¿es un patrón repetido o un caso aislado? ¿toca un tipo/función usado en otros lados?
3. **Constatar cantidad** — cuántos archivos y cuántas ocurrencias exactas afecta esa misma causa, antes de tocar el primero.
4. **Corregir** — el fix real (tipar correctamente, no `any`/`as any` de parche), agrupando por causa común, no archivo por archivo al azar.
5. **Revisar que la corrección no genere errores nuevos** — re-lintear/re-testear después de cada tanda antes de seguir con la siguiente.
6. **Refactorizar** si la corrección deja a la vista una duplicación u oportunidad de simplificar (sin expandir el alcance del cambio más allá de lo necesario).

**Decisión tomada:** el CI nace estricto desde el día uno — `pnpm lint` es bloqueante en el workflow, sin `continue-on-error`. Eso significa que el CI va a estar en rojo hasta que este protocolo termine de limpiar los 209 errores de `lumina-backend` y los 165 de `lumina-frontend`. Es intencional: no se avanza a la Etapa 1 del `element-kit` mientras el CI no esté verde con lint estricto. Cada tanda de corrección se verifica corriendo `pnpm lint` localmente antes de subir el cambio, para confirmar que el conteo de errores baja y no sube.

## Regla 10 — Tablero de pasos y órdenes de trabajo

El trabajo se reparte entre tres operadores — **Claude Code**, **Cursor**, **Antigravity** — en pasos atómicos (un paso = un PR). Cada paso vive como una **ficha** en la sección **«Tablero de pasos»** (al final de este archivo). El prompt que recibe un operador es corto **a propósito**: todo el detalle está en la ficha.

### Prompt canónico del operador

> Realizá el paso `<ID>` del Tablero de pasos de `AGENTS.md`. Leé la ficha completa y las Reglas 0–11. No te salgas del alcance declarado en la ficha (archivos que puede tocar / que no). Corré el comando de verificación de la ficha; no lo des por terminado si algo falla. Al terminar dejá el estado en `en revisión` con una línea de qué hiciste y qué comando corriste.

Nada más. Si el operador necesita algo que **no** está en la ficha, no improvisa: pide que se complete la ficha primero y espera.

### Anatomía de una ficha (todos los campos obligatorios)

| Campo | Qué es |
|---|---|
| **ID** | `E<etapa>.<n>` migración · `F1.<n>` riesgo de Fase 1 · `L.<n>` lint · `X.<n>` fuera de hoja de ruta |
| **Título** | Una línea imperativa ("Realizá X"). |
| **Operador** | Claude Code · Cursor · Antigravity. |
| **Estado** | `pendiente` → `[en curso: <op>]` → `en revisión` → `hecho`; o `bloqueado por <ID>`. |
| **Precondición** | Qué fichas deben estar `hecho` antes. Si la Regla 1 lo impide, se dice acá. |
| **Alcance** | Carpetas/archivos que el paso PUEDE tocar y los que NO. Un cambio fuera de esto = rechazo en revisión. |
| **Entregable** | Qué existe al terminar: código + prueba (paridad si aplica, Regla 7) + el **comando de verificación exacto**. |
| **Cierre** | Regla 4 si aplica: qué código viejo se borra, o qué `TODO(migración-etapa-N)` queda con ticket y fecha. |

### Quién redacta las fichas

- Las fichas de la **etapa activa** se redactan **antes** de asignarlas. Una ficha incompleta no se asigna — se completa primero (commit `chore(tablero): …`), después se reparte.
- Las fichas de una etapa futura se redactan **al cerrar la etapa previa** (Regla 1), no antes: así reflejan el estado real del código. La ficha «raíz» de cada etapa dice quién la redacta.
- Si al ejecutar un paso el alcance resulta mal estimado, el operador **para**, deja el estado en `bloqueado por <ID>` o pide reescribir la ficha — no la amplía por su cuenta (Regla 9 §2, Regla 4).

### Concurrencia

- Un operador toma **una** ficha a la vez, salvo que dos fichas sean independientes y toquen conjuntos de archivos **disjuntos**.
- Si dos fichas activas podrían tocar el mismo archivo, **no** corren en paralelo — la segunda espera.
- `[en curso: <op>]` + commit **antes** de empezar. Sin ese commit, otro operador puede reclamar la misma ficha.

## Regla 11 — Los operadores ejecutan sin pedir permiso paso a paso

Aplica a **Antigravity, Cursor, Codex y Claude Code**. Interrumpir pidiendo confirmación por cada acción (Antigravity llega a ~3 prompts por minuto) frena el trabajo sin sumar seguridad real: el alcance ya está acotado por la ficha (Regla 10) y la red de seguridad es el CI + los tests (Regla 7).

- El operador ejecuta **todas las acciones de su ficha sin pedir confirmación**: leer y escribir archivos, correr `pnpm` / `npx` / tests / lint, `git add` de sus propios archivos, `git commit`, crear ramas locales.
- El permiso es **por adelantado y para todo el ciclo de la ficha** — no se pregunta comando por comando. Si el cliente tiene un modo "auto-run / YOLO / ejecutar sin confirmar", se deja activado para este repo.
- Sigue acotado por: el **alcance declarado en la ficha** (archivos que puede / no puede tocar) y las Reglas 0–11. "Sin preguntar" **no** habilita salir del alcance, tomar otra ficha, ni saltarse un paso del protocolo.
- **Sí** se para y se pide confirmación explícita antes de:
  - operaciones destructivas irreversibles sobre historia o estado compartido: `git push --force`, `git reset --hard` sobre commits ya empujados, borrar ramas remotas, reescribir historia, `git clean -fdx`;
  - `git add -A` / `git add .` (siempre se stagean rutas explícitas — el árbol tiene trabajo sin commitear de otros operadores);
  - `git push` (empujar a `origin` se consulta salvo que la ficha lo pida explícitamente);
  - cualquier cosa fuera del alcance de la ficha (ahí aplica `bloqueado`, Regla 10).

## Definition of Done por elemento migrado

- [ ] Implementa `ElementDefinition` completo (editor, viewer, propiedades, apariencia, puntuación si aplica).
- [ ] Registrado únicamente vía `ElementRegistry.registrar()`.
- [ ] Prueba de paridad contra el comportamiento viejo.
- [ ] Código/registro viejo borrado o `TODO` con ticket vinculado (Regla 4).
- [ ] CI verde.

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
| `react-hooks/*` + React Compiler del motor del canvas (**cluster congelado E5**) | **Exactamente `canvas-area.tsx`** (y `slide-renderer.tsx` si reaparece). NO están congelados: `flyout-left-panels.tsx`, `popup-parts.tsx`, `tooltip-parts.tsx`, `diagrama-properties.tsx`, componentes de Timeline (solo `warning`) | **Nadie hasta E5** | **Degradado a `warn` SOLO en `canvas-area.tsx`** vía `lumina-frontend/eslint.config.mjs` (`react-hooks/rules-of-hooks`, `immutability`, `preserve-manual-memoization`, `purity`, `static-components`), con `TODO(migración-etapa-5)`. Son exactamente los diagnósticos del React Compiler que E5 resuelve al centralizar el estado del editor. El override se quita al cerrar E5. |

**Regla 9 cerrada:** `pnpm lint` está en 0 `error` en los dos paquetes (con `canvas-area.tsx` degradado a `warning` hasta E5). El lint estricto del CI ya es bloqueante de verdad → **`E1` desbloqueado**.

---

## Tablero de pasos

Formato y protocolo: **Regla 10**. Estados: `pendiente` · `[en curso: <op>]` · `en revisión` · `hecho` · `bloqueado por <ID>`.
El historial de los pasos ya cerrados vive en «Fase 1 — riesgos urgentes» y «Reparto activo — lint»; acá van solo los abiertos y las fichas de la migración.

### Abiertos ahora

#### X.1 — Borrar `canvas-editor.tsx` (código muerto, 0 referencias)
- **Operador:** Antigravity
- **Estado:** pendiente
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

### Migración a Estructura Única — fichas por etapa

Regla 1: no se abre una etapa sin cerrar la anterior. Cada etapa arranca por su ficha «raíz»; las sub-fichas se redactan cuando la etapa se vuelve activa, con el estado real del código a la vista.

#### E1 — `@lumina/element-kit` + piloto Botón · **CERRADA** — commits `43cbfca` / `fef649b` / `8b6e338` / `1fcc157`
Precondición global cumplida: `pnpm lint` estricto en verde en ambos paquetes (`canvas-area.tsx` degradado a `warning` hasta E5).
Etapa 1 completa: existe el workspace pnpm real, el contrato `ElementDefinition` + `ElementRegistry`, el stub `@lumina/scoring`, y el Botón migrado con prueba de paridad (Regla 7). El canvas viejo sigue despachando el Botón hasta E3/E5 (Regla 4: `TODO(migración-etapa-3)` en `widget-registry.ts`).
Estado actual del repo a tener a la vista: **no hay** workspace pnpm con `packages:` (la raíz tiene un `pnpm-workspace.yaml` solo con `allowBuilds:`); `lumina-frontend` y `lumina-backend` se instalan por separado, cada uno con su `pnpm-lock.yaml` y su `pnpm-workspace.yaml`. El widget Botón ya está partido en `lumina-frontend/src/components/widgets/boton/` (`boton-defaults.ts`, `boton-editor.tsx`, `boton-viewer.tsx`, `boton-properties.tsx`, `boton-config.ts`, `boton-parts.tsx`). El dispatch de widgets vive en `slide-renderer.tsx` — **congelado para E5**.

##### E1.1 — Workspace pnpm real en la raíz · **hecho** (commit `43cbfca`)
- **Operador:** Antigravity
- **Estado:** hecho — verificado por Claude Code: `pnpm install --frozen-lockfile` desde la raíz resuelve (3 proyectos); `pnpm --filter lumina-backend lint/test/build` → 0 lint, **243/243** tests (238 base + 5 de F1.4), build OK; `pnpm --filter lumina-frontend lint/test:unit/build` → 0 errores (70 warnings), **446/446**, build OK (17/17 páginas). `ci.yml`: ambos jobs instalan en la raíz y usan `pnpm --filter`. No se tocó nada bajo `src/` ni `prisma/`.
- **Desvío de alcance (menor, aceptado):** se añadió `serverExternalPackages: ['paper']` a `lumina-frontend/next.config.ts` — la ficha decía "NO toca `next.config`". Es necesario para que `paper` resuelva bajo el `node_modules` hoisteado del workspace; el build pasa. Antigravity debió marcar `bloqueado` y pedir ampliar la ficha en vez de tocarlo directo (Regla 10). Queda registrado, no se revierte.
- **Precondición:** L.1 + L.2 `hecho` (CI verde con lint estricto) — cumplida.
- **Alcance — PUEDE tocar (solo infraestructura de workspace, NADA bajo `src/` ni `prisma/`):**
  - Raíz: crear `package.json` (`"private": true`, `"packageManager": "pnpm@11.25.0"` — igual que CI); ampliar `pnpm-workspace.yaml` con `packages: ['packages/*', 'lumina-frontend', 'lumina-backend']` y consolidar ahí los `overrides` / `allowBuilds` / `ignoredBuiltDependencies` que hoy están repartidos en `lumina-frontend/pnpm-workspace.yaml` y en el `pnpm-workspace.yaml` de la raíz.
  - Borrar `lumina-frontend/pnpm-workspace.yaml` (queda fusionado en la raíz).
  - Regenerar **un único** `pnpm-lock.yaml` en la raíz; borrar `lumina-frontend/pnpm-lock.yaml` y `lumina-backend/pnpm-lock.yaml`.
  - `.github/workflows/ci.yml`: un `pnpm install --frozen-lockfile` en la raíz; los jobs `backend` y `frontend` (que siguen separados) pasan a `pnpm --filter lumina-backend <script>` / `pnpm --filter lumina-frontend <script>`. `prisma generate` sigue corriendo en el job backend.
  - Crear `packages/.gitkeep`. `.gitignore`: añadir `packages/*/dist`.
- **Alcance — NO toca:** ningún archivo bajo `lumina-frontend/src/`, `lumina-backend/src/`, `lumina-backend/prisma/`; ni `next.config`, `nest-cli.json`, `docker-compose.yml`, `.claude/launch.json`. No sube ni baja versiones de dependencias a propósito — solo mueve dónde viven lockfile/overrides.
- **Entregable:** desde la raíz, `pnpm install --frozen-lockfile` resuelve. `pnpm --filter lumina-backend lint && pnpm --filter lumina-backend test && pnpm --filter lumina-backend build` y `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit && pnpm --filter lumina-frontend build` pasan **igual que antes** (backend 238 tests, frontend 446, 0 errores de lint). CI verde en los dos jobs.
- **Riesgo declarado:** consolidar los dos lockfiles en uno puede hacer que pnpm deduplique y cambie alguna versión resuelta. Si eso rompe un build o un test, **parar** (`bloqueado`), no forzar: reescribir la ficha con un enfoque más angosto.
- **Cierre:** no aplica Regla 4. El commit deja explícito que a partir de acá se instala desde la raíz con `pnpm --filter`.

##### E1.2 — Scaffold `packages/element-kit` con el contrato `ElementDefinition`
- **Operador:** Codex
- **Estado:** **hecho** (commit `fef649b`) — verificado por Claude Code: contrato cumple Regla 2 (`tipo`/`crearPorDefecto`/`Editor`/`Viewer`/`Propiedades`/`apariencia`/`puntuacion?`), `ElementRegistry` con `registrar`/`obtener`/`listar` + error en `tipo` duplicado, job `packages` en CI. `build` OK, `test` 4/4, `lint` 0.
- **Precondición:** E1.1 `hecho`.
- **Alcance — PUEDE tocar:** solo `packages/element-kit/**` y la entrada correspondiente en el `pnpm-lock.yaml` de la raíz + un job/paso `packages` en `.github/workflows/ci.yml`.
- **Contenido mínimo:**
  - `package.json` — `"name": "@lumina/element-kit"`, `"private": true`, `"type": "module"`, `exports` desde `dist/`; scripts `build` (tsc), `test` (**vitest**, igual que el frontend), `lint` (hereda la config base). `react` / `react-dom` como `peerDependencies` (no se bundlean).
  - `tsconfig.json` propio (`strict: true`), `eslint.config.mjs` que extienda la base.
  - `src/contract.ts` — los tipos del contrato (Regla 2), sin implementación concreta: `ElementDefinition<TState, TConfig>` con `tipo`, `crearPorDefecto()`, `Editor`, `Viewer`, `Propiedades`, `apariencia` (`AparienciaSpec` = color / tipografía / animación) y `puntuacion?` (`PuntuacionDelegate<TState>`); más `ElementEditorProps`, `ElementViewerProps`, `ElementPropsPanelProps`.
  - `src/registry.ts` — `ElementRegistry` con `registrar(def)`, `obtener(tipo)`, `listar()`; error explícito si se registra un `tipo` duplicado. **Único** punto de registro (Regla 2).
  - `src/index.ts` — API pública.
  - Tests: `registry.spec.ts` (registrar / obtener / duplicado) + chequeo de tipos del contrato (`expect-type` o `tsd`).
- **Alcance — NO toca:** ningún elemento concreto (eso es E1.4), ni `lumina-frontend/`, ni `lumina-backend/`.
- **Entregable:** `pnpm --filter @lumina/element-kit build && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint` verdes en local y en CI. Sin consumidores todavía.
- **Cierre:** no aplica Regla 4.

##### E1.3 — Scaffold `packages/scoring` (stub, sin portar todavía)
- **Operador:** Codex
- **Estado:** **hecho** (commit `8b6e338`) — verificado por Claude Code: stub de las 15 funciones públicas + tipos, placeholders que lanzan, `types.spec.ts` contra las firmas de frontend/backend; no toca los `activity-scoring.ts` viejos ni consumidores. `build` OK, `test` 19/19, `lint` 0.
- **Precondición:** E1.1 `hecho`.
- **Contexto:** `activity-scoring.ts` está hoy duplicado a mano en `lumina-frontend/src/lib/activity-scoring.ts` y `lumina-backend/src/classes/activity-scoring.ts` (~1000 líneas c/u), sincronizados por fixtures (`activity-scoring.fixtures.json`). `@lumina/scoring` será la fuente única — pero **E1.3 solo crea el paquete y fija su superficie de API**; portar la implementación y migrar consumidores es E2 (frontend) / E6 (backend).
- **Alcance — PUEDE tocar:** solo `packages/scoring/**` + su entrada en el lockfile raíz y en el job `packages` de CI.
- **Contenido mínimo:** `package.json` (`"name": "@lumina/scoring"`, mismos scripts que E1.2), tsconfig, eslint. `src/index.ts` que **declara** las firmas públicas que hoy exponen ambos `activity-scoring.ts` (funciones `calcular…` / `puntuar…` por tipo de actividad) y las exporta con una implementación placeholder que lanza `Error('no implementado — ver E2')`. Un `types.spec.ts` que fije las firmas.
- **Alcance — NO toca:** los dos `activity-scoring.ts` existentes (siguen vivos y funcionando), frontend, backend.
- **Entregable:** `pnpm --filter @lumina/scoring build && test && lint` verdes. Nada más consume el paquete todavía.
- **Cierre:** no aplica Regla 4 en E1 (los `TODO(migración-etapa-2/6)` en los `activity-scoring.ts` viejos se ponen en E2/E6, no acá).

##### E1.4 — Piloto: Botón como `ElementDefinition`
- **Operador:** Cursor (dueño del canvas / widgets)
- **Estado:** **hecho** (commit `1fcc157`) — verificado por Claude Code. `botonDefinition` con `satisfies ElementDefinition` (Regla 2 completa, sin `puntuacion`), adapters legacy→contrato, registro único en `elementRegistry`. Paridad `boton.parity.spec.tsx` cubre `crearPorDefecto` == legacy, DOM visible idéntico y acciones siguiente/anterior/ir_a/URL. `pnpm --filter @lumina/element-kit build` OK · `test` 9/9 · `lint` 0; `pnpm --filter lumina-frontend lint` 0 err · `build` OK; `install --frozen-lockfile` consistente. `widget-registry.ts`: solo el `TODO(migración-etapa-3)` (ticket LUM-E3-BOTON, fecha 2026-10-31). Motor del canvas (`slide-renderer.tsx`/`canvas-area.tsx`/Timeline) intacto.
- **Desvíos de alcance (menores, aceptados):** (1) `lumina-frontend/package.json` — se añadió `exports["./widgets/boton"]` (necesario para el import cross-package) y se quitó el bloque `pnpm.overrides` (limpieza de E1.1, no de E1.4, pero correcta). (2) `lumina-frontend/src/types/css-modules.d.ts` nuevo (+4) para que `tsc` resuelva imports `.module.css` transitivos.
- **Nota arquitectónica para E2/E3:** `packages/element-kit` quedó con `dependencies: { "lumina-frontend": "workspace:*" }` — el kit depende del frontend entero. Válido para el piloto (adapta componentes existentes); en E3/E5 la dependencia debe **invertirse** (frontend → kit) para no dejar el grafo circular.
- **Precondición:** E1.2 `hecho`.
- **Alcance — PUEDE tocar:**
  - `packages/element-kit/src/elements/boton/**` — la `ElementDefinition` del Botón: `crearPorDefecto` (envuelve `createDefaultBoton` de `boton-defaults.ts`), `Editor` / `Viewer` / `Propiedades` (adaptan los componentes existentes de `lumina-frontend/src/components/widgets/boton/` a las props del contrato), `apariencia`; **sin** `puntuacion` (el Botón no puntúa). Registro vía `ElementRegistry.registrar(botonDefinition)` en el arranque del paquete.
  - `packages/element-kit/src/elements/boton/boton.parity.spec.tsx` — vitest + testing-library: renderiza el Botón **viejo** y el **nuevo** con el mismo estado y compara la salida visible (DOM, `aria-*`, y las acciones siguiente / anterior / ir-a / URL). Reutiliza los specs actuales del Botón si existen.
  - `lumina-frontend/src/components/widgets/boton/**` — **solo** si hay que exportar algo hoy interno para que el paquete lo consuma; sin cambiar comportamiento.
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, componentes de Timeline (congelados E5); `widget-registry.ts` salvo el `TODO` de cierre; el backend. **No** desconecta el Botón viejo del canvas.
- **Entregable:** `pnpm --filter @lumina/element-kit test` incluye la prueba de paridad del Botón en verde (misma entrada → misma salida visible, Regla 7). `pnpm --filter lumina-frontend build` sigue verde. El Botón viejo sigue funcionando en el canvas sin cambios.
- **Cierre (Regla 4):** `TODO(migración-etapa-3)` en `lumina-frontend/src/components/widgets/shared/widget-registry.ts` — el Botón viejo se retira al migrar el resto de widgets (E3) — con issue/ticket y fecha. Con E1.4 `hecho` y la paridad en verde, **E1 queda cerrado**.

#### E2 — Migrar actividades · **CERRADA** — commits `95d10b2` (E2.1) / `159c6af` (E2.2) / `a6522c9` (E2.3) / `30ed4e5` (E2.4) / `dfae1fc` (E2.5)
Las 5 sub-fichas en `hecho`. `@lumina/scoring` es la fuente única del frontend (fachada + `TODO(mig-etapa-5)`); `elementRegistry` tiene **23 elementos** (Botón + Anagrama + 12 Grupo 4 + 10 clásicas). Los dos sistemas viejos siguen vivos con `TODO(migración-etapa-5)` en cada fila de `ACTIVITY_REGISTRY` y junto al `switch` de `slide-renderer.tsx` — se retiran en E5 (Regla 4). El espejo `lumina-backend/src/classes/activity-scoring.ts` se reapunta en E6.
<details><summary>Contexto histórico de E2</summary>

Objetivo (Regla 1): fusionar en `ElementRegistry` los **dos** sistemas de actividad que hoy conviven, y conectar `@lumina/scoring`.
Estado real del repo a tener a la vista:
- **Familia A — "clásicas"** (`lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/*.tsx`): `quiz_multiple`, `verdadero_falso`, `completar_blancos`, `arrastrar_soltar`, `emparejar`, `ordenar_pasos`, `video_interactivo`, `short_answer`, `encuesta_viva`, `nube_palabras`, + escape-room / torneo. **No tienen registro**: las despacha un `switch` en `slide-renderer.tsx` — **congelado para E5**.
- **Familia B — "Grupo 4"** (`lumina-frontend/src/components/activities/*`): `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`, `crucigrama`, `abrir_caja`, `anagrama`, `ahorcado`, `puzzle_palabras`, `globos`, `topo`, `historia_ramificada`. Registradas en `ACTIVITY_REGISTRY` (`lumina-frontend/src/components/activities/shared/activity-registry.ts`, 12 entradas con `tipo/panelType/nombre/…/editor/viewer/properties/createDefault/evaluable`).
- **Scoring duplicado a mano**: `lumina-frontend/src/lib/activity-scoring.ts` y `lumina-backend/src/classes/activity-scoring.ts` (~1000 líneas c/u), sincronizados byte-a-byte por `activity-scoring.fixtures.json`. `@lumina/scoring` (stub de E1.3) declara las 15 firmas públicas.
- **`activity-registry.ts` lo consume `slides-panel.tsx`** (el panel de drag&drop) → no se puede borrar en E2; su retiro es E5. Cierre E2 (Regla 4) = `TODO(migración-etapa-5)` en `activity-registry.ts` + ticket.
Orden ejecutado: **E2.1 → E2.2 → E2.3 → E2.4 → E2.5** (E2.4 ∥ E2.5 se intentó en paralelo y colisionó en el plumbing del kit — Regla 10, ver E2.5).

##### E2.1 — Portar la implementación real a `@lumina/scoring`
- **Operador:** Claude Code
- **Estado:** en revisión — `packages/scoring/src/index.ts` es ahora la copia verbatim de `lumina-frontend/src/lib/activity-scoring.ts` (funciones puras, sin imports). `activity-scoring.fixtures.json` copiada byte-a-byte; `scoring.spec.ts` portado del spec del frontend. `types.spec.ts` verifica la superficie pública contra **ambos** `activity-scoring.ts` (frontend y backend) vía AST — pasa. `tsconfig` + `resolveJsonModule`. Verif: `pnpm --filter @lumina/scoring build && test && lint` → build OK, **93/93** tests (2 files), lint 0. Solo se tocó `packages/scoring/**`. Sin consumidores todavía (E2.2).
- **Precondición:** E1 cerrada.
- **Alcance — PUEDE tocar:** solo `packages/scoring/**`.
- **Contenido:** reemplazar los `noImplementado()` de `packages/scoring/src/index.ts` por la implementación real, **portada tal cual** desde `lumina-frontend/src/lib/activity-scoring.ts` (ya está lint-limpio y con tests). Traer `activity-scoring.fixtures.json` (o un import) como suite del paquete. Mantener exactamente las 15 firmas ya declaradas.
- **Alcance — NO toca:** los dos `activity-scoring.ts` existentes (siguen vivos), frontend, backend, `slide-renderer.tsx`.
- **Entregable:** `pnpm --filter @lumina/scoring build && test && lint` verdes; los fixtures de paridad pasan **dentro** del paquete (mismos casos que `lumina-frontend/src/lib/activity-scoring.spec.ts`, 31+). Sin consumidores todavía.
- **Cierre:** no aplica Regla 4.

##### E2.2 — El frontend consume `@lumina/scoring`
- **Operador:** Claude Code
- **Estado:** en revisión — `lumina-frontend/src/lib/activity-scoring.ts` es ahora una fachada de 1 línea (`export * from '@lumina/scoring'`) + `TODO(migración-etapa-5)` (ticket `LUM-E5-SCORING-FACADE`, fecha 2026-11-30). Los 24 imports de `@/lib/activity-scoring` no se tocan. Verif: `@lumina/scoring` test 93/93 · `lumina-frontend` lint 0 / **test:unit 446/446** (`activity-scoring.spec.ts` sigue verde vía la fachada) / build OK · `lumina-backend` test **243/243** intacto.
- **Desvíos de alcance (necesarios, aceptados):** consumir un paquete TS interno del workspace requirió: (1) `packages/scoring/package.json` `exports` → `./src/index.ts` (paquete interno, se consume desde fuente; `build` sigue para el job `packages`); (2) `lumina-frontend/next.config.ts` `transpilePackages: ['@lumina/scoring']`; (3) `lumina-frontend/package.json` dep `"@lumina/scoring": "workspace:*"`; (4) `packages/scoring/src/types.spec.ts` — la comparación de superficie pública ahora es solo contra el espejo **backend** (el frontend ya es fachada) + un check de que la fachada es re-export puro. Este patrón queda establecido para E2.3+ / E3.
- **Alcance — PUEDE tocar:** `lumina-frontend/src/lib/activity-scoring.ts` (+ su `package.json` para la dep `@lumina/scoring`), y los imports internos que lo usen **solo si** hace falta reapuntarlos.
- **Contenido:** `lumina-frontend/src/lib/activity-scoring.ts` pasa a **re-exportar** desde `@lumina/scoring` (API pública idéntica — mismos nombres, mismas firmas). No se borra el archivo: queda como fachada + `TODO(migración-etapa-2)`… no — **`TODO(migración-etapa-5)`** (se elimina la fachada cuando E5 termine de reapuntar consumidores) con ticket y fecha.
- **Alcance — NO toca:** `lumina-backend/src/classes/activity-scoring.ts` (es E6), `slide-renderer.tsx`, cualquier componente de actividad.
- **Entregable:** `pnpm --filter lumina-frontend lint` 0 err · `test:unit` sin bajar el conteo (la suite `activity-scoring.spec.ts` sigue verde apuntando a la fachada) · `build` OK. `pnpm --filter lumina-backend test` intacto (243).
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` en `lumina-frontend/src/lib/activity-scoring.ts` — fachada a borrar cuando no queden imports directos — + ticket con fecha.

##### E2.3 — Piloto: Anagrama como `ElementDefinition` (con `puntuacion`)
- **Operador:** Cursor (dueño del editor / actividades)
- **Estado:** **hecho** (commit `a6522c9`) — verificado por Claude Code. `anagramaDefinition satisfies ElementDefinition` (Regla 2 completa, con `puntuacion`); adapters legacy→contrato (Editor/Viewer/Propiedades sin cambio de comportamiento); `puntuacion` = `evaluateActivityResponse('anagrama', estado, respuesta).score ?? 0` de `@lumina/scoring`. Registro único en `elementRegistry`. `anagrama.parity.spec.tsx`: 4 casos de scoring comparan `correct`/`score`/`details` contra `evaluateActivityResponse` + paridad de DOM de Editor/Viewer (`withFixedRandom`). Verif: `@lumina/element-kit` build/lint OK · test **14/14** · `@lumina/scoring` 93/93 · `lumina-frontend` lint 0 / test:unit 446/446 / build OK.
- **Cambio de contrato (aceptado, avisar):** `PuntuacionDelegate<TState>` pasó de `(estado) => number` a `(estado, respuesta?: unknown) => number` en `packages/element-kit/src/contract.ts`. Es la extensión mínima correcta — puntuar una actividad necesita la respuesta del alumno, no solo el estado; `respuesta?` es opcional (el Botón no la usa). `registry.spec.ts` actualizado. Fuera del alcance declarado de E2.3 (`elements/anagrama/**`) pero necesario y aditivo.
- **Plumbing (patrón E1.4):** `packages/element-kit/{tsconfig*,vitest.config.ts,src/index.ts}` + `src/shims/lumina-frontend-anagrama.d.ts` para enganchar el elemento; `packages/element-kit/package.json` dep `@lumina/scoring`; `lumina-frontend/package.json` subpath `./activities/anagrama`; `lumina-frontend/src/components/activities/anagrama/index.ts` (re-export puro).
- **Contexto:** primer elemento **evaluable** sobre el contrato — ejercita el delegado `puntuacion` que el piloto Botón (E1.4) no usó. `Anagrama` es la actividad evaluable más simple (`AnagramaActivity`, `createDefaultAnagrama` en `lumina-frontend/src/lib/anagrama-defaults.ts`, componentes en `lumina-frontend/src/components/activities/anagrama/`). Piloto provisional salvo que el informe «Plano Lumina» (Etapa 2) indique otro.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/anagrama/**` (definición + adapters `AnagramaEditor/Viewer/Properties` → props del contrato + `puntuacion` que llama a `evaluateActivityResponse`/`notaColombiana` de `@lumina/scoring`), su `parity.spec.tsx`, registro en `elementRegistry`. `lumina-frontend/src/components/activities/anagrama/**` **solo** si hay que exportar algo interno (sin cambiar comportamiento). `lumina-frontend/package.json` `exports` si hace falta el subpath (como el Botón en E1.4).
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, Timeline (congelados E5); `activity-registry.ts` salvo su `TODO` de cierre; `slides-panel.tsx`; el backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` incluye la paridad de Anagrama en verde — misma actividad + misma respuesta → **mismo `correct` y mismo `score`** que hoy (Regla 7), y editor/viewer con el mismo DOM visible. `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-3)`… **`etapa-5`** en `activity-registry.ts` para la fila `anagrama` (se retira cuando E5 conecte `ElementRegistry` al canvas) + ticket.

##### E2.4 — Migrar el resto de Grupo 4 (11 actividades) a `ElementDefinition`
- **Operador:** Cursor · puede ir **en paralelo con E2.5**
- **Estado:** **hecho** (commit `30ed4e5`) — verificado por Claude Code. 11 `ElementDefinition` (clasificar, memoria, puzzle_imagen, sopa_letras, crucigrama, abrir_caja, ahorcado, puzzle_palabras, globos, topo, historia_ramificada), patrón idéntico a Anagrama (E2.3): `satisfies ElementDefinition`, `puntuacion` → `evaluateActivityResponse('<tipo>', estado, respuesta).score ?? 0` de `@lumina/scoring`, adapters legacy→contrato, `evaluar<Tipo>` exportado, `<tipo>.parity.spec.tsx` por actividad. `TODO(migración-etapa-5)` en las 12 filas de `ACTIVITY_REGISTRY` (ticket `LUM-E5-GRUPO4`, 2026-11-30). Scope limpio (solo `packages/element-kit/**` + `package.json` exports + barrels `components/activities/*/index.ts` + los TODO). Verif: `@lumina/element-kit` build/lint OK · test **69/69** (14 files) · `@lumina/scoring` 93/93 · `lumina-frontend` lint 0 / build OK.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/<tipo>/**` para `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`, `crucigrama`, `abrir_caja`, `ahorcado`, `puzzle_palabras`, `globos`, `topo`, `historia_ramificada` (mismo patrón que E2.3, reutilizando adapters); registro de cada una en `elementRegistry`; `lumina-frontend/src/components/activities/<tipo>/**` solo para exports internos.
- **Alcance — NO toca:** `slide-renderer.tsx`, `slides-panel.tsx`, `activity-registry.ts` (salvo `TODO` de cierre por fila), backend, cluster congelado E5.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — una prueba de paridad por actividad (respuesta → `correct`/`score` idénticos; DOM visible idéntico). `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** cada fila migrada de `ACTIVITY_REGISTRY` queda con su `TODO(migración-etapa-5)` (retiro al conectar el registro al canvas) o, si `slides-panel.tsx` ya puede leer del `ElementRegistry`, se borra la fila. Ticket paraguas + fecha.

##### E2.5 — Registrar la familia "clásica" (quiz / V-F / blancos / … ) como `ElementDefinition`
- **Operador:** Claude Code + Cursor · puede ir **en paralelo con E2.4**
- **Estado:** **hecho** (commit `dfae1fc`) — hecho en 2 tranches. **T1** (frontend): `activity-templates.ts` (10 plantillas de "actividad nueva" extraídas de `editor-client.tsx`), `element-kit-classic.ts` (barrel: 10 plantillas + 10 pares Editor/Viewer + tipo `Activity`), subpath `./editor-activities` en `package.json`, `editor-client.tsx` importa las plantillas (−132 líneas). **T2** (element-kit): `_shared/classic-adapters.tsx` (`crearAdaptadoresClasicos` — `Propiedades` = el editor legacy, estas actividades editan inline), 10 `ElementDefinition` (`quiz_multiple`, `verdadero_falso`, `completar_blancos`, `arrastrar_soltar`, `emparejar`, `ordenar_pasos`, `video_interactivo`, `short_answer`, `encuesta_viva`, `nube_palabras`) con `puntuacion` → `evaluateActivityResponse` (para `short_answer`/`encuesta_viva`/`nube_palabras` el score es `null` → `puntuacion` devuelve 0), registro en `elementRegistry` (23 elementos), 1 shim + 1 alias (×3 configs), `clasicas.parity.spec.tsx` parametrizado (delegado del kit == scoring + render smoke de Editor/Viewer/Propiedades). **Regla 4:** `TODO(migración-etapa-5)` (comentario) junto al `switch` de `slide-renderer.tsx` — ticket `LUM-E5-CLASICAS`, 2026-11-30. Verif: `@lumina/element-kit` build/lint OK · test **109/109** (15 files) · `lumina-frontend` lint 0 / test:unit 446/446 / build OK · `@lumina/scoring` 93/93.
- **Aprendizaje (Regla 10):** E2.4 ∥ E2.5 NO eran disjuntas — comparten `packages/element-kit/src/index.ts`, `tsconfig*`, `vitest.config.ts`, `lumina-frontend/package.json`. Cuando dos fichas escriben en el mismo kit van **secuenciales**, salvo que el registro se auto-colecte (cada `elements/<tipo>/register.ts` importado dinámicamente en vez de listado a mano). A evaluar para E3+.
- **Contexto:** estas actividades **no tienen registro** hoy — las despacha el `switch` de `slide-renderer.tsx` (congelado E5). E2.5 crea sus `ElementDefinition` en el kit **sin reescribir el switch**; conectarlas al canvas es E5.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/<tipo>/**` para `quiz_multiple`, `verdadero_falso`, `completar_blancos`, `arrastrar_soltar`, `emparejar`, `ordenar_pasos`, `video_interactivo`, `short_answer`, `encuesta_viva`, `nube_palabras` (adapters de los componentes en `.../editor/components/activities/*.tsx`, `puntuacion` → `@lumina/scoring`); registro en `elementRegistry`; exports internos de esos componentes si hace falta.
- **Alcance — NO toca:** `slide-renderer.tsx` ni su `switch` (E5), `canvas-area.tsx`, backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — paridad por actividad (`correct`/`score` y DOM). `pnpm --filter lumina-frontend build` verde. El `switch` de `slide-renderer.tsx` sigue despachando sin cambios.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` en `slide-renderer.tsx` (junto al `switch`) enumerando los tipos ya disponibles en `ElementRegistry` para que E5 los reconecte y borre el `switch`. Ticket + fecha.
</details>

#### E3 — Migrar widgets · **CERRADA** — commits `2ba8e93` (E3.1) / `0b45e11` (E3.2) / `c657d65` (E3.3) / `a39f2af` (E3.4)
Las 4 sub-fichas en `hecho`. Los **12 widgets** (11 + Botón de E1.4) son `ElementDefinition` en `elementRegistry`, todos **sin `puntuacion`**, con prueba de paridad de DOM (Regla 7). `widget-registry.ts` sigue vivo (lo consumen paneles y el `switch` de `slide-renderer.tsx`, congelados E5) con `TODO(migración-etapa-5)` por fila (ticket `LUM-E5-WIDGETS`, 2026-12-31) — se retira en E5/E7 (Regla 4). El motor del canvas (`slide-renderer.tsx` / `canvas-area.tsx` / Timeline `.tsx`) quedó intacto.
<details><summary>Contexto histórico de E3</summary>

Objetivo (Regla 1): migrar los widgets del sistema viejo a `ElementDefinition` del kit, piloto **Ruleta**. El **Botón ya se migró en E1.4** — quedan **11**.
Estado real del repo a tener a la vista:
- **`widget-registry.ts`** (`lumina-frontend/src/components/widgets/shared/widget-registry.ts`) es fino: `WIDGET_TIPOS` (12: `flip-cards`, `tabs`, `carousel`, `click-reveal`, `timeline`, `popup`, `hotspot`, `tooltip`, `boton`, `contador`, `progreso`, `ruleta`), `WIDGET_LABELS`, el union `WidgetBlock` y guards. **No** tiene Editor/Viewer por widget — el dispatch está en el `switch` de `slide-renderer.tsx` (**congelado E5**).
- Cada widget vive en `lumina-frontend/src/components/widgets/<tipo>/` con `*-editor.tsx` / `*-viewer.tsx` / `*-properties.tsx` / `*-config.ts` / `*-defaults.ts` (`createDefault<Tipo>Widget(marco?)` + `normalize<Tipo>Block`). El Botón (E1.4) ya expone `lumina-frontend/src/components/widgets/boton/index.ts` + subpath `./widgets/boton`.
- **Consumidores de `widget-registry.ts`**: `flyout-panel.tsx`, `panels/activities-panel.tsx`, `panels/flyout-left-panels.tsx` (**congelado E5**), `panels/widget-panel-catalog.ts`, `panels/widgets-insert-panel.tsx`, `slide-renderer.tsx` (**congelado E5**), `lib/activity-canvas-position.ts`, `widgets/shared/index.ts` → no se puede borrar `widget-registry.ts` en E3; su retiro es E5/E7. Cierre E3 (Regla 4) = `TODO(migración-etapa-5)` por fila de widget migrado + ticket.
- **Los widgets no puntúan** — sus `ElementDefinition` van **sin `puntuacion`** (igual que el Botón en E1.4). `ruleta` es `exclude` en scoring.
- **Familias** (no unificar el comportamiento entre ellas, ver `lumina-frontend/CLAUDE.md`): Lienzo/Captivate (Flip Cards, Tabs, Carousel, Click to Reveal, Timeline), Overlay modal (Popup), Control/burbuja (Hotspot, Tooltip, Botón✅, Contador, Barra=`progreso`).
Orden: **E3.1 → E3.2 → E3.3 → E3.4** (secuencial — todas escriben `packages/element-kit/src/index.ts` + `tsconfig*`/`vitest.config.ts`; un solo operador). Patrón por widget = el del Botón (E1.4): `<tipo>-definition.ts` (`satisfies ElementDefinition`, **sin** `puntuacion`), `<tipo>-adapters.tsx` (legacy→contrato), `<tipo>-types.ts` (`Estado` = el bloque de widget, `Config` de runtime), `register.ts`, `index.ts`, `<tipo>.parity.spec.tsx` (DOM visible idéntico legacy vs kit, Regla 7), shim `.d.ts`, alias en los 3 configs, entrada en `src/index.ts`. E3 cierra con las 4 en `hecho` y los 12 widgets (11 + Botón) con `TODO(migración-etapa-5)` en `widget-registry.ts`.

##### E3.1 — Piloto: Ruleta como `ElementDefinition` (sin `puntuacion`)
- **Operador:** Cursor (dueño del canvas / widgets)
- **Estado:** **hecho** (commit `2ba8e93`) — verificado por Claude Code. `ruletaDefinition satisfies ElementDefinition` (sin `puntuacion`, correcto — los widgets no puntúan), adapters patrón Botón (E1.4: `block`/`onEnsureBlockSelected` no-op/`applyNow`→`onChange`), barrel `widgets/ruleta/index.ts` + subpath `./widgets/ruleta`, shim + alias ×3, registro único. Spec `ruleta.parity.spec.tsx`: DOM visible idéntico legacy vs kit en Editor y Viewer. Regla 4: `TODO(migración-etapa-5)` en `widget-registry.ts` (ticket `LUM-E5-WIDGETS`, 2026-12-31). Verif: `@lumina/element-kit` build/lint OK · test **113/113** (16 files) · `lumina-frontend` lint 0 / build OK.
- **Precondición:** E2 cerrada.
- **Contexto:** Ruleta espeja al Botón — `RuletaWidget` en `@/types/widget.types`, `createDefaultRuletaWidget(marco?)` + `normalizeRuletaBlock` en `lumina-frontend/src/components/widgets/ruleta/ruleta-defaults.ts`, componentes `ruleta-editor.tsx` / `ruleta-viewer.tsx` / `ruleta-properties.tsx` (+ `ruleta-wheel.tsx`). `ruleta` sigue `exclude` en scoring.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/ruleta/**` (definición + adapters + parity spec + registro en `elementRegistry`), su shim `src/shims/lumina-frontend-ruleta.d.ts`, el alias `lumina-frontend/widgets/ruleta` en `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts`, `packages/element-kit/src/index.ts`. Crear `lumina-frontend/src/components/widgets/ruleta/index.ts` (barrel, re-export puro, como el del Botón) + subpath `./widgets/ruleta` en `lumina-frontend/package.json`.
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, `flyout-left-panels.tsx`, componentes de Timeline (congelados E5); `widget-registry.ts` salvo el `TODO` de cierre de la fila `ruleta`; el backend; `@lumina/scoring`.
- **Entregable:** `pnpm --filter @lumina/element-kit test` con la paridad de Ruleta en verde (mismo estado → mismo DOM visible que el widget legacy en Editor y Viewer, Regla 7; sin `puntuacion`). `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` en `widget-registry.ts` para la fila `ruleta` (se retira cuando E5 conecte `ElementRegistry` al canvas) + ticket con fecha.

##### E3.2 — Familia Control/burbuja (Hotspot, Tooltip, Contador, Barra)
- **Operador:** Cursor
- **Estado:** **hecho** (commit `0b45e11`) — verificado por Claude Code. hotspot/tooltip/contador/progreso como `ElementDefinition` sin `puntuacion` (los parity spec lo asertan), patrón Ruleta/Botón (`block`/`onEnsureBlockSelected` no-op/`applyNow`→`onChange`; hotspot con `innerSelection`). Barrels + subpaths + shims + aliases ×3 + registro único. Paridad de DOM por widget. `TODO(migración-etapa-5)` por fila en `widget-registry.ts` (`LUM-E5-WIDGETS`, 2026-12-31). Verif: `@lumina/element-kit` build/lint OK · test **129/129** (20 files) · `lumina-frontend` lint 0 / build OK.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/<tipo>/**` para `hotspot`, `tooltip`, `contador`, `progreso` (mismo patrón que E3.1, sin `puntuacion`); sus shims + aliases + `src/index.ts`; `lumina-frontend/src/components/widgets/<tipo>/index.ts` barrels + subpaths en `package.json`. El Botón ya está (E1.4).
- **Alcance — NO toca:** el motor del canvas / paneles congelados E5; `widget-registry.ts` salvo los `TODO`; backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — una paridad de DOM por widget. `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` por fila en `widget-registry.ts` (ticket paraguas `LUM-E5-WIDGETS` + fecha 2026-12-31).

##### E3.3 — Familia Lienzo/Captivate (Flip Cards, Tabs, Carousel, Click to Reveal, Timeline)
- **Operador:** Cursor
- **Estado:** **hecho** (commit `c657d65`) — verificado por Claude Code. flip-cards/tabs/carousel/click-reveal/timeline como `ElementDefinition` sin `puntuacion` (parity specs lo asertan). **Timeline: componentes `.tsx` NO editados** — solo barrel `timeline/index.ts` + adapter que envuelve (constraint E5 respetada); su parity spec es DOM real (defaults + normalización + edición inline + Propiedades), no render-smoke. Barrels/subpaths/shims/aliases ×3 + registro único. `TODO(migración-etapa-5)` por fila en `widget-registry.ts` (10 filas). Verif: `@lumina/element-kit` build/lint OK · test **164/164** (25 files) · `lumina-frontend` lint 0 / build OK (los "Attempted import error" de `victory-vendor/d3-shape` son pre-existentes, no de E3.3).
- **Contexto:** widgets con header + `configuracion` + edición inline + `normalize*` al hidratar el slide (`class-slide-normalize.ts`). **Timeline** está en el cluster congelado E5 (`react-hooks` del canvas): se **envuelve sin editar** sus componentes (como E2.5 con el `switch`); si el wrap necesita tocarlos, se para y se deja `bloqueado por E5`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/<tipo>/**` para `flip_cards`/`flip-cards`, `tabs`, `carousel`, `click_reveal`/`click-reveal`, `timeline`; shims + aliases + `src/index.ts`; barrels `lumina-frontend/src/components/widgets/<tipo>/index.ts` + subpaths. **No** editar los `.tsx` de Timeline.
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, `flyout-left-panels.tsx`, la lógica interna de los componentes de Timeline (solo re-export); backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — paridad de DOM por widget (para Timeline, al menos render-smoke si el DOM completo no es estable en jsdom). `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` por fila en `widget-registry.ts`.

##### E3.4 — Overlay Popup
- **Operador:** Cursor
- **Estado:** **hecho** (commit `a39f2af`) — `popupDefinition satisfies ElementDefinition` sin `puntuacion` (patrón Ruleta E3.1); adapters legacy→contrato (`innerSelection` local, `onEnsureBlockSelected` no-op, `applyNow`→`onChange`); `crearPorDefecto = createDefaultPopupBlock`. Barrel `widgets/popup/index.ts` (re-export puro) + subpath `./widgets/popup`; shim + alias ×3 (tsconfig / tsconfig.build / vitest) + registro único en `elementRegistry`. `popup.parity.spec.tsx`: `crearPorDefecto` == legacy y DOM visible idéntico en Editor / Viewer / Viewer thumbnail — el portal a `.canvas-slide` no monta sin `SlideCanvasRoot`, el trigger cerrado (default `triggerEvento: 'click'`) rinde igual en jsdom; se asserta sin `puntuacion`. Regla 4: `TODO(migración-etapa-5)` en `widget-registry.ts` fila `popup` (`LUM-E5-WIDGETS`, 2026-12-31). Verif: `pnpm --filter @lumina/element-kit build` OK · `lint` 0 · `test` **169/169** (26 files) · `pnpm --filter lumina-frontend build` OK · `lint` 0 err (70 warnings). Con E3.4 `hecho` y los 12 widgets con su `TODO`, **E3 queda cerrada**.
- **Contexto:** Popup hace portal a `.canvas-slide` + backdrop y bloquea el slide (`lumina-frontend/CLAUDE.md` §widgets). El adapter lo envuelve tal cual; para la parity spec puede requerir montar un `.canvas-slide` de prueba o un render-smoke.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/popup/**`; shim + alias + `src/index.ts`; `lumina-frontend/src/components/widgets/popup/index.ts` barrel + subpath.
- **Alcance — NO toca:** el motor del canvas / paneles congelados; `widget-registry.ts` salvo el `TODO`; backend. (Ojo: `popup-parts.tsx` tuvo un fix de `react-hooks/static-components` en L.2 — no re-tocar esa parte.)
- **Entregable:** `pnpm --filter @lumina/element-kit test` con Popup en verde (render-smoke aceptable si el portal no rinde en jsdom). `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` en `widget-registry.ts` fila `popup`. Con E3.4 `hecho` y los 12 widgets con su `TODO`, **E3 queda cerrada**.
</details>

#### E4 — Migrar bloques de canvas y formas vectoriales (editor Paper.js) · **CERRADA** — commits `0a6b8e3` (E4.1) / `8d776ea` (E4.2) / `29826a5` (E4.3) / `4b8d5f9` (E4.4) / E4.5 (check shim↔real + riesgo aceptado de paridad canvas + scoring)
E4.1–E4.5 en `hecho`. `grafico` · `diagrama` · `clip-group` (+ `PaperNodeEditor` para el editor de nodos) son `ElementDefinition` en `elementRegistry`, sin `puntuacion`. `slide-renderer.tsx` sigue despachando por el `switch` (congelado E5) con `TODO(migración-etapa-5)` + `RIESGO ACEPTADO (E4.5 §2)` por `case`: **E5 no borra los `case` de bloques con canvas sin cobertura de integración real**. Los 8 primitivos (`texto`…`columnas`) NO se migraron en E4 (E4.6 → E5, viven dentro del archivo congelado). `shims.types.spec.ts` guarda contra la putrefacción de shims. **Falta: redactar la ficha raíz de E5 (Cursor).**
Objetivo (Regla 1): migrar a `ElementDefinition` del kit los **bloques de canvas** que todavía no son elementos, y el **editor vectorial Paper.js**. Piloto: **Gráfico de datos** (`grafico`) — es el bloque no-widget con el split editor/viewer/properties/defaults ya hecho, como los widgets de E3.

**Estado real del repo a tener a la vista (relevado al cerrar E3):**

- **El `Block` union viejo** (`lumina-frontend/src/types/slide.types.ts:1306`) tiene 24 miembros. Ya son `ElementDefinition` (E1–E3, aún despachados por el `switch` congelado): los 12 widgets (`flip-cards`, `tabs`, `carousel`, `click-reveal`, `popup`, `timeline`, `hotspot`, `tooltip`, `boton`, `contador`, `progreso`, `ruleta`) y, vía `ActivityBlock` (`tipo: 'actividad'`), las 23 actividades de E2. **Faltan migrar en E4** estos 11 `tipo`:
  - **Con componente propio ya separado** (patrón E3, migración directa): `grafico` (`src/components/graficos/` — `grafico-editor/viewer/properties/defaults.ts` + `grafico-defaults.spec.ts`), `diagrama` (`src/components/diagramas/` — `diagrama-editor/viewer/properties`, `diagrama-defaults.ts` + specs, `diagrama-bridge.ts`, `venn-svg.tsx`; el `Block` es `DiagramaBlock` = union de `DiagramaGrafoBlock` | `DiagramaVennBlock`).
  - **Forma vectorial**: `clip-group` (`ClipGroupBlock`, `slide.types.ts:1021`) — máscara/recorte libre. Render en `src/app/(app)/classes/[id]/editor/components/render-clip-group.tsx` (610 líneas); editor de nodos en **`clip-path-node-editor-paper.tsx`** (591 líneas, **único consumidor de `paper` 0.12.18**, `dynamic()` desde `render-clip-group.tsx`); lógica pura en `src/lib/freeform-mask.ts` (331 líneas).
  - **Primitivos sin split** — hoy son funciones `RenderText` / `RenderImage` / `RenderVideo` / `RenderAudio` / `RenderCode` / `RenderQuote` / `RenderDivider` / `RenderColumns` **dentro de `slide-renderer.tsx`** (2800 líneas, **congelado para E5**): `texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `columnas`. No tienen `-defaults.ts` público ni panel separado (el panel vive en `panels/properties-panel.tsx`).
- **No hay `block-registry`** — el dispatch es el `switch (block.tipo)` de `slide-renderer.tsx:1696` (mismo switch que ya despacha widgets y actividades; **congelado E5**). Reconectar el canvas al `ElementRegistry` es E5.
- **Contrato del editor de canvas vigente** (Regla 0 §2): `.cursorrules` + `.cursor/rules/lumina-canvas-editor-contracts.mdc` — `getBlockPos` → transformar → `clamp` → persistir → historial. Ningún paso de E4 reimplementa posicionamiento; los adapters envuelven editor/viewer tal como E3.
- Los bloques de canvas **no puntúan** → sus `ElementDefinition` van **sin `puntuacion`** (como los widgets).

**Tensión declarada — a resolver ANTES de asignar E4.4 y E4.5 (no la decide el operador, Regla 10):**

1. **`slide-renderer.tsx` está congelado para E5** (cluster `react-hooks` del React Compiler). Los primitivos (`texto`…`columnas`) viven *dentro* de ese archivo. Dos caminos: **(a)** E4 migra solo lo que ya tiene componente propio (`grafico`, `diagrama`, `clip-group` + Paper.js) y **difiere los 8 primitivos a E5**, que los extrae al descongelar el switch; **(b)** se abre un carve-out explícito del freeze para extraer los `Render*` primitivos a archivos propios sin tocar los hooks del canvas. **Recomendación de la ficha raíz: (a)** — mantiene E4 acotada y no pelea con el freeze. Bajo (a), E4.6 abajo no existe hasta E5.
2. **Regla 1 dice "cerradas *con el código viejo borrado*"** para E2/E3, pero E2/E3 cerraron con `TODO(migración-etapa-5)` (el `switch` es de E5). Si se exige el borrado literal, E4 está bloqueada por E5 y E5 por E4 (deadlock). **Lectura de la ficha raíz:** "cerrada" = cierre por Regla 4 (TODO + ticket) es suficiente para empezar E4; el borrado real del `switch` sigue siendo E5. Confirmar esta lectura al activar E4.

**Orden (secuencial — todas escriben `packages/element-kit/src/index.ts` + `tsconfig*` + `vitest.config.ts`; un operador):** E4.1 → E4.2 → E4.3 → E4.4 → E4.5. Patrón por bloque = el de E3: `<tipo>-definition.ts` (`satisfies ElementDefinition`, **sin** `puntuacion`), `<tipo>-adapters.tsx` (legacy→contrato: `block`→`estado`, `onEnsureBlockSelected` no-op, `applyNow`→`onChange`), `<tipo>-types.ts` (`Estado` = el `Block`, `Config` de runtime con `isThumbnail?`), `register.ts`, `index.ts`, `<tipo>.parity.spec.tsx` (DOM visible idéntico legacy vs kit, Regla 7), shim `.d.ts`, alias en los 3 configs, barrel `index.ts` + subpath en `lumina-frontend/package.json`. Cierre por bloque (Regla 4): `TODO(migración-etapa-5)` junto al `case` correspondiente del `switch` de `slide-renderer.tsx` (ticket paraguas `LUM-E5-CANVAS-BLOCKS` + fecha). E4 cierra con E4.1–E4.5 en `hecho` y los 4 `tipo` (`grafico`, `diagrama`, `clip-group`, + Paper.js) con su `TODO`.

**Disciplina de barrel (aprendizaje E3.4/E4.1/E4.3):** el barrel `lumina-frontend/src/components/<x>/index.ts` es **re-export puro**. Un helper que el `crearPorDefecto` necesite (p. ej. envolver un `createDefault*` que exige argumentos) va en el módulo del frontend, no en el barrel. Cambios de comportamiento en el adapter (colapsar un debounce, ignorar una prop) se anotan en la ficha, no se dan por implícitos. La deuda de **paridad render-smoke** (bloques con canvas: `grafico`, `diagrama`-grafo, Paper.js) y la **ausencia de check shim↔real** en el kit están registradas y se saldan en **E4.5** — E5 no borra un `case` del `switch` sin la cobertura real que E4.5 exige.

##### E4.1 — Piloto: Gráfico de datos (`grafico`) como `ElementDefinition`
- **Operador:** Cursor (dueño del editor / canvas)
- **Estado:** **hecho** (commit `0a6b8e3`) — verificado por Claude Code. `graficoDefinition satisfies ElementDefinition` sin `puntuacion` (patrón Ruleta E3.1 / Popup E3.4); adapters legacy→contrato (`block`→`estado`, `onEnsureBlockSelected` no-op, `applyNow`→`onChange`); `crearPorDefecto = createDefaultGraficoBlock`; `apariencia: { color, tipografia, animacion: false }`. Barrel `lumina-frontend/src/components/graficos/index.ts` (re-export puro — `createDefaultGraficoBlock` / `normalizeGraficoBlock` ya existían en `grafico-defaults.ts`) + subpath `./blocks/grafico`; shim + alias ×3 + registro único. `grafico.parity.spec.tsx`: `crearPorDefecto` == legacy (menos `id`), DOM idéntico en Editor y Viewer, sin `puntuacion`. **Regla 4:** `TODO(migración-etapa-5)` junto al `case 'grafico'` de `slide-renderer.tsx` (solo el comentario, 3 líneas; ticket `LUM-E5-CANVAS-BLOCKS`, 2026-12-31). Verif: `pnpm --filter @lumina/element-kit build` OK · `lint` 0 · `test` **173/173** (27 files) · `pnpm --filter lumina-frontend build` OK · `lint` 0 err (70 warnings) · `test:unit` 446/446 · `@lumina/scoring` 93/93.
  - **Desvío de alcance (menor, aceptado):** `packages/element-kit/src/vitest-setup.ts` (+14) — `vi.mock("next/dynamic")` global porque `GraficoViewer` carga Recharts con `next/dynamic` y sin el stub el suite se cuelga en jsdom. Ningún otro viewer del kit usa `next/dynamic`, así que el mock global solo afecta a Gráfico. Debió pedir ampliar la ficha (Regla 10) en vez de tocarlo directo; queda registrado, no se revierte.
  - **Observación:** con el stub de `next/dynamic`, la paridad del **Viewer** compara el `<section role="region">` + título pero el cuerpo del chart rinde `null` en ambos lados → es render-smoke para el chart (aceptable, jsdom no rinde Recharts; alineado con lo que el propio E4 root card admite para E4.2/E4.4).
- **Precondición:** E3 cerrada.
- **Contexto:** `GraficoDatosBlock` (`slide.types.ts:1201`), componentes en `lumina-frontend/src/components/graficos/` (`grafico-editor.tsx`, `grafico-viewer.tsx`, `grafico-properties.tsx`, `grafico-chart-renderer.tsx`, `grafico-color-palettes.ts`), defaults en `grafico-defaults.ts` + `grafico-defaults.spec.ts`. Renderiza con Recharts. `tipo: 'grafico'`, `case 'grafico'` en `slide-renderer.tsx:1941`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/grafico/**` (definición + adapters + parity spec + registro en `elementRegistry`), su shim `src/shims/lumina-frontend-grafico.d.ts`, alias `lumina-frontend/blocks/grafico` en `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts`, `packages/element-kit/src/index.ts`. Crear `lumina-frontend/src/components/graficos/index.ts` (barrel, re-export puro) + subpath `./blocks/grafico` en `lumina-frontend/package.json`. `lumina-frontend/src/components/graficos/**` solo para exports internos (sin cambiar comportamiento).
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, `panels/properties-panel.tsx`, componentes de Timeline (congelados E5); el `switch` salvo el `TODO` de cierre del `case 'grafico'`; el backend; `@lumina/scoring`.
- **Entregable:** `pnpm --filter @lumina/element-kit test` con la paridad de Gráfico en verde (mismo `GraficoDatosBlock` → mismo DOM visible que el bloque legacy en Editor y Viewer, Regla 7; sin `puntuacion`). `pnpm --filter lumina-frontend build` verde. Verif: `pnpm --filter @lumina/element-kit build && lint && test && pnpm --filter lumina-frontend build`.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` junto al `case 'grafico'` de `slide-renderer.tsx` (ticket `LUM-E5-CANVAS-BLOCKS` + fecha).

##### E4.2 — Diagrama (`diagrama`: grafo + Venn) como `ElementDefinition`
- **Operador:** Cursor
- **Estado:** **hecho** — implementado por Cursor (dejó el árbol sin commitear tras timeouts por correr la suite y el build del frontend en paralelo); Claude Code lo verificó en aislamiento, lo completó (commit) y cerró la ficha. `diagramaDefinition satisfies ElementDefinition` sin `puntuacion` (patrón Ruleta E3.1); adapters legacy→contrato (`block`→`estado`, `isSelected` vía `config`, `onEnsureBlockSelected` no-op, `applyNow`→`onChange` con guard `tipo === 'diagrama'`); `crearPorDefecto = createDefaultMapaMentalBlock`. Barrel `lumina-frontend/src/components/diagramas/index.ts` (re-export puro — `createDefaultMapaMentalBlock` / `createDefaultVennBlock` / `normalizeDiagramaBlock` ya existían en `diagrama-defaults.ts`) + subpath `./blocks/diagrama`; shim `DiagramaBlock` = `DiagramaGrafoBlock` | `DiagramaVennBlock`; alias ×3 + registro único. `diagrama.parity.spec.tsx` (11 casos): `crearPorDefecto` == legacy (menos `id`), Editor grafo+Venn (`isSelected` on/off), Viewer grafo+Venn (thumbnail on/off), Propiedades grafo+Venn (DOM + paridad del cambio de título con fake timers). Venn rinde SVG real; el grafo usa el stub global de `next/dynamic` (GraphCanvas → null) → render-smoke para el canvas del grafo, disclosed en el spec. **Regla 4:** `TODO(migración-etapa-5)` junto al `case 'diagrama'` de `slide-renderer.tsx` (solo comentario, 2 líneas; `LUM-E5-CANVAS-BLOCKS`, 2026-12-31). Verif (aislada, secuencial): `pnpm --filter @lumina/element-kit build` OK · `lint` 0 · `test` **184/184** (28 files, +11) · `pnpm --filter lumina-frontend build` OK · `lint` 0 err (70 warnings) · `test:unit` 446/446.
  - **Observación (no bloqueante):** `tsconfig.json` apunta `blocks/diagrama` (y `blocks/grafico` desde E4.1) al **shim**, no al source real como hacen widgets/actividades. Es deliberado: los componentes de canvas arrastran `@/types/slide.types` (union `Block` completa) + `next/dynamic`, y `tsc --noEmit` del kit aislado no debe resolver el grafo del frontend. Consistente entre los dos bloques de canvas migrados.
- **Contexto:** `DiagramaBlock` = `DiagramaGrafoBlock` (`slide.types.ts:1247`) | `DiagramaVennBlock` (`:1277`). Componentes en `src/components/diagramas/` (`diagrama-editor.tsx`, `diagrama-viewer.tsx`, `diagrama-properties.tsx`, `venn-svg.tsx`), lógica en `diagrama-defaults.ts`, `diagrama-regions.ts`, `diagrama-bridge.ts` (+ `diagrama-defaults.spec.ts`, `diagrama-regions.spec.ts`). `case 'diagrama'` en `slide-renderer.tsx:1951`. **Ojo:** `diagrama-properties.tsx` tuvo el fix `react-hooks/purity` de L.2 — no re-tocar esa parte.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/diagrama/**`; shim + alias ×3 + `src/index.ts`; `src/components/diagramas/index.ts` barrel + subpath `./blocks/diagrama`.
- **Alcance — NO toca:** el motor del canvas / paneles congelados E5; el `switch` salvo el `TODO`; backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — paridad de DOM para grafo y para Venn (dos casos). `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` junto al `case 'diagrama'`.

##### E4.3 — Forma vectorial: `clip-group` (recorte/máscara) como `ElementDefinition`, **sin** el editor Paper.js
- **Operador:** Cursor
- **Estado:** **hecho** (commit `29826a5`) — implementado por Cursor, verificado por Claude Code. `clipGroupDefinition satisfies ElementDefinition` sin `puntuacion` (patrón Ruleta E3.1); adapters legacy→contrato: `Editor`/`Viewer` envuelven `RenderClipGroup` (mismo enfoque que E3.3 con Timeline — no se edita el componente), `isSelected`/`innerEdit` vía `config`, `onShapeCommit`/`onContentCommit`/`onFillCommit`→`onChange`; `Propiedades` mapea `applyNow`/`scheduleApply` a `onChange` (guard `tipo === 'clip-group'`). `crearPorDefecto = createDefaultClipGroup()` (forma `círculo`). Barrel nuevo `lumina-frontend/src/components/clip-group/index.ts` (re-export de `@/lib/clip-path` + `render-clip-group.tsx` + `panels/clip-group-properties.tsx`) + subpath `./blocks/clip-group`; shim (207 líneas — la familia `ClipShape*`/`ClipContent*` completa) + alias ×3 + registro único. `clip-group.parity.spec.tsx` (18 casos): `crearPorDefecto` == legacy (menos `id`), Viewer × 5 formas, Editor × 5 formas (`isSelected` on/off), Propiedades (DOM normalizado por `useId`/radix/clip-path), smoke de `onShapeCommit`. **Regla 4:** `TODO(migración-etapa-5)` junto al `case 'clip-group'` de `slide-renderer.tsx` (solo comentario, 2 líneas; `LUM-E5-CANVAS-BLOCKS`, 2026-12-31). Verif (aislada): `pnpm --filter @lumina/element-kit build` OK · `lint` 0 · `test` **202/202** (29 files, +18) · `pnpm --filter lumina-frontend build` OK · `lint` 0 err (70 warnings) · `test:unit` 446/446.
  - **Observaciones (no bloqueantes):** (1) El `Editor` envuelve `RenderClipGroup` entero → el editor de nodos Paper.js (`clip-path-node-editor-paper.tsx`, cargado con `dynamic()`) viene **transitivamente**, dormido salvo `config.innerEdit`. E4.3 «sin Paper.js» = no construir su adapter de contrato (eso es E4.4), no arrancarlo de `RenderClipGroup`. Cursor no tocó el archivo. (2) El barrel define un helper `createDefaultClipGroup(shape?, contenido?)` (wrapper de 3 líneas sobre `createDefaultClipGroupBlock`, que exige `shape`) — no es re-export 100% puro. (3) `scheduleApply` del panel legacy (debounced) se colapsa a `onChange` inmediato; el spec no ejercita el debounce. E5 cablea la persistencia real.
- **Precondición:** E4.2 `hecho`.
- **Contexto:** `ClipGroupBlock` (`slide.types.ts:1021`). Render en `render-clip-group.tsx` (610 líneas). E4.3 migra el **bloque** (Editor sin el editor de nodos, Viewer, Propiedades) y deja el editor Paper.js para E4.4. `crearPorDefecto` desde el fallback de `BLOCK_FALLBACKS['clip-group']` / el default que use `render-clip-group.tsx`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/clip-group/**`; shim + alias ×3 + `src/index.ts`; barrel para `render-clip-group.tsx` (extraer a `src/components/.../clip-group/index.ts` o exponer desde donde vive hoy, **sin** moverlo a `slide-renderer`), subpath `./blocks/clip-group`. `src/lib/freeform-mask.ts` solo lectura / export.
- **Alcance — NO toca:** `clip-path-node-editor-paper.tsx` (es E4.4), `slide-renderer.tsx`, `canvas-area.tsx`, paneles congelados; backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` — paridad de DOM del Viewer y del Editor-sin-nodos. `pnpm --filter lumina-frontend build` verde.
- **Cierre (Regla 4):** `TODO(migración-etapa-5)` junto al `case 'clip-group'`.

##### E4.4 — Editor vectorial Paper.js (`clip-path-node-editor-paper.tsx`) sobre el contrato
- **Operador:** Claude Code (reasignado desde Cursor por decisión del dueño del tablero)
- **Estado:** **hecho** (commit `4b8d5f9`) — verificado dentro de E4.5 (misma tanda de Claude Code). `PaperNodeEditor` en `packages/element-kit/src/elements/clip-group/paper-editor/**`: adapter del editor de nodos legacy (`path`/`onCommit`/`onLiveChange`) al contrato, operando sobre el bloque `ClipGroup` completo (la forma entra/sale de `estado.clipShape` `tipo:'libre'`); helpers puros `esFormaLibre` / `estadoAContornoFreeform` / `contornoFreeformAEstado`. **Carga perezosa obligatoria:** `clip-path-node-editor-paper.tsx` importa `paper/dist/paper-core`, que crea un contexto `<canvas>` 2D al evaluar el módulo y **revienta en jsdom** — arrastrarlo por el barrel principal tumbaba las 30 specs del kit. Solución: subpath aislado `lumina-frontend/blocks/clip-group/paper` (nuevo `@/components/clip-group/paper.ts` + export en `package.json`) que el adapter carga con `React.lazy` (equivalente al `dynamic(ssr:false)` de `render-clip-group`); el barrel principal solo re-exporta la lógica pura de `freeform-mask` (sin efectos). Shim aparte `lumina-frontend-clip-group-paper.d.ts` + alias ×3. `paper-node-editor.parity.spec.tsx` (9 casos): render-smoke con stub del subpath — mapeo `path`↔`clipShape`, `onCommit`/`onLiveChange`→`onChange`, `null` si la forma no es `libre` — + 5 casos de lógica pura real de `freeform-mask` (idempotencia de `normalizeFreeformPath`, `resolveFreeformPath` de la forma por defecto, `freeformPathToSvgD`, round-trip). **Regla 4:** `TODO(migración-etapa-5)` del `case 'clip-group'` ampliado para mencionar `PaperNodeEditor` (E5 lo monta como sub-panel sin envolver `RenderClipGroup`). Verif (aislada): `pnpm --filter @lumina/element-kit build` OK · `lint` 0 · `test` **211/211** (30 files, +9) · `pnpm --filter lumina-frontend build` OK · `lint` 0 err (70 warnings) · `test:unit` 446/446.
- **Precondición:** E4.3 `hecho`.
- **Contexto:** `clip-path-node-editor-paper.tsx` (591 líneas) — único consumidor de `paper` 0.12.18, cargado con `dynamic()` desde `render-clip-group.tsx`. Es el editor de nodos de la máscara libre. Antigravity/Cursor tienen contrato específico en `.cursor/rules/lumina-canvas-editor-contracts.mdc`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/clip-group/paper-editor/**` (adapter del editor de nodos a las props del contrato / a un sub-panel del `Editor` de `clip-group`), su parity/render-smoke spec; `clip-path-node-editor-paper.tsx` **solo** para exports internos, sin cambiar comportamiento ni la carga `dynamic()`. `next.config.ts` ya tiene `serverExternalPackages: ['paper']` (E1.1) — no re-tocar.
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, la lógica de `freeform-mask.ts`; backend.
- **Entregable:** `pnpm --filter @lumina/element-kit test` con el editor Paper.js integrado al `Editor` de `clip-group` — **render-smoke aceptable** (Paper.js necesita `<canvas>` real; si jsdom no basta, smoke + prueba de la lógica pura de `freeform-mask.ts`). `pnpm --filter lumina-frontend build` verde (el `dynamic()` sigue resolviendo `paper`).
- **Cierre (Regla 4):** actualizar el `TODO(migración-etapa-5)` del `case 'clip-group'` para incluir el editor de nodos.

##### E4.5 — Red de seguridad de E4: check shim↔real, paridad real de bloques con canvas, `exclude` en scoring
- **Operador:** Claude Code
- **Estado:** **hecho** (commit `9d918d4`) — ejecutada por Claude Code. **(1) Check shim↔real:** `packages/element-kit/src/shims/shims.types.spec.ts` — recorre TODOS los `import … from "lumina-frontend/<subpath>"` del código del kit (29 subpaths) y exige, por cada nombre importado, que (a) el barrel real del frontend lo exporte y (b) el shim lo declare; falla con mensaje accionable si un barrel renombra/elimina algo que el kit usa. 59 casos. Limitación anotada en el archivo: es a nivel de NOMBRE, no de firma (el `tsc` del kit colapsa ambos lados al shim; el chequeo de firmas lo cubre en runtime cada `*.parity.spec.tsx` al renderizar el componente real). **(2) Paridad real de bloques con canvas → RIESGO ACEPTADO explícito:** `vitest-canvas-mock` solo ayuda a Paper (y sin salida asertable); Recharts / `@xyflow` necesitan layout que jsdom no da; Playwright CT es desproporcionado para E4.5. Se documenta el riesgo y se añade `RIESGO ACEPTADO (E4.5 §2)` en los `case` `grafico` / `diagrama` / `clip-group` de `slide-renderer.tsx`: **E5 no borra esos `case` sin cobertura de integración real** (chart / grafo / editor Paper.js legacy vs kit). **(3) Scoring:** `grafico` / `diagrama` / `clip-group` no son actividades → no están en `ACTIVITY_SCORING`, `getActivityScoringKind` devuelve `undefined`, su `ElementDefinition` no declara `puntuacion` (ya asertado en cada `*.parity.spec.tsx`). Assertion consolidada nueva en `packages/scoring/src/scoring.spec.ts` («los bloques de canvas de E4 no son actividades puntuables»). Sin cambios de runtime. Verif (aislada): `pnpm --filter @lumina/scoring build && lint && test` → **94/94** · `pnpm --filter @lumina/element-kit build && lint && test` → **270/270** (31 files, +59) · `pnpm --filter lumina-frontend lint` 0 err · `build` OK (tras limpiar `.next` — un `PageNotFoundError /_not-found` por caché stale, ajeno a E4.5) · `test:unit` 446/446. **Con E4.1–E4.5 `hecho`, E4 queda cerrada.**
- **Contexto — deuda acumulada en E4.1–E4.4, avisada pero no decidida (revisión post-E4.3):**
  - **A. Paridad = render-smoke para el cuerpo de los bloques con canvas.** `grafico` (Recharts) y `diagrama` grafo (`GraphCanvas`) rinden `null` en los specs por el stub global de `next/dynamic` (`vitest-setup.ts`, E4.1); `clip-path-node-editor-paper.tsx` (E4.4) no rinde en jsdom. Los `parity.spec` de esos tres comparan solo el chrome del wrapper — Regla 7 «misma salida visible» NO cubre el chart / grafo / máscara. Hoy no viola Regla 4 (el `switch` no se borra hasta E5), pero E5 no puede borrar esos `case` sin cobertura real primero.
  - **B. El element-kit no tiene check shim↔real.** `@lumina/scoring` tiene `types.spec.ts` (AST vs firmas reales); el kit nunca tuvo el equivalente. `blocks/*` (y `widgets/*`, `activities/*`) se tipan contra shims a mano: `tsconfig*` → shim, `vitest.config.ts` → source real. Un cambio de props en el componente real no lo caza `tsc` del kit; los shims pueden pudrirse en silencio.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/shims/**` + un `packages/element-kit/src/shims/shims.types.spec.ts` nuevo; `packages/scoring/**` (tests / tipos); `packages/element-kit/src/elements/*/*.parity.spec.tsx` (agregar cobertura, no cambiar adapters); `packages/element-kit/src/elements/*/*-definition.ts` solo si algún `apariencia` quedó inconsistente. Si hace falta un canvas real para (A), `packages/element-kit/vitest.config.ts` / dev-deps de test (`vitest-canvas-mock` o Playwright CT) — declarándolo en el commit.
- **Alcance — NO toca:** los adapters ya migrados (salvo bug), `slide-renderer.tsx`, el backend, el frontend fuera de barrels.
- **Entregable:**
  1. **`shims.types.spec.ts`** — `expectTypeOf` / AST que confirme que cada shim `blocks/*` (y retroactivamente `widgets/*` / `activities/*`) casa con el barrel real (`lumina-frontend/<subpath>`): mismos nombres exportados, firmas de `createDefault*` / componentes compatibles. Falla si un shim se desincroniza.
  2. **Paridad real de `grafico` / `diagrama`-grafo / `clip-group`+paper** — o un test con canvas real (`vitest-canvas-mock` o Playwright CT) que compare la salida visible legacy vs kit, **o**, si no es viable, una línea de **riesgo aceptado explícito** en esta ficha + un `TODO(migración-etapa-5)` en cada `case` afectado del `switch` que obligue a E5 a agregar cobertura de integración **antes** de borrarlo.
  3. **`@lumina/scoring`** — confirmar que `grafico` / `diagrama` / `clip-group` son `exclude` (como `ruleta`) y que no quedó firma pública declarada de más.
  - Verif: `pnpm --filter @lumina/scoring build && test && lint` + `pnpm --filter @lumina/element-kit build && lint && test` verdes (en aislamiento). Con E4.1–E4.5 `hecho`, **E4 queda cerrada** y se redacta la ficha raíz de E5 (Cursor).
- **Cierre:** no aplica Regla 4 (salvo los `TODO` extra del punto 2 si se toma la vía de riesgo aceptado).

##### E4.6 — Primitivos de canvas (`texto`…`columnas`) — **NO en E4** bajo la recomendación (a)
Los 8 primitivos (`texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `columnas`) viven dentro de `slide-renderer.tsx` (congelado E5). Se migran en **E5**, que los extrae al descongelar el `switch` y reconectar el canvas al `ElementRegistry`. Si al activar E4 se resuelve la «Tensión declarada §1» por el camino (b), esta ficha se reescribe como E4.6–E4.13 (una por primitivo) con el carve-out del freeze explícito.

#### E5 — Unificar estado del editor · **RAÍZ REDACTADA** · sub-fichas E5.1–E5.7 redactadas (E5.1 **revisada por Claude Code — lista para ejecutar (Codex)** · E5.2–E5.7 **pendiente de revisión**)

Objetivo (Regla 1 / informe «Plano Lumina» Etapa 5): un **reducer central** para el slide en edición, **persistencia por diferencia** (mandar el bloque cambiado + `expectedVersion` de F1.4, no el blob entero) e **historial por diferencia** (undo/redo guarda diffs, no 20 `Block[]` completos). E5 es además la etapa que **descongela** el cluster `react-hooks`/React-Compiler (`canvas-area.tsx`), **reconecta el canvas al `elementRegistry`** (retira el `switch` de `slide-renderer.tsx`), **migra los 8 primitivos** (E4.6) y **retira** los dos registros viejos + la fachada de scoring. El barrido de todo lo que quede sin referencias es E7 — E5 retira solo lo acoplado a la unificación del estado.

**Estado real del repo (relevado 2026-09-06, al cerrar E4):**

- **No existe estado central del editor.** `editor-client.tsx` (115 KB, un componente) deriva los slides de la query de clase (`cls.slides`, react-query); no hay array propio y **`useReducer` no aparece en toda la ruta del editor**. La edición de un slide vive en `canvas-area.tsx` (2002 líneas): `committedBloques` + ~10 `useState` de selección / inner-selection + `historiesRef`.
- **Persistencia = blob entero, LWW.** `use-autosave.ts` (debounce 2 s sobre `JSON.stringify(activeSlide.content)`) → `patchSlideContentById` → `PATCH /classes/:id/slides/:slideId` con el **`content` completo** y **sin `expectedVersion`**. F1.4 dejó la capacidad en backend (`classes.service.ts` — `updateMany` condicional + `409 ConflictException` con `currentVersion`) pero el canvas congelado nunca la usó → toda escritura del canvas es "última gana".
- **Historial = snapshots completos.** `lib/canvas-history.ts`: cada `SlideHistorySnapshot` guarda `bloques: Block[]` entero, `MAX_UNDO = 20`, `Map<slideId, SlideHistoryState>` en memoria de `canvas-area.tsx`, se descarta al desmontar. Sistema aparte del Sheet «Historial de versiones» (Ctrl+S → versión en servidor).
- **Dispatch del canvas = `switch (block.tipo)`** en `slide-renderer.tsx:1696` (2824 líneas, **congelado**), 24 `case`. Los 37 tipos ya son `ElementDefinition` en `elementRegistry` (12 widgets + 22 actividades + `grafico`/`diagrama`/`clip-group`) pero el `switch` los sigue despachando por componentes legacy. Hay un **segundo `switch` por `act.tipo`** (`slide-renderer.tsx:757`, "segundo registro" de actividades) con su propio `TODO(migración-etapa-5)`. Los 3 `case` de bloques con canvas llevan `RIESGO ACEPTADO (E4.5 §2)`: **no se borran sin cobertura de integración real** (chart / grafo / Paper.js legacy vs kit).
- **8 primitivos sin migrar (E4.6):** `texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `columnas` — funciones `Render*` **dentro de** `slide-renderer.tsx`, sin `-defaults.ts` público ni panel propio (viven en `panels/properties-panel.tsx`, 1827 líneas).
- **`@lumina/element-kit` depende de `lumina-frontend`** (`dependencies: { "lumina-frontend": "workspace:*" }`) — **grafo invertido**. Que el frontend importe `elementRegistry` en el canvas crea un ciclo. Bloqueo estructural nº1 de E5, señalado desde E1.4.
- **`TODO(migración-etapa-5)` abiertos:** `slide-renderer.tsx` (los dos `switch`), `components/activities/shared/activity-registry.ts` (12 filas; consumido por `flyout-panel.tsx`, `panels/activities-panel.tsx`, `panels/flyout-left-panels.tsx`, `panels/widget-panel-catalog.ts`, `panels/widgets-insert-panel.tsx`, `lib/activity-canvas-position.ts`), `components/widgets/shared/widget-registry.ts` (12 filas; + `slide-renderer.tsx` + `widgets/shared/index.ts`), `lib/activity-scoring.ts` (fachada `export * from '@lumina/scoring'`, 24 imports directos), `editor/activity-templates.ts`. Tickets: `LUM-E5-CANVAS-BLOCKS`, `LUM-E5-WIDGETS`, `LUM-E5-GRUPO4`, `LUM-E5-CLASICAS`, `LUM-E5-ANAGRAMA`, `LUM-E5-SCORING-FACADE`.
- **Congelado que E5 levanta:** bloque `files: ["**/editor/components/canvas-area.tsx"]` en `lumina-frontend/eslint.config.mjs` (5 reglas `react-hooks/*` a `warn`). `canvas-editor.tsx` (21 KB) es **código muerto** (0 importadores) — retiro en E7, o de paso si estorba.

**Tensiones / decisiones (Regla 10 — no las decide el operador) — las 5 CONFIRMADAS por el dueño del tablero el 2026-09-06. Cursor redacta las sub-fichas sobre estas decisiones, no las reabre:**

1. **Inversión de la dependencia `element-kit ↔ lumina-frontend`.** **DECIDIDO: (b)** — partir el kit en `@lumina/element-kit-core` (contrato + `ElementRegistry`, sin React ni frontend) que el frontend importa, dejando los adapters concretos donde puedan seguir dependiendo del frontend hasta E7. Descopla el registry del canvas sin migración masiva en E5. (Descartada (a): mover los componentes/tipos al kit ahora.)
2. **Alcance del "reducer central": ¿un slide o el mazo?** **DECIDIDO: el slide en edición** (bloques + fondo + guías + selección + historial); la lista de slides sigue en react-query; la "diferencia" es a nivel de bloque dentro del slide. El reducer del mazo entero es E6+ (Core↔Edu).
3. **"Persistencia por diferencia" y el contrato backend.** **DECIDIDO: (a)** — E5 solo empieza a **mandar `expectedVersion`** y serializa un `content` mínimo desde el reducer, sin tocar el DTO ni `lumina-backend`. El endpoint `ops:[{add|update|remove, blockId,…}]` por bloque (b) se evalúa en E6. E5 sigue siendo "frontend puro".
4. **Regla 1 vs. deadlock (misma lectura que E4).** **DECIDIDO:** "cerrada" para una sub-ficha de E5 = el `case` / fila / fachada **efectivamente borrado** y su prueba de paridad reapuntada al `elementRegistry`. Lo que no se pueda borrar por el `RIESGO ACEPTADO (E4.5 §2)` **bloquea su propia sub-ficha** hasta que exista la cobertura de integración — no se hereda otro `TODO`.
5. **Primitivos (E4.6) vs. descongelar el switch.** **DECIDIDO:** extraerlos dentro de E5 (sub-ficha E5.6), en la misma pasada que borra el `switch` (freeze ya levantado). Son primitivos sin scoring, patrón E3.

**Orden (secuencial salvo indicación) — sub-fichas redactadas por Cursor (dueño del canvas/editor); las 5 decisiones de la raíz están CONFIRMADAS y no se reabren en las sub-fichas:**

##### E5.1 — Crear `@lumina/element-kit-core` y desacoplar el registry del frontend
- **Operador:** GPT Codex
- **Estado:** revisada por Claude Code (4 precisiones incorporadas: `exports` desde `src/`, `-core` mantiene `@types/react`, singleton débilmente tipado, reorden CI) — **lista para tomar**
- **Precondición:** E4 cerrada (cumplida). Ninguna otra sub-ficha E5.x.
- **Contexto (decisión raíz §1 — opción **(b)**):** hoy `@lumina/element-kit` depende de `lumina-frontend` (`package.json` → `"lumina-frontend": "workspace:*"`), mientras el canvas (E5.5+) necesitará consultar el catálogo sin crear ciclo. El contrato vive en `packages/element-kit/src/contract.ts` (usa `ComponentType` de React solo como tipo); el registry en `packages/element-kit/src/registry.ts`; la instancia poblada `elementRegistry` + 37 `registrar(...)` en `packages/element-kit/src/index.ts`. El frontend **aún no** declara dependencia de `@lumina/element-kit` — solo `@lumina/scoring`. Este paso prepara el grafo; el consumo desde el canvas llega en E5.5.
- **Alcance — PUEDE tocar:**
  - **Nuevo** `packages/element-kit-core/**` — `"name": "@lumina/element-kit-core"`, `"private": true`, `"type": "module"`, **`exports` desde `src/`** (mismo patrón que `@lumina/scoring` fijó en E2.2 — el frontend lo consume por fuente + `transpilePackages` en E5.5; el `build` a `dist/` sigue existiendo para el job `packages` de CI). Scripts `build` (tsc), `test` (vitest), `lint` (eslint extendiendo la base). Dependencias: **mantiene `@types/react`** y `react` (peer o devDep, **solo para el tipo `ComponentType`**); **sin** `react-dom`, **sin** `@testing-library/*`, **sin** `jsdom`, **sin** `lumina-frontend`, **sin** `@lumina/scoring`. Contenido mínimo movido desde el kit actual:
    - `src/contract.ts` — tipos `ElementDefinition`, `AparienciaSpec`, props Editor/Viewer/Propiedades, `PuntuacionDelegate` (idénticos a los de hoy).
    - `src/registry.ts` — clase `ElementRegistry` (idéntica a la de hoy).
    - `src/index.ts` — export pública: contrato + clase `ElementRegistry` + **singleton** `elementRegistry = new ElementRegistry()` (catálogo vacío al importar solo `-core`). **Tipado:** el singleton de `-core` es **débilmente tipado** (`ElementRegistry<Record<string, unknown>>`); el catálogo fuerte de 37 claves (`{ boton: typeof botonDefinition, … }`) **no** se puede aplicar a una instancia ya creada, así que se pierde el chequeo clave↔definición en `registrar(...)` y el narrowing de `obtener('boton')`. Es aceptable para el dispatch por string de E5.5. Si se quiere conservar algo de tipado, exportar el `type ElementCatalog` aparte desde el kit y castear en el punto de consumo — **no** re-tipar el singleton.
    - `src/registry.spec.ts` — pruebas de registrar / obtener / duplicado (portadas desde el kit).
  - `packages/element-kit/**` — refactor para depender de `@lumina/element-kit-core` (`workspace:*`): re-exportar contrato/registry desde `-core`; **todas** las `import … from "./contract.js"` / `"./registry.js"` pasan a `@lumina/element-kit-core`; la instancia `elementRegistry` que el `index.ts` del kit puebla con los 37 `registrar(...)` **es el singleton importado de `-core`** (no `new ElementRegistry()` propio — no duplicar Map). Los `register.ts` por elemento siguen tipando `ElementRegistry` importándolo desde `-core`.
  - Raíz: entrada en `pnpm-lock.yaml`; **reordenar el job `packages` de `.github/workflows/ci.yml`** (líneas ~27-32) para que `pnpm --filter @lumina/element-kit-core build && test && lint` corra **después** de `@lumina/scoring` y **antes** de `@lumina/element-kit` (que ahora depende de `-core`). No es un job nuevo — es reordenar pasos dentro del job existente (mismo patrón que E1.2/E1.3).
- **Alcance — NO toca:** `lumina-frontend/**`, `lumina-backend/**`, `slide-renderer.tsx`, `canvas-area.tsx`, ningún `src/` fuera de `packages/`. No invertir aún el grafo en runtime del canvas (E5.5). No mover adapters ni `elements/**` al paquete `-core`. No borrar `TODO(migración-etapa-5)` de registros viejos.
- **Entregable:** grafo de dependencias **sin ciclo** listo para E5.5: `@lumina/element-kit-core` no depende de `lumina-frontend`; `@lumina/element-kit` depende de `-core` + `lumina-frontend` + `@lumina/scoring`; el frontend puede añadir `"@lumina/element-kit-core": "workspace:*"` en E5.5 sin ciclo. Comportamiento idéntico: mismos 37 tipos registrados, mismas pruebas de paridad del kit. Verificación exacta (secuencial, desde la raíz del repo):
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @lumina/element-kit-core build && pnpm --filter @lumina/element-kit-core test && pnpm --filter @lumina/element-kit-core lint && pnpm --filter @lumina/element-kit build && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend build && pnpm --filter lumina-frontend test:unit
  ```
  Conteos de referencia al cerrar E4: `@lumina/element-kit` test **270/270** (31 files); `lumina-frontend` test:unit **446/446**; lint 0 `error` en ambos paquetes.
- **Cierre:** no aplica Regla 4 (refactor estructural; los registros viejos del canvas se retiran en E5.5/E5.6). Commit sugerido: `refactor(element-kit): extraer @lumina/element-kit-core`.

- **E5.1** — *(arriba)* · **E5.2–E5.7** — *(abajo)*.

##### E5.2 — Introducir `editorSlideReducer` (estado central del slide en edición)
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** E5.1 `hecho` (Codex cierra el desacople `@lumina/element-kit-core`).
- **Contexto (decisión raíz §2):** el reducer gobierna **un solo slide en edición** — bloques, fondo, guías, selección e inner-selection — no el mazo completo (react-query sigue siendo la fuente de `cls.slides`). Hoy `canvas-area.tsx` (~2002 líneas) concentra: `committedBloques` + `liveBloques` (ref), ~10 `useState` de selección (`selectedBlockId`, `selectedBlockIds`, inner-selection de flip-cards/tabs/carousel/click-reveal/popup/hotspot/timeline, `clipGroupInnerEditId`), `marqueeRect`, `layersPanelOpen`, `historyTick`; la persistencia (`patchSlideContentById`) y el historial (`historiesRef` + `canvas-history.ts`) **siguen como están** en este paso.
- **Alcance — PUEDE tocar:**
  - **Nuevo** `lumina-frontend/src/app/(app)/classes/[id]/editor/lib/editor-slide-state.ts` — tipos del estado del reducer: `bloques`, `fondo?`, `guias`, `transicion?`, selección (bloque único / multi / inner-selection tipada), `marqueeRect?`, flags de UI del lienzo que hoy viven en `useState` y deben sobrevivir undo/redo futuro (E5.3).
  - **Nuevo** `lumina-frontend/src/app/(app)/classes/[id]/editor/lib/editor-slide-reducer.ts` — `editorSlideReducer(state, action)` puro + factory `createInitialEditorSlideState(slide)`; acciones mínimas (nombres orientativos, pueden agruparse): `SELECCIONAR`, `SELECCIONAR_MULTIPLE`, `INNER_SELECTION`, `MOVER`, `REDIMENSIONAR`, `ROTAR`, `EDITAR_BLOQUE`, `AÑADIR_BLOQUE`, `ELIMINAR_BLOQUE`, `PEGAR`, `FONDO`, `GUIAS`, `RESETEAR_DESDE_SLIDE`, `APLICAR_SNAPSHOT` (puente temporal con historial actual). Reutilizar funciones puras existentes: `resize-coords.ts`, `rotate-coords.ts`, `block-resize-min-dim.ts`, `block-drag-id.ts`, `getBlockPos` / contratos de `.cursor/rules/lumina-canvas-editor-contracts.mdc` (leer → transformar → clamp → persistir — aquí solo hasta clamp en memoria).
  - **Nuevo** `lumina-frontend/src/app/(app)/classes/[id]/editor/lib/editor-slide-reducer.spec.ts` — paridad de comportamiento: secuencias representativas (mover+undo manual comparando bloques finales, selección, pegar, fondo/guías) contra la lógica que hoy está inline en `canvas-area.tsx`.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/canvas-area.tsx` — sustituir el estado disperso de bloques/selección por `useReducer(editorSlideReducer, …)` + derivados; **mantener** `historiesRef`, `patchSlideContentById`, `useAutosave` sin cambiar semántica (E5.3/E5.4). Los handlers de drag/resize/rotate delegan al reducer en lugar de mutar refs/`setCommittedBloques` directo.
  - Specs existentes en `editor/lib/*.spec.ts` — solo si hace falta actualizar imports/helpers compartidos (sin cambiar expectativas).
- **Alcance — NO toca:** `canvas-history.ts` (E5.3), `use-autosave.ts` / `patchSlideContentById` / `expectedVersion` (E5.4), `slide-renderer.tsx` y su `switch` (E5.5+), `packages/**`, `lumina-backend/**`, `eslint.config.mjs` (override congelado hasta E5.4), `activity-registry.ts`, `widget-registry.ts`, `lib/activity-scoring.ts`.
- **Entregable:** el editor se comporta igual a ojos del docente (mover, redimensionar, rotar, pegar, selección simple/múltiple/inner, fondo, guías) pero el estado vive en el reducer. Verificación exacta:
  ```bash
  cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build
  ```
  Conteo de referencia: test:unit **446/446** (o superior si el spec nuevo suma casos); lint 0 `error` (70 warnings, override de `canvas-area.tsx` sigue activo).
- **Cierre:** no aplica Regla 4. Commit sugerido: `refactor(editor): editorSlideReducer centraliza estado del slide`.

##### E5.3 — Historial por diferencia (undo/redo con patch, no snapshots completos)
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** E5.2 `hecho`.
- **Contexto:** `canvas-history.ts` guarda hasta `MAX_UNDO = 20` entradas con `bloques: Block[]` clonado completo por snapshot (`captureSlideSnapshot` → `structuredClone`). Con 20+ bloques por slide esto escala mal. E5.3 pasa a **patch + inverse-patch** (o diff estructural equivalente) por entrada, manteniendo fondo/guias/transicion en el snapshot o en el diff según convenga, pero **sin** clonar el array entero de bloques en cada paso salvo el snapshot inicial (`kind: 'inicio'`).
- **Alcance — PUEDE tocar:**
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/lib/canvas-history.ts` — nuevo modelo de entrada (`SlideHistoryEntry` con `forwardPatch` / `inversePatch` o `{ kind, patch, inversePatch, meta }`); funciones puras `pushHistory`, `undoHistory`, `redoHistory`, `applySnapshot` actualizadas; API pública compatible con `CanvasArea` (`canUndoHistory`, `canRedoHistory`, `buildHistoryView`, etc.).
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/lib/canvas-history.spec.ts` — ampliado: mismas secuencias que hoy (mover, pegar, fondo, eliminar) → **mismo estado visible** (`bloques`, `fondo`, `guias`) que la implementación anterior; añadir aserción de que el payload almacenado por entrada es más pequeño que un `Block[]` completo (p. ej. conteo de bytes serializados o número de bloques tocados).
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/canvas-area.tsx` — integrar el historial nuevo: al despachar acciones del reducer (E5.2), registrar patch en lugar de `captureSlideSnapshot` completo; undo/redo aplican `inversePatch`/`forwardPatch` vía `APLICAR_SNAPSHOT` o acción dedicada del reducer.
  - **Nuevo** (si hace falta) `editor/lib/slide-block-patch.ts` + spec — helpers puros para calcular diff entre dos `Block[]` (identificar bloque por `id`, campos pos/size/rotación/contenido).
- **Alcance — NO toca:** persistencia/autosave/`expectedVersion` (E5.4), `slide-renderer.tsx`, `packages/**`, backend, override eslint.
- **Entregable:** Ctrl+Z / Ctrl+Y y el panel de historial del lienzo se comportan igual; memoria por slide menor. Verificación:
  ```bash
  cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build
  ```
  `canvas-history.spec.ts` verde; test:unit sin bajar conteo global.
- **Cierre:** no aplica Regla 4. Commit sugerido: `refactor(editor): historial por diferencia en canvas-history`.

##### E5.4 — Persistencia con `expectedVersion` y descongelar `canvas-area.tsx` en lint
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** E5.3 `hecho`.
- **Contexto (decisión raíz §3 — opción **(a)**):** F1.4 dejó en backend `Slide.contentVersion` + `UpdateSlideDto.expectedVersion` → `409 ConflictException` con `currentVersion` (`classes.service.ts`). El frontend hoy manda `{ content }` entero sin versión (`patchSlideContentById` en `canvas-area.tsx:479`). E5.4 serializa el `content` **desde el estado del reducer** (única fuente de verdad post-E5.2) y adjunta `expectedVersion`; **no** se cambia el DTO ni `lumina-backend`. Autosave sigue siendo debounce sobre el payload derivado (`use-autosave.ts` o equivalente cableado al reducer).
- **Alcance — PUEDE tocar:**
  - `lumina-frontend/src/hooks/api/use-classes.ts` (o donde viva el tipo `Slide` / `SlideDetail`) — añadir `contentVersion?: number` al modelo devuelto por `GET /classes/:id`; propagar en queries.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/canvas-area.tsx` — `patchSlideContentById`: body `{ content, expectedVersion }`; guardar `contentVersion` local por slide (desde query + actualizar tras PATCH OK); en **409**: toast al docente + refetch del slide (`queryClient.invalidateQueries`) o rebase explícito documentado en el commit (elegir una estrategia, no LWW silencioso).
  - `lumina-frontend/src/hooks/use-autosave.ts` — sin cambiar la API pública; el valor observado pasa a ser el payload derivado del reducer (no `JSON.stringify` de un slide paralelo).
  - **Nuevo** (opcional) `editor/lib/build-slide-content-payload.ts` + spec — función pura `buildSlideContentPayload(state: EditorSlideState)` usada por autosave y guardado manual.
  - `lumina-frontend/eslint.config.mjs` — **eliminar** el bloque `files: ["**/editor/components/canvas-area.tsx"]` que degrada 5 reglas `react-hooks/*` a `warn` (`TODO(migración-etapa-5)` cumplido).
  - `canvas-area.tsx` — corregir los diagnósticos que el override ocultaba hasta quedar en **0 `error`** de lint sin el override (puede requerir ajustes menores al wiring del reducer, no reescribir el motor).
- **Alcance — NO toca:** `lumina-backend/**`, `slide-renderer.tsx` / `switch` (E5.5+), `packages/**`, `activity-registry.ts`, `widget-registry.ts`.
- **Entregable:** guardado automático y Ctrl+S envían `expectedVersion`; conflicto concurrente visible (409). Lint estricto sin override en `canvas-area.tsx`. Verificación:
  ```bash
  cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build
  ```
  Lint 0 `error` **sin** el override de `canvas-area.tsx`; test:unit sin bajar conteo.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(editor): expectedVersion en autosave y lint estricto en canvas-area`.

##### E5.5 — Reconectar canvas: `switch` → `elementRegistry` (~34 tipos) + retirar registros viejos
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** E5.4 `hecho` · E5.1 `hecho` (frontend consume `@lumina/element-kit-core` sin ciclo).
- **Contexto:** 37 `ElementDefinition` ya registradas en `@lumina/element-kit` (12 widgets + 22 actividades + 3 bloques canvas). E5.5 cubre los **~34 con paridad DOM probada** (12 widgets + 22 actividades). Los **3 bloques canvas** (`grafico`, `diagrama`, `clip-group`) llevan `RIESGO ACEPTADO (E4.5 §2)` en `slide-renderer.tsx` — **sus `case` NO se borran** (E5.7). Dispatch unificado: `elementRegistry.obtener(tipo)` → `Editor` / `Viewer` / `Propiedades` con adapters del kit. Side-effect: import bootstrap `@lumina/element-kit` (registra elementos) + consultas vía `@lumina/element-kit-core`.
- **Alcance — PUEDE tocar:**
  - `lumina-frontend/package.json` — `"@lumina/element-kit-core": "workspace:*"`, `"@lumina/element-kit": "workspace:*"`; `next.config.ts` → `transpilePackages` incluye ambos (patrón E2.2).
  - **Nuevo** `lumina-frontend/src/lib/element-registry-bootstrap.ts` — import side-effect de `@lumina/element-kit` + re-export de `elementRegistry` desde `@lumina/element-kit-core`.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` — reemplazar `case` de los 12 widgets + dispatch de actividades (bloques `tipo === 'actividad'` y/o inner paths cubiertos por las 22 definiciones) por dispatch genérico vía registry; **conservar** `case 'grafico'`, `case 'diagrama'`, `case 'clip-group'` intactos (legacy + comentarios `RIESGO ACEPTADO`).
  - `lumina-frontend/src/components/widgets/shared/widget-registry.ts` — **borrar filas** de los 12 widgets migrados (o el archivo entero si no quedan filas); reapuntar consumidores.
  - `lumina-frontend/src/components/activities/shared/activity-registry.ts` — **borrar filas** de las 12 actividades Grupo 4 (ticket `LUM-E5-GRUPO4` cerrado).
  - Consumidores de esos registros: `flyout-panel.tsx`, `panels/activities-panel.tsx`, `panels/flyout-left-panels.tsx`, `panels/widget-panel-catalog.ts`, `panels/widgets-insert-panel.tsx`, `lib/activity-canvas-position.ts`, `widgets/shared/index.ts` — leer metadatos desde `elementRegistry.listar()` o helper `listarWidgets()` / `listarActividades()` (nuevo en bootstrap o `-core`).
  - `lumina-frontend/src/lib/activity-scoring.ts` — **borrar** fachada (`export * from '@lumina/scoring'`); los **24** imports `@/lib/activity-scoring` → `@lumina/scoring` directo (ticket `LUM-E5-SCORING-FACADE` cerrado).
  - `packages/element-kit/**` — solo si hace falta exportar helper de listado; sin cambiar adapters/paridad.
- **Alcance — NO toca:** los 3 `case` canvas con riesgo aceptado, primitivos `texto`…`columnas` (E5.6), el segundo `switch` por `act.tipo` si aún queda tras unificar actividades (E5.6), `properties-panel.tsx` de primitivos, `lumina-backend/**`.
- **Entregable:** widgets y actividades con paridad renderizan vía `elementRegistry`; registros viejos sin filas migradas; fachada scoring eliminada. Verificación:
  ```bash
  cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build && pnpm --filter @lumina/element-kit test
  ```
  Paridad specs del kit siguen verdes (**270/270** mínimo); test:unit frontend sin bajar conteo.
- **Cierre (Regla 4):** filas borradas de `widget-registry.ts` y `activity-registry.ts`; `TODO(migración-etapa-5)` eliminados de esas filas; fachada `lib/activity-scoring.ts` borrada. Los `TODO`/`RIESGO ACEPTADO` de los 3 bloques canvas **permanecen** hasta E5.7. Commit sugerido: `refactor(element-kit): canvas despacha widgets y actividades vía elementRegistry`.

##### E5.6 — Primitivos de canvas (E4.6) + eliminar segundo `switch` por `act.tipo`
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** E5.5 `hecho`.
- **Contexto (decisión raíz §5):** 8 primitivos (`texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `columnas`) viven como funciones `Render*` dentro de `slide-renderer.tsx` (~2824 líneas); panel en `panels/properties-panel.tsx` (~1827 líneas). El **segundo `switch` por `act.tipo`** (`slide-renderer.tsx:757`, 10 clásicas — ticket `LUM-E5-CLASICAS`) debe quedar **eliminado** si E5.5 no lo cubrió ya; si queda código muerto, E5.6 lo borra. Patrón E3: `ElementDefinition` **sin** `puntuacion`, adapters, parity spec DOM, registro en `elementRegistry`.
- **Alcance — PUEDE tocar:**
  - `packages/element-kit/src/elements/<primitivo>/**` — 8 definiciones (`texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `columnas`): extraer `Render*` / paneles desde `slide-renderer.tsx` y `properties-panel.tsx` a componentes importables (barrels en `lumina-frontend` + subpaths si hace falta, patrón E3/E4).
  - `packages/element-kit/src/index.ts` + shims/aliases — registrar los 8 primitivos.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` — borrar `case` de primitivos + **todo** el segundo `switch` `act.tipo` (10 clásicas); dispatch vía registry. **Conservar** solo los 3 `case` canvas (`grafico`, `diagrama`, `clip-group`) hasta E5.7.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/panels/properties-panel.tsx` — reapuntar propiedades de primitivos a `elementRegistry.obtener(tipo)?.Propiedades`.
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/activity-templates.ts` — reapuntar si referencia tipos del switch viejo.
  - Parity: 8× `*.parity.spec.tsx` (DOM visible legacy vs kit; primitivos sin scoring).
- **Alcance — NO toca:** `case 'grafico'|'diagrama'|'clip-group'` (E5.7), `canvas-area.tsx` reducer/historial/persistencia (salvo imports), `lumina-backend/**`.
- **Entregable:** ningún `switch` por `block.tipo` salvo los 3 canvas con riesgo; ningún `switch` por `act.tipo`; primitivos en el kit. Verificación:
  ```bash
  pnpm --filter @lumina/element-kit build && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm build
  ```
  Kit test ≥ **270 + 8 suites** nuevas; frontend test:unit sin bajar conteo.
- **Cierre (Regla 4):** borrar `TODO(migración-etapa-5)` del segundo `switch` (`LUM-E5-CLASICAS` cerrado); `slide-renderer.tsx` sin dispatch legacy de primitivos ni clásicas. Commit sugerido: `refactor(element-kit): primitivos de canvas y retiro del switch act.tipo`.

##### E5.7 — Cobertura de integración real: `grafico` / `diagrama` / `clip-group`+Paper.js
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** E5.6 `hecho`.
- **Contexto (deuda E4.5 §2):** paridad jsdom de `grafico` (Recharts/`next/dynamic`), `diagrama` grafo (`@xyflow`), `clip-group`+Paper.js es render-smoke — **no** cumple Regla 7 para el cuerpo del canvas. Decisión raíz §4: E5 **no** se cierra dejando esos `case` sin cobertura real **o** decisión explícita de diferir. Opciones (elegir en ejecución, documentar en commit): Playwright CT / test visual (`vitest --project visual`) / harness con layout real; mínimo: comparación screenshot o métrica DOM (chart SVG, xyflow viewport, path Paper) legacy vs kit.
- **Alcance — PUEDE tocar:**
  - `packages/element-kit/src/elements/grafico/**`, `diagrama/**`, `clip-group/**` — specs de integración nuevos o ampliados (no cambiar adapters salvo bug demostrado).
  - `lumina-frontend/vitest.config.ts` / `playwright.config.ts` / dev-deps de test — solo si la opción elegida lo exige (declarar en commit).
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` — **borrar** `case 'grafico'`, `case 'diagrama'`, `case 'clip-group'` tras cobertura verde; dispatch 100% registry.
  - `AGENTS.md` — si se difiere a E7: actualizar esta ficha a `bloqueado`/`diferido` con riesgo aceptado explícito (**no** marcar E5 cerrada sin esa línea).
- **Alcance — NO toca:** `canvas-area.tsx` reducer/persistencia (E5.2–E5.4), `lumina-backend/**`, primitivos (E5.6).
- **Entregable (vía A — preferida):** tests de integración verdes para los 3 bloques; los 3 `case` borrados; `slide-renderer.tsx` sin `switch` legacy. Verificación:
  ```bash
  pnpm --filter @lumina/element-kit build && pnpm --filter @lumina/element-kit test && cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit && pnpm test:visual && pnpm build
  ```
  **Entregable (vía B — si no es viable):** ficha actualizada + `RIESGO ACEPTADO` intacto en los 3 `case` + issue con fecha; E5 global queda **abierta** hasta decisión del dueño del tablero.
- **Cierre (Regla 4):** vía A → tickets `LUM-E5-CANVAS-BLOCKS` cerrados, comentarios `RIESGO ACEPTADO` eliminados. Vía B → no aplica cierre de E5 global. Commit sugerido (vía A): `test(element-kit): integración canvas grafico/diagrama/clip-group`.

**Reparto de ejecución E5 (definido por el dueño del tablero 2026-09-06, trabajo paralelo entre los 4 operadores):**

- **Cursor** — redactó las 7 sub-fichas E5.1–E5.7 (commits `chore(tablero): …`); **ejecuta E5.2–E5.6** tras revisión (secuencial). Nada de E5 se ejecuta hasta que las fichas estén revisadas.
- **GPT Codex** — **ejecuta E5.1** (`@lumina/element-kit-core`: contrato + `ElementRegistry`, sin React ni `lumina-frontend`). Depende solo de que la sub-ficha E5.1 esté redactada y revisada; corre en paralelo mientras Cursor redacta E5.2–E5.7. Alcance disjunto: solo `packages/**` + lockfile raíz + job `packages` de CI. Encaja con E1.2/E1.3 (mismos scaffolds).
- **Claude Code** — **revisa** cada sub-ficha E5.x contra esta ficha raíz según Cursor las va dejando en `en revisión` (redactó la raíz); luego **ejecuta E5.7** (cobertura de integración de `grafico`/`diagrama`/`clip-group`+Paper.js — encaja con E4.5). Sin tocar archivos de E5.1–E5.6.
- **Antigravity** (lo menos demandante) — **X.1** arriba: borrar el archivo muerto `canvas-editor.tsx`. Un archivo, cero dependencias, verificación clara. Disjunto de todo E5.

Colisiones: ninguna — Codex en `packages/`, Antigravity borra un archivo huérfano en `editor/`, Cursor redacta y luego toca `canvas-area.tsx`/`slide-renderer.tsx`, Claude Code revisa y luego toca specs de `packages/element-kit`. La única dependencia de orden es Codex↔ficha E5.1 (Regla 10: dos fichas disjuntas pueden ir en paralelo).

**Cierre de E5:** E5.1–E5.6 en `hecho`; los dos `switch` de `slide-renderer.tsx` borrados (salvo los 3 `case` de Tensión 4 si E5.7 se difiere); `activity-registry.ts` y `widget-registry.ts` borrados o reducidos a lo que barre E7, con consumidores reapuntados; fachada `lib/activity-scoring.ts` borrada y los 24 imports a `@lumina/scoring` (`LUM-E5-SCORING-FACADE` cerrado); override de `canvas-area.tsx` fuera de `eslint.config.mjs` con `pnpm lint` en 0 `error`; reducer central + persistencia por diferencia + historial por diferencia operativos con paridad probada (Regla 7). Verif global: `pnpm -r build && pnpm -r test && pnpm -r lint` verde; `pnpm --filter lumina-frontend test:unit` sin bajar el conteo. Al cerrar E5 se redacta la ficha raíz de E6 (Claude Code).

#### E6 — Conectar Lumina Core con Lumina Edu sobre el mismo motor de puntuación · bloqueado por E5
Ficha raíz: **Claude Code**, al cerrar E5.

#### E7 — Retirar todo registro/switch/archivo viejo sin referencias · bloqueado por E6
Ficha raíz: quien cierre E6.
