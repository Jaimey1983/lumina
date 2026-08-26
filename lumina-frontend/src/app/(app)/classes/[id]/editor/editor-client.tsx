'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Grid3x3,
  History,
  Loader2,
  Lock,
  LockOpen,
  Monitor,
  Palette,
  Redo2,
  Ruler,
  Save,
  Share2,
  Timer,
  Undo2,
  Users,
  Zap,
  Trophy,
  EyeOff,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { useSlideTimer } from '@/hooks/use-slide-timer';
import {
  getEffectiveTimerForApiSlide,
  SLIDE_TIMER_GLOBAL_OPTIONS,
} from '@/lib/slide-timer-resolve';

import { useClass, type ClassDetail, type Slide as ApiSlide } from '@/hooks/api/use-class';
import {
  useCreateSlide,
  useInsertSlide,
  useRemoveSlide,
  useReorderSlides,
  useUpdateClass,
  useUpdateSlide,
} from '@/hooks/api/use-classes';
import {
  useCreateSlideVersion,
  useRestoreSlideVersion,
  useSlideVersions,
  type SlideVersion,
} from '@/hooks/api/use-slide-versions';
import { NewClassModal, type DesempenoGenerado, withActividadesSugeridas } from '../new-class-modal';
import {
  appendBlockToSlideContent,
  buildContentDocumentForNewActivitySlide,
  classSlideToRendererSlide,
  getSlideContentRecord,
  LAYOUT_FROM_KEY,
  mergeSlideContent,
  removeBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { createDefaultFlipCardsBlock } from '@/lib/flip-cards-defaults';
import { createDefaultTabsBlock } from '@/lib/tabs-defaults';
import { createDefaultCarouselBlock } from '@/lib/carousel-defaults';
import { createDefaultClickRevealBlock } from '@/lib/click-reveal-defaults';
import { createDefaultPopupBlock } from '@/lib/popup-defaults';
import { createDefaultHotspotBlock } from '@/lib/hotspot-defaults';
import { createDefaultTooltipBlock } from '@/components/widgets/tooltip/tooltip-defaults';
import { createDefaultBotonBlock } from '@/components/widgets/boton/boton-defaults';
import { createDefaultContadorBlock } from '@/components/widgets/contador/contador-defaults';
import { createDefaultProgresoBlock } from '@/components/widgets/progreso/progreso-defaults';
import { SlideNavContext } from '@/components/widgets/shared/slide-nav-context';
import { createDefaultTimelineBlock } from '@/lib/timeline-defaults';
import { createDefaultClasificar } from '@/lib/clasificar-defaults';
import { createDefaultMemoria } from '@/lib/memoria-defaults';
import { createDefaultPuzzleImagen } from '@/lib/puzzle-imagen-defaults';
import { createDefaultSopaLetras } from '@/lib/sopa-letras-defaults';
import { createDefaultCrucigrama } from '@/lib/crucigrama-defaults';
import { createDefaultAbrirCaja } from '@/lib/abrir-caja-defaults';
import { createDefaultAnagrama } from '@/lib/anagrama-defaults';
import { createDefaultAhorcado } from '@/lib/ahorcado-defaults';
import { createDefaultPuzzlePalabras } from '@/lib/puzzle-palabras-defaults';
import { createDefaultEmparejar } from '@/lib/emparejar-defaults';
import { createDefaultGlobos } from '@/lib/globos-defaults';
import { createDefaultTopo } from '@/lib/topo-defaults';
import { createDefaultRuleta } from '@/lib/ruleta-defaults';
import { createDefaultHistoriaRamificada } from '@/lib/historia-ramificada-defaults';
import {
  BLOCK_FALLBACKS,
  parseClassModoEntrega,
  type Activity,
  type Block,
  type Background,
  type ClassModoEntrega,
  type FlipCardsWidget,
  type SlideGuias,
  type TabsWidget,
  type CarouselWidget,
  type ClickRevealWidget,
  type PopupWidget,
  type TimelineWidget,
  type HotspotWidget,
  EMPTY_SLIDE_GUIAS,
  GRID_SIZE_PRESETS,
} from '@/types/slide.types';
import { normalizeSlideGrilla } from '@/lib/canvas-grid';
import {
  CANVAS_ZOOM_DEFAULT,
  CANVAS_ZOOM_STEP,
  clampCanvasZoom,
  formatCanvasZoom,
  readStoredCanvasZoom,
  stepCanvasZoom,
  writeStoredCanvasZoom,
} from '@/lib/canvas-zoom';
import { IconRail, type LeftPanelId } from './components/icon-rail';
import { FlyoutPanel } from './components/flyout-panel';
import { SlidesPanel } from './components/slides-panel';
import { CanvasArea, type CanvasAreaHandle } from './components/canvas-area';
import { RightRail, type RightPanelId } from './components/right-rail';
import { RightFlyoutPanel } from './components/right-flyout-panel';
import {
  buildInsertSlideBloques,
  SLIDE_LAYOUT_ORDER,
  type CoreSlideLayoutKey,
  type SlidePersistedLayoutKey,
} from './components/templates-panel';
import type { ActivityType, WidgetType } from './components/panels/activities-panel';
import { getActivityPanelItem } from './components/panels/activities-panel';
import { getWidgetPanelItem } from './components/panels/widget-panel-catalog';
import { EditorDndShell } from './components/editor-dnd-shell';
import type { BlockMarco } from '@/types/slide.types';
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SlideRenderer } from './components/slide-renderer';
import { normalizeEscapeRoomActivity } from '@/components/editor/activities/escape-room-editor';
import { api } from '@/lib/api';
import {
  getCustomThemesForClass,
  mergeDesempenoWithCustomThemes,
  persistCustomThemesLocally,
} from '@/lib/class-custom-themes';
import { ImportPptxModal } from '@/components/editor/import-pptx-modal';
import type { SlideImportado } from '@/hooks/api/use-import-pptx';
import { getBackground } from '@/lib/class-backgrounds';
import {
  buildSlideContentWithTheme,
  getSlideTemaIdFromContent,
  NO_SLIDE_THEME_ID,
} from '@/lib/slide-themes';
import { cn } from '@/lib/utils';
import {
  detailsForLivePanel,
  evaluateActivityResponse,
  extractActivityDefinition,
} from '@/lib/activity-scoring';
import { useGamification } from '@/hooks/use-gamification';
import { GamificationLeaderboard } from '@/components/gamification/gamification-leaderboard';
import type { SlideTheme } from '@/types/slide.types';
import { useAutosave } from '@/hooks/use-autosave';
import { NUDGE_STEP_PX, NUDGE_STEP_SHIFT_PX } from '@/hooks/use-block-drag';

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
  return createDefaultEmparejar();
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

function torneoTemplate(): Activity {
  const fb = BLOCK_FALLBACKS.torneo;
  return {
    tipo: 'torneo',
    preguntas: fb.preguntas.map((p) => ({
      enunciado: p.enunciado,
      opciones: [...p.opciones],
      correcta: p.correcta,
      tiempoSegundos: p.tiempoSegundos,
    })),
    puntosBase: fb.puntosBase,
    bonusVelocidad: fb.bonusVelocidad,
  };
}

function escapeRoomTemplate(): Activity {
  return normalizeEscapeRoomActivity(undefined);
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
function countBloquesInSlideContent(content: unknown): number {
  if (content === null || typeof content !== 'object' || Array.isArray(content)) return 0;
  const bloques = (content as { bloques?: unknown }).bloques;
  return Array.isArray(bloques) ? bloques.length : 0;
}

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
  const classBackground = getBackground(cls?.background ?? 'none');
  const modoEntrega = parseClassModoEntrega(cls?.modoEntrega);
  const modoEntregaRef = useRef<ClassModoEntrega>(modoEntrega);
  modoEntregaRef.current = modoEntrega;
  // Socket connection indicator — driven by the single local socket below.
  const [isConnected, setIsConnected] = useState(false);
  const courseId = cls?.courseId ?? '';
  const updateSlide  = useUpdateSlide(classId);
  const updateClassMutation = useUpdateClass(classId, courseId);
  const createSlide  = useCreateSlide(classId);
  const removeSlide    = useRemoveSlide(classId);
  const reorderSlides  = useReorderSlides(classId);
  const insertSlide    = useInsertSlide(classId);

  const [activePanel,        setActivePanel]        = useState<LeftPanelId | null>(null);
  const [rightPanel,         setRightPanel]         = useState<RightPanelId | null>(null);
  const [guidesVisible,      setGuidesVisible]      = useState(true);
  const [canvasZoom,         setCanvasZoom]         = useState(CANVAS_ZOOM_DEFAULT);
  const [canvasHistory,      setCanvasHistory]      = useState({ canUndo: false, canRedo: false });
  const [copiedBlock,        setCopiedBlock]        = useState<Block | null>(null);
  const [activeSlideIndex,   setActiveSlideIndex]   = useState(0);

  useEffect(() => {
    setCanvasZoom(readStoredCanvasZoom());
  }, []);

  const handleCanvasZoomChange = useCallback((next: number) => {
    const z = clampCanvasZoom(next);
    setCanvasZoom(z);
    writeStoredCanvasZoom(z);
  }, []);
  const [saveError, setSaveError] = useState(false);
  const [modalUserOpen,      setModalUserOpen]      = useState(false);
  const [confirmedDesempeno, setConfirmedDesempeno] = useState<DesempenoGenerado | null>(null);
  const [showCurricularModal, setShowCurricularModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  /** Recarga u otra pestaña: hidratar el id de sesión desde la clase si el estado local sigue vacío. */
  useEffect(() => {
    if (sessionId) return;
    if (!cls) return;
    const fromApi =
      (typeof cls.activeSessionId === 'string' && cls.activeSessionId.trim()) ||
      (typeof cls.liveSessionId === 'string' && cls.liveSessionId.trim()) ||
      (typeof cls.sessionId === 'string' && cls.sessionId.trim()) ||
      null;
    if (fromApi) {
      setSessionId(fromApi);
      return;
    }
    if (cls.status === 'LIVE' || cls.sessionActive) {
      setSessionId(cls.id);
    }
  }, [cls, sessionId]);
  /** Estudiantes conectados en la sala (eventos Socket.IO del backend). */
  const [roomStudentCount, setRoomStudentCount] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [responsesLocked, setResponsesLocked] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [versionPendingRestore, setVersionPendingRestore] = useState<SlideVersion | null>(null);
  const [pptxModalOpen, setPptxModalOpen] = useState(false);

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

  /** Declarado antes del socket para handlers que leen `sessionActiveRef`. */
  const sessionActiveRef = useRef(false);
  const [autonomousStudentSlide, setAutonomousStudentSlide] = useState<Map<string, number>>(
    () => new Map(),
  );

  const socketRef = useRef<Socket | null>(null);
  const [mainLiveSocket, setMainLiveSocket] = useState<Socket | null>(null);
  const torneoSocketRef = useRef<Socket | null>(null);

  const leftRailWrapRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);
  const flyoutPanelRef = useRef<HTMLElement>(null);
  const rightRailWrapRef = useRef<HTMLDivElement>(null);
  const rightFlyoutPanelRef = useRef<HTMLElement>(null);
  /** Top bar (Volver, acciones): no cerrar flyouts aquí en pointerdown — el setState antes del click rompe la navegación del Link. */
  const editorHeaderRef = useRef<HTMLElement>(null);
  const canvasAreaRef = useRef<CanvasAreaHandle>(null);
  const canvasSurfaceRef = useRef<HTMLDivElement>(null);

  const { user, token } = useAuth();
  const [torneoSocketRevision, setTorneoSocketRevision] = useState(0);

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
    setMainLiveSocket(sock);

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

    sock.on(
      'student-progress',
      (payload: {
        classId?: string;
        studentId?: string;
        slideIndex?: number;
      }) => {
        if (payload?.classId && payload.classId !== classId) return;
        if (!sessionActiveRef.current || modoEntregaRef.current !== 'autonomo') return;
        const sid = payload?.studentId;
        const rawIdx = payload?.slideIndex;
        if (!sid || typeof rawIdx !== 'number' || !Number.isFinite(rawIdx)) return;
        const slideIndex = Math.max(0, Math.floor(rawIdx));
        setAutonomousStudentSlide((prev) => {
          const next = new Map(prev);
          next.set(sid, slideIndex);
          return next;
        });
      },
    );

    return () => {
      sock.off('connect');
      sock.off('disconnect');
      sock.off('students-connected', onRoomStudentCount);
      sock.off('room-students-count', onRoomStudentCount);
      sock.off('response-update');
      sock.off('student-progress');
      sock.disconnect();
      socketRef.current = null;
      setMainLiveSocket(null);
      setIsConnected(false);
      setRoomStudentCount(0);
    };
  }, [classId]);

  useEffect(() => {
    if (!token) {
      setTorneoSocketRevision((n) => n + 1);
      return;
    }
    const sock = io(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/live`,
      { auth: { token } },
    );
    sock.on('connect', () => {
      sock.emit('join', { classId });
    });
    torneoSocketRef.current = sock;
    setTorneoSocketRevision((n) => n + 1);
    return () => {
      sock.disconnect();
      torneoSocketRef.current = null;
      setTorneoSocketRevision((n) => n + 1);
    };
  }, [classId, token]);

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
  const activeGrid = normalizeSlideGrilla(
    activeSlide
      ? (getSlideContentRecord(activeSlide as ApiSlide).guias as SlideGuias | undefined)?.grilla
      : undefined,
  );

  const createSlideVersion = useCreateSlideVersion(classId, activeSlide?.id);
  const restoreSlideVersion = useRestoreSlideVersion(classId, activeSlide?.id);
  const { data: slideVersions = [], isLoading: slideVersionsLoading } = useSlideVersions(
    classId,
    activeSlide?.id,
  );

  const sessionActive = sessionId !== null || cls?.sessionActive === true;

  const {
    leaderboard: gamificationLeaderboard,
    activo: gamificacionActiva,
    leaderboardVisible,
    iniciarGamificacion,
    toggleLeaderboardVisible,
  } = useGamification({
    socket: mainLiveSocket,
    sessionId,
    classId: classId ?? null,
    isViewer: false,
  });

  useEffect(() => {
    if (!sessionActive) setRoomStudentCount(0);
  }, [sessionActive]);

  useEffect(() => {
    if (!sessionActive) setAutonomousStudentSlide(new Map());
  }, [sessionActive]);

  const autonomousStudentsPerSlide = useMemo(() => {
    const n = sortedSlides.length;
    const arr = new Array<number>(n).fill(0);
    for (const idx of autonomousStudentSlide.values()) {
      if (typeof idx === 'number' && idx >= 0 && idx < n) {
        arr[idx] += 1;
      }
    }
    return arr;
  }, [sortedSlides.length, autonomousStudentSlide]);

  const buildSlidePayload = useCallback((raw: unknown) => {
    let payload: unknown = raw ?? null;
    if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
      const s = sanitizeSlideContentForPersistence(payload);
      if (s !== null) payload = s;
    }
    return payload;
  }, []);

  const activeSlideIdRef = useRef<string | null>(null);
  const responsesLockedRef = useRef(false);
  const prevActiveSlideIdForLockRef = useRef<string | null>(null);
  activeSlideIdRef.current = activeSlide?.id ?? null;
  sessionActiveRef.current = sessionActive;
  responsesLockedRef.current = responsesLocked;

  const queryClient = useQueryClient();
  const canConfigureLiveTimer = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '');
  const [timerGlobalSaving, setTimerGlobalSaving] = useState(false);
  const [themeApplyBusy, setThemeApplyBusy] = useState(false);
  const [contentSaveEpoch, setContentSaveEpoch] = useState(0);

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
      setResponsesLocked(true);
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
    if (modoEntrega === 'clase') {
      sock.emit('slide-change', { slideIndex: resolvedSlideIndex, classId });
    }
    const slide = sortedSlides[resolvedSlideIndex] ?? null;
    const eff = getEffectiveTimerForApiSlide(slide as ApiSlide | null, cls?.timerGlobal);
    if (
      modoEntrega === 'clase' &&
      sessionActive &&
      !previewOpen &&
      eff > 0 &&
      slide?.id
    ) {
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
    modoEntrega,
  ]);

  /** Al cambiar de slide: desbloquear estado local y notificar al backend si seguía bloqueado. */
  useEffect(() => {
    const currentId = activeSlide?.id ?? null;
    const prevId = prevActiveSlideIdForLockRef.current;

    if (prevId === currentId) return;

    if (prevId !== null && responsesLockedRef.current) {
      const sock = socketRef.current;
      if (sock?.connected && classId) {
        sock.emit('unlock-responses', { classId, slideId: prevId });
      }
    }

    if (prevId !== currentId) {
      setResponsesLocked(false);
    }

    prevActiveSlideIdForLockRef.current = currentId;
  }, [activeSlide?.id, classId]);

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

  const handleModoEntregaChange = useCallback(
    async (next: ClassModoEntrega) => {
      if (!classId || sessionActive) return;
      try {
        await api.patch(`/classes/${classId}`, { modoEntrega: next });
        await queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
      } catch {
        toast.error('No se pudo guardar el modo de clase');
      }
    },
    [classId, queryClient, sessionActive],
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
      resetKey: `${activeSlide?.id ?? ''}:${contentSaveEpoch}`,
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

  const customThemes = useMemo(
    () => getCustomThemesForClass(classId, cls?.desempeno),
    [classId, cls?.desempeno],
  );

  const activeTemaId = useMemo(
    () => (activeSlide ? getSlideTemaIdFromContent(activeSlide.content) : undefined),
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

  const rightFlyoutLiveSocket = useMemo(
    () => {
      if (activeActivity?.tipo === 'torneo') return torneoSocketRef.current;
      return socketRef.current;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- torneoSocketRevision sincroniza el ref de /live
    [activeActivity?.tipo, torneoSocketRevision],
  );

  const liveSlideRespondedCount = useMemo(() => {
    if (!activeSlide?.id) return 0;
    const list = liveResponses.get(activeSlide.id)?.responses;
    if (!list?.length) return 0;
    return new Set(list.map((r) => r.studentId).filter(Boolean)).size;
  }, [activeSlide?.id, liveResponses]);

  const showLiveResponsesTopbar =
    sessionActive && activeSlideHasActivity && roomStudentCount > 0;

  const handleToggleResponsesLocked = useCallback(() => {
    if (!sessionActive) return;
    const sock = socketRef.current;
    const sid = activeSlide?.id;
    if (!sock?.connected || !classId || !sid) return;

    setResponsesLocked((wasLocked) => {
      if (!wasLocked) {
        sock.emit('lock-responses', { classId, slideId: sid });
        return true;
      }
      sock.emit('unlock-responses', { classId, slideId: sid });
      return false;
    });
  }, [sessionActive, classId, activeSlide?.id]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleLeftPanel = useCallback((id: LeftPanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  const toggleRightPanel = useCallback((id: RightPanelId) => {
    setRightPanel((prev) => (prev === id ? null : id));
  }, []);

  const handlePasteBlockInSlide = useCallback(
    (slideId: string, block: Block) => {
      const targetSlide = sortedSlides.find((s) => s.id === slideId);
      if (!targetSlide) return;
      const c = getSlideContentRecord(targetSlide as ApiSlide);
      const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
      const slideMeta = {
        bloques,
        fondo: c.fondo as Background | undefined,
        guias: (c.guias as SlideGuias | undefined) ?? EMPTY_SLIDE_GUIAS,
      };
      if (slideId === activeSlide?.id) {
        canvasAreaRef.current?.pasteCopiedBlock(block);
        return;
      }
      canvasAreaRef.current?.pasteCopiedBlockInSlide(slideId, block, slideMeta);
    },
    [sortedSlides, activeSlide?.id],
  );

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
          if (!sessionActiveRef.current) {
            const versionContent =
              payload !== null && typeof payload === 'object' && !Array.isArray(payload)
                ? payload
                : {};
            createSlideVersion.mutate(
              { content: versionContent },
              {
                onError: () => {
                  toast.error('No se pudo guardar la versión en el historial');
                },
              },
            );
          }
        },
        onError: () => {
          setSaveError(true);
          toast.error('Error al guardar');
        },
      },
    );
  }, [activeSlide, buildSlidePayload, updateSlide, createSlideVersion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      if (isEditable) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSave();
        return;
      }

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

      if (mod && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        canvas?.copySelectedBlock();
        return;
      }

      if (mod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (copiedBlock) {
          canvas?.pasteCopiedBlock(copiedBlock);
        }
        return;
      }

      if (mod && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        canvas?.duplicateSelectedBlock();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isEditable =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (isEditable) return;
        if (canvas?.deleteSelectedBlock()) e.preventDefault();
        return;
      }

      if (
        !mod &&
        (e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown')
      ) {
        const step = e.shiftKey ? NUDGE_STEP_SHIFT_PX : NUDGE_STEP_PX;
        const dx =
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy =
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        if (canvas?.nudgeSelectedBlocks(dx, dy)) e.preventDefault();
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
    copiedBlock,
    activeSlide?.id,
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
        response: unknown;
      }[] = [];
      for (const [slideId, entry] of liveResponses) {
        const slide = cls?.slides?.find((s) => s.id === slideId);
        const activityDef =
          extractActivityDefinition(slide?.content) ??
          extractActivityDefinition(
            slide ? getSlideContentRecord(slide as ApiSlide) : null,
          ) ??
          extractActivityDefinition(
            slide ? classSlideToRendererSlide(slide as ApiSlide) : null,
          );
        for (const response of entry.responses) {
          const rawResponse = response.response ?? response;
          const evaluated = evaluateActivityResponse(
            response.activityType,
            activityDef ?? { tipo: response.activityType },
            rawResponse,
          );
          results.push({
            studentId: response.studentId,
            slideId,
            activityType: response.activityType,
            correct: evaluated.correct,
            score: evaluated.score,
            maxScore: 5,
            historial: evaluated.details.length
              ? [detailsForLivePanel(evaluated.details)]
              : response.details
                ? [response.details]
                : [],
            response: rawResponse,
          });
        }
      }
      const resultadosFiltrados = results.filter((r) => !!r.studentId);
      await api.patch(`/classes/${classId}/sessions/end`, {
        sessionId,
        resultados: resultadosFiltrados,
      });
      setSessionId(null);
    } catch {
      toast.error(
        'No se pudieron guardar los resultados. La sesión sigue abierta; puedes reintentar.',
      );
    } finally {
      setSessionLoading(false);
    }
  }, [classId, sessionId, liveResponses, cls]);

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

  const handleImportPptx = useCallback(
    async (slides: SlideImportado[]) => {
      let afterOrder = sortedSlides[resolvedSlideIndex]?.order ?? 0;
      for (const slide of slides) {
        await insertSlide.mutateAsync({
          afterOrder,
          slide: {
            type: 'CONTENT',
            title: slide.titulo,
            content: {
              id: `slide_${Date.now()}_${Math.random()}`,
              orden: afterOrder + 1,
              tipo: 'contenido',
              layout: slide.layout,
              fondo: slide.fondo,
              bloques: slide.bloques as unknown as Block[],
            },
          },
        });
        afterOrder += 1;
      }
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

  const handleFlipCardsChange = useCallback(
    (blockPath: string, widget: FlipCardsWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'flip-cards') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleTabsChange = useCallback(
    (blockPath: string, widget: TabsWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'tabs') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleCarouselChange = useCallback(
    (blockPath: string, widget: CarouselWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'carousel') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleClickRevealChange = useCallback(
    (blockPath: string, widget: ClickRevealWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'click-reveal') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handlePopupChange = useCallback(
    (blockPath: string, widget: PopupWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'popup') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleHotspotChange = useCallback(
    (blockPath: string, widget: HotspotWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'hotspot') return b;
        return widget;
      });
      handleCommitSlideContent(mergeSlideContent(activeSlide as ApiSlide, { bloques: next }));
    },
    [activeSlide, handleCommitSlideContent],
  );

  const handleTimelineChange = useCallback(
    (blockPath: string, widget: TimelineWidget) => {
      if (!activeSlide) return;
      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = (Array.isArray(c.bloques) ? c.bloques : []) as Block[];
      const next = updateBlockAtPath(bloques, blockPath, (b) => {
        if (b.tipo !== 'timeline') return b;
        return widget;
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
    (type: ActivityType, dropMarco?: BlockMarco) => {
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
        torneo:             torneoTemplate,
        escape_room:        escapeRoomTemplate,
        clasificar:         createDefaultClasificar,
        memoria:            createDefaultMemoria,
        puzzle_imagen:      createDefaultPuzzleImagen,
        sopa_letras:        createDefaultSopaLetras,
        crucigrama:         createDefaultCrucigrama,
        abrir_caja:         createDefaultAbrirCaja,
        anagrama:           createDefaultAnagrama,
        ahorcado:           createDefaultAhorcado,
        puzzle_palabras:    createDefaultPuzzlePalabras,
        globos:             createDefaultGlobos,
        topo:               createDefaultTopo,
        ruleta:             createDefaultRuleta,
        historia_ramificada: createDefaultHistoriaRamificada,
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
        torneo:             'Torneo de preguntas',
        escape_room:        'Escape Room',
        clasificar:         'Clasificar',
        memoria:            'Memoria',
        puzzle_imagen:      'Puzzle de imagen',
        sopa_letras:        'Sopa de letras',
        crucigrama:         'Crucigrama',
        abrir_caja:         'Abrir caja',
        anagrama:           'Anagrama',
        ahorcado:           'Ahorcado',
        puzzle_palabras:    'Puzzle de palabras',
        globos:             'Globos',
        topo:               'Golpea al topo',
        ruleta:             'Ruleta',
        historia_ramificada: 'Historia ramificada',
      };
      const templateFn = templates[type];
      if (!templateFn) {
        toast.info(`Actividad "${type}" próximamente disponible`);
        return;
      }

      const block: Block = {
        tipo: 'actividad',
        actividad: templateFn(),
        ...(dropMarco ? { marco: dropMarco } : {}),
      };

      const selectInserted = () => {
        window.setTimeout(() => canvasAreaRef.current?.selectBlockByIndex(0), 50);
      };

      // Si el slide activo existe y está vacío (sin bloques), agregar ahí
      if (activeSlide) {
        const c = getSlideContentRecord(activeSlide as ApiSlide);
        const bloques = Array.isArray(c.bloques) ? c.bloques : [];
        if (bloques.length === 0) {
          handleCommitSlideContent(
            mergeSlideContent(activeSlide as ApiSlide, { bloques: [block] }),
          );
          if (dropMarco) selectInserted();
          toast.success(`${titles[type]} agregada al slide actual`);
          return;
        }
      }

      // Si no hay slide activo o tiene contenido, crear nuevo slide
      handleCreateSlideWithActivity(
        buildContentDocumentForNewActivitySlide(block),
        titles[type],
      );
      if (dropMarco) {
        window.setTimeout(() => {
          canvasAreaRef.current?.selectBlockByIndex(0);
        }, 300);
      }
      toast.success(`Slide con ${titles[type]} creado`);
    },
    [activeSlide, handleCommitSlideContent, handleCreateSlideWithActivity],
  );

  const handleActivityDrop = useCallback(
    (type: ActivityType, marco: BlockMarco) => {
      if (activeSlideHasActivity) return;
      handleAddActivity(type, marco);
    },
    [activeSlideHasActivity, handleAddActivity],
  );

  // Inserta una actividad generada por IA (formato Activity de Lumina) en el slide
  // actual si está vacío; de lo contrario crea un slide nuevo con la actividad.
  const handleInsertAiActivity = useCallback(
    (activityContent: Record<string, unknown>) => {
      const activity = activityContent as unknown as Activity;
      const block: Block = { tipo: 'actividad', actividad: activity };
      const title =
        typeof activityContent.pregunta === 'string' && activityContent.pregunta.trim()
          ? activityContent.pregunta.trim().slice(0, 60)
          : typeof activityContent.afirmacion === 'string' && activityContent.afirmacion.trim()
            ? activityContent.afirmacion.trim().slice(0, 60)
            : 'Actividad (IA)';

      if (activeSlide) {
        const c = getSlideContentRecord(activeSlide as ApiSlide);
        const bloques = Array.isArray(c.bloques) ? c.bloques : [];
        if (bloques.length === 0) {
          handleCommitSlideContent(
            mergeSlideContent(activeSlide as ApiSlide, { bloques: [block] }),
          );
          return;
        }
      }

      handleCreateSlideWithActivity(
        buildContentDocumentForNewActivitySlide(block),
        title,
      );
    },
    [activeSlide, handleCommitSlideContent, handleCreateSlideWithActivity],
  );

  const handleAddWidget = useCallback(
    (type: WidgetType, dropMarco?: BlockMarco) => {
      if (activeSlideHasActivity) {
        toast.warning('No puedes agregar widgets en un slide de actividad');
        return;
      }
      if (!activeSlide) {
        toast.error('Selecciona un slide primero');
        return;
      }
      let block: Block;
      let successLabel: string;
      if (type === 'flip-cards') {
        block = createDefaultFlipCardsBlock(dropMarco);
        successLabel = 'Flip Cards agregado al slide';
      } else if (type === 'tabs') {
        block = createDefaultTabsBlock(dropMarco);
        successLabel = 'Tabs agregado al slide';
      } else if (type === 'carousel') {
        block = createDefaultCarouselBlock(dropMarco);
        successLabel = 'Carousel agregado al slide';
      } else if (type === 'click-reveal') {
        block = createDefaultClickRevealBlock(dropMarco);
        successLabel = 'Click to Reveal agregado al slide';
      } else if (type === 'popup') {
        block = createDefaultPopupBlock(dropMarco);
        successLabel = 'Popup agregado al slide';
      } else if (type === 'hotspot') {
        block = createDefaultHotspotBlock(dropMarco);
        successLabel = 'Hotspot agregado al slide';
      } else if (type === 'tooltip') {
        block = createDefaultTooltipBlock(dropMarco);
        successLabel = 'Tooltip agregado al slide';
      } else if (type === 'boton') {
        block = createDefaultBotonBlock(dropMarco);
        successLabel = 'Botón agregado al slide';
      } else if (type === 'contador') {
        block = createDefaultContadorBlock(dropMarco);
        successLabel = 'Contador agregado al slide';
      } else if (type === 'progreso') {
        block = createDefaultProgresoBlock(dropMarco);
        successLabel = 'Barra de progreso agregada al slide';
      } else if (type === 'timeline') {
        block = createDefaultTimelineBlock(dropMarco);
        successLabel = 'Línea de tiempo agregada al slide';
      } else {
        toast.info(`Widget "${type}" próximamente`);
        return;
      }

      const c = getSlideContentRecord(activeSlide as ApiSlide);
      const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
      const newIndex = bloques.length;

      handleCommitSlideContent(appendBlockToSlideContent(activeSlide as ApiSlide, block));
      window.setTimeout(() => canvasAreaRef.current?.selectBlockByIndex(newIndex), 50);
      toast.success(successLabel);
    },
    [activeSlide, activeSlideHasActivity, handleCommitSlideContent],
  );

  const handleWidgetDrop = useCallback(
    (type: WidgetType, marco: BlockMarco) => {
      handleAddWidget(type, marco);
    },
    [handleAddWidget],
  );

  const getWidgetDragOverlay = useCallback((type: WidgetType) => {
    const item = getWidgetPanelItem(type);
    if (!item) return null;
    return { label: item.label, Icon: item.Icon };
  }, []);

  const handleBlockDragSave = useCallback((bloques: Block[]) => {
    canvasAreaRef.current?.persistBloquesFromDrag(bloques);
  }, []);

  const getActivityDragOverlay = useCallback((type: ActivityType) => {
    const item = getActivityPanelItem(type);
    if (!item) return null;
    return { label: item.label, Icon: item.Icon };
  }, []);

  const patchSlidesThemeInCache = useCallback(
    (slideIds: string[], theme: SlideTheme) => {
      queryClient.setQueryData<ClassDetail | null | undefined>(
        ['classes', 'detail', classId],
        (prev) => {
          if (!prev?.slides) return prev;
          const idSet = new Set(slideIds);
          return {
            ...prev,
            slides: prev.slides.map((s) => {
              if (!idSet.has(s.id)) return s;
              const base = getSlideContentRecord(s as ApiSlide);
              const next = buildSlideContentWithTheme(base, theme);
              return { ...s, content: next };
            }),
          };
        },
      );
    },
    [classId, queryClient],
  );

  const persistThemeOnSlide = useCallback(
    async (slideId: string, theme: SlideTheme): Promise<boolean> => {
      const detail = queryClient.getQueryData<ClassDetail | null>(['classes', 'detail', classId]);
      const slide = detail?.slides?.find((s) => s.id === slideId);
      if (!slide) return false;

      const base = getSlideContentRecord(slide as ApiSlide);
      const updated = buildSlideContentWithTheme(base, theme);
      const sanitized = sanitizeSlideContentForPersistence(updated) ?? updated;

      try {
        await api.patch(`/classes/${classId}/slides/${slideId}`, { content: sanitized });
        return true;
      } catch {
        return false;
      }
    },
    [classId, queryClient],
  );

  const finishThemeApply = useCallback(
    async (slideIds: string[], theme: SlideTheme, successMessage: string) => {
      patchSlidesThemeInCache(slideIds, theme);
      setContentSaveEpoch((n) => n + 1);
      await queryClient.refetchQueries({ queryKey: ['classes', 'detail', classId] });
      toast.success(successMessage);
    },
    [classId, patchSlidesThemeInCache, queryClient],
  );

  const handleApplyThemeToSlide = useCallback(
    async (theme: SlideTheme) => {
      const slideId = activeSlide?.id;
      if (!slideId) return;
      setThemeApplyBusy(true);
      const ok = await persistThemeOnSlide(slideId, theme);
      setThemeApplyBusy(false);
      if (ok) {
        const msg =
          theme.id === NO_SLIDE_THEME_ID
            ? 'Tema quitado del slide'
            : 'Tema aplicado al slide';
        await finishThemeApply([slideId], theme, msg);
      } else {
        queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
        toast.error('Error al aplicar tema');
      }
    },
    [activeSlide?.id, classId, finishThemeApply, persistThemeOnSlide, queryClient],
  );

  const handleApplyThemeToAllSlides = useCallback(
    async (theme: SlideTheme) => {
      const slides = queryClient.getQueryData<ClassDetail | null>(['classes', 'detail', classId])
        ?.slides;
      if (!slides?.length) return;

      setThemeApplyBusy(true);
      const ids = slides.map((s) => s.id);
      patchSlidesThemeInCache(ids, theme);

      let applied = 0;
      for (const slide of slides) {
        const ok = await persistThemeOnSlide(slide.id, theme);
        if (ok) applied += 1;
      }
      setThemeApplyBusy(false);

      if (applied === 0) {
        queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
        toast.error('Error al aplicar tema');
        return;
      }

      setContentSaveEpoch((n) => n + 1);
      await queryClient.refetchQueries({ queryKey: ['classes', 'detail', classId] });

      const msg =
        theme.id === NO_SLIDE_THEME_ID
          ? `Tema quitado de ${applied} slides`
          : `Tema aplicado a ${applied} slides`;
      if (applied < slides.length) {
        toast.warning(`${msg} (${applied} de ${slides.length})`);
      } else {
        toast.success(msg);
      }
    },
    [classId, patchSlidesThemeInCache, persistThemeOnSlide, queryClient],
  );

  const handleSaveCustomThemes = useCallback(
    (themes: SlideTheme[]) => {
      persistCustomThemesLocally(classId, themes);
      const desempeno = mergeDesempenoWithCustomThemes(cls?.desempeno, themes);
      queryClient.setQueryData<ClassDetail | null | undefined>(
        ['classes', 'detail', classId],
        (prev) => (prev ? { ...prev, desempeno } : prev),
      );
      updateClassMutation.mutate(
        { desempeno },
        {
          onError: () => {
            queryClient.invalidateQueries({ queryKey: ['classes', 'detail', classId] });
            toast.error('No se pudieron guardar los temas personalizados');
          },
        },
      );
    },
    [classId, cls?.desempeno, queryClient, updateClassMutation],
  );

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

        {/* ── TOPBAR Lumina 2.0 ── */}
        <header
          ref={editorHeaderRef}
          className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1d4ed8] bg-[#2563EB] px-4"
        >
          {/* Izquierda: marca + título + código */}
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
              <img
                src="/LM-ffffff.svg"
                alt="Lumina"
                className="h-8 w-auto shrink-0"
                draggable={false}
              />
              <span className="text-[1rem] font-extrabold text-white">Lumina</span>
            </Link>
            <div className="h-5 w-px shrink-0 bg-white/20" aria-hidden />
            {isLoading ? (
              <Skeleton className="h-4 w-48 max-w-[12rem]" />
            ) : (
              <>
                <input
                  readOnly
                  value={cls?.title ?? 'Editor'}
                  title={desempeno ? desempeno.enunciado : (cls?.title ?? undefined)}
                  aria-label="Título de la clase"
                  className="w-48 max-w-[12rem] truncate border-none bg-transparent text-sm font-bold text-white outline-none"
                />
                {cls?.codigo?.trim() ? (
                  <span className="shrink-0 rounded-lg bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                    {cls.codigo.toUpperCase().startsWith('LUM')
                      ? cls.codigo.toUpperCase()
                      : `LUM-${cls.codigo.toUpperCase()}`}
                  </span>
                ) : null}
              </>
            )}
          </div>

          {/* Centro: deshacer / rehacer + autoguardado */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <button
              type="button"
              title="Deshacer"
              aria-label="Deshacer"
              disabled={!canvasHistory.canUndo}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                canvasHistory.canUndo
                  ? 'text-white/60 hover:bg-white/15 hover:text-white'
                  : 'cursor-not-allowed text-white/30',
              )}
              onClick={() => {
                canvasAreaRef.current?.undo();
              }}
            >
              <Undo2 className="size-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              title="Rehacer"
              aria-label="Rehacer"
              disabled={!canvasHistory.canRedo}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                canvasHistory.canRedo
                  ? 'text-white/60 hover:bg-white/15 hover:text-white'
                  : 'cursor-not-allowed text-white/30',
              )}
              onClick={() => {
                canvasAreaRef.current?.redo();
              }}
            >
              <Redo2 className="size-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              title={guidesVisible ? 'Ocultar guías' : 'Mostrar guías'}
              aria-label={guidesVisible ? 'Ocultar guías' : 'Mostrar guías'}
              aria-pressed={guidesVisible}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                guidesVisible
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/15 hover:text-white',
              )}
              onClick={() => setGuidesVisible((v) => !v)}
            >
              <Ruler className="size-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              title="Guías centrales"
              aria-label="Añadir o quitar guías centrales"
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/15 hover:text-white"
              onClick={() => canvasAreaRef.current?.toggleCenterGuides()}
            >
              <Crosshair className="size-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              title={activeGrid.activa ? 'Ocultar grilla' : 'Mostrar grilla'}
              aria-label={activeGrid.activa ? 'Ocultar grilla' : 'Mostrar grilla'}
              aria-pressed={activeGrid.activa}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                activeGrid.activa
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/15 hover:text-white',
              )}
              onClick={() => canvasAreaRef.current?.toggleGrid()}
            >
              <Grid3x3 className="size-4 shrink-0" aria-hidden />
            </button>
            {activeGrid.activa && (
              <label className="inline-flex items-center gap-1">
                <span className="sr-only">Tamaño de grilla</span>
                <select
                  value={activeGrid.tamanoPx}
                  title="Tamaño de celda de la grilla"
                  aria-label="Tamaño de celda de la grilla"
                  className="h-7 rounded-md border border-white/20 bg-white/10 px-1.5 text-xs text-white outline-none hover:bg-white/15 focus:border-white/40"
                  onChange={(e) => {
                    canvasAreaRef.current?.setGridSize(Number(e.target.value));
                  }}
                >
                  {GRID_SIZE_PRESETS.map((px) => (
                    <option key={px} value={px} className="text-foreground">
                      {px}px
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex items-center gap-0.5" title="Zoom del lienzo (Ctrl + rueda)">
              <button
                type="button"
                title="Alejar"
                aria-label="Alejar lienzo"
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/15 hover:text-white"
                onClick={() =>
                  handleCanvasZoomChange(stepCanvasZoom(canvasZoom, -CANVAS_ZOOM_STEP))
                }
              >
                <ZoomOut className="size-4 shrink-0" aria-hidden />
              </button>
              <button
                type="button"
                title="Restablecer zoom al 100 %"
                aria-label="Restablecer zoom"
                className="min-w-[2.75rem] rounded-lg px-1 py-1.5 text-xs tabular-nums text-white/80 hover:bg-white/15 hover:text-white"
                onClick={() => handleCanvasZoomChange(CANVAS_ZOOM_DEFAULT)}
              >
                {formatCanvasZoom(canvasZoom)}
              </button>
              <button
                type="button"
                title="Acercar"
                aria-label="Acercar lienzo"
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/15 hover:text-white"
                onClick={() =>
                  handleCanvasZoomChange(stepCanvasZoom(canvasZoom, CANVAS_ZOOM_STEP))
                }
              >
                <ZoomIn className="size-4 shrink-0" aria-hidden />
              </button>
            </div>
            <div className="h-5 w-px shrink-0 bg-white/20" aria-hidden />
            <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
              {saveError ? (
                <span className="text-destructive">Error al guardar</span>
              ) : autosaveIsSaving || updateSlide.isPending ? (
                <>
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-white/80" aria-hidden />
                  <span>Guardando…</span>
                </>
              ) : autosaveDirty ? (
                <span>Cambios pendientes…</span>
              ) : (
                <>
                  <Check className="size-3.5 shrink-0 text-white/80" aria-hidden />
                  <span>Guardado</span>
                </>
              )}
            </span>
          </div>

          {/* Derecha: modo, timer, compartir, sesión, pill, utilidades */}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canConfigureLiveTimer ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <div
                  className="flex rounded-xl border border-white/20 bg-white/10 p-0.5"
                  role="group"
                  aria-label="Modo de clase"
                >
                  {(
                    [
                      { value: 'clase' as const, label: 'clase' },
                      { value: 'presentacion' as const, label: 'presentacion' },
                      { value: 'autonomo' as const, label: 'autonomo' },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isLoading || sessionLoading || sessionActive}
                      onClick={() => void handleModoEntregaChange(value)}
                      className={cn(
                        'rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors',
                        modoEntrega === value
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'text-white/50 hover:text-white',
                        (isLoading || sessionLoading || sessionActive) &&
                          'pointer-events-none opacity-50',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Timer className="size-4 shrink-0 text-white/60" aria-hidden />
                <Select
                  value={String(cls?.timerGlobal ?? 0)}
                  disabled={timerGlobalSaving || isLoading}
                  onValueChange={handleTimerGlobalChange}
                >
                  <SelectTrigger className="h-8 w-[7.25rem] border-white/20 bg-white/10 text-white text-xs" size="sm">
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

            <span
              title={isConnected ? 'Conectado en tiempo real' : 'Sin conexión en tiempo real'}
              className="flex items-center gap-1.5 text-xs text-white/50"
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-white/30',
                )}
              />
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toast.info('Compartir próximamente disponible')}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
            >
              <Share2 className="size-3.5" aria-hidden />
              Compartir
            </Button>

            {sessionId === null ? (
              <Button
                type="button"
                size="sm"
                disabled={!classId || sessionLoading}
                onClick={handleStartSession}
                className={cn(
                  'rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-[#2563EB] shadow-sm',
                  'hover:opacity-95 disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                {sessionLoading ? (
                  <Loader2 className="mr-1 inline size-3.5 animate-spin align-middle" aria-hidden />
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
                  'rounded-xl bg-white/90 px-4 py-1.5 text-xs font-bold text-[#f87171] shadow-sm',
                  'hover:opacity-95 disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                {sessionLoading ? (
                  <Loader2 className="mr-1 inline size-3.5 animate-spin align-middle" aria-hidden />
                ) : null}
                Finalizar clase
              </Button>
            )}

            {sessionActive ? (
              <Button
                type="button"
                size="sm"
                disabled={!activeSlide?.id || !isConnected}
                onClick={handleToggleResponsesLocked}
                className={cn(
                  'shrink-0 rounded-xl border-0 text-xs shadow-none',
                  responsesLocked
                    ? 'bg-white/90 text-[#DC2626] hover:bg-white/90 hover:text-[#DC2626]'
                    : 'bg-white/15 text-white hover:bg-white/25',
                )}
              >
                {responsesLocked ? (
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <LockOpen className="size-3.5 shrink-0" aria-hidden />
                )}
                {responsesLocked ? 'Desbloquear' : 'Bloquear'}
              </Button>
            ) : null}

            {sessionActive && !gamificacionActiva ? (
              <Button
                type="button"
                size="sm"
                disabled={!sessionId || !isConnected}
                onClick={iniciarGamificacion}
                className="shrink-0 rounded-xl border border-amber-300/40 bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/30"
              >
                <Trophy className="size-3.5 shrink-0" aria-hidden />
                Activar gamificación
              </Button>
            ) : null}

            {sessionActive && gamificacionActiva ? (
              <Button
                type="button"
                size="sm"
                disabled={!sessionId || !isConnected}
                onClick={() => toggleLeaderboardVisible(!leaderboardVisible)}
                className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/20"
                title={
                  leaderboardVisible
                    ? 'Ocultar ranking a estudiantes'
                    : 'Mostrar ranking a estudiantes'
                }
              >
                {leaderboardVisible ? (
                  <Eye className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <EyeOff className="size-3.5 shrink-0" aria-hidden />
                )}
                Ranking {leaderboardVisible ? 'visible' : 'oculto'}
              </Button>
            ) : null}

            {showLiveResponsesTopbar ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tabular-nums text-white"
                title="Respuestas en este slide vs. estudiantes conectados en la sala"
              >
                <Users className="size-3.5 shrink-0" aria-hidden />
                {liveSlideRespondedCount}/{roomStudentCount} respondieron
              </span>
            ) : null}

            {sortedSlides.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-semibold',
                  rightPanel === 'themes'
                    ? 'border-white/40 bg-white/25 text-white'
                    : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20',
                )}
                onClick={() => toggleRightPanel('themes')}
                aria-pressed={rightPanel === 'themes'}
              >
                <Palette className="size-3.5" />
                Temas
              </Button>
            ) : null}

            {sortedSlides.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
                onClick={() => setPptxModalOpen(true)}
              >
                <FileText className="size-3.5" />
                Importar PPT
              </Button>
            ) : null}

            {sortedSlides.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
                onClick={() => {
                  window.open(`/classes/${classId}/preview`, '_blank');
                }}
              >
                <Eye className="size-3.5" />
                Vista previa
              </Button>
            ) : null}

            {!sessionActive && sortedSlides.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
                onClick={() => setHistorySheetOpen(true)}
                aria-label="Historial de versiones"
              >
                <History className="size-3.5" />
                Historial
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              disabled={!activeSlide || updateSlide.isPending}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20"
              onClick={handleSave}
            >
              <Save className="size-3.5" />
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

          <EditorDndShell
            canvasRef={canvasSurfaceRef}
            slide={rendererSlide}
            onBlockDragSave={handleBlockDragSave}
            onActivityDrop={handleActivityDrop}
            onWidgetDrop={handleWidgetDrop}
            getActivityDragOverlay={getActivityDragOverlay}
            getWidgetDragOverlay={getWidgetDragOverlay}
          >
          {/* Slides + flyout — 14rem fijo; canvas absorbe el resto (min-w-0) */}
          <div className="relative h-full min-h-0 w-48 min-w-48 max-w-48 shrink-0 overflow-visible">
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
              copiedBlock={copiedBlock}
              onPasteBlockInSlide={(slideId, block) => {
                if (slideId === activeSlide?.id) {
                  canvasAreaRef.current?.pasteCopiedBlock(block);
                  return;
                }
                handlePasteBlockInSlide(slideId, block);
              }}
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
              onAddWidget={handleAddWidget}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {/* Canvas area — flex-1 (fondo de clase en el contenedor del workspace) */}
          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 overflow-hidden',
              '[&_.bg-editor-workspace]:bg-transparent',
            )}
            style={classBackground.style}
          >
            <SlideNavContext.Provider
              value={{
                navigate: null,
                slideCount: sortedSlides.length,
                slideIndex: resolvedSlideIndex,
              }}
            >
            <CanvasArea
              ref={canvasAreaRef}
              canvasSurfaceRef={canvasSurfaceRef}
              slide={rendererSlide}
              isLoading={isLoading}
              onActivityChange={handleActivityChange}
              onFlipCardsChange={handleFlipCardsChange}
              onTabsChange={handleTabsChange}
              onCarouselChange={handleCarouselChange}
              onClickRevealChange={handleClickRevealChange}
              onPopupChange={handlePopupChange}
              onHotspotChange={handleHotspotChange}
              onTimelineChange={handleTimelineChange}
              onRemoveBlock={handleRemoveBlock}
              onEffectiveBloques={setActiveSlideLiveBloques}
              onHistoryStateChange={setCanvasHistory}
              livePanelOpen={rightPanel === 'live'}
              onCopyBlock={setCopiedBlock}
              guidesVisible={guidesVisible}
              canvasZoom={canvasZoom}
              onCanvasZoomChange={handleCanvasZoomChange}
            />
            </SlideNavContext.Provider>
          </div>

          {/* Flyout panel derecho */}
          <RightFlyoutPanel
            ref={rightFlyoutPanelRef}
            activePanel={rightPanel}
            onClose={() => setRightPanel(null)}
            onAddActivity={handleAddActivity}
            activeSlide={activeSlide as ApiSlide | null}
            activeTemaId={activeTemaId}
            customThemes={customThemes}
            isThemeSaving={themeApplyBusy || updateSlide.isPending}
            onApplyThemeToSlide={handleApplyThemeToSlide}
            onApplyThemeToAllSlides={handleApplyThemeToAllSlides}
            onSaveCustomThemes={handleSaveCustomThemes}
            desempenoEnunciado={desempeno?.enunciado}
            hasActivity={activeSlideHasActivity}
            onInsertActivity={handleInsertAiActivity}
            liveResponses={liveResponses}
            activeSlideId={activeSlide?.id ?? ''}
            activeSlideIndex={resolvedSlideIndex}
            activeActivity={activeActivity}
            showAutonomousSlideProgress={
              sessionActive && modoEntrega === 'autonomo'
            }
            autonomousStudentsPerSlide={autonomousStudentsPerSlide}
            liveSocket={rightFlyoutLiveSocket}
            liveSessionId={sessionId}
            classId={classId}
            gamificacionActiva={gamificacionActiva}
            gamificationLeaderboard={gamificationLeaderboard}
          />
          </div>
          </EditorDndShell>

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

      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border px-6 py-4 text-start">
            <SheetTitle>Historial de versiones</SheetTitle>
          </SheetHeader>
          <SheetBody className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
            {!activeSlide?.id ? (
              <p className="text-sm text-muted-foreground">Selecciona un slide.</p>
            ) : slideVersionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                Cargando…
              </div>
            ) : slideVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay versiones. Usa Ctrl+S para crear una.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {slideVersions.map((v) => {
                  const n = countBloquesInSlideContent(v.content);
                  const bloquesLabel = n === 1 ? '1 bloque' : `${n} bloques`;
                  const when = format(new Date(v.createdAt), "d MMM yyyy · HH:mm", {
                    locale: esLocale,
                  });
                  return (
                    <li
                      key={v.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium tabular-nums text-foreground">{when}</p>
                        <p className="text-xs text-muted-foreground">{bloquesLabel}</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                        disabled={restoreSlideVersion.isPending}
                        onClick={() => setVersionPendingRestore(v)}
                      >
                        Restaurar
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!versionPendingRestore}
        onOpenChange={(open) => {
          if (!open) setVersionPendingRestore(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Restaurar esta versión?</DialogTitle>
          </DialogHeader>
          <DialogBody className="text-sm text-muted-foreground">
            Se reemplazará el contenido del slide actual por el de la versión seleccionada.
          </DialogBody>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVersionPendingRestore(null)}
              disabled={restoreSlideVersion.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={restoreSlideVersion.isPending || !versionPendingRestore}
              onClick={() => {
                const id = versionPendingRestore?.id;
                if (!id) return;
                restoreSlideVersion.mutate(id, {
                  onSuccess: () => {
                    toast.success('Versión restaurada');
                    setVersionPendingRestore(null);
                    setHistorySheetOpen(false);
                    canvasAreaRef.current?.resetSlideHistory();
                  },
                  onError: () => {
                    toast.error('No se pudo restaurar la versión');
                  },
                });
              }}
            >
              {restoreSlideVersion.isPending ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Restaurando…
                </>
              ) : (
                'Restaurar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                      <SlideNavContext.Provider
                        value={{
                          navigate: null,
                          slideCount: sortedSlides.length,
                          slideIndex: previewResolvedIndex,
                        }}
                      >
                      <SlideRenderer
                        slide={previewRendererSlide}
                        modo="preview"
                        className="h-full w-full"
                      />
                      </SlideNavContext.Provider>
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

      {pptxModalOpen && (
        <ImportPptxModal
          classId={classId}
          onClose={() => setPptxModalOpen(false)}
          onImport={handleImportPptx}
        />
      )}
    </div>
  );
}
