# LUMINA_CONTEXT_V25.md
_Actualizado: 14/05/2026 — Sesión de revisión y roadmap_

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
- @dnd-kit/core + @dnd-kit/sortable (drag & drop)
- pnpm

**Backend:**
- NestJS + Prisma 7 + PostgreSQL
- Redis (caché, sesiones, telemetría torneo)
- Socket.IO server
- JWT auth
- ioredis (instalado en V24 para TorneoService)
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

### Modelos Prisma
```prisma
model AutonomousSession {
  id                 String   @id @default(cuid())
  classId            String
  teacherId          String
  opensAt            DateTime
  closesAt           DateTime
  allowBackNav       Boolean  @default(true)
  maxAttempts        Int      @default(1)
  timerBehavior      String   @default("advance")
  requireManualStart Boolean  @default(false)
  status             String   @default("scheduled")
  pin                String
  purpose            String   @default("independent")
  createdAt          DateTime @default(now())
}

model AutonomousProgress {
  id            String   @id @default(cuid())
  sessionId     String
  studentId     String
  studentName   String
  slideId       String
  activityType  String?
  response      Json?
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
  status        String   @default("in_progress")
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
POST   /classes/:classId/autonomous-sessions
GET    /classes/:classId/autonomous-sessions
GET    /autonomous-sessions/:sessionId
PATCH  /autonomous-sessions/:sessionId
DELETE /autonomous-sessions/:sessionId
POST   /autonomous-sessions/:sessionId/join
POST   /autonomous-sessions/:sessionId/progress
PATCH  /autonomous-sessions/:sessionId/progress/:progressId
GET    /autonomous-sessions/:sessionId/results
GET    /autonomous-sessions/:sessionId/results/student
```

---

## Analytics — COMPLETO (V23)

### Modelos Prisma
```prisma
model SessionLog {
  id              String    @id @default(cuid())
  sessionId       String    @unique
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
  timeOnSlide   Int        @default(0)
  responded     Boolean    @default(false)
  attemptNumber Int        @default(1)
  source        String     @default("live")
  createdAt     DateTime   @default(now())
  sessionLog SessionLog @relation(fields: [sessionLogId], references: [id], onDelete: Cascade)
  @@unique([sessionLogId, slideId, studentId])
}
```

### Endpoints analytics
```
GET /analytics/course/:courseId
GET /analytics/course/:courseId/sessions
GET /analytics/session/:sessionId/detail
GET /analytics/course/:courseId/text-responses
```

---

## Torneo de Preguntas — COMPLETO (V24)

### Mecánica de puntos
- Respuesta correcta: 1000 pts base + hasta 500 pts bonus velocidad
- Rango total: 0–1500 pts por pregunta
- Respuesta incorrecta o timeout: 0 pts

### Modelos Prisma (migración: `torneo`)
```prisma
model TorneoSession {
  id        String   @id @default(cuid())
  classId   String
  sessionId String
  status    String   @default("waiting")
  currentQ  Int      @default(0)
  createdAt DateTime @default(now())
}

model TorneoAnswer {
  id            String   @id @default(cuid())
  torneoId      String
  studentId     String
  studentName   String
  questionIndex Int
  answer        String
  correct       Boolean
  responseMs    Int
  points        Int
  createdAt     DateTime @default(now())
}
```

### Redis — claves del torneo
- `torneo:{torneoId}:q{index}:startTime` → `Date.now()`, TTL 60s

### Módulo backend
- `src/torneo/torneo.service.ts`
- `src/torneo/torneo.module.ts` — importado en LiveSessionsModule

### Eventos Socket.IO (namespace `/live`)
| Evento | Dirección | Payload |
|--------|-----------|---------|
| `torneo:init` | cliente→servidor (docente) | `{ classId, sessionId }` |
| `torneo:launch-question` | cliente→servidor (docente) | `{ torneoId, index, question, timeLimit }` |
| `torneo:answer` | cliente→servidor (estudiante) | `{ torneoId, questionIndex, answer, correctAnswer, studentId, studentName }` |
| `torneo:finish` | cliente→servidor (docente) | `{ torneoId }` |
| `torneo:start` | servidor→sala | `{ torneoId, totalQuestions }` |
| `torneo:question` | servidor→sala | `{ index, question, options, timeLimit }` |
| `torneo:ranking` | servidor→sala | `[{ studentId, name, points, position }]` |
| `torneo:end` | servidor→sala | `{ ranking, podio: top3 }` |

### Tipo de actividad frontend
```typescript
interface TorneoActivity {
  tipo: "torneo"
  preguntas: {
    enunciado: string
    opciones: string[]
    correcta: string
    tiempoSegundos: number
  }[]
  puntosBase: number
  bonusVelocidad: number
}
```

### Archivos frontend
- `src/types/slide.types.ts` — TorneoActivity + BLOCK_FALLBACKS.torneo
- `src/components/viewers/torneo-viewer.tsx`
- `src/components/editor/activities/torneo-editor.tsx`
- `src/components/editor/activities/torneo-activity.tsx`
- `src/components/editor/panels/torneo-panel.tsx`
- `right-flyout-panel.tsx` — renderiza TorneoPanel cuando activeActivity.tipo === 'torneo'

---

## Escape Room — COMPLETO (V24)

### Mecánica de puntos
- Sala al 1er intento: 300 pts (× puntosBase/300)
- Sala al 2do intento: 150 pts
- Sala al 3er intento: 50 pts
- Sala bloqueada (intentos agotados): 0 pts, avanza igual

### Tipo de actividad frontend
```typescript
interface EscapeRoomSala {
  id: string
  nombre: string
  descripcion: string
  desafio: string
  tipoRespuesta: "texto" | "opcion_multiple" | "codigo"
  opciones?: string[]
  respuestaCorrecta: string
  ignorarMayusculas: boolean
  pista?: string
  intentosMaximos: number
}

interface EscapeRoomActivity {
  tipo: "escape_room"
  titulo: string
  introduccion: string
  salas: EscapeRoomSala[]
  tiempoLimiteMinutos?: number
  mostrarRanking: boolean
  puntosBase: number
}
```

### Archivos frontend
- `src/types/slide.types.ts` — EscapeRoomSala, EscapeRoomActivity, BLOCK_FALLBACKS.escape_room
- `src/components/viewers/escape-room-viewer.tsx` — 4 pantallas (intro, sala, victoria, derrota)
- `src/components/editor/activities/escape-room-editor.tsx`
- `src/components/editor/activities/escape-room-activity.tsx`

---

## Mejoras Estéticas — COMPLETO (V24)

### prop `variant: "dark" | "light"` en viewers
- `src/lib/slide-variant.ts` — `getSlideVariant(background)`
- **IMPORTANTE: el campo del modelo es `slide.fondo`, NO `slide.background`**
- Helper `slideBackgroundString(fondo)` serializa slide.fondo
- Propagado: BlockNode → RenderColumns → RenderActivity → los 10 viewers

### Barras animadas LivePollViewer
- `src/hooks/use-animated-number.ts` — requestAnimationFrame, ease-out cúbico
- Conteo "N votos · XX%", transition-all duration-700 ease-out

### Staggered animations
- `@keyframes lumina-block-in` en globals.css
- Delay `${index * 80}ms` por bloque
- `key={${slide.id}-${blockId}}` — remonta en cada cambio de slide

### useSound Web Audio API
- `src/hooks/use-sound.ts` — sin dependencias externas, fallback webkitAudioContext
- Sonidos: `correct`, `wrong`, `submit`, `reveal`
- Integrado en los 10 viewers

---

## Funcionalidades Implementadas (Estado Completo V24)

### Editor (Lumina Core)
- Canvas libre tipo Canva/PowerPoint (drag, resize 8 dirs, capas, fondo)
- Snap/guías de alineación durante drag y resize
- 12 tipos de actividad con editor y viewer
- 10 layouts con miniaturas SVG tipo PowerPoint
- Slide insert/reorder via @dnd-kit
- Miniaturas de slides con badge de actividad
- Panel EN VIVO con respuestas legibles por tipo + TorneoPanel
- Autoguardado debounce 2s
- Historial de versiones (últimas 10, restaurar)
- Atajos de teclado completos
- Duplicar slide y bloque
- Copiar/pegar bloques entre slides
- Vista previa slide-by-slide
- Temporizador por slide (global + override)
- Bloquear/desbloquear respuestas manual
- Contador respondieron en topbar
- 12 fondos SVG/CSS propios

### Actividades (12 tipos)
| # | Tipo | Estado |
|---|------|--------|
| 1 | Quiz múltiple opción | ✅ |
| 2 | Verdadero/Falso | ✅ |
| 3 | Arrastrar y soltar | ✅ |
| 4 | Video interactivo | ✅ |
| 5 | Encuesta en vivo | ✅ |
| 6 | Respuesta corta | ✅ |
| 7 | Completar espacios | ✅ |
| 8 | Emparejar | ✅ |
| 9 | Ordenar pasos | ✅ |
| 10 | Nube de palabras | ✅ |
| 11 | Torneo de preguntas | ✅ |
| 12 | Escape Room | ✅ |

### Flujo de sesión en vivo
- Código LUM-6chars, página `/join/[codigo]`
- Sync slide-change via Socket.IO namespace `/live`
- Torneo de preguntas en tiempo real
- Pantalla resumen estudiante al finalizar

### Modo Autónomo
- Tarea con fechas, PIN, intentos, propósito (Recuperación/Independiente)
- Anti-repetición, bloqueo Recuperación si ya tiene nota
- Score mínimo 1.0 si respondió

### Calificación (Lumina Edu)
- Escala colombiana 1.0–5.0
- Tabs: Clase en vivo / Tareas autónomas
- Celdas manuales editables, promedio en tiempo real

### Analytics
- KPIs, comparativa de sesiones, mapa de calor, embudo, engagement
- Respuestas de texto autónomo visibles
- CSV con BOM UTF-8

---

## Roadmap Completo — Estado V25

### ✅ Completado

Todo lo anterior hasta V24.

---

### 🔲 GRUPO 1 — Editor UX (mejoras al canvas)

**1. Drag-to-canvas**
Arrastrar actividades, widgets y bloques desde el panel lateral directamente al canvas.
El bloque se crea en la posición exacta donde se suelta.
Usa @dnd-kit ya instalado. Solo frontend.

**2. Smart Spacing Indicators**
Durante el drag de un bloque, mostrar flechas bidireccionales con la distancia en px/% hacia los bloques vecinos más cercanos (arriba, abajo, izquierda, derecha).
Para 3+ bloques alineados: indicadores de distribución equidistante (equal spacing).
Aparecen solo durante drag, desaparecen al soltar.
Solo frontend — mejora del canvas.
Referencia visual: flechas rojas de PowerPoint / indicadores rosas de Figma.

**3. Selección múltiple + barra de alineación**
Shift+click para seleccionar varios bloques.
Barra de herramientas flotante con: alinear izquierda, centrar H, alinear derecha, alinear arriba, centrar V, alinear abajo, distribuir horizontalmente, distribuir verticalmente.
Solo frontend.

**4. Guías manuales persistentes**
El docente arrastra desde el borde del canvas y queda una línea guía fija (horizontal o vertical).
Se puede eliminar arrastrándola fuera del canvas.
Se guardan en el slide como metadato (no afectan el viewer).
Solo frontend.

**5. Sistema de Temas de Slide**
Plantilla visual que define para cada layout: fondo (color/degradado/imagen), paleta de colores, bloques decorativos fijos (imágenes, formas, textos de marca).
El docente elige un tema al crear la clase — todos los slides heredan esa identidad.
`slide.fondo` tiene prioridad sobre el tema (sobreescritura por slide).
Requiere: modelo `SlideTheme` en Prisma, selector en editor, archivos estáticos en `src/data/themes/`.
Frontend + backend ligero.

---

### 🔲 GRUPO 2 — Widgets de contenido interactivo

**Categoría separada de las actividades** — son elementos de presentación enriquecida, no evaluables, que el docente inserta en el canvas como bloques.

#### Widgets tipo Captivate (5)

**6. Flip Cards**
Tarjetas que se voltean al hacer click mostrando contenido en el reverso.
Configurable: N tarjetas, imagen+texto en frente, imagen+texto en dorso, animación de volteo.

**7. Click to Reveal**
Elemento con overlay encima. Al hacer click el overlay desaparece revelando el contenido debajo.
Configurable: imagen/texto base, texto/imagen de overlay, efecto de revelación.

**8. Tabs**
Pestañas horizontales o verticales con contenido imagen+texto por pestaña.
Configurable: N pestañas, orientación, contenido por pestaña.

**9. Carousel**
Slider de páginas con navegación prev/next.
Dos modos: página completa / tarjeta.
Configurable: N páginas, contenido imagen+texto, autoplay opcional.

**10. Timeline**
Línea de tiempo con eventos.
Dos layouts: horizontal con cards / vertical alternado.
Configurable: N eventos, fecha+título+descripción+imagen por evento.

#### Elementos interactivos tipo Genially (por definir en sesión dedicada)

**11. Elementos interactivos Genially-style**
Categoría pendiente de redefinir completamente. Incluye al menos:
- Puntos parpadeantes (hotspots) sobre imagen — al hacer click abre ventana emergente con contenido
- Ventanas emergentes (popups) con título, texto, imagen
- Posiblemente más elementos definidos anteriormente pero perdidos del contexto

> ⚠️ Esta categoría requiere una sesión de definición antes de implementar.

---

### 🔲 GRUPO 3 — Animaciones y transiciones (definidas, no en roadmap aún)

> Anotadas para futura planificación. No tienen fecha ni prioridad asignada.

- **Transiciones entre slides**: fade, slide H/V, zoom, sin transición. Referencia técnica: Reveal.js
- **Animaciones de entrada configurables por bloque**: tipo, duración, delay, orden
- **Animaciones de énfasis**: pulse, shake, flash
- **Animaciones de salida**: para revelar contenido progresivo en el mismo slide

---

### 🔲 GRUPO 4 — Actividades nuevas

**12. Historia ramificada**
Árbol de decisiones — el estudiante elige caminos y llega a desenlaces según sus respuestas.
Alta complejidad — requiere diseño de estructura de árbol en el editor.

**13–27. 15 actividades Wordwall-style**
Pendiente de definir lista exacta. Candidatos: sopa de letras, crucigrama, memory, rueda de la fortuna, anagrama, buscar el par, quiz de imagen, categorizar, línea de tiempo, diana de valoración, votación con emoji, carrera de caballos, pictograma, quiz de audio, adivina la palabra.

---

### 🔲 GRUPO 5 — Plataforma

**28. Gamificación y reportes**
Puntos acumulados por curso, insignias, tabla de líderes.
Reportes descargables en PDF y Excel.

**29. Importar PPT/Google Slides**
Parser de presentaciones externas → slides de Lumina.
Alta complejidad — requiere librería dedicada.

---

### 🔲 GRUPO 6 — Lumina 2.0 (visión futura, no iniciada)

- Repositorio público `/explore`
- Sistema fork, rankings, colecciones temáticas
- Co-autoría, perfil público docente, seguir docentes
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
- Si aparece `ENOENT pages-manifest.json`: borrar `.next` y repetir `pnpm build`

### Git
- **NUNCA ejecutar `git add`, `git commit`, ni `git push`** — Jaime los hace manualmente

### Frontend
- **Campo discriminante de actividades: `tipo`, NO `type`**
- **Campo de fondo del slide: `slide.fondo`, NO `slide.background`**
- `slideBackgroundString(fondo)` serializa slide.fondo para getSlideVariant
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
- TorneoService usa ioredis para startTime por pregunta (TTL 60s)

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

### LUMINA_CONTEXT_V25.md — ubicación
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
| live-sessions | `src/live-sessions/` | Gateway `/live`, sync slides, torneo, telemetría |
| autonomous-sessions | `src/autonomous-sessions/` | Modo autónomo, progreso, calificación |
| analytics | `src/analytics/` | Telemetría sesiones, engagement, resumen curso |
| gradebook | `src/gradebook/` | Estructura de evaluación institucional |
| curriculum | `src/curriculum/` | EBC, DBA, áreas MEN |
| torneo | `src/torneo/` | TorneoSession, TorneoAnswer, puntuación, Redis |

---

## Flujo de Sesión en Vivo — Gateway

Namespace activo: `/live` en `src/live-sessions/live-sessions.gateway.ts`

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `session:start` | cliente→servidor | Docente inicia sesión |
| `session:end` | cliente→servidor | Docente finaliza sesión |
| `join` | cliente→servidor | Estudiante/docente entra a la sala |
| `leave` | cliente→servidor | Salida voluntaria |
| `slide:sync` | cliente→servidor | Docente sincroniza diapositiva activa |
| `slide:state` | cliente→servidor | Leer estado actual sin unirse |
| `session:started` | servidor→sala | Confirmación de inicio |
| `session:ended` | servidor→sala | Confirmación de fin |
| `slide:current` | servidor→sala | Broadcast de diapositiva actual |
| `torneo:init` | cliente→servidor | Docente inicia torneo |
| `torneo:launch-question` | cliente→servidor | Docente lanza pregunta |
| `torneo:answer` | cliente→servidor | Estudiante responde |
| `torneo:finish` | cliente→servidor | Docente termina torneo |
| `torneo:start` | servidor→sala | Torneo iniciado |
| `torneo:question` | servidor→sala | Pregunta en curso |
| `torneo:ranking` | servidor→sala | Ranking parcial |
| `torneo:end` | servidor→sala | Resultado final |

---

## Referencias Técnicas Externas

- **Reveal.js** (`github.com/hakimel/reveal.js`) — referencia para implementar transiciones entre slides. Estudiar su código fuente antes de escribir cualquier línea de transiciones en Lumina.

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
- Leer `LUMINA_CONTEXT_V25.md` antes de empezar
- PowerShell: NO usar `&&`
- **NUNCA ejecutar git add, git commit ni git push**
- Prompts para agentes siempre en bloques de código copiables
- **Especificar siempre si el trabajo es en `lumina-frontend` o `lumina-backend`**

---

## Instrucción para Nueva Sesión

1. Lee este archivo completo
2. Lee `CLAUDE.md` (frontend) o `.cursorrules` (backend) según la tarea
3. Confirma con "Listo, entendido" + resumen del estado actual
4. Arrancar por la primera tarea pendiente sin preguntar
