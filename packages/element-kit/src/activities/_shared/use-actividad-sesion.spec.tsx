/**
 * U3 — reducer de sesión y hook (etapa U / DU1). El reducer se prueba sin DOM ni reloj;
 * el hook, con relojes falsos.
 */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity } from "@lumina/types/slide";

import { normalizarAjustes, type AjustesResueltos } from "./activity-settings.js";
import {
  actividadSesionReducer as r,
  crearSesionInicial,
  formatearTiempo,
  pistasRestantes,
  puedeReintentar,
  useActividadSesion,
  type AccionSesion,
  type SesionActividad,
} from "./use-actividad-sesion.js";

/** Ajustes completos de partida; cada prueba cambia lo que necesita. */
function ajustes(parche: Partial<AjustesResueltos> = {}): AjustesResueltos {
  return {
    ...normalizarAjustes({ tipo: "ruleta", configuracion: { colores: [], sonido: false, duracionGiro: 1, mostrarGanador: true }, items: [] } as Activity),
    modo: "evaluacion",
    intentos: 1,
    tiempoLimiteSeg: null,
    tiempoPorPregunta: false,
    vidas: null,
    pistas: { cantidad: 0, costoPct: 0 },
    ...parche,
  };
}

const sesion = (a: Partial<AjustesResueltos> = {}, o = {}) => crearSesionInicial(ajustes(a), o);
const aplicar = (s: SesionActividad, ...acciones: AccionSesion[]) => acciones.reduce(r, s);

describe("crearSesionInicial", () => {
  it("sin intro empieza jugando, con intento 1 y los límites de los ajustes", () => {
    const s = sesion({ vidas: 3, tiempoLimiteSeg: 60, intentos: 2, pistas: { cantidad: 2, costoPct: 5 } }, { total: 4 });
    expect(s).toMatchObject({
      fase: "jugando", intento: 1, vidas: 3, tiempoRestante: 60,
      progreso: { actual: 0, total: 4 }, puntaje: 0, pistasUsadas: 0, motivoFin: null,
      config: { intentosMax: 2, vidasMax: 3, tiempoMaxSeg: 60, pistasMax: 2, costoPistaPct: 5 },
    });
  });
  it("con intro empieza en intro; el total se acota a un entero ≥ 0", () => {
    expect(sesion({}, { conIntro: true }).fase).toBe("intro");
    expect(sesion({}, { total: -5 }).progreso.total).toBe(0);
    expect(sesion({}, { total: 3.9 }).progreso.total).toBe(3);
  });
});

describe("transiciones de fase", () => {
  it("intro → jugando solo con `iniciar`, y `iniciar` fuera de intro se ignora", () => {
    const s = sesion({}, { conIntro: true });
    expect(aplicar(s, { tipo: "completar" })).toBe(s); // en intro no se puede completar
    expect(aplicar(s, { tipo: "iniciar" }).fase).toBe("jugando");
    const j = sesion();
    expect(r(j, { tipo: "iniciar" })).toBe(j);
  });

  it("jugando → resultado al completar (sin revisión)", () => {
    expect(aplicar(sesion(), { tipo: "completar" })).toMatchObject({ fase: "resultado", motivoFin: "completada" });
  });

  it("jugando → revision → resultado con revisión", () => {
    const rev = aplicar(sesion({}, { conRevision: true }), { tipo: "completar" });
    expect(rev).toMatchObject({ fase: "revision", motivoFin: "completada" });
    expect(aplicar(rev, { tipo: "verResultado" }).fase).toBe("resultado");
  });

  it("`verResultado` fuera de revisión se ignora", () => {
    const j = sesion();
    expect(r(j, { tipo: "verResultado" })).toBe(j);
    const res = aplicar(j, { tipo: "completar" });
    expect(r(res, { tipo: "verResultado" })).toBe(res);
  });

  it("después de terminar, las acciones de juego se ignoran", () => {
    const fin = aplicar(sesion({ vidas: 3, tiempoLimiteSeg: 30 }), { tipo: "completar" });
    for (const a of [
      { tipo: "tick" }, { tipo: "perderVida" }, { tipo: "sumarPuntaje", puntos: 5 },
      { tipo: "progreso", actual: 1, total: 2 }, { tipo: "usarPista" }, { tipo: "completar" },
    ] as AccionSesion[]) {
      expect(r(fin, a), a.tipo).toBe(fin);
    }
  });
});

describe("vidas", () => {
  it("pierde de a una y al llegar a 0 termina por `sin_vidas`", () => {
    const s0 = sesion({ vidas: 2 });
    const s1 = aplicar(s0, { tipo: "perderVida" });
    expect(s1).toMatchObject({ vidas: 1, fase: "jugando" });
    expect(aplicar(s1, { tipo: "perderVida" })).toMatchObject({ vidas: 0, fase: "resultado", motivoFin: "sin_vidas" });
  });
  it("sin vidas configuradas, `perderVida` no hace nada", () => {
    const s = sesion({ vidas: null });
    expect(r(s, { tipo: "perderVida" })).toBe(s);
  });
  it("con revisión, quedarse sin vidas pasa por revisión", () => {
    expect(aplicar(sesion({ vidas: 1 }, { conRevision: true }), { tipo: "perderVida" })).toMatchObject({ fase: "revision", motivoFin: "sin_vidas" });
  });
});

describe("tiempo", () => {
  it("`tick` descuenta y al llegar a 0 termina por `sin_tiempo`", () => {
    const s1 = aplicar(sesion({ tiempoLimiteSeg: 3 }), { tipo: "tick" });
    expect(s1).toMatchObject({ tiempoRestante: 2, fase: "jugando" });
    expect(aplicar(s1, { tipo: "tick", segundos: 5 })).toMatchObject({ tiempoRestante: 0, fase: "resultado", motivoFin: "sin_tiempo" });
  });
  it("sin límite, `tick` no hace nada; pasos inválidos se ignoran", () => {
    const sin = sesion({ tiempoLimiteSeg: null });
    expect(r(sin, { tipo: "tick" })).toBe(sin);
    const con = sesion({ tiempoLimiteSeg: 10 });
    for (const segundos of [0, -1, NaN]) expect(r(con, { tipo: "tick", segundos })).toBe(con);
  });
  it("`formatearTiempo` da m:ss y no baja de 0", () => {
    expect(formatearTiempo(75)).toBe("1:15");
    expect(formatearTiempo(9)).toBe("0:09");
    expect(formatearTiempo(-4)).toBe("0:00");
  });
});

describe("progreso, puntaje y pistas", () => {
  it("el progreso se acota a [0, total] y devuelve el mismo estado si no cambia", () => {
    const s = sesion({}, { total: 5 });
    expect(aplicar(s, { tipo: "progreso", actual: 9 }).progreso).toEqual({ actual: 5, total: 5 });
    expect(aplicar(s, { tipo: "progreso", actual: -2 }).progreso.actual).toBe(0);
    expect(aplicar(s, { tipo: "progreso", actual: 2, total: 8 }).progreso).toEqual({ actual: 2, total: 8 });
    expect(r(s, { tipo: "progreso", actual: 0 })).toBe(s);
    expect(r(s, { tipo: "progreso", actual: NaN })).toBe(s);
  });
  it("el puntaje suma, no baja de 0 y ignora no-números", () => {
    const s = aplicar(sesion(), { tipo: "sumarPuntaje", puntos: 10 }, { tipo: "sumarPuntaje", puntos: -3 });
    expect(s.puntaje).toBe(7);
    expect(aplicar(s, { tipo: "sumarPuntaje", puntos: -100 }).puntaje).toBe(0);
    expect(r(s, { tipo: "sumarPuntaje", puntos: NaN })).toBe(s);
  });
  it("las pistas se agotan; `null` = ilimitadas", () => {
    const dos = aplicar(sesion({ pistas: { cantidad: 2, costoPct: 0 } }), { tipo: "usarPista" }, { tipo: "usarPista" });
    expect(dos.pistasUsadas).toBe(2);
    expect(pistasRestantes(dos)).toBe(0);
    expect(r(dos, { tipo: "usarPista" })).toBe(dos);
    const sinTope = aplicar(sesion({ pistas: { cantidad: null, costoPct: 0 } }), { tipo: "usarPista" }, { tipo: "usarPista" }, { tipo: "usarPista" });
    expect(sinTope.pistasUsadas).toBe(3);
    expect(pistasRestantes(sinTope)).toBeNull();
    const ninguna = sesion({ pistas: { cantidad: 0, costoPct: 0 } });
    expect(r(ninguna, { tipo: "usarPista" })).toBe(ninguna);
  });
});

describe("reintento e intentos", () => {
  const cerrada = (a: Partial<AjustesResueltos>) => aplicar(sesion(a, { total: 4 }), { tipo: "progreso", actual: 3 }, { tipo: "sumarPuntaje", puntos: 20 }, { tipo: "completar" });

  it("con intentos disponibles vuelve a jugar y reinicia vidas, tiempo, progreso, puntaje y pistas", () => {
    let s = sesion({ intentos: 3, vidas: 3, tiempoLimiteSeg: 60, pistas: { cantidad: 2, costoPct: 0 } }, { total: 4 });
    s = aplicar(s, { tipo: "perderVida" }, { tipo: "tick" }, { tipo: "usarPista" }, { tipo: "progreso", actual: 2 }, { tipo: "sumarPuntaje", puntos: 9 }, { tipo: "completar" });
    expect(puedeReintentar(s)).toBe(true);
    const nuevo = r(s, { tipo: "reintentar" });
    expect(nuevo).toMatchObject({
      fase: "jugando", intento: 2, vidas: 3, tiempoRestante: 60,
      progreso: { actual: 0, total: 4 }, puntaje: 0, pistasUsadas: 0, motivoFin: null,
    });
  });

  it("sin intentos que queden, `reintentar` se ignora", () => {
    const s = cerrada({ intentos: 1 });
    expect(puedeReintentar(s)).toBe(false);
    expect(r(s, { tipo: "reintentar" })).toBe(s);
  });

  it("se agotan los intentos: con 2 se puede reintentar una sola vez", () => {
    const uno = cerrada({ intentos: 2 });
    const dos = aplicar(r(uno, { tipo: "reintentar" }), { tipo: "completar" });
    expect(dos.intento).toBe(2);
    expect(puedeReintentar(dos)).toBe(false);
  });

  it("intentos `null` = ilimitados", () => {
    let s = cerrada({ intentos: null });
    for (let i = 0; i < 5; i++) {
      expect(puedeReintentar(s)).toBe(true);
      s = aplicar(r(s, { tipo: "reintentar" }), { tipo: "completar" });
    }
    expect(s.intento).toBe(6);
  });

  it("no se reintenta mientras se juega ni en la intro", () => {
    const j = sesion({ intentos: 5 });
    expect(r(j, { tipo: "reintentar" })).toBe(j);
    const i = sesion({ intentos: 5 }, { conIntro: true });
    expect(r(i, { tipo: "reintentar" })).toBe(i);
  });

  it("se puede reintentar desde revisión", () => {
    const rev = aplicar(sesion({ intentos: 2 }, { conRevision: true }), { tipo: "completar" });
    expect(rev.fase).toBe("revision");
    expect(r(rev, { tipo: "reintentar" })).toMatchObject({ fase: "jugando", intento: 2 });
  });

  it("es pura: no muta el estado anterior", () => {
    const s = Object.freeze(sesion({ vidas: 2 }));
    expect(() => aplicar(s, { tipo: "perderVida" }, { tipo: "completar" })).not.toThrow();
    expect(s.vidas).toBe(2);
  });
});

describe("useActividadSesion", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("el cronómetro descuenta cada segundo y termina al agotarse; luego se detiene", () => {
    const { result } = renderHook(() => useActividadSesion(ajustes({ tiempoLimiteSeg: 3 })));
    expect(result.current.sesion.tiempoRestante).toBe(3);
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.sesion.tiempoRestante).toBe(2);
    act(() => void vi.advanceTimersByTime(2000));
    expect(result.current.sesion).toMatchObject({ tiempoRestante: 0, fase: "resultado", motivoFin: "sin_tiempo" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("no corre en la intro, arranca con `iniciar` y se cancela al desmontar", () => {
    const { result, unmount } = renderHook(() => useActividadSesion(ajustes({ tiempoLimiteSeg: 30 }), { conIntro: true }));
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.sesion.tiempoRestante).toBe(30);
    act(() => result.current.iniciar());
    act(() => void vi.advanceTimersByTime(2000));
    expect(result.current.sesion.tiempoRestante).toBe(28);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("al reintentar, el cronómetro vuelve a arrancar desde el límite", () => {
    const { result } = renderHook(() => useActividadSesion(ajustes({ tiempoLimiteSeg: 5, intentos: 2 })));
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.sesion.fase).toBe("resultado");
    act(() => result.current.reintentar());
    expect(result.current.sesion).toMatchObject({ fase: "jugando", intento: 2, tiempoRestante: 5 });
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.sesion.tiempoRestante).toBe(4);
  });

  it("sin límite de tiempo no hay intervalo", () => {
    renderHook(() => useActividadSesion(ajustes({ tiempoLimiteSeg: null })));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("las acciones son estables entre renders", () => {
    const { result, rerender } = renderHook(() => useActividadSesion(ajustes()));
    const antes = result.current.completar;
    rerender();
    expect(result.current.completar).toBe(antes);
  });
});
