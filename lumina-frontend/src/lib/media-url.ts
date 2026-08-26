/** URL usable en `<img>` / `<video>` / `<audio>` (no cadena vacía). */
export function hasMediaSrc(url?: string | null): url is string {
  return typeof url === 'string' && url.trim().length > 0;
}
