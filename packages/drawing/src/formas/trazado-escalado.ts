// ─── Escalado de un path SVG (Y32a, DY91) ─────────────────────────────────────
// Puro: sin DOM ni `eval`. Los iconos del catálogo se guardan como un `d` en una cuadrícula de 24 × 24; para dibujarlos en una caja
// de (ancho × alto) se multiplica cada coordenada por el factor de su eje y se escriben todos los comandos en **absoluto**. Así el
// grosor del contorno no se deforma (el trazo se aplica después de escalar) y el resultado no depende del punto de partida.

const NUMERO = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y;

const fmt = (v: number): string => String(Math.round(v * 100) / 100);
const par = (x: number, y: number): string => `${fmt(x)},${fmt(y)}`;

/** Cuántos números lleva cada comando por repetición (el arco se lee aparte: sus dos banderas son de un solo carácter). */
const ARGUMENTOS: Readonly<Record<string, number>> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

class Lector {
  private pos = 0;
  constructor(private readonly texto: string) {}

  private saltar(): void {
    while (this.pos < this.texto.length && /[\s,]/.test(this.texto[this.pos] as string)) this.pos++;
  }

  fin(): boolean {
    this.saltar();
    return this.pos >= this.texto.length;
  }

  letra(): string | null {
    this.saltar();
    const c = this.texto[this.pos];
    return c !== undefined && /[A-Za-z]/.test(c) ? c : null;
  }

  tomarLetra(): string {
    return this.texto[this.pos++] as string;
  }

  hayNumero(): boolean {
    this.saltar();
    NUMERO.lastIndex = this.pos;
    return NUMERO.test(this.texto);
  }

  numero(): number {
    this.saltar();
    NUMERO.lastIndex = this.pos;
    const m = NUMERO.exec(this.texto);
    if (!m) throw new Error('número esperado');
    this.pos = NUMERO.lastIndex;
    return Number(m[0]);
  }

  /** Una bandera de arco: un solo `0` o `1`, que puede venir pegada a lo que sigue (`a2 2 0 0022 17`). */
  bandera(): 0 | 1 {
    this.saltar();
    const c = this.texto[this.pos];
    if (c !== '0' && c !== '1') throw new Error('bandera esperada');
    this.pos++;
    return c === '1' ? 1 : 0;
  }
}

/**
 * Convierte un `d` con los comandos `M m L l H h V v C c S s Q q T t A a Z z` (absolutos y relativos, con varias repeticiones por comando,
 * con números pegados y con las banderas de los arcos pegadas) a **absolutos escalados** por `sx` y `sy`, redondeados a 2 decimales
 * como el resto del catálogo. `rx` y `ry` de los arcos se escalan con su eje; la rotación del eje se conserva (los iconos del catálogo
 * no la usan). Una entrada vacía, con un comando desconocido o con argumentos que faltan devuelve `''`: nunca lanza ni deja un `NaN`.
 */
export function escalarTrazado(d: string, sx: number, sy: number): string {
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return '';
  try {
    return convertir(d, sx, sy);
  } catch {
    return '';
  }
}

function convertir(d: string, sx: number, sy: number): string {
  const lector = new Lector(d);
  const salida: string[] = [];
  // Estado en coordenadas ORIGINALES (sin escalar); la salida escala al escribir.
  let x = 0;
  let y = 0;
  let inicioX = 0;
  let inicioY = 0;
  let ultimoControl: { x: number; y: number } | null = null;
  let ultimoComando = '';
  const px = (v: number): number => v * sx;
  const py = (v: number): number => v * sy;

  while (!lector.fin()) {
    const letra = lector.letra();
    if (letra === null) throw new Error('comando esperado');
    lector.tomarLetra();
    const minuscula = letra.toLowerCase();
    const relativo = letra === minuscula;
    const n = ARGUMENTOS[minuscula];
    if (n === undefined) throw new Error('comando desconocido');
    if (n === 0) {
      salida.push('Z');
      x = inicioX;
      y = inicioY;
      ultimoControl = null;
      ultimoComando = 'z';
      continue;
    }
    if (minuscula !== 'a' && !lector.hayNumero()) throw new Error('faltan argumentos');
    let primera = true;
    // Un comando puede repetirse mientras sigan llegando números (tras un `M`, las repeticiones son `L`).
    while (primera || lector.hayNumero()) {
      const comando = minuscula === 'm' && !primera ? 'l' : minuscula;
      const dx = relativo ? x : 0;
      const dy = relativo ? y : 0;
      switch (comando) {
        case 'm': {
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          inicioX = x;
          inicioY = y;
          salida.push(`M${par(px(x), py(y))}`);
          ultimoControl = null;
          break;
        }
        case 'l': {
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`L${par(px(x), py(y))}`);
          ultimoControl = null;
          break;
        }
        case 'h': {
          x = lector.numero() + dx;
          salida.push(`L${par(px(x), py(y))}`);
          ultimoControl = null;
          break;
        }
        case 'v': {
          y = lector.numero() + dy;
          salida.push(`L${par(px(x), py(y))}`);
          ultimoControl = null;
          break;
        }
        case 'c': {
          const x1 = lector.numero() + dx;
          const y1 = lector.numero() + dy;
          const x2 = lector.numero() + dx;
          const y2 = lector.numero() + dy;
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`C${par(px(x1), py(y1))} ${par(px(x2), py(y2))} ${par(px(x), py(y))}`);
          ultimoControl = { x: x2, y: y2 };
          break;
        }
        case 's': {
          // El primer punto de control es el reflejo del segundo del `C`/`S` anterior (o el punto actual).
          const previoEsCubica = ultimoComando === 'c' || ultimoComando === 's';
          const x1: number = previoEsCubica && ultimoControl ? 2 * x - ultimoControl.x : x;
          const y1: number = previoEsCubica && ultimoControl ? 2 * y - ultimoControl.y : y;
          const x2 = lector.numero() + dx;
          const y2 = lector.numero() + dy;
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`C${par(px(x1), py(y1))} ${par(px(x2), py(y2))} ${par(px(x), py(y))}`);
          ultimoControl = { x: x2, y: y2 };
          break;
        }
        case 'q': {
          const x1 = lector.numero() + dx;
          const y1 = lector.numero() + dy;
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`Q${par(px(x1), py(y1))} ${par(px(x), py(y))}`);
          ultimoControl = { x: x1, y: y1 };
          break;
        }
        case 't': {
          const previoEsCuadratica = ultimoComando === 'q' || ultimoComando === 't';
          const x1: number = previoEsCuadratica && ultimoControl ? 2 * x - ultimoControl.x : x;
          const y1: number = previoEsCuadratica && ultimoControl ? 2 * y - ultimoControl.y : y;
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`Q${par(px(x1), py(y1))} ${par(px(x), py(y))}`);
          ultimoControl = { x: x1, y: y1 };
          break;
        }
        case 'a': {
          const rx = lector.numero();
          const ry = lector.numero();
          const rotacion = lector.numero();
          const grande = lector.bandera();
          const barrido = lector.bandera();
          x = lector.numero() + dx;
          y = lector.numero() + dy;
          salida.push(`A${par(Math.abs(rx) * sx, Math.abs(ry) * sy)} ${fmt(rotacion)} ${grande} ${barrido} ${par(px(x), py(y))}`);
          ultimoControl = null;
          break;
        }
      }
      ultimoComando = comando;
      primera = false;
    }
  }
  if (salida.length === 0) return '';
  return salida.join(' ');
}
