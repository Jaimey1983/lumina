// Copia los CSS modules de los widgets co-locados a dist/ (tsc no toca .css). E7.6.3a.
import { readdirSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "..", "src");
const distDir = join(root, "..", "dist");

let n = 0;
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (entry.endsWith(".css")) {
      const dest = join(distDir, relative(srcDir, p));
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(p, dest);
      n++;
    }
  }
}
walk(srcDir);
console.log(`copy-assets: ${n} archivo(s) .css -> dist/`);
