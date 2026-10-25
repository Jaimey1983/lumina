import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Escena, Forma, Linea } from "@lumina/drawing";
import { EditorLibre } from "./editor-libre.js";
import { AVISO_SIN_JERARQUIA, MAX_FILAS_ARBOL } from "./dialogo-esquema.js";
import { botonCinta, escena } from "./util-pruebas.js";

afterEach(cleanup);

const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");

function montar() {
  const onCambio = vi.fn<(s: Escena) => void>();
  render(<EditorLibre escena={escena()} onCambio={onCambio} onCerrar={() => {}} />);
  return { onCambio, ultima: () => onCambio.mock.calls.at(-1)?.[0] as Escena };
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
const arbol = (): HTMLElement | null => screen.queryByRole("list", { name: "Vista previa de la jerarquía" });
const casilla = (): HTMLInputElement | null => screen.queryByRole("checkbox", { name: "Usar la primera línea como tema" });

/** El árbol como texto: cada ítem con su profundidad (cuántas listas lo rodean dentro de la vista previa). */
function aTexto(raiz: HTMLElement): string[] {
  const filas: string[] = [];
  const visitar = (ul: Element, nivel: number): void => {
    for (const li of Array.from(ul.children)) {
      const propio = Array.from(li.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join("")
        .trim();
      filas.push(`${"  ".repeat(nivel)}${propio}`);
      const hija = Array.from(li.children).find((c) => c.tagName === "UL");
      if (hija) visitar(hija, nivel + 1);
    }
  };
  visitar(raiz, 0);
  return filas;
}

const PLANO = "La célula\nMembrana\nNúcleo\nCitoplasma";

describe("Y36 — la vista previa muestra la jerarquía", () => {
  it("vacío: no hay árbol", () => {
    montar();
    abrir();
    expect(arbol()).toBeNull();
    escribir("   \n  ");
    expect(arbol()).toBeNull();
  });

  it("con sangría: el árbol anidado de siempre", () => {
    montar();
    abrir();
    escribir("Tema\n  Idea 1\n    Detalle\n  Idea 2");
    expect(aTexto(arbol() as HTMLElement)).toEqual(["Tema", "  Idea 1", "    Detalle", "  Idea 2"]);
  });

  it("con numeración y sin sangría: 1.1 y 1.1.1 son hijos y nietos", () => {
    montar();
    abrir();
    escribir("1. Tema\n1.1 Idea\n1.1.1 Detalle\n1.2 Otra\n2. Otro");
    expect(aTexto(arbol() as HTMLElement)).toEqual(["Tema", "  Idea", "    Detalle", "  Otra", "Otro"]);
    expect(casilla()).toBeNull(); // hay jerarquía: nada que avisar
  });

  it("con encabezados #", () => {
    montar();
    abrir();
    escribir("# Tema\n## Idea 1\n### Detalle\n## Idea 2");
    expect(aTexto(arbol() as HTMLElement)).toEqual(["Tema", "  Idea 1", "    Detalle", "  Idea 2"]);
  });

  it("la lista tiene nombre y nodo por ítem: se recorre con un lector de pantalla", () => {
    montar();
    abrir();
    escribir("Tema\n  A\n  B");
    const l = arbol() as HTMLElement;
    expect(l.tagName).toBe("UL");
    expect(within(l).getAllByRole("listitem")).toHaveLength(3);
  });

  it("tope de filas: 60 y «… y N más»; el árbol real sigue siendo el completo", () => {
    const { ultima } = montar();
    abrir();
    const lineasTexto = ["Tema", ...Array.from({ length: 75 }, (_v, i) => `  Nodo ${i}`)];
    escribir(lineasTexto.join("\n"));
    expect(MAX_FILAS_ARBOL).toBe(60);
    expect(within(arbol() as HTMLElement).getAllByRole("listitem")).toHaveLength(60);
    expect(document.querySelector("[data-esquema-arbol-mas]")?.textContent?.trim()).toBe("… y 16 más");
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(76);
  });

  it("justo en el tope no hay «… y N más»", () => {
    montar();
    abrir();
    escribir(["Tema", ...Array.from({ length: 59 }, (_v, i) => `  N${i}`)].join("\n"));
    expect(within(arbol() as HTMLElement).getAllByRole("listitem")).toHaveLength(60);
    expect(document.querySelector("[data-esquema-arbol-mas]")).toBeNull();
  });
});

describe("Y36 — sin jerarquía: aviso y «primera línea como tema»", () => {
  it("el aviso y la casilla aparecen solo cuando no se detecta jerarquía", () => {
    montar();
    abrir();
    escribir("Una\nDos");
    expect(casilla()).toBeNull();
    expect(vista()).not.toContain(AVISO_SIN_JERARQUIA);
    escribir(PLANO);
    expect(casilla()).not.toBeNull();
    expect(vista()).toContain(AVISO_SIN_JERARQUIA);
    escribir("Tema\n  A\n  B");
    expect(casilla()).toBeNull();
    expect(vista()).not.toContain(AVISO_SIN_JERARQUIA);
  });

  it("la casilla viene desmarcada y está descrita por la región de avisos", () => {
    montar();
    abrir();
    escribir(PLANO);
    const c = casilla() as HTMLInputElement;
    expect(c.checked).toBe(false);
    const regionId = c.getAttribute("aria-describedby") as string;
    expect(document.getElementById(regionId)?.textContent).toContain(AVISO_SIN_JERARQUIA);
    expect(document.getElementById(regionId)?.getAttribute("role")).toBe("status");
  });

  it("sin marcar, el esquema plano sigue dando un árbol de raíces sueltas (como antes)", () => {
    const { ultima } = montar();
    abrir();
    escribir(PLANO);
    expect(aTexto(arbol() as HTMLElement)).toEqual(["La célula", "Membrana", "Núcleo", "Citoplasma"]);
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(4);
    expect(lineas(ultima())).toHaveLength(0);
  });

  it("marcarla rehace el árbol y lo que se crea: una raíz con sus hijos conectados", () => {
    const { ultima } = montar();
    abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    expect(aTexto(arbol() as HTMLElement)).toEqual(["La célula", "  Membrana", "  Núcleo", "  Citoplasma"]);
    expect(vista()).not.toContain(AVISO_SIN_JERARQUIA); // ya hay jerarquía
    expect(casilla()?.checked).toBe(true); // la casilla sigue ahí para poder desmarcarla
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(4);
    expect(lineas(ultima())).toHaveLength(3);
  });

  it("desmarcarla vuelve a las raíces sueltas", () => {
    montar();
    abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    fireEvent.click(casilla() as HTMLInputElement);
    expect(aTexto(arbol() as HTMLElement)).toEqual(["La célula", "Membrana", "Núcleo", "Citoplasma"]);
    expect(vista()).toContain(AVISO_SIN_JERARQUIA);
  });

  it("se desmarca sola cuando el esquema deja de estar plano, y al volver a quedar plano empieza desmarcada", () => {
    montar();
    abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    escribir("La célula\n  Membrana\nNúcleo\nCitoplasma"); // ahora hay sangría
    expect(casilla()).toBeNull();
    escribir(PLANO);
    expect(casilla()?.checked).toBe(false);
    expect(aTexto(arbol() as HTMLElement)).toEqual(["La célula", "Membrana", "Núcleo", "Citoplasma"]);
  });

  it("Ctrl+Enter acepta con la casilla marcada", () => {
    const { ultima } = montar();
    const d = abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    fireEvent.keyDown(d, { key: "Enter", ctrlKey: true });
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(lineas(ultima())).toHaveLength(3);
  });

  it("Escape cierra sin dejar nada, también con la casilla marcada", () => {
    const { onCambio } = montar();
    const d = abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    fireEvent.keyDown(d, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Esquema a diagrama" })).toBeNull();
    expect(onCambio).not.toHaveBeenCalled();
  });

  it("al reabrir el diálogo la casilla vuelve desmarcada", () => {
    montar();
    const d = abrir();
    escribir(PLANO);
    fireEvent.click(casilla() as HTMLInputElement);
    fireEvent.keyDown(d, { key: "Escape" });
    abrir();
    escribir(PLANO);
    expect(casilla()?.checked).toBe(false);
  });
});

describe("Y37b — el anuncio del esquema cuando no cabe", () => {
  const anuncio = (): string => document.querySelector("[data-dibujo-anuncio]")?.textContent ?? "";
  const CELULA = "La célula\n  Membrana\n    Fosfolípidos\n    Proteínas\n  Núcleo\n    ADN\n    Nucléolo\n  Citoplasma\n    Mitocondrias\n    Ribosomas\n    Retículo endoplasmático\n  Pared celular";

  it("un esquema que cabe: «Esquema creado: 12 nodos.» sin aviso", () => {
    montar();
    abrir();
    escribir(CELULA);
    fireEvent.click(crear());
    expect(anuncio()).toBe("Esquema creado: 12 nodos.");
  });

  it("un esquema que no cabe en árbol: se crea igual y el anuncio lo dice", () => {
    const { ultima } = montar();
    abrir();
    escribir(["Tema", ...Array.from({ length: 5 }, (_v, r) => [`  Rama ${r}`, ...Array.from({ length: 4 }, (_w, h) => `    Hoja ${r}.${h}`)].join("\n"))].join("\n"));
    fireEvent.click(crear());
    expect(formas(ultima())).toHaveLength(26);
    expect(anuncio()).toBe("Esquema creado: 26 nodos. Es más grande que la página: parte queda fuera.");
  });

  it("el mismo esquema en radial se encaja y no avisa", () => {
    montar();
    abrir();
    escribir(["Tema", ...Array.from({ length: 5 }, (_v, r) => [`  Rama ${r}`, ...Array.from({ length: 3 }, (_w, h) => `    Hoja ${r}.${h}`)].join("\n"))].join("\n"));
    fireEvent.click(screen.getByRole("radio", { name: "Radial" }));
    fireEvent.click(crear());
    expect(anuncio()).toBe("Esquema creado: 21 nodos.");
  });
});
