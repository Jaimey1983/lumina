import { elementRegistry } from "@lumina/element-kit-core";
import { imageCompareDefinition } from "./image-compare-definition.js";

export function registrarImageCompare(): void {
  elementRegistry.registrar(imageCompareDefinition);
}
