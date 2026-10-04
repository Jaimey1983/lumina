import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const base of ['dist/data', 'dist/cjs/data']) {
  mkdirSync(resolve(root, base), { recursive: true });
  copyFileSync(
    resolve(root, 'src/data/elements.json'),
    resolve(root, base, 'elements.json'),
  );
}
