"use client";

import type { ReactElement } from "react";
import { puertosDeEscena, type Escena, type Linea, type Punto, type PuertoCercano } from "@lumina/drawing";
import { Button } from "@lumina/ui/button";
import { CornerDownRight, Minus, Spline } from "lucide-react";
import { agarresDeConector, cambiarEsquinas, cambiarExtremo, cambiarTrazado, EXTREMOS_OPCIONES, valorComun } from "./conectores.js";
import { escenaAPantalla, type Vista } from "./vista.js";

const COLOR = "#2563eb";
const COLOR_PEGADO = "#16a34a";

/** Puertos de las formas: puntos de unión que se ven al dibujar una línea, al arrastrar un extremo y al elegir una forma. */
export function CapaPuertos({
  escena,
  vista,
  formasElegidas,
  todas,
  objetivo,
}: {
  escena: Escena;
  vista: Vista;
  /** Ids de las formas elegidas: sus puertos se ven siempre. */
  formasElegidas: ReadonlySet<string>;
  /** Mostrar los puertos de todas las formas (con la herramienta de línea o arrastrando un extremo). */
  todas: boolean;
  objetivo: PuertoCercano | null;
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
          <circle key={`${p.elementoId}:${p.puerto}`} cx={s.x} cy={s.y} r={3.5} fill="#fff" stroke={COLOR} strokeWidth={1.25} data-puerto={`${p.elementoId}:${p.puerto}`} />
        );
      })}
    </g>
  );
}

/** Asas de la línea elegida: extremos (verdes si están pegados a una forma), puntos intermedios y puntos para crear uno. */
export function CapaAsasDeConector({ escena, linea, vista }: { escena: Escena; linea: Linea; vista: Vista }): ReactElement {
  const agarres = agarresDeConector(escena, linea);
  const aPantalla = (p: Punto): Punto => escenaAPantalla(vista, p);
  return (
    <g data-capa="asas-conector" pointerEvents="none">
      {agarres.map((a, i) => {
        const s = aPantalla(a.punto);
        if (a.tipo === "extremo") {
          const pegado = a.cual === "origen" ? linea.origen !== undefined : linea.destino !== undefined;
          return <circle key={`e${i}`} cx={s.x} cy={s.y} r={6} fill={pegado ? COLOR_PEGADO : "#fff"} stroke={pegado ? COLOR_PEGADO : COLOR} strokeWidth={2} data-asa-conector={a.cual} data-pegado={pegado ? "si" : "no"} />;
        }
        if (a.tipo === "via") return <rect key={`v${i}`} x={s.x - 5} y={s.y - 5} width={10} height={10} fill={COLOR} stroke="#fff" strokeWidth={1.5} data-asa-conector={`via-${a.indice}`} />;
        return <circle key={`i${i}`} cx={s.x} cy={s.y} r={4} fill="#fff" fillOpacity={0.85} stroke={COLOR} strokeWidth={1.25} strokeDasharray="2 2" data-asa-conector={`insertar-${a.tramo}`} />;
      })}
    </g>
  );
}

const selectClase = "h-8 rounded-md border bg-background px-2 text-xs";

/** Barra flotante con lo propio de un conector: trazado, esquinas y extremos. Cada cambio es una sola entrada de historial. */
export function BarraConector({ escena, lineas, onCambiar }: { escena: Escena; lineas: readonly Linea[]; onCambiar: (nueva: Escena) => void }): ReactElement | null {
  if (lineas.length === 0) return null;
  const ids = lineas.map((l) => l.id);
  const trazado = valorComun(lineas, (l) => l.trazado);
  const redondeadas = valorComun(lineas, (l) => l.estilo.radio > 0);
  const inicio = valorComun(lineas, (l) => l.inicio);
  const fin = valorComun(lineas, (l) => l.fin);
  const boton = (valor: "recto" | "ortogonal" | "curvo", etiqueta: string, icono: ReactElement): ReactElement => (
    <Button key={valor} type="button" size="icon" variant={trazado === valor ? "secondary" : "ghost"} className="size-8" title={etiqueta} aria-label={etiqueta} aria-pressed={trazado === valor} onClick={() => onCambiar(cambiarTrazado(escena, ids, valor))}>
      {icono}
    </Button>
  );
  const selector = (cual: "inicio" | "fin", valor: string | null): ReactElement => (
    <label className="flex items-center gap-1 text-xs text-muted-foreground">
      {cual === "inicio" ? "Inicio" : "Final"}
      <select className={selectClase} value={valor ?? ""} aria-label={cual === "inicio" ? "Extremo inicial" : "Extremo final"} onChange={(e) => onCambiar(cambiarExtremo(escena, ids, cual, e.target.value as (typeof EXTREMOS_OPCIONES)[number]["valor"]))}>
        {valor === null ? <option value="" disabled>Mixto</option> : null}
        {EXTREMOS_OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div role="toolbar" aria-label="Propiedades del conector" data-barra-conector="" className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card px-2 py-1 shadow-md" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <span className="text-xs font-medium">{lineas.length > 1 ? `${lineas.length} conectores` : "Conector"}</span>
      <div role="group" aria-label="Trazado" className="flex">
        {boton("recto", "Recto", <Minus />)}
        {boton("ortogonal", "En ángulo recto", <CornerDownRight />)}
        {boton("curvo", "Curvo", <Spline />)}
      </div>
      {trazado === "ortogonal" || trazado === null ? (
        <Button type="button" size="sm" variant={redondeadas ? "secondary" : "ghost"} className="h-8 text-xs" aria-pressed={redondeadas === true} title="Esquinas redondeadas" onClick={() => onCambiar(cambiarEsquinas(escena, ids, redondeadas !== true))}>
          Esquinas redondeadas
        </Button>
      ) : null}
      {selector("inicio", inicio)}
      {selector("fin", fin)}
    </div>
  );
}
