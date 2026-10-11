/**
 * T1 — guarda de tokens: un `.module.css` de widget no puede fijar un color
 * hex «a pelo». Todo color pasa por `var(--lw-*, <fallback>)`; el hex solo se
 * permite como fallback dentro de un `var()` o al DECLARAR una variable propia
 * (`--pt-bg: #fecaca`, que es definir un token, no usarlo).
 *
 * Lo mismo vale para `rgb()/rgba()/hsl()/hsla()`, salvo los neutros de sombras y velos
 * (negro, blanco y el pizarra `15 23 42`): cualquier otro color con alfa se deriva del tema con
 * `color-mix(in srgb, var(--lw-color-…, <fallback>) N%, transparent)`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HEX = /^(#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3,4})/;

/** Hex fuera de un `var(...)` y fuera de la declaración de una `--variable`. */
export function hexSueltos(css: string): { linea: number; hex: string; propiedad: string }[] {
  const hallados: { linea: number; hex: string; propiedad: string }[] = [];
  const pila: boolean[] = [];
  let linea = 1;
  for (let k = 0; k < css.length; ) {
    if (css.startsWith("/*", k)) {
      const fin = css.indexOf("*/", k);
      const bloque = css.slice(k, fin < 0 ? css.length : fin + 2);
      linea += bloque.split("\n").length - 1;
      k += bloque.length;
      continue;
    }
    const c = css[k];
    if (c === "\n") linea += 1;
    if (css.startsWith("var(", k) && (k === 0 || !/[a-zA-Z0-9]/.test(css[k - 1]))) {
      pila.push(true);
      k += 4;
      continue;
    }
    if (c === "(") pila.push(false);
    else if (c === ")") pila.pop();
    else if (c === "#") {
      const m = HEX.exec(css.slice(k, k + 9));
      if (m) {
        const fin = k + m[0].length;
        const sigue = css[fin] ?? "";
        if (!pila.some(Boolean) && !/[a-zA-Z0-9_-]/.test(sigue)) {
          const inicioLinea = css.lastIndexOf("\n", k) + 1;
          const decl = css.slice(inicioLinea, k);
          const declaracion = decl.split(/[{;]/).pop() ?? "";
          if (declaracion.includes(":")) {
            const propiedad = declaracion.split(":")[0].trim();
            if (!propiedad.startsWith("--")) hallados.push({ linea, hex: m[0], propiedad });
          }
        }
        k = fin;
        continue;
      }
    }
    k += 1;
  }
  return hallados;
}

const NEUTROS = new Set(["0,0,0", "255,255,255", "15,23,42"]);
const FUNCION_COLOR = /^(rgba?|hsla?)\(/i;

/** Colores funcionales fuera de un `var(...)` y de una `--variable`, que no son un neutro permitido. */
export function coloresFuncionalesSueltos(css: string): { linea: number; color: string; propiedad: string }[] {
  const hallados: { linea: number; color: string; propiedad: string }[] = [];
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, (b) => b.replace(/[^\n]/g, " "));
  const pila: boolean[] = [];
  let linea = 1;
  for (let k = 0; k < sinComentarios.length; ) {
    const c = sinComentarios[k];
    if (c === "\n") linea += 1;
    if (sinComentarios.startsWith("var(", k) && (k === 0 || !/[a-zA-Z0-9-]/.test(sinComentarios[k - 1]))) {
      pila.push(true);
      k += 4;
      continue;
    }
    const m = !pila.some(Boolean) && (k === 0 || !/[a-zA-Z0-9-]/.test(sinComentarios[k - 1])) ? FUNCION_COLOR.exec(sinComentarios.slice(k, k + 6)) : null;
    if (m) {
      const fin = sinComentarios.indexOf(")", k);
      const llamada = sinComentarios.slice(k, fin + 1);
      const inicioLinea = sinComentarios.lastIndexOf("\n", k) + 1;
      const declaracion = (sinComentarios.slice(inicioLinea, k).split(/[{;]/).pop() ?? "");
      const propiedad = declaracion.split(":")[0].trim();
      if (declaracion.includes(":") && !propiedad.startsWith("--")) {
        const canales = (llamada.slice(m[0].length, -1).split("/")[0].match(/[\d.]+/g) ?? []).slice(0, 3).join(",");
        const esRgb = m[1].toLowerCase().startsWith("rgb");
        if (!(esRgb && NEUTROS.has(canales))) hallados.push({ linea, color: llamada, propiedad });
      }
      k = fin + 1;
      continue;
    }
    if (c === "(") pila.push(false);
    else if (c === ")") pila.pop();
    k += 1;
  }
  return hallados;
}

const aqui = dirname(fileURLToPath(import.meta.url));
const archivos = readdirSync(aqui, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(join(aqui, d.name))
      .filter((f) => f.endsWith(".module.css"))
      .map((f) => ({ ruta: `${d.name}/${f}`, css: readFileSync(join(aqui, d.name, f), "utf8") })),
  );

describe("hexSueltos (detector)", () => {
  it("ignora el fallback de un var(), incluso con paréntesis anidados", () => {
    expect(hexSueltos("a { color: var(--x, #fff); box-shadow: var(--y, 0 0 rgba(0,0,0,.1) #000); }")).toEqual([]);
  });

  it("ignora la declaración de una variable propia", () => {
    expect(hexSueltos(".c { --pt-bg: #fecaca; }")).toEqual([]);
  });

  it("detecta un hex a pelo, con su línea y propiedad", () => {
    expect(hexSueltos("a {\n  color: #fff;\n  border: 1px solid #e2e8f0;\n}")).toEqual([
      { linea: 2, hex: "#fff", propiedad: "color" },
      { linea: 3, hex: "#e2e8f0", propiedad: "border" },
    ]);
  });

  it("no confunde un selector de id ni un comentario con un color", () => {
    expect(hexSueltos("/* color: #fff */\n#abcdefg { color: red; }")).toEqual([]);
  });
});

describe("coloresFuncionalesSueltos (detector)", () => {
  it("permite neutros de sombra/velo, fallbacks de var() y declaraciones de variable", () => {
    expect(
      coloresFuncionalesSueltos(
        "a { box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2); background: rgb(255 255 255 / 0.1); color: var(--x, rgb(37 99 235)); --h: hsl(220 65% 88%); border: 1px solid rgb(0 0 0 / .3); }",
      ),
    ).toEqual([]);
  });

  it("detecta un color con matiz fijo, con su línea y propiedad", () => {
    expect(coloresFuncionalesSueltos("a {\n  background: rgba(37, 99, 235, 0.06);\n  fill: hsl(20 65% 60%);\n}")).toEqual([
      { linea: 2, color: "rgba(37, 99, 235, 0.06)", propiedad: "background" },
      { linea: 3, color: "hsl(20 65% 60%)", propiedad: "fill" },
    ]);
  });
});

describe("CSS de widgets — sin hex fuera de var(--lw-*, fallback) (T1)", () => {
  it("hay CSS de widgets que revisar", () => {
    expect(archivos.length).toBeGreaterThanOrEqual(12);
  });

  for (const { ruta, css } of archivos) {
    it(ruta, () => {
      expect(hexSueltos(css)).toEqual([]);
      expect(coloresFuncionalesSueltos(css)).toEqual([]);
    });
  }
});
