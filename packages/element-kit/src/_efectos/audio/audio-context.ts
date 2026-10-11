/**
 * Constructor de `AudioContext` del navegador (con el prefijo `webkit` de Safari viejo), o
 * `null` si no hay WebAudio (servidor, jsdom). Único punto donde los widgets lo buscan
 * (tick de la ruleta, avisos del contador).
 */
type ContextoAudio = typeof AudioContext;

export function obtenerAudioContextCtor(): ContextoAudio | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: ContextoAudio }).webkitAudioContext ??
    null
  );
}
