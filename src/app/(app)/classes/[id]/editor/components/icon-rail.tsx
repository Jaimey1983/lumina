'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Layers,
  LayoutTemplate,
  LogOut,
  Palette,
  RefreshCw,
  Shapes,
  Sparkles,
  User,
  Puzzle,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeftPanelId = 'elementos' | 'actividades' | 'layout' | 'fondo' | 'ia' | 'paginas';

interface RailItem {
  id: LeftPanelId;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: 'elementos',   label: 'Elementos',   Icon: Shapes },
  { id: 'actividades', label: 'Interactivos', Icon: Puzzle },
  { id: 'layout',      label: 'Layout',      Icon: LayoutTemplate },
  { id: 'fondo',       label: 'Fondo',       Icon: Palette },
  { id: 'ia',          label: 'IA',          Icon: Sparkles },
  { id: 'paginas',     label: 'Páginas',     Icon: Layers },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconRailProps {
  activePanel: LeftPanelId | null;
  onPanelToggle: (panel: LeftPanelId) => void;
  onRefreshDesempeno: () => void;
}

// ─── Shared button class ──────────────────────────────────────────────────────

const ICON_BTN =
  'flex items-center justify-center rounded-lg p-3 outline-none ' +
  'text-muted-foreground hover:bg-accent hover:text-foreground ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
  'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out ' +
  'motion-reduce:transition-none';

// ─── RailButton — memo-ized to prevent Radix composeRefs loop ─────────────────

const RailButton = memo(function RailButton({
  id,
  label,
  Icon,
  isActive,
  onToggle,
}: {
  id: LeftPanelId;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  onToggle: (id: LeftPanelId) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onToggle(id)}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(ICON_BTN, isActive && 'bg-accent text-foreground')}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
    </button>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

export function IconRail({ activePanel, onPanelToggle, onRefreshDesempeno }: IconRailProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const userInitials = user ? getInitials(`${user.name} ${user.lastName ?? ''}`) : '?';
  const userName = user ? `${user.name}${user.lastName ? ` ${user.lastName}` : ''}` : '';

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col border-r border-border bg-background">

      {/* ── Top: panel icons ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center gap-1 pt-2">
        {ITEMS.map(({ id, label, Icon }) => (
          <RailButton
            key={id}
            id={id}
            label={label}
            Icon={Icon}
            isActive={activePanel === id}
            onToggle={onPanelToggle}
          />
        ))}
      </div>

      {/* ── Bottom: RefreshCw + Avatar ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pb-3">

        {/* Cambiar desempeño */}
        <button
          type="button"
          title="Cambiar desempeño"
          onClick={onRefreshDesempeno}
          aria-label="Cambiar desempeño"
          className={ICON_BTN}
        >
          <RefreshCw className="size-5 shrink-0" aria-hidden />
        </button>

        {/* Avatar con dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={userName}
              aria-label={userName}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {userInitials}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 size-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              <LogOut className="mr-2 size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </aside>
  );
}
