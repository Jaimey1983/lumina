import { elementRegistry } from "@lumina/element-kit-core";
import { checklistDefinition } from "./checklist-definition.js";

export function registrarChecklist(): void {
  elementRegistry.registrar(checklistDefinition);
}
