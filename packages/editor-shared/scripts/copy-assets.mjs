// Copia los CSS modules a dist/ (tsc no toca .css). E7.6.3-pre.
import { readdirSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "..", "src");
const distDir = join(root, "..", "dist");

mkdirSync(distDir, { recursive: true });
let n = 0;
for (const f of readdirSync(srcDir)) {
  if (f.endsWith(".css")) {
    copyFileSync(join(srcDir, f), join(distDir, f));
    n++;
  }
}
console.log(`copy-assets: ${n} archivo(s) .css -> dist/`);
