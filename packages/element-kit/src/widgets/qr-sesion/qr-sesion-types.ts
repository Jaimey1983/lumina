/**
 * T20 — QR de sesión. Widget nuevo: nace como `ElementDefinition` (DT6) y su tipo vive aquí, no en
 * el `Block` viejo de `@lumina/types` (Regla 3). Es de solo lectura y NO llama al backend: muestra
 * un QR de la URL de unión (`<origen>/join/<código>`, ruta que ya existe) para un código que el
 * docente escribe a mano.
 */
export const QR_SESION_TIPO = "qr-sesion" as const;

/** Nivel de corrección de errores del QR (de menor a mayor tolerancia a daños). */
export type QrNivel = "L" | "M" | "Q" | "H";
export type QrTamano = "pequeno" | "mediano" | "grande";
/** `alto`: negro sobre blanco (lo más fiable para escanear). `tema`: los colores del tema del curso. */
export type QrContraste = "alto" | "tema";
export type QrOrigen = "automatico" | "personalizado";

export interface QrSesionConfiguracion {
  /** Código de unión (de la clase); solo letras, números, guion y guion bajo. */
  codigo: string;
  origen: QrOrigen;
  /** Solo con `origen: "personalizado"`: `https://…` sin ruta. */
  origenPersonalizado: string;
  nivel: QrNivel;
  /** Zona de silencio alrededor del QR, en módulos (0–8). */
  margen: number;
  tamano: QrTamano;
  contraste: QrContraste;
  /** Texto sobre el QR (p. ej. «Escanea para unirte»). */
  textoAyuda: string;
  mostrarCodigo: boolean;
  mostrarUrl: boolean;
  /** Botones «Copiar código» y «Copiar enlace». */
  botonCopiar: boolean;
}

export interface QrSesionEstado {
  id?: string;
  tipo: typeof QR_SESION_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  configuracion: QrSesionConfiguracion;
}
