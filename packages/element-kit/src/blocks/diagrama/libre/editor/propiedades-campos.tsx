"use client";

import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { esColorValido } from "@lumina/drawing";
import { Slider, SliderThumb } from "@lumina/ui/slider";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import type { Valor } from "./propiedades.js";

const claseCampo = "h-8 w-full rounded-md border bg-background px-2 text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

/** Fila de una propiedad: etiqueta a la izquierda, control a la derecha. */
export function Fila({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: ReactNode }): ReactElement {
  return (
    <div className="flex items-center justify-between gap-2" data-fila={etiqueta}>
      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        {etiqueta}
        {ayuda}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-1">{children}</div>
    </div>
  );
}

// ─── Número ───────────────────────────────────────────────────────────────────

/** Campo numérico que confirma al pulsar Enter o salir del campo (una sola entrada de historial). Un valor mixto se ve como «Mixto» y no se toca. */
export function CampoNumero({
  etiqueta,
  valor,
  min,
  max,
  paso = 1,
  deshabilitado,
  unidad,
  ancho = "w-full",
  onConfirmar,
}: {
  etiqueta: string;
  valor: Valor<number> | null;
  /** Clase de ancho del campo (por defecto ocupa todo el espacio). */
  ancho?: string;
  min?: number;
  max?: number;
  paso?: number;
  deshabilitado?: boolean;
  unidad?: string;
  onConfirmar: (n: number) => void;
}): ReactElement {
  const mostrado = valor && !valor.mixto ? String(valor.valor) : "";
  const [borrador, setBorrador] = useState(mostrado);
  useEffect(() => setBorrador(mostrado), [mostrado]);

  const confirmar = (): void => {
    if (borrador.trim() === "" || borrador === mostrado) {
      setBorrador(mostrado);
      return;
    }
    const n = Number(borrador.replace(",", "."));
    if (!Number.isFinite(n)) {
      setBorrador(mostrado);
      return;
    }
    const acotado = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    setBorrador(String(acotado));
    onConfirmar(acotado);
  };

  return (
    <span className={`flex ${ancho} items-center gap-1`}>
      <input
        type="number"
        inputMode="decimal"
        aria-label={etiqueta}
        className={`${claseCampo} min-w-0 flex-1`}
        value={borrador}
        placeholder={valor?.mixto ? "Mixto" : ""}
        min={min}
        max={max}
        step={paso}
        disabled={deshabilitado || valor === null}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmar();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            setBorrador(mostrado);
          }
        }}
      />
      {unidad ? <span className="text-[11px] text-muted-foreground">{unidad}</span> : null}
    </span>
  );
}

// ─── Deslizador ───────────────────────────────────────────────────────────────

/**
 * Deslizador con vista previa mientras se arrastra: `onVista` se llama en cada paso y `onFin` una sola vez
 * al soltar el ratón o la tecla, que es cuando el cambio entra al historial.
 */
export function Deslizador({
  etiqueta,
  valor,
  min,
  max,
  paso,
  formato = (n) => String(n),
  deshabilitado,
  onVista,
  onFin,
}: {
  etiqueta: string;
  valor: Valor<number> | null;
  min: number;
  max: number;
  paso: number;
  formato?: (n: number) => string;
  deshabilitado?: boolean;
  onVista: (n: number) => void;
  onFin: () => void;
}): ReactElement {
  const actual = valor && !valor.mixto ? valor.valor : min;
  // Con el teclado Radix avisa del «fin» en cada pulsación (y antes del cambio): se ignora y se confirma al soltar la tecla.
  const conTeclado = useRef(false);
  return (
    <span className="flex w-40 items-center gap-2">
      <Slider
        aria-label={etiqueta}
        value={[Math.min(max, Math.max(min, actual))]}
        min={min}
        max={max}
        step={paso}
        disabled={deshabilitado || valor === null}
        onValueChange={([v]) => onVista(v as number)}
        onValueCommit={() => {
          if (!conTeclado.current) onFin();
        }}
        onKeyDownCapture={() => {
          conTeclado.current = true;
        }}
        onKeyUp={() => {
          conTeclado.current = false;
          onFin();
        }}
      >
        <SliderThumb aria-label={etiqueta} />
      </Slider>
      <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground" data-lectura={etiqueta}>
        {valor?.mixto ? "Mixto" : valor ? formato(actual) : ""}
      </span>
    </span>
  );
}

// ─── Opciones ─────────────────────────────────────────────────────────────────

export interface Opcion<T> {
  valor: T;
  etiqueta: string;
  icono?: ReactNode;
}

/** Botones excluyentes (p. ej. patrón del trazo). Con un valor mixto ninguno aparece marcado. */
export function Opciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  deshabilitado,
  onElegir,
}: {
  etiqueta: string;
  opciones: ReadonlyArray<Opcion<T>>;
  valor: Valor<T> | null;
  deshabilitado?: boolean;
  onElegir: (v: T) => void;
}): ReactElement {
  return (
    <div role="group" aria-label={etiqueta} className="flex overflow-hidden rounded-md border">
      {opciones.map((o) => {
        const marcado = valor !== null && !valor.mixto && valor.valor === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            title={o.etiqueta}
            aria-label={o.etiqueta}
            aria-pressed={marcado}
            disabled={deshabilitado || valor === null}
            className={`flex h-7 min-w-7 items-center justify-center px-1.5 text-xs outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${marcado ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            onClick={() => onElegir(o.valor)}
          >
            {o.icono ?? o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/** Botón de dos estados (negrita, cursiva…). Con un valor mixto queda `aria-pressed="mixed"`. */
export function Conmutador({
  etiqueta,
  valor,
  icono,
  deshabilitado,
  onCambiar,
}: {
  etiqueta: string;
  valor: Valor<boolean> | null;
  icono: ReactNode;
  deshabilitado?: boolean;
  onCambiar: (v: boolean) => void;
}): ReactElement {
  const marcado = valor !== null && !valor.mixto && valor.valor;
  return (
    <button
      type="button"
      title={etiqueta}
      aria-label={etiqueta}
      aria-pressed={valor?.mixto ? "mixed" : marcado}
      disabled={deshabilitado || valor === null}
      className={`flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${marcado ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      onClick={() => onCambiar(!marcado)}
    >
      {icono}
    </button>
  );
}

// ─── Color ────────────────────────────────────────────────────────────────────

/** Los diez acentos de las paletas de diagrama. */
export const COLORES_DE_PALETA: readonly string[] = Object.values(PALETAS_DIAGRAMA).map((p) => p.acentoPrincipal.toUpperCase());
export const COLORES_NEUTROS: readonly string[] = ["#FFFFFF", "#F1F5F9", "#CBD5E1", "#64748B", "#334155", "#0F172A"];
/** Colores del tema de la app: siguen al modo claro y oscuro. */
export const COLORES_DEL_TEMA: ReadonlyArray<{ token: string; nombre: string }> = [
  { token: "var(--foreground)", nombre: "Texto" },
  { token: "var(--background)", nombre: "Fondo" },
  { token: "var(--primary)", nombre: "Principal" },
  { token: "var(--secondary)", nombre: "Secundario" },
  { token: "var(--muted)", nombre: "Suave" },
  { token: "var(--accent)", nombre: "Acento" },
  { token: "var(--destructive)", nombre: "Alerta" },
  { token: "var(--border)", nombre: "Borde" },
];

const esHex6 = (c: string): boolean => /^#[0-9a-fA-F]{6}$/.test(c);

/**
 * Cuadro de color. Se dibuja con SVG (el color va en el atributo `fill`, que acepta `var(--token)`): así
 * no pasa por el `style` en línea, que el analizador de CSS de jsdom procesa con una lentitud enorme.
 */
function Muestra({ color, mixto, className = "size-4" }: { color?: string; mixto?: boolean; className?: string }): ReactElement {
  const vacio = mixto || !color;
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`${className} shrink-0 overflow-hidden rounded border`}>
      <rect width="16" height="16" fill={vacio ? "#ffffff" : color} />
      {vacio ? <path d="M-4 12L12 -4M0 20L20 0M8 20L20 8" stroke="#cbd5e1" strokeWidth="3" /> : null}
    </svg>
  );
}

/**
 * Fila de color: un botón con el color actual que despliega, debajo y a todo el ancho, los diez acentos de
 * las paletas de diagrama, neutros, colores del tema y un selector libre (más un campo para escribir
 * `#RRGGBB` o `var(--token)`). Se despliega en el sitio —sin ventana flotante, que la sección plegable
 * recortaría—. El selector libre da vista previa mientras se arrastra y confirma al salir.
 */
export function FilaColor({
  etiqueta,
  etiquetaColor,
  valor,
  deshabilitado,
  ayuda,
  onElegir,
  onVista,
  onFin,
}: {
  /** Texto de la fila («Color», «Desde»…). */
  etiqueta: string;
  /** Nombre completo del color para lectores de pantalla («Color de relleno»). */
  etiquetaColor: string;
  valor: Valor<string> | null;
  deshabilitado?: boolean;
  ayuda?: ReactNode;
  onElegir: (color: string) => void;
  onVista: (color: string) => void;
  onFin: () => void;
}): ReactElement {
  const id = useId();
  const actual = valor && !valor.mixto ? valor.valor : "";
  const [texto, setTexto] = useState(actual);
  useEffect(() => setTexto(actual), [actual]);
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement | null>(null);

  const confirmarTexto = (): void => {
    const limpio = texto.trim();
    if (limpio === "" || limpio === actual || !esColorValido(limpio)) {
      setTexto(actual);
      return;
    }
    onElegir(limpio);
  };

  const cerrar = (): void => {
    setAbierto(false);
    onFin();
  };

  // Un clic fuera cierra el selector (y confirma la vista previa que haya quedado a medias).
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e: PointerEvent): void => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) {
        setAbierto(false);
        onFin();
      }
    };
    document.addEventListener("pointerdown", fuera, true);
    return () => document.removeEventListener("pointerdown", fuera, true);
  }, [abierto, onFin]);

  return (
    <div
      ref={raiz}
      className="space-y-2"
      onKeyDown={(e) => {
        if (e.key === "Escape" && abierto) {
          e.stopPropagation();
          cerrar();
        }
      }}
    >
      <Fila etiqueta={etiqueta} ayuda={ayuda}>
        <button
          type="button"
          aria-label={`${etiquetaColor}: ${valor?.mixto ? "mixto" : actual || "sin color"}`}
          aria-expanded={abierto}
          disabled={deshabilitado || valor === null}
          className="flex h-8 items-center gap-2 rounded-md border bg-background px-2 text-xs outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          onClick={() => (abierto ? cerrar() : setAbierto(true))}
        >
          <Muestra color={actual} mixto={valor?.mixto === true} />
          <span className="max-w-24 truncate tabular-nums">{valor?.mixto ? "Mixto" : actual || "—"}</span>
        </button>
      </Fila>
      {abierto ? (
        <div role="group" aria-label={`Elegir ${etiquetaColor.toLowerCase()}`} className="space-y-3 rounded-md border bg-muted/40 p-3">
          <AlCerrar onCerrar={onFin} />
          <Grupo titulo="Paletas de diagrama">
            {COLORES_DE_PALETA.map((c) => (
              <Pastilla key={c} color={c} nombre={c} actual={actual} onElegir={onElegir} />
            ))}
          </Grupo>
          <Grupo titulo="Neutros">
            {COLORES_NEUTROS.map((c) => (
              <Pastilla key={c} color={c} nombre={c} actual={actual} onElegir={onElegir} />
            ))}
          </Grupo>
          <Grupo titulo="Colores del tema">
            {COLORES_DEL_TEMA.map((c) => (
              <Pastilla key={c.token} color={c.token} nombre={`${c.nombre} (tema)`} actual={actual} onElegir={onElegir} />
            ))}
          </Grupo>
          <div className="flex items-center gap-2">
            <label htmlFor={`${id}-libre`} className="text-xs text-muted-foreground">
              Libre
            </label>
            <input
              id={`${id}-libre`}
              type="color"
              aria-label={`${etiquetaColor}: color libre`}
              className="h-8 w-10 cursor-pointer rounded border bg-background p-0.5"
              value={esHex6(actual) ? actual : "#000000"}
              onChange={(e) => onVista(e.target.value.toUpperCase())}
              onBlur={onFin}
            />
            <input
              type="text"
              aria-label={`${etiquetaColor}: escribir color`}
              className={`${claseCampo} flex-1`}
              value={texto}
              placeholder="#RRGGBB o var(--…)"
              onChange={(e) => setTexto(e.target.value)}
              onBlur={confirmarTexto}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmarTexto();
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Al cerrarse el selector (se desmonta) confirma la vista previa que haya quedado a medias. */
function AlCerrar({ onCerrar }: { onCerrar: () => void }): null {
  const ref = useRef(onCerrar);
  ref.current = onCerrar;
  useEffect(() => () => ref.current(), []);
  return null;
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }): ReactElement {
  return (
    <div role="group" aria-label={titulo}>
      <p className="mb-1 text-[11px] text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pastilla({ color, nombre, actual, onElegir }: { color: string; nombre: string; actual: string; onElegir: (c: string) => void }): ReactElement {
  const elegido = actual.toUpperCase() === color.toUpperCase();
  return (
    <button
      type="button"
      title={nombre}
      aria-label={nombre}
      aria-pressed={elegido}
      className={`size-6 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${elegido ? "ring-2 ring-primary ring-offset-1" : ""}`}
      onClick={() => onElegir(color)}
    >
      <Muestra color={color} className="size-6" />
    </button>
  );
}
