import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ColombianGradeLevel = 'Bajo' | 'Basico' | 'Alto' | 'Superior';

interface ColombianGradeScale {
  level: ColombianGradeLevel;
  label: string;
  variant: 'destructive' | 'warning' | 'success' | 'primary';
  className: string;
}

const SCALE_STYLES: Record<ColombianGradeLevel, ColombianGradeScale> = {
  Bajo: {
    level: 'Bajo',
    label: 'Bajo',
    variant: 'destructive',
    className: 'border-0 bg-[#fee2e2] text-[#f87171] dark:border-red-900 dark:bg-red-950/70 dark:text-red-300',
  },
  Basico: {
    level: 'Basico',
    label: 'Básico',
    variant: 'warning',
    className: 'border-0 bg-[#fef3c7] text-[#d97706] dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-300',
  },
  Alto: {
    level: 'Alto',
    label: 'Alto',
    variant: 'primary',
    className: 'border-0 bg-[#dbeafe] text-[#2563EB] dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300',
  },
  Superior: {
    level: 'Superior',
    label: 'Superior',
    variant: 'success',
    className: 'border-0 bg-[#dcfce7] text-[#16a34a] dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300',
  },
};

export function getColombianGradeScale(note: number | null | undefined) {
  if (typeof note !== 'number' || Number.isNaN(note)) {
    return null;
  }

  if (note <= 2.9) return SCALE_STYLES.Bajo;
  if (note <= 3.9) return SCALE_STYLES.Basico;
  if (note <= 4.6) return SCALE_STYLES.Alto;
  return SCALE_STYLES.Superior;
}

export function GradeScaleBadge({ note, className }: { note: number | null | undefined; className?: string }) {
  const scale = getColombianGradeScale(note);

  if (!scale) {
    return (
      <Badge variant="secondary" appearance="light" className={className}>
        Pendiente
      </Badge>
    );
  }

  return (
    <Badge
      variant={scale.variant}
      appearance="outline"
      className={cn(scale.className, className)}
    >
      {scale.label}
    </Badge>
  );
}