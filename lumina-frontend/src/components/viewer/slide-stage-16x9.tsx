'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { contain16x9 } from '@/lib/contain-16x9';
import { cn } from '@/lib/utils';

type SlideStage16x9Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  innerStyle?: CSSProperties;
};

/**
 * Superficie de diapositiva 16:9 contenida en px medidos del padre.
 * El fondo del slide va en `innerStyle`, no en el host (el letterbox
 * queda del color del chrome, no del papel).
 */
export function SlideStage16x9({
  children,
  className,
  innerClassName,
  innerStyle,
}: SlideStage16x9Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      setSize(contain16x9(el.clientWidth, el.clientHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn(
        'grid h-full min-h-0 min-w-0 w-full place-items-center overflow-hidden',
        className,
      )}
    >
      <div
        className={cn('relative overflow-hidden', innerClassName)}
        style={{
          ...innerStyle,
          width: size.width,
          height: size.height,
        }}
      >
        {size.width > 0 && size.height > 0 ? children : null}
      </div>
    </div>
  );
}
