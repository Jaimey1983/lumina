import { formatProblem } from './format';
import { createRng } from './rng';
import { buildProblem, clampGrado, defaultSinLlevar } from './rules';
import type { GenerateMathOptions, GeneratedMathActivity } from './types';

export function generateMathActivities(options: GenerateMathOptions): GeneratedMathActivity[] {
  const grado = clampGrado(options.grado);
  const cantidad = Math.min(40, Math.max(1, Math.round(options.cantidad)));
  const formato = options.formato ?? 'quiz_multiple';
  const sinLlevar = options.sinLlevar ?? defaultSinLlevar(grado);
  const rng = createRng(options.seed);
  const seen = new Set<string>();
  const meta = { generador: 'matematicas' as const, tema: options.tema, grado };

  const items: GeneratedMathActivity[] = [];
  for (let i = 0; i < cantidad; i++) {
    const problem = buildProblem(rng, options.tema, grado, sinLlevar, seen);
    items.push(formatProblem(problem, formato, meta, rng));
  }
  return items;
}
