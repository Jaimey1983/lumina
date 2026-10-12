import { describe, expect, it } from 'vitest';
import type {
  Activity,
  BalancearEcuacionActivity,
  DragDrop,
  FillBlanks,
  FormularCompuestoActivity,
  LivePoll,
  MatchPairs,
  MathAnswerActivity,
  OrderSteps,
  QuizMultiple,
  ShortAnswerActivity,
  TrueFalse,
  UbicarElementoActivity,
  VideoInteractive,
  WordCloud,
} from '@lumina/types/slide';

import {
  balancearEcuacionActivityTemplate,
  dragDropTemplate,
  fillBlanksTemplate,
  formularCompuestoActivityTemplate,
  livePollTemplate,
  matchPairsTemplate,
  orderStepsTemplate,
  quizMultipleTemplate,
  respuestaMatematicaTemplate,
  shortAnswerTemplate,
  trueFalseTemplate,
  ubicarElementoActivityTemplate,
  videoInteractiveTemplate,
  wordCloudTemplate,
} from '../../_classic/activity-templates.js';
import { resumirProblemas } from './problemas.js';
import { tiposValidables, validarActividad } from './validacion.js';

const errores = (a: Activity) => validarActividad(a).filter((p) => p.nivel === 'error').map((p) => p.mensaje);
const avisos = (a: Activity) => validarActividad(a).filter((p) => p.nivel === 'aviso').map((p) => p.mensaje);
const nueva = <A extends Activity>(f: () => Activity): A => structuredClone(f()) as A;

describe('validarActividad — despacho', () => {
  it('sin actividad o sin validador devuelve []', () => {
    expect(validarActividad(null)).toEqual([]);
    expect(validarActividad({ tipo: 'inventada' } as unknown as Activity)).toEqual([]);
  });
  it('las plantillas de cada actividad clásica son jugables (sin errores)', () => {
    const plantillas: Activity[] = [
      quizMultipleTemplate(),
      trueFalseTemplate(),
      shortAnswerTemplate(),
      respuestaMatematicaTemplate(),
      fillBlanksTemplate(),
      dragDropTemplate(),
      matchPairsTemplate(),
      orderStepsTemplate(),
      videoInteractiveTemplate(),
      livePollTemplate(),
      wordCloudTemplate(),
      balancearEcuacionActivityTemplate(),
      ubicarElementoActivityTemplate(),
      formularCompuestoActivityTemplate(),
    ] as Activity[];
    for (const p of plantillas) {
      const e = errores(p);
      // Estas dos nacen sin completar (sin dirección / sin respuesta modelo): aún no son jugables, y la validación debe decirlo.
      if (p.tipo === 'video_interactivo' || p.tipo === 'respuesta_matematica') continue;
      expect(e, p.tipo).toEqual([]);
    }
    expect(tiposValidables().length).toBeGreaterThanOrEqual(14);
  });
  it('resumirProblemas separa errores de avisos y solo los errores impiden jugar', () => {
    expect(resumirProblemas([])).toEqual({ errores: 0, avisos: 0, jugable: true });
    expect(resumirProblemas([{ nivel: 'aviso', mensaje: 'x' }])).toEqual({ errores: 0, avisos: 1, jugable: true });
    expect(resumirProblemas([{ nivel: 'error', mensaje: 'x' }, { nivel: 'aviso', mensaje: 'y' }])).toEqual({
      errores: 1,
      avisos: 1,
      jugable: false,
    });
  });
});

describe('quiz_multiple', () => {
  it('sin preguntas', () => {
    const a = nueva<QuizMultiple>(quizMultipleTemplate);
    a.preguntas = [];
    expect(errores(a)).toEqual(['No tiene preguntas.']);
  });
  it('enunciado vacío, menos de 2 opciones y ninguna correcta', () => {
    const a = nueva<QuizMultiple>(quizMultipleTemplate);
    a.preguntas[0]!.texto = ' ';
    a.preguntas[0]!.opciones = [{ id: 'o1', texto: 'Sola', esCorrecta: false }];
    const e = errores(a);
    expect(e).toContain('La pregunta no tiene enunciado.');
    expect(e).toContain('Necesita al menos 2 opciones.');
    expect(e).toContain('Ninguna opción está marcada como correcta.');
    expect(validarActividad(a)[0]!.campo).toBe('Pregunta 1');
  });
  it('varias correctas en respuesta única, opciones vacías y repetidas son avisos', () => {
    const a = nueva<QuizMultiple>(quizMultipleTemplate);
    a.preguntas[0]!.multipleRespuesta = false;
    a.preguntas[0]!.opciones = [
      { id: 'a', texto: 'Igual', esCorrecta: true },
      { id: 'b', texto: 'igual', esCorrecta: true },
      { id: 'c', texto: '', esCorrecta: false },
    ];
    expect(errores(a)).toEqual([]);
    const v = avisos(a);
    expect(v).toContain('Hay opciones sin texto.');
    expect(v.some((m) => m.startsWith('Opciones repetidas'))).toBe(true);
    expect(v).toContain('Hay varias correctas pero la pregunta es de respuesta única.');
  });
  it('varias correctas con respuesta múltiple no avisa', () => {
    const a = nueva<QuizMultiple>(quizMultipleTemplate);
    a.preguntas[0]!.multipleRespuesta = true;
    a.preguntas[0]!.opciones = [
      { id: 'a', texto: 'Uno', esCorrecta: true },
      { id: 'b', texto: 'Dos', esCorrecta: true },
    ];
    expect(validarActividad(a)).toEqual([]);
  });
});

describe('verdadero_falso y short_answer', () => {
  it('afirmación vacía', () => {
    const a = nueva<TrueFalse>(trueFalseTemplate);
    a.afirmacion = '  ';
    expect(errores(a)).toEqual(['La afirmación está vacía.']);
  });
  it('short_answer: pregunta vacía, largo inválido y sin referencia', () => {
    const a = nueva<ShortAnswerActivity>(shortAnswerTemplate);
    a.question = '';
    a.maxLength = 0;
    a.expectedAnswer = '';
    expect(errores(a)).toEqual(['La pregunta está vacía.', 'El largo máximo de la respuesta debe ser al menos 1.']);
    expect(avisos(a)).toEqual(['Sin respuesta de referencia para quien califique.']);
  });
});

describe('respuesta_matematica', () => {
  it('numérica: vacía, no numérica y válida', () => {
    const a = nueva<MathAnswerActivity>(respuestaMatematicaTemplate);
    a.modo = 'numerico';
    a.respuesta = '';
    expect(errores(a)).toContain('Falta la respuesta modelo.');
    a.respuesta = 'doce';
    expect(errores(a)).toContain('La respuesta modelo no es un número.');
    a.respuesta = '3/4';
    expect(errores(a)).toEqual([]);
    a.respuesta = '3,14';
    expect(errores(a)).toEqual([]);
  });
  it('algebraica: expresión ilegible', () => {
    const a = nueva<MathAnswerActivity>(respuestaMatematicaTemplate);
    a.modo = 'algebraico';
    a.respuesta = '2(x+';
    expect(errores(a)[0]).toMatch(/^La respuesta modelo no se puede leer: /);
    a.respuesta = '2(x+1)';
    expect(errores(a)).toEqual([]);
  });
  it('tolerancia negativa', () => {
    const a = nueva<MathAnswerActivity>(respuestaMatematicaTemplate);
    a.tolerancia = -1;
    expect(errores(a)).toContain('La tolerancia no puede ser negativa.');
  });
});

describe('completar_blancos', () => {
  it('marcador sin definición, blanco sin marcador y sin respuesta', () => {
    const a = nueva<FillBlanks>(fillBlanksTemplate);
    a.texto = 'Hierve a {{blank:b1}} y {{blank:fantasma}}.';
    a.blancos = [
      { id: 'b1', respuesta: '' },
      { id: 'b2', respuesta: '100' },
    ];
    const e = errores(a);
    expect(e).toContain('El texto marca el blanco «fantasma» pero no tiene respuesta.');
    expect(e).toContain('El blanco «b1» no tiene respuesta.');
    expect(avisos(a)).toContain('El blanco «b2» no aparece en el texto.');
  });
  it('sin blancos ni texto, e ids repetidos', () => {
    const a = nueva<FillBlanks>(fillBlanksTemplate);
    a.texto = '';
    a.blancos = [];
    expect(errores(a)).toEqual(['El texto está vacío.', 'No tiene blancos para completar.']);
    a.texto = '{{blank:x}}';
    a.blancos = [{ id: 'x', respuesta: 'a' }, { id: 'x', respuesta: 'b' }];
    expect(errores(a)).toContain('Hay blancos con el mismo identificador.');
  });
});

describe('arrastrar_soltar', () => {
  const base = (): DragDrop => {
    const a = nueva<DragDrop>(dragDropTemplate);
    a.items = [
      { id: 'i1', texto: 'Perro' },
      { id: 'i2', texto: 'Roble' },
    ];
    a.zonas = [
      { id: 'z1', etiqueta: 'Animales', itemsCorrectos: ['i1'] },
      { id: 'z2', etiqueta: 'Plantas', itemsCorrectos: ['i2'] },
    ];
    return a;
  };
  it('una actividad bien armada no tiene problemas', () => {
    expect(validarActividad(base())).toEqual([]);
  });
  it('sin elementos ni zonas', () => {
    const a = base();
    a.items = [];
    a.zonas = [];
    expect(errores(a)).toEqual(['No tiene elementos para arrastrar.', 'No tiene zonas donde soltar.']);
  });
  it('zona que apunta a un elemento inexistente y capacidad imposible', () => {
    const a = base();
    a.zonas[0]!.itemsCorrectos = ['i1', 'nada'];
    a.zonas[0]!.capacidadMaxima = 1;
    const e = errores(a);
    expect(e).toContain('Apunta a un elemento que no existe («nada»).');
    expect(e).toContain('Su capacidad (1) es menor que sus 2 elementos correctos.');
  });
  it('avisos: una sola zona, distractor, elemento en dos zonas y zona vacía', () => {
    const a = base();
    a.zonas[1]!.itemsCorrectos = ['i1'];
    expect(avisos(a)).toContain('«Perro» pertenece a 2 zonas.');
    expect(avisos(a)).toContain('«Roble» no pertenece a ninguna zona (será un distractor).');
    a.zonas = [{ id: 'z1', etiqueta: 'Solo', itemsCorrectos: [] }];
    expect(avisos(a)).toContain('Con una sola zona no hay nada que distinguir.');
    expect(avisos(a)).toContain('No tiene ningún elemento correcto.');
  });
});

describe('emparejar', () => {
  it('menos de 2 pares y lados vacíos', () => {
    const a = nueva<MatchPairs>(matchPairsTemplate);
    a.pares = [{ id: 'p', izquierda: { texto: 'A' }, derecha: {} }];
    const e = errores(a);
    expect(e).toContain('Necesita al menos 2 pares.');
    expect(e).toContain('Tiene un lado vacío.');
    expect(validarActividad(a).find((p) => p.mensaje === 'Tiene un lado vacío.')!.campo).toBe('Par 1');
  });
  it('izquierdos repetidos es un aviso; la imagen cuenta como lado', () => {
    const a = nueva<MatchPairs>(matchPairsTemplate);
    a.pares = [
      { id: 'p1', izquierda: { texto: 'Gato' }, derecha: { imagen: 'g.png' } },
      { id: 'p2', izquierda: { texto: 'gato' }, derecha: { texto: 'Felino' } },
    ];
    expect(errores(a)).toEqual([]);
    expect(avisos(a)[0]).toBe('Hay elementos repetidos a la izquierda: «gato».');
  });
});

describe('ordenar_pasos', () => {
  it('posiciones repetidas, con huecos y paso vacío', () => {
    const a = nueva<OrderSteps>(orderStepsTemplate);
    a.pasos = [
      { id: 'a', contenido: 'Uno', ordenCorrecto: 1 },
      { id: 'b', contenido: 'Dos', ordenCorrecto: 1 },
    ];
    expect(errores(a)).toEqual(['Hay dos pasos con la misma posición correcta.']);
    a.pasos = [
      { id: 'a', contenido: 'Uno', ordenCorrecto: 1 },
      { id: 'b', contenido: '', ordenCorrecto: 3 },
    ];
    expect(errores(a)).toEqual(['El paso está vacío.', 'Las posiciones correctas deben ser 1, 2, 3… sin huecos.']);
    a.pasos = [a.pasos[0]!];
    expect(errores(a)).toContain('Necesita al menos 2 pasos.');
  });
});

describe('video_interactivo', () => {
  it('sin dirección y sin preguntas', () => {
    const a = nueva<VideoInteractive>(videoInteractiveTemplate);
    a.urlVideo = '';
    a.preguntas = [];
    expect(errores(a)).toEqual(['Falta la dirección del video.']);
    expect(avisos(a)).toEqual(['El video no tiene preguntas.']);
  });
  it('pregunta sin enunciado, sin correcta, y dos en el mismo segundo', () => {
    const a = nueva<VideoInteractive>(videoInteractiveTemplate);
    a.urlVideo = 'https://x.dev/v.mp4';
    const op = (id: string, c: boolean) => ({ id, texto: id, esCorrecta: c });
    a.preguntas = [
      { id: 'q1', tiempoSegundos: 5, pregunta: '', opciones: [op('a', false), op('b', false)] },
      { id: 'q2', tiempoSegundos: 5, pregunta: '¿?', opciones: [op('a', true), op('b', false)] },
    ];
    const e = errores(a);
    expect(e).toContain('La pregunta no tiene enunciado.');
    expect(e).toContain('Ninguna opción está marcada como correcta.');
    expect(avisos(a)).toContain('Dos preguntas aparecen en el mismo segundo.');
  });
});

describe('encuesta_viva y nube_palabras', () => {
  it('encuesta: pregunta vacía, pocas opciones, repetidas', () => {
    const a = nueva<LivePoll>(livePollTemplate);
    a.pregunta = '';
    a.opciones = [{ id: 'a', texto: 'Sí' }];
    expect(errores(a)).toEqual(['La pregunta está vacía.', 'Necesita al menos 2 opciones.']);
    a.pregunta = '¿?';
    a.opciones = [{ id: 'a', texto: 'Sí' }, { id: 'b', texto: 'sí' }];
    expect(errores(a)).toEqual([]);
    expect(avisos(a)[0]).toBe('Opciones repetidas: «sí».');
  });
  it('nube: instrucción y máximo por alumno', () => {
    const a = nueva<WordCloud>(wordCloudTemplate);
    a.instruccion = '';
    a.maxPalabrasPorUsuario = 0;
    expect(errores(a)).toEqual(['Falta la instrucción.', 'Cada alumno debe poder escribir al menos 1 palabra.']);
  });
});

describe('química', () => {
  it('balancear: vacía, sin flecha y válida', () => {
    const a = nueva<BalancearEcuacionActivity>(balancearEcuacionActivityTemplate);
    a.ecuacion = '';
    expect(errores(a)).toEqual(['Falta la ecuación.']);
    a.ecuacion = 'H2 + O2 H2O';
    expect(errores(a)[0]).toMatch(/^La ecuación no se puede leer: Falta flecha/);
    a.ecuacion = 'H2 + O2 -> H2O';
    expect(errores(a)).toEqual([]);
  });
  it('ubicar: símbolo, periodo y grupo fuera de rango, repetidos', () => {
    const a = nueva<UbicarElementoActivity>(ubicarElementoActivityTemplate);
    a.elementos = [
      { id: '1', symbol: '', periodo: 0, grupo: 19 },
      { id: '2', symbol: 'Na', periodo: 3, grupo: 1 },
      { id: '3', symbol: 'na', periodo: 3, grupo: 1 },
    ];
    const e = errores(a);
    expect(e).toContain('Falta el símbolo.');
    expect(e).toContain('El periodo debe estar entre 1 y 7.');
    expect(e).toContain('El grupo debe estar entre 1 y 18.');
    expect(avisos(a)).toEqual(['Símbolos repetidos: na.']);
    a.elementos = [];
    expect(errores(a)).toEqual(['No tiene elementos para ubicar.']);
  });
  it('formular: sin preguntas, sin enunciado ni fórmula', () => {
    const a = nueva<FormularCompuestoActivity>(formularCompuestoActivityTemplate);
    a.preguntas = [];
    expect(errores(a)).toEqual(['No tiene preguntas.']);
    a.preguntas = [{ id: 'q', enunciado: '', formula: '' }];
    expect(errores(a)).toEqual(['Falta el enunciado.', 'Falta la fórmula esperada.']);
  });
});
