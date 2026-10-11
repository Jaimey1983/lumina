/**
 * T18 — Stepper narrativo: widget nuevo (sin widget viejo con quien comparar paridad). Se prueba el
 * avance y retroceso con sus límites, el modo acumulativo, los saltos bloqueados, el evento
 * `visitado` (una sola vez), «Continuar» con el `SlideNavContext`, la normalización, los presets y
 * el registro. El movimiento reducido está en `stepper.reducido.spec.tsx`.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarPreset } from "@lumina/editor-shared/preset-gallery";
import { SlideNavContext } from "@lumina/editor-shared/slide-nav-context";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import "../../index.js";
import { createDefaultStepperBlock, normalizeStepperWidget } from "../../widgets/stepper/index.js";
import { stepperDefinition, STEPPER_PRESETS } from "./stepper-definition.js";
import type { StepperConfig, StepperEstado } from "./stepper-types.js";

afterEach(() => cleanup());

const Viewer = stepperDefinition.Viewer;
const Editor = stepperDefinition.Editor;
const Props = stepperDefinition.Propiedades;

function con(cfg: Record<string, unknown> = {}): StepperEstado {
  const base = createDefaultStepperBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as StepperEstado;
}

const siguiente = () => screen.getByRole("button", { name: /Siguiente/ });
const anterior = () => screen.getByRole("button", { name: /Anterior/ }) as HTMLButtonElement;
const contador = (c: HTMLElement) => c.querySelector('[class*="contador"]')?.textContent;
const marca = (n: number) => screen.getByRole("button", { name: new RegExp(`^Paso ${n}:`) }) as HTMLButtonElement;

describe("registro", () => {
  it("está registrado como widget del lienzo y declara el evento `visitado` (DT7: sin notas)", () => {
    const def = elementRegistry.obtener("stepper") as ElementDefinition<StepperEstado, StepperConfig> | undefined;
    expect(def).toBe(stepperDefinition);
    expect(def?.catalogo).toMatchObject({ nombre: "Stepper", familia: "widget", grupo: "lienzo" });
    expect(def?.eventos).toEqual(["visitado"]);
    expect(def?.puntuacion).toBeUndefined();
  });
});

describe("avance y retroceso", () => {
  it("empieza en el paso 1, avanza con Siguiente y vuelve con Anterior; respeta los extremos", () => {
    const { container } = render(<Viewer estado={con()} config={{}} />);
    expect(contador(container)).toBe("1 / 3");
    expect(anterior().disabled).toBe(true);
    expect(container.textContent).toContain("Planteamos la situación");
    expect(container.textContent).not.toContain("Buscamos una estrategia");
    fireEvent.click(siguiente());
    expect(contador(container)).toBe("2 / 3");
    expect(container.textContent).toContain("Buscamos una estrategia");
    expect(container.textContent).not.toContain("Planteamos la situación");
    fireEvent.click(anterior());
    expect(contador(container)).toBe("1 / 3");
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    expect(contador(container)).toBe("3 / 3");
    expect(screen.queryByRole("button", { name: /Siguiente/ })).toBeNull();
    expect(container.textContent).toContain("¡Completado!");
  });

  it("sin «Anterior» configurado, el botón no existe", () => {
    render(<Viewer estado={con({ mostrarAnterior: false })} config={{}} />);
    expect(screen.queryByRole("button", { name: /Anterior/ })).toBeNull();
  });

  it("modo acumulativo: los pasos revelados quedan apilados", () => {
    const { container } = render(<Viewer estado={con({ modo: "acumulativo" })} config={{}} />);
    expect(container.querySelectorAll("article")).toHaveLength(1);
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(container.querySelectorAll('article[aria-current="step"]')).toHaveLength(1);
    fireEvent.click(anterior());
    expect(container.querySelectorAll("article")).toHaveLength(2);
  });
});

describe("indicador y saltos", () => {
  it("con saltos bloqueados solo se llega a lo visto o al siguiente inmediato", () => {
    render(<Viewer estado={con({ indicador: "numeros", bloquearSaltos: true })} config={{}} />);
    expect(marca(1).disabled).toBe(false);
    expect(marca(2).disabled).toBe(false);
    expect(marca(3).disabled).toBe(true);
    fireEvent.click(marca(2));
    expect(marca(3).disabled).toBe(false);
    fireEvent.click(marca(3));
    fireEvent.click(marca(1)); // volver a lo ya visto sigue permitido
    expect(marca(1).getAttribute("aria-current")).toBe("step");
    expect(marca(3).disabled).toBe(false);
  });

  it("con saltos libres se puede ir a cualquier paso", () => {
    render(<Viewer estado={con({ indicador: "puntos", bloquearSaltos: false })} config={{}} />);
    expect(marca(3).disabled).toBe(false);
    fireEvent.click(marca(3));
    expect(marca(3).getAttribute("aria-current")).toBe("step");
  });

  it("la barra expone un progressbar con el paso actual", () => {
    render(<Viewer estado={con({ indicador: "barra" })} config={{}} />);
    const barra = screen.getByRole("progressbar");
    expect(barra.getAttribute("aria-valuenow")).toBe("1");
    expect(barra.getAttribute("aria-valuemax")).toBe("3");
    fireEvent.click(siguiente());
    expect(barra.getAttribute("aria-valuenow")).toBe("2");
  });
});

describe("evento `visitado`", () => {
  it("se emite al llegar al último paso, una sola vez aunque se vuelva a pasar", () => {
    const emitir = vi.fn();
    render(<Viewer estado={con()} config={{ emitir }} />);
    fireEvent.click(siguiente());
    expect(emitir).not.toHaveBeenCalled();
    fireEvent.click(siguiente());
    expect(emitir.mock.calls.map(([e]) => e)).toEqual(["visitado"]);
    fireEvent.click(anterior());
    fireEvent.click(siguiente());
    expect(emitir).toHaveBeenCalledTimes(1);
  });

  it("no emite si el objeto ya estaba visitado, en el editor ni en miniatura; sin runtime no pasa nada", () => {
    const emitir = vi.fn();
    const ya = render(<Viewer estado={con()} config={{ emitir, estadoObjeto: "visitado" }} />);
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    ya.unmount();
    const ed = render(<Editor estado={con()} config={{ emitir }} onChange={() => undefined} />);
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    ed.unmount();
    const mini = render(<Viewer estado={con()} config={{ emitir, isThumbnail: true }} />);
    mini.unmount();
    expect(emitir).not.toHaveBeenCalled();
    render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(siguiente());
    expect(() => fireEvent.click(siguiente())).not.toThrow();
  });
});

describe("«Continuar» con el SlideNavContext", () => {
  const conNav = (navigate: (a: unknown) => void, hijo: ReactNode) =>
    createElement(SlideNavContext.Provider, { value: { navigate: navigate as never, slideIndex: 0, slideCount: 3 } }, hijo);

  it("al terminar con avance «slide» ofrece Continuar y navega al siguiente", () => {
    const navigate = vi.fn();
    render(conNav(navigate, <Viewer estado={con({ avance: "slide" })} config={{}} />));
    expect(screen.queryByRole("button", { name: /Continuar/ })).toBeNull();
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(navigate).toHaveBeenCalledWith({ kind: "siguiente" });
  });

  it("en independiente, o sin navegación (clase en vivo / editor), no hay Continuar", () => {
    const a = render(conNav(vi.fn(), <Viewer estado={con({ avance: "independiente" })} config={{}} />));
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    expect(screen.queryByRole("button", { name: /Continuar/ })).toBeNull();
    a.unmount();
    render(<Viewer estado={con({ avance: "slide" })} config={{}} />);
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    expect(screen.queryByRole("button", { name: /Continuar/ })).toBeNull();
  });
});

describe("accesibilidad", () => {
  it("región etiquetada, paso actual marcado y anuncio del paso nuevo", () => {
    const { container } = render(<Viewer estado={con()} config={{}} />);
    expect(screen.getByRole("region", { name: "Paso a paso" })).toBeTruthy();
    expect(container.querySelector('article[aria-current="step"]')).not.toBeNull();
    const viva = container.querySelector('[role="status"]') as HTMLElement;
    expect(viva.textContent).toBe("");
    fireEvent.click(siguiente());
    expect(viva.textContent).toBe("Paso 2 de 3: Buscamos una estrategia");
    fireEvent.click(siguiente());
    expect(viva.textContent).toContain("Completado");
  });

  it("el cuerpo con HTML se sanea", () => {
    const pasos = [
      { id: "a", titulo: "A", cuerpo: "<b>negrita</b><script>window.__s = 1</script>" },
      { id: "b", titulo: "B", cuerpo: "dos" },
    ];
    const { container } = render(<Viewer estado={con({ pasos })} config={{}} />);
    expect(container.querySelector("b")?.textContent).toBe("negrita");
    expect(container.querySelector("script")).toBeNull();
    expect((window as unknown as { __s?: number }).__s).toBeUndefined();
  });
});

describe("miniatura y editor", () => {
  it("la miniatura muestra el primer paso sin controles", () => {
    const { container } = render(<Viewer estado={con()} config={{ isThumbnail: true }} />);
    expect(container.textContent).toContain("Planteamos la situación");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("el editor permite recorrer los pasos y un clic selecciona el bloque", () => {
    const seleccionar = vi.fn();
    const { container } = render(
      <Editor estado={con()} config={{ onEnsureBlockSelected: seleccionar }} onChange={() => undefined} />,
    );
    fireEvent.click(siguiente());
    expect(container.textContent).toContain("Buscamos una estrategia");
    fireEvent.pointerDown(screen.getByRole("region"));
    expect(seleccionar).toHaveBeenCalled();
  });
});

describe("normalización de JSON incompleto", () => {
  it("un bloque vacío recibe los valores por defecto", () => {
    const n = normalizeStepperWidget({});
    expect(n.configuracion).toMatchObject({ modo: "uno", indicador: "barra", bloquearSaltos: true, avance: "independiente", transicion: "ninguna" });
    expect(n.configuracion.pasos.length).toBeGreaterThanOrEqual(2);
  });

  it("repara ids repetidos, completa hasta el mínimo y limita el máximo", () => {
    const uno = normalizeStepperWidget({ configuracion: { pasos: [{ id: "x", titulo: "Solo" }] } as unknown });
    expect(uno.configuracion.pasos).toHaveLength(2);
    const dup = normalizeStepperWidget({ configuracion: { pasos: [{ id: "x" }, { id: "x" }, "basura"] } as unknown });
    expect(dup.configuracion.pasos.map((p) => p.id)).toEqual(["x", "x-b"]);
    const muchos = normalizeStepperWidget({ configuracion: { pasos: Array.from({ length: 30 }, (_, i) => ({ id: `p${i}` })) } as unknown });
    expect(muchos.configuracion.pasos).toHaveLength(10);
  });

  it("valores desconocidos vuelven al defecto y el visor no se rompe sin configuración", () => {
    const n = normalizeStepperWidget({ configuracion: { modo: "zigzag", indicador: 3, avance: "x", transicion: "y" } as unknown });
    expect(n.configuracion).toMatchObject({ modo: "uno", indicador: "barra", avance: "independiente", transicion: "ninguna" });
    expect(() => render(<Viewer estado={{ tipo: "stepper", x: 1, y: 1, ancho: 1, alto: 1 } as unknown as StepperEstado} config={{}} />)).not.toThrow();
  });

  it("si el bloque queda con menos pasos que el actual, no se sale de rango", () => {
    const { rerender, container } = render(<Viewer estado={con()} config={{}} />);
    fireEvent.click(siguiente());
    fireEvent.click(siguiente());
    const dos = con({ pasos: con().configuracion.pasos.slice(0, 2) });
    rerender(<Viewer estado={dos} config={{}} />);
    expect(contador(container)).toBe("2 / 2");
  });
});

describe("panel de propiedades", () => {
  const abrir = (estado: StepperEstado, onChange = vi.fn()) => {
    render(<Props estado={estado} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    return onChange;
  };

  it("agregar, mover y quitar pasos, con mínimo y máximo", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: /Agregar paso/ }));
    expect(onChange.mock.calls[0][0].configuracion.pasos).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Bajar paso 1" }));
    expect(onChange.mock.calls[1][0].configuracion.pasos[0].id).toBe("paso-2");
    fireEvent.click(screen.getByRole("button", { name: "Quitar paso 3" }));
    expect(onChange.mock.calls[2][0].configuracion.pasos).toHaveLength(2);
    cleanup();
    abrir(con({ pasos: con().configuracion.pasos.slice(0, 2) }));
    expect((screen.getByRole("button", { name: "Quitar paso 1" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    abrir(con({ pasos: Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, titulo: "t", cuerpo: "c" })) }));
    expect((screen.getByRole("button", { name: /Agregar paso/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("modo, indicador, saltos y «Continuar» se editan", () => {
    const onChange = abrir(con());
    fireEvent.click(screen.getByRole("button", { name: "Acumulativo" }));
    expect(onChange.mock.calls[0][0].configuracion.modo).toBe("acumulativo");
    fireEvent.click(screen.getByRole("button", { name: "Puntos" }));
    expect(onChange.mock.calls[1][0].configuracion.indicador).toBe("puntos");
    fireEvent.click(screen.getByRole("checkbox", { name: /saltar pasos/ }));
    expect(onChange.mock.calls[2][0].configuracion.bloquearSaltos).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: /Continuar/ }));
    expect(onChange.mock.calls[3][0].configuracion.avance).toBe("slide");
  });

  it("editar el título de un paso", () => {
    const onChange = abrir(con());
    fireEvent.change(within(document.body).getByLabelText("Título del paso 2"), { target: { value: "Nuevo" } });
    expect(onChange.mock.calls[0][0].configuracion.pasos[1].titulo).toBe("Nuevo");
  });
});

describe("presets", () => {
  it("existen, con ids únicos, y no tocan los pasos", () => {
    const ids = STEPPER_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["paso-a-paso", "historia-acumulativa", "con-continuar"]));
    const base = con({ pasos: [{ id: "a", titulo: "A", cuerpo: "a" }, { id: "b", titulo: "B", cuerpo: "b" }] });
    for (const p of STEPPER_PRESETS) {
      expect(aplicarPreset(base, p).configuracion.pasos).toEqual(base.configuracion.pasos);
    }
  });

  it("el acumulativo cambia el modo y el indicador", () => {
    const p = STEPPER_PRESETS.find((x) => x.id === "historia-acumulativa")!;
    expect(aplicarPreset(con(), p).configuracion).toMatchObject({ modo: "acumulativo", indicador: "puntos", transicion: "subir" });
  });
});
