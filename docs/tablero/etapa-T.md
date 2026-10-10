# Etapa T — Sistema de diseño y rework de widgets

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa T — Widgets terminados «de fábrica»: tokens, presets visibles, movimiento y accesibilidad

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `T0–T20` (más `T2b`) (no `L.n`, no `N.n`, no `Q.n`, no `R.n`, no `S.n`). Redactada a partir del análisis de widgets del 2026-10-10 contrastado con el código (conversación con el dueño; solo lectura, sin código). `S` ya está tomada por «secciones plegables»; esta etapa usa `T`.

**Por qué existe:** un widget recién insertado debería verse terminado y con la marca del curso sin tocar un color, y el docente debería poder elegir un estilo y ajustar 2–3 perillas. Hoy hay 14 widgets en `packages/element-kit/src/widgets/` (los 12 del análisis más `molecula` y `tabla_periodica`). Medido al redactar:
- La capa de tokens **ya existe** (`--lw-*` en `editor-shared/src/use-widget-theme.ts` y `widget-container-styles.ts`, alimentada por `SlideTheme`), pero queda a medias: siguen quedando hex sueltos en los `.module.css` (Botón 58, Tabla periódica 29, Timeline 22, Click Reveal 16, Flip Cards 14, Popup 12, Hotspot 10, Tooltip 10). El Botón sigue fijando `#6c757d` para `secondary`, así que el tema solo cambia el primario.
- Los **12 widgets ya declaran `presets`** en su `ElementDefinition`, pero ninguna UI los lee (solo las galerías propias de Flip Cards y Timeline). Además `ElementPreset` tiene dos campos para lo mismo (`patch` y `configPatch`): los presets de Botón usan `patch` con un cast `as unknown as Partial<BotonEstado>`.
- Ningún widget usa `motion` (no está en el `package.json` de `element-kit`; sí en `@lumina/ui`). `prefers-reduced-motion` solo se respeta en la tabla periódica.
- Accesibilidad: Popup tiene `role="dialog"`/`aria-modal` pero no focus trap ni devuelve el foco; Contador, Ruleta y Hotspot no tienen `aria-live`.
- El Carousel es casero (`useState(activeIndex)`) aunque `@lumina/ui/carousel` ya envuelve Embla. La Ruleta trunca etiquetas a 11 caracteres (`ruleta-wheel.tsx:62`).
- **No hay ciclo con `lumina-frontend`** (E7 cerrada): no hace falta esperar nada del grafo; sí hay que **declarar** en el `package.json` del kit las dependencias que se usen (`motion`, `embla-carousel-*`, `radix-ui`, `qrcode.react`…).
- Ningún spec de `lumina-frontend/src/visual-tests/` cubre widgets: sin línea base no hay «antes/después» que probar.

**Decisiones de diseño (DT1–DT7), fijadas por esta raíz; el operador no las reabre:**
- **DT1.** `--lw-*` es el **único** vocabulario de apariencia de un widget. Un `.module.css` de widget no contiene hex fuera del *fallback* de un `var(--lw-*, …)`; un test de guarda lo hace cumplir (T1). Tokens nuevos permitidos: `--lw-color-{success,danger,warning}`, `--lw-space-*`, `--lw-elevation-*`, `--lw-motion-{slow}` y curvas. No se renombran los existentes.
- **DT2.** `ElementPreset` queda con **un solo** campo para parchear la config: `configPatch`. `patch` se retira. Si al medir (T2, Regla 9 §3) algún preset necesita parchear el **estado** del widget, se agrega `estadoPatch` explícito; nunca un cast `as unknown as`. **Resuelto en T2 (medido: 16 definiciones, 50 presets, todos con `patch` y todos sobre el estado, ninguno con `configPatch`):** el único campo es `estadoPatch` (`DeepPartial<TEstado>`, obligatorio); `patch` y `configPatch` desaparecen y `ElementPreset<TEstado>` ya no admite parches de `TConfig`.
- **DT3.** Un único `<PresetGallery>` en `@lumina/editor-shared`, que lee `definicion.presets` y vive **dentro de una `CollapsibleSection`** «Estilos» (`@lumina/ui`, etapa S). Las galerías propias de Flip Cards y Timeline (con miniaturas) se conservan; no se reescriben.
- **DT4.** Un único `WidgetMotion` (wrapper/hook sobre `motion`) con presets de entrada, press, hover, éxito y conteo; respeta `prefers-reduced-motion` **una sola vez**. Ningún widget importa `motion` directamente. La animación de entrada por defecto del widget es sobrescribible desde el sistema `Animacion[]` existente (T5 verifica primero que `Animacion[]` aplique a widgets).
- **DT5.** Toda dependencia nueva se declara en `packages/element-kit/package.json` y se carga con `import()`/`React.lazy` si pesa; el viewer del alumno no paga una librería que el slide no usa. Prohibido consumir desde el kit algo instalado solo en el frontend.
- **DT6.** Cada widget nuevo nace como `ElementDefinition` (Regla 3), registrado solo con `ElementRegistry.registrar()` vía `register.ts`, con `presets`, tokens `--lw-*`, `catalogo` en `elements/_shared/catalogo.ts` y entrada en `widget-panel-catalog.ts`. Prueba de render/estado propia (no hay widget viejo con quien comparar paridad).
- **DT7.** El canal de runtime (`ElementRuntimeConfig`) **no transporta notas ni puntajes** (C1/C4). Ningún widget nuevo califica por sí mismo: si algo debe puntuar, lo hace `@lumina/scoring` desde una actividad.

**Riesgos relevados al redactar (re-medir al tomar cada ficha):**
- Las propiedades de Popup, Hotspot, Flip Cards, Click Reveal, Timeline, Tabs y Carousel fueron tocadas por S9/S12 (secciones plegables). Toda ficha que edite esos `*-properties.tsx` necesita **S12 `hecho`**; el índice de `AGENTS.md` todavía dice «S1–S12 en revisión».
- Los nuevos widgets (T16–T20) editan los mismos archivos compartidos (`elements/_shared/catalogo.ts`, `index.ts` del kit, `widget-panel-catalog.ts`, registro del frontend): **no corren en paralelo entre sí**.
- Los snapshots de T0 dependen del navegador del proyecto `visual` de `lumina-frontend`; si la fuente o el motor cambian, los diffs de fichas posteriores serían ruido. T0 documenta cómo regenerarlos.
- Floating UI y el portal de Popup a `.canvas-slide` pueden chocar con el zoom del canvas: T15 prueba bordes y zoom.
- Stepper (T18) puede solaparse con el motor de interacción (etapas K/N) y con Click to Reveal; T18 empieza con un relevamiento y para si el solape es total.

**Orden / dependencias:**
```
T0 ─→ T1 ─→ T5 ─→ T6
 │     │     ├──→ T7 ◄── T4
 │     │     ├──→ T15 ◄── T4
 │     │     └──→ T17 ◄── T6
 │     └──→ T8…T14 ◄── T3, T5
 ├──→ T4
 └──→ T16
T2 ─→ T3 ─→ T8…T14
T16 ─→ T18 ─→ T19 ─→ T20      (serie por archivos compartidos)
```
T1 y T2 tocan archivos disjuntos (CSS/tokens contra definiciones TS) y pueden ir en paralelo; T3 y T4 también (propiedades contra viewers). T8–T14 tocan una carpeta de widget cada una, pero esperan a T3 por los `*-properties.tsx`. T16–T20 van en serie por los archivos compartidos de registro.

**Fuera de alcance de la etapa:** KPI / stat tiles, Embed seguro (iframes con allowlist: ya hay un `<iframe>` de YouTube en `blocks/video/render-video.tsx` sin `sandbox`; exige revisión de seguridad aparte), Mapa interactivo, waveform de Audio (`wavesurfer`), reproductor de video «pro» (`@vidstack/react`), Mermaid, y todo cambio en actividades. Widgets ya existentes que **no** se rehacen: Acordeón, Comparador, Checklist, Scratch card, Cita, Código, Ecuación, Diagrama, Gráfico. El viewer de actividades y el backend (salvo lo que T20 cite) no se tocan.

---

#### T0 — Línea base de snapshots visuales de los 14 widgets
- **Operador:** Claude Code
- **Estado:** en revisión — `widgets-base.visual.spec.tsx` + `widgets-fixture.tsx` en `lumina-frontend/src/visual-tests/`: 63 pruebas (14 widgets «por defecto» + 49 presets, montando el `Viewer` real del registry; sin animaciones; la molécula espera a que su `<canvas>` tenga píxeles). Referencias **solo `chromium-linux`** (62 PNG en `__screenshots__/widgets-base.visual.spec.tsx/`): las existentes de `clip-group` son `win32` ×3 navegadores y en este entorno no hay Firefox ni WebKit; en otra plataforma/navegador la primera corrida crea la referencia y falla («No existing reference screenshot»), la segunda pasa. Corrida: `vitest run --project "visual (chromium)" widgets-base` ×3 estable (63/63), también dentro del proyecto completo; `eslint` y `tsc --noEmit` limpios. Los overlays (popup, hotspot, tooltip) se capturan cerrados; la tabla periódica, la molécula, Tabs y Ruleta quedan recortadas por el marco de 360×240. 10 PNG son idénticos entre sí (p. ej. preset `primario` de Botón = por defecto): es esperable, no un error. **Hallazgo para T2:** los presets parchean el **estado** del widget (`ElementPreset<BotonEstado>`), no una config; la ficha T2 debe medir eso antes de elegir `configPatch`.
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `lumina-frontend/src/visual-tests/` (specs nuevos, uno por widget o agrupados) y sus imágenes de referencia; un helper de fixtures en esa carpeta. **NO** toca `packages/element-kit` ni ningún CSS.
- **Entregable:** un snapshot del Viewer por widget en su estado por defecto y, para los 12 con presets, uno por cada preset; documentado cómo regenerar (`test:visual:update`). Verificación: `pnpm --filter lumina-frontend test:visual` verde dos corridas seguidas (estable, sin diffs espurios).
- **Cierre:** n/a (no hay código viejo).

#### T1 — Completar tokens `--lw-*` y prohibir hex en CSS de widgets
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T0 `hecho`.
- **Alcance — PUEDE tocar:** `packages/editor-shared/src/widget-container-styles.ts` (+ spec), `packages/element-kit/src/widgets/*/*.module.css` y los `.ts`/`.tsx` de widgets **solo** donde fijan colores en línea, y un spec de guarda nuevo. **NO** cambia lógica, props ni el aspecto con el tema por defecto.
- **Entregable:** (1) medir (Regla 9 §3) cuántos hex y en qué archivos antes de tocar; (2) agregar los tokens de DT1; (3) migrar los hex a `var(--lw-*, fallback)` agrupando por causa común, empezando por Botón (variantes `secondary`/`success`/`danger`…), luego Tabla periódica, Timeline, Click Reveal, Flip Cards, Popup, Hotspot, Tooltip; (4) spec de guarda que falla si un `.module.css` de widget tiene un hex fuera de un `var()` fallback; (5) con el tema por defecto, los snapshots de T0 **no cambian**; con un `SlideTheme` distinto, cambian los 14. Verificación: `pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** no quedan hex sueltos (el spec lo prueba).

#### T2 — Unificar `configPatch` en `ElementPreset` y quitar los casts
- **Operador:** Cursor
- **Estado:** en revisión — contrato: `ElementPreset<TEstado>` con `estadoPatch: DeepPartial<TEstado>` (nuevo tipo `DeepPartial` exportado); `patch`/`configPatch` eliminados; `ElementDefinition.presets` pasa a `ElementPreset<TState>[]`. 16 definiciones migradas (los 12 widgets + accordion, image-compare, interactive-checklist, scratch-card), **50 casts `as unknown as Partial<…>` eliminados**, 4 `*-properties.tsx` y 6 specs actualizados. Al quitar los casts el compilador destapó **presets con claves inexistentes que se ignoraban** (Regla 9 §1): Click to Reveal (`tipoInteraccion`, `animacionModal`), Popup (`triggerTipo`, `tamanoModal`, `efectoEntrada`) y Tabs (`posicionTabs`) quedan con `estadoPatch: {}` —mismo resultado que antes, ya que esas claves no tenían efecto— y se documentan en el código; darles valores reales es la ficha **T2b**. Hotspot: `"medio"` (valor inválido que el viewer trataba como el tamaño mediano) pasa a `"mediano"`, idéntico en pantalla. Verif.: `@lumina/element-kit-core` build + test (9) y lint; `@lumina/element-kit` tsc, test (94 archivos, 624 tests), lint (0 errores) y build; `lumina-frontend` tsc; paridad = los 63 snapshots de T0 pasan **sin regenerar**. Fuera del alcance escrito pero necesario: `lumina-frontend/src/visual-tests/widgets-fixture.tsx` (1 línea: lee `estadoPatch`).
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `packages/element-kit-core/src/` (tipo `ElementPreset` + su spec) y los `*-presets.ts`/`*-definition.ts` de los 12 widgets (`boton`, `progreso`, `contador`, `ruleta`, `flip-cards`, `tabs`, `carousel`, `click-reveal`, `timeline`, `hotspot`, `tooltip`, `popup`) y de `accordion`, `image-compare`, `interactive-checklist`, `scratch-card` (también declaran presets). **NO** toca viewers ni CSS.
- **Entregable:** (1) medir qué presets usan `patch`, cuáles `configPatch` y cuáles necesitan parchear estado (DT2); (2) dejar solo `configPatch` (y `estadoPatch` únicamente si hace falta); (3) sin `as unknown as` en ningún preset; (4) los presets existentes siguen produciendo el mismo resultado. Verificación: `pnpm -r build && pnpm --filter @lumina/element-kit-core test && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`.
- **Cierre:** el campo `patch` desaparece del contrato (grep en `packages/` y `lumina-frontend/` → 0).

#### T2b — Dar valores reales a los presets que no hacían nada
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T2 `hecho`. **Debe cerrarse antes de T3** (la galería mostraría presets que no cambian nada).
- **Alcance — PUEDE tocar:** `elements/click-reveal/click-reveal-definition.ts`, `elements/popup/popup-definition.ts`, `elements/tabs/tabs-definition.ts` (los `*_PRESETS`) y, si hace falta una opción que hoy no existe (posición de las pestañas), **solo** la config/viewer de ese widget. **NO** toca otros widgets ni el contrato.
- **Entregable:** (1) por preset, decidir con el dueño qué cambia de verdad: Click to Reveal → `efectoApertura` (`slide-up`/`fade`); Popup → `triggerVisual` (`boton`/`icono`/`imagen`), `modalAnchoPct` y `efectoApertura`; Tabs → no existe opción de posición: o se descartan los dos presets o se implementa la opción antes; (2) cada preset resultante se ve distinto del estado por defecto; (3) snapshots de T0 regenerados **solo** para esos presets, con el diff revisado. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** desaparecen las notas «T2:» de esas definiciones.

#### T3 — `PresetGallery` único, dentro de la sección «Estilos»
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T2 y T2b `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `packages/editor-shared/src/` (`preset-gallery.tsx` + spec) y, en cada widget con presets, **solo** el `*-properties.tsx` para montar la galería dentro de una `CollapsibleSection` «Estilos» (`storageKey` `widget.<tipo>.estilos`, abierta por defecto). **NO** reescribe las galerías de Flip Cards y Timeline ni cambia otras secciones.
- **Entregable:** el componente lee `definicion.presets`, aplica `estadoPatch` (mezclando `configuracion` a un nivel, como hacen hoy las propiedades de Accordion/Scratch card) con `onChange` y marca el preset activo si el estado coincide; accesible por teclado; miniatura opcional (`thumbnail`) o etiqueta + descripción. Probado: aplicar un preset cambia la config esperada, sin presets no se renderiza nada. Verificación: `pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación visual en el editor.
- **Cierre:** n/a.

#### T4 — Accesibilidad: foco en Popup, `aria-live` y movimiento reducido
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** T0 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/popup/` (`popup-parts.tsx`, `popup-viewer.tsx`), `widgets/contador/`, `widgets/ruleta/`, `widgets/progreso/` (solo viewer/parts/CSS), `widgets/hotspot/hotspot-viewer.tsx`. **NO** toca `*-properties.tsx` (los usa T3) ni agrega dependencias nuevas salvo `radix-ui` Dialog declarado en el kit (DT5).
- **Entregable:** Popup con focus trap, foco inicial dentro, Escape y devolución del foco al disparador (sin romper el modo editor ni el portal); `aria-live="polite"` en el resultado de Ruleta, en los hitos del Contador y en el valor del Progreso; `@media (prefers-reduced-motion: reduce)` en las transiciones/animaciones de los 5 widgets. Specs con `@testing-library` para foco y `aria-live`. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T5 — `WidgetMotion` sobre `motion`
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T1 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/package.json` (declarar `motion`), `packages/element-kit/src/widgets/_motion/` (nuevo: `widget-motion.tsx`, presets, spec). **NO** migra ningún widget todavía.
- **Entregable:** (1) verificar si `Animacion[]` de `Block` aplica a widgets y cómo se combina con una animación de entrada por defecto (DT4); (2) presets `entrada` (fade/slide/scale con stagger), `press`, `hover`, `exito`, `conteo`; (3) `prefers-reduced-motion` apaga todo en un único punto; (4) lazy donde pese. Verificación: `pnpm --filter @lumina/element-kit build && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`.
- **Cierre:** n/a.

#### T6 — Carousel sobre Embla
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T1 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/carousel/`, `packages/element-kit/package.json` (declarar `embla-carousel-react` y `embla-carousel-autoplay`). **NO** modifica `@lumina/ui/carousel` salvo que sea imprescindible (y entonces se detiene y pide reescribir la ficha).
- **Entregable:** el viewer usa Embla (swipe, loop, autoplay opcional, puntos y contador); se conservan `activeIndex`, el contrato con `SlideNavContext` y los eventos del runtime; prueba de paridad contra el carrusel casero (misma config → mismo slide visible, misma navegación) antes de borrar el viejo. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** se borra la lógica casera de navegación del viewer (Regla 4).

#### T7 — Ruleta: etiquetas, peso, «eliminar ganador» y sonido
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T4 y T5 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/ruleta/` (config, defaults, viewer, wheel, properties) y su spec de defaults. **NO** agrega librerías de gráficos.
- **Entregable:** etiquetas multilínea sin truncar a 11 caracteres; peso/probabilidad por ítem; modo «sin repetición / eliminar ganador» con historial de tiradas; tick de sonido con WebAudio (respeta el booleano `sonido` actual); confeti simple al parar (sin dependencia nueva o con una declarada y diferida); normalización de JSON legado intacta. Paridad: con la config por defecto el giro y el ganador son los de antes. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T8 — Botón: variantes por token, icono, loading y acciones
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/boton/` y `elements/boton/` (definition, presets, adaptadores y su paridad). **NO** toca el motor de interacción.
- **Entregable:** dejar de clonar Bootstrap: variantes `solid / soft / outline / ghost / link` por token; icono izquierdo o derecho (Lucide); estado `loading`; tamaño por densidad; micro-press con `WidgetMotion`; foco por token. Acciones nuevas: abrir popup o hotspot por id, descargar recurso (adjunto), emitir evento al runtime. Presets reescritos. Paridad: la config legada renderiza igual. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** variantes Bootstrap hardcodeadas borradas del CSS (Regla 4).

#### T9 — Progreso: variantes circular, semicírculo y pasos
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/progreso/` y `elements/progreso/`. **NO** cambia el cálculo en modo `slides`.
- **Entregable:** variantes lineal / circular / semicírculo / pasos (stepper); conteo animado del valor; hitos con etiqueta; modo «objetivo» (meta vs actual); presets. Paridad: modo `slides` y `manual` dan el mismo porcentaje que antes. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T10 — Contador: dígitos, anillo, hitos y presets de dinámica
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** T1, T3, T4 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/contador/` y `elements/contador/`. **NO** toca `ruleta` ni `progreso`.
- **Entregable:** variantes dígitos / flip-clock / anillo; hitos con alerta visual y sonora configurable; presets Pomodoro 25/5, cuenta atrás dramática, cronómetro de debate y «semáforo» de dinámica grupal; `aria-live` conservado de T4. Paridad: temporizador, cronómetro y número se comportan igual con la config legada, incluido «al terminar → siguiente». Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T11 — Flip Cards: tipos de giro, profundidad y modo mazo
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/flip-cards/` y `elements/flip-cards/`. **NO** reescribe las 8 plantillas existentes.
- **Entregable:** tipos de giro Y / X / deslizar / fundido (hoy solo `rotateY 0.55s`); profundidad 3D opcional; entrada escalonada con `WidgetMotion`; modo «mazo» (una carta a la vez, swipe). Paridad: las 8 plantillas se ven igual por defecto. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T12 — Tabs: variantes y transición de panel
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/tabs/` y `elements/tabs/`. **NO** toca `widget-layouts` compartido más de lo imprescindible (si hace falta, pide reescribir la ficha).
- **Entregable:** variantes underline / pills / enclosed / vertical / segmented; transición entre paneles con `WidgetMotion`; icono y badge por pestaña. Basarse en `radix-ui` Tabs solo si conserva el modo editor (edición inline). Paridad con la variante actual. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T13 — Click to Reveal: disparadores y progreso
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/click-reveal/` y `elements/click-reveal/`. **NO** toca `elements/scratch-card/`.
- **Entregable:** variantes de disparo (flip / spotlight / blur-off; el «scratch» ya lo cubre `scratch-card`, no se duplica); contador «X de Y revelados»; bloqueo opcional hasta revelar todo, emitiendo el evento al runtime. Paridad con el modal actual. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T14 — Timeline: orientación, densidad y animación al desplazar
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** T1, T3 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/timeline/` y `elements/timeline/`. **NO** reescribe las 8 variantes.
- **Entregable:** orientación vertical/horizontal por config, densidad compacta/amplia, animación al entrar en vista con `WidgetMotion` (`useScroll` solo si respeta reduced-motion). Paridad: las 8 variantes se ven igual por defecto. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T15 — Overlays con Floating UI (Hotspot, Tooltip, Popup)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T4 y T5 `hecho`; S12 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/hotspot/`, `widgets/tooltip/`, `widgets/popup/` (parts/viewer/CSS), `packages/editor-shared/src/use-overlay-auto-position.ts` (+ su spec) y `packages/element-kit/package.json` (declarar `@floating-ui/react`). **NO** cambia los `*-properties.tsx`.
- **Entregable:** el posicionamiento `auto` usa Floating UI (flip, shift, flecha, colisión) y deja de depender del cálculo casero; se mantiene el portal a `.canvas-slide` y el comportamiento en el editor; animación de entrada con `WidgetMotion`. Prueba de bordes (burbuja pegada a cada borde del slide) y con zoom del canvas distinto de 100 %. Paridad: posiciones explícitas (`arriba/abajo/izquierda/derecha`) no cambian. Verificación: `pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** se elimina la lógica casera de `useOverlayAutoPosition` que Floating UI reemplaza, o queda `TODO` con ticket y fecha si algún consumidor externo la usa (Regla 4).

---

### Widgets nuevos (decisión del dueño, 2026-10-10)

Elegidos entre los 19 propuestos tras cruzarlos con `elements/`: **Callout/nota, Galería/lightbox, Stepper narrativo, Sello de logro, QR de sesión**. Cada uno nace como `ElementDefinition` según DT6 y DT7. Van en serie (T16 → T20) porque comparten archivos de registro.

#### T16 — Widget «Callout / nota»
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T1 y T3 `hecho` (tokens y `PresetGallery`).
- **Alcance — PUEDE tocar:** `packages/element-kit/src/widgets/callout/` y `elements/callout/` (nuevos), `elements/_shared/catalogo.ts`, `packages/element-kit/src/index.ts` (export/registro), y en el frontend **solo** `widget-panel-catalog.ts` y el punto donde se llaman los `registrar*()`. **NO** toca otros widgets.
- **Entregable:** widget con tipos `info / tip / aviso / peligro / éxito` (colores por `--lw-color-*`), icono Lucide editable, título opcional, cuerpo de texto enriquecido, variantes (barra lateral / tarjeta / banda) como presets; `apariencia` con color y tipografía; `crearPorDefecto()`; Editor, Viewer y Propiedades; `catalogo` `{ nombre: "Callout", familia: "widget", grupo: "lienzo" }`. Pruebas: render por tipo, normalización de JSON incompleto, preset aplicado, atributos a11y (`role="note"`/`status`). Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:unit` y comprobar que aparece en el panel «Widgets».
- **Cierre:** n/a (no hay código viejo).

#### T17 — Widget «Galería / lightbox»
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T6 y T16 `hecho` (Embla declarado en el kit; archivos de registro libres).
- **Alcance — PUEDE tocar:** `widgets/galeria/` y `elements/galeria/` (nuevos), `catalogo.ts`, `index.ts` del kit, `widget-panel-catalog.ts`, registro del frontend. **NO** modifica `imagen` ni `carousel`.
- **Entregable:** conjunto de imágenes (reutiliza el selector de imágenes/assets existente) con rejilla / mosaico / tira por preset; lightbox con zoom, flechas y teclado sobre el `Dialog` de Radix con focus trap (declarado en el kit, DT5); navegación con Embla; texto alternativo obligatorio por imagen con aviso en el panel; carga diferida de imágenes. Pruebas: abrir/cerrar, Escape devuelve el foco, flechas, `alt` faltante marcado. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T18 — Widget «Stepper narrativo»
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** T5 y T17 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/stepper/` y `elements/stepper/` (nuevos), `catalogo.ts`, `index.ts` del kit, `widget-panel-catalog.ts`, registro del frontend. **NO** toca el motor de interacción ni Click to Reveal.
- **Entregable:** **primero un relevamiento** (documentado en la ficha al terminar): qué cubren ya el motor de reglas (K/N) y Click to Reveal; si el solape es total, se para y se deja `bloqueado por <ID>`. Si sigue en pie: contenido que se revela paso a paso («Siguiente / Anterior»), N pasos con título y cuerpo, indicador de progreso, transición con `WidgetMotion`, opción de avanzar con el `SlideNavContext` o de forma independiente; emite al runtime `visitado` al completar el último paso (sin variables nuevas ni notas, DT7). Pruebas: avance/retroceso, límites, evento emitido una sola vez, reduced-motion. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:unit`.
- **Cierre:** n/a.

#### T19 — Widget «Sello / insignia de logro»
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** T5 y T18 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/sello/` y `elements/sello/` (nuevos), `catalogo.ts`, `index.ts` del kit, `widget-panel-catalog.ts`, registro del frontend. **NO** toca `lumina-backend` ni `@lumina/scoring`.
- **Entregable:** insignia SVG con forma (círculo, escudo, estrella), icono y texto editables, estados «bloqueado / ganado» y animación de obtención con `WidgetMotion` (+ confeti simple y diferido); se muestra «ganado» según el estado de objeto o la condición que entregue el runtime (`estadoObjeto`), o manualmente en el editor para previsualizar. **No** calcula ni guarda puntajes (DT7); conectarlo al módulo `achievements` del backend queda como ficha futura, no de esta. Pruebas: ambos estados, transición, a11y (`aria-live` al ganar), normalización. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:visual`.
- **Cierre:** n/a.

#### T20 — Widget «QR de sesión»
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** T19 `hecho`.
- **Alcance — PUEDE tocar:** `widgets/qr-sesion/` y `elements/qr-sesion/` (nuevos), `catalogo.ts`, `index.ts` del kit, `widget-panel-catalog.ts`, registro del frontend, `packages/element-kit/package.json` (declarar `qrcode.react`, carga diferida). **NO** toca `lumina-backend` ni la ruta `join/[codigo]` del frontend.
- **Entregable:** QR de una URL de unión de sesión (la ruta existente `app/(app)/join/[codigo]`: `<origen>/join/<codigo>`), con el código/PIN visible en texto grande debajo y botón copiar; el código se ingresa a mano o viene del contexto de la sesión en vivo si el reproductor ya lo expone (si no, solo manual y se deja dicho); tamaño y margen configurables; nivel de corrección de errores; contraste suficiente vía tokens; `alt`/etiqueta accesible. Antes de empezar, la ficha verifica qué código exponen hoy `live-sessions` y `autonomous-sessions` (que usa `pin`); si hay dudas de autorización (Regla 5), para y pide reescribir la ficha. Pruebas: render con y sin código, URL generada, copia al portapapeles. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend test:unit`.
- **Cierre:** n/a.
