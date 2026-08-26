# LUMINA — ROADMAP DETALLADO
> Vigente: 22/08/2026 | Reemplaza LUMINA_ROADMAP_CHECKLIST.md
> Reordenado según prioridad oficial. Los ítems ya completados se omiten —
> solo aparece un resumen de una línea por bloque para contexto.
> `orden_rango` fue eliminada (duplicaba "Ordenar") — no aparece en este documento.

---

## ✅ COMPLETADO (resumen, sin detalle)
Grupos 1–5 · Grupo 9 (11 widgets) · Scoring unificado Fases 0–7 · AI Niveles 1–2 · Sesiones/Gamificación base · Join/Guest · Editor drag/snap/guías base · 14 actividades Grupo 4 (editor+viewer+scoring) · **Fase 2 Clipping Masks (`clip-group`)** · **Fase 3 Canvas (auditoría + refinamiento editor)**

---

# FASE 1 — AI NIVEL 3: BYOK MULTI-PROVEEDOR
> 🔜 Siguiente en curso — diseño en progreso

- [ ] Definir comportamiento sin clave propia configurada (fallback a Gemini gratuita vs. bloqueo del módulo)
- [ ] Selector de proveedor por docente: Claude, Gemini, OpenAI
- [ ] Modelo de datos: tabla/campo para clave cifrada por docente y proveedor
- [ ] Método de cifrado de claves en BD (definir: AES-256 + clave maestra en env, u otro)
- [ ] Endpoint backend para guardar/actualizar/eliminar clave de proveedor
- [ ] UI de settings: formulario para ingresar/editar clave por proveedor, con opción de "probar conexión"
- [ ] Lógica de selección de proveedor activo en `ai-features.service.ts` (reemplaza el `callGemini` fijo actual)
- [ ] Manejo de error si la clave configurada falla (mensaje claro al docente, no crash silencioso)
- [ ] Migrar los 7 métodos existentes de `ai-features.service.ts` para que funcionen con cualquiera de los 3 proveedores
- [ ] Tests de contrato para verificar que el prompt v2 produce output compatible sin importar el proveedor

---

# FASE 2 — CLIPPING MASKS (capas y máscaras de recorte estilo Canva)
> Completada 26/08/2026 — forma libre Bézier y sombra con drop-shadow añadidas en sesión posterior.

- [x] Nuevo tipo de bloque `clip-group` en `slide.types.ts`
- [x] Esquema JSON: `clipShape` (forma + parámetros) + `contenido` (imagen/color/gradiente) + `borde` + `opacidad` + `sombra`
- [x] Formas predefinidas con generación de SVG `clipPath`:
  - [x] Rectángulo (con `borderRadius`)
  - [x] Círculo
  - [x] Elipse
  - [x] Triángulo
  - [x] Estrella
  - [x] Hexágono
  - [x] Polígono de N lados configurable
  - [x] SVG custom (path pegado por el docente)
  - [x] **Extra:** forma libre con nodos Bézier (Illustrator-style)
- [x] Utilidad `generarClipPath(forma, params)` — genera el path/clipPath según la forma elegida
- [x] Renderizado con `<clipPath>` + `objectBoundingBox` en `slide-renderer.tsx` / `render-clip-group.tsx`
- [x] UX de selección en dos niveles: clic selecciona el grupo (mover/redimensionar); doble clic entra a editar imagen (pan + rueda escala); forma libre edita nodos al seleccionar (sin conflicto con pan)
- [x] Panel de propiedades: controles separados para la forma y para el contenido
- [x] Insertar `clip-group` en el catálogo de widgets/elementos del rail izquierdo
- [x] Integración con snap/guías (`use-block-drag.ts`)
- [x] Sombra visible con `filter: drop-shadow()` (no recortada por clip-path)
- [x] Clamp unificado de offsets imagen (panel + post-zoom)
- [x] Tests visuales cross-browser (Vitest Browser + Playwright: Chromium, Firefox, WebKit) — `pnpm run test:visual`

---

# FASE 3 — CANVAS: AUDITORÍA, DEPURACIÓN Y REFINAMIENTO
> Completada 26/08/2026 — auditoría Grupo 9 (`DIAGNOSTICO_GRUPO9.md`), contratos canvas (`.cursor/rules/lumina-canvas-editor-contracts.mdc`) y mejoras 3.3 en editor.

### 3.1 — Auditoría (solo lectura, primer prompt)
- [x] Revisar `use-block-drag.ts` contra widgets Grupo 9 y actividades Grupo 4 — contrato `getBlockPos` / `withRect` / clamp
- [x] Revisar `use-canvas-guides.ts` y `canvas-spacing.ts` con bloques atípicos — tests en `canvas-guides.spec.ts`, `canvas-spacing.spec.ts`
- [x] Revisar `resize-handles.tsx` — límites overflow y `getBlockResizeMinDim` por tipo
- [x] Verificar `overflow-visible` del slide frame vs. widgets con portal (Popup) vs. sin portal
- [x] Detectar conflictos DndContext rail izquierdo vs. drag interno canvas — sin colisión bloqueante documentada
- [x] Race inline-vs-panel (Popup/Hotspot/Click to Reveal) — deuda conocida, no regresión crítica con widgets nuevos
- [x] Informe de hallazgos — `DIAGNOSTICO_GRUPO9.md` + peritaje clip-group (Fase 2)

### 3.2 — Refinamiento (después del informe de auditoría)
- [x] Hallazgos críticos de interacción canvas (layout editor, modos clip-group, normalización borde)
- [x] Hallazgos menores según prioridad (clamp offsets imagen, contrato doble clic máscara)

### 3.3 — Mejoras propuestas al sistema de canvas
- [x] Deshacer / Rehacer (Ctrl+Z / Ctrl+Y) — `canvas-history.ts`, pila por slide
- [x] Panel de capas (z-order) — `layers-panel.tsx` + `canvas-layers.ts`
- [x] Bloquear posición/tamaño de bloque — `canvasLocked` en toolbar del bloque
- [x] Distribución equidistante H/V — `alignment-toolbar.tsx`
- [x] Zoom del canvas (Ctrl+scroll / botones) — `canvas-zoom.ts`
- [x] Grilla configurable — `canvas-grid.ts`, toggle en editor
- [x] Copiar/pegar bloques entre slides — clipboard cross-slide en `canvas-area.tsx`
- [x] Miniatura real del slide — `SlideThumbnailPreview` en panel lateral

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
- [ ] Rediseño completo del flujo de habitaciones/salas
- [ ] Sistema de pistas (hints) configurable por sala — array `pistas?: string[]`
- [ ] Modo por equipos — progreso independiente por equipo, no solo individual
- [ ] Dashboard del docente en tiempo real — avance de cada equipo vía Socket.IO (`room-unlocked`, `team-progress`)
- [ ] Intentos máximos configurables por sala (`intentosMaximos?: number`)
- [ ] Pantalla de victoria / cierre de escape room
- [ ] Mantener distinción clara: Escape Room (narrativa, candados) vs. Evaluación autónoma (sin narrativa) — no fusionar lógicas

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

## Diagramas pedagógicos
- [ ] Bloque `tipo: 'diagrama'` con subtipos (decisión de stack primero: React Flow vs. mermaid.js)
- [ ] Mapa mental
- [ ] Diagrama de flujo
- [ ] Organigrama
- [ ] Mapa conceptual
- [ ] Línea de tiempo editable por el docente (distinto del widget Timeline narrativo ya existente)
- [ ] Diagrama de Venn

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
- [ ] Gráfico de barras/línea/pastel editable nativo (sin herramienta externa)
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

| Tema | Esfuerzo | Impacto | Nota |
|---|---|---|---|
| Modo sin conexión (estudiante) | Alto | Alto (contexto rural CO) | Requiere PWA/service worker |
| Accesibilidad del viewer | Medio | Alto | Cero deuda previa, terreno limpio |
| Exportar planilla a Excel | Bajo | Alto | Quick win cuando toque Edu |
| Periodos académicos en gradebook | Medio | Alto | Alineado a Decreto 1290 |
| Viewer fullscreen + 12 fondos SVG | Medio | Alto | Impacto visual inmediato, baja complejidad lógica |
| Diagramas pedagógicos | Alto | Medio-Alto | Decisión de stack (React Flow/mermaid) primero |
| Gamificación global | Alto | Medio | Requiere modelo de datos nuevo |
| Duplicar clase | Bajo | Medio | Quick win cuando toque Grupo 8 |
| App de escritorio (Tauri) | Alto | Bajo (nicho) | Solo si hay demanda real |
