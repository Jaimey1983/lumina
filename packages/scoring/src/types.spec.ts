import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, expectTypeOf, it } from "vitest";
import * as scoring from "./index.js";
import type {
  GradebookAverageEntry,
  ScoringFixtureSlide,
  ActivityEvaluationDetail,
  ActivityEvaluationResult,
  ActivityScoringKind,
} from "./index.js";

it("fija los parámetros y retornos públicos sin compilar los consumidores", () => {
  expectTypeOf(scoring.notaColombiana).toEqualTypeOf<
    (correctas: number, total: number, respondio: boolean) => number
  >();
  expectTypeOf(scoring.getActivityScoringKind).toEqualTypeOf<
    (activityType: string) => ActivityScoringKind | undefined
  >();
  expectTypeOf(scoring.esEvaluable).toEqualTypeOf<
    (activityType: string) => boolean
  >();
  expectTypeOf(scoring.isGradebookScoringDeferred).toEqualTypeOf<
    (activityType: string) => boolean
  >();
  expectTypeOf(scoring.countsTowardClassGradebookAverage).toEqualTypeOf<
    (entry: GradebookAverageEntry) => boolean
  >();
  expectTypeOf(scoring.computeClassGradebookPromedio).toEqualTypeOf<
    (entries: readonly GradebookAverageEntry[]) => number | null
  >();
  expectTypeOf(scoring.promedioFromFixtureSlides).toEqualTypeOf<
    (slides: readonly ScoringFixtureSlide[]) => number | null
  >();
  expectTypeOf(scoring.xpFromEvaluation).toEqualTypeOf<
    (result: ActivityEvaluationResult) => number
  >();
  expectTypeOf(scoring.isActivityDraftResponse).toEqualTypeOf<
    (response: unknown) => boolean
  >();
  expectTypeOf(scoring.unwrapActivityDraftResponse).toEqualTypeOf<
    (response: unknown) => unknown
  >();
  expectTypeOf(scoring.wrapActivityDraftResponse).toEqualTypeOf<
    (payload: unknown) => unknown
  >();
  expectTypeOf(scoring.normalizeVideoAnswers).toEqualTypeOf<
    (respuesta: unknown) => { questionIndex: number; answer: string }[]
  >();
  expectTypeOf(scoring.evaluateActivityResponse).toEqualTypeOf<
    (
      activityType: string,
      definicion: unknown,
      respuesta: unknown,
    ) => ActivityEvaluationResult
  >();
  expectTypeOf(scoring.extractActivityDefinition).toEqualTypeOf<
    (content: unknown) => Record<string, unknown> | null
  >();
  expectTypeOf(scoring.detailsForLivePanel).toEqualTypeOf<
    (
      details: ActivityEvaluationDetail[],
    ) => { label: string; correct: boolean | null }[]
  >();
});

/** Compara contratos declarados sin importar ni ejecutar la implementación vieja. */
function superficiePublica(path: string): Record<string, string> {
  const text = readFileSync(new URL(path, import.meta.url), "utf8");
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ removeComments: true });
  const surface: Record<string, string> = {};
  const print = (node: ts.Node) => {
    const scanner = ts.createScanner(
      ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard,
      printer.printNode(ts.EmitHint.Unspecified, node, source),
    );
    const tokens: string[] = [];
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
      tokens.push(token === ts.SyntaxKind.StringLiteral
        ? JSON.stringify(scanner.getTokenValue()) : scanner.getTokenText());
    }
    return tokens.join("");
  };

  for (const node of source.statements) {
    if (
      !ts.canHaveModifiers(node) ||
      !ts
        .getModifiers(node)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      surface[node.name.text] = print(node);
    } else if (ts.isFunctionDeclaration(node) && node.name && node.type) {
      surface[node.name.text] = print(
        ts.factory.createFunctionTypeNode(
          node.typeParameters,
          node.parameters,
          node.type,
        ),
      );
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.type) {
          surface[declaration.name.getText(source)] = print(declaration.type);
        } else if (
          declaration.initializer &&
          ts.isStringLiteral(declaration.initializer)
        ) {
          surface[declaration.name.getText(source)] = JSON.stringify(
            declaration.initializer.text,
          );
        }
      }
    }
  }
  return surface;
}

it.each([
  "../../../lumina-frontend/src/lib/activity-scoring.ts",
  "../../../lumina-backend/src/classes/activity-scoring.ts",
])("conserva todas las declaraciones públicas de %s", (path) => {
  expect(superficiePublica("./index.ts")).toEqual(superficiePublica(path));
});

// E2.1: la implementación ya está portada — el comportamiento se valida en
// `scoring.spec.ts` (fixtures de paridad). Aquí solo un par de anclas rápidas.
it("ACTIVITY_SCORING es una tabla real (no un placeholder que lanza)", () => {
  expect(scoring.ACTIVITY_SCORING.quiz_multiple).toBe("partial");
  expect(Object.keys(scoring.ACTIVITY_SCORING).length).toBeGreaterThan(20);
});

it("evaluateActivityResponse puntúa sin lanzar", () => {
  const r = scoring.evaluateActivityResponse(
    "verdadero_falso",
    { respuestaCorrecta: true },
    true,
  );
  expect(r.score).toBe(5);
  expect(r.correct).toBe(true);
});
