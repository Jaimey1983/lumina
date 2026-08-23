import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import type { BotonWidget } from '@/types/widget.types';
import { mergedBotonConfig } from './boton-config';
import styles from './boton.module.css';

const VARIANT_CLASS: Record<string, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
  info: styles.info,
  light: styles.light,
  dark: styles.dark,
  link: styles.link,
};

const OUTLINE_CLASS: Record<string, string> = {
  primary: styles.outlinePrimary,
  secondary: styles.outlineSecondary,
  success: styles.outlineSuccess,
  danger: styles.outlineDanger,
  warning: styles.outlineWarning,
  info: styles.outlineInfo,
  light: styles.outlineLight,
  dark: styles.outlineDark,
  link: styles.link,
};

function variantClass(variante: string, outline: boolean): string {
  if (outline && variante !== 'link') {
    return OUTLINE_CLASS[variante] ?? styles.outlinePrimary;
  }
  return VARIANT_CLASS[variante] ?? styles.primary;
}

interface BotonPartsProps {
  block: BotonWidget;
  isEditing?: boolean;
  disabled?: boolean;
  href?: string | null;
  onActivate?: () => void;
  onSelect?: () => void;
}

export function BotonParts({
  block,
  isEditing = false,
  disabled = false,
  href,
  onActivate,
  onSelect,
}: BotonPartsProps) {
  const cfg = mergedBotonConfig(block);
  const sizeClass =
    cfg.tamano === 'sm' ? styles.sizeSm : cfg.tamano === 'lg' ? styles.sizeLg : styles.sizeMd;
  const formaClass = cfg.forma === 'pill' ? styles.formaPill : styles.formaRedondeado;
  const className = cn(
    styles.btn,
    sizeClass,
    formaClass,
    variantClass(cfg.variante, cfg.outline),
    (disabled || cfg.deshabilitado) && styles.btnDisabled,
  );

  const handleClick = (e: MouseEvent) => {
    stopWidgetInnerPointer(e);
    if (isEditing) {
      onSelect?.();
      return;
    }
    if (disabled || cfg.deshabilitado) return;
    if (href) return;
    onActivate?.();
  };

  if (href && !isEditing && !disabled && !cfg.deshabilitado) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => stopWidgetInnerPointer(e)}
      >
        {cfg.texto}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || cfg.deshabilitado}
      onClick={handleClick}
    >
      {cfg.texto}
    </button>
  );
}
