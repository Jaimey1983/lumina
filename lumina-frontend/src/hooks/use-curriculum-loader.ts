'use client';

import { useState, useCallback } from 'react';
import type {
  AreaCurricular,
  GradoEscolar,
  CurriculumData,
} from '@/types/curriculum.types';
import { loadCurriculum, buildCurriculumContext } from '@/data/curriculum/index';

interface UseCurriculumLoaderReturn {
  curriculumData: CurriculumData | null;
  /** Resumen compacto para inyectar en el prompt de Gemini. */
  curriculumContext: string | null;
  loading: boolean;
  error: string | null;
  load: (area: AreaCurricular, grado: GradoEscolar) => Promise<void>;
  clear: () => void;
}

export function useCurriculumLoader(): UseCurriculumLoaderReturn {
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [curriculumContext, setCurriculumContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (area: AreaCurricular, grado: GradoEscolar) => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadCurriculum(area, grado);
        if (!data) {
          setError('No hay datos curriculares disponibles para esta combinación');
          setCurriculumData(null);
          setCurriculumContext(null);
        } else {
          setCurriculumData(data);
          setCurriculumContext(buildCurriculumContext(data));
        }
      } catch {
        setError('Error al cargar el contexto curricular');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setCurriculumData(null);
    setCurriculumContext(null);
    setError(null);
  }, []);

  return { curriculumData, curriculumContext, loading, error, load, clear };
}
