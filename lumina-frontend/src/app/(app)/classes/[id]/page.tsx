import { Metadata } from 'next';
import { ClassDetailClient } from './class-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Clase ${id}`,
  };
}

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params;
  return <ClassDetailClient id={id} />;
}
