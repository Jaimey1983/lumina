'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from 'lucide-react';

import type { OrderSteps, OrderStep } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { crearAnunciosDnd, INSTRUCCIONES_DND_ES } from '../_shared/activity-dnd-a11y.js';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { barajar } from '../_shared/barajar.js';
import styles from './order-steps.module.css';

// Editor-only fields that ride along with the persisted activity data.
export type OrderStepsLocal = OrderSteps & { mostrarNumeros?: boolean };

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PASOS: OrderStep[] = [
  { id: 'step-1', contenido: '', ordenCorrecto: 1 },
  { id: 'step-2', contenido: '', ordenCorrecto: 2 },
];

function normalize(a: OrderStepsLocal | null | undefined): OrderStepsLocal {
  if (!a) {
    return {
      tipo: 'ordenar_pasos',
      instruccion: '',
      pasos: DEFAULT_PASOS,
      mostrarNumeros: true,
    };
  }
  const pasos = a.pasos?.length >= 2 ? a.pasos : DEFAULT_PASOS;
  return { ...a, pasos, tipo: 'ordenar_pasos', mostrarNumeros: a.mostrarNumeros ?? true };
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: OrderStepsLocal | null;
  onChange: (data: OrderStepsLocal) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function OrderStepsActivityEditor({
  editorSyncKey = '',
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<OrderStepsLocal>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<OrderStepsLocal>) {
    const next: OrderStepsLocal = { ...local, ...partial, tipo: 'ordenar_pasos' };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<OrderStepsLocal>) {
    commitImmediate({ ...local, ...partial, tipo: 'ordenar_pasos' });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────

  function updateStepText(id: string, contenido: string) {
    const nextPasos = local.pasos.map((s, i) =>
      s.id === id ? { ...s, contenido, ordenCorrecto: i + 1 } : s,
    );
    updateText({ pasos: nextPasos });
  }

  function addStep() {
    if (local.pasos.length >= 10) return;
    const newStep: OrderStep = {
      id: `step-${generateId()}`,
      contenido: '',
      ordenCorrecto: local.pasos.length + 1,
    };
    updateImmediate({ pasos: [...local.pasos, newStep] });
  }

  function removeStep(id: string) {
    if (local.pasos.length <= 2) return;
    const filtered = local.pasos.filter((s) => s.id !== id);
    const reindexed = filtered.map((s, i) => ({ ...s, ordenCorrecto: i + 1 }));
    updateImmediate({ pasos: reindexed });
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === local.pasos.length - 1) return;

    const nextPasos = [...local.pasos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [nextPasos[index], nextPasos[swapIndex]] = [nextPasos[swapIndex], nextPasos[index]];
    const reindexed = nextPasos.map((s, i) => ({ ...s, ordenCorrecto: i + 1 }));
    updateImmediate({ pasos: reindexed });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(52vh,380px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
          Ordenar Pasos
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            title="Eliminar esta actividad"
            aria-label="Eliminar esta actividad"
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

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="space-y-1">
          <Label htmlFor="os-instructions" className="text-[11px] font-medium">
            Instrucción general
          </Label>
          <Textarea
            id="os-instructions"
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="Ej: Ordena los siguientes pasos cronológicamente…"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium">Secuencia Correcta</Label>
            <span className="text-[10px] text-muted-foreground">
              {local.pasos.length}/10
            </span>
          </div>

          <div className="space-y-1.5">
            {local.pasos.map((paso, idx) => (
              <div key={paso.id} className="flex items-center gap-1.5">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-5 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, 'up')}
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-5 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === local.pasos.length - 1}
                    onClick={() => moveStep(idx, 'down')}
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </div>

                <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-white px-2 py-1">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    value={paso.contenido}
                    onChange={(e) => updateStepText(paso.id, e.target.value)}
                    onBlur={flush}
                    className="h-6 flex-1 rounded-none border-0 bg-transparent p-0 px-1 text-xs shadow-none focus-visible:ring-0"
                    placeholder={`Paso ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    disabled={local.pasos.length <= 2}
                    onClick={() => removeStep(paso.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {local.pasos.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full border-dashed text-[11px] text-muted-foreground hover:text-foreground"
              onClick={addStep}
            >
              <Plus className="mr-1.5 size-3" />
              Agregar paso
            </Button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
          <Label htmlFor="os-show-numbers" className="cursor-pointer text-[11px] font-medium leading-tight">
            Mostrar números de orden al estudiante
          </Label>
          <Switch
            id="os-show-numbers"
            className="scale-90"
            checked={local.mostrarNumeros ?? true}
            onCheckedChange={(checked) => updateImmediate({ mostrarNumeros: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Viewer (sobre el ActivityShell, U9b.4) ──────────────────────────────────────

function PasoOrdenable({
  id,
  contenido,
  indice,
  total,
  mostrarNumeros,
  bloqueado,
  onMover,
}: {
  id: string;
  contenido: string;
  indice: number;
  total: number;
  mostrarNumeros?: boolean;
  bloqueado: boolean;
  onMover: (id: string, delta: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: bloqueado,
    // El nombre que oyen los lectores de pantalla al arrastrar con teclado.
    data: { etiqueta: contenido },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 1 : 0 }}
      className={cn(styles.paso, isDragging && styles.pasoArrastrado)}
    >
      <button
        type="button"
        className={styles.asa}
        aria-label={`Mover «${contenido}»`}
        disabled={bloqueado}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      {mostrarNumeros && <span className={styles.numero}>{indice + 1}</span>}
      <span className={styles.texto}>{contenido}</span>
      {/* Alternativa al arrastre (DU8): subir y bajar con botones. */}
      <span className={styles.flechas}>
        <button
          type="button"
          className={styles.flecha}
          aria-label={`Subir «${contenido}»`}
          disabled={bloqueado || indice === 0}
          onClick={() => onMover(id, -1)}
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.flecha}
          aria-label={`Bajar «${contenido}»`}
          disabled={bloqueado || indice === total - 1}
          onClick={() => onMover(id, 1)}
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </span>
    </div>
  );
}

interface Elemento {
  id: string;
  content: string;
}

interface CuerpoProps {
  activity: OrderStepsLocal;
  isDark: boolean;
  ctx: ActivityShellContext;
  items: Elemento[];
  setItems: React.Dispatch<React.SetStateAction<Elemento[]>>;
  enviada: boolean;
  onEnviar: () => void;
}

function Cuerpo({ activity, isDark, ctx, items, setItems, enviada, onEnviar }: CuerpoProps) {
  const bloqueado = enviada || ctx.sesion.fase !== 'jugando';
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';
  const [anuncio, setAnuncio] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const accesibilidad = useMemo(
    () => ({ announcements: crearAnunciosDnd(), screenReaderInstructions: INSTRUCCIONES_DND_ES }),
    [],
  );

  function alSoltar(event: DragEndEvent) {
    if (bloqueado) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const viejo = prev.findIndex((i) => i.id === active.id);
        const nuevo = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, viejo, nuevo);
      });
    }
  }

  const mover = useCallback(
    (id: string, delta: -1 | 1) => {
      if (bloqueado) return;
      const viejo = items.findIndex((i) => i.id === id);
      const nuevo = viejo + delta;
      if (viejo < 0 || nuevo < 0 || nuevo >= items.length) return;
      setItems(arrayMove(items, viejo, nuevo));
      setAnuncio(`«${items[viejo]!.content}» ahora es el paso ${nuevo + 1} de ${items.length}.`);
    },
    [bloqueado, items, setItems],
  );

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      {activity.instruccion && <p className={styles.instruccion}>{activity.instruccion}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={accesibilidad}
        onDragEnd={alSoltar}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className={styles.lista}>
            {items.map((item, index) => (
              <PasoOrdenable
                key={item.id}
                id={item.id}
                contenido={item.content}
                indice={index}
                total={items.length}
                mostrarNumeros={activity.mostrarNumeros}
                bloqueado={bloqueado}
                onMover={mover}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div role="status" aria-live="polite" className={styles.soloLector}>
        {anuncio}
      </div>

      {enviada ? (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <div className={styles.acciones}>
          <button type="button" className={styles.enviar} disabled={bloqueado} onClick={onEnviar}>
            Enviar
          </button>
        </div>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function OrderStepsViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: OrderStepsLocal;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [items, setItems] = useState<Elemento[]>([]);
  const [enviada, setEnviada] = useState(false);
  // Cada cambio de slide o de pasos (p. ej. al editar) es una corrida nueva, también para el shell.
  const [version, setVersion] = useState(0);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const semilla = ajustes.semilla;
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  useEffect(() => {
    if (!activity?.pasos) return;
    // Aleatorio por alumno o, con semilla, el mismo orden para toda la clase.
    const mezclados = barajar(activity.pasos, semilla, 0);
    setItems(mezclados.map((s) => ({ id: s.id, content: s.contenido })));
    setEnviada(false);
    setVersion((v) => v + 1);
  }, [activity?.pasos, editorSyncKey, semilla]);

  if (!activity) return null;

  const enviar = (ctx: ActivityShellContext) => {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    setEnviada(true);
    const enviados = items.map((i) => i.id);
    const correctos = [...activity.pasos].sort((a, b) => a.ordenCorrecto - b.ordenCorrecto).map((p) => p.id);
    const ok =
      activity.pasos.length > 0 &&
      enviados.length === correctos.length &&
      enviados.every((id, i) => id === correctos[i]);
    feedback.emitir(ok ? 'acierto' : 'error', { movimiento: false });
    onResponse?.(enviados);
    ctx.completar();
  };

  return (
    <ActivityShell key={version} ajustes={ajustes} resultado="ninguno">
      {(ctx) => (
        <Cuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          items={items}
          setItems={setItems}
          enviada={enviada}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
