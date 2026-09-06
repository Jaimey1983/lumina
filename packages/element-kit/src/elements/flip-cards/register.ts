import type { ElementRegistry } from "@lumina/element-kit-core";
import { flipCardsDefinition } from "./flip-cards-definition.js";

export function registrarFlipCards(
  registry: ElementRegistry<{ "flip-cards": typeof flipCardsDefinition }>,
): void {
  registry.registrar(flipCardsDefinition);
}
