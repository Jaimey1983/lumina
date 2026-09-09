import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiFeaturesService } from './ai-features.service';
import type { AiKeysService } from './ai-keys.service';
import type { TextAssistDto } from './dto/text-assist.dto';

function makeService(completeForUser: jest.Mock) {
  const aiKeys = { completeForUser } as unknown as AiKeysService;
  return new AiFeaturesService(
    {} as never, // PrismaService — no usado por assistText
    {} as never, // CourseAuthorizationService — no usado
    aiKeys,
  );
}

const dto = (over: Partial<TextAssistDto> = {}): TextAssistDto => ({
  text: 'Este texto tiene errores de ortografia.',
  action: 'corregir',
  ...over,
});

describe('AiFeaturesService.assistText (Fase 4)', () => {
  it('devuelve el result de la IA para un rol docente', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue(
        '{"result":"Este texto no tiene errores de ortografía."}',
      );
    const svc = makeService(complete);

    const res = await svc.assistText(dto(), 'u1', 'TEACHER');

    expect(res).toEqual({
      result: 'Este texto no tiene errores de ortografía.',
      action: 'corregir',
    });
    // el prompt lleva el texto pero NO PII ni la clave
    const [, system, user] = complete.mock.calls[0] as [string, string, string];
    expect(system).toContain('JSON');
    expect(user).toContain('errores de ortografia');
  });

  it('rol no docente → ForbiddenException, sin llamar a la IA', async () => {
    const complete = jest.fn();
    const svc = makeService(complete);

    await expect(svc.assistText(dto(), 'u1', 'STUDENT')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it('respuesta no-JSON de la IA → degradación: devuelve el texto original', async () => {
    const svc = makeService(jest.fn().mockResolvedValue('lo siento, no puedo'));
    const res = await svc.assistText(
      dto({ text: 'original' }),
      'u1',
      'TEACHER',
    );
    expect(res.result).toBe('original');
  });

  it('result vacío → devuelve el texto original', async () => {
    const svc = makeService(jest.fn().mockResolvedValue('{"result":"   "}'));
    const res = await svc.assistText(
      dto({ text: 'original' }),
      'u1',
      'TEACHER',
    );
    expect(res.result).toBe('original');
  });

  it('timeout / proveedor caído → 503 sin filtrar la clave', async () => {
    const svc = makeService(
      jest
        .fn()
        .mockRejectedValue(
          new ServiceUnavailableException('Gemini no disponible.'),
        ),
    );
    let caught: unknown;
    try {
      await svc.assistText(dto(), 'u1', 'TEACHER');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ServiceUnavailableException);
    const message = (caught as Error).message;
    expect(message).toBe('Gemini no disponible.');
    expect(message.toLowerCase()).not.toContain('key');
  });

  it('traducir usa targetLang en la instrucción', async () => {
    const complete = jest.fn().mockResolvedValue('{"result":"Hello"}');
    const svc = makeService(complete);
    await svc.assistText(
      dto({ action: 'traducir', targetLang: 'inglés', text: 'Hola' }),
      'u1',
      'TEACHER',
    );
    const userMsg = (complete.mock.calls[0] as [string, string, string])[2];
    expect(userMsg).toContain('inglés');
  });
});
