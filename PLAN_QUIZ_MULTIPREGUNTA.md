# Plan — Quiz multipregunta (`quiz_multiple` → contenedor de N preguntas)

> Actividad **autónoma**, distinta de la Evaluación (ver `PLAN_ACCION_*` / plan de Evaluación).
> La Evaluación **reutiliza** este quiz como uno de sus tipos de sección, pero no depende de su diseño.

Estado previo (chat 18 abr 2026): modelo A1/A2 definido, 4 opciones de layout diseñadas en
visual, **sin implementación en código**. Hoy `quiz_multiple` sigue siendo de una sola pregunta.

---

## 1. Decisiones tomadas (cerradas)

| # | Tema | Decisión | Razón |
|---|---|---|---|
| D1 | Identidad del tipo | Se mantiene `tipo: 'quiz_multiple'` y nombres de campo en español (`preguntas`, `texto`, `opciones`, `esCorrecta`). **No** se migra a `type: 'quiz'` / inglés. | Todo `slide.types.ts`, las claves de `ACTIVITY_SCORING`, las plantillas del editor y el registro de `normalizeActivity` son español + `quiz_multiple`. Cambiar la clave obliga a tocar el mapa de scoring y el de plantillas sin ganar nada. |
| D2 | Respuesta múltiple | **Se conserva.** `esCorrecta` por opción + `multipleRespuesta?` por pregunta. | Es capacidad existente con soporte completo en el viewer actual ([quiz-multiple.tsx:229-364](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/quiz-multiple.tsx)). Quitarla es una regresión silenciosa para docentes que ya crearon quizzes de varias correctas. `notaColombiana` (binary/partial) la cubre. |
| D3 | Puntaje por pregunta | Campo `puntos?: number` **reservado** en `QuizPregunta`, sin uso en v1 (peso uniforme: `correctas / total`). | Mismo criterio que `imagenUrl`: dejar el campo evita re-migrar; no se construye UI de pesos todavía. |
| D4 | Migración de datos | Rama en `normalizeActivity` ([class-slide-normalize.ts:107](lumina-frontend/src/lib/class-slide-normalize.ts)), **no Prisma**. Idempotente. | Las actividades se guardan como JSON en `Slide.content`; `schema.prisma` no tiene modelo de quiz. La "compatibilidad hacia atrás" del contrato original **es** esta función. |
| D5 | Campos legacy en el tipo | Se **eliminan** de `QuizMultiple` los campos de pregunta única; se mueven a `QuizPregunta`. Los ~18 consumidores se ajustan en la misma tanda. | Dejar `pregunta?` / `opciones?` deprecados como opcionales invita a drift. La capa de compatibilidad es `normalizeActivity`, no el tipo. Es el patrón ya establecido en el repo. |
| D6 | Scoring | `ACTIVITY_SCORING.quiz_multiple`: `'binary'` → `'partial'` (crédito parcial `correctas/total`). Actualizar espejo backend + fixtures + `scripts/check-fixtures-sync.mjs`. | Con N preguntas se quiere crédito parcial. Para quizzes de 1 pregunta el resultado no cambia (`notaColombiana(1,1)` = `notaColombiana(1,1)`), así que **no hay migración de datos históricos**. |
| D7 | A2 (SYNCED) | Reutilizar el patrón del **torneo** del gateway ([live-sessions.gateway.ts:250-337](lumina-backend/src/live-sessions/live-sessions.gateway.ts)). Único evento realmente nuevo: `timer:tick` / `timer:end` (timer server-side). `advance/pause/resume/skip` = mensajes de control modelados sobre `torneo:launch-question`. | El gateway ya tiene `torneo:launch-question / answer / question / ranking / finish`, que es casi exactamente un quiz sincronizado con room + auth. Un segundo vocabulario `quiz:*` paralelo es trampa de mantenimiento. |
| D8 | Layouts v1 | Solo las 4 variantes diseñadas: `classic-list`, `color-grid`, `icon-cards`, `pills-horizontal`. Las 3 `two-col-*` quedan como follow-up (Etapa 5). `imagenUrl` existe en el tipo desde el día 1. | Las 4 están revisadas en visual; construir 7 renderers ahora retrasa el trabajo de navegación/flujo, que es el núcleo. |
| D9 | Persistencia de respuestas | Sin tabla nueva en v1. Se mantiene `class-result-persist.helper` + espejo `activity-scoring` backend. A2 en vivo usa el room de live-session existente. | El flujo de resultados ya existe y es compartido por todos los evaluadores. |
| D10 | Navegación interna | Nuevo hook `useQuizNavigation`: índice de pregunta **local** en A1 (patrón Tabs/Carousel — el viewer arranca en 0, el editor no hace PATCH al cambiar de pregunta); **controlado por eventos** en A2. | Contrato de widgets de página ya documentado en `CLAUDE.md` (sección Tabs / Carousel). |

---

## 2. Contrato de datos final

`lumina-frontend/src/types/slide.types.ts` (compartido conceptualmente con el backend):

```typescript
export interface QuizOption {
  id: string;
  texto: string;
  esCorrecta: boolean;
  retroalimentacion?: string;
}

export interface QuizPregunta {
  id: string;
  texto: string;
  imagenUrl?: string;               // solo se renderiza en layouts con soporte de imagen
  opciones: QuizOption[];
  multipleRespuesta?: boolean;      // varias correctas en esta pregunta
  puntos?: number;                  // reservado; sin valor = peso uniforme (v1)
  retroalimentacion?: Feedback;     // correcto / incorrecto / explicacion / mostrarExplicacion
}

export type QuizLayoutVariant =
  | 'classic-list'          // Opción 1: cabecera de color + lista vertical
  | 'color-grid'            // Opción 2: grid 2x2 estilo Kahoot
  | 'icon-cards'            // Opción 3: tarjetas con icono
  | 'pills-horizontal'      // Opción 4: pills de ancho completo
  | 'two-col-color-list'    // follow-up (Etapa 5)
  | 'two-col-neutral-grid'  // follow-up (Etapa 5)
  | 'two-col-image-pills';  // follow-up (Etapa 5) — consume imagenUrl

export interface QuizMultiple {
  tipo: 'quiz_multiple';
  preguntas: QuizPregunta[];

  deliveryMode: 'AUTONOMOUS' | 'SYNCED';   // A1 | A2

  // solo aplica si deliveryMode === 'SYNCED'
  timePerQuestion?: number;                 // segundos
  allowTeacherPause?: boolean;             // default true
  allowTeacherSkip?: boolean;              // default true
  autoAdvanceOnAllAnswered?: boolean;      // default false

  layoutVariant: QuizLayoutVariant;
  shuffleOptions?: boolean;                // mezclar opciones dentro de cada pregunta
  shufflePreguntas?: boolean;              // mezclar el orden de las preguntas
}
```

Notas:
- **No** llevan `id`, `createdAt`, `updatedAt` dentro de `actividad`: la identidad y los timestamps
  viven en el Block/Slide (`.cursorrules`: "el id del bloque raíz lo asigna el editor").
- `correctOptionId` del borrador se descarta: se mantiene `esCorrecta` por opción (D2).

### Eventos Socket.IO (Etapa 4, modo SYNCED)

Modelados sobre `torneo:*`. Nombres finales:

```
quiz:launch          { quizBlockId, questionIndex }     // docente arranca / avanza
quiz:answer          { studentId, questionId, optionIds } // alumno responde (optionIds[] por D2)
quiz:pause           { quizBlockId }
quiz:resume          { quizBlockId }
quiz:skip            { quizBlockId }                     // saltar pregunta actual
quiz:ranking         { quizBlockId, rows }               // reusa payload estilo torneo:ranking
timer:tick           { quizBlockId, secondsLeft }        // NUEVO — timer server-side
timer:end            { quizBlockId, questionId }         // NUEVO
```

### Scoring agregado

```typescript
// v1: peso uniforme
nota = notaColombiana(correctCount, totalQuestions, respondio)  // ya existe en lib/activity-scoring.ts
```

Una pregunta con `multipleRespuesta` cuenta como correcta solo si el conjunto seleccionado
== conjunto de `esCorrecta` (misma regla que `isQuizSelectionCorrect` actual).

---

## 3. Mecánica de migración (`normalizeActivity`)

Añadir rama para `act.tipo === 'quiz_multiple'`:

```typescript
function normalizarQuizMultiple(act: any): QuizMultiple {
  // ya migrado
  if (Array.isArray(act.preguntas)) {
    return {
      ...act,
      deliveryMode: act.deliveryMode ?? 'AUTONOMOUS',
      layoutVariant: act.layoutVariant ?? 'classic-list',
    };
  }
  // legacy: pregunta única con campos sueltos
  return {
    tipo: 'quiz_multiple',
    preguntas: [{
      id: crypto.randomUUID(),
      texto: act.pregunta ?? '',
      opciones: act.opciones ?? [],
      multipleRespuesta: act.multipleRespuesta,
      puntos: act.puntos,
      retroalimentacion: act.retroalimentacion,
    }],
    deliveryMode: 'AUTONOMOUS',
    layoutVariant: 'classic-list',
    shuffleOptions: act.shuffleOptions,
  };
}
```

Idempotente y sin pérdida: si el docente cambia de layout luego, `imagenUrl` sigue disponible.

---

## 4. Plan por etapas

| Etapa | Alcance | Entregable verificable |
|---|---|---|
| **1. Contrato + migración** | `slide.types.ts`, `normalizeActivity` (+ helper), `quizMultipleTemplate`, builders IA (FE `activities-ai-panel.tsx` + BE `ai-features.service.ts`), `ACTIVITY_SCORING` (+ espejo backend + fixtures + `check-fixtures-sync.mjs`), y el ajuste **mínimo de compilación** en los ~18 consumidores (leer `preguntas[0]` donde hoy leen `pregunta`/`opciones`). | `npm run build` (FE) y `nest build` (BE) verdes; quizzes legacy se abren en editor y viewer sin cambio visible; tests de `activity-scoring` verdes. |
| **2. Viewer A1 + navegación** | `useQuizNavigation`, `QuizMultipleViewer` multipregunta (prev/next, progreso X/N, envío al final), scoring agregado con `notaColombiana`, las 4 variantes de layout. | Quiz de 3 preguntas navegable en preview/autónomo; nota agregada correcta; sonidos/estados por pregunta. |
| **3. Editor multipregunta** | Lista de preguntas con add/remove/reorder (`@dnd-kit`), selector `layoutVariant`, selector `deliveryMode`, campos SYNCED (timer, pausa, salto, auto-advance) visibles solo si `SYNCED`. | Docente crea/edita/reordena preguntas; persiste vía el flujo normal del editor (contrato de historial: leer→transformar→clamp→persistir→historial). |
| **4. A2 SYNCED** | Extensión del gateway sobre patrón `torneo`: `quiz:launch/answer/pause/resume/skip/ranking` + `timer:tick`/`timer:end` server-side; controles del docente en la vista en vivo; auto-advance cuando todos respondieron. | Sesión en vivo: docente lanza pregunta, timer baja en todos los clientes, pausa/salta, ranking al cierre. |
| **5. Layouts `two-col-*` + imagen por pregunta** | 3 variantes restantes; campo de imagen en el editor de pregunta. | Selector de layout completo (7); imagen se muestra solo en `two-col-image-pills`. |

---

## 5. Prompt para Cursor — Etapa 1

```
CONTEXTO
El bloque `quiz_multiple` de Lumina hoy tiene UNA sola pregunta. Hay que convertirlo en un
contenedor de N preguntas SIN romper los quizzes existentes ni el build. Solo Etapa 1:
contrato de tipos + migración + ajuste mínimo de compilación. NO tocar viewer/editor UX
todavía (eso es Etapa 2 y 3).

Regla de oro del editor de canvas (ver lumina-frontend/.cursorrules): no cambiar el flujo
leer→transformar→clamp→persistir→historial. Aquí no aplica porque no tocamos el canvas.

TAREAS

1. lumina-frontend/src/types/slide.types.ts
   - Reemplazar la interface `QuizMultiple` por el contrato nuevo (pegar el de la sección 2
     de PLAN_QUIZ_MULTIPREGUNTA.md): `preguntas: QuizPregunta[]`, `deliveryMode`,
     campos SYNCED opcionales, `layoutVariant`, `shuffleOptions`, `shufflePreguntas`.
   - Añadir `QuizPregunta` y el type `QuizLayoutVariant`.
   - Mantener `QuizOption` tal cual (con `esCorrecta`).
   - `tipo` sigue siendo `'quiz_multiple'`. Campos `pregunta`, `opciones`, `multipleRespuesta`,
     `puntos`, `retroalimentacion` SALEN de `QuizMultiple` (se mueven a `QuizPregunta`).

2. lumina-frontend/src/lib/class-slide-normalize.ts
   - Añadir `normalizarQuizMultiple` (código en sección 3 del plan) y enrutarla en
     `normalizeActivity` con `if (act.tipo === 'quiz_multiple') return normalizarQuizMultiple(act);`
   - Debe ser idempotente (si ya trae `preguntas`, solo rellena defaults de `deliveryMode` y
     `layoutVariant`).

3. lumina-frontend/src/app/(app)/classes/[id]/editor/editor-client.tsx
   - `quizMultipleTemplate()` (~línea 208): devolver el shape nuevo — un `preguntas: [{ ... }]`
     con la pregunta y opciones de ejemplo actuales, `deliveryMode: 'AUTONOMOUS'`,
     `layoutVariant: 'classic-list'`.

4. Builders de IA (mismo cambio en ambos):
   - lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/activities-ai-panel.tsx
     → `buildQuizMultipleActivity`
   - lumina-backend/src/ai-features/ai-features.service.ts → equivalente
   - Envolver la(s) pregunta(s) generada(s) en `preguntas: [...]` con el shape nuevo.
     Si el generador ya devuelve varias `questions`, mapear cada una a un `QuizPregunta`.

5. Scoring:
   - lumina-frontend/src/lib/activity-scoring.ts y lumina-backend/src/classes/activity-scoring.ts
     → cambiar `quiz_multiple: 'binary'` a `quiz_multiple: 'partial'` en `ACTIVITY_SCORING`.
   - Actualizar los fixtures (`*.fixtures.json`) y correr `node scripts/check-fixtures-sync.mjs`.
   - Verificar en los .spec que un quiz de 1 pregunta da la MISMA nota que antes.

6. Ajuste mínimo de compilación en los consumidores de `QuizMultiple` (NO rediseñar):
   analytics-client.tsx, slide-renderer.tsx, slides-panel.tsx, present-client.tsx,
   preview-client.tsx, viewer-client.tsx, edu/[courseId]/grade-book-client.tsx,
   quiz-multiple.tsx, canvas-layers.ts, math-generator/*.
   Donde hoy lean `actividad.pregunta` / `actividad.opciones`, leer
   `actividad.preguntas[0]?.texto` / `actividad.preguntas[0]?.opciones ?? []`.
   El objetivo es que compile y que un quiz de 1 pregunta se vea EXACTAMENTE igual que hoy.

VERIFICACIÓN
- `npm run build` en lumina-frontend: verde.
- `npm run build` (o `nest build`) en lumina-backend: verde.
- Tests de activity-scoring (FE y BE): verdes.
- Abrir un quiz existente en /classes/[id]/editor y en /preview: sin cambios visibles.

NO HACER en esta etapa: navegación entre preguntas, layouts nuevos, editor de lista de
preguntas, eventos socket. Eso es Etapa 2-4.
```

---

## 6. Riesgos / puntos abiertos para etapas siguientes

- **Etapa 2**: definir si en A1 el alumno puede volver atrás a cambiar respuestas o el avance
  es de una sola vía (recomendado: una vía, coherente con el "Enviar respuesta" actual).
- **Etapa 4**: confirmar si el torneo cronometra en cliente; si sí, `timer:tick` server-side es
  aditivo y el torneo podría adoptarlo después (no en este plan).
- **Etapa 4**: reconexión de un alumno a mitad de quiz SYNCED — qué pregunta ve al volver.
- **Etapa 3**: límite de preguntas por quiz (sugerido: 20) y de opciones por pregunta (ya hay
  tope de 6 en el editor actual).
