'use client';

import React, { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineConfiguracion, TimelineNodo } from '@/types/widget.types';
import { imageFilterStyle } from '@/components/widgets/shared/widget-image-styles';

import { TimelineLucideIcon } from './timeline-icon-catalog';
import { TimelineCard, TimelineConnectorFlex, TimelineNodeDot } from './timeline-node-primitives';
import { timelineNodeOnTop, timelineNodeItemStyle } from './timeline-stage';
import { timelineNodoTitulo, timelineNodeAccentColor } from './timeline-variant-meta';
import {
  timelineCuerpoTextStyle,
  timelineEtiquetaTextStyle,
  timelineTituloTextStyle,
} from './timeline-text-styles';

import styles from './timeline.module.css';

function TimelineRegionGap({ config }: { config: TimelineConfiguracion }) {
  if (config.mostrarConectorVertical) {
    return <TimelineConnectorFlex config={config} />;
  }
  return <div className={styles.tlRegionGap} aria-hidden />;
}

function TimelineNodeColumn({
  isTop,
  config,
  content,
  dot,
}: {
  isTop: boolean;
  config: TimelineConfiguracion;
  content: React.ReactNode;
  dot: React.ReactNode;
}) {
  return (
    <>
      <div className={cn(styles.tlCardTop, isTop && styles.tlCardHalfFilled)}>
        {isTop ? (
          <div className={cn(styles.tlRegionStack, styles.tlRegionStackTop)}>
            <div className={styles.tlCardSlot}>{content}</div>
            <TimelineRegionGap config={config} />
          </div>
        ) : null}
      </div>
      {dot}
      <div className={cn(styles.tlCardBottom, !isTop && styles.tlCardHalfFilled)}>
        {!isTop ? (
          <div className={cn(styles.tlRegionStack, styles.tlRegionStackBottom)}>
            <TimelineRegionGap config={config} />
            <div className={styles.tlCardSlot}>{content}</div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export type TimelineNodeLayoutProps = {
  nodo: TimelineNodo;
  index: number;
  config: TimelineConfiguracion;
  isActive?: boolean;
  isThumbnail?: boolean;
  imageStyle?: CSSProperties;
  computedImageLayout?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  interactive?: boolean;
  onNodeActivate?: () => void;
  etiquetaSlot?: ReactNode;
  tituloSlot?: ReactNode;
  cuerpoSlot?: ReactNode;
  imagenSlot?: ReactNode;
};

function TimelineNodeShell({
  nodo,
  index,
  config,
  isActive,
  interactive,
  onNodeActivate,
  children,
}: TimelineNodeLayoutProps & { children: ReactNode }) {
  return (
    <div
      className={cn(styles.tlNodeItem, isActive && styles.tlNodeActive, isActive && styles.tlNodeSelected)}
      style={timelineNodeItemStyle(nodo, index, config.colorNodo)}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={
        interactive
          ? (e) => {
              e.stopPropagation();
              onNodeActivate?.();
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNodeActivate?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function TimelineCorporateIcon({ nodo, index, config }: { nodo: TimelineNodo; index: number; config: TimelineConfiguracion }) {
  if (!nodo.mostrarIconoLucide || nodo.iconoLucide === 'none') return null;
  return (
    <div
      className={styles.tlCorporateIcon}
      style={{ backgroundColor: timelineNodeAccentColor(nodo, index, config.colorNodo) }}
    >
      <TimelineLucideIcon name={nodo.iconoLucide} className="text-white" size={20} />
    </div>
  );
}

function TimelineProyectoPhoto({
  nodo,
  isThumbnail,
  imageStyle,
  computedImageLayout,
  imgRef,
  onImageLoad,
}: Pick<
  TimelineNodeLayoutProps,
  'nodo' | 'isThumbnail' | 'imageStyle' | 'computedImageLayout' | 'imgRef' | 'onImageLoad'
>) {
  if (!nodo.mostrarImagen) return null;
  return (
    <div className={styles.tlProyectoPhoto}>
      {nodo.imagen ? (
        <img
          ref={imgRef}
          src={nodo.imagen}
          alt=""
          className="size-full object-cover"
          style={{ ...imageFilterStyle(nodo), ...imageStyle }}
          onLoad={onImageLoad}
          draggable={false}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-slate-200 text-[10px] text-slate-500">Foto</div>
      )}
    </div>
  );
}

export function TimelineStandardLayout(props: TimelineNodeLayoutProps) {
  const { nodo, config, isTop } = {
    ...props,
    isTop: timelineNodeOnTop(props.index, props.config.disposicionNodos),
  };
  const usePlainContent = config.variante === 'minimal';

  const cardElement = (
    <TimelineCard
      nodo={nodo}
      index={props.index}
      config={config}
      isThumbnail={props.isThumbnail}
      imageStyle={props.imageStyle}
      computedImageLayout={props.computedImageLayout}
      containerRef={props.containerRef}
      imgRef={props.imgRef}
      onImageLoad={props.onImageLoad}
      etiquetaSlot={props.etiquetaSlot}
      tituloSlot={props.tituloSlot}
      imagenSlot={props.imagenSlot}
      cuerpoSlot={props.cuerpoSlot}
      usePlainContent={usePlainContent}
    />
  );

  const dot = (
    <TimelineNodeDot
      nodo={nodo}
      index={props.index}
      config={config}
      imageStyle={props.imageStyle}
      imgRef={props.imgRef}
      onImageLoad={props.onImageLoad}
    />
  );

  return (
    <TimelineNodeShell {...props}>
      <TimelineNodeColumn isTop={isTop} config={config} content={cardElement} dot={dot} />
    </TimelineNodeShell>
  );
}

export function TimelineVerticalLayout(props: TimelineNodeLayoutProps) {
  const { nodo, config } = props;
  const isTop = timelineNodeOnTop(props.index, config.disposicionNodos);

  const content = (
    <div className={styles.tlVerticalInner}>
      {nodo.mostrarEtiqueta ? (
        <>
          <div className={styles.tlVerticalYearCol}>
            <div className={styles.tlVerticalLabelWrap}>
              {props.etiquetaSlot ?? (
                <span
                  className={cn(styles.tlVerticalLabel, styles.tlVerticalYear)}
                  style={timelineEtiquetaTextStyle(nodo, config)}
                >
                  {nodo.etiqueta}
                </span>
              )}
            </div>
          </div>
          <div className={styles.tlVerticalSep} aria-hidden />
        </>
      ) : null}
      {nodo.mostrarTituloNodo ? (
        <div className={styles.tlVerticalTitleCol}>
          <div className={styles.tlVerticalLabelWrap}>
            {props.tituloSlot ?? (
              <div
                className={cn(styles.tlVerticalLabel, styles.tlVerticalTitle)}
                style={timelineTituloTextStyle(nodo, props.index, config)}
              >
                {timelineNodoTitulo(nodo)}
              </div>
            )}
          </div>
        </div>
      ) : null}
      {nodo.mostrarCuerpo ? (
        <div className={styles.tlVerticalBodyCol}>
          {props.cuerpoSlot ?? (
            <div className={styles.tlVerticalBody} style={timelineCuerpoTextStyle(nodo, config)}>
              {nodo.cuerpo}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const dot = <TimelineNodeDot nodo={nodo} index={props.index} config={config} />;

  return (
    <TimelineNodeShell {...props}>
      <TimelineNodeColumn isTop={isTop} config={config} content={content} dot={dot} />
    </TimelineNodeShell>
  );
}

export function TimelineCorporateLayout(props: TimelineNodeLayoutProps) {
  const { nodo, config } = props;
  const isTop = timelineNodeOnTop(props.index, config.disposicionNodos);

  const block = (
    <div className={styles.tlCorporateBlock}>
      <TimelineCorporateIcon nodo={nodo} index={props.index} config={config} />
      <div className={styles.tlCorporateText}>
        {nodo.mostrarTituloNodo &&
          (props.tituloSlot ?? (
            <div
              className={styles.tlCorporateTitle}
              style={timelineTituloTextStyle(nodo, props.index, config)}
            >
              {timelineNodoTitulo(nodo)}
            </div>
          ))}
        {nodo.mostrarCuerpo &&
          (props.cuerpoSlot ?? (
            <div className={styles.tlCorporateBody} style={timelineCuerpoTextStyle(nodo, config)}>
              {nodo.cuerpo}
            </div>
          ))}
      </div>
    </div>
  );

  const dot = <TimelineNodeDot nodo={nodo} index={props.index} config={config} />;

  return (
    <TimelineNodeShell {...props}>
      <TimelineNodeColumn isTop={isTop} config={config} content={block} dot={dot} />
    </TimelineNodeShell>
  );
}

export function TimelineProyectoLayout(props: TimelineNodeLayoutProps) {
  const { nodo, config } = props;
  const isTop = timelineNodeOnTop(props.index, config.disposicionNodos);

  const block = (
    <div className={styles.tlProyectoBlock}>
      {nodo.mostrarNumeroPaso &&
        (props.etiquetaSlot ?? (
          <span className={styles.tlProyectoNum} style={timelineEtiquetaTextStyle(nodo, config)}>
            {nodo.numeroPaso}
          </span>
        ))}
      {nodo.mostrarTituloNodo &&
        (props.tituloSlot ?? (
          <div
            className={styles.tlProyectoTitle}
            style={timelineTituloTextStyle(nodo, props.index, config)}
          >
            {timelineNodoTitulo(nodo)}
          </div>
        ))}
      {nodo.mostrarCuerpo &&
        (props.cuerpoSlot ?? (
          <div className={styles.tlProyectoBody} style={timelineCuerpoTextStyle(nodo, config)}>
            {nodo.cuerpo}
          </div>
        ))}
      {nodo.mostrarImagen &&
        (props.imagenSlot ?? <TimelineProyectoPhoto {...props} />)}
    </div>
  );

  const dot = <TimelineNodeDot nodo={nodo} index={props.index} config={config} />;

  return (
    <TimelineNodeShell {...props}>
      <TimelineNodeColumn isTop={isTop} config={config} content={block} dot={dot} />
    </TimelineNodeShell>
  );
}

export function TimelineInfograficaLayout(props: TimelineNodeLayoutProps) {
  const { nodo, config } = props;
  const isTop = timelineNodeOnTop(props.index, config.disposicionNodos);

  const block = (
    <div className={styles.tlInfograficaBlock}>
      {nodo.mostrarTituloNodo &&
        (props.tituloSlot ?? (
          <div
            className={styles.tlInfograficaTitle}
            style={timelineTituloTextStyle(nodo, props.index, config)}
          >
            {timelineNodoTitulo(nodo).toUpperCase()}
          </div>
        ))}
      {nodo.mostrarCuerpo &&
        (props.cuerpoSlot ?? (
          <div className={styles.tlInfograficaBody} style={timelineCuerpoTextStyle(nodo, config)}>
            {nodo.cuerpo}
          </div>
        ))}
    </div>
  );

  const dot = (
    <TimelineNodeDot
      nodo={nodo}
      index={props.index}
      config={config}
      imageStyle={props.imageStyle}
      imgRef={props.imgRef}
      onImageLoad={props.onImageLoad}
    />
  );

  return (
    <TimelineNodeShell {...props}>
      <TimelineNodeColumn isTop={isTop} config={config} content={block} dot={dot} />
    </TimelineNodeShell>
  );
}

export function TimelineNodeLayout(props: TimelineNodeLayoutProps) {
  switch (props.config.variante) {
    case 'vertical':
      return <TimelineVerticalLayout {...props} />;
    case 'corporate':
      return <TimelineCorporateLayout {...props} />;
    case 'proyecto':
      return <TimelineProyectoLayout {...props} />;
    case 'infografica':
      return <TimelineInfograficaLayout {...props} />;
    default:
      return <TimelineStandardLayout {...props} />;
  }
}
