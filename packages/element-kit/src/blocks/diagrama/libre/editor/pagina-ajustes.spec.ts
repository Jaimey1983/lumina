import { describe, expect, it } from "vitest";
import { LIMITES } from "@lumina/drawing";
import { ID_PERSONALIZADO, TAMANOS_DE_PAGINA, tamanoDe, textoFuera } from "./pagina-ajustes.js";

describe("pagina-ajustes (Y25)", () => {
  it("hay cinco tamaños preestablecidos y el primero es el de siempre (16:9, 1280 × 720)", () => {
    expect(TAMANOS_DE_PAGINA.map((t) => t.id)).toEqual(["pantalla-16-9", "pantalla-4-3", "a4-horizontal", "a4-vertical", "cuadrada"]);
    expect(TAMANOS_DE_PAGINA[0]).toMatchObject({ ancho: LIMITES.escenaAncho.porDefecto, alto: LIMITES.escenaAlto.porDefecto });
  });

  it("cada tamaño está dentro de los límites del modelo", () => {
    for (const t of TAMANOS_DE_PAGINA) {
      expect(t.ancho, t.id).toBeGreaterThanOrEqual(LIMITES.escenaAncho.min);
      expect(t.ancho, t.id).toBeLessThanOrEqual(LIMITES.escenaAncho.max);
      expect(t.alto, t.id).toBeGreaterThanOrEqual(LIMITES.escenaAlto.min);
      expect(t.alto, t.id).toBeLessThanOrEqual(LIMITES.escenaAlto.max);
    }
  });

  it("los ids y las medidas no se repiten", () => {
    expect(new Set(TAMANOS_DE_PAGINA.map((t) => t.id)).size).toBe(TAMANOS_DE_PAGINA.length);
    expect(new Set(TAMANOS_DE_PAGINA.map((t) => `${t.ancho}x${t.alto}`)).size).toBe(TAMANOS_DE_PAGINA.length);
  });

  it("A4 vertical y horizontal son la misma hoja girada", () => {
    const h = TAMANOS_DE_PAGINA.find((t) => t.id === "a4-horizontal");
    const v = TAMANOS_DE_PAGINA.find((t) => t.id === "a4-vertical");
    expect([h?.ancho, h?.alto]).toEqual([v?.alto, v?.ancho]);
  });

  it("tamanoDe reconoce el preestablecido exacto", () => {
    for (const t of TAMANOS_DE_PAGINA) expect(tamanoDe({ ancho: t.ancho, alto: t.alto }), t.id).toBe(t.id);
  });

  it("con un píxel de diferencia es «personalizado»", () => {
    expect(tamanoDe({ ancho: 1281, alto: 720 })).toBe(ID_PERSONALIZADO);
    expect(tamanoDe({ ancho: 1280, alto: 719 })).toBe(ID_PERSONALIZADO);
    expect(tamanoDe({ ancho: 720, alto: 1280 })).toBe(ID_PERSONALIZADO); // 16:9 vertical no está en la lista
  });

  it("textoFuera: singular y plural", () => {
    expect(textoFuera(1)).toBe("1 elemento queda fuera o cortado por la página");
    expect(textoFuera(2)).toBe("2 elementos quedan fuera o cortados por la página");
    expect(textoFuera(10)).toContain("10 elementos");
  });
});
