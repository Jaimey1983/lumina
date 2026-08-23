import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface RankingEntry {
  studentId: string;
  studentName: string;
  total: number;
  position: number;
}

@Injectable()
export class TorneoService {
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaClient) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async createSession(classId: string, sessionId: string) {
    return this.prisma.torneoSession.create({
      data: { classId, sessionId, status: 'waiting' },
    });
  }

  async getSession(id: string) {
    return this.prisma.torneoSession.findUnique({ where: { id } });
  }

  async startQuestion(
    torneoId: string,
    index: number,
    question: any,
    timeLimit: number,
  ) {
    await this.prisma.torneoSession.update({
      where: { id: torneoId },
      data: { currentQ: index },
    });

    const pipeline = this.redis.pipeline();
    pipeline.set(`torneo:${torneoId}:q${index}:startTime`, Date.now(), 'EX', 60);
    pipeline.set(`torneo:${torneoId}:q${index}:timeLimit`, timeLimit, 'EX', 60);
    await pipeline.exec();
  }

  async saveAnswer(
    torneoId: string,
    questionIndex: number,
    studentId: string,
    studentName: string,
    answer: string,
    correctAnswer: string,
  ) {
    const startTimeStr = await this.redis.get(
      `torneo:${torneoId}:q${questionIndex}:startTime`,
    );
    const timeLimitStr = await this.redis.get(
      `torneo:${torneoId}:q${questionIndex}:timeLimit`,
    );

    let responseMs = 0;
    let timeLimit = 30000;
    
    if (startTimeStr) {
      responseMs = Date.now() - parseInt(startTimeStr, 10);
    }
    if (timeLimitStr) {
      timeLimit = parseInt(timeLimitStr, 10);
    }

    const correct = answer === correctAnswer;
    let points = 0;

    if (correct) {
      const p = Math.round(1000 + 500 * (1 - responseMs / timeLimit));
      // clamp entre 0 y 1500
      points = Math.max(0, Math.min(1500, p));
    }

    // Check if already answered
    const existing = await this.prisma.torneoAnswer.findFirst({
      where: { torneoId, questionIndex, studentId },
    });

    if (existing) {
      return null;
    }

    return this.prisma.torneoAnswer.create({
      data: {
        torneoId,
        studentId,
        studentName,
        questionIndex,
        answer,
        correct,
        responseMs,
        points,
      },
    });
  }

  async getRanking(torneoId: string): Promise<RankingEntry[]> {
    const results = await this.prisma.torneoAnswer.groupBy({
      by: ['studentId', 'studentName'],
      where: { torneoId },
      _sum: {
        points: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        },
      },
    });

    return results.map((r, i) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      total: r._sum.points || 0,
      position: i + 1,
    }));
  }

  async finishSession(torneoId: string) {
    await this.prisma.torneoSession.update({
      where: { id: torneoId },
      data: { status: 'finished' },
    });
  }
}
