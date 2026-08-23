'use client';

import { useEffect, useState, type FocusEvent } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';

import type {
  ClickRevealConfiguracion,
  ClickRevealInnerSelection,
  ClickRevealTrigger,
  ClickRevealWidget,
  WidgetSlideContent,
  WidgetSlideTextField,
} from '@/types/widget.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { imageFilterStyle } from '@/components/widgets/shared/widget-image-styles';
import { TabsSlidePanelEditor } from '@/components/widgets/tabs/tabs-slide-panel';
import { TabsSlidePanelView } from '@/components/widgets/tabs/tabs-slide-panel';
import { stopWidgetInnerPointer, useEscapeToClose } from '@/components/widgets/shared/widget-editor-utils';

import styles from './click-reveal.module.css';
import {
  mergedClickRevealConfig,
  resolveClickRevealOverlayVisibilidad,
  resolveClickRevealTriggerVisibilidad,
  toSlidePanelConfig,
} from './click-reveal-config';

function modalHiddenClass(efecto: ClickRevealConfiguracion['efectoApertura']) {
  switch (efecto) {
    case 'instant':
      return styles.revealModalHiddenInstant;
    case 'slide-up':
      return styles.revealModalHiddenSlide;
    default:
      return styles.revealModalHiddenFade;
  }
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
        align="center"
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

function TriggerTitleField({
  value,
  selected,
  onCommit,
  onFocusSelect,
}: {
  value: string;
  selected: boolean;
  onCommit: (value: string) => void;
  onFocusSelect: () => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft !== value) onCommit(draft);
  };

  return (
    <textarea
      value={draft}
      rows={2}
      placeholder="Texto de la tarjeta"
      className={cn(
        styles.revealTriggerTitleInput,
        selected && styles.revealTriggerTitleInputSelected,
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e: FocusEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        onFocusSelect();
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onBlur={commit}
    />
  );
}

export function ClickRevealTriggerCard({
  trigger,
  defaults,
  isActive,
  isSelected,
  isTextSelected,
  isImageSelected,
  onClick,
  onSelectImage,
  onSelectText,
  onPatchTrigger,
  editable,
}: {
  trigger: ClickRevealTrigger;
  defaults: ClickRevealConfiguracion['defaultsTrigger'];
  isActive: boolean;
  isSelected?: boolean;
  isTextSelected?: boolean;
  isImageSelected?: boolean;
  onClick?: () => void;
  onSelectImage?: () => void;
  onSelectText?: () => void;
  onPatchTrigger?: (patch: Partial<ClickRevealTrigger>) => void;
  editable?: boolean;
}) {
  const vis = resolveClickRevealTriggerVisibilidad(defaults, trigger);
  const hasImage = !!trigger.imagen;

  const titleBlock =
    vis.mostrarTitulo && editable && onPatchTrigger ? (
      <TriggerTitleField
        value={trigger.titulo ?? ''}
        selected={!!isTextSelected}
        onCommit={(titulo) => onPatchTrigger({ titulo })}
        onFocusSelect={() => onSelectText?.()}
      />
    ) : vis.mostrarTitulo && trigger.titulo ? (
      <span className={styles.revealTriggerTitle}>{trigger.titulo}</span>
    ) : null;

  const imageBlock = vis.mostrarImagen ? (
    <div className={styles.revealTriggerImageArea}>
      {hasImage ? (
        <div className="relative flex size-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trigger.imagen}
            alt={trigger.imagenAlt ?? ''}
            className={styles.revealTriggerImage}
            style={imageFilterStyle(trigger)}
            draggable={false}
          />
          {editable && onPatchTrigger ? (
            <ImageUrlPopover
              url={trigger.imagen}
              onCommit={(imagen) => onPatchTrigger({ imagen })}
            >
              <button
                type="button"
                className="absolute right-0 top-0 z-[2] rounded-md bg-black/50 p-1 text-white"
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Cambiar imagen"
              >
                <Camera className="size-3.5" />
              </button>
            </ImageUrlPopover>
          ) : null}
        </div>
      ) : editable && onPatchTrigger ? (
        <ImageUrlPopover
          url={trigger.imagen}
          onCommit={(imagen) => onPatchTrigger({ imagen })}
        >
          <button
            type="button"
            className={styles.revealTriggerImageBtn}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelectImage?.();
            }}
          >
            <span
              className={cn(
                styles.revealTriggerImagePlaceholder,
                isImageSelected && styles.revealTriggerImagePlaceholderSelected,
              )}
            >
              <Camera className="size-3.5" />
              Añadir imagen
            </span>
          </button>
        </ImageUrlPopover>
      ) : (
        <span className={styles.revealTriggerImagePlaceholder}>
          <Camera className="size-3.5 opacity-70" />
        </span>
      )}
    </div>
  ) : null;

  const cardInner = (
    <>
      {titleBlock}
      {imageBlock}
      {vis.mostrarEtiqueta ? (
        <span className={styles.revealTriggerLabel}>{trigger.etiqueta}</span>
      ) : null}
    </>
  );

  if (editable) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          styles.revealTriggerCard,
          isActive && styles.revealTriggerCardActive,
          isSelected && styles.revealTriggerCardSelected,
        )}
        style={{ backgroundColor: trigger.colorFondo ?? '#2563EB' }}
        onPointerDown={(e) => stopWidgetInnerPointer(e)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onKeyDown={(e) => {
          const el = e.target as HTMLElement;
          if (
            el.tagName === 'TEXTAREA' ||
            el.tagName === 'INPUT' ||
            el.isContentEditable
          ) {
            return;
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        styles.revealTriggerCard,
        isActive && styles.revealTriggerCardActive,
        isSelected && styles.revealTriggerCardSelected,
      )}
      style={{ backgroundColor: trigger.colorFondo ?? '#2563EB' }}
      onClick={onClick}
    >
      {cardInner}
    </button>
  );
}

export function ClickRevealTriggerRow({
  triggers,
  configuracion,
  activeIndex,
  innerSelection,
  onSelectIndex,
  onSelectTrigger,
  onSelectTriggerImage,
  onSelectTriggerText,
  onPatchTrigger,
  editable,
}: {
  triggers: ClickRevealTrigger[];
  configuracion: ClickRevealConfiguracion;
  activeIndex: number;
  innerSelection?: ClickRevealInnerSelection | null;
  onSelectIndex: (index: number) => void;
  onSelectTrigger?: (triggerId: string) => void;
  onSelectTriggerImage?: (triggerId: string) => void;
  onSelectTriggerText?: (triggerId: string) => void;
  onPatchTrigger?: (triggerId: string, patch: Partial<ClickRevealTrigger>) => void;
  editable?: boolean;
}) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const visibleCount = Math.min(triggers.length, 4);
  const maxOffset = Math.max(0, triggers.length - visibleCount);
  const visibleTriggers = triggers.slice(scrollOffset, scrollOffset + visibleCount);
  const showNav = triggers.length > visibleCount;

  const goPrev = () => setScrollOffset((o) => Math.max(0, o - 1));
  const goNext = () => setScrollOffset((o) => Math.min(maxOffset, o + 1));

  return (
    <div className={styles.revealTriggerRow}>
      {configuracion.mostrarBotonAnterior && showNav ? (
        <button
          type="button"
          className={styles.revealTriggerNav}
          disabled={scrollOffset === 0}
          aria-label="Anterior"
          onClick={(e) => {
            stopWidgetInnerPointer(e);
            goPrev();
          }}
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : configuracion.mostrarBotonAnterior ? (
        <span className="w-9 shrink-0" aria-hidden />
      ) : null}

      <div
        className={styles.revealTriggerTrack}
        style={{ ['--reveal-trigger-count' as string]: visibleTriggers.length }}
      >
        {visibleTriggers.map((trigger, i) => {
          const globalIndex = scrollOffset + i;
          const isSelected =
            innerSelection?.kind === 'trigger' && innerSelection.triggerId === trigger.id ||
            innerSelection?.kind === 'trigger-image' && innerSelection.triggerId === trigger.id ||
            innerSelection?.kind === 'trigger-text' && innerSelection.triggerId === trigger.id;
          const isTextSelected =
            innerSelection?.kind === 'trigger-text' && innerSelection.triggerId === trigger.id;
          const isImageSelected =
            innerSelection?.kind === 'trigger-image' && innerSelection.triggerId === trigger.id;

          return (
            <ClickRevealTriggerCard
              key={trigger.id}
              trigger={trigger}
              defaults={configuracion.defaultsTrigger}
              isActive={globalIndex === activeIndex}
              isSelected={isSelected}
              isTextSelected={isTextSelected}
              isImageSelected={isImageSelected}
              editable={editable}
              onClick={() => {
                onSelectIndex(globalIndex);
                onSelectTrigger?.(trigger.id);
              }}
              onSelectImage={() => {
                onSelectIndex(globalIndex);
                onSelectTriggerImage?.(trigger.id);
              }}
              onSelectText={() => {
                onSelectIndex(globalIndex);
                onSelectTriggerText?.(trigger.id);
              }}
              onPatchTrigger={
                onPatchTrigger
                  ? (patch) => onPatchTrigger(trigger.id, patch)
                  : undefined
              }
            />
          );
        })}
      </div>

      {configuracion.mostrarBotonSiguiente && showNav ? (
        <button
          type="button"
          className={styles.revealTriggerNav}
          disabled={scrollOffset >= maxOffset}
          aria-label="Siguiente"
          onClick={(e) => {
            stopWidgetInnerPointer(e);
            goNext();
          }}
        >
          <ChevronRight className="size-4" />
        </button>
      ) : configuracion.mostrarBotonSiguiente ? (
        <span className="w-9 shrink-0" aria-hidden />
      ) : null}
    </div>
  );
}

export function ClickRevealTriggerDeck({
  triggers,
  configuracion,
  activeIndex,
  innerSelection,
  onSelectIndex,
  onSelectTrigger,
  onSelectTriggerImage,
  onSelectTriggerText,
  onPatchTrigger,
  editable,
}: {
  triggers: ClickRevealTrigger[];
  configuracion: ClickRevealConfiguracion;
  activeIndex: number;
  innerSelection?: ClickRevealInnerSelection | null;
  onSelectIndex: (index: number) => void;
  onSelectTrigger?: (triggerId: string) => void;
  onSelectTriggerImage?: (triggerId: string) => void;
  onSelectTriggerText?: (triggerId: string) => void;
  onPatchTrigger?: (triggerId: string, patch: Partial<ClickRevealTrigger>) => void;
  editable?: boolean;
}) {
  return (
    <div className={styles.revealTriggerDeck}>
      <ClickRevealTriggerRow
        triggers={triggers}
        configuracion={configuracion}
        activeIndex={activeIndex}
        innerSelection={innerSelection}
        editable={editable}
        onSelectIndex={onSelectIndex}
        onSelectTrigger={onSelectTrigger}
        onSelectTriggerImage={onSelectTriggerImage}
        onSelectTriggerText={onSelectTriggerText}
        onPatchTrigger={onPatchTrigger}
      />
    </div>
  );
}

/**
 * Modal montado dentro del bloque (no usa portal). Es correcto porque el widget
 * de Click to Reveal ocupa casi todo el slide. No copiar este patrón para un
 * overlay pequeño: Hotspot/Tooltip usan burbuja inline; Popup (modal a pantalla
 * de slide) usa portal + backdrop.
 */
export function ClickRevealModalPanel({
  overlay,
  configuracion,
  visible,
  isEditing,
  innerSelection,
  onClose,
  onPatchOverlay,
  onSelectText,
  onSelectImage,
  onSelectOverlay,
  editable,
}: {
  overlay: WidgetSlideContent;
  configuracion: ClickRevealConfiguracion;
  visible: boolean;
  isEditing?: boolean;
  innerSelection?: ClickRevealInnerSelection | null;
  onClose?: () => void;
  onPatchOverlay?: (patch: Partial<WidgetSlideContent>) => void;
  onSelectText?: (field: WidgetSlideTextField) => void;
  onSelectImage?: () => void;
  onSelectOverlay?: () => void;
  editable?: boolean;
}) {
  const vis = resolveClickRevealOverlayVisibilidad(configuracion.defaultsOverlay, overlay);
  const panelConfig = toSlidePanelConfig(configuracion, overlay);
  const dialogOpen = Boolean(visible && !isEditing);
  useEscapeToClose(dialogOpen, onClose);
  const dialogLabel =
    overlay.encabezado?.trim() || overlay.etiqueta?.trim() || 'Contenido revelado';
  const isSelected =
    innerSelection?.kind === 'overlay' && innerSelection.overlayId === overlay.id ||
    innerSelection?.kind === 'overlay-text' && innerSelection.overlayId === overlay.id ||
    innerSelection?.kind === 'overlay-image' && innerSelection.overlayId === overlay.id;

  const slideForPanel: WidgetSlideContent = {
    ...overlay,
    mostrarEncabezado: vis.mostrarEncabezado,
    mostrarSubtitulo: vis.mostrarSubtitulo,
    mostrarCuerpo: vis.mostrarCuerpo,
    mostrarImagen: vis.mostrarImagen,
  };

  const mappedSelection =
    innerSelection?.kind === 'overlay-text' && innerSelection.overlayId === overlay.id
      ? { kind: 'slide-text' as const, slideId: overlay.id, field: innerSelection.field }
      : innerSelection?.kind === 'overlay-image' && innerSelection.overlayId === overlay.id
        ? { kind: 'slide-image' as const, slideId: overlay.id }
        : null;

  if (!visible && !isEditing) return null;

  return (
    <>
      {visible && !isEditing ? (
        <button
          type="button"
          className={styles.revealBackdrop}
          aria-label="Cerrar ventana"
          onClick={onClose}
        >
          <span className={styles.revealBackdropDim} />
        </button>
      ) : null}

      <div
        className={cn(
          styles.revealModal,
          isEditing && styles.revealModalEditing,
          isSelected && isEditing && styles.revealModalEditing,
          visible || isEditing
            ? styles.revealModalVisible
            : modalHiddenClass(configuracion.efectoApertura),
        )}
        role={dialogOpen ? 'dialog' : undefined}
        aria-modal={dialogOpen ? true : undefined}
        aria-label={dialogOpen ? dialogLabel : undefined}
        style={{
          backgroundColor: configuracion.colorFondoModal,
          padding: configuracion.paddingModal,
          borderRadius: configuracion.radioModal,
          ['--reveal-backdrop-color' as string]: configuracion.colorBackdrop,
          ['--reveal-backdrop-opacity' as string]: String(configuracion.opacidadBackdrop),
        }}
        onPointerDown={(e) => {
          if (!editable) return;
          stopWidgetInnerPointer(e);
          onSelectOverlay?.();
        }}
      >
        {configuracion.mostrarBotonCerrar && visible && !isEditing ? (
          <button type="button" className={styles.revealModalClose} aria-label="Cerrar" onClick={onClose}>
            <X className="size-4" />
          </button>
        ) : null}

        <div className={styles.revealModalInner}>
          {vis.mostrarEtiqueta && overlay.etiqueta ? (
            <p className={cn('m-0 mb-2 shrink-0 px-0.5', styles.revealModalLabel)}>{overlay.etiqueta}</p>
          ) : null}

          <div className={styles.revealModalContent}>
            <div className={cn(styles.revealModalContentFill, styles.revealModalPanelEditor)}>
              {editable && onPatchOverlay ? (
                <TabsSlidePanelEditor
                  slide={slideForPanel}
                  configuracion={panelConfig}
                  innerSelection={mappedSelection}
                  onPatchSlide={onPatchOverlay}
                  onSelectText={(field) => onSelectText?.(field)}
                  onSelectImage={() => onSelectImage?.()}
                />
              ) : (
                <TabsSlidePanelView slide={slideForPanel} configuracion={panelConfig} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function clickRevealChromeStyle(block: ClickRevealWidget): React.CSSProperties {
  const cfg = mergedClickRevealConfig(block);
  return {
    ['--reveal-backdrop-color' as string]: cfg.colorBackdrop,
    ['--reveal-backdrop-opacity' as string]: String(cfg.opacidadBackdrop),
  };
}
