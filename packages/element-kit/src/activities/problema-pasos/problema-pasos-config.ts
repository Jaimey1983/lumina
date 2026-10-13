import type { ProblemaPaso, ProblemaPasosActivity } from '@lumina/types/slide';

export const PROBLEMA_MAX_PASOS = 10;
export const PROBLEMA_MIN_PASOS = 1;
export const PROBLEMA_MAX_PISTAS_POR_PASO = 5;

export function generarIdProblema(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function pasoVacio(): ProblemaPaso {
  return { id: generarIdProblema('paso'), instruccion: '', modo: 'numerico', respuesta: '', pistas: [] };
}

function normalizarPaso(raw: unknown): ProblemaPaso {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const paso: ProblemaPaso = {
    id: typeof o.id === 'string' && o.id ? o.id : generarIdProblema('paso'),
    instruccion: typeof o.instruccion === 'string' ? o.instruccion : '',
    modo: o.modo === 'algebraico' ? 'algebraico' : 'numerico',
    respuesta: typeof o.respuesta === 'string' ? o.respuesta : o.respuesta == null ? '' : String(o.respuesta),
    // Se conservan las pistas vacías: el editor las necesita para mostrar una recién agregada.
    pistas: (Array.isArray(o.pistas) ? o.pistas : []).map((p) => String(p ?? '')),
  };
  if (typeof o.tolerancia === 'number' && Number.isFinite(o.tolerancia) && o.tolerancia >= 0) paso.tolerancia = o.tolerancia;
  if (o.toleranciaTipo === 'porcentual' || o.toleranciaTipo === 'absoluta') paso.toleranciaTipo = o.toleranciaTipo;
  if (typeof o.unidad === 'string' && o.unidad.trim()) paso.unidad = o.unidad;
  return paso;
}

/** Hidrata una actividad tal como se guardó: completa lo que falte y no toca `ajustes`. */
export function normalizarProblemaPasos(actividad: ProblemaPasosActivity | Record<string, unknown>): ProblemaPasosActivity {
  const raw = actividad as Partial<ProblemaPasosActivity>;
  return {
    ...(raw as ProblemaPasosActivity),
    tipo: 'problema_pasos',
    enunciado: typeof raw.enunciado === 'string' ? raw.enunciado : '',
    pasos: (Array.isArray(raw.pasos) ? raw.pasos : []).map(normalizarPaso),
    secuencial: raw.secuencial !== false,
  };
}

/** Pistas con texto de un paso (las vacías no se ofrecen). */
export function pistasDe(paso: ProblemaPaso): string[] {
  return (paso.pistas ?? []).filter((p) => p.trim().length > 0);
}

/** Texto de ayuda sobre la tolerancia vigente de un paso numérico (misma regla que scoring). */
export function describirToleranciaPaso(paso: ProblemaPaso, esperado: number | null): string {
  if (paso.modo !== 'numerico' || esperado === null) return '';
  if (typeof paso.tolerancia === 'number' && paso.tolerancia >= 0) {
    return paso.toleranciaTipo === 'porcentual' ? `Se acepta ±${paso.tolerancia} % del valor.` : `Se acepta ±${paso.tolerancia}.`;
  }
  return Number.isInteger(esperado) ? 'Respuesta exacta (número entero).' : 'Se acepta ±0,01 (decimal).';
}

/** Huella del CONTENIDO: cambiar un ajuste (estilo, sonido…) no reinicia el problema. */
export function problemaPasosFingerprint(a: ProblemaPasosActivity): string {
  return JSON.stringify([a.enunciado, a.imagen ?? '', a.secuencial, a.pasos]);
}
