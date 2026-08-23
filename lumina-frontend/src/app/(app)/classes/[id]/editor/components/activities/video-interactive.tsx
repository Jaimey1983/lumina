'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Circle, Clock, Play, Trash2, Plus, XCircle } from 'lucide-react';

import type { VideoInteractive, VideoQuestion } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeVideoSource } from '@/lib/video-url-utils';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { useActivityEditor } from './use-activity-editor';
import { useVideoInteractiveRuntime } from './use-video-interactive-runtime';

/** Alias descriptivo para props del editor (misma forma que `VideoInteractive`). */
export type VideoInteractiveActivity = VideoInteractive;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: VideoInteractive;
  modo: 'editor' | 'viewer';
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: VideoInteractive }) {
  const source = useMemo(
    () => normalizeVideoSource(actividad.urlVideo, actividad.plataforma),
    [actividad.urlVideo, actividad.plataforma],
  );
  const embedUrl = source.embedUrl;
  return (
    <div className="space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
          Video interactivo
        </span>
        {actividad.plataforma && (
          <span className="text-[10px] capitalize text-[#9ca3af]">
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
        <div className="flex items-center gap-2 rounded-md bg-[#f9fafb] px-3 py-2">
          <span className="truncate text-xs text-[#9ca3af]">{actividad.urlVideo}</span>
        </div>
      )}

      {/* Questions list */}
      {actividad.preguntas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            Pausas programadas
          </p>
          {actividad.preguntas.map((q) => (
            <div key={q.id} className="flex gap-3 rounded-md border border-[#e5e7eb] px-3 py-2">
              <div className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-[#9ca3af]">
                <Clock className="size-3" />
                {formatTime(q.tiempoSegundos)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{q.pregunta}</p>
                <p className="text-[10px] text-[#9ca3af]">
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
  onAnswer,
  variant = 'light',
}: {
  question: VideoQuestion;
  onDismiss: () => void;
  onAnswer?: (answer: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const { play } = useSound();

  const isDark = variant === 'dark';

  function handleCheck() {
    if (!selected) return;
    const correct = question.opciones.find((o) => o.id === selected)?.esCorrecta ?? false;
    setFeedback({ correct });
    play('submit');
    onAnswer?.(selected);
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm" data-testid="question-overlay">
      <div
        className={cn(
          'w-80 max-w-[90%] space-y-4 rounded-xl border p-5 shadow-2xl',
          isDark ? 'border-white/20 bg-white/10' : 'border-[#e5e7eb] bg-white/90',
        )}
      >
        <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-[#111827]')} data-testid="question-text">{question.pregunta}</p>

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
                  data-testid="question-option"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors',
                    !feedback &&
                      !isSel &&
                      (isDark
                        ? 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                        : 'border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#eff6ff]'),
                    !feedback &&
                      isSel &&
                      (isDark
                        ? 'border-[#2563EB] bg-[#2563EB]/80 text-white'
                        : 'border-[#2563EB] bg-[#dbeafe] text-[#2563EB]'),
                    showRes &&
                      isSel &&
                      op.esCorrecta &&
                      (isDark
                        ? 'border-green-400 bg-green-500/30 text-green-300'
                        : 'border-[#16a34a] bg-[#dcfce7] text-[#16a34a]'),
                    showRes &&
                      isSel &&
                      !op.esCorrecta &&
                      (isDark
                        ? 'border-red-400 bg-red-500/30 text-red-300'
                        : 'border-[#f87171] bg-[#fee2e2] text-[#f87171]'),
                    showRes &&
                      !isSel &&
                      op.esCorrecta &&
                      (isDark ? 'border-green-400 bg-green-500/20 text-green-300' : 'border-[#16a34a] bg-[#dcfce7]/80'),
                    showRes &&
                      !isSel &&
                      !op.esCorrecta &&
                      (isDark ? 'border-white/20 opacity-40' : 'border-[#e5e7eb] opacity-40'),
                  )}
                >
                  {showRes && isSel && op.esCorrecta  && <CheckCircle className="size-3.5 shrink-0 text-green-600" />}
                  {showRes && isSel && !op.esCorrecta && <XCircle className="size-3.5 shrink-0 text-red-500" />}
                  {(!showRes || (!isSel && !op.esCorrecta)) && (
                    <Circle className={cn('size-3.5 shrink-0', isSel ? 'text-[#2563EB]' : 'opacity-30')} />
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
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800',
              )}
            >
              {feedback.correct ? '¡Correcto!' : 'Incorrecto.'}
            </p>
            <Button size="sm" variant="outline" onClick={onDismiss} className="w-full" data-testid="question-close-button">
              Continuar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function ViewerView({
  actividad,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  actividad: VideoInteractive;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const {
    source,
    embedUrl,
    isYouTube,
    isVimeo,
    isDirect,
    vimeoEmbedUrl,
    videoRef,
    ytMountRef,
    vimeoFrameRef,
    hasStarted,
    setHasStarted,
    activeQ,
    dismissQ,
    handleOverlayAnswer,
  } = useVideoInteractiveRuntime({
    actividad,
    editorSyncKey,
    onResponse,
  });

  const youtubeThumbId = useMemo(
    () => extractYouTubeId(actividad.urlVideo ?? ''),
    [actividad.urlVideo],
  );
  const [youtubeThumbTier, setYoutubeThumbTier] = useState<'max' | 'hq'>('max');

  useEffect(() => {
    setYoutubeThumbTier('max');
  }, [actividad.urlVideo, editorSyncKey]);

  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col rounded-xl p-3 shadow-lumina-xs',
        isDark ? 'border border-white/20 bg-white/10' : 'border border-[#e5e7eb] bg-white/90',
      )}
      data-testid="video-interactive-viewer"
    >
      {/* El escenario llena el bloque; YouTube no debe imponer 640×390 al dar play. */}
      <div
        className={cn(
          'relative min-h-0 w-full flex-1 overflow-hidden rounded-md bg-black',
          '[&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0',
          '[&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full',
        )}
      >
        {isDirect ? (
          <video
            ref={videoRef}
            src={source.normalizedUrl || actividad.urlVideo}
            controls
            data-testid="video-player-html5"
            className="object-contain"
          />
        ) : isYouTube ? (
          <div
            ref={ytMountRef}
            className="absolute inset-0 h-full w-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
            data-testid="video-player-yt"
          />
        ) : isVimeo ? (
          <iframe
            ref={vimeoFrameRef}
            src={vimeoEmbedUrl ?? undefined}
            title="Video Vimeo"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            data-testid="video-player-vimeo"
          />
        ) : (
          <iframe
            src={embedUrl ?? undefined}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {!hasStarted && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center">
            {youtubeThumbId ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura CDN de YouTube */}
                <img
                  alt=""
                  src={
                    youtubeThumbTier === 'max'
                      ? `https://img.youtube.com/vi/${youtubeThumbId}/maxresdefault.jpg`
                      : `https://img.youtube.com/vi/${youtubeThumbId}/hqdefault.jpg`
                  }
                  onError={() => {
                    if (youtubeThumbTier === 'max') setYoutubeThumbTier('hq');
                  }}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-black" aria-hidden />
            )}
            <div className="absolute inset-0 bg-black/50" aria-hidden />
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              data-testid="video-start-button"
              className="relative z-10 flex flex-col items-center gap-3 rounded-lg p-4 transition-transform duration-200 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/30">
                <Play className="size-10 text-white" fill="currentColor" aria-hidden />
              </span>
              <span className="text-sm font-medium text-white">Toca para comenzar</span>
            </button>
          </div>
        )}

        {activeQ && (
          <QuestionOverlay
            question={activeQ}
            onDismiss={dismissQ}
            onAnswer={handleOverlayAnswer}
            variant={variant}
          />
        )}
      </div>

      {/* Unknown embeds: show static questions list */}
      {!isDirect && !isYouTube && !isVimeo && actividad.preguntas.length > 0 && (
        <div className="mt-3 shrink-0 space-y-1.5">
          <p className={cn('text-xs font-medium', isDark ? 'text-white/70' : 'text-[#6b7280]')}>Preguntas del video</p>
          {actividad.preguntas.map((q) => (
            <div
              key={q.id}
              className={cn(
                'flex gap-3 rounded-md border px-3 py-2 text-xs',
                isDark ? 'border-white/20 bg-white/10 text-white' : 'border-[#e5e7eb] bg-white text-[#111827]',
              )}
            >
              <span className={cn('shrink-0 tabular-nums', isDark ? 'text-white/70' : 'text-[#6b7280]')}>
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

export function VideoInteractiveActivity({ actividad, modo, editorSyncKey, onResponse, variant }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} editorSyncKey={editorSyncKey} onResponse={onResponse} variant={variant} />;
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
    <div className="flex max-h-[min(60vh,500px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800">
          Video Interactivo
        </span>
        <span className="truncate text-[10px] text-[#9ca3af]">
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
            <div key={q.id} className="relative rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3 shadow-lumina-xs">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 size-6 text-[#9ca3af] hover:text-destructive"
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

              <div className="space-y-2 border-l-2 border-[#e5e7eb]/50 pl-2">
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
                      className="size-6 shrink-0 text-[#9ca3af] hover:text-destructive"
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
                    className="h-6 px-2 text-[10px] text-[#9ca3af]"
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
