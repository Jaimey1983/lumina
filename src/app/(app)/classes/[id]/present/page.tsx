import { PresentClient } from './present-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PresentPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <PresentClient id={resolvedParams.id} />;
}
