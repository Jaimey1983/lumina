import type { FlipCardsWidget } from '@/types/slide.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';

export { alineacionToCss };

export type FlipCardsCaraLado = 'frente' | 'reverso';

export type FlipCardsAlineacion = 'izquierda' | 'centro' | 'derecha';

export interface FlipCardsCaraConfig {
  mostrarImagen: boolean;
  mostrarTitulo: boolean;
  mostrarCuerpo: boolean;
}

export type FlipCardsPlantillaId =
  | 'clasico'
  | 'minimal'
  | 'contraste'
  | 'oceano'
  | 'atardecer'
  | 'bosque'
  | 'foco-imagen'
  | 'solo-texto';

const PLANTILLA_IDS: FlipCardsPlantillaId[] = [
  'clasico',
  'minimal',
  'contraste',
  'oceano',
  'atardecer',
  'bosque',
  'foco-imagen',
  'solo-texto',
];

export function coerceFlipCardsPlantillaId(id?: string): FlipCardsPlantillaId {
  if (id && PLANTILLA_IDS.includes(id as FlipCardsPlantillaId)) {
    return id as FlipCardsPlantillaId;
  }
  return 'clasico';
}

export interface FlipCardsConfiguracionCompleta {
  plantillaId: FlipCardsPlantillaId;
  espacioEntreTarjetas: number;
  paddingContenedor: number;
  columnas: 2 | 3 | 4;
  colorFondoContenedor: string;
  opacidadFondoContenedor: number;
  colorFrente: string;
  colorReverso: string;
  bordeTarjetaGrosor: number;
  bordeTarjetaColor: string;
  bordeTarjetaRadio: number;
  sombraTarjeta: boolean;
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion: FlipCardsAlineacion;
  mostrarBotonAnterior: boolean;
  mostrarBotonSiguiente: boolean;
  frente: FlipCardsCaraConfig;
  reverso: FlipCardsCaraConfig;
}

export type FlipCardsInnerSelection =
  | { kind: 'widget' }
  | { kind: 'header-text'; field: 'tituloWidget' | 'subtituloWidget' | 'instruccion' }
  | { kind: 'card'; cardId: string; face: FlipCardsCaraLado }
  | { kind: 'card-text'; cardId: string; face: FlipCardsCaraLado; field: 'titulo' | 'cuerpo' }
  | { kind: 'card-image'; cardId: string; face: FlipCardsCaraLado };

const DEFAULT_CARA: FlipCardsCaraConfig = {
  mostrarImagen: true,
  mostrarTitulo: true,
  mostrarCuerpo: true,
};

export const DEFAULT_FLIP_CARDS_CONFIG: FlipCardsConfiguracionCompleta = {
  plantillaId: 'clasico',
  espacioEntreTarjetas: 12,
  paddingContenedor: 16,
  columnas: 3,
  colorFondoContenedor: '#F8FAFC',
  opacidadFondoContenedor: 100,
  colorFrente: '#FFFFFF',
  colorReverso: '#2563EB',
  bordeTarjetaGrosor: 1,
  bordeTarjetaColor: '#E2E8F0',
  bordeTarjetaRadio: 8,
  sombraTarjeta: false,
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  mostrarBotonAnterior: true,
  mostrarBotonSiguiente: true,
  frente: { ...DEFAULT_CARA },
  reverso: { ...DEFAULT_CARA },
};

/** Normaliza bloques guardados con el esquema anterior (`mostrarNavegacion` sin sub-secciones). */
export function normalizeFlipCardsWidget(block: FlipCardsWidget): FlipCardsWidget {
  const raw = block.configuracion as FlipCardsWidget['configuracion'] & {
    opacidadFondoContenedor?: number;
    bordeTarjetaGrosor?: number;
    bordeTarjetaColor?: string;
    bordeTarjetaRadio?: number;
    sombraTarjeta?: boolean;
    alineacionInstruccion?: FlipCardsAlineacion;
    mostrarBotonAnterior?: boolean;
    mostrarBotonSiguiente?: boolean;
    plantillaId?: FlipCardsPlantillaId;
    espacioEntreTarjetas?: number;
    paddingContenedor?: number;
    frente?: Partial<FlipCardsCaraConfig>;
    reverso?: Partial<FlipCardsCaraConfig>;
  };

  const navLegacy = raw.mostrarNavegacion ?? true;

  return {
    ...block,
    configuracion: {
      ...DEFAULT_FLIP_CARDS_CONFIG,
      ...raw,
      opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
      bordeTarjetaGrosor: raw.bordeTarjetaGrosor ?? 1,
      bordeTarjetaColor: raw.bordeTarjetaColor ?? '#E2E8F0',
      bordeTarjetaRadio: raw.bordeTarjetaRadio ?? 8,
      sombraTarjeta: raw.sombraTarjeta ?? false,
      alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
      mostrarBotonAnterior: raw.mostrarBotonAnterior ?? navLegacy,
      mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? navLegacy,
      plantillaId: coerceFlipCardsPlantillaId(raw.plantillaId),
      espacioEntreTarjetas: raw.espacioEntreTarjetas ?? 12,
      paddingContenedor: raw.paddingContenedor ?? 16,
      frente: { ...DEFAULT_CARA, ...raw.frente },
      reverso: { ...DEFAULT_CARA, ...raw.reverso },
    },
  };
}

export function flipCardsPerPage(columnas: number): number {
  return columnas * 2;
}
