import { describirEvento, nombreEvento } from '@lumina/interactions';
import type {
  ContextoDescripcion,
  PasoTraza,
  ReglaAplicable,
  ResultadoTraza,
} from '@lumina/interactions';
import type { VariableDef } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

import type { RegistroEvento } from '@/lib/interaction-runtime';
import { tipoDeElemento } from './interacciones';

/**
 * N8 — piezas puras del simulador de reglas («Probar reglas») y de la lista de
 * «Problemas de interacción». Sin React: las prueba `simulador.spec.ts`.
 */

export interface SlideParaNombres {
  id: string;
  titulo?: string;
  bloques?: readonly Block[];
  capas?: readonly { id: string; nombre?: string; bloques: readonly Block[] }[];
}

const idDe = (b: Block): string | undefined => {
  const id = (b as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
};

/**
 * Nombres para `describirRegla` en TODO el mazo: variables, slides («Slide 2 —
 * título»), capas y bloques (por tipo y posición, que es lo que ve el docente).
 */
export function contextoDescripcionMazo(args: {
  variables: readonly VariableDef[];
  slides: readonly SlideParaNombres[];
  etiquetaTipo?: (b: Block) => string;
}): ContextoDescripcion {
  const etiqueta = args.etiquetaTipo ?? ((b: Block) => tipoDeElemento(b));
  const bloques = new Map<string, string>();
  const slides = new Map<string, string>();
  const capas = new Map<string, string>();
  args.slides.forEach((s, i) => {
    slides.set(s.id, s.titulo ? `Slide ${i + 1} — ${s.titulo}` : `Slide ${i + 1}`);
    (s.bloques ?? []).forEach((b, j) => {
      const id = idDe(b);
      if (id !== undefined) bloques.set(id, `${etiqueta(b)} (elemento ${j + 1})`);
    });
    for (const capa of s.capas ?? []) {
      capas.set(capa.id, capa.nombre ?? 'Capa');
      for (const b of capa.bloques) {
        const id = idDe(b);
        if (id !== undefined) bloques.set(id, `${etiqueta(b)} (capa «${capa.nombre ?? 'Capa'}»)`);
      }
    }
  });
  return {
    nombreVariable: (id) => args.variables.find((v) => v.id === id)?.nombre,
    nombreBloque: (id) => bloques.get(id),
    tituloSlide: (id) => slides.get(id),
    nombreCapa: (id) => capas.get(id),
  };
}

/** «Se hace clic en Botón (elemento 2), en Slide 1». */
export function describirEventoRegistrado(
  r: Pick<RegistroEvento, 'evento'>,
  d: ContextoDescripcion,
): string {
  const { evento } = r;
  const base = describirEvento(
    {
      evento: evento.tipo,
      ...(evento.detalle?.variableId !== undefined
        ? { parametro: String(evento.detalle.variableId) }
        : evento.detalle?.tecla !== undefined
          ? { parametro: String(evento.detalle.tecla) }
          : evento.detalle?.segundos !== undefined
            ? { parametro: Number(evento.detalle.segundos) }
            : {}),
    },
    d,
  );
  const donde = [
    evento.bloqueId !== undefined ? (d.nombreBloque(evento.bloqueId) ?? '(eliminado)') : null,
    evento.slideId !== undefined ? (d.tituloSlide(evento.slideId) ?? null) : null,
  ].filter((x): x is string => x !== null);
  const texto = base.charAt(0).toUpperCase() + base.slice(1);
  return donde.length > 0 ? `${texto} · ${donde.join(' · ')}` : texto || nombreEvento(evento.tipo);
}

/** Resultados que el docente quiere ver siempre; el resto, bajo demanda. */
const RELEVANTES: ReadonlySet<ResultadoTraza> = new Set<ResultadoTraza>([
  'disparada',
  'sino',
  'no_cumple',
  'condicion_rota',
  'ciclo_cortado',
]);

export function pasosVisibles(
  r: Pick<RegistroEvento, 'pasos'>,
  verTodos: boolean,
): PasoTraza[] {
  return verTodos ? r.pasos : r.pasos.filter((p) => RELEVANTES.has(p.resultado));
}

export const ETIQUETA_RESULTADO: Readonly<Record<ResultadoTraza, string>> = {
  disparada: 'Se disparó',
  sino: 'Corrió «si no»',
  no_cumple: 'No se cumplió',
  condicion_rota: 'Condición rota',
  inactiva: 'Desactivada',
  no_coincide: 'No coincide',
  ciclo_cortado: 'Ciclo cortado',
};

/** Índice de reglas por id, para pintar la descripción de cada paso. */
export function reglasPorId(reglas: readonly ReglaAplicable[]): Map<string, ReglaAplicable> {
  const m = new Map<string, ReglaAplicable>();
  for (const r of reglas) if (!m.has(r.regla.id)) m.set(r.regla.id, r);
  return m;
}

/** Máximo de eventos que el simulador conserva (los más recientes). */
export const MAX_REGISTROS = 200;

export function agregarRegistro(
  lista: readonly RegistroEvento[],
  nuevo: RegistroEvento,
): RegistroEvento[] {
  const out = [...lista, nuevo];
  return out.length > MAX_REGISTROS ? out.slice(out.length - MAX_REGISTROS) : out;
}
