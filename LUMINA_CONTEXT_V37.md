# LUMINA_CONTEXT_V37.md
> Generado: 10/06/2026 — Actualizado: 11/06/2026
> Reemplaza: LUMINA_CONTEXT_V36.md

---

## 1. IDENTIDAD DEL PROYECTO

**Lumina** — Plataforma SaaS educativa colombiana para docentes.
- **Lumina Core**: Editor de clases interactivas (Canva/Nearpod-style)
- **Lumina Edu**: Módulo de gestión institucional (EduCore, separado)

**Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + Prisma + PostgreSQL (puerto 5432) + Redis (puerto 6379) + Socket.IO
- Monorepo: `C:\Users\Jaime\proyectos\lumina\`
  - `lumina-frontend` (rama `master`)
  - `lumina-backend` (rama `main`)
- GitHub: `github.com/Jaimey1983/lumina`

---

## 2. REGLAS DE TRABAJO (CRÍTICAS)

1. **Git siempre manual** — Jaime hace todos los commits. Los agentes nunca ejecutan git.
2. **Prompts separados** — backend y frontend siempre en prompts separados y etiquetados.
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V37.md antes de empezar."
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor o Antigravity.
6. **Docker debe estar iniciado** antes de levantar el backend (PostgreSQL puerto 5432, Redis puerto 6379).
7. **El backend usa pnpm** — nunca npm para instalar dependencias en `lumina-backend`.

---

## 3. ARQUITECTURA SOCKET.IO — CRÍTICA

El sistema usa **DOS namespaces** de Socket.IO:

| Namespace | Quién conecta | Auth | Propósito |
|-----------|--------------|------|-----------|
| `/` (raíz) | Viewer (estudiantes anónimos), Editor (socket principal) | Sin JWT | Clase en vivo: slide-change, student-response, join-class |
| `/live` | Editor (socket secundario del torneo) | JWT del docente | Torneo: torneo:init, torneo:launch-question, torneo:finish |

**Regla de oro**: NUNCA mover el socket principal del viewer a `/live`. El viewer siempre usa `/` sin autenticación.

---

## 4. ESTADO ACTUAL — FEATURES COMPLETADAS

### 4.1 Actividades originales (12 tipos)
- quiz_multiple, verdadero_falso, short_answer, completar_blancos
- arrastrar_soltar, **emparejar** ✅ (actualizado con imágenes), ordenar_pasos, video_interactivo
- encuesta_viva, nube_palabras, **torneo** ✅, **escape_room** ✅

### 4.2 Editor UX — GRUPO 1 ✅ COMPLETO
### 4.3 Widgets Captivate — GRUPO 2 ✅ COMPLETO (5/5)
Flip Cards, Tabs, Carousel, Click to Reveal, Timeline

### 4.4 Animaciones y Transiciones — GRUPO 3 ✅ COMPLETO
18 tipos de animación, 9 transiciones entre slides, triggers auto/click/hover

### 4.5 Actividades Grupo 4 — ✅ COMPLETO

**13 actividades nuevas + actualización de emparejar:**

| Familia | Actividades |
|---------|------------|
| A — Grid/Board | `clasificar`, `memoria`, `puzzle_imagen`, `sopa_letras`, `crucigrama` |
| B — Arcade | `globos`, `topo`, `ruleta` |
| C — Lingüístico | `anagrama`, `puzzle_palabras`, `abrir_caja`, `orden_rango` |
| D — Narrativo | `historia_ramificada` (react-flow, slide completo) |
| Actualización | `emparejar` con soporte de imágenes + migración retrocompatible |

**Capa compartida:** `activity-result-overlay`, `activity-grid`, `activity-drag-word`, `activity-timer`, `activity-lives`

---

### 4.6 Módulo IA — ✅ NIVELES 1 Y 2 COMPLETOS

#### Proveedor
- **Google Gemini** — fetch directo a la API REST (sin SDK)
- **Modelo activo:** `gemini-2.5-flash-lite`
- **API Key formato:** `AQ.` (nuevo formato Google AI Studio 2026)
- **Variable de entorno:** `GEMINI_API_KEY`
- **Razón del fetch directo:** el SDK `@google/generative-ai@0.24.1` no soporta keys `AQ.`; el fetch directo sí

#### Endpoints backend (`/ai/*`)
| Endpoint | Función |
|----------|---------|
| `POST /ai/quiz` | Genera preguntas (MultipleChoice, TrueFalse, FillInTheBlanks) |
| `POST /ai/content-assistant` | Genera estructura de clase desde tema |
| `POST /ai/evaluate-response` | Evalúa respuesta libre de estudiante |
| `POST /ai/generate-from-document` | Genera clase desde texto/PDF |
| `POST /ai/refine-structure` | Ajuste conversacional de estructura generada |
| `POST /courses/:id/ai/student-feedback` | Retroalimentación personalizada |
| `POST /courses/:id/ai/class-summary` | Resumen automático de clase |

#### Frontend — IaPanel (`flyout-left-panels.tsx`)
- **Pestaña "Desde tema":** plantilla pedagógica (libre/expositiva/inductiva/repaso) + selector área/grado DBA + tema + nivel
- **Pestaña "Desde documento":** FileUpload (.pdf/.txt) + textarea para pegar texto + área/grado opcional
- **Pantalla de resultado:** estructura generada + modo conversacional (ajustes en lenguaje natural)
- **ActivitiesAiPanel:** genera pregunta individual o quiz completo para el slide actual

#### Datos curriculares DBA
```
src/data/curriculum/
├── lenguaje-6.json      ← JSON REAL (8 unidades, DBA V.2 + EBC 6°-7°) ✅
├── lenguaje-3.json      ← JSON REAL (8 unidades, DBA V.2 + EBC 1°-3°) ✅
├── lenguaje-7.json      ← placeholder
├── matematicas-6.json   ← placeholder
... (30 archivos total, 28 placeholders pendientes de reemplazar)

src/data/curriculum/index.ts  ← carga dinámica lazy + buildCurriculumContext()
src/types/curriculum.types.ts ← tipos CurriculumData, UnidadCurricular, etc.
src/lib/ia-templates.ts       ← plantillas pedagógicas
src/hooks/use-curriculum-loader.ts
src/hooks/api/use-ai.ts       ← mutations useGenerateQuiz, useContentAssistant,
                                 useGenerateFromDocument, useRefineStructure
src/components/ui/file-upload.tsx ← componente drag & drop reutilizable
```

#### ⚠️ PENDIENTE CRÍTICO — Prompt del sistema de Gemini
El prompt actual de `contentAssistant` genera contenido básico (solo títulos y listas).
**Próxima tarea prioritaria:** reescribir el prompt del sistema para generar contenido
didáctico rico con:
- Preguntas detonadoras por slide
- Explicaciones con ejemplos contextualizados en Colombia
- Fragmentos de texto para analizar (no solo hablar sobre ellos)
- Diferenciación por nivel Bloom del DBA
- Imágenes sugeridas con descripción precisa
- Conexiones intertextuales e interdisciplinares
- Evaluación formativa integrada por slide
- Glosario inline de términos clave

**Ejemplo de calidad objetivo:** clase "El Mito — Lenguaje 6°" generada manualmente
en sesión 10/06/2026 — 8 slides con contenido pedagógico real alineado a DBA 5.

#### Problema visual pendiente
El panel lateral de IA (`IaPanel`) aparece cortado — falta scroll o altura incorrecta.
Pendiente de fix de UI.

---

## 5. ROADMAP ACTUALIZADO

### ✅ COMPLETO
- Grupo 1 — Editor UX
- Grupo 2 — Widgets Captivate (5/5)
- Grupo 3 — Animaciones/Transiciones
- Grupo 4 — Actividades nuevas (13 + emparejar)
- Módulo IA Niveles 1 y 2

### 🔴 PRÓXIMO — Mejora prompt IA (PRIORITARIO)
Reescribir el prompt del sistema de `contentAssistant` y `generateFromDocument`
para generar clases con contenido didáctico real según los 8 criterios definidos
en sesión 10/06/2026. Ejemplo de calidad objetivo: clase "El Mito — Lenguaje 6°"
generada manualmente (8 slides, contenido pedagógico real, alineado a DBA 5).

### Grupo 5 — Plataforma
- [ ] Gamificación (XP por sesión, badges automáticos/manuales, rachas por actividades, leaderboard en vivo)
- [ ] Importar PPT (preservar layouts, ~70-80% fidelidad, backend pizzip + xml2js)
- [ ] Fuentes Google Fonts (30-50 fuentes curadas pedagógicamente)
- [ ] Primaria en selector DBA (grados 1°-5°)

### Grupo 9 — Widgets interactivos estilo Genially ← NUEVO
Va antes del Polish UI/UX. Requiere diagnóstico del código existente primero
(revisar Click to Reveal y Flip Cards como base reutilizable).
- [ ] Popups / ventanas emergentes al hacer clic
- [ ] Tooltips y etiquetas al hacer hover
- [ ] Hotspots sobre imagen (puntos numerados que revelan contenido)
- [ ] Botones de navegación personalizados (estilos, íconos, acciones)
- [ ] Zoom de imagen en overlay
- [ ] Capas visibles/ocultas por clic (acordeones visuales)
- [ ] Sticky notes / post-its interactivos

### Módulo IA Nivel 3
- [ ] BYOK y multi-proveedor — gestor de API keys por docente (Claude, Gemini, OpenAI),
      selector de modelo activo, enrutamiento por provider, keys cifradas en DB,
      fallback automático al provider gratuito de Lumina si no hay key propia
- [ ] Rating por slide + mejora continua
- [ ] Integración con widgets (Flip Cards, Timeline, Escape Room)
- [ ] Historial de clases generadas por docente

### Grupo 8 — Polish UI/UX ← va después de Grupo 9
- [ ] Micro-animaciones en viewers de actividades
- [ ] ActivityResultOverlay más expresivo (confetti, animaciones de nota)
- [ ] Actividades arcade con efectos visuales (globos, topo, ruleta)
- [ ] Consistencia visual global

### Escape Room 2.0
- [ ] Narrativa ramificada, mapa global, canvas libre por sala, actividades embebidas

### Grupo 6 — Community
- [ ] Repositorio público, fork protection, perfiles docentes, búsqueda DBA/EBC, co-autoría

### Pendientes sin fase
- Actividad Evaluación (documento evaluativo estructurado, encabezado institucional,
  nota consolidada, exportación PDF)
- `laberinto` — diseño en sesión aparte
- JSONs DBA reales (28 placeholders pendientes — usar Prompt Maestro v2)

### Fix pendiente (UI)
- Panel IA cortado — `IaPanel` sin scroll correcto en `flyout-left-panels.tsx`

---

## 6. ARQUITECTURA IA — DETALLES TÉCNICOS

### Fetch directo a Gemini (patrón en los 3 servicios)

```ts
private async callGemini(systemInstruction: string, userMessage: string): Promise<string> {
  const apiKey = this.config.get<string>('GEMINI_API_KEY')!
  const model = 'gemini-2.5-flash-lite'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }
  // fetch + manejo de errores...
}
```

### Módulos con IA en el backend
- `src/ai-features/` — 7 endpoints, método `callGemini` centralizado
- `src/achievements/` — genera indicadores de competencia al crear logro
- `src/curriculum/` — genera desempeños + fallback local si no hay key

### Scoring colombiano unificado (Grupo 4)
```ts
nota = Math.min(5, Math.max(1, (correctas / total) * 4 + 1))
```

---

## 7. NOTAS TÉCNICAS

### PostgreSQL y Redis
- PostgreSQL: puerto **5432** (local Windows)
- Redis: puerto **6379** (local Windows)
- Docker alternativo: PostgreSQL 5434, Redis 6380

### Flip Cards — CSS 3D (NO MODIFICAR)
```css
.fcRoot { perspective: 1000px; }
.fcInner { transform-style: preserve-3d; transition: transform 0.5s ease; }
.fcInner.flipped { transform: rotateY(180deg); }
```

### sopa_letras — regla crítica
Al cambiar cualquier propiedad en properties, siempre pasar `grid: undefined` para invalidar y forzar regeneración.

### emparejar — migración retrocompatible
`class-slide-normalize.ts` convierte `string → { texto: string }` al cargar. El guardado siempre usa `EmparejaLado`.

### historia_ramificada — slide completo
Sigue el patrón de `escape_room` en `slide-renderer.tsx`. Editor necesita `onActivityChange` para persistir posiciones de nodos.

### Animaciones — regla crítica
NUNCA aplicar animaciones de bloque al interior de widgets. `useBlockAnimations` siempre al contenedor externo.

---

## 8. ARCHIVOS CLAVE

### Backend IA
```
src/ai-features/
├── ai-features.module.ts
├── ai-features.controller.ts     ← POST /ai/quiz, content-assistant, evaluate-response,
│                                    generate-from-document, refine-structure
├── ai-features.service.ts        ← callGemini() con fetch directo, 7 métodos
├── course-ai.controller.ts       ← POST /courses/:id/ai/student-feedback, class-summary
└── dto/
    ├── generate-quiz.dto.ts
    ├── content-assistant.dto.ts
    ├── evaluate-response.dto.ts
    ├── student-feedback.dto.ts
    ├── class-summary.dto.ts
    ├── generate-from-document.dto.ts
    └── refine-structure.dto.ts
src/achievements/achievements.service.ts  ← callGemini() propio
src/curriculum/curriculum.service.ts      ← callGemini() propio + fallback local
```

### Frontend IA
```
src/hooks/api/use-ai.ts
src/hooks/use-curriculum-loader.ts
src/lib/ia-templates.ts
src/types/curriculum.types.ts
src/data/curriculum/index.ts
src/data/curriculum/lenguaje-6.json   ← REAL
src/data/curriculum/lenguaje-3.json   ← REAL
src/data/curriculum/*.json            ← 28 placeholders
src/components/ui/file-upload.tsx
src/app/(app)/classes/[id]/editor/components/panels/flyout-left-panels.tsx
src/app/(app)/classes/[id]/editor/components/panels/activities-ai-panel.tsx
```

### Integraciones editor
- `activity-registry.ts` — registro unificado Grupos 1-4
- `slide-renderer.tsx` — todos los tipos de actividad y widget
- `canvas-area.tsx` — slide + onApplySlide + buildContentPayload
- `properties-panel.tsx` — panel contextual + Animaciones + Grupo 4
- `class-slide-normalize.ts` — normaliza transicion, emparejar legacy, curriculum
- `activities-panel.tsx` — inserción por familia
- `editor-client.tsx` — templates createDefault* + handleInsertAiActivity
- `viewer-client.tsx` — transiciones + onComplete
- `widget-registry.ts` — tipos widget

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V37.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V37.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
