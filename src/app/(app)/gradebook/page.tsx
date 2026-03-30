import { Metadata } from 'next';
import { GradebookClient } from './gradebook-client';

export const metadata: Metadata = {
  title: 'Calificaciones',
};

export default function GradebookPage() {
  return <GradebookClient />;
}
