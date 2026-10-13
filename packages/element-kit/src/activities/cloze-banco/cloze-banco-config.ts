import type { ClozeBancoActivity, ClozeBancoBlanco } from '@lumina/types/slide';

export const CLOZE_MAX_BLANCOS = 12;
export const CLOZE_MAX_DISTRACTORES = 8;

/** Id del contenedor «banco de palabras» (los huecos usan su propio id de hueco). */
export const BANCO = 'banco';

export function generarIdCloze(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Un marcador `{{blank:id}}` del texto. */
export const MARCADOR = /\{\{blank:([^}]+)\}\}/g;

/** Ids de los huecos en el orden en que aparecen en el texto (sin repetir). */
export function idsEnTexto(texto: string): string[] {
  const vistos = new Set<string>();
  for (const m of texto.matchAll(MARCADOR)) vistos.add(m[1]!);
  return [...vistos];
}

export type Segmento = { tipo: 'texto'; texto: string } | { tipo: 'hueco'; id: string };

/**
 * Parte el texto en trozos de texto y huecos. Solo la PRIMERA aparición de un id es hueco: las
 * repetidas se dejan como «___» (no se pueden llenar y el validador lo avisa).
 */
export function segmentarTexto(texto: string, ids?: ReadonlySet<string>): Segmento[] {
  const out: Segmento[] = [];
  const vistos = new Set<string>();
  let desde = 0;
  for (const m of texto.matchAll(MARCADOR)) {
    const id = m[1]!;
    const previo = texto.slice(desde, m.index);
    const esHueco = !vistos.has(id) && (!ids || ids.has(id));
    if (previo) out.push({ tipo: 'texto', texto: previo });
    if (esHueco) {
      vistos.add(id);
      out.push({ tipo: 'hueco', id });
    } else {
      out.push({ tipo: 'texto', texto: '___' });
    }
    desde = m.index! + m[0].length;
  }
  const resto = texto.slice(desde);
  if (resto) out.push({ tipo: 'texto', texto: resto });
  return out;
}

function normalizarBlanco(raw: unknown): ClozeBancoBlanco {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    id: typeof o.id === 'string' && o.id ? o.id : generarIdCloze(),
    respuesta: typeof o.respuesta === 'string' ? o.respuesta : o.respuesta == null ? '' : String(o.respuesta),
  };
}

/**
 * Hidrata una actividad tal como se guardó: completa los campos que falten. Con `soloJugables` (el
 * viewer) deja únicamente los huecos con respuesta que aparecen en el texto, EN EL ORDEN del texto
 * (así «Hueco 1» es el primero que se lee); el editor los conserva todos para poder corregirlos.
 * No toca `ajustes` ni lo que no conoce.
 */
export function normalizarClozeBanco(
  actividad: ClozeBancoActivity | Record<string, unknown>,
  soloJugables = true,
): ClozeBancoActivity {
  const raw = actividad as Partial<ClozeBancoActivity>;
  const texto = typeof raw.texto === 'string' ? raw.texto : '';
  let blancos = (Array.isArray(raw.blancos) ? raw.blancos : []).map(normalizarBlanco);
  if (soloJugables) {
    const orden = idsEnTexto(texto);
    blancos = orden
      .map((id) => blancos.find((b) => b.id === id))
      .filter((b): b is ClozeBancoBlanco => b !== undefined && b.respuesta.trim() !== '');
  }
  return {
    ...(raw as ClozeBancoActivity),
    tipo: 'cloze_banco',
    texto,
    blancos,
    distractores: (Array.isArray(raw.distractores) ? raw.distractores : []).map((d) => String(d ?? '')),
  };
}

export interface Ficha {
  id: string;
  texto: string;
}

/**
 * Las fichas del banco: una por hueco (su respuesta) más los distractores no vacíos. Los ids son
 * posicionales, así dos huecos con la misma respuesta dan dos fichas distintas con el mismo texto.
 */
export function fichasDelBanco(act: ClozeBancoActivity): Ficha[] {
  const respuestas = act.blancos.map((b) => b.respuesta.trim());
  const distractores = act.distractores.map((d) => d.trim()).filter((d) => d !== '');
  return [...respuestas, ...distractores].map((texto, i) => ({ id: `ficha-${i}`, texto }));
}

/** Huella del CONTENIDO: cambiar un ajuste (estilo, sonido…) no reinicia la actividad. */
export function clozeBancoFingerprint(a: ClozeBancoActivity): string {
  return JSON.stringify([a.texto, a.blancos, a.distractores]);
}
