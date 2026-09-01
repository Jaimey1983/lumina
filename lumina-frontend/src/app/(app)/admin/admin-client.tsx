'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  KeyRound,
  LogIn,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Trash2,
} from 'lucide-react';

import { PageBanner } from '@/components/ui/page-banner';
import { useAuth } from '@/hooks/use-auth';
import {
  useAdminUserAction,
  useAdminUsers,
  useAuditLogs,
  useCreateInvitationCode,
  useCreateTrustedDomain,
  useDeleteTrustedDomain,
  useImpersonate,
  useInvitationCodes,
  useRevokeInvitationCode,
  useTrustedDomains,
  type AdminUser,
} from '@/hooks/api/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function isAdminRole(role?: string) {
  const r = role?.toUpperCase();
  return r === 'ADMIN' || r === 'SUPERADMIN';
}

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  DEPARTMENT_HEAD: 'Jefe de área',
  TEACHER: 'Docente',
  TEACHER_ASSISTANT: 'Aux. docente',
  STUDENT: 'Estudiante',
  PARENT: 'Acudiente',
  GUEST: 'Invitado',
};

const STATUS_META: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }
> = {
  VERIFIED: { label: 'Verificado', variant: 'success' },
  PENDING: { label: 'Pendiente', variant: 'warning' },
  EXPIRED: { label: 'Expirado', variant: 'destructive' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
  NONE: { label: 'Sin verificar', variant: 'secondary' },
};

function fmtDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export function AdminClient() {
  const { user } = useAuth();

  if (!isAdminRole(user?.role)) {
    return (
      <div className="w-full p-6">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldOff className="size-7 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-semibold">Sin acceso</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta sección es sólo para administradores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col pb-6">
      <PageBanner
        title="Panel Admin"
        subtitle="Operación de la plataforma: usuarios, verificación docente y auditoría"
        backHref="/dashboard"
      />
      <div className="px-6 pt-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="verification">Verificación</TabsTrigger>
            <TabsTrigger value="access">Acceso</TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="verification" className="mt-4">
            <VerificationTab />
          </TabsContent>
          <TabsContent value="access" className="mt-4">
            <AccessTab />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Tab: Usuarios ───────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      role: role || undefined,
      verificationStatus: status || undefined,
      includeDeleted: showDeleted,
      page,
      pageSize: 25,
    }),
    [search, role, status, showDeleted, page],
  );

  const { data, isLoading, isError } = useAdminUsers(filters);
  const action = useAdminUserAction();
  const impersonate = useImpersonate();

  type SimpleKind =
    | 'suspend'
    | 'reactivate'
    | 'softDelete'
    | 'restore'
    | 'resetPassword';

  const run = (u: AdminUser, kind: SimpleKind) => {
    if (kind === 'softDelete' && !window.confirm(`¿Eliminar (soft) a ${u.email}?`))
      return;
    action.mutate(
      { id: u.id, action: { kind } },
      {
        onSuccess: (res: unknown) => {
          if (kind === 'resetPassword') {
            const tmp = (res as { temporaryPassword?: string })?.temporaryPassword;
            toast.success(`Contraseña temporal: ${tmp}`, { duration: 12000 });
          } else {
            toast.success('Acción aplicada');
          }
        },
        onError: (e: unknown) =>
          toast.error(
            (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'No se pudo aplicar la acción',
          ),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-64"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Cualquier verificación</option>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <option key={v} value={v}>
              {m.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => {
              setShowDeleted(e.target.checked);
              setPage(1);
            }}
          />
          Incluir eliminados
        </label>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          No se pudo cargar la lista de usuarios.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Verificación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {data?.data.map((u) => {
              const sm = u.verificationStatus
                ? STATUS_META[u.verificationStatus]
                : null;
              const isTeacher =
                u.role === 'TEACHER' || u.role === 'TEACHER_ASSISTANT';
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">
                      {u.name} {u.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sm ? (
                      <Badge variant={sm.variant}>{sm.label}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isTeacher ? '—' : 'No aplica'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.deletedAt ? (
                      <Badge variant="destructive">Eliminado</Badge>
                    ) : u.isActive ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="warning">Suspendido</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {u.deletedAt ? (
                        <IconBtn
                          title="Restaurar"
                          onClick={() => run(u, 'restore')}
                        >
                          <RotateCcw className="size-4" />
                        </IconBtn>
                      ) : (
                        <>
                          {u.isActive ? (
                            <IconBtn
                              title="Suspender"
                              onClick={() => run(u, 'suspend')}
                            >
                              <ShieldOff className="size-4" />
                            </IconBtn>
                          ) : (
                            <IconBtn
                              title="Reactivar"
                              onClick={() => run(u, 'reactivate')}
                            >
                              <ShieldCheck className="size-4" />
                            </IconBtn>
                          )}
                          {u.role !== 'SUPERADMIN' && (
                            <IconBtn
                              title="Entrar como este usuario (soporte)"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Iniciar sesión de soporte como ${u.email}? Se registrará en la auditoría.`,
                                  )
                                ) {
                                  impersonate.mutate(u.id, {
                                    onError: (e: unknown) =>
                                      toast.error(
                                        (e as { response?: { data?: { message?: string } } })
                                          ?.response?.data?.message ??
                                          'No se pudo iniciar la sesión de soporte',
                                      ),
                                  });
                                }
                              }}
                            >
                              <LogIn className="size-4" />
                            </IconBtn>
                          )}
                          <IconBtn
                            title="Resetear contraseña"
                            onClick={() => run(u, 'resetPassword')}
                          >
                            <KeyRound className="size-4" />
                          </IconBtn>
                          <IconBtn
                            title="Eliminar (soft)"
                            onClick={() => run(u, 'softDelete')}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {data && data.data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <Pager
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

// ─── Tab: Verificación ──────────────────────────────────────────────────────

function VerificationTab() {
  const [status, setStatus] = useState<'NONE' | 'PENDING' | 'EXPIRED' | 'REJECTED'>(
    'PENDING',
  );
  const { data, isLoading } = useAdminUsers({
    verificationStatus: status,
    role: 'TEACHER',
    pageSize: 50,
  });
  const action = useAdminUserAction();

  const decide = (u: AdminUser, approve: boolean) => {
    if (approve) {
      action.mutate(
        { id: u.id, action: { kind: 'verify' } },
        {
          onSuccess: () => toast.success(`${u.email} verificado`),
          onError: () => toast.error('No se pudo verificar'),
        },
      );
      return;
    }
    const reason = window.prompt('Motivo del rechazo:');
    if (!reason || reason.trim().length < 5) return;
    action.mutate(
      { id: u.id, action: { kind: 'reject', reason: reason.trim() } },
      {
        onSuccess: () => toast.success(`${u.email} rechazado`),
        onError: () => toast.error('No se pudo rechazar'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'EXPIRED', 'REJECTED', 'NONE'] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? 'primary' : 'outline'}
            onClick={() => setStatus(s)}
          >
            {STATUS_META[s].label}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Docente</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead className="text-right">Decisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">
                    {u.name} {u.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {u.institution ?? u.institutionalEmail ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.verificationMethod ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(u.verificationExpiresAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => decide(u, true)}
                    >
                      <ShieldCheck className="mr-1 size-4" /> Verificar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(u, false)}
                    >
                      <ShieldX className="mr-1 size-4" /> Rechazar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data && data.data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nada en la cola.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Tab: Acceso (códigos + dominios) ───────────────────────────────────────

function AccessTab() {
  const codes = useInvitationCodes();
  const domains = useTrustedDomains();
  const createCode = useCreateInvitationCode();
  const revokeCode = useRevokeInvitationCode();
  const createDomain = useCreateTrustedDomain();
  const deleteDomain = useDeleteTrustedDomain();

  const [note, setNote] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [domain, setDomain] = useState('');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Códigos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Códigos de invitación</h3>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            createCode.mutate(
              {
                note: note.trim() || undefined,
                maxUses: Number(maxUses) || 1,
                expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
              },
              {
                onSuccess: (c) => {
                  toast.success(`Código creado: ${c.code}`, { duration: 10000 });
                  setNote('');
                },
                onError: () => toast.error('No se pudo crear el código'),
              },
            );
          }}
        >
          <Input
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 w-40"
          />
          <Input
            type="number"
            min={1}
            max={100}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="h-9 w-20"
            title="Usos máximos"
          />
          <Input
            type="number"
            min={1}
            placeholder="días"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="h-9 w-20"
            title="Expira en (días)"
          />
          <Button size="sm" type="submit" disabled={createCode.isPending}>
            Generar
          </Button>
        </form>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell className="text-sm">
                    {c.usedCount}/{c.maxUses}
                  </TableCell>
                  <TableCell>
                    {c.revokedAt ? (
                      <Badge variant="destructive">Revocado</Badge>
                    ) : c.usedCount >= c.maxUses ? (
                      <Badge variant="secondary">Agotado</Badge>
                    ) : (
                      <Badge variant="success">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.revokedAt && (
                      <IconBtn
                        title="Revocar"
                        onClick={() =>
                          revokeCode.mutate(c.id, {
                            onSuccess: () => toast.success('Código revocado'),
                          })
                        }
                      >
                        <ShieldX className="size-4 text-destructive" />
                      </IconBtn>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {codes.data?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Sin códigos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dominios */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Dominios de confianza</h3>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const d = domain.trim().toLowerCase().replace(/^@/, '');
            if (!d) return;
            createDomain.mutate(
              { domain: d, autoVerify: true },
              {
                onSuccess: () => {
                  toast.success('Dominio agregado');
                  setDomain('');
                },
                onError: () => toast.error('Dominio inválido o duplicado'),
              },
            );
          }}
        >
          <Input
            placeholder="colegio.edu.co"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="h-9 w-56"
          />
          <Button size="sm" type="submit" disabled={createDomain.isPending}>
            Agregar
          </Button>
        </form>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dominio</TableHead>
                <TableHead>Auto-verifica</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.data?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">{d.domain}</TableCell>
                  <TableCell>
                    <Badge variant={d.autoVerify ? 'success' : 'secondary'}>
                      {d.autoVerify ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <IconBtn
                      title="Eliminar"
                      onClick={() =>
                        deleteDomain.mutate(d.id, {
                          onSuccess: () => toast.success('Dominio eliminado'),
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </IconBtn>
                  </TableCell>
                </TableRow>
              ))}
              {domains.data?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Sin dominios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

// ─── Tab: Auditoría ─────────────────────────────────────────────────────────

function AuditTab() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs({
    action: action || undefined,
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filtrar por acción (ej: USER_SUSPEND)"
        value={action}
        onChange={(e) => {
          setAction(e.target.value.toUpperCase());
          setPage(1);
        }}
        className="h-9 w-72"
      />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Sobre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString('es-CO')}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.admin
                    ? `${log.admin.name} ${log.admin.lastName}`
                    : '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.targetUser ? log.targetUser.email : '—'}
                </TableCell>
              </TableRow>
            ))}
            {data && data.data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sin registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data && data.meta.totalPages > 1 && (
        <Pager
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

// ─── Primitivos ─────────────────────────────────────────────────────────────

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </Button>
    </div>
  );
}
