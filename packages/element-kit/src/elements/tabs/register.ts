import type { ElementRegistry } from "../../registry.js";
import { tabsDefinition } from "./tabs-definition.js";

export function registrarTabs(
  registry: ElementRegistry<{ tabs: typeof tabsDefinition }>,
): void {
  registry.registrar(tabsDefinition);
}
