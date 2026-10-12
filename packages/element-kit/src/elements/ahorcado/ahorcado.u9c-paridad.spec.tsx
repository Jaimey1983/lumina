/**
 * U9c.1 — paridad de Ahorcado contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): el tablero (categoría, intentos, pista, huecos), cómo se procesan aciertos y fallos,
 * cuándo termina, qué respuesta sale (`{ letrasAdivinadas, letrasFalladas }`, una vez, sin
 * borradores), cuándo aparece el resultado (350 ms después) y lo que `@lumina/scoring` hace con ella.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { AhorcadoActivity } from "@lumina/types/slide";

import { AhorcadoViewer as ViewerComponente } from "../../activities/ahorcado/index.js";
import { ahorcadoDefinition } from "./ahorcado-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = ahorcadoDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ahorcado = (config: Partial<AhorcadoActivity["configuracion"]> = {}): AhorcadoActivity => ({
  tipo: "ahorcado",
  configuracion: { palabra: "SOL", pista: "Brilla de día", categoria: "Naturaleza", maxIntentos: 4, ...config },
});

const tecla = (l: string) => screen.getByRole("button", { name: l }) as HTMLButtonElement;
const jugar = (...letras: string[]) => letras.forEach((l) => fireEvent.click(tecla(l)));
const huecos = () => document.body.textContent!.match(/_/g)?.length ?? 0;
const pasar = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("Ahorcado — paridad con el comportamiento anterior (U9c.1)", () => {
  it("muestra la categoría, los intentos, la pista, un hueco por letra y el teclado A–Z con Ñ", () => {
    render(<Viewer estado={ahorcado()} config={{}} />);
    expect(screen.getByText("Naturaleza")).toBeTruthy();
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
    expect(screen.getByText("Brilla de día")).toBeTruthy();
    expect(huecos()).toBe(3);
    expect(screen.getAllByRole("button")).toHaveLength(27);
    expect(tecla("Ñ")).toBeTruthy();
  });

  it("sin categoría muestra «Ahorcado» y sin pista no hay recuadro de pista", () => {
    render(<Viewer estado={ahorcado({ categoria: "", pista: "" })} config={{}} />);
    expect(screen.getByText("Ahorcado")).toBeTruthy();
    expect(screen.queryByText("Brilla de día")).toBeNull();
  });

  it("un acierto revela la letra y bloquea la tecla; un fallo la marca, la lista y resta un intento", () => {
    render(<Viewer estado={ahorcado()} config={{}} />);
    jugar("S");
    expect(screen.getAllByText("S").length).toBeGreaterThan(0);
    expect(huecos()).toBe(2);
    expect(tecla("S").disabled).toBe(true);
    jugar("Z");
    expect(screen.getByText("Letras incorrectas: Z")).toBeTruthy();
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
    expect(tecla("Z").disabled).toBe(true);
  });

  it("al ganar emite UNA vez `{ letrasAdivinadas, letrasFalladas }` y el resultado aparece a los 350 ms", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={ahorcado()} config={{ onComplete }} />);
    jugar("S", "Z", "O", "L");
    expect(onComplete.mock.calls).toEqual([[{ letrasAdivinadas: ["S", "O", "L"], letrasFalladas: ["Z"] }]]);
    expect(screen.queryByText("¡Muy bien!")).toBeNull();
    pasar(349);
    expect(screen.queryByText("¡Muy bien!")).toBeNull();
    pasar(1);
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("al perder (sin intentos) revela «La palabra era: …», emite y muestra «Sigue practicando»", () => {
    const onComplete = vi.fn();
    render(<Viewer estado={ahorcado()} config={{ onComplete }} />);
    jugar("A", "B", "C", "D");
    expect(screen.getByText(/La palabra era:/)).toBeTruthy();
    expect(onComplete.mock.calls).toEqual([[{ letrasAdivinadas: [], letrasFalladas: ["A", "B", "C", "D"] }]]);
    pasar(350);
    expect(screen.getByText("Sigue practicando")).toBeTruthy();
    expect(screen.getByText("1.0")).toBeTruthy();
  });

  it("terminada la partida el teclado queda bloqueado", () => {
    render(<Viewer estado={ahorcado()} config={{}} />);
    jugar("S", "O", "L");
    expect(tecla("A").disabled).toBe(true);
  });

  it("«Reintentar» del resultado reinicia la partida", () => {
    render(<Viewer estado={ahorcado()} config={{}} />);
    jugar("A", "B", "C", "D");
    pasar(350);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
    expect(tecla("A").disabled).toBe(false);
    expect(screen.queryByText("Sigue practicando")).toBeNull();
  });

  it("calificación con @lumina/scoring: sin fallos 5, perder 1; con fallos, proporcional (valor medido)", () => {
    const a = ahorcado();
    const nota = (adiv: string[], fall: string[]) => {
      const ev = evaluateActivityResponse("ahorcado", a, { letrasAdivinadas: adiv, letrasFalladas: fall });
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota(["S", "O", "L"], [])).toEqual({ correct: true, score: 5 });
    expect(nota(["S", "O", "L"], ["Z", "X"])).toEqual({ correct: false, score: 2.5 }); // ganó, pero con fallos: no es «correcta»
    expect(nota([], ["A", "B", "C", "D"])).toEqual({ correct: false, score: 1 });
  });

  it("normaliza la palabra (sin tildes) y acota `maxIntentos` entre 4 y 10", () => {
    const { unmount } = render(<Viewer estado={ahorcado({ palabra: "canción", maxIntentos: 99 })} config={{}} />);
    expect(screen.getByText("10/10 intentos")).toBeTruthy();
    expect(huecos()).toBe(7);
    unmount();
    render(<Viewer estado={ahorcado({ palabra: "niño", maxIntentos: 1 })} config={{}} />);
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
    // HALLAZGO (no se cambia): la normalización NFD le quita la tilde a la Ñ, así que «niño» se
    // juega como «NINO» y la tecla Ñ cuenta como fallo. Está documentado en la ficha de U9c.1.
    expect(huecos()).toBe(4);
    jugar("Ñ");
    expect(huecos()).toBe(4);
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
  });

  it("cambiar el contenido de la actividad reinicia la partida; por el componente también con `editorSyncKey`", () => {
    const { rerender } = render(<ViewerComponente actividad={ahorcado()} editorSyncKey="a" />);
    jugar("Z");
    expect(screen.getByText("3/4 intentos")).toBeTruthy();
    rerender(<ViewerComponente actividad={ahorcado({ palabra: "LUNA" })} editorSyncKey="a" />);
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
    jugar("Z");
    rerender(<ViewerComponente actividad={ahorcado({ palabra: "LUNA" })} editorSyncKey="b" />);
    expect(screen.getByText("4/4 intentos")).toBeTruthy();
  });

  it("el componente (prop `actividad`) acepta `onComplete` directo", () => {
    const onComplete = vi.fn();
    render(<ViewerComponente actividad={ahorcado()} onComplete={onComplete} />);
    jugar("S", "O", "L");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
