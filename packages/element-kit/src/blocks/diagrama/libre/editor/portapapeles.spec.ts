import { describe, expect, it, vi } from "vitest";
import { MAX_ELEMENTOS_FRAGMENTO, MAX_TAMANO_FRAGMENTO, type Fragmento } from "@lumina/drawing";
import { leerDePortapapeles, limpiarTexto, MAX_TEXTO_PEGADO, MIME_FRAGMENTO, prepararCopia, textoPlanoDe, type Copia } from "./portapapeles.js";
import { escena, forma, linea } from "./util-pruebas.js";

const lectura = (datos: Record<string, string>, memoria: Copia | null = null) => leerDePortapapeles({ getData: (t) => datos[t] ?? "" }, memoria);
const copiaDe = (e = escena(forma("a", 0, 0, 100, 60, { texto: "Uno" }), forma("b", 200, 0, 100, 60, { texto: "Dos" }))): Copia => {
  const r = prepararCopia(e, e.elementos.map((x) => x.id));
  if (!r.ok) throw new Error(r.motivo);
  return r.copia;
};

describe("prepararCopia", () => {
  it("devuelve el fragmento, su JSON y el texto plano", () => {
    const c = copiaDe();
    expect(c.fragmento.elementos).toHaveLength(2);
    expect(JSON.parse(c.json)).toMatchObject({ formato: "lumina-dibujo", version: 1 });
    expect(c.texto).toBe("Uno\nDos");
  });

  it("sin nada elegido, o con ids que no existen, dice que no hay nada que copiar", () => {
    const e = escena(forma("a", 0, 0));
    expect(prepararCopia(e, [])).toEqual({ ok: false, motivo: "No hay nada que copiar." });
    expect(prepararCopia(e, ["no-existe"])).toMatchObject({ ok: false });
  });

  it("el límite es de 500 elementos: 500 se copian y 501 no", () => {
    const f = (n: number) => escena(...Array.from({ length: n }, (_, i) => forma(`f${i}`, i, 0, 10, 10)));
    const justo = f(MAX_ELEMENTOS_FRAGMENTO);
    expect(prepararCopia(justo, justo.elementos.map((x) => x.id)).ok).toBe(true);
    const pasado = f(MAX_ELEMENTOS_FRAGMENTO + 1);
    const r = prepararCopia(pasado, pasado.elementos.map((x) => x.id));
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.motivo).toMatch(/máximo 500/);
  });

  it("lo que pasa de 1 MB serializado no se copia", () => {
    const largo = "x".repeat(2000);
    const e = escena(...Array.from({ length: 450 }, (_, i) => forma(`f${i}`, i, 0, 10, 10, { texto: largo })));
    const r = prepararCopia(e, e.elementos.map((x) => x.id));
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.motivo).toMatch(/demasiado grande/);
    // Y el tamaño de la prueba es el que dice: sin el límite el JSON pasaría del máximo.
    expect(JSON.stringify(e).length).toBeGreaterThan(MAX_TAMANO_FRAGMENTO);
  });
});

describe("textoPlanoDe", () => {
  it("los textos de formas, cuadros de texto y rótulos, en orden de apilado, sin vacíos ni grupos", () => {
    const e = escena(
      forma("a", 0, 0, 100, 60, { texto: "  Uno  " }),
      forma("b", 200, 0, 100, 60, { texto: "" }),
      { id: "t", tipo: "texto", texto: "Nota", transformacion: { x: 0, y: 100, ancho: 80, alto: 30, rotacion: 0 } },
      linea("l", [[0, 0], [10, 10]], { texto: "Sí" }),
      { id: "g", tipo: "grupo", hijos: ["a", "b"] },
    );
    const f = (prepararCopia(e, ["g", "t", "l"]) as { ok: true; copia: Copia }).copia.fragmento;
    expect(textoPlanoDe(f)).toBe("Uno\nNota\nSí");
  });

  it("sin ningún texto, queda vacío", () => {
    expect(textoPlanoDe({ formato: "lumina-dibujo", version: 1, elementos: [] } as Fragmento)).toBe("");
  });
});

describe("limpiarTexto", () => {
  it("unifica los saltos de línea y quita los vacíos del final", () => {
    expect(limpiarTexto("a\r\nb\rc\n\n  \n")).toBe("a\nb\nc");
    expect(limpiarTexto("   ")).toBe("");
  });
});

describe("leerDePortapapeles", () => {
  it("el formato propio válido es un fragmento, y su clave es el JSON", () => {
    const c = copiaDe();
    const l = lectura({ [MIME_FRAGMENTO]: c.json, "text/plain": c.texto });
    expect(l.tipo).toBe("fragmento");
    expect(l.tipo === "fragmento" && l.clave).toBe(c.json);
    expect(l.tipo === "fragmento" && l.fragmento.elementos).toHaveLength(2);
  });

  it("el formato propio manda sobre el texto plano", () => {
    const c = copiaDe();
    expect(lectura({ [MIME_FRAGMENTO]: c.json, "text/plain": "otra cosa" }).tipo).toBe("fragmento");
  });

  it("un JSON roto, de otro formato o vacío de elementos es un error con su motivo", () => {
    for (const json of ["{no", "null", "[]", JSON.stringify({ formato: "x", version: 1, elementos: [forma("a", 0, 0)] }), JSON.stringify({ formato: "lumina-dibujo", version: 1, elementos: [] })]) {
      const l = lectura({ [MIME_FRAGMENTO]: json, "text/plain": "texto" });
      expect(l.tipo).toBe("error"); // y NO cae al texto plano: lo propio roto no se disimula
      expect(l.tipo === "error" && l.motivo).toMatch(/no es un dibujo válido/);
    }
  });

  it("más de 1 MB de formato propio se rechaza sin leerlo", () => {
    const l = lectura({ [MIME_FRAGMENTO]: "x".repeat(MAX_TAMANO_FRAGMENTO + 1) });
    expect(l.tipo === "error" && l.motivo).toMatch(/demasiado grande/);
  });

  it("texto plano: se limpia y se devuelve con su clave; vacío o solo espacios es «vacío»", () => {
    const l = lectura({ "text/plain": "Hola\r\nmundo\r\n" });
    expect(l).toMatchObject({ tipo: "texto", texto: "Hola\nmundo" });
    expect(lectura({}).tipo).toBe("vacio");
    expect(lectura({ "text/plain": " \n\t " }).tipo).toBe("vacio");
  });

  it("el texto plano de 5000 caracteres se pega y el de 5001 no", () => {
    expect(lectura({ "text/plain": "x".repeat(MAX_TEXTO_PEGADO) }).tipo).toBe("texto");
    const l = lectura({ "text/plain": "x".repeat(MAX_TEXTO_PEGADO + 1) });
    expect(l.tipo).toBe("error");
    expect(l.tipo === "error" && l.motivo).toMatch(/demasiado largo/);
  });

  it("si el navegador quitó el formato propio, el texto que coincide con la última copia recupera el dibujo", () => {
    const c = copiaDe();
    const l = lectura({ "text/plain": c.texto }, c);
    expect(l.tipo).toBe("fragmento");
    expect(l.tipo === "fragmento" && l.clave).toBe(c.json);
    // Con saltos de línea de otro sistema también.
    expect(lectura({ "text/plain": c.texto.replace(/\n/g, "\r\n") }, c).tipo).toBe("fragmento");
    // Si el texto es otro, es texto.
    expect(lectura({ "text/plain": "algo distinto" }, c).tipo).toBe("texto");
    // Una copia sin texto no «recupera» cualquier cosa.
    const sinTexto = copiaDe(escena(forma("a", 0, 0)));
    expect(sinTexto.texto).toBe("");
    expect(lectura({ "text/plain": "algo" }, sinTexto).tipo).toBe("texto");
  });

  it("un portapapeles que lanza al leer es un error, no una excepción", () => {
    const getData = vi.fn(() => {
      throw new Error("sin permiso");
    });
    const l = leerDePortapapeles({ getData });
    expect(l.tipo === "error" && l.motivo).toMatch(/No se pudo leer/);
  });
});
