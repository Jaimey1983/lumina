import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { VISUALLY_HIDDEN } from '../visually-hidden.js';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@lumina/ui/lib/utils';
import { stopWidgetInnerPointer } from '@lumina/editor-shared/widget-editor-utils';
import type { ContadorWidget } from '@lumina/types/widget';
import {
  formatContadorTime,
  mergedContadorConfig,
  semaforoDeFraccion,
  type MergedContadorConfig,
} from './contador-config.js';
import styles from './contador.module.css';

/** Colores del semáforo: siempre por token del tema, con el verde/ámbar/rojo estándar de respaldo. */
const COLOR_SEMAFORO = {
  verde: 'var(--lw-color-success, #198754)',
  amarillo: 'var(--lw-color-warning, #ffc107)',
  rojo: 'var(--lw-color-danger, #dc3545)',
} as const;

/** Una casilla del flip-clock. Solo anima el giro cuando el dígito CAMBIA (no al montar). */
function FlipCara({ ch, animar }: { ch: string; animar: boolean }) {
  // Se fija al montar: si cambiara después, la clase reiniciaría la animación de casillas quietas.
  const [anima] = useState(animar);
  return <span className={cn(styles.cara, anima && styles.caraGira)}>{ch}</span>;
}

function FlipDigito({ ch }: { ch: string }) {
  const montado = useRef(false);
  useEffect(() => {
    montado.current = true;
  }, []);
  if (ch === ':') return <span className={styles.flipSep}>:</span>;
  return (
    <span className={styles.flipTile}>
      <FlipCara key={ch} ch={ch} animar={montado.current} />
    </span>
  );
}

const RADIO_ANILLO = 44;
const LONGITUD_ANILLO = 2 * Math.PI * RADIO_ANILLO;

/** Fracción 0–1 que dibuja el anillo: lo que queda (temporizador) o los segundos del minuto (cronómetro). */
function fraccionAnillo(cfg: MergedContadorConfig, displaySeconds: number): number {
  if (cfg.modo === 'temporizador') {
    return cfg.segundos > 0 ? Math.min(1, Math.max(0, displaySeconds / cfg.segundos)) : 0;
  }
  return (Math.max(0, displaySeconds) % 60) / 60;
}

interface ContadorPartsProps {
  block: ContadorWidget;
  displaySeconds: number;
  displayNumber: number;
  running?: boolean;
  ended?: boolean;
  isEditing?: boolean;
  showControls?: boolean;
  /** Etiqueta del hito recién alcanzado (T10): destello visual + anuncio en la región viva. */
  hitoActivo?: string | null;
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
  hitoActivo = null,
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

  // Variantes de dibujo: el modo «número» no tiene recorrido que dibujar, siempre va en dígitos.
  const variante = isNumero ? 'digitos' : cfg.variante;
  const fraccion = cfg.modo === 'temporizador' ? fraccionAnillo(cfg, displaySeconds) : null;
  const acento =
    cfg.semaforo && fraccion !== null
      ? COLOR_SEMAFORO[semaforoDeFraccion(fraccion)]
      : cfg.colorAcento;
  const colorValor = ended ? acento : cfg.colorTexto;

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
      className={cn(styles.card, ended && styles.ended, hitoActivo && styles.hitoDestello)}
      data-variante={variante}
      style={{
        backgroundColor: cfg.colorFondo,
        color: cfg.colorTexto,
        ['--ct-acento' as string]: acento,
        boxShadow: `0 4px 18px ${cfg.colorFondo}66, inset 0 -3px 0 ${acento}`,
      }}
      onClick={handleSelect}
    >
      {cfg.etiqueta ? <div className={styles.etiqueta}>{cfg.etiqueta}</div> : null}
      {variante === 'anillo' ? (
        <div className={styles.anillo}>
          <svg viewBox="0 0 100 100" className={styles.anilloSvg} aria-hidden>
            <circle className={styles.anilloPista} cx="50" cy="50" r={RADIO_ANILLO} />
            <circle
              className={styles.anilloArco}
              cx="50"
              cy="50"
              r={RADIO_ANILLO}
              strokeDasharray={LONGITUD_ANILLO}
              strokeDashoffset={LONGITUD_ANILLO * (1 - (fraccionAnillo(cfg, displaySeconds)))}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className={cn(styles.digits, styles.digitsAnillo)} style={{ color: colorValor }}>
            {value}
          </div>
        </div>
      ) : variante === 'flip' ? (
        <div className={styles.flip} style={{ color: colorValor }} aria-hidden>
          {value.split('').map((ch, i) => (
            <FlipDigito key={`${i}-${value.length}`} ch={ch} />
          ))}
        </div>
      ) : (
        <div className={styles.digits} style={{ color: colorValor }}>
          {value}
        </div>
      )}
      {hitoActivo ? (
        <div className={styles.hito} aria-hidden>
          {hitoActivo}
        </div>
      ) : null}
      {isEditing ? null : (
        // Región viva: solo anuncia el final del tiempo y los cambios del modo «número»
        // (nunca cada segundo del temporizador/cronómetro).
        <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
          {ended
            ? 'Tiempo terminado'
            : hitoActivo
              ? `Hito: ${hitoActivo}`
              : isNumero
                ? `${cfg.etiqueta || 'Valor'}: ${displayNumber}`
                : ''}
        </div>
      )}
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
