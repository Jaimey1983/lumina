import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, type Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { ELEGIR, comando, estadoComando } from "./comandos-registro.js";
import { botonCinta, escena, forma, irAPestana } from "./util-pruebas.js";

const texto = (id: string, x: number, y: number): Record<string, unknown> => ({ id, tipo: "texto", texto: "Hola", transformacion: { x, y, ancho: 80, alto: 30, rotacion: 0 } });

afterEach(cleanup);

const rojo = { relleno: { tipo: "solido", color: "#FF0000" } };
const azul = { relleno: { tipo: "solido", color: "#0000FF" } };

// Centros: a (60,60)  b (260,60)  c (60,260)  d (460,60)  t (460,260)
const base = (): Escena => escena(forma("a", 0, 0, 120, 120, { estilo: rojo }), forma("b", 200, 0, 120, 120, { estilo: rojo }), forma("c", 0, 200, 120, 120, { estilo: azul }), forma("d", 400, 0, 120, 120, { estilo: rojo, bloqueado: true }), texto("t", 420, 240));

function montar(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra }));
  };
  return {
    lienzo,
    onCambio,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    barra: () => document.body.textContent?.match(/(\d+) seleccionados?/)?.[1] ?? "0",
    clic: (x: number, y: number, extra: Record<string, unknown> = {}) => {
      evento("pointerdown", x, y, extra);
      evento("pointerup", x, y, extra);
    },
    /** Arrastra por la lista de puntos (en coordenadas de escena) y suelta en el último, con las teclas que se pidan. */
    arrastrar: (puntos: Array<[number, number]>, extra: Record<string, unknown> = {}, soltar = true) => {
      const [x0, y0] = puntos[0] as [number, number];
      evento("pointerdown", x0, y0, extra);
      for (const [x, y] of puntos.slice(1)) evento("pointermove", x, y, extra);
      if (soltar) {
        const [x, y] = puntos[puntos.length - 1] as [number, number];
        evento("pointerup", x, y, extra);
      }
    },
    tecla: (init: KeyboardEventInit) => fireEvent.keyDown(lienzo, init),
    lazoVisible: () => document.querySelector("[data-capa=lazo]") !== null,
  };
}

const ctx = (e: Escena, seleccion: string[]) => ({ escena: e, seleccion, herramienta: { tipo: "seleccionar" as const }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false });

describe("Y15 — los comandos", () => {
  it("hay seis variantes en el registro, ninguna con atajo (Ctrl+Mayús+I abre las herramientas del navegador)", () => {
    expect(ELEGIR.map((c) => c.id)).toEqual(["elegir-formas", "elegir-conectores", "elegir-textos", "elegir-iguales", "elegir-invertir", "elegir-rama"]);
    for (const c of ELEGIR) expect(c.atajos, c.id).toBeUndefined();
    expect(comando("elegir-invertir").etiqueta).toBe("Invertir selección");
  });
  it("habilitado según haya algo que elegir", () => {
    const e = base();
    expect(estadoComando(comando("elegir-formas"), ctx(e, [])).habilitado).toBe(true);
    expect(estadoComando(comando("elegir-conectores"), ctx(e, [])).habilitado).toBe(false);
    expect(estadoComando(comando("elegir-textos"), ctx(e, [])).habilitado).toBe(true);
    expect(estadoComando(comando("elegir-iguales"), ctx(e, [])).habilitado).toBe(false);
    expect(estadoComando(comando("elegir-iguales"), ctx(e, ["t"])).habilitado).toBe(false);
    expect(estadoComando(comando("elegir-iguales"), ctx(e, ["a"])).habilitado).toBe(true);
    expect(estadoComando(comando("elegir-rama"), ctx(e, [])).habilitado).toBe(false);
    expect(estadoComando(comando("elegir-rama"), ctx(e, ["a"])).habilitado).toBe(true);
    expect(estadoComando(comando("elegir-invertir"), ctx(escena(), [])).habilitado).toBe(false);
  });
});

describe("Y15 — el desplegable «Seleccionar»", () => {
  it("el botón principal elige todo y la flecha trae las demás", async () => {
    const m = montar(base());
    fireEvent.click(botonCinta("Seleccionar todo"));
    expect(m.barra()).toBe("4"); // a, b, c y t (d está bloqueado)
    irAPestana("Inicio"); // al elegir formas la cinta salta sola a «Formato de forma» (Y18)
    fireEvent.click(screen.getByRole("button", { name: "Más selecciones" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Seleccionar formas", "Seleccionar conectores", "Seleccionar textos", "Seleccionar iguales a la elegida", "Invertir selección", "Seleccionar rama de la elegida"]);
  }, 150000);

  it("Formas elige las formas elegibles y lo anuncia; no toca el historial", async () => {
    const m = montar(base());
    irAPestana("Inicio");
    fireEvent.click(screen.getByRole("button", { name: "Más selecciones" }));
    fireEvent.click((await screen.findAllByRole("menuitem"))[0] as HTMLElement);
    expect(m.barra()).toBe("3");
    expect(m.anuncio()).toBe("3 elementos elegidos.");
    expect(m.onCambio).not.toHaveBeenCalled();
    expect((botonCinta("Deshacer") as HTMLElement).getAttribute("aria-disabled")).toBe("true");
  }, 150000);

  const elegirVariante = async (indice: number): Promise<void> => {
    irAPestana("Inicio");
    fireEvent.click(screen.getByRole("button", { name: "Más selecciones" }));
    fireEvent.click((await screen.findAllByRole("menuitem"))[indice] as HTMLElement);
  };

  it("Iguales a la elegida: las rojas elegibles (la bloqueada no)", async () => {
    const m = montar(base());
    m.clic(60, 60); // a
    await elegirVariante(3);
    expect(m.barra()).toBe("2"); // a y b; d es roja pero está bloqueada
    expect(m.onCambio).not.toHaveBeenCalled();
  }, 150000);

  it("Invertir: lo elegible que no estaba elegido (invertir dos veces es la identidad: prueba pura en drawing)", async () => {
    const m = montar(base());
    m.clic(60, 60); // a
    await elegirVariante(4);
    expect(m.barra()).toBe("3"); // b, c y t
    expect(m.onCambio).not.toHaveBeenCalled();
  }, 150000);

  it("Rama de la elegida elige la forma, lo que cuelga y sus conectores", async () => {
    const e = conectarFormas(base(), "a", "b");
    const m = montar(e);
    m.clic(60, 60);
    irAPestana("Inicio");
    fireEvent.click(screen.getByRole("button", { name: "Más selecciones" }));
    fireEvent.click((await screen.findAllByRole("menuitem"))[5] as HTMLElement);
    expect(m.barra()).toBe("3"); // a, b y el conector
    expect(m.anuncio()).toBe("3 elementos elegidos.");
  }, 150000);

  it("invertir con todo elegido deja la selección vacía", async () => {
    const m = montar(base());
    fireEvent.click(botonCinta("Seleccionar todo"));
    irAPestana("Inicio"); // al elegir formas la cinta salta sola a «Formato de forma» (Y18)
    fireEvent.click(screen.getByRole("button", { name: "Más selecciones" }));
    fireEvent.click((await screen.findAllByRole("menuitem"))[4] as HTMLElement);
    expect(m.barra()).toBe("0");
  }, 150000);
});

describe("Y15 — el lazo con Alt", () => {
  const triangulo: Array<[number, number]> = [[-20, -20], [330, -20], [330, 140], [-20, 140]];

  it("Alt + arrastrar en un vacío dibuja el polígono y elige lo que tiene el centro dentro", () => {
    const m = montar(base());
    m.arrastrar(triangulo, { altKey: true }, false);
    expect(m.lazoVisible()).toBe(true);
    expect(m.barra()).toBe("2");
    m.lienzo.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 0, clientY: 0 }));
  });

  it("al soltar queda elegido, se anuncia «N elementos elegidos», el polígono desaparece y el historial no cambia", () => {
    const m = montar(base());
    m.arrastrar(triangulo, { altKey: true });
    expect(m.barra()).toBe("2");
    expect(m.anuncio()).toBe("2 elementos elegidos.");
    expect(m.lazoVisible()).toBe(false);
    expect(m.onCambio).not.toHaveBeenCalled();
    expect((botonCinta("Deshacer") as HTMLElement).getAttribute("aria-disabled")).toBe("true");
  });

  it("no elige bloqueados (d) aunque su centro quede dentro", () => {
    const m = montar(base());
    m.arrastrar([[380, -20], [540, -20], [540, 140], [380, 140]], { altKey: true });
    expect(m.barra()).toBe("0");
    expect(m.anuncio()).toBe("El lazo no abarca nada.");
  });

  it("con Mayús suma a lo elegido; sin Mayús reemplaza", () => {
    const m = montar(base());
    m.clic(60, 260); // c
    m.arrastrar([[180, -20], [330, -20], [330, 140], [180, 140]], { altKey: true, shiftKey: true });
    expect(m.barra()).toBe("2"); // c + b
    m.arrastrar([[-20, -20], [140, -20], [140, 140], [-20, 140]], { altKey: true });
    expect(m.barra()).toBe("1"); // solo a
  });

  it("un lazo de menos de 3 puntos se ignora: la selección sigue igual", () => {
    const m = montar(base());
    m.clic(60, 60);
    m.arrastrar([[600, 500], [640, 540]], { altKey: true });
    expect(m.barra()).toBe("1");
    expect(m.anuncio()).toBe("El lazo es muy corto: no se cambió la selección.");
  });

  it("Escape lo cancela: no queda polígono y la selección es la de antes", () => {
    const m = montar(base());
    m.clic(260, 60); // b
    m.arrastrar(triangulo, { altKey: true }, false);
    expect(m.barra()).toBe("2");
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(m.lazoVisible()).toBe(false);
    expect(m.barra()).toBe("1");
    expect(m.anuncio()).toBe("Lazo cancelado.");
    // Soltar después no hace nada más.
    fireEvent(m.lienzo, new MouseEvent("pointerup", { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    expect(m.barra()).toBe("1");
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("Alt al arrastrar una FORMA sigue siendo conectar (Y7), no un lazo", () => {
    const m = montar(escena(forma("a", 0, 0, 120, 120), forma("b", 300, 0, 120, 120)));
    m.arrastrar([[60, 60], [200, 60], [360, 60]], { altKey: true });
    expect(m.lazoVisible()).toBe(false);
    expect(m.onCambio).toHaveBeenCalledTimes(1); // el movimiento y el conector: una entrada
  });

  it("sin Alt, el arrastre en un vacío sigue siendo el recuadro de siempre", () => {
    const m = montar(base());
    m.arrastrar([[-20, -20], [140, 140]]);
    expect(m.barra()).toBe("1");
    expect(m.lazoVisible()).toBe(false);
  });
});
