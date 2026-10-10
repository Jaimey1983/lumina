/**
 * T3 — cada widget con presets monta la galería «Estilos» en su panel de
 * propiedades, y elegir un preset aplica su `estadoPatch` al bloque.
 */
import { fireEvent, render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { elementRegistry, type ElementDefinition } from "@lumina/element-kit-core";
import { presetCoincide } from "@lumina/editor-shared/preset-gallery";
import "../index.js";
import { BotonProperties } from "./boton/boton-properties.js";
import { CarouselWidgetComponentes } from "./carousel/carousel-properties.js";
import { ClickRevealWidgetComponentes } from "./click-reveal/click-reveal-properties.js";
import { ContadorProperties } from "./contador/contador-properties.js";
import { HotspotWidgetComponentes } from "./hotspot/hotspot-properties.js";
import { PopupWidgetComponentes } from "./popup/popup-properties.js";
import { ProgresoProperties } from "./progreso/progreso-properties.js";
import { RuletaProperties } from "./ruleta/ruleta-properties.js";
import { TooltipProperties } from "./tooltip/tooltip-properties.js";

type Panel = ComponentType<{ block: never; applyNow: (fn: (b: never) => unknown) => Promise<void> }>;

const PANELES: readonly [string, Panel][] = [
  ["boton", BotonProperties as unknown as Panel],
  ["progreso", ProgresoProperties as unknown as Panel],
  ["contador", ContadorProperties as unknown as Panel],
  ["ruleta", RuletaProperties as unknown as Panel],
  ["carousel", CarouselWidgetComponentes as unknown as Panel],
  ["click-reveal", ClickRevealWidgetComponentes as unknown as Panel],
  ["hotspot", HotspotWidgetComponentes as unknown as Panel],
  ["tooltip", TooltipProperties as unknown as Panel],
  ["popup", PopupWidgetComponentes as unknown as Panel],
];

describe("PresetGallery en los paneles de widgets (T3)", () => {
  for (const [tipo, Panel] of PANELES) {
    describe(tipo, () => {
      const def = elementRegistry.obtener(tipo) as ElementDefinition<unknown, unknown>;

      it("declara presets en su definición", () => {
        expect(def.presets?.length ?? 0).toBeGreaterThan(0);
      });

      it("muestra un botón por preset dentro de la sección «Estilos»", () => {
        const applyNow = vi.fn<(fn: unknown) => Promise<void>>(async () => undefined);
        const { container } = render(
          <Panel block={def.crearPorDefecto() as never} applyNow={applyNow} />,
        );
        expect(container.querySelector("[data-preset-gallery]")).not.toBeNull();
        const botones = container.querySelectorAll("[data-preset-id]");
        expect(botones.length).toBe(def.presets?.length);
      });

      it("elegir un preset aplica su estadoPatch al bloque", () => {
        const base = def.crearPorDefecto() as never;
        const applyNow = vi.fn<(fn: unknown) => Promise<void>>(async () => undefined);
        const { container } = render(<Panel block={base} applyNow={applyNow} />);
        for (const preset of def.presets ?? []) {
          applyNow.mockClear();
          const boton = container.querySelector(`[data-preset-id="${preset.id}"]`);
          expect(boton, preset.id).not.toBeNull();
          fireEvent.click(boton as Element);
          expect(applyNow).toHaveBeenCalledTimes(1);
          const fn = applyNow.mock.calls[0][0] as (b: never) => unknown;
          const resultado = fn(base);
          expect(presetCoincide(resultado, preset as never), preset.id).toBe(true);
        }
      });
    });
  }
});
