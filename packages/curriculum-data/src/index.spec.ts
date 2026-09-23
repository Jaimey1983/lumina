import { describe, it, expect } from 'vitest';
import {
  AREAS_LABELS,
  GRADOS_PRIMARIA,
  GRADOS_BACHILLERATO,
  GRADOS_TODOS,
  loadCurriculum,
  buildCurriculumContext,
  findMatchingUnit,
  listUnidadesCuradas,
  listUnidadesPorComponente,
  listSubprocesosPorComponente,
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

  it('loadCurriculum lee un archivo real (ciencias-naturales-6, contenido curado)', async () => {
    const data = await loadCurriculum('ciencias-naturales', '6');
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
    const data = await loadCurriculum('ciencias-naturales', '6');
    expect(data).not.toBeNull();
    const context = buildCurriculumContext(data!);
    expect(context).toContain('UNIDADES CURRICULARES');
    expect(context.length).toBeGreaterThan(0);
  });

  describe('findMatchingUnit', () => {
    it('encuentra una unidad curada por título exacto', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      const unidad = findMatchingUnit(data!, 'Carga eléctrica por fricción y contacto');
      expect(unidad?.unidad_id).toBe(0);
    });

    it('encuentra una unidad curada por un tema parcial, sin acentos ni mayúsculas', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      const unidad = findMatchingUnit(data!, 'el agua como solvente');
      expect(unidad?.unidad_id).toBe(2);
    });

    it('encuentra una unidad curada por un subtema', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      const unidad = findMatchingUnit(data!, '¿Qué ocurre si se daña una organela celular?');
      expect(unidad?.unidad_id).toBe(3);
    });

    it('devuelve null si el tema no coincide con ninguna unidad', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      expect(findMatchingUnit(data!, 'Fracciones equivalentes')).toBeNull();
    });

    it('ignora unidades placeholder (nunca las ofrece como "curadas")', async () => {
      const data = await loadCurriculum('matematicas', '8');
      expect(data?.unidades[0]?.unidad_titulo.toLowerCase()).toContain('placeholder');
      expect(findMatchingUnit(data!, 'Placeholder')).toBeNull();
    });

    it('devuelve null con tema vacío', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      expect(findMatchingUnit(data!, '   ')).toBeNull();
    });
  });

  describe('listUnidadesCuradas', () => {
    it('devuelve las 5 unidades reales de ciencias-naturales-6', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      expect(listUnidadesCuradas(data!)).toHaveLength(5);
    });

    it('devuelve un array vacío para un área/grado 100% placeholder', async () => {
      const data = await loadCurriculum('matematicas', '8');
      expect(listUnidadesCuradas(data!)).toEqual([]);
    });
  });

  describe('listUnidadesPorComponente (J6.3, Entrada 2)', () => {
    it('filtra las unidades curadas cuyo ebc_factor coincide (insensible a mayúsculas)', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      const unidades = listUnidadesPorComponente(data!, 'entorno fisico');
      expect(unidades.map((u) => u.unidad_id).sort()).toEqual([0, 1, 2]);
    });

    it('coincide también con el otro componente del mismo grado', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      const unidades = listUnidadesPorComponente(data!, 'Entorno vivo');
      expect(unidades.map((u) => u.unidad_id).sort()).toEqual([3, 4]);
    });

    it('devuelve vacío si el componente existe en el catálogo pero ninguna unidad curada lo usa', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      expect(
        listUnidadesPorComponente(data!, 'Ciencia, Tecnología y Sociedad'),
      ).toEqual([]);
    });

    it('devuelve vacío si el componente no existe en el catálogo', async () => {
      const data = await loadCurriculum('ciencias-naturales', '6');
      expect(listUnidadesPorComponente(data!, 'Componente inexistente')).toEqual([]);
    });
  });

  describe('listSubprocesosPorComponente (J6.3, Entrada 2 — camino EBC)', () => {
    // Sale de EBC_ESTANDARES (catálogo por ciclo), no del dataset de
    // unidades — por eso se prueba con grado 6 (único ciclo curado hoy),
    // no con grado 1 como antes de mover el catálogo a ebc-estandares.ts.
    it('devuelve los subprocesos del ciclo para un componente curado', () => {
      const subprocesos = listSubprocesosPorComponente(
        'ciencias-naturales',
        '6',
        'Entorno vivo',
      );
      expect(subprocesos).toHaveLength(16);
      expect(subprocesos[0]).toContain('estructura de la célula');
    });

    it('un componente distinto del mismo ciclo devuelve una lista distinta', () => {
      const subprocesos = listSubprocesosPorComponente(
        'ciencias-naturales',
        '6',
        'Entorno físico',
      );
      expect(subprocesos).toHaveLength(16);
    });

    it('CTS del mismo ciclo también resuelve (catálogo completo, los 3 componentes)', () => {
      const subprocesos = listSubprocesosPorComponente(
        'ciencias-naturales',
        '6',
        'Ciencia, Tecnología y Sociedad',
      );
      expect(subprocesos).toHaveLength(13);
    });

    it('devuelve vacío si el componente no existe en el catálogo del área', () => {
      expect(
        listSubprocesosPorComponente('ciencias-naturales', '6', 'Componente inexistente'),
      ).toEqual([]);
    });

    it('devuelve vacío si el ciclo de ese grado todavía no tiene catálogo curado', () => {
      // ciencias-sociales todavía no tiene ningún ciclo curado en EBC_ESTANDARES.
      expect(
        listSubprocesosPorComponente(
          'ciencias-sociales',
          '1',
          'Relaciones con la historia y las culturas',
        ),
      ).toEqual([]);
    });
  });
});
