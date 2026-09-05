import { TorneoService } from './torneo.service';

type AnswerRow = {
  id: string;
  torneoId: string;
  studentId: string;
  studentName: string;
  questionIndex: number;
  answer: string;
  correct: boolean;
  responseMs: number;
  points: number;
};

type AnswerWhere = {
  torneoId: string;
  questionIndex: number;
  studentId: string;
};

/**
 * Prisma fake con unique (torneoId, questionIndex, studentId) como en la
 * migración F1.4 — simula la carrera check-then-insert.
 */
function createTorneoPrismaFake() {
  const answers: AnswerRow[] = [];
  let seq = 0;
  let gate: Promise<void> = Promise.resolve();
  let releaseGate: (() => void) | null = null;

  const holdCreates = () => {
    gate = new Promise((resolve) => {
      releaseGate = resolve;
    });
  };
  const releaseCreates = () => {
    releaseGate?.();
    releaseGate = null;
    gate = Promise.resolve();
  };

  const prisma = {
    torneoAnswer: {
      findFirst({ where }: { where: AnswerWhere }): Promise<AnswerRow | null> {
        return Promise.resolve(
          answers.find(
            (a) =>
              a.torneoId === where.torneoId &&
              a.questionIndex === where.questionIndex &&
              a.studentId === where.studentId,
          ) ?? null,
        );
      },
      async create({
        data,
      }: {
        data: Omit<AnswerRow, 'id'>;
      }): Promise<AnswerRow> {
        await gate;
        const clash = answers.some(
          (a) =>
            a.torneoId === data.torneoId &&
            a.questionIndex === data.questionIndex &&
            a.studentId === data.studentId,
        );
        if (clash) {
          const err = new Error('Unique constraint') as Error & {
            code?: string;
          };
          err.code = 'P2002';
          throw err;
        }
        seq += 1;
        const row: AnswerRow = { id: `ans-${seq}`, ...data };
        answers.push(row);
        return { ...row };
      },
    },
    torneoSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  return { prisma, answers, holdCreates, releaseCreates };
}

type RedisPipeline = {
  set: (key: string, value: string | number) => RedisPipeline;
  exec: () => Promise<unknown[]>;
};

function createRedisFake() {
  const map = new Map<string, string>();
  return {
    get(key: string): Promise<string | null> {
      return Promise.resolve(map.get(key) ?? null);
    },
    pipeline(): RedisPipeline {
      const ops: Array<() => void> = [];
      const pipe: RedisPipeline = {
        set(key: string, value: string | number) {
          ops.push(() => map.set(key, String(value)));
          return pipe;
        },
        exec() {
          ops.forEach((op) => op());
          return Promise.resolve([]);
        },
      };
      return pipe;
    },
  };
}

describe('TorneoService — saveAnswer concurrencia (F1.4)', () => {
  it('dos saveAnswer paralelos: solo una fila; la segunda retorna null (P2002)', async () => {
    const { prisma, answers, holdCreates, releaseCreates } =
      createTorneoPrismaFake();
    const redis = createRedisFake();

    const service = new TorneoService(prisma as never);
    (service as unknown as { redis: typeof redis }).redis = redis;

    const pipe = redis.pipeline();
    pipe.set(`torneo:t1:q0:startTime`, Date.now() - 1000);
    pipe.set(`torneo:t1:q0:timeLimit`, 30000);
    await pipe.exec();

    holdCreates();

    const p1 = service.saveAnswer('t1', 0, 'stu-1', 'Ana', 'A', 'A');
    const p2 = service.saveAnswer('t1', 0, 'stu-1', 'Ana', 'B', 'A');

    await new Promise((r) => setTimeout(r, 20));
    releaseCreates();

    const [r1, r2] = await Promise.all([p1, p2]);

    const created = [r1, r2].filter((r) => r !== null);
    const rejected = [r1, r2].filter((r) => r === null);

    expect(created).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(answers).toHaveLength(1);
    expect(answers[0].studentId).toBe('stu-1');
    expect(answers[0].correct).toBe(true);
  });
});
