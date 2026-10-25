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
  cambiarForma,
  Historial,
  actualizar,
  agregar,
  ajustar as ajustarPunto,
  cajaDeElemento,
  eliminar,
  elementoEn,
  escenaConRutas,
  esquinas,
  conectarFormas,
  fijarPagina,
  fueraDePagina,
  girarPagina,
  type CambioDePagina,
  crearHijo,
  crearHijoEn,
  ajustarAlTexto,
  aplicarFormato,
  cajaDeFragmento,
  DESPLAZAMIENTO_PEGADO,
  elementosEn,
  extraerFormato,
  existeConector,
  pegar,
  normalizarEscena,
  sincronizarConectores,
  trazadoForma,
  type Conexion,
  type Lado,
  type FormatoCopiado,
  type OpcionesPegar,
  type TipoForma,
  type Elemento,
  type EntradaElemento,
  type Cota,
  type Escena,
  type Guia,
  type Punto,
  type PuertoCercano,
} from "@lumina/drawing";
import { NodosSvg } from "../dibujo-render.js";
import { asaEn, bloqueadosEfectivos as bloqueadosEfectivosDe, centroDelMarco, cursorDeAsa, marcoDeSeleccion, posicionesDeAsas, type Marco, type TipoAsa } from "./asas.js";
import { BuscadorComandos } from "./buscador-comandos.js";
import { CintaEditor, PESTANA_CONECTOR, PESTANA_FORMATO, PESTANA_INICIO, type OpcionesOrden } from "./cinta-editor.js";
import { asaAjusteEn, formaConAsasAjuste } from "./asas-ajuste.js";
import { CapaAsasAjuste } from "./asas-ajuste-capa.js";
import { circulosDeAsasHijo, miniBarraVisible } from "./mini-barra.js";
import { datosDeFormato, enfocarMiniBarra, MiniBarra } from "./mini-barra-capa.js";
import { ajusteDeSeleccion, mensajeDeAjuste } from "./ajuste-texto.js";
import { guardarCrecerAlEscribir, leerCrecerAlEscribir } from "./preferencias-texto.js";
import { alternarTexto, alternarVinetas, conLista, hayFormato as hayQueFormatear, hojasDeFormato, hojasEditables, listaDeSeleccion } from "./propiedades.js";
import { aplicarEstiloForma, estiloPorId } from "./estilos-forma.js";
import { ambitoDeTema, aplicarTema } from "./temas-escena.js";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { CapaFantasmaForma } from "./fantasma-forma.js";
import { NOMBRE_MODO, organizarAuto, type ModoOrganizar } from "./organizar-auto.js";

/** Lo organizado o creado no cabe en la página aunque se compacte (Y37b): se hace igual y se avisa. */
const AVISO_FUERA_DE_PAGINA = "Es más grande que la página: parte queda fuera.";
import { escribirEnPortapapeles, leerDePortapapeles, prepararCopia, type Copia, type EscribirDatos, type Lectura } from "./portapapeles.js";
import { PanelAtajos } from "./panel-atajos.js";
import { DialogoEsquema } from "./dialogo-esquema.js";
import { CapaGuiasUsuario, ReglaEje, GROSOR_REGLA } from "./reglas-capa.js";
import { MedidasCapa, type MedidaEnVivo } from "./medidas-capa.js";
import { MenuContextual } from "./menu-contextual.js";
import { agregarGuia, guiaCerca, guiasParaImantar, MAX_GUIAS, moverGuia, quitarGuia, type GuiaUsuario, type OrientacionGuia } from "./reglas.js";
import { esquemaAEscena, type Esquema } from "../esquema-a-escena.js";
import { depurarSeleccion, ejecutarComando, ordenDeTecla, seleccionPorCriterio, padreConectorDe, type Comando, type CriterioSeleccion, type EstadoEditor, type NombreHerramienta, type Orden } from "./comandos.js";
import { comandoDeTecla, contextoDeMenu, type ContextoComando, type ContextoMenu } from "./comandos-registro.js";
import {
  SELECCIONAR,
  TEXTO_NUEVO,
  areaDeTexto,
  cajaArrastrada,
  cajaPorDefecto,
  centroSinTapar,
  conMinimo,
  entradaForma,
  entradaLinea,
  entradaTexto,
  esClic,
  restringirAngulo,
  type AreaDeTexto,
  type Herramienta,
} from "./herramientas.js";
import { BarraEstado } from "./barra-estado.js";
import { CapaAsasDeConector, CapaConexionPrevia, CapaDestino, CapaPuertos } from "./conectores-capa.js";
import { CapaAsasHijo, CapaFantasmaHijo } from "./asas-hijo.js";
import { asaHijoEn, formaConAsasHijo, previaConexionHijo, type ContextoAsasHijo } from "./hijo-rapido.js";
import {
  agarreEn,
  aConexion,
  avanzarConector,
  conectarAlSoltar,
  iniciarConector,
  intencionDeArrastre,
  lineaUnica,
  lineasElegidas,
  formaConPuertosVisibles,
  formaDestinoDeArrastre,
  quitarPuntoIntermedio,
  radioDePuertoPx,
  resolverPuntoDeLinea,
  sinConectoresQueSiguen,
  type GestoConector,
} from "./conectores.js";
import { BotonExportar } from "./exportar-panel.js";
import { PanelPropiedades } from "./propiedades-panel.js";
import { textoFuera } from "./pagina-ajustes.js";
import { ZonaRedimensionable } from "./zona-redimensionable.js";
import { TextoEnSitio } from "./texto-en-sitio.js";
import {
  avanzarGesto,
  iniciarAjuste,
  iniciarMover,
  iniciarLazo,
  iniciarRecuadro,
  iniciarRedimensionar,
  iniciarRotar,
  seleccionAlHacerClic,
  type Gesto,
} from "./gestos.js";
import { ajustarAVentana, desplazar, escenaAPantalla, pantallaAEscena, zoomEn, type Vista } from "./vista.js";

const COLOR_SELECCION = "#2563eb";

/** «N elementos elegidos» (Y15), para el aviso a lectores de pantalla. */
const textoElegidos = (n: number): string => `${n} ${n === 1 ? "elemento elegido" : "elementos elegidos"}.`;
const SIN_ELEGIR: Record<CriterioSeleccion, string> = {
  formas: "No hay formas que elegir.",
  conectores: "No hay conectores que elegir.",
  textos: "No hay textos que elegir.",
  iguales: "Elige una forma para buscar las que son iguales.",
  invertir: "",
  rama: "Elige una sola forma para elegir su rama.",
};
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
  modo: "pan" | "gesto" | "crear" | "conector" | "hijo" | "pincel";
  gesto: Gesto | null;
  /** Solo en modo `hijo`: asa «+» desde la que se arrastra. */
  hijo?: { padreId: string; lado: Lado; base: Escena };
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
  /** Solo al mover formas: la forma por la que se tomó el arrastre (si conecta al soltar, es la «hija»). */
  agarrada?: string;
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

/** Cómo se llama un elemento para el aviso a lectores de pantalla («Rectángulo «Título»»). */
const nombreDe = (escena: Escena, id: string): string => {
  const e = escena.elementos.find((x) => x.id === id);
  return e ? describirElemento(e) : "Elemento";
};

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

export function EditorLibre({ escena: escenaInicial, titulo, onCambio, onCerrar, enfocarAlAbrir = true }: EditorLibreProps): ReactElement {
  const [escena, setEscena] = useState<Escena>(() => sincronizarConectores(normalizarEscena(escenaInicial)));
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [vista, setVista] = useState<Vista>({ zoom: 1, x: 0, y: 0 });
  const [guias, setGuias] = useState<Guia[]>([]);
  const [recuadro, setRecuadro] = useState<{ x: number; y: number; ancho: number; alto: number } | null>(null);
  const [cuadricula, setCuadricula] = useState(false);
  const [imantar, setImantar] = useState(true);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [atajosAbiertos, setAtajosAbiertos] = useState(false);
  const [esquemaAbierto, setEsquemaAbierto] = useState(false);
  /** Reglas y guías (Y16a, DY9): viven en el editor; no van a la escena, al historial ni a la exportación. */
  const [reglas, setReglas] = useState(false);
  // «Crecer al escribir» (Y24b): preferencia del navegador; el ref deja a los manejadores ver siempre el valor de ahora.
  const [crecer, setCrecer] = useState<boolean>(leerCrecerAlEscribir);
  const crecerRef = useRef(crecer);
  crecerRef.current = crecer;
  const [guiasUsuario, setGuiasUsuario] = useState<GuiaUsuario[]>([]);
  /** La guía que se está llevando de vuelta a la regla (se quita al soltar) y la nueva que se arrastra desde una regla. */
  const [guiaQuitando, setGuiaQuitando] = useState<number | null>(null);
  const [guiaPrevia, setGuiaPrevia] = useState<{ orientacion: OrientacionGuia; posicion: number } | null>(null);
  const [medidaVentana, setMedidaVentana] = useState({ ancho: 1000, alto: 600 });
  const arrastreGuia = useRef<{ cancelar: () => void } | null>(null);
  /** El polígono del lazo mientras se dibuja (Y15). */
  const [lazo, setLazo] = useState<Punto[] | null>(null);
  /** Menú contextual (Y17): qué menú se arma y si está abierto (mientras lo está, las teclas son suyas). */
  const [menuEn, setMenuEn] = useState<ContextoMenu>("vacio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  /** Medidas en vivo (Y16b): la etiqueta junto al cursor y las cotas, solo mientras dura el gesto. */
  const [medida, setMedida] = useState<MedidaEnVivo | null>(null);
  const [cotas, setCotas] = useState<Cota[]>([]);
  const [cursor, setCursor] = useState("default");
  const [anuncio, setAnuncio] = useState("");
  const [, setVersionHistorial] = useState(0);
  const [herramienta, setHerramienta] = useState<Herramienta>(SELECCIONAR);
  /** La herramienta de crear queda activa tras crear (Y11): Mayús al elegirla o doble clic en su botón. */
  const [herramientaFija, setHerramientaFija] = useState(false);
  const fijaRef = useRef(false);
  /** Forma que se arrastra desde la galería de la cinta y dónde caería (solo mientras el puntero está sobre el lienzo). */
  const [fantasmaGaleria, setFantasmaGaleria] = useState<{ forma: TipoForma; centro: Punto } | null>(null);
  const galeria = useRef<{ cancelar: () => void } | null>(null);
  /** El pincel (Y12b): `null` = apagado; `fijo` = sigue activo tras aplicar. */
  const [pincel, setPincel] = useState<{ fijo: boolean } | null>(null);
  const pincelRef = useRef<{ fijo: boolean } | null>(null);
  /** El último formato copiado con el pincel: vale para `Ctrl+Alt+V` aunque se haya salido del modo. */
  const formatoRef = useRef<FormatoCopiado | null>(null);
  const [hayFormato, setHayFormato] = useState(false);
  /** Lo último que se copió desde esta página: respaldo si el navegador quita el formato propio, y lo que pega el botón «Pegar». */
  const memoriaCopia = useRef<Copia | null>(null);
  /** Cuántas veces seguidas se pegó lo mismo (cada pegado se desplaza 20 más). */
  const pegadoRef = useRef<{ clave: string; veces: number } | null>(null);
  /** `Ctrl+Mayús+V`: el evento `paste` no trae Mayús, así que se anota al apretar la tecla. */
  const pegarEnSitio = useRef(false);
  /** El evento `copy`/`cut` que pidió un botón llegó y se atendió. */
  const copiaHecha = useRef(false);
  const [enCurso, setEnCurso] = useState<Punto[] | null>(null);
  const [previa, setPrevia] = useState<VistaPrevia | null>(null);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [objetivoPuerto, setObjetivoPuerto] = useState<PuertoCercano | null>(null);
  const [arrastrandoExtremo, setArrastrandoExtremo] = useState(false);
  /** Forma bajo el cursor (herramienta de seleccionar): sus puertos se ven sin tener que elegirla. */
  const [formaHover, setFormaHover] = useState<string | null>(null);
  /** Forma sobre la que va lo que se está arrastrando (otra forma): se resalta entera. */
  const [destinoArrastre, setDestinoArrastre] = useState<string | null>(null);
  /** `conecta` si al soltar ahora se crearía un conector (halo de un puerto o Alt); `solapa` si solo se pasa por encima. */
  const [destinoModo, setDestinoModo] = useState<"conecta" | "solapa">("solapa");
  /** El conector que se crearía al soltar, de puerto a puerto. */
  const [conexionPrevia, setConexionPrevia] = useState<{ desde: Punto; hasta: Punto } | null>(null);
  /** Centro de la forma fantasma al arrastrar un «+» al vacío. */
  const [fantasmaHijo, setFantasmaHijo] = useState<{ padreId: string; centro: Punto } | null>(null);
  /** Oculta las asas «+» mientras hay un gesto de puntero en curso. */
  const [gestoEnCurso, setGestoEnCurso] = useState(false);
  /** `PointerEvent.pointerType` del último puntero: con el dedo, los puertos atraen desde más lejos. */
  const tipoPuntero = useRef<string>("mouse");
  /** Lo mismo como estado, para que los puertos se dibujen más grandes en cuanto el puntero es un dedo. */
  const [tactil, setTactil] = useState(false);
  /** Puerto de cada punto de la línea que se está dibujando (alineado con `enCurso`). */
  const conexionesCurso = useRef<Array<Conexion | undefined>>([]);
  const edicionRef = useRef<Edicion | null>(null);
  /** La barra de estado deja acá su manejador de la posición del cursor: mover el puntero no repinta el editor. */
  const cursorEstado = useRef<((p: Punto | null) => void) | null>(null);

  const historial = useRef(new Historial({ tope: 100 }));
  const ventanaRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const accion = useRef<Accion | null>(null);
  const espacio = useRef(false);
  const ayudaId = useId();

  // Estado «actual» para los manejadores de eventos (evita cierres con valores viejos).
  const guiasActivas = reglas ? guiasUsuario : [];
  const vivo = useRef({ escena, seleccion, vista, cuadricula, imantar, herramienta, enCurso, guias: guiasActivas });
  vivo.current = { escena, seleccion, vista, cuadricula, imantar, herramienta, enCurso, guias: guiasActivas };

  // El panel de propiedades detiene la propagación del teclado; Ctrl+K debe abrir el buscador igual desde sus campos.
  useEffect(() => {
    const abrirBuscador = (e: KeyboardEvent): void => {
      if (e.key !== "k" && e.key !== "K") return;
      if (!e.ctrlKey && !e.metaKey) return;
      const raiz = (e.target as Element | null)?.closest?.("[data-dibujo-editor]");
      if (!raiz) return;
      e.preventDefault();
      e.stopPropagation();
      setAtajosAbiertos(false);
      setBuscadorAbierto(true);
    };
    window.addEventListener("keydown", abrirBuscador, true);
    return () => window.removeEventListener("keydown", abrirBuscador, true);
  }, []);

  // Las líneas en ángulo recto o curvas no van en línea recta entre sus extremos: lo que se ve (cajas, clics) se calcula sobre su recorrido real.
  const escenaRutas = useMemo(() => escenaConRutas(escena), [escena]);
  const lineaElegida = useMemo(() => lineaUnica(escena, seleccion), [escena, seleccion]);
  // Una sola línea elegida muestra las asas del conector (extremos y puntos intermedios), no las del marco: coincidirían en las puntas.
  const marco = useMemo(() => (lineaElegida ? null : marcoDeSeleccion(escenaRutas, seleccion)), [escenaRutas, seleccion, lineaElegida]);
  // La barra de estado informa también de una línea sola (el marco de las asas no la cuenta).
  const marcoEstado = useMemo(() => marcoDeSeleccion(escenaRutas, seleccion), [escenaRutas, seleccion]);

  // ─── Mini barra flotante (Y18) ──────────────────────────────────────────────
  // Se ve junto a la selección y se esconde mientras haya un gesto (`gestoEnCurso` cubre mover, redimensionar, girar, recuadro, lazo, conector y asas «+»; las guías y la galería tienen su propio estado), una edición de texto, el pincel, otra herramienta, el menú o un diálogo.
  const miniBarraRef = useRef<HTMLDivElement | null>(null);
  const datosBarra = useMemo(() => datosDeFormato(escena, seleccion), [escena, seleccion]);
  const miniBarraDatos =
    datosBarra && marcoEstado
      ? miniBarraVisible(true, {
          gestoEnCurso: gestoEnCurso || guiaPrevia !== null || fantasmaGaleria !== null,
          edicionDeTexto: edicion !== null,
          pincel: pincel !== null,
          otraHerramienta: herramienta.tipo !== "seleccionar",
          menuContextual: menuAbierto,
          dialogo: buscadorAbierto || atajosAbiertos || esquemaAbierto,
        })
        ? datosBarra
        : null
      : null;

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

  /** Descarta la vista previa a medias (Escape en el selector de color): la escena vuelve a como estaba y no entra nada al historial. */
  const cancelarVistaPanel = useCallback((): void => {
    const v = vistaPanel.current;
    if (!v) return;
    vistaPanel.current = null;
    historial.current.terminarGesto(v.base);
    setEscena(v.base);
    setVersionHistorial((n) => n + 1);
  }, []);

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

  const abrirEdicionEn = useCallback((id: string, escenaBase: Escena): void => {
    const el = escenaBase.elementos.find((x) => x.id === id);
    if (!el || bloqueadosEfectivosDe(escenaBase).has(id)) return;
    const area = areaDeTexto(escenaBase, el);
    if (!area) return;
    setSeleccion([id]);
    const ed: Edicion = { id, area, valor: area.texto };
    edicionRef.current = ed;
    setEdicion(ed);
  }, []);

  const ejecutar = useCallback(
    (c: Comando): boolean => {
      finVistaPanel();
      const { escena: actual, seleccion: sel } = vivo.current;
      if (c.tipo === "crear-hermano" && sel.length === 1 && !padreConectorDe(actual, sel[0]!)) {
        setAnuncio("No se puede agregar hermano: la forma no tiene padre.");
        return false;
      }
      // Al alinear o distribuir, los conectores siguen a sus formas en vez de moverse solos (se despegarían).
      const alinea = c.tipo === "alinear" || c.tipo === "distribuir";
      const resultado = ejecutarComando({ escena: actual, seleccion: alinea ? sinConectoresQueSiguen(actual, sel) : sel }, c);
      const r = resultado && alinea ? { ...resultado, seleccion: sel } : resultado;
      if (!r) return false;
      const abrirTexto = c.tipo === "crear-hijo" || c.tipo === "crear-hermano";
      if (r.escena === actual) {
        setSeleccion(r.seleccion);
        setAnuncio(describirSeleccion(actual, r.seleccion));
      } else {
        confirmar(actual, r);
        if (abrirTexto && r.seleccion[0]) abrirEdicionEn(r.seleccion[0], r.escena);
      }
      return true;
    },
    [abrirEdicionEn, confirmar, finVistaPanel],
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

  /**
   * Ajustes de página (Y25): una entrada de historial por cambio. Si cambia el tamaño, la vista se ajusta para mostrar la página nueva;
   * si queda algo fuera o cortado, el anuncio lo dice. Cambiar solo el fondo no mueve la vista.
   */
  const aplicarPagina = useCallback(
    (cambio: CambioDePagina): void => {
      finVistaPanel();
      const { escena: actual, seleccion: sel } = vivo.current;
      const nueva = fijarPagina(actual, cambio);
      if (nueva === actual) return;
      confirmar(actual, { escena: nueva, seleccion: sel });
      const cambioTamano = nueva.ancho !== actual.ancho || nueva.alto !== actual.alto;
      const fuera = cambioTamano ? fueraDePagina(nueva).length : 0;
      if (cambioTamano) {
        setVista(ajustarAVentana(nueva, medir()));
        setAnuncio(`Página de ${nueva.ancho} × ${nueva.alto}.${fuera > 0 ? ` ${textoFuera(fuera)}.` : ""}`);
      } else {
        setAnuncio(nueva.fondo === null ? "Fondo transparente." : "Fondo cambiado.");
      }
    },
    [confirmar, finVistaPanel, medir],
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

  const fijarPincel = useCallback((p: { fijo: boolean } | null): void => {
    pincelRef.current = p;
    setPincel(p);
  }, []);

  const elegirHerramienta = useCallback((h: Herramienta, fija = false): void => {
    if (pincelRef.current) fijarPincel(null); // elegir una herramienta saca del pincel
    const sera = fija && h.tipo !== "seleccionar";
    fijaRef.current = sera;
    setHerramientaFija(sera);
    setHerramienta(h);
    fijarCurso(null);
    fijarObjetivo(null);
    setPrevia(null);
    if (sera) {
      setAnuncio(`Herramienta fija: ${h.tipo === "forma" ? FORMAS[h.forma].nombre : h.tipo === "linea" ? (h.flecha ? "flecha" : "línea") : "texto"}. Escape o elige otra herramienta para salir.`);
      svgRef.current?.focus();
      return;
    }
    setAnuncio(h.tipo === "seleccionar" ? "Herramienta: seleccionar." : h.tipo === "forma" ? `Herramienta: ${FORMAS[h.forma].nombre}. Haz clic o arrastra en el lienzo.` : h.tipo === "linea" ? `Herramienta: ${h.flecha ? "flecha" : "línea"}. Arrastra, o haz clic en cada punto y doble clic para terminar.` : "Herramienta: texto. Haz clic o arrastra en el lienzo.");
    svgRef.current?.focus();
  }, [fijarCurso, fijarObjetivo, fijarPincel]);

  const elegirPorNombre = useCallback(
    (nombre: NombreHerramienta, fija = false): void => elegirHerramienta(nombre === "seleccionar" ? SELECCIONAR : nombre === "texto" ? { tipo: "texto" } : { tipo: "linea", flecha: nombre === "flecha" }, fija),
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
      // Un solo uso: tras crear vuelve a Seleccionar, salvo que la herramienta esté fija.
      if (!fijaRef.current) setHerramienta(SELECCIONAR);
    },
    [confirmar],
  );

  /** Punto de la escena con el imán de las guías y de la cuadrícula (Ctrl lo suspende). */
  const imantarPunto = (p: Punto, ctrl: boolean, excluir?: readonly string[]): Punto => {
    const { escena: actual, vista: v, cuadricula: grilla, imantar: iman, guias: deUsuario } = vivo.current;
    if (ctrl || (!iman && !grilla && deUsuario.length === 0)) return p;
    return ajustarPunto(p, actual, {
      guias: iman,
      umbral: 6 / v.zoom,
      ...(excluir ? { excluir } : {}),
      ...(grilla ? { cuadricula: LADO_CUADRICULA } : {}),
      ...(deUsuario.length > 0 ? { guiasUsuario: guiasParaImantar(deUsuario) } : {}),
    }).punto;
  };

  /** Las guías de la persona para el imán de un gesto (vacío si las reglas están ocultas). */
  const opcionesGuiasUsuario = (): { guiasUsuario?: ReturnType<typeof guiasParaImantar> } => (vivo.current.guias.length > 0 ? { guiasUsuario: guiasParaImantar(vivo.current.guias) } : {});

  /**
   * Arrastrar una guía: nueva (`id === null`, desde una regla) o existente (desde su marcador o desde el lienzo). Una guía nueva
   * solo se crea si se suelta sobre el lienzo; una existente se quita llevándola de vuelta hacia su regla. Escape cancela.
   */
  const iniciarArrastreGuia = (orientacion: OrientacionGuia, id: number | null, e: { button: number }): void => {
    if (e.button !== 0) return;
    arrastreGuia.current?.cancelar();
    const original = id === null ? null : (vivo.current.guias.find((g) => g.id === id)?.posicion ?? null);
    const medir = (ev: { clientX: number; clientY: number }): { dentro: boolean; haciaRegla: boolean; posicion: number } | null => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return null;
      const p = pantallaAEscena(vivo.current.vista, { x: ev.clientX - r.left, y: ev.clientY - r.top });
      const dentro = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      return { dentro, haciaRegla: orientacion === "vertical" ? ev.clientX < r.left : ev.clientY < r.top, posicion: orientacion === "vertical" ? p.x : p.y };
    };
    const limpiar = (): void => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
      window.removeEventListener("keydown", tecla, true);
      setGuiaQuitando(null);
      setGuiaPrevia(null);
      arrastreGuia.current = null;
    };
    const cancelar = (): void => {
      if (id !== null && original !== null) setGuiasUsuario((g) => moverGuia(g, id, original));
      limpiar();
    };
    const mover = (ev: PointerEvent): void => {
      const m = medir(ev);
      if (!m) return;
      if (id === null) {
        setGuiaPrevia(m.dentro ? { orientacion, posicion: Math.round(m.posicion) } : null);
        return;
      }
      setGuiaQuitando(m.haciaRegla ? id : null);
      if (m.dentro) setGuiasUsuario((g) => moverGuia(g, id, m.posicion));
    };
    const soltar = (ev: PointerEvent): void => {
      const m = medir(ev);
      limpiar();
      if (!m) return;
      if (id === null) {
        if (!m.dentro) return;
        const nuevas = agregarGuia(vivo.current.guias, orientacion, m.posicion);
        if (!nuevas) setAnuncio(`Ya hay ${MAX_GUIAS} guías: quita alguna para poner otra.`);
        else {
          setGuiasUsuario(nuevas);
          setAnuncio(`Guía ${orientacion === "vertical" ? "vertical" : "horizontal"} en ${Math.round(m.posicion)}.`);
        }
        return;
      }
      if (m.haciaRegla) {
        setGuiasUsuario((g) => quitarGuia(g, id));
        setAnuncio("Guía quitada.");
      } else if (m.dentro) setGuiasUsuario((g) => moverGuia(g, id, m.posicion));
    };
    const tecla = (ev: globalThis.KeyboardEvent): void => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation(); // el Escape cancela el arrastre de la guía y nada más (no cierra el editor)
      cancelar();
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
    window.addEventListener("keydown", tecla, true);
    arrastreGuia.current = { cancelar };
  };
  useEffect(() => () => arrastreGuia.current?.cancelar(), []);

  // El tamaño de la ventana: hasta dónde llegan las marcas de las reglas y dónde cabe la mini barra (Y18).
  useEffect(() => {
    const actualizar = (): void => setMedidaVentana(medir());
    actualizar();
    window.addEventListener("resize", actualizar);
    const observador = typeof ResizeObserver !== "undefined" ? new ResizeObserver(actualizar) : null;
    if (ventanaRef.current) observador?.observe(ventanaRef.current);
    return () => {
      window.removeEventListener("resize", actualizar);
      observador?.disconnect();
    };
  }, [medir]);

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
      radioPx: radioDePuertoPx(tipoPuntero.current),
      ...(shift && desde ? { restringir: (p: Punto) => restringirAngulo(desde, p) } : {}),
    });
  };

  // ─── Pincel: copiar formato (Y12b) ──────────────────────────────────────────
  /** Aplica el formato guardado: UNA entrada de historial aunque sean varios elementos. Los bloqueados se saltan y se avisa. */
  const aplicarFormatoA = (ids: readonly string[], desdeElModo: boolean): void => {
    const f = formatoRef.current;
    if (!f) return;
    const { escena: actual } = vivo.current;
    const r = aplicarFormato(actual, ids, f);
    const n = r.aplicados.length;
    const saltados = r.omitidos.length;
    if (r.escena === actual) {
      setAnuncio(n === 0 ? (saltados > 0 ? "No se aplicó el formato: lo señalado está bloqueado." : "No hay nada que formatear ahí.") : "Ya tenía ese formato.");
    } else {
      confirmar(actual, { escena: r.escena, seleccion: [...ids] });
      setAnuncio(`Formato aplicado a ${n === 1 ? "1 elemento" : `${n} elementos`}${saltados > 0 ? `; se saltó ${saltados === 1 ? "1 bloqueado" : `${saltados} bloqueados`}` : ""}.`);
    }
    if (desdeElModo && pincelRef.current?.fijo !== true) fijarPincel(null);
  };

  /**
   * «Copiar formato»: toma el formato de lo elegido y deja el pincel listo. Un clic con el pincel ya en uso lo suelta (como
   * en Office); con Mayús o con doble clic en el botón (`fijo`) queda fijo hasta salir.
   */
  const iniciarPincel = (fijo: boolean): void => {
    const { escena: actual, seleccion: sel } = vivo.current;
    if (pincelRef.current && !fijo) {
      fijarPincel(null);
      setCursor("default");
      setAnuncio("Pincel cancelado.");
      return;
    }
    const f = sel[0] ? extraerFormato(actual, sel[0]) : null;
    if (!f) {
      setAnuncio("Elige un elemento para copiarle el formato.");
      return;
    }
    formatoRef.current = f;
    setHayFormato(true);
    if (vivo.current.herramienta.tipo !== "seleccionar") elegirHerramienta(SELECCIONAR);
    fijarPincel({ fijo });
    setAnuncio(fijo ? "Pincel fijo: señala los elementos que quieras formatear. Escape lo suelta." : "Pincel: señala un elemento, o arrastra un recuadro, para darle ese formato. Escape lo cancela.");
    svgRef.current?.focus();
  };

  // ─── Portapapeles (Y12a, DY7) ───────────────────────────────────────────────
  const esCampoDeTexto = (objetivo: EventTarget | null): boolean => {
    const t = objetivo as HTMLElement | null;
    return t !== null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable === true);
  };

  /** Copia lo elegido. Con `datos` (el `clipboardData` de un evento) lo escribe en el portapapeles del sistema. */
  const copiarSeleccion = (datos: EscribirDatos | null): boolean => {
    const { escena: actual, seleccion: sel } = vivo.current;
    if (sel.length === 0) {
      setAnuncio("No hay nada elegido para copiar.");
      return false;
    }
    const r = prepararCopia(actual, sel);
    if (!r.ok) {
      setAnuncio(r.motivo);
      return false;
    }
    memoriaCopia.current = r.copia;
    pegadoRef.current = null;
    if (datos) escribirEnPortapapeles(datos, r.copia);
    copiaHecha.current = true;
    const n = r.copia.fragmento.elementos.filter((x) => x.tipo !== "grupo").length;
    setAnuncio(n === 1 ? "1 elemento copiado." : `${n} elementos copiados.`);
    return true;
  };

  /** Copia y quita lo elegido (lo bloqueado se queda, como con Eliminar): UNA entrada de historial. */
  const cortarSeleccion = (datos: EscribirDatos | null): void => {
    if (!copiarSeleccion(datos)) return;
    // `ejecutar` devuelve `false` si no se quitó nada (todo lo elegido está bloqueado).
    const hecho = ejecutar({ tipo: "eliminar" });
    const n = (memoriaCopia.current?.fragmento.elementos ?? []).filter((x) => x.tipo !== "grupo").length;
    setAnuncio(hecho ? (n === 1 ? "1 elemento cortado." : `${n} elementos cortados.`) : "Copiado; lo bloqueado no se corta.");
  };

  /** Pega lo leído: un fragmento (formas, estilo, conectores) o texto plano como cuadro de texto (DY8). */
  const aplicarLectura = (lectura: Lectura, enSitio: boolean): void => {
    if (lectura.tipo === "vacio") {
      setAnuncio("No hay nada que pegar.");
      return;
    }
    if (lectura.tipo === "error") {
      setAnuncio(lectura.motivo);
      return;
    }
    const { escena: actual, vista: v } = vivo.current;
    const previo = pegadoRef.current;
    const veces = !enSitio && previo?.clave === lectura.clave ? previo.veces : 0;
    const m = medir();
    const arriba = pantallaAEscena(v, { x: 0, y: 0 });
    const abajo = pantallaAEscena(v, { x: m.ancho, y: m.alto });
    const centroVista = pantallaAEscena(v, { x: m.ancho / 2, y: m.alto / 2 });
    const centro = { x: centroVista.x + DESPLAZAMIENTO_PEGADO * veces, y: centroVista.y + DESPLAZAMIENTO_PEGADO * veces };
    if (lectura.tipo === "texto") {
      const alto = Math.max(TEXTO_NUEVO.alto, lectura.texto.split("\n").length * 26);
      crearElemento(entradaTexto({ x: centro.x - TEXTO_NUEVO.ancho / 2, y: centro.y - alto / 2, ancho: TEXTO_NUEVO.ancho, alto }, lectura.texto));
      pegadoRef.current = { clave: lectura.clave, veces: veces + 1 };
      setAnuncio("Texto pegado en un cuadro de texto.");
      return;
    }
    let opciones: OpcionesPegar = {};
    if (!enSitio) {
      const caja = cajaDeFragmento(lectura.fragmento);
      const d = DESPLAZAMIENTO_PEGADO * (veces + 1);
      // Si el original sigue a la vista, la copia va un poco desplazada; si no, al centro de lo que se ve.
      const cabe = caja !== null && caja.x + d >= arriba.x && caja.y + d >= arriba.y && caja.x + caja.ancho + d <= abajo.x && caja.y + caja.alto + d <= abajo.y;
      opciones = cabe ? { desplazamiento: { x: d, y: d } } : { centro };
    }
    const r = pegar(actual, lectura.fragmento, opciones);
    if (r.motivo) {
      setAnuncio(r.motivo === "demasiados" ? "El dibujo ya tiene demasiados elementos para pegar más." : "No hay nada que pegar.");
      return;
    }
    confirmar(actual, { escena: r.escena, seleccion: r.ids });
    const n = r.ids.length;
    setAnuncio(n === 1 ? "1 elemento pegado." : `${n} elementos pegados.`);
    if (!enSitio) pegadoRef.current = { clave: lectura.clave, veces: veces + 1 };
  };

  /** Un botón de la cinta: pide al navegador el evento `copy`/`cut` y, si no lo da, copia dentro del editor. */
  const copiarOCortarDeBoton = (tipo: "copy" | "cut"): void => {
    copiaHecha.current = false;
    try {
      if (typeof document.execCommand === "function") document.execCommand(tipo);
    } catch {
      // sin permiso o sin soporte: se copia dentro del editor
    }
    if (!copiaHecha.current) {
      if (tipo === "cut") cortarSeleccion(null);
      else copiarSeleccion(null);
    }
    svgRef.current?.focus();
  };

  /** El botón «Pegar»: un botón no puede leer el portapapeles del sistema sin permiso, así que pega la última copia hecha aquí. */
  const pegarDeBoton = (enSitio: boolean): void => {
    const m = memoriaCopia.current;
    if (!m) {
      setAnuncio("Para pegar usa Ctrl+V: el navegador no deja leer el portapapeles desde un botón.");
      return;
    }
    aplicarLectura({ tipo: "fragmento", fragmento: m.fragmento, clave: m.json }, enSitio);
    svgRef.current?.focus();
  };

  // ─── Texto en el sitio ──────────────────────────────────────────────────────
  const fijarEdicion = useCallback((e: Edicion | null): void => {
    edicionRef.current = e;
    setEdicion(e);
  }, []);

  const abrirEdicion = (id: string): void => {
    abrirEdicionEn(id, vivo.current.escena);
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
      const conTexto = actualizar(actual, [ed.id], { texto: ed.valor });
      // Con «crecer al escribir», la forma crece lo justo en la misma entrada de historial que el texto (Deshacer devuelve las dos cosas).
      const ajuste = crecerRef.current ? ajustarAlTexto(conTexto, [ed.id], { soloCrecer: true }) : null;
      const nueva = ajuste ? ajuste.escena : conTexto;
      if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: [ed.id] });
      if (ajuste && ajuste.cambios.length > 0) setAnuncio(mensajeDeAjuste(ajuste.cambios));
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
    tipoPuntero.current = e.pointerType || "mouse";
    setTactil(tipoPuntero.current === "touch");
    setFormaHover(null);
    const pantalla = aPantalla(e);
    if (e.button === 1 || (e.button === 0 && espacio.current)) {
      accion.current = { modo: "pan", gesto: null, activo: true, origen: pantalla, ultimo: pantalla, shift: false };
      capturar(e);
      setCursor("grabbing");
      return;
    }
    if (e.button !== 0) return;
    const { escena: actual, seleccion: sel, vista: v, herramienta: h } = vivo.current;
    if (pincelRef.current) {
      // Con el pincel: un clic en un elemento le da el formato; un arrastre desde el vacío dibuja un recuadro y se lo da a lo que abarque.
      const crudo = pantallaAEscena(v, pantalla);
      const bajo = elementoEn(escenaConRutas(actual), crudo, { tolerancia: 6 / v.zoom });
      accion.current = { modo: "pincel", gesto: null, activo: false, origen: pantalla, ultimo: pantalla, inicioEscena: crudo, shift: false, ...(bajo !== undefined ? { hit: bajo } : {}) };
      capturar(e);
      return;
    }
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
    // Una guía se agarra en el lienzo solo si no hay ningún elemento debajo: los elementos mandan (el hit-test no cambia).
    const guiaBajo = guiaCerca(vivo.current.guias, p, 5 / v.zoom);
    if (guiaBajo && elementoEn(escenaConRutas(actual), p, { tolerancia: 6 / v.zoom, entrarEnGrupos: true }) === undefined) {
      iniciarArrastreGuia(guiaBajo.orientacion, guiaBajo.id, e);
      return;
    }
    // Un asa amarilla de ajuste (Y20) gana sobre mover la forma y sobre las asas de redimensionar y de girar.
    const formaAj = formaConAsasAjuste({ escena: actual, herramienta: h, seleccion: sel, gestoEnCurso: false, edicionAbierta: edicionRef.current !== null, menuAbierto, pincel: false });
    const asaAj = formaAj ? asaAjusteEn(formaAj, p, v, tipoPuntero.current === "touch") : null;
    if (formaAj && asaAj) {
      const ajuste = iniciarAjuste(actual, formaAj.id, asaAj.clave);
      if (ajuste) {
        setGestoEnCurso(true);
        accion.current = { modo: "gesto", gesto: ajuste, activo: false, origen: pantalla, ultimo: pantalla, shift: e.shiftKey };
        capturar(e);
        return;
      }
    }
    const ctxAsasHijo: ContextoAsasHijo = { escena: actual, herramienta: h, seleccion: sel, gestoEnCurso: false, edicionAbierta: edicionRef.current !== null };
    const padreAsas = formaConAsasHijo(ctxAsasHijo);
    const ladoHijo = padreAsas ? asaHijoEn(actual, padreAsas, p, v.zoom, tipoPuntero.current === "touch") : null;
    if (padreAsas && ladoHijo) {
      setGestoEnCurso(true);
      accion.current = { modo: "hijo", gesto: null, hijo: { padreId: padreAsas, lado: ladoHijo, base: actual }, activo: false, origen: pantalla, ultimo: pantalla, shift: e.shiftKey };
      capturar(e);
      return;
    }
    // Una línea elegida: sus extremos y puntos intermedios se agarran antes que las asas de tamaño.
    const lineaSel = lineaUnica(actual, sel);
    const agarre = lineaSel ? agarreEn(actual, lineaSel, p, v.zoom) : null;
    if (lineaSel && agarre) {
      setGestoEnCurso(true);
      accion.current = { modo: "conector", gesto: null, conector: iniciarConector(actual, lineaSel.id, agarre), activo: false, origen: pantalla, ultimo: pantalla, shift: e.shiftKey };
      capturar(e);
      return;
    }
    const rutas = escenaConRutas(actual);
    const actualMarco = lineaSel ? null : marcoDeSeleccion(rutas, sel);
    const asa = actualMarco ? asaEn(actualMarco, p, v.zoom) : null;
    let gesto: Gesto | null = null;
    let hit: string | undefined;
    // La forma que se toma (aunque esté dentro de un grupo): si el arrastre acaba sobre otra forma, esta es la que se conecta.
    const agarrada = elementoEn(rutas, p, { tolerancia: 6 / v.zoom, entrarEnGrupos: true });
    if (asa) {
      gesto = asa === "rotar" ? iniciarRotar(actual, sel, p) : iniciarRedimensionar(actual, sel, asa, p);
    } else {
      const bajo = elementoEn(rutas, p, { tolerancia: 6 / v.zoom });
      const nueva = seleccionAlHacerClic(rutas, sel, p, e.shiftKey, v.zoom);
      if (bajo === undefined && e.altKey) {
        // Alt en un vacío: lazo (Y15). Alt al arrastrar una FORMA es conectar (Y7): ese caso entra por la rama de abajo.
        gesto = iniciarLazo(actual, p, e.shiftKey, sel);
      } else if (bajo === undefined) {
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
    if (gesto) setGestoEnCurso(true);
    accion.current = { modo: "gesto", gesto, activo: false, origen: pantalla, ultimo: pantalla, ...(hit !== undefined ? { hit } : {}), ...(agarrada !== undefined ? { agarrada } : {}), shift: e.shiftKey };
    capturar(e);
  };

  const alMover = (e: PunteroReact<SVGSVGElement>): void => {
    const a = accion.current;
    const pantalla = aPantalla(e);
    cursorEstado.current?.(pantallaAEscena(vivo.current.vista, pantalla));
    if (e.pointerType) {
      tipoPuntero.current = e.pointerType;
      setTactil(e.pointerType === "touch");
    }
    if (!a) {
      // Sin arrastre: cambia el cursor según la herramienta y lo que haya debajo; una línea a medio hacer sigue al cursor.
      const { escena: actual, seleccion: sel, vista: v, herramienta: h, enCurso: curso } = vivo.current;
      if (pincelRef.current) {
        setFormaHover(null);
        setCursor(espacio.current ? "grab" : "copy");
        return;
      }
      if (h.tipo !== "seleccionar") {
        setFormaHover(null);
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
      // Con el cursor sobre una forma se ven sus puertos (con histéresis para poder llegar a uno sin que se apaguen).
      setFormaHover((previa) => formaConPuertosVisibles(actual, puntoEscena, v.zoom, previa, radioDePuertoPx(tipoPuntero.current)));
      const lineaSel = lineaUnica(actual, sel);
      const sobreAgarre = lineaSel ? agarreEn(actual, lineaSel, puntoEscena, v.zoom) : null;
      const m = lineaSel ? null : marcoDeSeleccion(escenaConRutas(actual), sel);
      const asa: TipoAsa | null = m ? asaEn(m, puntoEscena, v.zoom) : null;
      const formaAj = formaConAsasAjuste({ escena: actual, herramienta: h, seleccion: sel, gestoEnCurso: false, edicionAbierta: edicionRef.current !== null, menuAbierto, pincel: false });
      const sobreAjuste = formaAj ? asaAjusteEn(formaAj, puntoEscena, v, tipoPuntero.current === "touch") !== null : false;
      const guiaSobre = asa || sobreAgarre || sobreAjuste ? null : guiaCerca(vivo.current.guias, puntoEscena, 5 / v.zoom);
      setCursor(espacio.current ? "grab" : sobreAgarre || sobreAjuste ? "pointer" : asa && m ? cursorDeAsa(asa, m.rotacion) : guiaSobre ? (guiaSobre.orientacion === "vertical" ? "col-resize" : "row-resize") : "default");
      return;
    }
    if (a.modo === "pan") {
      setVista((v) => desplazar(v, pantalla.x - a.ultimo.x, pantalla.y - a.ultimo.y));
      a.ultimo = pantalla;
      return;
    }
    if (a.modo === "pincel") {
      if (!a.activo) {
        if (Math.hypot(pantalla.x - a.origen.x, pantalla.y - a.origen.y) < UMBRAL_ARRASTRE_PX) return;
        a.activo = true;
      }
      if (a.hit === undefined) setRecuadro(cajaArrastrada(a.inicioEscena as Punto, pantallaAEscena(vivo.current.vista, pantalla)));
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
    if (a.modo === "hijo" && a.hijo) {
      if (!a.activo) {
        if (Math.hypot(pantalla.x - a.origen.x, pantalla.y - a.origen.y) < UMBRAL_ARRASTRE_PX) return;
        a.activo = true;
      }
      const { escena: actual, vista: v } = vivo.current;
      const punto = pantallaAEscena(v, pantalla);
      const dest = formaDestinoDeArrastre(actual, punto, v.zoom, [a.hijo.padreId]);
      if (dest && dest !== a.hijo.padreId) {
        setFantasmaHijo(null);
        setDestinoArrastre(dest);
        setDestinoModo("conecta");
        setConexionPrevia(previaConexionHijo(actual, a.hijo.padreId, dest, null));
      } else {
        setDestinoArrastre(null);
        setFantasmaHijo({ padreId: a.hijo.padreId, centro: punto });
        setConexionPrevia(previaConexionHijo(actual, a.hijo.padreId, null, punto));
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
      const r = avanzarConector(a.conector, { puntero: crudo, imantado: imantarPunto(crudo, e.ctrlKey || e.metaKey, [a.conector.id]), zoom: v.zoom, sinImanDePuertos: e.ctrlKey || e.metaKey, radioPx: radioDePuertoPx(tipoPuntero.current) });
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
      { guias: iman, zoom: v.zoom, ...(grilla ? { cuadricula: LADO_CUADRICULA } : {}), ...opcionesGuiasUsuario() },
    );
    setEscena(sincronizarConectores(r.escena));
    setGuias(r.guias);
    setRecuadro(r.recuadro ?? null);
    setLazo(r.lazo ?? null);
    setCotas(r.cotas ?? []);
    setMedida(r.etiqueta ? { texto: r.etiqueta, x: pantalla.x, y: pantalla.y } : null);
    if (r.seleccion) setSeleccion(r.seleccion);
    // Al mover formas se resalta entera la que hay debajo del puntero (sin contar lo que se mueve) y, si al soltar
    // se conectaría (halo de un puerto o Alt), se ve el conector que se crearía. Si no, soltar solo mueve.
    if (a.gesto.tipo === "mover") {
      const i = intencionDeArrastre(sincronizarConectores(r.escena), pantallaAEscena(v, pantalla), v.zoom, a.gesto.ids, a.agarrada, e.altKey, radioDePuertoPx(tipoPuntero.current));
      setDestinoArrastre(i.destino);
      setDestinoModo(i.conecta ? "conecta" : "solapa");
      setConexionPrevia(i.previa);
    } else {
      setDestinoArrastre(null);
      setConexionPrevia(null);
    }
  };

  const alSoltar = (e: PunteroReact<SVGSVGElement>): void => {
    const a = accion.current;
    accion.current = null;
    setGestoEnCurso(false);
    liberar(e);
    setDestinoArrastre(null);
    setConexionPrevia(null);
    setFantasmaHijo(null);
    setGuias([]);
    setRecuadro(null);
    setLazo(null);
    setMedida(null);
    setCotas([]);
    const base = vivo.current.herramienta.tipo === "seleccionar" ? "default" : vivo.current.herramienta.tipo === "texto" ? "text" : "crosshair";
    setCursor(espacio.current ? "grab" : base);
    if (!a || a.modo === "pan") return;
    if (a.modo === "pincel") {
      const { escena: actual, vista: v } = vivo.current;
      if (!a.activo) {
        if (a.hit !== undefined) aplicarFormatoA([a.hit], true);
        return;
      }
      if (a.hit !== undefined) return; // se arrastró desde un elemento: no es un recuadro ni un clic
      const caja = cajaArrastrada(a.inicioEscena as Punto, pantallaAEscena(v, aPantalla(e)));
      const ids = elementosEn(actual, caja);
      if (ids.length === 0) setAnuncio("El recuadro no abarca nada.");
      else aplicarFormatoA(ids, true);
      return;
    }
    if (a.modo === "hijo" && a.hijo) {
      const { vista: v } = vivo.current;
      const puntoSuelta = pantallaAEscena(v, aPantalla(e));
      const antes = a.hijo.base;
      if (!a.activo) {
        const r = crearHijo(antes, a.hijo.padreId, a.hijo.lado);
        if (r.id === "") return;
        confirmar(antes, { escena: r.escena, seleccion: [r.id] });
        setAnuncio(`${nombreDe(r.escena, r.id)} agregado y conectado a ${nombreDe(r.escena, a.hijo.padreId)}.`);
        abrirEdicionEn(r.id, r.escena);
        return;
      }
      const dest = formaDestinoDeArrastre(antes, puntoSuelta, v.zoom, [a.hijo.padreId]);
      if (dest && dest !== a.hijo.padreId) {
        if (existeConector(antes, a.hijo.padreId, dest)) {
          setAnuncio(`Ya hay un conector de ${nombreDe(antes, a.hijo.padreId)} a ${nombreDe(antes, dest)}.`);
          return;
        }
        const nueva = conectarFormas(antes, a.hijo.padreId, dest);
        if (nueva === antes) return; // sin puertos que unir: no hay nada que confirmar ni que anunciar
        confirmar(antes, { escena: nueva, seleccion: [dest] });
        setAnuncio(`${nombreDe(nueva, dest)} conectada a ${nombreDe(nueva, a.hijo.padreId)}.`);
        return;
      }
      const r = crearHijoEn(antes, a.hijo.padreId, puntoSuelta);
      if (r.id === "") return;
      confirmar(antes, { escena: r.escena, seleccion: [r.id] });
      setAnuncio(`${nombreDe(r.escena, r.id)} agregado y conectado a ${nombreDe(r.escena, a.hijo.padreId)}.`);
      abrirEdicionEn(r.id, r.escena);
      return;
    }
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
    if (a.gesto?.tipo === "lazo") {
      // Elegir no es una entrada de historial (DY9): se cierra el gesto sin registrar nada. La selección se recalcula
      // hasta el punto exacto en que se suelta (la de `vivo` puede ir un movimiento por detrás).
      const { vista: v } = vivo.current;
      const r = avanzarGesto(a.gesto, pantallaAEscena(v, aPantalla(e)), { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey }, { guias: false, zoom: v.zoom });
      historial.current.cancelarGesto();
      const ids = r.seleccion ?? [];
      setSeleccion(ids);
      setAnuncio(a.gesto.puntos.length < 3 ? "El lazo es muy corto: no se cambió la selección." : ids.length === 0 ? "El lazo no abarca nada." : textoElegidos(ids.length));
      return;
    }
    let final = vivo.current.escena;
    let anuncioFinal: string | null = null;
    // Soltar una forma sobre el halo de un puerto de otra (o con Alt) las conecta: el movimiento y el conector son UNA entrada de historial.
    if (a.gesto?.tipo === "mover") {
      const { vista: v, cuadricula: grilla, imantar: iman } = vivo.current;
      const puntoSuelta = pantallaAEscena(v, aPantalla(e));
      // La escena de `vivo` es la de la última pintura de React, que con el ratón rápido puede ir un movimiento por detrás:
      // se recalcula el arrastre hasta el punto exacto en que se suelta, y de ahí salen la posición final y los puertos.
      final = sincronizarConectores(
        avanzarGesto(a.gesto, puntoSuelta, { shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey }, { guias: iman, zoom: v.zoom, ...(grilla ? { cuadricula: LADO_CUADRICULA } : {}), ...opcionesGuiasUsuario() }).escena,
      );
      setEscena(final);
      const i = intencionDeArrastre(final, puntoSuelta, v.zoom, a.gesto.ids, a.agarrada, e.altKey, radioDePuertoPx(tipoPuntero.current));
      if (i.conecta && i.destino !== null && a.agarrada !== undefined) {
        const conectada = conectarAlSoltar(final, i.destino, a.agarrada);
        if (conectada !== final) {
          final = conectada;
          setEscena(final);
          anuncioFinal = `${nombreDe(final, a.agarrada)} conectada a ${nombreDe(final, i.destino)}.`;
        }
      }
    }
    const registrado = historial.current.terminarGesto(final);
    setVersionHistorial((n) => n + 1);
    if (registrado) {
      setAnuncio(anuncioFinal ?? describirSeleccion(final, vivo.current.seleccion));
      onCambio(final);
    }
  };

  const alCancelarPuntero = (): void => {
    const a = accion.current;
    accion.current = null;
    setGestoEnCurso(false);
    setDestinoArrastre(null);
    setConexionPrevia(null);
    setFantasmaHijo(null);
    setGuias([]);
    setRecuadro(null);
    setLazo(null);
    setMedida(null);
    setCotas([]);
    setPrevia(null);
    fijarObjetivo(null);
    setArrastrandoExtremo(false);
    if (a?.gesto?.tipo === "lazo" && a.activo) {
      // Escape (o perder el puntero) cancela el lazo: la selección vuelve a ser la de antes.
      setSeleccion(a.gesto.inicial);
      setAnuncio("Lazo cancelado.");
    }
    if (a?.gesto && a.activo) {
      historial.current.cancelarGesto();
      setEscena(a.gesto.base);
    }
    if (a?.conector && a.activo) {
      historial.current.cancelarGesto();
      setEscena(a.conector.base);
    }
  };

  /**
   * Clic derecho o la tecla de menú (Y17). Sobre algo sin elegir, lo elige primero; sobre una selección, la conserva; sobre un
   * vacío, no deja nada elegido. Con una edición de texto abierta, el pincel o un gesto en curso no se abre nuestro menú.
   */
  const alMenuContextual = (e: RatonReact<SVGSVGElement>): void => {
    if (edicionRef.current || pincelRef.current || accion.current) {
      e.preventDefault(); // Radix no abre un menú cuyo evento ya quedó cancelado
      return;
    }
    const { escena: actual, seleccion: sel, vista: v } = vivo.current;
    // Un clic derecho trae `button === 2`; el evento de la tecla (que lanza `abrirMenuConTeclado`) trae 0 y usa la selección.
    if (e.button !== 2) {
      setMenuEn(contextoDeMenu(actual, sel));
      return;
    }
    const id = elementoEn(escenaConRutas(actual), pantallaAEscena(v, aPantalla(e)), { tolerancia: 6 / v.zoom });
    if (id === undefined) {
      setSeleccion([]);
      setMenuEn("vacio");
      return;
    }
    const nueva = sel.includes(id) ? sel : [id];
    if (nueva !== sel) {
      setSeleccion(nueva);
      setAnuncio(describirSeleccion(actual, nueva));
    }
    setMenuEn(contextoDeMenu(actual, nueva));
  };

  /** La tecla Menú o Mayús+F10 sobre el lienzo: abre el menú junto a lo elegido (o en el centro de la vista si no hay nada). */
  const abrirMenuConTeclado = (): void => {
    const svg = svgRef.current;
    if (!svg) return;
    const { escena: actual, seleccion: sel, vista: v } = vivo.current;
    const r = svg.getBoundingClientRect();
    const marco = sel.length > 0 ? marcoDeSeleccion(escenaConRutas(actual), sel) : null;
    const centro = marco ? escenaAPantalla(v, centroDelMarco(marco)) : { x: r.width / 2, y: r.height / 2 };
    svg.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left + centro.x, clientY: r.top + centro.y, button: 0 }));
  };

  const alDobleClic = (e: RatonReact<SVGSVGElement>): void => {
    if (pincelRef.current) return; // con el pincel, el doble clic no abre el texto
    const { herramienta: h, enCurso: curso, escena: actual, vista: v } = vivo.current;
    // Doble clic sobre una guía (sin elementos debajo): se quita.
    const guiaDoble = guiaCerca(vivo.current.guias, pantallaAEscena(v, aPantalla(e)), 5 / v.zoom);
    if (guiaDoble && elementoEn(escenaConRutas(actual), pantallaAEscena(v, aPantalla(e)), { tolerancia: 6 / v.zoom, entrarEnGrupos: true }) === undefined) {
      setGuiasUsuario((g) => quitarGuia(g, guiaDoble.id));
      setAnuncio("Guía quitada.");
      return;
    }
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
    if (id !== undefined) {
      abrirEdicion(id);
      return;
    }
    // Doble clic en un vacío: caja de texto nueva con el texto en edición (Y11). Con una edición abierta no se crea otra.
    if (edicionRef.current) return;
    // Sobre un elemento bloqueado tampoco: no se puede editar y un texto nuevo encima sería una sorpresa.
    const crudo = pantallaAEscena(v, aPantalla(e));
    if (elementoEn(escenaConRutas(actual), crudo, { tolerancia: 6 / v.zoom, entrarEnGrupos: true, incluirBloqueados: true }) !== undefined) return;
    const p = imantarPunto(crudo, e.ctrlKey || e.metaKey);
    abrirEdicionNueva({ x: p.x, y: p.y, ancho: TEXTO_NUEVO.ancho, alto: TEXTO_NUEVO.alto });
  };

  // ─── Galería de formas de la cinta (Y11) ────────────────────────────────────
  /** Escribe el centro de la forma en el lienzo si el puntero está sobre él; `null` si está fuera. */
  const centroSobreLienzo = (cliente: { clientX: number; clientY: number }, ctrl: boolean): Punto | null => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || cliente.clientX < r.left || cliente.clientX > r.right || cliente.clientY < r.top || cliente.clientY > r.bottom) return null;
    return imantarPunto(pantallaAEscena(vivo.current.vista, aPantalla(cliente)), ctrl);
  };

  /** Agrega la forma por defecto centrada en `centro`, la deja elegida y respeta el modo fijo. */
  const colocarForma = (forma: TipoForma, centro: Punto): void => {
    fijarCurso(null);
    fijarObjetivo(null);
    setPrevia(null);
    crearElemento(entradaForma(forma, cajaPorDefecto(forma, centro)));
  };

  /** Enter sobre una forma de la galería: al centro de lo que se ve, sin tapar otra igual. */
  const colocarFormaAlCentro = (forma: TipoForma): void => {
    const m = medir();
    const centro = pantallaAEscena(vivo.current.vista, { x: m.ancho / 2, y: m.alto / 2 });
    colocarForma(forma, centroSinTapar(vivo.current.escena, forma, centro));
  };

  /**
   * Arrastrar una forma desde la galería: con una forma fantasma bajo el cursor mientras esté sobre el lienzo; al soltar ahí
   * se crea (una entrada de historial); fuera del lienzo o con Escape no queda nada. Sin arrastre, el clic elige la herramienta.
   */
  const iniciarArrastreGaleria = (forma: TipoForma, e: { button: number; clientX: number; clientY: number }): void => {
    if (e.button !== 0) return;
    galeria.current?.cancelar();
    const origen = { x: e.clientX, y: e.clientY };
    let activo = false;
    const limpiar = (): void => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
      window.removeEventListener("keydown", tecla, true);
      galeria.current = null;
      setFantasmaGaleria(null);
    };
    const cancelar = (): void => limpiar();
    const mover = (ev: PointerEvent): void => {
      if (!activo) {
        if (Math.hypot(ev.clientX - origen.x, ev.clientY - origen.y) < UMBRAL_ARRASTRE_PX) return;
        activo = true;
      }
      const centro = centroSobreLienzo(ev, ev.ctrlKey || ev.metaKey);
      setFantasmaGaleria(centro ? { forma, centro } : null);
    };
    const soltar = (ev: PointerEvent): void => {
      const centro = activo ? centroSobreLienzo(ev, ev.ctrlKey || ev.metaKey) : null;
      limpiar();
      if (centro) colocarForma(forma, centro);
    };
    const tecla = (ev: globalThis.KeyboardEvent): void => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation(); // el Escape cancela el arrastre y nada más (no cierra el editor)
      limpiar();
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
    window.addEventListener("keydown", tecla, true);
    galeria.current = { cancelar };
  };

  // Si el editor se cierra a media arrastrada, no quedan oyentes en la ventana.
  useEffect(() => () => galeria.current?.cancelar(), []);

  /** Esquema → diagrama (Y14): crea todo en UNA entrada de historial, centrado en lo que se ve, y lo deja elegido. */
  const aceptarEsquema = (esquema: Esquema, modo: ModoOrganizar): void => {
    setEsquemaAbierto(false);
    const { escena: actual, vista: v } = vivo.current;
    const m = medir();
    const r = esquemaAEscena(actual, esquema, { modo, centro: pantallaAEscena(v, { x: m.ancho / 2, y: m.alto / 2 }) });
    if (r.ids.length === 0) return;
    confirmar(actual, { escena: r.escena, seleccion: r.ids });
    const avisos = [
      r.fueraDePagina ? AVISO_FUERA_DE_PAGINA : "",
      esquema.sobrantes > 0 ? `Solo se crearon los primeros ${esquema.nodos.length} nodos; sobraron ${esquema.sobrantes}.` : "",
      esquema.recortadas > 0 ? `${esquema.recortadas} ${esquema.recortadas === 1 ? "línea se recortó" : "líneas se recortaron"}.` : "",
    ].filter(Boolean);
    setAnuncio([`Esquema creado: ${esquema.nodos.length} ${esquema.nodos.length === 1 ? "nodo" : "nodos"}.`, ...avisos].join(" "));
  };

  // ─── Órdenes ────────────────────────────────────────────────────────────────
  // Un botón de la cinta y un atajo de teclado piden lo mismo (registro único de comandos, DY3): una `Orden`.
  const ejecutarOrden = (orden: Orden, opciones?: OpcionesOrden): void => {
    switch (orden.tipo) {
      case "deshacer":
        deshacer();
        return;
      case "rehacer":
        rehacer();
        return;
      case "herramienta":
        elegirPorNombre(orden.herramienta, opciones?.fija === true);
        return;
      case "herramienta-forma":
        elegirHerramienta({ tipo: "forma", forma: orden.forma }, opciones?.fija === true);
        return;
      case "zoom":
        acercar(orden.factor);
        return;
      case "ajustar-vista":
        ajustar();
        return;
      case "girar-pagina": {
        // Girar la página (Y25): intercambia ancho y alto, una entrada de historial; en una cuadrada no hay nada que girar.
        const { escena: actual, seleccion: sel } = vivo.current;
        const nueva = girarPagina(actual);
        if (nueva === actual) {
          setAnuncio("La página ya es cuadrada.");
          return;
        }
        confirmar(actual, { escena: nueva, seleccion: sel });
        setVista(ajustarAVentana(nueva, medir()));
        const fuera = fueraDePagina(nueva).length;
        setAnuncio(`Página girada: ${nueva.ancho} × ${nueva.alto}.${fuera > 0 ? ` ${textoFuera(fuera)}.` : ""}`);
        return;
      }
      case "cuadricula":
        setCuadricula((v) => !v);
        return;
      case "imantar":
        setImantar((v) => !v);
        return;
      case "buscar-comando":
        setAtajosAbiertos(false);
        setBuscadorAbierto(true);
        return;
      case "ver-atajos":
        setBuscadorAbierto(false);
        setAtajosAbiertos(true);
        return;
      case "copiar":
        copiarOCortarDeBoton("copy");
        return;
      case "cortar":
        copiarOCortarDeBoton("cut");
        return;
      case "pegar":
        pegarDeBoton(false);
        return;
      case "pegar-en-sitio":
        pegarDeBoton(true);
        return;
      case "organizar": {
        // Organizar automáticamente (Y13): una entrada de historial; los conectores se vuelven a enrutar en `confirmar`.
        const { escena: actual, seleccion: sel } = vivo.current;
        const r = organizarAuto(actual, sel, { modo: orden.modo, ...(orden.direccion ? { direccion: orden.direccion } : {}) });
        if (r.motivo === "demasiadas") setAnuncio("Hay demasiadas formas para organizarlas de una vez (máximo 500). Elige menos.");
        else if (r.motivo === "pocas") setAnuncio("Hacen falta al menos 2 formas que se puedan mover para organizarlas.");
        else if (r.motivo === "sin-cambios") setAnuncio("Ya estaba organizado así.");
        else {
          confirmar(actual, { escena: r.escena, seleccion: sel });
          setAnuncio(`Diagrama organizado de forma ${NOMBRE_MODO[orden.modo]}.${r.aviso ? ` ${AVISO_FUERA_DE_PAGINA}` : ""}`);
        }
        svgRef.current?.focus();
        return;
      }
      case "esquema":
        setBuscadorAbierto(false);
        setAtajosAbiertos(false);
        setEsquemaAbierto(true);
        return;
      case "reglas":
        setReglas(!reglas);
        setAnuncio(reglas ? "Reglas ocultas." : "Reglas activadas.");
        return;
      case "quitar-guias":
        setGuiasUsuario([]);
        setAnuncio("Guías quitadas.");
        svgRef.current?.focus();
        return;
      case "elegir": {
        // Selección avanzada (Y15): no cambia la escena ni toca el historial.
        const { escena: actual, seleccion: sel } = vivo.current;
        const ids = seleccionPorCriterio(actual, sel, orden.criterio);
        if (ids.length === 0 && orden.criterio !== "invertir") setAnuncio(SIN_ELEGIR[orden.criterio]);
        else {
          setSeleccion(ids);
          setAnuncio(textoElegidos(ids.length));
        }
        svgRef.current?.focus();
        return;
      }
      case "copiar-formato":
        iniciarPincel(opciones?.fija === true);
        return;
      case "aplicar-formato":
        aplicarFormatoA(vivo.current.seleccion, false);
        svgRef.current?.focus();
        return;
      case "aplicar-estilo": {
        const e = estiloPorId(orden.estilo);
        if (!e) return;
        const { escena: actual, seleccion: sel } = vivo.current;
        if (aplicarEstiloForma(actual, hojasEditables(actual, sel), e) === actual) return;
        aplicarDelPanel((x) => aplicarEstiloForma(x, hojasEditables(x, sel), e));
        setAnuncio(`Estilo ${e.nombre} aplicado a ${hojasEditables(actual, sel).length} elemento${hojasEditables(actual, sel).length === 1 ? "" : "s"}.`);
        return;
      }
      case "aplicar-tema": {
        const { escena: actual, seleccion: sel } = vivo.current;
        const ambito = ambitoDeTema(actual, sel);
        const nombre = PALETAS_DIAGRAMA[orden.paleta]?.nombre ?? "";
        if (aplicarTema(actual, sel, orden.paleta) === actual) {
          setAnuncio(ambito.ids.length === 0 ? "No hay formas que colorear." : `Ese tema ya está aplicado.`);
          return;
        }
        aplicarDelPanel((x) => aplicarTema(x, sel, orden.paleta));
        setAnuncio(`Tema ${nombre} aplicado ${ambito.deSeleccion ? `a ${ambito.ids.length} forma${ambito.ids.length === 1 ? "" : "s"}` : "al diagrama"}.`);
        return;
      }
      case "cambiar-forma": {
        const { escena: actual, seleccion: sel } = vivo.current;
        if (cambiarForma(actual, sel, orden.forma) === actual) return;
        aplicarDelPanel((e) => cambiarForma(e, sel, orden.forma));
        setAnuncio(`Forma cambiada a ${FORMAS[orden.forma].nombre}.`);
        return;
      }
      case "formato-texto":
        aplicarDelPanel((e) => alternarTexto(e, vivo.current.seleccion, orden.propiedad));
        return;
      case "lista": {
        const { escena: actual, seleccion: sel } = vivo.current;
        // El comando está deshabilitado sin nada que formatear: aquí siempre hay algo que cambiar.
        const nueva = alternarVinetas(actual, sel, orden.modo);
        aplicarDelPanel((e) => alternarVinetas(e, vivo.current.seleccion, orden.modo));
        const quedan = listaDeSeleccion(nueva, sel);
        const cuantos = hojasDeFormato(nueva, sel).filter(conLista).length;
        setAnuncio(quedan !== null && !quedan.mixto && quedan.valor === null ? "Lista quitada." : `${orden.modo === "puntos" ? "Lista con viñetas" : "Lista numerada"} aplicada a ${cuantos} ${cuantos === 1 ? "elemento" : "elementos"}.`);
        return;
      }
      case "ajustar-al-texto": {
        const { escena: actual, seleccion: sel } = vivo.current;
        const r = ajusteDeSeleccion(actual, sel);
        // El comando está deshabilitado cuando no hay nada que ajustar: aquí siempre hay un cambio.
        aplicarDelPanel((e) => ajustarAlTexto(e, vivo.current.seleccion).escena);
        setAnuncio(mensajeDeAjuste(r.cambios));
        return;
      }
      case "crecer-al-escribir": {
        const activa = !crecerRef.current;
        crecerRef.current = activa;
        setCrecer(activa);
        guardarCrecerAlEscribir(activa);
        setAnuncio(activa ? "Crecer al escribir activado: la forma crece al confirmar el texto." : "Crecer al escribir desactivado.");
        return;
      }
      case "terminar":
        cerrar();
        return;
      case "aceptar": {
        const { enCurso: curso, herramienta: h } = vivo.current;
        if (curso && h.tipo === "linea") terminarLinea(curso, h.flecha);
        return;
      }
      case "cerrar":
        if (pincelRef.current) {
          fijarPincel(null);
          setAnuncio("Pincel cancelado.");
        } else if (vivo.current.enCurso) {
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

  // ─── Teclado ────────────────────────────────────────────────────────────────
  const alTeclear = (e: TeclaReact<HTMLDivElement>): void => {
    // Nada de lo que se teclea aquí debe llegar al editor de diapositivas (Supr borraría el bloque, Ctrl+Z deshace la clase…).
    e.stopPropagation();
    const objetivo = e.target as HTMLElement;
    const esCampo = objetivo.tagName === "INPUT" || objetivo.tagName === "TEXTAREA" || objetivo.tagName === "SELECT" || objetivo.isContentEditable;
    if (buscadorAbierto || atajosAbiertos || esquemaAbierto || menuAbierto) return;
    if (esCampo) return;
    if ((e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) && (objetivo as Element) === svgRef.current) {
      e.preventDefault();
      abrirMenuConTeclado();
      return;
    }
    // F6 desde el lienzo lleva el foco a la mini barra si está a la vista (DY16: nunca va sola); la barra lo devuelve con F6 o Escape.
    if (e.key === "F6" && (objetivo as Element) === svgRef.current && miniBarraDatos) {
      if (enfocarMiniBarra(miniBarraRef.current)) e.preventDefault();
      return;
    }
    if (e.key === " " && (objetivo as Element) === svgRef.current) {
      espacio.current = true;
      setCursor("grab");
      e.preventDefault();
      return;
    }
    // Copiar, cortar y pegar los resuelve el navegador con sus eventos (`copy`/`cut`/`paste`): aquí solo se anota si fue con Mayús.
    if (comandoDeTecla(e)?.atajoNativo) {
      if (e.key.toLowerCase() === "v") pegarEnSitio.current = e.shiftKey;
      return;
    }
    const orden = ordenDeTecla(e);
    if (!orden) return;
    // Tab, Enter y las letras de herramienta solo valen desde el lienzo; en la cinta siguen siendo las teclas de siempre.
    const soloLienzo = orden.tipo === "siguiente" || orden.tipo === "aceptar" || comandoDeTecla(e)?.soloLienzo === true;
    if (soloLienzo && (objetivo as Element) !== svgRef.current) return;
    // Mientras se arrastra, Escape cancela el gesto.
    if (orden.tipo === "cerrar" && accion.current?.activo) {
      e.preventDefault();
      alCancelarPuntero();
      return;
    }
    e.preventDefault();
    ejecutarOrden(orden);
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
  // Los puertos se ven en las formas elegidas y en la que tiene el cursor encima.
  const formasConPuertos = useMemo(() => (formaHover === null || formasElegidas.has(formaHover) ? formasElegidas : new Set([...formasElegidas, formaHover])), [formasElegidas, formaHover]);
  const lineasConector = useMemo(() => lineasElegidas(escena, seleccion), [escena, seleccion]);
  const cambiarConector = (nueva: Escena): void => {
    const { escena: actual, seleccion: sel } = vivo.current;
    if (nueva !== actual) confirmar(actual, { escena: nueva, seleccion: sel });
    svgRef.current?.focus();
  };
  // Los grupos no cuentan: son una agrupación de elementos que ya se cuentan.
  const cantidad = escena.elementos.filter((x) => x.tipo !== "grupo").length;
  const puedeDeshacer = historial.current.puedeDeshacer;
  const puedeRehacer = historial.current.puedeRehacer;
  const contextoCinta: ContextoComando = { escena, seleccion, herramienta, puedeDeshacer, puedeRehacer, zoom: vista.zoom, cuadricula, imantar, formatoGuardado: hayFormato, pincel: pincel === null ? null : pincel.fijo ? "fijo" : "una-vez", reglas, guias: guiasUsuario.length, crecerAlEscribir: crecer };

  // Al elegir un conector se muestra su pestaña contextual, pero solo si el usuario estaba en Inicio: no le quita la pestaña a quien trabaja en otra.
  const [pestana, setPestana] = useState(PESTANA_INICIO);
  const habiaConectores = useRef(false);
  const habiaFormato = useRef(false);
  const hayConectores = lineasConector.length > 0;
  const hayFormas = hayQueFormatear(escena, seleccion);
  useEffect(() => {
    // Las dos pestañas contextuales nunca coinciden: «Formato de conector» es solo para selecciones de puras líneas.
    const nueva = hayFormas && !habiaFormato.current ? PESTANA_FORMATO : hayConectores && !habiaConectores.current ? PESTANA_CONECTOR : null;
    if (nueva) setPestana((p) => (p === PESTANA_INICIO ? nueva : p));
    habiaConectores.current = hayConectores;
    habiaFormato.current = hayFormas;
  }, [hayConectores, hayFormas]);

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
      onCopy={(e) => {
        e.stopPropagation(); // ni un copiar ni un pegar de aquí debe llegar al editor de diapositivas
        if (esCampoDeTexto(e.target) || (window.getSelection()?.toString() ?? "") !== "") return;
        if (vivo.current.seleccion.length === 0) return;
        e.preventDefault();
        copiarSeleccion(e.clipboardData);
      }}
      onCut={(e) => {
        e.stopPropagation();
        if (esCampoDeTexto(e.target) || (window.getSelection()?.toString() ?? "") !== "") return;
        if (vivo.current.seleccion.length === 0) return;
        e.preventDefault();
        cortarSeleccion(e.clipboardData);
      }}
      onPaste={(e) => {
        e.stopPropagation();
        if (esCampoDeTexto(e.target)) return;
        e.preventDefault();
        const enSitio = pegarEnSitio.current;
        pegarEnSitio.current = false;
        aplicarLectura(leerDePortapapeles(e.clipboardData, memoriaCopia.current), enSitio);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <CintaEditor
        contexto={contextoCinta}
        lineas={lineasConector}
        pestana={pestana}
        onPestana={setPestana}
        onOrden={ejecutarOrden}
        herramientaFija={herramientaFija}
        pincelFijo={pincel?.fijo === true}
        onArrastrarForma={iniciarArrastreGaleria}
        onColocarForma={colocarFormaAlCentro}
        onCambiarConector={cambiarConector}
        formato={{ onAplicar: aplicarDelPanel, onVista: vistaDelPanel, onFinVista: finVistaPanel, onCancelarVista: cancelarVistaPanel }}
        onSalirALienzo={() => svgRef.current?.focus()}
        acciones={<BotonExportar escena={escena} {...(titulo ? { titulo } : {})} />}
      />

      <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {reglas ? (
        <div className="flex shrink-0">
          <div aria-hidden="true" className="shrink-0 border-b border-r bg-muted" style={{ width: GROSOR_REGLA, height: GROSOR_REGLA }} />
          <ReglaEje eje="x" vista={vista} longitud={medidaVentana.ancho} guias={guiasUsuario} onNuevaGuia={(o, e) => iniciarArrastreGuia(o, null, e)} onMoverGuia={(g, e) => iniciarArrastreGuia(g.orientacion, g.id, e)} onQuitarGuia={(g) => { setGuiasUsuario((x) => quitarGuia(x, g.id)); setAnuncio("Guía quitada."); }} />
        </div>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1">
      {reglas ? <ReglaEje eje="y" vista={vista} longitud={medidaVentana.alto} guias={guiasUsuario} onNuevaGuia={(o, e) => iniciarArrastreGuia(o, null, e)} onMoverGuia={(g, e) => iniciarArrastreGuia(g.orientacion, g.id, e)} onQuitarGuia={(g) => { setGuiasUsuario((x) => quitarGuia(x, g.id)); setAnuncio("Guía quitada."); }} /> : null}
      <div ref={ventanaRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/50">
        <MenuContextual en={menuEn} contexto={contextoCinta} onOrden={ejecutarOrden} onAbierto={setMenuAbierto} focoLienzo={() => svgRef.current?.focus()}>
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
          onPointerLeave={() => {
            cursorEstado.current?.(null);
            setFormaHover(null);
          }}
          onDoubleClick={alDobleClic}
          onContextMenu={alMenuContextual}
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
          <CapaAsasAjuste forma={formaConAsasAjuste({ escena, herramienta, seleccion, gestoEnCurso, edicionAbierta: edicion !== null, menuAbierto, pincel: pincel !== null })} vista={vista} tactil={tactil} />
          <CapaAsasHijo escena={escena} vista={vista} herramienta={herramienta} seleccion={seleccion} gestoEnCurso={gestoEnCurso} edicionAbierta={edicion !== null} tactil={tactil} />
          {fantasmaGaleria ? <CapaFantasmaForma vista={vista} forma={fantasmaGaleria.forma} centro={fantasmaGaleria.centro} /> : null}
          {fantasmaHijo ? <CapaFantasmaHijo escena={escena} vista={vista} padreId={fantasmaHijo.padreId} centro={fantasmaHijo.centro} /> : null}
          {lineaElegida ? <CapaAsasDeConector escena={escena} linea={lineaElegida} vista={vista} /> : null}
          <CapaPuertos escena={escena} vista={vista} formasElegidas={formasConPuertos} todas={herramienta.tipo === "linea" || arrastrandoExtremo} objetivo={objetivoPuerto} tactil={tactil} />
          <CapaDestino escena={escena} vista={vista} formaId={objetivoPuerto?.elementoId ?? destinoArrastre} modo={objetivoPuerto ? "conecta" : destinoModo} />
          <CapaConexionPrevia vista={vista} previa={conexionPrevia} />
          <CapaGuias guias={guias} vista={vista} />
          <MedidasCapa vista={vista} medida={medida} cotas={cotas} />
          {reglas ? <CapaGuiasUsuario guias={guiasUsuario} vista={vista} quitando={guiaQuitando} previa={guiaPrevia} /> : null}
          <CapaPrevia previa={previa} vista={vista} />
          {lazo && lazo.length >= 2 ? (
            <polygon
              data-capa="lazo"
              pointerEvents="none"
              points={porVista(vista, lazo)}
              fill={COLOR_SELECCION}
              fillOpacity={0.08}
              stroke={COLOR_SELECCION}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ) : null}
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
        </MenuContextual>
        {miniBarraDatos && marcoEstado ? (
          <MiniBarra
            datos={miniBarraDatos}
            marco={marcoEstado}
            vista={vista}
            ventana={medidaVentana}
            obstaculos={circulosDeAsasHijo(escena, seleccion, vista, tactil)}
            contexto={contextoCinta}
            raizRef={miniBarraRef}
            onOrden={ejecutarOrden}
            onAplicar={aplicarDelPanel}
            onVista={vistaDelPanel}
            onFinVista={finVistaPanel}
            onCancelarVista={cancelarVistaPanel}
            onSalir={() => svgRef.current?.focus()}
          />
        ) : null}
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
      </div>
      </div>
      <ZonaRedimensionable etiqueta="Propiedades" clave="dibujo-panel">
        {(plegar) => <PanelPropiedades escena={escena} seleccion={seleccion} onAplicar={aplicarDelPanel} onVista={vistaDelPanel} onFinVista={finVistaPanel} onSeleccionar={seleccionarDesdeCapas} onPlegar={plegar} crecerAlEscribir={crecer} onCrecerAlEscribir={() => ejecutarOrden({ tipo: "crecer-al-escribir" })} onAjustarAlTexto={() => ejecutarOrden({ tipo: "ajustar-al-texto" })} onPagina={aplicarPagina} />}
      </ZonaRedimensionable>
      </div>

      <BarraEstado
        cantidad={cantidad}
        seleccionados={seleccion.length}
        marco={marcoEstado}
        zoom={vista.zoom}
        cuadricula={cuadricula}
        imantar={imantar}
        ayuda={pincel ? "Pincel: haz clic en un elemento, o arrastra un recuadro, para darle el formato copiado · Esc lo suelta" : ayudaDeHerramienta(herramienta, enCurso)}
        onOrden={ejecutarOrden}
        onZoom={(z) => acercar(z / vivo.current.vista.zoom)}
        cursorRef={cursorEstado}
      />

      <p id={ayudaId} className="sr-only">
        Flechas mueven lo seleccionado una unidad; con Mayús, diez. Tab recorre los elementos. Ctrl+Z deshace, Ctrl+Y rehace. Supr elimina. Escape quita la selección y, sin selección, cierra el editor.
      </p>
      <div aria-live="polite" role="status" className="sr-only" data-dibujo-anuncio="">
        {anuncio}
      </div>
      <BuscadorComandos
        abierto={buscadorAbierto}
        onCerrar={() => setBuscadorAbierto(false)}
        contexto={contextoCinta}
        ejecutarOrden={ejecutarOrden}
        focoLienzo={() => svgRef.current?.focus()}
      />
      {esquemaAbierto ? <DialogoEsquema onCerrar={() => setEsquemaAbierto(false)} onAceptar={aceptarEsquema} focoLienzo={() => svgRef.current?.focus()} /> : null}
      <PanelAtajos abierto={atajosAbiertos} onCerrar={() => setAtajosAbiertos(false)} focoLienzo={() => svgRef.current?.focus()} />
    </div>
  );
}
