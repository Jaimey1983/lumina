import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMAS, type Escena, type Forma, type Texto } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { centroSinTapar } from "./herramientas.js";
import { botonCinta, escena, forma, irAPestana } from "./util-pruebas.js";

afterEach(() => cleanup());

const AREA = { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0 };

function montar(e: Escena = escena()) {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  // En jsdom el lienzo mide 0×0: se le da un área para saber cuándo el puntero está encima.
  lienzo.getBoundingClientRect = () => ({ ...AREA, toJSON: () => AREA }) as DOMRect;
  fireEvent.click(botonCinta("Imantar a otros elementos")); // el imán no mueve lo que se coloca
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  const pant = (x: number, y: number) => {
    const v = vista();
    return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
  };
  const evento = (el: Element | Window, tipo: string, p: { clientX: number; clientY: number }, extra: MouseEventInit = {}): void => {
    fireEvent(el, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
  };
  return {
    onCambio,
    onCerrar,
    lienzo,
    vista,
    pant,
    evento,
    cuenta: () => onCambio.mock.calls.length,
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    clic: (x: number, y: number, extra: MouseEventInit = {}) => {
      evento(lienzo, "pointerdown", pant(x, y), extra);
      evento(lienzo, "pointerup", pant(x, y), extra);
    },
  };
}
type M = ReturnType<typeof montar>;

const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const textos = (e: Escena): Texto[] => e.elementos.filter((x): x is Texto => x.tipo === "texto");
const centroDe = (f: Forma) => ({ x: f.transformacion.x + f.transformacion.ancho / 2, y: f.transformacion.y + f.transformacion.alto / 2 });
const galeria = (nombre: string): HTMLButtonElement => {
  irAPestana("Insertar");
  return screen.getByRole("button", { name: `Insertar ${nombre}` }) as HTMLButtonElement;
};
const herramienta = (nombre: string): HTMLButtonElement => botonCinta(nombre);
const fantasma = (): Element | null => document.querySelector('[data-capa="fantasma-forma"]');
const cuadroTexto = (): HTMLTextAreaElement => screen.getByRole("textbox", { name: "Texto del elemento" }) as HTMLTextAreaElement;
const activa = (b: HTMLElement): boolean => b.getAttribute("aria-pressed") === "true";

/** Aprieta el botón de la galería y mueve el puntero por el lienzo hasta `(x, y)` sin soltar. */
function arrastrarDesdeGaleria(m: M, boton: HTMLElement, x: number, y: number): void {
  const origen = boton.getBoundingClientRect();
  m.evento(boton, "pointerdown", { clientX: origen.left + 5, clientY: origen.top + 5 });
  m.evento(m.lienzo, "pointermove", m.pant(x - 30, y - 30));
  m.evento(m.lienzo, "pointermove", m.pant(x, y));
}

describe("Y11 — arrastrar desde la galería de formas", () => {
  it("soltar sobre el lienzo crea UNA forma por defecto centrada en el punto, una entrada de historial y sigue en Seleccionar", () => {
    const m = montar();
    const rect = galeria("Rectángulo");
    arrastrarDesdeGaleria(m, rect, 300, 200);
    m.evento(m.lienzo, "pointerup", m.pant(300, 200));
    expect(formas(m.ultima())).toHaveLength(1);
    expect(m.cuenta()).toBe(1);
    const f = formas(m.ultima())[0] as Forma;
    expect(f.forma).toBe("rectangulo");
    expect(f.transformacion.ancho).toBe(FORMAS.rectangulo.tamano.ancho);
    expect(f.transformacion.alto).toBe(FORMAS.rectangulo.tamano.alto);
    expect(centroDe(f).x).toBeCloseTo(300, 0);
    expect(centroDe(f).y).toBeCloseTo(200, 0);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
    // Una sola entrada de historial: un Ctrl+Z la quita.
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(formas(m.ultima())).toHaveLength(0);
  });

  it("mientras se arrastra sobre el lienzo hay una forma fantasma bajo el cursor; al soltar no queda residuo", () => {
    const m = montar();
    const boton = galeria("Elipse");
    const origen = boton.getBoundingClientRect();
    m.evento(boton, "pointerdown", { clientX: origen.left + 5, clientY: origen.top + 5 });
    expect(fantasma()).toBeNull(); // todavía no se movió
    m.evento(m.lienzo, "pointermove", { clientX: origen.left + 6, clientY: origen.top + 6 });
    expect(fantasma()).toBeNull(); // menos que el umbral: sigue siendo un clic
    m.evento(m.lienzo, "pointermove", m.pant(300, 200));
    expect(fantasma()?.getAttribute("data-forma")).toBe("elipse");
    m.evento(m.lienzo, "pointermove", m.pant(500, 300));
    expect(document.querySelectorAll('[data-capa="fantasma-forma"]')).toHaveLength(1);
    m.evento(m.lienzo, "pointerup", m.pant(500, 300));
    expect(fantasma()).toBeNull();
  });

  it("Escape cancela: no queda fantasma, soltar después no crea nada y el editor no se cierra", () => {
    const m = montar();
    arrastrarDesdeGaleria(m, galeria("Rombo"), 300, 200);
    expect(fantasma()).not.toBeNull();
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(fantasma()).toBeNull();
    m.evento(m.lienzo, "pointerup", m.pant(300, 200));
    expect(m.cuenta()).toBe(0);
    expect(m.onCerrar).not.toHaveBeenCalled();
  });

  it("soltar fuera del lienzo no crea nada ni deja fantasma", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    arrastrarDesdeGaleria(m, boton, 300, 200);
    expect(fantasma()).not.toBeNull();
    m.evento(m.lienzo, "pointermove", { clientX: 1500, clientY: 300 }); // a la derecha del lienzo
    expect(fantasma()).toBeNull();
    m.evento(m.lienzo, "pointerup", { clientX: 1500, clientY: 300 });
    expect(m.cuenta()).toBe(0);
  });

  it("después de soltar, mover el puntero por el lienzo no devuelve el fantasma ni crea nada", () => {
    const m = montar();
    arrastrarDesdeGaleria(m, galeria("Rectángulo"), 300, 200);
    m.evento(m.lienzo, "pointerup", m.pant(300, 200));
    m.evento(m.lienzo, "pointermove", m.pant(500, 300));
    expect(fantasma()).toBeNull();
    m.evento(m.lienzo, "pointerup", m.pant(500, 300));
    expect(m.cuenta()).toBe(1);
  });

  it("un clic en la galería, sin arrastrar, sigue eligiendo la herramienta y no crea nada", () => {
    const m = montar();
    const boton = galeria("Triángulo");
    const origen = boton.getBoundingClientRect();
    m.evento(boton, "pointerdown", { clientX: origen.left, clientY: origen.top });
    m.evento(boton, "pointerup", { clientX: origen.left, clientY: origen.top });
    fireEvent.click(boton);
    expect(activa(boton)).toBe(true);
    expect(m.cuenta()).toBe(0);
    m.clic(300, 200);
    expect(formas(m.ultima())).toHaveLength(1); // el clic simple en el lienzo la coloca con el tamaño por defecto
  });

  it("el botón derecho no inicia el arrastre", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    m.evento(boton, "pointerdown", { clientX: 5, clientY: 5 }, { button: 2 });
    m.evento(m.lienzo, "pointermove", m.pant(300, 200));
    expect(fantasma()).toBeNull();
    m.evento(m.lienzo, "pointerup", m.pant(300, 200));
    expect(m.cuenta()).toBe(0);
  });

  it("soltar con una línea a medio hacer no deja la línea colgada", () => {
    const m = montar();
    fireEvent.click(herramienta("Línea"));
    m.clic(100, 100); // empieza una línea de varios puntos
    m.evento(m.lienzo, "pointermove", m.pant(250, 150));
    expect(document.querySelector('[data-capa="previa"]')).not.toBeNull(); // la línea en curso se ve
    arrastrarDesdeGaleria(m, galeria("Rectángulo"), 400, 300);
    m.evento(m.lienzo, "pointerup", m.pant(400, 300));
    expect(formas(m.ultima())).toHaveLength(1);
    expect(document.querySelector('[data-capa="previa"]')).toBeNull();
    expect(m.ultima().elementos.filter((x) => x.tipo === "linea")).toHaveLength(0);
  });
});

describe("Y11 — herramienta de un solo uso o fija", () => {
  it("sin fijar, tras crear la herramienta vuelve a Seleccionar", () => {
    const m = montar();
    fireEvent.click(galeria("Rectángulo"));
    m.clic(200, 150);
    expect(formas(m.ultima())).toHaveLength(1);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
    m.clic(500, 300); // ya no crea: solo selecciona/deselecciona
    expect(formas(m.ultima())).toHaveLength(1);
  });

  it("con Mayús al elegirla queda fija: cada clic crea otra y la herramienta sigue activa", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.click(boton, { shiftKey: true });
    expect(boton.hasAttribute("data-fija")).toBe(true);
    m.clic(200, 150);
    m.clic(500, 150);
    m.clic(200, 400);
    expect(formas(m.ultima())).toHaveLength(3);
    expect(m.cuenta()).toBe(3); // una entrada de historial por forma
    expect(activa(boton)).toBe(true);
    expect(boton.hasAttribute("data-fija")).toBe(true);
  });

  it("el doble clic en su botón también la deja fija", () => {
    const m = montar();
    const boton = galeria("Elipse");
    fireEvent.click(boton);
    fireEvent.click(boton);
    fireEvent.doubleClick(boton);
    expect(boton.hasAttribute("data-fija")).toBe(true);
    m.clic(200, 150);
    m.clic(500, 150);
    expect(formas(m.ultima())).toHaveLength(2);
    expect(activa(boton)).toBe(true);
  });

  it("la fija persiste hasta elegir otra herramienta, y entonces se suelta", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.click(boton, { shiftKey: true });
    m.clic(200, 150);
    fireEvent.click(herramienta("Seleccionar"));
    expect(galeria("Rectángulo").hasAttribute("data-fija")).toBe(false);
    m.clic(500, 300);
    expect(formas(m.ultima())).toHaveLength(1);
    // Volver a elegir la misma forma, sin Mayús, ya no es fija.
    fireEvent.click(galeria("Rectángulo"));
    m.clic(600, 100);
    expect(formas(m.ultima())).toHaveLength(2);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
  });

  it("Escape saca de la herramienta fija", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.click(boton, { shiftKey: true });
    m.lienzo.focus();
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(boton.hasAttribute("data-fija")).toBe(false);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
    m.clic(200, 150);
    expect(m.cuenta()).toBe(0);
  });

  it("también vale para Línea y Texto: fija la línea, crea dos seguidas", () => {
    const m = montar();
    const linea = herramienta("Línea");
    fireEvent.click(linea, { shiftKey: true });
    for (const y of [100, 300]) {
      m.evento(m.lienzo, "pointerdown", m.pant(100, y));
      m.evento(m.lienzo, "pointermove", m.pant(300, y));
      m.evento(m.lienzo, "pointermove", m.pant(400, y));
      m.evento(m.lienzo, "pointerup", m.pant(400, y));
    }
    expect(m.ultima().elementos.filter((x) => x.tipo === "linea")).toHaveLength(2);
    expect(activa(linea)).toBe(true);
  });

  it("Seleccionar nunca queda «fija» aunque se elija con Mayús", () => {
    montar();
    const sel = herramienta("Seleccionar");
    fireEvent.click(sel, { shiftKey: true });
    fireEvent.doubleClick(sel);
    expect(sel.hasAttribute("data-fija")).toBe(false);
  });
});

describe("Y11 — doble clic en un vacío crea un cuadro de texto", () => {
  it("abre el cuadro en el punto, y al escribir crea exactamente UN texto con UNA entrada de historial", () => {
    const m = montar();
    fireEvent.doubleClick(m.lienzo, m.pant(300, 200));
    const caja = cuadroTexto();
    expect(caja.value).toBe("");
    expect(document.activeElement).toBe(caja);
    fireEvent.change(caja, { target: { value: "Hola" } });
    fireEvent.keyDown(caja, { key: "Enter" });
    expect(textos(m.ultima())).toHaveLength(1);
    const t = textos(m.ultima())[0] as Texto;
    expect(t.texto).toBe("Hola");
    expect(t.transformacion.x).toBeCloseTo(300, 0);
    expect(t.transformacion.y).toBeCloseTo(200, 0);
    expect(m.cuenta()).toBe(1);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
  });

  it("si no se escribe nada o se cancela con Escape, no se crea nada", () => {
    const m = montar();
    fireEvent.doubleClick(m.lienzo, m.pant(300, 200));
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    fireEvent.doubleClick(m.lienzo, m.pant(500, 200));
    fireEvent.change(cuadroTexto(), { target: { value: "borrador" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Escape" });
    expect(m.cuenta()).toBe(0);
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });

  it("sobre una forma abre el texto de ESA forma y no crea un cuadro nuevo", () => {
    const m = montar(escena(forma("a", 100, 100, 200, 120, { texto: "Uno" })));
    fireEvent.doubleClick(m.lienzo, m.pant(200, 160));
    expect(cuadroTexto().value).toBe("Uno");
    fireEvent.change(cuadroTexto(), { target: { value: "Dos" } });
    fireEvent.keyDown(cuadroTexto(), { key: "Enter" });
    expect(textos(m.ultima())).toHaveLength(0);
    expect(formas(m.ultima())).toHaveLength(1);
  });

  it("con una edición ya abierta, otro doble clic en un vacío no abre una segunda", () => {
    const m = montar();
    fireEvent.doubleClick(m.lienzo, m.pant(300, 200));
    fireEvent.change(cuadroTexto(), { target: { value: "primero" } });
    fireEvent.doubleClick(m.lienzo, m.pant(600, 400));
    expect(screen.getAllByRole("textbox", { name: "Texto del elemento" })).toHaveLength(1);
    expect(cuadroTexto().value).toBe("primero");
  });

  it("sobre un elemento bloqueado no crea un texto nuevo encima", () => {
    const m = montar(escena(forma("fija", 300, 200, 200, 120, { bloqueado: true })));
    fireEvent.doubleClick(m.lienzo, m.pant(400, 260));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
    // Fuera de él, sí.
    fireEvent.doubleClick(m.lienzo, m.pant(800, 500));
    expect(cuadroTexto().value).toBe("");
  });

  it("con otra herramienta activa el doble clic no crea texto", () => {
    const m = montar();
    fireEvent.click(galeria("Rectángulo"));
    fireEvent.doubleClick(m.lienzo, m.pant(300, 200));
    expect(screen.queryByRole("textbox", { name: "Texto del elemento" })).toBeNull();
  });
});

describe("Y11 — teclado: Enter sobre una forma de la galería la coloca al centro de la vista", () => {
  it("crea UNA forma centrada en lo que se ve, deja la herramienta en Seleccionar y no elige la herramienta", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    boton.focus();
    // Se cancela el Enter por defecto: si no, el navegador también «haría clic» y elegiría la herramienta.
    expect(fireEvent.keyDown(boton, { key: "Enter" })).toBe(false);
    expect(formas(m.ultima())).toHaveLength(1);
    expect(m.cuenta()).toBe(1);
    const v = m.vista();
    const f = formas(m.ultima())[0] as Forma;
    // El centro de la vista (ventana de 1000×600 por defecto) pasado a coordenadas de escena.
    expect(centroDe(f).x).toBeCloseTo((500 - v.x) / v.z, 0);
    expect(centroDe(f).y).toBeCloseTo((300 - v.y) / v.z, 0);
    expect(activa(herramienta("Seleccionar"))).toBe(true);
    expect(activa(boton)).toBe(false);
    expect(document.querySelector('[role="status"], [aria-live]')?.textContent ?? "").toContain("agregado");
  });

  it("una segunda forma igual no queda encima de la primera: baja en diagonal", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.keyDown(boton, { key: "Enter" });
    fireEvent.keyDown(boton, { key: "Enter" });
    fireEvent.keyDown(boton, { key: "Enter" });
    const fs = formas(m.ultima());
    expect(fs).toHaveLength(3);
    const [a, b, c] = fs as [Forma, Forma, Forma];
    expect(centroDe(b).x - centroDe(a).x).toBeCloseTo(20, 5);
    expect(centroDe(b).y - centroDe(a).y).toBeCloseTo(20, 5);
    expect(centroDe(c).x - centroDe(b).x).toBeCloseTo(20, 5);
    expect(m.cuenta()).toBe(3);
  });

  it("respeta el desplazamiento de la vista: se centra en lo que se ve, no en el centro de la página", () => {
    const m = montar();
    const lienzo = m.lienzo;
    // Se desplaza la vista con la rueda (sin Ctrl desplaza).
    fireEvent.wheel(lienzo, { deltaX: 0, deltaY: 300 });
    const boton = galeria("Rectángulo");
    fireEvent.keyDown(boton, { key: "Enter" });
    const v = m.vista();
    const f = formas(m.ultima())[0] as Forma;
    expect(centroDe(f).y).toBeCloseTo((300 - v.y) / v.z, 0);
  });

  it("Ctrl+Enter, Alt+Enter y la barra espaciadora no colocan nada", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.keyDown(boton, { key: "Enter", ctrlKey: true });
    fireEvent.keyDown(boton, { key: "Enter", altKey: true });
    fireEvent.keyDown(boton, { key: " " });
    expect(m.cuenta()).toBe(0);
  });

  it("el clic de ratón sigue eligiendo la herramienta (no coloca al centro)", () => {
    const m = montar();
    const boton = galeria("Rectángulo");
    fireEvent.click(boton);
    expect(activa(boton)).toBe(true);
    expect(m.cuenta()).toBe(0);
  });
});

describe("centroSinTapar", () => {
  it("devuelve el centro pedido si no hay una forma en esa posición y baja de 20 en 20 si la hay", () => {
    const c = { x: 500, y: 300 };
    const vacia = escena();
    expect(centroSinTapar(vacia, "rectangulo", c)).toEqual(c);
    const { ancho, alto } = FORMAS.rectangulo.tamano;
    const ocupada = escena(forma("a", c.x - ancho / 2, c.y - alto / 2, ancho, alto));
    expect(centroSinTapar(ocupada, "rectangulo", c)).toEqual({ x: 520, y: 320 });
    const dos = escena(forma("a", c.x - ancho / 2, c.y - alto / 2, ancho, alto), forma("b", c.x + 20 - ancho / 2, c.y + 20 - alto / 2, ancho, alto));
    expect(centroSinTapar(dos, "rectangulo", c)).toEqual({ x: 540, y: 340 });
  });

  it("otra forma en esa posición pero de otro tamaño no cuenta como ocupada para la de por defecto", () => {
    const c = { x: 500, y: 300 };
    const { ancho, alto } = FORMAS.rectangulo.tamano;
    // Misma esquina superior izquierda = misma posición: sí cuenta (se compara la posición).
    const e = escena(forma("a", c.x - ancho / 2, c.y - alto / 2, 10, 10));
    expect(centroSinTapar(e, "rectangulo", c)).toEqual({ x: 520, y: 320 });
    // Otra posición: libre.
    const libre = escena(forma("a", c.x - ancho / 2 + 1, c.y - alto / 2, ancho, alto));
    expect(centroSinTapar(libre, "rectangulo", c)).toEqual(c);
  });
});
