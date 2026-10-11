import type { EventoTipo } from '@lumina/types/interaction';
import type { BotonWidget } from '@lumina/types/widget';
import { useSlideNav } from '@lumina/editor-shared/slide-nav-context';
import { WidgetMotion } from '../_motion/widget-motion.js';
import { BotonParts } from './boton-parts.js';
import type { BotonAccionT8 } from './boton-defaults.js';
import { mergedBotonConfig } from './boton-config.js';

interface BotonViewerProps {
  block: BotonWidget;
  isThumbnail?: boolean;
  /** Etapa K / K3: avisa al motor de interacción. Sin él, el botón se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
}

function normalizeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

function isNavAccion(accion: BotonAccionT8 | undefined): boolean {
  return accion === 'siguiente' || accion === 'anterior' || accion === 'ir_a';
}

export function BotonViewer({ block, isThumbnail = false, emitir }: BotonViewerProps) {
  const cfg = mergedBotonConfig(block);
  const { navigate, slideCount } = useSlideNav();

  const esDescarga = cfg.accion === 'descargar';
  const href = cfg.accion === 'url' || esDescarga ? normalizeHref(cfg.url) : null;
  const navLocked = isNavAccion(cfg.accion) && !navigate;
  const disabled = isThumbnail || navLocked;

  const handleActivate = () => {
    if (disabled || cfg.deshabilitado) return;
    emitir?.('clic');
    // Con runtime (autónomo / vista previa) la navegación la decide el motor
    // por la regla `clic → …` derivada de `accion` (K4, D6). El camino directo
    // queda solo para reproductores sin motor (presentación, en vivo).
    // TODO(migración-etapa-K): retirar cuando presentación adopte el motor.
    if (emitir) return;
    if (cfg.accion === 'ninguna' || cfg.accion === 'url' || esDescarga) return;
    if (!navigate) return;

    if (cfg.accion === 'siguiente') {
      navigate({ kind: 'siguiente' });
      return;
    }
    if (cfg.accion === 'anterior') {
      navigate({ kind: 'anterior' });
      return;
    }
    if (cfg.accion === 'ir_a') {
      const index = Math.min(Math.max(0, cfg.slideIndex), Math.max(0, slideCount - 1));
      navigate({ kind: 'ir_a', index });
    }
  };

  return (
    // Micro-press (T8): el bloque se encoge un poco al pulsar; con «reducir movimiento» no hay escala.
    <WidgetMotion press={!disabled && !cfg.deshabilitado && !cfg.cargando} className="relative h-full w-full">
      <BotonParts
        block={block}
        isEditing={false}
        disabled={disabled}
        href={disabled ? null : href}
        download={esDescarga ? cfg.archivoNombre || true : undefined}
        onActivate={handleActivate}
        onLinkClick={emitir ? () => emitir('clic') : undefined}
      />
    </WidgetMotion>
  );
}
