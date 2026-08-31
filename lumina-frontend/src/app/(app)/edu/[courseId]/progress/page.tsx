import { Metadata } from 'next';

import { ProgressMapClient } from './progress-map-client';

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  return { title: `Mapa de progreso ${courseId}` };
}

export default async function EduProgressPage({ params }: Props) {
  const { courseId } = await params;
  return <ProgressMapClient courseId={courseId} />;
}
