import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Escena } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { ANCHO_DEFECTO, ANCHO_MAX, ANCHO_MIN, PASO_TECLA, PASO_TECLA_MAYUS, PLEGAR_BAJO, ZonaRedimensionable, acotarAncho, anchoMaximo } from "./zona-redimensionable.js";
import { escena, forma } from "./util-pruebas.js";

const ventanaOriginal = window.innerWidth;
const fijarVentana = (ancho: number): void => {
  act(() => {
    Object.defineProperty(window, "innerWidth", { value: ancho, configurable: true, writable: true });
    window.dispatchEvent(new Event("resize"));
  });
};

beforeEach(() => {
  localStorage.clear();
  fijarVentana(1600);
});
afterEach(() => {
  cleanup();
  fijarVentana(ventanaOriginal);
  vi.restoreAllMocks();
});

const montar = (alPlegar?: (plegar: () => void) => void) =>
  render(
    <ZonaRedimensionable etiqueta="Propiedades" clave="prueba">
      {(plegar) => {
        alPlegar?.(plegar);
        return (
          <aside aria-label="contenido">
            <button type="button" data-plegar onClick={plegar}>
              plegar
            </button>
          </aside>
        );
      }}
    </ZonaRedimensionable>,
  );

const separador = (): HTMLElement => screen.getByRole("separator");
const zona = (): HTMLElement => document.querySelector("[data-zona]") as HTMLElement;
const ancho = (): number => Number(separador().getAttribute("aria-valuenow"));
const puntero = (tipo: "pointerdown" | "pointermove" | "pointerup" | "pointercancel", clientX: number): void => {
  fireEvent(separador(), new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0, clientX }));
};
const guardado = (k: string): string | null => localStorage.getItem(`lumina.panel.prueba-${k}`);

describe("acotarAncho y anchoMaximo", () => {
  it("deja el ancho entre el mínimo y el máximo, en píxeles enteros", () => {
    expect(acotarAncho(100)).toBe(ANCHO_MIN);
    expect(acotarAncho(9999)).toBe(ANCHO_MAX);
    expect(acotarAncho(300.6)).toBe(301);
    expect(acotarAncho(Number.NaN)).toBe(ANCHO_DEFECTO);
    expect(acotarAncho(500, 200, 400)).toBe(400);
  });
  it("el tope nunca pasa de la mitad de la ventana, pero tampoco baja del mínimo", () => {
    expect(anchoMaximo(2000)).toBe(ANCHO_MAX);
    expect(anchoMaximo(1000)).toBe(500);
    expect(anchoMaximo(300)).toBe(ANCHO_MIN);
  });
});

describe("separador", () => {
  it("es un separador vertical enfocable con su valor, mínimo y máximo, y la zona mide 320 px", () => {
    montar();
    const s = separador();
    expect(s.getAttribute("aria-orientation")).toBe("vertical");
    expect(s.getAttribute("aria-label")).toBe("Ancho de propiedades");
    expect(s.getAttribute("tabindex")).toBe("0");
    expect(s.getAttribute("aria-valuenow")).toBe(String(ANCHO_DEFECTO));
    expect(s.getAttribute("aria-valuemin")).toBe(String(ANCHO_MIN));
    expect(s.getAttribute("aria-valuemax")).toBe(String(ANCHO_MAX));
    expect(zona().style.width).toBe("320px");
  });

  it("arrastrar a la izquierda agranda y a la derecha achica; solo se guarda al soltar", () => {
    montar();
    puntero("pointerdown", 1000);
    puntero("pointermove", 900);
    expect(ancho()).toBe(420);
    expect(guardado("ancho")).toBeNull(); // todavía no: es una vista previa
    puntero("pointermove", 1060);
    expect(ancho()).toBe(260);
    puntero("pointerup", 1060);
    expect(ancho()).toBe(260);
    expect(guardado("ancho")).toBe("260");
    expect(separador().hasAttribute("data-arrastrando")).toBe(false);
  });

  it("el arrastre respeta el mínimo y el máximo", () => {
    montar();
    puntero("pointerdown", 1000);
    puntero("pointermove", 5000);
    expect(ancho()).toBe(ANCHO_MIN);
    puntero("pointermove", -5000);
    expect(ancho()).toBe(ANCHO_MAX);
    puntero("pointerup", -5000);
    expect(guardado("ancho")).toBe(String(ANCHO_MAX));
  });

  it("con una ventana de 1000 px el tope baja a 500", () => {
    fijarVentana(1000);
    montar();
    puntero("pointerdown", 900);
    puntero("pointermove", 0);
    puntero("pointerup", 0);
    expect(ancho()).toBe(500);
    expect(separador().getAttribute("aria-valuemax")).toBe("500");
  });

  it("Escape durante el arrastre lo cancela y vuelve al ancho de antes", () => {
    montar();
    puntero("pointerdown", 1000);
    puntero("pointermove", 800);
    expect(ancho()).toBe(520);
    fireEvent.keyDown(separador(), { key: "Escape" });
    expect(ancho()).toBe(ANCHO_DEFECTO);
    puntero("pointerup", 800);
    expect(guardado("ancho")).toBeNull();
  });

  it("cancelar el puntero (pointercancel) también devuelve el ancho anterior", () => {
    montar();
    puntero("pointerdown", 1000);
    puntero("pointermove", 900);
    puntero("pointercancel", 900);
    expect(ancho()).toBe(ANCHO_DEFECTO);
  });

  it("un clic derecho no empieza un arrastre", () => {
    montar();
    fireEvent(separador(), new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 2, clientX: 1000 }));
    puntero("pointermove", 800);
    expect(ancho()).toBe(ANCHO_DEFECTO);
  });

  it("doble clic restaura el ancho de fábrica y lo guarda", () => {
    montar();
    puntero("pointerdown", 1000);
    puntero("pointermove", 800);
    puntero("pointerup", 800);
    expect(ancho()).toBe(520);
    fireEvent.doubleClick(separador());
    expect(ancho()).toBe(ANCHO_DEFECTO);
    expect(guardado("ancho")).toBe(String(ANCHO_DEFECTO));
  });
});

describe("teclado del separador", () => {
  it("flecha izquierda agranda y derecha achica, con Mayús de a 64; Inicio y Fin van a los extremos", () => {
    montar();
    fireEvent.keyDown(separador(), { key: "ArrowLeft" });
    expect(ancho()).toBe(ANCHO_DEFECTO + PASO_TECLA);
    fireEvent.keyDown(separador(), { key: "ArrowRight" });
    fireEvent.keyDown(separador(), { key: "ArrowRight" });
    expect(ancho()).toBe(ANCHO_DEFECTO - PASO_TECLA);
    fireEvent.keyDown(separador(), { key: "ArrowLeft", shiftKey: true });
    expect(ancho()).toBe(ANCHO_DEFECTO - PASO_TECLA + PASO_TECLA_MAYUS);
    fireEvent.keyDown(separador(), { key: "Home" });
    expect(ancho()).toBe(ANCHO_MIN);
    fireEvent.keyDown(separador(), { key: "End" });
    expect(ancho()).toBe(ANCHO_MAX);
    expect(guardado("ancho")).toBe(String(ANCHO_MAX));
  });

  it("no pasa de los límites con las flechas", () => {
    montar();
    fireEvent.keyDown(separador(), { key: "Home" });
    fireEvent.keyDown(separador(), { key: "ArrowRight", shiftKey: true });
    expect(ancho()).toBe(ANCHO_MIN);
    fireEvent.keyDown(separador(), { key: "End" });
    fireEvent.keyDown(separador(), { key: "ArrowLeft", shiftKey: true });
    expect(ancho()).toBe(ANCHO_MAX);
  });

  it("las teclas del separador no suben a quien lo envuelve (no mueven la selección del lienzo)", () => {
    const alPadre = vi.fn();
    render(
      <div onKeyDown={alPadre}>
        <ZonaRedimensionable etiqueta="Propiedades" clave="prueba">
          {() => <span />}
        </ZonaRedimensionable>
      </div>,
    );
    for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) fireEvent.keyDown(separador(), { key });
    expect(alPadre).not.toHaveBeenCalled();
  });

  it("Enter pliega la zona", () => {
    montar();
    fireEvent.keyDown(separador(), { key: "Enter" });
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
  });
});

describe("plegado", () => {
  it("el botón del contenido pliega la zona a un riel y el botón del riel la vuelve a abrir", () => {
    montar();
    fireEvent.click(document.querySelector("[data-plegar]") as HTMLElement);
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByLabelText("contenido")).toBeNull();
    const abrir = screen.getByRole("button", { name: "Mostrar propiedades" });
    expect(abrir.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(abrir);
    expect(document.querySelector("[data-zona=abierta]")).toBeTruthy();
    expect(screen.getByLabelText("contenido")).toBeTruthy();
  });

  it("recuerda el plegado y el ancho al volver a montar", () => {
    const a = montar();
    fireEvent.keyDown(separador(), { key: "End" });
    expect(guardado("ancho")).toBe(String(ANCHO_MAX));
    a.unmount();
    montar();
    expect(ancho()).toBe(ANCHO_MAX);
    fireEvent.click(document.querySelector("[data-plegar]") as HTMLElement);
    expect(guardado("plegado")).toBe("1");
    cleanup();
    montar();
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar propiedades" }));
    expect(guardado("plegado")).toBe("0");
  });

  it("un ancho guardado fuera de rango o roto se acota o se ignora", () => {
    localStorage.setItem("lumina.panel.prueba-ancho", "99999");
    montar();
    expect(ancho()).toBe(ANCHO_MAX);
    cleanup();
    localStorage.setItem("lumina.panel.prueba-ancho", "basura");
    montar();
    expect(ancho()).toBe(ANCHO_DEFECTO);
  });

  it("sin localStorage (bloqueado) funciona igual, solo que no recuerda", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    montar();
    fireEvent.keyDown(separador(), { key: "ArrowLeft" });
    expect(ancho()).toBe(ANCHO_DEFECTO + PASO_TECLA);
    fireEvent.click(document.querySelector("[data-plegar]") as HTMLElement);
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
  });
});

describe("plegado automático por el ancho de la ventana", () => {
  it(`por debajo de ${PLEGAR_BAJO} px se pliega sola, y al ensanchar vuelve a como estaba`, () => {
    montar();
    expect(document.querySelector("[data-zona=abierta]")).toBeTruthy();
    fijarVentana(PLEGAR_BAJO - 1);
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
    fijarVentana(PLEGAR_BAJO);
    expect(document.querySelector("[data-zona=abierta]")).toBeTruthy();
  });

  it("en una ventana estrecha el usuario puede abrirla y se queda abierta mientras siga estrecha", () => {
    fijarVentana(700);
    montar();
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar propiedades" }));
    expect(document.querySelector("[data-zona=abierta]")).toBeTruthy();
    fijarVentana(650);
    expect(document.querySelector("[data-zona=abierta]")).toBeTruthy();
    // Esa apertura no se guarda: no cambia la preferencia de las ventanas anchas.
    expect(guardado("plegado")).toBeNull();
    fijarVentana(1600);
    fijarVentana(700);
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
  });

  it("plegar a mano en una ventana ancha se respeta aunque se pase por una estrecha y se vuelva", () => {
    montar();
    fireEvent.click(document.querySelector("[data-plegar]") as HTMLElement);
    fijarVentana(600);
    fijarVentana(1600);
    expect(document.querySelector("[data-zona=plegada]")).toBeTruthy();
  });
});

describe("dentro del editor", () => {
  const base = () => escena(forma("a", 100, 100, 200, 100), forma("b", 500, 100, 200, 100));
  function montarEditor() {
    const onCambio = vi.fn<(e: Escena) => void>();
    render(<EditorLibre escena={base()} onCambio={onCambio} onCerrar={() => undefined} />);
    return { onCambio, lienzo: screen.getByRole("application", { name: "Lienzo de dibujo" }) };
  }

  it("el panel de propiedades va dentro de la zona: 320 px, con su botón de plegar y su separador", () => {
    montarEditor();
    expect(screen.getByRole("separator", { name: "Ancho de propiedades" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Plegar propiedades" })).toBeTruthy();
    expect(zona().style.width).toBe("320px");
  });

  it("plegar deja el lienzo con más sitio y el riel permite volver", () => {
    montarEditor();
    fireEvent.click(screen.getByRole("button", { name: "Plegar propiedades" }));
    expect(screen.queryByLabelText("Propiedades")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar propiedades" }));
    expect(document.querySelector("[data-dibujo-propiedades]")).toBeTruthy();
  });

  it("las flechas sobre el separador cambian el ancho y NO mueven lo seleccionado", () => {
    const m = montarEditor();
    fireEvent.keyDown(m.lienzo, { key: "a", ctrlKey: true });
    const s = screen.getByRole("separator");
    s.focus();
    fireEvent.keyDown(s, { key: "ArrowLeft" });
    fireEvent.keyDown(s, { key: "ArrowRight", shiftKey: true });
    expect(m.onCambio).not.toHaveBeenCalled();
    expect(Number(s.getAttribute("aria-valuenow"))).toBe(ANCHO_DEFECTO + PASO_TECLA - PASO_TECLA_MAYUS);
  });
});
