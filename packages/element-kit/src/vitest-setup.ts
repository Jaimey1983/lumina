import { vi } from "vitest";

/**
 * `GraficoViewer` usa `next/dynamic` (Recharts). Sin este stub, importar
 * `elementRegistry` (p. ej. los specs «se registra sin puntuación») hidrata
 * el loader de Next y el suite se cuelga en jsdom.
 */
vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicStub() {
      return null;
    },
}));

/** jsdom no trae ResizeObserver / matchMedia — varios viewers de Grupo 4 los usan. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub;
}

if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = () =>
    ({
      matches: false,
      media: "",
      onchange: null,
      addListener(): void {},
      removeListener(): void {},
      addEventListener(): void {},
      removeEventListener(): void {},
      dispatchEvent(): boolean {
        return false;
      },
    }) as MediaQueryList;
}
