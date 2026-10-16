import { escenaVacia, normalizarEscena, type Escena } from "@lumina/drawing";
import { BLOCK_FALLBACKS, type BlockMarco } from "@lumina/types/slide";
import { DIBUJO_TIPO, type DibujoEstado } from "./dibujo-types.js";

export const DIBUJO_TITULO_MAX = 120;
export const DIBUJO_DESCRIPCION_MAX = 500;

type Pt = { x: number; y: number };
const forma = (
  id: string,
  tipo: string,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  texto: string,
  relleno: string,
  borde: string,
  extra: Record<string, unknown> = {},
) => ({
  tipo: "forma",
  id,
  forma: tipo,
  transformacion: { x, y, ancho, alto, rotacion: 0 },
  estilo: { relleno: { tipo: "solido", color: relleno }, contorno: { color: borde, grosor: 2.5, patron: "solido" }, opacidad: 1, sombra: null, radio: 0, ...extra },
  texto,
  estiloTexto: { tamano: 15, negrita: true },
});
const puntos: Pt[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];
const linea = (id: string, origen: [string, number], destino: [string, number], color: string, trazado: string, extra: Record<string, unknown> = {}) => ({
  tipo: "linea",
  id,
  puntos,
  trazado,
  fin: "flecha",
  origen: { elementoId: origen[0], puerto: origen[1] },
  destino: { elementoId: destino[0], puerto: destino[1] },
  estilo: { contorno: { color, grosor: 2.5, patron: "solido" } },
  ...extra,
});

/** Ejemplo con el que nace un bloque nuevo: un diagrama de decisión editable. */
function datosEjemplo(): unknown {
  return {
    version: 1,
    ancho: 1000,
    alto: 470,
    fondo: null,
    elementos: [
      { tipo: "texto", id: "titulo", texto: "Proceso de decisión", transformacion: { x: 30, y: 16, ancho: 600, alto: 44 }, estiloTexto: { tamano: 28, negrita: true, color: "var(--foreground)" } },
      forma("inicio", "rectangulo-redondeado", 40, 190, 170, 80, "Recibir solicitud", "#DBEAFE", "#2563EB", { sombra: { color: "#00000033", desenfoque: 8, dx: 0, dy: 4 } }),
      forma("decision", "rombo", 300, 170, 190, 120, "¿Cumple los requisitos?", "#FEF3C7", "#D97706"),
      forma("aprobar", "rectangulo-redondeado", 600, 100, 170, 80, "Aprobar", "#DCFCE7", "#16A34A"),
      forma("pedir", "rectangulo-redondeado", 600, 290, 170, 80, "Pedir más datos", "#FEE2E2", "#DC2626"),
      forma("fin", "elipse", 850, 195, 120, 80, "Fin", "#EDE9FE", "#7C3AED"),
      linea("l1", ["inicio", 1], ["decision", 3], "#334155", "recto"),
      linea("l2", ["decision", 0], ["aprobar", 3], "#16A34A", "ortogonal", { texto: "Sí" }),
      linea("l3", ["decision", 2], ["pedir", 3], "#DC2626", "ortogonal", { texto: "No", estilo: { contorno: { color: "#DC2626", grosor: 2.5, patron: "guiones" } } }),
      linea("l4", ["aprobar", 1], ["fin", 0], "#7C3AED", "curvo"),
      linea("l5", ["pedir", 1], ["fin", 2], "#7C3AED", "curvo"),
    ],
  };
}

export function escenaDeEjemplo(): Escena {
  return normalizarEscena(datosEjemplo());
}

const texto = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const limpio = v.slice(0, max);
  return limpio.trim().length > 0 ? limpio : undefined;
};

const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

/** Completa y sanea un bloque guardado: la escena pasa por el normalizador y lo demás vuelve a su valor por defecto. */
export function normalizeDibujoWidget(block: Partial<Omit<DibujoEstado, "escena">> & { escena?: unknown }): DibujoEstado {
  const fb = BLOCK_FALLBACKS.dibujo;
  const titulo = texto(block.titulo, DIBUJO_TITULO_MAX);
  const descripcion = texto(block.descripcionAccesible, DIBUJO_DESCRIPCION_MAX);
  return {
    ...(block.id ? { id: block.id } : {}),
    tipo: DIBUJO_TIPO,
    x: num(block.x, fb.x),
    y: num(block.y, fb.y),
    ancho: Math.max(1, num(block.ancho, fb.ancho)),
    alto: Math.max(1, num(block.alto, fb.alto)),
    ...(typeof block.zIndex === "number" ? { zIndex: block.zIndex } : {}),
    ...(titulo ? { titulo } : {}),
    ...(descripcion ? { descripcionAccesible: descripcion } : {}),
    escena: block.escena === undefined ? escenaVacia() : normalizarEscena(block.escena),
  };
}

export function createDefaultDibujoBlock(marco?: BlockMarco): DibujoEstado {
  const fb = BLOCK_FALLBACKS.dibujo;
  return {
    tipo: DIBUJO_TIPO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: marco ? marco.anchoPct : fb.ancho,
    alto: marco ? marco.altoPct : fb.alto,
    titulo: "Proceso de decisión",
    descripcionAccesible:
      "Diagrama de flujo: se recibe una solicitud y se decide si cumple los requisitos; si cumple se aprueba, si no se piden más datos, y ambos caminos terminan en el fin.",
    escena: escenaDeEjemplo(),
  };
}
