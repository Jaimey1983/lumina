#!/usr/bin/env node
/**
 * Fase 0.4b — falla si los fixtures de notaColombiana (frontend vs backend) no son idénticos.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(
  root,
  'lumina-frontend/src/lib/activity-scoring.fixtures.json',
);
const MIRROR = resolve(
  root,
  'lumina-backend/src/classes/class-results-gradebook.fixtures.json',
);

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const a = sha256(SOURCE);
const b = sha256(MIRROR);
if (a !== b) {
  console.error(
    'activity-scoring fixtures desincronizados.\n' +
      `  fuente:  ${SOURCE}\n` +
      `  espejo:  ${MIRROR}\n` +
      'Ejecuta: node scripts/sync-activity-scoring-fixtures.mjs',
  );
  process.exit(1);
}

console.log('activity-scoring fixtures sincronizados.');
