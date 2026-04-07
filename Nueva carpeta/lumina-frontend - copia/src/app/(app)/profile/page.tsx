import { Metadata } from 'next';
import { ProfileClient } from './profile-client';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
