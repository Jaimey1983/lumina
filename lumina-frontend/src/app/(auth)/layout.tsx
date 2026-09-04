import { ReactNode } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
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
          {/* Foto de fondo */}
          <Image
            src="/images/auth/lumina_login.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 58vw, 50vw"
            className="object-cover"
          />

          {/* Tinte azul + degradado lateral para legibilidad del texto */}
          <div className="absolute inset-0 bg-[#2563EB]/30" />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(30,58,138,0.85)_0%,rgba(30,64,175,0.45)_45%,rgba(37,99,235,0.1)_100%)]" />

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
              <img
                src="/lumina-logo-white.svg"
                alt="Lumina"
                className="h-7 w-auto"
              />
              <span className="text-lg font-bold tracking-tight">Lumina</span>
            </div>

            <div className="max-w-lg space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/25">
                <Sparkles className="size-3.5" strokeWidth={2.5} />
                Aprender ya no es aburrido
              </span>
              <h2
                className="font-display text-[2.75rem] font-extrabold uppercase leading-[0.95] tracking-tight xl:text-[3.25rem]"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                Convierte cada clase en una experiencia
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-white/85">
                Diseña, presenta y evalúa en un solo lugar. Actividades
                interactivas, gamificación y analítica en vivo que mantienen a
                tus estudiantes despiertos.
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
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#2563EB] ring-1 ring-[#2563EB]/20">
              <img
                src="/lumina-logo-white.svg"
                alt="Lumina"
                className="h-4 w-auto"
              />
            </span>
            <span className="text-base font-bold text-foreground">Lumina</span>
          </div>

          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
    </AuthRouteGuard>
  );
}
