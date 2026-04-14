import { CheckCircle } from 'lucide-react';

export default function ClassEndedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <CheckCircle
        className="mb-6 size-24 shrink-0"
        strokeWidth={1.25}
        aria-hidden
        style={{ color: '#7C3AED' }}
      />
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        ¡Clase finalizada!
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground">
        Gracias por participar. Puedes cerrar esta ventana.
      </p>
    </div>
  );
}
