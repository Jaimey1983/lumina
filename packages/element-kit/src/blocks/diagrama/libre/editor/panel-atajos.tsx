"use client";

// Panel de atajos «?» (Y5): listado generado del registro, agrupado como la cinta.

import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactElement } from "react";
import { Kbd } from "@lumina/ui/kbd";
import { COMANDOS, textosDeAtajos, type DefinicionComando } from "./comandos-registro.js";
import { ATAJOS_DE_NAVEGACION } from "./comandos.js";
import { PESTANA_POR_COMANDO, ORDEN_PESTANAS_ATAJOS } from "./cinta-editor.js";
import { useFocoAtrapado } from "./foco-atrapado.js";

export interface PanelAtajosProps {
  abierto: boolean;
  onCerrar: () => void;
  focoLienzo: () => void;
}

function filasAtajo(def: DefinicionComando): ReactElement {
  const textos = textosDeAtajos(def);
  return (
    <li key={def.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1 text-sm">
      <span>{def.etiqueta}</span>
      <span className="flex flex-wrap items-center gap-1 text-muted-foreground">
        {textos.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden>·</span> : null}
            {t.split("+").map((parte, j) => (
              <span key={`${t}-${j}`} className="inline-flex items-center gap-0.5">
                {j > 0 ? <span className="text-xs">+</span> : null}
                <Kbd size="sm">{parte}</Kbd>
              </span>
            ))}
          </span>
        ))}
      </span>
    </li>
  );
}

export function PanelAtajos({ abierto, onCerrar, focoLienzo }: PanelAtajosProps): ReactElement | null {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useFocoAtrapado({
    abierto,
    contenedorRef: dialogoRef,
    alCerrar: () => {
      onCerrar();
      focoLienzo();
    },
    focoRespaldo: focoLienzo,
    alEscape: (e) => {
      e.stopPropagation();
      return false;
    },
  });

  useEffect(() => {
    if (abierto) requestAnimationFrame(() => cerrarRef.current?.focus());
  }, [abierto]);

  const porPestana = useMemo(() => {
    const mapa = new Map<string, DefinicionComando[]>();
    for (const c of COMANDOS) {
      if (!c.atajos?.length) continue;
      const pestana = PESTANA_POR_COMANDO[c.id] ?? "Edición general";
      const lista = mapa.get(pestana) ?? [];
      lista.push(c);
      mapa.set(pestana, lista);
    }
    for (const [, lista] of mapa) lista.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"));
    return mapa;
  }, []);

  if (!abierto) return null;

  const alTecla = (e: KeyboardEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (e.key === "?" && e.shiftKey) {
      e.preventDefault();
      onCerrar();
      focoLienzo();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCerrar();
      focoLienzo();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        className="pointer-events-auto flex max-h-[min(85vh,560px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg"
        onKeyDownCapture={alTecla}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">Atajos de teclado</h2>
          <button ref={cerrarRef} type="button" className="rounded-md px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { onCerrar(); focoLienzo(); }}>
            Cerrar panel
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-3">
          {ORDEN_PESTANAS_ATAJOS.filter((p) => p !== "Navegación y ratón").map((titulo) => {
            const cmds = porPestana.get(titulo);
            if (!cmds?.length) return null;
            return (
              <section key={titulo} role="group" aria-label={titulo} className="mb-4 last:mb-0">
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</h3>
                <ul className="divide-y divide-border/60">{cmds.map(filasAtajo)}</ul>
              </section>
            );
          })}
          <section role="group" aria-label="Navegación y ratón" className="mb-0">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Navegación y ratón</h3>
            <ul className="divide-y divide-border/60">
              {ATAJOS_DE_NAVEGACION.map((f) => (
                <li key={f.descripcion} className="flex flex-wrap items-baseline justify-between gap-x-4 py-1 text-sm">
                  <span>{f.descripcion}</span>
                  <span className="text-muted-foreground">{f.etiquetaTeclas}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
