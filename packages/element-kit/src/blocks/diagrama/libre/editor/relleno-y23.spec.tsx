import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma } from "@lumina/drawing";
import { PanelPropiedades } from "./propiedades-panel.js";
import { escena, forma, getForma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const DEGRADADO = { tipo: "degradado", desde: "#000000", hasta: "#FFFFFF", angulo: 45 };
const PATRON = { tipo: "patron", patron: "rayas", color: "#123456", fondo: "#FEF3C7", escala: 20 };
const base = (): Escena =>
  escena(
    forma("S", 0, 0, 100, 60, { estilo: { relleno: { tipo: "solido", color: "#FF0000" } } }),
    forma("D", 200, 0, 100, 60, { estilo: { relleno: DEGRADADO } }),
    forma("D2", 400, 0, 100, 60, { estilo: { relleno: { ...DEGRADADO, paradas: [{ posicion: 0.5, color: "#00FF00" }] } } }),
    forma("R", 600, 0, 100, 60, { estilo: { relleno: { ...DEGRADADO, forma: "radial" } } }),
    forma("P", 0, 200, 100, 60, { estilo: { relleno: PATRON } }),
    forma("P2", 200, 200, 100, 60, { estilo: { relleno: { ...PATRON, fondo: null } } }),
    forma("B", 400, 200, 100, 60, { bloqueado: true, estilo: { relleno: PATRON } }),
    forma("C", 600, 200, 100, 60, { estilo: { relleno: DEGRADADO, sombra: { color: "#00000055", desenfoque: 8, dx: 2, dy: 4 } } }),
    forma("C2", 0, 400, 100, 60, { estilo: { sombra: { color: "#00000055", desenfoque: 8, dx: 2, dy: 4, interior: true } } }),
    linea("L", [[0, 500], [100, 500]]),
  );
const f = (e: Escena, id: string): Forma => getForma(e, id);

function montar(seleccion: string[]) {
  const aplicar = vi.fn<(fn: (e: Escena) => Escena) => void>();
  const vista = vi.fn<(fn: (e: Escena) => Escena) => void>();
  const fin = vi.fn<() => void>();
  const e = base();
  render(<PanelPropiedades escena={e} seleccion={seleccion} onAplicar={aplicar} onVista={vista} onFinVista={fin} onSeleccionar={vi.fn()} />);
  return { aplicar, vista, fin, resultado: (): Escena => (aplicar.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(e) };
}

const botones = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("button")];
const coincide = (nombre: string, n: string | RegExp): boolean => (typeof n === "string" ? nombre === n : n.test(nombre));
const hay = (n: string | RegExp): boolean => botones().some((b) => coincide(b.getAttribute("aria-label") ?? "", n));
const boton = (n: string | RegExp): HTMLElement => {
  const l = botones().filter((b) => coincide(b.getAttribute("aria-label") ?? "", n));
  if (l.length !== 1) throw new Error(`Se esperaba 1 botón «${String(n)}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const campo = (n: string): HTMLInputElement => {
  const l = [...document.querySelectorAll<HTMLInputElement>("input")].filter((i) => i.getAttribute("aria-label") === n);
  if (l.length !== 1) throw new Error(`Se esperaba 1 campo «${n}» y hay ${l.length}`);
  return l[0] as HTMLInputElement;
};
const hayCampo = (n: string): boolean => [...document.querySelectorAll("input")].some((i) => i.getAttribute("aria-label") === n);
const hayDeslizador = (n: string): boolean => [...document.querySelectorAll('[role="slider"]')].some((d) => d.getAttribute("aria-label") === n);
const grupo = (n: string): HTMLElement | null => [...document.querySelectorAll<HTMLElement>('[role="group"]')].find((g) => g.getAttribute("aria-label") === n) ?? null;
/** Un botón dentro de un grupo con nombre: «Sólido» también es un patrón de línea del contorno. */
const enGrupo = (g: string, n: string): HTMLElement => {
  const l = [...(grupo(g)?.querySelectorAll<HTMLElement>("button") ?? [])].filter((b) => b.getAttribute("aria-label") === n);
  if (l.length !== 1) throw new Error(`Se esperaba 1 «${n}» en «${g}» y hay ${l.length}`);
  return l[0] as HTMLElement;
};
const marcado = (n: string | RegExp): boolean => boton(n).getAttribute("aria-pressed") === "true";
const tipoMarcado = (n: string): boolean => enGrupo("Tipo de relleno", n).getAttribute("aria-pressed") === "true";
const confirmar = (n: string, valor: string): void => {
  const c = campo(n);
  fireEvent.change(c, { target: { value: valor } });
  fireEvent.blur(c);
};
const abrirSeccion = (titulo: string): void => {
  const b = botones().find((x) => x.hasAttribute("aria-expanded") && (x.textContent ?? "").startsWith(titulo));
  if (b && b.getAttribute("aria-expanded") !== "true") fireEvent.click(b);
};

describe("tipo de relleno: patrón", () => {
  it("el selector ofrece «Patrón» y convierte conservando el color, en una sola llamada", () => {
    const m = montar(["S"]);
    expect(hay("Patrón")).toBe(true);
    fireEvent.click(boton("Patrón"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "S").estilo.relleno).toEqual({ tipo: "patron", patron: "diagonal", color: "#FF0000", fondo: null, escala: 12 });
  });

  it("el tipo del elegido queda marcado", () => {
    montar(["P"]);
    expect(tipoMarcado("Patrón")).toBe(true);
    expect(tipoMarcado("Sólido")).toBe(false);
  });

  it("un patrón pasa a degradado con el color de las líneas como inicial", () => {
    const m = montar(["P"]);
    fireEvent.click(boton("Degradado"));
    expect(f(m.resultado(), "P").estilo.relleno).toMatchObject({ tipo: "degradado", desde: "#123456" });
  });

  it("con una selección mixta (patrón y sólido) no rompe y avisa que son distintos; ningún tipo queda marcado", () => {
    montar(["P", "S"]);
    expect(document.body.textContent).toContain("Los elegidos tienen rellenos distintos");
    expect(["Ninguno", "Sólido", "Degradado", "Patrón"].some((t) => tipoMarcado(t))).toBe(false);
    expect(grupo("Patrón del relleno")).toBeNull();
  });
});

describe("controles del patrón", () => {
  it("muestra el patrón, el color de las líneas, el fondo y el tamaño del elegido", () => {
    montar(["P"]);
    expect(grupo("Patrón del relleno")).toBeTruthy();
    expect(marcado("Rayas")).toBe(true);
    expect(["Rayas", "Diagonal", "Cuadrícula", "Lunares"].every((p) => hay(p))).toBe(true);
    expect(hay(/^Color de las líneas del patrón: #123456$/)).toBe(true);
    expect(hay(/^Color de fondo del patrón: #FEF3C7$/)).toBe(true);
    expect(campo("Tamaño del patrón").value).toBe("20");
    expect(marcado("Patrón sin fondo")).toBe(false);
  });

  it.each([["Diagonal", "diagonal"], ["Cuadrícula", "cuadricula"], ["Lunares", "puntos"]])("elegir «%s» cambia solo el patrón, en una llamada", (nombre, patron) => {
    const m = montar(["P"]);
    fireEvent.click(boton(nombre));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    const r = f(m.resultado(), "P").estilo.relleno;
    expect(r).toMatchObject({ tipo: "patron", patron, color: "#123456", fondo: "#FEF3C7", escala: 20 });
  });

  it("el color de las líneas se cambia con el selector de color (una llamada)", () => {
    const m = montar(["P"]);
    fireEvent.click(boton(/^Color de las líneas del patrón: /));
    fireEvent.click(boton("#CBD5E1"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "P").estilo.relleno).toMatchObject({ color: "#CBD5E1", fondo: "#FEF3C7" });
  });

  it("«Sin fondo» quita el fondo y, al volver, lo pone blanco", () => {
    const m = montar(["P"]);
    fireEvent.click(boton("Patrón sin fondo"));
    expect(f(m.resultado(), "P").estilo.relleno).toMatchObject({ fondo: null });
    cleanup();
    const m2 = montar(["P2"]);
    expect(marcado("Patrón sin fondo")).toBe(true);
    expect(hay(/^Color de fondo del patrón/)).toBe(false);
    fireEvent.click(boton("Patrón sin fondo"));
    expect(f(m2.resultado(), "P2").estilo.relleno).toMatchObject({ fondo: "#FFFFFF" });
  });

  it("el color de fondo se cambia con el selector de color", () => {
    const m = montar(["P"]);
    fireEvent.click(boton(/^Color de fondo del patrón: /));
    fireEvent.click(boton("#F1F5F9"));
    expect(f(m.resultado(), "P").estilo.relleno).toMatchObject({ fondo: "#F1F5F9", color: "#123456" });
  });

  it("el tamaño se acota a 4–64 y se confirma en una llamada", () => {
    const m = montar(["P"]);
    confirmar("Tamaño del patrón", "30");
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "P").estilo.relleno).toMatchObject({ escala: 30 });
    cleanup();
    const m2 = montar(["P"]);
    confirmar("Tamaño del patrón", "500");
    expect(f(m2.resultado(), "P").estilo.relleno).toMatchObject({ escala: 64 });
    cleanup();
    const m3 = montar(["P"]);
    confirmar("Tamaño del patrón", "1");
    expect(f(m3.resultado(), "P").estilo.relleno).toMatchObject({ escala: 4 });
  });

  it("con dos patrones distintos elegidos, los campos que difieren son «mixtos» y cambiar uno iguala solo ese", () => {
    const m = montar(["P", "P2"]);
    expect(marcado("Patrón sin fondo")).toBe(false);
    expect(boton("Patrón sin fondo").getAttribute("aria-pressed")).toBe("mixed");
    fireEvent.click(boton("Cuadrícula"));
    const e = m.resultado();
    expect(f(e, "P").estilo.relleno).toMatchObject({ patron: "cuadricula", fondo: "#FEF3C7" });
    expect(f(e, "P2").estilo.relleno).toMatchObject({ patron: "cuadricula", fondo: null });
  });

  it("lo bloqueado no cambia y no hay controles", () => {
    montar(["B"]);
    expect(grupo("Patrón del relleno")).toBeNull();
  });
});

describe("degradado: lineal o radial", () => {
  it("el selector «Tipo de degradado» marca el del elegido y el ángulo solo se ve en lineal", () => {
    montar(["D"]);
    expect(marcado("Lineal")).toBe(true);
    expect(marcado("Radial")).toBe(false);
    expect(hayDeslizador("Ángulo del degradado")).toBe(true);
    cleanup();
    montar(["R"]);
    expect(marcado("Radial")).toBe(true);
    expect(hayDeslizador("Ángulo del degradado")).toBe(false);
  });

  it("elegir Radial cambia solo la forma y conserva el ángulo y las paradas, en una llamada", () => {
    const m = montar(["D2"]);
    fireEvent.click(boton("Radial"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "D2").estilo.relleno).toEqual({ ...DEGRADADO, forma: "radial", paradas: [{ posicion: 0.5, color: "#00FF00" }] });
  });

  it("volver a Lineal quita el campo y conserva el ángulo", () => {
    const m = montar(["R"]);
    fireEvent.click(boton("Lineal"));
    const r = f(m.resultado(), "R").estilo.relleno;
    expect(Object.keys(r)).toEqual(["tipo", "desde", "hasta", "angulo"]);
    expect(r).toMatchObject({ angulo: 45 });
  });

  it("con uno lineal y otro radial, el ángulo se ve (hay un lineal) y la forma es mixta", () => {
    montar(["D", "R"]);
    expect(hayDeslizador("Ángulo del degradado")).toBe(true);
    expect(marcado("Lineal")).toBe(false);
    expect(marcado("Radial")).toBe(false);
  });
});

describe("paradas intermedias", () => {
  it("sin paradas: solo el botón «Añadir parada», habilitado", () => {
    montar(["D"]);
    expect(boton("Añadir parada").hasAttribute("disabled")).toBe(false);
    expect(hay(/^Quitar parada/)).toBe(false);
  });

  it("añadir pone una en el medio con el promedio de los extremos, en una llamada", () => {
    const m = montar(["D"]);
    fireEvent.click(boton("Añadir parada"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "D").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.5, color: "#808080" }] });
  });

  it("muestra una fila por parada con su color y su posición en %", () => {
    montar(["D2"]);
    expect(hay(/^Color de la parada 1: #00FF00$/)).toBe(true);
    expect(campo("Posición de la parada 1").value).toBe("50");
    expect(hay("Quitar parada 1")).toBe(true);
  });

  it("cambiar la posición la acota a 5–95 % y es una llamada; el color también", () => {
    const m = montar(["D2"]);
    confirmar("Posición de la parada 1", "70");
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "D2").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.7, color: "#00FF00" }] });
    cleanup();
    const m2 = montar(["D2"]);
    confirmar("Posición de la parada 1", "1");
    expect(f(m2.resultado(), "D2").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.05 }] });
    expect(campo("Posición de la parada 1").value).toBe("5"); // el propio campo acota a 5–95 %
    cleanup();
    montar(["D2"]);
    confirmar("Posición de la parada 1", "500");
    expect(campo("Posición de la parada 1").value).toBe("95");
    cleanup();
    const m3 = montar(["D2"]);
    fireEvent.click(boton(/^Color de la parada 1: /));
    fireEvent.click(boton("#CBD5E1"));
    expect(m3.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m3.resultado(), "D2").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.5, color: "#CBD5E1" }] });
  });

  it("quitar la última parada deja el degradado como el de antes (sin el campo)", () => {
    const m = montar(["D2"]);
    fireEvent.click(boton("Quitar parada 1"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(Object.keys(f(m.resultado(), "D2").estilo.relleno)).toEqual(["tipo", "desde", "hasta", "angulo"]);
  });

  it("con tres paradas el botón se deshabilita y dice por qué", () => {
    const e = escena(forma("T", 0, 0, 100, 60, { estilo: { relleno: { ...DEGRADADO, paradas: [{ posicion: 0.2, color: "#111111" }, { posicion: 0.5, color: "#222222" }, { posicion: 0.8, color: "#333333" }] } } }));
    render(<PanelPropiedades escena={e} seleccion={["T"]} onAplicar={vi.fn()} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
    const b = boton("Añadir parada");
    expect(b.hasAttribute("disabled")).toBe(true);
    expect(b.getAttribute("title")).toBe("Ya hay 3 paradas");
  });

  it("con degradados de paradas distintas avisa y no se editan juntos", () => {
    montar(["D", "D2"]);
    expect(document.body.textContent).toContain("Los elegidos tienen paradas distintas");
    expect(boton("Añadir parada").hasAttribute("disabled")).toBe(true);
    expect(hay(/^Quitar parada/)).toBe(false);
  });

  it("con dos degradados de las mismas paradas se editan juntos", () => {
    const e = escena(
      forma("X", 0, 0, 100, 60, { estilo: { relleno: { ...DEGRADADO, paradas: [{ posicion: 0.5, color: "#00FF00" }] } } }),
      forma("Y", 200, 0, 100, 60, { estilo: { relleno: { ...DEGRADADO, desde: "#111111", paradas: [{ posicion: 0.5, color: "#00FF00" }] } } }),
    );
    const aplicar = vi.fn<(fn: (e: Escena) => Escena) => void>();
    render(<PanelPropiedades escena={e} seleccion={["X", "Y"]} onAplicar={aplicar} onVista={vi.fn()} onFinVista={vi.fn()} onSeleccionar={vi.fn()} />);
    confirmar("Posición de la parada 1", "30");
    const sal = (aplicar.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(e);
    expect(f(sal, "X").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.3 }] });
    expect(f(sal, "Y").estilo.relleno).toMatchObject({ paradas: [{ posicion: 0.3 }], desde: "#111111" });
  });
});

describe("sombra interior", () => {
  it("el interruptor aparece con una sombra activa, marcado según la sombra", () => {
    montar(["C"]);
    abrirSeccion("Sombra");
    expect(marcado("Sombra interior")).toBe(false);
    cleanup();
    montar(["C2"]);
    abrirSeccion("Sombra");
    expect(marcado("Sombra interior")).toBe(true);
  });

  it("activarlo cambia solo «interior», en una llamada, y desactivarlo no deja rastro", () => {
    const m = montar(["C"]);
    abrirSeccion("Sombra");
    fireEvent.click(boton("Sombra interior"));
    expect(m.aplicar).toHaveBeenCalledTimes(1);
    expect(f(m.resultado(), "C").estilo.sombra).toEqual({ color: "#00000055", desenfoque: 8, dx: 2, dy: 4, interior: true });
    cleanup();
    const m2 = montar(["C2"]);
    abrirSeccion("Sombra");
    fireEvent.click(boton("Sombra interior"));
    expect(Object.keys(f(m2.resultado(), "C2").estilo.sombra as object)).toEqual(["color", "desenfoque", "dx", "dy"]);
  });

  it("sin sombra no hay interruptor, y con una mezcla (una interior y otra proyectada) es «mixto»", () => {
    montar(["S"]);
    abrirSeccion("Sombra");
    expect(hay("Sombra interior")).toBe(false);
    cleanup();
    montar(["C", "C2"]);
    abrirSeccion("Sombra");
    expect(boton("Sombra interior").getAttribute("aria-pressed")).toBe("mixed");
  });
});

describe("lo de siempre sigue igual", () => {
  it("un sólido no muestra ningún control de degradado ni de patrón", () => {
    montar(["S"]);
    expect(grupo("Tipo de degradado")).toBeNull();
    expect(grupo("Paradas intermedias")).toBeNull();
    expect(grupo("Patrón del relleno")).toBeNull();
    expect(hayCampo("Tamaño del patrón")).toBe(false);
  });

  it("un degradado de antes muestra su tipo lineal, el ángulo y ninguna parada", () => {
    montar(["D"]);
    expect(marcado("Lineal")).toBe(true);
    expect(hayDeslizador("Ángulo del degradado")).toBe(true);
    expect(hay(/^Color de la parada/)).toBe(false);
  });

  it("una línea no tiene relleno: ningún control nuevo", () => {
    montar(["L"]);
    expect(hay("Patrón")).toBe(false);
    expect(grupo("Tipo de degradado")).toBeNull();
  });
});
