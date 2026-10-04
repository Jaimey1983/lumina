export {
  ELEMENTS_DATASET,
  allElements,
  lookupElement,
  type ElementRecord,
  type ElementsDataset,
} from './data/element-store.js';

export {
  parseFormula,
  normalizeFormulaInput,
  flattenCounts,
  type ElementCounts,
  type ParsedFormula,
} from './formula/parse.js';

export { molarMass, molarMassFromCounts } from './formula/molar-mass.js';

export {
  normalizeFormula,
  formulasEqual,
  sanitizeFormulaAnswer,
} from './formula/normalize.js';

export { parseEquation, type ParsedEquation } from './equation/parse.js';

export {
  balanceEquation,
  coefficientsEquivalent,
  type BalancedEquation,
} from './equation/balance.js';

export {
  nameToFormula,
  formulaFromName,
  answerMatchesFormula,
} from './nomenclature/inorganic.js';
