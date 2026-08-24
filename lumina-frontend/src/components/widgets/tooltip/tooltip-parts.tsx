import { useEffect, useId, useRef, useState } from 'react';
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
  const tooltipId = useId();
  const [autoPos, setAutoPos] = useState<'arriba' | 'abajo' | 'izquierda' | 'derecha'>('abajo');

  useEffect(() => {
    if (!isOpen && !isEditing) return;
    if (cfg.posicion !== 'auto') return;
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const slideRect = triggerRef.current.closest('.canvas-slide')?.getBoundingClientRect();

    if (slideRect) {
      const topSpace = rect.top - slideRect.top;
      const bottomSpace = slideRect.bottom - rect.bottom;
      const leftSpace = rect.left - slideRect.left;
      const rightSpace = slideRect.right - rect.right;

      const neededW = cfg.anchoBurbuja;
      const neededH = 80;

      let next: 'arriba' | 'abajo' | 'izquierda' | 'derecha' = 'abajo';
      if (bottomSpace > neededH) next = 'abajo';
      else if (topSpace > neededH) next = 'arriba';
      else if (rightSpace > neededW) next = 'derecha';
      else if (leftSpace > neededW) next = 'izquierda';
      setAutoPos((prev) => (prev === next ? prev : next));
    }
  }, [isOpen, isEditing, cfg.posicion, cfg.anchoBurbuja, block.x, block.y]);

  const posTooltip = cfg.posicion === 'auto' ? autoPos : cfg.posicion;

  let posClass = styles.posBottom;
  if (posTooltip === 'arriba') posClass = styles.posTop;
  if (posTooltip === 'izquierda') posClass = styles.posLeft;
  if (posTooltip === 'derecha') posClass = styles.posRight;

  const showBubble = isOpen || isEditing;
  const Icon = resolveTooltipTriggerIcon(cfg.icono);

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
      <span className={styles.triggerIcon}>
        <Icon size={18} aria-hidden />
      </span>
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
        id={tooltipId}
        className={cn(
          styles.bubble,
          posClass,
          showBubble ? styles.bubbleVisible : styles.bubbleHidden,
        )}
        role="tooltip"
      >
        {cfg.textoTooltip}
      </div>
    </div>
  );
}
