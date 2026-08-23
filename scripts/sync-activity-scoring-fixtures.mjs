#!/usr/bin/env node
/** Copia la fuente de fixtures (frontend) al espejo del backend. */
import { copyFileSync } from 'node:fs';
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

copyFileSync(SOURCE, MIRROR);
console.log('fixtures copiados →', MIRROR);
