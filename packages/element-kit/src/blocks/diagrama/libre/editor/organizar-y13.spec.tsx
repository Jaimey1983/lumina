import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { COMANDOS, comando, estadoComando, ORGANIZAR } from "./comandos-registro.js";
import { botonCinta, deshabilitado, escena, forma, irAPestana } from "./util-pruebas.js";

afterEach(cleanup);

const desordenado = (): Escena => {
  let e = escena(forma("r", 300, 400, 120, 70, { texto: "Raíz" }), forma("a", 50, 50, 120, 70), forma("b", 700, 20, 120, 70), forma("c", 120, 500, 120, 70), forma("d", 650, 450, 120, 70));
  e = conectarFormas(e, "r", "a");
  e = conectarFormas(e, "r", "b");
  e = conectarFormas(e, "a", "c");
  return conectarFormas(e, "b", "d");
};
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const pos = (e: Escena): Array<[string, number, number]> => formas(e).map((f) => [f.id, f.transformacion.x, f.transformacion.y]);

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
    elegir: (id: string, esc: Escena, shift = false) => {
      const f = formas(esc).find((x) => x.id === id) as Forma;
      const x = f.transformacion.x + f.transformacion.ancho / 2;
      const y = f.transformacion.y + f.transformacion.alto / 2;
      evento("pointerdown", x, y, shift ? { shiftKey: true } : {});
      evento("pointerup", x, y, shift ? { shiftKey: true } : {});
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    tecla: (init: KeyboardEventInit) => fireEvent.keyDown(lienzo, init),
  };
}

const organizar = (): HTMLButtonElement => {
  irAPestana("Organizar");
  return screen.getByRole("button", { name: "Organizar automáticamente" }) as HTMLButtonElement;
};
const ctx = (seleccion: string[], esc: Escena) => ({ escena: esc, seleccion, herramienta: { tipo: "seleccionar" as const }, puedeDeshacer: false, puedeRehacer: false, zoom: 1, cuadricula: false, imantar: false });

describe("Y13 — los comandos", () => {
  it("hay una disposición principal y siete variantes, todas en el registro", () => {
    expect(ORGANIZAR.map((c) => c.id)).toEqual([
      "organizar-auto",
      "organizar-jerarquico-abajo",
      "organizar-jerarquico-derecha",
      "organizar-jerarquico-arriba",
      "organizar-jerarquico-izquierda",
      "organizar-arbol-derecha",
      "organizar-arbol-abajo",
      "organizar-radial",
    ]);
    for (const c of ORGANIZAR) expect(COMANDOS).toContain(c);
    expect(comando("organizar-auto").orden).toEqual({ tipo: "organizar", modo: "jerarquico", direccion: "abajo" });
    expect(comando("organizar-arbol-derecha").orden).toEqual({ tipo: "organizar", modo: "arbol", direccion: "derecha" });
    expect(comando("organizar-radial").orden).toEqual({ tipo: "organizar", modo: "radial" });
  });

  it("habilitado: 2 o más formas elegidas, o ninguna elegida con 2 o más formas; con una sola elegida, no", () => {
    const e = desordenado();
    for (const c of ORGANIZAR) {
      expect(estadoComando(c, ctx([], e)).habilitado, c.id).toBe(true);
      expect(estadoComando(c, ctx(["a", "b"], e)).habilitado, c.id).toBe(true);
      const uno = estadoComando(c, ctx(["a"], e));
      expect(uno.habilitado, c.id).toBe(false);
      expect(uno.motivo).toMatch(/2 o más formas, o ninguna/);
    }
    const una = escena(forma("a", 0, 0));
    expect(estadoComando(comando("organizar-auto"), ctx([], una))).toMatchObject({ habilitado: false, motivo: "Hacen falta 2 o más formas" });
    expect(estadoComando(comando("organizar-auto"), ctx([], escena())).habilitado).toBe(false);
  });
});

describe("Y13 — organizar desde la cinta", () => {
  it("un clic organiza todo: una entrada de historial, los conectores pegados y la raíz en su sitio", () => {
    const e = desordenado();
    const m = montar(e);
    fireEvent.click(organizar());
    expect(m.cuenta()).toBe(1);
    const r = m.ultima();
    expect(pos(r)).not.toEqual(pos(e));
    const raiz = formas(r).find((f) => f.id === "r") as Forma;
    expect(raiz.transformacion.x).toBeCloseTo(300, 6);
    expect(raiz.transformacion.y).toBeCloseTo(400, 6);
    expect(lineas(r).map((l) => [l.origen?.elementoId, l.destino?.elementoId])).toEqual(lineas(e).map((l) => [l.origen?.elementoId, l.destino?.elementoId]));
    expect(m.anuncio()).toBe("Diagrama organizado de forma jerárquica.");
  });

  it("deshacer lo devuelve todo de una vez", () => {
    const e = desordenado();
    const m = montar(e);
    fireEvent.click(organizar());
    m.tecla({ key: "z", ctrlKey: true });
    expect(pos(m.ultima())).toEqual(pos(e));
  });

  it("organizar otra vez lo ya organizado avisa y no agrega nada al historial", () => {
    const m = montar(desordenado());
    fireEvent.click(organizar());
    fireEvent.click(organizar());
    expect(m.cuenta()).toBe(1);
    expect(m.anuncio()).toBe("Ya estaba organizado así.");
  });

  it("con dos formas elegidas solo se mueven ellas", () => {
    const e = desordenado();
    const m = montar(e);
    m.elegir("a", e);
    m.elegir("c", e, true);
    fireEvent.click(organizar());
    const r = m.ultima();
    for (const id of ["r", "b", "d"]) expect(formas(r).find((f) => f.id === id)?.transformacion, id).toEqual(formas(e).find((f) => f.id === id)?.transformacion);
    // La selección sigue siendo la misma: Copiar sigue habilitado.
    expect(deshabilitado(botonCinta("Copiar"))).toBe(false);
  });

  it("con una sola elegida el botón está deshabilitado y no hace nada", () => {
    const e = desordenado();
    const m = montar(e);
    m.elegir("a", e);
    const b = organizar();
    expect(deshabilitado(b)).toBe(true);
    expect(b.getAttribute("title")).toMatch(/2 o más formas, o ninguna/);
    fireEvent.click(b);
    expect(m.cuenta()).toBe(0);
  });

  it("sin formas que organizar, deshabilitado con su motivo", () => {
    montar(escena(forma("a", 0, 0)));
    expect(deshabilitado(organizar())).toBe(true);
    expect(organizar().getAttribute("title")).toMatch(/Hacen falta 2 o más formas/);
  });

  it("más de 500 formas: se avisa y no se organiza nada", () => {
    const grande = escena(...Array.from({ length: 501 }, (_, i) => forma(`f${i}`, (i % 40) * 20, Math.floor(i / 40) * 20, 10, 10)));
    const m = montar(grande);
    fireEvent.click(organizar());
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toMatch(/demasiadas formas/);
  });

  it("lo bloqueado no se mueve, aunque se organice todo", () => {
    let e = escena(forma("a", 0, 0), forma("b", 400, 300), forma("fija", 700, 100, 100, 60, { bloqueado: true }));
    e = conectarFormas(e, "a", "b");
    const m = montar(e);
    fireEvent.click(organizar());
    expect(formas(m.ultima()).find((f) => f.id === "fija")?.transformacion).toEqual(formas(e).find((f) => f.id === "fija")?.transformacion);
  });
});

describe("Y13 — las variantes del menú", () => {
  it("la flecha del botón abre las siete variantes, cada una con su orden", async () => {
    const e = desordenado();
    const m = montar(e);
    organizar();
    fireEvent.click(screen.getByRole("button", { name: "Más disposiciones" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Jerárquico: de arriba abajo",
      "Jerárquico: de izquierda a derecha",
      "Jerárquico: de abajo arriba",
      "Jerárquico: de derecha a izquierda",
      "Árbol: hacia la derecha",
      "Árbol: hacia abajo",
      "Radial",
    ]);
    fireEvent.click(items[6] as HTMLElement); // Radial
    expect(m.cuenta()).toBe(1);
    expect(m.anuncio()).toBe("Diagrama organizado de forma radial.");
    // El radial es otra cosa que el jerárquico.
    const radial = pos(m.ultima());
    cleanup();
    const m2 = montar(e);
    fireEvent.click(organizar());
    expect(pos(m2.ultima())).not.toEqual(radial);
  }, 120000);

  it("el árbol anuncia «en árbol»", async () => {
    const m = montar(desordenado());
    organizar();
    fireEvent.click(screen.getByRole("button", { name: "Más disposiciones" }));
    const items = await screen.findAllByRole("menuitem");
    fireEvent.click(items[4] as HTMLElement);
    expect(m.anuncio()).toBe("Diagrama organizado de forma en árbol.");
  }, 120000);
});
