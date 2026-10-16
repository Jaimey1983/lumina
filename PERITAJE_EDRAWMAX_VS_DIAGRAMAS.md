# Peritaje — EdrawMax 14.5.4 vs. Diagramas de Lumina

Fecha: 2026-10-15 · Alcance: instalación `C:\Program Files (x86)\EdrawSoft\EdrawMax` (588 MB, 5 753 archivos) contra el bloque `diagrama` de Lumina (`packages/element-kit/src/blocks/diagrama/`, `packages/editor-shared/src/graph-editor/`, panel `elementos-panel.tsx`).

> Este documento es un peritaje, no una regla: no modifica `AGENTS.md` (Regla 8). Complementa `PLAN_MEJORA_DIAGRAMAS.md` y `PLAN_ACCION_DIAGRAMAS_GRAFICOS.md`.

## 0. Método y límites (leer primero)

**Qué se hizo.** (a) Inventario de carpetas y formatos; (b) lectura del XML de librerías de formas, temas, conectores y ajustes; (c) apertura de `.eddx` (son ZIP) y medición sobre una **muestra aleatoria de 300 de 1 673** plantillas; (d) extracción de cadenas imprimibles de `EdrawMax.exe`, `ObjectModule.dll`, `BaseCore.dll`, `Importer.dll`, `Exporter.dll`, `edgraphics.dll` (UI, comandos, funciones de fórmula); (e) lectura completa del código de diagramas de Lumina; (f) una prueba ejecutada (spec temporal, ya borrada) para confirmar un defecto.

**Qué NO se hizo — y por qué importa.**
- **EdrawMax no se ejecutó.** Todo lo de comportamiento sale de datos y cadenas del binario. Lo que es *inferencia* está marcado como tal. No se midió latencia, fluidez de arrastre ni UX real.
- **Lumina no se vio renderizada.** La apariencia de Lumina se deduce del código (clases, SVG, paletas). No hay capturas. El editor exige login + backend; no se levantó.
- **Solo 11 de 329 librerías de formas están instaladas** (el resto se descarga en línea desde `library-max.xml`). El inventario de EdrawMax es por tanto *catálogo declarado* (329) vs. *contenido local* (11 librerías, ≈ 587 formas + 14 librerías de gráficos ECharts).
- Las plantillas y formas de EdrawMax son material propietario: sirven para **entender el modelo y fijar el listón**, no para copiar geometrías, temas ni plantillas.

## 1. Anatomía de la instalación

| Carpeta / archivo | Contenido | Lectura |
|---|---|---|
| `EdrawMax.exe` (69 MB) + Qt 5 (`Qt5*.dll`, `qtitanribbon.dll`) | App de escritorio nativa C++/Qt con cinta (ribbon) | Motor de dibujo propio, no web |
| `ObjectModule.dll` (12 MB), `BaseCore.dll`, `edgraphics.dll`, `cairo.dll` | Modelo de objetos, núcleo de formas/fórmulas, render (cairo + Qt) | El «cerebro» de forma+conector+tema |
| `Importer.dll`, `Exporter.dll`, `data_api.dll` | Importar `.vsdx` / exportar | Interop Visio |
| `libcef.dll`, `iframe/`, `echartsdk/`, `mathsdk*/` | Chromium embebido para ECharts, fórmulas matemáticas (EdrawMath), IA | Lo «moderno» es web incrustado |
| `library/` (68 MB, 84 archivos) | Librerías de formas `.edt` (XML) + iconos `.edl` | 329 declaradas, 11 locales |
| `templates/edraw-templates/` (167 MB) | **1 673 `.eddx`** en 29 categorías | Plantillas de partida |
| `config/` (22 MB) | Temas, paletas, efectos, conectores, mapas mentales, org-chart, ajustes | El sistema de diseño |
| `gallery/` (1 325), `marks/` (169), `texture/` (100), `patterns.xml` (81 tramas) | Miniaturas, símbolos de marca, texturas, rellenos de patrón | Biblioteca visual |
| `charts/` | 22 SVG de gráficos (area, bar, column, funnel, gauge, line, pie, radar, scatter) | Gráficos aparte de los diagramas |
| `addin/` | Complemento de PowerPoint (x64/x86) | Salida a Office |
| `lang/`, `librarynames-*`, `LocalStrings_*`, `ShapeString-*` | 11 idiomas | i18n total |
| `update.xml` | versión **14.5.4**, 2025-07-07 | Edición actual |
| `settings.xml` | Idioma `es`, instalado 2025-09-10 | Es copia en español |

Categorías de plantilla (nº de `.eddx`): software-development 116, science 97, science-and-education 91, project-management 87, graphic-design 86, marketing 82, graphs-and-charts 77, industrial-engineering 76, flowchart 73, building-plan 71, basic-diagram 70, quality-management 64, strategy-and-planning 58, business-management 55, ui&ux 51, wireframe 51, electrical-engineering 48, graphic-organizer 46, analysis-canvas 38, form 37, network-diagram 30, infographic 30, mind-map 26, database-modeling 19, organizational-chart 18, cloud-service 14, crime-scene-images 14, map 11, card 137.

## 2. El modelo de datos de EdrawMax (lo más valioso del peritaje)

Un `.eddx` es un ZIP con `document.xml`, `pages/pageN.xml`, `theme.xml`, `rels/*`, `thumbnail.jpeg`. Cada página es una lista plana de `<Shape>` con **modelo tipo ShapeSheet de Visio**:

- **Transform**: `Width/Height/Angle/GPinX/GPinY/LocPinX/LocPinY/FlipX/FlipY`. Cada valor puede ser **constante o fórmula** (`V="120" M="1" R="0.5"` o `F="HYP(EndX-BeginX,EndY-BeginY)"`): `V` valor cacheado, `F` fórmula, `R` razón relativa al ancho/alto, `M` marca de eje.
- **CPoints**: puntos de conexión *definidos por la forma* (un rectángulo trae 4: izq/arr/der/abajo; otras formas traen más).
- **Geometries**: trayectos vectoriales reales (`MoveTo/LineTo/ArcTo/CubicBez/Ellipse/NURBS…`), con `NoFill/NoLine/Closed/NoSnap`.
- **Texts**: *varios bloques de texto por forma* (`T1`, `T2`…), cada uno con su propia transformación y alineación vertical.
- **ShapeFormat**: relleno (Solid / Gradient / SingleGradient / Hatch / Texture / None), línea (grosor, cap, patrón, flechas inicial y final con tamaño), efecto (sombra), `QuickMask` (qué atributos hereda del tema).
- **Colores con referencia a tema**: `ThemeColor="5" Shade="90" Tint="…"` — el color sigue al tema, no es un hex fijo.
- **Tipos de forma observados en la muestra de 300 plantillas** (57 k formas): `Shape` 42 900, `Group` 7 262, `TextBlock` 2 604, `ConnectLine` 1 696, `Rectangle` 399, `Line` 328, `Ellipse` 221, `Container` 129, `Image` 113, `FloorPlanWall` 101, `ActionPlanCard` 93, `MMConnector` 90, `FloorPlanDoor` 88, `SingleBlock` 84, `SmartShape` 77, `SubTopic` 62, `GuideLine` 58, `Table` 56, `OrgShape` 54, `MultiBlock` 50, `SwimLane` 44, `EDChart` 41, `MainTopic` 28, `TableUnit` 15, `Bezier` 9, `ContainerList` 3, `Matrix` 1, `Gantt` 1.
- **Funciones de fórmula** (frecuencia en la muestra): `HYP` 22 471, `GUARD` 14 117, `IFV` 8 248, `PNTX/PNTY` 3 600, `IF` 1 787, `SETF` 1 779, `TEXTHEIGHT/TEXTWIDTH` 810/552, `MIN/MAX`, `SHAPEINDEX`, `ELLIPSEPOINT`, `DOCMD`, `LOOKUP`… + `AUTOBEGINPNT/AUTOENDPNT/LOCPNT/PARPNT` en el binario. Es decir: **las formas son paramétricas** (al redimensionar, la geometría y los puntos de conexión se recalculan).

### 2.1 Conectores (ConnectLine)
- Pegado **dinámico y por fórmula**: `BeginX = PNTX(Parent.LOCPNT(ShapeN.PARPNT(ShapeN.CPoints.X4, …Y4)))` (pegado a un punto concreto) **o** `AUTOBEGINPNT(BeginTag,EndTag)` (el motor elige el punto de conexión más conveniente cada vez que algo se mueve). `BeginTag/EndTag = ShapeN.XTrans` = el id del extremo.
- `ConnectorLayout Relayout="TRUE" IgnoreJump Style="N"`: re-enrutado automático. En la muestra, `Style` 2: 1 073 (63 %), 0: 567 (33 %), 1: 56 (3 %). *(Inferencia, no verificada: 0/1/2 ≈ recto/curvo/ortogonal; el binario expone «Curve / Freeform / Straight connector tool».)*
- **Saltos de línea** al cruzarse: `JumpMode`, `JumpStyle`, `JumpSize` (ajustes por página).
- Flechas con **id y tamaño** por extremo; en la muestra se usan 13 ids distintos (0 = ninguna, 4 y 5 las dominantes), 8 patrones de línea (sólido, 5 variantes de guiones/puntos…).
- Conectores con tema propio: **45 `ThemeConnector`** (`config/max/PresetThemeConnectors.xml`) — grosor, patrón, flecha y color del conector forman parte del tema.
- Conectores de mapa mental propios (`MMConnector`), bloqueos (`LockConnector`, `RelatConnector`).

### 2.2 Temas (un tema = 4 sistemas coordinados)
`Theme` = `ThemeColor` + `ThemeEffect` + `ThemeText` + `ThemeConnector`. Inventario local: **49 temas** (`PresetThemes.xml`), **84 paletas** de color (cada una con 8 acentos × 2 esquemas), **56 efectos de forma** (relleno/línea/sombra por rol), **45 conectores**, fuentes por idioma, y temas específicos de mapa mental (**8** + `ThemeShapeStyle.xml` 2 599 líneas + `MindmapTheme.xml`). Cambiar de tema **recolorea y recompone todo el documento**; 22 banderas `Lock*` permiten excluir formas (`LockClrTheme`, `LockCntTheme`, `LockTextTheme`, `LockFormat`…).

### 2.3 Ajustes de interacción por defecto (`settings.xml`)
`SnapFlags 127` · `GridSnapDist 6` · `VertexSnapeDist 8` · `ConnectSnapeDist 10` · `AnchorSnapDist 18` · `GuideLineSnapDist 10` · `Angle15/10/5/1SnapDist` (imán angular escalonado 80/120/160/220) · `ConLineMinDis 6` · `HideCptsMinSize 21` (los puntos de conexión se ocultan en formas muy pequeñas) · `UndoLevel 60` · `AutoSaveElapse 600 s` · `RoundRadius 16` · `OrgVerDist/HorDist 16` · `mmMajor/mmMinor 20/10` · `DefaultCntEndHeadID 5`.

## 3. Funcionalidad de EdrawMax relevante a diagramas (por cadenas del binario)

| Área | Capacidades observadas |
|---|---|
| **Dibujo** | Rectángulo/elipse/polígono/estrella/hélice/arco/curva/línea libre/trazo a mano alzada, «Add Vector Text», cuentagotas/pincel de formato, **operaciones booleanas** (Union, Combine, Fragment, Intersect, Subtract), recorte a forma, enmascarado |
| **Conexión** | Herramientas de conector recto/curvo/libre/ortogonal, «Enable smart connection mode», «Add Connection Points Automatically», edición de puntos de conexión, «Convert to Connector», «Ignore Jump», «Change Connector style», conector por defecto configurable |
| **Organización** | Alinear (6) · distribuir (horizontal/vertical, filas/columnas, por centros/bordes) · agrupar/desagrupar · orden z (4) · bloquear (22 flags) · capas (insertar/borrar) · guías · cuadrícula dinámica · reglas · «Fit to ruler» |
| **Contenedores** | `Container`, `ContainerList`, `SwimLane` (insertar carril antes/después, borrar carril), `Table`/`TableUnit`, `Matrix`, «Icon Container», «Image Container» |
| **Diagramas inteligentes** | Mapa mental (cambiar layout/tema/forma/rama/numeración/posición de imagen del tópico), organigrama (asistente, importar datos, campos, foto, estilo de texto), Gantt (importar datos, ruta crítica, exportar), timeline, SmartShape (listas, pirámide, Venn, procesos, circulares) |
| **Datos** | «Define Shape Data», «Data Properties/Sheet/Tag», «Data Import Wizard», editor de fórmulas, hipervínculos, adjuntos, comentarios, notas |
| **Estilo** | Temas globales (4.2), «Beautify Style», estilos rápidos, degradado con paradas, línea degradada, sombra interior/exterior, 81 tramas, 100 texturas, estilos de mano alzada, Iconfont, fuentes-símbolo |
| **IA** | AI Diagramming, AI Flowchart, AI Mind Map, AI Timeline, AI Table, AI List, AI SWOT, AI PEST, AI Lean Canvas, AI User Profile, AI User Story, AI Analysis, AI Image/Symbol/Sticker; plantillas semilla en `config/aiexample/*.eddx` |
| **Presentación** | Diapositivas desde áreas de página, animación de conectores, pantalla completa, exportar a PPT |
| **Colaboración** | Nube personal/equipo/pública, versiones, comentarios, enlace compartido (ver/editar), exportar HTML |
| **Interop** | Importar `.vsdx`; exportar SVG, PDF, EMF, PPT, Excel, CSV (datos de tabla/gráfico/Gantt/org), HTML, grupo-objeto, fondo y cuadrícula opcionales |

## 4. Lumina — inventario de lo que hay

**Arquitectura.** `DiagramaBlock` (JSON) → `diagrama-bridge.ts` → `GraphModel` agnóstico → `lumina-rf-bridge.ts` → `@xyflow/react` (React Flow 12). Un solo escritor canónico (`normalizeDiagramaBlock`). Venn va aparte (SVG propio). Dagre (`@dagrejs/dagre`) para layout jerárquico.

| Dimensión | Lumina hoy |
|---|---|
| Tipos | **9 subtipos** (`mapa_mental, organigrama, mapa_conceptual, flujo, cronologia, piramide, embudo, cebolla, venn`) + 8 plantillas con layout propio → **17 entradas** en el panel «Diagramas» |
| Formas de nodo | **11** con render real: root, chip, rounded (tarjeta), diamond, pill, parallelogram, card-icon, trapezoid, triangle, inverted-trapezoid, circle. `rect`, `ellipse`, `hexagon` están en el tipo `DiagramaNodoForma` **sin render ni botón** (caen a la tarjeta) |
| Puntos de conexión | **4 lados fijos** (8 `Handle`: uno de entrada y otro de salida por lado), elegidos por geometría relativa al crear la arista |
| Trazados de arista | 3 efectivos: `straight`, `bezier`, `smoothstep` (esquinas r=8). `orthogonal` está en el tipo y cae a `smoothstep` |
| Aristas | etiqueta (pill), color, grosor, estilo de línea (3), flecha final; `flechaInicio` se guarda pero **no se renderiza** |
| Color / tema | 10 paletas × (acento + 6 colores) aplicadas por rama; 7 colores por nodo en el panel; fondo (puntos/cuadrícula/vacío); modo claro/oscuro vía tokens |
| Layouts | radial (mapa mental), ciclo, ishikawa, cuadrantes (frayer/2×2/T/KWL), pirámide, embudo, cebolla, cronología lineal restringida, dagre **solo TB** |
| Edición en lienzo | doble clic = editar texto, `NodeToolbar` (Editar / + Hijo / Borrar), `Tab`=hijo, `Enter`=hermano, arrastrar nodo (debounce 300 ms), arrastrar handle = nueva arista, Venn con DnD de chips a regiones |
| Edición en panel | tipo, paleta, plantillas, esquema por sangría → árbol, título, A11y, lista de nodos (etiqueta, cuerpo, color, forma), lista de conexiones (etiqueta, trazado) |
| Accesibilidad | `descripcionAccesible` sr-only; Venn `aria-hidden`; sin navegación por teclado entre nodos |
| Salida | Solo visor in-slide. **Sin exportar** |

## 5. Contraste — apariencia

| Aspecto | EdrawMax | Lumina | Brecha |
|---|---|---|---|
| Gramática visual | Forma vectorial con relleno degradado (26 % de las formas de la muestra), contorno fino (1 pt), sombra casi nula (0,35 %), texto 10 pt, colores de acento ligados a tema | Tarjeta blanca con borde 2 px de color, chip/píldora, badge de etiqueta, `shadow-xs`, tipografía `text-xs` | Lumina se ve como «UI de aplicación», Edraw como «documento gráfico». Lumina está más cerca de Notion/Whimsical que de un diagramador técnico — **es coherente con su público docente** |
| Colores | 84 paletas × 8 acentos, relleno + línea + texto derivan del tema | 10 paletas, solo el color de borde/acento; relleno siempre `bg-card` | Edraw colorea *relleno y texto*; Lumina solo contorno. Los fondos tintados (`color-mix`) existen solo en trapecio/triángulo/círculo |
| Formas | 587 locales / ≈ 8 000 declaradas, geometría real | 11 | Brecha de **catálogo** ×50 como mínimo; pero el valor docente se concentra en <30 formas |
| Conectores | Pegado inteligente, saltos, 13 flechas, 8 patrones, tema propio | 3 trazados, 1 flecha, 3 patrones | Falta flecha inicial, familias de punta, saltos, y **ortogonal verdadero** |
| Texto | Varios bloques por forma, autoajuste, fórmulas, viñetas | Etiqueta + cuerpo (2 líneas, `line-clamp`), truncado | Lumina trunca sin tooltip; Edraw ajusta forma/texto |
| Lienzo | Cuadrícula dinámica, guías, reglas, imán angular | Puntos/cuadrícula decorativa de React Flow | La cuadrícula de Lumina **no imanta** (`snapToGrid` sin usar) |
| Selección | Caja, multi, asas de tamaño, rotación | Click, sin multi-selección ni asas | Brecha relevante para quien «dibuja» |

## 6. Contraste — funcionamiento

| Capacidad | EdrawMax | Lumina | Veredicto |
|---|---|---|---|
| Pegado de conector a forma | Dinámico (`AUTOBEGINPNT`), re-enruta al mover, N puntos por forma | Lado elegido por geometría relativa (`diagrama-bridge.ts:47-74`), recalculado en cada conversión; solo 4 lados | Aceptable; sin saltos, sin elegir punto, sin esquivar nodos |
| Redimensionar formas | Sí, paramétrico | **No** (ver D1: `ancho/alto` ni siquiera sobreviven) | Brecha crítica |
| Rotar | Sí | No | Brecha menor |
| Multi-selección, alinear, distribuir, agrupar, capas | Sí | No | Brecha grande para «dibujo libre» |
| Auto-layout | Por tipo (mapa mental, org, timeline) | Radial + dagre TB + 6 layouts a medida | Lumina **cumple** en lo pedagógico; falta LR/BT/RL (el tipo ya lo declara) |
| Contenedores/carriles | Sí | No | Brecha para flujos «cross-functional» |
| Datos ligados a forma | Sí (propiedades de forma, importar CSV) | `cuerpo` libre; sin datos tipados | Brecha para organigramas con campos |
| Deshacer | 60 niveles, local | Historial del editor (estado por diferencia) | Equivalente, no auditado aquí |
| Importar | `.vsdx` | **Esquema por sangría** (texto/Markdown) | Distinto: Lumina prioriza texto→diagrama (mejor para docentes) |
| Exportar | SVG/PDF/EMF/PPT/Excel/CSV/HTML | Ninguno | Brecha grande |
| IA | 14 flujos | `IA curricular` existe en otra etapa (J); **no conectada a diagramas** | Oportunidad inmediata |
| Interactividad con el alumno | No es su foco (estático) | Venn con DnD y `soloLecturaEnViewer`; **sin puntuación** | Ventaja potencial de Lumina, sin explotar |
| Colaboración | Nube, versiones, comentarios | Edición por docente; sin colaboración | Fuera de alcance |

## 7. Hallazgos de código en Lumina (defectos reales y deuda)

> Los marcados **[verificado]** se confirmaron ejecutando código; **[lectura]** son por lectura de fuente.

**D1 — [verificado] `ancho`/`alto` se pierden dos veces → pirámide, embudo y cebolla se dibujan mal.**
- Las plantillas declaran anchos (`createDefaultPiramideBlock`: 150→400 px; `Embudo`: 400→130; `Cebolla`: 110→320 de diámetro, con `x/y` calculados para centrar cada capa). Una prueba ejecutada sobre el código real mostró: `ancho` en los defaults = `[null,null,null,null,null,null]` (pirámide) y `[null,null,null,null]` (cebolla) — `createDefault*` llama a `normalizeDiagramaBlock` y **`sanitizeNodos` (`diagrama-defaults.ts:132-142`) no copia `ancho` ni `alto`**.
- Además, el bridge (`graphNodeToRF`, `lumina-rf-bridge.ts:56-77`) solo reenvía `forma/icono/imagen/blockId/isRoot/subtipo`: aunque se conservaran, `DiagramaShapeNode` (`diagrama-shape-node.tsx:416,453,490,527`, lee `nodeData.ancho`) nunca los recibiría. La prueba mostró el `data` del nodo RF sin `ancho`.
- **Efecto visible (deducido, no fotografiado):** todos los trapecios a 220 px, triángulo a 150, cada círculo de la cebolla a 120 px → «pirámide» como escalera de bloques iguales desplazados, «círculos concéntricos» como 4 círculos pequeños sin anidar. `layoutPiramide/Embudo/Cebolla` calculan `ancho/alto` que se descartan igual. Afecta 3 de 17 plantillas, justo las más «gráficas».
- Arreglo (alcance mínimo, Regla 9): `sanitizeNodos` conserva `ancho/alto` (números finitos > 0), `diagramaToGraphModel` los pasa en `meta`, `graphNodeToRF` los copia a `data`, `DiagramaShapeNode` los usa también en `rounded/root/chip` si existen; test de round-trip.

**D2 — [lectura] Opciones declaradas y nunca usadas.** `DiagramaOpciones.tema`, `direccionLayout`, `densidad`, `animacionEntrada` y `DiagramaGrafoBlock.layout === 'jerarquico'` se **sanean y guardan, pero ningún código las lee** (`grep` en bloque, graph-editor y frontend). Es lo que `PLAN_MEJORA_DIAGRAMAS.md §2.4` llamó «etiqueta muerta» y sigue vigente.

**D3 — [lectura] Formas y trazados prometidos sin render.** `rect`, `ellipse`, `hexagon` (tipo `DiagramaNodoForma`) y `orthogonal` (tipo `DiagramaAristaTrazado`) no tienen implementación; `flechaInicio` se persiste y no se pinta (`graphEdgeToRF` solo ponía `markerEnd`).

**D4 — [lectura] Ternario muerto en layout.** `diagrama-properties.tsx:525`: `direction: currentSubtipo === 'flujo' || currentSubtipo === 'organigrama' ? 'TB' : 'TB'`. Siempre TB; el flujo horizontal (LR, lo natural para cronologías y procesos) es imposible aunque dagre lo soporta.

**D5 — [lectura] Desacople por `window` events.** Toolbar del nodo, edición inline, `Tab`/`Enter` y borrado se comunican por `CustomEvent` globales (`lumina-diagrama-*`) filtrados por `blockId`. Con dos diagramas en el mismo slide funciona por el filtro, pero **`Tab`/`Enter` se registran en `window` mientras el bloque está seleccionado y capturan la tecla aunque el foco no esté en el diagrama**.

**D6 — [lectura] Duplicación del layout dagre.** El mismo bloque «nodos→GraphNode→dagre→posMap» está copiado 3 veces en `diagrama-properties.tsx` (cambio de subtipo, auto-layout, esquema). Candidato a un `aplicarDagre(block, opts)`.

**D7 — [lectura] Venn.** Conjuntos fijos 2–3, etiquetas «A/B/C» **no editables**, colores `rgba()` fijos (`diagrama-regions.ts:31-38`, no siguen tema ni paleta), el contenedor es `aria-hidden`, no se puntúa. Lo ya anotado en el plan §2.2.7 sigue igual.

**D8 — [lectura] Truncado sin recuperación.** `line-clamp-1/2` y `truncate` en cuerpo/etiqueta sin tooltip ni expansión; en el visor del alumno el texto largo se pierde.

**D9 — [lectura] Pérdida silenciosa en cambio de subtipo.** `handleSubtipoChange` re-aplica layout y **sobrescribe `dirigida` de todas las aristas** (`isDirected` = solo flujo/organigrama), borrando decisiones por arista.

Nota sobre la fila «Pegado de conector»: `diagramaToGraphModel` recalcula `sourceHandle/targetHandle` en cada conversión a partir de `x/y`, por lo que el lado de salida **sí** sigue al movimiento del nodo; lo que falta es elegir *punto* (más de 4) y esquivar obstáculos.

## 8. Qué NO conviene copiar de EdrawMax

- **Paridad de catálogo.** 329 librerías (cloud AWS/Azure/Tencent, eléctrico, P&ID, planos) no sirven a un LMS. Lumina compite por *orientación pedagógica*, no por amplitud.
- **Modelo ShapeSheet con fórmulas.** Es potentísimo pero implica un motor de fórmulas propio; el beneficio docente es marginal.
- **Geometrías, plantillas y temas del producto:** son contenido protegido.

## 9. Qué sí conviene aprender (priorizado por valor/coste)

| # | Mejora | Inspiración Edraw | Coste | Valor | Nota |
|---|---|---|---|---|---|
| P0 | **Arreglar D1** (`ancho/alto`) | — | Bajo | Alto | Hoy 3 de 17 plantillas están rotas |
| P0 | Renderizar `rect/ellipse/hexagon`, `orthogonal`, `flechaInicio` o quitarlos del tipo | Flechas con id y tamaño | Bajo | Medio | Elimina promesas falsas (D3) |
| P1 | **Tema de diagrama de 4 piezas** (color + efecto de forma + texto + conector) y **relleno tintado** además del borde | `PresetThemes` | Medio | Alto | Hoy la paleta solo toca el contorno; es la mayor diferencia de apariencia |
| P1 | Usar de verdad `direccionLayout` (TB/LR/BT/RL) y `densidad`; borrar el ternario muerto | `OrgAutoLayout`, `OrgHorDist` | Bajo | Alto | Dagre ya lo soporta |
| P1 | **Exportar** a PNG/SVG (contrato común con gráficos) | Export SVG/PDF/EMF | Medio | Alto | Los docentes copian a documentos |
| P1 | **IA → diagrama**: partir del texto/curriculum y producir `nodos/aristas` | AI Mind Map / Flowchart | Medio | Alto | Reutiliza Etapa J (IA curricular) |
| P2 | **Contenedores y carriles** (swimlane) | `Container`, `SwimLane` | Medio | Medio | Flujos con roles; también agrupaciones en mapas conceptuales |
| P2 | Multi-selección + alinear/distribuir + `snapToGrid` real | Align/Distribute, `GridSnapDist` | Medio | Medio | React Flow ya ofrece selección múltiple y `snapToGrid` |
| P2 | Redimensionado con `NodeResizer` | Asas | Bajo | Medio | Requiere D1 |
| P2 | Más puntos de conexión por forma / mismo lado con desplazamiento | `CPoints` | Medio | Bajo-Medio | Evita aristas solapadas |
| P3 | Saltos de línea en cruces | `JumpMode/Size` | Alto | Bajo | Estético |
| P3 | Datos por nodo (campos tipados) para organigrama (foto, cargo) | `OrgFields`, Define Shape Data | Medio | Medio | |
| **P-Lumina** | **Diagramas evaluables** (Venn ya tiene `regionId`, falta puntuación vía `@lumina/scoring`; etiquetar partes de pirámide/cebolla/ciclo; completar flujo) | *(no existe en Edraw)* | Medio | **Muy alto** | Es la ventaja competitiva real de Lumina; encaja con la Etapa U |

## 10. Dictamen

- **EdrawMax** es un *editor de dibujo vectorial general* con motor paramétrico, sistema de temas de cuatro piezas, conectores inteligentes y catálogo industrial. Su fortaleza es la **amplitud y la coherencia del sistema de diseño**.
- **Lumina** es un *organizador gráfico pedagógico embebido en diapositivas*, sobre React Flow, con 17 plantillas útiles y buen flujo texto→diagrama. Su fortaleza es la **intención didáctica** (Frayer, Ishikawa, Bloom, Eisenhower, KWL…). Su debilidad estructural es que **modelo, tipos y UI prometen más de lo que renderizan** (D1–D3) y que el estilo toca solo el contorno.
- No hay que acercarse a Edraw en amplitud sino en tres cosas baratas y visibles: **(1)** arreglar D1/D3, **(2)** tema que pinte relleno+texto+conector, **(3)** direccionalidad y exportación. Después, apostar por lo que Edraw no tiene: diagramas **interactivos y puntuables**.

## Apéndice A — Cifras de la muestra (300 `.eddx` al azar de 1 673; semilla 1)

| Métrica | Valor |
|---|---|
| Formas totales analizadas | ≈ 57 700 |
| Rellenos | Solid 34 713 · Gradient 15 355 · None 7 337 · SingleGradient 227 · Hatch 50 · Texture 4 |
| Sombra activada | 198 de 56 993 (0,35 %) |
| `ConnectLine` | 1 696 |
| `ConnectorLayout.Style` | 2: 1 073 · 0: 567 · 1: 56 |
| Patrones de línea (id → usos) | 1: 28 498 · 10: 153 · 9: 86 · 2: 82 · 0: 59 · 3: 22 · 23: 15 · 7: 2 · 11: 2 |
| Ids de flecha ≠ 0 más usados | 5: 369 · 4: 351 · 19: 181 · 16: 93 · 3: 83 · 18: 29 |

## Apéndice B — Archivos de Lumina leídos

`packages/editor-shared/src/graph-editor/{types.ts, graph-canvas.tsx, lumina-rf-bridge.ts, layout-dagre.ts}` ·
`packages/element-kit/src/blocks/diagrama/{diagrama-defaults.ts, diagrama-properties.tsx, diagrama-editor.tsx, diagrama-viewer.tsx, diagrama-shape-node.tsx, diagrama-bridge.ts, diagrama-temas.ts, layout-pedagogico.ts, diagrama-regions.ts, diagrama-outline-parser.ts, venn-svg.tsx}` ·
`packages/element-kit/src/elements/diagrama/diagrama-definition.ts` ·
`packages/types/src/slide.types.ts:1734-1871` ·
`lumina-frontend/.../panels/elementos-panel.tsx:129-151` ·
`PLAN_MEJORA_DIAGRAMAS.md`, `PLAN_ACCION_DIAGRAMAS_GRAFICOS.md`, `docs/tablero/etapa-S.md`.
