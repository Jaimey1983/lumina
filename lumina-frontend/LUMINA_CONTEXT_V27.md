# LUMINA_CONTEXT_V27.md
> Generado: 18/05/2026 — Sesión 17-18/05/2026
> Reemplaza: LUMINA_CONTEXT_V26.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V27.md antes de empezar."
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
- Modo clase en vivo: flujo completo con socket `/live` y bridge a `/`
- Modo autónomo: preguntas locales, feedback inmediato, pantalla final con correctas/total
- Nota al entregar tarea: `nota = max(1, min(5, puntosObtenidos / puntosMaximosPosibles * 4 + 1))`
  - `puntosMaximosPosibles = preguntas.length * (puntosBase + bonusVelocidad)`
  - Bonus velocidad: proporcional al tiempo de respuesta
  - `finalNota` calculado localmente, no sobreescrito por backend

### 4.3 Escape Room ✅ FUNCIONAL (monolítico)
- Actividad autónoma con salas, tipos de respuesta, pistas, intentos, timer global
- Pantalla final: puntos obtenidos + tiempo + desglose por sala (sin nota de planilla)
- `onComplete={undefined}` en slide-renderer para evitar envío de score al socket
- Editor dedicado `/classes/[id]/escape-room` existe con badge **"Próximamente"** — no funcional aún
- **Escape Room 2.0** en roadmap mayor (ver Sección 6)

### 4.4 Vista previa ✅
- Botón "Vista previa" en editor → abre `/classes/[id]/preview` en pestaña nueva
- `preview-client.tsx`: viewer funcional completo sin socket, sin sesión, sin código de ingreso
- Actividades completamente interactivas (no pointer-events-none)
- `liveSocket={null}`, `torneoSocket={null}` — actividades de socket se renderizan sin enviar datos
- Badge "Vista previa" ámbar en header
- `select-none` en contenedor del slide

### 4.5 Detalles de clase ✅
- Página `/classes/[id]` muestra carrusel de slides con `pointer-events-none`
- Renders estáticos — no interactivo

---

## 5. TIPOS EXTENDIDOS ESTA SESIÓN

### EscapeRoomSala (slide.types.ts)
```ts
export interface EscapeRoomSala {
  id: string;
  nombre: string;
  descripcion: string;
  desafio: string;
  tipoRespuesta: 'texto' | 'opcion_multiple' | 'codigo';
  opciones?: string[];
  respuestaCorrecta: string;
  ignorarMayusculas: boolean;
  pista?: string;
  intentosMaximos: number;
  /** Contenido visual del canvas de esta sala (bloques posicionados). */
  bloques?: Block[];
  /** Fondo visual de la sala. */
  fondo?: Background;
}
```
Los campos `bloques` y `fondo` son opcionales — el viewer actual los ignora sin romper nada.

---

## 6. ROADMAP

### ESCAPE ROOM 2.0 (Roadmap Mayor — sesión dedicada)
Rediseño completo del Escape Room como sistema de narrativa ramificada:

```
Escape Room
├── Mapa global (opcional)
│   ├── Canvas libre con zonas clicables por sala
│   ├── Estado visual por sala: bloqueada / activa / superada / fallida
│   └── Configuración de orden y reintentos
└── Salas (1..N)
    └── Capas (1..M por sala)
        ├── Tipos: portada | historia | desafío | resultado
        ├── Canvas libre (bloques, imágenes, texto, video, audio)
        ├── Actividad (cualquier tipo de Lumina, no solo 3 tipos actuales)
        └── Elemento de continuidad: botón / flecha / clic en imagen / temporizador
```

**Decisiones de arquitectura:**
- Cada sala es un conjunto de subcapas (como quiz multi-pregunta, no multi-slide)
- El canvas visual de cada sala se renderiza como fondo/contexto
- Las fases (intro, historia, desafío, feedback) se superponen encima
- Reutiliza el editor de Lumina como base, con panel lateral adaptado por sala
- Abre en pestaña separada `/classes/[id]/escape-room`
- Requiere nuevo modelo de datos completo (reemplaza EscapeRoomActivity actual)

### GRUPO 1 — Editor UX
- [ ] Drag-to-canvas
- [ ] Smart Spacing Indicators
- [ ] Selección múltiple + alignment toolbar
- [ ] Guías manuales persistentes
- [ ] Sistema de Slide Themes

### GRUPO 2 — Widgets Captivate
- [ ] Flip Cards
- [ ] Tabs
- [ ] Carousel
- [ ] Click to Reveal
- [ ] Timeline

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

### Frontend (lumina-frontend)
- `src/app/(app)/classes/[id]/preview/page.tsx` — **NUEVO** Server Component
- `src/app/(app)/classes/[id]/preview/preview-client.tsx` — **NUEVO** viewer funcional sin socket
- `src/app/(app)/classes/[id]/escape-room/page.tsx` — **NUEVO** Server Component (Próximamente)
- `src/app/(app)/classes/[id]/escape-room/escape-room-designer-client.tsx` — **NUEVO** editor 3 columnas (Próximamente)
- `src/app/(app)/classes/[id]/editor/editor-client.tsx` — botón Vista previa → `/preview`
- `src/app/(app)/classes/[id]/class-detail-client.tsx` — slides con `pointer-events-none`
- `src/components/editor/activities/escape-room-activity.tsx` — botón "Diseñar Escape Room" deshabilitado con badge Próximamente
- `src/components/editor/activities/escape-room-editor.tsx` — `normalizeSala` exportada, preserva `bloques`/`fondo`, nuevo `EscapeRoomSalaConfigFields`
- `src/components/viewers/torneo-viewer.tsx` — modo autónomo completo, `autonomoScoreRef`, cálculo `finalNota`
- `src/app/(app)/autonomo/[id]/autonomo-client.tsx` — `torneoFinalNotaRef`, intercepta `finalNota`, override nota backend
- `src/types/slide.types.ts` — `EscapeRoomSala` + `bloques?: Block[]` + `fondo?: Background`
- `src/app/(app)/layout.tsx` — `/escape-room` usa shell pantalla completa sin sidebar

---

## 8. NOTAS TÉCNICAS

### PostgreSQL
- Docker: `lumina_postgres`, puerto **5434**
- Local Windows: puerto 5432 (no usar)

### Redis
- Docker: `lumina_redis`, puerto **6380**
- Iniciar con: `docker start lumina_redis`
- El backend arranca sin Redis pero lanza errores `ECONNREFUSED` continuos — siempre iniciar Docker primero

### Convención de rooms Socket.IO
- Namespace `/`: room = `class-${classId}`
- Namespace `/live`: room = `live:${classId}`
- Bridge torneo usa `class-${classId}` en namespace `/`

### Torneo — Cálculo de nota
```ts
const puntosMaximosPosibles = preguntas.length * (puntosBase + bonusVelocidad)
const nota = Math.min(5, Math.max(1, (puntosObtenidos / puntosMaximosPosibles) * 4 + 1))
// Si puntosObtenidos === 0: nota = 1.0
```

### Escape Room — Decisión de diseño
- No evaluable actualmente — pantalla final muestra puntos/tiempo/desglose por sala
- `onComplete={undefined}` en slide-renderer evita envío de score al socket
- Editor 2.0 pendiente — botón "Diseñar Escape Room" visible pero deshabilitado

### Carpeta raíz src/ (IGNORAR)
- Copia muerta — el backend activo es `lumina-backend/`

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V27.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V27.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
