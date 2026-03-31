import { Metadata } from 'next';
import { UsersClient } from './users-client';

export const metadata: Metadata = {
  title: 'Usuarios',
};

export default function UsersPage() {
  return <UsersClient />;
}
