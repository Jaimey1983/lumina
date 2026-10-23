import { describe, expect, it } from "vitest";
import { escenaASvg, resolverColor, type Escena, type Forma, type Linea, type ModoColor } from "@lumina/drawing";
import { ESTILOS_COMANDOS } from "./comandos-registro.js";
import { ESTILOS_FORMA, aplicarEstiloForma, estiloActivo, estiloPorId } from "./estilos-forma.js";
import { hojasEditables, type Hoja } from "./propiedades.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

/** Los 17 tokens que exporta el render (`render/colores.ts`). */
const TOKENS_EXPORTADOS = ["background", "foreground", "card", "card-foreground", "muted", "muted-foreground", "border", "primary", "primary-foreground", "secondary", "accent", "destructive", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

const texto = (id: string, x: number, y: number): Record<string, unknown> => ({ id, tipo: "texto", texto: "Hola", transformacion: { x, y, ancho: 80, alto: 30, rotacion: 0 } });
const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const destino = (e: Escena, sel: string[]): Hoja[] => hojasEditables(e, sel);
const colores = (e: (typeof ESTILOS_FORMA)[number]): string[] => {
  const { relleno, contorno } = e.parche.estilo;
  return [relleno.tipo === "solido" ? relleno.color : relleno.tipo === "degradado" ? relleno.desde : "", relleno.tipo === "degradado" ? relleno.hasta : "", contorno?.color ?? "", e.parche.estiloTexto.color].filter(Boolean);
};

describe("los 12 estilos", () => {
  it("son doce, con id y nombre únicos", () => {
    expect(ESTILOS_FORMA).toHaveLength(12);
    expect(new Set(ESTILOS_FORMA.map((e) => e.id)).size).toBe(12);
    expect(new Set(ESTILOS_FORMA.map((e) => e.nombre)).size).toBe(12);
    expect(estiloPorId("principal")?.nombre).toBe("Principal");
    expect(estiloPorId("no-existe")).toBeUndefined();
  });

  it("solo usan tokens var(--…) (salvo la sombra) y todos están entre los 17 que exporta el render", () => {
    for (const e of ESTILOS_FORMA) {
      for (const c of colores(e)) {
        const token = /^var\(--([a-z0-9-]+)\)$/.exec(c)?.[1];
        expect(token, `${e.id}: ${c} no es un token`).toBeDefined();
        expect(TOKENS_EXPORTADOS, `${e.id}: --${token} no se exporta`).toContain(token);
      }
    }
  });

  it("el texto se lee sobre el relleno: contraste ≥ 4,5:1 en modo claro y en oscuro (en el degradado, contra los dos extremos)", () => {
    const luminancia = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contraste = (a: string, b: string): number => {
      const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number];
      return (x + 0.05) / (y + 0.05);
    };
    for (const modo of ["claro", "oscuro"] as ModoColor[]) {
      for (const e of ESTILOS_FORMA) {
        const { relleno } = e.parche.estilo;
        const fondos = relleno.tipo === "solido" ? [relleno.color] : relleno.tipo === "degradado" ? [relleno.desde, relleno.hasta] : ["var(--background)"];
        const texto = resolverColor(e.parche.estiloTexto.color, modo).color;
        for (const fondo of fondos) expect(contraste(texto, resolverColor(fondo, modo).color), `${e.id} en modo ${modo} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("aplicarEstiloForma", () => {
  const base = (): Escena =>
    escena(
      forma("a", 100, 100, 160, 100, { estilo: { opacidad: 0.5, radio: 9 }, estiloTexto: { tamano: 30, negrita: true, alineacionH: "izquierda" }, transformacion: { x: 100, y: 100, ancho: 160, alto: 100, rotacion: 33 } }),
      texto("t", 100, 300),
      linea("l", [[0, 500], [200, 500]], { estilo: { contorno: { color: "#111111", grosor: 6, patron: "guiones" } } }),
      forma("b", 400, 100, 100, 60, { bloqueado: true }),
      forma("g1", 600, 100), forma("g2", 800, 100), grupo("g", ["g1", "g2"]),
    );

  it("cambia relleno, contorno, sombra y color del texto, y nada más", () => {
    const e = base();
    const est = estiloPorId("elevado")!;
    const r = aplicarEstiloForma(e, destino(e, ["a"]), est);
    const a = f(r, "a");
    expect(a.estilo.relleno).toEqual(est.parche.estilo.relleno);
    expect(a.estilo.contorno).toEqual(est.parche.estilo.contorno);
    expect(a.estilo.sombra).toEqual(est.parche.estilo.sombra);
    expect(a.estiloTexto.color).toBe("var(--foreground)");
    // lo que no es suyo queda como estaba
    expect(a.transformacion).toEqual(f(e, "a").transformacion);
    expect(a.estilo.opacidad).toBe(0.5);
    expect(a.estilo.radio).toBe(9);
    expect(a.estiloTexto).toMatchObject({ tamano: 30, negrita: true, alineacionH: "izquierda" });
  });

  it("un conector solo cambia el color del contorno (no el grosor ni el patrón)", () => {
    const e = base();
    const r = aplicarEstiloForma(e, destino(e, ["l"]), estiloPorId("alerta")!);
    expect(l(r, "l").estilo.contorno).toEqual({ color: "var(--destructive)", grosor: 6, patron: "guiones" });
  });

  it("un texto libre recibe lo mismo que una forma", () => {
    const e = base();
    const r = aplicarEstiloForma(e, destino(e, ["t"]), estiloPorId("principal")!);
    const t = r.elementos.find((x) => x.id === "t") as Hoja & { estilo: Forma["estilo"] };
    expect(t.estilo.relleno).toEqual({ tipo: "solido", color: "var(--primary)" });
  });

  it("forma, texto y conector a la vez en una sola llamada", () => {
    const e = base();
    const r = aplicarEstiloForma(e, destino(e, ["a", "t", "l"]), estiloPorId("invertido")!);
    expect(f(r, "a").estilo.relleno).toEqual({ tipo: "solido", color: "var(--foreground)" });
    expect(l(r, "l").estilo.contorno.color).toBe("var(--foreground)");
  });

  it("lo bloqueado no se toca y un grupo aporta sus formas", () => {
    const e = base();
    expect(aplicarEstiloForma(e, destino(e, ["b"]), estiloPorId("alerta")!)).toBe(e); // `hojasEditables` ya lo excluye
    const r = aplicarEstiloForma(e, destino(e, ["g"]), estiloPorId("neutro")!);
    expect(f(r, "g1").estilo.relleno).toEqual({ tipo: "solido", color: "var(--muted)" });
    expect(f(r, "g2").estilo.relleno).toEqual({ tipo: "solido", color: "var(--muted)" });
  });

  it("misma escena si todo lo elegido ya tiene el estilo", () => {
    const e = base();
    const uno = aplicarEstiloForma(e, destino(e, ["a"]), estiloPorId("neutro")!);
    expect(aplicarEstiloForma(uno, destino(uno, ["a"]), estiloPorId("neutro")!)).toBe(uno);
    expect(aplicarEstiloForma(e, [], estiloPorId("neutro")!)).toBe(e);
  });

  it("cada estilo, exportado en claro y en oscuro, no deja ningún var( sin resolver", () => {
    for (const est of ESTILOS_FORMA) {
      const e = escena(forma("a", 100, 100, 160, 100, { texto: "Hola" }), linea("l", [[0, 300], [200, 300]]));
      const r = aplicarEstiloForma(e, destino(e, ["a", "l"]), est);
      for (const modo of ["claro", "oscuro"] as const) expect(escenaASvg(r, { modo }).svg, `${est.id} en ${modo}`).not.toContain("var(");
    }
  });

  it("estiloActivo: marcado si todo lo elegido lo tiene; ninguno con una mezcla o sin nada", () => {
    const e = base();
    const nuevo = aplicarEstiloForma(e, destino(e, ["a", "t"]), estiloPorId("neutro")!);
    expect(estiloActivo(destino(nuevo, ["a", "t"]), estiloPorId("neutro")!)).toBe(true);
    expect(estiloActivo(destino(nuevo, ["a", "t"]), estiloPorId("principal")!)).toBe(false);
    expect(estiloActivo(destino(nuevo, ["a", "g1"]), estiloPorId("neutro")!)).toBe(false); // g1 no lo tiene
    expect(estiloActivo([], estiloPorId("neutro")!)).toBe(false);
  });

  it("500 formas: menos de 15 ms", () => {
    const e = escena(...Array.from({ length: 500 }, (_, i) => forma(`f${i}`, (i % 25) * 120, Math.floor(i / 25) * 90, 100, 60)));
    const sel = e.elementos.map((x) => x.id);
    const est = [estiloPorId("principal")!, estiloPorId("alerta")!];
    for (let i = 0; i < 4; i++) aplicarEstiloForma(e, destino(e, sel), est[i % 2]!);
    const t: number[] = [];
    for (let i = 0; i < 9; i++) {
      const t0 = performance.now();
      aplicarEstiloForma(e, destino(e, sel), est[i % 2]!);
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    expect(t[4]).toBeLessThan(15);
  });
});

describe("los comandos «Estilo: …»", () => {
  it("hay uno por estilo, en el grupo «formato», sin atajo y sin menú contextual", () => {
    expect(ESTILOS_COMANDOS).toHaveLength(12);
    ESTILOS_COMANDOS.forEach((c, i) => {
      expect(c.id).toBe(`estilo-${ESTILOS_FORMA[i]!.id}`);
      expect(c.etiqueta).toBe(`Estilo: ${ESTILOS_FORMA[i]!.nombre}`);
      expect(c.grupo).toBe("formato");
      expect(c.atajos).toBeUndefined();
      expect(c.sinMenu).toBe(true);
      expect(c.orden).toEqual({ tipo: "aplicar-estilo", estilo: ESTILOS_FORMA[i]!.id });
    });
  });
});
