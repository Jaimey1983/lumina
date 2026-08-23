'use client';

import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';
import type { SlidePersistedLayoutKey } from './templates-panel';

const DASH = '4 2';

/** Convierte rectángulo en % del lienzo (0–100) a coords del viewBox 160×90. */
function pctRect(x: number, y: number, w: number, h: number) {
  return { x: (160 * x) / 100, y: (90 * y) / 100, w: (160 * w) / 100, h: (90 * h) / 100 };
}

function ThumbEnBlanco({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x="8"
        y="8"
        width="144"
        height="74"
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
    </svg>
  );
}

function ThumbTituloCentrado({ className }: { className?: string }) {
  const padX = 160 * 0.08;
  const innerW = 160 - padX * 2;
  const h = 90 * 0.35;
  const y = (90 - h) / 2;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={padX}
        y={y}
        width={innerW}
        height={h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={80}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Haga clic para agregar título
      </text>
    </svg>
  );
}

/** Alineado a buildInsertSlideBloques: título 5,3,90,15 · texto 5,20,45,72 · imagen 52,20,43,72. */
function ThumbTituloTextoImagen({ className }: { className?: string }) {
  const title = pctRect(5, 3, 90, 15);
  const text = pctRect(5, 20, 45, 72);
  const img = pctRect(52, 20, 43, 72);
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={title.x}
        y={title.y}
        width={title.w}
        height={title.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={title.x + title.w / 2}
        y={title.y + title.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Título
      </text>
      <rect
        x={text.x}
        y={text.y}
        width={text.w}
        height={text.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={text.x + text.w / 2}
        y={text.y + text.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Texto
      </text>
      <rect
        x={img.x}
        y={img.y}
        width={img.w}
        height={img.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={img.x + img.w / 2}
        y={img.y + img.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Imagen
      </text>
    </svg>
  );
}

/** Título centrado 80% × 22%; subtítulo centrado 70% × 15%. */
function ThumbTituloCentradoSubtitulo({ className }: { className?: string }) {
  const wTitle = 160 * 0.8;
  const xTitle = (160 - wTitle) / 2;
  const hTitle = 90 * 0.22;
  const yTitle = 10;
  const wSub = 160 * 0.7;
  const xSub = (160 - wSub) / 2;
  const hSub = 90 * 0.15;
  const ySub = yTitle + hTitle + 5;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={xTitle}
        y={yTitle}
        width={wTitle}
        height={hTitle}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={80}
        y={yTitle + hTitle / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Título
      </text>
      <rect
        x={xSub}
        y={ySub}
        width={wSub}
        height={hSub}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={80}
        y={ySub + hSub / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Subtítulo
      </text>
    </svg>
  );
}

function ThumbTituloContenido({ className }: { className?: string }) {
  const padX = 160 * 0.05;
  const padY = 90 * 0.05;
  const innerW = 160 - padX * 2;
  const hTitle = 90 * 0.28;
  const gap = 90 * 0.06;
  const hContent = 90 - padY * 2 - hTitle - gap;
  const yTitle = padY;
  const yContent = padY + hTitle + gap;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={padX}
        y={yTitle}
        width={innerW}
        height={hTitle}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={padX + innerW / 2}
        y={yTitle + hTitle / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Haga clic para agregar título
      </text>
      <rect
        x={padX}
        y={yContent}
        width={innerW}
        height={hContent}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={padX + innerW / 2}
        y={yContent + hContent / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Haga clic para agregar texto
      </text>
    </svg>
  );
}

function ThumbDosColumnas({ className }: { className?: string }) {
  const left = pctRect(5, 5, 44, 88);
  const right = pctRect(51, 5, 44, 88);
  const midY = (y: number, h: number) => y + h / 2;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={left.x}
        y={left.y}
        width={left.w}
        height={left.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={left.x + left.w / 2}
        y={midY(left.y, left.h)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Columna 1
      </text>
      <rect
        x={right.x}
        y={right.y}
        width={right.w}
        height={right.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={right.x + right.w / 2}
        y={midY(right.y, right.h)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Columna 2
      </text>
    </svg>
  );
}

/** Texto 5,10,48×80 (título + cuerpo) · imagen 55,10,40×80. */
function ThumbImagenDerecha({ className }: { className?: string }) {
  const title = pctRect(5, 10, 48, 14);
  const body = pctRect(5, 26, 48, 64);
  const img = pctRect(55, 10, 40, 80);
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={title.x}
        y={title.y}
        width={title.w}
        height={title.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <rect
        x={body.x}
        y={body.y}
        width={body.w}
        height={body.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={title.x + title.w / 2}
        y={title.y + title.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="6"
        fontFamily="system-ui, sans-serif"
      >
        Título
      </text>
      <text
        x={body.x + body.w / 2}
        y={body.y + body.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Texto
      </text>
      <rect
        x={img.x}
        y={img.y}
        width={img.w}
        height={img.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={img.x + img.w / 2}
        y={img.y + img.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Imagen
      </text>
    </svg>
  );
}

/** Imagen 5,10,40×80 · texto 47,10,48×80 (título + cuerpo). */
function ThumbImagenIzquierda({ className }: { className?: string }) {
  const img = pctRect(5, 10, 40, 80);
  const title = pctRect(47, 10, 48, 14);
  const body = pctRect(47, 26, 48, 64);
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={img.x}
        y={img.y}
        width={img.w}
        height={img.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={img.x + img.w / 2}
        y={img.y + img.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Imagen
      </text>
      <rect
        x={title.x}
        y={title.y}
        width={title.w}
        height={title.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <rect
        x={body.x}
        y={body.y}
        width={body.w}
        height={body.h}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={title.x + title.w / 2}
        y={title.y + title.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="6"
        fontFamily="system-ui, sans-serif"
      >
        Título
      </text>
      <text
        x={body.x + body.w / 2}
        y={body.y + body.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Texto
      </text>
    </svg>
  );
}

function ThumbTresColumnas({ className }: { className?: string }) {
  const cols = [pctRect(5, 5, 28, 88), pctRect(35, 5, 28, 88), pctRect(67, 5, 28, 88)];
  const labels = ['1', '2', '3'];
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      {cols.map((r, i) => (
        <g key={i}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="#fff"
            stroke="#aaa"
            strokeWidth="1"
            strokeDasharray={DASH}
          />
          <text
            x={r.x + r.w / 2}
            y={r.y + r.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#bbb"
            fontSize="7"
            fontFamily="system-ui, sans-serif"
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ThumbPantallaCompleta({ className }: { className?: string }) {
  const pad = 8;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0.5" y="0.5" width="159" height="89" fill="#fff" stroke="#ddd" strokeWidth="1" />
      <rect
        x={pad}
        y={pad}
        width={160 - pad * 2}
        height={90 - pad * 2}
        fill="#fff"
        stroke="#aaa"
        strokeWidth="1"
        strokeDasharray={DASH}
      />
      <text
        x={80}
        y={45}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#bbb"
        fontSize="7"
        fontFamily="system-ui, sans-serif"
      >
        Haga clic para agregar texto
      </text>
    </svg>
  );
}

const THUMB_BY_KEY: Record<SlidePersistedLayoutKey, ComponentType<{ className?: string }>> = {
  en_blanco: ThumbEnBlanco,
  titulo_centrado: ThumbTituloCentrado,
  titulo_centrado_subtitulo: ThumbTituloCentradoSubtitulo,
  titulo_y_contenido: ThumbTituloContenido,
  titulo_texto_imagen: ThumbTituloTextoImagen,
  dos_columnas: ThumbDosColumnas,
  imagen_derecha: ThumbImagenDerecha,
  imagen_izquierda: ThumbImagenIzquierda,
  tres_columnas: ThumbTresColumnas,
  pantalla_completa: ThumbPantallaCompleta,
};

export function LayoutThumbnail({
  layoutKey,
  compact,
  className,
}: {
  layoutKey: SlidePersistedLayoutKey;
  compact?: boolean;
  className?: string;
}) {
  const Cmp = THUMB_BY_KEY[layoutKey];
  return <Cmp className={cn(compact ? 'h-8 w-14' : 'h-9 w-16', className)} />;
}
