# Etapa R — Ayudas largas detrás de un icono ⓘ

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa R — Menos texto fijo en los paneles del editor

Trabajo **post-migración**. Reglas 1–4 no aplican; Reglas 0, 5–11 vigentes. IDs `R1–R8` (no `L.n`, no `N.n`, no `Q.n`).

**Por qué existe:** los paneles de propiedades del editor muestran siempre párrafos grises explicativos. En el elemento Ecuación hay 5–6 seguidos y ocupan más de la mitad del panel visible. Se decidió (dueño del proyecto) mover **solo los textos largos** (3 líneas o más en el panel, ≈ 90+ caracteres) a un icono ⓘ que, al pulsarlo, muestra el texto. Los de 1–2 líneas **se quedan como están**.

**Criterio de selección (lo fija esta raíz; el operador no lo reabre):**
- **Pasa al ⓘ:** texto explicativo estático de ≥ 90 caracteres (≈ 3 líneas en el panel de ~230 px). Excepción: los de 80–89 caracteres que quedan pegados a otro texto largo del mismo campo (p. ej. «Estado inicial», 107; `\parte{…}`, ~170) se mueven junto con su vecino.
- **Se queda visible:** textos de 1–2 líneas; avisos que dependen del estado y cambian la decisión del docente («La clase no tiene variables», «Sin proveedor disponible», «Sin texto — la máscara no recorta todavía»); estados vacíos y errores; contadores y valores; avisos con fondo de color y `Alert`; todo texto que ve el **alumno** en el viewer; pistas de arrastre sobre el lienzo.
- **Caso mixto (Ecuación):** el aviso «sin línea por línea no avisa a las interacciones» se conserva como **una línea corta** visible solo cuando `pasos !== true`; la explicación larga va al ⓘ.

**Decisiones de diseño (DR1–DR4):**
- **DR1.** Un único componente `FieldHelp` en `@lumina/ui` (lo consumen `element-kit`, `editor-shared` y el frontend). Un botón ⓘ junto a la etiqueta del campo. Abre con clic o teclado, cierra con Escape, `aria-label="Ayuda: <campo>"`, foco visible. Acepta JSX (`<code>`, interpolaciones).
- **DR2.** Textos muy largos (> ~300 caracteres o con pasos: máscara, datos del gráfico, reglas, variables) usan el mismo ⓘ pero se muestran en una ventana más grande («Cómo funciona»). La elección es por una prop, no por dos componentes.
- **DR3.** Los `title=` largos (11 casos) pasan al mismo ⓘ: `title` no se ve en táctil ni con teclado.
- **DR4.** El contenido de ayuda no vive en el DOM mientras está cerrado. Los tests que lean ese texto abren el ⓘ primero.

**Riesgos relevados al redactar (re-medir al tomar cada ficha):**
- `packages/element-kit/src/blocks/ecuacion/ecuacion-properties.aviso.spec.tsx` consulta `[data-ecuacion-aviso-eventos]` sin interacción; con el texto dentro del ⓘ cerrado falla. R2 lo adapta (abrir el ⓘ o mantener la línea corta visible con ese atributo).
- La capa del popup del editor debe quedar por encima de los flyouts y diálogos, y abrirlo no debe quitar la selección del bloque en el lienzo (blur).
- Textos con `<code>` o interpolación se mueven como JSX, no como cadena.

**Orden / dependencias:**
```
R1 ─→ R2 ─→ R3 ─→ R4 ─┐
 ├──→ R5 ─────────────┤
 ├──→ R6 ─────────────┼─→ R8
 └──→ R7 ─────────────┘
```
R3–R7 tocan archivos disjuntos entre sí y pueden ir en paralelo (Regla 10, Concurrencia) una vez `hecho` R1.

**Fuera de alcance:** reescribir o acortar los textos (se mueven tal cual); cambiar los textos de 1–2 líneas; el viewer del alumno; textos de login, dashboard o analytics.

#### R1 — Componente `FieldHelp` en `@lumina/ui`
- **Operador:** Claude Code
- **Estado:** hecho — `FieldHelp` en `packages/ui/src/field-help.tsx`; tsc, eslint y build verdes. **Sin pruebas propias** (decisión del dueño: `@lumina/ui` no tiene runner y no se agrega aquí); su comportamiento (clic, Enter/Espacio, Escape, contenido ausente al cerrar, `aria-label`) se prueba en R2 vía el spec de Ecuación en `element-kit`.
- **Precondición:** ninguna.
- **Alcance — PUEDE tocar:** `packages/ui/src/field-help.tsx` (nuevo) + su prueba + export en `packages/ui/package.json` si el patrón del paquete lo exige. **NO** toca `element-kit`, `editor-shared` ni el frontend.
- **Entregable:** `FieldHelp` con props `label` (para `aria-label`), `children`, `size?: 'normal' | 'large'`. Pruebas: abre con clic y con Enter/Espacio, cierra con Escape, el contenido no está en el DOM cerrado, `aria-label` correcto. Verificación: `pnpm --filter @lumina/ui build && pnpm --filter @lumina/ui test && pnpm --filter @lumina/ui lint`.
- **Cierre:** n/a (no hay código viejo que borrar).

#### R2 — Ecuación (caso de la captura)
- **Operador:** Claude Code
- **Estado:** hecho — 5 textos de Ecuación/Estados al ⓘ + línea corta `data-ecuacion-aviso-corto`; spec adaptado (+ pruebas de `FieldHelp`, diferidas de R1). Verif: `pnpm --filter @lumina/element-kit exec vitest run src/blocks/ecuacion` (21 verdes), tsc y eslint de element-kit y lumina-frontend sin errores. Sin comprobación visual en el editor (requiere sesión).
- **Precondición:** R1 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/blocks/ecuacion/ecuacion-properties.tsx` y `ecuacion-properties.aviso.spec.tsx`; `lumina-frontend/.../panels/properties-panel.tsx` **solo** la función `BlockEstadoInicialSection` (≈ línea 1743) y la sección «Estados (apariencia)» de `block-states-section.tsx` (≈ línea 138), porque se ven en el mismo panel. **NO** toca otros bloques.
- **Entregable:** al ⓘ pasan: aviso de pasos (200), `\parte{id}{…}` (~170), variables con `{{a}}` (96), Estado inicial (107), Estados apariencia (121). Se mantiene la línea corta de advertencia cuando `pasos !== true`. Spec adaptado. Verificación: `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend lint`, más comprobación visual en el editor.

#### R3 — Interacciones y reglas
- **Operador:** Claude Code
- **Estado:** hecho — 8 textos de interacciones/reglas al ⓘ. Tipos, eslint y `vitest --project unit` (519) verdes. Donde el texto largo era a la vez un estado visible (panel anidado, sin plantillas, sin eventos en el simulador, datos del sistema) queda una línea corta visible + ⓘ con el texto íntegro. En el simulador se movió el texto de 94 caracteres «Usa la clase como lo haría un alumno…» (la ficha citaba por error el 99, que son dos mensajes de estado de <90 y se quedan). Descripción de `RuleBuilder`: pasa al ⓘ del título y queda `sr-only` en `DialogDescription` (accesibilidad de Radix). Sin comprobación visual en el editor.
- **Precondición:** R2 `hecho` (valida el patrón en un caso real).
- **Alcance — PUEDE tocar:** `lumina-frontend/.../panels/{interactions-panel,variables-panel,rules-simulator}.tsx` y `panels/rule-builder/{rule-builder,operando-editor}.tsx`. Textos: orden de ejecución, indicador de la clase (131), no dentro de columna (109), plantillas sin soporte (99), datos del sistema (115), «si no» (149), regla general (110), variables (123), simulador (99).
- **Entregable:** textos movidos; los avisos de estado («Sin condiciones: la regla se ejecuta siempre…») se quedan. Verificación: `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit`.

#### R4 — Bloques de canvas (máscara, gráfico, imagen)
- **Operador:** Claude Code
- **Estado:** hecho — al ⓘ: forma libre de la máscara (299, `size=large`), grupo recortado y relleno compartido (133, 110), panel de máscaras (165), encuadre de «Comparar imágenes» (149 + 114 en un solo ⓘ) y mover/ampliar imagen en widgets (113). **Se dejó `grafico-data-dialog.tsx` sin tocar:** los «273» y «124» de la ficha eran varias frases alternativas (una por tipo de gráfico) de ~60–85 caracteres cada una en un diálogo ancho, o sea 1–2 líneas. Verif: tsc (element-kit, editor-shared, lumina-frontend), eslint 0 errores, vitest element-kit 601 y editor-shared 352 verdes. Sin comprobación visual en el editor.
- **Precondición:** R2 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/blocks/clip-group/clip-group-properties.tsx`, `blocks/grafico/grafico-data-dialog.tsx`, `elements/image-compare/image-compare-properties.tsx`, `packages/editor-shared/src/widget-inner-properties.tsx` (línea 307), `lumina-frontend/.../panels/clip-masks-panel.tsx`. Textos: nodos y manijas (299, 165, 133, 110), datos del gráfico (273, 124), encuadre (149, 114, 113). Usan `size="large"` donde pasan de ~300.
- **Entregable:** verificación `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/editor-shared test && pnpm -r lint`.

#### R5 — Widgets
- **Operador:** Cursor
- **Estado:** [en curso: Cursor → ejecutado por Claude Code]
- **Precondición:** R1 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/widgets/{popup,flip-cards,tabla_periodica}/*-properties.tsx` y `flip-cards-inner-properties.tsx`. Textos: Popup (161, 102, 95), tarjetas (151, 113, 92), tabla periódica (106).
- **Entregable:** verificación `pnpm --filter @lumina/element-kit test && pnpm --filter @lumina/element-kit lint`.

#### R6 — Actividades y paneles izquierdos
- **Operador:** Cursor
- **Estado:** pendiente
- **Precondición:** R1 `hecho`.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/activities/globos/globos-properties.tsx`; `lumina-frontend/.../panels/{flyout-left-panels,math-generator-panel,activities-ai-panel}.tsx`. Textos: globos (105), IA desde documento (158), generador de matemáticas (135), IA de actividades (96).
- **Entregable:** verificación `pnpm --filter @lumina/element-kit lint && pnpm --filter lumina-frontend lint`.

#### R7 — Cursos y logros
- **Operador:** Antigravity
- **Estado:** pendiente
- **Precondición:** R1 `hecho`.
- **Alcance — PUEDE tocar:** `lumina-frontend/src/app/(app)/courses/[id]/{new-class-curricular-modal,course-detail-client,gradebook-structure-tab}.tsx`. Textos: 201, 138, 137, 117, 99.
- **Entregable:** verificación `pnpm --filter lumina-frontend lint && pnpm --filter lumina-frontend test:unit`.

#### R8 — `title=` largos y barrido final
- **Operador:** Claude Code
- **Estado:** pendiente
- **Precondición:** R2–R7 `hecho`.
- **Alcance — PUEDE tocar:** los 11 `title=` de ≥ 40 caracteres (`alignment-toolbar`, `interactions-panel`, `grafico-data-dialog`, `grafico-properties`, `resize-handles`, `slide-renderer`, `editor-client`, `preview-client`). Repetir el escaneo de prosa estática ≥ 90 caracteres y confirmar que no queda ninguna fuera de las excepciones del criterio.
- **Entregable:** conteo antes/después en la ficha; verificación `pnpm -r lint && pnpm -r test`.
