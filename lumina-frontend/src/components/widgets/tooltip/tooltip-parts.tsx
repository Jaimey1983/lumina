import { createElement, useId, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import type { TooltipWidget } from '@/types/widget.types';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import { mergedTooltipConfig } from './tooltip-config';
import styles from './tooltip.module.css';
import {
  TOOLTIP_OVERLAY_GAP_PX,
  overlayShiftVars,
} from '@/components/widgets/shared/overlay-auto-position';
import { useOverlayAutoPosition } from '@/components/widgets/shared/use-overlay-auto-position';

export const TOOLTIP_TRIGGER_ICONS: { id: string; Icon: LucideIcon; label: string }[] = [
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
  TOOLTIP_TRIGGER_ICONS.map(({ id, Icon }) => [id, Icon]),
);

export function resolveTooltipTriggerIcon(name?: string): LucideIcon {
  if (!name) return Info;
  return ICON_MAP[name.toLowerCase()] ?? Info;
}

interface TooltipPartsProps {
  block: TooltipWidget;
  isOpen: boolean;
  isEditing?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onSelectTrigger?: () => void;
  onFocusTrigger?: () => void;
  onBlurTrigger?: () => void;
}

export function TooltipParts({
  block,
  isOpen,
  isEditing = false,
  onToggle,
  onSelectTrigger,
  onFocusTrigger,
  onBlurTrigger,
}: TooltipPartsProps) {
  const cfg = mergedTooltipConfig(block);
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const showBubble = isOpen || isEditing;
  const overlay = useOverlayAutoPosition({
    active: showBubble,
    configuredSide: cfg.posicion,
    triggerRef,
    bubbleRef,
    gap: TOOLTIP_OVERLAY_GAP_PX,
    fallbackSize: { width: cfg.anchoBurbuja, height: 80 },
    layoutKey: `${block.x}-${block.y}-${cfg.anchoBurbuja}-${cfg.textoTooltip}`,
  });
  const posTooltip = cfg.posicion === 'auto' ? overlay.side : cfg.posicion;

  let posClass = styles.posBottom;
  if (posTooltip === 'arriba') posClass = styles.posTop;
  if (posTooltip === 'izquierda') posClass = styles.posLeft;
  if (posTooltip === 'derecha') posClass = styles.posRight;

  // `createElement` en vez de un binding con mayúscula + JSX: evita
  // `react-hooks/static-components` del React Compiler (el ícono ya es un
  // componente Lucide de nivel de módulo).
  const triggerIconNode = createElement(resolveTooltipTriggerIcon(cfg.icono), {
    size: 18,
    'aria-hidden': true,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing || onSelectTrigger) {
      stopWidgetInnerPointer(e);
      onSelectTrigger?.();
      return;
    }
    if (onToggle) {
      stopWidgetInnerPointer(e);
      onToggle();
    }
  };

  const triggerInner =
    cfg.triggerTipo === 'punto' ? (
      <span className={styles.triggerDot} aria-hidden />
    ) : cfg.triggerTipo === 'texto_subrayado' ? (
      <span className={styles.triggerText}>{cfg.textoTrigger}</span>
    ) : (
      <span className={styles.triggerIcon}>{triggerIconNode}</span>
    );

  const triggerLabel =
    cfg.triggerTipo === 'texto_subrayado'
      ? cfg.textoTrigger
      : cfg.textoTooltip.trim() || 'Mostrar texto emergente';

  return (
    <div className={styles.tooltipRoot}>
      {isEditing || onSelectTrigger ? (
        <div
          ref={(el) => {
            triggerRef.current = el;
          }}
          className={styles.trigger}
          onClick={handleClick}
        >
          {triggerInner}
        </div>
      ) : (
        <button
          type="button"
          ref={(el) => {
            triggerRef.current = el;
          }}
          className={styles.trigger}
          aria-describedby={cfg.textoTooltip.trim() ? tooltipId : undefined}
          aria-label={cfg.triggerTipo === 'texto_subrayado' ? undefined : triggerLabel}
          onClick={handleClick}
          onFocus={onFocusTrigger}
          onBlur={onBlurTrigger}
        >
          {triggerInner}
        </button>
      )}

      <div
        ref={bubbleRef}
        id={tooltipId}
        className={cn(
          styles.bubble,
          posClass,
          showBubble ? styles.bubbleVisible : styles.bubbleHidden,
        )}
        style={overlayShiftVars(overlay.shiftX, overlay.shiftY)}
        role="tooltip"
      >
        {cfg.textoTooltip}
      </div>
    </div>
  );
}
