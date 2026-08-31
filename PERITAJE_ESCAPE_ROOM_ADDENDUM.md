# Addendum de contraste — Escape Room (Pre-Fase 5)

> **Fecha:** 26 de agosto de 2026  
> **Complementa:** `PERITAJE_ESCAPE_ROOM.md` (Antigravity, 26/08/2026). No lo reemplaza.  
> **Alcance:** Verificación de afirmaciones de carga, huecos del diagnóstico original, patrón real de persistencia (Torneo / gamificación / live), identidad guest, y decisiones de producto que el prompt v2 deja abiertas.  
> **Regla:** Documento analítico. No modifica código ni redefine el schema de autoría en `Slide.content`.

---

## 0. Veredicto sobre el peritaje original

Las afirmaciones que sostienen Fase 5 **son correctas** y no hace falta un segundo peritaje exhaustivo.

| Afirmación | Código | Resultado |
|---|---|---|
| No hay tablas `EscapeRoom*` en Prisma | `schema.prisma` | Confirmado |
| `escape_room` es `exclude` en scoring | `activity-scoring.ts` L94 (backend y frontend) | Confirmado |
| `upsertLiveStudentResponse` filtra `torneo` y no `escape_room` | `classes.service.ts` L690 | Confirmado |
| Props de socket del viewer prefijadas y sin uso | `escape-room-viewer.tsx` L152–L156 (`_studentId`, `_classId`, `_liveSocket`) | Confirmado |
| `onComplete={undefined}` en el puente del renderer | `slide-renderer.tsx` L999 | Confirmado |
| El viewer **sí** invoca `onComplete` por dentro | `escape-room-viewer.tsx` L233, L255 | Confirmado: el corte está en el padre, no en el motor |
| `liveSocket` ya se pasa al viewer | `slide-renderer.tsx` L998 | Confirmado: el trabajo es dejar de descartarlo, no inventar un canal paralelo |
| No hay agrupación en vivo (no reutilizar `WorkGroup`) | `WorkGroup` es LMS asíncrono | Confirmado |

El resto de este addendum cubre lo que el original **no miró** o **simplificó**, y lo que el prompt v2 **da por sentado**.

---

## 1. Tres patrones de persistencia en vivo (no uno)

El prompt v2 pide «seguir el patrón Redis + snapshot Postgres al cierre, ya usado en gamificación/sesiones». **Ese patrón unificado no existe.** Hay tres, y copiar el incorrecto cambia el diseño de equipos.

### 1.1 Torneo — el referente que el peritaje sí nombra

`torneo.service.ts` + modelos `TorneoSession` / `TorneoAnswer`.

| Capa | Qué guarda | TTL / vida |
|---|---|---|
| **Postgres** | Sesión (`status`, `currentQ`) y **cada respuesta** (`studentId`, `studentName`, puntos, `responseMs`) | Permanente hasta borrar |
| **Redis** | Solo reloj de la pregunta actual: `torneo:{id}:q{n}:startTime` y `timeLimit` | `EX 60` segundos |
| **Carrera** | `findFirst` por `(torneoId, questionIndex, studentId)` → si existe, `return null`; si no, `create` | Primera respuesta gana **en servidor** |
| **Identidad** | `studentId` + `studentName` **sin FK a User** | Sirve guest y alumno |

Torneo **no** usa Redis como fuente de verdad del progreso. Redis es el cronómetro compartido. El ranking se calcula con `groupBy` sobre `TorneoAnswer`.

### 1.2 Gamificación de sesión — Redis efímero

`session-gamification.service.ts`: clave `gamif:{sessionId}`, JSON completo de XP/badges, `EX 86400` (24 h). **No hay snapshot Postgres al cierre.** `activity:complete` alimenta este store.

### 1.3 LiveSessions (slide actual) — memoria de proceso

`live-sessions.service.ts` L20–L51: `Map` en la instancia Node. El comentario del código dice explícitamente: *«en cluster usar Redis»*. No es el patrón a copiar para un Escape Room de equipos.

### 1.4 Implicación para Fase 5

| Necesidad de Escape Room 2.0 | Patrón que sí resuelve hoy | El que no |
|---|---|---|
| Reloj compartido del equipo | Redis de Torneo (start + límite) | Memoria del viewer (`setInterval` local) |
| Progreso / reconexión / ranking al cierre | Postgres de Torneo (`TorneoAnswer`) | Gamificación Redis (se pierde o no alimenta historial) |
| Primera respuesta válida gana | `saveAnswer` en servidor, no el cliente | `esCorrecta()` en el viewer |
| Participante guest | `studentId` opaco + nombre, como `TorneoAnswer` | FK rígida a matrícula / `WorkGroup` |

**Directriz:** no implementar «Redis primario + snapshot al cierre» como dice el prompt. El análogo real es **Torneo**: Postgres como verdad del equipo y de cada sala; Redis solo para el temporizador compartido. Documentar esa decisión en el servicio, no dejarla implícita.

Atar equipos a `ClassSession.id` existente (igual que `TorneoSession.sessionId`). No crear un tipo de sesión paralelo.

---

## 2. Identidad guest — hueco del peritaje original

El peritaje menciona `guestIdentity` de pasada. En producción, el join de clase **crea un `User`** (email `guest_*@lumina.guest`) y un `ClassGuest` (`class_guests`, unique `(classId, userId)`). El id vive en `localStorage` (`lumina_student_id`) y se revalida con `GET /classes/:id/students/:studentId/verify`.

Consecuencias para equipos:

1. **`upsertLiveStudentResponse` sí encuentra al guest** (`user.findUnique` por id). La hipótesis de que los guests no ensucian `class_results` es **falsa**. DT-ER-03 aplica a alumnos autenticados **y** a guests con fila `User`.
2. El motor de equipos debe aceptar el mismo `studentId` que Torneo (User.id de guest o de estudiante), no exigir `Enrollment`.
3. Reconexión: el id de guest es estable en el navegador, pero **otro dispositivo / otro join** puede generar otro `User`. El estado del equipo se recupera por `(sessionId, teamId)` + `studentId` actual, no por nombre.
4. `LiveSessionsGateway` autentica con JWT. El viewer de clase en vivo usa `ClassesGateway` (`student-response`) con identidad de localStorage. Cualquier evento `escape-room:*` debe decidir **qué gateway y qué auth** usan los guests; no asumir el handshake JWT de `/live`.

---

## 3. Filtros reales de `upsertLiveStudentResponse` (matiz a DT-ER-03)

El peritaje cita solo el early-return de `torneo`. El método tiene más cortes, en este orden:

```
1. campos vacíos → return
2. activityType === 'torneo' → return          ← DT-ER-03: escape_room no está
3. isActivityDraftResponse(response) → return
4. no hay ClassSession activa → return
5. studentId no es un User → return
6. evaluateActivityResponse → para escape_room es UNEVALUABLE (score/correct null)
7. upsert en class_results
```

Además, en `classes.gateway.ts` L95, `torneo` tiene un **puente extra** hacia `TorneoService.saveAnswer`. Escape Room no tiene puente equivalente: cada `student-response` de una sala cae al upsert genérico.

En el cliente (`viewer-client.tsx` L370–L454):

- `handleResponse` evalúa **todas** las actividades, incluido `escape_room`.
- Como `exclude` → `score === null`, **no** dispara `activity:complete` / XP (solo si `evaluated.score !== null`).
- Sí emite `student-response` con `correct` casi siempre `null` (el puente de `slide-renderer` descarta `correct` e `intento` del viewer: L1000).

**Al conectar `onComplete`:** `EscapeRoomViewer` pasa `(puntos, timeMs)` en escala de gamificación narrativa (p. ej. 300 por sala), **no** una nota 0–5. No cablear ese callback a `activity:complete` ni a `reportarActividad` sin exclusión explícita. Mezclaría XP de sesión con puntos de escape room.

**DT-ER-03 sigue siendo la primera tarea**, en un cambio aislado: `if (activityType === 'escape_room') return;` junto al de `torneo`. Verificar dashboards de participación: si cuentan filas de `class_results` por slide, dejarán de ver Escape Room; eso es el comportamiento deseado (narrativa, no planilla).

---

## 4. Hallazgos extra que el peritaje no elevó a deuda

### 4.1 `normalizeSala` recorta `intentosMaximos` (bloquea el punto 5 del roadmap)

```ts
// escape-room-editor.tsx ~L80-L83
let intentos = raw?.intentosMaximos ?? 3;
if (intentos !== -1 && intentos !== 1 && intentos !== 2 && intentos !== 3) {
  intentos = 3;
}
```

El prompt v2 pide un input numérico flexible. **Hoy cualquier valor distinto de 1, 2, 3, −1 se silencia a 3 al normalizar.** Cambiar el `<select>` sin tocar `normalizeSala` no tiene efecto. No hay `normalizeSala` en backend: la transformación vive solo al escribir/leer JSON en frontend.

### 4.2 `pista` → `pistas` aún no existe en tipos ni en normalización

`EscapeRoomSala.pista?: string` (`slide.types.ts` L283). `normalizeSala` copia `pista: raw?.pista` y **no** convierte a array. La migración retrocompatible que piden peritaje y prompt hay que hacerla **ahí** (y en el tipo). Pedir un “equivalente backend” solo tiene sentido si se añade validación en el PATCH de slide; hoy ese punto no existe. Inventarlo como validador nuevo es alcance extra.

### 4.3 Validación de respuesta 100 % en cliente

`esCorrecta()` y `calcularPuntos()` corren en el viewer. El servidor no conoce `respuestaCorrecta`. Con equipos, un cliente puede emitir un desbloqueo falso. El peritaje marca la carrera entre dos miembros; **no marca la autoridad de validación**. Fase 5 debe validar en servidor (el JSON de la sala está en `Slide.content`) y tratar el cliente como terminal.

### 4.4 Reloj local, no de equipo

El timer es `Date.now()` + `setInterval` en el cliente. Tres miembros = tres relojes. Derrota por tiempo no es un evento de equipo. El análogo es el Redis de Torneo (`startTime` + `timeLimit`), no un intervalo por pestaña.

### 4.5 Tres superficies de ejecución, un solo viewer

`EscapeRoomViewer` se monta vía `SlideRenderer` en:

- editor / preview
- viewer de clase en vivo (`viewer-client.tsx`)
- modo autónomo (`autonomo-client.tsx` — usa `SlideRenderer`; no hay código específico de escape room)

El modo equipos **solo tiene sentido en sesión en vivo**. Si `useEscapeRoomSession` exige socket, el autónomo y el preview se rompen. El hook debe degradar: sin socket / sin equipo → máquina de estados local actual (1.0).

### 4.6 `onAnswer` pierde metadatos

`EscapeRoomViewer` emite `(salaId, answer, correct, intento)`. `slide-renderer` solo reenvía `{ roomId, answer }`. Aunque se filtre `class_results`, el dashboard docente no puede reconstruir intentos desde el feed genérico. Otro motivo para **no** reutilizar `response-update` y sí eventos `escape-room:*`.

### 4.7 Un Escape Room por clase en el designer

`findEscapeRoomSlide` toma el primer slide con actividad `escape_room`. Fuera de alcance de Fase 5 v2, pero visible si el canvas dedicado se vuelve el editor principal.

---

## 5. Fuera de alcance explícito (para que un agente no lo “arregle de paso”)

| Ítem | Por qué se recorta |
|---|---|
| **DT-ER-08** — auto-save del editor principal vs Guardar/Ctrl+S en `/escape-room` | Usabilidad docente, no bloquea el motor 2.0 |
| Varios Escape Rooms por clase en la ruta dedicada | Producto; no está en el roadmap de 7 viñetas |
| Penalización / cooldown configurable por pista | El roadmap pide `pistas?: string[]`, no economía de puntos |
| Candado real (equipo atascado) vs avance forzado | Cambio de metáfora; ver decisión D2 |
| Fusionar con Evaluación autónoma / `activity-scoring` | Prohibido por roadmap y peritaje |
| Reutilizar `WorkGroup` | Confirmado: otro subsistema |

---

## 6. Decisiones de producto (no deben improvisarse en código)

Pendientes de confirmación de Jaime. Abajo va la **recomendación de arquitectura** para no bloquear el diseño. Si se elige lo contrario, hay que actualizar este addendum antes de implementar.

### D1 — ¿2.0 es solo en vivo por equipos, o también individual/autónomo persistente?

**Recomendación:** Fase 5 entrega **equipos en sesión en vivo**. Individual y autónomo siguen con el viewer 1.0 local (se pierde al F5). El hook de sesión es opcional: sin `liveSocket` o sin `teamId`, no hay hidratación remota.

No exigir persistencia de progreso individual en esta fase.

### D2 — Al agotar intentos: ¿avance con 0 puntos (hoy) o candado real?

**Recomendación:** **mantener el comportamiento actual** (overlay de bloqueo, 0 puntos, avance a la siguiente sala a los 1.5 s), aplicado al **equipo**. Un miembro agota los intentos del equipo para esa sala; el equipo no se atasca.

Un candado verdadero (nadie pasa sin acierto o sin desbloqueo docente) es otra mecánica y no está en las 7 viñetas con ese detalle. Se puede dejar como flag futuro, no como default.

### D3 — Pistas: ¿solo revelado progresivo, o penalización configurable?

**Recomendación:** **solo array + revelado progresivo** (Pista n tras el n-ésimo fallo). Sin resta de puntos y sin cooldown en v2. El campo `pista` legado se lee como `pistas: [pista]` en `normalizeSala`.

“Configurable” infla editor, viewer, dashboard y tests sin estar en el roadmap.

### D4 — ¿Postgres de progreso (como Torneo) o Redis + snapshot?

**Recomendación:** **como Torneo**, no como el prompt v2:

- Modelo de ejecución nuevo (nombre ilustrativo): sesión de escape room atada a `ClassSession`, equipos, miembros (`studentId` + `studentName`), progreso por `(teamId, salaId)`: intentos, pistas reveladas, estado (`abierta` / `superada` / `agotada`), puntos.
- Redis: `startTime` del escape room (y opcionalmente lock corto de validación).
- Validación de respuesta y desbloqueo **solo en servidor**.
- Ranking de cierre = agregación del progreso persistido, si `mostrarRanking === true`.

No migrar salas/desafíos a tablas relacionales. Eso sigue en `Slide.content`.

---

## 7. Correcciones al prompt v2 (si se reusa)

| Lo que dice el prompt | Ajuste |
|---|---|
| Redis + snapshot Postgres al cierre (patrón “ya usado”) | Usar el split de Torneo (Postgres progreso + Redis reloj). |
| Normalización `pista` → `pistas` también en backend | Hacerla en `normalizeSala` (frontend). Backend solo si nace un DTO de slide. |
| Tarea 6 backend: conectar `onComplete` en `slide-renderer` | Eso es frontend. Backend recibe un evento de cierre de **equipo**, no el prop de React. |
| Flexibilizar `intentosMaximos` | Obligatorio relajar el clamp de `normalizeSala`; si no, el input nuevo no sirve. |
| Cablear `_liveSocket` | Correcto y prioritario. Degradar si el socket es null (preview/autónomo). |
| `WorkGroup` no reutilizar | Correcto. Identidad = mismo `studentId` que join/guest. |
| Tests de contrato backend | Añadir: validación server-side (cliente mentiroso no desbloquea); guest en equipo; autónomo sin socket no rompe. Frontend: `normalizeSala` (pista legado + intentos ≠ {1,2,3,−1}). |
| Un solo bloque de 6 tareas | Cortar en capas (sección 8). |

---

## 8. Orden de implementación recomendado

No un PR único backend+frontend+canvas+dashboard.

| Capa | Qué | Desbloquea |
|---|---|---|
| **0** | Filtro `escape_room` en `upsertLiveStudentResponse` (+ test de exclusión) | DT-ER-03, higiene de `class_results` |
| **1** | Servicio + modelos de ejecución + eventos `escape-room:*` + `escape-room:state` + validación en servidor + reloj Redis | DT-ER-01, DT-ER-05, DT-ER-07, riesgo Alto |
| **2** | Viewer: usar props reales de socket; `useEscapeRoomSession` con fallback local; asignación de equipo; reconexión | Puntos 3 y 4 del roadmap |
| **3** | `pistas[]` + clamp de intentos relajado en `normalizeSala`; UI editor/viewer | Puntos 2 y 5 |
| **4** | `EscapeRoomLiveDashboard` (componente nuevo; no mezclar con `LiveResponsesPanel`) | Punto 4 |
| **5** | Canvas visual en el viewer + fallback legacy sin `bloques` | Punto 1 / DT-ER-02 (independiente de equipos una vez el viewer no se remonta a ciegas) |
| **6** | `onComplete` cableado **sin** XP académico; leaderboard si `mostrarRanking`; botón salir | Punto 6 / DT-ER-06 |

La capa 5 (canvas) puede ir en paralelo a 3–4 **después** de la 2, no antes: hidratar mal el estado hace que el lienzo visual se resetee con F5.

---

## 9. Resumen ejecutivo

1. El peritaje original es **línea de base válida**. Este addendum no lo invalida.
2. El prompt v2 es una buena traducción a tareas, con un error de patrón: **no existe** “Redis + snapshot Postgres” genérico; Torneo persiste respuestas en Postgres y usa Redis solo como reloj.
3. Los guests **sí son `User`**: DT-ER-03 es más serio de lo que un filtro “solo alumnos” sugeriría.
4. `normalizeSala` hoy **impide** intentos flexibles y aún no migra `pista` → `pistas`.
5. Cuatro decisiones (D1–D4) deben quedar cerradas (o aceptarse las recomendaciones de la sección 6) antes de escribir el motor de equipos.
6. DT-ER-08 y la penalización configurable de pistas quedan **fuera** de Fase 5 v2 a propósito.
