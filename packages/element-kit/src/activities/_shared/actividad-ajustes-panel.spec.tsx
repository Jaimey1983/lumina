/**
 * U8 — `ActividadAjustesPanel`: qué secciones ofrece según el tipo, que escribe SOLO
 * `ajustes`, y su operación con teclado.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity, MemoriaActivity, TrueFalse } from "@lumina/types/slide";

import { createDefaultMemoria } from "../memoria/index.js";
import { CAPACIDADES_AJUSTES, capacidadesDe, seccionesVisibles } from "./activity-ajustes-capacidades.js";
import {
  ActividadAjustesPanel,
  TIEMPO_POR_DEFECTO_SEG,
  escribirAjustes,
  restablecerAjustes,
} from "./actividad-ajustes-panel.js";

afterEach(cleanup);

const memoria = (): MemoriaActivity => createDefaultMemoria();
const vf = (): TrueFalse => ({
  tipo: "verdadero_falso",
  afirmacion: "El agua hierve a 100 °C.",
  respuestaCorrecta: true,
  retroalimentacion: { explicacion: "A nivel del mar." },
});

/** Monta el panel y devuelve la última actividad que el panel pidió guardar. */
function montar<T extends Activity>(a: T) {
  const onChange = vi.fn();
  const view = render(<ActividadAjustesPanel actividad={a} onChange={onChange} />);
  const ultima = () => onChange.mock.calls.at(-1)![0] as T;
  return { onChange, ultima, ...view };
}

describe("capacidades por tipo", () => {
  it("solo las actividades migradas usan el panel común; el resto devuelve null", () => {
    // Crece una por una con U9 (cada migración agrega su tipo acá y a `CAPACIDADES_AJUSTES`).
    expect(Object.keys(CAPACIDADES_AJUSTES).sort()).toEqual(["balancear_ecuacion", "completar_blancos", "encuesta_viva", "formular_compuesto", "memoria", "nube_palabras", "respuesta_matematica", "short_answer", "verdadero_falso"]);
    expect(capacidadesDe("memoria")).not.toBeNull();
    expect(capacidadesDe("topo")).toBeNull();
  });

  it("`seccionesVisibles` oculta las secciones sin opciones", () => {
    expect(seccionesVisibles({ sonido: true })).toEqual({
      calificacion: false, tiempoEIntentos: false, vidas: false, pistas: false, orden: false, retroalimentacion: false, sonidoYAspecto: true,
    });
    expect(seccionesVisibles({ retroalimentacion: [] }).retroalimentacion).toBe(false);
    expect(seccionesVisibles({ mostrarSolucion: true }).retroalimentacion).toBe(true);
  });

  it("`ajustes.modo` no se ofrece: ningún viewer lo consume", () => {
    montar(memoria());
    expect(screen.queryByText(/modo/i)).toBeNull();
  });
});

describe("qué se muestra", () => {
  it("Memoria: calificación, tiempo e intentos, orden y sonido/aspecto; no vidas, pistas ni retroalimentación", () => {
    montar(memoria());
    for (const t of ["Calificación", "Tiempo e intentos", "Orden", "Sonido y aspecto"]) {
      expect(screen.getByText(t), t).toBeTruthy();
    }
    for (const t of ["Vidas", "Pistas", "Retroalimentación"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("Verdadero/Falso: tiempo (sin intentos), retroalimentación y sonido/aspecto; no nota, orden ni vidas", () => {
    montar(vf());
    expect(screen.getByText("Tiempo e intentos")).toBeTruthy();
    expect(screen.queryByLabelText("Intentos")).toBeNull();
    expect(screen.getByText("Retroalimentación")).toBeTruthy();
    for (const t of ["Calificación", "Orden", "Vidas", "Pistas"]) expect(screen.queryByText(t), t).toBeNull();
  });

  it("sin capacidades (tipo no migrado) no dibuja nada", () => {
    const { container } = montar({ tipo: "topo" } as unknown as Activity);
    expect(container.firstChild).toBeNull();
  });

  it("muestra lo que el viewer YA hacía: un slide viejo con legacy se refleja", () => {
    const viejo = { ...memoria(), configuracion: { ...memoria().configuracion } } as MemoriaActivity;
    montar(viejo);
    // Memoria sin ajustes: nota visible, intentos ilimitados, barajado, sin límite de tiempo, con sonido.
    expect((screen.getByLabelText("Mostrar la nota al terminar") as HTMLElement).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByLabelText("Intentos") as HTMLSelectElement).value).toBe("ilimitados");
    expect((screen.getByLabelText("Barajar") as HTMLElement).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByLabelText("Límite de tiempo") as HTMLElement).getAttribute("aria-checked")).toBe("false");
    expect((screen.getByLabelText("Sonidos") as HTMLElement).getAttribute("aria-checked")).toBe("true");
  });
});

describe("escribe SOLO `ajustes`", () => {
  it("`escribirAjustes` y `restablecerAjustes` no tocan ningún otro campo", () => {
    const a = memoria();
    const b = escribirAjustes(a, { sonido: false, intentos: 2 });
    expect(b.ajustes).toEqual({ sonido: false, intentos: 2 });
    expect({ ...b, ajustes: undefined }).toEqual({ ...a, ajustes: undefined });
    expect(a.ajustes).toBeUndefined(); // no muta
    expect(escribirAjustes(b, { sonido: true }).ajustes).toEqual({ sonido: true, intentos: 2 });
    const c = restablecerAjustes(b);
    expect("ajustes" in c).toBe(false);
    expect(c).toEqual(a);
  });

  it("cada control cambia `ajustes` y deja intactos `configuracion`, `pares`, `tipo`…", () => {
    const original = memoria();
    const { onChange } = montar(original);
    fireEvent.click(screen.getByLabelText("Sonidos"));
    fireEvent.click(screen.getByLabelText("Límite de tiempo"));
    fireEvent.change(screen.getByLabelText("Intentos"), { target: { value: "3" } });
    fireEvent.click(screen.getByLabelText("Mostrar la nota al terminar"));
    fireEvent.click(screen.getByLabelText("Barajar"));
    expect(onChange).toHaveBeenCalledTimes(5);
    for (const [salida] of onChange.mock.calls) {
      // Todo menos `ajustes` es idéntico al original.
      expect({ ...(salida as MemoriaActivity), ajustes: undefined }).toEqual({ ...original, ajustes: undefined });
      expect(Object.keys((salida as MemoriaActivity).ajustes ?? {}).length).toBe(1); // un control = un campo
    }
  });
});

describe("controles", () => {
  it("límite de tiempo: enciende con 60 s, acepta segundos acotados y apaga con null", () => {
    const { onChange, rerender } = montar(memoria());
    fireEvent.click(screen.getByLabelText("Límite de tiempo"));
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ tiempoLimiteSeg: TIEMPO_POR_DEFECTO_SEG });

    const conTiempo = { ...memoria(), ajustes: { tiempoLimiteSeg: 90 } };
    rerender(<ActividadAjustesPanel actividad={conTiempo} onChange={onChange} />);
    const segundos = screen.getByLabelText("Segundos") as HTMLInputElement;
    expect(segundos.value).toBe("90");
    fireEvent.change(segundos, { target: { value: "2" } });
    expect(onChange.mock.lastCall![0].ajustes.tiempoLimiteSeg).toBe(5);
    fireEvent.change(segundos, { target: { value: "99999" } });
    expect(onChange.mock.lastCall![0].ajustes.tiempoLimiteSeg).toBe(3600);
    fireEvent.click(screen.getByLabelText("Límite de tiempo"));
    expect(onChange.mock.lastCall![0].ajustes.tiempoLimiteSeg).toBeNull();
  });

  it("intentos: ilimitados ↔ 1, 2, 3, 5", () => {
    const { onChange } = montar(memoria());
    const sel = screen.getByLabelText("Intentos");
    fireEvent.change(sel, { target: { value: "1" } });
    expect(onChange.mock.lastCall![0].ajustes.intentos).toBe(1);
    fireEvent.change(sel, { target: { value: "ilimitados" } });
    expect(onChange.mock.lastCall![0].ajustes.intentos).toBeNull();
  });

  it("«mismo orden para todos» solo aparece con Barajar y fija una semilla entera (o la quita)", () => {
    const { onChange, rerender } = montar({ ...memoria(), ajustes: { barajar: false } });
    expect(screen.queryByLabelText("Mismo orden para todos")).toBeNull();
    rerender(<ActividadAjustesPanel actividad={memoria()} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Mismo orden para todos"));
    const semilla = onChange.mock.lastCall![0].ajustes.semilla;
    expect(Number.isInteger(semilla)).toBe(true);
    rerender(<ActividadAjustesPanel actividad={{ ...memoria(), ajustes: { semilla } }} onChange={onChange} />);
    expect((screen.getByLabelText("Mismo orden para todos") as HTMLElement).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByLabelText("Mismo orden para todos"));
    expect(onChange.mock.lastCall![0].ajustes.semilla).toBeNull();
  });

  it("retroalimentación (V/F): dos momentos con aria-pressed y explicación opcional", () => {
    const { onChange } = montar(vf());
    const grupo = screen.getByRole("group", { name: "Cuándo avisar si acertó" });
    const botones = within(grupo).getAllByRole("button");
    expect(botones.map((b) => b.textContent)).toEqual(["Al responder", "Sin mensaje"]);
    expect(botones[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(botones[1]);
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ retroalimentacion: "ninguna" });
    fireEvent.click(screen.getByLabelText("Mostrar la explicación"));
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ mostrarSolucion: true });
  });

  it("aspecto: cinco estilos, el actual marcado, y cambiarlo escribe solo `estilo`", () => {
    const { onChange } = montar(memoria());
    const grupo = screen.getByRole("group", { name: "Aspecto" });
    const botones = within(grupo).getAllByRole("button");
    expect(botones.map((b) => b.textContent)).toEqual(["Escolar", "Examen", "Arcade", "Minimal", "Pizarra"]);
    expect(botones[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(botones[2]);
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ estilo: "arcade" });
  });

  it("«Restablecer ajustes» solo aparece si hay ajustes propios y los quita", () => {
    const { onChange, rerender } = montar(memoria());
    expect(screen.queryByRole("button", { name: "Restablecer ajustes" })).toBeNull();
    rerender(<ActividadAjustesPanel actividad={{ ...memoria(), ajustes: { sonido: false } }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Restablecer ajustes" }));
    expect("ajustes" in onChange.mock.lastCall![0]).toBe(false);
  });

  it("la ayuda larga vive tras un icono ⓘ (etapa R), no en el panel", () => {
    montar(memoria());
    expect(screen.getByRole("button", { name: "Ayuda: Mismo orden para todos" })).toBeTruthy();
    expect(screen.queryByText(/toda la clase ve/)).toBeNull();
  });

  it("todo se opera con teclado: los controles son interruptores, botones y selectores nativos", () => {
    montar(memoria());
    for (const sw of screen.getAllByRole("switch")) expect(sw.tagName).toBe("BUTTON");
    expect(screen.getAllByRole("button", { pressed: true }).length).toBeGreaterThan(0);
  });
});

describe("capacidades inyectadas (vidas y pistas, para los tipos que lleguen)", () => {
  it("vidas y pistas se dibujan y escriben `ajustes.vidas` / `ajustes.pistas`", () => {
    const onChange = vi.fn();
    render(<ActividadAjustesPanel actividad={memoria()} onChange={onChange} capacidades={{ vidas: true, pistas: true }} />);
    fireEvent.click(screen.getByLabelText("Limitar las vidas"));
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ vidas: 3 });
    fireEvent.change(screen.getByLabelText("Pistas disponibles"), { target: { value: "2" } });
    expect(onChange.mock.lastCall![0].ajustes).toEqual({ pistas: { cantidad: 2 } });
    fireEvent.change(screen.getByLabelText("Pistas disponibles"), { target: { value: "ilimitadas" } });
    expect(onChange.mock.lastCall![0].ajustes.pistas.cantidad).toBeNull();
  });
});
