// ─── Registro único de comandos del editor (Y2, DY3) ──────────────────────────
// Cada acción del editor se declara UNA vez acá: id, etiqueta, icono, atajo, cuándo está habilitada y qué
// `Orden` ejecuta. De este registro salen el botón de la cinta, el atajo de teclado (`comandoDeTecla`) y,
// más adelante, el buscador `Ctrl+K` y el panel de atajos (Y5). Prohibido repetir etiqueta o atajo en otro
// lado. Sin React: los iconos son componentes de `lucide-react` (referencias, no JSX).

import type { ComponentType } from "react";
import { FORMAS, TIPOS_FORMA, TIPOS_ICONO, tieneHijos, type Escena, type TipoForma } from "@lumina/drawing";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Network,
  Orbit,
  Workflow,
  Paintbrush,
  PaintBucket,
  ClipboardCopy,
  ClipboardPaste,
  ClipboardType,
  Scissors,
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
  RotateCw,
  MousePointer2,
  Redo2,
  SendToBack,
  Spline,
  Trash2,
  Type,
  Keyboard,
  Search,
  GitBranchPlus,
  GitBranch,
  Link2,
  ListOrdered,
  BoxSelect,
  Bold,
  Italic,
  Underline,
  Lock,
  EyeOff,
  Ruler,
  Eraser,
  FlipHorizontal2,
  Shapes,
  Equal,
  List,
  ListTree,
  FoldVertical,
  ListCollapse,
  ChevronsUpDown,
  MoveDown,
  Undo2,
  Ungroup,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { seleccionPorCriterio, type CriterioSeleccion, type Orden, type TeclaEvento } from "./comandos.js";
import { formasAOrganizar, type DireccionOrganizar, type ModoOrganizar } from "./organizar-auto.js";
import { hayConectorConExtremoLibre, lineasElegidas } from "./conectores.js";
import { ESTILOS_FORMA, estiloActivo } from "./estilos-forma.js";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { ambitoDeTema } from "./temas-escena.js";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { motivoDeAjuste } from "./ajuste-texto.js";
import { conLista, hayFormato, hojasDeFormato, hojasEditables, listaDeSeleccion, valorComun, type FormatoDeTexto } from "./propiedades.js";
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
  /** Hay un formato copiado con el pincel (Y12b). */
  formatoGuardado?: boolean;
  /** El pincel está en uso: una vez, o fijo hasta salir (Y12b). */
  pincel?: "una-vez" | "fijo" | null;
  /** Las reglas están a la vista (Y16a). */
  reglas?: boolean;
  /** Cuántas guías hay puestas (Y16a). */
  guias?: number;
  /** «Crecer al escribir» está encendida (Y24b): preferencia del navegador. */
  crecerAlEscribir?: boolean;
}

/** Una combinación de teclas. `ctrl` vale por Ctrl o ⌘ y es exacto (por defecto, sin Ctrl); `shift` y `alt` solo se exigen si se indican. */
export interface Atajo {
  tecla: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

/** Dónde se abre el menú contextual (Y17): sobre una forma (o texto), sobre un conector o sobre un vacío. */
export type ContextoMenu = "forma" | "conector" | "vacio";

/** Cómo aparece un comando en el menú de un contexto. */
export interface EntradaMenu {
  /** Los grupos se separan con una línea; su orden lo fija `ORDEN_GRUPOS_MENU`. */
  grupo: string;
  /** Si lo lleva, el comando va dentro de ese submenú («Orden», «Alinear»). */
  submenu?: string;
  /** Solo aparece si se cumple (p. ej. «Alinear» con varios elementos). Sin esto, aparece siempre (deshabilitado con su motivo si no se puede). */
  si?: (c: ContextoComando) => boolean;
}

export type GrupoComando = "herramientas" | "formas" | "edicion" | "orden" | "formato" | "alinear" | "distribuir" | "vista" | "historial" | "cierre";

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
  /** Su atajo lo resuelve el navegador (eventos `copy`/`cut`/`paste`): se muestra y se busca, pero el editor no lo intercepta. */
  atajoNativo?: boolean;
  /** `true` si se puede; si no, el motivo en una frase (va en el tooltip). Sin esta función, siempre se puede. */
  habilitado?: (c: ContextoComando) => true | string;
  /** Botones de dos estados (herramienta elegida, cuadrícula encendida). */
  activo?: (c: ContextoComando) => boolean;
  /** En qué menús contextuales aparece y cómo (Y17). Todo comando declara `menu` o `sinMenu`: una prueba lo exige. */
  menu?: Partial<Record<ContextoMenu, EntradaMenu>>;
  /** Decidido a propósito: este comando no va en ningún menú contextual. */
  sinMenu?: true;
  /** Solo se puede pedir desde el menú contextual (no tiene botón en la cinta). */
  soloMenu?: true;
}

export interface EstadoComando {
  habilitado: boolean;
  /** Por qué está deshabilitado (vacío si está habilitado). */
  motivo: string;
  activo: boolean | undefined;
}

const hay = (c: ContextoComando): true | string => (c.seleccion.length > 0 ? true : "Elige un elemento");
const varios = (c: ContextoComando): true | string => (c.seleccion.length > 1 ? true : "Elige 2 o más elementos");
const unaForma = (c: ContextoComando): true | string => {
  if (c.seleccion.length !== 1) return "Elige una sola forma";
  const el = c.escena.elementos.find((e) => e.id === c.seleccion[0]);
  return el?.tipo === "forma" ? true : "Elige una forma (no una línea)";
};
const dosFormas = (c: ContextoComando): true | string => {
  const n = c.escena.elementos.filter((e) => e.tipo === "forma" && c.seleccion.includes(e.id)).length;
  return n >= 2 ? true : "Elige 2 o más formas";
};
/** Organizar (Y13): 2 o más formas elegidas, o ninguna elegida y 2 o más formas en el diagrama. */
const puedeOrganizar = (c: ContextoComando): true | string => {
  if (c.seleccion.length === 1) return "Elige 2 o más formas, o ninguna para organizar todo el diagrama";
  return formasAOrganizar(c.escena, c.seleccion) >= 2 ? true : "Hacen falta 2 o más formas";
};
const tres = (c: ContextoComando): true | string => (c.seleccion.length > 2 ? true : "Elige 3 o más elementos");
const hayGrupo = (c: ContextoComando): true | string =>
  c.escena.elementos.some((e) => e.tipo === "grupo" && c.seleccion.includes(e.id)) ? true : "Elige un grupo";

/** Plegar o desplegar rama (Y38b): hay una forma con hijos elegida. */
const hayRamaElegida = (c: ContextoComando): true | string =>
  c.escena.elementos.some((e) => e.tipo === "forma" && c.seleccion.includes(e.id) && tieneHijos(c.escena, e.id)) ? true : "Elige una forma con ramas";
/** Desplegar todas las ramas (Y38b): hay alguna plegada. */
const hayPlegada = (c: ContextoComando): true | string => (c.escena.elementos.some((e) => e.tipo === "forma" && e.colapsado === true) ? true : "No hay ramas plegadas");

const hayFormaElegida = (c: ContextoComando): true | string => {
  const ids = new Set(c.seleccion);
  const porId = new Map(c.escena.elementos.map((e) => [e.id, e]));
  const visitar = (id: string): boolean => {
    const e = porId.get(id);
    return e?.tipo === "forma" || (e?.tipo === "grupo" && e.hijos.some(visitar));
  };
  return [...ids].some(visitar) ? true : "Elige una forma";
};
/** «Seleccionar…» (Y15): habilitado si el criterio elegiría algo (invertir, siempre que haya algo elegible). */
const eligeAlgo = (criterio: CriterioSeleccion, vacio: string) => (c: ContextoComando): true | string => (seleccionPorCriterio(c.escena, c.seleccion, criterio).length > 0 ? true : vacio);

/** Formato de texto (Y18): hay una forma o un texto editables elegidos (un conector tiene su propia pestaña). */
const hayAlgoQueFormatear = (c: ContextoComando): true | string => (hayFormato(c.escena, c.seleccion) ? true : "Elige una forma o un texto");

/** Negrita, cursiva y subrayado: interruptores que valen para todo lo elegido; con valores mezclados no cuentan como activos. */
const formatoDeTexto = (id: FormatoDeTexto, etiqueta: string, icono: ComponentType<{ className?: string }>): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "formato",
  orden: { tipo: "formato-texto", propiedad: id },
  habilitado: hayAlgoQueFormatear,
  activo: (c) => {
    const v = valorComun(hojasDeFormato(c.escena, c.seleccion), (h) => h.estiloTexto[id]);
    return v !== null && !v.mixto && v.valor;
  },
  sinMenu: true,
});

/** Lista con viñetas o numerada (Y24a): interruptor para las formas y textos editables elegidos (un conector no lleva lista). */
const listaDeTexto = (id: "vinetas-puntos" | "vinetas-numeros", etiqueta: string, modo: "puntos" | "numeros", icono: ComponentType<{ className?: string }>): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "formato",
  orden: { tipo: "lista", modo },
  habilitado: (c) => (hojasDeFormato(c.escena, c.seleccion).some(conLista) ? true : "Elige una forma o un texto"),
  activo: (c) => {
    const v = listaDeSeleccion(c.escena, c.seleccion);
    return v !== null && !v.mixto && v.valor === modo;
  },
  sinMenu: true,
});

/** «Ajustar al texto» (Y24b): el alto justo para el texto; sale en la cinta, el menú contextual y `Ctrl+K`. */
const AJUSTAR_AL_TEXTO: DefinicionComando = {
  id: "ajustar-al-texto",
  etiqueta: "Ajustar al texto",
  icono: FoldVertical,
  grupo: "formato",
  orden: { tipo: "ajustar-al-texto" },
  habilitado: (c) => motivoDeAjuste(c.escena, c.seleccion),
  menu: { forma: { grupo: "edicion" } },
};

/** «Crecer al escribir» (Y24b): interruptor de una preferencia del navegador; sin botón suelto ni menú (vive en el panel y en `Ctrl+K`). */
const CRECER_AL_ESCRIBIR: DefinicionComando = {
  id: "crecer-al-escribir",
  etiqueta: "Crecer al escribir",
  icono: MoveDown,
  grupo: "formato",
  orden: { tipo: "crecer-al-escribir" },
  activo: (c) => c.crecerAlEscribir === true,
  sinMenu: true,
};

/** Las formas (no textos ni conectores) editables de la selección, grupos incluidos (Y19). */
const formasEditables = (c: ContextoComando) => hojasEditables(c.escena, c.seleccion).filter((h) => h.tipo === "forma");
const hayFormaEditable = (c: ContextoComando): boolean => formasEditables(c).length > 0;

/** «Cambiar a Rombo»: sin botón suelto; sale en el desplegable «Cambiar forma», en el menú contextual y en `Ctrl+K`. */
const cambiarForma = (forma: TipoForma): DefinicionComando => ({
  id: `cambiar-forma-${forma}`,
  etiqueta: `Cambiar a ${FORMAS[forma].nombre}`,
  grupo: "edicion", // «formas» son los de insertar (una prueba exige 22)
  orden: { tipo: "cambiar-forma", forma },
  habilitado: (c) => {
    const formas = formasEditables(c);
    if (formas.length === 0) return "Elige una forma";
    return formas.every((h) => h.tipo === "forma" && h.forma === forma) ? "Ya tiene esa forma" : true;
  },
  activo: (c) => {
    const formas = formasEditables(c);
    return formas.length > 0 && formas.every((h) => h.tipo === "forma" && h.forma === forma);
  },
  menu: { forma: { grupo: "edicion", submenu: "Cambiar forma", si: hayFormaEditable } },
});

/** «Estilo: Principal» (Y21): lo elegido (formas, textos y conectores) toma el estilo; el conector solo el color. */
const estiloComando = (e: (typeof ESTILOS_FORMA)[number]): DefinicionComando => ({
  id: `estilo-${e.id}`,
  etiqueta: `Estilo: ${e.nombre}`,
  grupo: "formato",
  orden: { tipo: "aplicar-estilo", estilo: e.id },
  habilitado: (c) => (hojasEditables(c.escena, c.seleccion).length > 0 ? true : "Elige una forma, un texto o un conector"),
  activo: (c) => estiloActivo(hojasEditables(c.escena, c.seleccion), e),
  sinMenu: true,
});

/** «Tema: Océano Profundo» (Y21): colorea por ramas la selección o, sin formas elegidas, todo el diagrama. */
const temaComando = (id: DiagramaPaletaId): DefinicionComando => ({
  id: `tema-${id}`,
  etiqueta: `Tema: ${PALETAS_DIAGRAMA[id].nombre}`,
  grupo: "formato",
  orden: { tipo: "aplicar-tema", paleta: id },
  habilitado: (c) => (ambitoDeTema(c.escena, c.seleccion).ids.length > 0 ? true : "No hay formas que colorear"),
  sinMenu: true,
});

/** Los 12 estilos y los 10 temas, en el orden de sus galerías. */
export const ESTILOS_COMANDOS: readonly DefinicionComando[] = ESTILOS_FORMA.map(estiloComando);
export const TEMAS_COMANDOS: readonly DefinicionComando[] = (Object.keys(PALETAS_DIAGRAMA) as DiagramaPaletaId[]).map(temaComando);

/** Los 22 comandos «Cambiar a …», en el orden del catálogo (Y19). */
export const CAMBIAR_FORMA: readonly DefinicionComando[] = TIPOS_FORMA.map(cambiarForma);

const varias = (c: ContextoComando): boolean => c.seleccion.length > 1;
const conExtremoLibre = (c: ContextoComando): boolean => hayConectorConExtremoLibre(c.escena, c.seleccion);

const ctrl = (tecla: string, extra: Omit<Atajo, "tecla" | "ctrl"> = {}): Atajo => ({ tecla, ctrl: true, ...extra });
const letra = (tecla: string): Atajo => ({ tecla, shift: false, alt: false });

/** Pasos del teclado al transformar (Y35, DY100). */
export const PASO_TAMANO_TECLADO = 10;
export const PASO_GIRO_TECLADO = 15;

const transformar = (id: string, etiqueta: string, atajo: Atajo, orden: Extract<Orden, { tipo: "transformar" }>): DefinicionComando => ({
  id,
  etiqueta,
  grupo: "edicion",
  atajos: [atajo],
  orden,
  soloLienzo: true,
  sinMenu: true,
  habilitado: hay,
});
const ctrlMayus = (tecla: string): Atajo => ({ tecla, ctrl: true, shift: true, alt: false });

/** Seis comandos: ancho y alto más y menos (`Ctrl+Mayús+flechas`) y giro a izquierda y derecha (`Re Pág` / `Av Pág`). */
export const TRANSFORMAR_COMANDOS: readonly DefinicionComando[] = [
  transformar("agrandar-ancho", "Agrandar el ancho", ctrlMayus("ArrowRight"), { tipo: "transformar", operacion: "tamano", dx: PASO_TAMANO_TECLADO, dy: 0 }),
  transformar("achicar-ancho", "Achicar el ancho", ctrlMayus("ArrowLeft"), { tipo: "transformar", operacion: "tamano", dx: -PASO_TAMANO_TECLADO, dy: 0 }),
  transformar("agrandar-alto", "Agrandar el alto", ctrlMayus("ArrowDown"), { tipo: "transformar", operacion: "tamano", dx: 0, dy: PASO_TAMANO_TECLADO }),
  transformar("achicar-alto", "Achicar el alto", ctrlMayus("ArrowUp"), { tipo: "transformar", operacion: "tamano", dx: 0, dy: -PASO_TAMANO_TECLADO }),
  transformar("girar-izquierda", "Girar a la izquierda", letra("PageUp"), { tipo: "transformar", operacion: "girar", grados: -PASO_GIRO_TECLADO }),
  transformar("girar-derecha", "Girar a la derecha", letra("PageDown"), { tipo: "transformar", operacion: "girar", grados: PASO_GIRO_TECLADO }),
];

const herramienta = (id: string, etiqueta: string, h: Herramienta, tecla: string, icono: ComponentType<{ className?: string }>, nombre: Orden): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "herramientas",
  atajos: [letra(tecla)],
  orden: nombre,
  soloLienzo: true,
  activo: (c) => esMismaHerramienta(c.herramienta, h),
  sinMenu: true,
});

const alineacion = (id: string, etiqueta: string, modo: "izquierda" | "centro" | "derecha" | "arriba" | "medio" | "abajo", icono: ComponentType<{ className?: string }>): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "alinear",
  orden: { tipo: "alinear", modo },
  habilitado: hay,
  menu: { forma: { grupo: "orden", submenu: "Alinear", si: varias } },
});

const FORMAS_COMANDOS: DefinicionComando[] = TIPOS_FORMA.map((forma) => ({
  id: `forma-${forma}`,
  etiqueta: `Insertar ${FORMAS[forma].nombre}`,
  grupo: "formas" as const,
  orden: { tipo: "herramienta-forma" as const, forma },
  activo: (c: ContextoComando) => esMismaHerramienta(c.herramienta, { tipo: "forma", forma }),
  sinMenu: true as const,
}));

/** Los 30 iconos (Y32): se insertan como una forma más, con la misma herramienta; el prefijo `forma-` los manda a la pestaña «Insertar». */
export const ICONOS_COMANDOS: readonly DefinicionComando[] = TIPOS_ICONO.map((forma) => ({
  id: `forma-${forma}`,
  etiqueta: `Insertar icono ${FORMAS[forma].nombre}`,
  grupo: "formas" as const,
  orden: { tipo: "herramienta-forma" as const, forma },
  activo: (c: ContextoComando) => esMismaHerramienta(c.herramienta, { tipo: "forma", forma }),
  sinMenu: true as const,
}));

const organizar = (id: string, etiqueta: string, modo: ModoOrganizar, direccion: DireccionOrganizar | undefined, icono: ComponentType<{ className?: string }>): DefinicionComando => ({
  id,
  etiqueta,
  icono,
  grupo: "orden",
  orden: { tipo: "organizar", modo, ...(direccion ? { direccion } : {}) },
  habilitado: puedeOrganizar,
  sinMenu: true,
});

/** Las disposiciones: la principal («Organizar automáticamente») y las variantes del menú desplegable (Y13). */
export const ORGANIZAR: readonly DefinicionComando[] = [
  organizar("organizar-auto", "Organizar automáticamente", "jerarquico", "abajo", Workflow),
  organizar("organizar-jerarquico-abajo", "Jerárquico: de arriba abajo", "jerarquico", "abajo", ArrowDown),
  organizar("organizar-jerarquico-derecha", "Jerárquico: de izquierda a derecha", "jerarquico", "derecha", ArrowRight),
  organizar("organizar-jerarquico-arriba", "Jerárquico: de abajo arriba", "jerarquico", "arriba", ArrowUp),
  organizar("organizar-jerarquico-izquierda", "Jerárquico: de derecha a izquierda", "jerarquico", "izquierda", ArrowLeft),
  organizar("organizar-arbol-derecha", "Árbol: hacia la derecha", "arbol", "derecha", Network),
  organizar("organizar-arbol-abajo", "Árbol: hacia abajo", "arbol", "abajo", Network),
  organizar("organizar-radial", "Radial", "radial", undefined, Orbit),
];

/** El desplegable «Seleccionar» (Y15): «Seleccionar todo» es el botón principal y estos, las variantes de su flecha. */
export const ELEGIR: readonly DefinicionComando[] = [
  { id: "elegir-formas", sinMenu: true, etiqueta: "Seleccionar formas", icono: Shapes, grupo: "edicion", orden: { tipo: "elegir", criterio: "formas" }, habilitado: eligeAlgo("formas", "No hay formas que elegir") },
  { id: "elegir-conectores", sinMenu: true, etiqueta: "Seleccionar conectores", icono: Spline, grupo: "edicion", orden: { tipo: "elegir", criterio: "conectores" }, habilitado: eligeAlgo("conectores", "No hay conectores que elegir") },
  { id: "elegir-textos", sinMenu: true, etiqueta: "Seleccionar textos", icono: Type, grupo: "edicion", orden: { tipo: "elegir", criterio: "textos" }, habilitado: eligeAlgo("textos", "No hay textos que elegir") },
  { id: "elegir-iguales", sinMenu: true, etiqueta: "Seleccionar iguales a la elegida", icono: Equal, grupo: "edicion", orden: { tipo: "elegir", criterio: "iguales" }, habilitado: hayFormaElegida },
  { id: "elegir-invertir", sinMenu: true, etiqueta: "Invertir selección", icono: FlipHorizontal2, grupo: "edicion", orden: { tipo: "elegir", criterio: "invertir" }, habilitado: (c) => (c.escena.elementos.length > 0 ? true : "No hay nada que elegir") },
  { id: "elegir-rama", sinMenu: true, etiqueta: "Seleccionar rama de la elegida", icono: ListTree, grupo: "edicion", orden: { tipo: "elegir", criterio: "rama" }, habilitado: unaForma },
];

export const COMANDOS: readonly DefinicionComando[] = [
  // Historial
  { id: "deshacer", sinMenu: true, etiqueta: "Deshacer", icono: Undo2, grupo: "historial", atajos: [ctrl("z", { shift: false })], orden: { tipo: "deshacer" }, habilitado: (c) => (c.puedeDeshacer ? true : "No hay nada que deshacer") },
  { id: "rehacer", sinMenu: true, etiqueta: "Rehacer", icono: Redo2, grupo: "historial", atajos: [ctrl("y"), ctrl("z", { shift: true })], orden: { tipo: "rehacer" }, habilitado: (c) => (c.puedeRehacer ? true : "No hay nada que rehacer") },

  // Herramientas
  herramienta("seleccionar", "Seleccionar", SELECCIONAR, "v", MousePointer2, { tipo: "herramienta", herramienta: "seleccionar" }),
  herramienta("linea", "Línea", { tipo: "linea", flecha: false }, "l", Spline, { tipo: "herramienta", herramienta: "linea" }),
  herramienta("flecha", "Flecha", { tipo: "linea", flecha: true }, "a", ArrowRight, { tipo: "herramienta", herramienta: "flecha" }),
  herramienta("texto", "Texto", { tipo: "texto" }, "t", Type, { tipo: "herramienta", herramienta: "texto" }),
  ...FORMAS_COMANDOS,
  ...ICONOS_COMANDOS,

  // Edición
  // Portapapeles (Y12a): los atajos los resuelve el navegador con sus eventos; el editor solo los muestra.
  { id: "cortar", menu: { forma: { grupo: "portapapeles" } }, etiqueta: "Cortar", icono: Scissors, grupo: "edicion", atajos: [ctrl("x", { shift: false, alt: false })], atajoNativo: true, orden: { tipo: "cortar" }, habilitado: hay },
  { id: "copiar", menu: { forma: { grupo: "portapapeles" } }, etiqueta: "Copiar", icono: ClipboardCopy, grupo: "edicion", atajos: [ctrl("c", { shift: false, alt: false })], atajoNativo: true, orden: { tipo: "copiar" }, habilitado: hay },
  { id: "pegar", menu: { forma: { grupo: "portapapeles" }, vacio: { grupo: "portapapeles" } }, etiqueta: "Pegar", icono: ClipboardPaste, grupo: "edicion", atajos: [ctrl("v", { shift: false, alt: false })], atajoNativo: true, orden: { tipo: "pegar" } },
  { id: "pegar-en-sitio", sinMenu: true, etiqueta: "Pegar en el mismo sitio", icono: ClipboardType, grupo: "edicion", atajos: [ctrl("v", { shift: true, alt: false })], atajoNativo: true, orden: { tipo: "pegar-en-sitio" } },
  // Organizar automáticamente (Y13)
  ...ORGANIZAR,
  // Esquema → diagrama (Y14)
  { id: "esquema", sinMenu: true, etiqueta: "Esquema…", icono: ListOrdered, grupo: "edicion", orden: { tipo: "esquema" } },
  // Pincel (Y12b)
  { id: "copiar-formato", sinMenu: true, etiqueta: "Copiar formato", icono: Paintbrush, grupo: "edicion", atajos: [ctrl("c", { shift: false, alt: true })], orden: { tipo: "copiar-formato" }, habilitado: hay, activo: (c) => (c.pincel ?? null) !== null },
  {
    id: "aplicar-formato", sinMenu: true,
    etiqueta: "Aplicar formato",
    icono: PaintBucket,
    grupo: "edicion",
    atajos: [ctrl("v", { shift: false, alt: true })],
    orden: { tipo: "aplicar-formato" },
    habilitado: (c) => (c.formatoGuardado !== true ? "Copia un formato primero" : c.seleccion.length > 0 ? true : "Elige un elemento"),
  },
  { id: "duplicar", menu: { forma: { grupo: "edicion" } }, etiqueta: "Duplicar", icono: Copy, grupo: "edicion", atajos: [ctrl("d")], orden: { tipo: "duplicar" }, habilitado: hay },
  // Transformar con el teclado (Y35): pasos fijos de 10 unidades y 15° (DY100); lo exacto va en los campos del panel.
  ...TRANSFORMAR_COMANDOS,
  { id: "eliminar", menu: { forma: { grupo: "edicion" }, conector: { grupo: "edicion" } }, etiqueta: "Eliminar", icono: Trash2, grupo: "edicion", atajos: [{ tecla: "Delete" }, { tecla: "Backspace" }], orden: { tipo: "eliminar" }, habilitado: hay },
  {
    id: "crear-hijo", menu: { forma: { grupo: "jerarquia" } },
    etiqueta: "Agregar hijo",
    icono: GitBranchPlus,
    grupo: "edicion",
    atajos: [ctrl("Enter", { shift: false })],
    orden: { tipo: "crear-hijo" },
    soloLienzo: true,
    habilitado: unaForma,
  },
  {
    id: "crear-hermano", menu: { forma: { grupo: "jerarquia" } },
    etiqueta: "Agregar hermano",
    icono: GitBranch,
    grupo: "edicion",
    atajos: [ctrl("Enter", { shift: true })],
    orden: { tipo: "crear-hermano" },
    soloLienzo: true,
    habilitado: (c) => {
      const f = unaForma(c);
      if (f !== true) return f;
      const hijo = c.seleccion[0]!;
      const tienePadre = c.escena.elementos.some((e) => e.tipo === "linea" && e.destino?.elementoId === hijo && e.origen?.elementoId);
      return tienePadre ? true : "La forma no tiene padre (conector entrante)";
    },
  },
  {
    id: "eliminar-rama", sinMenu: true,
    etiqueta: "Borrar rama",
    icono: ListTree,
    grupo: "edicion",
    atajos: [ctrl("Delete")],
    orden: { tipo: "eliminar-rama" },
    soloLienzo: true,
    habilitado: unaForma,
  },
  {
    id: "plegar-rama", menu: { forma: { grupo: "jerarquia", si: (c) => hayRamaElegida(c) === true } },
    etiqueta: "Plegar o desplegar rama",
    icono: ListCollapse,
    grupo: "edicion",
    atajos: [{ tecla: "/" }],
    orden: { tipo: "plegar-rama" },
    soloLienzo: true,
    habilitado: hayRamaElegida,
  },
  {
    id: "desplegar-todo", menu: { vacio: { grupo: "vista", si: (c) => hayPlegada(c) === true } },
    etiqueta: "Desplegar todas las ramas",
    icono: ChevronsUpDown,
    grupo: "vista",
    orden: { tipo: "desplegar-todo" },
    habilitado: hayPlegada,
  },
  {
    id: "conectar-cadena", sinMenu: true,
    etiqueta: "Conectar en cadena",
    icono: Link2,
    grupo: "edicion",
    atajos: [ctrl("l")],
    orden: { tipo: "conectar-cadena", orden: "auto" },
    soloLienzo: true,
    habilitado: dosFormas,
  },
  {
    id: "pegar-al-mas-cercano", menu: { conector: { grupo: "conector", si: conExtremoLibre } },
    etiqueta: "Pegar al más cercano",
    icono: Anchor,
    grupo: "edicion",
    orden: { tipo: "pegar-al-mas-cercano" },
    habilitado: (c) => {
      if (lineasElegidas(c.escena, c.seleccion).length === 0) return "Elige un conector";
      return hayConectorConExtremoLibre(c.escena, c.seleccion) ? true : "El conector no tiene un extremo libre";
    },
  },
  ...ELEGIR,
  { id: "seleccionar-todo", menu: { vacio: { grupo: "seleccion" } }, etiqueta: "Seleccionar todo", icono: BoxSelect, grupo: "edicion", atajos: [ctrl("a")], orden: { tipo: "seleccionar-todo" } },
  { id: "bloquear", etiqueta: "Bloquear", icono: Lock, grupo: "edicion", orden: { tipo: "bloquear" }, habilitado: hay, soloMenu: true, menu: { forma: { grupo: "estado" } } },
  { id: "ocultar", etiqueta: "Ocultar", icono: EyeOff, grupo: "edicion", orden: { tipo: "ocultar" }, habilitado: hay, soloMenu: true, menu: { forma: { grupo: "estado" } } },
  { id: "agrupar", menu: { forma: { grupo: "agrupar" } }, etiqueta: "Agrupar", icono: Group, grupo: "edicion", atajos: [ctrl("g", { shift: false })], orden: { tipo: "agrupar" }, habilitado: varios },
  { id: "desagrupar", menu: { forma: { grupo: "agrupar" } }, etiqueta: "Desagrupar", icono: Ungroup, grupo: "edicion", atajos: [ctrl("g", { shift: true })], orden: { tipo: "desagrupar" }, habilitado: hayGrupo },

  // Cambiar la forma de lo elegido (Y19)
  ...CAMBIAR_FORMA,

  // Estilos de forma y temas del diagrama (Y21)
  ...ESTILOS_COMANDOS,
  ...TEMAS_COMANDOS,

  // Formato de texto (Y18): sin atajo; Ctrl+B/I/U se evalúan al tocar el texto en el sitio.
  formatoDeTexto("negrita", "Negrita", Bold),
  formatoDeTexto("cursiva", "Cursiva", Italic),
  formatoDeTexto("subrayado", "Subrayado", Underline),
  listaDeTexto("vinetas-puntos", "Lista con viñetas", "puntos", List),
  listaDeTexto("vinetas-numeros", "Lista numerada", "numeros", ListOrdered),

  // Ajustar la forma al texto y crecer al escribir (Y24b)
  AJUSTAR_AL_TEXTO,
  CRECER_AL_ESCRIBIR,

  // Orden de capas
  { id: "orden-frente", menu: { forma: { grupo: "orden", submenu: "Orden" }, conector: { grupo: "orden", submenu: "Orden" } }, etiqueta: "Traer al frente", icono: BringToFront, grupo: "orden", atajos: [ctrl("]", { shift: true })], orden: { tipo: "orden", modo: "frente" }, habilitado: hay },
  { id: "orden-subir", menu: { forma: { grupo: "orden", submenu: "Orden" }, conector: { grupo: "orden", submenu: "Orden" } }, etiqueta: "Subir un nivel", icono: ChevronUp, grupo: "orden", atajos: [ctrl("]", { shift: false })], orden: { tipo: "orden", modo: "subir" }, habilitado: hay },
  { id: "orden-bajar", menu: { forma: { grupo: "orden", submenu: "Orden" }, conector: { grupo: "orden", submenu: "Orden" } }, etiqueta: "Bajar un nivel", icono: ChevronDown, grupo: "orden", atajos: [ctrl("[", { shift: false })], orden: { tipo: "orden", modo: "bajar" }, habilitado: hay },
  { id: "orden-fondo", menu: { forma: { grupo: "orden", submenu: "Orden" }, conector: { grupo: "orden", submenu: "Orden" } }, etiqueta: "Enviar al fondo", icono: SendToBack, grupo: "orden", atajos: [ctrl("[", { shift: true })], orden: { tipo: "orden", modo: "fondo" }, habilitado: hay },

  // Alinear y distribuir
  alineacion("alinear-izquierda", "Alinear a la izquierda", "izquierda", AlignStartVertical),
  alineacion("alinear-centro", "Centrar horizontalmente", "centro", AlignCenterVertical),
  alineacion("alinear-derecha", "Alinear a la derecha", "derecha", AlignEndVertical),
  alineacion("alinear-arriba", "Alinear arriba", "arriba", AlignStartHorizontal),
  alineacion("alinear-medio", "Centrar verticalmente", "medio", AlignCenterHorizontal),
  alineacion("alinear-abajo", "Alinear abajo", "abajo", AlignEndHorizontal),
  { id: "distribuir-horizontal", sinMenu: true, etiqueta: "Distribuir horizontalmente", icono: AlignHorizontalSpaceBetween, grupo: "distribuir", orden: { tipo: "distribuir", eje: "horizontal" }, habilitado: tres },
  { id: "distribuir-vertical", sinMenu: true, etiqueta: "Distribuir verticalmente", icono: AlignVerticalSpaceBetween, grupo: "distribuir", orden: { tipo: "distribuir", eje: "vertical" }, habilitado: tres },

  // Vista
  { id: "alejar", sinMenu: true, etiqueta: "Alejar", icono: ZoomOut, grupo: "vista", orden: { tipo: "zoom", factor: 1 / 1.25 }, habilitado: (c) => (c.zoom > ZOOM_MIN ? true : "Ya está al zoom mínimo") },
  { id: "acercar", sinMenu: true, etiqueta: "Acercar", icono: ZoomIn, grupo: "vista", orden: { tipo: "zoom", factor: 1.25 }, habilitado: (c) => (c.zoom < ZOOM_MAX ? true : "Ya está al zoom máximo") },
  { id: "ajustar-vista", sinMenu: true, etiqueta: "Ajustar a la ventana", icono: Maximize, grupo: "vista", orden: { tipo: "ajustar-vista" } },
  { id: "girar-pagina", sinMenu: true, etiqueta: "Girar la página", icono: RotateCw, grupo: "vista", orden: { tipo: "girar-pagina" } },
  { id: "cuadricula", menu: { vacio: { grupo: "vista" } }, etiqueta: "Cuadrícula", icono: Grid3x3, grupo: "vista", orden: { tipo: "cuadricula" }, activo: (c) => c.cuadricula },
  { id: "imantar", menu: { vacio: { grupo: "vista" } }, etiqueta: "Imantar a otros elementos", icono: Magnet, grupo: "vista", orden: { tipo: "imantar" }, activo: (c) => c.imantar },
  { id: "reglas", menu: { vacio: { grupo: "vista" } }, etiqueta: "Reglas", icono: Ruler, grupo: "vista", orden: { tipo: "reglas" }, activo: (c) => c.reglas === true },
  { id: "quitar-guias", sinMenu: true, etiqueta: "Quitar guías", icono: Eraser, grupo: "vista", orden: { tipo: "quitar-guias" }, habilitado: (c) => ((c.guias ?? 0) > 0 ? true : "No hay guías") },
  { id: "buscar-comando", sinMenu: true, etiqueta: "Buscar comando", icono: Search, grupo: "vista", atajos: [ctrl("k")], orden: { tipo: "buscar-comando" } },
  { id: "describir-dibujo", sinMenu: true, etiqueta: "Describir el dibujo", grupo: "vista", atajos: [letra("i")], soloLienzo: true, orden: { tipo: "describir-dibujo" } },
  { id: "atajos", sinMenu: true, etiqueta: "Atajos de teclado", icono: Keyboard, grupo: "vista", atajos: [{ tecla: "?", shift: true }], orden: { tipo: "ver-atajos" } },

  // Cierre
  { id: "listo", sinMenu: true, etiqueta: "Listo", icono: Check, grupo: "cierre", orden: { tipo: "terminar" } },
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

// ─── Menú contextual (Y17) ────────────────────────────────────────────────────
// El menú sale del registro: las etiquetas, los atajos, los iconos y los motivos de «no se puede» son los de siempre.

/** El orden de los grupos de cada menú; entre grupos va una línea. */
export const ORDEN_GRUPOS_MENU: Readonly<Record<ContextoMenu, readonly string[]>> = {
  forma: ["portapapeles", "edicion", "jerarquia", "orden", "agrupar", "estado"],
  conector: ["conector", "edicion", "orden"],
  vacio: ["portapapeles", "seleccion", "vista"],
};

export interface ItemDeMenu {
  def: DefinicionComando;
  estado: EstadoComando;
}

export type ElementoDeMenu = { clase: "comando"; item: ItemDeMenu } | { clase: "submenu"; etiqueta: string; items: ItemDeMenu[] } | { clase: "separador" };

/** Qué contexto de menú corresponde a una selección: sin nada, «vacío»; solo conectores, «conector»; si no, «forma». */
export function contextoDeMenu(escena: Escena, seleccion: readonly string[]): ContextoMenu {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  if (elegidos.length === 0) return "vacio";
  return elegidos.every((e) => e.tipo === "linea") ? "conector" : "forma";
}

/** Lo que muestra el menú de un contexto, en orden y con líneas entre grupos. Un grupo sin nada que mostrar no deja línea de más. */
export function menuDe(en: ContextoMenu, ctx: ContextoComando): ElementoDeMenu[] {
  const salida: ElementoDeMenu[] = [];
  for (const grupo of ORDEN_GRUPOS_MENU[en]) {
    const delGrupo: ElementoDeMenu[] = [];
    for (const def of COMANDOS) {
      const entrada = def.menu?.[en];
      if (!entrada || entrada.grupo !== grupo || (entrada.si && !entrada.si(ctx))) continue;
      const item: ItemDeMenu = { def, estado: estadoComando(def, ctx) };
      if (!entrada.submenu) {
        delGrupo.push({ clase: "comando", item });
        continue;
      }
      const previo = delGrupo.find((x): x is Extract<ElementoDeMenu, { clase: "submenu" }> => x.clase === "submenu" && x.etiqueta === entrada.submenu);
      if (previo) previo.items.push(item);
      else delGrupo.push({ clase: "submenu", etiqueta: entrada.submenu, items: [item] });
    }
    if (delGrupo.length === 0) continue;
    if (salida.length > 0) salida.push({ clase: "separador" });
    salida.push(...delGrupo);
  }
  return salida;
}
