import { evaluateActivityResponse } from './activity-scoring';

// ─── Fixtures de definición ───────────────────────────────────────────────────
//
// Definición mínima equivalente al slide real de producción:
// - Q0: opción correcta = "a"  (ID corto, editor antiguo)
// - Q1: opción correcta = UUID  (ID largo, editor actual)

const DEFINICION_LIMPIA = {
  tipo: 'video_interactivo',
  preguntas: [
    {
      id: 'q0',
      tiempoSegundos: 30,
      pregunta: 'Pregunta 0',
      opciones: [
        { id: 'a', texto: 'Opción A', esCorrecta: true },
        { id: 'b', texto: 'Opción B', esCorrecta: false },
        { id: 'c', texto: 'Opción C', esCorrecta: false },
        { id: 'd', texto: 'Opción D', esCorrecta: false },
      ],
    },
    {
      id: 'q1',
      tiempoSegundos: 30,
      pregunta: 'Pregunta 1',
      opciones: [
        {
          id: '7d45670f-d544-4297-8951-dec8e46b7244',
          texto: 'Opción UUID correcta',
          esCorrecta: true,
        },
        {
          id: 'otro-uuid-incorrecto',
          texto: 'Opción incorrecta',
          esCorrecta: false,
        },
      ],
    },
  ],
};

// Para el fixture histórico, la Q1 tiene el UUID que se ve en Prisma Studio
const DEFINICION_HISTORICA = {
  tipo: 'video_interactivo',
  preguntas: [
    {
      id: 'q0',
      tiempoSegundos: 30,
      pregunta: 'Pregunta 0',
      opciones: [
        { id: 'a', texto: 'Opción A', esCorrecta: true },
        { id: 'b', texto: 'Opción B', esCorrecta: false },
      ],
    },
    {
      id: 'q1',
      tiempoSegundos: 30,
      pregunta: 'Pregunta 1',
      opciones: [
        {
          id: 'd67d15fb-3647-4e40-95e5-d205cc5496ec',
          texto: 'Opción UUID producción',
          esCorrecta: true,
        },
        { id: 'otro', texto: 'Opción incorrecta', esCorrecta: false },
      ],
    },
  ],
};

// ─── Test 1: Dato limpio (nuevo formato, sin correct embebido) ─────────────────

describe('Fase 3 — Test 1: reconstrucción con dato limpio (nuevo formato)', () => {
  // Fixture: respuesta cruda como debería guardarse después del fix
  // Q0: responde "b" (incorrecto), Q1: responde el UUID correcto
  const RESPONSE_LIMPIA = {
    historial: [
      { answer: 'b', questionIndex: 0 },
      { answer: '7d45670f-d544-4297-8951-dec8e46b7244', questionIndex: 1 },
    ],
  };

  it('score = 2.5 (1 de 2 correctas — notaColombiana(1,2,true))', () => {
    const result = evaluateActivityResponse(
      'video_interactivo',
      DEFINICION_LIMPIA,
      RESPONSE_LIMPIA,
    );
    expect(result.score).toBe(2.5);
  });

  it('detail de questionIndex:0 es correct=false (respondió "b", correcta era "a")', () => {
    const result = evaluateActivityResponse(
      'video_interactivo',
      DEFINICION_LIMPIA,
      RESPONSE_LIMPIA,
    );
    const detail = result.details.find((d) => d.index === 0);
    expect(detail).toBeDefined();
    expect(detail.correct).toBe(false);
  });

  it('detail de questionIndex:1 es correct=true (respondió el UUID correcto)', () => {
    const result = evaluateActivityResponse(
      'video_interactivo',
      DEFINICION_LIMPIA,
      RESPONSE_LIMPIA,
    );
    const detail = result.details.find((d) => d.index === 1);
    expect(detail).toBeDefined();
    expect(detail.correct).toBe(true);
  });
});

// ─── Test 2: Dato sucio histórico (con correct embebido — workaround activo) ──

describe('Fase 3 — Test 2: reconstrucción con dato sucio histórico (formato viejo con correct embebido)', () => {
  // Fixture: response tal como está en Prisma Studio (con correct por pregunta + correct global)
  const RESPONSE_SUCIA = {
    correct: true,
    historial: [
      { answer: 'a', correct: true, questionIndex: 0 },
      {
        answer: 'd67d15fb-3647-4e40-95e5-d205cc5496ec',
        correct: true,
        questionIndex: 1,
      },
    ],
  };

  it('no lanza error — normalizeVideoAnswers ignora el campo correct embebido (workaround sigue vivo)', () => {
    expect(() =>
      evaluateActivityResponse(
        'video_interactivo',
        DEFINICION_HISTORICA,
        RESPONSE_SUCIA,
      ),
    ).not.toThrow();
  });

  it('score = 5.0 (ambas correctas — consistente con el score persistido en producción)', () => {
    const result = evaluateActivityResponse(
      'video_interactivo',
      DEFINICION_HISTORICA,
      RESPONSE_SUCIA,
    );
    expect(result.score).toBe(5.0);
  });
});
