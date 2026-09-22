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
    case 'video_interactivo':
      return normalizeVideoInteractivo(source);
    case 'encuesta_viva':
      return normalizeEncuestaViva(source);
    case 'nube_palabras':
      return normalizeNubePalabras(source);
    case 'anagrama':
      return normalizeAnagrama(source);
    case 'clasificar':
      return normalizeClasificar(source);
    case 'memoria':
      return normalizeMemoria(source);
    case 'puzzle_imagen':
      return normalizePuzzleImagen();
    case 'sopa_letras':
      return normalizeSopaLetras(source);
    case 'crucigrama':
      return normalizeCrucigrama(source);
    case 'abrir_caja':
      return normalizeAbrirCaja(source);
    case 'ahorcado':
      return normalizeAhorcado(source);
    case 'puzzle_palabras':
      return normalizePuzzlePalabras(source);
    case 'globos':
      return normalizeGlobos(source);
    case 'topo':
      return normalizeTopo(source);
    case 'historia_ramificada':
      return normalizeHistoriaRamificada(source);
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

// ─── J8 — Clásicas restantes (video/encuesta/nube) ─────────────────────────────

function normalizeQuizStyleOptions(raw: unknown): { id: string; texto: string; esCorrecta: boolean }[] {
  const opciones = asArray(raw)
    .map((op, i) => {
      const rec = asRecord(op);
      return {
        id: asString(rec.id, String.fromCharCode(97 + i)),
        texto: asString(rec.texto),
        esCorrecta: asBoolean(rec.esCorrecta, false),
      };
    })
    .filter((o) => o.texto);
  if (opciones.length > 0 && !opciones.some((o) => o.esCorrecta)) {
    opciones[0] = { ...opciones[0], esCorrecta: true };
  }
  return opciones;
}

function normalizeVideoInteractivo(raw: Record<string, unknown>): Record<string, unknown> {
  const preguntas = asArray(raw.preguntas)
    .map((q, i) => {
      const rec = asRecord(q);
      return {
        id: asString(rec.id, `q${i + 1}`),
        tiempoSegundos: asNumber(rec.tiempoSegundos, (i + 1) * 30),
        pregunta: asString(rec.pregunta),
        opciones: normalizeQuizStyleOptions(rec.opciones),
        pausarVideo: asBoolean(rec.pausarVideo, true),
      };
    })
    .filter((q) => q.pregunta && q.opciones.length > 0);
  return {
    tipo: 'video_interactivo',
    urlVideo: '',
    plataforma: 'youtube',
    preguntas:
      preguntas.length > 0
        ? preguntas
        : [
            {
              id: 'q1',
              tiempoSegundos: 30,
              pregunta: 'Pregunta de ejemplo',
              opciones: [
                { id: 'a', texto: 'Correcta', esCorrecta: true },
                { id: 'b', texto: 'Incorrecta', esCorrecta: false },
              ],
              pausarVideo: true,
            },
          ],
    debeResponderParaContinuar: false,
  };
}

function normalizeEncuestaViva(raw: Record<string, unknown>): Record<string, unknown> {
  const opciones = asArray(raw.opciones)
    .map((o, i) => {
      const rec = asRecord(o);
      return { id: asString(rec.id, `o${i + 1}`), texto: asString(rec.texto) };
    })
    .filter((o) => o.texto);
  return {
    tipo: 'encuesta_viva',
    pregunta: asString(raw.pregunta),
    opciones:
      opciones.length >= 2
        ? opciones
        : [
            { id: 'o1', texto: 'Opción 1' },
            { id: 'o2', texto: 'Opción 2' },
          ],
    mostrarResultadosEnTiempoReal: true,
    mostrarResultadosAlFinalizar: true,
  };
}

function normalizeNubePalabras(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    tipo: 'nube_palabras',
    instruccion: asString(raw.instruccion, 'Escribe una palabra que asocies con el tema.'),
    maxPalabrasPorUsuario: 3,
    maxPalabrasEnNube: 50,
    filtrarPalabrasComunes: true,
  };
}

// ─── J8 — Grupo 4 ───────────────────────────────────────────────────────────────

function normalizeAnagrama(raw: Record<string, unknown>): Record<string, unknown> {
  const palabras = asArray(raw.palabras)
    .map((p) => {
      const rec = asRecord(p);
      const texto = asString(rec.texto).trim().toUpperCase();
      const pista = asString(rec.pista);
      return { texto, ...(pista ? { pista } : {}) };
    })
    .filter((p) => p.texto.length > 0);
  return {
    tipo: 'anagrama',
    configuracion: { mostrarPista: true, intentos: 3 },
    palabras: palabras.length > 0 ? palabras : [{ texto: 'EJEMPLO', pista: '' }],
  };
}

function normalizeClasificar(raw: Record<string, unknown>): Record<string, unknown> {
  const categoriasRaw = asArray(raw.categorias).map((c, i) => {
    const rec = asRecord(c);
    return { id: asString(rec.id, `cat-${i + 1}`), nombre: asString(rec.nombre, `Categoría ${i + 1}`) };
  });
  const categorias =
    categoriasRaw.length >= 2
      ? categoriasRaw
      : [
          { id: 'cat-1', nombre: 'Categoría 1' },
          { id: 'cat-2', nombre: 'Categoría 2' },
        ];
  const catIds = new Set(categorias.map((c) => c.id));
  const items = asArray(raw.items)
    .map((it, i) => {
      const rec = asRecord(it);
      const categoriaId = asString(rec.categoriaId);
      return {
        id: asString(rec.id, `item-${i + 1}`),
        texto: asString(rec.texto),
        categoriaId: catIds.has(categoriaId) ? categoriaId : categorias[0].id,
      };
    })
    .filter((it) => it.texto);
  return {
    tipo: 'clasificar',
    configuracion: { columnas: 3, colorCategorias: ['#2563EB', '#16A34A', '#DC2626', '#D97706'], permitirReintento: true },
    categorias,
    items,
  };
}

function normalizeMemoria(raw: Record<string, unknown>): Record<string, unknown> {
  const pares = asArray(raw.pares)
    .map((p, i) => {
      const rec = asRecord(p);
      const l1 = asRecord(rec.lado1);
      const l2 = asRecord(rec.lado2);
      return {
        id: asString(rec.id, `par-${i + 1}`),
        lado1: { texto: asString(l1.texto) },
        lado2: { texto: asString(l2.texto) },
      };
    })
    .filter((p) => p.lado1.texto && p.lado2.texto);
  return {
    tipo: 'memoria',
    configuracion: {
      columnas: 4,
      tiempoVolteo: 1000,
      colorDorso: '#2563EB',
      simboloDorso: '?',
      colorSimboloDorso: '#FFFFFF',
      mostrarTimer: true,
    },
    pares: pares.length > 0 ? pares : [{ id: 'par-1', lado1: { texto: 'Término' }, lado2: { texto: 'Definición' } }],
  };
}

/** Sin URL de imagen (no se inventan) — el docente la sube manualmente después. */
function normalizePuzzleImagen(): Record<string, unknown> {
  return {
    tipo: 'puzzle_imagen',
    configuracion: { filas: 3, columnas: 3, mostrarVista: true, dificultad: 'facil' },
    imagen: '',
  };
}

function normalizeSopaLetras(raw: Record<string, unknown>): Record<string, unknown> {
  const palabras = asArray(raw.palabras)
    .map((p) => {
      const rec = asRecord(p);
      const texto = asString(rec.texto).trim().toUpperCase();
      const pista = asString(rec.pista);
      return { texto, ...(pista ? { pista } : {}) };
    })
    .filter((p) => p.texto.length > 0);
  return {
    tipo: 'sopa_letras',
    configuracion: {
      filas: 12,
      columnas: 12,
      direcciones: ['horizontal', 'vertical'],
      tema: asString(raw.tema, 'General'),
      mostrarLista: true,
    },
    palabras: palabras.length > 0 ? palabras : [{ texto: 'EJEMPLO', pista: '' }],
  };
}

// ─── Crucigrama — motor de cruce determinista (no se confía en coordenadas de la IA) ─

interface CrucigramaEntrada {
  texto: string;
  pista: string;
}

interface CrucigramaPalabraLayout {
  id: string;
  texto: string;
  pista: string;
  direccion: 'horizontal' | 'vertical';
  fila: number;
  columna: number;
}

function normalizeCrucigramaWord(texto: string): string {
  return texto
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-ZÑ]/g, '');
}

/** Ubica cada palabra en el grid: intersecta con una ya colocada si comparten letra sin conflicto; si no, la coloca aparte. */
function layoutCrucigramaPalabras(entradas: CrucigramaEntrada[]): CrucigramaPalabraLayout[] {
  const ocupadas = new Map<string, string>();
  const resultado: CrucigramaPalabraLayout[] = [];
  let filaLibre = 0;

  const cabe = (texto: string, direccion: 'horizontal' | 'vertical', fila: number, columna: number): boolean => {
    for (let k = 0; k < texto.length; k++) {
      const f = direccion === 'horizontal' ? fila : fila + k;
      const c = direccion === 'horizontal' ? columna + k : columna;
      const existente = ocupadas.get(`${f},${c}`);
      if (existente && existente !== texto[k]) return false;
    }
    return true;
  };
  const colocar = (texto: string, direccion: 'horizontal' | 'vertical', fila: number, columna: number) => {
    for (let k = 0; k < texto.length; k++) {
      const f = direccion === 'horizontal' ? fila : fila + k;
      const c = direccion === 'horizontal' ? columna + k : columna;
      ocupadas.set(`${f},${c}`, texto[k]);
    }
  };

  entradas.forEach((entrada, i) => {
    const { texto, pista } = entrada;
    if (!texto) return;
    const id = `p-${i + 1}`;

    if (resultado.length === 0) {
      colocar(texto, 'horizontal', 0, 0);
      resultado.push({ id, texto, pista, direccion: 'horizontal', fila: 0, columna: 0 });
      filaLibre = texto.length;
      return;
    }

    for (const prev of resultado) {
      let colocada = false;
      for (let a = 0; a < prev.texto.length && !colocada; a++) {
        for (let b = 0; b < texto.length && !colocada; b++) {
          if (prev.texto[a] !== texto[b]) continue;
          const direccion = prev.direccion === 'horizontal' ? 'vertical' : 'horizontal';
          const fila = prev.direccion === 'horizontal' ? prev.fila - b : prev.fila + a;
          const columna = prev.direccion === 'horizontal' ? prev.columna + a : prev.columna - b;
          if (cabe(texto, direccion, fila, columna)) {
            colocar(texto, direccion, fila, columna);
            resultado.push({ id, texto, pista, direccion, fila, columna });
            colocada = true;
          }
        }
      }
      if (colocada) return;
    }

    // Sin cruce válido con ninguna palabra ya colocada: aparte, debajo de todo.
    filaLibre += 2;
    colocar(texto, 'horizontal', filaLibre, 0);
    resultado.push({ id, texto, pista, direccion: 'horizontal', fila: filaLibre, columna: 0 });
  });

  const minFila = Math.min(...resultado.map((r) => r.fila));
  const minColumna = Math.min(...resultado.map((r) => r.columna));
  return resultado.map((r) => ({ ...r, fila: r.fila - minFila, columna: r.columna - minColumna }));
}

function normalizeCrucigrama(raw: Record<string, unknown>): Record<string, unknown> {
  const entradas = asArray(raw.palabras)
    .map((p) => {
      const rec = asRecord(p);
      return { texto: normalizeCrucigramaWord(asString(rec.texto)), pista: asString(rec.pista) };
    })
    .filter((p) => p.texto.length >= 2);
  const palabras =
    entradas.length > 0
      ? layoutCrucigramaPalabras(entradas)
      : layoutCrucigramaPalabras([{ texto: 'SOL', pista: 'Estrella de nuestro sistema' }]);
  return {
    tipo: 'crucigrama',
    configuracion: { tamanoCelda: 36, colorCelda: '#FFFFFF', colorTexto: '#1F2937' },
    palabras,
  };
}

function abrirCajaGridFor(count: number): { filas: 2 | 3; columnas: 2 | 3 | 4 } {
  if (count <= 4) return { filas: 2, columnas: 2 };
  if (count <= 6) return { filas: 2, columnas: 3 };
  if (count <= 8) return { filas: 2, columnas: 4 };
  return { filas: 3, columnas: 4 };
}

function normalizeAbrirCaja(raw: Record<string, unknown>): Record<string, unknown> {
  const cajasRaw = asArray(raw.cajas)
    .map((c, i) => {
      const rec = asRecord(c);
      const contenido = asRecord(rec.contenido);
      return {
        id: asString(rec.id, `caja-${i + 1}`),
        etiqueta: asString(rec.etiqueta, `Caja ${i + 1}`),
        contenido: {
          texto: asString(contenido.texto, '¡Sorpresa!'),
          esCorrecta: asBoolean(contenido.esCorrecta, i % 2 === 0),
        },
      };
    })
    .filter((c) => c.contenido.texto);
  const cajas =
    cajasRaw.length >= 2
      ? cajasRaw
      : [
          { id: 'caja-1', etiqueta: 'Caja 1', contenido: { texto: '¡Sorpresa!', esCorrecta: true } },
          { id: 'caja-2', etiqueta: 'Caja 2', contenido: { texto: 'Intenta otra', esCorrecta: false } },
        ];
  const { filas, columnas } = abrirCajaGridFor(cajas.length);
  return {
    tipo: 'abrir_caja',
    configuracion: { filas, columnas, colorCaja: '#2563EB', animacionApertura: 'flip' },
    cajas,
  };
}

function normalizeAhorcado(raw: Record<string, unknown>): Record<string, unknown> {
  const palabra = asString(raw.palabra).trim().toUpperCase().replace(/\s+/g, '') || 'EJEMPLO';
  return {
    tipo: 'ahorcado',
    configuracion: {
      palabra,
      pista: asString(raw.pista),
      categoria: asString(raw.categoria),
      maxIntentos: 6,
    },
  };
}

function normalizePuzzlePalabras(raw: Record<string, unknown>): Record<string, unknown> {
  const oraciones = asArray(raw.oraciones)
    .map((o) => ({ texto: asString(asRecord(o).texto).trim() }))
    .filter((o) => o.texto.split(/\s+/).filter(Boolean).length >= 3);
  return {
    tipo: 'puzzle_palabras',
    configuracion: { mostrarPista: true, permitirReintento: true },
    oraciones: oraciones.length > 0 ? oraciones : [{ texto: 'Escribe una oración de ejemplo aquí' }],
  };
}

function normalizeJuegoOpciones(raw: unknown): { texto: string; correcta: boolean }[] {
  const opciones = asArray(raw)
    .map((op) => {
      const rec = asRecord(op);
      return { texto: asString(rec.texto), correcta: asBoolean(rec.correcta, false) };
    })
    .filter((o) => o.texto);
  if (opciones.length > 0 && !opciones.some((o) => o.correcta)) {
    opciones[0] = { ...opciones[0], correcta: true };
  }
  return opciones;
}

const JUEGO_PREGUNTA_EJEMPLO = {
  id: 'q-1',
  enunciado: 'Pregunta de ejemplo',
  opciones: [
    { texto: 'Correcta', correcta: true },
    { texto: 'Incorrecta', correcta: false },
  ],
};

function normalizeGlobos(raw: Record<string, unknown>): Record<string, unknown> {
  const preguntas = asArray(raw.preguntas)
    .map((q, i) => {
      const rec = asRecord(q);
      return {
        id: asString(rec.id, `q-${i + 1}`),
        enunciado: asString(rec.enunciado) || asString(rec.pregunta),
        opciones: normalizeJuegoOpciones(rec.opciones),
      };
    })
    .filter((q) => q.enunciado && q.opciones.length > 0);
  return {
    tipo: 'globos',
    configuracion: {
      velocidad: 'normal',
      vidas: 3,
      tiempoLimite: 60,
      colorGlobos: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    },
    preguntas: preguntas.length > 0 ? preguntas : [JUEGO_PREGUNTA_EJEMPLO],
  };
}

function normalizeTopo(raw: Record<string, unknown>): Record<string, unknown> {
  const preguntas = asArray(raw.preguntas)
    .map((q, i) => {
      const rec = asRecord(q);
      return {
        id: asString(rec.id, `q-${i + 1}`),
        enunciado: asString(rec.enunciado) || asString(rec.pregunta),
        opciones: normalizeJuegoOpciones(rec.opciones),
      };
    })
    .filter((q) => q.enunciado && q.opciones.length > 0);
  return {
    tipo: 'topo',
    configuracion: { velocidad: 'normal', vidas: 3, tiempoLimite: 60, filas: 2, columnas: 3 },
    preguntas: preguntas.length > 0 ? preguntas : [JUEGO_PREGUNTA_EJEMPLO],
  };
}

// ─── Historia ramificada — layout de nodos por niveles (BFS), no se confía en editorX/Y de la IA ─

const HISTORIA_NODO_TIPOS = new Set(['narracion', 'decision', 'pregunta', 'final_bueno', 'final_malo']);

function layoutHistoriaRamificadaNodos(
  nodoInicial: string,
  nodos: {
    id: string;
    tipo: string;
    titulo: string;
    contenido: { texto: string };
    opciones?: { id: string; texto: string; esCorrecta?: boolean }[];
  }[],
  conexiones: { id: string; desdeNodoId: string; opcionId: string; haciaNodoId: string }[],
) {
  const children = new Map<string, string[]>();
  for (const c of conexiones) {
    if (!children.has(c.desdeNodoId)) children.set(c.desdeNodoId, []);
    children.get(c.desdeNodoId)!.push(c.haciaNodoId);
  }
  const nivel = new Map<string, number>();
  const queue: string[] = [nodoInicial];
  nivel.set(nodoInicial, 0);
  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi];
    qi += 1;
    const lvl = nivel.get(id) ?? 0;
    for (const hijo of children.get(id) ?? []) {
      if (!nivel.has(hijo)) {
        nivel.set(hijo, lvl + 1);
        queue.push(hijo);
      }
    }
  }
  const porNivel = new Map<number, string[]>();
  nodos.forEach((n) => {
    const lvl = nivel.get(n.id) ?? 0;
    if (!porNivel.has(lvl)) porNivel.set(lvl, []);
    porNivel.get(lvl)!.push(n.id);
  });
  const pos = new Map<string, { x: number; y: number }>();
  for (const [lvl, ids] of porNivel) {
    const y = 50 + lvl * 170;
    const startX = 250 - ((ids.length - 1) * 150) / 2;
    ids.forEach((id, i) => pos.set(id, { x: Math.round(startX + i * 150), y }));
  }
  return nodos.map((n) => ({
    ...n,
    editorX: pos.get(n.id)?.x ?? 250,
    editorY: pos.get(n.id)?.y ?? 50,
  }));
}

function normalizeHistoriaRamificada(raw: Record<string, unknown>): Record<string, unknown> {
  const nodosBase = asArray(raw.nodos).map((n, i) => {
    const rec = asRecord(n);
    const tipoRaw = asString(rec.tipo);
    const tipo = HISTORIA_NODO_TIPOS.has(tipoRaw) ? tipoRaw : 'narracion';
    const contenido = asRecord(rec.contenido);
    const necesitaOpciones = tipo !== 'final_bueno' && tipo !== 'final_malo';
    const opciones = necesitaOpciones
      ? asArray(rec.opciones)
          .map((o, oi) => {
            const orec = asRecord(o);
            return {
              id: asString(orec.id, `nodo-${i + 1}-op-${oi + 1}`),
              texto: asString(orec.texto, `Opción ${oi + 1}`),
              ...(typeof orec.esCorrecta === 'boolean' ? { esCorrecta: orec.esCorrecta } : {}),
            };
          })
          .filter((o) => o.texto)
      : undefined;
    return {
      id: asString(rec.id, `nodo-${i + 1}`),
      tipo,
      titulo: asString(rec.titulo, `Nodo ${i + 1}`),
      contenido: { texto: asString(contenido.texto) },
      ...(opciones && opciones.length > 0 ? { opciones } : {}),
    };
  });

  if (nodosBase.length === 0) {
    return {
      tipo: 'historia_ramificada',
      configuracion: { mostrarProgreso: true, permitirRetroceder: false, tema: 'neutro' },
      nodoInicial: 'nodo-1',
      nodos: [
        {
          id: 'nodo-1',
          tipo: 'final_bueno',
          titulo: 'Fin',
          contenido: { texto: 'Historia de ejemplo.' },
          editorX: 250,
          editorY: 50,
        },
      ],
      conexiones: [],
    };
  }

  const idsValidos = new Set(nodosBase.map((n) => n.id));
  const conexiones = asArray(raw.conexiones)
    .map((c, i) => {
      const rec = asRecord(c);
      return {
        id: asString(rec.id, `con-${i + 1}`),
        desdeNodoId: asString(rec.desdeNodoId),
        opcionId: asString(rec.opcionId),
        haciaNodoId: asString(rec.haciaNodoId),
      };
    })
    .filter((c) => idsValidos.has(c.desdeNodoId) && idsValidos.has(c.haciaNodoId));

  const nodoInicialRaw = asString(raw.nodoInicial);
  const nodoInicial = idsValidos.has(nodoInicialRaw) ? nodoInicialRaw : nodosBase[0].id;
  const nodos = layoutHistoriaRamificadaNodos(nodoInicial, nodosBase, conexiones);

  return {
    tipo: 'historia_ramificada',
    configuracion: { mostrarProgreso: true, permitirRetroceder: false, tema: 'neutro' },
    nodoInicial,
    nodos,
    conexiones,
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
  if (tipo === 'video_interactivo') {
    return asArray(content.preguntas).some((q) => asString(asRecord(q).pregunta).trim());
  }
  if (tipo === 'encuesta_viva') {
    return asString(content.pregunta).trim().length > 0;
  }
  if (tipo === 'nube_palabras') {
    return asString(content.instruccion).trim().length > 0;
  }
  if (tipo === 'anagrama' || tipo === 'sopa_letras') {
    return asArray(content.palabras).some((p) => asString(asRecord(p).texto).trim());
  }
  if (tipo === 'clasificar') {
    return asArray(content.items).some((i) => asString(asRecord(i).texto).trim());
  }
  if (tipo === 'memoria') {
    return asArray(content.pares).some((p) => asString(asRecord(asRecord(p).lado1).texto).trim());
  }
  if (tipo === 'puzzle_imagen') {
    return true; // sin contenido de la IA — la imagen la sube el docente
  }
  if (tipo === 'crucigrama') {
    return asArray(content.palabras).some((p) => asString(asRecord(p).texto).trim());
  }
  if (tipo === 'abrir_caja') {
    return asArray(content.cajas).some((c) => asString(asRecord(asRecord(c).contenido).texto).trim());
  }
  if (tipo === 'ahorcado') {
    return asString(asRecord(content.configuracion).palabra).trim().length > 0;
  }
  if (tipo === 'puzzle_palabras') {
    return asArray(content.oraciones).some((o) => asString(asRecord(o).texto).trim());
  }
  if (tipo === 'globos' || tipo === 'topo') {
    return asArray(content.preguntas).some((q) => asString(asRecord(q).enunciado).trim());
  }
  if (tipo === 'historia_ramificada') {
    return asArray(content.nodos).length > 0;
  }
  return false;
}

export function activityTitleFromContent(content: Record<string, unknown>): string {
  const firstPregunta = asArray(content.preguntas)[0];
  const preguntaTexto = asString(asRecord(firstPregunta).texto) || asString(asRecord(firstPregunta).enunciado) || asString(asRecord(firstPregunta).pregunta);
  const textoPlano = asString(content.texto).replace(/\{\{blank:[^}]+\}\}/g, '____');
  const primeraPalabra = asString(asRecord(asArray(content.palabras)[0]).texto);
  const primeraOracion = asString(asRecord(asArray(content.oraciones)[0]).texto);
  const primerNodoTitulo = asString(asRecord(asArray(content.nodos)[0]).titulo);
  const candidates = [
    preguntaTexto,
    asString(content.afirmacion),
    asString(content.question),
    asString(content.pregunta),
    textoPlano,
    asString(content.instruccion),
    asString(asRecord(content.configuracion).palabra),
    primeraPalabra,
    primeraOracion,
    primerNodoTitulo,
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
  { value: 'video_interactivo', label: 'Video interactivo', hint: 'Preguntas insertadas en un video (pega la URL después).' },
  { value: 'encuesta_viva', label: 'Encuesta en vivo', hint: 'Pregunta de opinión con varias opciones.' },
  { value: 'nube_palabras', label: 'Nube de palabras', hint: 'Instrucción para aportar palabras colaborativamente.' },
  { value: 'anagrama', label: 'Anagrama', hint: 'Palabras para ordenar sus letras.' },
  { value: 'clasificar', label: 'Clasificar', hint: 'Elementos que se arrastran a su categoría.' },
  { value: 'memoria', label: 'Memoria', hint: 'Pares de cartas término–definición.' },
  { value: 'puzzle_imagen', label: 'Puzzle de imagen', hint: 'Rompecabezas — sube la imagen tú manualmente.' },
  { value: 'sopa_letras', label: 'Sopa de letras', hint: 'Palabras escondidas en un grid.' },
  { value: 'crucigrama', label: 'Crucigrama', hint: 'Palabras cruzadas con pistas.' },
  { value: 'abrir_caja', label: 'Abrir caja', hint: 'Cajas con datos o mini-retos, algunas premiadas.' },
  { value: 'ahorcado', label: 'Ahorcado', hint: 'Una palabra con pista para adivinar letra a letra.' },
  { value: 'puzzle_palabras', label: 'Puzzle de palabras', hint: 'Oraciones para reordenar sus palabras.' },
  { value: 'globos', label: 'Globos', hint: 'Preguntas de opción múltiple en globos que suben.' },
  { value: 'topo', label: 'Golpea al topo', hint: 'Preguntas de opción múltiple, golpea la correcta.' },
  { value: 'historia_ramificada', label: 'Historia ramificada', hint: 'Narrativa interactiva con decisiones.' },
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
    case 'video_interactivo':
      return full ? 4 : 2;
    case 'encuesta_viva':
      return full ? 5 : 4;
    case 'nube_palabras':
      return 1;
    case 'anagrama':
      return full ? 5 : 3;
    case 'clasificar':
      return full ? 9 : 6;
    case 'memoria':
      return full ? 8 : 6;
    case 'puzzle_imagen':
      return 1;
    case 'sopa_letras':
      return full ? 8 : 5;
    case 'crucigrama':
      return full ? 7 : 5;
    case 'abrir_caja':
      return full ? 9 : 6;
    case 'ahorcado':
      return 1;
    case 'puzzle_palabras':
      return full ? 5 : 3;
    case 'globos':
      return full ? 5 : 3;
    case 'topo':
      return full ? 5 : 3;
    case 'historia_ramificada':
      return full ? 6 : 4;
  }
}
