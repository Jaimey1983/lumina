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

import type { QuizLayoutVariant, QuizOption } from '@lumina/types/slide';
import { cn } from '@lumina/ui/lib/utils';
import { MathText } from '@lumina/editor-shared/rich-text/math-text';

import styles from './quiz.module.css';

/** Paleta «Kahoot» de los layouts `color-grid` y `two-col-color-list` (identidad del layout). */
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

type LayoutProps = Omit<QuizOptionsLayoutProps, 'layoutVariant'>;

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

type Flags = ReturnType<typeof optionFeedbackFlags>;

/** Lo que el lector de pantalla debe oír de una opción ya corregida (los iconos son decorativos). */
function EstadoParaLector({ flags }: { flags: Flags }) {
  const texto = flags.selectedRight
    ? ' — tu respuesta, correcta'
    : flags.selectedWrong
      ? ' — tu respuesta, incorrecta'
      : flags.showCorrectReveal
        ? ' — la respuesta correcta'
        : '';
  return texto ? <span className={styles.soloLector}>{texto}</span> : null;
}

/** Clases de estado de una opción (selección, acierto, error, revelada, atenuada). */
function claseEstado(flags: Flags, phase: 'selecting' | 'feedback'): string {
  return cn(
    flags.isSel && phase === 'selecting' && styles.elegida,
    flags.selectedRight && cn(styles.bien, 'animate-in zoom-in-95 duration-300'),
    flags.selectedWrong && cn(styles.mal, 'lumina-viewer-shake'),
    flags.showCorrectReveal && cn(styles.revela, 'animate-in zoom-in-95 duration-300'),
    flags.showAuto && !flags.isSel && !flags.showCorrectReveal && styles.tenue,
  );
}

interface OpcionProps {
  op: QuizOption;
  flags: Flags;
  phase: 'selecting' | 'feedback';
  disabled: boolean;
  isMultiSelect: boolean;
  onToggle: (id: string) => void;
  onSelectSingle: (id: string) => void;
  className: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

/** Botón de una opción: mismo comportamiento en todos los layouts. */
function Opcion({ op, flags, phase, disabled, isMultiSelect, onToggle, onSelectSingle, className, style, children }: OpcionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isMultiSelect ? flags.isSel : undefined}
      onClick={() => {
        if (disabled) return;
        if (isMultiSelect) onToggle(op.id);
        else onSelectSingle(op.id);
      }}
      className={cn(styles.opcion, className, claseEstado(flags, phase))}
      style={style}
    >
      {children}
      <EstadoParaLector flags={flags} />
    </button>
  );
}

function ClassicListLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.vertical, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        return (
          <li key={op.id}>
            <Opcion op={op} flags={flags} {...props} className={styles.clasica}>
              {flags.showAuto ? (
                <>
                  <span className={styles.grupoIcono}>
                    {flags.isSel ? (
                      flags.selectedWrong ? (
                        <Circle className={cn(styles.icono, styles.iconoMal)} aria-hidden />
                      ) : (
                        <CheckCircle className={cn(styles.icono, styles.iconoBien)} aria-hidden />
                      )
                    ) : (
                      <Circle className={cn(styles.icono, styles.iconoNeutro)} aria-hidden />
                    )}
                    <span className={styles.texto}><MathText text={op.texto} /></span>
                  </span>
                  {flags.selectedRight && <CheckCircle2 className={cn(styles.iconoGrande, styles.iconoBien)} aria-hidden />}
                  {flags.selectedWrong && <XCircle className={cn(styles.iconoGrande, styles.iconoMal)} aria-hidden />}
                  {flags.showCorrectReveal && !flags.isSel && (
                    <CheckCircle2 className={cn(styles.iconoGrande, styles.iconoBien)} aria-hidden />
                  )}
                </>
              ) : (
                <>
                  {flags.isSel ? (
                    <CheckCircle className={cn(styles.icono, styles.iconoElegido)} aria-hidden />
                  ) : (
                    <Circle className={cn(styles.icono, styles.iconoNeutro)} aria-hidden />
                  )}
                  <MathText text={op.texto} />
                </>
              )}
            </Opcion>
          </li>
        );
      })}
    </ul>
  );
}

function ColorGridLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.rejilla, styles.rejillaAmplia, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const baseColor = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
        const conResultado = flags.showAuto && (flags.selectedWrong || flags.selectedRight || flags.showCorrectReveal);
        return (
          <li key={op.id}>
            <Opcion
              op={op}
              flags={flags}
              {...props}
              className={cn(
                styles.color,
                flags.isSel && phase === 'selecting' && styles.colorElegida,
                flags.selectedRight && styles.colorBien,
                flags.selectedWrong && styles.colorMal,
                flags.showCorrectReveal && styles.colorRevela,
              )}
              style={conResultado ? undefined : { backgroundColor: baseColor }}
            >
              <span className={styles.recorte}><MathText text={op.texto} /></span>
            </Opcion>
          </li>
        );
      })}
    </ul>
  );
}

function IconCardsLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.rejilla, styles.rejillaAmplia, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const Shape = ICON_SHAPES[idx % ICON_SHAPES.length];
        return (
          <li key={op.id}>
            <Opcion op={op} flags={flags} {...props} className={styles.tarjetaIcono}>
              <Shape className={styles.iconoForma} aria-hidden />
              <span className={styles.tarjetaIconoTexto}><MathText text={op.texto} /></span>
            </Opcion>
          </li>
        );
      })}
    </ul>
  );
}

function PillsHorizontalLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.vertical, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        return (
          <li key={op.id}>
            <Opcion op={op} flags={flags} {...props} className={styles.pildora}>
              <MathText text={op.texto} />
            </Opcion>
          </li>
        );
      })}
    </ul>
  );
}

/** Lista vertical con barra de color por opción (columna derecha en two-col-color-list). */
function TwoColColorListLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.vertical, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op, idx) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        const accent = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
        return (
          <li key={op.id}>
            <Opcion op={op} flags={flags} {...props} className={styles.franja} style={{ borderLeftColor: accent }}>
              {flags.isSel ? (
                <CheckCircle className={cn(styles.icono, styles.iconoElegido)} aria-hidden />
              ) : (
                <Circle className={cn(styles.icono, styles.iconoNeutro)} aria-hidden />
              )}
              <span className={styles.texto}><MathText text={op.texto} /></span>
            </Opcion>
          </li>
        );
      })}
    </ul>
  );
}

/** Grid 2×2 neutro (columna derecha en two-col-neutral-grid). */
function TwoColNeutralGridLayout(props: LayoutProps) {
  const { opciones, variant, phase, selectedIds, hasDefinedCorrect, questionCorrect } = props;
  return (
    <ul className={cn(styles.lista, styles.rejilla, variant === 'dark' ? styles.oscuro : styles.claro)}>
      {opciones.map((op) => {
        const flags = optionFeedbackFlags(op, selectedIds, phase, hasDefinedCorrect, questionCorrect);
        return (
          <li key={op.id}>
            <Opcion op={op} flags={flags} {...props} className={styles.neutra}>
              <span className={styles.recorte}><MathText text={op.texto} /></span>
            </Opcion>
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

function QuizQuestionText({ texto, variant }: { texto: string; variant: 'dark' | 'light' }) {
  return (
    <p className={cn(styles.enunciado, variant === 'dark' ? styles.oscuro : styles.claro)}>
      <MathText text={texto} />
    </p>
  );
}

function QuizQuestionImage({ imagenUrl, variant }: { imagenUrl?: string; variant: 'dark' | 'light' }) {
  if (imagenUrl?.trim()) {
    return (
      <div className={styles.imagen}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagenUrl.trim()} alt="" />
      </div>
    );
  }
  return <div className={cn(styles.sinImagen, variant === 'dark' ? styles.oscuro : styles.claro)}>Sin imagen</div>;
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
      <div className={styles.apilado}>
        <QuizQuestionText texto={preguntaTexto} variant={variant} />
        {hint}
        {options}
        {footer}
      </div>
    );
  }

  if (resolved === 'two-col-image-pills') {
    return (
      <div className={styles.dosColumnas}>
        <QuizQuestionImage imagenUrl={imagenUrl} variant={variant} />
        <div className={styles.apiladoCompacto}>
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
    <div className={styles.dosColumnas}>
      <div className={styles.apiladoMinimo}>
        {showAccent ? <QuizQuestionAccentBar index={accentIndex} /> : null}
        <QuizQuestionText texto={preguntaTexto} variant={variant} />
      </div>
      <div className={styles.apiladoCompacto}>
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
  return <div className={styles.acento} style={{ backgroundColor: color }} aria-hidden />;
}
