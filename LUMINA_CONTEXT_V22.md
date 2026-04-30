# LUMINA_CONTEXT_V22.md
_Actualizado: 28/04/2026 — Sesiones 27/04/2026_

---

## Descripción General

**Lumina** es una plataforma SaaS colombiana de contenido educativo interactivo para docentes.
Inspirada en Nearpod, Genially y Wordwall.

**Dos capas activas:**
- **Lumina Core** — editor de clases interactivas (diferenciador principal)
- **Lumina Edu** — módulo de calificación institucional colombiana (add-on)

**Lumina 2.0 (futura)** — capa de comunidad, repositorio público y red social docente (definida, no iniciada)

**Repositorio:** `https://github.com/Jaimey1983/lumina`
- Frontend: rama `master` (Next.js 16 + React 19, puerto 3001)
- Backend: rama `main` (NestJS + Prisma + PostgreSQL + Redis, puerto 3000)

**Rutas locales:**
- Frontend: `C:\Users\Jaime\proyectos\lumina\lumina-frontend`
- Backend: `C:\Users\Jaime\proyectos\lumina\lumina-backend`

**Docker:** `lumina_postgres` (5432 en contenedor, pero backend usa PostgreSQL local Windows en 5432)
**Redis:** `lumina_redis` (6379)
**DB:** usuario `lumina` / contraseña `lumina1234`
**JWT secret:** `lumina_super_secret_key_2025_cambiar_en_produccion`

---

## Stack Técnico

**Frontend:**
- Next.js 16 + React 19
- TypeScript, Tailwind CSS, shadcn/ui
- Socket.IO client
- React Query (TanStack Query)
- @dnd-kit/core (drag & drop)
- pnpm

**Backend:**
- NestJS + Prisma 7 + PostgreSQL
- Redis (caché y sesiones)
- Socket.IO server
- JWT auth
- pnpm

---

## Identidad Visual — Lumina 2.1 (ACTIVO)

### Filosofía de diseño
- Inspirada en Materialize: limpieza, respiración, sobriedad
- Color primario solo en elementos de acción — nunca en tipografía de contenido
- Tipografía negra/gris oscuro como protagonista
- Fondos blancos/gris neutro — sin tinte de color
- Sombras grises neutras — sin tinte azul

### Tipografía
- **Plus Jakarta Sans** — variable `--font-plus-jakarta`, cargada via `next/font/google`
- Tamaño base: `15px` (`--lumina-font-size-base`)
- Escala: `lumina-xs` 0.75rem · `lumina-sm` 0.8125rem · `lumina-md` 0.9375rem · `lumina-lg` 1.125rem · `lumina-xl` 1.5rem · `lumina-2xl` 1.75rem
- Texto principal: `#111827` — nunca azul en tipografía de contenido
- Texto secundario: `#6b7280`
- Texto muted: `#9ca3af`

### Paleta de colores
- **Primario:** `#2563EB` (azul) — SOLO en botones CTA, links activos, íconos de acción
- **Hover primario:** `#1d4ed8`
- **Tinte suave:** `#dbeafe`
- **Tinte hover:** `#eff6ff`
- **Fondo app:** `#f9fafb` (gris neutro puro — sin tinte)
- **Cards / superficies:** `#ffffff`
- **Bordes:** `#e5e7eb` (gris neutro — sin tinte)
- **Hover fila tabla:** `#f9fafb`
- **Table header bg:** `#F5F5F7`

### Sombras (grises neutras)
- `lumina-xs`: `0px 2px 6px rgba(0,0,0,0.06)`
- `lumina-sm`: `0px 2px 10px rgba(0,0,0,0.07)`
- `lumina-md`: `0px 4px 14px rgba(0,0,0,0.08)`
- `lumina-lg`: `0px 6px 20px rgba(0,0,0,0.10)`

### Badges de estado de clase
| Tipo | Fondo | Texto |
|------|-------|-------|
| Publicada | `#dbeafe` | `#2563EB` |
| En vivo | `#dbeafe` | `#2563EB` |
| Autónomo | `#fef3c7` | `#d97706` |
| Borrador | `#f3f4f6` | `#9ca3af` |

### Escala de valoración colombiana (badges)
| Nivel | Fondo | Texto |
|-------|-------|-------|
| Bajo | `#fee2e2` | `#f87171` |
| Básico | `#fef3c7` | `#d97706` |
| Alto | `#dbeafe` | `#2563EB` |
| Superior | `#dcfce7` | `#16a34a` |

### Semánticos
- Success: `#34d399` | Warning: `#fbbf24` | Danger: `#f87171`

### Border radius (escala Materialize)
- `lumina-xs`: 2px · `lumina-sm`: 4px · `lumina-md`: 6px
- `lumina-lg`: 10px · `lumina-xl`: 12px · `lumina-2xl`: 16px

### Tabla (estándar)
- Header height: `48px` | Row height: `50px`
- Header: `text-xs font-medium text-[#6b7280] uppercase tracking-wide bg-[#F5F5F7]`
- Celdas: `text-sm text-[#111827]`
- Borde: `1px solid #e5e7eb`
- Hover fila: `bg-[#f9fafb]`

### Colores eliminados
- `#F97316` naranja — solo persiste en SNAP_COLOR del canvas
- `#7C3AED` violeta — reemplazado globalmente por `#2563EB`

### Tokens shadcn PROHIBIDOS en código nuevo
`border-border`, `bg-card`, `bg-muted`, `bg-muted/*`, `bg-background`, `bg-accent`,
`text-muted-foreground`, `text-foreground`, `hover:text-foreground`, `hover:bg-accent`,
`bg-primary`, `text-primary`, `text-primary-foreground`, `border-primary`, `border-input`,
`ring-ring`, `ring-primary`, `divide-border`, `shadow-sm` (usar `shadow-lumina-*`)

### Archivos de tokens
- `src/styles/globals.css` — variables CSS en `:root`
- `tailwind.config.ts` — `theme.extend` con colores, radios, sombras, tipografía `lumina.*`
- `src/app/layout.tsx` — body con `flex flex-col min-w-0`

---

## Modos de Clase

| Modo | Descripción |
|------|-------------|
| `clase` | Clase en vivo — docente controla navegación, Socket.IO activo |
| `presentacion` | Presentación — siempre disponible, estudiante navega libremente |
| `autonomo` | Autónomo — estudiante navega a su ritmo, tarea para la casa |

---

## Modo Autónomo — COMPLETO Y PROBADO (V22)

### Concepto
Permite al docente lanzar una clase como tarea para la casa con ventana de tiempo,
PIN de acceso, intentos configurables y calificación automática.

### Modelos Prisma
```prisma
model AutonomousSession {
  id                 String   @id @default(cuid())
  classId            String
  teacherId          String
  opensAt            DateTime
  closesAt           DateTime
  allowBackNav       Boolean  @default(true)
  maxAttempts        Int      @default(1)   // -1 = ilimitado
  timerBehavior      String   @default("advance") // "advance" | "lock"
  requireManualStart Boolean  @default(false)
  status             String   @default("scheduled") // "scheduled" | "open" | "closed"
  pin                String   // 6 dígitos generado automáticamente
  purpose            String   @default("independent") // "recovery" | "independent"
  createdAt          DateTime @default(now())
}

model AutonomousProgress {
  id            String   @id @default(cuid())
  sessionId     String
  studentId     String
  studentName   String
  slideId       String
  activityType  String?
  response      Json?    // array acumulado para video_interactivo
  score         Float?
  answeredAt    DateTime @default(now())
  attemptNumber Int      @default(1)
}

model AutonomousResult {
  id            String   @id @default(cuid())
  sessionId     String
  studentId     String
  studentName   String
  attemptNumber Int      @default(1)
  status        String   @default("in_progress") // "in_progress" | "completed" | "expired"
  finalScore    Float?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
}

model AutonomousGrade {
  id          String   @id @default(cuid())
  sessionId   String
  classId     String
  studentId   String
  studentName String
  score       Float
  source      String   @default("autonomous")
  completedAt DateTime?
  createdAt   DateTime @default(now())
}
```

### Endpoints autonomous-sessions
```
POST   /classes/:classId/autonomous-sessions                    — lanzar tarea (JWT)
GET    /classes/:classId/autonomous-sessions                    — listar sesiones (JWT)
GET    /autonomous-sessions/:sessionId                          — detalle + auto-update status (público)
PATCH  /autonomous-sessions/:sessionId                          — editar sesión (JWT)
DELETE /autonomous-sessions/:sessionId                          — cancelar (JWT, solo scheduled)
POST   /autonomous-sessions/:sessionId/join                     — estudiante entra (público)
POST   /autonomous-sessions/:sessionId/progress                 — guardar progreso por slide (público)
PATCH  /autonomous-sessions/:sessionId/progress/:progressId     — editar score manual (JWT)
POST   /autonomous-sessions/:sessionId/complete                 — estudiante finaliza (público)
GET    /autonomous-sessions/:sessionId/results                  — gradebook docente (JWT)
```

### Seguridad de acceso
- **PIN de 6 dígitos** generado automáticamente al crear la sesión
- **Matching de nombres** con tolerancia: normalización + fonética colombiana + Levenshtein
  - v↔b, s↔c↔z, ll↔y, h silenciosa, j↔g
  - Tolerancia: ≤5 chars=1, 6-9=2, ≥10=3
- **Anti-repetición:** PIN + nombre normalizado = identidad del estudiante
- **Modo Recuperación:** bloquea si ya existe ClassResult para ese estudiante en esa clase

### Propósito de la tarea
- `independent` — tarea independiente, planilla separada en Lumina Edu
- `recovery` — recuperación, nota va a planilla principal como AutonomousGrade

### Cálculo de score — reglas completas
```
Sin responder (response === null)    → 0.0
Respondió, ningún acierto            → 1.0 (mínimo siempre)
Respondió, aciertos parciales        → proporcional 1.0–5.0
Todo correcto                        → 5.0
nota_final = promedio de scores por actividad
```

| Tipo | Cálculo |
|------|---------|
| `quiz_multiple`, `verdadero_falso` | Binario: correcto=5.0, incorrecto=1.0 |
| `completar_blancos`, `arrastrar_soltar`, `emparejar`, `ordenar_pasos` | Proporcional + mínimo 1.0 |
| `video_interactivo` | Proporcional por preguntas correctas + mínimo 1.0 |
| `short_answer`, `encuesta_viva`, `nube_palabras` | Participación: respondió=1.0, no respondió=0.0 (**manual**) |

### Comportamiento especial video_interactivo
- El viewer autónomo acumula respuestas en un array por slideId
- `handleResponse` para video_interactivo: `response: [...historial, { questionIndex, answer }]`
- `saveProgress()` recibe el array acumulado y calcula score proporcional
- `scoreActivityResponse` evalúa cada respuesta contra `opciones[i].esCorrecta`

### Scoring en saveProgress()
- `activityType` enviado desde el frontend en cada POST /progress
- Score calculado inmediatamente al guardar — no en complete()
- No sobreescribe score válido si nueva response es null
- Slides sin activityType (contenido puro) son ignorados

### Edición manual de scores
- `PATCH /autonomous-sessions/:sessionId/progress/:progressId` con `{ score }`
- Tras edición: recalcula `AutonomousResult.finalScore` automáticamente
- `getResults()` calcula promedio en vivo desde progress (no desde finalScore guardado)
- `finalScore` en AutonomousResult se actualiza para consistencia histórica

### Viewer autónomo
- Ruta: `/autonomo/[sessionId]`
- 3 pantallas: entrada (nombre + PIN), slides, finalización
- Fullscreen real: `fixed inset-0` con `SlideRenderer` en `absolute inset-0`
- `SlideRenderer` acepta prop `viewerFill` para no forzar aspect ratio 16/9
- NO usa Socket.IO — 100% REST/HTTP
- `respondedSlideIds` ref previene sobreescribir respuesta con null

---

## Arquitectura de Datos

**Jerarquía:** Class → Slides → Blocks → Activities

**Slide content JSON:**
```json
{
  "id": "slide_xxx",
  "tipo": "contenido",
  "layout": "titulo_y_contenido",
  "fondo": { "tipo": "color", "valor": "#FFFFFF" },
  "bloques": [],
  "timer": 30
}
```

**Block types:** `texto`, `imagen`, `actividad`

**Activity types (10 implementados):**
`quiz_multiple`, `verdadero_falso`, `arrastrar_soltar`, `video_interactivo`,
`encuesta_viva`, `completar_blancos`, `emparejar`, `ordenar_pasos`,
`nube_palabras`, `short_answer`

---

## Sistema de Calificación — Reglas de Negocio

### Escala de valoración colombiana
| Rango | Desempeño |
|-------|-----------|
| 1.0 – 2.9 | Bajo |
| 3.0 – 3.9 | Básico |
| 4.0 – 4.6 | Alto |
| 4.7 – 5.0 | Superior |

### Helper scoreActivityResponse
Ubicación: `src/classes/class-results-gradebook.helper.ts`
Función: `applyMinScore(raw, responded)` — garantiza mínimo 1.0 si respondió

### Actividades de calificación manual
```typescript
const MANUAL_GRADING = ['short_answer', 'encuesta_viva', 'nube_palabras']
```
- Celdas con borde azul `#2563EB` en planilla
- Docente hace clic → input editable (0.0 a 5.0, step 0.1)
- En clase en vivo: PATCH /classes/:classId/results/:resultId
- En tareas autónomas: PATCH /autonomous-sessions/:sessionId/progress/:progressId

### Fix scoring encuesta_viva y nube_palabras (V22)
En clase en vivo, el frontend calculaba `score = response.correct === null ? 0.0 : 1.0`.
`correct === null` es el comportamiento normal de estas actividades (no tienen respuesta correcta).
**Fix:** `score = 1.0` siempre que haya respuesta en liveResponses.

---

## Lumina Edu — Planilla (V22)

### Tabs en grade-book-client.tsx
- **Clase en vivo** — ClassResult con desglose por actividad
- **Tareas autónomas** — AutonomousResult/Progress con desglose por actividad

### Clase en vivo
- Desglose por actividad (columnas por slideId)
- Badge "Recuperación" para estudiantes con AutonomousGrade (source='autonomous')
- Celdas manuales editables con borde azul → PATCH /classes/:classId/results/:resultId

### Tareas autónomas
- Selector de sesión si hay más de una (solo purpose='independent')
- Tabla con columnas por actividad (mismo formato que clase en vivo via normalizeFromRows)
- Celdas manuales editables → PATCH /autonomous-sessions/:sessionId/progress/:progressId
- Promedio final calculado en vivo desde progress (no desde finalScore)
- Mensaje vacío si no hay sesiones independent

### normalizeFromRows — función unificada
- Exportada de `use-gradebook.ts`
- Reutilizada para clase en vivo Y tareas autónomas
- `GET /autonomous-sessions/:sessionId/results` retorna mismo formato que gradebook:
```json
[{
  "studentId": "...",
  "nombre": "...",
  "promedio": 3.45,
  "source": "autonomous",
  "resultados": [
    { "slideId": "...", "activityType": "quiz_multiple", "score": 5.0, "maxScore": 5, "isManual": false, "id": "progressId" }
  ]
}]
```

---

## Viewers — Layout Fullscreen (V22)

### viewer-client.tsx (clase en vivo)
- Contenedor raíz: `fixed inset-0 overflow-hidden`
- Slide: `absolute inset-0`
- `SlideRenderer` con prop `viewerFill={true}`

### autonomo-client.tsx (tarea autónoma)
- Mismo patrón de capas absolutas que viewer en vivo
- Topbar superpuesta: `absolute inset-x-0 top-0 z-30`
- Slide: `absolute inset-0 z-10`
- Botones nav: `absolute left/right-4 top-1/2 z-30`

### SlideRenderer — prop viewerFill
- `viewerFill={true}` → no fuerza `aspectRatio: 16/9`
- `viewerFill={false}` (default) → mantiene aspect ratio para editor y miniaturas

---

## Flujo de Sesión en Vivo

1. Docente → **Iniciar clase** → `POST /classes/:id/sessions/start` → retorna `sessionId`
2. Estudiante → `/join/[codigo]` → ingresa nombre → `lumina_student_name` en localStorage
3. Estudiante responde actividades → Socket.IO emite `response-update`
4. Editor recibe respuestas en panel EN VIVO (`liveResponses` Map por slideId)
5. Docente → **Finalizar clase** → calcula scores → `POST /classes/:id/results` → `PATCH /classes/:id/sessions/end`

### Fix seguridad clase en vivo (V21)
- `POST /classes/:id/results` verifica ClassSession activa
- Sin sesión activa → 400 "No hay una sesión activa para esta clase"
- Gradebook usa registro más reciente en duplicados (orderBy updatedAt)

---

## Endpoints Clave

### Backend (puerto 3000)
```
POST   /auth/login
POST   /auth/register

GET    /classes/:id
PATCH  /classes/:id
GET    /classes/join/:codigo                           — público
POST   /classes/:id/sessions/start
PATCH  /classes/:id/sessions/end
POST   /classes/:id/results                            — requiere ClassSession activa
PATCH  /classes/:classId/results/:resultId
GET    /classes/:id/gradebook
GET    /classes/:id/versions
POST   /classes/:id/versions
PUT    /classes/:id/versions/:versionId/restore
POST   /classes/:id/slides/insert
GET    /classes/:classId/autonomous-sessions
POST   /classes/:classId/autonomous-sessions

GET    /autonomous-sessions/:sessionId
PATCH  /autonomous-sessions/:sessionId
DELETE /autonomous-sessions/:sessionId
POST   /autonomous-sessions/:sessionId/join
POST   /autonomous-sessions/:sessionId/progress
PATCH  /autonomous-sessions/:sessionId/progress/:progressId
POST   /autonomous-sessions/:sessionId/complete
GET    /autonomous-sessions/:sessionId/results

GET    /courses
POST   /courses
GET    /courses/:id
GET    /edu/courses/:courseId/gradebook
GET    /edu/courses/:courseId/analytics
```

---

## Archivos Clave

### Frontend
```
src/app/(app)/classes/classes-client.tsx
src/app/(app)/classes/[id]/editor/editor-client.tsx
src/app/(app)/classes/[id]/editor/components/canvas-area.tsx
src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx   — prop viewerFill
src/app/(app)/classes/[id]/editor/components/slides-panel.tsx
src/app/(app)/classes/[id]/editor/components/icon-rail.tsx
src/app/(app)/classes/[id]/editor/components/right-rail.tsx
src/app/(app)/classes/[id]/editor/components/right-flyout-panel.tsx
src/app/(app)/classes/[id]/editor/components/floating-toolbar.tsx
src/app/(app)/classes/[id]/editor/components/activities/           — 10 archivos
src/app/(app)/classes/[id]/class-detail-client.tsx
src/app/(app)/classes/[id]/components/launch-autonomous-modal.tsx
src/app/(app)/classes/[id]/components/edit-autonomous-modal.tsx
src/app/(app)/classes/[id]/viewer/viewer-client.tsx                — fullscreen fixed inset-0
src/app/(app)/edu/[courseId]/grade-book-client.tsx                 — tabs + celdas manuales autónomas
src/app/(app)/edu/edu-home-client.tsx
src/app/(app)/dashboard/dashboard-client.tsx
src/app/(app)/analytics/analytics-client.tsx
src/app/(app)/courses/
src/app/(app)/profile/page.tsx
src/app/join/[codigo]/join-client.tsx
src/app/autonomo/[sessionId]/page.tsx
src/app/autonomo/[sessionId]/autonomo-client.tsx                   — fullscreen + video acumulado
src/components/layout/sidebar.tsx
src/hooks/api/use-course-analytics.ts
src/hooks/api/use-autonomous-sessions.ts
src/hooks/api/use-autonomous-viewer.ts
src/hooks/api/use-autonomous-results.ts                            — useUpdateAutonomousScore
src/hooks/use-autosave.ts
src/hooks/use-slide-timer.ts
src/hooks/use-slide-versions.ts
src/hooks/use-gradebook.ts                                         — normalizeFromRows exportada
src/styles/globals.css
tailwind.config.ts
src/types/autonomous.types.ts
```

### Backend
```
src/classes/classes.controller.ts
src/classes/classes.service.ts
src/classes/classes.gateway.ts
src/classes/class-results-gradebook.helper.ts       — scoreActivityResponse() + applyMinScore()
src/classes/dto/update-result-score.dto.ts
src/autonomous-sessions/autonomous-sessions.module.ts
src/autonomous-sessions/autonomous-sessions.controller.ts
src/autonomous-sessions/autonomous-sessions.service.ts
src/autonomous-sessions/name-matcher.helper.ts
src/autonomous-sessions/dto/create-autonomous-session.dto.ts
src/autonomous-sessions/dto/update-autonomous-session.dto.ts
src/autonomous-sessions/dto/join-autonomous-session.dto.ts
src/autonomous-sessions/dto/save-progress.dto.ts
src/autonomous-sessions/dto/update-autonomous-progress-score.dto.ts
prisma/schema.prisma
```

---

## Funcionalidades Implementadas

### Editor (Lumina Core)
- Canvas libre tipo Canva/PowerPoint (drag, resize 8 dirs, undo/redo, capas, fondo)
- Snap/guías de alineación durante drag y resize
- 10 tipos de actividad con editor y viewer
- 10 layouts con miniaturas SVG tipo PowerPoint
- Slide insert/reorder via @dnd-kit
- Miniaturas de slides con badge de actividad
- Panel EN VIVO con respuestas legibles por tipo
- Autoguardado debounce 2s
- Historial de versiones (últimas 10, restaurar)
- Atajos de teclado completos
- Duplicar slide y bloque
- Copiar/pegar bloques entre slides
- Vista previa slide-by-slide
- Temporizador por slide (global + override)
- Bloquear/desbloquear respuestas manual
- Contador respondieron en topbar
- 12 fondos SVG/CSS propios (sin imágenes externas)

### Flujo de sesión en vivo
- Código LUM-6chars para unirse
- Página `/join/[codigo]`
- Botones Iniciar/Finalizar clase
- Sync slide-change editor ↔ viewer via Socket.IO
- Modo presentación y modo autónomo
- Pantalla resumen estudiante al finalizar
- Confirmación visual al responder
- Bloqueo de respuestas sin sesión activa

### Modo Autónomo — COMPLETO (V21-V22)
- Lanzar clase como tarea con fechas apertura/cierre
- PIN de acceso de 6 dígitos automático
- Propósito: Recuperación o Tarea independiente
- Intentos configurables (1/2/3/ilimitados)
- Navegación configurable (permitir/bloquear volver)
- Timer behavior: avanzar automáticamente o bloquear respuesta
- Anti-repetición por PIN + matching nombre (fonética colombiana)
- Bloqueo en modo Recuperación si ya tiene nota en clase en vivo
- Badge de estado en class-detail (programada/abierta) con refetch 30s
- Modal editar sesión con PIN visible
- Viewer fullscreen con SlideRenderer en absolute inset-0
- Score calculado en tiempo real por slide con activityType desde frontend
- Score mínimo 1.0 si respondió, 0.0 solo si no respondió
- arrastrar_soltar: onResponse en cada drop
- video_interactivo: respuestas acumuladas por questionIndex, score proporcional
- Celdas manuales editables en planilla de tareas autónomas
- Promedio calculado en vivo desde progress (no desde finalScore)

### Calificación (Lumina Edu)
- Score proporcional escala colombiana (1.0–5.0)
- Actividades manuales con celdas azules editables (ambos modos)
- Promedio final y desempeño en tiempo real
- Tabs: Clase en vivo | Tareas autónomas
- Badge "Recuperación" en planilla principal
- Tareas autónomas con desglose por actividad
- Fix: encuesta_viva y nube_palabras = 1.0 cuando respondido

### Analytics
- KPIs reales desde gradebook
- Ranking de actividades con rendimiento
- Estudiantes en riesgo identificados
- Distribución de desempeño
- Engagement: "Disponible próximamente"

---

## Estado del Roadmap

### ✅ Completado (V22)
- Todo lo de V21 +
- Viewer fullscreen real (prop viewerFill en SlideRenderer)
- video_interactivo: acumulación de respuestas + score proporcional
- Celdas manuales editables en tareas autónomas
- Promedio en vivo desde progress en getResults()
- PATCH /autonomous-sessions/:sessionId/progress/:progressId
- Fix encuesta_viva y nube_palabras = 1.0 en clase en vivo
- Pruebas con todas las actividades en ambos modos ✅

### 🔲 Mejoras estéticas pendientes
- Entrada escalonada en actividades (staggered animation)
- useSound con Web Audio API (sin dependencias externas)
- Barras animadas en vivo para encuesta (live poll)
- prop `variant: "dark" | "light"` en viewers según fondo elegido

### 🔲 Funcionalidades pendientes (roadmap)
- **Analytics backend** — SessionLog, StudentConnection, SlideEngagement (siguiente)
- Nuevas actividades Wordwall-style (15 tipos)
- Escape Room
- Torneo de preguntas
- Historia ramificada
- Gamificación y reportes
- Importar PPT/Google Slides

### 🔲 Lumina 2.0 — visión futura (definida, no iniciada)
- Repositorio público `/explore`
- Sistema fork, rankings, colecciones
- Co-autoría, perfil público, seguir docentes
- Auth rediseñado, onboarding, feedback widget
- Bloque `contenido_externo_html5` (Scratch, PhET, GeoGebra)
- Fondos animados en slides
- Página pública de landing `/`

---

## Patrones Críticos

### PowerShell
- NO usar `&&` — ejecutar comandos uno por uno
- Rutas con paréntesis/corchetes entre comillas
- Conflicto de puertos: `netstat -ano | findstr :3000` → `taskkill /PID [n] /F`

### Git
- **NUNCA ejecutar `git add`, `git commit`, ni `git push`** — Jaime los hace manualmente

### Frontend
- Coordenadas de bloques siempre en porcentaje (0–100)
- `BLOCK_FALLBACKS` importado desde `@/types/slide.types`
- Body parser backend: 50mb
- No usar `<button>` como contenedor de SlideRenderer — usar `<div role="button">`
- localStorage keys: `lumina_student_name`, `lumina_student_id`
- Autoguardado NO crea versiones — solo el guardado manual crea SlideVersion
- Layout: `main` tiene `flex-1 min-w-0 overflow-y-auto`
- Páginas internas: contenedor raíz siempre `w-full p-6`
- SNAP_COLOR naranja `#F97316` — no tocar
- Viewer autónomo NO usa Socket.IO — 100% REST/HTTP
- `respondedSlideIds` ref en autonomo-client previene sobreescribir con null

### Backend
- `GET /classes/join/:codigo` es público (sin `@UseGuards`)
- `verifyTeacherOwnership` para rutas de resultados/gradebook/versiones
- Prisma 7: `prisma.config.ts` + driver adapter `PrismaPg`
- `POST /classes/:id/results` requiere ClassSession activa
- `saveProgress()` ignora slides sin activityType (return early)
- `saveProgress()` no sobreescribe score válido con null
- `saveProgress()` para video_interactivo: mergea historial por questionIndex
- `getResults()` calcula promedio en vivo desde progress, finalScore solo como fallback

### React Query
- Respuestas paginadas: `Array.isArray(raw) ? raw : raw?.data ?? []`
- Tras PATCH manual: actualizar caché con `setQueryData` + `computeStudentPromedio()`
- `useAutonomousSessions(classId, { refetchInterval: 30000 })` en class-detail

### Diseño Lumina 2.1 — regla de oro
- Color `#2563EB` SOLO en botones CTA, links activos, íconos de acción, barras de progreso
- Tipografía siempre `#111827` / `#6b7280` — nunca azul en texto de contenido
- Fondos: `#ffffff` cards, `#f9fafb` app shell
- Bordes: `#e5e7eb` siempre neutro
- Sombras: `rgba(0,0,0, 0.06–0.10)` neutras
- dark: prefixes eliminados — Lumina no tiene modo oscuro

### LUMINA_CONTEXT_V22.md — ubicación
- Colocar en `lumina-frontend/` (raíz del proyecto frontend) para que Cursor lo encuentre
- El workspace de Cursor apunta a `lumina-frontend/`, no a la raíz del monorepo

---

## Flujo Multi-Agente

| Agente | Especialidad |
|--------|-------------|
| Claude | Arquitectura, análisis, prompts, contexto, generación de V*.md |
| Cursor | Ejecutor principal de código (frontend + backend) |
| Antigravity / Gemini 2.5 Pro | Tareas paralelas, archivos independientes, contexto largo |
| GitHub Copilot | Bug fixes, tipos, DTOs, autocompletado |
| Claude Code | Tareas multi-archivo, cambios globales, páginas nuevas |

---

## Forma de Trabajo

- Ejecutar autónomamente sin pedir permiso (excepto acciones destructivas)
- Respuestas concisas y directas
- Build debe pasar sin errores antes de terminar cada tarea
- Leer `CLAUDE.md` antes de empezar
- PowerShell: NO usar `&&`
- **NUNCA ejecutar git add, git commit ni git push**
- Prompts para agentes siempre en bloques de código copiables

---

## Instrucción para Nueva Sesión

1. Lee este archivo completo
2. Lee `CLAUDE.md` (frontend) o `.cursorrules` (backend) según la tarea
3. Confirma con "Listo, entendido" + resumen del estado actual
4. Arrancar por la primera tarea pendiente sin preguntar
