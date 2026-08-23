import { describe, expect, it } from 'vitest';

import { initialWidgetViewerPageIndex } from './widget-identity';

describe('initialWidgetViewerPageIndex', () => {
  it('el alumno arranca en 0 aunque el docente haya persistido otra ficha', () => {
    expect(initialWidgetViewerPageIndex(4)).toBe(0);
    expect(initialWidgetViewerPageIndex(0)).toBe(0);
    expect(initialWidgetViewerPageIndex()).toBe(0);
  });
});
