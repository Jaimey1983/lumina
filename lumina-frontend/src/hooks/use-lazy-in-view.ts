'use client';

import { useEffect, useRef, useState } from 'react';

/** Monta contenido pesado solo cuando el contenedor entra (casi) en viewport. */
export function useLazyInView(options?: {
  rootMargin?: string;
  /** Si true, monta de inmediato (p. ej. slide activo). */
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(options?.enabled === true);

  useEffect(() => {
    if (options?.enabled) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: options?.rootMargin ?? '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.enabled, options?.rootMargin, visible]);

  return { ref, visible };
}
