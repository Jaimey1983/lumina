# LUMINA — Contexto Completo del Proyecto v3
> Documento para iniciar nueva sesión de desarrollo. Lee todo antes de escribir código.
> Última actualización: 02/04/2026

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
| Frontend | Next.js 15 + React 19 + TypeScript + Metronic Layout-11 |
| Paquetes | pnpm |
| OS | Windows 11 + PowerShell |
| Editor | Cursor + Claude Code (WSL/Ubuntu) |

## Rutas del Proyecto

```
C:\Users\JAIME\proyectos\lumina\
├── lumina-backend\   ← .cursorrules (contexto completo del backend)
└── lumina-frontend\  ← CLAUDE.md (contexto completo del frontend)
```

> ⚠️ La ruta usa `JAIME` en mayúsculas. En WSL: `/mnt/c/Users/JAIME/proyectos/lumina/`

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

Backend corre en puerto **3001**, frontend en **3001** (Next.js).

---

## Estado del Backend — 100% COMPLETO

23 módulos en 4 fases + módulo `curriculum` nuevo. Leer `.cursorrules` para detalle completo.

**Jerarquía de calificación colombiana:**
```
Aspecto (Proceso 80%, Convivencia 10%, Autoeval 5%, Coevaluación 5%)
  └── Logro/Desempeño (código + enunciado, generado por IA)
        └── IndicadorDeDesempeño (Superior/Alto/Básico/Bajo)
              └── Actividad (nota 1-5)
```

**Reglas clave del dominio:**
- Suma de aspectos = exactamente 0.90 (el 0.10 restante es autoeval + coevaluación)
- Escala colombiana: 1-2.9=Bajo, 3-3.9=Básico, 4-4.6=Alto, 4.7-5=Superior
- El docente SIEMPRE ingresa las notas — el estudiante nunca escribe
- Token JWT en localStorage key `'token'`
- Roles en MAYÚSCULAS: `'TEACHER'`, `'ADMIN'`, `'STUDENT'`

---

## Contexto Curricular Colombiano — MUY IMPORTANTE

### Lo que el MEN provee (datos fijos, ya existen):
- **Estándares Básicos de Competencias (EBC)** — metas por grupo de grados (ej: 4° y 5°)
- **Derechos Básicos de Aprendizaje (DBA)** — mínimo por grado específico

### Lo que Lumina genera con IA (no existe en el MEN):
- **Desempeños** — cruzando EBC + DBA + área + grado + tema + tipo
- **Indicadores de desempeño** — en 4 niveles por cada desempeño
- **Actividades sugeridas** — alineadas a esos indicadores, con tipo de actividad Lumina entre paréntesis

### Estructura de un desempeño bien formulado:
```
Verbo de acción + Contenido (del DBA/Estándar) + Condición (Competencia) + Finalidad
Ejemplo: "Explica las adaptaciones de las plantas al desierto, 
          mediante un experimento de riego controlado, 
          reconociendo la importancia del agua para la vida."
```

### Tipos de desempeño (el docente elige UNO por clase):
- **Cognitivo** — Saber (conocimiento y comprensión)
- **Procedimental** — Saber hacer (habilidades y destrezas)
- **Actitudinal** — Ser (valores y disposición)

### Niveles de indicadores (se generan los 4 para cada desempeño):
- **Superior** — "Propone y explica con argumentos científicos..."
- **Alto** — "Explica de forma clara y autónoma..."
- **Básico** — "Identifica con ayuda del docente..."
- **Bajo** — "Presenta dificultades para reconocer..."

### Formato de actividades sugeridas por IA:
Cada actividad incluye el tipo de actividad interactiva de Lumina:
```
"Descripción específica de la actividad [Tipo: Quiz opción múltiple]"
```
Tipos disponibles: Quiz opción múltiple, Verdadero/Falso, Llenar espacios, Respuesta corta, Drag & Drop, Emparejar, Ordenar pasos, Video interactivo, Encuesta en vivo, Nube de palabras.

### Banco curricular en base de datos:
| Dato | Fuente | Quién lo carga |
|------|--------|----------------|
| EBC por área y grupo de grados | MEN (público) | Lumina lo carga una vez |
| DBA por área y grado | MEN (público) | Lumina lo carga una vez |
| Desempeños | Generados por IA | Se guardan en banco reutilizable |
| Indicadores | Generados por IA | Se guardan en banco reutilizable |
| Actividades | IA o docente | Se guardan en banco reutilizable |

---

## Flujo Completo del Sistema (de inicio a fin)

```
1. MODAL DE INICIO (solo para clases nuevas sin desempeño)
   Docente elige: Área + Grado + Tema + Tipo de desempeño
         ↓
   IA consulta EBC + DBA del banco
   IA genera: UN desempeño + 4 indicadores (Sup/Alt/Bás/Baj) + 5 actividades sugeridas
   Docente revisa, edita y aprueba
   Sistema guarda desempeño en la clase via PATCH /classes/:id
         ↓
2. EDITOR DE SLIDES
   Se abre con el contexto curricular aprobado en la topbar
   Docente construye/ajusta la clase slide por slide
   Cada slide tiene: layout + bloques de contenido + actividad interactiva opcional
   Botón "Agregar slide" crea nuevo slide via POST /classes/:id/slides
         ↓
3. CLASE EN VIVO (Socket.IO — ya implementado en backend)
   Docente publica y lanza la clase
   Estudiantes entran al viewer desde sus dispositivos
   Docente controla el ritmo (avanza slides)
   Estudiantes responden actividades en tiempo real
         ↓
4. RESULTADOS AUTOMÁTICOS
   Sistema registra respuestas por actividad → por indicador
         ↓
5. PLANILLA DE NOTAS (Lumina Edu)
   Se construye automáticamente desde los desempeños/indicadores del modal de inicio
   Estructura: Aspecto → Desempeño → Indicador → Actividad → Nota
   El docente revisa, ajusta y confirma notas
```

---

## Arquitectura del Editor — DECISIONES TOMADAS

### Layout del editor (definitivo):
```
┌─────────────────────────────────────────────────────────────────┐
│  Topbar: Volver | Título clase | [desempeño truncado] | Vista previa | Guardar | Publicar | RefreshCw │
├────┬──────────┬────────────────────────────────────────────────┤
│    │ Slides   │                                                │
│ I  │ (minia-  │         CANVAS PRINCIPAL                      │
│ C  │  turas)  │         (slide-renderer modo=editor           │
│ O  │          │          aspect-ratio 16/9, flex-1)           │
│ N  │          │                                               │
│ O  │ + Agregar│                                               │
├────┴──────────┴────────────────────────────────────────────────┤
│  Status bar: Estado guardado | N slides                        │
└─────────────────────────────────────────────────────────────────┘
```

### Barra lateral de iconos (extremo izquierdo):
- Ancho: `w-16` (64px), iconos `size={22}`, botones `p-3`
- Cada ícono abre/cierra su panel abatible (flyout-panel w-64)
- **Elementos** — texto, imagen, video, audio, PDF, tabla, forma, pestañas, acordeón, hotspot
- **Actividades** — todas las actividades interactivas
- **Layout** — plantillas de disposición del slide
- **Fondo** — color sólido, imagen, degradado
- **IA** — generar clase, generar actividad, mejorar slide
- **Páginas** — vista rápida de todos los slides

### Modelo de edición:
- **Híbrido**: cada slide tiene un layout (plantilla de zonas) y dentro de cada zona se insertan bloques
- NO es canvas libre pixel a pixel — es layout + bloques dentro de zonas
- Las actividades ocupan la zona principal del slide (no son objetos flotantes)
- Menús de propiedades son **flotantes y contextuales** (aparecen al seleccionar un elemento)

---

## Esquema JSON de una Clase (estructura de datos definitiva)

```json
{
  "clase": {
    "id": "cls_001",
    "titulo": "El ciclo del agua",
    "area": "Ciencias Naturales",
    "grado": "5",
    "dba": "CN-5-3",
    "desempeno": {
      "tipo": "cognitivo",
      "enunciado": "Comprende los procesos del ciclo del agua...",
      "area": "Ciencias Naturales",
      "grado": "5",
      "tema": "El ciclo del agua",
      "indicadores": {
        "superior": "Propone y explica con argumentos científicos...",
        "alto": "Explica de forma clara y autónoma...",
        "basico": "Identifica con ayuda del docente...",
        "bajo": "Presenta dificultades para reconocer..."
      },
      "actividadesSugeridas": [
        "Identificar las etapas del ciclo mediante tarjetas [Tipo: Drag & Drop]",
        "Pregunta sobre evaporación y condensación [Tipo: Quiz opción múltiple]"
      ]
    },
    "slides": [...]
  }
}
```

### Regla del esquema:
- El **editor** escribe este JSON
- El **viewer del estudiante** lee y renderiza este mismo JSON
- El **socket** solo transmite: qué slide está activo + respuestas de estudiantes
- Todo lo demás ya está en el JSON

---

## Actividades Interactivas — Lista Completa v1

| Categoría | Actividad | Prioridad v1 |
|-----------|-----------|--------------|
| Evaluación | Quiz opción múltiple | ✅ Core |
| Evaluación | Verdadero / Falso | ✅ Core |
| Evaluación | Llenar espacios | ✅ Core |
| Evaluación | Respuesta corta | ✅ Core |
| Interacción | Drag & Drop | ✅ Core |
| Interacción | Emparejar | ✅ Core |
| Interacción | Ordenar pasos | ✅ Core |
| Interacción | Video interactivo (pausa + pregunta/cuadro) | ✅ Core |
| En vivo | Encuesta en vivo | ✅ Core |
| En vivo | Nube de palabras | ✅ Core |
| Juegos | Crucigrama | v2 |
| Juegos | Sopa de letras | v2 |
| Juegos | Memoria | v2 |
| Juegos | Ahorcado | v2 |
| Avanzado | Hotspot sobre imagen | v2 |
| Avanzado | Escenario de decisión (branching) | v2 |

---

## Elementos de Contenido del Editor

| Categoría | Elemento |
|-----------|----------|
| Básico | Texto, Imagen, Video (embed), Audio, PDF, Tabla, Forma |
| Avanzado | Pestañas, Acordeón, Imagen con zoom, Hotspot invisible |

---

## Layouts Disponibles por Slide

| Nombre | Descripción | Zonas |
|--------|-------------|-------|
| `en_blanco` | Sin estructura | libre |
| `titulo_centrado` | Título + subtítulo centrado | titulo, subtitulo |
| `titulo_y_contenido` | Título arriba + contenido abajo | titulo, contenido |
| `dos_columnas` | Título + dos columnas | titulo, izquierda, derecha |
| `imagen_derecha` | Texto izquierda + imagen derecha | texto, imagen |
| `imagen_izquierda` | Imagen izquierda + texto derecha | imagen, texto |
| `tres_columnas` | Título + tres columnas | titulo, col1, col2, col3 |
| `pantalla_completa` | Una sola zona que ocupa todo | principal |

---

## Archivos del Frontend — Estado Actual

```
src/
├── types/
│   └── slide.types.ts              ✅ CREADO — tipos completos con unions discriminadas
│
├── app/(app)/classes/[id]/
│   ├── editor/
│   │   ├── page.tsx                ✅ Sin cambios
│   │   ├── editor-client.tsx       ✅ Reescrito sin Fabric.js
│   │   └── components/
│   │       ├── icon-rail.tsx       ✅ w-16, iconos size=22, p-3
│   │       ├── flyout-panel.tsx    ✅ Panel abatible w-64
│   │       ├── slides-panel.tsx    ✅ Miniaturas con colores por tipo
│   │       ├── canvas-area.tsx     ✅ flex-1, aspect-ratio 16/9
│   │       ├── slide-renderer.tsx  ✅ JSON → React, modo editor/viewer
│   │       ├── floating-toolbar.tsx ✅ Menú flotante contextual
│   │       └── activities/
│   │           ├── quiz-multiple.tsx   ✅
│   │           ├── true-false.tsx      ✅
│   │           ├── drag-drop.tsx       ✅ HTML5 nativo
│   │           ├── video-interactive.tsx ✅
│   │           ├── live-poll.tsx       ✅
│   │           └── (fill-blanks, match-pairs, order-steps, word-cloud — pendientes)
│   └── new-class-modal.tsx         ✅ Modal con IA, actividades sugeridas
│
└── hooks/api/
    ├── use-slide-content.ts        ✅
    ├── use-curriculum.ts           ✅
    └── use-update-class.ts         ✅ PATCH /classes/:id
```

---

## Endpoints del Backend — Estado

| Endpoint | Estado | Uso |
|----------|--------|-----|
| `GET /classes/:id` con `slides[].content` | ✅ Existe | Leer slides |
| `PATCH /classes/:id` | ✅ Existe | Guardar desempeño en clase |
| `PATCH /classes/:id/slides/:slideId` | ✅ Existe | Guardar slide |
| `POST /classes/:classId/slides` | ✅ Existe | Crear slide |
| `GET /curriculum/dba?area=&grado=` | ✅ CREADO | Modal de inicio |
| `POST /curriculum/generate-desempeno` | ✅ CREADO | Modal de inicio |

---

## Patrones Críticos del Frontend (NO romper)

```typescript
// Backend retorna array plano:
response.data ?? []
// Backend retorna paginado { data: [], meta: {} }:
response.data.data ?? []
// queryFn nunca retorna undefined — siempre [] o {}
// Roles siempre en MAYÚSCULAS
// Invalidar queryKey exacto en mutaciones
// Token JWT en localStorage key 'token'
// Páginas = Server Components, lógica = *-client.tsx con 'use client'
// Alias @/ mapeado a src/
```

---

## Bugs Conocidos

### Resueltos (histórico)

1. **Modal en clases existentes** — ✅ Resuelto: condición alineada con `useClass` / `GET /classes/:id` (`editor-client.tsx`).

2. **Guardar desempeño (PATCH)** — ✅ Resuelto: `UpdateClassDto` / endpoint y flujo de guardado operativos.

3. **Agregar slides** — ✅ Resuelto: creación de slide e invalidación de queries verificadas de extremo a extremo.

*No hay bugs abiertos documentados en esta lista; si aparece uno nuevo, añadirlo aquí bajo «Pendientes».*

---

## Próximas Tareas (en orden de prioridad)

1. **Profundizar el editor de bloques** — edición in-place de textos/actividades seleccionadas, propiedades contextuales, eliminar/reordenar bloques (los flyouts izquierdos ya insertan elementos, actividades, layout y fondo vía PATCH).
2. **Actividades pendientes (render)** — `fill-blanks.tsx`, `match-pairs.tsx`, `order-steps.tsx`, `word-cloud.tsx` en viewer/editor (plantillas ya insertables desde el flyout).
3. **Viewer del estudiante** — página de visualización de slides en modo viewer para clases en vivo

---

## Forma de Trabajo

- Ejecutar autónomamente sin pedir permiso (excepto acciones destructivas irreversibles)
- Respuestas concisas y directas
- Un módulo a la vez
- Build debe pasar sin errores antes de hacer commit
- Leer `.cursorrules` (backend) o `CLAUDE.md` (frontend) antes de empezar cualquier tarea
- Leer este archivo completo al iniciar cualquier sesión
- En PowerShell NO usar `&&` — ejecutar comandos uno por uno
- Rutas con paréntesis o corchetes siempre entre comillas: `"src/app/(app)/..."`

---

## Instrucción para Nueva Sesión

Al iniciar una nueva conversación:
1. Lee este archivo completo
2. Lee `CLAUDE.md` (frontend) o `.cursorrules` (backend) según la tarea
3. Confirma que entendiste con "Listo, entendido" y un resumen de 3 líneas
4. Si hay bugs pendientes en la lista, empezar por el primero sin preguntar; si no, continuar por la primera **Próxima tarea**
