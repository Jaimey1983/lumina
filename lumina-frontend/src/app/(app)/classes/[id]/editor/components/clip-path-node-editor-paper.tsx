'use client';

/**
 * Editor de nodos Bézier del contorno freeform de una máscara de recorte.
 *
 * Motor: Paper.js (scope aislado sobre un <canvas> dedicado). Paper.js NO forma
 * parte del render final: al confirmar se exporta a `FreeformMaskPath` y el resto
 * de la plataforma sigue dibujando la máscara con SVG puro.
 *
 * Comportamiento (v1):
 *  - Manijas (`handleIn`/`handleOut`) independientes por defecto — sin toggle de
 *    tipo de nodo, sin sincronización automática.
 *  - Arrastrar el ancla mueve el punto con sus dos manijas (Paper las guarda
 *    relativas al punto).
 *  - Clic sobre el trazo = insertar nodo (`path.divideAt`, preserva la forma).
 *  - Alt+clic sobre un nodo / Supr con el nodo bajo el cursor = eliminar nodo.
 *  - Shift al mover una manija = ajusta el ángulo a 0/45/90/135° (en espacio
 *    normalizado, para que coincida con el render no uniforme del clipPath).
 *  - Contorno abierto y vacío ⇒ modo "dibujar": clic añade nodo, arrastre crea
 *    manijas; clic sobre el primer nodo (≥3) cierra el contorno.
 *  - Esquinas vivas (estilo Illustrator): cada esquina recta de un contorno
 *    cerrado muestra un tirador verde sobre la bisectriz; arrastrarlo hacia
 *    dentro redondea la esquina (`MaskNode.cornerRadius`); hacia el vértice la
 *    vuelve a dejar en pico.
 */

import { useCallback, useEffect, useRef } from 'react';
import paperjs from 'paper/dist/paper-core';

import {
  computeCornerFillet,
  createMaskNodeId,
  normalizeFreeformPath,
} from '@/lib/freeform-mask';
import type { FreeformMaskPath, MaskNode } from '@/types/slide.types';

const HIT_TOLERANCE = 10; // px — área de hit más generosa que el visual
const ANCHOR_R = 4.5;
const HANDLE_R = 3.5;
const CORNER_R = 4; // radio visual del tirador de esquina
const CORNER_MIN_PX = 16; // separación mínima del tirador respecto al vértice
const ACCENT = '#2563eb';
const HANDLE_COLOR = '#f97316';
const CORNER_COLOR = '#10b981';

export interface ClipPathNodeEditorPaperProps {
  path: FreeformMaskPath;
  onCommit: (path: FreeformMaskPath) => void;
  onLiveChange?: (path: FreeformMaskPath) => void;
}

type DragState =
  | { kind: 'anchor'; index: number }
  | { kind: 'handleIn'; index: number }
  | { kind: 'handleOut'; index: number }
  | { kind: 'pull'; index: number }
  | { kind: 'corner'; index: number }
  | { kind: 'draw'; index: number }
  | null;

function snapAngle(vx: number, vy: number): { x: number; y: number } {
  const len = Math.hypot(vx, vy);
  if (len < 1e-6) return { x: vx, y: vy };
  const step = Math.PI / 4;
  const ang = Math.round(Math.atan2(vy, vx) / step) * step;
  return { x: Math.cos(ang) * len, y: Math.sin(ang) * len };
}

export function ClipPathNodeEditorPaper({
  path,
  onCommit,
  onLiveChange,
}: ClipPathNodeEditorPaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<paper.PaperScope | null>(null);
  const geoRef = useRef<paper.Path | null>(null);
  const uiLayerRef = useRef<paper.Layer | null>(null);
  const geoLayerRef = useRef<paper.Layer | null>(null);
  const idsRef = useRef<string[]>([]);
  const radiiRef = useRef<number[]>([]); // cornerRadius normalizado, paralelo a segments
  const dragRef = useRef<DragState>(null);
  const hoverRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 1, h: 1 });
  const pathRef = useRef(path);
  const lastAppliedRef = useRef<string>('');

  const onCommitRef = useRef(onCommit);
  const onLiveRef = useRef(onLiveChange);
  onCommitRef.current = onCommit;
  onLiveRef.current = onLiveChange;

  /**
   * paper.Path → FreeformMaskPath (px → normalizado). `normalizeFreeformPath`
   * (en `commit`/`live`) es quien clampa a 0–1 y anula manijas de longitud ~0.
   */
  const exportPath = useCallback((): FreeformMaskPath => {
    const geo = geoRef.current;
    if (!geo) return normalizeFreeformPath(pathRef.current);
    const { w, h } = sizeRef.current;
    const nodes: MaskNode[] = geo.segments.map((seg, i) => {
      const node: MaskNode = {
        id: idsRef.current[i] ?? createMaskNodeId(),
        point: { x: seg.point.x / w, y: seg.point.y / h },
        handleIn: seg.handleIn.length ? { x: seg.handleIn.x / w, y: seg.handleIn.y / h } : null,
        handleOut: seg.handleOut.length
          ? { x: seg.handleOut.x / w, y: seg.handleOut.y / h }
          : null,
      };
      const r = radiiRef.current[i] ?? 0;
      if (r > 1e-4) node.cornerRadius = r;
      return node;
    });
    return { closed: geo.closed, nodes };
  }, []);

  const commit = useCallback(() => {
    const next = normalizeFreeformPath(exportPath());
    lastAppliedRef.current = JSON.stringify(next);
    onCommitRef.current(next);
  }, [exportPath]);

  const live = useCallback(() => {
    onLiveRef.current?.(normalizeFreeformPath(exportPath()));
  }, [exportPath]);

  /**
   * Tirador de esquina viva (estilo Illustrator) para el nodo `i`, o `null` si
   * ese nodo no admite redondeo (contorno abierto, con manijas o arista vecina
   * curva). `widgetPos` es la posición del tirador en px.
   */
  const cornerWidget = useCallback((geo: paper.Path, i: number) => {
    if (!geo.closed) return null;
    const n = geo.segments.length;
    if (n < 3) return null;
    const seg = geo.segments[i];
    const prev = geo.segments[(i - 1 + n) % n];
    const next = geo.segments[(i + 1) % n];
    if (!seg || !prev || !next) return null;
    if (seg.handleIn.length > 1e-6 || seg.handleOut.length > 1e-6) return null;
    if (prev.handleOut.length > 1e-6 || next.handleIn.length > 1e-6) return null;

    const { w, h } = sizeRef.current;
    const avg = (w + h) / 2 || 1;
    const rPx = Math.max((radiiRef.current[i] ?? 0) * avg, 1);
    const f = computeCornerFillet(
      { x: prev.point.x, y: prev.point.y },
      { x: seg.point.x, y: seg.point.y },
      { x: next.point.x, y: next.point.y },
      rPx,
    );
    if (!f) return null;
    const bis = new paperjs.Point(f.bisector.x, f.bisector.y);
    const widgetPos = seg.point.add(bis.multiply(Math.max(f.trim, CORNER_MIN_PX)));
    return { widgetPos, fillet: f, active: (radiiRef.current[i] ?? 0) > 1e-4 };
  }, []);

  /** Redibuja anclas, manijas y tiradores de esquina en la capa de UI. */
  const redrawUi = useCallback(() => {
    const scope = scopeRef.current;
    const geo = geoRef.current;
    const ui = uiLayerRef.current;
    if (!scope || !geo || !ui) return;
    scope.activate();
    ui.removeChildren();
    ui.activate();

    const dot = (center: paper.Point, r: number, fill: string, stroke: string) =>
      new paperjs.Path.Circle({ center, radius: r, fillColor: fill, strokeColor: stroke, strokeWidth: 1.5 });

    const drawHandle = (anchor: paper.Point, tip: paper.Point, hovered: boolean) => {
      new paperjs.Path.Line({ from: anchor, to: tip, strokeColor: HANDLE_COLOR, strokeWidth: 1 });
      dot(tip, hovered ? HANDLE_R + 1.5 : HANDLE_R, '#fff', HANDLE_COLOR);
    };

    geo.segments.forEach((seg, i) => {
      const id = idsRef.current[i];
      if (seg.handleIn.length > 1e-6) {
        drawHandle(seg.point, seg.point.add(seg.handleIn), hoverRef.current === `in:${id}`);
      }
      if (seg.handleOut.length > 1e-6) {
        drawHandle(seg.point, seg.point.add(seg.handleOut), hoverRef.current === `out:${id}`);
      }

      const anchorHov = hoverRef.current === `anchor:${id}`;
      dot(seg.point, anchorHov ? ANCHOR_R + 1.5 : ANCHOR_R, anchorHov ? ACCENT : '#fff', ACCENT);

      const cw = cornerWidget(geo, i);
      if (cw) {
        if (cw.active) {
          const f = cw.fillet;
          const guide = new paperjs.Path({
            strokeColor: CORNER_COLOR,
            strokeWidth: 1.25,
            dashArray: [3, 2],
          });
          guide.moveTo(new paperjs.Point(f.a.x, f.a.y));
          guide.cubicCurveTo(
            new paperjs.Point(f.cpA.x, f.cpA.y),
            new paperjs.Point(f.cpB.x, f.cpB.y),
            new paperjs.Point(f.b.x, f.b.y),
          );
        }
        const cornerHov = hoverRef.current === `corner:${id}`;
        dot(
          cw.widgetPos,
          cornerHov ? CORNER_R + 1.5 : CORNER_R,
          cw.active || cornerHov ? CORNER_COLOR : '#fff',
          CORNER_COLOR,
        );
      }
    });

    geoLayerRef.current?.activate();
    scope.view.requestUpdate();
  }, [cornerWidget]);

  /** FreeformMaskPath → paper.Path (coords px). */
  const buildGeometry = useCallback(
    (src: FreeformMaskPath) => {
      const scope = scopeRef.current;
      const geoLayer = geoLayerRef.current;
      if (!scope || !geoLayer) return;
      scope.activate();
      geoLayer.activate();
      const { w, h } = sizeRef.current;
      const norm = normalizeFreeformPath(src);
      idsRef.current = norm.nodes.map((n) => n.id || createMaskNodeId());
      radiiRef.current = norm.nodes.map((n) => n.cornerRadius ?? 0);

      geoRef.current?.remove();
      geoRef.current = new paperjs.Path({
        segments: norm.nodes.map((n) => {
          const pt = new paperjs.Point(n.point.x * w, n.point.y * h);
          const hIn = n.handleIn
            ? new paperjs.Point(n.handleIn.x * w, n.handleIn.y * h)
            : undefined;
          const hOut = n.handleOut
            ? new paperjs.Point(n.handleOut.x * w, n.handleOut.y * h)
            : undefined;
          return new paperjs.Segment(pt, hIn, hOut);
        }),
        closed: norm.closed,
        strokeColor: ACCENT,
        strokeWidth: 1.5,
        fillColor: new paperjs.Color(37 / 255, 99 / 255, 235 / 255, 0.08),
      });
      redrawUi();
    },
    [redrawUi],
  );

  // ── Setup del scope Paper.js (una vez) ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scope = new paperjs.PaperScope();
    scope.setup(canvas);
    scope.activate();
    scope.settings.handleSize = 0; // dibujamos nuestras propias manijas
    scopeRef.current = scope;

    geoLayerRef.current = scope.project.activeLayer;
    uiLayerRef.current = new paperjs.Layer();
    geoLayerRef.current.activate();

    let disposed = false;
    const applySize = () => {
      if (disposed || !scope.view || dragRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      sizeRef.current = { w, h };
      scope.view.viewSize = new paperjs.Size(w, h);
      buildGeometry(pathRef.current);
    };
    applySize();

    const ro = new ResizeObserver(applySize);
    ro.observe(canvas);

    const hitOpts = {
      segments: true,
      handles: true,
      stroke: true,
      fill: false,
      tolerance: HIT_TOLERANCE,
    };

    const modsOf = (e: paper.ToolEvent): { shift: boolean; alt: boolean } => {
      const m =
        (e as unknown as { modifiers?: { shift?: boolean; option?: boolean; alt?: boolean } })
          .modifiers ?? {};
      return { shift: !!m.shift, alt: !!(m.option || m.alt) };
    };
    const cursor = (c: string) => {
      canvas.style.cursor = c;
    };

    /** Vector px con su ángulo ajustado a 45° si `shift` (en espacio normalizado). */
    const maybeSnap = (v: paper.Point, shift: boolean): paper.Point => {
      if (!shift) return v;
      const { w, h } = sizeRef.current;
      const s = snapAngle(v.x / w, v.y / h);
      return new paperjs.Point(s.x * w, s.y * h);
    };

    /** Alterna manijas de un nodo: las crea desde la tangente de los vecinos, o
     *  las elimina si ya existen. (No es un "tipo de nodo": tras crearse, cada
     *  manija se mueve de forma independiente.) */
    const toggleHandles = (geo: paper.Path, idx: number) => {
      const seg = geo.segments[idx];
      if (!seg) return;
      if (seg.handleIn.length > 1e-6 || seg.handleOut.length > 1e-6) {
        seg.handleIn = new paperjs.Point(0, 0);
        seg.handleOut = new paperjs.Point(0, 0);
        return;
      }
      const n = geo.segments.length;
      const prev = geo.segments[(idx - 1 + n) % n] ?? seg;
      const next = geo.segments[(idx + 1) % n] ?? seg;
      let dir = next.point.subtract(prev.point);
      if (dir.length < 1e-6) dir = new paperjs.Point(1, 0);
      dir = dir.normalize();
      const adj = Math.min(
        prev.point.getDistance(seg.point) || 40,
        next.point.getDistance(seg.point) || 40,
      );
      const len = Math.max(8, adj * 0.33);
      seg.handleOut = dir.multiply(len);
      seg.handleIn = dir.multiply(-len);
    };

    /** Índice del nodo cuyo tirador de esquina está bajo `point`, o -1. */
    const cornerHitTest = (geo: paper.Path, point: paper.Point): number => {
      for (let i = 0; i < geo.segments.length; i += 1) {
        const cw = cornerWidget(geo, i);
        if (cw && cw.widgetPos.getDistance(point) <= HIT_TOLERANCE) return i;
      }
      return -1;
    };

    let moved = false;
    let lastTap: { id: string; t: number } | null = null;

    const tool = new paperjs.Tool();

    tool.onMouseMove = (e: paper.ToolEvent) => {
      const geo = geoRef.current;
      if (!geo) return;

      const ci = cornerHitTest(geo, e.point);
      if (ci >= 0) {
        cursor('nwse-resize');
        const key = `corner:${idsRef.current[ci]}`;
        if (key !== hoverRef.current) {
          hoverRef.current = key;
          redrawUi();
        }
        return;
      }

      const hit = geo.hitTest(e.point, hitOpts);
      let next: string | null = null;
      if (hit) {
        const idx = hit.segment ? geo.segments.indexOf(hit.segment) : -1;
        const id = idsRef.current[idx];
        if (hit.type === 'handle-in') {
          next = `in:${id}`;
          cursor('grab');
        } else if (hit.type === 'handle-out') {
          next = `out:${id}`;
          cursor('grab');
        } else if (hit.type === 'segment') {
          next = `anchor:${id}`;
          cursor('move');
        } else if (hit.type === 'stroke') {
          cursor('copy');
        }
      } else {
        cursor(geo.closed ? 'default' : 'crosshair');
      }
      if (next !== hoverRef.current) {
        hoverRef.current = next;
        redrawUi();
      }
    };

    tool.onMouseDown = (e: paper.ToolEvent) => {
      const geo = geoRef.current;
      if (!geo) return;
      scope.activate();
      moved = false;
      const { alt } = modsOf(e);

      if (!geo.closed && geo.segments.length >= 3) {
        const first = geo.firstSegment;
        if (first && first.point.getDistance(e.point) <= HIT_TOLERANCE) {
          geo.closed = true;
          dragRef.current = null;
          redrawUi();
          commit();
          return;
        }
      }

      const ci = cornerHitTest(geo, e.point);
      if (ci >= 0) {
        dragRef.current = { kind: 'corner', index: ci };
        return;
      }

      const hit = geo.hitTest(e.point, hitOpts);

      if (hit && (hit.type === 'handle-in' || hit.type === 'handle-out')) {
        dragRef.current = {
          kind: hit.type === 'handle-in' ? 'handleIn' : 'handleOut',
          index: geo.segments.indexOf(hit.segment),
        };
        return;
      }

      if (hit && hit.type === 'segment') {
        const idx = geo.segments.indexOf(hit.segment);
        const id = idsRef.current[idx];
        const now = Date.now();

        // Doble clic sobre un nodo → alternar manijas (crear / quitar).
        if (lastTap && lastTap.id === id && now - lastTap.t < 350) {
          lastTap = null;
          toggleHandles(geo, idx);
          dragRef.current = null;
          redrawUi();
          commit();
          return;
        }
        lastTap = { id, t: now };

        // Alt: arrastrar el nodo saca manijas simétricas; Alt+clic sin mover = eliminar.
        dragRef.current = { kind: alt ? 'pull' : 'anchor', index: idx };
        return;
      }

      lastTap = null;

      if (hit && hit.type === 'stroke' && hit.location) {
        const newSeg = geo.divideAt(hit.location);
        if (newSeg) {
          const idx = geo.segments.indexOf(newSeg);
          idsRef.current.splice(idx, 0, createMaskNodeId());
          radiiRef.current.splice(idx, 0, 0);
          dragRef.current = { kind: 'anchor', index: idx };
          redrawUi();
          commit();
        }
        return;
      }

      if (!geo.closed) {
        geo.add(e.point);
        idsRef.current.push(createMaskNodeId());
        radiiRef.current.push(0);
        dragRef.current = { kind: 'draw', index: geo.segments.length - 1 };
        redrawUi();
        live();
      }
    };

    tool.onMouseDrag = (e: paper.ToolEvent) => {
      const geo = geoRef.current;
      const drag = dragRef.current;
      if (!geo || !drag) return;
      const seg = geo.segments[drag.index];
      if (!seg) return;
      moved = true;
      const { shift } = modsOf(e);

      if (drag.kind === 'corner') {
        // Redondeo de esquina viva: proyecta el ratón sobre la bisectriz interior.
        const n = geo.segments.length;
        const prev = geo.segments[(drag.index - 1 + n) % n];
        const next = geo.segments[(drag.index + 1) % n];
        const u1 = prev?.point.subtract(seg.point);
        const u2 = next?.point.subtract(seg.point);
        if (u1 && u2 && u1.length > 1e-6 && u2.length > 1e-6) {
          const bis = u1.normalize().add(u2.normalize());
          if (bis.length > 1e-6) {
            const proj = Math.max(0, e.point.subtract(seg.point).dot(bis.normalize()));
            const trimPx = Math.min(proj, 0.5 * Math.min(u1.length, u2.length));
            const { w, h } = sizeRef.current;
            radiiRef.current[drag.index] = trimPx / ((w + h) / 2 || 1);
          }
        }
      } else if (drag.kind === 'anchor') {
        seg.point = e.point.clone();
      } else if (drag.kind === 'pull') {
        // Alt+arrastrar el nodo → saca un par de manijas simétricas.
        const v = maybeSnap(e.point.subtract(seg.point), shift);
        seg.handleOut = v;
        seg.handleIn = v.multiply(-1);
      } else if (drag.kind === 'draw') {
        const v = e.point.subtract(seg.point);
        seg.handleOut = v;
        seg.handleIn = v.multiply(-1);
      } else {
        const v = maybeSnap(e.point.subtract(seg.point), shift);
        if (drag.kind === 'handleIn') seg.handleIn = v;
        else seg.handleOut = v;
      }

      redrawUi();
      live();
    };

    tool.onMouseUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag) return;
      const geo = geoRef.current;
      // Alt+clic sobre un nodo, sin arrastre => eliminar.
      if (drag.kind === 'pull' && !moved && geo && geo.segments.length > 2) {
        const seg = geo.segments[drag.index];
        if (seg) {
          geo.removeSegment(drag.index);
          idsRef.current.splice(drag.index, 1);
          radiiRef.current.splice(drag.index, 1);
          hoverRef.current = null;
          redrawUi();
        }
      }
      commit();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      const geo = geoRef.current;
      const hovered = hoverRef.current;
      if (!geo || !hovered || !hovered.startsWith('anchor:')) return;
      const idx = idsRef.current.indexOf(hovered.slice('anchor:'.length));
      if (idx < 0 || geo.segments.length <= 2) return;
      ev.preventDefault();
      geo.removeSegment(idx);
      idsRef.current.splice(idx, 1);
      radiiRef.current.splice(idx, 1);
      hoverRef.current = null;
      redrawUi();
      commit();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      disposed = true;
      window.removeEventListener('keydown', onKeyDown);
      ro.disconnect();
      tool.remove();
      scope.view?.remove();
      scope.project?.remove();
      scopeRef.current = null;
      geoRef.current = null;
      uiLayerRef.current = null;
      geoLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconstruye si el path cambia desde fuera (panel: añadir/quitar nodo, undo).
  useEffect(() => {
    pathRef.current = path;
    if (!scopeRef.current || dragRef.current) return;
    const key = JSON.stringify(normalizeFreeformPath(path));
    if (key === lastAppliedRef.current) return;
    lastAppliedRef.current = key;
    buildGeometry(path);
  }, [path, buildGeometry]);

  return (
    <div
      className="absolute inset-0 z-[30]"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onPointerMoveCapture={(e) => {
        if (dragRef.current) e.stopPropagation();
      }}
      onPointerUpCapture={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default ClipPathNodeEditorPaper;
