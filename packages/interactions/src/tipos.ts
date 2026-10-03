import type {
  ClaveSistema,
  EstadoObjeto,
  EventoTipo,
  Regla,
  VariableDef,
  VariableValor,
} from '@lumina/types/interaction';

/**
 * Estado del motor para UN alumno (D2: las variables son locales).
 * Es JSON puro y serializable (K5 lo persiste). Las funciones del paquete
 * nunca lo mutan: devuelven uno nuevo.
 *
 * Nota (C1/C4): no hay ningún campo de nota ni de puntaje. `respuestas` solo
 * guarda SI la última respuesta fue correcta, que es lo único que el flujo
 * puede consultar.
 */
export interface EstadoMotor {
  /** Valor actual de cada variable, por `VariableDef.id`. */
  readonly variables: Readonly<Record<string, VariableValor>>;
  /** Estado de objeto por `bloqueId`. Un bloque ausente está en `'normal'`. */
  readonly estados: Readonly<Record<string, EstadoObjeto>>;
  /** Visibilidad forzada por reglas, por `bloqueId`. Ausente = el valor por defecto del bloque. */
  readonly visibles: Readonly<Record<string, boolean>>;
  /** Ids de capas abiertas, en orden de apertura. */
  readonly capasAbiertas: readonly string[];
  /** Última respuesta correcta (`true`) o incorrecta (`false`) por `bloqueId`. */
  readonly respuestas: Readonly<Record<string, boolean>>;
}

/** Evento que el reproductor le entrega al motor. */
export interface EventoMotor {
  tipo: EventoTipo;
  /** Bloque que lo emitió (ausente en eventos de slide como `al_entrar_slide`). */
  bloqueId?: string;
  /** Slide en el que ocurre. Las reglas de slide solo reaccionan a eventos de su slide. */
  slideId?: string;
}

/** De dónde sale una regla: determina a qué eventos reacciona. */
export type OrigenRegla =
  /** `Block.disparadores`: reacciona a eventos de ESE bloque. */
  | { tipo: 'bloque'; bloqueId: string; slideId: string }
  /** `Slide.reglas`: reacciona a eventos del slide y de cualquiera de sus bloques. */
  | { tipo: 'slide'; slideId: string };

export interface ReglaAplicable {
  regla: Regla;
  origen: OrigenRegla;
}

/**
 * Lo que el motor le pide al navegador que haga. Todo lo demás (variables,
 * estados, capas, visibilidad) ya viene resuelto en el `EstadoMotor` devuelto.
 * Deliberadamente NO hay efectos de calificación (C1/C4).
 */
export type Efecto = {
  tipo: 'navegar';
  destino:
    | { tipo: 'slide'; slideId: string }
    | { tipo: 'siguiente' }
    | { tipo: 'anterior' };
};

export type CodigoAviso =
  | 'variable_inexistente'
  | 'tipo_incompatible'
  | 'condicion_demasiado_profunda'
  | 'ciclo_cortado'
  | 'profundidad_excedida'
  | 'limite_acciones'
  | 'navegacion_ignorada'
  | 'sistema_no_disponible'
  | 'rango_invalido';

/**
 * El motor NUNCA lanza por una regla mal formada (viene de JSON editable):
 * la ignora y deja constancia aquí.
 */
export interface Aviso {
  codigo: CodigoAviso;
  reglaId?: string;
  mensaje: string;
}

export interface ResultadoMotor {
  estado: EstadoMotor;
  efectos: Efecto[];
  avisos: Aviso[];
}

export interface LimitesMotor {
  /** Encadenamiento máximo de eventos (una regla que dispara otra, etc.). */
  profundidadEventos: number;
  /** Anidamiento máximo de `y`/`o`/`no` dentro de una condición. */
  profundidadCondicion: number;
  /** Acciones máximas ejecutadas por evento de entrada, contando las encadenadas. */
  maxAcciones: number;
}

export const LIMITES_POR_DEFECTO: Readonly<LimitesMotor> = Object.freeze({
  profundidadEventos: 8,
  profundidadCondicion: 16,
  maxAcciones: 200,
});

export interface ContextoMotor {
  /** Definiciones de variable de la clase (para validar tipos al escribir). */
  variables: readonly VariableDef[];
  /**
   * Valores de las variables del sistema (N1/D18). Las deriva el runtime en cada
   * evaluación; si falta una clave, la condición que la lea queda rota (falla
   * cerrado) y deja un aviso.
   */
  sistema?: Partial<Record<ClaveSistema, number>>;
}

/** Claves de sistema válidas (para validar reglas editadas a mano). */
export const CLAVES_SISTEMA: readonly ClaveSistema[] = Object.freeze([
  'slide_numero',
  'slide_total',
  'progreso_pct',
  'tiempo_s',
  'intento',
]);
