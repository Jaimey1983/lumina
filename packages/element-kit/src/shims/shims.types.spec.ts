import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * E4.5 — Guarda contra la putrefacción silenciosa de los shims.
 *
 * El kit se tipa contra shims `.d.ts` escritos a mano (`tsconfig*` → shim), pero
 * en runtime resuelve el barrel real del frontend (`vitest.config.ts` → source).
 * Si el barrel real renombra o elimina un export que el kit importa, `tsc` del
 * kit NO lo caza (ve el shim, que sigue declarándolo).
 *
 * Este test recorre TODOS los `import ... from "lumina-frontend/<subpath>"` del
 * código del kit y, para cada nombre importado, exige que:
 *   1. el **barrel real** del frontend lo exporte  → si no, el shim está podrido;
 *   2. el **shim** correspondiente lo declare       → si no, el shim está incompleto.
 *
 * Limitación: compara NOMBRES, no firmas. Un cambio de tipo en las props de un
 * componente real no lo caza esto — eso lo cubre en runtime cada
 * `*.parity.spec.tsx`, que renderiza el componente real vía el alias de vitest.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const kitSrc = path.resolve(here, "..");
const repoRoot = path.resolve(here, "../../../..");
const frontendDir = path.join(repoRoot, "lumina-frontend");
const frontendPkg = JSON.parse(
  readFileSync(path.join(frontendDir, "package.json"), "utf8"),
) as { exports: Record<string, string> };

/** `lumina-frontend/<subpath>` → ruta absoluta del barrel real (via `exports`). */
function realBarrelFor(spec: string): string | null {
  const sub = spec.replace(/^lumina-frontend\//, "./");
  const target = frontendPkg.exports[sub];
  return target ? path.join(frontendDir, target) : null;
}

/** shim `.d.ts` esperado para `lumina-frontend/<subpath>`. */
function shimFor(spec: string): string {
  const flat = spec
    .replace(/^lumina-frontend\//, "")
    .replace(/^(widgets|blocks|activities)\//, "")
    .replace(/\//g, "-");
  return path.join(here, `lumina-frontend-${flat}.d.ts`);
}

/** Nombres exportados por un `.ts` / `.d.ts` (declaraciones + `export { … }`). */
function exportedNames(absPath: string): Set<string> {
  const sf = ts.createSourceFile(
    absPath,
    readFileSync(absPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = new Set<string>();
  const exported = (n: ts.Node): boolean =>
    ts.canHaveModifiers(n) &&
    !!ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  for (const node of sf.statements) {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      exported(node)
    ) {
      names.add(node.name.text);
    } else if (ts.isVariableStatement(node) && exported(node)) {
      for (const d of node.declarationList.declarations)
        if (ts.isIdentifier(d.name)) names.add(d.name.text);
    } else if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause))
        for (const el of node.exportClause.elements) names.add(el.name.text);
    }
  }
  return names;
}

/** Todos los `.ts` / `.tsx` del kit salvo shims. */
function kitSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "shims") continue;
      out.push(...kitSourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** `Map<subpath, Set<nombreImportado>>` sobre todo el código del kit. */
function importsFromFrontend(): Map<string, Set<string>> {
  const bySpec = new Map<string, Set<string>>();
  for (const file of kitSourceFiles(kitSrc)) {
    const sf = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of sf.statements) {
      if (
        !ts.isImportDeclaration(node) ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue;
      const spec = node.moduleSpecifier.text;
      if (!spec.startsWith("lumina-frontend/")) continue;
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      const set = bySpec.get(spec) ?? new Set<string>();
      for (const el of bindings.elements) {
        set.add((el.propertyName ?? el.name).text);
      }
      bySpec.set(spec, set);
    }
  }
  return bySpec;
}

const imports = [...importsFromFrontend().entries()].sort((a, b) =>
  a[0].localeCompare(b[0]),
);

describe("shims ↔ frontend — los nombres que el kit importa existen a ambos lados (E4.5)", () => {
  it("el kit importa de al menos un subpath de lumina-frontend", () => {
    expect(imports.length).toBeGreaterThan(10);
  });

  it.each(imports)("%s: el barrel real exporta todo lo que el kit importa", (spec, usados) => {
    const real = realBarrelFor(spec);
    expect(real, `sin entrada en package.json#exports para ${spec}`).not.toBeNull();
    const reales = exportedNames(real as string);
    const faltan = [...usados].filter((n) => !reales.has(n));
    expect(
      faltan,
      `${spec}: el kit importa [${faltan.join(", ")}] que ` +
        `${path.relative(repoRoot, real as string)} ya no exporta ` +
        `(shim desincronizado)`,
    ).toEqual([]);
  });

  it.each(imports)("%s: el shim declara todo lo que el kit importa", (spec, usados) => {
    const shim = shimFor(spec);
    const declarados = exportedNames(shim);
    const faltan = [...usados].filter((n) => !declarados.has(n));
    expect(
      faltan,
      `${spec}: el shim ${path.basename(shim)} no declara [${faltan.join(", ")}]`,
    ).toEqual([]);
  });
});
