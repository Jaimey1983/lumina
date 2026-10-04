import {
  verifyChemistryActivity,
  isChemistryAiActivityType,
} from './chemistry-activity-verifier';

describe('chemistry-activity-verifier (Q8)', () => {
  it('tipos no químicos → not_applicable', () => {
    expect(isChemistryAiActivityType('quiz_multiple')).toBe(false);
    const res = verifyChemistryActivity('quiz_multiple', { tipo: 'quiz_multiple' });
    expect(res.status).toBe('not_applicable');
  });

  it('balancear_ecuacion válida → verified_chemistry', () => {
    const res = verifyChemistryActivity('balancear_ecuacion', {
      tipo: 'balancear_ecuacion',
      ecuacion: 'H2 + O2 -> H2O',
    });
    expect(res.status).toBe('verified_chemistry');
  });

  it('balancear_ecuacion inválida → rejected_chemistry', () => {
    const res = verifyChemistryActivity('balancear_ecuacion', {
      tipo: 'balancear_ecuacion',
      ecuacion: 'XxYy + Zz -> Qq',
    });
    expect(res.status).toBe('rejected_chemistry');
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it('formular_compuesto con fórmulas parseables → verified', () => {
    const res = verifyChemistryActivity('formular_compuesto', {
      tipo: 'formular_compuesto',
      preguntas: [
        { id: 'q1', enunciado: 'Óxido de calcio', formula: 'CaO' },
        { id: 'q2', enunciado: 'Agua', formula: 'H2O' },
      ],
    });
    expect(res.status).toBe('verified_chemistry');
  });

  it('ubicar_elemento coherente con dataset → verified', () => {
    const res = verifyChemistryActivity('ubicar_elemento', {
      tipo: 'ubicar_elemento',
      elementos: [
        { id: 'e1', symbol: 'Na', periodo: 3, grupo: 1 },
        { id: 'e2', symbol: 'Cl', periodo: 3, grupo: 17 },
      ],
    });
    expect(res.status).toBe('verified_chemistry');
  });

  it('ubicar_elemento con periodo incorrecto → rejected', () => {
    const res = verifyChemistryActivity('ubicar_elemento', {
      tipo: 'ubicar_elemento',
      elementos: [{ id: 'e1', symbol: 'Na', periodo: 1, grupo: 1 }],
    });
    expect(res.status).toBe('rejected_chemistry');
  });
});
