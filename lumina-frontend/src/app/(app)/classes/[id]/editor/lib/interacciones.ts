import {
  fusionarReglas,
  plantillaBotonNavega,
  plantillaIrARefuerzo,
  plantillaRevelarAlVisitarTodo,
} from '@lumina/interactions';
import type { DestinoNavegacion, ResultadoPlantilla } from '@lumina/interactions';
import { asegurarIdBloque } from '@lumina/editor-shared/block-id';
import type { Accion, EventoTipo, Regla } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

/**
 * Aplicar y editar interacciones sobre `Slide.bloques` (K7b). Pura: recibe los
 * bloques de primer nivel del slide y devuelve los nuevos. Solo los bloques de
 * primer nivel pueden ser dueños de reglas (como en `recolectarReglas`).
 */

export type PlantillaElegida =
  | { tipo: 'boton-navega'; evento: 'clic' | 'fin_contador'; destino: DestinoNavegacion }
  | { tipo: 'refuerzo'; slideRefuerzoId: string }
  | { tipo: 'revelar'; hotspotIndices: readonly number[]; objetivoIndex: number };

const idDe = (b: Block): string | undefined => {
  const id = (b as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
};

/** Bloques que ya no deben llevar la acción legada equivalente (evita navegar dos veces). */
function sinAccionLegada(b: Block): Block {
  if (b.tipo === 'boton') {
    const a = (b as { accion?: string }).accion;
    if (a === 'siguiente' || a === 'anterior' || a === 'ir_a') {
      return { ...b, accion: 'ninguna' } as Block;
    }
  }
  if (b.tipo === 'contador' && (b as { alTerminar?: string }).alTerminar === 'siguiente') {
    return { ...b, alTerminar: 'ninguna' } as Block;
  }
  return b;
}

/**
 * Aplica una plantilla con el bloque `ownerIndex` como dueño. Asigna ids
 * estables (D8-a) a los bloques que intervienen y reparte las reglas en sus
 * `disparadores`; reaplicar la misma plantilla reemplaza la regla, no la duplica.
 */
export function aplicarPlantilla(
  bloques: readonly Block[],
  ownerIndex: number,
  p: PlantillaElegida,
): Block[] {
  const involucrados = new Set<number>([ownerIndex]);
  if (p.tipo === 'revelar') {
    p.hotspotIndices.forEach((i) => involucrados.add(i));
    involucrados.add(p.objetivoIndex);
  }
  const conIds = bloques.map((b, i) => (involucrados.has(i) ? asegurarIdBloque(b) : b));
  const id = (i: number): string => idDe(conIds[i]!) ?? '';

  let r: ResultadoPlantilla;
  switch (p.tipo) {
    case 'boton-navega':
      r = plantillaBotonNavega({ bloqueId: id(ownerIndex), destino: p.destino, evento: p.evento });
      break;
    case 'refuerzo':
      r = plantillaIrARefuerzo({ bloqueId: id(ownerIndex), slideRefuerzoId: p.slideRefuerzoId });
      break;
    case 'revelar':
      r = plantillaRevelarAlVisitarTodo({
        hotspotIds: p.hotspotIndices.map(id),
        objetivoId: id(p.objetivoIndex),
      });
      break;
  }

  return conIds.map((b, i) => {
    const propias = r.reglas.filter((x) => x.bloqueId === idDe(b)).map((x) => x.regla);
    if (propias.length === 0) return b;
    const base = p.tipo === 'boton-navega' && i === ownerIndex ? sinAccionLegada(b) : b;
    return { ...base, disparadores: fusionarReglas(base.disparadores, propias) } as Block;
  });
}

function conDisparadores(b: Block, reglas: Regla[]): Block {
  if (reglas.length > 0) return { ...b, disparadores: reglas } as Block;
  const { disparadores: _omit, ...resto } = b;
  void _omit;
  return resto as Block;
}

export function quitarRegla(bloques: readonly Block[], ownerIndex: number, reglaId: string): Block[] {
  return bloques.map((b, i) =>
    i === ownerIndex
      ? conDisparadores(b, (b.disparadores ?? []).filter((r) => r.id !== reglaId))
      : b,
  );
}

export function alternarRegla(
  bloques: readonly Block[],
  ownerIndex: number,
  reglaId: string,
  activa: boolean,
): Block[] {
  return bloques.map((b, i) =>
    i === ownerIndex
      ? conDisparadores(
          b,
          (b.disparadores ?? []).map((r) => (r.id === reglaId ? { ...r, activa } : r)),
        )
      : b,
  );
}

// ─── Texto para el docente ───────────────────────────────────────────────────

const EVENTOS: Record<EventoTipo, string> = {
  clic: 'Al hacer clic',
  visitado: 'Al visitarlo',
  seleccionado: 'Al seleccionarlo',
  respuesta_correcta: 'Si responde bien',
  respuesta_incorrecta: 'Si responde mal',
  fin_contador: 'Al terminar el contador',
  al_entrar_slide: 'Al entrar al slide',
};

export function describirAccion(
  a: Accion,
  tituloSlide: (id: string) => string,
  nombreBloque: (id: string) => string,
): string {
  switch (a.tipo) {
    case 'ir_a_slide':
      return `ir a ${tituloSlide(a.slideId)}`;
    case 'siguiente':
      return 'ir al siguiente slide';
    case 'anterior':
      return 'volver al slide anterior';
    case 'mostrar':
      return `mostrar ${nombreBloque(a.bloqueId)}`;
    case 'ocultar':
      return `ocultar ${nombreBloque(a.bloqueId)}`;
    case 'cambiar_estado':
      return `poner ${nombreBloque(a.bloqueId)} en «${a.estado}»`;
    case 'abrir_capa':
      return 'abrir una capa';
    case 'cerrar_capa':
      return 'cerrar una capa';
    case 'asignar_variable':
      return 'asignar una variable';
    case 'sumar_variable':
      return `sumar ${a.cantidad} a una variable`;
  }
}

export function describirRegla(
  r: Regla,
  tituloSlide: (id: string) => string,
  nombreBloque: (id: string) => string,
): string {
  const cond = r.condiciones.length > 0 ? ' (si se cumple la condición)' : '';
  const acciones = r.acciones.map((a) => describirAccion(a, tituloSlide, nombreBloque)).join(', ');
  return `${EVENTOS[r.evento]}${cond} → ${acciones || 'sin acciones'}`;
}
