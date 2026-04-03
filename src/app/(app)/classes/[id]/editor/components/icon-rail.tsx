'use client';

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
  Zap,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  { id: 'actividades', label: 'Actividades', Icon: Zap },
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
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onPanelToggle(id)}
                aria-label={label}
                aria-pressed={activePanel === id}
                className={cn(ICON_BTN, activePanel === id && 'bg-accent text-foreground')}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* ── Bottom: RefreshCw + Avatar ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pb-3">

        {/* Cambiar desempeño */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRefreshDesempeno}
              aria-label="Cambiar desempeño"
              className={ICON_BTN}
            >
              <RefreshCw className="size-5 shrink-0" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Cambiar desempeño</TooltipContent>
        </Tooltip>

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
