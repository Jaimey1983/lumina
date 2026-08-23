import { PreviewClient } from './preview-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <PreviewClient id={resolvedParams.id} />;
}
