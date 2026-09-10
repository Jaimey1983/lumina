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

/**
 * `render-texto` carga `code-block` / `math-block` con `React.lazy`. Esos módulos
 * arrastran `lowlight` + `hast-util-to-html` + `katex` (ESM pesado): si el import
 * dinámico resuelve DESPUÉS de que el entorno de un test se destruye, vitest
 * lanza `EnvironmentTeardownError`. Stubs síncronos para el suite (la cobertura
 * real del resaltado / KaTeX se hace en el navegador, no en jsdom).
 */
vi.mock("./blocks/texto/code-block.js", () => ({
  CodeBlock: ({ code }: { code: string }) => code,
  default: ({ code }: { code: string }) => code,
}));
vi.mock("./blocks/texto/math-block.js", () => ({
  MathBlock: ({ latex }: { latex: string }) => latex,
  default: ({ latex }: { latex: string }) => latex,
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

/**
 * jsdom no implementa geometría de layout — ProseMirror (editor de texto
 * enriquecido) la consulta al medir posiciones. Stub mínimo para que los specs
 * del `<RichTextEditor>` no revienten con `getClientRects is not a function`.
 */
const zeroRect = () =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON() {
      return {};
    },
  }) as DOMRect;

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = function getClientRects() {
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} } as unknown as DOMRectList;
  };
  Range.prototype.getBoundingClientRect = zeroRect;
}
if (typeof Element !== "undefined") {
  if (!Element.prototype.getClientRects) {
    Element.prototype.getClientRects = function getClientRects() {
      return { length: 0, item: () => null, [Symbol.iterator]: function* () {} } as unknown as DOMRectList;
    };
  }
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
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
