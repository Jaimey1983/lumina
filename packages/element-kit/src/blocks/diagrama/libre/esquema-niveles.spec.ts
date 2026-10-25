import { describe, expect, it } from "vitest";
import { nivelesDeLineas } from "./esquema-niveles.js";

const niveles = (t: string): number[] => nivelesDeLineas(t).map((l) => l.nivel);
const textos = (t: string): string[] => nivelesDeLineas(t).map((l) => l.texto);

describe("nivelesDeLineas: sangría (lo de siempre)", () => {
  it("2 espacios o un tabulador son un nivel", () => {
    expect(niveles("A\n  B\n    C\n  D")).toEqual([0, 1, 2, 1]);
    expect(niveles("A\n\tB\n\t\tC")).toEqual([0, 1, 2]);
    expect(niveles("A\n  B\n\tC")).toEqual([0, 1, 1]);
  });
  it("las líneas vacías no cuentan", () => {
    expect(textos("A\n\n   \n  B")).toEqual(["A", "B"]);
  });
  it("viñetas y numeración simple se quitan del texto sin cambiar el nivel", () => {
    expect(textos("- A\n  * B\n  + C\n  • D")).toEqual(["A", "B", "C", "D"]);
    expect(niveles("- A\n  * B\n  + C\n  • D")).toEqual([0, 1, 1, 1]);
    expect(textos("1. Uno\n2) Dos")).toEqual(["Uno", "Dos"]);
    expect(niveles("1. Uno\n2) Dos")).toEqual([0, 0]);
  });
});

describe("nivelesDeLineas: encabezados", () => {
  it("el nivel es la cantidad de # menos uno", () => {
    expect(niveles("# A\n## B\n### C\n## D")).toEqual([0, 1, 2, 1]);
    expect(textos("# A\n## B")).toEqual(["A", "B"]);
  });
  it("seis # llegan; siete o un # pegado al texto no son encabezados", () => {
    expect(niveles("###### seis")).toEqual([5]);
    expect(textos("####### siete")).toEqual(["####### siete"]);
    expect(textos("#hashtag")).toEqual(["#hashtag"]);
  });
  it("un encabezado sin texto se descarta", () => {
    expect(textos("# \n# A")).toEqual(["#", "A"]); // «#» solo (sin espacio final tras recortar) es texto, no encabezado
  });
  it("lo que va debajo de un encabezado cuelga de él", () => {
    expect(niveles("# A\n- x\n- y")).toEqual([0, 1, 1]);
    expect(niveles("# A\n## B\n- x")).toEqual([0, 1, 2]);
  });
  it("la sangría debajo de un encabezado suma a la base", () => {
    expect(niveles("# A\n- x\n  - y")).toEqual([0, 1, 2]);
  });
  it("un salto de nivel se deja como está (el árbol lo cuelga del anterior)", () => {
    expect(niveles("# A\n### B")).toEqual([0, 2]);
  });
});

describe("nivelesDeLineas: numeración de varios componentes (solo sin sangría)", () => {
  it("1. / 1.1. / 1.1.1. / 2.", () => {
    expect(niveles("1. Tema\n1.1. Idea\n1.1.1. Detalle\n2. Otro")).toEqual([0, 1, 2, 0]);
    expect(textos("1. Tema\n1.1. Idea\n1.1.1. Detalle\n2. Otro")).toEqual(["Tema", "Idea", "Detalle", "Otro"]);
  });
  it("con cierre «)»", () => {
    expect(niveles("1) Tema\n1.1) Idea")).toEqual([0, 1]);
  });
  it("sin punto final cuenta si extiende la numeración anterior", () => {
    expect(niveles("1. Tema\n1.1 Idea\n1.1.1 Detalle\n1.2 Otra\n2. Otro")).toEqual([0, 1, 2, 1, 0]);
    expect(textos("1. Tema\n1.1 Idea")).toEqual(["Tema", "Idea"]);
  });
  it("sin punto final y sin contexto es texto: 3.14 es pi, 1.5 litros de agua", () => {
    expect(textos("3.14 es pi")).toEqual(["3.14 es pi"]);
    expect(niveles("3.14 es pi")).toEqual([0]);
    expect(textos("Receta\n1.5 litros de agua")).toEqual(["Receta", "1.5 litros de agua"]);
    expect(niveles("Receta\n1.5 litros de agua")).toEqual([0, 0]);
  });
  it("sin punto final con otro prefijo es texto", () => {
    expect(textos("1. Tema\n2.5 litros")).toEqual(["Tema", "2.5 litros"]);
    expect(niveles("1. Tema\n2.5 litros")).toEqual([0, 0]);
  });
  it("2024 fue bisiesto y 100% listo siguen siendo texto", () => {
    expect(textos("1. A\n2024 fue bisiesto\n100% listo")).toEqual(["A", "2024 fue bisiesto", "100% listo"]);
  });
  it("con sangría manda la sangría y el resultado es el de siempre", () => {
    expect(niveles("1. Uno\n  2) Dos\n    1.1. Tres")).toEqual([0, 1, 2]);
    expect(niveles("1. Uno\n  1.1. Dos")).toEqual([0, 1]);
    expect(textos("1. Uno\n  1.1 Dos")).toEqual(["Uno", "1.1 Dos"]); // sin cierre y con sangría: texto, como antes
  });
  it("bajo un encabezado la numeración suma a la base", () => {
    expect(niveles("# Tema\n1. A\n1.1 B")).toEqual([0, 1, 2]);
  });
});

describe("nivelesDeLineas: mezcla", () => {
  it("encabezado + numeración + sangría", () => {
    // La sangría se mide desde la base del encabezado (DY56): «  - c» queda un nivel bajo el tema, no bajo «1.1 B».
    expect(niveles("# Tema\n1. A\n1.1 B\n  - c\n2. D")).toEqual([0, 1, 2, 2, 1]);
  });
  it("un encabezado reinicia el contexto de la numeración", () => {
    expect(textos("1. A\n# B\n1.1 C")).toEqual(["A", "B", "1.1 C"]);
  });
});
