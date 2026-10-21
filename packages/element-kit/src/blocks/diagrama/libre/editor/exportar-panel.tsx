"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import type { Escena } from "@lumina/drawing";
import { Button } from "@lumina/ui/button";
import { Download } from "lucide-react";
import { ESCALAS_PNG, ESCALA_PNG_POR_DEFECTO, descargarEscena, type FormatoEscena, type TemaEscena } from "../exportar.js";

type Estado = { tipo: "inactivo" } | { tipo: "ocupado" } | { tipo: "listo"; nombre: string } | { tipo: "error"; mensaje: string };

/**
 * «Exportar» de la barra del editor: descarga la escena completa (lo oculto no sale) como SVG o PNG, con tema claro
 * u oscuro, con o sin fondo. Se despliega bajo el botón, sin ventana flotante.
 */
export function BotonExportar({ escena, titulo, descripcion }: { escena: Escena; titulo?: string; descripcion?: string }): ReactElement {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [formato, setFormato] = useState<FormatoEscena>("svg");
  const [tema, setTema] = useState<TemaEscena>("claro");
  const [fondo, setFondo] = useState(true);
  const [escala, setEscala] = useState<number>(ESCALA_PNG_POR_DEFECTO);
  const [estado, setEstado] = useState<Estado>({ tipo: "inactivo" });
  const raiz = useRef<HTMLDivElement | null>(null);
  const activo = useRef(true);
  useEffect(() => {
    activo.current = true;
    return () => {
      activo.current = false;
    };
  }, []);

  // Un clic fuera lo cierra.
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e: PointerEvent): void => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera, true);
    return () => document.removeEventListener("pointerdown", fuera, true);
  }, [abierto]);

  const exportar = async (): Promise<void> => {
    if (estado.tipo === "ocupado") return;
    setEstado({ tipo: "ocupado" });
    try {
      const nombre = await descargarEscena(escena, { formato, tema, fondo, escala, ...(titulo ? { titulo } : {}), ...(descripcion ? { descripcion } : {}) });
      if (activo.current) setEstado({ tipo: "listo", nombre });
    } catch (error) {
      if (activo.current) setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : "No se pudo exportar el dibujo." });
    }
  };

  const opcion = <T extends string>(nombre: string, valor: T, actual: T, etiqueta: string, cambiar: (v: T) => void): ReactElement => (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input type="radio" name={`${id}-${nombre}`} value={valor} checked={actual === valor} onChange={() => cambiar(valor)} />
      {etiqueta}
    </label>
  );

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(e) => {
        // Lo que se teclea aquí no es del editor (Escape cerraría el dibujo entero).
        e.stopPropagation();
        if (e.key === "Escape" && abierto) setAbierto(false);
      }}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <Button type="button" size="sm" variant="outline" aria-expanded={abierto} aria-haspopup="dialog" data-dibujo-exportar="" onClick={() => setAbierto((v) => !v)}>
        <Download /> Exportar
      </Button>
      {abierto ? (
        <div
          role="dialog"
          aria-label="Exportar el dibujo"
          data-dibujo-exportar-panel=""
          className="absolute right-0 top-full z-30 mt-1 w-72 space-y-3 rounded-md border bg-card p-3 text-xs text-card-foreground shadow-md"
        >
          <fieldset className="space-y-1">
            <legend className="mb-1 text-muted-foreground">Formato</legend>
            <div className="flex gap-4">
              {opcion("formato", "svg", formato, "SVG (vectorial)", setFormato)}
              {opcion("formato", "png", formato, "PNG (imagen)", setFormato)}
            </div>
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="mb-1 text-muted-foreground">Tema</legend>
            <div className="flex gap-4">
              {opcion("tema", "claro", tema, "Claro", setTema)}
              {opcion("tema", "oscuro", tema, "Oscuro", setTema)}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={fondo} onChange={(e) => setFondo(e.target.checked)} />
            Incluir el fondo
          </label>
          {formato === "png" ? (
            <label className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Resolución</span>
              <select aria-label="Resolución del PNG" className="h-8 rounded-md border bg-background px-2" value={escala} onChange={(e) => setEscala(Number(e.target.value))}>
                {ESCALAS_PNG.map((n) => (
                  <option key={n} value={n}>
                    {n}× {n === ESCALA_PNG_POR_DEFECTO ? "(recomendada)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="text-[11px] leading-snug text-muted-foreground">Sale el dibujo completo, sin las capas ocultas. Los colores propios no cambian con el tema; solo los del tema de la app.</p>
          <Button type="button" size="sm" className="w-full" disabled={estado.tipo === "ocupado"} onClick={() => void exportar()}>
            <Download /> {estado.tipo === "ocupado" ? "Preparando…" : "Descargar"}
          </Button>
          <p role="status" aria-live="polite" data-dibujo-exportar-estado="" className={estado.tipo === "error" ? "text-destructive" : "text-muted-foreground"}>
            {estado.tipo === "listo" ? `Descargado: ${estado.nombre}` : estado.tipo === "error" ? estado.mensaje : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
