/**
 * Tick de la ruleta con WebAudio (T7): un clic corto cada vez que un sector pasa bajo
 * el indicador. Se crea dentro del gesto del usuario (el clic en «Girar») para que el
 * navegador permita el audio; si no hay WebAudio o falla, `crearTicker` devuelve `null`
 * y la ruleta gira en silencio.
 */
export interface TickerRuleta {
  tick(): void;
  cerrar(): void;
}

type ContextoAudio = typeof AudioContext;

export function crearTicker(): TickerRuleta | null {
  if (typeof window === 'undefined') return null;
  const Ctor: ContextoAudio | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: ContextoAudio }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    const ctx = new Ctor();
    void ctx.resume?.();
    return {
      tick() {
        try {
          const ahora = ctx.currentTime;
          const osc = ctx.createOscillator();
          const ganancia = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, ahora);
          osc.frequency.exponentialRampToValueAtTime(700, ahora + 0.04);
          ganancia.gain.setValueAtTime(0.0001, ahora);
          ganancia.gain.exponentialRampToValueAtTime(0.12, ahora + 0.004);
          ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.05);
          osc.connect(ganancia).connect(ctx.destination);
          osc.start(ahora);
          osc.stop(ahora + 0.06);
        } catch {
          // El audio es un extra: un fallo puntual no debe romper el giro.
        }
      },
      cerrar() {
        void ctx.close?.().catch(() => undefined);
      },
    };
  } catch {
    return null;
  }
}
