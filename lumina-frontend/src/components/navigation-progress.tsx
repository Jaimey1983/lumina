'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Barra inmediata al hacer clic en un enlace interno. No espera a que Next
 * compile la ruta: el usuario ve feedback en el mismo instante del clic.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathnameRef.current && url.search === window.location.search) return;

      setPending(true);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!pending) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-[#dbeafe]"
      role="progressbar"
      aria-label="Cargando página"
    >
      <div className="h-full w-1/3 animate-[navprogress_1s_ease-in-out_infinite] bg-[#2563EB]" />
      <style>{`
        @keyframes navprogress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
