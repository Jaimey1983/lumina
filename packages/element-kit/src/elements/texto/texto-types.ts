import type { TextBlock } from "lumina-frontend/blocks/texto";

export const TEXTO_TIPO = "texto" as const;
export type TextoEstado = TextBlock;
export type TextoConfig = {
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
};
