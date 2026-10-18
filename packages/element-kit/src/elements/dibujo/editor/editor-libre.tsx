"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as TeclaReact,
  type PointerEvent as PunteroReact,
  type ReactElement,
} from "react";
import {
  FORMAS,
  Historial,
  cajaDeElemento,
  elementoEn,
  esquinas,
  normalizarEscena,
  type Elemento,
  type Escena,
  type Guia,
  type ModoAlineacion,
  type ModoOrden,
  type Punto,
} from "@lumina/drawing";
import { Button } from "@lumina/ui/button";
import { Separator } from "@lumina/ui/separator";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  BringToFront,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Grid3x3,
  Group,
  Magnet,
  Maximize,
  Redo2,
  SendToBack,
  Trash2,
  Undo2,
  Ungroup,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { NodosSvg } from "../../../widgets/dibujo/dibujo-render.js";
import { asaEn, cursorDeAsa, marcoDeSeleccion, posicionesDeAsas, type Marco, type TipoAsa } from "./asas.js";
import { depurarSeleccion, ejecutarComando, ordenDeTecla, type Comando, type EstadoEditor } from "./comandos.js";
import {
  avanzarGesto,
  iniciarMover,
  iniciarRecuadro,
  iniciarRedimensionar,
  iniciarRotar,
  seleccionAlHacerClic,
  type Gesto,
} from "./gestos.js";
import { ZOOM_MAX, ZOOM_MIN, ajustarAVentana, desplazar, escenaAPantalla, pantallaAEscena, zoomEn, type Vista } from "./vista.js";

const COLOR_SELECCION = "#2563eb";
const COLOR_GUIA = "#db2777";
const LADO_CUADRICULA = 20;
const UMBRAL_ARRASTRE_PX = 4;
const TAMANO_ASA_PX = 9;

export interface EditorLibreProps {
  escena: Escena;
  titulo?: string;
  /** Se llama una vez por gesto (o comando) que cambia la escena: DW7, nunca por fotograma. */
  onCambio: (escena: Escena) => void;
  /** Cierra el editor. Recibe la escena final, ya confirmada. */
  onCerrar: (escena: Escena) => void;
  /** Enfoca el lienzo al abrir (por defecto sí). El modal lo apaga para recordar antes qué tenía el foco. */
  enfocarAlAbrir?: boolean;
}

type Accion = {
  modo: "pan" | "gesto";
  gesto: Gesto | null;
  activo: boolean;
  origen: Punto;
  ultimo: Punto;
  /** Elemento que estaba bajo el cursor al apretar (para elegirlo al soltar sin haber arrastrado). */
  hit?: string;
  shift: boolean;
};

/** Captura el puntero para seguir el arrastre fuera del lienzo; algunos entornos (y los eventos sintéticos) no lo admiten. */
function capturar(e: PunteroReact<SVGSVGElement>): void {
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {
    // Sin captura el arrastre sigue funcionando mientras el puntero esté sobre el lienzo.
  }
}

function liberar(e: PunteroReact<SVGSVGElement>): void {
  try {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  } catch {
    // Ya estaba liberado.
  }
}

/** Nombre corto de un elemento para el lector de pantalla. */
export function describirElemento(e: Elemento): string {
  if (e.nombre) return e.nombre;
  if (e.tipo === "forma") return `${FORMAS[e.forma].nombre}${e.texto ? ` «${e.texto}»` : ""}`;
  if (e.tipo === "linea") return `${e.fin !== "ninguno" || e.inicio !== "ninguno" ? "Flecha" : "Línea"}${e.texto ? ` «${e.texto}»` : ""}`;
  if (e.tipo === "texto") return `Texto «${e.texto}»`;
  return "Grupo";
}

export function describirSeleccion(escena: Escena, seleccion: readonly string[]): string {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  if (elegidos.length === 0) return "Nada seleccionado.";
  const primero = elegidos[0];
  if (elegidos.length === 1 && primero) return `${describirElemento(primero)}, seleccionado.`;
  return `${elegidos.length} elementos seleccionados.`;
}

const porVista = (vista: Vista, puntos: readonly Punto[]): string => puntos.map((p) => escenaAPantalla(vista, p)).map((p) => `${p.x},${p.y}`).join(" ");

function contornoDeElemento(escena: Escena, e: Elemento, vista: Vista): ReactElement | null {
  if (e.tipo === "forma" || e.tipo === "texto") {
    return <polygon key={e.id} points={porVista(vista, esquinas(e.transformacion))} fill="none" stroke={COLOR_SELECCION} strokeWidth={1} strokeDasharray={undefined} />;
  }
  const caja = cajaDeElemento(escena, e);
  if (!caja) return null;
  const a = escenaAPantalla(vista, { x: caja.x, y: caja.y });
  return <rect key={e.id} x={a.x} y={a.y} width={caja.ancho * vista.zoom} height={caja.alto * vista.zoom} fill="none" stroke={COLOR_SELECCION} strokeWidth={1} strokeDasharray="4 3" />;
}

function CapaSeleccion({ escena, seleccion, vista, marco }: { escena: Escena; seleccion: readonly string[]; vista: Vista; marco: Marco | null }): ReactElement {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  const asas = marco ? posicionesDeAsas(marco, vista.zoom) : null;
  const esquinasMarco = marco ? porVista(vista, esquinas({ x: marco.x, y: marco.y, ancho: marco.ancho, alto: marco.alto, rotacion: marco.rotacion })) : "";
  const rotar = asas ? escenaAPantalla(vista, asas.rotar) : null;
  const arriba = asas ? escenaAPantalla(vista, asas.n) : null;
  return (
    <g data-capa="seleccion" pointerEvents="none">
      {elegidos.length > 1 || (elegidos[0] && (elegidos[0].tipo === "grupo" || elegidos[0].tipo === "linea")) ? elegidos.map((e) => contornoDeElemento(escena, e, vista)) : null}
      {marco ? <polygon points={esquinasMarco} fill="none" stroke={COLOR_SELECCION} strokeWidth={1.5} /> : null}
      {marco?.editable && asas && rotar && arriba ? (
        <>
          <line x1={arriba.x} y1={arriba.y} x2={rotar.x} y2={rotar.y} stroke={COLOR_SELECCION} strokeWidth={1} />
          <circle cx={rotar.x} cy={rotar.y} r={5} fill="#fff" stroke={COLOR_SELECCION} strokeWidth={1.5} data-asa="rotar" />
          {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((k) => {
            const p = escenaAPantalla(vista, asas[k]);
            return <rect key={k} x={p.x - TAMANO_ASA_PX / 2} y={p.y - TAMANO_ASA_PX / 2} width={TAMANO_ASA_PX} height={TAMANO_ASA_PX} fill="#fff" stroke={COLOR_SELECCION} strokeWidth={1.5} data-asa={k} />;
          })}
        </>
      ) : null}
    </g>
  );
}

function CapaGuias({ guias, vista }: { guias: readonly Guia[]; vista: Vista }): ReactElement {
  return (
    <g data-capa="guias" pointerEvents="none">
      {guias.map((g, i) => {
        const a = escenaAPantalla(vista, g.orientacion === "vertical" ? { x: g.posicion, y: g.desde } : { x: g.desde, y: g.posicion });
        const b = escenaAPantalla(vista, g.orientacion === "vertical" ? { x: g.posicion, y: g.hasta } : { x: g.hasta, y: g.posicion });
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLOR_GUIA} strokeWidth={1} data-guia={g.orientacion} />;
      })}
    </g>
  );
}

function BotonBarra({ etiqueta, atajo, onClick, disabled, activo, children }: { etiqueta: string; atajo?: string; onClick: () => void; disabled?: boolean; activo?: boolean; children: ReactElement }): ReactElement {
  return (
    <Button
      type="button"
      variant={activo ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      title={atajo ? `${etiqueta} (${atajo})` : etiqueta}
      aria-label={etiqueta}
      aria-pressed={activo === undefined ? undefined : activo}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function EditorLibre({ escena: escenaInicial, titulo, onCambio, onCerrar, enfocarAlAbrir = true }: EditorLibreProps): ReactElement {
  const [escena, setEscena] = useState<Escena>(() => normalizarEscena(escenaInicial));
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [vista, setVista] = useState<Vista>({ zoom: 1, x: 0, y: 0 });
  const [guias, setGuias] = useState<Guia[]>([]);
  const [recuadro, setRecuadro] = useState<{ x: number; y: number; ancho: number; alto: number } | null>(null);
  const [cuadricula, setCuadricula] = useState(false);
  const [imantar, setImantar] = useState(true);
  const [cursor, setCursor] = useState("default");
  const [anuncio, setAnuncio] = useState("");
  const [, setVersionHistorial] = useState(0);

  const historial = useRef(new Historial({ tope: 100 }));
  const ventanaRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const accion = useRef<Accion | null>(null);
  const espacio = useRef(false);
  const ayudaId = useId();

  // Estado «actual» para los manejadores de eventos (evita cierres con valores viejos).
  const vivo = useRef({ escena, seleccion, vista, cuadricula, imantar });
  vivo.current = { escena, seleccion, vista, cuadricula, imantar };

  const marco = useMemo(() => marcoDeSeleccion(escena, seleccion), [escena, seleccion]);

  // ─── Tamaño de la ventana y zoom inicial ────────────────────────────────────
  const medir = useCallback((): { ancho: number; alto: number } => {
    const r = ventanaRef.current?.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? { ancho: r.width, alto: r.height } : { ancho: 1000, alto: 600 };
  }, []);

  useLayoutEffect(() => {
    setVista(ajustarAVentana(vivo.current.escena, medir()));
    if (enfocarAlAbrir) svgRef.current?.focus();
  }, [medir, enfocarAlAbrir]);

  // ─── Cambios confirmados ────────────────────────────────────────────────────
  const confirmar = useCallback(
    (antes: Escena, nuevo: EstadoEditor): void => {
      const cambio = historial.current.registrar(antes, nuevo.escena);
      setEscena(nuevo.escena);
      setSeleccion(nuevo.seleccion);
      setAnuncio(describirSeleccion(nuevo.escena, nuevo.seleccion));
      setVersionHistorial((n) => n + 1);
      if (cambio) onCambio(nuevo.escena);
    },
    [onCambio],
  );

  const ejecutar = useCallback(
    (c: Comando): boolean => {
      const { escena: actual, seleccion: sel } = vivo.current;
      const r = ejecutarComando({ escena: actual, seleccion: sel }, c);
      if (!r) return false;
      if (r.escena === actual) {
        setSeleccion(r.seleccion);
        setAnuncio(describirSeleccion(actual, r.seleccion));
      } else {
        confirmar(actual, r);
      }
      return true;
    },
    [confirmar],
  );

  const deshacer = useCallback((): void => {
    const { escena: actual, seleccion: sel } = vivo.current;
    const r = historial.current.deshacer(actual);
    if (!r) return;
    setEscena(r);
    setSeleccion(depurarSeleccion(r, sel));
    setVersionHistorial((n) => n + 1);
    setAnuncio("Cambio deshecho.");
    onCambio(r);
  }, [onCambio]);

  const rehacer = useCallback((): void => {
    const { escena: actual, seleccion: sel } = vivo.current;
    const r = historial.current.rehacer(actual);
    if (!r) return;
    setEscena(r);
    setSeleccion(depurarSeleccion(r, sel));
    setVersionHistorial((n) => n + 1);
    setAnuncio("Cambio rehecho.");
    onCambio(r);
  }, [onCambio]);

  const cerrar = useCallback((): void => {
    onCerrar(vivo.current.escena);
  }, [onCerrar]);

  // ─── Zoom ───────────────────────────────────────────────────────────────────
  const centroVentana = useCallback((): Punto => {
    const m = medir();
    return { x: m.ancho / 2, y: m.alto / 2 };
  }, [medir]);

  const acercar = useCallback((factor: number): void => setVista((v) => zoomEn(v, centroVentana(), factor)), [centroVentana]);
  const ajustar = useCallback((): void => setVista(ajustarAVentana(vivo.current.escena, medir())), [medir]);

  // La rueda: con Ctrl/⌘ hace zoom en el cursor; sola, desplaza. Hay que registrarla sin «passive» para poder cancelar el scroll de la página.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const alRodar = (e: WheelEvent): void => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        const centro = { x: e.clientX - r.left, y: e.clientY - r.top };
        setVista((v) => zoomEn(v, centro, Math.exp(-e.deltaY * 0.0015)));
      } else {
        setVista((v) => desplazar(v, -e.deltaX, -e.deltaY));
      }
    };
    svg.addEventListener("wheel", alRodar, { passive: false });
    return () => svg.removeEventListener("wheel", alRodar);
  }, []);

  // ─── Puntero ────────────────────────────────────────────────────────────────
  const aPantalla = (e: { clientX: number; clientY: number }): Punto => {
    const r = svgRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };

  const alApretar = (e: PunteroReact<SVGSVGElement>): void => {
    svgRef.current?.focus();
    const pantalla = aPantalla(e);
    if (e.button === 1 || (e.button === 0 && espacio.current)) {
      accion.current = { modo: "pan", gesto: null, activo: true, origen: pantalla, ultimo: pantalla, shift: false };
      capturar(e);
      setCursor("grabbing");
      return;
    }
    if (e.button !== 0) return;
    const { escena: actual, seleccion: sel, vista: v } = vivo.current;
    const p = pantallaAEscena(v, pantalla);
    const actualMarco = marcoDeSeleccion(actual, sel);
    const asa = actualMarco ? asaEn(actualMarco, p, v.zoom) : null;
    let gesto: Gesto | null = null;
    let hit: string | undefined;
    if (asa) {
      gesto = asa === "rotar" ? iniciarRotar(actual, sel, p) : iniciarRedimensionar(actual, sel, asa, p);
    } else {
      const bajo = elementoEn(actual, p, { tolerancia: 6 / v.zoom });
      const nueva = seleccionAlHacerClic(actual, sel, p, e.shiftKey, v.zoom);
      if (bajo === undefined) {
        // En el vacío: sin Mayús se limpia la selección; con Mayús se conserva y el recuadro suma.
        if (!e.shiftKey) {
          setSeleccion([]);
          setAnuncio("Nada seleccionado.");
        }
        gesto = iniciarRecuadro(actual, p, e.shiftKey, sel);
      } else {
        setSeleccion(nueva);
        setAnuncio(describirSeleccion(actual, nueva));
        // Se arrastra lo que quede seleccionado (con Mayús, si se acaba de quitar el elemento, no hay nada que arrastrar).
        gesto = nueva.includes(bajo) ? iniciarMover(actual, nueva, p) : null;
        // Un clic sin arrastre sobre un elemento de una selección múltiple deja solo ese elemento.
        if (!e.shiftKey && sel.includes(bajo) && sel.length > 1) hit = bajo;
      }
    }
    accion.current = { modo: "gesto", gesto, activo: false, origen: pantalla, ultimo: pantalla, ...(hit !== undefined ? { hit } : {}), shift: e.shiftKey };
    capturar(e);
  };

  const alMover = (e: PunteroReact<SVGSVGElement>): void => {
    const a = accion.current;
    const pantalla = aPantalla(e);
    if (!a) {
      // Sin arrastre: solo cambia el cursor según lo que haya debajo.
      const { escena: actual, seleccion: sel, vista: v } = vivo.current;
      const m = marcoDeSeleccion(actual, sel);
      const asa: TipoAsa | null = m ? asaEn(m, pantallaAEscena(v, pantalla), v.zoom) : null;
      setCursor(espacio.current ? "grab" : asa && m ? cursorDeAsa(asa, m.rotacion) : "default");
      return;
    }
    if (a.modo === "pan") {
      setVista((v) => desplazar(v, pantalla.x - a.ultimo.x, pantalla.y - a.ultimo.y));
      a.ultimo = pantalla;
      return;
    }
    if (!a.gesto) return;
    if (!a.activo) {
      if (Math.hypot(pantalla.x - a.origen.x, pantalla.y - a.origen.y) < UMBRAL_ARRASTRE_PX) return;
      a.activo = true;
      historial.current.iniciarGesto(a.gesto.base);
    }
    const { vista: v, cuadricula: grilla, imantar: iman } = vivo.current;
    const r = avanzarGesto(
      a.gesto,
      pantallaAEscena(v, pantalla),
      { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey },
      { guias: iman, zoom: v.zoom, ...(grilla ? { cuadricula: LADO_CUADRICULA } : {}) },
    );
    setEscena(r.escena);
    setGuias(r.guias);
    setRecuadro(r.recuadro ?? null);
    if (r.seleccion) setSeleccion(r.seleccion);
  };

  const alSoltar = (e: PunteroReact<SVGSVGElement>): void => {
    const a = accion.current;
    accion.current = null;
    liberar(e);
    setGuias([]);
    setRecuadro(null);
    setCursor(espacio.current ? "grab" : "default");
    if (!a || a.modo === "pan") return;
    if (!a.activo) {
      // Un clic sin arrastre sobre un elemento de una selección múltiple deja solo ese elemento.
      if (a.hit !== undefined && !a.shift) {
        setSeleccion([a.hit]);
        setAnuncio(describirSeleccion(vivo.current.escena, [a.hit]));
      }
      return;
    }
    const final = vivo.current.escena;
    const registrado = historial.current.terminarGesto(final);
    setVersionHistorial((n) => n + 1);
    if (registrado) {
      setAnuncio(describirSeleccion(final, vivo.current.seleccion));
      onCambio(final);
    }
  };

  const alCancelarPuntero = (): void => {
    const a = accion.current;
    accion.current = null;
    setGuias([]);
    setRecuadro(null);
    if (a?.gesto && a.activo) {
      historial.current.cancelarGesto();
      setEscena(a.gesto.base);
    }
  };

  // ─── Teclado ────────────────────────────────────────────────────────────────
  const alTeclear = (e: TeclaReact<HTMLDivElement>): void => {
    // Nada de lo que se teclea aquí debe llegar al editor de diapositivas (Supr borraría el bloque, Ctrl+Z deshace la clase…).
    e.stopPropagation();
    const objetivo = e.target as HTMLElement;
    if (objetivo.tagName === "INPUT" || objetivo.tagName === "TEXTAREA" || objetivo.isContentEditable) return;
    if (e.key === " " && (objetivo as Element) === svgRef.current) {
      espacio.current = true;
      setCursor("grab");
      e.preventDefault();
      return;
    }
    const orden = ordenDeTecla(e);
    if (!orden) return;
    // Tab recorre los elementos solo desde el lienzo; en la barra de herramientas sigue siendo el Tab de siempre.
    if (orden.tipo === "siguiente" && (objetivo as Element) !== svgRef.current) return;
    // Mientras se arrastra, Escape cancela el gesto.
    if (orden.tipo === "cerrar" && accion.current?.activo) {
      e.preventDefault();
      alCancelarPuntero();
      return;
    }
    e.preventDefault();
    switch (orden.tipo) {
      case "deshacer":
        deshacer();
        return;
      case "rehacer":
        rehacer();
        return;
      case "cerrar":
        if (vivo.current.seleccion.length > 0) {
          setSeleccion([]);
          setAnuncio("Nada seleccionado.");
        } else {
          cerrar();
        }
        return;
      default:
        ejecutar(orden);
    }
  };

  const alSoltarTecla = (e: TeclaReact<HTMLDivElement>): void => {
    e.stopPropagation();
    if (e.key === " ") {
      espacio.current = false;
      setCursor("default");
    }
  };

  // ─── Estado de los botones ──────────────────────────────────────────────────
  const hay = seleccion.length > 0;
  const varios = seleccion.length > 1;
  // Los grupos no cuentan: son una agrupación de elementos que ya se cuentan.
  const cantidad = escena.elementos.filter((x) => x.tipo !== "grupo").length;
  const hayGrupo = escena.elementos.some((x) => x.tipo === "grupo" && seleccion.includes(x.id));
  const puedeDeshacer = historial.current.puedeDeshacer;
  const puedeRehacer = historial.current.puedeRehacer;
  const alinear = (modo: ModoAlineacion): void => void ejecutar({ tipo: "alinear", modo });
  const orden = (modo: ModoOrden): void => void ejecutar({ tipo: "orden", modo });

  const paginaX = escenaAPantalla(vista, { x: 0, y: 0 });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo?.trim() ? `Editor de dibujo: ${titulo.trim()}` : "Editor de dibujo"}
      data-dibujo-editor=""
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      onKeyDown={alTeclear}
      onKeyUp={alSoltarTecla}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div role="toolbar" aria-label="Herramientas del dibujo" className="flex flex-wrap items-center gap-1 border-b bg-card px-3 py-1.5">
        <BotonBarra etiqueta="Deshacer" atajo="Ctrl+Z" onClick={deshacer} disabled={!puedeDeshacer}>
          <Undo2 />
        </BotonBarra>
        <BotonBarra etiqueta="Rehacer" atajo="Ctrl+Y" onClick={rehacer} disabled={!puedeRehacer}>
          <Redo2 />
        </BotonBarra>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <BotonBarra etiqueta="Duplicar" atajo="Ctrl+D" onClick={() => void ejecutar({ tipo: "duplicar" })} disabled={!hay}>
          <Copy />
        </BotonBarra>
        <BotonBarra etiqueta="Eliminar" atajo="Supr" onClick={() => void ejecutar({ tipo: "eliminar" })} disabled={!hay}>
          <Trash2 />
        </BotonBarra>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <BotonBarra etiqueta="Agrupar" atajo="Ctrl+G" onClick={() => void ejecutar({ tipo: "agrupar" })} disabled={!varios}>
          <Group />
        </BotonBarra>
        <BotonBarra etiqueta="Desagrupar" atajo="Ctrl+Mayús+G" onClick={() => void ejecutar({ tipo: "desagrupar" })} disabled={!hayGrupo}>
          <Ungroup />
        </BotonBarra>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <BotonBarra etiqueta="Traer al frente" atajo="Ctrl+Mayús+]" onClick={() => orden("frente")} disabled={!hay}>
          <BringToFront />
        </BotonBarra>
        <BotonBarra etiqueta="Subir un nivel" atajo="Ctrl+]" onClick={() => orden("subir")} disabled={!hay}>
          <ChevronUp />
        </BotonBarra>
        <BotonBarra etiqueta="Bajar un nivel" atajo="Ctrl+[" onClick={() => orden("bajar")} disabled={!hay}>
          <ChevronDown />
        </BotonBarra>
        <BotonBarra etiqueta="Enviar al fondo" atajo="Ctrl+Mayús+[" onClick={() => orden("fondo")} disabled={!hay}>
          <SendToBack />
        </BotonBarra>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <BotonBarra etiqueta="Alinear a la izquierda" onClick={() => alinear("izquierda")} disabled={!hay}>
          <AlignStartVertical />
        </BotonBarra>
        <BotonBarra etiqueta="Centrar horizontalmente" onClick={() => alinear("centro")} disabled={!hay}>
          <AlignCenterVertical />
        </BotonBarra>
        <BotonBarra etiqueta="Alinear a la derecha" onClick={() => alinear("derecha")} disabled={!hay}>
          <AlignEndVertical />
        </BotonBarra>
        <BotonBarra etiqueta="Alinear arriba" onClick={() => alinear("arriba")} disabled={!hay}>
          <AlignStartHorizontal />
        </BotonBarra>
        <BotonBarra etiqueta="Centrar verticalmente" onClick={() => alinear("medio")} disabled={!hay}>
          <AlignCenterHorizontal />
        </BotonBarra>
        <BotonBarra etiqueta="Alinear abajo" onClick={() => alinear("abajo")} disabled={!hay}>
          <AlignEndHorizontal />
        </BotonBarra>
        <BotonBarra etiqueta="Distribuir horizontalmente" onClick={() => void ejecutar({ tipo: "distribuir", eje: "horizontal" })} disabled={seleccion.length < 3}>
          <AlignHorizontalSpaceBetween />
        </BotonBarra>
        <BotonBarra etiqueta="Distribuir verticalmente" onClick={() => void ejecutar({ tipo: "distribuir", eje: "vertical" })} disabled={seleccion.length < 3}>
          <AlignVerticalSpaceBetween />
        </BotonBarra>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <BotonBarra etiqueta="Alejar" onClick={() => acercar(1 / 1.25)} disabled={vista.zoom <= ZOOM_MIN}>
          <ZoomOut />
        </BotonBarra>
        <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground" data-dibujo-zoom="">
          {Math.round(vista.zoom * 100)}%
        </span>
        <BotonBarra etiqueta="Acercar" onClick={() => acercar(1.25)} disabled={vista.zoom >= ZOOM_MAX}>
          <ZoomIn />
        </BotonBarra>
        <BotonBarra etiqueta="Ajustar a la ventana" onClick={ajustar}>
          <Maximize />
        </BotonBarra>
        <BotonBarra etiqueta="Cuadrícula" onClick={() => setCuadricula((v) => !v)} activo={cuadricula}>
          <Grid3x3 />
        </BotonBarra>
        <BotonBarra etiqueta="Imantar a otros elementos" onClick={() => setImantar((v) => !v)} activo={imantar}>
          <Magnet />
        </BotonBarra>
        <div className="ml-auto">
          <Button type="button" size="sm" onClick={cerrar} data-dibujo-listo="">
            <Check /> Listo
          </Button>
        </div>
      </div>

      <div ref={ventanaRef} className="relative min-h-0 flex-1 overflow-hidden bg-muted/50">
        <svg
          ref={svgRef}
          tabIndex={0}
          role="application"
          aria-label="Lienzo de dibujo"
          aria-describedby={ayudaId}
          className="size-full touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          style={{ cursor }}
          onPointerDown={alApretar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alCancelarPuntero}
        >
          <g transform={`translate(${vista.x} ${vista.y}) scale(${vista.zoom})`}>
            <rect width={escena.ancho} height={escena.alto} fill="var(--background, #fff)" stroke="var(--border, #e2e8f0)" strokeWidth={1 / vista.zoom} data-dibujo-pagina="" />
            <NodosSvg escena={escena} />
          </g>
          {cuadricula ? (
            <g data-capa="cuadricula" pointerEvents="none" opacity={0.35}>
              {Array.from({ length: Math.floor(escena.ancho / LADO_CUADRICULA) + 1 }, (_, i) => (
                <line key={`v${i}`} x1={paginaX.x + i * LADO_CUADRICULA * vista.zoom} y1={paginaX.y} x2={paginaX.x + i * LADO_CUADRICULA * vista.zoom} y2={paginaX.y + escena.alto * vista.zoom} stroke="#94a3b8" strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.floor(escena.alto / LADO_CUADRICULA) + 1 }, (_, i) => (
                <line key={`h${i}`} x1={paginaX.x} y1={paginaX.y + i * LADO_CUADRICULA * vista.zoom} x2={paginaX.x + escena.ancho * vista.zoom} y2={paginaX.y + i * LADO_CUADRICULA * vista.zoom} stroke="#94a3b8" strokeWidth={0.5} />
              ))}
            </g>
          ) : null}
          <CapaSeleccion escena={escena} seleccion={seleccion} vista={vista} marco={marco} />
          <CapaGuias guias={guias} vista={vista} />
          {recuadro ? (
            <rect
              data-capa="recuadro"
              pointerEvents="none"
              x={escenaAPantalla(vista, { x: recuadro.x, y: recuadro.y }).x}
              y={escenaAPantalla(vista, { x: recuadro.x, y: recuadro.y }).y}
              width={recuadro.ancho * vista.zoom}
              height={recuadro.alto * vista.zoom}
              fill={COLOR_SELECCION}
              fillOpacity={0.08}
              stroke={COLOR_SELECCION}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ) : null}
        </svg>
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-card px-3 py-1 text-[11px] text-muted-foreground">
        <span data-dibujo-estado="">
          {cantidad === 0 ? "Lienzo vacío" : `${cantidad} ${cantidad === 1 ? "elemento" : "elementos"}`}
          {hay ? ` · ${seleccion.length} ${seleccion.length === 1 ? "seleccionado" : "seleccionados"}` : ""}
        </span>
        <span>Clic para elegir · Mayús suma · Arrastra para mover · Rueda desplaza · Ctrl+rueda acerca</span>
      </div>

      <p id={ayudaId} className="sr-only">
        Flechas mueven lo seleccionado una unidad; con Mayús, diez. Tab recorre los elementos. Ctrl+Z deshace, Ctrl+Y rehace. Supr elimina. Escape quita la selección y, sin selección, cierra el editor.
      </p>
      <div aria-live="polite" role="status" className="sr-only" data-dibujo-anuncio="">
        {anuncio}
      </div>
    </div>
  );
}
