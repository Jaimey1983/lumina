import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderAudio as LegacyRenderAudio,
  createDefaultAudioBlock,
} from "lumina-frontend/blocks/audio";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { audioDefinition } from "./audio-definition.js";
import type { AudioConfig, AudioEstado } from "./audio-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Audio — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultAudioBlock", () => {
    const desdeDefinicion = audioDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultAudioBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("audio");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultAudioBlock({
      url: "https://example.com/audio.mp3",
    });
    const NuevoEditor = audioDefinition.Editor;

    const legacy = render(<LegacyRenderAudio block={estado} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector("audio")?.getAttribute("src")).toBe(
      "https://example.com/audio.mp3",
    );
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultAudioBlock({
      url: "https://example.com/audio.mp3",
    });
    const NuevoViewer = audioDefinition.Viewer;

    const legacy = render(<LegacyRenderAudio block={estado} />);
    const nuevo = render(<NuevoViewer estado={estado} config={{}} />);

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector("audio")?.getAttribute("src")).toBe(
      "https://example.com/audio.mp3",
    );
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("audio") as
      | ElementDefinition<AudioEstado, AudioConfig>
      | undefined;

    expect(definicion).toBe(audioDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: true,
    });
  });
});
