/**
 * T6 — paridad del visor del Carousel (Regla 7). Estas pruebas describen la
 * navegación del carrusel casero y se escribieron ANTES de reescribirlo sobre
 * Embla: deben pasar sin cambios con las dos implementaciones. Son agnósticas del
 * DOM: «lo visible» es el texto fuera de nodos `aria-hidden`.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CarouselWidget } from "@lumina/types/widget";
import type { CarouselConfiguracionCompleta } from "./carousel-config.js";
import { createDefaultCarouselBlock } from "./carousel-defaults.js";
import { CarouselViewer } from "./carousel-viewer.js";

// jsdom no calcula layout (Embla no llega a medir las páginas), así que Embla se sustituye por
// un doble con su misma API (selectedScrollSnap, scrollTo/Prev/Next, canScroll*, on/off). Esto
// prueba el CONTRATO del visor; el comportamiento real de Embla (deslizar, loop, autoplay) se
// verifica en el navegador: lumina-frontend/src/visual-tests/carousel-embla.visual.spec.tsx.
const embla = vi.hoisted(() => ({ llamadas: [] as { opciones: Record<string, unknown>; plugins: unknown[] }[] }));

vi.mock("embla-carousel-react", async () => {
  const React = await import("react");
  type Escucha = () => void;
  interface Opciones { loop?: boolean; startIndex?: number }
  function useEmbla(opciones: Opciones, plugins: unknown[] = []) {
    const [api, setApi] = React.useState<unknown>(null);
    const opcionesRef = React.useRef(opciones);
    opcionesRef.current = opciones;
    embla.llamadas.push({ opciones: opciones as Record<string, unknown>, plugins });
    const ref = React.useCallback((nodo: HTMLElement | null) => {
      if (!nodo) return;
      const total = nodo.querySelectorAll('[aria-roledescription="slide"]').length;
      const loop = opcionesRef.current.loop === true;
      let actual = opcionesRef.current.startIndex ?? 0;
      const escuchas = new Map<string, Set<Escucha>>();
      const avisar = () => escuchas.get("select")?.forEach((f) => f());
      const instancia = {
        selectedScrollSnap: () => actual,
        canScrollPrev: () => loop || actual > 0,
        canScrollNext: () => loop || actual < total - 1,
        scrollTo: (i: number) => {
          actual = i;
          avisar();
        },
        scrollPrev: () => {
          actual = actual > 0 ? actual - 1 : loop ? total - 1 : actual;
          avisar();
        },
        scrollNext: () => {
          actual = actual < total - 1 ? actual + 1 : loop ? 0 : actual;
          avisar();
        },
        on(evento: string, f: Escucha) {
          if (!escuchas.has(evento)) escuchas.set(evento, new Set());
          escuchas.get(evento)?.add(f);
          return instancia;
        },
        off(evento: string, f: Escucha) {
          escuchas.get(evento)?.delete(f);
          return instancia;
        },
      };
      setApi(instancia);
    }, []);
    return [ref, api];
  }
  return { default: useEmbla };
});

afterEach(() => {
  cleanup();
  embla.llamadas.length = 0;
  vi.unstubAllGlobals();
});

function visible(container: HTMLElement): string {
  const copia = container.cloneNode(true) as HTMLElement;
  copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return copia.textContent ?? "";
}

function bloque(parcial: Partial<CarouselConfiguracionCompleta> = {}): CarouselWidget {
  const base = createDefaultCarouselBlock();
  return {
    ...base,
    configuracion: {
      ...base.configuracion,
      mostrarFlechasInternas: false,
      ...parcial,
    },
  };
}

const pagina = (n: number) => `ENCABEZADO 0${n}`;

async function esperaPagina(container: HTMLElement, n: number) {
  await waitFor(() => {
    const texto = visible(container);
    expect(texto).toContain(pagina(n));
    for (const otra of [1, 2, 3].filter((x) => x !== n)) expect(texto).not.toContain(pagina(otra));
  });
}

describe("CarouselViewer — paridad de navegación", () => {
  it("arranca en la primera página, sin importar slideActivo guardado", async () => {
    const { container } = render(<CarouselViewer block={bloque({ slideActivo: 2 })} />);
    await esperaPagina(container, 1);
  });

  it("Siguiente y Anterior recorren las páginas", async () => {
    const { container } = render(<CarouselViewer block={bloque()} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 2);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 3);
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await esperaPagina(container, 2);
  });

  it("sin loop, Anterior está desactivado al inicio y Siguiente al final", async () => {
    const { container } = render(<CarouselViewer block={bloque()} />);
    expect((screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 3);
    expect((screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("los puntos llevan a su página y marcan la actual con aria-current", async () => {
    const { container } = render(<CarouselViewer block={bloque()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ir a Página 3" }));
    await esperaPagina(container, 3);
    expect(screen.getByRole("button", { name: "Ir a Página 3" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: "Ir a Página 1" }).getAttribute("aria-current")).toBeNull();
  });

  it("sin mostrarDots no hay puntos", () => {
    render(<CarouselViewer block={bloque({ mostrarDots: false })} />);
    expect(screen.queryByRole("button", { name: /^Ir a / })).toBeNull();
  });

  it("las pestañas de página (mostrarTabsPagina) navegan", async () => {
    const { container } = render(<CarouselViewer block={bloque({ mostrarTabsPagina: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await esperaPagina(container, 2);
  });

  it("las flechas internas también navegan (mostrarFlechasInternas)", async () => {
    const { container } = render(
      <CarouselViewer block={bloque({ mostrarFlechasInternas: true, mostrarBotonSiguiente: false, mostrarBotonAnterior: false })} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 2);
  });

  it("respeta numeroSlides: con 2 páginas, la 2.ª es la última", async () => {
    const { container } = render(<CarouselViewer block={bloque({ numeroSlides: 2 })} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 2);
    expect((screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Ir a Página 3" })).toBeNull();
  });

  it("en miniatura solo se ve la primera página y no hay controles", () => {
    const { container } = render(<CarouselViewer block={bloque()} isThumbnail />);
    const texto = visible(container);
    expect(texto).toContain(pagina(1));
    expect(texto).not.toContain(pagina(2));
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();
  });
});

describe("CarouselViewer — opciones nuevas de T6", () => {
  it("con loop, Anterior está activo al inicio y da la vuelta", async () => {
    const { container } = render(<CarouselViewer block={bloque({ loop: true })} />);
    const anterior = screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement;
    expect(anterior.disabled).toBe(false);
    fireEvent.click(anterior);
    await esperaPagina(container, 3);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 1);
  });

  it("mostrarContador muestra «N / M» y lo mantiene al navegar", async () => {
    render(<CarouselViewer block={bloque({ mostrarContador: true })} />);
    expect(screen.getByText("1 / 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(screen.getByText("2 / 3")).toBeTruthy());
  });

  it("sin mostrarContador no hay contador", () => {
    render(<CarouselViewer block={bloque()} />);
    expect(screen.queryByText(/^\d+ \/ \d+$/)).toBeNull();
  });

  it("las páginas inactivas quedan aria-hidden e inert (no se puede tabular a ellas)", () => {
    const { container } = render(<CarouselViewer block={bloque()} />);
    const paginas = Array.from(container.querySelectorAll('[aria-roledescription="slide"]'));
    expect(paginas).toHaveLength(3);
    expect(paginas[0].getAttribute("aria-hidden")).toBeNull();
    expect(paginas[1].getAttribute("aria-hidden")).toBe("true");
    expect(paginas[1].hasAttribute("inert")).toBe(true);
  });

  it("autoplay activo agrega el plugin; apagado, no", () => {
    render(<CarouselViewer block={bloque({ autoplay: true })} />);
    expect(embla.llamadas.at(-1)?.plugins).toHaveLength(1);
    cleanup();
    embla.llamadas.length = 0;

    render(<CarouselViewer block={bloque({ autoplay: false })} />);
    expect(embla.llamadas.at(-1)?.plugins).toHaveLength(0);
  });

  it("la transición fade no usa Embla (un solo panel, sin loop)", async () => {
    const { container } = render(<CarouselViewer block={bloque({ transicion: "fade" })} />);
    expect(embla.llamadas).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await esperaPagina(container, 2);
  });
});
