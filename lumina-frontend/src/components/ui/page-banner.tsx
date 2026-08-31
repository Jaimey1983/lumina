'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Ruta fija de retorno (no uses history.back: falla si se entra por URL directa). */
  backHref?: string;
  backLabel?: string;
}

export function PageBanner({
  title,
  subtitle,
  action,
  backHref,
  backLabel = 'Volver',
}: PageBannerProps) {
  return (
    <div className="px-4 pt-4 pb-0 flex-shrink-0">
      <div
        className="relative w-full overflow-hidden rounded-lg px-6 py-6 flex items-center justify-between gap-4"
        style={{ background: '#2563EB', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}
      >
        <div
          className="absolute right-[-14px] top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ opacity: 0.13 }}
          aria-hidden
        >
          <svg viewBox="0 0 596 518.52" xmlns="http://www.w3.org/2000/svg" style={{ width: 130 }}>
            <polygon fill="#fff" stroke="#fff" strokeMiterlimit="10" strokeWidth="2" points="1 1 129.35 1 129.35 386.83 278.5 386.83 278.5 517.52 1 517.52 1 1"/>
            <polygon fill="#fff" stroke="#fff" strokeMiterlimit="10" strokeWidth="2" points="150.48 339.74 150.48 2.43 191.96 2.43 371.17 181.13 551.17 2.43 595 2.43 595 516.09 466.65 516.09 467.43 264.09 371.96 361.14 278.43 267.93 277.98 340 150.48 339.74"/>
          </svg>
        </div>
        <div className="relative z-10 flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[1.0625rem] font-extrabold text-white leading-tight">{title}</p>
            {subtitle && (
              <p className="text-[0.6875rem] text-white/65">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="relative z-10 flex-shrink-0">{action}</div>
        )}
      </div>
    </div>
  );
}
