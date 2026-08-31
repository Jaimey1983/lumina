import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Grid2x2, Grid3x3, Layers, Puzzle, Package, CaseSensitive, AlignLeft, Search, Sparkles, Crosshair, GitBranch, Keyboard } from 'lucide-react';

import type {
  Activity,
  ClasificarActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  SopaLetrasActivity,
  CrucigramaActivity,
  AbrirCajaActivity,
  AnagramaActivity,
  AhorcadoActivity,
  PuzzlePalabrasActivity,
  GlobosActivity,
  TopoActivity,
  HistoriaRamificadaActivity,
} from '@/types/slide.types';
import { createDefaultClasificar } from '@/lib/clasificar-defaults';
import { createDefaultMemoria } from '@/lib/memoria-defaults';
import { createDefaultPuzzleImagen } from '@/lib/puzzle-imagen-defaults';
import { createDefaultSopaLetras } from '@/lib/sopa-letras-defaults';
import { createDefaultCrucigrama } from '@/lib/crucigrama-defaults';
import { createDefaultAbrirCaja } from '@/lib/abrir-caja-defaults';
import { createDefaultAnagrama } from '@/lib/anagrama-defaults';
import { createDefaultAhorcado } from '@/lib/ahorcado-defaults';
import { createDefaultPuzzlePalabras } from '@/lib/puzzle-palabras-defaults';
import { createDefaultGlobos } from '@/lib/globos-defaults';
import { createDefaultTopo } from '@/lib/topo-defaults';
import { HistoriaRamificadaEditor } from '@/components/activities/historia-ramificada/historia-ramificada-editor';
import { HistoriaRamificadaViewer } from '@/components/activities/historia-ramificada/historia-ramificada-viewer';
import { HistoriaRamificadaProperties } from '@/components/activities/historia-ramificada/historia-ramificada-properties';
import { createDefaultHistoriaRamificada } from '@/lib/historia-ramificada-defaults';
import { ClasificarEditor } from '@/components/activities/clasificar/clasificar-editor';
import { ClasificarViewer } from '@/components/activities/clasificar/clasificar-viewer';
import { ClasificarProperties } from '@/components/activities/clasificar/clasificar-properties';
import { MemoriaEditor } from '@/components/activities/memoria/memoria-editor';
import { MemoriaViewer } from '@/components/activities/memoria/memoria-viewer';
import { MemoriaProperties } from '@/components/activities/memoria/memoria-properties';
import { PuzzleImagenEditor } from '@/components/activities/puzzle-imagen/puzzle-imagen-editor';
import { PuzzleImagenViewer } from '@/components/activities/puzzle-imagen/puzzle-imagen-viewer';
import { PuzzleImagenProperties } from '@/components/activities/puzzle-imagen/puzzle-imagen-properties';
import { AbrirCajaEditor } from '@/components/activities/abrir-caja/abrir-caja-editor';
import { AbrirCajaViewer } from '@/components/activities/abrir-caja/abrir-caja-viewer';
import { AbrirCajaProperties } from '@/components/activities/abrir-caja/abrir-caja-properties';
import { AnagramaEditor } from '@/components/activities/anagrama/anagrama-editor';
import { AnagramaViewer } from '@/components/activities/anagrama/anagrama-viewer';
import { AnagramaProperties } from '@/components/activities/anagrama/anagrama-properties';
import { AhorcadoEditor } from '@/components/activities/ahorcado/ahorcado-editor';
import { AhorcadoViewer } from '@/components/activities/ahorcado/ahorcado-viewer';
import { AhorcadoProperties } from '@/components/activities/ahorcado/ahorcado-properties';
import { PuzzlePalabrasEditor } from '@/components/activities/puzzle-palabras/puzzle-palabras-editor';
import { PuzzlePalabrasViewer } from '@/components/activities/puzzle-palabras/puzzle-palabras-viewer';
import { PuzzlePalabrasProperties } from '@/components/activities/puzzle-palabras/puzzle-palabras-properties';
import { SopaLetrasEditor } from '@/components/activities/sopa-letras/sopa-letras-editor';
import { SopaLetrasViewer } from '@/components/activities/sopa-letras/sopa-letras-viewer';
import { SopaLetrasProperties } from '@/components/activities/sopa-letras/sopa-letras-properties';
import { CrucigramaEditor } from '@/components/activities/crucigrama/crucigrama-editor';
import { CrucigramaViewer } from '@/components/activities/crucigrama/crucigrama-viewer';
import { CrucigramaProperties } from '@/components/activities/crucigrama/crucigrama-properties';

import { GlobosEditor } from '@/components/activities/globos/globos-editor'
import { GlobosViewer } from '@/components/activities/globos/globos-viewer'
import { GlobosProperties } from '@/components/activities/globos/globos-properties'

import { TopoEditor } from '@/components/activities/topo/topo-editor'
import { TopoViewer } from '@/components/activities/topo/topo-viewer'
import { TopoProperties } from '@/components/activities/topo/topo-properties'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityEditorProps<T extends Activity = Activity> {
  actividad: T;
  isSelected?: boolean;
}

export interface ActivityViewerProps<T extends Activity = Activity> {
  actividad: T;
  onComplete?: (response: unknown) => void;
}

export interface ActivityPropertiesProps<T extends Activity = Activity> {
  actividad: T;
  onChange: (actividad: T) => void;
}

export interface ActivityRegistryEntry<T extends Activity = Activity> {
  tipo: T['tipo'];
  /** Identificador en el panel de actividades (drag & drop). */
  panelType: string;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  evaluable: boolean;
  editor: ComponentType<ActivityEditorProps<T>>;
  viewer: ComponentType<ActivityViewerProps<T>>;
  properties: ComponentType<ActivityPropertiesProps<T>>;
  createDefault: () => T;
}

// ─── GRUPO 4 ──────────────────────────────────────────────────────────────────

const CLASIFICAR_ENTRY: ActivityRegistryEntry<ClasificarActivity> = {
  tipo: 'clasificar',
  panelType: 'clasificar',
  nombre: 'Clasificar',
  descripcion: 'Arrastra cada elemento a su categoría correcta',
  icono: Layers,
  evaluable: true,
  editor: ClasificarEditor,
  viewer: ClasificarViewer,
  properties: ClasificarProperties,
  createDefault: createDefaultClasificar,
};

const MEMORIA_ENTRY: ActivityRegistryEntry<MemoriaActivity> = {
  tipo: 'memoria',
  panelType: 'memoria',
  nombre: 'Memoria',
  descripcion: 'Encuentra todos los pares de cartas iguales',
  icono: Grid2x2,
  evaluable: true,
  editor: MemoriaEditor,
  viewer: MemoriaViewer,
  properties: MemoriaProperties,
  createDefault: createDefaultMemoria,
};

const PUZZLE_IMAGEN_ENTRY: ActivityRegistryEntry<PuzzleImagenActivity> = {
  tipo: 'puzzle_imagen',
  panelType: 'puzzle_imagen',
  nombre: 'Puzzle de imagen',
  descripcion: 'Arrastra las piezas para armar la imagen',
  icono: Puzzle,
  evaluable: true,
  editor: PuzzleImagenEditor,
  viewer: PuzzleImagenViewer,
  properties: PuzzleImagenProperties,
  createDefault: createDefaultPuzzleImagen,
};

const SOPA_LETRAS_ENTRY: ActivityRegistryEntry<SopaLetrasActivity> = {
  tipo: 'sopa_letras',
  panelType: 'sopa_letras',
  nombre: 'Sopa de letras',
  descripcion: 'Encuentra las palabras escondidas en el grid',
  icono: Search,
  evaluable: true,
  editor: SopaLetrasEditor,
  viewer: SopaLetrasViewer,
  properties: SopaLetrasProperties,
  createDefault: createDefaultSopaLetras,
};

const CRUCIGRAMA_ENTRY: ActivityRegistryEntry<CrucigramaActivity> = {
  tipo: 'crucigrama',
  panelType: 'crucigrama',
  nombre: 'Crucigrama',
  descripcion: 'Completa las palabras siguiendo las pistas',
  icono: Grid3x3,
  evaluable: true,
  editor: CrucigramaEditor,
  viewer: CrucigramaViewer,
  properties: CrucigramaProperties,
  createDefault: createDefaultCrucigrama,
};

const ABRIR_CAJA_ENTRY: ActivityRegistryEntry<AbrirCajaActivity> = {
  tipo: 'abrir_caja',
  panelType: 'abrir_caja',
  nombre: 'Abrir caja',
  descripcion: 'Haz clic en las cajas para descubrir su contenido',
  icono: Package,
  evaluable: true,
  editor: AbrirCajaEditor,
  viewer: AbrirCajaViewer,
  properties: AbrirCajaProperties,
  createDefault: createDefaultAbrirCaja,
};

const ANAGRAMA_ENTRY: ActivityRegistryEntry<AnagramaActivity> = {
  tipo: 'anagrama',
  panelType: 'anagrama',
  nombre: 'Anagrama',
  descripcion: 'Ordena las letras para formar la palabra correcta',
  icono: CaseSensitive,
  evaluable: true,
  editor: AnagramaEditor,
  viewer: AnagramaViewer,
  properties: AnagramaProperties,
  createDefault: createDefaultAnagrama,
};

const AHORCADO_ENTRY: ActivityRegistryEntry<AhorcadoActivity> = {
  tipo: 'ahorcado',
  panelType: 'ahorcado',
  nombre: 'Ahorcado',
  descripcion: 'Adivina la palabra letra por letra antes de quedarte sin intentos',
  icono: Keyboard,
  evaluable: true,
  editor: AhorcadoEditor,
  viewer: AhorcadoViewer,
  properties: AhorcadoProperties,
  createDefault: createDefaultAhorcado,
};

const PUZZLE_PALABRAS_ENTRY: ActivityRegistryEntry<PuzzlePalabrasActivity> = {
  tipo: 'puzzle_palabras',
  panelType: 'puzzle_palabras',
  nombre: 'Puzzle de palabras',
  descripcion: 'Ordena las palabras para formar la oración correcta',
  icono: AlignLeft,
  evaluable: true,
  editor: PuzzlePalabrasEditor,
  viewer: PuzzlePalabrasViewer,
  properties: PuzzlePalabrasProperties,
  createDefault: createDefaultPuzzlePalabras,
};

const GLOBOS_ENTRY: ActivityRegistryEntry<GlobosActivity> = {
  tipo: 'globos',
  panelType: 'globos',
  nombre: 'Globos',
  descripcion: 'Pincha el globo con la respuesta correcta antes de que escapen',
  icono: Sparkles,
  evaluable: true,
  editor: GlobosEditor,
  viewer: GlobosViewer,
  properties: GlobosProperties,
  createDefault: createDefaultGlobos,
};

const TOPO_ENTRY: ActivityRegistryEntry<TopoActivity> = {
  tipo: 'topo',
  panelType: 'topo',
  nombre: 'Golpea al topo',
  descripcion: 'Golpea el topo con la respuesta correcta',
  icono: Crosshair,
  evaluable: true,
  editor: TopoEditor,
  viewer: TopoViewer,
  properties: TopoProperties,
  createDefault: createDefaultTopo,
};

const HISTORIA_RAMIFICADA_ENTRY: ActivityRegistryEntry<HistoriaRamificadaActivity> = {
  tipo: 'historia_ramificada',
  panelType: 'historia_ramificada',
  nombre: 'Historia ramificada',
  descripcion: 'Crea una historia interactiva con decisiones y ramificaciones',
  icono: GitBranch,
  evaluable: true,
  editor: HistoriaRamificadaEditor,
  viewer: HistoriaRamificadaViewer,
  properties: HistoriaRamificadaProperties,
  createDefault: createDefaultHistoriaRamificada,
};

/** Actividades registradas del Grupo 4 y futuros grupos unificados. */
export const ACTIVITY_REGISTRY: ActivityRegistryEntry<Activity>[] = [
  CLASIFICAR_ENTRY as ActivityRegistryEntry<Activity>,
  MEMORIA_ENTRY as ActivityRegistryEntry<Activity>,
  PUZZLE_IMAGEN_ENTRY as ActivityRegistryEntry<Activity>,
  SOPA_LETRAS_ENTRY as ActivityRegistryEntry<Activity>,
  CRUCIGRAMA_ENTRY as ActivityRegistryEntry<Activity>,
  ABRIR_CAJA_ENTRY as ActivityRegistryEntry<Activity>,
  ANAGRAMA_ENTRY as ActivityRegistryEntry<Activity>,
  AHORCADO_ENTRY as ActivityRegistryEntry<Activity>,
  PUZZLE_PALABRAS_ENTRY as ActivityRegistryEntry<Activity>,
  GLOBOS_ENTRY as ActivityRegistryEntry<Activity>,
  TOPO_ENTRY as ActivityRegistryEntry<Activity>,
  HISTORIA_RAMIFICADA_ENTRY as ActivityRegistryEntry<Activity>,
];

const GRUPO4_TIPOS = new Set([
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'sopa_letras',
  'crucigrama',
  'abrir_caja',
  'anagrama',
  'ahorcado',
  'puzzle_palabras',
  'globos',
  'topo',
]);

export const GRUPO4_REGISTRY_ENTRIES = ACTIVITY_REGISTRY.filter((e) =>
  GRUPO4_TIPOS.has(e.tipo),
);

export function getActivityRegistryEntry(tipo: string): ActivityRegistryEntry | undefined {
  return ACTIVITY_REGISTRY.find((e) => e.tipo === tipo);
}

export function getActivityRegistryEntryByPanelType(
  panelType: string,
): ActivityRegistryEntry | undefined {
  return ACTIVITY_REGISTRY.find((e) => e.panelType === panelType);
}
