'use client';

import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useClass, type ClassDetail } from '@/hooks/api/use-class';
import { useUpdateClass } from '@/hooks/api/use-classes';
import { CLASS_BACKGROUNDS, getBackground } from '@/lib/class-backgrounds';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Conservado para compatibilidad con `right-flyout-panel.tsx`; no se usa aquí. */
  onApplyTheme: (bg: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ThemesPanel(props: Props) {
  void props.onApplyTheme;
  const params = useParams();
  const classId = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();
  const { data: classData } = useClass(classId);
  const courseId = classData?.courseId ?? '';
  const updateClassMutation = useUpdateClass(classId, courseId);
  const activeBackgroundId = classData?.background ?? 'none';

  const handleSelect = (id: string) => {
    queryClient.setQueryData<ClassDetail | null | undefined>(
      ['classes', 'detail', classId],
      (prev) => (prev ? { ...prev, background: id } : prev),
    );
    updateClassMutation.mutate(
      { background: id },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
          toast.error('No se pudo guardar el fondo');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
          Fondo de clase
        </h2>
        <p className="text-xs text-[#9ca3af]">Se aplica a todos los slides de la clase</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {CLASS_BACKGROUNDS.map((b) => {
          const isActive = activeBackgroundId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              title={b.name}
              aria-label={b.name}
              aria-pressed={isActive}
              disabled={!classId || updateClassMutation.isPending}
              onClick={() => handleSelect(b.id)}
              className="w-full cursor-pointer rounded-[6px] p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-80"
            >
              <span
                className="block w-full shrink-0 overflow-hidden"
                style={{
                  height: 48,
                  borderRadius: 6,
                  boxSizing: 'border-box',
                  ...b.style,
                  border: isActive ? '2px solid #2563EB' : '1px solid #e5e7eb',
                }}
              />
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-[#6b7280]">
        {getBackground(activeBackgroundId).name}
      </p>
    </div>
  );
}
