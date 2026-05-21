# LUMINA_CONTEXT_V28.md
> Generado: 19/05/2026 — Sesión 19/05/2026
> Reemplaza: LUMINA_CONTEXT_V27.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V28.md antes de empezar."
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

---

## 5. TIPOS RELEVANTES

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
- [x] Drag-to-canvas
- [x] Smart Spacing Indicators
- [x] Selección múltiple + alignment toolbar
- [x] Guías manuales persistentes
- [x] Sistema de Slide Themes

### GRUPO 2 — Widgets Captivate
- [ ] Flip Cards (`flip-cards`)
- [ ] Tabs (`tabs`)
- [ ] Carousel (`carousel`)
- [ ] Click to Reveal (`click-reveal`)
- [ ] Timeline (`timeline`)

### GRUPO 3 — Animaciones/Transiciones
- [ ] Animaciones de entrada/salida por elemento
- [ ] Transiciones entre slides

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

## 7. ARCHIVOS MODIFICADOS ESTA SESIÓN

### Frontend (lumina-frontend) — commit 78add95
**Nuevos:**
- `src/app/(app)/classes/[id]/editor/components/canvas-guides.tsx`
- `src/app/(app)/classes/[id]/editor/components/draggable-activity-item.tsx`
- `src/app/(app)/classes/[id]/editor/components/droppable-canvas.tsx`
- `src/app/(app)/classes/[id]/editor/components/editor-dnd-shell.tsx`
- `src/app/(app)/classes/[id]/editor/lib/activity-canvas-position.ts`
- `src/components/editor/alignment-toolbar.tsx`
- `src/components/editor/spacing-indicators.tsx`
- `src/lib/canvas-guides.ts`
- `src/lib/class-custom-themes.ts`
- `src/lib/slide-themes.ts`

**Modificados:**
- `src/app/(app)/classes/[id]/editor/components/canvas-area.tsx`
- `src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx`
- `src/app/(app)/classes/[id]/editor/components/properties-panel.tsx`
- `src/hooks/use-block-drag.ts`
- `src/types/slide.types.ts`
- `src/app/(app)/classes/[id]/editor/editor-client.tsx`

### Backend (lumina-backend) — commit 5c2f7bf
- `src/classes/classes.service.ts` — soporte `temasPersonalizados` en PATCH

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

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V28.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V28.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
