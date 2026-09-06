/**
 * Bootstrap de ElementRegistry para lumina-frontend (E5.5).
 *
 * El side-effect import de `@lumina/element-kit` registra las 37 `ElementDefinition`
 * en el singleton compartido de `@lumina/element-kit-core`.
 */
import '@lumina/element-kit';
import {
  elementRegistry as coreRegistry,
  type ElementDefinition,
} from '@lumina/element-kit-core';

export interface TypedElementRegistry {
  obtener<TState = unknown, TConfig = unknown>(
    tipo: string,
  ): ElementDefinition<TState, TConfig> | undefined;
  listar(): readonly ElementDefinition<unknown, unknown>[];
  registrar<TState, TConfig>(
    definicion: ElementDefinition<TState, TConfig>,
  ): void;
}

export const elementRegistry = coreRegistry as unknown as TypedElementRegistry;
