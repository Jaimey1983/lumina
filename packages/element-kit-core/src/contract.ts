import type { ComponentType } from "react";
import type {
  EstadoObjeto,
  EventoTipo,
  VariableValor,
} from "@lumina/types/interaction";

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

/**
 * Canal de runtime que el REPRODUCTOR le entrega a un elemento (Etapa K / K3).
 * Es opcional por completo: sin él, el elemento se comporta exactamente como
 * antes de existir el motor de interacción. El contrato no lo exige — los
 * `TConfig` de cada elemento lo incluyen (p. ej. `WidgetCanvasConfig`).
 *
 * El elemento solo dice QUÉ pasó (`emitir('clic')`); no sabe de reglas, de
 * variables ni de otros bloques. Quién escucha, y a qué bloque y slide
 * corresponde el evento, lo resuelve el runtime (K4), que construye un
 * `emitir` ya atado al bloque.
 *
 * C1/C4: el canal no transporta notas ni puntajes. Calificar sigue siendo
 * trabajo de `PuntuacionDelegate` + `@lumina/scoring`.
 */
export interface ElementRuntimeConfig {
  /**
   * Id estable del bloque (D8). Informativo: `emitir` ya viene atado a él.
   * Ausente = el bloque no participa en reglas.
   */
  readonly bloqueId?: string;
  /** Avisa al motor de que ocurrió un evento. Ausente = no hay motor (clase en vivo, presentación, miniatura). */
  readonly emitir?: (evento: EventoTipo) => void;
  /**
   * Estado de objeto actual del bloque según el motor. Sirve para no repetir
   * eventos de una sola vez (p. ej. no volver a emitir `visitado` si ya lo está).
   */
  readonly estadoObjeto?: EstadoObjeto;
  /**
   * M2 — valores actuales de las variables de clase (por `VariableDef.id`).
   * Solo lectura. Ausente = sin motor.
   */
  readonly variables?: Readonly<Record<string, VariableValor>>;
  /**
   * M2 — cambia una variable de flujo (valida existencia y tipo). No puede
   * tocar notas (C1/C4). Ausente = el elemento no puede escribir variables.
   */
  readonly asignarVariable?: (variableId: string, valor: VariableValor) => void;
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

/**
 * Plantilla o preset preconfigurado para un elemento (Fase 1 / E8).
 * Permite al docente seleccionar un aspecto o variante inicial con un solo clic.
 */
export interface ElementPreset<TPatch = unknown> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly thumbnail?: string;
  readonly configPatch?: Partial<TPatch>;
  readonly patch?: Partial<TPatch>;
}

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
  /**
   * Eventos que este elemento puede emitir por `ElementRuntimeConfig.emitir`
   * (Etapa K / K3). El editor de reglas solo ofrece estos como disparadores.
   * Ausente = el elemento no emite eventos.
   */
  readonly eventos?: readonly EventoTipo[];
  /**
   * Galería de plantillas o presets preconfigurados para el elemento (E8).
   * `ElementPreset` acepta parches tanto de estado (`patch`) como de
   * configuración (`configPatch`) bajo un solo genérico — algunos elementos
   * solo parchean estado, otros solo configuración (ver
   * `contract-presets.spec.ts`), por eso acá se acepta cualquiera de los dos.
   */
  readonly presets?: readonly ElementPreset<TState | TConfig>[];
}


