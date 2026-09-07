import { elementRegistry } from "@lumina/element-kit-core";
import { audioDefinition } from "./audio-definition.js";

export function registrarAudio(): void {
  elementRegistry.registrar(audioDefinition);
}
