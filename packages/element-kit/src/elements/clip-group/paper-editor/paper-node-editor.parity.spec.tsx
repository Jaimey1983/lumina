import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClipPathNodeEditorPaperProps } from "lumina-frontend/blocks/clip-group/paper";
import {
  createDefaultClipGroup,
  createDefaultLibreShape,
  freeformPathToSvgD,
  normalizeFreeformPath,
  resolveFreeformPath,
} from "lumina-frontend/blocks/clip-group";
import { PaperNodeEditor } from "./paper-node-editor.js";
import {
  contornoFreeformAEstado,
  esFormaLibre,
  estadoAContornoFreeform,
} from "./paper-editor-types.js";
import type { ClipGroupEstado } from "../clip-group-types.js";

/**
 * Paper.js necesita un `<canvas>` 2D real — jsdom no lo da y `paper-core`
 * revienta al cargar. El subpath `lumina-frontend/blocks/clip-group/paper` se
 * sustituye por un stub que registra las props; así se verifica el mapeo del
 * adapter sin arrancar el motor. La lógica pura de `freeform-mask` (importada
 * del barrel principal) sí se ejerce de verdad.
 */
const { capturado } = vi.hoisted(() => ({
  capturado: { current: null as ClipPathNodeEditorPaperProps | null },
}));

vi.mock("lumina-frontend/blocks/clip-group/paper", () => ({
  ClipPathNodeEditorPaper: (props: ClipPathNodeEditorPaperProps) => {
    capturado.current = props;
    return <canvas data-testid="paper-node-editor-stub" />;
  },
}));

function bloqueLibre(): ClipGroupEstado {
  return createDefaultClipGroup(createDefaultLibreShape()) as ClipGroupEstado;
}

/** Espera a que el editor perezoso resuelva dentro de `container`. */
async function esperarEditor(container: HTMLElement): Promise<void> {
  await waitFor(() =>
    expect(
      container.querySelector('[data-testid="paper-node-editor-stub"]'),
    ).not.toBeNull(),
  );
}

afterEach(cleanup);

describe("PaperNodeEditor — adapter del editor Paper.js al contrato (E4.4)", () => {
  it("con forma `libre`: monta el editor (perezoso) y le pasa el contorno resuelto", async () => {
    const estado = bloqueLibre();
    const { container } = render(
      <PaperNodeEditor estado={estado} onChange={() => undefined} />,
    );

    await esperarEditor(container);
    const esperado = resolveFreeformPath(
      estado.clipShape as Parameters<typeof resolveFreeformPath>[0],
    );
    expect(capturado.current?.path.closed).toBe(esperado.closed);
    expect(capturado.current?.path.nodes).toHaveLength(esperado.nodes.length);
  });

  it("onCommit del editor legacy → onChange con la `clipShape` `libre` actualizada", async () => {
    const estado = bloqueLibre();
    const onChange = vi.fn();
    const { container } = render(
      <PaperNodeEditor estado={estado} onChange={onChange} />,
    );
    await esperarEditor(container);

    const nuevoContorno = normalizeFreeformPath({
      closed: true,
      nodes: [
        { id: "a", point: { x: 0.1, y: 0.1 }, handleIn: null, handleOut: null },
        { id: "b", point: { x: 0.9, y: 0.1 }, handleIn: null, handleOut: null },
        { id: "c", point: { x: 0.5, y: 0.9 }, handleIn: null, handleOut: null },
      ],
    });
    capturado.current?.onCommit(nuevoContorno);

    expect(onChange).toHaveBeenCalledTimes(1);
    const siguiente = onChange.mock.calls[0][0] as ClipGroupEstado;
    expect(siguiente.clipShape).toEqual({ tipo: "libre", path: nuevoContorno });
    expect(siguiente.id).toBe(estado.id);
    expect(siguiente.contenido).toEqual(estado.contenido);
  });

  it("onLiveChange se propaga solo si el consumidor lo pide", async () => {
    const estado = bloqueLibre();
    const onLiveChange = vi.fn();
    const { container } = render(
      <PaperNodeEditor
        estado={estado}
        onChange={() => undefined}
        onLiveChange={onLiveChange}
      />,
    );
    await esperarEditor(container);

    expect(typeof capturado.current?.onLiveChange).toBe("function");
    const contorno = resolveFreeformPath(
      estado.clipShape as Parameters<typeof resolveFreeformPath>[0],
    );
    capturado.current?.onLiveChange?.(contorno);
    expect(onLiveChange).toHaveBeenCalledTimes(1);
    expect(
      (onLiveChange.mock.calls[0][0] as ClipGroupEstado).clipShape,
    ).toEqual({ tipo: "libre", path: contorno });
  });

  it("sin forma `libre` (círculo): no monta nada", () => {
    const estado = createDefaultClipGroup({ tipo: "circulo" }) as ClipGroupEstado;
    const { container } = render(
      <PaperNodeEditor estado={estado} onChange={() => undefined} />,
    );
    expect(container.querySelector("canvas")).toBeNull();
  });
});

describe("Lógica pura del contorno freeform (freeform-mask, sin mock)", () => {
  it("normalizeFreeformPath es idempotente", () => {
    const base = resolveFreeformPath(createDefaultLibreShape());
    const una = normalizeFreeformPath(base);
    const dos = normalizeFreeformPath(una);
    expect(dos).toEqual(una);
  });

  it("resolveFreeformPath de la forma `libre` por defecto da un contorno cerrado con ≥3 nodos", () => {
    const path = resolveFreeformPath(createDefaultLibreShape());
    expect(path.closed).toBe(true);
    expect(path.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it("freeformPathToSvgD produce un path SVG que empieza en M", () => {
    const d = freeformPathToSvgD(resolveFreeformPath(createDefaultLibreShape()));
    expect(d.startsWith("M")).toBe(true);
    expect(d.length).toBeGreaterThan(8);
  });

  it("estadoAContornoFreeform / contornoFreeformAEstado hacen round-trip", () => {
    const estado = bloqueLibre();
    const contorno = estadoAContornoFreeform(estado);
    expect(contorno).not.toBeNull();
    const rehecho = contornoFreeformAEstado(estado, contorno!);
    expect(rehecho.clipShape).toEqual({ tipo: "libre", path: contorno });
    expect(esFormaLibre(rehecho)).toBe(true);
  });

  it("estadoAContornoFreeform devuelve null si la forma no es `libre`", () => {
    const estado = createDefaultClipGroup({ tipo: "circulo" }) as ClipGroupEstado;
    expect(estadoAContornoFreeform(estado)).toBeNull();
    expect(esFormaLibre(estado)).toBe(false);
  });
});
