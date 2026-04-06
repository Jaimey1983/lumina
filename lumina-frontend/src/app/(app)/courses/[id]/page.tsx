import { Metadata } from 'next';
import { CourseDetailClient } from './course-detail-client';

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
  return <CourseDetailClient id={id} />;
}
