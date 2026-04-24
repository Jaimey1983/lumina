// ─── Autonomous Session Types ─────────────────────────────────────────────────

export interface AutonomousSession {
  id: string;
  classId: string;
  opensAt: string;
  closesAt: string;
  allowBackNav: boolean;
  maxAttempts: number;
  timerBehavior: 'advance' | 'lock';
  status: 'scheduled' | 'open' | 'closed';
  pin?: string | null;
  /** Si el backend lo envía a nivel sesión (además de en `class`). */
  background?: string | null;
  class: {
    title: string;
    codigo: string;
    content: unknown;
    /** Fondo del viewer (misma semántica que en detalle de clase). */
    background?: string | null;
  };
}

export interface AutonomousProgressEntry {
  slideId: string;
  response: unknown;
  attemptNumber: number;
}

export interface JoinSessionResponse {
  studentId: string;
  attemptNumber: number;
  hasExistingProgress: boolean;
  resuming: boolean;
  existingProgress?: unknown;
}

export interface CompleteSessionResponse {
  finalScore: number;
  performance: 'Bajo' | 'Básico' | 'Alto' | 'Superior';
  message?: string;
}
