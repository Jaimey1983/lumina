// K2 — post-build (mismo patrón que @lumina/scoring, E6.1): marca `dist/cjs/`
// como CommonJS (el paquete es `"type": "module"`, así que Node leería los `.js`
// de ahí como ESM sin esto) y comprueba que `require` e `import` exponen la
// misma superficie y se comportan igual. El chequeo ESM importa `dist/index.js`
// (el build real), no el paquete por nombre.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cjsDir = resolve(pkgRoot, 'dist/cjs');

mkdirSync(cjsDir, { recursive: true });
writeFileSync(resolve(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');

const require = createRequire(import.meta.url);
const cjs = require('@lumina/interactions');
const esm = await import(pathToFileURL(resolve(pkgRoot, 'dist/index.js')));

const CLAVES = [
  'procesarEvento',
  'evaluarCondicion',
  'crearEstadoInicial',
  'validarReglas',
  'recolectarReglas',
  'LIMITES_POR_DEFECTO',
];
for (const k of CLAVES) {
  if (typeof cjs[k] === 'undefined') throw new Error(`K2: la salida CJS no exporta ${k}`);
  if (typeof esm[k] === 'undefined') throw new Error(`K2: la salida ESM no exporta ${k}`);
}

// Mismo comportamiento en ambas salidas: «clic en el botón → sumar 1 a intentos».
const variables = [{ id: 'v', nombre: 'intentos', tipo: 'numero', valorInicial: 0 }];
const reglas = [
  {
    origen: { tipo: 'bloque', bloqueId: 'b', slideId: 's' },
    regla: {
      id: 'r',
      evento: 'clic',
      activa: true,
      condiciones: [],
      acciones: [{ tipo: 'sumar_variable', variableId: 'v', cantidad: 1 }],
    },
  },
];
for (const [nombre, mod] of [['CJS', cjs], ['ESM', esm]]) {
  const r = mod.procesarEvento(
    reglas,
    mod.crearEstadoInicial(variables),
    { tipo: 'clic', bloqueId: 'b', slideId: 's' },
    { variables },
  );
  if (r.estado.variables.v !== 1) {
    throw new Error(`K2: procesarEvento (${nombre}) no aplica la regla como se espera`);
  }
}

console.log('K2 dual package OK — require() e import() resuelven @lumina/interactions con la misma superficie');
