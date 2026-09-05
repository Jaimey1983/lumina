'use client';

import { createElement, type CSSProperties } from 'react';
import {
  AlertCircle,
  Bell,
  BookOpen,
  CircleHelp,
  Heart,
  Info,
  Lightbulb,
  MapPin,
  MessageCircle,
  Play,
  Settings,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { X } from 'lucide-react';

import type {
  PopupConfiguracion,
  PopupForma,
  PopupInnerSelection,
  PopupTriggerTamano,
  PopupTriggerVisual,
  WidgetSlideContent,
  WidgetSlideTextField,
} from '@/types/widget.types';
import { cn } from '@/lib/utils';
import { stopWidgetInnerPointer, useEscapeToClose } from '@/components/widgets/shared/widget-editor-utils';
import { TabsSlidePanelEditor } from '@/components/widgets/tabs/tabs-slide-panel';
import { TabsSlidePanelView } from '@/components/widgets/tabs/tabs-slide-panel';
import { useSlideCanvasRoot } from '@/components/widgets/shared/slide-canvas-root-context';

import styles from './popup.module.css';
import { PopupModalResizeHandles } from './popup-modal-resize-handles';
import {
  resolvePopupOverlayVisibilidad,
  toPopupSlidePanelConfig,
} from './popup-config';

export const POPUP_TRIGGER_ICONS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'info', Icon: Info, label: 'Info' },
  { id: 'help', Icon: CircleHelp, label: 'Ayuda' },
  { id: 'star', Icon: Star, label: 'Estrella' },
  { id: 'lightbulb', Icon: Lightbulb, label: 'Idea' },
  { id: 'message', Icon: MessageCircle, label: 'Mensaje' },
  { id: 'sparkles', Icon: Sparkles, label: 'Destacado' },
  { id: 'alert', Icon: AlertCircle, label: 'Alerta' },
  { id: 'book', Icon: BookOpen, label: 'Libro' },
  { id: 'heart', Icon: Heart, label: 'Corazón' },
  { id: 'bell', Icon: Bell, label: 'Campana' },
  { id: 'map', Icon: MapPin, label: 'Ubicación' },
  { id: 'play', Icon: Play, label: 'Play' },
  { id: 'zap', Icon: Zap, label: 'Rayo' },
  { id: 'settings', Icon: Settings, label: 'Ajustes' },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  POPUP_TRIGGER_ICONS.map(({ id, Icon }) => [id, Icon]),
);

function formaClass(forma: PopupForma): string {
  switch (forma) {
    case 'redondo':
      return styles.popupTriggerFormaRedondo;
    case 'cuadrado':
      return styles.popupTriggerFormaCuadrado;
    default:
      return styles.popupTriggerFormaPill;
  }
}

function modalHiddenClass(efecto: PopupConfiguracion['efectoApertura']) {
  switch (efecto) {
    case 'instant':
      return styles.popupModalHiddenInstant;
    case 'slide-up':
      return styles.popupModalHiddenSlide;
    default:
      return styles.popupModalHiddenFade;
  }
}

function iconSizeClass(tamano: PopupTriggerTamano | undefined): string {
  switch (tamano) {
    case 'pequeno':
      return cn(styles.popupTriggerIconGlyph, styles.popupTriggerIconGlyphSm);
    case 'grande':
      return cn(styles.popupTriggerIconGlyph, styles.popupTriggerIconGlyphLg);
    default:
      return cn(styles.popupTriggerIconGlyph, styles.popupTriggerIconGlyphMd);
  }
}

export function resolvePopupTriggerIcon(name?: string): LucideIcon {
  if (!name) return Info;
  return ICON_MAP[name.toLowerCase()] ?? Info;
}

export interface PopupTriggerButtonProps {
  configuracion: PopupConfiguracion;
  selected?: boolean;
  editable?: boolean;
  expanded?: boolean;
  onActivate?: () => void;
  onSelect?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PopupTriggerButton({
  configuracion,
  selected,
  editable,
  expanded,
  onActivate,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: PopupTriggerButtonProps) {
  const { triggerVisual, triggerForma } = configuracion;
  const isTextOnly = triggerVisual === 'texto';
  const isIconOnly = triggerVisual === 'icono';
  const isImage = triggerVisual === 'imagen';

  const style: CSSProperties = isTextOnly
    ? {
        color: configuracion.triggerColorTexto,
        textDecoration: configuracion.triggerSubrayado !== false ? 'underline' : 'none',
        textUnderlineOffset: '3px',
      }
    : isImage
      ? { background: 'transparent' }
      : {
          backgroundColor: configuracion.triggerColorFondo,
          color: configuracion.triggerColorTexto,
        };

  // `resolvePopupTriggerIcon` devuelve siempre un componente Lucide de nivel de
  // módulo; usamos `createElement` (no un binding con mayúscula + JSX) para no
  // disparar `react-hooks/static-components` del React Compiler.
  const triggerIconNode = isIconOnly
    ? createElement(resolvePopupTriggerIcon(configuracion.triggerIcono), {
        className: iconSizeClass(configuracion.triggerTamano),
        'aria-hidden': true,
      })
    : null;

  const handleClick = (e: React.MouseEvent) => {
    if (editable) {
      e.stopPropagation();
      onSelect?.();
      return;
    }
    e.stopPropagation();
    if (configuracion.triggerEvento === 'click') {
      onActivate?.();
    }
  };

  const imageStyle: CSSProperties | undefined = isImage
    ? {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        ...(configuracion.triggerImagen
          ? {}
          : {
              width: configuracion.triggerImagenAncho ?? 48,
              height: configuracion.triggerImagenAlto ?? 48,
            }),
      }
    : undefined;

  return (
    <button
      type="button"
      className={cn(
        styles.popupTrigger,
        !isTextOnly && styles.popupTriggerInBlock,
        isIconOnly && styles.popupTriggerIconOnly,
        isIconOnly && styles.popupTriggerIconCircle,
        triggerVisual === 'boton' && styles.popupTriggerBotonInBlock,
        triggerVisual === 'boton' && formaClass(triggerForma),
        isTextOnly && styles.popupTriggerTextOnly,
        isImage && styles.popupTriggerImageWrap,
        selected && styles.popupTriggerSelected,
      )}
      style={style}
      aria-haspopup={editable ? undefined : 'dialog'}
      aria-expanded={editable ? undefined : Boolean(expanded)}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isImage && configuracion.triggerImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={configuracion.triggerImagen}
          alt=""
          className={styles.popupTriggerImage}
          style={imageStyle}
        />
      ) : null}
      {isImage && !configuracion.triggerImagen ? (
        <span className={styles.popupTriggerImagePlaceholder} style={imageStyle}>
          Sin imagen
        </span>
      ) : null}
      {triggerIconNode}
      {(triggerVisual === 'boton' || triggerVisual === 'texto') && (
        <span>{configuracion.triggerTexto ?? 'Ver más'}</span>
      )}
    </button>
  );
}

export interface PopupModalPanelProps {
  overlay: WidgetSlideContent;
  configuracion: PopupConfiguracion;
  visible: boolean;
  isEditing?: boolean;
  innerSelection?: PopupInnerSelection | null;
  onClose?: () => void;
  onPatchOverlay?: (patch: Partial<WidgetSlideContent>) => void;
  onSelectText?: (field: WidgetSlideTextField) => void;
  onSelectImage?: () => void;
  onSelectOverlay?: () => void;
  editable?: boolean;
  portaled?: boolean;
  /** En editor: clic en el backdrop cierra modo edición del overlay (no deselecciona el bloque). */
  onExitEdit?: () => void;
  onPatchConfig?: (patch: Partial<PopupConfiguracion>) => void;
}

export function PopupModalPanel({
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
  portaled = false,
  onExitEdit,
  onPatchConfig,
}: PopupModalPanelProps) {
  const slideRoot = useSlideCanvasRoot();
  const vis = resolvePopupOverlayVisibilidad(configuracion.defaultsOverlay, overlay);
  const panelConfig = toPopupSlidePanelConfig(configuracion, overlay);
  const modalAnchoPct = configuracion.modalAnchoPct ?? 55;
  const modalAltoPct = configuracion.modalAltoPct ?? 62;
  const dialogOpen = Boolean(visible && !isEditing);
  useEscapeToClose(dialogOpen, onClose);
  const dialogLabel =
    overlay.encabezado?.trim() || overlay.etiqueta?.trim() || 'Ventana emergente';

  const slideForPanel: WidgetSlideContent = {
    ...overlay,
    mostrarEncabezado: vis.mostrarEncabezado,
    mostrarSubtitulo: vis.mostrarSubtitulo,
    mostrarCuerpo: vis.mostrarCuerpo,
    mostrarImagen: vis.mostrarImagen,
  };

  const mappedSelection =
    innerSelection?.kind === 'overlay-text'
      ? { kind: 'slide-text' as const, slideId: overlay.id, field: innerSelection.field }
      : innerSelection?.kind === 'overlay-image'
        ? { kind: 'slide-image' as const, slideId: overlay.id }
        : null;

  if (!visible && !isEditing) return null;

  return (
    <>
      {visible && !isEditing ? (
        <button
          type="button"
          className={cn(styles.popupBackdrop, portaled && styles.popupBackdropPortaled)}
          aria-label="Cerrar ventana"
          onClick={onClose}
        >
          <span className={styles.popupBackdropDim} />
        </button>
      ) : null}

      {isEditing && portaled ? (
        <button
          type="button"
          className={styles.popupEditorBackdropPortaled}
          aria-label="Salir de edición del popup"
          onClick={(e) => {
            e.stopPropagation();
            onExitEdit?.();
          }}
        />
      ) : null}

      <div
        className={cn(
          styles.popupModal,
          portaled && styles.popupModalPortaled,
          isEditing && styles.popupModalEditing,
          visible || isEditing ? styles.popupModalVisible : modalHiddenClass(configuracion.efectoApertura),
        )}
        role={dialogOpen ? 'dialog' : undefined}
        aria-modal={dialogOpen ? true : undefined}
        aria-label={dialogOpen ? dialogLabel : undefined}
        style={{
          backgroundColor: configuracion.colorFondoModal,
          ['--popup-backdrop-color' as string]: configuracion.colorBackdrop,
          ['--popup-backdrop-opacity' as string]: String(configuracion.opacidadBackdrop),
          ['--popup-modal-width' as string]: `${modalAnchoPct}%`,
          ['--popup-modal-height' as string]: `${modalAltoPct}%`,
        }}
        onPointerDown={(e) => {
          if (!editable) return;
          stopWidgetInnerPointer(e);
          onSelectOverlay?.();
        }}
      >
        {isEditing && portaled && onPatchConfig ? (
          <PopupModalResizeHandles
            modalAnchoPct={modalAnchoPct}
            modalAltoPct={modalAltoPct}
            slideRoot={slideRoot}
            onResize={(size) => onPatchConfig(size)}
            onResizeEnd={(size) => onPatchConfig(size)}
          />
        ) : null}
        {configuracion.mostrarBotonCerrar && (visible || isEditing) ? (
          <button
            type="button"
            className={styles.popupModalClose}
            aria-label={isEditing ? 'Salir de edición' : 'Cerrar'}
            onPointerDown={stopWidgetInnerPointer}
            onClick={(e) => {
              stopWidgetInnerPointer(e);
              if (isEditing) {
                onExitEdit?.();
              } else {
                onClose?.();
              }
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}

        <div className={styles.popupModalInner}>
          {vis.mostrarEtiqueta && overlay.etiqueta ? (
            <p className={cn('m-0 mb-2 shrink-0 px-0.5', styles.popupModalLabel)}>{overlay.etiqueta}</p>
          ) : null}

          <div className={styles.popupModalContent}>
            <div className={cn(styles.popupModalContentFill, styles.popupModalPanelEditor)}>
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

export function popupTriggerVisualLabel(visual: PopupTriggerVisual): string {
  switch (visual) {
    case 'boton':
      return 'Botón';
    case 'icono':
      return 'Ícono';
    case 'imagen':
      return 'Imagen';
    default:
      return 'Texto';
  }
}
