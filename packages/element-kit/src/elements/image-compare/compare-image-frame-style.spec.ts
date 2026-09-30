import { describe, expect, it } from "vitest";
import {
  clampCompareOffsetPct,
  compareImageFrameStyle,
} from "./compare-image-frame-style.js";

describe("compareImageFrameStyle", () => {
  it("llena el contenedor en % (nunca px de medición)", () => {
    const style = compareImageFrameStyle({});
    expect(style.width).toBe("100%");
    expect(style.height).toBe("100%");
    expect(style.inset).toBe(0);
    expect(style.objectFit).toBe("cover");
    expect(style.objectPosition).toBe("center center");
    expect(style.transform).toBeUndefined();
    expect(JSON.stringify(style)).not.toMatch(/px/);
  });

  it("mapea offsets de slider (−40…+40) a object-position %", () => {
    const style = compareImageFrameStyle({ offsetXPct: 15, offsetYPct: -10 });
    expect(style.objectPosition).toBe("65% 40%");
  });

  it("aplica zoom extra con transform scale, no con width px", () => {
    const style = compareImageFrameStyle({ escalaPct: 130 });
    expect(style.transform).toBe("scale(1.3)");
    expect(style.width).toBe("100%");
  });

  it("respeta object-fit contain", () => {
    expect(
      compareImageFrameStyle({ objectFit: "contain" }).objectFit,
    ).toBe("contain");
  });

  it("el letterbox de contain es opaco (no deja ver la otra capa del wipe)", () => {
    const style = compareImageFrameStyle({ objectFit: "contain" });
    expect(style.backgroundColor).toBe("var(--lw-color-surface, #f8fafc)");
  });

  it("clampCompareOffsetPct no sale de ±40", () => {
    expect(clampCompareOffsetPct(99)).toBe(40);
    expect(clampCompareOffsetPct(-99)).toBe(-40);
  });
});
