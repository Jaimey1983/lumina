'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { ClipPathNodeEditor } from './clip-path-node-editor';
import {
  clampClipImageOffsetPct,
  clipContentBackground,
  computeClipImagePanClamp,
  formatClipDropShadow,
  generarClipPath,
  getClipImageStyle,
  librePathFromNodes,
  normalizeClipContentImage,
} from '@/lib/clip-path';
import { hasMediaSrc } from '@/lib/media-url';
import type { ClipGroupBlock, ClipPathNode, ClipShapeLibre } from '@/types/slide.types';

export interface RenderClipGroupProps {
  block: ClipGroupBlock;
  editorMode?: boolean;
  isSelected?: boolean;
  /** Modo edición interna explícito (legacy / doble clic). */
  innerEdit?: boolean;
  onContentCommit?: (patch: Partial<ClipGroupBlock['contenido']>) => void;
  onShapeCommit?: (clipShape: ClipGroupBlock['clipShape']) => void;
  onEnterInnerEdit?: () => void;
}

export function RenderClipGroup({
  block,
  editorMode = false,
  isSelected = false,
  innerEdit = false,
  onContentCommit,
  onShapeCommit,
  onEnterInnerEdit,
}: RenderClipGroupProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveLibreNodes, setLiveLibreNodes] = useState<ClipPathNode[] | null>(null);
  const [selectedLibreNode, setSelectedLibreNode] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

  const isLibreShape = block.clipShape.tipo === 'libre';
  const libreShape = isLibreShape ? (block.clipShape as ClipShapeLibre) : null;
  const shapeEditing = editorMode && isSelected && isLibreShape && !innerEdit;
  const imageUrl = block.contenido.tipo === 'imagen' ? block.contenido.url : null;

  useEffect(() => {
    setSelectedLibreNode(null);
    setLiveLibreNodes(null);
    setImgNaturalSize({ w: 0, h: 0 });
  }, [block.id]);

  useEffect(() => {
    setImgNaturalSize({ w: 0, h: 0 });
  }, [imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sync = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clipPathD = (() => {
    if (liveLibreNodes && libreShape) {
      return librePathFromNodes(liveLibreNodes, libreShape.cerrado !== false);
    }
    return generarClipPath(block.clipShape).d;
  })();

  const opacity = block.opacidad !== undefined ? block.opacidad / 100 : 1;
  const border = block.borde;
  const shadow = block.sombra;

  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livePatchRef = useRef<Partial<ClipGroupBlock['contenido']> | null>(null);
  const [livePan, setLivePan] = useState<{ offsetX: number; offsetY: number } | null>(null);
  const [liveScale, setLiveScale] = useState<number | null>(null);

  const canEditImage =
    editorMode &&
    block.contenido.tipo === 'imagen' &&
    hasMediaSrc(block.contenido.tipo === 'imagen' ? block.contenido.url : undefined);

  const imagePanActive = canEditImage && innerEdit;

  const commitPatch = useCallback(
    (patch: Partial<ClipGroupBlock['contenido']>) => {
      if (!onContentCommit) return;
      livePatchRef.current = { ...(livePatchRef.current ?? {}), ...patch };
      onContentCommit(livePatchRef.current);
      livePatchRef.current = null;
    },
    [onContentCommit],
  );

  const dropShadowFilter = formatClipDropShadow(shadow);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  const renderFill = () => {
    const { contenido } = block;
    if (contenido.tipo === 'imagen') {
      const img = normalizeClipContentImage(contenido);
      if (!hasMediaSrc(img.url)) {
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#cbd5e1',
              color: '#475569',
              fontSize: '0.7rem',
              textAlign: 'center',
              padding: '0.35rem',
            }}
          >
            Añade una URL de imagen
          </div>
        );
      }

      const offsetX = livePan?.offsetX ?? img.offsetX;
      const offsetY = livePan?.offsetY ?? img.offsetY;
      const escala = liveScale ?? img.escala;

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img.url}
          alt={img.alt ?? ''}
          draggable={false}
          onLoad={handleImageLoad}
          style={getClipImageStyle(
            imgNaturalSize.w,
            imgNaturalSize.h,
            containerSize.w,
            containerSize.h,
            escala,
            offsetX,
            offsetY,
            img.ajuste,
            {
              pointerEvents: imagePanActive ? 'auto' : 'none',
              cursor: imagePanActive ? 'grab' : undefined,
              userSelect: 'none',
            },
          )}
        />
      );
    }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: clipContentBackground(contenido),
        }}
      />
    );
  };

  const handleImagePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!imagePanActive || block.contenido.tipo !== 'imagen' || !onContentCommit) return;
      e.stopPropagation();
      e.preventDefault();
      const img = normalizeClipContentImage(block.contenido);
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: img.offsetX,
        oy: img.offsetY,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [imagePanActive, block.contenido, onContentCommit],
  );

  const handleImagePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current || block.contenido.tipo !== 'imagen') return;
      const host = containerRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const img = normalizeClipContentImage(block.contenido);
      const escala = liveScale ?? img.escala;
      const dxPct = ((e.clientX - dragRef.current.x) / rect.width) * 100;
      const dyPct = ((e.clientY - dragRef.current.y) / rect.height) * 100;

      const { maxPanX, maxPanY } = computeClipImagePanClamp(
        imgNaturalSize.w,
        imgNaturalSize.h,
        rect.width,
        rect.height,
        escala,
        img.ajuste,
      );
      const clamped = clampClipImageOffsetPct(
        dragRef.current.ox + dxPct,
        dragRef.current.oy + dyPct,
        rect.width,
        rect.height,
        maxPanX,
        maxPanY,
      );

      livePatchRef.current = {
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      };
      setLivePan({
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      });
    },
    [block.contenido, imgNaturalSize, liveScale],
  );

  const handleImagePointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (dragRef.current && livePatchRef.current) {
        commitPatch(livePatchRef.current);
      }
      dragRef.current = null;
      setLivePan(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [commitPatch],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imagePanActive || block.contenido.tipo !== 'imagen' || !onContentCommit) return;
      e.stopPropagation();
      e.preventDefault();
      const img = normalizeClipContentImage(block.contenido);
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const next = Math.max(0.25, Math.min(4, img.escala + delta));
      setLiveScale(next);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        const host = containerRef.current;
        if (!host || block.contenido.tipo !== 'imagen') {
          commitPatch({ escala: next });
          setLiveScale(null);
          return;
        }
        const rect = host.getBoundingClientRect();
        const img = normalizeClipContentImage(block.contenido);
        const { maxPanX, maxPanY } = computeClipImagePanClamp(
          imgNaturalSize.w,
          imgNaturalSize.h,
          rect.width,
          rect.height,
          next,
          img.ajuste,
        );
        const clamped = clampClipImageOffsetPct(
          img.offsetX,
          img.offsetY,
          rect.width,
          rect.height,
          maxPanX,
          maxPanY,
        );
        commitPatch({ escala: next, offsetX: clamped.offsetX, offsetY: clamped.offsetY });
        setLiveScale(null);
      }, 200);
    },
    [imagePanActive, block.contenido, onContentCommit, commitPatch, imgNaturalSize],
  );

  const handleShapeCommit = useCallback(
    (nodos: ClipPathNode[]) => {
      if (!onShapeCommit || !libreShape) return;
      setLiveLibreNodes(null);
      onShapeCommit({
        ...libreShape,
        nodos,
      });
    },
    [libreShape, onShapeCommit],
  );

  return (
    <div className="relative h-full w-full" style={{ opacity }}>
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clipPathD} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative h-full w-full"
        style={dropShadowFilter ? { filter: dropShadowFilter } : undefined}
      >
        <div
          className="relative h-full w-full"
          style={{
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
          onDoubleClick={
            editorMode && canEditImage && onEnterInnerEdit
              ? (e) => {
                  e.stopPropagation();
                  onEnterInnerEdit();
                }
              : undefined
          }
          onWheel={handleWheel}
        >
          <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden"
            onPointerDown={imagePanActive ? handleImagePointerDown : undefined}
            onPointerMove={imagePanActive ? handleImagePointerMove : undefined}
            onPointerUp={imagePanActive ? handleImagePointerUp : undefined}
            onPointerCancel={imagePanActive ? handleImagePointerUp : undefined}
            style={{
              outline: innerEdit ? '2px dashed rgba(249,115,22,0.85)' : undefined,
              outlineOffset: innerEdit ? 2 : undefined,
            }}
          >
            {renderFill()}
          </div>
        </div>
      </div>

      {shapeEditing && libreShape && onShapeCommit ? (
        <ClipPathNodeEditor
          nodos={libreShape.nodos}
          cerrado={libreShape.cerrado !== false}
          selectedNodeIndex={selectedLibreNode}
          onSelectNode={setSelectedLibreNode}
          onCommit={handleShapeCommit}
          onLiveChange={setLiveLibreNodes}
        />
      ) : null}

      {border?.grosor ? (
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={clipPathD}
            fill="none"
            stroke={border.color ?? '#475569'}
            strokeWidth={(border.grosor / 100) * 2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}

      {editorMode && (imagePanActive || shapeEditing) ? (
        <div className="pointer-events-none absolute bottom-1 left-1 max-w-[95%] rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          {shapeEditing ? 'Anclas: arrastra · doble clic = curva Bézier · Supr = eliminar' : ''}
          {imagePanActive ? 'Arrastra imagen · Rueda = escala' : ''}
        </div>
      ) : null}

      {editorMode && canEditImage && isSelected && !innerEdit ? (
        <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          Doble clic para ajustar imagen
        </div>
      ) : null}
    </div>
  );
}
