# Etapa S — Secciones plegables en los paneles del editor

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa S — Paneles del editor con secciones desplegables

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `S1–S11` (no `L.n`, no `N.n`, no `Q.n`, no `R.n`). Redactada a partir del análisis de paneles del 2026-10-10 (conversación con el dueño; solo lectura, sin código).

**Por qué existe:** el panel izquierdo «Elementos» (`ElementosPanel`, `flyout-left-panels.tsx`) muestra todo abierto en un único scroll (≈ 18 diagramas, 7 tipos de gráfico + plantillas, química, máscaras, imágenes, multimedia, estructura) y el panel derecho «Propiedades» apila secciones también abiertas (gráfico: 38 etiquetas y 4 bloques con `border-t`; diagrama; popup de 1137 líneas; `motorSections` bajo cada bloque). La solución ya existe a medias: `@lumina/ui/collapsible` y `InspectorSection` (`packages/editor-shared/src/typography-inspector.tsx:84`) se usan en 3 sitios; el resto son encabezados copiados a mano (≈ 33 archivos con `text-[10px] font-semibold uppercase`) con 3 variantes de tamaño.

**Decisiones de diseño (DS1–DS5), fijadas por esta raíz; el operador no las reabre:**
- **DS1.** Un único componente `CollapsibleSection` en `@lumina/ui` (mismo patrón que `FieldHelp`, etapa R). Props: `title`, `children`, `defaultOpen?` (por defecto `true`), `icon?`, `badge?` (conteo o texto corto), `storageKey?`, `forceOpen?`. Encabezado = botón con `aria-expanded`, chevron, foco visible; contenido con `CollapsibleContent` de Radix (no está en el DOM mientras la sección está cerrada). Un solo estilo de encabezado (`text-[11px] font-semibold uppercase tracking-wider`), que reemplaza las variantes de `text-xs`, `text-[10px]` y `text-[11px]`.
- **DS2.** El estado abierto/cerrado se recuerda **por usuario** en `localStorage` bajo `lumina.panel.<storageKey>`; todo acceso va en `try/catch` y el componente funciona sin storage. No se guarda en el servidor ni en el documento de la clase.
- **DS3.** Valores iniciales: **abierto** lo esencial de cada panel (la primera sección y las que el docente usa en casi cada inserción/edición); **cerrado** lo avanzado o raro (ejes, referencias, plantillas, «Opciones avanzadas», máscaras, estados y rotación). La ficha de cada panel lista su `defaultOpen`.
- **DS4.** Una sección que contiene el elemento seleccionado, una coincidencia de búsqueda o un error de validación se muestra abierta (`forceOpen`) sin pisar la preferencia guardada.
- **DS5.** No se cambian etiquetas, textos, orden de campos ni lógica de inserción/edición; solo se envuelven en secciones. El texto largo sigue el criterio de la etapa R (ⓘ); no se reabre.

**Riesgos relevados al redactar (re-medir al tomar cada ficha):**
- `flyout-left-panels.tsx` (2172 líneas) y `properties-panel.tsx` (1859) concentran varios paneles: dos fichas no pueden tocarlos a la vez (Regla 10, Concurrencia). Por eso S2 y S6 los parten primero, sin cambio de comportamiento.
- Varios specs consultan nodos por texto o atributo sin interacción (`grafico-properties.*.spec.tsx`, `diagrama-properties.regresion.spec.tsx`, `texto-properties.spec.tsx`). Con la sección cerrada por defecto, el contenido de `CollapsibleContent` no está en el DOM: los specs abren la sección o usan `defaultOpen` en la prueba.
- Los botones de inserción deben seguir funcionando con arrastre (`DraggableWidgetItem`, `DraggableActivityItem`, `editor-dnd-shell.tsx`); un contenedor cerrado no debe romper el contexto de `dnd-kit`.
- Iconos repetidos (`CircleDot` en Proporción/Venn/Ciclo; `Grid` en Matriz 2×2/Eisenhower/Especiales): se distinguen al agrupar, sin cambiar el catálogo.
- `InspectorSection` y `WidgetPropertiesPanelSection` tienen consumidores fuera del frontend (`element-kit`, `editor-shared`): S1 los reexporta/adapta, no los rompe.

**Orden / dependencias:**
```
S1 ─→ S2 ─→ S3 ─┐
 │     ├──→ S4 ─┤
 │     └──→ S5 ─┤
 ├─→ S6 ─→ S7 ─┤
 │     ├──→ S8 ─┼─→ S11
 │     └──→ S9 ─┤
 └──→ S10 ──────┘
```
S3, S4 y S5 tocan archivos disjuntos tras S2; S7, S8 y S9 tocan archivos disjuntos tras S6; S10 depende solo de S1. Pueden ir en paralelo (Regla 10, Concurrencia) una vez `hecho` su precondición.

**Fuera de alcance:** rediseñar el catálogo de elementos o sus iconos; cambiar textos de ayuda; el viewer del alumno; la barra flotante y la barra de herramientas superior; la pestaña «Animaciones» (`animation-panel.tsx`, 36 líneas); mover elementos entre paneles; «Próximamente» de widgets más allá de plegarlo.

#### S1 — Componente `CollapsibleSection` en `@lumina/ui`
- **Operador:** Claude Code
- **Estado:** en revisión — `CollapsibleSection` en `packages/ui/src/collapsible-section.tsx` (+ `readStoredOpen`/`writeStoredOpen`, que nunca lanzan); `InspectorSection` delega en él (5 usos intactos). Spec `editor-shared/src/collapsible-section.spec.ts` (10 pruebas): render inicial en servidor (`aria-expanded`, contenido ausente al cerrar, `badge`, `storageKey` sin `localStorage`) y storage con `Storage` falso (prefijo, valores inválidos, storage que lanza). Verif: `@lumina/ui` build y lint, `@lumina/editor-shared` test (tsc + vitest 362 verdes), lint 0 errores, build. **Limitaciones:** (1) `editor-shared` corre vitest en entorno `node` sin jsdom ni testing-library, así que **no hay pruebas de clic/Enter ni de persistencia al alternar ni de `forceOpen`** (efectos); agregarlas exige sumar dev-dependencies y cambiar `vitest.config.ts` (fuera del alcance de la ficha) o moverlas a `element-kit`. (2) El título del encabezado pasa de 10 px a 11 px por DS1 (la ficha pedía «misma apariencia»). (3) Sin comprobación visual en el editor ni typecheck de `element-kit`/`lumina-frontend` (consumen `InspectorSection` sin cambio de firma).
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `packages/ui/src/collapsible-section.tsx` (nuevo) + export en `packages/ui/package.json` si el patrón del paquete lo exige; `packages/editor-shared/src/typography-inspector.tsx` **solo** la función `InspectorSection` (pasa a delegar en `CollapsibleSection`, misma apariencia y mismos `defaultOpen`). **NO** toca `element-kit` ni el frontend.
- **Entregable:** `CollapsibleSection` según DS1–DS4, sin dependencia de `localStorage` cuando falta `storageKey`. Pruebas en `editor-shared` (el paquete `@lumina/ui` no tiene runner): abre/cierra con clic y Enter/Espacio, `aria-expanded`, recuerda el estado con `storageKey`, funciona con `localStorage` que lanza, `forceOpen`, `badge`. Verificación: `pnpm --filter @lumina/ui build && pnpm --filter @lumina/ui lint && pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/editor-shared lint`.
- **Cierre:** `InspectorSection` deja de duplicar lógica (queda como envoltorio de una línea o se reemplaza por el componente nuevo en sus 5 usos).

#### S2 — Partir `flyout-left-panels.tsx` (sin cambio de comportamiento)
- **Operador:** Claude Code
- **Estado:** en revisión — `flyout-left-panels.tsx` pasa de 2172 a 142 líneas (interfaces + `switch` + re-export de los tipos `IaPanelCurricularContext`/`SaveContextoClaseInput`, para no tocar a los importadores). Nuevos: `panel-shared.tsx` (`PanelSection`, `InsertBtn`, `TagListEditor`, tipo `ContentPanelProps`), `elementos-panel.tsx`, `fondo-panel.tsx`, `ia-panel.tsx` (con los tipos curriculares y los builders de slide IA), `paginas-panel.tsx`. División mecánica por rangos de línea: comprobado que el multiconjunto de líneas de código (sin imports) es idéntico al original salvo el comentario `// ─── Panels` y el re-export. Verif: `tsc --noEmit` del frontend sin errores, eslint de `editor/` 0 errores (27 warnings, los `useMemo` de `ia-panel` y similares preexistentes), `test:unit` 519 verdes. `paginas-panel.tsx` importa el tipo `FlyoutLeftPanelsProps` de `flyout-left-panels.tsx` (ciclo solo de tipos, borrado al compilar). Sin comprobación visual en el editor. **Nota:** S1 seguía `en revisión` al empezar; se arrancó S2 por pedido expreso del dueño.
- **Precondición:** S1 `hecho`.
- **Alcance — PUEDE tocar:** `lumina-frontend/.../panels/flyout-left-panels.tsx` y archivos nuevos hermanos: `elementos-panel.tsx`, `fondo-panel.tsx`, `ia-panel.tsx`, `paginas-panel.tsx`, `panel-shared.tsx` (`PanelSection`, `InsertBtn`, `TagListEditor`). Se conserva el export `FlyoutLeftPanels` y sus props. **NO** cambia JSX interno, textos ni estilos.
- **Entregable:** el archivo original queda solo con el `switch` de `FlyoutLeftPanels` y las interfaces; cada panel en su archivo. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit` y `pnpm --filter lumina-frontend exec tsc --noEmit`; el diff de los componentes movidos es solo de ubicación.
- **Cierre:** el archivo viejo no conserva copias de los componentes movidos.

#### S3 — Panel «Elementos» plegable
- **Operador:** Claude Code
- **Estado:** en revisión — Elementos con secciones plegables y recordadas (`storageKey` `elementos.*`): **abiertas** Imágenes, Gráficos de Datos (7 + 5 plantillas en el badge), Multimedia (2) y Estructura (4, ahora en grilla de 2 columnas); **cerradas** Diagramas (las 8 grillas fundidas en una, con el arreglo `DIAGRAMAS`; badge **17**, no 18 como decía el análisis), Química (con sub-secciones «Ecuaciones rápidas (mhchem)» y «Plantillas de slide (CN-7)» cerradas), Máscaras de recorte (badge 9) y «Plantillas Pedagógicas» (sub-sección de Gráficos). `PanelSection` ahora envuelve `CollapsibleSection` con `storageKey`/`defaultOpen`/`badge` opcionales. Spec nuevo `panels/elementos-panel.spec.ts` (6 pruebas, render en servidor: qué secciones arrancan abiertas/cerradas, conteo, aviso de actividad). Verif: `tsc --noEmit` sin errores, eslint de `editor/` 0 errores (27 warnings preexistentes), `test:unit` 525 verdes. **Desvíos / limitaciones:** (1) el ⓘ de Máscaras estaba junto al título y un botón no puede ir dentro del encabezado: pasó a una línea «Cómo funcionan ⓘ» dentro de la sección; (2) `PanelSection` es compartido: «Temporizador (en vivo)» de Páginas (S5) queda plegable pero abierto, y con el título en 11 px de DS1; (3) los títulos de Imágenes y Máscaras pasan de `text-[10px]` a 11 px; (4) sin pruebas de clic/persistencia (el entorno de los specs del frontend es `node`, igual que en S1) ni comprobación visual en el editor.
- **Precondición:** S2 `hecho`.
- **Alcance — PUEDE tocar:** `panels/elementos-panel.tsx`, `panels/panel-shared.tsx` (`PanelSection` pasa a envolver `CollapsibleSection`), `panels/images-element-panel.tsx`, `panels/clip-masks-panel.tsx`. **NO** toca el catálogo de gráficos/diagramas/química ni `flyout-left-panels.tsx`.
- **Entregable:** secciones con `storageKey` `elementos.<id>` y estos `defaultOpen`: **Imágenes** abierta; **Gráficos de datos** abierta (grilla de 7 abierta, «Plantillas pedagógicas» como sub-sección cerrada); **Diagramas** cerrada, con las 8 grillas consecutivas fundidas en una sola `grid-cols-2`; **Química** cerrada con sub-secciones «Ecuaciones rápidas» y «Plantillas de slide» cerradas; **Máscaras de recorte** cerrada; **Multimedia** abierta; **Estructura** abierta en grilla de 2 columnas. Cada encabezado muestra un `badge` con el conteo de elementos. Aviso ámbar «Solo puedes agregar texto…» sigue visible. Pruebas: render del panel con secciones abiertas/cerradas y conteos. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit`, más comprobación visual en el editor.

#### S4 — Widgets y Actividades en acordeón
- **Operador:** Cursor
- **Estado:** [en curso: Claude Code]
- **Precondición:** S2 `hecho`.
- **Alcance — PUEDE tocar:** `panels/widgets-insert-panel.tsx`, `panels/widget-panel-catalog.ts` (solo etiquetas de grupo si hace falta), `panels/activities-panel.tsx`, `lumina-frontend/.../draggable-widget-item.tsx` y `draggable-activity-item.tsx` (solo densidad/ancho). **NO** toca `flyout-left-panels.tsx`.
- **Entregable:** (a) Widgets: cada grupo de `WIDGET_PANEL_GROUP_ORDER` es una `CollapsibleSection`; «Próximamente» pasa a una sección **cerrada** con sus 5 botones. (b) Actividades: `GRUPO4` recibe título «Juegos»; acordeón de un solo grupo abierto a la vez, con «Evaluación» abierto por defecto; el arrastre sigue funcionando con el grupo abierto. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit` (incluye `widget-panel-catalog.spec.ts`), más comprobación visual y de arrastre en el editor.

#### S5 — Paneles IA, Diseño y Páginas
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** S2 `hecho`.
- **Alcance — PUEDE tocar:** `panels/ia-panel.tsx`, `panels/fondo-panel.tsx`, `panels/paginas-panel.tsx`, `design-background-popover.tsx`, `gradient-stop-bar-editor.tsx`. **NO** toca el catálogo curricular ni `flyout-left-panels.tsx`.
- **Entregable:** IA: tema y nivel abiertos; plantilla, área y grado en «Opciones avanzadas» cerrada (misma lógica y valores por defecto); Páginas: «Temporizador (en vivo)» cerrada con `badge` si hay tiempo configurado; Diseño: tipos de fondo y editor de degradado en secciones, la activa abierta. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit`.

#### S6 — Partir `properties-panel.tsx` (sin cambio de comportamiento)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** S1 `hecho`.
- **Alcance — PUEDE tocar:** `panels/properties-panel.tsx` y archivos nuevos hermanos: `properties-panel-actividades.tsx` (las ramas `block.tipo === 'actividad'`), `properties-panel-widgets.tsx` (las ramas de widgets), `properties-panel-motor.tsx` (`BlockEstadoInicialSection`, `BlockRotationSection`, `motorSections`). Se conserva el export `PropertiesPanel` y sus props. **NO** cambia JSX, textos ni estilos.
- **Entregable:** `PropertiesPanel` queda como cascarón (cabecera, pestañas Propiedades/Animaciones, despacho por tipo); la cabecera `<h2>` repetida en 15 ramas se centraliza en un componente `PropertiesHeader` (mismo markup). Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit && pnpm --filter lumina-frontend exec tsc --noEmit`.
- **Cierre:** el archivo viejo no conserva copias de las ramas movidas.

#### S7 — Secciones comunes (`motorSections`, widgets y apariencia)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** S6 `hecho`.
- **Alcance — PUEDE tocar:** `panels/properties-panel-motor.tsx`, `panels/block-states-section.tsx`, `packages/editor-shared/src/widget-properties-panel.tsx` (`WidgetPropertiesPanelSection`, `WidgetPropertiesPanelBlock`), `packages/editor-shared/src/widget-appearance-fields.tsx` (`WidgetAppearanceSection`). **NO** toca los archivos `*-properties.tsx` de cada elemento.
- **Entregable:** «Estado inicial», «Estados» y «Rotación» como `CollapsibleSection` **cerradas** con `badge` («N estados» / «0°»), abiertas por `forceOpen` si el bloque ya tiene valores; `WidgetPropertiesPanelSection` acepta `title`/`defaultOpen` opcionales y, sin ellos, se comporta como hoy (sin romper a flip-cards, tabs, carousel, timeline, hotspot, popup y click-reveal). Verificación: `pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/editor-shared lint && pnpm --filter lumina-frontend lint && pnpm --filter @lumina/element-kit test`.

#### S8 — Propiedades del Gráfico
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** S6 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/blocks/grafico/grafico-properties.tsx` y sus specs (`grafico-properties.*.spec.tsx`). **NO** toca `grafico-data-dialog.tsx` ni el modelo de datos.
- **Entregable:** los 4 bloques con `border-t` pasan a secciones: **Datos** (abierta), **Apariencia** (paleta, esquinas, fuente, fondo, sombra, animación; abierta), **Leyenda y etiquetas** (cerrada), **Ejes** (cerrada: grilla, rangos, títulos, rotación, escala), **Referencias** (cerrada: líneas y bandas), **Avanzado** (cerrada: bins, interpolación, apertura, apilado, orden, sparkline). Una sección sin campos para el tipo de gráfico actual no se muestra. Specs adaptados (abrir sección). Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación visual con al menos columna, línea, donut e histograma.

#### S9 — Propiedades del Diagrama, Popup y widgets restantes
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** S6 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/blocks/diagrama/diagrama-properties.tsx`, `packages/element-kit/src/widgets/{popup,flip-cards,timeline,click-reveal,hotspot,carousel,tabs}/*-properties.tsx` y sus specs. **NO** toca `grafico-properties.tsx` ni `widget-properties-panel.tsx`.
- **Entregable:** Diagrama: los 3 colapsables actuales y los bloques en `border-t` (líneas ~851, 911, 1026) quedan en un único `CollapsibleSection`; Popup: partido en secciones (disparador, contenido, modal, apariencia) con la primera abierta; Flip-cards, timeline, click-reveal, hotspot: lista de ítems como sección con `badge` de conteo. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación visual por elemento.

#### S10 — Paneles derechos de lista (Interacciones, Variables, Temas)
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** S1 `hecho`.
- **Alcance — PUEDE tocar:** `panels/interactions-panel.tsx`, `panels/variables-panel.tsx`, `panels/themes-panel.tsx`, `panels/math-generator-panel.tsx`, `panels/live-responses-panel.tsx`. **NO** toca `rule-builder/` ni `properties-panel.tsx`.
- **Entregable:** Temas: el formulario `CustomThemeForm` en sección cerrada y encabezados con el estilo de DS1 (hoy `text-xs font-medium uppercase` aparte); Interacciones y Variables: lista y editor en secciones, con el editor abierto al crear o editar (`forceOpen`); el generador de matemáticas y las respuestas en vivo adoptan el componente nuevo en lugar de sus colapsables propios. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit`.

#### S11 — Buscador, unificación de encabezados y barrido final
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** S3–S5 y S7–S10 `hecho`.
- **Alcance — PUEDE tocar:** `panels/elementos-panel.tsx`, `panels/activities-panel.tsx`, `panels/widgets-insert-panel.tsx` (solo agregar el campo de búsqueda), un componente `PanelSearch` en `panel-shared.tsx`, y los encabezados sueltos que el escáner marque. **NO** amplía el alcance de fichas anteriores.
- **Entregable:** campo de búsqueda al inicio de Elementos, Widgets y Actividades; filtra por etiqueta, oculta secciones sin coincidencias y abre las que tienen (`forceOpen`, DS4); sin resultados muestra un estado vacío. Barrido: contar `grep -rn "uppercase tracking-wider" --include=*.tsx` antes/después fuera de `CollapsibleSection` y dejar en la ficha el conteo; lo que quede fuera de `CollapsibleSection` debe ser un título de panel (`<h2>`) o estar justificado. Verificación: `pnpm -r lint && pnpm -r test`, más comprobación visual del flujo completo (buscar «venn», abrir sección, insertar).
