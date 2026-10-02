import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIVITY_DRAFT_KEY } from '@lumina/scoring';
import { eventoDeRespuesta } from './respuesta-a-evento';

const vf = { tipo: 'verdadero_falso', afirmacion: 'x', respuestaCorrecta: true };
const quiz = {
  tipo: 'quiz_multiple',
  preguntas: [
    { id: 'p1', pregunta: 'a', opciones: ['x', 'y'], respuestaCorrecta: 0 },
    { id: 'p2', pregunta: 'b', opciones: ['x', 'y'], respuestaCorrecta: 1 },
  ],
};

describe('eventoDeRespuesta (K7a, D10)', () => {
  it('binary: correcta / incorrecta', () => {
    expect(eventoDeRespuesta('verdadero_falso', vf, true)).toBe('respuesta_correcta');
    expect(eventoDeRespuesta('verdadero_falso', vf, false)).toBe('respuesta_incorrecta');
  });

  it('sin respuesta no emite', () => {
    expect(eventoDeRespuesta('verdadero_falso', vf, null)).toBeNull();
  });

  it('borrador no emite', () => {
    expect(eventoDeRespuesta('verdadero_falso', vf, { [ACTIVITY_DRAFT_KEY]: true })).toBeNull();
  });

  it('manual / participación / excluida no emiten', () => {
    expect(eventoDeRespuesta('short_answer', { tipo: 'short_answer' }, 'hola')).toBeNull();
    expect(eventoDeRespuesta('encuesta_viva', { tipo: 'encuesta_viva' }, 0)).toBeNull();
    expect(eventoDeRespuesta('ruleta', {}, 1)).toBeNull();
  });

  it('video_interactivo no emite (responde por pregunta)', () => {
    expect(eventoDeRespuesta('video_interactivo', {}, { questionIndex: 0 })).toBeNull();
  });

  it('es una función total: una respuesta de forma inesperada no lanza', () => {
    expect(() => eventoDeRespuesta('quiz_multiple', quiz, 'basura')).not.toThrow();
  });
});

describe('C1/C4: el booleano no sale a la red ni toca la nota', () => {
  it('respuesta-a-evento.ts solo importa de scoring la evaluación y no usa red', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/respuesta-a-evento.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const imports = [...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@lumina\/scoring'/g)]
      .flatMap((m) => m[1]!.split(',').map((x) => x.trim()));
    expect(imports.sort()).toEqual(['evaluateActivityResponse', 'isActivityDraftResponse']);
    expect(code).not.toMatch(/@\/lib\/api|\bfetch\(|socket|useMutation|useSaveProgress|\.score/);
  });
});

describe('K7a: respuesta → motor (flujo) sin tocar la nota', () => {
  it('una regla «respuesta_incorrecta → sumar» cambia la variable y nada más', async () => {
    const { ejecutarEvento } = await import('./interaction-runtime');
    const reglas = [
      {
        regla: {
          id: 'r', evento: 'respuesta_incorrecta' as const, condiciones: [], activa: true,
          acciones: [{ tipo: 'sumar_variable' as const, variableId: 'intentos', cantidad: 1 }],
        },
        origen: { tipo: 'bloque' as const, bloqueId: 'act1', slideId: 's1' },
      },
    ];
    const variables = [{ id: 'intentos', nombre: 'intentos', tipo: 'numero' as const, valorInicial: 0 }];
    const ev = eventoDeRespuesta('verdadero_falso', vf, false)!;
    const estado = ejecutarEvento({
      reglas, estado: null, variables, slides: [], navigate: null,
      evento: { tipo: ev, bloqueId: 'act1', slideId: 's1' },
    });
    expect(estado.variables.intentos).toBe(1);
    expect(Object.keys(estado).sort()).toEqual(['capasAbiertas', 'estados', 'respuestas', 'variables', 'visibles']);
    const bien = eventoDeRespuesta('verdadero_falso', vf, true)!;
    const estado2 = ejecutarEvento({
      reglas, estado, variables, slides: [], navigate: null,
      evento: { tipo: bien, bloqueId: 'act1', slideId: 's1' },
    });
    expect(estado2.variables.intentos).toBe(1);
  });
});
