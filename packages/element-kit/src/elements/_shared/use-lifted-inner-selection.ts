import { useState } from "react";

/**
 * Inner-selection: si el consumidor pasa `onInnerSelectionChange` en config,
 * se usa el valor controlado (canvas / reducer). Si no, estado local
 * (parity specs del kit y usos sin lift).
 */
export function useLiftedInnerSelection<T>(config: {
  readonly innerSelection?: unknown;
  readonly onInnerSelectionChange?: (selection: T | null) => void;
}): [T | null, (selection: T | null) => void] {
  const [local, setLocal] = useState<T | null>(null);
  if (config.onInnerSelectionChange) {
    return [(config.innerSelection as T | null) ?? null, config.onInnerSelectionChange];
  }
  return [local, setLocal];
}
