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
    await expect(service.getCurriculumUnit('quimica', '1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
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
