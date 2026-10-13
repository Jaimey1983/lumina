import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@lumina/ui/lib/utils';
import type { TimelineConfiguracion, TimelineNodo } from '@lumina/types/widget';

import { WidgetMotion } from '../../_efectos/motion/widget-motion.js';
import styles from './timeline.module.css';
import { leerOpcionesT14 } from './timeline-t14.js';
import { timelineNodeAccentColor, timelineUsesSegmentBar, timelineVariantRootClass } from './timeline-variant-meta.js';

export function timelineNodeOnTop(
  index: number,
  disposicion: TimelineConfiguracion['disposicionNodos'],
): boolean {
  if (disposicion === 'arriba') return true;
  if (disposicion === 'abajo') return false;
  return index % 2 !== 0;
}

export function TimelineSegmentedBar({
  nodos,
  config,
}: {
  nodos: TimelineNodo[];
  config: TimelineConfiguracion;
}) {
  return (
    <div className={styles.tlSegmentedBar} aria-hidden>
      {nodos.map((nodo, index) => {
        const bg = timelineNodeAccentColor(nodo, index, config.colorNodo);
        return (
          <div
            key={nodo.id}
            className={styles.tlSegment}
            style={{ backgroundColor: bg }}
          >
            {nodo.mostrarEtiqueta && (
              <span className={styles.tlSegmentLabel}>{nodo.etiqueta}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TimelineStage({
  config,
  nodos,
  children,
  onBackgroundPointerDown,
  animar = false,
}: {
  config: TimelineConfiguracion;
  nodos: TimelineNodo[];
  children: ReactNode;
  onBackgroundPointerDown?: () => void;
  /** T14: los hijos son `WidgetMotionItem` y la fila los reparte con desfase. */
  animar?: boolean;
}) {
  const { orientacion, densidad } = leerOpcionesT14(config);
  const showSegmentBar = timelineUsesSegmentBar(config.variante);
  const showClassicLine = !showSegmentBar;

  return (
    <div
      className={cn(styles.tlStage, timelineVariantRootClass(config.variante))}
      data-halo={config.mostrarHaloNodo ? 'true' : 'false'}
      data-orientacion={orientacion === 'vertical' ? 'vertical' : undefined}
      data-densidad={densidad === 'normal' ? undefined : densidad}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onBackgroundPointerDown?.();
      }}
    >
      {showSegmentBar && <TimelineSegmentedBar nodos={nodos} config={config} />}
      {showClassicLine && <div className={styles.tlLine} />}
      {animar ? (
        <WidgetMotion className={styles.tlNodesRow} stagger={0.12}>
          {children}
        </WidgetMotion>
      ) : (
        <div className={styles.tlNodesRow}>{children}</div>
      )}
    </div>
  );
}

export function timelineNodeItemStyle(
  nodo: TimelineNodo,
  index: number,
  fallbackAccent: string,
): CSSProperties {
  const accent = timelineNodeAccentColor(nodo, index, fallbackAccent);
  return { '--tl-node-accent': accent } as CSSProperties;
}
