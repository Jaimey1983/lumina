import {
  answerMatchesFormula,
  balanceEquation,
  coefficientsEquivalent,
  lookupElement,
} from '@lumina/chemistry';

interface ActivityEvaluationDetail {
  index: number;
  correct: boolean;
  label: string;
}

interface ActivityEvaluationResult {
  correct: boolean;
  details: ActivityEvaluationDetail[];
  score: number | null;
}

/** Misma regla que `notaColombiana` en index.ts (evita dependencia circular). */
function notaColombiana(correctas: number, total: number, respondio: boolean): number {
  if (!respondio) return 0;
  if (total <= 0) return 0;
  const bruta = (correctas / total) * 5;
  return Math.round(Math.max(1, bruta) * 10) / 10;
}

const UNEVALUABLE: ActivityEvaluationResult = {
  correct: false,
  details: [],
  score: null,
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function resultFromDetails(details: ActivityEvaluationDetail[]): ActivityEvaluationResult {
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, details.length, details.length > 0),
  };
}

function readCoefficients(respuesta: unknown): number[] | null {
  if (Array.isArray(respuesta)) {
    const nums = respuesta.map((x) => Number(x));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
    return nums.map((n) => Math.round(n));
  }
  const rec = asRecord(respuesta);
  const raw = rec?.coefficients ?? rec?.coeficientes;
  if (!Array.isArray(raw)) return null;
  const nums = raw.map((x) => Number(x));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return nums.map((n) => Math.round(n));
}

export function evaluateBalancearEcuacion(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const ecuacion = typeof def.ecuacion === 'string' ? def.ecuacion : '';
  const balanced = balanceEquation(ecuacion);
  if (!balanced) return UNEVALUABLE;
  const given = readCoefficients(respuesta);
  if (!given || given.length !== balanced.coefficients.length) return UNEVALUABLE;
  if (given.every((c) => c === 0)) return UNEVALUABLE;
  const ok = coefficientsEquivalent(given, balanced.coefficients);
  return {
    correct: ok,
    details: [{ index: 0, correct: ok, label: 'Coeficientes' }],
    score: notaColombiana(ok ? 1 : 0, 1, true),
  };
}

export function evaluateUbicarElemento(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const items = Array.isArray(def.elementos) ? def.elementos : [];
  if (items.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta);
  const placements = Array.isArray(respuesta)
    ? respuesta
    : Array.isArray(rec?.placements)
      ? rec.placements
      : Array.isArray(rec?.ubicaciones)
        ? rec.ubicaciones
        : [];
  const details: ActivityEvaluationDetail[] = items.map((raw, i) => {
    const item = asRecord(raw) ?? {};
    const id = String(item.id ?? `e-${i}`);
    const symbol = String(item.symbol ?? item.simbolo ?? '');
    const expectedPeriod = Number(item.periodo ?? item.period);
    const expectedGroup = Number(item.grupo ?? item.group);
    const el = lookupElement(symbol);
    const label = el?.nombre ?? symbol ?? `Elemento ${i + 1}`;
    const place = placements.find((p) => asRecord(p)?.id === id) ?? placements[i];
    const pr = asRecord(place);
    const gotPeriod = Number(pr?.periodo ?? pr?.period);
    const gotGroup = Number(pr?.grupo ?? pr?.group);
    const ok =
      Number.isFinite(expectedPeriod) &&
      Number.isFinite(expectedGroup) &&
      gotPeriod === expectedPeriod &&
      gotGroup === expectedGroup;
    return { index: i, correct: ok, label };
  });
  return resultFromDetails(details);
}

export function evaluateFormularCompuesto(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const preguntas = Array.isArray(def.preguntas) ? def.preguntas : [];
  if (preguntas.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta);
  const answers = asRecord(rec?.answers ?? rec?.respuestas ?? respuesta) ?? {};
  const details: ActivityEvaluationDetail[] = preguntas.map((raw, i) => {
    const q = asRecord(raw) ?? {};
    const id = String(q.id ?? `q-${i}`);
    const expected = String(q.formula ?? q.formulaEsperada ?? '');
    const enunciado = String(q.enunciado ?? q.nombre ?? `Pregunta ${i + 1}`);
    if (!expected) return { index: i, correct: false, label: enunciado };
    const given = String(answers[id] ?? '');
    const ok = given.trim() !== '' && answerMatchesFormula(expected, given);
    return { index: i, correct: ok, label: enunciado };
  });
  return resultFromDetails(details);
}
