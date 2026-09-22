import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ClassModoEntrega, ClassNarrativeMeta } from '@lumina/types/slide';

export interface Slide {
  id: string;
  order: number;
  type: 'COVER' | 'CONTENT' | 'ACTIVITY' | 'VIDEO' | 'IMAGE';
  title: string;
  content?: unknown;
  /** Versión optimista de `content` (F1.4). Ausente en slides legado → 0. */
  contentVersion?: number;
}

/** Motor curricular único (Etapa J / J6.4) — desempeño de curso referenciado por la clase. */
export interface ClassDesempenoRef {
  enunciado: string;
  area: string;
  grado: string;
  componenteEbc: string;
  competenciaIcfes: string;
}

export interface ClassDbaSeleccionado {
  unidadId: number;
  evidenciasElegidas: string[];
}

export interface ClassEbcSeleccionado {
  subprocesosElegidos: string[];
}

export interface ClassIndicadores {
  cognitivo: string[];
  procedimental: string[];
  actitudinal: string[];
}

/** Entrada 3 (J6.4) — selección del docente para ESTA clase puntual. */
export interface ClassContextoClase {
  indicadoresAbordados: string[];
  temas: string[];
  subtemas: string[];
}

export interface ClassDetail {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  codigo?: string;
  /** Segundos por defecto del temporizador en vivo (0 = desactivado). */
  timerGlobal?: number;
  modoEntrega?: ClassModoEntrega;
  /** Id del fondo del canvas en viewer (`none`, `blanco`, …). */
  background?: string | null;
  /** Si el backend lo envía, sincroniza el estado de sesión en vivo en el editor. */
  sessionActive?: boolean;
  /** Id de ClassSession activa (GET clase), si el backend lo expone. */
  activeSessionId?: string;
  liveSessionId?: string;
  /** Alias posible para el id de sesión en curso. */
  sessionId?: string;
  status: string;
  createdAt: string;
  slides?: Slide[];
  /** LEGADO (Pieza 1, pre-Etapa J6) — se congela, no se migra. */
  desempeno?: unknown;
  /** Motor curricular único (Etapa J / J6.1-J6.4) — Entrada 2 y 3. */
  desempenoId?: string | null;
  desempenoRef?: ClassDesempenoRef | null;
  caminoCurricular?: 'dba' | 'ebc' | null;
  dbaSeleccionado?: ClassDbaSeleccionado | null;
  ebcSeleccionado?: ClassEbcSeleccionado | null;
  indicadores?: ClassIndicadores | null;
  contextoClase?: ClassContextoClase | null;
  narrativa?: ClassNarrativeMeta;
}

export function useClass(id: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['classes', 'detail', id],
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
    queryFn: async () => {
      const { data } = await api.get<ClassDetail>(`/classes/${id}`);
      return data ?? null;
    },
  });
}
