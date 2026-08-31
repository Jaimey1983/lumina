# Peritaje exhaustivo — Editor de clases de Lumina

> Generado: 30/08/2026
> Alcance: análisis pormenorizado (solo lectura) de **todo el editor de clases** de Lumina:
> orquestación, barras y raíles, paneles, lienzo, renderizado, propiedades por elemento,
> interacción, animaciones, historial, persistencia y sesiones en vivo desde el editor.
> Complementa (no repite) a `PERITAJE_LUMINA_CANVAS.md` (contrato de posición, snap, resize),
> `PERITAJE_WIDGETS.md` (auditoría interna de los 11 widgets) y `PERITAJE_ESCAPE_ROOM.md`.
> Fuente: `lumina-frontend/src/app/(app)/classes/[id]/editor/**` (~25 000 líneas) + hooks y libs
> asociados + `lumina-backend/`.

---

## Índice

1. Panorama y árbol de componentes
2. `editor-client.tsx` — el orquestador (2 993 líneas)
3. Barra superior (topbar)
4. Toolbar flotante del lienzo
5. Raíl izquierdo (`IconRail`) + `FlyoutPanel` — 6 paneles
6. Panel de diapositivas (`SlidesPanel`)
7. Área de lienzo (`CanvasArea`) — orquestación
8. Renderizado (`SlideRenderer` / `BlockNode`)
9. **Análisis pormenorizado de cada elemento del lienzo**
10. Raíl derecho (`RightRail`) + `RightFlyoutPanel` — 4 paneles
11. Panel de propiedades (`PropertiesPanel`, 1 674 líneas)
12. Inspector tipográfico
13. Animaciones y transiciones
14. Capas, alineación e indicadores de espaciado
15. Interacción del lienzo (selección · drag · snap · resize · nudge · guías · grilla · zoom)
16. Historial de edición (undo/redo local)
17. Persistencia (autosave · PATCH · versiones · temas · respuestas en vivo)
18. Sesiones en vivo desde el editor (Socket.IO)
19. Deuda técnica y hallazgos

---

## 1. Panorama y árbol de componentes

El editor es **una sola ruta cliente**: `page.tsx` (server, 16 líneas) → `SlideEditorClient`
(`editor-client.tsx`). No hay SSR de contenido; todo se hidrata vía TanStack Query
(`useClass(classId)` → `GET /classes/:id` con `slides[]`).

```
SlideEditorClient  (editor-client.tsx)
├── <header> TOPBAR  bg-[#2563EB], h-14
│     marca · título · código · undo/redo · guías · guías centrales · grilla + tamaño ·
│     zoom · estado de guardado · modo de entrega · timer global · conexión ·
│     Compartir · Iniciar/Finalizar clase · Bloquear respuestas · gamificación ·
│     Temas · Importar PPT · Vista previa · Historial · Guardar
├── <div> CUERPO (flex, min-h-0)
│     ├── IconRail  (raíl izq, w-16)          → 6 botones de panel + avatar
│     ├── EditorDndShell  (DndContext único)
│     │     ├── SlidesPanel  (w-48)           → miniaturas + reordenar + menú contextual
│     │     ├── FlyoutPanel  (absolute, w-56) → Elementos / Widgets / Layout / Fondo / IA / Páginas
│     │     ├── CanvasArea  (flex-1)          → lienzo + historial + drag + PropertiesPanel + LayersPanel
│     │     │     └── SlideCountdownOverlay   (temporizador en vivo)
│     │     └── RightFlyoutPanel (w-64/w-72)  → IA / Actividades / Temas / En vivo
│     └── RightRail  (raíl der, w-16)         → 4 botones de panel
├── <footer> STATUS BAR   → estado de guardado · nº de slides
└── Modales: Historial de versiones (Sheet) · Confirmar restaurar · Vista previa · NewClassModal · ImportPptxModal
```

**Móvil (`< md`)**: el editor no se renderiza; se muestra un aviso "Editor no disponible en el
móvil" con enlace a `/classes/:id`.

**Un único `DndContext`** (`EditorDndShell`) cubre a la vez: (a) el drag de bloques dentro del
lienzo (`useBlockDrag`) y (b) el drop de actividades/widgets desde los paneles laterales
(`isActivityPanelDrag` / `isWidgetPanelDrag` por `active.data.current.source`). `SlidesPanel`
tiene su **propio** `DndContext` independiente para reordenar diapositivas
(`@dnd-kit/sortable`, `verticalListSortingStrategy`, `activationConstraint {distance: 8}`).

---

## 2. `editor-client.tsx` — el orquestador

### 2.1 Estado local (≈35 `useState`)

| Grupo | Estados |
|---|---|
| Paneles | `activePanel: LeftPanelId\|null`, `rightPanel: RightPanelId\|null` |
| Lienzo | `guidesVisible` (def. `true`), `canvasZoom` (hidratado de `localStorage`), `canvasHistory {canUndo, canRedo}` |
| Portapapeles | `copiedBlock: Block\|null` |
| Slides | `activeSlideIndex` (+ `resolvedSlideIndex` clampeado) |
| Guardado | `saveError`, `contentSaveEpoch` (fuerza reinicio de autosave tras aplicar tema) |
| Modales | `modalUserOpen`, `showCurricularModal`, `pptxModalOpen`, `previewOpen`, `previewSlideIndex`, `historySheetOpen`, `versionPendingRestore` |
| Sesión en vivo | `isConnected`, `sessionId`, `sessionLoading`, `roomStudentCount`, `responsesLocked` |
| Respuestas en vivo | `liveResponses: Map<slideId, {activityType, responses[]}>` (persistida en `sessionStorage`), `autonomousStudentSlide: Map<studentId, slideIndex>` |
| Miniatura lateral | `activeSlideLiveBloques: Block[]\|null` (posiciones en vivo durante drag) |
| Desempeño | `confirmedDesempeno` |
| Sockets | `mainLiveSocket`, `torneoSocketRevision` |

### 2.2 Refs de cierre por clic exterior

`leftRailWrapRef`, `flyoutPanelRef`, `rightRailWrapRef`, `rightFlyoutPanelRef`,
`editorHeaderRef`, `canvasAreaRef` (`CanvasAreaHandle`), `canvasSurfaceRef` (marco del lienzo,
compartido con `EditorDndShell`). Un `pointerdown` capturado en `document` cierra el panel
activo salvo que el clic caiga en un raíl, un flyout, la topbar o una **capa portada de Radix**
(`isPointerOnPortedOverlay`: `[role="dialog"]`, `[data-slot="dropdown-menu-content"]`,
`select-content`, `popover-content`, `tooltip-content`).

### 2.3 Hooks de datos (TanStack Query mutations)

`useUpdateSlide`, `useUpdateClass`, `useCreateSlide`, `useRemoveSlide`, `useReorderSlides`,
`useInsertSlide`, `useCreateSlideVersion`, `useRestoreSlideVersion`, `useSlideVersions`,
`useClass`. Todas invalidan/refetchean `['classes','detail',classId]`.

### 2.4 Derivados memoizados

- `sortedSlides` = `cls.slides` ordenados por `order`.
- `rendererSlide` = `classSlideToRendererSlide(activeSlide)` — normaliza el JSON `content`.
- `activeActivity` = primer bloque `actividad` de `content.bloques` (o `null`).
- `activeSlideHasActivity` = `!!activeActivity` → **bloquea insertar widgets/elementos no-texto**.
- `activeGrid` = `normalizeSlideGrilla(content.guias?.grilla)` — refleja preset y estado.
- `customThemes` = `getCustomThemesForClass(classId, cls.desempeno)` (temas guardados en
  `localStorage` + fusionados en `desempeno`).
- `autonomousStudentsPerSlide` = array `[nº alumnos]` por índice de slide (modo autónomo).
- `rightFlyoutLiveSocket` — **torneo/escape_room usan el socket del namespace `/live`**; el
  resto del panel usa el socket por defecto de `ClassesGateway`.

### 2.5 Atajos de teclado (`useEffect` global, se ignora si el foco está en `input`/`textarea`/`contentEditable`)

| Tecla | Acción |
|---|---|
| `Ctrl/⌘+S` | `handleSave` — PATCH + crea `SlideVersion` (si no hay sesión) |
| `Escape` | cascada: cierra panel izq → cierra panel der → limpia selección de bloque |
| `Ctrl/⌘+Z` | `canvasAreaRef.undo()` |
| `Ctrl/⌘+Shift+Z` ó `Ctrl/⌘+Y` | `redo()` |
| `Ctrl/⌘+C` | `copySelectedBlock()` |
| `Ctrl/⌘+V` | `pasteCopiedBlock(copiedBlock)` |
| `Ctrl/⌘+D` | `duplicateSelectedBlock()` |
| `Supr` / `Retroceso` | `deleteSelectedBlock()` |
| Flechas | `nudgeSelectedBlocks(±1 px)`; **Shift+flecha** = ±10 px |

### 2.6 Handlers de dominio (todos vía `handleCommitSlideContent` → `sanitize` → `updateSlide.mutate`)

| Handler | Qué hace |
|---|---|
| `handleAddSlideWithLayout(key)` | `insertSlide` después del activo con `buildInsertSlideBloques(key,false)`; avanza el índice |
| `handleApplyLayout(key)` | Si el slide activo está **vacío** → aplica layout in-place; si tiene actividad o contenido real → inserta un slide nuevo; si tiene "contenido real" (texto/imagen no vacíos) → toast "El slide tiene contenido" |
| `handleDuplicateSlide(id)` | Clona `content` (deep JSON), reasigna `id`/`orden`, sanitiza, `insertSlide` "(copia)" |
| `handleImportPptx(slides[])` | Bucle `insertSlide.mutateAsync` por cada slide importado (`.pptx` parseado por el backend) |
| `handleRemoveSlide` / `handleMoveSlide` / `handleReorderSlides` | CRUD y reordenamiento (`reorderSlides.mutate` con `[{id, order}]`) |
| `handleActivityChange` / `handleFlipCardsChange` / `handleTabsChange` / `handleCarouselChange` / `handleClickRevealChange` / `handlePopupChange` / `handleHotspotChange` / `handleTimelineChange` | `updateBlockAtPath(bloques, blockPath, fn)` + commit. Uno por tipo de widget con `if (b.tipo !== 'X') return b` |
| `handleRemoveBlock(blockPath)` | `removeBlockAtPath` + commit + toast "Actividad eliminada" |
| `handleAddActivity(type, dropMarco?)` | Mapa de 24 plantillas (`quizMultipleTemplate`, `createDefaultMemoria`, …) → `{tipo:'actividad', actividad, marco?}`. Si el slide activo está vacío → lo añade ahí; si no → crea slide nuevo (`buildContentDocumentForNewActivitySlide`). `dropMarco` viene del drop desde panel |
| `handleActivityDrop` / `handleWidgetDrop` | Puentes desde `EditorDndShell` (ignoran si `activeSlideHasActivity`) |
| `handleInsertAiActivity(content)` | Inserta actividad generada por IA (título = `pregunta`/`afirmacion` truncada a 60) |
| `handleAddWidget(type, dropMarco?)` | 11 `createDefault*Block(dropMarco)`; `appendBlockToSlideContent` + `selectBlockByIndex(nuevoIndice)` tras 50 ms |
| `handleApplyThemeToSlide` / `handleApplyThemeToAllSlides` | `persistThemeOnSlide` (PATCH por slide) + `patchSlidesThemeInCache` (optimista) + `refetchQueries`. "A todos" itera secuencialmente y cuenta éxitos |
| `handleSaveCustomThemes(themes)` | `persistCustomThemesLocally` + `updateClassMutation({desempeno})` con temas fusionados |
| `handleStartSession` / `handleEndSession` | `POST /classes/:id/sessions/start` → `sessionId`; `PATCH .../sessions/end` con `resultados[]` evaluados por `evaluateActivityResponse` (`window.confirm` previo) |

### 2.7 Modal curricular automático

Si la clase **no tiene `desempeno` persistido** (`hasDesempenoPersistido`), se abre `NewClassModal`
una vez por sesión (`autoOpenedRef`). El `desempeno` alimenta la sugerencia de tema en el panel IA
y el título mostrado en la topbar.

---

## 3. Barra superior (topbar)

`bg-[#2563EB]`, altura 14 (3.5 rem). Tres zonas:

**Izquierda**: logo `LM-ffffff.svg` + "Lumina" (link a `/dashboard`) · título de clase
(`<input readOnly>`, `title` = enunciado del desempeño) · pill de código
(`LUM-XXXX`, se antepone `LUM-` si falta).

**Centro** — controles de lienzo (todos delegan en `canvasAreaRef.current`):

| Control | Icono | Acción |
|---|---|---|
| Deshacer / Rehacer | `Undo2` / `Redo2` | `undo()` / `redo()` — `disabled` por `canvasHistory` |
| Guías | `Ruler` | `setGuidesVisible(v => !v)` — muestra reglas y guías manuales |
| Guías centrales | `Crosshair` | `toggleCenterGuides()` — añade/quita 640/360 |
| Grilla | `Grid3x3` | `toggleGrid()` — `aria-pressed` = `activeGrid.activa` |
| Tamaño de grilla | `<select>` | `setGridSize(px)` — presets `[8,16,20,32,40,64,80]`, solo visible si la grilla está activa |
| Zoom | `ZoomOut` / `%` / `ZoomIn` | `handleCanvasZoomChange(step ±0.1)`; el `%` restablece a 100 %; `Ctrl+rueda` sobre el workspace |
| Estado de guardado | — | `Error al guardar` / `Guardando…` (`Loader2`) / `Cambios pendientes…` / `Guardado` (`Check`) |

**Derecha** — solo para `TEACHER`/`ADMIN`/`SUPERADMIN` (`canConfigureLiveTimer`):

- **Modo de entrega** (segmented): `clase` / `presentacion` / `autonomo` →
  `PATCH /classes/:id { modoEntrega }`. Deshabilitado si hay sesión activa.
- **Timer global**: `<Select>` con `SLIDE_TIMER_GLOBAL_OPTIONS` → `PATCH { timerGlobal }`.
- Indicador de conexión (punto verde/gris).
- **Compartir** ("próximamente").
- **Iniciar clase** / **Finalizar clase** (según `sessionId`).
- Si hay sesión: **Bloquear/Desbloquear respuestas** (`lock-responses`/`unlock-responses`),
  **Activar gamificación** (`iniciarGamificacion`), **Ranking visible/oculto**
  (`toggleLeaderboardVisible`).
- Pill `N/M respondieron` (`liveSlideRespondedCount` / `roomStudentCount`) si hay actividad y
  alumnos conectados.
- **Temas** (`toggleRightPanel('themes')`), **Importar PPT** (`ImportPptxModal`),
  **Vista previa** (abre `/classes/:id/preview` en pestaña nueva),
  **Historial** (Sheet de versiones, solo sin sesión), **Guardar** (`handleSave`).

**Status bar** (footer): `saveStatusLabel` a la izquierda, `N slides` a la derecha.

---

## 4. Toolbar flotante del lienzo

Vive centrada arriba del lienzo (`floating-toolbar.tsx`, 1 051 líneas). Dos componentes:

### 4.1 `SlideInsertionToolbar` — insertar elementos

Botones (deshabilitados si el slide tiene actividad, salvo Texto):

| Botón | Inserta |
|---|---|
| **Texto** (`Type`) | `{tipo:'texto', contenido:'Texto nuevo', x:10,y:40,ancho:80,alto:15, tamanoFuente:'24px', color:'#000', alineacion:'izquierda'}` |
| **Imagen** (`ImageIcon`, Popover) | Desde archivo (`FileReader` → data URL) o URL → `makeImageBlockFromUrl` (`x:25,y:25,ancho:50,alto:50, ajuste:'llenar'`) |
| **Vídeo** (`Video`, Popover) | URL YouTube/vídeo o archivo → `makeVideoBlockFromUrl` (fallback `BLOCK_FALLBACKS.video`) |
| **Forma** (`Shapes`) | `{tipo:'forma', forma:'rectangulo', color:'#6366f1', x:30,y:30,ancho:40,alto:30}` |
| **GIF** (`Film`, Popover con Tabs URL/archivo) | Se inserta como bloque `imagen` |

Todos los archivos se convierten a **data URL** (`readAsDataURL`) — no hay subida a servidor;
las imágenes/vídeos locales viajan embebidos en el JSON del slide.

### 4.2 `SlideEditorChrome` — utilidades

- **Deshacer / Rehacer** + **dropdown Historial de edición** (`historyItems` con
  `formatHistoryWhen(at)` → "ahora", "hace 3 min"…; salta a un snapshot con `onJumpToHistory`).
- **Panel de capas** (toggle `layersPanelOpen`).
- **Ordenar** (dropdown): Traer al frente / Enviar atrás / Traer adelante / Enviar atrás un
  nivel → `onReorder(LayerReorderAction)` sobre el bloque seleccionado.
- **Diseño** (Popover): color sólido (`<input type=color>`) o gradiente (2 colores + dirección
  horizontal/vertical/diagonal → 90/180/135°) → `onChangeFondo(Background)` con historial `kind:'fondo'`.
- **Tabla** ("próximamente"), **Audio** (archivo → data URL → `{tipo:'audio', controles:true}`).
- **Publicar / Compartir**: si `status !== PUBLISHED` → `PATCH { status:'published' }` y abre modal
  con código + enlace `origin/join/CODIGO` (`navigator.clipboard.writeText`).

### 4.3 `FloatingToolbar` (export legado)

Barra `position:fixed` con Subir/Bajar/Duplicar/Eliminar. **No se usa en el editor vivo** — la
barra de acciones de bloque real es `BlockActionToolbarPortal` (dentro de `slide-renderer.tsx`,
ver §8.4).

---

## 5. Raíl izquierdo (`IconRail`) + `FlyoutPanel`

`IconRail` (w-16): 6 botones (`elementos`, `widgets`, `layout`, `fondo`, `ia`, `paginas`) +
botón "Cambiar desempeño" (`RefreshCw` → `NewClassModal`) + avatar con dropdown (Perfil / Cerrar
sesión). `RailButton` está memoizado para evitar el loop de `composeRefs` de Radix.

`FlyoutPanel` (`absolute inset-y-0 left-0`, w-56, `shadow-xl`): cabecera con `label` + botón X;
aviso "Selecciona un slide para editar" si `!apiSlide` (salvo paneles `paginas`/`ia`). El
contenido lo enruta `FlyoutLeftPanels` (`flyout-left-panels.tsx`, 1 403 líneas).

### 5.1 Panel **Elementos** (`ElementosPanel`)

`ScrollArea` con 4 secciones, cada `add(block)` → `appendBlockToSlideContent` + commit:

- **`ImagesElementPanel`** — input URL con **vista previa** (valida `http/https/data`, `onError`
  → "No se pudo cargar"), botón "Agregar al slide" (`{tipo:'imagen', ancho:'100%', ajuste:'llenar'}`),
  y **galería de 6 muestras Unsplash** (montaña/océano/ciudad/bosque/abstracto/aurora).
- **`ShapesPanel`** — 4 formas (rectángulo/círculo/triángulo/línea). Rect/círculo/triángulo:
  `colorBorde:'#475569'`, `grosorBorde:4`, `ancho` 240 (140 círculo), `alto` 140. Línea:
  `color:'#64748b'`, `grosorBorde:2`.
- **`ClipMasksPanel`** — 7 máscaras de recorte: rectángulo (radio 8), círculo, triángulo,
  estrella (5 puntas, radioInterno 0.4), hexágono, elipse, **forma libre**
  (`createDefaultLibreShape`). Cada una → `createDefaultClipGroupBlock(shape)`.
- **Multimedia**: Video (YouTube demo hardcodeado) · Audio (`SoundHelix` demo).
- **Estructura**: Separador · Cita (`{texto:'Texto de la cita', autor:'Autor'}`) · Dos columnas
  vacías (`columnas: [[texto], [texto]], proporcion:'1:1'`).

Todo salvo texto se deshabilita si `slideHasActivity` (banner ámbar "Solo puedes agregar título").

### 5.2 Panel **Widgets** (`WidgetsInsertPanel`)

Recorre `WIDGET_PANEL_GROUP_ORDER` = `['lienzo','overlay','control']` y renderiza cada widget
como `DraggableWidgetItem` (clic → `onAddWidget(type)`; drag → `data.source='widget-panel'`).
Cada fila tiene `rowClassName`/`iconClassName` de color propio (`widget-panel-catalog.ts`).
Sección "Próximamente": Iframe, GIF, QR, Gráfico de barras, Tabla (`toast.info('Próximamente')`).

- **Lienzo**: Flip Cards, Tabs, Carousel, Click to Reveal, Timeline.
- **Overlay**: Popup.
- **Control**: Hotspot, Tooltip, Botón, Contador, Progreso.

### 5.3 Panel **Layout** (`LayoutPanel`)

Grid 2 columnas con los **10 layouts persistidos** (`SLIDE_LAYOUT_ORDER`): en_blanco,
titulo_centrado, titulo_centrado_subtitulo, titulo_y_contenido, titulo_texto_imagen,
dos_columnas, imagen_derecha, imagen_izquierda, tres_columnas, pantalla_completa. Cada uno con
`LayoutThumbnail` (SVG 16:9). Clic → `onApplyLayout(key)` (ver §2.6). El actual queda con
`ring-primary`. `buildInsertSlideBloques(key)` genera bloques `texto`/`imagen` posicionados en %.

### 5.4 Panel **Fondo** (`FondoPanel`, `key={apiSlide.id}` para reset)

- Color sólido (`<input type=color>` + "Aplicar color") → `mergeSlideContent({fondo:{tipo:'color',valor}})`.
- 4 gradientes rápidos: Azul, Atardecer, Verde, Oscuro (`direccion:135`).
- Imagen de fondo por URL → `{tipo:'imagen', ajuste:'cubrir'}`.

### 5.5 Panel **IA** (`IaPanel`) — el más complejo del raíl

Barra superior `IaProviderBar`: muestra el proveedor resuelto (`describeAiResolvedStatus`),
selector `AiPreferredProviderSelect` (Claude/Gemini/OpenAI, `useSetPreferredAiProvider`), enlace
a `/profile#ai-keys`.

Dos pestañas:

**Desde tema**: Plantilla pedagógica (`PLANTILLAS` de `ia-templates.ts`, cada una con
`estructura` y `slideCount`) · Área + Grado (dispara `useCurriculumLoader` → carga JSON DBA,
indicador verde "N unidades DBA cargadas") · Tema · Nivel (beginner/intermediate/advanced) ·
"Generar clase" → `useContentAssistant`.

**Desde documento**: `FileUpload` `.pdf/.txt` (5 MB) — el PDF se lee con `FileReader.readAsText`
+ limpieza de caracteres no imprimibles (PDFs escaneados no funcionan) · Textarea manual (aviso
si > 6 000 chars) · Tema enfocado opcional · Área/Grado · "Generar desde documento" →
`useGenerateFromDocument`.

**Pantalla de resultado**: título/descripción, conceptos extraídos (chips), duración estimada,
objetivos, lista de slides. **Modo conversacional** (`useRefineStructure`): input de instrucción
("quita el slide 3", "hazlo más simple") con historial `conversationHistory[]`. Botón
**"Insertar en editor"**: por cada `GeneratedSlideStructure` llama `buildBloquesDesdeSlideIA`
(mapea 8 tipos: portada→titulo_centrado_subtitulo, exploracion→pantalla_completa,
concepto→titulo_y_contenido, ejemplo→imagen_derecha si hay imagen, estructura→dos_columnas si
hay tabla, comparacion→dos_columnas, actividad, cierre) + `layoutDesdeSlideIA` + un slide
"Contexto Curricular" tras la portada si hay `curriculumData`. Cada slide → `onCreateActivitySlide`.

### 5.6 Panel **Páginas** (`PaginasPanel`)

- **Temporizador por slide**: `<Select>` con `SLIDE_TIMER_PER_SLIDE_OPTIONS`. Valor `inherit` →
  borra `content.timer` (usa global); `0` → sin temporizador; otro → segundos.
- Lista de slides (botones) con número, título y `type`; clic → `onSelectSlide(idx)`.

---

## 6. Panel de diapositivas (`SlidesPanel`, 816 líneas)

`aside` w-48, borde derecho. Cabecera "Slides" + botón `+` (Popover con `CORE_SLIDE_LAYOUTS`:
en_blanco, titulo_centrado, titulo_y_contenido, dos_columnas → `onAddSlide(key)`).

**Lista** (`DndContext` propio + `SortableContext` vertical): cada `SortableSlideItem` con
`useSortable({id: slide.id})`, `opacity 0.5` al arrastrar. Contiene:

- **`SlideCanvasThumb`** (memo): renderiza el slide real con `<SlideRenderer modo="preview"
  isThumbnail>` a 1280×720 escalado, **lazy** (`useLazyInView`, siempre visible si `isActive`).
  Refleja posiciones en vivo: recibe `liveContent = activeSlideLiveContent` (posiciones
  post-drag antes del refetch, con debounce 150 ms en `CanvasArea`).
  - `ActivityBadge` (pill azul con `Zap` + conteo si ≥2 actividades, tooltip con nombres).
  - Número de orden (badge negro translúcido).
- **Handle de arrastre** (`GripVertical`, aparece en hover), **botón eliminar** (`Trash2` rojo,
  hover), **flechas Subir/Bajar** (hover, deshabilitadas en extremos).
- **Menú contextual** (clic derecho): "Duplicar slide" (`onDuplicateSlide`), "Pegar bloque"
  (si `copiedBlock` — pega en ese slide vía `pasteCopiedBlockInSlide` o `pasteCopiedBlock` si es
  el activo).

Etiqueta inferior: título + `SLIDE_LABELS[type]`.

También existe `SlideThumbnailPreview` (versión SVG simplificada: primera imagen / primeras 2
líneas de texto / icono de actividad / número) usada en tarjetas fuera del editor.

---

## 7. Área de lienzo (`CanvasArea`, 1 897 líneas)

`forwardRef<CanvasAreaHandle>`. Contiene el lienzo 16:9, el `PropertiesPanel` (derecha,
`max-w-72` colapsable), el `LayersPanel` opcional, las toolbars flotantes, el marquee y las
líneas de snap. Detalle de posición/snap/resize/historial en `PERITAJE_LUMINA_CANVAS.md`;
aquí lo específico del componente:

### 7.1 Estructura de persistencia

- `patchSlideContent(content)` → `fetch PATCH /classes/:classId/slides/:slideId` con
  `sanitizeSlideContentForPersistence(content)` y `Authorization: Bearer`. Devuelve `res.ok`.
- `patchSlideContentById(slideId, content)` — variante cross-slide (pegar en otro slide).
- `buildContentPayload(bloques, fondoOverride?, guiasOverride?)` → `{bloques, fondo?, diseno?,
  transicion?, guias}`.
- `persistBloques(next, prev, recordHistory, kind)` → PATCH → `recordAfterSuccess` (snapshot) →
  `refetchQueries`.
- `persistGuias`, `handleChangeFondo`, `handleApplySlide` (transición), `handleApplyBloques`
  (alineación), `handleClipGroupChange`, `handlePersistFromRenderer` (resize/texto inline).

### 7.2 Selección

- `handleRendererBlockSelect(id, e?)` — Shift alterna `selectedBlockIds`; limpia selecciones
  internas de widgets **solo si cambia el bloque** (`selectedBlockIdRef.current !== id`).
- `handleCanvasMouseDown` — **marquee** (rectángulo azul translúcido `rgba(37,99,235,0.1)`):
  al soltar intersecta el rect (%) contra `getBlockPos` de cada bloque → selecciona los que
  solapan en X e Y. Ignora clics sobre `[data-block-id]`, handles, `button/input/textarea/select`.
- Efecto de "click capture" en el root: si `wasDraggingRef` estaba activo, cancela el clic;
  clic fuera de un bloque → deselecciona.
- Efecto que **poda `selectedBlockId`** si el bloque ya no existe tras refetch.

### 7.3 `CanvasAreaHandle` (API imperativa expuesta a `editor-client`)

`undo`, `redo`, `pasteCopiedBlock`, `pasteCopiedBlockInSlide`, `duplicateSelectedBlock`,
`copySelectedBlock`, `deleteSelectedBlock` (devuelve bool), `clearBlockSelection`,
`persistBloquesFromDrag`, `selectBlockByIndex`, `nudgeSelectedBlocks(dxPx, dyPx)`,
`toggleCenterGuides`, `toggleGrid`, `setGridSize`, `resetSlideHistory`.

### 7.4 Toolbars renderizadas en `CanvasArea`

- **Toolbar flotante** centrada arriba (`SlideInsertionToolbar` + `SlideEditorChrome`).
- **`AlignmentToolbar`** — solo si hay ≥2 bloques **desbloqueados** seleccionados (a
  `top: calc(var(--editor-toolbar-top) + 3rem)`).
- **`SpacingIndicators`** — si hay un `activeBlock` (líneas de distancia a bordes/vecinos).
- **`BlockDragHandle`** por bloque posicionable no bloqueado (badge `GripHorizontal` 36×16 px,
  el resto del overlay es `pointer-events:none`).
- **Líneas de snap** (`snapLines.map` → `<div>` absolutos `zIndex 9999`).
- **`CanvasGuidesChrome`** envuelve el lienzo: reglas de 16 px + guías manuales + overlay de grilla.
- **`DroppableCanvas`** (`CANVAS_DROP_ZONE_ID`) — zona de drop, resalta con anillo azul discontinuo.

`scale(canvasZoom)` se aplica al **wrapper del viewport** (`max-w-[var(--editor-slide-max-w)]`),
nunca a los bloques. Con zoom > 1 el contenedor pasa a `overflow-auto`.

---

## 8. Renderizado (`SlideRenderer` / `BlockNode`, 2 668 líneas)

### 8.1 Modos

`'editor'` (autoría, `overflow: visible`, handles, edición inline, toolbars) ·
`'viewer'` (presentacional, `overflow: hidden`, animación de entrada escalonada `blockIndex*80ms`,
viewers de actividad interactivos) ·
`'preview'` (lienzo fijo 1280×720 + `transform: scale(clientWidth/1280)` — para miniaturas).

`variant: 'dark'|'light'` se calcula por luminancia del fondo (`getSlideVariant`).

### 8.2 Fondo (`buildBackgroundStyle`)

`color` → `backgroundColor`; `gradiente` → `linear-gradient(${direccion ?? 135}deg, …)`;
`imagen` → `backgroundImage` + `backgroundSize` (`cubrir`→cover, `contener`→contain,
`llenar`→100% 100%, `ninguno`→auto) + `backgroundPosition`.

### 8.3 `BlockNode` — banderas por bloque (editor)

`isFormBlock` (actividad en editor) · `isWidgetBlock` · `isBlockButtonShell` (bloque simple
seleccionable con `role="button"`, `aria-pressed`, Enter/Espacio) · `isTextEditing`
(`editingId === blockId`) · `popupOverlayEditing` / `clipInnerEdit` (ocultan handles de resize) ·
`canvasLocked` (anillo ámbar).

`renderContent()` es un `switch(block.tipo)` que despacha al renderer/editor/viewer correcto
(ver §9). `ResizeHandles` se pinta si: editor + seleccionado + no `clipInnerEdit` + no
`popupOverlayEditing` + no `canvasLocked` + hay `currentCoords`.

### 8.4 `BlockActionToolbarPortal` — barra de acciones de bloque

Portal a `document.body` (evita recorte por `overflow`). Se posiciona sobre el bloque con
`getBoundingClientRect` + `ResizeObserver` + listeners de `scroll`/`resize`. Botones:

- **Editar contenido del popup** (`Pencil`, solo `popup`) → `onPopupInnerSelectionChange({kind:'overlay'})`.
- **Fijar / desbloquear posición** (`Lock`/`LockOpen`, si `canvasPositionable`).
- **Copiar** (`Copy`, no actividades) → `onCopyBlock`.
- **Duplicar** (`Copy`, no actividades) → `onDuplicateBlock`.
- **Eliminar** (`Trash2`) → `onRemoveBlock`.

### 8.5 Edición inline de texto (`InlineTextEditor`)

`<textarea>` que aparece al **doble clic** en un bloque `texto` (editor). **Shift+Enter** o blur
= confirmar (`onCommit`); **Escape** = descartar. `exitedRef` evita doble disparo. Placeholder
según tamaño de fuente: ≥28 px → "Haga clic para agregar título", si no → "Haga clic para
editar · Shift+Enter para confirmar". Al confirmar: `handleEditCommit` → si el texto cambió,
`updateBlockAtPath` + `mergeRendererSlideState` + `sanitize` → `onPersistSlide` (historial) o
`updateSlide.mutate`.

### 8.6 Resize (`handleResizeEnd`)

`updateBlockAtPath` con `withRect` (o `marco` para actividades). Casos especiales:
- **`imagen`**: fuerza `ajuste: 'llenar'` al soltar.
- **`popup`**: recalcula `triggerAnchoPx`/`triggerAltoPx` en px (`clampPopupTriggerPx`) desde el
  bbox y `measureCanvasRef.getBoundingClientRect`; `syncPopupBlockSizeFromTriggerPx` reescribe el bbox.

---

## 9. ANÁLISIS PORMENORIZADO DE CADA ELEMENTO DEL LIENZO

Para cada elemento: **estructura de datos · inserción · render · edición (panel) · posición ·
resize mínimo · comportamiento especial**.

### 9.1 `texto` (`TextBlock`)

- **Datos**: `contenido` (string), `nivel?` (1–6 → `<h1..6>`), `alineacion`, `tamanoFuente`
  (string px), `negrita`/`cursiva`/`subrayado`, `fuente`, `interlineado` (multiplicador),
  `espaciadoLetras` (px), `transformacion` (`ninguna`/`mayusculas`/`titulo`), `opacidad`,
  `sombra`, `fondoTexto` + `radioFondo`, `lista` (`ninguna`/`vinetas`/`numeros`), `x/y/ancho/alto`, `zIndex`.
- **Inserción**: toolbar "Texto" (24 px, x:10,y:40,80×15) · panel Elementos · layouts ·
  IA · dentro de una ficha de Tabs/Carousel (`resolveWidgetSlideInsertTarget`).
- **Render**: `RenderText` crea `<p>`/`<h*>`/`<ul>`/`<ol>` con `typographyToCss(typographyFromTextBlock)`
  + estilos opcionales. Lista: cada `\n` → `<li>` (vacío → ` `). Placeholder discontinuo en
  editor si `contenido` vacío.
- **Edición**: doble clic → `InlineTextEditor`; panel derecho → **`TypographyInspector`**
  (`TextBlockFields`, sizeMin 12, sizeMax 120, defaultSize 24, `enableList`). Cambios de solo
  tamaño → `scheduleApply` (debounce 500 ms); el resto → `applyNow` inmediato.
- **Fallback**: `{x:10,y:10,ancho:80,alto:20}`. **minDim** resize: 5 %.

### 9.2 `imagen` (`ImageBlock`)

- **Datos**: `url`, `alt`, `ancho`/`alto` (string `'100%'` o número %), `ajuste`
  (`cubrir`/`contener`/`llenar`), `lockAspectRatio`, `bordeRedondeado` (string px), `caption`, `x/y`, `zIndex`.
- **Inserción**: toolbar (Popover archivo/URL) · panel Elementos (URL con preview + galería
  Unsplash) · GIF · layouts (placeholder `placehold.co`).
- **Render**: `RenderImage` → `<figure><img>` + `figcaption`. `objectFit`: `forceFill` durante
  resize (`isResizing`), si no según `ajuste`. `hasMediaSrc(url)` falso → placeholder gris "Sin imagen".
- **Edición** (`ImageBlockFields`): Ajuste (`<Select>` cubrir/contener/llenar), **Bloquear
  proporción** (`<Switch>` → `lockAspectRatio`), Borde redondeado (`<Slider>` 0–50 px, debounce),
  **Reemplazar imagen** (archivo → data URL, `applyNow`).
- **Fallback**: `{x:25,y:25,ancho:50,alto:50}`. **minDim** 5 %. `lockAspectRatio` propaga a
  `ResizeHandles` (Shift también fuerza ratio en esquinas).

### 9.3 `video` (`VideoBlock`)

- **Datos**: `url`, `plataforma` (`youtube`/`vimeo`/`directo`), `autoplay`, `controles`, `bucle`,
  `silenciado`, `ancho`/`alto`, `x/y`, `zIndex`.
- **Render**: `RenderVideo` — YouTube/Vimeo → `<iframe>` con `buildEmbedUrl` (regex extrae id);
  directo → `<video controls>`. En miniatura (`isThumbnail`): `img.youtube.com/vi/<id>/0.jpg` o
  placeholder oscuro con triángulo.
- **Edición** (`VideoBlockFields`): URL (`<Input>` + `scheduleApply` + `onBlur` `applyNow`),
  Autoplay + Controles (`<Toggle>`).
- **Fallback**: `BLOCK_FALLBACKS.video` (`{x:10,y:30,ancho:80,alto:40}`). **minDim** 5 %.

### 9.4 `audio` (`AudioBlock`)

- **Datos**: `url`, `autoplay`, `controles`, `bucle`. **Sin bbox** (`isBlockCanvasPositionable`
  = false) — fluye en el layout, sin handles ni drag.
- **Inserción**: chrome de la toolbar (`onInsertAudio`, archivo → data URL) o panel Elementos.
- **Render**: `RenderAudio` → `<audio controls>` (ancho 100 %). Sin panel de propiedades
  ("Este tipo de bloque no tiene propiedades aquí").

### 9.5 `codigo` (`CodeBlock`)

- **Datos**: `codigo`, `lenguaje?`, `mostrarNumeroLineas?`, `titulo?`. **Sin bbox**.
- **Render**: `RenderCode` → `<pre>` tema oscuro (`#1e1e1e`/`#d4d4d4`, `ui-monospace`) + cabecera
  con `titulo`. Sin panel de propiedades. No hay UI de inserción en el raíl (solo llega de importaciones/IA).

### 9.6 `cita` (`QuoteBlock`)

- **Datos**: `texto`, `autor?`, `fuente?`. **Sin bbox**.
- **Inserción**: panel Elementos → Estructura → "Cita".
- **Render**: `RenderQuote` → `<blockquote>` con borde izquierdo + `<cite>` + fuente. Sin panel.

### 9.7 `separador` (`DividerBlock`)

- **Datos**: `estilo` (`solido`/`punteado`/`guionado`), `color`, `grosor`. **Sin bbox**.
- **Render**: `RenderDivider` → `<hr>` con `borderTop` mapeado. Sin panel.

### 9.8 `columnas` (`ColumnsBlock`)

- **Datos**: `columnas: Block[][]` (recursivo), `proporcion?` (`"2:1"`). **Sin bbox** (contenedor).
- **Inserción**: panel Elementos → "Dos columnas (vacías)".
- **Render**: `RenderColumns` → `display:grid` con `gridTemplateColumns` de `proporcion` (o
  `repeat(N,1fr)`); cada hijo es un `BlockNode` recursivo con ruta `"i-col-j"`. `getBlockAtPath`
  / `updateBlockAtPath` / `removeBlockAtPath` navegan esas rutas (`class-slide-normalize.ts`).

### 9.9 `forma` (`FormaBlock`)

- **Datos**: `forma` (`rectangulo`/`circulo`/`triangulo`/`linea`), `color`, `opacidad` (0–100),
  `colorBorde`, `grosorBorde`, `ancho/alto`, `x/y`, `zIndex`.
- **Inserción**: toolbar "Forma" (rectángulo `#6366f1` 40×30) · panel Elementos → `ShapesPanel`.
- **Render**: `RenderForma` — `linea` → `<hr>`; `triangulo` → `<svg polygon points="50,0 100,100 0,100">`
  con `fill`/`stroke`; `rectangulo`/`circulo` → `<div>` (círculo `borderRadius:50%`). `opacidad` → `opacity`.
- **Edición** (`FormaBlockFields`): Color de relleno (`<input type=color>`, `applyNow`), Tipo de
  forma (`<Select>`), Opacidad (`<Slider>` 0–100, debounce local `opLocal`).
- **Fallback**: `{x:10,y:10,ancho:30,alto:30}`. **minDim** 5 %.

### 9.10 `clip-group` (`ClipGroupBlock`) — máscaras de recorte (Fase 2)

- **Datos**: `clipShape` (9 tipos: `rectangulo`+`borderRadius`, `circulo`, `elipse`, `triangulo`,
  `estrella`+`puntas`+`radioInterno`, `hexagono`, `poligono`+`lados`, `svg`+`path`,
  `libre`+`nodos: ClipPathNode[]`+`cerrado?`) · `contenido` (`imagen`+`offsetX/Y`+`escala`+`ajuste`,
  `color`, `gradiente`+`direccion`) · `borde?` (`color`+`grosor`) · `opacidad?` · `sombra?`
  (`color`+`blur`+`offsetX/Y`) · `x/y/ancho/alto`, `zIndex`.
- **Inserción**: panel Elementos → `ClipMasksPanel` (7 formas) → `createDefaultClipGroupBlock(shape)`.
- **Render**: `RenderClipGroup` — `<clipPath clipPathUnits="objectBoundingBox">` con `d` de
  `generarClipPath(clipShape)` o `librePathFromNodes(nodos, cerrado)`. Contenido: `<img>` con
  `getClipImageStyle` (natural size + container size + escala + offsets + ajuste) o `<div>` con
  `clipContentBackground`. Borde: `<path stroke vectorEffect="non-scaling-stroke">`. Sombra:
  `filter: drop-shadow(...)`.
- **Interacción en lienzo**:
  - Clic simple = seleccionar → mover/redimensionar el grupo (handles normales).
  - **Doble clic** (contenido imagen) = **edición interna** (`clipGroupInnerEditId === blockId`):
    arrastrar imagen = pan (`handleImagePointerMove` + `computeClipImagePanClamp` +
    `clampClipImageOffsetPct` — no sale de la máscara); rueda = escala (0.25–4, debounce 200 ms).
    Outline discontinuo naranja. Escape sale.
  - Forma `libre` seleccionada (`shapeEditing`) = **`ClipPathNodeEditor`**: arrastrar anclas
    (azules), doble clic alterna esquina↔curva Bézier (manijas naranjas `cpIn`/`cpOut`, tipo
    `corner`/`smooth`/`symmetric`), Alt rompe simetría, Supr elimina nodo (mín. 3). Mutuamente
    excluyente con el pan de imagen.
- **Edición** (`ClipGroupBlockFields`, 750 líneas): Forma (`<Select>` 9 tipos; `defaultShape`
  conserva parámetros compatibles) · parámetros por forma (radio, lados, puntas, radio interno,
  path SVG en `<textarea>`, botones Añadir/Quitar nodo para libre) · Contenido (`<Select>`
  color/gradiente/imagen) · si imagen: URL + subir archivo + Ajuste + Escala (slider) + Offset X/Y
  (sliders −100..100, `scheduleImagePatch` con clamp) · Opacidad · Borde (color + grosor 0–12) ·
  Sombra (`<Switch>` + color + offset X/Y −24..24 + blur 0–32).
- **Fallback**: `{x:30,y:25,ancho:40,alto:50}`. **minDim** 5 %.

### 9.11 Widgets (11) — familia Genially/Captivate

Catálogo único: `widget-registry.ts` (`WIDGET_TIPOS`, `WIDGET_LABELS`). Tipos en
`widget.types.ts`. **Ninguno es evaluable** (0 coincidencias de scoring). Todos extienden
`WidgetCanvasPosition` (`x/y/ancho/alto/zIndex`); los "de lienzo" y varios "control" extienden
además `WidgetHeaderFields` (`tituloWidget`, `subtituloWidget`, `instruccion`, `estilosHeader`).

Arquitectura de carpeta por widget (variable según familia):
`*-defaults.ts` (`createDefault*Block(marco?)`) · `*-config.ts` (`normalize*Widget`, `merged*Config`) ·
`*-editor.tsx` · `*-viewer.tsx` · `*-properties.tsx` (+ `*-appearance-properties`, `*-inner-properties`) ·
`*-shared.tsx`/`*-parts.tsx` · CSS module. Todos se **hidratan** en `class-slide-normalize.ts`
(`normalizeBlock`). `remintBlockChildIds` regenera IDs de fichas/tarjetas/overlays/nodos al
duplicar/pegar.

Inserción: raíl izq "Widgets" (`DraggableWidgetItem`, clic o drag). `handleAddWidget` construye
el bloque con `dropMarco` si vino de drop y lo selecciona tras 50 ms.

| Widget | `tipo` | Estructura clave | Fallback bbox | minDim | Nota de comportamiento |
|---|---|---|---|---|---|
| **Flip Cards** | `flip-cards` | `configuracion` (columnas 2–4, colores, plantillaId, espacio, padding) + `tarjetas: FlipCard[]` (`frente`/`reverso`: `FlipCardCara` con imagen ajustable + título + cuerpo + `estiloTitulo/Cuerpo` + posiciones) | `5,5,90,90` | 5 % | Viewer: clic voltea (`aria-pressed`). Editor: clic = inner selection (tarjeta/texto/imagen). Editor monolítico ~1030 líneas |
| **Tabs** | `tabs` | `WidgetSlideContainerConfig` + `numeroFichas` (2–6) + `fichaActiva` + `fichas: WidgetSlideContent[]` (etiqueta, encabezado, subtitulo, cuerpo, imagen, `layoutId`, `bloques` de texto libres) | `5,5,90,90` | 5 % | Índice de ficha **local (React)** en editor; alumno arranca en 0. Insertar texto → a la ficha activa |
| **Carousel** | `carousel` | Igual que Tabs + `mostrarDots`, `mostrarFlechasInternas`, `transicion` (`slide`/`fade`) | `5,5,90,90` | 5 % | Embla Carousel |
| **Click to Reveal** | `click-reveal` | `ClickRevealConfiguracion` (numeroElementos, overlayActivo, efecto, backdrop, modal) + `triggers: ClickRevealTrigger[]` + `overlays: WidgetSlideContent[]` | `5,5,90,90` | 5 % | Modal **dentro del bloque** (no portal) — el widget ocupa ~90 % |
| **Timeline** | `timeline` | `TimelineConfiguracion` (variante: tarjetas/minimal/iconos/segmentada/vertical/corporate/proyecto/infografica; disposición alternado/arriba/abajo; colores línea/nodo/card) + `nodos: TimelineNodo[]` (etiqueta, tituloNodo, cuerpo, iconoLucide, numeroPaso, colorAccent) | `5,5,90,90` | 5 % | Sin `mergedTimelineConfig` — usa `normalizeTimelineWidget` + `DEFAULT_TIMELINE_CONFIG` |
| **Popup** | `popup` | `PopupConfiguracion` (triggerVisual `boton`/`icono`/`imagen`/`texto`, `triggerAnchoPx`/`triggerAltoPx`, evento `click`/`hover`/`auto`, backdrop, `modalAnchoPct`/`modalAltoPct`) + `overlay: WidgetSlideContent` | `42,40,3.75,6.667` | **2 %** | Modal por **portal** a `.canvas-slide` (`SlideCanvasRootContext`) + backdrop. Resize del trigger recalcula px |
| **Hotspot** | `hotspot` | `HotspotConfiguracion` (colorPulso, tamanoPunto, evento, `posicionBurbuja` auto/4 lados, `anchoBurbuja`) + `overlay: WidgetSlideContent` | `48,48,4,4` | **4 %** | Burbuja inline con contenido rico (`WidgetSlideContent`), `pointer-events: auto`. `use-overlay-auto-position` |
| **Tooltip** | `tooltip` | `triggerTipo` (`icono`/`texto_subrayado`/`punto`), `icono`, `textoTrigger`, `textoTooltip`, `posicion`, `colorFondo`/`colorTexto` | `48,48,4,4` | **4 %** | Burbuja `pointer-events: none`. **Texto solo desde el panel** (sin edición inline). No tiene `WidgetHeaderFields` |
| **Botón** | `boton` | `texto`, `variante` (9 Bootstrap), `outline`, `tamano` (sm/md/lg), `forma` (redondeado/pill), `accion` (`ninguna`/`url`/`siguiente`/`anterior`/`ir_a`), `url`, `slideIndex`, `deshabilitado` | `40,80,20,8` | 5 % | Acciones de navegación deshabilitadas en editor y clase en vivo (`SlideNavContext.navigate === null`); las URL siguen activas |
| **Contador / temporizador** | `contador` | `modo` (`temporizador`/`cronometro`/`numero`), `etiqueta`, `segundos`, `valorInicial`, `valorPaso`, `formato` (`mm:ss`/`hh:mm:ss`), `autoIniciar`, `mostrarControles`, `alTerminar` (`ninguna`/`siguiente`), colores | `36,6,28,16` | 5 % | Independiente del timer de slide. "Al terminar → siguiente" no avanza en editor/clase |
| **Barra de progreso** | `progreso` | `modo` (`manual`/`slides`), `porcentaje` (0–100 manual), `etiqueta`, `mostrarPorcentaje`, `striped`, `animated`, colores | `10,4,80,5` | **2 %** | Modo `slides` usa `slideIndex`/`slideCount` de `SlideNavContext` |

### 9.12 `actividad` (`ActivityBlock`) — 25 tipos evaluables

- **Datos**: `{tipo:'actividad', actividad: Activity, marco?: {izquierdaPct, arribaPct, anchoPct,
  altoPct}}`. Posición **solo** vía `marco` (nunca `x/y/ancho/alto` sueltos). Sin `marco` → ocupa
  la celda del `Layout`.
- **Inserción**: raíl der "Actividades interactivas" (`ActivitiesPanel`, `DraggableActivityItem`)
  o "Actividades con IA" o drop al lienzo. `handleAddActivity` usa 24 plantillas
  (`quizMultipleTemplate`, `createDefaultMemoria`, …). **Un slide de actividad solo contiene esa
  actividad** (`sanitizeSlideContentForPersistence` descarta el resto y fuerza `layout:
  'titulo_centrado'`). Solo se admite añadir **texto** junto a ella.
- **Render**: `RenderActivity` — `switch(act.tipo)` de ~25 ramas: modo `editor` →
  `{X}Editor`; modo `viewer` → `{X}Viewer`. `stripMarcoFromActivityBlock` quita `marco` antes de
  pasar al renderer de actividad (la posición la maneja `BlockNode`).
- **Edición**: el `PropertiesPanel` derecho enruta a `{X}Properties` para 15 actividades de
  "Grupo 4" + emparejar + historia_ramificada; para el resto muestra "Las actividades se
  configuran en el panel lateral derecho" (se editan **en el propio editor embebido en el lienzo**,
  no en el panel). `applyNow` → `updateBlockAtPath` con `{...b, actividad: updated}`.
- **Familias** (panel `ActivitiesPanel`):
  - **Evaluación**: `quiz-multiple`, `true-false`, `fill-blank`, `short-answer`.
  - **Interacción**: `drag-drop`, `match` (emparejar), `sort-steps` (ordenar), `video-interactive`.
  - **En vivo** (Socket.IO): `live-poll` (encuesta), `word-cloud` (nube), `torneo` (Kahoot),
    `escape_room` (equipos), `historia_ramificada` (react-flow en el editor: `editorX/editorY`).
  - **Grupo 4 "Wordwall"** (12): `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`,
    `crucigrama`, `abrir_caja`, `anagrama`, `ahorcado`, `puzzle_palabras`, `globos`, `topo`, `ruleta`.
- **Scoring**: `notaColombiana(correctas, total, respondio)` → 1.0–5.0 (`ratio × 5`, mínimo 1.0).
  Categorías `ACTIVITY_SCORING`: `binary`/`partial`/`manual`/`participation`/`exclude`.
  `ruleta`, `torneo`, `escape_room` son **`exclude`** (no dan nota académica). `orden_rango` fue
  eliminada; `evaluateOrdenRango` es código muerto.
- **Escape Room dentro del canvas**: en viewer, `renderSalaCanvas(sala)` instancia **otro
  `SlideRenderer` anidado** (`modo="viewer"`, `bloques: bloquesVisiblesDeSala(sala)`,
  `fondo: sala.fondo ?? {#1e1b4b}`). Cierre → `{tipo:'escape_room:finished', puntos, timeMs}` por
  canal propio (nunca `activity:complete`).
- **Fallback** (sin `marco`): `{x:5,y:5,ancho:90,alto:90}`. **minDim** 5 %.

### 9.13 Stub `interactivo` — deuda eliminada

`isUnimplementedInteractiveStub(block)` (`block.tipo === 'interactivo'`). `withoutInteractiveStubs`
los filtra en cada normalización/persistencia (cubrían el 90 % del lienzo y robaban clics a
widgets reales). No se renderizan ni se persisten.

---

## 10. Raíl derecho (`RightRail`) + `RightFlyoutPanel`

`RightRail` (w-16): `ia`, `activities`, `themes`, `live`. `RightFlyoutPanel` (w-64, w-72 para
temas): cabecera con label + X.

### 10.1 **Actividades con IA** (`ActivitiesAiPanel`)

Dos acordeones: **"Añadir pregunta con IA"** (tema + tipo MultipleChoice/TrueFalse/FillInTheBlanks
→ `useGenerateQuiz({count:1})` → `buildQuizMultipleActivity`/`buildTrueFalseActivity` →
`onInsertActivity`) y **"Generar actividad con IA"** (`{count:5}` MultipleChoice →
`buildQuizMultipleActivity`). El `desempenoEnunciado` se muestra como contexto y prellena el campo.

### 10.2 **Actividades interactivas** (`ActivitiesPanel`)

4 grupos (`EVALUATION`, `INTERACTION`, `LIVE`, `GRUPO4`). Banner ámbar si `hasActivity`
("Elimínala para agregar otra"), todas deshabilitadas en ese caso. Cada ítem es
`DraggableActivityItem` (`data.source='activity-panel'`).

### 10.3 **Temas de diapositivas** (`SlideThemesPanel`)

`slide-themes.ts`: `NO_SLIDE_THEME` + 6 predefinidos (`lumina`, `oscuro`, `pizarron`,
`minimalista`, `escolar`, `oceano` — cada uno con `fondo`, `fuente`, `colores {texto,
textoSecundario, acento, fondo}`). Miniatura 120×68 con nombre + franja de `acento`. Aplicar
tema → `buildSlideContentWithTheme` (solo toca `fondo` + `temaId`, **no** los bloques). Alcance:
"slide actual" o "todos los slides" (itera y cuenta éxitos). Modo `edit-custom`: crear/editar
temas personalizados (`createEmptyCustomTheme`, `FontFamilySelect`) → `onSaveCustomThemes` →
`persistCustomThemesLocally` + `updateClass({desempeno})`.

### 10.4 **En vivo** (contextual según `activeActivity.tipo`)

- `torneo` + socket + classId → **`TorneoPanel`** (`sessionId ?? classId`).
- `escape_room` + socket + classId + slideId → **`EscapeRoomLiveDashboard`** (`escape-room/`).
- resto → **Ranking XP** (`GamificationLeaderboard` si gamificación activa) + **`LiveResponsesPanel`**.

`LiveResponsesPanel`: banner "N estudiantes respondieron"; en modo autónomo, "Progreso" con nº
de alumnos por slide. Por respuesta: avatar de color derivado del `studentId` + iniciales,
respuesta mostrada según tipo (`short_answer` → texto en cursiva; `nube_palabras` → chips;
`encuesta_viva` → "Votó: X" + resumen con barras de %), icono correcto/incorrecto/—, y
`details[]` expandibles (árbol `├`/`└` para `video_interactivo` que emite uno por pregunta).
`encuesta_viva`/`nube_palabras` son `NON_EVALUABLE` (muestran "Respondió"). Mientras este panel
está abierto, `CanvasArea` **oculta el `PropertiesPanel`** (`livePanelOpen`).

---

## 11. Panel de propiedades (`PropertiesPanel`, 1 674 líneas)

`aside` de ancho variable (w-64 / w-72 texto) a la derecha de `CanvasArea`, colapsable
(`max-w-72 ↔ max-w-0` con opacidad y `translate-x`). Oculto si `livePanelOpen`.

### 11.1 Mecánica de escritura

- `applyNow(fn)` — `updateBlockAtPath(bloques, path, fn)` → `onApplyBloques(next)` (PATCH +
  historial) inmediato. `pathRef` sigue a `selectedBlockId`.
- `scheduleApply(fn)` — mismo pero con **debounce 500 ms** (`DEBOUNCE_MS`). Se usa para sliders
  y campos de texto de alta frecuencia. `clearDebounce` en cambio de bloque y al desmontar.
- `applyAnimaciones` / `applyTransicion` — `applyNow(b => ({...b, animaciones}))` /
  `onApplySlide({transicion})`.

### 11.2 Enrutado por tipo

| Selección | Panel |
|---|---|
| **>1 bloque** | "N bloques seleccionados" + botones Fijar / Desbloquear (itera `selectedBlockIds`, respeta `isBlockCanvasPositionable`) |
| ninguna / bloque nulo | "Selecciona un elemento" |
| `actividad` (`emparejar`, `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`, `crucigrama`, `abrir_caja`, `anagrama`, `ahorcado`, `puzzle_palabras`, `globos`, `topo`, `ruleta`, `historia_ramificada`) | `{X}Properties` en `<aside>` propio con scroll |
| `actividad` (resto) | "Las actividades se configuran en el panel lateral derecho" |
| `flip-cards` / `tabs` / `carousel` / `timeline` / `hotspot` / `popup` / `click-reveal` | `WidgetPropertiesPanelShell` con `{X}WidgetComponentes` + secciones según `innerSelection` (texto/imagen/ficha/nodo/overlay/trigger) + `{X}AppearanceProperties` + `AnimationPanel`. El **título del panel** cambia ("Texto"/"Imagen"/"Ficha"/"Nodo"/"Contenido Popup"…) según la selección interna |
| `tooltip` / `boton` / `contador` / `progreso` | `{X}Properties` + `AnimationPanel` (sin inner selection) |
| `texto` / `imagen` / `forma` / `clip-group` / `video` | `<aside>` w-72 con **pestañas "Propiedades" / "Animaciones"**; Propiedades → `TextBlockFields` / `ImageBlockFields` / `FormaBlockFields` / `ClipGroupBlockFields` / `VideoBlockFields` |
| otro tipo | "Este tipo de bloque no tiene propiedades aquí" (audio/codigo/cita/separador/columnas) |

### 11.3 Selección interna de widgets

Los `*InnerSelection` (`FlipCardsInnerSelection`, `TabsInnerSelection`, …) viven en `CanvasArea`
y se pasan al `PropertiesPanel` **y** al `SlideRenderer`. Se limpian todos en el mismo
`useEffect([selectedBlockId])` de `CanvasArea` y al hacer clic en otro bloque. Tipos como
`{kind:'header-text', field}`, `{kind:'slide-text', slideId, field}`, `{kind:'overlay-image'}`,
`{kind:'card', ...}`, `{kind:'texto'|'imagen', ...}` (Timeline). El panel usa helpers
(`getTabsPanelSlideId`, `getTimelinePanelNodoIndex`, `isEditingHotspotOverlay`, …) para saber
qué sub-panel mostrar.

---

## 12. Inspector tipográfico (`TypographyInspector`)

Único componente de tipografía del panel derecho (lo usan `TextBlockFields` y
`WidgetTypographyFields`). Secciones colapsables (`InspectorSection`):

- **Estilo**: presets (`TYPOGRAPHY_PRESETS`) en grid 3 columnas; `matchTypographyPreset` marca el
  activo; `applyTypographyPreset` + ajuste de `nivel` (`titulo` → H1).
- **Nivel** (solo si `onHeadingLevelChange`): grid P/H1..H6.
- **Tipografía**: `FontFamilySelect` (catálogo de 40 fuentes + Google Fonts) · Tamaño
  (`<Input number>` clampeado a `sizeMin`–`sizeMax`) · Negrita/Cursiva/Subrayado (`<Toggle>`) ·
  Interlineado (`<Slider>` 100–200 % → `lineHeight` 1.0–2.0) · Espaciado letras (`<Slider>`
  −1..8 px) · Alineación (4 `<Toggle>`) · Mayúsculas (`Aa`/`AA`/`Tt` → `none`/`uppercase`/`capitalize`).
- **Color**: `<input type=color>`.
- **Efectos** (cerrada por defecto): Opacidad (15–100 %) · Sombra (0–8 px) · **Fondo** (`<Switch>`
  → `backgroundColor: #FEF3C7`, `backgroundRadius: 6`) + color + radio (0–24) · **Lista**
  (`enableList`: Texto/Viñetas/Números — cada `\n` → ítem).

`textBlockPatchFromTypography` traduce el patch a campos del `TextBlock`;
`isTypographySizeOnlyPatch` decide si va por `scheduleApply` o `applyNow`.

---

## 13. Animaciones y transiciones

- **`Animacion`** (`animation.types.ts`): `tipo` (18: fade-in/out, slide-*, zoom-*, bounce, spin,
  shake, pulse, flip-x/y, wipe-*), `momento` (`entrada`/`salida`/`enfasis`), `trigger`
  (`auto`/`click`/`hover`), `duracion` (ms, def. 400), `delay`, `iteraciones` (−1 = infinito),
  `easing`. Se guardan en `block.animaciones[]`.
- **`useBlockAnimations(ref, animaciones, isActive)`** — aplica clases `lumina-anim-<tipo>` +
  estilos inline de `animation-*`. `auto` se dispara cuando `isActive` pasa a true (viewer);
  `click`/`hover` con listeners. Múltiples animaciones del mismo `momento` se **encadenan**
  (offset acumulado = suma de duraciones previas). Limpieza tras `duracion × iteraciones + 50 ms`
  (salvo énfasis infinito).
- **`AnimationPanel`** = `AnimationList` (`animation-item`/`animation-picker`) +
  `TransitionPanel`. En el panel derecho aparece como pestaña ("Animaciones") para bloques
  básicos y como bloque final para widgets.
- **`TransicionSlide`**: `tipo` (`none`/`fade`/`slide-*`/`zoom`/`flip`/`cube`), `duracion` (def.
  500). Se guarda en `slide.transicion` (persiste en `content.transicion`); el cambio pasa por
  `handleApplySlide` → historial (`isUndoRedoRef` evita re-registro).

---

## 14. Capas, alineación e indicadores de espaciado

### 14.1 `LayersPanel` (`w-56`, `layersPanelOpen`)

`buildLayerList(bloques)` → items ordenados por `zIndex` desc (frente arriba). Cada fila:
icono + etiqueta legible (`getBlockLayerLabel`: texto → primeras palabras; imagen → alt/caption;
actividad → pregunta o nombre; widget → `tituloWidget`…) + `kind` + `· zN` si `zIndex !== 0` +
candado si `locked`. Botones (aparecen en hover / selección): Traer al frente (`ChevronsUp`),
Subir un nivel (`ArrowUp`), Bajar un nivel (`ArrowDown`), Enviar atrás (`ChevronsDown`) →
`onLayerReorder(blockId, action)` → `applyLayerReorderAction` (`traer_frente` = `max+1`,
`enviar_atras_total` = `min-1`, `adelante_uno` = `z+1`, `atras_uno` = `z-1`). Bloqueados no se
reordenan.

### 14.2 `AlignmentToolbar`

Solo con ≥2 bloques **desbloqueados**. Calcula bbox de la selección (`minX/maxX/minY/maxY`).
Acciones: `align_left/center_h/right`, `align_top/center_v/bottom` (mín. 2),
`distribute_h/distribute_v` (mín. 3 — ordena por centro, reparte con `step` uniforme). Cada
bloque pasa por `withClampedPosition` / `withClampedPositionChecked`; si la distribución fue
recortada por el borde → `toast.warning("el espaciado puede variar")`. `onApplyBloques(next)`.

### 14.3 `SpacingIndicators`

Líneas discontinuas con la distancia en px (`canvasWidth=1280`, `canvasHeight=720`):
- **Bordes del lienzo** (`#2563EB`): a top/bottom/left/right si la distancia `< SPACING_EDGE_MAX_PX` (80).
- **Vecino más cercano** en cada dirección (`< SPACING_NEIGHBOR_MAX_PX` = 200), si solapa en el
  eje perpendicular.
- **Espaciado igual** (`#10B981` verde): detección de 3+ bloques alineados con huecos iguales
  (`SPACING_EQUAL_TOLERANCE_PX` = 4). Los vecinos ya dibujados en verde no se re-dibujan en azul.

---

## 15. Interacción del lienzo (resumen; detalle en `PERITAJE_LUMINA_CANVAS.md`)

- **Sistema virtual**: 1280×720; posiciones en **% del lienzo**. `getBlockPos` = fuente única de
  verdad (`use-block-drag.ts`). Regla de oro: `leer → transformar → clamp (clampDragCorner) →
  persistir → historial`.
- **Drag** (`useBlockDrag` + `EditorDndShell`): solo el badge `GripHorizontal` es interactivo.
  `liveBloques → committedBloques → servidor`. Grupo: `groupOrigins` + clamp por miembro.
  Miniatura lateral con debounce ~150 ms.
- **Snap** (`snapPositionToGuides`, umbral **8 px**): canvas (0/50/100, naranja) · pares (bordes
  + centro, naranja) · huecos iguales (`canvas-spacing.ts`, verde) · grilla (`canvas-grid.ts`,
  gris) · guías manuales (naranja). Empate: guía > hueco > par > canvas. **Alt** suprime el imán.
- **Resize** (`ResizeHandles` + `resize-coords.ts`): 8 manijas 10×10 px. `computeNewCoords` →
  aspect-ratio en esquinas (Shift o `lockAspectRatio`) → `applyMinDimClamp` (solo si el usuario
  cambió esa dimensión) → `clampDragCorner` → `preserveEdgeAfterClamp` (fija el borde opuesto) →
  re-clamp. `getBlockResizeMinDim`: hotspot/tooltip 4 %, popup/progreso 2 %, resto 5 %.
- **Nudge**: flechas ±1 px, Shift ±10 px (`applyNudgeToBlocks`, ignora bloqueados).
- **Guías manuales** (`CanvasGuidesChrome`): reglas de 16 px con marcas cada 100 px. Arrastrar
  desde regla crea guía; arrastrar guía la mueve (soltar fuera la borra); doble clic la borra.
  Esquina de reglas = guías centrales (640/360). Persisten en `slide.guias.{horizontales,verticales}`.
- **Grilla**: `slide.guias.grilla {activa, tamanoPx}`, presets `[8,16,20,32,40,64,80]` (def. 40).
  Overlay `linear-gradient`. `snapAxisToGridPercent`.
- **Zoom** (`canvas-zoom.ts`): 50–200 %, paso 10 %, `localStorage` (`lumina-editor-canvas-zoom`),
  Ctrl+rueda. `scale()` en el wrapper del viewport.

---

## 16. Historial de edición (undo/redo local, `canvas-history.ts`)

- **Pila por `slideId`** en `Map` en memoria de `CanvasArea` (`historiesRef`). **No** se limpia
  al cambiar de slide; se pierde al desmontar el editor. No se persiste en servidor.
- `MAX_UNDO = 20`; índice 0 siempre `kind: 'inicio'` al truncar.
- Snapshot = `{kind, at, bloques, fondo?, guias, transicion?}` (clon con `structuredClone`).
  `kind ∈ inicio | edicion | fondo | guias | pegar | eliminar`.
- Registro: cada operación deshacible → `persistBloques(next, prev, true, kind)` → PATCH OK →
  `recordAfterSuccess` → `pushHistoryEntry` (descarta rama de redo, recorta a `MAX_UNDO`).
- Restauración: `restoreSnapshot` pone `isUndoRedoRef = true`, PATCH con
  `buildContentFromSnapshot` (incluye transición), fija el Map, refetch.
- `CanvasAreaHandle.resetSlideHistory()` — tras **restaurar una versión del servidor**.
- Dropdown "Historial de edición" en la toolbar (`historyItems` con `formatHistoryWhen`).

---

## 17. Persistencia

### 17.1 Autosave (`useAutosave`)

`useAutosave(activeSlide.content, autosaveSaveFn, 2000, {enabled: !sessionActive && !!activeSlide,
isSavePending: updateSlide.isPending, resetKey: '${slideId}:${contentSaveEpoch}'})`. Debounce 2 s
sobre `stableSerialize(content)`; al vencer, si sigue distinto de `lastSavedRef` → `saveFn` →
`updateSlide.mutate` (con `sanitizeSlideContentForPersistence`). `resetKey` reinicia la línea
base al cambiar de slide o tras aplicar tema. Expone `isDirty`/`isSaving` para la topbar.
**Deshabilitado durante sesión en vivo.**

### 17.2 PATCH y sanitización

Todo commit pasa por `sanitizeSlideContentForPersistence(content)`: quita stubs `interactivo`,
re-hidrata widgets (mismos `normalize*`), y **si hay actividad de primer nivel** → descarta el
resto de bloques y fuerza `layout: 'titulo_centrado'` + `diseno`. Tras éxito:
`queryClient.refetchQueries(['classes','detail',classId])`.

### 17.3 Versiones de servidor (`SlideVersion`)

`Ctrl+S` / botón "Guardar" → `handleSave` → `updateSlide.mutate` y, si no hay sesión,
`createSlideVersion.mutate({content})`. **Sheet "Historial de versiones"**: lista
(`useSlideVersions`) con fecha (`d MMM yyyy · HH:mm`, locale `es`) y nº de bloques; "Restaurar"
→ diálogo de confirmación → `restoreSlideVersion.mutate(id)` → toast + `resetSlideHistory()`.
Es un sistema **distinto** del undo local.

### 17.4 Temas

`persistThemeOnSlide` (PATCH por slide con `buildSlideContentWithTheme`) + `patchSlidesThemeInCache`
(optimista sobre `setQueryData`) + `setContentSaveEpoch(n=>n+1)` (reinicia autosave) + refetch.
"A todos" itera secuencialmente y avisa si `applied < total`.

### 17.5 Respuestas en vivo

`liveResponses: Map<slideId, {activityType, responses: StudentResponse[]}>` se persiste en
`sessionStorage` (`lumina-live-responses-${classId}`) en cada cambio → sobrevive a recarga dura.
`response-update` (Socket.IO) acumula `details[]` por estudiante (`video_interactivo` emite uno
por pregunta) y arrays para `nube_palabras`.

---

## 18. Sesiones en vivo desde el editor (Socket.IO)

`editor-client` abre **dos** conexiones:

1. **Socket por defecto** (`io(API_URL)`): `join-class {classId}` al conectar. Escucha
   `students-connected`/`room-students-count` (→ `roomStudentCount`), `response-update`
   (→ `liveResponses`), `student-progress` (→ `autonomousStudentSlide` en modo autónomo).
   Emite `slide-change`, `timer-start`, `lock-responses`/`unlock-responses`.
2. **Socket `/live`** (`io(API_URL/live, {auth:{token}})`): `join {classId}`. Lo usan
   `TorneoPanel` y `EscapeRoomLiveDashboard` (staff).

- **Timer**: `useSlideTimer` con `getEffectiveTimerForApiSlide(slide, cls.timerGlobal)`
  (per-slide `content.timer` gana sobre global). Al expirar (`handleEditorTimerExpireRef`):
  emite `lock-responses`, `setResponsesLocked(true)`, y tras 2 s avanza al siguiente slide.
  `SlideCountdownOverlay` muestra la cuenta atrás sobre el lienzo.
- **Al cambiar de slide**: si el modo es `clase`, emite `slide-change` y (si hay sesión y timer)
  `timer-start`; desbloquea respuestas del slide anterior si seguían bloqueadas.
- **Gamificación**: `useGamification({socket, sessionId, classId, isViewer:false})` →
  `leaderboard`, `iniciarGamificacion`, `toggleLeaderboardVisible`.
- **Fin de sesión** (`handleEndSession`): recorre `liveResponses`, evalúa cada respuesta con
  `evaluateActivityResponse(activityType, activityDef, rawResponse)` (`extractActivityDefinition`
  del `content`), construye `resultados[]` (`{studentId, slideId, activityType, correct, score,
  maxScore:5, historial, response}`) y hace `PATCH /classes/:id/sessions/end {sessionId, resultados}`.

---

## 19. Deuda técnica y hallazgos

| # | Área | Observación | Riesgo |
|---|---|---|---|
| 1 | `slide-renderer.tsx` (2 668 líneas) | `RenderActivity` importa **estáticamente** los ~25 editores + viewers de actividad y los 11 widgets. El bundle del editor carga todo aunque el slide no use ninguna actividad. Sin `dynamic()`/lazy | Medio (rendimiento de carga) |
| 2 | Identidad de bloque = índice del array | `data-block-id` = `"2"` / `"5-0-1"`. Reordenar por z-index no altera el array, pero cualquier operación que sí lo haga invalida rutas guardadas en `setTimeout(() => querySelector(...))`. Undo/redo y selección dependen de que el índice sobreviva al refetch | Medio |
| 3 | Carrera inline-vs-panel | Popup, Hotspot, Click to Reveal y widgets "de lienzo" con `contentEditable` compiten con el panel derecho como fuente de escritura (deuda aceptada; Tooltip la evita con "solo panel") | Medio |
| 4 | `sanitizeSlideContentForPersistence` destructivo | Si un slide tiene actividad de primer nivel **y** otros bloques, el PATCH descarta los otros silenciosamente (correcto por diseño, sin aviso) | Bajo |
| 5 | Historial en memoria | Undo/redo se pierde al recargar o salir del editor; solo las `SlideVersion` sobreviven. Intencional pero puede sorprender | Bajo (UX) |
| 6 | Doble sistema de autosave + versiones | Autosave (2 s, PATCH) y versiones (Ctrl+S, `SlideVersion`) coexisten; `contentSaveEpoch` es un parche para reiniciar autosave tras aplicar tema | Bajo |
| 7 | Medios como data URL | Imágenes/vídeos/audio locales se embeben en el JSON del slide (sin subida a servidor). Slides con muchos medios locales generan `content` pesados | Bajo–Medio |
| 8 | `escape_room` anida `SlideRenderer` | Un `SlideRenderer` viewer por sala dentro del viewer de la actividad; `bloquesVisiblesDeSala` acota pero cada sala monta su árbol | Bajo |
| 9 | `canvas-editor.tsx` (635 líneas, Fabric.js) | Deprecado, sigue en el repo y en el tipo `Slide` (`content: CanvasContent`) | Bajo |
| 10 | `FloatingToolbar` export | Componente completo no usado (la barra real es `BlockActionToolbarPortal`) | Nulo |
| 11 | `evaluateOrdenRango` | Código muerto en `activity-scoring.ts` (FE y BE) + entrada en `ACTIVITY_SCORING` | Nulo |
| 12 | Espejo manual de scoring | `activity-scoring.ts` duplicado FE/BE (~1 000 líneas), sincronizado por `check-fixtures-sync.mjs`; TODO paquete `@lumina/scoring` | Bajo (mitigado por tests de contrato) |
| 13 | `liveResponses` en `sessionStorage` | Clave por `classId`; si el docente abre dos pestañas de la misma clase pueden divergir | Bajo |

---

## 20. Mapa rápido de archivos del editor

```
ORQUESTACIÓN
  editor-client.tsx (2993) ............. estado, sockets, sesión, timers, autosave, versiones,
                                        atajos, handlers de slide/actividad/widget/tema, render
COMPONENTES
  components/canvas-area.tsx (1897) .... lienzo + historial + drag + persist* + CanvasAreaHandle
  components/slide-renderer.tsx (2668) . SlideRenderer, BlockNode, Render{Text,Image,…}, RenderActivity,
                                        RenderColumns, InlineTextEditor, BlockActionToolbarPortal
  components/floating-toolbar.tsx (1051) SlideInsertionToolbar, SlideEditorChrome, FloatingToolbar(legado)
  components/slides-panel.tsx (816) .... miniaturas + reordenar + menú contextual + SlideCanvasThumb
  components/render-clip-group.tsx (410) máscaras: pan/escala imagen, borde, sombra
  components/clip-path-node-editor.tsx . edición Bézier de forma libre
  components/canvas-guides.tsx (543) ... reglas + guías manuales (UI)
  components/editor-dnd-shell.tsx ...... DndContext único (bloques + drops de panel)
  components/droppable-canvas.tsx ...... zona de drop
  components/resize-handles.tsx ........ 8 manijas
  components/icon-rail.tsx / right-rail.tsx ... raíles de 6 / 4 botones
  components/flyout-panel.tsx / right-flyout-panel.tsx ... contenedores de flyout
PANELES
  components/panels/flyout-left-panels.tsx (1403) ... Elementos / Widgets / Layout / Fondo / IA / Páginas
  components/panels/properties-panel.tsx (1674) ..... routing de propiedades por tipo + sub-paneles
  components/panels/clip-group-properties.tsx (750) . propiedades de máscara
  components/panels/activities-panel.tsx ............ catálogo de 24 actividades
  components/panels/activities-ai-panel.tsx ......... generar pregunta/actividad con IA
  components/panels/widgets-insert-panel.tsx ........ catálogo de 11 widgets
  components/panels/widget-panel-catalog.ts ......... grupos lienzo/overlay/control + colores
  components/panels/themes-panel.tsx ............... temas predefinidos + personalizados
  components/panels/live-responses-panel.tsx ....... respuestas en vivo + progreso autónomo
  components/panels/images-element-panel.tsx / shapes-panel.tsx / clip-masks-panel.tsx
  components/layout-panel.tsx / layout-thumbnails.tsx / templates-panel.tsx ... layouts
  components/draggable-activity-item.tsx / draggable-widget-item.tsx ... items arrastrables
LIB / HOOKS
  hooks/use-block-drag.ts .............. getBlockPos, withPosition/withRect, clampDragCorner,
                                        snapPositionToGuides, applyLiveDragPositions, useBlockDrag
  hooks/use-autosave.ts ............... debounce 2 s, isDirty/isSaving
  hooks/use-block-animations.ts ....... aplica animaciones CSS encadenadas
  components/editor/lib/canvas-history.ts ... MAX_UNDO=20, snapshot, push/undo/redo/jump
  components/editor/lib/resize-coords.ts ... computeNewCoords, preserveEdgeAfterClamp
  components/editor/lib/block-resize-min-dim.ts / activity-canvas-position.ts / block-drag-id.ts
  lib/class-slide-normalize.ts ......... classSlideToRendererSlide, normalizeBlock,
                                        sanitizeSlideContentForPersistence, get/update/removeBlockAtPath
  lib/canvas-guides.ts / canvas-grid.ts / canvas-spacing.ts / canvas-layers.ts / canvas-zoom.ts
  lib/slide-themes.ts ................. NO_SLIDE_THEME + 6 predefinidos + buildSlideContentWithTheme
  lib/typography.ts .................. typographyFromTextBlock/Widget, textBlockPatchFromTypography
  components/editor/typography-inspector.tsx ... inspector tipográfico único
  components/editor/google-fonts-loader.tsx .... ensureGoogleFonts incremental
  components/animations/animation-panel.tsx .... AnimationList + TransitionPanel
  types/slide.types.ts / widget.types.ts / animation.types.ts ... esquema completo
REGLAS
  lumina-frontend/.cursorrules  ·  .cursor/rules/lumina-canvas-editor-contracts.mdc
  lumina-frontend/CLAUDE.md (familias de widgets, SlideNavContext)
```

---

## 21. Verificación (tests del editor)

```powershell
cd lumina-frontend
pnpm exec vitest run "src/app/(app)/classes/[id]/editor/lib/canvas-history.spec.ts" "src/hooks/use-block-drag.spec.ts" "src/lib/canvas-grid.spec.ts" "src/lib/canvas-zoom.spec.ts" "src/lib/canvas-layers.spec.ts" "src/lib/canvas-spacing.spec.ts" "src/lib/canvas-guides.spec.ts" "src/app/(app)/classes/[id]/editor/lib/resize-coords.spec.ts" "src/app/(app)/classes/[id]/editor/lib/block-drag-id.spec.ts" "src/app/(app)/classes/[id]/editor/lib/activity-canvas-position.spec.ts" "src/lib/class-slide-normalize.widgets.spec.ts" "src/app/(app)/classes/[id]/editor/components/panels/widget-panel-catalog.spec.ts"
```
