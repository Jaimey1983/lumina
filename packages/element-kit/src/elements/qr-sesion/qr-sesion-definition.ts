import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { createDefaultQrSesionBlock } from "../../widgets/qr-sesion/index.js";
import type { ElementDefinition, ElementPreset } from "@lumina/element-kit-core";
import { QrSesionEditor, QrSesionPropiedades, QrSesionViewer } from "./qr-sesion-adapters.js";
import { QR_SESION_TIPO, type QrSesionConfig, type QrSesionEstado } from "./qr-sesion-types.js";

/** Presets de tamaño y textos; ninguno toca el código de la clase. */
export const QR_SESION_PRESETS: readonly ElementPreset<QrSesionEstado>[] = [
  {
    id: "proyector",
    label: "Para proyector",
    description: "QR grande y código en letra grande, a prueba de lejanía",
    estadoPatch: { configuracion: { tamano: "grande", nivel: "Q", margen: 4, mostrarCodigo: true, mostrarUrl: false, botonCopiar: false } },
  },
  {
    id: "compacto",
    label: "Compacto",
    description: "QR pequeño junto a otros elementos",
    estadoPatch: { configuracion: { tamano: "pequeno", margen: 2, mostrarUrl: false } },
  },
  {
    id: "con-enlace",
    label: "Con enlace",
    description: "Muestra también la dirección completa y los botones de copiar",
    estadoPatch: { configuracion: { mostrarUrl: true, botonCopiar: true, mostrarCodigo: true } },
  },
  {
    id: "solo-qr",
    label: "Solo el QR",
    description: "Sin código ni botones: únicamente el QR y su texto",
    estadoPatch: { configuracion: { mostrarCodigo: false, mostrarUrl: false, botonCopiar: false } },
  },
];

/** T20 — QR de sesión: QR del enlace `<origen>/join/<código>`; solo lectura y sin puntuación (DT7). */
export const qrSesionDefinition = {
  tipo: QR_SESION_TIPO,
  crearPorDefecto: () => createDefaultQrSesionBlock(),
  Editor: QrSesionEditor,
  Viewer: QrSesionViewer,
  Propiedades: QrSesionPropiedades,
  apariencia: { color: true, tipografia: true, animacion: false },
  catalogo: CATALOGO_ELEMENTOS["qr-sesion"],
  presets: QR_SESION_PRESETS,
} as const satisfies ElementDefinition<QrSesionEstado, QrSesionConfig>;

export type QrSesionDefinition = typeof qrSesionDefinition;
