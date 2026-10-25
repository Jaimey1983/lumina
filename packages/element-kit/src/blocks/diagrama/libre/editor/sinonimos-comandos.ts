import { TIPOS_FORMA, type TipoForma } from "@lumina/drawing";
import type { DiagramaPaletaId } from "@lumina/types/slide";
import { PALETAS_DIAGRAMA } from "../../diagrama-temas.js";
import { ESTILOS_FORMA } from "./estilos-forma.js";

// Sinónimos de búsqueda por id de comando (Y5). La etiqueta oficial sigue en el registro; acá solo ayudas al buscador.

/** Palabras con las que se busca una forma además de su nombre. */
const PALABRAS_DE_FORMA: Partial<Record<TipoForma, readonly string[]>> = {
  rectangulo: ["caja", "cuadro"],
  "rectangulo-redondeado": ["caja", "cuadro"],
  "flecha-derecha": ["flecha"],
  "flecha-izquierda": ["flecha"],
  "flecha-doble": ["flecha"],
};

/** Palabras alternativas por comando (minúsculas, sin acentos en el mapa; la consulta se normaliza igual). */
export const SINONIMOS_POR_COMANDO: Readonly<Record<string, readonly string[]>> = {
  "alinear-izquierda": ["alinear"],
  "alinear-centro": ["alinear"],
  "alinear-derecha": ["alinear"],
  "alinear-arriba": ["alinear"],
  "alinear-medio": ["alinear"],
  "alinear-abajo": ["alinear"],
  eliminar: ["borrar", "quitar", "suprimir"],
  "vinetas-puntos": ["lista", "vinetas", "viñetas", "puntos", "bullets", "balas"],
  "ajustar-al-texto": ["autoajuste", "crecer", "caber", "tamaño del texto", "tamano del texto", "ajustar forma", "alto"],
  "crecer-al-escribir": ["autoajuste", "crecer", "agrandar", "forma crece", "escribir", "preferencia"],
  "vinetas-numeros": ["lista", "numerada", "numeros", "numeración", "enumerar", "enumeracion"],
  "eliminar-rama": ["rama", "subarbol", "mapa mental"],
  "crear-hijo": ["hijo", "mapa mental", "rama"],
  "crear-hermano": ["hermano", "mapa mental"],
  esquema: ["pegar esquema", "outline", "lista", "indice", "texto a diagrama", "mapa mental", "arbol", "importar"],
  "conectar-cadena": ["cadena", "enlazar", "secuencia", "flujo"],
  "pegar-al-mas-cercano": ["pegar", "extremo libre", "huerfano", "conectar extremo"],
  copiar: ["copy", "portapapeles"],
  cortar: ["cut", "mover", "portapapeles"],
  pegar: ["paste", "portapapeles"],
  "pegar-en-sitio": ["pegar", "paste", "portapapeles", "misma posicion"],
  "copiar-formato": ["pincel", "brocha", "estilo", "formato", "copiar estilo"],
  "aplicar-formato": ["pincel", "brocha", "estilo", "formato", "pegar formato", "pegar estilo"],
  duplicar: ["copiar", "clonar"],
  agrupar: ["juntar", "unir"],
  desagrupar: ["separar", "desunir"],
  "orden-frente": ["capa", "apilar", "frente"],
  "orden-subir": ["capa", "apilar", "frente"],
  "orden-bajar": ["capa", "apilar", "fondo"],
  "orden-fondo": ["capa", "apilar", "fondo"],
  acercar: ["zoom", "ampliar", "lupa"],
  alejar: ["zoom", "reducir", "lupa"],
  "ajustar-vista": ["zoom", "lupa"],
  "girar-pagina": ["orientación", "vertical", "horizontal", "apaisado", "rotar página", "tamaño de página"],
  cuadricula: ["rejilla"],
  imantar: ["iman", "magnetico"],
  flecha: ["flecha"],
  "forma-flecha-derecha": ["flecha"],
  "forma-flecha-izquierda": ["flecha"],
  "forma-flecha-doble": ["flecha"],
  "forma-rectangulo": ["caja", "cuadro"],
  "forma-rectangulo-redondeado": ["caja", "cuadro"],
  ...Object.fromEntries(TIPOS_FORMA.map((t) => [`cambiar-forma-${t}`, ["transformar", "convertir", ...(PALABRAS_DE_FORMA[t] ?? [])]] as const)),
  ...Object.fromEntries(ESTILOS_FORMA.map((e) => [`estilo-${e.id}`, ["estilo", "aspecto", "formato", "color"]] as const)),
  ...Object.fromEntries((Object.keys(PALETAS_DIAGRAMA) as DiagramaPaletaId[]).map((p) => [`tema-${p}`, ["tema", "paleta", "colores", "colorear"]] as const)),
  listo: ["terminar", "cerrar", "guardar"],
  deshacer: ["atras"],
  rehacer: ["adelante"],
};
