'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle, Pencil, Plus, PowerOff, Search, ShieldOff, Users } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserStatus,
  type ApiUser,
} from '@/hooks/api/use-users';

import {
  Card,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Estudiante' },
  { value: 'TEACHER', label: 'Docente' },
  { value: 'ADMIN', label: 'Administrador' },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SUPERADMIN: 'Superadmin',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
  admin: 'Admin',
  teacher: 'Docente',
  student: 'Estudiante',
};

const ROLE_VARIANTS: Record<string, 'primary' | 'success' | 'secondary' | 'warning'> = {
  ADMIN: 'primary',
  SUPERADMIN: 'warning',
  TEACHER: 'success',
  STUDENT: 'secondary',
  admin: 'primary',
  teacher: 'success',
  student: 'secondary',
};

function isAdmin(role?: string) {
  const r = role?.toUpperCase();
  return r === 'ADMIN' || r === 'SUPERADMIN';
}

function formatDateShort(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Create User Modal ─────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.string().min(1, 'Selecciona un rol'),
  institution: z.string().optional(),
});
type CreateFormData = z.infer<typeof createSchema>;

function CreateUserModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useCreateUser();
  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', lastName: '', email: '', password: '', role: 'STUDENT', institution: '' },
  });

  useEffect(() => {
    if (open) form.reset({ name: '', lastName: '', email: '', password: '', role: 'STUDENT', institution: '' });
  }, [open, form]);

  function onSubmit(data: CreateFormData) {
    mutation.mutate(
      { ...data, institution: data.institution || undefined },
      {
        onSuccess: () => {
          toast.success('Usuario creado');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al crear el usuario'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
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
                      <FormControl><Input placeholder="Nombre" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="Apellido" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="h-9 w-full px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
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
                    <FormLabel>
                      Institución{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl><Input placeholder="Universidad, empresa..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit User Modal ───────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  institution: z.string().optional(),
  role: z.string().min(1, 'Selecciona un rol'),
});
type EditFormData = z.infer<typeof editSchema>;

function EditUserModal({
  user,
  open,
  onOpenChange,
}: {
  user: ApiUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateUser(user?.id ?? '');
  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', lastName: '', institution: '', role: 'STUDENT' },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name ?? '',
        lastName: user.lastName ?? '',
        institution: user.institution ?? '',
        role: user.role ?? 'STUDENT',
      });
    }
  }, [open, user, form]);

  function onSubmit(data: EditFormData) {
    mutation.mutate(
      { name: data.name, lastName: data.lastName, institution: data.institution || undefined, role: data.role },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al actualizar el usuario'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
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
                      <FormControl><Input placeholder="Nombre" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="Apellido" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="Universidad, empresa..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="h-9 w-full px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
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

// ─── Users Table ───────────────────────────────────────────────────────────────

function UsersTable({
  users,
  onEdit,
  onToggle,
}: {
  users: ApiUser[];
  onEdit: (user: ApiUser) => void;
  onToggle: (user: ApiUser) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre completo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => {
          const fullName = [u.name, u.lastName].filter(Boolean).join(' ') || u.name;
          const active = u.isActive !== false;
          return (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{fullName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
              <TableCell>
                <Badge
                  variant={ROLE_VARIANTS[u.role] ?? 'secondary'}
                  appearance="light"
                >
                  {ROLE_LABELS[u.role] ?? u.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={active ? 'success' : 'secondary'} appearance="light">
                  {active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDateShort(u.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(u)}
                    title="Editar usuario"
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={active ? 'text-destructive hover:text-destructive' : ''}
                    onClick={() => onToggle(u)}
                    title={active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {active ? (
                      <><PowerOff className="size-4" /> Desactivar</>
                    ) : (
                      <><ShieldOff className="size-4" /> Activar</>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function UsersClient() {
  const { user: authUser } = useAuth();
  const { data: users = [], isLoading, isError } = useUsers();
  const toggleMutation = useToggleUserStatus();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, search]);

  // Access guard (después de todos los hooks)
  if (!isAdmin(authUser?.role)) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="size-7 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-lg">Sin acceso</p>
            <p className="text-sm text-muted-foreground mt-1">
              No tienes acceso a esta sección.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function handleEdit(u: ApiUser) {
    setEditUser(u);
    setEditOpen(true);
  }

  function handleToggle(u: ApiUser) {
    const active = u.isActive !== false;
    toggleMutation.mutate(
      { userId: u.id, isActive: !active },
      {
        onSuccess: () => toast.success(active ? 'Usuario desactivado' : 'Usuario activado'),
        onError: () => toast.error('Error al cambiar el estado del usuario'),
      },
    );
  }

  return (
    <div className="container py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los usuarios de la plataforma.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon><AlertCircle /></AlertIcon>
          <AlertContent><AlertTitle>No se pudieron cargar los usuarios.</AlertTitle></AlertContent>
        </Alert>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Todos los usuarios</CardTitle>
          </CardHeading>
          {!isLoading && (
            <CardToolbar>
              <span className="text-sm text-muted-foreground">
                {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
              </span>
            </CardToolbar>
          )}
        </CardHeader>
        <CardTable>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Users className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Sin resultados para la búsqueda.' : 'No hay usuarios aún.'}
              </p>
            </div>
          ) : (
            <UsersTable users={filtered} onEdit={handleEdit} onToggle={handleToggle} />
          )}
        </CardTable>
      </Card>

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserModal
        key={editUser?.id ?? 'edit'}
        user={editUser}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditUser(null);
        }}
      />
    </div>
  );
}
