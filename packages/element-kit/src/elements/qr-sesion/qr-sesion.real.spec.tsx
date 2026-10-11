/** T20 — con la librería real (`qrcode.react`, carga diferida) se dibuja un SVG con módulos. */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createDefaultQrSesionBlock } from "../../widgets/qr-sesion/index.js";
import { qrSesionDefinition } from "./qr-sesion-definition.js";
import type { QrSesionEstado } from "./qr-sesion-types.js";

afterEach(() => cleanup());

function con(cfg: Record<string, unknown>): QrSesionEstado {
  const base = createDefaultQrSesionBlock();
  return { ...base, configuracion: { ...base.configuracion, ...cfg } } as QrSesionEstado;
}

describe("QR real", () => {
  it("carga la librería de forma diferida y dibuja el SVG; otro código da otro dibujo", async () => {
    const Viewer = qrSesionDefinition.Viewer;
    const a = render(<Viewer estado={con({ codigo: "AAAA" })} config={{}} />);
    // Mientras carga hay un hueco, no el SVG.
    expect(a.container.querySelector('[role="img"] svg path')).toBeNull();
    await waitFor(() => expect(a.container.querySelector('[role="img"] svg path')).not.toBeNull());
    const dibujoA = a.container.querySelector('[role="img"] svg path:last-of-type')?.getAttribute("d");
    expect(dibujoA?.length ?? 0).toBeGreaterThan(50);
    a.unmount();
    const b = render(<Viewer estado={con({ codigo: "ZZZZ-9999" })} config={{}} />);
    await waitFor(() => expect(b.container.querySelector('[role="img"] svg path')).not.toBeNull());
    expect(b.container.querySelector('[role="img"] svg path:last-of-type')?.getAttribute("d")).not.toBe(dibujoA);
    expect(screen.getByRole("img")).toBeTruthy();
  });
});
