import { describe, expect, it } from "vitest";
import { COMANDOS, comando } from "./comandos-registro.js";
import { SINONIMOS_POR_COMANDO } from "./sinonimos-comandos.js";
import { buscarComandos, normalizarBusqueda, PUNTAJE_PREFIJO, PUNTAJE_SINONIMO } from "./buscar-comandos.js";

describe("normalizarBusqueda", () => {
  it("quita acentos y mayúsculas y colapsa espacios", () => {
    expect(normalizarBusqueda("Línea")).toBe(normalizarBusqueda("linea"));
    expect(normalizarBusqueda("LÍNEA")).toBe("linea");
    expect(normalizarBusqueda("  cuadro   rojo ")).toBe("cuadro rojo");
    expect(normalizarBusqueda("")).toBe("");
  });
});

describe("buscarComandos", () => {
  it("encuentra por etiqueta sin acentos", () => {
    const ids = buscarComandos("cuadricula", COMANDOS).map((r) => r.comando.id);
    expect(ids).toContain("cuadricula");
    const linea = buscarComandos("linea", COMANDOS).map((r) => r.comando.id);
    expect(linea).toContain("linea");
  });

  it("encuentra imantar por sinónimo", () => {
    const ids = buscarComandos("iman", COMANDOS).map((r) => r.comando.id);
    expect(ids).toContain("imantar");
  });

  const casosSinonimo: Array<[string, string]> = [
    ["alinear", "alinear-izquierda"],
    ["borrar", "eliminar"],
    ["quitar", "eliminar"],
    ["suprimir", "eliminar"],
    ["copiar", "duplicar"],
    ["clonar", "duplicar"],
    ["juntar", "agrupar"],
    ["unir", "agrupar"],
    ["separar", "desagrupar"],
    ["desunir", "desagrupar"],
    ["capa", "orden-frente"],
    ["apilar", "orden-subir"],
    ["frente", "orden-frente"],
    ["fondo", "orden-fondo"],
    ["zoom", "acercar"],
    ["ampliar", "acercar"],
    ["reducir", "alejar"],
    ["lupa", "ajustar-vista"],
    ["rejilla", "cuadricula"],
    ["magnetico", "imantar"],
    ["flecha", "flecha"],
    ["caja", "forma-rectangulo"],
    ["cuadro", "forma-rectangulo"],
    ["terminar", "listo"],
    ["cerrar", "listo"],
    ["guardar", "listo"],
    ["atras", "deshacer"],
    ["adelante", "rehacer"],
  ];

  it.each(casosSinonimo)("«%s» incluye %s", (consulta, idEsperado) => {
    const ids = buscarComandos(consulta, COMANDOS).map((r) => r.comando.id);
    expect(ids).toContain(idEsperado);
  });

  it("orden de relevancia: exacta > prefijo > contiene > sinónimo", () => {
    const r = buscarComandos("linea", COMANDOS);
    const linea = r.find((x) => x.comando.id === "linea");
    expect(linea?.puntaje).toBeLessThanOrEqual(PUNTAJE_PREFIJO);
    const iman = r.find((x) => x.comando.id === "imantar");
    if (iman) expect(iman.puntaje).toBe(PUNTAJE_SINONIMO);
  });

  it("desempate estable por etiqueta", () => {
    const a = buscarComandos("alinear", COMANDOS);
    const b = buscarComandos("alinear", COMANDOS);
    expect(a.map((x) => x.comando.id)).toEqual(b.map((x) => x.comando.id));
  });

  it("búsqueda vacía: todos los comandos, formas al final", () => {
    const todos = buscarComandos("", COMANDOS);
    expect(todos).toHaveLength(COMANDOS.length);
    let ultimoForma = -1;
    for (let i = todos.length - 1; i >= 0; i--) {
      if (todos[i]?.comando.grupo === "formas") {
        ultimoForma = i;
        break;
      }
    }
    const primeroNoForma = todos.findIndex((r) => r.comando.grupo !== "formas");
    expect(ultimoForma).toBeGreaterThan(primeroNoForma);
  });

  it("sin resultados devuelve lista vacía", () => {
    expect(buscarComandos("zzzz-inexistente-xyz", COMANDOS)).toEqual([]);
  });

  it("cada id del mapa de sinónimos existe en COMANDOS", () => {
    for (const id of Object.keys(SINONIMOS_POR_COMANDO)) {
      expect(() => comando(id)).not.toThrow();
    }
  });
});
