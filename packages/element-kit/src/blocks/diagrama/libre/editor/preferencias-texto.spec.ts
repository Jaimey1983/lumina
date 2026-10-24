import { afterEach, describe, expect, it, vi } from "vitest";
import { CLAVE_CRECER_AL_ESCRIBIR, guardarCrecerAlEscribir, leerCrecerAlEscribir } from "./preferencias-texto.js";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("preferencia «crecer al escribir»", () => {
  it("la clave es la del navegador, con el prefijo del dibujo", () => {
    expect(CLAVE_CRECER_AL_ESCRIBIR).toBe("lumina.dibujo.crecer-al-escribir");
  });

  it("está apagada por defecto: ninguna forma cambia de tamaño si nadie lo pidió", () => {
    expect(leerCrecerAlEscribir()).toBe(false);
  });

  it("guardar y leer dan lo mismo, encendida y apagada", () => {
    guardarCrecerAlEscribir(true);
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBe("1");
    expect(leerCrecerAlEscribir()).toBe(true);
    guardarCrecerAlEscribir(false);
    expect(localStorage.getItem(CLAVE_CRECER_AL_ESCRIBIR)).toBe("0");
    expect(leerCrecerAlEscribir()).toBe(false);
  });

  it.each(["", "true", "yes", "2", "{}"])("un valor guardado raro («%s») cuenta como apagada", (v) => {
    localStorage.setItem(CLAVE_CRECER_AL_ESCRIBIR, v);
    expect(leerCrecerAlEscribir()).toBe(false);
  });

  it("sin localStorage (que lanza) no rompe: lee apagada y guardar no hace nada", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota");
    });
    expect(leerCrecerAlEscribir()).toBe(false);
    expect(() => guardarCrecerAlEscribir(true)).not.toThrow();
  });
});
