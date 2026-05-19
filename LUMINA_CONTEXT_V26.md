# LUMINA_CONTEXT_V26.md
> Generado: 16/05/2026 — Sesión 11/05/2026 + 15-16/05/2026
> Reemplaza: LUMINA_CONTEXT_V25.md

---

## 1. IDENTIDAD DEL PROYECTO

**Lumina** — Plataforma SaaS educativa colombiana para docentes.
- **Lumina Core**: Editor de clases interactivas (Canva/Nearpod-style)
- **Lumina Edu**: Módulo de gestión institucional (EduCore, separado)

**Stack:**
- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + Prisma + PostgreSQL (puerto 5434 Docker) + Redis + Socket.IO
- Monorepo: `C:\Users\Jaime\proyectos\lumina\`
  - `lumina-frontend` (rama `master`)
  - `lumina-backend` (rama `main`)
- GitHub: `github.com/Jaimey1983/lumina`

---

## 2. REGLAS DE TRABAJO (CRÍTICAS)

1. **Git siempre manual** — Jaime hace todos los commits. Los agentes nunca ejecutan git.
2. **Prompts separados** — backend y frontend siempre en prompts separados y etiquetados.
3. **Siempre leer contexto primero** — todo prompt debe iniciar con "Lee LUMINA_CONTEXT_V26.md antes de empezar."
4. **No usar `&&` en PowerShell** — usar `;` o comandos separados.
5. **Claude genera los archivos de contexto** — nunca delegar a Cursor.
6. **La carpeta raíz `src/` es una copia muerta** — el backend activo es siempre `lumina-backend/`.

---

## 3. ARQUITECTURA SOCKET.IO — CRÍTICA

El sistema usa **DOS namespaces** de Socket.IO:

| Namespace | Quién conecta | Auth | Propósito |
|-----------|--------------|------|-----------|
| `/` (raíz) | Viewer (estudiantes anónimos), Editor (socket principal) | Sin JWT | Clase en vivo: slide-change, student-response, join-class |
| `/live` | Editor (socket secundario del torneo) | JWT del docente | Torneo: torneo:init, torneo:launch-question, torneo:finish |

**Regla de oro**: NUNCA mover el socket principal del viewer a `/live`. El viewer siempre usa `/` sin autenticación.

**Bridge backend**: El gateway `/live` reemite eventos del torneo al namespace `/` usando `this.server.server.to(classRoom).emit(...)` donde `classRoom = class-${classId}` (coincide con el room del `join-class` del viewer).

---

## 4. ESTADO ACTUAL — FEATURES COMPLETADAS

### 4.1 Actividades (12 tipos)
- quiz_multiple, verdadero_falso, short_answer, completar_blancos
- arrastrar_soltar, emparejar, ordenar_pasos, video_interactivo
- encuesta_viva, nube_palabras
- **torneo** ✅ (completado esta sesión)
- **escape_room** ✅ (completado esta sesión)

### 4.2 Torneo de Preguntas ✅ FUNCIONAL
**Flujo completo:**
1. Docente emite `torneo:init` por socket `/live` (con JWT)
2. Gateway crea sesión, emite `torneo:start` a `/live` Y bridge a `/`
3. TorneoPanel cambia a fase `active` (optimista, sin esperar evento)
4. Docente emite `torneo:launch-question` por `/live`
5. Gateway emite `torneo:question` a `/live` Y bridge a `/`
6. TorneoViewer recibe pregunta en socket `/` y la muestra con temporizador
7. Estudiante responde → `student-response` en `/` → ClassesGateway → TorneoService.saveAnswer
8. Al expirar tiempo → gateway emite `torneo:ranking` (bridge a ambos namespaces)
9. Docente emite `torneo:finish` → gateway emite `torneo:end` (bridge a ambos)
10. TorneoViewer muestra ranking final con `torneoEndedRef` evitando race condition

**Componentes clave:**
- `TorneoPanel` — docente, socket `/live` (torneoSocketRef)
- `TorneoViewer` — estudiante, socket `/` (liveSocket del viewer)
- `torneoSocketRef` + `torneoSocketRevision` en editor-client.tsx
- `rightFlyoutLiveSocket` useMemo: retorna torneoSocketRef cuando actividad es torneo
- `SmartPointerSensor` eliminado (no necesario en torneo)

**Bugs resueltos:**
- Socket namespace `/` vs `/live` — bridge en backend
- liveSessionId null — fallback a cls.id cuando status LIVE
- Race condition torneo:start — setPhase('active') optimista en handleInit
- Timer segundos/ms — timeLimit * 1000 en gateway
- rankingInterval sobreescribía fase finished — torneoEndedRef
- Ranking formato — parseRanking acepta array y { ranking: [...] } con campos points/total

### 4.3 Escape Room ✅ FUNCIONAL
**Flujo:**
- Actividad autónoma (no usa socket para flujo principal)
- Fases: intro → sala → victoria / derrota
- Tipos de respuesta por sala: texto, opcion_multiple, codigo
- Pistas opcionales, intentos máximos configurables
- Tiempo límite global con contador visible
- Puntos por sala con desglose final

**Funciona en:**
- Modo autónomo ✅ (viewer en /viewer o /join)
- Modo clase LIVE ✅ (viewer muestra contenido)
- Detalles de clase ✅ (página funcional para prueba)

**Bugs resueltos:**
- Loop infinito render — useEffect con [salaKey] en lugar de [salaKey, act.salas]
- Campos bloqueados — SmartPointerSensor en dnd-kit (ignora inputs/textarea)
- Teclado bloqueado — guard isEditable en onKeyDown global del editor
- Estado local — patrón persistChange en escape-room-activity.tsx
- Viewer status — acepta PUBLISHED y LIVE (no solo PUBLISHED)

---

## 5. ROADMAP — PRÓXIMA SESIÓN (PRIORIDAD ALTA)

### 5.1 Vista previa y Detalles de clase (intercambiados)
- **Problema**: Modal "Vista previa" muestra imágenes estáticas; "Detalles de clase" es funcional
- **Corrección**: Vista previa debe abrir en pestaña nueva con el viewer funcional
- **Ruta sugerida**: botón Vista previa → `window.open('/classes/[id]/viewer', '_blank')`

### 5.2 Feedback autónomo
- **Torneo autónomo**: debe mostrar ranking al finalizar (igual que en clase)
- **Escape Room**: pantalla final muestra nota 1.0 (incorrecta) — debe mostrar puntos, tiempo y desglose por sala sin nota de planilla

### 5.3 Panel "En vivo" — Escape Room
- Muestra nombre del estudiante pero no respuestas útiles
- En modo autónomo no es necesario mostrar respuestas del Escape Room en el panel docente (sin planilla)

### 5.4 Rediseño estructural Torneo y Escape Room (ROADMAP MAYOR)
- Arquitectura multi-slide: cada sala/pregunta en slide propio
- Editables con imágenes, tipografía, historia narrativa
- Elementos interactivos configurables
- Diseño visual atractivo personalizable por el docente
- Este ítem es de largo plazo — requiere rediseño de arquitectura completa

---

## 6. ROADMAP GENERAL (sin cambios desde V25)

### GRUPO 1 — Editor UX
- [ ] Drag-to-canvas
- [ ] Smart Spacing Indicators
- [ ] Selección múltiple + alignment toolbar
- [ ] Guías manuales persistentes
- [ ] Sistema de Slide Themes

### GRUPO 2 — Widgets Captivate
- [ ] Flip Cards (siguiente tras drag-to-canvas)
- [ ] Tabs
- [ ] Carousel
- [ ] Click to Reveal
- [ ] Timeline
- [ ] Widgets Genially-style (por definir)

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
- `src/app/(app)/classes/[id]/editor/editor-client.tsx` — torneoSocketRef, torneoSocketRevision, rightFlyoutLiveSocket, useAuth token, guard isEditable en onKeyDown, hydrate sessionId desde cls
- `src/app/(app)/classes/[id]/editor/components/right-flyout-panel.tsx` — condición TorneoPanel sin liveSessionId obligatorio, sessionId fallback a classId
- `src/app/(app)/classes/[id]/editor/components/slide-renderer.tsx` — prop torneoSocket propagada por BlockNode → RenderActivity → TorneoViewer
- `src/app/(app)/classes/[id]/viewer/viewer-client.tsx` — acepta status LIVE además de PUBLISHED
- `src/components/editor/panels/torneo-panel.tsx` — handleInit optimista, parseRanking flexible
- `src/components/viewers/torneo-viewer.tsx` — torneoEndedRef, parseRankingPayload flexible, onEnd con clearRankingTimer
- `src/components/editor/activities/escape-room-editor.tsx` — SmartPointerSensor, useEffect [salaKey], useMemo act
- `src/app/(app)/classes/[id]/editor/components/activities/escape-room-activity.tsx` — patrón persistChange con estado local
- `src/hooks/api/use-class.ts` — campos opcionales activeSessionId, liveSessionId, sessionId en ClassDetail

### Backend (lumina-backend)
- `src/live-sessions/live-sessions.gateway.ts` — bridge `this.server.server.to(classRoom)` para torneo:start/question/ranking/end, classJoinRoom(), fix timer segundos→ms, Namespace type
- `src/classes/classes.gateway.ts` — TorneoService.saveAnswer en student-response cuando activityType === 'torneo'
- `src/classes/classes.module.ts` — import TorneoModule
- `src/torneo/torneo.service.ts` — sin cambios estructurales, getRanking con total→points

---

## 8. NOTAS TÉCNICAS

### PostgreSQL
- Docker: `lumina_postgres`, puerto **5434**
- Local Windows: puerto 5432 (no usar)

### Convención de rooms Socket.IO
- Namespace `/`: room = `class-${classId}` (join-class)
- Namespace `/live`: room = `live:${classId}` (join)
- Bridge torneo usa `class-${classId}` en namespace `/`

### Torneo — Decisión de diseño
- Torneo es actividad competitiva/recreativa (no evaluable por ahora)
- Respuestas del torneo se guardan en TorneoService (Redis/Prisma) pero no alimentan planilla
- En futuro puede hacerse evaluable con conversión puntos→nota

### Escape Room — Decisión de diseño
- Actividad autónoma (no requiere docente activo)
- No evaluable por ahora — pantalla final muestra puntos/tiempo, no nota
- Pendiente: corregir pantalla final que muestra 1.0 incorrectamente

### Carpeta raíz src/ (IGNORAR)
- Existe una copia de archivos en la raíz del monorepo (`src/`)
- Es una copia muerta — el backend activo es `lumina-backend/`
- No sincronizar, no modificar

---

## 9. CONVENCIONES DE PROMPTS

```
[FRONTEND] Lee LUMINA_CONTEXT_V26.md y CLAUDE.md antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.

[BACKEND] Lee LUMINA_CONTEXT_V26.md y .cursorrules antes de empezar.
Archivo: src/...
[descripción del cambio]
Build debe pasar sin errores TypeScript.
```
