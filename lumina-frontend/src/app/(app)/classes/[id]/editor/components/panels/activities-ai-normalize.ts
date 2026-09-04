import type { AiActivityType } from '@/hooks/api/use-ai';

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function feedbackFrom(raw: Record<string, unknown>, explanation?: string) {
  const existing = asRecord(raw.retroalimentacion);
  const explicacion = asString(existing.explicacion) || explanation?.trim() || '';
  if (!explicacion) return undefined;
  return {
    explicacion,
    mostrarExplicacion: existing.mostrarExplicacion !== false,
  };
}

/** Une el payload de `/ai/activity` (o un objeto suelto) al formato Activity de Lumina. */
export function normalizeAiActivity(
  tipo: AiActivityType,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const source = asRecord(raw.activity).tipo ? asRecord(raw.activity) : raw;
  switch (tipo) {
    case 'quiz_multiple':
      return normalizeQuiz(source);
    case 'verdadero_falso':
      return normalizeTrueFalse(source);
    case 'completar_blancos':
      return normalizeFillBlanks(source);
    case 'short_answer':
      return normalizeShortAnswer(source);
    case 'arrastrar_soltar':
      return normalizeDragDrop(source);
    case 'emparejar':
      return normalizeMatch(source);
    case 'ordenar_pasos':
      return normalizeOrderSteps(source);
  }
}

function normalizeQuiz(raw: Record<string, unknown>): Record<string, unknown> {
  const fromPreguntas = asArray(raw.preguntas);
  const fromLegacy = asArray(raw.questions);
  const rows = fromPreguntas.length > 0 ? fromPreguntas : fromLegacy;

  const preguntas = rows.map((row, qi) => {
    const q = asRecord(row);
    const texto = asString(q.texto) || asString(q.question);
    const opcionesRaw = asArray(q.opciones).length ? asArray(q.opciones) : asArray(q.options);
    const correctIndex = asNumber(q.correctIndex, -1);
    const opciones = opcionesRaw.map((op, i) => {
      if (typeof op === 'string') {
        return { id: `op-${qi}-${i}`, texto: op, esCorrecta: i === correctIndex };
      }
      const rec = asRecord(op);
      return {
        id: asString(rec.id, `op-${qi}-${i}`),
        texto: asString(rec.texto),
        esCorrecta: asBoolean(rec.esCorrecta, i === correctIndex),
      };
    });
    if (opciones.length > 0 && !opciones.some((o) => o.esCorrecta)) {
      opciones[0] = { ...opciones[0], esCorrecta: true };
    }
    return {
      id: asString(q.id, `q-${qi}`),
      texto,
      opciones,
      puntos: asNumber(q.puntos, 10),
      ...(() => {
        const fb = feedbackFrom(q, asString(q.explanation));
        return fb ? { retroalimentacion: fb } : {};
      })(),
    };
  });

  return {
    tipo: 'quiz_multiple',
    preguntas:
      preguntas.length > 0
        ? preguntas
        : [{ id: 'q-0', texto: '', opciones: [], puntos: 10 }],
    deliveryMode: raw.deliveryMode === 'SYNCED' ? 'SYNCED' : 'AUTONOMOUS',
    layoutVariant: asString(raw.layoutVariant, 'classic-list'),
  };
}

function normalizeTrueFalse(raw: Record<string, unknown>): Record<string, unknown> {
  const questions = asArray(raw.questions);
  const firstQ = asRecord(questions[0]);
  const afirmacion =
    asString(raw.afirmacion) || asString(raw.question) || asString(firstQ.question) || asString(firstQ.texto);
  let respuestaCorrecta = asBoolean(raw.respuestaCorrecta, true);
  if (typeof raw.respuestaCorrecta !== 'boolean') {
    if (typeof firstQ.correctIndex === 'number') {
      respuestaCorrecta = firstQ.correctIndex === 0;
    } else if (typeof raw.correctIndex === 'number') {
      respuestaCorrecta = raw.correctIndex === 0;
    }
  }
  const fb = feedbackFrom(raw, asString(raw.explanation) || asString(firstQ.explanation));
  return {
    tipo: 'verdadero_falso',
    afirmacion,
    respuestaCorrecta,
    puntos: asNumber(raw.puntos, 5),
    ...(fb ? { retroalimentacion: fb } : {}),
  };
}

function normalizeFillBlanks(raw: Record<string, unknown>): Record<string, unknown> {
  let texto = asString(raw.texto) || asString(raw.question);
  const blancosRaw = asArray(raw.blancos);
  const answersFromOptions = asArray(raw.options).filter((v): v is string => typeof v === 'string');

  if (!texto.includes('{{blank:') && texto.includes('____')) {
    let i = 0;
    texto = texto.replace(/_{3,}/g, () => {
      i += 1;
      return `{{blank:b${i}}}`;
    });
  }

  const idsInText = [...texto.matchAll(/\{\{blank:([^}]+)\}\}/g)].map((m) => m[1]);
  const blancos =
    idsInText.length > 0
      ? idsInText.map((id, i) => {
          const existing = blancosRaw
            .map(asRecord)
            .find((b) => asString(b.id) === id);
          return {
            id,
            respuesta: asString(existing?.respuesta, answersFromOptions[i] ?? ''),
            ignorarMayusculas: existing?.ignorarMayusculas !== false,
          };
        })
      : blancosRaw.map((b, i) => {
          const rec = asRecord(b);
          return {
            id: asString(rec.id, `b${i + 1}`),
            respuesta: asString(rec.respuesta, answersFromOptions[i] ?? ''),
            ignorarMayusculas: rec.ignorarMayusculas !== false,
          };
        });

  if (!texto.includes('{{blank:') && blancos.length > 0) {
    texto = [texto, ...blancos.map((b) => `{{blank:${b.id}}}`)].filter(Boolean).join(' ');
  }

  const fb = feedbackFrom(raw, asString(raw.explanation));
  return {
    tipo: 'completar_blancos',
    texto,
    blancos,
    puntos: asNumber(raw.puntos, 10),
    ...(fb ? { retroalimentacion: fb } : {}),
  };
}

function normalizeShortAnswer(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    tipo: 'short_answer',
    question: asString(raw.question) || asString(raw.pregunta),
    expectedAnswer: asString(raw.expectedAnswer) || asString(raw.respuesta),
    caseSensitive: asBoolean(raw.caseSensitive, false),
    maxLength: asNumber(raw.maxLength, 200),
    ...(asString(raw.hint) ? { hint: asString(raw.hint) } : {}),
  };
}

function normalizeDragDrop(raw: Record<string, unknown>): Record<string, unknown> {
  const items = asArray(raw.items).map((item, i) => {
    const rec = asRecord(item);
    return { id: asString(rec.id, `i${i + 1}`), texto: asString(rec.texto) };
  });
  const itemIds = new Set(items.map((it) => it.id));
  const zonas = asArray(raw.zonas).map((zona, i) => {
    const rec = asRecord(zona);
    return {
      id: asString(rec.id, `z${i + 1}`),
      etiqueta: asString(rec.etiqueta),
      itemsCorrectos: asArray(rec.itemsCorrectos)
        .filter((id): id is string => typeof id === 'string' && itemIds.has(id)),
    };
  });
  return {
    tipo: 'arrastrar_soltar',
    instruccion: asString(raw.instruccion, 'Arrastra cada elemento a la categoría correcta.'),
    items,
    zonas,
    puntos: asNumber(raw.puntos, 10),
  };
}

function normalizeMatch(raw: Record<string, unknown>): Record<string, unknown> {
  const pares = asArray(raw.pares).map((par, i) => {
    const rec = asRecord(par);
    const izq = asRecord(rec.izquierda);
    const der = asRecord(rec.derecha);
    return {
      id: asString(rec.id, `par-${i + 1}`),
      izquierda: { texto: asString(izq.texto) },
      derecha: { texto: asString(der.texto) },
    };
  });
  return {
    tipo: 'emparejar',
    instruccion: asString(raw.instruccion, 'Empareja cada concepto con su definición.'),
    pares,
    puntos: asNumber(raw.puntos, 10),
  };
}

function normalizeOrderSteps(raw: Record<string, unknown>): Record<string, unknown> {
  const pasos = asArray(raw.pasos).map((paso, i) => {
    const rec = asRecord(paso);
    return {
      id: asString(rec.id, `s${i + 1}`),
      contenido: asString(rec.contenido),
      ordenCorrecto: asNumber(rec.ordenCorrecto, i + 1),
    };
  });
  return {
    tipo: 'ordenar_pasos',
    instruccion: asString(raw.instruccion, 'Ordena los pasos del proceso correctamente.'),
    pasos,
    puntos: asNumber(raw.puntos, 10),
  };
}

export function aiActivityHasUsableContent(content: Record<string, unknown>): boolean {
  const tipo = asString(content.tipo);
  if (tipo === 'quiz_multiple') {
    return asArray(content.preguntas).some((q) => asString(asRecord(q).texto).trim());
  }
  if (tipo === 'verdadero_falso') {
    return asString(content.afirmacion).trim().length > 0;
  }
  if (tipo === 'completar_blancos') {
    return asString(content.texto).trim().length > 0 && asArray(content.blancos).length > 0;
  }
  if (tipo === 'short_answer') {
    return asString(content.question).trim().length > 0;
  }
  if (tipo === 'arrastrar_soltar') {
    return asArray(content.items).length > 0 && asArray(content.zonas).length > 0;
  }
  if (tipo === 'emparejar') {
    return asArray(content.pares).length > 0;
  }
  if (tipo === 'ordenar_pasos') {
    return asArray(content.pasos).length > 0;
  }
  return false;
}

export function activityTitleFromContent(content: Record<string, unknown>): string {
  const firstPregunta = asArray(content.preguntas)[0];
  const preguntaTexto = asString(asRecord(firstPregunta).texto);
  const textoPlano = asString(content.texto).replace(/\{\{blank:[^}]+\}\}/g, '____');
  const candidates = [
    preguntaTexto,
    asString(content.afirmacion),
    asString(content.question),
    asString(content.pregunta),
    textoPlano,
    asString(content.instruccion),
  ];
  const title = candidates.find((c) => c.trim())?.trim() ?? '';
  return title ? title.slice(0, 60) : 'Actividad (IA)';
}

export const AI_ACTIVITY_OPTIONS: { value: AiActivityType; label: string; hint: string }[] = [
  { value: 'quiz_multiple', label: 'Quiz opción múltiple', hint: 'Preguntas con 4 opciones y una correcta.' },
  { value: 'verdadero_falso', label: 'Verdadero / Falso', hint: 'Una afirmación para evaluar.' },
  { value: 'completar_blancos', label: 'Llenar espacios', hint: 'Texto con huecos y respuestas.' },
  { value: 'short_answer', label: 'Respuesta corta', hint: 'Pregunta abierta con respuesta esperada.' },
  { value: 'arrastrar_soltar', label: 'Drag & Drop', hint: 'Elementos que se clasifican en zonas.' },
  { value: 'emparejar', label: 'Emparejar', hint: 'Pares concepto–definición.' },
  { value: 'ordenar_pasos', label: 'Ordenar pasos', hint: 'Secuencia de un proceso.' },
];

export function defaultCountForAiActivity(tipo: AiActivityType, full: boolean): number {
  switch (tipo) {
    case 'quiz_multiple':
      return full ? 5 : 1;
    case 'verdadero_falso':
    case 'short_answer':
      return 1;
    case 'completar_blancos':
      return full ? 5 : 2;
    case 'arrastrar_soltar':
      return full ? 8 : 4;
    case 'emparejar':
      return full ? 6 : 3;
    case 'ordenar_pasos':
      return full ? 6 : 4;
  }
}
