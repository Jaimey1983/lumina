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
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/70 dark:text-red-300',
  },
  Basico: {
    level: 'Basico',
    label: 'Basico',
    variant: 'warning',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/70 dark:text-yellow-300',
  },
  Alto: {
    level: 'Alto',
    label: 'Alto',
    variant: 'success',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300',
  },
  Superior: {
    level: 'Superior',
    label: 'Superior',
    variant: 'primary',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300',
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