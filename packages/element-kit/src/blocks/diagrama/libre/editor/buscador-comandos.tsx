"use client";

// Buscador de comandos Ctrl+K (Y5): resultados y atajos salen del registro único.

import { useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";
import { COMANDOS, estadoComando, textoDeAtajo, type ContextoComando, type DefinicionComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { buscarComandos, normalizarBusqueda } from "./buscar-comandos.js";
import { useFocoAtrapado } from "./foco-atrapado.js";

export interface BuscadorComandosProps {
  abierto: boolean;
  onCerrar: () => void;
  contexto: ContextoComando;
  ejecutarOrden: (orden: Orden) => void;
  focoLienzo: () => void;
}

export function BuscadorComandos({ abierto, onCerrar, contexto, ejecutarOrden, focoLienzo }: BuscadorComandosProps): ReactElement | null {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLInputElement>(null);
  const listaId = useId();
  const [consulta, setConsulta] = useState("");
  const [indice, setIndice] = useState(0);
  /** El resaltado solo se desplaza a la vista si lo movió el teclado: con el ratón, la fila ya está bajo el cursor. */
  const movidoPorTeclado = useRef(false);

  const resultados = useMemo(() => buscarComandos(consulta, COMANDOS), [consulta]);
  const total = resultados.length;
  const activo = total > 0 ? Math.min(indice, total - 1) : -1;

  // Lo que necesitan los manejadores nativos, siempre al día sin reengancharlos en cada render.
  const vivo = useRef({ resultados, activo, contexto, ejecutarOrden, onCerrar, focoLienzo });
  vivo.current = { resultados, activo, contexto, ejecutarOrden, onCerrar, focoLienzo };

  const { soltarSinRetorno } = useFocoAtrapado({
    abierto,
    contenedorRef: dialogoRef,
    alCerrar: onCerrar,
    focoRespaldo: focoLienzo,
  });

  /** Ejecuta un comando si está habilitado: cierra el buscador y lleva el foco al lienzo (no al botón desde el que se abrió). */
  const ejecutar = (def: DefinicionComando | undefined): void => {
    if (!def) return;
    const v = vivo.current;
    if (!estadoComando(def, v.contexto).habilitado) return;
    soltarSinRetorno();
    v.ejecutarOrden(def.orden);
    v.onCerrar();
    v.focoLienzo();
  };
  const ejecutarRef = useRef(ejecutar);
  ejecutarRef.current = ejecutar;

  // Cada vez que se cierra, la próxima apertura empieza de cero.
  useEffect(() => {
    if (!abierto) {
      setConsulta("");
      setIndice(0);
    }
  }, [abierto]);

  // Teclado del campo (nativo: el diálogo retiene las teclas antes de que lleguen a React).
  useEffect(() => {
    if (!abierto) return;
    const el = entradaRef.current;
    if (!el) return;
    const alTecla = (e: globalThis.KeyboardEvent): void => {
      const v = vivo.current;
      if (e.key === "Enter") {
        if (e.isComposing) return; // con un método de entrada (IME), Enter confirma la composición, no ejecuta
        e.preventDefault();
        ejecutarRef.current(v.resultados[v.activo]?.comando);
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const n = v.resultados.length;
      if (n === 0) return;
      movidoPorTeclado.current = true;
      if (e.key === "Home") setIndice(0);
      else if (e.key === "End") setIndice(n - 1);
      else if (e.key === "ArrowDown") setIndice((i) => (i + 1) % n);
      else setIndice((i) => (i - 1 + n) % n);
    };
    el.addEventListener("keydown", alTecla);
    return () => el.removeEventListener("keydown", alTecla);
  }, [abierto]);

  // La fila resaltada con el teclado se mantiene a la vista (con 51 comandos la lista desplaza).
  useEffect(() => {
    if (!abierto || activo < 0 || !movidoPorTeclado.current) return;
    movidoPorTeclado.current = false;
    document.getElementById(`${listaId}-opt-${activo}`)?.scrollIntoView?.({ block: "nearest" });
  }, [abierto, activo, listaId]);

  if (!abierto) return null;

  const qNorm = normalizarBusqueda(consulta);
  const anuncio = qNorm !== "" && total === 0 ? "Sin resultados" : `${total} resultados`;
  const hayLista = !(qNorm !== "" && total === 0);

  return (
    // El fondo recoge el clic: un clic fuera solo cierra el buscador y no llega a lo que haya debajo (la cinta, el lienzo).
    <div className="pointer-events-auto absolute inset-0 z-[110] flex items-start justify-center bg-black/40 pt-[12vh]" data-buscador-fondo="">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar comando"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg"
      >
        <input
          ref={entradaRef}
          type="text"
          role="combobox"
          aria-expanded={hayLista}
          aria-controls={listaId}
          aria-activedescendant={activo >= 0 ? `${listaId}-opt-${activo}` : undefined}
          aria-autocomplete="list"
          placeholder="Buscar comando…"
          className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setIndice(0);
          }}
        />
        <div aria-live="polite" className="sr-only">
          {anuncio}
        </div>
        {hayLista ? (
          <div id={listaId} role="listbox" aria-label="Comandos" className="max-h-[min(50vh,320px)] overflow-y-auto py-1">
            {resultados.map(({ comando: def }, i) => {
              const est = estadoComando(def, contexto);
              const Icono = def.icono;
              const atajo = textoDeAtajo(def);
              const seleccionado = i === activo;
              return (
                // `tabIndex={-1}`: el foco se queda en el campo y las flechas recorren las opciones (patrón combobox).
                <button
                  key={def.id}
                  type="button"
                  tabIndex={-1}
                  id={`${listaId}-opt-${i}`}
                  role="option"
                  data-comando={def.id}
                  aria-selected={seleccionado}
                  aria-disabled={!est.habilitado}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${seleccionado ? "bg-accent" : ""} ${est.habilitado ? "" : "opacity-50"}`}
                  onMouseEnter={() => {
                    movidoPorTeclado.current = false;
                    setIndice(i);
                  }}
                  onClick={() => ejecutar(def)}
                >
                  {Icono ? <Icono className="size-4 shrink-0" aria-hidden /> : <span className="size-4 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{def.etiqueta}</span>
                  {!est.habilitado && est.motivo ? <span className="truncate text-xs text-muted-foreground">{est.motivo}</span> : null}
                  {atajo ? <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{atajo}</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground">Ningún comando coincide con “{consulta.trim()}”</p>
        )}
      </div>
    </div>
  );
}
