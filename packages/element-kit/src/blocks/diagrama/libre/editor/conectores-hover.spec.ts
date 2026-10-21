import { describe, expect, it } from "vitest";
import { RADIO_PUERTO_PX, RADIO_PUERTO_TACTIL_PX, formaConPuertosVisibles, formaDestinoDeArrastre, radioDePuertoPx, resolverPuntoDeLinea } from "./conectores.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

// Rectángulos de 100×60. Puertos: arriba (cx, y), derecha (x+100, cy), abajo (cx, y+60), izquierda (x, cy).
//  A en (100,100): derecha (200,130)
const base = () => escena(forma("A", 100, 100), forma("B", 400, 100));

describe("radioDePuertoPx", () => {
  it("con el dedo es de 24 px; con ratón, lápiz o sin dato, 14 px", () => {
    expect(RADIO_PUERTO_TACTIL_PX).toBeGreaterThanOrEqual(24);
    expect(radioDePuertoPx("touch")).toBe(RADIO_PUERTO_TACTIL_PX);
    expect(radioDePuertoPx("mouse")).toBe(RADIO_PUERTO_PX);
    expect(radioDePuertoPx("pen")).toBe(RADIO_PUERTO_PX);
    expect(radioDePuertoPx(undefined)).toBe(RADIO_PUERTO_PX);
  });

  it("un puerto a 20 px lo capta el dedo y no el ratón, al dibujar una línea", () => {
    const e = base();
    const cerca = { x: 220, y: 130 }; // a 20 de (200,130)
    const conRaton = resolverPuntoDeLinea(e, cerca, cerca, { zoom: 1, sinImanDePuertos: false, radioPx: radioDePuertoPx("mouse") });
    const conDedo = resolverPuntoDeLinea(e, cerca, cerca, { zoom: 1, sinImanDePuertos: false, radioPx: radioDePuertoPx("touch") });
    expect(conRaton.puerto).toBeNull();
    expect(conDedo.puerto).toMatchObject({ elementoId: "A", puerto: 1 });
    expect(conDedo.punto).toEqual({ x: 200, y: 130 });
  });
});

describe("formaConPuertosVisibles", () => {
  it("con el cursor sobre una forma devuelve esa forma; en el vacío, nada", () => {
    const e = base();
    expect(formaConPuertosVisibles(e, { x: 150, y: 130 }, 1, null)).toBe("A");
    expect(formaConPuertosVisibles(e, { x: 450, y: 130 }, 1, null)).toBe("B");
    expect(formaConPuertosVisibles(e, { x: 300, y: 400 }, 1, null)).toBeNull();
  });

  it("de varias formas apiladas, la de más arriba", () => {
    const e = escena(forma("abajo", 100, 100), forma("arriba", 120, 110));
    expect(formaConPuertosVisibles(e, { x: 150, y: 130 }, 1, null)).toBe("arriba");
  });

  it("una línea o un texto encima de la forma la tapan: no se muestran sus puertos", () => {
    const e = escena(forma("A", 100, 100), linea("L", [[100, 130], [200, 130]]));
    expect(formaConPuertosVisibles(e, { x: 150, y: 130 }, 1, null)).toBeNull();
  });

  it("sin parpadeo: al ir hacia un puerto del borde y salir de la forma, los puertos se conservan hasta 14 px de él", () => {
    const e = base();
    // La derecha de A está en (200,130). Más allá del borde ya no es «sobre la forma».
    expect(formaConPuertosVisibles(e, { x: 215, y: 130 }, 1, null)).toBeNull();
    expect(formaConPuertosVisibles(e, { x: 210, y: 130 }, 1, "A")).toBe("A"); // a 10 del puerto
    expect(formaConPuertosVisibles(e, { x: 214, y: 130 }, 1, "A")).toBe("A"); // justo en el radio
    expect(formaConPuertosVisibles(e, { x: 216, y: 130 }, 1, "A")).toBeNull(); // pasado el radio, se apagan
  });

  it("el radio de conservación son píxeles de pantalla: con zoom 2 son 7 unidades de escena", () => {
    const e = base();
    expect(formaConPuertosVisibles(e, { x: 206, y: 130 }, 2, "A")).toBe("A");
    expect(formaConPuertosVisibles(e, { x: 210, y: 130 }, 2, "A")).toBeNull();
    // Con el dedo, 24 px: a zoom 1 son 24 unidades.
    expect(formaConPuertosVisibles(e, { x: 222, y: 130 }, 1, "A", RADIO_PUERTO_TACTIL_PX)).toBe("A");
  });

  it("si se pasa a otra forma, gana la nueva (la anterior solo se conserva cerca de sus puertos)", () => {
    const e = base();
    expect(formaConPuertosVisibles(e, { x: 450, y: 130 }, 1, "A")).toBe("B");
  });

  it("una forma bloqueada u oculta no muestra puertos, ni siquiera conservándolos", () => {
    const bloqueada = escena(forma("A", 100, 100, 100, 60, { bloqueado: true }));
    expect(formaConPuertosVisibles(bloqueada, { x: 150, y: 130 }, 1, null)).toBeNull();
    expect(formaConPuertosVisibles(bloqueada, { x: 210, y: 130 }, 1, "A")).toBeNull();
    const oculta = escena(forma("A", 100, 100, 100, 60, { oculto: true }));
    expect(formaConPuertosVisibles(oculta, { x: 150, y: 130 }, 1, null)).toBeNull();
    expect(formaConPuertosVisibles(oculta, { x: 210, y: 130 }, 1, "A")).toBeNull();
  });

  it("una forma que se borró deja de conservarse", () => {
    expect(formaConPuertosVisibles(escena(forma("B", 400, 100)), { x: 210, y: 130 }, 1, "A")).toBeNull();
  });

  it("sigue el contorno de una forma girada, no su caja sin girar", () => {
    // 100×100 en (100,100) girada 45°: un rombo con el vértice de arriba en (150, 79.3).
    const e = escena(forma("R", 100, 100, 100, 100, { transformacion: { x: 100, y: 100, ancho: 100, alto: 100, rotacion: 45 } }));
    expect(formaConPuertosVisibles(e, { x: 150, y: 88 }, 1, null)).toBe("R"); // dentro del rombo, fuera de la caja sin girar
    expect(formaConPuertosVisibles(e, { x: 101, y: 101 }, 1, null)).toBeNull(); // dentro de la caja sin girar, fuera del rombo
  });

  it("una forma dentro de un grupo también muestra sus puertos", () => {
    const e = escena(forma("a", 100, 100), forma("b", 300, 100), grupo("g", ["a", "b"]));
    expect(formaConPuertosVisibles(e, { x: 150, y: 130 }, 1, null)).toBe("a");
  });
});

describe("formaDestinoDeArrastre", () => {
  it("la forma de debajo del puntero, sin contar la que se arrastra", () => {
    const e = escena(forma("B", 100, 100), forma("A", 120, 110)); // A encima de B
    expect(formaDestinoDeArrastre(e, { x: 150, y: 130 }, 1, ["A"])).toBe("B");
    expect(formaDestinoDeArrastre(e, { x: 150, y: 130 }, 1, [])).toBe("A");
  });

  it("sobre una forma que no es la que se arrastra, esa; en el vacío, nada", () => {
    const e = base();
    expect(formaDestinoDeArrastre(e, { x: 450, y: 130 }, 1, ["A"])).toBe("B");
    expect(formaDestinoDeArrastre(e, { x: 450, y: 130 }, 1, ["B"])).toBeNull();
    expect(formaDestinoDeArrastre(e, { x: 300, y: 400 }, 1, ["A"])).toBeNull();
  });

  it("si se arrastra un grupo, ni el grupo ni sus hijos cuentan", () => {
    const e = escena(forma("a", 100, 100), forma("b", 130, 110), grupo("g", ["a", "b"]), forma("fondo", 90, 90, 300, 200));
    // Debajo de las dos hay un fondo grande: sin el grupo, es lo que queda.
    expect(formaDestinoDeArrastre(e, { x: 150, y: 130 }, 1, ["g"])).toBe("fondo");
  });

  it("no cuenta lo bloqueado, lo oculto ni las líneas", () => {
    const e = escena(forma("A", 100, 100), forma("fija", 400, 100, 100, 60, { bloqueado: true }), forma("oculta", 400, 300, 100, 60, { oculto: true }), linea("L", [[600, 100], [700, 100]]));
    expect(formaDestinoDeArrastre(e, { x: 450, y: 130 }, 1, ["A"])).toBeNull();
    expect(formaDestinoDeArrastre(e, { x: 450, y: 330 }, 1, ["A"])).toBeNull();
    expect(formaDestinoDeArrastre(e, { x: 650, y: 100 }, 1, ["A"])).toBeNull();
  });

  it("no modifica la escena que recibe", () => {
    const e = escena(forma("a", 100, 100), forma("b", 300, 100), grupo("g", ["a", "b"]));
    const antes = JSON.stringify(e);
    formaDestinoDeArrastre(e, { x: 150, y: 130 }, 1, ["g"]);
    expect(JSON.stringify(e)).toBe(antes);
  });
});
