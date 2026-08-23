import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineConfiguracion, TimelineNodo } from '@/types/widget.types';

import styles from './timeline.module.css';
import { timelineNodeAccentColor, timelineUsesSegmentBar, timelineVariantRootClass } from './timeline-variant-meta';

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
}: {
  config: TimelineConfiguracion;
  nodos: TimelineNodo[];
  children: ReactNode;
  onBackgroundPointerDown?: () => void;
}) {
  const showSegmentBar = timelineUsesSegmentBar(config.variante);
  const showClassicLine = !showSegmentBar;

  return (
    <div
      className={cn(styles.tlStage, timelineVariantRootClass(config.variante))}
      data-halo={config.mostrarHaloNodo ? 'true' : 'false'}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onBackgroundPointerDown?.();
      }}
    >
      {showSegmentBar && <TimelineSegmentedBar nodos={nodos} config={config} />}
      {showClassicLine && <div className={styles.tlLine} />}
      <div className={styles.tlNodesRow}>{children}</div>
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
