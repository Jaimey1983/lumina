import { Metadata } from 'next';
import { JoinClient } from './join-client';

interface Props {
  params: Promise<{ codigo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Unirse a la clase · ${codigo}`,
  };
}

export default async function JoinPage({ params }: Props) {
  const { codigo } = await params;
  return <JoinClient codigo={codigo} />;
}
