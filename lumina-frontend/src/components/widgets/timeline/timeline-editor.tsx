'use client';

import React, { useState } from 'react';
import type { TimelineWidget, TimelineNodo } from '@/types/widget.types';
import { cn } from '@/lib/utils';
import chromeStyles from '@/components/widgets/shared/widget-chrome.module.css';
import { WidgetHeaderEditorField } from '@/components/widgets/shared/widget-header-editor';
import { useWidgetImageDimensions } from '@/components/widgets/shared/use-widget-image-dimensions';
import { imageElementStyle, usesComputedImageLayout } from '@/components/widgets/shared/widget-image-styles';
import {
  stopWidgetInnerKeydown,
  stopWidgetInnerPointer,
} from '@/components/widgets/shared/widget-editor-utils';
import { PanelOnlyText } from '@/components/widgets/shared/panel-only-field';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import styles from './timeline.module.css';
import { normalizeTimelineWidget, type TimelineInnerSelection } from './timeline-config';
import {
  TimelineContainerStyle,
  timelineBodyPadding,
  timelineHeaderPadding,
} from './timeline-shared';
import { TimelineNodeItem } from './timeline-parts';
import { TimelineStage } from './timeline-stage';
import { timelineUsesSegmentBar } from './timeline-variant-meta';
import {
  timelineCuerpoTextStyle,
  timelineEtiquetaTextStyle,
  timelineTituloTextStyle,
} from './timeline-text-styles';
import { textStyleToCss } from '@/components/widgets/shared/widget-text-styles';
import slideStyles from '@/components/widgets/shared/widget-slide-panel.module.css';

export interface TimelineEditorProps {
  block: TimelineWidget;
  onChange: (block: TimelineWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: TimelineInnerSelection | null;
  onInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
}

function InlineTextEditor({
  value,
  field,
  textStyle,
  extraClassName,
  vertical = false,
  onFocusSelect,
}: {
  value: string;
  field: 'etiqueta' | 'cuerpo';
  textStyle?: React.CSSProperties;
  extraClassName?: string;
  vertical?: boolean;
  onFocusSelect: () => void;
}) {
  const isVerticalBody = vertical && field === 'cuerpo';

  return (
    <PanelOnlyText
      value={value}
      placeholder={field === 'etiqueta' ? 'Etiqueta…' : 'Cuerpo…'}
      className={cn(
        vertical
          ? isVerticalBody
            ? cn(styles.tlVerticalBodyInput, styles.tlVerticalBody, extraClassName)
            : cn(styles.tlVerticalTextInput, styles.tlVerticalLabel, extraClassName)
          : cn(
              styles.tlCardTextInput,
              field === 'etiqueta' ? styles.tlCardEtiqueta : styles.tlCardCuerpo,
              extraClassName,
            ),
        'block w-full',
      )}
      style={{
        ...textStyle,
        textAlign:
          textStyle?.textAlign ??
          (vertical && !isVerticalBody ? undefined : isVerticalBody ? 'left' : 'center'),
      }}
      multiline={field === 'cuerpo' || vertical}
      onSelect={onFocusSelect}
    />
  );
}

function ImageUrlPopover({ url, onCommit, children }: { url?: string; onCommit: (url: string | undefined) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(url ?? '');

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(url ?? ''); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="center" onPointerDown={stopWidgetInnerPointer} onClick={stopWidgetInnerPointer}>
        <p className="mb-2 text-xs font-medium">URL de imagen</p>
        <Input
          value={draft}
          placeholder="https://…"
          className="mb-2 h-8 text-xs"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { onCommit(draft.trim() || undefined); setOpen(false); } }}
        />
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" size="sm" className="h-7 text-xs" onClick={() => { onCommit(draft.trim() || undefined); setOpen(false); }}>Aplicar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimelineEditorNode({
  nodo,
  index,
  config,
  innerSelection,
  onEnsureBlockSelected,
  onInnerSelectionChange,
  patchNodo,
}: {
  nodo: TimelineNodo;
  index: number;
  config: TimelineWidget['configuracion'];
  innerSelection?: TimelineInnerSelection | null;
  onEnsureBlockSelected: () => void;
  onInnerSelectionChange: (s: TimelineInnerSelection | null) => void;
  patchNodo: (patch: Partial<TimelineNodo>) => void;
}) {
  const { containerRef, imgRef, imgDims, getEffectiveContainerDims, handleImageLoad } = useWidgetImageDimensions(nodo.imagen);
  const effectiveContainerDims = getEffectiveContainerDims();
  const computedImageLayout = usesComputedImageLayout(imgDims, effectiveContainerDims);
  const imageStyle = imageElementStyle(nodo, imgDims, effectiveContainerDims);

  const isSelected = innerSelection?.kind === 'nodo' && innerSelection.index === index ||
                     innerSelection?.kind === 'texto' && innerSelection.nodoIndex === index ||
                     innerSelection?.kind === 'imagen' && innerSelection.nodoIndex === index;

  const v = config.variante;
  const isVerticalVariant = v === 'vertical';
  const yearOnBar = timelineUsesSegmentBar(v);
  const usesTitulo =
    yearOnBar || isVerticalVariant || v === 'corporate' || v === 'proyecto' || v === 'infografica';
  const showCardImage = nodo.mostrarImagen && (v === 'tarjetas' || v === 'minimal' || v === 'segmentada');
  const showDotOrProyectoImage =
    nodo.mostrarImagen && (v === 'iconos' || v === 'infografica' || v === 'proyecto');

  return (
    <TimelineNodeItem
      nodo={nodo}
      index={index}
      config={config}
      isActive={isSelected}
      interactive
      imageStyle={imageStyle}
      computedImageLayout={computedImageLayout}
      containerRef={containerRef}
      imgRef={imgRef}
      onImageLoad={handleImageLoad}
      onNodeActivate={() => {
        onEnsureBlockSelected();
        onInnerSelectionChange({ kind: 'nodo', index });
      }}
      etiquetaSlot={
        v === 'proyecto' && nodo.mostrarNumeroPaso ? (
          <InlineTextEditor
            value={nodo.numeroPaso ?? ''}
            field="etiqueta"
            textStyle={timelineEtiquetaTextStyle(nodo, config)}
            extraClassName={styles.tlProyectoNum}
            onFocusSelect={() => {
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'texto', nodoIndex: index, field: 'etiqueta' });
            }}
          />
        ) : (isVerticalVariant || v === 'tarjetas' || v === 'minimal') && nodo.mostrarEtiqueta ? (
          <InlineTextEditor
            value={nodo.etiqueta}
            field="etiqueta"
            textStyle={timelineEtiquetaTextStyle(nodo, config)}
            vertical={isVerticalVariant}
            extraClassName={isVerticalVariant ? styles.tlVerticalYear : undefined}
            onFocusSelect={() => {
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'texto', nodoIndex: index, field: 'etiqueta' });
            }}
          />
        ) : undefined
      }
      tituloSlot={
        usesTitulo && nodo.mostrarTituloNodo ? (
          <InlineTextEditor
            value={nodo.tituloNodo ?? ''}
            field="etiqueta"
            textStyle={timelineTituloTextStyle(nodo, index, config)}
            vertical={isVerticalVariant}
            extraClassName={
              isVerticalVariant
                ? styles.tlVerticalTitle
                : yearOnBar
                  ? styles.tlCardTitulo
                  : undefined
            }
            onFocusSelect={() => {
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'texto', nodoIndex: index, field: 'titulo' });
            }}
          />
        ) : undefined
      }
      imagenSlot={
        showCardImage ? (
          <div
            className={styles.tlCardImagen}
            ref={containerRef}
            onPointerDown={(e) => {
              stopWidgetInnerPointer(e);
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'imagen', nodoIndex: index });
            }}
          >
            {nodo.imagen ? (
              <div className="relative flex size-full items-center justify-center">
                <img
                  ref={imgRef}
                  src={nodo.imagen}
                  alt=""
                  className={slideStyles.wspImageFit}
                  style={{ ...imageStyle, position: 'absolute', inset: 0 }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                <ImageUrlPopover url={nodo.imagen} onCommit={(imagen) => patchNodo({ imagen })}>
                  <button type="button" className="absolute right-0 top-0 z-[2] rounded-md bg-black/50 p-1 text-white" aria-label="Cambiar imagen" onPointerDown={stopWidgetInnerPointer}>
                    <Camera className="size-3.5" />
                  </button>
                </ImageUrlPopover>
              </div>
            ) : (
              <ImageUrlPopover url={nodo.imagen} onCommit={(imagen) => patchNodo({ imagen })}>
                <button type="button" className="flex h-[60px] w-full items-center justify-center gap-1 rounded bg-slate-100 text-xs text-slate-500 transition-colors hover:bg-slate-200">
                  <Camera className="size-3.5" /> Añadir imagen
                </button>
              </ImageUrlPopover>
            )}
          </div>
        ) : showDotOrProyectoImage ? (
          <div
            className={v === 'proyecto' ? styles.tlProyectoPhoto : styles.tlCardImagen}
            ref={containerRef}
            onPointerDown={(e) => {
              stopWidgetInnerPointer(e);
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'imagen', nodoIndex: index });
            }}
          >
            {nodo.imagen ? (
              <div className="relative flex size-full items-center justify-center">
                <img
                  ref={imgRef}
                  src={nodo.imagen}
                  alt=""
                  className={cn(v === 'proyecto' ? 'size-full object-cover' : slideStyles.wspImageFit)}
                  style={v === 'proyecto' ? imageStyle : { ...imageStyle, position: 'absolute', inset: 0 }}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
                <ImageUrlPopover url={nodo.imagen} onCommit={(imagen) => patchNodo({ imagen })}>
                  <button type="button" className="absolute right-0 top-0 z-[2] rounded-md bg-black/50 p-1 text-white" aria-label="Cambiar imagen" onPointerDown={stopWidgetInnerPointer}>
                    <Camera className="size-3.5" />
                  </button>
                </ImageUrlPopover>
              </div>
            ) : (
              <ImageUrlPopover url={nodo.imagen} onCommit={(imagen) => patchNodo({ imagen })}>
                <button type="button" className="flex size-full min-h-[56px] items-center justify-center gap-1 rounded-full bg-slate-100 text-xs text-slate-500 hover:bg-slate-200">
                  <Camera className="size-3.5" /> Imagen
                </button>
              </ImageUrlPopover>
            )}
          </div>
        ) : undefined
      }
      cuerpoSlot={
        nodo.mostrarCuerpo ? (
          <InlineTextEditor
            value={nodo.cuerpo}
            field="cuerpo"
            textStyle={timelineCuerpoTextStyle(nodo, config)}
            vertical={isVerticalVariant}
            extraClassName={isVerticalVariant ? styles.tlVerticalBody : undefined}
            onFocusSelect={() => {
              onEnsureBlockSelected();
              onInnerSelectionChange({ kind: 'texto', nodoIndex: index, field: 'cuerpo' });
            }}
          />
        ) : undefined
      }
    />
  );
}

export function TimelineEditor({
  block,
  onChange,
  onEnsureBlockSelected,
  innerSelection,
  onInnerSelectionChange,
}: TimelineEditorProps) {
  const widget = normalizeTimelineWidget(block);
  const { configuracion, nodos } = widget;

  const patchWidget = (fn: (w: TimelineWidget) => TimelineWidget) => {
    onChange(fn(normalizeTimelineWidget(block)));
  };

  const patchNodo = (index: number, patch: Partial<TimelineNodo>) => {
    patchWidget((w) => ({
      ...w,
      nodos: w.nodos.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    }));
  };

  return (
    <div
      className={cn(chromeStyles.whRoot, styles.tlRoot)}
      style={TimelineContainerStyle(configuracion)}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-widget-header-field]')) return;
        if (target.closest('textarea, input')) return;
        onInnerSelectionChange?.({ kind: 'widget' });
      }}
    >
      <div className={chromeStyles.whHeader} style={timelineHeaderPadding(configuracion)}>
        {configuracion.mostrarTituloWidget && (
          <WidgetHeaderEditorField
            value={widget.tituloWidget}
            field="tituloWidget"
            className={chromeStyles.whHeaderTitle}
            style={textStyleToCss(widget.estilosHeader?.tituloWidget)}
            placeholder="Título del widget"
            onCommit={(tituloWidget) => patchWidget((w) => ({ ...w, tituloWidget }))}
            onFocusSelect={(field) => {
              onEnsureBlockSelected?.();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        )}
        {configuracion.mostrarSubtitulo && (
          <WidgetHeaderEditorField
            value={widget.subtituloWidget}
            field="subtituloWidget"
            className={chromeStyles.whHeaderSubtitle}
            style={textStyleToCss(widget.estilosHeader?.subtituloWidget)}
            placeholder="Descripción"
            multiline
            onCommit={(subtituloWidget) => patchWidget((w) => ({ ...w, subtituloWidget }))}
            onFocusSelect={(field) => {
              onEnsureBlockSelected?.();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        )}
        {configuracion.mostrarInstruccion && (
          <WidgetHeaderEditorField
            value={widget.instruccion}
            field="instruccion"
            className={chromeStyles.whHeaderInstruction}
            style={textStyleToCss(widget.estilosHeader?.instruccion)}
            placeholder="Instrucción"
            multiline
            onCommit={(instruccion) => patchWidget((w) => ({ ...w, instruccion }))}
            onFocusSelect={(field) => {
              onEnsureBlockSelected?.();
              onInnerSelectionChange?.({ kind: 'header-text', field });
            }}
          />
        )}
      </div>

      <div className={chromeStyles.whContent} style={timelineBodyPadding(configuracion)}>
        <div className={styles.tlBody}>
          <TimelineStage config={configuracion} nodos={nodos}>
            {nodos.map((nodo, idx) => (
              <TimelineEditorNode
                key={nodo.id}
                nodo={nodo}
                index={idx}
                config={configuracion}
                innerSelection={innerSelection}
                onEnsureBlockSelected={() => onEnsureBlockSelected?.()}
                onInnerSelectionChange={(s) => onInnerSelectionChange?.(s)}
                patchNodo={(patch) => patchNodo(idx, patch)}
              />
            ))}
          </TimelineStage>
        </div>
      </div>
    </div>
  );
}
