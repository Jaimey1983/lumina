'use client';

import { useState } from 'react';
import { CheckCircle, GripVertical, Plus, Trash2, XCircle } from 'lucide-react';

import type { DragDrop, DragDropItem, DragDropZone } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

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

// ─── Activity Editor ──────────────────────────────────────────────────────────

const DEFAULTS: DragDrop = {
  tipo: 'arrastrar_soltar',
  instruccion: '',
  items: [],
  zonas: [],
};

function normalize(a: DragDrop | null | undefined): DragDrop {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'arrastrar_soltar' };
}

interface EditorProps {
  editorSyncKey: string;
  activity: DragDrop | null;
  onChange: (a: DragDrop) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

export function DragDropActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: EditorProps) {
  const { local, setLocal, flush, commitImmediate, schedulePersist } = useActivityEditor<DragDrop>({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });

  function updateImmediate(partial: Partial<DragDrop>) {
    commitImmediate({ ...local, ...partial, tipo: 'arrastrar_soltar' });
  }

  function updateText(partial: Partial<DragDrop>) {
    const next = { ...local, ...partial, tipo: 'arrastrar_soltar' as const };
    setLocal(next);
    schedulePersist(next);
  }

  // --- Elementos ---
  function addItem() {
    const nextItem: DragDropItem = { id: crypto.randomUUID(), texto: '' };
    updateImmediate({ items: [...local.items, nextItem] });
  }

  function updateItemText(id: string, texto: string) {
    const nextItems = local.items.map((i) => (i.id === id ? { ...i, texto } : i));
    setLocal({ ...local, items: nextItems, tipo: 'arrastrar_soltar' });
    schedulePersist({ ...local, items: nextItems, tipo: 'arrastrar_soltar' });
  }

  function removeItem(id: string) {
    const nextItems = local.items.filter((i) => i.id !== id);
    // Removerlo también de las zonas
    const nextZonas = local.zonas.map((z) => ({
      ...z,
      itemsCorrectos: z.itemsCorrectos.filter((iId) => iId !== id),
    }));
    updateImmediate({ items: nextItems, zonas: nextZonas });
  }

  function changeItemZone(itemId: string, zoneId: string | 'none') {
    const nextZonas = local.zonas.map((z) => {
      // sacarlo de todas partes primero
      const itemsCorrectos = z.itemsCorrectos.filter((id) => id !== itemId);
      // agregarlo si es la zona seleccionada
      if (z.id === zoneId) {
        itemsCorrectos.push(itemId);
      }
      return { ...z, itemsCorrectos };
    });
    updateImmediate({ zonas: nextZonas });
  }

  function getItemZoneId(itemId: string) {
    const zone = local.zonas.find((z) => z.itemsCorrectos.includes(itemId));
    return zone ? zone.id : 'none';
  }

  // --- Zonas ---
  function addZone() {
    const nextZone: DragDropZone = { id: crypto.randomUUID(), etiqueta: '', itemsCorrectos: [] };
    updateImmediate({ zonas: [...local.zonas, nextZone] });
  }

  function updateZoneLabel(id: string, etiqueta: string) {
    const nextZonas = local.zonas.map((z) => (z.id === id ? { ...z, etiqueta } : z));
    setLocal({ ...local, zonas: nextZonas, tipo: 'arrastrar_soltar' });
    schedulePersist({ ...local, zonas: nextZonas, tipo: 'arrastrar_soltar' });
  }

  function removeZone(id: string) {
    const nextZonas = local.zonas.filter((z) => z.id !== id);
    updateImmediate({ zonas: nextZonas });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(60vh,400px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Arrastrar y soltar
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios se guardan automáticamente
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">Instrucción</Label>
          <Input
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Ej: Arrastra cada animal a su hábitat..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Elementos</Label>
            <div className="space-y-1.5">
              {local.items.map((item, idx) => (
                <div key={item.id} className="flex gap-1.5">
                  <Input
                    value={item.texto}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    onBlur={flush}
                    className="h-8 text-xs flex-1 min-w-0"
                    placeholder={`Elemento ${idx + 1}`}
                  />
                  <select
                    value={getItemZoneId(item.id)}
                    onChange={(e) => changeItemZone(item.id, e.target.value)}
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    title="Zona destino"
                  >
                    <option value="none" disabled>
                      Destino...
                    </option>
                    {local.zonas.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.etiqueta || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-1 h-8 text-xs w-full"
            >
              <Plus className="mr-1.5 size-3" /> Agregar elemento
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Zonas destino</Label>
            <div className="space-y-1.5">
              {local.zonas.map((zone, idx) => (
                <div key={zone.id} className="flex gap-1.5">
                  <Input
                    value={zone.etiqueta}
                    onChange={(e) => updateZoneLabel(zone.id, e.target.value)}
                    onBlur={flush}
                    className="h-8 text-xs flex-1 min-w-0"
                    placeholder={`Zona ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeZone(zone.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addZone}
              className="mt-1 h-8 text-xs w-full"
            >
              <Plus className="mr-1.5 size-3" /> Agregar zona
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
