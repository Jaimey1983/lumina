/**
 * @lumina/chemistry — parser de fórmulas, masa molar, balanceo y estequiometría (Etapa Q).
 *
 * API pública consumida por `@lumina/scoring`, backend e element-kit (Q4+).
 */

export { ChemistryParseError, ChemistryBalanceError } from './errors.js';

export {
  getAllElements,
  getElementBySymbol,
  getElementsMetadata,
  getAtomicMass,
  type PeriodicElement,
  type ElementsMetadata,
  type ElementsDataset,
  type ElementCategory,
} from './data/elements.js';

export { normalizeFormulaInput, normalizeFormula } from './formula/normalize.js';
export {
  parseFormula,
  addAtomCounts,
  formulasEqual,
  MAX_FORMULA_LENGTH,
  type ParsedFormula,
} from './formula/parse.js';
export {
  answerMatchesFormula,
  formulaFromName,
  nameToFormula,
} from './nomenclature/inorganic.js';
export { computeMolarMass, molesFromMass, type MolarMassResult } from './formula/molar-mass.js';
export {
  computePercentComposition,
  type PercentCompositionEntry,
  type PercentCompositionResult,
} from './formula/percent-composition.js';

export { parseEquation, type ParsedEquation, type EquationSpecies } from './equation/parse.js';
export {
  balanceEquation,
  coefficientsAreEquivalent,
  formatBalancedEquation,
  type BalancedEquation,
} from './equation/balance.js';

export {
  findLimitingReagent,
  productMolesAtLimit,
  type LimitingReagentResult,
  type StoichiometryAmount,
} from './stoichiometry/basic.js';
