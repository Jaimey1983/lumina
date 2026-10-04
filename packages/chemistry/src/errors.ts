export class ChemistryParseError extends Error {
  readonly code = 'CHEMISTRY_PARSE_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ChemistryParseError';
  }
}

export class ChemistryBalanceError extends Error {
  readonly code = 'CHEMISTRY_BALANCE_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ChemistryBalanceError';
  }
}
