'use client';

import { useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildLayerList,
  type LayerReorderAction,
} from '@/lib/canvas-layers';
import type { Block } from '@/types/slide.types';

export interface LayersPanelProps {
  bloques: Block[];
  selectedBlockIds: string[];
  onSelectBlock: (blockId: string, e?: React.MouseEvent) => void;
  onLayerReorder: (blockId: string, action: LayerReorderAction) => void;
  disabled?: boolean;
}

export function LayersPanel({
  bloques,
  selectedBlockIds,
  onSelectBlock,
  onLayerReorder,
  disabled = false,
}: LayersPanelProps) {
  const layers = useMemo(() => buildLayerList(bloques), [bloques]);
  const primaryId =
    selectedBlockIds.length > 0
      ? selectedBlockIds[selectedBlockIds.length - 1]!
      : null;

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Capas
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Arriba = al frente del lienzo
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            Sin elementos en este slide
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {layers.map((layer) => {
              const isSelected = selectedBlockIds.includes(layer.blockId);
              const isPrimary = layer.blockId === primaryId;
              const Icon = layer.Icon;
              const reorderDisabled = disabled || layer.locked;

              return (
                <li key={layer.blockId}>
                  <div
                    className={cn(
                      'group flex items-center gap-1 rounded-lg border border-transparent px-1 py-0.5',
                      isSelected && 'border-[#bfdbfe] bg-[#eff6ff]',
                      !isSelected && 'hover:bg-muted/60',
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => onSelectBlock(layer.blockId, e)}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left',
                        'outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd]',
                        disabled && 'pointer-events-none opacity-50',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-3.5 shrink-0',
                          isPrimary ? 'text-[#2563EB]' : 'text-muted-foreground',
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-xs font-medium',
                            isPrimary ? 'text-[#1d4ed8]' : 'text-foreground',
                          )}
                        >
                          {layer.label}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {layer.kind}
                          {layer.zIndex !== 0 ? ` · z${layer.zIndex}` : ''}
                        </span>
                      </span>
                      {layer.locked ? (
                        <Lock
                          className="size-3 shrink-0 text-amber-600"
                          aria-label="Fijado"
                        />
                      ) : null}
                    </button>

                    <div
                      className={cn(
                        'flex shrink-0 flex-col opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
                        isSelected && 'opacity-100',
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={reorderDisabled}
                        title="Traer al frente"
                        aria-label="Traer al frente"
                        onClick={() =>
                          onLayerReorder(layer.blockId, 'traer_frente')
                        }
                      >
                        <ChevronsUp className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={reorderDisabled}
                        title="Subir un nivel"
                        aria-label="Subir un nivel"
                        onClick={() =>
                          onLayerReorder(layer.blockId, 'adelante_uno')
                        }
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={reorderDisabled}
                        title="Bajar un nivel"
                        aria-label="Bajar un nivel"
                        onClick={() =>
                          onLayerReorder(layer.blockId, 'atras_uno')
                        }
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={reorderDisabled}
                        title="Enviar atrás"
                        aria-label="Enviar atrás"
                        onClick={() =>
                          onLayerReorder(layer.blockId, 'enviar_atras_total')
                        }
                      >
                        <ChevronsDown className="size-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
