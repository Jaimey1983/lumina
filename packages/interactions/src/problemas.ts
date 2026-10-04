import type { Accion, EventoTipo, VariableDef } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';
import { idDeBloque } from './bloques.js';
import { EVENTOS_DE_ENTORNO } from './eventos.js';
import { reglasConReferenciasRotas } from './integridad.js';
import type { SlideMotor } from './integridad.js';
import { recolectarReglas, recorrerBloquesDeSlide } from './recolectar.js';
import { accionesDeRegla } from './reglas.js';
import type { ReglaAplicable } from './tipos.js';
import { usosDeVariable } from './uso.js';

/**
 * N8 — «Problemas de interacción»: lo que el editor le avisa al docente SIN
 * bloquear el guardado (como K7b). PURO: no toca el DOM ni la red.
 *
 * Los mensajes no llevan ids ni nombres (los ids no le dicen nada al docente):
 * quien pinta la lista agrega el nombre del bloque/regla con `reglaId`,
 * `bloqueId` y `variableId`, y salta al lugar con `slideId` + `bloqueId`.
 */

export type CodigoProblema =
  | 'referencia_rota'
  | 'evento_imposible'
  | 'variable_sin_uso'
  | 'ciclo_potencial';

export interface ProblemaInteraccion {
  codigo: CodigoProblema;
  /** `error`: la regla no puede funcionar. `aviso`: puede ser a propósito. */
  severidad: 'error' | 'aviso';
  mensaje: string;
  slideId?: string;
  bloqueId?: string;
  reglaId?: string;
  variableId?: string;
}

export interface OpcionesProblemas {
  /** Eventos que emite un bloque (los declara su `ElementDefinition`). */
  eventosDeBloque(bloque: Block): readonly EventoTipo[];
  /** Variables usadas dentro de textos (`{{var:id}}`): no cuentan como «sin uso». */
  variablesEnTexto?: ReadonlySet<string>;
}

// ─── Eventos imposibles ──────────────────────────────────────────────────────

function eventosImposibles(
  slides: readonly SlideMotor[],
  aplicables: readonly ReglaAplicable[],
  opciones: OpcionesProblemas,
): ProblemaInteraccion[] {
  const porSlide = new Map<string, Set<EventoTipo>>();
  const porBloque = new Map<string, readonly EventoTipo[]>();
  for (const s of slides) {
    const del = new Set<EventoTipo>();
    recorrerBloquesDeSlide(s, (b) => {
      const evs = opciones.eventosDeBloque(b);
      for (const e of evs) del.add(e);
      const id = idDeBloque(b);
      if (id !== undefined) porBloque.set(id, evs);
    });
    porSlide.set(s.id, del);
  }
  const salida: ProblemaInteraccion[] = [];
  for (const { regla, origen } of aplicables) {
    if (!regla.activa || EVENTOS_DE_ENTORNO.includes(regla.evento)) continue;
    if (origen.tipo === 'bloque') {
      const evs = porBloque.get(origen.bloqueId);
      // Bloque inexistente: ya lo cuenta `referencia_rota`.
      if (evs === undefined || evs.includes(regla.evento)) continue;
      salida.push({
        codigo: 'evento_imposible',
        severidad: 'error',
        mensaje: 'Este elemento nunca emite ese evento: la regla no se va a disparar.',
        slideId: origen.slideId,
        bloqueId: origen.bloqueId,
        reglaId: regla.id,
      });
    } else {
      if (regla.evento === 'al_entrar_slide') continue;
      if (porSlide.get(origen.slideId)?.has(regla.evento)) continue;
      salida.push({
        codigo: 'evento_imposible',
        severidad: 'error',
        mensaje: 'Ningún elemento de este slide emite ese evento: la regla no se va a disparar.',
        slideId: origen.slideId,
        reglaId: regla.id,
      });
    }
  }
  return salida;
}

// ─── Variables sin uso ───────────────────────────────────────────────────────

function variablesSinUso(
  aplicables: readonly ReglaAplicable[],
  variables: readonly VariableDef[],
  enTexto: ReadonlySet<string> | undefined,
): ProblemaInteraccion[] {
  return variables
    .filter((v) => !enTexto?.has(v.id) && usosDeVariable(aplicables, v.id).length === 0)
    .map((v) => ({
      codigo: 'variable_sin_uso' as const,
      severidad: 'aviso' as const,
      mensaje: 'Ninguna regla ni texto usa esta variable.',
      variableId: v.id,
    }));
}

// ─── Ciclos potenciales ──────────────────────────────────────────────────────

/** Variables que una acción puede cambiar. */
function variableDeAccion(a: Accion): string | undefined {
  switch (a.tipo) {
    case 'asignar_variable':
    case 'sumar_variable':
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable':
    case 'limpiar_variable':
    case 'concatenar_variable':
    case 'alternar_variable':
      return a.variableId;
    default:
      return undefined;
  }
}

/** ¿La regla `a` puede, con alguna de sus acciones, encadenar a la regla `b`? */
function encadena(a: ReglaAplicable, b: ReglaAplicable): boolean {
  for (const acc of accionesDeRegla(a.regla)) {
    const v = variableDeAccion(acc);
    if (v !== undefined && b.regla.evento === 'cambio_variable' && b.regla.parametro === v) {
      return true;
    }
    if (acc.tipo === 'cambiar_estado') {
      const ev: EventoTipo | undefined =
        acc.estado === 'visitado' ? 'visitado' : acc.estado === 'seleccionado' ? 'seleccionado' : undefined;
      if (ev === undefined || b.regla.evento !== ev) continue;
      if (b.origen.tipo === 'bloque' ? b.origen.bloqueId === acc.bloqueId : true) return true;
    }
  }
  return false;
}

/** Reglas que forman parte de un ciclo del grafo «puede encadenar a» (Tarjan). */
function reglasEnCiclo(aplicables: readonly ReglaAplicable[]): ReglaAplicable[] {
  const activas = aplicables.filter((r) => r.regla.activa);
  const aristas = activas.map((a) =>
    activas.flatMap((b, j) => (encadena(a, b) ? [j] : [])),
  );
  const indice = new Array<number>(activas.length).fill(-1);
  const bajo = new Array<number>(activas.length).fill(0);
  const enPila = new Array<boolean>(activas.length).fill(false);
  const pila: number[] = [];
  const enCiclo = new Set<number>();
  let contador = 0;

  const visitar = (v: number): void => {
    indice[v] = bajo[v] = contador++;
    pila.push(v);
    enPila[v] = true;
    for (const w of aristas[v] ?? []) {
      if (indice[w] === -1) {
        visitar(w);
        bajo[v] = Math.min(bajo[v] as number, bajo[w] as number);
      } else if (enPila[w]) {
        bajo[v] = Math.min(bajo[v] as number, indice[w] as number);
      }
    }
    if (bajo[v] === indice[v]) {
      const comp: number[] = [];
      let w: number;
      do {
        w = pila.pop() as number;
        enPila[w] = false;
        comp.push(w);
      } while (w !== v);
      // Un componente de 1 solo cuenta si se encadena a sí mismo.
      if (comp.length > 1 || (aristas[v] ?? []).includes(v)) comp.forEach((i) => enCiclo.add(i));
    }
  };
  for (let i = 0; i < activas.length; i++) if (indice[i] === -1) visitar(i);
  return activas.filter((_, i) => enCiclo.has(i));
}

function ciclos(aplicables: readonly ReglaAplicable[]): ProblemaInteraccion[] {
  return reglasEnCiclo(aplicables).map(({ regla, origen }) => ({
    codigo: 'ciclo_potencial' as const,
    severidad: 'aviso' as const,
    mensaje:
      'Esta regla puede volver a dispararse a través de sus propios cambios. El motor corta el ciclo, pero conviene revisar las condiciones.',
    slideId: origen.slideId,
    ...(origen.tipo === 'bloque' ? { bloqueId: origen.bloqueId } : {}),
    reglaId: regla.id,
  }));
}

/**
 * Problemas del mazo, en este orden: errores (referencias rotas, eventos que
 * nadie emite) y luego avisos (ciclos, variables sin uso). Un mazo sano da `[]`.
 */
export function problemasDeInteraccion(
  slides: readonly SlideMotor[],
  variables: readonly VariableDef[],
  opciones: OpcionesProblemas,
): ProblemaInteraccion[] {
  const aplicables = recolectarReglas(slides);
  const rotas: ProblemaInteraccion[] = reglasConReferenciasRotas(slides, variables).map((r) => ({
    codigo: 'referencia_rota',
    severidad: 'error',
    mensaje: r.mensaje,
    slideId: r.slideId,
    ...(r.bloqueId !== undefined ? { bloqueId: r.bloqueId } : {}),
    reglaId: r.reglaId,
  }));
  return [
    ...rotas,
    ...eventosImposibles(slides, aplicables, opciones),
    ...ciclos(aplicables),
    ...variablesSinUso(aplicables, variables, opciones.variablesEnTexto),
  ];
}
