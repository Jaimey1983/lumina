import { Metadata } from 'next';
import { EduHomeClient } from './edu-home-client';

export const metadata: Metadata = {
  title: 'Lumina Edu',
};

export default function EduPage() {
  return <EduHomeClient />;
}