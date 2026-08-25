'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { Camera } from 'lucide-react';

import type { WidgetSlideContent, WidgetSlideTextBlock, WidgetSlideInnerSelection, WidgetSlideTextField, WidgetSlidePanelConfig } from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  applyImageElementStyle,
  computeImagePanClamp,
  imageElementStyle,
  imageThumbnailStyle,
  imageWrapperStyle,
  usesComputedImageLayout,
  type ImageWrapperCornerMode,
} from '@/components/widgets/shared/widget-image-styles';
import { readContainerDimsFromRef, useWidgetImageDimensions } from '@/components/widgets/shared/use-widget-image-dimensions';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';

import slideStyles from './widget-slide-panel.module.css';
import chromeStyles from './widget-chrome.module.css';
import {
  stopWidgetInnerKeydown,
  stopWidgetInnerPointer,
} from './widget-editor-utils';
import { isOverlayLayout, isSplitLayout, resolveSlideLayoutId } from './widget-layouts';
import {
  clampWidgetPos,
  resolveSlideVisibilidad,
  resolveTextPos,
} from './widget-slide-utils';
import {
  looksLikeRichHtml,
  sanitizeWidgetHtml,
} from './widget-rich-text';

function slidePanelStyle(
  slide: WidgetSlideContent,
  vis: ReturnType<typeof resolveSlideVisibilidad>,
): React.CSSProperties {
  if (!vis.mostrarTarjeta) return {};
  return {
    backgroundColor: slide.colorFondoSlide ?? '#ffffff',
  };
}

function resolveImageCornerMode(
  layoutId: ReturnType<typeof resolveSlideLayoutId>,
  overlay: boolean,
): ImageWrapperCornerMode {
  if (overlay || layoutId === 'solo-texto') return 'all';
  if (layoutId === 'texto-izq-imagen-der') return 'split-right';
  return 'split-left';
}

function TabImageLayer({
  slide,
  isSelected,
  isEditing,
  imageRadius,
  fillOverlay,
  imageCornerMode = 'all',
  isThumbnail = false,
  imageFallbackBackground,
  onSelect,
  onPatch,
}: {
  slide: WidgetSlideContent;
  isSelected: boolean;
  isEditing: boolean;
  imageRadius: number;
  fillOverlay?: boolean;
  imageCornerMode?: ImageWrapperCornerMode;
  isThumbnail?: boolean;
  imageFallbackBackground?: string;
  onSelect: () => void;
  onPatch: (patch: Partial<WidgetSlideContent>) => void;
}) {
  const { containerRef, imgRef, imgDims, containerDims, getEffectiveContainerDims, handleImageLoad, measureContainer } =
    useWidgetImageDimensions(slide.imagen, { isThumbnail });

  const effectiveContainerDims = getEffectiveContainerDims();
  const computedImageLayout = usesComputedImageLayout(
    imgDims,
    effectiveContainerDims,
    { isThumbnail },
  );

  useLayoutEffect(() => {
    if (!slide.imagen || isThumbnail) return;
    measureContainer();
  }, [
    slide.imagen,
    isThumbnail,
    measureContainer,
    imgDims.w,
    imgDims.h,
    slide.imagenEscala,
    slide.imagenOffsetX,
    slide.imagenOffsetY,
  ]);

  const panRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
    pendingX: number;
    pendingY: number;
  } | null>(null);
  const resizeRef = useRef<{ startY: number; scale: number } | null>(null);

  const applyImagePosition = (offsetX: number, offsetY: number) => {
    const img = imgRef.current;
    if (!img) return;
    const liveDims = readContainerDimsFromRef(containerRef, containerDims);
    applyImageElementStyle(img, slide, imgDims, liveDims, {
      offsetX,
      offsetY,
    });
  };

  const finishPan = (el: HTMLElement, pointerId: number) => {
    if (panRef.current) {
      onPatch({
        imagenOffsetX: panRef.current.pendingX,
        imagenOffsetY: panRef.current.pendingY,
      });
    }
    panRef.current = null;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const finishResize = (el: HTMLElement, pointerId: number) => {
    resizeRef.current = null;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!slide.imagen) {
    return (
      <div
        className={cn(
          fillOverlay ? slideStyles.wspImageLayer : slideStyles.wspImageCol,
          slideStyles.wspImageColEmpty,
          isEditing && slideStyles.wspImageLayerInteractive,
          isSelected && chromeStyles.whInnerHighlight,
        )}
        onPointerDown={(e) => {
          if (!isEditing || isThumbnail) return;
          e.stopPropagation();
          onSelect();
        }}
        onClick={stopWidgetInnerPointer}
      >
        <div className={slideStyles.wspImagePlaceholder}>
          {isEditing ? '＋ Clic en Imagen (abajo) o aquí para seleccionar' : 'Sin imagen'}
        </div>
      </div>
    );
  }

  const imageWrapperStyles = {
    ...imageWrapperStyle(slide, imageRadius, imageCornerMode),
    backgroundColor: imageFallbackBackground ?? '#f1f5f9',
  };

  if (isThumbnail) {
    return (
      <div
        className={cn(
          fillOverlay ? slideStyles.wspImageLayer : slideStyles.wspImageCol,
        )}
        style={imageWrapperStyles}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imagen}
          alt={slide.imagenAlt ?? ''}
          className={slideStyles.wspImageFit}
          style={imageThumbnailStyle(slide)}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        fillOverlay ? slideStyles.wspImageLayer : slideStyles.wspImageCol,
        isEditing && slideStyles.wspImageLayerInteractive,
        isSelected && chromeStyles.whInnerHighlight,
      )}
      style={imageWrapperStyles}
      onPointerDown={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        onSelect();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          ox: slide.imagenOffsetX ?? 0,
          oy: slide.imagenOffsetY ?? 0,
          w: Math.max(rect.width, 1),
          h: Math.max(rect.height, 1),
          pendingX: slide.imagenOffsetX ?? 0,
          pendingY: slide.imagenOffsetY ?? 0,
        };
      }}
      onPointerMove={(e) => {
        if (panRef.current) {
          const scale = (slide.imagenEscala ?? 100) / 100;
          const { maxPanX, maxPanY } = computeImagePanClamp(
            imgDims.w,
            imgDims.h,
            panRef.current.w,
            panRef.current.h,
            scale,
          );
          const dx = e.clientX - panRef.current.startX;
          const dy = e.clientY - panRef.current.startY;
          const nextX = Math.max(-maxPanX, Math.min(maxPanX, panRef.current.ox + dx));
          const nextY = Math.max(-maxPanY, Math.min(maxPanY, panRef.current.oy + dy));
          panRef.current.pendingX = nextX;
          panRef.current.pendingY = nextY;
          applyImagePosition(nextX, nextY);
          return;
        }
        if (resizeRef.current) {
          const dy = resizeRef.current.startY - e.clientY;
          const next = Math.max(100, Math.min(200, resizeRef.current.scale + dy * 0.5));
          onPatch({ imagenEscala: Math.round(next) });
        }
      }}
      onPointerUp={(e) => {
        if (panRef.current) finishPan(e.currentTarget, e.pointerId);
        if (resizeRef.current) finishResize(e.currentTarget, e.pointerId);
      }}
      onPointerCancel={(e) => {
        if (panRef.current) finishPan(e.currentTarget, e.pointerId);
        if (resizeRef.current) finishResize(e.currentTarget, e.pointerId);
      }}
      onClick={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={slide.imagen}
        alt={slide.imagenAlt ?? ''}
        className={cn(
          computedImageLayout ? slideStyles.wspImagePlaced : slideStyles.wspImageFit,
        )}
        style={imageElementStyle(slide, imgDims, effectiveContainerDims)}
        onLoad={handleImageLoad}
        draggable={false}
      />
      {isEditing && isSelected ? (
        <span
          className={slideStyles.wspImageResizeHandle}
          title="Arrastra para cambiar el zoom"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            resizeRef.current = {
              startY: e.clientY,
              scale: Math.max(100, slide.imagenEscala ?? 100),
            };
          }}
        />
      ) : null}
    </div>
  );
}

function WidgetSlideFreeBlocks({
  blocks,
  isEditing,
  onPatchBlock,
}: {
  blocks: WidgetSlideTextBlock[];
  isEditing: boolean;
  onPatchBlock?: (blockId: string, patch: Partial<WidgetSlideTextBlock>) => void;
}) {
  if (!blocks.length) return null;

  return (
    <div className={slideStyles.wspFreeBlocksLayer}>
      {blocks.map((block) => (
        <WidgetSlideFreeBlock
          key={block.id}
          block={block}
          isEditing={isEditing}
          onPatch={onPatchBlock ? (patch) => onPatchBlock(block.id, patch) : undefined}
        />
      ))}
    </div>
  );
}

function WidgetSlideFreeBlock({
  block,
  isEditing,
  onSelect,
}: {
  block: WidgetSlideTextBlock;
  isEditing: boolean;
  onSelect?: () => void;
  onPatch?: (patch: Partial<WidgetSlideTextBlock>) => void;
}) {
  const style: React.CSSProperties = {
    left: `${block.x}%`,
    top: `${block.y}%`,
    width: `${block.ancho}%`,
    fontSize: block.tamanoFuente ?? '16px',
    color: block.color ?? '#334155',
    fontWeight: block.negrita ? 700 : 400,
    fontStyle: block.cursiva ? 'italic' : 'normal',
    textAlign:
      block.alineacion === 'centro'
        ? 'center'
        : block.alineacion === 'derecha'
          ? 'right'
          : block.alineacion === 'justificado'
            ? 'justify'
            : 'left',
  };

  if (!isEditing) {
    if (!block.contenido.trim()) return null;
    return (
      <p className={cn(slideStyles.wspFreeBlock, slideStyles.wspFreeBlockRead)} style={style}>
        {block.contenido}
      </p>
    );
  }

  const empty = !block.contenido.trim();

  return (
    <p
      role="button"
      tabIndex={0}
      className={cn(
        slideStyles.wspFreeBlock,
        slideStyles.wspFreeBlockRead,
        'cursor-text rounded border-2 border-transparent hover:border-dashed hover:border-[#2563EB]/40',
        empty && 'text-muted-foreground/60',
      )}
      style={style}
      onPointerDown={(e) => {
        stopWidgetInnerPointer(e);
        onSelect?.();
      }}
      onClick={(e) => {
        stopWidgetInnerPointer(e);
        onSelect?.();
      }}
      onKeyDown={(e) => {
        stopWidgetInnerKeydown(e);
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      {empty ? 'Clic para editar en el panel' : block.contenido}
    </p>
  );
}

function TabTextElement({
  field,
  slide,
  value,
  className,
  placeholder,
  multiline: _multiline,
  isEditing,
  isSelected,
  hasImageBg,
  stackRef,
  onSelect,
  onPosChange,
}: {
  field: WidgetSlideTextField;
  slide: WidgetSlideContent;
  value: string;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  isEditing: boolean;
  isSelected: boolean;
  hasImageBg: boolean;
  stackRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onPosChange: (pos: { x: number; y: number }) => void;
}) {
  const pos = resolveTextPos(slide, field);
  const styleKey =
    field === 'encabezado'
      ? 'estiloEncabezado'
      : field === 'subtitulo'
        ? 'estiloSubtitulo'
        : 'estiloCuerpo';
  const css = {
    color:
      slide[styleKey]?.color ??
      (field === 'encabezado' ? '#0f172a' : field === 'subtitulo' ? '#475569' : '#64748b'),
    ...textStyleToCss(slide[styleKey]),
  };

  const dragRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
  } | null>(null);

  const finishDrag = (el: HTMLElement, pointerId: number) => {
    dragRef.current = null;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleDragPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (!isEditing || !stackRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = stackRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: pos.x,
      oy: pos.y,
      w: rect.width,
      h: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect();
  };

  const handleDragPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (!dragRef.current) return;
    const dx = ((e.clientX - dragRef.current.startX) / dragRef.current.w) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / dragRef.current.h) * 100;
    onPosChange(clampWidgetPos(dragRef.current.ox + dx, dragRef.current.oy + dy));
  };

  const textShadowClass = hasImageBg ? slideStyles.wspTextOnImage : undefined;

  if (!isEditing) {
    if (!value) return null;
    const viewClass = cn(className, textShadowClass, 'm-0', slideStyles.wspRichText);
    const overlayStyle = hasImageBg
      ? ({ ...css, left: `${pos.x}%`, top: `${pos.y}%` } as React.CSSProperties)
      : css;

    const viewNode = looksLikeRichHtml(value) ? (
      <div
        className={cn(viewClass, hasImageBg && slideStyles.wspOverlayTextEl)}
        style={overlayStyle}
        dangerouslySetInnerHTML={{ __html: sanitizeWidgetHtml(value) }}
      />
    ) : (
      (() => {
        const Tag = field === 'encabezado' ? 'h3' : 'p';
        return (
          <Tag
            className={cn(viewClass, hasImageBg && slideStyles.wspOverlayTextEl)}
            style={overlayStyle}
          >
            {value}
          </Tag>
        );
      })()
    );

    if (hasImageBg) return viewNode;
    return viewNode;
  }

  const editorEl = looksLikeRichHtml(value) ? (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'm-0 w-full min-w-[4rem] cursor-text',
        className,
        textShadowClass,
        slideStyles.wspRichText,
        slideStyles.wspEditorField,
        isSelected && 'ring-2 ring-[#2563EB] ring-offset-1',
        !isSelected && 'rounded border-2 border-transparent hover:border-dashed hover:border-[#2563EB]/40',
      )}
      style={css}
      dangerouslySetInnerHTML={{ __html: sanitizeWidgetHtml(value) }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }
      }}
    />
  ) : (
    (() => {
      const Tag = field === 'encabezado' ? 'h3' : 'p';
      const empty = !value.trim();
      return (
        <Tag
          role="button"
          tabIndex={0}
          className={cn(
            'm-0 w-full min-w-[4rem] cursor-text',
            className,
            textShadowClass,
            slideStyles.wspEditorField,
            isSelected && 'ring-2 ring-[#2563EB] ring-offset-1',
            !isSelected &&
              'rounded border-2 border-transparent hover:border-dashed hover:border-[#2563EB]/40',
            empty && 'text-muted-foreground/60',
          )}
          style={css}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelect();
            }
          }}
        >
          {empty ? placeholder ?? 'Clic para editar en el panel' : value}
        </Tag>
      );
    })()
  );

  if (hasImageBg) {
    return (
      <div
        className={cn(
          slideStyles.wspOverlayTextEl,
          isSelected && chromeStyles.whInnerHighlight,
        )}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <span
          className={slideStyles.wspTextDragHandle}
          title="Arrastrar"
          aria-label="Arrastrar texto"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={(e) => finishDrag(e.currentTarget, e.pointerId)}
          onPointerCancel={(e) => finishDrag(e.currentTarget, e.pointerId)}
        />
        {editorEl}
      </div>
    );
  }

  return (
    <div
      className={cn(isSelected && 'rounded ring-2 ring-[#2563EB] ring-offset-1')}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {editorEl}
    </div>
  );
}

function SlideImageEditorPopover({
  slide,
  onChangeUrl,
}: {
  slide: WidgetSlideContent;
  onChangeUrl: (url: string) => void;
}) {
  const [urlDraft, setUrlDraft] = useState(slide.imagen ?? '');
  useEffect(() => {
    setUrlDraft(slide.imagen ?? '');
  }, [slide.imagen]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-2 right-2 z-[3] h-7 gap-1 px-2 text-[10px] shadow"
          onPointerDown={stopWidgetInnerPointer}
          onClick={stopWidgetInnerPointer}
        >
          <Camera className="size-3" />
          Imagen
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        side="top"
        align="end"
        sideOffset={8}
        onClick={stopWidgetInnerPointer}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium">URL de imagen</p>
          <Input
            value={urlDraft}
            placeholder="https://..."
            className="h-8 text-xs"
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onChangeUrl(urlDraft.trim());
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChangeUrl(urlDraft.trim())}
            >
              Aplicar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onChangeUrl('')}
            >
              Quitar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface WidgetSlidePanelViewProps {
  slide: WidgetSlideContent;
  configuracion: WidgetSlidePanelConfig;
  isThumbnail?: boolean;
  imageFallbackBackground?: string;
}

export function WidgetSlidePanelView({
  slide,
  configuracion,
  isThumbnail = false,
  imageFallbackBackground,
}: WidgetSlidePanelViewProps) {
  const vis = resolveSlideVisibilidad(configuracion.defaultsSlide, slide);
  const layoutId = resolveSlideLayoutId(slide, configuracion.layoutId);
  const soloTexto = layoutId === 'solo-texto';
  const reverse = layoutId === 'texto-izq-imagen-der';
  const overlay = isOverlayLayout(layoutId) && vis.mostrarImagen && !soloTexto;
  const imageCornerMode = resolveImageCornerMode(layoutId, overlay);

  const panelStyle: React.CSSProperties = {
    ...slidePanelStyle(slide, vis),
    borderColor: configuracion.colorBordeContenido,
  };

  const noopStackRef = { current: null } as React.RefObject<HTMLDivElement | null>;

  const textFields = (
    <>
      {vis.mostrarEncabezado ? (
        <TabTextElement
          field="encabezado"
          slide={slide}
          value={slide.encabezado}
          className={slideStyles.wspHeading}
          isEditing={false}
          isSelected={false}
          hasImageBg={overlay}
          stackRef={noopStackRef}
          onSelect={() => {}}
          onPosChange={() => {}}
        />
      ) : null}
      {vis.mostrarSubtitulo ? (
        <TabTextElement
          field="subtitulo"
          slide={slide}
          value={slide.subtitulo ?? ''}
          className={slideStyles.wspSubtitle}
          isEditing={false}
          isSelected={false}
          hasImageBg={overlay}
          stackRef={noopStackRef}
          onSelect={() => {}}
          onPosChange={() => {}}
        />
      ) : null}
      {vis.mostrarCuerpo ? (
        <TabTextElement
          field="cuerpo"
          slide={slide}
          value={slide.cuerpo}
          className={slideStyles.wspBody}
          isEditing={false}
          isSelected={false}
          hasImageBg={overlay}
          stackRef={noopStackRef}
          onSelect={() => {}}
          onPosChange={() => {}}
        />
      ) : null}
    </>
  );

  if (overlay) {
    return (
      <div
        className={cn(
          slideStyles.wspSlideRow,
          slideStyles.wspSlideOverlay,
          slideStyles.wspPanelFill,
          isThumbnail && 'pointer-events-none overflow-hidden',
        )}
        style={panelStyle}
        role="tabpanel"
        data-widget-slide-panel
      >
        <div className={slideStyles.wspOverlayStack}>
          <TabImageLayer
            slide={slide}
            isSelected={false}
            isEditing={false}
            imageRadius={slide.imagenRadio ?? 8}
            fillOverlay
            imageCornerMode={imageCornerMode}
            isThumbnail={isThumbnail}
            imageFallbackBackground={imageFallbackBackground}
            onSelect={() => {}}
            onPatch={() => {}}
          />
          {textFields}
          <WidgetSlideFreeBlocks blocks={slide.bloques ?? []} isEditing={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        slideStyles.wspSlideRow,
        slideStyles.wspPanelFill,
        reverse && slideStyles.wspSlideRowReverse,
        soloTexto && slideStyles.wspSlideSoloTexto,
        isThumbnail && 'pointer-events-none overflow-hidden',
      )}
      style={panelStyle}
      role="tabpanel"
      data-widget-slide-panel
    >
      {vis.mostrarImagen && !soloTexto ? (
        <TabImageLayer
          slide={slide}
          isSelected={false}
          isEditing={false}
          imageRadius={slide.imagenRadio ?? 8}
          imageCornerMode={imageCornerMode}
          isThumbnail={isThumbnail}
          imageFallbackBackground={imageFallbackBackground}
          onSelect={() => {}}
          onPatch={() => {}}
        />
      ) : null}
      <div className={slideStyles.wspTextCol}>{textFields}</div>
      <WidgetSlideFreeBlocks blocks={slide.bloques ?? []} isEditing={false} />
    </div>
  );
}

export interface WidgetSlidePanelEditorProps {
  slide: WidgetSlideContent;
  configuracion: WidgetSlidePanelConfig;
  innerSelection?: WidgetSlideInnerSelection | null;
  onPatchSlide: (patch: Partial<WidgetSlideContent>) => void;
  onSelectText: (field: WidgetSlideTextField) => void;
  onSelectImage: () => void;
}

export function WidgetSlidePanelEditor({
  slide,
  configuracion,
  innerSelection,
  onPatchSlide,
  onSelectText,
  onSelectImage,
}: WidgetSlidePanelEditorProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const vis = resolveSlideVisibilidad(configuracion.defaultsSlide, slide);
  const layoutId = resolveSlideLayoutId(slide, configuracion.layoutId);
  const soloTexto = layoutId === 'solo-texto';
  const reverse = layoutId === 'texto-izq-imagen-der';
  const overlay = isOverlayLayout(layoutId) && vis.mostrarImagen && !soloTexto;
  const imageCornerMode = resolveImageCornerMode(layoutId, overlay);

  const isTextSelected = (field: WidgetSlideTextField) =>
    innerSelection?.kind === 'slide-text' &&
    innerSelection.slideId === slide.id &&
    innerSelection.field === field;

  const isImageSelected =
    innerSelection?.kind === 'slide-image' && innerSelection.slideId === slide.id;

  const patchPos = (field: WidgetSlideTextField, pos: { x: number; y: number }) => {
    const key = `${field}Pos` as const;
    onPatchSlide({ [key]: pos });
  };

  const panelStyle: React.CSSProperties = {
    ...slidePanelStyle(slide, vis),
    borderColor: configuracion.colorBordeContenido,
  };

  const imageLayer = vis.mostrarImagen && !soloTexto ? (
    <>
      <TabImageLayer
        slide={slide}
        isSelected={isImageSelected}
        isEditing
        imageRadius={slide.imagenRadio ?? 8}
        fillOverlay={overlay}
        imageCornerMode={imageCornerMode}
        onSelect={onSelectImage}
        onPatch={onPatchSlide}
      />
      {overlay ? (
        <SlideImageEditorPopover
          slide={slide}
          onChangeUrl={(imagen) => onPatchSlide({ imagen: imagen || undefined })}
        />
      ) : null}
    </>
  ) : null;

  const textFields = (
    <>
      {vis.mostrarEncabezado ? (
        <TabTextElement
          field="encabezado"
          slide={slide}
          value={slide.encabezado}
          className={slideStyles.wspHeading}
          placeholder="Encabezado"
          isEditing
          isSelected={isTextSelected('encabezado')}
          hasImageBg={overlay}
          stackRef={stackRef}
          onSelect={() => onSelectText('encabezado')}
          onPosChange={(pos) => patchPos('encabezado', pos)}
        />
      ) : null}
      {vis.mostrarSubtitulo ? (
        <TabTextElement
          field="subtitulo"
          slide={slide}
          value={slide.subtitulo ?? ''}
          className={slideStyles.wspSubtitle}
          placeholder="Subtítulo"
          multiline
          isEditing
          isSelected={isTextSelected('subtitulo')}
          hasImageBg={overlay}
          stackRef={stackRef}
          onSelect={() => onSelectText('subtitulo')}
          onPosChange={(pos) => patchPos('subtitulo', pos)}
        />
      ) : null}
      {vis.mostrarCuerpo ? (
        <TabTextElement
          field="cuerpo"
          slide={slide}
          value={slide.cuerpo}
          className={slideStyles.wspBody}
          placeholder="Cuerpo"
          multiline
          isEditing
          isSelected={isTextSelected('cuerpo')}
          hasImageBg={overlay}
          stackRef={stackRef}
          onSelect={() => onSelectText('cuerpo')}
          onPosChange={(pos) => patchPos('cuerpo', pos)}
        />
      ) : null}
    </>
  );

  const patchFreeBlock = (blockId: string, patch: Partial<WidgetSlideTextBlock>) => {
    onPatchSlide({
      bloques: (slide.bloques ?? []).map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
    });
  };

  const freeBlocksLayer = (
    <WidgetSlideFreeBlocks
      blocks={slide.bloques ?? []}
      isEditing
      onPatchBlock={patchFreeBlock}
    />
  );

  if (overlay) {
    return (
      <div
        className={cn(slideStyles.wspSlideRow, slideStyles.wspSlideOverlay, slideStyles.wspPanelFill)}
        style={panelStyle}
        data-widget-slide-panel
      >
        <div className={slideStyles.wspOverlayStack} ref={stackRef}>
          {imageLayer}
          {textFields}
          {freeBlocksLayer}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        slideStyles.wspSlideRow,
        slideStyles.wspPanelFill,
        isSplitLayout(layoutId) && reverse && slideStyles.wspSlideRowReverse,
        soloTexto && slideStyles.wspSlideSoloTexto,
      )}
      style={panelStyle}
      data-widget-slide-panel
    >
      {imageLayer}
      <div className={slideStyles.wspTextCol}>{textFields}</div>
      {freeBlocksLayer}
      {vis.mostrarImagen && !soloTexto && !overlay ? (
        <SlideImageEditorPopover
          slide={slide}
          onChangeUrl={(imagen) => onPatchSlide({ imagen: imagen || undefined })}
        />
      ) : null}
    </div>
  );
}
