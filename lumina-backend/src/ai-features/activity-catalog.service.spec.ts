import { ForbiddenException } from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import type { AiKeysService } from './ai-keys.service';
import {
  AI_ACTIVITY_TYPES,
  type AiActivityType,
  type GenerateActivityDto,
} from './dto/generate-activity.dto';
import type { RefineActivityDto } from './dto/refine-activity.dto';
import { isChemistryAiActivityType } from './chemistry-activity-verifier';

function mockLlmActivityForType(tipo: AiActivityType): Record<string, unknown> {
  switch (tipo) {
    case 'balancear_ecuacion':
      return {
        tipo,
        ecuacion: 'H2 + O2 -> H2O',
        instruccion: 'Balancea la ecuación.',
      };
    case 'ubicar_elemento':
      return {
        tipo,
        elementos: [{ id: 'e1', symbol: 'Na', periodo: 3, grupo: 1 }],
      };
    case 'formular_compuesto':
      return {
        tipo,
        preguntas: [{ id: 'q1', enunciado: 'Agua', formula: 'H2O' }],
      };
    default:
      return { tipo, marcador: 'ok' };
  }
}

function makeService(completeForUser: jest.Mock) {
  const aiKeys = { completeForUser } as unknown as AiKeysService;
  return new AiFeaturesService(
    {} as never, // PrismaService — no usado
    {} as never, // CourseAuthorizationService — no usado
    aiKeys,
  );
}

const genDto = (
  type: AiActivityType,
  over: Partial<GenerateActivityDto> = {},
): GenerateActivityDto => ({
  text: 'La fotosíntesis en plantas C3',
  type,
  ...over,
});

describe('J8 — catálogo completo de actividades generables por IA', () => {
  it('AI_ACTIVITY_TYPES cubre los tipos generables (22 clásicos + 3 química Q8)', () => {
    expect(AI_ACTIVITY_TYPES).toHaveLength(25);
    expect(new Set(AI_ACTIVITY_TYPES).size).toBe(25);
    // Los 15 antes ausentes (J8), confirmados contra packages/element-kit/src/elements/_shared/catalogo.ts
    const antesAusentes: AiActivityType[] = [
      'video_interactivo',
      'encuesta_viva',
      'nube_palabras',
      'anagrama',
      'clasificar',
      'memoria',
      'puzzle_imagen',
      'sopa_letras',
      'crucigrama',
      'abrir_caja',
      'ahorcado',
      'puzzle_palabras',
      'globos',
      'topo',
      'historia_ramificada',
    ];
    for (const tipo of antesAusentes) {
      expect(AI_ACTIVITY_TYPES).toContain(tipo);
    }
  });

  it.each(AI_ACTIVITY_TYPES)(
    'generateActivity("%s") arma un prompt con el schema del tipo y desenvuelve la respuesta',
    async (tipo) => {
      const complete = jest
        .fn()
        .mockResolvedValue(JSON.stringify(mockLlmActivityForType(tipo)));
      const svc = makeService(complete);

      const res = await svc.generateActivity(genDto(tipo), 'u1', 'TEACHER');

      expect(res.tipo).toBe(tipo);
      expect(res.activity?.tipo).toBe(tipo);
      if (isChemistryAiActivityType(tipo)) {
        expect(res.chemistryVerification?.status).toBe('verified_chemistry');
      }
      const [, , user] = complete.mock.calls[0] as [string, string, string];
      expect(user).toContain(`"tipo": "${tipo}"`);
    },
  );

  it('video_interactivo — el prompt exige NO inventar URL real', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ marcador: 'ok' }));
    const svc = makeService(complete);
    await svc.generateActivity(genDto('video_interactivo'), 'u1', 'TEACHER');
    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('NO inventes una URL real de video');
  });

  it('crucigrama — el prompt deja el cálculo de posición al sistema, no al modelo', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ marcador: 'ok' }));
    const svc = makeService(complete);
    await svc.generateActivity(genDto('crucigrama'), 'u1', 'TEACHER');
    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('calcula el sistema');
  });

  it('historia_ramificada — el esquema del JSON no pide el campo editorX (el sistema lo calcula)', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ marcador: 'ok' }));
    const svc = makeService(complete);
    await svc.generateActivity(genDto('historia_ramificada'), 'u1', 'TEACHER');
    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('No incluyas editorX/editorY');
    expect(user).not.toContain('"editorX"');
  });

  it('balancear_ecuacion — rechaza propuesta si la ecuación no balancea (Q8)', async () => {
    const complete = jest.fn().mockResolvedValue(
      JSON.stringify({
        tipo: 'balancear_ecuacion',
        ecuacion: 'XxYy + Zz -> Qq',
      }),
    );
    const svc = makeService(complete);
    const res = await svc.generateActivity(
      genDto('balancear_ecuacion'),
      'u1',
      'TEACHER',
    );
    expect(res.activity).toBeNull();
    expect(res.chemistryVerification?.status).toBe('rejected_chemistry');
    expect(res.chemistryVerification?.reasons.length).toBeGreaterThan(0);
  });
});

describe('AiFeaturesService.refineActivity (J8)', () => {
  const refineDto = (
    over: Partial<RefineActivityDto> = {},
  ): RefineActivityDto => ({
    type: 'quiz_multiple',
    currentActivity: {
      tipo: 'quiz_multiple',
      preguntas: [
        { id: 'q-0', texto: '¿Qué es la fotosíntesis?', opciones: [] },
      ],
    },
    instruction: 'Agrega dos preguntas más de opción múltiple',
    conversationHistory: [],
    ...over,
  });

  it('arma el prompt con la actividad actual + la instrucción + el esquema del tipo', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(
        JSON.stringify({ tipo: 'quiz_multiple', preguntas: [] }),
      );
    const svc = makeService(complete);

    const res = await svc.refineActivity(refineDto(), 'u1', 'TEACHER');

    expect(res.tipo).toBe('quiz_multiple');
    expect(res.instruction).toBe('Agrega dos preguntas más de opción múltiple');
    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('ACTIVIDAD ACTUAL');
    expect(user).toContain('¿Qué es la fotosíntesis?');
    expect(user).toContain('Agrega dos preguntas más de opción múltiple');
  });

  it('incluye el historial de ajustes anteriores cuando existe', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ tipo: 'quiz_multiple' }));
    const svc = makeService(complete);

    await svc.refineActivity(
      refineDto({
        conversationHistory: [
          { role: 'user', content: 'Hazla más difícil' },
          { role: 'assistant', content: 'Listo, subí la dificultad' },
        ],
      }),
      'u1',
      'TEACHER',
    );

    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('HISTORIAL DE AJUSTES ANTERIORES');
    expect(user).toContain('Hazla más difícil');
  });

  it('rol no docente → ForbiddenException, sin llamar a la IA', async () => {
    const complete = jest.fn();
    const svc = makeService(complete);

    await expect(
      svc.refineActivity(refineDto(), 'u1', 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(complete).not.toHaveBeenCalled();
  });

  it('respuesta anidada en { activity } se desenvuelve igual', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ activity: { preguntas: [] } }));
    const svc = makeService(complete);

    const res = await svc.refineActivity(refineDto(), 'u1', 'TEACHER');

    expect(res.activity).toEqual({ preguntas: [], tipo: 'quiz_multiple' });
  });
});
