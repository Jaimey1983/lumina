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

import { ElementRegistry } from "./registry.js";
import { abrirCajaDefinition } from "./elements/abrir_caja/abrir_caja-definition.js";
import { ahorcadoDefinition } from "./elements/ahorcado/ahorcado-definition.js";
import { anagramaDefinition } from "./elements/anagrama/anagrama-definition.js";
import { botonDefinition } from "./elements/boton/boton-definition.js";
import { clasificarDefinition } from "./elements/clasificar/clasificar-definition.js";
import { crucigramaDefinition } from "./elements/crucigrama/crucigrama-definition.js";
import { globosDefinition } from "./elements/globos/globos-definition.js";
import { historiaRamificadaDefinition } from "./elements/historia_ramificada/historia_ramificada-definition.js";
import { memoriaDefinition } from "./elements/memoria/memoria-definition.js";
import { puzzleImagenDefinition } from "./elements/puzzle_imagen/puzzle_imagen-definition.js";
import { puzzlePalabrasDefinition } from "./elements/puzzle_palabras/puzzle_palabras-definition.js";
import { sopaLetrasDefinition } from "./elements/sopa_letras/sopa_letras-definition.js";
import { topoDefinition } from "./elements/topo/topo-definition.js";

/** Catálogo único — Botón (E1.4) + Anagrama (E2.3) + Grupo 4 (E2.4). */
export const elementRegistry = new ElementRegistry<{
  boton: typeof botonDefinition;
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
}>();
elementRegistry.registrar(botonDefinition);
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
elementRegistry.registrar(historiaRamificadaDefinition);
