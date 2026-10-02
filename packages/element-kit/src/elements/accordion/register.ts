import { elementRegistry } from "@lumina/element-kit-core";
import { accordionDefinition } from "./accordion-definition.js";

export function registrarAccordion(): void {
  elementRegistry.registrar(accordionDefinition);
}
