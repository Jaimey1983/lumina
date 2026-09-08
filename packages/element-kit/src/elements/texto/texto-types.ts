import type { TextBlock } from "../../blocks/texto/index.js";

export const TEXTO_TIPO = "texto" as const;
export type TextoEstado = TextBlock;
export type TextoConfig = {
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
};
