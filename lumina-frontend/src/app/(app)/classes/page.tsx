import { Metadata } from 'next';
import { ClassesClient } from './classes-client';

export const metadata: Metadata = {
  title: 'Clases',
};

export default function ClassesPage() {
  return <ClassesClient />;
}
