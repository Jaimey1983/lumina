import { isAxiosError } from 'axios';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  const msg = err.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg)) {
    const joined = msg.filter((m) => typeof m === 'string').join(' ');
    if (joined.trim()) return joined;
  }
  return fallback;
}
