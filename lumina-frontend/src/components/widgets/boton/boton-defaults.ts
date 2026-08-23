import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type {
  BotonAccion,
  BotonForma,
  BotonTamano,
  BotonVariante,
  BotonWidget,
} from '@/types/widget.types';

export const DEFAULT_BOTON_TEXTO = 'Continuar';
export const DEFAULT_BOTON_VARIANTE: BotonVariante = 'primary';
export const DEFAULT_BOTON_TAMANO: BotonTamano = 'md';
export const DEFAULT_BOTON_FORMA: BotonForma = 'redondeado';
export const DEFAULT_BOTON_ACCION: BotonAccion = 'siguiente';

export const BOTON_VARIANTES: { id: BotonVariante; label: string; swatch: string }[] = [
  { id: 'primary', label: 'Primary', swatch: '#0d6efd' },
  { id: 'secondary', label: 'Secondary', swatch: '#6c757d' },
  { id: 'success', label: 'Success', swatch: '#198754' },
  { id: 'danger', label: 'Danger', swatch: '#dc3545' },
  { id: 'warning', label: 'Warning', swatch: '#ffc107' },
  { id: 'info', label: 'Info', swatch: '#0dcaf0' },
  { id: 'light', label: 'Light', swatch: '#f8f9fa' },
  { id: 'dark', label: 'Dark', swatch: '#212529' },
  { id: 'link', label: 'Link', swatch: '#0d6efd' },
];

const VALID_VARIANTES = new Set<BotonVariante>(BOTON_VARIANTES.map((v) => v.id));
const VALID_TAMANOS = new Set<BotonTamano>(['sm', 'md', 'lg']);
const VALID_FORMAS = new Set<BotonForma>(['redondeado', 'pill']);
const VALID_ACCIONES = new Set<BotonAccion>(['ninguna', 'url', 'siguiente', 'anterior', 'ir_a']);

export function botonFallbackSize(tamano: BotonTamano): { ancho: number; alto: number } {
  if (tamano === 'sm') return { ancho: 16, alto: 6 };
  if (tamano === 'lg') return { ancho: 24, alto: 10 };
  return { ancho: 20, alto: 8 };
}

export function normalizeBotonWidget(block: BotonWidget): BotonWidget {
  const variante = VALID_VARIANTES.has(block.variante) ? block.variante : DEFAULT_BOTON_VARIANTE;
  const tamano = VALID_TAMANOS.has(block.tamano as BotonTamano)
    ? (block.tamano as BotonTamano)
    : DEFAULT_BOTON_TAMANO;
  const forma = VALID_FORMAS.has(block.forma as BotonForma)
    ? (block.forma as BotonForma)
    : DEFAULT_BOTON_FORMA;
  const accion = VALID_ACCIONES.has(block.accion as BotonAccion)
    ? (block.accion as BotonAccion)
    : DEFAULT_BOTON_ACCION;

  return {
    tipo: 'boton',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    texto: typeof block.texto === 'string' && block.texto.length > 0 ? block.texto : DEFAULT_BOTON_TEXTO,
    variante,
    outline: Boolean(block.outline),
    tamano,
    forma,
    accion,
    url: typeof block.url === 'string' ? block.url : '',
    slideIndex: typeof block.slideIndex === 'number' ? Math.max(0, Math.floor(block.slideIndex)) : 0,
    deshabilitado: Boolean(block.deshabilitado),
  };
}

export function createDefaultBotonBlock(marco?: BlockMarco): BotonWidget {
  const fb = BLOCK_FALLBACKS.boton;
  const size = botonFallbackSize(DEFAULT_BOTON_TAMANO);
  return normalizeBotonWidget({
    tipo: 'boton',
    texto: DEFAULT_BOTON_TEXTO,
    variante: DEFAULT_BOTON_VARIANTE,
    outline: false,
    tamano: DEFAULT_BOTON_TAMANO,
    forma: DEFAULT_BOTON_FORMA,
    accion: DEFAULT_BOTON_ACCION,
    url: '',
    slideIndex: 0,
    deshabilitado: false,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: size.ancho,
    alto: size.alto,
  });
}
