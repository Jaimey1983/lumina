# LUMINA_CONTEXT_V30.md
> Generado: 31/05/2026 — Sesión 31/05/2026
> Reemplaza: LUMINA_CONTEXT_V29.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V30.md antes de empezar."
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor.
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
- encuesta_viva, nube_palabras
- **torneo** ✅
- **escape_room** ✅

### 4.2 Torneo de Preguntas ✅ FUNCIONAL
- Modo clase en vivo y modo autónomo completos
- `nota = max(1, min(5, puntosObtenidos / puntosMaximosPosibles * 4 + 1))`

### 4.3 Escape Room ✅ FUNCIONAL
- Actividad autónoma con salas, pistas, intentos, timer global
- Editor 2.0 pendiente (roadmap mayor)

### 4.4 Vista previa ✅
- `/classes/[id]/preview` — viewer completo sin socket ni sesión

### 4.5 Detalles de clase ✅
- `/classes/[id]` — carrusel estático con `pointer-events-none`

### 4.6 Editor UX — GRUPO 1 ✅ COMPLETO
- Drag-to-canvas via `@dnd-kit/core`
- Smart Spacing Indicators (líneas azules + verde para espaciado uniforme)
- Selección múltiple + alignment toolbar (6 alineaciones + 2 distribuciones)
- Guías manuales persistentes (reglas horizontal/vertical, drag desde regla)
- Slide Themes (6 predefinidos + temas personalizados)

### 4.7 Widgets Captivate — GRUPO 2 (parcial) ✅

#### Flip Cards ✅ COMPLETO
Widget no evaluable tipo Captivate. 13 archivos en `src/components/widgets/flip-cards/`.
- Edición inline en canvas con selección interna por tarjeta
- Toggle [Frente | Reverso] dentro de cada tarjeta
- 8 plantillas visuales
- Tipografía e imagen avanzados
- Posición libre de título y cuerpo por drag
- Viewer con flip CSS 3D y paginación
- Panel contextual (global / tarjeta / texto / imagen)

#### Tabs ✅ COMPLETO
Widget de pestañas tipo Captivate.
- Header editable inline: título, subtítulo, instrucción
- Barra de pestañas (FICHA 01, 02, 03…)
- Contenido por ficha: imagen + encabezado + subtítulo + cuerpo
- 4 layouts: imagen izquierda, imagen derecha, texto sobre imagen, solo texto
- Panel contextual: tipografía, imagen, por ficha, global
- Drag de textos con asa azul en layout overlay
- Colores configurables: pestaña activa/inactiva, borde, botones nav
- Visibilidad por ficha individual + visibilidad por defecto global
- Viewer funcional con navegación

#### Carousel ✅ COMPLETO
Widget de carrusel tipo Captivate. Reutiliza ~80% de Tabs.
- Mismos layouts que Tabs (imagen izq, imagen der, overlay, solo texto)
- Navegación: dots, flechas internas, botones externos, etiquetas de página
- Transición slide | fade
- Panel contextual igual a Tabs
- Visibilidad por página individual

#### Capa compartida — `src/components/widgets/shared/` ✅
Unificación de la familia Captivate:

| Módulo | Responsabilidad |
|--------|----------------|
| `widget-chrome.module.css` | Root, header, nav, highlight interno |
| `widget-slide-panel.module.css` + `widget-slide-panel.tsx` | Panel de slide editor/viewer |
| `widget-container-styles.ts` | Fondo, padding, variables CSS de acento |
| `widget-editor-utils.ts` | Draft fields, textarea, stopPropagation |
| `widget-header-viewer.tsx` / `widget-header-editor.tsx` | Header unificado |
| `widget-inner-properties.tsx` | Propiedades texto/imagen por slide |
| `widget-layouts.ts` / `widget-layout-gallery.tsx` | Layouts compartidos |
| `widget-image-styles.ts` | Sistema de imagen con dimensiones en px |
| `use-widget-image-dimensions.ts` | Hook con ResizeObserver + onLoad + caché |

#### Sistema de imagen — arquitectura definitiva
**Problema resuelto:** `object-fit: cover` recortaba la imagen al tamaño del contenedor antes de aplicar zoom/pan, haciendo inaccesibles las partes fuera del recorte inicial. Además, la medición de `containerDims` podía ocurrir antes de que el flex estabilizara la altura real, dejando hueco inferior visible en preview.

**Solución implementada:**

**`use-widget-image-dimensions.ts`:**
- `readContainerDims()`: lee dimensiones en vivo del DOM; si la columna es más baja que su fila flex, usa la altura del padre
- `getEffectiveContainerDims()`: en cada render usa el DOM actual, no el estado (evita valores obsoletos)
- ResizeObserver sobre la columna de imagen, hasta 5 ancestros y el panel `[data-widget-slide-panel]`
- Remediciones a 0ms, 100ms y 300ms para cuando el layout flex termina de estabilizarse
- Medición activa también en editor (se quitó el skip cuando `isEditing`)

**`widget-image-styles.ts`:**
- `getCoverScale()` → escala base equivalente a cover
- `getImageStyle()` → calcula `width`, `height`, `top`, `left` en px
- Eliminado `objectFit: 'fill'` (causaba deformación si el box no era exacto)
- Añadidos `maxWidth: 'none'` y `maxHeight: 'none'`
- `usesComputedImageLayout()` → helper para elegir clase CSS correcta
- `isThumbnail`: fallback a `object-fit: cover` sin cálculo en px

**Separación de clases CSS (conflicto resuelto):**
- `wspImageFit` / `flipImageFit`: fallback y miniaturas (`object-fit: cover`, 100%)
- `wspImagePlaced` / `flipImagePlaced`: modo calculado, sin width/height/inset forzados
- Antes `.wspImage` imponía `width:100%; height:100%; object-fit:cover` sobre estilos inline en px, causando deformación

**Pan en vivo:**
- Durante el arrastre, dimensiones leídas del DOM con `readContainerDimsFromRef`, no del estado posiblemente desactualizado

```ts
// Lógica central
const coverScale = Math.max(containerW / imgW, containerH / imgH)
const finalWidth = imgW * coverScale * escala
const finalHeight = imgH * coverScale * escala
// top/left centran la imagen + aplican offsetX/offsetY en px
```

**Regla crítica para widgets futuros:**
- NUNCA usar `object-fit: cover` + `transform: scale()` juntos para zoom/pan
- NUNCA mezclar clases CSS con `width/height: 100%` e inline con `width/height` en px
- SIEMPRE usar `wspImagePlaced` / `flipImagePlaced` en modo calculado
- SIEMPRE usar `wspImageFit` / `flipImageFit` en fallback y miniaturas

#### Miniaturas de barra lateral
- `SlideRenderer` con `modo="preview"` (miniatura) pasa `isThumbnail={true}` → `BlockNode` → viewers
- En miniatura: `object-fit: cover`, sin ResizeObserver, sin onLoad, nav/dots/botones ocultos
- `pointer-events: none`, `overflow: hidden` en contenedores
- Umbral automático: contenedor < 50px → fallback a cover

---

## 5. TIPOS RELEVANTES

### FlipCardsWidget (slide.types.ts)
```ts
export interface FlipCardsWidget {
  tipo: 'flip-cards'
  configuracion: {
    columnas: 2 | 3 | 4
    colorFondoContenedor: string
    colorFrente: string
    colorReverso: string
    mostrarTituloWidget: boolean
    mostrarSubtitulo: boolean
    mostrarInstruccion: boolean
    mostrarNavegacion: boolean
    espacioEntreTarjetas: number
    paddingContenedor: number
    plantillaId?: string
    borde?: boolean
    sombra?: boolean
    visibilidadDefecto: {
      frente: { imagen: boolean; titulo: boolean; cuerpo: boolean }
      reverso: { imagen: boolean; titulo: boolean; cuerpo: boolean }
    }
  }
  tituloWidget: string
  subtituloWidget: string
  instruccion: string
  tarjetas: FlipCard[]
}

export interface FlipCard {
  id: string
  frente: FlipCardCara
  reverso: FlipCardCara
}

export interface FlipCardCara {
  imagen?: string
  titulo: string
  cuerpo: string
  mostrarImagen?: boolean
  mostrarTitulo?: boolean
  mostrarCuerpo?: boolean
  tituloPos?: { x: number; y: number }
  cuerpoPos?: { x: number; y: number }
  estilosTexto?: FlipCardTextStyles
  estilosImagen?: FlipCardImageStyles
}
```

### TabsWidget / CarouselWidget (widget.types.ts)
Tipos unificados bajo `CaptivateWidget = TabsWidget | CarouselWidget`.
Cada slide/ficha/página tiene: `imagen`, `encabezado`, `subtitulo`, `cuerpo`,
`layout`, `visibilidad`, `posiciones`, `estilosTexto`, `estilosImagen`.

### SlideTheme (slide.types.ts)
```ts
export interface SlideTheme {
  id: string
  nombre: string
  esPersonalizado: boolean
  fondo: Background
  fuente: string
  colores: { texto: string; textoSecundario: string; acento: string; fondo: string }
}
```

---

## 6. ROADMAP

### ESCAPE ROOM 2.0 (Roadmap Mayor — sesión dedicada)
Rediseño completo como sistema de narrativa ramificada.

### GRUPO 1 — Editor UX ✅ COMPLETO

### GRUPO 2 — Widgets Captivate
- [x] Flip Cards ✅
- [x] Tabs ✅
- [x] Carousel ✅
- [ ] Click to Reveal (`click-reveal`)
- [ ] Timeline (`timeline`)

### GRUPO 3 — Animaciones/Transiciones
- [ ] Animaciones de entrada/salida por elemento
- [ ] Transiciones entre slides
- Referencia: Captivate — triggers (clic, hover, retirada puntero),
  animaciones (aumento progresivo, escala, estiramiento, remolino,
  articulación, corte, deslizamiento, rebote, giro, inclinación,
  oscilación, soplido, parpadeo) con Duración, Valor, Retraso

### GRUPO 4 — Actividades nuevas
- [ ] Historia ramificada (Twine-style)
- [ ] 15 actividades Wordwall-style

### GRUPO 5 — Plataforma
- [ ] Gamificación
- [ ] Importar PPT

### GRUPO 6 — Lumina 2.0 Community
- [ ] Repositorio público de clases
- [ ] Fork protection
- [ ] Perfiles de docentes
- [ ] Búsqueda alineada DBA/EBC
- [ ] Co-autoría

---

## 7. ARCHIVOS CLAVE — SESIONES 20/05–31/05/2026

### Widgets — estructura completa
```
src/components/widgets/
├── shared/
│   ├── widget-chrome.module.css
│   ├── widget-slide-panel.module.css
│   ├── widget-slide-panel.tsx
│   ├── widget-container-styles.ts
│   ├── widget-editor-utils.ts
│   ├── widget-header-viewer.tsx
│   ├── widget-header-editor.tsx
│   ├── widget-inner-properties.tsx
│   ├── widget-layouts.ts
│   ├── widget-layout-gallery.tsx
│   ├── widget-image-styles.ts
│   └── use-widget-image-dimensions.ts
├── flip-cards/
│   ├── flip-cards-config.ts
│   ├── flip-cards-card-utils.ts
│   ├── flip-cards-templates.ts
│   ├── flip-cards-text-styles.ts
│   ├── flip-cards-image-styles.ts
│   ├── flip-cards-shared.tsx
│   ├── flip-cards-viewer.tsx
│   ├── flip-cards-editor.tsx
│   ├── flip-cards-properties.tsx
│   ├── flip-cards-card-properties.tsx
│   ├── flip-cards-inner-properties.tsx
│   ├── flip-cards-template-gallery.tsx
│   ├── flip-cards-template-thumb.tsx
│   └── flip-cards.module.css
├── tabs/
│   ├── tabs-config.ts
│   ├── tabs-slide-utils.ts
│   ├── tabs-shared.tsx
│   ├── tabs-editor.tsx
│   ├── tabs-viewer.tsx
│   ├── tabs-properties.tsx
│   ├── tabs-appearance-properties.tsx
│   ├── tabs-inner-properties.tsx
│   ├── tabs-slide-panel.tsx
│   └── tabs.module.css
└── carousel/
    ├── carousel-config.ts
    ├── carousel-editor.tsx
    ├── carousel-viewer.tsx
    ├── carousel-properties.tsx
    ├── carousel-appearance-properties.tsx
    ├── carousel-inner-properties.tsx
    ├── carousel-shared.tsx
    └── carousel.module.css

src/lib/
├── flip-cards-defaults.ts
├── tabs-defaults.ts
└── carousel-defaults.ts

src/types/
├── slide.types.ts      — FlipCard, FlipCardCara, FlipCardsWidget
└── widget.types.ts     — TabsWidget, CarouselWidget, CaptivateWidget
```

### Integraciones editor
- `slide-renderer.tsx` — cases flip-cards, tabs, carousel
- `canvas-area.tsx` — selección interna por widget
- `properties-panel.tsx` — panel contextual por widget
- `editor-dnd-shell.tsx` — drop tipo widget
- `use-block-drag.ts` — arrastre de bloques widget

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
const puntosMaximosPosibles = preguntas.length * (puntosBase + bonusVelocidad)
const nota = Math.min(5, Math.max(1, (puntosObtenidos / puntosMaximosPosibles) * 4 + 1))
```

### Flip Cards — CSS 3D (flip-cards.module.css) — NO MODIFICAR
```css
.fcRoot { perspective: 1000px; }
.fcInner { transform-style: preserve-3d; transition: transform 0.5s ease; }
.fcInner.flipped { transform: rotateY(180deg); }
.fcFront, .fcBack { backface-visibility: hidden; }
.fcBack { transform: rotateY(180deg); }
```

### Sistema de imagen — regla crítica
NUNCA usar `object-fit: cover` + `transform: scale()` juntos para zoom/pan.
NUNCA usar `object-fit` si se necesita pan sobre imagen más grande que el contenedor.
SIEMPRE usar `widget-image-styles.ts` → `getImageStyle()` con dimensiones reales.
El hook `use-widget-image-dimensions.ts` provee `containerDims` e `imgDims`.

### Drag-to-canvas — Posición al soltar
```ts
const MARGIN_PCT = 5
izquierdaPct = Math.min(Math.max(izquierdaPct, MARGIN_PCT), 100 - anchoPct - MARGIN_PCT)
arribaPct = Math.min(Math.max(arribaPct, MARGIN_PCT), 100 - altoPct - MARGIN_PCT)
```

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V30.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V30.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
