"use client";

// Buscador de comandos Ctrl+K (Y5): resultados y atajos salen del registro único.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { COMANDOS, estadoComando, textoDeAtajo, type ContextoComando } from "./comandos-registro.js";
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
  useEffect(() => {
    if (abierto) {
      setConsulta("");
      setIndice(0);
      requestAnimationFrame(() => entradaRef.current?.focus());
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const el = entradaRef.current;
    if (!el) return;
    const alFlecha = (e: globalThis.KeyboardEvent): void => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      e.stopPropagation();
      const n = buscarComandos(consulta, COMANDOS).length;
      if (n === 0) return;
      if (e.key === "Home") setIndice(0);
      else if (e.key === "End") setIndice(n - 1);
      else if (e.key === "ArrowDown") setIndice((i) => (i + 1) % n);
      else setIndice((i) => (i - 1 + n) % n);
    };
    el.addEventListener("keydown", alFlecha);
    return () => el.removeEventListener("keydown", alFlecha);
  }, [abierto, consulta]);

  const resultados = useMemo(() => buscarComandos(consulta, COMANDOS), [consulta]);
  const total = resultados.length;
  const activo = total > 0 ? Math.min(indice, total - 1) : -1;

  useFocoAtrapado({
    abierto,
    contenedorRef: dialogoRef,
    alCerrar: () => {
      onCerrar();
      focoLienzo();
    },
    focoRespaldo: focoLienzo,
  });

  if (!abierto) return null;

  const ctx = contexto;
  const qNorm = normalizarBusqueda(consulta);
  const anuncio = qNorm === "" ? `${total} resultados` : total === 0 ? "Sin resultados" : `${total} resultados`;

  const ejecutarActivo = (): void => {
    if (activo < 0) return;
    const def = resultados[activo]?.comando;
    if (!def) return;
    const est = estadoComando(def, ctx);
    if (!est.habilitado) return;
    ejecutarOrden(def.orden);
    onCerrar();
    focoLienzo();
  };

  const alTeclaEntrada = (e: KeyboardEvent<HTMLInputElement>): void => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      ejecutarActivo();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCerrar();
      focoLienzo();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[110] flex items-start justify-center bg-black/40 pt-[12vh]">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar comando"
        className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <form
          className="border-b"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            ejecutarActivo();
          }}
        >
          <input
            ref={entradaRef}
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-controls={listaId}
            aria-activedescendant={activo >= 0 ? `${listaId}-opt-${activo}` : undefined}
            aria-autocomplete="list"
            placeholder="Buscar comando…"
            className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setIndice(0);
            }}
            onKeyDown={alTeclaEntrada}
          />
        </form>
        <div aria-live="polite" className="sr-only">{anuncio}</div>
        {qNorm !== "" && total === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Ningún comando coincide con “{consulta.trim()}”</p>
        ) : (
          <ul id={listaId} role="listbox" className="max-h-[min(50vh,320px)] overflow-y-auto py-1">
            {resultados.map(({ comando: def }, i) => {
              const est = estadoComando(def, ctx);
              const Icono = def.icono;
              const atajo = textoDeAtajo(def);
              const seleccionado = i === activo;
              return (
                <li key={def.id}>
                  <button
                    type="button"
                    id={`${listaId}-opt-${i}`}
                    role="option"
                    data-comando={def.id}
                    aria-selected={seleccionado}
                    aria-disabled={!est.habilitado}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${seleccionado ? "bg-accent" : ""} ${est.habilitado ? "" : "opacity-50"}`}
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => {
                      if (!est.habilitado) return;
                      ejecutarOrden(def.orden);
                      onCerrar();
                      focoLienzo();
                    }}
                  >
                    {Icono ? <Icono className="size-4 shrink-0" aria-hidden /> : <span className="size-4 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{def.etiqueta}</span>
                    {!est.habilitado && est.motivo ? <span className="truncate text-xs text-muted-foreground">{est.motivo}</span> : null}
                    {atajo ? <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{atajo}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
