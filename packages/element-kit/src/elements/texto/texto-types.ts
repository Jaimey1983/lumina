import type { TextBlock } from "../../blocks/texto/index.js";
import type { RichDoc } from "@lumina/types/rich-text";
import type { PrimitivePanelConfig } from "../_shared/primitive-config.js";

export const TEXTO_TIPO = "texto" as const;
export type TextoEstado = TextBlock;
export type TextoConfig = PrimitivePanelConfig & {
  isEditing?: boolean;
  /** Un único commit por gesto de edición, con el documento enriquecido. */
  onCommit?: (doc: RichDoc) => void;
  onDiscard?: () => void;
  /** Fondo del slide — para el aviso de contraste WCAG del panel de propiedades. */
  slideBackground?: string;
};
