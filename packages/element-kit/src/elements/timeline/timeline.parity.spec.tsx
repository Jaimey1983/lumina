import type { TimelineEstado } from "./timeline-types.js";
import { render, cleanup, fireEvent, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TimelineEditor as LegacyEditor,
  TimelineViewer as LegacyViewer,
  createDefaultTimelineBlock,
  normalizeTimelineWidget as legacyNormalize,
} from "lumina-frontend/widgets/timeline";
import { timelineDefinition, normalizeTimelineWidget } from "./index.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Timeline — paridad E3.3", () => {
  it("conserva los defaults y la normalización legacy", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(timelineDefinition.crearPorDefecto()).toEqual(
      createDefaultTimelineBlock(),
    );
    const estado = createDefaultTimelineBlock();
    expect(normalizeTimelineWidget(estado)).toEqual(legacyNormalize(estado));
  });

  it("Editor conserva el DOM visible", () => {
    const estado = createDefaultTimelineBlock();
    estado.tituloWidget = "Contenido de prueba Timeline";
    const legacy = render(
      <LegacyEditor
        block={estado}
        onChange={() => undefined}
        innerSelection={null}
      />,
    );
    const Editor = timelineDefinition.Editor;
    const nuevo = render(
      <Editor estado={estado} config={{}} onChange={() => undefined} />,
    );
    expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
    expect(
      within(nuevo.container).getByDisplayValue(estado.tituloWidget),
    ).toBeTruthy();
  });

  it.each([false, true])(
    "Viewer conserva el DOM visible (miniatura=%s)",
    (isThumbnail) => {
      const estado = createDefaultTimelineBlock();
      estado.tituloWidget = "Contenido de prueba Timeline";
      const legacy = render(
        <LegacyViewer widget={estado} isThumbnail={isThumbnail} />,
      );
      const Viewer = timelineDefinition.Viewer;
      const nuevo = render(<Viewer estado={estado} config={{ isThumbnail }} />);
      expect(nuevo.container.innerHTML).toBe(legacy.container.innerHTML);
      expect(nuevo.container.textContent).toContain(estado.tituloWidget);
    },
  );

  it("la edición inline entrega el mismo cambio que legacy", () => {
    const estado = createDefaultTimelineBlock();
    const legacyChange = vi.fn();
    const nuevoChange = vi.fn();
    const legacy = render(
      <LegacyEditor block={estado} onChange={legacyChange} />,
    );
    const Editor = timelineDefinition.Editor;
    const nuevo = render(
      <Editor estado={estado} config={{}} onChange={nuevoChange} />,
    );
    const legacyInput = legacy.container.querySelector("input");
    const nuevoInput = nuevo.container.querySelector("input");
    expect(legacyInput).toBeTruthy();
    expect(nuevoInput).toBeTruthy();
    if (!legacyInput || !nuevoInput) throw new Error("Falta el campo editable");
    for (const input of [legacyInput, nuevoInput]) {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Título editado" } });
      fireEvent.blur(input);
    }
    expect(nuevoChange).toHaveBeenCalled();
    expect(nuevoChange.mock.lastCall).toEqual(legacyChange.mock.lastCall);
    expect(nuevoChange.mock.lastCall?.[0].tituloWidget).toBe("Título editado");
  });

  it("Propiedades entrega las actualizaciones al contrato", async () => {
    const estado = createDefaultTimelineBlock();
    const onChange = vi.fn();
    const panel = timelineDefinition.Propiedades({
      estado,
      config: {},
      onChange,
      onConfigChange: () => undefined,
    });
    await panel.props.applyNow((block: TimelineEstado) => ({
      ...block,
      tituloWidget: "Desde el panel",
    }));
    expect(onChange).toHaveBeenCalledWith({
      ...estado,
      tituloWidget: "Desde el panel",
    });
  });

  it("se registra sin puntuacion", async () => {
    const { elementRegistry } = await import("../../index.js");
    expect(elementRegistry.obtener("timeline")).toBe(timelineDefinition);
    expect(timelineDefinition).not.toHaveProperty("puntuacion");
  });
});
