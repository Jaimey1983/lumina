# LUMINA — Contexto Completo del Proyecto v5
> Documento para iniciar nueva sesión de desarrollo. Lee todo antes de escribir código.
> Última actualización: 06/04/2026

---

## Qué es Lumina

Plataforma de creación y entrega de contenido educativo interactivo para docentes colombianos. Inspirada en **Nearpod + Genially + Wordwall + eXeLearning + Storyline 360**. Tiene dos capas:

- **Lumina Core** — Editor de slides interactivos, clases en vivo, actividades, banco curricular colombiano
- **Lumina Edu** — Planilla de notas, desempeños, indicadores, calificaciones (módulo institucional colombiano)

**No es un LMS institucional completo** — es una plataforma de contenido interactivo con trazabilidad curricular opcional.

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS + TypeScript + Prisma 7 + PostgreSQL + Redis |
| Frontend | Next.js 16 + React 19 + TypeScript + Metronic Layout-11 |
| Paquetes | pnpm |
| OS | Windows 11 + PowerShell / Git Bash |
| Editor | Antigravity (multi-agente) + Claude Code |

## Rutas del Proyecto

```
C:\Users\Jaime\proyectos\lumina\
├── lumina-backend\   ← .cursorrules (contexto completo del backend)
└── lumina-frontend\  ← CLAUDE.md (contexto completo del frontend)
```

> ⚠️ PC principal usa `Jaime`, portátil usa `JAIME`. En Git Bash: `~/proyectos/lumina/`

## Repositorio GitHub

- Monorepo: `https://github.com/Jaimey1983/lumina`
- **rama `main`** → lumina-backend
- **rama `master`** → lumina-frontend

Push frontend: `git push origin master`
Push backend: `git push origin main`

---

## Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| `demo@lumina.edu.co` | `Demo1234!` | TEACHER |
| `estudiante@lumina.edu.co` | `Demo1234!` | STUDENT |

Scripts de seed en `prisma/seed-test-user.ts` y `prisma/seed-demo-data.ts`.

---

## Infraestructura Docker

| Contenedor | Puerto | Imagen |
|-----------|--------|--------|
| `lumina_postgres` | 5432 | postgres:16 |
| `lumina_redis` | 6379 | redis:7-alpine |

Backend corre en puerto **3000**, frontend en **3001** (Next.js con Turbopack).

### Credenciales PostgreSQL
```
POSTGRES_USER: lumina
POSTGRES_PASSWORD: lumina1234
POSTGRES_DB: lumina
```

### .env del backend (mínimo requerido)
```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://lumina:lumina1234@localhost:5432/lumina"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=lumina_super_secret_key_2025_cambiar_en_produccion
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
```

### next.config.ts (importante)
```typescript
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {},
};
```

### Comandos de inicio
```bash
# Backend
cd ~/proyectos/lumina/lumina-backend
pnpm exec prisma generate   # solo si es clone nuevo
pnpm run start:dev

# Frontend
cd ~/proyectos/lumina/lumina-frontend
pnpm run dev   # corre en puerto 3001
```

---

## Estado del Backend — 100% COMPLETO

23 módulos en 4 fases + módulo `curriculum` + endpoints de slides extendidos.

### Endpoints de Slides — ACTUALIZADOS

| Endpoint | Estado | Uso |
|----------|--------|-----|
| `GET /classes/:id` | ✅ | Leer clase + slides + desempeño |
| `PATCH /classes/:id` | ✅ | Guardar desempeño en clase |
| `POST /classes/:id/slides` | ✅ | Crear slide al final |
| `POST /classes/:id/slides/insert` | ✅ | Insertar slide en posición específica |
| `PATCH /classes/:id/slides/reorder` | ✅ | Reordenar slides (array de {id, order}) |
| `PATCH /classes/:id/slides/:slideId` | ✅ | Guardar contenido de slide |
| `DELETE /classes/:id/slides/:slideId` | ✅ | Eliminar slide |
| `GET /curriculum/dba?area=&grado=` | ✅ | Modal de inicio |
| `POST /curriculum/generate-desempeno` | ✅ | Modal de inicio |

---

## Contexto Curricular Colombiano — MUY IMPORTANTE

### Lo que el MEN provee (datos fijos):
- **Estándares Básicos de Competencias (EBC)** — metas por grupo de grados
- **Derechos Básicos de Aprendizaje (DBA)** — mínimo por grado específico

### Lo que Lumina genera con IA:
- **Desempeños** — cruzando EBC + DBA + área + grado + tema + tipo
- **Indicadores de desempeño** — en 4 niveles por cada desempeño
- **Actividades sugeridas** — alineadas a esos indicadores

### Tipos de desempeño (el docente elige UNO por clase):
- **Cognitivo** — Saber
- **Procedimental** — Saber hacer
- **Actitudinal** — Ser

---

## Flujo Completo del Sistema

```
1. MODAL DE INICIO (solo para clases nuevas sin desempeño)
   Docente elige: Área + Grado + Tema + Tipo de desempeño
         ↓
   IA genera desempeño + 4 indicadores + actividades sugeridas
   Sistema guarda via PATCH /classes/:id { desempeno: {...} }
         ↓
2. EDITOR DE SLIDES
   Se abre con contexto curricular en topbar
   Slide con actividad: solo admite un bloque de texto como título
   Agregar slide: se inserta DESPUÉS del slide activo via POST /classes/:id/slides/insert
   Reordenar slides: drag & drop con @dnd-kit via PATCH /classes/:id/slides/reorder
         ↓
3. CLASE EN VIVO (Socket.IO — backend implementado)
   Estudiantes entran al viewer desde sus dispositivos
         ↓
4. PLANILLA DE NOTAS (Lumina Edu)
```

---

## Arquitectura del Editor — ESTADO ACTUAL

### Layout definitivo:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Topbar h-14: [←] | Título + desempeño truncado | Compartir | Vista previa | Guardar | Publicar │
├──────┬───────────┬──────────────────────────────────┬──────┬──────┤
│      │  Slides   │                                  │      │      │
│ Rail │  Panel    │      CANVAS (aspect 16/9)        │ Rail │      │
│ izq  │  w-56     │      slide-renderer modo=editor  │ der  │Flyout│
│ w-16 │           │      flex-1                      │ w-16 │ der  │
│      │ +Agregar  │                                  │      │      │
├──────┴───────────┴──────────────────────────────────┴──────┴──────┤
│  Status bar: estado guardado | N slides                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Reglas del editor (NO romper):
- **Slide con actividad**: solo puede tener la actividad + opcionalmente un bloque `tipo: 'texto'` como título
- **Agregar slide**: se inserta después del slide activo via endpoint `insert`
- **Slide vacío activo**: agregar actividad la coloca en ese slide en lugar de crear uno nuevo
- **Drag & drop de slides**: usa `@dnd-kit/core` + `@dnd-kit/sortable`. PointerSensor con `distance: 8`
- **Botones ↑↓**: también disponibles para reordenar slides (aparecen en hover)
- **Trash en slides**: botón eliminar en hover (top-right)
- **Trash en bloques**: todos los bloques del canvas muestran Trash2 en hover modo editor
- **editorSyncKey**: todos los editores de actividad reciben `editorSyncKey={\`${slideId}-${blockId}\`}` para sincronizar estado al cambiar slide

---

## Actividades Interactivas — Estado Actual ✅ COMPLETO

| Actividad | Editor | Viewer | Notas |
|-----------|--------|--------|-------|
| Quiz opción múltiple | ✅ | ✅ | Completo |
| Verdadero / Falso | ✅ | ✅ | Completo |
| Llenar espacios | ✅ | ✅ | Completo |
| Respuesta corta | ✅ | ✅ | Completo |
| Drag & Drop | ✅ | ✅ | Select para zona destino |
| Emparejar | ✅ | ✅ | Completo |
| Ordenar pasos | ✅ | ✅ | dnd-kit en viewer |
| Video interactivo | ✅ | ✅ | Completo |
| Encuesta en vivo | ✅ | ✅ | Completo |
| Nube de palabras | ✅ | ✅ | Completo |

### Notas importantes sobre tipos de dominio:
- Los tipos están en español en `slide.types.ts`: `urlVideo`, `preguntas`, `opciones`, `multipleRespuesta`, `instruccion`, etc.
- `VideoInteractiveActivity` y `LivePollActivity` son alias de los tipos en español
- NO renombrar a inglés sin actualizar `slide.types.ts` y todo el consumo

### Patrón de persistencia en editores:
- Texto libre: `schedulePersist` + `onBlur={flush}`
- Cambios estructurales (agregar/quitar opciones, marcar correcta): `commitImmediate`

---

## Student Viewer — IMPLEMENTADO ✅

Ruta: `/classes/[id]/viewer`

- `page.tsx` — Server Component con params como `Promise` (patrón Next.js 15+)
- `viewer-client.tsx` — Client Component con Socket.IO
  - Conecta a `localhost:3000` al montar
  - Escucha `'slide-change'` → actualiza slide activo
  - Escucha `'activity-answer'` → respuestas de otros estudiantes
  - Layout mobile-first con `min-h-dvh`
  - No requiere autenticación
  - Rutas `/classes/[id]/viewer` excluidas del layout principal en `layout.tsx`

---

## Hooks API del Frontend

```typescript
// src/hooks/api/use-classes.ts
useClasses(courseId)           // GET /classes
useClassesByCourses(ids)       // GET /classes múltiple
useCreateClass(courseId)       // POST /classes
useUpdateClass(classId, courseId) // PATCH /classes/:id
useDeleteClass(courseId)       // DELETE /classes/:id
usePublishClass(courseId)      // POST /classes/:id/publish
useCreateSlide(classId)        // POST /classes/:id/slides
useInsertSlide(classId)        // POST /classes/:id/slides/insert
useUpdateSlide(classId)        // PATCH /classes/:id/slides/:slideId
useRemoveSlide(classId)        // DELETE /classes/:id/slides/:slideId
useReorderSlides(classId)      // PATCH /classes/:id/slides/reorder

// src/hooks/api/use-class.ts
useClass(id)                   // GET /classes/:id (detalle completo con slides)
```

---

## Archivos Clave del Frontend

```
src/
├── types/
│   └── slide.types.ts              ✅ Tipos completos con unions discriminadas
│
├── lib/
│   ├── api.ts                      ✅ axios con baseURL localhost:3000
│   ├── class-slide-normalize.ts    ✅ Helpers de normalización
│   └── utils.ts                    ✅ cn()
│
├── app/(app)/classes/[id]/
│   ├── new-class-modal.tsx         ✅ Modal con IA, desempeño, actividades sugeridas
│   └── editor/
│       ├── page.tsx                ✅
│       ├── editor-client.tsx       ✅ Lógica completa del editor
│       └── components/
│           ├── icon-rail.tsx       ✅
│           ├── right-rail.tsx      ✅
│           ├── flyout-panel.tsx    ✅
│           ├── right-flyout-panel.tsx ✅
│           ├── slides-panel.tsx    ✅ Con drag&drop (@dnd-kit), ↑↓, trash
│           ├── canvas-area.tsx     ✅
│           ├── slide-renderer.tsx  ✅ JSON→React, modo editor/viewer
│           ├── floating-toolbar.tsx ✅
│           ├── editor-toolbar.tsx  ✅
│           ├── activities/
│           │   ├── short-answer.tsx     ✅ Editor + Viewer
│           │   ├── fill-blanks.tsx      ✅ Editor + Viewer
│           │   ├── match-pairs.tsx      ✅ Editor + Viewer
│           │   ├── order-steps.tsx      ✅ Editor + Viewer
│           │   ├── word-cloud.tsx       ✅ Editor + Viewer
│           │   ├── quiz-multiple.tsx    ✅ Editor + Viewer
│           │   ├── true-false.tsx       ✅ Editor + Viewer
│           │   ├── drag-drop.tsx        ✅ Editor + Viewer
│           │   ├── video-interactive.tsx ✅ Editor + Viewer
│           │   └── live-poll.tsx        ✅ Editor + Viewer
│           └── panels/
│               ├── activities-panel.tsx ✅
│               ├── activities-ai-panel.tsx ✅
│               ├── flyout-left-panels.tsx ✅
│               └── themes-panel.tsx    ✅
│
├── app/(app)/classes/[id]/viewer/
│   ├── page.tsx                    ✅ Server Component
│   └── viewer-client.tsx           ✅ Socket.IO, mobile-first
│
└── hooks/api/
    ├── use-class.ts                ✅
    ├── use-classes.ts              ✅
    ├── use-grade-calculation.ts    ✅
    └── use-curriculum.ts           ✅
```

---

## Patrones Críticos del Frontend (NO romper)

```typescript
// Normalización de respuestas del backend:
Array.isArray(raw) ? raw : raw?.data ?? []

// queryFn nunca retorna undefined — siempre [] o null
// Roles siempre en MAYÚSCULAS
// Invalidar queryKey exacto en mutaciones
// Token JWT en localStorage key 'token'
// Páginas = Server Components, lógica = *-client.tsx con 'use client'
// Alias @/ mapeado a src/
// PowerShell: NO usar && — ejecutar comandos uno por uno
// Git Bash: sí permite && 
// Rutas con paréntesis o corchetes siempre entre comillas en PowerShell
// pnpm en todo el proyecto
// editorSyncKey obligatorio en todos los editores de actividad
```

---

## Issues conocidos (NO bloquean desarrollo)

- **`canvas.node`**: error de build en `next build` por Fabric.js/jsdom. No afecta `pnpm run dev` con Turbopack. Fabric.js ya no se usa en el editor pero aún está en `package.json`.
- **Language server de Antigravity**: muestra 3371 errores de TypeScript del frontend cuando el workspace está abierto en la raíz. Son falsos positivos del analizador estático, no afectan el build.

---

## Próximas Tareas (en orden de prioridad)

1. **Clase en vivo** — integrar Socket.IO para sincronización docente→estudiante
   - Docente controla slide activo desde el editor
   - Backend emite `'slide-change'` con índice del slide
   - Viewer del estudiante ya escucha ese evento ✅

2. **Remover Fabric.js** — limpiar `package.json` y cualquier import residual para que `next build` pase sin errores

3. **Flyout panels izquierdos** — implementar contenido real en los paneles de contenido/media

4. **Polish del editor** — revisar bugs pendientes:
   - Modal de contexto curricular: lógica de aparición antes de abrir el editor
   - PATCH endpoint: persistencia de desempeños generados por IA

---

## Forma de Trabajo

- Ejecutar autónomamente sin pedir permiso (excepto acciones destructivas)
- Respuestas concisas y directas
- Un módulo a la vez
- Build debe pasar sin errores antes de hacer commit
- Leer `.cursorrules` (backend) o `CLAUDE.md` (frontend) antes de empezar
- Leer este archivo completo al iniciar cualquier sesión
- En PowerShell NO usar `&&` — ejecutar comandos uno por uno
- En Git Bash sí se puede usar `&&`
- Rutas con paréntesis o corchetes siempre entre comillas en PowerShell
- Prompts para agentes siempre en bloques de código copiables

---

## Instrucción para Nueva Sesión

Al iniciar una nueva conversación:
1. Lee este archivo completo
2. Lee `CLAUDE.md` (frontend) o `.cursorrules` (backend) según la tarea
3. Confirma con "Listo, entendido" y un resumen de 3 líneas
4. Empezar por la primera tarea de "Próximas Tareas" sin preguntar
