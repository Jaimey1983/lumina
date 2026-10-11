/**
 * Aviso sonoro de los hitos del contador (T10), con WebAudio como el tick de la ruleta.
 * Es un extra «de mejor esfuerzo»: sin WebAudio, o con el navegador bloqueando el audio hasta
 * que el alumno toque la página, el contador avisa solo en lo visual. Nunca lanza.
 */
type ContextoAudio = typeof AudioContext;

let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (contexto && contexto.state !== 'closed') return contexto;
  const Ctor: ContextoAudio | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: ContextoAudio }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    contexto = new Ctor();
    return contexto;
  } catch {
    return null;
  }
}

/** Dos pitidos cortos (`final: true` los hace más graves y largos, para el fin del tiempo). */
export function sonarHito(final = false): void {
  const ctx = obtenerContexto();
  if (!ctx) return;
  try {
    void ctx.resume?.();
    const base = ctx.currentTime;
    const frecuencia = final ? 520 : 880;
    for (let i = 0; i < 2; i += 1) {
      const t = base + i * 0.18;
      const osc = ctx.createOscillator();
      const ganancia = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frecuencia, t);
      ganancia.gain.setValueAtTime(0.0001, t);
      ganancia.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, t + (final ? 0.3 : 0.12));
      osc.connect(ganancia).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + (final ? 0.32 : 0.14));
    }
  } catch {
    // El audio es un extra: un fallo puntual no debe romper el contador.
  }
}
