// ─── Comandos y atajos de teclado del editor (W5) ─────────────────────────────
// Un comando recibe el estado (escena + selección) y devuelve el nuevo, o `null` si no hay nada que hacer.

import {
  agrupar,
  alinear,
  desagrupar,
  distribuir,
  duplicar,
  eliminar,
  mover,
  reordenar,
  type Escena,
  type ModoAlineacion,
  type ModoOrden,
  type TipoForma,
} from "@lumina/drawing";
import { bloqueadosEfectivos } from "./asas.js";
import { comandoDeTecla } from "./comandos-registro.js";

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
  | { tipo: "orden"; modo: ModoOrden }
  | { tipo: "alinear"; modo: ModoAlineacion }
  | { tipo: "distribuir"; eje: "horizontal" | "vertical" }
  | { tipo: "siguiente"; atras: boolean };

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
  | { tipo: "cuadricula" }
  | { tipo: "imantar" }
  /** «Listo»: cierra el editor y devuelve la escena (a diferencia de Escape, que primero suelta lo que haya). */
  | { tipo: "terminar" }
  | { tipo: "aceptar" };

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
  return escena.elementos.filter((e) => !hijos.has(e.id) && !bloqueados.has(e.id) && !ocultos.has(e.id)).map((e) => e.id);
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
