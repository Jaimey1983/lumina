# DIAGNÓSTICO — Grupo 9 (Widgets estilo Genially)

> Generado: 05/07/2026  
> Base de contexto: `LUMINA_CONTEXT_V38.md`  
> Alcance: solo lectura del código — sin implementación.

---

## Resumen ejecutivo

**Click to Reveal** es la referencia más reutilizable del Grupo 9: widget completo con tipos en `widget.types.ts`, defaults, editor/viewer, panel de propiedades, overlay modal con backdrop, y estado de apertura **local en React** (no persistido). El patrón de `ClickRevealModalPanel` + `WidgetSlideContent` puede servir de base para Popups, Hotspots con contenido emergente y Zoom de imagen.

Las **5 entradas del panel “Interacción”** (Botón, Hotspot, Tooltip, Contador, Barra de progreso) tienen **onClick conectado** y **persisten un bloque stub** `{ tipo: 'interactivo', subtipo: '…' }` en el JSON del slide, pero muestran toast “Próximamente”, **no existen tipos TypeScript**, **no hay componentes de renderizado** y el canvas queda vacío. Clasificación: **(b) lógica parcial** — inserción + persistencia, sin UX funcional.

El **modelo de datos actual soporta los 7 widgets de Grupo 9 sin migración Prisma**: todo vive en `Slide.content` como JSON (`bloques[]`). Habrá que extender la unión `Block` en frontend, `widget-registry`, `slide-renderer`, `properties-panel` y posiblemente `class-slide-normalize.ts` para normalización legacy — no el schema de PostgreSQL.

El sistema de **triggers de animación (auto/click/hover)** aplica CSS al **contenedor externo del bloque**; **no** abre overlays ni modales. Popups, tooltips e hotspots necesitarán **estado de overlay propio** (como Click to Reveal), reutilizable parcialmente en triggers visuales del disparador pero no como sustituto del modal.

---

## 1. Base reutilizable: Click to Reveal (Grupo 2)

### 1.1 Dónde vive el tipo (frontend / backend)

| Capa | Ubicación | Detalle |
|------|-----------|---------|
| **Frontend — tipo widget** | `lumina-frontend/src/types/widget.types.ts` | `ClickRevealWidget`, `ClickRevealTrigger`, `ClickRevealConfiguracion`, `ClickRevealInnerSelection` |
| **Frontend — unión Block** | `lumina-frontend/src/types/slide.types.ts` | `Block` incluye `ClickRevealWidget` + campo común `animaciones?` |
| **Frontend — registro** | `lumina-frontend/src/components/widgets/shared/widget-registry.ts` | `'click-reveal'` en `WIDGET_TIPOS` |
| **Backend / Prisma** | `lumina-backend/prisma/schema.prisma` → `Slide.content Json?` | **No hay modelo ni enum** para `click-reveal`. Es JSON opaco. |

```337:342:lumina-frontend/src/types/widget.types.ts
export interface ClickRevealWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'click-reveal';
  configuracion: ClickRevealConfiguracion;
  triggers: ClickRevealTrigger[];
  overlays: WidgetSlideContent[];
}
```

```844:862:lumina-frontend/src/types/slide.types.ts
export type Block = (
  | TextBlock
  | ImageBlock
  // …
  | ClickRevealWidget
  | TimelineWidget
) & {
  animaciones?: import('@/types/animation.types').Animacion[];
};
```

### 1.2 Estado “revelado / no revelado”

| Contexto | Dónde | Qué se persiste |
|----------|-------|-----------------|
| **Viewer / preview / autónomo** | `click-reveal-viewer.tsx` → `useState<number \| null>(openIndex)` | **Nada** — solo memoria de sesión |
| **Editor** | `click-reveal-editor.tsx` → `configuracion.overlayActivo` (índice del overlay en edición) | **Sí** — índice de edición, no “abierto en reproducción” |
| **Store del editor** | No hay store global | Estado en componente + selección interna en `canvas-area.tsx` (`clickRevealInnerSelection`) |

```29:35:lumina-frontend/src/components/widgets/click-reveal/click-reveal-viewer.tsx
export function ClickRevealViewer({ block, isThumbnail = false }: ClickRevealViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const widget = normalizeClickRevealWidget(block);
  const configuracion = mergedClickRevealConfig(block);
  const triggers = widget.triggers.slice(0, configuracion.numeroElementos);
  const overlays = widget.overlays.slice(0, configuracion.numeroElementos);
  const activeOverlay = openIndex !== null ? overlays[openIndex] : null;
```

### 1.3 Renderizado: editor vs viewer vs autónomo

Todos los modos pasan por **`SlideRenderer`** (`slide-renderer.tsx`):

| Modo | `modo` prop | Componente Click to Reveal |
|------|-------------|----------------------------|
| **Editor** | `'editor'` | `ClickRevealEditor` |
| **Preview docente** | `'preview'` → normalizado a viewer para actividades | `ClickRevealViewer` |
| **Viewer en vivo** | `'viewer'` | `ClickRevealViewer` |
| **Autónomo** | `'viewer'` en `autonomo-client.tsx` | `ClickRevealViewer` (misma lógica que estudiante) |

```1801:1816:lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx
      case 'click-reveal':
        return editorMode ? (
          <ClickRevealEditor
            block={block}
            onChange={(updated) => onClickRevealChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? clickRevealInnerSelection ?? null : null
            }
            onInnerSelectionChange={
              selectedId === blockId ? onClickRevealInnerSelectionChange : undefined
            }
          />
        ) : (
          <ClickRevealViewer block={block} isThumbnail={isThumbnail} />
        );
```

**Inserción en editor:** panel derecho “Widgets” (`activities-panel.tsx`) → `handleAddWidget('click-reveal')` en `editor-client.tsx` → `createDefaultClickRevealBlock()`.

### 1.4 Props / configuración disponibles para el docente

**Estructura del bloque guardado** (dentro de `content.bloques[]`):

```json
{
  "tipo": "click-reveal",
  "x": 5, "y": 5, "ancho": 90, "alto": 90, "zIndex": 1,
  "tituloWidget": "…",
  "subtituloWidget": "…",
  "instruccion": "…",
  "configuracion": {
    "numeroElementos": 4,
    "overlayActivo": 0,
    "efectoApertura": "fade | instant | slide-up",
    "layoutId": "imagen-izq-texto-der | …",
    "colorBackdrop": "#1E293B",
    "opacidadBackdrop": 45,
    "colorFondoModal": "#FFFFFF",
    "mostrarBotonCerrar": true,
    "defaultsTrigger": { "mostrarImagen", "mostrarEtiqueta", "mostrarTitulo" },
    "defaultsOverlay": { "mostrarEtiqueta", "mostrarImagen", "mostrarEncabezado", … }
  },
  "triggers": [{ "id", "etiqueta", "titulo", "colorFondo", "imagen", … }],
  "overlays": [{ "id", "etiqueta", "encabezado", "subtitulo", "cuerpo", "imagen", "layoutId", … }]
}
```

**Paneles de edición:** `click-reveal-properties.tsx`, `click-reveal-appearance-properties.tsx`, `click-reveal-inner-properties.tsx` (integrados en `properties-panel.tsx`).

**Defaults:** `lumina-frontend/src/lib/click-reveal-defaults.ts` + `click-reveal-config.ts` (`normalizeClickRevealWidget`, migración legacy `base`/`overlay` → `triggers`/`overlays`).

### 1.5 Archivos clave del widget

```
lumina-frontend/src/components/widgets/click-reveal/
├── click-reveal-config.ts       # defaults, normalize, resize elementos
├── click-reveal-shared.tsx      # header, paddings
├── click-reveal-parts.tsx       # tarjetas trigger, modal, deck
├── click-reveal-editor.tsx
├── click-reveal-viewer.tsx
├── click-reveal-properties.tsx
├── click-reveal-appearance-properties.tsx
├── click-reveal-inner-properties.tsx
└── click-reveal.module.css      # overlay, backdrop, animaciones de apertura
lumina-frontend/src/lib/click-reveal-defaults.ts
```

### 1.6 Patrón de overlay reutilizable

`ClickRevealModalPanel` renderiza backdrop + modal **dentro del widget** (no portal a `document.body`), con efectos `fade` / `instant` / `slide-up`:

```521:541:lumina-frontend/src/components/widgets/click-reveal/click-reveal-parts.tsx
  return (
    <>
      {visible && !isEditing ? (
        <button
          type="button"
          className={styles.revealBackdrop}
          aria-label="Cerrar ventana"
          onClick={onClose}
        >
          <span className={styles.revealBackdropDim} />
        </button>
      ) : null}

      <div
        className={cn(
          styles.revealModal,
          isEditing && styles.revealModalEditing,
          visible || isEditing
            ? styles.revealModalVisible
            : modalHiddenClass(configuracion.efectoApertura),
        )}
```

---

## 2. Estado actual — Panel “Interacción” (5 entradas)

**Ubicación:** `ActividadesInsertPanel` en  
`lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx`

**Nota:** Este panel es el flyout izquierdo “Actividades / insertar”, **distinto** del panel derecho “Widgets” (Grupo 2) que sí implementa Click to Reveal completo.

### 2.1 Comportamiento común al hacer clic

```221:225:lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx
function ActividadesInsertPanel({ apiSlide, onCommitContent, disabled, slideHasActivity }: ContentPanelProps) {
  const addBlock = (tipo: string, subtipo: string) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, { tipo, subtipo } as unknown as Block));
    toast.info('Próximamente');
  };
```

- **Sí hay `onClick`** en cada `InsertBtn`.
- **No hay drag** en este panel (solo click; el drag de widgets está en `draggable-widget-item.tsx` del panel derecho).
- **Persiste** vía `appendBlockToSlideContent` → PATCH del slide.
- **Cast forzado** `as unknown as Block` — el tipo no existe en la unión TypeScript.

### 2.2 Tabla por entrada

| Entrada | `subtipo` | Objeto generado | Renderer | Componente dedicado | Clasificación |
|---------|-----------|-----------------|----------|---------------------|---------------|
| **Botón** | `boton` | `{ tipo: 'interactivo', subtipo: 'boton' }` | Ninguno (`switch` sin `case`) | No existe | **(b) Parcial** |
| **Hotspot** | `hotspot` | `{ tipo: 'interactivo', subtipo: 'hotspot' }` | Ninguno | No existe (0 archivos `*hotspot*`) | **(b) Parcial** |
| **Tooltip emergente** | `tooltip` | `{ tipo: 'interactivo', subtipo: 'tooltip' }` | Ninguno | No existe (solo Radix Tooltip de UI) | **(b) Parcial** |
| **Contador / temporizador** | `contador` | `{ tipo: 'interactivo', subtipo: 'contador' }` | Ninguno | No existe | **(b) Parcial** |
| **Barra de progreso** | `progreso` | `{ tipo: 'interactivo', subtipo: 'progreso' }` | Ninguno | No existe | **(b) Parcial** |

### 2.3 Qué ve el usuario tras insertar

1. Toast **“Próximamente”**.
2. Bloque aparece en `bloques[]` pero **`renderContent()` no tiene `case`** → contenido vacío (div posicionado sin hijos visibles).
3. **Propiedades:** mensaje genérico *“Este tipo de bloque no tiene propiedades aquí”* (`properties-panel.tsx`, rama fallback).
4. Posición por defecto del `switch` en `getBlockPositionStyle`: `x:5%, y:5%, w:90%, h:90%`.

**Ninguna de las 5 es (c) funcional.** Tampoco son (a) puramente decorativas del panel: el click **sí escribe JSON**.

### 2.4 Confusión con temporizador existente

Existe **temporizador por slide/clase** (`content.timer`, `timerGlobal`) resuelto en `slide-timer-resolve.ts` — **no** relacionado con el bloque `interactivo/contador`. Son features distintas.

---

## 3. Modelo de datos de bloques / widgets

### 3.1 Unión `Block` y campos comunes

**Discriminante:** campo único `tipo` (sin `widgetType` anidado).

| Categoría | Valores de `tipo` | Posición canvas |
|-----------|-------------------|-----------------|
| Contenido básico | `texto`, `imagen`, `video`, `audio`, `codigo`, `cita`, `separador`, `forma`, `columnas` | `x`, `y`, `ancho`, `alto`, `zIndex` (%) |
| Actividad | `actividad` → anidado `actividad.tipo` (`quiz_multiple`, `torneo`, …) | `marco` opcional o fallback fijo |
| Widgets Grupo 2 | `flip-cards`, `tabs`, `carousel`, `click-reveal`, `timeline` | `x`, `y`, `ancho`, `alto`, `zIndex` |
| Stubs Grupo 9 (flyout) | `interactivo` + `subtipo` (no tipado) | Sin coords — cae en default 5/5/90/90 |
| Animaciones (todos) | `animaciones?: Animacion[]` en cualquier bloque | — |

**Jerarquía actividad vs widget:** mismo array `bloques`; las actividades usan `tipo: 'actividad'` con sub-objeto `actividad: { tipo: 'quiz_multiple', … }`. Los widgets usan `tipo` de primer nivel (`click-reveal`, etc.).

### 3.2 Documento `content` del slide

```typescript
// Estructura típica persistida en Slide.content (JSON)
{
  bloques: Block[],
  fondo?: Background,
  layout?: string,           // clave layout (en_blanco, dos_columnas, …)
  diseno?: Layout,
  temaId?: string,
  transicion?: TransicionSlide,
  timer?: number,            // temporizador slide (segundos)
  guias?: SlideGuias,
}
```

### 3.3 `class-slide-normalize.ts`

**Ruta:** `lumina-frontend/src/lib/class-slide-normalize.ts`

| Función | Rol |
|---------|-----|
| `classSlideToRendererSlide` | API → `Slide`; normaliza `bloques`, `fondo`, `layout`, `transicion`, `guias` |
| `normalizeBlock` | Solo `actividad` (emparejar legacy) y `columnas` recursivas |
| `appendBlockToSlideContent` | Añade bloque al array |
| `sanitizeSlideContentForPersistence` | Limpia slides de actividad (solo bloques `actividad`) |
| `getBlockAtPath` / `updateBlockAtPath` | CRUD por ruta `"2"` o `"5-0-1"` |

**Para Grupo 9:** habrá que extender `normalizeBlock` si se migran stubs `{ tipo: 'interactivo', subtipo }` → tipos finales (`hotspot`, `popup`, …) o si hay campos legacy. Hoy **no normaliza** `interactivo`.

### 3.4 Concepto de “capas” (layers)

- **No hay modelo `layers[]` ni visibilidad por capa en JSON.**
- **Sí hay apilamiento:** `zIndex` numérico por bloque + acciones en `canvas-area.tsx`: `traer_frente`, `enviar_atras_total`, `adelante_uno`, `atras_uno`.
- **Visibilidad por toggle** existe dentro de widgets (`mostrarTitulo`, `mostrarImagen`, etc.) — no capas globales del slide.
- **“Capas visibles/ocultas por clic” (Grupo 9)** requerirá **nuevo modelo** (p. ej. `visible: boolean` runtime + triggers, o grupos de bloques vinculados).

---

## 4. Backend — persistencia y schema

### 4.1 Prisma

```186:198:lumina-backend/prisma/schema.prisma
model Slide {
  id        String         @id @default(cuid())
  order     Int
  type      SlideType
  title     String
  content   Json?
  classId   String
  createdAt DateTime       @default(now())
  class     Class          @relation(fields: [classId], references: [id], onDelete: Cascade)
  versions  SlideVersion[]

  @@map("slides")
}
```

**Confirmación:** los bloques/widgets son **JSON libre** en `Slide.content`. **No se requiere migración Prisma** para nuevos `tipo` de widget.

### 4.2 Backend agnóstico vs conocedor del contenido

| Área | ¿Conoce tipos de bloque? | Detalle |
|------|--------------------------|---------|
| CRUD slides | No (guarda `Json`) | `classes.service.ts` PATCH content tal cual |
| Autonomous sessions | Parcial | Busca `bloques.find(b => b.tipo === 'actividad')` para calificar |
| PPTX import | Parcial | Genera `texto` / `imagen` |
| Analytics / gamificación | Por `activityType` en resultados | No parsea widgets interactivos |
| Gradebook | Actividades calificables | Widgets Grupo 9 no generan nota por sí solos |

El backend **no valida** la forma de `click-reveal`, `hotspot`, etc.

---

## 5. Animaciones y triggers existentes (Grupo 3)

### 5.1 Modelo

**Ruta:** `lumina-frontend/src/types/animation.types.ts`

```37:46:lumina-frontend/src/types/animation.types.ts
export interface Animacion {
  id: string
  tipo: AnimacionTipo      // fade-in, slide-left, zoom-in, … (18 tipos)
  momento: AnimacionMomento // entrada | salida | enfasis
  trigger: AnimacionTrigger // auto | click | hover
  duracion: number
  delay: number
  iteraciones: number
  easing: AnimacionEasing
}
```

### 5.2 Hook `useBlockAnimations`

**Ruta:** `lumina-frontend/src/hooks/use-block-animations.ts`  
**Integración:** `BlockNode` en `slide-renderer.tsx` — **siempre en el contenedor externo del bloque**.

| Trigger | Comportamiento |
|---------|----------------|
| `auto` | Al activarse el slide (`isViewerMode`) |
| `click` | `click` en el **elemento contenedor** del bloque |
| `hover` | `mouseenter` en el contenedor |

Aplica clases CSS (`lumina-anim-*`) — **no** muestra/oculta otros bloques ni abre modales.

### 5.3 Regla crítica (contexto V38)

> NUNCA aplicar animaciones de bloque al interior de widgets.

Los widgets Grupo 2 gestionan interacción interna aparte (`ClickRevealViewer` state, flip CSS 3D, etc.).

### 5.4 ¿Reutilizable para Popups / Tooltips / Hotspots?

| Necesidad Grupo 9 | ¿Triggers Grupo 3? | Recomendación |
|-------------------|-------------------|---------------|
| Animar entrada del **disparador** (punto hotspot) | Sí | `animaciones` en el bloque trigger |
| Abrir **overlay con contenido** | No | Reutilizar patrón `ClickRevealModalPanel` o portal dedicado |
| Tooltip hover | No | Componente propio (Radix Tooltip / posicionamiento absoluto) |
| Zoom imagen fullscreen | No | Modal/portal separado (Lightbox) |
| Mostrar/ocultar **otros bloques** del slide | No | Nuevo sistema de acciones (`onTrigger → setVisibility(blockIds)`) |

**Conclusión:** triggers de animación y sistema de overlay son **complementarios**, no sustitutos.

---

## 6. Huecos y decisiones de arquitectura pendientes

### 6.1 Modelado de tipos

1. **¿Un `tipo` por widget** (`hotspot`, `popup`, `nav-button`, …) o mantener `interactivo` + `subtipo`?  
   - Recomendación alineada al código existente: **`tipo` de primer nivel** (como Grupo 2), deprecar stubs `interactivo`.
2. **¿Hotspot es bloque independiente o acción sobre `ImageBlock`?**  
   - Genially suele anclar hotspots a una imagen; Lumina hoy tiene bloques posicionados en % independientes.
3. **¿Popup comparte `WidgetSlideContent` con Click to Reveal** o modelo más simple (HTML/texto + imagen)?

### 6.2 Overlay y portales

4. **¿Overlay dentro del bloque (como Click to Reveal) o portal a `document.body`?**  
   - Inside: más simple, puede recortarse con `overflow:hidden` del slide.  
   - Portal: mejor para zoom fullscreen y tooltips fuera del canvas 1280×720.
5. **¿Un solo `OverlayHost` compartido** para popup / hotspot / zoom?

### 6.3 Estado e interacción

6. **Estado abierto/cerrado:** ¿siempre local (`useState`) o persistir en sesión autónoma/analytics?
7. **Capas visibles/ocultas:** ¿grupos de `blockId`, flags `visible` en JSON, o capa lógica nueva?
8. **Botones de navegación:** ¿disparan cambio de slide (`idx++`), URL externa, o scroll a bloque?

### 6.4 Editor UX

9. **Panel de inserción:** ¿unificar flyout izquierdo con panel derecho Widgets o migrar entradas Grupo 9 al patrón `handleAddWidget` + drag?
10. **Propiedades y selección interna:** reutilizar `WidgetSlideInnerSelection` / `ClickRevealInnerSelection` o patrón nuevo más ligero para hotspots.
11. **Normalización:** funciones `normalizeHotspotWidget()` + migración desde `{ tipo: 'interactivo', subtipo: 'hotspot' }`.

### 6.5 Infra transversal

12. **`class-slide-normalize.ts`:** reglas de migración para stubs existentes en DB de prueba.
13. **`widget-registry.ts` + `WIDGET_TIPOS`:** registrar los 7 tipos nuevos.
14. **Conflictos click/hover:** animación `trigger: 'click'` en contenedor vs click del hotspot — definir `stopPropagation` (ya existe `stopWidgetInnerPointer` en widgets).
15. **Autónomo / viewer:** confirmar si widgets puramente informativos (popup, sticky note) deben bloquear avance de slide o ser decorativos.
16. **Accesibilidad:** foco trap en modals, cierre con Escape, aria-labels (Click to Reveal ya tiene backdrop button + cerrar).

### 6.7 Mapa sugerido reutilización → widget Grupo 9

| Widget Grupo 9 | Base reutilizable |
|----------------|-------------------|
| Popups | `ClickRevealModalPanel`, `WidgetSlideContent`, efectos apertura CSS |
| Hotspots | Posicionamiento `%` de bloques + modal Click to Reveal (contenido por hotspot) |
| Tooltips | Radix Tooltip / posicionamiento; **no** triggers Grupo 3 |
| Botones navegación | Acciones slide (patrón autónomo `setIdx`) + estilos `FormaBlock` / botón |
| Zoom imagen | Lightbox modal; posible extensión de `ImageBlock` |
| Capas visible/oculta | Nuevo — inspiración en `zIndex` + flags visibilidad |
| Sticky notes | `TextBlock` + `FormaBlock` + estado expand/colapsar |

---

## Referencias rápidas de archivos

| Tema | Ruta |
|------|------|
| Contexto roadmap Grupo 9 | `LUMINA_CONTEXT_V38.md` §5 |
| Tipos Block | `lumina-frontend/src/types/slide.types.ts` |
| Tipos widgets | `lumina-frontend/src/types/widget.types.ts` |
| Normalización slides | `lumina-frontend/src/lib/class-slide-normalize.ts` |
| Renderer central | `lumina-frontend/src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` |
| Panel stubs Interacción | `lumina-frontend/src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx` |
| Inserción widgets Grupo 2 | `lumina-frontend/src/app/(app)/classes/[id]/editor/editor-client.tsx` → `handleAddWidget` |
| Click to Reveal | `lumina-frontend/src/components/widgets/click-reveal/*` |
| Animaciones | `lumina-frontend/src/hooks/use-block-animations.ts` |
| Schema DB | `lumina-backend/prisma/schema.prisma` |

---

*Fin del diagnóstico — listo para diseño de arquitectura Grupo 9.*
