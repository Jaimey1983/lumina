import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conectarFormas, type Escena, type Forma } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { botonCinta, escena, forma, getForma } from "./util-pruebas.js";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const AREA = { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0 };

function montar(e: Escena = escena()) {
  const onCambio = vi.fn<(e: Escena) => void>();
  render(<EditorLibre escena={e} titulo="Prueba" onCambio={onCambio} onCerrar={vi.fn()} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  lienzo.getBoundingClientRect = () => ({ ...AREA, toJSON: () => AREA }) as DOMRect;
  fireEvent.click(botonCinta("Imantar a otros elementos"));
  const vista = () => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
    return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
  };
  /** Un evento de puntero; `jsdom` no trae `pointerType` ni `pointerId` en un `MouseEvent`, así que se le ponen. */
  const puntero = (el: Element | Window, tipo: string, clientX: number, clientY: number, id = 1, pointerType = "touch"): void => {
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX, clientY });
    Object.defineProperties(ev, { pointerType: { value: pointerType }, pointerId: { value: id }, isPrimary: { value: id === 1 } });
    fireEvent(el, ev);
  };
  const pant = (x: number, y: number) => {
    const v = vista();
    return { x: v.x + x * v.z, y: v.y + y * v.z };
  };
  return {
    onCambio,
    lienzo,
    vista,
    pant,
    puntero,
    dedo: (tipo: "pointerdown" | "pointermove" | "pointerup" | "pointercancel", id: number, x: number, y: number) => puntero(lienzo, tipo, x, y, id),
    cuenta: () => onCambio.mock.calls.length,
    dibujo: () => document.querySelector("[data-dibujo-pagina]")?.parentElement?.innerHTML ?? "",
    anuncio: () => document.querySelector('[aria-live="polite"]')?.textContent ?? "",
  };
}

const UNA = (): Escena => escena(forma("a", 100, 100, 100, 60));

describe("Y30 — dos dedos: pellizcar y desplazar", () => {
  it("separar los dedos acerca el lienzo; juntarlos lo aleja", () => {
    const m = montar();
    const z0 = m.vista().z;
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointermove", 1, 350, 300);
    m.dedo("pointermove", 2, 550, 300);
    expect(m.vista().z).toBeCloseTo(z0 * 2, 5);
    m.dedo("pointermove", 1, 450, 300);
    m.dedo("pointermove", 2, 500, 300);
    expect(m.vista().z).toBeCloseTo(z0 * 0.5, 5);
  });

  it("el punto bajo el medio de los dedos se queda bajo el medio de los dedos", () => {
    const m = montar();
    const antes = m.vista();
    const escenaBajo = { x: (450 - antes.x) / antes.z, y: (300 - antes.y) / antes.z };
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointermove", 1, 300, 340);
    m.dedo("pointermove", 2, 600, 340);
    const v = m.vista();
    expect(escenaBajo.x * v.z + v.x).toBeCloseTo(450, 4);
    expect(escenaBajo.y * v.z + v.y).toBeCloseTo(340, 4);
  });

  it("dos dedos que se mueven juntos desplazan sin cambiar el zoom", () => {
    const m = montar();
    const v0 = m.vista();
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointermove", 1, 430, 280);
    m.dedo("pointermove", 2, 530, 280);
    const v = m.vista();
    expect(v.z).toBeCloseTo(v0.z, 6);
    expect(v.x).toBeCloseTo(v0.x + 30, 4);
    expect(v.y).toBeCloseTo(v0.y - 20, 4);
  });

  it("el pellizco no deja entradas de historial ni confirma nada al anfitrión; anuncia el zoom una sola vez al terminar", () => {
    const m = montar(UNA());
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointermove", 1, 350, 300);
    expect(m.anuncio()).not.toMatch(/^Zoom/);
    m.dedo("pointermove", 2, 550, 300);
    m.dedo("pointerup", 2, 550, 300);
    m.dedo("pointerup", 1, 350, 300);
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toMatch(/^Zoom \d+ %\.$/);
  });

  it("un tercer dedo se ignora", () => {
    const m = montar();
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointerdown", 3, 100, 100);
    const z = m.vista().z;
    m.dedo("pointermove", 3, 10, 10);
    expect(m.vista().z).toBe(z);
    m.dedo("pointermove", 2, 600, 300);
    expect(m.vista().z).toBeCloseTo(z * 2, 5);
  });

  it("al levantar un dedo, el que queda no desplaza ni inicia nada hasta que se levanten todos; luego todo vuelve a funcionar", () => {
    const m = montar(UNA());
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointermove", 2, 600, 300);
    m.dedo("pointerup", 1, 400, 300);
    const v = m.vista();
    const dibujo = m.dibujo();
    m.dedo("pointermove", 2, 300, 200);
    expect(m.vista()).toEqual(v);
    // Un dedo nuevo mientras el otro sigue apretado tampoco inicia un gesto ni un pellizco.
    m.dedo("pointerdown", 3, 100, 100);
    m.dedo("pointermove", 3, 200, 200);
    expect(m.vista()).toEqual(v);
    m.dedo("pointerup", 3, 200, 200);
    m.dedo("pointerup", 2, 300, 200);
    expect(m.dibujo()).toBe(dibujo);
    expect(m.cuenta()).toBe(0);
    // Ya sin dedos, un toque sobre la forma la elige y arrastrarla la mueve.
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, c.x, c.y);
    m.dedo("pointermove", 1, c.x + 60, c.y + 30);
    m.dedo("pointerup", 1, c.x + 60, c.y + 30);
    expect(m.cuenta()).toBe(1);
  });

  it("el dedo que queda tras un pellizco no hace aparecer los puertos al pasar por una forma", () => {
    const m = montar(UNA());
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, 700, 500);
    m.dedo("pointerdown", 2, 800, 500);
    m.dedo("pointerup", 1, 700, 500);
    m.dedo("pointermove", 2, c.x, c.y);
    expect(document.querySelectorAll("[data-puerto]")).toHaveLength(0);
    m.dedo("pointerup", 2, c.x, c.y);
    // Sin pellizco de por medio, el mismo movimiento sí los muestra (el control de la prueba).
    m.puntero(m.lienzo, "pointermove", c.x, c.y, 1, "mouse");
    expect(document.querySelectorAll("[data-puerto]").length).toBeGreaterThan(0);
  });

  it("si se pierden los pointerup (un dedo salió de la ventana), el primer dedo de un toque nuevo no queda atrapado", () => {
    const m = montar(UNA());
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, c.x, c.y); // `isPrimary`: no hay otro dedo, sea lo que sea que quedó anotado
    m.dedo("pointermove", 1, c.x + 60, c.y + 30);
    m.dedo("pointerup", 1, c.x + 60, c.y + 30);
    expect(m.cuenta()).toBe(1);
  });

  it("pointercancel de un dedo cierra el pellizco", () => {
    const m = montar();
    m.dedo("pointerdown", 1, 400, 300);
    m.dedo("pointerdown", 2, 500, 300);
    m.dedo("pointercancel", 1, 400, 300);
    const z = m.vista().z;
    m.dedo("pointermove", 2, 700, 300);
    expect(m.vista().z).toBe(z);
    m.dedo("pointercancel", 2, 700, 300);
    // Todo suelto: un dedo solo vuelve a usar la herramienta.
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, c.x, c.y);
    m.dedo("pointerup", 1, c.x, c.y);
    expect(m.anuncio()).toMatch(/Rectángulo|seleccionad/i);
  });
});

describe("Y30 — el segundo dedo cancela el gesto en curso (DY5)", () => {
  it("arrastrando una forma, el segundo dedo la devuelve a su sitio: ni historial ni confirmación", () => {
    const m = montar(UNA());
    const antes = m.dibujo();
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, c.x, c.y);
    m.dedo("pointermove", 1, c.x + 80, c.y + 50);
    expect(m.dibujo()).not.toBe(antes);
    m.dedo("pointerdown", 2, 700, 500);
    expect(m.dibujo()).toBe(antes);
    m.dedo("pointerup", 1, c.x + 80, c.y + 50);
    m.dedo("pointerup", 2, 700, 500);
    expect(m.cuenta()).toBe(0);
    expect(m.dibujo()).toBe(antes);
    // Deshacer no tiene nada que deshacer.
    expect(botonCinta("Deshacer").getAttribute("aria-disabled")).toBe("true");
  });

  it("creando una forma con la herramienta, el segundo dedo cancela la creación", () => {
    const m = montar();
    fireEvent.click(botonCinta("Insertar Rectángulo"));
    m.dedo("pointerdown", 1, 200, 200);
    m.dedo("pointermove", 1, 320, 280);
    m.dedo("pointerdown", 2, 700, 500);
    m.dedo("pointerup", 2, 700, 500);
    m.dedo("pointerup", 1, 320, 280);
    expect(m.cuenta()).toBe(0);
  });

  it("arrastrando un extremo de una línea, el segundo dedo la deja como estaba", () => {
    const e = conectarFormas(escena(forma("a", 100, 100, 100, 60), forma("b", 400, 100, 100, 60)), "a", "b");
    const m = montar(e);
    const antes = m.dibujo();
    const linea = e.elementos.find((x) => x.tipo === "linea");
    expect(linea).toBeDefined();
    // Se elige la línea con un clic de ratón y se agarra un extremo con el dedo.
    const p = m.pant(300, 130);
    m.puntero(m.lienzo, "pointerdown", p.x, p.y, 9, "mouse");
    m.puntero(m.lienzo, "pointerup", p.x, p.y, 9, "mouse");
    const fin = m.pant(400, 130);
    m.dedo("pointerdown", 1, fin.x, fin.y);
    m.dedo("pointermove", 1, fin.x + 40, fin.y + 150);
    m.dedo("pointerdown", 2, 800, 500);
    m.dedo("pointerup", 2, 800, 500);
    m.dedo("pointerup", 1, fin.x + 40, fin.y + 150);
    expect(m.cuenta()).toBe(0);
    expect(m.dibujo()).toBe(antes);
  });
});

describe("Y30 — objetivos grandes solo con el dedo (DY97)", () => {
  /** Elige la forma con el ratón y devuelve el punto de pantalla a `dx` píxeles a la derecha de su asa «se». */
  function conFormaElegida(dx: number) {
    const m = montar(UNA());
    const c = m.pant(150, 130);
    m.puntero(m.lienzo, "pointerdown", c.x, c.y, 9, "mouse");
    m.puntero(m.lienzo, "pointerup", c.x, c.y, 9, "mouse");
    const se = m.pant(200, 160);
    return { m, se, punto: { x: se.x + dx, y: se.y } };
  }
  const ancho = (m: ReturnType<typeof montar>): number => (getForma(m.onCambio.mock.calls.at(-1)?.[0] as Escena, "a") as Forma).transformacion.ancho;

  it("con el dedo, un toque a 20 px del asa de tamaño la agarra", () => {
    const { m, punto } = conFormaElegida(20);
    m.dedo("pointerdown", 1, punto.x, punto.y);
    m.dedo("pointermove", 1, punto.x + 60, punto.y);
    m.dedo("pointerup", 1, punto.x + 60, punto.y);
    expect(m.cuenta()).toBe(1);
    expect(ancho(m)).toBeGreaterThan(100);
  });

  it("con el dedo, a 30 px ya no", () => {
    const { m, punto } = conFormaElegida(30);
    m.dedo("pointerdown", 1, punto.x, punto.y);
    m.dedo("pointermove", 1, punto.x + 60, punto.y);
    m.dedo("pointerup", 1, punto.x + 60, punto.y);
    expect(m.cuenta()).toBe(0);
  });

  it("con el ratón, a 20 px no (la tolerancia de siempre no cambia)", () => {
    const { m, punto } = conFormaElegida(20);
    m.puntero(m.lienzo, "pointerdown", punto.x, punto.y, 1, "mouse");
    m.puntero(m.lienzo, "pointermove", punto.x + 60, punto.y, 1, "mouse");
    m.puntero(m.lienzo, "pointerup", punto.x + 60, punto.y, 1, "mouse");
    expect(m.cuenta()).toBe(0);
  });

  it("las asas se dibujan más grandes con el dedo y como siempre con el ratón", () => {
    const { m, se } = conFormaElegida(0);
    const lado = (): number => Number(document.querySelector('[data-asa="se"]')?.getAttribute("width"));
    expect(lado()).toBe(9);
    m.dedo("pointerdown", 1, 10, 10);
    m.dedo("pointerup", 1, 10, 10);
    // El toque en el vacío deselecciona: se vuelve a elegir con el dedo.
    const c = m.pant(150, 130);
    m.dedo("pointerdown", 1, c.x, c.y);
    m.dedo("pointerup", 1, c.x, c.y);
    expect(lado()).toBe(14);
    expect(se).toBeDefined();
  });

  it("la raíz pide botones, pestañas y campos de 44 px solo en dispositivos táctiles, sin cambiar el diseño mientras se toca", () => {
    montar();
    const raiz = document.querySelector("[data-dibujo-editor]") as HTMLElement;
    expect(raiz.className).toContain("pointer-coarse:[&_:is(button,[role=tab],[role=menuitem],input,select)]:min-h-[44px]");
    expect(raiz.className).toContain("pointer-coarse:[&_:is(button,[role=tab],[role=menuitem])]:min-w-[44px]");
    expect(raiz.className).toContain("touch-manipulation");
    // Un toque en la cinta no toca la raíz: nada se mueve bajo el dedo.
    const antes = raiz.className;
    const boton = botonCinta("Cuadrícula");
    fireEvent.pointerDown(boton);
    expect(raiz.className).toBe(antes);
    expect(raiz.hasAttribute("data-tactil")).toBe(false);
  });

  it("el marcador de rama responde a un toque a 20 px de su centro, no a 30 px, y con el ratón solo encima", () => {
    const e = conectarFormas(escena(forma("a", 100, 100, 100, 60), forma("b", 400, 100, 100, 60)), "a", "b");
    const m = montar(e);
    const marcador = document.querySelector('[data-colapsar-id="a"]') as Element;
    expect(marcador).not.toBeNull();
    marcador.getBoundingClientRect = () => ({ left: 600, top: 400, right: 610, bottom: 410, width: 10, height: 10, x: 600, y: 400, toJSON: () => ({}) }) as DOMRect;
    const pliega = (dx: number, tipo: string): number => {
      m.puntero(m.lienzo, "pointerdown", 605 + dx, 405, 1, tipo);
      m.puntero(m.lienzo, "pointerup", 605 + dx, 405, 1, tipo);
      return m.cuenta();
    };
    expect(pliega(30, "touch")).toBe(0);
    expect(pliega(20, "mouse")).toBe(0);
    expect(pliega(20, "touch")).toBe(1);
  });
});
