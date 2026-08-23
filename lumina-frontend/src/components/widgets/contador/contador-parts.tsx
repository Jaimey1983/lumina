import type { MouseEvent } from 'react';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stopWidgetInnerPointer } from '@/components/widgets/shared/widget-editor-utils';
import type { ContadorWidget } from '@/types/widget.types';
import { formatContadorTime, mergedContadorConfig } from './contador-config';
import styles from './contador.module.css';

interface ContadorPartsProps {
  block: ContadorWidget;
  displaySeconds: number;
  displayNumber: number;
  running?: boolean;
  ended?: boolean;
  isEditing?: boolean;
  showControls?: boolean;
  onSelect?: () => void;
  onToggleRunning?: () => void;
  onReset?: () => void;
  onStep?: (delta: number) => void;
}

export function ContadorParts({
  block,
  displaySeconds,
  displayNumber,
  running = false,
  ended = false,
  isEditing = false,
  showControls = false,
  onSelect,
  onToggleRunning,
  onReset,
  onStep,
}: ContadorPartsProps) {
  const cfg = mergedContadorConfig(block);
  const isNumero = cfg.modo === 'numero';
  const value = isNumero
    ? String(displayNumber)
    : formatContadorTime(displaySeconds, cfg.formato);

  const handleSelect = (e: MouseEvent) => {
    stopWidgetInnerPointer(e);
    onSelect?.();
  };

  const handleControl = (e: MouseEvent, fn?: () => void) => {
    stopWidgetInnerPointer(e);
    e.stopPropagation();
    if (isEditing) {
      onSelect?.();
      return;
    }
    fn?.();
  };

  return (
    <div
      className={cn(styles.card, ended && styles.ended)}
      style={{
        backgroundColor: cfg.colorFondo,
        color: cfg.colorTexto,
        boxShadow: `0 4px 18px ${cfg.colorFondo}66, inset 0 -3px 0 ${cfg.colorAcento}`,
      }}
      onClick={handleSelect}
    >
      {cfg.etiqueta ? <div className={styles.etiqueta}>{cfg.etiqueta}</div> : null}
      <div className={styles.digits} style={{ color: ended ? cfg.colorAcento : cfg.colorTexto }}>
        {value}
      </div>
      {showControls ? (
        <div className={styles.controls}>
          {isNumero ? (
            <>
              <button
                type="button"
                className={styles.ctrlBtn}
                aria-label="Restar"
                onClick={(e) => handleControl(e, () => onStep?.(-cfg.valorPaso))}
              >
                <Minus className="size-3.5" />
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                aria-label="Reiniciar"
                onClick={(e) => handleControl(e, onReset)}
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                aria-label="Sumar"
                onClick={(e) => handleControl(e, () => onStep?.(cfg.valorPaso))}
              >
                <Plus className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.ctrlBtn}
                aria-label={running ? 'Pausar' : 'Iniciar'}
                onClick={(e) => handleControl(e, onToggleRunning)}
              >
                {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
              <button
                type="button"
                className={styles.ctrlBtn}
                aria-label="Reiniciar"
                onClick={(e) => handleControl(e, onReset)}
              >
                <RotateCcw className="size-3.5" />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
