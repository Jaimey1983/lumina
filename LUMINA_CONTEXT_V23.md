# LUMINA_CONTEXT_V23.md
_Actualizado: 29/04/2026 — Sesión 29/04/2026_

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
GET    /autonomous-sessions/:sessionId/results                  — planilla docente (JWT)
GET    /autonomous-sessions/:sessionId/results/student          — resultado estudiante (público)
```

---

## Analytics — COMPLETO (V23)

### Concepto
Telemetría real de engagement durante sesiones en vivo + respuestas de texto en modo autónomo.
Reemplaza el analytics de solo-notas por datos de comportamiento en tiempo real.

### Modelos Prisma nuevos (migración: `add_analytics_models`)
```prisma
model SessionLog {
  id              String    @id @default(cuid())
  sessionId       String    @unique           // FK a ClassSession.id
  classId         String
  courseId        String
  teacherId       String
  totalSlides     Int       @default(0)
  peakConnections Int       @default(0)
  startedAt       DateTime
  endedAt         DateTime?
  durationSeconds Int?
  createdAt       DateTime  @default(now())

  session          ClassSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  slideEngagements SlideEngagement[]
}

model StudentConnection {
  id             String    @id @default(cuid())
  sessionId      String
  classId        String
  studentId      String
  studentName    String
  connectedAt    DateTime  @default(now())
  disconnectedAt DateTime?
  reconnections  Int       @default(0)
}

model SlideEngagement {
  id            String     @id @default(cuid())
  sessionLogId  String
  slideId       String
  slideIndex    Int
  activityType  String?
  studentId     String
  studentName   String
  timeOnSlide   Int        @default(0)   // segundos
  responded     Boolean    @default(false)
  attemptNumber Int        @default(1)
  source        String     @default("live") // "live" | "autonomous"
  createdAt     DateTime   @default(now())

  sessionLog SessionLog @relation(fields: [sessionLogId], references: [id], onDelete: Cascade)

  @@unique([sessionLogId, slideId, studentId])
}
```

### Endpoints analytics
```
GET /analytics/course/:courseId              — resumen completo (KPIs, progreso, ranking, riesgo, distribución)
GET /analytics/course/:courseId/sessions     — comparativa entre sesiones con telemetría
GET /analytics/session/:sessionId/detail    — detalle: slideHeatmap, funnelData, studentEngagement
GET /analytics/course/:courseId/text-responses — respuestas de texto del modo autónomo
```

### Integración de escritura
- `live-sessions.service.ts → startLiveSession()`: crea `ClassSession` + `SessionLog`
- `live-sessions.service.ts → endLiveSession()`: cierra `ClassSession` + `SessionLog` con duración calculada
- `live-sessions.service.ts → joinLiveClass()`: llama `recordConnection()` + `updatePeakConnections()`
- `live-sessions.service.ts → onSocketDisconnect()`: llama `recordDisconnection()` vía `flushTelemetryDisconnect()`
- `classes.service.ts → saveResults()`: llama `recordSlideEngagement()` por cada resultado
- Todos los métodos de escritura son silenciosos (try/catch) — nunca rompen el flujo principal

### Frontend
- `src/hooks/api/use-analytics-sessions.ts` — hooks: `useSessionsComparison`, `useSessionDetail`, `useAutonomousTextResponses`
- `src/app/(app)/analytics/analytics-client.tsx` — secciones nuevas:
  - `SessionsComparisonSection` — tabla clicable de sesiones con telemetría
  - `SessionDetailSection` — mapa de calor de slides + embudo de participación (Recharts) + engagement por estudiante
  - `TextResponsesSection` — respuestas de texto autónomo agrupadas por tipo (short_answer / nube_palabras / encuesta_viva)
  - Botón "Descargar reporte" — CSV real con BOM UTF-8
  - `downloadStudentProgressCSV()` — genera y descarga CSV con nombre, actividades, promedio, desempeño

### Archivos modificados/creados (V23)
**Backend:**
- `prisma/schema.prisma` — 3 modelos nuevos
- `src/analytics/analytics.module.ts` — nuevo
- `src/analytics/analytics.service.ts` — nuevo (métodos lectura + escritura telemetría)
- `src/analytics/analytics.controller.ts` — nuevo
- `src/live-sessions/live-sessions.service.ts` — integración SessionLog + conexiones
- `src/classes/classes.service.ts` — recordSlideEngagement en saveResults
- `src/classes/classes.module.ts` — importa AnalyticsModule

**Frontend:**
- `src/hooks/api/use-analytics-sessions.ts` — nuevo
- `src/app/(app)/analytics/analytics-client.tsx` — actualizado

---

## Flujo de Sesión en Vivo — Gateway

El namespace activo es `/live` en `src/live-sessions/live-sessions.gateway.ts`.
El módulo `src/classes/classes.gateway.ts` existe pero es secundario.

Eventos Socket.IO del namespace `/live`:
| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `session:start` | cliente→servidor | Docente inicia sesión (PUBLISHED→LIVE) |
| `session:end` | cliente→servidor | Docente finaliza sesión (LIVE→PUBLISHED) |
| `join` | cliente→servidor | Estudiante/docente entra a la sala |
| `leave` | cliente→servidor | Salida voluntaria |
| `slide:sync` | cliente→servidor | Docente sincroniza diapositiva activa |
| `slide:state` | cliente→servidor | Leer estado actual sin unirse |
| `session:started` | servidor→sala | Confirmación de inicio |
| `session:ended` | servidor→sala | Confirmación de fin |
| `slide:current` | servidor→sala | Broadcast de diapositiva actual |

Autenticación: Bearer token en `handshake.auth.token` o header `Authorization`.

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
- Sync slide-change editor ↔ viewer via Socket.IO (namespace `/live`)
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

### Analytics — COMPLETO (V23)
- KPIs reales desde ClassResult + AutonomousGrade
- Comparativa de sesiones con telemetría (duración, participantes, promedio, conexiones pico)
- Detalle de sesión: mapa de calor de slides, embudo de participación, engagement por estudiante
- Respuestas de texto del modo autónomo visibles para el docente (gap V22 cerrado)
- Descarga CSV real con BOM UTF-8
- Telemetría de conexiones: recordConnection, recordDisconnection, peakConnections
- SlideEngagement registrado automáticamente en saveResults

---

## Estado del Roadmap

### ✅ Completado (V23)
- Todo lo de V22 +
- Módulo Analytics con telemetría real de sesiones en vivo
- SessionLog, StudentConnection, SlideEngagement
- Comparativa entre sesiones, detalle de sesión, embudo de participación
- Respuestas de texto autónomo visibles para el docente
- Descarga CSV del reporte de progreso

### 🔲 Mejoras estéticas pendientes
- Entrada escalonada en actividades (staggered animation)
- useSound con Web Audio API (sin dependencias externas)
- Barras animadas en vivo para encuesta (live poll)
- prop `variant: "dark" | "light"` en viewers según fondo elegido

### 🔲 Funcionalidades pendientes (roadmap)
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
- Analytics: métodos de escritura siempre en try/catch — nunca rompen flujo principal
- Gateway activo de sesión en vivo: namespace `/live` en `live-sessions.gateway.ts`
- `telemetryBySocketId` Map en LiveSessionsService para rastrear socket→{sessionId, studentId}

### React Query
- Respuestas paginadas: `Array.isArray(raw) ? raw : raw?.data ?? []`
- Tras PATCH manual: actualizar caché con `setQueryData` + `computeStudentPromedio()`
- `useAutonomousSessions(classId, { refetchInterval: 30000 })` en class-detail
- Analytics hooks: queryKey prefijo `['analytics', ...]`

### Diseño Lumina 2.1 — regla de oro
- Color `#2563EB` SOLO en botones CTA, links activos, íconos de acción, barras de progreso
- Tipografía siempre `#111827` / `#6b7280` — nunca azul en texto de contenido
- Fondos: `#ffffff` cards, `#f9fafb` app shell
- Bordes: `#e5e7eb` siempre neutro
- Sombras: `rgba(0,0,0, 0.06–0.10)` neutras
- dark: prefixes eliminados — Lumina no tiene modo oscuro

### LUMINA_CONTEXT_V23.md — ubicación
- Colocar en `lumina-frontend/` (raíz del proyecto frontend) para que Cursor lo encuentre
- El workspace de Cursor apunta a `lumina-frontend/`, no a la raíz del monorepo

---

## Mapeo de Módulos Backend

| Módulo | Ruta | Responsabilidad |
|--------|------|-----------------|
| auth | `src/auth/` | JWT, login, roles |
| users | `src/users/` | CRUD usuarios |
| courses | `src/courses/` | CRUD cursos |
| classes | `src/classes/` | Editor, slides, resultados, gradebook |
| live-sessions | `src/live-sessions/` | Gateway `/live`, sync slides, telemetría conexiones |
| autonomous-sessions | `src/autonomous-sessions/` | Modo autónomo, progreso, calificación |
| analytics | `src/analytics/` | Telemetría sesiones, engagement, resumen curso |
| gradebook | `src/gradebook/` | Estructura de evaluación institucional |
| curriculum | `src/curriculum/` | EBC, DBA, áreas MEN |

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
