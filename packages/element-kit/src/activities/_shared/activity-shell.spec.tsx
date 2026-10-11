/**
 * U3 — render de cada fase del `ActivityShell`, encabezado y `ActivityResultScreen`
 * (etapa U / DU1, DU6, DU8): fases, accesibilidad del diálogo, foco y reintento.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ActivityEvaluationResult } from "@lumina/scoring";
import type { Activity } from "@lumina/types/slide";

import { ActivityHeader } from "./activity-header.js";
import { ActivityResultScreen, anuncioDeResultado } from "./activity-result-screen.js";
import { normalizarAjustes, type AjustesResueltos } from "./activity-settings.js";
import { ActivityShell, type ActivityShellContext } from "./activity-shell.js";
import { crearSesionInicial } from "./use-actividad-sesion.js";

afterEach(cleanup);

const BASE = normalizarAjustes({
  tipo: "ruleta",
  configuracion: { colores: [], sonido: false, duracionGiro: 1, mostrarGanador: true },
  items: [],
} as Activity);

const ajustes = (p: Partial<AjustesResueltos> = {}): AjustesResueltos => ({
  ...BASE, modo: "evaluacion", mostrarNota: true, intentos: 1, vidas: null, tiempoLimiteSeg: null,
  tiempoPorPregunta: false, mostrarSolucion: false, pistas: { cantidad: 0, costoPct: 0 }, ...p,
});

const evaluacion = (aciertos: boolean[], score: number | null = null): ActivityEvaluationResult => ({
  correct: aciertos.every(Boolean),
  score,
  details: aciertos.map((correct, index) => ({ index, correct, label: `Pregunta ${index + 1}` })),
});

/** Mecánica de prueba: expone el contexto del shell mediante botones. */
function Mecanica({ ctx }: { ctx: ActivityShellContext }) {
  return (
    <div data-testid="mecanica">
      <span data-testid="fase">{ctx.sesion.fase}</span>
      <button onClick={ctx.completar}>terminar</button>
      <button onClick={ctx.perderVida}>fallar</button>
      <button onClick={() => ctx.setProgreso(2)}>avanzar</button>
      <button onClick={() => ctx.sumarPuntaje(10)}>acertar</button>
    </div>
  );
}

function montar(props: Partial<React.ComponentProps<typeof ActivityShell>> = {}) {
  return render(
    <ActivityShell ajustes={ajustes()} {...props}>
      {(ctx) => <Mecanica ctx={ctx} />}
    </ActivityShell>,
  );
}

describe("ActivityShell — fases", () => {
  it("intro: muestra título e instrucción, no monta la mecánica y «Comenzar» pasa a jugar", async () => {
    montar({ conIntro: true, titulo: "Memoria", instruccion: "Encuentra los pares." });
    expect(screen.getByTestId("actividad-intro")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Memoria" })).toBeTruthy();
    expect(screen.getByText("Encuentra los pares.")).toBeTruthy();
    expect(screen.queryByTestId("mecanica")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Comenzar" }));
    expect(screen.queryByTestId("actividad-intro")).toBeNull();
    expect(screen.getByTestId("fase").textContent).toBe("jugando");
  });

  it("sin intro arranca jugando y no hay diálogo", () => {
    const { container } = montar();
    expect(container.firstElementChild?.getAttribute("data-fase")).toBe("jugando");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("jugando → resultado: abre un diálogo modal y el fondo queda `inert`", async () => {
    const { container } = montar({ evaluation: evaluacion([true, true, false, true]) });
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    const dlg = screen.getByRole("dialog");
    expect(dlg.getAttribute("aria-modal")).toBe("true");
    expect(dlg.getAttribute("aria-labelledby")).toBeTruthy();
    expect(container.firstElementChild?.getAttribute("data-fase")).toBe("resultado");
    expect(container.querySelector("[inert]")?.contains(screen.getByTestId("mecanica"))).toBe(true);
  });

  it("revisión: con `conRevision` pasa por «Ver resultado» antes del diálogo", async () => {
    montar({ conRevision: true, evaluation: evaluacion([true]) });
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("fase").textContent).toBe("revision");
    await userEvent.click(screen.getByRole("button", { name: "Ver resultado" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("al quedarse sin vidas termina y el título lo dice", async () => {
    montar({ ajustes: ajustes({ vidas: 2 }), evaluation: evaluacion([false, false]) });
    await userEvent.click(screen.getByRole("button", { name: "fallar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "fallar" }));
    expect(screen.getByRole("heading", { name: "Te quedaste sin vidas" })).toBeTruthy();
  });

  it("al agotarse el tiempo termina y el título lo dice", () => {
    vi.useFakeTimers();
    try {
      montar({ ajustes: ajustes({ tiempoLimiteSeg: 2 }) });
      act(() => void vi.advanceTimersByTime(2000));
      expect(screen.getByRole("heading", { name: "Se acabó el tiempo" })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("`onFin` se llama una vez por corrida, con el motivo", async () => {
    const onFin = vi.fn();
    montar({ ajustes: ajustes({ intentos: 2 }), onFin, evaluation: evaluacion([true]) });
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(onFin).toHaveBeenCalledTimes(1);
    expect(onFin).toHaveBeenCalledWith("completada");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(onFin).toHaveBeenCalledTimes(2);
  });
});

describe("ActivityShell — reintento y foco", () => {
  it("«Reintentar» reinicia la sesión, cierra el diálogo y avisa a la actividad", async () => {
    const onReintentar = vi.fn();
    montar({ ajustes: ajustes({ intentos: 3, vidas: 3 }), onReintentar, evaluation: evaluacion([true, false]) });
    await userEvent.click(screen.getByRole("button", { name: "fallar" }));
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(screen.getByText("Intento 1 de 3", { selector: "p" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("fase").textContent).toBe("jugando");
    expect(screen.getByRole("img", { name: "Vidas: 3 de 3" })).toBeTruthy(); // vidas repuestas
    expect(screen.getByText("Intento 2 de 3")).toBeTruthy();
  });

  it("sin intentos que queden no se ofrece «Reintentar»", async () => {
    montar({ ajustes: ajustes({ intentos: 1 }), evaluation: evaluacion([true]) });
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("el foco entra al diálogo al abrirse y vuelve al disparador al cerrarse", async () => {
    montar({ ajustes: ajustes({ intentos: 2 }), evaluation: evaluacion([true]) });
    const terminar = screen.getByRole("button", { name: "terminar" });
    terminar.focus();
    act(() => terminar.click());
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "terminar" }));
  });

  it("un lector de pantalla recibe el anuncio del resultado", async () => {
    montar({ evaluation: evaluacion([true, true, true, false], 4) });
    expect(screen.getByRole("status").textContent).toBe("");
    await userEvent.click(screen.getByRole("button", { name: "terminar" }));
    expect(screen.getByRole("status").textContent).toBe("¡Muy bien!. Nota 4.0. 3 de 4 correctas");
  });
});

describe("ActivityHeader", () => {
  const h = (a: Partial<AjustesResueltos>, o = {}) => crearSesionInicial(ajustes(a), o);

  it("sin límites ni progreso no pinta nada", () => {
    const { container } = render(<ActivityHeader sesion={h({})} />);
    expect(container.firstChild).toBeNull();
  });

  it("progreso: barra con valores accesibles", () => {
    render(<ActivityHeader sesion={{ ...h({}, { total: 5 }), progreso: { actual: 2, total: 5 } }} />);
    const barra = screen.getByRole("progressbar", { name: "Progreso" });
    expect(barra.getAttribute("aria-valuenow")).toBe("2");
    expect(barra.getAttribute("aria-valuemax")).toBe("5");
    expect(barra.getAttribute("aria-valuetext")).toBe("2 de 5");
    expect(screen.getByText("2/5")).toBeTruthy();
  });

  it("tiempo: cronómetro m:ss y estado urgente a 10 s o menos", () => {
    const { rerender } = render(<ActivityHeader sesion={h({ tiempoLimiteSeg: 75 })} />);
    expect(screen.getByRole("timer").textContent).toBe("1:15");
    expect(screen.getByRole("timer").getAttribute("aria-label")).toBe("Tiempo restante: 1:15");
    const antes = screen.getByRole("timer").className;
    rerender(<ActivityHeader sesion={{ ...h({ tiempoLimiteSeg: 75 }), tiempoRestante: 10 }} />);
    expect(screen.getByRole("timer").className).not.toBe(antes);
  });

  it("vidas: etiqueta accesible con las que quedan", () => {
    render(<ActivityHeader sesion={{ ...h({ vidas: 3 }), vidas: 1 }} />);
    expect(screen.getByRole("img", { name: "Vidas: 1 de 3" })).toBeTruthy();
  });

  it("puntaje solo cuando hay puntos o se pide; intento solo si hay más de uno", () => {
    const { rerender } = render(<ActivityHeader sesion={h({ intentos: 3 })} />);
    expect(screen.getByText("Intento 1 de 3")).toBeTruthy();
    expect(screen.queryByText(/Puntos/)).toBeNull();
    rerender(<ActivityHeader sesion={h({ intentos: 3 })} mostrarPuntaje />);
    expect(screen.getByText("Puntos: 0")).toBeTruthy();
    rerender(<ActivityHeader sesion={h({ intentos: 1 })} />);
    expect(screen.queryByText(/Intento/)).toBeNull();
  });
});

describe("ActivityResultScreen", () => {
  const base = { intento: 1, intentosMax: 1 as number | null };

  it("aprobado: nota y titular; reprobado: «Sigue practicando»", () => {
    const { rerender } = render(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([true, true, true, true, false], 4)} />);
    expect(screen.getByRole("heading", { name: "¡Muy bien!" })).toBeTruthy();
    expect(screen.getByText("4.0")).toBeTruthy();
    expect(screen.getByText("4 de 5 correctas (80%)")).toBeTruthy();
    rerender(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([false, false, false, true, false], 1.8)} />);
    expect(screen.getByRole("heading", { name: "Sigue practicando" })).toBeTruthy();
    expect(screen.getByText("1.8")).toBeTruthy();
  });

  it("sin `score` en la evaluación deriva la nota con la fórmula colombiana", () => {
    render(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([true, true, true, true, false])} />);
    expect(screen.getByText("4.0")).toBeTruthy();
  });

  it("`mostrarNota = false` oculta la nota pero conserva el resumen", () => {
    render(<ActivityResultScreen {...base} mostrarNota={false} evaluation={evaluacion([true, false], 3)} />);
    expect(screen.queryByText("3.0")).toBeNull();
    expect(screen.getByRole("heading", { name: "¡Completado!" })).toBeTruthy();
    expect(screen.getByText("1 de 2 correctas (50%)")).toBeTruthy();
  });

  it("sin evaluación (participación) solo muestra el titular", () => {
    render(<ActivityResultScreen {...base} mostrarNota evaluation={null} />);
    expect(screen.getByRole("heading", { name: "¡Completado!" })).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("desglose por ítem con texto (no solo color); la etiqueta solo con `mostrarSolucion`", () => {
    const { rerender } = render(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([true, false])} />);
    const lista = screen.getByRole("list", { name: "Resultado por ítem" });
    expect(within(lista).getByText("Ítem 1: correcto")).toBeTruthy();
    expect(within(lista).getByText("Ítem 2: incorrecto")).toBeTruthy();
    rerender(<ActivityResultScreen {...base} mostrarNota mostrarSolucion evaluation={evaluacion([true, false])} />);
    expect(screen.getByText("Pregunta 1: correcto")).toBeTruthy();
  });

  it("Escape cierra solo si hay `onCerrar`; Tab cicla dentro del diálogo", async () => {
    const onCerrar = vi.fn();
    const { rerender } = render(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([true])} onReintentar={() => undefined} onCerrar={onCerrar} />);
    const dlg = screen.getByRole("dialog");
    const reintentar = screen.getByRole("button", { name: "Reintentar" });
    const cerrar = screen.getByRole("button", { name: "Cerrar" });
    cerrar.focus();
    fireEvent.keyDown(cerrar, { key: "Tab" });
    expect(document.activeElement).toBe(reintentar);
    reintentar.focus();
    fireEvent.keyDown(reintentar, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cerrar);
    fireEvent.keyDown(dlg, { key: "Escape" });
    expect(onCerrar).toHaveBeenCalledTimes(1);
    rerender(<ActivityResultScreen {...base} mostrarNota evaluation={evaluacion([true])} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("`anuncioDeResultado` arma el texto del anuncio", () => {
    expect(anuncioDeResultado(evaluacion([true, true], 5), "completada", true)).toBe("¡Muy bien!. Nota 5.0. 2 de 2 correctas");
    expect(anuncioDeResultado(evaluacion([false]), "sin_tiempo", false)).toBe("Se acabó el tiempo. 0 de 1 correctas");
    expect(anuncioDeResultado(null, "completada", true)).toBe("¡Completado!");
  });
});
