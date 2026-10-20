"use client";

// ─── Cinta del editor de dibujo (Y2) ──────────────────────────────────────────
// Arma las pestañas de la cinta (`@lumina/ui/ribbon`) desde el registro único de comandos: cada botón es
// un comando del registro, así que su etiqueta, atajo y estado (habilitado, activo) salen de un solo sitio.
// Pestañas: Inicio · Insertar · Organizar · Vista, y la contextual «Formato de conector» cuando lo elegido
// son líneas. «Formato de forma» llega con la fase D (estilos y mini barra): una pestaña sin contenido no se muestra (DY1).

import type { ReactElement, ReactNode } from "react";
import { formasPorGrupo, trazadoForma, type Escena, type Linea, type TipoForma } from "@lumina/drawing";
import { QuickAccessBar, Ribbon, RibbonButton, RibbonGroup } from "@lumina/ui/ribbon";
import { CornerDownRight, Minus, Spline } from "lucide-react";
import { comando, estadoComando, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { cambiarEsquinas, cambiarExtremo, cambiarTrazado, EXTREMOS_OPCIONES, valorComun } from "./conectores.js";

export const PESTANA_INICIO = "inicio";
export const PESTANA_CONECTOR = "conector";

const ANCHO_MINIATURA = 30;
const ALTO_MINIATURA = 22;

function Miniatura({ forma }: { forma: TipoForma }): ReactElement {
  return (
    <svg width={ANCHO_MINIATURA} height={ALTO_MINIATURA} viewBox={`-2 -2 ${ANCHO_MINIATURA + 4} ${ALTO_MINIATURA + 4}`} aria-hidden="true" className="overflow-visible">
      <path d={trazadoForma(forma, ANCHO_MINIATURA, ALTO_MINIATURA)} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

export interface CintaEditorProps {
  contexto: ContextoComando;
  /** Conectores elegidos (la pestaña «Formato de conector» aparece si hay alguno). */
  lineas: readonly Linea[];
  pestana: string;
  onPestana: (id: string) => void;
  /** Un botón o un atajo piden lo mismo: una orden que el editor ejecuta. */
  onOrden: (orden: Orden) => void;
  /** Cambio sobre los conectores elegidos: una sola entrada de historial. */
  onCambiarConector: (nueva: Escena) => void;
  /** F6 más allá de la cinta: el foco vuelve al lienzo. */
  onSalirALienzo: () => void;
}

export function CintaEditor({ contexto, lineas, pestana, onPestana, onOrden, onCambiarConector, onSalirALienzo }: CintaEditorProps): ReactElement {
  /** Botón de un comando del registro. */
  const boton = (id: string, size: "large" | "medium" | "small" = "medium", icono?: ReactNode): ReactElement => {
    const def = comando(id);
    const estado = estadoComando(def, contexto);
    const Icono = def.icono;
    return (
      <RibbonButton
        key={id}
        label={def.etiqueta}
        size={size}
        icon={icono ?? (Icono ? <Icono /> : undefined)}
        shortcut={textoDeAtajo(def)}
        active={estado.activo}
        disabled={!estado.habilitado}
        disabledReason={estado.motivo || undefined}
        data-comando={id}
        onClick={() => onOrden(def.orden)}
      />
    );
  };

  const gruposDeFormas = formasPorGrupo().map(({ grupo, nombre, formas }) => (
    <RibbonGroup key={grupo} label={nombre}>
      {formas.map((f) => boton(`forma-${f.id}`, "small", <Miniatura forma={f.id} />))}
    </RibbonGroup>
  ));

  const trazado = valorComun(lineas, (l) => l.trazado);
  const redondeadas = valorComun(lineas, (l) => l.estilo.radio > 0);
  const inicio = valorComun(lineas, (l) => l.inicio);
  const fin = valorComun(lineas, (l) => l.fin);
  const ids = lineas.map((l) => l.id);
  const escena = contexto.escena;
  const botonTrazado = (valor: "recto" | "ortogonal" | "curvo", etiqueta: string, icono: ReactElement): ReactElement => (
    <RibbonButton key={valor} label={etiqueta} size="medium" icon={icono} active={trazado === valor} onClick={() => onCambiarConector(cambiarTrazado(escena, ids, valor))} />
  );
  const selectorExtremo = (cual: "inicio" | "fin", valor: string | null): ReactElement => (
    <label key={cual} className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
      {cual === "inicio" ? "Inicio" : "Final"}
      <select
        className="h-7 rounded-md border bg-background px-1.5 text-xs text-foreground"
        value={valor ?? ""}
        aria-label={cual === "inicio" ? "Extremo inicial" : "Extremo final"}
        onChange={(e) => onCambiarConector(cambiarExtremo(escena, ids, cual, e.target.value as (typeof EXTREMOS_OPCIONES)[number]["valor"]))}
      >
        {valor === null ? (
          <option value="" disabled>
            Mixto
          </option>
        ) : null}
        {EXTREMOS_OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );

  const tabs = [
    {
      id: PESTANA_INICIO,
      label: "Inicio",
      content: (
        <>
          <RibbonGroup label="Herramientas">
            {boton("seleccionar", "large")}
            {boton("linea", "large")}
            {boton("flecha", "large")}
            {boton("texto", "large")}
          </RibbonGroup>
          <RibbonGroup label="Edición">
            {boton("duplicar", "large")}
            {boton("eliminar", "large")}
          </RibbonGroup>
        </>
      ),
    },
    { id: "insertar", label: "Insertar", content: <>{gruposDeFormas}</> },
    {
      id: "organizar",
      label: "Organizar",
      content: (
        <>
          <RibbonGroup label="Agrupar">
            {boton("agrupar", "large")}
            {boton("desagrupar", "large")}
          </RibbonGroup>
          <RibbonGroup label="Orden">
            {boton("orden-frente")}
            {boton("orden-subir")}
            {boton("orden-bajar")}
            {boton("orden-fondo")}
          </RibbonGroup>
          <RibbonGroup label="Alinear">
            {boton("alinear-izquierda", "small")}
            {boton("alinear-centro", "small")}
            {boton("alinear-derecha", "small")}
            {boton("alinear-arriba", "small")}
            {boton("alinear-medio", "small")}
            {boton("alinear-abajo", "small")}
          </RibbonGroup>
          <RibbonGroup label="Distribuir">
            {boton("distribuir-horizontal", "small")}
            {boton("distribuir-vertical", "small")}
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "vista",
      label: "Vista",
      content: (
        <>
          <RibbonGroup label="Zoom">
            {boton("alejar", "small")}
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground" data-dibujo-zoom="">
              {Math.round(contexto.zoom * 100)}%
            </span>
            {boton("acercar", "small")}
            {boton("ajustar-vista", "small")}
          </RibbonGroup>
          <RibbonGroup label="Ayudas">
            {boton("cuadricula", "large")}
            {boton("imantar", "large")}
          </RibbonGroup>
        </>
      ),
    },
    ...(lineas.length > 0
      ? [
          {
            id: PESTANA_CONECTOR,
            label: "Formato de conector",
            contextual: true,
            content: (
              <div data-cinta-conector="" className="flex items-stretch">
                <RibbonGroup label={lineas.length > 1 ? `Trazado (${lineas.length} conectores)` : "Trazado"}>
                  {botonTrazado("recto", "Recto", <Minus />)}
                  {botonTrazado("ortogonal", "En ángulo recto", <CornerDownRight />)}
                  {botonTrazado("curvo", "Curvo", <Spline />)}
                  {trazado === "ortogonal" || trazado === null ? (
                    <RibbonButton label="Esquinas redondeadas" size="medium" active={redondeadas === true} onClick={() => onCambiarConector(cambiarEsquinas(escena, ids, redondeadas !== true))} />
                  ) : null}
                </RibbonGroup>
                <RibbonGroup label="Extremos">
                  {selectorExtremo("inicio", inicio)}
                  {selectorExtremo("fin", fin)}
                </RibbonGroup>
              </div>
            ),
          },
        ]
      : []),
  ];

  const listo = comando("listo");
  return (
    <Ribbon
      tabs={tabs}
      activeTab={pestana}
      onActiveTabChange={onPestana}
      onNavigateOut={onSalirALienzo}
      quickAccess={
        <QuickAccessBar label="Acceso rápido">
          {boton("deshacer", "small")}
          {boton("rehacer", "small")}
        </QuickAccessBar>
      }
      trailing={
        <RibbonButton label={listo.etiqueta} size="medium" icon={listo.icono ? <listo.icono /> : undefined} data-dibujo-listo="" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => onOrden(listo.orden)} />
      }
    />
  );
}
