import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CambioDePagina, Escena } from "@lumina/drawing";
import { fijarPagina } from "@lumina/drawing";
import { svgDeEscena } from "../exportar.js";
import { buscarComandos } from "./buscar-comandos.js";
import { COMANDOS, comando } from "./comandos-registro.js";
import { EditorLibre } from "./editor-libre.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { SINONIMOS_POR_COMANDO } from "./sinonimos-comandos.js";
import { botonCinta, escena, forma } from "./util-pruebas.js";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// ─── El panel solo ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function panel(e: Escena, seleccion: string[] = [], conPagina = true) {
  const onPagina = vi.fn<(c: CambioDePagina) => void>();
  const onVista = vi.fn<(fn: (x: Escena) => Escena) => void>();
  const onFinVista = vi.fn<() => void>();
  const onSeleccionar = vi.fn<(ids: string[], sumar: boolean) => void>();
  const vista = (s: string[], x: Escena) => (
    <PanelPropiedades escena={x} seleccion={s} onAplicar={vi.fn()} onVista={onVista} onFinVista={onFinVista} onSeleccionar={onSeleccionar} {...(conPagina ? { onPagina } : {})} />
  );
  const r = render(vista(seleccion, e));
  return { onPagina, onVista, onFinVista, onSeleccionar, rerender: (s: string[], x: Escena) => r.rerender(vista(s, x)) };
}
const seccion = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-pagina-ajustes]");
const tamano = (): HTMLSelectElement => document.querySelector<HTMLSelectElement>('select[aria-label="Tamaño de la página"]') as HTMLSelectElement;
const campo = (nombre: string): HTMLInputElement => document.querySelector<HTMLInputElement>(`input[aria-label="${nombre}"]`) as HTMLInputElement;
const boton = (nombre: string): HTMLButtonElement | null => document.querySelector<HTMLButtonElement>(`button[aria-label="${nombre}"]`);
const fuera = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-pagina-fuera]");
const escribir = (nombre: string, valor: string): void => {
  fireEvent.change(campo(nombre), { target: { value: valor } });
  fireEvent.blur(campo(nombre));
};
const adentro = (...extra: Array<Record<string, unknown>>): Escena => escena(forma("a", 100, 100), ...extra);

describe("Y25 — la sección «Página» del panel", () => {
  it("con nada elegido aparece; al elegir algo desaparece, y vuelve al soltarlo", () => {
    const p = panel(adentro());
    expect(seccion()).not.toBeNull();
    p.rerender(["a"], adentro());
    expect(seccion()).toBeNull();
    p.rerender([], adentro());
    expect(seccion()).not.toBeNull();
  });

  it("sin `onPagina` el panel es el de siempre: no ofrece los ajustes", () => {
    panel(adentro(), [], false);
    expect(seccion()).toBeNull();
    expect(document.querySelector("[data-propiedades-vacio]")).toBeTruthy();
  });

  it("el menú de tamaño marca el actual: «Personalizado» si no es ninguno", () => {
    panel(escena(forma("a", 0, 0)));
    expect(tamano().value).toBe("personalizado"); // la escena de las pruebas mide 1000 × 600
    cleanup();
    panel(fijarPagina(escena(forma("a", 0, 0)), { ancho: 794, alto: 1123 }));
    expect(tamano().value).toBe("a4-vertical");
    expect([...tamano().options].some((o) => o.value === "personalizado")).toBe(false);
  });

  it("elegir un tamaño pide ese ancho y ese alto, y solo eso", () => {
    const p = panel(adentro());
    fireEvent.change(tamano(), { target: { value: "a4-horizontal" } });
    expect(p.onPagina).toHaveBeenCalledTimes(1);
    expect(p.onPagina).toHaveBeenCalledWith({ ancho: 1123, alto: 794 });
  });

  it("«Ancho» y «Alto» cambian de a uno, y se acotan a los límites del modelo", () => {
    const p = panel(adentro());
    escribir("Ancho de la página", "800");
    expect(p.onPagina).toHaveBeenLastCalledWith({ ancho: 800 });
    escribir("Alto de la página", "5");
    expect(p.onPagina).toHaveBeenLastCalledWith({ alto: 100 });
    escribir("Ancho de la página", "99999");
    expect(p.onPagina).toHaveBeenLastCalledWith({ ancho: 10000 });
  });

  it("los campos muestran el tamaño de la página", () => {
    panel(adentro());
    expect(campo("Ancho de la página").value).toBe("1000");
    expect(campo("Alto de la página").value).toBe("600");
  });

  it("sin fondo: el interruptor está en «Sí» y no hay selector de color; con fondo, sí", () => {
    panel(adentro());
    expect(boton("Página sin fondo (transparente)")?.getAttribute("aria-pressed")).toBe("true");
    expect([...document.querySelectorAll("button")].some((b) => /^Color de fondo de la página/.test(b.getAttribute("aria-label") ?? ""))).toBe(false);
    cleanup();
    panel(fijarPagina(adentro(), { fondo: "#112233" }));
    expect(boton("Página sin fondo (transparente)")?.getAttribute("aria-pressed")).toBe("false");
    expect([...document.querySelectorAll("button")].some((b) => /^Color de fondo de la página/.test(b.getAttribute("aria-label") ?? ""))).toBe(true);
  });

  it("poner fondo por primera vez usa el del tema; quitarlo pide transparente; volver a ponerlo recuerda el último color", () => {
    const p = panel(adentro());
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(p.onPagina).toHaveBeenLastCalledWith({ fondo: "var(--background)" });
    p.rerender([], fijarPagina(adentro(), { fondo: "#ABCDEF" }));
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(p.onPagina).toHaveBeenLastCalledWith({ fondo: null });
    p.rerender([], adentro()); // ya sin fondo
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(p.onPagina).toHaveBeenLastCalledWith({ fondo: "#ABCDEF" });
  });

  it("el color del fondo: el selector libre da vista previa, y el color se confirma al pedirlo", () => {
    const p = panel(fijarPagina(adentro(), { fondo: "#112233" }));
    fireEvent.click([...document.querySelectorAll("button")].find((b) => /^Color de fondo de la página/.test(b.getAttribute("aria-label") ?? "")) as HTMLElement);
    const libre = document.querySelector<HTMLInputElement>('input[type="color"]') as HTMLInputElement;
    fireEvent.change(libre, { target: { value: "#445566" } });
    expect(p.onVista).toHaveBeenCalled();
    const previa = (p.onVista.mock.calls.at(-1)?.[0] as (x: Escena) => Escena)(adentro());
    expect(previa.fondo?.toLowerCase()).toBe("#445566");
    expect(p.onPagina).not.toHaveBeenCalled(); // una vista previa no es una confirmación
    const token = [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Fondo (tema)");
    expect(token).toBeTruthy(); // el color del tema «Fondo» está entre las pastillas
    fireEvent.click(token as HTMLElement);
    expect(p.onPagina).toHaveBeenLastCalledWith({ fondo: "var(--background)" });
  });
});

describe("Y25 — el aviso de lo que queda fuera", () => {
  it("sin nada fuera no hay aviso", () => {
    panel(adentro());
    expect(fuera()).toBeNull();
  });

  it("uno solo: singular; varios: plural; con el botón «Elegirlos»", () => {
    const uno = escena(forma("a", 100, 100), forma("b", 2000, 100));
    const p = panel(uno);
    expect(fuera()?.textContent).toContain("1 elemento queda fuera o cortado por la página.");
    fireEvent.click(fuera()?.querySelector("button") as HTMLElement);
    expect(p.onSeleccionar).toHaveBeenCalledWith(["b"], false);
    cleanup();
    const dos = escena(forma("a", 100, 100), forma("b", 2000, 100), forma("c", -300, 0));
    const q = panel(dos);
    expect(fuera()?.textContent).toContain("2 elementos quedan fuera o cortados por la página.");
    fireEvent.click(fuera()?.querySelector("button") as HTMLElement);
    expect(q.onSeleccionar).toHaveBeenCalledWith(["b", "c"], false);
  });

  it("un elemento cortado por el borde cuenta; uno justo en el borde, no", () => {
    panel(escena(forma("a", 950, 100, 100, 60), forma("b", 900, 540, 100, 60)));
    expect(fuera()?.textContent).toContain("1 elemento queda");
  });

  it("el aviso es una región de estado (se anuncia)", () => {
    panel(escena(forma("a", 2000, 0)));
    expect(fuera()?.getAttribute("role")).toBe("status");
  });
});

// ─── El editor entero ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

function editor(e: Escena) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  const zoom = (): number => {
    const g = document.querySelector("[data-dibujo-pagina]")?.parentElement?.getAttribute("transform") ?? "";
    return Number(/scale\(([-\d.e]+)\)/.exec(g)?.[1]);
  };
  return {
    lienzo,
    onCambio,
    zoom,
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
    deshacer: () => fireEvent.keyDown(lienzo, { key: "z", ctrlKey: true }),
    rehacer: () => fireEvent.keyDown(lienzo, { key: "y", ctrlKey: true }),
  };
}

describe("Y25 — en el editor", () => {
  it("elegir un tamaño es una entrada de historial, cambia solo el ancho y el alto, y no toca los elementos", () => {
    const m = editor(adentro());
    fireEvent.change(tamano(), { target: { value: "a4-vertical" } });
    expect(m.cuenta()).toBe(1);
    expect([m.ultima().ancho, m.ultima().alto]).toEqual([794, 1123]);
    expect(m.ultima().elementos).toEqual(adentro().elementos);
    expect(m.ultima().fondo).toBeNull();
  });

  it("deshacer y rehacer devuelven el tamaño", () => {
    const m = editor(adentro());
    fireEvent.change(tamano(), { target: { value: "cuadrada" } });
    m.deshacer();
    expect([m.ultima().ancho, m.ultima().alto]).toEqual([1000, 600]);
    m.rehacer();
    expect([m.ultima().ancho, m.ultima().alto]).toEqual([1000, 1000]);
  });

  it("cambiar el tamaño ajusta la vista; cambiar solo el fondo, no", () => {
    const m = editor(adentro());
    const antes = m.zoom();
    fireEvent.change(tamano(), { target: { value: "a4-vertical" } });
    expect(m.zoom()).not.toBe(antes);
    const conTamano = m.zoom();
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(m.zoom()).toBe(conTamano);
  });

  it("el anuncio dice el tamaño y, si queda algo fuera, cuánto", () => {
    const m = editor(escena(forma("a", 900, 500, 100, 60), forma("b", 100, 100)));
    fireEvent.change(tamano(), { target: { value: "cuadrada" } });
    expect(m.anuncio()).toBe("Página de 1000 × 1000.");
    escribirEnEditor("Ancho de la página", "500");
    expect(m.anuncio()).toBe("Página de 500 × 1000. 1 elemento queda fuera o cortado por la página.");
  });

  it("el fondo: se pone, se anuncia, entra al historial y llega al SVG exportado", () => {
    const m = editor(adentro());
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(m.ultima().fondo).toBe("var(--background)");
    expect(m.anuncio()).toBe("Fondo cambiado.");
    // El fondo de la escena llega al SVG exportado (el token se resuelve al color del tema elegido) y con «sin fondo» no sale.
    const conFondo = svgDeEscena(fijarPagina(m.ultima(), { fondo: "#123456" }), { tema: "claro", fondo: true }).svg;
    expect(conFondo).toContain("#123456");
    expect(svgDeEscena(fijarPagina(m.ultima(), { fondo: "#123456" }), { tema: "claro", fondo: false }).svg).not.toContain("#123456");
    fireEvent.click(boton("Página sin fondo (transparente)") as HTMLElement);
    expect(m.ultima().fondo).toBeNull();
    expect(m.anuncio()).toBe("Fondo transparente.");
    expect(m.cuenta()).toBe(2);
  });

  it("la vista previa del color no entra al historial hasta confirmarla", () => {
    const m = editor(fijarPagina(adentro(), { fondo: "#112233" }));
    fireEvent.click([...document.querySelectorAll("button")].find((b) => /^Color de fondo de la página/.test(b.getAttribute("aria-label") ?? "")) as HTMLElement);
    const libre = document.querySelector<HTMLInputElement>('input[type="color"]') as HTMLInputElement;
    fireEvent.change(libre, { target: { value: "#445566" } });
    expect(m.cuenta()).toBe(0);
    fireEvent.blur(libre);
    expect(m.cuenta()).toBe(1);
    expect(m.ultima().fondo?.toLowerCase()).toBe("#445566");
  });

  it("«Elegirlos» elige lo que quedó fuera, y con eso elegido la sección de página desaparece", () => {
    editor(escena(forma("a", 100, 100), forma("b", 2000, 100)));
    fireEvent.click(fuera()?.querySelector("button") as HTMLElement);
    expect(seccion()).toBeNull();
  });
});

function escribirEnEditor(nombre: string, valor: string): void {
  escribir(nombre, valor);
}

describe("Y25 — «Girar la página»", () => {
  it("está en el registro una sola vez, en Vista, sin atajo", () => {
    const c = comando("girar-pagina");
    expect(c.etiqueta).toBe("Girar la página");
    expect(c.orden).toEqual({ tipo: "girar-pagina" });
    expect(c.atajos).toBeUndefined();
    expect(COMANDOS.filter((x) => x.orden.tipo === "girar-pagina")).toHaveLength(1);
  });

  it("el buscador lo encuentra por «orientación», «vertical» y «apaisado»", () => {
    expect(SINONIMOS_POR_COMANDO["girar-pagina"]).toBeDefined();
    for (const q of ["orientación", "vertical", "apaisado", "girar"]) expect(buscarComandos(q, COMANDOS).map((r) => r.comando.id), q).toContain("girar-pagina");
  });

  it("intercambia ancho y alto en una entrada de historial, ajusta la vista y lo anuncia", () => {
    const m = editor(adentro());
    const antes = m.zoom();
    fireEvent.click(botonCinta("Girar la página"));
    expect(m.cuenta()).toBe(1);
    expect([m.ultima().ancho, m.ultima().alto]).toEqual([600, 1000]);
    expect(m.anuncio()).toBe("Página girada: 600 × 1000.");
    expect(m.zoom()).not.toBe(antes);
    m.deshacer();
    expect([m.ultima().ancho, m.ultima().alto]).toEqual([1000, 600]);
  });

  it("en una página cuadrada no cambia nada y lo dice", () => {
    const m = editor(fijarPagina(adentro(), { ancho: 500, alto: 500 }));
    fireEvent.click(botonCinta("Girar la página"));
    expect(m.cuenta()).toBe(0);
    expect(m.anuncio()).toBe("La página ya es cuadrada.");
  });

  it("si al girar queda algo fuera, el anuncio lo dice", () => {
    const m = editor(escena(forma("a", 900, 100)));
    fireEvent.click(botonCinta("Girar la página"));
    expect(m.anuncio()).toBe("Página girada: 600 × 1000. 1 elemento queda fuera o cortado por la página.");
  });
});
