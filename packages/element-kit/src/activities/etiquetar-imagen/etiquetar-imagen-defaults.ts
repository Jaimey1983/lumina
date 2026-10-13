import type { EtiquetarImagenActivity } from '@lumina/types/slide';

/**
 * Dibujo de ejemplo (una célula) como `data:` URI: la actividad por defecto se juega sin red. Los
 * colores van como `rgb()` para no meter hex fuera de los tokens.
 */
const SVG_CELULA = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">',
  '<rect width="400" height="250" fill="rgb(248,250,252)"/>',
  '<ellipse cx="200" cy="125" rx="170" ry="105" fill="rgb(254,243,199)" stroke="rgb(217,119,6)" stroke-width="6"/>',
  '<circle cx="200" cy="125" r="42" fill="rgb(191,219,254)" stroke="rgb(37,99,235)" stroke-width="5"/>',
  '<circle cx="200" cy="125" r="12" fill="rgb(37,99,235)"/>',
  '</svg>',
].join('');

export const IMAGEN_CELULA_EJEMPLO = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_CELULA)}`;

export function createDefaultEtiquetarImagen(): EtiquetarImagenActivity {
  return {
    tipo: 'etiquetar_imagen',
    instruccion: 'Coloca cada etiqueta en la parte de la célula que le corresponde.',
    imagen: IMAGEN_CELULA_EJEMPLO,
    textoAlternativo: 'Dibujo de una célula: una membrana ovalada que rodea el citoplasma y un núcleo en el centro.',
    zonas: [
      { id: 'zona-1', x: 0.5, y: 0.5, etiquetaId: 'etq-1' },
      { id: 'zona-2', x: 0.29, y: 0.34, etiquetaId: 'etq-2' },
      { id: 'zona-3', x: 0.93, y: 0.5, etiquetaId: 'etq-3' },
    ],
    etiquetas: [
      { id: 'etq-1', texto: 'Núcleo' },
      { id: 'etq-2', texto: 'Citoplasma' },
      { id: 'etq-3', texto: 'Membrana' },
      { id: 'etq-4', texto: 'Pared celular' },
    ],
    puntos: 10,
  };
}
