import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Usuarios',
};

export default function UsersPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Gestión de Usuarios</h1>
      <p className="text-muted-foreground">Administra los usuarios de la plataforma (solo administradores).</p>
    </div>
  );
}
