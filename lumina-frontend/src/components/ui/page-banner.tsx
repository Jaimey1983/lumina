import { type ReactNode } from 'react';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageBanner({ title, subtitle, action }: PageBannerProps) {
  return (
    <div className="px-4 pt-4 pb-0 flex-shrink-0">
      <div
        className="relative w-full overflow-hidden rounded-lg px-6 py-6 flex items-center justify-between"
        style={{ background: '#2563EB', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}
      >
        {/* Isotipo decorativo — blanco, opacidad baja, derecha */}
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
        {/* Contenido */}
        <div className="relative z-10 flex flex-col gap-0.5">
          <p className="text-[1.0625rem] font-extrabold text-white leading-tight">{title}</p>
          {subtitle && (
            <p className="text-[0.6875rem] text-white/65">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="relative z-10 flex-shrink-0">{action}</div>
        )}
      </div>
    </div>
  );
}
