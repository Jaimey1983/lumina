'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Building2, MapPin, Clock, Shield, Bell, Camera } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { getInitials, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { PageBanner } from '@/components/ui/page-banner';
import { isAiStaffRole } from '@/hooks/api/use-ai-settings';
import { useChangePassword, useUpdateProfile } from '@/hooks/api/use-profile';
import { apiErrorMessage } from '@/lib/api-error-message';
import { AiKeysCard } from './ai-keys-card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERADMIN: 'Super Admin',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

function roleLabel(role: string): string {
  return ROLE_LABEL[role?.toUpperCase()] ?? role;
}

const profileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(50),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(50),
  institution: z.string().trim().max(100).optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').max(72),
    confirmPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['newPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

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

function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  defaultValues,
  defaultAvatar,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultValues: ProfileFormData;
  /** Avatar actual (data URL o URL). `null` = sin foto. */
  defaultAvatar: string | null;
  onSaved: (values: ProfileFormData & { avatar: string | null }) => void;
}) {
  const updateProfile = useUpdateProfile(userId);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  const [avatar, setAvatar] = useState<string | null>(defaultAvatar);

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
    setAvatar(defaultAvatar);
    // Solo al abrir: defaultValues nuevo en cada render resetearía el formulario al escribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open
  }, [open]);

  const avatarChanged = (avatar ?? '') !== (defaultAvatar ?? '');

  function onSubmit(data: ProfileFormData) {
    updateProfile.mutate(
      {
        name: data.name,
        lastName: data.lastName,
        institution: data.institution ?? '',
        // Solo se envía si cambió: '' limpia la foto, un data URL la reemplaza.
        ...(avatarChanged ? { avatar: avatar ?? '' } : {}),
      },
      {
        onSuccess: () => {
          onSaved({ ...data, avatar: avatarChanged ? avatar : defaultAvatar });
          toast.success('Perfil actualizado');
          onOpenChange(false);
        },
        onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo actualizar el perfil')),
      },
    );
  }

  const previewName = [form.watch('name'), form.watch('lastName')]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#111827]">Imagen de perfil</p>
                <AvatarUploader
                  value={avatar}
                  name={previewName || defaultValues.name}
                  onChange={setAvatar}
                  disabled={updateProfile.isPending}
                />
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institución</FormLabel>
                    <FormControl>
                      <Input autoComplete="organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordCard() {
  const changePassword = useChangePassword();
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function onSubmit(data: PasswordFormData) {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada');
          form.reset();
        },
        onError: (err) =>
          toast.error(apiErrorMessage(err, 'No se pudo cambiar la contraseña')),
      },
    );
  }

  return (
    <ProfileCard>
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f9fafb]">
          <Shield className="h-5 w-5 text-[#2563EB]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#111827]">Seguridad</h3>
          <p className="mt-0.5 text-xs text-[#6b7280]">Cambia tu contraseña de acceso.</p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña actual</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-1">
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Guardando…' : 'Actualizar contraseña'}
            </Button>
          </div>
        </form>
      </Form>
    </ProfileCard>
  );
}

export function ProfileClient() {
  const { user, updateUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const fullName = user
    ? [user.name, user.lastName].filter(Boolean).join(' ').trim() || '—'
    : '—';

  const initials = getInitials(fullName, 2) || '?';

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <PageBanner title="Mi Perfil" subtitle="Configuración de tu cuenta" backHref="/dashboard" />

      <div className="px-6 pt-4">
      <div className="flex flex-col gap-6">
        <ProfileCard>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={!user?.id}
              onClick={() => setEditOpen(true)}
              aria-label="Cambiar imagen de perfil"
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:cursor-not-allowed"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-xl font-bold text-white select-none">
                  {initials}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="size-4" aria-hidden />
              </span>
            </button>

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

            <Button
              type="button"
              className="shrink-0 bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              disabled={!user?.id}
              onClick={() => setEditOpen(true)}
            >
              Editar perfil
            </Button>
          </div>
        </ProfileCard>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

        {isAiStaffRole(user?.role) && <AiKeysCard />}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <PasswordCard />
          <ProfileCard className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f9fafb]">
              <Bell className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#111827]">Notificaciones</h3>
                <span className="inline-flex items-center rounded-full bg-[#f9fafb] px-2 py-0.5 text-[0.6875rem] font-medium text-[#2563EB]">
                  Próximamente
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#6b7280]">
                Personaliza qué notificaciones recibes y cómo te llegan.
              </p>
            </div>
          </ProfileCard>
        </div>
      </div>
      </div>

      {user?.id ? (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          userId={user.id}
          defaultValues={{
            name: user.name ?? '',
            lastName: user.lastName ?? '',
            institution: user.institution ?? '',
          }}
          defaultAvatar={user.avatar ?? null}
          onSaved={(values) =>
            updateUser({
              name: values.name,
              lastName: values.lastName,
              institution: values.institution,
              avatar: values.avatar,
            })
          }
        />
      ) : null}
    </div>
  );
}
