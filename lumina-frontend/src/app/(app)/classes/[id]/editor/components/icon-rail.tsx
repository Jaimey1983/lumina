'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Layers,
  LayoutTemplate,
  LogOut,
  Palette,
  RefreshCw,
  Shapes,
  Sparkles,
  User,
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

export type LeftPanelId = 'elementos' | 'widgets' | 'layout' | 'fondo' | 'ia' | 'paginas';

interface RailItem {
  id: LeftPanelId;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: RailItem[] = [
  { id: 'elementos',   label: 'Elementos',   Icon: Shapes },
  { id: 'widgets', label: 'Widgets', Icon: Boxes },
  { id: 'layout',      label: 'Layout',      Icon: LayoutTemplate },
  { id: 'fondo',       label: 'Diseño',      Icon: Palette },
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
  'text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB] ' +
  'focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-1 ' +
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
      className={cn(ICON_BTN, isActive && 'bg-[#f9fafb] text-[#2563EB]')}
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
    <aside className="flex h-full min-h-0 w-full min-w-0 flex-col border-r border-[#e5e7eb] bg-white">

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
              className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#2563EB] text-[11px] font-semibold text-white transition-opacity hover:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="size-9 rounded-full object-cover" />
              ) : (
                userInitials
              )}
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
