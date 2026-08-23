'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Star,
  ClipboardList,
  BarChart2,
  User,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCourses } from '@/hooks/api/use-courses';
import { getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type IconKey = 'home' | 'courses' | 'classes' | 'edu' | 'analytics' | 'profile';

const icons: Record<IconKey, LucideIcon> = {
  home: Home,
  courses: BookOpen,
  classes: Star,
  edu: ClipboardList,
  analytics: BarChart2,
  profile: User,
};

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/dashboard') return false;
  return pathname.startsWith(`${href}/`);
}

function userDisplayName(user: { name: string; lastName?: string } | null) {
  if (!user) return '';
  return [user.name, user.lastName].filter(Boolean).join(' ').trim();
}

function userInitials(user: { name: string; lastName?: string } | null) {
  const full = userDisplayName(user);
  if (!full) return '?';
  const initials = getInitials(full, 2);
  return initials || '?';
}

function NavLink({
  href,
  label,
  iconKey,
  pathname,
}: {
  href: string;
  label: string;
  iconKey: IconKey;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);
  const Icon = icons[iconKey];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lumina-lg px-2 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[#dbeafe] text-[#2563EB]'
          : 'text-[#374151] hover:bg-[#eff6ff]',
      )}
    >
      <Icon
        className={cn('size-[18px] shrink-0', active ? 'text-[#2563EB]' : 'text-[#9ca3af]')}
        strokeWidth={active ? 2.25 : 2}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };
  const { data: courses } = useCourses();

  const eduHref = useMemo(() => {
    const first = courses?.[0];
    return first?.id ? `/edu/${first.id}` : '/edu';
  }, [courses]);

  const navItems = useMemo(
    () =>
      [
        { label: 'Inicio', href: '/dashboard', icon: 'home' as const },
        { label: 'Cursos', href: '/courses', icon: 'courses' as const },
        { label: 'Mis Clases', href: '/classes', icon: 'classes' as const },
        { label: 'Lumina Edu', href: eduHref, icon: 'edu' as const },
        { label: 'Analytics', href: '/analytics', icon: 'analytics' as const },
        { label: 'Perfil', href: '/profile', icon: 'profile' as const },
      ] as const,
    [eduHref],
  );

  const displayName = userDisplayName(user) || '?';
  const initials = userInitials(user);

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-[#e5e7eb] bg-[#ffffff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 border-b border-[#e5e7eb] px-1 pb-4"
        >
          <img
            src="/LM-e5004c.svg"
            alt="Lumina"
            className="h-8 w-auto shrink-0"
            draggable={false}
          />
          <span className="text-[1rem] font-extrabold tracking-tight text-[#111827]">
            Lumina
          </span>
        </Link>

        <p className="px-2 py-3 text-lumina-xs font-bold uppercase tracking-widest text-[#9ca3af]">
          Menú
        </p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={`${item.label}-${item.href}`}
              href={item.href}
              label={item.label}
              iconKey={item.icon}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#e5e7eb]">
        <div className="flex items-center gap-3 p-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#2563EB',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#111827]">{displayName}</p>
            <p className="text-xs text-[#6b7280]">Docente</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="rounded p-1 text-[#9ca3af] transition-colors hover:text-[#f87171]"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
