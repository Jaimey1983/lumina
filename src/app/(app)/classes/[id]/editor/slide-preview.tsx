'use client';

import { useMemo } from 'react';

import { LAYOUT_FROM_KEY } from '@/lib/class-slide-normalize';
import type { Background, Block, Layout, Slide as RendererSlide } from '@/types/slide.types';
import { SlideRenderer } from './components/slide-renderer';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const DEFAULT_FONDO: Background = { tipo: 'color', valor: '#ffffff' };

interface Props {
  content: unknown;
  /** Display width in px (canvas is scaled via CSS) */
  displayWidth?: number;
}

function contentToRendererSlide(content: unknown): RendererSlide {
  const base: RendererSlide = {
    id: 'preview',
    order: 0,
    type: 'CONTENT',
    title: '',
    bloques: [],
    fondo: DEFAULT_FONDO,
    diseno: LAYOUT_FROM_KEY.titulo_y_contenido,
    content: null,
  };

  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return base;
  }

  const c = content as Record<string, unknown>;
  const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];

  let fondo: Background = DEFAULT_FONDO;
  if (c.fondo && typeof c.fondo === 'object' && c.fondo !== null && 'tipo' in c.fondo) {
    fondo = c.fondo as Background;
  } else if (
    c.background &&
    typeof c.background === 'object' &&
    c.background !== null &&
    'value' in c.background
  ) {
    fondo = { tipo: 'color', valor: String((c.background as { value?: string }).value ?? '#ffffff') };
  }

  let diseno: Layout = LAYOUT_FROM_KEY.titulo_y_contenido;
  if (c.diseno && typeof c.diseno === 'object' && !Array.isArray(c.diseno)) {
    diseno = c.diseno as Layout;
  } else if (typeof c.layout === 'string' && c.layout in LAYOUT_FROM_KEY) {
    diseno = LAYOUT_FROM_KEY[c.layout]!;
  }

  if (bloques.length === 0 && c.fabricJSON) {
    return {
      ...base,
      fondo,
      diseno,
      bloques: [
        {
          tipo: 'texto',
          contenido:
            'Vista previa: este slide guarda formato antiguo. Ábrelo en el editor de clase para editarlo con bloques.',
          color: '#92400e',
          tamanoFuente: '1rem',
        },
      ],
    };
  }

  return { ...base, bloques, fondo, diseno };
}

export default function SlidePreviewCanvas({ content, displayWidth = 960 }: Props) {
  const slide = useMemo(() => contentToRendererSlide(content), [content]);
  const scale = displayWidth / CANVAS_W;
  const displayHeight = CANVAS_H * scale;

  return (
    <div style={{ width: displayWidth, height: displayHeight, position: 'relative', flexShrink: 0 }}>
      <div
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-sm border border-border bg-card shadow-sm">
          <SlideRenderer slide={slide} modo="viewer" className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    </div>
  );
}
