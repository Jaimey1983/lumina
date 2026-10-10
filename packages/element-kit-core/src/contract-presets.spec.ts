import { describe, expect, expectTypeOf, it } from "vitest";
import {
  ElementRegistry,
  type DeepPartial,
  type ElementDefinition,
  type ElementPreset,
} from "./index.js";

interface WidgetConfig {
  color: string;
}

interface WidgetEstado {
  items: string[];
  configuracion: {
    columnas: number;
    estilo: "solido" | "borde";
    borde: { grosor: number; color: string };
  };
}

const presetsEjemplo: readonly ElementPreset<WidgetEstado>[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Diseño sutil con bordes finos",
    estadoPatch: { configuracion: { estilo: "borde", borde: { grosor: 1 } } },
  },
  {
    id: "vibrante",
    label: "Vibrante",
    description: "Colores vivos y fondo sólido",
    estadoPatch: { configuracion: { columnas: 4, estilo: "solido" } },
  },
];

const definicionConPresets = {
  tipo: "widget-con-presets" as const,
  crearPorDefecto: (): WidgetEstado => ({
    items: [],
    configuracion: {
      columnas: 2,
      estilo: "solido",
      borde: { grosor: 2, color: "#000000" },
    },
  }),
  Editor: () => null,
  Viewer: () => null,
  Propiedades: () => null,
  apariencia: { color: true, tipografia: true, animacion: true },
  presets: presetsEjemplo,
} satisfies ElementDefinition<WidgetEstado, WidgetConfig>;

describe("ElementPreset contract", () => {
  it("permite registrar un elemento con presets preconfigurados", () => {
    const registry = new ElementRegistry<{
      "widget-con-presets": typeof definicionConPresets;
    }>();

    registry.registrar(definicionConPresets);
    const def = registry.obtener("widget-con-presets");

    expect(def).toBeDefined();
    expect(def?.presets).toHaveLength(2);
    expect(def?.presets?.[0].id).toBe("minimal");
    expect(def?.presets?.[0].estadoPatch).toEqual({
      configuracion: { estilo: "borde", borde: { grosor: 1 } },
    });
    expect(def?.presets?.[1].id).toBe("vibrante");
    expect(def?.presets?.[1].estadoPatch).toEqual({
      configuracion: { columnas: 4, estilo: "solido" },
    });
  });

  it("tipa `estadoPatch` como parche profundo del estado, sin casts", () => {
    type Estado = { tema: string; opciones: { activo: boolean; nivel: number } };
    type Preset = ElementPreset<Estado>;

    const preset: Preset = {
      id: "oscuro",
      label: "Oscuro",
      estadoPatch: { tema: "dark", opciones: { activo: true } },
    };

    expectTypeOf(preset.estadoPatch).toEqualTypeOf<DeepPartial<Estado>>();
    expectTypeOf<DeepPartial<Estado>["opciones"]>().toEqualTypeOf<
      { activo?: boolean; nivel?: number } | undefined
    >();
  });

  it("rechaza claves que no existen en el estado", () => {
    type Estado = { tema: string };
    const invalido: ElementPreset<Estado> = {
      id: "x",
      label: "X",
      // @ts-expect-error `inexistente` no es una clave del estado
      estadoPatch: { inexistente: 1 },
    };
    expect(invalido.id).toBe("x");
  });

  it("los arreglos del estado se reemplazan enteros, no se parchean por índice", () => {
    type Estado = { items: { id: string }[] };
    expectTypeOf<DeepPartial<Estado>["items"]>().toEqualTypeOf<
      { id: string }[] | undefined
    >();
  });
});
