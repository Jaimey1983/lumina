"use client";

// ─── Mini barra flotante y campos de «Formato de forma» (Y18) ─────────────────
// La barra que flota junto a la selección y la pestaña contextual «Formato de forma» usan los MISMOS campos
// (`ColorRelleno`, `ColorContorno`, `GrosorContorno`, `TamanoLetra`, `AlineacionHorizontal`) y llaman a las mismas
// funciones de `propiedades.ts` que el panel (DY11). Negrita, Cursiva y Subrayado son comandos del registro.

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement, type RefObject } from "react";
import type { Escena } from "@lumina/drawing";
import type { Marco } from "./asas.js";
import { comando, estadoComando, type ContextoComando } from "./comandos-registro.js";
import type { Orden } from "./comandos.js";
import { controlesDeMiniBarra, posicionDeMiniBarra, TAMANO_MINI_BARRA, type Circulo, type ControlesMiniBarra, type Tamano } from "./mini-barra.js";
import { ALINEACION_H, BotonColor, CampoNumero, Conmutador, Opciones } from "./propiedades-campos.js";
import { fijarContorno, fijarRelleno, fijarTexto, hojasDeFormato, type Hoja } from "./propiedades.js";
import type { Vista } from "./vista.js";

/** Cómo un campo cambia la escena: igual que el panel (aplicar de golpe, o vista previa y confirmar al soltar). */
export interface AccionesDeFormato {
  onAplicar: (cambio: (e: Escena) => Escena) => void;
  onVista: (cambio: (e: Escena) => Escena) => void;
  onFinVista: () => void;
  /** Descarta la vista previa a medias (Escape en el selector de color). */
  onCancelarVista: () => void;
}

/** Lo que leen los campos: los valores de la selección y sobre qué se aplica. `null` si no hay nada que formatear. */
export interface DatosDeFormato {
  controles: ControlesMiniBarra;
  destino: Hoja[];
}

export function datosDeFormato(escena: Escena, seleccion: readonly string[]): DatosDeFormato | null {
  const controles = controlesDeMiniBarra(escena, seleccion);
  return controles ? { controles, destino: hojasDeFormato(escena, seleccion) } : null;
}

/** `sufijo` («(barra)», «(cinta)») distingue estos campos de sus gemelos del panel para lectores de pantalla. */
type CampoProps = { datos: DatosDeFormato; sufijo: string } & AccionesDeFormato;

export function ColorRelleno({ datos, sufijo, onAplicar, onVista, onFinVista, onCancelarVista }: CampoProps): ReactElement {
  const { destino } = datos;
  return (
    <BotonColor
      sufijo={sufijo}
      etiquetaColor="Color de relleno"
      valor={datos.controles.relleno}
      onElegir={(color) => onAplicar((e) => fijarRelleno(e, destino, { tipo: "solido", color }))}
      onVista={(color) => onVista((e) => fijarRelleno(e, destino, { tipo: "solido", color }))}
      onFin={onFinVista}
      onCancelar={onCancelarVista}
    />
  );
}

export function ColorContorno({ datos, sufijo, onAplicar, onVista, onFinVista, onCancelarVista }: CampoProps): ReactElement {
  const { destino } = datos;
  return (
    <BotonColor
      sufijo={sufijo}
      etiquetaColor="Color del contorno"
      valor={datos.controles.contorno}
      onElegir={(color) => onAplicar((e) => fijarContorno(e, destino, { color }))}
      onVista={(color) => onVista((e) => fijarContorno(e, destino, { color }))}
      onFin={onFinVista}
      onCancelar={onCancelarVista}
    />
  );
}

export function GrosorContorno({ datos, sufijo, onAplicar }: CampoProps): ReactElement {
  return (
    <CampoNumero sufijo={sufijo} etiqueta="Grosor del contorno" valor={datos.controles.grosor} min={0} max={20} paso={0.5} ancho="w-14" onConfirmar={(n) => onAplicar((e) => fijarContorno(e, datos.destino, { grosor: n }))} />
  );
}

export function TamanoLetra({ datos, sufijo, onAplicar }: CampoProps): ReactElement {
  return <CampoNumero sufijo={sufijo} etiqueta="Tamaño del texto" valor={datos.controles.tamano} min={6} max={400} ancho="w-16" onConfirmar={(n) => onAplicar((e) => fijarTexto(e, datos.destino, { tamano: n }))} />;
}

export function AlineacionHorizontal({ datos, sufijo, onAplicar }: CampoProps): ReactElement {
  return <Opciones sufijo={sufijo} etiqueta="Alineación del texto" opciones={ALINEACION_H} valor={datos.controles.alineacion} onElegir={(v) => onAplicar((e) => fijarTexto(e, datos.destino, { alineacionH: v }))} />;
}

/** Negrita, cursiva o subrayado: el botón es el del comando del registro (etiqueta, icono y orden salen de allí). */
export function BotonFormatoTexto({ id, datos, sufijo, contexto, onOrden }: { id: "negrita" | "cursiva" | "subrayado"; datos: DatosDeFormato; sufijo: string; contexto: ContextoComando; onOrden: (o: Orden) => void }): ReactElement {
  const def = comando(id);
  const Icono = def.icono;
  return <Conmutador sufijo={sufijo} etiqueta={def.etiqueta} valor={datos.controles[id]} icono={Icono ? <Icono className="size-3.5" /> : def.etiqueta} deshabilitado={!estadoComando(def, contexto).habilitado} onCambiar={() => onOrden(def.orden)} />;
}

// ─── La barra ─────────────────────────────────────────────────────────────────

const SELECTOR_CONTROLES = "button:not(:disabled), input:not(:disabled)";

const controlesDe = (raiz: HTMLElement): HTMLElement[] => Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR_CONTROLES)).filter((el) => !el.closest("[data-slot='popover-content']"));

/** Lleva el foco a la barra (`F6` desde el lienzo): al control por el que se entró la última vez, o al primero. */
export function enfocarMiniBarra(raiz: HTMLElement | null): boolean {
  if (!raiz) return false;
  const lista = controlesDe(raiz);
  const destino = lista.find((el) => el.tabIndex === 0) ?? lista[0];
  destino?.focus();
  return destino !== undefined;
}

export interface MiniBarraProps extends AccionesDeFormato {
  datos: DatosDeFormato;
  marco: Marco;
  vista: Vista;
  ventana: Tamano;
  /** Los «+» de hijo rápido a la vista: la barra no los pisa. */
  obstaculos: readonly Circulo[];
  contexto: ContextoComando;
  onOrden: (orden: Orden) => void;
  /** `Escape` o `F6` dentro de la barra: el foco vuelve al lienzo. */
  onSalir: () => void;
  raizRef: RefObject<HTMLDivElement | null>;
}

const Separador = (): ReactElement => <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border" />;

/**
 * Barra flotante con los formatos más usados, colocada por `posicionDeMiniBarra`. Nunca roba el foco (DY16): se llega con
 * `F6` o con el ratón. Un solo `Tab` entra y otro sale (las flechas recorren los controles).
 */
export function MiniBarra({ datos, marco, vista, ventana, obstaculos, contexto, onOrden, onSalir, raizRef, ...acciones }: MiniBarraProps): ReactElement {
  const [medida, setMedida] = useState<Tamano>(TAMANO_MINI_BARRA);
  const activo = useRef<HTMLElement | null>(null);

  // Medida real de la barra, al montarla y cada vez que cambia de tamaño (en jsdom es 0 y se queda la estimada).
  useLayoutEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return undefined;
    const medir = (): void => {
      const { offsetWidth: ancho, offsetHeight: alto } = raiz;
      if (ancho > 0 && alto > 0) setMedida((m) => (m.ancho === ancho && m.alto === alto ? m : { ancho, alto }));
    };
    medir();
    const observador = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    observador?.observe(raiz);
    return () => observador?.disconnect();
  }, [raizRef]);

  // Un solo control con `tabindex=0` (roving): se rehace en cada render, que es cuando pueden cambiar los controles.
  useLayoutEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return;
    const lista = controlesDe(raiz);
    const elegido = activo.current && lista.includes(activo.current) ? activo.current : lista[0];
    for (const el of lista) el.tabIndex = el === elegido ? 0 : -1;
  });

  const pos = posicionDeMiniBarra(marco, vista, ventana, medida, obstaculos);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>): void => {
    // Nada de lo que se teclea aquí llega al editor (flechas moverían la selección y Escape la quitaría).
    e.stopPropagation();
    const raiz = e.currentTarget;
    const objetivo = e.target as HTMLElement;
    if (!raiz.contains(objetivo)) return; // viene del selector de color: lo atiende él
    if (e.key === "Escape" || e.key === "F6") {
      e.preventDefault();
      onSalir();
      return;
    }
    if (objetivo.tagName === "INPUT") return; // en un campo, las flechas mueven el cursor
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    const lista = controlesDe(raiz);
    const i = lista.indexOf(objetivo);
    if (i === -1) return;
    e.preventDefault();
    const siguiente = e.key === "Home" ? 0 : e.key === "End" ? lista.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + lista.length) % lista.length;
    lista[siguiente]?.focus();
  };

  return (
    <div
      ref={raizRef}
      role="toolbar"
      aria-label="Formato rápido"
      aria-orientation="horizontal"
      data-mini-barra=""
      data-lado={pos.lado}
      className="absolute z-20 flex w-max items-center gap-1 rounded-lg border bg-card p-1 text-card-foreground shadow-md"
      style={{ left: pos.x, top: pos.y }}
      onKeyDown={alTeclear}
      onKeyUp={(e) => e.stopPropagation()}
      onFocus={(e) => {
        if (controlesDe(e.currentTarget).includes(e.target as HTMLElement)) activo.current = e.target as HTMLElement;
      }}
    >
      <ColorRelleno datos={datos} sufijo="(barra)" {...acciones} />
      <ColorContorno datos={datos} sufijo="(barra)" {...acciones} />
      <GrosorContorno datos={datos} sufijo="(barra)" {...acciones} />
      <Separador />
      <TamanoLetra datos={datos} sufijo="(barra)" {...acciones} />
      <BotonFormatoTexto id="negrita" datos={datos} sufijo="(barra)" contexto={contexto} onOrden={onOrden} />
      <BotonFormatoTexto id="cursiva" datos={datos} sufijo="(barra)" contexto={contexto} onOrden={onOrden} />
      <BotonFormatoTexto id="subrayado" datos={datos} sufijo="(barra)" contexto={contexto} onOrden={onOrden} />
      <Separador />
      <AlineacionHorizontal datos={datos} sufijo="(barra)" {...acciones} />
    </div>
  );
}
