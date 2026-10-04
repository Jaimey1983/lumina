// Q1 — post-build dual package (mismo patrón que @lumina/scoring).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cjsDir = resolve(pkgRoot, 'dist/cjs');

mkdirSync(cjsDir, { recursive: true });
writeFileSync(resolve(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');

const require = createRequire(import.meta.url);
const cjs = require('@lumina/chemistry');
const esm = await import(pathToFileURL(resolve(pkgRoot, 'dist/index.js')));

const CLAVES = [
  'parseFormula',
  'computeMolarMass',
  'balanceEquation',
  'getAllElements',
  'findLimitingReagent',
];
for (const k of CLAVES) {
  if (typeof cjs[k] === 'undefined') throw new Error(`Q1: la salida CJS no exporta ${k}`);
  if (typeof esm[k] === 'undefined') throw new Error(`Q1: la salida ESM no exporta ${k}`);
}

const h2o = cjs.computeMolarMass('H2O');
if (Math.abs(h2o.molarMass - 18.015) > 0.02) {
  throw new Error('Q1: computeMolarMass (CJS) devolvió valor inesperado para H2O');
}

const bal = esm.balanceEquation('H2 + O2 -> H2O');
if (!esm.coefficientsAreEquivalent(bal.coefficients, [2, 1, 2])) {
  throw new Error('Q1: balanceEquation (ESM) no coincide con 2H2+O2->2H2O');
}

console.log('Q1 dual package OK — require() e import() resuelven @lumina/chemistry con la misma superficie');
