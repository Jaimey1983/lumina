# Etapa V — Diagramas: corregir lo roto, tema de cuatro piezas y capacidades

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa V — Bloque `diagrama` (visual, layout, exportación y formas)

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `V1.1–V4.3` (no `L.n`, no `N.n`, no `Q.n`). Redactada el 2026-10-15 a partir de dos análisis hechos con el dueño: (a) lectura del código de diagramas, (b) **peritaje de EdrawMax 14.5.4 contra Lumina** — `PERITAJE_EDRAWMAX_VS_DIAGRAMAS.md` en la raíz (secciones y hallazgos `D1–D9` citados abajo). Los hallazgos `D1` y `D2` se reconfirmaron en el código al redactar; `D3–D9` se toman del peritaje y **hay que re-medirlos al tomar cada ficha**.

**Por qué existe:** «todos los diagramas se ven iguales» y el bloque promete más de lo que renderiza. Causas medidas:
- El estilo solo toca el **contorno**: el relleno es siempre `bg-card`; las 10 paletas de `diagrama-temas.ts` solo cambian el color del borde. EdrawMax usa un tema de **cuatro piezas** coordinadas (color + efecto de forma + texto + conector; 49 temas, 84 paletas, 56 efectos, 45 conectores).
- **Defectos reales** (peritaje §7): `ancho`/`alto` se pierden dos veces (`sanitizeNodos`, `diagrama-defaults.ts:132-142`, y `graphNodeToRF`, `lumina-rf-bridge.ts:56-77`), por lo que **pirámide, embudo y cebolla se dibujan mal** (3 de 17 plantillas); `rect`/`ellipse`/`hexagon`, `orthogonal` y `flechaInicio` están en los tipos sin render; `direccionLayout`/`densidad`/`tema`/`animacionEntrada` se guardan y nadie los lee; el layout siempre es `TB`.
- Sin exportación, sin redimensionado, sin puntuación (Venn guarda `regionId` pero no puntúa).

**Decisiones de diseño (DV1–DV6), fijadas por esta raíz; el operador no las reabre:**
- **DV1. No se construye un motor tipo EdrawMax.** Se descarta el modelo ShapeSheet con fórmulas (peritaje §8): beneficio docente marginal, costo alto. Tampoco se reemplaza `@xyflow/react` (pan/zoom/arrastre/conexión ya resueltos). Se agregan capas finas sobre él, en este orden: arreglar lo roto → tema → dirección/exportación → registro ligero de formas.
- **DV2. Esquema aditivo, cero migración.** Todo campo nuevo es opcional con defaults en `normalizeDiagramaBlock` (único escritor canónico). Un bloque guardado antes de esta etapa se ve **igual** que antes salvo donde V1.1 corrige un defecto (pirámide/embudo/cebolla) y donde una ficha lo declare.
- **DV3. Colores por token, no por hex.** Todo color nuevo sale de `var(--…)` o `color-mix(...)` sobre el acento; los hex fijos existentes del lienzo (`#9CA3AF`, `#6B7280` en `lumina-rf-bridge.ts`, `rgba()` de `diagrama-regions.ts`) se reemplazan cuando la ficha lo diga. Debe verse bien en claro y oscuro.
- **DV4. `graph-core` es compartido** (Historia ramificada y Mapa de progreso Edu lo consumen). Todo cambio en `packages/editor-shared/src/graph-editor/` se hace **por `meta`/`variant` opcional**; sin `meta` nueva el render es el de hoy. Cada ficha que lo toque corre los specs de ambos consumidores.
- **DV5. Paridad antes de borrar (Regla 7).** Cada forma o trazado que se mueve de lugar (V4.1) lleva prueba de paridad contra el render actual.
- **DV6. Dependencias nuevas requieren decisión del dueño.** Ninguna ficha de esta etapa agrega una dependencia sin que la ficha la nombre; si hace falta una no prevista, el operador para (`bloqueado`).

**Orden / dependencias:**
```
V1.1 ─→ V1.2 ─→ V1.3 ─→ V1.4 ─→ V2.1 ─→ V2.2 ─┐
                                   └─→ V2.3 ─┼─→ V2.4 ─→ V3.1 ─→ V3.2
                                                                   └─→ V4.1 ─→ V4.2 ─→ V4.3
```
V1.1–V1.4 tocan archivos que se solapan (`diagrama-defaults.ts`, `lumina-rf-bridge.ts`, `diagrama-shape-node.tsx`, `diagrama-properties.tsx`): **van en serie** (Regla 10, Concurrencia). V2.2 y V2.3 tocan archivos disjuntos tras V2.1 y pueden ir en paralelo. V3.2 y V4.1 pueden ir en paralelo tras V3.1 si sus conjuntos de archivos siguen disjuntos al re-medir.

**Fuera de alcance (pendiente para una etapa posterior):** contenedores y carriles (swimlane), multi-selección + alinear/distribuir + `snapToGrid`, más de 4 puntos de conexión por forma, saltos de línea en cruces, datos tipados por nodo (organigrama con foto/cargo), generar diagramas con IA (reutiliza Etapa J), tooltip/expansión del texto truncado (`D8`), `window` events de teclado (`D5`), Venn de 4 conjuntos, import `.vsdx`, cualquier copia de geometrías, plantillas o temas de EdrawMax (material propietario: el peritaje sirve para entender el modelo, no para copiar).

---

## V1 — Corregir lo que está roto

#### V1.1 — Conservar `ancho`/`alto` de punta a punta (D1)
- **Operador:** Claude Code
- **Estado:** en revisión — `ancho`/`alto` ahora sobreviven de punta a punta: `sanitizeNodos` los conserva (`positiveSize`: número finito > 0, redondeado; lo demás se descarta), `diagramaToGraphModel` los pasa en `meta`, `graphNodeToRF` los copia a `data` (solo si son numéricos) y `DiagramaShapeNode` los aplica también en `root`/`chip`/`rounded` cuando existen (sin `ancho` el render es el de hoy). **Hallazgo adicional:** `applyGraphModelToDiagrama` (`diagrama-bridge.ts`) reconstruía los nodos tras cada arrastre sin `ancho`/`alto`, así que se perdían a la primera edición aunque los defaults los tuvieran; ahora los conserva del nodo original. Pruebas nuevas: 5 en `diagrama-defaults.spec.ts` (plantillas pirámide/embudo/cebolla con `ancho`; cebolla con `alto` = `ancho`; pirámide crece cúspide→base hasta `data` del nodo RF; mover un nodo no pierde tamaño; saneo de inválidos/redondeo) y 1 en `lumina-rf-bridge.spec.ts`; **5 de ellas fallan sin el arreglo y pasan con él**. Verif: `tsc --noEmit` + `vitest` de `@lumina/element-kit` (2621 pruebas, las 2 que fallaron en la primera corrida eran una aserción mía demasiado estricta —pirámide/embudo no declaran `alto`—, ya corregida; `src/blocks/diagrama` 44/44), `@lumina/editor-shared` test 384 verdes; lint de ambos 0 errores. **Limitaciones:** (1) sin comprobación visual de las 3 plantillas en el editor (no hay frontend levantado en esta sesión); (2) no se re-corrieron los specs completos de Historia ramificada ni Mapa Edu en el frontend: el cambio en `graphNodeToRF` solo agrega `ancho`/`alto` a `data` cuando `meta` los trae numéricos, y esos consumidores no los envían; (3) la altura de pirámide/embudo sigue siendo la natural de la forma (las plantillas no declaran `alto`; el redimensionado es V4.2).
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/blocks/diagrama/diagrama-defaults.ts` (solo `sanitizeNodos`), `diagrama-bridge.ts` (pasar `ancho`/`alto` en `meta`), `packages/editor-shared/src/graph-editor/lumina-rf-bridge.ts` (solo `graphNodeToRF`: copiar `ancho`/`alto` a `data`), `diagrama-shape-node.tsx` (las ramas `trapezoid`, `triangle`, `inverted-trapezoid`, `circle` ya leen `nodeData.ancho`; `rounded`/`root`/`chip` los usan solo si existen), sus specs. **NO** toca el catálogo de plantillas ni layouts (`layoutPiramide/Embudo/Cebolla` ya calculan los valores correctos).
- **Entregable:** `sanitizeNodos` conserva `ancho`/`alto` si son números finitos > 0 (cualquier otro valor se descarta). Prueba de round-trip `DiagramaNodo → GraphNode → nodo RF → data` que **falla antes y pasa después**, para pirámide, embudo y cebolla (`createDefault*` → `ancho` no nulo en cada nodo). Los bloques sin `ancho` renderizan idéntico a hoy (DV2). Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter @lumina/editor-shared test && pnpm --filter @lumina/editor-shared lint`, más comprobación visual de las 3 plantillas.
- **Cierre:** ninguno (corrección de defecto).

#### V1.2 — Formas, trazado y flecha prometidos sin render (D3)
- **Operador:** Claude Code
- **Estado:** [en curso: Claude Code] (V1.1 seguía `en revisión`; se arrancó por pedido expreso del dueño)
- **Precondición:** V1.1 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-shape-node.tsx` (ramas nuevas `rect`, `ellipse`, `hexagon`), `diagrama-properties.tsx` (`FORMAS_CONFIG`: sumar los 3 botones), `packages/editor-shared/src/graph-editor/graph-canvas.tsx` (arista: trazado `orthogonal`), `lumina-rf-bridge.ts` (`graphEdgeToRF`: `markerStart` cuando `flechaInicio`), `packages/types/src/slide.types.ts` **solo** si hay que quitar un valor del tipo, y sus specs. **NO** cambia el aspecto de las 11 formas actuales.
- **Entregable:** (a) `rect`, `ellipse`, `hexagon` con render real y botón en el selector de forma; (b) `orthogonal` produce un trazado en ángulo recto (esquinas vivas, distinto de `smoothstep` con r=8); (c) `flechaInicio` pinta el marcador de inicio. **Regla de honestidad:** si una de las tres piezas se descarta, se **quita del tipo y del normalizador** en el mismo PR — ningún valor queda declarado sin render. Pruebas: render de cada forma/trazado y del marcador. Verificación: la de V1.1 más `pnpm --filter lumina-frontend test:unit` si se toca algún consumidor del frontend; specs de Historia ramificada y Mapa Edu en verde (DV4).
- **Cierre:** ninguno.

#### V1.3 — Dirección de layout real y una sola función dagre (D4, D6)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V1.2 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-properties.tsx` (hoy 3 copias del bloque «nodos → GraphNode → dagre → posMap»; el ternario muerto `'TB' : 'TB'` de la línea ~525), `layout-dagre.ts` (solo si hace falta exponer `computeDagreLayout` con `rankSep`/`nodeSep`), un helper nuevo `aplicarDagre(block, opts)` junto al bloque `diagrama`, sus specs. **NO** cambia el resultado visual: sigue siendo `TB` en todos los subtipos (la dirección configurable es V3.1).
- **Entregable:** una función `aplicarDagre` usada en los 3 sitios; el ternario muerto desaparece. Prueba de que el resultado de los tres caminos es idéntico al actual (mismas posiciones, dado el mismo bloque). Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`.
- **Cierre:** las 2 copias sobrantes del bloque dagre se borran en este PR.

#### V1.4 — Cambiar de subtipo no pisa `dirigida` por arista (D9)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V1.3 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-properties.tsx` (`handleSubtipoChange`) y su spec (`diagrama-properties.regresion.spec.tsx` o nuevo). **NO** toca los defaults de plantillas.
- **Entregable:** al cambiar de subtipo se re-aplica el layout pero `dirigida` se conserva en las aristas que ya existían; las aristas nuevas toman el valor por defecto del subtipo. Prueba: bloque con una arista dirigida y otra no, cambio `flujo → mapa_mental → flujo`, ambas conservan su valor. Verificación: la de V1.3.
- **Cierre:** ninguno.

---

## V2 — Tema de cuatro piezas (la mayor diferencia de apariencia)

El tema de EdrawMax = `ThemeColor + ThemeEffect + ThemeText + ThemeConnector` (peritaje §2.2). Aquí: **color** = las 10 paletas existentes; **efecto** = relleno + sombra del nodo; **texto** = color y escala; **conector** = trazado, grosor, patrón y color por defecto de las aristas.

#### V2.1 — Modelo del tema y normalizador
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V1.4 `hecho`.
- **Alcance — PUEDE tocar:** `packages/types/src/slide.types.ts` (`DiagramaOpciones`: campo opcional `estilo?: { relleno?: 'contorno'|'tintado'|'solido'; sombra?: boolean; conector?: { trazado?; grosor?; patron? } }` — nombres exactos a fijar al implementar, siempre opcionales), `diagrama-temas.ts` (resolver `resolverEstiloDiagrama(opciones, subtipo)` con defaults por subtipo), `diagrama-defaults.ts` (**solo** el saneo de `opciones.estilo`, valores desconocidos → default), sus specs. **NO** toca render todavía.
- **Entregable:** el resolver devuelve, por nodo y por arista, los valores efectivos (relleno, texto, sombra, trazado, grosor, patrón). Con `opciones.estilo` ausente reproduce **exactamente** el look actual (relleno `contorno`, DV2). Pruebas de saneo y de defaults por subtipo. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter @lumina/types build`.
- **Cierre:** ninguno.

#### V2.2 — Nodos con relleno tintado y texto del tema
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V2.1 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-shape-node.tsx`, `lumina-rf-bridge.ts` (`graphNodeToRF`: pasar el estilo resuelto en `data`), `diagrama-bridge.ts`, sus specs. **NO** toca aristas ni Venn.
- **Entregable:** las 11+ formas leen relleno/sombra/color de texto del estilo resuelto: `tintado` = `color-mix(in srgb, <acento> 14%, var(--card))`, `solido` = acento con texto de contraste automático, `contorno` = hoy. Legible en claro y oscuro (DV3). Prueba por forma × relleno (snapshot de estilos computados, no de píxeles). Verificación: la de V2.1 más comprobación visual de las 17 plantillas en claro y oscuro.
- **Cierre:** ninguno.

#### V2.3 — Aristas y Venn por tema (sin hex fijos)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V2.1 `hecho`.
- **Alcance — PUEDE tocar:** `lumina-rf-bridge.ts` (`graphEdgeToRF`: color por defecto `#9CA3AF` y `labelStyle` `#6B7280` → tokens; defaults de trazado/grosor/patrón desde el estilo resuelto), `graph-canvas.tsx` (aristas), `diagrama-regions.ts` y `venn-svg.tsx` (los `rgba()` fijos pasan a derivarse de la paleta del bloque; nombres de conjunto «A/B/C» **editables**, D7), sus specs. Cambios en `graph-editor/` solo por `meta` opcional (DV4).
- **Entregable:** aristas y etiquetas legibles en oscuro; el conector por defecto sigue el tema; Venn usa la paleta del bloque y permite renombrar conjuntos (campo opcional en `regiones`/`conjuntos`, default «A/B/C»). Pruebas de color por token, de nombres de conjunto, y no-regresión de Historia ramificada y Mapa Edu. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/editor-shared test` y lint de ambos.
- **Cierre:** los hex fijos de arista y Venn se borran en este PR.

#### V2.4 — Panel: sección «Estilo»
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V2.2 y V2.3 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-properties.tsx` (nueva `CollapsibleSection` «Estilo», `storageKey` `diagrama.estilo`, `defaultOpen` cerrada; junto a la de paleta), `diagrama-properties.regresion.spec.tsx`. Ayuda larga tras ⓘ (etapa R); secciones plegables (etapa S). **NO** reordena ni renombra las secciones existentes.
- **Entregable:** controles de relleno (contorno / tintado / sólido), sombra, y conector (trazado, grosor, patrón) que escriben `opciones.estilo` con una sola confirmación al editar (nunca por fotograma). Prueba del panel (abre la sección, cambia el relleno, el bloque se actualiza). Verificación: la de V2.3 más comprobación visual del flujo completo.
- **Cierre:** ninguno.

---

## V3 — Dirección de layout y exportación

#### V3.1 — `direccionLayout` y `densidad` activos (D2)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V2.4 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-properties.tsx` (selector TB/LR/BT/RL/radial + densidad en la sección de disposición), `aplicarDagre` (V1.3: leer `direccionLayout` y mapear `densidad` → `rankSep`/`nodeSep`), `diagrama-editor.tsx` si hace falta reencuadrar, specs. **NO** toca los layouts pedagógicos (`layout-pedagogico.ts`).
- **Entregable:** «Organizar» respeta la dirección y la densidad elegidas; `radial` delega en `layoutRadial`; subtipos con layout propio (cuadrantes, pirámide, ciclo…) **ignoran** la dirección y el panel la deshabilita para ellos. Pruebas: mismo bloque con `TB` vs `LR` produce ejes intercambiados. `tema` y `animacionEntrada` (también muertas, D2): se **implementan o se quitan** del tipo y del normalizador en este PR — la ficha obliga a elegir, no a dejarlas guardadas sin efecto. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`.
- **Cierre:** la opción que no se implemente se borra del tipo (Regla 4: no quedan opciones declaradas sin efecto).

#### V3.2 — Exportar el diagrama a PNG/SVG
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V3.1 `hecho`.
- **Alcance — PUEDE tocar:** un módulo nuevo de exportación junto al bloque `diagrama`, el menú/botón en `diagrama-properties.tsx` (o el patrón que ya use `grafico-properties.tsx` con `exportarImagen`), specs. **Antes de escribir código**, re-medir cómo exporta el bloque `grafico` (`exportarImagen`, `@lumina/charts`) y **reutilizar ese contrato**. Si la solución exige una dependencia nueva (p. ej. `html-to-image`), el operador **para** y deja `bloqueado` pidiendo la decisión del dueño (DV6).
- **Entregable:** botón «Exportar» (PNG y SVG) que genera el diagrama con tema y fondo opcional, sin los controles del lienzo. Prueba: la exportación produce un SVG con tantos nodos como el bloque. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación manual del archivo descargado.
- **Cierre:** ninguno.

---

## V4 — Registro ligero de formas, redimensionado y diagramas evaluables

#### V4.1 — Registro de formas (`ShapeDefinition` ligera)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V3.1 `hecho`.
- **Alcance — PUEDE tocar:** `diagrama-shape-node.tsx` (las ramas `if (forma === …)` pasan a una tabla), un archivo nuevo `diagrama-formas.ts` (registro `forma → { path(w,h), rectTexto(w,h) }`), `diagrama-properties.tsx` (`FORMAS_CONFIG` se deriva del registro), specs de paridad. **NO** agrega fórmulas, manijas ni geometría paramétrica (DV1): una forma = función `(w,h) → path SVG` + rectángulo de texto.
- **Entregable:** las 11+ formas viven en el registro; `DiagramaShapeNode` queda como un renderizador genérico. **Prueba de paridad (DV5):** para cada forma y varios `(w,h)`, el `path` y el rectángulo de texto coinciden con los del render viejo (misma entrada → misma salida visible). Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación visual de las 17 plantillas.
- **Cierre:** el JSX por forma de `diagrama-shape-node.tsx` se borra en este PR.

#### V4.2 — Redimensionar nodos con `NodeResizer`
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** V4.1 `hecho` (y V1.1: persiste `ancho`/`alto`).
- **Alcance — PUEDE tocar:** `diagrama-shape-node.tsx`/`diagrama-formas.ts`, `diagrama-editor.tsx` (confirmar con debounce ~300 ms o al soltar), `diagrama-bridge.ts`, specs. Cambios en `graph-editor/` solo por `meta` opcional (DV4).
- **Entregable:** con el bloque seleccionado, los nodos muestran asas de tamaño; el tamaño se guarda en `ancho`/`alto` (mínimos y máximos acotados) y las formas se redibujan con `path(w,h)`. Un solo `commit` por gesto, nunca por fotograma. Pruebas: round-trip del tamaño; el viewer del alumno respeta el tamaño guardado. Verificación: la de V4.1 más prueba manual.
- **Cierre:** ninguno.

#### V4.3 — Diagramas evaluables (ficha raíz — se redacta al cerrar V4.2)
- **Operador:** a asignar al redactarla
- **Estado:** pendiente — **ficha raíz, sin asignar**
- **Precondición:** V4.2 `hecho`.
- **Quién la redacta:** quien cierre V4.2, con el dueño del tablero (Regla 10: las fichas se redactan con el estado real del código).
- **Qué debe resolver (no se reabre el objetivo, sí el alcance):** la ventaja que EdrawMax no tiene (peritaje P-Lumina): diagramas que el alumno completa y se puntúan vía `@lumina/scoring`. Candidatos a decidir al redactar: Venn (ya guarda `regionId`), etiquetar partes de pirámide/cebolla/ciclo, completar un flujo. Debe definir: qué subtipos entran en la primera tanda, el modelo de «respuesta correcta» por nodo/región, cómo se conecta con la Etapa U y con el motor de interacción (Etapa K), y la prueba de paridad del viewer actual (los diagramas no evaluables no cambian).
- **Cierre:** al redactarla.
