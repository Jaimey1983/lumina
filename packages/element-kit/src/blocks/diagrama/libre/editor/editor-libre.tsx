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
  type MouseEvent as RatonReact,
  type PointerEvent as PunteroReact,
  type ReactElement,
} from "react";
import {
  FORMAS,
  Historial,
  actualizar,
  agregar,
  ajustar as ajustarPunto,
  cajaDeElemento,
  eliminar,
  elementoEn,
  escenaConRutas,
  esquinas,
  normalizarEscena,
  sincronizarConectores,
  trazadoForma,
  type Conexion,
  type Elemento,
  type EntradaElemento,
  type Escena,
  type Guia,
  type ModoAlineacion,
  type ModoOrden,
  type Punto,
  type PuertoCercano,
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
import { NodosSvg } from "../dibujo-render.js";
import { asaEn, bloqueadosEfectivos as bloqueadosEfectivosDe, cursorDeAsa, marcoDeSeleccion, posicionesDeAsas, type Marco, type TipoAsa } from "./asas.js";
import { depurarSeleccion, ejecutarComando, ordenDeTecla, type Comando, type EstadoEditor, type NombreHerramienta } from "./comandos.js";
import {
  SELECCIONAR,
  TEXTO_NUEVO,
  areaDeTexto,
  cajaArrastrada,
  cajaPorDefecto,
  conMinimo,
  entradaForma,
  entradaLinea,
  entradaTexto,
  esClic,
  restringirAngulo,
  type AreaDeTexto,
  type Herramienta,
} from "./herramientas.js";
import { BarraConector, CapaAsasDeConector, CapaPuertos } from "./conectores-capa.js";
import {
  agarreEn,
  aConexion,
  avanzarConector,
  iniciarConector,
  lineaUnica,
  lineasElegidas,
  quitarPuntoIntermedio,
  resolverPuntoDeLinea,
  sinConectoresQueSiguen,
  type GestoConector,
} from "./conectores.js";
import { BotonExportar } from "./exportar-panel.js";
import { Paleta } from "./paleta.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { TextoEnSitio } from "./texto-en-sitio.js";
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
  modo: "pan" | "gesto" | "crear" | "conector";
  gesto: Gesto | null;
  /** Solo en modo `conector`: arrastre de un extremo o de un punto intermedio de una línea. */
  conector?: GestoConector;
  /** Solo al crear una línea: puerto al que se pegó el primer punto. */
  conexionInicio?: Conexion;
  /** Solo al crear: dónde empezó el arrastre, en coordenadas de escena (ya imantado). */
  inicioEscena?: Punto;
  activo: boolean;
  origen: Punto;
  ultimo: Punto;
  /** Elemento que estaba bajo el cursor al apretar (para elegirlo al soltar sin haber arrastrado). */
  hit?: string;
  shift: boolean;
};

/** Lo que se ve mientras se dibuja, antes de soltar. */
type VistaPrevia =
  | { tipo: "forma"; forma: Parameters<typeof trazadoForma>[0]; caja: { x: number; y: number; ancho: number; alto: number } }
  | { tipo: "texto"; caja: { x: number; y: number; ancho: number; alto: number } }
  | { tipo: "linea"; puntos: Punto[]; flecha: boolean };

interface Edicion {
  /** `null` = texto nuevo que todavía no existe en la escena. */
  id: string | null;
  area: AreaDeTexto;
  valor: string;
}

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

/** Texto de ayuda de la barra de estado según la herramienta. */
function ayudaDeHerramienta(h: Herramienta, enCurso: Punto[] | null): string {
  if (h.tipo === "forma") return `${FORMAS[h.forma].nombre}: haz clic para insertarla o arrastra para dibujarla (Mayús = proporcional, Alt = desde el centro) · Esc cancela`;
  if (h.tipo === "texto") return "Texto: haz clic o arrastra donde quieras escribir · Enter confirma, Mayús+Enter salta de línea, Esc cancela";
  if (h.tipo === "linea") return enCurso ? "Haz clic en cada punto · doble clic o Enter termina · Mayús ajusta el ángulo · Esc cancela" : `${h.flecha ? "Flecha" : "Línea"}: arrastra para trazarla o haz clic en cada punto (doble clic termina) · Esc cancela`;
  return "Clic para elegir · Mayús suma · Arrastra para mover · Doble clic escribe · Rueda desplaza · Ctrl+rueda acerca";
}

/** Lo que se está dibujando, antes de soltar. */
function CapaPrevia({ previa, vista }: { previa: VistaPrevia | null; vista: Vista }): ReactElement | null {
  if (!previa) return null;
  if (previa.tipo === "linea") {
    const puntos = previa.puntos.map((p) => escenaAPantalla(vista, p));
    return (
      <g data-capa="previa" pointerEvents="none">
        <polyline points={puntos.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={COLOR_SELECCION} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />
        {puntos.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke={COLOR_SELECCION} strokeWidth={1.5} />
        ))}
      </g>
    );
  }
  const o = escenaAPantalla(vista, { x: previa.caja.x, y: previa.caja.y });
  const ancho = previa.caja.ancho * vista.zoom;
  const alto = previa.caja.alto * vista.zoom;
  return (
    <g data-capa="previa" pointerEvents="none">
      {previa.tipo === "forma" && ancho > 1 && alto > 1 ? (
        <path d={trazadoForma(previa.forma, ancho, alto)} transform={`translate(${o.x} ${o.y})`} fill={COLOR_SELECCION} fillOpacity={0.1} stroke={COLOR_SELECCION} strokeWidth={1.5} strokeDasharray="5 4" />
      ) : (
        <rect x={o.x} y={o.y} width={ancho} height={alto} fill={COLOR_SELECCION} fillOpacity={0.06} stroke={COLOR_SELECCION} strokeWidth={1.5} strokeDasharray="5 4" />
      )}
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
  const [escena, setEscena] = useState<Escena>(() => sincronizarConectores(normalizarEscena(escenaInicial)));
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [vista, setVista] = useState<Vista>({ zoom: 1, x: 0, y: 0 });
  const [guias, setGuias] = useState<Guia[]>([]);
  const [recuadro, setRecuadro] = useState<{ x: number; y: number; ancho: number; alto: number } | null>(null);
  const [cuadricula, setCuadricula] = useState(false);
  const [imantar, setImantar] = useState(true);
  const [cursor, setCursor] = useState("default");
  const [anuncio, setAnuncio] = useState("");
  const [, setVersionHistorial] = useState(0);
  const [herramienta, setHerramienta] = useState<Herramienta>(SELECCIONAR);
  const [enCurso, setEnCurso] = useState<Punto[] | null>(null);
  const [previa, setPrevia] = useState<VistaPrevia | null>(null);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [objetivoPuerto, setObjetivoPuerto] = useState<PuertoCercano | null>(null);
  const [arrastrandoExtremo, setArrastrandoExtremo] = useState(false);
  /** Puerto de cada punto de la línea que se está dibujando (alineado con `enCurso`). */
  const conexionesCurso = useRef<Array<Conexion | undefined>>([]);
  const edicionRef = useRef<Edicion | null>(null);

  const historial = useRef(new Historial({ tope: 100 }));
  const ventanaRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const accion = useRef<Accion | null>(null);
  const espacio = useRef(false);
  const ayudaId = useId();

  // Estado «actual» para los manejadores de eventos (evita cierres con valores viejos).
  const vivo = useRef({ escena, seleccion, vista, cuadricula, imantar, herramienta, enCurso });
  vivo.current = { escena, seleccion, vista, cuadricula, imantar, herramienta, enCurso };

  // Las líneas en ángulo recto o curvas no van en línea recta entre sus extremos: lo que se ve (cajas, clics) se calcula sobre su recorrido real.
  const escenaRutas = useMemo(() => escenaConRutas(escena), [escena]);
  const lineaElegida = useMemo(() => lineaUnica(escena, seleccion), [escena, seleccion]);
  // Una sola línea elegida muestra las asas del conector (extremos y puntos intermedios), no las del marco: coincidirían en las puntas.
  const marco = useMemo(() => (lineaElegida ? null : marcoDeSeleccion(escenaRutas, seleccion)), [escenaRutas, seleccion, lineaElegida]);

  // ─── Panel de propiedades (W8) ──────────────────────────────────────────────
  // Los deslizadores y el selector de color dan vista previa sin tocar el historial y entran como UNA entrada al soltar.
  const vistaPanel = useRef<{ base: Escena; ultima: Escena } | null>(null);

  const finVistaPanel = useCallback((): void => {
    const v = vistaPanel.current;
    if (!v) return;
    vistaPanel.current = null;
    const registrado = historial.current.terminarGesto(v.ultima);
    setVersionHistorial((n) => n + 1);
    if (registrado) {
      setAnuncio("Propiedades cambiadas.");
      onCambio(v.ultima);
    }
  }, [onCambio]);

  const vistaDelPanel = useCallback((cambio: (e: Escena) => Escena): void => {
    if (!vistaPanel.current) {
      const base = vivo.current.escena;
      vistaPanel.current = { base, ultima: base };
      historial.current.iniciarGesto(base);
    }
    const nueva = sincronizarConectores(cambio(vistaPanel.current.base));
    vistaPanel.current.ultima = nueva;
    setEscena(nueva);
  }, []);

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
    (antes: Escena, nuevoEstado: EstadoEditor): void => {
      // Toda escena del editor llega con los conectores al día: así un conector se queda donde se veía si se borra su forma.
      const nuevo = { ...nuevoEstado, escena: sincronizarConectores(nuevoEstado.escena) };
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
      finVistaPanel();
      const { escena: actual, seleccion: sel } = vivo.current;
      // Al alinear o distribuir, los conectores siguen a sus formas en vez de moverse solos (se despegarían).
      const alinea = c.tipo === "alinear" || c.tipo === "distribuir";
      const resultado = ejecutarComando({ escena: actual, seleccion: alinea ? sinConectoresQueSiguen(actual, sel) : sel }, c);
      const r = resultado && alinea ? { ...resultado, seleccion: sel } : resultado;
      if (!r) return false;
      if (r.escena === actual) {
        setSeleccion(r.seleccion);
        setAnuncio(describirSeleccion(actual, r.seleccion));
      } else {
        confirmar(actual, r);
      }
      return true;
    },
    [confirmar, finVistaPanel],
  );

  const aplicarDelPanel = useCallback(
    (cambio: (e: Escena) => Escena): void => {
      finVistaPanel();
      const { escena: actual, seleccion: sel } = vivo.current;
      const nueva = cambio(actual);
      if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: sel });
    },
    [confirmar, finVistaPanel],
  );

  const seleccionarDesdeCapas = useCallback((ids: string[], sumar: boolean): void => {
    setSeleccion((previa) => (sumar ? (ids.every((i) => previa.includes(i)) ? previa.filter((i) => !ids.includes(i)) : [...new Set([...previa, ...ids])]) : ids));
  }, []);

  const deshacer = useCallback((): void => {
    finVistaPanel();
    const { escena: actual, seleccion: sel } = vivo.current;
    const r = historial.current.deshacer(actual);
    if (!r) return;
    setEscena(r);
    setSeleccion(depurarSeleccion(r, sel));
    setVersionHistorial((n) => n + 1);
    setAnuncio("Cambio deshecho.");
    onCambio(r);
  }, [onCambio, finVistaPanel]);

  const rehacer = useCallback((): void => {
    finVistaPanel();
    const { escena: actual, seleccion: sel } = vivo.current;
    const r = historial.current.rehacer(actual);
    if (!r) return;
    setEscena(r);
    setSeleccion(depurarSeleccion(r, sel));
    setVersionHistorial((n) => n + 1);
    setAnuncio("Cambio rehecho.");
    onCambio(r);
  }, [onCambio, finVistaPanel]);

  const cerrar = useCallback((): void => {
    finVistaPanel();
    onCerrar(vistaPanel.current ? vistaPanel.current.ultima : vivo.current.escena);
  }, [onCerrar, finVistaPanel]);

  // ─── Herramientas de creación (W6) ──────────────────────────────────────────
  const fijarCurso = useCallback((puntos: Punto[] | null, conexiones: Array<Conexion | undefined> = []): void => {
    conexionesCurso.current = puntos ? conexiones : [];
    setEnCurso(puntos);
  }, []);

  const fijarObjetivo = useCallback((p: PuertoCercano | null): void => {
    setObjetivoPuerto((previo) => (previo?.elementoId === p?.elementoId && previo?.puerto === p?.puerto ? previo : p));
  }, []);

  const elegirHerramienta = useCallback((h: Herramienta): void => {
    setHerramienta(h);
    fijarCurso(null);
    fijarObjetivo(null);
    setPrevia(null);
    setAnuncio(h.tipo === "seleccionar" ? "Herramienta: seleccionar." : h.tipo === "forma" ? `Herramienta: ${FORMAS[h.forma].nombre}. Haz clic o arrastra en el lienzo.` : h.tipo === "linea" ? `Herramienta: ${h.flecha ? "flecha" : "línea"}. Arrastra, o haz clic en cada punto y doble clic para terminar.` : "Herramienta: texto. Haz clic o arrastra en el lienzo.");
    svgRef.current?.focus();
  }, [fijarCurso, fijarObjetivo]);

  const elegirPorNombre = useCallback(
    (nombre: NombreHerramienta): void => elegirHerramienta(nombre === "seleccionar" ? SELECCIONAR : nombre === "texto" ? { tipo: "texto" } : { tipo: "linea", flecha: nombre === "flecha" }),
    [elegirHerramienta],
  );

  /** Agrega lo dibujado, lo deja seleccionado y vuelve a la herramienta de seleccionar. */
  const crearElemento = useCallback(
    (entrada: EntradaElemento): void => {
      const { escena: actual } = vivo.current;
      const r = agregar(actual, entrada);
      if (r.id === "") {
        setAnuncio("No se pudo agregar el elemento.");
        return;
      }
      confirmar(actual, { escena: r.escena, seleccion: [r.id] });
      const nuevo = r.escena.elementos.find((x) => x.id === r.id);
      setAnuncio(`${nuevo ? describirElemento(nuevo) : "Elemento"} agregado.`);
      setHerramienta(SELECCIONAR);
    },
    [confirmar],
  );

  /** Punto de la escena con el imán de las guías y de la cuadrícula (Ctrl lo suspende). */
  const imantarPunto = (p: Punto, ctrl: boolean, excluir?: readonly string[]): Punto => {
    const { escena: actual, vista: v, cuadricula: grilla, imantar: iman } = vivo.current;
    if (ctrl || (!iman && !grilla)) return p;
    return ajustarPunto(p, actual, { guias: iman, umbral: 6 / v.zoom, ...(excluir ? { excluir } : {}), ...(grilla ? { cuadricula: LADO_CUADRICULA } : {}) }).punto;
  };

  /** Termina la línea de varios puntos. (Un doble clic no suma un punto de más: cada clic ya descarta los repetidos.) */
  const terminarLinea = (puntos: readonly Punto[], flecha: boolean): void => {
    const conexiones = conexionesCurso.current;
    fijarCurso(null);
    fijarObjetivo(null);
    setPrevia(null);
    if (puntos.length >= 2) crearElemento(lineaConConexiones(puntos, flecha, conexiones[0], conexiones[puntos.length - 1]));
  };

  /** Línea nueva; si empieza o termina en un puerto, queda pegada a esa forma. */
  const lineaConConexiones = (puntos: readonly Punto[], flecha: boolean, origen: Conexion | undefined, destino: Conexion | undefined): EntradaElemento => ({
    ...entradaLinea(puntos, flecha),
    ...(origen ? { origen } : {}),
    ...(destino ? { destino } : {}),
  });

  /** Punto de una línea en curso: pegado al puerto cercano, o imantado (con Mayús, a múltiplos de 15° respecto de `desde`). */
  const puntoDeLinea = (crudo: Punto, ctrl: boolean, shift: boolean, desde?: Punto): ReturnType<typeof resolverPuntoDeLinea> => {
    const { escena: actual, vista: v } = vivo.current;
    return resolverPuntoDeLinea(actual, crudo, imantarPunto(crudo, ctrl), {
      zoom: v.zoom,
      sinImanDePuertos: ctrl,
      ...(shift && desde ? { restringir: (p: Punto) => restringirAngulo(desde, p) } : {}),
    });
  };

  // ─── Texto en el sitio ──────────────────────────────────────────────────────
  const fijarEdicion = useCallback((e: Edicion | null): void => {
    edicionRef.current = e;
    setEdicion(e);
  }, []);

  const abrirEdicion = (id: string): void => {
    const { escena: actual } = vivo.current;
    const el = actual.elementos.find((x) => x.id === id);
    if (!el || bloqueadosEfectivosDe(actual).has(id)) return;
    const area = areaDeTexto(actual, el);
    if (!area) return;
    setSeleccion([id]);
    fijarEdicion({ id, area, valor: area.texto });
  };

  const abrirEdicionNueva = (caja: { x: number; y: number; ancho: number; alto: number }): void => {
    // El aspecto del texto nuevo es el que el normalizador le da a un texto sin estilo.
    const modelo = normalizarEscena({ elementos: [{ tipo: "texto", id: "modelo", texto: "" }] }).elementos[0];
    const base = modelo ? areaDeTexto(vivo.current.escena, modelo) : null;
    if (!base) return;
    fijarEdicion({ id: null, area: { ...base, caja, centro: { x: caja.x + caja.ancho / 2, y: caja.y + caja.alto / 2 }, texto: "" }, valor: "" });
  };

  const confirmarEdicion = (): void => {
    const ed = edicionRef.current;
    if (!ed) return;
    fijarEdicion(null);
    svgRef.current?.focus();
    const { escena: actual } = vivo.current;
    if (ed.id === null) {
      if (ed.valor.trim() === "") return;
      crearElemento(entradaTexto(ed.area.caja, ed.valor));
    } else if (ed.valor.trim() === "" && actual.elementos.find((x) => x.id === ed.id)?.tipo === "texto") {
      // Un cuadro de texto sin texto no se puede representar (el normalizador le pondría «Texto»): se quita, como en cualquier editor.
      const nueva = eliminar(actual, [ed.id]);
      if (nueva !== actual) {
        confirmar(actual, { escena: nueva, seleccion: [] });
        setAnuncio("Cuadro de texto vacío eliminado.");
      }
    } else if (ed.valor !== ed.area.texto) {
      const nueva = actualizar(actual, [ed.id], { texto: ed.valor });
      if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: [ed.id] });
    }
  };

  const cancelarEdicion = (): void => {
    fijarEdicion(null);
    svgRef.current?.focus();
  };

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
    finVistaPanel();
    svgRef.current?.focus();
    const pantalla = aPantalla(e);
    if (e.button === 1 || (e.button === 0 && espacio.current)) {
      accion.current = { modo: "pan", gesto: null, activo: true, origen: pantalla, ultimo: pantalla, shift: false };
      capturar(e);
      setCursor("grabbing");
      return;
    }
    if (e.button !== 0) return;
    const { escena: actual, seleccion: sel, vista: v, herramienta: h } = vivo.current;
    if (h.tipo !== "seleccionar") {
      // Crear: se parte del punto (imantado, o del puerto si se empieza una línea sobre uno) y se decide al soltar si fue un clic o un arrastre.
      const crudo = pantallaAEscena(v, pantalla);
      const ctrl = e.ctrlKey || e.metaKey;
      const desdeLinea = h.tipo === "linea" ? puntoDeLinea(crudo, ctrl, false) : null;
      const inicio = desdeLinea ? desdeLinea.punto : imantarPunto(crudo, ctrl);
      const conexionInicio = aConexion(desdeLinea?.puerto ?? null);
      accion.current = { modo: "crear", gesto: null, activo: false, origen: pantalla, ultimo: pantalla, inicioEscena: inicio, shift: e.shiftKey, ...(conexionInicio ? { conexionInicio } : {}) };
      capturar(e);
      return;
    }
    const p = pantallaAEscena(v, pantalla);
    // Una línea elegida: sus extremos y puntos intermedios se agarran antes que cualquier otra cosa.
    const lineaSel = lineaUnica(actual, sel);
    const agarre = lineaSel ? agarreEn(actual, lineaSel, p, v.zoom) : null;
    if (lineaSel && agarre) {
      accion.current = { modo: "conector", gesto: null, conector: iniciarConector(actual, lineaSel.id, agarre), activo: false, origen: pantalla, ultimo: pantalla, shift: e.shiftKey };
      capturar(e);
      return;
    }
    const rutas = escenaConRutas(actual);
    const actualMarco = lineaSel ? null : marcoDeSeleccion(rutas, sel);
    const asa = actualMarco ? asaEn(actualMarco, p, v.zoom) : null;
    let gesto: Gesto | null = null;
    let hit: string | undefined;
    if (asa) {
      gesto = asa === "rotar" ? iniciarRotar(actual, sel, p) : iniciarRedimensionar(actual, sel, asa, p);
    } else {
      const bajo = elementoEn(rutas, p, { tolerancia: 6 / v.zoom });
      const nueva = seleccionAlHacerClic(rutas, sel, p, e.shiftKey, v.zoom);
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
      // Sin arrastre: cambia el cursor según la herramienta y lo que haya debajo; una línea a medio hacer sigue al cursor.
      const { escena: actual, seleccion: sel, vista: v, herramienta: h, enCurso: curso } = vivo.current;
      if (h.tipo !== "seleccionar") {
        setCursor(espacio.current ? "grab" : h.tipo === "texto" ? "text" : "crosshair");
        if (h.tipo === "linea") {
          // El puerto que atrae al punto se resalta, también antes de apretar.
          const ultimo = curso && curso.length > 0 ? (curso[curso.length - 1] as Punto) : undefined;
          const r = puntoDeLinea(pantallaAEscena(v, pantalla), e.ctrlKey || e.metaKey, e.shiftKey, ultimo);
          fijarObjetivo(r.puerto);
          if (curso && ultimo) setPrevia({ tipo: "linea", puntos: [...curso, r.punto], flecha: h.flecha });
        }
        return;
      }
      const puntoEscena = pantallaAEscena(v, pantalla);
      const lineaSel = lineaUnica(actual, sel);
      const sobreAgarre = lineaSel ? agarreEn(actual, lineaSel, puntoEscena, v.zoom) : null;
      const m = lineaSel ? null : marcoDeSeleccion(escenaConRutas(actual), sel);
      const asa: TipoAsa | null = m ? asaEn(m, puntoEscena, v.zoom) : null;
      setCursor(espacio.current ? "grab" : sobreAgarre ? "pointer" : asa && m ? cursorDeAsa(asa, m.rotacion) : "default");
      return;
    }
    if (a.modo === "pan") {
      setVista((v) => desplazar(v, pantalla.x - a.ultimo.x, pantalla.y - a.ultimo.y));
      a.ultimo = pantalla;
      return;
    }
    if (a.modo === "crear") {
      if (!a.activo) {
        if (Math.hypot(pantalla.x - a.origen.x, pantalla.y - a.origen.y) < UMBRAL_ARRASTRE_PX) return;
        a.activo = true;
      }
      const { vista: v, herramienta: h, enCurso: curso } = vivo.current;
      const inicio = a.inicioEscena as Punto;
      const crudo = pantallaAEscena(v, pantalla);
      const fin = imantarPunto(crudo, e.ctrlKey || e.metaKey);
      if (h.tipo === "forma") setPrevia({ tipo: "forma", forma: h.forma, caja: cajaArrastrada(inicio, fin, { proporcional: e.shiftKey, desdeCentro: e.altKey }) });
      else if (h.tipo === "texto") setPrevia({ tipo: "texto", caja: cajaArrastrada(inicio, fin) });
      else if (h.tipo === "linea") {
        const desde = curso && curso.length > 0 ? (curso[curso.length - 1] as Punto) : inicio;
        const r = puntoDeLinea(crudo, e.ctrlKey || e.metaKey, e.shiftKey, desde);
        fijarObjetivo(r.puerto);
        setPrevia({ tipo: "linea", puntos: [...(curso ?? [inicio]), r.punto], flecha: h.flecha });
      }
      return;
    }
    if (a.modo === "conector" && a.conector) {
      if (!a.activo) {
        if (Math.hypot(pantalla.x - a.origen.x, pantalla.y - a.origen.y) < UMBRAL_ARRASTRE_PX) return;
        a.activo = true;
        historial.current.iniciarGesto(a.conector.base);
        setArrastrandoExtremo(a.conector.tipo === "extremo");
      }
      const { vista: v } = vivo.current;
      const crudo = pantallaAEscena(v, pantalla);
      const r = avanzarConector(a.conector, { puntero: crudo, imantado: imantarPunto(crudo, e.ctrlKey || e.metaKey, [a.conector.id]), zoom: v.zoom, sinImanDePuertos: e.ctrlKey || e.metaKey });
      setEscena(r.escena);
      fijarObjetivo(r.puerto);
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
    setEscena(sincronizarConectores(r.escena));
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
    const base = vivo.current.herramienta.tipo === "seleccionar" ? "default" : vivo.current.herramienta.tipo === "texto" ? "text" : "crosshair";
    setCursor(espacio.current ? "grab" : base);
    if (!a || a.modo === "pan") return;
    if (a.modo === "crear") {
      const { vista: v, herramienta: h, enCurso: curso } = vivo.current;
      const inicio = a.inicioEscena as Punto;
      const crudo = pantallaAEscena(v, aPantalla(e));
      const fin = imantarPunto(crudo, e.ctrlKey || e.metaKey);
      setPrevia(null);
      fijarObjetivo(null);
      if (h.tipo === "forma") {
        const arrastrada = cajaArrastrada(inicio, fin, { proporcional: e.shiftKey, desdeCentro: e.altKey });
        const clic = !a.activo || esClic({ ancho: arrastrada.ancho * v.zoom, alto: arrastrada.alto * v.zoom });
        crearElemento(entradaForma(h.forma, clic ? cajaPorDefecto(h.forma, inicio) : conMinimo(arrastrada)));
      } else if (h.tipo === "texto") {
        const arrastrada = cajaArrastrada(inicio, fin);
        const clic = !a.activo || esClic({ ancho: arrastrada.ancho * v.zoom, alto: arrastrada.alto * v.zoom });
        abrirEdicionNueva(clic ? { x: inicio.x, y: inicio.y, ancho: TEXTO_NUEVO.ancho, alto: TEXTO_NUEVO.alto } : conMinimo(arrastrada, 24));
      } else if (curso && curso.length > 0) {
        // Línea a medio hacer: cada clic suma un punto (pegado al puerto si cae en uno).
        const ultimo = curso[curso.length - 1] as Punto;
        const r = puntoDeLinea(crudo, e.ctrlKey || e.metaKey, e.shiftKey, ultimo);
        if (Math.hypot(r.punto.x - ultimo.x, r.punto.y - ultimo.y) * v.zoom >= 3) fijarCurso([...curso, r.punto], [...conexionesCurso.current, aConexion(r.puerto)]);
      } else if (a.activo) {
        // Arrastre: una línea recta de punta a punta; cada punta se pega al puerto en que empiece o termine.
        const r = puntoDeLinea(crudo, e.ctrlKey || e.metaKey, e.shiftKey, inicio);
        if (Math.hypot(r.punto.x - inicio.x, r.punto.y - inicio.y) * v.zoom >= 4) crearElemento(lineaConConexiones([inicio, r.punto], h.tipo === "linea" && h.flecha, a.conexionInicio, aConexion(r.puerto)));
      } else {
        // Clic: empieza una línea con puntos intermedios.
        fijarCurso([inicio], [a.conexionInicio]);
      }
      return;
    }
    if (a.modo === "conector") {
      fijarObjetivo(null);
      setArrastrandoExtremo(false);
    }
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
    setPrevia(null);
    fijarObjetivo(null);
    setArrastrandoExtremo(false);
    if (a?.gesto && a.activo) {
      historial.current.cancelarGesto();
      setEscena(a.gesto.base);
    }
    if (a?.conector && a.activo) {
      historial.current.cancelarGesto();
      setEscena(a.conector.base);
    }
  };

  const alDobleClic = (e: RatonReact<SVGSVGElement>): void => {
    const { herramienta: h, enCurso: curso, escena: actual, vista: v } = vivo.current;
    // Con la herramienta de línea, el doble clic cierra la línea de varios puntos.
    if (h.tipo === "linea") {
      if (curso) terminarLinea(curso, h.flecha);
      return;
    }
    if (h.tipo !== "seleccionar") return;
    const lineaSel = lineaUnica(actual, vivo.current.seleccion);
    const agarre = lineaSel ? agarreEn(actual, lineaSel, pantallaAEscena(v, aPantalla(e)), v.zoom) : null;
    if (lineaSel && agarre) {
      // Doble clic en un punto intermedio lo quita (la línea se vuelve a enrutar sola); en un extremo no hace nada.
      if (agarre.tipo === "via") {
        const nueva = quitarPuntoIntermedio(actual, lineaSel.id, agarre.indice);
        if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: [lineaSel.id] });
      }
      return;
    }
    // Con seleccionar, el doble clic escribe en el elemento (dentro de una forma, el rótulo de una línea, el cuadro de texto).
    const id = elementoEn(escenaConRutas(actual), pantallaAEscena(v, aPantalla(e)), { tolerancia: 6 / v.zoom, entrarEnGrupos: true });
    if (id !== undefined) abrirEdicion(id);
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
    // Tab, Enter y las letras de herramienta solo valen desde el lienzo; en la barra siguen siendo las teclas de siempre.
    if ((orden.tipo === "siguiente" || orden.tipo === "aceptar" || orden.tipo === "herramienta") && (objetivo as Element) !== svgRef.current) return;
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
      case "herramienta":
        elegirPorNombre(orden.herramienta);
        return;
      case "aceptar": {
        const { enCurso: curso, herramienta: h } = vivo.current;
        if (curso && h.tipo === "linea") terminarLinea(curso, h.flecha);
        return;
      }
      case "cerrar":
        if (vivo.current.enCurso) {
          fijarCurso(null);
          fijarObjetivo(null);
          setPrevia(null);
          setAnuncio("Línea cancelada.");
        } else if (vivo.current.herramienta.tipo !== "seleccionar") {
          elegirHerramienta(SELECCIONAR);
        } else if (vivo.current.seleccion.length > 0) {
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
  const formasElegidas = useMemo(() => new Set(escena.elementos.filter((x) => x.tipo === "forma" && seleccion.includes(x.id)).map((x) => x.id)), [escena, seleccion]);
  const lineasConector = useMemo(() => lineasElegidas(escena, seleccion), [escena, seleccion]);
  const cambiarConector = (nueva: Escena): void => {
    const { escena: actual, seleccion: sel } = vivo.current;
    if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: sel });
    svgRef.current?.focus();
  };
  const hay = seleccion.length > 0;
  const varios = seleccion.length > 1;
  // Los grupos no cuentan: son una agrupación de elementos que ya se cuentan.
  const cantidad = escena.elementos.filter((x) => x.tipo !== "grupo").length;
  const hayGrupo = escena.elementos.some((x) => x.tipo === "grupo" && seleccion.includes(x.id));
  const puedeDeshacer = historial.current.puedeDeshacer;
  const puedeRehacer = historial.current.puedeRehacer;
  const alinear = (modo: ModoAlineacion): void => void ejecutar({ tipo: "alinear", modo });
  const orden = (modo: ModoOrden): void => void ejecutar({ tipo: "orden", modo });

  // El cursor base sigue a la herramienta (el movimiento del puntero lo afina sobre las asas).
  useEffect(() => {
    setCursor(herramienta.tipo === "seleccionar" ? "default" : herramienta.tipo === "texto" ? "text" : "crosshair");
  }, [herramienta]);

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
        <div className="ml-auto flex items-center gap-2">
          <BotonExportar escena={escena} {...(titulo ? { titulo } : {})} />
          <Button type="button" size="sm" onClick={cerrar} data-dibujo-listo="">
            <Check /> Listo
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
      <Paleta herramienta={herramienta} onElegir={elegirHerramienta} />
      <div ref={ventanaRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/50">
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
          onDoubleClick={alDobleClic}
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
          <CapaSeleccion escena={escenaRutas} seleccion={lineaElegida ? [] : seleccion} vista={vista} marco={marco} />
          {lineaElegida ? <CapaAsasDeConector escena={escena} linea={lineaElegida} vista={vista} /> : null}
          <CapaPuertos escena={escena} vista={vista} formasElegidas={formasElegidas} todas={herramienta.tipo === "linea" || arrastrandoExtremo} objetivo={objetivoPuerto} />
          <CapaGuias guias={guias} vista={vista} />
          <CapaPrevia previa={previa} vista={vista} />
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
        <BarraConector escena={escena} lineas={lineasConector} onCambiar={cambiarConector} />
        {edicion ? (
          <TextoEnSitio
            area={edicion.area}
            valor={edicion.valor}
            vista={vista}
            onCambio={(valor) => fijarEdicion({ ...edicion, valor })}
            onConfirmar={confirmarEdicion}
            onCancelar={cancelarEdicion}
          />
        ) : null}
      </div>
      <PanelPropiedades escena={escena} seleccion={seleccion} onAplicar={aplicarDelPanel} onVista={vistaDelPanel} onFinVista={finVistaPanel} onSeleccionar={seleccionarDesdeCapas} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-card px-3 py-1 text-[11px] text-muted-foreground">
        <span data-dibujo-estado="">
          {cantidad === 0 ? "Lienzo vacío" : `${cantidad} ${cantidad === 1 ? "elemento" : "elementos"}`}
          {hay ? ` · ${seleccion.length} ${seleccion.length === 1 ? "seleccionado" : "seleccionados"}` : ""}
        </span>
        <span>{ayudaDeHerramienta(herramienta, enCurso)}</span>
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
