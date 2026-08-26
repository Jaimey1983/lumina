import { anonymizeStudentLabel } from './ai-pii';

describe('anonymizeStudentLabel', () => {
  it('deja nombre y inicial del apellido', () => {
    expect(anonymizeStudentLabel('María', 'González')).toBe('María G.');
  });

  it('omite inicial si no hay apellido', () => {
    expect(anonymizeStudentLabel('María')).toBe('María');
    expect(anonymizeStudentLabel('María', '')).toBe('María');
  });
});
