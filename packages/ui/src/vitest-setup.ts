import '@testing-library/jest-dom/vitest';

/** jsdom no trae ResizeObserver; Radix (Popover, Popper) lo usa para medir. Doble inerte: no mide ni avisa. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub;
}
