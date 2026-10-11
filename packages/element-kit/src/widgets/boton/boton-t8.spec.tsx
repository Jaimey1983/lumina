/**
 * T8 — Botón: estilos, icono, carga, densidad y descarga. La config legada (`variante` +
 * `outline`) se ve igual que antes: su estilo se deduce de ahí.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BotonWidget } from "@lumina/types/widget";
import { mergedBotonConfig, normalizeBotonWidget } from "./boton-config.js";
import { createDefaultBotonBlock } from "./boton-defaults.js";
import { BotonViewer } from "./boton-viewer.js";

afterEach(() => cleanup());

function bloque(parcial: Record<string, unknown> = {}): BotonWidget {
  return { ...createDefaultBotonBlock(), accion: "ninguna", ...parcial } as BotonWidget;
}

const boton = () => screen.getByRole("button") as HTMLButtonElement;

describe("estilo deducido de lo legado", () => {
  it("sin estilo guardado: sólido, contorno si `outline`, enlace si la variante es link", () => {
    expect(mergedBotonConfig(bloque()).estilo).toBe("solid");
    expect(mergedBotonConfig(bloque({ outline: true })).estilo).toBe("outline");
    expect(mergedBotonConfig(bloque({ variante: "link" })).estilo).toBe("link");
  });

  it("un estilo guardado manda sobre `outline`", () => {
    expect(mergedBotonConfig(bloque({ outline: true, estilo: "soft" })).estilo).toBe("soft");
  });

  it("el DOM lleva data-estilo y data-variante", () => {
    render(<BotonViewer block={bloque({ variante: "danger", estilo: "ghost" })} />);
    expect(boton().dataset.estilo).toBe("ghost");
    expect(boton().dataset.variante).toBe("danger");
  });
});

describe("normalización", () => {
  it("por defecto no escribe ninguna opción nueva", () => {
    const n = normalizeBotonWidget(createDefaultBotonBlock()) as unknown as Record<string, unknown>;
    for (const k of ["estilo", "icono", "iconoPosicion", "cargando", "densidad", "archivoNombre"]) {
      expect(k in n, k).toBe(false);
    }
  });

  it("ignora valores inválidos y conserva los válidos", () => {
    const n = normalizeBotonWidget(
      bloque({ estilo: "neon", icono: "no-existe", densidad: "gigante", cargando: true, iconoPosicion: "derecha", archivoNombre: "  guia.pdf " }),
    ) as unknown as Record<string, unknown>;
    expect("estilo" in n).toBe(false);
    expect("icono" in n).toBe(false);
    expect("densidad" in n).toBe(false);
    expect(n.cargando).toBe(true);
    expect(n.iconoPosicion).toBe("derecha");
    expect(n.archivoNombre).toBe("guia.pdf");
  });

  it("la acción `descargar` se conserva", () => {
    expect(normalizeBotonWidget(bloque({ accion: "descargar" })).accion).toBe("descargar");
  });
});

describe("icono", () => {
  it("a la izquierda va antes del texto; a la derecha, después", () => {
    const { container, rerender } = render(<BotonViewer block={bloque({ icono: "descargar" })} />);
    const hijos = () => Array.from(boton().children).map((n) => (n as HTMLElement).dataset.botonIcono ?? "texto");
    expect(hijos()).toEqual(["descargar", "texto"]);
    rerender(<BotonViewer block={bloque({ icono: "descargar", iconoPosicion: "derecha" })} />);
    expect(hijos()).toEqual(["texto", "descargar"]);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("el icono es decorativo (aria-hidden) y el nombre accesible sigue siendo el texto", () => {
    render(<BotonViewer block={bloque({ icono: "estrella", texto: "Favorito" })} />);
    expect(screen.getByRole("button", { name: "Favorito" })).toBeTruthy();
  });
});

describe("cargando", () => {
  it("muestra el indicador, marca aria-busy, bloquea y no emite", () => {
    const emitir = vi.fn();
    const { container } = render(<BotonViewer block={bloque({ cargando: true, icono: "estrella" })} emitir={emitir} />);
    expect(container.querySelector("[data-boton-cargando]")).not.toBeNull();
    expect(container.querySelector("[data-boton-icono]")).toBeNull();
    expect(boton().getAttribute("aria-busy")).toBe("true");
    expect(boton().disabled).toBe(true);
    fireEvent.click(boton());
    expect(emitir).not.toHaveBeenCalled();
  });

  it("sin `cargando` no hay aria-busy y el clic emite", () => {
    const emitir = vi.fn();
    render(<BotonViewer block={bloque()} emitir={emitir} />);
    expect(boton().getAttribute("aria-busy")).toBeNull();
    fireEvent.click(boton());
    expect(emitir).toHaveBeenCalledWith("clic");
  });
});

describe("densidad", () => {
  it("compacta y amplia agregan su clase; normal no agrega ninguna", () => {
    const clases = (d?: string) => {
      const { unmount } = render(<BotonViewer block={bloque(d ? { densidad: d } : {})} />);
      const c = boton().className;
      unmount();
      return c;
    };
    expect(clases("normal")).toBe(clases());
    expect(clases("compacta")).not.toBe(clases());
    expect(clases("amplia")).not.toBe(clases("compacta"));
  });
});

describe("acción descargar", () => {
  it("es un enlace que descarga, sin abrir otra pestaña, y emite el clic", () => {
    const emitir = vi.fn();
    render(
      <BotonViewer
        block={bloque({ accion: "descargar", url: "files.test/guia.pdf", archivoNombre: "guia.pdf" })}
        emitir={emitir}
      />,
    );
    const a = screen.getByRole("link") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toBe("https://files.test/guia.pdf");
    expect(a.getAttribute("download")).toBe("guia.pdf");
    expect(a.getAttribute("target")).toBeNull();
    a.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(a);
    expect(emitir).toHaveBeenCalledWith("clic");
  });

  it("sin nombre de archivo igual lleva `download`; sin URL queda como botón", () => {
    const { unmount } = render(<BotonViewer block={bloque({ accion: "descargar", url: "https://x.test/a.zip" })} />);
    expect(screen.getByRole("link").hasAttribute("download")).toBe(true);
    unmount();
    render(<BotonViewer block={bloque({ accion: "descargar", url: "" })} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("la acción `url` sigue abriendo otra pestaña y no descarga", () => {
    render(<BotonViewer block={bloque({ accion: "url", url: "https://x.test" })} />);
    const a = screen.getByRole("link");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.hasAttribute("download")).toBe(false);
  });
});

describe("micro-press", () => {
  it("el botón va dentro de un WidgetMotion", () => {
    const { container } = render(<BotonViewer block={bloque()} />);
    expect(container.querySelector("[data-widget-motion]")).not.toBeNull();
  });
});

describe("CSS sin clones de Bootstrap", () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "boton.module.css"), "utf8");

  it("ya no hay una regla por variante y modo (.outlineSecondary, .dark:hover, …)", () => {
    expect(css).not.toMatch(/\.outline(Primary|Secondary|Success|Danger|Warning|Info|Light|Dark)\b/);
    expect(css).not.toMatch(/\.(secondary|success|danger|warning|info|light|dark):hover/);
  });

  it("los cinco estilos y los tonos existen", () => {
    for (const clase of ["estiloSolid", "estiloSoft", "estiloOutline", "estiloGhost", "estiloLink"]) {
      expect(css, clase).toContain(`.${clase}`);
    }
  });
});
