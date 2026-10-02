/**
 * Equivalencia algebraica por evaluación en puntos (Etapa M / M4, DM4).
 *
 * Sin dependencias y sin `eval`: un analizador propio con gramática cerrada
 * (números, variables de una letra, `+ - * / ^`, multiplicación implícita,
 * paréntesis, la constante `pi`/`π` y las funciones `sqrt/raiz/abs/sin/cos/tan/
 * ln/log/exp`). Dos expresiones son equivalentes si coinciden en muchos puntos
 * pseudoaleatorios y deterministas. NO simplifica simbólicamente: `2x+2` y
 * `2(x+1)` son equivalentes (también `(x²−1)/(x−1)` y `x+1`, salvo en x=1).
 */

export const ALGEBRA_MAX_LARGO = 200;
const MAX_NODOS = 250;
const MAX_PROFUNDIDAD = 60;
const MUESTRAS = 48;
const MIN_COMPARABLES = 10;

type Nodo =
  | { k: 'num'; v: number }
  | { k: 'var'; n: string }
  | { k: 'neg'; a: Nodo }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; l: Nodo; r: Nodo }
  | { k: 'fn'; f: FuncionAlgebra; a: Nodo };

type FuncionAlgebra = 'sqrt' | 'abs' | 'sin' | 'cos' | 'tan' | 'ln' | 'log' | 'exp';

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; n: string }
  | { t: 'fn'; f: FuncionAlgebra }
  | { t: 'op'; o: '+' | '-' | '*' | '/' | '^' }
  | { t: '(' }
  | { t: ')' };

const FUNCIONES: ReadonlyArray<[string, FuncionAlgebra]> = [
  ['sqrt', 'sqrt'],
  ['raiz', 'sqrt'],
  ['abs', 'abs'],
  ['sin', 'sin'],
  ['cos', 'cos'],
  ['tan', 'tan'],
  ['ln', 'ln'],
  ['log', 'log'],
  ['exp', 'exp'],
];

class ErrorAlgebra extends Error {}

function normalizar(texto: string): string {
  return texto
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/π/g, 'pi')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, '');
}

function tokenizar(texto: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < texto.length) {
    const c = texto[i]!;
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(texto.slice(i));
      if (!m) throw new ErrorAlgebra(`Número no válido cerca de «${texto.slice(i, i + 4)}».`);
      out.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (/[A-Za-z]/.test(c)) {
      const resto = texto.slice(i).toLowerCase();
      const fn = FUNCIONES.find(([nombre]) => resto.startsWith(nombre));
      if (fn) {
        if (texto[i + fn[0].length] !== '(') {
          throw new ErrorAlgebra(`Falta el paréntesis después de «${fn[0]}»: escribe ${fn[0]}(…).`);
        }
        out.push({ t: 'fn', f: fn[1] });
        i += fn[0].length;
      } else if (resto.startsWith('pi')) {
        out.push({ t: 'num', v: Math.PI });
        i += 2;
      } else {
        out.push({ t: 'id', n: c.toLowerCase() });
        i += 1;
      }
    } else if ('+-*/^'.includes(c)) {
      out.push({ t: 'op', o: c as '+' | '-' | '*' | '/' | '^' });
      i += 1;
    } else if (c === '(' || c === '[') {
      out.push({ t: '(' });
      i += 1;
    } else if (c === ')' || c === ']') {
      out.push({ t: ')' });
      i += 1;
    } else {
      throw new ErrorAlgebra(`Símbolo no permitido: «${c}».`);
    }
  }
  return out;
}

function empiezaFactor(t: Token | undefined): boolean {
  return t !== undefined && (t.t === 'num' || t.t === 'id' || t.t === 'fn' || t.t === '(');
}

function analizar(texto: string): Nodo {
  if (texto.length > ALGEBRA_MAX_LARGO) {
    throw new ErrorAlgebra(`La expresión es demasiado larga (máximo ${ALGEBRA_MAX_LARGO} caracteres).`);
  }
  const tokens = tokenizar(normalizar(texto));
  if (tokens.length === 0) throw new ErrorAlgebra('La expresión está vacía.');
  let pos = 0;
  let nodos = 0;
  const nuevo = <T extends Nodo>(n: T): T => {
    if (++nodos > MAX_NODOS) throw new ErrorAlgebra('La expresión es demasiado compleja.');
    return n;
  };

  const expr = (prof: number): Nodo => {
    if (prof > MAX_PROFUNDIDAD) throw new ErrorAlgebra('Demasiados paréntesis anidados.');
    let izq = termino(prof);
    for (;;) {
      const t = tokens[pos];
      if (t?.t === 'op' && (t.o === '+' || t.o === '-')) {
        pos++;
        izq = nuevo({ k: 'bin', op: t.o, l: izq, r: termino(prof) });
      } else return izq;
    }
  };
  const termino = (prof: number): Nodo => {
    let izq = unario(prof);
    for (;;) {
      const t = tokens[pos];
      if (t?.t === 'op' && (t.o === '*' || t.o === '/')) {
        pos++;
        izq = nuevo({ k: 'bin', op: t.o, l: izq, r: unario(prof) });
      } else if (empiezaFactor(t)) {
        izq = nuevo({ k: 'bin', op: '*', l: izq, r: unario(prof) });
      } else return izq;
    }
  };
  const unario = (prof: number): Nodo => {
    const t = tokens[pos];
    if (t?.t === 'op' && (t.o === '-' || t.o === '+')) {
      pos++;
      const a = unario(prof + 1);
      return t.o === '-' ? nuevo({ k: 'neg', a }) : a;
    }
    return potencia(prof);
  };
  const potencia = (prof: number): Nodo => {
    const base = primario(prof);
    const t = tokens[pos];
    if (t?.t === 'op' && t.o === '^') {
      pos++;
      return nuevo({ k: 'bin', op: '^', l: base, r: unario(prof + 1) });
    }
    return base;
  };
  const primario = (prof: number): Nodo => {
    const t = tokens[pos++];
    if (!t) throw new ErrorAlgebra('La expresión termina de forma inesperada.');
    if (t.t === 'num') return nuevo({ k: 'num', v: t.v });
    if (t.t === 'id') return nuevo({ k: 'var', n: t.n });
    if (t.t === 'fn') {
      pos++; // el '(' ya está garantizado por el tokenizador
      const a = expr(prof + 1);
      if (tokens[pos++]?.t !== ')') throw new ErrorAlgebra('Falta cerrar un paréntesis.');
      return nuevo({ k: 'fn', f: t.f, a });
    }
    if (t.t === '(') {
      const a = expr(prof + 1);
      if (tokens[pos++]?.t !== ')') throw new ErrorAlgebra('Falta cerrar un paréntesis.');
      return a;
    }
    throw new ErrorAlgebra('Falta un número o una variable.');
  };

  const raiz = expr(0);
  if (pos < tokens.length) {
    throw new ErrorAlgebra(tokens[pos]!.t === ')' ? 'Sobra un paréntesis.' : 'Expresión no válida.');
  }
  return raiz;
}

function variablesDe(n: Nodo, acc: Set<string>): void {
  if (n.k === 'var') acc.add(n.n);
  else if (n.k === 'neg' || n.k === 'fn') variablesDe(n.a, acc);
  else if (n.k === 'bin') {
    variablesDe(n.l, acc);
    variablesDe(n.r, acc);
  }
}

function evaluar(n: Nodo, env: Readonly<Record<string, number>>): number {
  switch (n.k) {
    case 'num':
      return n.v;
    case 'var':
      return env[n.n] ?? Number.NaN;
    case 'neg':
      return -evaluar(n.a, env);
    case 'bin': {
      const a = evaluar(n.l, env);
      const b = evaluar(n.r, env);
      switch (n.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        case '^':
          return Math.pow(a, b);
      }
      return Number.NaN;
    }
    case 'fn': {
      const a = evaluar(n.a, env);
      switch (n.f) {
        case 'sqrt':
          return Math.sqrt(a);
        case 'abs':
          return Math.abs(a);
        case 'sin':
          return Math.sin(a);
        case 'cos':
          return Math.cos(a);
        case 'tan':
          return Math.tan(a);
        case 'ln':
          return Math.log(a);
        case 'log':
          return Math.log10(a);
        case 'exp':
          return Math.exp(a);
      }
      return Number.NaN;
    }
  }
}

/** PRNG determinista: mismas muestras en cliente y backend. */
function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quita un `x =` inicial (una sola igualdad) para aceptar «x = 3» como «3». */
function sinAsignacion(texto: string): string {
  const m = /^\s*[A-Za-z]\s*=([^=]*)$/.exec(texto);
  return m ? m[1]! : texto;
}

/**
 * Mensaje en español si la expresión no se puede leer; `null` si es válida.
 * Lo usan el editor (respuesta modelo) y el visor.
 */
export function validarExpresionAlgebraica(texto: unknown): string | null {
  if (typeof texto !== 'string') return 'La expresión no es texto.';
  try {
    analizar(sinAsignacion(texto));
    return null;
  } catch (e) {
    if (e instanceof ErrorAlgebra) return e.message;
    return 'Expresión no válida.';
  }
}

/**
 * `true`/`false` si ambas expresiones son (o no) equivalentes; `null` si alguna
 * no se puede leer o no hay puntos suficientes donde ambas estén definidas.
 */
export function expresionesEquivalentes(a: unknown, b: unknown): boolean | null {
  if (typeof a !== 'string' || typeof b !== 'string') return null;
  let ea: Nodo;
  let eb: Nodo;
  try {
    ea = analizar(sinAsignacion(a));
    eb = analizar(sinAsignacion(b));
  } catch {
    return null;
  }
  const vars = new Set<string>();
  variablesDe(ea, vars);
  variablesDe(eb, vars);
  const nombres = [...vars].sort();
  const rnd = mulberry32(20261002);
  const necesarios = nombres.length === 0 ? 1 : MIN_COMPARABLES;
  let comparables = 0;

  for (let i = 0; i < (nombres.length === 0 ? 1 : MUESTRAS); i++) {
    const env: Record<string, number> = {};
    for (const v of nombres) {
      // La mitad de las muestras solo con valores positivos: dominio de sqrt/ln.
      const x = i % 2 === 0 ? rnd() * 10 - 5 : rnd() * 6 + 0.1;
      env[v] = Math.round(x * 1000) / 1000 + 0.0007;
    }
    const va = evaluar(ea, env);
    const vb = evaluar(eb, env);
    const fa = Number.isFinite(va);
    const fb = Number.isFinite(vb);
    if (!fa && !fb) continue;
    if (fa !== fb) return false; // dominios distintos
    if (Math.abs(va - vb) > 1e-7 * Math.max(1, Math.abs(va), Math.abs(vb))) return false;
    comparables++;
  }
  return comparables >= necesarios ? true : null;
}
