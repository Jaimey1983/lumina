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
  'normalizeFormula',
  'molarMass',
  'percentComposition',
  'parseEquation',
  'balanceEquation',
  'coefficientsEquivalent',
  'lookupElement',
  'massToMoles',
  'molesToMass',
  'moleRatio',
  'nameToFormula',
  'formulaFromName',
];
for (const k of CLAVES) {
  if (typeof cjs[k] === 'undefined') throw new Error(`chemistry CJS missing ${k}`);
  if (typeof esm[k] === 'undefined') throw new Error(`chemistry ESM missing ${k}`);
}

const bal = cjs.balanceEquation('H2 + O2 -> H2O');
if (!bal || !cjs.coefficientsEquivalent([2, 1, 2], bal.coefficients)) {
  throw new Error('chemistry smoke test failed');
}

console.log('@lumina/chemistry dual package OK');
