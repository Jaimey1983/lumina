// ─── Normalizador de escenas (W1) ─────────────────────────────────────────────
// Único escritor canónico: todo dato que entra al motor pasa por
// `normalizarEscena`. Nunca lanza; descarta o corrige lo inválido, y es
// idempotente (`normalizar(normalizar(x))` es igual a `normalizar(x)`).

import {
  ALINEACIONES_H,
  ALINEACIONES_V,
  ESCENA_VERSION,
  EXTREMOS,
  PATRONES_LINEA,
  TIPOS_FORMA,
  TRAZADOS,
  type Color,
  type Conexion,
  type Contorno,
  type Elemento,
  type Escena,
  type Estilo,
  type EstiloTexto,
  type Extremo,
  type Forma,
  type Grupo,
  type Linea,
  type Punto,
  type Relleno,
  type Sombra,
  type Texto,
  type TipoForma,
  type Trazado,
  type Transformacion,
} from './tipos.js';

// ─── Límites ──────────────────────────────────────────────────────────────────

export const LIMITES = {
  elementos: 2000,
  texto: 2000,
  nombre: 120,
  descripcion: 500,
  fuente: 80,
  idLargo: 64,
  puntosPorLinea: 200,
  parametros: 8,
  escenaAncho: { min: 100, max: 10000, porDefecto: 1280 },
  escenaAlto: { min: 100, max: 10000, porDefecto: 720 },
  coordenada: 100000,
  medida: { min: 1, max: 20000 },
  grosor: 50,
  tamanoTexto: { min: 6, max: 400, porDefecto: 16 },
  desenfoque: 100,
  desplazamiento: 200,
  radio: 5000,
  valorParametro: 10000,
} as const;

const COLOR_TEXTO = '#0F172A';
const COLOR_CONTORNO = '#334155';
const COLOR_RELLENO = '#FFFFFF';

// ─── Utilidades de lectura ────────────────────────────────────────────────────

type Registro = Record<string, unknown>;

function registro(valor: unknown): Registro | undefined {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Registro) : undefined;
}

const redondear = (n: number): number => Math.round(n * 100) / 100;

function numero(valor: unknown, porDefecto: number, min: number, max: number): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return porDefecto;
  return redondear(Math.min(max, Math.max(min, valor)));
}

function booleano(valor: unknown, porDefecto: boolean): boolean {
  return typeof valor === 'boolean' ? valor : porDefecto;
}

function enumerado<T extends string>(valor: unknown, validos: readonly T[], porDefecto: T): T {
  return typeof valor === 'string' && (validos as readonly string[]).includes(valor) ? (valor as T) : porDefecto;
}

/** Texto recortado a `max`; vacío o no-texto → `undefined`. */
function texto(valor: unknown, max: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.slice(0, max);
  return limpio.trim().length > 0 ? limpio : undefined;
}

function grados(valor: unknown, porDefecto = 0): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return porDefecto;
  const g = redondear(((valor % 360) + 360) % 360);
  return g >= 360 ? 0 : g;
}

const RE_COLOR_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RE_COLOR_TOKEN = /^var\(--[a-z0-9-]{1,40}\)$/i;

/** Hex o token del tema; cualquier otra cosa (incluidas funciones CSS y `url()`) cae al valor por defecto. */
export function esColorValido(valor: unknown): valor is Color {
  return typeof valor === 'string' && (RE_COLOR_HEX.test(valor) || RE_COLOR_TOKEN.test(valor));
}

function color(valor: unknown, porDefecto: Color): Color {
  return esColorValido(valor) ? valor : porDefecto;
}

const RE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// ─── Estilos ──────────────────────────────────────────────────────────────────

function normalizarRelleno(valor: unknown, porDefecto: Relleno): Relleno {
  const r = registro(valor);
  if (!r) return porDefecto;
  if (r.tipo === 'ninguno') return { tipo: 'ninguno' };
  if (r.tipo === 'solido') {
    return { tipo: 'solido', color: color(r.color, porDefecto.tipo === 'solido' ? porDefecto.color : COLOR_RELLENO) };
  }
  if (r.tipo === 'degradado') {
    return {
      tipo: 'degradado',
      desde: color(r.desde, COLOR_RELLENO),
      hasta: color(r.hasta, COLOR_CONTORNO),
      angulo: grados(r.angulo, 90),
    };
  }
  return porDefecto;
}

function normalizarContorno(valor: unknown, porDefecto: Contorno): Contorno {
  const r = registro(valor);
  if (!r) return { ...porDefecto };
  return {
    color: color(r.color, porDefecto.color),
    grosor: numero(r.grosor, porDefecto.grosor, 0, LIMITES.grosor),
    patron: enumerado(r.patron, PATRONES_LINEA, porDefecto.patron),
  };
}

function normalizarSombra(valor: unknown): Sombra | null {
  const r = registro(valor);
  if (!r) return null;
  return {
    color: color(r.color, '#00000040'),
    desenfoque: numero(r.desenfoque, 4, 0, LIMITES.desenfoque),
    dx: numero(r.dx, 0, -LIMITES.desplazamiento, LIMITES.desplazamiento),
    dy: numero(r.dy, 2, -LIMITES.desplazamiento, LIMITES.desplazamiento),
  };
}

function estiloPorDefecto(tipo: 'forma' | 'linea' | 'texto'): Estilo {
  return {
    relleno: tipo === 'forma' ? { tipo: 'solido', color: COLOR_RELLENO } : { tipo: 'ninguno' },
    contorno: { color: COLOR_CONTORNO, grosor: tipo === 'texto' ? 0 : 2, patron: 'solido' },
    opacidad: 1,
    sombra: null,
    radio: 0,
  };
}

function normalizarEstilo(valor: unknown, tipo: 'forma' | 'linea' | 'texto'): Estilo {
  const base = estiloPorDefecto(tipo);
  const r = registro(valor);
  if (!r) return base;
  return {
    relleno: normalizarRelleno(r.relleno, base.relleno),
    contorno: normalizarContorno(r.contorno, base.contorno),
    opacidad: numero(r.opacidad, 1, 0, 1),
    sombra: normalizarSombra(r.sombra),
    radio: numero(r.radio, 0, 0, LIMITES.radio),
  };
}

function normalizarEstiloTexto(valor: unknown, tipo: 'forma' | 'linea' | 'texto'): EstiloTexto {
  const r = registro(valor) ?? {};
  return {
    tamano: numero(r.tamano, LIMITES.tamanoTexto.porDefecto, LIMITES.tamanoTexto.min, LIMITES.tamanoTexto.max),
    negrita: booleano(r.negrita, false),
    cursiva: booleano(r.cursiva, false),
    subrayado: booleano(r.subrayado, false),
    alineacionH: enumerado(r.alineacionH, ALINEACIONES_H, tipo === 'texto' ? 'izquierda' : 'centro'),
    alineacionV: enumerado(r.alineacionV, ALINEACIONES_V, tipo === 'texto' ? 'arriba' : 'medio'),
    color: color(r.color, COLOR_TEXTO),
    fuente: texto(r.fuente, LIMITES.fuente)?.trim() ?? '',
  };
}

function normalizarTransformacion(valor: unknown, porDefecto: { ancho: number; alto: number }): Transformacion {
  const r = registro(valor) ?? {};
  return {
    x: numero(r.x, 0, -LIMITES.coordenada, LIMITES.coordenada),
    y: numero(r.y, 0, -LIMITES.coordenada, LIMITES.coordenada),
    ancho: numero(r.ancho, porDefecto.ancho, LIMITES.medida.min, LIMITES.medida.max),
    alto: numero(r.alto, porDefecto.alto, LIMITES.medida.min, LIMITES.medida.max),
    rotacion: grados(r.rotacion),
  };
}

function normalizarParametros(valor: unknown): Record<string, number> | undefined {
  const r = registro(valor);
  if (!r) return undefined;
  const salida: Record<string, number> = {};
  for (const clave of Object.keys(r)) {
    if (Object.keys(salida).length >= LIMITES.parametros) break;
    if (!/^[a-z0-9-]{1,24}$/.test(clave)) continue;
    const v = r[clave];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    salida[clave] = numero(v, 0, -LIMITES.valorParametro, LIMITES.valorParametro);
  }
  return Object.keys(salida).length > 0 ? salida : undefined;
}

function normalizarPuntos(valor: unknown): Punto[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const puntos: Punto[] = [];
  for (const crudo of valor.slice(0, LIMITES.puntosPorLinea)) {
    const p = registro(crudo);
    if (!p) continue;
    if (typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    puntos.push({
      x: numero(p.x, 0, -LIMITES.coordenada, LIMITES.coordenada),
      y: numero(p.y, 0, -LIMITES.coordenada, LIMITES.coordenada),
    });
  }
  return puntos.length >= 2 ? puntos : undefined;
}

function normalizarConexion(valor: unknown): Conexion | undefined {
  const c = registro(valor);
  if (!c || typeof c.elementoId !== 'string') return undefined;
  const puerto = typeof c.puerto === 'number' && Number.isInteger(c.puerto) && c.puerto >= 0 && c.puerto < 64 ? c.puerto : undefined;
  return puerto === undefined ? undefined : { elementoId: c.elementoId, puerto };
}

// ─── Elementos ────────────────────────────────────────────────────────────────

/** Genera un id libre de la forma `<prefijo>-<n>`; no se repite dentro de la escena. */
function idLibre(prefijo: string, usados: Set<string>): string {
  let n = usados.size + 1;
  while (usados.has(`${prefijo}-${n}`)) n += 1;
  return `${prefijo}-${n}`;
}

function cabecera(r: Registro, tipo: Elemento['tipo'], usados: Set<string>) {
  const idCrudo = typeof r.id === 'string' && RE_ID.test(r.id) && !usados.has(r.id) ? r.id : idLibre(tipo, usados);
  usados.add(idCrudo);
  const nombre = texto(r.nombre, LIMITES.nombre);
  const descripcion = texto(r.descripcion, LIMITES.descripcion);
  return {
    id: idCrudo,
    ...(nombre ? { nombre } : {}),
    ...(descripcion ? { descripcion } : {}),
    bloqueado: booleano(r.bloqueado, false),
    oculto: booleano(r.oculto, false),
  };
}

function normalizarForma(r: Registro, usados: Set<string>): Forma {
  const t = texto(r.texto, LIMITES.texto);
  const parametros = normalizarParametros(r.parametros);
  return {
    ...cabecera(r, 'forma', usados),
    tipo: 'forma',
    forma: enumerado<TipoForma>(r.forma, TIPOS_FORMA, 'rectangulo'),
    transformacion: normalizarTransformacion(r.transformacion, { ancho: 160, alto: 100 }),
    estilo: normalizarEstilo(r.estilo, 'forma'),
    ...(t ? { texto: t } : {}),
    estiloTexto: normalizarEstiloTexto(r.estiloTexto, 'forma'),
    ...(parametros ? { parametros } : {}),
  };
}

function normalizarLinea(r: Registro, usados: Set<string>): Linea | undefined {
  const puntos = normalizarPuntos(r.puntos);
  if (!puntos) return undefined;
  const t = texto(r.texto, LIMITES.texto);
  const origen = normalizarConexion(r.origen);
  const destino = normalizarConexion(r.destino);
  return {
    ...cabecera(r, 'linea', usados),
    tipo: 'linea',
    puntos,
    trazado: enumerado<Trazado>(r.trazado, TRAZADOS, 'recto'),
    inicio: enumerado<Extremo>(r.inicio, EXTREMOS, 'ninguno'),
    fin: enumerado<Extremo>(r.fin, EXTREMOS, 'flecha'),
    ...(origen ? { origen } : {}),
    ...(destino ? { destino } : {}),
    estilo: normalizarEstilo(r.estilo, 'linea'),
    ...(t ? { texto: t } : {}),
    estiloTexto: normalizarEstiloTexto(r.estiloTexto, 'linea'),
  };
}

function normalizarTexto(r: Registro, usados: Set<string>): Texto {
  return {
    ...cabecera(r, 'texto', usados),
    tipo: 'texto',
    transformacion: normalizarTransformacion(r.transformacion, { ancho: 200, alto: 40 }),
    estilo: normalizarEstilo(r.estilo, 'texto'),
    texto: texto(r.texto, LIMITES.texto) ?? 'Texto',
    estiloTexto: normalizarEstiloTexto(r.estiloTexto, 'texto'),
  };
}

function normalizarGrupo(r: Registro, usados: Set<string>): Grupo {
  return {
    ...cabecera(r, 'grupo', usados),
    tipo: 'grupo',
    hijos: Array.isArray(r.hijos) ? r.hijos.filter((h): h is string => typeof h === 'string') : [],
  };
}

// ─── Referencias entre elementos ──────────────────────────────────────────────

/**
 * Deja los grupos consistentes: sus hijos existen, son únicos, no se contienen a
 * sí mismos (ni por ciclo) y cada elemento tiene un solo padre; un grupo con
 * menos de 2 hijos válidos se disuelve (sus hijos quedan sueltos). Se repite
 * hasta que ya no cambia, porque disolver un grupo puede dejar a su padre corto.
 */
function repararGrupos(elementos: Elemento[]): Elemento[] {
  let actual = elementos;
  for (;;) {
    const ids = new Set(actual.map((e) => e.id));
    const padreDe = new Map<string, string>();
    let cambio = false;
    const siguiente: Elemento[] = [];

    for (const e of actual) {
      if (e.tipo !== 'grupo') {
        siguiente.push(e);
        continue;
      }
      const hijos: string[] = [];
      for (const h of e.hijos) {
        if (h === e.id || !ids.has(h) || padreDe.has(h) || hijos.includes(h)) continue;
        // Ciclo: si `e` ya desciende de `h`, adoptarlo cerraría un lazo.
        let ancestro: string | undefined = e.id;
        let ciclo = false;
        while (ancestro !== undefined) {
          if (ancestro === h) {
            ciclo = true;
            break;
          }
          ancestro = padreDe.get(ancestro);
        }
        if (ciclo) continue;
        hijos.push(h);
        padreDe.set(h, e.id);
      }
      if (hijos.length < 2) {
        for (const h of hijos) padreDe.delete(h);
        cambio = true;
        continue;
      }
      if (hijos.length !== e.hijos.length) cambio = true;
      siguiente.push({ ...e, hijos });
    }

    actual = siguiente;
    if (!cambio) return actual;
  }
}

/** Las conexiones de un conector solo pueden apuntar a una forma que exista. */
function repararConexiones(elementos: Elemento[]): Elemento[] {
  const formas = new Set(elementos.filter((e) => e.tipo === 'forma').map((e) => e.id));
  return elementos.map((e) => {
    if (e.tipo !== 'linea') return e;
    const { origen, destino, ...resto } = e;
    return {
      ...resto,
      ...(origen && formas.has(origen.elementoId) ? { origen } : {}),
      ...(destino && formas.has(destino.elementoId) ? { destino } : {}),
    };
  });
}

// ─── Escena ───────────────────────────────────────────────────────────────────

export function escenaVacia(): Escena {
  return {
    version: ESCENA_VERSION,
    ancho: LIMITES.escenaAncho.porDefecto,
    alto: LIMITES.escenaAlto.porDefecto,
    fondo: null,
    elementos: [],
  };
}

/**
 * Convierte cualquier entrada en una `Escena` válida. Nunca lanza: lo que no se
 * puede interpretar se descarta (un elemento irreconocible desaparece; un valor
 * inválido cae al de por defecto).
 */
export function normalizarEscena(entrada: unknown): Escena {
  try {
    return normalizarSinProteccion(entrada);
  } catch {
    // Entrada que ni siquiera se puede leer (getters que lanzan, proxies hostiles): escena vacía.
    return escenaVacia();
  }
}

function normalizarSinProteccion(entrada: unknown): Escena {
  const raiz = registro(entrada);
  if (!raiz) return escenaVacia();

  const crudos = Array.isArray(raiz.elementos) ? raiz.elementos.slice(0, LIMITES.elementos) : [];
  const usados = new Set<string>();
  const elementos: Elemento[] = [];

  for (const crudo of crudos) {
    const r = registro(crudo);
    if (!r) continue;
    let elemento: Elemento | undefined;
    switch (r.tipo) {
      case 'forma':
        elemento = normalizarForma(r, usados);
        break;
      case 'linea':
        elemento = normalizarLinea(r, usados);
        break;
      case 'texto':
        elemento = normalizarTexto(r, usados);
        break;
      case 'grupo':
        elemento = normalizarGrupo(r, usados);
        break;
      default:
        break;
    }
    if (elemento) elementos.push(elemento);
  }

  return {
    version: ESCENA_VERSION,
    ancho: numero(raiz.ancho, LIMITES.escenaAncho.porDefecto, LIMITES.escenaAncho.min, LIMITES.escenaAncho.max),
    alto: numero(raiz.alto, LIMITES.escenaAlto.porDefecto, LIMITES.escenaAlto.min, LIMITES.escenaAlto.max),
    fondo: raiz.fondo === null || raiz.fondo === undefined ? null : esColorValido(raiz.fondo) ? raiz.fondo : null,
    elementos: repararConexiones(repararGrupos(elementos)),
  };
}
