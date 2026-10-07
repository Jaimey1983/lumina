# Lumina — Convenciones de trabajo (fuente única)

> **Migración a la Estructura Única — TERMINADA (E1–E7 cerradas).** 2026-09-07.
> El grafo quedó `lumina-frontend → @lumina/element-kit → {@lumina/editor-shared,
> @lumina/ui, @lumina/types, @lumina/scoring, @lumina/element-kit-core}` **sin
> ciclo y sin shims**. Todos los elementos (widgets, actividades, bloques de
> canvas, primitivos) viven en `packages/element-kit/src/`; el frontend es
> consumidor puro. E7.6 se cerró por la **vía A opción 1** (paquetes
> `@lumina/types` + `@lumina/ui` + `@lumina/editor-shared`, luego mover los ~230
> componentes por familia — E7.6.3a/b/c, E7.6.4a/b, E7.6.5a/b, E7.6.6 — y cortar
> el dep en E7.6.7). `ignoreWorkspaceCycles` retirado; `pnpm -r build|test|lint`
> vuelve a ser comando de verificación válido. E7.4 (`element-kit-classic.ts` +
> `./editor-activities`) cerrada en E7.6.4b. `grep -rn "TODO(migración-etapa"` →
> **0**. Detalle: Tablero de pasos, etapa E7.
>
> A partir de acá el repo NO está en migración: las Reglas 1–4 (orden de etapas,
> ley de "nada nuevo en el sistema viejo", cierre obligatorio) ya no aplican —
> los elementos nuevos nacen como `ElementDefinition` en `packages/element-kit/`.
> Las Reglas 0, 5–11 siguen vigentes.

Este archivo es la **única** fuente de verdad para cómo se trabaja en este repositorio. Lo leen, sin excepción y con el mismo contenido:

- **Claude Code** — vía `CLAUDE.md` en la raíz (`@AGENTS.md`) y en cada paquete.
- **Cursor** — de forma nativa como regla base, más `.cursor/rules/*.mdc` para reglas ya existentes con alcance específico (editor de canvas). Ningún `.mdc` nuevo redefine lo que dice este archivo — solo puede apuntar aquí.
- **Antigravity** — de forma nativa desde v1.20.3. **No crear un `GEMINI.md` en la raíz**: si existe, Antigravity le da prioridad sobre este archivo para reglas en conflicto, y volveríamos a tener dos fuentes de verdad por la puerta de atrás.

Si una herramienta sugiere algo que contradice este documento, **este documento gana siempre**. Si hace falta una regla nueva, se agrega acá — nunca en un archivo paralelo.

Contexto completo del diagnóstico y la hoja de ruta: informe "Plano Lumina" (peritaje + hoja de ruta de corrección + estructura única, 7 etapas). `LUMINA_CONTEXT_V41.md` en la raíz tiene el historial de producto previo a esta migración.

---

## Regla 0 — Jerarquía

1. Este archivo.
2. Los contratos ya existentes y vigentes (ej. `.cursor/rules/lumina-canvas-editor-contracts.mdc` para el editor de canvas, mientras esa parte no haya migrado al nuevo contrato).
3. La convención de la herramienta que estés usando.
4. Preferencia personal — **no aplica** en este proyecto durante la migración.

## Regla 1 — Orden de migración obligatorio, sin saltos

Las etapas se ejecutan en este orden y no se empieza una sin haber cerrado la anterior (ver sección "Cierre obligatorio" de cada una en el informe):

1. Diseñar `@lumina/element-kit` + piloto con Botón.
2. Migrar **actividades** (fusionar los dos registros existentes en uno, conectar `@lumina/scoring`).
3. Migrar **widgets** (piloto: Ruleta).
4. Migrar **bloques de canvas y formas vectoriales** (incluye el editor Paper.js).
5. Unificar **estado del editor** (reducer central, persistencia por diferencia, historial por diferencia).
6. Conectar **Lumina Core con Lumina Edu** sobre el mismo motor de puntuación.
7. Retirar todo registro/switch/archivo viejo que ya nadie referencia.

No se trabaja la Etapa 4 antes de haber cerrado (código viejo borrado) las Etapas 2 y 3. No se toca la Etapa 5 antes de que exista un elemento migrado de cada categoría.

## Regla 2 — El contrato de elemento

- Paquete: `packages/element-kit` dentro del workspace pnpm real (`packages:` en `pnpm-workspace.yaml` — si todavía no existe, es lo primero que se crea).
- Toda instancia de `ElementDefinition` declara, como mínimo: `tipo`, `crearPorDefecto()`, `Editor`, `Viewer`, `Propiedades`, `apariencia` (color/tipografía/animación), y opcionalmente `puntuacion` (delegado a `@lumina/scoring`).
- Un único punto de registro: `ElementRegistry.registrar(definicion)`. No se crean registros paralelos por dominio (widgets/actividades/bloques ya no son sistemas distintos).

## Regla 3 — Ley de la migración: nada nuevo en el sistema viejo

Desde el momento en que `@lumina/element-kit` existe (fin de Etapa 1):

- **Prohibido** agregar un tipo de actividad, widget o bloque nuevo a `activity-registry.ts`, `widget-registry.ts` o al union de `Block` viejo. Todo elemento nuevo nace directo como `ElementDefinition`.
- Esto aplica incluso si el elemento nuevo pertenece a una categoría que todavía no migró del todo — se migra ese elemento puntual primero, o se bloquea el PR.

## Regla 4 — Cierre obligatorio (no quedan dos caminos)

Ningún PR de migración se da por terminado dejando el código viejo "por si acaso". Dos únicas salidas:

- El PR borra el código/registro viejo del elemento migrado, **o**
- El PR deja un comentario `TODO(migración-etapa-N)` con el nombre exacto del archivo a borrar y un issue/ticket vinculado con fecha.

"Dejar ambos caminos indefinidamente" no es una opción válida — es exactamente el patrón que causó la fragmentación original.

## Regla 5 — Autorización, sin excepciones

- Toda ruta del backend con alcance de curso llama a `CourseAuthorizationService`. No hay checks de propiedad hechos a mano dentro de un service.
- Toda ruta nueva declara `@Roles(...)` explícito. Una ruta sin `@Roles()` es motivo de rechazo en revisión, no una advertencia.
- El guard de roles es "denegar por defecto" — si en algún momento se cambia esa lógica, es una decisión de este documento, no de un PR individual.

## Regla 6 — Commits

Se mantiene la convención ya usada en el repo (`feat:`, `fix:`, `chore:`, en español, con descripción corta). Para esta migración, usar además:

- `refactor(element-kit): migrar <Elemento> a ElementDefinition`
- `chore(element-kit): retirar registro viejo de <Elemento>`
- `feat(element-kit): <funcionalidad nueva construida sobre el contrato>`

## Regla 7 — Nada se migra sin red de seguridad

- CI (lint + test + build) debe estar corriendo en cada PR antes de tocar la Etapa 2. Si todavía no existe, es lo primero de todo, antes que el propio `element-kit`.
- Todo elemento migrado necesita una prueba que compare su comportamiento contra el elemento viejo (misma entrada → misma salida visible) antes de borrar el código viejo.
- `pnpm test` en `lumina-backend` tiene que correr sin errores antes de empezar — hoy está roto por una referencia a un script eliminado; es un bloqueante de Regla 7, no un detalle aparte.

## Regla 8 — Un solo archivo de reglas, siempre

Nadie crea un segundo documento de convenciones en ninguna herramienta (otro `.md` de reglas, otro `.mdc` que repita en vez de referenciar, notas sueltas en el README de un paquete). Ampliaciones y excepciones se agregan **en este archivo**, con su propio commit, para que las tres herramientas las vean al mismo tiempo.

## Regla 9 — Protocolo obligatorio de corrección de errores (lint, tipos, CI)

Aplica a cualquier error preexistente que se decida corregir (empezando por los 209 de `lumina-backend` y 165 de `lumina-frontend` detectados al activar CI). No se "arregla sobre la marcha" — se sigue este orden, sin saltarse pasos:

1. **Revisar a profundidad** — entender la causa real del error, no solo silenciarlo (nunca `// eslint-disable` como primera opción).
2. **Verificar el alcance** — ¿es un patrón repetido o un caso aislado? ¿toca un tipo/función usado en otros lados?
3. **Constatar cantidad** — cuántos archivos y cuántas ocurrencias exactas afecta esa misma causa, antes de tocar el primero.
4. **Corregir** — el fix real (tipar correctamente, no `any`/`as any` de parche), agrupando por causa común, no archivo por archivo al azar.
5. **Revisar que la corrección no genere errores nuevos** — re-lintear/re-testear después de cada tanda antes de seguir con la siguiente.
6. **Refactorizar** si la corrección deja a la vista una duplicación u oportunidad de simplificar (sin expandir el alcance del cambio más allá de lo necesario).

**Decisión tomada:** el CI nace estricto desde el día uno — `pnpm lint` es bloqueante en el workflow, sin `continue-on-error`. Eso significa que el CI va a estar en rojo hasta que este protocolo termine de limpiar los 209 errores de `lumina-backend` y los 165 de `lumina-frontend`. Es intencional: no se avanza a la Etapa 1 del `element-kit` mientras el CI no esté verde con lint estricto. Cada tanda de corrección se verifica corriendo `pnpm lint` localmente antes de subir el cambio, para confirmar que el conteo de errores baja y no sube.

## Regla 10 — Tablero de pasos y órdenes de trabajo

El trabajo se reparte entre tres operadores — **Claude Code**, **Cursor**, **Antigravity** — en pasos atómicos (un paso = un PR). Cada paso vive como una **ficha** en la sección **«Tablero de pasos»** (índice al final de este archivo; fichas en `docs/tablero/`). El prompt que recibe un operador es corto **a propósito**: todo el detalle está en la ficha.

### Prompt canónico del operador

> Realizá el paso `<ID>` del Tablero de pasos de `AGENTS.md`. Leé la ficha completa y las Reglas 0–11. No te salgas del alcance declarado en la ficha (archivos que puede tocar / que no). Corré el comando de verificación de la ficha; no lo des por terminado si algo falla. Al terminar dejá el estado en `en revisión` con una línea de qué hiciste y qué comando corriste.

Nada más. Si el operador necesita algo que **no** está en la ficha, no improvisa: pide que se complete la ficha primero y espera.

### Anatomía de una ficha (todos los campos obligatorios)

| Campo | Qué es |
|---|---|
| **ID** | `E<etapa>.<n>` migración · `F1.<n>` riesgo Fase 1 · `L.<n>` **lint** (Regla 9; no confundir con etapas de producto) · `X.<n>` fuera de hoja de ruta · **Letra de etapa + número** post-migración: `G`, `H`, `I`, `J`, `K`, `M`, `N`, `Q`, … (`M1`, `N0`, `Q1`…). **`N` = motor Storyline/reglas**; **química = `Q`**, nunca `N` ni `L` |
| **Título** | Una línea imperativa ("Realizá X"). |
| **Operador** | Claude Code · Cursor · Antigravity. |
| **Estado** | `pendiente` → `[en curso: <op>]` → `en revisión` → `hecho`; o `bloqueado por <ID>`. |
| **Precondición** | Qué fichas deben estar `hecho` antes. Si la Regla 1 lo impide, se dice acá. |
| **Alcance** | Carpetas/archivos que el paso PUEDE tocar y los que NO. Un cambio fuera de esto = rechazo en revisión. |
| **Entregable** | Qué existe al terminar: código + prueba (paridad si aplica, Regla 7) + el **comando de verificación exacto**. |
| **Cierre** | Regla 4 si aplica: qué código viejo se borra, o qué `TODO(migración-etapa-N)` queda con ticket y fecha. |

### Quién redacta las fichas

- Las fichas de la **etapa activa** se redactan **antes** de asignarlas. Una ficha incompleta no se asigna — se completa primero (commit `chore(tablero): …`), después se reparte.
- Las fichas de una etapa futura se redactan **al cerrar la etapa previa** (Regla 1), no antes: así reflejan el estado real del código. La ficha «raíz» de cada etapa dice quién la redacta.
- Si al ejecutar un paso el alcance resulta mal estimado, el operador **para**, deja el estado en `bloqueado por <ID>` o pide reescribir la ficha — no la amplía por su cuenta (Regla 9 §2, Regla 4).

### Concurrencia

- Un operador toma **una** ficha a la vez, salvo que dos fichas sean independientes y toquen conjuntos de archivos **disjuntos**.
- Si dos fichas activas podrían tocar el mismo archivo, **no** corren en paralelo — la segunda espera.
- `[en curso: <op>]` + commit **antes** de empezar. Sin ese commit, otro operador puede reclamar la misma ficha.

## Regla 11 — Los operadores ejecutan sin pedir permiso paso a paso

Aplica a **Antigravity, Cursor, Codex y Claude Code**. Interrumpir pidiendo confirmación por cada acción (Antigravity llega a ~3 prompts por minuto) frena el trabajo sin sumar seguridad real: el alcance ya está acotado por la ficha (Regla 10) y la red de seguridad es el CI + los tests (Regla 7).

- El operador ejecuta **todas las acciones de su ficha sin pedir confirmación**: leer y escribir archivos, correr `pnpm` / `npx` / tests / lint, `git add` de sus propios archivos, `git commit`, crear ramas locales.
- El permiso es **por adelantado y para todo el ciclo de la ficha** — no se pregunta comando por comando. Si el cliente tiene un modo "auto-run / YOLO / ejecutar sin confirmar", se deja activado para este repo.
- Sigue acotado por: el **alcance declarado en la ficha** (archivos que puede / no puede tocar) y las Reglas 0–11. "Sin preguntar" **no** habilita salir del alcance, tomar otra ficha, ni saltarse un paso del protocolo.
- **Sí** se para y se pide confirmación explícita antes de:
  - operaciones destructivas irreversibles sobre historia o estado compartido: `git push --force`, `git reset --hard` sobre commits ya empujados, borrar ramas remotas, reescribir historia, `git clean -fdx`;
  - `git add -A` / `git add .` (siempre se stagean rutas explícitas — el árbol tiene trabajo sin commitear de otros operadores);
  - `git push` (empujar a `origin` se consulta salvo que la ficha lo pida explícitamente);
  - cualquier cosa fuera del alcance de la ficha (ahí aplica `bloqueado`, Regla 10).

## Definition of Done por elemento migrado

- [ ] Implementa `ElementDefinition` completo (editor, viewer, propiedades, apariencia, puntuación si aplica).
- [ ] Registrado únicamente vía `ElementRegistry.registrar()`.
- [ ] Prueba de paridad contra el comportamiento viejo.
- [ ] Código/registro viejo borrado o `TODO` con ticket vinculado (Regla 4).
- [ ] CI verde.

## Tablero de pasos (índice)

Las fichas viven en `docs/tablero/`, **una por etapa**. No se cargan de forma automática: al recibir el prompt canónico («Realizá el paso `<ID>`»), abrí **solo** el archivo de la etapa del ID. Las reglas siguen únicamente en este archivo (Regla 8); esos archivos contienen fichas e historial, nunca reglas nuevas. Si una ficha cambia de estado, se edita en su archivo.

| Etapa / IDs | Archivo | Estado |
|---|---|---|
| F1.x, L.x, X.1–X.3 | `docs/tablero/fase1-lint-abiertos.md` | X.2/X.3 en revisión |
| E1–E7 (migración) | `docs/tablero/migracion-E1-E7.md` | cerrada |
| G (alineación/guías) | `docs/tablero/etapa-G.md` | cerrada |
| H (`@lumina/charts`) | `docs/tablero/etapa-H.md` | cerrada |
| I (catálogo gráficos) | `docs/tablero/etapa-I.md` | en curso/revisión |
| J (IA curricular) | `docs/tablero/etapa-J.md` | J10/J11 pendientes |
| K (motor de interacción) | `docs/tablero/etapa-K.md` | K8b, K9a, K11–K15 pendientes |
| M (matemática) | `docs/tablero/etapa-M.md` | en revisión |
| N (condicionales Storyline) | `docs/tablero/etapa-N.md` | N0–N3 y N5 hechas; N4, N6, N7 y N8 en revisión |
| Q (química) | `docs/tablero/etapa-Q.md` | Q1–Q12 hecho; Q13 en revisión |
| R (ayudas largas tras icono ⓘ) | `docs/tablero/etapa-R.md` | R1–R2 hecho; R3 en revisión; R4–R8 pendientes |

Las etapas cerradas son historial: no se leen salvo que una ficha activa las cite.
