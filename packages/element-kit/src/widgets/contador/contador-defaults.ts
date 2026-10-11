import type { BlockMarco } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';
import type {
  ContadorAlTerminar,
  ContadorFormato,
  ContadorModo,
  ContadorWidget,
} from '@lumina/types/widget';

export const DEFAULT_CONTADOR_MODO: ContadorModo = 'temporizador';
export const DEFAULT_CONTADOR_FORMATO: ContadorFormato = 'mm:ss';
export const DEFAULT_CONTADOR_AL_TERMINAR: ContadorAlTerminar = 'ninguna';
export const DEFAULT_CONTADOR_SEGUNDOS = 60;
export const DEFAULT_CONTADOR_VALOR = 0;
export const DEFAULT_CONTADOR_PASO = 1;
export const DEFAULT_CONTADOR_FONDO = '#1e293b';
export const DEFAULT_CONTADOR_TEXTO = '#f8fafc';
export const DEFAULT_CONTADOR_ACENTO = '#38bdf8';

/**
 * Opciones de T10 que aún no están en `ContadorWidget` de `@lumina/types` (fuera del alcance de
 * esa ficha). Se leen del JSON guardado con estos tipos; subirlas a `@lumina/types` queda como
 * seguimiento (igual que T6–T9).
 */
export type ContadorVariante = 'digitos' | 'flip' | 'anillo';
export type ContadorHitosAlerta = 'visual' | 'sonora' | 'ambas';

export interface ContadorHito {
  /**
   * Segundos. En el temporizador: cuando QUEDAN esos segundos; en el cronómetro: cuando han
   * TRANSCURRIDO. En modo número no se usan.
   */
  segundos: number;
  etiqueta: string;
}

export interface ContadorT10 {
  variante?: ContadorVariante;
  hitos?: ContadorHito[];
  /** Cómo avisan los hitos. Por defecto `visual`. */
  hitosAlerta?: ContadorHitosAlerta;
  /** Teñe el contador de verde / amarillo / rojo según el tiempo que queda (solo temporizador). */
  semaforo?: boolean;
}

export type ContadorWidgetT10 = ContadorWidget & ContadorT10;

export const CONTADOR_VARIANTES: { id: ContadorVariante; label: string }[] = [
  { id: 'digitos', label: 'Dígitos' },
  { id: 'flip', label: 'Flip-clock' },
  { id: 'anillo', label: 'Anillo' },
];
export const CONTADOR_ALERTAS: { id: ContadorHitosAlerta; label: string }[] = [
  { id: 'visual', label: 'Visual' },
  { id: 'sonora', label: 'Sonora' },
  { id: 'ambas', label: 'Ambas' },
];
export const CONTADOR_MAX_HITOS = 6;

const VALID_VARIANTES = new Set<ContadorVariante>(['digitos', 'flip', 'anillo']);
const VALID_ALERTAS = new Set<ContadorHitosAlerta>(['visual', 'sonora', 'ambas']);

function normalizarHitos(raw: unknown): ContadorHito[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h): h is { segundos: unknown; etiqueta?: unknown } => !!h && typeof h === 'object')
    .filter((h) => Number(h.segundos) >= 1)
    .map((h) => ({
      segundos: asInt(h.segundos, 1, 1, MAX_SEGUNDOS),
      etiqueta: typeof h.etiqueta === 'string' ? h.etiqueta.trim().slice(0, 24) : '',
    }))
    .slice(0, CONTADOR_MAX_HITOS)
    .sort((a, b) => a.segundos - b.segundos);
}

export type ContadorSemaforo = 'verde' | 'amarillo' | 'rojo';

/** Fracción del tiempo que queda → color del semáforo (más de la mitad, más del 20 %, el resto). */
export function semaforoDeFraccion(fraccionRestante: number): ContadorSemaforo {
  if (fraccionRestante > 0.5) return 'verde';
  if (fraccionRestante > 0.2) return 'amarillo';
  return 'rojo';
}

/**
 * Índices de los hitos ya alcanzados. Temporizador: quedan `<=` hito.segundos (y el hito está
 * por debajo de la duración total, así no suena nada al arrancar). Cronómetro: transcurrido `>=`.
 */
export function hitosAlcanzados(
  modo: ContadorModo,
  segundosActuales: number,
  hitos: readonly ContadorHito[],
  duracionTotal: number,
): number[] {
  if (modo === 'numero') return [];
  const out: number[] = [];
  hitos.forEach((h, i) => {
    if (modo === 'temporizador') {
      if (h.segundos < duracionTotal && Math.ceil(segundosActuales) <= h.segundos) out.push(i);
    } else if (Math.floor(segundosActuales) >= h.segundos) out.push(i);
  });
  return out;
}

const VALID_MODOS = new Set<ContadorModo>(['temporizador', 'cronometro', 'numero']);
const VALID_FORMATOS = new Set<ContadorFormato>(['mm:ss', 'hh:mm:ss']);
const VALID_AL_TERMINAR = new Set<ContadorAlTerminar>(['ninguna', 'siguiente']);
const HEX = /^#[0-9A-Fa-f]{6}$/;

const MAX_SEGUNDOS = 359999;

function asHex(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value) ? value : fallback;
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function formatContadorTime(totalSeconds: number, formato: ContadorFormato): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (formato === 'hh:mm:ss' || h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

export function normalizeContadorWidget(rawBlock: ContadorWidget): ContadorWidget {
  const block = rawBlock as ContadorWidgetT10;
  const modo = VALID_MODOS.has(block.modo) ? block.modo : DEFAULT_CONTADOR_MODO;
  const formato = VALID_FORMATOS.has(block.formato as ContadorFormato)
    ? (block.formato as ContadorFormato)
    : DEFAULT_CONTADOR_FORMATO;
  const alTerminar = VALID_AL_TERMINAR.has(block.alTerminar as ContadorAlTerminar)
    ? (block.alTerminar as ContadorAlTerminar)
    : DEFAULT_CONTADOR_AL_TERMINAR;

  return {
    tipo: 'contador',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    modo,
    etiqueta: typeof block.etiqueta === 'string' ? block.etiqueta : '',
    segundos: asInt(block.segundos, DEFAULT_CONTADOR_SEGUNDOS, 1, MAX_SEGUNDOS),
    valorInicial: asInt(block.valorInicial, DEFAULT_CONTADOR_VALOR, -999999, 999999),
    valorPaso: asInt(block.valorPaso, DEFAULT_CONTADOR_PASO, 1, 1000),
    formato,
    autoIniciar: block.autoIniciar !== false,
    mostrarControles: block.mostrarControles !== false,
    alTerminar,
    colorFondo: asHex(block.colorFondo, DEFAULT_CONTADOR_FONDO),
    colorTexto: asHex(block.colorTexto, DEFAULT_CONTADOR_TEXTO),
    colorAcento: asHex(block.colorAcento, DEFAULT_CONTADOR_ACENTO),
    // T10: opciones nuevas; solo se escriben cuando traen un valor válido y distinto del defecto.
    ...(VALID_VARIANTES.has(block.variante as ContadorVariante) && block.variante !== 'digitos'
      ? { variante: block.variante }
      : {}),
    ...(normalizarHitos(block.hitos).length > 0 ? { hitos: normalizarHitos(block.hitos) } : {}),
    ...(VALID_ALERTAS.has(block.hitosAlerta as ContadorHitosAlerta) && block.hitosAlerta !== 'visual'
      ? { hitosAlerta: block.hitosAlerta }
      : {}),
    ...(block.semaforo === true ? { semaforo: true } : {}),
  } as ContadorWidget;
}

export function createDefaultContadorBlock(marco?: BlockMarco): ContadorWidget {
  const fb = BLOCK_FALLBACKS.contador;
  return normalizeContadorWidget({
    tipo: 'contador',
    modo: DEFAULT_CONTADOR_MODO,
    etiqueta: 'Tiempo',
    segundos: DEFAULT_CONTADOR_SEGUNDOS,
    valorInicial: DEFAULT_CONTADOR_VALOR,
    valorPaso: DEFAULT_CONTADOR_PASO,
    formato: DEFAULT_CONTADOR_FORMATO,
    autoIniciar: true,
    mostrarControles: true,
    alTerminar: DEFAULT_CONTADOR_AL_TERMINAR,
    colorFondo: DEFAULT_CONTADOR_FONDO,
    colorTexto: DEFAULT_CONTADOR_TEXTO,
    colorAcento: DEFAULT_CONTADOR_ACENTO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
  });
}
