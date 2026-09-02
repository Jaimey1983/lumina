# Extracción Materialize → Polish de Actividades (Fase 4)

> Generado: 01/09/2026
> Alcance: **solo revisión**. No se modificó ningún archivo de `lumina-frontend` /
> `lumina-backend` ni se instaló ninguna dependencia. Este documento mapea qué
> patrones visuales de la plantilla **Materialize Pixinvent (TypeScript)** sirven
> para terminar el polish de las 5 actividades pendientes de Fase 4, y cómo se
> traducirían al sistema de diseño que Lumina ya tiene.
>
> Carpeta revisada: `nextjs-version/typescript-version/full-version`
> Stack de la plantilla: **MUI 7 + Emotion + Tailwind 4 (utilidades) + react-hook-form 7 +
> react-toastify 11 + @formkit/drag-and-drop 0.5 + ApexCharts**.
> Stack de Lumina: **Radix/shadcn + Tailwind 4 + dnd-kit + Sonner + Motion + lucide**.
>
> ⚠️ **No hay reutilización de código directa.** La plantilla es MUI; Lumina es
> Tailwind/shadcn. Todo lo de abajo es extracción de *lenguaje visual* (estados,
> jerarquía, color, radios, feedback), no de componentes. La dirección visual ya
> validada (fondo blanco, tipografía grande, entrada escalonada `index * 60ms`,
> feedback animado) se mantiene: en varios puntos la conclusión es *"Lumina ya lo
> resuelve mejor, no traer nada de Materialize"*.

---

## Referencias de Lumina usadas como base

| Qué | Ruta |
|---|---|
| Actividades YA pulidas (dirección objetivo) | [quiz-multiple.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/quiz-multiple.tsx), [true-false.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/true-false.tsx) |
| Tokens de diseño (extraídos de Materialize) | [tailwind.config.ts](lumina-frontend/tailwind.config.ts) |
| Keyframes de feedback y entrada | [styles/globals.css](lumina-frontend/src/styles/globals.css) (`lumina-viewer-shake`, `lumina-block-in`), [styles/lumina-animations.css](lumina-frontend/src/styles/lumina-animations.css) |
| Sonido de feedback | `useSound()` → `play('correct' | 'wrong' | 'submit')` |

### Patrón de feedback que YA usan quiz-multiple / true-false (el objetivo)

Al enviar (`answered && hasDefinedCorrect`), cada opción pasa a uno de estos estados:

- **Acierto seleccionado** → `border-[#16a34a] bg-[#dcfce7] text-[#16a34a]` + `animate-in zoom-in-95 duration-300` + `<CheckCircle2 className="text-[#16A34A]">`.
- **Error seleccionado** → `border-[#f87171] bg-[#fee2e2] text-[#f87171]` + `lumina-viewer-shake` + `<XCircle className="text-[#DC2626]">`.
- **Revelar la correcta no elegida** → mismo verde, opacidad plena, `CheckCircle2`.
- **Resto** → `opacity-40 / 50`.
- Variante `dark`: mismos roles con `green-500/30`, `red-500/30`, `border-*-400`.

**Las 5 pendientes NO tienen este estado**: todas terminan en un genérico
`bg-green-50 text-green-800` "✓ ¡Respuesta enviada!" sin distinguir acierto/error
por elemento, sin animación de entrada y sin `zoom-in` / `shake`.

---

## Patrones transversales (feedback, animación, cards)

### 1. Tarjeta seleccionable con estados (base para emparejar, drag-drop, opciones)

**Plantilla:** `src/@core/components/custom-inputs/Vertical.tsx`, `Horizontal.tsx`,
`Image.tsx`, `types.ts`
(`src/@core/components/custom-inputs/`).

Es el componente `CustomInputVertical` / `CustomInputHorizontal`: una tarjeta
clicable con `border: 1px solid inputBorder`, `borderRadius: var(--mui-shape-borderRadius)` (10px),
y tres estados por clase:

```
base      → borderColor: inputBorder            (gris neutro)
:hover    → borderColor: action.active          (gris más oscuro)
.active   → borderColor: primary.main + iconos primary   (selección)
transition: border-color, theme.transitions.duration.shorter (~200ms)
```

- El estado se resuelve con `classnames({ active: selected === value })` — mismo
  patrón que el `cn()` de Lumina.
- La selección **solo cambia el borde y el color del icono**, no el fondo. Lumina
  hoy sí rellena el fondo (`bg-[#dbeafe]`); es una decisión a conservar o alinear.
- El radio/checkbox real vive dentro de la tarjeta (accesibilidad) — Lumina usa
  `<button>` sin input; conviene mantener el `<button>` pero copiar la idea de
  "borde = estado, transición corta solo en `border-color`".

**Por qué aplica:** da un vocabulario único de estados (base / hover / activo)
para las tres actividades de selección (emparejar, drag-drop, y cualquier opción
en cuadrícula). Es exactamente lo que quiz-multiple ya hace a mano; formaliza el
patrón sin traer MUI.

**Traducción a Lumina:**
`border-[#e5e7eb]` (base) · `hover:border-[#94a3b8]` o el actual `hover:border-[#2563EB]/50` ·
`border-[#2563EB]` (activo) · `transition-colors duration-200`. Sin librería.

---

### 2. Estados de validación en campos de formulario (base para fill-blanks y short-answer)

**Plantilla:** `src/views/forms/form-validation/FormValidationBasic.tsx`,
`FormValidationAsyncSubmit.tsx`, `FormValidationSchema.tsx` +
override `src/@core/theme/overrides/input.ts`.

Patrón MUI: `<TextField error helperText="...">`. Al fallar la validación:

- El borde del input pasa a `error.main` (rojo) y la etiqueta y el `helperText`
  también. No hay estado "success" visual por defecto en los inputs de texto
  (Materialize solo marca error); el "ok" se comunica con el `toast.success`
  al enviar.
- `FormValidationAsyncSubmit.tsx`: el botón de envío muestra
  `<CircularProgress size={20} color='inherit' />` **dentro** del botón mientras
  `loading` — patrón de "enviando…" reutilizable para short-answer.
- Radios/checkbox en grupo: `<FormControl error>` propaga el rojo a todo el grupo
  + `<FormHelperText error>` debajo.

**Por qué aplica:**
- `fill-blanks`: hoy los `<input>` inline no cambian de color tras enviar. Falta
  el estado por-hueco correcto/incorrecto. Materialize da el patrón "borde
  semántico + texto de ayuda debajo".
- `short-answer`: ya tiene contador de caracteres; le falta el estado "enviando"
  y un cierre visual mejor que el genérico verde (es scoring `manual` → el
  feedback correcto es "pendiente de revisión del docente", no "correcto").

**Traducción a Lumina:**
- Hueco correcto → `border-[#16a34a] bg-[#dcfce7] text-[#166534]` + `CheckCircle2` inline.
- Hueco incorrecto → `border-[#f87171] bg-[#fee2e2] text-[#991b1b]` + `lumina-viewer-shake`,
  y (si `mostrarRespuesta`) la respuesta esperada en `text-[11px] text-[#6b7280]` debajo del párrafo.
- Botón "Enviar" con spinner: `<Loader2 className="size-4 animate-spin" />` de lucide
  (Lumina ya depende de lucide y `tailwindcss-animate`), sin `CircularProgress`.
- short-answer al enviar → caja **neutra/informativa** (`bg-[#eff6ff] text-[#1e3a8a]`
  + icono reloj) con texto "Respuesta enviada — la revisará tu docente", no verde de acierto.

---

### 3. Feedback: Alert / Chip tonal / toast

**Plantilla:**
- `src/@core/theme/overrides/alerts.tsx` — el `MuiAlert` de Materialize:
  `borderRadius: var(--mui-shape-customBorderRadius-lg)` (8px), `padding: 3 4`,
  `gap: 4`, icono en un cuadrito redondeado de `30×30` con fondo del color
  semántico. Variantes `standard` (fondo `lightOpacity` ~16%), `outlined`
  (borde `main` + icono `lightOpacity`), `filled`.
- `src/@core/theme/overrides/chip.ts` + uso en `src/views/apps/kanban/TaskCard.tsx`
  — `<Chip variant='tonal' color='success|error|info|warning' size='small'>`:
  fondo `color-lightOpacity`, texto `color-main`, `fontWeight: medium`,
  `typography.body2`. Es el "badge de éxito/error" pedido.
- `src/libs/styles/AppReactToastify.tsx` + `src/@core/theme/overrides/snackbar.ts`
  — configuración global de react-toastify (posición, tema, cierre). Materialize
  lanza `toast.success('...')` tras enviar formularios/wizards.

**Por qué aplica:** Lumina ya tiene **Sonner** (equivalente a react-toastify) y
cajas de feedback inline. Lo aprovechable es:
- La **escala tonal** de Materialize (`lightOpacity 0.16` de fondo + `main` de
  texto/borde) como fórmula fija para los badges "Correcto"/"Incorrecto" que
  quiz-multiple usa como chip verde (`bg-green-100 text-green-700`) — Materialize
  usaría `bg-green/16 text-green-600`. Alinear a un único par por color.
- El **cuadrito de icono redondeado** del Alert (30×30, radio `lg`, fondo del
  color) como remate del feedback final de cada actividad, en lugar del `<span>✓</span>`
  suelto que usan las 5 pendientes.

**Traducción a Lumina:**
- Badge de estado: `rounded-lumina-sm px-2 py-0.5 text-[10px] font-semibold` con
  par fijo `bg-[#dcfce7] text-[#16a34a]` (ok) / `bg-[#fee2e2] text-[#dc2626]` (error).
- Feedback final: caja `rounded-lumina-lg p-4 flex gap-3` con icono en
  `flex size-8 items-center justify-center rounded-lumina-lg bg-[#16a34a]/15 text-[#16a34a]`.
- Toast solo para eventos fuera del cuerpo de la actividad (guardado, error de
  red); el resultado de la actividad va **inline**, como hoy.

---

### 4. Animación / transición / entrada escalonada

**Hallazgo:** la plantilla **no tiene** keyframes propios de entrada ni stagger.
Materialize se apoya en:
- `theme.transitions.create(['border-color'], { duration: shorter })` para hovers
  (≈150–200ms) — visible en `custom-inputs/Vertical.tsx`, `Horizontal.tsx`.
- Componentes de transición de MUI (`Collapse`, `Grow`, `Fade`) para montar/desmontar.
- `@formkit/drag-and-drop` → plugin `animations()` para el reordenamiento suave
  del kanban (`src/views/apps/kanban/KanbanBoard.tsx`).

**Conclusión:** para la **entrada escalonada** (`animationDelay: index * 60ms`) y
el feedback animado, **Lumina ya está por delante** con `lumina-block-in`,
`lumina-animations.css` y `animate-in zoom-in-95` / `lumina-viewer-shake`. No hay
nada que extraer aquí salvo la **duración de las transiciones de hover/estado**
(≈200ms, `ease`) para unificar las 5 actividades con quiz-multiple.

**Traducción a Lumina:** aplicar a las 5 pendientes lo que quiz-multiple ya hace:
`transition-colors` en cada elemento interactivo, y en el contenedor de la lista
un `[&>*]:animate-[lumina-block-in_.28s_ease_both]` con
`style={{ animationDelay: `${i * 60}ms` }}` por hijo. Es patrón interno, no de Materialize.

---

### 5. Sistema de elevación, radios y cards

**Plantilla:**
- `src/@core/theme/index.ts` → `shape.customBorderRadius = { xs:2, sm:4, md:6, lg:8, xl:10 }`.
- `src/@core/theme/customShadows.ts` → `xs: 0px 2px 6px rgb(shadowChannel / 0.14)`,
  `sm: …/0.16`, `md: 0px 4px 14px …/0.16`, `lg: 0px 6px 20px …/0.18`, `xl: 0px 8px 26px …/0.18`.
- `src/@core/theme/overrides/card.ts` → `MuiCard` no-outlined lleva
  `boxShadow: var(--mui-customShadows-md)`; `CardContent`/`CardHeader` padding `spacing(5)` (20px).
- `src/@core/theme/overrides/colorSchemes.ts` → escala de opacidad semántica fija:
  `lighterOpacity 0.08 · lightOpacity 0.16 · mainOpacity 0.24`.

**Por qué aplica:** Lumina **ya adoptó esto** casi 1:1:
`borderRadius lumina-xs 2 / sm 4 / md 6 / lg 10 / xl 12 / 2xl 16` y
`boxShadow lumina-xs 0px 2px 6px rgba(0,0,0,.07) … lumina-lg 0px 6px 20px rgba(0,0,0,.1)`.
Geometría idéntica; Lumina cambió el tinte (usa `rgba(0,0,0, …)` neutro en vez del
`mainColorChannels` azulado de Materialize) y bajó un punto la opacidad.

**Divergencias a tener en cuenta al pulir (no "arreglar", solo saber):**

| Token | Materialize | Lumina | Nota |
|---|---|---|---|
| radius `lg` | 8px | 10px | Lumina más redondeado |
| radius `xl` | 10px | 12px | idem |
| shadow tinte | azul (`38 43 67`) | negro neutro | Lumina mantiene "paleta neutra sin tinte" (decisión 21/07) |
| opacidad de estado | 0.08 / 0.16 / 0.24 | hex fijos (`#dbeafe`, `green-50`…) | ver nota de integración |

**Traducción a Lumina:** las tarjetas de actividad ya usan
`rounded-xl border border-[#e5e7eb] bg-white shadow-lumina-xs p-6` (quiz/true-false).
Las 5 pendientes también → **ya son consistentes en el contenedor**; el trabajo de
polish está *dentro*, no en el marco.

---

## fill-blanks

**Archivo Lumina:** [fill-blanks.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/fill-blanks.tsx)
(`FillBlanksViewer`). Scoring: `partial` (evalúa con `evaluateActivityResponse('completar_blancos', …)`).

**Estado actual:** el texto se parte por `{{blank:id}}` y cada hueco es un
`<input type="text">` inline (`h-8 w-24 rounded-md border`). Tras enviar: los
inputs quedan `disabled` y aparece la caja verde genérica. **No** se marca qué
hueco estuvo bien o mal, aunque el evaluador ya devuelve `correct`.

**Patrón en la plantilla:**
- `src/views/forms/form-validation/FormValidationBasic.tsx` — `TextField` inline
  con `error` + `helperText` (borde rojo + texto de ayuda debajo).
- `src/@core/theme/overrides/input.ts` — el borde del input es
  `customColors.inputBorder`; en `:hover` pasa a `action.active`; en `.Mui-error`
  a `error.main`. Radio de input pequeño = `customBorderRadius.md` (6px).
- No hay "input verde de acierto" en Materialize → hay que definirlo con la misma
  lógica de `error` pero en `success`.

**Cómo se adapta:**
1. `evaluateActivityResponse` puede devolver el detalle por hueco (o comparar
   `answers[id]` contra `activity.blancos.find(b=>b.id===id).respuesta` con la
   misma normalización del scoring). No reimplementar la fórmula — leer del
   evaluador.
2. Tras `answered`, cada `<input>` toma:
   - correcto → `border-[#16a34a] bg-[#dcfce7] text-[#166534]` + `CheckCircle2`
     `size-3.5` absoluto a la derecha del input.
   - incorrecto → `border-[#f87171] bg-[#fee2e2] text-[#991b1b]` +
     clase `lumina-viewer-shake` (una vez).
3. Debajo del párrafo, si `retroalimentacion?.mostrarRespuesta`, una línea
   `text-[11px] text-[#6b7280]` con "Respuestas: 100 · azul · …" (patrón
   `helperText` de Materialize, no un Alert entero).
4. Radio de los inputs: pasar de `rounded-md` a `rounded-lumina-md` (6px) para
   alinear con el `customBorderRadius.md` de la plantilla.
5. Entrada: envolver el párrafo y aplicar `animation-delay` por hueco solo si se
   quiere el efecto "los huecos aparecen en cascada" (opcional, patrón interno).

---

## order-steps

**Archivo Lumina:** [order-steps.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/order-steps.tsx)
(`OrderStepsViewer`). Scoring: `partial`. Ya usa **dnd-kit** (`SortableContext`,
`verticalListSortingStrategy`, `useSortable`) con `GripVertical` como handle y un
badge numérico `size-5 rounded-full bg-[#f3f4f6]` cuando `mostrarNumeros`.

**Estado actual:** funcional. Al enviar: caja verde genérica, **sin** marcar qué
pasos quedaron en la posición correcta.

**Patrón en la plantilla:**
- **Listas reordenables:** `src/views/apps/kanban/` (`KanbanBoard.tsx`,
  `KanbanList.tsx`, `TaskCard.tsx`, `styles.module.css`). Usa
  `@formkit/drag-and-drop` con `plugins: [animations()]` y `dragHandle: '.list-handle'`.
  El handle se **oculta hasta el hover de la fila** (`styles.module.css`:
  `.kanbanColumn:hover .drag { display: block }`, `cursor: grab` / `:active
  grabbing`). La tarjeta arrastrable: `cursor-grab active:cursor-grabbing`,
  `overflow-visible`, `mbe-4`.
- **Indicadores de posición / número:** `src/views/forms/form-wizard/StepperVerticalWithNumbers.tsx`
  + `src/@core/styles/stepper.ts` + `src/components/stepper-dot/` (`index.tsx`,
  `styles.module.css`). El número de paso es `Typography.h4` con
  `marginInlineEnd: spacing(2)`, formateado `0${index+1}`. El "dot":
  círculo `20×20`, `border 3px`, base `primary.lightOpacity`; **activo** →
  `border 5px primary.main` + fondo `background.paper`; **completado** →
  relleno `primary.main` + `<i ri-check-line>` blanco.
- Conector entre pasos: `border-inline-start 3px`, se pinta `primary.main` en
  `.Mui-active, .Mui-completed`.

**Cómo se adapta (manteniendo dnd-kit, sin traer @formkit):**
1. **Drag handle en hover:** hoy el `GripVertical` está siempre visible en
   `text-[#9ca3af]`. Copiar el patrón kanban: `opacity-0 group-hover:opacity-100
   transition-opacity` en la fila (`group`), `cursor-grab active:cursor-grabbing`.
   Mientras `isDragging` (dnd-kit ya lo da) mantener el handle visible.
2. **Número de posición estilo stepper:** cambiar el badge plano por el "dot"
   de Materialize:
   - en reposo → `size-6 rounded-full border-2 border-[#2563EB]/16 text-[#2563EB] text-xs font-semibold`
   - tras enviar, si la posición es correcta → relleno `bg-[#16a34a] border-[#16a34a] text-white` con `<Check className="size-3.5">`
   - tras enviar, si es incorrecta → `bg-[#fee2e2] border-[#f87171] text-[#dc2626]` con el número real / la posición esperada.
3. **Conector vertical** (opcional, alto valor visual): una línea
   `border-l-2 border-[#e5e7eb]` entre filas que se vuelve `border-[#16a34a]`
   en el tramo de pasos ya correctos — es el `MuiStepConnector` de
   `stepper.ts` traducido.
4. Fila arrastrándose: hoy `opacity-50 ring-2 ring-[#2563EB]`. Añadir
   `shadow-lumina-md` y `scale-[1.01]` para el "se despega" del kanban
   (`overflow-visible` + sombra).
5. Feedback final: sustituir la caja verde por el patrón transversal §3
   (badge X/N correctos + icono en cuadrito redondeado).

---

## emparejar

**Archivo Lumina:** [emparejar-viewer.tsx](lumina-frontend/src/components/activities/emparejar/emparejar-viewer.tsx)
(`match-pairs.tsx` es solo re-export — **no tocar**). Scoring: `partial`.

**Estado actual:** dos columnas; se hace clic en un ítem izquierdo (queda
`selected` con `ring-1 ring-[#2563EB] bg-[#dbeafe]`), luego en uno derecho → se
crea el match y ambos muestran un badge numérico `size-5 rounded-full bg-[#2563EB]
text-white` (número de conexión). Botón Enviar deshabilitado hasta emparejar
todo. Al enviar: caja verde genérica; **no** se colorea par correcto vs
incorrecto.

**Patrón en la plantilla:**
- **Tarjetas emparejables / estados de selección:** `src/@core/components/custom-inputs/Horizontal.tsx`
  (§ transversal 1) — `border` = estado, `hover` gris, `.active` = borde
  `primary.main` + icono `primary`. Es exactamente el modelo "tarjeta que se
  ilumina al seleccionar".
- **Par correcto / incorrecto:** no existe como componente en la plantilla; se
  compone con la escala semántica de `colorSchemes.ts` (`success.lightOpacity` /
  `error.lightOpacity` de fondo, `success.main` / `error.main` de borde) — la
  misma que Materialize usa en `Chip variant='tonal'` (`chip.ts`,
  `TaskCard.tsx`) y en `alerts.tsx`.
- **Conector visual de par:** Materialize no dibuja líneas entre columnas; el
  número de vínculo (como hace Lumina) es el patrón equivalente y suficiente.

**Cómo se adapta:**
1. Selección del lado izquierdo: alinear al `Horizontal.tsx` — que el estado
   `isSelected` sea **borde + anillo**, no relleno pleno; `transition-colors
   duration-200`. (Hoy ya es cercano: `ring-1 ring-[#2563EB] bg-[#dbeafe]`.)
2. Tras `answered`, para cada par `m` (recorriendo `matches`):
   - `m.leftId === m.rightId` (correcto) → **ambas** tarjetas del par:
     `border-[#16a34a] bg-[#dcfce7] text-[#166534]`, badge numérico
     `bg-[#16a34a]`, `animate-in zoom-in-95 duration-300`.
   - incorrecto → `border-[#f87171] bg-[#fee2e2] text-[#991b1b]`, badge
     `bg-[#dc2626]`, `lumina-viewer-shake`; y (si procede) resaltar en verde
     tenue el ítem derecho que **sí** correspondía (`border-[#16a34a]/40
     bg-[#dcfce7]/50`, patrón "revelar correcta" de quiz-multiple).
3. Badge de conexión: mantener el número, pero radio y tamaño desde token
   (`rounded-full`, `text-[10px]`) y color según estado (azul en progreso,
   verde/rojo tras enviar).
4. Ítems con imagen (`ladoTieneImagen`): mantener `min-h-[64px]`; el borde de
   estado aplica igual (no cambia por ser imagen).
5. Feedback final: patrón transversal §3.
6. Variante `dark`: reusar los roles `green-500/30` · `red-500/30` ·
   `border-*-400` de quiz-multiple.

---

## drag-drop

**Archivo Lumina:** [drag-drop.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/drag-drop.tsx)
(`ViewerView` dentro). Scoring: `partial` (emite draft con `wrapActivityDraftResponse`).

**Estado actual:** HTML5 drag nativo (`draggable`, `onDragStart/Over/Drop`,
`dataTransfer`). Pool de "elementos disponibles" arriba (`border-2 border-dashed`)
y zonas destino en grid (`border-2 border-dashed`). Mientras `dragging`: pool y
zonas pasan a `border-[#2563EB]/50 bg-[#dbeafe]`. **`zoneCorrect` / `zoneWrong`
están hardcodeados a `false`** → el feedback por zona está literalmente sin
implementar. Al enviar: caja verde genérica.

**Patrón en la plantilla:**
- **Dropzones / hover / dragging:** `src/views/apps/kanban/` — con
  `@formkit/drag-and-drop` + `animations()`. El "hueco" de destino se anima
  (plugin `animations`), el handle es `.list-handle` visible en hover
  (`styles.module.css`), la tarjeta `cursor-grab active:cursor-grabbing`
  `overflow-visible`. No usa `border-dashed`; usa la animación de reflow para
  comunicar "aquí cae".
- **Tarjeta arrastrable:** `TaskCard.tsx` — `Card` con
  `boxShadow: customShadows.md` en reposo, `cursor-grab`; chips `variant='tonal'`
  para las etiquetas.
- **Zona correcta/incorrecta:** de nuevo, se compondría con `success/error
  lightOpacity` (fondo) + `main` (borde), igual que Alert/Chip.

> Nota: Lumina usa dnd nativo aquí y **dnd-kit** en order-steps. `@formkit/drag-and-drop`
> de la plantilla no se adopta (dependencia nueva, prohibido). Solo se extrae el
> *look* de dropzone y tarjeta.

**Cómo se adapta:**
1. **Tarjeta arrastrable** (item en pool y en zona): añadir el remate de
   `TaskCard` — `shadow-lumina-xs` en reposo, `shadow-lumina-md` +
   `scale-[1.02]` mientras `dragging === item.id` (hoy solo hace `opacity-40`),
   `cursor-grab active:cursor-grabbing` (ya está).
2. **Dropzone:**
   - reposo → `border border-[#e5e7eb] bg-[#f9fafb]` (bajar de `border-2
     border-dashed` a borde sólido fino tipo card — más "Materialize", menos
     "wireframe"); mantener `border-dashed` solo como señal de "vacía / esperando".
   - `dragging` activo → `border-[#2563EB] bg-[#2563EB]/8` (usar la opacidad
     0.08 = `lighterOpacity` de la plantilla, más sutil que el `#dbeafe` actual)
     + `ring-1 ring-[#2563EB]/30`.
   - la zona bajo el cursor (`onDragOver` sobre esa zona concreta) → un punto más
     de énfasis: `bg-[#2563EB]/16` (`lightOpacity`). Hoy todas las zonas
     reaccionan igual mientras se arrastra; diferenciar la que está debajo.
3. **Implementar el feedback por zona** (hoy `false`):
   - tras `answered`, comparar `placements[itemId]` con `zona.itemsCorrectos`.
   - zona con todo correcto → `border-[#16a34a] bg-[#dcfce7]` + `<CheckCircle
     className="text-[#16a34a]">` junto a `zone.etiqueta` (el bloque ya existe,
     solo está tras `zoneCorrect`).
   - zona con algún error → `border-[#f87171] bg-[#fee2e2]` + `<XCircle>`.
   - cada **item** dentro de la zona también toma su color (verde/rojo) y un
     icono `size-3` — granularidad de quiz-multiple.
4. **Pool tras enviar:** si quedan ítems sin colocar, marcarlos `border-[#f87171]`
   (incompleto = error) en vez de neutro.
5. Entrada escalonada de los ítems del pool (`index * 60ms`, patrón interno).
6. Feedback final: patrón transversal §3.

---

## short-answer

**Archivo Lumina:** [short-answer.tsx](lumina-frontend/src/app/(app)/classes/[id]/editor/components/activities/short-answer.tsx)
(`ShortAnswerViewer`). Scoring: **`manual`** — solo entra al promedio tras
calificación del docente. El feedback al alumno **no debe** decir "correcto".

**Estado actual:** `<textarea>` propio (`min-h-[80px] rounded-md border
focus:ring-2 focus:ring-[#93c5fd]`), contador `{text.length}/{maxLength}` a la
derecha, `<button>` de envío con hex inline (`bg-[#2563EB] hover:bg-[#1d4ed8]`).
Pista opcional con `💡`. Al enviar: caja verde "✓ ¡Respuesta enviada!".

**Patrón en la plantilla:**
- **Textarea:** `FormValidationBasic.tsx` → `<TextField multiline rows={4}>`.
  Override `input.ts`: multiline con `padding: spacing(4)`, radio
  `customBorderRadius.md` (6px) en `sizeSmall`, borde `inputBorder` → `:hover`
  `action.active` → `:focus` `primary.main`. **No hay contador de caracteres
  nativo** en Materialize (habría que ponerlo en el `helperText`, alineado a la
  derecha).
- **Estado "enviando":** `FormValidationAsyncSubmit.tsx` → `<CircularProgress
  size={20} color='inherit' />` dentro del `<Button variant='contained'>`
  mientras `loading`; luego `toast.success`.
- **Pista / ayuda:** en Materialize sería un `<FormHelperText>` bajo el campo
  (`lineHeight: 1`, `marginBlockStart: spacing(1)`, `marginInline: spacing(4)`),
  no un párrafo con emoji.
- **Cierre informativo:** `alerts.tsx` `severity='info'` (`info.lightOpacity` de
  fondo, icono en cuadrito redondeado) → el tono correcto para "recibido,
  pendiente de revisión".

**Cómo se adapta:**
1. **Textarea:** alinear tokens — `rounded-lumina-md` (6px), `border-[#e5e7eb]`,
   `hover:border-[#94a3b8]`, `focus:border-[#2563EB] focus:ring-2
   focus:ring-[#2563EB]/20` (hoy usa `#93c5fd`, un azul más claro y fuera de
   token). Padding `p-3`.
2. **Contador:** mantenerlo, pero como `helperText` — `text-[11px] text-[#6b7280]
   text-right mt-1`, y que vire a `text-[#dc2626]` al acercarse al límite
   (`text.length > maxLength * 0.9`). Patrón `FormHelperText` + `error`.
3. **Botón enviar:** quitar los hex sueltos, usar el `<Button>` de Lumina
   (`variant primary`); estado enviando → `<Loader2 className="size-4
   animate-spin" />` + "Enviando…" (patrón `AsyncSubmit`).
4. **Pista:** de `💡 {hint}` a un bloque `helperText` con icono lucide
   `<Lightbulb className="size-3.5">` y `text-[11px] text-[#6b7280]`.
5. **Cierre:** reemplazar la caja verde por `severity=info` traducido —
   `rounded-lumina-lg bg-[#eff6ff] p-4 flex gap-3` + icono reloj en cuadrito
   `size-8 rounded-lumina-lg bg-[#2563EB]/15 text-[#2563EB]` + texto
   "Respuesta enviada. Tu docente la revisará y te dará una nota." Nada de verde
   de acierto (respeta que el scoring es `manual`).
6. `useSound`: hoy hace `play('submit')` — correcto, mantener (no `'correct'`).

---

## Notas de integración

### Colores — no traer valores crudos de Materialize

Materialize expresa los estados con una **escala de opacidad semántica**
(`colorSchemes.ts`): `lighterOpacity 0.08`, `lightOpacity 0.16`, `mainOpacity 0.24`
sobre `success.main` / `error.main` / `primary.main`. Lumina hoy usa **hex fijos**
de la paleta Tailwind (`green-50`, `green-400`, `#dcfce7`, `#16a34a`, `#fee2e2`,
`#f87171`, `#dbeafe`, `#2563EB`).

**Recomendación:** no introducir `--mui-palette-*` ni las clases de opacidad de
Materialize. Congelar en las 5 actividades **el mismo par que ya usan
quiz-multiple / true-false**, para que las 7 se vean idénticas:

| Rol | Fondo | Borde / texto | Icono |
|---|---|---|---|
| Acierto | `#dcfce7` (`bg-green-100`) | `#16a34a` | `CheckCircle2` `#16A34A` |
| Error | `#fee2e2` (`bg-red-100`) | `#f87171` borde / `#991b1b` texto | `XCircle` `#DC2626` |
| Seleccionado (sin enviar) | `#dbeafe` | `#2563EB` | `CheckCircle` `#2563EB` |
| Revelar correcta no elegida | `#dcfce7`/50 | `#16a34a`/40 | `CheckCircle2` |
| Neutralizado | — | `opacity-40/50` | — |
| Info / pendiente (short-answer) | `#eff6ff` | `#1e3a8a` texto | reloj `#2563EB` |

- La única idea de opacidad que **sí** conviene copiar: para el *hover de
  dropzone* de drag-drop, `#2563EB`/8 (`lighterOpacity`) es más elegante que el
  `#dbeafe` pleno actual. Se puede escribir como `bg-[#2563EB]/8` sin token nuevo.
- El **tinte de sombra**: Materialize tiñe de azul (`mainColorChannels`), Lumina
  usa negro neutro. **Mantener Lumina** — es decisión de diseño del 21/07/2026
  ("paleta neutra sin tinte de color"). No cambiar `shadow-lumina-*`.

### Radios

`customBorderRadius` de Materialize: `xs 2 · sm 4 · md 6 · lg 8 · xl 10`.
Lumina: `lumina-xs 2 · sm 4 · md 6 · lg 10 · xl 12 · 2xl 16`.
Coinciden hasta `md`. **Usar los tokens de Lumina siempre** (`rounded-lumina-md`
para inputs/badges pequeños, `rounded-lumina-lg` para cajas de feedback,
`rounded-xl` para el contenedor de la actividad, ya en uso). No hardcodear
`rounded-md` / `rounded-lg` de Tailwind: las 5 pendientes hoy mezclan
`rounded-md` (Tailwind, 6px) y `rounded-xl` — homogeneizar a tokens `lumina-*`.

### Tipografía

Plantilla usa **Inter**; Lumina usa **Plus Jakarta Sans** (`--font-plus-jakarta`,
`font-sans`). No importar tipografía de la plantilla. Los tamaños de la plantilla
(`h4` para número de paso, `body2` para contenido de tarjeta) se traducen a la
escala `lumina-*` (`text-lumina-lg` / `text-lumina-md` / `text-lumina-sm`) o a la
escala Tailwind que ya usan quiz-multiple (`text-sm font-medium`, `text-xs`).
Mantener la consigna "tipografía grande": los enunciados en `text-base
font-medium` (fill-blanks y short-answer ya lo hacen; order-steps y drag-drop usan
`text-sm` → subir a `text-base` para igualar).

### Iconos

Plantilla: **Remix Icon** (`<i className='ri-*'>`). Lumina: **lucide-react**.
Equivalencias: `ri-checkbox-circle-line` → `CheckCircle2`; `ri-error-warning-line`
→ `XCircle` / `AlertCircle`; `ri-check-line` → `Check`; `ri-alert-line` →
`AlertTriangle`; `ri-information-line` → `Info`; spinner `CircularProgress` →
`Loader2` + `animate-spin`. Nunca añadir Remix Icon.

### Dependencias — nada nuevo

- `@formkit/drag-and-drop` (kanban de la plantilla) → **no**. order-steps ya usa
  `@dnd-kit`; drag-drop usa dnd HTML5 nativo. Solo se extrae el *aspecto* de
  dropzone/handle/tarjeta.
- MUI / Emotion → **no**. Todo se hace con Tailwind + `cn()`.
- react-toastify → **no**. Lumina ya tiene Sonner; además el feedback de
  resultado va inline, no en toast.
- El feedback animado (`zoom-in-95`, `lumina-viewer-shake`, `lumina-block-in`) y
  la entrada escalonada **ya existen en Lumina** y son superiores a lo que trae
  Materialize (que no tiene keyframes propios). No se importa nada; se *aplica*
  a las 5 pendientes lo que quiz-multiple ya hace.

### Scoring — sin tocar

Ninguna de las adaptaciones cambia la evaluación:
- fill-blanks, order-steps, emparejar, drag-drop → siguen leyendo el resultado de
  `evaluateActivityResponse` / la comparación existente; el color por-elemento se
  deriva de ese resultado, no lo recalcula.
- short-answer → sigue `manual`; su feedback es informativo, nunca "correcto".
- Regla 8 del contexto (una sola fuente de verdad de scoring) intacta.

---

## Resumen de qué extraer por actividad

| Actividad | Patrón Materialize aprovechable | Ruta en la plantilla | Peso del cambio |
|---|---|---|---|
| **transversal** | tarjeta seleccionable (borde=estado, transición corta) | `@core/components/custom-inputs/{Vertical,Horizontal}.tsx` | base para 3 actividades |
| **transversal** | Alert/Chip tonal → badge y caja de feedback con icono en cuadrito | `@core/theme/overrides/{alerts.tsx,chip.ts}`, `views/apps/kanban/TaskCard.tsx` | remate visual |
| **transversal** | escala tonal 0.08/0.16/0.24 (solo hover de dropzone) | `@core/theme/colorSchemes.ts` | mínimo |
| fill-blanks | input con estado `error`/`success` + `helperText` | `views/forms/form-validation/FormValidationBasic.tsx`, `@core/theme/overrides/input.ts` | medio (falta estado por hueco) |
| order-steps | handle en hover + "dot" numerado de stepper + conector | `views/apps/kanban/styles.module.css`, `views/forms/form-wizard/StepperVerticalWithNumbers.tsx`, `components/stepper-dot/`, `@core/styles/stepper.ts` | medio-alto (feedback por paso nuevo) |
| emparejar | tarjeta activa (borde) + par correcto/incorrecto por color semántico | `@core/components/custom-inputs/Horizontal.tsx`, `@core/theme/overrides/chip.ts` | medio (feedback por par nuevo) |
| drag-drop | dropzone (borde sólido fino + `lighterOpacity` en drag) + tarjeta con sombra | `views/apps/kanban/{KanbanBoard,KanbanList,TaskCard}.tsx` + `styles.module.css` | alto (`zoneCorrect/zoneWrong` sin implementar) |
| short-answer | textarea tokenizada + botón "enviando" (spinner) + cierre `severity=info` | `views/forms/form-validation/FormValidationAsyncSubmit.tsx`, `@core/theme/overrides/{input.ts,alerts.tsx}` | bajo-medio (sobre todo el tono del cierre) |

**Siguiente paso sugerido:** revisar este mapeo juntos y luego generar un prompt
de implementación por actividad (5 prompts `[FRONTEND]`, cada uno con "Lee
LUMINA_CONTEXT_V41.md" + "Lee LUMINA_ROADMAP_DETALLADO.md, Fase 4" + este
documento), empezando por los transversales (§1–§3) para no repetir el vocabulario
de estados en cada uno.
