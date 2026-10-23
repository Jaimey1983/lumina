"use client";

// Menú contextual del lienzo (Y17): se arma desde el registro de comandos (DY3), así que las etiquetas, los atajos, los
// iconos y los motivos de «no se puede» son los de la cinta. No repite nada: pide la misma `Orden` que el botón.

import type { ReactElement } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@lumina/ui/context-menu";
import { menuDe, textoDeAtajo, type ContextoComando, type ContextoMenu, type ItemDeMenu } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";

export interface MenuContextualProps {
  /** Qué menú se arma: sobre una forma, un conector o un vacío. */
  en: ContextoMenu;
  contexto: ContextoComando;
  /** Un comando elegido pide su orden, igual que el botón de la cinta. */
  onOrden: (orden: Orden) => void;
  /** Se abrió o se cerró: mientras está abierto, las teclas son del menú y no del editor. */
  onAbierto: (abierto: boolean) => void;
  /** Al cerrar, el foco vuelve al lienzo. */
  focoLienzo: () => void;
  /** El lienzo: solo dentro de él se anula el menú del navegador. */
  children: ReactElement;
}

function Entrada({ item, onOrden }: { item: ItemDeMenu; onOrden: (orden: Orden) => void }): ReactElement {
  const { def, estado } = item;
  const Icono = def.icono;
  const atajo = textoDeAtajo(def);
  return (
    <ContextMenuItem disabled={!estado.habilitado} data-comando={def.id} onSelect={() => onOrden(def.orden)}>
      {Icono ? <Icono /> : null}
      <span>{def.etiqueta}</span>
      {!estado.habilitado && estado.motivo ? <span className="text-xs text-muted-foreground">— {estado.motivo}</span> : null}
      {atajo ? <ContextMenuShortcut>{atajo}</ContextMenuShortcut> : null}
    </ContextMenuItem>
  );
}

/** Se monta solo con el menú abierto: así el registro no se recorre en cada pintado del editor. */
function Contenido({ en, contexto, onOrden }: { en: ContextoMenu; contexto: ContextoComando; onOrden: (orden: Orden) => void }): ReactElement {
  return (
    <>
      {menuDe(en, contexto).map((x, i) => {
        if (x.clase === "separador") return <ContextMenuSeparator key={`s${i}`} />;
        if (x.clase === "comando") return <Entrada key={x.item.def.id} item={x.item} onOrden={onOrden} />;
        return (
          <ContextMenuSub key={x.etiqueta}>
            <ContextMenuSubTrigger data-submenu={x.etiqueta}>{x.etiqueta}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {x.items.map((it) => (
                <Entrada key={it.def.id} item={it} onOrden={onOrden} />
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      })}
    </>
  );
}

export function MenuContextual({ en, contexto, onOrden, onAbierto, focoLienzo, children }: MenuContextualProps): ReactElement {
  return (
    <ContextMenu onOpenChange={onAbierto}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        aria-label="Menú contextual"
        data-menu-contextual={en}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          focoLienzo();
        }}
      >
        <Contenido en={en} contexto={contexto} onOrden={onOrden} />
      </ContextMenuContent>
    </ContextMenu>
  );
}
