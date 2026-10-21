import { describe, expect, it } from "vitest";
import { DISTANCIA_ASA_HIJO_PX, formaConAsasHijo, posicionesAsasHijo, asaHijoEn } from "./hijo-rapido.js";
import { SELECCIONAR } from "./herramientas.js";
import { escena, forma } from "./util-pruebas.js";

describe("hijo-rapido (puro)", () => {
  it("posiciones a 44 px de pantalla del borde, con zoom", () => {
    const e = escena(forma("P", 100, 100, 100, 60));
    const z1 = posicionesAsasHijo(e, "P", 1);
    const z2 = posicionesAsasHijo(e, "P", 2);
    expect(z1?.find((p) => p.lado === "derecha")?.centro.x).toBeCloseTo(100 + 100 + DISTANCIA_ASA_HIJO_PX, 5);
    expect(z2?.find((p) => p.lado === "derecha")?.centro.x).toBeCloseTo(100 + 100 + DISTANCIA_ASA_HIJO_PX / 2, 5);
  });

  it("formaConAsasHijo exige seleccionar y una sola forma", () => {
    const e = escena(forma("P", 0, 0));
    const ctx = { escena: e, herramienta: SELECCIONAR, seleccion: [], gestoEnCurso: false, edicionAbierta: false };
    expect(formaConAsasHijo(ctx)).toBeNull();
    expect(formaConAsasHijo({ ...ctx, seleccion: ["P"] })).toBe("P");
    expect(formaConAsasHijo({ ...ctx, seleccion: ["P", "Q"] })).toBeNull();
  });

  it("asaHijoEn detecta el lado bajo el puntero", () => {
    const e = escena(forma("P", 100, 100, 100, 60));
    const abajo = posicionesAsasHijo(e, "P", 1)!.find((p) => p.lado === "abajo")!.centro;
    expect(asaHijoEn(e, "P", abajo, 1, false)).toBe("abajo");
  });
});
