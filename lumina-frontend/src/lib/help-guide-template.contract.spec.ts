import { describe, expect, it } from 'vitest';
// Import side-effect: puebla `elementRegistry` con las 45 `ElementDefinition`
// reales del kit — si un tipo se retira/renombra, `elementRegistry.obtener`
// deja de encontrarlo y este test lo cacha (Regla 7 — ancla al catálogo
// real, no a un esquema paralelo inventado; corrección aplicada tras
// revisión del plan original de X.2).
import '@lumina/element-kit';
import { elementRegistry } from '@lumina/element-kit-core';
import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { classSlideToRendererSlide } from './class-slide-normalize';
import welcomeTeacherTemplate from '../../../lumina-backend/src/help-guide/templates/welcome-teacher.json';

interface TemplateBlock {
  tipo: string;
}

interface TemplateSlide {
  order: number;
  type: string;
  title: string;
  content: { bloques: TemplateBlock[] };
}

interface TemplateFile {
  templateKey: string;
  title: string;
  slides: TemplateSlide[];
}

const template = welcomeTeacherTemplate as unknown as TemplateFile;

describe('Contrato de "Guía de Lumina" (X.2) — welcome-teacher.json', () => {
  it('tiene al menos 1 diapositiva', () => {
    expect(template.slides.length).toBeGreaterThan(0);
  });

  it('cada bloque usa un tipo registrado hoy en elementRegistry', () => {
    for (const slide of template.slides) {
      for (const block of slide.content.bloques) {
        expect(elementRegistry.obtener(block.tipo)).toBeDefined();
      }
    }
  });

  it('la plantilla es SOLO bloques `texto` (decisión cerrada de X.2 — no inventar bloques nuevos)', () => {
    for (const slide of template.slides) {
      for (const block of slide.content.bloques) {
        expect(block.tipo).toBe('texto');
      }
    }
  });

  it('cada diapositiva pasa por el pipeline real de normalización sin romperse', () => {
    for (const slide of template.slides) {
      const apiSlide: ApiSlide = {
        id: `contract-${slide.order}`,
        order: slide.order,
        type: slide.type as ApiSlide['type'],
        title: slide.title,
        content: slide.content,
      };
      // Si el esquema de `texto` cambia de forma incompatible, esta llamada
      // (la misma que usa el editor y el visor de la guía) revienta o
      // devuelve bloques vacíos — cualquiera de las dos rompe el test.
      const rendered = classSlideToRendererSlide(apiSlide);
      expect(rendered.bloques?.length).toBe(slide.content.bloques.length);
      for (const bloque of rendered.bloques ?? []) {
        expect(bloque.tipo).toBe('texto');
      }
    }
  });
});
