/**
 * Guarda de CSS Modules «puros» (el modo de Next): todo selector de un `.module.css` debe contener
 * al menos una clase o id local. Un `*`, `html`, `button` o `::before` a secas rompe `next build`
 * del frontend aunque tsc, lint y los tests pasen (pasó con Hotspot en T4).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const raiz = dirname(fileURLToPath(import.meta.url));

function archivosCss(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivosCss(ruta);
    return nombre.endsWith(".module.css") ? [ruta] : [];
  });
}

/** Selectores (ya separados por coma) que no tienen ninguna clase/id local. */
export function selectoresImpuros(css: string): string[] {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const impuros: string[] = [];
  // Se recorre bloque a bloque: el prelude de cada `{` es un selector o un at-rule.
  const reglas = limpio.matchAll(/([^{}]+)\{/g);
  const dentroDeKeyframes: number[] = [];
  let profundidad = 0;
  let ultimo = 0;
  for (const m of reglas) {
    // Ajusta la profundidad por los `}` que hubo entre el `{` anterior y este prelude.
    const entre = limpio.slice(ultimo, m.index);
    profundidad -= (entre.match(/\}/g) ?? []).length;
    while (dentroDeKeyframes.length > 0 && profundidad <= dentroDeKeyframes[dentroDeKeyframes.length - 1]) dentroDeKeyframes.pop();
    ultimo = (m.index ?? 0) + m[0].length;
    const prelude = m[1].trim();
    if (prelude.startsWith("@")) {
      if (/^@(-\w+-)?keyframes|^@font-face/.test(prelude)) dentroDeKeyframes.push(profundidad);
    } else if (dentroDeKeyframes.length === 0) {
      for (const sel of prelude.split(",").map((s) => s.trim()).filter(Boolean)) {
        const sinGlobal = sel.replace(/:global\([^)]*\)/g, "");
        if (!/[.#][A-Za-z_-]/.test(sinGlobal)) impuros.push(sel);
      }
    }
    profundidad += 1;
  }
  return impuros;
}

describe("selectoresImpuros (detector)", () => {
  it("acepta clases, también dentro de @media, y :global solo como parte", () => {
    expect(selectoresImpuros(".a { x: 1 } @media (min-width: 1px) { .b .c, .d:hover { x: 1 } } .e :global(.z) { x: 1 }")).toEqual([]);
  });

  it("detecta * y etiquetas sueltas, incluso dentro de @media", () => {
    expect(selectoresImpuros("@media (prefers-reduced-motion: reduce) { *, *::before, .ok { x: 1 } } button { x: 1 }")).toEqual([
      "*",
      "*::before",
      "button",
    ]);
  });

  it("ignora los pasos de @keyframes", () => {
    expect(selectoresImpuros("@keyframes k { from { x: 1 } 50% { x: 2 } to { x: 3 } } .a { x: 1 }")).toEqual([]);
  });
});

describe("CSS Modules puros", () => {
  const archivos = archivosCss(raiz);
  it("hay CSS Modules que revisar", () => {
    expect(archivos.length).toBeGreaterThan(20);
  });
  for (const archivo of archivos) {
    it(relative(raiz, archivo), () => {
      expect(selectoresImpuros(readFileSync(archivo, "utf8"))).toEqual([]);
    });
  }
});
