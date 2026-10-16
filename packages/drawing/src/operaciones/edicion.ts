// ─── Agregar, quitar y cambiar elementos (W4) ─────────────────────────────────

import { normalizarEscena } from '../normalizar.js';
import type { Contorno, Elemento, Escena, EstiloTexto, Relleno, Sombra, TipoElemento } from '../tipos.js';
import {
  bloqueadosEfectivos,
  conCambios,
  expandir,
  hojasEditables,
  idNuevo,
  idParaTipo,
  mapaPorId,
  sinDescendientes,
} from './utilidades.js';
import { esConCaja } from './utilidades.js';

/** Un elemento a medio armar: lo que falte lo completa el normalizador con los valores por defecto. */
export type EntradaElemento = { tipo: TipoElemento } & Record<string, unknown>;

export interface OpcionesAgregar {
  /** Posición en el apilado (por defecto al frente). */
  indice?: number;
}

const PREFIJOS: Record<TipoElemento, string> = { forma: 'forma', linea: 'linea', texto: 'texto', grupo: 'grupo' };

/** Agrega un elemento; si su id falta o ya existe se le asigna uno nuevo. Devuelve la escena y el id final. */
export function agregar(escena: Escena, entrada: EntradaElemento, opciones: OpcionesAgregar = {}): { escena: Escena; id: string } {
  const usados = new Set(escena.elementos.map((e) => e.id));
  const pedido = typeof entrada.id === 'string' ? entrada.id : '';
  const id = pedido && !usados.has(pedido) ? pedido : idParaTipo(PREFIJOS[entrada.tipo] ?? 'el', usados);
  const nuevo = { ...entrada, id };
  const indice = opciones.indice === undefined ? escena.elementos.length : Math.max(0, Math.min(escena.elementos.length, Math.floor(opciones.indice)));
  const crudos: unknown[] = [...escena.elementos];
  crudos.splice(indice, 0, nuevo);
  const resultado = normalizarEscena({ ...escena, elementos: crudos });
  // Si el normalizador descartó el elemento (no se pudo interpretar) la escena queda como estaba.
  if (!resultado.elementos.some((e) => e.id === id)) return { escena, id: '' };
  return { escena: resultado, id };
}

/**
 * Quita los elementos y los hijos de los grupos. Los bloqueados se conservan; si un grupo conserva
 * algún hijo, también se conserva. Las líneas conectadas a algo que se borra pierden esa conexión.
 */
export function eliminar(escena: Escena, ids: Iterable<string>): Escena {
  const pedidos = expandir(escena, ids);
  if (pedidos.size === 0) return escena;
  const bloqueados = bloqueadosEfectivos(escena);
  const porId = mapaPorId(escena);
  const borrar = new Set([...pedidos].filter((id) => !bloqueados.has(id)));
  // Un grupo con algún descendiente que se queda, se queda.
  const conservaHijos = (id: string): boolean => {
    const e = porId.get(id);
    if (e?.tipo !== 'grupo') return false;
    return e.hijos.some((h) => !borrar.has(h) || conservaHijos(h));
  };
  for (const id of [...borrar]) if (conservaHijos(id)) borrar.delete(id);
  if (borrar.size === 0) return escena;
  return normalizarEscena({ ...escena, elementos: escena.elementos.filter((e) => !borrar.has(e.id)) });
}

const CLAVES_PROTEGIDAS = new Set(['tipo', 'id', 'hijos']);

/**
 * Cambia propiedades de los elementos pedidos (p. ej. `{ forma: 'rombo' }`, `{ texto: 'Hola' }`,
 * `{ trazado: 'curvo', fin: 'flecha' }`). El resultado pasa por el normalizador, así que un valor
 * inválido nunca llega a la escena. Los bloqueados no se tocan, salvo para desbloquearlos.
 */
export function actualizar(escena: Escena, ids: Iterable<string>, parche: Record<string, unknown>): Escena {
  const claves = Object.keys(parche).filter((k) => !CLAVES_PROTEGIDAS.has(k));
  if (claves.length === 0) return escena;
  const soloIndicadores = claves.every((k) => k === 'bloqueado' || k === 'oculto' || k === 'nombre' || k === 'descripcion');
  const bloqueados = bloqueadosEfectivos(escena);
  const objetivo = new Set(ids);
  const cambios = new Map<string, Elemento>();
  for (const e of escena.elementos) {
    if (!objetivo.has(e.id)) continue;
    if (!soloIndicadores && bloqueados.has(e.id)) continue;
    if (!soloIndicadores && e.tipo === 'grupo') continue; // las propiedades visuales se aplican a los hijos con `cambiarEstilo`
    const nuevo: Record<string, unknown> = { ...e };
    for (const k of claves) {
      // `forma` solo existe en formas, `trazado` solo en líneas…: lo que no corresponde se ignora.
      if (k in e || k === 'texto' || k === 'estiloTexto' || k === 'parametros' || k === 'nombre' || k === 'descripcion') nuevo[k] = parche[k];
    }
    cambios.set(e.id, nuevo as unknown as Elemento);
  }
  if (cambios.size === 0) return escena;
  return normalizarEscena(conCambios(escena, cambios));
}

export const bloquear = (escena: Escena, ids: Iterable<string>, valor = true): Escena => actualizar(escena, ids, { bloqueado: valor });
export const ocultar = (escena: Escena, ids: Iterable<string>, valor = true): Escena => actualizar(escena, ids, { oculto: valor });

export interface ParcheEstilo {
  relleno?: Relleno;
  contorno?: Partial<Contorno>;
  opacidad?: number;
  sombra?: Sombra | null;
  radio?: number;
}

export interface ParcheVisual {
  estilo?: ParcheEstilo;
  estiloTexto?: Partial<EstiloTexto>;
}

/**
 * Cambia el aspecto de los elementos (y de los hijos de los grupos). El relleno y la sombra se
 * reemplazan enteros; el contorno y el estilo de texto se mezclan campo a campo.
 */
export function cambiarEstilo(escena: Escena, ids: Iterable<string>, parche: ParcheVisual): Escena {
  const hojas = hojasEditables(escena, ids);
  if (hojas.length === 0 || (!parche.estilo && !parche.estiloTexto)) return escena;
  const cambios = new Map<string, Elemento>();
  for (const h of hojas) {
    const estilo = parche.estilo
      ? {
          ...h.estilo,
          ...(parche.estilo.relleno !== undefined ? { relleno: parche.estilo.relleno } : {}),
          ...(parche.estilo.contorno ? { contorno: { ...h.estilo.contorno, ...parche.estilo.contorno } } : {}),
          ...(parche.estilo.opacidad !== undefined ? { opacidad: parche.estilo.opacidad } : {}),
          ...(parche.estilo.sombra !== undefined ? { sombra: parche.estilo.sombra } : {}),
          ...(parche.estilo.radio !== undefined ? { radio: parche.estilo.radio } : {}),
        }
      : h.estilo;
    const estiloTexto = parche.estiloTexto ? { ...h.estiloTexto, ...parche.estiloTexto } : h.estiloTexto;
    cambios.set(h.id, { ...h, estilo, estiloTexto } as Elemento);
  }
  return normalizarEscena(conCambios(escena, cambios));
}

export interface OpcionesDuplicar {
  /** Desplazamiento de las copias respecto de los originales (por defecto 20, 20). */
  desplazamiento?: { x: number; y: number };
}

/**
 * Copia los elementos (con sus hijos si son grupos). Las copias quedan al frente, desplazadas.
 * Una línea copiada conserva la conexión solo si la forma a la que estaba unida también se copió.
 * Devuelve los ids de las copias de primer nivel.
 */
export function duplicar(escena: Escena, ids: Iterable<string>, opciones: OpcionesDuplicar = {}): { escena: Escena; ids: string[] } {
  const raices = sinDescendientes(escena, ids);
  const originales = expandir(escena, raices);
  if (originales.size === 0) return { escena, ids: [] };
  const dx = opciones.desplazamiento?.x ?? 20;
  const dy = opciones.desplazamiento?.y ?? 20;
  const usados = new Set(escena.elementos.map((e) => e.id));
  const nuevosIds = new Map<string, string>();
  const elegir = (viejo: string): string => {
    const nuevo = idNuevo(viejo, usados);
    usados.add(nuevo);
    nuevosIds.set(viejo, nuevo);
    return nuevo;
  };
  const copias: Elemento[] = [];
  for (const e of escena.elementos) if (originales.has(e.id)) elegir(e.id);
  for (const e of escena.elementos) {
    if (!originales.has(e.id)) continue;
    const id = nuevosIds.get(e.id) ?? e.id;
    if (e.tipo === 'grupo') {
      copias.push({ ...e, id, hijos: e.hijos.map((h) => nuevosIds.get(h) ?? h) });
    } else if (esConCaja(e)) {
      copias.push({ ...e, id, transformacion: { ...e.transformacion, x: e.transformacion.x + dx, y: e.transformacion.y + dy } } as Elemento);
    } else {
      const { origen, destino, ...resto } = e;
      const o = origen ? nuevosIds.get(origen.elementoId) : undefined;
      const d = destino ? nuevosIds.get(destino.elementoId) : undefined;
      copias.push({
        ...resto,
        id,
        puntos: e.puntos.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        ...(origen && o ? { origen: { ...origen, elementoId: o } } : {}),
        ...(destino && d ? { destino: { ...destino, elementoId: d } } : {}),
      });
    }
  }
  return {
    escena: { ...escena, elementos: [...escena.elementos, ...copias] },
    ids: raices.map((r) => nuevosIds.get(r) ?? r),
  };
}
