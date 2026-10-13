/**
 * U12 / DU12 — enganche para generar una actividad con IA (etapa J). **Solo la interfaz**: el kit no
 * llama a ningún servicio. El anfitrión (el editor) provee un `GeneradorActividad` con
 * `GeneradorActividadProvider`; si no hay proveedor, el panel no ofrece «Generar con IA».
 */
import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { Activity } from '@lumina/types/slide';

export interface SolicitudGeneracion {
  readonly tipo: Activity['tipo'];
  /** La actividad tal como está en el editor, para que el generador la use de base o de contexto. */
  readonly actividadActual: Activity;
  /** Lo que el docente escribió pidiendo (tema, cantidad, nivel…). Puede venir vacío. */
  readonly instrucciones: string;
}

export type ResultadoGeneracion =
  | { readonly ok: true; readonly actividad: Activity }
  | { readonly ok: false; readonly mensaje: string };

export interface GeneradorActividad {
  /** Tipos que sabe generar. Un tipo fuera de la lista no muestra el botón. */
  soporta(tipo: Activity['tipo']): boolean;
  generar(solicitud: SolicitudGeneracion): Promise<ResultadoGeneracion>;
}

const Contexto = createContext<GeneradorActividad | null>(null);

export function GeneradorActividadProvider({
  generador,
  children,
}: {
  readonly generador: GeneradorActividad | null;
  readonly children: ReactNode;
}) {
  return createElement(Contexto.Provider, { value: generador }, children);
}

/** El generador del anfitrión, o `null` si no hay. */
export function useGeneradorActividad(): GeneradorActividad | null {
  return useContext(Contexto);
}
