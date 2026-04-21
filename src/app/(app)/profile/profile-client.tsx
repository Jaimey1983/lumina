'use client';

import { Mail, Building2, MapPin, Clock, Shield, Bell } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { getInitials, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERADMIN: 'Super Admin',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role?.toUpperCase()] ?? role;
}

// ─── Shared card wrapper ───────────────────────────────────────────────────────

function ProfileCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-[#e5e7eb] rounded-[10px] p-6 ${className}`}
      style={{ boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)' }}
    >
      {children}
    </div>
  );
}

// ─── Coming-soon placeholder card ─────────────────────────────────────────────

function ComingSoonCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <ProfileCard className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f9fafb]">
        <Icon className="h-5 w-5 text-[#2563EB]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
          <span className="inline-flex items-center rounded-full bg-[#f9fafb] px-2 py-0.5 text-[0.6875rem] font-medium text-[#2563EB]">
            Próximamente
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#6b7280]">{description}</p>
      </div>
    </ProfileCard>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProfileClient() {
  const { user } = useAuth();

  const fullName = user
    ? [user.name, user.lastName].filter(Boolean).join(' ').trim() || '—'
    : '—';

  const initials = getInitials(fullName, 2) || '?';

  return (
    <div className="w-full p-6">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-[#111827]">Perfil</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Información de tu cuenta</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* ── Identity card ── */}
        <ProfileCard>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xl font-bold text-white select-none">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#111827] truncate">{fullName}</h2>
              {user?.role && (
                <Badge
                  className="mt-1 bg-[#2563EB] text-white border-transparent text-xs"
                  size="sm"
                >
                  {roleLabel(user.role)}
                </Badge>
              )}
            </div>

            {/* CTA */}
            <Button
              type="button"
              className="shrink-0 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              Editar perfil
            </Button>
          </div>
        </ProfileCard>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Contact info */}
          <ProfileCard>
            <h3 className="mb-4 text-sm font-semibold text-[#111827]">
              Información de contacto
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                    Correo electrónico
                  </p>
                  <p className="mt-0.5 font-medium text-[#111827]">
                    {user?.email ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                    Institución
                  </p>
                  <p className="mt-0.5 font-medium text-[#111827]">
                    {user?.institution?.trim() || '—'}
                  </p>
                </div>
              </div>
            </div>
          </ProfileCard>

          {/* Account info */}
          <ProfileCard>
            <h3 className="mb-4 text-sm font-semibold text-[#111827]">
              Cuenta
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                    Rol
                  </p>
                  <p className="mt-0.5 font-medium text-[#111827]">
                    {user?.role ? roleLabel(user.role) : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                    Miembro desde
                  </p>
                  <p className="mt-0.5 font-medium text-[#111827]">
                    {user?.createdAt ? formatDate(user.createdAt) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </ProfileCard>
        </div>

        {/* ── Coming soon cards ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ComingSoonCard
            icon={Shield}
            title="Seguridad"
            description="Cambia tu contraseña y gestiona la autenticación de dos factores."
          />
          <ComingSoonCard
            icon={Bell}
            title="Notificaciones"
            description="Personaliza qué notificaciones recibes y cómo te llegan."
          />
        </div>
      </div>
    </div>
  );
}
