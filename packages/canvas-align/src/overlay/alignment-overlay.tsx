// <AlignmentOverlay> — render unificado de guías, cotas y badges del editor de
// canvas (Etapa G, G1). Reemplaza el doble overlay de hoy (`snapLines` +
// `<SpacingIndicators>`) por un solo lenguaje visual. Presentacional puro: no
// calcula snaps, sólo dibuja lo que `computeSnap` (G0) devuelve. G2 lo cablea.

import { useId, type CSSProperties, type ReactElement } from 'react';

import type { SnapLine } from '../snap.js';
import type { Measurement } from '../measurements.js';
import type { AlignRect } from '../obb.js';
import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from '../virtual-canvas.js';
import {
  Z,
  alignColor,
  guideSemantic,
  measurementSemantic,
  guideTicks,
  extensionSegment,
  resolveLabelCollisions,
  dimensionLabel,
  degreesLabel,
  pixelSnapX,
  pixelSnapY,
  type LabelBox,
} from './geometry.js';

export interface AlignmentOverlayProps {
  /** Guías de alineación / hueco / grilla (de `computeSnap().guides`). */
  guides?: SnapLine[];
  /** Cotas de distancia (de `computeSnap().measurements`). */
  measurements?: Measurement[];
  /** AABB del bloque activo, en % del lienzo — para ticks, badges y extensiones. */
  activeRect?: AlignRect | null;
  /** AABB de los vecinos, en % — para las líneas de extensión a objetos no solapados. */
  peerRects?: AlignRect[];
  /** Zoom del lienzo (1 = 100 %) — para el pixel-snap de las líneas. */
  zoom?: number;
  /** Rotación del bloque activo, en grados — muestra el badge `N°`. */
  rotationDeg?: number;
  /** Badge `W×H` / `X,Y` sobre el bloque activo. Default: sí si hay `activeRect`. */
  showDimensionBadge?: boolean;
  className?: string;
}

const PILL_H_PCT = (18 / VIRTUAL_CANVAS_HEIGHT) * 100;
function pillWidthPct(text: string): number {
  return ((text.length * 6.5 + 12) / VIRTUAL_CANVAS_WIDTH) * 100;
}

function Pill({
  text,
  leftPct,
  topPct,
  color,
}: {
  text: string;
  leftPct: number;
  topPct: number;
  color: string;
}): ReactElement {
  return (
    <span
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -50%)',
        background: color,
        color: '#fff',
        font: '600 10px/1.4 ui-sans-serif, system-ui, sans-serif',
        fontVariantNumeric: 'tabular-nums',
        padding: '1px 5px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
        zIndex: Z.measurement,
      }}
    >
      {text}
    </span>
  );
}

export function AlignmentOverlay({
  guides = [],
  measurements = [],
  activeRect = null,
  peerRects = [],
  zoom = 1,
  rotationDeg,
  showDimensionBadge,
  className,
}: AlignmentOverlayProps): ReactElement {
  const styleId = useId().replace(/[:]/g, '');
  const wantDim = showDimensionBadge ?? Boolean(activeRect);

  // ─── Guías ────────────────────────────────────────────────────────────────
  const guideEls: ReactElement[] = [];
  guides.forEach((g, i) => {
    const sem = guideSemantic(g);
    const color = alignColor(sem);
    const dashed = g.kind === 'gap';
    if (g.orientation === 'vertical') {
      const left = pixelSnapX(g.position, zoom);
      guideEls.push(
        <div
          key={`g-v-${i}`}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
            zIndex: Z.guideLine,
            pointerEvents: 'none',
          }}
        />,
      );
      guideTicks(g, activeRect).forEach((t, k) => {
        guideEls.push(
          <div
            key={`g-v-${i}-t-${k}`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${pixelSnapY(t.at, zoom)}%`,
              width: 7,
              height: 0,
              borderTop: `1px solid ${color}`,
              transform: 'translate(-50%, -50%)',
              zIndex: Z.guideLine,
              pointerEvents: 'none',
            }}
          />,
        );
      });
    } else {
      const top = pixelSnapY(g.position, zoom);
      guideEls.push(
        <div
          key={`g-h-${i}`}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: 0,
            right: 0,
            height: 0,
            borderTop: `1px ${dashed ? 'dashed' : 'solid'} ${color}`,
            zIndex: Z.guideLine,
            pointerEvents: 'none',
          }}
        />,
      );
      guideTicks(g, activeRect).forEach((t, k) => {
        guideEls.push(
          <div
            key={`g-h-${i}-t-${k}`}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: `${pixelSnapX(t.at, zoom)}%`,
              width: 0,
              height: 7,
              borderLeft: `1px solid ${color}`,
              transform: 'translate(-50%, -50%)',
              zIndex: Z.guideLine,
              pointerEvents: 'none',
            }}
          />,
        );
      });
    }
  });

  // ─── Líneas de extensión ─────────────────────────────────────────────────
  const extEls: ReactElement[] = [];
  if (activeRect) {
    guides.forEach((g, i) => {
      peerRects.forEach((peer, j) => {
        const seg = extensionSegment(g, activeRect, peer);
        if (!seg) return;
        const color = alignColor(guideSemantic(g));
        const lo = Math.min(seg.from, seg.to);
        const len = Math.abs(seg.to - seg.from);
        if (seg.orientation === 'vertical') {
          extEls.push(
            <div
              key={`ext-${i}-${j}`}
              style={{
                position: 'absolute',
                left: `${pixelSnapX(seg.pos, zoom)}%`,
                top: `${lo}%`,
                height: `${len}%`,
                width: 0,
                borderLeft: `1px dotted ${color}`,
                opacity: 0.7,
                zIndex: Z.extensionLine,
                pointerEvents: 'none',
              }}
            />,
          );
        } else {
          extEls.push(
            <div
              key={`ext-${i}-${j}`}
              style={{
                position: 'absolute',
                top: `${pixelSnapY(seg.pos, zoom)}%`,
                left: `${lo}%`,
                width: `${len}%`,
                height: 0,
                borderTop: `1px dotted ${color}`,
                opacity: 0.7,
                zIndex: Z.extensionLine,
                pointerEvents: 'none',
              }}
            />,
          );
        }
      });
    });
  }

  // ─── Cotas + pills (con anticolisión) ───────────────────────────────────
  const measEls: ReactElement[] = [];
  const labelBoxes: LabelBox[] = measurements.map((m, i) => {
    const text = `${Math.round(m.distance)} px`;
    const cx =
      m.type === 'horizontal' ? (m.minX_pct + m.maxX_pct) / 2 : m.minX_pct;
    const cy =
      m.type === 'horizontal' ? m.minY_pct : (m.minY_pct + m.maxY_pct) / 2;
    return { id: `m-${i}`, cx, cy, w: pillWidthPct(text), h: PILL_H_PCT };
  });
  const resolved = resolveLabelCollisions(labelBoxes);

  measurements.forEach((m, i) => {
    const color = alignColor(measurementSemantic(m));
    const text = `${Math.round(m.distance)} px`;
    if (m.type === 'horizontal') {
      measEls.push(
        <div
          key={`m-line-${i}`}
          style={{
            position: 'absolute',
            left: `${m.minX_pct}%`,
            width: `${m.maxX_pct - m.minX_pct}%`,
            top: `${m.minY_pct}%`,
            height: 0,
            borderTop: `1px dashed ${color}`,
            opacity: 0.85,
            zIndex: Z.measurement,
            pointerEvents: 'none',
          }}
        />,
      );
    } else {
      measEls.push(
        <div
          key={`m-line-${i}`}
          style={{
            position: 'absolute',
            top: `${m.minY_pct}%`,
            height: `${m.maxY_pct - m.minY_pct}%`,
            left: `${m.minX_pct}%`,
            width: 0,
            borderLeft: `1px dashed ${color}`,
            opacity: 0.85,
            zIndex: Z.measurement,
            pointerEvents: 'none',
          }}
        />,
      );
    }
    const box = resolved[i];
    measEls.push(
      <Pill key={`m-pill-${i}`} text={text} leftPct={box.cx} topPct={box.cy} color={color} />,
    );
  });

  // ─── Badges ─────────────────────────────────────────────────────────────
  const badges: ReactElement[] = [];
  if (activeRect && wantDim) {
    const d = dimensionLabel(activeRect);
    badges.push(
      <div
        key="dim-badge"
        data-testid="ca-dimension-badge"
        style={{
          position: 'absolute',
          left: `${activeRect.x}%`,
          top: `${activeRect.y}%`,
          transform: 'translate(0, calc(-100% - 4px))',
          background: alignColor('object'),
          color: '#fff',
          font: '600 10px/1.35 ui-sans-serif, system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
          zIndex: Z.badge,
        }}
      >
        {d.text}
        <span style={{ opacity: 0.75 }}>{`  ·  ${d.xPx}, ${d.yPx}`}</span>
      </div>,
    );
  }
  if (activeRect && typeof rotationDeg === 'number' && rotationDeg % 360 !== 0) {
    badges.push(
      <div
        key="deg-badge"
        data-testid="ca-degrees-badge"
        style={{
          position: 'absolute',
          left: `${activeRect.x + activeRect.ancho / 2}%`,
          top: `${activeRect.y + activeRect.alto + 1.5}%`,
          transform: 'translate(-50%, 0)',
          background: alignColor('object'),
          color: '#fff',
          font: '600 10px/1.4 ui-sans-serif, system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
          padding: '1px 5px',
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
          zIndex: Z.badge,
        }}
      >
        {degreesLabel(rotationDeg)}
      </div>,
    );
  }

  const rootStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'visible',
    pointerEvents: 'none',
  };

  const anim = `ca-in-${styleId}`;

  return (
    <div
      className={className}
      data-canvas-align-overlay=""
      aria-hidden="true"
      role="presentation"
      style={{ ...rootStyle, animation: `${anim} 80ms ease-out` }}
    >
      <style>{`
        @keyframes ${anim} { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          [data-canvas-align-overlay] { animation: none !important }
        }
      `}</style>
      {extEls}
      {guideEls}
      {measEls}
      {badges}
    </div>
  );
}
