# Lumina — Convenciones de trabajo (fuente única)

Este archivo es la **única** fuente de verdad para cómo se trabaja en este repositorio mientras dure la migración a la Estructura Única (`@lumina/element-kit`). Lo leen, sin excepción y con el mismo contenido:

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

## Definition of Done por elemento migrado

- [ ] Implementa `ElementDefinition` completo (editor, viewer, propiedades, apariencia, puntuación si aplica).
- [ ] Registrado únicamente vía `ElementRegistry.registrar()`.
- [ ] Prueba de paridad contra el comportamiento viejo.
- [ ] Código/registro viejo borrado o `TODO` con ticket vinculado (Regla 4).
- [ ] CI verde.

## Reparto activo — limpieza de lint (Regla 9)

**Antes de tomar un ítem: marcarlo `[en curso: <herramienta>]` en este mismo archivo y hacer commit de ese cambio primero.** Así ninguna de las tres herramientas pisa el trabajo de otra. Al terminar un ítem: correr `pnpm lint` en el paquete correspondiente, confirmar que el conteo bajó (no subió), y marcarlo `[hecho]`.

Estado de partida: `lumina-backend` 219 problemas (209 errores/10 warnings) — `lumina-frontend` 266 problemas (165 errores/101 warnings). Listas exactas de archivos por cluster: `LINT_CLEANUP_BACKLOG.md`.

| Cluster | Archivo(s) | Asignado | Estado |
|---|---|---|---|
| Cypress `any` (video interactivo) | 6 archivos en `cypress/` | Claude Code | **[hecho]** — 144→0, ver `cypress/support/test-window.ts` |
| Overrides de seguridad silenciados | `lumina-frontend/package.json` → `pnpm-workspace.yaml` | Claude Code | **[hecho]** — lodash/ws/qs/etc. no se estaban aplicando |
| `pptx.service.ts` (xml2js sin tipar) | `lumina-backend/src/pptx/pptx.service.ts` | Claude Code | **[hecho]** — 117→0. Tipos OOXML en el propio archivo + `src/types/pizzip.d.ts` nuevo (sin `@types/pizzip` disponible) |
| Scoring + sesiones autónomas | `lumina-backend/src/classes/activity-scoring.ts` + `lumina-backend/src/autonomous-sessions/*` | Cursor | **[en curso: Cursor]** — 68 casos (41+27). Código sensible de notas: revisar con cuidado extra (Regla 9, pasos 1-3) antes de tipar |
| Cola larga backend | 17 archivos exactos — ver `LINT_CLEANUP_BACKLOG.md` | Antigravity | **[en curso: Antigravity]** — ~34 casos |
| Cola larga frontend (`no-unused-vars` / `no-explicit-any` restante) | 53 archivos exactos — ver `LINT_CLEANUP_BACKLOG.md` | Antigravity | pendiente — ~43 casos |
| `react-hooks/*` del motor del canvas | `canvas-area.tsx`, componentes de Timeline, `slide-renderer.tsx` | **Nadie todavía** | **Deliberadamente en espera** — se corrige en la Etapa 5 (unificación de estado del editor), no antes: tocar el motor del canvas ahora es más riesgo que beneficio |

Cuando los tres clusters "pendiente" estén en `[hecho]` y el de `react-hooks` siga reservado para la Etapa 5, `pnpm lint` pasa a ser bloqueante de verdad en el CI (cerrar la decisión de la Regla 9).
