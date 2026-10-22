import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarEscena, puntoDePuerto, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma, irAPestana, linea } from "./util-pruebas.js";

afterEach(() => cleanup());

interface Montado {
  onCambio: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  lienzo: SVGSVGElement;
  aPantalla: (x: number, y: number) => { clientX: number; clientY: number };
  ultima: () => Escena;
}

function montar(e: Escena): Montado {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={() => undefined} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  return {
    onCambio,
    lienzo,
    aPantalla: (x, y) => {
      const v = vista();
      return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}

type P = { clientX: number; clientY: number };
const puntero = (el: Element, tipo: "pointerdown" | "pointermove" | "pointerup", p: P, extra: MouseEventInit = {}): void => {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
};
const clic = (m: Montado, x: number, y: number, extra: MouseEventInit = {}): void => {
  puntero(m.lienzo, "pointerdown", m.aPantalla(x, y), extra);
  puntero(m.lienzo, "pointerup", m.aPantalla(x, y), extra);
};
function arrastrar(m: Montado, desde: [number, number], hasta: [number, number], pasos = 8, extra: MouseEventInit = {}): void {
  puntero(m.lienzo, "pointerdown", m.aPantalla(...desde), extra);
  for (let i = 1; i <= pasos; i++) {
    puntero(m.lienzo, "pointermove", m.aPantalla(desde[0] + ((hasta[0] - desde[0]) * i) / pasos, desde[1] + ((hasta[1] - desde[1]) * i) / pasos), extra);
  }
  puntero(m.lienzo, "pointerup", m.aPantalla(...hasta), extra);
}
const herramienta = (nombre: string): HTMLElement => botonCinta(nombre);
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const linea0 = (e: Escena): Linea => lineas(e)[0] as Linea;
const asasDelConector = (): string[] => [...document.querySelectorAll("[data-asa-conector]")].map((n) => n.getAttribute("data-asa-conector") ?? "");

// Rectángulos de 100×60. Puertos: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
//  A (100,100): derecha (200,130)   arriba (150,100)   abajo (150,160)
//  B (400,260): izquierda (400,290)  arriba (450,260)
//  C (700,100): izquierda (700,130)
const dos = (): Escena => escena(forma("A", 100, 100), forma("B", 400, 260), forma("C", 700, 100));
const conectada = (extra: Record<string, unknown> = {}): Escena =>
  escena(
    forma("A", 100, 100),
    forma("B", 400, 260),
    forma("C", 700, 100),
    linea("L", [[200, 130], [400, 290]], { fin: "flecha", trazado: "ortogonal", origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 }, ...extra }),
  );

describe("dibujar una línea que se pega a las formas", () => {
  it("arrastrar la flecha de un puerto a otro la pega por los dos extremos (una sola entrada)", () => {
    const m = montar(dos());
    fireEvent.click(herramienta("Flecha"));
    arrastrar(m, [203, 128], [398, 292]); // casi en el puerto de la derecha de A → casi en el de la izquierda de B
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
    expect(l.puntos).toEqual([{ x: 200, y: 130 }, { x: 400, y: 290 }]);
  });

  it("solo un extremo en un puerto: ese extremo queda pegado y el otro libre", () => {
    const m = montar(dos());
    fireEvent.click(herramienta("Línea"));
    arrastrar(m, [203, 128], [600, 450]);
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.destino).toBeUndefined();
    expect(l.puntos[1]).toEqual({ x: 600, y: 450 });
  });

  it("lejos de los puertos la línea queda suelta, como antes", () => {
    const m = montar(dos());
    fireEvent.click(herramienta("Línea"));
    arrastrar(m, [60, 400], [300, 450]);
    const l = linea0(m.ultima());
    expect(l.origen).toBeUndefined();
    expect(l.destino).toBeUndefined();
  });

  it("con Ctrl no se pega al puerto", () => {
    const m = montar(dos());
    fireEvent.click(herramienta("Línea"));
    arrastrar(m, [203, 128], [398, 292], 8, { ctrlKey: true });
    const l = linea0(m.ultima());
    expect(l.origen).toBeUndefined();
    expect(l.destino).toBeUndefined();
  });

  it("clic en un puerto, clic en el vacío y doble clic en otro puerto: línea de tres puntos pegada por sus extremos", () => {
    const m = montar(dos());
    fireEvent.click(herramienta("Línea"));
    clic(m, 203, 128);
    clic(m, 300, 500);
    puntero(m.lienzo, "pointerdown", m.aPantalla(398, 292));
    puntero(m.lienzo, "pointerup", m.aPantalla(398, 292));
    fireEvent.doubleClick(m.lienzo, m.aPantalla(398, 292));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = linea0(m.ultima());
    expect(l.puntos).toHaveLength(3);
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
    expect(l.puntos[1]).toEqual({ x: 300, y: 500 });
  });

  it("con la herramienta de línea se ven los puertos de todas las formas, y el cercano se resalta", () => {
    const m = montar(dos());
    expect(document.querySelectorAll("[data-puerto]")).toHaveLength(0);
    fireEvent.click(herramienta("Línea"));
    expect(document.querySelectorAll("[data-puerto]")).toHaveLength(12);
    expect(document.querySelector("[data-puerto-activo]")).toBeNull();
    puntero(m.lienzo, "pointermove", m.aPantalla(203, 128));
    expect(document.querySelector("[data-puerto-activo]")?.getAttribute("data-puerto")).toBe("A:1");
    puntero(m.lienzo, "pointermove", m.aPantalla(300, 500));
    expect(document.querySelector("[data-puerto-activo]")).toBeNull();
  });

  it("al elegir una forma se ven sus puertos (y solo los suyos)", () => {
    const m = montar(dos());
    clic(m, 150, 130);
    const puertos = [...document.querySelectorAll("[data-puerto]")].map((n) => n.getAttribute("data-puerto"));
    expect(puertos).toHaveLength(4);
    expect(puertos.every((p) => p?.startsWith("A:"))).toBe(true);
  });
});

describe("el conector sigue a las formas", () => {
  it("mover la forma de origen: el extremo la acompaña y sigue pegado (una sola entrada)", () => {
    const m = montar(conectada());
    arrastrar(m, [150, 130], [150, 330]);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.puntos[0]).toEqual({ x: 200, y: 330 });
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
  });

  it("mientras se arrastra, el conector se dibuja ya siguiendo a la forma (no salta al soltar)", () => {
    const m = montar(conectada());
    puntero(m.lienzo, "pointerdown", m.aPantalla(150, 130));
    puntero(m.lienzo, "pointermove", m.aPantalla(150, 200));
    puntero(m.lienzo, "pointermove", m.aPantalla(150, 330));
    const d = document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d") ?? "";
    expect(d.startsWith("M200,330")).toBe(true);
    puntero(m.lienzo, "pointerup", m.aPantalla(150, 330));
  });

  it("redimensionar la forma de destino lleva su puerto", () => {
    const m = montar(conectada());
    clic(m, 450, 290); // elige B
    // asa «s» de B (abajo en el centro): estirar 60 hacia abajo → el puerto izquierdo baja 30
    arrastrar(m, [450, 320], [450, 380]);
    expect(formas(m.ultima()).find((f) => f.id === "B")?.transformacion.alto).toBe(120);
    const l = linea0(m.ultima());
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
    expect(l.puntos[1]).toEqual({ x: 400, y: 320 });
  });

  it("rotar la forma de origen mueve el extremo a donde queda su puerto", () => {
    const m = montar(conectada());
    clic(m, 150, 130);
    // asa de rotar: 26 px (en pantalla) sobre el borde de arriba
    const zoom = (m.aPantalla(1, 0).clientX - m.aPantalla(0, 0).clientX) || 1;
    arrastrar(m, [150, 100 - 26 / zoom], [150 + 100, 130]); // gira hacia la derecha (90°)
    const a = formas(m.ultima()).find((f) => f.id === "A") as Forma;
    expect(a.transformacion.rotacion).toBeGreaterThan(45);
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    // el extremo ya no está donde estaba
    expect(Math.hypot(l.puntos[0]!.x - 200, l.puntos[0]!.y - 130)).toBeGreaterThan(20);
  });

  it("eliminar una forma NO borra el conector: lo desconecta y queda donde estaba", () => {
    const m = montar(conectada());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    const e = m.ultima();
    expect(formas(e).map((f) => f.id)).toEqual(["B", "C"]);
    const l = linea0(e);
    expect(l.origen).toBeUndefined();
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
    expect(l.puntos[0]).toEqual({ x: 200, y: 130 });
  });

  it("eliminar una forma que antes se había movido deja el conector donde se vio por última vez", () => {
    const m = montar(conectada());
    arrastrar(m, [150, 130], [150, 330]);
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    const l = linea0(m.ultima());
    expect(l.origen).toBeUndefined();
    expect(l.puntos[0]).toEqual({ x: 200, y: 330 });
  });

  it("mover la forma con las flechas del teclado y luego eliminarla: el conector queda donde la forma lo dejó", () => {
    const m = montar(conectada());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "ArrowDown", shiftKey: true });
    expect(linea0(m.ultima()).puntos[0]).toEqual({ x: 200, y: 140 });
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    const l = linea0(m.ultima());
    expect(l.origen).toBeUndefined();
    expect(l.puntos[0]).toEqual({ x: 200, y: 140 });
  });

  it("alinear las formas también arrastra a los conectores", () => {
    const m = montar(conectada());
    arrastrar(m, [60, 60], [850, 360]); // elige las tres formas (y el conector)
    fireEvent.click(botonCinta("Alinear arriba"));
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.destino).toEqual({ elementoId: "B", puerto: 3 });
    expect(l.puntos[0]).toEqual({ x: 200, y: 130 });
    expect(l.puntos[1]?.y).toBe(130); // B subió hasta la fila de A y su puerto izquierdo con ella
  });

  it("deshacer devuelve la forma y la conexión", () => {
    const m = montar(conectada());
    clic(m, 150, 130);
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    const l = linea0(m.ultima());
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(formas(m.ultima())).toHaveLength(3);
  });

  it("al abrir, un conector con los puntos desactualizados se ajusta a sus puertos sin avisar de ningún cambio", () => {
    const m = montar(escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[0, 0], [1, 1]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } })));
    expect(m.onCambio).not.toHaveBeenCalled();
    clic(m, 300, 210); // el recorrido pasa por ahí (tramo vertical de la «Z»)
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
  });
});

describe("asas del conector seleccionado", () => {
  const elegirLinea = (m: Montado): void => clic(m, 300, 250); // tramo vertical de la «Z» entre (300,130) y (300,290)

  it("hacer clic sobre el tramo que se ve (no sobre la recta entre los extremos) elige el conector; en un hueco no", () => {
    const m = montar(conectada());
    elegirLinea(m);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
    clic(m, 650, 550);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).not.toContain("seleccionado");
    // un punto sobre la recta entre extremos (200,130)-(400,290) pero lejos del recorrido en ángulo recto
    clic(m, 250, 170);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).not.toContain("seleccionado");
  });

  it("muestra extremos (verdes si están pegados) y un punto para crear uno intermedio; no las asas del marco", () => {
    const m = montar(conectada());
    elegirLinea(m);
    expect(asasDelConector()).toEqual(["origen", "destino", "insertar-0"]);
    expect(document.querySelectorAll('[data-pegado="si"]')).toHaveLength(2);
    expect(document.querySelectorAll("[data-asa]")).toHaveLength(0);
  });

  it("un extremo suelto se ve naranja (libre), no verde", () => {
    const m = montar(escena(linea("L", [[100, 300], [500, 300]])));
    clic(m, 300, 300);
    expect(document.querySelectorAll('[data-pegado="no"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-pegado="si"]')).toHaveLength(0);
    expect(document.querySelectorAll("[data-extremo-libre]")).toHaveLength(2);
    const fill = document.querySelector("[data-extremo-libre]")?.getAttribute("fill");
    expect(fill).toBe("#ea580c");
    expect(fill).not.toBe("#16a34a");
  });

  it("arrastrar el extremo destino a un puerto de otra forma lo pega, se resalta y es una sola entrada", () => {
    const m = montar(conectada());
    elegirLinea(m);
    puntero(m.lienzo, "pointerdown", m.aPantalla(400, 290));
    puntero(m.lienzo, "pointermove", m.aPantalla(500, 200));
    puntero(m.lienzo, "pointermove", m.aPantalla(702, 128));
    expect(document.querySelector("[data-puerto-activo]")?.getAttribute("data-puerto")).toBe("C:3");
    expect(document.querySelectorAll("[data-puerto]").length).toBeGreaterThan(4); // se ven los puertos de todas
    puntero(m.lienzo, "pointerup", m.aPantalla(702, 128));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = linea0(m.ultima());
    expect(l.destino).toEqual({ elementoId: "C", puerto: 3 });
    expect(l.puntos[1]).toEqual({ x: 700, y: 130 });
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(document.querySelector("[data-puerto-activo]")).toBeNull();
  });

  it("arrastrar un extremo al vacío lo despega y lo deja donde se soltó", () => {
    const m = montar(conectada());
    elegirLinea(m);
    arrastrar(m, [400, 290], [600, 480]);
    const l = linea0(m.ultima());
    expect(l.destino).toBeUndefined();
    expect(l.origen).toEqual({ elementoId: "A", puerto: 1 });
    expect(l.puntos[1]).toEqual({ x: 600, y: 480 });
  });

  it("Escape durante el arrastre de un extremo lo cancela sin avisar de ningún cambio", () => {
    const m = montar(conectada());
    elegirLinea(m);
    puntero(m.lienzo, "pointerdown", m.aPantalla(400, 290));
    puntero(m.lienzo, "pointermove", m.aPantalla(600, 480));
    puntero(m.lienzo, "pointermove", m.aPantalla(650, 500));
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    puntero(m.lienzo, "pointerup", m.aPantalla(650, 500));
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d")?.startsWith("M200,130")).toBe(true);
    expect(document.querySelectorAll('[data-pegado="si"]')).toHaveLength(2);
  });

  it("un clic sobre un extremo sin arrastrar no cambia nada", () => {
    const m = montar(conectada());
    elegirLinea(m);
    clic(m, 400, 290);
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("arrastrar el punto de crear agrega un punto intermedio; arrastrarlo lo mueve; doble clic lo quita", () => {
    const m = montar(conectada());
    elegirLinea(m);
    arrastrar(m, [300, 210], [320, 60]); // el punto de crear queda a mitad del recorrido: (300,210)
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(linea0(m.ultima()).puntos).toHaveLength(3);
    expect(linea0(m.ultima()).puntos[1]).toEqual({ x: 320, y: 60 });
    expect(linea0(m.ultima()).origen).toBeDefined();
    expect(asasDelConector()).toContain("via-1");
    arrastrar(m, [320, 60], [340, 40]);
    expect(linea0(m.ultima()).puntos[1]).toEqual({ x: 340, y: 40 });
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    fireEvent.doubleClick(m.lienzo, m.aPantalla(340, 40));
    expect(linea0(m.ultima()).puntos).toHaveLength(2);
    expect(m.onCambio).toHaveBeenCalledTimes(3);
  });

  it("doble clic en un extremo no abre el cuadro de texto", () => {
    const m = montar(conectada());
    elegirLinea(m);
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 290));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });

  it("arrastrar el cuerpo del conector (no un asa) lo mueve y lo despega de las formas", () => {
    const m = montar(conectada());
    elegirLinea(m);
    arrastrar(m, [300, 250], [300, 350]);
    const l = linea0(m.ultima());
    expect(l.origen).toBeUndefined();
    expect(l.destino).toBeUndefined();
  });

  it("deshacer tras mover un extremo lo devuelve pegado", () => {
    const m = montar(conectada());
    elegirLinea(m);
    arrastrar(m, [400, 290], [600, 480]);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(linea0(m.ultima()).destino).toEqual({ elementoId: "B", puerto: 3 });
    fireEvent.keyDown(m.lienzo, { key: "y", ctrlKey: true });
    expect(linea0(m.ultima()).destino).toBeUndefined();
  });
});

describe("pestaña «Formato de conector»", () => {
  const pestana = (): HTMLElement | null => screen.queryByRole("tab", { name: "Formato de conector" });

  it("solo aparece con líneas elegidas, resaltada como contextual, y se abre sola desde Inicio", () => {
    const m = montar(conectada());
    expect(pestana()).toBeNull();
    clic(m, 150, 130);
    expect(pestana()).toBeNull();
    clic(m, 300, 250);
    expect(pestana()).not.toBeNull();
    expect(pestana()?.hasAttribute("data-contextual")).toBe(true);
    expect(pestana()?.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("group", { name: "Trazado" })).toBeTruthy();
    // Al soltar la selección desaparece y la cinta vuelve a Inicio.
    clic(m, 700, 500);
    expect(pestana()).toBeNull();
    expect(screen.getByRole("tab", { name: "Inicio" }).getAttribute("aria-selected")).toBe("true");
  });

  it("no le quita la pestaña a quien trabaja en otra", () => {
    const m = montar(conectada());
    irAPestana("Organizar");
    clic(m, 300, 250);
    expect(pestana()).not.toBeNull();
    expect(pestana()?.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tab", { name: "Organizar" }).getAttribute("aria-selected")).toBe("true");
  });

  it("cambiar el trazado es una sola entrada y se ve en el dibujo; el estado queda marcado", () => {
    const m = montar(conectada({ trazado: "recto" }));
    clic(m, 300, 210);
    const antes = document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d");
    expect(antes).toBe("M200,130 L400,290");
    fireEvent.click(screen.getByRole("button", { name: "En ángulo recto" }));
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(linea0(m.ultima()).trazado).toBe("ortogonal");
    expect(document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d")).toBe("M200,130 L300,130 L300,290 L400,290");
    expect(screen.getByRole("button", { name: "En ángulo recto" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Recto" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Curvo" }));
    expect(linea0(m.ultima()).trazado).toBe("curvo");
    expect(document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d")).toMatch(/Q/);
  });

  it("esquinas redondeadas: solo en ángulo recto; cambian el dibujo y se pueden volver a poner vivas", () => {
    const m = montar(conectada());
    clic(m, 300, 250);
    expect(document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d")).not.toMatch(/Q/);
    fireEvent.click(screen.getByRole("button", { name: "Esquinas redondeadas" }));
    expect(linea0(m.ultima()).estilo.radio).toBeGreaterThan(0);
    expect(document.querySelector('[data-elemento-id="L"] path')?.getAttribute("d")).toMatch(/Q/);
    fireEvent.click(screen.getByRole("button", { name: "Esquinas redondeadas" }));
    expect(linea0(m.ultima()).estilo.radio).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Recto" }));
    expect(screen.queryByRole("button", { name: "Esquinas redondeadas" })).toBeNull();
  });

  it("los extremos se eligen de la lista (ninguno, flecha, flecha abierta, círculo, rombo)", () => {
    const m = montar(conectada());
    clic(m, 300, 250);
    const inicio = screen.getByRole("combobox", { name: "Extremo inicial" }) as HTMLSelectElement;
    const fin = screen.getByRole("combobox", { name: "Extremo final" }) as HTMLSelectElement;
    expect([...fin.options].map((o) => o.value)).toEqual(["ninguno", "flecha", "flecha-abierta", "circulo", "rombo"]);
    expect(inicio.value).toBe("ninguno");
    expect(fin.value).toBe("flecha");
    fireEvent.change(inicio, { target: { value: "circulo" } });
    fireEvent.change(fin, { target: { value: "rombo" } });
    expect(linea0(m.ultima())).toMatchObject({ inicio: "circulo", fin: "rombo" });
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    // y en el dibujo hay un círculo y un rombo
    expect(document.querySelector('[data-elemento-id="L"] circle')).not.toBeNull();
    expect(document.querySelector('[data-elemento-id="L"] polygon')).not.toBeNull();
  });

  it("con varias líneas elegidas actúa sobre todas, y una diferencia se muestra como «Mixto»", () => {
    const m = montar(escena(linea("L1", [[100, 100], [300, 100]], { fin: "flecha" }), linea("L2", [[100, 200], [300, 200]], { fin: "ninguno" })));
    arrastrar(m, [50, 50], [400, 250]);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("2 seleccionados");
    const fin = screen.getByRole("combobox", { name: "Extremo final" }) as HTMLSelectElement;
    expect(fin.value).toBe("");
    expect(within(fin).getByText("Mixto")).toBeTruthy();
    fireEvent.change(fin, { target: { value: "circulo" } });
    expect(lineas(m.ultima()).map((l) => l.fin)).toEqual(["circulo", "circulo"]);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("las teclas dentro de la barra no mueven la selección (flechas sobre la lista)", () => {
    const m = montar(conectada());
    clic(m, 300, 250);
    const antes = JSON.stringify(m.onCambio.mock.calls.length);
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Extremo final" }), { key: "ArrowDown" });
    expect(JSON.stringify(m.onCambio.mock.calls.length)).toBe(antes);
  });

  it("deshacer vuelve al trazado anterior", () => {
    const m = montar(conectada());
    clic(m, 300, 250);
    fireEvent.click(screen.getByRole("button", { name: "Curvo" }));
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(linea0(m.ultima()).trazado).toBe("ortogonal");
  });
});

describe("coherencia de lo que sale del editor", () => {
  it("en cada confirmación, los extremos pegados guardan la posición real de su puerto (así no cambian si la forma desaparece)", () => {
    const m = montar(conectada());
    clic(m, 300, 250);
    fireEvent.click(screen.getByRole("button", { name: "Curvo" }));
    arrastrar(m, [150, 130], [180, 330]);
    clic(m, 450, 290);
    arrastrar(m, [450, 290], [500, 400]);
    expect(m.onCambio.mock.calls.length).toBeGreaterThanOrEqual(3);
    for (const [salida] of m.onCambio.mock.calls) {
      const e = normalizarEscena(salida);
      const porId = new Map(formas(e).map((f) => [f.id, f]));
      for (const l of lineas(e)) {
        for (const [conexion, punto] of [[l.origen, l.puntos[0]], [l.destino, l.puntos[l.puntos.length - 1]]] as const) {
          if (!conexion) continue;
          const real = puntoDePuerto(porId.get(conexion.elementoId) as Forma, conexion.puerto);
          expect(Math.hypot((punto?.x ?? 0) - real.x, (punto?.y ?? 0) - real.y)).toBeLessThan(0.02);
        }
      }
    }
  });
});
