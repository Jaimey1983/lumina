# Plan de acción — Escape Room 2.0

> **Fecha:** 26 de agosto de 2026  
> **Fuentes:** `PERITAJE_ESCAPE_ROOM.md`, `PERITAJE_ESCAPE_ROOM_ADDENDUM.md`, `LUMINA_ROADMAP_DETALLADO.md` Fase 5, `PROMPT_ANTIGRAVITY_FASE5_V2.md` (reemplazado por `PROMPT_FASE5_ESCAPE_ROOM_V3.md`).  
> **Estado:** capas 0–6 implementadas (26/08/2026). Cierre documental en `LUMINA_CONTEXT_V41.md` §12.  
> **Norma:** no romper lo que funciona; extender por contratos existentes; una capa por sesión de implementación.

---

## 1. Principios (no negociables)

1. **No reescribir el 1.0.** `EscapeRoomViewer`, `EscapeRoomEditor`, `EscapeRoomSalaConfigFields` y la máquina `intro → sala → victoria | derrota` se **extienden**. La fórmula de puntos (`calcularPuntos`: 100 % / 50 % / ~17 %), el avance forzado al agotar intentos y el timer local en modo individual se conservan.
2. **Un solo contrato de datos de autoría.** El diseño (salas, desafíos, pistas, canvas) sigue en `Slide.content` como `EscapeRoomActivity`. No crear tablas Prisma de habitaciones.
3. **Una sola función de hidratación.** `normalizeSala` / `normalizeEscapeRoomActivity` son el único sitio que lee JSON legado y escribe JSON canónico. Editor principal, designer `/escape-room` y viewer deben pasar por ellas. Si una regla cambia (pistas, intentos), cambia **ahí** y en el tipo `EscapeRoomSala`.
4. **Misma lógica de juego en cliente y servidor.** Extraer `esCorrecta` y `calcularPuntos` a un módulo espejo (`escape-room-logic.ts` frontend **y** backend, como `activity-scoring.ts`). En vivo, el servidor decide; el cliente solo refleja. En preview/autónomo, el cliente usa **la misma función**, no una copia distinta.
5. **Misma identidad que el join.** `studentId` + `studentName` (User de alumno o guest `guest_*@lumina.guest`). No `WorkGroup`. No FK obligatoria a matrícula.
6. **Mismo patrón de sockets que Torneo *real*, no el imaginado.**
   - Estudiante: namespace por defecto (`ClassesGateway`), que es el `liveSocket` que el viewer **ya** pasa.
   - Docente: `/live` (`LiveSessionsGateway`) para mando, con broadcast dual a `live:${classId}` y `class-${classId}`.
   - No exigir JWT de `/live` al guest.
   - No reutilizar `student-response` / `response-update` para telemetría de Escape Room (tráfico aislado).
7. **Scoring académico intacto.** `escape_room: 'exclude'` no se toca. No cablear `onComplete` a `activity:complete` (los puntos del escape room no son nota 0–5).
8. **Canvas: contratos 3.2.** Si el viewer pinta `bloques`/`fondo`, usa `SlideRenderer` + `getBlockPos` / `blockPosToStyle`. Sin drag en modo estudiante. Salas sin `bloques` siguen la tarjeta de texto actual.
9. **Degradación.** Sin socket, sin sesión activa o sin equipo → se comporta exactamente como hoy (1.0 local). Preview y autónomo no pueden quedar rotos.
10. **Una capa por PR / por prompt.** No un mega-diff. El archivo `PROMPT_FASE5_ESCAPE_ROOM_V3.md` tiene un prompt por capa.

---

## 2. Decisiones de producto (cerradas para este plan)

Tomadas del addendum, sección 6. Cambiarlas exige actualizar este plan **antes** de código.

| ID | Decisión | Valor |
|---|---|---|
| **D1** | Alcance de 2.0 | Equipos **solo en sesión en vivo**. Individual / preview / autónomo = 1.0 local (F5 reinicia). |
| **D2** | Agotar intentos | Igual que hoy: 0 puntos y avance a la siguiente sala (ahora a nivel **equipo**). No candado que atasque al grupo. |
| **D3** | Pistas | Array + revelado progresivo. **Sin** penalización ni cooldown. |
| **D4** | Persistencia | Como Torneo: **Postgres = verdad** del equipo y de cada sala; **Redis = reloj compartido** de la partida. No “Redis primario + snapshot al cierre”. |

**Fuera de esta fase:** DT-ER-08 (dos persistencias de editor), varios Escape Rooms en la ruta dedicada, penalización de pistas, candado real, fusión con Evaluación autónoma.

---

## 3. Contratos de cada pieza (qué no puede cambiar)

| Pieza | Contrato vigente | Cómo se extiende |
|---|---|---|
| `EscapeRoomActivity` en `Slide.content` | Discriminador `tipo: 'escape_room'`; campos actuales | Añadir `pistas?: string[]`; leer `pista` legado. No migrar a SQL. |
| `normalizeSala` | Única hidratación; hoy clampa intentos a 1/2/3/−1 y copia `pista` | Relajar clamp a entero ≥ 1 o −1; `pista` → `pistas`. Sigue siendo el único writer canónico. |
| `EscapeRoomEditor` / `SalaConfigFields` | Single-write-path: `onChange` / `onUpdate(patch)` | Lista de pistas e input de intentos por el mismo `onUpdate`. |
| `EscapeRoomViewer` | Fases, overlays 1.5 s, `calcularPuntos`, `onAnswer(salaId, answer, correct, intento)`, `onComplete(puntos, timeMs)` | Hidratar desde servidor **si** hay equipo; si no, `useState` actual. No cambiar firmas de callback. |
| `SlideRenderer` (escape room) | Pasa `liveSocket`, `studentId`, `classId`; `onComplete={undefined}`; `onAnswer` recorta a `{ roomId, answer }` | Cablear `onComplete` al padre **sin** XP; pasar `correct` e `intento` en el payload. No crear un segundo canal de sockets. |
| `activity-scoring` | `exclude` → `UNEVALUABLE` | **No tocar.** |
| `upsertLiveStudentResponse` | Bypass `torneo` | Añadir el mismo bypass para `escape_room`. |
| `WorkGroup` | LMS asíncrono | No usarlo. |
| `EscapeRoomSalaCanvas` | `onChange({ bloques, fondo })` + `SlideRenderer` + `useBlockDrag` | El viewer **reutiliza el render**, no el drag. |

---

## 4. Mapa de capas

```
Capa 0  Higiene class_results          (DT-ER-03)     ✅
Capa 1  Motor servidor (equipos)       (DT-ER-01, 07)  ✅
Capa 2  Viewer + sockets + fallback    (DT-ER-05)      ✅
Capa 3  Pistas[] + intentos flexibles  (DT-ER-04, P5)  ✅
Capa 4  Dashboard docente              (Punto 4)       ✅
Capa 5  Canvas visual en el viewer     (DT-ER-02)      ✅
Capa 6  Cierre / ranking / onComplete  (DT-ER-06)      ✅
```

Dependencias: 0 independiente. 2 requiere 1. 3 puede ir en paralelo a 1 **si** solo toca JSON/editor (el viewer 1.0 ya entiende una pista). 4 requiere 1+2. 5 requiere 2 (si no, F5 borra el lienzo). 6 requiere 1+2.

---

## 5. Plan por capa

### Capa 0 — No ensuciar `class_results`

**Qué:** En `upsertLiveStudentResponse`, `if (activityType === 'escape_room') return;` junto al de `torneo`.

**Qué no:** No tocar scoring, no tocar el viewer, no crear módulos.

**Hecho cuando:** Test de contrato: un `student-response` de `escape_room` no crea/actualiza `ClassResult`. Torneo y el resto de actividades siguen igual.

**Mejora opcional:** ninguna. Es un cortafuegos.

---

### Capa 1 — Motor de ejecución (backend)

**Modelo (ilustrativo, nombres finales al implementar):**

- `EscapeRoomLiveSession` atada a `ClassSession.id` (como `TorneoSession.sessionId`).
- `EscapeRoomTeam` + miembros (`studentId`, `studentName`, sin FK a User).
- `EscapeRoomTeamRoom` unique `(teamId, salaId)`: intentos, pistas reveladas, estado `abierta | superada | agotada`, puntos.

**Redis:** `escape-room:{liveId}:startTime` (+ límite en minutos del JSON de la actividad). No guardar progreso en Redis.

**Servicio:** `EscapeRoomLiveService` (espejo de `TorneoService`). Validar respuesta con el JSON de `Slide.content` + `escape-room-logic` espejo. Primera respuesta correcta del equipo gana; segunda concurrente es no-op. Agotar intentos → estado `agotada`, 0 puntos, sala siguiente (D2).

**Sockets:**

| Evento | Dónde se escucha | Quién |
|---|---|---|
| `escape-room:init` / asignación de equipos (manual o auto) | `/live` | Docente |
| `escape-room:join-team` / `hint-request` / `answer` / `state` | `ClassesGateway` | Estudiante (el `liveSocket` actual) |
| `escape-room:team-assigned` / `room-unlocked` / `team-progress` / `state` | Broadcast a `live:` **y** `class-` | Servidor |

**Asignación:** docente lanza (auto: round-robin de conectados en la sesión; manual: lista). Un estudiante, un equipo por sesión.

**Hecho cuando:** tests de contrato: asignación, carrera de dos respuestas, reconexión (`state` hidrata sala/intentos/pistas), guest con `studentId` de join, cliente que miente `correct: true` no desbloquea, `exclude` de scoring intacto.

**Qué no:** no migrar `salas[]` a SQL; no `WorkGroup`; no XP.

---

### Capa 2 — Viewer en vivo sin romper 1.0

**Qué:** Quitar el `_` de `_liveSocket` / `_studentId` / `_classId`. Hook `useEscapeRoomSession`:

- Si hay socket + `classId` + `studentId` + sesión de escape room activa → estado desde `escape-room:state` y eventos de equipo (cualquier miembro acierta → todos avanzan).
- Si no → el `useState` actual, bit a bit.

Pantalla de “tu equipo” **solo** en el ramal en vivo, antes o junto a `intro`. Preview/autónomo no la ven.

Reconexión: al remontar, pedir `state`; no resetear a sala 1 si el equipo ya avanzó.

**Qué no:** no reescribir fases ni overlays; no conectar `/live` extra en el estudiante; no exigir equipo para poder jugar en autónomo.

**Hecho cuando:** F5 en vivo recupera sala; F5 en preview sigue en intro; dos pestañas del mismo equipo avanzan juntas; preview sin backend de equipos funciona como hoy.

---

### Capa 3 — Pistas e intentos (JSON + editor + viewer 1.0)

**Qué:**

- Tipo: `pistas?: string[]`; `pista?: string` queda como legado de lectura.
- `normalizeSala`: si viene `pistas` usarla; si solo `pista`, `pistas: [pista]`; al persistir escribir `pistas` (y se puede omitir `pista`).
- Relajar clamp de `intentosMaximos`: entero ≥ 1 o −1; default 3; rechazar 0 y negativos distintos de −1.
- `EscapeRoomSalaConfigFields`: lista ordenada de pistas (add/remove/reorder) vía `onUpdate`; input numérico de intentos. **Mismo** `onUpdate(patch)`.
- Viewer: revelar pista *n* tras el n-ésimo fallo (D3, sin resta de puntos). Con una sola pista se ve igual que hoy.

**Qué no:** no penalización configurable; no backend DTO nuevo “por si acaso”.

**Hecho cuando:** clase vieja con `pista: "abc"` se abre y al guardar queda `pistas: ["abc"]`; intentos = 5 sobrevive a `normalizeSala`; tests unitarios de `normalizeSala`.

---

### Capa 4 — Dashboard docente

**Qué:** componente nuevo `EscapeRoomLiveDashboard` (no un `if` más en `LiveResponsesPanel`). Matriz equipos × salas: estado, intentos, pistas, tiempo de equipo. Datos = estado agregado del servicio (no reconstruir el feed genérico). Escucha `escape-room:team-progress` / `room-unlocked`.

**Qué no:** no mezclar filas de quiz en ese panel; no leer `class_results`.

**Hecho cuando:** dos equipos se mueven en vivo en la matriz; otras actividades siguen en `LiveResponsesPanel` sin ruido de escape room.

---

### Capa 5 — Canvas de sala en el estudiante

**Qué:** si la sala tiene `bloques`/`fondo`, el viewer los pinta con `SlideRenderer` en modo viewer (sin handles, sin `useBlockDrag`). El formulario de acertijo permanece (overlay o columna), **misma** validación. Si no hay `bloques`, la tarjeta clásica actual.

**Contrato canvas:** `getBlockPos` / `blockPosToStyle`; no duplicar posición; widgets del lienzo siguen su contrato de viewer (clic, no edición).

**Qué no:** no rediseñar `EscapeRoomSalaCanvas`; no “arreglar” DT-ER-08; no romper salas solo-texto.

**Hecho cuando:** sala con canvas se ve en preview **y** en vivo; sala legacy idéntica a 1.0; tests visuales o de render del fallback.

---

### Capa 6 — Cierre

**Qué:** `onComplete` deja de ser `undefined` en `slide-renderer`. El padre notifica cierre de **equipo** por evento dedicado (`escape-room:finished`), no por `activity:complete`. Victoria 1.0 se conserva (trofeo, confetti, desglose). Si `mostrarRanking` y hay equipos, se añade el podio. Botón salir/finalizar (hoy no existe).

**Qué no:** no rediseñar la pantalla; no pasar `puntos` (escala 300) como `score` académico.

**Hecho cuando:** el docente ve el cierre en el dashboard; el estudiante no gana XP de planilla; `mostrarRanking: false` no muestra podio.

---

## 6. Qué se mejora (sin cambiar el contrato)

| Mejora | Por qué es segura |
|---|---|
| Bypass `escape_room` en upsert | Igual que `torneo`; el scoring ya excluía la nota. |
| Lógica de acierto espejo FE/BE | Misma comparación `trim` / `ignorarMayusculas`; solo cambia *quién* tiene autoridad en vivo. |
| `pistas[]` con lectura de `pista` | Clases viejas siguen jugables. |
| Intentos distintos de 1–3 | El viewer ya trata cualquier `intentosMaximos` y −1; solo el normalizer lo impedía. |
| Fallback local del hook | Preview/autónomo = comportamiento actual. |
| Dashboard aparte | El panel genérico no cambia de contrato. |

---

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Mega-PR que rompe 1.0 | Una capa / un prompt. Cada capa debe dejar el 1.0 jugable. |
| Agente copia Redis+snapshot | Prompt v3 lo prohíbe; referente = `torneo.service.ts`. |
| Agente pone eventos solo en `/live` | Estudiantes no los oyen. Prompt: student emit en `ClassesGateway`. |
| `onComplete` → XP | Prohibido en prompts y en capa 6. |
| `normalizeSala` no se actualiza y el input de intentos “no funciona” | Capa 3 obliga el cambio en el normalizer primero. |
| Canvas antes que hidratación | Capa 5 después de capa 2. |
| Dos lógicas de acierto | Un módulo espejo; prohibido reimplementar `esCorrecta` en el gateway. |

---

## 8. Cómo ejecutar (operativa)

1. Leer, por sesión: este plan + el prompt **de esa capa** en `PROMPT_FASE5_ESCAPE_ROOM_V3.md` + peritaje + addendum + `LUMINA_CONTEXT_V41.md`.
2. No adelantar la capa siguiente “porque está relacionado”.
3. Tras cada capa: el Escape Room 1.0 individual (preview y autónomo) sigue jugable de punta a punta.
4. No commitear hasta que lo pida Jaime.

**Prompts:** usar v3. El v2 de Antigravity queda **obsoleto** (patrón de persistencia incorrecto, `onComplete` mezclado en backend, normalización backend inventada, alcance en un solo bloque).

**Cierre (26/08/2026):** las siete capas están en código. El reloj compartido quedó en `EscapeRoomRun.startedAt` (Postgres), no en Redis — ver V41 §12.2 D4. Deuda diferida en el backlog del roadmap (DT-ER-08 y afines).
