import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { matchesQuery, normalizeSearch, PanelSearch, PanelSearchEmpty } from './panel-shared';
import { seccionesVisibles, ElementosPanel } from './elementos-panel';
import { filtrarGruposActividades, ActivitiesPanel } from './activities-panel';
import { filtrarWidgets, WidgetsInsertPanel } from './widgets-insert-panel';

// Entorno node: la lógica de filtrado se prueba en funciones puras; el render
// inicial confirma que cada panel trae su campo de búsqueda.

describe('búsqueda: utilidades (S11)', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizeSearch('  Cronología ')).toBe('cronologia');
    expect(matchesQuery('Cronología pedagógica', 'CRONOLOGIA')).toBe(true);
    expect(matchesQuery('Diagrama de Venn', 'venn')).toBe(true);
    expect(matchesQuery('Diagrama de Venn', 'xyz')).toBe(false);
  });

  it('consulta vacía o en blanco coincide con todo', () => {
    expect(matchesQuery('lo que sea', '')).toBe(true);
    expect(matchesQuery('lo que sea', '   ')).toBe(true);
  });

  it('PanelSearch: botón de limpiar solo con texto', () => {
    const vacio = renderToStaticMarkup(createElement(PanelSearch, { value: '', onChange: () => {} }));
    const lleno = renderToStaticMarkup(createElement(PanelSearch, { value: 'x', onChange: () => {} }));
    expect(vacio).not.toContain('Limpiar búsqueda');
    expect(lleno).toContain('Limpiar búsqueda');
    expect(vacio).toContain('type="search"');
  });

  it('estado vacío nombra la consulta', () => {
    expect(renderToStaticMarkup(createElement(PanelSearchEmpty, { query: ' qqq ' }))).toContain(
      'Sin resultados para «qqq»',
    );
  });
});

describe('Elementos (S11)', () => {
  it('sin consulta todas las secciones son visibles', () => {
    expect(Object.values(seccionesVisibles('')).every(Boolean)).toBe(true);
  });

  it('«venn» deja solo Diagramas', () => {
    const v = seccionesVisibles('venn');
    expect(v.diagramas).toBe(true);
    expect(Object.entries(v).filter(([, on]) => on).map(([k]) => k)).toEqual(['diagramas']);
  });

  it('coincidencia por nombre de sección y por ítem de otra sección', () => {
    expect(seccionesVisibles('multimedia').multimedia).toBe(true);
    expect(seccionesVisibles('audio').multimedia).toBe(true);
    expect(seccionesVisibles('tabla periodica').quimica).toBe(true);
    expect(seccionesVisibles('mhchem').quimica).toBe(true);
  });

  it('sin coincidencias ninguna sección es visible', () => {
    expect(Object.values(seccionesVisibles('zzzz')).some(Boolean)).toBe(false);
  });

  it('el panel trae su campo de búsqueda', () => {
    const out = renderToStaticMarkup(
      createElement(ElementosPanel, { apiSlide: null, onCommitContent: () => {} }),
    );
    expect(out).toContain('aria-label="Buscar elementos"');
  });
});

describe('Actividades (S11)', () => {
  it('sin consulta devuelve los 5 grupos', () => {
    expect(filtrarGruposActividades('').map((g) => g.value)).toEqual([
      'evaluacion',
      'quimica',
      'interaccion',
      'en-vivo',
      'juegos',
    ]);
  });

  it('filtra ítems por etiqueta y oculta grupos vacíos', () => {
    const r = filtrarGruposActividades('crucigrama');
    expect(r.map((g) => g.value)).toEqual(['juegos']);
    expect(r[0]!.items.map((i) => i.label)).toEqual(['Crucigrama']);
  });

  it('coincidir con el nombre del grupo muestra todos sus ítems', () => {
    const r = filtrarGruposActividades('evaluacion');
    expect(r).toHaveLength(1);
    expect(r[0]!.items.length).toBeGreaterThan(1);
  });

  it('sin coincidencias no hay grupos', () => {
    expect(filtrarGruposActividades('zzzz')).toEqual([]);
  });

  it('el panel trae su campo de búsqueda', () => {
    const out = renderToStaticMarkup(createElement(ActivitiesPanel, { onAddActivity: () => {} }));
    expect(out).toContain('aria-label="Buscar actividades"');
  });
});

describe('Widgets (S11)', () => {
  it('sin consulta devuelve todos los grupos y «Próximamente»', () => {
    const r = filtrarWidgets('');
    expect(r.grupos.map((g) => g.group)).toEqual(['lienzo', 'overlay', 'control']);
    expect(r.proximamente).toHaveLength(5);
  });

  it('filtra por etiqueta de widget', () => {
    const r = filtrarWidgets('ruleta');
    expect(r.grupos.flatMap((g) => g.items.map((i) => i.type))).toEqual(['ruleta']);
    expect(r.proximamente).toHaveLength(0);
  });

  it('busca también en «Próximamente»', () => {
    const r = filtrarWidgets('qr');
    expect(r.grupos).toHaveLength(0);
    expect(r.proximamente.map((p) => p.label)).toEqual(['Código QR']);
  });

  it('el panel trae su campo de búsqueda', () => {
    const out = renderToStaticMarkup(createElement(WidgetsInsertPanel, {}));
    expect(out).toContain('aria-label="Buscar widgets"');
  });
});
