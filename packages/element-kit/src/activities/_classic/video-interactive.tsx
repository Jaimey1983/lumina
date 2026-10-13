'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Circle, Clock, Play, Trash2, Plus, XCircle } from 'lucide-react';

import type { VideoInteractive, VideoQuestion } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { normalizeVideoSource } from './video-url-utils.js';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './video-interactive.module.css';
import { useVideoInteractiveRuntime } from './use-video-interactive-runtime.js';

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
    <div className="space-y-4 rounded-lg border border-border bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
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
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
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
              <div className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
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
  onAnswer,
  variant = 'light',
  sonido,
}: {
  question: VideoQuestion;
  onDismiss: () => void;
  onAnswer?: (answer: unknown) => void;
  variant?: 'dark' | 'light';
  sonido: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const señal = useActivityFeedback({ sonido });

  const isDark = variant === 'dark';

  function handleCheck() {
    if (!selected) return;
    const correct = question.opciones.find((o) => o.id === selected)?.esCorrecta ?? false;
    setFeedback({ correct });
    señal.emitir(correct ? 'acierto' : 'error', { movimiento: false });
    onAnswer?.(selected);
  }

  return (
    <div className={styles.fondoPregunta} data-testid="question-overlay">
      <div className={cn(styles.pregunta, isDark ? styles.oscuro : styles.claro)} role="group" aria-label="Pregunta del video">
        <p className={styles.enunciado} data-testid="question-text">{question.pregunta}</p>

        <ul className={styles.opciones}>
          {question.opciones.map((op) => {
            const isSel = selected === op.id;
            const showRes = !!feedback;
            // Tras contestar: la elegida se marca bien/mal y la correcta no elegida se revela (como siempre).
            const revelaCorrecta = showRes && !isSel && op.esCorrecta;
            return (
              <li key={op.id}>
                <button
                  type="button"
                  disabled={!!feedback}
                  onClick={() => setSelected(op.id)}
                  data-testid="question-option"
                  className={cn(
                    styles.opcion,
                    !feedback && isSel && styles.elegida,
                    showRes && isSel && (op.esCorrecta ? styles.correcta : styles.incorrecta),
                    revelaCorrecta && styles.correcta,
                    showRes && !isSel && !revelaCorrecta && styles.apagada,
                  )}
                >
                  {showRes && isSel && op.esCorrecta && <CheckCircle className={cn(styles.icono, styles.iconoCorrecto)} aria-hidden />}
                  {showRes && isSel && !op.esCorrecta && <XCircle className={cn(styles.icono, styles.iconoIncorrecto)} aria-hidden />}
                  {revelaCorrecta && <CheckCircle className={cn(styles.icono, styles.iconoCorrecto)} aria-hidden />}
                  {(!showRes || (!isSel && !revelaCorrecta)) && (
                    <Circle className={cn(styles.icono, isSel ? styles.iconoElegido : styles.iconoNeutro)} aria-hidden />
                  )}
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
          <div className={styles.acciones}>
            <p role="status" className={cn(styles.veredicto, feedback.correct ? styles.veredictoBien : styles.veredictoMal)}>
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

// ─── Viewer (sobre el ActivityShell, U9d.5) ───────────────────────────────────────

interface CuerpoVideoProps {
  actividad: VideoInteractive;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant: 'dark' | 'light';
  ctx: ActivityShellContext;
}

function CuerpoVideo({ actividad, editorSyncKey, onResponse, variant, ctx }: CuerpoVideoProps) {
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
    answeredCount,
  } = useVideoInteractiveRuntime({
    actividad,
    editorSyncKey,
    onResponse,
  });

  const { setProgreso, completar } = ctx;
  const total = actividad.preguntas.length;
  useEffect(() => {
    setProgreso(answeredCount, total);
  }, [answeredCount, total, setProgreso]);
  // Contestadas todas las preguntas, la actividad queda completa (el video sigue a disposición).
  useEffect(() => {
    if (total > 0 && answeredCount >= total) completar();
  }, [answeredCount, total, completar]);

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
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)} data-testid="video-interactive-viewer">
      <div className={styles.escenario}>
        {isDirect ? (
          <video
            ref={videoRef}
            src={source.normalizedUrl || actividad.urlVideo}
            controls
            data-testid="video-player-html5"
          />
        ) : isYouTube ? (
          <div ref={ytMountRef} className={styles.yt} data-testid="video-player-yt" />
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
          <div className={styles.portada}>
            {youtubeThumbId ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura CDN de YouTube
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
                className={styles.miniatura}
              />
            ) : (
              <div className={styles.negro} aria-hidden />
            )}
            <div className={styles.velo} aria-hidden />
            <button type="button" onClick={() => setHasStarted(true)} data-testid="video-start-button" className={styles.empezar}>
              <span className={styles.empezarIcono}>
                <Play style={{ width: '2.5rem', height: '2.5rem' }} fill="currentColor" aria-hidden />
              </span>
              <span className={styles.empezarTexto}>Toca para comenzar</span>
            </button>
          </div>
        )}

        {activeQ && (
          <QuestionOverlay
            question={activeQ}
            onDismiss={dismissQ}
            onAnswer={handleOverlayAnswer}
            variant={variant}
            sonido={ctx.ajustes.sonido}
          />
        )}
      </div>

      {/* Unknown embeds: show static questions list */}
      {!isDirect && !isYouTube && !isVimeo && actividad.preguntas.length > 0 && (
        <div className={styles.listaEstatica}>
          <p className={styles.listaTitulo}>Preguntas del video</p>
          {actividad.preguntas.map((q) => (
            <div key={q.id} className={styles.itemEstatico}>
              <span className={styles.itemTiempo}>{formatTime(q.tiempoSegundos)}</span>
              <span>{q.pregunta}</span>
            </div>
          ))}
        </div>
      )}

      <div role="status" aria-live="polite" className={styles.soloLector}>
        {activeQ ? `Pregunta del video: ${activeQ.pregunta}` : ''}
      </div>
    </div>
  );
}

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
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'vi'}
      ajustes={ajustes}
      total={actividad.preguntas.length}
      // Sin pantalla de resultados: el video sigue a disposición; cada respuesta sale al contestarla.
      resultado="ninguno"
      className={styles.shell}
    >
      {(ctx) => (
        <CuerpoVideo
          actividad={actividad}
          editorSyncKey={editorSyncKey}
          onResponse={onResponse}
          variant={variant}
          ctx={ctx}
        />
      )}
    </ActivityShell>
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
    <div className="flex max-h-[min(60vh,500px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800">
          Video Interactivo
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
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
            <div key={q.id} className="relative rounded-md border border-border bg-muted/40 p-3 shadow-lumina-xs">
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

              <div className="space-y-2 border-l-2 border-border/50 pl-2">
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
