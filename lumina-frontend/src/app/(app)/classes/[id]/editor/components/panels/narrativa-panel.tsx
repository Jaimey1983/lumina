'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Plus, Sparkles, Trash2, BookOpen, Check } from 'lucide-react';
import type { ClassNarrativeMeta } from '@/types/slide.types';
import { normalizeClassNarrativeMeta } from '@/lib/class-narrativa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface NarrativaPanelProps {
  narrativa?: ClassNarrativeMeta | null;
  onSaveNarrativa: (narrativa: ClassNarrativeMeta | null) => Promise<void> | void;
  isSaving?: boolean;
}

export function NarrativaPanel({
  narrativa,
  onSaveNarrativa,
  isSaving = false,
}: NarrativaPanelProps) {
  const [nombreMision, setNombreMision] = useState(narrativa?.nombreMision || '');
  const [fragmentos, setFragmentos] = useState<string[]>(
    narrativa?.fragmentosHistoria || [],
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setNombreMision(narrativa?.nombreMision || '');
    setFragmentos(narrativa?.fragmentosHistoria || []);
    setHasChanges(false);
  }, [narrativa]);

  const handleAddFragmento = () => {
    setFragmentos([...fragmentos, '']);
    setHasChanges(true);
  };

  const handleFragmentoChange = (index: number, text: string) => {
    const next = [...fragmentos];
    next[index] = text;
    setFragmentos(next);
    setHasChanges(true);
  };

  const handleRemoveFragmento = (index: number) => {
    const next = fragmentos.filter((_, i) => i !== index);
    setFragmentos(next);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const normalized = normalizeClassNarrativeMeta({
      nombreMision,
      fragmentosHistoria: fragmentos,
    });
    await onSaveNarrativa(normalized);
    setHasChanges(false);
    toast.success(
      normalized ? 'Misión narrativa actualizada' : 'Narrativa eliminada',
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4 text-xs">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Misión / Quest</h3>
            <p className="text-[11px] text-muted-foreground">
              Gamificación narrativa para esta clase
            </p>
          </div>
        </div>
        {nombreMision && (
          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
            Activa
          </Badge>
        )}
      </div>

      {/* Nombre de la Misión */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <Label className="text-xs font-medium text-foreground">
            Nombre de la Misión
          </Label>
        </div>
        <Input
          value={nombreMision}
          onChange={(e) => {
            setNombreMision(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Ej: Misión Espacial: Rumbo a Marte"
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-muted-foreground">
          Aparece como insignia y contexto inmersivo en la barra superior.
        </p>
      </div>

      {/* Fragmentos de Historia */}
      <div className="space-y-2 border-t border-border/70 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <Label className="text-xs font-medium text-foreground">
              Fragmentos de Historia ({fragmentos.length})
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddFragmento}
            className="h-6 px-2 text-[10px]"
          >
            <Plus className="mr-1 h-3 w-3" /> Fragmento
          </Button>
        </div>

        {fragmentos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/80 p-3 text-center text-[11px] text-muted-foreground">
            No hay fragmentos de historia. Añade partes narrativas para contextualizar la lección.
          </div>
        ) : (
          <div className="space-y-2">
            {fragmentos.map((fragmento, idx) => (
              <div
                key={idx}
                className="rounded-md border border-border/70 bg-background/60 p-2 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Parte {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFragmento(idx)}
                    className="text-muted-foreground hover:text-destructive p-0.5"
                    title="Eliminar fragmento"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Textarea
                  value={fragmento}
                  onChange={(e) => handleFragmentoChange(idx, e.target.value)}
                  placeholder={`Ej: Año 2085. La tripulación descubre una señal misteriosa...`}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón de Guardar */}
      <div className="pt-2 border-t border-border/70 flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          {isSaving ? 'Guardando...' : 'Guardar Misión'}
        </Button>
      </div>
    </div>
  );
}
