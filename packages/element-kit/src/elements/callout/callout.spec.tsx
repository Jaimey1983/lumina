/**
 * T16 — Callout / nota: widget nuevo (no hay widget viejo con quien comparar paridad), así que se
 * prueba su render por tono y estilo, la normalización de JSON incompleto, los presets, la
 * accesibilidad y su registro como `ElementDefinition`.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../../index.js";
import {
  CALLOUT_ICONOS,
  CALLOUT_TONOS,
  ICONO_POR_TONO,
  createDefaultCalloutBlock,
  normalizeCalloutWidget,
  resolverIconoCallout,
} from "../../widgets/callout/index.js";
import { calloutDefinition, CALLOUT_PRESETS } from "./callout-definition.js";
import type { CalloutConfig, CalloutEstado } from "./callout-types.js";

afterEach(() => cleanup());

const Viewer = calloutDefinition.Viewer;

function con(cfg: Record<string, unknown> = {}): CalloutEstado {
  const base = createDefaultCalloutBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as CalloutEstado;
}

describe("registro", () => {
  it("está registrado como widget del lienzo, sin puntuación (DT7)", () => {
    const def = elementRegistry.obtener("callout") as ElementDefinition<CalloutEstado, CalloutConfig> | undefined;
    expect(def).toBe(calloutDefinition);
    expect(def?.catalogo).toMatchObject({ nombre: "Callout", familia: "widget", grupo: "lienzo" });
    expect(def?.puntuacion).toBeUndefined();
    expect(def?.apariencia).toEqual({ color: true, tipografia: true, animacion: true });
    expect(def?.crearPorDefecto().tipo).toBe("callout");
  });
});

describe("render por tono", () => {
  for (const t of CALLOUT_TONOS) {
    it(`${t.id}: nota con nombre accesible «${t.label}» y rol ${t.role}`, () => {
      const { container } = render(<Viewer estado={con({ tono: t.id })} config={{}} />);
      const el = screen.getByRole(t.role);
      expect(el.getAttribute("aria-label")).toBe(t.label);
      expect(el.getAttribute("data-tono")).toBe(t.id);
      expect(container.querySelector("svg")).not.toBeNull();
    });
  }

  it("solo el éxito es `status`; el resto, `note`", () => {
    expect(CALLOUT_TONOS.filter((t) => t.role === "status").map((t) => t.id)).toEqual(["exito"]);
  });
});

describe("render por estilo y contenido", () => {
  it("cada estilo se marca en data-estilo", () => {
    for (const estilo of ["barra", "tarjeta", "banda"]) {
      const { unmount } = render(<Viewer estado={con({ estilo })} config={{}} />);
      expect(screen.getByRole("note").getAttribute("data-estilo")).toBe(estilo);
      unmount();
    }
  });

  it("título y cuerpo se muestran; sin título o sin icono se omiten", () => {
    const { container, rerender } = render(<Viewer estado={con({ titulo: "Ojo", cuerpo: "Texto" })} config={{}} />);
    expect(container.textContent).toContain("Ojo");
    expect(container.textContent).toContain("Texto");
    rerender(<Viewer estado={con({ titulo: "Ojo", cuerpo: "Texto", mostrarTitulo: false, mostrarIcono: false })} config={{}} />);
    expect(container.textContent).not.toContain("Ojo");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("el cuerpo enriquecido se sanea: se conserva el formato y se descarta lo peligroso", () => {
    const { container } = render(
      <Viewer
        estado={con({ cuerpo: '<b>importante</b><script>window.__x = 1</script><img src=x onerror="window.__x=1">' })}
        config={{}}
      />,
    );
    expect(container.querySelector("b")?.textContent).toBe("importante");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect((window as unknown as { __x?: number }).__x).toBeUndefined();
  });

  it("un color propio válido se aplica como --co-acento; uno inválido se ignora", () => {
    const { rerender } = render(<Viewer estado={con({ colorAcento: "#12ab34" })} config={{}} />);
    expect(screen.getByRole("note").style.getPropertyValue("--co-acento")).toBe("#12ab34");
    rerender(<Viewer estado={con({ colorAcento: "rojo" })} config={{}} />);
    expect(screen.getByRole("note").style.getPropertyValue("--co-acento")).toBe("");
  });
});

describe("iconos", () => {
  it("`auto` usa el icono del tono y un id desconocido también", () => {
    for (const t of CALLOUT_TONOS) {
      expect(resolverIconoCallout("auto", t.id)).toBe(CALLOUT_ICONOS[ICONO_POR_TONO[t.id]].Icono);
      expect(resolverIconoCallout("no-existe", t.id)).toBe(CALLOUT_ICONOS[ICONO_POR_TONO[t.id]].Icono);
    }
    expect(resolverIconoCallout("libro", "peligro")).toBe(CALLOUT_ICONOS.libro.Icono);
  });
});

describe("normalización de JSON incompleto", () => {
  it("un bloque vacío recibe todos los valores por defecto", () => {
    const n = normalizeCalloutWidget({});
    expect(n.tipo).toBe("callout");
    expect(n.configuracion).toMatchObject({ tono: "info", estilo: "barra", icono: "auto", mostrarIcono: true, mostrarTitulo: true });
    for (const k of ["x", "y", "ancho", "alto"] as const) expect(Number.isFinite(n[k])).toBe(true);
  });

  it("valores desconocidos o de tipo equivocado vuelven al defecto", () => {
    const n = normalizeCalloutWidget({
      x: "10" as unknown as number,
      configuracion: { tono: "rojo", estilo: 3, icono: null, titulo: 5, cuerpo: {}, colorAcento: "#zzz", mostrarIcono: "no" },
    });
    expect(n.configuracion.tono).toBe("info");
    expect(n.configuracion.estilo).toBe("barra");
    expect(n.configuracion.icono).toBe("auto");
    expect(typeof n.configuracion.titulo).toBe("string");
    expect(typeof n.configuracion.cuerpo).toBe("string");
    expect(n.configuracion.colorAcento).toBeUndefined();
    expect(n.x).toBe(15);
  });

  it("el visor no se rompe con un bloque sin configuración", () => {
    const roto = { tipo: "callout", x: 1, y: 1, ancho: 10, alto: 10 } as unknown as CalloutEstado;
    expect(() => render(<Viewer estado={roto} config={{}} />)).not.toThrow();
  });

  it("si falta el título, propone el del tono", () => {
    const n = normalizeCalloutWidget({ configuracion: { tono: "peligro" } as unknown });
    expect(n.configuracion.titulo).toBe("Peligro");
  });
});

describe("presets", () => {
  it("hay 3 estilos y un preset por tono, con ids únicos", () => {
    const ids = CALLOUT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["barra-lateral", "tarjeta", "banda"]));
    expect(ids.filter((i) => i.startsWith("nota-"))).toHaveLength(5);
  });

  it("aplicar un preset cambia lo que dice y respeta el resto (incluido el cuerpo)", () => {
    const base = con({ cuerpo: "Mi texto", icono: "libro" });
    const banda = CALLOUT_PRESETS.find((p) => p.id === "banda")!;
    const a = aplicarPreset(base, banda);
    expect(a.configuracion).toMatchObject({ estilo: "banda", cuerpo: "Mi texto", icono: "libro" });
    const peligro = CALLOUT_PRESETS.find((p) => p.id === "nota-peligro")!;
    const b = aplicarPreset(a, peligro);
    expect(b.configuracion).toMatchObject({ tono: "peligro", titulo: "Peligro", estilo: "banda", cuerpo: "Mi texto" });
  });
});

describe("editor", () => {
  it("se ve igual que el visor y un clic selecciona el bloque", () => {
    const Editor = calloutDefinition.Editor;
    const seleccionar = vi.fn();
    const { container } = render(
      <Editor estado={con({ titulo: "Hola" })} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />,
    );
    expect(container.textContent).toContain("Hola");
    fireEvent.pointerDown(screen.getByRole("note"));
    expect(seleccionar).toHaveBeenCalled();
  });
});

describe("panel de propiedades", () => {
  it("cambiar de tono cambia el título solo si seguía el del tono anterior", () => {
    const Props = calloutDefinition.Propiedades;
    const onChange = vi.fn();
    render(<Props estado={con({ tono: "info", titulo: "Nota" })} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Peligro" }));
    expect(onChange.mock.calls[0][0].configuracion).toMatchObject({ tono: "peligro", titulo: "Peligro" });
    cleanup();
    onChange.mockClear();
    render(<Props estado={con({ tono: "info", titulo: "Mi título" })} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Peligro" }));
    expect(onChange.mock.calls[0][0].configuracion).toMatchObject({ tono: "peligro", titulo: "Mi título" });
  });

  it("estilo e icono se eligen con botones accesibles", () => {
    const Props = calloutDefinition.Propiedades;
    const onChange = vi.fn();
    render(<Props estado={con()} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Tarjeta" }));
    expect(onChange.mock.calls[0][0].configuracion.estilo).toBe("tarjeta");
    fireEvent.click(screen.getByRole("button", { name: "Icono Libro" }));
    expect(onChange.mock.calls[1][0].configuracion.icono).toBe("libro");
  });
});
