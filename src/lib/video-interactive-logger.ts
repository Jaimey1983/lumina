type LogLevel = 'info' | 'warn' | 'error';

type LogEvent =
  | 'provider-detected'
  | 'activity-started'
  | 'player-initializing'
  | 'player-ready'
  | 'time-update'
  | 'cue-enter'
  | 'cue-dismiss'
  | 'seek-blocked'
  | 'playback-resume'
  | 'player-error';

interface LogPayload {
  provider?: string;
  time?: number;
  cueId?: string;
  reason?: string;
  from?: number;
  to?: number;
  maxAllowed?: number;
  detail?: unknown;
}

const DEBUG_KEY = 'lumina:video:debug';

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEBUG_KEY) === '1';
}

export function logVideoEvent(level: LogLevel, event: LogEvent, payload: LogPayload = {}): void {
  if (!isDebugEnabled() && level === 'info') return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  if (level === 'error') {
    console.error('[VideoInteractive]', record);
    return;
  }
  if (level === 'warn') {
    console.warn('[VideoInteractive]', record);
    return;
  }
  console.info('[VideoInteractive]', record);
}
