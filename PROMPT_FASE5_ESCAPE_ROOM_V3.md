# PROMPT FASE 5 v3 — ESCAPE ROOM 2.0

> **Estado (26/08/2026):** capas 0–6 **implementadas**. No re-ejecutar estos prompts.  
> Contexto vigente: `LUMINA_CONTEXT_V41.md` §12. Roadmap Fase 5 marcada completa.  
> Deuda diferida: DT-ER-08, varios ER en `/escape-room`, penalización de pistas.

Este archivo **reemplaza** `PROMPT_ANTIGRAVITY_FASE5_V2.md`.

Cada sección “PROMPT CAPA N” se ejecuta **sola**, en su propia sesión. No implementar la capa siguiente. Si una tarea de otra capa parece “obvia”, no se hace.

**Lectura obligatoria antes de código:**

- `PLAN_ACCION_ESCAPE_ROOM_2.0.md`
- `PERITAJE_ESCAPE_ROOM.md`
- `PERITAJE_ESCAPE_ROOM_ADDENDUM.md`
- `LUMINA_CONTEXT_V41.md`
- `LUMINA_ROADMAP_DETALLADO.md` (solo Fase 5)
- Frontend: `lumina-frontend/.cursorrules` (contratos de canvas) si la capa toca `SlideRenderer` o bloques

---

## PREÁMBULO COMÚN (todas las capas)

### Decisiones cerradas (no reabrir)

- **D1** Equipos solo en sesión en vivo. Preview y autónomo = Escape Room 1.0 local.
- **D2** Agotar intentos = 0 puntos + avance a la siguiente sala (a nivel equipo en vivo).
- **D3** Pistas = array + revelado progresivo. Sin penalización ni cooldown.
- **D4** Postgres = verdad del progreso; Redis = solo reloj de la partida. Referente: `torneo.service.ts`, **no** `session-gamification.service.ts`.

### No romper

- Máquina de estados del viewer: `intro → sala → victoria | derrota`.
- `calcularPuntos` / `esCorrecta` (mismos resultados). Si se extraen a un módulo espejo, el test debe fijar el comportamiento actual.
- Single-write-path de `EscapeRoomEditor` / `EscapeRoomSalaConfigFields` (`onChange` / `onUpdate(patch)`).
- `escape_room: 'exclude'` en `activity-scoring.ts` (frontend y backend). No tocar `evaluateActivityResponse` ni `notaColombiana`.
- Autoría en `Slide.content`. No tablas de salas.
- No reutilizar `WorkGroup`.
- No cablear puntos del escape room a `activity:complete` / XP.
- Preview y autónomo deben seguir jugables **sin** motor de equipos.

### Sockets (contrato real de Torneo, no el del prompt v2)

- El estudiante del viewer ya tiene `liveSocket` = namespace **por defecto** (`ClassesGateway`). Ahí emite y escucha.
- El docente usa `/live` para mando; el servidor hace broadcast a `live:${classId}` **y** `class-${classId}`.
- No exigir JWT de `/live` al guest.
- Identidad: `studentId` + `studentName` (join / `lumina_student_id`), igual que Torneo.

### Fuera de Fase 5

DT-ER-08 (auto-save vs Guardar en `/escape-room`), varios Escape Rooms en la ruta dedicada, penalización de pistas, candado que atasque al equipo.

---

## PROMPT CAPA 0 — Filtro `class_results`

Lee el preámbulo y `PLAN_ACCION_ESCAPE_ROOM_2.0.md` capa 0.

### Contexto

`upsertLiveStudentResponse` en `lumina-backend/src/classes/classes.service.ts` (~L690) hace `if (activityType === 'torneo') return;` y **no** filtra `escape_room`. Cada respuesta de sala puede crear `ClassResult` con `score: null`. Los guests **sí** son `User` (`ClassGuest`); el `findUnique` de usuario no los salva.

### Tarea (única)

Añadir el mismo early-return para `escape_room` junto al de `torneo`. No refactorizar el método. No tocar el gateway más de lo imprescindible.

### Tests

Contrato: `upsertLiveStudentResponse` con `activityType: 'escape_room'` no crea ni actualiza `class_results`. Un tipo evaluable (p. ej. quiz) sigue persistiendo. `torneo` sigue sin persistir.

### No hacer

Scoring, viewer, modelos nuevos, eventos socket, pistas, canvas.

### Entregable

Diff mínimo en `classes.service.ts` + spec. El Escape Room 1.0 se juega igual; solo deja de ensuciar la tabla.

---

## PROMPT CAPA 1 — Motor de equipos (backend)

Lee el preámbulo, el plan capa 1 y el addendum §§1–2 y §4.3–4.4.

### Punto de partida real

- No hay tablas de Escape Room. El **diseño** permanece en `Slide.content`.
- Capa 0 ya debe estar mergeada (si no, hacerla primero y parar).
- `TorneoService`: Postgres (`TorneoSession`, `TorneoAnswer`) + Redis solo `startTime`/`timeLimit`. Carrera: `findFirst` + `create`. Identidad sin FK a User.
- `LiveSessionsService` es un `Map` en memoria: **no** copiar ese patrón para progreso.
- `SessionGamificationService` es Redis 24 h: **no** copiarlo para progreso.
- Estudiantes **no** están en `/live`. `torneo:answer` en `LiveSessionsGateway` no es el camino del alumno; las respuestas de torneo del estudiante entran por `ClassesGateway` (`student-response`). Escape Room debe usar **eventos dedicados** en `ClassesGateway`, no reutilizar `student-response`.

### Tareas

1. Extraer la lógica pura de acierto y puntos a un módulo espejo `escape-room-logic` (backend + frontend, como `activity-scoring`). Mover `esCorrecta` y `calcularPuntos` **sin cambiar resultados**. El viewer 1.0 importa el módulo; no dejar una copia divergente en el componente.
2. Modelos Prisma de **ejecución** (no de autoría), atados a `ClassSession`:
   - sesión live de escape room
   - equipo + miembros (`studentId`, `studentName`)
   - progreso por `(teamId, salaId)`: intentos, pistas reveladas, estado `abierta | superada | agotada`, puntos
3. `EscapeRoomLiveService`:
   - init / asignación (auto round-robin de participantes de la sesión, o manual)
   - `answer`: lee `respuestaCorrecta` del JSON del slide; **ignora** cualquier `correct` que mande el cliente; unique de primera victoria por sala; D2 al agotar
   - `hint-request`: revela la siguiente pista del array (D3, sin resta de puntos)
   - `getState` / hidratación para reconexión
   - Redis: solo reloj compartido de la partida
4. Gateways:
   - Docente `escape-room:init` (y asignación) en `/live`, broadcast dual
   - Estudiante `escape-room:join-team`, `answer`, `hint-request`, `state` en `ClassesGateway`
   - Servidor emite `team-assigned`, `room-unlocked`, `team-progress`, `state` a ambos rooms
5. Un estudiante = un equipo por `ClassSession`. Guests válidos.

### Tests de contrato (obligatorios)

- Asignación de equipo
- Dos miembros responden a la vez: una sola transición de sala
- Cliente que envía `correct: true` con respuesta mala: no desbloquea
- Reconexión: `state` restaura sala, intentos, pistas
- Guest (`studentId` de join) puede integrar equipo
- `activity-scoring` `exclude` intacto; no se escribe `ClassResult` de escape room

### No hacer

Frontend de viewer/dashboard (capa 2/4). Canvas. Cambiar `pista` en tipos (capa 3), salvo que el servicio deba leer `pista` legado: si el JSON aún tiene `pista` string, tratarlo como `pistas: [pista]` al validar, sin migración SQL.

### Entregable

Módulo + migración Prisma de ejecución + eventos + tests. El viewer 1.0 **sigue funcionando** (aún no consume el motor).

---

## PROMPT CAPA 2 — Viewer + sockets (frontend)

Lee el preámbulo y el plan capa 2. El motor de capa 1 debe existir.

### Punto de partida real

- `EscapeRoomViewer` ya recibe `liveSocket`, `studentId`, `classId` pero los nombra `_liveSocket`, etc. y no los usa.
- `slide-renderer.tsx` **ya pasa** `liveSocket={liveSocket}` (el socket del viewer = `ClassesGateway`).
- `viewer-client.tsx` conecta con `io(API_URL)` (namespace por defecto), **no** `/live`.
- Preview y `autonomo-client` montan el mismo viewer vía `SlideRenderer`. Si el hook exige socket, se rompen.

### Tareas

1. Hook `useEscapeRoomSession`:
   - Con socket + ids + partida activa → `escape-room:state` y listeners `team-assigned` / `room-unlocked` / `team-progress`. Avance de sala cuando **cualquier** miembro acierta.
   - Sin eso → estado local actual (`useState` de fases, `salaActual`, intentos, puntos, historial). **Bit a bit** el 1.0.
2. Quitar prefijos `_` y usar las props. Emitir `answer` / `hint-request` / pedir `state` por el `liveSocket` existente. No abrir un segundo `io()`.
3. UI de equipo **solo** en el ramal en vivo (nombre de equipo / compañeros). Intro, overlays y scoring visual se quedan.
4. Reconexión: al montar con socket, hidratar; no resetear a intro si el equipo ya está en sala N.
5. `onAnswer` / `onComplete` **conservan la firma**. No los elimines. En vivo el desbloqueo lo confirma el servidor; el callback sigue sirviendo al padre si existe.

### No hacer

`onComplete={undefined}` → aún no (capa 6). Canvas de `bloques` (capa 5). Lista de pistas en el editor (capa 3), salvo consumir `pistas[]` si el JSON ya viene así **o** `pista` string (el viewer debe aceptar ambos: una pista o array). Dashboard docente (capa 4).

### Verificar

- Preview: jugar 1.0 completo sin backend de equipos.
- Autónomo: igual.
- Viewer en vivo: F5 recupera sala; dos clientes del mismo equipo avanzan juntos.
- Teclado: confirmar respuesta con Enter (ya existe); no romperlo.

### Entregable

Viewer extendido + hook. 1.0 intacto en degradación.

---

## PROMPT CAPA 3 — Pistas e intentos

Lee el preámbulo y el plan capa 3.

### Punto de partida real

```ts
// normalizeSala hoy (escape-room-editor.tsx)
pista: raw?.pista
if (intentos !== -1 && intentos !== 1 && intentos !== 2 && intentos !== 3) intentos = 3
```

Sin cambiar el normalizer, un input “flexible” de intentos **no sirve**: al guardar vuelve a 3. No existe `normalizeSala` en backend.

### Tareas (orden)

1. `EscapeRoomSala` en `slide.types.ts`: `pistas?: string[]`; dejar `pista?: string` como legado de lectura.
2. `normalizeSala` (único writer):
   - `pistas` = array limpio; si no hay array y hay `pista` no vacía → `pistas: [pista]`
   - al devolver el objeto canónico, persistir `pistas`; no depender de `pista` para lógica nueva
   - `intentosMaximos`: default 3; permitir entero ≥ 1 o −1; 0 u otros negativos → 3
3. `EscapeRoomSalaConfigFields`: lista dinámica de pistas (añadir / quitar / reordenar) vía `onUpdate`; input numérico de intentos. Mismo patrón single-write-path. Editor principal y designer dedicado **comparten** este formulario: no duplicar.
4. Viewer: revelar pista *n* tras el n-ésimo fallo. Una sola pista = UX actual (botón tras el primer fallo). Sin resta de puntos. En vivo, alinear con `hint-request` de capa 1 si el ramal de equipos está activo.

### Tests

- `pista: "abc"` → `pistas: ["abc"]`
- `pistas: ["a","b"]` se conserva
- `intentosMaximos: 5` no cae a 3
- `intentosMaximos: 0` → 3
- −1 sigue ilimitado

### No hacer

Penalización configurable. DTO Zod de slide en backend “por simetría”. DT-ER-08. Rediseño del acordeón dnd-kit de salas (el dnd de **salas** se queda).

### Entregable

Tipos + normalizer + editor + viewer 1.0 con pistas progresivas. Clases antiguas abren y guardan sin perder el texto de pista.

---

## PROMPT CAPA 4 — Dashboard docente

Lee el preámbulo y el plan capa 4. Requiere capas 1 y 2.

### Tareas

1. Nuevo componente `EscapeRoomLiveDashboard`. **No** extender `LiveResponsesPanel` con un `if (escape_room)` que mezcle filas.
2. Matriz equipos × salas: estado, intentos, pistas usadas, tiempo de equipo (reloj servidor).
3. Fuente: estado agregado del servicio (GET o evento `team-progress`), no historial de `response-update`.
4. Montarlo en el editor docente cuando la actividad activa sea `escape_room`. El panel genérico sigue para el resto de tipos.

### No hacer

Leer `class_results`. XP. Rediseñar `LiveResponsesPanel` para otras actividades. Canvas.

### Verificar

Accesibilidad básica (tabla o grid con texto, no solo color). Otras actividades en vivo no muestran eventos de escape room en el feed genérico.

### Entregable

Dashboard independiente + cableado de visibilidad. `LiveResponsesPanel` sin cambios de contrato.

---

## PROMPT CAPA 5 — Canvas en el viewer

Lee el preámbulo, el plan capa 5 y `lumina-frontend/.cursorrules` (contratos 3.2). Requiere capa 2 (si no, F5 resetea el lienzo en vivo).

### Punto de partida real

- `EscapeRoomSala.bloques` / `fondo` se diseñan en `EscapeRoomSalaCanvas` con `SlideRenderer` + `useBlockDrag`.
- `EscapeRoomViewer` ignora esos campos y pinta la tarjeta de texto.
- Salas legacy no tienen `bloques`.

### Tareas

1. Si la sala tiene `bloques?.length`, renderizarlos con `SlideRenderer` modo `viewer` (o el mismo camino de render que el canvas de sala **sin** drag/resize/selección).
2. Posición solo vía `getBlockPos` / `blockPosToStyle`. Prohibido recalcular `x`/`y` a mano. Actividades internas respetan `marco`.
3. El acertijo (input / opciones / código) permanece y usa la **misma** lógica de respuesta. No convertir widgets del lienzo en candados nuevos.
4. Si no hay `bloques`, UI 1.0 sin cambios de layout.

### No hacer

`useBlockDrag` en el estudiante. “Arreglar” el Guardar del designer (DT-ER-08). Cambiar `EscapeRoomSalaCanvas` salvo extraer un subcomponente de **solo render** si hace falta para no duplicar.

### Verificar

Sala con fondo+texto se ve en preview y en vivo. Sala solo-texto idéntica a antes. No romper widgets (hotspot/popup) si aparecen en la sala: contrato de viewer existente.

### Entregable

Viewer con fallback legacy. Designer y editor de salas visuales sin cambio de persistencia.

---

## PROMPT CAPA 6 — Cierre y ranking

Lee el preámbulo y el plan capa 6. Requiere 1 y 2.

### Punto de partida real

- El viewer ya llama `onComplete(puntos, timeMs)` en victoria y derrota.
- `slide-renderer.tsx` ~L999 pasa `onComplete={undefined}`.
- `mostrarRanking` existe y default true; el viewer no lo pinta.
- `activity:complete` da XP solo si `evaluated.score !== null`. Los puntos del escape room **no** son esa escala.

### Tareas

1. Pasar `onComplete` real al viewer (el `onResponse` del padre u un callback hermano). **Firma del viewer sin cambios.**
2. El contenedor en vivo emite cierre de equipo por evento dedicado (`escape-room:finished` o el que capa 1 haya definido). **Prohibido** `activity:complete` con esos puntos.
3. Enriquecer la pantalla de victoria existente (trofeo, confetti, desglose): podio de equipos si `mostrarRanking` y hay datos de equipo; botón salir/finalizar. Derrota se queda.
4. `onAnswer` debe reenviar `correct` e `intento` al padre (`{ roomId, answer, correct, intento }`) para no seguir tirando metadatos. No usar eso para `class_results`.

### No hacer

Rediseño estético de la victoria. Meter Escape Room en la planilla. Ranking durante la partida en la pantalla del estudiante (eso es el dashboard docente).

### Entregable

Cierre end-to-end: estudiante ve resumen (+ podio si aplica); docente lo ve en el dashboard; scoring académico y XP de sesión no se contaminan.

---

## Si algo queda a medias

Al cerrar una capa, el 1.0 individual (preview + autónomo) debe poder jugarse entero. Si no, la capa no está hecha: revertir o arreglar antes de la siguiente.
