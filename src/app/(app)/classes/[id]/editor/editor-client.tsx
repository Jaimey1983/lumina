'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Monitor,
  Save,
  Share2,
  Timer,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { useSlideTimer } from '@/hooks/use-slide-timer';
import {
  getEffectiveTimerForApiSlide,
  SLIDE_TIMER_GLOBAL_OPTIONS,
} from '@/lib/slide-timer-resolve';

import { useClass, type Slide as ApiSlide } from '@/hooks/api/use-class';
import { useCreateSlide, useInsertSlide, useRemoveSlide, useReorderSlides, useUpdateSlide } from '@/hooks/api/use-classes';
import { NewClassModal, type DesempenoGenerado, withActividadesSugeridas } from '../new-class-modal';
import {
  buildContentDocumentForNewActivitySlide,
  classSlideToRendererSlide,
  getSlideContentRecord,
  LAYOUT_FROM_KEY,
  mergeSlideContent,
  removeBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import type { Activity, Block } from '@/types/slide.types';
import { IconRail, type LeftPanelId } from './components/icon-rail';
import { FlyoutPanel } from './components/flyout-panel';
import { SlidesPanel } from './components/slides-panel';
import { CanvasArea, type CanvasAreaHandle } from './components/canvas-area';
import { EditorClassCodeSubtitle } from './components/editor-toolbar';
import { RightRail, type RightPanelId } from './components/right-rail';
import { RightFlyoutPanel } from './components/right-flyout-panel';
import {
  buildInsertSlideBloques,
  SLIDE_LAYOUT_ORDER,
  type CoreSlideLayoutKey,
  type SlidePersistedLayoutKey,
} from './components/templates-panel';
import type { ActivityType } from './components/panels/activities-panel';
import type { StudentResponse } from './components/panels/live-responses-panel';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SlideRenderer } from './components/slide-renderer';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAutosave } from '@/hooks/use-autosave';

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

function apiSlideHasActivity(slide: ApiSlide): boolean {
  const c = getSlideContentRecord(slide);
  const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
  return bloques.some((b) => b.tipo === 'actividad');
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

function slideTitleForLayoutKey(key: SlidePersistedLayoutKey): string {
  return SLIDE_LAYOUT_ORDER.find((e) => e.key === key)?.label ?? key;
}

/** Normaliza el conteo de sala desde distintos formatos del backend (Socket.IO). */
function parseRoomStudentCount(payload: unknown): number | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return Math.max(0, Math.floor(payload));
  }
  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    const raw = o.count ?? o.connected ?? o.total ?? o.students ?? o.roomSize;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, Math.floor(raw));
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlideEditorClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  // Socket connection indicator — driven by the single local socket below.
  const [isConnected, setIsConnected] = useState(false);
  const updateSlide  = useUpdateSlide(classId);
  const createSlide  = useCreateSlide(classId);
  const removeSlide    = useRemoveSlide(classId);
  const reorderSlides  = useReorderSlides(classId);
  const insertSlide    = useInsertSlide(classId);

  const [activePanel,        setActivePanel]        = useState<LeftPanelId | null>(null);
  const [rightPanel,         setRightPanel]         = useState<RightPanelId | null>(null);
  const [activeSlideIndex,   setActiveSlideIndex]   = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [modalUserOpen,      setModalUserOpen]      = useState(false);
  const [confirmedDesempeno, setConfirmedDesempeno] = useState<DesempenoGenerado | null>(null);
  const [showCurricularModal, setShowCurricularModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  /** Estudiantes conectados en la sala (eventos Socket.IO del backend). */
  const [roomStudentCount, setRoomStudentCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  /** Live block positions from CanvasArea during / immediately after drag. */
  const [activeSlideLiveBloques, setActiveSlideLiveBloques] = useState<Block[] | null>(null);

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
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);

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

  // ── Socket: single connection — join room, track connection state, listen for responses ──

  useEffect(() => {
    const sock = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    );
    socketRef.current = sock;

    sock.on('connect', () => {
      setIsConnected(true);
      sock.emit('join-class', { classId });
    });

    sock.on('disconnect', () => setIsConnected(false));

    const onRoomStudentCount = (payload: unknown) => {
      const n = parseRoomStudentCount(payload);
      if (n !== null) setRoomStudentCount(n);
    };
    sock.on('students-connected', onRoomStudentCount);
    sock.on('room-students-count', onRoomStudentCount);

    sock.on('response-update', (payload: {
      slideId: string;
      slideIndex: number;
      activityType: string;
      studentId: string;
      studentName?: string;
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

          let mergedResponse = payload.response;
          if (payload.activityType === 'nube_palabras') {
            const arr = Array.isArray(prevEntry.response) ? prevEntry.response : (prevEntry.response ? [prevEntry.response] : []);
            mergedResponse = [...arr, payload.response];
          }

          updatedResponses = existing.responses.map((r, i) =>
            i === existingIndex
              ? {
                  ...r,
                  correct: mergedCorrect,
                  details: mergedDetails,
                  studentName: payload.studentName ?? r.studentName,
                  response: mergedResponse,
                }
              : r,
          );
        } else {
          // New entry for this student
          updatedResponses = [
            ...existing.responses,
            {
              studentId: payload.studentId,
              studentName: payload.studentName,
              correct: payload.correct,
              activityType: payload.activityType,
              details: payload.details,
              response: payload.activityType === 'nube_palabras' ? [payload.response] : payload.response,
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
      sock.off('disconnect');
      sock.off('students-connected', onRoomStudentCount);
      sock.off('room-students-count', onRoomStudentCount);
      sock.off('response-update');
      sock.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setRoomStudentCount(0);
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

  const sessionActive = sessionId !== null || cls?.sessionActive === true;

  useEffect(() => {
    if (!sessionActive) setRoomStudentCount(0);
  }, [sessionActive]);

  const buildSlidePayload = useCallback((raw: unknown) => {
    let payload: unknown = raw ?? null;
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      const s = sanitizeSlideContentForPersistence(payload);
      if (s !== null) payload = s;
    }
    return payload;
  }, []);

  const activeSlideIdRef = useRef<string | null>(null);
  const sessionActiveRef = useRef(false);
  activeSlideIdRef.current = activeSlide?.id ?? null;
  sessionActiveRef.current = sessionActive;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canConfigureLiveTimer = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');
  const [timerGlobalSaving, setTimerGlobalSaving] = useState(false);

  const previewOpenRef = useRef(false);
  const sortedSlidesLengthRef = useRef(0);
  const handleEditorTimerExpireRef = useRef<() => void>(() => {});

  previewOpenRef.current = previewOpen;
  sortedSlidesLengthRef.current = sortedSlides.length;

  useEffect(() => {
    handleEditorTimerExpireRef.current = () => {
      if (!sessionActiveRef.current || previewOpenRef.current) return;
      const sock = socketRef.current;
      const sid = activeSlideIdRef.current;
      if (!sock?.connected || !classId || !sid) return;
      sock.emit('lock-responses', { classId, slideId: sid });
      window.setTimeout(() => {
        setActiveSlideIndex((i) => {
          const max = Math.max(0, sortedSlidesLengthRef.current - 1);
          if (i >= max) return i;
          return i + 1;
        });
      }, 2000);
    };
  }, [classId]);

  const editorLiveTimerSeconds = activeSlide
    ? getEffectiveTimerForApiSlide(activeSlide as ApiSlide, cls?.timerGlobal)
    : 0;
  const editorTimerRunning =
    sessionActive && !previewOpen && editorLiveTimerSeconds > 0 && Boolean(activeSlide?.id);

  useSlideTimer({
    duration: editorLiveTimerSeconds,
    isActive: editorTimerRunning,
    resetKey: activeSlide?.id ?? null,
    onExpire: () => handleEditorTimerExpireRef.current(),
  });

  useEffect(() => {
    const sock = socketRef.current;
    if (!sock?.connected) return;
    sock.emit('slide-change', { slideIndex: resolvedSlideIndex, classId });
    const slide = sortedSlides[resolvedSlideIndex] ?? null;
    const eff = getEffectiveTimerForApiSlide(slide as ApiSlide | null, cls?.timerGlobal);
    if (sessionActive && !previewOpen && eff > 0 && slide?.id) {
      queueMicrotask(() => {
        socketRef.current?.emit('timer-start', {
          slideId: slide.id,
          duration: eff,
          classId,
        });
      });
    }
  }, [
    resolvedSlideIndex,
    classId,
    sessionActive,
    previewOpen,
    sortedSlides,
    cls?.timerGlobal,
    editorLiveTimerSeconds,
    activeSlide?.id,
  ]);

  const handleTimerGlobalChange = useCallback(
    async (value: string) => {
      const n = Number(value);
      setTimerGlobalSaving(true);
      try {
        await api.patch(`/classes/${classId}`, { timerGlobal: n });
        await queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
      } catch {
        toast.error('No se pudo guardar el temporizador global');
      } finally {
        setTimerGlobalSaving(false);
      }
    },
    [classId, queryClient],
  );

  const autosaveSaveFn = useCallback(
    (latest: unknown) => {
      const slideId = activeSlideIdRef.current;
      if (!slideId || sessionActiveRef.current) return;
      const payload = buildSlidePayload(latest);
      updateSlide.mutate(
        { slideId, content: payload },
        {
          onSuccess: () => setSaveError(false),
          onError: () => {
            setSaveError(true);
            toast.error('Error al guardar');
          },
        },
      );
    },
    [buildSlidePayload, updateSlide],
  );

  const autosaveValue = activeSlide?.content ?? null;

  const { isDirty: autosaveDirty, isSaving: autosaveIsSaving } = useAutosave(
    autosaveValue,
    autosaveSaveFn,
    2000,
    {
      enabled: !sessionActive && !!activeSlide,
      isSavePending: updateSlide.isPending,
      resetKey: activeSlide?.id ?? null,
    },
  );

  const saveStatusLabel = useMemo(() => {
    if (saveError) return 'Error al guardar';
    if (autosaveIsSaving) return 'Guardando…';
    if (autosaveDirty) return 'Cambios pendientes…';
    return 'Sin cambios';
  }, [saveError, autosaveIsSaving, autosaveDirty]);

  const previewResolvedIndex = useMemo(() => {
    if (sortedSlides.length === 0) return 0;
    return Math.min(Math.max(0, previewSlideIndex), sortedSlides.length - 1);
  }, [sortedSlides.length, previewSlideIndex]);

  const previewApiSlide = sortedSlides[previewResolvedIndex] ?? null;
  const previewRendererSlide = useMemo(
    () =>
      previewApiSlide ? classSlideToRendererSlide(previewApiSlide as ApiSlide) : null,
    [previewApiSlide],
  );
  const previewHasActivity = previewApiSlide
    ? apiSlideHasActivity(previewApiSlide as ApiSlide)
    : false;

  // Clear live bloques whenever the user switches to a different slide.
  useEffect(() => {
    setActiveSlideLiveBloques(null);
  }, [resolvedSlideIndex]);

  const rendererSlide = useMemo(
    () => (activeSlide ? classSlideToRendererSlide(activeSlide as ApiSlide) : null),
    [activeSlide],
  );

  /**
   * Content override for the active slide thumbnail: merge live block positions
   * into the raw API content so SlidesPanel shows real-time positions.
   */
  const activeSlideLiveContent = useMemo<unknown>(() => {
    if (!activeSlideLiveBloques || !activeSlide) return undefined;
    const base =
      activeSlide.content && typeof activeSlide.content === 'object' && !Array.isArray(activeSlide.content)
        ? (activeSlide.content as Record<string, unknown>)
        : {};
    return { ...base, bloques: activeSlideLiveBloques };
  }, [activeSlideLiveBloques, activeSlide]);

  const activeActivity = useMemo<Activity | null>(() => {
    if (!activeSlide) return null;
    const c = getSlideContentRecord(activeSlide as ApiSlide);
    const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
    const actBlock = bloques.find((b) => b.tipo === 'actividad');
    return (actBlock?.actividad as Activity) ?? null;
  }, [activeSlide]);
  const activeSlideHasActivity = !!activeActivity;

  const liveSlideRespondedCount = useMemo(() => {
    if (!activeSlide?.id) return 0;
    const list = liveResponses.get(activeSlide.id)?.responses;
    if (!list?.length) return 0;
    return new Set(list.map((r) => r.studentId).filter(Boolean)).size;
  }, [activeSlide?.id, liveResponses]);

  const showLiveResponsesTopbar =
    sessionActive && activeSlideHasActivity && roomStudentCount > 0;

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
    const payload = buildSlidePayload(activeSlide.content ?? null);
    updateSlide.mutate(
      { slideId: activeSlide.id, content: payload },
      {
        onSuccess: () => {
          setSaveError(false);
          toast.success('Slide guardado');
        },
        onError: () => {
          setSaveError(true);
          toast.error('Error al guardar');
        },
      },
    );
  }, [activeSlide, buildSlidePayload, updateSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSave();
        return;
      }

      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isEditing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isEditing) return;

      const canvas = canvasAreaRef.current;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (modalOpen || previewOpen) return;
        if (activePanel) {
          e.preventDefault();
          setActivePanel(null);
          return;
        }
        if (rightPanel) {
          e.preventDefault();
          setRightPanel(null);
          return;
        }
        e.preventDefault();
        canvas?.clearBlockSelection();
        return;
      }

      if (mod && (e.key === 'z' || e.key === 'Z') && !e.altKey) {
        e.preventDefault();
        if (e.shiftKey) canvas?.redo();
        else canvas?.undo();
        return;
      }

      if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        canvas?.redo();
        return;
      }

      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        canvas?.duplicateSelectedBlock();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas?.deleteSelectedBlock()) e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleSave,
    modalOpen,
    previewOpen,
    activePanel,
    rightPanel,
  ]);

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
        score: number | null;
        maxScore: number;
        historial: { label: string; correct: boolean | null }[][];
      }[] = [];
      for (const [slideId, entry] of liveResponses) {
        for (const response of entry.responses) {
          let score: number | null;
          let maxScore: number;

          if (
            response.activityType === 'short_answer' ||
            response.activityType === 'encuesta_viva' ||
            response.activityType === 'nube_palabras'
          ) {
            score = response.correct === null ? 0.0 : 1.0;
            maxScore = 5;
          } else if (response.details && response.details.length > 0) {
            // Actividades con sub-respuestas: video_interactivo, match_pairs,
            // fill_blanks, drag_drop, order_steps
            const total = response.details.length;
            const correctas = response.details.filter((d) => d.correct === true)
              .length;
            if (response.correct === null) {
              // No respondió
              score = 0.0;
            } else if (correctas === 0) {
              // Respondió pero todo mal — mínimo colombiano
              score = 1.0;
            } else {
              score = (correctas / total) * 5.0;
            }
            maxScore = 5;
          } else {
            // Actividades con respuesta única: quiz, verdadero_falso, etc.
            if (response.correct === null) {
              score = 0.0;
            } else if (response.correct === false) {
              score = 1.0;
            } else {
              score = 5.0;
            }
            maxScore = 5;
          }
          results.push({
            studentId: response.studentId,
            slideId,
            activityType: response.activityType,
            correct: response.correct ?? null,
            score,
            maxScore,
            historial: response.details ? [response.details] : [],
          });
        }
      }
      try {
        const resultadosFiltrados = results.filter((r) => !!r.studentId);
        if (resultadosFiltrados.length > 0) {
          await api.post(`/classes/${classId}/results`, {
            sessionId,
            resultados: resultadosFiltrados,
          });
        }
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

  const handleAddSlideWithLayout = useCallback(
    (layoutKey: CoreSlideLayoutKey) => {
      const slideActivo = sortedSlides[resolvedSlideIndex];
      const afterOrder = slideActivo?.order ?? 0;
      const bloques = buildInsertSlideBloques(layoutKey, false);
      insertSlide.mutate(
        {
          afterOrder,
          slide: {
            type: 'CONTENT',
            title: slideTitleForLayoutKey(layoutKey),
            content: {
              id: `slide_${Date.now()}`,
              orden: afterOrder + 1,
              tipo: 'contenido',
              layout: layoutKey,
              fondo: { tipo: 'color', valor: '#ffffff' },
              bloques,
            },
          },
        },
        {
          onSuccess: () =>
            setActiveSlideIndex(slideActivo ? resolvedSlideIndex + 1 : 0),
          onError: () => toast.error('Error al crear el slide'),
        },
      );
    },
    [sortedSlides, resolvedSlideIndex, insertSlide],
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      const idx = sortedSlides.findIndex((s) => s.id === slideId);
      if (idx === -1) return;
      const slide = sortedSlides[idx]! as ApiSlide;
      const record = getSlideContentRecord(slide);
      const raw = slide.content;
      let contentClone: Record<string, unknown>;
      if (raw !== null && raw !== undefined && typeof raw === 'object' && !Array.isArray(raw)) {
        contentClone = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
      } else {
        contentClone = { ...record };
      }

      const layoutFromClone = typeof contentClone.layout === 'string' ? contentClone.layout : undefined;
      const layoutFromRecord = typeof record.layout === 'string' ? record.layout : undefined;
      const layout = layoutFromClone ?? layoutFromRecord ?? 'titulo_y_contenido';

      const fondo = contentClone.fondo ?? record.fondo ?? { tipo: 'color' as const, valor: '#ffffff' };

      const merged: Record<string, unknown> = {
        ...contentClone,
        layout,
        fondo,
        id: `slide_${Date.now()}`,
        orden: slide.order + 1,
        tipo:
          typeof contentClone.tipo === 'string'
            ? contentClone.tipo
            : (typeof record.tipo === 'string' ? record.tipo : 'contenido'),
      };

      const sanitized = sanitizeSlideContentForPersistence(merged) ?? merged;

      insertSlide.mutate(
        {
          afterOrder: slide.order,
          slide: {
            type: slide.type,
            title: `${slide.title} (copia)`,
            content: sanitized,
          },
        },
        {
          onSuccess: () => setActiveSlideIndex(idx + 1),
          onError: () => toast.error('No se pudo duplicar el slide'),
        },
      );
    },
    [sortedSlides, insertSlide],
  );

  const handleApplyLayout = useCallback(
    (layoutKey: SlidePersistedLayoutKey) => {
      const slideActivo = sortedSlides[resolvedSlideIndex];
      const afterOrder = slideActivo?.order ?? 0;
      const bloquesNew = buildInsertSlideBloques(layoutKey, false);
      const fondo = { tipo: 'color' as const, valor: '#ffffff' };

      const insertAfterActive = () => {
        insertSlide.mutate(
          {
            afterOrder,
            slide: {
              type: 'CONTENT',
              title: slideTitleForLayoutKey(layoutKey),
              content: {
                id: `slide_${Date.now()}`,
                orden: afterOrder + 1,
                tipo: 'contenido',
                layout: layoutKey,
                fondo,
                bloques: bloquesNew,
              },
            },
          },
          {
            onSuccess: () =>
              setActiveSlideIndex(
                slideActivo ? resolvedSlideIndex + 1 : 0,
              ),
            onError: () => toast.error('Error al insertar el slide'),
          },
        );
      };

      if (!slideActivo) {
        insertAfterActive();
        return;
      }

      const c = getSlideContentRecord(slideActivo as ApiSlide);
      const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
      const tieneActividad = bloques.some((b) => b.tipo === 'actividad');
      const tieneContenidoReal = bloques.some((b) => {
        if (b.tipo === 'actividad') return true;
        if (b.tipo === 'texto') {
          const t = b.contenido;
          return typeof t === 'string' && t.trim() !== '';
        }
        if (b.tipo === 'imagen') {
          const u = b.url;
          return typeof u === 'string' && u.trim() !== '';
        }
        return false;
      });

      if (tieneActividad) {
        insertAfterActive();
        return;
      }

      if (!tieneContenidoReal) {
        const resolvedKey =
          layoutKey in LAYOUT_FROM_KEY ? layoutKey : 'titulo_y_contenido';
        const nextContent = mergeSlideContent(slideActivo as ApiSlide, {
          layout: resolvedKey,
          diseno: LAYOUT_FROM_KEY[resolvedKey],
          bloques: bloquesNew,
          fondo,
        });
        const sanitized =
          sanitizeSlideContentForPersistence(nextContent) ?? nextContent;
        updateSlide.mutate(
          { slideId: slideActivo.id, content: sanitized },
          {
            onSuccess: () => toast.success('Layout aplicado'),
            onError: () => toast.error('No se pudo aplicar el layout'),
          },
        );
        return;
      }

      toast('El slide tiene contenido', {
        description: 'Solo se puede aplicar un layout a slides vacíos.',
      });
    },
    [sortedSlides, resolvedSlideIndex, insertSlide, updateSlide],
  );

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
                <EditorClassCodeSubtitle codigo={cls?.codigo} />
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

            {canConfigureLiveTimer ? (
              <div className="flex items-center gap-1.5">
                <Timer className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <Select
                  value={String(cls?.timerGlobal ?? 0)}
                  disabled={timerGlobalSaving || isLoading}
                  onValueChange={handleTimerGlobalChange}
                >
                  <SelectTrigger className="h-8 w-[7.25rem] text-xs" size="sm">
                    <SelectValue placeholder="Timer global" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLIDE_TIMER_GLOBAL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

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

            {showLiveResponsesTopbar ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#F97316]/25 px-2.5 py-0.5 text-xs font-medium tabular-nums"
                style={{ backgroundColor: '#FFF0E6', color: '#F97316' }}
                title="Respuestas en este slide vs. estudiantes conectados en la sala"
              >
                <Users className="size-3.5 shrink-0" aria-hidden />
                {liveSlideRespondedCount} / {roomStudentCount} respondieron
              </span>
            ) : null}

            {sortedSlides.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewSlideIndex(resolvedSlideIndex);
                  setPreviewOpen(true);
                }}
              >
                <Eye className="size-4" />
                Vista previa
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              disabled={!activeSlide || updateSlide.isPending}
              onClick={handleSave}
            >
              <Save className="size-4" />
              {updateSlide.isPending ? 'Guardando…' : 'Guardar'}
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
              activeSlideLiveContent={activeSlideLiveContent}
              isLoading={isLoading}
              isAddingSlide={insertSlide.isPending}
              onSelect={setActiveSlideIndex}
              onAddSlide={handleAddSlideWithLayout}
              onRemoveSlide={handleRemoveSlide}
              onDuplicateSlide={handleDuplicateSlide}
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
              onApplyLayout={handleApplyLayout}
              applyLayoutPending={insertSlide.isPending || updateSlide.isPending}
            />
          </div>

          {/* Canvas area — flex-1 */}
          <CanvasArea
            ref={canvasAreaRef}
            slide={rendererSlide}
            isLoading={isLoading}
            onActivityChange={handleActivityChange}
            onRemoveBlock={handleRemoveBlock}
            onEffectiveBloques={setActiveSlideLiveBloques}
            livePanelOpen={rightPanel === 'live'}
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
            activeActivity={activeActivity}
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
              saveError ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {saveStatusLabel}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {sortedSlides.length} {sortedSlides.length === 1 ? 'slide' : 'slides'}
          </span>
        </footer>

      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className={cn(
            'flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0',
            'border-border bg-[#fff8f3] sm:w-full',
          )}
        >
          <DialogHeader className="mb-0 shrink-0 space-y-0 border-b border-border/60 bg-white px-6 py-4 text-start">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Vista previa de la clase
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="min-h-0 overflow-y-auto px-4 pb-6 pt-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-full flex-col items-stretch gap-4">
              <div className="flex w-full items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 rounded-full border-border bg-white shadow-sm hover:border-[#F97316]/40"
                  disabled={previewResolvedIndex <= 0}
                  aria-label="Diapositiva anterior"
                  onClick={() =>
                    setPreviewSlideIndex((i) => Math.max(0, i - 1))
                  }
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
                  {previewHasActivity ? (
                    <span
                      className="absolute right-2 top-2 z-10 inline-flex items-center rounded-md bg-white/95 px-1.5 py-1 text-[#F97316] shadow-sm ring-1 ring-border/60"
                      title="Incluye actividad"
                    >
                      <Zap className="size-4 shrink-0" aria-hidden />
                      <span className="sr-only">Incluye actividad</span>
                    </span>
                  ) : null}
                  <div className="pointer-events-none w-full [&_*]:pointer-events-none">
                    {previewRendererSlide ? (
                      <SlideRenderer
                        slide={previewRendererSlide}
                        modo="preview"
                        className="h-full w-full"
                      />
                    ) : null}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 rounded-full border-border bg-white shadow-sm hover:border-[#F97316]/40"
                  disabled={
                    sortedSlides.length === 0 ||
                    previewResolvedIndex >= sortedSlides.length - 1
                  }
                  aria-label="Diapositiva siguiente"
                  onClick={() =>
                    setPreviewSlideIndex((i) =>
                      Math.min(sortedSlides.length - 1, i + 1),
                    )
                  }
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-sm font-medium tabular-nums text-foreground">
                  Diapositiva {previewResolvedIndex + 1} de {sortedSlides.length}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-[#F97316]/35 bg-white text-xs text-foreground hover:border-[#F97316]/60 hover:bg-[#fff8f3]"
                  onClick={() => {
                    setPreviewOpen(false);
                    setActiveSlideIndex(previewResolvedIndex);
                  }}
                >
                  Ir a este slide
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

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
