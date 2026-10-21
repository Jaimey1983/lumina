import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma, linea } from "./util-pruebas.js";

afterEach(() => cleanup());

// Rectángulos de 100×60. Puertos: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
//  A (100,100): derecha (200,130)  abajo (150,160)
//  B (400,260): izquierda (400,290)  arriba (450,260)
//  C (700,100): izquierda (700,130)
const tres = (): Escena => escena(forma("A", 100, 100), forma("B", 400, 260), forma("C", 700, 100));
const conectada = (): Escena =>
  escena(
    forma("A", 100, 100),
    forma("B", 400, 260),
    forma("C", 700, 100),
    linea("L", [[200, 130], [400, 290]], { fin: "flecha", trazado: "ortogonal", origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } }),
  );

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={() => undefined} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const aPantalla = (x: number, y: number) => {
    const v = vista();
    return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const { pointerType, ...init } = extra;
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...aPantalla(x, y), ...init });
    if (pointerType) Object.defineProperty(ev, "pointerType", { value: pointerType });
    fireEvent(lienzo, ev);
  };
  return {
    onCambio,
    lienzo,
    mover: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointermove", x, y, extra),
    apretar: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointerdown", x, y, extra),
    soltar: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointerup", x, y, extra),
    clic(x: number, y: number) {
      evento("pointerdown", x, y);
      evento("pointerup", x, y);
    },
    arrastrarHasta(desde: [number, number], pasos: Array<[number, number]>) {
      evento("pointerdown", ...desde);
      for (const p of pasos) evento("pointermove", ...p);
    },
  };
}

/** Ids de las formas que muestran puertos ahora mismo (`data-puerto="A:1"`, sin contar el puerto activo). */
const formasConPuertos = (): string[] => [...new Set([...document.querySelectorAll("[data-puerto]")].map((n) => (n.getAttribute("data-puerto") ?? "").split(":")[0] as string))].sort();
const puertosDe = (id: string): number => document.querySelectorAll(`[data-puerto^="${id}:"]`).length;
const destino = (): string | null => document.querySelector("[data-capa=destino] [data-destino]")?.getAttribute("data-destino") ?? null;

describe("puertos al pasar el cursor (herramienta Seleccionar)", () => {
  it("sin nada elegido y sin cursor encima, no se ve ningún puerto", () => {
    montar(tres());
    expect(formasConPuertos()).toEqual([]);
  });

  it("con el cursor sobre una forma se ven sus 4 puertos, y solo los suyos", () => {
    const m = montar(tres());
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual(["A"]);
    expect(puertosDe("A")).toBe(4);
    m.mover(450, 290);
    expect(formasConPuertos()).toEqual(["B"]);
  });

  it("al sacar el cursor de la forma, a un hueco del lienzo o fuera del lienzo, se apagan", () => {
    const m = montar(tres());
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual(["A"]);
    m.mover(300, 450);
    expect(formasConPuertos()).toEqual([]);
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual(["A"]);
    fireEvent.pointerLeave(m.lienzo);
    expect(formasConPuertos()).toEqual([]);
  });

  it("sin parpadeo: yendo hacia un puerto del borde, los puertos no se apagan al salir de la forma", () => {
    const m = montar(tres());
    // Recorrido de dentro de A hacia su puerto derecho (200,130) y un poco más allá.
    const camino: Array<[number, number]> = [[150, 130], [180, 130], [198, 130], [205, 130], [210, 130], [213, 130]];
    for (const [x, y] of camino) {
      m.mover(x, y);
      expect(formasConPuertos(), `en (${x}, ${y})`).toEqual(["A"]);
    }
    // Alejándose ya sin tocar el puerto, se apagan.
    m.mover(240, 130);
    expect(formasConPuertos()).toEqual([]);
  });

  it("no se muestran en una forma bloqueada ni en una oculta", () => {
    const m = montar(escena(forma("fija", 100, 100, 100, 60, { bloqueado: true }), forma("oculta", 400, 100, 100, 60, { oculto: true }), forma("normal", 700, 100)));
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual([]);
    m.mover(450, 130);
    expect(formasConPuertos()).toEqual([]);
    m.mover(750, 130);
    expect(formasConPuertos()).toEqual(["normal"]);
  });

  it("sigue a la forma correcta aunque esté girada", () => {
    const m = montar(escena(forma("R", 100, 100, 100, 100, { transformacion: { x: 100, y: 100, ancho: 100, alto: 100, rotacion: 45 } })));
    m.mover(150, 88); // dentro del rombo, fuera de la caja sin girar
    expect(formasConPuertos()).toEqual(["R"]);
    m.mover(101, 101); // dentro de la caja sin girar, fuera del rombo (y a más de 14 px de sus puertos)
    expect(formasConPuertos()).toEqual([]);
  });

  it("junto a las formas elegidas: se siguen viendo los de la elegida y se suman los de la que tiene el cursor", () => {
    const m = montar(tres());
    m.clic(150, 130); // elige A
    expect(formasConPuertos()).toEqual(["A"]);
    m.mover(450, 290);
    expect(formasConPuertos()).toEqual(["A", "B"]);
    m.mover(300, 450);
    expect(formasConPuertos()).toEqual(["A"]);
  });

  it("mientras se arrastra no aparecen los de otras formas por las que se pasa", () => {
    const m = montar(tres());
    m.mover(150, 130);
    m.arrastrarHasta([150, 130], [[200, 150], [300, 200], [450, 290]]);
    expect(formasConPuertos()).not.toContain("B");
    expect(formasConPuertos()).not.toContain("C");
  });

  it("con otra herramienta (texto) no se muestran al pasar el cursor, ni se quedan los que ya se veían", () => {
    const m = montar(tres());
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual(["A"]);
    fireEvent.click(botonCinta("Texto"));
    m.mover(150, 130);
    expect(formasConPuertos()).toEqual([]);
    m.mover(450, 290);
    expect(formasConPuertos()).toEqual([]);
  });

  it("con la herramienta de línea siguen viéndose los de todas, como antes", () => {
    montar(tres());
    fireEvent.click(botonCinta("Línea"));
    expect(formasConPuertos()).toEqual(["A", "B", "C"]);
  });
});

describe("la forma destino se resalta entera", () => {
  it("al arrastrar un extremo de conector hasta un puerto, esa forma se resalta; al soltar, se apaga", () => {
    const m = montar(conectada());
    m.clic(300, 250); // elige el conector (su tramo vertical)
    expect(destino()).toBeNull();
    m.arrastrarHasta([400, 290], [[500, 250], [700, 140], [700, 130]]);
    expect(destino()).toBe("C");
    m.soltar(700, 130);
    expect(destino()).toBeNull();
  });

  it("el resalte es el contorno de la forma (borde y relleno suave), no su caja", () => {
    const m = montar(conectada());
    m.clic(300, 250);
    m.arrastrarHasta([400, 290], [[700, 130]]);
    const capa = document.querySelector("[data-capa=destino]") as SVGGElement;
    const trazo = capa.querySelector("[data-destino]") as SVGPathElement;
    expect(trazo.getAttribute("d")).toBeTruthy();
    expect(trazo.getAttribute("fill-opacity")).toBeTruthy();
    expect(trazo.getAttribute("stroke")).toBeTruthy();
    expect(trazo.getAttribute("vector-effect")).toBe("non-scaling-stroke");
    expect(capa.getAttribute("pointer-events")).toBe("none");
    expect(trazo.getAttribute("transform")).toBe("translate(700 100)");
  });

  it("el resalte de una forma girada lleva su giro", () => {
    const m = montar(
      escena(
        forma("A", 100, 100),
        forma("R", 500, 300, 100, 100, { transformacion: { x: 500, y: 300, ancho: 100, alto: 100, rotacion: 30 } }),
        linea("L", [[200, 130], [300, 130]], { origen: { elementoId: "A", puerto: 1 } }),
      ),
    );
    m.clic(250, 130);
    // El puerto izquierdo de R (girado 30° alrededor de su centro) está en (550 - 50·cos30, 350 - 50·sin30).
    const px = 550 - 50 * Math.cos(Math.PI / 6);
    const py = 350 - 50 * Math.sin(Math.PI / 6);
    m.arrastrarHasta([300, 130], [[px - 40, py - 20], [px, py]]);
    expect(destino()).toBe("R");
    expect((document.querySelector("[data-capa=destino] [data-destino]") as Element).getAttribute("transform")).toBe("translate(500 300) rotate(30 50 50)");
  });

  it("Escape durante el arrastre apaga el resalte", () => {
    const m = montar(conectada());
    m.clic(300, 250);
    m.arrastrarHasta([400, 290], [[700, 130]]);
    expect(destino()).toBe("C");
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(destino()).toBeNull();
  });

  it("con la herramienta de línea, al acercar el cursor a un puerto se resalta su forma antes de apretar", () => {
    const m = montar(tres());
    fireEvent.click(botonCinta("Línea"));
    m.mover(300, 450);
    expect(destino()).toBeNull();
    m.mover(450, 262); // cerca del puerto de arriba de B
    expect(destino()).toBe("B");
    m.mover(300, 450);
    expect(destino()).toBeNull();
  });

  it("Ctrl suspende el imán de puertos y, con él, el resalte", () => {
    const m = montar(tres());
    fireEvent.click(botonCinta("Línea"));
    m.mover(450, 262, { ctrlKey: true });
    expect(destino()).toBeNull();
  });

  it("al arrastrar una forma sobre otra, esta última se resalta; la que se arrastra, nunca", () => {
    const m = montar(tres());
    m.arrastrarHasta([150, 130], [[250, 200], [350, 250], [450, 290]]);
    expect(destino()).toBe("B");
    m.mover(300, 450); // al vacío
    expect(destino()).toBeNull();
    m.mover(160, 140); // sobre sí misma, en su sitio original
    expect(destino()).toBeNull();
    m.soltar(160, 140);
    expect(destino()).toBeNull();
  });

  it("Escape durante el arrastre de una forma apaga el resalte de la de debajo y devuelve la forma a su sitio", () => {
    const m = montar(tres());
    m.arrastrarHasta([150, 130], [[300, 200], [450, 290]]);
    expect(destino()).toBe("B");
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(destino()).toBeNull();
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("arrastrar una forma sobre otra solo resalta: no crea ningún conector ni toca la otra", () => {
    const m = montar(tres());
    m.arrastrarHasta([150, 130], [[450, 290]]);
    expect(destino()).toBe("B");
    m.soltar(450, 290); // se suelta justo encima de B: el resalte se apaga
    expect(destino()).toBeNull();
    const ultima = m.onCambio.mock.calls.at(-1)?.[0] as Escena;
    expect(ultima.elementos.filter((e) => e.tipo === "linea")).toHaveLength(0);
    const B = ultima.elementos.find((e) => e.id === "B");
    expect(B && "transformacion" in B ? B.transformacion.x : null).toBe(400);
  });

  it("redimensionar o girar no resaltan ninguna forma", () => {
    const m = montar(tres());
    m.clic(150, 130);
    // Asa de abajo a la derecha de A, arrastrada sobre B.
    m.arrastrarHasta([200, 160], [[300, 220], [450, 290]]);
    expect(destino()).toBeNull();
  });
});

describe("con el dedo", () => {
  it("un puerto a 20 px lo capta el dedo (y se resalta su forma) y el ratón no", () => {
    const m = montar(tres());
    fireEvent.click(botonCinta("Línea"));
    m.mover(450, 240, { pointerType: "mouse" }); // a 20 del puerto de arriba de B (450,260)
    expect(destino()).toBeNull();
    m.mover(450, 240, { pointerType: "touch" });
    expect(destino()).toBe("B");
  });

  it("con el dedo los puertos se dibujan más grandes", () => {
    const m = montar(tres());
    fireEvent.click(botonCinta("Línea"));
    const radio = (): number => Number(document.querySelector("[data-puerto]:not([data-puerto-activo])")?.getAttribute("r"));
    m.mover(300, 450, { pointerType: "mouse" });
    const normal = radio();
    m.mover(300, 450, { pointerType: "touch" });
    expect(radio()).toBeGreaterThan(normal);
  });

  it("el dedo capta desde más lejos también al arrastrar el extremo de un conector", () => {
    const conRaton = montar(conectada());
    conRaton.clic(300, 250);
    conRaton.arrastrarHasta([400, 290], [[700 - 20, 130]]); // a 20 del puerto izquierdo de C
    expect(destino()).toBeNull();
    cleanup();
    const conDedo = montar(conectada());
    conDedo.apretar(300, 250, { pointerType: "touch" });
    conDedo.soltar(300, 250, { pointerType: "touch" });
    conDedo.apretar(400, 290, { pointerType: "touch" });
    conDedo.mover(500, 250, { pointerType: "touch" });
    conDedo.mover(700 - 20, 130, { pointerType: "touch" });
    expect(destino()).toBe("C");
  });
});
