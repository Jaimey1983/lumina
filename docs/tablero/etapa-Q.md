# Etapa Q — Química

> Fichas del Tablero de pasos (Regla 10). Las **reglas** viven solo en `AGENTS.md` (Regla 8); este archivo contiene únicamente fichas/historial. Se lee bajo demanda.

### Etapa Q — Química en el lienzo: fórmulas, tabla periódica, motor determinista y práctica evaluable

Trabajo **post-migración** (E1–E7 cerradas). No es migración de elementos: **Reglas 1–4 no aplican**; Reglas 0, 5–11 vigentes. IDs `Q1–Q8` (**no** `L.n`: lint, Regla 10; **no** `N.n`: reservado a la Etapa N — motor de reglas Storyline). Todo **elemento nuevo** (widget, actividad, bloque si aplica) nace como `ElementDefinition` (Regla 2/3), con `puntuacion` delegada a `@lumina/scoring` cuando califique (Regla 7, C5).

**Por qué existe:** Lumina ya tiene matemática en el lienzo (Etapa M: bloque `ecuacion`, `EquationComposer`, KaTeX único en `latex-render.ts`, `respuesta_matematica`, variables M2 + motor K). **No hay dominio químico:** sin tabla periódica, sin `\ce{}`, sin balanceo/estequiometría verificable, sin actividades químicas autocalificables. El currículo MEN ya pide tabla periódica y símbolos (p. ej. `ciencias-naturales-7.json`, unidad «Estructura del átomo y la tabla periódica»; grado 6 símbolos NaCl/H₂O/Cu). Los grados CN 10–11 siguen en placeholder (`J10`).

**Estado real del repo (relevado al redactar esta raíz — re-medir al tomar cada ficha):**
- **Render:** solo `packages/editor-shared/src/rich-text/latex-render.ts` importa `katex` (DM1). **No** hay `katex/contrib/mhchem`. `EquationComposer` tiene 7 pestañas (`equation-insert.ts`: básico, álgebra, geometría, trigonometría, cálculo, griegas, fórmulas); ninguna de química.
- **Scoring:** `algebra.ts` (M4) evalúa expresiones algebraicas; **no** parsea fórmulas químicas ni balancea ecuaciones. `respuesta_matematica` sirve para números (masa molar, moles); no sustituye balanceo ni nomenclatura.
- **Gráficos:** `@lumina/charts` incluye `heatmap` — reutilizable para mapas de propiedad en la tabla periódica (Etapa H).
- **IA:** `contentAssistant` / `IaPanel` (J6/J8) pueden proponer contenido químico; **sin verificador determinista** hoy (alucinaciones frecuentes en coeficientes y fórmulas).
- **Área curricular:** solo `ciencias-naturales` en `AREAS_LABELS`; no existe `quimica` en `loadCurriculum`. La etapa **no** exige nueva área en v1: el módulo sirve dentro de CN y del editor.

**Decisiones de diseño (DQ1–DQ6) — las fija esta raíz; el operador no las reabre (Regla 10):**
- **DQ1. Química en LaTeX = mhchem vía el mismo `latex-render.ts` (extiende DM1).** Se importa `katex/contrib/mhchem` **una vez** en `latex-render.ts`. Se mantienen `trust: false`, `maxSize`/`maxExpand` y **no** se abre `trust: true`. El LaTeX con `\ce{…}` / `\pu{…}` se persiste tal cual en `EquationBlock.latex` y en nodos `math` de texto.
- **DQ2. Lógica química en `@lumina/chemistry` (paquete nuevo, dual ESM+CJS, patrón `@lumina/scoring` / `@lumina/interactions`).** Parser de fórmula, masa molar, composición %, balanceo por sistema lineal (coeficientes enteros mínimos, fracciones exactas), estequiometría básica. **Sin** `eval`/`new Function`. El backend y `@lumina/scoring` importan el mismo código (C5).
- **DQ3. Dataset de elementos propio.** JSON curado en español (118 elementos), fuente IUPAC fechada en metadatos (`sourceVersion`). **No** empaquetar tablas periódicas npm con licencia duda ni llamadas a APIs externas desde el visor del alumno.
- **DQ4. Carga perezosa de peso.** mhchem entra al abrir compositor/ecuación; dataset de elementos al montar widget/actividad; `smiles-drawer` / `3Dmol.js` solo con `dynamic import` al usar visor 3D/2D (Q6).
- **DQ5. Calificación en servidor.** Actividades químicas nuevas declaran `puntuacion` → funciones en `@lumina/scoring` que llaman a `@lumina/chemistry`; fixtures en `activity-scoring.fixtures.json` (paridad cliente/servidor).
- **DQ6. No mezclar con Etapa N.** Las simulaciones (Q7) **consumen** variables de clase y ecuaciones M2 y pueden enlazarse a reglas N cuando existan eventos; esta etapa **no** amplía `interaction.types.ts` salvo que una ficha Q lo declare y no choque con N pendiente.

**Relación con otras etapas:**
- **M (matemática):** Q2 extiende el compositor y el render; Q7 puede vincular `\ce{PV=nRT}` con variables M2.
- **N (reglas):** independiente en código; Q7 puede documentar plantillas «explorar 3 valores antes de avanzar» cuando N5/N7 existan.
- **J10:** contenido JSON CN 10–11 es **complemento** (Q8), no sustituto del motor.
- **K11:** sliders/diales útiles en Q7 (laboratorio); Q7 puede tomarse después de K11 `hecho` o con controles propios acotados.

**Orden / dependencias:**
```
Q1 (#69) ─┬─→ Q3 (#74) ─→ Q5
          ├─→ Q4 (#75)
          ├─→ Q6
          └─→ Q8 (verificador completo)
M1 (hecho) ─→ Q2 (#71) ─→ Q5
Q4 + Q3 ─→ Q5 (plantillas de slide)
Q1 + M2 ─→ Q7 (idealmente + K11)
J8 + Q1 ─→ Q8
```
**Q1b** (ficha histórica para cerrar alcance tras el arranque mínimo de Q4) quedó **absorbida por Q1** (#69) y el merge de **Q4** (#75); **no** abrir PR #77 (obsoleto / conflicto con `main`). **Q6, Q7 y Q8** exigen **Q1 `hecho`** (composición %, estequiometría y dataset en `@lumina/chemistry`). Q5 depende de Q3 y Q4.

**Baselines (re-medir al tomar Q1):** anotar conteos de `@lumina/chemistry` (nuevo), `@lumina/scoring`, `@lumina/element-kit`, `@lumina/editor-shared`, `lumina-backend` `pnpm test`, `lumina-frontend` `test:unit` y orden de build de CI (añadir `@lumina/chemistry` a `predev`/`prebuild` del frontend y al backend cuando haya consumidor).

**Fuera de alcance de la etapa (no pedirlo, no improvisarlo):** RDKit.js / química computacional pesada; área curricular `quimica` separada en `AREAS_LABELS` (decisión del dueño, ficha aparte); PhET embebido completo (solo anotado en `LUMINA_ROADMAP_DETALLADO.md`); editor Lewis/Kekule (tier 3); mecanismos orgánicos animados; SCORM.

#### Q1 — Paquete `@lumina/chemistry` (datos + parser + masa molar + balanceo)
- **Operador:** Cursor
- **Estado:** hecho — merge PR #69 (`6580a7c`); ~45 tests; verif: `pnpm --filter @lumina/chemistry build && test && lint`
- **Precondición:** ninguna (arranque de la etapa).
- **Contexto:** sin este paquete no hay una sola fuente de verdad para actividades, IA verificada ni botones «insertar masa molar» en el compositor. **No** reutilizar `algebra.ts` (M4): gramática distinta (subíndices, hidratos, cargas, ecuaciones con `->`).
- **Alcance — PUEDE tocar:**
  - **Nuevo** `packages/chemistry/` (`@lumina/chemistry`): `package.json` dual ESM+CJS (plantilla `@lumina/scoring`), `exports` desde `dist/`.
  - `src/data/elements.json` (+ metadatos `sourceVersion`, licencia interna).
  - `src/formula/parse.ts` — fórmulas con paréntesis, hidratos (`·`), cargas simples.
  - `src/formula/molar-mass.ts`, `percent-composition.ts`.
  - `src/equation/parse.ts`, `balance.ts` — coeficientes enteros positivos mínimos; rechazo si no hay solución en enteros.
  - `src/stoichiometry/` (v1 acotado: moles dados masas, reactivo límite opcional en ficha si el alcance crece).
  - Specs exhaustivos (`*.spec.ts`); sin dependencias de React/DOM.
  - Raíz: añadir al workspace `pnpm-workspace.yaml`; scripts `build`/`test` en CI.
- **Alcance — NO toca:** `element-kit`, frontend, `latex-render`, actividades UI.
- **Entregable:** `pnpm --filter @lumina/chemistry build && test && lint` verde; al menos 40 casos (parser, masa H₂SO₄/Ca(OH)₂, balanceo H₂+O₂→H₂O, Fe+O₂→Fe₂O₃, rechazo de entrada hostil). Export público documentado en `src/index.ts`.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(chemistry): paquete @lumina/chemistry con datos, parser y balanceo (Q1)`.

#### Q1b — Cierre alcance original Q1 (histórico)
- **Operador:** Cursor
- **Estado:** **cancelado** — alcance cubierto por Q1 (#69) y alineación post #75; PR #77 cerrado sin merge (rama obsoleta, API distinta a `main`).
- **Nota:** remanente opcional fuera de ficha: `percent-composition.spec.ts` y aliases de estequiometría (`moleRatio`, etc.) si un consumidor los documenta.

#### Q2 — Notación química en el compositor (mhchem + pestaña Química)
- **Operador:** Cursor
- **Estado:** **hecho** — merge PR #71 (2026-10-04). mhchem en `latex-render.ts`, pestaña `quimica`, `speakLatex` con llaves balanceadas en `\ce`/`\pu` y cargas iónicas.
- **Precondición:** M1 `hecho` (DM1: único `latex-render.ts`).
- **Contexto:** el docente ya usa el bloque `ecuacion` y el `EquationComposer`; la vía de menor fricción es una pestaña «Química» con plantillas `\ce{}` y `\pu{}`, no un bloque paralelo.
- **Alcance — PUEDE tocar:**
  - `packages/editor-shared/src/rich-text/latex-render.ts` — import side-effect `katex/contrib/mhchem`; tests de render con `\ce{H2SO4}`, reacción con `->`, estados `(s)(aq)`.
  - `packages/editor-shared/src/rich-text/equation-insert.ts` — nueva pestaña `quimica` en `MATH_TABS`: plantillas (molécula, ion, reacción, equilibrio, unidades `\pu{}`, ejemplos curriculares H₂O, NaCl, neutralización).
  - `speakLatex` — rama o heurística para no leer `\ce` como ruido (mínimo: strip `\ce`/`\pu` y leer símbolos elementales; ideal: texto alternativo del docente sigue primando en `EquationView`).
  - `packages/editor-shared/src/rich-text/latex-render.spec.ts` (+ casos mhchem).
- **Alcance — NO toca:** schema `EquationBlock`, `@lumina/chemistry` (opcional: botón «Insertar masa molar» llama a Q1 en ficha posterior Q2b si se difiere).
- **Entregable:** vista previa del compositor renderiza `\ce{2H2 + O2 -> 2H2O}` sin error; ecuaciones viejas sin mhchem siguen igual; `pnpm --filter @lumina/editor-shared build && test && lint` · `pnpm --filter @lumina/element-kit build && test` (paridad ecuación).
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(chemistry): mhchem y pestaña Química en el compositor de ecuaciones (Q2)`.

#### Q3 — Widget `tabla_periodica` (familia Lienzo)
- **Operador:** Cursor
- **Estado:** **hecho** — merge PR #74 (2026-10-04).
- **Precondición:** Q1 `hecho` (datos de elementos).
- **Contexto:** diferenciador pedagógico alineado con DBA CN-7 (ubicar elementos, propiedades, tendencias). Familia **Lienzo** (como Tabs/Carousel): marco en el slide, configuración rica, viewer interactivo.
- **Alcance — PUEDE tocar:**
  - `packages/types` — tipo de widget/bloque si hace falta campo en `WidgetBlock` o bloque dedicado (aditivo).
  - `packages/element-kit/src/{widgets,elements}/tabla_periodica/` — `ElementDefinition` completo (Editor, Viewer, Propiedades, `catalogo`, registro, `eventos` opcionales: `visitado`, `seleccionado`).
  - UI: rejilla 118 celdas, ficha lateral (Z, A, grupo, periodo, configuración electrónica v1, usos breves), filtros (metal / no metal / metaloide / gas noble; bloque s/p/d/f), modo heatmap de una propiedad numérica del dataset.
  - Accesibilidad: `role="grid"`, navegación con flechas, `aria-selected`, leyenda no solo por color (valor en tooltip/texto).
  - Acción docente «Insertar símbolo en ecuación seleccionada» → `\ce{Fe}` en el bloque `ecuacion` activo (si hay API de selección en editor; si no, copiar al portapapeles con toast).
  - `tabla_periodica.parity.spec.tsx` + tests de datos.
- **Alcance — NO toca:** `@lumina/scoring`, backend, `@lumina/charts` salvo heatmap CSS interno (si se usa `<LuminaChart type="heatmap">`, declararlo en la ficha al ejecutar).
- **Entregable:** insertar desde flyout (Q5) o panel elementos; en viewer el alumno selecciona, filtra y ve ficha; sin overflow del marco del widget. Verif: `@lumina/element-kit` build/test/lint · `cd lumina-frontend && npx tsc --noEmit && pnpm test:unit`; QA manual en producción (selección, filtro, teclado en una celda).
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(element-kit): widget tabla periódica interactiva (Q3)`.

#### Q4 — Actividades químicas autocalificables (balanceo, ubicación, formulación)
- **Operador:** Cursor
- **Estado:** **hecho** — merge PR #75 (2026-10-04); verif: `pnpm --filter @lumina/chemistry test`, `pnpm --filter @lumina/scoring test`, `pnpm --filter @lumina/element-kit test`
- **Precondición:** Q1 `hecho`.
- **Contexto:** valor en aula = práctica con nota en servidor (C5). Patrón `respuesta_matematica` (M3a): tipo propio, `binary` o `partial` según actividad, `evaluateActivityResponse` en scoring.
- **Alcance — PUEDE tocar:**
  - `@lumina/types` — uniones `Activity` para: `balancear_ecuacion`, `ubicar_elemento`, `formular_compuesto` (nombres finales en snake_case como el resto).
  - `@lumina/scoring` — evaluadores que llaman `@lumina/chemistry`; entradas en `ACTIVITY_SCORING_KINDS` y `activity-scoring.fixtures.json` (mín. 5 casos por tipo).
  - `@lumina/element-kit` — tres `ElementDefinition` con Editor/Viewer/Propiedades, `puntuacion`, eventos `respuesta_correcta`/`incorrecta` (K7a).
  - `balancear_ecuacion`: coeficientes con +/- UI; validación = mismo vector balanceado que Q1 (tolerancia: equivalente escalar).
  - `ubicar_elemento`: **partial** — aciertos / total (arrastrar símbolo a celda o elegir fila/columna según diseño UX).
  - `formular_compuesto`: v1 inorgánica acotada (Stock/tradicional → fórmula Unicode normalizada); **binary** o partial por subpreguntas.
  - Frontend: `activities-panel.tsx`, plantillas en `editor-client`, catálogo en `CATALOGO_ELEMENTOS`.
- **Alcance — NO toca:** motor de reglas N, nota manual `short_answer`.
- **Entregable:** las tres actividades insertables, responden en autónomo, `POST …/progress` con score coherente con fixtures; backend `pnpm test` incluye paridad fixtures. Verif: `@lumina/scoring` · `@lumina/element-kit` · `lumina-backend` · `lumina-frontend` como en M3a.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(element-kit): actividades químicas autocalificables (Q4)`.

#### Q5 — Panel «Química» en el flyout y plantillas de slide
- **Operador:** Cursor
- **Estado:** **hecho** — merge PR #79 (2026-10-04); verif: `pnpm --filter @lumina/element-kit test`
- **Precondición:** Q3 `hecho` y Q4 al menos una actividad `hecho` (o Q2 si solo se ofrece ecuación + calculadora).
- **Contexto:** el docente no debe buscar la tabla bajo «Elementos» genéricos. Patrón familias de gráficos (Etapa I): sección dedicada en `flyout-left-panels.tsx`.
- **Alcance — PUEDE tocar:**
  - `lumina-frontend/.../flyout-left-panels.tsx` — grupo **Química**: insertar tabla periódica, ecuación con plantilla química, actividades Q4, acceso rápido al compositor químico.
  - **Nuevo** `packages/element-kit/src/chemistry/chemistry-slide-templates.ts` (o bajo `blocks/`): 2–3 plantillas (tabla + ecuación `\ce{}` + quiz balanceo) que crean bloques por defecto alineados a CN-7.
  - `icon-rail` / config de paneles si hace falta entrada «Química».
- **Alcance — NO toca:** currículo JSON (Q8), IA.
- **Entregable:** desde el flyout se insertan elementos en un slide vacío con `PATCH` 200; plantillas documentadas en la ficha al cerrar. Verif: frontend build/test/unit · QA manual insertar cada ítem.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(editor): panel Química en el flyout y plantillas de slide (Q5)`.

#### Q6 — Visor molecular (SMILES 2D, PubChem vía backend)
- **Operador:** Cursor
- **Estado:** **hecho** — merge #81 (`molecula`, PubChem proxy, flyout).
- **Precondición:** Q1 `hecho`.
- **Contexto:** estructura 2D para bachillerato; 3D opcional en sub-ficha Q6b si el peso de `3Dmol.js` lo exige el dueño.
- **Alcance — PUEDE tocar:**
  - Widget o bloque `molecula` (`ElementDefinition`): campo `smiles` o búsqueda por nombre.
  - `smiles-drawer` (MIT) con `dynamic import` en el viewer.
  - **Backend** `lumina-backend/src/chemistry/` (o módulo existente): proxy PubChem PUG REST con caché (Redis o tabla), **sin** que el cliente del alumno llame a PubChem directo.
  - Props: rotación 2D no requerida en v1; alt text con fórmula molecular del dataset Q1 cuando aplique.
- **Alcance — NO toca:** `@lumina/scoring`, reglas N.
- **Entregable:** docente pega SMILES o nombre común → se dibuja 2D en el slide; búsqueda por nombre funciona con red en backend. Verif: element-kit tests · backend spec del proxy · QA manual.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(chemistry): visor molecular 2D y búsqueda PubChem cacheada (Q6)`.

#### Q7 — Laboratorio: simulaciones con variables, ecuaciones y gráficos
- **Operador:** Cursor
- **Estado:** **hecho** — merge #82 (`lab/*`, plantillas gas ideal + dilución, `simulacionQuimica`).
- **Precondición:** Q1 `hecho`; M2 `hecho` (variables en ecuación); **recomendado** K11 `hecho` (slider/dial evaluable) — si K11 no está, la ficha puede limitarse a ajustadores M2 en la ecuación sin widget slider nuevo.
- **Contexto:** pH, gas ideal, dilución, titulación simplificada — funciones **puras** en `@lumina/chemistry` + visualización `@lumina/charts` + bloques existentes en un slide plantilla.
- **Alcance — PUEDE tocar:**
  - `@lumina/chemistry/src/lab/` — `phStrong()`, `idealGas()`, `dilution()`, `titrationCurve()` (+ specs).
  - Plantillas de slide en Q5 o aquí: ecuación `\ce{PV=nRT}` con vínculos M2, gráfico línea/área desde `@lumina/charts`, texto explicativo.
  - Documentar enlace con motor K/N: «bloquear avance hasta N cambios» como guía docente (sin implementar N9).
- **Alcance — NO toca:** PhET iframe; `@lumina/scoring` salvo actividad nueva explícita.
- **Entregable:** al menos **dos** simulaciones empaquetadas como plantillas probadas (docente inserta, alumno mueve variable, gráfico y ecuación se actualizan en preview/autónomo). Verif: chemistry + charts tests · QA en producción.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(chemistry): plantillas de laboratorio con gráficos y variables (Q7)`.

#### Q8 — IA verificada y contenido curricular CN (complemento J10)
- **Operador:** Cursor
- **Estado:** hecho — merge PR #84; verificador post-LLM, catálogo IA +25 tipos química, badges ActivitiesAiPanel
- **Precondición:** Q1 `hecho`; J8/J11 (transparencia modo) deseable para mostrar «rechazado por verificador».
- **Contexto:** la IA propone actividades y fórmulas; `@lumina/chemistry` **valida** antes de mostrar al docente (balanceo, masa molar, fórmula parseable). Contenido: sustituir placeholders `ciencias-naturales-10.json` / `11.json` donde toque química (trabajo de contenido + pipeline Prompt Maestro, fuera del alcance de código salvo loaders).
- **Alcance — PUEDE tocar:**
  - `lumina-backend/src/ai-features/` — paso post-Gemini: `balanceEquation` / `parseFormula` en propuestas químicas; marcar `resolvedStatus` como en J11.
  - `IaPanel` / `ActivitiesAiPanel` — badge «Verificado química» / «Revisar: no balancea».
  - `packages/curriculum-data/src/data/ciencias-naturales-{10,11}.json` — solo si el dueño entrega JSON real (coordinar con J10; no inventar DBA).
- **Alcance — NO toca:** modelo de reglas N; nuevas áreas en `AreaCurricular` sin decisión escrita del dueño.
- **Entregable:** prompt de actividad química que la IA devuelve **no** se muestra si el balanceo falla; al menos un test de integración del verificador. Verif: backend test · QA generar actividad balanceo en panel IA.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(ai): verificación química determinista en generación (Q8)`.

#### Q9 — Datos de la tabla periódica: grupos, categorías y propiedades correctas
- **Operador:** Claude Code
- **Estado:** hecho — merge PR #89. grupos/categorías/nombres corregidos, `meltK`/`boilK`/`discoveredBy` (Bowserinator, CC BY-SA), configuración electrónica con 20 excepciones; verif: `pnpm --filter @lumina/chemistry build && test && lint` (57 tests), `pnpm --filter @lumina/element-kit build && test && lint` (576 tests). Nota: `elements-data.ts`/`element-store*.ts` siguen huérfanos (sin consumidores).
- **Precondición:** Q1 `hecho`, Q3 `hecho`.
- **Contexto:** `elements.json` (generado por `scripts/generate-elements.mjs`) tiene `group: null` en los 118 elementos y categorías erróneas (B, C, As, Sb, Te, Po, Bi, Sn, Pb, Fl, Mc, Lv, Nh), más nombres «Cinc/Erio/Tantalio» (`elements-data.ts` ya trae Zinc/Erbio/Tántalo). Sin esto, el heatmap por grupo no funciona y cualquier color por categoría sería falso. Fuente de propiedades: Bowserinator/Periodic-Table-JSON (CC BY-SA 3.0, atribuir en metadatos).
- **Alcance — PUEDE tocar:** `packages/chemistry/scripts/generate-elements.mjs`, `src/data/elements.json`, `elements.dataset.ts`, `elements.ts` (campos aditivos opcionales `meltK`, `boilK`, `discoveredBy`), `elements.spec.ts`; `packages/element-kit/src/widgets/tabla_periodica/periodic-metadata.ts` y `periodic-dataset.spec.ts` (ficha: configuración electrónica con excepciones, nuevos campos).
- **Alcance — NO toca:** layout/CSS del widget (Q10), `@lumina/types`, backend, `elements-data.ts`/`element-store*.ts` (código huérfano: se reporta, no se borra aquí).
- **Entregable:** 118 elementos con `group` correcto (La/Ac = 3; Ce–Lu y Th–Lr = null, bloque f), categorías corregidas, nombres corregidos, configuración electrónica correcta en excepciones (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au, La, Ce, Gd, Ac, Th, Pa, U, Np, Cm), tests que fijan grupos/categorías de los 118. Verif: `pnpm --filter @lumina/chemistry build && test && lint` · `pnpm --filter @lumina/element-kit build && test`.
- **Cierre:** no aplica Regla 4. Commit sugerido: `fix(chemistry): grupos, categorías y propiedades correctas de la tabla periódica (Q9)`.

#### Q10 — Tabla periódica: layout (La/Ac en grupo 3, filas f separadas) y ficha lateral
- **Operador:** Claude Code
- **Estado:** hecho — merge PR #89. La/Ac en (6,3)/(7,3), f-rows 58–71/90–103 con fila 8 separadora, ficha lateral (container query <560px apila), flechas saltan huecos; `.ptCell:disabled{visibility:hidden}` retirado (filtradas se atenúan con `ptCellDim`). Verif: element-kit build/test/lint · `npx tsc --noEmit` · captura en build de producción.
- **Precondición:** Q9 `hecho` (mismo PR admitido).
- **Contexto:** (1) La (57) y Ac (89) van en las filas f; en la referencia (Google Arts) están en el grupo 3 del cuerpo y las filas f son 58–71 / 90–103, separadas por una fila vacía. (2) `.whContent` (editor-shared) fuerza `flex-direction: column`; `.ptBody` pide `row` y pierde, así que la ficha cae debajo y aplasta la tabla.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/widgets/tabla_periodica/{periodic-layout.ts,tabla-periodica-viewer.tsx,tabla-periodica.module.css}` y sus specs.
- **Alcance — NO toca:** `widget-chrome.module.css` (editor-shared), colores por categoría y modelo de Bohr (Q11/Q12), tipos.
- **Entregable:** rejilla de 10 filas (fila 8 vacía), La/Ac en (6,3)/(7,3), f-rows 58–71 y 90–103; ficha a la derecha sin desplazar ni recortar la tabla (la tabla conserva su proporción y la ficha hace scroll propio); navegación por flechas coherente con el nuevo layout; spec del layout (118 posiciones únicas, sin colisiones). Verif: `pnpm --filter @lumina/element-kit build && test && lint` · `cd lumina-frontend && npx tsc --noEmit`; QA en navegador del viewer con una celda seleccionada.
- **Cierre:** no aplica Regla 4. Commit sugerido: `fix(element-kit): La/Ac en grupo 3 y ficha lateral sin ocultar la tabla periódica (Q10)`.

#### Q11 — Tabla periódica: color por categoría, leyenda interactiva y ficha con tarjeta
- **Operador:** Claude Code
- **Estado:** hecho — merge PR #89. Paleta de 10 categorías (`.ptRoot [data-cat]`: los CSS modules exigen clase local), celda con Z/símbolo/nombre (nombre desde 760 px), leyenda clicable/hover que atenúa el resto (oculta con heatmap), ficha con tarjeta de color, `prefers-reduced-motion`; spec de la paleta. Verif: element-kit build/test/lint · `npx tsc --noEmit` · capturas en build de producción (reposo, categoría resaltada, heatmap por grupo).
- **Precondición:** Q9 y Q10 en la misma rama (datos y layout correctos).
- **Contexto:** la celda es blanca con símbolo de 12 px; la referencia (Google Arts) pinta cada categoría, muestra símbolo grande con nombre debajo, atenúa el resto al resaltar una categoría y tiene ficha con tarjeta de color.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/widgets/tabla_periodica/{tabla-periodica-viewer.tsx,tabla-periodica.module.css,periodic-metadata.ts}` y specs nuevos de esa carpeta.
- **Alcance — NO toca:** `@lumina/types`/configuración persistida (el resaltado de categoría es estado local del viewer), editor-shared, modelo de Bohr (Q12).
- **Entregable:** paleta de 10 categorías (texto con contraste AA); celda con Z, símbolo grande y nombre; leyenda de categorías clicable/hover que atenúa el resto (oculta con heatmap activo); ficha lateral con tarjeta (símbolo grande, nombre, Z, categoría con su color); color nunca como único canal (`aria-label`/`title`/ficha llevan la categoría); `prefers-reduced-motion` sin transiciones. Verif: `pnpm --filter @lumina/element-kit build && test && lint` · `cd lumina-frontend && npx tsc --noEmit` · captura en build de producción.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(element-kit): color por categoría y leyenda interactiva en la tabla periódica (Q11)`.

#### Q12 — Tabla periódica: modelo de Bohr animado en la ficha (sin three.js)
- **Operador:** Claude Code
- **Estado:** [en curso: Claude Code]
- **Precondición:** Q9–Q11 `hecho` (mergeados en #89).
- **Contexto:** la referencia (Google Arts) muestra un modelo de Bohr animado en la ficha. Decisión del dueño: **sin three.js** por ahora (peso de bundle); SVG + CSS puro. Un 3D con rotación libre queda como ficha aparte (Q13) si se pide.
- **Alcance — PUEDE tocar:** `packages/element-kit/src/widgets/tabla_periodica/{bohr-model.tsx,periodic-metadata.ts,tabla-periodica-viewer.tsx,tabla-periodica.module.css}` y specs nuevos de esa carpeta.
- **Alcance — NO toca:** dependencias (`package.json`), `@lumina/chemistry`, tipos, otros widgets.
- **Entregable:** `capasElectronicas(z)` (electrones por capa derivados de la configuración electrónica de Q9, suma = Z en los 118); componente SVG con núcleo, órbitas y un electrón por punto, capas girando a distinto ritmo; `prefers-reduced-motion` y miniatura sin animación; alternativa textual (`role="img"` + `aria-label` con las capas); se muestra en la ficha bajo la tarjeta. Verif: `pnpm --filter @lumina/element-kit build && test && lint` · `cd lumina-frontend && npx tsc --noEmit && pnpm build` · captura en build de producción.
- **Cierre:** no aplica Regla 4. Commit sugerido: `feat(element-kit): modelo de Bohr animado en la ficha de la tabla periódica (Q12)`.

#### Cierre de la Etapa Q
La etapa se cierra cuando **Q1–Q5** estén `hecho` (motor + compositor + tabla + actividades + flyout) — **ciclo mínimo usable en aula**. Q6–Q8 son **alto valor** pero **no bloquean** el cierre de la etapa si el dueño prefiere entregar en dos olas (anotar en el commit de cierre). QA obligatoria en build de producción para Q3–Q5 y Q4 en autónomo. Al cerrar, actualizar esta raíz con baselines finales y enlazar evidencias DBA CN-6/7 en la descripción de plantillas.
