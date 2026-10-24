import { afterEach, describe, expect, it, vi } from "vitest";
import { CLAVE_RECIENTES, guardarRecientes, leerRecientes, MAX_RECIENTES, registrarEnAlmacen, registrarReciente } from "./colores-recientes.js";

const OFRECIDOS = ["#2563EB", "#FFFFFF"];

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("registrarReciente", () => {
  it("pone el color primero, en mayúsculas, y devuelve una lista nueva sin mutar la anterior", () => {
    const antes = ["#111111"] as const;
    const despues = registrarReciente(antes, "#abcdef", OFRECIDOS);
    expect(despues).toEqual(["#ABCDEF", "#111111"]);
    expect(despues).not.toBe(antes);
    expect(antes).toEqual(["#111111"]);
  });
  it("quita el duplicado sin distinguir mayúsculas y lo sube al principio", () => {
    expect(registrarReciente(["#111111", "#ABCDEF", "#222222"], "#abcdef", OFRECIDOS)).toEqual(["#ABCDEF", "#111111", "#222222"]);
  });
  it("recorta a 8 y descarta el más viejo", () => {
    const nueve = ["#000001", "#000002", "#000003", "#000004", "#000005", "#000006", "#000007", "#000008"];
    expect(MAX_RECIENTES).toBe(8);
    const r = registrarReciente(nueve, "#00000A", OFRECIDOS);
    expect(r).toHaveLength(8);
    expect(r[0]).toBe("#00000A");
    expect(r).not.toContain("#000008");
    expect(r[7]).toBe("#000007");
  });
  it.each([
    ["vacío", ""],
    ["un token del tema", "var(--primary)"],
    ["un color de la paleta", "#2563eb"],
    ["un neutro", "#ffffff"],
    ["un color inválido", "rojo"],
    ["una función CSS", "rgb(1,2,3)"],
  ])("no registra %s: devuelve la misma lista", (_n, color) => {
    const lista = ["#111111"];
    expect(registrarReciente(lista, color, OFRECIDOS)).toBe(lista);
  });
  it("si ya va primero devuelve la misma lista", () => {
    const lista = ["#ABCDEF", "#111111"];
    expect(registrarReciente(lista, "#abcdef", OFRECIDOS)).toBe(lista);
  });
  it("acepta hex de 3 y de 8 dígitos tal cual, en mayúsculas", () => {
    expect(registrarReciente([], "#abc", OFRECIDOS)).toEqual(["#ABC"]);
    expect(registrarReciente([], "#aabbcc80", OFRECIDOS)).toEqual(["#AABBCC80"]);
  });
});

describe("leerRecientes / guardarRecientes", () => {
  it("lee lo guardado y lo valida elemento a elemento", () => {
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(["#abcdef", 3, "var(--primary)", "rojo", "#ABCDEF", "#111111", null]));
    expect(leerRecientes()).toEqual(["#ABCDEF", "#111111"]);
  });
  it("recorta a 8 lo que venga de más", () => {
    const muchos = Array.from({ length: 12 }, (_v, i) => `#0000${String(i).padStart(2, "0")}`);
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(muchos));
    expect(leerRecientes()).toEqual(muchos.slice(0, 8));
  });
  it("vacía sin nada guardado, con JSON roto o con algo que no es una lista", () => {
    expect(leerRecientes()).toEqual([]);
    localStorage.setItem(CLAVE_RECIENTES, "{no es json");
    expect(leerRecientes()).toEqual([]);
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify({ a: 1 }));
    expect(leerRecientes()).toEqual([]);
  });
  it("sin localStorage (que lanza) no rompe: lee vacío y guardar no hace nada", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota");
    });
    expect(leerRecientes()).toEqual([]);
    expect(() => guardarRecientes(["#111111"])).not.toThrow();
    expect(() => registrarEnAlmacen("#abcdef", OFRECIDOS)).not.toThrow();
  });
  it("guardar y leer dan lo mismo", () => {
    guardarRecientes(["#ABCDEF", "#111111"]);
    expect(localStorage.getItem(CLAVE_RECIENTES)).toBe('["#ABCDEF","#111111"]');
    expect(leerRecientes()).toEqual(["#ABCDEF", "#111111"]);
  });
  it("registrarEnAlmacen guarda solo si cambia algo", () => {
    const poner = vi.spyOn(Storage.prototype, "setItem");
    expect(registrarEnAlmacen("#abcdef", OFRECIDOS)).toEqual(["#ABCDEF"]);
    expect(poner).toHaveBeenCalledTimes(1);
    registrarEnAlmacen("#ABCDEF", OFRECIDOS);
    registrarEnAlmacen("var(--primary)", OFRECIDOS);
    expect(poner).toHaveBeenCalledTimes(1);
  });
});
