# Actualizaciones futuras — editor de diagramas (etapa Y y lo que la rodea)

> **Qué es este archivo.** Una **lista viva de ideas** para después: lo que se dejó fuera a propósito, lo que el dueño descartó pero podría volver, y lo que fuimos viendo al trabajar. **No contiene reglas** (esas están solo en `AGENTS.md`, Regla 8) **ni fichas** (esas viven en `docs/tablero/etapa-*.md`). Cuando una idea se decide, se redacta como ficha en su etapa y su fila de acá se marca «→ ficha Yxx».
>
> **Cómo se anota.** Una fila por idea, al final de la sección que corresponda, con el **siguiente número libre** (`F-nn`). No se borra nada: si una idea se descarta o se hace, cambia su **Estado**. Fecha de la última revisión: **2026-10-26**.

**Estados:** `idea` (anotada, sin decidir) · `pedida` (el dueño la quiere, sin ficha todavía) · `descartada` (el dueño dijo que no; se guarda el motivo por si cambia) · `→ ficha` (ya tiene ficha, se indica cuál) · `hecha`.
**Tamaño** (estimación gruesa, para ordenar): **S** un día o menos · **M** unos días · **L** una etapa corta · **XL** varias fichas con cambio de modelo.
**Modelo:** `Sí` si cambia lo que se guarda en la escena (exige las garantías de DY14: una escena guardada antes se dibuja y se exporta **idéntica**, con golden generado antes del cambio); `No` si no.

---

## 1. Contenedores y carriles (la grande)

**Estado: `pedida` como actualización a futuro** (dueño, 2026-10-25; antes, DY6 del 2026-10-20: «después de W10», cuando el bloque `diagrama` ya migró). Es lo único que **cambia el modelo de fondo**, por eso va aparte.

### Qué es
- **Contenedor:** una forma **visible** (con borde, fondo y un título) que **contiene a otras**. Se usa para agrupar con sentido: «Sistema nervioso» con sus órganos adentro, «Fase 1» con sus pasos, «Departamento de ventas» con sus cargos. Si se mueve el contenedor, **todo lo de adentro se mueve**; si se agranda o se achica, lo de adentro **se acomoda o avisa** si ya no cabe; si se arrastra una forma hacia adentro **pasa a ser parte** de él, y al sacarla deja de serlo.
- **Carril (swimlane):** un contenedor especial en **bandas paralelas** (filas o columnas), una por actor, rol o etapa. Es la forma estándar de dibujar un **proceso con responsables**: «Alumno», «Docente», «Sistema» como tres carriles horizontales, y cada paso del proceso vive en el carril de quien lo hace; una flecha que cruza de un carril a otro **dice que el trabajo pasó de manos**.

### Por qué no lo da hoy el `grupo`
Lo que existe es `Grupo` (`tipos.ts`: `hijos: string[]`, mínimo 2): un conjunto **invisible** (no tiene borde, fondo ni título), que solo sirve para mover, copiar y ocultar a la vez. No lo ve el estudiante como «una caja con cosas adentro», no limita dónde caen las formas, no reordena nada cuando crece y no tiene «el que manda» (el título). Y la relación «hijo de una forma» que usa el plegado de ramas (Y38) **sale de los conectores**, no de pertenencia: un contenedor es **otra relación**, de pertenencia espacial.

### Lo que habría que decidir (preguntas para la ficha raíz)
1. **Modelo de pertenencia.** ¿Un campo `padre?: id` en cada elemento (y el contenedor lo sabe por búsqueda), o `hijos: id[]` en el contenedor (como `Grupo`)? Un elemento, **¿en uno solo o en varios**? (Lo habitual: en uno solo.) ¿Se permiten **contenedores dentro de contenedores**? (Sí, con límite de profundidad.)
2. **Qué es un carril en el modelo:** ¿un contenedor con `disposicion: 'carriles'` y sus bandas como hijas, o un tipo propio `carril` con una lista de bandas (`[{ titulo, tamano }]`)? Las bandas **¿se pueden reordenar y redimensionar** sin deformar lo que llevan?
3. **Qué pasa al achicar** un contenedor con cosas adentro: ¿se **bloquea** en el tamaño mínimo que las contiene, **empuja** lo de adentro, o permite que se salga y lo **avisa** como hoy se avisa lo que queda fuera de la página (Y25, Y37b)?
4. **Organizar automáticamente (Y13/Y37):** ¿se organiza **dentro** de cada contenedor, o se **trata el contenedor como una caja** (un nodo) y se organiza por fuera? Los carriles piden una disposición propia: cada paso en el carril de su dueño y los pasos ordenados a lo largo del carril.
5. **Conectores que cruzan** la frontera: ¿el puerto sigue pegado a la forma o al contenedor? ¿Un conector entre el contenedor y algo de afuera «conecta» con todo lo de adentro?
6. **Plegar (Y38):** ¿se puede **plegar un contenedor** (mostrar solo su título)? Es la combinación natural y la que más sirve en clase (mostrar el esquema general y abrir un bloque a la vez).
7. **Visor del estudiante y lectores de pantalla:** ¿el contenedor se lee como un **grupo con nombre** («Fase 1, 4 elementos»)? La lista accesible hoy es plana por filas; con contenedores pide **jerarquía**.
8. **Exportación (SVG/PNG):** el contenedor se dibuja **debajo** de lo que contiene (apilado), con título; un carril exporta con sus bandas y encabezados.
9. **Historial y portapapeles:** copiar un contenedor copia **su contenido**; deshacer una mudanza de carril es **una sola entrada** (DY5).
10. **Puntería y selección:** un clic en el fondo de un contenedor ¿lo elige a él o a lo que está debajo? Un doble clic en su título edita el título. La marquesina elige lo de adentro sin elegir el contenedor, salvo que se lo encierre entero.

### Cómo se podría partir (a título de borrador; se redacta al llegar el turno, Regla 10)
| Paso | Qué | Modelo |
|---|---|---|
| **C1** | Contenedor en el modelo y en el dibujo: pertenencia, normalizador, render (borde, fondo, título), exportación y golden de «escena vieja idéntica» | **Sí** |
| **C2** | Gestos del editor: arrastrar hacia adentro y hacia afuera, mover y redimensionar con lo de adentro, puntería, selección, mini barra, panel, historial | No |
| **C3** | Carriles: bandas, encabezados, mudanza entre carriles, reordenar y redimensionar bandas | Sí (campos del carril) |
| **C4** | Organizar con contenedores y con carriles (Y13/Y37) | No |
| **C5** | Plegar contenedores (Y38) y visor del estudiante con jerarquía accesible | No |

Tamaño total: **XL** (4 a 5 fichas). **Precondiciones útiles ya cumplidas:** el modelo crece con campos opcionales y el golden de «escena vieja» ya se hizo en varias fichas (Y23, Y24a, Y32a, Y38a); el plegado derivado de conectores (Y38) y los ajustes de página (Y25) existen.

---

## 2. Ideas que el dueño pidió o que quedaron explícitas en una ficha

| ID | Idea | Qué es y para qué | Origen | Modelo | Tamaño | Estado |
|---|---|---|---|---|---|---|
| F-01 | **Arrastrar iconos desde la galería** | Hoy un icono se coloca con clic (elige la herramienta) o con `Enter`; las 22 formas, además, se arrastran de la cinta al lienzo. Falta lo mismo para los iconos, cuidando que el `Popover` no se cierre a mitad del arrastre. | Y32b, DY92 | No | S | `idea` |
| F-02 | **Evento «rama plegada/desplegada» para el motor de reglas** | Que el estudiante plegando una rama dispare una regla (por ejemplo, sumar un punto o mostrar otro bloque): ampliar `eventos` de `diagrama` y el editor de reglas. | Y38c, DY85 | No | M | `idea` |
| F-03 | **Pegar un dibujo como bloque vivo en el slide** | Hoy el diagrama sale al slide como **imagen** (Exportar). Un bloque vivo exige tocar el contrato del canvas (`docs/contratos/canvas-editor.md`). | DY10 (fase B) | Sí (contrato del canvas) | L | `idea` |
| F-04 | **Márgenes de página** | Un margen configurable que el «organizar» respete y que se vea como guía. Un campo opcional nuevo de `Escena`. | Y25, DY59 | Sí | M | `descartada` (dueño: «sin márgenes», 2026-10-25) |
| F-05 | **Preferencias por cuenta** | Guardar las preferencias del editor (por ejemplo, «crecer al escribir» o los colores recientes) **en el servidor**, no solo en el navegador. Exige un punto del backend con `CourseAuthorizationService` y `@Roles` (Regla 5). | Y26 | No (backend) | M | `descartada` (poco valor hoy) |
| F-06 | **Autoguardado con borrador local** | Un guardado propio del editor que sobreviva a cerrar la pestaña. Hoy el guardado real es de la plataforma. | Y28 | No | M | `descartada` |
| F-07 | **Enlaces y notas por elemento** | Un enlace (solo `https:`, `http:`, `mailto:` y anclas internas; nunca `javascript:` ni `data:`) y una nota privada del docente en cada forma. Dos campos opcionales, con la seguridad de los enlaces como riesgo principal. | Y33 | Sí | M | `descartada` (aporta poco frente al costo) |
| F-08 | **Minimapa** | Vista reducida con el rectángulo de la ventana, para lienzos grandes. | Y34 | No | S | `descartada` (los lienzos docentes son chicos) |
| F-09 | **Modo oscuro propio del editor** | El editor ya sigue el tema de la app; esto sería un modo aparte. Los pocos colores fijos se corrigen como arreglo suelto, no como paso. | Y31 | No | S | `descartada` |
| F-10 | **Capas ampliado** | Filtros, búsqueda y agrupación en el panel de Capas. | Y27 | No | S | `descartada` (diagramas chicos) |
| F-11 | **Modo prueba** | Ver el diagrama como lo verá el estudiante. **Ya existe** la vista previa de la plataforma. | Y29 | No | — | `descartada` (cubierta por la vista previa) |

---

## 3. Fuera de alcance declarado en las fases (a revisar si cambia la prioridad)

| ID | Idea | Nota | Origen | Modelo | Tamaño | Estado |
|---|---|---|---|---|---|---|
| F-12 | **Colaboración en tiempo real** | Varias personas editando el mismo diagrama. Es una decisión de plataforma, no del editor. | Raíz de la etapa Y | Sí (y backend) | XL | `idea` |
| F-13 | **Importar `.vsdx` (Visio)** | Traer diagramas de Visio al modelo. Mapa de formas, conectores y estilos. | Raíz de la etapa Y | No | L | `idea` |
| F-14 | **Importar esquemas desde archivos** | Hoy el esquema se pega o se escribe en un cuadro de texto (Y14/Y36); leer un `.md`, `.txt` u `.opml`. | Fase G | No | S | `idea` |
| F-15 | **Editor de iconos propio / más iconos** | Hoy hay **30 iconos curados** de Lucide (ISC). Ampliar el conjunto, importar un `.svg` propio del docente (con los límites de seguridad del `svg`), o dibujarlos. | Y32 | Sí (si se importa) | M–L | `idea` |
| F-16 | **Animaciones del dibujo** | Que los elementos aparezcan en secuencia (distinto de plegar ramas, que ya existe). | Fase F | Sí | L | `idea` |
| F-17 | **Renombrar o reinterpretar las disposiciones** | Cambiar «árbol», «jerárquico», «radial» o su significado. | Fase G | No | S | `idea` |
| F-18 | **Sincronizar preferencias entre dispositivos** | Variante de F-05, sin backend propio. | Fase F | No | M | `idea` |

---

## 4. Mejoras y deuda que fuimos viendo al trabajar

Cosas **chicas** que no justificaron una ficha propia, pero que conviene no perder.

| ID | Qué | Por qué | Dónde | Tamaño | Estado |
|---|---|---|---|---|---|
| F-19 | **Endurecer la prueba de rendimiento de viñetas** | `drawing/src/render/vinetas-y24a.spec.ts › 500 formas con lista y autoajuste…` falló en CI (#147) por **0,02 ms** de margen sobre una proporción de tiempos; pasó al reintentar. Es una prueba frágil de otra ficha (Y24a). | `@lumina/drawing` | S | `idea` |
| F-20 | **Una sola fuente para las frases de anuncio del plegado** | Las frases «Rama plegada: N elementos ocultos.» están **dos veces**: en el editor (`comandos.ts`, Y38b) y en el visor (`plegado-visor.ts`, Y38c). | element-kit | S | `idea` |
| F-21 | **Marcadores de rama enfocables con teclado** | Los «+N» y «−» solo se alcanzan por la lista accesible o por el comando; no se enfocan con `Tab`. Es lo mismo que pasa con los elementos del dibujo. Va con el trabajo de accesibilidad avanzada (Y35). | editor y visor | M | `idea` |
| F-22 | **Área táctil de 44 px en los marcadores de rama** | El marcador mide 22 px y **a menos de ≈73 % de zoom** cae entero dentro del asa de la esquina de una forma elegida; con el dedo es difícil. Va con Y30 (táctil). | editor y visor | S | `idea` |
| F-23 | **`Enter` como ítem nuevo al activar la lista estando ya dentro de la edición** | Hoy hay que activar la lista **antes** de escribir para que `Enter` sea un ítem; si se activa con el texto ya abierto, `Enter` confirma. | editor (Y24a) | S | `idea` |
| F-24 | **Pulsación larga como menú contextual** | Para el dedo (hoy es clic derecho o la tecla de menú). Entra con Y30. | editor | S | `idea` |
| F-25 | **Un icono con leyenda** | Un icono no tiene zona de texto propia (el texto va centrado sobre el trazo). Una leyenda debajo, que viaje con el icono. | Y32 (decisión DY89) | M | `idea` |
| F-26 | **Cambiar un rectángulo por un icono (y al revés, con aviso)** | «Cambiar forma» solo cambia entre las 22; un icono puede pasar a una de las 22 pero no al revés (DY87). | Y32 | S | `idea` |
| F-27 | **Plegar «hasta el nivel N»** | Un botón que deja visible solo hasta el nivel 1, 2 o 3 de un árbol, y otro para «siguiente nivel»: sirve para **mostrar un diagrama paso a paso en clase** sin armar varias diapositivas. Combina con F-02. | Y38 | M | `idea` |
| F-28 | **Animar el plegado** | Una transición corta al plegar y desplegar (respetando «reducir movimiento»). | Y38 | S | `idea` |
| F-29 | **Rotación de los ejes de un arco en el escalado de iconos** | `escalarTrazado` conserva la rotación pero no la corrige con una escala no uniforme; los 30 iconos actuales **no la usan**, así que no se nota. Solo importa si se importan iconos propios (F-15). | `@lumina/drawing` | S | `idea` |
| F-30 | **Cuando «Organizar» no cabe, ofrecer agrandar la página** | Hoy avisa («es más grande que la página»); podría proponer el tamaño de página que sí entra (Y25 + Y37b). | editor | M | `idea` |
| F-31 | **Ficha raíz W11** | Está anotada como «ficha raíz, se redacta al cerrar W10»: pendiente de la etapa W. | `etapa-W.md` | — | `idea` |
| F-32 | **Rutina de golden con un solo comando** | Cada ficha de modelo generó sus golden con un spec temporal copiado a mano; un script chico en `scripts/` evitaría el copiar y pegar. | tooling | S | `idea` |
| F-33 | **Pruebas de la galería con `Popover` más rápidas** | Abrir un `Popover` de Radix en jsdom tarda ~40 s y alarga el CI de Packages; hay que revisar si es el entorno o la configuración de las pruebas. | tooling | M | `idea` |

---

## 5. Cómo se promueve una idea a ficha

1. El dueño la elige (o la pide) → su fila pasa a `pedida`.
2. Se redacta su ficha en `docs/tablero/etapa-Y.md` (o en la etapa que corresponda), con las preguntas abiertas de arriba resueltas por el dueño o con sus valores por defecto declarados (Regla 10).
3. La fila de acá queda con `→ ficha Yxx` y su historial sigue en la ficha.
4. Si cambia el modelo, la ficha **empieza** por el golden de «escena vieja idéntica» generado con el código de `main` (DY14), como se hizo en Y23, Y24a, Y32a e Y38a.
