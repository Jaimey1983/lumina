'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  Star,
  ClipboardList,
  BarChart2,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@lumina/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type IconKey =
  | 'home'
  | 'courses'
  | 'classes'
  | 'edu'
  | 'analytics'
  | 'admin'
  | 'profile';

const icons: Record<IconKey, LucideIcon> = {
  home: Home,
  courses: BookOpen,
  classes: Star,
  edu: ClipboardList,
  analytics: BarChart2,
  admin: ShieldCheck,
  profile: User,
};

function isAdminRole(role?: string) {
  const r = role?.toUpperCase();
  return r === 'ADMIN' || r === 'SUPERADMIN';
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadministrador',
  ADMIN: 'Administrador',
  DEPARTMENT_HEAD: 'Jefe de área',
  TEACHER: 'Docente',
  TEACHER_ASSISTANT: 'Auxiliar docente',
  STUDENT: 'Estudiante',
  PARENT: 'Acudiente',
  GUEST: 'Invitado',
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

type NavItem = {
  label: string;
  href: string;
  icon: IconKey;
  /** Sólo visible para ADMIN / SUPERADMIN. */
  adminOnly?: boolean;
  /** Oculto para ADMIN / SUPERADMIN (contenido docente/estudiante). */
  hideForAdmin?: boolean;
  /** Oculto para estudiantes. */
  hideForStudent?: boolean;
  /** Etiqueta específica para estudiantes. */
  studentLabel?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: 'home' },
  { label: 'Cursos', href: '/courses', icon: 'courses', hideForAdmin: true },
  {
    label: 'Mis Clases',
    studentLabel: 'Mis Presentaciones',
    href: '/classes',
    icon: 'classes',
    hideForAdmin: true,
  },
  { label: 'Lumina Edu', href: '/edu', icon: 'edu', hideForAdmin: true, hideForStudent: true },
  { label: 'Analytics', href: '/analytics', icon: 'analytics', hideForAdmin: true, hideForStudent: true },
  { label: 'Panel Admin', href: '/admin', icon: 'admin', adminOnly: true },
  { label: 'Perfil', href: '/profile', icon: 'profile' },
];

function NavLink({
  href,
  label,
  iconKey,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  iconKey: IconKey;
  pathname: string;
  /** Cierra el drawer móvil al navegar — no-op en el sidebar fijo de escritorio. */
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, href);
  const Icon = icons[iconKey];

  return (
    <Link
      href={href}
      onClick={onNavigate}
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

/** Contenido compartido entre el `<aside>` fijo de escritorio y el drawer móvil. */
function SidebarContent({
  pathname,
  navItems,
  displayName,
  roleLabel,
  initials,
  avatar,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  navItems: NavItem[];
  displayName: string;
  roleLabel: string;
  initials: string;
  avatar?: string | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
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
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#e5e7eb]">
        <div className="flex items-center gap-3 p-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={displayName}
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
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
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#111827]">{displayName}</p>
            <p className="truncate text-xs text-[#6b7280]">{roleLabel || 'Usuario'}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="rounded p-1 text-[#9ca3af] transition-colors hover:text-[#f87171]"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cambiar de ruta (click en un link, o cualquier navegación programática)
  // siempre cierra el drawer — evita que quede abierto tapando la página nueva.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const displayName = userDisplayName(user) || '?';
  const initials = userInitials(user);
  const roleLabel = user?.role
    ? ROLE_LABELS[user.role.toUpperCase()] ?? user.role
    : '';
  const admin = isAdminRole(user?.role);
  const isStudent = user?.role === 'STUDENT';
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !admin) return false;
    if (item.hideForAdmin && admin) return false;
    if (item.hideForStudent && isStudent) return false;
    return true;
  }).map((item) => {
    if (isStudent && item.studentLabel) {
      return { ...item, label: item.studentLabel };
    }
    return item;
  });

  return (
    <>
      {/* Barra superior móvil — reemplaza al <aside> fijo por debajo de `lg`. */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#e5e7eb] bg-[#ffffff] px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="flex size-9 shrink-0 items-center justify-center rounded-lumina-lg text-[#374151] transition-colors hover:bg-[#eff6ff]"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <img
            src="/LM-e5004c.svg"
            alt="Lumina"
            className="h-6 w-auto shrink-0"
            draggable={false}
          />
          <span className="truncate text-sm font-extrabold tracking-tight text-[#111827]">
            Lumina
          </span>
        </Link>
      </div>

      {/* Sidebar fijo — solo desde `lg` (1024px), mismo umbral que useIsMobile(). */}
      <aside className="hidden h-full w-52 shrink-0 flex-col border-r border-[#e5e7eb] bg-[#ffffff] lg:flex">
        <SidebarContent
          pathname={pathname}
          navItems={navItems}
          displayName={displayName}
          roleLabel={roleLabel}
          initials={initials}
          avatar={user?.avatar}
          onLogout={handleLogout}
        />
      </aside>

      {/* Drawer móvil — mismo contenido, disparado por el botón de la barra superior. */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-72 max-w-[85vw] flex-col gap-0 border-[#e5e7eb] bg-[#ffffff] p-0"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarContent
            pathname={pathname}
            navItems={navItems}
            displayName={displayName}
            roleLabel={roleLabel}
            initials={initials}
            avatar={user?.avatar}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
