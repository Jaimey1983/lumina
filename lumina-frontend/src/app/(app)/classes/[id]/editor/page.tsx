import { Metadata } from 'next';
import { SlideEditorClient } from './editor-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Editor de slides — Clase ${id}` };
}

export default async function SlideEditorPage({ params }: Props) {
  const { id } = await params;
  return <SlideEditorClient classId={id} />;
}
