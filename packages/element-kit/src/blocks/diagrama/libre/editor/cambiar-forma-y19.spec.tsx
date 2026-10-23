import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ladoDePuerto, TIPOS_FORMA, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, linea } from "./util-pruebas.js";

const texto = (id: string, x: number, y: number): Record<string, unknown> => ({ id, tipo: "texto", texto: "Hola", transformacion: { x, y, ancho: 80, alto: 30, rotacion: 0 } });

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const aPantalla = (x: number, y: number): { clientX: number; clientY: number } => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const v = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { clientX: Number(v?.[1]) + x * Number(v?.[3]), clientY: Number(v?.[2]) + y * Number(v?.[3]) };
  };
  /** Un clic en el punto (x, y) de la escena. */
  const clic = (x: number, y: number): void => {
    for (const tipo of ["pointerdown", "pointerup"]) fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...aPantalla(x, y) }));
  };
  return { onCambio, lienzo, clic, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}

const f = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const l = (e: Escena, id: string): Linea => e.elementos.find((x) => x.id === id) as Linea;
const todo = (m: ReturnType<typeof montar>): void => void fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
const deshacer = (m: ReturnType<typeof montar>): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
const abrirGaleria = async (): Promise<HTMLElement> => {
  fireEvent.click(document.querySelector("[data-cambiar-forma]") as HTMLElement);
  return waitFor(() => {
    const g = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
    if (!g) throw new Error("la galería no se abrió");
    return g;
  });
};
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
const estado = (): string => document.querySelector("[data-dibujo-estado]")?.textContent ?? document.body.textContent ?? "";

const base = (): Escena =>
  escena(
    forma("A", 100, 100, 160, 100),
    forma("B", 400, 100, 160, 100, { forma: "elipse" }),
    texto("T", 100, 400),
    linea("L1", [[700, 150], [260, 150]], { destino: { elementoId: "A", puerto: 1 } }),
    linea("L2", [[100, 300], [330, 200]], { origen: { elementoId: "B", puerto: 3 }, destino: { elementoId: "B", puerto: 2 } }),
  );

describe("Y19 — el grupo «Forma» de la pestaña", () => {
  it("sale con una forma elegida y no con solo un texto ni solo un conector", () => {
    const m = montar(base());
    expect(document.querySelector("[data-cambiar-forma]")).toBeNull();
    m.clic(150, 150);
    expect(document.querySelector("[data-cambiar-forma]")).toBeTruthy();
  });

  it("no sale con solo un texto elegido", () => {
    const m = montar(base());
    m.clic(130, 415);
    expect(document.querySelector("[data-cambiar-forma]")).toBeNull();
  });
});

describe("Y19 — la galería «Cambiar forma»", () => {
  it("lista las 22 formas agrupadas, con la actual marcada y las que no se pueden, deshabilitadas", { timeout: 150000 }, async () => {
    const m = montar(base());
    todo(m);
    const g = await abrirGaleria();
    expect(g.querySelectorAll("button[data-forma]")).toHaveLength(TIPOS_FORMA.length);
    expect(within(g).getAllByRole("group").map((x) => x.getAttribute("aria-label"))).toEqual(["Formas básicas", "Flechas", "Diagramas"]);
    // A es rectángulo y B, elipse: cada una está marcada solo si TODAS las elegidas la tienen → ninguna
    expect(g.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(0);
    cleanup();
    const m2 = montar(base());
    m2.clic(150, 150);
    const g2 = await abrirGaleria();
    const actual = g2.querySelector('button[data-forma="rectangulo"]') as HTMLElement;
    expect(actual.getAttribute("aria-pressed")).toBe("true");
    expect(actual.getAttribute("aria-disabled")).toBe("true");
    expect(actual.title).toContain("Cambiar a Rectángulo");
    expect((g2.querySelector('button[data-forma="rombo"]') as HTMLElement).getAttribute("aria-disabled")).toBeNull();
  });

  it("elegir «Rombo» cambia todas las formas elegidas y solo ellas, en UNA entrada, con la selección intacta y los conectores por el mismo lado", { timeout: 150000 }, async () => {
    const e0 = escena(
      forma("A", 100, 100, 160, 100),
      forma("B", 400, 100, 160, 100, { forma: "elipse" }),
      texto("T", 100, 400),
      linea("L1", [[700, 150], [260, 150]], { destino: { elementoId: "A", puerto: 1 } }),
      linea("L2", [[100, 300], [330, 200]], { origen: { elementoId: "B", puerto: 3 }, destino: { elementoId: "B", puerto: 2 } }),
    );
    const m = montar(e0);
    todo(m);
    const textoAntes = estado();
    const g = await abrirGaleria();
    fireEvent.click(g.querySelector('button[data-forma="rombo"]') as HTMLElement);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const r = m.ultima();
    expect(f(r, "A").forma).toBe("rombo");
    expect(f(r, "B").forma).toBe("rombo");
    expect(r.elementos.find((x) => x.id === "T")?.tipo).toBe("texto");
    // conectores: mismo lado que antes
    const ladoAntes = (id: string, ext: "origen" | "destino", forma_: string): string => {
      const c = l(e0, id)[ext];
      return ladoDePuerto(f(e0, forma_), c?.puerto ?? 0);
    };
    expect(ladoDePuerto(f(r, "A"), l(r, "L1").destino?.puerto ?? -1)).toBe(ladoAntes("L1", "destino", "A"));
    expect(ladoDePuerto(f(r, "B"), l(r, "L2").origen?.puerto ?? -1)).toBe(ladoAntes("L2", "origen", "B"));
    expect(ladoDePuerto(f(r, "B"), l(r, "L2").destino?.puerto ?? -1)).toBe(ladoAntes("L2", "destino", "B"));
    expect(anuncio()).toBe("Forma cambiada a Rombo.");
    expect(estado()).toContain(textoAntes.match(/\d+ seleccionados?/)?.[0] ?? "seleccionad"); // la selección sigue
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    deshacer(m);
    expect(f(m.ultima(), "A").forma).toBe("rectangulo");
    expect(f(m.ultima(), "B").forma).toBe("elipse");
    expect(l(m.ultima(), "L1").destino?.puerto).toBe(1);
  });

  it("elegir la forma que ya tienen todas no hace nada (ni historial)", { timeout: 150000 }, async () => {
    const m = montar(escena(forma("A", 100, 100, 160, 100)));
    m.clic(150, 150);
    const g = await abrirGaleria();
    fireEvent.click(g.querySelector('button[data-forma="rectangulo"]') as HTMLElement);
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(anuncio()).not.toContain("Forma cambiada"); // no se anuncia un cambio que no hubo
  });

  it("las flechas recorren la galería, Enter elige y Escape cierra sin cambiar", { timeout: 150000 }, async () => {
    const m = montar(escena(forma("A", 100, 100, 160, 100)));
    m.clic(150, 150);
    const g = await abrirGaleria();
    const botones = [...g.querySelectorAll<HTMLButtonElement>("button[data-forma]")];
    botones[0]?.focus();
    fireEvent.keyDown(botones[0] as Element, { key: "ArrowRight" });
    expect(document.activeElement === botones[1]).toBe(true);
    fireEvent.keyDown(botones[1] as Element, { key: "ArrowDown" });
    expect(document.activeElement === botones[5]).toBe(true);
    fireEvent.keyDown(botones[5] as Element, { key: "ArrowLeft" });
    expect(document.activeElement === botones[4]).toBe(true);
    fireEvent.keyDown(botones[4] as Element, { key: "ArrowUp" });
    expect(document.activeElement === botones[0]).toBe(true);
    fireEvent.keyDown(g, { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("Y19 — por el menú contextual y por Ctrl+K", () => {
  it("el menú contextual de una forma trae «Cambiar forma ▸»", { timeout: 150000 }, async () => {
    const m = montar(base());
    m.clic(150, 150);
    fireEvent.contextMenu(m.lienzo, { clientX: 150, clientY: 150, button: 2 });
    await waitFor(() => expect(document.querySelector('[data-submenu="Cambiar forma"]')).toBeTruthy(), { timeout: 100000 });
  });

  it("«cambiar a rombo» en Ctrl+K cambia la forma (una entrada)", () => {
    const m = montar(base());
    m.clic(150, 150);
    fireEvent.keyDown(m.lienzo, { key: "k", ctrlKey: true });
    const dialogo = screen.getByRole("dialog", { name: /buscar comando/i });
    fireEvent.change(within(dialogo).getByRole("combobox"), { target: { value: "cambiar a rombo" } });
    fireEvent.click(within(dialogo).getByRole("option", { name: /Cambiar a Rombo/ }));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(f(m.ultima(), "A").forma).toBe("rombo");
  });
});
