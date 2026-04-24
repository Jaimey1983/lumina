import type { CSSProperties } from 'react';

export type BackgroundVariant = 'light' | 'dark';

export interface ClassBackground {
  id: string;
  name: string;
  variant: BackgroundVariant;
  style: CSSProperties;
}

export const CLASS_BACKGROUNDS: ClassBackground[] = [
  // ── Sólidos / Gradientes ──
  {
    id: 'none',
    name: 'Sin fondo',
    variant: 'light',
    style: { background: '#f9fafb' },
  },
  {
    id: 'blanco',
    name: 'Blanco',
    variant: 'light',
    style: { background: '#ffffff' },
  },
  {
    id: 'cielo',
    name: 'Cielo',
    variant: 'light',
    style: { background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    variant: 'light',
    style: { background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 50%, #faf5ff 100%)' },
  },
  // ── Geométricos ──
  {
    id: 'puntos',
    name: 'Puntos',
    variant: 'light',
    style: {
      backgroundColor: '#f9fafb',
      backgroundImage: 'radial-gradient(circle, #c7d2fe 1.2px, transparent 1.2px)',
      backgroundSize: '20px 20px',
    },
  },
  {
    id: 'cuadricula',
    name: 'Cuadrícula',
    variant: 'light',
    style: {
      backgroundColor: '#ffffff',
      backgroundImage:
        'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    variant: 'light',
    style: {
      backgroundColor: '#f9fafb',
      backgroundImage:
        'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 1px, transparent 1px, transparent 16px)',
    },
  },
  // ── Orgánicos ──
  {
    id: 'ondas',
    name: 'Ondas',
    variant: 'light',
    style: {
      backgroundColor: '#f9fafb',
      backgroundImage:
        'radial-gradient(ellipse 120% 60% at 50% 120%, #bfdbfe 0%, transparent 60%), radial-gradient(ellipse 80% 40% at 80% 80%, #c7d2fe 0%, transparent 50%)',
    },
  },
  {
    id: 'burbujas',
    name: 'Burbujas',
    variant: 'light',
    style: {
      backgroundColor: '#eff6ff',
      backgroundImage:
        'radial-gradient(circle 50px at 20% 25%, rgba(147,197,253,0.45) 0%, transparent 70%), radial-gradient(circle 32px at 75% 70%, rgba(196,181,253,0.35) 0%, transparent 70%), radial-gradient(circle 24px at 65% 30%, rgba(125,211,252,0.3) 0%, transparent 70%)',
    },
  },
  {
    id: 'mancha',
    name: 'Mancha',
    variant: 'light',
    style: {
      backgroundColor: '#f9fafb',
      backgroundImage:
        'radial-gradient(ellipse 55% 45% at 90% 10%, #dbeafe 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 10% 90%, #e0e7ff 0%, transparent 60%)',
    },
  },
  // ── Oscuros ──
  {
    id: 'indigo',
    name: 'Índigo',
    variant: 'dark',
    style: { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
  },
  {
    id: 'bosque',
    name: 'Bosque',
    variant: 'dark',
    style: { background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)' },
  },
  {
    id: 'noche',
    name: 'Noche',
    variant: 'dark',
    style: { background: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #0f172a 100%)' },
  },
];

export const DARK_BACKGROUNDS = CLASS_BACKGROUNDS.filter((b) => b.variant === 'dark').map(
  (b) => b.id,
);

export function getBackground(id: string): ClassBackground {
  return CLASS_BACKGROUNDS.find((b) => b.id === id) ?? CLASS_BACKGROUNDS[0];
}
