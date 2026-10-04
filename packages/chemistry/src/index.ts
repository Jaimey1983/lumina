/**
 * `@lumina/chemistry` — motor químico determinista (Etapa Q / DQ2).
 *
 * Sin `eval`, sin red, sin DOM. Misma lógica en cliente (`@lumina/scoring`) y backend.
 *
 * | Área | Funciones principales |
 * |------|------------------------|
 * | Datos | `lookupElement`, `allElements`, `ELEMENTS_DATASET` |
 * | Fórmula | `parseFormula`, `normalizeFormula`, `molarMass`, `percentComposition` |
 * | Ecuación | `parseEquation`, `balanceEquation`, `coefficientsEquivalent` |
 * | Estequiometría | `massToMoles`, `molesToMass`, `moleRatio`, `productMolesFromReactantMass` |
 * | Nomenclatura v1 | `nameToFormula`, `answerMatchesFormula` (inorgánica acotada) |
 */

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
  percentComposition,
  type ElementMassPercent,
} from './formula/percent-composition.js';

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
  massToMoles,
  molesToMass,
  moleRatio,
  productMolesFromReactantMass,
} from './stoichiometry/index.js';

export {
  nameToFormula,
  formulaFromName,
  answerMatchesFormula,
} from './nomenclature/inorganic.js';
