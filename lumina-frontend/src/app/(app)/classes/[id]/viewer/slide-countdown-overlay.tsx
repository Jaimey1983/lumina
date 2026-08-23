'use client';

function mixChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(from: string, to: string, t: number) {
  const [r1, g1, b1] = parseHex(from);
  const [r2, g2, b2] = parseHex(to);
  const r = mixChannel(r1, r2, t);
  const g = mixChannel(g1, g2, t);
  const b = mixChannel(b1, b2, t);
  return `rgb(${r} ${g} ${b})`;
}

function timerColor(timeLeft: number, duration: number): string {
  if (duration <= 0) return '#F97316';
  const ratio = Math.max(0, Math.min(1, timeLeft / duration));
  if (ratio >= 0.5) {
    const t = (ratio - 0.5) / 0.5;
    return mixHex('#EAB308', '#F97316', t);
  }
  const t = ratio / 0.5;
  return mixHex('#EF4444', '#EAB308', t);
}

interface SlideCountdownOverlayProps {
  timeLeft: number;
  duration: number;
  visible: boolean;
}

/** Countdown circular + segundos, esquina superior derecha del slide. */
export function SlideCountdownOverlay({
  timeLeft,
  duration,
  visible,
}: SlideCountdownOverlayProps) {
  if (!visible || duration <= 0) return null;

  const ratio = Math.max(0, Math.min(1, timeLeft / duration));
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;
  const stroke = timerColor(timeLeft, duration);

  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-20 flex size-16 flex-col items-center justify-center rounded-full bg-background/90 shadow-md ring-1 ring-black/10 backdrop-blur-sm sm:right-3 sm:top-3 sm:size-[4.5rem]"
      aria-live="polite"
      aria-label={`Temporizador: ${timeLeft} segundos`}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 56 56"
        aria-hidden
      >
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted/25"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span
        className="relative z-10 text-lg font-bold tabular-nums sm:text-xl"
        style={{ color: stroke }}
      >
        {timeLeft}
      </span>
      <span className="relative z-10 text-[9px] font-medium uppercase text-muted-foreground sm:text-[10px]">
        seg
      </span>
    </div>
  );
}
