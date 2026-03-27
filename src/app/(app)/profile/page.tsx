import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil',
};

export default function ProfilePage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Perfil</h1>
      <p className="text-muted-foreground">Gestiona tu información personal y preferencias.</p>
    </div>
  );
}
