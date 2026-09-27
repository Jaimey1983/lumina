/**
 * Config de runtime compartida por widgets del canvas (E5.5).
 * El Editor del contrato la recibe vía `config`; el adapter la reenvía al legacy.
 */
export interface WidgetCanvasConfig<TInner = unknown> {
  readonly isThumbnail?: boolean;
  /** Click dentro del widget → seleccionar el bloque en el canvas. */
  readonly onEnsureBlockSelected?: () => void;
  /** Inner-selection lifteada desde el reducer del editor; si falta, el adapter usa estado local. */
  readonly innerSelection?: TInner | null;
  readonly onInnerSelectionChange?: (selection: TInner | null) => void;
}
