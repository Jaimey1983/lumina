import { afterEach, describe, expect, it, vi } from "vitest";
import { cuentagotasAbierto, cuentagotasDisponible, pedirColor } from "./cuentagotas.js";

const g = globalThis as { EyeDropper?: unknown };

function conApi(open: () => Promise<{ sRGBHex: string }>): void {
  g.EyeDropper = class {
    open = open;
  };
}

afterEach(() => {
  delete g.EyeDropper;
  Object.defineProperty(globalThis, "isSecureContext", { value: undefined, configurable: true, writable: true });
  vi.restoreAllMocks();
});

describe("cuentagotasDisponible", () => {
  it("no hay sin la API", () => {
    expect(cuentagotasDisponible()).toBe(false);
  });
  it("hay con la API", () => {
    conApi(() => Promise.resolve({ sRGBHex: "#000000" }));
    expect(cuentagotasDisponible()).toBe(true);
  });
  it("no hay sin contexto seguro, aunque exista la API", () => {
    conApi(() => Promise.resolve({ sRGBHex: "#000000" }));
    Object.defineProperty(globalThis, "isSecureContext", { value: false, configurable: true, writable: true });
    expect(cuentagotasDisponible()).toBe(false);
  });
  it("una propiedad que no es una función no cuenta", () => {
    g.EyeDropper = {};
    expect(cuentagotasDisponible()).toBe(false);
  });
});

describe("pedirColor", () => {
  it("devuelve el color en mayúsculas", async () => {
    conApi(() => Promise.resolve({ sRGBHex: "#3a7bd5" }));
    expect(await pedirColor()).toBe("#3A7BD5");
  });
  it("cancelar (AbortError) da null", async () => {
    conApi(() => Promise.reject(new DOMException("cancelado", "AbortError")));
    expect(await pedirColor()).toBeNull();
  });
  it("cualquier otro error da null y no se propaga", async () => {
    conApi(() => Promise.reject(new Error("fallo")));
    expect(await pedirColor()).toBeNull();
    g.EyeDropper = class {
      constructor() {
        throw new Error("no se puede construir");
      }
    };
    expect(await pedirColor()).toBeNull();
  });
  it("un valor que no es #RRGGBB da null", async () => {
    conApi(() => Promise.resolve({ sRGBHex: "rojo" }));
    expect(await pedirColor()).toBeNull();
  });
  it("sin la API da null", async () => {
    expect(await pedirColor()).toBeNull();
  });
  it("cuentagotasAbierto es true solo mientras la promesa está pendiente, incluso si falla", async () => {
    let resolver!: (v: { sRGBHex: string }) => void;
    conApi(() => new Promise((r) => (resolver = r)));
    expect(cuentagotasAbierto()).toBe(false);
    const p = pedirColor();
    expect(cuentagotasAbierto()).toBe(true);
    resolver({ sRGBHex: "#000000" });
    await p;
    expect(cuentagotasAbierto()).toBe(false);
    conApi(() => Promise.reject(new Error("x")));
    await pedirColor();
    expect(cuentagotasAbierto()).toBe(false);
  });
});
