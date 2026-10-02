/**
 * Inserción de plantillas matemáticas con el cursor dentro de la estructura.
 * El hueco del cursor es MATH_CARET_SLOT (un carácter de control), nunca `|`:
 * la barra vertical es un símbolo real (valor absoluto).
 */

export const MATH_CARET_SLOT = '\u0001';

export interface MathCaretResult {
  value: string;
  caret: number;
  caretEnd: number;
}

export interface MathTemplate {
  id: string;
  label: string;
  title: string;
  template: string;
}

export interface MathPaletteGroup {
  id: string;
  label: string;
  items: MathTemplate[];
}

const S = MATH_CARET_SLOT;

export interface MathPaletteTab {
  id: string;
  label: string;
  groups: MathPaletteGroup[];
}

/** Pestañas del teclado de ecuaciones (cada una agrupa familias de símbolos). */
export const MATH_TABS: MathPaletteTab[] = [
  {
    id: 'basico',
    label: 'Básico',
    groups: [
    {
      id: 'estructura',
      label: 'Estructura',
      items: [
      { id: "sqrt", label: "√", title: "Raíz cuadrada", template: `\\sqrt{${S}}` },
      { id: "nroot", label: "ⁿ√", title: "Raíz n-ésima", template: `\\sqrt[n]{${S}}` },
      { id: "frac", label: "a/b", title: "Fracción", template: `\\frac{${S}}{}` },
      { id: "sup", label: "xⁿ", title: "Potencia", template: `^{${S}}` },
      { id: "sub", label: "xₙ", title: "Subíndice", template: `_{${S}}` },
      { id: "sq", label: "x²", title: "Al cuadrado", template: `^{2}` },
      { id: "cube", label: "x³", title: "Al cubo", template: `^{3}` },
      { id: "subsup", label: "xₙᵐ", title: "Subíndice y potencia", template: `_{${S}}^{}` },
      ],
    },
    {
      id: 'agrupar',
      label: 'Agrupar',
      items: [
      { id: "paren", label: "( )", title: "Paréntesis", template: `\\left(${S}\\right)` },
      { id: "bracket", label: "[ ]", title: "Corchetes", template: `\\left[${S}\\right]` },
      { id: "brace", label: "{ }", title: "Llaves", template: `\\left\\{${S}\\right\\}` },
      { id: "abs", label: "|x|", title: "Valor absoluto", template: `\\left|${S}\\right|` },
      ],
    },
    {
      id: 'signos',
      label: 'Signos',
      items: [
      { id: "plus", label: "+", title: "Suma", template: `+` },
      { id: "minus", label: "−", title: "Resta", template: `-` },
      { id: "times", label: "×", title: "Multiplicación", template: `\\times` },
      { id: "div", label: "÷", title: "División", template: `\\div` },
      { id: "cdot", label: "·", title: "Producto", template: `\\cdot` },
      { id: "eq", label: "=", title: "Igual", template: `=` },
      { id: "neq", label: "≠", title: "Distinto", template: `\\neq` },
      { id: "lt", label: "<", title: "Menor", template: `<` },
      { id: "gt", label: ">", title: "Mayor", template: `>` },
      { id: "leq", label: "≤", title: "Menor o igual", template: `\\leq` },
      { id: "geq", label: "≥", title: "Mayor o igual", template: `\\geq` },
      { id: "pm", label: "±", title: "Más menos", template: `\\pm` },
      { id: "approx", label: "≈", title: "Aproximado", template: `\\approx` },
      { id: "dots", label: "…", title: "Puntos suspensivos", template: `\\ldots` },
      { id: "pct", label: "%", title: "Porcentaje", template: `\\%` },
      { id: "deg", label: "°", title: "Grados", template: `^{\\circ}` },
      ],
    },
    ],
  },
  {
    id: 'algebra',
    label: 'Álgebra',
    groups: [
    {
      id: 'funciones',
      label: 'Funciones y sumas',
      items: [
      { id: "log", label: "log", title: "Logaritmo", template: `\\log` },
      { id: "logb", label: "logₐ", title: "Logaritmo en base a", template: `\\log_{${S}}\\left(\\right)` },
      { id: "ln", label: "ln", title: "Logaritmo natural", template: `\\ln` },
      { id: "exp", label: "eˣ", title: "Exponencial", template: `e^{${S}}` },
      { id: "sum", label: "∑", title: "Sumatoria", template: `\\sum_{i=1}^{${S}}` },
      { id: "prod", label: "∏", title: "Productoria", template: `\\prod_{i=1}^{${S}}` },
      { id: "binom", label: "(ⁿₖ)", title: "Combinatoria", template: `\\binom{${S}}{}` },
      { id: "fact", label: "n!", title: "Factorial", template: `!` },
      { id: "cases", label: "{ sistema", title: "Sistema de ecuaciones", template: `\\begin{cases} ${S} \\\\ \\end{cases}` },
      { id: "mod", label: "mod", title: "Módulo", template: `\\bmod` },
      ],
    },
    {
      id: 'conjuntos',
      label: 'Conjuntos y lógica',
      items: [
      { id: "in", label: "∈", title: "Pertenece", template: `\\in` },
      { id: "notin", label: "∉", title: "No pertenece", template: `\\notin` },
      { id: "cup", label: "∪", title: "Unión", template: `\\cup` },
      { id: "cap", label: "∩", title: "Intersección", template: `\\cap` },
      { id: "subset", label: "⊂", title: "Subconjunto", template: `\\subset` },
      { id: "subseteq", label: "⊆", title: "Subconjunto o igual", template: `\\subseteq` },
      { id: "empty", label: "∅", title: "Conjunto vacío", template: `\\emptyset` },
      { id: "R", label: "ℝ", title: "Reales", template: `\\mathbb{R}` },
      { id: "N", label: "ℕ", title: "Naturales", template: `\\mathbb{N}` },
      { id: "Z", label: "ℤ", title: "Enteros", template: `\\mathbb{Z}` },
      { id: "Q", label: "ℚ", title: "Racionales", template: `\\mathbb{Q}` },
      { id: "forall", label: "∀", title: "Para todo", template: `\\forall` },
      { id: "exists", label: "∃", title: "Existe", template: `\\exists` },
      { id: "implies", label: "⇒", title: "Implica", template: `\\Rightarrow` },
      { id: "iff", label: "⇔", title: "Si y solo si", template: `\\Leftrightarrow` },
      { id: "to", label: "→", title: "Tiende a", template: `\\to` },
      ],
    },
    ],
  },
  {
    id: 'geometria',
    label: 'Geometría',
    groups: [
    {
      id: 'geometria',
      label: 'Geometría',
      items: [
      { id: "angle", label: "∠", title: "Ángulo", template: `\\angle` },
      { id: "triangle", label: "△", title: "Triángulo", template: `\\triangle` },
      { id: "perp", label: "⊥", title: "Perpendicular", template: `\\perp` },
      { id: "parallel", label: "∥", title: "Paralelo", template: `\\parallel` },
      { id: "cong", label: "≅", title: "Congruente", template: `\\cong` },
      { id: "sim", label: "∼", title: "Semejante", template: `\\sim` },
      { id: "overline", label: "AB̅", title: "Segmento", template: `\\overline{${S}}` },
      { id: "vec", label: "v⃗", title: "Vector", template: `\\vec{${S}}` },
      { id: "hat", label: "â", title: "Sombrero", template: `\\hat{${S}}` },
      { id: "arc", label: "⌒", title: "Arco", template: `\\overset{\\frown}{${S}}` },
      { id: "pi", label: "π", title: "Pi", template: `\\pi` },
      { id: "deg2", label: "°", title: "Grados", template: `^{\\circ}` },
      ],
    },
    ],
  },
  {
    id: 'trig',
    label: 'Trigonometría',
    groups: [
    {
      id: 'trig',
      label: 'Trigonometría',
      items: [
      { id: "sin", label: "sen", title: "Seno", template: `\\sin` },
      { id: "cos", label: "cos", title: "Coseno", template: `\\cos` },
      { id: "tan", label: "tan", title: "Tangente", template: `\\tan` },
      { id: "cot", label: "cot", title: "Cotangente", template: `\\cot` },
      { id: "sec", label: "sec", title: "Secante", template: `\\sec` },
      { id: "csc", label: "csc", title: "Cosecante", template: `\\csc` },
      { id: "asin", label: "sen⁻¹", title: "Arco seno", template: `\\sin^{-1}` },
      { id: "acos", label: "cos⁻¹", title: "Arco coseno", template: `\\cos^{-1}` },
      { id: "atan", label: "tan⁻¹", title: "Arco tangente", template: `\\tan^{-1}` },
      { id: "theta", label: "θ", title: "Theta", template: `\\theta` },
      { id: "alpha", label: "α", title: "Alfa", template: `\\alpha` },
      { id: "beta", label: "β", title: "Beta", template: `\\beta` },
      ],
    },
    ],
  },
  {
    id: 'calculo',
    label: 'Cálculo',
    groups: [
    {
      id: 'calculo',
      label: 'Cálculo',
      items: [
      { id: "lim", label: "lím", title: "Límite", template: `\\lim_{x \\to ${S}}` },
      { id: "int", label: "∫ₐᵇ", title: "Integral definida", template: `\\int_{}^{} ${S} \\, dx` },
      { id: "intdef", label: "∫", title: "Integral", template: `\\int ${S} \\, dx` },
      { id: "deriv", label: "d/dx", title: "Derivada", template: `\\frac{d}{dx}\\left(${S}\\right)` },
      { id: "dydx", label: "dy/dx", title: "Derivada dy/dx", template: `\\frac{dy}{dx}` },
      { id: "partial", label: "∂", title: "Derivada parcial", template: `\\partial` },
      { id: "inf", label: "∞", title: "Infinito", template: `\\infty` },
      { id: "nabla", label: "∇", title: "Nabla", template: `\\nabla` },
      { id: "sumc", label: "∑", title: "Sumatoria", template: `\\sum_{n=1}^{${S}}` },
      ],
    },
    ],
  },
  {
    id: 'griegas',
    label: 'Griegas',
    groups: [
    {
      id: 'griegas',
      label: 'Letras griegas',
      items: [
      { id: "galpha", label: "α", title: "Alfa", template: `\\alpha` },
      { id: "gbeta", label: "β", title: "Beta", template: `\\beta` },
      { id: "ggamma", label: "γ", title: "Gamma", template: `\\gamma` },
      { id: "gdelta", label: "δ", title: "Delta", template: `\\delta` },
      { id: "geps", label: "ε", title: "Épsilon", template: `\\varepsilon` },
      { id: "gtheta", label: "θ", title: "Theta", template: `\\theta` },
      { id: "glambda", label: "λ", title: "Lambda", template: `\\lambda` },
      { id: "gmu", label: "μ", title: "Mu", template: `\\mu` },
      { id: "gpi", label: "π", title: "Pi", template: `\\pi` },
      { id: "grho", label: "ρ", title: "Rho", template: `\\rho` },
      { id: "gsigma", label: "σ", title: "Sigma", template: `\\sigma` },
      { id: "gtau", label: "τ", title: "Tau", template: `\\tau` },
      { id: "gphi", label: "φ", title: "Phi", template: `\\varphi` },
      { id: "gomega", label: "ω", title: "Omega", template: `\\omega` },
      { id: "gDelta", label: "Δ", title: "Delta mayúscula", template: `\\Delta` },
      { id: "gSigma", label: "Σ", title: "Sigma mayúscula", template: `\\Sigma` },
      { id: "gPhi", label: "Φ", title: "Phi mayúscula", template: `\\Phi` },
      { id: "gOmega", label: "Ω", title: "Omega mayúscula", template: `\\Omega` },
      ],
    },
    ],
  },
  {
    id: 'plantillas',
    label: 'Fórmulas',
    groups: [
    {
      id: 'plantillas',
      label: 'Fórmulas frecuentes',
      items: [
      { id: "t-general", label: "Fórmula general", title: "Fórmula general de la ecuación cuadrática", template: `x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}` },
      { id: "t-cuadratica", label: "ax²+bx+c=0", title: "Ecuación cuadrática", template: `ax^{2} + bx + c = 0` },
      { id: "t-pitagoras", label: "a²+b²=c²", title: "Teorema de Pitágoras", template: `a^{2} + b^{2} = c^{2}` },
      { id: "t-circulo", label: "A = πr²", title: "Área del círculo", template: `A = \\pi r^{2}` },
      { id: "t-long", label: "L = 2πr", title: "Longitud de la circunferencia", template: `L = 2\\pi r` },
      { id: "t-pendiente", label: "Pendiente", title: "Pendiente de una recta", template: `m = \\frac{y_{2} - y_{1}}{x_{2} - x_{1}}` },
      { id: "t-distancia", label: "Distancia", title: "Distancia entre dos puntos", template: `d = \\sqrt{\\left(x_{2} - x_{1}\\right)^{2} + \\left(y_{2} - y_{1}\\right)^{2}}` },
      { id: "t-recta", label: "y = mx + b", title: "Ecuación de la recta", template: `y = mx + b` },
      { id: "t-velocidad", label: "v = d/t", title: "Velocidad", template: `v = \\frac{d}{t}` },
      { id: "t-porcentaje", label: "Porcentaje", title: "Porcentaje", template: `P = \\frac{\\text{parte}}{\\text{total}} \\times 100\\%` },
      ],
    },
    ],
  },
];

/** Todos los grupos en una sola lista (compatibilidad y búsqueda por id). */
export const MATH_PALETTE: MathPaletteGroup[] = MATH_TABS.flatMap((t) => t.groups);

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function range(source: string, start: number, end: number): [number, number] {
  const len = source.length;
  let a = clamp(start, 0, len);
  let b = clamp(end, 0, len);
  if (b < a) [a, b] = [b, a];
  return [a, b];
}

/** Inserta `template` en el rango [start, end). El hueco queda donde está MATH_CARET_SLOT. */
export function applyMathTemplate(
  source: string,
  start: number,
  end: number,
  template: string,
): MathCaretResult {
  const [a, b] = range(source, start, end);
  const selected = source.slice(a, b);
  const slot = template.indexOf(MATH_CARET_SLOT);
  if (slot < 0) {
    const value = source.slice(0, a) + template + source.slice(b);
    const caret = a + template.length;
    return { value, caret, caretEnd: caret };
  }
  const before = template.slice(0, slot);
  const after = template.slice(slot + MATH_CARET_SLOT.length);
  const value = source.slice(0, a) + before + selected + after + source.slice(b);
  const caret = a + before.length + selected.length;
  return { value, caret, caretEnd: caret };
}

/** Borra la selección, o el carácter anterior al cursor. */
export function deleteMathAt(source: string, start: number, end: number): MathCaretResult {
  const [a, b] = range(source, start, end);
  if (a !== b) {
    return { value: source.slice(0, a) + source.slice(b), caret: a, caretEnd: a };
  }
  if (a === 0) return { value: source, caret: 0, caretEnd: 0 };
  return { value: source.slice(0, a - 1) + source.slice(a), caret: a - 1, caretEnd: a - 1 };
}

/**
 * Siguiente hueco para Tab: primero un par `{}` vacío a la derecha del cursor
 * (cursor dentro); si no hay, salta después de la próxima `}` (sale del grupo).
 * Devuelve `null` si no queda ningún destino (Tab sigue su curso normal).
 */
export function nextMathSlot(source: string, caret: number): number | null {
  const from = clamp(caret, 0, source.length);
  const empty = source.indexOf('{}', from);
  if (empty >= 0) return empty + 1;
  const close = source.indexOf('}', from);
  if (close >= 0) return close + 1;
  return null;
}
