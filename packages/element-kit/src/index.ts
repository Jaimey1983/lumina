export * from "./elements/timeline/index.js";
import { timelineDefinition } from "./elements/timeline/timeline-definition.js";
export * from "./elements/click-reveal/index.js";
import { clickRevealDefinition } from "./elements/click-reveal/click-reveal-definition.js";
export * from "./elements/carousel/index.js";
import { carouselDefinition } from "./elements/carousel/carousel-definition.js";
export * from "./elements/tabs/index.js";
import { tabsDefinition } from "./elements/tabs/tabs-definition.js";
export * from "./elements/flip-cards/index.js";
import { flipCardsDefinition } from "./elements/flip-cards/flip-cards-definition.js";
export * from "./elements/popup/index.js";
import { popupDefinition } from "./elements/popup/popup-definition.js";
export * from "./elements/grafico/index.js";
export * from "./elements/diagrama/index.js";
import { graficoDefinition } from "./elements/grafico/grafico-definition.js";
import { diagramaDefinition } from "./elements/diagrama/diagrama-definition.js";
export type {
  AparienciaSpec,
  ElementDefinition,
  ElementEditorProps,
  ElementViewerProps,
  ElementPropsPanelProps,
  PuntuacionDelegate,
} from "./contract.js";
export { ElementRegistry } from "./registry.js";

export {
  botonDefinition,
  registrarBoton,
  BOTON_TIPO,
  BotonEditor,
  BotonViewer,
  BotonPropiedades,
  type BotonConfig,
  type BotonEstado,
  type BotonDefinition,
} from "./elements/boton/index.js";

export {
  ruletaDefinition,
  registrarRuleta,
  RULETA_TIPO,
  RuletaEditor,
  RuletaViewer,
  RuletaPropiedades,
  type RuletaConfig,
  type RuletaEstado,
  type RuletaDefinition,
} from "./elements/ruleta/index.js";

export {
  hotspotDefinition,
  registrarHotspot,
  HOTSPOT_TIPO,
  HotspotEditor,
  HotspotViewer,
  HotspotPropiedades,
  type HotspotConfig,
  type HotspotEstado,
  type HotspotDefinition,
} from "./elements/hotspot/index.js";

export {
  tooltipDefinition,
  registrarTooltip,
  TOOLTIP_TIPO,
  TooltipEditor,
  TooltipViewer,
  TooltipPropiedades,
  type TooltipConfig,
  type TooltipEstado,
  type TooltipDefinition,
} from "./elements/tooltip/index.js";

export {
  contadorDefinition,
  registrarContador,
  CONTADOR_TIPO,
  ContadorEditor,
  ContadorViewer,
  ContadorPropiedades,
  type ContadorConfig,
  type ContadorEstado,
  type ContadorDefinition,
} from "./elements/contador/index.js";

export {
  progresoDefinition,
  registrarProgreso,
  PROGRESO_TIPO,
  ProgresoEditor,
  ProgresoViewer,
  ProgresoPropiedades,
  type ProgresoConfig,
  type ProgresoEstado,
  type ProgresoDefinition,
} from "./elements/progreso/index.js";

export {
  anagramaDefinition,
  registrarAnagrama,
  evaluarAnagrama,
  ANAGRAMA_TIPO,
  AnagramaEditor,
  AnagramaViewer,
  AnagramaPropiedades,
  type AnagramaConfig,
  type AnagramaEstado,
  type AnagramaDefinition,
} from "./elements/anagrama/index.js";

export {
  clasificarDefinition,
  registrarClasificar,
  evaluarClasificar,
  CLASIFICAR_TIPO,
  ClasificarEditor,
  ClasificarViewer,
  ClasificarPropiedades,
  type ClasificarConfig,
  type ClasificarEstado,
  type ClasificarDefinition,
} from "./elements/clasificar/index.js";

export {
  memoriaDefinition,
  registrarMemoria,
  evaluarMemoria,
  MEMORIA_TIPO,
  MemoriaEditor,
  MemoriaViewer,
  MemoriaPropiedades,
  type MemoriaConfig,
  type MemoriaEstado,
  type MemoriaDefinition,
} from "./elements/memoria/index.js";

export {
  puzzleImagenDefinition,
  registrarPuzzleImagen,
  evaluarPuzzleImagen,
  PUZZLE_IMAGEN_TIPO,
  PuzzleImagenEditor,
  PuzzleImagenViewer,
  PuzzleImagenPropiedades,
  type PuzzleImagenConfig,
  type PuzzleImagenEstado,
  type PuzzleImagenDefinition,
} from "./elements/puzzle_imagen/index.js";

export {
  sopaLetrasDefinition,
  registrarSopaLetras,
  evaluarSopaLetras,
  SOPA_LETRAS_TIPO,
  SopaLetrasEditor,
  SopaLetrasViewer,
  SopaLetrasPropiedades,
  type SopaLetrasConfig,
  type SopaLetrasEstado,
  type SopaLetrasDefinition,
} from "./elements/sopa_letras/index.js";

export {
  crucigramaDefinition,
  registrarCrucigrama,
  evaluarCrucigrama,
  CRUCIGRAMA_TIPO,
  CrucigramaEditor,
  CrucigramaViewer,
  CrucigramaPropiedades,
  type CrucigramaConfig,
  type CrucigramaEstado,
  type CrucigramaDefinition,
} from "./elements/crucigrama/index.js";

export {
  abrirCajaDefinition,
  registrarAbrirCaja,
  evaluarAbrirCaja,
  ABRIR_CAJA_TIPO,
  AbrirCajaEditor,
  AbrirCajaViewer,
  AbrirCajaPropiedades,
  type AbrirCajaConfig,
  type AbrirCajaEstado,
  type AbrirCajaDefinition,
} from "./elements/abrir_caja/index.js";

export {
  ahorcadoDefinition,
  registrarAhorcado,
  evaluarAhorcado,
  AHORCADO_TIPO,
  AhorcadoEditor,
  AhorcadoViewer,
  AhorcadoPropiedades,
  type AhorcadoConfig,
  type AhorcadoEstado,
  type AhorcadoDefinition,
} from "./elements/ahorcado/index.js";

export {
  puzzlePalabrasDefinition,
  registrarPuzzlePalabras,
  evaluarPuzzlePalabras,
  PUZZLE_PALABRAS_TIPO,
  PuzzlePalabrasEditor,
  PuzzlePalabrasViewer,
  PuzzlePalabrasPropiedades,
  type PuzzlePalabrasConfig,
  type PuzzlePalabrasEstado,
  type PuzzlePalabrasDefinition,
} from "./elements/puzzle_palabras/index.js";

export {
  globosDefinition,
  registrarGlobos,
  evaluarGlobos,
  GLOBOS_TIPO,
  GlobosEditor,
  GlobosViewer,
  GlobosPropiedades,
  type GlobosConfig,
  type GlobosEstado,
  type GlobosDefinition,
} from "./elements/globos/index.js";

export {
  topoDefinition,
  registrarTopo,
  evaluarTopo,
  TOPO_TIPO,
  TopoEditor,
  TopoViewer,
  TopoPropiedades,
  type TopoConfig,
  type TopoEstado,
  type TopoDefinition,
} from "./elements/topo/index.js";

export {
  historiaRamificadaDefinition,
  registrarHistoriaRamificada,
  evaluarHistoriaRamificada,
  HISTORIA_RAMIFICADA_TIPO,
  HistoriaRamificadaEditor,
  HistoriaRamificadaViewer,
  HistoriaRamificadaPropiedades,
  type HistoriaRamificadaConfig,
  type HistoriaRamificadaEstado,
  type HistoriaRamificadaDefinition,
} from "./elements/historia_ramificada/index.js";

export {
  quizMultipleDefinition,
  registrarQuizMultiple,
  evaluarQuizMultiple,
  QUIZ_MULTIPLE_TIPO,
  QuizMultipleEditor,
  QuizMultipleViewer,
  QuizMultiplePropiedades,
  type QuizMultipleConfig,
  type QuizMultipleEstado,
  type QuizMultipleDefinition,
} from "./elements/quiz_multiple/index.js";

export {
  verdaderoFalsoDefinition,
  registrarVerdaderoFalso,
  evaluarVerdaderoFalso,
  VERDADERO_FALSO_TIPO,
  VerdaderoFalsoEditor,
  VerdaderoFalsoViewer,
  VerdaderoFalsoPropiedades,
  type VerdaderoFalsoConfig,
  type VerdaderoFalsoEstado,
  type VerdaderoFalsoDefinition,
} from "./elements/verdadero_falso/index.js";

export {
  completarBlancosDefinition,
  registrarCompletarBlancos,
  evaluarCompletarBlancos,
  COMPLETAR_BLANCOS_TIPO,
  CompletarBlancosEditor,
  CompletarBlancosViewer,
  CompletarBlancosPropiedades,
  type CompletarBlancosConfig,
  type CompletarBlancosEstado,
  type CompletarBlancosDefinition,
} from "./elements/completar_blancos/index.js";

export {
  arrastrarSoltarDefinition,
  registrarArrastrarSoltar,
  evaluarArrastrarSoltar,
  ARRASTRAR_SOLTAR_TIPO,
  ArrastrarSoltarEditor,
  ArrastrarSoltarViewer,
  ArrastrarSoltarPropiedades,
  type ArrastrarSoltarConfig,
  type ArrastrarSoltarEstado,
  type ArrastrarSoltarDefinition,
} from "./elements/arrastrar_soltar/index.js";

export {
  emparejarDefinition,
  registrarEmparejar,
  evaluarEmparejar,
  EMPAREJAR_TIPO,
  EmparejarEditor,
  EmparejarViewer,
  EmparejarPropiedades,
  type EmparejarConfig,
  type EmparejarEstado,
  type EmparejarDefinition,
} from "./elements/emparejar/index.js";

export {
  ordenarPasosDefinition,
  registrarOrdenarPasos,
  evaluarOrdenarPasos,
  ORDENAR_PASOS_TIPO,
  OrdenarPasosEditor,
  OrdenarPasosViewer,
  OrdenarPasosPropiedades,
  type OrdenarPasosConfig,
  type OrdenarPasosEstado,
  type OrdenarPasosDefinition,
} from "./elements/ordenar_pasos/index.js";

export {
  videoInteractivoDefinition,
  registrarVideoInteractivo,
  evaluarVideoInteractivo,
  VIDEO_INTERACTIVO_TIPO,
  VideoInteractivoEditor,
  VideoInteractivoViewer,
  VideoInteractivoPropiedades,
  type VideoInteractivoConfig,
  type VideoInteractivoEstado,
  type VideoInteractivoDefinition,
} from "./elements/video_interactivo/index.js";

export {
  shortAnswerDefinition,
  registrarShortAnswer,
  evaluarShortAnswer,
  SHORT_ANSWER_TIPO,
  ShortAnswerEditor,
  ShortAnswerViewer,
  ShortAnswerPropiedades,
  type ShortAnswerConfig,
  type ShortAnswerEstado,
  type ShortAnswerDefinition,
} from "./elements/short_answer/index.js";

export {
  encuestaVivaDefinition,
  registrarEncuestaViva,
  evaluarEncuestaViva,
  ENCUESTA_VIVA_TIPO,
  EncuestaVivaEditor,
  EncuestaVivaViewer,
  EncuestaVivaPropiedades,
  type EncuestaVivaConfig,
  type EncuestaVivaEstado,
  type EncuestaVivaDefinition,
} from "./elements/encuesta_viva/index.js";

export {
  nubePalabrasDefinition,
  registrarNubePalabras,
  evaluarNubePalabras,
  NUBE_PALABRAS_TIPO,
  NubePalabrasEditor,
  NubePalabrasViewer,
  NubePalabrasPropiedades,
  type NubePalabrasConfig,
  type NubePalabrasEstado,
  type NubePalabrasDefinition,
} from "./elements/nube_palabras/index.js";

import { ElementRegistry } from "./registry.js";
import { abrirCajaDefinition } from "./elements/abrir_caja/abrir_caja-definition.js";
import { ahorcadoDefinition } from "./elements/ahorcado/ahorcado-definition.js";
import { anagramaDefinition } from "./elements/anagrama/anagrama-definition.js";
import { botonDefinition } from "./elements/boton/boton-definition.js";
import { ruletaDefinition } from "./elements/ruleta/ruleta-definition.js";
import { hotspotDefinition } from "./elements/hotspot/hotspot-definition.js";
import { tooltipDefinition } from "./elements/tooltip/tooltip-definition.js";
import { contadorDefinition } from "./elements/contador/contador-definition.js";
import { progresoDefinition } from "./elements/progreso/progreso-definition.js";
import { clasificarDefinition } from "./elements/clasificar/clasificar-definition.js";
import { crucigramaDefinition } from "./elements/crucigrama/crucigrama-definition.js";
import { globosDefinition } from "./elements/globos/globos-definition.js";
import { historiaRamificadaDefinition } from "./elements/historia_ramificada/historia_ramificada-definition.js";
import { memoriaDefinition } from "./elements/memoria/memoria-definition.js";
import { puzzleImagenDefinition } from "./elements/puzzle_imagen/puzzle_imagen-definition.js";
import { puzzlePalabrasDefinition } from "./elements/puzzle_palabras/puzzle_palabras-definition.js";
import { sopaLetrasDefinition } from "./elements/sopa_letras/sopa_letras-definition.js";
import { topoDefinition } from "./elements/topo/topo-definition.js";
import { quizMultipleDefinition } from "./elements/quiz_multiple/quiz_multiple-definition.js";
import { verdaderoFalsoDefinition } from "./elements/verdadero_falso/verdadero_falso-definition.js";
import { completarBlancosDefinition } from "./elements/completar_blancos/completar_blancos-definition.js";
import { arrastrarSoltarDefinition } from "./elements/arrastrar_soltar/arrastrar_soltar-definition.js";
import { emparejarDefinition } from "./elements/emparejar/emparejar-definition.js";
import { ordenarPasosDefinition } from "./elements/ordenar_pasos/ordenar_pasos-definition.js";
import { videoInteractivoDefinition } from "./elements/video_interactivo/video_interactivo-definition.js";
import { shortAnswerDefinition } from "./elements/short_answer/short_answer-definition.js";
import { encuestaVivaDefinition } from "./elements/encuesta_viva/encuesta_viva-definition.js";
import { nubePalabrasDefinition } from "./elements/nube_palabras/nube_palabras-definition.js";

/** Catálogo único — Botón (E1.4) + Ruleta (E3.1) + Control/burbuja (E3.2) + actividades E2. */
export const elementRegistry = new ElementRegistry<{
  "timeline": typeof timelineDefinition;
  "click-reveal": typeof clickRevealDefinition;
  "carousel": typeof carouselDefinition;
  "tabs": typeof tabsDefinition;
  "flip-cards": typeof flipCardsDefinition;
  popup: typeof popupDefinition;
  grafico: typeof graficoDefinition;
  diagrama: typeof diagramaDefinition;
  boton: typeof botonDefinition;
  ruleta: typeof ruletaDefinition;
  hotspot: typeof hotspotDefinition;
  tooltip: typeof tooltipDefinition;
  contador: typeof contadorDefinition;
  progreso: typeof progresoDefinition;
  anagrama: typeof anagramaDefinition;
  clasificar: typeof clasificarDefinition;
  memoria: typeof memoriaDefinition;
  puzzle_imagen: typeof puzzleImagenDefinition;
  sopa_letras: typeof sopaLetrasDefinition;
  crucigrama: typeof crucigramaDefinition;
  abrir_caja: typeof abrirCajaDefinition;
  ahorcado: typeof ahorcadoDefinition;
  puzzle_palabras: typeof puzzlePalabrasDefinition;
  globos: typeof globosDefinition;
  topo: typeof topoDefinition;
  historia_ramificada: typeof historiaRamificadaDefinition;
  quiz_multiple: typeof quizMultipleDefinition;
  verdadero_falso: typeof verdaderoFalsoDefinition;
  completar_blancos: typeof completarBlancosDefinition;
  arrastrar_soltar: typeof arrastrarSoltarDefinition;
  emparejar: typeof emparejarDefinition;
  ordenar_pasos: typeof ordenarPasosDefinition;
  video_interactivo: typeof videoInteractivoDefinition;
  short_answer: typeof shortAnswerDefinition;
  encuesta_viva: typeof encuestaVivaDefinition;
  nube_palabras: typeof nubePalabrasDefinition;
}>();
elementRegistry.registrar(botonDefinition);
elementRegistry.registrar(ruletaDefinition);
elementRegistry.registrar(hotspotDefinition);
elementRegistry.registrar(tooltipDefinition);
elementRegistry.registrar(contadorDefinition);
elementRegistry.registrar(progresoDefinition);
elementRegistry.registrar(anagramaDefinition);
elementRegistry.registrar(clasificarDefinition);
elementRegistry.registrar(memoriaDefinition);
elementRegistry.registrar(puzzleImagenDefinition);
elementRegistry.registrar(sopaLetrasDefinition);
elementRegistry.registrar(crucigramaDefinition);
elementRegistry.registrar(abrirCajaDefinition);
elementRegistry.registrar(ahorcadoDefinition);
elementRegistry.registrar(puzzlePalabrasDefinition);
elementRegistry.registrar(globosDefinition);
elementRegistry.registrar(topoDefinition);
elementRegistry.registrar(quizMultipleDefinition);
elementRegistry.registrar(verdaderoFalsoDefinition);
elementRegistry.registrar(completarBlancosDefinition);
elementRegistry.registrar(arrastrarSoltarDefinition);
elementRegistry.registrar(emparejarDefinition);
elementRegistry.registrar(ordenarPasosDefinition);
elementRegistry.registrar(videoInteractivoDefinition);
elementRegistry.registrar(shortAnswerDefinition);
elementRegistry.registrar(encuestaVivaDefinition);
elementRegistry.registrar(nubePalabrasDefinition);
elementRegistry.registrar(historiaRamificadaDefinition);

elementRegistry.registrar(flipCardsDefinition);

elementRegistry.registrar(tabsDefinition);

elementRegistry.registrar(carouselDefinition);

elementRegistry.registrar(clickRevealDefinition);

elementRegistry.registrar(timelineDefinition);

elementRegistry.registrar(popupDefinition);
elementRegistry.registrar(graficoDefinition);
elementRegistry.registrar(diagramaDefinition);
