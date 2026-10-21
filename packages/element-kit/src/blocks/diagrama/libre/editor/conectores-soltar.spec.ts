import { describe, expect, it } from "vitest";
import { puntoDePuerto, type Forma, type Linea } from "@lumina/drawing";
import { RADIO_PUERTO_PX, RADIO_PUERTO_TACTIL_PX, conectarAlSoltar, existeConector, formaEnHalo, intencionDeArrastre } from "./conectores.js";
import { escena, forma, grupo, linea } from "./util-pruebas.js";

// Rectángulos de 100×60. Puertos: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
//  P (300,300): arriba (350,300)  derecha (400,330)  abajo (350,360)  izquierda (300,330)
//  H (300,450): debajo de P, arriba (350,450)
const padreEHija = (extra: Array<Record<string, unknown>> = []) => escena(forma("P", 300, 300), forma("H", 300, 450), ...extra);
const lineasDe = (e: ReturnType<typeof escena>): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === "linea");
const forma_ = (e: ReturnType<typeof escena>, id: string): Forma => e.elementos.find((x) => x.id === id) as Forma;

describe("formaEnHalo", () => {
  it("la forma con un puerto a menos de 14 px del puntero, aunque el puntero esté fuera de ella", () => {
    const e = padreEHija();
    expect(formaEnHalo(e, { x: 350, y: 372 }, 1, ["H"])).toBe("P"); // a 12 del puerto de abajo, ya fuera de P
    expect(formaEnHalo(e, { x: 350, y: 375 }, 1, ["H"])).toBeNull(); // a 15
    expect(formaEnHalo(e, { x: 350, y: 330 }, 1, ["H"])).toBeNull(); // en el centro de la forma
  });
  it("no cuenta lo que se arrastra: sus propios puertos no arman nada", () => {
    const e = padreEHija();
    expect(formaEnHalo(e, { x: 350, y: 450 }, 1, ["H"])).toBeNull(); // sobre el puerto de arriba de H, que se arrastra
    expect(formaEnHalo(e, { x: 350, y: 450 }, 1, [])).toBe("H");
  });
  it("el radio son píxeles de pantalla: con zoom 2 son 7 unidades; con el dedo, 24", () => {
    const e = padreEHija();
    expect(formaEnHalo(e, { x: 350, y: 366 }, 2, ["H"])).toBe("P");
    expect(formaEnHalo(e, { x: 350, y: 370 }, 2, ["H"])).toBeNull();
    expect(formaEnHalo(e, { x: 350, y: 380 }, 1, ["H"], RADIO_PUERTO_TACTIL_PX)).toBe("P");
    expect(formaEnHalo(e, { x: 350, y: 380 }, 1, ["H"], RADIO_PUERTO_PX)).toBeNull();
  });
  it("no cuenta formas bloqueadas ni ocultas", () => {
    expect(formaEnHalo(escena(forma("P", 300, 300, 100, 60, { bloqueado: true }), forma("H", 300, 450)), { x: 350, y: 364 }, 1, ["H"])).toBeNull();
    expect(formaEnHalo(escena(forma("P", 300, 300, 100, 60, { oculto: true }), forma("H", 300, 450)), { x: 350, y: 364 }, 1, ["H"])).toBeNull();
  });
  it("entre dos puertos a la misma distancia, la forma de más arriba", () => {
    const e = escena(forma("abajo", 300, 300), forma("arriba", 300, 300), forma("H", 300, 450));
    expect(formaEnHalo(e, { x: 350, y: 364 }, 1, ["H"])).toBe("arriba");
  });
});

describe("existeConector", () => {
  it("solo cuenta el mismo sentido: del padre a la hija", () => {
    const e = padreEHija([linea("L", [[0, 0], [10, 10]], { origen: { elementoId: "P", puerto: 2 }, destino: { elementoId: "H", puerto: 0 } })]);
    expect(existeConector(e, "P", "H")).toBe(true);
    expect(existeConector(e, "H", "P")).toBe(false);
    expect(existeConector(padreEHija(), "P", "H")).toBe(false);
  });
});

describe("intencionDeArrastre", () => {
  const sobreAbajo = { x: 350, y: 364 }; // en el halo del puerto de abajo de P
  const sobreCentro = { x: 350, y: 330 }; // dentro de P, lejos de sus puertos

  it("sobre el halo de un puerto: conecta, y la vista previa va del puerto de P al de H", () => {
    const e = padreEHija();
    const i = intencionDeArrastre(e, sobreAbajo, 1, ["H"], "H", false);
    expect(i.destino).toBe("P");
    expect(i.conecta).toBe(true);
    expect(i.previa).toEqual({ desde: puntoDePuerto(forma_(e, "P"), 2), hasta: puntoDePuerto(forma_(e, "H"), 0) });
  });

  it("sobre la forma pero lejos de sus puertos: solo se resalta, no conecta", () => {
    const i = intencionDeArrastre(padreEHija(), sobreCentro, 1, ["H"], "H", false);
    expect(i).toEqual({ destino: "P", conecta: false, previa: null });
  });

  it("el halo funciona con el puntero un poco FUERA de la forma (los puertos están en el borde)", () => {
    const i = intencionDeArrastre(padreEHija(), { x: 350, y: 372 }, 1, ["H"], "H", false);
    expect(i.destino).toBe("P");
    expect(i.conecta).toBe(true);
  });

  it("un conector que pasa por el halo no lo tapa: se puede colgar otra hija del mismo puerto", () => {
    const e = escena(forma("P", 300, 300), forma("H1", 300, 450), forma("H2", 600, 450), linea("L", [[350, 360], [350, 450]], { origen: { elementoId: "P", puerto: 2 }, destino: { elementoId: "H1", puerto: 0 } }));
    const i = intencionDeArrastre(e, { x: 350, y: 372 }, 1, ["H2"], "H2", false);
    expect(i.destino).toBe("P");
    expect(i.conecta).toBe(true);
    // Y con Alt, soltando dentro de la forma con el conector por encima.
    expect(intencionDeArrastre(e, { x: 350, y: 335 }, 1, ["H2"], "H2", true).conecta).toBe(true);
  });

  it("con Alt conecta aunque el puntero esté lejos de los puertos", () => {
    const i = intencionDeArrastre(padreEHija(), sobreCentro, 1, ["H"], "H", true);
    expect(i.conecta).toBe(true);
    expect(i.previa).not.toBeNull();
  });

  it("con Alt pero sin forma debajo no hay destino ni conexión", () => {
    const i = intencionDeArrastre(padreEHija(), { x: 800, y: 500 }, 1, ["H"], "H", true);
    expect(i).toEqual({ destino: null, conecta: false, previa: null });
  });

  it("sin forma agarrada, o una que no se está arrastrando, no conecta", () => {
    const e = padreEHija([forma("X", 600, 450)]);
    expect(intencionDeArrastre(e, sobreAbajo, 1, ["H"], undefined, false).conecta).toBe(false);
    expect(intencionDeArrastre(e, sobreAbajo, 1, ["H"], "X", false).conecta).toBe(false);
    expect(intencionDeArrastre(e, sobreAbajo, 1, ["H"], "zzz", false).conecta).toBe(false);
  });

  it("si ya existe ese conector, no se duplica (pero se sigue resaltando la forma)", () => {
    const e = padreEHija([linea("L", [[0, 0], [10, 10]], { origen: { elementoId: "P", puerto: 2 }, destino: { elementoId: "H", puerto: 0 } })]);
    expect(intencionDeArrastre(e, sobreAbajo, 1, ["H"], "H", false)).toEqual({ destino: "P", conecta: false, previa: null });
  });

  it("el conector en sentido contrario no impide crear este", () => {
    const e = padreEHija([linea("L", [[0, 0], [10, 10]], { origen: { elementoId: "H", puerto: 0 }, destino: { elementoId: "P", puerto: 2 } })]);
    expect(intencionDeArrastre(e, sobreAbajo, 1, ["H"], "H", false).conecta).toBe(true);
  });

  it("una forma bloqueada u oculta no recibe: ni destino ni conexión", () => {
    const bloqueada = escena(forma("P", 300, 300, 100, 60, { bloqueado: true }), forma("H", 300, 450));
    expect(intencionDeArrastre(bloqueada, sobreAbajo, 1, ["H"], "H", true)).toEqual({ destino: null, conecta: false, previa: null });
    const oculta = escena(forma("P", 300, 300, 100, 60, { oculto: true }), forma("H", 300, 450));
    expect(intencionDeArrastre(oculta, sobreAbajo, 1, ["H"], "H", true).conecta).toBe(false);
  });

  it("con varias formas arrastradas, solo la agarrada se conecta; con un grupo, la forma agarrada de dentro", () => {
    const e = padreEHija([forma("X", 600, 450)]);
    const i = intencionDeArrastre(e, sobreAbajo, 1, ["H", "X"], "X", false);
    expect(i.conecta).toBe(true);
    expect(i.destino).toBe("P");
    // X está abajo a la derecha de P: se conecta por los puertos que se miran (derecha de P, izquierda de X).
    expect(i.previa).toEqual({ desde: puntoDePuerto(forma_(e, "P"), 1), hasta: puntoDePuerto(forma_(e, "X"), 3) });
    const g = escena(forma("P", 300, 300), forma("a", 300, 450), forma("b", 450, 450), grupo("g", ["a", "b"]));
    const ig = intencionDeArrastre(g, sobreAbajo, 1, ["g"], "a", false);
    expect(ig.conecta).toBe(true);
    expect(ig.destino).toBe("P"); // ni el grupo ni sus hijos cuentan como destino
  });

  it("con el dedo, el halo es de 24 px", () => {
    const e = padreEHija();
    const lejos = { x: 350, y: 380 }; // a 20 del puerto de abajo
    expect(intencionDeArrastre(e, lejos, 1, ["H"], "H", false, RADIO_PUERTO_PX).conecta).toBe(false);
    expect(intencionDeArrastre(e, lejos, 1, ["H"], "H", false, RADIO_PUERTO_TACTIL_PX).conecta).toBe(true);
  });
});

describe("conectarAlSoltar", () => {
  it("agrega UN conector del padre a la hija, en ángulo recto y con flecha, pegado a los puertos que se miran", () => {
    const e = padreEHija();
    const r = conectarAlSoltar(e, "P", "H");
    const ls = lineasDe(r);
    expect(ls).toHaveLength(1);
    const l = ls[0] as Linea;
    expect(l.origen).toEqual({ elementoId: "P", puerto: 2 });
    expect(l.destino).toEqual({ elementoId: "H", puerto: 0 });
    expect(l.trazado).toBe("ortogonal");
    expect(l.fin).toBe("flecha");
    expect(l.inicio).toBe("ninguno");
    // Los extremos guardan la posición real de sus puertos.
    expect(l.puntos[0]).toEqual(puntoDePuerto(forma_(r, "P"), 2));
    expect(l.puntos.at(-1)).toEqual(puntoDePuerto(forma_(r, "H"), 0));
  });

  it("es idempotente: conectar otra vez lo mismo no duplica (devuelve la misma escena)", () => {
    const una = conectarAlSoltar(padreEHija(), "P", "H");
    expect(conectarAlSoltar(una, "P", "H")).toBe(una);
    expect(lineasDe(una)).toHaveLength(1);
  });

  it("el sentido contrario sí se puede agregar", () => {
    const una = conectarAlSoltar(padreEHija(), "P", "H");
    expect(lineasDe(conectarAlSoltar(una, "H", "P"))).toHaveLength(2);
  });

  it("devuelve la misma escena si no se puede (misma forma, inexistente, línea u oculta)", () => {
    const e = padreEHija([forma("oculta", 600, 450, 100, 60, { oculto: true }), linea("L", [[0, 0], [10, 10]])]);
    expect(conectarAlSoltar(e, "P", "P")).toBe(e);
    expect(conectarAlSoltar(e, "P", "zzz")).toBe(e);
    expect(conectarAlSoltar(e, "P", "L")).toBe(e);
    expect(conectarAlSoltar(e, "P", "oculta")).toBe(e);
  });

  it("no modifica la escena que recibe", () => {
    const e = padreEHija();
    const antes = JSON.stringify(e);
    conectarAlSoltar(e, "P", "H");
    expect(JSON.stringify(e)).toBe(antes);
  });

  it("el conector nuevo queda al frente y no cambia el resto de elementos", () => {
    const e = padreEHija();
    const r = conectarAlSoltar(e, "P", "H");
    expect(r.elementos.slice(0, 2)).toEqual(e.elementos);
    expect(r.elementos.at(-1)?.tipo).toBe("linea");
  });
});
