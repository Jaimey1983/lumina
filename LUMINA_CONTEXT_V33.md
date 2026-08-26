# LUMINA_CONTEXT_V33.md
> Generado: 04/06/2026 — Sesión 04/06/2026
> Reemplaza: LUMINA_CONTEXT_V32.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V33.md antes de empezar."
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

**Modelo de datos:**
```ts
ClickRevealWidget
├── tituloWidget, subtituloWidget, instruccion, estilosHeader
├── x, y, ancho, alto, zIndex
├── configuracion: ClickRevealConfiguracion
├── triggers: ClickRevealTrigger[]
└── overlays: WidgetSlideContent[]
```

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

#### Timeline ✅ — completado 03/06/2026
Widget de línea de tiempo horizontal con nodos alternados arriba/abajo. No evaluable.

**Modelo de datos:**
```ts
TimelineWidget
├── tituloWidget, subtituloWidget, instruccion, estilosHeader
├── x, y, ancho, alto, zIndex
├── configuracion: TimelineConfiguracion
└── nodos: TimelineNodo[]
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

**Integración:** `widget-registry.ts` (icono `GitCommitHorizontal`), `slide-renderer`, `canvas-area`, `properties-panel`, panel de actividades sección WIDGETS

#### Capa compartida — `src/components/widgets/shared/` ✅
| Módulo | Responsabilidad |
|--------|----------------|
| `widget-header.tsx` | Título / subtítulo / instrucción |
| `widget-slide-content.tsx` | Contenido enriquecido (encabezado, cuerpo, imagen) |
| `widget-image.tsx` | Imagen con `getCoverScale()` |
| `widget-inner-properties.tsx` | Props inline texto/imagen |
| `use-widget-image-dimensions.ts` | ResizeObserver + dimensiones reales |
| `widget-shared.module.css` | Clases compartidas (`wspImage*`) |

---

### 4.6 Animaciones y Transiciones — GRUPO 3 🚧 EN CURSO

#### Arquitectura aprobada — 04/06/2026

**Scope completo:**
- Animaciones de entrada / salida / énfasis por elemento (todos los tipos de bloque)
- Triggers: `auto` (al aparecer el slide) | `click` | `hover`
- Múltiples animaciones en secuencia por bloque (estilo PowerPoint)
- Delay individual configurable por animación
- Transiciones entre slides (9 tipos)
- Configuración en panel de propiedades del elemento (nueva pestaña "Animaciones")

#### Tipos (animation.types.ts)

```ts
export type AnimacionTipo =
  | 'fade-in' | 'fade-out'
  | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom-in' | 'zoom-out'
  | 'bounce' | 'spin' | 'shake' | 'pulse'
  | 'flip-x' | 'flip-y'
  | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down'

export type AnimacionTrigger = 'auto' | 'click' | 'hover'
export type AnimacionMomento = 'entrada' | 'salida' | 'enfasis'
export type AnimacionEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'

export interface Animacion {
  id: string
  tipo: AnimacionTipo
  momento: AnimacionMomento
  trigger: AnimacionTrigger
  duracion: number      // ms, default 400
  delay: number         // ms, default 0
  iteraciones: number   // 1 = una vez | -1 = infinito
  easing: AnimacionEasing
}

export type TransicionTipo =
  | 'none' | 'fade'
  | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom' | 'flip' | 'cube'

export interface TransicionSlide {
  tipo: TransicionTipo
  duracion: number   // ms, default 500
}
```

**Cambios en tipos existentes:**
```ts
// slide.types.ts
// Block: añadir → animaciones?: Animacion[]
// Slide: añadir  → transicion?: TransicionSlide
```

#### Estructura de archivos (completa al terminar Grupo 3)

```
src/
├── types/
│   └── animation.types.ts                    ← NUEVO (Fase A)
├── styles/
│   └── lumina-animations.css                 ← NUEVO (Fase A) — keyframes globales
├── lib/
│   └── animation-defaults.ts                 ← NUEVO (Fase A)
├── hooks/
│   └── use-block-animations.ts               ← NUEVO (Fase C)
└── components/
    ├── editor/
    │   ├── properties-panel.tsx              ← MODIFICAR (Fase B — pestaña Animaciones)
    │   └── slide-renderer.tsx                ← MODIFICAR (Fase C — transición de slide)
    └── animations/                           ← NUEVO (Fase B)
        ├── animation-panel.tsx
        ├── animation-list.tsx
        ├── animation-item.tsx
        ├── animation-picker.tsx
        ├── animation-preview.tsx
        └── transition-panel.tsx
```

#### Plan de fases

| Fase | Contenido | Estado |
|------|-----------|--------|
| **A** | `animation.types.ts` + `animation-defaults.ts` + `lumina-animations.css` + extensión de `Block`/`Slide` | 🚧 Prompt generado |
| **B** | Panel de propiedades — pestaña Animaciones, `animation-list`, `animation-item`, `animation-picker`, `animation-preview`, `transition-panel` | ⏳ Pendiente |
| **C** | `use-block-animations.ts` + integración viewer + transiciones entre slides | ⏳ Pendiente |

#### Notas de implementación

- **Sin nuevas dependencias**: implementación 100% CSS keyframes + clases dinámicas. No añadir framer-motion ni librerías de animación.
- **Reorder de animaciones**: usa `@dnd-kit/core` ya instalado.
- **Énfasis iteraciones**: valor `-1` = `animation-iteration-count: infinite` en CSS.
- **Secuencia de animaciones**: el hook calcula el delay acumulado (`delay_n = delay_configurado + sum(duracion_animaciones_anteriores)`).
- **Transiciones entre slides**: el componente de navegación del viewer aplica clases `lumina-trans-*` al contenedor del slide durante el cambio.
- **Flip Cards — NO interferir**: el sistema de animaciones NO debe tocar `perspective`, `transform-style: preserve-3d`, ni `.fcInner`. Las animaciones de entrada/salida del bloque widget se aplican al contenedor externo del bloque, no al interior del widget.

---

## 5. MODELO DE DATOS COMPLETO

### Block (slide.types.ts) — extracto relevante
```ts
export interface Block {
  id: string
  tipo: 'texto' | 'imagen' | 'figura' | 'video' | 'gif' | 'widget'
  x: number; y: number
  ancho: number; alto: number
  zIndex: number
  // ... resto de campos según tipo
  animaciones?: import('@/types/animation.types').Animacion[]   // ← NUEVO Grupo 3
}

export interface Slide {
  id: string
  orden: number
  fondo: Background
  bloques: Block[]
  transicion?: import('@/types/animation.types').TransicionSlide  // ← NUEVO Grupo 3
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

### GRUPO 3 — Animaciones/Transiciones 🚧 EN CURSO
- [x] Arquitectura diseñada ✅
- [x] Prompt Fase A generado ✅
- [ ] Fase A: tipos + CSS (en ejecución)
- [ ] Fase B: panel de propiedades — pestaña Animaciones
- [ ] Fase C: viewer — ejecución de animaciones + transiciones entre slides

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

### Animaciones — estructura completa (al finalizar Grupo 3)
```
src/types/animation.types.ts
src/styles/lumina-animations.css
src/lib/animation-defaults.ts
src/hooks/use-block-animations.ts
src/components/animations/
├── animation-panel.tsx
├── animation-list.tsx
├── animation-item.tsx
├── animation-picker.tsx
├── animation-preview.tsx
└── transition-panel.tsx
```

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
├── timeline-defaults.ts
└── animation-defaults.ts            ← NUEVO Grupo 3

src/types/
├── slide.types.ts      — FlipCard, FlipCardCara, FlipCardsWidget, Block union
├── widget.types.ts     — TabsWidget, CarouselWidget, ClickRevealWidget, TimelineWidget, CaptivateWidget
└── animation.types.ts  — Animacion, TransicionSlide, tipos ← NUEVO Grupo 3
```

### Integraciones editor
- `slide-renderer.tsx` — cases flip-cards, tabs, carousel, click-reveal, timeline
- `canvas-area.tsx` — selección interna por widget
- `properties-panel.tsx` — panel contextual por widget (Fase B: + pestaña Animaciones)
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

### Animaciones — regla crítica
NUNCA aplicar animaciones de bloque al interior de widgets (especialmente Flip Cards).
Las clases `lumina-anim-*` se aplican SIEMPRE al contenedor externo del bloque canvas, nunca a elementos internos del widget.

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V33.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V33.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
