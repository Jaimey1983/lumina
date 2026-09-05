/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { evaluateActivityResponse } from "@lumina/scoring";
import { elementRegistry } from "../index.js";
import * as quiz from "./quiz_multiple/index.js";
import * as vf from "./verdadero_falso/index.js";
import * as blancos from "./completar_blancos/index.js";
import * as drag from "./arrastrar_soltar/index.js";
import * as empar from "./emparejar/index.js";
import * as orden from "./ordenar_pasos/index.js";
import * as video from "./video_interactivo/index.js";
import * as corta from "./short_answer/index.js";
import * as encuesta from "./encuesta_viva/index.js";
import * as nube from "./nube_palabras/index.js";

interface Caso {
  tipo: string;
  def: any;
  evaluar: (e: any, r: any) => {
    correct: boolean | null;
    details: unknown[];
    score: number | null;
  };
  /** Respuesta representativa; da igual el valor exacto — se compara kit vs scoring. */
  respuesta: unknown;
}

const CASOS: Caso[] = [
  { tipo: "quiz_multiple", def: quiz.quizMultipleDefinition, evaluar: quiz.evaluarQuizMultiple, respuesta: { answers: { "q-1": ["a"] } } },
  { tipo: "verdadero_falso", def: vf.verdaderoFalsoDefinition, evaluar: vf.evaluarVerdaderoFalso, respuesta: true },
  { tipo: "completar_blancos", def: blancos.completarBlancosDefinition, evaluar: blancos.evaluarCompletarBlancos, respuesta: { b1: "concepto", b2: "aprender" } },
  { tipo: "arrastrar_soltar", def: drag.arrastrarSoltarDefinition, evaluar: drag.evaluarArrastrarSoltar, respuesta: [{ itemId: "i1", zoneId: "z1" }] },
  { tipo: "emparejar", def: empar.emparejarDefinition, evaluar: empar.evaluarEmparejar, respuesta: [] },
  { tipo: "ordenar_pasos", def: orden.ordenarPasosDefinition, evaluar: orden.evaluarOrdenarPasos, respuesta: ["s1", "s2", "s3", "s4"] },
  { tipo: "video_interactivo", def: video.videoInteractivoDefinition, evaluar: video.evaluarVideoInteractivo, respuesta: { historial: [{ questionIndex: 0, answer: "a" }] } },
  { tipo: "short_answer", def: corta.shortAnswerDefinition, evaluar: corta.evaluarShortAnswer, respuesta: "algo" },
  { tipo: "encuesta_viva", def: encuesta.encuestaVivaDefinition, evaluar: encuesta.evaluarEncuestaViva, respuesta: "o1" },
  { tipo: "nube_palabras", def: nube.nubePalabrasDefinition, evaluar: nube.evaluarNubePalabras, respuesta: "palabra" },
];

describe("Familia clásica — paridad ElementDefinition vs @lumina/scoring (E2.5)", () => {
  it.each(CASOS)("$tipo — crearPorDefecto usa la plantilla del editor", ({ tipo, def }) => {
    expect(def.crearPorDefecto().tipo).toBe(tipo);
  });

  it.each(CASOS)("$tipo — el delegado del kit == evaluateActivityResponse", ({ tipo, def, evaluar, respuesta }) => {
    const estado = def.crearPorDefecto();
    const esperado = evaluateActivityResponse(tipo, estado, respuesta);
    const viaKit = evaluar(estado, respuesta);
    expect(viaKit.correct).toBe(esperado.correct);
    expect(viaKit.score).toBe(esperado.score);
    expect(viaKit.details).toEqual(esperado.details);
    expect(def.puntuacion(estado, respuesta)).toBe(esperado.score ?? 0);
  });

  it.each(CASOS)("$tipo — registrado con puntuacion y apariencia", ({ tipo, def }) => {
    const reg = elementRegistry.obtener(tipo as never) as any;
    expect(reg).toBe(def);
    expect(reg?.puntuacion).toBeTypeOf("function");
    expect(reg?.apariencia).toEqual({ color: false, tipografia: false, animacion: false });
  });

  it.each(CASOS)("$tipo — Editor / Viewer / Propiedades renderizan sin lanzar", ({ def }) => {
    const estado = def.crearPorDefecto();
    const Editor = def.Editor as ComponentType<any>;
    const Propiedades = def.Propiedades as ComponentType<any>;
    const Viewer = def.Viewer as ComponentType<any>;
    expect(() => render(<Editor estado={estado} config={{}} onChange={() => undefined} />).unmount()).not.toThrow();
    expect(() => render(<Propiedades estado={estado} config={{}} onChange={() => undefined} />).unmount()).not.toThrow();
    expect(() => render(<Viewer estado={estado} config={{}} />).unmount()).not.toThrow();
  });
});
