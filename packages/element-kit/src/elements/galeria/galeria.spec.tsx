/**
 * T17 — Galería / lightbox: widget nuevo (no hay widget viejo con quien comparar paridad), así que se
 * prueba su render por disposición, la normalización de JSON incompleto, el lightbox (abrir/cerrar,
 * Escape devuelve el foco, flechas, teclado, zoom, carga diferida), el aviso de `alt` faltante, los
 * presets y su registro como `ElementDefinition`.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../../index.js";
import {
  DEFAULT_GALERIA_CONFIG,
  createDefaultGaleriaBlock,
  faltaAlt,
  normalizeGaleriaWidget,
} from "../../widgets/galeria/index.js";
import { galeriaDefinition, GALERIA_PRESETS } from "./galeria-definition.js";
import type { GaleriaConfig, GaleriaEstado } from "./galeria-types.js";

// jsdom no calcula layout (Embla no mide los slides): se sustituye por un doble con su API. Prueba
// el CONTRATO del lightbox con Embla; el deslizamiento real se verifica en el navegador.
vi.mock("embla-carousel-react", async () => {
  const React = await import("react");
  type Escucha = () => void;
  function useEmbla(opciones: { startIndex?: number }) {
    const [api, setApi] = React.useState<unknown>(null);
    const inicio = React.useRef(opciones.startIndex ?? 0);
    const ref = React.useCallback((nodo: HTMLElement | null) => {
      if (!nodo) return;
      const total = nodo.querySelectorAll('[aria-roledescription="slide"]').length;
      let actual = inicio.current;
      const escuchas = new Map<string, Set<Escucha>>();
      const avisar = () => escuchas.get("select")?.forEach((f) => f());
      const instancia = {
        selectedScrollSnap: () => actual,
        scrollTo: (i: number) => {
          actual = i;
          avisar();
        },
        scrollPrev: () => {
          actual = Math.max(0, actual - 1);
          avisar();
        },
        scrollNext: () => {
          actual = Math.min(total - 1, actual + 1);
          avisar();
        },
        on(e: string, f: Escucha) {
          if (!escuchas.has(e)) escuchas.set(e, new Set());
          escuchas.get(e)?.add(f);
          return instancia;
        },
        off(e: string, f: Escucha) {
          escuchas.get(e)?.delete(f);
          return instancia;
        },
      };
      setApi(instancia);
    }, []);
    return [ref, api];
  }
  return { default: useEmbla };
});

afterEach(() => cleanup());

const Viewer = galeriaDefinition.Viewer;
const Editor = galeriaDefinition.Editor;
const Props = galeriaDefinition.Propiedades;

function con(cfg: Record<string, unknown> = {}): GaleriaEstado {
  const base = createDefaultGaleriaBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as GaleriaEstado;
}

const miniaturas = () => screen.getAllByRole("button", { name: /^Ampliar imagen/ });
const dialogo = () => screen.getByRole("dialog");
const contador = () => within(dialogo()).getByText(/^\d+ \/ \d+$/).textContent;

describe("registro", () => {
  it("está registrado como widget del lienzo, sin puntuación (DT7)", () => {
    const def = elementRegistry.obtener("galeria") as ElementDefinition<GaleriaEstado, GaleriaConfig> | undefined;
    expect(def).toBe(galeriaDefinition);
    expect(def?.catalogo).toMatchObject({ nombre: "Galería", familia: "widget", grupo: "lienzo" });
    expect(def?.puntuacion).toBeUndefined();
    expect(def?.crearPorDefecto().tipo).toBe("galeria");
  });
});

describe("render por disposición", () => {
  for (const disposicion of ["rejilla", "mosaico", "tira"]) {
    it(`${disposicion}: una miniatura por imagen, con carga diferida y texto alternativo`, () => {
      const { container } = render(<Viewer estado={con({ disposicion })} config={{}} />);
      expect(container.querySelector(`[data-disposicion="${disposicion}"]`)).not.toBeNull();
      const imgs = container.querySelectorAll("img");
      expect(imgs).toHaveLength(DEFAULT_GALERIA_CONFIG.imagenes.length);
      for (const img of imgs) {
        expect(img.getAttribute("loading")).toBe("lazy");
        expect(img.getAttribute("decoding")).toBe("async");
        expect(img.getAttribute("alt")).toMatch(/Imagen de ejemplo/);
      }
    });
  }

  it("una imagen decorativa tiene alt vacío; los pies solo con `mostrarTitulos`", () => {
    const base = createDefaultGaleriaBlock();
    const imagenes = base.configuracion.imagenes.map((i, k) => (k === 0 ? { ...i, decorativa: true } : i));
    const { container, rerender } = render(<Viewer estado={con({ imagenes })} config={{}} />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.textContent).not.toContain("Imagen 1");
    rerender(<Viewer estado={con({ imagenes, mostrarTitulos: true })} config={{}} />);
    expect(container.textContent).toContain("Imagen 1");
  });

  it("sin imágenes avisa en vez de mostrar un hueco", () => {
    render(<Viewer estado={con({ imagenes: [] })} config={{}} />);
    expect(screen.getByRole("note").textContent).toContain("no tiene imágenes");
  });
});

describe("normalización de JSON incompleto", () => {
  it("un bloque vacío recibe los valores por defecto", () => {
    const n = normalizeGaleriaWidget({});
    expect(n.tipo).toBe("galeria");
    expect(n.configuracion).toMatchObject({ disposicion: "rejilla", columnas: 3, lightbox: true, mostrarTitulos: false });
    expect(n.configuracion.imagenes.length).toBeGreaterThan(0);
  });

  it("acota números, descarta imágenes inválidas y repara ids repetidos", () => {
    const n = normalizeGaleriaWidget({
      configuracion: {
        disposicion: "espiral",
        columnas: 99,
        espacio: -5,
        proporcion: 7,
        imagenes: [
          { id: "a", url: "https://x/1.png", alt: "uno" },
          { id: "a", url: "https://x/2.png" },
          { id: "c", url: "" },
          "basura",
          { url: 5 },
        ],
      } as unknown,
    });
    expect(n.configuracion.disposicion).toBe("rejilla");
    expect(n.configuracion.columnas).toBe(6);
    expect(n.configuracion.espacio).toBe(0);
    expect(n.configuracion.proporcion).toBe("horizontal");
    expect(n.configuracion.imagenes.map((i) => i.id)).toEqual(["a", "a-b"]);
    expect(n.configuracion.imagenes[1].alt).toBe("");
  });

  it("el visor no se rompe con un bloque sin configuración", () => {
    const roto = { tipo: "galeria", x: 1, y: 1, ancho: 10, alto: 10 } as unknown as GaleriaEstado;
    expect(() => render(<Viewer estado={roto} config={{}} />)).not.toThrow();
  });

  it("faltaAlt: vacío o solo espacios, salvo decorativa", () => {
    expect(faltaAlt({ id: "1", url: "u", alt: "  " })).toBe(true);
    expect(faltaAlt({ id: "1", url: "u", alt: "x" })).toBe(false);
    expect(faltaAlt({ id: "1", url: "u", alt: "", decorativa: true })).toBe(false);
  });
});

describe("lightbox", () => {
  it("abre al tocar una miniatura en su posición, con contador y diálogo accesible", () => {
    render(<Viewer estado={con()} config={{}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(miniaturas()[2]);
    expect(dialogo()).toBeTruthy();
    expect(contador()).toBe("3 / 6");
    expect(within(dialogo()).getByText("Galería de imágenes")).toBeTruthy();
  });

  it("Escape cierra y devuelve el foco a la miniatura que lo abrió", async () => {
    render(<Viewer estado={con()} config={{}} />);
    const miniatura = miniaturas()[1];
    miniatura.focus();
    fireEvent.click(miniatura);
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    // Radix devuelve el foco en el siguiente turno del navegador.
    await waitFor(() => expect(document.activeElement).toBe(miniatura));
  });

  it("el foco entra en el diálogo al abrir", () => {
    render(<Viewer estado={con()} config={{}} />);
    miniaturas()[0].focus();
    fireEvent.click(miniaturas()[0]);
    expect(dialogo().contains(document.activeElement)).toBe(true);
  });

  it("las flechas de pantalla y del teclado cambian de imagen, con tope en los extremos", () => {
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    const anterior = within(dialogo()).getByRole("button", { name: "Imagen anterior" }) as HTMLButtonElement;
    const siguiente = within(dialogo()).getByRole("button", { name: "Imagen siguiente" }) as HTMLButtonElement;
    expect(anterior.disabled).toBe(true);
    fireEvent.click(siguiente);
    expect(contador()).toBe("2 / 6");
    fireEvent.keyDown(dialogo(), { key: "ArrowRight" });
    expect(contador()).toBe("3 / 6");
    fireEvent.keyDown(dialogo(), { key: "ArrowLeft" });
    expect(contador()).toBe("2 / 6");
    for (let i = 0; i < 10; i++) fireEvent.keyDown(dialogo(), { key: "ArrowRight" });
    expect(contador()).toBe("6 / 6");
    expect(siguiente.disabled).toBe(true);
  });

  it("solo carga la imagen actual y sus vecinas", () => {
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    expect(within(dialogo()).getAllByRole("img", { hidden: true })).toHaveLength(2);
    fireEvent.keyDown(dialogo(), { key: "ArrowRight" });
    expect(within(dialogo()).getAllByRole("img", { hidden: true })).toHaveLength(3);
  });

  it("las diapositivas no activas quedan ocultas a los lectores de pantalla", () => {
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    const slides = dialogo().querySelectorAll('[aria-roledescription="slide"]');
    expect(slides[0].getAttribute("aria-hidden")).toBeNull();
    expect(slides[1].getAttribute("aria-hidden")).toBe("true");
  });

  it("zoom por botones y teclado; se reinicia al cambiar de imagen", () => {
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    const nivel = () => within(dialogo()).getByLabelText("Zoom actual").textContent;
    const reducir = within(dialogo()).getByRole("button", { name: "Reducir" }) as HTMLButtonElement;
    expect(nivel()).toBe("100 %");
    expect(reducir.disabled).toBe(true);
    fireEvent.click(within(dialogo()).getByRole("button", { name: "Ampliar" }));
    expect(nivel()).toBe("150 %");
    fireEvent.keyDown(dialogo(), { key: "+" });
    expect(nivel()).toBe("200 %");
    fireEvent.keyDown(dialogo(), { key: "-" });
    expect(nivel()).toBe("150 %");
    fireEvent.keyDown(dialogo(), { key: "ArrowRight" });
    expect(nivel()).toBe("100 %");
    fireEvent.keyDown(dialogo(), { key: "+" });
    fireEvent.keyDown(dialogo(), { key: "0" });
    expect(nivel()).toBe("100 %");
  });

  it("el pie muestra el título o, si no hay, el texto alternativo", () => {
    const base = createDefaultGaleriaBlock();
    const imagenes = base.configuracion.imagenes.map((i, k) => (k === 0 ? { ...i, titulo: undefined } : i));
    render(<Viewer estado={con({ imagenes })} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    expect(dialogo().textContent).toContain("Imagen de ejemplo 1");
    fireEvent.keyDown(dialogo(), { key: "ArrowRight" });
    expect(dialogo().textContent).toContain("Imagen 2");
  });

  it("el botón Cerrar cierra", () => {
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(miniaturas()[0]);
    fireEvent.click(within(dialogo()).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("con `lightbox` apagado o en miniatura no se puede abrir", () => {
    const sin = render(<Viewer estado={con({ lightbox: false })} config={{}} />);
    expect(screen.queryAllByRole("button", { name: /^Ampliar imagen/ })).toHaveLength(0);
    sin.unmount();
    render(<Viewer estado={con()} config={{ isThumbnail: true }} />);
    expect(screen.queryAllByRole("button", { name: /^Ampliar imagen/ })).toHaveLength(0);
  });
});

describe("editor", () => {
  it("no abre el lightbox, selecciona el bloque y marca las imágenes sin texto alternativo", () => {
    const base = createDefaultGaleriaBlock();
    const imagenes = base.configuracion.imagenes.map((i, k) => (k < 2 ? { ...i, alt: "" } : i));
    const seleccionar = vi.fn();
    const { container } = render(
      <Editor estado={con({ imagenes })} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />,
    );
    expect(screen.queryAllByRole("button", { name: /^Ampliar imagen/ })).toHaveLength(0);
    expect(screen.getAllByRole("img", { name: "Falta el texto alternativo" })).toHaveLength(2);
    fireEvent.pointerDown(container.firstElementChild as Element);
    expect(seleccionar).toHaveBeenCalled();
  });
});

describe("panel de propiedades", () => {
  const abrir = (estado: GaleriaEstado, onChange = vi.fn()) => {
    render(<Props estado={estado} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    return onChange;
  };

  it("avisa de las imágenes sin texto alternativo y marca cada una", () => {
    const base = createDefaultGaleriaBlock();
    const imagenes = base.configuracion.imagenes.map((i, k) => (k === 1 ? { ...i, alt: "" } : i));
    abrir(con({ imagenes }));
    expect(screen.getByRole("alert").textContent).toContain("1 imagen no tiene texto alternativo");
    expect(screen.getByText("Falta el texto alternativo.")).toBeTruthy();
    expect(screen.getByLabelText("Texto alternativo de la imagen 2").getAttribute("aria-invalid")).toBe("true");
  });

  it("sin faltas no hay aviso; marcar decorativa lo resuelve", () => {
    const base = createDefaultGaleriaBlock();
    const imagenes = base.configuracion.imagenes.map((i, k) => (k === 0 ? { ...i, alt: "" } : i));
    cleanup();
    const onChange = abrir(con({ imagenes }));
    fireEvent.click(screen.getAllByRole("checkbox", { name: /decorativa/i })[0]);
    expect(onChange.mock.calls[0][0].configuracion.imagenes[0].decorativa).toBe(true);
    cleanup();
    abrir(con());
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("agregar crea una imagen SIN texto alternativo (obliga a escribirlo) y respeta el máximo", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: /Agregar imagen/ }));
    const nuevas = onChange.mock.calls[0][0].configuracion.imagenes;
    expect(nuevas).toHaveLength(7);
    expect(nuevas[6].alt).toBe("");
    cleanup();
    const muchas = Array.from({ length: 24 }, (_, i) => ({ id: `i${i}`, url: `https://x/${i}.png`, alt: "a" }));
    abrir(con({ imagenes: muchas }));
    expect((screen.getByRole("button", { name: /Agregar imagen/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("mover y quitar imágenes", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: "Bajar imagen 1" }));
    expect(onChange.mock.calls[0][0].configuracion.imagenes.map((i: { id: string }) => i.id).slice(0, 2)).toEqual(["imagen-2", "imagen-1"]);
    fireEvent.click(screen.getByRole("button", { name: "Quitar imagen 3" }));
    expect(onChange.mock.calls[1][0].configuracion.imagenes).toHaveLength(5);
  });

  it("la disposición se elige con botones accesibles", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: "Mosaico" }));
    expect(onChange.mock.calls[0][0].configuracion.disposicion).toBe("mosaico");
  });
});

describe("presets", () => {
  it("existen, con ids únicos, y no tocan las imágenes", () => {
    const ids = GALERIA_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["rejilla", "mosaico", "tira"]));
    const base = con({ imagenes: [{ id: "a", url: "https://x/a.png", alt: "a" }] });
    for (const p of GALERIA_PRESETS) {
      expect(aplicarPreset(base, p).configuracion.imagenes).toEqual(base.configuracion.imagenes);
    }
  });

  it("el preset de tira cambia la disposición y muestra pies", () => {
    const tira = GALERIA_PRESETS.find((p) => p.id === "tira")!;
    expect(aplicarPreset(con(), tira).configuracion).toMatchObject({ disposicion: "tira", mostrarTitulos: true });
  });
});
