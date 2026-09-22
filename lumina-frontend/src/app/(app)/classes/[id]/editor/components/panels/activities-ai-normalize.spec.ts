import { describe, expect, it } from 'vitest';

import {
  AI_ACTIVITY_OPTIONS,
  activityTitleFromContent,
  aiActivityHasUsableContent,
  defaultCountForAiActivity,
  normalizeAiActivity,
} from './activities-ai-normalize';

describe('normalizeAiActivity', () => {
  it('convierte FillInTheBlanks con ____ al formato completar_blancos', () => {
    const activity = normalizeAiActivity('completar_blancos', {
      question: 'La capital de Francia es ____.',
      options: ['París'],
    });
    expect(activity.tipo).toBe('completar_blancos');
    expect(activity.texto).toBe('La capital de Francia es {{blank:b1}}.');
    expect(activity.blancos).toEqual([
      { id: 'b1', respuesta: 'París', ignorarMayusculas: true },
    ]);
  });

  it('mapea TrueFalse desde questions[] del endpoint legado', () => {
    const activity = normalizeAiActivity('verdadero_falso', {
      questions: [
        {
          question: 'El agua hierve a 100 °C.',
          options: ['Verdadero', 'Falso'],
          correctIndex: 0,
          explanation: 'A presión normal.',
        },
      ],
    });
    expect(activity).toMatchObject({
      tipo: 'verdadero_falso',
      afirmacion: 'El agua hierve a 100 °C.',
      respuestaCorrecta: true,
    });
  });

  it('arma quiz_multiple desde questions[] si no hay preguntas', () => {
    const activity = normalizeAiActivity('quiz_multiple', {
      questions: [
        {
          question: '¿2+2?',
          options: ['3', '4', '5', '6'],
          correctIndex: 1,
        },
      ],
    });
    expect(activity.tipo).toBe('quiz_multiple');
    const preguntas = activity.preguntas as { texto: string; opciones: { texto: string; esCorrecta: boolean }[] }[];
    expect(preguntas[0].texto).toBe('¿2+2?');
    expect(preguntas[0].opciones[1].esCorrecta).toBe(true);
  });

  it('completa ids faltantes en emparejar y arrastrar', () => {
    const match = normalizeAiActivity('emparejar', {
      pares: [{ izquierda: { texto: 'Gato' }, derecha: { texto: 'Felino' } }],
    });
    expect((match.pares as { id: string }[])[0].id).toBe('par-1');

    const drag = normalizeAiActivity('arrastrar_soltar', {
      items: [{ texto: 'Manzana' }],
      zonas: [{ etiqueta: 'Frutas', itemsCorrectos: ['i1'] }],
    });
    expect((drag.items as { id: string }[])[0].id).toBe('i1');
    expect((drag.zonas as { itemsCorrectos: string[] }[])[0].itemsCorrectos).toEqual(['i1']);
  });
});

describe('aiActivityHasUsableContent', () => {
  it('rechaza un quiz sin texto en las preguntas', () => {
    expect(
      aiActivityHasUsableContent({
        tipo: 'quiz_multiple',
        preguntas: [{ id: 'q-0', texto: '', opciones: [] }],
      }),
    ).toBe(false);
  });
});

describe('activityTitleFromContent', () => {
  it('usa afirmacion, question o instruccion según el tipo', () => {
    expect(activityTitleFromContent({ afirmacion: 'El sol es una estrella' })).toBe(
      'El sol es una estrella',
    );
    expect(activityTitleFromContent({ question: '¿Qué es un átomo?' })).toBe(
      '¿Qué es un átomo?',
    );
    expect(activityTitleFromContent({ instruccion: 'Ordena los pasos' })).toBe(
      'Ordena los pasos',
    );
  });
});

// ─── J8 — catálogo completo de 22 tipos ────────────────────────────────────────

const J8_TYPES: AiActivityType[] = [
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

type AiActivityType = Parameters<typeof normalizeAiActivity>[0];

describe('J8 — AI_ACTIVITY_OPTIONS / defaultCountForAiActivity cubren los 22 tipos', () => {
  it('AI_ACTIVITY_OPTIONS tiene exactamente 22 entradas, sin duplicados', () => {
    expect(AI_ACTIVITY_OPTIONS).toHaveLength(22);
    const values = AI_ACTIVITY_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(22);
  });

  it.each(J8_TYPES)('defaultCountForAiActivity("%s") devuelve un número positivo en ambos modos', (tipo) => {
    expect(defaultCountForAiActivity(tipo, false)).toBeGreaterThan(0);
    expect(defaultCountForAiActivity(tipo, true)).toBeGreaterThan(0);
  });
});

describe('normalizeAiActivity — clásicas restantes (J8)', () => {
  it('video_interactivo — nunca inventa una URL real, aunque la IA la mande', () => {
    const activity = normalizeAiActivity('video_interactivo', {
      urlVideo: 'https://youtube.com/watch?v=inventado',
      preguntas: [{ tiempoSegundos: 20, pregunta: '¿Qué pasó?', opciones: [{ texto: 'A', esCorrecta: true }, { texto: 'B' }] }],
    });
    expect(activity.urlVideo).toBe('');
    const preguntas = activity.preguntas as { id: string; opciones: { esCorrecta: boolean }[] }[];
    expect(preguntas[0].id).toBe('q1');
    expect(preguntas[0].opciones.some((o) => o.esCorrecta)).toBe(true);
  });

  it('encuesta_viva — completa con 2 opciones por defecto si la IA manda menos', () => {
    const activity = normalizeAiActivity('encuesta_viva', { pregunta: '¿Cuál prefieres?', opciones: [] });
    expect((activity.opciones as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it('nube_palabras — usa una instrucción por defecto si la IA no manda nada', () => {
    const activity = normalizeAiActivity('nube_palabras', {});
    expect(typeof activity.instruccion).toBe('string');
    expect((activity.instruccion as string).length).toBeGreaterThan(0);
  });
});

describe('normalizeAiActivity — Grupo 4 (J8)', () => {
  it('anagrama y sopa_letras — mayúsculas, sin palabras vacías', () => {
    const anagrama = normalizeAiActivity('anagrama', { palabras: [{ texto: 'colombia', pista: 'país' }, { texto: '' }] });
    expect(anagrama.palabras).toEqual([{ texto: 'COLOMBIA', pista: 'país' }]);

    const sopa = normalizeAiActivity('sopa_letras', { palabras: [{ texto: 'ciencia' }] });
    expect((sopa.palabras as { texto: string }[])[0].texto).toBe('CIENCIA');
  });

  it('clasificar — items con categoriaId inválida caen en la primera categoría', () => {
    const activity = normalizeAiActivity('clasificar', {
      categorias: [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }],
      items: [{ texto: 'x', categoriaId: 'inexistente' }],
    });
    expect((activity.items as { categoriaId: string }[])[0].categoriaId).toBe('a');
  });

  it('memoria — descarta pares sin ambos lados', () => {
    const activity = normalizeAiActivity('memoria', {
      pares: [
        { lado1: { texto: 'Gato' }, lado2: { texto: '' } },
        { lado1: { texto: 'Perro' }, lado2: { texto: 'Dog' } },
      ],
    });
    expect(activity.pares).toEqual([{ id: 'par-2', lado1: { texto: 'Perro' }, lado2: { texto: 'Dog' } }]);
  });

  it('puzzle_imagen — siempre imagen vacía, no inventa una URL', () => {
    const activity = normalizeAiActivity('puzzle_imagen', { notaDocente: 'busca una foto de un volcán' });
    expect(activity.imagen).toBe('');
  });

  it('abrir_caja — deriva filas/columnas del número de cajas', () => {
    const seis = normalizeAiActivity('abrir_caja', {
      cajas: Array.from({ length: 6 }, (_, i) => ({ contenido: { texto: `c${i}`, esCorrecta: i % 2 === 0 } })),
    });
    expect(seis.configuracion).toMatchObject({ filas: 2, columnas: 3 });

    const nueve = normalizeAiActivity('abrir_caja', {
      cajas: Array.from({ length: 9 }, (_, i) => ({ contenido: { texto: `c${i}` } })),
    });
    expect(nueve.configuracion).toMatchObject({ filas: 3, columnas: 4 });
  });

  it('ahorcado — una sola palabra, mayúsculas, sin espacios', () => {
    const activity = normalizeAiActivity('ahorcado', { palabra: ' rio magdalena ', pista: 'el más largo de Colombia' });
    expect((activity.configuracion as { palabra: string }).palabra).toBe('RIOMAGDALENA');
  });

  it('puzzle_palabras — descarta oraciones de menos de 3 palabras', () => {
    const activity = normalizeAiActivity('puzzle_palabras', {
      oraciones: [{ texto: 'Sol' }, { texto: 'El agua es vida' }],
    });
    expect(activity.oraciones).toEqual([{ texto: 'El agua es vida' }]);
  });

  it('globos y topo — asegura exactamente una opción correcta', () => {
    const globos = normalizeAiActivity('globos', {
      preguntas: [{ enunciado: '¿2+2?', opciones: [{ texto: '4' }, { texto: '5' }] }],
    });
    const opcionesGlobos = (globos.preguntas as { opciones: { correcta: boolean }[] }[])[0].opciones;
    expect(opcionesGlobos.filter((o) => o.correcta)).toHaveLength(1);

    const topo = normalizeAiActivity('topo', {
      preguntas: [{ enunciado: '¿3x3?', opciones: [{ texto: '9', correcta: true }, { texto: '6' }] }],
    });
    const opcionesTopo = (topo.preguntas as { opciones: { correcta: boolean }[] }[])[0].opciones;
    expect(opcionesTopo.filter((o) => o.correcta)).toHaveLength(1);
  });
});

describe('normalizeAiActivity — crucigrama (motor de cruce determinista)', () => {
  it('intersecta dos palabras que comparten una letra sin conflicto', () => {
    const activity = normalizeAiActivity('crucigrama', {
      palabras: [
        { texto: 'sol', pista: 'Estrella' },
        { texto: 'luna', pista: 'Satélite' },
      ],
    });
    const palabras = activity.palabras as {
      texto: string;
      direccion: 'horizontal' | 'vertical';
      fila: number;
      columna: number;
    }[];
    expect(palabras).toHaveLength(2);
    expect(palabras[0].texto).toBe('SOL');
    expect(palabras[1].texto).toBe('LUNA');
    // Direcciones perpendiculares (se cruzan)
    expect(palabras[0].direccion).not.toBe(palabras[1].direccion);

    // Verificar que las celdas donde se cruzan tienen la misma letra
    const cellsOf = (p: (typeof palabras)[number]) =>
      Array.from({ length: p.texto.length }, (_, k) => ({
        fila: p.direccion === 'horizontal' ? p.fila : p.fila + k,
        columna: p.direccion === 'horizontal' ? p.columna + k : p.columna,
        letra: p.texto[k],
      }));
    const cellsA = cellsOf(palabras[0]);
    const cellsB = cellsOf(palabras[1]);
    for (const a of cellsA) {
      for (const b of cellsB) {
        if (a.fila === b.fila && a.columna === b.columna) {
          expect(a.letra).toBe(b.letra);
        }
      }
    }
  });

  it('normaliza fila/columna mínimas a 0 y quita tildes/espacios', () => {
    const activity = normalizeAiActivity('crucigrama', {
      palabras: [{ texto: 'árbol', pista: 'Planta' }],
    });
    const palabras = activity.palabras as { texto: string; fila: number; columna: number }[];
    expect(palabras[0].texto).toBe('ARBOL');
    expect(Math.min(...palabras.map((p) => p.fila))).toBe(0);
    expect(Math.min(...palabras.map((p) => p.columna))).toBe(0);
  });

  it('sin palabras válidas cae a un default con al menos una palabra', () => {
    const activity = normalizeAiActivity('crucigrama', { palabras: [{ texto: 'a' }] });
    expect((activity.palabras as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('normalizeAiActivity — historia_ramificada (layout por niveles)', () => {
  it('asigna editorX/editorY y conserva nodoInicial válido', () => {
    const activity = normalizeAiActivity('historia_ramificada', {
      nodoInicial: 'n1',
      nodos: [
        { id: 'n1', tipo: 'narracion', titulo: 'Inicio', contenido: { texto: 'texto' }, opciones: [{ id: 'op-a', texto: 'A' }, { id: 'op-b', texto: 'B' }] },
        { id: 'n2', tipo: 'final_bueno', titulo: 'Fin bueno', contenido: { texto: 'ganaste' } },
        { id: 'n3', tipo: 'final_malo', titulo: 'Fin malo', contenido: { texto: 'perdiste' } },
      ],
      conexiones: [
        { desdeNodoId: 'n1', opcionId: 'op-a', haciaNodoId: 'n2' },
        { desdeNodoId: 'n1', opcionId: 'op-b', haciaNodoId: 'n3' },
      ],
    });
    expect(activity.nodoInicial).toBe('n1');
    const nodos = activity.nodos as { id: string; tipo: string; editorX: number; editorY: number; opciones?: unknown[] }[];
    expect(nodos).toHaveLength(3);
    for (const n of nodos) {
      expect(typeof n.editorX).toBe('number');
      expect(typeof n.editorY).toBe('number');
    }
    const inicio = nodos.find((n) => n.id === 'n1')!;
    const finales = nodos.filter((n) => n.id !== 'n1');
    // Los finales están en un nivel posterior (Y mayor) que el nodo inicial
    for (const f of finales) {
      expect(f.editorY).toBeGreaterThan(inicio.editorY);
      expect(f.opciones).toBeUndefined();
    }
  });

  it('ignora conexiones que apuntan a nodos inexistentes', () => {
    const activity = normalizeAiActivity('historia_ramificada', {
      nodoInicial: 'n1',
      nodos: [{ id: 'n1', tipo: 'final_bueno', titulo: 'Fin', contenido: { texto: 'x' } }],
      conexiones: [{ desdeNodoId: 'n1', opcionId: 'op-a', haciaNodoId: 'no-existe' }],
    });
    expect(activity.conexiones).toEqual([]);
  });

  it('sin nodos cae a un default de un solo final', () => {
    const activity = normalizeAiActivity('historia_ramificada', {});
    expect((activity.nodos as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('aiActivityHasUsableContent — tipos nuevos (J8)', () => {
  it('acepta puzzle_imagen siempre (la imagen la sube el docente)', () => {
    expect(aiActivityHasUsableContent({ tipo: 'puzzle_imagen' })).toBe(true);
  });

  it('rechaza ahorcado sin palabra', () => {
    expect(
      aiActivityHasUsableContent({ tipo: 'ahorcado', configuracion: { palabra: '' } }),
    ).toBe(false);
  });

  it('acepta historia_ramificada con al menos un nodo', () => {
    expect(
      aiActivityHasUsableContent({ tipo: 'historia_ramificada', nodos: [{ id: 'n1' }] }),
    ).toBe(true);
  });
});
