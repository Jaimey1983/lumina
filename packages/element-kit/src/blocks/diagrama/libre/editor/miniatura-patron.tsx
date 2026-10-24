"use client";

import type { ReactElement } from "react";
import type { PatronRelleno } from "@lumina/drawing";

/** Dibujito de un patrón de relleno (Y23) en el color del texto del botón; sin ids ni `defs`, así se puede repetir sin choques. */
export function MiniaturaPatron({ patron }: { patron: PatronRelleno }): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="2" strokeWidth="1" />
      {patron === "rayas" ? <path d="M2 5H14M2 8H14M2 11H14" /> : null}
      {patron === "diagonal" ? <path d="M2 14L14 2M2 9L9 2M7 14L14 7" /> : null}
      {patron === "cuadricula" ? <path d="M2 8H14M8 2V14" /> : null}
      {patron === "puntos" ? (
        <g fill="currentColor" stroke="none">
          <circle cx="5" cy="5" r="1.2" />
          <circle cx="11" cy="5" r="1.2" />
          <circle cx="5" cy="11" r="1.2" />
          <circle cx="11" cy="11" r="1.2" />
        </g>
      ) : null}
    </svg>
  );
}
