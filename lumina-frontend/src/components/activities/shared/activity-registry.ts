import type { LucideIcon } from 'lucide-react';
import {
  Grid2x2,
  Grid3x3,
  Layers,
  Puzzle,
  Package,
  CaseSensitive,
  AlignLeft,
  Search,
  Sparkles,
  Crosshair,
  GitBranch,
  Keyboard,
} from 'lucide-react';

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityRegistryEntry<T extends Activity = Activity> {
  tipo: T['tipo'];
  /** Identificador en el panel de actividades (drag & drop). */
  panelType: string;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  evaluable: boolean;
}

// ─── GRUPO 4 ──────────────────────────────────────────────────────────────────

// TODO(migración-etapa-7): retirar la fila `clasificar` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const CLASIFICAR_ENTRY: ActivityRegistryEntry<ClasificarActivity> = {
  tipo: 'clasificar',
  panelType: 'clasificar',
  nombre: 'Clasificar',
  descripcion: 'Arrastra cada elemento a su categoría correcta',
  icono: Layers,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `memoria` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const MEMORIA_ENTRY: ActivityRegistryEntry<MemoriaActivity> = {
  tipo: 'memoria',
  panelType: 'memoria',
  nombre: 'Memoria',
  descripcion: 'Encuentra todos los pares de cartas iguales',
  icono: Grid2x2,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `puzzle_imagen` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const PUZZLE_IMAGEN_ENTRY: ActivityRegistryEntry<PuzzleImagenActivity> = {
  tipo: 'puzzle_imagen',
  panelType: 'puzzle_imagen',
  nombre: 'Puzzle de imagen',
  descripcion: 'Arrastra las piezas para armar la imagen',
  icono: Puzzle,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `sopa_letras` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const SOPA_LETRAS_ENTRY: ActivityRegistryEntry<SopaLetrasActivity> = {
  tipo: 'sopa_letras',
  panelType: 'sopa_letras',
  nombre: 'Sopa de letras',
  descripcion: 'Encuentra las palabras escondidas en el grid',
  icono: Search,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `crucigrama` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const CRUCIGRAMA_ENTRY: ActivityRegistryEntry<CrucigramaActivity> = {
  tipo: 'crucigrama',
  panelType: 'crucigrama',
  nombre: 'Crucigrama',
  descripcion: 'Completa las palabras siguiendo las pistas',
  icono: Grid3x3,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `abrir_caja` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const ABRIR_CAJA_ENTRY: ActivityRegistryEntry<AbrirCajaActivity> = {
  tipo: 'abrir_caja',
  panelType: 'abrir_caja',
  nombre: 'Abrir caja',
  descripcion: 'Haz clic en las cajas para descubrir su contenido',
  icono: Package,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `anagrama` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const ANAGRAMA_ENTRY: ActivityRegistryEntry<AnagramaActivity> = {
  tipo: 'anagrama',
  panelType: 'anagrama',
  nombre: 'Anagrama',
  descripcion: 'Ordena las letras para formar la palabra correcta',
  icono: CaseSensitive,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `ahorcado` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const AHORCADO_ENTRY: ActivityRegistryEntry<AhorcadoActivity> = {
  tipo: 'ahorcado',
  panelType: 'ahorcado',
  nombre: 'Ahorcado',
  descripcion: 'Adivina la palabra letra por letra antes de quedarte sin intentos',
  icono: Keyboard,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `puzzle_palabras` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const PUZZLE_PALABRAS_ENTRY: ActivityRegistryEntry<PuzzlePalabrasActivity> = {
  tipo: 'puzzle_palabras',
  panelType: 'puzzle_palabras',
  nombre: 'Puzzle de palabras',
  descripcion: 'Ordena las palabras para formar la oración correcta',
  icono: AlignLeft,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `globos` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const GLOBOS_ENTRY: ActivityRegistryEntry<GlobosActivity> = {
  tipo: 'globos',
  panelType: 'globos',
  nombre: 'Globos',
  descripcion: 'Pincha el globo con la respuesta correcta antes de que escapen',
  icono: Sparkles,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `topo` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const TOPO_ENTRY: ActivityRegistryEntry<TopoActivity> = {
  tipo: 'topo',
  panelType: 'topo',
  nombre: 'Golpea al topo',
  descripcion: 'Golpea el topo con la respuesta correcta',
  icono: Crosshair,
  evaluable: true,
};

// TODO(migración-etapa-7): retirar la fila `historia_ramificada` de ACTIVITY_REGISTRY
// y borrar este archivo al completar la migración de elementos en E7.
// Ticket: LUM-E7-GRUPO4 · fecha objetivo: 2027-01-31.
const HISTORIA_RAMIFICADA_ENTRY: ActivityRegistryEntry<HistoriaRamificadaActivity> = {
  tipo: 'historia_ramificada',
  panelType: 'historia_ramificada',
  nombre: 'Historia ramificada',
  descripcion: 'Crea una historia interactiva con decisiones y ramificaciones',
  icono: GitBranch,
  evaluable: true,
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
