'use client';

import {
  getAllElements,
  getElementsMetadata,
  type PeriodicElement,
} from '@lumina/chemistry';
import type { EventoTipo } from '@lumina/types/interaction';
import type { TablaPeriodicaWidget } from '@lumina/types/widget';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { WidgetHeaderViewer } from '@lumina/editor-shared/widget-header-viewer';
import { cn } from '@lumina/ui/lib/utils';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { bloqueVisible, categoriaVisible } from './periodic-filters.js';
import {
  heatmapPropiedadLabel,
  heatmapRange,
  heatmapStyleForElement,
} from './periodic-heatmap.js';
import {
  buildPeriodicGridCells,
  gridPositionForZ,
  PERIODIC_GRID_COLS,
  PERIODIC_GRID_ROWS,
} from './periodic-layout.js';
import {
  configuracionElectronicaV1,
  etiquetaCategoria,
  usoBreve,
} from './periodic-metadata.js';
import styles from './tabla-periodica.module.css';
import { normalizeTablaPeriodicaWidget } from './tabla-periodica-config.js';

const ALL = getAllElements();
const META = getElementsMetadata();

interface TablaPeriodicaViewerProps {
  widget: TablaPeriodicaWidget;
  isThumbnail?: boolean;
  isEditor?: boolean;
  onChange?: (next: TablaPeriodicaWidget) => void;
  emitir?: (evento: EventoTipo) => void;
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function TablaPeriodicaViewer({
  widget,
  isThumbnail = false,
  isEditor = false,
  onChange,
  emitir,
}: TablaPeriodicaViewerProps) {
  const normalized = normalizeTablaPeriodicaWidget(widget);
  const { configuracion } = normalized;
  const visitadoRef = useRef(false);

  const filtered = useMemo(
    () =>
      ALL.filter(
        (el) =>
          categoriaVisible(el, configuracion.filtroCategoria) &&
          bloqueVisible(el, configuracion.filtroBloque),
      ),
    [configuracion.filtroBloque, configuracion.filtroCategoria],
  );

  const bySymbol = useMemo(() => {
    const m = new Map<string, PeriodicElement>();
    for (const el of ALL) m.set(el.symbol, el);
    return m;
  }, []);

  const cellMap = useMemo(() => {
    const m = new Map<string, PeriodicElement>();
    for (const el of ALL) {
      const pos = gridPositionForZ(el.z);
      if (pos) m.set(cellKey(pos.row, pos.col), el);
    }
    return m;
  }, []);

  const visibleSet = useMemo(() => new Set(filtered.map((e) => e.symbol)), [filtered]);

  const heatRange = useMemo(
    () => heatmapRange(filtered, configuracion.heatmapPropiedad),
    [filtered, configuracion.heatmapPropiedad],
  );

  const [selected, setSelected] = useState<string | null>(
    normalized.seleccionado ?? null,
  );

  useEffect(() => {
    setSelected(normalized.seleccionado ?? null);
  }, [normalized.seleccionado]);

  const selectSymbol = useCallback(
    (symbol: string | null) => {
      if (isThumbnail) return;
      setSelected(symbol);
      if (onChange && symbol) {
        onChange({ ...normalized, seleccionado: symbol });
      }
      if (symbol) {
        emitir?.('seleccionado');
        if (!visitadoRef.current) {
          visitadoRef.current = true;
          emitir?.('visitado');
        }
      }
    },
    [emitir, isThumbnail, normalized, onChange],
  );

  const selectedEl = selected ? bySymbol.get(selected) : undefined;

  const moveFocus = (row: number, col: number) => {
    for (let i = 0; i < PERIODIC_GRID_ROWS * PERIODIC_GRID_COLS; i++) {
      const el = cellMap.get(cellKey(row, col));
      if (el && visibleSet.has(el.symbol)) {
        selectSymbol(el.symbol);
        return;
      }
      col++;
      if (col > PERIODIC_GRID_COLS) {
        col = 1;
        row++;
      }
      if (row > PERIODIC_GRID_ROWS) row = 1;
    }
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isThumbnail || !selectedEl) return;
    const pos = gridPositionForZ(selectedEl.z);
    if (!pos) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveFocus(pos.row, pos.col + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveFocus(pos.row, pos.col - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(pos.row + 1, pos.col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(pos.row - 1, pos.col);
    }
  };

  const containerStyle = {
    backgroundColor: configuracion.colorFondoContenedor,
    opacity: (configuracion.opacidadFondoContenedor ?? 100) / 100,
    padding: configuracion.paddingContenedor ?? 12,
  };

  return (
    <div
      className={cn(
        chromeStyles.whRoot,
        styles.ptRoot,
        isThumbnail && 'pointer-events-none overflow-hidden',
      )}
      style={containerStyle}
      data-moveable-ignore={isEditor ? true : undefined}
    >
      <div className={chromeStyles.whHeader}>
        <WidgetHeaderViewer {...normalized} config={configuracion} />
      </div>
      <div className={cn(chromeStyles.whContent, styles.ptBody)}>
        <div className={styles.ptGridWrap}>
          <div
            role="grid"
            aria-label="Tabla periódica de los elementos"
            aria-rowcount={PERIODIC_GRID_ROWS}
            aria-colcount={PERIODIC_GRID_COLS}
            className={styles.ptGrid}
            tabIndex={isThumbnail ? -1 : 0}
            onKeyDown={onGridKeyDown}
          >
            {Array.from({ length: PERIODIC_GRID_ROWS }, (_, ri) => {
              const row = ri + 1;
              return Array.from({ length: PERIODIC_GRID_COLS }, (_, ci) => {
                const col = ci + 1;
                const el = cellMap.get(cellKey(row, col));
                if (!el) {
                  return (
                    <span
                      key={cellKey(row, col)}
                      role="presentation"
                      className={styles.ptCell}
                      style={{ visibility: 'hidden' }}
                    />
                  );
                }
                const visible = visibleSet.has(el.symbol);
                const isSelected = selected === el.symbol;
                const heat =
                  visible && configuracion.heatmapPropiedad !== 'ninguna'
                    ? heatmapStyleForElement(
                        el,
                        configuracion.heatmapPropiedad,
                        heatRange.min,
                        heatRange.max,
                      )
                    : undefined;
                const title = heat
                  ? `${el.name}: ${heat.label}`
                  : `${el.name} (Z=${el.z})`;
                return (
                  <button
                    key={cellKey(row, col)}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={`${el.name}, símbolo ${el.symbol}, número atómico ${el.z}`}
                    title={title}
                    disabled={!visible}
                    className={cn(
                      styles.ptCell,
                      !visible && styles.ptCellDim,
                      isSelected && styles.ptCellSelected,
                    )}
                    style={heat ? { backgroundColor: heat.backgroundColor } : undefined}
                    onClick={() => visible && selectSymbol(el.symbol)}
                  >
                    <span className={styles.ptZ}>{el.z}</span>
                    <span className={styles.ptSym}>{el.symbol}</span>
                  </button>
                );
              });
            })}
          </div>
          {configuracion.heatmapPropiedad !== 'ninguna' &&
          configuracion.mostrarLeyendaHeatmap ? (
            <div className={styles.ptLegend} aria-hidden={isThumbnail}>
              <span>{heatmapPropiedadLabel(configuracion.heatmapPropiedad)}</span>
              <span>
                {heatRange.min.toFixed(configuracion.heatmapPropiedad === 'masa_atomica' ? 2 : 0)}
              </span>
              <div className={styles.ptLegendBar} />
              <span>
                {heatRange.max.toFixed(configuracion.heatmapPropiedad === 'masa_atomica' ? 2 : 0)}
              </span>
            </div>
          ) : null}
        </div>
        <aside className={styles.ptDetail} aria-live="polite">
          {selectedEl && visibleSet.has(selectedEl.symbol) ? (
            <>
              <h4>
                {selectedEl.name} ({selectedEl.symbol})
              </h4>
              <dl>
                <dt>Número atómico</dt>
                <dd>{selectedEl.z}</dd>
                <dt>Masa atómica</dt>
                <dd>{selectedEl.atomicMass.toFixed(3)} u</dd>
                <dt>Período</dt>
                <dd>{selectedEl.period}</dd>
                <dt>Grupo</dt>
                <dd>{selectedEl.group ?? '—'}</dd>
                <dt>Categoría</dt>
                <dd>{etiquetaCategoria(selectedEl.category)}</dd>
                <dt>Config. electrónica (v1)</dt>
                <dd>{configuracionElectronicaV1(selectedEl.z)}</dd>
                <dt>Usos</dt>
                <dd>{usoBreve(selectedEl)}</dd>
              </dl>
            </>
          ) : (
            <p>Selecciona un elemento de la tabla.</p>
          )}
          <p style={{ marginTop: 8, fontSize: 10, opacity: 0.7 }}>
            Datos: {META.sourceVersion} · {META.elementCount} elementos
          </p>
        </aside>
      </div>
    </div>
  );
}

export function validatePeriodicDataset(): number {
  return buildPeriodicGridCells(ALL).length;
}
