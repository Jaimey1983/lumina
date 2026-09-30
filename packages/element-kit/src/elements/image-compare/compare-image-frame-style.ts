import type { CSSProperties } from "react";

/** Rango de los sliders de encuadre (porcentaje del escenario). */
export const COMPARE_OFFSET_PCT_MAX = 40;

export function clampCompareOffsetPct(value: number): number {
  return Math.min(
    COMPARE_OFFSET_PCT_MAX,
    Math.max(-COMPARE_OFFSET_PCT_MAX, value),
  );
}

export type CompareImageFrameInput = {
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  offsetXPct?: number;
  offsetYPct?: number;
  escalaPct?: number;
};

/**
 * Encuadre del bitmap en unidades relativas al contenedor.
 *
 * El wipe apila dos fotos a tamaño completo del escenario. `contain` deja
 * letterbox: al mostrar título/subtítulo el escenario se achica y esas bandas
 * se ven (o se transparentan hacia la otra capa). Por eso el pintado es
 * siempre `cover`; pan/zoom siguen en object-position y scale.
 *
 * No usa width/height/top/left en px. El preview/visor escala el lienzo
 * 1280×720 con `transform: scale(k)`; cualquier medida de getBoundingClientRect
 * escrita como CSS px deja las fotos a ~k del escenario.
 */
export function compareImageFrameStyle(
  input: CompareImageFrameInput,
): CSSProperties {
  const ox = clampCompareOffsetPct(input.offsetXPct ?? 0);
  const oy = clampCompareOffsetPct(input.offsetYPct ?? 0);
  const scale = (input.escalaPct ?? 100) / 100;
  const hasNumericOffset = ox !== 0 || oy !== 0;
  const objectPosition = hasNumericOffset
    ? `${50 + ox}% ${50 + oy}%`
    : (input.objectPosition ?? "center center");

  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "cover",
    objectPosition,
    backgroundColor: "var(--lw-color-surface, #f8fafc)",
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: "center center",
    pointerEvents: "none",
    userSelect: "none",
    display: "block",
  };
}

export function applyCompareImageFrameStyle(
  img: HTMLImageElement,
  input: CompareImageFrameInput,
): void {
  const style = compareImageFrameStyle(input);
  img.style.position = "absolute";
  img.style.inset = "0";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.maxWidth = "none";
  img.style.maxHeight = "none";
  img.style.objectFit = String(style.objectFit ?? "cover");
  img.style.objectPosition = String(style.objectPosition ?? "center center");
  img.style.backgroundColor = String(
    style.backgroundColor ?? "var(--lw-color-surface, #f8fafc)",
  );
  img.style.transform = style.transform ? String(style.transform) : "";
  img.style.transformOrigin = "center center";
}
