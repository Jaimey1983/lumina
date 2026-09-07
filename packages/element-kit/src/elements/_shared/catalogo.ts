import type { ElementCatalogo } from "@lumina/element-kit-core";

/**
 * E7.1 — metadata de catálogo por elemento, en un solo lugar (fuente única
 * desde E7.2/E7.3). Cada `*-definition.ts` la referencia como
 * `catalogo: CATALOGO_ELEMENTOS["<tipo>"]`.
 *
 * De dónde salieron los datos (registros ya borrados):
 *  - widgets: `widget-registry.ts` (`WIDGET_LABELS`, borrado E7.2) +
 *    `widget-panel-catalog.ts` (`WIDGET_PANEL_META.group`).
 *  - actividades Grupo 4: `activity-registry.ts` (`ACTIVITY_REGISTRY`, borrado E7.3).
 *  - actividades clásicas: mapa `titles` de `editor-client.tsx`.
 *  - bloques / primitivos: nombres del editor.
 *
 * La presentación del panel (icono lucide, clases Tailwind, orden) NO va acá:
 * se queda en el frontend, keyed por `tipo`.
 */
export const CATALOGO_ELEMENTOS = {
  // ─── Widgets ───────────────────────────────────────────────────────────────
  boton: { nombre: "Botón", familia: "widget", grupo: "control" },
  ruleta: { nombre: "Ruleta", familia: "widget", grupo: "lienzo" },
  "flip-cards": { nombre: "Flip Cards", familia: "widget", grupo: "lienzo" },
  tabs: { nombre: "Tabs", familia: "widget", grupo: "lienzo" },
  carousel: { nombre: "Carousel", familia: "widget", grupo: "lienzo" },
  "click-reveal": {
    nombre: "Click to Reveal",
    familia: "widget",
    grupo: "lienzo",
  },
  timeline: { nombre: "Línea de tiempo", familia: "widget", grupo: "lienzo" },
  popup: { nombre: "Popup", familia: "widget", grupo: "overlay" },
  hotspot: { nombre: "Hotspot", familia: "widget", grupo: "control" },
  tooltip: {
    nombre: "Tooltip emergente",
    familia: "widget",
    grupo: "control",
  },
  contador: {
    nombre: "Contador / temporizador",
    familia: "widget",
    grupo: "control",
  },
  progreso: {
    nombre: "Barra de progreso",
    familia: "widget",
    grupo: "control",
  },

  // ─── Actividades Grupo 4 ───────────────────────────────────────────────────
  clasificar: {
    nombre: "Clasificar",
    descripcion: "Arrastra cada elemento a su categoría correcta",
    familia: "actividad",
  },
  memoria: {
    nombre: "Memoria",
    descripcion: "Encuentra todos los pares de cartas iguales",
    familia: "actividad",
  },
  puzzle_imagen: {
    nombre: "Puzzle de imagen",
    descripcion: "Arrastra las piezas para armar la imagen",
    familia: "actividad",
  },
  sopa_letras: {
    nombre: "Sopa de letras",
    descripcion: "Encuentra las palabras escondidas en el grid",
    familia: "actividad",
  },
  crucigrama: {
    nombre: "Crucigrama",
    descripcion: "Completa las palabras siguiendo las pistas",
    familia: "actividad",
  },
  abrir_caja: {
    nombre: "Abrir caja",
    descripcion: "Haz clic en las cajas para descubrir su contenido",
    familia: "actividad",
  },
  anagrama: {
    nombre: "Anagrama",
    descripcion: "Ordena las letras para formar la palabra correcta",
    familia: "actividad",
  },
  ahorcado: {
    nombre: "Ahorcado",
    descripcion:
      "Adivina la palabra letra por letra antes de quedarte sin intentos",
    familia: "actividad",
  },
  puzzle_palabras: {
    nombre: "Puzzle de palabras",
    descripcion: "Ordena las palabras para formar la oración correcta",
    familia: "actividad",
  },
  globos: {
    nombre: "Globos",
    descripcion: "Pincha el globo con la respuesta correcta antes de que escapen",
    familia: "actividad",
  },
  topo: {
    nombre: "Golpea al topo",
    descripcion: "Golpea el topo con la respuesta correcta",
    familia: "actividad",
  },
  historia_ramificada: {
    nombre: "Historia ramificada",
    descripcion:
      "Crea una historia interactiva con decisiones y ramificaciones",
    familia: "actividad",
  },

  // ─── Actividades clásicas ──────────────────────────────────────────────────
  quiz_multiple: { nombre: "Opción múltiple", familia: "actividad" },
  verdadero_falso: { nombre: "Verdadero o falso", familia: "actividad" },
  completar_blancos: { nombre: "Completar blancos", familia: "actividad" },
  short_answer: { nombre: "Respuesta corta", familia: "actividad" },
  arrastrar_soltar: { nombre: "Arrastrar y soltar", familia: "actividad" },
  emparejar: { nombre: "Emparejar", familia: "actividad" },
  ordenar_pasos: { nombre: "Ordenar pasos", familia: "actividad" },
  video_interactivo: { nombre: "Video interactivo", familia: "actividad" },
  encuesta_viva: { nombre: "Encuesta en vivo", familia: "actividad" },
  nube_palabras: { nombre: "Nube de palabras", familia: "actividad" },

  // ─── Bloques con canvas ────────────────────────────────────────────────────
  grafico: { nombre: "Gráfico de datos", familia: "bloque" },
  diagrama: { nombre: "Diagrama", familia: "bloque" },
  "clip-group": { nombre: "Recorte / máscara", familia: "bloque" },

  // ─── Primitivos ────────────────────────────────────────────────────────────
  texto: { nombre: "Texto", familia: "primitivo" },
  imagen: { nombre: "Imagen", familia: "primitivo" },
  video: { nombre: "Video", familia: "primitivo" },
  audio: { nombre: "Audio", familia: "primitivo" },
  codigo: { nombre: "Código", familia: "primitivo" },
  cita: { nombre: "Cita", familia: "primitivo" },
  separador: { nombre: "Separador", familia: "primitivo" },
  columnas: { nombre: "Columnas", familia: "primitivo" },
} as const satisfies Record<string, ElementCatalogo>;

export type CatalogoTipo = keyof typeof CATALOGO_ELEMENTOS;
