// Copia el dataset curricular (src/data/*.json) a dist/data/ y dist/cjs/data/
// — tsc no toca los .json referenciados por import()/require() dinámico.
import { readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "..", "src", "data");
const targets = [
  join(root, "..", "dist", "data"),
  join(root, "..", "dist", "cjs", "data"),
];

for (const distDir of targets) {
  mkdirSync(distDir, { recursive: true });
  let n = 0;
  for (const f of readdirSync(srcDir)) {
    if (f.endsWith(".json")) {
      copyFileSync(join(srcDir, f), join(distDir, f));
      n++;
    }
  }
  console.log(`copy-assets: ${n} archivo(s) .json -> ${distDir}`);
}
