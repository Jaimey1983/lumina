import { describe, expect, it } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { FlipCardsWidget } from '@/types/slide.types';
import type { ClickRevealWidget, TabsWidget, TimelineWidget } from '@/types/widget.types';
import {
  classSlideToRendererSlide,
  sanitizeSlideContentForPersistence,
} from './class-slide-normalize';
import { normalizeTabsWidget } from '@/components/widgets/tabs/tabs-config';
import { normalizeFlipCardsWidget } from '@/components/widgets/flip-cards/flip-cards-config';
import { normalizeClickRevealWidget } from '@/components/widgets/click-reveal/click-reveal-config';

function apiSlide(bloques: unknown[]): ApiSlide {
  return {
    id: 'slide_test',
    order: 0,
    type: 'CONTENT',
    title: 'Test',
    content: { bloques },
  };
}

describe('widget hydrate + persist (PR A)', () => {
  it('Tabs sin fichas ni configuracion: pad 3, clamp, IDs estables e idempotente', () => {
    const raw = {
      tipo: 'tabs',
      x: 5,
      y: 5,
      ancho: 90,
      alto: 90,
    } as TabsWidget;

    const first = normalizeTabsWidget(raw);
    const second = normalizeTabsWidget(first);

    expect(first.configuracion.numeroFichas).toBe(3);
    expect(first.fichas).toHaveLength(3);
    expect(first.fichas.map((f) => f.id)).toEqual(second.fichas.map((f) => f.id));
    expect(first.fichas[0]?.id).toContain('tabs:5:5:90:90:ficha:1');
  });

  it('numeroFichas fuera de rango se clampa a 2–6', () => {
    const tooFew = normalizeTabsWidget({
      tipo: 'tabs',
      x: 0,
      y: 0,
      ancho: 90,
      alto: 90,
      configuracion: { numeroFichas: 1 },
    } as unknown as TabsWidget);
    expect(tooFew.configuracion.numeroFichas).toBe(2);
    expect(tooFew.fichas).toHaveLength(2);

    const tooMany = normalizeTabsWidget({
      tipo: 'tabs',
      x: 0,
      y: 0,
      ancho: 90,
      alto: 90,
      configuracion: { numeroFichas: 9 },
    } as unknown as TabsWidget);
    expect(tooMany.configuracion.numeroFichas).toBe(6);
    expect(tooMany.fichas).toHaveLength(6);
  });

  it('Flip Cards vacío rellena 3 tarjetas con ids estables', () => {
    const raw = {
      tipo: 'flip-cards',
      x: 10,
      y: 8,
      ancho: 80,
      alto: 80,
    } as FlipCardsWidget;

    const a = normalizeFlipCardsWidget(raw);
    const b = normalizeFlipCardsWidget(raw);
    expect(a.tarjetas).toHaveLength(3);
    expect(a.tarjetas.map((t) => t.id)).toEqual(b.tarjetas.map((t) => t.id));
  });

  it('CTR legacy base/overlay migra a triggers+overlays y es idempotente', () => {
    const legacy = {
      tipo: 'click-reveal',
      x: 5,
      y: 5,
      ancho: 90,
      alto: 90,
      configuracion: { numeroElementos: 3 },
      base: { encabezado: 'Hola legado', cuerpo: 'Cuerpo legado' },
    } as unknown as ClickRevealWidget;

    const first = normalizeClickRevealWidget(legacy);
    const second = normalizeClickRevealWidget(first);

    expect(first.triggers).toHaveLength(3);
    expect(first.overlays).toHaveLength(3);
    expect(first.overlays[0]?.encabezado).toBe('Hola legado');
    expect(first.triggers.map((t) => t.id)).toEqual(second.triggers.map((t) => t.id));
    expect(first.overlays.map((o) => o.id)).toEqual(second.overlays.map((o) => o.id));
  });

  it('sanitizeSlideContentForPersistence hidrata widgets igual que la lectura', () => {
    const rawBloques = [
      { tipo: 'tabs', x: 5, y: 5, ancho: 90, alto: 90 },
      { tipo: 'timeline', x: 10, y: 10, ancho: 80, alto: 70, configuracion: { numeroNodos: 1 } },
    ];
    const rendered = classSlideToRendererSlide(apiSlide(rawBloques));
    const persisted = sanitizeSlideContentForPersistence({ bloques: rawBloques });
    const readBloques = rendered.bloques ?? [];
    const persistedBloques = (persisted?.bloques ?? []) as Array<TabsWidget | TimelineWidget>;

    const tabsRead = readBloques[0] as TabsWidget;
    const tabsSaved = persistedBloques[0] as TabsWidget;
    expect(tabsSaved.fichas).toHaveLength(3);
    expect(tabsSaved.fichas.map((f) => f.id)).toEqual(tabsRead.fichas.map((f) => f.id));

    const tlSaved = persistedBloques[1] as TimelineWidget;
    expect(tlSaved.configuracion.numeroNodos).toBe(2);
    expect(tlSaved.nodos).toHaveLength(2);
  });
});
