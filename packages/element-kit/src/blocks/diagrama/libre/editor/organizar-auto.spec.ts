import { describe, expect, it } from "vitest";
import { conectarFormas, normalizarEscena, puertosParaConectar, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { formasAOrganizar, organizarAuto, posicionesDagre, type DireccionOrganizar, type ModoOrganizar } from "./organizar-auto.js";
import { escena, forma, linea } from "./util-pruebas.js";

/** Generador con semilla (mulberry32). */
function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un árbol al azar de `n` formas de tamaños distintos, todas amontonadas y conectadas padre → hijo. */
function diagramaAlAzar(n: number, semilla: number): Escena {
  const r = azar(semilla);
  let e = escena(...Array.from({ length: n }, (_, i) => forma(`f${i}`, Math.floor(r() * 400), Math.floor(r() * 400), 30 + Math.floor(r() * 200), 20 + Math.floor(r() * 120))));
  for (let i = 1; i < n; i++) e = conectarFormas(e, `f${Math.floor(r() * i)}`, `f${i}`);
  return e;
}
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === "forma");
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const cx = (f: Forma): number => f.transformacion.x + f.transformacion.ancho / 2;
const cy = (f: Forma): number => f.transformacion.y + f.transformacion.alto / 2;
const get = (e: Escena, id: string): Forma => formas(e).find((f) => f.id === id) as Forma;
function pisadas(e: Escena): Array<[string, string]> {
  const fs = formas(e);
  const malas: Array<[string, string]> = [];
  for (let i = 0; i < fs.length; i++) {
    for (let j = i + 1; j < fs.length; j++) {
      const a = (fs[i] as Forma).transformacion;
      const b = (fs[j] as Forma).transformacion;
      if (a.x < b.x + b.ancho - 1e-6 && b.x < a.x + a.ancho - 1e-6 && a.y < b.y + b.alto - 1e-6 && b.y < a.y + a.alto - 1e-6) malas.push([(fs[i] as Forma).id, (fs[j] as Forma).id]);
    }
  }
  return malas;
}
const arbol7 = (): Escena => {
  let e = escena(...["r", "a", "b", "c", "d", "x", "y"].map((id, i) => forma(id, (i * 137) % 600, (i * 91) % 400)));
  for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "c"], ["a", "d"], ["b", "x"], ["b", "y"]] as const) e = conectarFormas(e, p, h);
  return e;
};

describe("organizarAuto: jerárquico en las cuatro direcciones", () => {
  it("cada hijo queda más allá de su padre en el sentido elegido", () => {
    const e = arbol7();
    const cada: Array<[DireccionOrganizar, (p: Forma, h: Forma) => boolean]> = [
      ["abajo", (p, h) => cy(p) < cy(h)],
      ["arriba", (p, h) => cy(p) > cy(h)],
      ["derecha", (p, h) => cx(p) < cx(h)],
      ["izquierda", (p, h) => cx(p) > cx(h)],
    ];
    for (const [direccion, cumple] of cada) {
      const r = organizarAuto(e, [], { modo: "jerarquico", direccion }).escena;
      for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "c"], ["a", "d"], ["b", "x"], ["b", "y"]]) {
        expect(cumple(get(r, p as string), get(r, h as string)), `${direccion}: ${p}→${h}`).toBe(true);
      }
    }
  });

  it("los hermanos de un mismo padre quedan alineados en el otro eje", () => {
    const r = organizarAuto(arbol7(), [], { modo: "jerarquico", direccion: "abajo" }).escena;
    expect(cy(get(r, "a"))).toBeCloseTo(cy(get(r, "b")), 0);
    expect(cy(get(r, "c"))).toBeCloseTo(cy(get(r, "x")), 0);
  });

  it("el árbol hacia la derecha pone los hijos a la derecha; hacia abajo, debajo", () => {
    const e = arbol7();
    const derecha = organizarAuto(e, [], { modo: "arbol", direccion: "derecha" }).escena;
    const abajo = organizarAuto(e, [], { modo: "arbol", direccion: "abajo" }).escena;
    for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "c"], ["b", "y"]] as const) {
      expect(cx(get(derecha, p)), `derecha ${p}→${h}`).toBeLessThan(cx(get(derecha, h)));
      expect(cy(get(abajo, p)), `abajo ${p}→${h}`).toBeLessThan(cy(get(abajo, h)));
    }
    // Sin dirección es hacia la derecha.
    expect(organizarAuto(e, [], { modo: "arbol" }).escena).toEqual(derecha);
  });

  it("dagre recibe el tamaño real de cada nodo, no uno solo para todos", () => {
    const nodos = [{ id: "g", x: 0, y: 0, ancho: 600, alto: 400 }, { id: "p", x: 0, y: 0, ancho: 20, alto: 20 }];
    const p = posicionesDagre(nodos, [{ desde: "g", hasta: "p" }], "abajo");
    // En vertical, la separación entre el borde de abajo del grande y el de arriba del pequeño es la de los niveles.
    expect((p.get("p")?.y as number) - ((p.get("g")?.y as number) + 400)).toBe(80);
  });
});

describe("organizarAuto: ninguna forma pisa a otra", () => {
  const combinaciones: Array<[ModoOrganizar, DireccionOrganizar | undefined]> = [
    ["jerarquico", "abajo"],
    ["jerarquico", "derecha"],
    ["jerarquico", "arriba"],
    ["jerarquico", "izquierda"],
    ["arbol", "derecha"],
    ["arbol", "abajo"],
    ["radial", undefined],
  ];

  it("propiedad barrida: 20, 100 y 500 formas de tamaños distintos, en los tres modos y todas las direcciones", () => {
    for (const n of [20, 100, 500]) {
      const e = diagramaAlAzar(n, 1000 + n);
      for (const [modo, direccion] of combinaciones) {
        const r = organizarAuto(e, [], { modo, ...(direccion ? { direccion } : {}) });
        expect(r.motivo, `${n}/${modo}/${direccion}`).toBeUndefined();
        expect(pisadas(r.escena), `${n}/${modo}/${direccion}`).toEqual([]);
        expect(formas(r.escena)).toHaveLength(n);
      }
    }
  });

  it("con formas sueltas y un ciclo tampoco", () => {
    let e = escena(forma("a", 0, 0), forma("b", 10, 10), forma("c", 20, 20), forma("s1", 30, 30), forma("s2", 40, 40), forma("s3", 50, 50));
    e = conectarFormas(conectarFormas(conectarFormas(e, "a", "b"), "b", "c"), "c", "a");
    for (const [modo, direccion] of combinaciones) {
      const r = organizarAuto(e, [], { modo, ...(direccion ? { direccion } : {}) }).escena;
      expect(pisadas(r), `${modo}/${direccion}`).toEqual([]);
    }
  });
});

describe("organizarAuto: ancla, determinismo y conectores", () => {
  it("la raíz no cambia de sitio en ningún modo", () => {
    const e = arbol7();
    for (const [modo, direccion] of [["jerarquico", "abajo"], ["jerarquico", "izquierda"], ["arbol", "derecha"], ["radial", undefined]] as const) {
      const r = organizarAuto(e, [], { modo, ...(direccion ? { direccion } : {}) }).escena;
      expect(cx(get(r, "r")), `${modo}/${direccion}`).toBeCloseTo(cx(get(e, "r")), 6);
      expect(cy(get(r, "r")), `${modo}/${direccion}`).toBeCloseTo(cy(get(e, "r")), 6);
    }
  });

  it("es determinista: dos corridas dan exactamente lo mismo", () => {
    const e = diagramaAlAzar(100, 5);
    for (const modo of ["jerarquico", "arbol", "radial"] as const) {
      expect(organizarAuto(e, [], { modo }).escena).toEqual(organizarAuto(e, [], { modo }).escena);
    }
  });

  it("organizar lo ya organizado no cambia nada", () => {
    const e = arbol7();
    for (const modo of ["jerarquico", "arbol", "radial"] as const) {
      const una = organizarAuto(e, [], { modo }).escena;
      const dos = organizarAuto(una, [], { modo });
      expect(dos.motivo, modo).toBe("sin-cambios");
      expect(dos.escena).toBe(una);
    }
  });

  it("los conectores siguen pegados a las mismas formas y sus extremos están en los puertos", () => {
    const e = arbol7();
    const antes = lineas(e).map((l) => [l.origen?.elementoId, l.destino?.elementoId]);
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "derecha" }).escena;
    expect(lineas(r).map((l) => [l.origen?.elementoId, l.destino?.elementoId])).toEqual(antes);
    const l = lineas(r).find((x) => x.origen?.elementoId === "r" && x.destino?.elementoId === "a") as Linea;
    expect(l.origen?.puerto).toBe(1); // sale por la derecha…
    expect(l.destino?.puerto).toBe(3); // …y entra por la izquierda
  });

  it("los conectores salen por el lado del flujo y entran por el opuesto, en jerárquico y en árbol", () => {
    const casos: Array<[ModoOrganizar, DireccionOrganizar, number, number]> = [
      ["jerarquico", "abajo", 2, 0],
      ["jerarquico", "arriba", 0, 2],
      ["jerarquico", "derecha", 1, 3],
      ["jerarquico", "izquierda", 3, 1],
      ["arbol", "derecha", 1, 3],
      ["arbol", "abajo", 2, 0],
    ];
    for (const [modo, direccion, salida, entrada] of casos) {
      const r = organizarAuto(arbol7(), [], { modo, direccion }).escena;
      for (const l of lineas(r)) {
        expect([l.origen?.puerto, l.destino?.puerto], `${modo}/${direccion}`).toEqual([salida, entrada]);
        const o = get(r, l.origen?.elementoId as string);
        const d = get(r, l.destino?.elementoId as string);
        expect(o.id).not.toBe(d.id);
      }
    }
  });

  it("con muchos hijos en abanico, salen igualmente por el lado del flujo (el par más corto usaría los laterales)", () => {
    let e = escena(forma("r", 400, 300, 140, 70), ...Array.from({ length: 6 }, (_, i) => forma(`h${i}`, 60 + i * 140, 50 + ((i * 53) % 400), 100, 60)));
    for (let i = 0; i < 6; i++) e = conectarFormas(e, "r", `h${i}`);
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "abajo" }).escena;
    for (const l of lineas(r)) expect([l.origen?.puerto, l.destino?.puerto]).toEqual([2, 0]);
  });

  it("en el radial los puertos son los que mejor se miran, sin un sentido fijo", () => {
    let e = escena(forma("r", 400, 300, 140, 70), ...Array.from({ length: 8 }, (_, i) => forma(`h${i}`, 60 + i * 110, 40 + ((i * 97) % 500), 100, 60)));
    for (let i = 0; i < 8; i++) e = conectarFormas(e, "r", `h${i}`);
    const r = organizarAuto(e, [], { modo: "radial" }).escena;
    const pares = new Set(lineas(r).map((l) => `${l.origen?.puerto}-${l.destino?.puerto}`));
    expect(pares.size).toBeGreaterThan(1);
    // Cada conector usa el par que mejor se mira, el mismo que escogería quien conecta a mano.
    for (const l of lineas(r)) {
      const par = puertosParaConectar(r, l.origen?.elementoId as string, l.destino?.elementoId as string);
      expect([l.origen?.puerto, l.destino?.puerto]).toEqual([par?.origen.puerto, par?.destino.puerto]);
    }
  });

  it("de arriba abajo, dos formas alineadas se unen por el puerto de abajo y el de arriba", () => {
    const e = conectarFormas(escena(forma("a", 100, 100), forma("b", 600, 500)), "a", "b");
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "abajo" }).escena;
    const l = lineas(r)[0] as Linea;
    expect(l.origen?.puerto).toBe(2);
    expect(l.destino?.puerto).toBe(0);
  });
});

describe("organizarAuto: alcance", () => {
  it("con 2 o más formas elegidas solo se mueven ellas", () => {
    const e = arbol7();
    const r = organizarAuto(e, ["a", "c", "d"], { modo: "jerarquico", direccion: "abajo" }).escena;
    for (const id of ["r", "b", "x", "y"]) expect(get(r, id).transformacion, id).toEqual(get(e, id).transformacion);
    expect(get(r, "c").transformacion).not.toEqual(get(e, "c").transformacion);
  });

  it("las bloqueadas y las ocultas no se mueven", () => {
    let e = escena(forma("a", 0, 0), forma("b", 300, 200), forma("fija", 100, 300, 100, 60, { bloqueado: true }), forma("oculta", 500, 400, 100, 60, { oculto: true }));
    e = conectarFormas(e, "a", "b");
    const r = organizarAuto(e, [], { modo: "arbol" }).escena;
    expect(get(r, "fija").transformacion).toEqual(get(e, "fija").transformacion);
    expect(get(r, "oculta").transformacion).toEqual(get(e, "oculta").transformacion);
  });

  it("un grupo se mueve entero", () => {
    let e = escena(forma("a", 0, 0), forma("x", 600, 300), forma("y", 800, 380), { id: "g", tipo: "grupo", hijos: ["x", "y"] }, forma("z", 100, 700));
    e = conectarFormas(conectarFormas(e, "a", "x"), "y", "z");
    const dx = get(e, "y").transformacion.x - get(e, "x").transformacion.x;
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "derecha" }).escena;
    expect(get(r, "y").transformacion.x - get(r, "x").transformacion.x).toBeCloseTo(dx, 6);
  });

  it("las formas sin ninguna conexión van aparte, debajo de lo organizado", () => {
    let e = escena(forma("a", 100, 100), forma("b", 500, 400), forma("s1", 10, 10), forma("s2", 900, 30));
    e = conectarFormas(e, "a", "b");
    const r = organizarAuto(e, [], { modo: "arbol" }).escena;
    const fondo = Math.max(cy(get(r, "a")) + 30, cy(get(r, "b")) + 30);
    expect(get(r, "s1").transformacion.y).toBeGreaterThanOrEqual(fondo);
    expect(get(r, "s2").transformacion.y).toBeGreaterThanOrEqual(fondo);
  });

  it("los textos y las líneas sueltas no se tocan", () => {
    let e = escena(forma("a", 0, 0), forma("b", 400, 300), { id: "t", tipo: "texto", texto: "Nota", transformacion: { x: 700, y: 50, ancho: 80, alto: 30, rotacion: 0 } }, linea("l", [[0, 500], [200, 500]]));
    e = conectarFormas(e, "a", "b");
    const r = organizarAuto(e, [], { modo: "radial" }).escena;
    expect(r.elementos.find((x) => x.id === "t")).toEqual(e.elementos.find((x) => x.id === "t"));
    expect((r.elementos.find((x) => x.id === "l") as Linea).puntos).toEqual((e.elementos.find((x) => x.id === "l") as Linea).puntos);
  });
});

describe("organizarAuto: límites", () => {
  it("menos de 2 formas: `pocas` y la misma escena", () => {
    const e = escena(forma("a", 0, 0));
    expect(organizarAuto(e, [], { modo: "arbol" })).toEqual({ escena: e, motivo: "pocas" });
    const dos = arbol7();
    expect(organizarAuto(dos, ["a"], { modo: "arbol" }).motivo).toBe("pocas");
  });

  it("más de 500 formas: `demasiadas` y no se calcula; con 500, sí", () => {
    const f = (n: number) => escena(...Array.from({ length: n }, (_, i) => forma(`f${i}`, (i % 40) * 20, Math.floor(i / 40) * 20, 10, 10)));
    const grande = f(501);
    const r = organizarAuto(grande, [], { modo: "jerarquico" });
    expect(r.motivo).toBe("demasiadas");
    expect(r.escena).toBe(grande);
    expect(organizarAuto(f(500), [], { modo: "radial" }).motivo).toBeUndefined();
  });

  it("DW9: con 500 formas conectadas cada modo tarda menos de un segundo", () => {
    const e = diagramaAlAzar(500, 77);
    for (const modo of ["jerarquico", "arbol", "radial"] as const) {
      // La mejor de tres pasadas: con la máquina ocupada (la carpeta entera de pruebas corre en paralelo) una sola medida se tuerce, y la
      // primera además paga el calentamiento. El tiempo real es de 100 a 300 ms (era de 250 a 450 antes de agrupar los movimientos).
      const tiempos = [0, 1, 2].map(() => {
        const t = performance.now();
        organizarAuto(e, [], { modo });
        return performance.now() - t;
      });
      expect(Math.min(...tiempos), modo).toBeLessThan(1000);
    }
  });

  it("el resultado pasa por el normalizador: nada se sale de los límites del modelo", () => {
    const r = organizarAuto(diagramaAlAzar(100, 3), [], { modo: "radial" }).escena;
    expect(normalizarEscena(r).elementos).toHaveLength(r.elementos.length);
  });
});

describe("formasAOrganizar", () => {
  it("cuenta las formas elegidas (con sus grupos abiertos) o, sin elección, todas", () => {
    const e = escena(forma("a", 0, 0), forma("b", 200, 0), forma("c", 400, 0), { id: "g", tipo: "grupo", hijos: ["b", "c"] }, linea("l", [[0, 100], [10, 100]]));
    expect(formasAOrganizar(e, [])).toBe(3);
    expect(formasAOrganizar(e, ["a"])).toBe(1);
    expect(formasAOrganizar(e, ["g"])).toBe(2);
    expect(formasAOrganizar(e, ["a", "g"])).toBe(3);
    expect(formasAOrganizar(e, ["l"])).toBe(0);
  });
});

// ─── Y37a: orden de lectura, tema centrado y niveles alineados ───────────────────────────────────────────────────────────────────────────

describe("organizarAuto: árbol y jerárquico en orden de lectura (Y37a)", () => {
  /** r con tres hijos a, b, c: conectados en ese orden pero colocados (de izquierda a derecha / de arriba abajo) como b, c, a. */
  const fuera = (): Escena => {
    let e = escena(forma("r", 400, 0, 100, 60), forma("a", 700, 300, 180, 60), forma("b", 100, 300, 60, 60), forma("c", 400, 300, 140, 60));
    for (const h of ["a", "b", "c"]) e = conectarFormas(e, "r", h);
    return e;
  };
  const fueraV = (): Escena => {
    let e = escena(forma("r", 0, 400, 100, 60), forma("a", 400, 700, 180, 60), forma("b", 400, 100, 60, 60), forma("c", 400, 400, 140, 60));
    for (const h of ["a", "b", "c"]) e = conectarFormas(e, "r", h);
    return e;
  };

  it("los hermanos conservan el orden que ya tenían en el lienzo, no el de los conectores (flujo vertical: de izquierda a derecha)", () => {
    for (const modo of ["jerarquico", "arbol"] as const) {
      const r = organizarAuto(fuera(), [], { modo, direccion: "abajo" }).escena;
      expect(cx(get(r, "b")), modo).toBeLessThan(cx(get(r, "c")));
      expect(cx(get(r, "c")), modo).toBeLessThan(cx(get(r, "a")));
    }
  });

  it("flujo horizontal: de arriba abajo", () => {
    for (const modo of ["jerarquico", "arbol"] as const) {
      const r = organizarAuto(fueraV(), [], { modo, direccion: "derecha" }).escena;
      expect(cy(get(r, "b")), modo).toBeLessThan(cy(get(r, "c")));
      expect(cy(get(r, "c")), modo).toBeLessThan(cy(get(r, "a")));
    }
  });

  it("un empate se resuelve con el orden de los conectores", () => {
    let e = escena(forma("r", 0, 0), forma("a", 300, 200, 100, 60), forma("b", 300, 200, 100, 60), forma("c", 300, 200, 100, 60));
    for (const h of ["c", "a", "b"]) e = conectarFormas(e, "r", h);
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "abajo" }).escena;
    expect(cx(get(r, "c"))).toBeLessThan(cx(get(r, "a")));
    expect(cx(get(r, "a"))).toBeLessThan(cx(get(r, "b")));
  });

  it("arriba e izquierda no espejan el orden entre hermanos: solo el sentido del flujo", () => {
    const arriba = organizarAuto(fuera(), [], { modo: "jerarquico", direccion: "arriba" }).escena;
    expect(cy(get(arriba, "a"))).toBeLessThan(cy(get(arriba, "r")));
    expect(cx(get(arriba, "b"))).toBeLessThan(cx(get(arriba, "c")));
    expect(cx(get(arriba, "c"))).toBeLessThan(cx(get(arriba, "a")));
    const izquierda = organizarAuto(fueraV(), [], { modo: "jerarquico", direccion: "izquierda" }).escena;
    expect(cx(get(izquierda, "a"))).toBeLessThan(cx(get(izquierda, "r")));
    expect(cy(get(izquierda, "b"))).toBeLessThan(cy(get(izquierda, "c")));
    expect(cy(get(izquierda, "c"))).toBeLessThan(cy(get(izquierda, "a")));
  });

  it("el padre queda centrado sobre sus hijos en las cuatro direcciones y en árbol (± medio píxel)", () => {
    const combos: Array<[ModoOrganizar, DireccionOrganizar]> = [["jerarquico", "abajo"], ["jerarquico", "arriba"], ["jerarquico", "derecha"], ["jerarquico", "izquierda"], ["arbol", "derecha"], ["arbol", "abajo"]];
    for (const [modo, direccion] of combos) {
      const r = organizarAuto(arbol7(), [], { modo, direccion }).escena;
      const vertical = direccion === "abajo" || direccion === "arriba";
      const c = (f: Forma): number => (vertical ? cx(f) : cy(f));
      for (const [p, h1, h2] of [["r", "a", "b"], ["a", "c", "d"], ["b", "x", "y"]] as const) {
        expect(c(get(r, p)), `${modo}/${direccion}: ${p}`).toBeCloseTo((c(get(r, h1)) + c(get(r, h2))) / 2, 0);
      }
    }
  });

  it("los niveles quedan alineados por su borde de entrada aunque las cajas midan distinto", () => {
    let e = escena(forma("r", 0, 0, 100, 60), forma("a", 0, 0, 200, 40), forma("b", 0, 0, 90, 80), forma("c", 0, 0, 160, 50), forma("d", 0, 0, 70, 70));
    for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "c"], ["b", "d"]] as const) e = conectarFormas(e, p, h);
    const izq = (r: Escena, id: string): number => get(r, id).transformacion.x;
    const der = (r: Escena, id: string): number => get(r, id).transformacion.x + get(r, id).transformacion.ancho;
    const sup = (r: Escena, id: string): number => get(r, id).transformacion.y;
    for (const modo of ["jerarquico", "arbol"] as const) {
      const d = organizarAuto(e, [], { modo, direccion: "derecha" }).escena;
      expect(izq(d, "a"), `${modo} derecha nivel 1`).toBeCloseTo(izq(d, "b"), 6);
      expect(izq(d, "c"), `${modo} derecha nivel 2`).toBeCloseTo(izq(d, "d"), 6);
      const b = organizarAuto(e, [], { modo, direccion: "abajo" }).escena;
      expect(sup(b, "a"), `${modo} abajo nivel 1`).toBeCloseTo(sup(b, "b"), 6);
      expect(sup(b, "c"), `${modo} abajo nivel 2`).toBeCloseTo(sup(b, "d"), 6);
    }
    const i = organizarAuto(e, [], { modo: "jerarquico", direccion: "izquierda" }).escena;
    expect(der(i, "a")).toBeCloseTo(der(i, "b"), 6);
    expect(der(i, "c")).toBeCloseTo(der(i, "d"), 6);
  });

  /** Posiciones relativas de todas las formas respecto de la primera: no cambian con un traslado. */
  const relativas = (e: Escena): Array<[number, number]> => {
    const fs = formas(e);
    const o = fs[0] as Forma;
    return fs.map((f) => [f.transformacion.x - o.transformacion.x, f.transformacion.y - o.transformacion.y]);
  };
  const dagreRelativo = (e: Escena, direccion: DireccionOrganizar): Array<[number, number]> => {
    const fs = formas(e);
    const nodos = fs.map((f) => ({ id: f.id, x: f.transformacion.x, y: f.transformacion.y, ancho: f.transformacion.ancho, alto: f.transformacion.alto }));
    const aristas = lineas(e).filter((l) => l.origen && l.destino).map((l) => ({ desde: l.origen!.elementoId, hasta: l.destino!.elementoId }));
    const p = posicionesDagre(nodos, aristas, direccion);
    const o = p.get((fs[0] as Forma).id) as { x: number; y: number };
    return fs.map((f) => [(p.get(f.id) as { x: number }).x - o.x, (p.get(f.id) as { y: number }).y - o.y]);
  };

  it("un nodo con dos padres (una unión) sigue con dagre", () => {
    let e = escena(forma("r", 0, 0), forma("a", 100, 200), forma("b", 300, 200), forma("d", 200, 400));
    for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "d"], ["b", "d"]] as const) e = conectarFormas(e, p, h);
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "abajo" }).escena;
    const esperado = dagreRelativo(e, "abajo");
    const real = relativas(r);
    real.forEach(([x, y], i) => {
      expect(x).toBeCloseTo((esperado[i] as [number, number])[0], 6);
      expect(y).toBeCloseTo((esperado[i] as [number, number])[1], 6);
    });
  });

  it("un ciclo sigue con dagre", () => {
    let e = escena(forma("a", 0, 0), forma("b", 300, 0), forma("c", 600, 0));
    for (const [p, h] of [["a", "b"], ["b", "c"], ["c", "a"]] as const) e = conectarFormas(e, p, h);
    const r = organizarAuto(e, [], { modo: "jerarquico", direccion: "derecha" }).escena;
    const esperado = dagreRelativo(e, "derecha");
    relativas(r).forEach(([x, y], i) => {
      expect(x).toBeCloseTo((esperado[i] as [number, number])[0], 6);
      expect(y).toBeCloseTo((esperado[i] as [number, number])[1], 6);
    });
  });

  it("el árbol con una unión usa el motor de árbol como siempre (no dagre)", () => {
    let e = escena(forma("r", 0, 0), forma("a", 100, 200), forma("b", 300, 200), forma("d", 200, 400));
    for (const [p, h] of [["r", "a"], ["r", "b"], ["a", "d"], ["b", "d"]] as const) e = conectarFormas(e, p, h);
    const r = organizarAuto(e, [], { modo: "arbol", direccion: "abajo" }).escena;
    expect(pisadas(r)).toEqual([]);
    expect(cy(get(r, "r"))).toBeLessThan(cy(get(r, "a")));
  });

  it("organizar dos veces seguidas no cambia nada, con el orden de lectura y la alineación", () => {
    const combos: Array<[ModoOrganizar, DireccionOrganizar]> = [["jerarquico", "abajo"], ["jerarquico", "izquierda"], ["arbol", "derecha"], ["arbol", "abajo"]];
    for (const [modo, direccion] of combos) {
      const una = organizarAuto(fuera(), [], { modo, direccion }).escena;
      const dos = organizarAuto(una, [], { modo, direccion });
      expect(dos.motivo, `${modo}/${direccion}`).toBe("sin-cambios");
    }
  });

  it("DW9: un bosque de 500 formas por el jerárquico tarda menos de un segundo", () => {
    const e = diagramaAlAzar(500, 5);
    const mejor = (): number => {
      let m = Infinity;
      for (let i = 0; i < 3; i++) {
        const t = performance.now();
        organizarAuto(e, [], { modo: "jerarquico", direccion: "abajo" });
        m = Math.min(m, performance.now() - t);
      }
      return m;
    };
    expect(mejor()).toBeLessThan(1000);
  });

  it("ninguna forma pisa a otra en el jerárquico de un bosque (barrido 20/100/500, cuatro direcciones)", () => {
    for (const n of [20, 100, 500]) {
      const e = diagramaAlAzar(n, n + 3);
      for (const direccion of ["abajo", "arriba", "derecha", "izquierda"] as const) {
        expect(pisadas(organizarAuto(e, [], { modo: "jerarquico", direccion }).escena), `${n}/${direccion}`).toEqual([]);
      }
    }
  });
});
