/**
 * `@lumina/scoring` — fuente única del evaluador de actividades (Etapa 2).
 *
 * Portado tal cual desde `lumina-frontend/src/lib/activity-scoring.ts` (E2.1):
 * mismas funciones puras, misma lógica, mismas firmas públicas. NO reinterpretar.
 *
 * Consumidores (motor ÚNICO desde E6.3):
 *  - `lumina-frontend` — imports directos a `@lumina/scoring` (la fachada
 *    `lib/activity-scoring.ts` se borró en E5.5, `LUM-E5-SCORING-FACADE`).
 *  - `lumina-backend` — imports directos a `@lumina/scoring` (el espejo manual
 *    `src/classes/activity-scoring.ts` se borró en E6.3). Consumo CJS desde
 *    `dist/cjs/` (E6.1/E6.2).
 * Los fixtures de paridad viven en `./activity-scoring.fixtures.json` — fuente
 * ÚNICA desde E6.4, expuesta como `@lumina/scoring/fixtures`. Las copias de
 * frontend y backend se borraron.
 */

export type ActivityScoringKind =
  | 'binary'
  | 'partial'
  | 'manual'
  | 'participation'
  | 'exclude';

/**
 * ÚNICA fuente de verdad para convertir (correctas, total) en nota colombiana 0.0–5.0.
 *
 * DECISIÓN FIJADA (no cambiar sin migrar datos históricos primero):
 *   - Multiplicador: × 5 (consistente con la planilla ya existente en BD).
 *   - Mínimo pedagógico: si el estudiante respondió pero todo estuvo mal, la nota
 *     no baja de 1.0 (no hay "cero" pedagógico salvo no-respuesta).
 *   - No respondió → 0 (política de ausencia se resuelve en el denominador, Fase 1,
 *     no aquí: esta función solo puntúa lo que SÍ se intentó).
 *
 * Todo evaluador (overlay, vivo, autónomo, Edu, XP) DEBE llamar esta función.
 * Ningún otro archivo debe tener su propia fórmula de conversión a nota.
 */
export function notaColombiana(
  correctas: number,
  total: number,
  respondio: boolean,
): number {
  if (!respondio) return 0;
  if (total <= 0) return 0;
  const bruta = (correctas / total) * 5;
  return Math.round(Math.max(1, bruta) * 10) / 10;
}

/**
 * Único lugar que decide cómo cuenta cada `activityType` (campo `tipo` del slide).
 *
 * Claves = `Activity['tipo']` reales del editor (no alias del plan).
 *
 * Casos condicionales (la kind de la tabla es el default; el evaluador
 * degrada a `score: null` / comportamiento `exclude` según el contenido):
 * - `abrir_caja`: si NINGUNA caja define `esCorrecta` → `score: null` (no
 *   hay nada que el docente califique después; no es `manual`).
 * - `historia_ramificada`: nodos `final_bueno`/`final_malo` o preguntas con
 *   `esCorrecta`; si el slide no tiene criterio → `score: null`.
 * - `anagrama`: 1 palabra = un solo detail (equivalente a binary); varias
 *   rondas = partial. La kind de la tabla es `partial`.
 * - `ahorcado`: perder = 1.0; ganar = letras no falladas vs `maxIntentos`.
 * - `orden_rango`: clave reservada (partial). No hay viewer en esta fase.
 */
export const ACTIVITY_SCORING: Record<string, ActivityScoringKind> = {
  // Evaluación — quiz N preguntas = crédito parcial; V/F sigue binary
  quiz_multiple: 'partial',
  verdadero_falso: 'binary',

  // Interacción — partial
  completar_blancos: 'partial',
  arrastrar_soltar: 'partial',
  emparejar: 'partial',
  ordenar_pasos: 'partial',
  video_interactivo: 'partial',

  // Evaluación — manual
  short_answer: 'manual',

  // Participación (no entra al promedio académico; columna opcional "participó")
  encuesta_viva: 'participation',
  nube_palabras: 'participation',

  // Grupo 4 — partial (salvo ruleta y condicionales documentados arriba)
  clasificar: 'partial',
  puzzle_imagen: 'partial',
  anagrama: 'partial',
  puzzle_palabras: 'partial',
  crucigrama: 'partial',
  sopa_letras: 'partial',
  globos: 'partial',
  topo: 'partial',
  abrir_caja: 'partial',
  historia_ramificada: 'partial',
  memoria: 'partial',
  ahorcado: 'partial',
  orden_rango: 'partial',

  // Exclude — nunca entran al promedio académico
  ruleta: 'exclude',
  torneo: 'exclude',
  escape_room: 'exclude',
};

export function getActivityScoringKind(
  activityType: string,
): ActivityScoringKind | undefined {
  return ACTIVITY_SCORING[activityType];
}

/**
 * ¿La actividad puede ser columna de la planilla académica?
 * binary / partial / manual. Nunca exclude ni participation.
 */
export function esEvaluable(activityType: string): boolean {
  const kind = ACTIVITY_SCORING[activityType];
  return kind === 'binary' || kind === 'partial' || kind === 'manual';
}

/**
 * Partials cuyo promedio de gradebook YA está conectado a `evaluateActivityResponse`.
 * `orden_rango` queda fuera: hay `evaluateOrdenRango`, pero no viewer ni payload real.
 * Contrato canónico — NO reinterpretar (frontend y backend consumen esto).
 */
const GRADEBOOK_CONNECTED_PARTIAL = new Set([
  'quiz_multiple',
  'completar_blancos',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
  'video_interactivo',
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'anagrama',
  'puzzle_palabras',
  'sopa_letras',
  'crucigrama',
  'globos',
  'topo',
  'abrir_caja',
  'historia_ramificada',
  'ahorcado',
]);

/** `partial` cuyo promedio de gradebook aún no está conectado (p. ej. `orden_rango`). */
export function isGradebookScoringDeferred(activityType: string): boolean {
  const kind = ACTIVITY_SCORING[activityType];
  if (kind !== 'partial') return false;
  return !GRADEBOOK_CONNECTED_PARTIAL.has(activityType);
}

export interface GradebookAverageEntry {
  activityType: string;
  score: number | null;
  hasResult: boolean;
  isManual?: boolean;
  maxScore?: number;
}

/**
 * ¿Esta entrada suma al promedio de la planilla?
 * Ausencia (sin resultado) = ignore, no 0.
 * exclude / participation / partial diferido = no cuentan.
 * short_answer: solo cuenta si el docente ya calificó (`isManual === true`) y hay nota.
 * El cierre de sesión deja score=1.0 e isManual=false (participación); eso NO es nota académica.
 *
 * Debe coincidir con la lógica del gradebook de clase (`class-results-gradebook.helper.ts`).
 */
export function countsTowardClassGradebookAverage(
  entry: GradebookAverageEntry,
): boolean {
  if (!entry.hasResult) return false;
  if (!esEvaluable(entry.activityType)) return false;
  if (isGradebookScoringDeferred(entry.activityType)) return false;
  if (entry.score === null || entry.score === undefined) return false;
  if (!Number.isFinite(entry.score)) return false;
  if (entry.activityType === 'short_answer' && entry.isManual !== true) return false;
  return true;
}

/**
 * Promedio 0–5 de las entradas que sí cuentan. `null` si el denominador queda vacío.
 * Redondeo a 1 decimal (misma escala que Edu muestra).
 */
export function computeClassGradebookPromedio(
  entries: readonly GradebookAverageEntry[],
): number | null {
  let sum = 0;
  let denominator = 0;
  for (const entry of entries) {
    if (!countsTowardClassGradebookAverage(entry)) continue;
    const max = entry.maxScore && entry.maxScore > 0 ? entry.maxScore : 5;
    sum += ((entry.score as number) / max) * 5;
    denominator += 1;
  }
  if (denominator === 0) return null;
  return Math.round((sum / denominator) * 10) / 10;
}

export interface ScoringFixtureSlide {
  activityType: string;
  correctas?: number;
  total?: number;
  respondio?: boolean;
  score?: number;
}

/** Interpreta un caso del JSON de fixtures (p. ej. fase1_torneo_no_afecta_promedio). */
export function promedioFromFixtureSlides(
  slides: readonly ScoringFixtureSlide[],
): number | null {
  const entries: GradebookAverageEntry[] = slides.map((s) => {
    const hasResult = s.respondio === true;
    let score: number | null = null;
    if (typeof s.score === 'number' && Number.isFinite(s.score)) {
      score = s.score;
    } else if (
      hasResult &&
      typeof s.correctas === 'number' &&
      typeof s.total === 'number'
    ) {
      score = notaColombiana(s.correctas, s.total, true);
    }
    return {
      activityType: s.activityType,
      score,
      hasResult,
      maxScore: 5,
    };
  });
  return computeClassGradebookPromedio(entries);
}

// ─── Fase 2: evaluador único ─────────────────────────────────────────────────

export interface ActivityEvaluationDetail {
  index: number;
  correct: boolean;
  /** Etiqueta para el panel en vivo; no entra al score. */
  label?: string;
}

export interface ActivityEvaluationResult {
  /** true solo si TODO fue correcto. null si no aplica (manual / participation / exclude / no evaluable). */
  correct: boolean | null;
  details: ActivityEvaluationDetail[];
  /** notaColombiana, o null si es manual / participation / exclude / no se puede puntuar. */
  score: number | null;
}

/**
 * Convierte un `ActivityEvaluationResult` a XP enteros (0–100).
 *
 * Fase 6: el XP NO se recalcula desde la respuesta cruda (correctas/total).
 * Solo lee `result.score` (escala 0–5 de `notaColombiana`).
 *
 * Mapeo lineal de la escala pedagógica 1.0–5.0 → 0–100 XP:
 *   score 1.0 (mínimo pedagógico / todo mal) → 0 XP
 *   score 5.0 (todo correcto) → 100 XP
 *   score null (manual / participation / exclude / no evaluable) → 0 XP
 *
 * La política de SI se otorga XP (p. ej. participación en ruleta/torneo)
 * vive en el caller, no aquí.
 */
export function xpFromEvaluation(result: ActivityEvaluationResult): number {
  if (result.score === null || !Number.isFinite(result.score)) return 0;
  const nota = Math.min(5, Math.max(1, result.score));
  return Math.round(((nota - 1) / 4) * 100);
}

const UNEVALUABLE: ActivityEvaluationResult = {
  correct: null,
  details: [],
  score: null,
};

/** Marcador de draft de arrastrar_soltar: no se evalúa; solo persiste estado intermedio. */
export const ACTIVITY_DRAFT_KEY = '__luminaDraft';

export function isActivityDraftResponse(response: unknown): boolean {
  return (
    !!response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    (response as Record<string, unknown>)[ACTIVITY_DRAFT_KEY] === true
  );
}

export function unwrapActivityDraftResponse(response: unknown): unknown {
  if (!isActivityDraftResponse(response)) return response;
  return (response as Record<string, unknown>).payload;
}

export function wrapActivityDraftResponse(payload: unknown): unknown {
  return { [ACTIVITY_DRAFT_KEY]: true, payload };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textEq(given: string, expected: string, ignoreCase: boolean): boolean {
  const a = given.trim();
  const b = expected.trim();
  return ignoreCase ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function quizSelectedIds(respuesta: unknown): string[] {
  if (typeof respuesta === 'string') {
    const t = respuesta.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(respuesta)) {
    return [...new Set(respuesta.filter((x): x is string => typeof x === 'string' && x.trim() !== ''))];
  }
  const rec = asRecord(respuesta);
  if (!rec) return [];
  if (typeof rec.opcionSeleccionada === 'string' && rec.opcionSeleccionada.trim()) {
    return [rec.opcionSeleccionada];
  }
  if (typeof rec.selectedId === 'string' && rec.selectedId.trim()) {
    return [rec.selectedId];
  }
  if (Array.isArray(rec.opcionesSeleccionadas)) {
    return [
      ...new Set(
        rec.opcionesSeleccionadas.filter(
          (x): x is string => typeof x === 'string' && x.trim() !== '',
        ),
      ),
    ];
  }
  return [];
}

function quizPreguntasFromDef(
  def: Record<string, unknown>,
): { id: string; texto: string; opciones: unknown[] }[] {
  if (Array.isArray(def.preguntas) && def.preguntas.length > 0) {
    return def.preguntas.map((raw, i) => {
      const rec = asRecord(raw) ?? {};
      return {
        id: String(rec.id ?? `q-${i}`),
        texto: String(rec.texto ?? rec.pregunta ?? ''),
        opciones: Array.isArray(rec.opciones) ? rec.opciones : [],
      };
    });
  }
  if (typeof def.pregunta === 'string' || Array.isArray(def.opciones)) {
    return [
      {
        id: 'q-legacy-0',
        texto: String(def.pregunta ?? ''),
        opciones: Array.isArray(def.opciones) ? def.opciones : [],
      },
    ];
  }
  return [];
}

function quizAnswersByQuestion(
  respuesta: unknown,
  preguntas: { id: string }[],
): string[][] {
  const rec = asRecord(respuesta);
  if (rec && rec.answers && typeof rec.answers === 'object' && !Array.isArray(rec.answers)) {
    const answers = rec.answers as Record<string, unknown>;
    return preguntas.map((p) => quizSelectedIds(answers[p.id]));
  }
  const selected = quizSelectedIds(respuesta);
  return preguntas.map((_, i) => (i === 0 ? selected : []));
}

function isQuizOptionSetCorrect(opciones: unknown[], selected: string[]): boolean {
  const correctIds = opciones
    .filter((o) => asRecord(o)?.esCorrecta === true)
    .map((o) => String(asRecord(o)?.id ?? ''))
    .filter((id) => id !== '');
  if (correctIds.length === 0) return false;
  return selected.length === correctIds.length && selected.every((id) => correctIds.includes(id));
}

/** Una pregunta = misma nota que el evaluador binary legado. N preguntas = crédito parcial. */
function evaluateQuizMultiple(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const preguntas = quizPreguntasFromDef(def);
  if (preguntas.length === 0) return UNEVALUABLE;
  const anyEvaluable = preguntas.some((p) =>
    p.opciones.some((o) => asRecord(o)?.esCorrecta === true),
  );
  if (!anyEvaluable) return UNEVALUABLE;
  const selections = quizAnswersByQuestion(respuesta, preguntas);
  const details = preguntas.map((p, i) => ({
    index: i,
    correct: isQuizOptionSetCorrect(p.opciones, selections[i] ?? []),
    label: preguntas.length === 1 ? 'Quiz' : p.texto.trim() || `Pregunta ${i + 1}`,
  }));
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, preguntas.length, true),
  };
}

/**
 * Video — clave real `video_interactivo` (el prompt de Fase 2 decía `video`).
 *
 * Baseline capturado 2026-08-20 ANTES de borrar evaluateResponse local:
 * - Viewer/preview reciben UN `{ questionIndex, answer }` por overlay y emiten 1 detail.
 * - Autónomo hace `historial.push` sin dedup; el scoring de BD ya usaba Map por índice.
 * - El evaluador local NO calculaba nota 0–5; el cierre usaba `details.length`.
 *
 * Cambio 2.4 (único permitido respecto al baseline): dedup last-wins por
 * `questionIndex` y `score = notaColombiana(correctas, totalPreguntas, respondio)`.
 * Formas reales aceptadas: `{ questionIndex, answer }`, `{ historial: [...] }`,
 * `{ correct, historial }` (emit del viewer) o `{ questionIndex, answer }[]`.
 */
export function normalizeVideoAnswers(respuesta: unknown): { questionIndex: number; answer: string }[] {
  const byIndex = new Map<number, string>();
  const push = (item: unknown) => {
    const rec = asRecord(item);
    if (!rec) return;
    const questionIndex =
      typeof rec.questionIndex === 'number' && Number.isFinite(rec.questionIndex)
        ? Math.max(0, Math.floor(rec.questionIndex))
        : NaN;
    const answer = typeof rec.answer === 'string' ? rec.answer : '';
    if (!Number.isFinite(questionIndex) || !answer.trim()) return;
    byIndex.set(questionIndex, answer);
  };
  if (Array.isArray(respuesta)) {
    for (const item of respuesta) push(item);
  } else {
    const rec = asRecord(respuesta);
    if (rec) {
      if (Array.isArray(rec.historial)) {
        for (const item of rec.historial) push(item);
      } else {
        push(rec);
      }
    }
  }
  return [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([questionIndex, answer]) => ({ questionIndex, answer }));
}

function evaluateBinary(
  activityType: string,
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  if (activityType === 'verdadero_falso') {
    if (typeof def.respuestaCorrecta !== 'boolean') return UNEVALUABLE;
    const ok = respuesta === def.respuestaCorrecta;
    return {
      correct: ok,
      details: [{ index: 0, correct: ok, label: 'V/F' }],
      score: notaColombiana(ok ? 1 : 0, 1, true),
    };
  }
  return UNEVALUABLE;
}

function evaluateBlancos(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const blancos = Array.isArray(def.blancos) ? def.blancos : [];
  if (blancos.length === 0) return UNEVALUABLE;
  const answers = asRecord(respuesta);
  if (!answers) {
    return {
      correct: false,
      details: blancos.map((_, i) => ({ index: i, correct: false, label: `Hueco ${i + 1}` })),
      score: notaColombiana(0, blancos.length, true),
    };
  }
  const details: ActivityEvaluationDetail[] = blancos.map((raw, i) => {
    const blank = asRecord(raw) ?? {};
    const given = String(answers[String(blank.id ?? '')] ?? '');
    const ignoreCase = blank.ignorarMayusculas !== false;
    const expected = String(blank.respuesta ?? '');
    const alts = Array.isArray(blank.alternativas)
      ? blank.alternativas.map((a) => String(a))
      : [];
    const isCorrect =
      textEq(given, expected, ignoreCase) ||
      alts.some((alt) => textEq(given, alt, ignoreCase));
    return { index: i, correct: isCorrect, label: `Hueco ${i + 1}` };
  });
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, blancos.length, true),
  };
}

function evaluateDragDrop(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const items = Array.isArray(def.items) ? def.items : [];
  const zonas = Array.isArray(def.zonas) ? def.zonas : [];
  if (items.length === 0) return UNEVALUABLE;
  const placements = Array.isArray(respuesta) ? respuesta : [];
  const details: ActivityEvaluationDetail[] = items.map((raw, i) => {
    const item = asRecord(raw) ?? {};
    const itemId = String(item.id ?? '');
    const label = String(item.texto ?? `Ítem ${i + 1}`);
    const placement = placements.find((p) => asRecord(p)?.itemId === itemId);
    const zoneId = asRecord(placement)?.zoneId;
    if (typeof zoneId !== 'string') {
      return { index: i, correct: false, label };
    }
    const zone = zonas.find((z) => asRecord(z)?.id === zoneId);
    const correctos = asRecord(zone)?.itemsCorrectos;
    const ok = Array.isArray(correctos) && correctos.includes(itemId);
    return { index: i, correct: ok, label };
  });
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, items.length, true),
  };
}

function evaluateEmparejar(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const pares = Array.isArray(def.pares) ? def.pares : [];
  if (pares.length === 0) return UNEVALUABLE;
  const matches = Array.isArray(respuesta) ? respuesta : [];
  const details: ActivityEvaluationDetail[] = pares.map((raw, i) => {
    const par = asRecord(raw) ?? {};
    const parId = String(par.id ?? '');
    const izq = asRecord(par.izquierda);
    const label =
      (typeof izq?.texto === 'string' && izq.texto) ||
      (izq?.imagen ? '[Imagen]' : `Par ${i + 1}`);
    const match = matches.find((m) => asRecord(m)?.leftId === parId);
    return { index: i, correct: asRecord(match)?.rightId === parId, label };
  });
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, pares.length, true),
  };
}

function evaluateOrdenar(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const pasos = Array.isArray(def.pasos) ? def.pasos : [];
  if (pasos.length === 0) return UNEVALUABLE;
  const ordered = Array.isArray(respuesta) ? respuesta.map(String) : [];
  const correctOrder = [...pasos]
    .sort(
      (a, b) =>
        Number(asRecord(a)?.ordenCorrecto ?? 0) - Number(asRecord(b)?.ordenCorrecto ?? 0),
    )
    .map((p) => String(asRecord(p)?.id ?? ''));
  const details: ActivityEvaluationDetail[] = correctOrder.map((stepId, pos) => {
    const paso = pasos.find((p) => asRecord(p)?.id === stepId);
    const contenido = String(asRecord(paso)?.contenido ?? '');
    const label = contenido.length > 30 ? `${contenido.slice(0, 30)}…` : contenido || `Paso ${pos + 1}`;
    return { index: pos, correct: ordered[pos] === stepId, label };
  });
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, pasos.length, true),
  };
}

function evaluateVideo(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const preguntas = Array.isArray(def.preguntas) ? def.preguntas : [];
  const totalPreguntas =
    preguntas.length > 0
      ? preguntas.length
      : typeof def.totalPreguntas === 'number' && def.totalPreguntas > 0
        ? def.totalPreguntas
        : 0;
  const answers = normalizeVideoAnswers(respuesta);
  if (totalPreguntas <= 0 || answers.length === 0) return UNEVALUABLE;
  const details: ActivityEvaluationDetail[] = answers.map((a) => {
    const question = preguntas[a.questionIndex];
    const opciones = Array.isArray(asRecord(question)?.opciones)
      ? (asRecord(question)?.opciones as unknown[])
      : [];
    const isCorrect = opciones.some((op) => {
      const o = asRecord(op);
      return o?.id === a.answer && o?.esCorrecta === true;
    });
    return {
      index: a.questionIndex,
      correct: isCorrect,
      label: `Pregunta ${a.questionIndex + 1}`,
    };
  });
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.length === totalPreguntas && details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, totalPreguntas, true),
  };
}

function resultFromDetails(details: ActivityEvaluationDetail[]): ActivityEvaluationResult {
  if (details.length === 0) return UNEVALUABLE;
  const correctas = details.filter((d) => d.correct).length;
  return {
    correct: details.every((d) => d.correct),
    details,
    score: notaColombiana(correctas, details.length, true),
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string');
}

function evaluateClasificar(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const items = Array.isArray(def.items) ? def.items : [];
  if (items.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const ubicaciones = asRecord(rec.ubicaciones) ?? rec;
  const details: ActivityEvaluationDetail[] = items.map((raw, i) => {
    const item = asRecord(raw) ?? {};
    const id = String(item.id ?? '');
    const expected = String(item.categoriaId ?? '');
    const placed = ubicaciones[id];
    const ok = typeof placed === 'string' && placed === expected;
    return { index: i, correct: ok, label: String(item.texto ?? `Ítem ${i + 1}`) };
  });
  return resultFromDetails(details);
}

function evaluateMemoria(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const pares = Array.isArray(def.pares) ? def.pares : [];
  if (pares.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const found = new Set(
    stringList(rec.paresEncontrados).concat(Array.isArray(respuesta) ? stringList(respuesta) : []),
  );
  const details: ActivityEvaluationDetail[] = pares.map((raw, i) => {
    const par = asRecord(raw) ?? {};
    const id = String(par.id ?? i);
    return { index: i, correct: found.has(id), label: `Par ${i + 1}` };
  });
  return resultFromDetails(details);
}

function evaluatePuzzleImagen(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const cfg = asRecord(def.configuracion) ?? {};
  const filas = Number(cfg.filas ?? 0);
  const columnas = Number(cfg.columnas ?? 0);
  const total = filas > 0 && columnas > 0 ? filas * columnas : 0;
  const rec = asRecord(respuesta) ?? {};
  const slots = Array.isArray(rec.slots)
    ? rec.slots
    : Array.isArray(respuesta)
      ? respuesta
      : [];
  const n = total > 0 ? total : slots.length;
  if (n <= 0) return UNEVALUABLE;
  const details: ActivityEvaluationDetail[] = Array.from({ length: n }, (_, i) => ({
    index: i,
    correct: slots[i] === i,
    label: `Pieza ${i + 1}`,
  }));
  return resultFromDetails(details);
}

function evaluateAnagrama(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const palabras = Array.isArray(def.palabras) ? def.palabras : [];
  if (palabras.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const slotsPorPalabra = Array.isArray(rec.slotsPorPalabra) ? rec.slotsPorPalabra : [];
  const details: ActivityEvaluationDetail[] = palabras.map((raw, i) => {
    const palabra = asRecord(raw) ?? {};
    const expected = String(palabra.texto ?? '')
      .toUpperCase()
      .replace(/\s+/g, '');
    const slots = Array.isArray(slotsPorPalabra[i]) ? slotsPorPalabra[i] : [];
    const given = slots
      .map((s) => (s == null ? '' : String(s)))
      .join('')
      .toUpperCase();
    return {
      index: i,
      correct: expected.length > 0 && given === expected,
      label: String(palabra.texto ?? `Palabra ${i + 1}`),
    };
  });
  return resultFromDetails(details);
}

function evaluatePuzzlePalabras(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const oraciones = Array.isArray(def.oraciones) ? def.oraciones : [];
  if (oraciones.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const tokensPorOracion = Array.isArray(rec.tokensPorOracion) ? rec.tokensPorOracion : [];
  const details: ActivityEvaluationDetail[] = oraciones.map((raw, i) => {
    const oracion = asRecord(raw) ?? {};
    const expected = String(oracion.texto ?? '').trim();
    const tokens = Array.isArray(tokensPorOracion[i]) ? tokensPorOracion[i] : [];
    const given = tokens.map((t) => String(t)).join(' ').trim();
    return {
      index: i,
      correct: expected.length > 0 && given === expected,
      label: `Oración ${i + 1}`,
    };
  });
  return resultFromDetails(details);
}

function evaluateSopaLetras(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const palabras = Array.isArray(def.palabras) ? def.palabras : [];
  if (palabras.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const encontradas = new Set(
    stringList(rec.encontradas).map((t) => t.trim().toUpperCase()).filter(Boolean),
  );
  const details: ActivityEvaluationDetail[] = palabras.map((raw, i) => {
    const palabra = asRecord(raw) ?? {};
    const texto = String(palabra.texto ?? '').trim().toUpperCase();
    return {
      index: i,
      correct: texto.length > 0 && encontradas.has(texto),
      label: texto || `Palabra ${i + 1}`,
    };
  });
  return resultFromDetails(details);
}

function evaluateCrucigrama(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const palabras = Array.isArray(def.palabras) ? def.palabras : [];
  if (palabras.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const celdas = asRecord(rec.celdas) ?? asRecord(rec.respuestas) ?? rec;
  const details: ActivityEvaluationDetail[] = palabras.map((raw, i) => {
    const palabra = asRecord(raw) ?? {};
    const texto = String(palabra.texto ?? '').toUpperCase();
    const fila = Number(palabra.fila ?? 0);
    const columna = Number(palabra.columna ?? 0);
    const horizontal = palabra.direccion !== 'vertical';
    let ok = texto.length > 0;
    for (let c = 0; c < texto.length; c++) {
      const key = horizontal ? `${fila}-${columna + c}` : `${fila + c}-${columna}`;
      const given = String(celdas[key] ?? '').toUpperCase();
      if (given !== texto[c]) {
        ok = false;
        break;
      }
    }
    return { index: i, correct: ok, label: String(palabra.pista ?? `Palabra ${i + 1}`) };
  });
  return resultFromDetails(details);
}

function evaluateGlobosOTopo(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const preguntas = Array.isArray(def.preguntas) ? def.preguntas : [];
  const rec = asRecord(respuesta) ?? {};
  const maxFromDef = preguntas.length;
  if (Array.isArray(rec.aciertos)) {
    const aciertos = rec.aciertos;
    const total = maxFromDef > 0 ? maxFromDef : aciertos.length;
    if (total <= 0) return UNEVALUABLE;
    const details: ActivityEvaluationDetail[] = Array.from({ length: total }, (_, i) => ({
      index: i,
      correct: aciertos[i] === true,
      label: `Pregunta ${i + 1}`,
    }));
    return resultFromDetails(details);
  }
  const maximos = Number(
    rec.puntosMaximos ?? (maxFromDef > 0 ? maxFromDef : rec.total ?? 0),
  );
  const obtenidos = Number(rec.puntosObtenidos ?? rec.puntaje ?? 0);
  if (!Number.isFinite(maximos) || maximos <= 0) return UNEVALUABLE;
  const got = Math.max(0, Math.min(maximos, Number.isFinite(obtenidos) ? obtenidos : 0));
  const details: ActivityEvaluationDetail[] = Array.from({ length: maximos }, (_, i) => ({
    index: i,
    correct: i < got,
    label: `Punto ${i + 1}`,
  }));
  return resultFromDetails(details);
}

function evaluateAbrirCaja(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const cajas = Array.isArray(def.cajas) ? def.cajas : [];
  const evaluables = cajas.filter((raw) => {
    const contenido = asRecord(asRecord(raw)?.contenido);
    return contenido?.esCorrecta !== undefined;
  });
  if (evaluables.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta) ?? {};
  const abiertas = new Set(stringList(rec.cajasAbiertas));
  const correctBoxes = evaluables.filter((raw) => {
    const contenido = asRecord(asRecord(raw)?.contenido);
    return contenido?.esCorrecta === true;
  });
  const total = correctBoxes.length;
  if (total === 0) return UNEVALUABLE;
  const details: ActivityEvaluationDetail[] = correctBoxes.map((raw, i) => {
    const caja = asRecord(raw) ?? {};
    const id = String(caja.id ?? '');
    return {
      index: i,
      correct: abiertas.has(id),
      label: String(caja.etiqueta ?? `Caja ${i + 1}`),
    };
  });
  return resultFromDetails(details);
}

function evaluateHistoriaRamificada(
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const nodos = Array.isArray(def.nodos) ? def.nodos : [];
  const rec = asRecord(respuesta) ?? {};
  const historial = Array.isArray(rec.historial) ? rec.historial : [];
  const tienePreguntas = nodos.some((raw) => {
    const n = asRecord(raw) ?? {};
    return (
      n.tipo === 'pregunta' &&
      Array.isArray(n.opciones) &&
      n.opciones.some((op) => asRecord(op)?.esCorrecta !== undefined)
    );
  });
  const tieneFinales = nodos.some((raw) => {
    const t = asRecord(raw)?.tipo;
    return t === 'final_bueno' || t === 'final_malo';
  });
  if (!tienePreguntas && !tieneFinales) return UNEVALUABLE;

  if (tienePreguntas) {
    const details: ActivityEvaluationDetail[] = [];
    for (let i = 1; i < historial.length; i++) {
      const prev = asRecord(historial[i - 1]) ?? {};
      const step = asRecord(historial[i]) ?? {};
      const fromId = String(prev.nodoId ?? '');
      const optionId = String(step.opcionElegida ?? '');
      const fromNode = nodos.find((raw) => String(asRecord(raw)?.id ?? '') === fromId);
      const node = asRecord(fromNode) ?? {};
      if (node.tipo !== 'pregunta' || !Array.isArray(node.opciones)) continue;
      const opt = node.opciones.find((op) => String(asRecord(op)?.id ?? '') === optionId);
      const recOpt = asRecord(opt);
      if (recOpt?.esCorrecta === undefined) continue;
      details.push({
        index: details.length,
        correct: recOpt.esCorrecta === true,
        label: String(node.titulo ?? `Pregunta ${details.length + 1}`),
      });
    }
    if (details.length > 0) return resultFromDetails(details);
    if (!tieneFinales) return UNEVALUABLE;
  }

  const last = asRecord(historial[historial.length - 1]) ?? {};
  const lastId = String(last.nodoId ?? rec.nodoFinal ?? '');
  const lastNode = asRecord(nodos.find((raw) => String(asRecord(raw)?.id ?? '') === lastId));
  if (lastNode?.tipo === 'final_bueno' || lastNode?.tipo === 'final_malo') {
    const ok = lastNode.tipo === 'final_bueno';
    return {
      correct: ok,
      details: [{ index: 0, correct: ok, label: 'Final' }],
      score: notaColombiana(ok ? 1 : 0, 1, true),
    };
  }
  return UNEVALUABLE;
}

function evaluateAhorcado(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const cfg = asRecord(def.configuracion) ?? def;
  const maxIntentos = Number(cfg.maxIntentos ?? 0);
  const rec = asRecord(respuesta) ?? {};
  const fallos = Array.isArray(rec.letrasFalladas)
    ? rec.letrasFalladas.length
    : Number(rec.fallos ?? 0);
  const adivinadas = Array.isArray(rec.letrasAdivinadas)
    ? rec.letrasAdivinadas.map(String)
    : [];
  const letrasPalabra =
    typeof cfg.palabra === 'string'
      ? cfg.palabra
          .toUpperCase()
          .replace(/[^A-ZÑ]/g, '')
          .split('')
      : [];
  const ganado =
    rec.ganado === true ||
    (letrasPalabra.length > 0 && letrasPalabra.every((ch) => adivinadas.includes(ch)));
  if (!ganado) {
    return {
      correct: false,
      details: [{ index: 0, correct: false, label: 'Ahorcado' }],
      score: notaColombiana(0, 1, true),
    };
  }
  const total = maxIntentos > 0 ? maxIntentos : 1;
  const correctas = Math.max(0, total - (Number.isFinite(fallos) ? fallos : 0));
  const details: ActivityEvaluationDetail[] = Array.from({ length: total }, (_, i) => ({
    index: i,
    correct: i < correctas,
    label: `Intento ${i + 1}`,
  }));
  return resultFromDetails(details);
}

function evaluateOrdenRango(definicion: unknown, respuesta: unknown): ActivityEvaluationResult {
  const def = asRecord(definicion) ?? {};
  const expected = Array.isArray(def.ordenCorrecto)
    ? def.ordenCorrecto.map((x) => String(x))
    : Array.isArray(def.items)
      ? def.items.map((raw, i) => String(asRecord(raw)?.id ?? i))
      : [];
  if (expected.length === 0) return UNEVALUABLE;
  const rec = asRecord(respuesta);
  const given = Array.isArray(respuesta)
    ? respuesta.map((x) => String(x))
    : Array.isArray(rec?.orden)
      ? rec.orden.map((x) => String(x))
      : [];
  const details: ActivityEvaluationDetail[] = expected.map((id, i) => ({
    index: i,
    correct: given[i] === id,
    label: `Posición ${i + 1}`,
  }));
  return resultFromDetails(details);
}

function evaluatePartial(
  activityType: string,
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  switch (activityType) {
    case 'quiz_multiple':
      return evaluateQuizMultiple(definicion, respuesta);
    case 'completar_blancos':
      return evaluateBlancos(definicion, respuesta);
    case 'arrastrar_soltar':
      return evaluateDragDrop(definicion, unwrapActivityDraftResponse(respuesta));
    case 'emparejar':
      return evaluateEmparejar(definicion, respuesta);
    case 'ordenar_pasos':
      return evaluateOrdenar(definicion, respuesta);
    case 'video_interactivo':
      return evaluateVideo(definicion, respuesta);
    case 'clasificar':
      return evaluateClasificar(definicion, unwrapActivityDraftResponse(respuesta));
    case 'memoria':
      return evaluateMemoria(definicion, unwrapActivityDraftResponse(respuesta));
    case 'puzzle_imagen':
      return evaluatePuzzleImagen(definicion, unwrapActivityDraftResponse(respuesta));
    case 'anagrama':
      return evaluateAnagrama(definicion, respuesta);
    case 'puzzle_palabras':
      return evaluatePuzzlePalabras(definicion, respuesta);
    case 'sopa_letras':
      return evaluateSopaLetras(definicion, respuesta);
    case 'crucigrama':
      return evaluateCrucigrama(definicion, respuesta);
    case 'globos':
    case 'topo':
      return evaluateGlobosOTopo(definicion, respuesta);
    case 'abrir_caja':
      return evaluateAbrirCaja(definicion, respuesta);
    case 'historia_ramificada':
      return evaluateHistoriaRamificada(definicion, respuesta);
    case 'ahorcado':
      return evaluateAhorcado(definicion, respuesta);
    case 'orden_rango':
      return evaluateOrdenRango(definicion, respuesta);
    default:
      return UNEVALUABLE;
  }
}

/**
 * Único evaluador de respuesta para Evaluación / Interacción — frontend y
 * backend (E6.3). No hay ya ningún espejo que mantener sincronizado.
 */
export function evaluateActivityResponse(
  activityType: string,
  definicion: unknown,
  respuesta: unknown,
): ActivityEvaluationResult {
  if (isActivityDraftResponse(respuesta)) {
    return UNEVALUABLE;
  }
  const kind = ACTIVITY_SCORING[activityType];
  switch (kind) {
    case 'binary':
      return evaluateBinary(activityType, definicion, respuesta);
    case 'partial':
      return evaluatePartial(activityType, definicion, respuesta);
    case 'manual':
    case 'participation':
    case 'exclude':
      return UNEVALUABLE;
    default:
      return UNEVALUABLE;
  }
}

/** Recorre bloques/columnas y devuelve el objeto `actividad` del slide. */
export function extractActivityDefinition(content: unknown): Record<string, unknown> | null {
  const walk = (node: unknown): Record<string, unknown> | null => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found) return found;
      }
      return null;
    }
    const o = node as Record<string, unknown>;
    if (o.tipo === 'actividad' && o.actividad && typeof o.actividad === 'object') {
      return o.actividad as Record<string, unknown>;
    }
    if ('bloques' in o) {
      const found = walk(o.bloques);
      if (found) return found;
    }
    if ('columnas' in o) {
      const found = walk(o.columnas);
      if (found) return found;
    }
    return null;
  };
  return walk(content);
}

export function detailsForLivePanel(
  details: ActivityEvaluationDetail[],
): { label: string; correct: boolean | null }[] {
  return details.map((d) => ({
    label: d.label ?? `Ítem ${d.index + 1}`,
    correct: d.correct,
  }));
}
