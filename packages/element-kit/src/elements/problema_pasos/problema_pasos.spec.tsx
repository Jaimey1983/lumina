/**
 * U15 — Problema paso a paso (actividad nueva). Viewer (secuencial y no secuencial, pistas con
 * presupuesto y costo, tiempo, reintento), definición, editor/propiedades y el cruce
 * viewer → `@lumina/scoring`.
 */
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateActivityResponse } from "@lumina/scoring";
import type { ProblemaPasosActivity } from "@lumina/types/slide";

const play = vi.hoisted(() => vi.fn());
vi.mock("@lumina/editor-shared/use-sound", () => ({ useSound: () => ({ play }) }));

import { elementRegistry } from "../../index.js";
import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { normalizarAjustes } from "../../activities/_shared/activity-settings.js";
import { validarActividad } from "../../activities/_shared/produccion/validacion.js";
import { normalizarProblemaPasos } from "../../activities/problema-pasos/problema-pasos-config.js";
import { createDefaultProblemaPasos } from "../../activities/problema-pasos/problema-pasos-defaults.js";
import { problemaPasosDefinition as def } from "./problema_pasos-definition.js";

type PropsViewer = { estado: unknown; config: Record<string, unknown> };
const Viewer = def.Viewer as unknown as (p: PropsViewer) => React.ReactElement;
const Editor = def.Editor as unknown as (p: { estado: unknown; config: object; onChange(e: unknown): void }) => React.ReactElement;
const Propiedades = def.Propiedades as unknown as (p: {
  estado: unknown;
  config: object;
  onChange(e: unknown): void;
  onConfigChange(c: object): void;
}) => React.ReactElement;

beforeEach(() => play.mockClear());
afterEach(cleanup);

const base = (parche: Partial<ProblemaPasosActivity> = {}): ProblemaPasosActivity => ({
  tipo: "problema_pasos",
  enunciado: "Un problema de prueba",
  secuencial: true,
  pasos: [
    { id: "p1", instruccion: "Calcula el área", modo: "numerico", respuesta: "15", unidad: "m²", pistas: ["Base por altura", "Multiplica 5 por 3"] },
    { id: "p2", instruccion: "Escribe la expresión", modo: "algebraico", respuesta: "2x+2", pistas: ["Factoriza"] },
  ],
  ...parche,
});

const montar = (a: ProblemaPasosActivity = base()) => {
  const onResponse = vi.fn();
  const r = render(<Viewer estado={a} config={{ onResponse }} />);
  return { onResponse, ...r };
};
const campo = (n: number) => screen.getByLabelText(`Respuesta del paso ${n}`) as HTMLInputElement;
const escribir = (n: number, v: string) => fireEvent.change(campo(n), { target: { value: v } });
const comprobarPaso = () => fireEvent.click(screen.getByRole("button", { name: "Comprobar paso" }));
const pista = (n: number, m: number) => fireEvent.click(screen.getByRole("button", { name: `Pedir pista (${n} de ${m})` }));
const pasoVisible = (id: string) => document.querySelector(`[data-paso="${id}"]`);
const anuncio = () => screen.getByTestId("anuncio-tocar-colocar").textContent;

describe("Viewer secuencial", () => {
  it("muestra el enunciado y solo el primer paso; el botón espera una respuesta", () => {
    montar();
    expect(screen.getByText("Un problema de prueba")).toBeTruthy();
    expect(pasoVisible("p1")).not.toBeNull();
    expect(pasoVisible("p2")).toBeNull();
    expect((screen.getByRole("button", { name: "Comprobar paso" }) as HTMLButtonElement).disabled).toBe(true);
    escribir(1, "15");
    expect((screen.getByRole("button", { name: "Comprobar paso" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("un paso incorrecto avisa y deja reintentar sin avanzar; uno correcto se pliega y aparece el siguiente", () => {
    montar();
    escribir(1, "14");
    comprobarPaso();
    expect(screen.getByRole("alert").textContent).toContain("Todavía no es correcto");
    expect(pasoVisible("p2")).toBeNull();
    expect(play).toHaveBeenCalledWith("wrong");
    escribir(1, "15");
    comprobarPaso();
    expect(pasoVisible("p1")!.getAttribute("data-resuelto")).toBe("true");
    expect(pasoVisible("p1")!.textContent).toContain("Paso 1 correcto: 15 m²");
    expect(pasoVisible("p2")).not.toBeNull();
    expect(anuncio()).toBe("Paso 1 correcto.");
  });
  it("Enter comprueba el paso", () => {
    montar();
    escribir(1, "15");
    fireEvent.keyDown(campo(1), { key: "Enter" });
    expect(pasoVisible("p2")).not.toBeNull();
  });
  it("una expresión ilegible no se comprueba y dice por qué", () => {
    montar();
    escribir(1, "15");
    comprobarPaso();
    escribir(2, "2(x+");
    comprobarPaso();
    expect(screen.getByRole("alert").textContent).toContain("Revisa tu expresión");
    expect(pasoVisible("p2")!.getAttribute("data-resuelto")).toBeNull();
  });
  it("al resolver el último paso emite UNA respuesta con todos los pasos y abre el resultado", () => {
    const { onResponse } = montar();
    escribir(1, "15");
    comprobarPaso();
    escribir(2, "2(x+1)");
    comprobarPaso();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith([
      { pasoId: "p1", respuesta: "15", pistasUsadas: 0 },
      { pasoId: "p2", respuesta: "2(x+1)", pistasUsadas: 0 },
    ]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Nota 5.0 de 5")).toBeTruthy();
    expect(play).toHaveBeenCalledWith("correct");
  });
});

describe("Pistas", () => {
  it("se piden de a una, en orden, con contador, y quedan visibles", () => {
    montar();
    expect(screen.queryByLabelText("Pistas del paso 1")).toBeNull();
    pista(0, 2);
    expect(within1().textContent).toContain("Base por altura");
    expect(anuncio()).toBe("Pista 1: Base por altura");
    pista(1, 2);
    expect(within1().textContent).toContain("Multiplica 5 por 3");
    expect((screen.getByRole("button", { name: "Pedir pista (2 de 2)" }) as HTMLButtonElement).disabled).toBe(true);
  });
  const within1 = () => screen.getByLabelText("Pistas del paso 1");
  it("las pistas usadas viajan en la respuesta y el costo baja la nota (20 % por pista → 4.0 con una)", () => {
    const a = base({ ajustes: { pistas: { cantidad: null, costoPct: 20 } } });
    const { onResponse } = montar(a);
    expect(screen.getByText("Cada pista resta 20 % de ese paso en la nota.")).toBeTruthy();
    pista(0, 2);
    escribir(1, "15");
    comprobarPaso();
    escribir(2, "2x+2");
    comprobarPaso();
    expect(onResponse).toHaveBeenCalledWith([
      { pasoId: "p1", respuesta: "15", pistasUsadas: 1 },
      { pasoId: "p2", respuesta: "2x+2", pistasUsadas: 0 },
    ]);
    // crédito 0,8 + 1 = 1,8 de 2 → 4,5
    expect(screen.getByLabelText("Nota 4.5 de 5")).toBeTruthy();
  });
  it("el presupuesto total de pistas (ajustes.pistas.cantidad) se agota entre pasos", () => {
    const a = base({ ajustes: { pistas: { cantidad: 1, costoPct: 0 } } });
    montar(a);
    expect(screen.getByText("Pistas disponibles: 1.")).toBeTruthy();
    pista(0, 2);
    expect(screen.getByText("Pistas disponibles: 0.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Pedir pista (1 de 2)" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("sin pistas escritas no hay botón; con cantidad 0 en los ajustes tampoco se puede pedir", () => {
    montar(base({ pasos: [{ id: "p1", instruccion: "x", modo: "numerico", respuesta: "1", pistas: ["", "  "] }] }));
    expect(screen.queryByRole("button", { name: /Pedir pista/ })).toBeNull();
    cleanup();
    montar(base({ ajustes: { pistas: { cantidad: 0, costoPct: 0 } } }));
    expect((screen.getByRole("button", { name: /Pedir pista/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Viewer no secuencial", () => {
  it("muestra todos los pasos y comprueba al final", () => {
    const { onResponse } = montar(base({ secuencial: false }));
    expect(pasoVisible("p1")).not.toBeNull();
    expect(pasoVisible("p2")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Comprobar paso" })).toBeNull();
    expect((screen.getByRole("button", { name: "Comprobar" }) as HTMLButtonElement).disabled).toBe(true);
    escribir(1, "15");
    escribir(2, "x+1");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onResponse).toHaveBeenCalledWith([
      { pasoId: "p1", respuesta: "15", pistasUsadas: 0 },
      { pasoId: "p2", respuesta: "x+1", pistasUsadas: 0 },
    ]);
    expect(screen.getByLabelText("Nota 2.5 de 5")).toBeTruthy();
  });
  it("los pasos sin contestar van con texto vacío; una expresión ilegible bloquea el envío", () => {
    const { onResponse } = montar(base({ secuencial: false }));
    escribir(1, "15");
    escribir(2, "2(x+");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onResponse).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Revisa tu expresión");
    escribir(2, "");
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onResponse).toHaveBeenCalledWith([
      { pasoId: "p1", respuesta: "15", pistasUsadas: 0 },
      { pasoId: "p2", respuesta: "", pistasUsadas: 0 },
    ]);
  });
});

describe("Tiempo, reintento y contenido", () => {
  it("se acaba el tiempo: envía lo resuelto hasta ahí (una sola vez) y avisa", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    try {
      const { onResponse } = montar(base({ ajustes: { tiempoLimiteSeg: 5 } }));
      escribir(1, "15");
      comprobarPaso();
      act(() => void vi.advanceTimersByTime(8000));
      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledWith([
        { pasoId: "p1", respuesta: "15", pistasUsadas: 0 },
        { pasoId: "p2", respuesta: "", pistasUsadas: 0 },
      ]);
      expect(screen.getByLabelText("Nota 2.5 de 5")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
  it("con intentos > 1 se puede reintentar y empieza de cero", () => {
    const { onResponse } = montar(base({ ajustes: { intentos: 2 } }));
    pista(0, 2);
    escribir(1, "15");
    comprobarPaso();
    escribir(2, "2x+2");
    comprobarPaso();
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(campo(1).value).toBe("");
    expect(pasoVisible("p2")).toBeNull();
    expect(screen.queryByLabelText("Pistas del paso 1")).toBeNull();
    escribir(1, "15");
    comprobarPaso();
    escribir(2, "2x+2");
    comprobarPaso();
    expect(onResponse).toHaveBeenCalledTimes(2);
    expect(onResponse.mock.calls[1]![0][0].pistasUsadas).toBe(0);
  });
  it("cambiar solo un ajuste (estilo) no reinicia lo avanzado; editar el contenido sí", () => {
    const a = base();
    const { rerender } = montar(a);
    escribir(1, "15");
    comprobarPaso();
    rerender(<Viewer estado={{ ...a, ajustes: { estilo: "arcade" } }} config={{}} />);
    expect(pasoVisible("p1")!.getAttribute("data-resuelto")).toBe("true");
    rerender(<Viewer estado={{ ...a, enunciado: "Otro" }} config={{}} />);
    expect(pasoVisible("p1")!.getAttribute("data-resuelto")).toBeNull();
  });
  it("las fórmulas del enunciado (entre \\( y \\)) se muestran como matemática, sin los delimitadores", async () => {
    montar(base({ enunciado: "Resuelve \\(x^2=4\\)" }));
    await waitFor(() => expect(document.body.textContent).toContain("x^2=4"));
    expect(document.body.textContent).not.toContain("\\(");
  });
});

describe("Cruce viewer → scoring", () => {
  const jugar = (a: ProblemaPasosActivity, hacer: () => void) => {
    const { onResponse } = montar(a);
    hacer();
    const r = onResponse.mock.calls[0]![0];
    cleanup();
    return evaluateActivityResponse("problema_pasos", a, r);
  };
  it("todo bien sin pistas → 5; con pistas y costo → lo que dice el scoring", () => {
    const flujo = () => {
      pista(0, 2);
      pista(1, 2);
      escribir(1, "15");
      comprobarPaso();
      escribir(2, "2(x+1)");
      comprobarPaso();
    };
    expect(jugar(base(), () => { escribir(1, "15"); comprobarPaso(); escribir(2, "2x+2"); comprobarPaso(); }).score).toBe(5);
    // 2 pistas × 25 % = 50 % del paso 1: (0,5 + 1) / 2 → 3,75 → 3,8
    const r = jugar(base({ ajustes: { pistas: { cantidad: null, costoPct: 25 } } }), flujo);
    expect(r).toMatchObject({ correct: true, score: 3.8 });
  });
});

describe("Definición", () => {
  it("se registra una sola vez como partial, con catálogo y eventos", () => {
    expect(elementRegistry.obtener("problema_pasos")).toBe(def);
    expect(elementRegistry.listar().filter((d) => (d as { tipo: string }).tipo === "problema_pasos")).toHaveLength(1);
    expect(def.catalogo).toMatchObject({ nombre: "Problema paso a paso", familia: "actividad" });
    expect(def.eventos).toEqual(["respuesta_correcta", "respuesta_incorrecta"]);
    expect(def.puntuacion(base(), [{ pasoId: "p1", respuesta: "15", pistasUsadas: 0 }, { pasoId: "p2", respuesta: "2x+2", pistasUsadas: 0 }])).toBe(5);
  });
  it("lo que se crea por defecto es jugable y sin errores de validación", () => {
    const a = def.crearPorDefecto();
    expect(validarActividad(a).filter((p) => p.nivel === "error")).toEqual([]);
    expect(createDefaultProblemaPasos()).toEqual(a);
    expect(a.pasos.some((p) => p.modo === "algebraico")).toBe(true);
  });
  it("las pistas por defecto salen de los pasos: ilimitadas si alguno trae, 0 si ninguno", () => {
    expect(normalizarAjustes(base()).pistas.cantidad).toBeNull();
    expect(normalizarAjustes(base({ pasos: [{ id: "p", instruccion: "x", modo: "numerico", respuesta: "1", pistas: [] }] })).pistas.cantidad).toBe(0);
    expect(normalizarAjustes(base({ ajustes: { pistas: { cantidad: 2 } } })).pistas.cantidad).toBe(2);
  });
  it("las capacidades de ajustes son las que el viewer lee", () => {
    expect(CAPACIDADES_AJUSTES.problema_pasos).toEqual({
      mostrarNota: true, intentos: true, tiempo: true, pistas: true, sonido: true, estilo: true,
    });
  });
  it("normalizar completa lo que falta y respeta ajustes", () => {
    const n = normalizarProblemaPasos({ tipo: "problema_pasos", ajustes: { estilo: "examen" }, pasos: [{ respuesta: 5, modo: "raro", pistas: [1, null] }] } as never);
    expect(n.secuencial).toBe(true);
    expect(n.enunciado).toBe("");
    expect(n.pasos[0]).toMatchObject({ respuesta: "5", modo: "numerico", pistas: ["1", ""] });
    expect(n.pasos[0]!.id.length).toBeGreaterThan(0);
    expect(n.ajustes).toEqual({ estilo: "examen" });
  });
});

describe("Editor y propiedades", () => {
  it("el lienzo del editor lista los pasos con su cantidad de pistas", () => {
    render(<Editor estado={base()} config={{}} onChange={() => {}} />);
    expect(screen.getByText("2 pasos · en orden")).toBeTruthy();
    expect(screen.getByText("Calcula el área")).toBeTruthy();
  });
  /** Panel controlado: lo que emite `onChange` vuelve como `estado`, como en el editor real. */
  const montarProp = (a = base()) => {
    const onChange = vi.fn();
    function Controlado() {
      const [e, setE] = useState(a);
      return (
        <Propiedades
          estado={e}
          config={{}}
          onChange={(n) => {
            onChange(n);
            setE(n as ProblemaPasosActivity);
          }}
          onConfigChange={() => {}}
        />
      );
    }
    render(<Controlado />);
    return { ultimo: () => onChange.mock.calls.at(-1)![0] as ProblemaPasosActivity };
  };
  it("edita enunciado, secuencial, instrucción, modo y respuesta", () => {
    const { ultimo } = montarProp();
    fireEvent.change(screen.getByLabelText("Enunciado"), { target: { value: "Nuevo" } });
    expect(ultimo().enunciado).toBe("Nuevo");
    fireEvent.click(screen.getByLabelText(/Mostrar un paso a la vez/));
    expect(ultimo().secuencial).toBe(false);
    fireEvent.change(screen.getByLabelText("Instrucción del paso 1"), { target: { value: "Otra" } });
    expect(ultimo().pasos[0]!.instruccion).toBe("Otra");
    fireEvent.change(screen.getByLabelText("Tipo de respuesta del paso 1"), { target: { value: "algebraico" } });
    expect(ultimo().pasos[0]!.modo).toBe("algebraico");
    fireEvent.change(screen.getByLabelText("Respuesta modelo del paso 1"), { target: { value: "3x" } });
    expect(ultimo().pasos[0]!.respuesta).toBe("3x");
  });
  it("avisa si la respuesta modelo no se puede leer", () => {
    montarProp(base({ pasos: [{ id: "p", instruccion: "x", modo: "numerico", respuesta: "doce", pistas: [] }] }));
    expect(screen.getByRole("alert").textContent).toBe("La respuesta modelo no es un número.");
    cleanup();
    montarProp(base({ pasos: [{ id: "p", instruccion: "x", modo: "algebraico", respuesta: "2(x+", pistas: [] }] }));
    expect(screen.getByRole("alert").textContent).toMatch(/^No se puede leer la expresión/);
  });
  it("tolerancia y unidad solo en pasos numéricos; la tolerancia se describe", () => {
    const { ultimo } = montarProp();
    expect(screen.getByText("Respuesta exacta (número entero).")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Tolerancia del paso 1"), { target: { value: "0.5" } });
    expect(ultimo().pasos[0]!.tolerancia).toBe(0.5);
    fireEvent.change(screen.getByLabelText("Unidad del paso 1"), { target: { value: "cm" } });
    expect(ultimo().pasos[0]!.unidad).toBe("cm");
    expect(screen.queryByLabelText("Tolerancia del paso 2")).toBeNull();
  });
  it("agrega y quita pasos y pistas, y los reordena; respeta los mínimos y máximos", () => {
    const { ultimo } = montarProp();
    fireEvent.click(screen.getByRole("button", { name: "Agregar paso" }));
    expect(ultimo().pasos).toHaveLength(3);
    fireEvent.click(screen.getByLabelText("Quitar paso 3"));
    expect(ultimo().pasos).toHaveLength(2);
    fireEvent.click(screen.getByLabelText("Bajar paso 1"));
    expect(ultimo().pasos.map((p) => p.id)).toEqual(["p2", "p1"]);
    fireEvent.click(screen.getByRole("button", { name: "Agregar pista al paso 2" }));
    expect(ultimo().pasos[1]!.pistas).toHaveLength(3);
    fireEvent.click(screen.getByLabelText("Quitar pista 1 del paso 1"));
    expect(ultimo().pasos[0]!.pistas).toEqual([]);
    cleanup();
    montarProp(base({ pasos: [base().pasos[0]!] }));
    expect((screen.getByLabelText("Quitar paso 1") as HTMLButtonElement).disabled).toBe(true);
  });
  it("explica cómo escribir fórmulas con los delimitadores correctos", () => {
    montarProp();
    expect(screen.getByText("Las fórmulas van entre \\( y \\): \\(x^2\\).")).toBeTruthy();
  });
  it("el panel suma el panel de producción (revisión) y los ajustes comunes", () => {
    montarProp();
    expect(document.querySelector("[data-panel-produccion]")).not.toBeNull();
    expect(screen.getByText("Revisión")).toBeTruthy();
  });
});
