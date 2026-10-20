# Etapa Y — Editor de diagramas: cinta, conexión fluida y productividad

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa Y — El editor libre se usa como una herramienta de ofimática, no como un lienzo suelto

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `Y0–Y11` (la letra `X` está reservada a `X.n` fuera de hoja de ruta; no se usa `L`, `N`, `Q`). Redactada el 2026-10-20 a pedido del dueño, a partir de un análisis de mejoras de interactividad, apartado gráfico y configuración del editor de la etapa W.

**Por qué existe:** el editor de W5–W8 funciona (selección, transformar, conectores que siguen a las formas, panel de propiedades), pero (1) **conectar dos formas exige cambiar a la herramienta Línea y apuntar a un puerto de 14 px**; (2) la barra superior es **una sola fila de ~30 botones solo con iconos**, sin jerarquía ni etiquetas; (3) faltan lo básico de productividad (copiar/pegar, organizar automático, buscador de comandos). El público docente viene de Word, PowerPoint y Storyline: espera una **cinta por pestañas** y que **arrastrar una caja sobre otra la conecte**.

**Lo que ya existe y se reutiliza (no se rehace):** `puertoCercano`, `conectar`, `soltarExtremo`, `sincronizarConectores` (`@lumina/drawing/src/conectores/`); `gestos.ts`, `conectores.ts`, `comandos.ts`, `asas.ts`, `vista.ts` y `editor-libre.tsx` (`elements/dibujo/editor/`); `CollapsibleSection` (etapa S), `FieldHelp` (etapa R) y `Button`/`Separator` de `@lumina/ui`; `dagre` y `layout-pedagogico.ts` (para la fase C); `diagrama-outline-parser.ts` (fase C).

**Decisiones de diseño (DY1–DY6), fijadas por esta raíz; el operador no las reabre:**

- **DY1. Cinta completa por pestañas** (decisión del dueño, 2026-10-20): Inicio · Insertar · Organizar · Vista · Exportar, más pestañas **contextuales** («Formato de forma», «Formato de conector») que aparecen según la selección. Una pestaña sin contenido no se muestra (Diseño aparece con la fase D/E; Exportar, con W9). Barra de acceso rápido fija (deshacer, rehacer) encima, colapsable con doble clic en la pestaña, con modo compacto de iconos para ventanas estrechas.
- **DY2. La cinta es un componente genérico de `@lumina/ui`**, no código del editor: otros elementos (gráficos, ecuaciones) podrán reutilizarla. El editor solo declara sus pestañas y comandos.
- **DY3. Un registro único de comandos.** Cada acción del editor (duplicar, agrupar, alinear, …) se declara una vez —id, etiqueta, icono, atajo, habilitado-si, ejecutar— y de ahí salen el botón de la cinta, el atajo de teclado, el buscador `Ctrl+K` y el panel de atajos. Prohibido repetir etiqueta/atajo en tres lugares.
- **DY4. Comportamiento al soltar una forma sobre otra** (**confirmada por el dueño el 2026-10-20**): por defecto **solapa** (mover y soltar no crea nada). Solo **conecta** si el puntero cae sobre el halo de un puerto/borde de la forma destino, o con la tecla `Alt` apretada; antes de soltar siempre se ve la vista previa de qué va a pasar. Motivo: quien solo quiere mover no debe llevarse conectores por sorpresa.
- **DY5. Un gesto, una entrada de historial y una confirmación al bloque** (DW7), también cuando un gesto crea forma + conector (hijo rápido, conectar al soltar). Es el caso de prueba obligatorio de cada ficha de la fase B.
- **DY6. Contenedores y carriles quedan para después de W10** (decisión del dueño, 2026-10-20): cambian el modelo (`padre`/`hijos` en `tipos.ts`) y se evalúan con `diagrama` ya migrado. Ninguna ficha de esta etapa los incluye.

**Orden y concurrencia:** `Y1` (paquete `@lumina/ui`) es independiente y puede correr con cualquier otra. `Y2–Y11` tocan todas `editor-libre.tsx`: **van en serie, no en paralelo** (Regla 10). **`W9` (exportar) también toca el editor:** no corre en paralelo con `Y2`; si `Y2` llega primero, `W9` agrega su botón en la pestaña Exportar. Las fases C–F quedan abajo como índice y **se redactan al cerrar la fase B** (Regla 10).

**Fuera de alcance de toda la etapa:** contenedores y carriles (DY6); colaboración en tiempo real; importar `.vsdx`; migrar o borrar el bloque `diagrama` (eso es W10).

---

## Fase A — Esqueleto de interfaz

#### Y0 — Raíz de la etapa Y
- **Operador:** Claude Code
- **Estado:** en revisión — esta ficha, las decisiones DY1–DY6 y las fichas Y1–Y11 redactadas; índice de las fases C–F.
- **Precondición:** W5–W8 en revisión (el editor existe).
- **Alcance — PUEDE tocar:** `docs/tablero/etapa-Y.md`, `AGENTS.md` (solo la fila del índice).
- **Entregable:** este archivo + fila en el índice de `AGENTS.md`.
- **Cierre:** ninguno.

#### Y1 — Componente `Ribbon` (cinta) en `@lumina/ui`
- **Operador:** Claude Code
- **Estado:** [en curso: Claude Code]
- **Precondición:** ninguna (independiente).
- **Alcance — PUEDE tocar:** `packages/ui/src/` (nuevo `ribbon/` con `Ribbon`, `RibbonTab`, `RibbonGroup`, `RibbonButton`, `RibbonSplitButton`, `QuickAccessBar`), exportación en `package.json` del paquete, specs, y su CSS (módulo puro, patrón del paquete). **NO** toca `element-kit`, el frontend ni el editor.
- **Entregable:** DY1 y DY2. Cinta con pestañas (`role="tablist"`/`tab`/`tabpanel`, flechas entre pestañas con *roving tabindex*, `F6` salta entre barra de acceso rápido / cinta / lienzo), grupos con etiqueta inferior, botones de icono + texto en tamaño grande y mediano, **colapsable** (doble clic en la pestaña; al elegir una pestaña colapsada se abre como menú flotante y se cierra al actuar), **modo compacto** por ancho (los grupos se reducen a un botón desplegable), pestañas **contextuales** con realce, y atajo visible en el *tooltip*. Tema claro/oscuro por tokens. Pruebas: navegación por teclado completa, colapsar/expandir, modo compacto por ancho, pestaña contextual que aparece y desaparece sin perder la pestaña activa del usuario, `aria-selected` correcto. Verificación: `pnpm --filter @lumina/ui build && pnpm --filter @lumina/ui test && pnpm --filter @lumina/ui lint`.
- **Cierre:** ninguno (componente nuevo).

#### Y2 — Registro de comandos y cinta del editor (reemplaza la barra plana)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y1 `hecho`; W8 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/elements/dibujo/editor/` (nuevo `comandos-registro.ts` y `cinta-editor.tsx`; `editor-libre.tsx` y `comandos.ts` solo para conectar el registro; `paleta.tsx` si se mueve su contenido a Insertar), specs. **NO** toca `@lumina/drawing`, el panel de propiedades ni `widgets/dibujo/`.
- **Entregable:** DY3 y DY1. Registro único de comandos (id, etiqueta, icono, atajo, `habilitado(escena, seleccion)`, `ejecutar`) con **todas** las acciones actuales de la barra (deshacer, rehacer, duplicar, eliminar, agrupar, desagrupar, 4 de orden, 6 de alinear, 2 de distribuir, zoom, ajustar, cuadrícula, imán, «Listo»). Cinta con **Inicio** (deshacer/rehacer arriba en la barra de acceso rápido; duplicar, eliminar, formato del texto), **Insertar** (herramientas y catálogo de formas, hoy en la paleta), **Organizar** (orden, alinear, distribuir, agrupar), **Vista** (zoom, ajustar, cuadrícula, imán) y pestañas contextuales **«Formato de forma»** y **«Formato de conector»** (esta absorbe la barra flotante `BarraConector`). El teclado (`alTeclear`) consulta el mismo registro. Las alineaciones y la distribución dicen por qué están deshabilitadas (*tooltip*: «Elige 3 o más elementos»). **El docente conserva todo lo que tenía**: ningún botón ni atajo desaparece. Pruebas: cada comando del registro tiene botón y atajo coherentes; el estado habilitado depende de la selección; el atajo y el botón producen el mismo resultado; la cinta contextual cambia con la selección; nada llega a `window` (aislamiento de teclado, W5). Verificación: `pnpm --filter @lumina/drawing test && pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`, más comprobación visual en Chromium del flujo abrir editor → usar cada pestaña.
- **Cierre:** se borran la fila de botones plana de `editor-libre.tsx` y `BarraConector` (o su uso) una vez la cinta contextual los reemplaza, con prueba de paridad (misma entrada → mismo resultado).

#### Y3 — Zonas redimensionables y plegables (paleta y panel derecho)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y2 `hecho`.
- **Alcance — PUEDE tocar:** `editor/editor-libre.tsx` (layout), `editor/paleta.tsx`, `editor/propiedades-panel.tsx` (solo el contenedor), un nuevo `editor/zona-redimensionable.tsx`, specs. **NO** toca el contenido de las secciones del panel.
- **Entregable:** la paleta (hoy 208 px) y el panel (hoy 320 px) se **arrastran para cambiar su ancho** (límites, doble clic restaura), se **pliegan** a un riel de iconos, recuerdan su estado en `localStorage` con la convención de etapa S (`lumina.panel.dibujo-*`, con `try/catch`), y por debajo de un ancho de ventana se pliegan solos. Teclado: separador enfocable que cambia el ancho con flechas (`role="separator"`, `aria-valuenow`). Pruebas: ancho acotado, persistencia, restauración, plegado automático por ancho, accesibilidad del separador. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y4 — Barra de estado útil
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y2 `hecho`.
- **Alcance — PUEDE tocar:** `editor/editor-libre.tsx` (solo la barra inferior), nuevo `editor/barra-estado.tsx`, specs.
- **Entregable:** coordenadas del cursor en la escena, tamaño y posición de la selección, **deslizador de zoom** (10 %–800 %, el mismo límite de W5), accesos a cuadrícula e imán, y un lugar reservado para el indicador de guardado (lo llena la fase E). Se conserva el aviso `aria-live` y la ayuda por herramienta. Pruebas: valores correctos con zoom y desplazamiento, selección múltiple, selección girada, texto accesible. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y5 — Buscador de comandos (`Ctrl+K`) y panel de atajos (`?`)
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y2 `hecho` (usa el registro de comandos, DY3).
- **Alcance — PUEDE tocar:** `editor/` (nuevo `buscador-comandos.tsx` y `panel-atajos.tsx`; `editor-libre.tsx` solo para abrirlos), specs.
- **Entregable:** `Ctrl+K` abre un cuadro de búsqueda sobre el registro (por etiqueta y sinónimos en español, p. ej. «alinear», «borrar» → eliminar), muestra el atajo y deshabilitados con su motivo; `Enter` ejecuta. `?` abre la lista de atajos agrupada por pestaña, generada del registro (nunca escrita a mano). Ambos son diálogos accesibles con foco atrapado y retorno de foco. Pruebas: búsqueda con acentos y sin ellos, ejecutar un comando, comando deshabilitado no ejecuta, el panel de atajos coincide con el registro. Verificación: la de Y2.
- **Cierre:** ninguno.

---

## Fase B — Conexión y creación fluida

> Todas tocan `editor-libre.tsx`, `gestos.ts` y/o `conectores*.ts`: **van en serie**. Cada ficha de esta fase prueba DY5 (un gesto = una entrada de historial).

#### Y6 — Puertos visibles al pasar el cursor y forma destino resaltada
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y2 `hecho`.
- **Alcance — PUEDE tocar:** `editor/editor-libre.tsx` (capa de puertos), `editor/conectores-capa.tsx`, `editor/conectores.ts`, specs. **NO** toca `@lumina/drawing`.
- **Entregable:** con la herramienta **Seleccionar**, al pasar el cursor sobre una forma se muestran sus puertos (hoy solo se ven con Línea/Flecha); al arrastrar un extremo de conector o una forma, la **forma destino se resalta entera** (borde y relleno suave) además del puerto, y el radio de captura crece en pantallas táctiles (≥ 24 px). Pruebas: los puertos aparecen y desaparecen con el cursor sin parpadeo, el resalte sigue a la forma correcta aun girada, no se muestra en elementos bloqueados u ocultos. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y7 — Conectar al soltar una forma sobre otra
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y6 `hecho` (DY4 ya confirmada por el dueño, 2026-10-20).
- **Alcance — PUEDE tocar:** `editor/gestos.ts`, `editor/conectores.ts`, `editor/editor-libre.tsx`, `packages/drawing/src/conectores/` (solo un helper puro `puertosParaConectar(escena, origen, destino)` que elige el par de puertos según la posición relativa), specs.
- **Entregable:** DY4. Al arrastrar una forma (o varias) y soltar con el puntero sobre el halo de otra, o con `Alt` apretada, se crea un conector entre ambas, eligiendo el par de puertos por posición relativa (si cae debajo: del puerto inferior al superior). Vista previa del conector y del destino **antes de soltar**; sin halo ni `Alt`, soltar solo mueve. Una sola entrada de historial (mover + crear). Si ya hay conector entre ambas en ese sentido, no se duplica. Pruebas: elección de puertos en los cuatro cuadrantes y con formas giradas, `Alt` y halo, no crea sin ellos, deshacer deshace todo de una vez, formas bloqueadas no se conectan. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y8 — Asas «+» de hijo rápido
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y7 `hecho`.
- **Alcance — PUEDE tocar:** `editor/` (nuevo `asas-hijo.tsx` y `hijo-rapido.ts` puro; `editor-libre.tsx` para montar la capa), `packages/drawing/src/operaciones/` (solo `crearHijo(escena, formaId, lado)` puro), specs.
- **Entregable:** al elegir **una** forma aparecen cuatro flechas «+» en sus lados. **Clic** → crea una forma del mismo estilo y tamaño, en esa dirección a distancia fija, ya conectada y con el texto en edición. **Arrastrar** a una forma existente → conecta; a un espacio vacío → crea la forma nueva en el punto y la conecta. No aparecen en elementos bloqueados, líneas ni selección múltiple. Pruebas: la forma nueva queda conectada al puerto del lado correcto, no se superpone con otra existente (se desplaza hasta un hueco), una sola entrada de historial, texto en edición al crear. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y9 — Teclado tipo mapa mental y conectar en cadena
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y8 `hecho`.
- **Alcance — PUEDE tocar:** `editor/comandos-registro.ts` (comandos nuevos), `editor/comandos.ts`, `packages/drawing/src/operaciones/` (solo `conectarEnCadena` y `eliminarRama` puros), specs. **No cambia la tecla `Tab`** (recorre elementos, DW8).
- **Entregable:** **`Ctrl+Enter`** crea un hijo de la forma elegida (reusa `crearHijo`), **`Ctrl+Mayús+Enter`** un hermano (misma conexión que el padre), **`Ctrl+Supr`** borra la rama (la forma y todo lo alcanzable solo desde ella), **`Ctrl+L`** (y botón en Insertar) **conecta en cadena** las formas elegidas en el orden de selección o, si es ambiguo, de izquierda a derecha y arriba a abajo. Todos en el registro (aparecen en cinta, buscador y atajos). Pruebas: hijo/hermano con conector correcto, borrar rama no toca ramas hermanas ni ciclos, cadena de 2, 5 y 20 formas, deshacer en un paso. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y10 — Conectores sin huérfanos
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y7 `hecho`.
- **Alcance — PUEDE tocar:** `editor/conectores-capa.tsx`, `editor/conectores.ts`, `editor/comandos.ts`, `packages/drawing/src/operaciones/edicion.ts` (duplicar) con sus specs.
- **Entregable:** (1) un extremo **despegado** se dibuja distinto (naranja) y la barra del conector lo avisa («Extremo libre») con la acción «Pegar al más cercano»; (2) **duplicar** formas con un conector entre ellas **duplica también el conector entre las copias**, y las líneas que salen hacia fuera de la selección no se duplican; (3) al crear un conector, la **etiqueta queda en edición** opcionalmente (ajuste en preferencias de la fase E; por ahora, con doble clic como hoy). Pruebas: duplicar un trío conectado conserva la topología, conectores hacia fuera no se copian, el estado «libre» aparece solo con extremos sin conexión, eliminar una forma deja al conector libre y avisado. Verificación: la de Y2.
- **Cierre:** ninguno.

#### Y11 — Crear más rápido
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** Y2 `hecho`; Y7 `hecho` (para el caso soltar sobre forma).
- **Alcance — PUEDE tocar:** `editor/paleta.tsx`, `editor/herramientas.ts`, `editor/editor-libre.tsx`, `editor/gestos.ts`, specs.
- **Entregable:** (1) **arrastrar desde la paleta al lienzo** con vista previa de la forma bajo el cursor (reemplaza el paso «elegir herramienta, luego arrastrar»; el clic en la paleta sigue funcionando); (2) **doble clic en un vacío** crea una caja de texto con el texto en edición; (3) **clic simple** con una herramienta de forma la coloca con el tamaño por defecto, sin obligar a arrastrar; (4) la herramienta **vuelve a Seleccionar** tras crear (un solo uso) y queda **fija** con `Mayús` apretada al elegirla o con doble clic en su botón. Pruebas: cada caso crea exactamente un elemento y una entrada de historial, la vista previa no deja residuos al cancelar (Escape), el modo fijo persiste hasta elegir otra herramienta, accesible por teclado (elegir forma con Enter coloca al centro de la vista). Verificación: la de Y2.
- **Cierre:** ninguno.

---

## Fases C–F — Índice (fichas por redactar al cerrar la fase B, Regla 10)

| Fase | Contenido | IDs reservados |
|---|---|---|
| **C — Productividad** | Portapapeles (`Ctrl+C/X/V`, entre diagramas y slides, copiar formato) · Organizar automáticamente con `dagre` (jerárquico, árbol, radial) · Pegar esquema → diagrama (`diagrama-outline-parser.ts`) · Selección avanzada (por tipo, «seleccionar igual», lazo) · Precisión (reglas y guías arrastrables, distancias y tamaño en vivo, guías de espaciado igual) · Menú contextual | Y12–Y17 |
| **D — Edición directa y apartado gráfico** | Mini barra flotante junto a la selección · Cambiar forma sin perder nada · Asas amarillas de ajuste (radio, punta, grosor) · Estilos predefinidos y temas (tokens `var(--…)`, DW5) · Colores recientes y cuentagotas · Relleno y efectos ampliados · Texto (autoajuste, viñetas, la forma crece al escribir) | Y18–Y24 |
| **E — Configuración y entorno** | Ajustes de página (tamaño, orientación, fondo, márgenes) · Preferencias y valores por defecto (guardadas por docente) · Panel de capas ampliado (bloquear, ocultar, buscar, virtualizar, DW9) · Guardado automático con indicador e historial visible · Modo prueba (ver como el alumno) | Y25–Y29 |
| **F — Ampliaciones** | Táctil (pellizcar, dos dedos, objetivos de 44 px) · Modo oscuro del editor · Biblioteca de iconos mínima (`lucide`) · Hipervínculos y notas por elemento · Minimapa · Accesibilidad avanzada | Y30+ |
| **Contenedores y carriles** | **Después de W10** (DY6). Ficha raíz: se redacta al cerrar W10. | — |
