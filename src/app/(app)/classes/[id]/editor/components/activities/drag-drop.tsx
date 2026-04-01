'use client';

import { useState } from 'react';
import { CheckCircle, GripVertical, XCircle } from 'lucide-react';

import type { DragDrop } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: DragDrop;
  modo: 'editor' | 'viewer';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: DragDrop }) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Arrastrar y soltar
        </span>
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm">{actividad.instruccion}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Items column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Elementos
          </p>
          <div className="space-y-1.5">
            {actividad.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs"
              >
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" />
                {item.texto}
              </div>
            ))}
          </div>
        </div>

        {/* Zones column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zonas
          </p>
          <div className="space-y-2">
            {actividad.zonas.map((zone) => (
              <div key={zone.id} className="rounded-md border border-dashed border-border p-2.5">
                <p className="mb-1.5 text-xs font-medium">{zone.etiqueta}</p>
                {zone.itemsCorrectos.map((itemId) => {
                  const item = actividad.items.find((i) => i.id === itemId);
                  return item ? (
                    <div
                      key={itemId}
                      className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400"
                    >
                      <CheckCircle className="size-3 shrink-0" />
                      {item.texto}
                    </div>
                  ) : null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function ViewerView({ actividad }: { actividad: DragDrop }) {
  // placements: itemId → zoneId | null (null = unplaced)
  const [placements, setPlacements] = useState<Record<string, string | null>>(
    () => Object.fromEntries(actividad.items.map((i) => [i.id, null])),
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const unplaced = actividad.items.filter((i) => placements[i.id] === null);

  function itemsInZone(zoneId: string) {
    return actividad.items.filter((i) => placements[i.id] === zoneId);
  }

  function onDragStart(e: React.DragEvent, itemId: string) {
    e.dataTransfer.setData('itemId', itemId);
    setDragging(itemId);
  }
  function onDragEnd() { setDragging(null); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }

  function onDropToZone(e: React.DragEvent, zoneId: string) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId || submitted) return;
    const zone = actividad.zonas.find((z) => z.id === zoneId);
    if (zone?.capacidadMaxima !== undefined && itemsInZone(zoneId).length >= zone.capacidadMaxima) {
      return;
    }
    setPlacements((p) => ({ ...p, [itemId]: zoneId }));
    setDragging(null);
  }

  function onDropToUnplaced(e: React.DragEvent) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId || submitted) return;
    setPlacements((p) => ({ ...p, [itemId]: null }));
    setDragging(null);
  }

  function handleSubmit() {
    const correct = actividad.zonas.every((zone) => {
      const placed = actividad.items
        .filter((i) => placements[i.id] === zone.id)
        .map((i) => i.id);
      return (
        placed.length === zone.itemsCorrectos.length &&
        placed.every((id) => zone.itemsCorrectos.includes(id))
      );
    });
    setIsCorrect(correct);
    setSubmitted(true);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <p className="text-sm font-medium">{actividad.instruccion}</p>

      {/* Unplaced items pool */}
      <div
        onDragOver={onDragOver}
        onDrop={onDropToUnplaced}
        className={cn(
          'min-h-12 rounded-md border-2 border-dashed p-3 transition-colors',
          dragging && !submitted ? 'border-primary/50 bg-primary/5' : 'border-border',
        )}
      >
        <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          Elementos disponibles
        </p>
        <div className="flex flex-wrap gap-1.5">
          {unplaced.map((item) => (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={(e) => onDragStart(e, item.id)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex cursor-grab items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium select-none active:cursor-grabbing',
                dragging === item.id && 'opacity-40',
              )}
            >
              <GripVertical className="size-3 text-muted-foreground" />
              {item.texto}
            </div>
          ))}
          {unplaced.length === 0 && (
            <p className="text-xs text-muted-foreground/50">
              Todos los elementos están ubicados
            </p>
          )}
        </div>
      </div>

      {/* Drop zones */}
      <div className="grid grid-cols-2 gap-3">
        {actividad.zonas.map((zone) => {
          const placed = itemsInZone(zone.id);
          const zoneCorrect =
            submitted &&
            placed.length === zone.itemsCorrectos.length &&
            placed.every((i) => zone.itemsCorrectos.includes(i.id));
          const zoneWrong = submitted && !zoneCorrect;

          return (
            <div
              key={zone.id}
              onDragOver={onDragOver}
              onDrop={(e) => onDropToZone(e, zone.id)}
              className={cn(
                'rounded-md border-2 border-dashed p-3 transition-colors',
                !submitted && dragging  && 'border-primary/40 bg-primary/5',
                !submitted && !dragging && 'border-border',
                zoneCorrect && 'border-green-400 bg-green-50 dark:bg-green-950/20',
                zoneWrong   && 'border-red-400 bg-red-50 dark:bg-red-950/20',
              )}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <p className="text-xs font-medium">{zone.etiqueta}</p>
                {zoneCorrect && <CheckCircle className="size-3.5 text-green-600" />}
                {zoneWrong   && <XCircle className="size-3.5 text-red-500" />}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-6">
                {placed.map((item) => (
                  <div
                    key={item.id}
                    draggable={!submitted}
                    onDragStart={(e) => onDragStart(e, item.id)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'flex cursor-grab items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium select-none active:cursor-grabbing',
                      submitted ? 'bg-white/80 dark:bg-white/10' : 'bg-background shadow-sm',
                      dragging === item.id && 'opacity-40',
                    )}
                  >
                    <GripVertical className="size-3 text-muted-foreground" />
                    {item.texto}
                  </div>
                ))}
                {placed.length === 0 && (
                  <span className="text-xs text-muted-foreground/40">Suelta aquí</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={unplaced.length > 0}
        >
          Comprobar
        </Button>
      ) : (
        <div
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            isCorrect
              ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
          )}
        >
          {isCorrect
            ? (actividad.retroalimentacion?.correcto ?? '¡Excelente! Todos los elementos están bien ubicados.')
            : (actividad.retroalimentacion?.incorrecto ?? 'Hay errores en la distribución. Revisa las zonas marcadas en rojo.')}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DragDropActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}
