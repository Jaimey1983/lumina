import { elementRegistry } from "@lumina/element-kit-core";
import { selloDefinition } from "./sello-definition.js";

export function registrarSello(): void {
  elementRegistry.registrar(selloDefinition);
}
