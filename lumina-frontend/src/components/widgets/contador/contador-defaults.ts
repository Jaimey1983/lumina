import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type {
  ContadorAlTerminar,
  ContadorFormato,
  ContadorModo,
  ContadorWidget,
} from '@/types/widget.types';

export const DEFAULT_CONTADOR_MODO: ContadorModo = 'temporizador';
export const DEFAULT_CONTADOR_FORMATO: ContadorFormato = 'mm:ss';
export const DEFAULT_CONTADOR_AL_TERMINAR: ContadorAlTerminar = 'ninguna';
export const DEFAULT_CONTADOR_SEGUNDOS = 60;
export const DEFAULT_CONTADOR_VALOR = 0;
export const DEFAULT_CONTADOR_PASO = 1;
export const DEFAULT_CONTADOR_FONDO = '#1e293b';
export const DEFAULT_CONTADOR_TEXTO = '#f8fafc';
export const DEFAULT_CONTADOR_ACENTO = '#38bdf8';

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

export function normalizeContadorWidget(block: ContadorWidget): ContadorWidget {
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
  };
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
