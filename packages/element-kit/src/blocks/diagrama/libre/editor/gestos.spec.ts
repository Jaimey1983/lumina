import { describe, expect, it } from "vitest";
import { cajaDeSeleccion, Historial } from "@lumina/drawing";
import { avanzarGesto, iniciarMover, iniciarRecuadro, iniciarRedimensionar, iniciarRotar, seleccionAlHacerClic, type Modificadores, type OpcionesGesto } from "./gestos.js";
import { escena, forma, getForma, getLinea, grupo, linea } from "./util-pruebas.js";

const sin: Modificadores = { shift: false, alt: false, ctrl: false };
const libre: OpcionesGesto = { guias: false, zoom: 1 };

describe("mover", () => {
  const base = escena(forma("a", 100, 100, 100, 50), forma("b", 400, 100, 100, 50));

  it("el desplazamiento es la diferencia entre el punto actual y el de partida", () => {
    const g = iniciarMover(base, ["a"], { x: 150, y: 125 });
    const r = avanzarGesto(g!, { x: 190, y: 135 }, sin, libre);
    expect(getForma(r.escena, "a").transformacion).toMatchObject({ x: 140, y: 110 });
    expect(r.guias).toEqual([]);
  });

  it("siempre parte de la escena inicial: cien fotogramas no acumulan error", () => {
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    let r = avanzarGesto(g, { x: 0, y: 0 }, sin, libre);
    for (let i = 1; i <= 100; i++) r = avanzarGesto(g, { x: i * 0.37, y: i * 0.11 }, sin, libre);
    expect(getForma(r.escena, "a").transformacion.x).toBeCloseTo(100 + 37, 9);
    expect(getForma(r.escena, "a").transformacion.y).toBeCloseTo(100 + 11, 9);
    expect(g.base).toBe(base);
  });

  it("Mayús fija el eje en el que más se movió", () => {
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    const h = avanzarGesto(g, { x: 80, y: 20 }, { ...sin, shift: true }, libre);
    expect(getForma(h.escena, "a").transformacion).toMatchObject({ x: 180, y: 100 });
    const v = avanzarGesto(g, { x: 10, y: -90 }, { ...sin, shift: true }, libre);
    expect(getForma(v.escena, "a").transformacion).toMatchObject({ x: 100, y: 10 });
  });

  it("mueve a toda la selección junta, también a los hijos de un grupo", () => {
    const e = escena(forma("a", 0, 0), forma("b", 300, 0), forma("c", 0, 300), grupo("g", ["a", "b"]));
    const g = iniciarMover(e, ["g", "c"], { x: 0, y: 0 })!;
    const r = avanzarGesto(g, { x: 10, y: 20 }, sin, libre);
    for (const id of ["a", "b", "c"]) expect(getForma(r.escena, id).transformacion.x).toBe(getForma(e, id).transformacion.x + 10);
  });

  it("no inicia el gesto si todo lo seleccionado está bloqueado", () => {
    const e = escena(forma("a", 0, 0, 10, 10, { bloqueado: true }));
    expect(iniciarMover(e, ["a"], { x: 0, y: 0 })).toBeNull();
    expect(iniciarMover(e, [], { x: 0, y: 0 })).toBeNull();
  });

  it("de una selección con algo bloqueado solo se mueve lo demás", () => {
    const e = escena(forma("a", 0, 0, 10, 10, { bloqueado: true }), forma("b", 100, 0));
    const r = avanzarGesto(iniciarMover(e, ["a", "b"], { x: 0, y: 0 })!, { x: 5, y: 5 }, sin, libre);
    expect(getForma(r.escena, "a")).toBe(getForma(e, "a"));
    expect(getForma(r.escena, "b").transformacion.x).toBe(105);
  });

  it("se imanta al borde de otro elemento y devuelve la guía", () => {
    // `a` en x=100; arrastrar 297 → su borde izquierdo queda en x=397, a 3 del borde izquierdo de `b` (400).
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    const r = avanzarGesto(g, { x: 297, y: 0 }, sin, { guias: true, zoom: 1 });
    expect(getForma(r.escena, "a").transformacion.x).toBe(400);
    expect(r.guias.some((x) => x.orientacion === "vertical" && x.posicion === 400)).toBe(true);
  });

  it("Ctrl suspende el ajuste", () => {
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    const r = avanzarGesto(g, { x: 297, y: 0 }, { ...sin, ctrl: true }, { guias: true, zoom: 1 });
    expect(getForma(r.escena, "a").transformacion.x).toBe(397);
    expect(r.guias).toEqual([]);
  });

  it("encaja a la cuadrícula", () => {
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    const r = avanzarGesto(g, { x: 13, y: 7 }, sin, { guias: false, cuadricula: 20, zoom: 1 });
    expect(getForma(r.escena, "a").transformacion).toMatchObject({ x: 120, y: 100 });
  });

  it("el umbral del imán se mide en pantalla: con zoom 4 solo alcanza a 1,5 unidades", () => {
    const g = iniciarMover(base, ["a"], { x: 0, y: 0 })!;
    expect(getForma(avanzarGesto(g, { x: 297, y: 0 }, sin, { guias: true, zoom: 4 }).escena, "a").transformacion.x).toBe(397);
    expect(getForma(avanzarGesto(g, { x: 299, y: 0 }, sin, { guias: true, zoom: 4 }).escena, "a").transformacion.x).toBe(400);
  });
});

describe("redimensionar", () => {
  const base = escena(forma("a", 100, 100, 200, 100));

  it("arrastrar el asa este agranda el ancho", () => {
    const g = iniciarRedimensionar(base, ["a"], "e", { x: 300, y: 150 })!;
    const r = avanzarGesto(g, { x: 350, y: 999 }, sin, libre);
    expect(getForma(r.escena, "a").transformacion).toMatchObject({ x: 100, y: 100, ancho: 250, alto: 100 });
  });

  it("Mayús conserva la proporción y Alt crece desde el centro", () => {
    const g = iniciarRedimensionar(base, ["a"], "se", { x: 300, y: 200 })!;
    const p = getForma(avanzarGesto(g, { x: 400, y: 200 }, { ...sin, shift: true }, libre).escena, "a").transformacion;
    expect(p.ancho / p.alto).toBeCloseTo(2, 6);
    const c = getForma(avanzarGesto(g, { x: 320, y: 215 }, { ...sin, alt: true }, libre).escena, "a").transformacion;
    expect(c.x + c.ancho / 2).toBeCloseTo(200, 6);
    expect(c.y + c.alto / 2).toBeCloseTo(150, 6);
  });

  it("se imanta el borde que se arrastra (no el opuesto)", () => {
    const e = escena(forma("a", 100, 100, 200, 100), forma("ref", 500, 400, 50, 50));
    const g = iniciarRedimensionar(e, ["a"], "e", { x: 300, y: 150 })!;
    const r = avanzarGesto(g, { x: 497, y: 150 }, sin, { guias: true, zoom: 1 });
    const t = getForma(r.escena, "a").transformacion;
    expect(t.x).toBe(100);
    expect(t.x + t.ancho).toBe(500);
    expect(r.guias.some((x) => x.orientacion === "vertical" && x.posicion === 500)).toBe(true);
  });

  it("con el marco girado no se imanta (el borde ya no es horizontal ni vertical)", () => {
    const e = escena(forma("a", 100, 100, 200, 100, { transformacion: { x: 100, y: 100, ancho: 200, alto: 100, rotacion: 30 } }), forma("ref", 500, 400, 50, 50));
    const g = iniciarRedimensionar(e, ["a"], "e", { x: 300, y: 150 })!;
    // Sin giro, arrastrar a 497 se imantaría al borde de `ref` (x = 500); con giro no debe hacerlo.
    expect(avanzarGesto(g, { x: 497, y: 150 }, sin, { guias: true, zoom: 1 }).guias).toEqual([]);
  });

  it("varios elementos se escalan juntos", () => {
    const e = escena(forma("a", 0, 0, 100, 100), forma("b", 100, 0, 100, 100));
    const g = iniciarRedimensionar(e, ["a", "b"], "e", { x: 200, y: 50 })!;
    const r = avanzarGesto(g, { x: 400, y: 50 }, sin, libre);
    expect(cajaDeSeleccion(r.escena, ["a", "b"])).toEqual({ x: 0, y: 0, ancho: 400, alto: 100 });
  });

  it("sin nada editable no inicia", () => {
    const e = escena(forma("a", 0, 0, 10, 10, { bloqueado: true }));
    expect(iniciarRedimensionar(e, ["a"], "e", { x: 0, y: 0 })).toBeNull();
  });
});

describe("rotar", () => {
  const base = escena(forma("a", 100, 100, 200, 100)); // centro (200, 150)

  it("llevar el cursor un cuarto de vuelta gira 90°", () => {
    const g = iniciarRotar(base, ["a"], { x: 200, y: 50 })!; // arriba del centro
    const r = avanzarGesto(g, { x: 300, y: 150 }, sin, libre); // a la derecha del centro: giro horario de 90°
    expect(getForma(r.escena, "a").transformacion.rotacion).toBeCloseTo(90, 6);
  });

  it("Mayús ajusta a múltiplos de 15°", () => {
    const g = iniciarRotar(base, ["a"], { x: 200, y: 50 })!;
    const r = avanzarGesto(g, { x: 200 + 100 * Math.sin((38 * Math.PI) / 180), y: 150 - 100 * Math.cos((38 * Math.PI) / 180) }, { ...sin, shift: true }, libre);
    expect(getForma(r.escena, "a").transformacion.rotacion).toBeCloseTo(45, 6);
  });

  it("parte de la rotación que ya tenía la forma", () => {
    const e = escena(forma("a", 100, 100, 200, 100, { transformacion: { x: 100, y: 100, ancho: 200, alto: 100, rotacion: 20 } }));
    const g = iniciarRotar(e, ["a"], { x: 200, y: 50 })!;
    const r = avanzarGesto(g, { x: 300, y: 150 }, sin, libre);
    expect(getForma(r.escena, "a").transformacion.rotacion).toBeCloseTo(110, 6);
  });

  it("varios elementos giran juntos alrededor del centro del marco", () => {
    const e = escena(forma("a", 0, 0, 100, 100), forma("b", 300, 0, 100, 100));
    const g = iniciarRotar(e, ["a", "b"], { x: 200, y: -30 })!;
    const r = avanzarGesto(g, { x: 400, y: 50 }, sin, libre);
    expect(getForma(r.escena, "a").transformacion.rotacion).toBeCloseTo(90, 6);
    expect(getForma(r.escena, "b").transformacion.rotacion).toBeCloseTo(90, 6);
  });

  it("una línea sola también gira (por sus puntos)", () => {
    const e = escena(linea("l", [[0, 0], [100, 0]]));
    const g = iniciarRotar(e, ["l"], { x: 50, y: -50 })!;
    const r = avanzarGesto(g, { x: 100, y: 0 }, sin, libre);
    const p = getLinea(r.escena, "l").puntos;
    expect(p[0]?.x).toBeCloseTo(50, 6);
    expect(p[0]?.y).toBeCloseTo(-50, 6);
  });
});

describe("recuadro de selección", () => {
  const e = escena(forma("a", 100, 100, 50, 50), forma("b", 300, 100, 50, 50), forma("c", 600, 400, 50, 50));

  it("selecciona lo que queda entero dentro del rectángulo, sin importar hacia dónde se arrastre", () => {
    const g = iniciarRecuadro(e, { x: 400, y: 200 }, false, []);
    const r = avanzarGesto(g, { x: 80, y: 80 }, sin, libre);
    expect(r.seleccion).toEqual(["a", "b"]);
    expect(r.recuadro).toEqual({ x: 80, y: 80, ancho: 320, alto: 120 });
    expect(r.escena).toBe(e);
  });

  it("lo que solo toca el borde no cuenta", () => {
    const r = avanzarGesto(iniciarRecuadro(e, { x: 110, y: 90 }, false, []), { x: 400, y: 300 }, sin, libre);
    expect(r.seleccion).toEqual(["b"]);
  });

  it("en modo aditivo suma a lo que ya estaba seleccionado", () => {
    const r = avanzarGesto(iniciarRecuadro(e, { x: 80, y: 80 }, true, ["c"]), { x: 400, y: 200 }, sin, libre);
    expect(r.seleccion).toEqual(["c", "a", "b"]);
  });

  it("un recuadro vacío no selecciona nada", () => {
    expect(avanzarGesto(iniciarRecuadro(e, { x: 700, y: 10 }, false, []), { x: 900, y: 50 }, sin, libre).seleccion).toEqual([]);
  });
});

describe("seleccionAlHacerClic", () => {
  const e = escena(forma("a", 0, 0, 100, 100), forma("b", 200, 0, 100, 100), forma("c", 400, 0, 50, 50), grupo("g", ["b", "c"]));

  it("clic en un elemento lo elige solo", () => {
    expect(seleccionAlHacerClic(e, [], { x: 50, y: 50 }, false, 1)).toEqual(["a"]);
  });
  it("clic en el vacío limpia la selección; con Mayús la conserva", () => {
    expect(seleccionAlHacerClic(e, ["a"], { x: 150, y: 400 }, false, 1)).toEqual([]);
    expect(seleccionAlHacerClic(e, ["a"], { x: 150, y: 400 }, true, 1)).toEqual(["a"]);
  });
  it("clic en un elemento ya seleccionado conserva toda la selección (para poder arrastrarla)", () => {
    expect(seleccionAlHacerClic(e, ["a", "g"], { x: 50, y: 50 }, false, 1)).toEqual(["a", "g"]);
  });
  it("Mayús agrega y quita", () => {
    expect(seleccionAlHacerClic(e, ["a"], { x: 250, y: 50 }, true, 1)).toEqual(["a", "g"]);
    expect(seleccionAlHacerClic(e, ["a", "g"], { x: 250, y: 50 }, true, 1)).toEqual(["a"]);
  });
  it("un hijo de grupo elige al grupo entero", () => {
    expect(seleccionAlHacerClic(e, [], { x: 420, y: 20 }, false, 1)).toEqual(["g"]);
  });
});

describe("un gesto completo es una sola entrada de historial", () => {
  it("mover con cien fotogramas y deshacer vuelve exactamente a la escena inicial", () => {
    const base = escena(forma("a", 100, 100), forma("b", 300, 300), linea("l", [[0, 0], [50, 50]]));
    const h = new Historial();
    const g = iniciarMover(base, ["a", "l"], { x: 0, y: 0 })!;
    h.iniciarGesto(base);
    let actual = base;
    for (let i = 0; i <= 100; i++) actual = avanzarGesto(g, { x: i, y: i / 2 }, sin, libre).escena;
    expect(h.terminarGesto(actual)).toBe(true);
    expect(h.tamano).toBe(1);
    expect(h.deshacer(actual)).toEqual(base);
  });
});
