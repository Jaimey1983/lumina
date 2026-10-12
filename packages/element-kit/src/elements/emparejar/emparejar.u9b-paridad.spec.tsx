/**
 * U9b.3 — paridad de Emparejar contra su comportamiento ANTERIOR a migrar al `ActivityShell`
 * (Regla 7): cómo se elige y se quita una pareja, qué respuesta sale (`[{ leftId, rightId }]`
 * en el orden en que se hicieron), el sonido, el bloqueo y lo que `@lumina/scoring` hace con ella.
 * Se opera por el texto de cada lado (clic): vale igual para los `div` viejos y los botones nuevos.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { MatchPairs } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { EmparejarViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { emparejarDefinition } from "./emparejar-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = emparejarDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

beforeEach(() => {
  play.mockClear();
  let i = 0;
  const seq = [0.11, 0.87, 0.32, 0.64, 0.19, 0.73, 0.41, 0.58, 0.26, 0.91];
  vi.spyOn(Math, "random").mockImplementation(() => seq[i++ % seq.length]!);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const lado = (texto: string) => ({ texto });
const pares = (): MatchPairs => ({
  tipo: "emparejar",
  instruccion: "Une cada animal con su sonido.",
  pares: [
    { id: "p1", izquierda: lado("Perro"), derecha: lado("Guau") },
    { id: "p2", izquierda: lado("Gato"), derecha: lado("Miau") },
    { id: "p3", izquierda: lado("Vaca"), derecha: lado("Muu") },
  ],
});

const click = (t: string) => fireEvent.click(screen.getByText(t));
const unir = (izq: string, der: string) => {
  click(izq);
  click(der);
};
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
/** Insignias numéricas visibles (1, 2, 3…) en el orden del documento. */
const insignias = () =>
  [...document.querySelectorAll("span")].map((s) => s.textContent!.trim()).filter((t) => /^\d+$/.test(t));
/** Textos de la columna derecha, en orden (los de `Guau/Miau/Muu`). */
const derecha = () =>
  [...document.querySelectorAll("span")].map((s) => s.textContent!.trim()).filter((t) => ["Guau", "Miau", "Muu"].includes(t));
const CORRECTAS: [string, string][] = [["Perro", "Guau"], ["Gato", "Miau"], ["Vaca", "Muu"]];

describe("Emparejar — paridad con el comportamiento anterior (U9b.3)", () => {
  it("muestra la instrucción, los lados izquierdos en orden y los derechos mezclados (azar fijo)", () => {
    render(<Viewer estado={pares()} config={{}} />);
    expect(screen.getByText("Une cada animal con su sonido.")).toBeTruthy();
    for (const t of ["Perro", "Gato", "Vaca"]) expect(screen.getByText(t)).toBeTruthy();
    expect(derecha()).toEqual(["Muu", "Miau", "Guau"]); // medido con el viewer viejo
    expect(enviar().disabled).toBe(true);
  });

  it("elegir un lado izquierdo y luego un derecho crea la pareja, con la misma insignia en ambos", () => {
    render(<Viewer estado={pares()} config={{}} />);
    unir("Perro", "Miau");
    expect(insignias()).toEqual(["1", "1"]);
  });

  it("tocar un derecho sin haber elegido un izquierdo no hace nada", () => {
    render(<Viewer estado={pares()} config={{}} />);
    click("Guau");
    expect(insignias()).toEqual([]);
  });

  it("elegir el mismo izquierdo otra vez lo deselecciona", () => {
    render(<Viewer estado={pares()} config={{}} />);
    click("Perro");
    click("Perro");
    click("Guau"); // ya no hay izquierdo elegido
    expect(insignias()).toEqual([]);
  });

  it("tocar un izquierdo ya emparejado quita esa pareja", () => {
    render(<Viewer estado={pares()} config={{}} />);
    unir("Perro", "Guau");
    click("Perro");
    expect(insignias()).toEqual([]);
  });

  it("emparejar con un derecho ya usado NO lo reemplaza (el derecho ocupado no responde)", () => {
    render(<Viewer estado={pares()} config={{}} />);
    unir("Perro", "Guau");
    click("Gato");
    click("Guau"); // ya emparejado: se ignora
    expect(insignias()).toEqual(["1", "1"]);
  });

  it("«Enviar» se habilita con TODOS emparejados y emite el arreglo en el orden en que se hicieron, una vez", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={pares()} config={{ onResponse }} />);
    unir("Gato", "Miau");
    unir("Perro", "Guau");
    expect(enviar().disabled).toBe(true);
    unir("Vaca", "Muu");
    expect(enviar().disabled).toBe(false);
    fireEvent.click(enviar());
    // Un segundo clic ya no es posible: el botón desaparece.
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
    expect(onResponse.mock.calls).toEqual([
      [[{ leftId: "p2", rightId: "p2" }, { leftId: "p1", rightId: "p1" }, { leftId: "p3", rightId: "p3" }]],
    ]);
  });

  it("numera las insignias según el orden de las parejas hechas", () => {
    render(<Viewer estado={pares()} config={{}} />);
    unir("Gato", "Miau");
    unir("Perro", "Guau");
    // Izquierda en su orden (Perro=2, Gato=1) y derecha mezclada (Miau=1, Guau=2).
    expect(insignias()).toEqual(["2", "1", "1", "2"]);
  });

  it("sonido al enviar: `correct` si todo está bien emparejado y `wrong` si no", () => {
    const { unmount } = render(<Viewer estado={pares()} config={{}} />);
    for (const [i, d] of CORRECTAS) unir(i, d);
    fireEvent.click(enviar());
    expect(play.mock.calls).toEqual([["correct"]]);
    unmount();
    play.mockClear();
    render(<Viewer estado={pares()} config={{}} />);
    unir("Perro", "Miau");
    unir("Gato", "Guau");
    unir("Vaca", "Muu");
    fireEvent.click(enviar());
    expect(play.mock.calls).toEqual([["wrong"]]);
  });

  it("al enviar queda «¡Respuesta enviada!», desaparece el botón y ya no se pueden cambiar las parejas", () => {
    render(<Viewer estado={pares()} config={{}} />);
    for (const [i, d] of CORRECTAS) unir(i, d);
    fireEvent.click(enviar());
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
    click("Perro"); // quitar: ignorado
    expect(insignias()).toHaveLength(6);
  });

  it("calificación con @lumina/scoring: todo bien 5, todo mal nota mínima, un acierto de tres (1,7)", () => {
    const a = pares();
    const nota = (m: { leftId: string; rightId: string }[]) => {
      const ev = evaluateActivityResponse("emparejar", a, m);
      return { correct: ev.correct, score: ev.score };
    };
    expect(nota([{ leftId: "p1", rightId: "p1" }, { leftId: "p2", rightId: "p2" }, { leftId: "p3", rightId: "p3" }])).toEqual({ correct: true, score: 5 });
    expect(nota([{ leftId: "p1", rightId: "p2" }, { leftId: "p2", rightId: "p3" }, { leftId: "p3", rightId: "p1" }])).toEqual({ correct: false, score: 1 });
    expect(nota([{ leftId: "p1", rightId: "p1" }, { leftId: "p2", rightId: "p3" }, { leftId: "p3", rightId: "p2" }])).toEqual({ correct: false, score: 1.7 });
  });

  it("el componente reinicia parejas y envío al cambiar `editorSyncKey`; por el registro NO", () => {
    const a = pares();
    const { rerender } = render(<ViewerComponente actividad={a} editorSyncKey="s1" />);
    unir("Perro", "Guau");
    rerender(<ViewerComponente actividad={a} editorSyncKey="s2" />);
    expect(insignias()).toEqual([]);
    cleanup();
    const r2 = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    unir("Perro", "Guau");
    r2.rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(insignias()).toEqual(["1", "1"]);
  });

  it("cambiar la identidad de `pares` (p. ej. al editar) reinicia las parejas y vuelve a mezclar", () => {
    const { rerender } = render(<ViewerComponente actividad={pares()} />);
    unir("Perro", "Guau");
    rerender(<ViewerComponente actividad={pares()} />);
    expect(insignias()).toEqual([]);
  });
});
