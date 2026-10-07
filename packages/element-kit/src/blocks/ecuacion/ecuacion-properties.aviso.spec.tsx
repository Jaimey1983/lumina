import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FieldHelp } from "@lumina/ui/field-help";

import { EcuacionProperties } from "./ecuacion-properties.js";
import { createDefaultEcuacionBlock } from "./ecuacion-defaults.js";

afterEach(cleanup);

function renderProps(pasos: boolean) {
  return render(
    <EcuacionProperties
      block={createDefaultEcuacionBlock({ latex: "x^2", pasos })}
      onChange={() => undefined}
    />,
  );
}

/** Abre el ⓘ de «Interactividad» y devuelve el texto de un aviso de la ayuda. */
function avisoEnAyuda(pasos: boolean, atributo: string): string {
  renderProps(pasos);
  fireEvent.click(screen.getByRole("button", { name: "Ayuda: Interactividad" }));
  return document.querySelector(`[${atributo}]`)?.textContent ?? "";
}

describe("EcuacionProperties — aviso de eventos", () => {
  it("sin «línea por línea» deja visible una línea corta de advertencia", () => {
    const r = renderProps(false);
    const corto = r.container.querySelector("[data-ecuacion-aviso-corto]");
    expect(corto?.textContent).toContain("no se activan");
  });

  it("con «línea por línea» no muestra la advertencia corta", () => {
    const r = renderProps(true);
    expect(r.container.querySelector("[data-ecuacion-aviso-corto]")).toBeNull();
  });

  it("la explicación larga no está en el panel hasta abrir el ⓘ", () => {
    const r = renderProps(false);
    expect(r.container.querySelector("[data-ecuacion-aviso-eventos]")).toBeNull();
    expect(r.container.querySelector("[data-ecuacion-aviso-partes]")).toBeNull();
  });

  it("sin «línea por línea» la ayuda avisa que una regla de clic no se activará", () => {
    expect(avisoEnAyuda(false, "data-ecuacion-aviso-eventos")).toContain("no se activará");
  });

  it("con «línea por línea» la ayuda explica qué eventos emite", () => {
    const t = avisoEnAyuda(true, "data-ecuacion-aviso-eventos");
    expect(t).toContain("clic");
    expect(t).toContain("visitada");
  });

  it("la ayuda explica cómo marcar partes clicables", () => {
    expect(avisoEnAyuda(false, "data-ecuacion-aviso-partes")).toContain("clicable");
  });
});

describe("FieldHelp (R1)", () => {
  it("anuncia el campo en el aria-label y no monta el contenido cerrado", () => {
    render(<FieldHelp label="Campo X">Texto de ayuda</FieldHelp>);
    expect(screen.getByRole("button", { name: "Ayuda: Campo X" })).toBeTruthy();
    expect(screen.queryByText("Texto de ayuda")).toBeNull();
  });

  // `fireEvent` y no `userEvent`: con componentes Radix en jsdom, `user.click`
  // tarda ~37 s. Enter/Espacio sobre un <button> es activación nativa del navegador.
  it("abre con clic y cierra con Escape", () => {
    render(<FieldHelp label="Campo X">Texto de ayuda</FieldHelp>);
    fireEvent.click(screen.getByRole("button", { name: "Ayuda: Campo X" }));
    expect(screen.getByText("Texto de ayuda")).toBeTruthy();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(screen.queryByText("Texto de ayuda")).toBeNull();
  });

  it("size=large abre una ventana con el campo como título", () => {
    render(
      <FieldHelp label="Campo X" size="large">
        Texto largo
      </FieldHelp>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ayuda: Campo X" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Campo X")).toBeTruthy();
    expect(screen.getByText("Texto largo")).toBeTruthy();
  });
});
