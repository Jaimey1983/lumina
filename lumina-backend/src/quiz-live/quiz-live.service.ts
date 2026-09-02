import { Injectable } from '@nestjs/common';

export interface QuizLiveRankingRow {
  studentId: string;
  studentName: string;
  correctCount: number;
  points: number;
  position: number;
}

interface QuestionAnswer {
  optionIds: string[];
  correct: boolean;
  responseMs: number;
  studentName: string;
}

export interface QuizLiveSession {
  classId: string;
  quizBlockId: string;
  slideId: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionId: string | null;
  status: 'idle' | 'active' | 'paused' | 'finished';
  timePerQuestion: number;
  secondsLeft: number;
  autoAdvanceOnAllAnswered: boolean;
  questionStartedAt: number | null;
  currentQuestionOpciones: { id: string; esCorrecta?: boolean }[];
  answersByStudent: Map<string, Map<string, QuestionAnswer>>;
  timerInterval: ReturnType<typeof setInterval> | null;
}

export type QuizLiveTickHandler = (payload: {
  quizBlockId: string;
  secondsLeft: number;
}) => void;

export type QuizLiveEndHandler = (payload: {
  quizBlockId: string;
  questionId: string | null;
}) => void;

function sessionKey(classId: string, quizBlockId: string): string {
  return `${classId}:${quizBlockId}`;
}

function isOptionSetCorrect(
  opciones: { id: string; esCorrecta?: boolean }[],
  selected: string[],
): boolean {
  const correctIds = opciones.filter((o) => o.esCorrecta).map((o) => o.id);
  if (correctIds.length === 0) return false;
  if (selected.length !== correctIds.length) return false;
  const set = new Set(selected);
  return correctIds.every((id) => set.has(id));
}

@Injectable()
export class QuizLiveService {
  private readonly sessions = new Map<string, QuizLiveSession>();

  getSession(classId: string, quizBlockId: string): QuizLiveSession | undefined {
    return this.sessions.get(sessionKey(classId, quizBlockId));
  }

  initSession(input: {
    classId: string;
    quizBlockId: string;
    slideId: string;
    totalQuestions: number;
    timePerQuestion?: number;
    autoAdvanceOnAllAnswered?: boolean;
  }): QuizLiveSession {
    const key = sessionKey(input.classId, input.quizBlockId);
    const existing = this.sessions.get(key);
    if (existing && existing.status !== 'finished') {
      return existing;
    }
    this.clearTimer(existing);
    const session: QuizLiveSession = {
      classId: input.classId,
      quizBlockId: input.quizBlockId,
      slideId: input.slideId,
      totalQuestions: Math.max(1, input.totalQuestions),
      currentQuestionIndex: -1,
      questionId: null,
      status: 'idle',
      timePerQuestion: Math.max(5, Math.min(300, input.timePerQuestion ?? 30)),
      secondsLeft: 0,
      autoAdvanceOnAllAnswered: input.autoAdvanceOnAllAnswered ?? false,
      questionStartedAt: null,
      currentQuestionOpciones: [],
      answersByStudent: new Map(),
      timerInterval: null,
    };
    this.sessions.set(key, session);
    return session;
  }

  private clearTimer(session: QuizLiveSession | undefined) {
    if (session?.timerInterval) {
      clearInterval(session.timerInterval);
      session.timerInterval = null;
    }
  }

  stopTimer(classId: string, quizBlockId: string) {
    const session = this.getSession(classId, quizBlockId);
    if (!session) return;
    this.clearTimer(session);
  }

  launchQuestion(
    classId: string,
    quizBlockId: string,
    questionIndex: number,
    questionId: string,
    opciones: { id: string; esCorrecta?: boolean }[],
    timePerQuestion: number | undefined,
    handlers: { onTick: QuizLiveTickHandler; onEnd: QuizLiveEndHandler },
  ): QuizLiveSession | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session || session.status === 'finished') return null;

    this.clearTimer(session);
    session.currentQuestionIndex = Math.max(
      0,
      Math.min(questionIndex, session.totalQuestions - 1),
    );
    session.questionId = questionId;
    session.currentQuestionOpciones = opciones;
    session.status = 'active';
    session.timePerQuestion = Math.max(
      5,
      Math.min(300, timePerQuestion ?? session.timePerQuestion),
    );
    session.secondsLeft = session.timePerQuestion;
    session.questionStartedAt = Date.now();

    handlers.onTick({
      quizBlockId,
      secondsLeft: session.secondsLeft,
    });

    session.timerInterval = setInterval(() => {
      if (session.status === 'paused') return;
      session.secondsLeft = Math.max(0, session.secondsLeft - 1);
      handlers.onTick({
        quizBlockId,
        secondsLeft: session.secondsLeft,
      });
      if (session.secondsLeft <= 0) {
        this.clearTimer(session);
        session.status = 'active';
        handlers.onEnd({ quizBlockId, questionId: session.questionId });
      }
    }, 1000);

    return session;
  }

  pause(classId: string, quizBlockId: string): QuizLiveSession | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session || session.status !== 'active') return null;
    session.status = 'paused';
    return session;
  }

  resume(classId: string, quizBlockId: string): QuizLiveSession | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session || session.status !== 'paused') return null;
    session.status = 'active';
    return session;
  }

  skip(classId: string, quizBlockId: string): QuizLiveSession | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session) return null;
    this.clearTimer(session);
    session.status = 'active';
    return session;
  }

  finish(classId: string, quizBlockId: string): QuizLiveSession | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session) return null;
    this.clearTimer(session);
    session.status = 'finished';
    return session;
  }

  saveAnswer(input: {
    classId: string;
    quizBlockId: string;
    studentId: string;
    studentName: string;
    questionId: string;
    optionIds: string[];
    opciones: { id: string; esCorrecta?: boolean }[];
  }): { correct: boolean; alreadyAnswered: boolean; answeredCount: number } | null {
    const session = this.getSession(input.classId, input.quizBlockId);
    if (!session || session.status === 'finished' || !session.questionId) {
      return null;
    }
    if (session.questionId !== input.questionId) {
      return null;
    }

    const sid = input.studentId.trim();
    if (!sid) return null;

    let byQuestion = session.answersByStudent.get(sid);
    if (!byQuestion) {
      byQuestion = new Map();
      session.answersByStudent.set(sid, byQuestion);
    }

    if (byQuestion.has(input.questionId)) {
      return {
        correct: byQuestion.get(input.questionId)!.correct,
        alreadyAnswered: true,
        answeredCount: this.countAnswersForQuestion(session, input.questionId),
      };
    }

    const started = session.questionStartedAt ?? Date.now();
    const responseMs = Math.max(0, Date.now() - started);
    const opciones =
      input.opciones.length > 0 ? input.opciones : session.currentQuestionOpciones;
    const correct = isOptionSetCorrect(opciones, input.optionIds);
    byQuestion.set(input.questionId, {
      optionIds: [...input.optionIds],
      correct,
      responseMs,
      studentName: input.studentName.trim() || sid,
    });

    return {
      correct,
      alreadyAnswered: false,
      answeredCount: this.countAnswersForQuestion(session, input.questionId),
    };
  }

  countAnswersForQuestion(session: QuizLiveSession, questionId: string): number {
    let n = 0;
    for (const byQ of session.answersByStudent.values()) {
      if (byQ.has(questionId)) n++;
    }
    return n;
  }

  getClientSyncState(
    classId: string,
    quizBlockId: string,
    studentId: string,
  ): {
    quizBlockId: string;
    status: QuizLiveSession['status'];
    questionIndex: number;
    questionId: string | null;
    secondsLeft: number;
    timePerQuestion: number;
    totalQuestions: number;
    paused: boolean;
    studentAnswer?: { optionIds: string[]; correct: boolean };
    ranking?: QuizLiveRankingRow[];
  } | null {
    const session = this.getSession(classId, quizBlockId);
    if (!session) return null;

    const base = {
      quizBlockId,
      status: session.status,
      questionIndex: session.currentQuestionIndex,
      questionId: session.questionId,
      secondsLeft: session.secondsLeft,
      timePerQuestion: session.timePerQuestion,
      totalQuestions: session.totalQuestions,
      paused: session.status === 'paused',
    };

    if (session.status === 'finished') {
      return {
        ...base,
        ranking: this.getRanking(classId, quizBlockId),
      };
    }

    const sid = studentId.trim();
    if (session.questionId && sid) {
      const byQuestion = session.answersByStudent.get(sid);
      const answer = byQuestion?.get(session.questionId);
      if (answer) {
        return {
          ...base,
          studentAnswer: {
            optionIds: [...answer.optionIds],
            correct: answer.correct,
          },
        };
      }
    }

    return base;
  }

  getRanking(classId: string, quizBlockId: string): QuizLiveRankingRow[] {
    const session = this.getSession(classId, quizBlockId);
    if (!session) return [];

    const totals = new Map<
      string,
      { studentName: string; correctCount: number; points: number }
    >();

    for (const [studentId, byQuestion] of session.answersByStudent.entries()) {
      let correctCount = 0;
      let points = 0;
      let name = studentId;
      for (const ans of byQuestion.values()) {
        name = ans.studentName || name;
        if (ans.correct) {
          correctCount++;
          const speedBonus = Math.round(
            500 * Math.max(0, 1 - ans.responseMs / (session.timePerQuestion * 1000)),
          );
          points += 1000 + speedBonus;
        }
      }
      totals.set(studentId, { studentName: name, correctCount, points });
    }

    return [...totals.entries()]
      .map(([studentId, row]) => ({
        studentId,
        studentName: row.studentName,
        correctCount: row.correctCount,
        points: row.points,
        position: 0,
      }))
      .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)
      .map((row, i) => ({ ...row, position: i + 1 }));
  }
}
