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

> Realizá el paso `<ID>` del Tablero de pasos de `AGENTS.md`. Leé la ficha completa y las Reglas 0–10. No te salgas del alcance declarado en la ficha (archivos que puede tocar / que no). Corré el comando de verificación de la ficha; no lo des por terminado si algo falla. Al terminar dejá el estado en `en revisión` con una línea de qué hiciste y qué comando corriste.

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
| Cola larga frontend (`no-unused-vars` / `no-explicit-any` restante) | 53 archivos exactos — ver `LINT_CLEANUP_BACKLOG.md` | Antigravity | **[en revisión]** — 120→76 problemas, pero `pnpm lint` **sigue en rojo**: 24 `error` (52 `warning`). ~19 son legítimos del cluster congelado (`canvas-area.tsx`); ~6 quedaron fuera de ese cluster y siguen abiertos → ficha **L.2** |
| `react-hooks/*` + React Compiler del motor del canvas (**cluster congelado E5**) | **Exactamente `canvas-area.tsx`** (y `slide-renderer.tsx` si reaparece). NO están congelados: `flyout-left-panels.tsx`, `popup-parts.tsx`, `tooltip-parts.tsx`, `diagrama-properties.tsx`, componentes de Timeline (solo `warning`) | **Nadie** | **En espera hasta E5** — `canvas-area.tsx` concentra errores de `react-hooks/rules-of-hooks` + React Compiler ("memoization could not be preserved", "cannot modify local variables after render"): son exactamente el problema que E5 resuelve al centralizar el estado del editor. Tocarlos ahora = más riesgo que beneficio. Para que el CI pase mientras tanto → override eslint en L.2 |

Para cerrar la decisión de Regla 9 (lint bloqueante real en CI) falta **L.2**: `pnpm lint` sin `error` en los dos paquetes, con `canvas-area.tsx` degradado a `warning` vía override eslint + `TODO(migración-etapa-5)`.

---

## Tablero de pasos

Formato y protocolo: **Regla 10**. Estados: `pendiente` · `[en curso: <op>]` · `en revisión` · `hecho` · `bloqueado por <ID>`.
El historial de los pasos ya cerrados vive en «Fase 1 — riesgos urgentes» y «Reparto activo — lint»; acá van solo los abiertos y las fichas de la migración.

### Abiertos ahora

#### F1.4 — Concurrencia de guardado de slide y de juegos en vivo
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** ninguna — es un riesgo de Fase 1, corre en paralelo a la migración.
- **Alcance — PUEDE tocar:** `lumina-backend/src/classes/` (persistencia de slide: transacción / control de versión optimista), `lumina-backend/src/classes/classes.gateway.ts`, `lumina-backend/src/live-sessions/`, `lumina-backend/src/torneo/`, `lumina-backend/src/gamification/session-gamification.service.ts`, `lumina-backend/src/quiz-live/`, y sus `*.spec.ts`.
- **Alcance — NO toca:** el motor React del canvas (`lumina-frontend/src/**/canvas-*`, `slide-renderer.tsx`, componentes de Timeline) — es el cluster `react-hooks` congelado para E5. Si el fix necesitara tocarlo, se para y se deja el estado en `bloqueado por E5`.
- **Entregable:** (1) guardado de slide concurrente sin "última escritura gana" silenciosa — versión / `updatedAt` con rechazo `409` o merge explícito; (2) actualización de puntaje en vivo (torneo/gamificación de sesión) sin condición de carrera — transacción o lock por sesión en Redis. Prueba: ampliar `classes.service.transaction.spec.ts` + un spec nuevo de carrera sobre el servicio/gateway de sesión. Verificación: `cd lumina-backend && npx tsc --noEmit && pnpm lint && pnpm test` (sin bajar el conteo de tests).
- **Cierre:** no aplica Regla 4 (no es migración). Marcar el ítem en «Fase 1 — riesgos urgentes» como `[x]` con el resumen.

#### L.1 — Cola larga de lint del frontend
- **Operador:** Antigravity
- **Estado:** en revisión — bajó 120→76 problemas (44 menos) sobre los 53 archivos, pero **no cerró**: `pnpm lint` sigue con 24 `error` (exit 1). De esos, ~19 son del cluster congelado E5 (`canvas-area.tsx`) y ~6 quedaron fuera de él marcados como "intocables" sin base en la tabla de lint.
- **Pendiente para cerrar:** ver ficha **L.2**. L.1 se marca `hecho` recién cuando L.2 deja el `pnpm lint` del frontend en 0 `error`.

#### L.2 — Cerrar los 6 errores de lint fuera del cluster congelado + degradar `canvas-area.tsx`
- **Operador:** Claude Code
- **Estado:** [en curso: Claude Code]
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar (solo estos archivos):**
  - `lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx` — 3× `@typescript-eslint/no-explicit-any` (líneas ~499, ~831, ~841): tipar el esquema legado de slide IA (`{ type?: string; title?: string; bulletPoints?: string[] }`), sin `any`.
  - `lumina-frontend/src/components/widgets/popup/popup-parts.tsx` y `.../widgets/tooltip/tooltip-parts.tsx` — 1× cada uno `react-hooks/static-components` ("component created during render" por `const Icon = resolve…Icon(cfg)`): resolver el ícono fuera del render (mapa de componentes a nivel de módulo) o renderizarlo sin crear un componente en cada render. Widget-local, no toca el motor del canvas.
  - `lumina-frontend/src/components/diagramas/diagrama-properties.tsx` — 1× `react-hooks` "impure function during render": mover el `Date.now()` / valor impuro fuera de la ruta de render.
  - `lumina-frontend/eslint.config.*` — añadir un bloque `overrides` para el glob `**/editor/components/canvas-area.tsx` que baje `react-hooks/rules-of-hooks` y las reglas del React Compiler a `warn`, con comentario `// TODO(migración-etapa-5): quitar este override al centralizar el estado del editor (E5)`.
- **Alcance — NO toca:** `canvas-area.tsx` en sí, `slide-renderer.tsx`, cualquier componente de Timeline, ni ningún otro archivo. Nada de backend.
- **Entregable:** `cd lumina-frontend && npx tsc --noEmit && pnpm lint && pnpm test:unit` — `pnpm lint` en **0 error** (warnings permitidos), `tsc` limpio, `test:unit` 446/446 sin bajar. Verificar además `cd lumina-backend && pnpm lint` sigue en 0.
- **Cierre:** marcar L.1 y L.2 como `hecho` en la tabla de lint; el CI queda verde con lint estricto → se desbloquea `E1` y se cierra la decisión de Regla 9.

### Migración a Estructura Única — fichas por etapa

Regla 1: no se abre una etapa sin cerrar la anterior. Cada etapa arranca por su ficha «raíz»; las sub-fichas se redactan cuando la etapa se vuelve activa, con el estado real del código a la vista.

#### E1 — `@lumina/element-kit` + piloto Botón · **bloqueado por L.2**
Redacta las sub-fichas: **Claude Code**. Precondición global: CI verde con `pnpm lint` estricto en ambos paquetes (con `canvas-area.tsx` degradado a `warning` vía el override de L.2).

- **E1.1 — Crear el workspace de paquetes.** Op: Claude Code. Alcance: `pnpm-workspace.yaml` en la **raíz** (crear con `packages:` → `packages/*`) + carpeta `packages/`. No toca `lumina-backend/` ni `lumina-frontend/` salvo enganchar el nuevo paquete. Entregable: `pnpm -w install` resuelve, CI sigue verde.
- **E1.2 — Scaffold `packages/element-kit` con el contrato.** Op: Claude Code. Alcance: solo `packages/element-kit/`. Entregable: tipos de `ElementDefinition` según Regla 2 (`tipo`, `crearPorDefecto()`, `Editor`, `Viewer`, `Propiedades`, `apariencia`, `puntuacion?`), `ElementRegistry.registrar()`, build + test del paquete en CI.
- **E1.3 — Scaffold `packages/scoring`.** Op: Claude Code. Alcance: solo `packages/scoring/`. Entregable: API mínima equivalente a la que hoy usa `lumina-backend/src/classes/activity-scoring.ts`, **sin** migrar consumidores todavía.
- **E1.4 — Piloto: Botón como `ElementDefinition`.** Op: Cursor (dueño del canvas). Alcance: `packages/element-kit/` (definición del Botón) + punto de montaje en `lumina-frontend`. NO borra el Botón viejo de `widget-registry.ts`. Entregable: prueba de paridad — misma entrada → misma salida visible que el Botón actual (Regla 7). Cierre: `TODO(migración-etapa-1)` en `lumina-frontend/src/components/widgets/shared/widget-registry.ts` apuntando al Botón viejo + ticket con fecha.

#### E2 — Migrar actividades · bloqueado por E1
Ficha raíz la redactan **Claude Code + Cursor** al cerrar E1. Objetivo: fusionar `lumina-frontend/src/components/activities/shared/activity-registry.ts` dentro de `ElementRegistry` y conectar `@lumina/scoring`. Piloto y orden de actividades: informe «Plano Lumina», Etapa 2.

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
