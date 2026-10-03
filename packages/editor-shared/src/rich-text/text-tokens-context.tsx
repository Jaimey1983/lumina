'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { VariableTokenData } from './text-tokens.js';

export interface TextTokensValue {
  /** Tokens de clase / docente (`{{clase}}`, `{{docente}}`, …) inyectados por el frontend. */
  extra?: Record<string, string>;
  /** N4 — variables de clase para `{{var:<id>}}` (valor vivo o inicial). */
  variables?: VariableTokenData;
}

const TextTokensContext = createContext<TextTokensValue>({});

export function TextTokensProvider({
  value,
  children,
}: {
  value: TextTokensValue;
  children: ReactNode;
}) {
  return (
    <TextTokensContext.Provider value={value}>{children}</TextTokensContext.Provider>
  );
}

export function useTextTokens(): TextTokensValue {
  return useContext(TextTokensContext);
}
