import { describe, expect, it } from "vitest";
import { normalizarPalabra, sinTildes } from "./palabras.js";

describe("palabras compartidas (U10.3)", () => {
  it("quita las tildes y la diéresis y pasa a mayúsculas", () => {
    expect(sinTildes("canción")).toBe("CANCION");
    expect(sinTildes("pingüino")).toBe("PINGUINO");
    expect(sinTildes("ÁÉÍÓÚ")).toBe("AEIOU");
  });

  it("CONSERVA la Ñ (antes se perdía)", () => {
    expect(sinTildes("niño")).toBe("NIÑO");
    expect(sinTildes("ÑANDÚ")).toBe("ÑANDU");
    expect(normalizarPalabra("  año   nuevo ")).toBe("AÑO NUEVO");
  });

  it("normalizarPalabra deja solo A–Z, Ñ y espacios simples", () => {
    expect(normalizarPalabra("¡Hola, 2 mundos!")).toBe("HOLA MUNDOS");
    expect(normalizarPalabra("")).toBe("");
  });
});
