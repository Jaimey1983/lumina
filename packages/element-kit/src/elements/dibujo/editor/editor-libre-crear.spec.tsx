import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMAS, TIPOS_FORMA, normalizarEscena, type Escena, type Forma, type Linea, type Texto } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma, irAPestana, linea } from "./util-pruebas.js";

afterEach(() => cleanup());

interface Montado {
  onCambio: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  lienzo: SVGSVGElement;
  aPantalla: (x: number, y: number) => { clientX: number; clientY: number };
  ultima: () => Escena;
}

function montar(e: Escena = escena()): Montado {
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
const herramienta = (nombre: string): HTMLButtonElement => botonCinta(nombre);
const insertar = (nombre: string): void => {
  fireEvent.click(botonCinta(`Insertar ${nombre}`));
};
const sinIman = (): void => {
  fireEvent.click(botonCinta("Imantar a otros elementos"));
};
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const textos = (e: Escena): Texto[] => e.elementos.filter((x): x is Texto => x.tipo === "texto");
const cuadroTexto = (): HTMLTextAreaElement => screen.getByRole("textbox", { name: "Texto del elemento" }) as HTMLTextAreaElement;

describe("cinta: herramientas y formas", () => {
  it("las herramientas están en Inicio y el catálogo agrupado en Insertar: un botón por cada forma", () => {
    montar();
    for (const h of ["Seleccionar", "Línea", "Flecha", "Texto"]) expect(herramienta(h)).toBeTruthy();
    irAPestana("Insertar");
    const panel = screen.getByRole("tabpanel");
    for (const g of ["Formas básicas", "Flechas", "Diagramas"]) expect(within(panel).getByRole("group", { name: g })).toBeTruthy();
    expect(within(panel).getAllByRole("button", { name: /^Insertar / })).toHaveLength(TIPOS_FORMA.length);
    for (const f of TIPOS_FORMA) expect(within(panel).getByRole("button", { name: `Insertar ${FORMAS[f].nombre}` })).toBeTruthy();
  });

  it("empieza con «Seleccionar» activa; elegir una forma la marca y desmarca la anterior", () => {
    montar();
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
    insertar("Rombo");
    expect(botonCinta("Insertar Rombo").getAttribute("aria-pressed")).toBe("true");
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("false");
    expect(document.querySelector("[data-dibujo-anuncio]")?.textContent).toMatch(/Herramienta: Rombo/);
  });

  it("al elegir una herramienta el foco vuelve al lienzo (para seguir con el teclado)", () => {
    const m = montar();
    insertar("Rombo");
    expect(document.activeElement).toBe(m.lienzo);
  });
});

describe("insertar una forma", () => {
  it.each(TIPOS_FORMA)("%s: un clic la inserta con su tamaño por defecto, centrada, y queda seleccionada", (tipo) => {
    const m = montar();
    insertar(FORMAS[tipo].nombre);
    clic(m, 400, 200);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const f = formas(m.ultima())[0];
    expect(f?.forma).toBe(tipo);
    expect(f?.transformacion.ancho).toBe(FORMAS[tipo].tamano.ancho);
    expect(f?.transformacion.alto).toBe(FORMAS[tipo].tamano.alto);
    expect((f?.transformacion.x ?? 0) + (f?.transformacion.ancho ?? 0) / 2).toBeCloseTo(400, 0);
    expect((f?.transformacion.y ?? 0) + (f?.transformacion.alto ?? 0) / 2).toBeCloseTo(200, 0);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true"); // vuelve a seleccionar
  });

  it("arrastrar la dibuja del tamaño arrastrado, sin importar la dirección", () => {
    const m = montar();
    sinIman();
    insertar("Elipse");
    arrastrar(m, [150, 130], [350, 250]);
    const t = formas(m.ultima())[0]?.transformacion;
    expect(t?.x).toBeCloseTo(150, 0);
    expect(t?.y).toBeCloseTo(130, 0);
    expect(t?.ancho).toBeCloseTo(200, 0);
    expect(t?.alto).toBeCloseTo(120, 0);

    cleanup();
    const m2 = montar();
    insertar("Rombo");
    arrastrar(m2, [700, 450], [550, 380]);
    const u = formas(m2.ultima())[0]?.transformacion;
    expect(u?.x).toBeCloseTo(550, 0);
    expect(u?.y).toBeCloseTo(380, 0);
    expect(u?.ancho).toBeCloseTo(150, 0);
    expect(u?.alto).toBeCloseTo(70, 0);
  });

  it("Mayús dibuja un cuadrado y Alt arrastra desde el centro", () => {
    const m = montar();
    sinIman();
    insertar("Rectángulo");
    arrastrar(m, [200, 150], [320, 190], 6, { shiftKey: true });
    const t = formas(m.ultima())[0]?.transformacion;
    expect(t?.ancho).toBeCloseTo(t?.alto ?? 0, 0);
    expect(t?.ancho).toBeCloseTo(120, 0);

    cleanup();
    const m2 = montar();
    sinIman();
    insertar("Rectángulo");
    arrastrar(m2, [300, 300], [360, 340], 6, { altKey: true });
    const c = formas(m2.ultima())[0]?.transformacion;
    expect((c?.x ?? 0) + (c?.ancho ?? 0) / 2).toBeCloseTo(300, 0);
    expect((c?.y ?? 0) + (c?.alto ?? 0) / 2).toBeCloseTo(300, 0);
    expect(c?.ancho).toBeCloseTo(120, 0);
  });

  it("un arrastre minúsculo se trata como clic (tamaño por defecto) y uno corto respeta el mínimo", () => {
    const m = montar();
    sinIman();
    insertar("Rectángulo");
    arrastrar(m, [200, 150], [202, 151], 2);
    expect(formas(m.ultima())[0]?.transformacion.ancho).toBe(FORMAS.rectangulo.tamano.ancho);
    cleanup();
    const m2 = montar();
    sinIman();
    insertar("Rectángulo");
    arrastrar(m2, [200, 150], [212, 170], 3);
    const t = formas(m2.ultima())[0]?.transformacion;
    expect(t?.ancho).toBeGreaterThanOrEqual(12);
    expect(t?.ancho).toBeLessThan(40);
  });

  it("mientras se arrastra se ve una vista previa, que desaparece al soltar", () => {
    const m = montar();
    insertar("Estrella");
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointermove", m.aPantalla(300, 220));
    puntero(m.lienzo, "pointermove", m.aPantalla(320, 240));
    expect(document.querySelector("[data-capa=previa] path")).toBeTruthy();
    expect(m.onCambio).not.toHaveBeenCalled();
    puntero(m.lienzo, "pointerup", m.aPantalla(320, 240));
    expect(document.querySelector("[data-capa=previa]")).toBeNull();
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("Escape durante el arrastre cancela la creación y no cierra nada", () => {
    const m = montar();
    insertar("Estrella");
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointermove", m.aPantalla(300, 220));
    puntero(m.lienzo, "pointermove", m.aPantalla(320, 240));
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    puntero(m.lienzo, "pointerup", m.aPantalla(320, 240));
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("crear es UNA entrada de historial: Ctrl+Z la quita y Ctrl+Y la devuelve", () => {
    const m = montar();
    insertar("Círculo");
    clic(m, 400, 200);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.ultima().elementos).toHaveLength(0);
    fireEvent.keyDown(m.lienzo, { key: "y", ctrlKey: true });
    expect(formas(m.ultima())).toHaveLength(1);
  });

  it("se encaja a la cuadrícula si está encendida (el centro queda en una intersección)", () => {
    const m = montar();
    sinIman();
    fireEvent.click(botonCinta("Cuadrícula"));
    insertar("Rectángulo");
    clic(m, 403, 197);
    const t = formas(m.ultima())[0]?.transformacion;
    expect((t?.x ?? 0) + (t?.ancho ?? 0) / 2).toBeCloseTo(400, 0);
    expect((t?.y ?? 0) + (t?.alto ?? 0) / 2).toBeCloseTo(200, 0);
  });

  it("varias formas seguidas: cada una con su herramienta, sin mezclarse", () => {
    const m = montar();
    insertar("Rombo");
    clic(m, 200, 150);
    insertar("Elipse");
    clic(m, 700, 400);
    expect(formas(m.ultima()).map((f) => f.forma)).toEqual(["rombo", "elipse"]);
    expect(m.onCambio).toHaveBeenCalledTimes(2);
  });
});

describe("herramientas por teclado", () => {
  it("V, L, A y T eligen herramienta desde el lienzo", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    expect(herramienta("Línea").getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(m.lienzo, { key: "a" });
    expect(herramienta("Flecha").getAttribute("aria-pressed")).toBe("true");
    expect(herramienta("Línea").getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(m.lienzo, { key: "t" });
    expect(herramienta("Texto").getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(m.lienzo, { key: "v" });
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
  });

  it("Escape vuelve a «Seleccionar» antes de tocar la selección o cerrar", () => {
    const m = montar(escena(forma("a", 100, 100)));
    fireEvent.keyDown(m.lienzo, { key: "Tab" }); // selecciona `a`
    insertar("Rombo");
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("las letras no hacen nada si el foco está en un botón de la barra", () => {
    montar();
    const boton = botonCinta("Duplicar");
    boton.focus();
    fireEvent.keyDown(boton, { key: "l" });
    expect(herramienta("Línea").getAttribute("aria-pressed")).toBe("false");
  });
});

describe("líneas y flechas", () => {
  it("arrastrar con «Línea» traza una recta de punta a punta, sin punta de flecha", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    arrastrar(m, [150, 150], [450, 250]);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = lineas(m.ultima())[0];
    expect(l?.puntos).toHaveLength(2);
    expect(l?.puntos[0]?.x).toBeCloseTo(150, 0);
    expect(l?.puntos[1]?.y).toBeCloseTo(250, 0);
    expect(l).toMatchObject({ trazado: "recto", fin: "ninguno", inicio: "ninguno" });
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
  });

  it("con «Flecha» termina en flecha", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "a" });
    arrastrar(m, [150, 150], [450, 150]);
    expect(lineas(m.ultima())[0]).toMatchObject({ fin: "flecha", inicio: "ninguno" });
  });

  it("clic, clic y doble clic: una línea de varios puntos, una sola entrada", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    clic(m, 100, 400);
    clic(m, 300, 380);
    expect(m.onCambio).not.toHaveBeenCalled();
    clic(m, 450, 460);
    clic(m, 450, 460);
    fireEvent.doubleClick(m.lienzo);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const l = lineas(m.ultima())[0];
    expect(l?.puntos).toHaveLength(3);
    expect(l?.puntos[1]?.x).toBeCloseTo(300, 0);
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
  });

  it("Enter también termina la línea", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "a" });
    clic(m, 100, 400);
    clic(m, 300, 380);
    clic(m, 450, 460);
    fireEvent.keyDown(m.lienzo, { key: "Enter" });
    expect(lineas(m.ultima())[0]?.puntos).toHaveLength(3);
    expect(lineas(m.ultima())[0]?.fin).toBe("flecha");
  });

  it("mientras se hace se ve la línea con el tramo hasta el cursor", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    clic(m, 100, 400);
    clic(m, 300, 380);
    puntero(m.lienzo, "pointermove", m.aPantalla(500, 450));
    const poli = document.querySelector("[data-capa=previa] polyline");
    expect(poli?.getAttribute("points")?.split(" ")).toHaveLength(3);
    expect(document.querySelectorAll("[data-capa=previa] circle")).toHaveLength(3);
  });

  it("Escape cancela la línea a medias sin crear nada y mantiene la herramienta", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    clic(m, 100, 400);
    clic(m, 300, 380);
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    fireEvent.keyDown(m.lienzo, { key: "Enter" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(herramienta("Línea").getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector("[data-capa=previa]")).toBeNull();
  });

  it("una línea de un solo punto no se crea; un doble clic repetido no suma un punto de más", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    clic(m, 100, 400);
    fireEvent.doubleClick(m.lienzo);
    expect(m.onCambio).not.toHaveBeenCalled();
    clic(m, 100, 400);
    clic(m, 300, 400);
    clic(m, 300, 400);
    fireEvent.keyDown(m.lienzo, { key: "Enter" });
    expect(lineas(m.ultima())[0]?.puntos).toHaveLength(2);
  });

  it("Mayús ajusta el ángulo a múltiplos de 15°", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    arrastrar(m, [200, 300], [500, 330], 6, { shiftKey: true }); // ≈ 5,7° → 0°
    const [a, b] = lineas(m.ultima())[0]?.puntos ?? [];
    expect(b?.y).toBeCloseTo(a?.y ?? 0, 1);
  });

  it("la línea creada se puede mover y editar como cualquier elemento (queda seleccionada)", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "l" });
    arrastrar(m, [150, 150], [450, 250]);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
    fireEvent.keyDown(m.lienzo, { key: "ArrowRight", shiftKey: true });
    expect(lineas(m.ultima())[0]?.puntos[0]?.x).toBeCloseTo(160, 0);
  });
});

describe("texto libre", () => {
  it("un clic abre el cuadro de texto; Enter lo crea, en el modelo y en el dibujo", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 300, 200);
    const caja = cuadroTexto();
    expect(document.activeElement).toBe(caja);
    fireEvent.change(caja, { target: { value: "Hola mundo" } });
    fireEvent.keyDown(caja, { key: "Enter" });
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const t = textos(m.ultima())[0];
    expect(t?.texto).toBe("Hola mundo");
    expect(t?.transformacion.x).toBeCloseTo(300, 0);
    expect(t?.transformacion.y).toBeCloseTo(200, 0);
    expect(document.querySelector("[data-dibujo-pagina]")?.parentElement?.textContent).toContain("Hola mundo");
    expect(herramienta("Seleccionar").getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(m.lienzo);
  });

  it("arrastrar define el ancho y el alto del cuadro", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    arrastrar(m, [200, 100], [440, 180]);
    fireEvent.change(cuadroTexto(), { target: { value: "Título" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    const t = textos(m.ultima())[0]?.transformacion;
    expect(t?.x).toBeCloseTo(200, 0);
    expect(t?.ancho).toBeCloseTo(240, 0);
    expect(t?.alto).toBeCloseTo(80, 0);
  });

  it("Escape cancela y no crea nada; un texto vacío tampoco se crea", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 300, 200);
    fireEvent.change(cuadroTexto(), { target: { value: "Se descarta" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Escape" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy(); // Escape del cuadro no cierra el editor

    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 300, 200);
    fireEvent.change(cuadroTexto(), { target: { value: "   " } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("Mayús+Enter no confirma (salta de línea) y perder el foco sí confirma", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 300, 200);
    const caja = cuadroTexto();
    fireEvent.change(caja, { target: { value: "Línea 1\nLínea 2" } });
    fireEvent.keyDown(caja, { key: "Enter", shiftKey: true });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeTruthy();
    fireEvent.blur(caja);
    expect(textos(m.ultima())[0]?.texto).toBe("Línea 1\nLínea 2");
  });

  it("crear el texto es una sola entrada de historial", () => {
    const m = montar();
    sinIman();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 300, 200);
    fireEvent.change(cuadroTexto(), { target: { value: "Hola" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.ultima().elementos).toHaveLength(0);
  });

  it("lo que se escribe no llega a los atajos ni al editor de diapositivas", () => {
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    const m = montar(escena(forma("a", 100, 100)));
    fireEvent.keyDown(m.lienzo, { key: "Tab" }); // `a` queda seleccionada
    fireEvent.keyDown(m.lienzo, { key: "t" });
    clic(m, 600, 400);
    const caja = cuadroTexto();
    for (const key of ["Delete", "Backspace", "v", "l", "ArrowLeft"]) fireEvent.keyDown(caja, { key });
    window.removeEventListener("keydown", alWindow);
    expect(alWindow).not.toHaveBeenCalled();
    expect(herramienta("Texto").getAttribute("aria-pressed")).toBe("true"); // la «v» del cuadro no cambió de herramienta
    expect(m.onCambio).not.toHaveBeenCalled(); // y Supr no borró la forma
  });
});

describe("escribir dentro de un elemento (doble clic)", () => {
  const rombo = () => escena(forma("r", 300, 200, 200, 120, { forma: "rombo", texto: "Antes" }), forma("v", 700, 100, 100, 80));

  it("doble clic sobre una forma abre el cuadro con su texto, sobre la zona de texto de la forma", () => {
    const m = montar(rombo());
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    const caja = cuadroTexto();
    expect(caja.value).toBe("Antes");
    const contenedor = caja.parentElement as HTMLElement;
    // Zona de texto del rombo: más chica que su caja (200 × 120).
    expect(parseFloat(contenedor.style.width)).toBeGreaterThan(0);
    expect(parseFloat(contenedor.style.width)).toBeLessThan(200 * 1.5);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toContain("1 seleccionado");
  });

  it("Enter guarda el texto nuevo en el modelo y en el dibujo, como UNA entrada de historial", () => {
    const m = montar(rombo());
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    fireEvent.change(cuadroTexto(), { target: { value: "Después" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(formas(m.ultima()).find((f) => f.id === "r")?.texto).toBe("Después");
    expect(document.querySelector("[data-elemento-id=r]")?.textContent).toContain("Después");
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(formas(m.ultima()).find((f) => f.id === "r")?.texto).toBe("Antes");
  });

  it("Escape no cambia nada; confirmar sin cambios tampoco confirma al bloque", () => {
    const m = montar(rombo());
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    fireEvent.change(cuadroTexto(), { target: { value: "Otra cosa" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Escape" });
    expect(m.onCambio).not.toHaveBeenCalled();
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("se puede borrar el texto de una forma y escribir en una que no tenía", () => {
    const m = montar(rombo());
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    fireEvent.change(cuadroTexto(), { target: { value: "" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(formas(m.ultima()).find((f) => f.id === "r")?.texto ?? "").toBe("");
    fireEvent.doubleClick(m.lienzo, m.aPantalla(750, 140));
    fireEvent.change(cuadroTexto(), { target: { value: "Nuevo" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(formas(m.ultima()).find((f) => f.id === "v")?.texto).toBe("Nuevo");
  });

  it("vaciar un cuadro de texto existente lo elimina (no queda un «Texto» por defecto), y se puede deshacer", () => {
    const m = montar(
      normalizarEscena({ ancho: 1000, alto: 600, elementos: [{ id: "t", tipo: "texto", texto: "Hola", transformacion: { x: 100, y: 100, ancho: 200, alto: 40, rotacion: 0 } }] }),
    );
    fireEvent.doubleClick(m.lienzo, m.aPantalla(150, 120));
    fireEvent.change(cuadroTexto(), { target: { value: "  " } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    expect(m.ultima().elementos).toHaveLength(0);
    expect(document.querySelector("[data-dibujo-anuncio]")?.textContent).toBe("Cuadro de texto vacío eliminado.");
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(textos(m.ultima())[0]?.texto).toBe("Hola");
  });

  it("doble clic en una línea escribe su rótulo", () => {
    const m = montar(escena(linea("l", [[100, 300], [500, 300]])));
    fireEvent.doubleClick(m.lienzo, m.aPantalla(300, 302));
    fireEvent.change(cuadroTexto(), { target: { value: "Sí" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(lineas(m.ultima())[0]?.texto).toBe("Sí");
  });

  it("no abre nada en el vacío ni en un elemento bloqueado", () => {
    const m = montar(escena(forma("fija", 300, 200, 200, 120, { bloqueado: true, texto: "No" }), forma("a", 700, 100)));
    fireEvent.doubleClick(m.lienzo, m.aPantalla(900, 500));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });

  it("un elemento de un grupo se edita por su cuenta con doble clic", () => {
    const m = montar(escena(forma("a", 100, 100, 100, 80, { texto: "Uno" }), forma("b", 400, 100, 100, 80), { id: "g", tipo: "grupo", hijos: ["a", "b"] }));
    fireEvent.doubleClick(m.lienzo, m.aPantalla(150, 140));
    expect(cuadroTexto().value).toBe("Uno");
  });

  it("con otra herramienta activa, el doble clic no abre el cuadro", () => {
    const m = montar(rombo());
    insertar("Rombo");
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });

  it("el cuadro respeta el giro de la forma", () => {
    const m = montar(escena(forma("r", 300, 200, 200, 120, { texto: "Gira", transformacion: { x: 300, y: 200, ancho: 200, alto: 120, rotacion: 30 } })));
    fireEvent.doubleClick(m.lienzo, m.aPantalla(400, 260));
    expect((cuadroTexto().parentElement as HTMLElement).style.transform).toBe("rotate(30deg)");
  });
});
