import type { Metadata } from 'next';
import { AutonomoClient } from './autonomo-client';

export const metadata: Metadata = {
  title: 'Tarea autónoma | Lumina',
  description: 'Completa tu tarea autónoma en Lumina',
};

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AutonomoPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <AutonomoClient sessionId={sessionId} />;
}
