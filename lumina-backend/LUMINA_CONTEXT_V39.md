# LUMINA_CONTEXT_V39.md
> Generado: 21/08/2026
> Reemplaza: LUMINA_CONTEXT_V38.md

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
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V39.md antes de empezar."
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor o Antigravity.
6. **Docker debe estar iniciado** antes de levantar el backend (PostgreSQL puerto 5432, Redis puerto 6379).
7. **El backend usa pnpm** — nunca npm para instalar dependencias en `lumina-backend`.
8. **Scoring: una sola fuente de verdad** — cualquier feature nueva que calcule una nota o
   puntaje DEBE pasar por `evaluateActivityResponse` / `notaColombiana` (`activity-scoring.ts`).
   Nunca reimplementar una fórmula local de score — ver Sección 10.

---

## 3. ARQUITECTURA SOCKET.IO — CRÍTICA

El sistema usa **DOS namespaces** de Socket.IO:

| Namespace | Quién conecta | Auth | Propósito |
|-----------|--------------|------|-----------|
| `/` (raíz) | Viewer (estudiantes anónimos), Editor (socket principal) | Sin JWT | Clase en vivo: slide-change, student-response, join-class, gamification |
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
13 actividades nuevas + emparejar con imágenes

### 4.6 Módulo IA — ✅ NIVELES 1 Y 2 COMPLETOS + MEJORAS

#### Proveedor
- **Google Gemini** — fetch directo a la API REST (sin SDK)
- **Modelo activo:** `gemini-2.5-flash-lite`
- **API Key formato:** `AQ.` (nuevo formato Google AI Studio 2026)
- **Variable de entorno:** `GEMINI_API_KEY`
- **Razón del fetch directo:** el SDK `@google/generative-ai@0.24.1` no soporta keys `AQ.`

#### Prompt del sistema — 8 principios didácticos ✅
1. Progresión inductiva — pregunta detonadora antes de la definición
2. Contenido real — párrafos de 3-5 oraciones, no listas
3. Contextualización colombiana — ejemplos de Colombia
4. Fragmentos para analizar — texto real en clases de lenguaje/sociales
5. Nivel Bloom — actividad alineada al nivel del DBA
6. Imágenes precisas — descripción exacta, no genérica
7. Voz del estudiante — pregunta de reflexión por slide
8. Cierre curricular — conexión explícita con DBA/EBC

#### Nuevo esquema JSON de Gemini (`contenido.*`)
```ts
interface GeneratedSlideStructure {
  order: number
  tipo: 'portada'|'exploracion'|'concepto'|'ejemplo'|'estructura'|'comparacion'|'actividad'|'cierre'
  title: string
  contenido: {
    texto_principal: string
    pregunta_reflexion: string | null
    ejemplo: string | null
    cita: string | null
    tabla: { encabezados: string[]; filas: string[][] } | null
    lista_items: string[] | null
    imagen_sugerida: string | null
    instruccion_docente: string | null
    conexion_dba: string | null
  }
  actividad_lumina: { tipo: string; descripcion: string; preguntas_ejemplo: string[] } | null
}
```

#### Layouts por tipo de slide
| tipo | layout |
|------|--------|
| portada | titulo_centrado_subtitulo |
| exploracion | pantalla_completa |
| concepto | titulo_y_contenido |
| ejemplo | imagen_derecha (si imagen) / titulo_y_contenido |
| estructura | dos_columnas (si tabla) / titulo_y_contenido |
| comparacion | dos_columnas |
| actividad | titulo_y_contenido |
| cierre | titulo_y_contenido |

#### Slide contexto curricular DBA/EBC ✅
- Se inserta automáticamente después de la portada cuando hay JSON DBA cargado
- Construido directamente desde el JSON (sin Gemini) — textos literales del MEN
- Selecciona la unidad más relevante por scoring de keywords del tema
- Campos: área/grado, DBA literal, EBC factor+estándar, Bloom, temas, desempeño básico

#### Fixes editor de texto ✅
- `whiteSpace: 'pre-wrap'` en `slide-renderer.tsx` — saltos de línea visibles
- Enter = salto de línea, Shift+Enter = confirmar en `InlineTextEditor`

#### Datos curriculares DBA
```
src/data/curriculum/
├── lenguaje-6.json   ← JSON REAL ✅
├── lenguaje-3.json   ← JSON REAL ✅
├── lenguaje-[1,2,4,5,7-11].json  ← placeholders
├── matematicas-[1-11].json        ← placeholders
├── ciencias-naturales-[1-11].json ← placeholders
├── ciencias-sociales-[1-11].json  ← placeholders
├── ingles-[1-11].json             ← placeholders
(55 archivos total — 2 reales, 53 placeholders)

src/types/curriculum.types.ts  ← GradoPrimaria, GradoBachillerato, GradoEscolar
src/data/curriculum/index.ts   ← LOADERS grados 1-11, GRADOS_PRIMARIA, GRADOS_BACHILLERATO
```

#### Endpoints backend (`/ai/*`)
| Endpoint | Función |
|----------|---------|
| `POST /ai/quiz` | Genera preguntas |
| `POST /ai/content-assistant` | Genera clase desde tema (prompt v2) |
| `POST /ai/generate-from-document` | Genera clase desde texto/PDF (prompt v2) |
| `POST /ai/refine-structure` | Ajuste conversacional |
| `POST /ai/evaluate-response` | Evalúa respuesta libre |
| `POST /courses/:id/ai/student-feedback` | Retroalimentación |
| `POST /courses/:id/ai/class-summary` | Resumen de clase |

---

### 4.7 Grupo 5 — ✅ COMPLETO

#### Gamificación en sesión ✅
- Estado en **Redis** (TTL 24h) — NO en PostgreSQL — se reinicia por sesión
- Implementado en `SessionGamificationService` (separado del `GamificationModule` de cursos)
- Handlers en `ClassesGateway` (namespace `/`, room `class-${classId}`)
- XP: deriva de `xpFromEvaluation(result)` — ver Sección 10.5 (reemplaza la fórmula antigua
  basada en "nota" suelta que tenía el V38)
- Racha se rompe si nota < 3.0
- 7 badges automáticos: racha_3, racha_5, perfecto, xp_100, xp_300, activo_5, activo_10
- Eventos Socket.IO:
  - `activity:complete` → registra actividad, emite `gamification:update` (acepta `score` como
    campo principal; `nota` se mantiene solo como alias de compatibilidad — ver 10.6)
  - `gamification:start` → inicia sesión Redis
  - `gamification:leaderboard` → consulta ranking
  - `gamification:toggle-visibility` → muestra/oculta ranking a estudiantes
- Frontend: `use-gamification.ts`, `GamificationLeaderboard`, `GamificationBadgeToast`
- Viewer: ranking compacto arriba-izquierda; reporta XP **una sola vez por actividad completada**
  (ver 10.5 — corrección del bug de XP duplicado en `video_interactivo`)
- Editor: botón "Activar gamificación", toggle visibilidad, panel XP en "En vivo"

#### Importar PPT / Google Slides ✅
- Backend: `PptxModule` con `pizzip` + `xml2js` — endpoint `POST /classes/:id/import-pptx`
- Conversión EMU→%: `PPT_WIDTH_EMU=9144000`, `PPT_HEIGHT_EMU=5143500`
- Extrae: texto (posición, tamaño, negrita, cursiva, color), imágenes como base64
- Heurística de layout según número y posición de bloques
- Límite: 50 MB por archivo
- Google Slides: exportar como .pptx desde Archivo → Descargar → Microsoft PowerPoint
- Frontend: `use-import-pptx.ts`, `ImportPptxModal`, botón "Importar PPT" en topbar
- Fidelidad: ~70-80% (no se importan animaciones, SmartArt, gráficos, efectos)

#### Fuentes Google Fonts (40) ✅
- Catálogo: `src/lib/font-catalog.ts` — 40 fuentes en 5 categorías
  - Sans-serif: Inter, Plus Jakarta Sans, Nunito, Poppins, Raleway, Lato, Open Sans, Roboto, Figtree, DM Sans, Outfit, Barlow, Mulish, Source Sans 3, Nunito Sans
  - Serif: Merriweather, Playfair Display, Lora, PT Serif, Libre Baskerville, Crimson Text, EB Garamond
  - Display: Montserrat, Oswald, Bebas Neue, Righteous, Exo 2, Abril Fatface, Titan One
  - Handwriting: Caveat, Pacifico, Satisfy, Dancing Script, Indie Flower, Kalam
  - Monospace: JetBrains Mono, Fira Code, Source Code Pro, Space Mono
- Carga: un solo `<link>` en `app/layout.tsx` vía `buildGoogleFontsUrl()`
- Selector: panel derecho **Propiedades** → sección Fuente (reemplaza las 5 hardcodeadas)
- Preview tipográfico en el dropdown (`fontFamily` inline en cada `SelectItem`)
- Panel izquierdo: `TextFormatPanel` eliminado (redundante con Propiedades)

#### Selector DBA Primaria (grados 1°-5°) ✅
- `GradoPrimaria = '1'|'2'|'3'|'4'|'5'` en `curriculum.types.ts`
- `GradoEscolar = GradoPrimaria | GradoBachillerato` — union type completo
- Selector en `IaPanel` agrupado: sección Primaria / sección Bachillerato
- 25 nuevos placeholders (5 áreas × grados 1-5, sin tocar `lenguaje-3.json` real)

---

### 4.8 Refactor de scoring unificado — Fases 0–7 — ✅ COMPLETO

Ciclo de trabajo independiente del roadmap de features: unificó el cálculo de notas en toda la
plataforma (planilla, overlay, XP) bajo un único evaluador, y un peritaje posterior (Fase 7)
verificó y corrigió tres bugs de esa unificación. Ver detalle completo en **Sección 10**.

---

## 5. ROADMAP ACTUALIZADO

### COMPLETO ✅
- Grupo 1 — Editor UX
- Grupo 2 — Widgets Captivate (5/5)
- Grupo 3 — Animaciones/Transiciones
- Grupo 4 — 13 actividades nuevas + emparejar
- Módulo IA Niveles 1 y 2 + mejoras prompt + slide DBA/EBC
- Grupo 5 — Gamificación, Importar PPT, Google Fonts (40), DBA Primaria
- **Refactor de scoring unificado (Fases 0–7)** — helper único, persistencia transaccional,
  Grupo 4 cableado al contrato, identidad de guest por clase, overlay/XP conectados,
  peritaje y remediación cerrados (ver Sección 10)

### PRÓXIMO
- Calidad contenido IA — aún mejorable (ejemplos más ricos, mayor variedad)
- JSONs DBA reales — 53 placeholders pendientes (usar Prompt Maestro v2)

### Grupo 9 — Widgets estilo Genially (antes del Polish)
- [ ] Popups / ventanas emergentes al hacer clic
- [ ] Hotspots sobre imagen (puntos numerados)
- [ ] Tooltips al hacer hover
- [ ] Botones de navegación personalizados
- [ ] Zoom de imagen en overlay
- [ ] Capas visibles/ocultas por clic
- [ ] Sticky notes interactivos
- Requiere diagnóstico del código antes de implementar (Click to Reveal como base reutilizable)

### Módulo IA Nivel 3
- [ ] BYOK y multi-proveedor — gestor API keys por docente (Claude, Gemini, OpenAI), fallback gratuito
- [ ] Rating por slide + mejora continua
- [ ] Historial de clases generadas

### Grupo 8 — Polish UI/UX (después de Grupo 9)
- [ ] Micro-animaciones en viewers
- [ ] ActivityResultOverlay expresivo
- [ ] Arcade con efectos visuales
- [ ] Consistencia visual global

### Pendientes sin fase
- Escape Room 2.0
- Grupo 6 — Community
- Actividad Evaluación
- Laberinto
- `orden_rango`: evaluador y test de contrato listos (Fase 4), falta viewer/integración en
  slide-renderer para que sea una actividad usable en el editor

---

## 6. ARQUITECTURA IA — DETALLES TÉCNICOS

### Fetch directo a Gemini
```ts
private async callGemini(systemInstruction: string, userMessage: string): Promise<string> {
  const apiKey = this.config.get<string>('GEMINI_API_KEY')!
  const model = 'gemini-2.5-flash-lite'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4000, responseMimeType: 'application/json' },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }
}
```

### Módulos con IA en el backend
- `src/ai-features/` — 7 endpoints, `callGemini` centralizado, `maxOutputTokens: 4000`
- `src/achievements/` — `callGemini` propio
- `src/curriculum/` — `callGemini` propio + fallback local

### Scoring colombiano unificado — ⚠️ CORREGIDO respecto al V38

> El V38 documentaba `nota = Math.min(5, Math.max(1, (correctas / total) * 4 + 1))` como fórmula
> vigente. Esa fórmula quedó **obsoleta y eliminada de `src/` (salvo `torneo`, que es `exclude`
> por política)** tras el refactor de Fases 0–7. La fórmula real, única y vigente es:

```ts
// lumina-frontend/src/lib/activity-scoring.ts
// lumina-backend/src/classes/activity-scoring.ts  (espejo)
export function notaColombiana(correctas: number, total: number, respondio: boolean): number {
  if (!respondio) return 0;
  if (total <= 0) return 0;
  const bruta = (correctas / total) * 5;               // ← ×5, NO ×4+1
  return Math.round(Math.max(1, bruta) * 10) / 10;       // mínimo pedagógico 1.0, redondeo 1 decimal
}
```

Ver Sección 10 para el contrato completo (`evaluateActivityResponse`, `ACTIVITY_SCORING`).

### Gamificación — fórmula XP — ⚠️ CORREGIDO respecto al V38

> El V38 documentaba `xp = Math.round(Math.max(0, (nota - 1) / 4 * 100))` operando sobre una
> "nota" suelta. Ese cálculo ahora se deriva siempre de un `ActivityEvaluationResult`, no de un
> número aislado:

```ts
// xpFromEvaluation(result: ActivityEvaluationResult): number
// score 1.0 → 0 XP, score 3.0 → 50 XP, score 5.0 → 100 XP, score null → 0 XP
```

`session-gamification.service.ts` llama `xpFromEvaluation(result)` — nunca recalcula XP desde una
nota aislada. Ver Sección 10.5.

---

## 7. NOTAS TÉCNICAS

### PostgreSQL y Redis
- PostgreSQL: puerto **5432** (local Windows)
- Redis: puerto **6379** (local Windows)

### Coordenadas del canvas
- Sistema en **porcentajes** (0-100) del slide
- Canvas: 1280×720px en el renderer
- `buildTemplateTextBlock(contenido, x, y, ancho, alto, tamanoFuente, alineacion?)` — función canónica

### Layouts disponibles (10)
| Key | Descripción |
|-----|-------------|
| `en_blanco` | Sin bloques |
| `titulo_centrado` | Título centrado x=5,y=32,w=90,h=22 |
| `titulo_centrado_subtitulo` | Título x=10,y=20 · Subtítulo x=15,y=48 |
| `titulo_y_contenido` | Título x=5,y=3,h=15 · Contenido x=5,y=20,h=72 |
| `titulo_texto_imagen` | Título · Texto izq · Imagen der x=52,y=20 |
| `dos_columnas` | Col1 x=5,w=44 · Col2 x=51,w=44 |
| `imagen_derecha` | Texto izq · Imagen x=55,y=10,w=40,h=80 |
| `imagen_izquierda` | Imagen x=5,y=10,w=40,h=80 · Texto der |
| `tres_columnas` | x=5,35,67 · w=28 cada una |
| `pantalla_completa` | x=8,y=38,w=84,h=22 |

### Flip Cards — CSS 3D (NO MODIFICAR)
```css
.fcRoot { perspective: 1000px; }
.fcInner { transform-style: preserve-3d; transition: transform 0.5s ease; }
.fcInner.flipped { transform: rotateY(180deg); }
```

### sopa_letras — regla crítica
Siempre pasar `grid: undefined` al cambiar propiedades para forzar regeneración.

### emparejar — migración retrocompatible
`class-slide-normalize.ts` convierte `string → { texto: string }` al cargar.

### Animaciones — regla crítica
NUNCA aplicar animaciones de bloque al interior de widgets.

### PPT import — regla crítica
`const PizZip = require('pizzip')` — NO usar import default.

### Scoring — reglas críticas (nuevas, ver Sección 10)
- Ningún componente calcula su propio score/porcentaje/XP — todo pasa por
  `evaluateActivityResponse` (frontend y backend).
- El overlay compartido (`activity-result-overlay.tsx`) recibe `evaluation` como prop — nunca
  recalcula `notaColombiana` con un conteo propio.
- `ruleta` / `torneo` / `escape_room` son `exclude`: no otorgan nota académica ni entran al
  promedio. `torneo-viewer.tsx` conserva su propia fórmula de puntaje de juego — es la única
  excepción permitida, por diseño.
- `normalizeVideoAnswers` no se debe borrar sin antes migrar los `ClassResult` legacy con formato
  sucio — sigue en uso real.

---

## 8. ARCHIVOS CLAVE

### Backend
```
src/ai-features/ai-features.service.ts     ← callGemini, 7 métodos, prompt v2
src/ai-features/ai-features.controller.ts  ← endpoints /ai/*
src/pptx/pptx.service.ts                   ← parseo .pptx, EMU→%, base64 imágenes
src/pptx/pptx.controller.ts                ← POST /classes/:id/import-pptx
src/gamification/session-gamification.service.ts ← XP (xpFromEvaluation), rachas, badges en Redis
src/classes/activity-scoring.ts            ← espejo backend de notaColombiana/evaluateActivityResponse
src/classes/classes.service.ts             ← gradebook, endSession ($transaction), verifyGuestStudent
src/classes/classes.controller.ts          ← incluye GET /classes/:id/students/:studentId/verify
src/classes/classes.gateway.ts             ← activity:complete (score, alias nota por compatibilidad)
prisma/schema.prisma                        ← StudentPoints, Badge, SessionLog, ClassSession,
                                               ClassResult, ClassGuest (NO tocar sin migración)
prisma/migrations/20260821120000_add_class_guest ← modelo ClassGuest (identidad de guest por clase)
```

### Frontend IA
```
src/lib/font-catalog.ts                    ← 40 fuentes + buildGoogleFontsUrl()
src/hooks/api/use-ai.ts                    ← mutations + tipos GeneratedSlideStructure
src/hooks/api/use-import-pptx.ts          ← mutation importar PPT
src/hooks/use-gamification.ts             ← hook leaderboard, badges, XP
src/hooks/use-curriculum-loader.ts        ← carga JSON DBA lazy
src/lib/ia-templates.ts                   ← plantillas pedagógicas
src/types/curriculum.types.ts             ← GradoPrimaria, GradoBachillerato, GradoEscolar
src/data/curriculum/index.ts              ← LOADERS grados 1-11, 5 áreas
src/data/curriculum/lenguaje-6.json       ← REAL ✅
src/data/curriculum/lenguaje-3.json       ← REAL ✅
src/components/ui/file-upload.tsx         ← drag & drop reutilizable
src/components/gamification/             ← GamificationLeaderboard, GamificationBadgeToast
src/components/editor/import-pptx-modal.tsx
```

### Frontend Scoring (nuevo — Fases 0–7)
```
src/lib/activity-scoring.ts                    ← notaColombiana, ACTIVITY_SCORING,
                                                   evaluateActivityResponse, xpFromEvaluation
src/lib/activity-scoring.fixtures.json         ← fixtures compartidos frontend/backend
src/lib/activity-scoring.test.ts               ← tests de contrato (todas las claves de ACTIVITY_SCORING)
src/lib/activity-scoring.reconstruction.spec.ts ← tests de reconstrucción/rollback (Fase 3)
src/components/activities/shared/activity-result-overlay.tsx ← recibe `evaluation`, no recalcula
src/app/(app)/classes/[id]/viewer/viewer-client.tsx ← consumidor único (vivo), XP una vez por actividad
src/app/(app)/join/[codigo]/join-client.tsx    ← verifyStoredGuest antes de mostrar formulario
```

### Editor
```
slide-renderer.tsx      ← whiteSpace:pre-wrap, Enter=párrafo en InlineTextEditor
properties-panel.tsx    ← FONT_CATALOG (40 fuentes), TextBlockFields completo
flyout-left-panels.tsx  ← IaPanel, buildBloquesDesdeSlideIA, buildSlideContextoCurricular,
                           layoutDesdeSlideIA, selector DBA primaria/bachillerato
templates-panel.tsx     ← buildInsertSlideBloques, buildTemplateTextBlock (exportada)
editor-client.tsx       ← re-evalúa con evaluateActivityResponse antes de enviar score (~L1236-1247)
```

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V39.md y CLAUDE.md antes de empezar.
[descripción del cambio]
Build debe pasar sin errores TypeScript. Verificar con npx tsc --noEmit.

[BACKEND] Lee LUMINA_CONTEXT_V39.md y .cursorrules antes de empezar.
[descripción del cambio]
Build debe pasar sin errores TypeScript. Verificar con npx tsc --noEmit.

Jaime hace el commit manual — el agente NO ejecuta git.
PowerShell: nunca usar &&, usar ; o comandos separados.
```

---

## 10. REFACTOR DE SCORING UNIFICADO (Fases 0–7) — COMPLETO ✅

### 10.0 — Motivación

Antes de este ciclo, el cálculo de notas vivía duplicado y divergente entre módulos: la planilla
de Lumina Edu usaba `× 5`, mientras el overlay en vivo y el sistema de XP usaban `× 4 + 1` (ver
la fórmula ahora obsoleta que documentaba el V38 en su Sección 6 — corregida arriba). Grupo 4
(actividades tipo Wordwall) tenía su propia fórmula local sin pasar por ningún evaluador central.
Objetivo del refactor: **una sola función, un solo resultado, consumido idénticamente por
planilla, overlay y gamificación.**

### 10.1 — Arquitectura resultante

```
notaColombiana(correctas, total, respondio) → number (0.0–5.0)
  - Multiplicador ×5 (fijo — decisión de Fase 0, no reabrir sin migrar datos históricos)
  - Mínimo pedagógico: 1.0 si respondió, 0 si no respondió
  - Redondeo a 1 decimal

evaluateActivityResponse(activityType, definicion, respuesta) → ActivityEvaluationResult
  - { correct: boolean, details: ActivityEvaluationDetail[], score: number | null }
  - Único evaluador para TODOS los tipos de actividad — Evaluación, Interacción, Grupo 4
  - Consumido por: viewer (vivo), preview (editor), autónomo, cierre de sesión, overlay, XP

xpFromEvaluation(result) → number
  - Espejo frontend/backend: deriva XP directamente de ActivityEvaluationResult.score
  - 1.0 → 0 XP, 5.0 → 100 XP, null → 0 XP (actividades exclude no otorgan XP académico)
```

**Archivos fuente de verdad:**
- `lumina-frontend/src/lib/activity-scoring.ts`
- `lumina-backend/src/classes/activity-scoring.ts`
- Espejo manual entre ambos (sin paquete compartido todavía — deuda técnica documentada, 10.6)
- Sincronización verificada por `check-fixtures-sync.mjs` + `activity-scoring.fixtures.json`

### 10.2 — `ACTIVITY_SCORING`: categorías por tipo

| Categoría | Tipos | Entra al promedio |
|---|---|---|
| `binary` | `quiz_multiple`, tipos de 1 sola respuesta | Sí |
| `partial` | `completar_blancos`, `video`, y **todo Grupo 4**: `clasificar`, `memoria`, `puzzle_imagen`, `anagrama`, `puzzle_palabras`, `sopa_letras`, `crucigrama`, `globos`, `topo`, `abrir_caja`, `historia_ramificada`, `orden_rango`, `ahorcado` | Sí (si tiene `score` no-null) |
| `manual` | `respuesta_corta` | Solo tras calificación del docente |
| `participation` | `encuesta_viva`, `nube_palabras` | No |
| `exclude` | `ruleta`, `torneo`, `escape_room` | No — política fija, no se reevalúa |

`abrir_caja` y `historia_ramificada` están como `partial`, pero devuelven `score: null` cuando el
docente no configuró criterio de evaluación — el evaluador mira la definición, no hay categoría
intermedia. `orden_rango` tiene evaluador (`evaluateOrdenRango`) y test de contrato, pero **no
tiene viewer todavía** — no aparece en el editor ni en slide-renderer.
`isGradebookScoringDeferred('orden_rango')` diferir solo el promedio, no la evaluación (el
comentario del código se corrigió en Fase 7 para reflejar esto con precisión).

### 10.3 — Persistencia

- `StudentResultDto`: incluye `response` crudo (nunca el resultado evaluado mezclado — bug
  corregido en Fase 3 para `video_interactivo`, con `normalizeVideoAnswers` como compatibilidad
  para filas legacy).
- Cierre de sesión envuelto en `$transaction` de Prisma.
- Upsert incremental durante sesión en vivo (`classes.service.ts` re-evalúa con
  `evaluateActivityResponse` antes de guardar).
- `editor-client.tsx` (~L1236–1247) también re-evalúa antes de enviar score, mismo contrato.

### 10.4 — Identidad de guest (Fase 5 + remediación Fase 7)

- `POST /classes/join/:codigo/guest` crea un `User` con email `guest_*@lumina.guest` si no hay
  identidad previa válida.
- `GET /classes/:id/students/:studentId/verify` — endpoint público que confirma si un
  `studentId` en `localStorage` sigue siendo válido para **esa clase específica**, evitando
  crear un `User` fantasma en cada reconexión.
- **Modelo `ClassGuest`** (migración `20260821120000_add_class_guest`): registra explícitamente
  a qué clase se unió cada guest. `verifyGuestStudent` solo acepta al usuario si existe
  `ClassResult` en esa clase **o** un registro `ClassGuest` de esa misma clase — un guest de la
  Clase A queda `valid: false` contra la Clase B.
- `join-client.tsx`: espera `verifyStoredGuest` (await) antes de decidir entre continuar sesión
  existente o mostrar el formulario; sin condición de carrera con `POST .../guest`.

### 10.5 — Overlay y gamificación (Fase 6 + remediación Fase 7)

- El overlay compartido (`activity-result-overlay.tsx`) recibe `evaluation` como prop desde
  **todos** los viewers de Grupo 4 (`clasificar`, `globos`, `topo`, `memoria`, `sopa_letras`,
  `anagrama`, `puzzle_palabras`, `ahorcado`, `historia_ramificada`, `abrir_caja`, `crucigrama`,
  `puzzle_imagen`) — no recalcula por su cuenta. El "N de M" sale de `evaluation.details`.
- `historia_ramificada`: el overlay ya no compara el historial recorrido contra el total de
  nodos-pregunta del grafo completo (bug corregido) — usa el mismo conteo que
  `evaluateActivityResponse`, consistente con lo que ve el docente en Edu.
- `video_interactivo`: el pill de feedback inmediato por pregunta se mantiene, pero
  `reportarActividad` (el reporte a XP/gamificación) se dispara **una sola vez**, al completar el
  historial — no una vez por pregunta con el score acumulado. Antes de este fix, 4 preguntas
  correctas generaban 4 reportes de XP crecientes, inflando el leaderboard frente a la nota única
  de la planilla.
- `session-gamification.service.ts` usa `xpFromEvaluation(result)` — no una fórmula de puntos
  independiente (corrige la fórmula obsoleta documentada en el V38, Sección 6).
- `torneo-viewer.tsx` conserva su propia fórmula (`* 4 + 1`) — es la única que queda en `src/`,
  pero `torneo` es `exclude` por política fija de Fase 6; no otorga nota académica, solo un
  puntaje de juego para su propia pantalla de cierre.

### 10.6 — Deuda técnica documentada (aceptada, no remediar sin razón explícita)

| Ítem | Por qué se deja así |
|---|---|
| `normalizeVideoAnswers` | Sigue en uso real mientras existan `ClassResult` legacy con formato sucio. No borrar sin migración de datos. |
| Espejo manual ~1000 líneas frontend/backend en `activity-scoring.ts` | TODO de paquete compartido (workspace) pendiente; mitigado por tests de contrato + `check-fixtures-sync.mjs`, no elimina el drift potencial de TypeScript en sí. |
| Alias `nota` como fallback de `score` en `classes.gateway.ts` (`activity:complete`) | Compatibilidad con clientes viejos en despliegue mixto. Quitar cuando se confirme que ya no hay clientes que envíen `nota`. |
| `puntajeOverlayAhorcado` duplicado (alineado hoy con `evaluateAhorcado`) | No se unifica para no tocar algo que funciona; candidato a refactor si `ahorcado` cambia de reglas. |
| `* 4 + 1` en `torneo-viewer.tsx` | Única fórmula vieja restante en `src/` — `torneo` es `exclude`, política fija. |
| `xpFromEvaluation` sin uso en runtime del frontend (solo en tests) | Espejo intencional para verificar el contrato frontend/backend, no un evaluador huérfano. |

### 10.7 — Tests y verificación

- **Tests de contrato** (frontend + backend): recorren todas las claves de `ACTIVITY_SCORING`,
  verifican categoría, "todo correcto" → 5.0, `exclude`/sin-criterio → `score: null`, y regresión
  de `notaColombiana` (3/5 = 3.0, no 3.4 — evita reintroducir `× 4 + 1` por accidente).
- **Estado tras Fase 7:** backend 133/133, frontend 89/89, builds de Nest y Next limpios.
- Verificación manual practicada: comentar un `case` del `switch` de `evaluateActivityResponse`
  y confirmar que el test de contrato correspondiente falla (no solo "pasa en verde").

### 10.8 — Historial de fases

| Fase | Qué | Estado |
|---|---|---|
| 0 | Helper `notaColombiana` + `ACTIVITY_SCORING` + fixtures | Hecha |
| 1 | Promedio y columnas Edu (denominador evaluable) | Hecha |
| 2 | Evaluador único `evaluateActivityResponse` (Evaluación/Interacción) | Hecha |
| 3 | Persistencia con `$transaction` + fix `video_interactivo` sucio | Hecha |
| 4 | Grupo 4 cableado al mismo contrato (salvo `ruleta`/`torneo`/`escape_room`) | Hecha |
| 5 | Identidad de guest persistente por clase | Hecha |
| 6 | Tests de contrato + overlay/XP conectados al helper | Hecha |
| 7 | Peritaje exhaustivo + remediación (XP video, overlay historia, guest por clase, limpieza) | Hecha |

**Resumen de una línea para el próximo contexto:** el cálculo de notas está unificado y
verificado de punta a punta (persistencia, identidad de guest, overlay, XP) — cualquier feature
nueva de scoring debe pasar por `evaluateActivityResponse`/`notaColombiana`, nunca reimplementar
una fórmula local.
