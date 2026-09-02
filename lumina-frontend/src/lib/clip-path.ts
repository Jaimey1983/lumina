import type { CSSProperties } from 'react';

import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '@/lib/canvas-guides';

import type {
  ClipContent,
  ClipContentImage,
  ClipShadow,
  ClipShape,
  ClipShapeTexto,
  ClipGroupBlock,
} from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { resolveFontFamily } from '@/lib/font-catalog';
import { normalizeTypography } from '@/lib/text-mask';
import {
  freeformPathToSvgD,
  normalizeFreeformPath,
  resolveFreeformPath,
} from '@/lib/freeform-mask';

export type ClipImageAjuste = NonNullable<ClipContentImage['ajuste']>;

/** Resultado de `generarClipPath`: path SVG en coords objectBoundingBox (0–1). */
export interface GeneratedClipPath {
  d: string;
}

/**
 * La edición del contorno freeform vive en `@/lib/freeform-mask`
 * (`FreeformMaskPath` / `MaskNode`) y en el editor Paper.js; aquí solo se
 * consume `freeformPathToSvgD` para el render y `resolveFreeformPath` /
 * `normalizeFreeformPath` para migrar y sanear la forma `libre`.
 */

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function regularPolygonPath(sides: number, cx = 0.5, cy = 0.5, r = 0.5): string {
  const n = clamp(Math.round(sides), 3, 24);
  const start = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (2 * Math.PI * i) / n;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

function starPath(puntas = 5, radioInterno = 0.4): string {
  const n = clamp(Math.round(puntas), 3, 12);
  const inner = clamp(radioInterno, 0.1, 0.9);
  const outerR = 0.5;
  const innerR = outerR * inner;
  const cx = 0.5;
  const cy = 0.5;
  const start = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = start + (Math.PI * i) / n;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

function roundedRectPath(borderRadiusPct = 0): string {
  const r = clamp(borderRadiusPct, 0, 50) / 100;
  const rx = r * 0.5;
  const ry = r * 0.5;
  if (rx <= 0 || ry <= 0) {
    return 'M 0,0 H 1 V 1 H 0 Z';
  }
  return [
    `M ${rx},0`,
    `H ${1 - rx}`,
    `A ${rx},${ry} 0 0 1 1,${ry}`,
    `V ${1 - ry}`,
    `A ${rx},${ry} 0 0 1 ${1 - rx},1`,
    `H ${rx}`,
    `A ${rx},${ry} 0 0 1 0,${1 - ry}`,
    `V ${ry}`,
    `A ${rx},${ry} 0 0 1 ${rx},0`,
    'Z',
  ].join(' ');
}

/**
 * Genera el atributo `d` de un `<path>` para `clipPathUnits="objectBoundingBox"`.
 */
export function generarClipPath(shape: ClipShape): GeneratedClipPath {
  switch (shape.tipo) {
    case 'rectangulo':
      return { d: roundedRectPath(shape.borderRadius ?? 0) };
    case 'circulo':
      return { d: 'M 0.5,0 A 0.5,0.5 0 1 1 0.499,0 Z' };
    case 'elipse':
      return { d: 'M 0.5,0 A 0.5,0.5 0 1 1 0.499,0 Z' };
    case 'triangulo':
      return { d: 'M 0.5,0 L 1,1 L 0,1 Z' };
    case 'estrella':
      return {
        d: starPath(shape.puntas ?? 5, shape.radioInterno ?? 0.4),
      };
    case 'hexagono':
      return { d: regularPolygonPath(6) };
    case 'poligono':
      return { d: regularPolygonPath(shape.lados) };
    case 'svg':
      return { d: shape.path.trim() || 'M 0,0 H 1 V 1 H 0 Z' };
    case 'texto':
      // `pathData` ya viene en coords objectBoundingBox (0–1) con las curvas
      // del glifo preservadas. Sin contorno todavía → caja completa (no recorta).
      return { d: shape.pathData.trim() || 'M 0,0 H 1 V 1 H 0 Z' };
    case 'libre':
      return { d: freeformPathToSvgD(resolveFreeformPath(shape)) };
    default:
      return { d: 'M 0,0 H 1 V 1 H 0 Z' };
  }
}

export function clipShapeLabel(shape: ClipShape): string {
  switch (shape.tipo) {
    case 'rectangulo':
      return 'Rectángulo';
    case 'circulo':
      return 'Círculo';
    case 'elipse':
      return 'Elipse';
    case 'triangulo':
      return 'Triángulo';
    case 'estrella':
      return 'Estrella';
    case 'hexagono':
      return 'Hexágono';
    case 'poligono':
      return `Polígono (${shape.lados})`;
    case 'svg':
      return 'SVG personalizado';
    case 'texto':
      return shape.text?.trim()
        ? `Texto: "${shape.text.trim().replace(/\r?\n/g, ' / ')}"`
        : 'Texto';
    case 'libre':
      return `Forma libre (${shape.path?.nodes?.length ?? shape.nodos?.length ?? 0} nodos)`;
    default:
      return 'Máscara';
  }
}

export function normalizeClipContentImage(
  content: ClipContentImage,
): Required<Pick<ClipContentImage, 'offsetX' | 'offsetY' | 'escala' | 'ajuste'>> &
  ClipContentImage {
  return {
    ...content,
    offsetX: content.offsetX ?? 0,
    offsetY: content.offsetY ?? 0,
    escala: content.escala ?? 1,
    ajuste: content.ajuste ?? 'cubrir',
  };
}

/**
 * Sombra visible con clip-path: `box-shadow` se recorta junto al contenido;
 * `filter: drop-shadow()` sigue el contorno recortado.
 */
export function formatClipDropShadow(shadow?: ClipShadow): string | undefined {
  if (!shadow) return undefined;
  const blur = shadow.blur ?? 0;
  const offsetX = shadow.offsetX ?? 0;
  const offsetY = shadow.offsetY ?? 0;
  if (!blur && !offsetX && !offsetY) return undefined;
  const color = shadow.color ?? 'rgba(0,0,0,0.25)';
  return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`;
}

/** Sanea un `ClipShapeTexto` hidratado desde JSON (campos ausentes / tipos sucios). */
export function normalizeTextClipShape(shape: ClipShapeTexto): ClipShapeTexto {
  const typo = normalizeTypography({
    fontScale: shape.fontScale,
    letterSpacing: shape.letterSpacing,
    lineHeight: shape.lineHeight,
    scaleX: shape.scaleX,
    scaleY: shape.scaleY,
    align: shape.align,
  });
  return {
    tipo: 'texto',
    text: typeof shape.text === 'string' ? shape.text : '',
    fontFamily: resolveFontFamily(
      typeof shape.fontFamily === 'string' ? shape.fontFamily : undefined,
    ),
    fontWeight:
      typeof shape.fontWeight === 'number' || typeof shape.fontWeight === 'string'
        ? shape.fontWeight
        : 400,
    pathData: typeof shape.pathData === 'string' ? shape.pathData : '',
    fillRule: 'nonzero',
    ...(typeof shape.aspect === 'number' && Number.isFinite(shape.aspect) && shape.aspect > 0
      ? { aspect: shape.aspect }
      : {}),
    fontScale: typo.fontScale,
    letterSpacing: typo.letterSpacing,
    lineHeight: typo.lineHeight,
    scaleX: typo.scaleX,
    scaleY: typo.scaleY,
    align: typo.align,
  };
}

/** Normaliza bbox, forma libre, contenido imagen y defaults de máscara. */
export function normalizeClipGroupBlock(block: ClipGroupBlock): ClipGroupBlock {
  let clipShape = block.clipShape;
  if (clipShape.tipo === 'libre') {
    // Migra el formato anterior (`nodos`/`cerrado`) al modelo nuevo `path`.
    clipShape = {
      tipo: 'libre',
      path: normalizeFreeformPath(resolveFreeformPath(clipShape)),
    };
  } else if (clipShape.tipo === 'texto') {
    clipShape = normalizeTextClipShape(clipShape);
  }

  const contenido =
    block.contenido.tipo === 'imagen'
      ? normalizeClipContentImage(block.contenido)
      : block.contenido;

  return {
    ...block,
    clipShape,
    contenido,
    opacidad: block.opacidad ?? 100,
    ...(block.borde !== undefined
      ? {
          borde: {
            color: block.borde.color ?? '#475569',
            grosor: block.borde.grosor ?? 2,
          },
        }
      : {}),
  };
}

/** Escala base (cover/contain) sin zoom adicional del usuario. */
export function getClipContentScale(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  ajuste: ClipImageAjuste,
): number {
  if (
    !imgNaturalWidth ||
    !imgNaturalHeight ||
    !containerWidth ||
    !containerHeight ||
    ajuste === 'llenar'
  ) {
    return 1;
  }
  const scaleX = containerWidth / imgNaturalWidth;
  const scaleY = containerHeight / imgNaturalHeight;
  return ajuste === 'contener' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
}

/**
 * Dimensiones absolutas de la imagen dentro de la máscara (sin recortar el bitmap).
 * El recorte visual lo hace overflow + clip-path del contenedor.
 */
export function getClipImageStyle(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  offsetXPct: number,
  offsetYPct: number,
  ajuste: ClipImageAjuste,
  extras?: Pick<CSSProperties, 'pointerEvents' | 'cursor' | 'userSelect'>,
): CSSProperties {
  const baseExtras: CSSProperties = {
    display: 'block',
    pointerEvents: extras?.pointerEvents ?? 'none',
    userSelect: extras?.userSelect ?? 'none',
    cursor: extras?.cursor,
  };

  if (!containerWidth || !containerHeight) {
    return {
      ...baseExtras,
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };
  }

  const offsetX = (offsetXPct / 100) * containerWidth;
  const offsetY = (offsetYPct / 100) * containerHeight;

  if (ajuste === 'llenar') {
    const finalWidth = containerWidth * escala;
    const finalHeight = containerHeight * escala;
    return {
      ...baseExtras,
      position: 'absolute',
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      top: `${(containerHeight - finalHeight) / 2 + offsetY}px`,
      left: `${(containerWidth - finalWidth) / 2 + offsetX}px`,
    };
  }

  if (!imgNaturalWidth || !imgNaturalHeight) {
    return {
      ...baseExtras,
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: ajuste === 'contener' ? 'contain' : 'cover',
    };
  }

  const baseScale = getClipContentScale(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    ajuste,
  );
  const finalWidth = imgNaturalWidth * baseScale * escala;
  const finalHeight = imgNaturalHeight * baseScale * escala;

  return {
    ...baseExtras,
    position: 'absolute',
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    top: `${(containerHeight - finalHeight) / 2 + offsetY}px`,
    left: `${(containerWidth - finalWidth) / 2 + offsetX}px`,
  };
}

/** Límite de pan en px para evitar áreas vacías dentro de la máscara. */
export function computeClipImagePanClamp(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  ajuste: ClipImageAjuste,
): { maxPanX: number; maxPanY: number } {
  if (!containerWidth || !containerHeight) {
    return { maxPanX: 0, maxPanY: 0 };
  }

  if (ajuste === 'llenar') {
    const renderedW = containerWidth * escala;
    const renderedH = containerHeight * escala;
    return {
      maxPanX: Math.max(0, (renderedW - containerWidth) / 2),
      maxPanY: Math.max(0, (renderedH - containerHeight) / 2),
    };
  }

  const natW = imgNaturalWidth || containerWidth;
  const natH = imgNaturalHeight || containerHeight;
  const baseScale = getClipContentScale(natW, natH, containerWidth, containerHeight, ajuste);
  const renderedW = natW * baseScale * escala;
  const renderedH = natH * baseScale * escala;

  return {
    maxPanX: Math.max(0, (renderedW - containerWidth) / 2),
    maxPanY: Math.max(0, (renderedH - containerHeight) / 2),
  };
}

export function clampClipImageOffsetPct(
  offsetXPct: number,
  offsetYPct: number,
  containerWidth: number,
  containerHeight: number,
  maxPanX: number,
  maxPanY: number,
): { offsetX: number; offsetY: number } {
  if (!containerWidth || !containerHeight) {
    return { offsetX: offsetXPct, offsetY: offsetYPct };
  }
  const maxXPct = (maxPanX / containerWidth) * 100;
  const maxYPct = (maxPanY / containerHeight) * 100;
  return {
    offsetX: clamp(offsetXPct, -maxXPct, maxXPct),
    offsetY: clamp(offsetYPct, -maxYPct, maxYPct),
  };
}

/** Reclampa offsets de imagen según escala, ajuste y tamaño del contenedor. */
export function clampClipContentImageOffsets(
  content: ClipContentImage,
  containerWidth: number,
  containerHeight: number,
  imgNaturalWidth = 0,
  imgNaturalHeight = 0,
): Pick<ClipContentImage, 'offsetX' | 'offsetY'> {
  const img = normalizeClipContentImage(content);
  const { maxPanX, maxPanY } = computeClipImagePanClamp(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    img.escala,
    img.ajuste,
  );
  return clampClipImageOffsetPct(
    img.offsetX,
    img.offsetY,
    containerWidth,
    containerHeight,
    maxPanX,
    maxPanY,
  );
}

/** Clamp de offsets usando bbox % del bloque sobre lienzo virtual 1280×720. */
export function clampClipImageOffsetsForBlock(
  content: ClipContentImage,
  blockAnchoPct: number,
  blockAltoPct: number,
  imgNaturalWidth = 0,
  imgNaturalHeight = 0,
): Pick<ClipContentImage, 'offsetX' | 'offsetY'> {
  const containerWidth = (blockAnchoPct / 100) * VIRTUAL_CANVAS_WIDTH;
  const containerHeight = (blockAltoPct / 100) * VIRTUAL_CANVAS_HEIGHT;
  return clampClipContentImageOffsets(
    content,
    containerWidth,
    containerHeight,
    imgNaturalWidth,
    imgNaturalHeight,
  );
}

export function createDefaultClipGroupBlock(
  clipShape: ClipShape,
  contenido?: ClipContent,
): ClipGroupBlock {
  const fb = BLOCK_FALLBACKS.clipGroup;
  return {
    tipo: 'clip-group',
    id: crypto.randomUUID(),
    clipShape,
    contenido: contenido ?? { tipo: 'color', valor: '#94a3b8' },
    borde: { color: '#475569', grosor: 2 },
    opacidad: 100,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  };
}

/**
 * Crea un `clip-group` con máscara de texto, dimensionando el bloque a la
 * proporción del contorno para que las letras no se estiren (con
 * `clipPathUnits="objectBoundingBox"` el path se escala al bbox del bloque).
 */
export function createTextClipGroupBlock(
  shape: ClipShapeTexto,
  contenido?: ClipContent,
): ClipGroupBlock {
  // Relleno azul de marca por defecto (más útil que el gris genérico para texto).
  const base = createDefaultClipGroupBlock(shape, contenido ?? { tipo: 'color', valor: '#2563EB' });
  const aspect = shape.aspect && shape.aspect > 0 ? shape.aspect : 4;
  const anchoPct = 55;
  const canvasRatio = VIRTUAL_CANVAS_WIDTH / VIRTUAL_CANVAS_HEIGHT;
  // visualAspect = (anchoPct·CANVAS_W) / (altoPct·CANVAS_H) = aspect  ⟹  altoPct
  const altoPct = clamp((anchoPct * canvasRatio) / aspect, 8, 80);
  return {
    ...base,
    // El contorno de texto fino se ve mejor sin trazo de borde.
    borde: undefined,
    ancho: anchoPct,
    alto: altoPct,
    x: (100 - anchoPct) / 2,
    y: (100 - altoPct) / 2,
  };
}

export function withClipGroupContent(
  block: ClipGroupBlock,
  patch: Partial<ClipContentImage>,
): ClipGroupBlock {
  if (block.contenido.tipo !== 'imagen') return block;
  return {
    ...block,
    contenido: { ...block.contenido, ...patch },
  };
}

/** CSS background para contenido color/gradiente dentro de la máscara. */
export function clipContentBackground(content: ClipContent): string {
  switch (content.tipo) {
    case 'color':
      return content.valor;
    case 'gradiente': {
      const dir = content.direccion ?? 180;
      return `linear-gradient(${dir}deg, ${content.inicio}, ${content.fin})`;
    }
    default:
      return '#94a3b8';
  }
}
