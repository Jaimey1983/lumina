import { ChemistryParseError } from '../errors.js';
import { balanceEquation, type BalancedEquation } from '../equation/balance.js';
import { molesFromMass } from '../formula/molar-mass.js';

export interface StoichiometryAmount {
  speciesIndex: number;
  rawFormula: string;
  moles: number;
}

export interface LimitingReagentResult {
  balanced: BalancedEquation;
  amounts: StoichiometryAmount[];
  limitingIndex: number;
  maxExtent: number;
}

/**
 * Dado una ecuación y masas (g) por fórmula en el lado de reactivos (mismo orden que aparecen),
 * calcula el reactivo limitante entre los reactivos con masa > 0.
 */
export function findLimitingReagent(
  equationInput: string,
  reactantMassesGrams: number[],
): LimitingReagentResult {
  const balanced = balanceEquation(equationInput);
  const rCount = balanced.equation.reactants.length;
  if (reactantMassesGrams.length !== rCount) {
    throw new ChemistryParseError(`Se esperaban ${rCount} masas de reactivos`);
  }

  const amounts: StoichiometryAmount[] = [];
  let limitingIndex = 0;
  let minExtent = Number.POSITIVE_INFINITY;

  for (let i = 0; i < rCount; i += 1) {
    const mass = reactantMassesGrams[i];
    if (mass < 0 || !Number.isFinite(mass)) {
      throw new ChemistryParseError('Masa de reactivo inválida');
    }
    const formula = balanced.equation.reactants[i].rawFormula;
    const moles = mass === 0 ? 0 : molesFromMass(mass, formula);
    const coeff = balanced.reactantCoefficients[i];
    const extent = coeff > 0 ? moles / coeff : Number.POSITIVE_INFINITY;
    amounts.push({ speciesIndex: i, rawFormula: formula, moles });
    if (extent < minExtent) {
      minExtent = extent;
      limitingIndex = i;
    }
  }

  if (!Number.isFinite(minExtent) || minExtent === Number.POSITIVE_INFINITY) {
    throw new ChemistryParseError('No se pudo determinar el reactivo limitante');
  }

  return {
    balanced,
    amounts,
    limitingIndex,
    maxExtent: minExtent,
  };
}

/** Moles de producto teórico (mol) al consumir completamente el reactivo limitante. */
export function productMolesAtLimit(
  result: LimitingReagentResult,
  productIndex: number,
): number {
  const coeff = result.balanced.productCoefficients[productIndex];
  if (coeff === undefined) throw new ChemistryParseError('Índice de producto inválido');
  return result.maxExtent * coeff;
}
