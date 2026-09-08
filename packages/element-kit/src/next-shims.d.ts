// Ambient para `next/dynamic` — los bloques `grafico`/`diagrama` (E7.6.5a) lo usan.
// El kit es NodeNext y `next` no expone `./dynamic` de forma resoluble; en runtime
// lo provee Next (`transpilePackages`) o el `vi.mock("next/dynamic")` de vitest-setup.
declare module "next/dynamic" {
  import type { ComponentType, ReactNode } from "react";
  export interface DynamicOptions {
    ssr?: boolean;
    loading?: ComponentType | (() => ReactNode);
  }
  export default function dynamic<P = Record<string, unknown>>(
    loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
    options?: DynamicOptions,
  ): ComponentType<P>;
}
