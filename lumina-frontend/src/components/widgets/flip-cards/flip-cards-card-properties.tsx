'use client';

import type { Block, FlipCard, FlipCardsWidget } from '@/types/slide.types';
import { Checkbox } from '@/components/ui/checkbox';

import type { FlipCardsCaraLado, FlipCardsInnerSelection } from './flip-cards-config';
import { resolveCaraVisibilidad } from './flip-cards-card-utils';
import { mergedFlipCardsConfig } from './flip-cards-shared';
import { WidgetSectionTitle } from '@/components/widgets/shared/widget-properties-panel';

function patchCardFace(
  block: FlipCardsWidget,
  cardId: string,
  face: FlipCardsCaraLado,
  patch: Partial<FlipCard['frente']>,
): FlipCardsWidget {
  return {
    ...block,
    tarjetas: block.tarjetas.map((c) => {
      if (c.id !== cardId) return c;
      if (face === 'frente') {
        return { ...c, frente: { ...c.frente, ...patch } };
      }
      return { ...c, reverso: { ...c.reverso, ...patch } };
    }),
  };
}

export interface FlipCardsCardPropertiesProps {
  block: FlipCardsWidget;
  selection: FlipCardsInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function FlipCardsCardProperties({
  block,
  selection,
  applyNow,
}: FlipCardsCardPropertiesProps) {
  const cardId =
    selection.kind === 'card' ||
    selection.kind === 'card-text' ||
    selection.kind === 'card-image'
      ? selection.cardId
      : null;

  const face: FlipCardsCaraLado | null =
    selection.kind === 'card-text' || selection.kind === 'card-image'
      ? selection.face
      : selection.kind === 'card'
        ? selection.face
        : null;

  if (!cardId || !face) return null;

  const configuracion = mergedFlipCardsConfig(block);
  const cardIndex = block.tarjetas.findIndex((c) => c.id === cardId);
  const card = cardIndex >= 0 ? block.tarjetas[cardIndex] : null;
  if (!card) return null;

  const cara = face === 'frente' ? card.frente : card.reverso;
  const vis = resolveCaraVisibilidad(configuracion, face, cara);

  const update = (patch: Partial<FlipCard['frente']>) => {
    void applyNow((b) => {
      if (b.tipo !== 'flip-cards') return b;
      return patchCardFace(b, cardId, face, patch);
    });
  };

  return (
    <div className="space-y-3">
      <WidgetSectionTitle>
        Tarjeta {cardIndex + 1} — {face === 'frente' ? 'Frente' : 'Atrás'}
      </WidgetSectionTitle>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Los cambios aquí afectan solo a esta tarjeta. Las demás mantienen su configuración.
      </p>
      {(
        [
          ['mostrarImagen', 'Imagen'],
          ['mostrarTitulo', 'Título'],
          ['mostrarCuerpo', 'Cuerpo'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={vis[key]}
            onCheckedChange={(checked) => update({ [key]: checked === true })}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
