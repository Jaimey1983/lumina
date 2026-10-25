// Y36 (Regla 7): lo que `analizarEsquema` leía antes de Y36 se lee idéntico. `__golden__/esquema-y36-viejo.json` se generó con el
// código de `main` ANTES de Y36 (sin encabezados, sin numeración que dé nivel) y no se regenera (DY31): cada caso trae la entrada
// y el `Esquema` completo que daba entonces. Los campos nuevos (`sinJerarquia`) se ignoran en la comparación.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analizarEsquema } from "./esquema-a-escena.js";

const aqui = dirname(fileURLToPath(import.meta.url));
interface Caso {
  entrada: string;
  esquema: Record<string, unknown>;
}
const casos: Caso[] = JSON.parse(readFileSync(join(aqui, "__golden__/esquema-y36-viejo.json"), "utf8")) as Caso[];

describe("esquemas de antes de Y36 se leen idénticos (golden)", () => {
  it("el golden trae casos", () => {
    expect(casos.length).toBeGreaterThanOrEqual(25);
  });
  it.each(casos.map((c, i) => [i, JSON.stringify(c.entrada).slice(0, 50), c] as const))("caso %i: %s", (_i, _t, c) => {
    const ahora = { ...analizarEsquema(c.entrada) } as unknown as Record<string, unknown>;
    delete ahora.sinJerarquia;
    expect(ahora).toEqual(c.esquema);
  });
});
