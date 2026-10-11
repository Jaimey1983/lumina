/**
 * T19 — con «reducir movimiento» la insignia solo cambia de estado y lo anuncia: sin brillo, sin
 * confeti y sin nodo animado.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createDefaultSelloBlock } from "../../widgets/sello/index.js";
import { selloDefinition } from "./sello-definition.js";

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
});

afterEach(() => cleanup());

describe("movimiento reducido", () => {
  it("al ganarla: se anuncia y cambia de estado, sin confeti ni nodos animados", async () => {
    const Viewer = selloDefinition.Viewer;
    const estado = createDefaultSelloBlock();
    const { container, rerender } = render(<Viewer estado={estado} config={{}} />);
    rerender(<Viewer estado={estado} config={{ estadoObjeto: "visitado" }} />);
    expect(container.querySelector("[data-estado]")?.getAttribute("data-estado")).toBe("ganado");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Insignia ganada");
    expect(container.querySelector("[data-widget-motion]")).toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect(container.querySelector("[data-confeti]")).toBeNull();
  });
});
