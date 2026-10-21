// ─── Crear forma hija conectada al padre (Y8) ─────────────────────────────────
// Puro e inmutable: duplica el estilo del padre, coloca la hija y agrega el conector.

import { conectarFormas } from '../conectores/enlazar.js';
import { VECTOR_LADO, type Lado } from '../conectores/puertos.js';
import type { Escena, Forma, Punto } from '../tipos.js';
import { agregar, type EntradaElemento } from './edicion.js';
import { cajaDeElemento, type Caja } from './geometria.js';
import { bloqueadosEfectivos, ocultosEfectivos } from './utilidades.js';

/** Separación por defecto entre el borde del padre y el de la hija (unidades de escena). */
export const DISTANCIA_HIJO_POR_DEFECTO = 60;

const MAX_BUSQUEDA_HUECO = 32;

function padreValido(escena: Escena, padreId: string): Forma | null {
  const e = escena.elementos.find((x) => x.id === padreId);
  if (e?.tipo !== 'forma') return null;
  if (bloqueadosEfectivos(escena).has(padreId) || ocultosEfectivos(escena).has(padreId)) return null;
  return e;
}

function cajasInteractuan(a: Caja, b: Caja): boolean {
  return !(a.x + a.ancho <= b.x || b.x + b.ancho <= a.x || a.y + a.alto <= b.y || b.y + b.alto <= a.y);
}

/** Cajas de formas y textos visibles que bloquean la colocación (las líneas no cuentan). */
function obstaculos(escena: Escena, excluir: ReadonlySet<string>): Caja[] {
  const ocultos = ocultosEfectivos(escena);
  const salida: Caja[] = [];
  for (const e of escena.elementos) {
    if (e.tipo !== 'forma' && e.tipo !== 'texto') continue;
    if (excluir.has(e.id) || ocultos.has(e.id)) continue;
    const c = cajaDeElemento(escena, e);
    if (c) salida.push(c);
  }
  return salida;
}

function cajaDeCentro(centro: Punto, ancho: number, alto: number): Caja {
  return { x: centro.x - ancho / 2, y: centro.y - alto / 2, ancho, alto };
}

function centroBase(cajaPadre: Caja, lado: Lado, ancho: number, alto: number, distancia: number): Punto {
  const cx = cajaPadre.x + cajaPadre.ancho / 2;
  const cy = cajaPadre.y + cajaPadre.alto / 2;
  switch (lado) {
    case 'arriba':
      return { x: cx, y: cajaPadre.y - distancia - alto / 2 };
    case 'abajo':
      return { x: cx, y: cajaPadre.y + cajaPadre.alto + distancia + alto / 2 };
    case 'izquierda':
      return { x: cajaPadre.x - distancia - ancho / 2, y: cy };
    case 'derecha':
      return { x: cajaPadre.x + cajaPadre.ancho + distancia + ancho / 2, y: cy };
    default:
      return { x: cx, y: cy };
  }
}

function buscarCentroLibre(
  escena: Escena,
  padreId: string,
  cajaPadre: Caja,
  lado: Lado,
  ancho: number,
  alto: number,
  distancia: number,
): Punto {
  const obst = obstaculos(escena, new Set([padreId]));
  const libre = (c: Punto): boolean => !obst.some((o) => cajasInteractuan(cajaDeCentro(c, ancho, alto), o));
  const base = centroBase(cajaPadre, lado, ancho, alto, distancia);
  if (libre(base)) return base;
  const paso = (lado === 'arriba' || lado === 'abajo' ? ancho : alto) + distancia / 2;
  for (let i = 1; i <= MAX_BUSQUEDA_HUECO; i++) {
    const signo = i % 2 === 1 ? 1 : -1;
    const mult = Math.ceil(i / 2);
    const offset = signo * mult * paso;
    const candidato =
      lado === 'arriba' || lado === 'abajo' ? { x: base.x + offset, y: base.y } : { x: base.x, y: base.y + offset };
    if (libre(candidato)) return candidato;
  }
  const v = VECTOR_LADO[lado];
  const extra = distancia * 2;
  return { x: base.x + v.x * extra, y: base.y + v.y * extra };
}

function entradaDeHija(padre: Forma, centro: Punto): EntradaElemento {
  const t = padre.transformacion;
  return {
    tipo: 'forma',
    forma: padre.forma,
    transformacion: { x: centro.x - t.ancho / 2, y: centro.y - t.alto / 2, ancho: t.ancho, alto: t.alto, rotacion: 0 },
    estilo: { ...padre.estilo, contorno: { ...padre.estilo.contorno } },
    estiloTexto: { ...padre.estiloTexto },
    ...(padre.parametros ? { parametros: { ...padre.parametros } } : {}),
    texto: '',
  };
}

export interface ResultadoCrearHijo {
  escena: Escena;
  id: string;
}

/**
 * Crea una forma hija del padre en `lado` (lados de pantalla según la caja envolvente del padre, aunque esté girado),
 * conectada con un conector ortogonal. Devuelve `id: ""` y la misma referencia de escena si el padre no es válido.
 */
export function crearHijo(escena: Escena, padreId: string, lado: Lado, opciones?: { distancia?: number }): ResultadoCrearHijo {
  const padre = padreValido(escena, padreId);
  if (!padre) return { escena, id: '' };
  const cajaPadre = cajaDeElemento(escena, padre);
  if (!cajaPadre) return { escena, id: '' };
  const dist = opciones?.distancia ?? DISTANCIA_HIJO_POR_DEFECTO;
  const { ancho, alto } = padre.transformacion;
  const centro = buscarCentroLibre(escena, padreId, cajaPadre, lado, ancho, alto, dist);
  return crearHijoEn(escena, padreId, centro);
}

/** Separación mínima entre el borde del padre y el de la hija cuando se coloca a mano (unidades de escena). */
export const DISTANCIA_HIJO_MINIMA = 24;

/**
 * Aleja `centro` del padre lo justo para que la hija no lo pise: el lado lo da el eje en que el punto más se aparta
 * del centro del padre (medido en mitades de caja) y, en ese eje, se exige la separación mínima.
 */
function sinPisarAlPadre(cajaPadre: Caja, centro: Punto, ancho: number, alto: number): Punto {
  const cx = cajaPadre.x + cajaPadre.ancho / 2;
  const cy = cajaPadre.y + cajaPadre.alto / 2;
  const dx = centro.x - cx;
  const dy = centro.y - cy;
  const medioX = cajaPadre.ancho / 2 + ancho / 2 + DISTANCIA_HIJO_MINIMA;
  const medioY = cajaPadre.alto / 2 + alto / 2 + DISTANCIA_HIJO_MINIMA;
  // Ya queda fuera en algún eje: no se toca.
  if (Math.abs(dx) >= medioX || Math.abs(dy) >= medioY) return centro;
  if (Math.abs(dx) / medioX >= Math.abs(dy) / medioY) return { x: cx + (dx >= 0 ? medioX : -medioX), y: centro.y };
  return { x: centro.x, y: cy + (dy >= 0 ? medioY : -medioY) };
}

/**
 * Igual que `crearHijo`, pero la hija queda centrada en `centro` (sin buscar hueco). Si ese punto la haría pisar al
 * padre, se desplaza hacia fuera por el lado más cercano hasta `DISTANCIA_HIJO_MINIMA`.
 */
export function crearHijoEn(escena: Escena, padreId: string, centro: Punto): ResultadoCrearHijo {
  const padre = padreValido(escena, padreId);
  if (!padre) return { escena, id: '' };
  const cajaPadre = cajaDeElemento(escena, padre);
  if (!cajaPadre) return { escena, id: '' };
  const colocado = sinPisarAlPadre(cajaPadre, centro, padre.transformacion.ancho, padre.transformacion.alto);
  const agregado = agregar(escena, entradaDeHija(padre, colocado), { indice: escena.elementos.length });
  if (agregado.id === '') return { escena, id: '' };
  const conectada = conectarFormas(agregado.escena, padreId, agregado.id);
  return { escena: conectada, id: agregado.id };
}
