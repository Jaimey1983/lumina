import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido a Lumina. Aquí verás un resumen de tu actividad.</p>
    </div>
  );
}
