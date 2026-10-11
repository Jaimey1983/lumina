export { qrSesionDefinition, QR_SESION_PRESETS, type QrSesionDefinition } from "./qr-sesion-definition.js";
export { QrSesionEditor, QrSesionViewer, QrSesionPropiedades } from "./qr-sesion-adapters.js";
export { QR_SESION_TIPO, type QrSesionConfig, type QrSesionEstado } from "./qr-sesion-types.js";
export { registrarQrSesion } from "./register.js";
export {
  DEFAULT_QR_SESION_CONFIG,
  createDefaultQrSesionBlock,
  limpiarCodigo,
  normalizarOrigen,
  normalizeQrSesionWidget,
  urlDeUnion,
  type QrSesionConfiguracion,
} from "../../widgets/qr-sesion/index.js";
