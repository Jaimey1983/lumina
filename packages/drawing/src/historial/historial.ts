// ─── Historial por diferencia (W4, DW7) ───────────────────────────────────────
// Cada entrada guarda solo lo que cambió entre dos escenas (no copias completas).
// Un gesto —arrastrar, redimensionar, escribir— es UNA entrada, no una por fotograma.

import type { Color, Elemento, Escena } from '../tipos.js';

interface CambioElemento {
  id: string;
  /** `null` = no existía. */
  antes: Elemento | null;
  /** `null` = ya no existe. */
  despues: Elemento | null;
}

interface CambioEscena {
  ancho?: [antes: number, despues: number];
  alto?: [antes: number, despues: number];
  fondo?: [antes: Color | null, despues: Color | null];
}

/** Diferencia entre dos escenas; se puede aplicar hacia adelante o hacia atrás. */
export interface Parche {
  escena: CambioEscena;
  elementos: CambioElemento[];
  /** Solo si cambió el conjunto o el orden de los elementos. */
  orden?: { antes: string[]; despues: string[] };
}

function igualProfundo(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => igualProfundo(v, b[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => k in b && igualProfundo((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/** Calcula el parche que lleva de `antes` a `despues`; `null` si son iguales. */
export function diferencia(antes: Escena, despues: Escena): Parche | null {
  const escena: CambioEscena = {};
  if (antes.ancho !== despues.ancho) escena.ancho = [antes.ancho, despues.ancho];
  if (antes.alto !== despues.alto) escena.alto = [antes.alto, despues.alto];
  if (antes.fondo !== despues.fondo) escena.fondo = [antes.fondo, despues.fondo];

  const previos = new Map(antes.elementos.map((e) => [e.id, e]));
  const nuevos = new Map(despues.elementos.map((e) => [e.id, e]));
  const elementos: CambioElemento[] = [];
  for (const e of despues.elementos) {
    const p = previos.get(e.id) ?? null;
    if (p === null || !igualProfundo(p, e)) elementos.push({ id: e.id, antes: p, despues: e });
  }
  for (const e of antes.elementos) if (!nuevos.has(e.id)) elementos.push({ id: e.id, antes: e, despues: null });

  const idsAntes = antes.elementos.map((e) => e.id);
  const idsDespues = despues.elementos.map((e) => e.id);
  const ordenCambio = idsAntes.length !== idsDespues.length || idsAntes.some((id, i) => id !== idsDespues[i]);

  if (Object.keys(escena).length === 0 && elementos.length === 0 && !ordenCambio) return null;
  return { escena, elementos, ...(ordenCambio ? { orden: { antes: idsAntes, despues: idsDespues } } : {}) };
}

/** Aplica el parche: `adelante` lleva de antes a después; `atras` lo revierte. */
export function aplicarParche(escena: Escena, parche: Parche, sentido: 'adelante' | 'atras'): Escena {
  const i = sentido === 'adelante' ? 1 : 0;
  const resultado: Escena = { ...escena };
  if (parche.escena.ancho) resultado.ancho = parche.escena.ancho[i];
  if (parche.escena.alto) resultado.alto = parche.escena.alto[i];
  if (parche.escena.fondo) resultado.fondo = parche.escena.fondo[i];

  const destino = new Map<string, Elemento | null>();
  for (const c of parche.elementos) destino.set(c.id, sentido === 'adelante' ? c.despues : c.antes);

  if (!parche.orden) {
    resultado.elementos = escena.elementos.flatMap((e) => {
      if (!destino.has(e.id)) return [e];
      const d = destino.get(e.id);
      return d ? [d] : [];
    });
    return resultado;
  }

  const actuales = new Map(escena.elementos.map((e) => [e.id, e]));
  const ids = sentido === 'adelante' ? parche.orden.despues : parche.orden.antes;
  const elementos: Elemento[] = [];
  for (const id of ids) {
    const e = destino.has(id) ? destino.get(id) : actuales.get(id);
    if (e) elementos.push(e);
  }
  resultado.elementos = elementos;
  return resultado;
}

export interface OpcionesHistorial {
  /** Máximo de entradas que se recuerdan (por defecto 100). */
  tope?: number;
}

export class Historial {
  readonly tope: number;
  private pasado: Parche[] = [];
  private futuro: Parche[] = [];
  private base: Escena | null = null;

  constructor(opciones: OpcionesHistorial = {}) {
    const tope = opciones.tope ?? 100;
    this.tope = Number.isFinite(tope) ? Math.max(1, Math.floor(tope)) : 100;
  }

  get puedeDeshacer(): boolean {
    return this.pasado.length > 0;
  }

  get puedeRehacer(): boolean {
    return this.futuro.length > 0;
  }

  /** Entradas que se pueden deshacer. */
  get tamano(): number {
    return this.pasado.length;
  }

  /** Hay un gesto abierto (`iniciarGesto` sin cerrar). */
  get enGesto(): boolean {
    return this.base !== null;
  }

  /** Registra un cambio ya hecho. Si no hay diferencia no agrega nada. Borra lo que se podía rehacer. */
  registrar(antes: Escena, despues: Escena): boolean {
    const parche = diferencia(antes, despues);
    if (!parche) return false;
    this.pasado.push(parche);
    if (this.pasado.length > this.tope) this.pasado.splice(0, this.pasado.length - this.tope);
    this.futuro = [];
    return true;
  }

  /** Abre un gesto: lo que pase hasta `terminarGesto` es una sola entrada. */
  iniciarGesto(base: Escena): void {
    this.base = base;
  }

  /** Cierra el gesto y registra una única entrada (`false` si no cambió nada o no había gesto). */
  terminarGesto(final: Escena): boolean {
    const base = this.base;
    this.base = null;
    return base ? this.registrar(base, final) : false;
  }

  /** Descarta el gesto abierto sin registrar nada. */
  cancelarGesto(): void {
    this.base = null;
  }

  /** Devuelve la escena anterior, o `null` si no hay nada que deshacer. */
  deshacer(actual: Escena): Escena | null {
    const parche = this.pasado.pop();
    if (!parche) return null;
    this.futuro.push(parche);
    return aplicarParche(actual, parche, 'atras');
  }

  /** Devuelve la escena siguiente, o `null` si no hay nada que rehacer. */
  rehacer(actual: Escena): Escena | null {
    const parche = this.futuro.pop();
    if (!parche) return null;
    this.pasado.push(parche);
    return aplicarParche(actual, parche, 'adelante');
  }

  limpiar(): void {
    this.pasado = [];
    this.futuro = [];
    this.base = null;
  }
}
