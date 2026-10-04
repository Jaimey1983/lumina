import type { MoleculaWidget } from '@lumina/types/widget';

export const DEFAULT_MOLECULA_CONFIG: MoleculaWidget['configuracion'] = {
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  colorFondoContenedor: '#ffffff',
  opacidadFondoContenedor: 100,
  paddingContenedor: 16,
  alturaCanvasPx: 280,
};

export function normalizeMoleculaWidget(block: MoleculaWidget): MoleculaWidget {
  const cfg = block.configuracion ?? DEFAULT_MOLECULA_CONFIG;
  return {
    ...block,
    tipo: 'molecula',
    smiles: (block.smiles ?? 'O').trim() || 'O',
    configuracion: {
      ...DEFAULT_MOLECULA_CONFIG,
      ...cfg,
      alturaCanvasPx: cfg.alturaCanvasPx ?? DEFAULT_MOLECULA_CONFIG.alturaCanvasPx,
    },
  };
}
