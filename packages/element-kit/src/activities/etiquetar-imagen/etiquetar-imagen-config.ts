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

/** Resultado de poner un marcador nuevo: la actividad ya con él y el id del marcador. */
export interface MarcadorAgregado {
  actividad: EtiquetarImagenActivity;
  zonaId: string;
}

/**
 * Pone un marcador en `(x, y)` (fracciones 0–1) y le asigna la primera etiqueta libre; si no queda
 * ninguna crea una vacía. `null` si se alcanzó el máximo de marcadores o de etiquetas.
 */
export function agregarMarcador(act: EtiquetarImagenActivity, x: number, y: number): MarcadorAgregado | null {
  if (act.zonas.length >= ETIQUETAR_MAX_ZONAS) return null;
  const usadas = new Set(act.zonas.map((z) => z.etiquetaId));
  let etiquetas = act.etiquetas;
  let etiquetaId = etiquetas.find((e) => !usadas.has(e.id))?.id;
  if (!etiquetaId) {
    if (etiquetas.length >= ETIQUETAR_MAX_ETIQUETAS) return null;
    etiquetaId = generarIdEtiquetar('etq');
    etiquetas = [...etiquetas, { id: etiquetaId, texto: '' }];
  }
  const zona: EtiquetarImagenZona = { id: generarIdEtiquetar('zona'), x: fraccion(x), y: fraccion(y), etiquetaId };
  return { actividad: { ...act, zonas: [...act.zonas, zona], etiquetas }, zonaId: zona.id };
}

/** Mueve un marcador a `(x, y)` (se recortan a 0–1). */
export function moverMarcador(act: EtiquetarImagenActivity, id: string, x: number, y: number): EtiquetarImagenActivity {
  return { ...act, zonas: act.zonas.map((z) => (z.id === id ? { ...z, x: fraccion(x), y: fraccion(y) } : z)) };
}

/** Quita un marcador (su etiqueta queda en el banco como distractor). */
export function quitarMarcador(act: EtiquetarImagenActivity, id: string): EtiquetarImagenActivity {
  return { ...act, zonas: act.zonas.filter((z) => z.id !== id) };
}
