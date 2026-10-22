import { describe, expect, it } from "vitest";
import { escenaVacia, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { analizarEsquema, COLORES_DE_RAMA, esquemaAEscena, MAX_LARGO_LINEA_ESQUEMA, MAX_NODOS_ESQUEMA } from "./esquema-a-escena.js";

const textos = (s: string): string[] => analizarEsquema(s).nodos.map((n) => n.texto);
const padres = (s: string): Array<number | null> => analizarEsquema(s).nodos.map((n) => n.padre);
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const crear = (s: string, modo: "arbol" | "radial" | "jerarquico" = "arbol", escena: Escena = escenaVacia()) =>
  esquemaAEscena(escena, analizarEsquema(s), { modo, centro: { x: 500, y: 300 } });

describe("analizarEsquema: formatos de entrada", () => {
  it("sangría con tabuladores", () => {
    expect(padres("A\n\tB\n\t\tC\n\tD")).toEqual([null, 0, 1, 0]);
  });
  it("sangría con 2 y con 4 espacios", () => {
    expect(padres("A\n  B\n    C\n  D")).toEqual([null, 0, 1, 0]);
    // Con 4 espacios cada nivel salta de a dos; el salto se trata como hijo directo.
    expect(padres("A\n    B\n        C\n    D")).toEqual([null, 0, 1, 0]);
  });
  it("guiones, asteriscos y más", () => {
    expect(textos("- A\n  - B\n  * C\n  + D")).toEqual(["A", "B", "C", "D"]);
    expect(padres("- A\n  - B\n  * C\n  + D")).toEqual([null, 0, 0, 0]);
  });
  it("numeración «1.» y «1)» y «1.1.»", () => {
    expect(textos("1. Uno\n  2) Dos\n    1.1. Tres")).toEqual(["Uno", "Dos", "Tres"]);
  });
  it("un número que es parte del texto se conserva", () => {
    expect(textos("3.14 es pi\n  2024 fue bisiesto\n  100% listo")).toEqual(["3.14 es pi", "2024 fue bisiesto", "100% listo"]);
  });
  it("lista de Markdown con viñetas y numeración mezcladas", () => {
    expect(textos("- Raíz\n  1. Rama\n    - Hoja\n  2) Otra")).toEqual(["Raíz", "Rama", "Hoja", "Otra"]);
    expect(padres("- Raíz\n  1. Rama\n    - Hoja\n  2) Otra")).toEqual([null, 0, 1, 0]);
  });
  it("mezcla de tabuladores y espacios", () => {
    expect(padres("A\n\tB\n  C\n\t\tD")).toEqual([null, 0, 0, 2]);
  });
  it("las líneas en blanco y las que solo tienen espacios se ignoran", () => {
    const e = analizarEsquema("\nA\n\n   \n  B\n\t\n");
    expect(e.nodos.map((n) => n.texto)).toEqual(["A", "B"]);
  });
  it("sangría inconsistente: un nivel que salta es hijo directo del anterior", () => {
    expect(padres("A\n        Z\n  B")).toEqual([null, 0, 0]);
  });
  it("sangría inconsistente: bajar a un nivel que no existe cuelga del más cercano de arriba", () => {
    // A(0) → B(3) → C(1): C no coincide con ningún nivel abierto salvo A.
    expect(padres("A\n\t\t\tB\n  C")).toEqual([null, 0, 0]);
  });
  it("empezar con sangría hace una raíz igual", () => {
    expect(padres("    A\nB")).toEqual([null, null]);
  });
  it("vacío", () => {
    const e = analizarEsquema("  \n\n");
    expect(e).toMatchObject({ nodos: [], raices: 0, niveles: 0, sobrantes: 0, recortadas: 0 });
  });
});

describe("analizarEsquema: grafo", () => {
  it("una raíz es un árbol; sus niveles y raíces", () => {
    const e = analizarEsquema("R\n  A\n    A1\n  B");
    expect(e.raices).toBe(1);
    expect(e.niveles).toBe(3);
    expect(e.nodos.map((n) => n.nivel)).toEqual([0, 1, 2, 1]);
  });
  it("varias raíces son un bosque", () => {
    const e = analizarEsquema("R1\n  A\nR2\n  B\nR3");
    expect(e.raices).toBe(3);
    expect(padres("R1\n  A\nR2\n  B\nR3")).toEqual([null, 0, null, 2, null]);
  });
  it("cada rama principal tiene su índice y lo heredan sus descendientes", () => {
    const e = analizarEsquema("R\n  A\n    A1\n  B\n    B1\n      B2");
    expect(e.nodos.map((n) => n.rama)).toEqual([null, 0, 0, 1, 1, 1]);
  });
  it("el nivel es la profundidad real, no la sangría escrita", () => {
    expect(analizarEsquema("A\n        B").nodos[1]?.nivel).toBe(1);
  });
});

describe("analizarEsquema: límites", () => {
  const lista = (n: number): string => Array.from({ length: n }, (_, i) => (i === 0 ? "raiz" : `  n${i}`)).join("\n");
  it("200 nodos pasan sin aviso", () => {
    const e = analizarEsquema(lista(MAX_NODOS_ESQUEMA));
    expect(e.nodos).toHaveLength(200);
    expect(e.sobrantes).toBe(0);
  });
  it("201 nodos avisan: entran los primeros 200 y sobra uno", () => {
    const e = analizarEsquema(lista(MAX_NODOS_ESQUEMA + 1));
    expect(e.nodos).toHaveLength(200);
    expect(e.sobrantes).toBe(1);
    // Los padres siempre van antes que los hijos, así que lo que entra queda conectado.
    expect(e.nodos.every((n) => n.padre === null || n.padre < e.nodos.indexOf(n))).toBe(true);
  });
  it("una línea de más de 200 caracteres se recorta y se cuenta", () => {
    const e = analizarEsquema(`${"x".repeat(MAX_LARGO_LINEA_ESQUEMA + 5)}\nbreve`);
    expect(e.nodos[0]?.texto).toHaveLength(MAX_LARGO_LINEA_ESQUEMA);
    expect(e.recortadas).toBe(1);
    expect(analizarEsquema("x".repeat(MAX_LARGO_LINEA_ESQUEMA)).recortadas).toBe(0);
  });
  it("no parte un carácter de dos unidades al recortar", () => {
    const e = analizarEsquema("😀".repeat(MAX_LARGO_LINEA_ESQUEMA + 1));
    expect(Array.from(e.nodos[0]?.texto ?? "")).toHaveLength(MAX_LARGO_LINEA_ESQUEMA);
  });
});

describe("esquemaAEscena", () => {
  it("una forma por nodo y un conector ortogonal con flecha del padre al hijo", () => {
    const { escena, ids } = crear("R\n  A\n  B\n    B1");
    expect(formas(escena)).toHaveLength(4);
    expect(lineas(escena)).toHaveLength(3);
    expect(ids).toHaveLength(7);
    const porTexto = new Map(formas(escena).map((f) => [f.texto, f.id]));
    const aristas = lineas(escena).map((l) => [l.origen?.elementoId, l.destino?.elementoId]);
    expect(aristas).toEqual(
      expect.arrayContaining([
        [porTexto.get("R"), porTexto.get("A")],
        [porTexto.get("R"), porTexto.get("B")],
        [porTexto.get("B"), porTexto.get("B1")],
      ]),
    );
    for (const l of lineas(escena)) {
      expect(l.trazado).toBe("ortogonal");
      expect(l.fin).toBe("flecha");
    }
    expect(formas(escena).every((f) => f.forma === "rectangulo-redondeado")).toBe(true);
  });

  it("un bosque no conecta las raíces entre sí", () => {
    const { escena } = crear("R1\n  A\nR2\n  B");
    const porId = new Map(formas(escena).map((f) => [f.id, f.texto]));
    const pares = lineas(escena).map((l) => `${porId.get(l.origen?.elementoId ?? "")}>${porId.get(l.destino?.elementoId ?? "")}`);
    expect(pares.sort()).toEqual(["R1>A", "R2>B"]);
  });

  it("un solo nodo: una forma, sin conectores", () => {
    const { escena } = crear("Solo");
    expect(formas(escena)).toHaveLength(1);
    expect(lineas(escena)).toHaveLength(0);
  });

  it("queda centrado en el punto pedido", () => {
    for (const modo of ["arbol", "radial", "jerarquico"] as const) {
      const { escena } = crear("R\n  A\n  B\n    B1\n  C", modo);
      const fs = formas(escena);
      const x0 = Math.min(...fs.map((f) => f.transformacion.x));
      const x1 = Math.max(...fs.map((f) => f.transformacion.x + f.transformacion.ancho));
      const y0 = Math.min(...fs.map((f) => f.transformacion.y));
      const y1 = Math.max(...fs.map((f) => f.transformacion.y + f.transformacion.alto));
      expect((x0 + x1) / 2).toBeCloseTo(500, 0);
      expect((y0 + y1) / 2).toBeCloseTo(300, 0);
    }
  });

  it("las formas no se pisan entre sí en ninguna disposición", () => {
    for (const modo of ["arbol", "radial", "jerarquico"] as const) {
      const { escena } = crear("R\n  A\n    A1\n    A2\n  B\n    B1\n  C\nOtra\n  X", modo);
      const fs = formas(escena);
      for (let i = 0; i < fs.length; i++) {
        for (let j = i + 1; j < fs.length; j++) {
          const a = (fs[i] as Forma).transformacion;
          const b = (fs[j] as Forma).transformacion;
          const separadas = a.x + a.ancho <= b.x || b.x + b.ancho <= a.x || a.y + a.alto <= b.y || b.y + b.alto <= a.y;
          expect(separadas, `${modo}: ${fs[i]?.texto} / ${fs[j]?.texto}`).toBe(true);
        }
      }
    }
  });

  it("árbol fluye hacia la derecha; jerárquico, hacia abajo", () => {
    const arbol = formas(crear("R\n  A", "arbol").escena);
    expect((arbol.find((f) => f.texto === "A") as Forma).transformacion.x).toBeGreaterThan((arbol.find((f) => f.texto === "R") as Forma).transformacion.x);
    const jer = formas(crear("R\n  A", "jerarquico").escena);
    expect((jer.find((f) => f.texto === "A") as Forma).transformacion.y).toBeGreaterThan((jer.find((f) => f.texto === "R") as Forma).transformacion.y);
  });

  it("cada rama principal lleva su color de la paleta del editor; las raíces, uno neutro", () => {
    const { escena } = crear("R\n  A\n    A1\n  B\n    B1");
    const por = new Map(formas(escena).map((f) => [f.texto, f.estilo.contorno.color.toUpperCase()]));
    expect(por.get("A")).toBe(por.get("A1"));
    expect(por.get("B")).toBe(por.get("B1"));
    expect(por.get("A")).not.toBe(por.get("B"));
    expect(COLORES_DE_RAMA).toContain(por.get("A"));
    expect(COLORES_DE_RAMA).toContain(por.get("B"));
    expect(COLORES_DE_RAMA).not.toContain(por.get("R"));
  });

  it("más ramas que colores: los colores se repiten sin fallar", () => {
    const ramas = Array.from({ length: COLORES_DE_RAMA.length + 3 }, (_, i) => `  r${i}`).join("\n");
    expect(formas(crear(`R\n${ramas}`).escena)).toHaveLength(COLORES_DE_RAMA.length + 4);
  });

  it("el texto se conserva literal: <, & y comillas", () => {
    const crudo = `a < b & c "d" 'e' </text><script>`;
    const { escena } = crear(`${crudo}\n  - ${crudo}2`);
    expect(formas(escena).map((f) => f.texto)).toEqual([crudo, `${crudo}2`]);
  });

  it("no toca lo que ya había y lo nuevo va al frente", () => {
    const base = crear("Previo").escena;
    const previoId = formas(base)[0]?.id;
    const { escena, ids } = crear("R\n  A", "arbol", base);
    expect(escena.elementos[0]).toEqual(base.elementos[0]);
    expect(ids).not.toContain(previoId);
    expect(escena.elementos.length).toBe(base.elementos.length + 3);
  });

  it("un esquema vacío devuelve la misma escena", () => {
    const base = escenaVacia();
    const r = crear("   ", "arbol", base);
    expect(r.escena).toBe(base);
    expect(r.ids).toEqual([]);
  });

  it("200 nodos: se crean todos, conectados, en menos de 1 s", () => {
    const entrada = Array.from({ length: 200 }, (_, i) => (i === 0 ? "raiz" : `  n${i}`)).join("\n");
    const t0 = Date.now();
    const { escena } = crear(entrada);
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(formas(escena)).toHaveLength(200);
    expect(lineas(escena)).toHaveLength(199);
  });
});

describe("regresión: el analizador viejo no se toca", () => {
  it("parseOutlineLines sigue siendo el de siempre (no quita «1)»: por eso se limpia acá)", async () => {
    const { parseOutlineLines } = await import("../diagrama-outline-parser.js");
    expect(parseOutlineLines("1) A\n  - B\n\t1. C")).toEqual([
      { level: 0, text: "1) A" },
      { level: 1, text: "B" },
      { level: 1, text: "C" },
    ]);
  });
});
