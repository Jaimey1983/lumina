'use client';

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';

import type { FlipCard, FlipCardCara, FlipCardElementPos, FlipCardsWidget } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import type {
  FlipCardsCaraLado,
  FlipCardsInnerSelection,
} from './flip-cards-config';
import type { FlipCardsConfiguracionCompleta } from './flip-cards-config';
import { imageElementStyle, imageWrapperStyle } from './flip-cards-image-styles';
import { useWidgetImageDimensions } from '@/components/widgets/shared/use-widget-image-dimensions';
import { computeImagePanClamp, usesComputedImageLayout } from '@/components/widgets/shared/widget-image-styles';
import { PanelOnlyText } from '@/components/widgets/shared/panel-only-field';
import {
  clampCardPos,
  resolveCaraVisibilidad,
  resolveTextPos,
} from './flip-cards-card-utils';
import styles from './flip-cards.module.css';
import {
  flipCardsCardChromeStyle,
  flipCardsContainerStyle,
  flipCardsGridStyle,
  flipCardsHeaderStyle,
  flipCardsPerPage,
  mergedFlipCardsConfig,
  normalizeFlipCardsWidget,
  textStyleToCss,
} from './flip-cards-shared';

export interface FlipCardsEditorProps {
  block: FlipCardsWidget;
  onChange: (block: FlipCardsWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: FlipCardsInnerSelection | null;
  onInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
}

function defaultTitleColor(lado: FlipCardsCaraLado): string {
  return lado === 'reverso' ? '#ffffff' : '#0f172a';
}

function defaultBodyColor(lado: FlipCardsCaraLado): string {
  return lado === 'reverso' ? 'rgba(255,255,255,0.92)' : '#475569';
}

function isInnerTextActive(
  sel: FlipCardsInnerSelection | null | undefined,
  cardId: string,
  face: FlipCardsCaraLado,
  field: 'titulo' | 'cuerpo',
): boolean {
  return (
    sel?.kind === 'card-text' &&
    sel.cardId === cardId &&
    sel.face === face &&
    sel.field === field
  );
}

function isInnerImageActive(
  sel: FlipCardsInnerSelection | null | undefined,
  cardId: string,
  face: FlipCardsCaraLado,
): boolean {
  return sel?.kind === 'card-image' && sel.cardId === cardId && sel.face === face;
}

function GlobalFaceBar({
  vista,
  onChange,
  onEnsureBlockSelected,
}: {
  vista: FlipCardsCaraLado;
  onChange: (v: FlipCardsCaraLado) => void;
  onEnsureBlockSelected?: () => void;
}) {
  return (
    <div
      className={styles.fcGlobalFaceBar}
      onPointerDown={(e) => {
        e.stopPropagation();
        onEnsureBlockSelected?.();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex min-w-[200px] rounded-md bg-[#f1f5f9] p-0.5 text-xs font-semibold">
        {(['frente', 'reverso'] as const).map((side) => (
          <button
            key={side}
            type="button"
            className={cn(
              'flex-1 rounded px-4 py-1.5 transition-colors',
              vista === side ? 'bg-[#2563EB] text-white' : 'text-[#64748b] hover:text-[#0f172a]',
            )}
            onClick={() => onChange(side)}
          >
            {side === 'frente' ? 'Frente' : 'Atrás'}
          </button>
        ))}
      </div>
    </div>
  );
}

function InlineHeaderField({
  value,
  field,
  className,
  style,
  placeholder,
  multiline,
  isSelected,
  onFocusSelect,
}: {
  value: string;
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  isSelected?: boolean;
  onFocusSelect: (field: 'tituloWidget' | 'subtituloWidget' | 'instruccion') => void;
}) {
  return (
    <PanelOnlyText
      value={value}
      placeholder={placeholder}
      className={cn('block w-full', className)}
      style={{ ...style, padding: '2px 4px' }}
      multiline={multiline}
      isSelected={isSelected}
      dataAttr="data-flip-header-field"
      onSelect={() => onFocusSelect(field)}
    />
  );
}

function ImageUrlPopover({
  url,
  onCommit,
  children,
}: {
  url?: string;
  onCommit: (url: string | undefined) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(url ?? '');

  useEffect(() => {
    if (open) setDraft(url ?? '');
  }, [open, url]);

  const commit = () => {
    const trimmed = draft.trim();
    onCommit(trimmed || undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs font-medium text-foreground">URL de imagen</p>
        <Input
          value={draft}
          placeholder="https://…"
          className="mb-2 h-8 text-xs"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
        />
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="button" size="sm" className="h-7 text-xs" onClick={commit}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FlipCardImageLayer({
  data,
  cardRadius,
  isSelected,
  isEditing,
  onSelect,
  onPatch,
}: {
  data: FlipCardCara;
  cardRadius: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<FlipCardCara>) => void;
}) {
  const { containerRef, imgRef, imgDims, getEffectiveContainerDims, handleImageLoad } =
    useWidgetImageDimensions(data.imagen);

  const effectiveContainerDims = getEffectiveContainerDims();
  const computedImageLayout = usesComputedImageLayout(imgDims, effectiveContainerDims);
  const panRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    w: number;
    h: number;
  } | null>(null);
  const resizeRef = useRef<{ startY: number; scale: number } | null>(null);

  const finishPan = (el: HTMLElement, pointerId: number) => {
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

  return (
    <div
      ref={containerRef}
      className={cn(
        styles.fcImageLayer,
        isEditing && styles.fcImageLayerInteractive,
        isSelected && styles.fcInnerHighlight,
      )}
      style={imageWrapperStyle(data, cardRadius)}
      onPointerDown={(e) => {
        if (!isEditing) return;
        e.stopPropagation();
        onSelect();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          ox: data.imagenOffsetX ?? 0,
          oy: data.imagenOffsetY ?? 0,
          w: Math.max(rect.width, 1),
          h: Math.max(rect.height, 1),
        };
      }}
      onPointerMove={(e) => {
        if (panRef.current) {
          const scale = (data.imagenEscala ?? 100) / 100;
          const { maxPanX, maxPanY } = computeImagePanClamp(
            imgDims.w,
            imgDims.h,
            panRef.current.w,
            panRef.current.h,
            scale,
          );
          const dx = e.clientX - panRef.current.startX;
          const dy = e.clientY - panRef.current.startY;
          onPatch({
            imagenOffsetX: Math.max(-maxPanX, Math.min(maxPanX, panRef.current.ox + dx)),
            imagenOffsetY: Math.max(-maxPanY, Math.min(maxPanY, panRef.current.oy + dy)),
          });
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
        src={data.imagen}
        alt={data.imagenAlt ?? ''}
        className={computedImageLayout ? styles.flipImagePlaced : styles.flipImageFit}
        style={imageElementStyle(data, imgDims, effectiveContainerDims)}
        onLoad={handleImageLoad}
        draggable={false}
      />
      {isEditing && isSelected ? (
        <span
          className={styles.fcImageResizeHandle}
          title="Arrastra para cambiar el zoom"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            resizeRef.current = {
              startY: e.clientY,
              scale: Math.max(100, data.imagenEscala ?? 100),
            };
          }}
        />
      ) : null}
    </div>
  );
}

function CardTextElement({
  pos,
  value,
  css,
  isEditing,
  isSelected,
  hasImageBg,
  isTitle,
  stackRef,
  onSelect,
  onPosChange,
}: {
  pos: FlipCardElementPos;
  value: string;
  css: React.CSSProperties;
  isEditing: boolean;
  isSelected: boolean;
  hasImageBg: boolean;
  isTitle: boolean;
  stackRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onPosChange: (pos: FlipCardElementPos) => void;
}) {
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
    onPosChange(clampCardPos(dragRef.current.ox + dx, dragRef.current.oy + dy));
  };

  const textShadowClass = hasImageBg ? styles.fcTextOnImage : undefined;

  return (
    <div
      className={cn(
        styles.fcCardTextEl,
        isEditing && styles.fcCardTextElEditing,
        isSelected && styles.fcCardTextElSelected,
        isSelected && styles.fcInnerHighlight,
      )}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      {isEditing ? (
        <span
          className={styles.fcTextDragHandle}
          title="Arrastrar"
          aria-label="Arrastrar texto"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={(e) => finishDrag(e.currentTarget, e.pointerId)}
          onPointerCancel={(e) => finishDrag(e.currentTarget, e.pointerId)}
        />
      ) : null}
      {isTitle ? (
        <p
          role="button"
          tabIndex={0}
          className={cn(
            styles.flipTitle,
            'm-0 cursor-text',
            textShadowClass,
            isEditing && isSelected && styles.fcInnerHighlight,
          )}
          style={css}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (isEditing) onSelect();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditing) onSelect();
          }}
          onKeyDown={(e) => {
            if (!isEditing) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelect();
            }
          }}
        >
          {value.trim() || (isEditing ? 'Clic para editar en el panel' : '')}
        </p>
      ) : (
        <p
          role="button"
          tabIndex={0}
          className={cn(
            styles.flipText,
            'm-0 cursor-text',
            textShadowClass,
            isEditing && isSelected && styles.fcInnerHighlight,
          )}
          style={css}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (isEditing) onSelect();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditing) onSelect();
          }}
          onKeyDown={(e) => {
            if (!isEditing) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelect();
            }
          }}
        >
          {value.trim() || (isEditing ? 'Clic para editar en el panel' : '')}
        </p>
      )}
    </div>
  );
}

function EditorCard({
  card,
  cardId,
  vistaCara,
  isEditing,
  configuracion,
  innerSelection,
  onSelect,
  onSelectText,
  onSelectImage,
  onPatchFace,
  onEnsureBlockSelected,
}: {
  card: FlipCard;
  cardId: string;
  vistaCara: FlipCardsCaraLado;
  isEditing: boolean;
  configuracion: FlipCardsConfiguracionCompleta;
  innerSelection?: FlipCardsInnerSelection | null;
  onSelect: () => void;
  onSelectText: (field: 'titulo' | 'cuerpo') => void;
  onSelectImage: () => void;
  onPatchFace: (patch: Partial<FlipCardCara>) => void;
  onEnsureBlockSelected?: () => void;
}) {
  const data = vistaCara === 'frente' ? card.frente : card.reverso;
  const vis = resolveCaraVisibilidad(configuracion, vistaCara, data);
  const bg = vistaCara === 'frente' ? configuracion.colorFrente : configuracion.colorReverso;
  const titleColor = data.estiloTitulo?.color ?? defaultTitleColor(vistaCara);
  const bodyColor = data.estiloCuerpo?.color ?? defaultBodyColor(vistaCara);
  const stackRef = useRef<HTMLDivElement>(null);
  const titlePos = resolveTextPos(data, 'titulo');
  const bodyPos = resolveTextPos(data, 'cuerpo');

  const chrome = flipCardsCardChromeStyle(configuracion, false);
  const titleCss = {
    color: titleColor,
    ...textStyleToCss(data.estiloTitulo),
  };
  const bodyCss = {
    color: bodyColor,
    ...textStyleToCss(data.estiloCuerpo),
  };

  const handleCardPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    onEnsureBlockSelected?.();
  };

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    onEnsureBlockSelected?.();
  };

  const showImage = vis.mostrarImagen;
  const showTitle = vis.mostrarTitulo;
  const showBody = vis.mostrarCuerpo;
  const hasImage = showImage && !!data.imagen;
  const imageSelected = isInnerImageActive(innerSelection, cardId, vistaCara);

  return (
    <div
      data-flip-card
      className={cn(
        styles.fcEditorCard,
        isEditing && styles.fcEditorCardSelected,
      )}
      style={{ backgroundColor: bg, ...chrome }}
      onPointerDown={handleCardPointerDown}
      onClick={handleCardClick}
    >
      <span className={styles.fcFaceBadge}>
        {vistaCara === 'frente' ? 'Frente' : 'Atrás'}
      </span>

      <div className={styles.fcFaceStack} ref={stackRef}>
        {hasImage ? (
          <>
            <FlipCardImageLayer
              data={data}
              cardRadius={configuracion.bordeTarjetaRadio}
              isSelected={imageSelected}
              isEditing={isEditing}
              onSelect={onSelectImage}
              onPatch={onPatchFace}
            />
            {isEditing ? (
              <ImageUrlPopover
                url={data.imagen}
                onCommit={(imagen) => onPatchFace({ imagen })}
              >
                <button
                  type="button"
                  className="absolute right-2 top-8 z-[3] rounded-md bg-black/55 p-1.5 text-white shadow-sm"
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Cambiar imagen"
                >
                  <Camera className="size-4" />
                </button>
              </ImageUrlPopover>
            ) : null}
          </>
        ) : showImage && !hasImage ? (
          <ImageUrlPopover
            url={data.imagen}
            onCommit={(imagen) => onPatchFace({ imagen })}
          >
            <button
              type="button"
              className={cn(
                styles.fcImagePlaceholderBtn,
                !isEditing && 'opacity-70',
                imageSelected && styles.fcInnerHighlight,
              )}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
                onEnsureBlockSelected?.();
              }}
            >
              <span
                className={cn(
                  styles.fcImagePlaceholder,
                  'relative mx-0 mt-0 h-16 w-[calc(100%-1rem)] max-w-none',
                )}
              >
                ＋ Imagen
              </span>
            </button>
          </ImageUrlPopover>
        ) : null}

        {showTitle ? (
          <CardTextElement
            pos={titlePos}
            value={data.titulo}
            css={titleCss}
            isEditing={isEditing}
            isSelected={isInnerTextActive(innerSelection, cardId, vistaCara, 'titulo')}
            hasImageBg={hasImage}
            isTitle
            stackRef={stackRef}
            onSelect={() => onSelectText('titulo')}
            onPosChange={(tituloPos) => onPatchFace({ tituloPos })}
          />
        ) : null}
        {showBody ? (
          <CardTextElement
            pos={bodyPos}
            value={data.cuerpo}
            css={bodyCss}
            isEditing={isEditing}
            isSelected={isInnerTextActive(innerSelection, cardId, vistaCara, 'cuerpo')}
            hasImageBg={hasImage}
            isTitle={false}
            stackRef={stackRef}
            onSelect={() => onSelectText('cuerpo')}
            onPosChange={(cuerpoPos) => onPatchFace({ cuerpoPos })}
          />
        ) : null}
      </div>
    </div>
  );
}

export function FlipCardsEditor({
  block: rawBlock,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: FlipCardsEditorProps) {
  const block = normalizeFlipCardsWidget(rawBlock);
  const configuracion = mergedFlipCardsConfig(block);
  const { tarjetas } = block;
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editorVistaCara, setEditorVistaCara] = useState<FlipCardsCaraLado>('frente');
  const [editorPage, setEditorPage] = useState(0);

  const perPage = flipCardsPerPage(configuracion.columnas);
  const totalPages = Math.max(1, Math.ceil(tarjetas.length / perPage));
  const safePage = Math.min(editorPage, totalPages - 1);

  const visibleCards = tarjetas.slice(
    safePage * perPage,
    safePage * perPage + perPage,
  );

  const needsNav = tarjetas.length > perPage;
  const showPrev = needsNav && configuracion.mostrarBotonAnterior;
  const showNext = needsNav && configuracion.mostrarBotonSiguiente;

  useEffect(() => {
    if (editorPage > totalPages - 1) setEditorPage(Math.max(0, totalPages - 1));
  }, [editorPage, totalPages]);

  const patchBlock = (fn: (w: FlipCardsWidget) => FlipCardsWidget) => {
    onChange(fn(block));
  };

  const reportSelection = (sel: FlipCardsInnerSelection | null) => {
    onInnerSelectionChange?.(sel);
  };

  const patchCardFace = (
    cardId: string,
    face: FlipCardsCaraLado,
    patch: Partial<FlipCardCara>,
  ) => {
    patchBlock((w) => ({
      ...w,
      tarjetas: w.tarjetas.map((c) => {
        if (c.id !== cardId) return c;
        if (face === 'frente') {
          return { ...c, frente: { ...c.frente, ...patch } };
        }
        return { ...c, reverso: { ...c.reverso, ...patch } };
      }),
    }));
  };

  const handleRootClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-flip-card]') && !target.closest('[data-flip-header-field]')) {
      setEditingCardId(null);
      reportSelection({ kind: 'widget' });
    }
  };

  const selectCard = (cardId: string) => {
    onEnsureBlockSelected?.();
    setEditingCardId(cardId);
    reportSelection({ kind: 'card', cardId, face: editorVistaCara });
  };

  const handleVistaChange = (vista: FlipCardsCaraLado) => {
    setEditorVistaCara(vista);
    if (editingCardId && innerSelection?.kind === 'card-text') {
      reportSelection({
        kind: 'card-text',
        cardId: editingCardId,
        face: vista,
        field: innerSelection.field,
      });
    } else if (editingCardId && innerSelection?.kind === 'card-image') {
      reportSelection({ kind: 'card-image', cardId: editingCardId, face: vista });
    } else if (editingCardId && innerSelection?.kind === 'card') {
      reportSelection({ kind: 'card', cardId: editingCardId, face: vista });
    }
  };

  const headerStyle = (field: 'tituloWidget' | 'subtituloWidget' | 'instruccion') =>
    textStyleToCss(block.estilosHeader?.[field]);

  const headerFieldClass = (field: 'tituloWidget' | 'subtituloWidget' | 'instruccion') =>
    cn(
      innerSelection?.kind === 'header-text' &&
        innerSelection.field === field &&
        styles.fcInnerHighlight,
    );

  const headerPad = flipCardsHeaderStyle(configuracion);

  return (
    <div
      className={styles.fcRoot}
      style={flipCardsContainerStyle(block)}
      onPointerDown={(e) => {
        e.stopPropagation();
        onEnsureBlockSelected?.();
      }}
      onClick={handleRootClick}
    >
      <div className={cn(styles.fcHeader, 'mb-3 shrink-0 space-y-1')} style={headerPad}>
        {configuracion.mostrarTituloWidget ? (
          <div className="flex items-baseline gap-1">
            <InlineHeaderField
              value={block.tituloWidget}
              field="tituloWidget"
              placeholder="Título del widget"
              isSelected={
                innerSelection?.kind === 'header-text' &&
                innerSelection.field === 'tituloWidget'
              }
              className={cn(
                'text-base font-bold leading-tight text-[#0f172a]',
                headerFieldClass('tituloWidget'),
              )}
              style={headerStyle('tituloWidget')}
              onFocusSelect={(field) => {
                onEnsureBlockSelected?.();
                reportSelection({ kind: 'header-text', field });
              }}
            />
          </div>
        ) : null}
        {configuracion.mostrarSubtitulo ? (
          <div className="flex items-baseline gap-1">
            <InlineHeaderField
              value={block.subtituloWidget}
              field="subtituloWidget"
              placeholder="Subtítulo del widget"
              multiline
              isSelected={
                innerSelection?.kind === 'header-text' &&
                innerSelection.field === 'subtituloWidget'
              }
              className={cn('text-sm leading-snug text-[#64748b]', headerFieldClass('subtituloWidget'))}
              style={headerStyle('subtituloWidget')}
              onFocusSelect={(field) => {
                onEnsureBlockSelected?.();
                reportSelection({ kind: 'header-text', field });
              }}
            />
          </div>
        ) : null}
        {configuracion.mostrarInstruccion ? (
          <div className="flex items-baseline gap-1">
            <InlineHeaderField
              value={block.instruccion}
              field="instruccion"
              placeholder="Instrucción para el estudiante"
              multiline
              isSelected={
                innerSelection?.kind === 'header-text' &&
                innerSelection.field === 'instruccion'
              }
              className={cn('text-xs leading-snug text-[#64748b]', headerFieldClass('instruccion'))}
              style={headerStyle('instruccion')}
              onFocusSelect={(field) => {
                onEnsureBlockSelected?.();
                reportSelection({ kind: 'header-text', field });
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div
          className={cn(styles.fcGrid, 'min-h-0 flex-1 overflow-auto')}
          style={flipCardsGridStyle(configuracion)}
        >
          {visibleCards.map((card) => (
            <EditorCard
              key={card.id}
              card={card}
              cardId={card.id}
              vistaCara={editorVistaCara}
              isEditing={editingCardId === card.id}
              configuracion={configuracion}
              innerSelection={innerSelection}
              onSelect={() => selectCard(card.id)}
              onSelectText={(field) => {
                onEnsureBlockSelected?.();
                setEditingCardId(card.id);
                reportSelection({
                  kind: 'card-text',
                  cardId: card.id,
                  face: editorVistaCara,
                  field,
                });
              }}
              onSelectImage={() => {
                onEnsureBlockSelected?.();
                setEditingCardId(card.id);
                reportSelection({
                  kind: 'card-image',
                  cardId: card.id,
                  face: editorVistaCara,
                });
              }}
              onPatchFace={(patch) => patchCardFace(card.id, editorVistaCara, patch)}
              onEnsureBlockSelected={onEnsureBlockSelected}
            />
          ))}
        </div>

        {needsNav && (showPrev || showNext) ? (
          <div
            className={styles.fcNav}
            onPointerDown={(e) => {
              e.stopPropagation();
              onEnsureBlockSelected?.();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showPrev ? (
              <button
                type="button"
                className={styles.fcNavBtn}
                disabled={safePage <= 0}
                aria-label="Página anterior"
                onClick={() => setEditorPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}
            <span className={styles.fcNavLabel}>
              {safePage + 1} / {totalPages}
            </span>
            {showNext ? (
              <button
                type="button"
                className={styles.fcNavBtn}
                disabled={safePage >= totalPages - 1}
                aria-label="Página siguiente"
                onClick={() => setEditorPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        <GlobalFaceBar
          vista={editorVistaCara}
          onChange={handleVistaChange}
          onEnsureBlockSelected={onEnsureBlockSelected}
        />
      </div>
    </div>
  );
}
