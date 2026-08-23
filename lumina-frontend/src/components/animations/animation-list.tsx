'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Animacion } from '@/types/animation.types';
import { createDefaultAnimacion } from '@/lib/animation-defaults';
import { AnimationItem } from './animation-item';
import { AnimationPicker } from './animation-picker';

interface AnimationListProps {
  animaciones: Animacion[];
  onUpdate: (next: Animacion[]) => void;
}

export function AnimationList({ animaciones, onUpdate }: AnimationListProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = animaciones.findIndex((a) => a.id === active.id);
      const newIdx = animaciones.findIndex((a) => a.id === over.id);
      onUpdate(arrayMove(animaciones, oldIdx, newIdx));
    }
  }

  function handleAdd(tipo: Animacion['tipo']) {
    onUpdate([...animaciones, createDefaultAnimacion(tipo)]);
    setPickerOpen(false);
  }

  function handleChange(id: string, patch: Partial<Animacion>) {
    onUpdate(animaciones.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function handleDelete(id: string) {
    onUpdate(animaciones.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Animaciones
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => setPickerOpen((v) => !v)}
          title="Añadir animación"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {pickerOpen && (
        <AnimationPicker onSelect={handleAdd} onClose={() => setPickerOpen(false)} />
      )}
      {animaciones.length === 0 && !pickerOpen && (
        <p className="text-center text-xs text-muted-foreground py-3">
          Sin animaciones. Pulsa + para agregar.
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={animaciones.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {animaciones.map((anim) => (
            <AnimationItem
              key={anim.id}
              animacion={anim}
              onChange={(patch) => handleChange(anim.id, patch)}
              onDelete={() => handleDelete(anim.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
