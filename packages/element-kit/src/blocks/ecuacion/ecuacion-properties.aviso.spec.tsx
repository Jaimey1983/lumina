import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EcuacionProperties } from "./ecuacion-properties.js";
import { createDefaultEcuacionBlock } from "./ecuacion-defaults.js";

afterEach(cleanup);

function aviso(pasos: boolean): string {
  const r = render(
    <EcuacionProperties
      block={createDefaultEcuacionBlock({ latex: "x^2", pasos })}
      onChange={() => undefined}
    />,
  );
  return r.container.querySelector("[data-ecuacion-aviso-eventos]")?.textContent ?? "";
}

describe("EcuacionProperties — aviso de eventos", () => {
  it("sin «línea por línea» avisa que una regla de clic no se activará", () => {
    expect(aviso(false)).toContain("no se activará");
  });

  it("con «línea por línea» explica qué eventos emite", () => {
    const t = aviso(true);
    expect(t).toContain("clic");
    expect(t).toContain("visitada");
  });
});
