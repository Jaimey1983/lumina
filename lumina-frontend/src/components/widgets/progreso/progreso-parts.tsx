import type { MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import type { ProgresoWidget } from '@/types/widget.types';
import { mergedProgresoConfig } from './progreso-config';
import styles from './progreso.module.css';

interface ProgresoPartsProps {
  block: ProgresoWidget;
  percent: number;
  fractionLabel?: string;
  isEditing?: boolean;
  onSelect?: () => void;
}

export function ProgresoParts({
  block,
  percent,
  fractionLabel,
  isEditing = false,
  onSelect,
}: ProgresoPartsProps) {
  const cfg = mergedProgresoConfig(block);
  const width = Math.min(100, Math.max(0, percent));
  const percentLabel = cfg.mostrarPorcentaje ? `${width}%` : null;
  const showMeta = Boolean(cfg.etiqueta) || Boolean(fractionLabel) || Boolean(percentLabel);

  const handleClick = (e: MouseEvent) => {
    if (!isEditing) return;
    stopWidgetInnerPointer(e);
    onSelect?.();
  };

  return (
    <div className={styles.wrap} onClick={handleClick}>
      {showMeta ? (
        <div className={styles.meta} style={{ color: cfg.colorBarra }}>
          {cfg.etiqueta ? <span className={styles.etiqueta}>{cfg.etiqueta}</span> : <span />}
          <span className={styles.fraction}>
            {[fractionLabel, percentLabel].filter(Boolean).join(' · ')}
          </span>
        </div>
      ) : null}
      <div className={styles.progress} style={{ backgroundColor: cfg.colorFondo }} role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn(
            styles.bar,
            cfg.striped && styles.striped,
            cfg.striped && cfg.animated && styles.animated,
          )}
          style={{
            width: `${width}%`,
            backgroundColor: cfg.colorBarra,
            color: cfg.colorTexto,
          }}
        />
      </div>
    </div>
  );
}
