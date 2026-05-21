'use client';

import { cn } from '@/lib/utils';

import type { FlipCardsPlantillaId } from './flip-cards-config';
import { getFlipCardsPlantilla } from './flip-cards-templates';

const PREVIEW_COLORS: Record<
  FlipCardsPlantillaId,
  { bg: string; front: string; back: string; border: string }
> = {
  clasico: { bg: '#F8FAFC', front: '#FFFFFF', back: '#2563EB', border: '#E2E8F0' },
  minimal: { bg: '#FFFFFF', front: '#FAFAFA', back: '#E2E8F0', border: '#CBD5E1' },
  contraste: { bg: '#0F172A', front: '#FFFFFF', back: '#F59E0B', border: '#334155' },
  oceano: { bg: '#ECFEFF', front: '#FFFFFF', back: '#0D9488', border: '#99F6E4' },
  atardecer: { bg: '#FFF7ED', front: '#FFFBEB', back: '#EA580C', border: '#FDBA74' },
  bosque: { bg: '#F0FDF4', front: '#FFFFFF', back: '#15803D', border: '#86EFAC' },
  'foco-imagen': { bg: '#F8FAFC', front: '#FFFFFF', back: '#1E293B', border: '#CBD5E1' },
  'solo-texto': { bg: '#FAFAFA', front: '#FFFFFF', back: '#4F46E5', border: '#E0E7FF' },
};

export function FlipCardsTemplateThumb({
  plantillaId,
  className,
}: {
  plantillaId: FlipCardsPlantillaId;
  className?: string;
}) {
  const tpl = getFlipCardsPlantilla(plantillaId);
  const colors = PREVIEW_COLORS[plantillaId];
  const cols = tpl.configuracion.columnas ?? 3;
  const cardW = cols === 2 ? 36 : cols === 4 ? 22 : 28;
  const gap = 4;
  const startX = (80 - (cardW * 3 + gap * 2)) / 2;

  return (
    <svg
      viewBox="0 0 80 48"
      className={cn('h-12 w-full', className)}
      aria-hidden
    >
      <rect x="0" y="0" width="80" height="48" fill={colors.bg} rx="4" />
      <rect x="8" y="6" width="28" height="4" fill="#94A3B8" rx="1" opacity="0.5" />
      <rect x="8" y="12" width="48" height="2" fill="#94A3B8" rx="0.5" opacity="0.35" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={startX + i * (cardW + gap)}
            y={20}
            width={cardW}
            height={22}
            fill={i === 1 ? colors.back : colors.front}
            stroke={colors.border}
            strokeWidth="0.5"
            rx="2"
          />
          {plantillaId === 'foco-imagen' ? (
            <rect
              x={startX + i * (cardW + gap) + 3}
              y={23}
              width={cardW - 6}
              height={8}
              fill={i === 1 ? '#64748B' : '#CBD5E1'}
              rx="1"
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
