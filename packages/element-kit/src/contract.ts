import type { ComponentType } from "react";

/** Capacidades de apariencia que expone el panel de cada elemento. */
export interface AparienciaSpec {
  readonly color: boolean;
  readonly tipografia: boolean;
  readonly animacion: boolean;
}

export interface ElementViewerProps<TState, TConfig> {
  readonly estado: TState;
  readonly config: TConfig;
}

export interface ElementEditorProps<TState, TConfig>
  extends ElementViewerProps<TState, TConfig> {
  onChange(estado: TState): void;
}

export interface ElementPropsPanelProps<TState, TConfig>
  extends ElementEditorProps<TState, TConfig> {
  onConfigChange(config: TConfig): void;
}

/**
 * El consumidor conecta el motor de scoring; el contrato no calcula puntajes.
 * `respuesta` es la respuesta del alumno (E2.3+). El Botón no declara `puntuacion`.
 */
export type PuntuacionDelegate<TState> = (
  estado: TState,
  respuesta?: unknown,
) => number;

export interface ElementDefinition<TState, TConfig> {
  readonly tipo: string;
  crearPorDefecto(): TState;
  readonly Editor: ComponentType<ElementEditorProps<TState, TConfig>>;
  readonly Viewer: ComponentType<ElementViewerProps<TState, TConfig>>;
  readonly Propiedades: ComponentType<ElementPropsPanelProps<TState, TConfig>>;
  readonly apariencia: AparienciaSpec;
  readonly puntuacion?: PuntuacionDelegate<TState>;
}
