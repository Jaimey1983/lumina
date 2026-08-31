import { describe, expect, it } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { FlipCardsWidget } from '@/types/slide.types';
import type { ClickRevealWidget, RuletaWidget, TabsWidget, TimelineWidget } from '@/types/widget.types';
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

  it('convierte ruleta G4 legado a widget en lectura y persistencia', () => {
    const legado = {
      tipo: 'actividad',
      actividad: {
        tipo: 'ruleta',
        configuracion: {
          colores: ['#111111', '#222222'],
          sonido: false,
          duracionGiro: 2000,
          mostrarGanador: true,
        },
        items: [
          { id: 'a', texto: 'Rojo' },
          { id: 'b', texto: 'Azul' },
        ],
      },
      marco: { izquierdaPct: 8, arribaPct: 12, anchoPct: 70, altoPct: 60 },
    };
    const rendered = classSlideToRendererSlide(apiSlide([legado]));
    const widget = (rendered.bloques ?? [])[0] as RuletaWidget;
    expect(widget.tipo).toBe('ruleta');
    expect(widget.items.map((i) => i.texto)).toEqual(['Rojo', 'Azul']);
    expect(widget.x).toBe(8);

    const persisted = sanitizeSlideContentForPersistence({ bloques: [legado] });
    const saved = ((persisted?.bloques ?? []) as RuletaWidget[])[0];
    expect(saved.tipo).toBe('ruleta');
    expect(saved.items.map((i) => i.texto)).toEqual(['Rojo', 'Azul']);
  });

  it('normaliza bloque grafico asegurando modo contenido y soloLectura', () => {
    const rawGrafico = {
      tipo: 'grafico',
      chartType: 'column',
      categorias: ['Ene', 'Feb'],
      series: [{ nombre: 'Ventas', valores: [100, 200] }],
    };

    const rendered = classSlideToRendererSlide(apiSlide([rawGrafico]));
    const grafico = (rendered.bloques ?? [])[0] as import('@/types/slide.types').GraficoDatosBlock;

    expect(grafico.tipo).toBe('grafico');
    expect(grafico.modo).toBe('contenido');
    expect(grafico.soloLecturaEnViewer).toBe(true);
    expect(grafico.chartType).toBe('column');
    expect(grafico.categorias).toEqual(['Ene', 'Feb']);
    expect(grafico.series[0].valores).toEqual([100, 200]);

    const persisted = sanitizeSlideContentForPersistence({ bloques: [rawGrafico] });
    const saved = ((persisted?.bloques ?? []) as import('@/types/slide.types').GraficoDatosBlock[])[0];
    expect(saved.tipo).toBe('grafico');
    expect(saved.modo).toBe('contenido');
    expect(saved.soloLecturaEnViewer).toBe(true);
  });

  it('normaliza bloque diagrama asegurando modo contenido, soloLectura y aristas válidas', () => {
    const rawDiagrama = {
      tipo: 'diagrama',
      subtipo: 'mapa_mental',
      nodos: [
        { id: 'raiz', etiqueta: 'Raíz', x: 200, y: 100 },
        { id: 'hijo', etiqueta: 'Hijo', x: 100, y: 50 },
      ],
      aristas: [
        { id: 'a1', desdeId: 'raiz', haciaId: 'hijo' },
        { id: 'a2', desdeId: 'raiz', haciaId: 'inexistente' },
      ],
    };

    const rendered = classSlideToRendererSlide(apiSlide([rawDiagrama]));
    const diagrama = (rendered.bloques ?? [])[0] as import('@/types/slide.types').DiagramaGrafoBlock;

    expect(diagrama.tipo).toBe('diagrama');
    expect(diagrama.subtipo).toBe('mapa_mental');
    expect(diagrama.modo).toBe('contenido');
    expect(diagrama.soloLecturaEnViewer).toBe(true);
    expect(diagrama.nodos).toHaveLength(2);
    expect(diagrama.aristas).toHaveLength(1);

    const persisted = sanitizeSlideContentForPersistence({ bloques: [rawDiagrama] });
    const saved = ((persisted?.bloques ?? []) as import('@/types/slide.types').DiagramaGrafoBlock[])[0];
    expect(saved.tipo).toBe('diagrama');
    expect(saved.modo).toBe('contenido');
    expect(saved.soloLecturaEnViewer).toBe(true);
  });

  it('normaliza bloque Venn asegurando modo contenido, soloLectura y regiones canónicas', () => {
    const rawVenn = {
      tipo: 'diagrama',
      subtipo: 'venn',
      conjuntos: 2,
      elementos: [
        { id: 'e1', texto: 'Murciélago', regionId: 'ab' },
        { id: 'e2', texto: 'Ruido', regionId: 'zona-falsa' },
      ],
    };

    const rendered = classSlideToRendererSlide(apiSlide([rawVenn]));
    const venn = (rendered.bloques ?? [])[0] as import('@/types/slide.types').DiagramaVennBlock;

    expect(venn.tipo).toBe('diagrama');
    expect(venn.subtipo).toBe('venn');
    expect(venn.modo).toBe('contenido');
    expect(venn.soloLecturaEnViewer).toBe(true);
    expect(venn.elementos.find((el) => el.id === 'e1')?.regionId).toBe('ab');
    expect(venn.elementos.find((el) => el.id === 'e2')?.regionId).toBeNull();

    const persisted = sanitizeSlideContentForPersistence({ bloques: [rawVenn] });
    const saved = ((persisted?.bloques ?? []) as import('@/types/slide.types').DiagramaVennBlock[])[0];
    expect(saved.tipo).toBe('diagrama');
    expect(saved.subtipo).toBe('venn');
    expect(saved.modo).toBe('contenido');
    expect(saved.soloLecturaEnViewer).toBe(true);
  });
});
