import { ViewerClient } from './viewer-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewerPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <ViewerClient id={resolvedParams.id} />;
}
