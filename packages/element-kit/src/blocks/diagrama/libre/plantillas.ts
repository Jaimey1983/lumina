// ─── Plantillas básicas modificables del diagrama (W10, DW11) ──────────────────
// Cada plantilla es un diagrama de los de siempre convertido a escena: el docente la elige y ya es un dibujo libre
// (formas, conectores pegados a sus puertos y texto) que puede cambiar, agregar o quitar a voluntad, como en EdrawMax.
// No hay una tabla de plantillas aparte: se parte de los mismos creadores que usa el panel, así el contenido es uno.

import type { DiagramaEscena, DiagramaGrafoBlock } from '@lumina/types/slide';
import {
  createDefaultCicloBlock,
  createDefaultCronologiaBlock,
  createDefaultFlujoBlock,
  createDefaultMapaConceptualBlock,
  createDefaultPiramideBlock,
  createDefaultTablaTBlock,
} from '../diagrama-defaults.js';
import { diagramaAEscena } from '../diagrama-escena.js';

export interface PlantillaEditable {
  id: string;
  label: string;
  descripcion: string;
  crear: (marco: Pick<DiagramaGrafoBlock, 'id' | 'x' | 'y' | 'ancho' | 'alto'>) => DiagramaGrafoBlock;
}

const CREADORES: ReadonlyArray<Omit<PlantillaEditable, 'crear'> & { base: (marco: Partial<DiagramaGrafoBlock>) => DiagramaGrafoBlock }> = [
  { id: 'flujo', label: 'Flujo', descripcion: 'Pasos y decisiones', base: createDefaultFlujoBlock },
  { id: 'mapa_conceptual', label: 'Mapa conceptual', descripcion: 'Conceptos y relaciones', base: createDefaultMapaConceptualBlock },
  { id: 'linea_tiempo', label: 'Línea de tiempo', descripcion: 'Eventos en orden', base: createDefaultCronologiaBlock },
  { id: 'comparacion', label: 'Comparación', descripcion: 'Dos columnas (tabla T)', base: createDefaultTablaTBlock },
  { id: 'ciclo', label: 'Ciclo', descripcion: 'Etapas que se repiten', base: createDefaultCicloBlock },
  { id: 'piramide', label: 'Pirámide', descripcion: 'Niveles jerárquicos', base: createDefaultPiramideBlock },
];

/** Las seis plantillas, en el orden en que se ofrecen. */
export const PLANTILLAS_EDITABLES: readonly PlantillaEditable[] = CREADORES.map(({ base, ...datos }) => ({
  ...datos,
  crear: (marco) => {
    const diagrama = base({ ...marco });
    // Es un dibujo desde el primer momento; los nodos y aristas quedan como respaldo («Volver al diagrama original»).
    return { ...diagrama, escena: diagramaAEscena(diagrama) as unknown as DiagramaEscena };
  },
}));
