import { elementRegistry } from "@lumina/element-kit-core";
import { calloutDefinition } from "./callout-definition.js";

export function registrarCallout(): void {
  elementRegistry.registrar(calloutDefinition);
}
