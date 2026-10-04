'use client';

import type { MoleculaWidget } from '@lumina/types/widget';

import { MoleculaSmilesCanvas } from './molecula-canvas.js';
import { normalizeMoleculaWidget } from './molecula-config.js';
import styles from './molecula.module.css';

export function MoleculaViewer({
  widget,
  isThumbnail,
}: {
  widget: MoleculaWidget;
  isThumbnail?: boolean;
}) {
  const w = normalizeMoleculaWidget(widget);
  const cfg = w.configuracion;
  const alt =
    w.formulaMolecular?.trim()
      ? `Estructura 2D de ${w.formulaMolecular}`
      : w.nombreComun?.trim()
        ? `Estructura 2D de ${w.nombreComun}`
        : 'Estructura molecular 2D';

  const height = isThumbnail ? 120 : (cfg.alturaCanvasPx ?? 280);

  return (
    <div
      className={styles.root}
      style={{
        backgroundColor: cfg.colorFondoContenedor,
        padding: cfg.paddingContenedor ?? 16,
      }}
    >
      {cfg.mostrarTituloWidget && w.tituloWidget ? (
        <h3 className={styles.title}>{w.tituloWidget}</h3>
      ) : null}
      {cfg.mostrarSubtitulo && w.subtituloWidget ? (
        <p className={styles.subtitle}>{w.subtituloWidget}</p>
      ) : null}
      {cfg.mostrarInstruccion && w.instruccion ? (
        <p className={styles.instruction}>{w.instruccion}</p>
      ) : null}
      <div className={styles.canvasWrap} role="img" aria-label={alt}>
        <MoleculaSmilesCanvas smiles={w.smiles} heightPx={height} />
      </div>
      {w.formulaMolecular ? (
        <p className={styles.formula}>{w.formulaMolecular}</p>
      ) : null}
    </div>
  );
}
