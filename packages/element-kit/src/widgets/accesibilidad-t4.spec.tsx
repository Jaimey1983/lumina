/**
 * T4 — accesibilidad de widgets: foco del Popup, regiones vivas y movimiento reducido.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlideCanvasRootContext } from "@lumina/editor-shared/slide-canvas-root-context";
import { createDefaultContadorBlock } from "./contador/contador-defaults.js";
import { ContadorViewer } from "./contador/contador-viewer.js";
import { createDefaultPopupBlock } from "./popup/popup-defaults.js";
import { PopupViewer } from "./popup/popup-viewer.js";
import { createDefaultProgresoBlock } from "./progreso/progreso-defaults.js";
import { ProgresoViewer } from "./progreso/progreso-viewer.js";
import { createDefaultRuletaWidget } from "./ruleta/ruleta-defaults.js";
import { RuletaViewer } from "./ruleta/ruleta-viewer.js";

const aqui = dirname(fileURLToPath(import.meta.url));

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Popup — foco del modal", () => {
  function montar() {
    const raiz = document.createElement("div");
    document.body.appendChild(raiz);
    const block = createDefaultPopupBlock();
    const utils = render(
      <SlideCanvasRootContext.Provider value={raiz}>
        <PopupViewer block={block} />
      </SlideCanvasRootContext.Provider>,
    );
    const disparador = utils.container.querySelector("button") as HTMLButtonElement;
    return { ...utils, raiz, disparador };
  }

  it("al abrir, el foco entra al diálogo", () => {
    const { disparador } = montar();
    disparador.focus();
    fireEvent.click(disparador);
    const dialogo = screen.getByRole("dialog");
    expect(dialogo.contains(document.activeElement)).toBe(true);
  });

  it("Tab no se escapa: desde el último elemento vuelve al primero, y Shift+Tab al revés", () => {
    const { disparador } = montar();
    disparador.focus();
    fireEvent.click(disparador);
    const dialogo = screen.getByRole("dialog");
    const botones = Array.from(dialogo.querySelectorAll<HTMLElement>("button"));
    expect(botones.length).toBeGreaterThan(0);
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];

    ultimo.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(primero);

    primero.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(ultimo);
  });

  it("Escape cierra y devuelve el foco al disparador", () => {
    const { disparador } = montar();
    disparador.focus();
    fireEvent.click(disparador);
    expect(screen.queryByRole("dialog")).not.toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(disparador);
  });
});

describe("regiones vivas", () => {
  it("Ruleta: el ganador se anuncia en una región role=status que ya existía vacía", async () => {
    const terminar = Promise.resolve();
    const animate = vi.fn(() => ({ finished: terminar, cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });

    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    const estado = screen.getByRole("status");
    expect(estado.textContent).toBe("");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Girar" }));
      await terminar;
    });
    expect(screen.getByRole("status").textContent).toMatch(/^Ganador: .+/);
  });

  it("Ruleta: con «reducir movimiento» el giro dura 1 ms", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });

    render(<RuletaViewer block={createDefaultRuletaWidget()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Girar" }));
    });
    const opciones = (animate.mock.calls[0] as unknown as [unknown, { duration: number }])[1];
    expect(opciones.duration).toBe(1);
  });

  it("Progreso: la barra tiene nombre accesible y el valor se anuncia", () => {
    render(<ProgresoViewer block={{ ...createDefaultProgresoBlock(), modo: "manual", porcentaje: 40 }} />);
    const barra = screen.getByRole("progressbar");
    expect(barra.getAttribute("aria-label")).toBeTruthy();
    expect(barra.getAttribute("aria-valuenow")).toBe("40");
    expect(screen.getByRole("status").textContent).toMatch(/40%/);
  });

  it("Contador: anuncia los cambios del modo número, no el tictac", () => {
    const base = createDefaultContadorBlock();
    render(<ContadorViewer block={{ ...base, modo: "numero", valorInicial: 3, mostrarControles: true }} />);
    expect(screen.getByRole("status").textContent).toMatch(/3$/);
    fireEvent.click(screen.getByLabelText("Sumar"));
    expect(screen.getByRole("status").textContent).toMatch(/4$/);
  });

  it("Contador: al terminar el temporizador anuncia «Tiempo terminado»", () => {
    vi.useFakeTimers();
    const base = createDefaultContadorBlock();
    render(<ContadorViewer block={{ ...base, modo: "temporizador", segundos: 1, autoIniciar: true, mostrarControles: true }} />);
    expect(screen.getByRole("status").textContent).toBe("");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("status").textContent).toBe("Tiempo terminado");
  });
});

describe("movimiento reducido en el CSS", () => {
  for (const archivo of [
    "popup/popup.module.css",
    "contador/contador.module.css",
    "progreso/progreso.module.css",
    "hotspot/hotspot.module.css",
  ]) {
    it(`${archivo} respeta prefers-reduced-motion`, () => {
      const css = readFileSync(join(aqui, archivo), "utf8");
      expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    });
  }
});
