'use client';

import { useEffect } from 'react';

import { buildGoogleFontsUrl, isSystemFont, resolveFontFamily } from '@/lib/font-catalog';

const loadedFamilies = new Set<string>();
let preconnectDone = false;

function ensurePreconnect() {
  if (preconnectDone || typeof document === 'undefined') return;
  preconnectDone = true;
  const origins = [
    { href: 'https://fonts.googleapis.com' },
    { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  ];
  for (const origin of origins) {
    const existing = document.head.querySelector(
      `link[rel="preconnect"][href="${origin.href}"]`,
    );
    if (existing) continue;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin.href;
    if (origin.crossOrigin) link.crossOrigin = origin.crossOrigin;
    document.head.appendChild(link);
  }
}

/** Carga incremental de Google Fonts. Idempotente: no vuelve a pedir una familia ya inyectada. */
export function ensureGoogleFonts(families: Iterable<string>): void {
  if (typeof document === 'undefined') return;
  const missing = [...new Set([...families].map((f) => resolveFontFamily(f)))].filter(
    (familia) => !loadedFamilies.has(familia) && !isSystemFont(familia),
  );
  const href = buildGoogleFontsUrl(missing);
  if (!href) return;
  ensurePreconnect();
  for (const familia of missing) loadedFamilies.add(familia);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export function GoogleFontsLoader({ families }: { families: Iterable<string> }) {
  const list = [...families].join('\0');
  useEffect(() => {
    if (!list) return;
    ensureGoogleFonts(list.split('\0'));
  }, [list]);
  return null;
}
