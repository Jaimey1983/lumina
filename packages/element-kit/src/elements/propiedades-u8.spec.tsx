/**
 * U8 — los paneles de propiedades de Memoria y Verdadero/Falso: galería de estilos + ajustes
 * comunes, integrados con el registro.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MemoriaActivity, TrueFalse } from "@lumina/types/slide";

import { normalizarAjustes } from "../activities/_shared/activity-settings.js";
import { elementRegistry } from "../index.js";

afterEach(cleanup);

/** Props del panel de propiedades de cualquier elemento (el registro está tipado por catálogo). */
interface PropsPanel {
  estado: unknown;
  config: object;
  onChange(estado: never): void;
  onConfigChange(config: object): void;
}

const def = (tipo: string) =>
  (elementRegistry as unknown as {
    obtener(t: string): {
      crearPorDefecto(): unknown;
      Propiedades: ComponentType<PropsPanel>;
      presets?: readonly { id: string }[];
      apariencia: object;
    };
  }).obtener(tipo);

describe("Propiedades de Memoria", () => {
  it("tiene la galería «Estilos» (5), los ajustes comunes, «Tablero» y «Pares»", () => {
    const d = def("memoria");
    const { container } = render(<d.Propiedades estado={d.crearPorDefecto()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />);
    const galeria = container.querySelector("[data-preset-gallery]")!;
    expect(within(galeria as HTMLElement).getAllByRole("button").map((b) => b.getAttribute("data-preset-id"))).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    for (const t of ["Estilos", "Calificación", "Tablero", "Pares"]) expect(screen.getByText(t), t).toBeTruthy();
  });

  it("elegir un estilo guarda `ajustes.estilo` y el color del dorso, sin tocar los pares", () => {
    const d = def("memoria");
    const original = d.crearPorDefecto() as MemoriaActivity;
    const onChange = vi.fn();
    const { container } = render(<d.Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(container.querySelector('[data-preset-id="pizarra"]')!);
    const guardada = onChange.mock.lastCall![0] as MemoriaActivity;
    expect(normalizarAjustes(guardada).estilo).toBe("pizarra");
    expect(guardada.configuracion.colorDorso).toBe("#2F5D46");
    expect(guardada.pares).toEqual(original.pares);
  });

  it("el panel viejo de «Configuración» ya no existe y sus controles propios siguen en «Tablero»", () => {
    const d = def("memoria");
    render(<d.Propiedades estado={d.crearPorDefecto()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />);
    expect(screen.queryByText("Configuración")).toBeNull();
    for (const t of ["Columnas", "Color de dorso", "Símbolo del dorso", "Tiempo de volteo (ms)", "Mostrar cronómetro"]) {
      expect(screen.getByText(t), t).toBeTruthy();
    }
  });

  it("el cronómetro y los ajustes comunes conviven: «Mostrar cronómetro» es de Memoria; el límite de tiempo es común", () => {
    const d = def("memoria");
    render(<d.Propiedades estado={d.crearPorDefecto()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />);
    expect(screen.getByLabelText("Límite de tiempo")).toBeTruthy();
    expect(screen.getByText("Mostrar cronómetro")).toBeTruthy();
  });

  it("editar los pares sigue funcionando", () => {
    const d = def("memoria");
    const onChange = vi.fn();
    render(<d.Propiedades estado={d.crearPorDefecto()} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Añadir" }));
    expect((onChange.mock.lastCall![0] as MemoriaActivity).pares).toHaveLength(7);
  });
});

describe("Propiedades de Verdadero/Falso", () => {
  it("conserva el editor de siempre y suma estilos y ajustes comunes", () => {
    const d = def("verdadero_falso");
    const { container } = render(<d.Propiedades estado={d.crearPorDefecto()} config={{}} onChange={() => undefined} onConfigChange={() => undefined} />);
    expect(screen.getByText("Verdadero / Falso")).toBeTruthy(); // cabecera del editor
    expect(screen.getByPlaceholderText(/La tierra es plana/)).toBeTruthy();
    expect(container.querySelectorAll("[data-preset-id]")).toHaveLength(5);
    expect(container.querySelector("[data-actividad-ajustes]")).toBeTruthy();
    expect(screen.getByText("Retroalimentación")).toBeTruthy();
  });

  it("elegir «Examen» guarda solo `ajustes` y deja la afirmación intacta", () => {
    const d = def("verdadero_falso");
    const original = d.crearPorDefecto() as TrueFalse;
    const onChange = vi.fn();
    const { container } = render(<d.Propiedades estado={original} config={{}} onChange={onChange} onConfigChange={() => undefined} />);
    fireEvent.click(container.querySelector('[data-preset-id="examen"]')!);
    const guardada = onChange.mock.lastCall![0] as TrueFalse;
    expect(normalizarAjustes(guardada)).toMatchObject({ estilo: "examen", sonido: false, retroalimentacion: "ninguna" });
    expect({ ...guardada, ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
  });
});

describe("definiciones", () => {
  it("declaran presets y `apariencia.color`", () => {
    for (const tipo of ["memoria", "verdadero_falso"]) {
      const d = def(tipo);
      expect(d.presets!.map((p) => p.id), tipo).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
      expect(d.apariencia, tipo).toEqual({ color: true, tipografia: false, animacion: false });
    }
    // Quiz y Video interactivo (U9d) también tienen estilos: ya no es cierto que las clásicas no cambiaron.
    for (const tipo of ["quiz_multiple", "video_interactivo"]) {
      expect(def(tipo).presets!.map((p) => p.id), tipo).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    }
  });
});
