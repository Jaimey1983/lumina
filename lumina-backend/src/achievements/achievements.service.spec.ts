import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { AchievementsService } from './achievements.service';
import { LLM_MODELS } from '../ai-features/ai-provider.types';

interface AchievementsServiceInternal {
  generatePIStatements(statement: string): Promise<string[]>;
}

async function createService(
  env: Record<string, string | undefined> = {},
): Promise<AchievementsServiceInternal> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AchievementsService,
      { provide: PrismaService, useValue: {} },
      { provide: CourseAuthorizationService, useValue: {} },
      { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
    ],
  }).compile();
  return module.get(AchievementsService);
}

function mockGeminiResponse(text: string) {
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  const fetchMock = jest.fn((url: string, init: { body: string }) => {
    requests.push({
      url,
      body: JSON.parse(init.body) as Record<string, unknown>,
    });
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }),
    } as Response);
  });
  (global as unknown as { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
  return { requests };
}

describe('AchievementsService.generatePIStatements (J5 — indicadores reales por competencia)', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sin GEMINI_API_KEY devuelve 4 indicadores reales y distintos, nunca strings vacíos', async () => {
    const service = await createService({});
    const result = await service.generatePIStatements(
      'El estudiante comprende el ciclo del agua',
    );
    expect(result).toHaveLength(4);
    expect(result.every((s) => s.trim().length > 0)).toBe(true);
    expect(new Set(result).size).toBe(4);
  });

  it('el fallback determinista incluye el enunciado del logro en cada indicador', async () => {
    const service = await createService({});
    const result = await service.generatePIStatements('el ciclo del agua');
    for (const s of result) {
      expect(s).toContain('el ciclo del agua');
    }
  });

  it('usa el modelo Gemini vigente y responseMimeType JSON (sin grounding, no hace falta internet acá)', async () => {
    const { requests } = mockGeminiResponse(
      '["Explica X", "Organiza Y", "Coopera en Z", "Usa W"]',
    );
    const service = await createService({ GEMINI_API_KEY: 'fake-key' });
    const result = await service.generatePIStatements('un logro cualquiera');
    expect(result).toEqual([
      'Explica X',
      'Organiza Y',
      'Coopera en Z',
      'Usa W',
    ]);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toContain(`/models/${LLM_MODELS.GEMINI}:`);
    expect(
      (requests[0].body.generationConfig as { responseMimeType?: string })
        .responseMimeType,
    ).toBe('application/json');
  });

  it('si Gemini devuelve un array con menos de 4 elementos, cae al fallback completo', async () => {
    mockGeminiResponse('["Solo uno"]');
    const service = await createService({ GEMINI_API_KEY: 'fake-key' });
    const result = await service.generatePIStatements('un logro cualquiera');
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });

  it('si Gemini devuelve un elemento vacío/inválido, solo ESE elemento cae al fallback (no el lote completo)', async () => {
    mockGeminiResponse('["Explica X", "", "Coopera en Z", "Usa W"]');
    const service = await createService({ GEMINI_API_KEY: 'fake-key' });
    const result = await service.generatePIStatements('un logro cualquiera');
    expect(result[0]).toBe('Explica X');
    expect(result[1]).toContain('un logro cualquiera'); // fallback determinista
    expect(result[2]).toBe('Coopera en Z');
    expect(result[3]).toBe('Usa W');
  });

  it('si Gemini falla (503), cae al fallback determinista sin reventar', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve('overloaded'),
      }),
    ) as unknown as typeof fetch;
    const service = await createService({ GEMINI_API_KEY: 'fake-key' });
    const result = await service.generatePIStatements('un logro cualquiera');
    expect(result).toHaveLength(4);
    expect(result.every((s) => s.trim().length > 0)).toBe(true);
  });
});
