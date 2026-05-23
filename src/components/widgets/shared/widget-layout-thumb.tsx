'use client';

import type { WidgetLayoutId } from '@/types/widget.types';

export function WidgetLayoutThumb({ layoutId }: { layoutId: WidgetLayoutId }) {
  const imageLeft = layoutId === 'imagen-izq-texto-der';
  const imageRight = layoutId === 'texto-izq-imagen-der';
  const overlay = layoutId === 'overlay';
  const soloTexto = layoutId === 'solo-texto';

  return (
    <div className="flex h-14 w-full items-stretch gap-0.5 bg-muted/40 p-1.5">
      {soloTexto ? (
        <div className="flex flex-1 flex-col justify-center gap-1 rounded-sm bg-background px-1.5">
          <div className="h-1.5 w-3/4 rounded bg-foreground/70" />
          <div className="h-1 w-full rounded bg-foreground/30" />
          <div className="h-1 w-5/6 rounded bg-foreground/20" />
        </div>
      ) : overlay ? (
        <div className="relative flex-1 overflow-hidden rounded-sm bg-sky-200">
          <div className="absolute inset-0 bg-sky-300/80" />
          <div className="relative z-[1] flex h-full flex-col justify-center gap-1 px-1.5">
            <div className="h-1.5 w-2/3 rounded bg-white/90" />
            <div className="h-1 w-full rounded bg-white/60" />
          </div>
        </div>
      ) : (
        <>
          {imageLeft ? (
            <div className="w-[42%] rounded-sm bg-sky-300" />
          ) : null}
          <div className="flex flex-1 flex-col justify-center gap-1 px-1">
            <div className="h-1.5 w-3/4 rounded bg-foreground/70" />
            <div className="h-1 w-full rounded bg-foreground/30" />
          </div>
          {imageRight ? (
            <div className="w-[42%] rounded-sm bg-sky-300" />
          ) : null}
        </>
      )}
    </div>
  );
}
