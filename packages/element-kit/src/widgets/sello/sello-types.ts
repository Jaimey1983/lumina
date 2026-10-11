/**
 * T19 — Sello / insignia de logro. Widget nuevo: nace como `ElementDefinition` (DT6) y su tipo
 * vive aquí, no en el `Block` viejo de `@lumina/types` (Regla 3). Solo MUESTRA un estado
 * (bloqueado / ganado): no calcula ni guarda puntajes (DT7).
 */
export const SELLO_TIPO = "sello" as const;

export type SelloForma = "circulo" | "escudo" | "estrella";
export type SelloTono = "oro" | "azul" | "verde" | "rojo";

/**
 * Cuándo se considera «ganado» según el estado del objeto que entrega el motor de interacción:
 * `visitado` / `seleccionado` (la regla hace `cambiar_estado` sobre este bloque) o `siempre`
 * (insignia decorativa, siempre ganada).
 */
export type SelloCondicion = "visitado" | "seleccionado" | "siempre";

/** Solo para el editor: qué estado se previsualiza. */
export type SelloVistaPrevia = "ganado" | "bloqueado";

export interface SelloConfiguracion {
  forma: SelloForma;
  /** Id de `SELLO_ICONOS`. */
  icono: string;
  titulo: string;
  subtitulo: string;
  /** Texto bajo la insignia mientras está bloqueada. */
  textoBloqueado: string;
  tono: SelloTono;
  /** Color propio (`#RRGGBB`); sin él se usa el del tono. */
  colorAcento?: string;
  condicion: SelloCondicion;
  /** Pulso y brillo al ganarla. */
  animacion: boolean;
  /** Lluvia de confeti al ganarla (se carga solo la primera vez que hace falta). */
  confeti: boolean;
  vistaPrevia: SelloVistaPrevia;
}

export interface SelloEstado {
  id?: string;
  tipo: typeof SELLO_TIPO;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  zIndex?: number;
  configuracion: SelloConfiguracion;
}
