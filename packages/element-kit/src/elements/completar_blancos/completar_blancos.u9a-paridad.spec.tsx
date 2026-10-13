/**
 * U9a.3 — paridad de Completar blancos contra su comportamiento ANTERIOR a migrar al
 * `ActivityShell` (Regla 7): qué entrega por `onResponse` (`{ idHueco: texto }`), el sonido
 * que da al enviar, cómo lo califica `@lumina/scoring` y la mecánica visible.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { FillBlanks } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { FillBlanksViewer as ViewerComponente } from "../../activities/_classic/index.js";
import { completarBlancosDefinition } from "./completar_blancos-definition.js";

type Props = { estado: unknown; config: Record<string, unknown> };
const Viewer = completarBlancosDefinition.Viewer as unknown as (p: Props) => React.ReactElement;

afterEach(cleanup);
beforeEach(() => play.mockClear());

const ejercicio = (parche: Partial<FillBlanks> = {}): FillBlanks => ({
  tipo: "completar_blancos",
  texto: "El {{blank:b1}} es fundamental para {{blank:b2}}.",
  blancos: [
    { id: "b1", respuesta: "concepto", ignorarMayusculas: true },
    { id: "b2", respuesta: "aprender", ignorarMayusculas: true },
  ],
  puntos: 10,
  ...parche,
});

const huecos = (c: HTMLElement) => [...c.querySelectorAll("input")] as HTMLInputElement[];
const enviar = () => screen.getByRole("button", { name: "Enviar" });

describe("Completar blancos — paridad con el comportamiento anterior (U9a.3)", () => {
  it("dibuja el texto con un campo vacío por cada marcador, en orden", () => {
    const { container } = render(<Viewer estado={ejercicio()} config={{}} />);
    expect(huecos(container)).toHaveLength(2);
    expect(huecos(container).map((i) => i.value)).toEqual(["", ""]);
    expect(container.textContent).toContain("El ");
    expect(container.textContent).toContain(" es fundamental para ");
    expect(container.textContent).toContain(".");
  });

  it("emite `{ idHueco: texto }` con TODOS los huecos del texto, sin recortar, una sola vez", () => {
    const onResponse = vi.fn();
    const { container } = render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    fireEvent.change(huecos(container)[0], { target: { value: " concepto " } });
    fireEvent.click(enviar());
    fireEvent.click(screen.queryByRole("button", { name: "Enviar" }) ?? document.body);
    expect(onResponse.mock.calls).toEqual([[{ b1: " concepto ", b2: "" }]]);
  });

  it("«Enviar» está siempre habilitado: con todos los huecos vacíos emite cadenas vacías", () => {
    const onResponse = vi.fn();
    render(<Viewer estado={ejercicio()} config={{ onResponse }} />);
    expect((enviar() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ b1: "", b2: "" }]]);
  });

  it("al enviar: campos bloqueados, aparece «¡Respuesta enviada!» y desaparece el botón", () => {
    const { container } = render(<Viewer estado={ejercicio()} config={{}} />);
    fireEvent.click(enviar());
    expect(huecos(container).every((i) => i.disabled)).toBe(true);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar" })).toBeNull();
  });

  it("sonido al enviar: `correct` si todo acierta, `wrong` si algo falla (también parcial)", () => {
    const casos: [Record<string, string>, string][] = [
      [{ b1: "concepto", b2: "aprender" }, "correct"],
      [{ b1: "CONCEPTO", b2: "Aprender" }, "correct"],
      [{ b1: "concepto", b2: "otra" }, "wrong"],
      [{ b1: "", b2: "" }, "wrong"],
    ];
    for (const [resp, sonido] of casos) {
      play.mockClear();
      const { container } = render(<Viewer estado={ejercicio()} config={{}} />);
      huecos(container).forEach((h, i) => fireEvent.change(h, { target: { value: Object.values(resp)[i] } }));
      fireEvent.click(enviar());
      expect(play.mock.calls, JSON.stringify(resp)).toEqual([[sonido]]);
      cleanup();
    }
  });

  it("sin `blancos` definidos el sonido es `submit` (no hay clave para calificar)", () => {
    render(<Viewer estado={ejercicio({ blancos: [] })} config={{}} />);
    fireEvent.click(enviar());
    expect(play.mock.calls).toEqual([["submit"]]);
  });

  it("un texto sin marcadores muestra solo el texto y emite `{}`", () => {
    const onResponse = vi.fn();
    const { container } = render(
      <Viewer estado={ejercicio({ texto: "Nada que completar.", blancos: [] })} config={{ onResponse }} />,
    );
    expect(huecos(container)).toHaveLength(0);
    expect(container.textContent).toContain("Nada que completar.");
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{}]]);
  });

  it("un marcador cuyo id no está en `blancos` también se emite con lo escrito", () => {
    const onResponse = vi.fn();
    const { container } = render(
      <Viewer estado={ejercicio({ texto: "Solo {{blank:zz}}.", blancos: [] })} config={{ onResponse }} />,
    );
    fireEvent.change(huecos(container)[0], { target: { value: "algo" } });
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ zz: "algo" }]]);
  });

  it("calificación con @lumina/scoring: todo bien = 5; ninguno = nota mínima; parcial en medio", () => {
    const a = ejercicio();
    const notas = ([
      { b1: "concepto", b2: "aprender" },
      { b1: "concepto", b2: "x" },
      { b1: "x", b2: "x" },
    ] as const).map((r) => {
      const ev = evaluateActivityResponse("completar_blancos", a, r);
      return { correct: ev.correct, score: ev.score };
    });
    expect(notas).toEqual([
      { correct: true, score: 5 },
      { correct: false, score: 2.5 },
      { correct: false, score: 1 },
    ]);
  });

  it("el componente reinicia las respuestas al cambiar `editorSyncKey`", () => {
    const onResponse = vi.fn();
    const a = ejercicio();
    const { container, rerender } = render(<ViewerComponente activity={a} editorSyncKey="s1" onResponse={onResponse} />);
    fireEvent.change(huecos(container)[0], { target: { value: "uno" } });
    fireEvent.click(enviar());
    rerender(<ViewerComponente activity={a} editorSyncKey="s2" onResponse={onResponse} />);
    expect(huecos(container).map((i) => i.value)).toEqual(["", ""]);
    expect(huecos(container).every((i) => !i.disabled)).toBe(true);
    fireEvent.click(enviar());
    expect(onResponse.mock.calls).toEqual([[{ b1: "uno", b2: "" }], [{ b1: "", b2: "" }]]);
  });

  it("por el registro NO se reenvía `editorSyncKey` (el adaptador clásico no lo pasa): no reinicia", () => {
    const a = ejercicio();
    const { rerender } = render(<Viewer estado={a} config={{ editorSyncKey: "s1" }} />);
    fireEvent.click(enviar());
    rerender(<Viewer estado={a} config={{ editorSyncKey: "s2" }} />);
    expect(screen.getByText(/¡Respuesta enviada!/)).toBeTruthy();
  });
});
