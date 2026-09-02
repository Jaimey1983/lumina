import { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { AuthRouteGuard } from './auth-route-guard';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthRouteGuard>
      <div className="flex min-h-screen w-full">
        {/* ── Panel izquierdo — marca / ilustración ─────────────────────────── */}
        <aside
          className="relative hidden w-1/2 overflow-hidden lg:flex xl:w-[58%]"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#2563EB_0%,#60A5FA_100%)]" />

          {/* Trama de puntos */}
          <svg className="absolute inset-0 h-full w-full text-white opacity-[0.12]">
            <defs>
              <pattern
                id="auth-dots"
                x="0"
                y="0"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-dots)" />
          </svg>

          {/* Halos suaves */}
          <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-white/10 blur-3xl" />

          {/* Contenido */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <GraduationCap className="size-5" strokeWidth={2} />
              </span>
              <span className="text-lg font-bold tracking-tight">Lumina</span>
            </div>

            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-bold leading-tight">
                Crea clases interactivas que enganchan.
              </h2>
              <p className="text-white/80">
                Diseña, presenta y evalúa en un mismo lugar: actividades,
                gamificación y analítica para tu aula.
              </p>
            </div>

            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Lumina · Plataforma educativa
            </p>
          </div>
        </aside>

        {/* ── Panel derecho — formulario ───────────────────────────────────── */}
        <main className="relative flex flex-1 items-center justify-center bg-background px-6 py-12 sm:px-12">
          {/* Logo (solo cuando el panel izquierdo está oculto) */}
          <div className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-10 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <GraduationCap className="size-4" strokeWidth={2} />
            </span>
            <span className="text-base font-bold text-foreground">Lumina</span>
          </div>

          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
    </AuthRouteGuard>
  );
}
