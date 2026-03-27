import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Curso ${id}`,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Detalle del Curso</h1>
      <p className="text-muted-foreground">ID del curso: {id}</p>
    </div>
  );
}
