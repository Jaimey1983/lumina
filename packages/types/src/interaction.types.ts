// ─────────────────────────────────────────────
// TIPOS: Motor de interacción (Etapa K / K1)
// Variables, reglas, condiciones, acciones, estados de objeto y capas.
//
// Decisiones cerradas en AGENTS.md (Etapa K):
//  - D5: las condiciones son un ÁRBOL DE DATOS interpretado por
//        `@lumina/interactions`. Nunca texto ejecutable (`eval`).
//  - C1/C4: el motor decide el FLUJO, `@lumina/scoring` decide la NOTA.
//        Por eso no existe ninguna `Accion` que escriba puntajes ni
//        resultados, y ningún `Operando` que lea una nota calculada.
//
// Todo es aditivo y opcional en `Block`, `Slide` y `SlideClass`
// (ver slide.types.ts): una clase guardada antes de K1 tipa igual.
// ─────────────────────────────────────────────

import type { Block } from './slide.types.js';

// ─── Variables ───────────────────────────────────────────────────────────────

export type VariableTipo = 'numero' | 'texto' | 'booleano';

export type VariableValor = number | string | boolean;

/**
 * Variable declarada a nivel de clase (D3). Es local por alumno (D2):
 * el valor inicial se copia al estado de cada alumno al empezar.
 */
export interface VariableDef {
  /** Identificador estable; las reglas referencian por `id`, no por nombre. */
  id: string;
  /** Nombre legible que ve el docente. */
  nombre: string;
  tipo: VariableTipo;
  /** Debe ser coherente con `tipo` (lo valida `validarReglas`). */
  valorInicial: VariableValor;
}

// ─── Estados de objeto ───────────────────────────────────────────────────────

export type EstadoObjeto =
  | 'normal'
  | 'visitado'
  | 'seleccionado'
  | 'deshabilitado';

// ─── Eventos ─────────────────────────────────────────────────────────────────

/** Eventos que un elemento o un slide pueden emitir. */
export type EventoTipo =
  | 'clic'
  | 'visitado'
  | 'seleccionado'
  | 'respuesta_correcta'
  | 'respuesta_incorrecta'
  | 'fin_contador'
  | 'al_entrar_slide';

// ─── Condiciones (árbol de datos, D5) ────────────────────────────────────────

export type OperadorComparacion = '==' | '!=' | '<' | '<=' | '>' | '>=';

/**
 * Valor que una comparación puede leer. Deliberadamente NO incluye ninguna
 * nota ni puntaje (C1/C4): el flujo no puede depender del score calculado
 * por `@lumina/scoring`, solo de si la respuesta fue correcta.
 */
export type Operando =
  | { tipo: 'literal'; valor: VariableValor }
  | { tipo: 'variable'; variableId: string }
  /** Estado actual (`EstadoObjeto`) de un bloque. */
  | { tipo: 'estado_bloque'; bloqueId: string }
  /** `true` si la última respuesta del alumno a esa actividad fue correcta. */
  | { tipo: 'respuesta_correcta'; bloqueId: string };

export type Condicion =
  | {
      tipo: 'comparacion';
      operador: OperadorComparacion;
      izquierda: Operando;
      derecha: Operando;
    }
  | { tipo: 'y'; condiciones: Condicion[] }
  | { tipo: 'o'; condiciones: Condicion[] }
  | { tipo: 'no'; condicion: Condicion };

// ─── Acciones ────────────────────────────────────────────────────────────────

/**
 * Acciones de flujo. No hay acción de calificación a propósito (C1/C4).
 * Las referencias a slides y bloques son por `id` (integridad referencial
 * en K7: al borrar o duplicar se limpian o remapean).
 */
export type Accion =
  | { tipo: 'ir_a_slide'; slideId: string }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' }
  | { tipo: 'mostrar'; bloqueId: string }
  | { tipo: 'ocultar'; bloqueId: string }
  | { tipo: 'cambiar_estado'; bloqueId: string; estado: EstadoObjeto }
  | { tipo: 'abrir_capa'; capaId: string }
  | { tipo: 'cerrar_capa'; capaId: string }
  | { tipo: 'asignar_variable'; variableId: string; valor: Operando }
  /** Solo variables de tipo `numero`. Es de flujo, nunca de nota (C4). */
  | { tipo: 'sumar_variable'; variableId: string; cantidad: number };

export type AccionTipo = Accion['tipo'];

// ─── Reglas ──────────────────────────────────────────────────────────────────

/**
 * `evento → condiciones → acciones` (D4).
 * Las `condiciones` se combinan con Y implícito; para O/NO se usa el árbol.
 * Una regla en `Block.disparadores` reacciona a eventos de ese bloque;
 * una regla en `Slide.reglas` reacciona a eventos del slide
 * (p. ej. `al_entrar_slide`) o de cualquiera de sus bloques.
 */
export interface Regla {
  id: string;
  evento: EventoTipo;
  condiciones: Condicion[];
  acciones: Accion[];
  /** Una regla inactiva se conserva pero no se evalúa. */
  activa: boolean;
}

// ─── Capas de slide ──────────────────────────────────────────────────────────

/**
 * Capa que se superpone al slide base (generaliza `popup`, ficha K8).
 * El contenido es la misma unión `Block` que el slide base.
 */
export interface Capa {
  id: string;
  nombre: string;
  bloques: Block[];
  /** Si la capa bloquea la interacción con el slide base mientras está abierta. */
  modal?: boolean;
  /** Si la capa está abierta al entrar al slide. Por defecto `false`. */
  visibleInicial?: boolean;
}
