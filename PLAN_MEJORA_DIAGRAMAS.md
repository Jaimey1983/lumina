# Plan de mejora — Diagramas (bloque `diagrama`)

> **Fecha:** 7 de septiembre de 2026
> **Tipo:** Análisis y estrategia (sin implementación)
> **Alcance:** Bloque `diagrama` del editor de slides — `src/components/diagramas/*` + `src/lib/graph-editor/*`
> **Antecedente:** `PLAN_ACCION_DIAGRAMAS_GRAFICOS.md` (cerró la v1: `@xyflow/react`, Venn SVG, catálogo mínimo). `PLAN_MEJORA_GRAFICOS_DATOS.md` (hermano: mismo diagnóstico y estructura para el bloque `grafico`).

---

## 1. Estado actual (línea base)

### 1.1 Archivos y responsabilidades

| Archivo | Líneas | Rol |
|---|---|---|
| `src/components/diagramas/diagrama-defaults.ts` | 788 | Writer canónico: `normalizeDiagramaBlock` + 6 `createDefault*Block` + `layoutCronologiaLineal`. |
| `src/components/diagramas/diagrama-properties.tsx` | 481 | Panel: selector de subtipo (grid de 5), título, a11y, CRUD de nodos (etiqueta / cuerpo / 7 colores fijos), CRUD de aristas (etiqueta / borrar). |
| `src/components/diagramas/diagrama-editor.tsx` | 258 | Orquesta `GraphCanvas` (grafo) o `VennSvg` (venn); drag de chips Venn; debounce §1.13. |
| `src/components/diagramas/diagrama-viewer.tsx` | 90 | `figure` + `figcaption` + Suspense + empty state. |
| `src/components/diagramas/diagrama-bridge.ts` | 95 | `DiagramaGrafoBlock ↔ GraphModel` (agnóstico). |
| `src/components/diagramas/venn-svg.tsx` | 155 | SVG de 2–3 círculos + chips por región + bandeja "fuera". |
| `src/components/diagramas/diagrama-regions.ts` | 118 | Geometría Venn: círculos, regiones, `regionAtPoint`, centroides. |
| `src/lib/graph-editor/graph-canvas.tsx` | 215 | Lienzo React Flow reutilizable + **`GraphCardNode`** (la única tarjeta de nodo). |
| `src/lib/graph-editor/lumina-rf-bridge.ts` | ~190 | Bridge puro `GraphModel ↔ @xyflow/react`. |
| `src/lib/graph-editor/types.ts` | ~90 | `GraphNode`, `GraphEdge`, `GraphModel`, `GraphPositionAuthority`. |

Wiring: `panels/flyout-left-panels.tsx:293` (sección "Diagramas", 6 botones), `panels/properties-panel.tsx` (panel), `slide-renderer.tsx` (render), `class-slide-normalize.ts` (hidratación), `hooks/use-block-drag.ts` (drag canvas).

**graph-core es compartido:** lo consumen también `components/activities/historia-ramificada/historia-ramificada-editor.tsx` (Capa 1) y el Mapa de progreso Edu (Capa 9). Cualquier cambio a `GraphCardNode` / aristas afecta a las 3 superficies.

### 1.2 Modelo de datos

```ts
type DiagramaSubtipo = 'mapa_mental' | 'organigrama' | 'mapa_conceptual' | 'flujo' | 'cronologia' | 'venn';

interface DiagramaNodo {
  id; etiqueta: string; cuerpo?: string;
  x: number; y: number;
  estilo?: Record<string, unknown>;   // en la práctica solo { color?, destacado? }
}
interface DiagramaArista {
  id; desdeId; haciaId; etiqueta?: string; dirigida?: boolean;
}
interface DiagramaGrafoBlock {
  id; tipo:'diagrama'; subtipo; modo:'contenido'; soloLecturaEnViewer:true;
  x?; y?; ancho?; alto?; zIndex?;
  titulo?; descripcionAccesible?;
  nodos: DiagramaNodo[]; aristas: DiagramaArista[];
  layout?: 'libre' | 'jerarquico' | 'lineal';   // ← se persiste pero NO se aplica (ver §2.3)
}
interface DiagramaVennBlock {
  …; conjuntos: 2 | 3;
  regiones: { id; etiqueta? }[];
  elementos: { id; texto; regionId: string | null }[];
}
```

### 1.3 Catálogo actual: **6 subtipos**

`mapa_mental`, `organigrama`, `mapa_conceptual`, `flujo`, `cronologia` (5 grafos sobre el **mismo motor**, diferenciados por el default y por dos flags: `dirigida` y `etiqueta` en la arista) + `venn` (SVG aparte).

### 1.4 Opciones de configuración actuales

- Selector de subtipo (grid de 5 iconos; Venn se inserta aparte y no aparece aquí).
- Título del diagrama.
- Descripción accesible (textarea, `sr-only`).
- Por nodo: etiqueta, cuerpo, **color entre 7 hex fijos**.
- Por arista: etiqueta (o "palabra de enlace" en mapa conceptual), botón borrar.
- Añadir nodo: lo engancha al nodo raíz (o al último, en flujo) y lo lanza con trigonometría a una posición que suele colisionar.
- Venn: 2 / 3 conjuntos, CRUD de elementos, arrastrar chip a una región.

**Eso es todo.** No hay: forma de nodo, tamaño de nodo, icono/imagen en nodo, tipo de conector (recto / curvo / ortogonal), estilo de línea (discontinua, grosor), flecha en ambos extremos, color de arista, auto-organizar, dirección del árbol, espaciado, ajuste a cuadrícula, tema del lienzo, fondo, tipografía, animación, ni plantillas con contenido.

---

## 2. Diagnóstico — por qué "se ve y se siente básico"

### 2.1 "Todos se ven parecidos" — es literal

**`GraphCardNode` (`graph-canvas.tsx:75`) es la única tarjeta de nodo para TODO.** Un rectángulo blanco, `border-radius: 10`, borde de color, badge con la etiqueta, cuerpo gris a 2 líneas, dos `Handle`. Con eso se pintan `mapa_mental`, `organigrama`, `mapa_conceptual` y `flujo`: **son visualmente indistinguibles**. Cambia el contenido de ejemplo, no la forma. Solo Venn se ve distinto — y porque es otro componente (`VennSvg`), con su propio look plano.

A eso se suma que el **marco exterior del bloque** (`rounded-lg bg-background/50 border border-border/40 p-2 shadow-xs` + título centrado) es idéntico al de `grafico-viewer` y al de los widgets. El diagrama no tiene identidad propia ni dentro (nodos iguales) ni fuera (marco genérico).

### 2.2 Estética

1. **No respeta el tema.** Hex hardcodeados en `graph-canvas.tsx`: nodo `#FFFFFF` / `#EFF6FF`, borde `#6B7280`, realce `#BFDBFE`; aristas `#9CA3AF`; `labelStyle` `#6B7280`; `Background` `#E5E7EB`. En **modo oscuro el lienzo es una plancha blanca** y el texto de los nodos queda gris ilegible. Mismo problema exacto que el bloque `grafico`: los tokens de Lumina (`--card`, `--foreground`, `--muted-foreground`, `--border`, `--primary`, `--chart-1..5`) no se usan. El diagrama tampoco hereda el tema del slide.
2. **Aristas sin carácter.** Todas curvas Bézier grises, marcador `arrowclosed` por defecto de RF. Sin ortogonales para organigrama, sin curvas orgánicas para mapa mental, sin `smoothstep`, sin animación de flujo, sin enrutado que evite cruzar nodos. La etiqueta va en texto suelto de 10px sin fondo → ilegible sobre líneas y nodos.
3. **Sin formas semánticas.** Un diagrama de flujo real necesita **rombo** (decisión), **terminador redondeado** (inicio/fin), **paralelogramo** (entrada/salida). Aquí "3. ¿Confirma la Hipótesis?" es un rectángulo más, con el "¿?" en el texto.
4. **Fondo siempre de puntos**, `Controls` de RF sin estilar, minimapa desactivado, `fitView` grueso, sin viñeta ni encuadre.
5. **Tipografía fija** (`text-xs`, px sueltos). La jerarquía raíz vs hijo es solo un badge y un `box-shadow` azul.
6. **Sin iconografía / imágenes / avatares** en los nodos (organigrama con foto, mapa mental con icono por rama, flujo con icono por tipo de paso).
7. **Venn**: círculos con relleno `rgba()` hardcodeado, etiquetas fijas "A / B / C" (no editables como nombre de conjunto), sin control de color ni opacidad por conjunto, sin 4 conjuntos, chips sin estilo por región.

### 2.3 Catálogo

- Los 5 "tipos" de grafo son **un motor con distinto seed**. La única diferencia de comportamiento real: `flujo`/`organigrama` marcan `dirigida: true`; `mapa_conceptual` muestra el campo "palabra de enlace"; `cronologia` reimpone eje lineal.
- **Faltan familias enteras y de alto valor docente:** espina de pescado (Ishikawa), diagrama de ciclo, cuadro sinóptico (llaves), árbol jerárquico real (LR), mapa mental radial, cronología ramificada, diagrama de estados / secuencia, red / topología, Gantt.
- **No existe ningún organizador gráfico pedagógico:** Frayer, KWL, tabla T, cuadro comparativo, matriz 2×2, mapa de araña, diagrama de afinidad, cadena causa-efecto, SPR (Sé / Pienso / Pregunto). Son plantillas de layout fijo sobre el motor actual: coste bajo, valor alto.

### 2.4 Configuración

- Panel plano, sin secciones. Un docente que quiere "un flujo con decisiones en rombo, conectores en ángulo recto, organizado de arriba a abajo automáticamente y con la rama del 'No' en rojo discontinuo" no puede hacer **ninguna** de esas cosas.
- **`layout` es una etiqueta muerta.** Se persiste `'jerarquico' | 'lineal' | 'libre'` pero **no hay ningún algoritmo de layout** salvo `layoutCronologiaLineal`. "Organigrama jerárquico" son x/y colocados a mano en el default; al añadir un nodo, `handleAddNode` lo tira a una rejilla ingenua (`100 + (count%3)*160`).
- No se pueden crear conexiones desde el panel (solo arrastrando `Handle`, y solo con el bloque seleccionado).

### 2.5 Datos / autoría

- Alta de nodo: un botón, posicionamiento por trigonometría, casi siempre colisiona.
- No hay: crear desde esquema de texto (indentación → árbol), pegar lista, importar OPML / Markdown, **generar con IA** (BYOK ya existe en el repo), duplicar rama, reordenar, plantillas con contenido real.

### 2.6 Accesibilidad

- Solo `descripcionAccesible` en `sr-only`. Sin **representación textual estructurada** (lista anidada del árbol), sin navegación por teclado entre nodos, sin `aria` por nodo/arista, sin foco visible. React Flow trae utilidades a11y que no se aprovechan.

### 2.7 Activo desaprovechado

- **`@xyflow/react` 12.11** tiene sin usar: `NodeResizer`, `NodeToolbar`, múltiples handles, `getSmoothStepPath` / `getStraightPath` para conectores, edges personalizadas con label editable inline, slots `<Panel>`, API `fitView`.
- **`motion` 12** (framer-motion) instalado y sin usar en diagramas → animación de entrada de nodos/aristas.
- **`paper.js` 0.12** instalado → geometría booleana real para Venn de N conjuntos.
- **`positionAuthority: 'model'`** ya está implementado en graph-core para reposición programática — hoy solo lo usa `cronologia`. Es exactamente el hook que necesita el auto-layout.

---

## 3. Estrategia

### 3.1 Principio rector

El render ya está **aislado** tras `dynamic import` de `GraphCanvas`, con `diagrama-bridge` como frontera y **un solo writer canónico** (`normalizeDiagramaBlock`). Todo lo nuevo entra como **campos opcionales** con defaults en el normalizer → **cero migración**:

```ts
DiagramaNodo.forma?     : 'rect'|'rounded'|'pill'|'diamond'|'parallelogram'|'ellipse'|'hexagon'|'chip'|'root'|'card-icon'
DiagramaNodo.icono?     : string        // nombre lucide / emoji
DiagramaNodo.imagen?    : string        // url (organigrama con foto)
DiagramaNodo.ancho?/alto?
DiagramaArista.tipoTrazado? : 'bezier'|'smoothstep'|'straight'|'orthogonal'
DiagramaArista.estiloLinea? : 'solida'|'discontinua'|'punteada'
DiagramaArista.grosor? / color? / flechaInicio?
DiagramaBlock.opciones? : DiagramaOpciones   // tema, fondo, densidad, dirección de layout, animación, fuente…
```

`normalizeDiagramaBlock` sanea subtipo/forma/trazado desconocidos → fallback (ya lo hace con subtipo). Se **extiende**, no se reescribe.

### 3.2 graph-core compartido (la decisión de arquitectura)

Igual que `PLAN_MEJORA_GRAFICOS_DATOS.md §6` propone un contrato único de charts para toda la app, aquí conviene **subir a graph-core** lo que hoy vive disperso o hardcodeado: tema por tokens, catálogo de formas de nodo, edges con estilo, y la representación textual a11y. Beneficio inmediato: Historia ramificada y Mapa de progreso Edu **heredan** el salto visual sin trabajo extra.

Riesgo: no romper Historia ramificada. Mitigación: **variante de nodo por `GraphNode.meta.variant`** (`'card' | 'shape' | 'progress'`), con `'card'` = comportamiento actual exacto. Test de que Historia ramificada y el Mapa Edu renderizan igual que antes.

### 3.3 Palanca 1 — Nodo con formas y tema (el salto visual real)

`GraphCardNode` pasa a ser un **dispatcher de formas** (`ShapeNode`):

| Forma | Uso por defecto |
|---|---|
| `root` (destacada, más grande) | raíz de `mapa_mental`, tope de `organigrama` |
| `chip` (píldora compacta) | hijos de `mapa_mental` |
| `rect` / `rounded` | `mapa_conceptual`, cajas de `organigrama` |
| `pill` / terminador | inicio y fin de `flujo` |
| `diamond` | nodos de decisión de `flujo` |
| `parallelogram` | entrada / salida de `flujo` |
| `card-icon` (icono o foto) | `organigrama`, pasos de `flujo` |
| `ellipse` / `hexagon` | disponibles vía panel |

- Colores por **tokens Lumina** (`--card`, `--foreground`, `--muted-foreground`, `--border`, `--primary`, rampa `--chart-1..n`) en lugar de hex. Modo oscuro y tema del slide **gratis**.
- Tipografía por escala, jerarquía raíz/rama real, truncado con tooltip, `NodeResizer` cuando el bloque está seleccionado.
- Forma derivada del subtipo pero **sobreescribible** por `nodo.forma` desde el panel.

### 3.4 Palanca 2 — Aristas con carácter

Edge personalizada (`LuminaEdge`):
- **Tipo de trazado por subtipo/opción:** `bezier` (mapa mental, orgánico), `smoothstep`/ortogonal (organigrama, flujo), `straight` (cronología).
- Grosor, estilo (sólida / discontinua / punteada), color por token, marcador en uno o ambos extremos.
- **Label legible:** fondo tipo "pill" con `--card`, no texto suelto.
- Animación de flujo opcional para `flujo`.
- Enrutado `smoothstep` con offset para no cruzar nodos.

### 3.5 Palanca 3 — Auto-layout (matar la etiqueta muerta `layout`)

Añadir **`@dagrejs/dagre`** (o `elkjs`) como única dependencia nueva imprescindible:

```
layoutJerarquico(nodos, aristas, dir: 'TB'|'BT'|'LR'|'RL')   → organigrama, flujo, árbol
layoutRadial(nodos, aristas)                                  → mapa mental
layoutCiclo(nodos)                                            → diagrama de ciclo
layoutEspina(nodos, aristas)                                  → Ishikawa
```

- Botón **"Organizar"** en el panel + auto-organizar al añadir nodo y al cambiar de subtipo.
- `positionAuthority: 'model'` ya soporta la reposición programática — se generaliza más allá de `cronologia`.
- `layout` deja de ser cosmético: `jerarquico` ejecuta dagre; `radial` nuevo; `libre` = actual.
- dagre/elk cargan **lazy** en el mismo chunk que RF; la miniatura no los necesita.

### 3.6 Palanca 4 — Catálogo (de 6 a ~20, agrupado por intención pedagógica)

El panel de inserción y el selector se reorganizan por **para qué sirve**:

**Jerarquía / organización**
`mapa_mental` · `mapa_mental_radial` · `organigrama` · `arbol` (LR) · `cuadro_sinoptico` (llaves) · `mapa_conceptual`

**Proceso / flujo**
`flujo` (con formas semánticas) · `diagrama_ciclo` · `linea_proceso` · `cronologia` · `cronologia_ramificada`

**Análisis / comparación**
`venn` (2–3, + 4 con elipses) · `tabla_t` · `matriz_2x2` · `cuadro_comparativo` · `diagrama_afinidad`

**Causa / relación**
`espina_pescado` (Ishikawa) · `cadena_causa_efecto` · `mapa_arana`

**Organizadores pedagógicos**
`frayer` · `kwl` · `spr` (Sé / Pienso / Pregunto) · `cluster`

Varios (`frayer`, `kwl`, `tabla_t`, `matriz_2x2`, `cuadro_comparativo`) son **plantillas de layout fijo** sobre el motor actual → coste bajo. Otros (`espina_pescado`, `diagrama_ciclo`, `arbol`) necesitan la Palanca 3.
`normalizeDiagramaBlock` sanea subtipo desconocido → `mapa_mental` (ya lo hace) → bloques viejos nunca rompen.

### 3.7 Palanca 5 — Panel de configuración rediseñado (secciones colapsables)

Patrón acordeón, como el resto del editor. Todo bajo `opciones?` con defaults en el normalizer → cero migración.

1. **Tipo** — selector agrupado por intención + **plantillas con contenido de ejemplo por materia**.
2. **Estructura** — editor de árbol por **indentación** (escribir esquema → nodos), pegar lista, añadir / duplicar / reordenar rama, **generar con IA (BYOK)**, importar OPML / Markdown / sintaxis Mermaid (como *importador*, no como render).
3. **Nodos** — por nodo: forma, color (token), icono / emoji / imagen, tamaño, negrita / nota; acciones masivas (color por nivel).
4. **Conexiones** — crear arista desde el panel (selector origen → destino), tipo de trazado, estilo de línea, flechas, color, label.
5. **Disposición** — auto-layout (dirección TB / BT / LR / RL / radial), espaciado, ajuste a cuadrícula, "Organizar ahora", encajar vista.
6. **Estilo del lienzo** — tema (auto / claro / oscuro, hereda del slide), fondo (ninguno / puntos / cuadrícula / líneas), paleta, densidad, fuente, viñeta / tarjeta, animación de entrada on/off.
7. **Accesibilidad** — título · descripción · **representación textual como lista anidada** (auto-generada del árbol) · toggle para mostrarla visible · resumen automático.

### 3.8 Palanca 6 — Pulido sin dependencias nuevas (Fase 1)

- Tokens de tema en nodo, arista, fondo, `Controls`, minimapa. Legible en claro y oscuro; coherente con el tema del slide.
- Formas básicas (`root` / `chip` / `rect` / `rounded` / `pill` / `diamond` / `terminator`) — puro SVG/CSS.
- Edge personalizada con label legible + `smoothstep` para organigrama y flujo.
- `motion` para entrada escalonada de nodos y aristas.
- **Variante miniatura real** (sin `Controls`, sin fondo, nodos compactos) en vez de solo bajar `fontSize`.
- Empty state con ilustración + CTA "Añadir nodos".
- Venn: nombres de conjunto editables, color y opacidad por conjunto, chips con estilo por región.

### 3.9 Palanca 7 — Librerías / plugins concretos a evaluar

| Librería | Para qué | Nota |
|---|---|---|
| `@dagrejs/dagre` **o** `elkjs` | Auto-layout jerárquico / árbol / radial / ciclo / Ishikawa | **Única dep nueva imprescindible.** dagre ~40 kB, elk más potente y con *web worker* (grafos grandes sin bloquear). Ambos `dynamic`. |
| `@xyflow/react` (ya está) | `NodeResizer`, `NodeToolbar`, edges custom, `getSmoothStepPath`, slots `<Panel>`, `fitView` | Explotar lo instalado. |
| `motion` (ya está) | Animación de entrada / re-layout | Cero coste de lockfile. |
| `paper.js` (ya está) | Geometría booleana para Venn de 4+ conjuntos | Solo si se hace Venn avanzado. |
| `html-to-image` | Export PNG / SVG del diagrama | Dep nueva pequeña; **alinear con el contrato de export común** que propone el plan de gráficos (`<ChartExportMenu>` → `<DiagramExportMenu>`). |
| `elkjs/lib/elk-worker` | Layout de grafos grandes fuera del hilo principal | Opción avanzada. |

**Mermaid sigue descartado** como motor de render (D-DG-01). Pero *pegar sintaxis Mermaid* como **importador** que produce nodos/aristas Lumina es barato y muy útil.

### 3.10 Compatibilidad, rendimiento y contratos

- **Schema aditivo:** `opciones?: DiagramaOpciones` + campos opcionales en `DiagramaNodo` / `DiagramaArista`. Bloques existentes hidratan con defaults vía el normalizer único. Sin migración de datos.
- **Subtipos nuevos** amplían el union; desconocido → fallback (ya implementado).
- **graph-core compartido:** variante de nodo por `meta.variant` para no tocar Historia ramificada ni Mapa Edu; tests de no-regresión de ambos.
- **§1.13 del plan previo (no spamear PATCH):** auto-layout, pegado de esquema y edición masiva **commitean una sola vez** (debounce ~300 ms o al soltar), nunca por frame. Ya es el patrón en `diagrama-editor.tsx`.
- **DoD a11y (plan previo §14):** se mantiene `titulo` + `descripcionAccesible`; se **añade** representación textual estructurada + navegación por teclado.
- **Bundle:** dagre/elk y las formas pesadas en chunk `dynamic`. La miniatura usa el camino ligero (sin controles, sin layout engine).
- **SSR:** se mantiene `ssr:false` + Suspense + skeleton.
- **Tests (Vitest):** extender `diagrama-defaults.spec.ts` (saneo de `opciones`, formas, nuevos subtipos), specs de layout (dagre determinista dada una semilla), visual test por familia y por forma.

---

## 4. Fases sugeridas

### Fase 1 — Pulido, tema y formas (sin dependencia nueva, motor `@xyflow/react`)
Tokens de tema en todo el lienzo (nodo, arista, fondo, controles) · formas de nodo básicas (`root` / `chip` / `rect` / `rounded` / `diamond` / `terminator`) · edge personalizada con label legible + `smoothstep` para organigrama y flujo · animación de entrada con `motion` · variante miniatura real · panel reorganizado en secciones colapsables · representación textual a11y · Venn (conjuntos con nombre / color / opacidad).
→ **Rompe el "todos se ven iguales"**, riesgo bajo, todo dentro del contrato actual.

### Fase 2 — Auto-layout y catálogo de organizadores
`@dagrejs/dagre` · `layout` activo (jerárquico / árbol / radial / ciclo) · botón "Organizar" · plantillas nuevas: Frayer, KWL, tabla T, matriz 2×2, cuadro comparativo, espina de pescado, diagrama de ciclo, cuadro sinóptico · datasets de ejemplo por materia.

### Fase 3 — Autoría y export avanzados
Editor de árbol por indentación · pegar lista / importar OPML · Markdown · sintaxis Mermaid · generar con IA (BYOK) · export PNG/SVG (contrato común con gráficos) · Venn de 4 conjuntos · cronología ramificada · `NodeResizer` / `NodeToolbar` · subir mejoras de nodo/arista a graph-core para Historia ramificada y Mapa Edu.

---

## 5. Resumen ejecutivo

| Eje | Hoy | Objetivo |
|---|---|---|
| Subtipos | 6 (5 grafos = un motor con distinto seed + Venn) | ~20, agrupados por intención pedagógica |
| Formas de nodo | **1** (`GraphCardNode`, rectángulo blanco para todo) | Catálogo: raíz, chip, rect, rombo, terminador, paralelogramo, elipse, hexágono, tarjeta con icono/foto |
| Aristas | Bézier gris, marcador por defecto, label ilegible | Trazado por subtipo (bezier / ortogonal / recto), estilo, color por token, label con fondo, flujo animado |
| Layout | `layout` se persiste pero **no se aplica** | dagre/elk: jerárquico TB/LR, radial, ciclo, Ishikawa + botón "Organizar" |
| Tema | Hex hardcodeado; **ilegible en modo oscuro** | Nodo/arista/fondo/controles por tokens Lumina; hereda tema del slide |
| Config | Selector + título + a11y + color de nodo + label de arista | 7 secciones: tipo, estructura, nodos, conexiones, disposición, estilo del lienzo, a11y |
| Autoría | Botón "añadir nodo" con posición por trigonometría | Editor de árbol por indentación, pegar/importar OPML-MD-Mermaid, generar con IA (BYOK), plantillas con contenido |
| Accesibilidad | `sr-only` una frase | + lista anidada estructurada + navegación por teclado + `aria` por nodo |
| Inserción | 6 botones a lienzos casi vacíos | Plantillas pedagógicas con datos de ejemplo por materia |
| Activo sin usar | `NodeResizer`/`NodeToolbar`/edges custom de RF, `motion`, `paper.js`, `positionAuthority:'model'` | Base de Fases 1–3 sin coste de lockfile |
| graph-core | Mejoras solo en el bloque `diagrama` | Nodo/arista/tema/a11y compartidos → Historia ramificada y Mapa Edu heredan gratis |

**Cambio de arquitectura mínimo** (todo tras `GraphCanvas` + `opciones?` aditivo en el schema, con `normalizeDiagramaBlock` ya existente como base y `positionAuthority:'model'` ya implementado), **impacto visual y funcional alto**. La única dependencia nueva imprescindible es un motor de auto-layout (`@dagrejs/dagre` o `elkjs`).
