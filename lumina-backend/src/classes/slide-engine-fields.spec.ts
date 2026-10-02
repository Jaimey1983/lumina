import {
  CAMPOS_DEL_MOTOR_DE_SLIDE,
  conservarCamposDelMotor,
} from './slide-engine-fields';

describe('conservarCamposDelMotor (K6)', () => {
  const existente = {
    bloques: [{ tipo: 'texto' }],
    reglas: [{ id: 'r1' }],
    capas: [{ id: 'c1' }],
  };

  it('conserva reglas y capas cuando el guardado no las trae', () => {
    const r = conservarCamposDelMotor({ bloques: [], guias: {} }, existente);
    expect(r).toEqual({
      bloques: [],
      guias: {},
      reglas: [{ id: 'r1' }],
      capas: [{ id: 'c1' }],
    });
  });

  it('respeta un valor explícito, incluido el vacío (así se borra)', () => {
    const r = conservarCamposDelMotor(
      { bloques: [], reglas: [], capas: [] },
      existente,
    );
    expect(r).toEqual({ bloques: [], reglas: [], capas: [] });
  });

  it('no inventa campos que no existían', () => {
    const entrada = { bloques: [] };
    expect(conservarCamposDelMotor(entrada, { bloques: [] })).toBe(entrada);
  });

  it('no muta los argumentos', () => {
    const entrada = { bloques: [] };
    const copia = JSON.stringify(entrada);
    conservarCamposDelMotor(entrada, existente);
    expect(JSON.stringify(entrada)).toBe(copia);
  });

  it('tolera contenido que no es un objeto', () => {
    expect(conservarCamposDelMotor(null, existente)).toBeNull();
    expect(conservarCamposDelMotor({ a: 1 }, null)).toEqual({ a: 1 });
  });

  it('la lista cubre los campos de slide del motor', () => {
    expect([...CAMPOS_DEL_MOTOR_DE_SLIDE]).toEqual(['reglas', 'capas']);
  });
});
