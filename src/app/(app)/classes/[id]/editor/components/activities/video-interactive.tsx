'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Circle, Clock, XCircle, Trash2, Plus } from 'lucide-react';

import type { VideoInteractive, VideoQuestion } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

/** Alias descriptivo para props del editor (misma forma que `VideoInteractive`). */
export type VideoInteractiveActivity = VideoInteractive;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: VideoInteractive;
  modo: 'editor' | 'viewer';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function buildEmbedUrl(actividad: VideoInteractive): string | null {
  const { plataforma, urlVideo } = actividad;
  if (plataforma === 'youtube' || (!plataforma && urlVideo.includes('youtu'))) {
    const match = urlVideo.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}?rel=0&enablejsapi=1` : null;
  }
  if (plataforma === 'vimeo' || (!plataforma && urlVideo.includes('vimeo'))) {
    const match = urlVideo.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null; // direct video
}

function extraerVideoId(url: string): string {
  // https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&?/]+)/);
  if (watchMatch) return watchMatch[1];
  // https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];
  // https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);
  if (embedMatch) return embedMatch[1];
  return '';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: VideoInteractive }) {
  const embedUrl = buildEmbedUrl(actividad);
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          Video interactivo
        </span>
        {actividad.plataforma && (
          <span className="text-[10px] capitalize text-muted-foreground">
            {actividad.plataforma}
          </span>
        )}
      </div>

      {/* Video embed or URL */}
      {embedUrl ? (
        <div className="relative overflow-hidden rounded-md" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <span className="truncate text-xs text-muted-foreground">{actividad.urlVideo}</span>
        </div>
      )}

      {/* Questions list */}
      {actividad.preguntas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pausas programadas
          </p>
          {actividad.preguntas.map((q) => (
            <div key={q.id} className="flex gap-3 rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-1 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                <Clock className="size-3" />
                {formatTime(q.tiempoSegundos)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{q.pregunta}</p>
                <p className="text-[10px] text-muted-foreground">
                  {q.opciones.length} opciones
                  {q.pausarVideo && ' · pausa automática'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Viewer — question overlay ────────────────────────────────────────────────

function QuestionOverlay({
  question,
  onDismiss,
}: {
  question: VideoQuestion;
  onDismiss: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);

  function handleCheck() {
    if (!selected) return;
    const correct = question.opciones.find((o) => o.id === selected)?.esCorrecta ?? false;
    setFeedback({ correct });
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-80 max-w-[90%] space-y-4 rounded-xl bg-background p-5 shadow-2xl">
        <p className="text-sm font-medium">{question.pregunta}</p>

        <ul className="space-y-2">
          {question.opciones.map((op) => {
            const isSel = selected === op.id;
            const showRes = !!feedback;
            return (
              <li key={op.id}>
                <button
                  type="button"
                  disabled={!!feedback}
                  onClick={() => setSelected(op.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors',
                    !feedback && !isSel && 'border-border hover:border-primary/50 hover:bg-accent',
                    !feedback && isSel  && 'border-primary bg-primary/5',
                    showRes && isSel && op.esCorrecta  && 'border-green-400 bg-green-50 text-green-800',
                    showRes && isSel && !op.esCorrecta && 'border-red-400 bg-red-50 text-red-800',
                    showRes && !isSel && op.esCorrecta  && 'border-green-200 bg-green-50/50',
                    showRes && !isSel && !op.esCorrecta && 'border-border opacity-40',
                  )}
                >
                  {showRes && isSel && op.esCorrecta  && <CheckCircle className="size-3.5 shrink-0 text-green-600" />}
                  {showRes && isSel && !op.esCorrecta && <XCircle className="size-3.5 shrink-0 text-red-500" />}
                  {(!showRes || (!isSel && !op.esCorrecta)) && (
                    <Circle className={cn('size-3.5 shrink-0', isSel ? 'text-primary' : 'opacity-30')} />
                  )}
                  {showRes && !isSel && op.esCorrecta && <CheckCircle className="size-3.5 shrink-0 text-green-400 opacity-60" />}
                  {op.texto}
                </button>
              </li>
            );
          })}
        </ul>

        {!feedback ? (
          <Button size="sm" onClick={handleCheck} disabled={!selected} className="w-full">
            Responder
          </Button>
        ) : (
          <div className="space-y-2">
            <p
              className={cn(
                'rounded-md px-3 py-1.5 text-xs',
                feedback.correct
                  ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
              )}
            >
              {feedback.correct ? '¡Correcto!' : 'Incorrecto.'}
            </p>
            <Button size="sm" variant="outline" onClick={onDismiss} className="w-full">
              Continuar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

/** Minimal interface for the YouTube IFrame player we need. */
interface YTPlayer {
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
}

function ViewerView({ actividad }: { actividad: VideoInteractive }) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const blockId     = useRef(Math.random().toString(36).slice(2)).current;
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** IDs of questions already shown — never triggers re-render. */
  const shownQIds   = useRef<Set<string>>(new Set());
  /** Ref mirror of activeQ so intervals/closures always read the latest value. */
  const activeQRef  = useRef<VideoQuestion | null>(null);
  const [activeQ, setActiveQ] = useState<VideoQuestion | null>(null);

  const embedUrl = buildEmbedUrl(actividad);
  const isDirect = !embedUrl;
  const isYouTube =
    !isDirect &&
    (actividad.plataforma === 'youtube' ||
      (!actividad.plataforma && actividad.urlVideo.includes('youtu')));

  // Keep ref in sync so closures inside intervals/event-handlers are not stale.
  useEffect(() => { activeQRef.current = activeQ; }, [activeQ]);

  // ── YouTube IFrame API ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isYouTube || actividad.preguntas.length === 0) return;

    function startPolling() {
      // Campo verificado en slide.types.ts → VideoQuestion.tiempoSegundos (número entero, segundos).
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        const player = ytPlayerRef.current;
        // Guard: player must exist and be fully initialised before calling methods.
        if (!player || typeof player.getCurrentTime !== 'function') return;
        if (activeQRef.current) return;
        const t = player.getCurrentTime();
        const q = actividad.preguntas.find(
          (q) => !shownQIds.current.has(q.id) && t >= q.tiempoSegundos,
        );
        if (q) {
          shownQIds.current.add(q.id);
          if (q.pausarVideo !== false) {
            console.log('[VideoInteractivo] pausando en', t, 'seg — pregunta:', q);
            player.pauseVideo();
          }
          if (pollingRef.current) clearInterval(pollingRef.current)
          pollingRef.current = null
          setActiveQ(q);
        }
      }, 250);
    }

    function initPlayer() {
      const videoId = extraerVideoId(actividad.urlVideo);
      if (!videoId) return;
      const container = document.getElementById(`yt-player-${blockId}`);
      if (!container) {
        const observer = new MutationObserver(() => {
          const el = document.getElementById(`yt-player-${blockId}`);
          if (el) {
            observer.disconnect();
            initPlayer();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ytPlayerRef.current = new (window as any).YT.Player(`yt-player-${blockId}`, {
        videoId,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            startPolling();
          },
          onStateChange: (event: { data: number }) => {
            const YT_ENDED = 0;
            const YT_PLAYING = 1;
            if (event.data === YT_ENDED) {
              shownQIds.current.clear();
              setActiveQ(null);
              activeQRef.current = null;
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              ytPlayerRef.current?.destroy();
              ytPlayerRef.current = null;
              initTimerRef.current = setTimeout(initPlayer, 100);
            }
            if (event.data === YT_PLAYING && activeQRef.current === null) {
              startPolling();
            }
          },
        },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prev = (window as any).onYouTubeIframeAPIReady as (() => void) | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
      initTimerRef.current = null;
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
    // Re-run if preguntas change (from 0 to length > 0) to properly initialize polling
  }, [isYouTube, actividad.preguntas.length]);

  // ── Direct video time tracking ──────────────────────────────────────────────
  function onTimeUpdate() {
    if (activeQRef.current) return;
    const t = videoRef.current?.currentTime ?? 0;
    const q = actividad.preguntas.find(
      (q) => !shownQIds.current.has(q.id) && t >= q.tiempoSegundos,
    );
    if (q) {
      shownQIds.current.add(q.id);
      if (q.pausarVideo !== false) videoRef.current?.pause();
      setActiveQ(q);
    }
  }

  function dismissQ() {
    setActiveQ(null);
    activeQRef.current = null;
    if (isDirect)   videoRef.current?.play().catch(() => {});
    if (isYouTube)  ytPlayerRef.current?.playVideo();
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      {/* Video */}
      <div className="relative overflow-hidden rounded-md" style={{ aspectRatio: '16/9' }}>
        {isDirect ? (
          <video
            ref={videoRef}
            src={actividad.urlVideo}
            controls
            onTimeUpdate={onTimeUpdate}
            className="h-full w-full object-cover"
          />
        ) : isYouTube ? (
          <div id={`yt-player-${blockId}`} style={{ width: '100%', aspectRatio: '16/9' }} />
        ) : (
          <iframe
            src={embedUrl ?? undefined}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
        {activeQ && <QuestionOverlay question={activeQ} onDismiss={dismissQ} />}
      </div>

      {/* Non-YouTube embeds (e.g. Vimeo): show static questions list */}
      {!isDirect && !isYouTube && actividad.preguntas.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Preguntas del video</p>
          {actividad.preguntas.map((q) => (
            <div key={q.id} className="flex gap-3 rounded-md border border-border px-3 py-2 text-xs">
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatTime(q.tiempoSegundos)}
              </span>
              <span>{q.pregunta}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function VideoInteractiveActivity({ actividad, modo }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} />;
}

// ─── Named Export Editor ──────────────────────────────────────────────────────

const DEFAULTS_VIDEO: VideoInteractive = {
  tipo: 'video_interactivo',
  urlVideo: '',
  preguntas: [],
};

function normalizeVideo(a: VideoInteractive | null | undefined): VideoInteractive {
  if (!a) return { ...DEFAULTS_VIDEO };
  return { ...DEFAULTS_VIDEO, ...a, tipo: 'video_interactivo' };
}

export function VideoInteractiveActivityEditor({
  editorSyncKey,
  activity,
  onChange,
}: {
  editorSyncKey: string;
  activity: VideoInteractiveActivity;
  onChange: (a: VideoInteractiveActivity) => void;
}) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<VideoInteractive>({
      data: activity,
      editorSyncKey,
      normalize: normalizeVideo,
      onChange,
    });

  function updateImmediate(partial: Partial<VideoInteractive>) {
    commitImmediate({ ...local, ...partial, tipo: 'video_interactivo' as const });
  }

  function persistDebounced(next: VideoInteractive) {
    const typed = { ...next, tipo: 'video_interactivo' as const };
    setLocal(typed);
    schedulePersist(typed);
  }

  function addQuestion() {
    const q: VideoQuestion = {
      id: crypto.randomUUID(),
      tiempoSegundos: 0,
      pregunta: '',
      opciones: [
        { id: crypto.randomUUID(), texto: '', esCorrecta: true },
        { id: crypto.randomUUID(), texto: '', esCorrecta: false },
      ],
      pausarVideo: true,
    };
    updateImmediate({ preguntas: [...local.preguntas, q] });
  }

  function removeQuestion(qId: string) {
    updateImmediate({ preguntas: local.preguntas.filter((q) => q.id !== qId) });
  }

  function setQuestionTime(qId: string, raw: number) {
    const tiempoSegundos =
      Number.isFinite(raw) && raw >= 0 ? Math.min(86400, Math.floor(raw)) : 0;
    updateImmediate({
      preguntas: local.preguntas.map((q) => (q.id === qId ? { ...q, tiempoSegundos } : q)),
    });
  }

  function setQuestionText(qId: string, pregunta: string) {
    persistDebounced({
      ...local,
      tipo: 'video_interactivo',
      preguntas: local.preguntas.map((q) => (q.id === qId ? { ...q, pregunta } : q)),
    });
  }

  function addOption(qId: string) {
    const q = local.preguntas.find((x) => x.id === qId);
    if (!q || q.opciones.length >= 4) return;
    updateImmediate({
      preguntas: local.preguntas.map((x) =>
        x.id === qId
          ? {
              ...x,
              opciones: [...x.opciones, { id: crypto.randomUUID(), texto: '', esCorrecta: false }],
            }
          : x,
      ),
    });
  }

  function removeOption(qId: string, optId: string) {
    const q = local.preguntas.find((x) => x.id === qId);
    if (!q || q.opciones.length <= 2) return;
    updateImmediate({
      preguntas: local.preguntas.map((x) =>
        x.id === qId ? { ...x, opciones: x.opciones.filter((o) => o.id !== optId) } : x,
      ),
    });
  }

  function setOptionText(qId: string, optId: string, texto: string) {
    persistDebounced({
      ...local,
      tipo: 'video_interactivo',
      preguntas: local.preguntas.map((x) =>
        x.id !== qId
          ? x
          : {
              ...x,
              opciones: x.opciones.map((o) => (o.id === optId ? { ...o, texto } : o)),
            },
      ),
    });
  }

  function setCorrectOption(qId: string, optId: string) {
    updateImmediate({
      preguntas: local.preguntas.map((x) =>
        x.id === qId
          ? { ...x, opciones: x.opciones.map((o) => ({ ...o, esCorrecta: o.id === optId })) }
          : x,
      ),
    });
  }

  return (
    <div className="flex max-h-[min(60vh,500px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
          Video Interactivo
        </span>
        <span className="text-[10px] text-muted-foreground truncate">
          Editor de pausas y preguntas
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">URL del video — YouTube o Vimeo</Label>
          <Input
            value={local.urlVideo}
            onChange={(e) => {
              persistDebounced({ ...local, urlVideo: e.target.value, tipo: 'video_interactivo' });
            }}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-3">
          {local.preguntas.map((q) => (
            <div key={q.id} className="relative rounded-md border border-border bg-muted/10 p-3 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 size-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeQuestion(q.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
              
              <div className="mb-3 grid grid-cols-[90px_1fr] gap-3 pr-8">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Pausar en (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={q.tiempoSegundos}
                    onChange={(e) => setQuestionTime(q.id, Number(e.target.value))}
                    className="h-7 text-xs tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Pregunta</Label>
                  <Input
                    value={q.pregunta}
                    onChange={(e) => setQuestionText(q.id, e.target.value)}
                    onBlur={flush}
                    className="h-7 text-xs"
                    placeholder="Escribe la pregunta…"
                  />
                </div>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-border/50">
                {q.opciones.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={opt.esCorrecta}
                      onChange={() => setCorrectOption(q.id, opt.id)}
                      className="size-3.5 accent-primary cursor-pointer"
                    />
                    <Input
                      value={opt.texto}
                      onChange={(e) => setOptionText(q.id, opt.id, e.target.value)}
                      onBlur={flush}
                      className="h-7 flex-1 text-xs"
                      placeholder="Texto de la opción…"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOption(q.id, opt.id)}
                      disabled={q.opciones.length <= 2}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {q.opciones.length < 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-muted-foreground"
                    onClick={() => addOption(q.id)}
                  >
                    <Plus className="mr-1 size-3" /> Agregar opción
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs border-dashed"
            onClick={addQuestion}
          >
            <Plus className="mr-1 size-3.5" /> Agregar pregunta
          </Button>
        </div>
      </div>
    </div>
  );
}
