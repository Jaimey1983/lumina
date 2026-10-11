import type { MouseEvent } from 'react';
import { cn } from '@lumina/ui/lib/utils';
import { stopWidgetInnerPointer } from '@lumina/editor-shared/widget-editor-utils';
import type { BotonWidget } from '@lumina/types/widget';
import { mergedBotonConfig } from './boton-config.js';
import { BOTON_ICONOS } from './boton-iconos.js';
import styles from './boton.module.css';

/** Cada variante fija un tono; el tono del enlace heredado (`link`) es el primario. */
const TONO_CLASS: Record<string, string> = {
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

const ESTILO_CLASS = {
  solid: styles.estiloSolid,
  soft: styles.estiloSoft,
  outline: styles.estiloOutline,
  ghost: styles.estiloGhost,
  link: styles.estiloLink,
} as const;

interface BotonPartsProps {
  block: BotonWidget;
  isEditing?: boolean;
  disabled?: boolean;
  href?: string | null;
  /** Acción `descargar`: el enlace baja el recurso en vez de abrirse en otra pestaña. */
  download?: string | true;
  onActivate?: () => void;
  /** Etapa K / K3: clic en el enlace (acción `url`), que no pasa por `onActivate`. */
  onLinkClick?: () => void;
  onSelect?: () => void;
}

export function BotonParts({
  block,
  isEditing = false,
  disabled = false,
  href,
  download,
  onActivate,
  onLinkClick,
  onSelect,
}: BotonPartsProps) {
  const cfg = mergedBotonConfig(block);
  const sizeClass =
    cfg.tamano === 'sm' ? styles.sizeSm : cfg.tamano === 'lg' ? styles.sizeLg : styles.sizeMd;
  const formaClass = cfg.forma === 'pill' ? styles.formaPill : styles.formaRedondeado;
  const densidadClass =
    cfg.densidad === 'compacta'
      ? styles.densidadCompacta
      : cfg.densidad === 'amplia'
        ? styles.densidadAmplia
        : undefined;
  const bloqueado = disabled || cfg.deshabilitado || (cfg.cargando && !isEditing);
  const className = cn(
    styles.btn,
    sizeClass,
    formaClass,
    densidadClass,
    TONO_CLASS[cfg.variante] ?? styles.primary,
    ESTILO_CLASS[cfg.estilo],
    (disabled || cfg.deshabilitado) && styles.btnDisabled,
    cfg.cargando && styles.btnCargando,
  );

  const Icono = cfg.icono ? BOTON_ICONOS[cfg.icono].Icon : null;
  const icono = cfg.cargando ? (
    <span className={styles.spinner} aria-hidden="true" data-boton-cargando />
  ) : Icono ? (
    <span className={styles.icono} aria-hidden="true" data-boton-icono={cfg.icono}>
      <Icono />
    </span>
  ) : null;
  const contenido = (
    <>
      {cfg.iconoPosicion === 'izquierda' || cfg.cargando ? icono : null}
      <span>{cfg.texto}</span>
      {cfg.iconoPosicion === 'derecha' && !cfg.cargando ? icono : null}
    </>
  );

  const datos = { 'data-estilo': cfg.estilo, 'data-variante': cfg.variante } as const;

  const handleClick = (e: MouseEvent) => {
    stopWidgetInnerPointer(e);
    if (isEditing) {
      onSelect?.();
      return;
    }
    if (bloqueado) return;
    if (href) return;
    onActivate?.();
  };

  if (href && !isEditing && !bloqueado) {
    return (
      <a
        className={className}
        href={href}
        {...(download !== undefined
          ? { download, rel: 'noopener noreferrer' }
          : { target: '_blank', rel: 'noopener noreferrer' })}
        onClick={(e) => {
          stopWidgetInnerPointer(e);
          onLinkClick?.();
        }}
        {...datos}
      >
        {contenido}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={bloqueado}
      aria-busy={cfg.cargando || undefined}
      onClick={handleClick}
      {...datos}
    >
      {contenido}
    </button>
  );
}
