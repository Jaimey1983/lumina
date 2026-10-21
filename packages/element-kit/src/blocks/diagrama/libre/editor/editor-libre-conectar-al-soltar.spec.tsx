import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma, grupo, linea } from "./util-pruebas.js";

afterEach(() => cleanup());

// Rectángulos de 100×60. Puertos: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
//  A (100,100)   B (400,260): arriba (450,260) derecha (500,290) abajo (450,320) izquierda (400,290)   C (700,100)
const tres = (): Escena => escena(forma("A", 100, 100), forma("B", 400, 260), forma("C", 700, 100));

function montar(e: Escena) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={() => undefined} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  // Sin imán: así la forma llega exactamente adonde se la lleva.
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const evento = (tipo: string, x: number, y: number, extra: Record<string, unknown> = {}): void => {
    const v = vista();
    const { pointerType, ...init } = extra;
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX: v.x + x * v.z, clientY: v.y + y * v.z, ...init });
    if (pointerType) Object.defineProperty(ev, "pointerType", { value: pointerType });
    fireEvent(lienzo, ev);
  };
  return {
    onCambio,
    lienzo,
    apretar: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointerdown", x, y, extra),
    mover: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointermove", x, y, extra),
    soltar: (x: number, y: number, extra: Record<string, unknown> = {}) => evento("pointerup", x, y, extra),
    /** Arrastra tomando la forma por `desde` y llevando el puntero hasta `hasta`, en pasos, y suelta. */
    arrastrar(desde: [number, number], hasta: [number, number], extra: Record<string, unknown> = {}, soltarAlFinal = true) {
      evento("pointerdown", ...desde, extra);
      for (let i = 1; i <= 8; i++) evento("pointermove", desde[0] + ((hasta[0] - desde[0]) * i) / 8, desde[1] + ((hasta[1] - desde[1]) * i) / 8, extra);
      if (soltarAlFinal) evento("pointerup", ...hasta, extra);
    },
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}

const lineasDe = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const formaDe = (e: Escena, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;
const previa = (): boolean => document.querySelector("[data-capa=conexion-previa]") !== null;
const modo = (): string | null => document.querySelector("[data-capa=destino]")?.getAttribute("data-modo") ?? null;
const destino = (): string | null => document.querySelector("[data-capa=destino] [data-destino]")?.getAttribute("data-destino") ?? null;
const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";

// A se toma casi por el borde de arriba (150,101): al llevar el puntero a (450,322) —a 2 px del puerto de abajo de B— A queda
// justo debajo de B, centrada, con su puerto de arriba en (450,321).
const TOMA: [number, number] = [150, 101];
const HALO_DE_ABAJO_DE_B: [number, number] = [450, 322];
const CENTRO_DE_B: [number, number] = [450, 290];

describe("soltar una forma sobre el halo de un puerto de otra", () => {
  it("crea UN conector de la de abajo (el padre) a la que se arrastró, por los puertos que se miran", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    const final = m.ultima();
    const ls = lineasDe(final);
    expect(ls).toHaveLength(1);
    const l = ls[0] as Linea;
    expect(l.origen).toEqual({ elementoId: "B", puerto: 2 });
    expect(l.destino).toEqual({ elementoId: "A", puerto: 0 });
    expect(l.trazado).toBe("ortogonal");
    expect(l.fin).toBe("flecha");
    expect(formaDe(final, "A").transformacion).toMatchObject({ x: 400, y: 321 });
    // El extremo guarda la posición real del puerto.
    expect(l.puntos[0]).toEqual({ x: 450, y: 320 });
    expect(l.puntos.at(-1)).toEqual({ x: 450, y: 321 });
  });

  it("el movimiento y el conector son UNA entrada de historial y UNA confirmación; Ctrl+Z deshace los dos", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    const deshecha = m.ultima();
    expect(lineasDe(deshecha)).toHaveLength(0);
    expect(formaDe(deshecha, "A").transformacion).toMatchObject({ x: 100, y: 100 });
    // Y Ctrl+Y los devuelve juntos.
    fireEvent.keyDown(m.lienzo, { key: "y", ctrlKey: true });
    expect(lineasDe(m.ultima())).toHaveLength(1);
    expect(formaDe(m.ultima(), "A").transformacion).toMatchObject({ x: 400, y: 321 });
  });

  it("el conector sigue a las formas: al mover A después, su extremo va con ella", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    m.arrastrar([450, 340], [450, 440]); // se toma A (que ahora está debajo de B) y se baja
    const l = lineasDe(m.ultima())[0] as Linea;
    expect(l.destino).toEqual({ elementoId: "A", puerto: 0 });
    expect(l.puntos.at(-1)).toEqual({ x: 450, y: 421 });
    expect(lineasDe(m.ultima())).toHaveLength(1);
  });

  it("con el puntero un poco FUERA de B (a 12 px del puerto) también conecta", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, [450, 332]);
    expect(lineasDe(m.ultima())).toHaveLength(1);
  });

  it("se usa el punto EXACTO en que se suelta, aunque no haya habido ningún movimiento justo ahí", () => {
    // Con el ratón rápido, el último «pointermove» pintado puede ir por detrás del «pointerup»: la posición final y los puertos
    // salen del punto de la suelta, no de la última pintura.
    const m = montar(tres());
    m.apretar(...TOMA);
    m.mover(300, 200);
    m.mover(350, 250);
    m.soltar(...HALO_DE_ABAJO_DE_B);
    const final = m.ultima();
    expect(formaDe(final, "A").transformacion).toMatchObject({ x: 400, y: 321 });
    const l = lineasDe(final)[0] as Linea;
    expect(l.origen).toEqual({ elementoId: "B", puerto: 2 });
    expect(l.destino).toEqual({ elementoId: "A", puerto: 0 });
  });

  it("lo anuncia a los lectores de pantalla", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    expect(anuncio()).toMatch(/conectada a/i);
  });
});

describe("sin halo ni Alt, soltar solo mueve", () => {
  it("soltar sobre el centro de la forma de abajo: se solapan y no se crea nada", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, CENTRO_DE_B);
    expect(lineasDe(m.ultima())).toHaveLength(0);
    expect(formaDe(m.ultima(), "A").transformacion).toMatchObject({ x: 400, y: 289 });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("soltar en el vacío tampoco conecta", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, [250, 450]);
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });

  it("a más de 14 px del puerto y fuera de la forma, no conecta", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, [450, 340]);
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });
});

describe("con Alt", () => {
  it("soltar dentro de la forma, lejos de sus puertos, con Alt apretada: conecta", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, CENTRO_DE_B, { altKey: true });
    const ls = lineasDe(m.ultima());
    expect(ls).toHaveLength(1);
    expect((ls[0] as Linea).origen?.elementoId).toBe("B");
    expect((ls[0] as Linea).destino?.elementoId).toBe("A");
  });

  it("con Alt pero soltando en el vacío no hay nada que conectar", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, [250, 450], { altKey: true });
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });

  it("lo que cuenta es Alt al SOLTAR: si se suelta sin Alt, no conecta", () => {
    const m = montar(tres());
    m.apretar(...TOMA);
    m.mover(...CENTRO_DE_B, { altKey: true });
    expect(previa()).toBe(true);
    m.soltar(...CENTRO_DE_B, { altKey: false });
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });
});

describe("vista previa antes de soltar", () => {
  it("sobre el halo: la forma destino en verde («conecta») y el conector que se crearía, de puerto a puerto", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B, {}, false);
    expect(destino()).toBe("B");
    expect(modo()).toBe("conecta");
    expect(previa()).toBe(true);
    const linea_ = document.querySelector("[data-capa=conexion-previa] line") as SVGLineElement;
    expect(linea_.getAttribute("stroke-dasharray")).toBeTruthy();
    m.soltar(...HALO_DE_ABAJO_DE_B);
    expect(previa()).toBe(false);
    expect(destino()).toBeNull();
  });

  it("sobre la forma pero sin halo: se resalta como «solapa» y NO hay vista previa de conector", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, CENTRO_DE_B, {}, false);
    expect(destino()).toBe("B");
    expect(modo()).toBe("solapa");
    expect(previa()).toBe(false);
  });

  it("con Alt la vista previa aparece aunque el puntero esté lejos de los puertos, y se va si se suelta Alt", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, CENTRO_DE_B, { altKey: true }, false);
    expect(modo()).toBe("conecta");
    expect(previa()).toBe(true);
    m.mover(450, 291, { altKey: false });
    expect(modo()).toBe("solapa");
    expect(previa()).toBe(false);
  });

  it("al pasar de una forma a otra, la vista previa y el destino siguen al puntero", () => {
    const m = montar(tres());
    m.apretar(...TOMA);
    m.mover(...HALO_DE_ABAJO_DE_B);
    expect(destino()).toBe("B");
    m.mover(750, 160); // abajo de C, en el halo de su puerto de abajo (750,160)
    expect(destino()).toBe("C");
    expect(previa()).toBe(true);
    m.mover(400, 500); // al vacío
    expect(destino()).toBeNull();
    expect(previa()).toBe(false);
  });

  it("Escape durante el arrastre quita la vista previa, devuelve la forma y no crea nada", () => {
    const m = montar(tres());
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B, {}, false);
    expect(previa()).toBe(true);
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(previa()).toBe(false);
    expect(destino()).toBeNull();
    expect(m.onCambio).not.toHaveBeenCalled();
  });
});

describe("cuándo no conecta", () => {
  it("si ya hay un conector del padre a la hija, no se duplica", () => {
    // El conector existente va por entre las dos formas, lejos del punto por el que se toma A.
    const e = escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[400, 290], [200, 130]], { origen: { elementoId: "B", puerto: 3 }, destino: { elementoId: "A", puerto: 1 } }));
    const m = montar(e);
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B, {}, false);
    expect(previa()).toBe(false);
    expect(modo()).toBe("solapa");
    m.soltar(...HALO_DE_ABAJO_DE_B);
    expect(lineasDe(m.ultima())).toHaveLength(1);
  });

  it("el conector en sentido contrario no lo impide: se crea el nuevo", () => {
    const e = escena(forma("A", 100, 100), forma("B", 400, 260), linea("L", [[200, 130], [400, 290]], { origen: { elementoId: "A", puerto: 1 }, destino: { elementoId: "B", puerto: 3 } }));
    const m = montar(e);
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    expect(lineasDe(m.ultima())).toHaveLength(2);
  });

  it("una forma bloqueada no recibe conexiones", () => {
    const e = escena(forma("A", 100, 100), forma("B", 400, 260, 100, 60, { bloqueado: true }));
    const m = montar(e);
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B, { altKey: true });
    expect(lineasDe(m.ultima())).toHaveLength(0);
    expect(destino()).toBeNull();
  });

  it("una forma oculta tampoco", () => {
    const e = escena(forma("A", 100, 100), forma("B", 400, 260, 100, 60, { oculto: true }));
    const m = montar(e);
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B, { altKey: true });
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });

  it("redimensionar o girar sobre otra forma nunca conecta", () => {
    const m = montar(tres());
    m.arrastrar([150, 130], [150, 130]); // elige A
    m.arrastrar([200, 160], HALO_DE_ABAJO_DE_B, { altKey: true }); // asa de abajo a la derecha, arrastrada sobre el halo de B
    expect(lineasDe(m.ultima())).toHaveLength(0);
  });
});

describe("varias formas y grupos", () => {
  it("con varias elegidas, se mueven todas pero solo la que se tomó se conecta", () => {
    const m = montar(escena(forma("A", 100, 100), forma("X", 300, 100), forma("C", 700, 400)));
    // Se eligen A y X (clic y Mayús+clic) y se toma A por el borde de arriba (lejos de las asas del recuadro de la selección),
    // llevándola al halo del puerto de abajo de C.
    m.apretar(150, 130);
    m.soltar(150, 130);
    m.apretar(350, 130, { shiftKey: true });
    m.soltar(350, 130, { shiftKey: true });
    m.arrastrar(TOMA, [750, 462]);
    const final = m.ultima();
    const ls = lineasDe(final);
    expect(ls).toHaveLength(1);
    expect((ls[0] as Linea).origen).toEqual({ elementoId: "C", puerto: 2 });
    expect((ls[0] as Linea).destino?.elementoId).toBe("A");
    // X se movió con A (600 a la derecha y 361 hacia abajo) pero no se conectó con nada.
    expect(formaDe(final, "X").transformacion).toMatchObject({ x: 900, y: 461 });
  });

  it("con un grupo, se conecta la forma de dentro por la que se tomó", () => {
    const e = escena(forma("P", 400, 260), forma("a", 100, 100), forma("b", 250, 100), grupo("g", ["a", "b"]));
    const m = montar(e);
    m.arrastrar(TOMA, HALO_DE_ABAJO_DE_B);
    const ls = lineasDe(m.ultima());
    expect(ls).toHaveLength(1);
    expect((ls[0] as Linea).origen?.elementoId).toBe("P");
    expect((ls[0] as Linea).destino?.elementoId).toBe("a");
  });
});

describe("con el dedo", () => {
  it("el halo es de 24 px: a 20 px del puerto el dedo conecta y el ratón no", () => {
    const conRaton = montar(tres());
    conRaton.arrastrar(TOMA, [450, 340], { pointerType: "mouse" });
    expect(lineasDe(conRaton.ultima())).toHaveLength(0);
    cleanup();
    const conDedo = montar(tres());
    conDedo.arrastrar(TOMA, [450, 340], { pointerType: "touch" });
    expect(lineasDe(conDedo.ultima())).toHaveLength(1);
  });
});
