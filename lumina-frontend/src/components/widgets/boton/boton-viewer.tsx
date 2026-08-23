import type { BotonWidget } from '@/types/widget.types';
import { useSlideNav } from '@/components/widgets/shared/slide-nav-context';
import { BotonParts } from './boton-parts';
import { mergedBotonConfig } from './boton-config';

interface BotonViewerProps {
  block: BotonWidget;
  isThumbnail?: boolean;
}

function normalizeHref(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

function isNavAccion(accion: BotonWidget['accion']): boolean {
  return accion === 'siguiente' || accion === 'anterior' || accion === 'ir_a';
}

export function BotonViewer({ block, isThumbnail = false }: BotonViewerProps) {
  const cfg = mergedBotonConfig(block);
  const { navigate, slideCount } = useSlideNav();

  const href = cfg.accion === 'url' ? normalizeHref(cfg.url) : null;
  const navLocked = isNavAccion(cfg.accion) && !navigate;
  const disabled = isThumbnail || navLocked;

  const handleActivate = () => {
    if (disabled || cfg.deshabilitado) return;
    if (cfg.accion === 'ninguna' || cfg.accion === 'url') return;
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
    <div className="relative h-full w-full">
      <BotonParts
        block={block}
        isEditing={false}
        disabled={disabled}
        href={disabled ? null : href}
        onActivate={handleActivate}
      />
    </div>
  );
}
