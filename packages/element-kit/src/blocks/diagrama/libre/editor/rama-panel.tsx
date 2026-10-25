"use client";

import type { ReactElement } from "react";
import { hijosDe, tieneHijos, type Escena } from "@lumina/drawing";
import { CollapsibleSection } from "@lumina/ui/collapsible-section";

/** Cuántas formas cuelgan de `id` (sus hijos, los hijos de sus hijos…), sin contar la propia; un ciclo no se cuenta dos veces. */
export function descendientesDe(escena: Escena, id: string): number {
  const vistos = new Set<string>([id]);
  const cola = [id];
  for (let i = 0; i < cola.length; i++) {
    for (const h of hijosDe(escena, cola[i] as string)) {
      if (vistos.has(h)) continue;
      vistos.add(h);
      cola.push(h);
    }
  }
  return vistos.size - 1;
}

/** Las formas elegidas que tienen hijos: sobre ellas actúa «Plegar o desplegar rama». */
export const ramasElegidas = (escena: Escena, seleccion: readonly string[]): string[] =>
  escena.elementos.filter((e) => e.tipo === "forma" && seleccion.includes(e.id) && tieneHijos(escena, e.id)).map((e) => e.id);

export interface SeccionRamaProps {
  escena: Escena;
  seleccion: readonly string[];
  /** La misma orden que el atajo y la cinta: el panel no tiene lógica propia. */
  onPlegar: () => void;
  onDesplegarTodo: () => void;
}

/** La rama de lo elegido (Y38b): plegarla o desplegarla, y cuánto cuelga de ella. Se ve con una o más formas con hijos elegidas. */
export function SeccionRama({ escena, seleccion, onPlegar, onDesplegarTodo }: SeccionRamaProps): ReactElement | null {
  const ids = ramasElegidas(escena, seleccion);
  if (ids.length === 0) return null;
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const hayDesplegada = ids.some((id) => {
    const e = porId.get(id);
    return e?.tipo === "forma" && e.colapsado !== true;
  });
  const hayPlegadaEnTodo = escena.elementos.some((e) => e.tipo === "forma" && e.colapsado === true);
  const resumen =
    ids.length === 1
      ? `${hijosDe(escena, ids[0] as string).length} directos · ${descendientesDe(escena, ids[0] as string)} en toda la rama`
      : `${ids.length} ramas elegidas`;
  const boton = "h-7 w-full cursor-pointer rounded-md border bg-background px-2 text-xs outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="divide-y px-3" data-rama-ajustes="">
      <CollapsibleSection title="Rama" storageKey="dibujo-rama" defaultOpen>
        <div className="space-y-2 pb-2 pt-1">
          <p className="text-[11px] text-muted-foreground">{resumen}</p>
          <button type="button" data-rama-plegar="" className={boton} onClick={onPlegar}>
            {hayDesplegada ? "Plegar rama" : "Desplegar rama"}
          </button>
          {hayPlegadaEnTodo ? (
            <button type="button" data-rama-desplegar-todo="" className={boton} onClick={onDesplegarTodo}>
              Desplegar todas las ramas
            </button>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}
