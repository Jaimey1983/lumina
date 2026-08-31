import { describe, expect, it } from 'vitest';
import {
  computeRotationAngle,
  normalizeAngle,
  snapAngle,
} from './rotate-coords';

describe('rotate-coords', () => {
  describe('normalizeAngle', () => {
    it('normalizes 0, 360 and multiples to 0', () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(360)).toBe(0);
      expect(normalizeAngle(720)).toBe(0);
    });

    it('normalizes negative angles to [0, 360)', () => {
      expect(normalizeAngle(-90)).toBe(270);
      expect(normalizeAngle(-45)).toBe(315);
      expect(normalizeAngle(-360)).toBe(0);
    });

    it('preserves angles within [0, 360)', () => {
      expect(normalizeAngle(45)).toBe(45);
      expect(normalizeAngle(180)).toBe(180);
      expect(normalizeAngle(270.5)).toBe(270.5);
    });
  });

  describe('snapAngle', () => {
    it('snaps angles within threshold to cardinal and diagonal angles', () => {
      expect(snapAngle(1)).toBe(0);
      expect(snapAngle(358)).toBe(0);
      expect(snapAngle(88)).toBe(90);
      expect(snapAngle(92)).toBe(90);
      expect(snapAngle(44)).toBe(45);
      expect(snapAngle(178)).toBe(180);
      expect(snapAngle(269)).toBe(270);
    });

    it('does not snap angles outside threshold when shift is not pressed', () => {
      expect(snapAngle(10)).toBe(10);
      expect(snapAngle(60)).toBe(60);
      expect(snapAngle(120)).toBe(120);
    });

    it('snaps to 15-degree steps when shiftKey is true', () => {
      expect(snapAngle(12, { shiftKey: true })).toBe(15);
      expect(snapAngle(7, { shiftKey: true })).toBe(0);
      expect(snapAngle(22, { shiftKey: true })).toBe(15);
      expect(snapAngle(23, { shiftKey: true })).toBe(30);
      expect(snapAngle(88, { shiftKey: true })).toBe(90);
    });
  });

  describe('computeRotationAngle', () => {
    const center = { x: 100, y: 100 };

    it('returns 0 deg when cursor is straight up from center', () => {
      expect(computeRotationAngle(center.x, center.y, 100, 50)).toBe(0);
    });

    it('returns 90 deg when cursor is straight right from center', () => {
      expect(computeRotationAngle(center.x, center.y, 150, 100)).toBe(90);
    });

    it('returns 180 deg when cursor is straight down from center', () => {
      expect(computeRotationAngle(center.x, center.y, 100, 150)).toBe(180);
    });

    it('returns 270 deg when cursor is straight left from center', () => {
      expect(computeRotationAngle(center.x, center.y, 50, 100)).toBe(270);
    });

    it('returns 45 deg when cursor is top-right diagonal', () => {
      expect(computeRotationAngle(center.x, center.y, 150, 50)).toBe(45);
    });
  });
});
