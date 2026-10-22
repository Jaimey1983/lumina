import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { conectarFormas } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { buscarComandos } from "./buscar-comandos.js";
import { COMANDOS, comando, estadoComando } from "./comandos-registro.js";
import { SELECCIONAR } from "./herramientas.js";
import { botonCinta, deshabilitado, escena, forma, getLinea, ids, irAPestana, linea } from "./util-pruebas.js";

afterEach(cleanup);

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
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...extra });
    fireEvent(lienzo, ev);
  };
  return {
    lienzo,
    onCambio,
    elegir: (id: string, esc: Escena, shift = false) => {
      const f = esc.elementos.find((x) => x.id === id && x.tipo === "forma") as Forma;
      const cx = f.transformacion.x + f.transformacion.ancho / 2;
      const cy = f.transformacion.y + f.transformacion.alto / 2;
      evento("pointerdown", cx, cy, shift ? { shiftKey: true } : {});
      evento("pointerup", cx, cy, shift ? { shiftKey: true } : {});
    },
    elegirLinea: (x: number, y: number) => {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    historial: () => onCambio.mock.calls.length,
  };
}

const trio = (): Escena => {
  const e0 = escena(forma("A", 0, 0), forma("B", 200, 0), forma("C", 400, 0));
  return conectarFormas(conectarFormas(e0, "A", "B"), "B", "C");
};

const aviso = (): HTMLElement | null => document.querySelector("[data-extremo-libre-aviso]");

describe("Y10 conectores sin huérfanos", () => {
  it("duplicar un trío conectado conserva la topología entre las copias", () => {
    const e0 = trio();
    const m = montar(e0);
    m.elegir("A", e0);
    m.elegir("B", e0, true);
    m.elegir("C", e0, true);
    fireEvent.keyDown(m.lienzo, { key: "d", ctrlKey: true });
    expect(m.historial()).toBe(1);
    const e1 = m.ultima();
    expect(ids(e1)).toEqual(expect.arrayContaining(["A-copia", "B-copia", "C-copia"]));
    const copias = e1.elementos.filter((x): x is Linea => x.tipo === "linea" && x.id.endsWith("-copia"));
    expect(copias).toHaveLength(2);
    expect(copias.some((l) => l.origen?.elementoId === "A-copia" && l.destino?.elementoId === "B-copia")).toBe(true);
    expect(copias.some((l) => l.origen?.elementoId === "B-copia" && l.destino?.elementoId === "C-copia")).toBe(true);
    expect(copias.some((l) => l.origen?.elementoId === "A" || l.destino?.elementoId === "A")).toBe(false);
  });

  it("al duplicar solo A y B no se copia el conector B→C", () => {
    const e0 = trio();
    const m = montar(e0);
    m.elegir("A", e0);
    m.elegir("B", e0, true);
    fireEvent.keyDown(m.lienzo, { key: "d", ctrlKey: true });
    const e1 = m.ultima();
    const copias = e1.elementos.filter((x): x is Linea => x.tipo === "linea" && x.id.endsWith("-copia"));
    expect(copias).toHaveLength(1);
    expect(copias[0]).toMatchObject({ origen: { elementoId: "A-copia" }, destino: { elementoId: "B-copia" } });
    expect(e1.elementos.some((x) => x.tipo === "linea" && x.origen?.elementoId === "B-copia" && x.destino?.elementoId === "C-copia")).toBe(false);
  });

  it("eliminar una forma deja el conector con el extremo libre y avisado, naranja", () => {
    const e0 = conectarFormas(escena(forma("A", 100, 100), forma("B", 400, 260)), "A", "B");
    const m = montar(e0);
    m.elegir("B", e0);
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    expect(m.historial()).toBe(1);
    const e1 = m.ultima();
    const l = e1.elementos.find((x): x is Linea => x.tipo === "linea")!;
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.destino).toBeUndefined();
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toMatch(/1 seleccionado/);
    expect(document.querySelector("[data-extremo-libre]")).toBeTruthy();
    expect(document.querySelector('[data-asa-conector="destino"]')?.getAttribute("fill")).toBe("#ea580c");
    expect(document.querySelector('[data-asa-conector="origen"]')?.getAttribute("fill")).toBe("#16a34a");
    irAPestana("Formato de conector");
    expect(aviso()?.textContent).toBe("Extremo libre");
  });

  it("el aviso «Extremo libre» no aparece si los dos extremos están pegados", () => {
    const e0 = conectarFormas(escena(forma("A", 100, 100), forma("B", 400, 260)), "A", "B");
    const m = montar(e0);
    m.elegirLinea(300, 250);
    expect(screen.getByRole("tab", { name: "Formato de conector" })).toBeTruthy();
    expect(document.querySelectorAll("[data-extremo-libre]")).toHaveLength(0);
    irAPestana("Formato de conector");
    expect(aviso()).toBeNull();
    expect(deshabilitado(screen.getByRole("button", { name: "Pegar al más cercano" }))).toBe(true);
  });

  it("Pegar al más cercano pega al puerto correcto, ignora bloqueadas y se deshace en un paso", () => {
    const e0 = escena(
      forma("A", 100, 100),
      forma("B", 400, 100, 100, 60, { bloqueado: true }),
      forma("C", 700, 100),
      linea("L", [[200, 130], [350, 130]], { origen: { elementoId: "A", puerto: 1 } }),
    );
    const m = montar(e0);
    m.elegirLinea(275, 130);
    irAPestana("Formato de conector");
    expect(aviso()?.textContent).toBe("Extremo libre");
    const boton = screen.getByRole("button", { name: "Pegar al más cercano" });
    expect(deshabilitado(boton)).toBe(false);
    fireEvent.click(boton);
    expect(m.historial()).toBe(1);
    expect(getLinea(m.ultima(), "L").destino).toEqual({ elementoId: "C", puerto: 3 });
    expect(getLinea(m.ultima(), "L").destino?.elementoId).not.toBe("B");
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(getLinea(m.ultima(), "L").destino).toBeUndefined();
    fireEvent.keyDown(m.lienzo, { key: "y", ctrlKey: true });
    expect(getLinea(m.ultima(), "L").destino).toEqual({ elementoId: "C", puerto: 3 });
  });

  it("el comando aparece en el buscador y su habilitado sigue al extremo libre", () => {
    expect(buscarComandos("extremo libre", COMANDOS).some((r) => r.comando.id === "pegar-al-mas-cercano")).toBe(true);
    expect(buscarComandos("pegar", COMANDOS).some((r) => r.comando.id === "pegar-al-mas-cercano")).toBe(true);
    const e0 = escena(forma("A", 100, 100), forma("C", 700, 100), linea("L", [[200, 130], [350, 130]], { origen: { elementoId: "A", puerto: 1 } }));
    const m = montar(e0);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: "Buscar comando" });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "pegar al mas cercano" } });
    const opcion = within(dialogo).getByRole("option", { name: /Pegar al más cercano/ });
    expect(opcion.getAttribute("aria-disabled")).toBe("true");
    fireEvent.keyDown(within(dialogo).getByRole("combobox"), { key: "Escape" });
    m.elegirLinea(275, 130);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const abierto = screen.getByRole("dialog", { name: "Buscar comando" });
    fireEvent.change(within(abierto).getByRole("combobox"), { target: { value: "pegar al mas cercano" } });
    const activa = within(abierto).getByRole("option", { name: /Pegar al más cercano/ });
    expect(activa.getAttribute("aria-disabled")).not.toBe("true");
    fireEvent.keyDown(within(abierto).getByRole("combobox"), { key: "Enter" });
    expect(m.historial()).toBe(1);
    expect(getLinea(m.ultima(), "L").destino).toEqual({ elementoId: "C", puerto: 3 });
    const ctx = (seleccion: string[], esc: Escena) => ({
      escena: esc,
      seleccion,
      herramienta: SELECCIONAR,
      puedeDeshacer: false,
      puedeRehacer: false,
      zoom: 1,
      cuadricula: false,
      imantar: false,
    });
    expect(estadoComando(comando("pegar-al-mas-cercano"), ctx(["L"], e0)).habilitado).toBe(true);
    expect(estadoComando(comando("pegar-al-mas-cercano"), ctx(["A"], e0)).habilitado).toBe(false);
  });

  it("la pestaña contextual muestra el aviso solo con extremo libre", () => {
    const e0 = escena(forma("A", 100, 100), linea("L", [[200, 130], [350, 130]], { origen: { elementoId: "A", puerto: 1 } }));
    const m = montar(e0);
    expect(screen.queryByRole("tab", { name: "Formato de conector" })).toBeNull();
    m.elegirLinea(275, 130);
    irAPestana("Formato de conector");
    expect(aviso()?.textContent).toBe("Extremo libre");
    expect(screen.getByRole("button", { name: "Pegar al más cercano" })).toBeTruthy();
  });
});
