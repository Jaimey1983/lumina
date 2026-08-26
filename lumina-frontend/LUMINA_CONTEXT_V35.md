# LUMINA_CONTEXT_V35.md
> Generado: 05/06/2026 — Sesión 05/06/2026
> Reemplaza: LUMINA_CONTEXT_V34.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V35.md antes de empezar."
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

### 4.6 Animaciones y Transiciones — GRUPO 3 ✅ COMPLETO — 04/06/2026

#### Scope implementado
- 18 tipos de animación: fade-in/out, slide (4 dirs), zoom-in/out, bounce, spin, shake, pulse, flip-x/y, wipe (4 dirs)
- Triggers: `auto` | `click` | `hover`
- Múltiples animaciones en secuencia por bloque — estilo PowerPoint
- Delay individual por animación (ms) + easing configurable
- Transiciones entre slides: 9 tipos (none, fade, slide-left/right/up/down, zoom, flip, cube)
- Pestaña "Animaciones" en el panel de propiedades para todos los bloques y widgets

#### Tipos (`src/types/animation.types.ts`)

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
  iteraciones: number   // 1 = una vez | -1 = infinito (énfasis)
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

**Cambios en `slide.types.ts`:**
```ts
// Block: animaciones?: Animacion[]
// Slide: transicion?: TransicionSlide
```

#### Archivos del sistema de animaciones

```
src/types/animation.types.ts
src/styles/lumina-animations.css              ← keyframes globales; importado desde globals.css
src/lib/animation-defaults.ts                 ← createDefaultAnimacion, createDefaultTransicion,
                                                 ANIMACION_PRESETS, TRANSICION_PRESETS
src/hooks/use-block-animations.ts             ← ejecuta animaciones por bloque en el viewer
src/hooks/use-slide-transition.ts             ← ciclo idle → exiting → entering
src/components/animations/
├── animation-panel.tsx                       ← orquestador pestaña
├── animation-list.tsx                        ← lista con DnD (@dnd-kit/sortable)
├── animation-item.tsx                        ← fila editable
├── animation-picker.tsx                      ← grid de presets
└── transition-panel.tsx                      ← selector transición del slide
src/components/viewer/slide-transition.module.css
```

#### Integraciones realizadas

| Archivo | Cambio |
|---------|--------|
| `properties-panel.tsx` | Props `slide` + `onApplySlide`; tab bar Propiedades/Animaciones; `AnimationPanel` en los 5 widgets |
| `canvas-area.tsx` | Pasa `slide` + `onApplySlide` al panel; `buildContentPayload` incluye `transicion` |
| `class-slide-normalize.ts` | Lee `transicion` del JSON del slide al cargar |
| `slide-renderer.tsx` | `BlockNode` integra `useBlockAnimations(blockRef, block.animaciones, isViewerMode)` |
| `viewer-client.tsx` | `useSlideTransition` + clases CSS dinámicas en contenedor del slide |
| `present-client.tsx` | Misma lógica de transición para modo presentación del docente |

#### Notas críticas de implementación

- **Sin nuevas dependencias**: CSS keyframes puros. No se añadió framer-motion.
- **Flip Cards — NO interferir**: `blockRef` se aplica al contenedor externo. NUNCA tocar `perspective`, `transform-style: preserve-3d`, ni `.fcInner`.
- **Énfasis infinito**: `iteraciones: -1` → `animation-iteration-count: infinite`. El style no se limpia.
- **Secuencia**: offset acumulado por momento → `offset[momento] += delay_configurado + duracion_anterior`.
- **Editor**: `isViewerMode = false` siempre en el editor — las animaciones no se ejecutan al editar.
- **CSS global**: `src/styles/globals.css` → `@import './lumina-animations.css'`.

---

## 5. GRUPO 4 — ACTIVIDADES NUEVAS (EN PROGRESO)

### 5.1 Decisiones de arquitectura

- **Posición en el sistema**: actividades de slide — igual que `quiz_multiple`, `torneo`, `escape_room`. NO son widgets canvas.
- **Excepción**: `historia_ramificada` ocupa el slide completo (como `escape_room`).
- **Registry**: unificado al `activity-registry` existente, con secciones internas comentadas por grupo.
- **Actividad piloto**: `clasificar` — primera en implementarse, define el patrón del Grupo 4.
- **Historia ramificada**: usa `react-flow` para el editor de grafo.
- **Scoring**: fórmula colombiana unificada `nota = Math.min(5, Math.max(1, (correctas / total) * 4 + 1))`.
- **`emparejar`**: se actualiza con soporte de imágenes (no actividad nueva).
- **`laberinto`**: pendiente — diseño individual en sesión aparte.

### 5.2 Catálogo completo (13 actividades)

#### Familia A — Grid/Board
| Tipo | Evaluable | Estado |
|------|-----------|--------|
| `clasificar` | ✅ | 🔴 PILOTO — Fase 4A |
| `memoria` | ✅ | Fase 4A |
| `puzzle_imagen` | ✅ | Fase 4A |
| `sopa_letras` | ✅ | Fase 4C |
| `crucigrama` | ✅ | Fase 4C |

#### Familia B — Arcade/Tiempo real
| Tipo | Evaluable | Estado |
|------|-----------|--------|
| `globos` | ✅ | Fase 4D |
| `topo` | ✅ | Fase 4D |
| `ruleta` | ❌ | Fase 4D |

#### Familia C — Lingüístico
| Tipo | Evaluable | Estado |
|------|-----------|--------|
| `anagrama` | ✅ | Fase 4B |
| `puzzle_palabras` | ✅ | Fase 4B |
| `abrir_caja` | ⚙️ opcional | Fase 4B |
| `orden_rango` | ✅ | Fase 4G |

#### Familia D — Narrativo
| Tipo | Evaluable | Estado |
|------|-----------|--------|
| `historia_ramificada` | ⚙️ configurable | Fase 4E |

### 5.3 Modelos de datos

#### `clasificar`
```ts
interface ClasificarActivity {
  tipo: 'clasificar'
  configuracion: {
    columnas: 2 | 3 | 4
    colorCategorias: string[]
    permitirReintento: boolean
  }
  categorias: { id: string; nombre: string; imagen?: string }[]
  items: { id: string; texto: string; imagen?: string; categoriaId: string }[]
}
```

#### `memoria`
```ts
interface MemoriaActivity {
  tipo: 'memoria'
  configuracion: {
    columnas: 2 | 3 | 4
    tiempoVolteo: number   // ms antes de voltear si no hay match
    colorDorso: string
    mostrarTimer: boolean
  }
  pares: {
    id: string
    lado1: { texto?: string; imagen?: string }
    lado2: { texto?: string; imagen?: string }
  }[]
}
```

#### `puzzle_imagen`
```ts
interface PuzzleImagenActivity {
  tipo: 'puzzle_imagen'
  configuracion: {
    filas: 3 | 4 | 5
    columnas: 3 | 4 | 5
    mostrarVista: boolean   // miniatura de referencia
    dificultad: 'facil' | 'medio' | 'dificil'
  }
  imagen: string            // URL Cloudinary
}
```

#### `sopa_letras`
```ts
interface SopaLetrasActivity {
  tipo: 'sopa_letras'
  configuracion: {
    filas: number          // 10–20
    columnas: number       // 10–20
    direcciones: ('horizontal' | 'vertical' | 'diagonal')[]
    tema: string
    mostrarLista: boolean
  }
  palabras: { texto: string; pista?: string }[]
  grid?: string[][]        // generado automáticamente al guardar
}
```

#### `crucigrama`
```ts
interface CrucigramaActivity {
  tipo: 'crucigrama'
  configuracion: {
    tamanoCelda: number
    colorCelda: string
    colorTexto: string
  }
  palabras: {
    id: string
    texto: string
    pista: string
    direccion: 'horizontal' | 'vertical'
    fila: number
    columna: number
  }[]
}
```

#### `globos`
```ts
interface GlobosActivity {
  tipo: 'globos'
  configuracion: {
    velocidad: 'lenta' | 'normal' | 'rapida'
    vidas: number
    tiempoLimite: number
    colorGlobos: string[]
  }
  preguntas: {
    id: string
    enunciado: string
    opciones: { texto: string; correcta: boolean }[]
  }[]
}
```

#### `topo`
```ts
interface TopoActivity {
  tipo: 'topo'
  configuracion: {
    velocidad: 'lenta' | 'normal' | 'rapida'
    vidas: number
    tiempoLimite: number
    filas: 2 | 3
    columnas: 3 | 4
  }
  preguntas: {
    id: string
    enunciado: string
    opciones: { texto: string; correcta: boolean }[]
  }[]
}
```

#### `ruleta`
```ts
interface RuletaActivity {
  tipo: 'ruleta'
  configuracion: {
    colores: string[]
    sonido: boolean
    duracionGiro: number
    mostrarGanador: boolean
  }
  items: { id: string; texto: string }[]
}
```

#### `anagrama`
```ts
interface AnagramaActivity {
  tipo: 'anagrama'
  configuracion: {
    mostrarPista: boolean
    tiempoLimite?: number
    intentos: number
  }
  palabras: { texto: string; pista?: string; imagen?: string }[]
}
```

#### `puzzle_palabras`
```ts
interface PuzzlePalabrasActivity {
  tipo: 'puzzle_palabras'
  configuracion: {
    mostrarPista: boolean
    permitirReintento: boolean
  }
  oraciones: { texto: string; pista?: string }[]  // texto se tokeniza automáticamente
}
```

#### `abrir_caja`
```ts
interface AbrirCajaActivity {
  tipo: 'abrir_caja'
  configuracion: {
    filas: 2 | 3
    columnas: 2 | 3 | 4
    colorCaja: string
    animacionApertura: 'flip' | 'zoom' | 'fade'
  }
  cajas: {
    id: string
    etiqueta: string
    contenido: { texto?: string; imagen?: string; esCorrecta?: boolean }
  }[]
}
```

#### `orden_rango`
```ts
interface OrdenRangoActivity {
  tipo: 'orden_rango'
  configuracion: {
    direccion: 'ascendente' | 'descendente'
    criterio: string
    mostrarFeedback: boolean
  }
  items: { id: string; texto: string; imagen?: string; orden: number }[]
}
```

#### `historia_ramificada`
```ts
interface HistoriaRamificadaActivity {
  tipo: 'historia_ramificada'
  configuracion: {
    mostrarProgreso: boolean
    permitirRetroceder: boolean
    tema: 'neutro' | 'aventura' | 'ciencia' | 'historia'
    fondoGlobal?: Background
  }
  nodoInicial: string
  nodos: HistoriaNodo[]
  conexiones: HistoriaConexion[]
}

interface HistoriaNodo {
  id: string
  tipo: 'narracion' | 'decision' | 'pregunta' | 'final_bueno' | 'final_malo'
  titulo?: string
  contenido: { texto?: string; imagen?: string; video?: string }
  opciones?: {
    id: string
    texto: string
    esCorrecta?: boolean
    feedback?: string
  }[]
  editorX: number
  editorY: number
}

interface HistoriaConexion {
  id: string
  desdeNodoId: string
  opcionId: string
  haciaNodoId: string
}
```

### 5.4 Capa compartida — `src/components/activities/shared/`

```
src/components/activities/shared/
├── activity-timer.tsx          ← cronómetro reutilizable (globos, topo, memoria)
├── activity-score.tsx          ← marcador de puntos reutilizable
├── activity-lives.tsx          ← vidas (globos, topo)
├── activity-grid.tsx           ← cuadrícula base familia A
├── activity-drag-word.tsx      ← pieza de palabra draggable (familia C)
└── activity-result-overlay.tsx ← pantalla de resultado final unificada
```

### 5.5 Fases de implementación

```
FASE 4A — Fundamentos + Alta prioridad          ← ACTUAL
  ├── shared/activity-grid.tsx
  ├── shared/activity-result-overlay.tsx
  ├── clasificar  ← PILOTO
  ├── memoria
  └── puzzle_imagen

FASE 4B — Lingüístico
  ├── shared/activity-drag-word.tsx
  ├── anagrama
  ├── puzzle_palabras
  └── abrir_caja

FASE 4C — Grid complejo
  ├── sopa_letras (algoritmo de generación automática)
  └── crucigrama (algoritmo de layout)

FASE 4D — Arcade
  ├── shared/activity-timer.tsx
  ├── shared/activity-lives.tsx
  ├── globos
  ├── topo
  └── ruleta

FASE 4E — Historia Ramificada
  ├── react-flow (editor de grafo)
  ├── motor de navegación viewer
  └── integración slide completo

FASE 4F — Emparejar con imágenes
  └── actualizar actividad existente `emparejar`

FASE 4G — orden_rango
  └── orden_rango
```

### 5.6 Scoring unificado Grupo 4

```ts
// Actividades con respuestas correctas/incorrectas
nota = Math.min(5, Math.max(1, (correctas / total) * 4 + 1))

// Actividades de tiempo/puntos (globos, topo)
nota = Math.min(5, Math.max(1, (puntosObtenidos / puntosMaximos) * 4 + 1))

// No evaluables: ruleta
// Evaluación opcional: abrir_caja (si esCorrecta definido), historia_ramificada (configurable)
```

### 5.7 Estructura de archivos por actividad

```
src/components/activities/
├── shared/                          ← capa compartida (6 módulos)
├── clasificar/
│   ├── clasificar-config.ts
│   ├── clasificar-editor.tsx
│   ├── clasificar-viewer.tsx
│   ├── clasificar-properties.tsx
│   └── clasificar.module.css
├── memoria/
├── puzzle-imagen/
├── sopa-letras/
├── crucigrama/
├── globos/
├── topo/
├── ruleta/
├── anagrama/
├── puzzle-palabras/
├── abrir-caja/
├── orden-rango/
└── historia-ramificada/
    ├── historia-ramificada-config.ts
    ├── historia-ramificada-editor.tsx        ← editor de grafo (react-flow)
    ├── historia-ramificada-node-editor.tsx   ← editor por nodo
    ├── historia-ramificada-viewer.tsx
    ├── historia-ramificada-properties.tsx
    └── historia-ramificada.module.css

src/lib/
├── clasificar-defaults.ts
├── memoria-defaults.ts
├── puzzle-imagen-defaults.ts
└── ... (un defaults.ts por actividad)
```

---

## 6. MODELO DE DATOS COMPLETO

### Block y Slide (`slide.types.ts`)
```ts
export interface Block {
  id: string
  tipo: 'texto' | 'imagen' | 'figura' | 'video' | 'gif' | 'widget'
  x: number; y: number
  ancho: number; alto: number
  zIndex: number
  animaciones?: import('@/types/animation.types').Animacion[]
}

export interface Slide {
  id: string
  orden: number
  fondo: Background
  bloques: Block[]
  transicion?: import('@/types/animation.types').TransicionSlide
}
```

### FlipCardsWidget (`slide.types.ts`)
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

### SlideTheme (`slide.types.ts`)
```ts
export interface SlideTheme {
  id: string; nombre: string; esPersonalizado: boolean
  fondo: Background; fuente: string
  colores: { texto: string; textoSecundario: string; acento: string; fondo: string }
}
```

---

## 7. ROADMAP

### GRUPO 1 — Editor UX ✅ COMPLETO
### GRUPO 2 — Widgets Captivate ✅ COMPLETO (5/5)
### GRUPO 3 — Animaciones/Transiciones ✅ COMPLETO
### GRUPO 4 — Actividades nuevas 🔴 EN PROGRESO (Fase 4A)

### GRUPO 5 — Plataforma
- [ ] Gamificación
- [ ] Importar PPT

### GRUPO 6 — Lumina 2.0 Community
- [ ] Repositorio público, fork protection, perfiles docentes
- [ ] Búsqueda alineada DBA/EBC, co-autoría

### ESCAPE ROOM 2.0 (Roadmap Mayor)
- Narrativa ramificada, mapa global, canvas libre por sala, actividades embebidas

### IDEAS PENDIENTES (sin fase asignada)
- `laberinto` — diseño individual en sesión aparte
- Breakout Rooms
- Team Mechanics
- Chat dual-purpose
- Actividad Evaluación (documento evaluativo estructurado con texto, imágenes y actividades embebidas)
- Clipping masks estilo Canva (backlog bajo)

---

## 8. ARCHIVOS CLAVE

### Animaciones — completo
```
src/types/animation.types.ts
src/styles/lumina-animations.css
src/lib/animation-defaults.ts
src/hooks/use-block-animations.ts
src/hooks/use-slide-transition.ts
src/components/animations/
├── animation-panel.tsx
├── animation-list.tsx
├── animation-item.tsx
├── animation-picker.tsx
└── transition-panel.tsx
src/components/viewer/slide-transition.module.css
```

### Widgets — completo
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
└── animation-defaults.ts

src/types/
├── slide.types.ts
├── widget.types.ts
└── animation.types.ts
```

### Integraciones editor y viewer
- `slide-renderer.tsx` — `BlockNode` con `useBlockAnimations`; cases flip-cards, tabs, carousel, click-reveal, timeline
- `canvas-area.tsx` — pasa `slide` + `onApplySlide` al panel; `buildContentPayload` incluye `transicion`
- `properties-panel.tsx` — panel contextual + pestaña Animaciones global
- `class-slide-normalize.ts` — normaliza `transicion` al cargar
- `viewer-client.tsx` — transiciones entre slides
- `present-client.tsx` — transiciones en modo presentación docente
- `editor-dnd-shell.tsx` — drop tipo widget
- `use-block-drag.ts` — arrastre de bloques widget
- `widget-registry.ts` — registro de tipos widget (timeline: icono `GitCommitHorizontal`)

---

## 9. NOTAS TÉCNICAS

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
`useBlockAnimations` y el `blockRef` se aplican SIEMPRE al contenedor externo del bloque canvas.

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 10. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V35.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V35.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
