import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.unmock("./equation-view.js");

import EquationView from "./equation-view.js";
import { createDefaultEcuacionBlock } from "./ecuacion-defaults.js";

afterEach(cleanup);

const vinculoA = { simbolo: "a", variableId: "va", controlable: true, paso: 2, min: 0, max: 5 };

describe("EquationView — interactividad (M2)", () => {
  it("sustituye {{a}} por el valor de la variable", () => {
    const r = render(
      <EquationView
        block={createDefaultEcuacionBlock({ latex: "{{a}}x", vinculos: [vinculoA] })}
        runtime={{ variables: { va: 3 } }}
      />,
    );
    expect(r.getByRole("img").getAttribute("aria-label")).toBe("3x");
  });

  it("sin motor se lee como álgebra y no aparece ningún control (paridad con M1)", () => {
    const r = render(
      <EquationView block={createDefaultEcuacionBlock({ latex: "{{a}}x", vinculos: [vinculoA] })} />,
    );
    expect(r.getByRole("img").getAttribute("aria-label")).toBe("ax");
    expect(r.container.querySelector("[data-ecuacion-interactiva]")).toBeNull();
    expect(r.queryByRole("button")).toBeNull();
  });

  it("los ajustadores llaman a asignarVariable respetando paso, mínimo y máximo", () => {
    const asignarVariable = vi.fn();
    const block = createDefaultEcuacionBlock({ latex: "{{a}}x", vinculos: [vinculoA] });
    const r = render(
      <EquationView block={block} runtime={{ variables: { va: 4 }, asignarVariable }} />,
    );
    fireEvent.click(r.getByLabelText("Aumentar a"));
    expect(asignarVariable).toHaveBeenLastCalledWith("va", 5); // 4+2 → tope 5
    r.rerender(
      <EquationView block={block} runtime={{ variables: { va: 5 }, asignarVariable }} />,
    );
    asignarVariable.mockClear();
    fireEvent.click(r.getByLabelText("Aumentar a"));
    expect(asignarVariable).not.toHaveBeenCalled(); // ya está en el máximo
    fireEvent.click(r.getByLabelText("Disminuir a"));
    expect(asignarVariable).toHaveBeenCalledWith("va", 3);
  });

  it("no ofrece ajustadores a variables no numéricas ni en editor ni en miniatura", () => {
    const base = { variables: { va: 1 }, asignarVariable: vi.fn() };
    const block = createDefaultEcuacionBlock({ latex: "{{a}}", vinculos: [vinculoA] });
    const ed = render(<EquationView block={block} modo="editor" runtime={base} />);
    expect(ed.queryByLabelText("Aumentar a")).toBeNull();
    cleanup();
    const th = render(<EquationView block={block} runtime={{ ...base, isThumbnail: true }} />);
    expect(th.queryByLabelText("Aumentar a")).toBeNull();
    cleanup();
    const txt = render(<EquationView block={block} runtime={{ ...base, variables: { va: "x" } }} />);
    expect(txt.queryByLabelText("Aumentar a")).toBeNull();
  });

  it("revela la fórmula línea a línea y emite clic y, al final, visitado una sola vez", () => {
    const emitir = vi.fn();
    const block = createDefaultEcuacionBlock({ latex: "a=1 \\\\ b=2 \\\\ c=3", pasos: true });
    const r = render(<EquationView block={block} runtime={{ emitir }} />);
    expect(r.getByRole("img").getAttribute("aria-label")).toBe("a igual a 1");
    expect(r.getByText("Paso 1 de 3")).toBeTruthy();

    fireEvent.click(r.getByText("Siguiente paso"));
    expect(r.getByText("Paso 2 de 3")).toBeTruthy();
    expect(emitir.mock.calls.map((c) => c[0])).toEqual(["clic"]);

    fireEvent.click(r.getByText("Siguiente paso"));
    expect(emitir.mock.calls.map((c) => c[0])).toEqual(["clic", "clic", "visitado"]);
    expect((r.getByText("Siguiente paso") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(r.getByText("Reiniciar"));
    expect(r.getByText("Paso 1 de 3")).toBeTruthy();
    fireEvent.click(r.getByText("Siguiente paso"));
    fireEvent.click(r.getByText("Siguiente paso"));
    expect(emitir.mock.calls.filter((c) => c[0] === "visitado")).toHaveLength(1);
  });

  it("los pasos no se aplican en el editor ni en miniatura (se ve la fórmula completa)", () => {
    const block = createDefaultEcuacionBlock({ latex: "a=1 \\\\ b=2", pasos: true });
    const ed = render(<EquationView block={block} modo="editor" />);
    expect(ed.queryByText("Siguiente paso")).toBeNull();
    expect(ed.getByRole("img").getAttribute("aria-label")).toContain("b igual a 2");
  });
});
