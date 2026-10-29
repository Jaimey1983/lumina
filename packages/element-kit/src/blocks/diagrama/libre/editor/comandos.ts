// ─── Comandos y atajos de teclado del editor (W5) ─────────────────────────────
// Un comando recibe el estado (escena + selección) y devuelve el nuevo, o `null` si no hay nada que hacer.

import {
  agrupar,
  alinear,
  bloquear as bloquearElementos,
  conectarEnCadena,
  crearHijo,
  desagrupar,
  distribuir,
  duplicar,
  eliminar,
  eliminarRama,
  filtrarFormasParaCadena,
  fijarColapso,
  invertirSeleccion,
  LADO_HIJO_TECLADO,
  mover,
  ocultar as ocultarElementos,
  ocultosPorColapso,
  ordenEspacialParaCadena,
  ordenParaCadena,
  redimensionar,
  reordenar,
  rotar,
  seleccionarIguales,
  seleccionarPorTipo,
  seleccionarRama,
  tieneHijos,
  type Escena,
  type ModoAlineacion,
  type ModoOrden,
  type TipoForma,
} from "@lumina/drawing";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { bloqueadosEfectivos } from "./asas.js";
import { comandoDeTecla } from "./comandos-registro.js";
import { pegarAlMasCercano } from "./conectores.js";
import type { DireccionOrganizar, ModoOrganizar } from "./organizar-auto.js";

export interface EstadoEditor {
  escena: Escena;
  seleccion: string[];
}

export type Comando =
  | { tipo: "eliminar" }
  | { tipo: "duplicar" }
  | { tipo: "seleccionar-todo" }
  | { tipo: "deseleccionar" }
  | { tipo: "agrupar" }
  | { tipo: "desagrupar" }
  | { tipo: "mover"; dx: number; dy: number }
  /** Transformar con el teclado (Y35): cambiar el tamaño desde la esquina superior izquierda (DY101) o girar. */
  | { tipo: "transformar"; operacion: "tamano"; dx: number; dy: number }
  | { tipo: "transformar"; operacion: "girar"; grados: number }
  | { tipo: "orden"; modo: ModoOrden }
  | { tipo: "alinear"; modo: ModoAlineacion }
  | { tipo: "distribuir"; eje: "horizontal" | "vertical" }
  | { tipo: "siguiente"; atras: boolean }
  | { tipo: "crear-hijo" }
  | { tipo: "crear-hermano" }
  | { tipo: "eliminar-rama" }
  /** Bloquear y ocultar lo elegido (Y17): lo bloqueado y lo oculto ya no se pueden elegir, así que la selección queda vacía. */
  | { tipo: "bloquear" }
  | { tipo: "ocultar" }
  | { tipo: "conectar-cadena"; orden: "seleccion" | "espacial" | "auto" }
  | { tipo: "pegar-al-mas-cercano" };

/** Padre inmediato por conector entrante (origen→hijo); `null` si no hay. */
export function padreConectorDe(escena: Escena, hijoId: string): string | null {
  for (const e of escena.elementos) {
    if (e.tipo === "linea" && e.destino?.elementoId === hijoId && e.origen?.elementoId) return e.origen.elementoId;
  }
  return null;
}

const unaFormaElegida = (escena: Escena, seleccion: readonly string[]): string | null => {
  if (seleccion.length !== 1) return null;
  const id = seleccion[0]!;
  const el = escena.elementos.find((e) => e.id === id);
  return el?.tipo === "forma" ? id : null;
};

/** Qué elegir con el desplegable «Seleccionar» (Y15). Elegir no cambia la escena ni toca el historial (DY9). */
export type CriterioSeleccion = "formas" | "conectores" | "textos" | "iguales" | "invertir" | "rama";

/** Los ids que quedan elegidos con un criterio, o `[]` si no hay nada que elegir (entonces la selección no cambia). */
export function seleccionPorCriterio(escena: Escena, seleccion: readonly string[], criterio: CriterioSeleccion): string[] {
  switch (criterio) {
    case "formas":
      return seleccionarPorTipo(escena, "forma");
    case "conectores":
      return seleccionarPorTipo(escena, "linea");
    case "textos":
      return seleccionarPorTipo(escena, "texto");
    case "iguales":
      return seleccionarIguales(escena, seleccion);
    case "invertir":
      return invertirSeleccion(escena, seleccion);
    case "rama": {
      const raiz = unaFormaElegida(escena, seleccion);
      return raiz ? seleccionarRama(escena, raiz) : [];
    }
  }
}

/** Lo que el teclado puede pedir además de los comandos de escena. */
export type NombreHerramienta = "seleccionar" | "linea" | "flecha" | "texto";

export type Orden =
  | Comando
  | { tipo: "deshacer" }
  | { tipo: "rehacer" }
  | { tipo: "cerrar" }
  | { tipo: "herramienta"; herramienta: NombreHerramienta }
  | { tipo: "herramienta-forma"; forma: TipoForma }
  | { tipo: "zoom"; factor: number }
  | { tipo: "ajustar-vista" }
  | { tipo: "girar-pagina" }
  | { tipo: "cuadricula" }
  | { tipo: "imantar" }
  /** «Listo»: cierra el editor y devuelve la escena (a diferencia de Escape, que primero suelta lo que haya). */
  | { tipo: "terminar" }
  | { tipo: "aceptar" }
  | { tipo: "buscar-comando" }
  | { tipo: "ver-atajos" }
  /** «Describir el dibujo» (Y35): lo anuncia el editor, que es quien tiene la región viva. */
  | { tipo: "describir-dibujo" }
  /** Portapapeles (Y12a): las hace el editor, que es quien tiene el `clipboardData` y la vista. */
  | { tipo: "copiar" }
  | { tipo: "cortar" }
  | { tipo: "pegar" }
  | { tipo: "pegar-en-sitio" }
  /** Pincel (Y12b): toma el formato de lo elegido y lo aplica a lo que se señale (una vez, o fijo). */
  | { tipo: "copiar-formato" }
  | { tipo: "aplicar-formato" }
  /** Organizar automáticamente (Y13): jerárquico, árbol o radial, con dirección. */
  | { tipo: "organizar"; modo: ModoOrganizar; direccion?: DireccionOrganizar }
  /** Pegar esquema (Y14): abre el diálogo que convierte un texto con sangría en un diagrama. */
  | { tipo: "esquema" }
  /** Selección avanzada (Y15): por tipo, iguales a la elegida, invertir o la rama de la forma elegida. */
  | { tipo: "elegir"; criterio: CriterioSeleccion }
  /** Reglas y guías (Y16a): mostrar u ocultar las reglas, y quitar todas las guías. Viven en el editor, no en la escena. */
  | { tipo: "reglas" }
  | { tipo: "quitar-guias" }
  /** Negrita, cursiva o subrayado de lo elegido (Y18): un interruptor sobre todo lo editable. */
  | { tipo: "formato-texto"; propiedad: "negrita" | "cursiva" | "subrayado" }
  | { tipo: "lista"; modo: "puntos" | "numeros" }
  | { tipo: "ajustar-al-texto" }
  | { tipo: "crecer-al-escribir" }
  /** Cambiar la forma de lo elegido (Y19): conserva todo lo demás y deja los conectores por el mismo lado. */
  | { tipo: "cambiar-forma"; forma: TipoForma }
  /** Un estilo predefinido de forma (Y21) y un tema de paleta para el diagrama (Y21): los dos cambian solo el aspecto. */
  | { tipo: "aplicar-estilo"; estilo: string }
  | { tipo: "aplicar-tema"; paleta: DiagramaPaletaId }
  /** Plegar o desplegar la rama de lo elegido, o desplegarlas todas (Y38b). */
  | { tipo: "plegar-rama" }
  | { tipo: "desplegar-todo" };

/** Elementos de primer nivel que se pueden elegir (ni ocultos ni bloqueados), en orden de apilado. */
export function elegibles(escena: Escena): string[] {
  const hijos = new Set(escena.elementos.flatMap((e) => (e.tipo === "grupo" ? e.hijos : [])));
  const bloqueados = bloqueadosEfectivos(escena);
  const ocultos = new Set<string>();
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const ocultar = (id: string): void => {
    if (ocultos.has(id)) return;
    ocultos.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(ocultar);
  };
  for (const e of escena.elementos) if (e.oculto) ocultar(e.id);
  // Lo que queda oculto por una rama plegada (Y38b) tampoco se elige: Tab y «Seleccionar todo» no pasan por lo que no se ve.
  for (const id of ocultosPorColapso(escena)) ocultar(id);
  return escena.elementos.filter((e) => !hijos.has(e.id) && !bloqueados.has(e.id) && !ocultos.has(e.id)).map((e) => e.id);
}

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** Lo que dice el editor tras plegar o desplegar: la escena nueva, la selección depurada y el anuncio (Y38b). */
export interface ResultadoPlegado {
  escena: Escena;
  seleccion: string[];
  anuncio: string;
}

/**
 * Pliega o despliega la rama de las formas elegidas (DY80). Actúa solo sobre las formas **con hijos**; si alguna está desplegada se
 * pliegan todas las desplegadas (con mezcla, pliega) y si todas están plegadas se despliegan todas. Las formas sobre las que se actuó
 * siguen elegidas; cualquier otra elegida que queda oculta por el plegado sale de la selección. Misma escena si no hay nada que hacer.
 */
export function plegarElegidas(escena: Escena, seleccion: readonly string[]): ResultadoPlegado {
  const ramas = escena.elementos.filter((e) => e.tipo === "forma" && seleccion.includes(e.id) && tieneHijos(escena, e.id));
  if (ramas.length === 0) return { escena, seleccion: [...seleccion], anuncio: "Elige una forma con ramas para plegarla." };
  const ids = ramas.map((e) => e.id);
  const plegar = ramas.some((e) => e.tipo === "forma" && e.colapsado !== true);
  const nueva = fijarColapso(escena, ids, plegar);
  if (nueva === escena) return { escena, seleccion: [...seleccion], anuncio: "" };
  const ocultos = ocultosPorColapso(nueva);
  const quedan = seleccion.filter((id) => ids.includes(id) || !ocultos.has(id));
  if (!plegar) return { escena: nueva, seleccion: quedan, anuncio: ids.length === 1 ? "Rama desplegada." : `${ids.length} ramas desplegadas.` };
  // Cuántas formas dejan de verse con este plegado (sin contar dos veces lo que cuelga de dos ramas elegidas).
  const antes = ocultosPorColapso(escena);
  const esForma = new Set(escena.elementos.filter((e) => e.tipo === "forma").map((e) => e.id));
  const n = [...ocultos].filter((id) => esForma.has(id) && !antes.has(id)).length;
  const detalle = n === 0 ? "no oculta ningún elemento" : `${plural(n, "elemento oculto", "elementos ocultos")}`;
  return { escena: nueva, seleccion: quedan, anuncio: ids.length === 1 ? `Rama plegada: ${detalle}.` : `${ids.length} ramas plegadas: ${detalle}.` };
}

/** Quita el plegado de todas las formas: la salida cuando una rama plegada quedó escondida tras otra (Y38b). */
export function desplegarTodo(escena: Escena, seleccion: readonly string[]): ResultadoPlegado {
  const plegadas = escena.elementos.filter((e) => e.tipo === "forma" && e.colapsado === true).map((e) => e.id);
  if (plegadas.length === 0) return { escena, seleccion: [...seleccion], anuncio: "No hay ramas plegadas." };
  return { escena: fijarColapso(escena, plegadas, false), seleccion: [...seleccion], anuncio: "Todas las ramas desplegadas." };
}

/** Deja en la selección solo los ids que todavía existen. */
export const depurarSeleccion = (escena: Escena, seleccion: readonly string[]): string[] => {
  const existentes = new Set(escena.elementos.map((e) => e.id));
  return seleccion.filter((id) => existentes.has(id));
};

export function ejecutarComando(estado: EstadoEditor, c: Comando): EstadoEditor | null {
  const { escena, seleccion } = estado;
  switch (c.tipo) {
    case "seleccionar-todo": {
      const todos = elegibles(escena);
      return todos.length === 0 ? null : { escena, seleccion: todos };
    }
    case "deseleccionar":
      return seleccion.length === 0 ? null : { escena, seleccion: [] };
    case "siguiente": {
      const lista = elegibles(escena);
      if (lista.length === 0) return null;
      const actual = seleccion.length === 1 ? lista.indexOf(seleccion[0] ?? "") : -1;
      const indice = actual === -1 ? (c.atras ? lista.length - 1 : 0) : (actual + (c.atras ? -1 : 1) + lista.length) % lista.length;
      return { escena, seleccion: [lista[indice] ?? lista[0] ?? ""] };
    }
    case "eliminar": {
      if (seleccion.length === 0) return null;
      const nueva = eliminar(escena, seleccion);
      return nueva === escena ? null : { escena: nueva, seleccion: depurarSeleccion(nueva, seleccion) };
    }
    case "duplicar": {
      if (seleccion.length === 0) return null;
      const r = duplicar(escena, seleccion);
      return r.ids.length === 0 ? null : { escena: r.escena, seleccion: r.ids };
    }
    case "agrupar": {
      const r = agrupar(escena, seleccion);
      return r.id === "" ? null : { escena: r.escena, seleccion: [r.id] };
    }
    case "desagrupar": {
      const r = desagrupar(escena, seleccion);
      return r.ids.length === 0 ? null : { escena: r.escena, seleccion: r.ids };
    }
    case "mover": {
      const nueva = mover(escena, seleccion, c.dx, c.dy);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "transformar": {
      const nueva = c.operacion === "tamano" ? redimensionar(escena, seleccion, "se", c.dx, c.dy) : rotar(escena, seleccion, c.grados);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "orden": {
      const nueva = reordenar(escena, seleccion, c.modo);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "alinear": {
      const nueva = alinear(escena, seleccion, c.modo, seleccion.length === 1 ? { respecto: "escena" } : {});
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "distribuir": {
      const nueva = distribuir(escena, seleccion, c.eje);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "crear-hijo": {
      const padreId = unaFormaElegida(escena, seleccion);
      if (!padreId) return null;
      const r = crearHijo(escena, padreId, LADO_HIJO_TECLADO);
      return r.id === "" ? null : { escena: r.escena, seleccion: [r.id] };
    }
    case "crear-hermano": {
      const hijoId = unaFormaElegida(escena, seleccion);
      if (!hijoId) return null;
      const padreId = padreConectorDe(escena, hijoId);
      if (!padreId) return null;
      const r = crearHijo(escena, padreId, LADO_HIJO_TECLADO);
      return r.id === "" ? null : { escena: r.escena, seleccion: [r.id] };
    }
    case "eliminar-rama": {
      const raiz = unaFormaElegida(escena, seleccion);
      if (!raiz) return null;
      const nueva = eliminarRama(escena, raiz);
      return nueva === escena ? null : { escena: nueva, seleccion: depurarSeleccion(nueva, seleccion) };
    }
    case "bloquear": {
      if (seleccion.length === 0) return null;
      const nueva = bloquearElementos(escena, seleccion);
      return nueva === escena ? null : { escena: nueva, seleccion: [] };
    }
    case "ocultar": {
      if (seleccion.length === 0) return null;
      const nueva = ocultarElementos(escena, seleccion);
      return nueva === escena ? null : { escena: nueva, seleccion: [] };
    }
    case "conectar-cadena": {
      const formas = c.orden === "espacial" ? ordenEspacialParaCadena(escena, seleccion) : c.orden === "auto" ? ordenParaCadena(escena, seleccion) : filtrarFormasParaCadena(escena, seleccion);
      if (formas.length < 2) return null;
      const nueva = conectarEnCadena(escena, formas);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
    case "pegar-al-mas-cercano": {
      const nueva = pegarAlMasCercano(escena, seleccion);
      return nueva === escena ? null : { escena: nueva, seleccion };
    }
  }
}

// ─── Teclado ──────────────────────────────────────────────────────────────────

export interface TeclaEvento {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Paso de las flechas, en unidades de escena. Con Mayús es más grande. */
export const PASO_FLECHA = 1;
export const PASO_FLECHA_MAYUS = 10;

/** Atajos que no son comandos del registro; deben coincidir con `ordenDeTecla` donde aplique (prueba en comandos.spec). */
export const ATAJOS_DE_NAVEGACION: readonly {
  descripcion: string;
  etiquetaTeclas: string;
  tecla?: TeclaEvento;
  tipoOrden?: Orden["tipo"];
  ordenExtra?: Partial<Pick<Extract<Orden, { tipo: "mover" }>, "dx" | "dy">> | Partial<Pick<Extract<Orden, { tipo: "siguiente" }>, "atras">>;
}[] = [
  { descripcion: "Mover selección 1 unidad", etiquetaTeclas: "Flechas", tecla: { key: "ArrowRight", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, tipoOrden: "mover", ordenExtra: { dx: PASO_FLECHA, dy: 0 } },
  { descripcion: "Mover selección 10 unidades", etiquetaTeclas: "Mayús + flechas", tecla: { key: "ArrowDown", ctrlKey: false, metaKey: false, shiftKey: true, altKey: false }, tipoOrden: "mover", ordenExtra: { dy: PASO_FLECHA_MAYUS } },
  { descripcion: "Recorrer elementos", etiquetaTeclas: "Tab / Mayús+Tab", tecla: { key: "Tab", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, tipoOrden: "siguiente", ordenExtra: { atras: false } },
  { descripcion: "Aceptar línea en curso", etiquetaTeclas: "Enter", tecla: { key: "Enter", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, tipoOrden: "aceptar" },
  { descripcion: "Cancelar / cerrar / deseleccionar", etiquetaTeclas: "Escape", tecla: { key: "Escape", ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, tipoOrden: "cerrar" },
  { descripcion: "Desplazar el lienzo", etiquetaTeclas: "Espacio + arrastrar" },
  { descripcion: "Zoom con la rueda", etiquetaTeclas: "Ctrl + rueda" },
];

/**
 * Orden que pide una tecla, o `null` si la tecla no significa nada para el editor. Los comandos
 * (atajos de Ctrl, letras de herramienta, Supr…) salen del registro único; acá solo quedan las teclas de
 * navegación (Enter, Escape, Tab y flechas), que no son un botón de la cinta.
 */
export function ordenDeTecla(e: TeclaEvento): Orden | null {
  const registrado = comandoDeTecla(e);
  if (registrado) return registrado.orden;
  if (e.ctrlKey || e.metaKey) return null;
  const paso = e.shiftKey ? PASO_FLECHA_MAYUS : PASO_FLECHA;
  switch (e.key) {
    case "Enter":
      return { tipo: "aceptar" };
    case "Escape":
      return { tipo: "cerrar" };
    case "Tab":
      return { tipo: "siguiente", atras: e.shiftKey };
    case "ArrowLeft":
      return { tipo: "mover", dx: -paso, dy: 0 };
    case "ArrowRight":
      return { tipo: "mover", dx: paso, dy: 0 };
    case "ArrowUp":
      return { tipo: "mover", dx: 0, dy: -paso };
    case "ArrowDown":
      return { tipo: "mover", dx: 0, dy: paso };
    default:
      return null;
  }
}
