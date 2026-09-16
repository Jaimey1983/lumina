import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

async function createService(): Promise<CurriculumService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CurriculumService,
      { provide: ConfigService, useValue: { get: () => undefined } },
    ],
  }).compile();
  return module.get(CurriculumService);
}

describe('CurriculumService.getCurriculumUnit (J2 — dataset único)', () => {
  it('devuelve la unidad curricular real para una combinación con contenido curado', async () => {
    const service = await createService();
    const data = await service.getCurriculumUnit('ciencias-naturales', '1');
    expect(data).not.toBeNull();
    expect(data?.asignatura).toBeTruthy();
    expect(Array.isArray(data?.unidades)).toBe(true);
  });

  it('devuelve la unidad curricular (placeholder) para una combinación sin curar todavía', async () => {
    const service = await createService();
    const data = await service.getCurriculumUnit('matematicas', '8');
    expect(data).not.toBeNull();
    expect(data?.grado).toBe('8');
  });

  it('rechaza un área curricular desconocida con 400', async () => {
    const service = await createService();
    await expect(
      service.getCurriculumUnit('quimica', '1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un grado escolar desconocido con 400', async () => {
    const service = await createService();
    await expect(
      service.getCurriculumUnit('matematicas', '12'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('CurriculumService — DBA_BANCO retirado (D2)', () => {
  it('no expone getDba (el banco paralelo se retiró en J2)', async () => {
    const service = await createService();
    expect((service as unknown as { getDba?: unknown }).getDba).toBeUndefined();
  });
});

describe('CurriculumService.generateDesempeno — dataset curado > Gemini > fallback (J3)', () => {
  it('usa la unidad curada real cuando el tema coincide (sin llamar a Gemini)', async () => {
    const service = await createService();
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'Los sentidos y la percepción del entorno',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toBe(
      'Comprende que los sentidos le permiten percibir algunas características de los objetos que nos rodean (temperatura, sabor, sonidos, olor, color, texturas y formas).',
    );
    expect(result.indicadores.bajo).toBe(
      'Nombra los cinco sentidos con ayuda del docente.',
    );
    expect(result.indicadores.superior).toContain('distintos sentidos');
  });

  it('encuentra la unidad curada por un tema parcial (subtema), no solo por título exacto', async () => {
    const service = await createService();
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'Materiales de uso cotidiano',
      tipo: 'Procedimental',
    });
    expect(result.enunciado).not.toContain(
      'Analizar los conceptos fundamentales',
    );
  });

  it('cae al fallback de plantilla si el área no es de las 5 del dataset MEN', async () => {
    const service = await createService();
    const result = await service.generateDesempeno({
      area: 'Educación Física',
      grado: '5',
      tema: 'Coordinación motriz',
      tipo: 'Procedimental',
    });
    expect(result.enunciado).toContain('Coordinación motriz');
    expect(result.enunciado).toContain('Analizar los conceptos fundamentales');
  });

  it('cae al fallback de plantilla si el área/grado del dataset todavía no tiene contenido curado', async () => {
    const service = await createService();
    const result = await service.generateDesempeno({
      area: 'Matemáticas',
      grado: '8',
      tema: 'Cualquier tema',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toContain('Analizar los conceptos fundamentales');
  });

  it('cae al fallback de plantilla si el tema no coincide con ninguna unidad curada', async () => {
    const service = await createService();
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'Un tema que no existe en el dataset',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toContain('Analizar los conceptos fundamentales');
  });
});
