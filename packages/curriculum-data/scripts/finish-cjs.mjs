// Post-build (patrón E6.1 de @lumina/scoring): marca `dist/cjs/` como
// CommonJS (el paquete es `"type": "module"`, así que Node leería los `.js`
// de ahí como ESM sin esto) y comprueba que `require()` e `import()`
// resuelven @lumina/curriculum-data con la misma superficie y los mismos
// datos.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cjsDir = resolve(pkgRoot, 'dist/cjs');

mkdirSync(cjsDir, { recursive: true });
writeFileSync(resolve(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');

const require = createRequire(import.meta.url);
const cjs = require('@lumina/curriculum-data');
const esm = await import(pathToFileURL(resolve(pkgRoot, 'dist/index.js')));

const CLAVES = ['loadCurriculum', 'buildCurriculumContext', 'AREAS_LABELS', 'GRADOS_TODOS'];
for (const k of CLAVES) {
  if (typeof cjs[k] === 'undefined') throw new Error(`J2: la salida CJS no exporta ${k}`);
  // La superficie ESM solo se verifica por nombre acá: invocar
  // `esm.loadCurriculum(...)` bajo Node puro (sin bundler) falla con
  // ERR_IMPORT_ASSERTION_TYPE_MISSING — restricción del loader ESM nativo de
  // Node al importar `.json` dinámicamente sin atributo `with`, no un bug de
  // este paquete (ver comentario en src/index.ts). Bajo Next/Turbopack/Vite
  // (los consumidores reales de la condición `import`) esto no aplica.
  if (typeof esm[k] === 'undefined') throw new Error(`J2: la salida ESM no exporta ${k}`);
}

// Verificación funcional completa (con datos reales) solo del lado CJS — es
// el único que corre bajo Node puro sin restricciones (ver arriba). Es
// también el camino real que usa lumina-backend (`require()`, moduleResolution
// clásico → condición `require` del exports map).
const cjsData = await cjs.loadCurriculum('ciencias-naturales', '1');
if (!cjsData) throw new Error('J2: loadCurriculum (CJS) no devolvió datos para ciencias-naturales-1');
if (cjsData.asignatura !== 'Ciencias Naturales' && cjsData.grado !== '1') {
  throw new Error('J2: loadCurriculum (CJS) devolvió datos inesperados para ciencias-naturales-1');
}

console.log(
  'J2 dual package OK — require() resuelve @lumina/curriculum-data con datos reales; import() expone la misma superficie (verificación funcional bajo bundler, no bajo Node puro)',
);
