// ─── Cambiar de forma sin perder nada (Y19) ───────────────────────────────────
// Cambia el tipo de las formas elegidas conservando todo lo demás, y deja los conectores pegados por el mismo lado.

import { FORMAS } from '../formas/index.js';
import { cantidadDePuertos, ladoDePuerto, puntoDePuerto } from '../conectores/puertos.js';
import { sincronizarConectores } from '../conectores/conectar.js';
import { normalizarEscena } from '../normalizar.js';
import type { Conexion, Elemento, Escena, Forma, Linea, TipoForma } from '../tipos.js';
import { conCambios, hojasEditables } from './utilidades.js';

/**
 * Los `parametros` que la forma nueva también declara **con el mismo rango**; el resto se descarta (no quedan huérfanos en
 * el modelo). `undefined` si no queda ninguno.
 */
function parametrosConservados(vieja: Forma, nueva: TipoForma): Record<string, number> | undefined {
  if (!vieja.parametros) return undefined;
  const declarados = FORMAS[nueva].parametros;
  const salida: Record<string, number> = {};
  for (const def of FORMAS[vieja.forma].parametros) {
    const valor = vieja.parametros[def.clave];
    const igual = declarados.find((d) => d.clave === def.clave && d.min === def.min && d.max === def.max);
    if (igual && valor !== undefined) salida[def.clave] = valor;
  }
  return Object.keys(salida).length > 0 ? salida : undefined;
}

/**
 * El puerto de la forma nueva que equivale a `puerto` de la vieja: el del **mismo lado** (con el giro) y, si hay varios, el
 * más cercano al punto viejo (empate: el de menor índice); si la forma nueva no tiene ninguno de ese lado, el más cercano de todos.
 */
export function puertoEquivalente(vieja: Forma, nueva: Forma, puerto: number): number {
  const lado = ladoDePuerto(vieja, puerto);
  const origen = puntoDePuerto(vieja, puerto);
  const indices = Array.from({ length: cantidadDePuertos(nueva) }, (_, i) => i);
  const delMismoLado = indices.filter((i) => ladoDePuerto(nueva, i) === lado);
  const candidatos = delMismoLado.length > 0 ? delMismoLado : indices;
  let mejor = candidatos[0] ?? 0;
  let distancia = Infinity;
  for (const i of candidatos) {
    const p = puntoDePuerto(nueva, i);
    const d = Math.hypot(p.x - origen.x, p.y - origen.y);
    if (d < distancia) {
      distancia = d;
      mejor = i;
    }
  }
  return mejor;
}

/**
 * Cambia a `tipo` la forma de las formas editables de `ids` (los grupos aportan sus hojas; los textos, los conectores y lo
 * bloqueado se ignoran). Conserva posición, caja, giro, texto, estilo, nombre y lugar en el apilado; los conectores pegados a
 * esas formas siguen en el mismo lado. Devuelve la misma escena si no cambia nada.
 */
export function cambiarForma(escena: Escena, ids: Iterable<string>, tipo: TipoForma): Escena {
  if (!(tipo in FORMAS)) return escena;
  const viejas = new Map<string, Forma>();
  for (const e of hojasEditables(escena, ids)) if (e.tipo === 'forma' && e.forma !== tipo) viejas.set(e.id, e);
  if (viejas.size === 0) return escena;

  const cambios = new Map<string, Elemento>();
  const nuevas = new Map<string, Forma>();
  for (const [id, vieja] of viejas) {
    const nueva: Forma = { ...vieja, forma: tipo };
    const parametros = parametrosConservados(vieja, tipo);
    if (parametros) nueva.parametros = parametros;
    else delete nueva.parametros;
    nuevas.set(id, nueva);
    cambios.set(id, nueva);
  }

  const reasignar = (c: Conexion | undefined): Conexion | undefined => {
    const vieja = c ? viejas.get(c.elementoId) : undefined;
    const nueva = c ? nuevas.get(c.elementoId) : undefined;
    return c && vieja && nueva ? { ...c, puerto: puertoEquivalente(vieja, nueva, c.puerto) } : c;
  };
  for (const e of escena.elementos) {
    if (e.tipo !== 'linea' || (!e.origen && !e.destino)) continue;
    const origen = reasignar(e.origen);
    const destino = reasignar(e.destino);
    if (origen === e.origen && destino === e.destino) continue;
    const linea: Linea = { ...e };
    if (origen) linea.origen = origen;
    if (destino) linea.destino = destino;
    cambios.set(e.id, linea);
  }
  return normalizarEscena(sincronizarConectores(conCambios(escena, cambios)));
}
