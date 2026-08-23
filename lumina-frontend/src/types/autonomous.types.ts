// ─── Autonomous Session Types ─────────────────────────────────────────────────

/** Slide tal como lo devuelve GET/POST de sesión autónoma (viewer). */
export interface ApiSlide {
  id: string;
  order: number;
  type: string;
  title: string;
  content: unknown;
}

export interface AutonomousSession {
  id: string;
  /** Algunas respuestas del API aún pueden incluir el id de clase explícito. */
  classId?: string;
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
    id?: string;
    title: string;
    description?: string;
    codigo: string;
    slides: ApiSlide[];
    /** Fondo del viewer (misma semántica que en detalle de clase). */
    background?: string | null;
  };
}

export interface AutonomousProgressEntry {
  slideId: string;
  response: unknown;
  attemptNumber: number;
  activityType?: string;
  draft?: boolean;
}

export interface JoinSessionResponse {
  studentId: string;
  attemptNumber: number;
  resuming: boolean;
  existingProgress?: unknown;
  /** Sesión anidada devuelta por POST /join (incluye `class.slides` sin GET extra). */
  session?: AutonomousSession;
}

export interface CompleteSessionResponse {
  finalScore: number;
  performance: 'Bajo' | 'Básico' | 'Alto' | 'Superior';
  message?: string;
}
