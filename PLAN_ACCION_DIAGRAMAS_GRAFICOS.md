# Plan de acción — Diagramas, Gráficos y Elementos Relacionados

> **Fecha:** 27 de agosto de 2026  
> **Cierre:** 30/08/2026 — **PLAN CERRADO.**  
> **Revisión:** 30/08/2026 — contrastado con análisis Claude (robustez operativa) + peritaje de cierre.  
> **Fuentes:** Análisis de Mejoras (27/08/2026), `LUMINA_ROADMAP_DETALLADO.md`, validación contra repo.  
> **Estado:** Capas 0–10 ✅ (30/08/2026). **Capa 11 eliminada** (ruleta roster innecesaria).  
> **Norma histórica:** una capa por sesión/PR; no romper editor canvas, widgets G9 ni actividades G4 existentes; extender por contratos.

---

## 1. Principios (no negociables)

1. **Contratos canvas 3.2.** Todo bloque nuevo en el slide (`diagrama`, `grafico`, widgets) sigue: `getBlockPos` → transformar → clamp → persistir → historial. El drag del **bloque** en el canvas usa `@dnd-kit`; el drag **interno** (nodos Venn, nodos React Flow) solo captura pointer cuando el bloque está **seleccionado**.
2. **Un solo writer canónico por tipo.** Cada bloque tiene `normalize*` / defaults en un único módulo (patrón `normalizeSala`, `createDefaultRuleta`, widgets `*-defaults.ts`). Editor y viewer pasan por la misma hidratación.
3. **Separar estructura vs modo de uso.** Modelo: `estructura` + `modo: 'contenido' | 'plantilla_evaluable'`. **v1 = solo `contenido`** + `soloLecturaEnViewer: true` en **diagrama y gráfico**. Evaluable es capa futura.
4. **Stack cerrado — diagramas.** `@xyflow/react` (ya en `src/components/activities/historia-ramificada/historia-ramificada-editor.tsx`). **Mermaid descartado**. No reabrir.
5. **Stack cerrado — gráficos v1.** **Recharts** (`components/ui/chart.tsx`). ApexCharts instalado — solo spike visual. **`bar` y `column` son el mismo `BarChart`** con `layout` horizontal vs vertical; no dos ramas de componente.
6. **Venn ≠ grafo.** SVG + regiones + DnD a zonas; no React Flow.
7. **No confundir nombres.** Subtipo `cronologia` ≠ widget `timeline` (Grupo 9). UI: “Cronología pedagógica” vs “Línea de tiempo (widget)”.
8. **Ruleta = widget de opciones.** Un solo producto (G9). El modo “estudiante al azar” / roster live **no forma parte de Lumina**; Capa 11 se eliminó.
9. **Matemáticas: reglas primero.** Generador determinístico; BYOK solo para variar enunciados. BYOK Fase 1 ya está completo.
10. **Mapa de progreso = dominio LMS.** UI de grafo reutilizable; desbloqueo y estado por matrícula en backend. Capa 9s + 9 cerradas 30/08/2026.
11. **Degradación.** Bloques sin datos válidos → empty state; preview y autónomo no se rompen.
12. **Bundle.** React Flow y Recharts vía `dynamic import`.
13. **Mutaciones internas no spamean PATCH.** Drag de nodos RF / elementos Venn / celdas de gráfico se **agregan** (debounce ~300 ms **o** commit al soltar) antes de escribir el JSON del slide. Nunca un PATCH ni un `onChange` persistible por frame. El autosave del editor (`useAutosave`, delay 2000 ms) **no basta**: si el grafo ensucia `slide.content` 30 veces/s, el debounce de 2 s igual dispara PATCH en ráfaga al soltar o durante un drag largo.
14. **DoD transversal capas 4–8.** (a) Alternativa textual: `titulo` + `descripcionAccesible` (aria en viewer). (b) Undo/redo del canvas principal no corrompe el JSON interno del bloque.

---

## 2. Decisiones de producto (cerradas para este plan)

| ID | Decisión | Valor |
|---|---|---|
| **D-DG-01** | Stack diagramas | `@xyflow/react` único motor de grafos; Mermaid no |
| **D-DG-02** | Stack gráficos v1 | Recharts; subconjunto pedagógico curado |
| **D-DG-03** | Evaluación v1 | Contenido; evaluación = composición con actividades en el mismo slide |
| **D-DG-04** | Datos gráficos | Mini-tabla en propiedades; **sin** import CSV en v1 |
| **D-DG-05** | Mapa progreso layout v1 | Automático por orden de clases; reposición manual = v2 |
| **D-DG-06** | Misión/Quest | Solo `nombreMision?` + `fragmentosHistoria?`; sin ramificación |
| **D-DG-07** | Ruleta | Un solo producto: widget G9 de opciones. Modo estudiantes **descartado** (Capa 11 eliminada) |
| **D-DG-08** | Prerrequisito canvas | P0 cerrado 30/08/2026 (ver Capa 0) |
| **D-DG-09** | Completitud mapa progreso | **Cerrado 30/08/2026.** Fuente de verdad = Capa 9 v1 (no el borrador 9s): mix manual / autónomo / live; GET deriva; desbloqueo topológico; secuencia por `createdAt`. Sin `minScore`, sin gate de `Period`, sin `Class.order`. |
| **D-DG-10** | bar vs column | Un solo `BarChart` Recharts; `layout: 'vertical' \| 'horizontal'` |

**Fuera de este plan (deuda explícita, no bloquea el cierre):** evaluación automática de diagramas, radar/dispersión, import CSV, reposición manual de nodos del mapa (v2), Misión con ramificación.

---

## 3. Estado actual del repo (línea base)

Rutas **completas** desde `lumina-frontend/src/` (evitar filenames sueltos en prompts).

| Pieza | Ruta real | Reutilización |
|---|---|---|
| React Flow en actividad | `components/activities/historia-ramificada/historia-ramificada-editor.tsx` (`@xyflow/react@12.11.0`) | Extraer a graph-core |
| Widgets G9 (12 tipos, incluye ruleta) | `components/widgets/shared/widget-registry.ts` | Patrón editor/viewer/properties/defaults |
| Ruleta (canónico) | `components/widgets/ruleta/*` | `normalizeRuletaBlock` hidrata JSON G4 legado |
| Drag canvas | `hooks/use-block-drag.ts`, `app/(app)/classes/[id]/editor/components/editor-dnd-shell.tsx` | Capa 0 hecha |
| Recharts | `components/ui/chart.tsx`, analytics (`recharts@2.15.1`) | Base bloque `grafico` |
| ApexCharts | `package.json` (`apexcharts`, `react-apexcharts`) | **No usado** por este plan (resto Metronic); no es dependencia de `grafico` |
| Timeline widget | `components/widgets/timeline/*` | Distinto de subtipo `cronologia` |
| Autosave slide | `hooks/use-autosave.ts` (default **2000 ms**) | No sustituye el debounce interno (§1.13) |
| Tests frontend | **Vitest** (`pnpm exec vitest run`) | No Jest |
| Tests backend | **Jest** (`pnpm test` en `lumina-backend`) | Capa 9 lógica + LMS |
| Tipos slide | `types/slide.types.ts`, `types/widget.types.ts` | `diagrama`, `grafico`, `ruleta` widget |

---

## 4. Contratos de datos (borrador v1)

Campos comunes a `diagrama` y `grafico`:

```ts
modo: 'contenido';              // v1 fijo
soloLecturaEnViewer: true;      // v1 fijo
titulo?: string;
descripcionAccesible?: string;  // aria / texto alternativo en viewer
```

### 4.1 Bloque `diagrama` (grafos)

```ts
type DiagramaSubtipo =
  | 'cronologia'
  | 'mapa_mental'
  | 'organigrama'
  | 'mapa_conceptual'
  | 'flujo';

interface DiagramaGrafoBlock {
  id: string;
  tipo: 'diagrama';
  subtipo: DiagramaSubtipo;
  modo: 'contenido';
  soloLecturaEnViewer: true;
  titulo?: string;
  descripcionAccesible?: string;
  x?: number; y?: number; ancho?: number; alto?: number;
  nodos: Array<{
    id: string;
    etiqueta: string;
    cuerpo?: string;
    x: number;
    y: number;
    estilo?: Record<string, unknown>;
  }>;
  aristas: Array<{
    id: string;
    desdeId: string;
    haciaId: string;
    etiqueta?: string;
    dirigida?: boolean;
  }>;
  layout?: 'libre' | 'jerarquico' | 'lineal';
}
```

### 4.2 Bloque `diagrama` — Venn (geometría aparte)

`elementos[].regionId` queda desde v1: es el estado que usará la versión evaluable. Cero migración futura.

```ts
interface DiagramaVennBlock {
  id: string;
  tipo: 'diagrama';
  subtipo: 'venn';
  modo: 'contenido';
  soloLecturaEnViewer: true;
  titulo?: string;
  descripcionAccesible?: string;
  x?: number; y?: number; ancho?: number; alto?: number;
  conjuntos: 2 | 3;
  regiones: Array<{ id: string; etiqueta?: string }>;
  elementos: Array<{ id: string; texto: string; regionId: string | null }>;
}
```

### 4.3 Bloque `grafico`

```ts
/** bar = BarChart layout vertical (columnas); column = alias de persistencia → mismo componente. */
type GraficoChartType =
  | 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'radialBar';

interface GraficoDatosBlock {
  id: string;
  tipo: 'grafico';
  modo: 'contenido';
  soloLecturaEnViewer: true;
  chartType: GraficoChartType;
  x?: number; y?: number; ancho?: number; alto?: number;
  categorias: string[];
  series: Array<{ nombre: string; valores: number[] }>;
  colorPaleta?: string;
  titulo?: string;
  descripcionAccesible?: string;
  mostrarLeyenda?: boolean;
}
```

### 4.4 Mapa de progreso (curso — Prisma + API)

Cerrado en Capa 9s. Persistencia: `Course.progressMap` (JSON de edges) + `StudentClassProgress` (completado manual). Completitud live/autónoma se **deriva** en el GET (v1, sin job de sync).

```ts
interface CourseProgressMapJson {
  edges: Array<{ fromClassId: string; toClassId: string }>;
}
```

### 4.5 Misión / Quest (clase)

```ts
interface ClassNarrativeMeta {
  nombreMision?: string;
  fragmentosHistoria?: string[];
}
```

### 4.6 Generador matemáticas (salida)

Ítems `quiz_multiple` / `short_answer` + metadatos `{ generador: 'matematicas', tema, grado }`; evaluación vía `evaluateActivityResponse`.

---

## 5. Mapa de capas

```
Capa 0    P0 DragOverlay / preview al arrastrar                       ✅
Capa 1    graph-core (extraer Historia ramificada)                    ✅
Capa 2    Ruleta → widget G9 (modo opciones + normalize legado)       ✅
Capa 3    Generador matemáticas (reglas)            [paralelo 2–4]    ✅
Capa 4    Bloque grafico (Recharts v1)              [paralelo 2–3]    ✅
Capa 5    Diagrama Venn (SVG)                      [// 1 no requerida] ✅
Capa 6    Diagrama cronologia                      [// 5, 7]          ✅
Capa 7    Diagrama mapa_mental (primer RF canvas)  [requiere 1]       ✅
Capa 8    organigrama + mapa_conceptual + flujo    [requiere 7]       ✅
Capa 9s   Spike criterio completitud mapa Edu                         ✅
Capa 9    Mapa progreso Edu                                           ✅
Capa 10   Misión/Quest (2 campos)                                     ✅
Capa 11   Ruleta modo estudiantes                                     —  **eliminada**
```

**Dependencias (revisadas 30/08):**

- **0** cerrada. Desbloquea embeber DnD interno en canvas (5–8).
- **1** no requiere 0 para extraer graph-core *dentro* de Historia ramificada (actividad aislada). **Sí** requiere 0 para usar graph-core *dentro de un bloque canvas*.
- **5, 6 y 7 son independientes entre sí** una vez existan: contratos `diagrama` (normalize + rail) y, para 7, graph-core. **6 no bloquea 7.** Priorizar **7 (mapa mental)** sobre 6 si hay que elegir.
- **5** no requiere graph-core (SVG). Puede ir en paralelo a 1.
- **8** requiere **7** (mismo motor RF en canvas).
- **2, 3, 4** en paralelo; no dependen de graph.
- **9** gated por **9s** (ambas cerradas).
- **10** independiente; cerrada.
- **11 eliminada** 30/08/2026: no hay producto de ruleta-roster; el widget de opciones cubre el caso de uso.

Cadena crítica hacia “el docente ve diagramas”: `0 ✅ → 1 → 7` (mapa mental). Venn (5) y cronología (6) no alargan esa cadena.

---

## 6. Plan por capa

### Capa 0 — P0: preview visible al arrastrar bloques ✅

**Cerrada 30/08/2026.** Criterio “si no se reproduce”: el preview in-canvas **ya existía** (`applyLiveDragPositions` → `liveSlide`). No era un overlay vacío del bloque: el `DragOverlay` del rail ya funcionaba. Se endureció writer (snapshot de inicio, sin doble delta), `handleDragCancel`, chip de tipo en overlay (no clon a escala) y `opacity: 1` en el bloque.

**DoD histórico (para prompts futuros de P0-like):** si el preview ya funciona en texto / imagen / widget / actividad / forma, **cerrar documentando** y desbloquear 5–8 — no bloquear indefinidamente.

---

### Capa 1 — graph-core (`src/lib/graph-editor/`)

**Objetivo:** Extraer de Historia ramificada un módulo reutilizable.

**Archivos origen:**  
`lumina-frontend/src/components/activities/historia-ramificada/historia-ramificada-editor.tsx`

**Archivos nuevos:**
- `lumina-frontend/src/lib/graph-editor/types.ts`
- `lumina-frontend/src/lib/graph-editor/lumina-rf-bridge.ts`
- `lumina-frontend/src/lib/graph-editor/graph-canvas.tsx`

**Tareas:**
1. Refactor Historia ramificada para usar graph-core **sin cambiar** JSON de actividad.
2. API: `nodes/edges in → RF → onChange out` (onChange **no** persiste por frame — el consumidor aplica §1.13).
3. Patrón pointer: `interactive={selected}`; handle externo para mover el bloque canvas.
4. Tests unitarios del bridge (ids estables, round-trip).

**DoD:** Historia ramificada behavior-identical; graph-core importable por Capa 7.

**Cerrada 30/08/2026:** Módulo `src/lib/graph-editor/` (`GraphCanvas`, bridge, reconciliadores, types agnósticos) extraído, probado (`lumina-rf-bridge.spec.ts`) y conectado en Historia ramificada.

---

### Capa 2 — Ruleta → widget Grupo 9 (modo opciones)

**Objetivo:** Mover ruleta de G4 a G9 **sin romper clases existentes**.

**Archivos origen:** `lumina-frontend/src/components/activities/ruleta/*`  
**Destino:** `lumina-frontend/src/components/widgets/ruleta/*`

**Tareas:**
1. `createDefaultRuletaWidget()` + `normalizeRuletaBlock` de **lectura**: hidrata tanto widget nuevo como bloque/actividad legado `tipo: 'ruleta'`.
2. Rail widgets; quitar del panel de actividades (o alias “legacy” que escribe ya el contrato widget).
3. Scoring: `exclude` se mantiene; widget no entra en planilla.
4. **Migración no es opcional:** el viewer/editor **siempre** pasan por `normalizeRuletaBlock`. Un script one-time es extra, no sustituto.

**DoD:**
- Docente inserta ruleta desde widgets.
- **Clase legada con ruleta G4 sigue renderizando y girando sin intervención manual.**
- `activity-scoring.spec.ts` sin regresión.

**No incluye:** modo estudiantes (descartado; no hay Capa 11).

**Cerrada 30/08/2026:** widget G9 (`components/widgets/ruleta/*`); rail Widgets; `normalizeRuletaBlock` en lectura/persistencia; G4 se hidrata a widget; `ruleta: 'exclude'` sin cambio.

---

### Capa 3 — Generador de ejercicios matemáticos (reglas)

**Archivos:** `lumina-frontend/src/lib/math-generator/` + `math-generator.spec.ts`

**Temas v1:** suma, resta, multiplicación simple, fracciones básicas, `x + a = b`.

**DoD:** 10 sumas grado 2 sin llevar → ítems `quiz_multiple` / `short_answer`; `evaluateActivityResponse` correcto. Sin `/ai/*`.

**Cerrada 30/08/2026:** `src/lib/math-generator/` (`generateMathActivities`, semilla determinística). Temas v1: suma, resta, multiplicación, fracciones, `x + a = b`. Quiz autoevaluable; `short_answer` queda `manual` (contrato vigente).

---

### Capa 4 — Bloque `grafico` (Recharts v1)

**Tareas:**
1. `normalizeGraficoBlock` con `modo` + `soloLecturaEnViewer`.
2. `bar` y `column` → un `BarChart`; no dos implementaciones.
3. Mini-tabla; lazy `dynamic import`.
4. Debounce §1.13 al editar celdas.
5. `titulo` + `descripcionAccesible` en viewer (`aria-label` / texto).

**DoD:** Columnas desde tabla; present OK; undo/redo no corrompe series; chunk Recharts no carga en editor sin gráfico.

**Cerrada 30/08/2026:** Bloque `grafico` (`src/components/graficos/*`) con contratos canónicos v1, normalizador robusto `normalizeGraficoBlock`, renderizador unificado `BarChart` (`column` y `bar`), `line`, `area`, `pie`, `donut`, `radialBar`, `dynamic import` con `ssr: false`, mini-tabla interactiva con debounce (~300ms) en `GraficoProperties`, inserción en flyout Elementos y tests unitarios en Vitest.

---

### Capa 5 — Diagrama Venn

**Cerrada 30/08/2026:** Subtipo `venn` (SVG + regiones + chips) en `src/components/diagramas/*`. Sin graph-core. `normalizeDiagramaBlock` fuerza catálogo de regiones y `regionId` inválido → `null`. Drag interno de chips solo con bloque seleccionado; persistencia al soltar (`onDiagramaChange`). Propiedades: 2/3 conjuntos + CRUD de elementos con debounce 300 ms. Inserción en flyout Elementos. Contratos canvas 3.2 (`getBlockPos` / `withPosition` / `withRect`). Viewer: `titulo` + `descripcionAccesible` (sr-only). Tests Vitest: regiones, defaults, normalize de slide.

**DoD:** Venn en slide; drag interno solo si bloque seleccionado; persistencia al soltar / debounce 300 ms; undo/redo no corrompe `elementos[]`; `descripcionAccesible` en viewer.

---

### Capa 6 — Diagrama cronologia

**Cerrada 30/08/2026:** Subtipo `cronologia` en el mismo bloque `diagrama` (graph-core, `layout: 'lineal'`). `createDefaultCronologiaBlock` + `layoutCronologiaLineal` (eje Y fijo, x monótona, cadena dirigida automática). El docente no dibuja aristas. Rail: “Cronología pedagógica” (no el widget `timeline`). `descripcionAccesible` + `soloLecturaEnViewer`. Tests en `diagrama-defaults.spec.ts`.

**DoD:** N eventos; no colisiona con widget `timeline`; undo/redo + a11y mínima + §1.13.

---

### Capa 7 — Diagrama mapa_mental

**Requiere Capa 1 + Capa 0.** **No requiere Capa 6.**

**DoD:** Persistencia JSON; pointer §7; undo/redo no corrompe grafo; a11y mínima; §1.13 (commit al soltar nodo o debounce 300 ms).

**Cerrada 30/08/2026:** Bloque `diagrama` (`src/components/diagramas/*`) con subtipo `mapa_mental`, puente con `graph-core` (`diagrama-bridge.ts`), captura de punteros condicional a selección (§7), debounce (~300ms) al mover nodos/editar (§1.13), panel de propiedades con gestión de ramas y conexiones, inserción en flyout Elementos y tests unitarios en Vitest.

---

### Capa 8 — organigrama, mapa_conceptual, flujo

Sobre el motor de Capa 7.

| Subtipo | Delta |
|---|---|
| `organigrama` | layout jerárquico |
| `mapa_conceptual` | etiquetas en aristas |
| `flujo` | aristas dirigidas |

**DoD:** Tres subtipos + plantillas; mismos DoD transversales 4–8.

**Cerrada 30/08/2026:** Fábricas por defecto para `organigrama` (jerárquico), `mapa_conceptual` (con proposiciones/etiquetas en aristas) y `flujo` (con aristas dirigidas y pasos), selector de subtipo y editor de proposiciones en `diagrama-properties.tsx`, botones de inserción dedicados en `flyout-left-panels.tsx` y tests unitarios en Vitest.

---

### Capa 9s — Spike: criterio de completitud y arquitectura de progreso (mapa Edu) ✅

> **Histórico.** El spike sobreespecificó `Class.order`, `minScore` y gate de período. **Gana Capa 9 v1** (D-DG-09 actualizado). El texto de abajo no se reescribe para no perder el rastro de la decisión original.

**Cerrado 30/08/2026 (Decisión D-DG-09).**

#### 1. Criterio de Completitud (D-DG-09.1)
Una clase (`Class`) se considera **completada** para un estudiante cuando se cumple cualquiera de las siguientes vías:
1. **Vía Síncrona (Live):** Existe un `ClassResult` del estudiante en una sesión (`ClassSession`) finalizada (`endedAt != null`).
2. **Vía Asíncrona (Autónomo):** Existe un `AutonomousResult` con `status == 'completed'`. Si la clase contiene actividades evaluables y el curso define nota mínima de aprobación (`minScore`), el puntaje obtenido debe ser $\ge minScore$.
3. **Override del Docente:** El docente puede marcar/desmarcar manualmente la completitud de un estudiante desde el Roster o Libro de Calificaciones.

#### 2. Modelo de Estado Canónico (D-DG-09.2)
El estado de progreso **no** se calcula en caliente recorriendo todas las tablas de resultados ni se empaqueta como un JSON monolítico en `Enrollment`. Se introduce la entidad canónica:

```prisma
model StudentClassProgress {
  id          String         @id @default(cuid())
  userId      String
  classId     String
  courseId    String
  status      ProgressStatus @default(LOCKED) // LOCKED | UNLOCKED | IN_PROGRESS | COMPLETED
  completedAt DateTime?
  unlockedAt  DateTime?
  score       Float?
  source      String         @default("autonomous") // "live" | "autonomous" | "manual_teacher"
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  class  Class  @relation(fields: [classId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, classId])
  @@index([userId, courseId])
  @@map("student_class_progress")
}

enum ProgressStatus {
  LOCKED
  UNLOCKED
  IN_PROGRESS
  COMPLETED
}
```

Y en el modelo `Course`:
```prisma
progressMap Json? // Coordenadas y layout visual del grafo de clases: { nodes: [...], edges: [...] }
```

#### 3. Reglas de Desbloqueo Topológico y Temporal (D-DG-09.3)
1. **Regla Topológica:** Una clase pasa a estado `UNLOCKED` cuando **todos** sus nodos predecesores inmediatos en el grafo (`Course.progressMap.edges`) tienen estado `COMPLETED` para ese estudiante (los nodos raíz sin dependencias se desbloquean al matricularse).
2. **Regla Temporal / Período:** Si el curso tiene períodos (`Period`) o fechas de apertura (`opensAt`), la clase solo se vuelve interactiva si la fecha actual $\ge startDate$ (o si el docente habilita modo flexible).
3. **Fallback v1 sin grafo explícito:** Si el curso no tiene un `progressMap` personalizado, la topología por defecto es lineal según el orden de las clases (`Class.order`).

---

### Capa 9 — Mapa de progreso (Lumina Edu)

**Prerrequisitos:** Capa 9s ✅ y Capa 7 ✅ (`graph-core`).

**Cerrada 30/08/2026 (v1):**
- Prisma: `Course.progressMap` + `StudentClassProgress` (`student_class_progress`).
- API: `GET/PATCH /courses/:courseId/progress-map`, `PUT .../classes/:classId/students/:userId`.
- Completitud (D-DG-09.1): manual **o** `AutonomousResult.completed` **o** `ClassResult` en sesión con `endedAt`. Sin `minScore` de curso (no existe en schema). Sin gate de período (Period es gradebook, no apertura de clase).
- Desbloqueo topológico; sin `progressMap` → secuencia por `Class.createdAt` (no hay `Class.order`).
- Layout automático (D-DG-05); reposición persistida = v2.
- Vista Edu `/edu/:courseId/progress` con `GraphCanvas` (readOnly). Staff marca completado y edita aristas; estudiante ve su camino.

**Fuera de v1:** sync write-on-session-end, gate por `Period`/`opensAt`, `minScore`, drag de nodos persistido.

---

### Capa 10 — Misión / Quest (alcance mínimo)

Dos campos opcionales. Sin scoring. DoD: sin campos = UI idéntica a hoy.

**Cerrada 30/08/2026:** Tipos canónicos `ClassNarrativeMeta` (`nombreMision?`, `fragmentosHistoria?`) en `slide.types.ts` y `use-class.ts`, utilidades y tests en `class-narrativa.ts` / `class-narrativa.spec.ts`, panel de configuración `NarrativaPanel` y badge contextual en barra superior del editor.

---

### Capa 11 — Ruleta modo estudiantes — ELIMINADA

**Eliminada 30/08/2026.** No se implementa `origen: 'estudiantes_live'` ni un segundo producto de ruleta. La ruleta de Lumina es el widget G9 de opciones estáticas (Capa 2). Un sorteo de estudiantes en vivo no aporta al editor pedagógico y acoplaría el widget al roster Socket.IO sin necesidad de planilla.

---

## 7. Convivencia canvas ↔ DnD interno

```
Bloque NO seleccionado → RF/Venn pointer-events: none
Bloque seleccionado    → DnD interno; handle externo mueve el bloque
```

Alinear con widgets G9 (Hotspot, Timeline).

---

## 8. Orden de ejecución recomendado

| Orden | Capa | Paralelo | Esfuerzo |
|---|---|---|---|
| — | 0 — P0 (hecha) | — | — |
| 1 | 2 — Ruleta widget + normalize legado | 3, 4 | Bajo |
| 1 | 3 — Math generator | 2, 4 | Medio |
| 1 | 4 — Gráfico Recharts | 2, 3 | Medio |
| 2 | 1 — graph-core | 5 | Medio |
| 2 | 5 — Venn | 1 | Bajo–Medio |
| 3 | 7 — Mapa mental | 6 | Medio–Alto |
| 3 | 6 — Cronología | 7 | Bajo–Medio |
| 4 | 8 — Resto diagramas | — | Medio–Alto |
| 5 | 9s — Spike completitud | — | Bajo (decisión) |
| 6 | 9 — Mapa progreso | — | Alto; **después de 9s** |
| 7 | 10 — Misión/Quest | — | Bajo |
| — | 11 — Ruleta estudiantes | — | **Eliminada** |

---

## 9. Verificación por capa

Frontend: **Vitest** (no Jest). Backend: **Jest**.

```bash
# Frontend (desde lumina-frontend/)
pnpm exec vitest run src/hooks/use-block-drag.spec.ts
pnpm exec vitest run
pnpm run build

# Backend (desde lumina-backend/)
pnpm exec jest src/progress-map/progress-map.logic.spec.ts
```

| Capa | Prueba |
|---|---|
| 0 | Vitest `use-block-drag.spec.ts` + `editor-dnd-overlay.spec.ts` ✅ |
| 1–8 | `pnpm exec vitest run` + `pnpm run build` en frontend |
| 2 | Clase fixture con ruleta G4 renderiza; `activity-scoring.spec.ts` |
| 3 | `math-generator.spec.ts` casos fijos por grado |
| 4 | Undo/redo + a11y; chunk Recharts perezoso |
| 5–8 | Undo/redo + debounce (no PATCH por frame) + `descripcionAccesible` |
| 6 | Vitest `diagrama-defaults.spec.ts` (cronología lineal) ✅ |
| 9s | Documento de decisión (supersedido en detalle por Capa 9 v1) |
| 9 | Jest `progress-map.logic.spec.ts` + Vitest `progress-map.spec.ts` ✅ |
| 10 | Vitest `class-narrativa.spec.ts` ✅ |
| 11 | — (eliminada) |

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cadena 0→1→5→6→7 demasiado larga | 5/6/7 independientes; priorizar 1→7 |
| PATCH por frame (RF/Venn) | Principio 13; DoD 4–8 |
| Ruleta legada rota | Normalize de lectura obligatorio (Capa 2) |
| Capa 9 sin criterio de negocio | Spike 9s ✅; Capa 9 v1 ✅ |
| Doble DnD canvas + RF | Capa 0 + patrón §7 |
| Bundle | dynamic import |
| bar/column duplicados | D-DG-10 |
| Accesibilidad de SVG/charts | `descripcionAccesible` en 4–8 |
| Undo solo en Capa 7 | DoD transversal 4–8 |

---

## 11. Documentación al cierre

Actualizado 30/08/2026:
- `LUMINA_ROADMAP_DETALLADO.md` (raíz, frontend, backend)
- Este archivo: **PLAN CERRADO**

`LUMINA_CONTEXT_V41.md` / `.cursorrules` no se reescriben aquí (scope de este plan = diagramas/gráficos/Edu mapa).

---

## 12. Prompts históricos (archivo, no ejecutar)

Los ejemplos de Capa 2 y 7 ya se ejecutaron. No reabrir capas cerradas.

---

## 13. Relación con roadmap

El backlog **“Diagramas, Gráficos y Elementos Relacionados”** de `LUMINA_ROADMAP_DETALLADO.md` queda **cerrado** para los ítems de este plan (capas 0–10). Ítems ajenos (PWA, Excel, Tauri, Escape Room diferido) no pertenecen a este documento.

**No hay siguiente capa.** Trabajo nuevo = otro plan.

---

## 14. Revisión 30/08/2026 — análisis Claude (qué se aceptó)

| Hallazgo | Veredicto | Cambio en el plan |
|---|---|---|
| Stack y evidencia de repo correctos | Acuerdo | Sin cambio de stack |
| Rutas Historia/Ruleta incompletas en prompts | Acuerdo (el §3 ya decía `activities/ruleta`; faltaban paths largos) | §3 y Capa 1/2 con rutas `src/...` |
| Cadena 6→7 innecesaria | Acuerdo | 5, 6, 7 independientes; priorizar 7 |
| Capa 0 sin “si no se reproduce” | Acuerdo; capa ya cerrada | Criterio documentado; no bloquea 5–8 |
| `GraficoDatosBlock` sin `modo` / `soloLecturaEnViewer` | Acuerdo | §4.3 alineado; D-DG-10 bar≈column |
| Autosave vs DnD interno | Acuerdo (`useAutosave` = 2 s sobre `content`, no sobre frames del grafo) | Principio 13 |
| Migración ruleta “opcional” | Acuerdo | DoD: legado G4 obligatorio |
| Capa 9 sin criterio de completitud | Acuerdo | Capa 9s + 9 ✅ |
| A11y y undo solo en 7 | Acuerdo | Principio 14 + DoD 4–8 |
| Vitest vs Jest | Acuerdo | §9 explícito: frontend Vitest, backend Jest |

---

## 15. Peritaje de cierre (30/08/2026)

Protocolo: al terminar un plan, contrastar el documento con el repo (errores, duplicados, código innecesario) y **cerrar**.

### 15.1 Errores de documento (corregidos en este cierre)

| Hallazgo | Corrección |
|---|---|
| Capa 6 marcada 🔲 con código ya en repo (`createDefaultCronologiaBlock`, rail, tests) | ✅ |
| Capa 11 viva como pendiente | **Eliminada** (no hay producto) |
| D-DG-07 / principio 8: “dos productos” de ruleta | Un solo widget G9 |
| D-DG-09 / §9s prometían `Class.order`, `minScore`, gate de `Period` y “no calcular en caliente” | La **fuente de verdad es Capa 9 v1**: `createdAt`, GET deriva live/autónomo, sin minScore ni período |
| §3 decía 11 widgets G9 y “añadir diagrama/grafico” | 12 widgets; tipos ya en slide |
| §13 “siguiente paso: Capa 4 / 1” | Obsoleto; plan cerrado |
| Roadmaps ×3 con cronología, gráfico, graph-core, misión y ruleta-roster aún abiertos | Alineados al cierre |

El texto de **Capa 9s** se conserva como histórico; donde choca con Capa 9 v1, gana v1 (D-DG-09 actualizado).

### 15.2 Código duplicado / innecesario (limpiado o dejado documentado)

| Ítem | Acción |
|---|---|
| `src/components/activities/ruleta/*` (reexports muertos + CSS vacío) | **Eliminado** 30/08/2026. El canónico es `components/widgets/ruleta/*`. G4 se hidrata con `normalizeRuletaBlock`. |
| `src/lib/ruleta-defaults.ts` (reexport sin consumidores) | **Eliminado** |
| `createDefaultRuleta()` en widget defaults | Se mantiene: fábrica G4 para scoring/tests; el editor usa `createDefaultRuletaWidget` |
| `apexcharts` + `react-apexcharts` + CSS Metronic | **No es deuda de este plan.** Ningún bloque `grafico` los importa (Recharts). Quitar paquetes = plan aparte (tema Metronic) |
| Tres copias de `LUMINA_ROADMAP_DETALLADO.md` | Convención del monorepo; se sincronizan, no se unifican aquí |

### 15.3 Deuda aceptada (fuera; no reabre el plan)

- Evaluación automática de Venn/diagramas
- Import CSV / radar / dispersión
- Reposición persistida de nodos del mapa Edu (v2)
- Sync write-on-session-end del mapa
- Misión con ramificación
- Paquete `@lumina/graph-editor` npm (hoy es `src/lib/graph-editor/`)

### 15.4 Veredicto

**Plan cerrado.** Capas 0–10 entregadas. Capa 11 no existe. No hay capa siguiente en este documento.
