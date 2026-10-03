import {
  bloqueIdsReferenciados,
  describirRegla as describirReglaPuro,
  duplicarRegla,
  fusionarReglas,
  guardarEnLista,
  moverEnLista,
  plantillaBotonNavega,
  plantillaIrARefuerzo,
  plantillaRevelarAlVisitarTodo,
} from '@lumina/interactions';
import type {
  ContextoDescripcion,
  DestinoNavegacion,
  ResultadoPlantilla,
} from '@lumina/interactions';
import { asegurarIdBloque } from '@lumina/editor-shared/block-id';
import type { Capa, Regla, VariableDef } from '@lumina/types/interaction';
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

/**
 * Tipo de `ElementDefinition` de un bloque: las actividades se registran por el
 * `tipo` de su actividad (`verdadero_falso`, `quiz_multiple`…), no por `'actividad'`.
 */
export function tipoDeElemento(b: Block): string {
  if (b.tipo === 'actividad') {
    return (b as { actividad?: { tipo?: string } }).actividad?.tipo ?? 'actividad';
  }
  return b.tipo;
}

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

  const objetivoRevelado = p.tipo === 'revelar' ? idDe(conIds[p.objetivoIndex]!) : undefined;
  return conIds.map((b0, i) => {
    // N3: «revelar» solo tiene sentido si el objetivo empieza oculto (K8a ya lo permite).
    const b =
      objetivoRevelado !== undefined && idDe(b0) === objetivoRevelado
        ? ({ ...b0, ocultoInicial: true } as Block)
        : b0;
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

// ─── Constructor (N3) ────────────────────────────────────────────────────────

export interface OpcionesGuardarRegla {
  /** Id con el que la regla estaba guardada (si se está editando y el id cambió). */
  idAnterior?: string;
  /** Bloques que deben empezar ocultos (el objetivo de un «mostrar»). */
  ocultarAlEmpezar?: readonly string[];
}

/**
 * Bloques de primer nivel con un id candidato: los que ya tenían id lo conservan
 * y a los demás se les asigna uno. El constructor ofrece ESTOS ids como destinos;
 * `guardarRegla` solo persiste los que la regla realmente nombra.
 */
export function conIdsCandidatos(bloques: readonly Block[]): Block[] {
  return bloques.map((b) => asegurarIdBloque(b));
}

/**
 * Guarda una regla armada en el constructor en `disparadores` del bloque dueño.
 * `candidatos` es `conIdsCandidatos(bloques)`. El dueño y los bloques que la regla
 * nombra reciben su id (D8-a); el resto de bloques queda EXACTAMENTE como estaba.
 * Reemplaza por id (o `idAnterior`): no duplica.
 */
export function guardarRegla(
  bloques: readonly Block[],
  candidatos: readonly Block[],
  ownerIndex: number,
  regla: Regla,
  opciones: OpcionesGuardarRegla = {},
): Block[] {
  const nombrados = new Set(bloqueIdsReferenciados(regla));
  const ocultar = new Set(opciones.ocultarAlEmpezar ?? []);
  return bloques.map((original, i) => {
    const cand = candidatos[i] ?? original;
    const idCand = idDe(cand);
    const participa = i === ownerIndex || (idCand !== undefined && nombrados.has(idCand));
    let out = participa ? cand : original;
    if (idCand !== undefined && ocultar.has(idCand) && idDe(out) !== undefined) {
      out = { ...out, ocultoInicial: true } as Block;
    }
    if (i === ownerIndex) {
      out = { ...out, disparadores: guardarEnLista(out.disparadores, regla, opciones.idAnterior) } as Block;
    }
    return out;
  });
}

/** Copia de la regla justo después de la original, con id propio. */
export function duplicarReglaDeBloque(
  bloques: readonly Block[],
  ownerIndex: number,
  reglaId: string,
  idNuevo: string,
): Block[] {
  return bloques.map((b, i) => {
    if (i !== ownerIndex) return b;
    const reglas = b.disparadores ?? [];
    const k = reglas.findIndex((r) => r.id === reglaId);
    if (k < 0) return b;
    const copia = duplicarRegla(reglas[k]!, idNuevo);
    return { ...b, disparadores: [...reglas.slice(0, k + 1), copia, ...reglas.slice(k + 1)] } as Block;
  });
}

/** Las reglas de un bloque se ejecutan en el orden del arreglo: este lo cambia. */
export function moverReglaDeBloque(
  bloques: readonly Block[],
  ownerIndex: number,
  reglaId: string,
  delta: -1 | 1,
): Block[] {
  return bloques.map((b, i) => {
    if (i !== ownerIndex) return b;
    const reglas = b.disparadores ?? [];
    const k = reglas.findIndex((r) => r.id === reglaId);
    if (k < 0) return b;
    return { ...b, disparadores: moverEnLista(reglas, k, k + delta) } as Block;
  });
}

// ─── Texto para el docente ───────────────────────────────────────────────────

/**
 * Contexto de nombres para `describirRegla`: variables, bloques (por posición y
 * tipo, que es lo que ve el docente en el lienzo), slides y capas.
 */
export function crearContextoDescripcion(args: {
  variables: readonly VariableDef[];
  bloques: readonly Block[];
  capas?: readonly Pick<Capa, 'id' | 'nombre'>[];
  slidesDelMazo: readonly { id: string; titulo: string }[];
  /** Nombre legible del tipo de bloque (p. ej. «Botón»). */
  etiquetaTipo?: (b: Block) => string;
}): ContextoDescripcion {
  const etiqueta = args.etiquetaTipo ?? ((b: Block) => tipoDeElemento(b));
  return {
    nombreVariable: (id) => args.variables.find((v) => v.id === id)?.nombre,
    nombreBloque: (id) => {
      const i = args.bloques.findIndex((x) => idDe(x) === id);
      return i < 0 ? undefined : `${etiqueta(args.bloques[i]!)} (elemento ${i + 1})`;
    },
    tituloSlide: (id) => args.slidesDelMazo.find((s) => s.id === id)?.titulo,
    nombreCapa: (id) => args.capas?.find((c) => c.id === id)?.nombre,
  };
}

export function describirRegla(r: Regla, ctx: ContextoDescripcion): string {
  return describirReglaPuro(r, ctx);
}
