// ─── Registro único de comandos del editor (Y2, DY3) ──────────────────────────
// Cada acción del editor se declara UNA vez acá: id, etiqueta, icono, atajo, cuándo está habilitada y qué
// `Orden` ejecuta. De este registro salen el botón de la cinta, el atajo de teclado (`comandoDeTecla`) y,
// más adelante, el buscador `Ctrl+K` y el panel de atajos (Y5). Prohibido repetir etiqueta o atajo en otro
// lado. Sin React: los iconos son componentes de `lucide-react` (referencias, no JSX).

import type { ComponentType } from "react";
import { FORMAS, TIPOS_FORMA, type Escena } from "@lumina/drawing";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  ArrowRight,
  BringToFront,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Grid3x3,
  Group,
  Magnet,
  Maximize,
  MousePointer2,
  Redo2,
  SendToBack,
  Spline,
  Trash2,
  Type,
  Keyboard,
  Search,
  Undo2,
  Ungroup,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Orden, TeclaEvento } from "./comandos.js";
import { esMismaHerramienta, SELECCIONAR, type Herramienta } from "./herramientas.js";
import { ZOOM_MAX, ZOOM_MIN } from "./vista.js";

/** Lo que el registro necesita saber del editor para decidir si un comando está habilitado o activo. */
export interface ContextoComando {
  escena: Escena;
  seleccion: readonly string[];
  herramienta: Herramienta;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  zoom: number;
  cuadricula: boolean;
  imantar: boolean;
}

/** Una combinación de teclas. `ctrl` vale por Ctrl o ⌘ y es exacto (por defecto, sin Ctrl); `shift` y `alt` solo se exigen si se indican. */
export interface Atajo {
  tecla: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type GrupoComando = "herramientas" | "formas" | "edicion" | "orden" | "alinear" | "distribuir" | "vista" | "historial" | "cierre";

export interface DefinicionComando {
  id: string;
  etiqueta: string;
  icono?: ComponentType<{ className?: string }>;
  grupo: GrupoComando;
  /** El primero es el que se muestra; todos valen. */
  atajos?: readonly Atajo[];
  /** Qué hace: el editor lo ejecuta igual venga de un botón o del teclado. */
  orden: Orden;
  /** Solo vale con el foco en el lienzo (las letras de herramienta, para no robar teclas a la cinta). */
  soloLienzo?: boolean;
  /** `true` si se puede; si no, el motivo en una frase (va en el tooltip). Sin esta función, siempre se puede. */
  habilitado?: (c: ContextoComando) => true | string;
  /** Botones de dos estados (herramienta elegida, cuadrícula encendida). */
  activo?: (c: ContextoComando) => boolean;
}

export interface EstadoComando {
  habilitado: boolean;
  /** Por qué está deshabilitado (vacío si está habilitado). */
  motivo: string;
  activo: boolean | undefined;
}

const hay = (c: ContextoComando): true | string => (c.seleccion.length > 0 ? true : "Elige un elemento");
const varios = (c: ContextoComando): true | string => (c.seleccion.length > 1 ? true : "Elige 2 o más elementos");
const tres = (c: ContextoComando): true | string => (c.seleccion.length > 2 ? true : "Elige 3 o más elementos");
const hayGrupo = (c: ContextoComando): true | string =>
  c.escena.elementos.some((e) => e.tipo === "grupo" && c.seleccion.includes(e.id)) ? true : "Elige un grupo";

const ctrl = (tecla: string, extra: Omit<Atajo, "tecla" | "ctrl"> = {}): Atajo => ({ tecla, ctrl: true, ...extra });
const letra = (tecla: string): Atajo => ({ tecla, shift: false, alt: false });

const herramienta = (id: string, etiqueta: string, h: Herramienta, tecla: string, icono: ComponentType<{ className?: string }>, nombre: Orden): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "herramientas",
  atajos: [letra(tecla)],
  orden: nombre,
  soloLienzo: true,
  activo: (c) => esMismaHerramienta(c.herramienta, h),
});

const alineacion = (id: string, etiqueta: string, modo: "izquierda" | "centro" | "derecha" | "arriba" | "medio" | "abajo", icono: ComponentType<{ className?: string }>): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "alinear",
  orden: { tipo: "alinear", modo },
  habilitado: hay,
});

const FORMAS_COMANDOS: DefinicionComando[] = TIPOS_FORMA.map((forma) => ({
  id: `forma-${forma}`,
  etiqueta: `Insertar ${FORMAS[forma].nombre}`,
  grupo: "formas" as const,
  orden: { tipo: "herramienta-forma" as const, forma },
  activo: (c: ContextoComando) => esMismaHerramienta(c.herramienta, { tipo: "forma", forma }),
}));

export const COMANDOS: readonly DefinicionComando[] = [
  // Historial
  { id: "deshacer", etiqueta: "Deshacer", icono: Undo2, grupo: "historial", atajos: [ctrl("z", { shift: false })], orden: { tipo: "deshacer" }, habilitado: (c) => (c.puedeDeshacer ? true : "No hay nada que deshacer") },
  { id: "rehacer", etiqueta: "Rehacer", icono: Redo2, grupo: "historial", atajos: [ctrl("y"), ctrl("z", { shift: true })], orden: { tipo: "rehacer" }, habilitado: (c) => (c.puedeRehacer ? true : "No hay nada que rehacer") },

  // Herramientas
  herramienta("seleccionar", "Seleccionar", SELECCIONAR, "v", MousePointer2, { tipo: "herramienta", herramienta: "seleccionar" }),
  herramienta("linea", "Línea", { tipo: "linea", flecha: false }, "l", Spline, { tipo: "herramienta", herramienta: "linea" }),
  herramienta("flecha", "Flecha", { tipo: "linea", flecha: true }, "a", ArrowRight, { tipo: "herramienta", herramienta: "flecha" }),
  herramienta("texto", "Texto", { tipo: "texto" }, "t", Type, { tipo: "herramienta", herramienta: "texto" }),
  ...FORMAS_COMANDOS,

  // Edición
  { id: "duplicar", etiqueta: "Duplicar", icono: Copy, grupo: "edicion", atajos: [ctrl("d")], orden: { tipo: "duplicar" }, habilitado: hay },
  { id: "eliminar", etiqueta: "Eliminar", icono: Trash2, grupo: "edicion", atajos: [{ tecla: "Delete" }, { tecla: "Backspace" }], orden: { tipo: "eliminar" }, habilitado: hay },
  { id: "seleccionar-todo", etiqueta: "Seleccionar todo", grupo: "edicion", atajos: [ctrl("a")], orden: { tipo: "seleccionar-todo" } },
  { id: "agrupar", etiqueta: "Agrupar", icono: Group, grupo: "edicion", atajos: [ctrl("g", { shift: false })], orden: { tipo: "agrupar" }, habilitado: varios },
  { id: "desagrupar", etiqueta: "Desagrupar", icono: Ungroup, grupo: "edicion", atajos: [ctrl("g", { shift: true })], orden: { tipo: "desagrupar" }, habilitado: hayGrupo },

  // Orden de capas
  { id: "orden-frente", etiqueta: "Traer al frente", icono: BringToFront, grupo: "orden", atajos: [ctrl("]", { shift: true })], orden: { tipo: "orden", modo: "frente" }, habilitado: hay },
  { id: "orden-subir", etiqueta: "Subir un nivel", icono: ChevronUp, grupo: "orden", atajos: [ctrl("]", { shift: false })], orden: { tipo: "orden", modo: "subir" }, habilitado: hay },
  { id: "orden-bajar", etiqueta: "Bajar un nivel", icono: ChevronDown, grupo: "orden", atajos: [ctrl("[", { shift: false })], orden: { tipo: "orden", modo: "bajar" }, habilitado: hay },
  { id: "orden-fondo", etiqueta: "Enviar al fondo", icono: SendToBack, grupo: "orden", atajos: [ctrl("[", { shift: true })], orden: { tipo: "orden", modo: "fondo" }, habilitado: hay },

  // Alinear y distribuir
  alineacion("alinear-izquierda", "Alinear a la izquierda", "izquierda", AlignStartVertical),
  alineacion("alinear-centro", "Centrar horizontalmente", "centro", AlignCenterVertical),
  alineacion("alinear-derecha", "Alinear a la derecha", "derecha", AlignEndVertical),
  alineacion("alinear-arriba", "Alinear arriba", "arriba", AlignStartHorizontal),
  alineacion("alinear-medio", "Centrar verticalmente", "medio", AlignCenterHorizontal),
  alineacion("alinear-abajo", "Alinear abajo", "abajo", AlignEndHorizontal),
  { id: "distribuir-horizontal", etiqueta: "Distribuir horizontalmente", icono: AlignHorizontalSpaceBetween, grupo: "distribuir", orden: { tipo: "distribuir", eje: "horizontal" }, habilitado: tres },
  { id: "distribuir-vertical", etiqueta: "Distribuir verticalmente", icono: AlignVerticalSpaceBetween, grupo: "distribuir", orden: { tipo: "distribuir", eje: "vertical" }, habilitado: tres },

  // Vista
  { id: "alejar", etiqueta: "Alejar", icono: ZoomOut, grupo: "vista", orden: { tipo: "zoom", factor: 1 / 1.25 }, habilitado: (c) => (c.zoom > ZOOM_MIN ? true : "Ya está al zoom mínimo") },
  { id: "acercar", etiqueta: "Acercar", icono: ZoomIn, grupo: "vista", orden: { tipo: "zoom", factor: 1.25 }, habilitado: (c) => (c.zoom < ZOOM_MAX ? true : "Ya está al zoom máximo") },
  { id: "ajustar-vista", etiqueta: "Ajustar a la ventana", icono: Maximize, grupo: "vista", orden: { tipo: "ajustar-vista" } },
  { id: "cuadricula", etiqueta: "Cuadrícula", icono: Grid3x3, grupo: "vista", orden: { tipo: "cuadricula" }, activo: (c) => c.cuadricula },
  { id: "imantar", etiqueta: "Imantar a otros elementos", icono: Magnet, grupo: "vista", orden: { tipo: "imantar" }, activo: (c) => c.imantar },
  { id: "buscar-comando", etiqueta: "Buscar comando", icono: Search, grupo: "vista", atajos: [ctrl("k")], orden: { tipo: "buscar-comando" } },
  { id: "atajos", etiqueta: "Atajos de teclado", icono: Keyboard, grupo: "vista", atajos: [{ tecla: "?", shift: true }], orden: { tipo: "ver-atajos" } },

  // Cierre
  { id: "listo", etiqueta: "Listo", icono: Check, grupo: "cierre", orden: { tipo: "terminar" } },
];

const POR_ID = new Map(COMANDOS.map((c) => [c.id, c]));

/** El comando de un id; lanza si no existe (un id mal escrito es un error de programación, no de usuario). */
export function comando(id: string): DefinicionComando {
  const c = POR_ID.get(id);
  if (!c) throw new Error(`Comando desconocido: ${id}`);
  return c;
}

export function estadoComando(def: DefinicionComando, ctx: ContextoComando): EstadoComando {
  const h = def.habilitado ? def.habilitado(ctx) : true;
  return { habilitado: h === true, motivo: h === true ? "" : h, activo: def.activo ? def.activo(ctx) : undefined };
}

// ─── Atajos ───────────────────────────────────────────────────────────────────

const normalizar = (key: string): string => (key.length === 1 ? key.toLowerCase() : key);

function coincide(a: Atajo, e: TeclaEvento): boolean {
  if (normalizar(e.key) !== a.tecla) return false;
  if ((e.ctrlKey || e.metaKey) !== (a.ctrl ?? false)) return false;
  if (a.shift !== undefined && e.shiftKey !== a.shift) return false;
  if (a.alt !== undefined && e.altKey !== a.alt) return false;
  return true;
}

/** El comando que pide una tecla, o `null`. */
export function comandoDeTecla(e: TeclaEvento): DefinicionComando | null {
  return COMANDOS.find((c) => c.atajos?.some((a) => coincide(a, e))) ?? null;
}

const NOMBRE_TECLA: Record<string, string> = { Delete: "Supr", Backspace: "Retroceso" };

function textoDeUnAtajo(a: Atajo): string {
  const tecla = NOMBRE_TECLA[a.tecla] ?? (a.tecla.length === 1 ? a.tecla.toUpperCase() : a.tecla);
  return [a.ctrl ? "Ctrl" : null, a.shift ? "Mayús" : null, a.alt ? "Alt" : null, tecla].filter(Boolean).join("+");
}

/** Todas las combinaciones en texto (la cinta muestra solo la primera vía `textoDeAtajo`). */
export function textosDeAtajos(def: DefinicionComando): string[] {
  if (!def.atajos?.length) return [];
  return def.atajos.map(textoDeUnAtajo);
}

/** El atajo en texto para mostrar («Ctrl+Mayús+G»), o `undefined` si el comando no tiene. */
export function textoDeAtajo(def: DefinicionComando): string | undefined {
  return textosDeAtajos(def)[0];
}
