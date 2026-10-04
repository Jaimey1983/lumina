/** Tipado mínimo para dynamic import de smiles-drawer (Q6 / DQ4). */
export type SmilesDrawerApi = {
  Drawer: new (options: { width: number; height: number }) => {
    draw: (
      tree: unknown,
      canvas: HTMLCanvasElement,
      theme: string,
      clear: boolean,
    ) => void;
  };
  parse: (
    smiles: string,
    onSuccess: (tree: unknown) => void,
    onError?: (err: Error) => void,
  ) => void;
};

export async function loadSmilesDrawer(): Promise<SmilesDrawerApi> {
  const mod = await import('smiles-drawer');
  return mod.default as unknown as SmilesDrawerApi;
}
