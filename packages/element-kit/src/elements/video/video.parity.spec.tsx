import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  RenderVideo as LegacyRenderVideo,
  createDefaultVideoBlock,
} from "lumina-frontend/blocks/video";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { videoDefinition } from "./video-definition.js";
import type { VideoConfig, VideoEstado } from "./video-types.js";

function domVisible(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Video — paridad ElementDefinition vs legacy (E5.6)", () => {
  it("crearPorDefecto delega en createDefaultVideoBlock", () => {
    const desdeDefinicion = videoDefinition.crearPorDefecto();
    const desdeLegacy = createDefaultVideoBlock();

    expect(desdeDefinicion).toEqual(desdeLegacy);
    expect(desdeDefinicion.tipo).toBe("video");
  });

  it("Editor nuevo y legacy producen el mismo DOM visible", () => {
    const estado = createDefaultVideoBlock({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    const NuevoEditor = videoDefinition.Editor;

    const legacy = render(<LegacyRenderVideo block={estado} editorMode={true} />);
    const nuevo = render(
      <NuevoEditor estado={estado} config={{}} onChange={() => undefined} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector("iframe")).toBeTruthy();
  });

  it("Viewer nuevo y legacy producen el mismo DOM visible en thumbnail", () => {
    const estado = createDefaultVideoBlock({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    const NuevoViewer = videoDefinition.Viewer;

    const legacy = render(<LegacyRenderVideo block={estado} isThumbnail={true} />);
    const nuevo = render(
      <NuevoViewer estado={estado} config={{ isThumbnail: true }} />,
    );

    expect(domVisible(nuevo.container)).toBe(domVisible(legacy.container));
    expect(nuevo.container.querySelector("img")).toBeTruthy();
  });

  it("está registrada sin puntuación", async () => {
    const { elementRegistry } = await import("../../index.js");
    const definicion = elementRegistry.obtener("video") as
      | ElementDefinition<VideoEstado, VideoConfig>
      | undefined;

    expect(definicion).toBe(videoDefinition);
    expect(definicion?.puntuacion).toBeUndefined();
    expect(definicion?.apariencia).toEqual({
      color: false,
      tipografia: false,
      animacion: true,
    });
  });
});
