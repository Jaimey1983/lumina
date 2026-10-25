import { describe, expect, it } from "vitest";
import { escenaVacia, normalizarEscena, type Escena, type Forma, type Linea } from "@lumina/drawing";
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

describe("esquemaAEscena: orden de lectura, tema centrado y niveles alineados (Y37a)", () => {
  const CELULA = "La célula\n  Membrana\n    Fosfolípidos\n    Proteínas\n  Núcleo\n    ADN\n    Nucléolo\n  Citoplasma\n    Mitocondrias\n    Ribosomas\n    Retículo endoplasmático\n  Pared celular";
  const esq = analizarEsquema(CELULA);
  const hijosDe = (i: number | null): number[] => esq.nodos.flatMap((n, k) => (n.padre === i ? [k] : []));
  const cx = (f: Forma): number => f.transformacion.x + f.transformacion.ancho / 2;
  const cy = (f: Forma): number => f.transformacion.y + f.transformacion.alto / 2;

  for (const modo of ["arbol", "jerarquico"] as const) {
    it(`${modo}: los hermanos salen en el orden del esquema`, () => {
      const fs = formas(crear(CELULA, modo).escena);
      const eje = modo === "arbol" ? cy : cx; // árbol fluye a la derecha (los hermanos se apilan); jerárquico, hacia abajo
      for (let i = -1; i < esq.nodos.length; i++) {
        const hs = hijosDe(i === -1 ? null : i);
        for (let k = 1; k < hs.length; k++) expect(eje(fs[hs[k] as number] as Forma), `hijos de ${i}`).toBeGreaterThan(eje(fs[hs[k - 1] as number] as Forma));
      }
    });

    it(`${modo}: cada nodo con hijos queda centrado sobre ellos`, () => {
      const fs = formas(crear(CELULA, modo).escena);
      const c = modo === "arbol" ? cy : cx;
      for (let i = 0; i < esq.nodos.length; i++) {
        const hs = hijosDe(i);
        if (hs.length === 0) continue;
        const primero = c(fs[hs[0] as number] as Forma);
        const ultimo = c(fs[hs[hs.length - 1] as number] as Forma);
        expect(c(fs[i] as Forma), `nodo ${i}`).toBeCloseTo((primero + ultimo) / 2, 0);
      }
    });

    it(`${modo}: los nodos de un mismo nivel comparten su borde de entrada`, () => {
      const fs = formas(crear(CELULA, modo).escena);
      const borde = (f: Forma): number => (modo === "arbol" ? f.transformacion.x : f.transformacion.y);
      for (let nivel = 0; nivel < esq.niveles; nivel++) {
        const bordes = new Set(esq.nodos.flatMap((n, i) => (n.nivel === nivel ? [Math.round(borde(fs[i] as Forma) * 1000) / 1000] : [])));
        expect(bordes.size, `nivel ${nivel}`).toBe(1);
      }
    });
  }

  it("el radial sigue sin pisarse y con la raíz en el centro", () => {
    const { escena } = crear(CELULA, "radial");
    const fs = formas(escena);
    for (let i = 0; i < fs.length; i++) {
      for (let j = i + 1; j < fs.length; j++) {
        const a = (fs[i] as Forma).transformacion;
        const b = (fs[j] as Forma).transformacion;
        expect(a.x < b.x + b.ancho - 1e-6 && b.x < a.x + a.ancho - 1e-6 && a.y < b.y + b.alto - 1e-6 && b.y < a.y + a.alto - 1e-6, `${i}/${j}`).toBe(false);
      }
    }
  });
});

describe("esquemaAEscena: dentro de la página (Y37b)", () => {
  const CELULA = "La célula\n  Membrana\n    Fosfolípidos\n    Proteínas\n  Núcleo\n    ADN\n    Nucléolo\n  Citoplasma\n    Mitocondrias\n    Ribosomas\n    Retículo endoplasmático\n  Pared celular";
  const grande = (ramas: number, hojas: number): string =>
    ["Tema", ...Array.from({ length: ramas }, (_v, r) => [`  Rama ${r}`, ...Array.from({ length: hojas }, (_w, h) => `    Hoja ${r}.${h}`)].join("\n"))].join("\n");
  const centro = { x: 640, y: 360 };
  const enPagina = (modo: "arbol" | "radial" | "jerarquico", texto: string, c = centro) => esquemaAEscena(escenaVacia(), analizarEsquema(texto), { modo, centro: c });
  const caja = (e: Escena): { x0: number; y0: number; x1: number; y1: number } => {
    const fs = formas(e);
    return {
      x0: Math.min(...fs.map((f) => f.transformacion.x)),
      y0: Math.min(...fs.map((f) => f.transformacion.y)),
      x1: Math.max(...fs.map((f) => f.transformacion.x + f.transformacion.ancho)),
      y1: Math.max(...fs.map((f) => f.transformacion.y + f.transformacion.alto)),
    };
  };
  const conMargen = (e: Escena): boolean => {
    const c = caja(e);
    return c.x0 >= 24 - 1e-6 && c.y0 >= 24 - 1e-6 && c.x1 <= e.ancho - 24 + 1e-6 && c.y1 <= e.alto - 24 + 1e-6;
  };

  it("«La célula» en las tres disposiciones queda entera en la página de 1280 × 720, con margen y sin aviso", () => {
    for (const modo of ["arbol", "jerarquico", "radial"] as const) {
      const r = enPagina(modo, CELULA);
      expect(conMargen(r.escena), modo).toBe(true);
      expect(r.fueraDePagina, modo).toBeUndefined();
    }
  });

  it("un esquema grande en radial se encaja; en árbol, que no cabe, se crea igual y avisa", () => {
    const radial = enPagina("radial", grande(5, 3));
    expect(radial.fueraDePagina).toBeUndefined();
    expect(conMargen(radial.escena)).toBe(true);
    const arbol = enPagina("arbol", grande(5, 3));
    expect(arbol.fueraDePagina).toBe(true);
    expect(formas(arbol.escena)).toHaveLength(21);
    expect(lineas(arbol.escena)).toHaveLength(20);
  });

  it("queda centrado en el punto pedido cuando cabe", () => {
    const c = caja(enPagina("arbol", CELULA).escena);
    expect((c.x0 + c.x1) / 2).toBeCloseTo(640, 6);
    expect((c.y0 + c.y1) / 2).toBeCloseTo(360, 6);
  });

  it("con el centro cerca de una esquina se corre lo justo para entrar con margen", () => {
    const r = enPagina("jerarquico", CELULA, { x: 100, y: 100 });
    expect(conMargen(r.escena)).toBe(true);
    const c = caja(r.escena);
    expect(c.x0).toBeCloseTo(24, 6);
    expect(c.y0).toBeCloseTo(24, 6);
  });

  it("un solo nodo se centra, y cerca del borde se corre para dejar margen", () => {
    const centrado = enPagina("arbol", "Tema").escena;
    const a = caja(centrado);
    expect((a.x0 + a.x1) / 2).toBeCloseTo(640, 6);
    const borde = enPagina("arbol", "Tema", { x: 10, y: 10 }).escena;
    const b = caja(borde);
    expect(b.x0).toBeCloseTo(24, 6);
    expect(b.y0).toBeCloseTo(24, 6);
  });

  it("con una página mayor no se compacta: el esquema es el mismo que con la separación normal", () => {
    const enorme = (modo: "arbol" | "radial"): Escena => esquemaAEscena(normalizarEscena({ ...(escenaVacia() as unknown as Record<string, unknown>), ancho: 20000, alto: 20000 }), analizarEsquema(grande(5, 3)), { modo, centro: { x: 10000, y: 10000 } }).escena;
    const cajaRadial = caja(enorme("radial"));
    expect(cajaRadial.y1 - cajaRadial.y0).toBeGreaterThan(720);
  });

  it("los conectores salen y llegan bien tras encajar (siguen pegados padre → hijo)", () => {
    const r = enPagina("radial", grande(5, 3)).escena;
    const fs = formas(r);
    const ids = new Set(fs.map((f) => f.id));
    for (const l of lineas(r)) {
      expect(ids.has(l.origen?.elementoId as string)).toBe(true);
      expect(ids.has(l.destino?.elementoId as string)).toBe(true);
    }
  });
});
