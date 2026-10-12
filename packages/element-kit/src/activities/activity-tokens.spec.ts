/**
 * U1 — guarda de tokens de actividades (etapa U / DU4). Molde: `widgets/widget-tokens.spec.ts`.
 *
 * 1. Los tokens `--la-*` declarados en `_shared/activity-tokens.module.css` coinciden con
 *    la tabla `ACTIVITY_TOKENS` (nombres y fallbacks) y los textos de estado son legibles.
 * 2. Guarda **ratchet** contra colores hex sueltos en `activities/**`: un archivo no
 *    exento no puede traer hex; un exento no puede traer MÁS de los que tiene hoy ni
 *    quedarse en la lista cuando ya no tiene ninguno. Cada ficha U9 retira su archivo.
 *
 * «Hex suelto» = `#rgb`, `#rgba`, `#rrggbb` o `#rrggbbaa` en un `.css`/`.ts`/`.tsx` (incluye
 * clases Tailwind arbitrarias `bg-[#2563EB]` y `style={{ color: '#fff' }}`), salvo como
 * *fallback* dentro de `var(--x, #hex)` o al DECLARAR una variable propia (`--la-x: #hex`).
 * Los comentarios no cuentan.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { contrastRatio } from "@lumina/editor-shared/contrast";
import { ESTILOS_ACTIVIDAD as ESTILOS_ACTIVIDAD_LISTA } from "./_shared/activity-settings.js";
import {
  ACTIVITY_ESTADOS,
  ACTIVITY_SUAVE_PORCENTAJE,
  ACTIVITY_TOKENS,
  laVar,
} from "./_shared/activity-tokens.js";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const CSS_TOKENS = join(RAIZ, "_shared", "activity-tokens.module.css");

/** Archivos que DEFINEN los tokens: son la fuente del hex, no consumidores. */
const ARCHIVOS_DE_TOKENS: readonly string[] = ["_shared/activity-tokens.ts"];

/**
 * Archivos con hex suelto HOY y cuántos tienen (medido en U1). Se achica archivo por archivo
 * en U9a–U9d; no se agrega nada. Orden alfabético.
 */
const EXENTOS: Readonly<Record<string, number>> = {
  "_classic/drag-drop.tsx": 40,
  "_classic/order-steps.tsx": 28,
  "_classic/quiz-multiple.tsx": 18,
  "_classic/quiz/quiz-multiple-editor.tsx": 27,
  "_classic/quiz/quiz-multiple-viewer.tsx": 8,
  "_classic/quiz/quiz-option-layouts.tsx": 73,
  "_classic/quiz/quiz-synced-panel.tsx": 17,
  "_classic/quiz/quiz-synced-viewer.tsx": 19,
  "_classic/video-interactive.tsx": 43,
  "_shared/activity-drag-word.tsx": 12,
  "_shared/activity-result-overlay.tsx": 1,
  "abrir-caja/abrir-caja-config.ts": 1,
  "abrir-caja/abrir-caja-defaults.ts": 1,
  "abrir-caja/abrir-caja-properties.tsx": 1,
  "abrir-caja/abrir-caja-viewer.tsx": 3,
  "abrir-caja/abrir-caja.module.css": 1,
  "ahorcado/ahorcado-figure.tsx": 17,
  "ahorcado/ahorcado.module.css": 40,
  "anagrama/anagrama-properties.tsx": 1,
  "anagrama/anagrama-viewer.tsx": 1,
  "chemistry/chemistry-activities.tsx": 4,
  "clasificar/clasificar-defaults.ts": 4,
  "clasificar/clasificar-properties.tsx": 2,
  "clasificar/clasificar-viewer.tsx": 5,
  "crucigrama/crucigrama-defaults.ts": 2,
  "crucigrama/crucigrama-editor.tsx": 3,
  "crucigrama/crucigrama-properties.tsx": 1,
  "crucigrama/crucigrama-viewer.tsx": 9,
  "emparejar/emparejar-viewer.tsx": 27,
  "globos/globos-config.ts": 8,
  "globos/globos-defaults.ts": 6,
  "globos/globos-properties.tsx": 2,
  "globos/globos.module.css": 1,
  "historia-ramificada/historia-ramificada-config.ts": 5,
  "historia-ramificada/historia-ramificada-editor.tsx": 2,
  "historia-ramificada/historia-ramificada-node-editor.tsx": 6,
  "historia-ramificada/historia-ramificada-viewer.tsx": 1,
  "puzzle-imagen/puzzle-imagen-viewer.tsx": 9,
  "puzzle-palabras/puzzle-palabras-properties.tsx": 1,
  "puzzle-palabras/puzzle-palabras-viewer.tsx": 2,
  "sopa-letras/sopa-letras-properties.tsx": 1,
  "sopa-letras/sopa-letras-viewer.tsx": 13,
  "topo/topo-editor.tsx": 1,
  "topo/topo-properties.tsx": 1,
  "topo/topo-viewer.tsx": 1,
  "topo/topo.module.css": 4,
};

/**
 * Archivos cuyo hex es DATO y no estilo: valores por defecto que se GUARDAN en el slide
 * (el docente los elige y el viewer los lee tal cual) o que exige un `<input type=color>`.
 * No se retiran en U9: se justifican acá. Mismo tope exacto que `EXENTOS`.
 */
const EXENTOS_DE_DATO: Readonly<Record<string, { readonly hex: number; readonly motivo: string }>> = {
  "memoria/memoria-defaults.ts": {
    hex: 2,
    motivo: "colorDorso y colorSimboloDorso por defecto: se guardan en el slide",
  },
  "memoria/memoria-properties.tsx": {
    hex: 1,
    motivo: "valor inicial del <input type=color>, que solo acepta #rrggbb",
  },
};

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;

function sinComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Cantidad de hex sueltos en un archivo (reglas del encabezado). */
export function contarHexSueltos(src: string): number {
  const limpio = sinComentarios(src);
  let n = 0;
  for (const m of limpio.matchAll(HEX)) {
    const k = m.index ?? 0;
    const antes = limpio.slice(Math.max(0, limpio.lastIndexOf("\n", k) + 1), k);
    // fallback dentro de un `var(--x, #hex)` aún sin cerrar
    if (/var\([^()]*,\s*[^()]*$/.test(antes)) continue;
    // declaración de variable propia: `--nombre: #hex`
    if (/(^|[\s;{])--[\w-]+\s*:\s*[^;]*$/.test(antes)) continue;
    n += 1;
  }
  return n;
}

function archivos(dir: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else if (/\.(css|tsx?)$/.test(nombre) && !/\.(spec|test)\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida.sort();
}

const REL = (f: string) => relative(RAIZ, f).split("\\").join("/");

describe("tokens --la-* (U1)", () => {
  const css = readFileSync(CSS_TOKENS, "utf-8");

  it("cada token de la tabla está declarado en el CSS y viceversa", () => {
    const declarados = new Set([...css.matchAll(/^\s*--la-([\w-]+)\s*:/gm)].map((m) => m[1]));
    const esperados = new Set<string>(Object.keys(ACTIVITY_TOKENS));
    for (const e of ACTIVITY_ESTADOS) esperados.add(`color-${e}-suave`);
    expect([...declarados].sort()).toEqual([...esperados].sort());
  });

  it("el fallback del CSS coincide con la tabla (color pleno y neutros)", () => {
    for (const [nombre, spec] of Object.entries(ACTIVITY_TOKENS)) {
      const decl = new RegExp(`--la-${nombre}\\s*:\\s*([^;]+);`).exec(css)?.[1].trim();
      expect(decl, nombre).toBeDefined();
      const esperado = spec.tema ? `var(${spec.tema}, ${spec.fallback})` : spec.fallback;
      expect(decl, nombre).toBe(esperado);
    }
  });

  it("el tinte suave usa el mismo porcentaje que `laVar`", () => {
    for (const e of ACTIVITY_ESTADOS) {
      const decl = new RegExp(`--la-color-${e}-suave\\s*:\\s*([^;]+);`).exec(css)?.[1];
      expect(decl, e).toContain(`${ACTIVITY_SUAVE_PORCENTAJE[e]}%`);
      expect(decl, e).toContain(`var(--la-color-${e})`);
    }
  });

  it("`laVar` arma var(--la-x, fallback)", () => {
    expect(laVar("color-correcto")).toBe("var(--la-color-correcto, #16a34a)");
    expect(laVar("radio-md")).toBe("var(--la-radio-md, 0.5rem)");
    expect(laVar("color-pista-suave")).toContain("var(--la-color-pista-suave, color-mix(");
  });

  it("el texto de cada estado se lee sobre blanco (WCAG AA, ≥ 4.5:1)", () => {
    for (const e of ACTIVITY_ESTADOS) {
      const texto = ACTIVITY_TOKENS[`color-${e}-texto`].fallback;
      expect(contrastRatio(texto, "#ffffff"), e).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(ACTIVITY_TOKENS["color-texto"].fallback, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("estilos de actividad (U8)", () => {
  const css = readFileSync(CSS_TOKENS, "utf-8");
  const ESTILOS = ["escolar", "examen", "arcade", "minimal", "pizarra"] as const;

  /** Valor de un token en un estilo: lo que declara el bloque del estilo o, si no, el defecto. */
  function resolver(estilo: string, token: string): string {
    const bloque = new RegExp(`\\.tokens\\[data-estilo='${estilo}'\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
    const propio = new RegExp(`--la-${token}\\s*:\\s*([^;]+);`).exec(bloque)?.[1]?.trim();
    const valor = propio ?? new RegExp(`\\.tokens\\s*\\{[\\s\\S]*?--la-${token}\\s*:\\s*([^;]+);`).exec(css)![1].trim();
    // `var(--lw-…, #hex)` → el fallback
    return /var\([^,]+,\s*(#[0-9a-fA-F]{3,8})\)/.exec(valor)?.[1] ?? valor;
  }

  it("hay un bloque por cada estilo salvo `escolar` (que es el defecto) y ninguno de más", () => {
    const declarados = [...css.matchAll(/\.tokens\[data-estilo='([a-z]+)'\]/g)].map((m) => m[1]).sort();
    expect(declarados).toEqual(["arcade", "examen", "minimal", "pizarra"]);
    expect(ESTILOS_ACTIVIDAD_LISTA).toEqual([...ESTILOS]);
  });

  for (const estilo of ESTILOS) {
    it(`${estilo}: el texto y el texto de cada estado se leen sobre la superficie (≥ 4.5:1)`, () => {
      const superficie = resolver(estilo, "color-superficie");
      for (const t of ["color-texto", "color-texto-suave", ...ACTIVITY_ESTADOS.map((e) => `color-${e}-texto`)]) {
        const ratio = contrastRatio(resolver(estilo, t), superficie);
        expect(ratio, `${estilo}: ${t} sobre ${superficie}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${estilo}: la selección y el borde se distinguen de la superficie (≥ 3:1 la selección)`, () => {
      const superficie = resolver(estilo, "color-superficie");
      expect(contrastRatio(resolver(estilo, "color-seleccionado"), superficie), `${estilo}: seleccionado`).toBeGreaterThanOrEqual(3);
      expect(resolver(estilo, "color-borde")).not.toBe(superficie);
    });
  }
});

describe("contarHexSueltos", () => {
  it("cuenta hex en strings, estilos y clases arbitrarias", () => {
    expect(contarHexSueltos(`<div className="bg-[#2563EB] text-[#fff]" style={{ color: '#16a34a' }} />`)).toBe(3);
  });
  it("no cuenta fallbacks de var(), declaraciones de variable ni comentarios", () => {
    expect(contarHexSueltos("a { color: var(--lw-color-success, #16a34a); }")).toBe(0);
    expect(contarHexSueltos(".x { --la-borde: #e5e7eb; }")).toBe(0);
    expect(contarHexSueltos("// #2563EB\n/* #fff */\nconst a = 1;")).toBe(0);
    expect(contarHexSueltos("a { color: #fff; background: var(--x, #000); }")).toBe(1);
  });
  it("no confunde anclas ni ids con colores", () => {
    expect(contarHexSueltos(`<a href="#main-content">`)).toBe(0);
    expect(contarHexSueltos("const url = 'https://x.dev/#abcdefg';")).toBe(0);
  });
});

describe("guarda ratchet contra hex en activities/ (U1)", () => {
  const conteo = new Map<string, number>();
  for (const f of archivos(RAIZ)) {
    const rel = REL(f);
    if (ARCHIVOS_DE_TOKENS.includes(rel)) continue;
    conteo.set(rel, contarHexSueltos(readFileSync(f, "utf-8")));
  }

  const TODOS: Readonly<Record<string, number>> = {
    ...EXENTOS,
    ...Object.fromEntries(Object.entries(EXENTOS_DE_DATO).map(([k, v]) => [k, v.hex])),
  };

  it("las listas de exentos están ordenadas y no se pisan", () => {
    for (const lista of [EXENTOS, EXENTOS_DE_DATO]) {
      const claves = Object.keys(lista);
      expect(claves).toEqual([...claves].sort());
    }
    expect(Object.keys(EXENTOS).filter((k) => k in EXENTOS_DE_DATO)).toEqual([]);
    for (const [k, v] of Object.entries(EXENTOS_DE_DATO)) expect(v.motivo.length, k).toBeGreaterThan(10);
  });

  it("ningún archivo NO exento trae hex suelto", () => {
    const sucios = [...conteo].filter(([rel, n]) => n > 0 && !(rel in TODOS)).map(([rel, n]) => `${rel} (${n})`);
    expect(sucios, "usar laVar()/var(--la-*) en vez de un hex; o, si es una actividad aún sin migrar, NO agregar hex nuevos").toEqual([]);
  });

  it("un exento no trae MÁS hex que los medidos", () => {
    const crecidos = Object.entries(TODOS)
      .filter(([rel, max]) => (conteo.get(rel) ?? 0) > max)
      .map(([rel, max]) => `${rel}: ${conteo.get(rel)} > ${max}`);
    expect(crecidos).toEqual([]);
  });

  it("un exento no se queda en la lista si bajó o ya no tiene hex (actualizar el tope)", () => {
    const obsoletos = Object.entries(TODOS)
      .filter(([rel, max]) => (conteo.get(rel) ?? 0) < max)
      .map(([rel, max]) => `${rel}: tiene ${conteo.get(rel) ?? "no existe"}, la lista dice ${max}`);
    expect(obsoletos).toEqual([]);
  });
});
