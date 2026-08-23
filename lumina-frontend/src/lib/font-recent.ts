const STORAGE_KEY = 'lumina-recent-fonts';
const MAX_RECENT = 5;

export function readRecentFonts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
}

export function rememberRecentFont(familia: string): string[] {
  const next = [familia, ...readRecentFonts().filter((f) => f !== familia)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}
