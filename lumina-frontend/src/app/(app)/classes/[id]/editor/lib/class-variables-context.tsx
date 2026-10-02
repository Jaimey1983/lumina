'use client';

import { createContext, useContext } from 'react';
import type { VariableDef } from '@lumina/types/interaction';

const SIN_VARIABLES: readonly VariableDef[] = [];

/**
 * Variables declaradas en la clase (K6), disponibles para los paneles de
 * propiedades que vinculan símbolos a variables (M2: fórmulas interactivas).
 * Evita pasar la lista por las props de `CanvasArea` y `PropertiesPanel`.
 */
export const ClassVariablesContext = createContext<readonly VariableDef[]>(SIN_VARIABLES);

export function useClassVariables(): readonly VariableDef[] {
  return useContext(ClassVariablesContext);
}
