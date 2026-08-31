# Peritaje técnico — Lumina y el editor de canvas

> Generado: 30/08/2026
> Alcance: análisis (solo lectura) de la plataforma Lumina y, en profundidad, de **todos los elementos
> del canvas del editor de clases** — modelo de datos, render, interacción, persistencia e historial.
> Base de código: `lumina-frontend/src/app/(app)/classes/[id]/editor/**`, `src/hooks/use-block-drag.ts`,
> `src/lib/canvas-*.ts`, `src/lib/class-slide-normalize.ts`, `src/types/slide.types.ts`, más
> `lumina-backend/` para el lado servidor. Complementa a `PERITAJE_WIDGETS.md` y
> `PERITAJE_ESCAPE_ROOM.md`; no los repite.

---

## 0. Resumen ejecutivo

- **Lumina** = SaaS educativo colombiano con dos productos sobre el mismo backend: **Lumina Core**
  (editor de clases interactivas tipo Canva/Nearpod) y **Lumina Edu** (gestión institucional y notas).
- El **canvas** es un lienzo libre 16:9 con **coordenadas en porcentaje** sobre un sistema virtual
  fijo de **1280 × 720 px**. Cada diapositiva (`Slide`) guarda un array `bloques: Block[]`; cada
  bloque es una unión discriminada por el campo `tipo`.
- **Una sola fuente de verdad de posición:** `getBlockPos(block)` en `src/hooks/use-block-drag.ts`.
  Todo (render, drag, resize, snap, capas, alineación, miniaturas) lee de ahí; nadie reimplementa
  fallbacks por `tipo`.
- **Regla de oro del editor** (`.cursorrules` / `.cursor/rules/lumina-canvas-editor-contracts.mdc`):
  `leer (getBlockPos) → transformar → clamp (clampDragCorner) → persistir (PATCH) → historial`.
- **~30 tipos de elemento** conviven en el canvas: bloques básicos, formas, máscaras de recorte
  (`clip-group`), 11 widgets estilo Genially/Captivate y 25 tipos de actividad evaluable — todos
  renderizados por un único componente recursivo, `SlideRenderer` → `BlockNode`.
- **Persistencia:** `PATCH /classes/:id/slides/:slideId` con `sanitizeSlideContentForPersistence`,
  seguido de `refetchQueries(['classes','detail',classId])`. Además autosave (`useAutosave`) e
  historial de versiones en servidor (`SlideVersion`, Ctrl+S), independiente del undo local.
- **Historial local undo/redo** por `slideId` (Map en memoria de sesión, `MAX_UNDO = 20`,
  snapshot = `{ bloques, fondo, guias, transicion, kind, at }`).

---

## 1. Identidad y arquitectura general

### 1.1 Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Radix UI · CVA |
| Datos FE | TanStack Query v5 · axios (`src/lib/api.ts`, Bearer JWT de `localStorage`) |
| Drag | `@dnd-kit/core` |
| Backend | NestJS 11 · Prisma 7 · PostgreSQL · Redis 7 · Socket.IO · JWT/Passport |
| IA | BYOK multi‑proveedor (Claude / Gemini / OpenAI) — claves cifradas por docente (`TeacherAiKey`) |
| Monorepo | `lumina-frontend/` + `lumina-backend/` (raíz también contiene una copia histórica del backend en `src/` y `prisma/`) |

### 1.2 Roles y rutas del editor

- Roles: `SUPERADMIN`, `ADMIN`, `DEPARTMENT_HEAD`, `TEACHER`, `TEACHER_ASSISTANT`, `STUDENT`, `PARENT`, `GUEST`.
- Ruta del editor: `/(app)/classes/[id]/editor` → `page.tsx` (server) → `editor-client.tsx` (`'use client'`).
- Rutas hermanas que **reutilizan `SlideRenderer`** en otros modos:
  - `/classes/[id]/preview` — vista escalada (thumbnail 1280×720 + `scale`).
  - `/classes/[id]/present` — presentación docente.
  - `/classes/[id]/viewer` — clase en vivo (docente controla el avance; Socket.IO).
  - `/autonomo` y `join/[codigo]` — sesión autónoma / alumno‑invitado.
  - `/classes/[id]/escape-room` — diseñador dedicado de salas (`escape-room-designer-client.tsx`).

### 1.3 Backend que sirve el canvas (30 módulos NestJS)

Relevantes para el editor:

- **`classes/`** — CRUD de clases y slides, sesiones, gradebook, scoring (`activity-scoring.ts`),
  gateway Socket.IO (`classes.gateway.ts`).
- **`class-editor/`** — endpoints específicos del editor.
- **`pptx/`** — importación `.pptx` / Google Slides: parseo XML, conversión EMU→% (mismo sistema
  virtual del canvas), imágenes a base64.
- **`live-sessions/`**, **`torneo/`**, **`escape-room/`** — motores en vivo (equipos, ranking, reloj compartido).
- **`ai-features/`** — generación de actividades desde tema o documento.
- **`curriculum/`** — DBA (Derechos Básicos de Aprendizaje) por grado/área en JSON.

Modelos Prisma del canvas: `Class` → `Slide` (con `content` JSON) → `SlideVersion` (historial en
servidor). El `content` de cada `Slide` es el documento que el frontend normaliza a `Slide` del renderer.

---

## 2. Modelo de datos del canvas

Archivo canónico: **`src/types/slide.types.ts`** (1262 líneas).

### 2.1 `Slide`

```ts
interface Slide {
  id, order, type: 'COVER'|'CONTENT'|'ACTIVITY'|'VIDEO'|'IMAGE', title
  bloques?: Block[]                 // contenido estructurado del canvas
  guias?: SlideGuias               // guías manuales + grilla (solo editor)
  content?: CanvasContent | null   // legado Fabric.js (canvas-editor.tsx, DEPRECADO)
  fondo?: Background                // color | gradiente | imagen
  temaId?: string                  // tema visual (slide-themes.ts)
  diseno?: Layout                  // columnas / alineación / relleno (layouts pre-canvas)
  duracionSeg?, notas?, timer?, transicion?
}
```

- **`SlideGuias`** = `{ horizontales: number[]; verticales: number[]; grilla?: SlideGrilla }` en
  coordenadas virtuales (px 0–1280 / 0–720). `SlideGrilla` = `{ activa, tamanoPx }` con presets
  `[8,16,20,32,40,64,80]` (default 40).
- **`content` Fabric.js** es un vestigio: `canvas-editor.tsx` está **deprecado**; el editor vivo usa
  `bloques[]` exclusivamente. `classSlideToRendererSlide` fuerza `content: null`.

### 2.2 `Block` — unión discriminada

`Block = (TextBlock | ImageBlock | VideoBlock | AudioBlock | ActivityBlock | CodeBlock | QuoteBlock |
DividerBlock | ColumnsBlock | FormaBlock | ClipGroupBlock | FlipCardsWidget | TabsWidget |
CarouselWidget | ClickRevealWidget | PopupWidget | TimelineWidget | HotspotWidget | TooltipWidget |
BotonWidget | ContadorWidget | ProgresoWidget) & { animaciones?; canvasLocked? }`

Campos transversales añadidos a **todos** los bloques:
- `animaciones?: Animacion[]` — entrada/énfasis/salida (`use-block-animations.ts`).
- `canvasLocked?: boolean` — si `true`: no se mueve, no se redimensiona, no se alinea, no se
  desplaza con teclado. **Sí** se puede editar contenido y cambiar `zIndex`.

### 2.3 Coordenadas — el contrato 3.2

- Bloques "normales" (texto, imagen, video, forma, clip-group, **todos los widgets**) guardan
  posición como **porcentajes sueltos**: `x, y, ancho, alto` (0–100, % del lienzo). `zIndex?` opcional.
- **Actividades** (`ActivityBlock`) **nunca** usan `x/y/ancho/alto`. Su bbox va en
  `marco: { izquierdaPct, arribaPct, anchoPct, altoPct }`. Si `marco` no existe, la actividad ocupa
  la celda del `Layout` (modo grid) en lugar de flotar.
- `getBlockPos(block)` resuelve todo esto en un `switch` por `tipo` y aplica `BLOCK_FALLBACKS`
  para bloques anteriores al canvas libre (p. ej. `text: {x:10,y:10,ancho:80,alto:20}`,
  `hotspot/tooltip: {…,ancho:4,alto:4}`, `flip-cards/tabs/…: {5,5,90,90}`).
- Escritura: `withPosition(block, x, y)` (mueve), `withRect(block, x, y, ancho, alto)` (mueve+redimensiona).
  Ambos ramifican a `marco` para actividades. `blockPosToStyle(block, zIndex?)` deriva el CSS
  `position:absolute; left/top/width/height:%`.

### 2.4 Elementos NO posicionables en el lienzo libre

`isBlockCanvasPositionable()` devuelve `false` para `audio`, `codigo`, `cita`, `separador`,
`columnas`: viven dentro del flujo del `Layout`, sin manijas ni drag. `columnas` es recursivo
(`Block[][]`), con rutas de acceso tipo `"5-0-1"` (`getBlockAtPath` / `updateBlockAtPath` /
`removeBlockAtPath` en `class-slide-normalize.ts`).

---

## 3. Normalización (hidratación del slide)

Archivo: **`src/lib/class-slide-normalize.ts`**.

`classSlideToRendererSlide(apiSlide)`:
1. Extrae `content` del API (`getSlideContentRecord`).
2. `normalizeBlocks(bloques)` — quita stubs `interactivo` ("Próximamente", robaban clics) y aplica
   `normalizeBlock` a cada bloque:
   - **Actividades:** `normalizeActivity` → `normalizarEmparejar / AbrirCaja / Globos / Topo / Ahorcado`.
   - **Widgets:** `normalize{FlipCards,Tabs,Carousel,ClickReveal,Timeline,Popup,Hotspot,Tooltip,Boton,Contador,Progreso}Widget`.
   - **`clip-group`:** `normalizeClipGroupBlock`.
   - **`columnas`:** recursivo sobre cada columna.
3. `resolveFondo` (default `#ffffff`), `resolveDiseno` (mapa `LAYOUT_FROM_KEY`, fallback
   `titulo_y_contenido`), `parseSlideGuias`, `resolveTransicion`.

Funciones de escritura para persistir: `mergeSlideContent`, `mergeRendererSlideState`,
`appendBlockToSlideContent`, `replaceSlideContentWithSingleActivity`,
`buildContentDocumentForNewActivitySlide`, y sobre todo
**`sanitizeSlideContentForPersistence`** — se ejecuta antes de cada PATCH: quita stubs, re‑hidrata
widgets y, **si hay una actividad de primer nivel, descarta el resto de bloques** y fuerza
`layout: 'titulo_centrado'` (una diapositiva de actividad solo contiene esa actividad).

> Deuda registrada en `PERITAJE_WIDGETS.md` §3: los widgets de "Grupo 2" (Flip Cards, Tabs,
> Carousel, Click to Reveal, Timeline) **sí** pasan hoy por `normalizeBlock` (se corrigió); el
> peritaje anterior lo marcaba como pendiente.

---

## 4. Renderizado — `SlideRenderer` / `BlockNode`

Archivo: **`src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx`** (2668 líneas).

### 4.1 Modos

`type Modo = 'editor' | 'viewer' | 'preview'`.

| Modo | Uso | Comportamiento |
|---|---|---|
| `editor` | Canvas de autoría | Bordes de selección, manijas de resize, doble‑clic para editar texto, toolbar de bloque, `overflow: visible` |
| `viewer` | Clase en vivo / autónomo / alumno | Puramente presentacional, `overflow: hidden`, animación de entrada escalonada (`blockIndex * 80ms`), viewers de actividad interactivos |
| `preview` | Miniaturas (`SlidesPanel`, tarjetas) | Renderiza un lienzo fijo **1280 × 720** y le aplica `transform: scale(previewScale)` (`clientWidth / 1280`) — así fuentes, imágenes y posiciones quedan proporcionalmente exactas |

`variant: 'dark' | 'light'` se calcula por luminancia del fondo (`getSlideVariant`) y ajusta el
contraste de los viewers de actividad.

### 4.2 Jerarquía de componentes

```
SlideRenderer
 └─ div.canvas-slide  (data-slide-root, fondo, overflow según modo)
     └─ blocks.map → BlockNode  (key = `${slide.id}-${index}`)
          ├─ positionStyle = blockPosToStyle(block)  ó  resizingCoords[blockId] durante resize
          ├─ renderContent()  → switch(block.tipo) → Render{Text,Image,Video,Audio,Code,Quote,Divider,Forma}
          │                                        │   RenderClipGroup
          │                                        │   {Widget}Editor / {Widget}Viewer  (según modo)
          │                                        │   RenderActivity → {Actividad}Editor / {Actividad}Viewer
          │                                        └─  RenderColumns → BlockNode (recursivo, rutas "i-col-j")
          ├─ <ResizeHandles>  (solo editor, seleccionado, no locked, no edición interna)
          └─ <BlockActionToolbarPortal>  (portal a document.body — evita recorte por overflow)
```

- `SlideCanvasRootContext` publica el nodo raíz del slide para que **Popup** monte su portal
  ahí (modal a pantalla de slide).
- Google Fonts: `SlideRenderer` recolecta familias usadas (`collectFontFamiliesFromValue`) y llama
  `ensureGoogleFonts`.

### 4.3 `BlockNode` — banderas de estado (editor)

- `isFormBlock` = actividad en modo editor (usa su propio editor embebido, sin shell de botón).
- `isWidgetBlock` = widget en modo editor.
- `isBlockButtonShell` = bloque simple seleccionable con `role="button"`, `aria-pressed`, Enter/Espacio.
- `isTextEditing` = texto con `editingId === blockId` (doble clic) → `InlineTextEditor` (textarea;
  **Shift+Enter confirma**, Escape descarta, blur confirma; placeholder según tamaño de fuente).
- `popupOverlayEditing`, `clipInnerEdit` — modos de edición interna que **ocultan las manijas de resize**.
- `data-block-id={blockId}` — el índice como string; es la "ruta" usada en todo el editor.

---

## 5. Catálogo de elementos del canvas

### 5.1 Bloques básicos

| `tipo` | Render | Edición | Posicionable | Notas |
|---|---|---|---|---|
| `texto` | `<p>/<h1..6>/<ul>/<ol>` con tipografía completa | Doble clic → `InlineTextEditor` (textarea); panel derecho para estilos | Sí (`text` fallback 10,10,80,20) | Campos: `nivel`, `alineacion`, `tamanoFuente`, `negrita/cursiva/subrayado`, `fuente`, `interlineado`, `espaciadoLetras`, `transformacion`, `opacidad`, `sombra`, `fondoTexto`, `radioFondo`, `lista` |
| `imagen` | `<figure><img>` + `figcaption` | Panel: URL, `ajuste` (cubrir/contener/llenar), `bordeRedondeado`, `caption`, `lockAspectRatio` | Sí | Durante resize se fuerza `objectFit:'fill'` (`forceFill`) y al soltar se persiste `ajuste:'llenar'`. `hasMediaSrc` valida la URL; si no, placeholder "Sin imagen" |
| `video` | `<iframe>` YouTube/Vimeo (`buildEmbedUrl`) ó `<video>` directo; thumbnail = `img.youtube.com/vi/<id>/0.jpg` | Panel: URL, `autoplay`, `controles`, `bucle`, `silenciado` | Sí | `plataforma?: youtube|vimeo|directo` |
| `audio` | `<audio controls>` | Panel | **No** (flujo del layout) | Se inserta desde el chrome de la toolbar (`onInsertAudio`) |
| `codigo` | `<pre><code>` tema oscuro + título opcional | Panel | **No** | `lenguaje`, `mostrarNumeroLineas` |
| `cita` | `<blockquote>` + `<cite>` + fuente | Panel | **No** | |
| `separador` | `<hr>` (`solido`/`punteado`/`guionado`, color, grosor) | Panel | **No** | |
| `columnas` | `display:grid` con `proporcion` (`"2:1"`) → `RenderColumns` recursivo | — | **No** (contenedor) | Hijos son `Block[][]`; rutas `"i-col-j"` |
| `forma` | `rectangulo`/`circulo` (`<div>`), `triangulo` (`<svg polygon>`), `linea` (`<hr>`) | Panel: `color`, `opacidad`, `colorBorde`, `grosorBorde` | Sí (`forma` fallback 10,10,30,30) | |

### 5.2 `clip-group` — máscaras de recorte (Fase 2)

Archivo render: `render-clip-group.tsx`; geometría: `src/lib/clip-path.ts` (680 líneas);
editor de nodos: `clip-path-node-editor.tsx`.

- **Bbox estándar** `x/y/ancho/alto` (contrato 3.2). Estructura:
  `{ clipShape, contenido, borde?, opacidad?, sombra? }`.
- **`clipShape`**: `rectangulo` (con `borderRadius`), `circulo`, `elipse`, `triangulo`,
  `estrella` (`puntas`, `radioInterno`), `hexagono`, `poligono` (`lados`), `svg` (path `d`),
  `libre` (`nodos: ClipPathNode[]` con anclas y manijas Bézier `cpIn`/`cpOut`, tipo
  `corner`/`smooth`/`symmetric`).
- **`contenido`**: `imagen` (con `offsetX/offsetY` de pan, `escala`, `ajuste`), `color`, `gradiente`.
- Recorte real: `<clipPath clipPathUnits="objectBoundingBox">` con `path d` generado por
  `generarClipPath()` / `librePathFromNodes()`.
- **Interacción:**
  - Clic simple = seleccionar → mover/redimensionar el grupo (manijas normales).
  - Doble clic (si `contenido.tipo === 'imagen'`) = **edición interna**: arrastrar la imagen para
    hacer pan + rueda para escalar. Pan y escala se clampan con
    `computeClipImagePanClamp` + `clampClipImageOffsetPct` (no se puede sacar la imagen fuera de la
    máscara). Commit con debounce ~200 ms tras la rueda.
  - Forma `libre` seleccionada = `ClipPathNodeEditor`: arrastrar anclas, doble clic convierte a
    curva Bézier, Supr elimina nodo. Mutuamente excluyente con el pan de imagen.
- `borde` se dibuja como `<path stroke vectorEffect="non-scaling-stroke">`; `sombra` como
  `filter: drop-shadow(...)` (`formatClipDropShadow`).

### 5.3 Widgets (11, estilo Genially/Captivate) — no evaluables

Catálogo único: `widget-panel-catalog.ts` + `widget-registry`. Tres familias con contratos
distintos (**no unificar** — ver `lumina-frontend/CLAUDE.md` y `PERITAJE_WIDGETS.md`):

| Familia (grupo panel) | Widgets | Contrato de canvas |
|---|---|---|
| **Lienzo** | Flip Cards, Tabs, Carousel, Click to Reveal, Timeline | Header (título/subtítulo/instrucción), `configuracion`, fallback bbox `5,5,90,90`. Edición inline + panel (carrera aceptada como deuda). Selección interna (`*InnerSelection`) para editar una ficha/tarjeta/nodo concreto |
| **Overlay** | Popup | Trigger pequeño en el lienzo (`~3.75 %`); el modal se monta por **portal** en `.canvas-slide` con backdrop. Al redimensionar el trigger, `handleResizeEnd` recalcula `triggerAnchoPx/AltoPx` en px (`clampPopupTriggerPx`) y `syncPopupBlockSizeFromTriggerPx` reescribe el bbox |
| **Control / burbuja** | Hotspot, Tooltip, Botón, Contador, Barra de progreso | Hit 4 % (`hotspot`/`tooltip`), otros pequeños. **Texto solo desde el panel derecho** (Tooltip/Botón/Contador/Barra). Hotspot: burbuja inline con contenido rico (`pointer-events: auto`); Tooltip: burbuja `pointer-events: none` |

Notas de comportamiento (de `CLAUDE.md`):
- Tabs/Carousel: el índice de página es **local (React)** en el editor; el alumno siempre arranca
  en la ficha 0 (`initialWidgetViewerPageIndex`).
- Duplicar/pegar: `remintBlockChildIds` regenera IDs de fichas, tarjetas, overlays y nodos internos.
- Navegación de slide (`SlideNavContext`): en clase en vivo y en el editor `navigate` es `null`;
  el Botón con acción "siguiente/anterior/ir a" se muestra deshabilitado, el Contador "al terminar →
  siguiente" no avanza; las acciones por URL siguen activas.
- **Ningún widget** calcula nota ni XP (`grep` de scoring en `components/widgets/` = 0). Si alguno
  se volviera evaluable, **debe** pasar por `evaluateActivityResponse` / `xpFromEvaluation`.

`getBlockResizeMinDim(tipo)`: `hotspot`/`tooltip` → 4 %, `popup`/`progreso` → 2 %, resto → 5 %.

### 5.4 Actividades evaluables (`ActivityBlock`, 25 tipos)

`RenderActivity` (en `slide-renderer.tsx`) es un `switch` gigante: por cada `act.tipo`, en modo
`editor` renderiza `{X}Editor` y en `viewer` renderiza `{X}Viewer`. Posición **solo** vía `marco`.

| Familia | Tipos |
|---|---|
| Quiz base | `quiz_multiple`, `verdadero_falso`, `short_answer`, `completar_blancos` |
| Interacción | `arrastrar_soltar`, `emparejar`, `ordenar_pasos` |
| En vivo (Socket.IO) | `encuesta_viva`, `nube_palabras`, `torneo` (Kahoot), `escape_room` (equipos) |
| Media | `video_interactivo` (preguntas con timestamp; XP una sola vez al completar) |
| Grupo 4 "Wordwall" | `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`, `crucigrama`, `anagrama`, `ahorcado`, `puzzle_palabras`, `abrir_caja`, `globos`, `topo`, `ruleta` |
| Narrativa | `historia_ramificada` (react-flow en el editor: nodos `editorX/editorY`) |

- Scoring unificado: `notaColombiana(correctas, total, respondio)` → `1.0–5.0` (ratio × 5, mínimo
  pedagógico 1.0). Categorías `ACTIVITY_SCORING`: `binary` / `partial` / `manual` /
  `participation` / `exclude`. `ruleta`, `torneo`, `escape_room` son `exclude` (no dan nota académica).
- `orden_rango` fue **eliminada** (duplicaba "Ordenar"); `evaluateOrdenRango` es código muerto pendiente de retirar.

#### Caso especial — Escape Room dentro del canvas

`RenderActivity` para `escape_room` en modo viewer pasa a `<EscapeRoomViewer>` un
**`renderSalaCanvas(sala)`** que instancia **otro `SlideRenderer` anidado** en `modo="viewer"`,
con `bloques: bloquesVisiblesDeSala(sala)` y `fondo: sala.fondo ?? {#1e1b4b}`. Es decir: cada sala
del escape room es su propio mini‑lienzo, sin `useBlockDrag` para el alumno. El cierre emite
`{ tipo: 'escape_room:finished', puntos, timeMs }` por un canal propio — **nunca** por
`activity:complete` (esos puntos son gamificación narrativa, no nota). Ver `PERITAJE_ESCAPE_ROOM.md`.

---

## 6. Interacción en el canvas (modo editor)

Orquestación: **`canvas-area.tsx`** (1898 líneas) + **`editor-dnd-shell.tsx`** + `use-block-drag.ts`.

### 6.1 Selección

- **Clic** en bloque → `handleRendererBlockSelect(id)`: fija `selectedBlockId` + `selectedBlockIds=[id]`,
  limpia selecciones internas de widgets **solo si cambió el bloque** (nunca en un `useEffect` sobre
  `selectedBlockId` — eso borraría el `set` de la selección interna que ocurre en el mismo clic).
- **Shift+clic** → alterna el id en `selectedBlockIds` (multi‑selección).
- **Marquee** (`handleCanvasMouseDown`): arrastrar sobre el lienzo vacío dibuja un rectángulo azul
  translúcido; al soltar, intersecta el rect (en %) contra `getBlockPos` de cada bloque y
  selecciona los que solapan en X **e** Y. Ignora clics que empiezan sobre `[data-block-id]`,
  handles, `button/input/textarea/select`.
- **Deseleccionar**: clic en el fondo del workspace, `Escape` (cascada: cierra panel activo →
  cierra panel derecho → limpia selección), o clic capturado en zona no‑bloque.
- `clipGroupInnerEditId` se limpia con `Escape` y al cambiar de bloque/slide.

### 6.2 Drag de bloques (dnd-kit) — `useBlockDrag`

- Solo el **badge `GripHorizontal`** (36×16 px, centrado en el borde superior, `zIndex 26`) es
  interactivo; el resto del overlay es `pointer-events: none` para no robar clics al cuerpo.
  `BlockDragHandle` no se renderiza si el bloque no es posicionable o está `canvasLocked`.
- `handleDragStart`: guarda `originRef` = `getBlockPos` del bloque; si se arrastra un grupo
  (`selectedBlockIds` con >1 y contiene el id), guarda `selectedOriginsRef` (origen de cada miembro
  desbloqueado).
- `handleDragMove`: convierte `event.delta` px → % (`delta / rect.width * 100`), aplica
  `snapPositionToGuides`, escribe `pendingDragPosRef`, y actualiza `liveBloques` vía
  `applyLiveDragPositions` (mueve el índice arrastrado o todo el grupo con `deltaX/deltaY` +
  `clampDragCorner` por miembro). Comparaciones `sameLivePositions` / `sameSnapLines` evitan
  re‑renders y el bucle "Maximum update depth" de dnd‑kit.
- `handleDragEnd`: llama `onSave(applyLiveDragPositions(...))` con la última posición con snap.
- **Prioridad de bloques mostrados**: `liveBloques` (durante drag) → `committedBloques`
  (post‑drag, pre‑refetch) → `slide.bloques` (servidor). `effectiveBloques` alimenta handles,
  capas, indicadores de espaciado y la miniatura lateral (esta con debounce ~150 ms).

### 6.3 Snap — `snapPositionToGuides`

Umbral unificado **`SNAP_THRESHOLD_PX = 8`** (px del canvas virtual, igual en X e Y →
`snapThresholdPct(axis)`). Targets y prioridad en empate (`SNAP_PRIORITY`): `guide (4) > gap (3) >
peer (2) > canvas (1)`.

| Tipo | Origen | Color de guía |
|---|---|---|
| `canvas` | Bordes y centro del lienzo (0 / 50 / 100 %) | Naranja `#F97316` |
| `peer` | Borde inicial, centro y borde final de cada otro bloque (X e Y) | Naranja |
| `gap` | **Huecos iguales** (`canvas-spacing.ts` / `getEqualGapSnapTargets`): posiciones que replican un ritmo ya existente o centran el bloque entre dos vecinos que solapan en el eje perpendicular | Verde `#10B981` |
| `grid` | Grilla activa (`snapAxisToGridPercent`, origen/centro/borde a múltiplo de `tamanoPx`) | Gris `#94A3B8` |

- **Alt** mantiene el imán suprimido: `snapSuppressedRef` (sincronizado con `keydown`/`keyup`/`blur`);
  entonces `snapPositionToGuides` devuelve coords crudas y sin líneas.
- Las líneas se pintan en `canvas-area.tsx` como `<div>` absolutos `zIndex 9999`.
- El **resize** también usa snap: `handleResizeMove` reejecuta `snapPositionToGuides` con el bbox
  provisional y devuelve coords ajustadas a `SlideRenderer` para el preview en vivo y el commit.

### 6.4 Resize — `ResizeHandles` + `resize-coords.ts`

- 8 manijas (`NW N NE E SE S SW W`), 10×10 px, blancas con borde azul, `zIndex 50`. Cursores
  direccionales. `mousedown` guarda origen; `mousemove`/`mouseup` globales calculan `dxPct/dyPct`.
- `computeNewCoords(dir, origX, origY, origAncho, origAlto, dxPct, dyPct, lockAspectRatio, minDim)`:
  1. Si `lockAspectRatio` (o **Shift**) y manija de esquina: mantiene ratio `ancho/alto`, ancla la
     esquina opuesta.
  2. Si no: ajusta el rect según la dirección.
  3. `applyMinDimClamp` — aplica `minDim` **solo si el usuario cambió esa dimensión** (evita el
     salto 4 %→5 % al hacer clic‑release sin mover).
  4. `finalizeCoords` → `clampDragCorner` (clamp C2) → **`preserveEdgeAfterClamp`** (recalcula
     `ancho/alto` para mantener fijo el borde opuesto a la manija activa, contrato M7) → re‑clamp.
- `minDim` por tipo: `getBlockResizeMinDim` (§5.3). Imagen: `lockAspectRatio` del bloque.
- Popup: rama especial en `handleResizeEnd` (recalcula tamaño del trigger en px).
- Durante el resize, `SlideRenderer` guarda `resizingCoords[blockId]` y pinta el bloque en esa
  posición provisional; al soltar hace `updateBlockAtPath` + `withRect` (o `marco`) y persiste vía
  `onPersistSlide` (historial) o `updateSlide.mutate` (fallback).

### 6.5 Nudge con teclado

- Flechas: `NUDGE_STEP_PX = 1`; **Shift+flecha** = `NUDGE_STEP_SHIFT_PX = 10` px virtuales.
- `applyNudgeToBlocks(bloques, indices, dxPx, dyPx)` — convierte px→% (`/1280`, `/720`), ignora
  bloques `canvasLocked`, clampa cada uno. Solo persiste si algo cambió realmente.

### 6.6 Alineación y distribución — `alignment-toolbar.tsx`

- Toolbar flotante que aparece **solo con ≥ 2 bloques desbloqueados** seleccionados.
- Alinear (izq/centro/der/arriba/medio/abajo): mín. 2 bloques. Distribuir H/V: mín. 3.
- Usa `getBlockPos` + `withClampedPosition` / `withClampedPositionChecked`; si `wasClamped`, toast
  de advertencia ("el espaciado puede variar").

### 6.7 Capas (z‑index) — `canvas-layers.ts` + `layers-panel.tsx`

- Panel lateral opcional (`layersPanelOpen`) que lista los bloques ordenados por `zIndex` desc
  (frente arriba), con icono y etiqueta legible por tipo (`getBlockLayerLabel/Kind/Icon`).
- Acciones (`LayerReorderAction`): `traer_frente` (`max+1`), `enviar_atras_total` (`min-1`),
  `adelante_uno` (`z+1`), `atras_uno` (`z-1`). `applyLayerReorderAction` escribe `zIndex` en el
  bloque; bloques `canvasLocked` no se reordenan.
- `collectZIndices` recorre también columnas anidadas.

### 6.8 Bloqueo de bloque

- Toolbar de bloque → candado. `handleToggleCanvasLock` fija/quita `canvasLocked` (persistido como
  `true` o borrado del objeto). Bloque bloqueado: anillo ámbar en vez de azul, sin handles, sin
  drag/nudge/alineación; sí edición de contenido y capas.

---

## 7. Guías, reglas, grilla y zoom

### 7.1 Guías manuales y reglas — `canvas-guides.tsx` (+ `src/lib/canvas-guides.ts`)

- `CanvasGuidesChrome` envuelve el lienzo y dibuja **reglas** de 16 px (`RULER_SIZE_PX`) arriba y a
  la izquierda, con marcas cada 100 px virtuales (`rulerMarksX/Y`).
- Arrastrar **desde una regla** hacia dentro crea una guía (`startCreate`); soltar fuera del lienzo
  la cancela. Arrastrar una guía existente la mueve (`startMove`); soltarla fuera la borra; doble
  clic la borra. Badge azul con la posición en px durante la interacción.
- Guías persisten en `Slide.guias.{horizontales,verticales}` (px virtuales, clamp 0–1280/0–720).
- **Esquina de reglas** = botón para añadir/quitar las **guías centrales** (640 / 360) de golpe
  (`toggleCenterGuides`).
- `virtualXToPercent` / `virtualYToPercent` convierten px virtuales → % para render y para targets
  de snap.

### 7.2 Grilla — `src/lib/canvas-grid.ts`

- `SlideGuias.grilla = { activa, tamanoPx }`. Presets `[8,16,20,32,40,64,80]`, default 40;
  `normalizeGridSizePx` ajusta cualquier valor al preset más cercano.
- Overlay visual: `gridOverlayStyle(tamanoPx)` → dos `linear-gradient` de 1 px como `backgroundSize`
  en %; se pinta con `zIndex 10` bajo las guías.
- Snap a grilla: `snapAxisToGridPercent` (origen, centro o borde del bloque al múltiplo más
  cercano). Compite con el resto de snaps por cercanía; si gana, `kind: 'grid'` (guía gris).
- API expuesta por `CanvasAreaHandle`: `toggleGrid()`, `setGridSize(px)`.

### 7.3 Zoom — `src/lib/canvas-zoom.ts`

- Rango **50 %–200 %**, paso 10 %, default 100 %. Persistido en `localStorage`
  (`lumina-editor-canvas-zoom`).
- **Ctrl/⌘ + rueda** sobre el workspace (`wheelDeltaToZoomStep`), o botones en la topbar.
- `transform: scale(canvasZoom)` se aplica al **wrapper del viewport**, nunca a los bloques
  (contrato §6). Con zoom > 1 el contenedor pasa a `overflow: auto`.

---

## 8. Historial undo/redo (local) — `canvas-history.ts`

- **Pila por `slideId`** en un `Map` en memoria de `CanvasArea` (`historiesRef`). **No** se limpia
  al cambiar de slide (el docente vuelve y espera conservar el deshacer); se pierde al desmontar el
  editor (salir de la ruta). No se persiste en servidor.
- `MAX_UNDO = 20`. El índice 0 siempre conserva `kind: 'inicio'` al truncar.
- **Snapshot completo** `SlideHistorySnapshot = { kind, at, bloques, fondo?, guias, transicion? }`.
  `kind ∈ inicio | edicion | fondo | guias | pegar | eliminar` (etiquetas en el dropdown de historial).
- `captureSlideSnapshot` clona con `structuredClone` (fallback JSON). Metadatos actuales del slide
  en pantalla se leen de `editorMetaRef` (fondo/guías/transición) para snapshots coherentes.
- Flujo de registro: cada operación deshacible llama `persistBloques(next, prev, recordHistory,
  kind)` → PATCH OK → `recordAfterSuccess(slideId, prevSnapshot, nextSnapshot)` →
  `pushHistoryEntry` (descarta rama de redo, recorta a `MAX_UNDO`, ancla índice 0).
- `handleUndo/Redo/JumpToHistory` → `restoreSnapshot`: pone `isUndoRedoRef = true` (evita
  re‑registrar), PATCH con `buildContentFromSnapshot(snapshot)` (incluye transición), fija el nuevo
  estado del Map, refetch.
- `CanvasAreaHandle.resetSlideHistory()` — se llama tras **restaurar una versión del servidor**
  para arrancar una pila fresca con ese estado como `inicio`.
- Atajos (en `editor-client.tsx`): `Ctrl/⌘+Z` undo, `Ctrl/⌘+Shift+Z` o `Ctrl/⌘+Y` redo,
  `Ctrl/⌘+C/V/D` copiar/pegar/duplicar bloque, `Supr`/`Retroceso` eliminar, flechas nudge,
  `Ctrl/⌘+S` guardar versión. Todos se ignoran si el foco está en `input/textarea/contentEditable`.

---

## 9. Persistencia

### 9.1 PATCH de slide

`canvas-area.tsx` → `patchSlideContent(content)` → `fetch PATCH ${API}/classes/${classId}/slides/${slideId}`
con `Authorization: Bearer <token>` y body `{ content: sanitizeSlideContentForPersistence(content) }`.
Tras éxito: **`queryClient.refetchQueries(['classes','detail',classId])`**.

`buildContentPayload(bloques, fondoOverride?, guiasOverride?)` arma el documento:
`{ bloques, fondo?, diseno?, transicion?, guias }`.

Variantes:
- `persistBloques` — slide activo, con historial opcional.
- `persistBloquesForSlide(slideId, …)` — **cross‑slide** (pegar en otro slide), historial propio por `slideId`.
- `persistGuias(nextGuias)` — cambios de guías/grilla/guías centrales.
- `handleChangeFondo(fondo)` — fondo del slide (snapshot `kind: 'fondo'`).
- `handleApplySlide(patch)` — cambios de `Slide` (p. ej. `transicion`) con historial.

### 9.2 Autosave y versiones de servidor

- `useAutosave(activeSlide.content, autosaveSaveFn)` en `editor-client.tsx` — expone
  `isDirty` / `isSaving`; la topbar muestra "Guardando…" / "Cambios pendientes…".
- `Ctrl+S` / botón "Guardar" → `handleSave` crea una **`SlideVersion`** en servidor
  (`use-slide-versions`). El **Sheet "Historial de versiones"** (`historySheetOpen`) permite
  restaurar; al restaurar se llama `canvasAreaRef.current.resetSlideHistory()`.
- Son **dos sistemas distintos**: undo local (Ctrl+Z, en memoria) vs. versiones (Ctrl+S, en BD).

### 9.3 Inserción de elementos

- **Toolbar flotante** (`SlideInsertionToolbar` + `SlideEditorChrome`): insertar texto, imagen,
  video, forma, audio, etc. Si el slide ya tiene una actividad, solo admite texto
  (`restrictToTextOnly` → toast "Este slide solo admite texto junto a la actividad").
- **Rail izquierdo** (`IconRail` → `FlyoutPanel`): paneles `elementos`, `widgets`, `layout`,
  `fondo`, `ia`, `paginas`.
- **Rail derecho** (`RightRail` → `RightFlyoutPanel`): `ia` (actividades con IA), `activities`
  (actividades interactivas), `themes` (temas de diapositiva), `live` (respuestas en vivo — oculta
  el panel de PROPIEDADES mientras está abierto).
- **Drag desde panel al lienzo** (`EditorDndShell`): `PointerSensor` con `activationConstraint
  {distance: 4}`. `DroppableCanvas` (`CANVAS_DROP_ZONE_ID`) resalta con anillo azul discontinuo.
  Al soltar: `getDropClientPoint` → `clientPointToActivityMarco` (margen 5 %, centra el 90 % en el
  cursor) o `clientPointToWidgetMarco` (tamaño real del widget centrado + `clampDragCorner`).
  Soltar fuera del lienzo muestra el hint "Suelta sobre el lienzo para insertar el elemento".
- Insertar texto con una ficha de Tabs/Carousel seleccionada lo añade **a esa ficha**
  (`resolveWidgetSlideInsertTarget` + `appendTextBlockToWidgetSlide`), no como bloque del slide.
- Tras insertar, `setTimeout(… el.click())` sobre `[data-block-id="<nuevoIndice>"]` para seleccionarlo.

### 9.4 Copiar / pegar / duplicar

- `buildPastedBlock(source)`: `structuredClone` → `remintBlockChildIds` (IDs de hijos) →
  `prepareBlockForPaste` (offset `PASTE_OFFSET_PCT = 3 %` clampeado + nuevo `id` raíz
  `block_<ts>_<rnd>`).
- `copiedBlock` vive en `editor-client.tsx`; pegar cross‑slide usa `pasteCopiedBlockInSlide`.

---

## 10. Chrome del editor (paneles y toolbars)

| Zona | Componente | Contenido |
|---|---|---|
| Topbar (`bg-[#2563EB]`) | `editor-client.tsx` | Título de clase, zoom, estado de guardado, historial de versiones, "Guardar", iniciar/terminar sesión, modo de entrega, timer global |
| Toolbar flotante (centro‑arriba) | `floating-toolbar.tsx` (`SlideInsertionToolbar`, `SlideEditorChrome`) | Insertar bloques, undo/redo + dropdown de historial, reordenar capas, abrir panel de capas, cambiar fondo, insertar audio |
| Toolbar de alineación | `alignment-toolbar.tsx` | Aparece con ≥ 2 bloques desbloqueados |
| Toolbar de bloque | `BlockActionToolbarPortal` (portal a `body`) | Editar contenido de popup, fijar/soltar posición, copiar, duplicar, eliminar |
| Rail + flyout izquierdo | `icon-rail.tsx` + `flyout-panel.tsx` + `flyout-left-panels.tsx` | Elementos, Widgets (`widgets-insert-panel.tsx`), Layout, Fondo, IA (con selector DBA), Páginas (`slides-panel.tsx`) |
| Rail + flyout derecho | `right-rail.tsx` + `right-flyout-panel.tsx` | IA de actividades, Actividades interactivas (`activities-panel.tsx`), Temas (`themes-panel.tsx`), Respuestas en vivo (`live-responses-panel.tsx`) |
| Panel de propiedades | `panels/properties-panel.tsx` (1674 líneas) | Contextual por `block.tipo` y por selección interna de widget; oculto si `livePanelOpen` |
| Panel de capas | `layers-panel.tsx` | Lista ordenada por z‑index |
| Miniaturas | `slides-panel.tsx` + `slide-preview.tsx` | `SlideRenderer modo="preview"` escalado; refleja `effectiveBloques` en tiempo real durante drag (debounce 150 ms) |

---

## 11. Riesgos y deuda técnica observados (solo lectura)

| # | Área | Observación | Riesgo |
|---|---|---|---|
| 1 | `slide-renderer.tsx` | 2668 líneas, `RenderActivity` es un `switch` de ~25 ramas con `import` estático de todos los editores/viewers. Sin code‑splitting → bundle grande del editor. | Medio (rendimiento de carga) |
| 2 | Carrera inline‑vs‑panel | Popup, Hotspot, Click to Reveal y widgets de "Lienzo" con `contentEditable` compiten con el panel derecho como fuente de escritura. Aceptada como deuda; Tooltip la evita (solo panel). | Medio |
| 3 | Índice como identidad de bloque | `data-block-id` = índice del array (`"2"`, `"5-0-1"`). Reordenar por z‑index no cambia el array pero cualquier operación que sí lo haga invalida rutas guardadas en `setTimeout`. Undo/selección dependen de que el índice sobreviva al refetch. | Medio |
| 4 | `content` Fabric.js legado | `CanvasContent` sigue en el tipo `Slide` y `canvas-editor.tsx` existe aunque esté deprecado. | Bajo |
| 5 | Doble PATCH en resize | `handleResizeEnd` puede persistir vía `onPersistSlide` **y** el flujo normal según cómo lo cablee el padre; el snap se reaplica en `onResizeMove` tanto en cada frame como en el commit. | Bajo (idempotente) |
| 6 | Historial en memoria | Undo/redo se pierde al recargar o navegar fuera del editor; solo las versiones de servidor sobreviven. Es intencional pero puede sorprender. | Bajo (UX) |
| 7 | `escape_room` anida `SlideRenderer` | Un `SlideRenderer` viewer dentro de otro por sala; si una sala trae bloques pesados (video interactivo) se montan todos aunque no estén visibles salvo `bloquesVisiblesDeSala`. | Bajo |
| 8 | `sanitizeSlideContentForPersistence` destructivo | Si un slide tiene una actividad de primer nivel **y** otros bloques, el PATCH descarta los otros bloques silenciosamente. Correcto por diseño, pero sin aviso al usuario. | Bajo |
| 9 | `evaluateOrdenRango` | Código muerto en `activity-scoring.ts` (FE y BE) + entrada en `ACTIVITY_SCORING`. Limpieza pendiente. | Nulo |
| 10 | Espejo manual de scoring | `activity-scoring.ts` duplicado FE/BE (~1000 líneas), sincronizado por `check-fixtures-sync.mjs`. TODO: paquete `@lumina/scoring`. | Bajo (mitigado por tests de contrato) |

---

## 12. Archivos clave (mapa rápido)

```
CONTRATO / POSICIÓN
  src/hooks/use-block-drag.ts .................. getBlockPos, withPosition, withRect,
                                                blockPosToStyle, clampDragCorner/clampAxisOrigin,
                                                snapPositionToGuides, applyLiveDragPositions,
                                                applyNudgeToBlocks, useBlockDrag (hook dnd-kit)
  src/types/slide.types.ts .................... Slide, Block (unión), BLOCK_FALLBACKS, SlideGuias,
                                                GRID_SIZE_PRESETS
  src/lib/class-slide-normalize.ts ............ classSlideToRendererSlide, normalizeBlock,
                                                sanitizeSlideContentForPersistence, get/update/removeBlockAtPath

RENDER
  .../editor/components/slide-renderer.tsx .... SlideRenderer, BlockNode, RenderText/Image/Video/…,
                                                RenderActivity, RenderColumns, InlineTextEditor,
                                                BlockActionToolbarPortal
  .../editor/components/render-clip-group.tsx . máscaras de recorte (pan/escala imagen, borde, sombra)
  .../editor/components/clip-path-node-editor.tsx  edición Bézier de forma libre
  src/lib/clip-path.ts ....................... generarClipPath, librePathFromNodes, clamps de imagen

CANVAS / INTERACCIÓN
  .../editor/components/canvas-area.tsx ....... orquestación: selección, marquee, persist*, historial,
                                                CanvasAreaHandle (imperativo), zoom, guías
  .../editor/components/editor-dnd-shell.tsx .. DndContext único (bloques + drop de paneles)
  .../editor/components/droppable-canvas.tsx .. zona de drop
  .../editor/components/resize-handles.tsx .... 8 manijas
  .../editor/lib/resize-coords.ts ............ computeNewCoords, preserveEdgeAfterClamp
  .../editor/lib/block-resize-min-dim.ts ..... getBlockResizeMinDim
  .../editor/lib/activity-canvas-position.ts . drop → marco (actividad / widget)
  .../editor/lib/block-drag-id.ts ............ blockDragId / parseBlockDragIndex
  .../editor/components/canvas-guides.tsx ..... reglas + guías (UI)
  src/lib/canvas-guides.ts ................... virtual 1280×720, parseSlideGuias, toggleCenterGuides
  src/lib/canvas-grid.ts .................... grilla + snapAxisToGridPercent + overlay
  src/lib/canvas-spacing.ts ................. huecos iguales (getEqualGapSnapTargets)
  src/lib/canvas-layers.ts .................. z-index, buildLayerList, applyLayerReorderAction
  src/lib/canvas-zoom.ts ................... 50–200 %, Ctrl+rueda, localStorage
  src/components/editor/alignment-toolbar.tsx  alinear / distribuir
  src/components/editor/layers-panel.tsx ..... panel de capas
  src/components/editor/spacing-indicators.tsx  líneas verdes de espaciado

HISTORIAL / PERSISTENCIA
  .../editor/lib/canvas-history.ts ........... MAX_UNDO=20, snapshot, push/undo/redo/jump
  .../editor/editor-client.tsx .............. orquestación global, atajos de teclado, autosave,
                                                versiones de servidor, rails y paneles
  src/hooks/use-autosave.ts ................. isDirty / isSaving
  src/hooks/api/use-slide-versions.ts ....... SlideVersion (Ctrl+S)

REGLAS
  lumina-frontend/.cursorrules  ·  .cursor/rules/lumina-canvas-editor-contracts.mdc
  lumina-frontend/CLAUDE.md (familias de widgets, SlideNavContext)
```

---

## 13. Cómo verificar (tests del canvas)

```powershell
cd lumina-frontend
pnpm exec vitest run "src/app/(app)/classes/[id]/editor/lib/canvas-history.spec.ts" "src/hooks/use-block-drag.spec.ts" "src/lib/canvas-grid.spec.ts" "src/lib/canvas-zoom.spec.ts" "src/lib/canvas-layers.spec.ts"
```

Otros specs relevantes presentes en el repo: `resize-coords.spec.ts`, `block-drag-id.spec.ts`,
`activity-canvas-position.spec.ts`, `canvas-guides.spec.ts`, `canvas-spacing.spec.ts`,
`class-slide-normalize.widgets.spec.ts`, `widget-panel-catalog.spec.ts`,
`escape-room-canvas.spec.ts`.
