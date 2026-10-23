// ─── Asas amarillas de ajuste (Y20) ───────────────────────────────────────────
// Dónde están las asas de una forma, qué valor da un punto arrastrado y cómo se fija un parámetro. El asa del lienzo y el campo del
// panel llaman a la misma `fijarParametro` (DY11).

import { sincronizarConectores } from '../conectores/conectar.js';
import { FORMAS, resolverParametros, type AsaAjuste, type LadoAsaAjuste, type ParametroForma, type ValoresParametros } from '../formas/index.js';
import { normalizarEscena } from '../normalizar.js';
import type { Elemento, Escena, Forma, Punto } from '../tipos.js';
import { conCambios, hojasEditables } from './utilidades.js';

/** Un asa de una forma concreta: su borde, su punto en la escena (con el giro) y el valor que tiene ahora. */
export interface AsaDeAjuste {
  clave: string;
  etiqueta: string;
  lado: LadoAsaAjuste;
  /** Punto del asa en el borde, en coordenadas de la escena y con el giro de la forma. */
  borde: Punto;
  valor: number;
}

/** Los parámetros ya resueltos de la forma y, además, `radio` (el `estilo.radio`, que solo usa el rectángulo). */
export const valoresDeForma = (forma: Forma): ValoresParametros => ({ ...resolverParametros(forma.forma, forma.parametros), radio: forma.estilo.radio });

const centro = (f: Forma): Punto => ({ x: f.transformacion.x + f.transformacion.ancho / 2, y: f.transformacion.y + f.transformacion.alto / 2 });

function girar(p: Punto, c: Punto, grados: number): Punto {
  if (grados === 0) return p;
  const a = (grados * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Las asas de ajuste de una forma (ninguna si su definición no declara). */
export function asasDeAjuste(forma: Forma): AsaDeAjuste[] {
  const asas: readonly AsaAjuste[] = FORMAS[forma.forma].asasAjuste ?? [];
  const t = forma.transformacion;
  const valores = valoresDeForma(forma);
  return asas.map((a) => {
    const local = a.punto(t.ancho, t.alto, valores);
    const borde = girar({ x: t.x + local.x, y: t.y + local.y }, centro(forma), t.rotacion);
    return { clave: a.clave, etiqueta: a.etiqueta, lado: a.lado, borde, valor: valores[a.clave] ?? 0 };
  });
}

export interface RangoDeAjuste {
  min: number;
  max: number;
  paso: number;
  porDefecto: number;
}

/** El rango de un ajuste: el del parámetro o, para `radio`, de 0 a la mitad del lado menor. `null` si la forma no lo tiene. */
export function rangoDeAjuste(forma: Forma, clave: string): RangoDeAjuste | null {
  if (clave === 'radio') return forma.forma === 'rectangulo' ? { min: 0, max: Math.min(forma.transformacion.ancho, forma.transformacion.alto) / 2, paso: 1, porDefecto: 0 } : null;
  const def: ParametroForma | undefined = FORMAS[forma.forma].parametros.find((p) => p.clave === clave);
  return def ? { min: def.min, max: def.max, paso: def.paso, porDefecto: def.porDefecto } : null;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Acota al rango y redondea: enteros si el paso lo es (el radio, las puntas) y dos decimales si no. */
function acotar(rango: RangoDeAjuste, valor: number): number {
  const dentro = Math.min(rango.max, Math.max(rango.min, valor));
  return Number.isInteger(rango.paso) ? Math.round(dentro) : r2(dentro);
}

export interface OpcionesValorDeAsa {
  /** Ajusta al `paso` del catálogo (Mayús al arrastrar) en vez de dejarlo continuo. */
  alPaso?: boolean;
}

/**
 * El valor que corresponde a llevar el asa `clave` de la forma a `punto` (en la escena). Deshace el giro, convierte con la definición
 * del catálogo y acota al rango. `NaN` si la forma no tiene esa asa.
 */
export function valorDeAsa(forma: Forma, clave: string, punto: Punto, opciones: OpcionesValorDeAsa = {}): number {
  const asa = FORMAS[forma.forma].asasAjuste?.find((a) => a.clave === clave);
  const rango = rangoDeAjuste(forma, clave);
  if (!asa || !rango) return Number.NaN;
  const t = forma.transformacion;
  const enLocal = girar(punto, centro(forma), -t.rotacion);
  const crudo = asa.valor(t.ancho, t.alto, { x: enLocal.x - t.x, y: enLocal.y - t.y });
  const alPaso = opciones.alPaso && rango.paso > 0 ? rango.min + Math.round((crudo - rango.min) / rango.paso) * rango.paso : crudo;
  return acotar(rango, alPaso);
}

/**
 * Fija el parámetro `clave` (o el `radio` del rectángulo) de las formas editables de `ids`. Mezcla con los parámetros que ya había,
 * acota al rango, mantiene los conectores pegados y devuelve la misma escena si ningún valor cambia.
 */
export function fijarParametro(escena: Escena, ids: Iterable<string>, clave: string, valor: number): Escena {
  if (!Number.isFinite(valor)) return escena;
  const cambios = new Map<string, Elemento>();
  for (const f of hojasEditables(escena, ids)) {
    if (f.tipo !== 'forma') continue;
    const rango = rangoDeAjuste(f, clave);
    if (!rango) continue;
    const nuevo = acotar(rango, valor);
    if (clave === 'radio') {
      if (nuevo !== f.estilo.radio) cambios.set(f.id, { ...f, estilo: { ...f.estilo, radio: nuevo } });
      continue;
    }
    if (nuevo === resolverParametros(f.forma, f.parametros)[clave]) continue;
    cambios.set(f.id, { ...f, parametros: { ...f.parametros, [clave]: nuevo } });
  }
  if (cambios.size === 0) return escena;
  return normalizarEscena(sincronizarConectores(conCambios(escena, cambios)));
}
