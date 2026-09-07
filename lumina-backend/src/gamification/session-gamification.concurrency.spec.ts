import { SessionGamificationService } from './session-gamification.service';
import type { ActivityEvaluationResult } from '@lumina/scoring';
import type Redis from 'ioredis';

type MemoryRedis = {
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    ...args: Array<string | number>
  ) => Promise<'OK' | null>;
  del: (...keys: string[]) => Promise<number>;
  disconnect: () => void;
};

/**
 * Redis mínimo en memoria con SET NX + GET/DEL — suficiente para probar el
 * lock de sesión sin depender de Redis real.
 */
function createMemoryRedis(): MemoryRedis {
  const store = new Map<string, string>();
  const locks = new Map<string, string>();

  return {
    get(key: string): Promise<string | null> {
      if (locks.has(key)) return Promise.resolve(locks.get(key) ?? null);
      return Promise.resolve(store.get(key) ?? null);
    },
    set(
      key: string,
      value: string,
      ...args: Array<string | number>
    ): Promise<'OK' | null> {
      const nx = args.includes('NX');
      if (nx) {
        if (locks.has(key) || store.has(key)) return Promise.resolve(null);
        if (key.includes(':lock:')) {
          locks.set(key, value);
        } else {
          store.set(key, value);
        }
        return Promise.resolve('OK');
      }
      store.set(key, value);
      return Promise.resolve('OK');
    },
    del(...keys: string[]): Promise<number> {
      let n = 0;
      for (const k of keys) {
        if (locks.delete(k)) n++;
        if (store.delete(k)) n++;
      }
      return Promise.resolve(n);
    },
    disconnect() {
      /* no-op */
    },
  };
}

const PERFECTO: ActivityEvaluationResult = {
  correct: true,
  details: [{ index: 0, correct: true }],
  score: 5,
};

describe('SessionGamificationService — concurrencia (F1.4)', () => {
  it('dos registrarActividad en paralelo no pierden XP (lock por sesión)', async () => {
    const redis = createMemoryRedis();
    const service = new SessionGamificationService();
    service.replaceRedisForTests(redis as unknown as Redis);

    await service.iniciarSesion('sess-race-1');

    const originalGet = redis.get;
    redis.get = (key: string): Promise<string | null> =>
      new Promise((resolve) => {
        setTimeout(() => {
          void originalGet(key).then(resolve);
        }, 15);
      });

    const [a, b] = await Promise.all([
      service.registrarActividad('sess-race-1', 'stu-1', PERFECTO, 'Ana'),
      service.registrarActividad('sess-race-1', 'stu-1', PERFECTO, 'Ana'),
    ]);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();

    const board = await service.getLeaderboard('sess-race-1');
    expect(board).toHaveLength(1);
    expect(board[0].xp).toBe((a?.xpGanado ?? 0) + (b?.xpGanado ?? 0));
    expect(board[0].actividades).toBe(2);

    service.onModuleDestroy();
  });
});
