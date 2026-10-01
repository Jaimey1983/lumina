'use client';

import { useMemo, useState } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@lumina/ui/button';
import { EquationComposer } from '@lumina/editor-shared/rich-text/equation-composer';
import { Checkbox } from '@lumina/ui/checkbox';
import { Label } from '@lumina/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import {
  generateMathActivities,
  toSingleEditorActivity,
  type MathFormato,
  type MathTema,
} from '@/lib/math-generator';

const TEMAS: { value: MathTema; label: string }[] = [
  { value: 'suma', label: 'Suma' },
  { value: 'resta', label: 'Resta' },
  { value: 'multiplicacion', label: 'Multiplicación' },
  { value: 'fracciones', label: 'Fracciones' },
  { value: 'ecuacion', label: 'Ecuación' },
];

const FORMATOS: { value: MathFormato; label: string }[] = [
  { value: 'quiz_multiple', label: 'Quiz (opción múltiple)' },
  { value: 'short_answer', label: 'Respuesta corta' },
];

const GRADOS = Array.from({ length: 11 }, (_, i) => String(i + 1));
const CANTIDADES = ['5', '8', '10', '12', '15'] as const;

function previewLine(item: {
  tipo: string;
  question?: string;
  preguntas?: { texto?: string }[];
}): string {
  if (item.tipo === 'short_answer') return item.question ?? '';
  return item.preguntas?.[0]?.texto ?? '';
}

interface Props {
  hasActivity?: boolean;
  onInsertActivity?: (activityContent: Record<string, unknown>) => void;
  onInsertEquation?: (latex: string) => void;
}

export function MathGeneratorPanel({ hasActivity, onInsertActivity, onInsertEquation }: Props) {
  const [tema, setTema] = useState<MathTema>('suma');
  const [grado, setGrado] = useState('2');
  const [formato, setFormato] = useState<MathFormato>('quiz_multiple');
  const [cantidad, setCantidad] = useState('8');
  const [sinLlevar, setSinLlevar] = useState(true);
  const [ecuacion, setEcuacion] = useState('');
  const [seed, setSeed] = useState(1);

  const esSumaResta = tema === 'suma' || tema === 'resta';
  const cantidadEfectiva = formato === 'short_answer' ? 1 : Number(cantidad);

  const items = useMemo(
    () =>
      generateMathActivities({
        tema,
        grado: Number(grado),
        cantidad: cantidadEfectiva,
        formato,
        seed,
        sinLlevar: esSumaResta ? sinLlevar : undefined,
      }),
    [tema, grado, formato, cantidadEfectiva, seed, esSumaResta, sinLlevar],
  );

  const handleColocarEcuacion = () => {
    const tex = ecuacion.trim();
    if (!tex) {
      toast.error('Escribe una ecuación antes de colocarla');
      return;
    }
    onInsertEquation?.(tex);
  };

  const handleInsertar = () => {
    const activity = toSingleEditorActivity(items);
    onInsertActivity?.(activity as unknown as Record<string, unknown>);
    toast.success(
      activity.tipo === 'quiz_multiple'
        ? `Quiz insertado (${activity.preguntas.length} preguntas)`
        : 'Actividad insertada',
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <section className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">Escribir ecuación</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            Arma la fórmula con los signos y colócala en el slide como un bloque.
          </p>
        </div>
        <EquationComposer value={ecuacion} onChange={setEcuacion} density="panel" />
        <Button
          size="sm"
          className="w-full"
          disabled={hasActivity || ecuacion.trim() === ''}
          onClick={handleColocarEcuacion}
        >
          Colocar en el slide
        </Button>
      </section>

      <details className="rounded-md border border-border">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-foreground">
          Quiz de ejercicios
        </summary>
        <div className="flex flex-col gap-3 border-t border-border p-3">
      {hasActivity && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          Este slide ya tiene una actividad. Elimínala para agregar otra.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Genera ejercicios deterministas (sin IA). Misma semilla, mismos ítems. El quiz se inserta
        como una sola actividad con varias preguntas.
      </p>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">Tema</Label>
        <Select
          value={tema}
          onValueChange={(v) => setTema(v as MathTema)}
          disabled={hasActivity}
        >
          <SelectTrigger className="h-8 text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMAS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Grado</Label>
          <Select value={grado} onValueChange={setGrado} disabled={hasActivity}>
            <SelectTrigger className="h-8 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADOS.map((g) => (
                <SelectItem key={g} value={g} className="text-xs">
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Formato</Label>
          <Select
            value={formato}
            onValueChange={(v) => setFormato(v as MathFormato)}
            disabled={hasActivity}
          >
            <SelectTrigger className="h-8 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATOS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formato === 'quiz_multiple' && (
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Cantidad de preguntas</Label>
          <Select value={cantidad} onValueChange={setCantidad} disabled={hasActivity}>
            <SelectTrigger className="h-8 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANTIDADES.map((n) => (
                <SelectItem key={n} value={n} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {esSumaResta && (
        <label className="flex items-start gap-2 text-[11px] leading-snug text-muted-foreground">
          <Checkbox
            size="sm"
            className="mt-0.5"
            checked={sinLlevar}
            onCheckedChange={(v) => setSinLlevar(v === true)}
            disabled={hasActivity}
          />
          Sin llevar / sin prestar (recomendado en grados 1–2)
        </label>
      )}

      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Vista previa ({items.length})
        </p>
        <ol className="max-h-40 list-decimal space-y-1 overflow-y-auto pl-4 text-[11px] leading-snug text-foreground">
          {items.map((item, i) => (
            <li key={`${seed}-${i}`}>{previewLine(item)}</li>
          ))}
        </ol>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity}
        onClick={() => setSeed((s) => s + 1)}
      >
        <RefreshCw className="size-3.5" />
        Otras preguntas
      </Button>
      <Button
        size="sm"
        className="w-full gap-2"
        disabled={hasActivity || items.length === 0}
        onClick={handleInsertar}
      >
        <Calculator className="size-3.5" />
        Insertar en el slide
      </Button>
        </div>
      </details>
    </div>
  );
}
