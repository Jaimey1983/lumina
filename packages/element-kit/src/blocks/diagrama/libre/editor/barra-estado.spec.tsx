import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { BarraEstado, posicionDeZoom, textoCursor, textoGeometria, textoZoom, zoomDePosicion } from "./barra-estado.js";
import { EditorLibre } from "./editor-libre.js";
import { ZOOM_MAX, ZOOM_MIN } from "./vista.js";
import { botonCinta, escena, forma, irAPestana, linea } from "./util-pruebas.js";

afterEach(cleanup);

describe("formato", () => {
  it("el cursor se escribe con enteros y sin «-0»", () => {
    expect(textoCursor({ x: 412.4, y: 208.6 })).toBe("X 412 · Y 209");
    expect(textoCursor({ x: -0.2, y: 0 })).toBe("X 0 · Y 0");
    expect(textoCursor({ x: -15.5, y: 3 })).toBe("X -15 · Y 3");
  });

  it("la geometría trae posición y tamaño, y el giro solo si lo hay", () => {
    expect(textoGeometria({ x: 100, y: 50, ancho: 200, alto: 100, rotacion: 0 })).toBe("X 100 · Y 50 · 200 × 100");
    expect(textoGeometria({ x: 100, y: 50, ancho: 200, alto: 100, rotacion: 30 })).toBe("X 100 · Y 50 · 200 × 100 · 30°");
    expect(textoGeometria({ x: 0, y: 0, ancho: 10, alto: 10, rotacion: -90 })).toBe("X 0 · Y 0 · 10 × 10 · 270°");
    expect(textoGeometria({ x: 0, y: 0, ancho: 10, alto: 10, rotacion: 360 })).toBe("X 0 · Y 0 · 10 × 10");
    expect(textoGeometria({ x: 0.4, y: 0.6, ancho: 9.5, alto: 10.4, rotacion: 0.2 })).toBe("X 0 · Y 1 · 10 × 10");
  });

  it("el zoom se escribe en porcentaje", () => {
    expect(textoZoom(1)).toBe("100%");
    expect(textoZoom(1.337)).toBe("134%");
    expect(textoZoom(ZOOM_MIN)).toBe("10%");
    expect(textoZoom(ZOOM_MAX)).toBe("800%");
  });

  it("el deslizador es logarítmico: va de 10 % a 800 % y 100 % no queda en el medio de una escala lineal", () => {
    expect(posicionDeZoom(ZOOM_MIN)).toBeCloseTo(0, 9);
    expect(posicionDeZoom(ZOOM_MAX)).toBeCloseTo(1, 9);
    expect(zoomDePosicion(0)).toBeCloseTo(ZOOM_MIN, 9);
    expect(zoomDePosicion(1)).toBeCloseTo(ZOOM_MAX, 9);
    for (const z of [0.1, 0.25, 0.5, 1, 2, 4, 8]) expect(zoomDePosicion(posicionDeZoom(z))).toBeCloseTo(z, 9);
    expect(posicionDeZoom(1)).toBeGreaterThan(0.4);
    expect(posicionDeZoom(1)).toBeLessThan(0.6);
    expect(zoomDePosicion(-3)).toBeCloseTo(ZOOM_MIN, 9);
    expect(zoomDePosicion(7)).toBeCloseTo(ZOOM_MAX, 9);
  });
});

describe("BarraEstado (suelta)", () => {
  const props = () => ({
    cantidad: 3,
    seleccionados: 0,
    marco: null,
    zoom: 1,
    cuadricula: false,
    imantar: true,
    ayuda: "Ayuda de prueba",
    onOrden: vi.fn(),
    onZoom: vi.fn(),
    cursorRef: { current: null } as { current: ((p: { x: number; y: number } | null) => void) | null },
  });

  it("muestra la cantidad, la ayuda y un sitio reservado para el guardado", () => {
    render(<BarraEstado {...props()} />);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("3 elementos");
    expect(screen.getByText("Ayuda de prueba")).toBeTruthy();
    const sitio = document.querySelector("[data-dibujo-guardado]");
    expect(sitio).toBeTruthy();
    expect(sitio?.textContent).toBe("");
  });

  it("un indicador de guardado que se le pase aparece en su sitio", () => {
    render(<BarraEstado {...props()} guardado="Guardado hace 3 s" />);
    expect(document.querySelector("[data-dibujo-guardado]")?.textContent).toBe("Guardado hace 3 s");
  });

  it("un solo elemento, un lienzo vacío y varios seleccionados se dicen en singular y plural", () => {
    const { rerender } = render(<BarraEstado {...props()} cantidad={1} seleccionados={1} marco={{ x: 1, y: 2, ancho: 3, alto: 4, rotacion: 0 }} />);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("1 elemento · 1 seleccionado");
    rerender(<BarraEstado {...props()} cantidad={0} />);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("Lienzo vacío");
    rerender(<BarraEstado {...props()} cantidad={5} seleccionados={2} marco={{ x: 1, y: 2, ancho: 3, alto: 4, rotacion: 0 }} />);
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("5 elementos · 2 seleccionados");
  });

  it("sin selección no hay geometría", () => {
    render(<BarraEstado {...props()} marco={{ x: 1, y: 2, ancho: 3, alto: 4, rotacion: 0 }} />);
    expect(document.querySelector("[data-estado-geometria]")).toBeNull();
  });

  it("los interruptores son «switch» con su estado y piden la orden del comando", () => {
    const p = props();
    const { rerender } = render(<BarraEstado {...p} cuadricula={false} imantar />);
    const cuadricula = screen.getByRole("switch", { name: "Cuadrícula" });
    const iman = screen.getByRole("switch", { name: "Imantar a otros elementos" });
    expect(cuadricula.getAttribute("aria-checked")).toBe("false");
    expect(iman.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(cuadricula);
    fireEvent.click(iman);
    expect(p.onOrden.mock.calls).toEqual([[{ tipo: "cuadricula" }], [{ tipo: "imantar" }]]);
    rerender(<BarraEstado {...p} cuadricula imantar={false} />);
    expect(screen.getByRole("switch", { name: "Cuadrícula" }).getAttribute("aria-checked")).toBe("true");
  });

  it("el deslizador tiene nombre, texto de valor y pide el zoom que se le indica", () => {
    const p = props();
    render(<BarraEstado {...p} zoom={2} />);
    const d = screen.getByRole("slider", { name: "Zoom" });
    expect(d.getAttribute("aria-valuetext")).toBe("200%");
    expect(document.querySelector("[data-estado-zoom]")?.textContent).toBe("200%");
    fireEvent.change(d, { target: { value: String(posicionDeZoom(4)) } });
    expect(p.onZoom).toHaveBeenCalledTimes(1);
    expect(p.onZoom.mock.calls[0]?.[0]).toBeCloseTo(4, 1);
  });

  it("el cursor lo lleva la propia barra: lo que se le dé a `cursorRef` se muestra, y `null` lo borra", () => {
    const p = props();
    render(<BarraEstado {...p} />);
    expect(p.cursorRef.current).toBeTypeOf("function");
    act(() => p.cursorRef.current?.({ x: 12.4, y: 99.6 }));
    expect(document.querySelector("[data-estado-cursor]")?.textContent).toBe("X 12 · Y 100");
    act(() => p.cursorRef.current?.(null));
    expect(document.querySelector("[data-estado-cursor]")?.textContent).toBe("");
  });

  it("al desmontarse suelta el manejador del cursor", () => {
    const p = props();
    const { unmount } = render(<BarraEstado {...p} />);
    unmount();
    expect(p.cursorRef.current).toBeNull();
  });
});

describe("en el editor", () => {
  const base = () => escena(forma("a", 100, 100, 200, 100), forma("b", 500, 100, 200, 100), forma("g", 100, 350, 200, 100, { transformacion: { x: 100, y: 350, ancho: 200, alto: 100, rotacion: 30 } }));

  function montar(e: Escena = base()) {
    const onCambio = vi.fn<(e: Escena) => void>();
    render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => undefined} />);
    const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" });
    const vista = () => {
      const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
      const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(g);
      return { x: Number(m?.[1]), y: Number(m?.[2]), z: Number(m?.[3]) };
    };
    const aPantalla = (x: number, y: number) => {
      const v = vista();
      return { clientX: v.x + x * v.z, clientY: v.y + y * v.z };
    };
    const mover = (x: number, y: number) => fireEvent(lienzo, new MouseEvent("pointermove", { bubbles: true, cancelable: true, ...aPantalla(x, y) }));
    return { onCambio, lienzo, vista, aPantalla, mover };
  }
  const cursor = (): string => document.querySelector("[data-estado-cursor]")?.textContent ?? "";
  const geometria = (): string | null => document.querySelector("[data-estado-geometria]")?.textContent ?? null;
  const elegir = (m: ReturnType<typeof montar>, x: number, y: number): void => {
    fireEvent(m.lienzo, new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, ...m.aPantalla(x, y) }));
    fireEvent(m.lienzo, new MouseEvent("pointerup", { bubbles: true, cancelable: true, button: 0, ...m.aPantalla(x, y) }));
  };

  it("el cursor muestra la posición en la escena, no en la pantalla", () => {
    const m = montar();
    expect(cursor()).toBe("");
    m.mover(412, 208);
    expect(cursor()).toBe("X 412 · Y 208");
    m.mover(0, 0);
    expect(cursor()).toBe("X 0 · Y 0");
  });

  it("sigue siendo la posición de la escena con otro zoom y otro desplazamiento", () => {
    const m = montar();
    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: String(posicionDeZoom(3)) } });
    expect(m.vista().z).toBeCloseTo(3, 1);
    m.mover(250, 130);
    expect(cursor()).toBe("X 250 · Y 130");
    // Desplazar con la rueda cambia dónde está la escena en pantalla, no las coordenadas de la escena.
    act(() => {
      m.lienzo.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 80, deltaY: 60 }));
    });
    m.mover(250, 130);
    expect(cursor()).toBe("X 250 · Y 130");
  });

  it("al salir el puntero del lienzo, las coordenadas se borran", () => {
    const m = montar();
    m.mover(300, 300);
    expect(cursor()).not.toBe("");
    fireEvent.pointerLeave(m.lienzo);
    expect(cursor()).toBe("");
  });

  it("mover el cursor no vuelve a pintar el dibujo ni confirma nada", () => {
    const m = montar();
    const antes = document.querySelector("[data-elemento-id=a]");
    m.mover(50, 50);
    m.mover(60, 60);
    expect(document.querySelector("[data-elemento-id=a]")).toBe(antes);
    expect(m.onCambio).not.toHaveBeenCalled();
  });

  it("un elemento elegido muestra su posición y tamaño; sin selección no hay nada", () => {
    const m = montar();
    expect(geometria()).toBeNull();
    elegir(m, 200, 150);
    expect(geometria()).toBe("X 100 · Y 100 · 200 × 100");
  });

  it("varios elegidos muestran el recuadro que los contiene", () => {
    const m = montar(escena(forma("a", 100, 100, 200, 100), forma("b", 500, 200, 200, 100)));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(geometria()).toBe("X 100 · Y 100 · 600 × 200");
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("2 elementos · 2 seleccionados");
  });

  it("un elemento girado dice su ángulo", () => {
    const m = montar();
    fireEvent.keyDown(m.lienzo, { key: "Tab", shiftKey: true }); // el último: el girado
    expect(geometria()).toBe("X 100 · Y 350 · 200 × 100 · 30°");
  });

  it("una línea sola también informa (su recuadro)", () => {
    const m = montar(escena(linea("L", [[100, 100], [300, 200]])));
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    expect(geometria()).toMatch(/^X 100 · Y 100 · 200 × 100/);
  });

  it("la geometría sigue a un cambio: al mover con las flechas cambia X", () => {
    const m = montar();
    elegir(m, 200, 150);
    fireEvent.keyDown(m.lienzo, { key: "ArrowRight", shiftKey: true });
    expect(geometria()).toBe("X 110 · Y 100 · 200 × 100");
  });

  it("el deslizador cambia el zoom del lienzo y su porcentaje; la cinta y la barra dicen lo mismo", () => {
    const m = montar();
    const d = screen.getByRole("slider", { name: "Zoom" });
    fireEvent.change(d, { target: { value: String(posicionDeZoom(2)) } });
    expect(m.vista().z).toBeCloseTo(2, 1);
    expect(document.querySelector("[data-estado-zoom]")?.textContent).toBe(textoZoom(m.vista().z));
    irAPestana("Vista");
    expect(document.querySelector("[data-dibujo-zoom]")?.textContent).toBe(textoZoom(m.vista().z));
    expect(d.getAttribute("aria-valuetext")).toBe(textoZoom(m.vista().z));
  });

  it("el deslizador no pasa de los límites (10 %–800 %)", () => {
    const m = montar();
    const d = screen.getByRole("slider", { name: "Zoom" });
    fireEvent.change(d, { target: { value: "0" } });
    expect(m.vista().z).toBeCloseTo(ZOOM_MIN, 6);
    fireEvent.change(d, { target: { value: "1" } });
    expect(m.vista().z).toBeCloseTo(ZOOM_MAX, 6);
  });

  it("los botones de zoom de la cinta mueven el deslizador", () => {
    const m = montar();
    const antes = Number((screen.getByRole("slider", { name: "Zoom" }) as HTMLInputElement).value);
    fireEvent.click(botonCinta("Acercar"));
    expect(Number((screen.getByRole("slider", { name: "Zoom" }) as HTMLInputElement).value)).toBeGreaterThan(antes);
    expect(m.vista().z).toBeGreaterThan(0);
  });

  it("los interruptores de la barra y los botones de la cinta son el mismo estado", () => {
    montar();
    const sw = screen.getByRole("switch", { name: "Cuadrícula" });
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector("[data-capa=cuadricula]")).toBeTruthy();
    expect(botonCinta("Cuadrícula").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(botonCinta("Cuadrícula"));
    expect(screen.getByRole("switch", { name: "Cuadrícula" }).getAttribute("aria-checked")).toBe("false");
    const iman = screen.getByRole("switch", { name: "Imantar a otros elementos" });
    expect(iman.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(iman);
    expect(botonCinta("Imantar a otros elementos").getAttribute("aria-pressed")).toBe("false");
  });

  it("la ayuda cambia con la herramienta", () => {
    const m = montar();
    expect(screen.getByText(/Clic para elegir/)).toBeTruthy();
    fireEvent.keyDown(m.lienzo, { key: "t" });
    expect(screen.getByText(/Texto: haz clic o arrastra/)).toBeTruthy();
  });

  it("las teclas sobre el deslizador no tocan el dibujo", () => {
    const m = montar();
    elegir(m, 200, 150);
    const d = screen.getByRole("slider", { name: "Zoom" });
    d.focus();
    fireEvent.keyDown(d, { key: "ArrowRight" });
    fireEvent.keyDown(d, { key: "Delete" });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(geometria()).toBe("X 100 · Y 100 · 200 × 100");
  });

  it("se conserva el aviso para lectores de pantalla y los textos de siempre", () => {
    montar();
    expect(document.querySelector("[data-dibujo-anuncio]")?.getAttribute("aria-live")).toBe("polite");
    expect(document.querySelector("[data-dibujo-estado]")?.textContent).toBe("3 elementos");
  });
});
