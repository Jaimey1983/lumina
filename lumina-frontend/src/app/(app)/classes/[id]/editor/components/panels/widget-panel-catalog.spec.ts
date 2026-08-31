import { describe, expect, it } from 'vitest';

import { WIDGET_TIPOS } from '@/components/widgets/shared/widget-registry';
import {
  WIDGET_PANEL_GROUP_ORDER,
  WIDGET_PANEL_ITEMS,
  getWidgetPanelItem,
  getWidgetPanelItemsByGroup,
} from './widget-panel-catalog';

describe('widget-panel-catalog', () => {
  it('incluye todos los widgets del registro, sin duplicados', () => {
    const types = WIDGET_PANEL_ITEMS.map((item) => item.type);
    expect(types).toEqual(WIDGET_TIPOS);
    expect(new Set(types).size).toBe(WIDGET_TIPOS.length);
  });

  it('agrupa los 12 widgets en lienzo, overlay y control', () => {
    const grouped = WIDGET_PANEL_GROUP_ORDER.flatMap((group) =>
      getWidgetPanelItemsByGroup(group).map((item) => item.type),
    );
    expect(grouped).toHaveLength(WIDGET_TIPOS.length);
    expect(getWidgetPanelItemsByGroup('lienzo').map((item) => item.type)).toEqual([
      'flip-cards',
      'tabs',
      'carousel',
      'click-reveal',
      'timeline',
      'ruleta',
    ]);
    expect(getWidgetPanelItemsByGroup('overlay').map((item) => item.type)).toEqual(['popup']);
    expect(getWidgetPanelItem('boton')?.group).toBe('control');
  });
});
