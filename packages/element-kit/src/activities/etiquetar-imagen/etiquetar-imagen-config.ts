import type { EtiquetarImagenActivity, EtiquetarImagenEtiqueta, EtiquetarImagenZona } from '@lumina/types/slide';

export const ETIQUETAR_MAX_ZONAS = 10;
export const ETIQUETAR_MAX_ETIQUETAS = 14;
export const ETIQUETAR_MIN_ZONAS = 2;

/** Id del contenedor «banco de etiquetas» (los marcadores usan el id de su zona). */
export const BANCO = 'banco';

export function generarIdEtiquetar(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Lleva una coordenada a la fracción 0–1; lo que no es número cae al centro. */
export function fraccion(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number.NaN;
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function registro(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function normalizarZona(raw: unknown): EtiquetarImagenZona {
  const o = registro(raw);
  return {
    id: typeof o.id === 'string' && o.id ? o.id : generarIdEtiquetar('zona'),
    x: fraccion(o.x),
    y: fraccion(o.y),
    etiquetaId: typeof o.etiquetaId === 'string' ? o.etiquetaId : '',
  };
}

function normalizarEtiqueta(raw: unknown): EtiquetarImagenEtiqueta {
  const o = registro(raw);
  return {
    id: typeof o.id === 'string' && o.id ? o.id : generarIdEtiquetar('etq'),
    texto: typeof o.texto === 'string' ? o.texto : '',
  };
}

/**
 * Hidrata una actividad tal como se guardó: completa los campos que falten, lleva las coordenadas
 * a 0–1 y, con `soloJugables` (el viewer), descarta las zonas cuya etiqueta ya no existe: no se
 * pueden jugar. El editor las conserva para que el docente las reasigne. No toca `ajustes` ni lo
 * que no conoce.
 */
export function normalizarEtiquetarImagen(
  actividad: EtiquetarImagenActivity | Record<string, unknown>,
  soloJugables = true,
): EtiquetarImagenActivity {
  const raw = actividad as Partial<EtiquetarImagenActivity>;
  const etiquetas = (Array.isArray(raw.etiquetas) ? raw.etiquetas : []).map(normalizarEtiqueta);
  const ids = new Set(etiquetas.map((e) => e.id));
  const todas = (Array.isArray(raw.zonas) ? raw.zonas : []).map(normalizarZona);
  const zonas = soloJugables ? todas.filter((z) => ids.has(z.etiquetaId)) : todas;
  return {
    ...(raw as EtiquetarImagenActivity),
    tipo: 'etiquetar_imagen',
    instruccion: typeof raw.instruccion === 'string' ? raw.instruccion : '',
    imagen: typeof raw.imagen === 'string' ? raw.imagen : '',
    textoAlternativo: typeof raw.textoAlternativo === 'string' ? raw.textoAlternativo : '',
    zonas,
    etiquetas,
  };
}

/** Huella del CONTENIDO: cambiar un ajuste (estilo, sonido…) no reinicia la actividad. */
export function etiquetarImagenFingerprint(a: EtiquetarImagenActivity): string {
  return JSON.stringify([a.instruccion, a.imagen, a.textoAlternativo, a.zonas, a.etiquetas]);
}
