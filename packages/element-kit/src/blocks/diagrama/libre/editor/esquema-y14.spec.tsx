import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { COMANDOS, comando } from "./comandos-registro.js";
import { botonCinta, escena, forma } from "./util-pruebas.js";
import { SINONIMOS_POR_COMANDO } from "./sinonimos-comandos.js";
import { buscarComandos } from "./buscar-comandos.js";

afterEach(cleanup);

const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");

function montar(e: Escena = escena()) {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={e} onCambio={onCambio} onCerrar={() => {}} />);
  const lienzo = screen.getByRole("application", { name: "Lienzo de dibujo" }) as unknown as SVGSVGElement;
  return {
    lienzo,
    onCambio,
    ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena,
    cuenta: () => onCambio.mock.calls.length,
    anuncio: () => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "",
  };
}

const abrir = (): HTMLElement => {
  fireEvent.click(botonCinta("Esquema…"));
  return screen.getByRole("dialog", { name: "Esquema a diagrama" });
};
const escribir = (texto: string): void => {
  fireEvent.change(screen.getByRole("textbox", { name: "Esquema" }), { target: { value: texto } });
};
const crear = (): HTMLElement => screen.getByRole("button", { name: "Crear diagrama" });
const vista = (): string => document.querySelector("[data-esquema-vista]")?.textContent ?? "";

describe("Y14 — el comando", () => {
  it("«Esquema…» está en el registro, en Insertar, sin atajo propio, y el buscador lo encuentra", () => {
    const c = comando("esquema");
    expect(c.etiqueta).toBe("Esquema…");
    expect(c.orden).toEqual({ tipo: "esquema" });
    expect(c.atajos).toBeUndefined();
    expect(COMANDOS.filter((x) => x.orden.tipo === "esquema")).toHaveLength(1);
    expect(SINONIMOS_POR_COMANDO.esquema).toBeDefined();
    expect(buscarComandos("esquema", COMANDOS).map((r) => r.comando.id)).toContain("esquema");
    expect(buscarComandos("outline", COMANDOS).map((r) => r.comando.id)).toContain("esquema");
  });
});

describe("Y14 — el diálogo", () => {
  it("abrir: lleva el foco al área de texto y no dibuja nada", () => {
    const { onCambio } = montar();
    const d = abrir();
    expect(d.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Esquema" }));
    expect(onCambio).not.toHaveBeenCalled();
  });

  it("la vista previa cuenta nodos, niveles y raíces en vivo, sin dibujar", () => {
    const { onCambio } = montar();
    abrir();
    expect(vista()).toMatch(/Escribe o pega/);
    escribir("R\n  A\n    A1\n  B");
    expect(vista()).toContain("4 nodos · 3 niveles · 1 raíz");
    escribir("R1\n  A\nR2");
    expect(vista()).toContain("3 nodos · 2 niveles · 2 raíces");
    expect(vista()).toContain("sin conectar entre sí");
    expect(document.querySelector("[data-esquema-vista]")?.getAttribute("aria-live")).toBe("polite");
    expect(onCambio).not.toHaveBeenCalled();
  });

  it("sin nodos, «Crear diagrama» está deshabilitado y no hace nada", () => {
    const { onCambio } = montar();
    abrir();
    expect(crear().getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(crear());
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).not.toBeNull();
    expect(onCambio).not.toHaveBeenCalled();
  });

  it("Cancelar cierra y no deja nada; devuelve el foco al botón de la cinta", () => {
    const { onCambio } = montar();
    const boton = botonCinta("Esquema…");
    boton.focus();
    fireEvent.click(boton);
    escribir("R\n  A");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(onCambio).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(boton);
  });

  it("Escape cierra y no deja nada; no cierra el editor", () => {
    const alCerrar = vi.fn();
    const onCambio = vi.fn();
    render(<EditorLibre escena={escena()} onCambio={onCambio} onCerrar={alCerrar} />);
    fireEvent.click(botonCinta("Esquema…"));
    escribir("R\n  A");
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Esquema" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(onCambio).not.toHaveBeenCalled();
    expect(alCerrar).not.toHaveBeenCalled();
  });

  it("reabrir empieza vacío", () => {
    montar();
    abrir();
    escribir("R\n  A");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    abrir();
    expect((screen.getByRole("textbox", { name: "Esquema" }) as HTMLTextAreaElement).value).toBe("");
  });

  it("Tab no se sale del diálogo", () => {
    montar();
    const d = abrir();
    escribir("A");
    const area = screen.getByRole("textbox", { name: "Esquema" });
    const ultimo = screen.getByRole("button", { name: "Crear diagrama" });
    ultimo.focus();
    fireEvent.keyDown(ultimo, { key: "Tab" });
    expect(d.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(area);
    fireEvent.keyDown(area, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(ultimo);
  });

  it("teclas del diálogo no llegan al editor: Supr no borra lo elegido", () => {
    const { onCambio } = montar(escena(forma("f", 10, 10)));
    abrir();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Esquema" }), { key: "Delete" });
    expect(onCambio).not.toHaveBeenCalled();
  });

  it("las disposiciones son tres, con Árbol por defecto, y se eligen con el teclado", () => {
    montar();
    const d = abrir();
    const radios = within(d).getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.parentElement?.textContent)).toEqual(["Árbol", "Radial", "Jerárquico"]);
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);
    fireEvent.click(radios[2] as HTMLInputElement);
    expect(radios.map((r) => r.checked)).toEqual([false, false, true]);
  });

  it("avisa de más de 200 nodos y de líneas recortadas, en la zona aria-live", () => {
    montar();
    abrir();
    escribir(Array.from({ length: 201 }, (_, i) => (i === 0 ? "r" : ` n${i}`.replace(" ", "  "))).join("\n"));
    expect(vista()).toContain("200 nodos");
    expect(vista()).toMatch(/Hay 201 líneas: solo se crean las primeras 200/);
    escribir(`${"x".repeat(205)}\nb`);
    expect(vista()).toMatch(/1 línea se recortó a 200 caracteres/);
    escribir(Array.from({ length: 200 }, (_, i) => (i === 0 ? "r" : `  n${i}`)).join("\n"));
    expect(vista()).not.toMatch(/solo se crean/);
  });
});

describe("Y14 — aceptar", () => {
  const esquema = "Tema\n  Idea 1\n    Detalle\n  Idea 2";

  it("crea una forma por nodo y un conector ortogonal con flecha por hijo; todo queda elegido", () => {
    const { onCambio, ultima, anuncio } = montar();
    abrir();
    escribir(esquema);
    fireEvent.click(crear());
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(onCambio).toHaveBeenCalledTimes(1);
    const e = ultima();
    expect(formas(e).map((f) => f.texto)).toEqual(["Tema", "Idea 1", "Detalle", "Idea 2"]);
    expect(lineas(e)).toHaveLength(3);
    for (const l of lineas(e)) {
      expect(l.trazado).toBe("ortogonal");
      expect(l.fin).toBe("flecha");
      expect(l.origen && l.destino).toBeTruthy();
    }
    expect(anuncio()).toContain("Esquema creado: 4 nodos.");
    // Quedan elegidos las 4 formas y los 3 conectores.
    expect(screen.getByText(/7 seleccionados/)).toBeTruthy();
  });

  it("es UNA sola entrada de historial: un Deshacer lo quita todo y un Rehacer lo devuelve", () => {
    const inicial = escena(forma("previa", 10, 10));
    const { onCambio, ultima } = montar(inicial);
    abrir();
    escribir(esquema);
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(5);
    fireEvent.click(botonCinta("Deshacer"));
    expect(onCambio).toHaveBeenCalledTimes(2);
    expect(formas(ultima()).map((f) => f.id)).toEqual(["previa"]);
    expect(lineas(ultima())).toHaveLength(0);
    fireEvent.click(botonCinta("Rehacer"));
    expect(formas(ultima())).toHaveLength(5);
  });

  it("respeta lo que ya había y queda dentro de lo que se ve", () => {
    const { ultima } = montar(escena(forma("previa", 10, 10)));
    abrir();
    escribir(esquema);
    fireEvent.click(crear());
    const e = ultima();
    expect(formas(e)[0]?.id).toBe("previa");
    expect(formas(e)[0]?.transformacion).toMatchObject({ x: 10, y: 10 });
    const nuevas = formas(e).slice(1);
    const cx = (Math.min(...nuevas.map((f) => f.transformacion.x)) + Math.max(...nuevas.map((f) => f.transformacion.x + f.transformacion.ancho))) / 2;
    // Vista ajustada a la página de 1000×600: el centro visible es el de la página.
    expect(cx).toBeGreaterThan(300);
    expect(cx).toBeLessThan(700);
  });

  it("Ctrl+Enter en el área de texto acepta; Enter solo escribe", () => {
    const { onCambio, ultima } = montar();
    abrir();
    escribir("A\n  B");
    const area = screen.getByRole("textbox", { name: "Esquema" });
    fireEvent.keyDown(area, { key: "Enter" });
    expect(onCambio).not.toHaveBeenCalled();
    fireEvent.keyDown(area, { key: "Enter", ctrlKey: true });
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(formas(ultima())).toHaveLength(2);
  });

  it("Ctrl+Enter también acepta con el foco en otro control del diálogo", () => {
    const { ultima } = montar();
    abrir();
    escribir("A\n  B");
    const radio = screen.getByRole("radio", { name: "Radial" });
    radio.focus();
    fireEvent.keyDown(radio, { key: "Enter", ctrlKey: true });
    expect(formas(ultima())).toHaveLength(2);
  });

  it("el texto con <, & y comillas llega literal a la forma y no se interpreta", () => {
    const { ultima } = montar();
    abrir();
    escribir(`a < b & c "d" 'e' <b>x</b>\n  &amp; <img src=x onerror=alert(1)>`);
    fireEvent.click(crear());
    expect(formas(ultima()).map((f) => f.texto)).toEqual([`a < b & c "d" 'e' <b>x</b>`, "&amp; <img src=x onerror=alert(1)>"]);
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  it("con más de 200 líneas crea solo 200 y lo avisa", () => {
    const { ultima, anuncio } = montar();
    abrir();
    escribir(Array.from({ length: 201 }, (_, i) => (i === 0 ? "r" : `  n${i}`)).join("\n"));
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(200);
    expect(anuncio()).toContain("sobraron 1");
  });

  it("la disposición elegida se aplica: jerárquico va hacia abajo; árbol, hacia la derecha", () => {
    const sitio = (modo: string) => {
      cleanup();
      const { ultima } = montar();
      abrir();
      escribir("R\n  A");
      fireEvent.click(screen.getByRole("radio", { name: modo }));
      fireEvent.click(crear());
      const [r, a] = formas(ultima()) as [Forma, Forma];
      return { dx: a.transformacion.x - r.transformacion.x, dy: a.transformacion.y - r.transformacion.y };
    };
    expect(sitio("Árbol").dx).toBeGreaterThan(0);
    expect(sitio("Jerárquico").dy).toBeGreaterThan(0);
  });
});
