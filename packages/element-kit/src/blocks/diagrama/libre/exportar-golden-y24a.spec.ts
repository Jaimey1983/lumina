// Y24a (Regla 7): la exportación del texto «viejo» (`@lumina/drawing/src/render/__golden__/texto-viejo.json`) sale idéntica,
// carácter por carácter. Los archivos `libre/__golden__/exportar-texto-*.svg` se generaron con el código de `main` ANTES de Y24a
// y no se regeneran (DY31).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { svgDeEscena } from "./exportar.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const entrada: unknown = JSON.parse(readFileSync(join(aqui, "../../../../../drawing/src/render/__golden__/texto-viejo.json"), "utf8"));

describe("exportación del texto viejo idéntica (golden de Y24a)", () => {
  it.each(["claro", "oscuro"] as const)("svgDeEscena en tema %s es el mismo SVG", (tema) => {
    const { svg } = svgDeEscena(entrada, { tema, fondo: true, titulo: "Golden Y24a" });
    expect(svg + "\n").toBe(readFileSync(join(aqui, `__golden__/exportar-texto-${tema}.svg`), "utf8"));
  });
});
