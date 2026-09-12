// E6.1 — post-build: marca `dist/cjs/` como CommonJS (el paquete es
// `"type": "module"`, así que Node leería los `.js` de ahí como ESM sin esto)
// y comprueba que `require` e `import` resuelven `@lumina/scoring` igual.
//
// El chequeo ESM importa `dist/index.js` (el build real), no el paquete por
// nombre (`@lumina/scoring`) — desde H2, `exports.import` apunta a
// `src/index.ts`, que tiene un import interno relativo a `./grade-bands.js`
// (convención NodeNext: el specifier usa `.js`, el archivo fuente es `.ts`).
// Un bundler (Next `transpilePackages`, Vite) resuelve ese `.js` contra el
// `.ts` hermano sin problema — así lo consumen `lumina-frontend` y
// `@lumina/element-kit` — pero el loader nativo de Node (sin bundler, el que
// usa este script) no hace esa resolución y falla con `ERR_MODULE_NOT_FOUND`.
// Contra `dist/index.js` no hay ambigüedad: ahí `./grade-bands.js` es un
// archivo real, emitido por `tsc` junto al resto.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cjsDir = resolve(pkgRoot, 'dist/cjs');

mkdirSync(cjsDir, { recursive: true });
writeFileSync(resolve(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');

const require = createRequire(import.meta.url);
const cjs = require('@lumina/scoring');
const esm = await import(pathToFileURL(resolve(pkgRoot, 'dist/index.js')));

const CLAVES = [
  'evaluateActivityResponse',
  'ACTIVITY_SCORING',
  'notaColombiana',
  'getActivityScoringKind',
  'computeClassGradebookPromedio',
];
for (const k of CLAVES) {
  if (typeof cjs[k] === 'undefined') throw new Error(`E6.1: la salida CJS no exporta ${k}`);
  if (typeof esm[k] === 'undefined') throw new Error(`E6.1: la salida ESM no exporta ${k}`);
}
if (cjs.ACTIVITY_SCORING.quiz_multiple !== esm.ACTIVITY_SCORING.quiz_multiple) {
  throw new Error('E6.1: ACTIVITY_SCORING difiere entre CJS y ESM');
}
if (cjs.evaluateActivityResponse('verdadero_falso', { respuestaCorrecta: true }, true).score !== 5) {
  throw new Error('E6.1: evaluateActivityResponse (CJS) no puntúa como se espera');
}

console.log('E6.1 dual package OK — require() e import() resuelven @lumina/scoring con la misma superficie');
