'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BellDot,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HeaderToolbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const displayName = user?.name?.trim() || 'Usuario';
  const displayEmail = user?.email ?? '';
  const fallback = user ? initialsFromName(user.name) : '?';

  return (
    <nav className="flex items-center gap-2.5">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <BellDot className="opacity-100" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="opacity-100" />
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer">
          <Avatar className="size-7">
            <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} alt="" />
            <AvatarFallback>{fallback}</AvatarFallback>
            <AvatarIndicator className="-end-2 -top-2">
              <AvatarStatus variant="online" className="size-2.5" />
            </AvatarIndicator>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" side="bottom" align="end" sideOffset={11}>
          <div className="flex items-center gap-3 p-3">
            <Avatar>
              <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} alt="" />
              <AvatarFallback>{fallback}</AvatarFallback>
              <AvatarIndicator className="-end-1.5 -top-1.5">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{displayEmail || '—'}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="size-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
