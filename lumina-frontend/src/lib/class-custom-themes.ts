import type { SlideTheme } from '@/types/slide.types';

const STORAGE_PREFIX = 'lumina-slide-themes:';

function isSlideTheme(value: unknown): value is SlideTheme {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.nombre === 'string' &&
    typeof t.fuente === 'string' &&
    t.fondo !== null &&
    typeof t.fondo === 'object' &&
    t.colores !== null &&
    typeof t.colores === 'object'
  );
}

function readFromDesempeno(desempeno: unknown): SlideTheme[] {
  if (!desempeno || typeof desempeno !== 'object' || Array.isArray(desempeno)) return [];
  const raw = (desempeno as Record<string, unknown>).temasPersonalizados;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSlideTheme);
}

function readFromLocalStorage(classId: string): SlideTheme[] {
  if (typeof window === 'undefined' || !classId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${classId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSlideTheme);
  } catch {
    return [];
  }
}

/** Temas personalizados: API (`desempeno.temasPersonalizados`) con respaldo en localStorage. */
export function getCustomThemesForClass(
  classId: string,
  desempeno?: unknown,
): SlideTheme[] {
  const fromApi = readFromDesempeno(desempeno);
  if (fromApi.length > 0) return fromApi;
  return readFromLocalStorage(classId);
}

export function mergeDesempenoWithCustomThemes(
  desempeno: unknown,
  themes: SlideTheme[],
): Record<string, unknown> {
  const base =
    desempeno && typeof desempeno === 'object' && !Array.isArray(desempeno)
      ? { ...(desempeno as Record<string, unknown>) }
      : {};
  return { ...base, temasPersonalizados: themes };
}

export function persistCustomThemesLocally(classId: string, themes: SlideTheme[]): void {
  if (typeof window === 'undefined' || !classId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${classId}`, JSON.stringify(themes));
  } catch {
    /* quota / private mode */
  }
}
