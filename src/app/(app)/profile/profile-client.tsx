'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { BookOpen, GraduationCap, KeyRound, Pencil, ShieldCheck, Users } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useCourses } from '@/hooks/api/use-courses';
import { useClassesByCourses } from '@/hooks/api/use-classes';
import { useCourseStudents } from '@/hooks/api/use-students';
import { useUpdateProfile, useChangePassword } from '@/hooks/api/use-profile';
import { getInitials, formatDate } from '@/lib/helpers';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';

// ─── Role helpers ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
};

const ROLE_VARIANTS: Record<string, 'primary' | 'success' | 'secondary'> = {
  admin: 'primary',
  teacher: 'success',
  student: 'secondary',
};

// ─── Edit Profile Modal ────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  institution: z.string().optional(),
  avatar: z.string().url('URL inválida').optional().or(z.literal('')),
});
type ProfileFormData = z.infer<typeof profileSchema>;

function EditProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, updateUser } = useAuth();
  const mutation = useUpdateProfile(user?.id ?? '');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      lastName: user?.lastName ?? '',
      institution: user?.institution ?? '',
      avatar: user?.avatar ?? '',
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name ?? '',
        lastName: user.lastName ?? '',
        institution: user.institution ?? '',
        avatar: user.avatar ?? '',
      });
    }
  }, [open, user, form]);

  function onSubmit(data: ProfileFormData) {
    mutation.mutate(
      {
        name: data.name,
        lastName: data.lastName,
        institution: data.institution || undefined,
        avatar: data.avatar || undefined,
      },
      {
        onSuccess: (updated) => {
          updateUser({
            name: data.name,
            lastName: data.lastName,
            institution: data.institution || undefined,
            avatar: data.avatar || undefined,
            ...(updated && typeof updated === 'object' ? updated as object : {}),
          });
          toast.success('Perfil actualizado');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al actualizar el perfil'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
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
                        <Input placeholder="Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Institución{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Universidad, colegio, empresa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      URL de avatar{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Password Form ──────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

function ChangePasswordSection() {
  const mutation = useChangePassword();
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function onSubmit(data: PasswordFormData) {
    mutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada');
          form.reset();
        },
        onError: () => toast.error('Error al cambiar la contraseña'),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle className="inline-flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            Cambiar contraseña
          </CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                    <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Account Info Section ──────────────────────────────────────────────────────

function AccountInfoSection() {
  const { user } = useAuth();

  const rows = [
    {
      label: 'Fecha de creación',
      value: user?.createdAt ? formatDate(user.createdAt) : '—',
    },
    {
      label: 'Último acceso',
      value: user?.lastLogin ? formatDate(user.lastLogin) : '—',
    },
    {
      label: 'Estado',
      value: (
        <Badge
          variant={user?.isActive !== false ? 'success' : 'destructive'}
          appearance="light"
          className="inline-flex items-center gap-1"
        >
          <ShieldCheck className="size-3" />
          {user?.isActive !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Información de la cuenta</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

// ─── Teacher Stats Section ─────────────────────────────────────────────────────

function TeacherStatsSection() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const activeCourses = courses.filter((c) => c.isActive);
  const courseIds = activeCourses.map((c) => c.id);

  const { data: classes = [], isLoading: classesLoading } = useClassesByCourses(courseIds);
  const publishedClasses = classes.filter((c) => c.status === 'PUBLISHED');

  // Count unique students across all active courses by fetching the first course's students
  // For simplicity, show total from all courses summed via useQueries - but that could be expensive.
  // Instead, just show total enrolled students from the first active course as a proxy.
  // Actually, we can show a meaningful stat without over-fetching.
  // Let's show course count, class count, and derive students from the data we already have.
  const { data: studentsFirstCourse = [] } = useCourseStudents(courseIds[0] ?? '');

  const isLoading = coursesLoading || classesLoading;

  const stats = [
    {
      label: 'Cursos activos',
      value: isLoading ? '…' : activeCourses.length,
      icon: <BookOpen className="size-5 text-primary" />,
    },
    {
      label: 'Clases publicadas',
      value: isLoading ? '…' : publishedClasses.length,
      icon: <GraduationCap className="size-5 text-success" />,
    },
    {
      label: 'Estudiantes (curso principal)',
      value: isLoading ? '…' : studentsFirstCourse.length,
      icon: <Users className="size-5 text-info" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Estadísticas del docente</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4 text-center"
            >
              <div className="size-9 rounded-full bg-background flex items-center justify-center shadow-xs">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Personal Info Card ────────────────────────────────────────────────────────

function PersonalInfoCard({ onEdit }: { onEdit: () => void }) {
  const { user } = useAuth();
  const initials = getInitials(`${user?.name ?? ''} ${user?.lastName ?? ''}`, 2);
  const fullName = [user?.name, user?.lastName].filter(Boolean).join(' ') || user?.name || '—';
  const roleLabel = ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—';
  const roleVariant = ROLE_VARIANTS[user?.role ?? ''] ?? 'secondary';

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Información personal</CardTitle>
        </CardHeading>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Editar perfil
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={fullName}
                className="size-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                <span className="text-2xl font-semibold text-primary">{initials || '?'}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3 min-w-0">
            <div>
              <p className="text-xl font-semibold leading-tight">{fullName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={roleVariant} appearance="light">
                {roleLabel}
              </Badge>
              {user?.institution && (
                <span className="text-sm text-muted-foreground">{user.institution}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProfileClient() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  const isTeacher = user.role === 'TEACHER' || user.role?.toLowerCase() === 'teacher';

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tu información personal y preferencias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <PersonalInfoCard onEdit={() => setEditOpen(true)} />
          <ChangePasswordSection />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AccountInfoSection />
          {isTeacher && <TeacherStatsSection />}
        </div>
      </div>

      <EditProfileModal open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
