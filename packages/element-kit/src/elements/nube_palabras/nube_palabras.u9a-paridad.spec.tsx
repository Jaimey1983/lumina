/**
 * U9a.5 — paridad de Nube de palabras contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): cada palabra se emite por `onResponse` EN MAYÚSCULAS y por
 * separado, el tope por alumno, el contador y la nube local.
 *
 * OJO (hallazgo): la nube solo muestra las palabras del propio alumno (estado local); no hay
 * agregado entre alumnos. Se fija tal cual; está documentado en la ficha.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { WordCloud } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { WordCloudViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { nubePalabrasDefinition } from "./nube_palabras-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = nubePalabrasDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const nube = (parche: Partial<WordCloud> & Record<string, unknown> = {}): WordCloud =>
  ({
    tipo: "nube_palabras",
    instruccion: "¿Cómo te sientes?",
    maxPalabrasPorUsuario: 3,
    ...parche,
  }) as WordCloud;

const caja = () => screen.getByPlaceholderText("Escribe tu palabra...") as HTMLInputElement;
const enviar = () => screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement;
const agregar = (p: string) => {
  fireEvent.change(caja(), { target: { value: p } });
  fireEvent.click(enviar());
};

describe("Nube de palabras — paridad con el comportamiento anterior (U9a.5)", () => {
  it("muestra la instrucción (o la de siempre si está vacía) y el contador «0 de N»", () => {
    const { rerender } = render(<Viewer estado={nube()} config={{}} />);
    expect(screen.getByText("¿Cómo te sientes?")).toBeTruthy();
    expect(screen.getByText("0 de 3 palabras enviadas")).toBeTruthy();
    rerender(<Viewer estado={nube({ instruccion: "" })} config={{}} />);
    expect(screen.getByText("¿En una palabra, cómo describes el tema de hoy?")).toBeTruthy();
  });

  it("cada palabra se emite por separado, recortada y en MAYÚSCULAS, y suena `submit`", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={nube()} config={{ onResponse }} />);
    agregar("  alegría ");
    agregar("calma");
    expect(onResponse.mock.calls).toEqual([["ALEGRÍA"], ["CALMA"]]);
    expect(play.mock.calls).toEqual([["submit"], ["submit"]]);
    expect(caja().value).toBe(""); // el campo se vacía tras enviar
    expect(screen.getByText("2 de 3 palabras enviadas")).toBeTruthy();
  });

  it("sin texto (o solo espacios) «Enviar» está deshabilitado y no emite", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={nube()} config={{ onResponse }} />);
    expect(enviar().disabled).toBe(true);
    fireEvent.change(caja(), { target: { value: "   " } });
    expect(enviar().disabled).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(onResponse).not.toHaveBeenCalled();
  });

  it("al llegar al tope por alumno «Enviar» queda deshabilitado aunque haya texto", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={nube({ maxPalabrasPorUsuario: 2 })} config={{ onResponse }} />);
    agregar("uno");
    agregar("dos");
    fireEvent.change(caja(), { target: { value: "tres" } });
    expect(enviar().disabled).toBe(true);
    expect(onResponse.mock.calls).toEqual([["UNO"], ["DOS"]]);
    expect(screen.getByText("2 de 2 palabras enviadas")).toBeTruthy();
  });

  it("sin `maxPalabrasPorUsuario` no hay contador ni tope", () => {
    render(<Viewer estado={nube({ maxPalabrasPorUsuario: undefined })} config={{}} />);
    for (const p of ["a", "b", "c", "d", "e"]) agregar(p);
    expect(screen.queryByText(/palabras enviadas/)).toBeNull();
    fireEvent.change(caja(), { target: { value: "f" } });
    expect(enviar().disabled).toBe(false);
  });

  it("`maxCaracteresPorPalabra` limita el campo (20 si falta)", () => {
    const { rerender } = render(<Viewer estado={nube({ maxCaracteresPorPalabra: 8 })} config={{}} />);
    expect(caja().maxLength).toBe(8);
    rerender(<Viewer estado={nube()} config={{}} />);
    expect(caja().maxLength).toBe(20);
  });

  it("la nube local cuenta repeticiones y se oculta con `mostrarTiempoReal: false`", () => {
    const { rerender } = render(<Viewer estado={nube({ maxPalabrasPorUsuario: 5 })} config={{}} />);
    agregar("sol");
    agregar("Sol");
    agregar("luna");
    expect(screen.getByText("SOL")).toBeTruthy();
    expect(screen.getByText("LUNA")).toBeTruthy();
    // «sol» y «Sol» son la misma palabra: una sola entrada.
    expect(screen.getAllByText("SOL")).toHaveLength(1);
    rerender(<Viewer estado={nube({ maxPalabrasPorUsuario: 5, mostrarTiempoReal: false })} config={{}} />);
    expect(screen.queryByText("SOL")).toBeNull();
    expect(screen.getByText("3 de 5 palabras enviadas")).toBeTruthy();
  });

  it("es de participación en scoring: la evaluación no da acierto ni nota", () => {
    const ev = evaluateActivityResponse("nube_palabras", nube(), "SOL");
    expect({ correct: ev.correct ?? null, score: ev.score ?? null }).toEqual({ correct: null, score: null });
  });

  it("el componente reinicia palabras y campo al cambiar `editorSyncKey`", () => {
    const a = nube();
    const { rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" />);
    agregar("uno");
    fireEvent.change(caja(), { target: { value: "borrador" } });
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" />);
    expect(caja().value).toBe("");
    expect(screen.getByText("0 de 3 palabras enviadas")).toBeTruthy();
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = nube();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    agregar("uno");
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText("1 de 3 palabras enviadas")).toBeTruthy();
  });
});
