// ─── Copiar formato: el pincel (Y12b) ─────────────────────────────────────────
// Lógica pura: toma el aspecto de un elemento y lo aplica a otros. Nunca toca geometría, texto, tamaño ni conexiones.

import { normalizarEscena } from '../normalizar.js';
import type { Elemento, Escena, Estilo, EstiloTexto, Extremo, Linea } from '../tipos.js';
import { bloqueadosEfectivos, conCambios, expandir, hojasEditables } from './utilidades.js';

/** El aspecto copiado y de qué clase de elemento viene (eso decide qué se puede aplicar a cada destino). */
export type FormatoCopiado =
  | { origen: 'forma' | 'texto'; estilo: Estilo; estiloTexto: EstiloTexto }
  | { origen: 'linea'; estilo: Estilo; estiloTexto: EstiloTexto; inicio: Extremo; fin: Extremo };

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

/**
 * El formato del elemento `id`. Un grupo da el de su primer elemento (en orden de apilado). `null` si no existe o no hay
 * nada con aspecto (un grupo vacío). Se puede copiar el formato de algo bloqueado: solo se lee.
 */
export function extraerFormato(escena: Escena, id: string): FormatoCopiado | null {
  const incluidos = expandir(escena, [id]);
  const hoja = escena.elementos.find((e) => e.tipo !== 'grupo' && incluidos.has(e.id));
  if (!hoja || hoja.tipo === 'grupo') return null;
  if (hoja.tipo === 'linea') {
    return { origen: 'linea', estilo: clonar(hoja.estilo), estiloTexto: clonar(hoja.estiloTexto), inicio: hoja.inicio, fin: hoja.fin };
  }
  return { origen: hoja.tipo, estilo: clonar(hoja.estilo), estiloTexto: clonar(hoja.estiloTexto) };
}

export interface ResultadoFormato {
  /** La misma escena (misma referencia) si no cambió nada. */
  escena: Escena;
  /** Elementos a los que se aplicó el formato (hojas; los grupos se aplican a sus hijos). */
  aplicados: string[];
  /** Elementos que se saltaron por estar bloqueados. */
  omitidos: string[];
}

/** El elemento con el formato puesto, según de dónde viene el formato y a dónde va. */
function conFormato(destino: Exclude<Elemento, { tipo: 'grupo' }>, formato: FormatoCopiado): Elemento {
  const origenEsLinea = formato.origen === 'linea';
  if (destino.tipo === 'linea') {
    // A una línea: contorno (color, grosor y discontinuo) y opacidad; de otra línea, también las puntas.
    const linea: Linea = {
      ...destino,
      estilo: { ...destino.estilo, contorno: clonar(formato.estilo.contorno), opacidad: formato.estilo.opacidad },
      ...(formato.origen === 'linea' ? { inicio: formato.inicio, fin: formato.fin } : {}),
    };
    return linea;
  }
  if (origenEsLinea) {
    // De una línea a una forma o un texto: solo el contorno.
    return { ...destino, estilo: { ...destino.estilo, contorno: clonar(formato.estilo.contorno) } };
  }
  // De una forma o un texto a otra forma o texto: todo el aspecto, también el del texto.
  return { ...destino, estilo: clonar(formato.estilo), estiloTexto: clonar(formato.estiloTexto) };
}

/**
 * Aplica el formato a los elementos (y a los hijos de los grupos). Los bloqueados se saltan y se devuelven en
 * `omitidos`. Si nada cambia, devuelve la misma escena.
 */
export function aplicarFormato(escena: Escena, ids: Iterable<string>, formato: FormatoCopiado): ResultadoFormato {
  const pedidos = expandir(escena, ids);
  const bloqueados = bloqueadosEfectivos(escena);
  const omitidos = escena.elementos.filter((e) => e.tipo !== 'grupo' && pedidos.has(e.id) && bloqueados.has(e.id)).map((e) => e.id);
  const hojas = hojasEditables(escena, ids);
  const cambios = new Map<string, Elemento>();
  for (const h of hojas) {
    const nuevo = conFormato(h, formato);
    if (JSON.stringify(nuevo) !== JSON.stringify(h)) cambios.set(h.id, nuevo);
  }
  const aplicados = hojas.map((h) => h.id);
  if (cambios.size === 0) return { escena, aplicados, omitidos };
  return { escena: normalizarEscena(conCambios(escena, cambios)), aplicados, omitidos };
}
