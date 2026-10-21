"use client";

// ─── Zona lateral redimensionable y plegable (Y3) ─────────────────────────────
// Envuelve el panel de propiedades: el borde izquierdo es un separador que se arrastra (o se maneja con
// el teclado) para cambiar el ancho, doble clic lo restaura, y la zona se pliega a un riel. El ancho y el
// plegado se recuerdan en `localStorage` con la convención de la etapa S (`lumina.panel.<clave>`, siempre
// con try/catch: sin storage funciona igual, solo no recuerda). Por debajo de un ancho de ventana se pliega sola.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as TeclaReact, type PointerEvent as PunteroReact, type ReactElement, type ReactNode } from "react";
import { PanelRightOpen } from "lucide-react";

const PREFIJO = "lumina.panel.";

export const ANCHO_DEFECTO = 320;
export const ANCHO_MIN = 240;
export const ANCHO_MAX = 560;
/** Por debajo de este ancho de ventana (px) la zona se pliega sola. */
export const PLEGAR_BAJO = 900;
/** Cuánto avanza una flecha; con Mayús, el grande. */
export const PASO_TECLA = 16;
export const PASO_TECLA_MAYUS = 64;

/** Deja `ancho` entre `min` y `max` (redondeado a píxeles enteros). */
export const acotarAncho = (ancho: number, min = ANCHO_MIN, max = ANCHO_MAX): number => Math.round(Math.min(max, Math.max(min, Number.isFinite(ancho) ? ancho : ANCHO_DEFECTO)));

/** El tope del ancho: nunca más de la mitad de la ventana, para que el lienzo no quede sin sitio. */
export const anchoMaximo = (ventana: number, max = ANCHO_MAX, min = ANCHO_MIN): number => Math.max(min, Math.min(max, Math.floor(ventana / 2)));

function leer(clave: string): string | null {
  try {
    return globalThis.localStorage.getItem(PREFIJO + clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    globalThis.localStorage.setItem(PREFIJO + clave, valor);
  } catch {
    /* sin storage: la zona funciona igual, solo no recuerda su estado */
  }
}

export interface ZonaRedimensionableProps {
  /** Nombre accesible de la zona («Propiedades»). */
  etiqueta: string;
  /** Prefijo de las claves de `localStorage` (`<clave>-ancho`, `<clave>-plegado`). */
  clave: string;
  /** El contenido recibe la acción de plegar para ponerla donde quiera (el encabezado del panel). */
  children: (plegar: () => void) => ReactNode;
}

export function ZonaRedimensionable({ etiqueta, clave, children }: ZonaRedimensionableProps): ReactElement {
  const [ancho, setAncho] = useState(ANCHO_DEFECTO);
  const [plegadoPref, setPlegadoPref] = useState(false);
  const [ventana, setVentana] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const [abiertoEnEstrecho, setAbiertoEnEstrecho] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const arrastre = useRef<{ x: number; ancho: number; inicial: number } | null>(null);

  // La preferencia guardada se aplica tras montar (convención de la etapa S: no divergir del HTML del servidor).
  useEffect(() => {
    const guardado = Number(leer(`${clave}-ancho`));
    if (leer(`${clave}-ancho`) !== null && Number.isFinite(guardado)) setAncho(acotarAncho(guardado));
    setPlegadoPref(leer(`${clave}-plegado`) === "1");
  }, [clave]);

  useEffect(() => {
    const alRedimensionar = (): void => setVentana(window.innerWidth);
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, []);

  const estrecha = ventana < PLEGAR_BAJO;
  // En una ventana estrecha manda el plegado automático; el usuario puede abrirla y así se queda mientras siga estrecha.
  useEffect(() => {
    if (!estrecha) setAbiertoEnEstrecho(false);
  }, [estrecha]);
  const plegado = estrecha ? !abiertoEnEstrecho : plegadoPref;

  const tope = anchoMaximo(ventana);
  const anchoVisible = acotarAncho(ancho, ANCHO_MIN, tope);

  const fijarAncho = useCallback(
    (n: number, guardar: boolean): void => {
      const v = acotarAncho(n, ANCHO_MIN, anchoMaximo(window.innerWidth));
      setAncho(v);
      if (guardar) escribir(`${clave}-ancho`, String(v));
    },
    [clave],
  );

  const alternar = useCallback((): void => {
    if (estrecha) {
      setAbiertoEnEstrecho((a) => !a);
      return;
    }
    const nuevo = !plegadoPref;
    setPlegadoPref(nuevo);
    escribir(`${clave}-plegado`, nuevo ? "1" : "0");
  }, [clave, estrecha, plegadoPref]);

  // ─── Arrastre ───────────────────────────────────────────────────────────────
  const alApretar = (e: PunteroReact<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrastre.current = { x: e.clientX, ancho: anchoVisible, inicial: anchoVisible };
    setArrastrando(true);
  };
  const alMover = (e: PunteroReact<HTMLDivElement>): void => {
    const a = arrastre.current;
    // La zona está a la derecha: arrastrar hacia la izquierda la agranda.
    if (a) fijarAncho(a.ancho + (a.x - e.clientX), false);
  };
  const alSoltar = (e: PunteroReact<HTMLDivElement>): void => {
    const a = arrastre.current;
    if (!a) return;
    arrastre.current = null;
    setArrastrando(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    fijarAncho(a.ancho + (a.x - e.clientX), true);
  };
  const alCancelar = (): void => {
    const a = arrastre.current;
    if (!a) return;
    arrastre.current = null;
    setArrastrando(false);
    fijarAncho(a.inicial, false);
  };

  // ─── Teclado: separador de ventana (ARIA) ───────────────────────────────────
  const alTeclear = (e: TeclaReact<HTMLDivElement>): void => {
    const paso = e.shiftKey ? PASO_TECLA_MAYUS : PASO_TECLA;
    let nuevo: number | null = null;
    // La zona está a la derecha: la flecha izquierda mueve el separador a la izquierda, o sea, agranda.
    if (e.key === "ArrowLeft") nuevo = anchoVisible + paso;
    else if (e.key === "ArrowRight") nuevo = anchoVisible - paso;
    else if (e.key === "Home") nuevo = ANCHO_MIN;
    else if (e.key === "End") nuevo = tope;
    else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      alternar();
      return;
    } else if (e.key === "Escape" && arrastre.current) {
      e.preventDefault();
      e.stopPropagation();
      alCancelar();
      return;
    }
    if (nuevo === null) return;
    // Estas teclas son del separador: no deben llegar al lienzo (las flechas moverían la selección).
    e.preventDefault();
    e.stopPropagation();
    fijarAncho(nuevo, true);
  };

  if (plegado) {
    return (
      <div data-zona="plegada" className="flex w-10 shrink-0 flex-col items-center border-l bg-card py-2">
        <button
          type="button"
          aria-label={`Mostrar ${etiqueta.toLowerCase()}`}
          aria-expanded={false}
          title={`Mostrar ${etiqueta.toLowerCase()}`}
          data-zona-alternar=""
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-hidden hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
          onClick={alternar}
        >
          <PanelRightOpen aria-hidden="true" />
        </button>
        <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl]">{etiqueta}</span>
      </div>
    );
  }

  return (
    <div data-zona="abierta" className="relative flex shrink-0" style={{ width: anchoVisible }}>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Ancho de ${etiqueta.toLowerCase()}`}
        aria-valuenow={anchoVisible}
        aria-valuemin={ANCHO_MIN}
        aria-valuemax={tope}
        tabIndex={0}
        data-zona-separador=""
        data-arrastrando={arrastrando || undefined}
        title="Arrastra para cambiar el ancho · doble clic restaura"
        className="absolute inset-y-0 left-0 z-10 w-1.5 -translate-x-1/2 cursor-col-resize touch-none outline-hidden transition-colors hover:bg-primary/40 focus-visible:bg-primary/60 data-[arrastrando]:bg-primary/60"
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
        onDoubleClick={() => fijarAncho(ANCHO_DEFECTO, true)}
        onKeyDown={alTeclear}
      />
      <div className="flex min-w-0 flex-1">{children(alternar)}</div>
    </div>
  );
}
