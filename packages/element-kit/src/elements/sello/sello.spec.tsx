/**
 * T19 — Sello / insignia de logro: widget nuevo (sin widget viejo con quien comparar paridad). Se
 * prueban ambos estados, la transición (anuncio `aria-live`, pulso, confeti diferido), la
 * condición que lo gana, el editor, la normalización, el panel, los presets y el registro. El
 * movimiento reducido está en `sello.reducido.spec.tsx`.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../../index.js";
import { createDefaultSelloBlock, estaGanado, normalizeSelloWidget } from "../../widgets/sello/index.js";
import { selloDefinition, SELLO_PRESETS } from "./sello-definition.js";
import type { SelloConfig, SelloEstado } from "./sello-types.js";

afterEach(() => cleanup());

const Viewer = selloDefinition.Viewer;
const Editor = selloDefinition.Editor;
const Props = selloDefinition.Propiedades;

function con(cfg: Record<string, unknown> = {}): SelloEstado {
  const base = createDefaultSelloBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as SelloEstado;
}

const raiz = (c: HTMLElement) => c.querySelector("[data-estado]") as HTMLElement;
const viva = (c: HTMLElement) => (c.querySelector('[role="status"]') as HTMLElement).textContent;

describe("registro", () => {
  it("está registrado como widget del lienzo, sin puntuación ni eventos (DT7)", () => {
    const def = elementRegistry.obtener("sello") as ElementDefinition<SelloEstado, SelloConfig> | undefined;
    expect(def).toBe(selloDefinition);
    expect(def?.catalogo).toMatchObject({ nombre: "Sello de logro", familia: "widget", grupo: "lienzo" });
    expect(def?.puntuacion).toBeUndefined();
    expect(def?.eventos).toBeUndefined();
  });
});

describe("estados", () => {
  it("sin estado de objeto está bloqueado: candado, texto de bloqueo y nombre accesible", () => {
    const { container } = render(<Viewer estado={con()} config={{}} />);
    expect(raiz(container).getAttribute("data-estado")).toBe("bloqueado");
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Insignia bloqueada: Maestro del tema");
    expect(container.textContent).toContain("Por desbloquear");
    expect(container.textContent).not.toContain("Completaste la unidad");
  });

  it("con `visitado` está ganado: subtítulo y nombre accesible", () => {
    const { container } = render(<Viewer estado={con()} config={{ estadoObjeto: "visitado" }} />);
    expect(raiz(container).getAttribute("data-estado")).toBe("ganado");
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Insignia ganada: Maestro del tema");
    expect(container.textContent).toContain("Completaste la unidad");
    expect(container.textContent).not.toContain("Por desbloquear");
  });

  it("la condición decide qué estado la gana", () => {
    expect(estaGanado("visitado", "visitado")).toBe(true);
    expect(estaGanado("visitado", "seleccionado")).toBe(false);
    expect(estaGanado("seleccionado", "seleccionado")).toBe(true);
    expect(estaGanado("seleccionado", "visitado")).toBe(false);
    expect(estaGanado("visitado", "deshabilitado")).toBe(false);
    expect(estaGanado("visitado", undefined)).toBe(false);
    expect(estaGanado("siempre", undefined)).toBe(true);
  });

  it("con condición «siempre» se ve ganada sin runtime", () => {
    const { container } = render(<Viewer estado={con({ condicion: "siempre" })} config={{}} />);
    expect(raiz(container).getAttribute("data-estado")).toBe("ganado");
  });

  for (const forma of ["circulo", "escudo", "estrella"]) {
    it(`forma ${forma}: dibuja el SVG de la forma en ambos estados`, () => {
      const a = render(<Viewer estado={con({ forma })} config={{}} />);
      expect(raiz(a.container).getAttribute("data-forma")).toBe(forma);
      expect(a.container.querySelector("svg")).not.toBeNull();
      a.unmount();
      const b = render(<Viewer estado={con({ forma })} config={{ estadoObjeto: "visitado" }} />);
      expect(b.container.querySelector("svg")).not.toBeNull();
    });
  }

  it("un color propio válido se aplica como --sl-color; uno inválido se ignora", () => {
    const { container, rerender } = render(<Viewer estado={con({ colorAcento: "#12ab34" })} config={{}} />);
    expect(raiz(container).style.getPropertyValue("--sl-color")).toBe("#12ab34");
    rerender(<Viewer estado={con({ colorAcento: "rojo" })} config={{}} />);
    expect(raiz(container).style.getPropertyValue("--sl-color")).toContain("--lw-color-warning");
  });
});

describe("transición al ganarla", () => {
  it("la región viva está vacía de entrada y anuncia al pasar de bloqueada a ganada", () => {
    const { container, rerender } = render(<Viewer estado={con()} config={{ estadoObjeto: "normal" }} />);
    expect(viva(container)).toBe("");
    rerender(<Viewer estado={con()} config={{ estadoObjeto: "visitado" }} />);
    expect(raiz(container).getAttribute("data-estado")).toBe("ganado");
    expect(viva(container)).toBe("¡Insignia ganada: Maestro del tema!");
  });

  it("si ya estaba ganada al montarse no hay anuncio ni animación", () => {
    const { container } = render(<Viewer estado={con()} config={{ estadoObjeto: "visitado" }} />);
    expect(viva(container)).toBe("");
    expect(container.querySelector('[class*="brillo"]')).toBeNull();
    expect(container.querySelector("[data-confeti]")).toBeNull();
  });

  it("al ganarla con la animación activa hay brillo y, con confeti, se carga la lluvia (diferida)", async () => {
    const { container, rerender } = render(<Viewer estado={con()} config={{}} />);
    expect(container.querySelector("[data-confeti]")).toBeNull();
    rerender(<Viewer estado={con()} config={{ estadoObjeto: "visitado" }} />);
    expect(container.querySelector('[class*="brillo"]')).not.toBeNull();
    await waitFor(() => expect(container.querySelector("[data-confeti]")).not.toBeNull());
  });

  it("sin confeti o sin animación configurados, no se dibujan", async () => {
    const { container, rerender } = render(<Viewer estado={con({ confeti: false, animacion: false })} config={{}} />);
    rerender(<Viewer estado={con({ confeti: false, animacion: false })} config={{ estadoObjeto: "visitado" }} />);
    expect(viva(container)).toContain("Insignia ganada");
    expect(container.querySelector('[class*="brillo"]')).toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("[data-confeti]")).toBeNull();
  });

  it("volver a bloqueada limpia el anuncio y permite ganarla otra vez", () => {
    const { container, rerender } = render(<Viewer estado={con({ confeti: false })} config={{}} />);
    rerender(<Viewer estado={con({ confeti: false })} config={{ estadoObjeto: "visitado" }} />);
    rerender(<Viewer estado={con({ confeti: false })} config={{ estadoObjeto: "normal" }} />);
    expect(viva(container)).toBe("");
    expect(raiz(container).getAttribute("data-estado")).toBe("bloqueado");
    rerender(<Viewer estado={con({ confeti: false })} config={{ estadoObjeto: "visitado" }} />);
    expect(viva(container)).toContain("Insignia ganada");
  });

  it("en miniatura no anima ni anuncia", () => {
    const { container, rerender } = render(<Viewer estado={con()} config={{ isThumbnail: true }} />);
    rerender(<Viewer estado={con()} config={{ isThumbnail: true, estadoObjeto: "visitado" }} />);
    expect(viva(container)).toBe("");
    expect(container.querySelector('[class*="brillo"]')).toBeNull();
  });
});

describe("editor", () => {
  it("previsualiza el estado elegido en el panel, aunque no haya runtime, y selecciona al hacer clic", () => {
    const seleccionar = vi.fn();
    const { container, rerender } = render(
      <Editor estado={con({ vistaPrevia: "ganado" })} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />,
    );
    expect(raiz(container).getAttribute("data-estado")).toBe("ganado");
    fireEvent.pointerDown(raiz(container));
    expect(seleccionar).toHaveBeenCalled();
    rerender(<Editor estado={con({ vistaPrevia: "bloqueado" })} config={{}} onChange={() => undefined} />);
    expect(raiz(container).getAttribute("data-estado")).toBe("bloqueado");
  });
});

describe("normalización de JSON incompleto", () => {
  it("un bloque vacío recibe los valores por defecto", () => {
    const n = normalizeSelloWidget({});
    expect(n.tipo).toBe("sello");
    expect(n.configuracion).toMatchObject({ forma: "circulo", tono: "oro", condicion: "visitado", icono: "trofeo", animacion: true, confeti: true, vistaPrevia: "ganado" });
  });

  it("valores desconocidos o de tipo equivocado vuelven al defecto; los textos se acotan", () => {
    const n = normalizeSelloWidget({
      x: "1" as unknown as number,
      configuracion: { forma: "hexagono", icono: "dragon", titulo: 7, subtitulo: "x".repeat(500), tono: 3, condicion: "nunca", colorAcento: "#zzz", vistaPrevia: "?" } as unknown,
    });
    expect(n.configuracion).toMatchObject({ forma: "circulo", icono: "trofeo", titulo: "Maestro del tema", tono: "oro", condicion: "visitado", vistaPrevia: "ganado" });
    expect(n.configuracion.subtitulo).toHaveLength(120);
    expect(n.configuracion.colorAcento).toBeUndefined();
    expect(n.x).toBe(35);
  });

  it("el visor no se rompe con un bloque sin configuración", () => {
    const roto = { tipo: "sello", x: 1, y: 1, ancho: 10, alto: 10 } as unknown as SelloEstado;
    expect(() => render(<Viewer estado={roto} config={{}} />)).not.toThrow();
  });
});

describe("panel de propiedades", () => {
  const abrir = (estado: SelloEstado, onChange = vi.fn()) => {
    render(<Props estado={estado} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    return onChange;
  };

  it("vista previa, condición, forma, color e icono se eligen con botones accesibles", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: "Bloqueada" }));
    expect(onChange.mock.calls[0][0].configuracion.vistaPrevia).toBe("bloqueado");
    fireEvent.click(screen.getByRole("button", { name: "Seleccionado" }));
    expect(onChange.mock.calls[1][0].configuracion.condicion).toBe("seleccionado");
    fireEvent.click(screen.getByRole("button", { name: "Escudo" }));
    expect(onChange.mock.calls[2][0].configuracion.forma).toBe("escudo");
    fireEvent.click(screen.getByRole("button", { name: "Verde" }));
    expect(onChange.mock.calls[3][0].configuracion.tono).toBe("verde");
    fireEvent.click(screen.getByRole("button", { name: "Icono Cohete" }));
    expect(onChange.mock.calls[4][0].configuracion.icono).toBe("cohete");
  });

  it("textos y casillas de animación", () => {
    const onChange = abrir(con());
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Gran logro" } });
    expect(onChange.mock.calls[0][0].configuracion.titulo).toBe("Gran logro");
    fireEvent.click(screen.getByRole("checkbox", { name: "Confeti" }));
    expect(onChange.mock.calls[1][0].configuracion.confeti).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: /Pulso y brillo/ }));
    expect(onChange.mock.calls[2][0].configuracion.animacion).toBe(false);
  });

  it("aclara que no calcula puntajes", () => {
    abrir(con());
    expect(document.body.textContent).toContain("no calcula ni guarda puntajes");
  });
});

describe("presets", () => {
  it("existen, con ids únicos, y no tocan los textos", () => {
    const ids = SELLO_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const base = con({ titulo: "Mi título", subtitulo: "Mi texto" });
    for (const p of SELLO_PRESETS) {
      const a = aplicarPreset(base, p).configuracion;
      expect(a.titulo).toBe("Mi título");
      expect(a.subtitulo).toBe("Mi texto");
    }
  });

  it("la decorativa queda siempre ganada y sin confeti", () => {
    const p = SELLO_PRESETS.find((x) => x.id === "decorativa")!;
    expect(aplicarPreset(con(), p).configuracion).toMatchObject({ condicion: "siempre", confeti: false, animacion: false });
  });
});
