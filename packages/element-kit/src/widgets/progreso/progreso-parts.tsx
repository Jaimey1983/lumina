import type { CSSProperties, MouseEvent } from 'react';
import { VISUALLY_HIDDEN } from '../visually-hidden.js';
import { useConteo } from '../_motion/use-conteo.js';
import { cn } from '@lumina/ui/lib/utils';
import { stopWidgetInnerPointer } from '@lumina/editor-shared/widget-editor-utils';
import type { ProgresoWidget } from '@lumina/types/widget';
import { mergedProgresoConfig, type MergedProgresoConfig } from './progreso-config.js';
import styles from './progreso.module.css';

interface ProgresoPartsProps {
  block: ProgresoWidget;
  percent: number;
  fractionLabel?: string;
  isEditing?: boolean;
  onSelect?: () => void;
}

interface VarianteProps {
  cfg: MergedProgresoConfig;
  width: number;
  /** Número mostrado (cuenta animada hacia `width`). */
  mostrado: number;
  fractionLabel?: string;
  pasosTotal: number;
}

const ANILLO_R = 42;
const ANILLO_LARGO = 2 * Math.PI * ANILLO_R;
const SEMI_LARGO = Math.PI * ANILLO_R;

/** Lo que va bajo el número central de las variantes circulares. */
function Rotulos({ cfg, fractionLabel }: { cfg: MergedProgresoConfig; fractionLabel?: string }) {
  if (!cfg.etiqueta && !fractionLabel) return null;
  return (
    <div className={styles.rotulos} style={{ color: cfg.colorBarra }}>
      {cfg.etiqueta ? <span className={styles.etiqueta}>{cfg.etiqueta}</span> : null}
      {fractionLabel ? <span className={styles.fraction}>{fractionLabel}</span> : null}
    </div>
  );
}

function Anillo({ cfg, width, mostrado, fractionLabel }: VarianteProps) {
  return (
    <div className={styles.circular}>
      <div className={styles.circularLienzo}>
      <svg viewBox="0 0 100 100" className={styles.circularSvg} aria-hidden="true">
        <circle cx="50" cy="50" r={ANILLO_R} fill="none" stroke={cfg.colorFondo} strokeWidth="10" />
        {width > 0 ? (
        <circle
          className={styles.arco}
          cx="50"
          cy="50"
          r={ANILLO_R}
          fill="none"
          stroke={cfg.colorBarra}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(ANILLO_LARGO * width) / 100} ${ANILLO_LARGO}`}
          transform="rotate(-90 50 50)"
        />
        ) : null}
        {cfg.mostrarPorcentaje ? (
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill={cfg.colorBarra}>
            {mostrado}%
          </text>
        ) : null}
      </svg>
      </div>
      <Rotulos cfg={cfg} fractionLabel={fractionLabel} />
    </div>
  );
}

function Semicirculo({ cfg, width, mostrado, fractionLabel }: VarianteProps) {
  const arco = 'M 8 50 A 42 42 0 0 1 92 50';
  return (
    <div className={styles.circular}>
      <div className={styles.circularLienzo}>
      <svg viewBox="0 0 100 58" className={styles.circularSvg} aria-hidden="true">
        <path d={arco} fill="none" stroke={cfg.colorFondo} strokeWidth="10" strokeLinecap="round" />
        {width > 0 ? (
        <path
          className={styles.arco}
          d={arco}
          fill="none"
          stroke={cfg.colorBarra}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(SEMI_LARGO * width) / 100} ${SEMI_LARGO}`}
        />
        ) : null}
        {cfg.mostrarPorcentaje ? (
          <text x="50" y="48" textAnchor="middle" fontSize="18" fontWeight="700" fill={cfg.colorBarra}>
            {mostrado}%
          </text>
        ) : null}
      </svg>
      </div>
      <Rotulos cfg={cfg} fractionLabel={fractionLabel} />
    </div>
  );
}

function Pasos({ cfg, width, pasosTotal, fractionLabel, mostrado }: VarianteProps) {
  const hechos = Math.round((width / 100) * pasosTotal);
  const porcentaje = cfg.mostrarPorcentaje ? `${mostrado}%` : null;
  return (
    <>
      {cfg.etiqueta || fractionLabel || porcentaje ? (
        <div className={styles.meta} style={{ color: cfg.colorBarra }}>
          {cfg.etiqueta ? <span className={styles.etiqueta}>{cfg.etiqueta}</span> : <span />}
          <span className={styles.fraction}>{[fractionLabel, porcentaje].filter(Boolean).join(' · ')}</span>
        </div>
      ) : null}
      <ol className={styles.pasos} aria-hidden="true">
        {Array.from({ length: pasosTotal }, (_, i) => {
          const completo = i < hechos;
          const actual = i === hechos - 1 || (hechos === 0 && i === 0);
          return (
            <li
              key={i}
              className={cn(styles.paso, completo && styles.pasoHecho)}
              data-paso-hecho={completo || undefined}
              style={
                {
                  '--paso-barra': cfg.colorBarra,
                  '--paso-fondo': cfg.colorFondo,
                  '--paso-texto': cfg.colorTexto,
                } as CSSProperties
              }
            >
              <span className={cn(styles.pasoPunto, actual && styles.pasoActual)}>{i + 1}</span>
              {cfg.hitos[i]?.etiqueta ? (
                <span className={styles.pasoEtiqueta} style={{ color: cfg.colorBarra }}>
                  {cfg.hitos[i]?.etiqueta}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Lineal({ cfg, width, mostrado, fractionLabel }: VarianteProps) {
  const percentLabel = cfg.mostrarPorcentaje ? `${mostrado}%` : null;
  const showMeta = Boolean(cfg.etiqueta) || Boolean(fractionLabel) || Boolean(percentLabel);
  return (
    <>
      {showMeta ? (
        <div className={styles.meta} style={{ color: cfg.colorBarra }}>
          {cfg.etiqueta ? <span className={styles.etiqueta}>{cfg.etiqueta}</span> : <span />}
          <span className={styles.fraction}>
            {[fractionLabel, percentLabel].filter(Boolean).join(' · ')}
          </span>
        </div>
      ) : null}
      <div className={styles.progress} style={{ backgroundColor: cfg.colorFondo }}>
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
      {cfg.hitos.length > 0 ? (
        <div className={styles.hitos} aria-hidden="true">
          {cfg.hitos.map((h, i) => (
            <span
              key={`${h.valor}-${i}`}
              className={cn(styles.hito, width >= h.valor && styles.hitoAlcanzado)}
              data-hito-alcanzado={width >= h.valor || undefined}
              style={{
                left: `${h.valor}%`,
                color: width >= h.valor ? cfg.colorBarra : undefined,
                // Los hitos de los extremos se alinean al borde para que su etiqueta no se corte.
                ...(h.valor >= 92 ? { transform: 'translateX(-100%)', alignItems: 'flex-end' } : {}),
                ...(h.valor <= 8 ? { transform: 'none', alignItems: 'flex-start' } : {}),
              }}
              title={`${h.etiqueta || 'Hito'} (${h.valor}%)`}
            >
              <span className={styles.hitoMarca} />
              {h.etiqueta ? <span className={styles.hitoTexto}>{h.etiqueta}</span> : null}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
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
  const mostrado = useConteo(width, { duracion: 0.5 });
  // En modo diapositiva los pasos son las diapositivas (`fractionLabel` = «n / total»).
  const delFraction = /\/\s*(\d+)\s*$/.exec(fractionLabel ?? '')?.[1];
  const pasosTotal =
    cfg.modo === 'slides' && delFraction ? Math.max(2, Math.min(24, Number(delFraction))) : cfg.numeroPasos;

  const handleClick = (e: MouseEvent) => {
    if (!isEditing) return;
    stopWidgetInnerPointer(e);
    onSelect?.();
  };

  const alcanzado = [...cfg.hitos].reverse().find((h) => width >= h.valor && h.etiqueta);
  const props: VarianteProps = { cfg, width, mostrado, fractionLabel, pasosTotal };

  return (
    <div className={styles.wrap} onClick={handleClick}>
      {isEditing ? null : (
        <span role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
          {`${cfg.etiqueta || 'Progreso'}: ${width}%${alcanzado ? ` · Hito: ${alcanzado.etiqueta}` : ''}`}
        </span>
      )}
      <div
        className={cn(styles.cuerpo, cfg.variante !== 'lineal' && styles.cuerpoCentrado)}
        role="progressbar"
        aria-label={cfg.etiqueta || 'Progreso'}
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
        data-variante={cfg.variante}
      >
        {cfg.variante === 'circular' ? (
          <Anillo {...props} />
        ) : cfg.variante === 'semicirculo' ? (
          <Semicirculo {...props} />
        ) : cfg.variante === 'pasos' ? (
          <Pasos {...props} />
        ) : (
          <Lineal {...props} />
        )}
      </div>
    </div>
  );
}
