'use client';

import { createContext, useContext } from 'react';
import type { EstadoObjeto, VariableDef } from '@lumina/types/interaction';
import type { AvisoCampo } from '@lumina/interactions';

/** Universo de ids que el constructor ofrece en sus selectores. */
export interface OpcionesBuilder {
  variables: readonly VariableDef[];
  /** Bloques de primer nivel que se pueden nombrar (ya con id candidato). */
  bloques: readonly { id: string; etiqueta: string; respondible: boolean }[];
  slides: readonly { id: string; titulo: string }[];
  capas: readonly { id: string; nombre: string }[];
}

export const OpcionesContext = createContext<OpcionesBuilder>({
  variables: [],
  bloques: [],
  slides: [],
  capas: [],
});
export const useOpciones = (): OpcionesBuilder => useContext(OpcionesContext);

/** Avisos por campo de la regla en edición (`validarRegla`). */
export const AvisosContext = createContext<readonly AvisoCampo[]>([]);

export const selectCls =
  'h-8 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs';
export const inputCls =
  'h-8 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs';

/** Mensajes de aviso de un campo exacto (no de sus descendientes). */
export function Aviso({ campo }: { campo: string }) {
  const avisos = useContext(AvisosContext);
  const propios = avisos.filter((a) => a.campo === campo);
  if (propios.length === 0) return null;
  return (
    <>
      {propios.map((a) => (
        <p key={`${a.codigo}-${a.mensaje}`} role="alert" className="text-[11px] text-destructive">
          {a.mensaje}
        </p>
      ))}
    </>
  );
}

export const esEstado = (v: string): v is EstadoObjeto =>
  v === 'normal' || v === 'visitado' || v === 'seleccionado' || v === 'deshabilitado';
