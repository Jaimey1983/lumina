# Prompt Maestro v3 — Curación de contenido curricular (DBA + EBC)

> Reemplaza al "Prompt Maestro v2" (referenciado como texto suelto dentro de
> algunos placeholders del dataset — no era un documento versionado ni
> reflejaba el esquema actual). Este documento es el único válido a partir
> de 2026-09-23. Corresponde a **J10** en `AGENTS.md` (raíz del repo):
> completar el contenido curricular real de `@lumina/curriculum-data`.

## Para quién es esto

Este prompt se le entrega **completo, tal cual**, a un agente de IA con
acceso de escritura al repositorio (Claude Code, Cursor, Antigravity, u otra
sesión) — junto con **los 2 PDFs oficiales del MEN** de una sola área:

1. **Derechos Básicos de Aprendizaje (DBA)** de esa área — contenido por
   grado individual.
2. **Estándares Básicos de Competencias (EBC)** de esa área — contenido
   agrupado por **ciclo de grados** (no por grado individual, ver abajo).

**Antes de pedirle los PDFs al usuario, revisá
`packages/curriculum-data/src/info/`** — ahí vive (o puede ya vivir) el
repositorio local de PDFs oficiales que el usuario fue subiendo al repo,
uno por área/documento. Si el PDF del área que vas a curar ya está ahí, usá
ese archivo directo (no hace falta que te lo vuelvan a subir por chat). Si
el área no tiene todavía su DBA o su EBC en esa carpeta, pedíselos al
usuario — dos caminos posibles, según el entorno en el que corras: que te
los suba directo en la conversación (si tu sesión soporta adjuntar
archivos), o que los agregue a `packages/curriculum-data/src/info/` y
pushee esa carpeta antes de que arranques.

Una ejecución de este prompt cura **un área completa** (los grados que el
operador tenga tiempo de cubrir en esa sesión, idealmente todos los que el
documento DBA aportado cubra). Se puede repetir para cada una de las 5
áreas del dataset (`ciencias-naturales`, `ciencias-sociales`, `lenguaje`,
`matematicas`, `ingles`).

## Estado del dataset al escribir esto (2026-09-23) — verificar antes de arrancar

De los 55 archivos (`area-grado.json`, 5 áreas × 11 grados) en
`packages/curriculum-data/src/data/`, **8 ya están curados** con contenido
real, transcripción literal de los documentos oficiales:

- `ciencias-naturales-1.json` … `ciencias-naturales-7.json` (7 grados)
- `lenguaje-6.json`

El resto (47 archivos) es **placeholder** — no sirven de referencia de
contenido (sí de formato general, con matices, ver más abajo). Antes de
curar un área/grado, comprobá si ya está hecho:

```bash
node -e "const d=require('./packages/curriculum-data/src/data/<area>-<grado>.json'); console.log(d.version, d.unidades.length, d.unidades[0]?.unidad_titulo)"
```

Un archivo **curado** tiene `version: "1.0"` y ≥1 unidad cuyo
`unidad_titulo` **no** empieza con "Placeholder". Un archivo **sin curar**
tiene, según el placeholder que le tocó históricamente, `unidades: []`
(array vacío) **o** una única unidad con `unidad_titulo: "Placeholder —
reemplazar con JSON real"` y campos viejos que ya no existen en el esquema
actual (`dba_asociados`, `dba_relacionados`, `nivel_cognitivo` —
ignoralos, se reemplaza el archivo completo, no se "arregla" el
placeholder). Cualquiera de las dos formas de placeholder es válida como
punto de partida — el resultado final sigue el esquema de la sección
siguiente, no el del placeholder.

**`EBC_ESTANDARES`** (`packages/curriculum-data/src/ebc-estandares.ts`) —
catálogo separado, por **ciclo** de grados, no por archivo de grado. Hoy
solo tiene curado `ciencias-naturales['6-7']` (3 componentes: `entorno_vivo`,
`entorno_fisico`, `cts`). El resto de ciclos de todas las áreas están sin
curar — es **obligatorio** curar el ciclo correspondiente antes o junto con
el primer grado de ese ciclo que se cure (ver Paso 1).

## Reglas que no se negocian (idénticas a las que rigieron la curación de
## ciencias-naturales 6-7 y lenguaje 6 — no se relajan para ir más rápido)

1. **Transcripción literal, nunca inventada.** `dba_enunciado` y
   `evidencias_aprendizaje` son copia textual (permitido corregir tildes/
   errores tipográficos evidentes del PDF, nada más) del documento DBA
   oficial. `estandar` y `subprocesos` (EBC) son copia textual del documento
   EBC oficial. Si un PDF no cubre un grado/ciclo, ese archivo se deja como
   placeholder — no se rellena con contenido adivinado.
2. **`temas`, `subtemas`, `actividades_sugeridas` sí son de autoría del
   curador** (no existen como tales en los documentos MEN) — pero deben
   derivarse directamente del contenido real de ese DBA (sus
   `evidencias_aprendizaje`), no ser genéricos. Ver ejemplos en
   `ciencias-naturales-6.json`.
3. **`ebc_factor` debe ser EXACTAMENTE uno de los `label` de
   `EBC_COMPONENTES[area]`** (`packages/curriculum-data/src/ebc-icfes-catalog.ts`
   — ver tabla completa más abajo), carácter por carácter, para que
   `resolverEstandarEbc`/`listUnidadesPorComponente` puedan resolverlo por
   texto. **`enfoque_men` se deja igual a `ebc_factor`** (así están los 8
   archivos ya curados — no es un campo distinto, es redundancia ya
   aceptada del esquema, no la resuelvas de forma distinta).
4. **No agregues campos que no estén en el esquema de la sección
   siguiente.** `UnidadCurricular` (`packages/types/src/curriculum.types.ts`)
   ya no tiene `nivel_cognitivo`, `dba_relacionados`, `palabras_clave`,
   `indicadores_desempeno`, ni `ebc_estandar`/`subprocesos_ebc` dentro de la
   unidad (retirados en 2026-09-22, ver Etapa J / J4 en `AGENTS.md`) — si
   alguna sesión anterior de curación los vuelve a meter, es un error, no
   una feature vieja que "hay que mantener".
5. **No dupliques el estándar EBC dentro de cada unidad.** Eso es
   exactamente el bug que se corrigió al crear `EBC_ESTANDARES` — el
   estándar/subprocesos de un componente van **una sola vez por ciclo**
   (Paso 1), nunca copiados dentro de cada unidad de cada grado del ciclo.

## Paso 0 — antes de tocar código, identificá el ciclo EBC del área

Cada área agrupa sus EBC en ciclos de grados distintos (no son todos
1-3/4-5/6-7/8-9/10-11) — mirá `CICLOS_POR_AREA` en
`packages/curriculum-data/src/ebc-estandares.ts` para el área que vas a
curar antes de nombrar ningún ciclo:

| Área | Ciclos |
|---|---|
| `ciencias-naturales` | `1-3`, `4-5`, `6-7`, `8-9`, `10-11` |
| `ciencias-sociales` | `1-3`, `4-5`, `6-7`, `8-9`, `10-11` |
| `matematicas` | `1-3`, `4-5`, `6-7`, `8-9`, `10-11` |
| `lenguaje` | `1` (solo), `2-3`, `4-5`, `6-7`, `8-9`, `10-11` |
| `ingles` | `basico-1` (1-3), `basico-2` (4-5), `basico-3` (6-7), `preintermedio` (8-9), `intermedio` (10-11) — adaptado del Programa Nacional de Bilingüismo, no ciclos MEN literales; ver nota de confianza en `ebc-icfes-catalog.ts` |

Componentes EBC (`ebc_factor` válidos) y competencias ICFES por área —
tabla completa en `packages/curriculum-data/src/ebc-icfes-catalog.ts`
(`EBC_COMPONENTES`, `ICFES_COMPETENCIAS`). Usá el `label` exacto de ahí, no
lo parafrasees.

## Paso 1 — curar el/los ciclo(s) EBC del área (una sola vez por ciclo)

Antes de curar cualquier grado, revisá si el ciclo correspondiente ya
existe en `EBC_ESTANDARES[area][ciclo]`
(`packages/curriculum-data/src/ebc-estandares.ts`). Si ya existe, **no lo
toques** (salvo que estés corrigiendo un error real, documentalo en el
commit). Si no existe, agregalo:

```ts
export const EBC_ESTANDARES: CatalogoEstandares = {
  // ...ciclos/áreas ya curados, sin tocar...
  '<area>': {
    '<ciclo>': {
      '<codigo_componente_1>': {
        estandar: '<transcripción literal del estándar del documento EBC>',
        subprocesos: [
          '<subproceso 1, transcripción literal>',
          '<subproceso 2, transcripción literal>',
          // ...todos los subprocesos que el documento EBC liste para
          // ese componente, en ese ciclo — no resumas, no combines dos
          // en uno.
        ],
      },
      '<codigo_componente_2>': { estandar: '...', subprocesos: [...] },
      // ...un bloque por cada componente EBC del área (ver Paso 0).
    },
  },
};
```

`<codigo_componente>` es el `codigo` (no el `label`) de
`EBC_COMPONENTES[area]` — p. ej. para `ciencias-naturales` son
`entorno_vivo`, `entorno_fisico`, `cts` (ver el bloque `'6-7'` ya curado en
el mismo archivo, como referencia exacta de formato).

Si el área ya tiene otros ciclos curados de una sesión anterior, tu bloque
nuevo se **agrega** al objeto existente de esa área — no reemplaces el
objeto entero.

## Paso 2 — curar cada grado (uno por archivo)

Para cada grado que el documento DBA cubra, reemplazá el contenido de
`packages/curriculum-data/src/data/<area>-<grado>.json` completo (no lo
edites parcialmente) por:

```json
{
  "grado": "<grado, string, ej. \"6\">",
  "asignatura": "<nombre humano del área, ej. \"Ciencias Naturales\">",
  "pais": "Colombia",
  "referente_normativo": "DBA V.1 + EBC <Asignatura> Ciclo <ciclo>°",
  "version": "1.0",
  "unidades": [
    {
      "unidad_id": 0,
      "unidad_titulo": "<título corto y descriptivo, de tu autoría, que resuma el DBA — NO el enunciado completo>",
      "enfoque_men": "<igual a ebc_factor, ver Regla 3>",
      "dba_codigo": "DBA 1",
      "dba_enunciado": "<transcripción literal del DBA del documento oficial>",
      "evidencias_aprendizaje": [
        "<transcripción literal, una por evidencia del documento>"
      ],
      "ebc_factor": "<label exacto de EBC_COMPONENTES[area], ver Paso 0>",
      "temas": ["<2-3 temas derivados del DBA, autoría del curador>"],
      "subtemas": ["<3-4 subtemas más específicos, derivados de las evidencias_aprendizaje>"],
      "actividades_sugeridas": [
        { "descripcion": "<actividad concreta ligada al contenido>", "tipo": "<Clasificar | Ordenar | Emparejar | Relacionar columnas | Verdadero/Falso | Quiz opción múltiple | Respuesta abierta | ...>" }
      ]
    }
    // ...una unidad por cada DBA que el documento liste para este grado,
    // con unidad_id 0, 1, 2... consecutivo.
  ]
}
```

Campo por campo, el contrato exacto es `UnidadCurricular` en
`packages/types/src/curriculum.types.ts` — leelo antes de escribir el
primer archivo, es la fuente de verdad si este documento y el código
llegan a divergir.

`referente_normativo` — seguí la convención ya usada: `"DBA V.1 + EBC
<Asignatura> Ciclo <ciclo>°"` (ciencias-naturales) o `"DBA V.2 + EBC
<Asignatura> <ciclo>°"` (lenguaje) según qué versión de DBA use el
documento que te dieron — mirá el propio PDF, dice la versión en la
portada o pie de página.

`tipo` de `actividades_sugeridas` — no inventes tipos nuevos; usá uno de
los que ya aparecen en los 8 archivos curados (`Clasificar`, `Ordenar`,
`Emparejar`, `Relacionar columnas`, `Verdadero/Falso`, `Quiz opción
múltiple`, `Respuesta abierta`, `Quiz de arrastrar y soltar` — revisá
`ciencias-naturales-3.json`/`-4.json` para más ejemplos si hacen falta
variantes).

## Verificación (obligatoria antes de cerrar, Regla 7 de `AGENTS.md`)

```bash
# el paquete compila y sus propios tests siguen verdes
pnpm --filter @lumina/curriculum-data build
pnpm --filter @lumina/curriculum-data test
pnpm --filter @lumina/curriculum-data lint

# el motor real resuelve el contenido nuevo (no solo "el JSON parsea")
node -e "
const { loadCurriculum, findMatchingUnit, listUnidadesPorComponente, listSubprocesosPorComponente } = require('./packages/curriculum-data/dist/cjs/index.js');
loadCurriculum('<area>', '<grado>').then((d) => {
  console.log('unidades:', d.unidades.length);
  console.log('match por tema real:', !!findMatchingUnit(d, '<un tema real que agregaste>'));
  console.log('por componente:', listUnidadesPorComponente(d, '<un ebc_factor real que usaste>').length);
  console.log('subprocesos del ciclo:', listSubprocesosPorComponente('<area>', '<grado>', '<mismo ebc_factor>').length);
});
"

# consumidores reales (backend + frontend) siguen verdes
cd lumina-backend && npx tsc --noEmit && npx jest --silent && cd ..
cd lumina-frontend && npx tsc --noEmit && npx vitest run --project unit && cd ..
```

Si `listSubprocesosPorComponente` devuelve `0` para un `ebc_factor` que sí
agregaste en las unidades, el `label` no coincide carácter a carácter con
`EBC_COMPONENTES[area]` — es el error más común, revisalo antes de seguir.

## Cierre

No aplica Regla 4 de `AGENTS.md` (nada que borrar — es contenido aditivo,
no migración de código). Commit sugerido, uno por área/tanda:

```
feat(curriculum-data): curar <asignatura> grados <rango> con fuentes oficiales MEN
```

Documentá en el cuerpo del commit: qué grados curaste, qué ciclo(s) EBC
completaste, y los resultados exactos de la verificación de arriba (conteo
de unidades por archivo, tests en verde). Si encontraste un bug en un
ciclo EBC ya curado por otra sesión (como pasó con el subproceso mal
copiado de `entorno_vivo`↔`cts` en ciencias-naturales), corregilo y
decilo explícitamente en el commit — no lo dejes pasar en silencio.
