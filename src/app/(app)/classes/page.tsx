import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clases',
};

export default function ClassesPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Clases</h1>
      <p className="text-muted-foreground">Gestiona las clases y sesiones de aprendizaje.</p>
    </div>
  );
}
