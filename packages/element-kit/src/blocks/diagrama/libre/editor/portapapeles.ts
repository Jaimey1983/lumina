// ─── Portapapeles del editor (Y12a, DY7) ──────────────────────────────────────
// Puente entre los eventos `copy`/`cut`/`paste` del navegador y las operaciones puras de `@lumina/drawing`.
// No se usa `navigator.clipboard` (pide permisos y es asíncrono): se escribe y se lee `clipboardData`.
// Lo que se lee NO es de fiar: se valida contra el esquema y entra por el normalizador (lo hace `validarFragmento`).

import { copiar, MAX_ELEMENTOS_FRAGMENTO, MAX_TAMANO_FRAGMENTO, validarFragmento, type Escena, type Fragmento } from "@lumina/drawing";

/** Tipo MIME propio: lleva el fragmento entero (formas, estilo, conectores) entre dos diagramas. */
export const MIME_FRAGMENTO = "application/x-lumina-dibujo+json";
/** Lo más largo que se pega como texto plano en un cuadro de texto (DY8). */
export const MAX_TEXTO_PEGADO = 5000;

/** Lo que el editor usa de `DataTransfer` (así se prueba sin un navegador). */
export interface EscribirDatos {
  setData: (tipo: string, valor: string) => void;
}
export interface LeerDatos {
  getData: (tipo: string) => string;
}

export interface Copia {
  fragmento: Fragmento;
  json: string;
  /** Los textos de las formas, uno por línea: es lo que ve un editor de texto al pegar. */
  texto: string;
}

export type ResultadoCopia = { ok: true; copia: Copia } | { ok: false; motivo: string };

/** Los textos de un fragmento, en orden de apilado, uno por línea. */
export function textoPlanoDe(fragmento: Fragmento): string {
  const lineas: string[] = [];
  for (const e of fragmento.elementos) {
    if (e.tipo === "grupo") continue;
    const t = (e.texto ?? "").trim();
    if (t !== "") lineas.push(t);
  }
  return lineas.join("\n");
}

/** Arma lo que se va a copiar, o dice por qué no se puede (nada elegido, demasiado grande). */
export function prepararCopia(escena: Escena, ids: readonly string[]): ResultadoCopia {
  const fragmento = copiar(escena, ids);
  if (!fragmento) return { ok: false, motivo: "No hay nada que copiar." };
  if (fragmento.elementos.length > MAX_ELEMENTOS_FRAGMENTO) {
    return { ok: false, motivo: `Es demasiado para copiar de una vez (máximo ${MAX_ELEMENTOS_FRAGMENTO} elementos).` };
  }
  const json = JSON.stringify(fragmento);
  if (json.length > MAX_TAMANO_FRAGMENTO) return { ok: false, motivo: "Es demasiado grande para copiar." };
  return { ok: true, copia: { fragmento, json, texto: textoPlanoDe(fragmento) } };
}

export function escribirEnPortapapeles(datos: EscribirDatos, copia: Copia): void {
  datos.setData(MIME_FRAGMENTO, copia.json);
  datos.setData("text/plain", copia.texto);
}

export type Lectura =
  | { tipo: "fragmento"; fragmento: Fragmento; clave: string }
  | { tipo: "texto"; texto: string; clave: string }
  | { tipo: "vacio" }
  | { tipo: "error"; motivo: string };

/** Los saltos de línea de cualquier sistema pasan a `\n` y se quitan los vacíos del final. */
export function limpiarTexto(texto: string): string {
  return texto.replace(/\r\n?/g, "\n").replace(/\s+$/, "");
}

/**
 * Qué hay en el portapapeles: un fragmento de dibujo (formato propio, o el texto plano que coincide con la última copia
 * de esta página si el navegador quitó el formato propio), texto plano, nada, o algo que no vale.
 */
export function leerDePortapapeles(datos: LeerDatos, memoria: Copia | null = null): Lectura {
  let propio = "";
  let plano = "";
  try {
    propio = datos.getData(MIME_FRAGMENTO);
    plano = datos.getData("text/plain");
  } catch {
    return { tipo: "error", motivo: "No se pudo leer el portapapeles." };
  }
  if (propio !== "") {
    if (propio.length > MAX_TAMANO_FRAGMENTO) return { tipo: "error", motivo: "Lo copiado es demasiado grande para pegarlo." };
    let dato: unknown;
    try {
      dato = JSON.parse(propio);
    } catch {
      return { tipo: "error", motivo: "Lo copiado no es un dibujo válido." };
    }
    const fragmento = validarFragmento(dato);
    if (!fragmento) return { tipo: "error", motivo: "Lo copiado no es un dibujo válido o es demasiado grande." };
    return { tipo: "fragmento", fragmento, clave: propio };
  }
  const texto = limpiarTexto(plano);
  if (texto === "") return { tipo: "vacio" };
  // Algunos navegadores quitan el formato propio (por ejemplo, al pegar «sin formato»): si el texto es el de la última copia, se recupera.
  if (memoria && memoria.texto !== "" && texto === limpiarTexto(memoria.texto)) return { tipo: "fragmento", fragmento: memoria.fragmento, clave: memoria.json };
  if (texto.length > MAX_TEXTO_PEGADO) return { tipo: "error", motivo: `El texto es demasiado largo para pegarlo (máximo ${MAX_TEXTO_PEGADO} caracteres).` };
  return { tipo: "texto", texto, clave: `texto:${texto}` };
}
