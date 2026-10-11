import { elementRegistry } from "@lumina/element-kit-core";
import { qrSesionDefinition } from "./qr-sesion-definition.js";

export function registrarQrSesion(): void {
  elementRegistry.registrar(qrSesionDefinition);
}
