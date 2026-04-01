'use client';

import { useRef, useState } from 'react';
import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react';

import type { VideoInteractive, VideoQuestion } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
  }
  if (plataforma === 'vimeo' || (!plataforma && urlVideo.includes('vimeo'))) {
    const match = urlVideo.match(/vimeo\.com\/(\d+)/);
    const id = match?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null; // direct video
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

function ViewerView({ actividad }: { actividad: VideoInteractive }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeQ, setActiveQ] = useState<VideoQuestion | null>(null);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const embedUrl = buildEmbedUrl(actividad);
  const isDirect = !embedUrl;

  function onTimeUpdate() {
    if (activeQ) return;
    const t = videoRef.current?.currentTime ?? 0;
    const q = actividad.preguntas.find(
      (q) => !answeredIds.has(q.id) && Math.abs(t - q.tiempoSegundos) < 0.5,
    );
    if (q) {
      if (q.pausarVideo !== false) videoRef.current?.pause();
      setActiveQ(q);
    }
  }

  function dismissQ() {
    if (activeQ) setAnsweredIds((p) => new Set([...p, activeQ.id]));
    setActiveQ(null);
    if (isDirect) videoRef.current?.play().catch(() => {});
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
        ) : (
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
        {activeQ && <QuestionOverlay question={activeQ} onDismiss={dismissQ} />}
      </div>

      {/* For embedded videos: show questions list (can't intercept time events) */}
      {!isDirect && actividad.preguntas.length > 0 && (
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
