@AGENTS.md

# lumina-frontend

Plataforma educativa interactiva — frontend de Lumina. Conecta con el backend de Lumina (NestJS/REST) y soporta tres roles: `admin`, `teacher` y `student`, cada uno con un dashboard y permisos diferenciados.

---

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| TanStack React Query | ^5.95.2 |
| TanStack React Table | ^8.21.3 |
| React Hook Form | ^7.72.0 |
| Zod | ^4.3.6 |
| Axios | ^1.13.6 |
| Radix UI (vía `radix-ui`) | ^1.4.3 |
| Lucide React | ^1.7.0 |
| Motion | ^12.38.0 |
| ApexCharts / react-apexcharts | ^5.10.4 / ^2.1.0 |
| Recharts | ^2.15.1 |
| Sonner (toasts) | ^2.0.7 |
| next-themes | ^0.4.6 |
| date-fns | ^4.1.0 |
| @dnd-kit/core | ^6.3.1 |
| class-variance-authority (CVA) | ^0.7.1 |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 |
| Embla Carousel | ^8.6.0 |

---

## Comandos de inicio

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Servidor de producción (después del build)
npm run start

# Lint
npm run lint
```

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# URL base del backend (requerida)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Base path si el frontend no corre en / (opcional)
NEXT_PUBLIC_BASE_PATH=/
```

- `NEXT_PUBLIC_API_URL` — Usada por `src/lib/api.ts`. Por defecto `http://localhost:3000` si no está definida.
- `NEXT_PUBLIC_BASE_PATH` — Usada por `toAbsoluteUrl()` en `src/lib/helpers.ts`. Solo necesaria si el app no corre en la raíz.

---

## Estructura de carpetas

```
src/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Route group: rutas protegidas (requieren auth)
│   │   ├── layout.tsx          # Guard de autenticación + Layout11
│   │   ├── dashboard/          # Dashboard adaptativo por rol
│   │   ├── courses/            # Lista de cursos y detalle [id]
│   │   ├── classes/            # Gestión de clases
│   │   ├── gradebook/          # Libro de calificaciones
│   │   ├── analytics/          # Analytics y estadísticas
│   │   ├── users/              # Gestión de usuarios (admin)
│   │   └── profile/            # Perfil del usuario autenticado
│   ├── (auth)/                 # Route group: rutas públicas de autenticación
│   │   ├── layout.tsx          # Layout minimalista sin sidebar
│   │   ├── auth-route-guard.tsx
│   │   └── login/              # Formulario de login
│   ├── globals.css             # CSS global
│   ├── layout.tsx              # Root layout: providers + fuentes
│   └── page.tsx                # Redirect / → /dashboard o /login
│
├── components/
│   ├── layout/                 # Layout11: sidebar + header + toolbar
│   │   ├── index.tsx           # Exporta <Layout11>
│   │   └── components/
│   │       ├── context.tsx     # LayoutContext (estado del sidebar, menú)
│   │       ├── header.tsx
│   │       ├── header-logo.tsx
│   │       ├── header-menu.tsx        # Menú de navegación horizontal
│   │       ├── header-menu-mobile.tsx
│   │       ├── header-toolbar.tsx     # Acciones del header (user menu, etc.)
│   │       ├── sidebar.tsx
│   │       ├── sidebar-menu.tsx       # Menú lateral con íconos
│   │       ├── sidebar-search.tsx
│   │       ├── toolbar.tsx
│   │       └── wrapper.tsx
│   ├── ui/                     # 65+ componentes UI reutilizables
│   └── screen-loader.tsx       # Pantalla de carga (usada en guards)
│
├── config/
│   ├── layout-11.config.tsx    # MENU_SIDEBAR y MENU_HEADER (items de navegación)
│   └── types.ts                # Tipos: MenuConfig, MenuItem, etc.
│
├── contexts/
│   └── auth-context.tsx        # AuthProvider + useAuth hook + AuthUser interface
│
├── hooks/
│   ├── api/                    # Hooks de datos (TanStack Query + axios)
│   │   ├── use-analytics.ts
│   │   ├── use-badges.ts
│   │   ├── use-classes.ts
│   │   ├── use-course.ts
│   │   ├── use-courses.ts
│   │   ├── use-grades.ts
│   │   ├── use-periods.ts
│   │   ├── use-students.ts
│   │   └── use-users.ts
│   ├── use-auth.ts             # Re-exporta useAuth desde auth-context
│   ├── use-body-class.ts
│   ├── use-copy-to-clipboard.ts
│   ├── use-menu.ts
│   ├── use-mobile.tsx
│   ├── use-mounted.ts
│   ├── use-scroll-position.ts
│   ├── use-slider-input.ts
│   └── use-viewport.ts
│
├── lib/
│   ├── api.ts                  # Instancia axios + interceptor de Bearer token
│   ├── dom.ts                  # Utilidades DOM
│   ├── helpers.ts              # throttle, debounce, uid, getInitials, timeAgo, formatDate, formatDateTime, toAbsoluteUrl
│   └── utils.ts                # cn() = clsx + tailwind-merge
│
├── providers/
│   └── query-provider.tsx      # QueryClientProvider (staleTime: 60s, retry: 1)
│
└── styles/
    ├── components/             # CSS específico de librerías (apexcharts, leaflet, etc.)
    ├── demos/
    ├── config.metronic.css     # Variables CSS del tema Metronic
    └── globals.css
```

---

## Arquitectura de componentes

### Provider stack (src/app/layout.tsx)

El root layout envuelve toda la app con providers en este orden:

```
QueryProvider          → TanStack React Query
  └─ AuthProvider      → Autenticación + estado de usuario
       └─ ThemeProvider → next-themes (light/dark/system)
            └─ children
            └─ <Toaster /> (Sonner)
```

### Layout de rutas protegidas (src/app/(app)/layout.tsx)

- Verifica `isAuthenticated` desde `useAuth()`
- Si no está autenticado y terminó de cargar → `router.replace('/login')`
- Mientras carga → muestra `<ScreenLoader />`
- Una vez autenticado → renderiza `<Layout11>{children}</Layout11>`

### Layout11 (Metronic)

Layout basado en Metronic Layout-11 con:
- Sidebar izquierdo con menú de navegación (`MENU_SIDEBAR` de `config/layout-11.config.tsx`)
- Header con logo, menú horizontal (`MENU_HEADER`) y toolbar
- Soporte para modo móvil con menú colapsable

### Componentes UI

Todos los componentes de `src/components/ui/` siguen el patrón:

- **Variantes con CVA**: `cva()` para gestionar variantes de estilo
- **Composición con Radix UI**: Primitivos de Radix envueltos con estilos Tailwind
- **`cn()` helper**: Merging de clases con `clsx` + `tailwind-merge`
- **`asChild` prop**: Composición sin wrapper DOM extra (patrón Radix)

Ejemplo representativo — `Button` tiene variantes: `primary`, `mono`, `destructive`, `secondary`, `outline`, `dashed`, `ghost`, `dim`, `foreground`, `inverse`; y tamaños: `lg`, `md`, `sm`, `icon`.

---

## Convenciones de código

### Nomenclatura

- Archivos de componentes: `kebab-case.tsx` (ej. `header-menu.tsx`)
- Hooks: `use-kebab-case.ts` (ej. `use-courses.ts`)
- Tipos/interfaces: PascalCase (ej. `AuthUser`, `Course`, `Grade`)
- Funciones de componente: PascalCase (ej. `export function Dashboard()`)

### Páginas y componentes cliente

- Las páginas (`page.tsx`) son **Server Components** por defecto en Next.js App Router.
- La lógica interactiva se separa en archivos `*-client.tsx` marcados con `'use client'`.
- Ejemplo: `dashboard/page.tsx` (Server) → `dashboard/dashboard-client.tsx` (Client).

### Hooks de API

- Un archivo por recurso en `src/hooks/api/`
- Exportan la interfaz TypeScript del recurso y el hook
- Todos usan `useQuery` de TanStack Query con `queryKey` consistente
- Respuestas paginadas: el hook extrae `response.data` (el array) del envelope `{ data[], meta{} }`
- Nunca hacen fetching directo — siempre a través de la instancia `api` de `src/lib/api.ts`

### Autenticación

- Token JWT almacenado en `localStorage` bajo la clave `'token'`
- El interceptor de axios lo inyecta automáticamente en cada request como `Authorization: Bearer <token>`
- `isAuthenticated = !!token && !!user` — ambos deben estar presentes

### Importaciones

- Alias `@/` mapeado a `src/` (configurado en tsconfig)
- Orden preferido: librerías externas → imports internos con `@/`

---

## Rutas implementadas

| Ruta | Archivo | Descripción | Acceso |
|---|---|---|---|
| `/` | `app/page.tsx` | Redirect a `/dashboard` o `/login` | Público |
| `/login` | `app/(auth)/login/` | Formulario de autenticación | Público |
| `/dashboard` | `app/(app)/dashboard/` | Dashboard por rol (Admin/Teacher/Student) | Autenticado |
| `/courses` | `app/(app)/courses/` | Lista de cursos | Autenticado |
| `/courses/[id]` | `app/(app)/courses/[id]/` | Detalle de curso con estudiantes y clases | Autenticado |
| `/classes` | `app/(app)/classes/` | Lista de clases con selector de curso + CRUD | Autenticado |
| `/classes/[id]` | `app/(app)/classes/[id]/` | Detalle de clase con slides y publicación | Autenticado |
| `/gradebook` | `app/(app)/gradebook/` | Libro de calificaciones | Autenticado |
| `/analytics` | `app/(app)/analytics/` | Analytics y métricas | Autenticado |
| `/users` | `app/(app)/users/` | Gestión de usuarios | Autenticado (admin) |
| `/profile` | `app/(app)/profile/` | Perfil del usuario | Autenticado |

---

## Hooks de API disponibles

Todos en `src/hooks/api/`. Todos dependen de `src/lib/api.ts` (axios con auth).

### `useCourses()` — `use-courses.ts`
```typescript
// GET /courses → PaginatedResponse<Course>
// Retorna: Course[]
interface Course {
  id: string; name: string; code: string;
  isActive: boolean; teacherId: string; createdAt: string;
}
// queryKey: ['courses']
```

### `useCourse(id)` — `use-course.ts`
```typescript
// GET /courses/:id → CourseDetail
interface CourseDetail extends Course {
  description?: string;
  teacher?: { id: string; name: string; email: string };
}
// queryKey: ['courses', id] — enabled solo si !!id
```

### `useCourseStudents(courseId)` — `use-students.ts`
```typescript
// GET /courses/:courseId/students → PaginatedResponse<Student>
interface Student {
  id: string; createdAt: string;
  user: { id: string; name: string; lastName: string; email: string; avatar: string | null };
}
// queryKey: ['courses', courseId, 'students'] — enabled solo si !!courseId
```

### `useClasses(courseId?)` — `use-classes.ts`
```typescript
// GET /classes?courseId=... → PaginatedResponse<Class>
interface Class { id: string; title: string; courseId: string; status: string; createdAt: string; }
// queryKey: courseId ? ['classes', courseId] : ['classes'] — enabled solo si !!courseId
```

### `useClassesByCourses(courseIds)` — `use-classes.ts`
```typescript
// Lanza un useQuery por cada courseId en paralelo (useQueries)
// Combina todos los resultados en un único array plano
// queryKey: ['classes', courseId] por cada id
```

### `useClass(id)` — `use-class.ts`
```typescript
// GET /classes/:id → ClassDetail (incluye slides[])
interface Slide { id: string; order: number; type: 'COVER'|'CONTENT'|'ACTIVITY'|'VIDEO'|'IMAGE'; title: string; content?: unknown; }
interface ClassDetail { id: string; title: string; description?: string; courseId: string; status: string; createdAt: string; slides?: Slide[]; }
// queryKey: ['classes', 'detail', id] — enabled solo si !!id
```

### Mutaciones de clases — `use-classes.ts`
```typescript
useCreateClass(courseId)      // POST /classes                  → invalida ['classes', courseId]
useUpdateClass(classId, courseId) // PATCH /classes/:id         → invalida queries de lista y detalle
useDeleteClass(courseId)      // DELETE /classes/:classId        → invalida ['classes', courseId]
usePublishClass(courseId)     // POST /classes/:classId/publish  → invalida lista y detalle
useCreateSlide(classId)       // POST /classes/:classId/slides   → invalida ['classes', 'detail', classId]
```

### `useCoursePeriods(courseId)` — `use-periods.ts`
```typescript
// GET /courses/:courseId/periods → Period[]
interface Period { id: string; name: string; startDate: string; endDate: string; isActive: boolean; }
// queryKey: ['courses', courseId, 'periods'] — enabled solo si !!courseId
```

### `useMyGrades()` — `use-grades.ts`
```typescript
// GET /grades/my → PaginatedResponse<Grade>
interface Grade { id: string; courseId: string; courseName: string; score: number; maxScore: number; createdAt: string; }
// queryKey: ['grades', 'my']
```

### `useMyBadges()` — `use-badges.ts`
```typescript
// GET /badges/my → BadgesResponse
interface BadgesResponse { badges: UserBadge[]; totalPoints: number; }
interface UserBadge { id: string; name: string; description: string; points: number; earnedAt: string; }
// queryKey: ['badges', 'my']
```

### `useUsers()` / `useCreateUser()` / `useUpdateUser(userId)` / `useToggleUserStatus()` — `use-users.ts`
```typescript
// GET /users → PaginatedResponse<ApiUser> | ApiUser[]
interface ApiUser { id: string; name: string; lastName?: string; email: string; role: string; institution?: string; isActive?: boolean; createdAt?: string; }
// queryKey: ['users']
// useCreateUser → POST /auth/register — invalida ['users']
// useUpdateUser(userId) → PATCH /users/:id — invalida ['users']
// useToggleUserStatus → PATCH /users/:id { isActive } — invalida ['users']
```

### `useGradebook(courseId, periodId)` / `useCreateGradeEntry` / `useUpdateGradeEntry` — `use-gradebook.ts`
```typescript
// GET /courses/:courseId/grades?periodId= → GradebookResponse
interface GradebookResponse { activities: GradebookActivity[]; students: GradebookStudent[]; entries: GradebookEntry[]; }
// POST /courses/:courseId/grade-entries — invalida ['gradebook', courseId, periodId]
// PATCH /courses/:courseId/grade-entries/:entryId — invalida ['gradebook', courseId, periodId]
```

### `useGradeCalculation(courseId, periodId)` — `use-grade-calculation.ts`
```typescript
// GET /courses/:courseId/grade-calculation?periodId= → GradeCalculationRow[]
interface GradeCalculationRow { studentId: string; studentName: string; finalGrade: number | null; isComplete: boolean; }
// queryKey: ['grade-calculation', courseId, periodId]
```

### `useCourseSummary` / `useStudentProgress` / `useActivityRanking` / `useStudentEngagement` / `useGradeDistribution` — `use-analytics-detail.ts`
```typescript
// GET /courses/:courseId/analytics/summary → CourseSummary
// GET /courses/:courseId/analytics/students → StudentProgress[]
// GET /courses/:courseId/analytics/activities → ActivityRanking[]
// GET /courses/:courseId/analytics/engagement → StudentEngagement[]
// GET /courses/:courseId/reports/distribution?periodId= → GradeDistributionItem[]
// queryKey: ['analytics', courseId, 'summary|students|activities|engagement|distribution']
```

### `useAtRiskStudents(courseId)` — `use-performance.ts`
```typescript
// GET /courses/:courseId/performance/at-risk → AtRiskStudent[]
interface AtRiskStudent { studentId: string; studentName: string; avgGrade: number|null; completionRate: number; reasons: string[]; }
// queryKey: ['performance', courseId, 'at-risk']
```

### `useUpdateProfile(userId)` / `useChangePassword()` — `use-profile.ts`
```typescript
// PATCH /users/:id → perfil actualizado
// PATCH /auth/change-password → cambio de contraseña
```

### `useAnalytics()` — `use-analytics.ts`
```typescript
// GET /analytics → Analytics
interface Analytics { avgGrade: number; totalMessages: number; recentMessages: DashboardMessage[]; }
interface DashboardMessage { id: string; subject: string; from: string; createdAt: string; }
// queryKey: ['analytics']
```

---

## Dashboard por roles

El componente `DashboardClient` en `src/app/(app)/dashboard/dashboard-client.tsx` renderiza una variante distinta según `user.role`:

| Rol | Variante | Datos que consume |
|---|---|---|
| `admin` | `AdminDashboard` | `useUsers()`, `useCourses()` |
| `teacher` | `TeacherDashboard` | `useCourses()`, `useClassesByCourses()`, `useAnalytics()` |
| `student` | `StudentDashboard` | `useCourses()`, `useMyGrades()`, `useMyBadges()` |

---

## Menú de navegación

Definido en `src/config/layout-11.config.tsx`:

**Sidebar** (`MENU_SIDEBAR`): Principal (Dashboard) → Educación (Cursos, Clases, Calificaciones) → Reportes (Analytics) → Administración (Usuarios, Perfil)

**Header** (`MENU_HEADER`): Dashboard, Cursos, Clases, Analytics

---

## Utilidades disponibles (`src/lib/helpers.ts`)

| Función | Descripción |
|---|---|
| `throttle(fn, limit)` | Throttle de funciones |
| `debounce(fn, wait)` | Debounce de funciones |
| `uid()` | Genera ID único basado en timestamp |
| `getInitials(name, count?)` | Extrae iniciales de un nombre |
| `toAbsoluteUrl(path)` | Prefija con `NEXT_PUBLIC_BASE_PATH` |
| `timeAgo(date)` | Tiempo relativo en inglés (ej. "2 hours ago") |
| `formatDate(date)` | Fecha larga en inglés (ej. "March 28, 2026") |
| `formatDateTime(date)` | Fecha + hora larga en inglés |

---

## Estado actual

### Implementado

- Autenticación completa: login, logout, guard de rutas, persistencia de token, `updateUser` en contexto
- Dashboard adaptativo para los tres roles (ADMIN, TEACHER, STUDENT)
- Lista y detalle de cursos con estudiantes asociados
- Módulo completo de clases: lista con selector de curso, crear/editar/eliminar/publicar clases, detalle de clase con slides, modal agregar slide
- **Gradebook** (`/gradebook`): selector curso + período, tabla libro de notas con celdas clicables, modal ingresar/editar nota (RHF + Zod), panel de notas finales
- **Analytics** (`/analytics`): resumen del curso (stat cards), progreso de estudiantes, ranking de actividades, engagement, estudiantes en riesgo, distribución de notas (Recharts)
- **Perfil** (`/profile`): info personal con avatar/iniciales, modal editar perfil, cambio de contraseña, info de cuenta, estadísticas del docente
- **Usuarios** (`/users`): tabla completa con búsqueda, modal crear (POST /auth/register), modal editar (PATCH /users/:id), activar/desactivar usuario — solo visible para ADMIN/SUPERADMIN
- Mutaciones con `useMutation` en clases, gradebook, usuarios y perfil
- Skeleton loaders y estados de error en todos los componentes de datos
- Librería de 65+ componentes UI (tablas, formularios, modales, animaciones, etc.)
- Sistema de temas claro/oscuro
- Roles en MAYÚSCULAS: `ADMIN`, `SUPERADMIN`, `TEACHER`, `STUDENT` (el backend retorna mayúsculas)

### Pendiente

- Paginación real en tablas (actualmente se cargan todos los registros sin paginar)
- Manejo de expiración de token (redirección automática al expirar)
- Internacionalización (las fechas están en inglés, algunos textos en español)
- Tests
