import { Metadata } from 'next';
import { CoursesClient } from './courses-client';

export const metadata: Metadata = {
  title: 'Cursos',
};

export default function CoursesPage() {
  return <CoursesClient />;
}
