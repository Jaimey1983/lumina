import {
  balanceEquation,
  getElementBySymbol,
  parseFormula,
} from '@lumina/chemistry';
import type { AiActivityType } from './dto/generate-activity.dto';

export const CHEMISTRY_AI_ACTIVITY_TYPES: readonly AiActivityType[] = [
  'balancear_ecuacion',
  'ubicar_elemento',
  'formular_compuesto',
] as const;

export type ChemistryVerificationStatus =
  | 'verified_chemistry'
  | 'rejected_chemistry'
  | 'not_applicable';

export interface ChemistryVerificationResult {
  status: ChemistryVerificationStatus;
  reasons: string[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function isChemistryAiActivityType(type: AiActivityType): boolean {
  return (CHEMISTRY_AI_ACTIVITY_TYPES as readonly string[]).includes(type);
}

export function verifyChemistryActivity(
  type: AiActivityType,
  activity: Record<string, unknown>,
): ChemistryVerificationResult {
  if (!isChemistryAiActivityType(type)) {
    return { status: 'not_applicable', reasons: [] };
  }

  const reasons: string[] = [];

  if (type === 'balancear_ecuacion') {
    const ecuacion =
      typeof activity.ecuacion === 'string' ? activity.ecuacion.trim() : '';
    if (!ecuacion) {
      reasons.push('Falta el campo ecuacion.');
    } else {
      try {
        balanceEquation(ecuacion);
      } catch {
        reasons.push(
          'La ecuación no se puede balancear con coeficientes enteros o no es válida.',
        );
      }
    }
  }

  if (type === 'formular_compuesto') {
    const preguntas = Array.isArray(activity.preguntas)
      ? activity.preguntas
      : [];
    if (preguntas.length === 0) {
      reasons.push('Debe incluir al menos una pregunta con fórmula esperada.');
    }
    preguntas.forEach((raw, i) => {
      const q = asRecord(raw) ?? {};
      const formula = (
        asString(q.formula) || asString(q.formulaEsperada)
      ).trim();
      const enunciado =
        asString(q.enunciado) || asString(q.nombre) || `Pregunta ${i + 1}`;
      if (!formula) {
        reasons.push(`Pregunta "${enunciado}": falta fórmula esperada.`);
        return;
      }
      try {
        parseFormula(formula);
      } catch {
        reasons.push(
          `Pregunta "${enunciado}": fórmula no parseable (${formula}).`,
        );
      }
    });
  }

  if (type === 'ubicar_elemento') {
    const elementos = Array.isArray(activity.elementos)
      ? activity.elementos
      : [];
    if (elementos.length === 0) {
      reasons.push('Debe incluir al menos un elemento a ubicar.');
    }
    elementos.forEach((raw, i) => {
      const item = asRecord(raw) ?? {};
      const symbol = (asString(item.symbol) || asString(item.simbolo)).trim();
      const periodo = Number(item.periodo ?? item.period);
      const grupo = Number(item.grupo ?? item.group);
      if (!symbol) {
        reasons.push(`Elemento ${i + 1}: falta símbolo.`);
        return;
      }
      const el = getElementBySymbol(symbol);
      if (!el) {
        reasons.push(`Símbolo desconocido: ${symbol}.`);
        return;
      }
      if (!Number.isFinite(periodo) || periodo !== el.period) {
        reasons.push(
          `${symbol}: periodo ${periodo} no coincide con la tabla (${el.period}).`,
        );
      }
      if (el.group !== null && Number.isFinite(grupo) && grupo !== el.group) {
        reasons.push(
          `${symbol}: grupo ${grupo} no coincide con la tabla (${el.group}).`,
        );
      }
    });
  }

  if (reasons.length > 0) {
    return { status: 'rejected_chemistry', reasons };
  }
  return { status: 'verified_chemistry', reasons: [] };
}
