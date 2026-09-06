import type { ElementRegistry } from "@lumina/element-kit-core";
import { tabsDefinition } from "./tabs-definition.js";

export function registrarTabs(
  registry: ElementRegistry<{ tabs: typeof tabsDefinition }>,
): void {
  registry.registrar(tabsDefinition);
}
