// Y23 (Regla 7): la exportación de la escena «vieja» (la de `@lumina/drawing/src/render/__golden__`) sale idéntica,
// carácter por carácter. Los archivos de `libre/__golden__/` se generaron con el código de `main` ANTES de Y23 y no se
// regeneran (DY31): un diff en ellos es motivo de rechazo.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { svgDeEscena } from "./exportar.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const entrada: unknown = JSON.parse(readFileSync(join(aqui, "../../../../../drawing/src/render/__golden__/escena-vieja.json"), "utf8"));

describe("exportación de la escena vieja idéntica (golden de Y23)", () => {
  it.each([
    ["claro", true],
    ["claro", false],
    ["oscuro", true],
    ["oscuro", false],
  ] as const)("svgDeEscena en tema %s %s fondo es el mismo SVG", (tema, fondo) => {
    const { svg } = svgDeEscena(entrada, { tema, fondo, titulo: "Golden Y23", descripcion: "Escena vieja" });
    expect(svg + "\n").toBe(readFileSync(join(aqui, `__golden__/exportar-${tema}-${fondo ? "con" : "sin"}-fondo.svg`), "utf8"));
  });
});
