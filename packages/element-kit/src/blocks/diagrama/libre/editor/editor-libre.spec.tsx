import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizarEscena, type Escena } from "@lumina/drawing";
import { EditorLibre, describirSeleccion } from "./editor-libre.js";
import { EditorLibreModal } from "./editor-libre-modal.js";
import { botonCinta, deshabilitado, escena, forma, getForma, grupo, ids } from "./util-pruebas.js";

afterEach(() => cleanup());

interface Montado {
  onCambio: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  onCerrar: ReturnType<typeof vi.fn<(e: Escena) => void>>;
  lienzo: SVGSVGElement;
  /** Punto de la escena → coordenadas de pantalla (jsdom: el lienzo está en 0,0). */
  aPantalla: (x: number, y: number) => { clientX: number; clientY: number };
  zoom: () => number;
  ultima: () => Escena;
}

function montar(e: Escena): Montado {
  const onCambio = vi.fn<(e: Escena) => void>();
  const onCerrar = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={onCerrar} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  return {
    onCambio,
    onCerrar,
    lienzo,
    aPantalla: (x, y) => {
      const v = vista();
      return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
    },
    zoom: () => vista().z,
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
  };
}

const puntero = (el: Element, tipo: "pointerdown" | "pointermove" | "pointerup", p: { clientX: number; clientY: number }, extra: MouseEventInit = {}): void => {
  fireEvent(el, new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, ...p, ...extra }));
};

function arrastrar(m: Montado, desde: [number, number], hasta: [number, number], pasos = 10, extra: MouseEventInit = {}): void {
  puntero(m.lienzo, "pointerdown", m.aPantalla(...desde), extra);
  for (let i = 1; i <= pasos; i++) {
    puntero(m.lienzo, "pointermove", m.aPantalla(desde[0] + ((hasta[0] - desde[0]) * i) / pasos, desde[1] + ((hasta[1] - desde[1]) * i) / pasos), extra);
  }
  puntero(m.lienzo, "pointerup", m.aPantalla(...hasta), extra);
}

const base = () => escena(forma("a", 100, 100, 200, 100), forma("b", 500, 100, 200, 100), forma("c", 100, 350, 200, 100));
const estado = () => screen.getByText(/elementos?|Lienzo vacío/, { selector: "[data-dibujo-estado]" }).textContent ?? "";

describe("apertura", () => {
  it("es un diálogo modal con nombre, cinta, barra de acceso rápido y un lienzo enfocable", () => {
    montar(base());
    const dialogo = screen.getByRole("dialog", { name: "Editor de dibujo: Prueba" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(within(dialogo).getByRole("tablist", { name: "Cinta de opciones" })).toBeTruthy();
    expect(within(dialogo).getByRole("toolbar", { name: "Acceso rápido" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("application"));
    expect(estado()).toBe("3 elementos");
  });

  it("muestra el dibujo y las instrucciones para lectores de pantalla", () => {
    montar(base());
    expect(document.querySelectorAll("[data-elemento-id]").length).toBe(3);
    expect(screen.getByRole("application").getAttribute("aria-describedby")).toBeTruthy();
  });

  it("una escena inválida se normaliza al abrir y un lienzo vacío se dice", () => {
    render(<EditorLibre escena={{ basura: true } as unknown as Escena} onCambio={() => undefined} onCerrar={() => undefined} />);
    expect(estado()).toBe("Lienzo vacío");
  });

  it("sin cambios todavía, deshacer y rehacer están deshabilitados", () => {
    montar(base());
    expect(deshabilitado(botonCinta("Deshacer"))).toBe(true);
    expect(deshabilitado(botonCinta("Rehacer"))).toBe(true);
  });
});

describe("selección", () => {
  it("un clic elige el elemento, muestra 8 asas y la de rotar, y lo anuncia", () => {
    const m = montar(base());
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerup", m.aPantalla(200, 150));
    expect(estado()).toBe("3 elementos · 1 seleccionado");
    expect(document.querySelectorAll("[data-asa]").length).toBe(9);
    expect(document.querySelector("[data-asa=rotar]")).toBeTruthy();
    expect(document.querySelector("[data-dibujo-anuncio]")?.textContent).toBe("Rectángulo, seleccionado.");
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("clic en el vacío deselecciona", () => {
    const m = montar(base());
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerup", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerdown", m.aPantalla(900, 550));
    puntero(m.lienzo, "pointerup", m.aPantalla(900, 550));
    expect(estado()).toBe("3 elementos");
    expect(document.querySelectorAll("[data-asa]").length).toBe(0);
  });

  it("Mayús suma otro elemento y quita uno ya elegido", () => {
    const m = montar(base());
    const clic = (x: number, y: number, shiftKey: boolean) => {
      puntero(m.lienzo, "pointerdown", m.aPantalla(x, y), { shiftKey });
      puntero(m.lienzo, "pointerup", m.aPantalla(x, y), { shiftKey });
    };
    clic(200, 150, false);
    clic(600, 150, true);
    expect(estado()).toContain("2 seleccionados");
    clic(200, 150, true);
    expect(estado()).toContain("1 seleccionado");
  });

  it("clic sin arrastrar sobre un elemento de una selección múltiple deja solo ese", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(estado()).toContain("3 seleccionados");
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerup", m.aPantalla(200, 150));
    expect(estado()).toContain("1 seleccionado");
  });

  it("el recuadro selecciona lo que queda dentro", () => {
    const m = montar(base());
    arrastrar(m, [50, 50], [750, 250]);
    expect(estado()).toContain("2 seleccionados");
    expect(m.onCambio).not.toHaveBeenCalled(); // seleccionar no es un cambio
  });

  it("Tab recorre los elementos y lo anuncia; Mayús+Tab va hacia atrás", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    // Y35: el anuncio de `Tab` dice además cuál es de cuántos.
    expect(document.querySelector("[data-dibujo-anuncio]")?.textContent).toBe("Rectángulo, seleccionado, 1 de 3.");
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.keyDown(m.lienzo, { key: "Tab", shiftKey: true });
    expect(estado()).toContain("1 seleccionado");
  });

  it("describirSeleccion", () => {
    const e = normalizarEscena({ elementos: [{ id: "t", tipo: "texto", texto: "Hola" }, { id: "f", tipo: "forma", forma: "rombo", texto: "¿Sí?" }] });
    expect(describirSeleccion(e, [])).toBe("Nada seleccionado.");
    expect(describirSeleccion(e, ["t"])).toBe("Texto «Hola», seleccionado.");
    expect(describirSeleccion(e, ["f"])).toBe("Rombo «¿Sí?», seleccionado.");
    expect(describirSeleccion(e, ["t", "f"])).toBe("2 elementos seleccionados.");
  });
});

describe("mover, redimensionar y rotar", () => {
  it("arrastrar mueve el elemento y confirma UNA sola vez, por muchos fotogramas que haya", () => {
    const m = montar(base());
    arrastrar(m, [200, 150], [260, 190], 40);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const t = getForma(m.ultima(), "a").transformacion;
    expect(t.x).toBeCloseTo(160, 0);
    expect(t.y).toBeCloseTo(140, 0);
    expect(getForma(m.ultima(), "b")).toEqual(getForma(base(), "b"));
  });

  it("un clic con un temblor menor al umbral no mueve nada", () => {
    const m = montar(base());
    fireEvent.click(botonCinta("Imantar a otros elementos")); // el imán podría devolverlo a su sitio y ocultar el fallo
    arrastrar(m, [200, 150], [202, 152], 2);
    expect(m.onCambio).not.toHaveBeenCalled();
    arrastrar(m, [200, 150], [212, 152], 2);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Z deshace el gesto entero y Ctrl+Y lo rehace", () => {
    const m = montar(base());
    arrastrar(m, [200, 150], [300, 250], 20);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
    const movida = m.ultima();
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    expect(m.ultima()).toEqual(base());
    fireEvent.keyDown(m.lienzo, { key: "y", ctrlKey: true });
    expect(m.ultima()).toEqual(movida);
    // Sin nada más que deshacer, otro Ctrl+Z no confirma nada.
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    expect(m.onCambio).toHaveBeenCalledTimes(4);
  });

  it("arrastrar el asa este redimensiona; el lado opuesto no se mueve", () => {
    const m = montar(base());
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerup", m.aPantalla(200, 150));
    arrastrar(m, [300, 150], [380, 150], 8);
    const t = getForma(m.ultima(), "a").transformacion;
    expect(t.x).toBeCloseTo(100, 0);
    expect(t.ancho).toBeCloseTo(280, 0);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("arrastrar el asa de rotar gira la forma", () => {
    const m = montar(base());
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointerup", m.aPantalla(200, 150));
    const asa = document.querySelector("[data-asa=rotar]") as SVGElement;
    const cx = Number(asa.getAttribute("cx"));
    const cy = Number(asa.getAttribute("cy"));
    // Llevar el asa (arriba del centro) a la derecha del centro: un cuarto de vuelta.
    const centro = m.aPantalla(200, 150);
    puntero(m.lienzo, "pointerdown", { clientX: cx, clientY: cy });
    for (let i = 1; i <= 10; i++) puntero(m.lienzo, "pointermove", { clientX: centro.clientX + (i / 10) * 120, clientY: cy + (i / 10) * (centro.clientY - cy) });
    puntero(m.lienzo, "pointerup", { clientX: centro.clientX + 120, clientY: centro.clientY });
    expect(getForma(m.ultima(), "a").transformacion.rotacion).toBeCloseTo(90, 0);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("lo bloqueado no se arrastra", () => {
    const m = montar(escena(forma("f", 100, 100, 200, 100, { bloqueado: true }), forma("g", 500, 100)));
    arrastrar(m, [200, 150], [300, 250]);
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("la selección múltiple se mueve junta", () => {
    const m = montar(base());
    fireEvent.click(botonCinta("Imantar a otros elementos")); // sin imán: se compara el desplazamiento exacto
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    arrastrar(m, [200, 150], [230, 180], 6);
    const final = m.ultima();
    for (const id of ["a", "b", "c"]) {
      expect(getForma(final, id).transformacion.x).toBeCloseTo(getForma(base(), id).transformacion.x + 30, 0);
      expect(getForma(final, id).transformacion.y).toBeCloseTo(getForma(base(), id).transformacion.y + 30, 0);
    }
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("Escape durante el arrastre lo cancela y no confirma nada", () => {
    const m = montar(base());
    puntero(m.lienzo, "pointerdown", m.aPantalla(200, 150));
    puntero(m.lienzo, "pointermove", m.aPantalla(260, 190));
    puntero(m.lienzo, "pointermove", m.aPantalla(300, 230));
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    puntero(m.lienzo, "pointerup", m.aPantalla(300, 230));
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeTruthy(); // y no cerró el editor
  });
});

describe("teclado", () => {
  it("las flechas mueven 1 unidad y con Mayús 10; cada pulsación confirma una vez", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.keyDown(m.lienzo, { key: "ArrowRight" });
    fireEvent.keyDown(m.lienzo, { key: "ArrowDown", shiftKey: true });
    expect(m.onCambio).toHaveBeenCalledTimes(2);
    expect(getForma(m.ultima(), "a").transformacion).toMatchObject({ x: 101, y: 110 });
  });

  it("Supr elimina, Ctrl+D duplica, Ctrl+G agrupa y Ctrl+Mayús+G desagrupa", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.keyDown(m.lienzo, { key: "g", ctrlKey: true });
    expect(m.ultima().elementos.filter((x) => x.tipo === "grupo")).toHaveLength(1);
    fireEvent.keyDown(m.lienzo, { key: "g", ctrlKey: true, shiftKey: true });
    expect(m.ultima().elementos.filter((x) => x.tipo === "grupo")).toHaveLength(0);
    fireEvent.keyDown(m.lienzo, { key: "d", ctrlKey: true });
    expect(ids(m.ultima())).toHaveLength(6);
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    expect(ids(m.ultima())).toHaveLength(3);
    expect(estado()).toBe("3 elementos");
  });

  it("nada de lo que se teclea llega al editor de diapositivas (listeners de window)", () => {
    const alWindow = vi.fn();
    window.addEventListener("keydown", alWindow);
    const m = montar(base());
    for (const key of ["Delete", "ArrowLeft", "Tab", "x"]) fireEvent.keyDown(m.lienzo, { key });
    fireEvent.keyDown(m.lienzo, { key: "z", ctrlKey: true });
    window.removeEventListener("keydown", alWindow);
    expect(alWindow).not.toHaveBeenCalled();
  });

  it("Escape deselecciona y, sin selección, cierra devolviendo la escena", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(estado()).toBe("3 elementos");
    expect(m.onCerrar).not.toHaveBeenCalled();
    fireEvent.keyDown(m.lienzo, { key: "Escape" });
    expect(m.onCerrar).toHaveBeenCalledTimes(1);
  });

  it("cerrar con «Listo» entrega la escena con todos los cambios", () => {
    const m = montar(base());
    arrastrar(m, [200, 150], [250, 150], 5);
    fireEvent.click(screen.getByRole("button", { name: /Listo/ }));
    expect(m.onCerrar).toHaveBeenCalledTimes(1);
    expect(m.onCerrar.mock.calls[0]?.[0]).toEqual(m.ultima());
  });
});

describe("barra de herramientas", () => {
  it("los botones se habilitan según la selección", () => {
    const m = montar(base());
    const boton = (n: string) => botonCinta(n);
    expect(deshabilitado(boton("Duplicar"))).toBe(true);
    expect(deshabilitado(boton("Agrupar"))).toBe(true);
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    expect(deshabilitado(boton("Duplicar"))).toBe(false);
    expect(deshabilitado(boton("Agrupar"))).toBe(true);
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(deshabilitado(boton("Agrupar"))).toBe(false);
    expect(deshabilitado(boton("Distribuir horizontalmente"))).toBe(false);
  });

  it("alinear desde la barra confirma un cambio", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    fireEvent.click(botonCinta("Alinear a la izquierda"));
    expect(getForma(m.ultima(), "b").transformacion.x).toBe(100);
    expect(m.onCambio).toHaveBeenCalledTimes(1);
  });

  it("subir, bajar, frente y fondo cambian el apilado", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.click(botonCinta("Traer al frente"));
    expect(ids(m.ultima())).toEqual(["b", "c", "a"]);
    fireEvent.click(botonCinta("Enviar al fondo"));
    expect(ids(m.ultima())).toEqual(["a", "b", "c"]);
  });

  it("deshacer y rehacer desde la barra", () => {
    const m = montar(base());
    fireEvent.keyDown(m.lienzo, { key: "Tab" });
    fireEvent.keyDown(m.lienzo, { key: "Delete" });
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(ids(m.ultima())).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Rehacer" }));
    expect(ids(m.ultima())).toHaveLength(2);
  });

  it("Cuadrícula e imantar son interruptores", () => {
    montar(base());
    const cuadricula = botonCinta("Cuadrícula");
    expect(cuadricula.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(cuadricula);
    expect(cuadricula.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector("[data-capa=cuadricula]")).toBeTruthy();
    expect(botonCinta("Imantar a otros elementos").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("zoom", () => {
  it("los botones acercan y alejan; ajustar vuelve a mostrar todo", () => {
    const m = montar(base());
    const z0 = m.zoom();
    fireEvent.click(botonCinta("Acercar"));
    expect(m.zoom()).toBeCloseTo(z0 * 1.25, 6);
    fireEvent.click(botonCinta("Alejar"));
    fireEvent.click(botonCinta("Alejar"));
    expect(m.zoom()).toBeCloseTo(z0 / 1.25, 6);
    fireEvent.click(botonCinta("Ajustar a la ventana"));
    expect(m.zoom()).toBeCloseTo(z0, 6);
  });

  it("Ctrl+rueda hace zoom y la rueda sola desplaza", () => {
    const m = montar(base());
    const z0 = m.zoom();
    act(() => {
      m.lienzo.dispatchEvent(new WheelEvent("wheel", { deltaY: -200, ctrlKey: true, clientX: 300, clientY: 200, bubbles: true, cancelable: true }));
    });
    expect(m.zoom()).toBeGreaterThan(z0);
    const antes = m.aPantalla(0, 0).clientY;
    act(() => {
      m.lienzo.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true }));
    });
    expect(m.aPantalla(0, 0).clientY).toBeCloseTo(antes - 40, 6);
  });
});

describe("EditorLibreModal", () => {
  it("cerrado no pinta nada; abierto va fuera del bloque (en el body) y devuelve el foco al cerrar", () => {
    const disparador = document.createElement("button");
    document.body.appendChild(disparador);
    disparador.focus();
    const props = { escena: base(), onCambio: () => undefined, onCerrar: () => undefined };
    const { rerender } = render(<EditorLibreModal abierto={false} {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<EditorLibreModal abierto {...props} />);
    const dialogo = screen.getByRole("dialog");
    expect(dialogo.parentElement).toBe(document.body);
    rerender(<EditorLibreModal abierto={false} {...props} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(disparador);
    disparador.remove();
  });
});

describe("grupos", () => {
  it("un grupo se elige entero con un clic en cualquiera de sus hijos y se mueve junto", () => {
    const m = montar(escena(forma("a", 100, 100, 100, 100), forma("b", 400, 100, 100, 100), grupo("g", ["a", "b"])));
    arrastrar(m, [150, 150], [200, 200], 5);
    const final = m.ultima();
    expect(getForma(final, "a").transformacion.x).toBeCloseTo(150, 0);
    expect(getForma(final, "b").transformacion.x).toBeCloseTo(450, 0);
  });
});
