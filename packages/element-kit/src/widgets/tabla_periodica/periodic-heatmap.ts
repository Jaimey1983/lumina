import type { PeriodicElement } from '@lumina/chemistry';
import type { TablaPeriodicaHeatmapProp } from '@lumina/types/widget';

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function heatValue(el: PeriodicElement, prop: TablaPeriodicaHeatmapProp): number | null {
  if (prop === 'ninguna') return null;
  if (prop === 'masa_atomica') return el.atomicMass;
  if (prop === 'periodo') return el.period;
  if (prop === 'grupo') return el.group;
  return null;
}

export function heatmapStyleForElement(
  el: PeriodicElement,
  prop: TablaPeriodicaHeatmapProp,
  min: number,
  max: number,
): { backgroundColor: string; label: string } | undefined {
  const v = heatValue(el, prop);
  if (v === null || !Number.isFinite(v)) return undefined;
  const span = max - min;
  const t = span <= 0 ? 0.5 : clamp01((v - min) / span);
  const hue = 220 - t * 200;
  const backgroundColor = `hsl(${hue} 65% ${88 - t * 28}%)`;
  const label =
    prop === 'masa_atomica'
      ? `${v.toFixed(3)} u`
      : prop === 'periodo'
        ? `Período ${v}`
        : el.group !== null
          ? `Grupo ${el.group}`
          : 'Sin grupo';
  return { backgroundColor, label };
}

export function heatmapRange(
  elements: readonly PeriodicElement[],
  prop: TablaPeriodicaHeatmapProp,
): { min: number; max: number } {
  const vals = elements
    .map((el) => heatValue(el, prop))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  if (vals.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

export function heatmapPropiedadLabel(prop: TablaPeriodicaHeatmapProp): string {
  switch (prop) {
    case 'masa_atomica':
      return 'Masa atómica (u)';
    case 'grupo':
      return 'Grupo';
    case 'periodo':
      return 'Período';
    default:
      return '';
  }
}
