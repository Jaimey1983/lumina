import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(readFileSync(resolve(root, 'src/data/elements.json'), 'utf8'));
const out = `/** Generado desde elements.json — no editar a mano. */\nimport type { ElementsDataset } from './element-store-types.js';\n\nexport const ELEMENTS_DATASET: ElementsDataset = ${JSON.stringify(json)} as ElementsDataset;\n`;
writeFileSync(resolve(root, 'src/data/elements-data.ts'), out);
