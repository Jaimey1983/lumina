import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calificaciones',
};

export default function GradebookPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Calificaciones</h1>
      <p className="text-muted-foreground">Revisa y gestiona las calificaciones de los estudiantes.</p>
    </div>
  );
}
