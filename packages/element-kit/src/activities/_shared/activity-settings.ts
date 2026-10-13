/**
 * U2 — normalizador de los ajustes comunes de una actividad (etapa U / DU3).
 *
 * `normalizarAjustes(actividad)` devuelve siempre un objeto COMPLETO (`AjustesResueltos`):
 * toma `actividad.ajustes` si es válido y, campo por campo, cae a lo que ya dicen los
 * campos propios de cada tipo (`DERIVACION_LEGACY`) y, por último, a los valores por
 * defecto que reproducen el comportamiento de antes de U2. No muta, no lee de la red, no
 * toca el scoring: solo describe cómo debe comportarse la actividad.
 *
 * Contrato (DU3): `ajustes` gana; sin `ajustes` se deriva de los campos legacy; no hay
 * migración de datos en BD y ningún `tipo` cambia.
 */
import { esEvaluable } from '@lumina/scoring';
import type {
  Activity,
  ActivityEstilo,
  ActivityModo,
  ActivityRetroMomento,
  ActivitySettings,
} from '@lumina/types/slide';

export interface AjustesResueltos {
  readonly modo: ActivityModo;
  /** Intentos por unidad de respuesta; `null` = ilimitados. */
  readonly intentos: number | null;
  /** Segundos; `null` = sin límite. Ver `tiempoPorPregunta`. */
  readonly tiempoLimiteSeg: number | null;
  /** `true` si el límite aplica a cada pregunta (quiz sincronizado), no a la actividad completa. */
  readonly tiempoPorPregunta: boolean;
  readonly vidas: number | null;
  readonly barajar: boolean;
  readonly semilla: number | null;
  readonly pistas: { readonly cantidad: number | null; readonly costoPct: number };
  readonly mostrarNota: boolean;
  readonly mostrarSolucion: boolean;
  readonly retroalimentacion: ActivityRetroMomento;
  readonly sonido: boolean;
  readonly estilo: ActivityEstilo;
}

/** Estilos válidos, en el orden en que se ofrecen. */
export const ESTILOS_ACTIVIDAD: readonly ActivityEstilo[] = ['escolar', 'examen', 'arcade', 'minimal', 'pizarra'];

type Tipo = Activity['tipo'];

/**
 * Tipos cuyo viewer baraja SIEMPRE (hoy, sin opción de apagarlo): su `barajar` por defecto
 * es `true` para no cambiar el comportamiento al migrar. El resto, `false`.
 * (`quiz_multiple` tiene sus propios flags: se derivan abajo.)
 */
const BARAJA_POR_DEFECTO: ReadonlySet<Tipo> = new Set<Tipo>([
  'emparejar',
  'relacionar_lineas',
  'etiquetar_imagen',
  'linea_tiempo',
  'cloze_banco',
  'ordenar_pasos',
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'anagrama',
  'puzzle_palabras',
  'globos',
  'topo',
]);

/**
 * Tipos cuyo viewer ofrece «Reintentar» sin límite (vuelve a jugar desde el resultado del shell): su
 * `intentos` por defecto es `null`. El resto (las clásicas) admite una sola respuesta.
 */
const REINTENTA_POR_DEFECTO: ReadonlySet<Tipo> = new Set<Tipo>([
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'sopa_letras',
  'crucigrama',
  'anagrama',
  'ahorcado',
  'puzzle_palabras',
  'abrir_caja',
  'globos',
  'topo',
  'historia_ramificada',
]);

/**
 * TABLA DE DERIVACIÓN (medida actividad por actividad, Regla 9 §3). Para cada tipo, qué
 * ajuste sale de qué campo propio y si ese campo LO LEE hoy un viewer (L) o solo está
 * declarado en el tipo (T, sin lector ni editor: NO se deriva para no activar un
 * comportamiento que nadie ha visto). Es documentación ejecutable: el spec la recorre.
 */
export const DERIVACION_LEGACY: Readonly<Record<Tipo, readonly string[]>> = {
  quiz_multiple: [
    'barajar ← shuffleOptions || shufflePreguntas (L)',
    'tiempoLimiteSeg ← timePerQuestion, solo si deliveryMode = SYNCED, por pregunta (L)',
    'mostrarSolucion ← preguntas[].retroalimentacion: no se deriva (cada pregunta lleva la suya)',
  ],
  verdadero_falso: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (L)'],
  short_answer: ['pistas.cantidad ← hint no vacío ? 1 : 0 (L)'],
  respuesta_matematica: ['pistas.cantidad ← hint no vacío ? 1 : 0 (L)'],
  balancear_ecuacion: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  ubicar_elemento: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  formular_compuesto: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  completar_blancos: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  arrastrar_soltar: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  emparejar: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  relacionar_lineas: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  etiquetar_imagen: [],
  linea_tiempo: [],
  cloze_banco: [],
  problema_pasos: ['pistas.cantidad ← algún paso con pistas ? null (ilimitadas) : 0 (L)'],
  ordenar_pasos: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  video_interactivo: ['mostrarSolucion ← retroalimentacion.mostrarExplicacion (T)'],
  encuesta_viva: ['tiempoLimiteSeg ← tiempoLimiteSeg (L)'],
  nube_palabras: [],
  torneo: [],
  escape_room: ['tiempoLimiteSeg ← tiempoLimiteMinutos × 60 (viewer fuera del kit)'],
  clasificar: ['intentos ← configuracion.permitirReintento ? null : 1 (L)'],
  memoria: ['(mostrarTimer es solo visual: no se deriva)'],
  puzzle_imagen: ['(mostrarVista y dificultad son propias del tipo: no se derivan)'],
  sopa_letras: ['(mostrarLista es propia del tipo: no se deriva)'],
  crucigrama: [],
  anagrama: [
    'intentos ← configuracion.intentos (0 = null) (L)',
    'pistas.cantidad ← configuracion.mostrarPista ? null : 0 (L)',
    'configuracion.tiempoLimite: declarado pero sin lector ni editor (T): no se deriva',
  ],
  ahorcado: [
    'vidas ← configuracion.maxIntentos (L)',
    'pistas.cantidad ← configuracion.pista no vacía ? 1 : 0 (L)',
  ],
  puzzle_palabras: [
    'intentos ← configuracion.permitirReintento ? null : 1 (L)',
    'pistas.cantidad ← configuracion.mostrarPista ? null : 0 (L)',
  ],
  abrir_caja: [],
  globos: ['vidas ← configuracion.vidas (L)', 'tiempoLimiteSeg ← configuracion.tiempoLimite (L)'],
  topo: ['vidas ← configuracion.vidas (L)', 'tiempoLimiteSeg ← configuracion.tiempoLimite (L)'],
  ruleta: [],
  historia_ramificada: ['(permitirRetroceder y mostrarProgreso son propias del tipo: no se derivan)'],
};

// ─── Lectura defensiva (el JSON viene del slide y puede ser cualquier cosa) ───────────

type Registro = Record<string, unknown>;

function esRegistro(v: unknown): v is Registro {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Límite en segundos/unidades: entero > 0 o `null` (sin límite). `undefined` = no válido. */
function limite(v: unknown, max: number): number | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  if (v <= 0) return null;
  return Math.min(Math.floor(v), max);
}

function modoValido(v: unknown): ActivityModo | undefined {
  return v === 'practica' || v === 'evaluacion' ? v : undefined;
}

function retroValida(v: unknown): ActivityRetroMomento | undefined {
  return v === 'inmediata' || v === 'al_final' || v === 'ninguna' ? v : undefined;
}

function estiloValido(v: unknown): ActivityEstilo | undefined {
  return typeof v === 'string' && (ESTILOS_ACTIVIDAD as readonly string[]).includes(v)
    ? (v as ActivityEstilo)
    : undefined;
}

function texto(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Lo que ya dicen los campos propios del tipo (ver `DERIVACION_LEGACY`). */
function derivarDeCamposLegacy(a: Activity): {
  [K in keyof AjustesResueltos]?: AjustesResueltos[K];
} {
  const o = a as unknown as Registro;
  const cfg = esRegistro(o.configuracion) ? o.configuracion : {};
  const retro = esRegistro(o.retroalimentacion) ? o.retroalimentacion : {};
  const out: { -readonly [K in keyof AjustesResueltos]?: AjustesResueltos[K] } = {};

  switch (a.tipo) {
    case 'quiz_multiple': {
      if (a.shuffleOptions === true || a.shufflePreguntas === true) out.barajar = true;
      const t = a.deliveryMode === 'SYNCED' ? limite(a.timePerQuestion, 86_400) : undefined;
      if (t !== undefined) {
        out.tiempoLimiteSeg = t;
        out.tiempoPorPregunta = true;
      }
      break;
    }
    case 'verdadero_falso':
      if (typeof retro.mostrarExplicacion === 'boolean') out.mostrarSolucion = retro.mostrarExplicacion;
      break;
    case 'short_answer':
    case 'respuesta_matematica':
      out.pistas = { cantidad: texto(a.hint) ? 1 : 0, costoPct: 0 };
      break;
    case 'problema_pasos':
      out.pistas = { cantidad: a.pasos?.some((p) => (p.pistas ?? []).some((x) => texto(x))) ? null : 0, costoPct: 0 };
      break;
    case 'encuesta_viva': {
      const t = limite(a.tiempoLimiteSeg, 86_400);
      if (t !== undefined) out.tiempoLimiteSeg = t;
      break;
    }
    case 'escape_room': {
      const t = limite(a.tiempoLimiteMinutos, 1_440);
      if (t !== undefined) out.tiempoLimiteSeg = t === null ? null : t * 60;
      break;
    }
    case 'clasificar':
      if (typeof cfg.permitirReintento === 'boolean') out.intentos = cfg.permitirReintento ? null : 1;
      break;
    case 'puzzle_palabras':
      if (typeof cfg.permitirReintento === 'boolean') out.intentos = cfg.permitirReintento ? null : 1;
      if (typeof cfg.mostrarPista === 'boolean') {
        out.pistas = { cantidad: cfg.mostrarPista ? null : 0, costoPct: 0 };
      }
      break;
    case 'anagrama': {
      const i = limite(cfg.intentos, 99);
      if (i !== undefined) out.intentos = i;
      if (typeof cfg.mostrarPista === 'boolean') {
        out.pistas = { cantidad: cfg.mostrarPista ? null : 0, costoPct: 0 };
      }
      break;
    }
    case 'ahorcado': {
      const v = limite(cfg.maxIntentos, 20);
      if (v !== undefined) out.vidas = v;
      out.pistas = { cantidad: texto(cfg.pista) ? 1 : 0, costoPct: 0 };
      break;
    }
    case 'globos':
    case 'topo': {
      const v = limite(cfg.vidas, 20);
      if (v !== undefined) out.vidas = v;
      const t = limite(cfg.tiempoLimite, 86_400);
      if (t !== undefined) out.tiempoLimiteSeg = t;
      break;
    }
    default:
      // Tipos con `retroalimentacion?: Feedback` declarada pero sin lector (T).
      if (typeof retro.mostrarExplicacion === 'boolean') out.mostrarSolucion = retro.mostrarExplicacion;
  }
  return out;
}

/** `ajustes` del slide, ya depurado: solo campos con el tipo correcto y en rango. */
function ajustesValidos(raw: unknown): ActivitySettings {
  if (!esRegistro(raw)) return {};
  const out: { -readonly [K in keyof ActivitySettings]: ActivitySettings[K] } = {};
  const modo = modoValido(raw.modo);
  if (modo) out.modo = modo;
  const intentos = limite(raw.intentos, 99);
  if (intentos !== undefined) out.intentos = intentos;
  const tiempo = limite(raw.tiempoLimiteSeg, 86_400);
  if (tiempo !== undefined) out.tiempoLimiteSeg = tiempo;
  const vidas = limite(raw.vidas, 20);
  if (vidas !== undefined) out.vidas = vidas;
  if (typeof raw.barajar === 'boolean') out.barajar = raw.barajar;
  if (raw.semilla === null) out.semilla = null;
  else if (typeof raw.semilla === 'number' && Number.isFinite(raw.semilla)) out.semilla = Math.trunc(raw.semilla);
  if (esRegistro(raw.pistas)) {
    const p: { cantidad?: number | null; costoPct?: number } = {};
    if (raw.pistas.cantidad === null) p.cantidad = null;
    else if (typeof raw.pistas.cantidad === 'number' && Number.isFinite(raw.pistas.cantidad)) {
      p.cantidad = Math.max(0, Math.min(Math.floor(raw.pistas.cantidad), 99));
    }
    if (typeof raw.pistas.costoPct === 'number' && Number.isFinite(raw.pistas.costoPct)) {
      p.costoPct = Math.max(0, Math.min(raw.pistas.costoPct, 100));
    }
    if (Object.keys(p).length > 0) out.pistas = p;
  }
  if (typeof raw.mostrarNota === 'boolean') out.mostrarNota = raw.mostrarNota;
  if (typeof raw.mostrarSolucion === 'boolean') out.mostrarSolucion = raw.mostrarSolucion;
  const retro = retroValida(raw.retroalimentacion);
  if (retro) out.retroalimentacion = retro;
  if (typeof raw.sonido === 'boolean') out.sonido = raw.sonido;
  const estilo = estiloValido(raw.estilo);
  if (estilo) out.estilo = estilo;
  return out;
}

/**
 * Ajustes completos de una actividad. Precedencia por campo: `ajustes` → campo legacy del
 * tipo → valor por defecto. Pura; no muta `actividad`.
 */
export function normalizarAjustes(actividad: Activity): AjustesResueltos {
  const propios = ajustesValidos((actividad as { ajustes?: unknown }).ajustes);
  const legacy = derivarDeCamposLegacy(actividad);
  const tipo = actividad.tipo;
  const evaluable = esEvaluable(tipo);

  const pistasDefecto = { cantidad: 0, costoPct: 0 } as const;
  const pistasLegacy = legacy.pistas ?? pistasDefecto;
  const pistas = {
    cantidad: propios.pistas?.cantidad !== undefined ? propios.pistas.cantidad : pistasLegacy.cantidad,
    costoPct: propios.pistas?.costoPct ?? pistasLegacy.costoPct,
  };

  const tiempoPropio = propios.tiempoLimiteSeg !== undefined;
  return {
    modo: propios.modo ?? (evaluable ? 'evaluacion' : 'practica'),
    intentos:
      propios.intentos !== undefined
        ? propios.intentos
        : legacy.intentos !== undefined
          ? legacy.intentos
          : REINTENTA_POR_DEFECTO.has(tipo)
            ? null
            : 1,
    tiempoLimiteSeg: tiempoPropio ? (propios.tiempoLimiteSeg ?? null) : (legacy.tiempoLimiteSeg ?? null),
    tiempoPorPregunta: tiempoPropio
      ? tipo === 'quiz_multiple' && actividad.deliveryMode === 'SYNCED'
      : (legacy.tiempoPorPregunta ?? false),
    vidas: propios.vidas !== undefined ? propios.vidas : (legacy.vidas ?? null),
    barajar: propios.barajar ?? legacy.barajar ?? BARAJA_POR_DEFECTO.has(tipo),
    semilla: propios.semilla ?? null,
    pistas,
    mostrarNota: propios.mostrarNota ?? evaluable,
    mostrarSolucion: propios.mostrarSolucion ?? legacy.mostrarSolucion ?? false,
    retroalimentacion: propios.retroalimentacion ?? 'inmediata',
    sonido: propios.sonido ?? true,
    estilo: propios.estilo ?? 'escolar',
  };
}
