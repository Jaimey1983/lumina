export const SLIDES_PANEL_COLLAPSED_STORAGE_KEY = 'lumina-editor-slides-panel-collapsed';

/**
 * Preferencia de rail de slides colapsado — persistida por navegador.
 * Útil en pantallas chicas (laptops 13"-15") donde el rail fijo de 12rem
 * compite por espacio con el canvas y el panel de propiedades.
 */
export function readStoredSlidesPanelCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(SLIDES_PANEL_COLLAPSED_STORAGE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export function writeStoredSlidesPanelCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SLIDES_PANEL_COLLAPSED_STORAGE_KEY,
      collapsed ? '1' : '0',
    );
  } catch {
    /* ignore quota / private mode */
  }
}
