import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { LLM_MODELS } from '../ai-features/ai-provider.types';

async function createService(): Promise<CurriculumService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CurriculumService,
      { provide: ConfigService, useValue: { get: () => undefined } },
    ],
  }).compile();
  return module.get(CurriculumService);
}

async function createServiceWithKey(): Promise<CurriculumService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CurriculumService,
      {
        provide: ConfigService,
        useValue: {
          get: (k: string) => (k === 'GEMINI_API_KEY' ? 'fake-key' : undefined),
        },
      },
    ],
  }).compile();
  return module.get(CurriculumService);
}

function mockGeminiResponses(texts: string[]) {
  let call = 0;
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  const fetchMock = jest.fn((url: string, init: { body: string }) => {
    requests.push({
      url,
      body: JSON.parse(init.body) as Record<string, unknown>,
    });
    const text = texts[Math.min(call, texts.length - 1)];
    call += 1;
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }),
    } as Response);
  });
  (global as unknown as { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
  return { fetchMock, requests };
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

describe('CurriculumService.generateDesempeno — match semántico + generación con internet (Etapa J, seguimiento a J3)', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('usa la unidad curada cuando Gemini la asocia semánticamente (sin match literal)', async () => {
    const service = await createServiceWithKey();
    const { requests } = mockGeminiResponses(['{"unidad_id": 0}']);
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      // "la piel" no es substring literal de ningún tema/subtema de la unidad 0
      // (Los sentidos) — solo un LLM podría asociarlo semánticamente.
      tema: 'la piel',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toBe(
      'Comprende que los sentidos le permiten percibir algunas características de los objetos que nos rodean (temperatura, sabor, sonidos, olor, color, texturas y formas).',
    );
    // Solo 1 llamada a Gemini (la de clasificación) — no llegó a la de generación.
    expect(requests).toHaveLength(1);
  });

  it('ignora un unidad_id fuera de rango devuelto por Gemini y sigue la cadena', async () => {
    const service = await createServiceWithKey();
    mockGeminiResponses([
      '{"unidad_id": 999}', // clasificación: id inexistente -> se ignora
      '{"enunciado": "Generado con internet", "indicadores": {"superior":"s","alto":"a","basico":"b","bajo":"j"}, "actividadesSugeridas": ["1","2","3"]}',
    ]);
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'algo sin relación',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toBe('Generado con internet');
  });

  it('cuando no hay match, genera con Gemini usando el modelo vigente y Google Search grounding', async () => {
    const service = await createServiceWithKey();
    const { requests } = mockGeminiResponses([
      '{"unidad_id": -1}',
      '{"enunciado": "Generado con internet", "indicadores": {"superior":"s","alto":"a","basico":"b","bajo":"j"}, "actividadesSugeridas": ["1","2","3"]}',
    ]);
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'un tema que no está en el dataset',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toBe('Generado con internet');
    expect(requests).toHaveLength(2);

    const [semanticReq, generationReq] = requests as {
      url: string;
      body: {
        tools?: unknown;
        generationConfig: { responseMimeType?: string };
      };
    }[];
    // Las dos llamadas usan el modelo vigente (LLM_MODELS.GEMINI), no el
    // 'gemini-2.0-flash' descontinuado que causaba que todo cayera siempre
    // al fallback de plantilla.
    expect(semanticReq.url).toContain(`/models/${LLM_MODELS.GEMINI}:`);
    expect(generationReq.url).toContain(`/models/${LLM_MODELS.GEMINI}:`);
    // La llamada de generación final tiene grounding de Google Search y NO
    // fuerza responseMimeType (la API de Gemini rechaza esa combinación).
    expect(generationReq.body.tools).toEqual([{ google_search: {} }]);
    expect(
      generationReq.body.generationConfig.responseMimeType,
    ).toBeUndefined();
    // La llamada de clasificación semántica sí pide JSON puro (no tiene grounding).
    expect(semanticReq.body.tools).toBeUndefined();
  });

  it('respuesta grounded envuelta en prose/markdown igual se parsea (extractJsonObject)', async () => {
    const service = await createServiceWithKey();
    mockGeminiResponses([
      '{"unidad_id": -1}',
      'Según fuentes confiables, aquí está el resultado:\n```json\n{"enunciado": "Con prosa alrededor", "indicadores": {"superior":"s","alto":"a","basico":"b","bajo":"j"}, "actividadesSugeridas": ["1","2","3"]}\n```\nEspero que sirva.',
    ]);
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'un tema que no está en el dataset',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toBe('Con prosa alrededor');
  });

  it('si Gemini falla incluso en la generación, cae al fallback de plantilla (no revienta)', async () => {
    const service = await createServiceWithKey();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve('overloaded'),
      }),
    ) as unknown as typeof fetch;
    const result = await service.generateDesempeno({
      area: 'Ciencias Naturales',
      grado: '1',
      tema: 'un tema que no está en el dataset',
      tipo: 'Cognitivo',
    });
    expect(result.enunciado).toContain('Analizar los conceptos fundamentales');
  });
});
