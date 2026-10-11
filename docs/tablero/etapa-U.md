# Etapa U — Actividades de nivel profesional: marco común, tokens, movimiento, accesibilidad y producción

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `U0–U13` (más sub-letras `a/b/c/d` donde se indica). No confundir con `L.n`, `N.n`, `Q.n`, `R.n`, `S.n`, `T.n`. Es la continuación natural de la etapa T, que dejó fuera de alcance «todo cambio en actividades». Redactada a partir del análisis de actividades del 2026-10-11 contrastado con el código (conversación con el dueño; solo lectura, sin código).

**Por qué existe:** las actividades funcionan y se califican bien (un solo evaluador en `@lumina/scoring`), pero se ven y se sienten básicas porque no existe un *marco de actividad* común. Cada una resolvió por su cuenta apariencia, fases, intentos, tiempo, vidas, feedback y pantalla de resultado. Medido al redactar (**re-medir al tomar cada ficha**, Regla 9 §3):

- **~26 tipos dentro del kit** (`packages/element-kit/src/activities/`): 14 clásicas (`_classic/`: quiz, V/F, respuesta corta, respuesta matemática, completar blancos, arrastrar y soltar, emparejar, ordenar pasos, video interactivo, encuesta viva, nube de palabras, 3 de química) y 12 del «Grupo 4» (clasificar, memoria, puzzle de imagen, sopa de letras, crucigrama, anagrama, ahorcado, puzzle de palabras, abrir caja, globos, topo, historia ramificada). **Fuera del contrato:** `torneo` y `escape_room` (viewers y sockets propios en `lumina-frontend`, ramificados a mano en `slide-renderer.tsx`); `orden_rango` es clave reservada en scoring sin viewer; `ruleta` existe como actividad y como widget.
- **Dos contratos de runtime.** Clásicas: prop `activity`, callback `onResponse`, campos planos (`puntos`, `retroalimentacion`). Grupo 4: prop `actividad`, callback `onComplete`, objeto `configuracion` anidado, sin `Feedback`. `ActivityRuntimeConfig` (frontend, `lib/activity-runtime-config.ts`) mezcla ambos callbacks. Los adaptadores clásicos (`elements/_shared/classic-adapters.tsx`) usan `any` y fijan `editorSyncKey=""`; su `Propiedades` es el mismo Editor (no hay panel de propiedades real). Idioma de campos mezclado (`question`/`expectedAnswer` vs `pregunta`/`afirmacion`).
- **Cada viewer es una máquina de estado artesanal** (`useState` + varios `useRef` + ~15 `setTimeout`). Memoria vuelve a llamar `evaluateActivityResponse` dentro del viewer además de exponer `puntuacion` en su definición.
- **Aleatoriedad sin control:** `sort(() => Math.random() - 0.5)` en 8 archivos (barajado sesgado) y 11 `Math.random` en viewers, sin semilla.
- **Resultado único y pobre:** `_shared/activity-result-overlay.tsx` (73 líneas): modal fijo con la nota 0–5 y «¡Muy bien!»/«Sigue practicando»; sin desglose, revisión, explicación ni `role="dialog"`; muestra nota incluso en práctica; azul `#2563EB` fijo.
- **Apariencia:** hex a pelo en casi todos los archivos de actividades (mayores: `quiz-option-layouts` 36, `drag-drop` 30, `video-interactive` 30, `true-false` 29, `live-poll` 28). No usan los tokens `--lw-*`. `apariencia` declara `{color:false, tipografia:false, animacion:false}` en las que se revisaron. Ninguna actividad usa `motion`; **0** menciones de `prefers-reduced-motion`; las cartas de Memoria cambian de color, no se voltean.
- **Accesibilidad:** poco `aria-*` (1 coincidencia o ninguna por archivo); `KeyboardSensor` en pocos lugares; ningún `aria-live` de resultados.
- **Pruebas:** 4 specs dentro de `activities/`; la paridad vive en `elements/*/*.parity.spec.tsx`.
- **Infraestructura de la etapa T que se REUTILIZA (no se reescribe):** `packages/element-kit/src/widgets/_motion/` (`WidgetMotion`, `useWidgetReducedMotion`, presets), `widgets/_efectos/confeti.tsx` (confeti sin dependencias, respeta «reducir movimiento»), `widgets/_audio/audio-context.ts`, `editor-shared/src/preset-gallery.tsx` (`PresetGallery`, `aplicarPreset`), `editor-shared/src/use-widget-theme.ts` (`--lw-*`) y la guarda `widgets/widget-tokens.spec.ts` (`hexSueltos`) como molde. `useSound` está en `editor-shared/src/use-sound.ts`.

**Decisiones de diseño (DU1–DU8), fijadas por esta raíz; el operador no las reabre:**

- **DU1.** Un único `ActivityShell` (en `activities/_shared/`) envuelve a toda actividad. Gestiona las fases `intro → jugando → revisión → resultado`, el encabezado (progreso, tiempo, vidas, puntaje) y la pantalla de resultados. La actividad solo implementa la mecánica. El estado de fases es un **reducer puro** (`useActividadSesion`), testeable sin DOM; los `setTimeout` de mecánica se reemplazan por transiciones del reducer o por un helper de temporizador cancelable.
- **DU2.** Un único callback: `onResponse`. `onComplete` se retira por adaptador, actividad por actividad (Regla 4); `ActivityRuntimeConfig` termina con un solo campo.
- **DU3.** `ajustes?: ActivitySettings` opcional en **toda** variante de `Activity`: `modo` (`practica`|`evaluacion`), `intentos`, `tiempoLimiteSeg`, `vidas`, `barajar`, `semilla`, `pistas` (cantidad y costo), `mostrarNota`, `mostrarSolucion`, `retroalimentacion` (`inmediata`|`al_final`|`ninguna`). Se **normaliza al leer** (`normalizarAjustes(actividad)`): `ajustes` gana; si falta, se derivan de los campos legacy (`configuracion.tiempoLimite`, `vidas`, `intentos`, `permitirReintento`, `mostrarTimer`, `maxIntentos`, `retroalimentacion.intentosPermitidos`). **No hay migración de datos en BD**; los campos legacy quedan como fallback de solo lectura. No se cambia ningún `tipo`.
- **DU4.** Vocabulario de apariencia: se reutiliza `--lw-*` y se agregan solo tokens de estado `--la-color-{correcto,incorrecto,pista,bloqueado,seleccionado}` y `--la-radio-*`/`--la-elevacion-*` si hacen falta. Una actividad **migrada** no contiene hex fuera del *fallback* de un `var(--l*-…, …)`. Como son 26 y hay mucho hex hoy, la guarda es un **ratchet**: lista de archivos exentos que solo puede **achicarse** (cada ficha de migración retira el suyo).
- **DU5.** Movimiento, sonido y confeti se obtienen de **un solo módulo compartido**, promovido desde `widgets/_motion`, `widgets/_efectos` y `widgets/_audio` sin romper a los widgets (re-export, Regla 4 al final). Ninguna actividad importa `motion` directamente. No se agrega `canvas-confetti`: ya existe `Confeti`. Dependencias nuevas, si las hay, se declaran en `packages/element-kit/package.json` y se cargan con `import()` si pesan (el viewer del alumno no paga lo que el slide no usa).
- **DU6.** La pantalla de resultados (`ActivityResultScreen`) reemplaza a `ActivityResultOverlay`: nota o puntos según `mostrarNota`, desglose por ítem (desde `evaluation.details`), revisión de errores, explicación, reintento y mejor intento. Es un `role="dialog"` con foco gestionado.
- **DU7.** **El scoring no se toca.** `@lumina/scoring`, `notaColombiana`, `ACTIVITY_SCORING`, `GRADEBOOK_CONNECTED_PARTIAL` y los fixtures de paridad quedan congelados. El shell solo **consume** `evaluateActivityResponse`; la forma de la respuesta que cada actividad entrega a `onResponse` **no cambia**. El canal `ElementRuntimeConfig` no transporta notas (C1/C4).
- **DU8.** Accesibilidad es requisito de entrada de cada actividad migrada: operable por teclado, anuncios con `aria-live`, foco visible y gestionado, alternativa «tocar para elegir, tocar para colocar» al arrastre, y `prefers-reduced-motion` respetado (vía DU5).

**Riesgos relevados al redactar (re-medir al tomar cada ficha):**

- El gradebook depende de la forma de la respuesta de cada actividad y de los fixtures; cualquier ficha que la altere queda **bloqueada** (DU7).
- Las fichas U3–U10 editan archivos compartidos (`activities/_shared/`, `elements/_shared/`, `slide-renderer.tsx`, `activity-runtime-config.ts`): **no corren en paralelo entre sí**.
- Los snapshots de U0 dependen del navegador del proyecto `visual`; si la fuente o el motor cambian, los diffs posteriores serían ruido (mismo aviso que T0).
- Si el backend valida la forma del `Activity` con una lista blanca, `ajustes` debe agregarse allí; **U2 lo mide primero** y, si aplica, para y pide ficha de backend (Regla 5 no se toca).
- `torneo`/`escape_room` (U11) dependen de sockets: la ficha empieza con relevamiento y puede cerrarse sin migrar si el costo supera el beneficio.
- Un `Viewer` montado dentro de un bloque del canvas vive bajo zoom y recorte; probar el overlay/dialog del shell dentro de `.canvas-slide` (mismo riesgo que T15).

**Orden / dependencias:**
```
U0 ─→ U1 ─┐
 │        ├─→ U3 ─→ U4 ─→ U5 ─→ U6 ─→ U7 ─→ U8 ─→ U9a ─→ U9b ─→ U9c ─→ U9d ─→ U10 ─→ U11
 └─→ U2 ──┘                                                     │
                                                                └─→ U12 ─→ U13
```
U1 y U2 tocan archivos disjuntos (CSS/guarda contra tipos/normalizador) y pueden ir en paralelo. De U3 en adelante, serie.

**Fuera de alcance de la etapa:** `@lumina/scoring` y el gradebook (DU7), el backend, el motor de reglas (etapas K/N), widgets, y cualquier actividad **nueva** antes de cerrar U10 (el catálogo nuevo se redacta en U13, Regla 10: fichas futuras al cerrar la previa). Las propuestas de catálogo nuevo están al final como *insumo*, no como fichas.

---

#### U0 — Línea base visual de las actividades y matriz de auditoría
- **Operador:** Claude Code
- **Estado:** en revisión — `actividades-base.visual.spec.tsx` + `actividades-fixture.tsx` + `actividades-visual.css` en `lumina-frontend/src/visual-tests/`: 30 pruebas (1 de registry + 26 estados iniciales montando el `Viewer` real + overlay de resultado aprobado/reprobado + `verdadero_falso` respondida), 29 PNG `chromium-linux`; `Math.random` sembrado y `requestAnimationFrame`/`setInterval` congelados; 3 corridas seguidas 30/30; `eslint` y `tsc --noEmit` limpios en los archivos nuevos. Matriz y hallazgos en `docs/tablero/etapa-U-matriz.md` (**corrige varias cifras de esta raíz**, ver su §4). **Hallazgo clave (confirmado con `next build`):** `@lumina/element-kit` no está en los `@source` de `globals.css`; 256 clases Tailwind válidas del kit (122 en actividades, p. ej. `text-green-500`, `border-green-400`) **no existen en el CSS de producción** — detalle y decisión pendiente en la matriz §3.1. **Comando:** corrido con `vitest run` sobre el proyecto `visual` limitado a Chromium (`CHROMIUM_BIN` apuntando a `chromium-1194`, porque Playwright 1.62 pide un build que el entorno no trae; Firefox/WebKit no están). El comando exacto `pnpm --filter lumina-frontend test:visual` (3 navegadores) **no se pudo correr aquí**.
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `lumina-frontend/src/visual-tests/` (specs y helper de fixtures nuevos, sus imágenes de referencia) y un archivo `docs/tablero/etapa-U-matriz.md` con la matriz de auditoría. **NO** toca `packages/` ni ningún CSS/TSX de actividades.
- **Entregable:** (1) un snapshot del `Viewer` real del registry por cada actividad del kit (~26) en estado inicial, y para las que tienen fase de resultado, uno del resultado (con respuesta fija, sin animaciones, sin `Math.random`: fijar semilla/mock del azar en el fixture); referencias solo `chromium-linux`, como `widgets-base`. (2) La matriz, una fila por actividad: prop (`activity`/`actividad`), callback (`onResponse`/`onComplete`), ubicación de config (plana/`configuracion`), hex (conteo exacto por archivo), `aria-*`, `KeyboardSensor`, `setTimeout`, `Math.random`, uso de `ActivityResultOverlay`/`ActivityTimer`/`ActivityLives`, `useSound`, líneas del viewer. Los números de esta ficha raíz se **re-miden** y se corrigen en la matriz. Verificación: `pnpm --filter lumina-frontend test:visual` verde dos corridas seguidas.
- **Cierre:** n/a (no hay código viejo).

#### U1 — Tokens de estado `--la-*` y guarda ratchet contra hex en actividades
- **Operador:** Claude Code
- **Estado:** en revisión — nuevos `activities/_shared/activity-tokens.module.css` (clase `.tokens` con `--la-*`: 5 estados × color/tinte `-suave`/texto, 4 neutros, 4 radios, 2 elevaciones; los colores de estado salen de `--lw-color-{success,danger,warning,primary}` con hex solo como fallback), `activities/_shared/activity-tokens.ts` (`ACTIVITY_TOKENS`, `laVar()`; fuente de los fallbacks) y `activities/activity-tokens.spec.ts` (12 pruebas): CSS y tabla coinciden, el texto de cada estado cumple WCAG AA sobre blanco (≥ 4.5:1, vía `@lumina/editor-shared/contrast`), y guarda **ratchet** con tope **exacto** por archivo — **56 archivos, 646 hex sueltos** medidos hoy (incluye `.css`, strings, `style={{}}` y clases `bg-[#…]`; fuera: fallbacks de `var()`, declaraciones `--x:` y comentarios). Falla si un archivo no exento trae hex, si un exento trae más, y si un exento bajó/quedó sin hex sin actualizar el tope (verificado a mano en los tres sentidos). `activity-tokens.ts` queda como único archivo permanentemente fuera de la guarda (es donde nace el hex). **Nada migrado, ningún viewer cambia, `use-widget-theme.ts` no se tocó** (no hizo falta: los tokens leen `--lw-*` ya existentes). **Verificación:** `pnpm --filter @lumina/element-kit test` (tsc + vitest) 124 archivos / 1223 pruebas verdes; `lint` 0 errores (42 warnings preexistentes, ninguno en archivos nuevos); `pnpm build` OK y `dist/` trae el `.module.css`. **Observaciones para U9:** (1) parte del hex de la lista es **dato**, no estilo (`*-defaults.ts`/`*-config.ts`, p. ej. paletas por defecto de Clasificar y Globos que se guardan en el slide): al migrar cada actividad hay que decidir si esos valores se quedan como dato (y el archivo pasa a una exención permanente y comentada) o se derivan del tema; (2) `activity-result-overlay.tsx` (1 hex) se reemplaza en U3. **Precondición:** se tomó con U0 y X.4 en `en revisión`, no `hecho`, por indicación expresa del dueño; si la revisión manual de X.4 detectara cambios de aspecto no deseados, esta ficha no se ve afectada (no consume CSS de producción).
- **Precondición:** U0 `hecho` y **X.4 `hecho`** (`fase1-lint-abiertos.md`: las clases del kit deben llegar al CSS de producción; hallazgo de U0, matriz §3.1).
- **Alcance — PUEDE tocar:** `packages/element-kit/src/activities/_shared/` (archivo de tokens nuevo y sus estilos), `packages/editor-shared/src/use-widget-theme.ts` **solo si** hace falta exponer tokens `--la-*` desde el mismo tema, y un spec nuevo `packages/element-kit/src/activities/activity-tokens.spec.ts` (molde: `widgets/widget-tokens.spec.ts`). **NO** migra ninguna actividad ni cambia ningún viewer.
- **Entregable:** los tokens de estado de DU4 con fallback definido; la guarda que recorre `activities/**/*.{css,tsx,ts}` y falla si un archivo **no exento** contiene hex suelto (reutilizar `hexSueltos`, extendido a `style={{…}}` y clases Tailwind arbitrarias `bg-[#…]`); lista de exentos = todos los archivos con hex hoy, ordenada, con un test que falla si la lista **crece** o contiene un archivo que ya no tiene hex. Verificación: `pnpm --filter @lumina/element-kit test` y `pnpm --filter @lumina/element-kit lint`.
- **Cierre:** n/a. La lista de exentos se vacía durante U9a–U9d (cada migración retira el suyo).

#### U2 — `ActivitySettings` y normalizador (tipos + función pura, sin UI)
- **Operador:** Claude Code
- **Estado:** [en curso: Claude Code]
- **Precondición:** U0 `hecho`.
- **Alcance — PUEDE tocar:** `packages/types/src/slide.types.ts` (agregar `ActivitySettings` y el campo opcional `ajustes?` en cada variante de `Activity`, vía una base común, sin renombrar nada), `packages/element-kit/src/activities/_shared/` (`activity-settings.ts` + spec). **NO** toca viewers, editores, scoring ni backend.
- **Entregable:** `normalizarAjustes(actividad): AjustesResueltos` puro, con tabla de derivación documentada de los campos legacy de **cada** tipo (medida actividad por actividad, Regla 9 §3) y un spec que cubra los ~26 tipos con su payload real. Medición previa obligatoria: ¿el backend valida/descarta campos desconocidos del `Activity`? Si sí, la ficha **para** y deja `bloqueado por` ficha de backend. Verificación: `pnpm --filter @lumina/types test`, `pnpm --filter @lumina/element-kit test`, `pnpm --filter @lumina/scoring test` (debe seguir verde sin cambios).
- **Cierre:** n/a.

#### U3 — `ActivityShell`, reducer de sesión y `ActivityResultScreen`
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U1 y U2 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/activities/_shared/` (archivos nuevos: `activity-shell.tsx`, `use-actividad-sesion.ts`, `activity-result-screen.tsx`, `activity-header.tsx`, módulo CSS con tokens `--la-*`, specs). **NO** migra actividades; **NO** borra `ActivityResultOverlay`, `ActivityTimer`, `ActivityLives` todavía.
- **Entregable:** el shell con las fases de DU1, encabezado (progreso/tiempo/vidas/puntaje según `ajustes`), pantalla de resultados de DU6 (`role="dialog"`, foco al abrir y al cerrar, `aria-live`), reducer puro con tests de todas las transiciones (incluido reintento y agotar intentos/tiempo/vidas) y prueba de render de cada fase. Props públicas mínimas y documentadas en el archivo; sin `any`. Verificación: `pnpm --filter @lumina/element-kit test` y `lint`.
- **Cierre:** `ActivityResultOverlay` se borra en U9d cuando nadie lo referencie (`TODO(migración-…)` no aplica: la etapa no es de migración; el cierre es la Regla 4 de cada ficha U9).

#### U4 — Piloto: Memoria y Verdadero/Falso sobre el shell
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U3 `hecho`.
- **Alcance — PUEDE tocar:** `activities/memoria/`, `activities/_classic/true-false.tsx`, `elements/memoria/`, `elements/verdadero_falso/`, `lib/activity-runtime-config.ts` (solo para aceptar el callback unificado en estas dos), sus specs de paridad. **NO** toca las demás actividades.
- **Entregable:** ambas actividades usan `ActivityShell` y `normalizarAjustes`; Memoria emite por `onResponse` (con adaptador transitorio para `onComplete`); **misma entrada → misma respuesta a `@lumina/scoring`** (Regla 7: paridad contra el comportamiento viejo, incluidos los fixtures de scoring); retiran su hex de la lista de exentos de U1. Se documenta en la ficha qué hubo que ajustar al shell (lección para U9). Verificación: `pnpm --filter @lumina/element-kit test`, `pnpm --filter lumina-frontend test:visual` (los diffs de estas dos son esperables y se revisan; las demás no cambian).
- **Cierre:** el estado local y los `setTimeout` viejos de ambas se borran en el mismo PR.

#### U5 — Módulo compartido de movimiento, sonido y confeti + feedback de acierto/error
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U4 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/activities/_shared/` (módulo de feedback), un módulo neutro nuevo (p. ej. `packages/element-kit/src/_efectos/`) al que se **promueven** `widgets/_motion`, `widgets/_efectos`, `widgets/_audio` dejando re-exports en el lugar viejo, y las dos actividades del piloto. **NO** cambia el comportamiento de ningún widget (los snapshots de `widgets-base` deben seguir idénticos).
- **Entregable:** `ActivityFeedback` (acierto/error/pista/logro) con presets de `motion`, confeti y sonido vía `useSound`, todo respetando `useWidgetReducedMotion` (DU5, DU8); Memoria con volteo real de carta; V/F con transición de estado. Verificación: `pnpm --filter @lumina/element-kit test`, `lint`, `pnpm --filter lumina-frontend test:visual`.
- **Cierre:** los re-exports de compatibilidad quedan con `TODO` y fecha en el PR; se borran en U9d si nadie los usa.

#### U6 — Accesibilidad de arrastre y anuncios
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U5 `hecho`.
- **Alcance — PUEDE tocar:** `activities/_shared/activity-dnd-root.tsx`, `activities/_shared/activity-drag-word.tsx` y un helper nuevo de anuncios/«tocar para elegir, tocar para colocar». **NO** migra viewers todavía; solo deja listas las primitivas.
- **Entregable:** `KeyboardSensor` y `TouchSensor` configurados en un único `ActivityDndRoot`, `announcements` en español, modo «tocar-colocar» activable, pruebas con `@testing-library` de operación solo con teclado. Verificación: `pnpm --filter @lumina/element-kit test` y `lint`.
- **Cierre:** n/a.

#### U7 — Barajado con semilla y fin del `sort(random)`
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U6 `hecho`.
- **Alcance — PUEDE tocar:** helper nuevo `activities/_shared/barajar.ts` (Fisher–Yates con PRNG sembrado desde `ajustes.semilla`; sin dependencia nueva salvo que se justifique) y los 8 archivos que hoy hacen `sort(() => Math.random() - 0.5)` **solo** para sustituir esa línea. **NO** cambia otra lógica de esos viewers.
- **Entregable:** `barajar(arr, semilla)` con spec de uniformidad y reproducibilidad; sin semilla, comportamiento equivalente al actual (orden distinto por alumno). Los 11 `Math.random` de viewers se clasifican en la ficha (barajado / posición visual / otro) y solo los de barajado migran. Verificación: `grep -rn "Math.random() - 0.5" packages/element-kit/src/activities` → **0**; `pnpm --filter @lumina/element-kit test`.
- **Cierre:** Regla 4: el patrón viejo desaparece en el mismo PR.

#### U8 — Panel común de configuración y galería de estilos
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U7 `hecho` y **S12 `hecho`** (las propiedades usan `CollapsibleSection`; el índice de `AGENTS.md` aún dice «en revisión»).
- **Alcance — PUEDE tocar:** componente nuevo `ActividadAjustesPanel` en `activities/_shared/` (secciones: Modo y calificación, Tiempo e intentos, Vidas, Pistas, Retroalimentación, Aspecto), `PresetGallery` de `@lumina/editor-shared` **solo para leerla**, `presets` de las definiciones de Memoria y V/F, y las `Propiedades` de esas dos. **NO** toca el panel de las demás.
- **Entregable:** el panel escribe `ajustes` (nunca los campos legacy); presets de estilo (p. ej. *Escolar, Examen, Arcade, Minimal, Pizarra*) como `estadoPatch` visibles en una `CollapsibleSection` «Estilos»; opciones que no aplican a la actividad se ocultan según una declaración por tipo. `apariencia` de esas definiciones pasa a reflejar lo que realmente soportan. Verificación: `pnpm --filter @lumina/element-kit test`, `lint`, `test:visual`.
- **Cierre:** el panel viejo de Memoria se borra en el mismo PR.

#### U9a — Oleada A: respuesta y selección simple
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U8 `hecho`.
- **Alcance — PUEDE tocar:** `short_answer`, `respuesta_matematica`, `completar_blancos`, `encuesta_viva`, `nube_palabras`, las 3 de química y sus carpetas en `elements/`. **NO** toca otras familias.
- **Entregable:** cada una sobre `ActivityShell`/`ajustes`/`onResponse`, con `Propiedades` real (fin de «Propiedades = Editor»), paridad contra el viejo y su archivo retirado de los exentos de U1. Una sola ficha puede partirse en `U9a.1…` por actividad si el PR crece (Regla 10). Verificación: tests del kit + `test:visual` + `pnpm --filter @lumina/scoring test`.
- **Cierre:** Regla 4 por actividad migrada.

#### U9b — Oleada B: arrastre y emparejamiento
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U9a `hecho`.
- **Alcance — PUEDE tocar:** `arrastrar_soltar`, `clasificar`, `emparejar`, `ordenar_pasos`, `puzzle_imagen`, `puzzle_palabras` y sus carpetas de `elements/`.
- **Entregable:** como U9a, usando las primitivas de U6 (teclado y «tocar-colocar» obligatorios, DU8) y el barajado de U7. Verificación: ídem U9a.
- **Cierre:** Regla 4 por actividad.

#### U9c — Oleada C: juegos de palabras
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U9b `hecho`.
- **Alcance — PUEDE tocar:** `anagrama`, `ahorcado`, `sopa_letras`, `crucigrama` y sus carpetas de `elements/`.
- **Entregable:** como U9a; teclado completo (en crucigrama y sopa de letras es el requisito más caro: relevar antes de estimar). Verificación: ídem.
- **Cierre:** Regla 4 por actividad.

#### U9d — Oleada D: arcade, narrativa, video y quiz
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U9c `hecho`.
- **Alcance — PUEDE tocar:** `globos`, `topo`, `abrir_caja`, `historia_ramificada`, `video_interactivo`, `quiz_multiple` (incluye SYNCED y sus 7 layouts) y sus carpetas de `elements/`; borrar `ActivityResultOverlay`, `ActivityTimer`/`ActivityLives` viejos y los re-exports de U5 cuando ya no tengan referencias.
- **Entregable:** como U9a. Quiz SYNCED conserva su contrato con el docente (relevar antes; si exige tocar sockets, **parar** y abrir ficha). Al cerrar: `grep -rn "onComplete" packages/element-kit/src/activities` → **0** y `ActivityRuntimeConfig` sin `onComplete`; la lista de exentos de U1 vacía. Verificación: tests del kit, `lint`, `test:visual`, `pnpm --filter lumina-frontend test`.
- **Cierre:** Regla 4: cierra la deuda de la etapa (overlay, adaptador `onComplete`, re-exports).

#### U10 — Fusión de motores (sin cambiar `tipo`)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U9d `hecho`. **Redacta y mide primero** (Regla 10): la ficha se completa tras U9d con el estado real del código.
- **Alcance (provisional):** motor *Arcade* común para `globos` y `topo`; motor de *categorización* común para `clasificar` y `arrastrar_soltar`; *banco de preguntas* común de opción múltiple (quiz, V/F, arcade, abrir caja, nodos de pregunta de historia); *banco de palabras* común para los juegos de palabras. Los `tipo` existentes y la forma de respuesta se **mantienen**.
- **Entregable:** el motor compartido, cada `tipo` como *skin* o preset sobre él, paridad de scoring intacta. Verificación: tests del kit y `pnpm --filter @lumina/scoring test`.
- **Cierre:** Regla 4: el código duplicado de cada par se borra.

#### U11 — `torneo` y `escape_room` dentro del contrato
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U10 `hecho`. Empieza con un **relevamiento** (qué ramas de `slide-renderer.tsx` y qué hooks de socket hay); puede cerrarse sin migrar si el solape con el motor de interacción o el costo lo desaconsejan.
- **Alcance (provisional):** `lumina-frontend/src/components/viewers/{torneo,escape-room}-viewer.tsx`, `components/editor/activities/`, `hooks/use-escape-room-session.ts`, `slide-renderer.tsx` (solo las ramas `torneo`/`escape_room`), `packages/element-kit/src/elements/`. **NO** toca el backend ni los gateways.
- **Entregable:** ambas como `ElementDefinition` registradas con `ElementRegistry.registrar()`, sin ramas especiales en `slide-renderer.tsx`; el socket llega por `ElementRuntimeConfig`/config tipada (no por el kit importando del frontend). Verificación: tests del kit y del frontend; prueba manual documentada de una sesión en vivo.
- **Cierre:** Regla 4: se borran las ramas manuales de `slide-renderer.tsx`.

#### U12 — Producción: importar, previsualizar como alumno y validar
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** U10 `hecho`.
- **Alcance (provisional):** utilidades de importación (pegar lista / CSV → ítems, pares, palabras, preguntas) en `activities/_shared/`, vista previa «como alumno» en el panel de la actividad, y validación en el editor (aviso si la configuración no se puede jugar: sin pares, sin respuesta correcta, grilla imposible). Punto de enganche para generación con IA (etapa J) **solo como interfaz**, sin implementarla.
- **Entregable:** importador con tests por tipo, validador puro por tipo con tests, vista previa. Verificación: tests del kit y `test:visual`.
- **Cierre:** n/a.

#### U13 — Catálogo nuevo: relevamiento y fichas
- **Operador:** Claude Code (redacta) · Cursor/Antigravity (ejecutan luego)
- **Estado:** pendiente
- **Precondición:** U10 `hecho`.
- **Alcance:** solo `docs/tablero/etapa-U.md` (agregar fichas `U14+`). **NO** escribe código.
- **Entregable:** del insumo de abajo, elegir con el dueño la primera tanda (3–5), y por cada una una ficha completa: `ElementDefinition` desde cero (Regla 3), clase de scoring declarada (`binary`/`partial`/`manual`/`participation`) y, si es `partial`/`binary`, su evaluador en `@lumina/scoring` con fixtures (DU7 permite **agregar**, no cambiar lo existente), dependencias nuevas con carga diferida (DU5), `presets` y prueba propia.
- **Cierre:** n/a.

---

### Insumo para U13 (propuestas, no son fichas)

Agrupadas por taxonomía de Bloom. Clase de scoring entre paréntesis. Las de «Crear» serían `manual`, camino que el gradebook ya tiene.

- **Recordar:** tarjetas de estudio con repetición espaciada (`participation`, `ts-fsrs`); etiquetar imagen — anatomía, mapas, circuitos (`partial`, `react-konva` diferido); línea de tiempo para ordenar eventos (`partial`, reutiliza el motor de ordenar).
- **Comprender:** relacionar columnas con líneas (`partial`); V/F con justificación (`partial`/`manual`); cloze con banco de palabras (`partial`, extiende completar blancos).
- **Aplicar:** problema paso a paso con pistas escalonadas, matemática y física (`partial`, usa `@lumina/scoring/algebra`); laboratorio con parámetros sobre `@lumina/chemistry`/`@lumina/charts` (`partial`); ordenar y completar código tipo Parsons (`partial`, CodeMirror 6 diferido); conversión de unidades (`binary`).
- **Analizar:** interpretación de gráficos con preguntas (`partial`, sobre `@lumina/charts`); subrayar evidencia en un texto (`partial`); causa y efecto con mapa a completar (`partial`, `@xyflow/react` ya está).
- **Evaluar:** rúbrica de autoevaluación/coevaluación (`manual`); clasificar fuentes confiables (`partial`); argumento a favor y en contra (`manual`).
- **Crear:** construir un mapa conceptual (`manual`); redacción con rúbrica (`manual`); grabar respuesta oral (`manual`, `MediaRecorder` nativo); diagrama libre (`manual`).
- **Clase en vivo / gamificación:** carrera por equipos; bingo académico; Jeopardy por categorías (`exclude`/`participation` según el caso; dependen de U11).

Librerías candidatas (todas con carga diferida y declaradas en el `package.json` del kit): `ts-fsrs` (repetición espaciada), `react-konva` (etiquetar imagen), `mathlive` (entrada matemática), CodeMirror 6 (código), `fastest-levenshtein`/`fuse.js` (respuesta corta tolerante), `lottie-react` (mascota/feedback, solo si se justifica frente a `motion`), PixiJS (solo si el motor Arcade lo exige). Verificar que cada versión elegida tenga al menos dos semanas de publicada.
