import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { puntoDePuerto, resolverParametros, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { escena, forma, linea } from "./util-pruebas.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  vi.spyOn(lienzo, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON: () => ({}) });
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const aPantalla = (x: number, y: number) => ({ clientX: vista().x + x * vista().z, clientY: vista().y + y * vista().z });
  const evento = (tipo: string, p: { clientX: number; clientY: number }, extra: MouseEventInit = {}): void => {
    fireEvent(lienzo, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
  };
  const clic = (x: number, y: number): void => {
    evento("pointerdown", aPantalla(x, y));
    evento("pointerup", aPantalla(x, y));
  };
  return { onCambio, lienzo, vista, aPantalla, evento, clic, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
}
type M = ReturnType<typeof montar>;

/** El centro en pantalla del rombo amarillo de `clave` (el polígono dibuja un rombo: el centro es el promedio de sus vértices). */
function centroDelAsa(clave: string): { clientX: number; clientY: number } | null {
  const poli = document.querySelector(`[data-capa="asas-ajuste"] [data-asa-ajuste="${clave}"]`);
  if (!poli) return null;
  const pts = (poli.getAttribute("points") ?? "").split(" ").map((p) => p.split(",").map(Number) as [number, number]);
  return { clientX: pts.reduce((s, p) => s + p[0], 0) / pts.length, clientY: pts.reduce((s, p) => s + p[1], 0) / pts.length };
}
const asas = (): string[] => [...document.querySelectorAll("[data-capa='asas-ajuste'] [data-asa-ajuste]")].map((x) => x.getAttribute("data-asa-ajuste") ?? "");
const f = (e: Escena, id = "T"): Forma => e.elementos.find((x) => x.id === id) as Forma;
const inclinacion = (e: Escena, id = "T"): number => resolverParametros("trapecio", f(e, id).parametros).inclinacion as number;
const deshacer = (m: M): void => void fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });

/** Arrastra el asa `clave` `dx` píxeles de pantalla en horizontal (saliendo del umbral de arrastre) y suelta si `soltar`. */
function arrastrar(m: M, clave: string, dx: number, extra: MouseEventInit = {}, soltar = true): void {
  const c = centroDelAsa(clave) as { clientX: number; clientY: number };
  m.evento("pointerdown", c, extra);
  m.evento("pointermove", { clientX: c.clientX + dx / 2, clientY: c.clientY }, extra);
  m.evento("pointermove", { clientX: c.clientX + dx, clientY: c.clientY }, extra);
  if (soltar) m.evento("pointerup", { clientX: c.clientX + dx, clientY: c.clientY }, extra);
}

const base = (): Escena =>
  escena(
    forma("T", 100, 100, 160, 100, { forma: "trapecio", parametros: { inclinacion: 0.2 } }),
    forma("R", 400, 100, 160, 100, { forma: "rombo" }),
    forma("B", 100, 350, 160, 100, { forma: "trapecio", bloqueado: true }),
    linea("L", [[700, 150], [255, 150]], { destino: { elementoId: "T", puerto: 1 } }),
  );

describe("Y20 — cuándo se ven las asas", () => {
  it("con una forma con asas elegida aparece el rombo amarillo", () => {
    const m = montar(base());
    expect(asas()).toEqual([]);
    m.clic(180, 150);
    expect(asas()).toEqual(["inclinacion"]);
  });
  it("una flecha tiene dos", () => {
    const m = montar(escena(forma("T", 100, 100, 160, 80, { forma: "flecha-derecha" })));
    m.clic(180, 140);
    expect(asas().sort()).toEqual(["cabeza", "cuerpo"]);
  });
  it("no con una forma sin asas, con un conector ni con varias elegidas", () => {
    const m = montar(base());
    m.clic(480, 150);
    expect(asas()).toEqual([]);
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(asas()).toEqual([]);
  });
  it("se ocultan con otra herramienta y vuelven con Seleccionar", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.keyDown(m.lienzo, { key: "l" });
    expect(asas()).toEqual([]);
    fireEvent.keyDown(m.lienzo, { key: "v" });
    expect(asas()).toEqual(["inclinacion"]);
  });
  it("se ocultan con el pincel y vuelven al soltarlo", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.keyDown(m.lienzo, { key: "c", ctrlKey: true, altKey: true });
    expect(asas()).toEqual([]);
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(asas()).toEqual(["inclinacion"]);
  });
  it("se ocultan al abrir el texto en el sitio", () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.doubleClick(m.lienzo, m.aPantalla(180, 150));
    expect(document.querySelector("textarea")).toBeTruthy();
    expect(asas()).toEqual([]);
  });
  it("se ocultan con el menú contextual abierto", { timeout: 150000 }, async () => {
    const m = montar(base());
    m.clic(180, 150);
    fireEvent.contextMenu(m.lienzo, { ...m.aPantalla(180, 150), button: 2 });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeTruthy(), { timeout: 100000 });
    expect(asas()).toEqual([]);
  });
  it("se ocultan mientras se mueve la forma y vuelven al soltar", () => {
    const m = montar(base());
    m.clic(180, 150);
    m.evento("pointerdown", m.aPantalla(180, 170));
    m.evento("pointermove", m.aPantalla(200, 180));
    m.evento("pointermove", m.aPantalla(220, 190));
    expect(asas()).toEqual([]);
    m.evento("pointerup", m.aPantalla(220, 190));
    expect(asas()).toEqual(["inclinacion"]);
  });
});

describe("Y20 — arrastrar el asa", () => {
  it("cambia el parámetro, en una sola entrada de historial (Deshacer la quita), sin mover ni redimensionar la forma", () => {
    const m = montar(base());
    m.clic(180, 150);
    const caja = { ...f(base()).transformacion };
    const z = m.vista().z;
    arrastrar(m, "inclinacion", 24);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    // 24 px de pantalla = 24 / zoom unidades de escena = esa fracción del ancho (160)
    expect(inclinacion(m.ultima())).toBeCloseTo(0.2 + 24 / z / 160, 2);
    expect(f(m.ultima()).transformacion).toEqual(caja);
    deshacer(m);
    expect(inclinacion(m.ultima())).toBe(0.2);
  });
  it("el asa sigue bajo el cursor: no da un salto al agarrarla", () => {
    const m = montar(base());
    m.clic(180, 150);
    const z = m.vista().z;
    arrastrar(m, "inclinacion", 8); // apenas pasa el umbral
    expect(inclinacion(m.ultima())).toBeCloseTo(0.2 + 8 / z / 160, 2);
  });
  it("acota en los extremos del rango", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 4000);
    expect(inclinacion(m.ultima())).toBe(0.45);
  });
  it("con Mayús se ajusta al paso del catálogo", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 13, { shiftKey: true });
    const v = inclinacion(m.ultima());
    expect(Math.round(v / 0.05) * 0.05).toBeCloseTo(v, 6);
  });
  it("los conectores pegados siguen a la forma", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 30);
    const e = m.ultima();
    const fin = (e.elementos.find((x) => x.id === "L") as Linea).puntos.at(-1);
    const p = puntoDePuerto(f(e), 1);
    expect(fin?.x).toBeCloseTo(p.x, 1);
    expect(fin?.y).toBeCloseTo(p.y, 1);
  });
  it("la etiqueta en vivo dice el parámetro y su valor mientras se arrastra", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 24, {}, false);
    expect(document.body.textContent).toMatch(/Inclinación: 0,\d+/);
    m.evento("pointerup", m.aPantalla(0, 0));
  });
  it("Escape cancela: nada entra al historial y el valor vuelve", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 30, {}, false);
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(document.querySelector('[data-capa="asas-ajuste"]')).toBeTruthy();
  });
  it("soltar donde se empezó no deja entrada de historial", () => {
    const m = montar(base());
    m.clic(180, 150);
    const c = centroDelAsa("inclinacion") as { clientX: number; clientY: number };
    m.evento("pointerdown", c);
    m.evento("pointermove", { clientX: c.clientX + 20, clientY: c.clientY });
    m.evento("pointermove", c);
    m.evento("pointerup", c);
    expect(m.onCambio).not.toHaveBeenCalled();
  });
  it("el cursor es «pointer» sobre el asa y el de siempre fuera de ella", () => {
    const m = montar(base());
    m.clic(180, 150);
    m.evento("pointermove", centroDelAsa("inclinacion") as { clientX: number; clientY: number });
    expect(m.lienzo.style.cursor).toBe("pointer");
    m.evento("pointermove", m.aPantalla(600, 400));
    expect(m.lienzo.style.cursor).toBe("default");
  });
  it("el asa gana sobre mover la forma: la forma no se mueve ni se elige otra cosa", () => {
    const m = montar(base());
    m.clic(180, 150);
    arrastrar(m, "inclinacion", 20);
    expect(f(m.ultima()).transformacion).toMatchObject({ x: 100, y: 100 });
    expect(document.body.textContent).toContain("1 seleccionado");
  });
  it("una forma bloqueada no se ajusta", () => {
    const m = montar(escena(forma("T", 100, 100, 160, 100, { forma: "trapecio", bloqueado: true })));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(asas()).toEqual([]);
  });
});

describe("Y20 — la sección «Forma» del panel", () => {
  const campo = (n: string): HTMLInputElement | null => [...document.querySelectorAll<HTMLInputElement>('input[type="number"]')].find((i) => i.getAttribute("aria-label") === n) ?? null;

  it("un campo por parámetro con la forma elegida; confirmar cambia el valor en una entrada (la misma función que el asa)", () => {
    const m = montar(base());
    m.clic(180, 150);
    const c = campo("Inclinación") as HTMLInputElement;
    expect(c).toBeTruthy();
    expect(c.value).toBe("0.2");
    fireEvent.change(c, { target: { value: "0.4" } });
    fireEvent.blur(c);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(inclinacion(m.ultima())).toBe(0.4);
    deshacer(m);
    expect(inclinacion(m.ultima())).toBe(0.2);
  });
  it("acota al rango del catálogo", () => {
    const m = montar(base());
    m.clic(180, 150);
    const c = campo("Inclinación") as HTMLInputElement;
    fireEvent.change(c, { target: { value: "9" } });
    fireEvent.blur(c);
    expect(inclinacion(m.ultima())).toBe(0.45);
  });
  it("la estrella tiene sus dos parámetros (la única interfaz para ellos)", () => {
    const m = montar(escena(forma("T", 100, 100, 120, 115, { forma: "estrella" })));
    m.clic(160, 160);
    expect(campo("Puntas")).toBeTruthy();
    expect(campo("Profundidad")).toBeTruthy();
    const c = campo("Puntas") as HTMLInputElement;
    fireEvent.change(c, { target: { value: "7" } });
    fireEvent.blur(c);
    expect(f(m.ultima()).parametros?.puntas).toBe(7);
  });
  it("no hay sección con una forma sin parámetros ni con formas de distinto tipo", () => {
    const m = montar(base());
    m.clic(480, 150);
    expect(campo("Inclinación")).toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(campo("Inclinación")).toBeNull();
  });
  it("con varias formas del mismo tipo, «Mixto» si el valor difiere", () => {
    const e = escena(forma("T", 100, 100, 160, 100, { forma: "trapecio", parametros: { inclinacion: 0.2 } }), forma("U", 400, 100, 160, 100, { forma: "trapecio", parametros: { inclinacion: 0.4 } }));
    const m = montar(e);
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    const c = campo("Inclinación") as HTMLInputElement;
    expect(c.value).toBe("");
    expect(c.placeholder).toBe("Mixto");
    fireEvent.change(c, { target: { value: "0.3" } });
    fireEvent.blur(c);
    expect(inclinacion(m.ultima(), "T")).toBe(0.3);
    expect(inclinacion(m.ultima(), "U")).toBe(0.3);
  });
});
