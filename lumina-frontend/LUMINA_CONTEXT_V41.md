# LUMINA_CONTEXT_V41.md
> Generado: 26/08/2026
> Reemplaza: LUMINA_CONTEXT_V40.md
> Sprint incorporado: Escape Room 2.0 (Fase 5, capas 0–6) — 26 agosto 2026
> Roadmap de tareas: `LUMINA_ROADMAP_DETALLADO.md`. El V40 citaba `LUMINA_ROADMAP_CORE_VS_2.0.md`
> (no está en el repo); el checklist vigente de fases es el DETALLADO.
> Este documento resume el estado; el detalle de Escape Room 2.0 está en la Sección 12.

---

## 1. IDENTIDAD DEL PROYECTO

**Lumina** — Plataforma SaaS educativa colombiana para docentes.
- **Lumina Core**: Editor de clases interactivas (Canva/Nearpod-style)
- **Lumina Edu**: Módulo de gestión institucional y calificaciones

**Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + Prisma + PostgreSQL (puerto 5432) + Redis (puerto 6379) + Socket.IO
- Monorepo: `C:\Users\Jaime\proyectos\lumina\`
  - `lumina-frontend` (rama `master`)
  - `lumina-backend` (rama `main`)
- GitHub: `github.com/Jaimey1983/lumina`
- Diseño visual: color primario `#2563EB`, tipografía Plus Jakarta Sans, topbar del editor `bg-[#2563EB]`

---

## 2. REGLAS DE TRABAJO (CRÍTICAS)

1. **Git siempre manual** — Jaime hace todos los commits. Los agentes nunca ejecutan git.
2. **Prompts separados** — backend y frontend siempre en prompts separados y etiquetados.
3. **Siempre leer contexto primero** — todo prompt debe iniciar con `"Lee LUMINA_CONTEXT_V41.md antes de empezar."`. Si la tarea viene del roadmap, agregar también `"Lee LUMINA_ROADMAP_DETALLADO.md, Fase X."`.
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor o Antigravity.
6. **Docker debe estar iniciado** antes de levantar el backend (PostgreSQL 5432, Redis 6379).
7. **El backend usa pnpm** — nunca npm para instalar dependencias en `lumina-backend`.
8. **Scoring: una sola fuente de verdad** — cualquier feature nueva de scoring DEBE pasar por `evaluateActivityResponse` / `notaColombiana` (`activity-scoring.ts`). Nunca reimplementar fórmula local.
9. **Widgets: patrón establecido** — todo widget nuevo debe seguir la arquitectura de Hotspot/Tooltip: inline bubble sin portal, pointer-events gestionados, escritura exclusivamente desde el panel de propiedades para evitar la race condition inline-vs-panel (deuda técnica aceptada).
10. **`orden_rango` está ELIMINADA** — no reintroducir en roadmap, checklist ni `activity-registry`. Ver Sección 5.

---

## 3. ARQUITECTURA GENERAL

### Backend (NestJS + Prisma)
```
lumina-backend/src/
  auth/                  ← JWT, guards, estrategias Passport
  users/                 ← CRUD usuarios, roles (TEACHER, STUDENT, ADMIN)
  classes/               ← clases, sesiones, gradebook, scoring, guest
    activity-scoring.ts  ← notaColombiana, evaluateActivityResponse, xpFromEvaluation
    classes.service.ts   ← gradebook, endSession ($transaction), verifyGuestStudent
    classes.gateway.ts   ← Socket.IO: activity:complete, session:start/end,
                            escape-room:join-team/answer/hint/state/ranking
    classes.controller.ts← incluye GET /classes/:id/students/:studentId/verify
  escape-room/           ← Escape Room 2.0: motor de equipos en vivo (no autoría)
    escape-room-logic.ts ← espejo de reglas (esCorrecta, calcularPuntos, pistas)
    escape-room-activity.ts ← parseo de Slide.content
    escape-room-live.service.ts
    escape-room.module.ts ← importado por ClassesModule y LiveSessionsModule
  pptx/                  ← parseo .pptx, EMU→%, base64 imágenes
  ai-features/           ← callGemini, 7 métodos, prompt v2, Gemini 2.5 Flash-lite
  gamification/          ← XP (xpFromEvaluation), rachas, badges en Redis
  curriculum/            ← servicio de DBA JSON por grado/área
  prisma/schema.prisma   ← modelos: User, Class, Slide, ClassSession, ClassResult,
                            ClassGuest, StudentPoints, Badge, SessionLog, SlideEngagement,
                            EscapeRoomRun, EscapeRoomTeam, EscapeRoomTeamMember,
                            EscapeRoomTeamRoom
  prisma/migrations/     ← incluye 20260821120000_add_class_guest
                            y 20260826200000_escape_room_live_state
```

### Frontend (Next.js 15)
```
lumina-frontend/src/
  app/(app)/
    editor/[id]/         ← editor de slides
    classes/[id]/viewer/ ← viewer docente (vivo)
    join/[codigo]/       ← join estudiante / guest
    edu/                 ← Lumina Edu (gradebook, analytics)
  components/
    editor/              ← canvas, bloques, drag, guías, snap
    activities/          ← editores y viewers de todas las actividades
    widgets/             ← widgets estilo Genially (Grupo 9)
    gamification/        ← leaderboard, badge toast
  lib/
    activity-scoring.ts  ← espejo frontend del scoring
    escape-room-logic.ts ← espejo de reglas del motor (misma firma que backend)
    escape-room-live.types.ts ← parseo de acks/eventos de partida
    font-catalog.ts      ← 40 fuentes + buildGoogleFontsUrl()
  hooks/
    use-block-drag.ts    ← drag de bloques en canvas (con snap)
    use-canvas-guides.ts ← guías de usuario + snap
    use-gamification.ts  ← leaderboard, badges, XP
    use-escape-room-session.ts ← vivo vs local (D1)
    use-curriculum-loader.ts ← carga JSON DBA lazy
```

---

## 4. ESTADO DE FEATURES

### 4.1 — Editor de slides ✅ (mejorado sprint 17–22 ago)
- Arrastre de bloques con preview en vivo (bloque suelto + multi-selección).
- **Snap a guías de usuario** — Alt para soltar el imán. Umbral unificado a 8 px.
- **Indicadores de espaciado** — líneas verdes para snap de huecos iguales.
- **Nudge con flechas**: 1 px / 10 px con Shift.
- **Guías más finas** con tooltip, guías de centro (640/360).
- Snap también activo en el canvas del Escape Room.
- Archivos nuevos: `canvas-spacing.ts`, tests de `use-block-drag` y `canvas-guides`.

### 4.2 — Barras laterales del editor ✅ (reestructuradas 22 ago)
- **Rail izquierdo — Widgets**: catálogo único `widget-panel-catalog.ts` con 11 widgets.
  - Panel: `widgets-insert-panel.tsx`
  - Lista completa: Flip Cards, Tabs, Carousel, Click to Reveal, Timeline, Popup, Hotspot, Tooltip, Botón, Contador, Progreso.
  - Arrastre de widgets desde el rail izquierdo (DndContext ampliado).
  - Título cambiado de "Interactivos / Actividades" a **"Widgets"**.
- **Rail derecho — Actividades**: solo actividades de Grupo 4. Icono "Grupo 4" eliminado. Iconos y colores unificados (gris + hover neutro).
- **Popup**: aparece solo en la izquierda, ya no se duplica en la derecha.

### 4.3 — Widgets Grupo 9 (estilo Genially)

| Widget | Estado | Patrón |
|---|---|---|
| Flip Cards | ✅ Funcional | — |
| Tabs | ✅ Funcional | — |
| Carousel | ✅ Funcional | — |
| Click to Reveal | ✅ Funcional | — |
| Timeline | ✅ Funcional | — |
| Popup | ✅ Funcional | Portal al slide root |
| Hotspot | ✅ Funcional (mejorado 18-22 ago) | Inline bubble, sin portal |
| Tooltip | ✅ Funcional (creado 21-22 ago) | Inline bubble, sin portal, pointer-events: none |
| Botón | ✅ Funcional (creado 21-22 ago) | — |
| Contador / Temporizador | ✅ Funcional (creado 21-22 ago) | — |
| Barra de Progreso | ✅ Funcional (creado 21-22 ago) | — |

**Deuda técnica aceptada — race condition inline-vs-panel (Popup / Hotspot / Click to Reveal):**
La edición inline y el panel de propiedades compiten como fuentes de escritura en el estado del bloque. La solución definitiva requeriría un bus de eventos o lock de fuente de escritura. Se acepta como deuda técnica: Tooltip se implementó solo con escritura desde el panel para evitar la condición de carrera; los demás mantienen el comportamiento actual.

**Capa compartida de widgets (mejorada 18-22 ago):**
- Identidad, clonado, bloques de overlay, utils del editor.
- Panel de propiedades reconociendo todos los widgets.
- Viewers funcionando en preview / present / autónomo.

### 4.4 — Actividades Grupo 4 (13 actividades — revisadas 18-21 ago)

| Actividad | Qué se tocó en el sprint |
|---|---|
| Memoria | Overflow canvas, editor, viewer, propiedades |
| Puzzle de imagen | Config y viewer |
| Sopa de letras | Editor, shared, viewer |
| Crucigrama | Editor, shared, viewer |
| Abrir caja | Editor, shared, viewer |
| Anagrama | Viewer |
| Ahorcado | Editor, figura, teclado, viewer |
| Puzzle de palabras | Viewer |
| Globos | Editor, viewer, config |
| Golpea al topo | Editor, viewer, config |
| Ruleta | Editor, viewer, rueda |
| Clasificar | Viewer |
| Emparejar | Viewer |
| Historia ramificada | Viewer |

> `orden_rango` **no forma parte de esta lista** — fue eliminada (ver Sección 5). Tenía evaluador
> con tests de contrato pero nunca tuvo viewer/editor; no se completa ni se agrega ahora.

**Capa compartida Grupo 4:** `activity-dnd-root`, `activity-drag-word`, `activity-result-overlay`, `activity-registry`.

### 4.5 — Video interactivo ✅ (mejorado 21 ago)
- Runtime: `use-video-interactive-runtime`
- Adapter YouTube + tests
- Preview, present y slide-preview funcionando
- XP reportado una sola vez al completar el video (no por pregunta — fix de Fase 7)

### 4.6 — Sesiones y Lumina Edu ✅
- Gradebook con datos reales, fórmula `notaColombiana` (×5, mínimo 1.0)
- Analytics de curso: `SessionLog`, `SlideEngagement`
- Sesiones autónomas: progreso, DTO, estado
- Gamificación de sesión: XP, rachas, badges, leaderboard
- Gateway de clases en vivo

### 4.7 — Join de estudiantes / guests ✅ (mejorado 20-21 ago)
- Join por código: `join-client.tsx` espera `verifyStoredGuest` antes de mostrar formulario
- Modelo `ClassGuest` (migración `20260821120000_add_class_guest`) — guest acotado por clase
- `verifyGuestStudent` con scope de clase (no acepta guest de otra clase)
- Join-as-guest DTO con tests

### 4.8 — Módulo IA ✅ (Niveles 1 y 2)
- Gemini 2.5 Flash-lite vía fetch directo (sin SDK, por incompatibilidad de API key)
- Prompt v2 reescrito; `IaPanel` con tabs "Desde tema" / "Desde documento"
- 7 métodos en `ai-features.service.ts`
- Alineación curricular: JSONs DBA reales para `lenguaje-3` y `lenguaje-6` ✅
  - Restantes: 51 JSONs DBA pendientes (placeholders)

### 4.9 — Importación PPT / Google Slides ✅
- `pptx.service.ts`: parseo .pptx, EMU→%, base64 imágenes
- Modal de importación en el editor

### 4.10 — Otras intervenciones (18 ago, ajuste cruzado)
- Quiz, IA de actividades, resize handles
- Modales de sesión autónoma
- Gamificación (toast, leaderboard)
- Curriculum service, achievements
- Versiones de slide

---

## 5. ROADMAP

> **El checklist vigente de fases es `LUMINA_ROADMAP_DETALLADO.md`** (existen copias en raíz,
> `lumina-frontend/` y `lumina-backend/`). El V40 citaba `LUMINA_ROADMAP_CORE_VS_2.0.md`, que
> no está en el repo. Esta sección resume estado y siguiente paso; el detalle vive en el DETALLADO.

### ✅ COMPLETO (resumen)
- Grupos 1–5 (Editor UX, Widgets Captivate, Animaciones, 13 actividades Wordwall, Gamificación/Socket.IO, PPT import, Google Fonts, DBA selector)
- Grupo 9 (11 Widgets estilo Genially)
- Refactor de scoring unificado (Fases 0–7): `notaColombiana`, `evaluateActivityResponse`, `xpFromEvaluation`, tests de contrato 133/133 + 89/89
- AI Module Niveles 1 y 2 (Gemini, IaPanel, prompt v2)
- Lumina 2.1 visual redesign (azul `#2563EB`, Plus Jakarta Sans, banner de página)
- **Fase 2** Clipping Masks (`clip-group`)
- **Fase 3** Canvas (auditoría + refinamiento editor)
- **Fase 5** Escape Room 2.0 (equipos en vivo, pistas[], dashboard, lienzo en viewer, cierre) — ver §12

### 🔜 SIGUIENTE (Fase 1 del roadmap DETALLADO)
**AI Nivel 3 — BYOK multi-proveedor**: Claude, Gemini y OpenAI seleccionables por docente; claves
cifradas por docente en BD; UI de settings con selector de proveedor y "probar conexión". Ver
`LUMINA_ROADMAP_DETALLADO.md` → Fase 1 para las 10 tareas completas (aún en diseño: qué pasa
si el docente no configura clave propia, método de cifrado, y por dónde empezar la
implementación — backend, frontend o diseño de flujo completo primero).

### ⚠️ Decisión reciente — `orden_rango` ELIMINADA
Se decidió **retirar definitivamente** la actividad `orden_rango` de Grupo 4 — duplicaba la
función de "Ordenar" (ya existente, con editor y viewer completos). No se construye viewer ni
editor para `orden_rango`; no reaparece en roadmap ni checklist futuro.
- Queda como **tarea de limpieza menor, no urgente**: retirar `evaluateOrdenRango` de
  `activity-scoring.ts` (frontend y backend) y su entrada en `ACTIVITY_SCORING`.
- Registrada en `LUMINA_ROADMAP_DETALLADO.md` → Backlog → Scoring y Lumina Edu.
- No es necesaria una sesión dedicada — se puede empaquetar junto con cualquier prompt de
  scoring futuro.

### ⏳ Pendientes destacados (ver roadmap oficial para el detalle completo)
- **51 JSONs DBA reales** (placeholder → real): grados 1-11, 5 áreas (van 2/53: `lenguaje-3`, `lenguaje-6`)
- **Paquete compartido `@lumina/scoring`**: eliminar el espejo manual ~1000 líneas frontend/backend. Requiere workspace monorepo.
- **Migrar alias `nota`→`score` en `classes.gateway.ts`**: cuando se confirme que no quedan clientes viejos en producción.

---

## 6. FÓRMULA DE CALIFICACIÓN (VIGENTE)

```
notaColombiana(correctas, total, respondio):
  si !respondio → 0.0
  si total === 0 → 1.0
  ratio = correctas / total
  nota = ratio × 5
  → max(1.0, round(nota, 1))    ← mínimo pedagógico 1.0 si respondió
  rango: 1.0 – 5.0
```

| Nivel | Rango | Label |
|---|---|---|
| Bajo | 1.0 – 2.9 | rojo |
| Básico | 3.0 – 3.9 | amarillo |
| Alto | 4.0 – 4.6 | azul |
| Superior | 4.7 – 5.0 | verde |

**⚠️ La fórmula `× 4 + 1` documentada en el V38 está obsoleta y eliminada. No reintroducir.**

---

## 7. REGLAS TÉCNICAS POR MÓDULO

### Scoring
- `evaluateActivityResponse` es el único evaluador — no crear evaluadores locales.
- `activity-result-overlay.tsx` recibe `evaluation` como prop — nunca recalcula.
- `torneo-viewer.tsx` conserva `* 4 + 1` intencionalmente: `torneo` es `exclude`, no otorga nota académica.
- `orden_rango`: ELIMINADA — `evaluateOrdenRango` es código muerto pendiente de retirar (ver Sección 5), no registrar ni construir viewer.

### Widgets
- Patrón Hotspot/Tooltip: inline bubble, sin portal, `pointer-events: none` en presentación.
- Escritura de configuración: exclusivamente desde panel de propiedades para evitar race condition.
- `widget-panel-catalog.ts` es el catálogo único — agregar aquí antes de cualquier otro archivo.

### Drag & Snap
- Umbral de snap: **8 px** (unificado — no cambiar sin actualizar todos los usos).
- Guías del usuario + Alt para liberar imán.
- `canvas-spacing.ts` maneja los indicadores de huecos iguales.

### Actividades Grupo 4
- Todo viewer de Grupo 4 pasa `evaluation` al overlay — no calcula internamente.
- `normalizeVideoAnswers` sigue en uso mientras existan `ClassResult` legacy con formato sucio.
- `activity-registry`: no registrar actividades sin viewer funcional (incluye `orden_rango`, que no tendrá viewer — ver Sección 5).

### IA
- `callGemini` vía fetch directo (no SDK) — no cambiar hasta resolver incompatibilidad de API key.
- JSONs DBA: estructura flat, campos `dba_enunciado`, `evidencias_aprendizaje`, `subprocesos_ebc`, etc. — ver JSON generado para `lenguaje-6` como referencia.

### Sopa de letras
- `loadPuzzle` en su propio `useEffect` con `[]` — nunca mover dentro del effect de `gameState`.
- `placedWords` de solo lectura una vez generado.

---

## 8. ARCHIVOS CLAVE

### Backend
```
src/classes/activity-scoring.ts            ← notaColombiana, ACTIVITY_SCORING, evaluateActivityResponse
                                              (incluye evaluateOrdenRango — código muerto, pendiente de retirar)
src/classes/classes.service.ts             ← gradebook, endSession, verifyGuestStudent
src/classes/classes.gateway.ts             ← activity:complete (score; alias nota por compatibilidad)
src/classes/classes.controller.ts          ← GET /classes/:id/students/:studentId/verify
src/gamification/session-gamification.service.ts ← xpFromEvaluation, rachas, badges
src/ai-features/ai-features.service.ts    ← callGemini, 7 métodos
src/pptx/pptx.service.ts                  ← parseo .pptx
prisma/schema.prisma                       ← fuente de verdad del modelo de datos
prisma/migrations/20260821120000_add_class_guest ← ClassGuest
```

### Frontend — Scoring
```
src/lib/activity-scoring.ts                    ← espejo frontend (incluye evaluateOrdenRango, código muerto)
src/lib/activity-scoring.fixtures.json         ← fixtures compartidos
src/lib/activity-scoring.test.ts               ← tests de contrato
src/lib/activity-scoring.reconstruction.spec.ts ← tests de reconstrucción
src/components/activities/shared/activity-result-overlay.tsx
src/app/(app)/classes/[id]/viewer/viewer-client.tsx
src/app/(app)/join/[codigo]/join-client.tsx
```

### Frontend — Editor (canvas y snap)
```
src/hooks/use-block-drag.ts                ← drag con liveBloques (suelto + multi-select)
src/hooks/use-canvas-guides.ts             ← snap a guías + Alt para liberar
src/lib/canvas-spacing.ts                  ← indicadores de huecos iguales
src/components/editor/slide-renderer.tsx   ← render de bloques, widgets, actividades
src/components/editor/properties-panel.tsx ← panel derecho (propiedades por tipo de bloque)
src/components/editor/editor-client.tsx    ← cliente principal del editor
```

### Frontend — Widgets (Grupo 9)
```
src/components/widgets/widget-panel-catalog.ts    ← catálogo único (11 widgets)
src/components/widgets/widgets-insert-panel.tsx   ← panel izquierdo de inserción
src/components/widgets/popup/                     ← Popup (portal)
src/components/widgets/hotspot/                   ← Hotspot (inline bubble)
src/components/widgets/tooltip/                   ← Tooltip (inline, pointer-events:none)
src/components/widgets/button/                     ← Botón
src/components/widgets/counter/                    ← Contador / Temporizador
src/components/widgets/progress/                   ← Barra de Progreso
```

### Frontend — IA
```
src/hooks/api/use-ai.ts
src/lib/ia-templates.ts
src/lib/font-catalog.ts
src/data/curriculum/lenguaje-6.json        ← REAL ✅
src/data/curriculum/lenguaje-3.json        ← REAL ✅
src/data/curriculum/index.ts               ← LOADERS grados 1-11, 5 áreas
src/components/editor/flyout-left-panels.tsx ← IaPanel con DBA selector
```

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V41.md y CLAUDE.md antes de empezar.
[descripción del cambio]
Build debe pasar sin errores TypeScript. Verificar con npx tsc --noEmit.

[BACKEND] Lee LUMINA_CONTEXT_V41.md y .cursorrules antes de empezar.
[descripción del cambio]
Build debe pasar sin errores TypeScript. Verificar con npx tsc --noEmit.

Jaime hace el commit manual — el agente NO ejecuta git.
PowerShell: nunca usar &&, usar ; o comandos separados.
```

Si el prompt corresponde a una fase del roadmap, agregar además:
```
Lee LUMINA_ROADMAP_DETALLADO.md, Fase N, antes de empezar.
```

---

## 10. REFACTOR DE SCORING UNIFICADO (Fases 0–7) — COMPLETO ✅

### 10.1 — Arquitectura resultante

```
notaColombiana(correctas, total, respondio) → number (1.0–5.0)
evaluateActivityResponse(activityType, definicion, respuesta) → ActivityEvaluationResult
xpFromEvaluation(result) → number
```

Fuentes de verdad:
- `lumina-frontend/src/lib/activity-scoring.ts`
- `lumina-backend/src/classes/activity-scoring.ts`
- Sincronizados por: `check-fixtures-sync.mjs` + `activity-scoring.fixtures.json`

### 10.2 — Categorías `ACTIVITY_SCORING`

| Categoría | Tipos | Entra al promedio |
|---|---|---|
| `binary` | `quiz_multiple`, respuesta única | Sí |
| `partial` | `completar_blancos`, `video_interactivo`, todo Grupo 4 vigente | Sí (si score ≠ null) |
| `manual` | `respuesta_corta` | Solo tras calificación docente |
| `participation` | `encuesta_viva`, `nube_palabras` | No |
| `exclude` | `ruleta`, `torneo`, `escape_room` | No — política fija |

`abrir_caja` e `historia_ramificada`: `partial`, `score: null` si sin criterio de evaluación.
`orden_rango`: **ELIMINADA** — su entrada en esta tabla queda como código muerto pendiente de
retirar (ver Sección 5); no forma parte del contrato vigente y no debe documentarse como pendiente
de viewer en futuros contextos.

### 10.3 — Identidad de guest

- `ClassGuest` model (migración `20260821120000`) — scoping por clase
- `verifyGuestStudent` valida `ClassResult` en esa clase **o** `ClassGuest` de esa clase
- `join-client.tsx` espera `verifyStoredGuest` (await) antes del formulario — sin race condition

### 10.4 — Estado de tests

| Suite | Estado |
|---|---|
| Backend | 133/133 ✅ |
| Frontend | 89/89 ✅ |
| Builds | Nest + Next limpios ✅ |

### 10.5 — Deuda técnica aceptada

| Ítem | Razón |
|---|---|
| `normalizeVideoAnswers` | ClassResult legacy con formato sucio. No borrar sin migración de datos. |
| Espejo manual `activity-scoring.ts` (×2) | TODO paquete compartido; mitigado por tests de contrato. |
| Alias `nota` en `classes.gateway.ts` | Compatibilidad clientes viejos. Quitar cuando se confirme despliegue limpio. |
| `* 4 + 1` en `torneo-viewer.tsx` | Única fórmula vieja en `src/`; `torneo` es `exclude`. No tocar. |
| Race condition inline-vs-panel (Popup/Hotspot/Click to Reveal) | Requiere bus de eventos. Tooltip resuelto solo con escritura desde panel. |
| `evaluateOrdenRango` + entrada en `ACTIVITY_SCORING` | Actividad eliminada por decisión de producto (duplicaba "Ordenar"); código muerto pendiente de retirar, sin urgencia. |

---

## 11. WIDGET AUDIT — GRUPO 9 (ciclo completado)

Tres hallazgos de riesgo medio corregidos:
1. **Hidratación normalizada (Grupo 2)** — Flip Cards, Tabs, Carousel, Click to Reveal, Timeline.
2. **Hook `useAutoPosition` compartido** — entre Popup, Hotspot y Tooltip.
3. **Limpieza de dead code en Tooltip** — prop no usada eliminada.

Race condition inline-vs-panel (Popup / Hotspot / Click to Reveal): aceptada como deuda técnica (ver 10.5).

---

## 12. ESCAPE ROOM 2.0 (Fase 5) — COMPLETO ✅ (26/08/2026)

Plan: `PLAN_ACCION_ESCAPE_ROOM_2.0.md`. Prompts: `PROMPT_FASE5_ESCAPE_ROOM_V3.md` (capas 0–6, no re-ejecutar). Peritaje: `PERITAJE_ESCAPE_ROOM.md` + addendum.

### 12.1 — Qué es y qué no es

- **Autoría** sigue en `Slide.content` (`tipo: 'escape_room'`). No hay tablas de salas.
- **Partida en vivo** sí tiene tablas: `EscapeRoomRun` → `EscapeRoomTeam` → miembros y `EscapeRoomTeamRoom`.
- `escape_room` permanece `'exclude'` en `activity-scoring.ts` (FE y BE). Los puntos (p. ej. 300/sala) **no** son nota 0–5 y **no** van a `activity:complete` / XP de sesión.
- `upsertLiveStudentResponse` ignora `escape_room` igual que `torneo` (capa 0). No ensucia `class_results`.

### 12.2 — Decisiones de producto (cerradas)

| Id | Regla |
|---|---|
| D1 | Equipos **solo** en sesión en vivo. Preview y autónomo = Escape Room 1.0 local. |
| D2 | Agotar intentos = 0 puntos + avance a la siguiente sala (a nivel equipo). |
| D3 | `pistas[]` + revelado progresivo. Sin penalización ni cooldown. `pista` legado se hidrata. |
| D4 | Postgres es la verdad del progreso. El reloj compartido usa `EscapeRoomRun.startedAt` (no Redis). |

### 12.3 — Sockets (mismo patrón que Torneo)

| Evento | Gateway | Quién |
|---|---|---|
| `escape-room:init` / `escape-room:dashboard` | `/live` (`LiveSessionsGateway`) | Docente |
| `escape-room:join-team` / `answer` / `hint-request` / `state` / `ranking` | default (`ClassesGateway`) | Estudiante / guest (`studentId` + `studentName`) |
| `escape-room:started` / `team-assigned` / `team-progress` / `room-unlocked` / `finished` | Broadcast a `live:` **y** `class-` | Servidor |

Cierre de equipo: `escape-room:finished`. **Prohibido** mandar esos puntos por `activity:complete`.

### 12.4 — Frontend

- `useEscapeRoomSession`: si hay socket + `classId` + `studentId` + run activa → modo `live`; si no → `local` (1.0 bit a bit).
- `EscapeRoomViewer`: firma de `onComplete` / `onAnswer` sin cambios. `onAnswer` reenvía `{ roomId, answer, correct, intento }`.
- `SlideRenderer` pasa `onComplete` como `{ tipo: 'escape_room:finished', puntos, timeMs }` y `renderSalaCanvas` (lienzo vía `SlideRenderer` anidado en `modo="viewer"`). Sin `useBlockDrag` en el estudiante.
- `EscapeRoomLiveDashboard` en el flyout "En vivo" **solo** si la actividad activa es `escape_room`. `LiveResponsesPanel` no se usa para esta actividad.
- Victoria 1.0 intacta (trofeo, confetti, desglose). Podio solo en vivo, al cerrar, si `mostrarRanking !== false`. Botón **Finalizar**.

### 12.5 — Archivos clave

```
lumina-backend/src/escape-room/
lumina-backend/prisma/migrations/20260826200000_escape_room_live_state/
lumina-frontend/src/hooks/use-escape-room-session.ts
lumina-frontend/src/lib/escape-room-logic.ts
lumina-frontend/src/lib/escape-room-live.types.ts
lumina-frontend/src/components/editor/panels/escape-room-live-dashboard.tsx
lumina-frontend/src/components/viewers/escape-room-viewer.tsx
```

### 12.6 — Fuera de Fase 5 (no reabrir en un prompt de escape room)

- DT-ER-08: auto-save del editor principal vs Guardar en `/classes/:id/escape-room`
- Varios Escape Rooms en la ruta dedicada
- Penalización de pistas o candado que atasque al equipo

