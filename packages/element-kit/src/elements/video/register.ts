import { elementRegistry } from "@lumina/element-kit-core";
import { videoDefinition } from "./video-definition.js";

export function registrarVideo(): void {
  elementRegistry.registrar(videoDefinition);
}
