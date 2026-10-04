import 'katex/dist/katex.min.css';
import katex from 'katex';
/** Extensión química (Etapa Q, DQ1): registra \\ce{} y \\pu{} en KaTeX una sola vez. */
import 'katex/contrib/mhchem';

/**
 * Único punto de contacto con KaTeX (Etapa M, DM1). Ningún otro archivo del
 * monorepo importa `katex` directo: así los límites, los macros y la lectura
 * accesible son los mismos en el bloque, el texto enriquecido y el compositor.
 */

/** Tope de tamaños absolutos (em) y de expansión de macros: frena LaTeX hostil o generado por IA. */
export const LATEX_MAX_SIZE = 100;
export const LATEX_MAX_EXPAND = 200;

/** Macros compartidos (conjuntos numéricos). Se copian en cada llamada: KaTeX los muta. */
const SHARED_MACROS: Readonly<Record<string, string>> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
};

export interface RenderLatexOptions {
  /** `true` lanza ante LaTeX inválido (compositor); `false` pinta el error en rojo. */
  throwOnError?: boolean;
  /** Por defecto `true` (fórmula en bloque). */
  display?: boolean;
}

export function renderLatex(latex: string, opts: RenderLatexOptions = {}): string {
  return katex.renderToString(latex, {
    throwOnError: opts.throwOnError ?? false,
    displayMode: opts.display ?? true,
    output: 'htmlAndMathml',
    strict: 'ignore',
    trust: false,
    maxSize: LATEX_MAX_SIZE,
    maxExpand: LATEX_MAX_EXPAND,
    macros: { ...SHARED_MACROS },
  });
}

const SYMBOLS: ReadonlyArray<[RegExp, string]> = [
  [/\\times\b/g, ' por '],
  [/\\cdot\b/g, ' por '],
  [/\\div\b/g, ' entre '],
  [/\\pm\b/g, ' más menos '],
  [/\\leq?\b/g, ' menor o igual que '],
  [/\\geq?\b/g, ' mayor o igual que '],
  [/\\neq\b/g, ' distinto de '],
  [/\\approx\b/g, ' aproximadamente '],
  [/\\to\b/g, ' tiende a '],
  [/\\infty\b/g, ' infinito '],
  [/\\pi\b/g, ' pi '],
  [/\\sum\b/g, ' sumatoria '],
  [/\\prod\b/g, ' productoria '],
  [/\\int\b/g, ' integral '],
  [/\\lim\b/g, ' límite '],
  [/\\ln\b/g, ' logaritmo natural '],
  [/\\log\b/g, ' logaritmo '],
  [/\\(?:sin)\b/g, ' seno '],
  [/\\(?:cos)\b/g, ' coseno '],
  [/\\(?:tan)\b/g, ' tangente '],
  [/\\in\b/g, ' pertenece a '],
  [/\\cup\b/g, ' unión '],
  [/\\cap\b/g, ' intersección '],
  [/\\Rightarrow\b/g, ' implica '],
  [/\\Leftrightarrow\b/g, ' si y solo si '],
  [/\\%/g, ' por ciento '],
  [/\\mathbb\{R\}/g, ' reales '],
  [/\\mathbb\{N\}/g, ' naturales '],
  [/\\mathbb\{Z\}/g, ' enteros '],
  [/\\mathbb\{Q\}/g, ' racionales '],
];

/** Reescrituras de estructura sobre grupos sin llaves anidadas; se repiten hasta estabilizar. */
const STRUCTURE: ReadonlyArray<[RegExp, string | ((...m: string[]) => string)]> = [
  [/\^\s*\{\\circ\}/g, ' grados '],
  [/\^\s*\{\s*2\s*\}|\^\s*2(?![0-9])/g, ' al cuadrado '],
  [/\^\s*\{\s*3\s*\}|\^\s*3(?![0-9])/g, ' al cubo '],
  [/\^\s*\{([^{}]*)\}/g, ' elevado a $1 '],
  [/\^\s*([A-Za-z0-9])/g, ' elevado a $1 '],
  [/_\s*\{([^{}]*)\}/g, ' sub $1 '],
  [/_\s*([A-Za-z0-9])/g, ' sub $1 '],
  [/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, ' raíz de índice $1 de $2 '],
  [/\\sqrt\s*\{([^{}]*)\}/g, ' raíz cuadrada de $1 '],
  [/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' $1 sobre $2 '],
  [/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' combinaciones de $1 en $2 '],
  [/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, ' $1 '],
];

/** Convierte \\ce{…} / \\pu{…} a texto plano antes del resto de reglas (Q2). */
function tokenizarFragmentoQuimico(fragmento: string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < fragmento.length) {
    const c = fragmento[i]!;
    if (/\d/.test(c)) {
      let num = c;
      i++;
      while (i < fragmento.length && /\d/.test(fragmento[i]!)) num += fragmento[i++];
      parts.push(num);
    } else if (/[A-Z]/.test(c)) {
      let el = c;
      i++;
      if (i < fragmento.length && /[a-z]/.test(fragmento[i]!)) {
        el += fragmento[i]!;
        i++;
      }
      parts.push(el);
    } else if (/\s/.test(c)) {
      i++;
    } else {
      parts.push(c);
      i++;
    }
  }
  return parts.join(' ');
}

function leerCuerpoCe(cuerpo: string): string {
  const estados: string[] = [];
  let t = cuerpo.replace(/\((s|l|g|aq)\)/gi, (_m, st: string) => {
    estados.push(` en estado ${st.toLowerCase()} `);
    return '';
  });
  t = t
    .replace(/<=>|⇌/g, ' equilibrio ')
    .replace(/->/g, ' reacciona para formar ')
    .replace(/\+/g, ' más ');
  const leido = t
    .split(/(\s+más\s+|\s+reacciona para formar\s+|\s+equilibrio\s+)/)
    .map((seg) => {
      const s = seg.trim();
      if (s === '' || seg.startsWith(' ')) return seg;
      if (/^[A-Za-z0-9]+$/.test(s)) return tokenizarFragmentoQuimico(s);
      return seg;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return (leido + estados.join('')).replace(/\s+/g, ' ').trim();
}

function hablarCePu(latex: string): string {
  return latex
    .replace(/\\ce\{([^{}]*)\}/g, (_m, cuerpo: string) => leerCuerpoCe(cuerpo))
    .replace(/\\pu\{([^{}]*)\}/g, (_m, cuerpo: string) => cuerpo.trim());
}

/**
 * Lectura en español de una fórmula LaTeX, para lectores de pantalla. No es un
 * intérprete completo: lo que no reconoce se lee sin la barra invertida.
 */
export function speakLatex(latex: string): string {
  let s = ` ${hablarCePu(latex)} `
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\\\/g, ', ')
    .replace(/&/g, ' ');
  for (const [re, to] of SYMBOLS) s = s.replace(re, to);
  for (let i = 0; i < 20; i++) {
    const before = s;
    for (const [re, to] of STRUCTURE) s = s.replace(re, to as string);
    if (s === before) break;
  }
  s = s
    .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, ' ')
    .replace(/\\([A-Za-z]+)/g, ' $1 ')
    .replace(/[{}]/g, ' ')
    .replace(/=/g, ' igual a ')
    .replace(/\+/g, ' más ')
    .replace(/(?<=\S\s*)-/g, ' menos ')
    .replace(/^\s*-/, ' menos ')
    .replace(/</g, ' menor que ')
    .replace(/>/g, ' mayor que ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

// ─── M2: variables y pasos ──────────────────────────────────────────────────

export interface LatexVinculo {
  simbolo: string;
  variableId: string;
  decimales?: number;
}

const TOKEN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/** Número → LaTeX: coma decimal (es-CO) y los negativos agrupados para que `x + {-3}` espacie bien. */
export function formatearNumeroLatex(n: number, decimales?: number): string {
  if (!Number.isFinite(n)) return '0';
  const d = decimales === undefined ? 4 : Math.min(4, Math.max(0, Math.trunc(decimales)));
  const base = decimales === undefined ? String(Number(n.toFixed(d))) : n.toFixed(d);
  const texto = base.replace('.', '{,}');
  return n < 0 ? `{${texto}}` : texto;
}

function textoSeguro(valor: string): string {
  return valor.replace(/[^A-Za-z0-9 .,\-ÁÉÍÓÚÜáéíóúüñÑ]/g, '').slice(0, 60);
}

/**
 * Reemplaza los tokens `{{símbolo}}` por el valor actual de su variable. No
 * interpreta nada (D5): solo formatea números finitos y filtra el texto. Un
 * símbolo sin vínculo o sin valor se deja como la propia letra, de modo que la
 * plantilla se lee como álgebra (`a x^2`) en el editor y en visores sin motor.
 */
export function sustituirVariables(
  latex: string,
  vinculos: readonly LatexVinculo[] | undefined,
  valores: Readonly<Record<string, number | string | boolean>> | undefined,
): string {
  return latex.replace(TOKEN, (_m, simbolo: string) => {
    const v = vinculos?.find((x) => x.simbolo === simbolo);
    const valor = v && valores && Object.hasOwn(valores, v.variableId) ? valores[v.variableId] : undefined;
    if (typeof valor === 'number') return formatearNumeroLatex(valor, v?.decimales);
    if (typeof valor === 'boolean') return valor ? '\\text{verdadero}' : '\\text{falso}';
    if (typeof valor === 'string') {
      const t = textoSeguro(valor);
      return t === '' ? simbolo : `\\text{${t}}`;
    }
    return simbolo;
  });
}

/** Símbolos `{{x}}` presentes en la fórmula (únicos, en orden). */
export function simbolosDeLatex(latex: string): string[] {
  const out: string[] = [];
  for (const m of latex.matchAll(TOKEN)) if (!out.includes(m[1]!)) out.push(m[1]!);
  return out;
}

/**
 * Parte la fórmula en líneas por `\\` de nivel 0 (fuera de llaves). Si ya usa un
 * entorno (`\begin`) no se toca: devuelve una sola línea.
 */
export function dividirPasos(latex: string): string[] {
  if (latex.includes('\\begin')) return [latex.trim()];
  const lineas: string[] = [];
  let depth = 0;
  let inicio = 0;
  for (let i = 0; i < latex.length; i++) {
    const c = latex[i]!;
    if (c === '\\') {
      if (latex[i + 1] === '\\' && depth === 0) {
        lineas.push(latex.slice(inicio, i));
        inicio = i + 2;
      }
      i++;
    } else if (c === '{') depth++;
    else if (c === '}') depth = Math.max(0, depth - 1);
  }
  lineas.push(latex.slice(inicio));
  const limpias = lineas.map((l) => l.trim()).filter((l) => l !== '');
  return limpias.length > 0 ? limpias : [latex.trim()];
}

/** LaTeX con las primeras `k` líneas visibles (`k` ya acotado a 1..n). */
export function latexHastaPaso(pasos: readonly string[], k: number): string {
  const n = Math.min(pasos.length, Math.max(1, Math.trunc(k)));
  if (n === 1) return pasos[0] ?? '';
  const visibles = pasos.slice(0, n);
  const alineada = visibles.some((l) => l.includes('&'));
  const cuerpo = visibles.join(' \\\\ ');
  return alineada
    ? `\\begin{aligned} ${cuerpo} \\end{aligned}`
    : `\\begin{array}{c} ${cuerpo} \\end{array}`;
}
