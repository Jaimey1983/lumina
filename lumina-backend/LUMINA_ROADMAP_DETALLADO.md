# LUMINA — ROADMAP DETALLADO
> Vigente: 27/08/2026 | Reemplaza LUMINA_ROADMAP_CHECKLIST.md
> Reordenado según prioridad oficial. Los ítems ya completados se omiten —
> solo aparece un resumen de una línea por bloque para contexto.
> `orden_rango` fue eliminada (duplicaba "Ordenar") — no aparece en este documento.

---

## ✅ COMPLETADO (resumen, sin detalle)
Grupos 1–5 · Grupo 9 (11 widgets) · Scoring unificado Fases 0–7 · AI Niveles 1–2 · **AI Nivel 3 BYOK multi-proveedor** · Sesiones/Gamificación base · Join/Guest · Editor drag/snap/guías base · 14 actividades Grupo 4 (editor+viewer+scoring) · **Fase 5 Escape Room 2.0**

---

# FASE 1 — AI NIVEL 3: BYOK MULTI-PROVEEDOR
> Completada — `AiKeysService` + `ai-providers.ts` + `GET/PATCH /ai/settings`. Requiere `AI_KEYS_MASTER_SECRET` (cifrado) y opcional `GEMINI_API_KEY` (fallback plataforma).

- [x] Sin clave propia: fallback a Gemini de plataforma; si no hay BYOK ni fallback, `ServiceUnavailableException` con mensaje claro (no crash silencioso).
- [x] Selector de proveedor por docente: Claude, Gemini, OpenAI (`User.preferredAiProvider` + UI perfil/editor).
- [x] Modelo de datos: `TeacherAiKey` (clave cifrada por usuario/proveedor) + preferencia en `User`.
- [x] Cifrado AES-256-GCM con clave maestra en env (`AI_KEYS_MASTER_SECRET`, `ai-crypto.ts`).
- [x] Endpoints guardar/actualizar/eliminar clave y probar conexión (`AiKeysController` → `/ai/settings`).
- [x] UI Mi perfil (`AiKeysCard`): ingresar/editar clave por proveedor + botón probar conexión.
- [x] Resolución de proveedor activo en `AiKeysService.completeForUser` (BYOK → preferido → Gemini plataforma); `ai-features.service.ts` ya no usa `callGemini` fijo.
- [x] Errores explícitos al docente (clave inválida, decrypt fallido, proveedor caído).
- [x] Los 7 métodos de `ai-features.service.ts` migrados vía `callLlmJson` → `completeForUser` (quiz, feedback, summary, content assistant, evaluate, from document, refine structure).

---

# FASE 2 — CLIPPING MASKS (capas y máscaras de recorte estilo Canva)
> Arquitectura ya diseñada en sesión previa (28/05/2026) — lista para prompt

- [ ] Nuevo tipo de bloque `clip-group` en `slide.types.ts`
- [ ] Esquema JSON: `clipShape` (forma + parámetros) + `contenido` (imagen/color/gradiente) + `borde` + `opacidad` + `sombra`
- [ ] Formas predefinidas con generación de SVG `clipPath`:
  - [ ] Rectángulo (con `borderRadius`)
  - [ ] Círculo
  - [ ] Elipse
  - [ ] Triángulo
  - [ ] Estrella
  - [ ] Hexágono
  - [ ] Polígono de N lados configurable
  - [ ] SVG custom (path pegado por el docente)
- [ ] Utilidad `generarClipPath(forma, params)` — genera el path/clipPath según la forma elegida
- [ ] Renderizado con `<clipPath>` + `objectBoundingBox` en `slide-renderer.tsx`
- [ ] UX de selección en dos niveles: clic selecciona el grupo completo (mover/redimensionar como bloque), doble clic entra a editar el contenido interno (reposicionar/escalar la imagen dentro de la máscara)
- [ ] Panel de propiedades: controles separados para la forma (tipo, radio, lados) y para el contenido (imagen, posición, escala, color/gradiente)
- [ ] Insertar `clip-group` en el catálogo de widgets/elementos del rail izquierdo
- [ ] Integración con el sistema de snap/guías existente (el `clip-group` se comporta como cualquier bloque para efectos de drag/resize)
- [ ] Tests visuales: verificar que el contenido nunca sobrepasa los límites de la figura en ningún navegador

---

# FASE 3 — CANVAS: AUDITORÍA, DEPURACIÓN Y REFINAMIENTO
> Diagnóstico primero, fix después — mismo criterio usado con Hotspot

### 3.1 — Auditoría (solo lectura, primer prompt)
- [ ] Revisar `use-block-drag.ts` contra los 11 widgets de Grupo 9 y las 14 actividades de Grupo 4 — ¿todos respetan el mismo contrato de tamaño/posición?
- [ ] Revisar `use-canvas-guides.ts` y `canvas-spacing.ts` con bloques de tamaños atípicos (Hotspot pequeño vs. actividad grande tipo Crucigrama)
- [ ] Revisar `resize-handles.tsx` — confirmar que los límites de overflow (-50/150) siguen siendo correctos con todos los tipos de bloque actuales
- [ ] Verificar `overflow-visible` del slide frame (padding 48px) contra widgets con portal (Popup) vs. sin portal (Hotspot, Tooltip)
- [ ] Detectar conflictos entre el DndContext ampliado del rail izquierdo (widgets) y el drag interno del canvas
- [ ] Confirmar si la race condition inline-vs-panel (deuda aceptada en Popup/Hotspot/Click to Reveal) se agravó con los widgets nuevos
- [ ] Producir informe de hallazgos priorizado (bug crítico / molestia menor / cosmético) antes de tocar código

### 3.2 — Refinamiento (después del informe de auditoría)
- [ ] Corregir los hallazgos críticos identificados en 3.1
- [ ] Corregir hallazgos menores según prioridad

### 3.3 — Mejoras propuestas al sistema de canvas (evaluar tras 3.1/3.2)
- [ ] Deshacer / Rehacer (Ctrl+Z / Ctrl+Y) con historial navegable
- [ ] Panel de capas (z-order) para gestionar superposición de bloques
- [ ] Bloquear posición/tamaño de un bloque específico (útil para fondos)
- [ ] Distribución automática de N bloques equidistantes (toolbar de alineación: izq/centro/der/arriba/medio/abajo/distribuir H/distribuir V)
- [ ] Zoom del canvas (Ctrl+scroll o botones +/-)
- [ ] Grilla configurable (activar/desactivar, tamaño ajustable)
- [ ] Copiar/pegar bloques entre slides (Ctrl+C/V cross-slide)
- [ ] Miniatura real del slide en panel izquierdo (preview fiel, no placeholder)

---

# FASE 4 — GRUPO 8: UI/UX POLISH GENERAL DEL EDITOR
- [ ] Onboarding para nuevo docente — tour guiado del editor en primer login
- [ ] Plantillas de clase por área y grado — galería lista para usar
- [ ] Temas visuales del editor — paletas y fondos predefinidos por slide
- [ ] Accesibilidad del editor (contraste, navegación por teclado, ARIA labels)
- [ ] Responsivo en tablet (editor usable en iPad/tablet 10")
- [ ] Modo oscuro (editor y vista del estudiante)
- [ ] Atajos de teclado documentados (modal de ayuda)
- [ ] Toast de guardado automático con feedback visual claro
- [ ] Skeleton loaders (gradebook, analytics, biblioteca de clases)
- [ ] Empty states con call-to-action claro
- [ ] Modo presentación full desde el editor (F5 / botón "Preview completo")

---

# FASE 5 — ESCAPE ROOM 2.0
> Completada 26/08/2026 — capas 0–6 de `PLAN_ACCION_ESCAPE_ROOM_2.0.md`. Ver `LUMINA_CONTEXT_V41.md` §12.
> El flujo 1.0 (`intro → sala → victoria | derrota`) se conserva: preview y autónomo siguen locales.

- [x] Lienzo visual de sala en el viewer (`renderSalaCanvas` → `SlideRenderer` modo viewer). Salas sin `bloques` siguen en tarjeta 1.0. No se rediseñó la máquina de estados.
- [x] Sistema de pistas configurable — `pistas?: string[]`; legado `pista` se hidrata; revelado progresivo (D3), sin penalización.
- [x] Modo por equipos — solo en sesión en vivo (D1). Tablas `EscapeRoomRun` / `Team` / `Member` / `TeamRoom`. Preview/autónomo = 1.0 local.
- [x] Dashboard docente `EscapeRoomLiveDashboard` — matriz equipos × salas; eventos `team-progress`, `room-unlocked`, `finished`.
- [x] Intentos máximos flexibles por sala (≥ 1 o −1 ilimitados; default 3). Agotar = 0 pts + avance (D2).
- [x] Cierre: victoria 1.0 + podio si `mostrarRanking`; evento `escape-room:finished` (no `activity:complete` / XP).
- [x] Distinción Escape Room vs evaluación autónoma: `escape_room: 'exclude'`; filtro en `upsertLiveStudentResponse`; puntos narrativos no van a planilla.

---

# FASE 6 — GRUPO 6: COMMUNITY
- [ ] Biblioteca de clases públicas — docentes publican y comparten
- [ ] Clonar clase de otro docente (fork a la propia cuenta)
- [ ] Comentarios y valoraciones (rating) en clases públicas
- [ ] Perfil de docente público con sus clases publicadas
- [ ] Colecciones/listas para agrupar clases por tema
- [ ] Notificaciones de seguimiento (seguir a un docente)
- [ ] Co-edición de clase en tiempo real (dos docentes, mismo slide — requiere CRDT o locking)

---

# BACKLOG — SIN FASE ASIGNADA TODAVÍA

> Plan de ejecución: `PLAN_ACCION_DIAGRAMAS_GRAFICOS.md` — **CERRADO 30/08/2026** (capas 0–10). Capa 11 (ruleta roster) eliminada.

## Editor y canvas (prerrequisitos)
- [x] P0 — Preview visible al arrastrar bloques en el canvas (`applyLiveDragPositions` + chip overlay; cancel sin persistir). Bloqueante resuelto 30/08/2026.
- [x] Capa interna `src/lib/graph-editor/` — extraída de Historia ramificada (`@xyflow/react`); reutilizada por diagramas y mapa de progreso (Capa 1 + 9, 30/08/2026).

## Widgets y refactor de actividades
- [x] Ruleta → widget Grupo 9 (modo opciones estáticas) — cerrado 30/08/2026; `ruleta` sigue `exclude` en scoring
- ~~Ruleta — modo "estudiante al azar"~~ — **descartado** (Capa 11 eliminada; no hay segundo producto)

## Diagramas pedagógicos
> Stack **cerrado:** `@xyflow/react` (ya usado en `historia_ramificada`). **Mermaid descartado** (solo texto→estático; no cumple editor interactivo).
> Bloque `tipo: 'diagrama'` en el canvas (contenido docente, v1 sin evaluación). Modelo: separar `estructura` vs `modo: 'contenido' | 'plantilla_evaluable'` (v1 solo contenido).
> Convivencia canvas: grafo captura pointer solo con bloque seleccionado; drag del bloque usa handle externo (mismo patrón widgets G9).

Orden sugerido de implementación:
- [x] Diagrama de Venn — **aparte** del motor de grafos (SVG + regiones + drag a zonas) — **Capa 5 30/08/2026**
- [x] Cronología pedagógica (`diagrama` subtipo) — **no confundir** con widget `timeline` (Grupo 9) — **Capa 6 30/08/2026**
- [x] Mapa mental — primer subtipo sobre capa graph compartida — **Capa 7 30/08/2026**
- [x] Organigrama — mismo motor, layout jerárquico — **Capa 8 30/08/2026**
- [x] Mapa conceptual — aristas con etiquetas semánticas — **Capa 8 30/08/2026**
- [x] Diagrama de flujo — flechas direccionales / secuencia — **Capa 8 30/08/2026**

## Gráficos de datos en slides
> Fusionado con bloque nativo de gráficos. **v1 recomendada: Recharts** (ya en analytics + `components/ui/chart.tsx`). ApexCharts ya está instalado — solo si un spike visual exige look Materialize.
- [x] Bloque `tipo: 'grafico'` — subconjunto pedagógico v1: barras, columnas, línea, área, pastel, dona, radialBar — **Capa 4 30/08/2026**
- [x] Panel de propiedades: mini-tabla editable (categorías × series); sin import CSV
- [x] Carga perezosa (`dynamic import`) — no inflar bundle base del editor
- [x] v1 = contenido (`soloLecturaEnViewer: true`); evaluación futura = composición con quiz/respuesta abierta en el mismo slide

## Lumina Edu — mapa de progreso (curso)
> Distinto de Escape Room. Nivel **curso completo**: nodos = clases, edges = orden/desbloqueo. Requiere **backend** (reglas + estado por matrícula), no solo renderer de grafo.
- [x] Layout automático por orden de creación de clases (v1); reposición manual (v2)
- [x] Vista docente: editar mapa y conexiones; vista estudiante: solo su avance (bloqueado / activo / completado)
- [x] Reutilizar capa graph interna para el lienzo; lógica de desbloqueo propia del dominio LMS — **Capa 9 30/08/2026**

## Narrativa ligera (clase)
- [x] Misión / Quest acotada — campos opcionales a nivel clase: `nombreMision`, `fragmentosHistoria[]` (texto entre slides). Sin ramificación ni scoring. — **Capa 10 30/08/2026**

## Generador de ejercicios matemáticos
> **Secuencia:** reglas determinísticas primero (no depende de BYOK). IA después solo para variar enunciados, no para generar la lógica numérica.
- [x] Por tema (suma, resta, fracciones, ecuaciones simples) y grado — rangos numéricos ajustados
- [x] Salida como ítems `quiz_multiple` / `short_answer` compatibles con `evaluateActivityResponse`
- [x] Diferenciado del generador IA genérico (`useGenerateQuiz`) — este es plantilla determinística testeable

## Escape Room (deuda diferida de Fase 5)
- [ ] DT-ER-08: unificar persistencia del editor dedicado `/classes/:id/escape-room` con el auto-save del editor principal
- [ ] Varios Escape Rooms en la ruta dedicada
- [ ] Penalización de pistas o candado que atasque al equipo (explícitamente fuera de 2.0)

## Scoring y Lumina Edu
- [ ] Paquete compartido `@lumina/scoring` — elimina espejo manual ~1000 líneas frontend/backend
- [ ] Migrar alias `nota`→`score` en `classes.gateway.ts` (cuando se confirme despliegue limpio)
- [ ] Eliminar `normalizeVideoAnswers` (tras migración de ClassResult legacy)
- [ ] Periodos académicos en gradebook (1°-4° bimestre, Decreto 1290)
- [ ] Exportar planilla a Excel (.xlsx)
- [ ] Nota cualitativa visible (Bajo/Básico/Alto/Superior) en Lumina Edu
- [ ] Informe de desempeño por estudiante (historial, nota por actividad, progreso)
- [ ] Notificación al padre/acudiente por correo (vía Resend)
- [ ] Comparativa entre grupos (docente con varias clases)
- [ ] Limpieza de código: retirar `evaluateOrdenRango` y su entrada en `ACTIVITY_SCORING`

## Sesiones y Gamificación (más allá de lo ya construido)
- [ ] Torneo de preguntas — editor completo (hoy solo viewer básico, sin integración de scoring académico)
- [ ] Modo espectador — docente ve pantalla de cada estudiante en tiempo real
- [ ] Pausar/reanudar sesión en vivo
- [ ] Compartir slide actual sin sesión activa (link directo)
- [ ] Historial de sesiones del estudiante (page en join)
- [ ] Certificado de participación en PDF al finalizar sesión
- [ ] Modo offline para sesión autónoma (PWA/caché)

## IA (más allá de BYOK — Fase 1)
- [ ] Tests de contrato multi-proveedor — salida JSON del prompt v2 compatible entre Gemini, OpenAI y Claude (deuda BYOK; hoy hay unit tests de crypto/providers/keys)
- [ ] 51 JSONs DBA reales pendientes (grados 1-11, 5 áreas; van 2/53 hechos: lenguaje-3, lenguaje-6)
- [ ] Generador de rúbricas — IA sugiere rúbrica a partir del DBA seleccionado
- [ ] Retroalimentación automática IA para `respuesta_corta`
- [ ] Generador de plan de clase completo (varios slides + actividades desde un tema + DBA)
- [ ] Detector de dificultad — IA analiza respuestas de sesión y recomienda refuerzo
- [ ] Chat de iteración del prompt de actividad dentro del editor

## Infraestructura y Deployment
- [ ] CI/CD pipeline (GitHub Actions — build + tests en PR)
- [ ] Variables de entorno separadas por entorno (.env.local/.staging/.production documentadas)
- [ ] Monitoreo de errores (Sentry o similar, frontend y backend)
- [ ] Rate limiting en `/ai/*` y `/classes/join/*`
- [ ] Backups automáticos de Neon con política de retención
- [ ] CDN + estrategia de caché para assets de slides
- [ ] Lógica de planes/límites (free/pro/institucional)
- [ ] Multi-tenancy institucional (una institución, múltiples docentes, mismo tenant)
- [ ] Empaquetar Lumina como app de escritorio con Tauri (solo si surge demanda real de uso offline en PC)

## Viewer inmersivo y fondos
- [ ] Viewer 100dvh fullscreen real (wrapper + fondo + topbar + cuerpo centrado)
- [ ] Prop `variant: "fullscreen" | "embed"` en todos los viewers
- [ ] Catálogo de 12 fondos SVG prediseñados (Ondas naranja, Cosmos violeta, Bosque esmeralda, Red digital, Acuarela pastel, Horizonte dorado, Océano profundo, Brisa naranja, Sinapsis verde, Galaxia espiral, Pizarrón clásico, Minimalista claro)
- [ ] Campo `background` en modelo `Class`
- [ ] Animación de entrada escalonada en actividades (`animationDelay: index * 60ms`)
- [ ] Hook `useHaptic()` (vibración táctil móvil)
- [ ] Hook `useSound()` (Web Audio API, sin archivos externos)
- [ ] Barra de progreso durante la actividad
- [ ] Estado "ya respondió" persistente tras enviar
- [ ] Barras animadas en tiempo real para encuesta en vivo

## Contenido enriquecido del editor
- [ ] Fórmulas matemáticas (LaTeX)
- [ ] Bloque de código con sintaxis coloreada
- [ ] Tabla editable directamente en el slide
- [ ] Listas con viñetas personalizadas
- [ ] Bloque de cita con estilo visual
- [ ] Líneas divisoras decorativas
- [ ] Biblioteca de emojis/iconos integrada
- [ ] Audio embebido con reproductor visible
- [ ] GIFs animados como bloque
- [ ] PDF incrustado como visor
- [ ] Modelos 3D simples (STL)
- [ ] Mapas interactivos (Google Maps / Leaflet)
- [ ] Código QR como elemento insertable
- [ ] Iframe embebido genérico
- [ ] Integración Desmos (matemáticas)
- [ ] Integración PhET (simulaciones física/química)
- [ ] Integración Padlet embebido
- [ ] ~~Gráfico de barras/línea/pastel editable nativo~~ → ver **Gráficos de datos en slides** (backlog)
- [ ] Acordeón (widget de contenido colapsable)
- [ ] Tarjeta de perfil / info card
- [ ] Embed de contenido externo (YouTube, Padlet, Maps)
- [ ] Anotaciones / sticky notes en el canvas para el docente
- [ ] Contador de likes/votos en vivo (reacción de estudiantes, Socket.IO)
- [ ] Animaciones de entrada configurables por widget (fade/slide/bounce)

## Experiencia del docente en el editor
- [ ] Historial de cambios navegable (más allá de Ctrl+Z básico)
- [ ] Comentarios en slides para notas internas
- [ ] Modo presentación con notas del orador visibles solo para el docente
- [ ] Duplicar clase completa
- [ ] Banco de slides institucional (privado, entre docentes de una misma institución — distinto de Grupo 6 público)

## Experiencia del estudiante en el viewer
- [ ] Tamaño de fuente ajustable (accesibilidad)
- [ ] Subtítulos automáticos para videos
- [ ] Traducción de contenido a otro idioma
- [ ] Marcadores (guardar slides para repasar)
- [ ] Notas personales por slide (solo visibles para el estudiante)
- [ ] Modo sin conexión — descarga de clase para ver sin internet (alta relevancia en contexto rural colombiano)

## Gamificación global (cross-clase)
- [ ] Perfil de estudiante con avatar, nivel y logros acumulados en toda la plataforma
- [ ] Medallas por completar clase / racha diaria / primer lugar en torneo
- [ ] Tabla de posiciones por curso y por institución completa
- [ ] Recompensas virtuales canjeables (fondo del viewer, marco de avatar)
- [ ] Reto diario con racha independiente de sesión activa

## Accesibilidad formal (viewer del estudiante)
- [ ] Texto alternativo obligatorio en imágenes (validación al insertar)
- [ ] Verificación automática de contraste mínimo (WCAG)
- [ ] Navegación completa por teclado en el viewer
- [ ] Compatibilidad con lectores de pantalla (ARIA)
- [ ] Modo de alto contraste

## Mecánicas de juego — verificar antes de construir
- [ ] Cuadrícula deslizante (sliding tiles) — verificar si ya cubierto por "Puzzle de imagen" actual
- [ ] Puzzle progresivo por preguntas (cada acierto destapa una parte de la imagen) — verificar si "Abrir caja" ya cubre esta mecánica

---

## PRIORIZACIÓN DE REFERENCIA (backlog, no oficial)

Orden sugerido tras análisis 27/08/2026 (diagramas, gráficos, widgets):

| Tema | Esfuerzo | Impacto | Nota |
|---|---|---|---|
| P0 preview al arrastrar bloques canvas | Bajo–Medio | Alto | Confirmar bug; bloqueante para diagramas embebidos |
| Ruleta → widget (modo opciones) | Bajo | Medio | Quick win; scoring ya `exclude` |
| Generador matemáticas (reglas) | Medio | Medio-Alto | No depende de BYOK |
| Bloque `grafico` en slides (Recharts v1) | Medio | Medio-Alto | Lazy load; ver backlog Gráficos |
| Diagrama Venn | Bajo–Medio | Medio | SVG aparte, no React Flow |
| Cronología / mapa mental / organigrama | Medio–Alto | Medio-Alto | Tras capa graph + P0 drag |
| Mapa de progreso (curso, Edu) | Alto | Alto | UI graph + backend LMS desbloqueo |
| Modo sin conexión (estudiante) | Alto | Alto (contexto rural CO) | PWA/service worker |
| Accesibilidad del viewer | Medio | Alto | Terreno limpio |
| Exportar planilla a Excel | Bajo | Alto | Quick win Edu |
| Periodos académicos en gradebook | Medio | Alto | Decreto 1290 |
| Viewer fullscreen + 12 fondos SVG | Medio | Alto | Impacto visual, baja lógica |
| Misión/Quest (2 campos) | Bajo | Bajo | Capa 10 ✅ |
| ~~Ruleta modo estudiantes~~ | — | — | **Eliminada** (no hay producto) |
| Gamificación global | Alto | Medio | Modelo de datos nuevo |
| Duplicar clase | Bajo | Medio | Quick win Grupo 8 |
| App de escritorio (Tauri) | Alto | Bajo (nicho) | Solo si hay demanda real |
