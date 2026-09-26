'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from 'react';

export interface WidgetImageDims {
  w: number;
  h: number;
}

const LAYOUT_SETTLE_DELAYS_MS = [0, 100, 300] as const;
const OBSERVE_ANCESTOR_DEPTH = 5;

export function readContainerDims(
  el: HTMLElement | null,
  fallback: WidgetImageDims = { w: 0, h: 0 },
): WidgetImageDims {
  if (!el) return fallback;

  let width = el.offsetWidth;
  let height = el.offsetHeight;

  const row = el.parentElement;
  if (row && row.offsetHeight > height) {
    height = row.offsetHeight;
  }
  if (row && row.offsetWidth > 0 && width > 0 && width < row.offsetWidth * 0.2) {
    width = el.getBoundingClientRect().width;
  }

  if (width > 0 && height > 0) {
    return { w: width, h: height };
  }

  return fallback;
}

export function useWidgetImageDimensions(imageSrc?: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState<WidgetImageDims>({ w: 0, h: 0 });
  const [containerDims, setContainerDims] = useState<WidgetImageDims>({ w: 0, h: 0 });

  const measureContainer = useCallback(() => {
    const next = readContainerDims(containerRef.current);
    if (next.w <= 0 || next.h <= 0) return;
    setContainerDims((prev) =>
      prev.w === next.w && prev.h === next.h ? prev : next,
    );
  }, []);

  const getEffectiveContainerDims = useCallback((): WidgetImageDims => {
    return readContainerDims(containerRef.current, containerDims);
  }, [containerDims]);

  const syncImageDims = useCallback((img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  useEffect(() => {
    setImgDims({ w: 0, h: 0 });
  }, [imageSrc]);

  useLayoutEffect(() => {
    measureContainer();
  }, [measureContainer, imageSrc, imgDims.w, imgDims.h]);

  useLayoutEffect(() => {
    const observed = new Set<Element>();
    const ro = new ResizeObserver(() => measureContainer());

    const observeElement = (node: Element | null | undefined) => {
      if (!node || observed.has(node)) return;
      ro.observe(node);
      observed.add(node);
    };

    const observeChain = (start: HTMLElement | null) => {
      let node: HTMLElement | null = start;
      for (let depth = 0; node && depth < OBSERVE_ANCESTOR_DEPTH; depth += 1) {
        observeElement(node);
        node = node.parentElement;
      }
    };

    measureContainer();

    const timeouts = LAYOUT_SETTLE_DELAYS_MS.map((delay) =>
      window.setTimeout(measureContainer, delay),
    );

    const container = containerRef.current;
    if (container) {
      observeChain(container);
      observeElement(container.closest('[data-widget-slide-panel]'));
    }

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
    };
  }, [measureContainer, imageSrc]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) syncImageDims(img);
  }, [imageSrc, syncImageDims]);

  const handleImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      syncImageDims(e.currentTarget);
      measureContainer();
    },
    [measureContainer, syncImageDims],
  );

  return {
    containerRef,
    imgRef,
    imgDims,
    containerDims,
    getEffectiveContainerDims,
    handleImageLoad,
    measureContainer,
  };
}

/** Lee dimensiones del contenedor en caliente (p. ej. durante pan). */
export function readContainerDimsFromRef(
  containerRef: RefObject<HTMLElement | null>,
  fallback: WidgetImageDims,
): WidgetImageDims {
  return readContainerDims(containerRef.current, fallback);
}
