'use client';

import { cn } from '@/lib/utils';

// ─── Theme definitions ────────────────────────────────────────────────────────

interface Theme {
  id: string;
  label: string;
  bg: string;
  previewBg: string;
  accentBg: string;
}

const THEMES: Theme[] = [
  { id: 'white',     label: 'Blanco',      bg: '#FFFFFF', previewBg: 'bg-white',        accentBg: 'bg-gray-200' },
  { id: 'blue',      label: 'Azul suave',  bg: '#EFF6FF', previewBg: 'bg-blue-50',      accentBg: 'bg-blue-400' },
  { id: 'green',     label: 'Verde suave', bg: '#F0FDF4', previewBg: 'bg-green-50',     accentBg: 'bg-green-400' },
  { id: 'lavender',  label: 'Lavanda',     bg: '#F5F3FF', previewBg: 'bg-violet-50',    accentBg: 'bg-violet-400' },
  { id: 'dark',      label: 'Gris oscuro', bg: '#1F2937', previewBg: 'bg-gray-800',     accentBg: 'bg-gray-500' },
  { id: 'navy',      label: 'Azul marino', bg: '#1E3A5F', previewBg: 'bg-blue-900',     accentBg: 'bg-blue-500' },
  { id: 'terracota', label: 'Terracota',   bg: '#7C2D12', previewBg: 'bg-orange-900',   accentBg: 'bg-orange-500' },
  { id: 'mint',      label: 'Menta',       bg: '#ECFDF5', previewBg: 'bg-emerald-50',   accentBg: 'bg-emerald-400' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onApplyTheme: (bg: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ThemesPanel({ onApplyTheme }: Props) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs text-muted-foreground">
        Selecciona un tema para aplicar al slide activo.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            title={theme.label}
            onClick={() => onApplyTheme(theme.bg)}
            className="overflow-hidden rounded-md border border-border text-left transition-all hover:border-primary hover:ring-2 hover:ring-primary/20"
          >
            {/* Color preview */}
            <div className={cn('flex h-12 w-full flex-col justify-end', theme.previewBg)}>
              <div className={cn('h-2 w-full', theme.accentBg)} />
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-medium leading-tight">{theme.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
