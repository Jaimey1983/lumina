import type {
  Accion,
  Capa,
  Condicion,
  Operando,
  Regla,
  VariableDef,
} from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import { contextoDesdeSlides, recolectarReglas } from './recolectar.js';
import { accionesDeRegla } from './reglas.js';
import type { ReglaAplicable } from './tipos.js';
import { validarReglas } from './validar.js';

/**
 * Integridad referencial de las reglas (K7b).
 *
 * Las reglas referencian bloques, slides, capas y variables por `id`. Cuatro
 * gestos del editor cambian o duplican esos ids: borrar un bloque, borrar un
 * slide, duplicar un slide y pegar un bloque. Estas funciones son PURAS y
 * deterministas (los ids nuevos los inyecta quien llama); el editor las aplica
 * y guarda. Reordenar slides no cambia ids, así que no rompe nada.
 *
 * Alcance: solo se ven los bloques de primer nivel de `Slide.bloques` y de las
 * capas (los hijos de «columnas» no pueden ser dueños ni objetivo de reglas,
 * igual que en `recolectarReglas`).
 */

export type SlideMotor = Pick<Slide, 'id' | 'bloques' | 'capas' | 'reglas'>;

// ─── Detección ───────────────────────────────────────────────────────────────

export type CodigoReferenciaRota =
  | 'bloque_inexistente'
  | 'slide_inexistente'
  | 'capa_inexistente'
  | 'variable_inexistente'
  | 'regla_duplicada'
  | 'dueno_sin_id';

export interface ReferenciaRota {
  reglaId: string;
  slideId: string;
  /** Presente si la regla vive en un bloque. */
  bloqueId?: string;
  codigo: CodigoReferenciaRota;
  mensaje: string;
}

const CODIGOS_DE_INTEGRIDAD: ReadonlySet<string> = new Set<CodigoReferenciaRota>([
  'bloque_inexistente',
  'slide_inexistente',
  'capa_inexistente',
  'variable_inexistente',
  'regla_duplicada',
]);

/**
 * Reglas del mazo que apuntan a algo que ya no existe (o que chocan de id).
 * Un mazo sano devuelve `[]`. NO bloquea el guardado: alimenta el aviso del
 * panel y es la aserción de los specs.
 */
export function reglasConReferenciasRotas(
  slides: readonly SlideMotor[],
  variables: readonly VariableDef[],
): ReferenciaRota[] {
  const aplicables = recolectarReglas(slides);
  const origenDe = new Map<string, ReglaAplicable>();
  for (const a of aplicables) {
    if (!origenDe.has(a.regla.id)) origenDe.set(a.regla.id, a);
  }
  const rotas: ReferenciaRota[] = [];
  const errores = validarReglas(aplicables, contextoDesdeSlides(variables, slides));
  for (const e of errores) {
    if (!CODIGOS_DE_INTEGRIDAD.has(e.codigo) || e.reglaId === undefined) continue;
    const a = origenDe.get(e.reglaId);
    if (!a) continue;
    rotas.push({
      reglaId: e.reglaId,
      slideId: a.origen.slideId,
      ...(a.origen.tipo === 'bloque' ? { bloqueId: a.origen.bloqueId } : {}),
      codigo: e.codigo as CodigoReferenciaRota,
      mensaje: e.mensaje,
    });
  }
  // Un bloque con `disparadores` pero sin `id` perdió sus reglas en silencio
  // (`recolectarReglas` las ignora): se avisa en vez de callar.
  for (const slide of slides) {
    for (const b of bloquesDelMotor(slide)) {
      if (idDeBloque(b) === undefined && (b.disparadores?.length ?? 0) > 0) {
        for (const r of b.disparadores ?? []) {
          rotas.push({
            reglaId: r.id,
            slideId: slide.id,
            codigo: 'dueno_sin_id',
            mensaje: 'La regla está en un bloque sin identificador y no se ejecuta.',
          });
        }
      }
    }
  }
  return rotas;
}

// ─── Recorridos internos ─────────────────────────────────────────────────────

function bloquesDelMotor(slide: SlideMotor): Block[] {
  return [
    ...(slide.bloques ?? []),
    ...(slide.capas ?? []).flatMap((c) => c.bloques),
  ];
}

function operandoRefiere(op: Operando, esBloque: (id: string) => boolean): boolean {
  return (
    (op.tipo === 'estado_bloque' || op.tipo === 'respuesta_correcta') &&
    esBloque(op.bloqueId)
  );
}

function condicionRefiere(
  c: Condicion,
  esBloque: (id: string) => boolean,
  prof = 0,
): boolean {
  if (prof > 64) return false;
  switch (c.tipo) {
    case 'comparacion':
      return (
        operandoRefiere(c.izquierda, esBloque) ||
        operandoRefiere(c.derecha, esBloque)
      );
    case 'entre':
      return (
        operandoRefiere(c.valor, esBloque) ||
        operandoRefiere(c.desde, esBloque) ||
        operandoRefiere(c.hasta, esBloque)
      );
    case 'y':
    case 'o':
      return c.condiciones.some((x) => condicionRefiere(x, esBloque, prof + 1));
    case 'no':
      return condicionRefiere(c.condicion, esBloque, prof + 1);
    default:
      return false;
  }
}

interface Objetivo {
  bloque?: (id: string) => boolean;
  slide?: (id: string) => boolean;
}

function accionRefiere(a: Accion, o: Objetivo): boolean {
  switch (a.tipo) {
    case 'ir_a_slide':
      return o.slide?.(a.slideId) ?? false;
    case 'mostrar':
    case 'ocultar':
    case 'cambiar_estado':
      return o.bloque?.(a.bloqueId) ?? false;
    case 'asignar_variable':
      return o.bloque !== undefined && operandoRefiere(a.valor, o.bloque);
    default:
      return false;
  }
}

function condicionesRefieren(r: Regla, o: Objetivo): boolean {
  return o.bloque !== undefined && r.condiciones.some((c) => condicionRefiere(c, o.bloque!));
}

/** `true` si la regla menciona el objetivo en una condición o en una acción. */
function reglaRefiere(r: Regla, o: Objetivo): boolean {
  return condicionesRefieren(r, o) || accionesDeRegla(r).some((a) => accionRefiere(a, o));
}

/** Aplica `f` a cada lista de reglas del slide; conserva identidad si nada cambia. */
function mapearReglas<S extends SlideMotor>(
  slide: S,
  f: (reglas: readonly Regla[]) => Regla[],
): S {
  let cambio = false;
  const aplicarLista = (reglas: readonly Regla[] | undefined) => {
    if (!reglas || reglas.length === 0) return reglas;
    const nuevas = f(reglas);
    const igual =
      nuevas.length === reglas.length && nuevas.every((r, i) => r === reglas[i]);
    if (igual) return reglas;
    cambio = true;
    return nuevas;
  };
  const aplicarBloque = (b: Block): Block => {
    const d = aplicarLista(b.disparadores);
    return d === b.disparadores ? b : ({ ...b, disparadores: d } as Block);
  };
  const reglas = aplicarLista(slide.reglas);
  const bloques = slide.bloques?.map(aplicarBloque);
  const capas = slide.capas?.map((c) => ({ ...c, bloques: c.bloques.map(aplicarBloque) }));
  if (!cambio) return slide;
  return {
    ...slide,
    ...(reglas !== undefined ? { reglas } : {}),
    ...(bloques !== undefined ? { bloques } : {}),
    ...(capas !== undefined ? { capas } : {}),
  };
}

// ─── Qué reglas referencian algo (para el aviso previo a borrar) ─────────────

export interface ReferenciaAObjetivo {
  reglaId: string;
  slideId: string;
  bloqueId?: string;
}

/**
 * Reglas AJENAS que mencionan un bloque o un slide. Sirve para el confirm
 * previo («estas interacciones dependen de lo que vas a borrar»). Las reglas
 * que viven EN el bloque (o en el slide) borrado no se listan: se van con él.
 */
export function referenciasA(
  slides: readonly SlideMotor[],
  objetivo: { tipo: 'bloque' | 'slide'; id: string },
): ReferenciaAObjetivo[] {
  const o: Objetivo =
    objetivo.tipo === 'bloque'
      ? { bloque: (id) => id === objetivo.id }
      : { slide: (id) => id === objetivo.id };
  const salida: ReferenciaAObjetivo[] = [];
  for (const { regla, origen } of recolectarReglas(slides)) {
    if (objetivo.tipo === 'bloque' && origen.tipo === 'bloque' && origen.bloqueId === objetivo.id) continue;
    if (objetivo.tipo === 'slide' && origen.slideId === objetivo.id) continue;
    if (!reglaRefiere(regla, o)) continue;
    salida.push({
      reglaId: regla.id,
      slideId: origen.slideId,
      ...(origen.tipo === 'bloque' ? { bloqueId: origen.bloqueId } : {}),
    });
  }
  return salida;
}

// ─── Limpieza al borrar ──────────────────────────────────────────────────────

export interface ResultadoLimpieza<T> {
  /** Estructura ya limpia. Los objetos sin cambios conservan su identidad. */
  resultado: T;
  /** Reglas que se borraron porque su ÚNICO objetivo era lo borrado. */
  eliminadas: string[];
  /**
   * Reglas que quedan DESACTIVADAS (`activa: false`) porque mezclan lo borrado
   * con otra cosa. Siguen marcadas por `reglasConReferenciasRotas` hasta que el
   * docente las corrija o las borre: no se reescribe su significado en silencio.
   */
  desactivadas: string[];
}

function limpiarReglas(
  reglas: readonly Regla[],
  o: Objetivo,
  eliminadas: string[],
  desactivadas: string[],
): Regla[] {
  const salida: Regla[] = [];
  for (const r of reglas) {
    if (!reglaRefiere(r, o)) {
      salida.push(r);
      continue;
    }
    const todas = accionesDeRegla(r);
    const todasMuertas = todas.length > 0 && todas.every((a) => accionRefiere(a, o));
    if (todasMuertas) {
      eliminadas.push(r.id);
      continue;
    }
    if (r.activa) {
      desactivadas.push(r.id);
      salida.push({ ...r, activa: false });
    } else {
      salida.push(r);
    }
  }
  return salida;
}

/**
 * Tras BORRAR un bloque: limpia las reglas del slide que lo mencionan. Hay que
 * llamarla con el slide en el que el bloque ya no está (sus propios
 * `disparadores` se fueron con él).
 */
export function limpiarReferenciasABloque<S extends SlideMotor>(
  slide: S,
  bloqueId: string,
): ResultadoLimpieza<S> {
  const eliminadas: string[] = [];
  const desactivadas: string[] = [];
  const o: Objetivo = { bloque: (id) => id === bloqueId };
  const resultado = mapearReglas(slide, (rs) =>
    limpiarReglas(rs, o, eliminadas, desactivadas),
  );
  return { resultado, eliminadas, desactivadas };
}

/**
 * Tras BORRAR un slide: limpia las reglas de los slides RESTANTES que lo
 * mencionan (`ir_a_slide`). Se le pasan solo los slides que quedan.
 */
export function limpiarReferenciasASlide<S extends SlideMotor>(
  slides: readonly S[],
  slideId: string,
): ResultadoLimpieza<S[]> & { slidesCambiados: string[] } {
  const eliminadas: string[] = [];
  const desactivadas: string[] = [];
  const slidesCambiados: string[] = [];
  const o: Objetivo = { slide: (id) => id === slideId };
  const resultado = slides.map((s) => {
    const n = mapearReglas(s, (rs) => limpiarReglas(rs, o, eliminadas, desactivadas));
    if (n !== s) slidesCambiados.push(s.id);
    return n;
  });
  return { resultado, eliminadas, desactivadas, slidesCambiados };
}

// ─── Duplicar: ids nuevos y remapeo ──────────────────────────────────────────

/** Tablas `idViejo → idNuevo`. Todas opcionales. */
export interface MapaIds {
  bloques?: Readonly<Record<string, string>>;
  capas?: Readonly<Record<string, string>>;
  reglas?: Readonly<Record<string, string>>;
  slides?: Readonly<Record<string, string>>;
}

/**
 * Mapa de ids frescos para TODO lo identificable del slide (bloques, capas y
 * reglas). `nuevoId` lo inyecta quien llama (`crypto.randomUUID` en el editor,
 * un contador en los specs).
 *
 * El id de una regla de plantilla (`tpl:…:<bloqueId>`) se rehace sustituyendo
 * (por segmento `:`) los ids de bloque viejos por los nuevos, así reaplicar la plantilla en la
 * copia sigue siendo idempotente. Si no contiene ningún id de bloque (o el
 * resultado ya existe) se usa `nuevoId()`.
 */
export function generarMapaDeIds(
  slide: SlideMotor,
  nuevoId: () => string,
): Required<Pick<MapaIds, 'bloques' | 'capas' | 'reglas'>> {
  const bloques: Record<string, string> = {};
  const capas: Record<string, string> = {};
  const reglas: Record<string, string> = {};
  for (const b of bloquesDelMotor(slide)) {
    const id = idDeBloque(b);
    if (id !== undefined && !(id in bloques)) bloques[id] = nuevoId();
  }
  for (const c of slide.capas ?? []) capas[c.id] = nuevoId();
  const usados = new Set<string>();
  const todas: Regla[] = [
    ...(slide.reglas ?? []),
    ...bloquesDelMotor(slide).flatMap((b) => b.disparadores ?? []),
  ];
  for (const r of todas) {
    // Por SEGMENTO (separador `:`), no por subcadena: un id de bloque corto
    // («t») no debe pisar otra parte del id («tpl»).
    const id = r.id
      .split(':')
      .map((seg) => (Object.hasOwn(bloques, seg) ? bloques[seg]! : seg))
      .join(':');
    const finalId = id === r.id || usados.has(id) ? nuevoId() : id;
    usados.add(finalId);
    reglas[r.id] = finalId;
  }
  return { bloques, capas, reglas };
}

const m = (tabla: Readonly<Record<string, string>> | undefined, id: string): string =>
  tabla?.[id] ?? id;

function remapOperando(op: Operando, mapa: MapaIds): Operando {
  if (op.tipo === 'estado_bloque' || op.tipo === 'respuesta_correcta') {
    return { ...op, bloqueId: m(mapa.bloques, op.bloqueId) };
  }
  return op;
}

function remapCondicion(c: Condicion, mapa: MapaIds, prof = 0): Condicion {
  if (prof > 64) return c;
  switch (c.tipo) {
    case 'comparacion':
      return {
        ...c,
        izquierda: remapOperando(c.izquierda, mapa),
        derecha: remapOperando(c.derecha, mapa),
      };
    case 'entre':
      return {
        ...c,
        valor: remapOperando(c.valor, mapa),
        desde: remapOperando(c.desde, mapa),
        hasta: remapOperando(c.hasta, mapa),
      };
    case 'y':
    case 'o':
      return { ...c, condiciones: c.condiciones.map((x) => remapCondicion(x, mapa, prof + 1)) };
    case 'no':
      return { ...c, condicion: remapCondicion(c.condicion, mapa, prof + 1) };
    default:
      return c;
  }
}

function remapAccion(a: Accion, mapa: MapaIds): Accion {
  switch (a.tipo) {
    case 'ir_a_slide':
      return { ...a, slideId: m(mapa.slides, a.slideId) };
    case 'mostrar':
    case 'ocultar':
    case 'cambiar_estado':
      return { ...a, bloqueId: m(mapa.bloques, a.bloqueId) };
    case 'abrir_capa':
    case 'cerrar_capa':
      return { ...a, capaId: m(mapa.capas, a.capaId) };
    case 'asignar_variable':
      return { ...a, valor: remapOperando(a.valor, mapa) };
    default:
      return a;
  }
}

function remapRegla(r: Regla, mapa: MapaIds): Regla {
  return {
    ...r,
    id: m(mapa.reglas, r.id),
    condiciones: r.condiciones.map((c) => remapCondicion(c, mapa)),
    acciones: r.acciones.map((a) => remapAccion(a, mapa)),
    ...(r.sino !== undefined ? { sino: r.sino.map((a) => remapAccion(a, mapa)) } : {}),
  };
}

/**
 * Reescribe ids y referencias de un slide según `mapa`. No toca `slide.id`
 * (lo decide quien llama: en una copia, el servidor). Las referencias a ids
 * que el mapa no conoce se dejan tal cual: una regla de la copia que apunta a
 * OTRO slide sigue apuntando a ese slide.
 */
export function remapearIds<S extends SlideMotor>(slide: S, mapa: MapaIds): S {
  const bloque = (b: Block): Block => {
    const id = idDeBloque(b);
    return {
      ...b,
      ...(id !== undefined ? { id: m(mapa.bloques, id) } : {}),
      ...(b.disparadores ? { disparadores: b.disparadores.map((r) => remapRegla(r, mapa)) } : {}),
    } as Block;
  };
  return {
    ...slide,
    ...(slide.bloques ? { bloques: slide.bloques.map(bloque) } : {}),
    ...(slide.capas
      ? {
          capas: slide.capas.map(
            (c): Capa => ({ ...c, id: m(mapa.capas, c.id), bloques: c.bloques.map(bloque) }),
          ),
        }
      : {}),
    ...(slide.reglas ? { reglas: slide.reglas.map((r) => remapRegla(r, mapa)) } : {}),
  };
}

// ─── Pegar ───────────────────────────────────────────────────────────────────

/**
 * Bloque para pegar/duplicar: SIN `disparadores` (copiar una regla a otro
 * bloque con el mismo objetivo es el modo de falla clásico) y con id nuevo.
 * `teniaInteracciones` deja que el editor avise con un toast.
 */
export function bloqueParaPegar(
  origen: Block,
  nuevoId: string,
): { bloque: Block; teniaInteracciones: boolean } {
  const { disparadores, ...resto } = origen;
  return {
    bloque: { ...resto, id: nuevoId } as Block,
    teniaInteracciones: (disparadores?.length ?? 0) > 0,
  };
}
