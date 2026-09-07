import type { ComponentType } from "react";

/** Capacidades de apariencia que expone el panel de cada elemento. */
export interface AparienciaSpec {
  readonly color: boolean;
  readonly tipografia: boolean;
  readonly animacion: boolean;
}

/**
 * Metadata **semántica** para los paneles de inserción del editor (E7.1).
 * La presentación (icono lucide, clases Tailwind, orden visual) NO va acá —
 * vive en el frontend (`widget-panel-catalog.ts`), keyed por `tipo`. Así el
 * contrato no arrastra React ni lucide ni Tailwind.
 */
export interface ElementCatalogo {
  readonly nombre: string;
  readonly descripcion?: string;
  readonly familia: 'widget' | 'actividad' | 'bloque' | 'primitivo';
  /** Sub-agrupación dentro de la familia (p. ej. widgets: `lienzo`/`overlay`/`control`). */
  readonly grupo?: string;
  /** Identificador que usa el panel de drag&drop cuando difiere de `tipo`. */
  readonly panelType?: string;
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
 * `respuesta` es la respuesta del alumno. Los elementos no puntuables lo omiten.
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
  /** Metadata para los paneles de inserción del editor (E7.1). */
  readonly catalogo?: ElementCatalogo;
}
