// Ayudas solo para las pruebas del editor (no se publican: ver tsconfig.build.json).
import { normalizarEscena, type Elemento, type Escena, type Forma, type Linea } from "@lumina/drawing";
import { fireEvent, screen } from "@testing-library/react";

type Crudo = Record<string, unknown>;

export const forma = (id: string, x: number, y: number, ancho = 100, alto = 60, extra: Crudo = {}): Crudo => ({
  id,
  tipo: "forma",
  forma: "rectangulo",
  transformacion: { x, y, ancho, alto, rotacion: 0 },
  ...extra,
});

export const linea = (id: string, puntos: Array<[number, number]>, extra: Crudo = {}): Crudo => ({
  id,
  tipo: "linea",
  puntos: puntos.map(([x, y]) => ({ x, y })),
  ...extra,
});

export const grupo = (id: string, hijos: string[], extra: Crudo = {}): Crudo => ({ id, tipo: "grupo", hijos, ...extra });

export const escena = (...elementos: Crudo[]): Escena => normalizarEscena({ ancho: 1000, alto: 600, elementos });

export const get = (e: Escena, id: string): Elemento => {
  const el = e.elementos.find((x) => x.id === id);
  if (!el) throw new Error(`No existe ${id}`);
  return el;
};
export const getForma = (e: Escena, id: string): Forma => get(e, id) as Forma;
export const getLinea = (e: Escena, id: string): Linea => get(e, id) as Linea;
export const ids = (e: Escena): string[] => e.elementos.map((x) => x.id);

// ─── Cinta (Y2) ───────────────────────────────────────────────────────────────
// La cinta solo monta la pestaña visible: para tocar un botón hay que abrir antes su pestaña.

const PESTANA_DE_COMANDO: Array<[RegExp, string]> = [
  [/^(Seleccionar|Línea|Flecha|Texto|Duplicar|Eliminar|Agregar hijo|Agregar hermano|Borrar rama|Copiar|Cortar|Pegar|Pegar en el mismo sitio|Copiar formato|Aplicar formato|Seleccionar todo)$/, "Inicio"],
  [/^(Conectar en cadena|Esquema…)$/, "Insertar"],
  [/^Insertar /, "Insertar"],
  [/^(Organizar automáticamente|Agrupar|Desagrupar|Traer al frente|Subir un nivel|Bajar un nivel|Enviar al fondo|Alinear |Centrar |Distribuir )/, "Organizar"],
  [/^(Alejar|Acercar|Ajustar a la ventana|Cuadrícula|Imantar a otros elementos|Reglas|Quitar guías|Atajos de teclado|Girar la página)$/, "Vista"],
];

/** Abre una pestaña de la cinta por su nombre. */
export function irAPestana(nombre: string): void {
  fireEvent.click(screen.getByRole("tab", { name: nombre }));
}

/** El botón de un comando de la cinta, abriendo antes su pestaña (Deshacer y Rehacer están siempre a la vista). */
export function botonCinta(nombre: string): HTMLButtonElement {
  const pestana = PESTANA_DE_COMANDO.find(([re]) => re.test(nombre))?.[1];
  if (pestana) irAPestana(pestana);
  return screen.getByRole("button", { name: nombre }) as HTMLButtonElement;
}

/** Un botón de la cinta está deshabilitado (`aria-disabled`, para que siga enfocable y explique el motivo). */
export const deshabilitado = (boton: HTMLElement): boolean => boton.getAttribute("aria-disabled") === "true";
