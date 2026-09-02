'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { FontFamilySelect } from '@/components/editor/font-family-select';
import { FONT_DEFAULT, resolveFontFamily } from '@/lib/font-catalog';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TYPOGRAPHY,
  TEXT_MASK_DEFAULT_WEIGHT,
  TEXT_MASK_MAX_CHARS,
  TEXT_MASK_MAX_LINES,
  TYPOGRAPHY_LIMITS,
  buildTextClipShape,
  familySupportsTextMask,
  normalizeTypography,
  weightsForTextMask,
  type TextMaskAlign,
  type TextMaskTypography,
} from '@/lib/text-mask';
import type { ClipShapeTexto } from '@/types/slide.types';

const WEIGHT_LABELS: Record<number, string> = {
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

const ALIGN_OPTIONS: { value: TextMaskAlign; Icon: typeof AlignLeft; label: string }[] = [
  { value: 'left', Icon: AlignLeft, label: 'Izquierda' },
  { value: 'center', Icon: AlignCenter, label: 'Centro' },
  { value: 'right', Icon: AlignRight, label: 'Derecha' },
];

function firstSupportedFamily(candidate?: string): string {
  const resolved = resolveFontFamily(candidate);
  if (familySupportsTextMask(resolved)) return resolved;
  return familySupportsTextMask(FONT_DEFAULT) ? FONT_DEFAULT : 'Inter';
}

function messageFor(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);
  if (code === 'EMPTY_OUTLINE') return 'Escribe un texto visible para generar el contorno.';
  if (code === 'FONT_NOT_SUPPORTED') return 'Esta fuente no admite máscara de texto. Elige otra.';
  if (code.startsWith('FONT_FETCH_'))
    return 'No se pudo descargar el archivo de la fuente. Revisa la conexión e inténtalo de nuevo.';
  return 'No se pudo generar la máscara de texto.';
}

interface SliderRowProps {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, valueLabel, min, max, step, value, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">{valueLabel}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? value)}
      >
        <SliderThumb />
      </Slider>
    </div>
  );
}

export interface TextMaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Valores iniciales al reabrir el editor sobre una máscara existente. */
  initial?: Pick<
    ClipShapeTexto,
    | 'text'
    | 'fontFamily'
    | 'fontWeight'
    | 'fontScale'
    | 'letterSpacing'
    | 'lineHeight'
    | 'scaleX'
    | 'scaleY'
    | 'align'
  >;
  onConfirm: (shape: ClipShapeTexto) => void;
}

export function TextMaskDialog({ open, onOpenChange, initial, onConfirm }: TextMaskDialogProps) {
  const [text, setText] = useState('');
  const [family, setFamily] = useState<string>(FONT_DEFAULT);
  const [weight, setWeight] = useState<number>(TEXT_MASK_DEFAULT_WEIGHT);
  const [typo, setTypo] = useState<TextMaskTypography>(DEFAULT_TYPOGRAPHY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shape, setShape] = useState<ClipShapeTexto | null>(null);
  const runIdRef = useRef(0);

  // Semilla al abrir.
  useEffect(() => {
    if (!open) return;
    const seededFamily = firstSupportedFamily(initial?.fontFamily);
    const weights = weightsForTextMask(seededFamily);
    const seededWeight = Number(initial?.fontWeight);
    setText(initial?.text ?? '');
    setFamily(seededFamily);
    setWeight(
      weights.includes(seededWeight) ? seededWeight : weights[0] ?? TEXT_MASK_DEFAULT_WEIGHT,
    );
    setTypo(
      normalizeTypography({
        fontScale: initial?.fontScale,
        letterSpacing: initial?.letterSpacing,
        lineHeight: initial?.lineHeight,
        scaleX: initial?.scaleX,
        scaleY: initial?.scaleY,
        align: initial?.align,
      }),
    );
    setShape(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const weights = useMemo(() => weightsForTextMask(family), [family]);

  // Al cambiar de familia, encajar el peso a uno disponible.
  useEffect(() => {
    if (weights.length && !weights.includes(weight)) setWeight(weights[0]!);
  }, [weights, weight]);

  // Regeneración con debounce del contorno (preview en vivo).
  useEffect(() => {
    if (!open) return;
    if (!text.trim()) {
      setShape(null);
      setError(null);
      setBusy(false);
      return;
    }
    const runId = ++runIdRef.current;
    setBusy(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const next = await buildTextClipShape({
          text,
          fontFamily: family,
          fontWeight: weight,
          typography: typo,
        });
        if (runIdRef.current === runId) {
          setShape(next);
          setBusy(false);
        }
      } catch (err) {
        if (runIdRef.current === runId) {
          setShape(null);
          setError(messageFor(err));
          setBusy(false);
        }
      }
    }, 320);
    return () => clearTimeout(timer);
    // `typo` es un objeto nuevo en cada cambio (patchTypo / seed), así que basta con él.
  }, [open, text, family, weight, typo]);

  const patchTypo = useCallback(
    (patch: Partial<TextMaskTypography>) => setTypo((prev) => ({ ...prev, ...patch })),
    [],
  );

  const confirm = useCallback(() => {
    if (!shape) return;
    onConfirm(shape);
    onOpenChange(false);
  }, [shape, onConfirm, onOpenChange]);

  const isMultiline = text.includes('\n');
  const L = TYPOGRAPHY_LIMITS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Máscara de texto</DialogTitle>
          <DialogDescription>
            El texto se convierte en un contorno vectorial real de la fuente y recorta el
            elemento. Curvas suaves a cualquier zoom.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="grid gap-5 sm:grid-cols-2">
          {/* Columna izquierda: texto + tipografía */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="text-mask-input" className="text-xs">
                Texto
              </Label>
              <textarea
                id="text-mask-input"
                value={text}
                rows={2}
                maxLength={TEXT_MASK_MAX_LINES * (TEXT_MASK_MAX_CHARS + 1)}
                placeholder={'Escribe aquí…\nEnter = nueva línea'}
                autoFocus
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground">
                Hasta {TEXT_MASK_MAX_LINES} líneas · {TEXT_MASK_MAX_CHARS} caracteres por línea.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FontFamilySelect value={family} onValueChange={setFamily} label="Fuente" />
              <div className="space-y-1.5">
                <Label className="text-xs">Peso</Label>
                <Select value={String(weight)} onValueChange={(v) => setWeight(Number(v))}>
                  <SelectTrigger size="sm" className="h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weights.map((w) => (
                      <SelectItem key={w} value={String(w)} className="text-xs">
                        {WEIGHT_LABELS[w] ?? w} ({w})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <SliderRow
                label="Tamaño de letra"
                valueLabel={`${Math.round(typo.fontScale * 100)}%`}
                min={L.fontScale.min}
                max={L.fontScale.max}
                step={L.fontScale.step}
                value={typo.fontScale}
                onChange={(v) => patchTypo({ fontScale: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <SliderRow
                label="Ancho de letra"
                valueLabel={`${Math.round(typo.scaleX * 100)}%`}
                min={L.scaleX.min}
                max={L.scaleX.max}
                step={L.scaleX.step}
                value={typo.scaleX}
                onChange={(v) => patchTypo({ scaleX: v })}
              />
              <SliderRow
                label="Alto de letra"
                valueLabel={`${Math.round(typo.scaleY * 100)}%`}
                min={L.scaleY.min}
                max={L.scaleY.max}
                step={L.scaleY.step}
                value={typo.scaleY}
                onChange={(v) => patchTypo({ scaleY: v })}
              />
              <SliderRow
                label="Espaciado"
                valueLabel={`${typo.letterSpacing.toFixed(2)} em`}
                min={L.letterSpacing.min}
                max={L.letterSpacing.max}
                step={L.letterSpacing.step}
                value={typo.letterSpacing}
                onChange={(v) => patchTypo({ letterSpacing: v })}
              />
              <SliderRow
                label="Interlineado"
                valueLabel={`${typo.lineHeight.toFixed(2)}×`}
                min={L.lineHeight.min}
                max={L.lineHeight.max}
                step={L.lineHeight.step}
                value={typo.lineHeight}
                onChange={(v) => patchTypo({ lineHeight: v })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={cn('text-xs', !isMultiline && 'text-muted-foreground/60')}>
                Alineación {isMultiline ? '' : '(multilínea)'}
              </Label>
              <div
                role="group"
                aria-label="Alineación de líneas"
                className="inline-flex rounded-md border border-border p-0.5"
              >
                {ALIGN_OPTIONS.map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={typo.align === value}
                    disabled={!isMultiline}
                    onClick={() => patchTypo({ align: value })}
                    className={cn(
                      'rounded p-1.5 transition-colors',
                      typo.align === value
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                      !isMultiline && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
                <button
                  type="button"
                  className="ml-1 rounded px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setTypo(DEFAULT_TYPOGRAPHY)}
                >
                  Restablecer
                </button>
              </div>
            </div>
          </div>

          {/* Columna derecha: vista previa */}
          <div className="space-y-1.5">
            <Label className="text-xs">Vista previa</Label>
            <div className="flex min-h-[220px] items-center justify-center rounded-md border border-border bg-[repeating-conic-gradient(#e2e8f0_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-4">
              {busy ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Generando" />
              ) : error ? (
                <p className="max-w-xs text-center text-xs text-destructive">{error}</p>
              ) : shape ? (
                <svg
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`Contorno de "${shape.text}"`}
                  style={{
                    width: '100%',
                    maxWidth: 440,
                    aspectRatio: String(shape.aspect ?? 4),
                    overflow: 'hidden',
                    outline: '1px dashed rgba(100,116,139,0.5)',
                  }}
                >
                  <path d={shape.pathData} className="fill-[#2563EB]" fillRule="nonzero" />
                </svg>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Escribe un texto para ver el contorno.
                </p>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!shape || busy} onClick={confirm}>
            {initial ? 'Actualizar máscara' : 'Añadir máscara'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
