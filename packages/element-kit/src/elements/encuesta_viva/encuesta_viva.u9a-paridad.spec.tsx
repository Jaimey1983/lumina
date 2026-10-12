/**
 * U9a.4 — paridad de Encuesta viva contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué entrega por `onResponse` (el ÍNDICE de la opción), el sonido,
 * los resultados que muestra tras votar y la mecánica visible.
 *
 * OJO (hallazgo): los resultados tras votar son SIMULADOS (`simulateResults` con un total
 * ficticio de 24 votos): no hay conteo real. Se fija tal cual para no cambiar lo visible;
 * está documentado en la ficha como decisión pendiente del dueño.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { LivePoll } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { LivePollViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { encuestaVivaDefinition } from "./encuesta_viva-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = encuestaVivaDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const encuesta = (parche: Partial<LivePoll> = {}): LivePoll => ({
  tipo: "encuesta_viva",
  pregunta: "¿Cuál prefieres?",
  opciones: [
    { id: "o1", texto: "Uno" },
    { id: "o2", texto: "Dos" },
    { id: "o3", texto: "Tres" },
  ],
  ...parche,
});

const opcion = (t: string) => screen.getByRole("button", { name: t });
/** Porcentajes mostrados tras votar, por texto de opción (`N%` de la barra). */
const porcentajes = () =>
  Object.fromEntries(
    ["Uno", "Dos", "Tres", "Cuatro"]
      .filter((t) => screen.queryByText(t))
      .map((t) => {
        const fila = screen.getByText(t).closest("div.space-y-1")!;
        return [t, fila.textContent!.match(/(\d+)%/)![1] + "%"];
      }),
  );

describe("Encuesta viva — paridad con el comportamiento anterior (U9a.4)", () => {
  it("antes de votar: la pregunta y un botón por opción, sin resultados", () => {
    render(<Viewer estado={encuesta()} config={{}} />);
    expect(screen.getByText("¿Cuál prefieres?")).toBeTruthy();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Uno", "Dos", "Tres"]);
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("votar emite el ÍNDICE de la opción una sola vez y suena `submit`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={encuesta()} config={{ onResponse }} />);
    fireEvent.click(opcion("Dos"));
    expect(onResponse.mock.calls).toEqual([[1]]);
    expect(play.mock.calls).toEqual([["submit"]]);
    // Ya no hay botones: no se puede votar de nuevo.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("tras votar: «¡Voto registrado!», una barra por opción con su % y conteo de votos", () => {
    render(<Viewer estado={encuesta()} config={{}} />);
    fireEvent.click(opcion("Uno"));
    expect(screen.getByText(/¡Voto registrado!/)).toBeTruthy();
    expect(porcentajes()).toEqual({ Uno: "50%", Dos: "27%", Tres: "23%" });
    expect(screen.getAllByText(/ votos? · \d+%$/).map((e) => e.textContent)).toEqual([
      "12 votos · 50%",
      "6 votos · 27%",
      "6 votos · 23%",
    ]);
  });

  it("los resultados son simulados y deterministas (mismo voto ⇒ mismos números)", () => {
    const a = render(<Viewer estado={encuesta()} config={{}} />);
    fireEvent.click(opcion("Dos"));
    const primera = porcentajes();
    a.unmount();
    render(<Viewer estado={encuesta()} config={{}} />);
    fireEvent.click(opcion("Dos"));
    expect(porcentajes()).toEqual(primera);
    expect(Object.values(primera).reduce((s, p) => s + parseInt(p), 0)).toBe(100);
  });

  it("con una sola opción el voto es el 100 %", () => {
    render(<Viewer estado={encuesta({ opciones: [{ id: "o1", texto: "Uno" }] })} config={{}} />);
    fireEvent.click(opcion("Uno"));
    expect(porcentajes()).toEqual({ Uno: "100%" });
    expect(screen.getByText("24 votos · 100%")).toBeTruthy();
  });

  it("la opción votada se marca (el voto cuenta al menos 1 aunque su % sea bajo)", () => {
    const { container } = render(<Viewer estado={encuesta()} config={{}} />);
    fireEvent.click(opcion("Tres"));
    expect(container.querySelectorAll("svg")).toHaveLength(1); // el check de la opción votada
  });

  it("es de participación en scoring: la evaluación no da acierto ni nota (la participación se registra aparte)", () => {
    const a = encuesta();
    const ev = evaluateActivityResponse("encuesta_viva", a, 1);
    expect({ correct: ev.correct ?? null, score: ev.score ?? null }).toEqual({ correct: null, score: null });
  });

  it("el componente reinicia el voto al cambiar `editorSyncKey`", () => {
    const onResponse = vi.fn();
    const a = encuesta();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" onResponse={onResponse} />);
    fireEvent.click(opcion("Uno"));
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" onResponse={onResponse} />);
    expect(screen.queryByText(/¡Voto registrado!/)).toBeNull();
    fireEvent.click(opcion("Tres"));
    expect(onResponse.mock.calls).toEqual([[0], [2]]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = encuesta();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(opcion("Uno"));
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText(/¡Voto registrado!/)).toBeTruthy();
  });

  it("IGNORA `multipleRespuesta`, `mostrarResultados*` y `tiempoLimiteSeg`: siempre un voto y resultados al votar", () => {
    const onResponse = vi.fn();
    render(
      <Viewer
        estado={encuesta({
          multipleRespuesta: true,
          mostrarResultadosEnTiempoReal: false,
          mostrarResultadosAlFinalizar: false,
        })}
        config={{ onResponse }}
      />,
    );
    fireEvent.click(opcion("Uno"));
    expect(onResponse.mock.calls).toEqual([[0]]);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText(/¡Voto registrado!/)).toBeTruthy();
  });
});
