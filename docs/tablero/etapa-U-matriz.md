# Etapa U — Matriz de auditoría de actividades (U0)

> Insumo de la ficha **U0** (`etapa-U.md`). Es medición, no reglas (Regla 8). Generada el 2026-10-11 sobre `packages/element-kit/src/activities/` y `elements/`. Los conteos son **ocurrencias** (no líneas) en archivos `.ts/.tsx` de cada actividad, sin specs; el CSS se cuenta aparte. Los números de la ficha raíz de U se **corrigen aquí** donde difieren (sección «Correcciones a la ficha raíz»).

## 1. Matriz

Columnas: **arch** = archivos de la actividad · **loc** = líneas `.ts/.tsx` · **hex** = colores `#rgb/#rrggbb` en `.ts/.tsx` (incluye clases Tailwind arbitrarias) · **css#** = hex en `.css` · **aria** = `aria-*` + `role=` · **kb** = `KeyboardSensor` · **sTO/sInt/raf** = `setTimeout(` / `setInterval(` / `requestAnimationFrame` · **rnd** = `Math.random` · **¬uni** = barajado sesgado `sort(() => Math.random() - 0.5)` · **Ovl/Tmr/Liv** = referencias a `ActivityResultOverlay`/`ActivityTimer`/`ActivityLives` (import + uso) · **snd** = referencias a `useSound` (import + uso) · **cb** = callback del adaptador · **prop** = prop de datos del viewer legacy · **apar** = `apariencia` color/tipografía/animación declarada `true` (C/T/A; `-` = false) · **parid** = prueba de paridad (propio = `elements/<tipo>/*.parity.spec`; agregado = `clasicas.parity.spec.tsx`) · **ev** = declara `eventos` · **pre** = declara `presets`.

| tipo | arch | loc | hex | css# | aria | kb | sTO | sInt | raf | rnd | ¬uni | Ovl | Tmr | Liv | snd | cb | prop | apar | parid | ev | pre |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|---|---|---|---|---|
| `quiz_multiple` | 9 | 2858 | 162 | 0 | 9 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | onResponse | activity | -/-/- | agregado | sí | no |
| `verdadero_falso` | 1 | 417 | 49 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | sí | no |
| `short_answer` | 1 | 266 | 19 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | no | no |
| `respuesta_matematica` | 1 | 373 | 22 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | sí | no |
| `completar_blancos` | 1 | 332 | 19 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | sí | no |
| `arrastrar_soltar` | 1 | 571 | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | sí | no |
| `emparejar` | 7 | 563 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 2 | onResponse | actividad | -/-/- | agregado | sí | no |
| `ordenar_pasos` | 1 | 449 | 28 | 0 | 1 | 2 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | sí | no |
| `video_interactivo` | 10 | 1557 | 43 | 0 | 3 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | no | no |
| `encuesta_viva` | 1 | 476 | 37 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | no | no |
| `nube_palabras` | 1 | 307 | 19 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | onResponse | activity | -/-/- | agregado | no | no |
| `balancear_ecuacion`¹ | 1 | 423 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | onResponse | activity | -/-/- | no | sí | no |
| `ubicar_elemento`¹ | 1 | 423 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | onResponse | activity | -/-/- | no | sí | no |
| `formular_compuesto`¹ | 1 | 423 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | onResponse | activity | -/-/- | no | sí | no |
| `clasificar` | 7 | 561 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `memoria` | 8 | 668 | 8 | 0 | 0 | 0 | 2 | 2 | 0 | 2 | 1 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `puzzle_imagen` | 7 | 708 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `sopa_letras` | 8 | 683 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `crucigrama` | 8 | 782 | 15 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `anagrama` | 7 | 541 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `ahorcado` | 8 | 677 | 17 | 40 | 8 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `puzzle_palabras` | 7 | 524 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `abrir_caja` | 8 | 817 | 6 | 1 | 3 | 0 | 2 | 0 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `globos` | 8 | 804 | 16 | 1 | 0 | 0 | 3 | 1 | 2 | 5 | 1 | 2 | 2 | 2 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `topo` | 8 | 736 | 3 | 4 | 1 | 0 | 5 | 1 | 0 | 2 | 0 | 2 | 2 | 2 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| `historia_ramificada` | 8 | 793 | 14 | 0 | 0 | 0 | 2 | 0 | 0 | 3 | 0 | 2 | 0 | 0 | 0 | onComplete | actividad | -/-/- | propio | sí | no |
| **Total** (química contada una vez) | 127 | 16886 | 587 | 46 | 38 | 4 | 16 | 5 | 2 | 29 | 8 | 24 | 4 | 4 | 29 | | | | | | |

¹ `balancear_ecuacion`, `ubicar_elemento` y `formular_compuesto` comparten **un solo archivo** (`activities/chemistry/chemistry-activities.tsx`); sus cifras se repiten y el total la cuenta una vez. Sin `parid` propio en `elements/` (re-verificar en la ficha que migre química).

## 2. Lectura de la matriz

- **Dos contratos, partidos exactamente por familia.** Las 14 clásicas usan `onResponse` y `activity` (menos `emparejar`: `actividad`); las 12 del Grupo 4 usan `onComplete` y `actividad`. No hay una sola actividad mixta.
- **`ActivityResultOverlay` solo lo usa el Grupo 4** (12/12). Ninguna clásica lo usa: cada una resuelve su resultado en línea. `ActivityTimer` y `ActivityLives` los usan **solo `globos` y `topo`**; `memoria` pinta su cronómetro como texto propio.
- **`useSound`: las 14 clásicas sí, el Grupo 4 no** (0/12). Ninguna usa `motion` ni respeta `prefers-reduced-motion`.
- **`apariencia` es `{color:false, tipografia:false, animacion:false}` en las 26.** Ninguna declara `presets` (la etapa T los dejó en los widgets; las actividades no tienen galería de estilos). `eventos` falta en `short_answer`, `video_interactivo`, `encuesta_viva` y `nube_palabras`.
- **Hex:** el peso está en las clásicas (`quiz_multiple` 162, `verdadero_falso` 49, `video_interactivo` 43, `arrastrar_soltar` 40, `encuesta_viva` 37); el Grupo 4 tiene entre 2 y 17. La guarda de U1 arranca con todas ellas como exentas.
- **Teclado:** `KeyboardSensor` solo aparece en `quiz_multiple` (2) y `ordenar_pasos` (2). `clasificar`, `arrastrar_soltar`, `puzzle_imagen`, `puzzle_palabras`, `anagrama` y `emparejar` no lo declaran.
- **Tiempo:** 16 `setTimeout`, 5 `setInterval` y 2 `requestAnimationFrame` (todos en `globos`). Los 5 intervalos son `memoria` (2), `video_interactivo`, `globos` y `topo`.
- **Azar:** 29 `Math.random` en `.ts/.tsx` de actividades. De ellos: **8 barajados sesgados** (`¬uni`: `emparejar`, `ordenar_pasos`, `clasificar`, `memoria`, `sopa_letras`, `anagrama`, `puzzle_palabras`, `globos`), **3 Fisher–Yates correctos** (`topo`, `puzzle_imagen`, `globos`), **9 generadores de id** `Date.now()+random` (`generarId*` en los `*-config.ts`), y el resto son posiciones de globos/topo, letras de relleno y colocación de palabras en la sopa de letras.
- **Editor de las 12 del Grupo 4:** el adaptador monta `<Legacy…Editor actividad={estado} />` **sin pasar `onChange`**; la edición real ocurre por `Propiedades`. En las 14 clásicas, `Propiedades` es el mismo Editor.
- **Cobertura de paridad:** las 12 del Grupo 4 tienen spec propia; 10 clásicas comparten `clasicas.parity.spec.tsx`; **química (3) no tiene**.

## 3. Hallazgos nuevos (no estaban en la ficha raíz)

1. **CONFIRMADO con `next build` real: `@lumina/element-kit` no está en los `@source` de Tailwind y el CSS de producción pierde clases de las actividades.** `lumina-frontend/src/styles/globals.css` solo declara `@source` para `@lumina/ui` y `@lumina/editor-shared`; Tailwind v4 escanea `lumina-frontend/` y no `node_modules`, y el kit llega como dependencia del workspace. Medición (2026-10-11): se corrió `next build` y se comparó el CSS emitido (`.next/static/css/*.css`, 427 KB) contra el CSS compilado con el mismo `globals.css` **más** `@source "../../../packages/element-kit/src"`. Resultado: **256 clases válidas faltan en el build real**, de las cuales **122 se usan en `activities/`** (+ 46 en `widgets/`, 54 en `blocks/`, 6 en `elements/`; conteo por token exacto en `.tsx` sin specs). Ejemplos que afectan al estado visible de una actividad: `text-green-500`, `text-green-600`, `border-green-400`, `border-red-400`, `bg-green-100`, `bg-red-500`, `bg-purple-100`, `min-w-[260px]`, `hover:bg-blue-600`. En el build real **no existe** `.text-green-500` ni `.border-green-400` (sí `.bg-green-50`, `.rounded-2xl`, `.text-green-700`: las repite algún archivo escaneado). Consecuencia: el overlay de resultado muestra la nota sin su color verde/rojo y V/F pierde el borde de acierto/error, **también en producción**.
   - Por actividad (clases distintas ausentes): `quiz-option-layouts` 25, `video-interactive` 24, `drag-drop` 19, `true-false` 17, `anagrama` 17, `puzzle-palabras` 16, `quiz-multiple` 14, `historia-ramificada` 10, `emparejar` 10, `fill-blanks` 9, `word-cloud` 8, `short-answer` 8, `quiz-synced-viewer` 8, `quiz-multiple-editor` 8, `crucigrama` 8, `clasificar` 8; el resto, entre 1 y 7. `_shared` 5.
   - **Matiz de método:** una compilación suelta con `@tailwindcss/postcss` fuera de Next daba falsos «presentes» (p. ej. `text-green-500`); el criterio válido es el CSS del `next build`. El entorno de pruebas visuales coincide con el build real.
   - **Alcance fuera de U:** también afecta a widgets y bloques (46 + 54 clases). La corrección (`@source` para el kit en `globals.css`, o mover esos estilos a CSS Modules) **no está en el alcance de U0** y toca `lumina-frontend/src/styles/globals.css`; falta decidir qué ficha la lleva (candidata: U1, o una `X.n` previa). La línea base de U0 declara el `@source` en `actividades-visual.css` para fotografiar el diseño **previsto**, que **no** es lo que hoy ve el alumno en producción.
2. **Layout roto a 640×420.** `clasificar` superpone los ítems con las cabeceras de categoría; en `globos` los globos se montan sobre la barra de la pregunta. A este tamaño al menos, ambos tienen problemas de altura (a verificar a otros tamaños en U9b/U9d).
3. **El Grupo 4 nace con ids no deterministas** (`Date.now()+Math.random()` en 9 `generarId*`), sin relación con el barajado: no afecta a U7, pero impide fixtures con ids estables si algún día se generan en runtime.
4. **`globos` es la única actividad que depende del reloj** (2 `requestAnimationFrame` + intervalo + 3 `setTimeout`): para fotografiarla hubo que congelar `requestAnimationFrame`/`setInterval` (`congelarTiempo`).

## 4. Correcciones a la ficha raíz de U

- «~15 `setTimeout` en los viewers» → **16** `setTimeout(` en `.ts/.tsx` de actividades (+ 5 `setInterval`, 2 `requestAnimationFrame`).
- «11 `Math.random` en viewers» → eran las líneas de `.tsx`; **29 en `.ts/.tsx`** (ver clasificación arriba). Los 8 `sort(random)` son ocho, pero **3 viven en `*-config.ts`** (`puzzle_palabras`, `anagrama`, `sopa_letras`), no en el viewer.
- «hex a pelo… `quiz-option-layouts` 36, `drag-drop` 30, `video-interactive` 30, `true-false` 29, `live-poll` 28» eran **líneas** con hex en archivos sueltos; por actividad (ocurrencias, todo el directorio) el orden es `quiz_multiple` 162, `verdadero_falso` 49, `video_interactivo` 43, `arrastrar_soltar` 40, `encuesta_viva` 37.
- «`ActivityTimer`/`ActivityLives` usados de forma inconsistente» → los usan **solo 2** actividades (`globos`, `topo`).
- «`useSound` lo usan 13 actividades» → **14 clásicas** (las 3 de química comparten el archivo).
- «`KeyboardSensor` en pocos lugares» → exactamente **2** actividades (`quiz_multiple`, `ordenar_pasos`).
- «0 menciones de `prefers-reduced-motion`» → confirmado (0) en las 26; **0** imports de `motion`.

## 5. Línea base visual

`lumina-frontend/src/visual-tests/actividades-base.visual.spec.tsx` (+ `actividades-fixture.tsx`, `actividades-visual.css`): 30 pruebas = 1 de registry (las 26 están) + 26 estados iniciales + 2 del overlay de resultado compartido (aprobado/reprobado) + `verdadero_falso` tras responder. 29 PNG en `__screenshots__/actividades-base.visual.spec.tsx/` (solo `chromium-linux`, 640×420). `Math.random` sembrado (mulberry32), `requestAnimationFrame` y `setInterval` congelados, `setTimeout` intacto, sin animaciones ni transiciones, viewport 680×460.

**Limitaciones conocidas (no son errores):**
- Se fotografía el estado inicial con el contenido de `crearPorDefecto()` (placeholders: «Nueva pregunta», «Opción A»…), no actividades «llenas». Las fichas U9 pueden agregar fixtures con contenido real.
- Los estados de resultado propios de cada actividad no se capturan: solo el overlay compartido. El resto lo cubrirá cada ficha U9 al migrar.
- `puzzle_imagen` y `video_interactivo` se capturan en su estado «sin imagen / sin video» (no hay red).
- Solo `chromium-linux`; en otra plataforma/navegador la primera corrida crea la referencia y falla («No existing reference screenshot»), la segunda pasa.

**Regenerar:** `pnpm --filter lumina-frontend test:visual:update`.
