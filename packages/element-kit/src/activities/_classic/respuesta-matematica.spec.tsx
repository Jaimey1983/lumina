import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import { RespuestaMatematicaEditor, RespuestaMatematicaViewer } from "./respuesta-matematica.js";
import { respuestaMatematicaTemplate } from "./activity-templates.js";

afterEach(cleanup);

const base = () => {
  const a = respuestaMatematicaTemplate();
  if (a.tipo !== "respuesta_matematica") throw new Error("plantilla");
  return a;
};

describe("Respuesta matemática", () => {
  it("el visor envía el texto recortado una sola vez y se califica con @lumina/scoring", () => {
    const onResponse = vi.fn();
    const act = { ...base(), question: "¿3/4+1/4?", respuesta: "1" };
    const r = render(<RespuestaMatematicaViewer activity={act} onResponse={onResponse} />);
    fireEvent.change(r.getByLabelText("Tu respuesta"), { target: { value: "  1,0 " } });
    fireEvent.click(r.getByText("Enviar"));
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith("1,0");
    expect(evaluateActivityResponse("respuesta_matematica", act, "1,0").correct).toBe(true);
    expect(r.getByText(/Respuesta enviada/)).toBeTruthy();
  });

  it("no envía una respuesta vacía", () => {
    const onResponse = vi.fn();
    const r = render(<RespuestaMatematicaViewer activity={base()} onResponse={onResponse} />);
    expect((r.getByText("Enviar") as HTMLButtonElement).disabled).toBe(true);
  });

  it("el editor avisa si la respuesta modelo no es un número y explica la tolerancia", () => {
    const malo = { ...base(), respuesta: "cuatro" };
    const r = render(
      <RespuestaMatematicaEditor editorSyncKey="a" activity={malo} onChange={() => undefined} />,
    );
    expect(r.getByRole("alert").textContent).toContain("No es un número");
    cleanup();
    const bueno = { ...base(), respuesta: "3,14" };
    const r2 = render(
      <RespuestaMatematicaEditor editorSyncKey="b" activity={bueno} onChange={() => undefined} />,
    );
    expect(r2.getByText("Se acepta ±0,01 (decimal).")).toBeTruthy();
  });
});

describe("Respuesta matemática — modo algebraico (M4)", () => {
  const algebraica = () => ({
    ...base(),
    modo: "algebraico" as const,
    question: "Factoriza 2x+2",
    respuesta: "2(x+1)",
  });

  it("califica expresiones equivalentes con @lumina/scoring", () => {
    const a = algebraica();
    expect(evaluateActivityResponse("respuesta_matematica", a, "2x+2").correct).toBe(true);
    expect(evaluateActivityResponse("respuesta_matematica", a, "2x+3").correct).toBe(false);
  });

  it("el visor no envía una expresión ilegible y explica el problema", () => {
    const onResponse = vi.fn();
    const r = render(<RespuestaMatematicaViewer activity={algebraica()} onResponse={onResponse} />);
    fireEvent.change(r.getByLabelText("Tu respuesta"), { target: { value: "2(x+1" } });
    fireEvent.click(r.getByText("Enviar"));
    expect(onResponse).not.toHaveBeenCalled();
    expect(r.getByRole("alert").textContent).toContain("paréntesis");
    fireEvent.change(r.getByLabelText("Tu respuesta"), { target: { value: "2(x+1)" } });
    fireEvent.click(r.getByText("Enviar"));
    expect(onResponse).toHaveBeenCalledWith("2(x+1)");
  });

  it("el editor valida la expresión modelo y oculta tolerancia y unidad", () => {
    const mala = { ...algebraica(), respuesta: "2(x+1" };
    const r = render(
      <RespuestaMatematicaEditor editorSyncKey="m" activity={mala} onChange={() => undefined} />,
    );
    expect(r.getByRole("alert").textContent).toContain("paréntesis");
    expect(r.queryByLabelText("Tolerancia (opc.)")).toBeNull();
    expect(r.queryByText("Unidad (opc.)")).toBeNull();
  });
});

describe("Texto con fórmulas en línea (M3b)", () => {
  it("una pregunta con \\( … \\) se dibuja con KaTeX y se lee en español", async () => {
    const act = { ...base(), question: "¿Cuánto es \\(\\frac{1}{2}+\\frac{1}{4}\\)?", respuesta: "3/4" };
    const r = render(<RespuestaMatematicaViewer activity={act} />);
    const formula = await r.findByRole("img");
    expect(formula.getAttribute("aria-label")).toBe("1 sobre 2 más 1 sobre 4");
    expect(r.container.querySelector(".katex")).not.toBeNull();
    expect(r.container.textContent).toContain("¿Cuánto es");
  });

  it("un texto sin fórmulas queda exactamente igual (paridad)", () => {
    const act = { ...base(), question: "¿Cuánto es 3 + 4? Cuesta $5", respuesta: "7" };
    const r = render(<RespuestaMatematicaViewer activity={act} />);
    expect(r.container.querySelector("[data-math-inline]")).toBeNull();
    expect(r.getByText("¿Cuánto es 3 + 4? Cuesta $5")).toBeTruthy();
  });
});
