/**
 * U8 — presets de estilo (`crearPresetsDeEstilo`) y los de Memoria y Verdadero/Falso.
 */
import { describe, expect, it } from "vitest";
import { aplicarPreset, presetCoincide } from "@lumina/editor-shared/preset-gallery";
import type { MemoriaActivity, TrueFalse } from "@lumina/types/slide";

import { PRESETS_MEMORIA } from "../../elements/memoria/memoria-estilos.js";
import { PRESETS_VERDADERO_FALSO } from "../../elements/verdadero_falso/verdadero_falso-estilos.js";
import { createDefaultMemoria } from "../memoria/index.js";
import { CAPACIDADES_AJUSTES } from "./activity-ajustes-capacidades.js";
import { ORDEN_ESTILOS, crearPresetsDeEstilo } from "./activity-estilos.js";
import { normalizarAjustes } from "./activity-settings.js";

const vf = (): TrueFalse => ({ tipo: "verdadero_falso", afirmacion: "x", respuestaCorrecta: true });

describe("crearPresetsDeEstilo", () => {
  it("un preset por estilo, en orden, con nombre y descripción", () => {
    const p = crearPresetsDeEstilo({ estilo: true });
    expect(p.map((x) => x.id)).toEqual(["escolar", "examen", "arcade", "minimal", "pizarra"]);
    expect(p.map((x) => x.id)).toEqual([...ORDEN_ESTILOS]);
    expect(p.map((x) => x.label)).toEqual(["Escolar", "Examen", "Arcade", "Minimal", "Pizarra"]);
    for (const x of p) expect(x.description!.length).toBeGreaterThan(10);
  });

  it("cada preset fija su `estilo` y solo los ajustes que el tipo soporta", () => {
    const solo = crearPresetsDeEstilo({ estilo: true });
    for (const x of solo) {
      expect(Object.keys((x.estadoPatch as { ajustes: object }).ajustes).sort()).toEqual(["estilo", "sonido"]);
    }
    const completo = crearPresetsDeEstilo({ estilo: true, sonido: true, intentos: true, barajar: true, mostrarNota: true });
    const examen = completo.find((x) => x.id === "examen")!.estadoPatch as { ajustes: Record<string, unknown> };
    expect(examen.ajustes).toEqual({ estilo: "examen", sonido: false, mostrarNota: true, intentos: 1, barajar: true });
  });

  it("los extras del tipo se suman como parche profundo", () => {
    const p = crearPresetsDeEstilo<MemoriaActivity>(CAPACIDADES_AJUSTES.memoria!, { arcade: { configuracion: { colorDorso: "#123456" } } });
    expect(p.find((x) => x.id === "arcade")!.estadoPatch).toMatchObject({ configuracion: { colorDorso: "#123456" }, ajustes: { estilo: "arcade" } });
    expect(p.find((x) => x.id === "pizarra")!.estadoPatch).not.toHaveProperty("configuracion");
  });
});

describe("estilos de Memoria", () => {
  it("el patch solo toca `ajustes` y el color del dorso: nunca los pares ni el resto de la configuración", () => {
    for (const preset of PRESETS_MEMORIA) {
      const patch = preset.estadoPatch as Record<string, unknown>;
      expect(Object.keys(patch).sort(), preset.id).toEqual(["ajustes", "configuracion"]);
      expect(Object.keys(patch.configuracion as object).sort(), preset.id).toEqual(["colorDorso", "colorSimboloDorso"]);
    }
  });

  it("aplicar un estilo cambia el aspecto y conserva pares, columnas y volteo", () => {
    const base = createDefaultMemoria();
    for (const preset of PRESETS_MEMORIA) {
      const a = aplicarPreset(base, preset as never) as MemoriaActivity;
      expect(a.pares, preset.id).toEqual(base.pares);
      expect(a.configuracion.columnas).toBe(base.configuracion.columnas);
      expect(a.configuracion.tiempoVolteo).toBe(base.configuracion.tiempoVolteo);
      expect(normalizarAjustes(a).estilo).toBe(preset.id);
      expect(presetCoincide(a, preset as never)).toBe(true);
    }
  });

  it("Examen: un intento, sin sonido y mazo barajado; Arcade: intentos ilimitados y sonido", () => {
    const base = createDefaultMemoria();
    const examen = normalizarAjustes(aplicarPreset(base, PRESETS_MEMORIA.find((p) => p.id === "examen")! as never) as MemoriaActivity);
    expect(examen).toMatchObject({ estilo: "examen", sonido: false, intentos: 1, barajar: true, mostrarNota: true });
    const arcade = normalizarAjustes(aplicarPreset(base, PRESETS_MEMORIA.find((p) => p.id === "arcade")! as never) as MemoriaActivity);
    expect(arcade).toMatchObject({ estilo: "arcade", sonido: true, intentos: null });
  });

  it("un estilo se desmarca al cambiar un valor que él fijaba", () => {
    const base = createDefaultMemoria();
    const examen = PRESETS_MEMORIA.find((p) => p.id === "examen")! as never;
    const a = aplicarPreset(base, examen) as MemoriaActivity;
    expect(presetCoincide(a, examen)).toBe(true);
    expect(presetCoincide({ ...a, ajustes: { ...a.ajustes, sonido: true } }, examen)).toBe(false);
  });
});

describe("estilos de Verdadero/Falso", () => {
  it("solo escriben `ajustes`, y solo lo que V/F soporta (sin intentos ni orden)", () => {
    for (const preset of PRESETS_VERDADERO_FALSO) {
      const patch = preset.estadoPatch as { ajustes: Record<string, unknown> };
      expect(Object.keys(patch), preset.id).toEqual(["ajustes"]);
      for (const k of Object.keys(patch.ajustes)) expect(["estilo", "sonido", "retroalimentacion", "mostrarSolucion"], `${preset.id}.${k}`).toContain(k);
    }
  });

  it("Examen apaga el mensaje y la explicación; Escolar los deja al responder", () => {
    const examen = normalizarAjustes(aplicarPreset(vf(), PRESETS_VERDADERO_FALSO.find((p) => p.id === "examen")! as never) as TrueFalse);
    expect(examen).toMatchObject({ estilo: "examen", sonido: false, retroalimentacion: "ninguna", mostrarSolucion: false });
    const escolar = normalizarAjustes(aplicarPreset(vf(), PRESETS_VERDADERO_FALSO.find((p) => p.id === "escolar")! as never) as TrueFalse);
    expect(escolar).toMatchObject({ estilo: "escolar", sonido: true, retroalimentacion: "inmediata" });
  });

  it("aplicar un estilo no toca el enunciado, la respuesta ni la retroalimentación del docente", () => {
    const base: TrueFalse = { ...vf(), afirmacion: "Hola", respuestaCorrecta: false, retroalimentacion: { explicacion: "Porque sí." } };
    for (const preset of PRESETS_VERDADERO_FALSO) {
      const a = aplicarPreset(base, preset as never) as TrueFalse;
      expect({ ...a, ajustes: undefined }).toEqual({ ...base, ajustes: undefined });
    }
  });
});
