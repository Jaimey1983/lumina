import type { BlockMarco } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';
import { esIconoValido, type BotonIconoId } from './boton-iconos.js';
import type {
  BotonAccion,
  BotonForma,
  BotonTamano,
  BotonVariante,
  BotonWidget,
} from '@lumina/types/widget';

export const DEFAULT_BOTON_TEXTO = 'Continuar';
export const DEFAULT_BOTON_VARIANTE: BotonVariante = 'primary';
export const DEFAULT_BOTON_TAMANO: BotonTamano = 'md';
export const DEFAULT_BOTON_FORMA: BotonForma = 'redondeado';
export const DEFAULT_BOTON_ACCION: BotonAccion = 'siguiente';

/**
 * Opciones de T8 que aún no están en `BotonWidget` de `@lumina/types` (fuera del alcance de
 * esa ficha). Se leen del JSON guardado con estos tipos; subirlas a `@lumina/types` queda como
 * seguimiento. `accion: 'descargar'` también es nueva: ver `BotonAccionT8`.
 */
export type BotonEstilo = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
export type BotonDensidad = 'compacta' | 'normal' | 'amplia';
export type BotonIconoPosicion = 'izquierda' | 'derecha';
/** Las acciones del tipo compartido más la descarga de un recurso. */
export type BotonAccionT8 = BotonAccion | 'descargar';

export interface BotonT8 {
  /** Si falta se deduce de lo legado: `link` → enlace, `outline` → contorno, si no sólido. */
  estilo?: BotonEstilo;
  icono?: BotonIconoId;
  iconoPosicion?: BotonIconoPosicion;
  /** Muestra un indicador de carga y no deja pulsar. */
  cargando?: boolean;
  densidad?: BotonDensidad;
  /** Nombre sugerido del archivo para la acción `descargar`. */
  archivoNombre?: string;
}

export type BotonWidgetT8 = Omit<BotonWidget, 'accion'> & BotonT8 & { accion?: BotonAccionT8 };

export const BOTON_ESTILOS: { id: BotonEstilo; label: string }[] = [
  { id: 'solid', label: 'Sólido' },
  { id: 'soft', label: 'Suave' },
  { id: 'outline', label: 'Contorno' },
  { id: 'ghost', label: 'Fantasma' },
  { id: 'link', label: 'Enlace' },
];

export const BOTON_DENSIDADES: { id: BotonDensidad; label: string }[] = [
  { id: 'compacta', label: 'Compacta' },
  { id: 'normal', label: 'Normal' },
  { id: 'amplia', label: 'Amplia' },
];

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
const VALID_ACCIONES = new Set<BotonAccionT8>(['ninguna', 'url', 'siguiente', 'anterior', 'ir_a', 'descargar']);
const VALID_ESTILOS = new Set<BotonEstilo>(['solid', 'soft', 'outline', 'ghost', 'link']);
const VALID_DENSIDADES = new Set<BotonDensidad>(['compacta', 'normal', 'amplia']);

export function botonFallbackSize(tamano: BotonTamano): { ancho: number; alto: number } {
  if (tamano === 'sm') return { ancho: 16, alto: 6 };
  if (tamano === 'lg') return { ancho: 24, alto: 10 };
  return { ancho: 20, alto: 8 };
}

export function normalizeBotonWidget(rawBlock: BotonWidget): BotonWidget {
  const block = rawBlock as BotonWidgetT8;
  const variante = VALID_VARIANTES.has(block.variante) ? block.variante : DEFAULT_BOTON_VARIANTE;
  const tamano = VALID_TAMANOS.has(block.tamano as BotonTamano)
    ? (block.tamano as BotonTamano)
    : DEFAULT_BOTON_TAMANO;
  const forma = VALID_FORMAS.has(block.forma as BotonForma)
    ? (block.forma as BotonForma)
    : DEFAULT_BOTON_FORMA;
  const accion = VALID_ACCIONES.has(block.accion as BotonAccionT8)
    ? (block.accion as BotonAccionT8)
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
    // T8: solo se escriben cuando traen un valor válido (por defecto, ausentes).
    ...(VALID_ESTILOS.has(block.estilo as BotonEstilo) ? { estilo: block.estilo } : {}),
    ...(esIconoValido(block.icono) ? { icono: block.icono as BotonIconoId } : {}),
    ...(block.iconoPosicion === 'derecha' ? { iconoPosicion: 'derecha' as const } : {}),
    ...(block.cargando === true ? { cargando: true } : {}),
    ...(VALID_DENSIDADES.has(block.densidad as BotonDensidad) && block.densidad !== 'normal'
      ? { densidad: block.densidad }
      : {}),
    ...(typeof block.archivoNombre === 'string' && block.archivoNombre.trim()
      ? { archivoNombre: block.archivoNombre.trim() }
      : {}),
  } as BotonWidget;
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
