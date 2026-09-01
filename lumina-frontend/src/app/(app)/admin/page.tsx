import { Metadata } from 'next';

import { AdminClient } from './admin-client';

export const metadata: Metadata = {
  title: 'Panel Admin',
};

export default function AdminPage() {
  return <AdminClient />;
}
