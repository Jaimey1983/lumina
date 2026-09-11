// @lumina/canvas-align — motor de alineación del editor de canvas (Etapa G).
// API pública. G1 añade el render (<AlignmentOverlay>) en ./overlay.

export {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
  virtualXToPercent,
  virtualYToPercent,
} from './virtual-canvas.js';

export {
  CANVAS_OVERFLOW_ORIGIN_MIN,
  CANVAS_OVERFLOW_ORIGIN_MAX,
  MIN_VISIBLE_PCT,
  clampAxisOrigin,
  clampDragCorner,
} from './clamp.js';

export { snapAxisToGridPercent, gridStepPercent } from './grid.js';

export {
  SPACING_NEIGHBOR_MAX_PX,
  SPACING_EQUAL_TOLERANCE_PX,
  SPACING_EDGE_MAX_PX,
  overlapsVertically,
  overlapsHorizontally,
  blockPosToPx,
  getEqualGapSnapTargets,
  type SpacingPos,
  type RectPx,
  type EqualGapTarget,
} from './spacing.js';

export {
  SNAP_THRESHOLD_PX,
  snapThresholdPct,
  snapLineColor,
  snapPositionToGuides,
  type SnapLine,
  type SnapToGuidesOptions,
} from './snap.js';

export {
  aabbOfRotatedRect,
  rectCenter,
  type AlignRect,
} from './obb.js';

export {
  computeMeasurements,
  type Measurement,
  type ComputeMeasurementsInput,
} from './measurements.js';

export {
  snapResizeSize,
  type ResizeSnapResult,
  type SizeSnapMatch,
} from './resize-snap.js';

export {
  computeSnap,
  blockRotation,
  type ComputeSnapContext,
  type ComputeSnapResult,
} from './compute-snap.js';

// Render (G1)
export * from './overlay/index.js';
