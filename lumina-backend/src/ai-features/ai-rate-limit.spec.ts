import 'reflect-metadata';
import { AiFeaturesController } from './ai-features.controller';
import { CourseAiController } from './course-ai.controller';

/**
 * Rate limiting en los endpoints de IA (riesgo urgente de Fase 1).
 *
 * `@Throttle({ default: { limit, ttl } })` de `@nestjs/throttler` v6 guarda el
 * límite y el ttl como metadata bajo estas claves (`THROTTLER:LIMIT` + nombre
 * del throttler, aquí `default`). Verificamos que ambos controllers de
 * inferencia declaran un tope por debajo del global (10/min → aquí subimos a
 * 20/min con ventana de 60 s) para que cada request no dispare una llamada de
 * generación cara sin control.
 */
const THROTTLER_LIMIT_DEFAULT = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_DEFAULT = 'THROTTLER:TTLdefault';

describe('Rate limiting — endpoints de IA', () => {
  it.each([
    ['AiFeaturesController', AiFeaturesController],
    ['CourseAiController', CourseAiController],
  ])('%s declara @Throttle a nivel de clase', (_name, controller) => {
    const limit = Reflect.getMetadata(THROTTLER_LIMIT_DEFAULT, controller) as
      | number
      | undefined;
    const ttl = Reflect.getMetadata(THROTTLER_TTL_DEFAULT, controller) as
      | number
      | undefined;

    expect(typeof limit).toBe('number');
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(30);
    expect(ttl).toBe(60_000);
  });
});
