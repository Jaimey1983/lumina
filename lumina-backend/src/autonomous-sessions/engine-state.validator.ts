import { BadRequestException } from '@nestjs/common';

/**
 * Etapa K / K5 — validación del estado del motor de interacción que el
 * navegador del alumno envía para persistir (C5: el cliente informa, el
 * backend decide). Es solo flujo: no hay ninguna clave de nota/puntaje y este
 * módulo no conoce `@lumina/scoring`.
 *
 * Forma aceptada (espejo de `EstadoMotor` de `@lumina/interactions`):
 *   { variables, estados, visibles, capasAbiertas, respuestas }
 */
export interface VariableDeclarada {
  id: string;
  tipo: 'numero' | 'texto' | 'booleano';
}

export interface EstadoMotorPersistido {
  variables: Record<string, number | string | boolean>;
  estados: Record<string, string>;
  visibles: Record<string, boolean>;
  capasAbiertas: string[];
  respuestas: Record<string, boolean>;
}

export const MAX_ESTADO_BYTES = 32 * 1024;
const MAX_ENTRADAS = 500;
const MAX_ID = 128;
const MAX_TEXTO = 1000;
const CLAVES = [
  'variables',
  'estados',
  'visibles',
  'capasAbiertas',
  'respuestas',
] as const;
const ESTADOS_OBJETO = new Set([
  'normal',
  'visitado',
  'seleccionado',
  'deshabilitado',
]);
const CLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

function esRegistro(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function claveValida(k: string): boolean {
  return k.length > 0 && k.length <= MAX_ID && !CLAVES_PELIGROSAS.has(k);
}

function registro(valor: unknown, nombre: string): Record<string, unknown> {
  if (!esRegistro(valor)) {
    throw new BadRequestException(`"${nombre}" debe ser un objeto`);
  }
  const claves = Object.keys(valor);
  if (claves.length > MAX_ENTRADAS) {
    throw new BadRequestException(`"${nombre}" tiene demasiadas entradas`);
  }
  for (const k of claves) {
    if (!claveValida(k)) {
      throw new BadRequestException(`"${nombre}" tiene una clave inválida`);
    }
  }
  return valor;
}

/**
 * Valida y devuelve una copia saneada. Lanza `BadRequestException` ante
 * claves desconocidas, variables inexistentes, tipos erróneos o payload
 * demasiado grande.
 */
export function validarEstadoMotor(
  entrada: unknown,
  variablesDeclaradas: readonly VariableDeclarada[],
): EstadoMotorPersistido {
  if (!esRegistro(entrada)) {
    throw new BadRequestException('El estado debe ser un objeto');
  }
  if (JSON.stringify(entrada).length > MAX_ESTADO_BYTES) {
    throw new BadRequestException('El estado del motor es demasiado grande');
  }
  for (const k of Object.keys(entrada)) {
    if (!(CLAVES as readonly string[]).includes(k)) {
      throw new BadRequestException(`Clave desconocida en el estado: "${k}"`);
    }
  }

  const defs = new Map(variablesDeclaradas.map((v) => [v.id, v]));
  const variables: EstadoMotorPersistido['variables'] = {};
  for (const [id, valor] of Object.entries(
    registro(entrada.variables ?? {}, 'variables'),
  )) {
    const def = defs.get(id);
    if (!def) {
      throw new BadRequestException(`Variable inexistente: "${id}"`);
    }
    const ok =
      (def.tipo === 'numero' &&
        typeof valor === 'number' &&
        Number.isFinite(valor)) ||
      (def.tipo === 'texto' &&
        typeof valor === 'string' &&
        valor.length <= MAX_TEXTO) ||
      (def.tipo === 'booleano' && typeof valor === 'boolean');
    if (!ok) {
      throw new BadRequestException(`Tipo incorrecto para la variable "${id}"`);
    }
    variables[id] = valor;
  }

  const estados: EstadoMotorPersistido['estados'] = {};
  for (const [id, valor] of Object.entries(
    registro(entrada.estados ?? {}, 'estados'),
  )) {
    if (typeof valor !== 'string' || !ESTADOS_OBJETO.has(valor)) {
      throw new BadRequestException(`Estado de objeto inválido para "${id}"`);
    }
    estados[id] = valor;
  }

  const booleanos = (nombre: 'visibles' | 'respuestas') => {
    const out: Record<string, boolean> = {};
    for (const [id, valor] of Object.entries(
      registro(entrada[nombre] ?? {}, nombre),
    )) {
      if (typeof valor !== 'boolean') {
        throw new BadRequestException(`"${nombre}.${id}" debe ser booleano`);
      }
      out[id] = valor;
    }
    return out;
  };

  const capas = entrada.capasAbiertas ?? [];
  if (!Array.isArray(capas) || capas.length > MAX_ENTRADAS) {
    throw new BadRequestException('"capasAbiertas" debe ser una lista corta');
  }
  const capasAbiertas = capas.map((c) => {
    if (typeof c !== 'string' || !claveValida(c)) {
      throw new BadRequestException('"capasAbiertas" contiene un id inválido');
    }
    return c;
  });

  return {
    variables,
    estados,
    visibles: booleanos('visibles'),
    capasAbiertas,
    respuestas: booleanos('respuestas'),
  };
}

/** Lee `Class.variables` (Json) tolerando basura: solo conserva defs válidas. */
export function leerVariablesDeclaradas(json: unknown): VariableDeclarada[] {
  if (!Array.isArray(json)) return [];
  const out: VariableDeclarada[] = [];
  for (const v of json) {
    if (
      esRegistro(v) &&
      typeof v.id === 'string' &&
      (v.tipo === 'numero' || v.tipo === 'texto' || v.tipo === 'booleano')
    ) {
      out.push({ id: v.id, tipo: v.tipo });
    }
  }
  return out;
}
