import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursos',
};

export default function CoursesPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Cursos</h1>
      <p className="text-muted-foreground">Explora y gestiona todos los cursos disponibles.</p>
    </div>
  );
}
