import type { FlipCardsCampoEstilo, FlipCardsWidget } from '@/types/slide.types';

import {
  coerceFlipCardsPlantillaId,
  DEFAULT_FLIP_CARDS_CONFIG,
  normalizeFlipCardsWidget,
  type FlipCardsCaraConfig,
  type FlipCardsConfiguracionCompleta,
  type FlipCardsPlantillaId,
} from './flip-cards-config';

export interface FlipCardsPlantillaDef {
  id: FlipCardsPlantillaId;
  label: string;
  description: string;
  configuracion: Partial<FlipCardsConfiguracionCompleta> & {
    frente?: Partial<FlipCardsCaraConfig>;
    reverso?: Partial<FlipCardsCaraConfig>;
  };
  estilosHeader?: {
    tituloWidget?: FlipCardsCampoEstilo;
    subtituloWidget?: FlipCardsCampoEstilo;
    instruccion?: FlipCardsCampoEstilo;
  };
}

export const FLIP_CARDS_PLANTILLAS: FlipCardsPlantillaDef[] = [
  {
    id: 'clasico',
    label: 'Clásico',
    description: 'Fondo claro, reverso azul y bordes suaves.',
    configuracion: { ...DEFAULT_FLIP_CARDS_CONFIG },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Grises neutros, sin sombra, aspecto limpio.',
    configuracion: {
      colorFondoContenedor: '#FFFFFF',
      opacidadFondoContenedor: 100,
      colorFrente: '#FAFAFA',
      colorReverso: '#E2E8F0',
      bordeTarjetaGrosor: 1,
      bordeTarjetaColor: '#CBD5E1',
      bordeTarjetaRadio: 4,
      sombraTarjeta: false,
      columnas: 3,
    },
    estilosHeader: {
      tituloWidget: { color: '#0f172a' },
      subtituloWidget: { color: '#64748b' },
    },
  },
  {
    id: 'contraste',
    label: 'Contraste',
    description: 'Contenedor oscuro y reverso ámbar vibrante.',
    configuracion: {
      colorFondoContenedor: '#0F172A',
      opacidadFondoContenedor: 100,
      colorFrente: '#FFFFFF',
      colorReverso: '#F59E0B',
      bordeTarjetaGrosor: 0,
      bordeTarjetaColor: '#334155',
      bordeTarjetaRadio: 10,
      sombraTarjeta: true,
      columnas: 2,
    },
    estilosHeader: {
      tituloWidget: { color: '#F8FAFC' },
      subtituloWidget: { color: '#94A3B8' },
      instruccion: { color: '#CBD5E1' },
    },
  },
  {
    id: 'oceano',
    label: 'Océano',
    description: 'Tonos azul-verde, ideal para contenido formativo.',
    configuracion: {
      colorFondoContenedor: '#ECFEFF',
      colorFrente: '#FFFFFF',
      colorReverso: '#0D9488',
      bordeTarjetaGrosor: 1,
      bordeTarjetaColor: '#99F6E4',
      bordeTarjetaRadio: 12,
      sombraTarjeta: true,
      columnas: 3,
    },
    estilosHeader: {
      tituloWidget: { color: '#134E4A' },
      subtituloWidget: { color: '#0F766E' },
    },
  },
  {
    id: 'atardecer',
    label: 'Atardecer',
    description: 'Cálidos coral y melocotón en el reverso.',
    configuracion: {
      colorFondoContenedor: '#FFF7ED',
      colorFrente: '#FFFBEB',
      colorReverso: '#EA580C',
      bordeTarjetaGrosor: 1,
      bordeTarjetaColor: '#FDBA74',
      bordeTarjetaRadio: 16,
      sombraTarjeta: false,
      columnas: 2,
    },
    estilosHeader: {
      tituloWidget: { color: '#9A3412' },
      subtituloWidget: { color: '#C2410C' },
    },
  },
  {
    id: 'bosque',
    label: 'Bosque',
    description: 'Verdes naturales con tarjetas redondeadas.',
    configuracion: {
      colorFondoContenedor: '#F0FDF4',
      colorFrente: '#FFFFFF',
      colorReverso: '#15803D',
      bordeTarjetaGrosor: 2,
      bordeTarjetaColor: '#86EFAC',
      bordeTarjetaRadio: 14,
      sombraTarjeta: true,
      columnas: 3,
    },
    estilosHeader: {
      tituloWidget: { color: '#14532D' },
      subtituloWidget: { color: '#166534' },
    },
  },
  {
    id: 'foco-imagen',
    label: 'Foco imagen',
    description: 'Prioriza la imagen en ambas caras; título compacto.',
    configuracion: {
      colorFondoContenedor: '#F8FAFC',
      colorFrente: '#FFFFFF',
      colorReverso: '#1E293B',
      bordeTarjetaGrosor: 0,
      bordeTarjetaRadio: 8,
      sombraTarjeta: true,
      columnas: 2,
      frente: { mostrarImagen: true, mostrarTitulo: true, mostrarCuerpo: false },
      reverso: { mostrarImagen: true, mostrarTitulo: true, mostrarCuerpo: true },
    },
  },
  {
    id: 'solo-texto',
    label: 'Solo texto',
    description: 'Sin imágenes; énfasis en título y cuerpo.',
    configuracion: {
      colorFondoContenedor: '#FAFAFA',
      colorFrente: '#FFFFFF',
      colorReverso: '#4F46E5',
      bordeTarjetaGrosor: 1,
      bordeTarjetaColor: '#E0E7FF',
      bordeTarjetaRadio: 6,
      sombraTarjeta: false,
      columnas: 3,
      frente: { mostrarImagen: false, mostrarTitulo: true, mostrarCuerpo: true },
      reverso: { mostrarImagen: false, mostrarTitulo: true, mostrarCuerpo: true },
    },
  },
];

const PLANTILLA_MAP = new Map(
  FLIP_CARDS_PLANTILLAS.map((p) => [p.id, p] as const),
);

export function getFlipCardsPlantilla(id: FlipCardsPlantillaId): FlipCardsPlantillaDef {
  return PLANTILLA_MAP.get(id) ?? FLIP_CARDS_PLANTILLAS[0];
}

export function resolveFlipCardsPlantillaId(
  block: FlipCardsWidget,
): FlipCardsPlantillaId {
  return coerceFlipCardsPlantillaId(block.configuracion.plantillaId);
}

/** Aplica colores, bordes y visibilidad de la plantilla sin borrar el contenido de las tarjetas. */
export function applyFlipCardsPlantilla(
  block: FlipCardsWidget,
  plantillaId: FlipCardsPlantillaId,
): FlipCardsWidget {
  const tpl = getFlipCardsPlantilla(plantillaId);
  const base = normalizeFlipCardsWidget(block);
  const cfgPatch = tpl.configuracion;

  return {
    ...base,
    estilosHeader: tpl.estilosHeader
      ? { ...base.estilosHeader, ...tpl.estilosHeader }
      : base.estilosHeader,
    configuracion: {
      ...base.configuracion,
      ...cfgPatch,
      plantillaId,
      frente: {
        ...DEFAULT_FLIP_CARDS_CONFIG.frente,
        ...base.configuracion.frente,
        ...cfgPatch.frente,
      },
      reverso: {
        ...DEFAULT_FLIP_CARDS_CONFIG.reverso,
        ...base.configuracion.reverso,
        ...cfgPatch.reverso,
      },
    },
  };
}
