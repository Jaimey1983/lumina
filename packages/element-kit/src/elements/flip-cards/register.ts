import type { ElementRegistry } from "../../registry.js";
import { flipCardsDefinition } from "./flip-cards-definition.js";

export function registrarFlipCards(
  registry: ElementRegistry<{ "flip-cards": typeof flipCardsDefinition }>,
): void {
  registry.registrar(flipCardsDefinition);
}
