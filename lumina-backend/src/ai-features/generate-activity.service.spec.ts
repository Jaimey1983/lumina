import { ForbiddenException } from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import type { AiKeysService } from './ai-keys.service';
import type { GenerateActivityDto } from './dto/generate-activity.dto';

function makeService(completeForUser: jest.Mock) {
  const aiKeys = { completeForUser } as unknown as AiKeysService;
  return new AiFeaturesService(
    {} as never, // PrismaService — no usado por generateActivity
    {} as never, // CourseAuthorizationService — no usado
    aiKeys,
  );
}

const dto = (over: Partial<GenerateActivityDto> = {}): GenerateActivityDto => ({
  text: 'La fotosíntesis en plantas C3',
  type: 'quiz_multiple',
  ...over,
});

const quizJson = JSON.stringify({
  tipo: 'quiz_multiple',
  preguntas: [
    {
      id: 'q-0',
      texto: '¿Qué es la fotosíntesis?',
      opciones: [
        { id: 'op-0-0', texto: 'A', esCorrecta: true },
        { id: 'op-0-1', texto: 'B', esCorrecta: false },
      ],
      puntos: 10,
    },
  ],
  deliveryMode: 'AUTONOMOUS',
  layoutVariant: 'classic-list',
});

describe('AiFeaturesService.generateActivity (J6.5)', () => {
  it('sin curriculumContext — el prompt no menciona contexto curricular', async () => {
    const complete = jest.fn().mockResolvedValue(quizJson);
    const svc = makeService(complete);

    await svc.generateActivity(dto(), 'u1', 'TEACHER');

    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).not.toContain('CONTEXTO CURRICULAR');
  });

  it('con curriculumContext — se inyecta en el prompt y pide alinear con los indicadores', async () => {
    const complete = jest.fn().mockResolvedValue(quizJson);
    const svc = makeService(complete);
    const curriculumContext =
      'Desempeño del curso: Explica el proceso de fotosíntesis.\n\n' +
      'Indicadores de desempeño que esta clase debe abordar:\n' +
      '- Identifica los reactivos y productos de la fotosíntesis\n' +
      '- Explica el rol de la luz solar en el proceso';

    await svc.generateActivity(dto({ curriculumContext }), 'u1', 'TEACHER');

    const [, , user] = complete.mock.calls[0] as [string, string, string];
    expect(user).toContain('CONTEXTO CURRICULAR');
    expect(user).toContain('Identifica los reactivos y productos');
    expect(user).toContain('evaluar específicamente los indicadores');
  });

  it('rol no docente → ForbiddenException, sin llamar a la IA', async () => {
    const complete = jest.fn();
    const svc = makeService(complete);

    await expect(
      svc.generateActivity(dto(), 'u1', 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(complete).not.toHaveBeenCalled();
  });

  it('respuesta anidada en { activity } se desenvuelve igual con o sin contexto', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ activity: { texto: 'x' } }));
    const svc = makeService(complete);

    const res = await svc.generateActivity(
      dto({ type: 'short_answer', curriculumContext: 'Desempeño: X' }),
      'u1',
      'TEACHER',
    );

    expect(res.tipo).toBe('short_answer');
    expect(res.activity).toEqual({ texto: 'x', tipo: 'short_answer' });
  });
});
