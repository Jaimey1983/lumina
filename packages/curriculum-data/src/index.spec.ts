import { describe, it, expect } from 'vitest';
import {
  AREAS_LABELS,
  GRADOS_PRIMARIA,
  GRADOS_BACHILLERATO,
  GRADOS_TODOS,
  loadCurriculum,
  buildCurriculumContext,
} from './index.js';

describe('@lumina/curriculum-data', () => {
  it('expone las 5 áreas curriculares', () => {
    expect(Object.keys(AREAS_LABELS).sort()).toEqual(
      [
        'ciencias-naturales',
        'ciencias-sociales',
        'ingles',
        'lenguaje',
        'matematicas',
      ].sort(),
    );
  });

  it('GRADOS_TODOS es la unión de primaria + bachillerato, 11 grados', () => {
    expect(GRADOS_TODOS).toEqual([...GRADOS_PRIMARIA, ...GRADOS_BACHILLERATO]);
    expect(GRADOS_TODOS).toHaveLength(11);
  });

  it('loadCurriculum devuelve null para una combinación sin dataset', async () => {
    // @ts-expect-error — valores fuera del tipo, a propósito, para probar el guard
    await expect(loadCurriculum('quimica', '1')).resolves.toBeNull();
  });

  it('loadCurriculum lee un archivo real (ciencias-naturales-1, contenido curado)', async () => {
    const data = await loadCurriculum('ciencias-naturales', '1');
    expect(data).not.toBeNull();
    expect(data?.asignatura).toBeTruthy();
    expect(Array.isArray(data?.unidades)).toBe(true);
  });

  it('loadCurriculum lee también un placeholder (matematicas-8) sin reventar', async () => {
    const data = await loadCurriculum('matematicas', '8');
    expect(data).not.toBeNull();
    expect(data?.grado).toBe('8');
  });

  it('buildCurriculumContext arma un resumen legible a partir del dataset real', async () => {
    const data = await loadCurriculum('ciencias-naturales', '1');
    expect(data).not.toBeNull();
    const context = buildCurriculumContext(data!);
    expect(context).toContain('UNIDADES CURRICULARES');
    expect(context.length).toBeGreaterThan(0);
  });
});
