# LUMINA_CONTEXT_V32.md
> Generado: 03/06/2026 — Sesión 03/06/2026
> Reemplaza: LUMINA_CONTEXT_V31.md

---

## 1. IDENTIDAD DEL PROYECTO

**Lumina** — Plataforma SaaS educativa colombiana para docentes.
- **Lumina Core**: Editor de clases interactivas (Canva/Nearpod-style)
- **Lumina Edu**: Módulo de gestión institucional (EduCore, separado)

**Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + Prisma + PostgreSQL (puerto 5434 Docker) + Redis (puerto 6380 Docker) + Socket.IO
- Monorepo: `C:\Users\Jaime\proyectos\lumina\`
  - `lumina-frontend` (rama `master`)
  - `lumina-backend` (rama `main`)
- GitHub: `github.com/Jaimey1983/lumina`

---

## 2. REGLAS DE TRABAJO (CRÍTICAS)

1. **Git siempre manual** — Jaime hace todos los commits. Los agentes nunca ejecutan git.
2. **Prompts separados** — backend y frontend siempre en prompts separados y etiquetados.
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V32.md antes de empezar."
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor o Antigravity.
6. **La carpeta raíz `src/` es una copia muerta** — el backend activo es siempre `lumina-backend/`.
7. **Docker debe estar iniciado** antes de levantar el backend (PostgreSQL puerto 5434, Redis puerto 6380).

---

## 3. ARQUITECTURA SOCKET.IO — CRÍTICA

El sistema usa **DOS namespaces** de Socket.IO:

| Namespace | Quién conecta | Auth | Propósito |
|-----------|--------------|------|-----------|
| `/` (raíz) | Viewer (estudiantes anónimos), Editor (socket principal) | Sin JWT | Clase en vivo: slide-change, student-response, join-class |
| `/live` | Editor (socket secundario del torneo) | JWT del docente | Torneo: torneo:init, torneo:launch-question, torneo:finish |

**Regla de oro**: NUNCA mover el socket principal del viewer a `/live`. El viewer siempre usa `/` sin autenticación.

**Bridge backend**: El gateway `/live` reemite eventos del torneo al namespace `/` usando `this.server.server.to(classRoom).emit(...)` donde `classRoom = class-${classId}`.

---

## 4. ESTADO ACTUAL — FEATURES COMPLETADAS

### 4.1 Actividades (12 tipos)
- quiz_multiple, verdadero_falso, short_answer, completar_blancos
- arrastrar_soltar, emparejar, ordenar_pasos, video_interactivo
- encuesta_viva, nube_palabras, **torneo** ✅, **escape_room** ✅

### 4.2 Torneo de Preguntas ✅ FUNCIONAL
- `nota = max(1, min(5, puntosObtenidos / puntosMaximosPosibles * 4 + 1))`

### 4.3 Escape Room ✅ FUNCIONAL
- Editor 2.0 pendiente (roadmap mayor)

### 4.4 Editor UX — GRUPO 1 ✅ COMPLETO
- Drag-to-canvas, Smart Spacing Indicators, Selección múltiple + alignment toolbar
- Guías manuales persistentes, Slide Themes (6 predefinidos + personalizados)

### 4.5 Widgets Captivate — GRUPO 2 ✅ COMPLETO (5/5)

#### Flip Cards ✅
- Edición inline por tarjeta, toggle Frente/Reverso, 8 plantillas, flip CSS 3D
- Posición libre de título/cuerpo, panel contextual completo

#### Tabs ✅
- Pestañas FICHA 01…N, 4 layouts, edición inline, panel contextual
- Visibilidad por ficha individual

#### Carousel ✅
- Reutiliza ~80% de Tabs, dots + flechas internas + nav externo
- Transición slide | fade, visibilidad por página individual

#### Click to Reveal ✅
Widget de tarjetas disparadoras + modal por elemento. No evaluable.

**Concepto:** N tarjetas (triggers) visibles → clic en tarjeta → modal (overlay/solapar) con contenido enriquecido.

**Modelo de datos:**
```ts
ClickRevealWidget
├── tituloWidget, subtituloWidget, instruccion, estilosHeader
├── x, y, ancho, alto, zIndex
├── configuracion: ClickRevealConfiguracion
├── triggers: ClickRevealTrigger[]   // tarjetas clickeables
└── overlays: WidgetSlideContent[]   // contenido modal por índice
```

**ClickRevealTrigger:** etiqueta (01…N), titulo, colorFondo, imagen, toggles visibilidad
**ClickRevealConfiguracion:** numeroElementos (2–6), overlayActivo, efectoApertura (fade|instant|slide-up), colores, backdrop, defaultsTrigger/Overlay
**overlays[]:** reutiliza `WidgetSlideContent` — mismo modelo que Tabs/Carousel (encabezado, subtítulo, cuerpo, imagen, layoutId propio por overlay)

**Archivos:**
```
src/components/widgets/click-reveal/
├── click-reveal-config.ts
├── click-reveal-shared.tsx
├── click-reveal-parts.tsx
├── click-reveal-editor.tsx
├── click-reveal-viewer.tsx
├── click-reveal-properties.tsx
├── click-reveal-appearance-properties.tsx
├── click-reveal-inner-properties.tsx
└── click-reveal.module.css
src/lib/click-reveal-defaults.ts
```

**Panel de propiedades contextual:**

| Selección | Panel |
|-----------|-------|
| Widget | Nº elementos, toggles header/nav/cerrar, defaults visibilidad |
| Apariencia | Fondos, padding, backdrop, modal, efecto apertura, colores triggers |
| Tarjeta N | Visibilidad, texto, URL imagen, color fondo |
| Solapar N | Layout modal (independiente), componentes, URL imagen, colores/padding/radio |
| Texto/imagen inline | Tipografía y ajustes imagen (reutiliza props de slide) |

---

#### Timeline ✅ — completado 03/06/2026
Widget de línea de tiempo horizontal con nodos alternados arriba/abajo. No evaluable.

**Concepto:** N nodos sobre una línea horizontal central → cards alternadas arriba/abajo → cada card: etiqueta de fecha/periodo + cuerpo/descripción + imagen opcional.

**Layout visual:**
```
[Card 1]          [Card 3]          [Card 5]
   ●────────────────●────────────────●────────────────●────────────────●
                 [Card 2]                          [Card 4]
```

**Modelo de datos:**
```ts
TimelineWidget
├── tituloWidget, subtituloWidget, instruccion, estilosHeader
├── x, y, ancho, alto, zIndex
├── configuracion: TimelineConfiguracion
└── nodos: TimelineNodo[]

TimelineNodo
├── id: string
├── etiqueta: string          // fecha/periodo — ej. "1810", "Siglo XIX"
├── cuerpo: string
├── imagen?: string
├── estilosImagen?: FlipCardImageStyles
├── mostrarEtiqueta: boolean
├── mostrarCuerpo: boolean
└── mostrarImagen: boolean

TimelineConfiguracion
├── numeroNodos: number            // 4 defecto, 2–8
├── colorLinea: string
├── grosorLinea: number
├── colorNodo: string
├── radioNodo: number
├── colorCardFondo: string
├── colorCardBorde: string
├── radioCard: number
├── paddingCard: number
├── colorEtiqueta: string
├── colorCuerpo: string
├── colorFondoContenedor: string
├── alineacionInstruccion: string
├── mostrarConectorVertical: boolean
├── mostrarTituloWidget: boolean
├── mostrarSubtitulo: boolean
└── mostrarInstruccion: boolean
```

**Archivos:**
```
src/components/widgets/timeline/
├── timeline-config.ts
├── timeline-shared.tsx
├── timeline-parts.tsx
├── timeline-editor.tsx
├── timeline-viewer.tsx
├── timeline-properties.tsx
├── timeline-appearance-properties.tsx
├── timeline-inner-properties.tsx
└── timeline.module.css
src/lib/timeline-defaults.ts
```

**Layout interno:**
```
tlRoot (whRoot)
├── Header (título, subtítulo, instrucción)
└── whContent
    └── tlBody (flex column, flex:1)
        └── tlStage (flex:1, position:relative)
            ├── tlLine (línea horizontal absoluta, centro vertical)
            └── tlNodesRow (flex row, justify:space-around)
                └── tlNodeItem × N
                    ├── tlCardTop (card si índice impar, vacío si par)
                    ├── tlConnector (línea vertical nodo↔card)
                    ├── tlNodeDot (círculo)
                    ├── tlConnector (línea vertical nodo↔card)
                    └── tlCardBottom (card si índice par, vacío si impar)
```

**Comportamiento:**
- Alternado: índice impar → card arriba; índice par → card abajo
- Viewer: sin interacción, solo visualización
- Editor: `innerSelection` → `'widget'` | `'header'` | `{ tipo: 'nodo', index }` | `{ tipo: 'texto', nodoIndex, campo }` | `{ tipo: 'imagen', nodoIndex }`
- Clic en nodo → selección interna, highlight con `tlNodeSelected`
- Doble clic en etiqueta/cuerpo → textarea inline
- Thumbnail: sin interacción, `isThumbnail=true` bypasea hook de dimensiones
- `resizeTimelineNodos()` agrega/quita nodos preservando los existentes
- `normalizeTimelineWidget()` migra bloques legacy

**Panel de propiedades contextual:**

| Selección | Panel |
|-----------|-------|
| Widget / header | Nº nodos (2–8), toggles header, color línea, grosor, radio nodo, mostrarConectorVertical |
| Apariencia | Colores línea/nodo/card, padding, borde, radio, color textos, fondo contenedor |
| Nodo N | Toggles mostrarEtiqueta/mostrarCuerpo/mostrarImagen, texto etiqueta, textarea cuerpo, URL imagen |
| Texto/imagen inline | Delega a `widget-inner-properties` (vía `timeline-inner-properties.tsx`) |

**Integración:** `widget-registry.ts` (icono `GitCommitHorizontal`), `slide-renderer`, `canvas-area`, `properties-panel`, panel de actividades sección WIDGETS

**Nota de implementación:** `timeline-inner-properties.tsx` transforma `TimelineNodo` → `WidgetSlideContent` al vuelo para acoplar con la infraestructura shared. Patrón idéntico a `click-reveal-inner-properties.tsx`.

---

#### Capa compartida — `src/components/widgets/shared/` ✅
| Módulo | Responsabilidad |
|--------|----------------|
| `widget-chrome.module.css` | Root, header, nav, highlight interno |
| `widget-slide-panel.module.css` + `.tsx` | Panel de slide editor/viewer |
| `widget-container-styles.ts` | Fondo, padding, variables CSS |
| `widget-editor-utils.ts` | Draft fields, textarea, stopPropagation |
| `widget-header-viewer.tsx` / `widget-header-editor.tsx` | Header unificado |
| `widget-inner-properties.tsx` | Propiedades texto/imagen por slide |
| `widget-layouts.ts` / `widget-layout-gallery.tsx` | Layouts compartidos |
| `widget-image-styles.ts` | Sistema de imagen con dimensiones en px |
| `use-widget-image-dimensions.ts` | Hook ResizeObserver multi-ancestro |

#### Sistema de imagen — reglas críticas
- NUNCA usar `object-fit: cover` + `transform: scale()` juntos
- NUNCA mezclar clases CSS con `width/height: 100%` e inline con px
- SIEMPRE usar `wspImagePlaced`/`flipImagePlaced` en modo calculado
- SIEMPRE usar `wspImageFit`/`flipImageFit` en fallback y miniaturas
- `use-widget-image-dimensions`: ResizeObserver multi-ancestro + remediciones a 0/100/300ms

---

## 5. TIPOS RELEVANTES

### TimelineWidget (widget.types.ts)
```ts
export interface TimelineNodo {
  id: string
  etiqueta: string
  cuerpo: string
  imagen?: string
  estilosImagen?: FlipCardImageStyles
  mostrarEtiqueta: boolean
  mostrarCuerpo: boolean
  mostrarImagen: boolean
}

export interface TimelineConfiguracion {
  numeroNodos: number
  colorLinea: string
  grosorLinea: number
  colorNodo: string
  radioNodo: number
  colorCardFondo: string
  colorCardBorde: string
  radioCard: number
  paddingCard: number
  colorEtiqueta: string
  colorCuerpo: string
  colorFondoContenedor: string
  alineacionInstruccion: string
  mostrarConectorVertical: boolean
  mostrarTituloWidget: boolean
  mostrarSubtitulo: boolean
  mostrarInstruccion: boolean
}

export interface TimelineWidget {
  tipo: 'timeline'
  tituloWidget: string
  subtituloWidget: string
  instruccion: string
  estilosHeader?: WidgetHeaderStyles
  x: number; y: number; ancho: number; alto: number; zIndex: number
  configuracion: TimelineConfiguracion
  nodos: TimelineNodo[]
}
```

### ClickRevealWidget (widget.types.ts)
```ts
export interface ClickRevealWidget {
  tipo: 'click-reveal'
  tituloWidget: string
  subtituloWidget: string
  instruccion: string
  estilosHeader?: WidgetHeaderStyles
  x: number; y: number; ancho: number; alto: number; zIndex: number
  configuracion: ClickRevealConfiguracion
  triggers: ClickRevealTrigger[]
  overlays: WidgetSlideContent[]
}

export interface ClickRevealTrigger {
  etiqueta: string
  titulo: string
  colorFondo: string
  imagen?: string
  mostrarImagen: boolean
  mostrarEtiqueta: boolean
  mostrarTitulo: boolean
  estilosImagen?: FlipCardImageStyles
}

export interface ClickRevealConfiguracion {
  numeroElementos: number
  overlayActivo: number
  efectoApertura: 'fade' | 'instant' | 'slide-up'
  colorFondoContenedor: string
  colorBackdrop: string
  opacidadBackdrop: number
  colorFondoModal: string
  paddingModal: number
  radioModal: number
  mostrarBotonCerrar: boolean
  mostrarBotonAnterior: boolean
  mostrarBotonSiguiente: boolean
  mostrarTituloWidget: boolean
  mostrarSubtitulo: boolean
  mostrarInstruccion: boolean
  defaultsTrigger: { mostrarImagen: boolean; mostrarEtiqueta: boolean; mostrarTitulo: boolean }
  defaultsOverlay: { mostrarImagen: boolean; mostrarEncabezado: boolean; mostrarCuerpo: boolean }
}
```

### FlipCardsWidget (slide.types.ts)
```ts
export interface FlipCardsWidget {
  tipo: 'flip-cards'
  configuracion: {
    columnas: 2 | 3 | 4
    colorFondoContenedor: string
    colorFrente: string; colorReverso: string
    mostrarTituloWidget: boolean; mostrarSubtitulo: boolean
    mostrarInstruccion: boolean; mostrarNavegacion: boolean
    espacioEntreTarjetas: number; paddingContenedor: number
    plantillaId?: string; borde?: boolean; sombra?: boolean
    visibilidadDefecto: {
      frente: { imagen: boolean; titulo: boolean; cuerpo: boolean }
      reverso: { imagen: boolean; titulo: boolean; cuerpo: boolean }
    }
  }
  tituloWidget: string; subtituloWidget: string; instruccion: string
  tarjetas: FlipCard[]
}
```

### SlideTheme (slide.types.ts)
```ts
export interface SlideTheme {
  id: string; nombre: string; esPersonalizado: boolean
  fondo: Background; fuente: string
  colores: { texto: string; textoSecundario: string; acento: string; fondo: string }
}
```

---

## 6. ROADMAP

### GRUPO 2 — Widgets Captivate ✅ COMPLETO
- [x] Flip Cards ✅
- [x] Tabs ✅
- [x] Carousel ✅
- [x] Click to Reveal ✅
- [x] Timeline ✅

### GRUPO 3 — Animaciones/Transiciones ← SIGUIENTE
- [ ] Animaciones de entrada/salida por elemento
- [ ] Transiciones entre slides
- Referencia Captivate: triggers (clic, hover, retirada puntero), animaciones (aumento progresivo, escala, estiramiento, remolino, articulación, corte, deslizamiento, rebote, giro, inclinación, oscilación, soplido, parpadeo) con Duración, Valor, Retraso

### GRUPO 4 — Actividades nuevas
- [ ] Historia ramificada (Twine-style)
- [ ] 15 actividades Wordwall-style

### GRUPO 5 — Plataforma
- [ ] Gamificación
- [ ] Importar PPT

### GRUPO 6 — Lumina 2.0 Community
- [ ] Repositorio público, fork protection, perfiles docentes
- [ ] Búsqueda alineada DBA/EBC, co-autoría

### ESCAPE ROOM 2.0 (Roadmap Mayor)
- Narrativa ramificada, mapa global, canvas libre por sala, actividades embebidas

---

## 7. ARCHIVOS CLAVE

### Widgets — estructura completa
```
src/components/widgets/
├── shared/                          # capa compartida (9 módulos)
├── flip-cards/                      # 14 archivos
├── tabs/                            # 10 archivos
├── carousel/                        # 8 archivos
├── click-reveal/                    # 9 archivos
└── timeline/                        # 9 archivos

src/lib/
├── flip-cards-defaults.ts
├── tabs-defaults.ts
├── carousel-defaults.ts
├── click-reveal-defaults.ts
└── timeline-defaults.ts

src/types/
├── slide.types.ts      — FlipCard, FlipCardCara, FlipCardsWidget, Block union
└── widget.types.ts     — TabsWidget, CarouselWidget, ClickRevealWidget, TimelineWidget, CaptivateWidget
```

### Integraciones editor
- `slide-renderer.tsx` — cases flip-cards, tabs, carousel, click-reveal, timeline
- `canvas-area.tsx` — selección interna por widget
- `properties-panel.tsx` — panel contextual por widget
- `editor-dnd-shell.tsx` — drop tipo widget
- `use-block-drag.ts` — arrastre de bloques widget
- `widget-registry.ts` — registro de tipos widget (incluye timeline con icono GitCommitHorizontal)

---

## 8. NOTAS TÉCNICAS

### PostgreSQL
- Docker: `lumina_postgres`, puerto **5434**
- Local Windows: puerto 5432 (no usar)

### Redis
- Docker: `lumina_redis`, puerto **6380**
- Iniciar con: `docker start lumina_redis`

### Convención de rooms Socket.IO
- Namespace `/`: room = `class-${classId}`
- Namespace `/live`: room = `live:${classId}`

### Torneo — Cálculo de nota
```ts
const nota = Math.min(5, Math.max(1, (puntosObtenidos / puntosMaximosPosibles) * 4 + 1))
```

### Flip Cards — CSS 3D (NO MODIFICAR)
```css
.fcRoot { perspective: 1000px; }
.fcInner { transform-style: preserve-3d; transition: transform 0.5s ease; }
.fcInner.flipped { transform: rotateY(180deg); }
.fcFront, .fcBack { backface-visibility: hidden; }
.fcBack { transform: rotateY(180deg); }
```

### Sistema de imagen — regla crítica
NUNCA `object-fit` + `scale()` juntos. SIEMPRE `getImageStyle()` con dimensiones reales.
`wspImagePlaced`/`flipImagePlaced` en modo calculado.
`wspImageFit`/`flipImageFit` en fallback y miniaturas.

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V32.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V32.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
