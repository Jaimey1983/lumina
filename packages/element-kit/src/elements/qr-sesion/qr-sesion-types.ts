import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export { QR_SESION_TIPO, type QrSesionEstado } from "../../widgets/qr-sesion/qr-sesion-types.js";

/** El QR de sesión es de solo lectura y no usa el runtime. */
export type QrSesionConfig = WidgetCanvasConfig;
