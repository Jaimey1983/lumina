# Análisis de mejora — Video y Video interactivo (versión «pro»)

> Alcance: diagnóstico y propuesta. **No** es una ficha del Tablero ni agrega reglas (Regla 8).
> Si se aprueba, cada fase de la sección 6 se redacta como ficha en `docs/tablero/` antes de asignarse (Regla 10).
> Fecha del análisis: 2026-10-11. Basado en el código de `main` (commit `47ed4f7`).

## 1. Estado actual (lo que existe hoy)

Hay **dos elementos distintos** que comparten el mismo reproductor conceptual pero no comparten código:

| | `video` (bloque de canvas) | `video_interactivo` (actividad) |
|---|---|---|
| Ubicación | `packages/element-kit/src/blocks/video/` + `elements/video/` | `packages/element-kit/src/activities/_classic/video-interactive*.tsx`, `video-interactive/`, `elements/video_interactivo/` |
| Modelo (`@lumina/types/slide`) | `VideoBlock`: `url`, `plataforma?`, `autoplay`, `controles`, `bucle`, `silenciado`, geometría | `VideoInteractive`: `urlVideo`, `plataforma?`, `preguntas[]`, `debeResponderParaContinuar?`, `retroalimentacion?` |
| Reproductores | `<iframe>` de YouTube; `<video>` nativo para todo lo demás | Adaptadores `PlayerAdapter` para YouTube (IFrame API), Vimeo (Player API) y HTML5 |
| Interacción | Solo eventos del motor N5: `media_inicia`, `media_termina` (solo `<video>` nativo), `hover_*` | Preguntas de opción múltiple con pausa en un segundo dado |
| Puntuación | Ninguna | `@lumina/scoring` (`partial`, nota colombiana 0–5, dedup por `questionIndex`) |
| Apariencia | `animacion: true` solamente | Ninguna (`color/tipografia/animacion: false`) |

Lo bueno que ya existe y **hay que conservar**: el patrón `PlayerAdapter` + `TimelineEngine` (testeable, sin dependencia del proveedor), el scoring delegado, la paridad con el comportamiento viejo y el logger de depuración (`lumina:video:debug`).

## 2. Hallazgos — bloque `video`

Ordenados por gravedad. Cada uno cita el archivo.

### 2.1 Defectos (funcionan mal hoy)

1. **Vimeo no se reproduce en el bloque.** `render-video.tsx:38` solo distingue YouTube; cualquier otra URL (incluida `https://vimeo.com/123`) va a `<video src=…>`, que no puede reproducir una página de Vimeo. `buildEmbedUrl` sí tiene la rama de Vimeo pero **nunca se llama** para ese caso. `VideoBlock.plataforma` existe en el tipo y nadie lo lee.
2. **Autoplay de YouTube no funciona en la práctica.** `buildEmbedUrl` agrega `autoplay=1` sin `mute=1`; los navegadores bloquean el autoplay con sonido. Además `silenciado` y `bucle` se ignoran en el iframe (YouTube necesita `mute=1`, `loop=1&playlist=<id>`).
3. **`bucle` y `silenciado` no tienen control en el panel** (`video-properties.tsx` solo ofrece URL, Autoplay y Controles) y `createDefaultVideoBlock` no los inicializa. Existen en el modelo y en el render nativo, pero el docente no puede activarlos.
4. **Detección de YouTube frágil.** `url.includes('youtube')` acepta cualquier URL con esa cadena; el regex de `buildEmbedUrl` no cubre `shorts/`, `live/` ni `embed/`, mientras que `video-url-utils.ts` (en la actividad) sí. **Hay dos parsers de URL distintos** para el mismo problema.
5. **Sin estado de error/carga.** URL vacía o inválida renderiza un `<video>` negro o un iframe roto sin mensaje ni placeholder; en el editor no hay validación al escribir la URL.
6. **Miniatura limitada.** `isThumbnail` usa `0.jpg` de YouTube (baja resolución, a veces con barras negras); para Vimeo/directo muestra un ícono genérico.
7. **Eventos incompletos.** `media_inicia`/`media_termina` solo salen del `<video>` nativo (límite declarado en N5). No hay `media_pausa`, `media_tiempo`, ni eventos para YouTube/Vimeo aunque los adaptadores de la actividad ya los saben leer.
8. **`debeResponder…` y políticas sin UI** (ver 3.3) — mismo patrón de «campo en el modelo sin control en el panel».
9. **Accesibilidad.** `<iframe title="Video YouTube">` fijo (no editable), sin subtítulos/pistas (`<track>`), sin `aria-label`, sin control de teclado propio.

### 2.2 Carencias frente a un video «profesional»

| Capacidad | Hoy | Meta pro |
|---|---|---|
| Fuente | URL pegada | Subida de archivo propio (asset de Lumina), YouTube, Vimeo, directo, y detección automática de proveedor |
| Recorte | No | `inicio` / `fin` (segundos) sin editar el video; YouTube `start`/`end`, HTML5 media fragments |
| Velocidad | No | Velocidad por defecto y selector (0.5×–2×) |
| Subtítulos | No | Pistas `.vtt` (HTML5), `cc_load_policy` (YouTube), selección de idioma; transcripción visible |
| Póster / portada | No | Imagen de portada propia o fotograma elegido; botón de play estilizado |
| Aspecto | Estira al bloque | `object-fit` (contener/cubrir), relación de aspecto bloqueable (16:9, 4:3, 1:1, 9:16) |
| Apariencia | Solo animación | Esquinas, borde, sombra, marco de dispositivo, filtros (brillo/contraste), controles personalizados con color de marca |
| Privacidad | YouTube estándar | `youtube-nocookie.com`, `dnt=1` en Vimeo (ya está en la actividad), sin videos relacionados (`rel=0`, ya está en `video-url-utils`) |
| Rendimiento | Carga el iframe siempre | Carga diferida: miniatura + play hasta interactuar (patrón «facade») |
| Pantalla completa / PiP | Solo nativo | Botones propios, fin-de-video configurable (volver al inicio / quedarse / siguiente diapositiva) |
| Acciones del motor N | `media_inicia`, `media_termina` | `media_pausa`, `media_llega_a(t)`, `media_progreso(%)`, **acciones** `reproducir/pausar/saltar_a/velocidad` invocables desde reglas Storyline |

## 3. Hallazgos — `video_interactivo`

### 3.1 Qué hace bien
- Arquitectura limpia: `useVideoInteractiveRuntime` + `TimelineEngine` + 3 `PlayerAdapter`.
- Políticas de reproducción ya implementadas en el motor: `allowForwardSeek`, `replayOnSeekBack`, `resumeOnDismiss`.
- Scoring unificado, dedup last-wins por pregunta, reporte al gradebook.

### 3.2 Limitaciones del modelo (lo que bloquea el salto a «pro»)
`VideoQuestion` solo admite **opción múltiple de 2–4 opciones con una correcta**. No hay:
- Otros tipos de interacción: verdadero/falso, respuesta múltiple, respuesta corta, ordenar, **marcar punto en pantalla (hotspot)**, escala/encuesta, reflexión libre.
- Contenido no evaluado: **nota / capítulo / texto superpuesto / imagen / enlace / “saber más”** en un instante o rango.
- Retroalimentación por pregunta (solo «¡Correcto!/Incorrecto.»): falta explicación, pista y **retroalimentación por opción**.
- Duración de la interacción (solo hay un instante `tiempoSegundos`, no un rango `inicio–fin`).
- Reintentos, límite de intentos, puntaje por pregunta (hoy todas pesan igual), obligatoriedad por pregunta.

### 3.3 Defectos y deuda
1. **Políticas ocultas.** `allowSeek`, `replayOnSeekBack` y `resumeOnDismiss` se leen con un cast `actividad as unknown as { policy?: … }` (`use-video-interactive-runtime.ts:63`). **No están en el tipo `VideoInteractive` ni en el editor**: el docente no puede configurarlas; solo funcionan si el JSON ya las trae.
2. **`debeResponderParaContinuar` está declarado y no se usa.** El único lugar es el template (`activity-templates.ts:143`); el overlay siempre permite «Continuar» tras responder y no hay modo «no puedes seguir sin contestar» ni «saltar».
3. **Dos parsers de URL más** (`extractYouTubeId` en `video-interactive.tsx:37` y `video-url-utils.ts`) además del del bloque `video` → tres implementaciones.
4. **La vista de edición no previsualiza el punto de pausa.** Hay que escribir los segundos a mano (`Input type=number`); no hay línea de tiempo, no se puede «capturar el tiempo actual» ni arrastrar marcadores, no se ve el video con la pausa.
5. **No se valida contra la duración real** (una pregunta a 3600 s en un video de 5 min nunca aparece y nadie avisa). El límite es 86400 s arbitrario.
6. **Orden y colisiones.** Dos preguntas en el mismo segundo se encolan sin aviso; el motor las muestra una tras otra solo si `activeCue` se limpia.
7. **Un solo overlay con estética fija** (`w-80`, `bg-black/70`); no hereda tema/color del curso ni es responsivo a bloques pequeños.
8. **Reanudación y progreso.** Si el estudiante recarga, el estado (`answeredQIds`, punto del video) se pierde; no hay «continuar donde lo dejé».
9. **Accesibilidad del overlay.** Sin `role="dialog"`, sin foco atrapado, sin cierre con teclado; al abrir no se mueve el foco a la pregunta.
10. **Telemetría pobre.** El logger solo escribe en consola con `localStorage` flag. No hay métricas para el docente (qué preguntas fallan, dónde se abandona el video, tiempo visto).
11. **Fallback «desconocido»** trata cualquier URL no reconocida como `<video>` directo y para otros embeds solo muestra una lista estática de preguntas (no interactúa).
12. **El elemento no tiene `apariencia`** ni `eventos` en la definición (`video_interactivo-definition.ts`): no participa del motor de interacción (Etapa K/N) como lo hace `video`.

## 4. Propuesta de producto — el salto «pro»

### 4.1 Núcleo común: un reproductor único
Extraer **`@lumina/element-kit/media-player`** (interno) con:
- `parseVideoSource(url)` — **un solo** parser (hoy hay 3); reutiliza `video-url-utils.ts`.
- `PlayerAdapter` extendido: `play/pause/seek/setRate/setMuted/getDuration/getTime/onTime/onPause/onEnded/onError`, con adaptador para YouTube, Vimeo y HTML5 (los dos primeros ya existen en la actividad).
- Un `<MediaPlayer>` React que el bloque `video` **y** la actividad usen. Esto corrige de golpe los hallazgos 2.1.1, 2.1.4, 2.1.7 y 3.3.3, y permite que el bloque emita eventos también desde YouTube/Vimeo.

### 4.2 `video` (bloque) — «Video Pro»
Nuevos campos de `VideoBlock` (todos opcionales, compatibles hacia atrás):
`inicio`, `fin`, `velocidad`, `poster`, `ajuste` (`contain|cover`), `relacionAspecto`, `subtitulos[]` (`{idioma, url, predeterminado}`), `transcripcion`, `finAlTerminar` (`quedarse|reiniciar|siguiente`), `privacidad` (`estandar|nocookie`), `etiquetaAccesible`.
Panel con secciones plegables (Etapa S): **Fuente**, **Reproducción**, **Subtítulos y accesibilidad**, **Apariencia**, **Eventos**.
Apariencia: `color: true` (acento de controles), `animacion: true`, esquinas/borde/sombra con los tokens de la Etapa T.
Eventos nuevos al motor: `media_pausa`, `media_progreso` (hitos 25/50/75/100 %), `media_llega_a` (tiempo), más **acciones** reproducir/pausar/saltar/velocidad para reglas Storyline.

### 4.3 `video_interactivo` — «Video Interactivo Pro»
Reemplazar `preguntas: VideoQuestion[]` por una **línea de tiempo de «momentos»** (`momentos: VideoMoment[]`) manteniendo `preguntas` como alias de lectura para no romper datos existentes (migración en `normalize`):

```ts
type VideoMoment =
  | { id; tipo: 'pregunta'; inicio: number; pausar?: boolean; obligatoria?: boolean;
      peso?: number; intentos?: number; subtipo: 'opcion_unica'|'multiple'|'vf'|'corta'|'hotspot'|'escala';
      enunciado; opciones?; retro?: { correcta; incorrecta; porOpcion?; pista? } }
  | { id; tipo: 'nota' | 'imagen' | 'enlace' | 'capitulo'; inicio: number; fin?: number; contenido; pausar?: boolean }
  | { id; tipo: 'salto'; inicio: number; condicion?; destino: number }   // ramificación simple
```

Capacidades de la versión pro:
- **Editor con línea de tiempo**: barra con marcadores arrastrables, botón «Insertar aquí» con el tiempo actual del reproductor, previsualización del momento, validación contra duración real (avisa de preguntas fuera de rango, duplicadas o muy juntas).
- **Políticas visibles en el panel**: permitir adelantar, repetir al retroceder, reanudar al cerrar, **obligatoriedad** (activa el `debeResponderParaContinuar` hoy muerto), reintentos, mostrar respuesta correcta.
- **Capítulos y navegación**: índice lateral/inferior clicable; el estudiante salta a capítulos ya desbloqueados.
- **Retroalimentación rica**: por opción, con pista y enlace al minuto exacto a repasar («Revisa el minuto 2:14»).
- **Progreso y reanudación**: guardar `tiempoMaximo`, momentos respondidos y respuestas; «continuar donde lo dejaste» (reutiliza persistencia del viewer/autónomo).
- **Puntuación**: `partial` ya existe; añadir `peso` por pregunta, intentos, penalización opcional y reporte de **tiempo visto / % completado** como componente configurable (sin romper la nota actual: por defecto igual que hoy).
- **Analítica para el docente** en el libro de calificaciones: curva de abandono, preguntas con menor acierto, momentos más repetidos. Reemplaza el logger de consola por eventos reales.
- **Apariencia/tema**: el overlay hereda tokens (color de acento, tipografía, esquinas) y se adapta a bloques pequeños; posición configurable (centro, lateral, inferior).
- **Accesibilidad**: `role="dialog"`, foco atrapado, Escape, anuncio `aria-live` de la pregunta, subtítulos, no depender solo de color para correcto/incorrecto.
- **Generación con IA** (Etapa J): a partir de la transcripción, sugerir momentos y preguntas con su timestamp (el endpoint `use-ai.ts` ya menciona video interactivo; hoy solo normaliza).
- **Entrada para eventos del motor** (`eventos` en la definición, como `video`): `momento_inicia`, `pregunta_respondida`, `pregunta_correcta/incorrecta`, `video_completado` para que las reglas Storyline reaccionen.

## 5. Riesgos y decisiones abiertas

1. **Compatibilidad de datos** — `preguntas[]` ya está persistido en cursos reales. `momentos[]` debe leerse con migración en `normalize` y la prueba de paridad (Regla 7) debe cubrir «mismo JSON viejo → misma salida visible».
2. **Límites de los proveedores** — Vimeo y YouTube restringen formatos/controles (p. ej. subtítulos propios no se inyectan en el iframe de YouTube). La paridad completa solo se logra en HTML5 → recomendación: ofrecer **subida de archivo propio** como camino «pro» y documentar las diferencias por proveedor en el panel.
3. **Almacenamiento y costo** — la subida de video exige decidir almacenamiento (¿se usa el servicio de assets actual? ¿límite de tamaño? ¿transcodificación?). Decisión de producto/infra antes de la fase 3.
4. **Fusión de elementos** — ¿`video` e `video_interactivo` siguen siendo dos tipos o `video_interactivo` pasa a ser «un `video` con momentos»? Recomendación: **seguir siendo dos tipos** (el segundo es actividad calificable, con scoring), pero **compartiendo el reproductor y el parser**.
5. **Alcance de la analítica** — requiere backend (agregados por actividad); no se puede resolver solo en `element-kit`. Va en ficha propia del backend con `@Roles` y `CourseAuthorizationService` (Regla 5).
6. **Regla 3 / Regla 4** — como no hay tipos nuevos de registro (se amplían `video` y `video_interactivo`), no hay conflicto con «nada nuevo en el sistema viejo». Los parsers duplicados deben **borrarse** en la misma fase que los unifica.

## 6. Hoja de ruta sugerida (fases = fichas futuras, un PR cada una)

| Fase | Contenido | Dependencias | Tamaño | Valor |
|---|---|---|---|---|
| **V0** | Correcciones sin cambio de modelo: Vimeo en el bloque, `mute/loop` en YouTube, controles de `bucle` y `silenciado`, un solo parser de URL, estado vacío/error, `title` accesible | — | S | Alto (arregla fallos reales) |
| **V1** | Reproductor común (`MediaPlayer` + `PlayerAdapter` ampliado) usado por bloque y actividad; eventos `media_*` también en YouTube/Vimeo | V0 | M | Alto |
| **V2** | `video` Pro: recorte, velocidad, póster, ajuste/aspecto, subtítulos, apariencia con tokens T, carga diferida, eventos y acciones nuevos | V1 | M–L | Alto |
| **V3** | `video_interactivo` Pro (editor): modelo `momentos[]` + migración, línea de tiempo, políticas visibles, `debeResponderParaContinuar` real, tipos de pregunta nuevos | V1 | L | Muy alto |
| **V4** | Runtime pro: retro rica, reintentos, peso, capítulos, progreso/reanudación, overlay con tema y accesible, eventos del motor | V3 | L | Alto |
| **V5** | Analítica del docente (backend + gradebook) y reporte de tiempo visto | V4 | L | Medio–alto |
| **V6** | IA: propuesta de momentos/preguntas desde transcripción | V3 + Etapa J | M | Medio |
| **V7** | Subida de archivo propio, transcodificación y subtítulos `.vtt` | decisión de infra | L | Medio–alto |

Orden recomendado: **V0 → V1 → V3 → V2 → V4** da primero lo que más pesa para el docente (el editor del video interactivo y los fallos actuales) y deja la analítica y la IA para cuando el modelo ya esté estable.

## 7. Pruebas necesarias (Regla 7)

- Paridad: JSON viejo de `video` y `video_interactivo` → misma salida visible tras cada fase.
- `TimelineEngine`: casos nuevos (rangos, colisiones, saltos, obligatoriedad) como pruebas unitarias puras.
- Adaptadores: ampliar `youtube-adapter.spec.ts` al resto (`vimeo`, `html5`) y a los nuevos métodos (`setRate`, `getDuration`).
- Scoring: fixtures nuevos en `activity-scoring.fixtures.json` para peso, intentos y tipos de pregunta nuevos; los actuales no deben cambiar.
- E2E: ampliar `lumina-frontend/cypress/e2e/04-html5-direct.cy.ts` con Vimeo y con política «no avanzar sin responder».
- Accesibilidad: foco y teclado en el overlay (axe en Cypress).

## 8. Resumen ejecutivo

- Hoy el **bloque `video` es un embed básico** (con un defecto real: Vimeo no funciona) y el **video interactivo es un cuestionario de opción múltiple con pausas**, bien construido por dentro pero limitado por su modelo y su editor.
- **«Pro» significa:** un reproductor único y confiable, control fino de la reproducción (recorte, velocidad, subtítulos, apariencia), una **línea de tiempo editable** con varios tipos de momento (preguntas variadas, notas, capítulos, saltos), políticas de avance configurables, retroalimentación rica, progreso reanudable, accesibilidad y analítica para el docente.
- Lo más rentable primero: **V0 (arreglos), V1 (reproductor común) y V3 (editor con línea de tiempo)**.
