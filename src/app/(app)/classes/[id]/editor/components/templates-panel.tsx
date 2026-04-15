'use client';

import type { FC } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Block, TextAlign } from '@/types/slide.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TemplateSlideKind = 'blank' | 'title_content' | 'two_columns';

/** Cuatro layouts principales (panel Layout y menú + de slides). */
export const CORE_SLIDE_LAYOUTS = [
  { key: 'en_blanco', label: 'En blanco' },
  { key: 'titulo_centrado', label: 'Título centrado' },
  { key: 'titulo_y_contenido', label: 'Título + contenido' },
  { key: 'dos_columnas', label: 'Dos columnas' },
] as const;

export type CoreSlideLayoutKey = (typeof CORE_SLIDE_LAYOUTS)[number]['key'];

/** Los layouts persistidos (panel Layout + títulos al insertar). */
export const SLIDE_LAYOUT_ORDER = [
  { key: 'en_blanco', label: 'En blanco' },
  { key: 'titulo_centrado', label: 'Título centrado' },
  { key: 'titulo_centrado_subtitulo', label: 'Título centrado + subtítulo' },
  { key: 'titulo_y_contenido', label: 'Título + contenido' },
  { key: 'titulo_texto_imagen', label: 'Título + texto + imagen' },
  { key: 'dos_columnas', label: 'Dos columnas' },
  { key: 'imagen_derecha', label: 'Imagen a la derecha' },
  { key: 'imagen_izquierda', label: 'Imagen a la izquierda' },
  { key: 'tres_columnas', label: 'Tres columnas' },
  { key: 'pantalla_completa', label: 'Pantalla completa' },
] as const;

export type SlidePersistedLayoutKey = (typeof SLIDE_LAYOUT_ORDER)[number]['key'];

export interface TemplatesPanelProps {
  onInsert: (kind: TemplateSlideKind, withExampleContent: boolean) => void;
  isInserting?: boolean;
}

const THUMB_STROKE = '#ccc';
const THUMB_DASH = '4 2';
const THUMB_TEXT = '#999';

// ─── Thumbnails (SVG, 16:9 — estilo layout PowerPoint) ───────────────────────

function ThumbBlank({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect
        x="4"
        y="4"
        width="152"
        height="82"
        fill="#fff"
        stroke={THUMB_STROKE}
        strokeWidth="1"
        strokeDasharray={THUMB_DASH}
      />
    </svg>
  );
}

function ThumbTitleContent({ className }: { className?: string }) {
  const padX = 160 * 0.05;
  const padY = 90 * 0.05;
  const innerW = 160 - padX * 2;
  const hTitle = 90 * 0.3;
  const gap = 90 * 0.05;
  const hContent = 90 * 0.6;
  const yTitle = padY;
  const yContent = padY + hTitle + gap;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0" y="0" width="160" height="90" fill="#fff" />
      <rect
        x={padX}
        y={yTitle}
        width={innerW}
        height={hTitle}
        fill="#fff"
        stroke={THUMB_STROKE}
        strokeWidth="1"
        strokeDasharray={THUMB_DASH}
      />
      <text
        x={padX + innerW / 2}
        y={yTitle + hTitle / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={THUMB_TEXT}
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Título
      </text>
      <rect
        x={padX}
        y={yContent}
        width={innerW}
        height={hContent}
        fill="#fff"
        stroke={THUMB_STROKE}
        strokeWidth="1"
        strokeDasharray={THUMB_DASH}
      />
      <text
        x={padX + innerW / 2}
        y={yContent + hContent / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={THUMB_TEXT}
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Contenido
      </text>
    </svg>
  );
}

function ThumbTwoColumns({ className }: { className?: string }) {
  const padX = 160 * 0.05;
  const innerW = 160 - padX * 2;
  const wEach = innerW * 0.47;
  const gap = innerW - 2 * wEach;
  const x1 = padX;
  const x2 = padX + wEach + gap;
  const hCol = 90 * 0.8;
  const yCol = (90 - hCol) / 2;
  return (
    <svg viewBox="0 0 160 90" className={cn('shrink-0', className)} aria-hidden>
      <rect x="0" y="0" width="160" height="90" fill="#fff" />
      <rect
        x={x1}
        y={yCol}
        width={wEach}
        height={hCol}
        fill="#fff"
        stroke={THUMB_STROKE}
        strokeWidth="1"
        strokeDasharray={THUMB_DASH}
      />
      <text
        x={x1 + wEach / 2}
        y={yCol + hCol / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={THUMB_TEXT}
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Col 1
      </text>
      <rect
        x={x2}
        y={yCol}
        width={wEach}
        height={hCol}
        fill="#fff"
        stroke={THUMB_STROKE}
        strokeWidth="1"
        strokeDasharray={THUMB_DASH}
      />
      <text
        x={x2 + wEach / 2}
        y={yCol + hCol / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={THUMB_TEXT}
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Col 2
      </text>
    </svg>
  );
}

const THUMBS: Record<TemplateSlideKind, FC<{ className?: string }>> = {
  blank: ThumbBlank,
  title_content: ThumbTitleContent,
  two_columns: ThumbTwoColumns,
};

// ─── Row ──────────────────────────────────────────────────────────────────────

interface TemplateRowProps {
  kind: TemplateSlideKind;
  name: string;
  withExampleContent: boolean;
  onInsert: (kind: TemplateSlideKind, withExampleContent: boolean) => void;
  disabled?: boolean;
}

function TemplateRow({ kind, name, withExampleContent, onInsert, disabled }: TemplateRowProps) {
  const Thumb = THUMBS[kind];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-white p-2 shadow-sm">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-[#fff8f3] p-1">
        <Thumb className="h-9 w-16" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={() => onInsert(kind, withExampleContent)}
        className="h-8 shrink-0 bg-[#F97316] px-2.5 text-xs font-medium text-white hover:bg-[#ea580c]"
      >
        Insertar
      </Button>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const LAYOUT_ITEMS: { kind: TemplateSlideKind; name: string }[] = [
  { kind: 'blank', name: 'En blanco' },
  { kind: 'title_content', name: 'Título + contenido' },
  { kind: 'two_columns', name: 'Dos columnas' },
];

function buildTemplateTextBlock(
  contenido: string,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  tamanoPx: number,
  alineacion: TextAlign = 'izquierda',
): Block {
  return {
    tipo: 'texto',
    contenido,
    x,
    y,
    ancho,
    alto,
    tamanoFuente: `${tamanoPx}px`,
    color: '#1a1a1a',
    alineacion,
    negrita: false,
    cursiva: false,
  };
}

const PLACEHOLDER_IMG =
  'https://placehold.co/480x360/e5e7eb/94a3b8/png?text=Imagen';

/** Bloques iniciales al crear o aplicar un layout por clave persistida. */
export function buildInsertSlideBloques(
  layoutKey: SlidePersistedLayoutKey,
  withExample: boolean,
): Block[] {
  switch (layoutKey) {
    case 'en_blanco':
      return [];
    case 'titulo_y_contenido':
      return buildTemplateBloques('title_content', withExample);
    case 'dos_columnas':
      return buildTemplateBloques('two_columns', withExample);
    case 'titulo_centrado':
      return [
        buildTemplateTextBlock(
          withExample ? 'Título centrado' : '',
          5,
          32,
          90,
          22,
          36,
          'centro',
        ),
      ];
    case 'titulo_centrado_subtitulo':
      return [
        buildTemplateTextBlock(
          withExample ? 'Título centrado' : '',
          10,
          20,
          80,
          22,
          36,
          'centro',
        ),
        buildTemplateTextBlock(
          withExample ? 'Subtítulo' : '',
          15,
          48,
          70,
          15,
          22,
          'centro',
        ),
      ];
    case 'titulo_texto_imagen':
      return [
        buildTemplateTextBlock(withExample ? 'Título' : '', 5, 3, 90, 15, 28),
        buildTemplateTextBlock(
          withExample ? 'Texto junto a la imagen.' : '',
          5,
          20,
          45,
          72,
          18,
        ),
        {
          tipo: 'imagen',
          url: PLACEHOLDER_IMG,
          x: 52,
          y: 20,
          ancho: 43,
          alto: 72,
          ajuste: 'contener',
        } as Block,
      ];
    case 'imagen_derecha':
      return [
        buildTemplateTextBlock(withExample ? 'Título' : '', 5, 10, 48, 14, 28),
        buildTemplateTextBlock(
          withExample ? 'Texto junto a la imagen.' : '',
          5,
          26,
          48,
          64,
          16,
        ),
        {
          tipo: 'imagen',
          url: PLACEHOLDER_IMG,
          x: 55,
          y: 10,
          ancho: 40,
          alto: 80,
          ajuste: 'contener',
        } as Block,
      ];
    case 'imagen_izquierda':
      return [
        {
          tipo: 'imagen',
          url: PLACEHOLDER_IMG,
          x: 5,
          y: 10,
          ancho: 40,
          alto: 80,
          ajuste: 'contener',
        } as Block,
        buildTemplateTextBlock(withExample ? 'Título' : '', 47, 10, 48, 14, 28),
        buildTemplateTextBlock(
          withExample ? 'Texto junto a la imagen.' : '',
          47,
          26,
          48,
          64,
          16,
        ),
      ];
    case 'tres_columnas':
      return [
        buildTemplateTextBlock(withExample ? 'Columna 1' : '', 5, 5, 28, 88, 18),
        buildTemplateTextBlock(withExample ? 'Columna 2' : '', 35, 5, 28, 88, 18),
        buildTemplateTextBlock(withExample ? 'Columna 3' : '', 67, 5, 28, 88, 18),
      ];
    case 'pantalla_completa':
      return [
        buildTemplateTextBlock(
          withExample ? 'Texto a pantalla completa' : '',
          8,
          38,
          84,
          22,
          28,
          'centro',
        ),
      ];
  }
}

export function buildTemplateBloques(kind: TemplateSlideKind, withExample: boolean): Block[] {
  if (kind === 'blank') return [];
  if (kind === 'title_content') {
    return [
      buildTemplateTextBlock(
        withExample ? 'Título de la diapositiva' : '',
        5,
        3,
        90,
        15,
        32,
      ),
      buildTemplateTextBlock(
        withExample ? 'Escribe aquí tu contenido...' : '',
        5,
        20,
        90,
        72,
        18,
      ),
    ];
  }
  return [
    buildTemplateTextBlock(withExample ? 'Concepto' : '', 5, 5, 44, 88, 24),
    buildTemplateTextBlock(withExample ? 'Descripción' : '', 51, 5, 44, 88, 24),
  ];
}

export function TemplatesPanel({ onInsert, isInserting }: TemplatesPanelProps) {
  return (
    <div className="flex flex-col gap-4 bg-[#fff8f3]/50 p-3">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Inserta un slide nuevo después del activo con un layout listo o con texto de ejemplo.
      </p>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Layouts predefinidos
        </h3>
        <div className="flex flex-col gap-2">
          {LAYOUT_ITEMS.map(({ kind, name }) => (
            <TemplateRow
              key={`a-${kind}`}
              kind={kind}
              name={name}
              withExampleContent={false}
              onInsert={onInsert}
              disabled={isInserting}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Con contenido de ejemplo
        </h3>
        <div className="flex flex-col gap-2">
          {LAYOUT_ITEMS.map(({ kind, name }) => (
            <TemplateRow
              key={`b-${kind}`}
              kind={kind}
              name={name}
              withExampleContent
              onInsert={onInsert}
              disabled={isInserting}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
