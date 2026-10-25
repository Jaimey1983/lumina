// ─── Herramientas de creación (W6) ────────────────────────────────────────────
// Qué se crea con cada herramienta y dónde. Lógica pura: sin React ni DOM.

import {
  FORMAS,
  puertosForma,
  rectanguloTexto,
  type Caja,
  type EntradaElemento,
  type Escena,
  type Elemento,
  type Punto,
  type TipoForma,
} from "@lumina/drawing";

export type Herramienta =
  | { tipo: "seleccionar" }
  | { tipo: "forma"; forma: TipoForma }
  | { tipo: "linea"; flecha: boolean }
  | { tipo: "texto" };

export const SELECCIONAR: Herramienta = { tipo: "seleccionar" };

export const esMismaHerramienta = (a: Herramienta, b: Herramienta): boolean => {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === "forma" && b.tipo === "forma") return a.forma === b.forma;
  if (a.tipo === "linea" && b.tipo === "linea") return a.flecha === b.flecha;
  return true;
};

/** Tamaño mínimo (en unidades de escena) de lo que se dibuja arrastrando. */
export const TAMANO_MINIMO = 12;

/** Tamaño con el que se inserta un cuadro de texto con un solo clic. */
export const TEXTO_NUEVO = { ancho: 220, alto: 44 } as const;

/**
 * Rectángulo que se dibuja arrastrando de `inicio` a `actual`, sin importar la dirección.
 * Con `proporcional` (Mayús) es un cuadrado; con `desdeCentro` (Alt) `inicio` es el centro.
 */
export function cajaArrastrada(inicio: Punto, actual: Punto, opciones: { proporcional?: boolean; desdeCentro?: boolean } = {}): Caja {
  let dx = actual.x - inicio.x;
  let dy = actual.y - inicio.y;
  if (opciones.proporcional) {
    const lado = Math.max(Math.abs(dx), Math.abs(dy));
    dx = Math.sign(dx || 1) * lado;
    dy = Math.sign(dy || 1) * lado;
  }
  if (opciones.desdeCentro) {
    return { x: inicio.x - Math.abs(dx), y: inicio.y - Math.abs(dy), ancho: Math.abs(dx) * 2, alto: Math.abs(dy) * 2 };
  }
  return { x: Math.min(inicio.x, inicio.x + dx), y: Math.min(inicio.y, inicio.y + dy), ancho: Math.abs(dx), alto: Math.abs(dy) };
}

/** `true` si lo arrastrado es tan chico que se trata como un clic. */
export const esClic = (caja: Pick<Caja, "ancho" | "alto">, umbral = 4): boolean => caja.ancho < umbral && caja.alto < umbral;

/** Caja de una forma insertada con un clic: tamaño por defecto de la forma, centrada en el punto. */
export function cajaPorDefecto(forma: TipoForma, centro: Punto): Caja {
  const { ancho, alto } = FORMAS[forma].tamano;
  return { x: centro.x - ancho / 2, y: centro.y - alto / 2, ancho, alto };
}

/**
 * Centro donde colocar una forma por defecto sin tapar a otra igual: si ya hay una forma con esa misma
 * posición, baja en diagonal de 20 en 20 (como «Duplicar») hasta encontrar un sitio libre.
 */
export function centroSinTapar(escena: Escena, forma: TipoForma, centro: Punto, paso = 20, maximo = 50): Punto {
  for (let i = 0; i <= maximo; i++) {
    const c = { x: centro.x + paso * i, y: centro.y + paso * i };
    const caja = cajaPorDefecto(forma, c);
    // Con holgura: el modelo redondea las medidas, así que «la misma posición» no es igualdad exacta.
    const ocupado = escena.elementos.some((e) => e.tipo === "forma" && Math.abs(e.transformacion.x - caja.x) < 0.5 && Math.abs(e.transformacion.y - caja.y) < 0.5);
    if (!ocupado) return c;
  }
  return centro;
}

/** Lo que dibujó el usuario, con el mínimo respetado. */
export function conMinimo(caja: Caja, minimo = TAMANO_MINIMO): Caja {
  const ancho = Math.max(minimo, caja.ancho);
  const alto = Math.max(minimo, caja.alto);
  return { x: caja.x, y: caja.y, ancho, alto };
}

export function entradaForma(forma: TipoForma, caja: Caja): EntradaElemento {
  // Un icono nace sin relleno (Y32): el estilo inicial es del catálogo y el normalizador completa el resto. Las demás formas, como siempre.
  const estiloInicial = FORMAS[forma].estiloInicial;
  return { tipo: "forma", forma, transformacion: { x: caja.x, y: caja.y, ancho: caja.ancho, alto: caja.alto, rotacion: 0 }, ...(estiloInicial ? { estilo: estiloInicial } : {}) };
}

export function entradaTexto(caja: Caja, texto: string): EntradaElemento {
  return {
    tipo: "texto",
    texto,
    transformacion: { x: caja.x, y: caja.y, ancho: caja.ancho, alto: caja.alto, rotacion: 0 },
  };
}

export function entradaLinea(puntos: readonly Punto[], flecha: boolean): EntradaElemento {
  return { tipo: "linea", puntos: puntos.map((p) => ({ ...p })), trazado: "recto", inicio: "ninguno", fin: flecha ? "flecha" : "ninguno" };
}

/** Mayús al dibujar una línea: el tramo queda a múltiplos de 15° respecto del punto anterior. */
export function restringirAngulo(desde: Punto, hasta: Punto, paso = 15): Punto {
  const dx = hasta.x - desde.x;
  const dy = hasta.y - desde.y;
  const largo = Math.hypot(dx, dy);
  if (largo === 0) return { ...hasta };
  const angulo = Math.round(Math.atan2(dy, dx) / ((paso * Math.PI) / 180)) * ((paso * Math.PI) / 180);
  return { x: desde.x + Math.cos(angulo) * largo, y: desde.y + Math.sin(angulo) * largo };
}

// ─── Texto en el sitio ────────────────────────────────────────────────────────

/** Dónde se escribe el texto de un elemento y con qué aspecto. */
export interface AreaDeTexto {
  /** Zona en coordenadas de escena, SIN girar (se gira con `rotacion` alrededor de `centro`). */
  caja: Caja;
  rotacion: number;
  /** Centro de giro (el del elemento). */
  centro: Punto;
  texto: string;
  tamano: number;
  negrita: boolean;
  cursiva: boolean;
  alineacionH: "izquierda" | "centro" | "derecha";
  alineacionV: "arriba" | "medio" | "abajo";
  color: string;
  /** Lista del texto (Y24a): el cuadro de edición se alinea a la izquierda y deja sitio a las marcas. Un rótulo de conector no la lleva. */
  vinetas?: "puntos" | "numeros";
}

const ANCHO_ROTULO = 160;
const ALTO_ROTULO = 32;

/** Zona de edición de texto de un elemento: la zona de texto de la forma, todo el cuadro de texto, o el punto medio de una línea. */
export function areaDeTexto(escena: Escena, e: Elemento): AreaDeTexto | null {
  if (e.tipo === "grupo") return null;
  const st = e.estiloTexto;
  const comun = { tamano: st.tamano, negrita: st.negrita, cursiva: st.cursiva, alineacionH: st.alineacionH, alineacionV: st.alineacionV, color: st.color };
  const conLista = st.vinetas ? { vinetas: st.vinetas } : {};
  if (e.tipo === "texto") {
    const t = e.transformacion;
    return { ...comun, ...conLista, caja: { x: t.x, y: t.y, ancho: t.ancho, alto: t.alto }, rotacion: t.rotacion, centro: { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 }, texto: e.texto };
  }
  if (e.tipo === "forma") {
    const t = e.transformacion;
    const r = rectanguloTexto(e.forma, t.ancho, t.alto, { parametros: e.parametros, radio: e.estilo.radio });
    return {
      ...comun,
      ...conLista,
      caja: { x: t.x + r.x, y: t.y + r.y, ancho: r.ancho, alto: r.alto },
      rotacion: t.rotacion,
      centro: { x: t.x + t.ancho / 2, y: t.y + t.alto / 2 },
      texto: e.texto ?? "",
    };
  }
  // Línea: el rótulo va en el punto medio de su recorrido (los extremos conectados ya no se consultan: basta con los guardados).
  const medio = puntoMedio(escena, e.puntos, e.origen, e.destino);
  return {
    ...comun,
    caja: { x: medio.x - ANCHO_ROTULO / 2, y: medio.y - ALTO_ROTULO / 2, ancho: ANCHO_ROTULO, alto: ALTO_ROTULO },
    rotacion: 0,
    centro: medio,
    texto: e.texto ?? "",
    alineacionH: "centro",
    alineacionV: "medio",
  };
}

function puntoMedio(
  escena: Escena,
  puntos: readonly Punto[],
  origen: { elementoId: string; puerto: number } | undefined,
  destino: { elementoId: string; puerto: number } | undefined,
): Punto {
  const lista = puntos.map((p) => ({ ...p }));
  const formaDe = (id: string) => escena.elementos.find((e) => e.id === id && e.tipo === "forma");
  const anclar = (c: { elementoId: string; puerto: number } | undefined, indice: number): void => {
    const f = c ? formaDe(c.elementoId) : undefined;
    if (!c || !f || f.tipo !== "forma" || lista.length === 0) return;
    const t = f.transformacion;
    const p = puertosForma(f.forma, t.ancho, t.alto, { parametros: f.parametros, radio: f.estilo.radio })[c.puerto];
    if (p) lista[indice] = { x: t.x + p.x, y: t.y + p.y };
  };
  anclar(origen, 0);
  anclar(destino, lista.length - 1);
  if (lista.length === 0) return { x: 0, y: 0 };
  // Punto a mitad de camino sobre la polilínea.
  let total = 0;
  for (let i = 1; i < lista.length; i++) total += Math.hypot((lista[i]?.x ?? 0) - (lista[i - 1]?.x ?? 0), (lista[i]?.y ?? 0) - (lista[i - 1]?.y ?? 0));
  let resto = total / 2;
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1];
    const b = lista[i];
    if (!a || !b) continue;
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (resto <= largo && largo > 0) return { x: a.x + ((b.x - a.x) * resto) / largo, y: a.y + ((b.y - a.y) * resto) / largo };
    resto -= largo;
  }
  return lista[lista.length - 1] ?? { x: 0, y: 0 };
}
