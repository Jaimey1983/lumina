import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextoEnSitio } from "./texto-en-sitio.js";
import type { AreaDeTexto } from "./herramientas.js";

afterEach(() => cleanup());

const area = (extra: Partial<AreaDeTexto> = {}): AreaDeTexto => ({
  caja: { x: 100, y: 50, ancho: 200, alto: 60 },
  rotacion: 0,
  centro: { x: 200, y: 80 },
  texto: "Hola",
  tamano: 20,
  negrita: false,
  cursiva: false,
  alineacionH: "centro",
  alineacionV: "medio",
  color: "var(--foreground)",
  ...extra,
});

function montar(extra: Partial<AreaDeTexto> = {}, vista = { zoom: 2, x: 10, y: 20 }) {
  const props = { onCambio: vi.fn(), onConfirmar: vi.fn(), onCancelar: vi.fn() };
  render(<TextoEnSitio area={area(extra)} valor="Hola" vista={vista} {...props} />);
  const caja = screen.getByRole("textbox", { name: "Texto del elemento" }) as HTMLTextAreaElement;
  return { caja, contenedor: caja.parentElement as HTMLElement, ...props };
}

describe("TextoEnSitio", () => {
  it("se coloca sobre la zona de texto, con el zoom y el desplazamiento de la vista", () => {
    const { contenedor } = montar();
    // (100, 50) en escena → 100·2 + 10 = 210, 50·2 + 20 = 120; tamaño ×2.
    expect(contenedor.style.left).toBe("210px");
    expect(contenedor.style.top).toBe("120px");
    expect(contenedor.style.width).toBe("400px");
    expect(contenedor.style.height).toBe("120px");
  });

  it("la letra, la negrita, la cursiva, la alineación y el color son los del elemento (ya con zoom)", () => {
    const { caja } = montar({ tamano: 20, negrita: true, cursiva: true, alineacionH: "derecha", color: "#112233" });
    expect(caja.style.fontSize).toBe("40px");
    expect(caja.style.fontWeight).toBe("700");
    expect(caja.style.fontStyle).toBe("italic");
    expect(caja.style.textAlign).toBe("right");
    expect(caja.style.color).toBe("rgb(17, 34, 51)");
  });

  it("alinea en vertical según el elemento y gira alrededor del centro del elemento", () => {
    expect(montar({ alineacionV: "arriba" }).contenedor.style.alignItems).toBe("flex-start");
    cleanup();
    expect(montar({ alineacionV: "abajo" }).contenedor.style.alignItems).toBe("flex-end");
    cleanup();
    const { contenedor } = montar({ rotacion: 45 });
    expect(contenedor.style.transform).toBe("rotate(45deg)");
    // Centro (200, 80) → (410, 180); respecto de la esquina del cuadro (210, 120): (200, 60).
    expect(contenedor.style.transformOrigin).toBe("200px 60px");
  });

  it("toma el foco y elige todo el texto al abrirse", () => {
    const { caja } = montar();
    expect(document.activeElement).toBe(caja);
    expect(caja.selectionStart).toBe(0);
    expect(caja.selectionEnd).toBe(4);
  });

  it("Enter confirma, Mayús+Enter no, Escape cancela, y escribir avisa del valor", () => {
    const { caja, onConfirmar, onCancelar, onCambio } = montar();
    fireEvent.keyDown(caja, { key: "Enter", shiftKey: true });
    expect(onConfirmar).not.toHaveBeenCalled();
    fireEvent.keyDown(caja, { key: "Enter" });
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(caja, { key: "Escape" });
    expect(onCancelar).toHaveBeenCalledTimes(1);
    fireEvent.change(caja, { target: { value: "Nuevo" } });
    expect(onCambio).toHaveBeenCalledWith("Nuevo");
  });

  it("con lista, Enter no confirma (es ítem nuevo): se confirma con Ctrl/Cmd+Enter, y Escape sigue cancelando", () => {
    for (const vinetas of ["puntos", "numeros"] as const) {
      cleanup();
      const { caja, onConfirmar, onCancelar } = montar({ vinetas });
      const enter = fireEvent.keyDown(caja, { key: "Enter" });
      expect(enter).toBe(true); // sin preventDefault: el cuadro mete el salto de línea
      expect(onConfirmar).not.toHaveBeenCalled();
      fireEvent.keyDown(caja, { key: "Enter", ctrlKey: true });
      expect(onConfirmar).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(caja, { key: "Enter", metaKey: true });
      expect(onConfirmar).toHaveBeenCalledTimes(2);
      fireEvent.keyDown(caja, { key: "Escape" });
      expect(onCancelar).toHaveBeenCalledTimes(1);
    }
  });

  it("sin lista, Enter sí confirma (y se evita el salto de línea)", () => {
    const { caja } = montar();
    expect(fireEvent.keyDown(caja, { key: "Enter" })).toBe(false);
  });

  it("la ayuda del cuadro dice cómo terminar, según haya lista o no", () => {
    expect(montar().caja.title).toMatch(/Enter: terminar/);
    cleanup();
    expect(montar({ vinetas: "puntos" }).caja.title).toMatch(/Ctrl\+Enter/);
  });

  it("perder el foco confirma", () => {
    const { caja, onConfirmar } = montar();
    fireEvent.blur(caja);
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("ninguna tecla sube más allá del cuadro (ni al editor ni a la página)", () => {
    const alPadre = vi.fn();
    render(
      <div onKeyDown={alPadre}>
        <TextoEnSitio area={area()} valor="Hola" vista={{ zoom: 1, x: 0, y: 0 }} onCambio={vi.fn()} onConfirmar={vi.fn()} onCancelar={vi.fn()} />
      </div>,
    );
    const caja = screen.getByRole("textbox", { name: "Texto del elemento" });
    for (const key of ["a", "Delete", "Enter", "Escape", "ArrowLeft"]) fireEvent.keyDown(caja, { key });
    expect(alPadre).not.toHaveBeenCalled();
  });
});
