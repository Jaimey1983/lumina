"use client";

import { useState, type KeyboardEvent, type ReactElement } from "react";
import { iconosPorGrupo, trazadoForma, type TipoForma, type TipoIcono } from "@lumina/drawing";
import { Popover, PopoverContent, PopoverTrigger } from "@lumina/ui/popover";
import { RibbonButton } from "@lumina/ui/ribbon";
import { Smile } from "lucide-react";
import { normalizarBusqueda } from "./buscar-comandos.js";
import { comando, estadoComando, type ContextoComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { PALABRAS_DE_ICONO } from "./sinonimos-comandos.js";

/** Columnas de la cuadrícula: las flechas de arriba y abajo saltan esta cantidad de botones. */
const COLUMNAS_ICONOS = 6;
/** Lado de la miniatura: cuadrada, porque el trazado de un icono escala por eje y una caja apaisada lo estiraría. */
const LADO_MINIATURA = 22;

function MiniaturaIcono({ forma }: { forma: TipoForma }): ReactElement {
  return (
    <svg width={LADO_MINIATURA} height={LADO_MINIATURA} viewBox={`-2 -2 ${LADO_MINIATURA + 4} ${LADO_MINIATURA + 4}`} aria-hidden="true" className="overflow-visible">
      <path d={trazadoForma(forma, LADO_MINIATURA, LADO_MINIATURA)} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** ¿El icono responde a la consulta? Por su nombre y por sus palabras, sin distinguir acentos ni mayúsculas. */
function coincide(consulta: string, nombre: string, id: TipoIcono): boolean {
  if (consulta === "") return true;
  const textos = [nombre, "icono", "simbolo", ...PALABRAS_DE_ICONO[id]].map(normalizarBusqueda);
  return textos.some((t) => t.includes(consulta));
}

export interface GaleriaIconosProps {
  contexto: ContextoComando;
  onOrden: (orden: Orden) => void;
  /** `Enter` sobre un icono: lo coloca al centro de lo que se ve. */
  onColocarForma?: (forma: TipoForma) => void;
}

export interface ContenidoGaleriaProps extends GaleriaIconosProps {
  /** Se llama tras elegir o colocar un icono: la galería se cierra. */
  alElegir: () => void;
}

/**
 * Lo de adentro de la galería (Y32b): el campo de búsqueda y los 5 grupos de botones. Vive aparte del `Popover` para poder probarse sin
 * abrirlo (abrir un `Popover` de Radix en jsdom tarda decenas de segundos). La búsqueda es estado de este componente: al cerrarse la
 * galería se desmonta y se borra sola.
 */
export function ContenidoGaleriaIconos({ contexto, onOrden, onColocarForma, alElegir }: ContenidoGaleriaProps): ReactElement {
  const [texto, setTexto] = useState("");
  const consulta = normalizarBusqueda(texto);
  const grupos = iconosPorGrupo()
    .map((g) => ({ ...g, formas: g.formas.filter((f) => coincide(consulta, f.nombre, f.id as TipoIcono)) }))
    .filter((g) => g.formas.length > 0);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    e.stopPropagation(); // ni las flechas ni las letras llegan al editor (ni Escape lo cierra)
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? COLUMNAS_ICONOS : e.key === "ArrowUp" ? -COLUMNAS_ICONOS : 0;
    if (paso === 0) return;
    const botones = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-forma]")];
    const i = botones.indexOf(e.target as HTMLButtonElement);
    if (i === -1) return;
    e.preventDefault();
    botones[Math.min(botones.length - 1, Math.max(0, i + paso))]?.focus();
  };

  return (
    <div data-galeria-iconos-contenido="" onKeyDown={alTeclear}>
      <input
        type="search"
        aria-label="Buscar icono"
        placeholder="Buscar icono"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="mb-2 h-8 w-full rounded-md border bg-background px-2 text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      />
      {grupos.length === 0 ? (
        <p role="status" className="px-1 py-3 text-center text-xs text-muted-foreground">
          No hay iconos con ese nombre
        </p>
      ) : (
        grupos.map((g) => (
          <div key={g.id} role="group" aria-label={g.nombre} className="mb-2 last:mb-0">
            <p className="mb-1 text-[11px] text-muted-foreground">{g.nombre}</p>
            <div className="grid grid-cols-6 gap-1">
              {g.formas.map((f) => {
                const def = comando(`forma-${f.id}`);
                const estado = estadoComando(def, contexto);
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-forma={f.id}
                    data-comando={def.id}
                    title={f.nombre}
                    aria-label={def.etiqueta}
                    aria-pressed={estado.activo === true}
                    className="flex h-9 items-center justify-center rounded-md border outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-accent aria-pressed:ring-2 aria-pressed:ring-primary"
                    onClick={() => {
                      onOrden(def.orden);
                      alElegir();
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || e.ctrlKey || e.metaKey || e.altKey || !onColocarForma) return;
                      e.preventDefault(); // sin esto el Enter también «haría clic» y elegiría la herramienta
                      onColocarForma(f.id);
                      alElegir();
                    }}
                  >
                    <MiniaturaIcono forma={f.id} />
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * «Iconos» (Y32b): un botón que abre una galería con los 30 iconos del catálogo, en sus 5 grupos y con un campo para buscarlos. Cada
 * icono es un comando del registro («Insertar icono Persona»): un clic elige la herramienta de esa forma (se coloca con un clic en el
 * lienzo) y `Enter` la coloca al centro. Las flechas recorren los botones; `Escape` cierra. No se arrastran desde acá (DY92).
 */
export function GaleriaIconos(props: GaleriaIconosProps): ReactElement {
  const [abierto, setAbierto] = useState(false);
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <RibbonButton label="Iconos" size="large" icon={<Smile />} data-galeria-iconos="" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Iconos" className="max-h-[30rem] w-80 overflow-y-auto p-2">
        <ContenidoGaleriaIconos {...props} alElegir={() => setAbierto(false)} />
      </PopoverContent>
    </Popover>
  );
}
