import type { ElementDefinition } from "./contract.js";

/** El catálogo conserva los tipos concretos al recuperar una definición. */
export class ElementRegistry<TCatalog extends Record<string, unknown> = Record<string, unknown>> {
  private readonly elementos = new Map<keyof TCatalog, unknown>();

  registrar<TKey extends keyof TCatalog & string, TState, TConfig>(
    definicion: ElementDefinition<TState, TConfig> & TCatalog[TKey] & { readonly tipo: TKey },
  ): void {
    if (this.elementos.has(definicion.tipo)) {
      throw new Error(`Elemento duplicado: ${definicion.tipo}`);
    }
    this.elementos.set(definicion.tipo, definicion);
  }

  obtener<TKey extends keyof TCatalog & string>(tipo: TKey): TCatalog[TKey] | undefined {
    // registrar comprueba la relación clave/definición; Map no la representa.
    return this.elementos.get(tipo) as TCatalog[TKey] | undefined;
  }

  listar(): readonly TCatalog[keyof TCatalog][] {
    return [...this.elementos.values()] as TCatalog[keyof TCatalog][];
  }
}
