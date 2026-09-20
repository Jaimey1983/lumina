'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  Play,
  Radio,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrolledClass } from '@/hooks/api/use-classes';
import { SlideThumbnailPreview } from '@/app/(app)/classes/[id]/editor/components/slides-panel';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lumina/ui/dialog';
import { Button } from '@lumina/ui/button';

const EMPTY_GRADIENTS = [
  'linear-gradient(135deg, #dbeafe, #eff6ff)',
  'linear-gradient(135deg, #e0e7ff, #ede9fe)',
  'linear-gradient(135deg, #fef3c7, #fffbeb)',
];

function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateLong(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StudentEnrolledClassCard({
  cls,
  index,
}: {
  cls: EnrolledClass;
  index: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const isEnVivo = cls.modoEntrega !== 'autonomo';
  const emptyGradient = EMPTY_GRADIENTS[index % EMPTY_GRADIENTS.length];

  // ── ESTADO 1: NO CONFIGURADA (blanco y negro, semitransparente, no clicable) ──
  if (!cls.isConfigured) {
    return (
      <article
        className={cn(
          'relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-[#f9fafb]',
          'filter grayscale opacity-60 pointer-events-none select-none cursor-not-allowed',
        )}
        style={{
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)',
        }}
        data-disabled="true"
        title="Clase aún no programada por el docente"
      >
        <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
          {cls.coverSlide ? (
            <SlideThumbnailPreview
              order={0}
              content={cls.coverSlide.content}
              isActive={false}
              aspectRatio="4/3"
              showOuterRing={false}
              className="h-full rounded-none"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: emptyGradient }}
            >
              <BookOpen className="size-10 text-gray-400 opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              <Lock className="size-3" />
              Sin programar
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">
            {cls.course?.name ?? 'Curso'}
          </p>
          <h3 className="font-bold text-sm text-[#111827] line-clamp-1">
            {cls.title}
          </h3>
          <p className="text-xs text-gray-400">
            El docente aún no ha programado esta clase.
          </p>
        </div>
      </article>
    );
  }

  // ── ESTADO 2: EN VIVO ACTIVA (borde verde, botón unirse) ──
  if (isEnVivo && cls.isLiveActive) {
    return (
      <article
        className="group relative overflow-hidden rounded-[12px] border-2 border-emerald-500 bg-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
          {cls.coverSlide ? (
            <SlideThumbnailPreview
              order={0}
              content={cls.coverSlide.content}
              isActive={false}
              aspectRatio="4/3"
              showOuterRing={false}
              className="h-full rounded-none"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: emptyGradient }}
            >
              <BookOpen className="size-10 text-emerald-600 opacity-50" />
            </div>
          )}

          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm animate-pulse">
              <Radio className="size-3.5" />
              EN VIVO AHORA
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider truncate">
              {cls.course?.name ?? 'Curso'}
            </p>
            <h3 className="font-bold text-sm text-[#111827] line-clamp-1 mt-0.5">
              {cls.title}
            </h3>
          </div>

          <Link
            href={`/classes/${cls.id}/viewer`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Radio className="size-3.5" />
            Unirse a la clase en vivo
          </Link>
        </div>
      </article>
    );
  }

  // ── ESTADO 3: EN VIVO EN ESPERA (aviso al hacer clic) ──
  if (isEnVivo && !cls.isLiveActive) {
    return (
      <>
        <article
          onClick={() => setModalOpen(true)}
          className="group relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
            {cls.coverSlide ? (
              <SlideThumbnailPreview
                order={0}
                content={cls.coverSlide.content}
                isActive={false}
                aspectRatio="4/3"
                showOuterRing={false}
                className="h-full rounded-none"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center"
                style={{ background: emptyGradient }}
              >
                <BookOpen className="size-10 text-[#2563EB] opacity-40" />
              </div>
            )}

            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs">
                <Clock className="size-3" />
                En vivo · En espera
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div>
              <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider truncate">
                {cls.course?.name ?? 'Curso'}
              </p>
              <h3 className="font-bold text-sm text-[#111827] line-clamp-1 mt-0.5">
                {cls.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200/60">
              <Clock className="size-3.5 shrink-0" />
              <span className="truncate">Esperando que el docente inicie</span>
            </div>
          </div>
        </article>

        {/* Modal informativo cuando da clic */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Clock className="size-5 text-amber-500" />
                Clase en Vivo en Espera
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <p className="text-sm font-semibold text-[#111827]">
                {cls.title}
              </p>
              <p className="text-xs text-[#6b7280]">
                Curso: <span className="font-semibold text-[#111827]">{cls.course?.name}</span>
              </p>
              <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p>
                  <strong>La clase en vivo aún no ha comenzado.</strong> Debes esperar a que el docente inicie la sesión.
                </p>
                <p>
                  Cuando el docente comience la clase, el botón para unirte se activará automáticamente aquí.
                </p>
              </div>
              {cls.codigo ? (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs">
                  <span className="text-gray-600">Código de la clase:</span>
                  <span className="font-mono font-bold text-[#111827]">{cls.codigo.toUpperCase()}</span>
                </div>
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" onClick={() => setModalOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── ESTADO 4: AUTÓNOMO PROGRAMADO (informa fecha y hora de inicio) ──
  if (!isEnVivo && cls.autonomousSession?.status === 'scheduled') {
    const opensAtFormatted = formatDateShort(cls.autonomousSession.opensAt);
    const opensAtLong = formatDateLong(cls.autonomousSession.opensAt);
    const closesAtLong = formatDateLong(cls.autonomousSession.closesAt);

    return (
      <>
        <article
          onClick={() => setModalOpen(true)}
          className="group relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
            {cls.coverSlide ? (
              <SlideThumbnailPreview
                order={0}
                content={cls.coverSlide.content}
                isActive={false}
                aspectRatio="4/3"
                showOuterRing={false}
                className="h-full rounded-none"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center"
                style={{ background: emptyGradient }}
              >
                <BookOpen className="size-10 text-amber-600 opacity-40" />
              </div>
            )}

            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                <Calendar className="size-3" />
                Programada
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div>
              <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider truncate">
                {cls.course?.name ?? 'Curso'}
              </p>
              <h3 className="font-bold text-sm text-[#111827] line-clamp-1 mt-0.5">
                {cls.title}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
              <Calendar className="size-3.5 shrink-0 text-amber-600" />
              <span className="truncate">Inicia el {opensAtFormatted}</span>
            </div>
          </div>
        </article>

        {/* Modal informativo cuando da clic */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Calendar className="size-5 text-amber-500" />
                Actividad Autónoma Programada
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <p className="text-sm font-semibold text-[#111827]">
                {cls.title}
              </p>
              <p className="text-xs text-[#6b7280]">
                Curso: <span className="font-semibold text-[#111827]">{cls.course?.name}</span>
              </p>
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p>
                  <strong>Esta clase se inicia el:</strong><br />
                  <span className="font-bold text-sm text-[#111827]">{opensAtLong}</span>
                </p>
                {closesAtLong && (
                  <p className="pt-1 text-gray-700">
                    <strong>Fecha límite de entrega:</strong><br />
                    <span>{closesAtLong}</span>
                  </p>
                )}
                <p className="pt-2 text-amber-800">
                  Podrás ingresar a resolver las actividades y estudiar el contenido una vez llegue la fecha y hora de apertura.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" onClick={() => setModalOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── ESTADO 5: AUTÓNOMO ABIERTO (disponible para resolver ya) ──
  const sessionId = cls.autonomousSession?.id;
  const closesAtFormatted = formatDateShort(cls.autonomousSession?.closesAt);

  return (
    <article
      className="group relative overflow-hidden rounded-[12px] border border-blue-200 bg-white shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all duration-200"
    >
      <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
        {cls.coverSlide ? (
          <SlideThumbnailPreview
            order={0}
            content={cls.coverSlide.content}
            isActive={false}
            aspectRatio="4/3"
            showOuterRing={false}
            className="h-full rounded-none"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{ background: emptyGradient }}
          >
            <BookOpen className="size-10 text-[#2563EB] opacity-50" />
          </div>
        )}

        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
            <Play className="size-3 fill-white" />
            Autónomo · Disponible
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider truncate">
            {cls.course?.name ?? 'Curso'}
          </p>
          <h3 className="font-bold text-sm text-[#111827] line-clamp-1 mt-0.5">
            {cls.title}
          </h3>
          {closesAtFormatted && (
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <Clock className="size-3 text-gray-400" />
              Hasta {closesAtFormatted}
            </p>
          )}
        </div>

        {sessionId ? (
          <Link
            href={`/autonomo/${sessionId}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1d4ed8] transition"
          >
            <Play className="size-3.5 fill-white" />
            Iniciar clase autónoma
          </Link>
        ) : (
          <Link
            href={`/classes/${cls.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1d4ed8] transition"
          >
            Ver clase
          </Link>
        )}
      </div>
    </article>
  );
}
