/**
 * U2 — `normalizarAjustes` (etapa U / DU3). Cubre los 34 tipos de `Activity`: los 28 del
 * kit con su payload real (`crearPorDefecto()` del registry) y `torneo`, `escape_room` y
 * `ruleta`, que viven fuera del kit.
 */
import { describe, expect, it } from "vitest";
import { elementRegistry } from "@lumina/element-kit-core";
import type { Activity } from "@lumina/types/slide";

import { normalizarQuizMultiple } from "../_classic/quiz-multiple-normalize.js";
import { normalizarEmparejar } from "../emparejar/emparejar-config.js";
import { normalizarAbrirCaja } from "../abrir-caja/abrir-caja-config.js";
import { normalizarGlobos } from "../globos/globos-config.js";
import { normalizarTopo } from "../topo/topo-config.js";
import { normalizarAhorcado } from "../ahorcado/ahorcado-config.js";
import { DERIVACION_LEGACY, normalizarAjustes } from "./activity-settings.js";

const TIPOS_KIT = [
  "quiz_multiple", "verdadero_falso", "short_answer", "respuesta_matematica",
  "completar_blancos", "arrastrar_soltar", "emparejar", "relacionar_lineas", "etiquetar_imagen", "linea_tiempo", "cloze_banco", "problema_pasos", "ordenar_pasos",
  "video_interactivo", "encuesta_viva", "nube_palabras", "balancear_ecuacion",
  "ubicar_elemento", "formular_compuesto", "clasificar", "memoria", "puzzle_imagen",
  "sopa_letras", "crucigrama", "anagrama", "ahorcado", "puzzle_palabras", "abrir_caja",
  "globos", "topo", "historia_ramificada",
] as const;

const FUERA_DEL_KIT: Record<string, Activity> = {
  torneo: { tipo: "torneo", preguntas: [], puntosBase: 100, bonusVelocidad: 50 },
  escape_room: {
    tipo: "escape_room", titulo: "T", introduccion: "", salas: [],
    mostrarRanking: false, puntosBase: 300,
  },
  ruleta: {
    tipo: "ruleta",
    configuracion: { colores: [], sonido: false, duracionGiro: 3000, mostrarGanador: true },
    items: [],
  },
};

/** Valores por defecto esperados = comportamiento de ANTES de U2. */
const DEFECTOS: Record<string, { modo: string; intentos: number | null; barajar: boolean; nota: boolean }> = {
  quiz_multiple: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  verdadero_falso: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  short_answer: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  respuesta_matematica: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  completar_blancos: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  arrastrar_soltar: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  emparejar: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  relacionar_lineas: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  etiquetar_imagen: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  linea_tiempo: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  cloze_banco: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  problema_pasos: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  ordenar_pasos: { modo: "evaluacion", intentos: 1, barajar: true, nota: true },
  video_interactivo: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  encuesta_viva: { modo: "practica", intentos: 1, barajar: false, nota: false },
  nube_palabras: { modo: "practica", intentos: 1, barajar: false, nota: false },
  balancear_ecuacion: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  ubicar_elemento: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  formular_compuesto: { modo: "evaluacion", intentos: 1, barajar: false, nota: true },
  clasificar: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  memoria: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  puzzle_imagen: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  sopa_letras: { modo: "evaluacion", intentos: null, barajar: false, nota: true },
  crucigrama: { modo: "evaluacion", intentos: null, barajar: false, nota: true },
  anagrama: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  ahorcado: { modo: "evaluacion", intentos: null, barajar: false, nota: true },
  puzzle_palabras: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  abrir_caja: { modo: "evaluacion", intentos: null, barajar: false, nota: true },
  globos: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  topo: { modo: "evaluacion", intentos: null, barajar: true, nota: true },
  historia_ramificada: { modo: "evaluacion", intentos: null, barajar: false, nota: true },
  torneo: { modo: "practica", intentos: 1, barajar: false, nota: false },
  escape_room: { modo: "practica", intentos: 1, barajar: false, nota: false },
  ruleta: { modo: "practica", intentos: 1, barajar: false, nota: false },
};

function payload(tipo: string): Activity {
  if (tipo in FUERA_DEL_KIT) return structuredClone(FUERA_DEL_KIT[tipo]);
  // El registro del kit está tipado por catálogo; acá se consulta por `tipo` en runtime.
  const def = (elementRegistry as unknown as {
    obtener(t: string): { crearPorDefecto(): Activity } | undefined;
  }).obtener(tipo);
  if (!def) throw new Error(`el registry no tiene ${tipo}`);
  return def.crearPorDefecto();
}

/** Parche profundo y superficial sobre el payload por defecto. */
function con(tipo: string, parche: Record<string, unknown>): Activity {
  const base = payload(tipo) as unknown as Record<string, unknown>;
  const cfg = base.configuracion as Record<string, unknown> | undefined;
  const { configuracion, ...resto } = parche as { configuracion?: Record<string, unknown> };
  return { ...base, ...resto, ...(configuracion ? { configuracion: { ...cfg, ...configuracion } } : {}) } as unknown as Activity;
}

describe("normalizarAjustes — cobertura", () => {
  it("la tabla de derivación tiene una entrada por cada tipo de Activity (34)", async () => {
    await import("../../index.js");
    expect(Object.keys(DERIVACION_LEGACY).sort()).toEqual(
      [...TIPOS_KIT, ...Object.keys(FUERA_DEL_KIT)].sort(),
    );
    expect(Object.keys(DERIVACION_LEGACY)).toHaveLength(34);
  });

  for (const tipo of [...TIPOS_KIT, ...Object.keys(FUERA_DEL_KIT)]) {
    it(`${tipo}: sin \`ajustes\` devuelve el comportamiento de antes`, async () => {
      await import("../../index.js");
      const a = normalizarAjustes(payload(tipo));
      const esperado = DEFECTOS[tipo];
      expect(a.modo).toBe(esperado.modo);
      expect(a.mostrarNota).toBe(esperado.nota);
      expect(a.barajar).toBe(esperado.barajar);
      expect(a.semilla).toBeNull();
      expect(a.retroalimentacion).toBe("inmediata");
      expect(a.pistas.costoPct).toBe(0);
      // intentos: se compara salvo los tipos cuyo default sale del payload real (ver derivación)
      if (!["clasificar", "puzzle_palabras", "anagrama"].includes(tipo)) {
        expect(a.intentos).toBe(esperado.intentos);
      }
    });
  }
});

describe("normalizarAjustes — derivación de campos legacy", () => {
  it("quiz: barajar y tiempo por pregunta solo en SYNCED", async () => {
    await import("../../index.js");
    const a = normalizarAjustes(con("quiz_multiple", { shuffleOptions: true, deliveryMode: "SYNCED", timePerQuestion: 20 }));
    expect(a).toMatchObject({ barajar: true, tiempoLimiteSeg: 20, tiempoPorPregunta: true });
    const b = normalizarAjustes(con("quiz_multiple", { shufflePreguntas: true, deliveryMode: "AUTONOMOUS", timePerQuestion: 20 }));
    expect(b).toMatchObject({ barajar: true, tiempoLimiteSeg: null, tiempoPorPregunta: false });
  });

  it("V/F: mostrarExplicacion → mostrarSolucion", async () => {
    await import("../../index.js");
    expect(normalizarAjustes(con("verdadero_falso", { retroalimentacion: { mostrarExplicacion: true } })).mostrarSolucion).toBe(true);
    expect(normalizarAjustes(con("verdadero_falso", { retroalimentacion: {} })).mostrarSolucion).toBe(false);
  });

  it("`Feedback.intentosPermitidos` (sin lector ni editor) NO deriva `intentos`", async () => {
    await import("../../index.js");
    const a = normalizarAjustes(con("verdadero_falso", { retroalimentacion: { intentosPermitidos: 5 } }));
    expect(a.intentos).toBe(1);
  });

  it("respuesta corta y matemática: hint no vacío → 1 pista", async () => {
    await import("../../index.js");
    expect(normalizarAjustes(con("short_answer", { hint: "Empieza por M" })).pistas.cantidad).toBe(1);
    expect(normalizarAjustes(con("short_answer", { hint: "  " })).pistas.cantidad).toBe(0);
    expect(normalizarAjustes(con("respuesta_matematica", { hint: "Suma primero" })).pistas.cantidad).toBe(1);
  });

  it("encuesta viva y escape room: tiempo", async () => {
    await import("../../index.js");
    expect(normalizarAjustes(con("encuesta_viva", { tiempoLimiteSeg: 45 })).tiempoLimiteSeg).toBe(45);
    expect(normalizarAjustes({ ...FUERA_DEL_KIT.escape_room, tiempoLimiteMinutos: 10 } as Activity).tiempoLimiteSeg).toBe(600);
    expect(normalizarAjustes({ ...FUERA_DEL_KIT.escape_room, tiempoLimiteMinutos: 0 } as Activity).tiempoLimiteSeg).toBeNull();
  });

  it("clasificar y puzzle de palabras: permitirReintento → intentos", async () => {
    await import("../../index.js");
    expect(normalizarAjustes(con("clasificar", { configuracion: { permitirReintento: false } })).intentos).toBe(1);
    expect(normalizarAjustes(con("clasificar", { configuracion: { permitirReintento: true } })).intentos).toBeNull();
    const pp = normalizarAjustes(con("puzzle_palabras", { configuracion: { permitirReintento: false, mostrarPista: true } }));
    expect(pp).toMatchObject({ intentos: 1 });
    expect(pp.pistas.cantidad).toBeNull();
  });

  it("anagrama: intentos por palabra (0 = ilimitado); `tiempoLimite` sin lector no deriva", async () => {
    await import("../../index.js");
    expect(normalizarAjustes(con("anagrama", { configuracion: { intentos: 3 } })).intentos).toBe(3);
    expect(normalizarAjustes(con("anagrama", { configuracion: { intentos: 0 } })).intentos).toBeNull();
    expect(normalizarAjustes(con("anagrama", { configuracion: { tiempoLimite: 30 } })).tiempoLimiteSeg).toBeNull();
    expect(normalizarAjustes(con("anagrama", { configuracion: { mostrarPista: false } })).pistas.cantidad).toBe(0);
  });

  it("ahorcado: maxIntentos → vidas; pista → 1", async () => {
    await import("../../index.js");
    const a = normalizarAjustes(con("ahorcado", { configuracion: { maxIntentos: 6, pista: "Un animal" } }));
    expect(a.vidas).toBe(6);
    expect(a.pistas.cantidad).toBe(1);
  });

  it("globos y topo: vidas y tiempo", async () => {
    await import("../../index.js");
    for (const t of ["globos", "topo"]) {
      const a = normalizarAjustes(con(t, { configuracion: { vidas: 3, tiempoLimite: 90 } }));
      expect(a, t).toMatchObject({ vidas: 3, tiempoLimiteSeg: 90 });
    }
  });
});

describe("normalizarAjustes — sonido y estilo (U8)", () => {
  it("por defecto: con sonido y estilo `escolar` (el aspecto de siempre), para los 29 tipos", async () => {
    await import("../../index.js");
    for (const tipo of [...TIPOS_KIT, ...Object.keys(FUERA_DEL_KIT)]) {
      expect(normalizarAjustes(payload(tipo)), tipo).toMatchObject({ sonido: true, estilo: "escolar" });
    }
  });
  it("`ajustes.sonido` y `ajustes.estilo` se respetan", async () => {
    await import("../../index.js");
    for (const estilo of ["escolar", "examen", "arcade", "minimal", "pizarra"] as const) {
      expect(normalizarAjustes({ ...payload("memoria"), ajustes: { estilo, sonido: false } } as Activity)).toMatchObject({ estilo, sonido: false });
    }
  });
  it("un estilo o un sonido inválido se ignora y cae al defecto", async () => {
    await import("../../index.js");
    const a = normalizarAjustes({ ...payload("memoria"), ajustes: { estilo: "neon", sonido: "no" } } as unknown as Activity);
    expect(a).toMatchObject({ estilo: "escolar", sonido: true });
    expect(normalizarAjustes({ ...payload("memoria"), ajustes: { estilo: 3 } } as unknown as Activity).estilo).toBe("escolar");
  });
});

describe("normalizarAjustes — `ajustes` del slide", () => {
  it("gana sobre el campo legacy, campo por campo", async () => {
    await import("../../index.js");
    const a = normalizarAjustes({
      ...con("globos", { configuracion: { vidas: 3, tiempoLimite: 90 } }),
      ajustes: { vidas: 5, modo: "practica", mostrarNota: false, barajar: false, semilla: 42.9, pistas: { cantidad: 2, costoPct: 10 }, retroalimentacion: "al_final", mostrarSolucion: true },
    } as Activity);
    expect(a).toMatchObject({
      vidas: 5, tiempoLimiteSeg: 90, modo: "practica", mostrarNota: false, barajar: false,
      semilla: 42, pistas: { cantidad: 2, costoPct: 10 }, retroalimentacion: "al_final", mostrarSolucion: true,
    });
  });

  it("`null` y 0 son «sin límite»; null explícito gana al legacy", async () => {
    await import("../../index.js");
    const a = normalizarAjustes({
      ...con("globos", { configuracion: { vidas: 3, tiempoLimite: 90 } }),
      ajustes: { vidas: null, tiempoLimiteSeg: 0 },
    } as Activity);
    expect(a.vidas).toBeNull();
    expect(a.tiempoLimiteSeg).toBeNull();
  });

  it("descarta valores de tipo o rango inválido y cae al legacy/defecto (sin lanzar)", async () => {
    await import("../../index.js");
    const basura = {
      modo: "caos", intentos: "tres", tiempoLimiteSeg: NaN, vidas: {}, barajar: "sí",
      semilla: Infinity, pistas: { cantidad: "x", costoPct: 900 }, mostrarNota: 1,
      mostrarSolucion: null, retroalimentacion: "nunca",
    };
    const a = normalizarAjustes({ ...con("topo", { configuracion: { vidas: 3 } }), ajustes: basura } as unknown as Activity);
    expect(a).toMatchObject({
      modo: "evaluacion", intentos: null, vidas: 3, barajar: true, semilla: null,
      mostrarNota: true, mostrarSolucion: false, retroalimentacion: "inmediata",
    });
    expect(a.pistas.costoPct).toBe(100);
    for (const raro of [null, 7, "x", [], true]) {
      expect(() => normalizarAjustes({ ...payload("memoria"), ajustes: raro } as unknown as Activity)).not.toThrow();
    }
  });

  it("acota los límites a un máximo razonable", async () => {
    await import("../../index.js");
    const a = normalizarAjustes({ ...payload("memoria"), ajustes: { intentos: 5000, vidas: 999, tiempoLimiteSeg: 10 ** 9 } } as Activity);
    expect(a).toMatchObject({ intentos: 99, vidas: 20, tiempoLimiteSeg: 86_400 });
  });

  it("es pura: no muta la actividad ni comparte referencias", async () => {
    await import("../../index.js");
    const act = Object.freeze({ ...con("topo", { configuracion: { vidas: 3 } }), ajustes: Object.freeze({ vidas: 4, pistas: Object.freeze({ cantidad: 1 }) }) }) as unknown as Activity;
    const antes = JSON.stringify(act);
    const a1 = normalizarAjustes(act);
    const a2 = normalizarAjustes(act);
    expect(JSON.stringify(act)).toBe(antes);
    expect(a1).toEqual(a2);
    expect(a1).not.toBe(a2);
  });
});

describe("`ajustes` frente a los normalizadores de hidratación (hallazgo U2)", () => {
  /**
   * `class-slide-normalize.ts` pasa cada actividad por su normalizador al LEER el slide. Si el
   * normalizador reconstruye el objeto campo por campo, descarta `ajustes`. Estos cuatro lo
   * hacen hoy: hay que corregirlos en su ficha U9 ANTES de que un panel escriba `ajustes`.
   * Si un normalizador deja de descartarlo, este test falla y hay que sacarlo de la lista.
   */
  const DESCARTAN: readonly string[] = [];
  const NORMALIZADORES: Record<string, (a: never) => unknown> = {
    quiz_multiple: normalizarQuizMultiple as never,
    emparejar: normalizarEmparejar as never,
    abrir_caja: normalizarAbrirCaja as never,
    globos: normalizarGlobos as never,
    topo: normalizarTopo as never,
    ahorcado: normalizarAhorcado as never,
  };
  it("ningún normalizador descarta `ajustes` (ahorcado, globos, topo y abrir_caja ya lo conservan: U9c.1 / U9d.1–U9d.3)", async () => {
    await import("../../index.js");
    const descartan = Object.entries(NORMALIZADORES)
      .filter(([tipo, f]) => {
        const out = f({ ...payload(tipo), ajustes: { modo: "practica" } } as never) as { ajustes?: unknown };
        return out.ajustes === undefined;
      })
      .map(([tipo]) => tipo)
      .sort();
    expect(descartan).toEqual([...DESCARTAN].sort());
  });
});
