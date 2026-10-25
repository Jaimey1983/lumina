"use client";

import { createElement, useId, useMemo, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { escenaANodos, type Escena, type ModoColor, type NodoSvg, type OpcionesRender } from "@lumina/drawing";

/** `stroke-width` → `strokeWidth`; los `data-*` y `aria-*` se dejan como están. */
function nombreProp(nombre: string): string {
  return nombre.startsWith("data-") || nombre.startsWith("aria-") ? nombre : nombre.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Los colores con `var(--token)` van por `style` (los atributos de presentación no siempre los admiten). */
function propsDeNodo(attrs: NodoSvg["attrs"], clave: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key: clave };
  const estilo: Record<string, string> = {};
  for (const [nombre, valor] of Object.entries(attrs)) {
    if (typeof valor === "string" && valor.includes("var(")) estilo[nombreProp(nombre)] = valor;
    else props[nombreProp(nombre)] = valor;
  }
  if (Object.keys(estilo).length > 0) props.style = estilo as CSSProperties;
  return props;
}

function aElemento(nodo: NodoSvg, clave: string): ReactNode {
  const hijos = (nodo.hijos ?? []).map((h, i) => aElemento(h, `${clave}.${i}`));
  const contenido = nodo.texto !== undefined ? [nodo.texto, ...hijos] : hijos;
  return createElement(nodo.tag, propsDeNodo(nodo.attrs, clave), ...contenido);
}

export interface NodosSvgProps {
  escena: Escena;
  modo?: ModoColor;
  /** Qué marcadores de rama se dibujan (Y38b). Sin esto, los de las ramas plegadas (como siempre). */
  indicadoresRama?: OpcionesRender["indicadoresRama"];
}

/**
 * Los elementos de la escena como contenido de un `<svg>` ya existente (sin el `<svg>` en sí):
 * lo usa el editor, que pone su propio zoom y capas encima. Mismo árbol que `DibujoSvg`.
 */
export function NodosSvg({ escena, modo = "css", indicadoresRama }: NodosSvgProps): ReactElement {
  const prefijo = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const { nodos } = useMemo(
    () => escenaANodos(escena, { modo, prefijoIds: `dibujo${prefijo}`, ...(indicadoresRama ? { indicadoresRama } : {}) }),
    [escena, modo, prefijo, indicadoresRama],
  );
  return <>{nodos.map((n, i) => aElemento(n, String(i)))}</>;
}

export interface DibujoSvgProps {
  escena: Escena;
  titulo?: string;
  descripcion?: string;
  /** `css` (por defecto) sigue el tema de la app; `claro`/`oscuro` fijan los colores. */
  modo?: ModoColor;
  className?: string;
}

/**
 * Dibuja una escena como SVG que llena su contenedor (conserva la proporción). Sin `innerHTML`:
 * el árbol que produce `@lumina/drawing` se convierte en elementos de React.
 */
export function DibujoSvg({ escena, titulo, descripcion, modo = "css", className }: DibujoSvgProps): ReactElement {
  // Los ids de degradados y sombras son globales en la página: se prefijan con un id único por instancia.
  const prefijo = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const { ancho, alto, nodos } = useMemo(() => escenaANodos(escena, { modo, prefijoIds: `dibujo${prefijo}` }), [escena, modo, prefijo]);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${ancho} ${alto}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={titulo?.trim() || "Dibujo"}
    >
      <title>{titulo?.trim() || "Dibujo"}</title>
      {descripcion?.trim() ? <desc>{descripcion.trim()}</desc> : null}
      {nodos.map((n, i) => aElemento(n, String(i)))}
    </svg>
  );
}
