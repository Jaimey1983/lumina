import type {
  AparienciaEstado,
  Condicion,
  Operando,
  EstadoConApariencia,
  EstadoPersonalizado,
} from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import { recorrerBloquesDeSlide } from './recolectar.js';
import { accionesDeRegla } from './reglas.js';
import type { ReglaAplicable } from './tipos.js';

/**
 * Estados de objeto con apariencia y estados personalizados (N6). Puro y
 * declarativo: no hay CSS libre; cada valor está acotado. C1/C4: un estado es
 * una etiqueta de flujo/aspecto, nunca una nota.
 */

export const MAX_ESTADOS_PERSONALIZADOS = 8;
export const MAX_NOMBRE_ESTADO = 40;

/** Estados base de `EstadoObjeto`: sus ids no se pueden usar como personalizados. */
export const ESTADOS_BASE = ['normal', 'visitado', 'seleccionado', 'deshabilitado'] as const;

/** Ids reservados: los base más los dos que solo tienen apariencia. */
export const ESTADOS_CON_APARIENCIA: readonly EstadoConApariencia[] = Object.freeze([
  'normal',
  'hover',
  'down',
  'visitado',
  'seleccionado',
  'deshabilitado',
]);

const RESERVADOS = new Set<string>(ESTADOS_CON_APARIENCIA);

export const RANGOS_APARIENCIA = Object.freeze({
  opacidad: { min: 0, max: 1 },
  escala: { min: 0.5, max: 1.5 },
  sombra: { min: 0, max: 3 },
  brillo: { min: 0.5, max: 1.5 },
});

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function esColorHex(v: unknown): v is string {
  return typeof v === 'string' && HEX.test(v);
}

export function esEstadoBase(estado: string): boolean {
  return (ESTADOS_BASE as readonly string[]).includes(estado);
}

export interface ErrorApariencia {
  campo: keyof AparienciaEstado | 'general';
  mensaje: string;
}

/** Valida una apariencia; devuelve los problemas (vacío = válida). */
export function validarApariencia(a: unknown): ErrorApariencia[] {
  const errores: ErrorApariencia[] = [];
  if (typeof a !== 'object' || a === null || Array.isArray(a)) {
    return [{ campo: 'general', mensaje: 'La apariencia debe ser un objeto.' }];
  }
  const o = a as Record<string, unknown>;
  const permitidas = new Set(['opacidad', 'escala', 'fondo', 'borde', 'sombra', 'brillo']);
  for (const k of Object.keys(o)) {
    if (!permitidas.has(k)) errores.push({ campo: 'general', mensaje: `Propiedad «${k}» no permitida.` });
  }
  for (const k of ['opacidad', 'escala', 'sombra', 'brillo'] as const) {
    const v = o[k];
    if (v === undefined) continue;
    const { min, max } = RANGOS_APARIENCIA[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
      errores.push({ campo: k, mensaje: `«${k}» debe ser un número entre ${min} y ${max}.` });
    }
  }
  for (const k of ['fondo', 'borde'] as const) {
    const v = o[k];
    if (v !== undefined && !esColorHex(v)) {
      errores.push({ campo: k, mensaje: `«${k}» debe ser un color #rgb o #rrggbb.` });
    }
  }
  return errores;
}

/** Copia solo lo válido de una apariencia (para normalizar JSON editable). */
export function sanearApariencia(a: unknown): AparienciaEstado {
  const out: AparienciaEstado = {};
  if (typeof a !== 'object' || a === null || Array.isArray(a)) return out;
  const o = a as Record<string, unknown>;
  for (const k of ['opacidad', 'escala', 'sombra', 'brillo'] as const) {
    const v = o[k];
    const { min, max } = RANGOS_APARIENCIA[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max) out[k] = v;
  }
  for (const k of ['fondo', 'borde'] as const) {
    if (esColorHex(o[k])) out[k] = o[k] as string;
  }
  return out;
}

export interface ErrorEstadosPersonalizados {
  indice: number;
  mensaje: string;
}

/** Valida la lista de estados personalizados de UN bloque. */
export function validarEstadosPersonalizados(
  lista: readonly EstadoPersonalizado[] | undefined,
): ErrorEstadosPersonalizados[] {
  const errores: ErrorEstadosPersonalizados[] = [];
  if (lista === undefined) return errores;
  if (lista.length > MAX_ESTADOS_PERSONALIZADOS) {
    errores.push({
      indice: -1,
      mensaje: `Máximo ${MAX_ESTADOS_PERSONALIZADOS} estados personalizados por elemento.`,
    });
  }
  const vistos = new Set<string>();
  lista.forEach((e, i) => {
    if (typeof e.id !== 'string' || e.id === '') {
      errores.push({ indice: i, mensaje: 'El estado necesita un id.' });
    } else if (RESERVADOS.has(e.id)) {
      errores.push({ indice: i, mensaje: `«${e.id}» es un estado propio del sistema.` });
    } else if (vistos.has(e.id)) {
      errores.push({ indice: i, mensaje: `El id «${e.id}» está repetido.` });
    }
    vistos.add(e.id);
    if (typeof e.nombre !== 'string' || e.nombre.trim() === '' || e.nombre.length > MAX_NOMBRE_ESTADO) {
      errores.push({
        indice: i,
        mensaje: `El nombre debe tener entre 1 y ${MAX_NOMBRE_ESTADO} caracteres.`,
      });
    }
    for (const err of validarApariencia(e.apariencia)) {
      errores.push({ indice: i, mensaje: err.mensaje });
    }
  });
  return errores;
}

/** Ids de estados personalizados declarados en un bloque. */
export function idsDeEstadosPersonalizados(bloque: Pick<Block, 'estadosPersonalizados'>): string[] {
  return (bloque.estadosPersonalizados ?? [])
    .map((e) => e.id)
    .filter((id): id is string => typeof id === 'string' && id !== '');
}

/**
 * Estados personalizados declarados por `bloqueId` en los slides y sus capas.
 * Solo aparecen bloques que declaran al menos uno.
 */
export function estadosPersonalizadosPorBloque(
  slides: readonly Pick<Slide, 'bloques' | 'capas'>[],
): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = Object.create(null) as Record<
    string,
    readonly string[]
  >;
  for (const slide of slides) {
    recorrerBloquesDeSlide(slide, (b) => {
      const id = idDeBloque(b);
      if (id === undefined) return;
      const ids = idsDeEstadosPersonalizados(b);
      if (ids.length > 0) out[id] = ids;
    });
  }
  return out;
}

/** ¿Es `estado` un estado válido para ese bloque (base o personalizado declarado)? */
export function estadoDeclarado(
  estado: string,
  bloqueId: string,
  declarados: Readonly<Record<string, readonly string[]>> | undefined,
): boolean {
  if (esEstadoBase(estado)) return true;
  if (declarados === undefined || !Object.hasOwn(declarados, bloqueId)) return false;
  return (declarados[bloqueId] as readonly string[]).includes(estado);
}

/** Apariencia que corresponde a un estado del bloque (base, hover/down o personalizado). */
export function aparienciaDeEstado(
  bloque: Pick<Block, 'apariencias' | 'estadosPersonalizados'>,
  estado: string,
): AparienciaEstado | undefined {
  const personalizado = bloque.estadosPersonalizados?.find((e) => e.id === estado);
  if (personalizado) return personalizado.apariencia;
  if (!RESERVADOS.has(estado)) return undefined;
  return bloque.apariencias?.[estado as EstadoConApariencia];
}

// ─── Contraste (aviso en el panel, nunca bloqueo) ────────────────────────────

function aRgb(hex: string): [number, number, number] | undefined {
  if (!esColorHex(hex)) return undefined;
  const h = hex.slice(1);
  const c = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const f = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razón de contraste WCAG entre dos colores hex; `undefined` si alguno no es válido. */
export function razonDeContraste(a: string, b: string): number | undefined {
  const ra = aRgb(a);
  const rb = aRgb(b);
  if (!ra || !rb) return undefined;
  const la = luminancia(ra);
  const lb = luminancia(rb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** AA para texto normal (4.5:1). */
export function cumpleAA(a: string, b: string): boolean | undefined {
  const r = razonDeContraste(a, b);
  return r === undefined ? undefined : r >= 4.5;
}

// ─── Uso de un estado personalizado (para bloquear su borrado) ───────────────

export interface UsoDeEstado {
  reglaId: string;
  slideId: string;
  bloqueId?: string;
}

function operandoEsEstadoDe(op: Operando, bloqueId: string): boolean {
  return op.tipo === 'estado_bloque' && op.bloqueId === bloqueId;
}

function operandoEsLiteral(op: Operando, valor: string): boolean {
  return op.tipo === 'literal' && op.valor === valor;
}

function condicionUsaEstado(c: Condicion, bloqueId: string, estado: string, prof = 0): boolean {
  if (prof > 64) return true;
  switch (c.tipo) {
    case 'comparacion':
      return (
        (operandoEsEstadoDe(c.izquierda, bloqueId) && operandoEsLiteral(c.derecha, estado)) ||
        (operandoEsEstadoDe(c.derecha, bloqueId) && operandoEsLiteral(c.izquierda, estado))
      );
    case 'y':
    case 'o':
      return c.condiciones.some((x) => condicionUsaEstado(x, bloqueId, estado, prof + 1));
    case 'no':
      return condicionUsaEstado(c.condicion, bloqueId, estado, prof + 1);
    default:
      return false;
  }
}

/**
 * Reglas que asignan o comparan un estado personalizado de un bloque. La usa el
 * panel para IMPEDIR borrarlo en uso y decir dónde se usa (como las variables).
 */
export function usosDeEstado(
  reglas: readonly ReglaAplicable[],
  bloqueId: string,
  estado: string,
): UsoDeEstado[] {
  const usos: UsoDeEstado[] = [];
  for (const { regla, origen } of reglas) {
    const usa =
      accionesDeRegla(regla).some(
        (a) => a.tipo === 'cambiar_estado' && a.bloqueId === bloqueId && a.estado === estado,
      ) || regla.condiciones.some((c) => condicionUsaEstado(c, bloqueId, estado));
    if (!usa) continue;
    usos.push({
      reglaId: regla.id,
      slideId: origen.slideId,
      ...(origen.tipo === 'bloque' ? { bloqueId: origen.bloqueId } : {}),
    });
  }
  return usos;
}
