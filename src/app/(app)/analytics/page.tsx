import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
};

export default function AnalyticsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Analytics</h1>
      <p className="text-muted-foreground">Reportes y métricas de la plataforma educativa.</p>
    </div>
  );
}
