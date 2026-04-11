'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Loader2, Monitor, Save, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { useCreateSlide, useInsertSlide, useRemoveSlide, useReorderSlides, useUpdateSlide } from '@/hooks/api/use-classes';
import { NewClassModal, type DesempenoGenerado, withActividadesSugeridas } from '../new-class-modal';
import {
  buildContentDocumentForNewActivitySlide,
  classSlideToRendererSlide,
  getSlideContentRecord,
  mergeSlideContent,
  removeBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import type { Activity, Block } from '@/types/slide.types';
import { IconRail, type LeftPanelId } from './components/icon-rail';
import { FlyoutPanel } from './components/flyout-panel';
import { SlidesPanel } from './components/slides-panel';
import { CanvasArea } from './components/canvas-area';
import { RightRail, type RightPanelId } from './components/right-rail';
import { RightFlyoutPanel } from './components/right-flyout-panel';
import type { ActivityType } from './components/panels/activities-panel';
import type { StudentResponse } from './components/panels/live-responses-panel';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/use-socket';

// ─── Save status ──────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle:   'Sin cambios',
  saving: 'Guardando…',
  saved:  'Guardado ✓',
  error:  'Error al guardar',
};

function shortAnswerTemplate(): Activity {
  return {
    tipo: 'short_answer',
    question: 'Nueva pregunta',
    expectedAnswer: '',
    caseSensitive: false,
    maxLength: 200,
  };
}

function quizMultipleTemplate(): Activity {
  return {
    tipo: 'quiz_multiple',
    pregunta: '¿Nueva pregunta?',
    opciones: [
      { id: 'a', texto: 'Opción A', esCorrecta: true },
      { id: 'b', texto: 'Opción B', esCorrecta: false },
      { id: 'c', texto: 'Opción C', esCorrecta: false },
      { id: 'd', texto: 'Opción D', esCorrecta: false },
    ],
    puntos: 10,
  };
}

function trueFalseTemplate(): Activity {
  return {
    tipo: 'verdadero_falso',
    afirmacion: 'Nueva afirmación para evaluar.',
    respuestaCorrecta: true,
    puntos: 5,
  };
}

function fillBlanksTemplate(): Activity {
  return {
    tipo: 'completar_blancos',
    texto: 'El {{blank:b1}} es fundamental para {{blank:b2}}.',
    blancos: [
      { id: 'b1', respuesta: 'concepto', ignorarMayusculas: true },
      { id: 'b2', respuesta: 'aprender', ignorarMayusculas: true },
    ],
    puntos: 10,
  };
}

function dragDropTemplate(): Activity {
  return {
    tipo: 'arrastrar_soltar',
    instruccion: 'Arrastra cada elemento a la categoría correcta.',
    items: [
      { id: 'i1', texto: 'Elemento 1' },
      { id: 'i2', texto: 'Elemento 2' },
      { id: 'i3', texto: 'Elemento 3' },
      { id: 'i4', texto: 'Elemento 4' },
    ],
    zonas: [
      { id: 'z1', etiqueta: 'Categoría 1', itemsCorrectos: ['i1', 'i2'] },
      { id: 'z2', etiqueta: 'Categoría 2', itemsCorrectos: ['i3', 'i4'] },
    ],
    puntos: 10,
  };
}

function matchPairsTemplate(): Activity {
  return {
    tipo: 'emparejar',
    instruccion: 'Empareja cada concepto con su definición.',
    pares: [
      { id: 'p1', izquierda: 'Concepto 1', derecha: 'Definición 1' },
      { id: 'p2', izquierda: 'Concepto 2', derecha: 'Definición 2' },
      { id: 'p3', izquierda: 'Concepto 3', derecha: 'Definición 3' },
    ],
    puntos: 10,
  };
}

function orderStepsTemplate(): Activity {
  return {
    tipo: 'ordenar_pasos',
    instruccion: 'Ordena los pasos del proceso correctamente.',
    pasos: [
      { id: 's1', contenido: 'Paso 1', ordenCorrecto: 1 },
      { id: 's2', contenido: 'Paso 2', ordenCorrecto: 2 },
      { id: 's3', contenido: 'Paso 3', ordenCorrecto: 3 },
      { id: 's4', contenido: 'Paso 4', ordenCorrecto: 4 },
    ],
    puntos: 10,
  };
}

function videoInteractiveTemplate(): Activity {
  return {
    tipo: 'video_interactivo',
    urlVideo: 'https://www.youtube.com/watch?v=',
    plataforma: 'youtube',
    preguntas: [
      {
        id: 'q1',
        tiempoSegundos: 30,
        pregunta: '¿Nueva pregunta?',
        opciones: [
          { id: 'a', texto: 'Opción A', esCorrecta: true },
          { id: 'b', texto: 'Opción B', esCorrecta: false },
        ],
        pausarVideo: true,
      },
    ],
    debeResponderParaContinuar: false,
  };
}

function livePollTemplate(): Activity {
  return {
    tipo: 'encuesta_viva',
    pregunta: '¿Nueva pregunta de encuesta?',
    opciones: [
      { id: 'o1', texto: 'Opción 1' },
      { id: 'o2', texto: 'Opción 2' },
      { id: 'o3', texto: 'Opción 3' },
    ],
    mostrarResultadosEnTiempoReal: true,
    mostrarResultadosAlFinalizar: true,
  };
}

function wordCloudTemplate(): Activity {
  return {
    tipo: 'nube_palabras',
    instruccion: 'Escribe una palabra que asocies con el tema.',
    maxPalabrasPorUsuario: 3,
    maxPalabrasEnNube: 50,
    filtrarPalabrasComunes: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Clics en capas portadas (Radix) no deben cerrar los flyouts al usar menús/modales. */
function isPointerOnPortedOverlay(el: HTMLElement) {
  return !!(
    el.closest('[role="dialog"]') ||
    el.closest('[data-slot="dropdown-menu-content"]') ||
    el.closest('[data-slot="dropdown-menu-sub-content"]') ||
    el.closest('[data-slot="select-content"]') ||
    el.closest('[data-slot="popover-content"]') ||
    el.closest('[data-slot="tooltip-content"]')
  );
}

function hasDesempenoPersistido(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enunciado === 'string' && o.enunciado.trim().length > 0) return true;
  const ind = o.indicadores;
  if (ind && typeof ind === 'object' && !Array.isArray(ind)) {
    return Object.values(ind as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
  }
  return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlideEditorClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const { emit: socketEmit, isConnected } = useSocket();
  const updateSlide  = useUpdateSlide(classId);
  const createSlide  = useCreateSlide(classId);
  const removeSlide    = useRemoveSlide(classId);
  const reorderSlides  = useReorderSlides(classId);
  const insertSlide    = useInsertSlide(classId);

  const [activePanel,        setActivePanel]        = useState<LeftPanelId | null>(null);
  const [rightPanel,         setRightPanel]         = useState<RightPanelId | null>(null);
  const [activeSlideIndex,   setActiveSlideIndex]   = useState(0);
  const [saveStatus,         setSaveStatus]         = useState<SaveStatus>('idle');
  const [modalUserOpen,      setModalUserOpen]      = useState(false);
  const [confirmedDesempeno, setConfirmedDesempeno] = useState<DesempenoGenerado | null>(null);
  const [showCurricularModal, setShowCurricularModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // ── Live responses from students (keyed by slideId) ────────────────────────
  const [liveResponses, setLiveResponses] = useState<
    Map<string, { activityType: string; responses: StudentResponse[] }>
  >(() => {
    try {
      const raw = sessionStorage.getItem(`lumina-live-responses-${classId}`);
      if (raw) {
        return new Map(
          JSON.parse(raw) as [string, { activityType: string; responses: StudentResponse[] }][],
        );
      }
    } catch { /* ignore */ }
    return new Map();
  });

  // Persist live responses to sessionStorage on every change (survives hard refresh)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `lumina-live-responses-${classId}`,
        JSON.stringify([...liveResponses]),
      );
    } catch { /* ignore */ }
  }, [liveResponses, classId]);

  const socketRef = useRef<Socket | null>(null);

  const leftRailWrapRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);
  const flyoutPanelRef = useRef<HTMLElement>(null);
  const rightRailWrapRef = useRef<HTMLDivElement>(null);
  const rightFlyoutPanelRef = useRef<HTMLElement>(null);
  /** Top bar (Volver, acciones): no cerrar flyouts aquí en pointerdown — el setState antes del click rompe la navegación del Link. */
  const editorHeaderRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activePanel && !rightPanel) return;
    const handlePointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      const el = e.target as HTMLElement;
      if (isPointerOnPortedOverlay(el)) return;
      if (editorHeaderRef.current?.contains(el)) return;

      if (activePanel) {
        if (flyoutPanelRef.current?.contains(t)) return;
        if (leftRailWrapRef.current?.contains(t)) return;
        if (rightRailWrapRef.current?.contains(t)) return;
        if (rightFlyoutPanelRef.current?.contains(t)) return;
        setActivePanel(null);
      }
      if (rightPanel) {
        if (rightFlyoutPanelRef.current?.contains(t)) return;
        if (rightRailWrapRef.current?.contains(t)) return;
        if (leftRailWrapRef.current?.contains(t)) return;
        if (flyoutPanelRef.current?.contains(t)) return;
        setRightPanel(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [activePanel, rightPanel]);

  // ─── Auto-open curricular modal once per session when class has no desempeño ─

  useEffect(() => {
    if (cls && !isLoading && !hasDesempenoPersistido(cls.desempeno) && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setShowCurricularModal(true);
    }
  }, [cls, isLoading]);

  // ─── Desempeño ──────────────────────────────────────────────────────────────

  const desempenoFromCls = useMemo(() => {
    if (!cls?.desempeno || !hasDesempenoPersistido(cls.desempeno)) return null;
    const raw = cls.desempeno as DesempenoGenerado;
    return withActividadesSugeridas({
      ...raw,
      actividadesSugeridas: Array.isArray(raw.actividadesSugeridas)
        ? raw.actividadesSugeridas
        : [],
    });
  }, [cls?.desempeno]);

  const desempeno = confirmedDesempeno ?? desempenoFromCls;

  const modalOpen = showCurricularModal || modalUserOpen;

  // ─── Socket: join class room on connect ─────────────────────────────────────

  useEffect(() => {
    if (!isConnected) return;
    socketEmit('join-class', { classId });
  }, [isConnected, classId, socketEmit]);

  // ─── Socket: emit slide-change when active slide changes ────────────────────

  useEffect(() => {
    if (!isConnected) return;
    socketEmit('slide-change', { slideIndex: activeSlideIndex, classId });
  }, [activeSlideIndex, classId, socketEmit, isConnected]);

  // ── Socket: listen for student responses ─────────────────────────────────────

  useEffect(() => {
    if (socketRef.current?.connected) return; // already connected, skip
    const sock = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    );
    socketRef.current = sock;

    sock.on('connect', () => {
      sock.emit('join-class', { classId });
    });

    sock.on('response-update', (payload: {
      slideId: string;
      slideIndex: number;
      activityType: string;
      studentId: string;
      correct: boolean | null;
      details?: { label: string; correct: boolean | null }[];
      response: unknown;
    }) => {
      console.log('[editor] response-update received', payload);
      setLiveResponses((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.slideId) ?? {
          activityType: payload.activityType,
          responses: [] as StudentResponse[],
        };

        const existingIndex = existing.responses.findIndex(
          (r) => r.studentId === payload.studentId,
        );

        let updatedResponses: StudentResponse[];
        if (existingIndex >= 0) {
          // Update existing entry — accumulate details (video_interactivo fires one per question)
          const prevEntry = existing.responses[existingIndex]!;
          const mergedDetails = payload.details
            ? [...(prevEntry.details ?? []), ...payload.details]
            : prevEntry.details;
          // Derive correct from accumulated details; fall back to payload.correct if no details
          const mergedCorrect: boolean | null = mergedDetails
            ? mergedDetails.every((d) => d.correct === true)
              ? true
              : mergedDetails.some((d) => d.correct === false)
                ? false
                : null
            : payload.correct;
          updatedResponses = existing.responses.map((r, i) =>
            i === existingIndex
              ? { ...r, correct: mergedCorrect, details: mergedDetails }
              : r,
          );
        } else {
          // New entry for this student
          updatedResponses = [
            ...existing.responses,
            {
              studentId: payload.studentId,
              correct: payload.correct,
              activityType: payload.activityType,
              details: payload.details,
            },
          ];
        }

        next.set(payload.slideId, {
          activityType: payload.activityType,
          responses: updatedResponses,
        });
        return next;
      });
    });

    return () => {
      sock.off('connect');
      sock.off('response-update');
      sock.disconnect();
      socketRef.current = null;
    };
  }, [classId]);

  // ─── Slides ─────────────────────────────────────────────────────────────────

  const sortedSlides = useMemo(() => {
    const slides = cls?.slides;
    if (!slides?.length) return [];
    return [...slides].sort((a, b) => a.order - b.order);
  }, [cls?.slides]);

  const resolvedSlideIndex = useMemo(() => {
    if (sortedSlides.length === 0) return 0;
    return Math.min(Math.max(0, activeSlideIndex), sortedSlides.length - 1);
  }, [sortedSlides.length, activeSlideIndex]);

  const activeSlide = sortedSlides[resolvedSlideIndex] ?? null;

  const rendererSlide = useMemo(
    () => (activeSlide ? classSlideToRendererSlide(activeSlide as ApiSlide) : null),
    [activeSlide],
  );

  const activeSlideHasActivity = useMemo(() => {
    if (!activeSlide) return false;
    const c = getSlideContentRecord(activeSlide as ApiSlide);
    const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
    return bloques.some((b) => b.tipo === 'actividad');
  }, [activeSlide]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleLeftPanel = useCallback((id: LeftPanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  const toggleRightPanel = useCallback((id: RightPanelId) => {
    setRightPanel((prev) => (prev === id ? null : id));
  }, []);

  const handleRefreshDesempeno = useCallback(() => {
    setModalUserOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!activeSlide) return;
    setSaveStatus('saving');
    let payload: unknown = activeSlide.content ?? null;
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      const s = sanitizeSlideContentForPersistence(payload);
      if (s !== null) payload = s;
    }
    updateSlide.mutate(
      { slideId: activeSlide.id, content: payload },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          toast.success('Slide guardado');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('error');
          toast.error('Error al guardar');
        },
      },
    );
  }, [activeSlide, updateSlide]);

  const handleStartSession = useCallback(async () => {
    if (!classId) return;
    setSessionLoading(true);
    try {
      const { data } = await api.post<{ id: string }>(
        `/classes/${classId}/sessions/start`,
      );
      setSessionId(data.id);
    } catch {
      toast.error('No se pudo iniciar la clase');
    } finally {
      setSessionLoading(false);
    }
  }, [classId]);

  const handleEndSession = useCallback(async () => {
    if (!classId || !sessionId) return;
    if (
      !window.confirm(
        '¿Finalizar la clase? Los resultados quedarán guardados.',
      )
    ) {
      return;
    }
    setSessionLoading(true);
    try {
      const results: {
        studentId: string;
        slideId: string;
        activityType: string;
        correct: boolean | null;
        historial: { label: string; correct: boolean | null }[][];
      }[] = [];
      for (const [slideId, entry] of liveResponses) {
        for (const response of entry.responses) {
          results.push({
            studentId: response.studentId,
            slideId,
            activityType: response.activityType,
            correct: response.correct ?? null,
            historial: response.details ? [response.details] : [],
          });
        }
      }
      try {
        await api.post(`/classes/${classId}/results`, {
          sessionId,
          results,
        });
      } catch {
        toast.error('No se pudieron enviar los resultados al servidor');
      }
      await api.patch(`/classes/${classId}/sessions/end`);
      setSessionId(null);
    } catch {
      toast.error('No se pudo finalizar la clase');
    } finally {
      setSessionLoading(false);
    }
  }, [classId, sessionId, liveResponses]);

  const handleAddSlide = useCallback(() => {
    const afterOrder = sortedSlides[resolvedSlideIndex]?.order ?? 0;
    insertSlide.mutate(
      {
        afterOrder,
        slide: {
          type: 'CONTENT',
          title: 'Nuevo slide',
          content: {
            id: `slide_${Date.now()}`,
            orden: afterOrder + 1,
            tipo: 'contenido',
            layout: 'titulo_y_contenido',
            fondo: { tipo: 'color', valor: '#FFFFFF' },
            bloques: [],
          },
        },
      },
      {
        onSuccess: () => setActiveSlideIndex(resolvedSlideIndex + 1),
        onError: () => toast.error('Error al crear el slide'),
      },
    );
  }, [sortedSlides, resolvedSlideIndex, insertSlide]);

  const handleCommitSlideContent = useCallback(
    (content: Record<string, unknown>) => {
      if (!activeSlide) return;
      if (activeSlideHasActivity) {
        const bloques = Array.isArray(content.bloques) ? (content.bloques as Block[]) : [];
        const hasDisallowed = bloques.some((b) => b.tipo !== 'texto' && b.tipo !== 'actividad');
        if (hasDisallowed) {
          toast.warning('Este slide solo admite un título junto a la actividad');
          return;
        }
      }
      const sanitized = sanitizeSlideContentForPersistence(content) ?? content;
      updateSlide.mutate(
        { slideId: activeSlide.id, content: sanitized },
        {
          onError: () => toast.error('No se pudo guardar el slide'),
        },
      );
    },
    [activeSlide, activeSlideHasActivity, updateSlide],
  );

  const handleActivityChange = useCallback(
    (blockPath: string, activity: Activity) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'actividad') return b;
        return { ...b, actividad: activity };
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleRemoveBlock = useCallback(
    (blockPath: string) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = removeBlockAtPath(bloques, blockPath);
      if (next === bloques) return;
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
      toast.success('Actividad eliminada');
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleCreateSlideWithActivity = useCallback(
    (content: Record<string, unknown>, title: string) => {
      const nextOrder = sortedSlides.length + 1;
      const fullContent = { ...content, orden: nextOrder };
      const sanitized = sanitizeSlideContentForPersistence(fullContent) ?? fullContent;
      createSlide.mutate(
        {
          type: 'CONTENT',
          title,
          content: sanitized,
        },
        {
          onSuccess: () => setActiveSlideIndex(nextOrder - 1),
          onError: () => toast.error('No se pudo crear el slide'),
        },
      );
    },
    [sortedSlides.length, createSlide],
  );

  const handleRemoveSlide = useCallback(
    (slideId: string) => {
      removeSlide.mutate(slideId, {
        onSuccess: () => {
          toast.success('Slide eliminado');
          setActiveSlideIndex((prev) => Math.max(0, prev - 1));
        },
        onError: () => toast.error('No se pudo eliminar el slide'),
      });
    },
    [removeSlide],
  );

  const handleMoveSlide = useCallback(
    (slideId: string, direction: 'up' | 'down') => {
      const idx = sortedSlides.findIndex((s) => s.id === slideId);
      if (idx === -1) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sortedSlides.length) return;

      const newOrder = sortedSlides.map((s, i) => {
        if (i === idx)     return { id: s.id, order: sortedSlides[swapIdx]!.order };
        if (i === swapIdx) return { id: s.id, order: sortedSlides[idx]!.order };
        return { id: s.id, order: s.order };
      });

      reorderSlides.mutate(newOrder, {
        onSuccess: () => {
          setActiveSlideIndex(swapIdx);
          toast.success('Slide reordenado');
        },
        onError: () => toast.error('No se pudo reordenar el slide'),
      });
    },
    [sortedSlides, reorderSlides],
  );

  const handleReorderSlides = useCallback(
    (slideId: string, newIndex: number) => {
      const oldIndex = sortedSlides.findIndex((s) => s.id === slideId);
      if (oldIndex === -1 || oldIndex === newIndex) return;

      const reordered = [...sortedSlides];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved!);

      const newOrder = reordered.map((s, i) => ({ id: s.id, order: i + 1 }));

      reorderSlides.mutate(newOrder, {
        onSuccess: () => {
          setActiveSlideIndex(newIndex);
          toast.success('Slide reordenado');
        },
        onError: () => toast.error('No se pudo reordenar'),
      });
    },
    [sortedSlides, reorderSlides],
  );

  const handleAddActivity = useCallback(
    (type: ActivityType) => {
      const templates: Record<ActivityType, () => Activity> = {
        'quiz-multiple':    quizMultipleTemplate,
        'true-false':       trueFalseTemplate,
        'fill-blank':       fillBlanksTemplate,
        'short-answer':     shortAnswerTemplate,
        'drag-drop':        dragDropTemplate,
        'match':            matchPairsTemplate,
        'sort-steps':       orderStepsTemplate,
        'video-interactive': videoInteractiveTemplate,
        'live-poll':        livePollTemplate,
        'word-cloud':       wordCloudTemplate,
      };
      const titles: Record<ActivityType, string> = {
        'quiz-multiple':    'Opción múltiple',
        'true-false':       'Verdadero o falso',
        'fill-blank':       'Completar blancos',
        'short-answer':     'Respuesta corta',
        'drag-drop':        'Arrastrar y soltar',
        'match':            'Emparejar',
        'sort-steps':       'Ordenar pasos',
        'video-interactive': 'Video interactivo',
        'live-poll':        'Encuesta en vivo',
        'word-cloud':       'Nube de palabras',
      };
      const templateFn = templates[type];
      if (!templateFn) {
        toast.info(`Actividad "${type}" próximamente disponible`);
        return;
      }

      const block: Block = { tipo: 'actividad', actividad: templateFn() };

      // Si el slide activo existe y está vacío (sin bloques), agregar ahí
      if (activeSlide) {
        const c = getSlideContentRecord(activeSlide as ApiSlide);
        const bloques = Array.isArray(c.bloques) ? c.bloques : [];
        if (bloques.length === 0) {
          handleCommitSlideContent(
            mergeSlideContent(activeSlide as ApiSlide, { bloques: [block] }),
          );
          toast.success(`${titles[type]} agregada al slide actual`);
          return;
        }
      }

      // Si no hay slide activo o tiene contenido, crear nuevo slide
      handleCreateSlideWithActivity(
        buildContentDocumentForNewActivitySlide(block),
        titles[type],
      );
      toast.success(`Slide con ${titles[type]} creado`);
    },
    [activeSlide, handleCommitSlideContent, handleCreateSlideWithActivity],
  );

  const handleApplyTheme = useCallback((bg: string) => {
    if (!activeSlide) return;
    const base = (
      typeof activeSlide.content === 'object' && activeSlide.content !== null
        ? activeSlide.content
        : {}
    ) as Record<string, unknown>;
    const updatedContent = { ...base, fondo: { tipo: 'color', valor: bg } };
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;
    updateSlide.mutate(
      { slideId: activeSlide.id, content: sanitized },
      {
        onSuccess: () => toast.success('Tema aplicado'),
        onError: () => toast.error('Error al aplicar tema'),
      },
    );
  }, [activeSlide, updateSlide]);

  // ─── Error state ─────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6">
        <p className="text-sm text-destructive">No se pudo cargar la clase.</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      {/* ── Móvil: no disponible (viewport menor que breakpoint md) ─────────── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center md:hidden">
        <Monitor className="size-12 shrink-0 text-muted-foreground" aria-hidden />
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold">Editor no disponible en el móvil</h2>
          <p className="text-sm text-muted-foreground">
            El editor de slides necesita una pantalla más ancha (tablet en horizontal, portátil o
            escritorio). Abre esta clase desde un dispositivo mayor o amplía la ventana del
            navegador.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/classes/${classId}`}>Volver a la clase</Link>
        </Button>
      </div>

      {/* ── Editor a pantalla completa — md+ (canvas centrado en el espacio flex) ─ */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-editor-shell md:flex">

        {/* ── TOPBAR ── h-14 ──────────────────────────────────────────────── */}
        <header
          ref={editorHeaderRef}
          className="flex h-14 shrink-0 items-center border-b border-border bg-background"
        >

          {/* Zona Volver — 4rem fijo, alineada con IconRail del cuerpo */}
          <div className="flex h-full w-16 min-w-16 max-w-16 shrink-0 items-center justify-center bg-background">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href={`/classes/${classId}`} aria-label="Volver a la clase">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Título + desempeño — flex-1 */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-3">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <p
                  className={cn('truncate text-sm font-semibold leading-tight')}
                  title={desempeno ? desempeno.enunciado : undefined}
                >
                  {cls?.title ?? 'Editor'}
                </p>
              </>
            )}
          </div>

          {/* Botones acción — shrink-0 */}
          <div className="flex shrink-0 items-center gap-2 pr-3">
            {/* Socket connection indicator */}
            <span
              title={isConnected ? 'Conectado en tiempo real' : 'Sin conexión en tiempo real'}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-muted-foreground/40',
                )}
              />
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Compartir próximamente disponible')}
            >
              <Share2 className="size-4" />
              Compartir
            </Button>

            {sessionId === null ? (
              <Button
                type="button"
                size="sm"
                disabled={!classId || sessionLoading}
                onClick={handleStartSession}
                className={cn(
                  'bg-green-600 text-white hover:bg-green-700 hover:text-white',
                  'disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                {sessionLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Iniciar clase
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!classId || sessionLoading}
                onClick={handleEndSession}
                className={cn(
                  'bg-red-600 text-white hover:bg-red-700 hover:text-white',
                  'disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                {sessionLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Finalizar clase
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={sortedSlides.length === 0}
              onClick={() => toast.info('Vista previa no disponible aún')}
            >
              <Eye className="size-4" />
              Vista previa
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!activeSlide || saveStatus === 'saving'}
              onClick={handleSave}
            >
              <Save className="size-4" />
              {saveStatus === 'saving' ? 'Guardando…' : 'Guardar'}
            </Button>

          </div>
        </header>

        {/* ── CUERPO (flex-1 + min-h-0 para canvas centrado y scroll correcto) ─ */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Icon rail — ancho fijo 4rem (md+); no encoger en flex */}
          <div
            ref={leftRailWrapRef}
            className="flex h-full min-h-0 w-16 min-w-16 max-w-16 shrink-0 flex-col overflow-hidden"
          >
            <IconRail
              activePanel={activePanel}
              onPanelToggle={toggleLeftPanel}
              onRefreshDesempeno={handleRefreshDesempeno}
            />
          </div>

          {/* Slides + flyout — 14rem fijo; canvas absorbe el resto (min-w-0) */}
          <div className="relative h-full min-h-0 w-56 min-w-56 max-w-56 shrink-0 overflow-visible">
            <SlidesPanel
              slides={sortedSlides}
              activeIndex={resolvedSlideIndex}
              isLoading={isLoading}
              isAddingSlide={createSlide.isPending}
              onSelect={setActiveSlideIndex}
              onAddSlide={handleAddSlide}
              onRemoveSlide={handleRemoveSlide}
              onMoveSlideUp={(id) => handleMoveSlide(id, 'up')}
              onMoveSlideDown={(id) => handleMoveSlide(id, 'down')}
              onReorderSlides={handleReorderSlides}
            />
            <FlyoutPanel
              ref={flyoutPanelRef}
              activePanel={activePanel}
              onClose={() => setActivePanel(null)}
              apiSlide={activeSlide as ApiSlide}
              onCommitSlideContent={handleCommitSlideContent}
              onCreateActivitySlide={handleCreateSlideWithActivity}
              slides={sortedSlides.map((s) => ({
                id: s.id,
                order: s.order,
                title: s.title,
                type: s.type,
              }))}
              activeSlideIndex={resolvedSlideIndex}
              onSelectSlide={setActiveSlideIndex}
              desempenoEnunciado={desempeno?.enunciado}
              isSlideSaving={updateSlide.isPending}
              slideHasActivity={activeSlideHasActivity}
            />
          </div>

          {/* Canvas area — flex-1 */}
          <CanvasArea
            slide={rendererSlide}
            isLoading={isLoading}
            onActivityChange={handleActivityChange}
            onRemoveBlock={handleRemoveBlock}
          />

          {/* Flyout panel derecho */}
          <RightFlyoutPanel
            ref={rightFlyoutPanelRef}
            activePanel={rightPanel}
            onClose={() => setRightPanel(null)}
            onAddActivity={handleAddActivity}
            onApplyTheme={handleApplyTheme}
            desempenoEnunciado={desempeno?.enunciado}
            hasActivity={activeSlideHasActivity}
            liveResponses={liveResponses}
            activeSlideId={activeSlide?.id ?? ''}
            activeSlideIndex={resolvedSlideIndex}
          />

          {/* Icon rail derecho — w-16 (fuera del cierre por click exterior) */}
          <div
            ref={rightRailWrapRef}
            className="flex h-full min-h-0 w-16 min-w-16 max-w-16 shrink-0 flex-col overflow-hidden"
          >
            <RightRail
              activePanel={rightPanel}
              onPanelToggle={toggleRightPanel}
            />
          </div>

        </div>

        {/* ── STATUS BAR ───────────────────────────────────────────────────── */}
        <footer className="flex min-h-9 shrink-0 items-center justify-between border-t border-border bg-background px-4 py-1.5">
          <span
            className={cn(
              'text-xs tabular-nums',
              saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sortedSlides.length} {sortedSlides.length === 1 ? 'slide' : 'slides'}
          </span>
        </footer>

      </div>

      <NewClassModal
        classId={classId}
        isOpen={modalOpen}
        required={false}
        onClose={() => {
          setModalUserOpen(false);
          setShowCurricularModal(false);
        }}
        onConfirm={(d) => {
          const normalized = withActividadesSugeridas(d);
          setConfirmedDesempeno(normalized);
          setModalUserOpen(false);
          setShowCurricularModal(false);
        }}
      />
    </div>
  );
}
