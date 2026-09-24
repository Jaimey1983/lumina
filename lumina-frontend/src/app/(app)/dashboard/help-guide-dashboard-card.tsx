'use client';

import Link from 'next/link';
import { BookOpen, Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  useDismissHelpGuide,
  useDuplicateHelpGuide,
  useHelpGuide,
} from '@/hooks/api/use-help-guide';
import { Button } from '@lumina/ui/button';

/**
 * "Guía de Lumina" (X.2) — tarjeta fijada en el dashboard del docente hasta
 * que la cierra (persiste `welcomeGuideDismissedAt`). Solo rol TEACHER, se
 * decide en `TeacherDashboard` (`dashboard-client.tsx`), no acá.
 */
export function HelpGuideDashboardCard() {
  const router = useRouter();
  const guideQuery = useHelpGuide();
  const duplicateMutation = useDuplicateHelpGuide();
  const dismissMutation = useDismissHelpGuide();

  // Sin plantilla todavía (seed no corrido) o ya cerrada por este docente —
  // no mostrar nada. Errores de red tampoco bloquean el dashboard.
  if (guideQuery.isLoading || guideQuery.isError) return null;
  const guide = guideQuery.data;
  if (!guide || guide.dismissedAt) return null;

  const handleDuplicate = () => {
    duplicateMutation.mutate(undefined, {
      onSuccess: (created) => {
        toast.success('Copia creada en tus clases.');
        router.push(`/classes/${created.id}/editor`);
      },
      onError: () => {
        toast.error('No se pudo duplicar la guía. Intenta de nuevo.');
      },
    });
  };

  const handleDismiss = () => {
    dismissMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-lumina-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563EB]">
          <BookOpen className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#111827]">{guide.title}</p>
          <p className="text-lumina-sm text-[#6b7280]">
            {guide.description ?? 'Una introducción rápida a Lumina para docentes nuevos.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/help/guide">Ver guía</Link>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDuplicate}
          disabled={duplicateMutation.isPending}
        >
          {duplicateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Copy className="size-4" />
          )}
          Duplicar a mis clases
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cerrar"
          onClick={handleDismiss}
          disabled={dismissMutation.isPending}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
