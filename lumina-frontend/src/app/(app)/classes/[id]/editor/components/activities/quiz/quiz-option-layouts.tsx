'use client';

import type { ReactNode } from 'react';
import {
  CheckCircle,
  CheckCircle2,
  Circle,
  Diamond,
  Square,
  Triangle,
  XCircle,
} from 'lucide-react';

import type { QuizLayoutVariant, QuizOption } from '@/types/slide.types';
import { cn } from '@/lib/utils';

const KAHOOT_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#8540df', '#0aa865'] as const;

const ICON_SHAPES = [Circle, Square, Triangle, Diamond] as const;

const LAYOUTS_V1: QuizLayoutVariant[] = [
  'classic-list',
  'color-grid',
  'icon-cards',
  'pills-horizontal',
];

const ALL_LAYOUTS: QuizLayoutVariant[] = [
  ...LAYOUTS_V1,
  'two-col-color-list',
  'two-col-neutral-grid',
  'two-col-image-pills',
];

export function resolveQuizLayoutVariant(variant: QuizLayoutVariant): QuizLayoutVariant {
  return ALL_LAYOUTS.includes(variant) ? variant : 'classic-list';
}

export function isTwoColumnLayout(variant: QuizLayoutVariant): boolean {
  return variant.startsWith('two-col-');
}

export interface QuizOptionsLayoutProps {
  layoutVariant: QuizLayoutVariant;
  opciones: QuizOption[];
  variant: 'dark' | 'light';
  /** `selecting` = eligiendo; `feedback` = tras confirmar o tap en single-select. */
  phase: 'selecting' | 'feedback';
  selectedIds: string[];
  hasDefinedCorrect: boolean;
  questionCorrect: boolean | null;
  isMultiSelect: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  onSelectSingle: (id: string) => void;
}

function optionFeedbackFlags(
  op: QuizOption,
  selectedIds: string[],
  phase: 'selecting' | 'feedback',
  hasDefinedCorrect: boolean,
  questionCorrect: boolean | null,
) {
  const isSel = selectedIds.includes(op.id);
  const showAuto = phase === 'feedback' && hasDefinedCorrect;
  const isCorrectOption = op.esCorrecta;
  const showCorrectReveal = showAuto && questionCorrect === false && isCorrectOption;
  const selectedWrong = showAuto && isSel && questionCorrect === false;
  const selectedRight = showAuto && isSel && questionCorrect === true;
  return { isSel, showAuto, showCorrectReveal, selectedWrong, selectedRight };
}

function FeedbackIcons({
  isSel,
  selectedWrong,
  selectedRight,
  showCorrectReveal,
}: {
  isSel: boolean;
  selectedWrong: boolean;
  selectedRight: boolean;
  showCorrectReveal: boolean;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {isSel ? (
          selectedWrong ? (
            <Circle className="size-4 shrink-0 text-[#DC2626]" />
          ) : (
            <CheckCircle className="size-4 shrink-0 text-[#16A34A]" />
          )
        ) : (
          <Circle className="size-4 shrink-0 text-[#9ca3af]/40" />
        )}
      </span>
      {selectedRight && <CheckCircle2 className="size-5 shrink-0 text-[#16A34A]" aria-hidden />}
      {selectedWrong && <XCircle className="size-5 shrink-0 text-[#DC2626]" aria-hidden />}
      {showCorrectReveal && !isSel && (
        <CheckCircle2 className="size-5 shrink-0 text-[#16A34A]" aria-hidden />
      )}
    </>
  );
}

function classicOptionClasses(
  flags: ReturnType<typeof optionFeedbackFlags>,
  isDark: boolean,
  disabled: boolean,
): string {
  const { isSel, showAuto, showCorrectReveal, selectedWrong, selectedRight } = flags;
  return cn(
    'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors',
    !disabled &&
      !isSel &&
      (isDark
        ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
        : 'border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]'),
    !disabled &&
      isSel &&
      (isDark
        ? 'border-[#2563EB] bg-[#2563EB]/80 text-white'
        : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'),
    selectedRight &&
      (isDark
        ? 'origin-center border-green-400 bg-green-500/30 text-green-300 animate-in zoom-in-95 duration-300'
        : 'origin-center border-[#16a34a] bg-[#dcfce7] text-[#16a34a] animate-in zoom-in-95 duration-300'),
    selectedWrong &&
      (isDark
        ? 'border-red-400 bg-red-500/30 text-red-300 lumina-viewer-shake'
        : 'border-[#f87171] bg-[#fee2e2] text-[#f87171] lumina-viewer-shake'),
    showCorrectReveal &&
      (isDark
        ? 'border-green-400 bg-green-500/30 text-green-300 animate-in zoom-in-95 duration-300'
        : 'border-[#16a34a] bg-[#dcfce7] text-[#16a34a] animate-in zoom-in-95 duration-300'),
    showAuto &&
      !isSel &&
      !showCorrectReveal &&
      !selectedRight &&
      (isDark ? 'border-white/20 opacity-50' : 'border-[#e5e7eb] opacity-50'),
  );
}

function ClassicListLayout({
  opciones,
  variant,
  phase,
  selectedIds,
  hasDefinedCorrect,
  questionCorrect,
  isMultiSelect,
  disabled,
  onToggle,
  onSelectSingle,
}: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const isDark = variant === 'dark';

  return (
    <ul className="space-y-2">
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(
          op,
          selectedIds,
          phase,
          hasDefinedCorrect,
          questionCorrect,
        );
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              className={classicOptionClasses(flags, isDark, disabled)}
            >
              {flags.showAuto ? (
                <>
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    {flags.isSel ? (
                      flags.selectedWrong ? (
                        <Circle className="size-4 shrink-0 text-[#DC2626]" />
                      ) : (
                        <CheckCircle className="size-4 shrink-0 text-[#16A34A]" />
                      )
                    ) : (
                      <Circle className="size-4 shrink-0 text-[#9ca3af]/40" />
                    )}
                    <span className="min-w-0 flex-1">{op.texto}</span>
                  </span>
                  <FeedbackIcons
                    isSel={flags.isSel}
                    selectedWrong={flags.selectedWrong}
                    selectedRight={flags.selectedRight}
                    showCorrectReveal={flags.showCorrectReveal}
                  />
                </>
              ) : (
                <>
                  {flags.isSel ? (
                    <CheckCircle className="size-4 shrink-0 text-[#2563EB]" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-[#9ca3af]/40" />
                  )}
                  {op.texto}
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ColorGridLayout(props: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const { opciones, phase, selectedIds, hasDefinedCorrect, questionCorrect, disabled, isMultiSelect, onToggle, onSelectSingle } = props;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-3">
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const baseColor = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
        const dimmed = phase === 'feedback' && flags.showAuto && !flags.isSel && !flags.showCorrectReveal;
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              style={{
                backgroundColor: flags.showAuto && (flags.selectedWrong || flags.selectedRight || flags.showCorrectReveal)
                  ? undefined
                  : baseColor,
              }}
              className={cn(
                'flex min-h-[4.5rem] w-full items-center justify-center rounded-lg px-3 py-4 text-center text-sm font-semibold text-white shadow-md transition-transform',
                !disabled && !flags.isSel && 'hover:scale-[1.02]',
                flags.isSel && phase === 'selecting' && 'ring-4 ring-white/80 scale-[1.02]',
                flags.selectedRight && 'bg-[#16a34a] animate-in zoom-in-95 duration-300',
                flags.selectedWrong && 'bg-[#dc2626] lumina-viewer-shake',
                flags.showCorrectReveal && 'bg-[#16a34a]/90 animate-in zoom-in-95 duration-300',
                dimmed && 'opacity-50',
              )}
            >
              <span className="line-clamp-3">{op.texto}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function IconCardsLayout(props: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect, disabled, isMultiSelect, onToggle, onSelectSingle } = props;
  const isDark = variant === 'dark';

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3">
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const Shape = ICON_SHAPES[idx % ICON_SHAPES.length];
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
                isDark ? 'border-white/20 bg-white/10 text-white' : 'border-[#e5e7eb] bg-white text-[#111827]',
                flags.isSel && phase === 'selecting' && (isDark ? 'border-[#2563EB] bg-[#2563EB]/30' : 'border-[#2563EB] bg-[#dbeafe]'),
                flags.selectedRight && 'border-green-400 bg-green-50 text-green-800 animate-in zoom-in-95 duration-300',
                flags.selectedWrong && 'border-red-400 bg-red-50 text-red-800 lumina-viewer-shake',
                flags.showCorrectReveal && 'border-green-300 bg-green-50/80 text-green-800',
              )}
            >
              <Shape className="size-8 shrink-0 opacity-90" aria-hidden />
              <span className="text-xs font-medium leading-snug">{op.texto}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PillsHorizontalLayout(props: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect, disabled, isMultiSelect, onToggle, onSelectSingle } = props;
  const isDark = variant === 'dark';

  return (
    <ul className="flex flex-col gap-2">
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              className={cn(
                'w-full rounded-full border px-5 py-3 text-left text-sm font-medium transition-colors',
                isDark
                  ? 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                  : 'border-[#e5e7eb] bg-[#f9fafb] text-[#111827] hover:bg-[#eff6ff]',
                flags.isSel && phase === 'selecting' && (isDark ? 'border-[#2563EB] bg-[#2563EB]/40' : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'),
                flags.selectedRight && 'border-green-500 bg-green-100 text-green-800 animate-in zoom-in-95 duration-300',
                flags.selectedWrong && 'border-red-400 bg-red-100 text-red-800 lumina-viewer-shake',
                flags.showCorrectReveal && 'border-green-400 bg-green-50 text-green-800',
              )}
            >
              {op.texto}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Lista vertical con barra de color por opción (columna derecha en two-col-color-list). */
function TwoColColorListLayout(props: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect, disabled, isMultiSelect, onToggle, onSelectSingle } = props;
  const isDark = variant === 'dark';

  return (
    <ul className="space-y-2">
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const accent = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md border border-l-[6px] px-3 py-2.5 text-left text-sm transition-colors',
                isDark ? 'border-white/20 bg-white/10 text-white' : 'border-[#e5e7eb] bg-white text-[#111827]',
                flags.isSel && phase === 'selecting' && (isDark ? 'bg-white/20' : 'bg-[#eff6ff]'),
                flags.selectedRight && 'border-green-500 bg-green-50 text-green-800',
                flags.selectedWrong && 'border-red-400 bg-red-50 text-red-800 lumina-viewer-shake',
                flags.showCorrectReveal && 'border-green-400 bg-green-50/80 text-green-800',
              )}
              style={{ borderLeftColor: accent }}
            >
              {flags.isSel ? (
                <CheckCircle className="size-4 shrink-0 text-[#2563EB]" />
              ) : (
                <Circle className="size-4 shrink-0 text-[#9ca3af]/40" />
              )}
              <span className="min-w-0 flex-1">{op.texto}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Grid 2×2 neutro (columna derecha en two-col-neutral-grid). */
function TwoColNeutralGridLayout(props: Omit<QuizOptionsLayoutProps, 'layoutVariant'>) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect, disabled, isMultiSelect, onToggle, onSelectSingle } = props;
  const isDark = variant === 'dark';

  return (
    <ul className="grid grid-cols-2 gap-2">
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        return (
          <li key={op.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (isMultiSelect) onToggle(op.id);
                else onSelectSingle(op.id);
              }}
              className={cn(
                'flex min-h-[4rem] w-full items-center justify-center rounded-lg border px-2 py-3 text-center text-xs font-medium transition-colors',
                isDark
                  ? 'border-white/20 bg-[#f3f4f6]/10 text-white hover:bg-white/15'
                  : 'border-[#d1d5db] bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]',
                flags.isSel && phase === 'selecting' && (isDark ? 'border-[#2563EB] bg-[#2563EB]/30' : 'border-[#2563EB] bg-[#dbeafe]'),
                flags.selectedRight && 'border-green-500 bg-green-50 text-green-800',
                flags.selectedWrong && 'border-red-400 bg-red-50 text-red-800 lumina-viewer-shake',
                flags.showCorrectReveal && 'border-green-400 bg-green-50 text-green-800',
              )}
            >
              <span className="line-clamp-3">{op.texto}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function QuizOptionsLayout({ layoutVariant, ...props }: QuizOptionsLayoutProps) {
  const resolved = resolveQuizLayoutVariant(layoutVariant);
  switch (resolved) {
    case 'color-grid':
      return <ColorGridLayout {...props} />;
    case 'icon-cards':
      return <IconCardsLayout {...props} />;
    case 'pills-horizontal':
    case 'two-col-image-pills':
      return <PillsHorizontalLayout {...props} />;
    case 'two-col-color-list':
      return <TwoColColorListLayout {...props} />;
    case 'two-col-neutral-grid':
      return <TwoColNeutralGridLayout {...props} />;
    case 'classic-list':
    default:
      return <ClassicListLayout {...props} />;
  }
}

function QuizQuestionText({
  texto,
  variant,
  className,
}: {
  texto: string;
  variant: 'dark' | 'light';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-sm font-medium leading-snug sm:text-base',
        variant === 'dark' ? 'text-white' : 'text-[#111827]',
        className,
      )}
    >
      {texto}
    </p>
  );
}

function QuizQuestionImage({ imagenUrl, variant }: { imagenUrl?: string; variant: 'dark' | 'light' }) {
  const isDark = variant === 'dark';
  if (imagenUrl?.trim()) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagenUrl.trim()}
          alt=""
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed text-center text-xs',
        isDark ? 'border-white/25 bg-white/5 text-white/50' : 'border-[#d1d5db] bg-[#f9fafb] text-[#9ca3af]',
      )}
    >
      Sin imagen
    </div>
  );
}

export interface QuizQuestionWithOptionsProps extends QuizOptionsLayoutProps {
  preguntaTexto: string;
  imagenUrl?: string;
  accentIndex?: number;
  hint?: ReactNode;
  footer?: ReactNode;
}

/** Enunciado + opciones; en layouts `two-col-*` usa rejilla de dos columnas. */
export function QuizQuestionWithOptions({
  layoutVariant,
  preguntaTexto,
  imagenUrl,
  accentIndex = 0,
  hint,
  footer,
  variant,
  ...optionProps
}: QuizQuestionWithOptionsProps) {
  const resolved = resolveQuizLayoutVariant(layoutVariant);
  const options = <QuizOptionsLayout layoutVariant={resolved} variant={variant} {...optionProps} />;

  if (!isTwoColumnLayout(resolved)) {
    return (
      <div className="space-y-4">
        <QuizQuestionText texto={preguntaTexto} variant={variant} />
        {hint}
        {options}
        {footer}
      </div>
    );
  }

  if (resolved === 'two-col-image-pills') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <QuizQuestionImage imagenUrl={imagenUrl} variant={variant} />
        <div className="space-y-3">
          <QuizQuestionText texto={preguntaTexto} variant={variant} />
          {hint}
          {options}
          {footer}
        </div>
      </div>
    );
  }

  const showAccent = resolved === 'two-col-color-list';
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
      <div className="space-y-2">
        {showAccent ? <QuizQuestionAccentBar index={accentIndex} /> : null}
        <QuizQuestionText texto={preguntaTexto} variant={variant} />
      </div>
      <div className="space-y-3">
        {hint}
        {options}
        {footer}
      </div>
    </div>
  );
}

/** Barra superior de acento para classic-list (estilo Kahoot). */
export function QuizQuestionAccentBar({ index }: { index: number }) {
  const color = KAHOOT_COLORS[index % KAHOOT_COLORS.length];
  return <div className="h-1.5 w-full rounded-t-xl" style={{ backgroundColor: color }} aria-hidden />;
}
