'use client';

import {
  getAllElements,
  getElementsMetadata,
  type ElementCategory,
  type PeriodicElement,
} from '@lumina/chemistry';
import type { EventoTipo } from '@lumina/types/interaction';
import type { TablaPeriodicaWidget } from '@lumina/types/widget';
import chromeStyles from '@lumina/editor-shared/widget-chrome.module.css';
import { WidgetHeaderViewer } from '@lumina/editor-shared/widget-header-viewer';
import { cn } from '@lumina/ui/lib/utils';
import {
  lazy,
  Suspense,
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
  CATEGORIAS_ORDEN,
  configuracionElectronicaV1,
  etiquetaCategoria,
  usoBreve,
} from './periodic-metadata.js';
import { BohrModel } from './bohr-model.js';
import styles from './tabla-periodica.module.css';
import { normalizeTablaPeriodicaWidget } from './tabla-periodica-config.js';

// Q13 / DQ4: `three` solo se descarga al activar la vista 3D de la ficha.
const BohrModel3D = lazy(() => import('./bohr-model-3d.js'));

const ALL = getAllElements();
const META = getElementsMetadata();

interface TablaPeriodicaViewerProps {
  widget: TablaPeriodicaWidget;
  isThumbnail?: boolean;
  isEditor?: boolean;
  onChange?: (next: TablaPeriodicaWidget) => void;
  emitir?: (evento: EventoTipo) => void;
}

function formatTemperatura(kelvin: number): string {
  return `${(kelvin - 273.15).toFixed(1)} °C`;
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

  // Resaltado de categoría (estado local: no se persiste en el bloque).
  const [categoriaFija, setCategoriaFija] = useState<ElementCategory | null>(null);
  const [categoriaHover, setCategoriaHover] = useState<ElementCategory | null>(null);
  const categoriaFoco = categoriaHover ?? categoriaFija;

  // Vista de la ficha: 2D (SVG, Q12) por defecto; 3D (three.js, Q13) bajo demanda.
  const [vista, setVista] = useState<'2d' | '3d'>('2d');
  const [fallo3d, setFallo3d] = useState(false);
  const alFallar3d = useCallback(() => {
    setFallo3d(true);
    setVista('2d');
  }, []);
  const usaHeatmap = configuracion.heatmapPropiedad !== 'ninguna';

  /** Mueve por la misma fila saltando huecos (p. ej. entre Be y B). */
  const moveHorizontal = (row: number, col: number, step: 1 | -1) => {
    for (let c = col + step; c >= 1 && c <= PERIODIC_GRID_COLS; c += step) {
      const el = cellMap.get(cellKey(row, c));
      if (el && visibleSet.has(el.symbol)) {
        selectSymbol(el.symbol);
        return;
      }
    }
  };

  /** Sube/baja por la misma columna saltando filas vacías (p. ej. el separador del bloque f). */
  const moveVertical = (row: number, col: number, step: 1 | -1) => {
    for (let r = row + step; r >= 1 && r <= PERIODIC_GRID_ROWS; r += step) {
      const el = cellMap.get(cellKey(r, col));
      if (el && visibleSet.has(el.symbol)) {
        selectSymbol(el.symbol);
        return;
      }
    }
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isThumbnail || !selectedEl) return;
    const pos = gridPositionForZ(selectedEl.z);
    if (!pos) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveHorizontal(pos.row, pos.col, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveHorizontal(pos.row, pos.col, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveVertical(pos.row, pos.col, 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveVertical(pos.row, pos.col, -1);
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
            {ALL.map((el) => {
              const pos = gridPositionForZ(el.z);
              if (!pos) return null;
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
              const categoria = etiquetaCategoria(el.category);
              const title = heat
                ? `${el.name} · ${categoria}: ${heat.label}`
                : `${el.name} (Z=${el.z}) · ${categoria}`;
              const fueraDeFoco =
                !usaHeatmap && categoriaFoco !== null && el.category !== categoriaFoco;
              return (
                <button
                  key={el.z}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`${el.name}, símbolo ${el.symbol}, número atómico ${el.z}, ${categoria}`}
                  title={title}
                  disabled={!visible}
                  data-cat={el.category}
                  className={cn(
                    styles.ptCell,
                    (!visible || fueraDeFoco) && styles.ptCellDim,
                    isSelected && styles.ptCellSelected,
                  )}
                  style={{
                    gridRow: pos.row,
                    gridColumn: pos.col,
                    ...(heat ? { backgroundColor: heat.backgroundColor } : null),
                  }}
                  onClick={() => visible && selectSymbol(el.symbol)}
                >
                  <span className={styles.ptZ}>{el.z}</span>
                  <span className={styles.ptSym}>{el.symbol}</span>
                  <span className={styles.ptName}>{el.name}</span>
                </button>
              );
            })}
          </div>
          {!usaHeatmap ? (
            <div
              className={styles.ptCats}
              role="group"
              aria-label="Categorías de elementos"
              aria-hidden={isThumbnail}
              onMouseLeave={() => setCategoriaHover(null)}
            >
              {CATEGORIAS_ORDEN.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  data-cat={cat}
                  aria-pressed={categoriaFija === cat}
                  tabIndex={isThumbnail ? -1 : 0}
                  className={cn(styles.ptCat, categoriaFija === cat && styles.ptCatOn)}
                  onMouseEnter={() => setCategoriaHover(cat)}
                  onFocus={() => setCategoriaHover(cat)}
                  onBlur={() => setCategoriaHover(null)}
                  onClick={() => setCategoriaFija((prev) => (prev === cat ? null : cat))}
                >
                  <span className={styles.ptCatDot} aria-hidden />
                  {etiquetaCategoria(cat)}
                </button>
              ))}
            </div>
          ) : null}
          {usaHeatmap && configuracion.mostrarLeyendaHeatmap ? (
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
              <div className={styles.ptCard} data-cat={selectedEl.category}>
                <span className={styles.ptCardZ}>{selectedEl.z}</span>
                <span className={styles.ptCardSym}>{selectedEl.symbol}</span>
                <span className={styles.ptCardName}>{selectedEl.name}</span>
                <span className={styles.ptCardCat}>{etiquetaCategoria(selectedEl.category)}</span>
              </div>
              {!isThumbnail ? (
                <div className={styles.ptVista} role="group" aria-label="Vista del modelo atómico">
                  {(['2d', '3d'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={vista === v}
                      disabled={v === '3d' && fallo3d}
                      title={
                        v === '3d' && fallo3d ? 'Tu navegador no admite gráficos 3D (WebGL)' : undefined
                      }
                      className={cn(styles.ptVistaBtn, vista === v && styles.ptVistaOn)}
                      onClick={() => setVista(v)}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : null}
              {vista === '3d' && !isThumbnail ? (
                <Suspense
                  fallback={
                    <BohrModel
                      z={selectedEl.z}
                      symbol={selectedEl.symbol}
                      name={selectedEl.name}
                      categoria={selectedEl.category}
                      estatico
                    />
                  }
                >
                  <BohrModel3D
                    z={selectedEl.z}
                    name={selectedEl.name}
                    masaNumero={Math.round(selectedEl.atomicMass)}
                    categoria={selectedEl.category}
                    onError={alFallar3d}
                  />
                  <p className={styles.ptBohrHint}>Arrastra para rotar · rueda para acercar</p>
                </Suspense>
              ) : (
                <BohrModel
                  z={selectedEl.z}
                  symbol={selectedEl.symbol}
                  name={selectedEl.name}
                  categoria={selectedEl.category}
                  estatico={isThumbnail}
                />
              )}
              <dl>
                <dt>Número atómico</dt>
                <dd>{selectedEl.z}</dd>
                <dt>Masa atómica</dt>
                <dd>{selectedEl.atomicMass.toFixed(3)} u</dd>
                <dt>Período</dt>
                <dd>{selectedEl.period}</dd>
                <dt>Grupo</dt>
                <dd>{selectedEl.group ?? 'Bloque f'}</dd>
                <dt>Categoría</dt>
                <dd>{etiquetaCategoria(selectedEl.category)}</dd>
                <dt>Config. electrónica (v1)</dt>
                <dd>{configuracionElectronicaV1(selectedEl.z)}</dd>
                {selectedEl.meltK != null ? (
                  <>
                    <dt>Fusión</dt>
                    <dd>{formatTemperatura(selectedEl.meltK)}</dd>
                  </>
                ) : null}
                {selectedEl.boilK != null ? (
                  <>
                    <dt>Ebullición</dt>
                    <dd>{formatTemperatura(selectedEl.boilK)}</dd>
                  </>
                ) : null}
                {selectedEl.discoveredBy ? (
                  <>
                    <dt>Descubridor</dt>
                    <dd>{selectedEl.discoveredBy}</dd>
                  </>
                ) : null}
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
