import type { Accion, Regla, VariableDef } from '@lumina/types/interaction';

/**
 * Plantillas de reglas (K7b). v1 NO ofrece un constructor libre: el docente
 * elige una plantilla y completa los huecos. Cada plantilla es una función PURA
 * que devuelve las reglas (con el bloque dueño de cada una) y las variables que
 * necesita.
 *
 * Ids deterministas: el id de cada regla se deriva de la plantilla y de los ids
 * de bloque que intervienen, así reaplicar la plantilla REEMPLAZA la regla (ver
 * `fusionarReglas`) en vez de duplicarla.
 *
 * Pendiente (K8a): «Mostrar una pista tras N intentos fallidos». Necesita que
 * el renderer pueda ocultar bloques al empezar; sin eso «mostrar» no tiene
 * efecto visible. No se entrega en K7b.
 */

/** Una regla y el bloque en cuyos `disparadores` debe vivir. */
export interface ReglaDeBloque {
  bloqueId: string;
  regla: Regla;
}

export interface ResultadoPlantilla {
  reglas: ReglaDeBloque[];
  variables: VariableDef[];
}

/** Destino de «Un botón que lleva a…». */
export type DestinoNavegacion =
  | { tipo: 'slide'; slideId: string }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' };

export const PLANTILLAS = {
  botonNavega: 'boton-navega',
  irARefuerzo: 'refuerzo',
  revelarAlVisitarTodo: 'revelar',
} as const;

/** Id determinista de una regla de plantilla. */
export function idReglaDePlantilla(
  plantilla: string,
  ...partes: readonly string[]
): string {
  return ['tpl', plantilla, ...partes].join(':');
}

/** `true` si la regla salió de una plantilla (para mostrarla con su nombre). */
export function plantillaDeRegla(reglaId: string): string | null {
  const [pref, plantilla] = reglaId.split(':');
  return pref === 'tpl' && plantilla ? plantilla : null;
}

function accionDeDestino(destino: DestinoNavegacion): Accion {
  switch (destino.tipo) {
    case 'slide':
      return { tipo: 'ir_a_slide', slideId: destino.slideId };
    case 'siguiente':
      return { tipo: 'siguiente' };
    case 'anterior':
      return { tipo: 'anterior' };
  }
}

/** «Un botón que lleva a otro slide»: `clic → ir_a_slide | siguiente | anterior`. */
export function plantillaBotonNavega(args: {
  bloqueId: string;
  destino: DestinoNavegacion;
}): ResultadoPlantilla {
  return {
    variables: [],
    reglas: [
      {
        bloqueId: args.bloqueId,
        regla: {
          id: idReglaDePlantilla(PLANTILLAS.botonNavega, args.bloqueId),
          evento: 'clic',
          condiciones: [],
          acciones: [accionDeDestino(args.destino)],
          activa: true,
        },
      },
    ],
  };
}

/**
 * «Ir a un slide de refuerzo si falla»: en la actividad,
 * `respuesta_incorrecta → ir_a_slide(refuerzo)`.
 */
export function plantillaIrARefuerzo(args: {
  bloqueId: string;
  slideRefuerzoId: string;
}): ResultadoPlantilla {
  return {
    variables: [],
    reglas: [
      {
        bloqueId: args.bloqueId,
        regla: {
          id: idReglaDePlantilla(PLANTILLAS.irARefuerzo, args.bloqueId),
          evento: 'respuesta_incorrecta',
          condiciones: [],
          acciones: [{ tipo: 'ir_a_slide', slideId: args.slideRefuerzoId }],
          activa: true,
        },
      },
    ],
  };
}

/**
 * «Revelar al visitar todo»: en CADA hotspot elegido,
 * `visitado → mostrar(objetivo)` solo si TODOS los hotspots están visitados
 * (las condiciones se combinan con Y implícito). El motor sincroniza el estado
 * del hotspot antes de evaluar, así el último en visitarse dispara la regla.
 */
export function plantillaRevelarAlVisitarTodo(args: {
  hotspotIds: readonly string[];
  objetivoId: string;
}): ResultadoPlantilla {
  const hotspots = [...new Set(args.hotspotIds)].filter(
    (id) => id !== '' && id !== args.objetivoId,
  );
  if (hotspots.length === 0 || args.objetivoId === '') {
    return { reglas: [], variables: [] };
  }
  return {
    variables: [],
    reglas: hotspots.map((h) => ({
      bloqueId: h,
      regla: {
        id: idReglaDePlantilla(PLANTILLAS.revelarAlVisitarTodo, args.objetivoId, h),
        evento: 'visitado' as const,
        condiciones: hotspots.map((otro) => ({
          tipo: 'comparacion' as const,
          operador: '==' as const,
          izquierda: { tipo: 'estado_bloque' as const, bloqueId: otro },
          derecha: { tipo: 'literal' as const, valor: 'visitado' },
        })),
        acciones: [{ tipo: 'mostrar' as const, bloqueId: args.objetivoId }],
        activa: true,
      },
    })),
  };
}

/**
 * Upsert por id: la regla nueva reemplaza a la existente en su misma posición;
 * las que no existían se agregan al final. Reaplicar una plantilla no duplica.
 */
export function fusionarReglas(
  existentes: readonly Regla[] | undefined,
  nuevas: readonly Regla[],
): Regla[] {
  const porId = new Map(nuevas.map((r) => [r.id, r]));
  const usadas = new Set<string>();
  const salida: Regla[] = (existentes ?? []).map((r) => {
    const n = porId.get(r.id);
    if (n) usadas.add(r.id);
    return n ?? r;
  });
  for (const r of nuevas) if (!usadas.has(r.id)) salida.push(r);
  return salida;
}
