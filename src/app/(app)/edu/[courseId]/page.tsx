import { Metadata } from 'next';
import { GradeBookClient } from './grade-book-client';

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  return {
    title: `Lumina Edu ${courseId}`,
  };
}

export default async function EduCoursePage({ params }: Props) {
  const { courseId } = await params;
  return <GradeBookClient courseId={courseId} />;
}