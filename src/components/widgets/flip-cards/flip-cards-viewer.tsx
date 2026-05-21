'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import type { FlipCard, FlipCardsWidget } from '@/types/slide.types';
import { cn } from '@/lib/utils';

import styles from './flip-cards.module.css';
import type { FlipCardsConfiguracionCompleta } from './flip-cards-config';
import { imageElementStyle, imageWrapperStyle } from './flip-cards-image-styles';
import {
  resolveCaraVisibilidad,
  resolveTextPos,
} from './flip-cards-card-utils';
import {
  flipCardsCardChromeStyle,
  flipCardsContainerStyle,
  flipCardsGridStyle,
  flipCardsHeaderStyle,
  flipCardsPerPage,
  FlipCardsHeader,
  mergedFlipCardsConfig,
  normalizeFlipCardsWidget,
  textStyleToCss,
} from './flip-cards-shared';

export interface FlipCardsViewerProps {
  block: FlipCardsWidget;
}

function FlipCard3D({
  card,
  configuracion,
  flipped,
  onToggle,
}: {
  card: FlipCard;
  configuracion: FlipCardsConfiguracionCompleta;
  flipped: boolean;
  onToggle: () => void;
}) {
  const chrome = flipCardsCardChromeStyle(configuracion);

  const renderFace = (lado: 'frente' | 'reverso') => {
    const data = lado === 'frente' ? card.frente : card.reverso;
    const bg = lado === 'frente' ? configuracion.colorFrente : configuracion.colorReverso;
    const isBack = lado === 'reverso';
    const vis = resolveCaraVisibilidad(configuracion, lado, data);
    const titleStyle = {
      color: data.estiloTitulo?.color ?? (isBack ? '#ffffff' : '#0f172a'),
      ...textStyleToCss(data.estiloTitulo),
    };
    const bodyStyle = {
      color: data.estiloCuerpo?.color ?? (isBack ? 'rgba(255,255,255,0.92)' : '#475569'),
      ...textStyleToCss(data.estiloCuerpo),
    };
    const titlePos = resolveTextPos(data, 'titulo');
    const bodyPos = resolveTextPos(data, 'cuerpo');

    const hasImage = vis.mostrarImagen && !!data.imagen;
    const textShadowClass = hasImage ? styles.fcTextOnImage : undefined;

    return (
      <div
        className={cn(styles.flipFace, isBack && styles.flipFaceBack)}
        style={{ backgroundColor: bg, ...chrome }}
      >
        <div className={styles.fcFaceStack}>
          {hasImage ? (
            <div
              className={styles.fcImageLayer}
              style={imageWrapperStyle(data, configuracion.bordeTarjetaRadio)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imagen}
                alt={data.imagenAlt ?? ''}
                className={styles.flipImage}
                style={imageElementStyle(data)}
              />
            </div>
          ) : null}
          {vis.mostrarTitulo ? (
            <div
              className={cn(styles.fcCardTextEl, textShadowClass)}
              style={{ left: `${titlePos.x}%`, top: `${titlePos.y}%` }}
            >
              <p className={styles.flipTitle} style={titleStyle}>
                {data.titulo}
              </p>
            </div>
          ) : null}
          {vis.mostrarCuerpo ? (
            <div
              className={cn(styles.fcCardTextEl, textShadowClass)}
              style={{ left: `${bodyPos.x}%`, top: `${bodyPos.y}%` }}
            >
              <p className={styles.flipText} style={bodyStyle}>
                {data.cuerpo}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.flipScene}>
      <div className={cn(styles.flipInner, flipped && styles.flipInnerFlipped)}>
        {renderFace('frente')}
        {renderFace('reverso')}
      </div>
      <button
        type="button"
        className={styles.flipBtn}
        aria-label="Voltear tarjeta"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <RefreshCw size={18} color="#2563EB" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function FlipCardsNav({
  safePage,
  totalPages,
  showPrev,
  showNext,
  onPrev,
  onNext,
}: {
  safePage: number;
  totalPages: number;
  showPrev: boolean;
  showNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.fcNav}>
      {showPrev ? (
        <button
          type="button"
          className={styles.fcNavBtn}
          disabled={safePage <= 0}
          aria-label="Tarjetas anteriores"
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
      <span className={styles.fcNavLabel}>
        {safePage + 1} / {totalPages}
      </span>
      {showNext ? (
        <button
          type="button"
          className={styles.fcNavBtn}
          disabled={safePage >= totalPages - 1}
          aria-label="Tarjetas siguientes"
          onClick={onNext}
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function FlipCardsViewer({ block: rawBlock }: FlipCardsViewerProps) {
  const block = normalizeFlipCardsWidget(rawBlock);
  const configuracion = mergedFlipCardsConfig(block);
  const { tarjetas } = block;
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(0);

  const perPage = flipCardsPerPage(configuracion.columnas);
  const totalPages = Math.max(1, Math.ceil(tarjetas.length / perPage));
  const safePage = Math.min(page, totalPages - 1);

  const visibleCards = tarjetas.slice(
    safePage * perPage,
    safePage * perPage + perPage,
  );

  const needsNav = tarjetas.length > perPage;
  const showPrev = needsNav && configuracion.mostrarBotonAnterior;
  const showNext = needsNav && configuracion.mostrarBotonSiguiente;

  const toggleFlip = useCallback((id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div
      className={styles.fcRoot}
      style={flipCardsContainerStyle(block)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.fcHeader} style={flipCardsHeaderStyle(configuracion)}>
        <FlipCardsHeader block={block} />
      </div>

      <div className={styles.fcGrid} style={flipCardsGridStyle(configuracion)}>
        {visibleCards.map((card) => (
          <FlipCard3D
            key={card.id}
            card={card}
            configuracion={configuracion}
            flipped={flipped.has(card.id)}
            onToggle={() => toggleFlip(card.id)}
          />
        ))}
      </div>

      {showPrev || showNext ? (
        <FlipCardsNav
          safePage={safePage}
          totalPages={totalPages}
          showPrev={showPrev}
          showNext={showNext}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        />
      ) : null}
    </div>
  );
}
