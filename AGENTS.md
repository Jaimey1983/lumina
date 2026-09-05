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

- [x] **IDOR en cursos** — `GET /courses/:id`, `POST /courses/:id/enroll`, `GET /courses/:id/students` no verificaban dueño del curso. Cerrado por Claude Code: los tres pasan ahora por `CourseAuthorizationService` (`courseSettings`/`enrollment`), con test de regresión en `courses.service.spec.ts`. Ver commit correspondiente.
- [x] **"Olvidé mi contraseña"** — el frontend prometía `POST /auth/forgot-password` y `POST /auth/reset-password` y el backend no los tenía. Cerrado por Claude Code:
  - Modelo `PasswordResetToken` (`prisma/migrations/20260905120000_add_password_reset_token/`): guarda sólo el hash SHA-256 del token, `expiresAt` (30 min), `usedAt` (un solo uso). Pedir un token nuevo invalida los anteriores; al restablecer se marcan usados todos los tokens vivos del usuario en la misma transacción que el cambio de contraseña.
  - `AuthService.forgotPassword` / `resetPassword`; endpoints con `@Throttle({ limit: 5, ttl: 60_000 })` + `ThrottlerGuard`. La respuesta de `forgot-password` es idéntica exista o no el correo (no enumera cuentas). Hash de contraseña con bcryptjs costo 12, igual que el resto de auth.
  - Prueba de paridad: `src/auth/auth.service.password-reset.spec.ts` (token inválido/expirado/ya usado, no filtra si el email existe, no reutilización, no `devToken` en producción).
  - **PENDIENTE antes de producción — decisión aparte (`TODO(email-provider)` en `auth.service.ts`):** hoy NO se envía correo. En `NODE_ENV !== 'production'` el token en claro se loguea (`console.warn` marcado "DEV ONLY — no enviar así a producción") y se devuelve en `devToken`. Antes de ir a producción hay que conectar un proveedor real de email (SES / Resend / SMTP), enviar el enlace por correo y eliminar tanto el log como el campo `devToken` de la respuesta.
- [ ] Concurrencia de guardado de slide y de juegos en vivo (torneo/gamificación de sesión).
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

#### F1.4 — Concurrencia de guardado de slide y de juegos en vivo
- **Operador:** Cursor
- **Estado:** [en curso: Cursor]
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

#### E1 — `@lumina/element-kit` + piloto Botón · **activo** (sub-fichas E1.1–E1.4 redactadas)
Precondición global cumplida: `pnpm lint` estricto en verde en ambos paquetes (`canvas-area.tsx` degradado a `warning` hasta E5).
Orden: **E1.1 → (E1.2 ∥ E1.3) → E1.4**. E1 se cierra cuando las cuatro están `hecho` y la prueba de paridad del Botón pasa.
Estado actual del repo a tener a la vista: **no hay** workspace pnpm con `packages:` (la raíz tiene un `pnpm-workspace.yaml` solo con `allowBuilds:`); `lumina-frontend` y `lumina-backend` se instalan por separado, cada uno con su `pnpm-lock.yaml` y su `pnpm-workspace.yaml`. El widget Botón ya está partido en `lumina-frontend/src/components/widgets/boton/` (`boton-defaults.ts`, `boton-editor.tsx`, `boton-viewer.tsx`, `boton-properties.tsx`, `boton-config.ts`, `boton-parts.tsx`). El dispatch de widgets vive en `slide-renderer.tsx` — **congelado para E5**.

##### E1.1 — Workspace pnpm real en la raíz
- **Operador:** Antigravity
- **Estado:** [en curso: Antigravity]
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
- **Operador:** Claude Code
- **Estado:** bloqueado por E1.1
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
- **Operador:** Claude Code
- **Estado:** bloqueado por E1.1 · puede ir **en paralelo con E1.2** (conjuntos de archivos disjuntos)
- **Precondición:** E1.1 `hecho`.
- **Contexto:** `activity-scoring.ts` está hoy duplicado a mano en `lumina-frontend/src/lib/activity-scoring.ts` y `lumina-backend/src/classes/activity-scoring.ts` (~1000 líneas c/u), sincronizados por fixtures (`activity-scoring.fixtures.json`). `@lumina/scoring` será la fuente única — pero **E1.3 solo crea el paquete y fija su superficie de API**; portar la implementación y migrar consumidores es E2 (frontend) / E6 (backend).
- **Alcance — PUEDE tocar:** solo `packages/scoring/**` + su entrada en el lockfile raíz y en el job `packages` de CI.
- **Contenido mínimo:** `package.json` (`"name": "@lumina/scoring"`, mismos scripts que E1.2), tsconfig, eslint. `src/index.ts` que **declara** las firmas públicas que hoy exponen ambos `activity-scoring.ts` (funciones `calcular…` / `puntuar…` por tipo de actividad) y las exporta con una implementación placeholder que lanza `Error('no implementado — ver E2')`. Un `types.spec.ts` que fije las firmas.
- **Alcance — NO toca:** los dos `activity-scoring.ts` existentes (siguen vivos y funcionando), frontend, backend.
- **Entregable:** `pnpm --filter @lumina/scoring build && test && lint` verdes. Nada más consume el paquete todavía.
- **Cierre:** no aplica Regla 4 en E1 (los `TODO(migración-etapa-2/6)` en los `activity-scoring.ts` viejos se ponen en E2/E6, no acá).

##### E1.4 — Piloto: Botón como `ElementDefinition`
- **Operador:** Cursor (dueño del canvas / widgets) · puede ir en paralelo con F1.4 (conjuntos disjuntos)
- **Estado:** bloqueado por E1.2
- **Precondición:** E1.2 `hecho`.
- **Alcance — PUEDE tocar:**
  - `packages/element-kit/src/elements/boton/**` — la `ElementDefinition` del Botón: `crearPorDefecto` (envuelve `createDefaultBoton` de `boton-defaults.ts`), `Editor` / `Viewer` / `Propiedades` (adaptan los componentes existentes de `lumina-frontend/src/components/widgets/boton/` a las props del contrato), `apariencia`; **sin** `puntuacion` (el Botón no puntúa). Registro vía `ElementRegistry.registrar(botonDefinition)` en el arranque del paquete.
  - `packages/element-kit/src/elements/boton/boton.parity.spec.tsx` — vitest + testing-library: renderiza el Botón **viejo** y el **nuevo** con el mismo estado y compara la salida visible (DOM, `aria-*`, y las acciones siguiente / anterior / ir-a / URL). Reutiliza los specs actuales del Botón si existen.
  - `lumina-frontend/src/components/widgets/boton/**` — **solo** si hay que exportar algo hoy interno para que el paquete lo consuma; sin cambiar comportamiento.
- **Alcance — NO toca:** `slide-renderer.tsx`, `canvas-area.tsx`, componentes de Timeline (congelados E5); `widget-registry.ts` salvo el `TODO` de cierre; el backend. **No** desconecta el Botón viejo del canvas.
- **Entregable:** `pnpm --filter @lumina/element-kit test` incluye la prueba de paridad del Botón en verde (misma entrada → misma salida visible, Regla 7). `pnpm --filter lumina-frontend build` sigue verde. El Botón viejo sigue funcionando en el canvas sin cambios.
- **Cierre (Regla 4):** `TODO(migración-etapa-3)` en `lumina-frontend/src/components/widgets/shared/widget-registry.ts` — el Botón viejo se retira al migrar el resto de widgets (E3) — con issue/ticket y fecha. Con E1.4 `hecho` y la paridad en verde, **E1 queda cerrado**.

#### E2 — Migrar actividades · bloqueado por E1
Ficha raíz la redactan **Claude Code + Cursor** al cerrar E1. Objetivo: fusionar `lumina-frontend/src/components/activities/shared/activity-registry.ts` dentro de `ElementRegistry`; **portar** la implementación real a `@lumina/scoring` (stub creado en E1.3) y hacer que el frontend la consuma, dejando `TODO(migración-etapa-2)` en `lumina-frontend/src/lib/activity-scoring.ts`. Piloto y orden de actividades: informe «Plano Lumina», Etapa 2.

#### E3 — Migrar widgets (piloto Ruleta) · bloqueado por E2
Ficha raíz: **Cursor**, al cerrar E2. Retira de `widget-registry.ts` cada widget migrado (Regla 4).

#### E4 — Migrar bloques de canvas y formas vectoriales (editor Paper.js) · bloqueado por E2 y E3 **cerradas con el código viejo borrado**
Ficha raíz: **Cursor**, al cerrar E3.

#### E5 — Unificar estado del editor (reducer central, persistencia e historial por diferencia) · bloqueado por E4 y por tener un elemento migrado de cada categoría
Ficha raíz: **Cursor**. Acá entra el cluster `react-hooks` congelado del Tablero de lint.

#### E6 — Conectar Lumina Core con Lumina Edu sobre el mismo motor de puntuación · bloqueado por E5
Ficha raíz: **Claude Code**, al cerrar E5.

#### E7 — Retirar todo registro/switch/archivo viejo sin referencias · bloqueado por E6
Ficha raíz: quien cierre E6.
