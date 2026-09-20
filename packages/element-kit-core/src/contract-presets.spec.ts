import { describe, expect, expectTypeOf, it } from "vitest";
import {
  ElementRegistry,
  type ElementDefinition,
  type ElementPreset,
} from "./index.js";

interface WidgetConfig {
  color: string;
  columnas: number;
  estilo: "solido" | "borde";
}

interface WidgetState {
  items: string[];
}

const presetsEjemplo: readonly ElementPreset<WidgetConfig>[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Diseño sutil con bordes finos",
    configPatch: {
      color: "#0f172a",
      estilo: "borde",
    },
  },
  {
    id: "vibrante",
    label: "Vibrante",
    description: "Colores vivos y fondo sólido",
    configPatch: {
      color: "#2563eb",
      columnas: 4,
      estilo: "solido",
    },
  },
];

const definicionConPresets = {
  tipo: "widget-con-presets" as const,
  crearPorDefecto: () => ({ items: [] }),
  Editor: () => null,
  Viewer: () => null,
  Propiedades: () => null,
  apariencia: { color: true, tipografia: true, animacion: true },
  presets: presetsEjemplo,
} satisfies ElementDefinition<WidgetState, WidgetConfig>;

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
    expect(def?.presets?.[0].configPatch).toEqual({
      color: "#0f172a",
      estilo: "borde",
    });
    expect(def?.presets?.[1].id).toBe("vibrante");
    expect(def?.presets?.[1].configPatch).toEqual({
      color: "#2563eb",
      columnas: 4,
      estilo: "solido",
    });
  });

  it("mantiene tipado estricto para configPatch en relación a la configuración del elemento", () => {
    type Config = { tema: string; activo: boolean };
    type Preset = ElementPreset<Config>;

    const preset: Preset = {
      id: "oscuro",
      label: "Oscuro",
      configPatch: { tema: "dark" },
    };

    expectTypeOf(preset.configPatch).toMatchTypeOf<Partial<Config> | undefined>();
  });
});

