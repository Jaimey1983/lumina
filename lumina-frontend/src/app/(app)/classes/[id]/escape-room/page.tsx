import { Metadata } from 'next';
import { EscapeRoomDesignerClient } from './escape-room-designer-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Editor Escape Room — Clase ${id}` };
}

export default async function EscapeRoomDesignerPage({ params }: Props) {
  const { id } = await params;
  return <EscapeRoomDesignerClient key={id} classId={id} />;
}
