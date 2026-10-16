import { normalizarEscena, type Escena } from "@lumina/drawing";
import { escenaDeEjemplo } from "./dibujo-defaults.js";

export interface PlantillaDibujo {
  id: string;
  label: string;
  description: string;
  escena: Escena;
}

const caja = (id: string, forma: string, x: number, y: number, ancho: number, alto: number, texto: string, relleno: string, borde: string) => ({
  tipo: "forma",
  id,
  forma,
  transformacion: { x, y, ancho, alto, rotacion: 0 },
  estilo: { relleno: { tipo: "solido", color: relleno }, contorno: { color: borde, grosor: 2.5, patron: "solido" }, opacidad: 1, sombra: null, radio: 0 },
  texto,
  estiloTexto: { tamano: 16, negrita: true },
});

const flecha = (id: string, desde: [string, number], hasta: [string, number], trazado: string, color = "#334155") => ({
  tipo: "linea",
  id,
  puntos: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  trazado,
  fin: "flecha",
  origen: { elementoId: desde[0], puerto: desde[1] },
  destino: { elementoId: hasta[0], puerto: hasta[1] },
  estilo: { contorno: { color, grosor: 2.5, patron: "solido" } },
});

const COLORES: ReadonlyArray<[string, string]> = [
  ["#DBEAFE", "#2563EB"],
  ["#DCFCE7", "#16A34A"],
  ["#FEF3C7", "#D97706"],
  ["#FCE7F3", "#DB2777"],
];

function escenaPasos(): Escena {
  const elementos: unknown[] = [];
  for (let i = 0; i < 4; i++) {
    const [fondo, borde] = COLORES[i];
    elementos.push(caja(`paso${i + 1}`, "rectangulo-redondeado", 40 + i * 240, 110, 180, 80, `Paso ${i + 1}`, fondo, borde));
    if (i > 0) elementos.push(flecha(`f${i}`, [`paso${i}`, 1], [`paso${i + 1}`, 3], "recto"));
  }
  return normalizarEscena({ version: 1, ancho: 1000, alto: 300, fondo: null, elementos });
}

function escenaCiclo(): Escena {
  const posiciones: Array<[number, number]> = [
    [400, 30],
    [700, 210],
    [400, 390],
    [100, 210],
  ];
  const elementos: unknown[] = [];
  posiciones.forEach(([x, y], i) => {
    const [fondo, borde] = COLORES[i];
    elementos.push(caja(`etapa${i + 1}`, "elipse", x, y, 200, 100, `Etapa ${i + 1}`, fondo, borde));
  });
  // Arriba → derecha → abajo → izquierda → arriba, con curvas que giran en el mismo sentido.
  elementos.push(flecha("c1", ["etapa1", 1], ["etapa2", 0], "curvo", "#2563EB"));
  elementos.push(flecha("c2", ["etapa2", 2], ["etapa3", 1], "curvo", "#16A34A"));
  elementos.push(flecha("c3", ["etapa3", 3], ["etapa4", 2], "curvo", "#D97706"));
  elementos.push(flecha("c4", ["etapa4", 0], ["etapa1", 3], "curvo", "#DB2777"));
  return normalizarEscena({ version: 1, ancho: 1000, alto: 520, fondo: null, elementos });
}

/** Plantillas de partida del panel: cada una reemplaza la escena completa. */
export function plantillasDibujo(): PlantillaDibujo[] {
  return [
    { id: "decision", label: "Proceso de decisión", description: "Diagrama de flujo con una decisión y dos caminos", escena: escenaDeEjemplo() },
    { id: "pasos", label: "Pasos en secuencia", description: "Cuatro pasos unidos por flechas", escena: escenaPasos() },
    { id: "ciclo", label: "Ciclo", description: "Cuatro etapas que se repiten", escena: escenaCiclo() },
    { id: "blanco", label: "Lienzo en blanco", description: "Empieza sin ningún elemento", escena: normalizarEscena({ version: 1, ancho: 1000, alto: 470, fondo: null, elementos: [] }) },
  ];
}
