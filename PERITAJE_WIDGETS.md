# Peritaje de widgets — Grupo 2 + Grupo 9

> Generado: 21/08/2026  
> Alcance: **solo análisis** (Flip Cards, Tabs, Carousel, Click to Reveal, Timeline, Popup, Hotspot, Tooltip).  
> Fuera de alcance (pedido explícito): Botón, Contador/temporizador, Barra de progreso.  
> Base: `LUMINA_CONTEXT_V39.md`, `lumina-frontend/CLAUDE.md`, código en `lumina-frontend/src/components/widgets/`.

---

## Tabla de consistencia estructural

Convención de referencia (Popup / Hotspot / Tooltip):  
`defaults` + `config` + `editor` + `parts` + `viewer` + `properties` (+ CSS module).

| Widget | defaults | config | editor | parts | viewer | properties | otros archivos |
|---|---|---|---|---|---|---|---|
| **Flip Cards** | `src/lib/flip-cards-defaults.ts` | `flip-cards-config.ts` (`normalize` aquí; `merged` en shared) | sí (~1030 líneas) | **no** | sí | sí + appearance + inner + card | `*-shared.tsx`, templates, gallery, thumb, card-utils, image-styles, text-styles |
| **Tabs** | `src/lib/tabs-defaults.ts` | sí (`normalize` + `merged`) | sí | **no** | sí | sí + appearance + inner | `*-shared.tsx`, layouts, gallery, thumb, `tabs-slide-panel.tsx` (**re-export** de shared), slide-utils |
| **Carousel** | `src/lib/carousel-defaults.ts` | sí (`normalize` + `merged`) | sí | **no** | sí | sí + appearance + inner | `*-shared.tsx` |
| **Click to Reveal** | `src/lib/click-reveal-defaults.ts` | sí (`normalize` + `merged` + migrate legacy) | sí | sí | sí | sí + appearance + inner | `*-shared.tsx` |
| **Timeline** | `src/lib/timeline-defaults.ts` | sí (`normalize`; **sin** `mergedTimelineConfig`) | sí | sí | sí | sí + appearance + inner | shared, stage, node-layouts, node-primitives, icon-catalog, variant-meta, text-styles |
| **Popup** | `src/lib/popup-defaults.ts` | sí (re-exporta defaults) | sí | sí | sí | sí (archivo muy grande) | **portal**, modal-resize-handles |
| **Hotspot** | `src/lib/hotspot-defaults.ts` | sí (re-exporta defaults) | sí | sí | sí | sí + inner | CSS burbuja |
| **Tooltip** | **`widgets/tooltip/tooltip-defaults.ts`** (único del grupo que no está en `src/lib/`) | sí (re-exporta defaults) | sí | sí | sí | sí | — |

### Qué es cosmético vs arquitectura real

**Solo nombres / ubicación (cosmético o deuda de naming):**
- Grupo 2 guarda `createDefault*Block` en `src/lib/*-defaults.ts`; Tooltip lo puso junto al widget. Popup/Hotspot siguen el patrón `lib/` como Grupo 2.
- `tabs-slide-panel.tsx` es un alias de 6 líneas hacia `shared/widget-slide-panel.tsx`. Carousel, Click to Reveal y Popup importan el alias `TabsSlidePanel*`; Hotspot importa el shared directo.

**Diferencia real de arquitectura:**
- **Flip Cards, Tabs, Carousel** no tienen `*-parts.tsx`: el markup vive en `*-shared.tsx` + editor/viewer. Click to Reveal y Timeline (Grupo 2 tardío) ya usan `parts`.
- **`mergedXConfig`**: existe en Flip Cards (pero en `flip-cards-shared.tsx`, no en config), Tabs, Carousel, Click to Reveal, Popup, Hotspot, Tooltip. **Timeline no tiene `mergedTimelineConfig`**: el editor/viewer usan `normalizeTimelineWidget` + `DEFAULT_TIMELINE_CONFIG`.
- **Tipos**: `FlipCardsWidget` vive en `slide.types.ts` (el más antiguo). El resto de widgets de este peritaje están en `widget.types.ts` y se re-exportan.
- **Normalización al cargar el slide**: `class-slide-normalize.ts` llama `normalizePopupWidget` / `normalizeHotspotWidget` / `normalizeTooltipWidget`. **Ningún widget de Grupo 2 se normaliza al hidratar** — solo en render (editor/viewer/properties). JSON legacy de Flip Cards/Tabs/Carousel/Timeline/Click to Reveal puede llegar crudo al canvas.
- **Editor vs viewer**: los 8 tienen archivos separados. Ninguno es “un solo archivo con `if (modo)`”. El editor de Flip Cards sí duplica gran parte del render del viewer (caras, imagen, header).
- **Chrome de contenedor (header título/instrucción)**: Grupo 2 + Click to Reveal lo tienen. Popup/Hotspot/Tooltip **no** usan `WidgetHeaderFields` de forma útil (Hotspot/Popup normalizan `tituloWidget` vacío; Tooltip ni siquiera es header-widget).

---

## Hallazgos por categoría

### 1. Auto-posición duplicada (Hotspot ↔ Tooltip)

**Widget(s):** Hotspot, Tooltip  
**Categoría:** duplicado  
**Descripción:** El cálculo `posicion === 'auto'` (espacios respecto a `.canvas-slide`, fallback abajo → arriba → derecha → izquierda) está copiado casi literal entre `hotspot-parts.tsx` y `tooltip-parts.tsx`. Solo cambian el nombre del campo (`posicionBurbuja` vs `posicion`) y `neededH` (200 vs 80).  
**Evidencia:**

```45:68:lumina-frontend/src/components/widgets/hotspot/hotspot-parts.tsx
  useEffect(() => {
    if (!isOpen && !isEditing) return;
    if (cfg.posicionBurbuja !== 'auto') return;
    // ... getBoundingClientRect + closest('.canvas-slide')
    const neededH = 200;
    if (bottomSpace > neededH) setAutoPos('abajo');
    // ...
  }, [isOpen, isEditing, cfg.posicionBurbuja, cfg.anchoBurbuja]);
```

```73:96:lumina-frontend/src/components/widgets/tooltip/tooltip-parts.tsx
  useEffect(() => {
    if (!isOpen && !isEditing) return;
    if (cfg.posicion !== 'auto') return;
    // misma geometría
    const neededH = 80;
    // ...
  }, [isOpen, isEditing, cfg.posicion, cfg.anchoBurbuja]);
```

**Riesgo si se deja así:** medio (bugs de overflow se parchean en uno y no en el otro).  
**Sugerencia:** extraer `useAutoPosition({ enabled, anchorRef, neededW, neededH })` **cuando se toque** Hotspot o Tooltip — no bloquea widgets que no son overlay.

---

### 2. `patchWidget` / `patchOverlay` copiados; en Tooltip quedó muerto

**Widget(s):** Popup, Hotspot, Tooltip, y también Tabs / Carousel / Click to Reveal / Timeline  
**Categoría:** duplicado + muerto  
**Descripción:** El patrón `onChange(fn(normalizeX(block)))` se repite en todos los editores con overlay o header editable. No es idéntico: Popup/Tabs/Carousel/Click-reveal/Timeline usan función suelta; Hotspot/Tooltip usan `useCallback`. Extraer `useWidgetPatch` ahorra ~5 líneas y no elimina el acoplamiento a `normalize*`.

En **Tooltip** el `patchWidget` **no se usa**: el texto no se escribe desde el canvas (decisión deliberada). `onChange` queda como prop obligatoria cableada desde `slide-renderer` / `canvas-area` / `editor-client` sin que el editor la dispare.

**Evidencia:**

```25:30:lumina-frontend/src/components/widgets/tooltip/tooltip-editor.tsx
  const patchWidget = useCallback(
    (fn: (w: TooltipWidget) => TooltipWidget) => {
      onChange(fn(normalizeTooltipWidget(block)));
    },
    [block, onChange],
  );
```

`patchWidget` no aparece de nuevo en el archivo. `TooltipParts` declara `innerSelection` en la interfaz y **no la desestructura**.

**Riesgo si se deja así:** bajo (ruido / cableado muerto `onTooltipChange`).  
**Sugerencia:** documentar como deuda; borrar `patchWidget` + opcionalizar `onChange` en Tooltip cuando se limpie. **No** crear `useWidgetPatch` solo por Botón/Contador/Barra (esos no parchean overlay).

---

### 3. Normalización Grupo 2 reescrita 4–5 veces (y no corre al cargar)

**Widget(s):** Flip Cards, Tabs, Carousel, Click to Reveal, Timeline  
**Categoría:** duplicado + estructura  
**Descripción:** Cada uno hace `configuracion: { ...DEFAULT, ...raw, opacidadFondoContenedor ?? 100, paddingContenedor ?? 16, alineacionInstruccion ?? 'izquierda', mostrarBotonAnterior/Siguiente con legacy }`. Tabs y Carousel son casi el mismo cuerpo. Flip Cards añade plantilla + caras. Click to Reveal añade migrate + resize de triggers/overlays. Timeline normaliza nodos, no un `mergedConfig`.

Eso **no** es un `normalizeWidget` genérico único sin perder migraciones (Click to Reveal `migrateLegacyClickReveal`, Flip Cards `mostrarNavegacion`). Lo accionable es: **hidratar Grupo 2 en `class-slide-normalize.ts`**, igual que Popup/Hotspot/Tooltip.

**Evidencia:** `class-slide-normalize.ts` L126–154 — `normalizeBlock` trata `popup` / `hotspot` / `tooltip` (y widgets posteriores) y hace `return block` para Flip Cards/Tabs/Carousel/Click-reveal/Timeline.

**Riesgo si se deja así:** medio (JSON viejo con campos undefined hasta el primer render; inconsistencia editor vs persistencia).  
**Sugerencia:** documentar como deuda; al tocar un widget de Grupo 2, meter su `normalize*` en `normalizeBlock`. No extraer un mega-normalizer ahora.

---

### 4. CSS de burbuja / fade copiado (Hotspot vs Tooltip)

**Widget(s):** Hotspot, Tooltip  
**Categoría:** duplicado  
**Descripción:** Posiciones `.posTop/.posBottom/.posLeft/.posRight` + flecha `::after` están duplicadas. Hotspot además tiene `fadeIn` / `slideUp*` (Tooltip usa opacity/visibility). Extraer un CSS compartido de “caret + 4 lados” es posible pero frágil (anchos, colores, `neededH` distintos).  
**Evidencia:** `hotspot.module.css` L133–196 vs `tooltip.module.css` L76–138.  
**Riesgo:** bajo.  
**Sugerencia:** ignorar por diseño hasta un rediseño visual conjunto.

---

### 5. Código muerto / leftover de copiar Tooltip desde Hotspot

**Widget(s):** Tooltip, Hotspot  
**Categoría:** muerto  
**Descripción:**
- Tooltip: `patchWidget` sin usos; `innerSelection` no usado en `TooltipParts`; `kind: 'tooltip-text'` solo cambia el **título** del panel a “Texto” y renderiza el mismo `TooltipProperties` (`properties-panel.tsx` ~L1008–1026). No hay panel inner de texto.
- Hotspot viewer: `const cfg = mergedHotspotConfig(block)` no se usa (`hotspot-viewer.tsx` L12–13).
- No hay `TODO`/`FIXME`/código comentado en `src/components/widgets/` (grep vacío).

**Riesgo:** bajo.  
**Sugerencia:** refactorizar ahora solo si se limpia Tooltip en el mismo PR; si no, deuda.

---

### 6. Duplicación local de utilidades de editor (Flip Cards)

**Widget(s):** Flip Cards  
**Categoría:** duplicado  
**Descripción:** `flip-cards-editor.tsx` redefine `useDraftField` y `autoResizeTextarea` (L56–68) en lugar de `useWidgetDraftField` / `autoResizeWidgetTextarea` de `widget-editor-utils.ts` (usados por Timeline y el header shared).  
**Riesgo:** bajo.  
**Sugerencia:** documentar como deuda; unificar al tocar el editor de Flip Cards.

---

### 7. `pointer-events` en overlays — criterio distinto y mayormente correcto

**Widget(s):** Popup, Click to Reveal, Hotspot, Tooltip  
**Categoría:** funcional  
**Descripción:**

| Widget | Overlay | `pointer-events` | ¿Bloquea el slide? |
|---|---|---|---|
| Popup | Portal a `.canvas-slide` + backdrop | Capa portal `none`; hijos y backdrop editor `auto` (`popup.module.css` L6–11, L27) | Sí — modal. Correcto. |
| Click to Reveal | Modal **dentro** del bloque (no portal) | Backdrop de **editor** `none` (L41) para no comer clics de edición; backdrop de viewer es botón clicable (L46–55) | Semi: ocupa el widget (~90%), no todo el slide vía portal. |
| Hotspot | Burbuja inline, overflow visible | **No declara** `pointer-events` en `.bubbleContainer` → default `auto` | La burbuja (fuera del hit 4×4) **sí captura clics** porque hay panel editable. No es leftover de Popup: el overlay necesita interacción. |
| Tooltip | Burbuja inline | `.bubble { pointer-events: none }` (`tooltip.module.css` L62) | No. Correcto. |

No hay un `pointer-events: auto` espurio en Tooltip heredado de Popup. Hotspot **debe** ser `auto` en la burbuja (cierre + `WidgetSlidePanelEditor`). El riesgo residual es que la burbuja de Hotspot robe clics a bloques debajo (por overflow visible + auto).

**Riesgo:** medio (Hotspot burbuja vs bloques vecinos); bajo en Tooltip.  
**Sugerencia:** documentar como deuda (Hotspot); ignorar Tooltip.

---

### 8. Inner selection + DndKit — Tooltip replica el reset; el “inner” de Tooltip es vestigial

**Widget(s):** todos los que tienen inner selection; especialmente Hotspot y Tooltip  
**Categoría:** funcional  
**Descripción:** `canvas-area.tsx` mantiene un `useState` por widget (Flip Cards, Tabs, Carousel, Click to Reveal, Popup, Hotspot, Tooltip, Timeline) y **los resetea todos en el mismo `useEffect([selectedBlockId])`** (L302–310). El guard DndKit (`if (draggingId != null) return`, L765–767) es **global**, no exclusivo de Hotspot.

Tooltip **sí** replica el patrón de estado (`tooltipInnerSelection` + props hasta `SlideRenderer`). No introduce un efecto extra que pueda reabrir el loop. La variante es de **producto**: al hacer clic en el trigger se setea `{ kind: 'tooltip-text' }` pero no hay edición inner ni `onTooltipChange` efectivo.

**Riesgo:** bajo (Tooltip inner es ruido). El loop DndKit de hit-target pequeño queda cubierto por el guard global.  
**Sugerencia:** documentar como deuda (simplificar Tooltip sin inner selection, como Botón).

---

### 9. Carrera inline vs panel derecho

**Widget(s):** Popup, Hotspot, Click to Reveal, Flip Cards, Tabs, Carousel, Timeline. **No Tooltip.**  
**Categoría:** funcional  
**Descripción:** Overlay/header usan `contentEditable` / `onCommit` (`widget-slide-panel.tsx` L616, Flip Cards editor, Timeline editor, Click to Reveal parts). Eso es la misma clase de carrera documentada para Hotspot: dos fuentes escriben el mismo campo.

**Tooltip:** el texto de la burbuja **solo** sale de `cfg.textoTooltip` en `TooltipParts` (no hay `contentEditable` ni `onCommit` en el bubble). El panel derecho usa `applyNow`. **No quedó un camino inline accidental.**

**Popup:** deliberadamente **sí** tiene edición inline del overlay (mismo `WidgetSlidePanelEditor` / `TabsSlidePanelEditor`). No se evitó la carrera; se aceptó el patrón Captivate.

**Grupo 2 hit-target pequeño:** Flip Cards/Tabs/Carousel/Timeline/Click to Reveal usan fallback ~90×90 (`BLOCK_FALLBACKS`). El loop DndKit de grip 4×4 **no aplica**. Sí aplica la carrera de escritura inner + panel. Nunca se reportó con el mismo rigor que Hotspot.

**Riesgo:** medio en Popup/Hotspot/Click to Reveal/Flip Cards; nulo en Tooltip.  
**Sugerencia:** documentar como deuda (no unificar edición a “solo panel” en Grupo 2 ahora). Para overlays nuevos, copiar Tooltip (solo panel) si el contenido es un string; copiar Hotspot solo si hay `WidgetSlideContent`.

---

### 10. Click to Reveal no usa portal (a diferencia de Popup)

**Widget(s):** Click to Reveal, Popup  
**Categoría:** estructura / funcional  
**Descripción:** Popup aisló el modal con `PopupSlidePortal` + `slide-canvas-root-context` precisamente por clipping/`pointer-events`. Click to Reveal sigue montando `ClickRevealModalPanel` dentro del bloque. Funciona porque el widget es casi a pantalla completa; **no** es el patrón correcto para un popup pequeño.  
**Evidencia:** `popup-portal.tsx`; `click-reveal-editor.tsx` / `click-reveal-viewer.tsx` renderizan el modal como hijo del root del widget.  
**Riesgo:** medio si alguien reutiliza Click to Reveal como base de un overlay pequeño (ya pasó: Popup tuvo que desviarse).  
**Sugerencia:** documentar como deuda. Base para overlays pequeños = **Hotspot/Tooltip**, no Click to Reveal. Base para modales a pantalla de slide = Popup (portal).

---

### 11. Scoring / XP residual

**Widget(s):** los 8  
**Categoría:** scoring  
**Descripción:** Grep en `src/components/widgets/` de `score`, `xpFrom`, `evaluateActivityResponse`, `notaColombiana`, `maxScore`: **cero coincidencias**. Ninguno importa `activity-scoring.ts`. No hay cálculo académico residual.  
**Riesgo:** nulo.  
**Sugerencia:** ignorar por diseño. Si un widget se volviera evaluable, **debe** pasar por `evaluateActivityResponse` / `xpFromEvaluation` (Sección 10 de V39) — hoy no aplica.

---

### 12. Flip Cards: tipo y editor monolítico

**Widget(s):** Flip Cards  
**Categoría:** estructura  
**Descripción:** Único widget cuyo tipo canónico está en `slide.types.ts` (L821+). Editor ~1030 líneas con render de cara, popover de imagen y header. Viewer ~290 líneas duplica estilos de cara. Ya hay `flip-cards-shared.tsx` pero el editor no se apoya en `parts`.  
**Riesgo:** medio (coste de cambio, bugs editor≠viewer).  
**Sugerencia:** documentar como deuda; no bloquear Grupo 9. Extraer `parts` solo si se rediseña Flip Cards.

---

## Recomendación de arquitectura (Botón / Contador / Barra de progreso)

**No conviene un refactor transversal de Grupo 2 ni extraer hooks de overlay antes de esos tres widgets.** No son overlays: no necesitan `useAutoPosition`, portal, inner selection ni `patchOverlay`. Forzar la carpeta Captivate (`*-shared.tsx`, header, `src/lib/*-defaults.ts`) sería el patrón **equivocado**.

Convención a fijar **solo para widgets de Interacción simples** (ya usada por Tooltip y, en la rama actual, por Botón/Contador/Progreso):

1. Carpeta `widgets/<nombre>/` con `*-defaults.ts`, `*-config.ts`, `*-editor.tsx`, `*-viewer.tsx`, `*-properties.tsx`, CSS module. `parts` solo si hay markup compartido editor/viewer.
2. `tipo` de primer nivel + `normalize*` en `class-slide-normalize.ts`.
3. Texto editable **solo panel derecho** si el valor es un string (evitar inner selection vacía).
4. Sin `onChange` de canvas si el editor no escribe (no copiar el cableado de Hotspot).

**Hooks compartidos — quién los adoptaría:**

| Hook | Adoptarían | Quedarían igual |
|---|---|---|
| `useAutoPosition` | Hotspot, Tooltip | Popup (modal centrado), Click to Reveal, Grupo 2, Botón/Contador/Barra |
| `useWidgetPatch` | **Ninguno de forma urgente.** Editores con overlay ya tienen 5 líneas. Tooltip no debería parchear. | Todos los no-overlay |
| `WidgetSlidePanel` (ya existe) | Tabs, Carousel, Click to Reveal, Popup, Hotspot | Flip Cards, Timeline, Tooltip, Botón/Contador/Barra |

**Qué sí unificar cuando se toque un archivo, no en un mega-PR:**
- Meter `normalizeFlipCards/Tabs/Carousel/ClickReveal/Timeline` en `class-slide-normalize.ts`.
- Dejar de importar `TabsSlidePanel*` desde `tabs/` (usar `shared/widget-slide-panel`).
- Limpiar leftovers de Tooltip (`patchWidget`, inner selection cosmética).

**Nota de alcance:** en esta rama Botón / Contador / Barra **ya existen** (`widgets/boton|contador|progreso`, patrón Tooltip-lite). Este peritaje no los audita. La recomendación sigue válida: no reescribir Grupo 2 para “preparar” overlays que esos tres no usan.

---

## Resumen ejecutivo

1. **Riesgo medio — hidratación:** Grupo 2 no pasa por `normalizeBlock` al cargar el slide; Popup/Hotspot/Tooltip sí. JSON legacy puede divergir hasta el primer render.  
2. **Riesgo medio — dos bases de overlay:** Click to Reveal (modal in-block) no es la base correcta para overlays pequeños; Popup (portal+backdrop) y Hotspot/Tooltip (burbuja inline) ya divergieron. Copiar Click to Reveal otra vez reproduciría los bugs de portal/`pointer-events`.  
3. **Riesgo medio — carrera inline:** sigue en Popup, Hotspot, Click to Reveal y todo Grupo 2 con `contentEditable`. Tooltip la evitó de verdad (solo panel).  
4. **Riesgo medio — Hotspot burbuja `pointer-events` auto + overflow:** correcto para editar el overlay, puede tapar bloques vecinos; Tooltip está bien (`none`).  
5. **Riesgo bajo — duplicación Hotspot/Tooltip:** `autoPos` y CSS de caret; extraer `useAutoPosition` al retocar uno de los dos.  
6. **Riesgo bajo — leftovers Tooltip:** `patchWidget`/`onChange`/`innerSelection` copiados de Hotspot y no usados.  
7. **Riesgo nulo — scoring:** ningún widget calcula nota/XP; no hay que pasarlos por `evaluateActivityResponse`.  
8. **Antes de más widgets simples:** no unificar Grupo 2. Usar el patrón Tooltip (carpeta autocontenida, sin overlay, sin inner selection). No extraer `useWidgetPatch`. Extraer `useAutoPosition` solo para el par Hotspot/Tooltip.
