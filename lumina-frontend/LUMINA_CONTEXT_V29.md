# LUMINA_CONTEXT_V29.md
> Generado: 20/05/2026 — Sesión 20/05/2026
> Reemplaza: LUMINA_CONTEXT_V28.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V29.md antes de empezar."
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
Completado en sesión 19/05/2026:

#### Drag-to-canvas (actividades)
- Panel de actividades draggable via `@dnd-kit/core`
- `DraggableActivityItem`, `DroppableCanvas`, `EditorDndShell`
- Drop en canvas: tamaño 90×90%, centrado en puntero, clamp 5% en todos los bordes
- Click sigue insertando como antes (comportamiento preservado)
- Archivos: `editor-dnd-shell.tsx`, `draggable-activity-item.tsx`, `droppable-canvas.tsx`, `activity-canvas-position.ts`

#### Smart Spacing Indicators
- Líneas azules `#2563EB` con badge px al seleccionar o arrastrar un bloque
- Distancias a los 4 bordes del canvas
- Distancia a bloques vecinos más cercanos (umbral 200px, solapamiento en eje)
- Línea verde `#10B981` para 3+ bloques con espaciado uniforme (tolerancia ±4px)
- Archivo: `spacing-indicators.tsx`

#### Selección múltiple + alignment toolbar
- Shift+click para agregar/quitar de selección
- Marquee selection (drag sobre canvas vacío): rectángulo azul semitransparente
- Panel derecho muestra "X bloques seleccionados"
- Toolbar flotante con 6 acciones de alineación + 2 de distribución
- Arrastre en grupo: todos los bloques seleccionados se mueven con delta offset
- Un solo PATCH consolidado al soltar
- Undo/redo soportado

#### Guías manuales persistentes
- Reglas horizontal y vertical (16px) con marcas cada 100px
- Drag desde regla → crea guía; soltar fuera → elimina; doble click → elimina
- Badge con posición en px durante drag
- Persistencia via PATCH del slide (`content.guias.horizontales/verticales`)
- Toggle botón `Ruler` en topbar
- No visibles en vista previa ni viewer
- Barra flotante del bloque usa portal React para no ser recortada por overflow
- Archivos: `canvas-guides.tsx`, `canvas-guides.ts`

#### Slide Themes
- 6 temas predefinidos: Lumina, Oscuro, Pizarrón, Minimalista, Escolar, Océano
- Temas personalizados: crear, editar, eliminar; guardados en `desempeno.temasPersonalizados`
- Panel lateral con grid de miniaturas 120×68px
- Popover de alcance: "Este slide" / "Todos los slides"
- Solo modifica `slide.fondo` — no toca bloques existentes
- Actualización optimista del cache (miniaturas se actualizan al instante)
- Archivos: `slide-themes.ts`, `class-custom-themes.ts`, `themes-panel.tsx`

### 4.7 Widget Flip Cards ✅ COMPLETO
Completado en sesión 20/05/2026. Widget no evaluable tipo Captivate.

#### Arquitectura de archivos
```
src/components/widgets/flip-cards/
├── flip-cards-config.ts            # Config, normalización, selección interna
├── flip-cards-card-utils.ts        # Visibilidad/posición por tarjeta
├── flip-cards-templates.ts         # 8 plantillas visuales
├── flip-cards-text-styles.ts       # Estilos tipográficos avanzados
├── flip-cards-image-styles.ts      # Estilos de imagen avanzados
├── flip-cards-shared.tsx           # Header, estilos contenedor/grid
├── flip-cards-viewer.tsx           # Vista estudiante (flip 3D + paginación)
├── flip-cards-editor.tsx           # Edición inline + drag de texto
├── flip-cards-properties.tsx       # Panel global del widget
├── flip-cards-card-properties.tsx  # Panel por tarjeta individual
├── flip-cards-inner-properties.tsx # Panel contextual texto/imagen
├── flip-cards-template-gallery.tsx
├── flip-cards-template-thumb.tsx
└── flip-cards.module.css
src/lib/flip-cards-defaults.ts      # Factory createDefaultFlipCardsBlock()
src/lib/flip-cards-config.ts        # normalizeFlipCardsWidget, defaults
```

#### Tipos en slide.types.ts
```ts
FlipCardsWidget   // tipo: 'flip-cards'
FlipCard          // id, frente, reverso
FlipCardCara      // imagen, titulo, cuerpo, mostrarImagen, mostrarTitulo,
                  // mostrarCuerpo, tituloPos, cuerpoPos, estilosTexto, estilosImagen
```

#### Funcionalidades implementadas
**Widget global:**
- Título, subtítulo, instrucción editables inline (contentEditable), ocultables
- 8 plantillas visuales (clásico, minimal, contraste, océano, atardecer, bosque, foco-imagen, solo-texto)
- Columnas: 2 | 3 | 4
- Número de tarjetas: botones +/- (mín 2)
- Espaciado entre tarjetas y padding del contenedor (sliders)
- Colores: fondo contenedor, cara frontal, cara reversa
- Borde y sombra configurables
- Botones de navegación ← → (paginación si tarjetas > columnas × 2)
- Visibilidad por defecto frente/reverso (imagen, título, cuerpo)

**Por tarjeta individual:**
- Clic en tarjeta → modo edición inline con borde azul `#2563EB`
- Toggle [Frente | Reverso] dentro de la tarjeta para editar cada cara
- Título y cuerpo editables directamente sobre la tarjeta
- Título y cuerpo arrastrables con asa azul (posición libre en %)
- Imagen: URL via popover, botón cámara en hover, zoom, pan, fit, filtros
- Visibilidad propia por tarjeta (override del global)
- Panel contextual lateral cambia a controles de tarjeta, texto o imagen según selección

**Viewer (presentación a estudiantes):**
- Flip CSS 3D al hacer clic (Set de IDs flipped, estado local)
- `perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`
- Paginación con botones ← →
- Respeta todas las reglas de visibilidad y posición
- Mismo render que el editor para coherencia visual

#### Persistencia
- Cambios via `onFlipCardsChange` / `handleFlipCardsChange` (patrón `onApplyBloques`)
- onBlur de campos — no en cada keystroke
- No usa Redux (consistente con el resto del editor)

#### Integración
- `slide-renderer.tsx`: case `'flip-cards'` → `FlipCardsEditor` en editor, `FlipCardsViewer` en viewer/preview
- `properties-panel.tsx`: case `'flip-cards'` → panel contextual según selección interna
- `canvas-area.tsx`: soporte de selección del bloque
- Panel Actividades: sección "Widgets" con ícono `Layers`, click y drag-to-canvas
- `editor-dnd-shell.tsx`: soporte drop para tipo widget
- `use-block-drag.ts`: arrastre del bloque en canvas

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

### SlideTheme (slide.types.ts)
```ts
export interface SlideTheme {
  id: string
  nombre: string
  esPersonalizado: boolean
  fondo: Background
  fuente: string
  colores: {
    texto: string
    textoSecundario: string
    acento: string
    fondo: string
  }
}
```

### EscapeRoomSala (slide.types.ts)
```ts
export interface EscapeRoomSala {
  id: string
  nombre: string
  descripcion: string
  desafio: string
  tipoRespuesta: 'texto' | 'opcion_multiple' | 'codigo'
  opciones?: string[]
  respuestaCorrecta: string
  ignorarMayusculas: boolean
  pista?: string
  intentosMaximos: number
  bloques?: Block[]
  fondo?: Background
}
```

---

## 6. ROADMAP

### ESCAPE ROOM 2.0 (Roadmap Mayor — sesión dedicada)
Rediseño completo como sistema de narrativa ramificada con mapa global,
salas multicapa, canvas libre por sala, y actividades Lumina embebidas.

### GRUPO 1 — Editor UX ✅ COMPLETO

### GRUPO 2 — Widgets Captivate
- [x] Flip Cards (`flip-cards`) ✅
- [ ] Tabs (`tabs`)
- [ ] Carousel (`carousel`)
- [ ] Click to Reveal (`click-reveal`)
- [ ] Timeline (`timeline`)

### GRUPO 3 — Animaciones/Transiciones
- [ ] Animaciones de entrada/salida por elemento
- [ ] Transiciones entre slides
- Referencia: capturas de Captivate (triggers: clic, hover, retirada puntero;
  animaciones: aumento progresivo, ajuste escala, estiramiento, remolino,
  articulación, corte, deslizamiento, rebote, giro, inclinación, oscilación,
  soplido, parpadeo — con Duración, Valor, Retraso)

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

## 7. ARCHIVOS MODIFICADOS — SESIÓN 20/05/2026

### Frontend (lumina-frontend)
**Nuevos:**
- `src/components/widgets/flip-cards/flip-cards-config.ts`
- `src/components/widgets/flip-cards/flip-cards-card-utils.ts`
- `src/components/widgets/flip-cards/flip-cards-templates.ts`
- `src/components/widgets/flip-cards/flip-cards-text-styles.ts`
- `src/components/widgets/flip-cards/flip-cards-image-styles.ts`
- `src/components/widgets/flip-cards/flip-cards-shared.tsx`
- `src/components/widgets/flip-cards/flip-cards-viewer.tsx`
- `src/components/widgets/flip-cards/flip-cards-editor.tsx`
- `src/components/widgets/flip-cards/flip-cards-properties.tsx`
- `src/components/widgets/flip-cards/flip-cards-card-properties.tsx`
- `src/components/widgets/flip-cards/flip-cards-inner-properties.tsx`
- `src/components/widgets/flip-cards/flip-cards-template-gallery.tsx`
- `src/components/widgets/flip-cards/flip-cards-template-thumb.tsx`
- `src/components/widgets/flip-cards/flip-cards.module.css`
- `src/lib/flip-cards-defaults.ts`

**Modificados:**
- `src/types/slide.types.ts` — FlipCard, FlipCardCara, FlipCardsWidget añadidos al union Block
- `src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` — case flip-cards
- `src/app/(app)/classes/[id]/editor/components/canvas-area.tsx` — selección bloque widget
- `src/app/(app)/classes/[id]/editor/components/properties-panel.tsx` — case flip-cards
- `src/app/(app)/classes/[id]/editor/components/editor-dnd-shell.tsx` — drop tipo widget
- `src/hooks/use-block-drag.ts` — arrastre bloque widget

### Backend — sin cambios esta sesión

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

### Drag-to-canvas — Posición al soltar
```ts
const MARGIN_PCT = 5
izquierdaPct = Math.min(Math.max(izquierdaPct, MARGIN_PCT), 100 - anchoPct - MARGIN_PCT)
arribaPct = Math.min(Math.max(arribaPct, MARGIN_PCT), 100 - altoPct - MARGIN_PCT)
```

### Flip Cards — CSS 3D (flip-cards.module.css)
```css
.fcRoot { perspective: 1000px; }
.fcInner { transform-style: preserve-3d; transition: transform 0.5s ease; }
.fcInner.flipped { transform: rotateY(180deg); }
.fcFront, .fcBack { backface-visibility: hidden; }
.fcBack { transform: rotateY(180deg); }
```

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V29.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V29.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
