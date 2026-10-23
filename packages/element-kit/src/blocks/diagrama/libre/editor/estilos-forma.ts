// ─── Estilos predefinidos de forma (Y21) ──────────────────────────────────────
// Un estilo es un `ParcheVisual` (DY11, DY22): relleno, contorno, sombra y color del texto, con solo tokens `var(--…)` (DY12) salvo la
// sombra. Los tokens son los 17 que exporta el render (DY25). No toca tamaño, posición, giro, opacidad, tipografía ni el radio.

import { cambiarEstilo, type Escena, type ParcheVisual, type Relleno, type Sombra } from "@lumina/drawing";
import { ids, type Hoja } from "./propiedades.js";

export interface EstiloForma {
  id: string;
  nombre: string;
  parche: ParcheVisual & { estilo: NonNullable<ParcheVisual["estilo"]> & { relleno: Relleno }; estiloTexto: { color: string } };
}

const SOMBRA_SUAVE: Sombra = { color: "#00000033", desenfoque: 8, dx: 0, dy: 4 };

function estilo(id: string, nombre: string, relleno: Relleno, contorno: string, grosor: number, texto: string, sombra: Sombra | null = null): EstiloForma {
  return { id, nombre, parche: { estilo: { relleno, contorno: { color: contorno, grosor, patron: "solido" }, sombra }, estiloTexto: { color: texto } } };
}

const solido = (token: string): Relleno => ({ tipo: "solido", color: `var(--${token})` });

/** Los doce estilos de la galería, en su orden. */
export const ESTILOS_FORMA: readonly EstiloForma[] = [
  estilo("principal", "Principal", solido("primary"), "var(--primary)", 1.5, "var(--primary-foreground)"),
  estilo("acento-suave", "Acento suave", solido("secondary"), "var(--primary)", 2, "var(--foreground)"),
  estilo("solo-contorno", "Solo contorno", { tipo: "ninguno" }, "var(--foreground)", 2, "var(--foreground)"),
  estilo("invertido", "Invertido", solido("foreground"), "var(--foreground)", 1.5, "var(--background)"),
  estilo("neutro", "Neutro", solido("muted"), "var(--border)", 1, "var(--foreground)"),
  estilo("alerta", "Alerta", solido("destructive"), "var(--destructive)", 1.5, "var(--primary-foreground)"),
  estilo("alerta-suave", "Alerta suave", solido("muted"), "var(--destructive)", 2, "var(--foreground)"),
  estilo("exito", "Éxito", solido("muted"), "var(--chart-2)", 2, "var(--foreground)"),
  estilo("aviso", "Aviso", solido("muted"), "var(--chart-3)", 2, "var(--foreground)"),
  estilo("violeta", "Violeta", solido("muted"), "var(--chart-4)", 2, "var(--foreground)"),
  estilo("degradado", "Degradado", { tipo: "degradado", desde: "var(--foreground)", hasta: "var(--primary)", angulo: 90 }, "var(--foreground)", 0, "var(--primary-foreground)"),
  estilo("elevado", "Elevado", solido("background"), "var(--border)", 1, "var(--foreground)", SOMBRA_SUAVE),
];

export const estiloPorId = (id: string): EstiloForma | undefined => ESTILOS_FORMA.find((e) => e.id === id);

const igual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** ¿La hoja ya tiene el estilo? Un conector solo se mira por el color de su contorno. */
function tieneElEstilo(h: Hoja, e: EstiloForma): boolean {
  const { relleno, contorno, sombra } = e.parche.estilo;
  if (h.tipo === "linea") return h.estilo.contorno.color === contorno?.color;
  return (
    igual(h.estilo.relleno, relleno) &&
    h.estilo.contorno.color === contorno?.color &&
    h.estilo.contorno.grosor === contorno?.grosor &&
    h.estilo.contorno.patron === contorno?.patron &&
    igual(h.estilo.sombra, sombra) &&
    h.estiloTexto.color === e.parche.estiloTexto.color
  );
}

/** ¿Todo lo elegido tiene ya este estilo? Con una mezcla (o sin nada elegido) no hay ninguno marcado. */
export const estiloActivo = (destino: readonly Hoja[], e: EstiloForma): boolean => destino.length > 0 && destino.every((h) => tieneElEstilo(h, e));

/**
 * Aplica el estilo a las hojas de `destino`: relleno, contorno, sombra y color del texto de las formas y los textos; en un conector, solo
 * el color del contorno. Devuelve la misma escena si todo lo elegido ya lo tiene.
 */
export function aplicarEstiloForma(escena: Escena, destino: readonly Hoja[], e: EstiloForma): Escena {
  const pendientes = destino.filter((h) => !tieneElEstilo(h, e));
  if (pendientes.length === 0) return escena;
  const conArea = pendientes.filter((h) => h.tipo !== "linea");
  const lineas = pendientes.filter((h) => h.tipo === "linea");
  let r = conArea.length > 0 ? cambiarEstilo(escena, ids(conArea), e.parche) : escena;
  const color = e.parche.estilo.contorno?.color;
  if (lineas.length > 0 && color !== undefined) r = cambiarEstilo(r, ids(lineas), { estilo: { contorno: { color } } });
  return r;
}
