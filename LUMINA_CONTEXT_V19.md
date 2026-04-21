# LUMINA_CONTEXT_V19.md
_Actualizado: 17/04/2026 — Sesión 08:00–21:00_

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

**Docker:** `lumina_postgres` (5432), `lumina_redis` (6379)
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
- NestJS + Prisma + PostgreSQL
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
| `autonomo` | Autónomo — estudiante navega a su ritmo, configurable por docente |

### Modo Autónomo — configuración granular (DEFINIDO, pendiente implementar)
- **Navegación:** docente decide si permite volver a slides anteriores (sí/no)
- **Timer:** hereda sistema existente (global o por slide)
- **Al expirar timer:** avanza automáticamente O bloquea respuesta (configurable)
- **Acceso:** con o sin inicio manual del docente
- **Fecha/hora de apertura y cierre**
- **Intentos:** 1 / N / ilimitados
- **Al vencer fecha:** guarda progreso parcial — slides no visitados = 0.0

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

### Fórmula de score por actividad
```
nota_actividad = (sub_respuestas_correctas / total_sub_respuestas) * 5.0
nota_final = promedio simple de todas las notas de actividades
```

### Reglas por tipo de actividad

| Tipo | Cálculo | Notas |
|------|---------|-------|
| `quiz_multiple`, `verdadero_falso` | Binario: correcto=5.0, incorrecto=1.0, no respondió=0.0 | Automático |
| `emparejar`, `completar_blancos`, `arrastrar_soltar`, `ordenar_pasos` | Proporcional por `details` | Automático |
| `video_interactivo` | Proporcional por `details` acumulados | Automático |
| `short_answer` | Respondió→1.0, no respondió→0.0 | **Manual** |
| `encuesta_viva` | Respondió→1.0, no respondió→0.0 | **Manual** |
| `nube_palabras` | Respondió→1.0, no respondió→0.0 | **Manual** |

### Actividades de calificación manual
```typescript
const MANUAL_GRADING = ['short_answer', 'encuesta_viva', 'nube_palabras']
```
- Celdas con borde azul `#2563EB` en planilla
- Docente hace clic → input editable (0.0 a 5.0, step 0.1)
- Guarda con Enter o blur → `PATCH /classes/:classId/results/:resultId`
- **Los estudiantes nunca tienen permisos de escritura en calificaciones**

---

## Flujo de Sesión en Vivo

1. Docente → **Iniciar clase** → `POST /classes/:id/sessions/start` → retorna `sessionId`
2. Estudiante → `/join/[codigo]` → ingresa nombre → `lumina_student_name` en localStorage
3. Estudiante responde actividades → Socket.IO emite `response-update`
4. Editor recibe respuestas en panel EN VIVO (`liveResponses` Map por slideId)
5. Docente → **Finalizar clase** → calcula scores → `POST /classes/:id/results` → `PATCH /classes/:id/sessions/end`

### Persistencia de respuestas en vivo
```typescript
sessionStorage.setItem(`lumina-live-responses-${classId}`, JSON.stringify([...liveResponses]))
```

---

## Endpoints Clave

### Backend (puerto 3000)

```
POST   /auth/login
POST   /auth/register

GET    /classes/:id                    — público (viewer)
PATCH  /classes/:id                    — actualizar clase
GET    /classes/join/:codigo           — público, sin guard
GET    /classes?courseId=:id           — clases por curso

POST   /classes/:id/sessions/start
PATCH  /classes/:id/sessions/end

POST   /classes/:id/results
PATCH  /classes/:id/results/:resultId

GET    /classes/:id/gradebook          — planilla Lumina Edu

GET    /classes/:id/slides/:slideId/versions
POST   /classes/:id/slides/:slideId/versions
POST   /classes/:id/slides/:slideId/versions/:versionId/restore
```

### Payload POST /classes/:id/results
```typescript
{
  sessionId: string,
  resultados: {
    studentId: string,
    slideId: string,
    activityType: string,
    correct: boolean | null,
    score: number,
    maxScore: number,
    historial: { label: string; correct: boolean | null }[][]
  }[]
}
```

---

## Analytics — Hooks implementados

```
src/hooks/api/use-course-analytics.ts  — KPIs desde gradebook
```

**KPIs conectados a datos reales:**
- Estudiantes totales del curso
- Promedio general (escala 0-5)
- Tasa de completitud (%)
- Clases activas (count publicadas)
- Ranking de actividades por tipo
- Estudiantes en riesgo (promedio < 3.0)
- Distribución de desempeño (Bajo/Básico/Alto/Superior)
- Progreso por estudiante

**Engagement:** pendiente — requiere `SessionLog` y `SlideEngagement` en backend

---

## Archivos Clave

### Frontend
```
src/app/(app)/classes/classes-client.tsx                       — lista de clases
src/app/(app)/classes/[id]/editor/editor-client.tsx            — lógica principal editor
src/app/(app)/classes/[id]/editor/components/canvas-area.tsx
src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx
src/app/(app)/classes/[id]/editor/components/slides-panel.tsx  — SlideThumbnailPreview (sin número)
src/app/(app)/classes/[id]/viewer/viewer-client.tsx
src/app/(app)/edu/[courseId]/grade-book-client.tsx
src/app/(app)/edu/edu-home-client.tsx
src/app/(app)/dashboard/dashboard-client.tsx
src/app/(app)/analytics/analytics-client.tsx
src/app/(app)/courses/                                         — lista de cursos
src/app/(app)/profile/page.tsx                                 — perfil docente (nuevo)
src/app/join/[codigo]/join-client.tsx
src/components/layout/sidebar.tsx                              — sidebar con avatar + logout
src/hooks/api/use-course-analytics.ts                          — analytics KPIs (nuevo)
src/hooks/use-autosave.ts
src/hooks/use-slide-timer.ts
src/hooks/use-slide-versions.ts
src/hooks/use-gradebook.ts
src/styles/globals.css                                         — tokens Lumina 2.1
tailwind.config.ts
```

### Backend
```
src/classes/classes.controller.ts
src/classes/classes.service.ts
src/classes/classes.gateway.ts
src/classes/class-results-gradebook.helper.ts
src/classes/dto/update-result-score.dto.ts
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
- Miniaturas de slides con badge de actividad (sin número de índice)
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
- Líneas referencia en bloques vacíos

### Flujo de sesión
- Código LUM-6chars para unirse
- Página `/join/[codigo]`
- Botones Iniciar/Finalizar clase
- Sync slide-change editor ↔ viewer via Socket.IO
- Modo presentación y modo autónomo
- Pantalla resumen estudiante al finalizar
- Confirmación visual al responder

### Calificación (Lumina Edu)
- Score proporcional escala colombiana
- Actividades manuales con celdas azules editables
- Promedio final y desempeño en tiempo real
- "Escala de valoración" (no "Escala colombiana")

### Analytics
- KPIs reales desde gradebook via `use-course-analytics`
- Ranking de actividades con rendimiento
- Estudiantes en riesgo identificados
- Distribución de desempeño
- Engagement: "Disponible próximamente"

### Visual Lumina 2.1 (completado 17/04/2026)
- Color primario azul `#2563EB` — reemplaza violeta globalmente
- Tipografía negra/gris como protagonista, base 15px
- Fondos blancos/gris neutro sin tinte
- Sombras grises neutras
- Bordes `#e5e7eb` neutros
- Sidebar con avatar + cierre de sesión en pie
- `/profile` página creada
- Navegación sidebar corregida (Inicio/Cursos/Mis Clases/Lumina Edu/Analytics/Perfil)
- Cards `/classes` con click para abrir detalle
- Badge Superior → verde

---

## Estado del Roadmap

### ✅ Completado
- Todo lo de V18 +
- Polish visual Lumina 2.1 (páginas principales)
- Analytics con datos reales
- Página /profile
- Sidebar navegación + logout

### ⏳ Polish visual pendiente
1. `/dashboard` (Inicio) — verificar paleta nueva
2. Página detalle de clase — badge Publicada + botón LUM
3. Editores de actividad — polish visual
4. Viewers de actividad — polish visual
5. Página `/join` — verificar paleta

### 🔲 Funcionalidades pendientes (roadmap)
- Modo autónomo — configuración granular (definido, no implementado)
- Analytics backend — SessionLog, StudentConnection, SlideEngagement
- Nuevas actividades Wordwall-style (15 tipos)
- Escape Room
- Torneo de preguntas
- Historia ramificada
- Gamificación y reportes
- Importar PPT/Google Slides

### 🔲 Lumina 2.0 — visión futura (definida, no iniciada)
- Repositorio público `/explore`
- Sistema fork (original protegido + copia personal)
- Rankings y calificación de material
- Colecciones temáticas
- Co-autoría
- Perfil público como portafolio profesional
- Seguir docentes / feed personalizado
- Búsqueda por DBA colombianos
- Versiones públicas con notificación a forks
- Comentarios pedagógicos entre docentes
- Insignias y reputación docente
- Auth rediseñado (login split-screen, registro multi-step 3 pasos, forgot/reset, verificación email)
- Onboarding checklist + tour opcional (2 roles: docente / coordinador)
- Feedback beta widget flotante (tipo + valoración + texto + URL automática)
- Bloque `contenido_externo_html5` (Scratch, PhET, GeoGebra)
- Fondos animados en slides (particles, ondas, gradientes)
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

### Backend
- `GET /classes/join/:codigo` es público (sin `@UseGuards`)
- `verifyTeacherOwnership` para rutas de resultados/gradebook/versiones
- Prisma 7: `prisma.config.ts` + driver adapter `PrismaPg`

### React Query
- Respuestas paginadas: `Array.isArray(raw) ? raw : raw?.data ?? []`
- Tras PATCH manual: actualizar caché con `setQueryData` + `computeStudentPromedio()`

### Diseño Lumina 2.1
- Color `#2563EB` SOLO en botones CTA, links activos, íconos de acción, barras de progreso
- Tipografía siempre `#111827` / `#6b7280` — nunca azul en texto de contenido
- Fondos: `#ffffff` cards, `#f9fafb` app shell
- Bordes: `#e5e7eb` siempre neutro
- Sombras: `rgba(0,0,0, 0.06–0.10)` neutras

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
