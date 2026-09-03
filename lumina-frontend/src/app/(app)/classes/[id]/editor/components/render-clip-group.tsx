'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';

import {
  clampClipImageOffsetPct,
  clipContentBackground,
  computeClipImagePanClamp,
  formatClipDropShadow,
  generarClipPath,
  getClipImageStyle,
  normalizeClipContentImage,
} from '@/lib/clip-path';
import { freeformPathToSvgD, resolveFreeformPath } from '@/lib/freeform-mask';
import { hasMediaSrc } from '@/lib/media-url';
import { getBlockPos } from '@/hooks/use-block-drag';
import type {
  Block,
  ClipCompositionFill,
  ClipContentImage,
  ClipGroupBlock,
  ClipShapeLibre,
  FreeformMaskPath,
} from '@/types/slide.types';

/** Editor Paper.js: solo se carga al entrar en modo edición de forma libre. */
const ClipPathNodeEditorPaper = dynamic(
  () =>
    import('./clip-path-node-editor-paper').then(
      (m) => m.ClipPathNodeEditorPaper,
    ),
  { ssr: false },
);

/** Fondo CSS (longhand) de la capa base de cada ventana según el relleno. */
function windowBaseStyle(fill: ClipCompositionFill): CSSProperties {
  if (fill.tipo === 'gradiente') {
    return { backgroundImage: clipContentBackground(fill) };
  }
  if (fill.tipo === 'color') {
    return { backgroundColor: clipContentBackground(fill) };
  }
  // Imagen: gris de marcador de posición mientras no haya URL válida.
  return hasMediaSrc(fill.url) ? {} : { backgroundColor: '#cbd5e1' };
}

/**
 * Silueta de la ventana de un hijo, como atributo `d` en coords
 * `objectBoundingBox` (0–1). `null` = ventana rectangular (bbox).
 * Cubre `clip-group` (hexágono, estrella, freeform, texto…) y `forma`.
 */
function childWindowPath(block: Block): string | null {
  if (block.tipo === 'clip-group') return generarClipPath(block.clipShape).d;
  if (block.tipo === 'forma') {
    if (block.forma === 'circulo') return generarClipPath({ tipo: 'circulo' }).d;
    if (block.forma === 'triangulo') return generarClipPath({ tipo: 'triangulo' }).d;
  }
  return null;
}

/**
 * Cada bloque de la composición se vuelve una ventana que revela su porción
 * del `fill` compartido, alineado al bbox del grupo — igual que una imagen
 * repartida entre las letras de una máscara de texto. La ventana conserva la
 * silueta del bloque (hexágono, estrella, forma libre, círculo…).
 *
 * El relleno de imagen se pinta como un `<img>` posicionado con
 * `getClipImageStyle` respecto al bbox del **grupo** (no de cada ventana), con
 * el mismo pan/escala/ajuste que una máscara de imagen normal → todas las
 * ventanas muestran la misma imagen continua y se puede arrastrar/escalar.
 */
function CompositionFillWindows({
  bloques,
  fill,
  groupSize,
  imgNaturalSize,
}: {
  bloques: Block[];
  fill: ClipCompositionFill;
  groupSize: { w: number; h: number };
  imgNaturalSize: { w: number; h: number };
}) {
  const baseId = useId().replace(/:/g, '');
  const baseStyle = windowBaseStyle(fill);
  const imgFill =
    fill.tipo === 'imagen' && hasMediaSrc(fill.url)
      ? normalizeClipContentImage(fill)
      : null;
  const windows = bloques.map((child, i) => ({
    child,
    i,
    pos: getBlockPos(child),
    d: childWindowPath(child),
    clipId: `cfw-${baseId}-${i}`,
  }));

  return (
    <div className="absolute inset-0 h-full w-full">
      <svg
        width="0"
        height="0"
        className="pointer-events-none absolute"
        aria-hidden
      >
        <defs>
          {windows
            .filter((wnd) => wnd.d)
            .map((wnd) => (
              <clipPath
                key={wnd.clipId}
                id={wnd.clipId}
                clipPathUnits="objectBoundingBox"
              >
                <path d={wnd.d!} />
              </clipPath>
            ))}
        </defs>
      </svg>

      {windows.map(({ child, i, pos, d, clipId }) => {
        const w = Math.max(0.001, pos.ancho);
        const h = Math.max(0.001, pos.alto);
        const rot = (child as { rotacion?: number }).rotacion;
        return (
          <div
            key={(child as { id?: string }).id ?? i}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${w}%`,
              height: `${h}%`,
              overflow: 'hidden',
              transform: rot ? `rotate(${rot}deg)` : undefined,
              transformOrigin: 'center center',
              ...(d
                ? { clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})` }
                : {}),
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${(-pos.x / w) * 100}%`,
                top: `${(-pos.y / h) * 100}%`,
                width: `${(100 / w) * 100}%`,
                height: `${(100 / h) * 100}%`,
                overflow: 'hidden',
                ...baseStyle,
              }}
            >
              {imgFill ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgFill.url}
                  alt=""
                  draggable={false}
                  aria-hidden
                  style={getClipImageStyle(
                    imgNaturalSize.w,
                    imgNaturalSize.h,
                    groupSize.w,
                    groupSize.h,
                    imgFill.escala,
                    imgFill.offsetX,
                    imgFill.offsetY,
                    imgFill.ajuste,
                    { pointerEvents: 'none', userSelect: 'none' },
                  )}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface RenderClipGroupProps {
  block: ClipGroupBlock;
  editorMode?: boolean;
  isSelected?: boolean;
  /** Modo edición interna explícito (legacy / doble clic). */
  innerEdit?: boolean;
  /** Persiste pan/escala de la máscara de imagen individual (`contenido`). */
  onContentCommit?: (patch: Partial<ClipContentImage>) => void;
  /** Persiste pan/escala del relleno de imagen compartido de una composición. */
  onFillCommit?: (patch: Partial<ClipContentImage>) => void;
  onShapeCommit?: (clipShape: ClipGroupBlock['clipShape']) => void;
  onEnterInnerEdit?: () => void;
  /**
   * Render del contenido cuando `contenido.tipo === 'composicion'`. Lo provee
   * `slide-renderer` con un `<SlideRenderer>` anidado (evita el ciclo de
   * imports). Recibe los bloques hijos en coords relativas al bbox del grupo.
   */
  renderComposicion?: (bloques: Block[]) => ReactNode;
}

export function RenderClipGroup({
  block,
  editorMode = false,
  isSelected = false,
  innerEdit = false,
  onContentCommit,
  onFillCommit,
  onShapeCommit,
  onEnterInnerEdit,
  renderComposicion,
}: RenderClipGroupProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveFreeform, setLiveFreeform] = useState<FreeformMaskPath | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

  const isLibreShape = block.clipShape.tipo === 'libre';
  const libreShape = isLibreShape ? (block.clipShape as ClipShapeLibre) : null;
  const shapeEditing = editorMode && isSelected && isLibreShape && !innerEdit;
  const freeformPath = useMemo(
    () => (libreShape ? resolveFreeformPath(libreShape) : null),
    [libreShape],
  );
  // Imagen "activa" para pan/escala: el contenido si es imagen, o el relleno
  // compartido de una composición si es imagen. Misma UX en ambos casos.
  const { contenido } = block;
  const rawImg: ClipContentImage | null =
    contenido.tipo === 'imagen'
      ? contenido
      : contenido.tipo === 'composicion' && contenido.fill?.tipo === 'imagen'
        ? contenido.fill
        : null;
  const isCompFillImage = contenido.tipo === 'composicion' && !!rawImg;
  const activeImg = useMemo(
    () => (rawImg ? normalizeClipContentImage(rawImg) : null),
    [rawImg],
  );
  const imageUrl = activeImg?.url ?? null;

  useEffect(() => {
    setLiveFreeform(null);
    setImgNaturalSize({ w: 0, h: 0 });
  }, [block.id, imageUrl]);

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
    if (liveFreeform && libreShape) {
      return freeformPathToSvgD(liveFreeform);
    }
    return generarClipPath(block.clipShape).d;
  })();

  const opacity = block.opacidad !== undefined ? block.opacidad / 100 : 1;
  const border = block.borde;
  const shadow = block.sombra;

  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [livePan, setLivePan] = useState<{ offsetX: number; offsetY: number } | null>(null);
  const [liveScale, setLiveScale] = useState<number | null>(null);

  const commitImg = isCompFillImage ? onFillCommit : onContentCommit;
  const canEditImage =
    editorMode && !!activeImg && hasMediaSrc(activeImg.url) && !!commitImg;
  const imagePanActive = canEditImage && innerEdit;

  const dropShadowFilter = formatClipDropShadow(shadow);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  // Imagen activa con el pan/escala en vivo del gesto en curso aplicado.
  const liveImg = activeImg && {
    ...activeImg,
    offsetX: livePan?.offsetX ?? activeImg.offsetX,
    offsetY: livePan?.offsetY ?? activeImg.offsetY,
    escala: liveScale ?? activeImg.escala,
  };

  const renderFill = () => {
    if (contenido.tipo === 'composicion') {
      if (!contenido.fill) {
        return (
          <div className="absolute inset-0 h-full w-full">
            {renderComposicion?.(contenido.bloques) ?? null}
          </div>
        );
      }
      return (
        <CompositionFillWindows
          bloques={contenido.bloques}
          fill={contenido.fill.tipo === 'imagen' && liveImg ? liveImg : contenido.fill}
          groupSize={containerSize}
          imgNaturalSize={imgNaturalSize}
        />
      );
    }

    if (contenido.tipo === 'imagen') {
      if (!liveImg || !hasMediaSrc(liveImg.url)) {
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
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={liveImg.url}
          alt={liveImg.alt ?? ''}
          draggable={false}
          onLoad={handleImageLoad}
          style={getClipImageStyle(
            imgNaturalSize.w,
            imgNaturalSize.h,
            containerSize.w,
            containerSize.h,
            liveImg.escala,
            liveImg.offsetX,
            liveImg.offsetY,
            liveImg.ajuste,
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
      if (!imagePanActive || !activeImg) return;
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: activeImg.offsetX,
        oy: activeImg.offsetY,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [imagePanActive, activeImg],
  );

  const handleImagePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragRef.current || !activeImg) return;
      const host = containerRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const escala = liveScale ?? activeImg.escala;
      const dxPct = ((e.clientX - dragRef.current.x) / rect.width) * 100;
      const dyPct = ((e.clientY - dragRef.current.y) / rect.height) * 100;

      const { maxPanX, maxPanY } = computeClipImagePanClamp(
        imgNaturalSize.w,
        imgNaturalSize.h,
        rect.width,
        rect.height,
        escala,
        activeImg.ajuste,
      );
      setLivePan(
        clampClipImageOffsetPct(
          dragRef.current.ox + dxPct,
          dragRef.current.oy + dyPct,
          rect.width,
          rect.height,
          maxPanX,
          maxPanY,
        ),
      );
    },
    [activeImg, imgNaturalSize, liveScale],
  );

  const handleImagePointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (dragRef.current && livePan) commitImg?.(livePan);
      dragRef.current = null;
      setLivePan(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [commitImg, livePan],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imagePanActive || !activeImg) return;
      e.stopPropagation();
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const next = Math.max(0.25, Math.min(4, activeImg.escala + delta));
      setLiveScale(next);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        const host = containerRef.current;
        if (!host) {
          commitImg?.({ escala: next });
          setLiveScale(null);
          return;
        }
        const rect = host.getBoundingClientRect();
        const { maxPanX, maxPanY } = computeClipImagePanClamp(
          imgNaturalSize.w,
          imgNaturalSize.h,
          rect.width,
          rect.height,
          next,
          activeImg.ajuste,
        );
        const clamped = clampClipImageOffsetPct(
          activeImg.offsetX,
          activeImg.offsetY,
          rect.width,
          rect.height,
          maxPanX,
          maxPanY,
        );
        commitImg?.({ escala: next, ...clamped });
        setLiveScale(null);
      }, 200);
    },
    [imagePanActive, activeImg, commitImg, imgNaturalSize],
  );

  const handleShapeCommit = useCallback(
    (next: FreeformMaskPath) => {
      if (!onShapeCommit) return;
      setLiveFreeform(null);
      onShapeCommit({ tipo: 'libre', path: next });
    },
    [onShapeCommit],
  );

  return (
    <div className="relative h-full w-full">
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clipPathD} />
          </clipPath>
        </defs>
      </svg>

      {/* Todo lo visible (relleno + borde) hereda la opacidad del elemento; los
          controles de edición quedan fuera para seguir viéndose al 0 %. */}
      <div className="absolute inset-0" style={{ opacity }}>
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
                cursor: imagePanActive
                  ? dragRef.current
                    ? 'grabbing'
                    : 'grab'
                  : undefined,
              }}
            >
              {/* Sonda para medir el tamaño natural del relleno compartido. */}
              {isCompFillImage && imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden
                  onLoad={handleImageLoad}
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              ) : null}
              {renderFill()}
            </div>
          </div>
        </div>

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
      </div>

      {shapeEditing && freeformPath && onShapeCommit ? (
        <ClipPathNodeEditorPaper
          path={freeformPath}
          onCommit={handleShapeCommit}
          onLiveChange={setLiveFreeform}
        />
      ) : null}

      {editorMode && (imagePanActive || shapeEditing) ? (
        <div className="pointer-events-none absolute bottom-1 left-1 max-w-[95%] rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          {shapeEditing
            ? 'Arrastra nodos · doble clic / Alt+arrastra = curvar · tirador verde = redondear esquina · clic en el borde = añadir · Alt+clic/Supr = eliminar'
            : ''}
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
