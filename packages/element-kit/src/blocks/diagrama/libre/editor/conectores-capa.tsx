"use client";

import type { ReactElement } from "react";
import { puertosDeEscena, trazadoForma, type Escena, type Forma, type Linea, type Punto, type PuertoCercano } from "@lumina/drawing";
import { agarresDeConector } from "./conectores.js";
import { escenaAPantalla, type Vista } from "./vista.js";

const COLOR = "#2563eb";
const COLOR_PEGADO = "#16a34a";
/** Extremo de conector que no está unido a ninguna forma (Y10). */
const COLOR_LIBRE = "#ea580c";

/** Puertos de las formas: puntos de unión que se ven al dibujar una línea, al arrastrar un extremo y al elegir una forma. */
export function CapaPuertos({
  escena,
  vista,
  formasElegidas,
  todas,
  objetivo,
  tactil = false,
}: {
  escena: Escena;
  vista: Vista;
  /** Ids de las formas elegidas: sus puertos se ven siempre. */
  formasElegidas: ReadonlySet<string>;
  /** Mostrar los puertos de todas las formas (con la herramienta de línea o arrastrando un extremo). */
  todas: boolean;
  objetivo: PuertoCercano | null;
  /** Con el dedo los puertos se dibujan más grandes (y se captan desde más lejos). */
  tactil?: boolean;
}): ReactElement | null {
  const puertos = puertosDeEscena(escena).filter((p) => todas || formasElegidas.has(p.elementoId));
  if (puertos.length === 0 && !objetivo) return null;
  return (
    <g data-capa="puertos" pointerEvents="none">
      {puertos.map((p) => {
        const s = escenaAPantalla(vista, p.punto);
        const activo = objetivo?.elementoId === p.elementoId && objetivo.puerto === p.puerto;
        return activo ? (
          <circle key={`${p.elementoId}:${p.puerto}`} cx={s.x} cy={s.y} r={7} fill={COLOR_PEGADO} fillOpacity={0.35} stroke={COLOR_PEGADO} strokeWidth={2} data-puerto={`${p.elementoId}:${p.puerto}`} data-puerto-activo="" />
        ) : (
          <circle key={`${p.elementoId}:${p.puerto}`} cx={s.x} cy={s.y} r={tactil ? 6 : 3.5} fill="#fff" stroke={COLOR} strokeWidth={1.25} data-puerto={`${p.elementoId}:${p.puerto}`} />
        );
      })}
    </g>
  );
}

/**
 * La forma que va a recibir lo que se arrastra (el extremo de un conector, otra forma o una línea que se dibuja),
 * resaltada entera —borde y relleno suave—, además del puerto: así se ve a cuál se va a pegar antes de soltar.
 * Dibuja el contorno real de la forma (con su giro), no su caja.
 *
 * `modo`: `conecta` (verde, sólido) cuando al soltar se va a pegar o a crear un conector; `solapa` (azul, a rayas
 * y más suave) cuando solo se está pasando por encima de la forma y soltar no conectará nada.
 */
export function CapaDestino({ escena, vista, formaId, modo = "conecta" }: { escena: Escena; vista: Vista; formaId: string | null; modo?: "conecta" | "solapa" }): ReactElement | null {
  const f = formaId === null ? undefined : escena.elementos.find((e): e is Forma => e.id === formaId && e.tipo === "forma");
  if (!f) return null;
  const t = f.transformacion;
  const mover = `translate(${t.x} ${t.y})${t.rotacion === 0 ? "" : ` rotate(${t.rotacion} ${t.ancho / 2} ${t.alto / 2})`}`;
  const conecta = modo === "conecta";
  return (
    <g data-capa="destino" data-modo={modo} pointerEvents="none" transform={`translate(${vista.x} ${vista.y}) scale(${vista.zoom})`}>
      <path
        d={trazadoForma(f.forma, t.ancho, t.alto, { parametros: f.parametros, radio: f.estilo.radio })}
        transform={mover}
        fill={conecta ? COLOR_PEGADO : COLOR}
        fillOpacity={conecta ? 0.12 : 0.06}
        stroke={conecta ? COLOR_PEGADO : COLOR}
        strokeWidth={conecta ? 2.5 : 1.5}
        strokeDasharray={conecta ? undefined : "5 4"}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        data-destino={f.id}
      />
    </g>
  );
}

/** El conector que se crearía al soltar, de puerto a puerto, a rayas y con punta de flecha (vista previa de Y7). */
export function CapaConexionPrevia({ vista, previa }: { vista: Vista; previa: { desde: Punto; hasta: Punto } | null }): ReactElement | null {
  if (!previa) return null;
  const a = escenaAPantalla(vista, previa.desde);
  const b = escenaAPantalla(vista, previa.hasta);
  const largo = Math.hypot(b.x - a.x, b.y - a.y);
  // Punta de flecha en el extremo final, en la dirección del tramo.
  const ux = largo > 0 ? (b.x - a.x) / largo : 0;
  const uy = largo > 0 ? (b.y - a.y) / largo : 1;
  const punta = [
    `${b.x},${b.y}`,
    `${b.x - ux * 10 + uy * 5},${b.y - uy * 10 - ux * 5}`,
    `${b.x - ux * 10 - uy * 5},${b.y - uy * 10 + ux * 5}`,
  ].join(" ");
  return (
    <g data-capa="conexion-previa" pointerEvents="none">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLOR_PEGADO} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" />
      <circle cx={a.x} cy={a.y} r={4} fill={COLOR_PEGADO} />
      <polygon points={punta} fill={COLOR_PEGADO} />
    </g>
  );
}

/** Asas de la línea elegida: extremos (verdes si están pegados, naranja si están libres), puntos intermedios y puntos para crear uno. */
export function CapaAsasDeConector({ escena, linea, vista }: { escena: Escena; linea: Linea; vista: Vista }): ReactElement {
  const agarres = agarresDeConector(escena, linea);
  const aPantalla = (p: Punto): Punto => escenaAPantalla(vista, p);
  return (
    <g data-capa="asas-conector" pointerEvents="none">
      {agarres.map((a, i) => {
        const s = aPantalla(a.punto);
        if (a.tipo === "extremo") {
          const pegado = a.cual === "origen" ? linea.origen !== undefined : linea.destino !== undefined;
          const color = pegado ? COLOR_PEGADO : COLOR_LIBRE;
          return <circle key={`e${i}`} cx={s.x} cy={s.y} r={6} fill={color} stroke={color} strokeWidth={2} data-asa-conector={a.cual} data-pegado={pegado ? "si" : "no"} {...(pegado ? {} : { "data-extremo-libre": "" })} />;
        }
        if (a.tipo === "via") return <rect key={`v${i}`} x={s.x - 5} y={s.y - 5} width={10} height={10} fill={COLOR} stroke="#fff" strokeWidth={1.5} data-asa-conector={`via-${a.indice}`} />;
        return <circle key={`i${i}`} cx={s.x} cy={s.y} r={4} fill="#fff" fillOpacity={0.85} stroke={COLOR} strokeWidth={1.25} strokeDasharray="2 2" data-asa-conector={`insertar-${a.tramo}`} />;
      })}
    </g>
  );
}
