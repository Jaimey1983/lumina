import type { CSSProperties } from 'react';
import type { AparienciaEstado } from '@lumina/types/interaction';
import { sanearApariencia } from '@lumina/interactions';

/**
 * N6 — traduce una `AparienciaEstado` declarativa a estilo del contenedor del
 * bloque. Solo estas propiedades llegan al DOM: nunca CSS libre. Los valores se
 * vuelven a sanear aquí por si el JSON del bloque trae algo fuera de rango.
 */
const SOMBRAS: readonly string[] = [
  'none',
  '0 1px 3px rgba(0,0,0,0.30)',
  '0 4px 10px rgba(0,0,0,0.30)',
  '0 8px 20px rgba(0,0,0,0.35)',
];

export function aparienciaACss(a: AparienciaEstado | undefined): CSSProperties {
  if (a === undefined) return {};
  const v = sanearApariencia(a);
  const css: CSSProperties = {};
  if (v.opacidad !== undefined) css.opacity = v.opacidad;
  // `scale` (propiedad individual) y no `transform`: no pisa la rotación ni las animaciones.
  if (v.escala !== undefined) css.scale = String(v.escala);
  if (v.fondo !== undefined) css.backgroundColor = v.fondo;
  if (v.borde !== undefined) {
    css.outline = `2px solid ${v.borde}`;
    css.outlineOffset = '-2px';
  }
  if (v.sombra !== undefined) css.boxShadow = SOMBRAS[Math.round(v.sombra)] ?? 'none';
  if (v.brillo !== undefined) css.filter = `brightness(${v.brillo})`;
  return css;
}

/** Une apariencias en orden: la última pisa a la anterior en cada propiedad. */
export function combinarAparienciasCss(
  ...capas: (AparienciaEstado | undefined)[]
): CSSProperties {
  return Object.assign({}, ...capas.map(aparienciaACss)) as CSSProperties;
}
