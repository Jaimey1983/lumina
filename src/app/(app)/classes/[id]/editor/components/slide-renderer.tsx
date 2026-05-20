'use client';

import {
  createElement,
  CSSProperties,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Copy } from 'lucide-react';
import { useParams } from 'next/navigation';


import { useUpdateSlide } from '@/hooks/api/use-classes';
import {
  mergeRendererSlideState,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { ResizeHandles } from './resize-handles';

import type {
  Activity,
  ActivityBlock,
  AudioBlock,
  Background,
  Block,
  CodeBlock,
  ColumnsBlock,
  DividerBlock,
  FormaBlock,
  ImageBlock,
  QuoteBlock,
  Slide,
  TextBlock,
  VideoBlock,
} from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { cn } from '@/lib/utils';
import { getSlideVariant } from '@/lib/slide-variant';

import { ShortAnswerActivityEditor, ShortAnswerViewer } from './activities/short-answer';
import { FillBlanksActivityEditor, FillBlanksViewer } from './activities/fill-blanks';
import { MatchPairsActivityEditor, MatchPairsViewer } from './activities/match-pairs';
import { OrderStepsActivityEditor, OrderStepsViewer } from './activities/order-steps';
import { WordCloudActivityEditor, WordCloudViewer } from './activities/word-cloud';
import { QuizMultipleActivityEditor, QuizMultipleViewer } from './activities/quiz-multiple';
import { TrueFalseActivityEditor, TrueFalseViewer } from './activities/true-false';
import { DragDropActivity, DragDropActivityEditor } from './activities/drag-drop';
import { VideoInteractiveActivity, VideoInteractiveActivityEditor } from './activities/video-interactive';
import { LivePollActivityEditor, LivePollViewer } from './activities/live-poll';
import { TorneoActivityEditor } from './activities/torneo-activity';
import type { Socket } from 'socket.io-client';
import { TorneoViewer } from '@/components/viewers/torneo-viewer';
import { EscapeRoomActivityEditor } from './activities/escape-room-activity';
import { EscapeRoomViewer } from '@/components/viewers/escape-room-viewer';

// ─── Modo ──────────────────────────────────────────────────────────────────────

type Modo = 'editor' | 'viewer' | 'preview';

function stripMarcoFromActivityBlock(block: ActivityBlock): ActivityBlock {
  if (!block.marco) return block;
  const { marco: _, ...rest } = block;
  return rest as ActivityBlock;
}

function blockForActivityRender(block: Block): Block {
  if (block.tipo !== 'actividad') return block;
  return stripMarcoFromActivityBlock(block);
}

// ─── Activity placeholder labels ──────────────────────────────────────────────

const ACTIVITY_LABELS: Record<Activity['tipo'], string> = {
  quiz_multiple: 'Quiz · Opción múltiple',
  verdadero_falso: 'Actividad · Verdadero / Falso',
  short_answer: 'Actividad · Respuesta corta',
  completar_blancos: 'Actividad · Completar blancos',
  arrastrar_soltar: 'Actividad · Arrastrar y soltar',
  emparejar: 'Actividad · Emparejar',
  ordenar_pasos: 'Actividad · Ordenar pasos',
  video_interactivo: 'Actividad · Video interactivo',
  encuesta_viva: 'Actividad · Encuesta en vivo',
  nube_palabras: 'Actividad · Nube de palabras',
  torneo: 'Actividad · Torneo de preguntas',
  escape_room: 'Actividad · Escape room',
};

// ─── Background → CSS ─────────────────────────────────────────────────────────

function slideBackgroundString(fondo?: Background): string | undefined {
  if (!fondo) return undefined;
  switch (fondo.tipo) {
    case 'color':
      return fondo.valor;
    case 'gradiente':
      return `${fondo.inicio} ${fondo.fin}`;
    case 'imagen':
      return fondo.url;
    default:
      return undefined;
  }
}

function buildBackgroundStyle(fondo?: Background): CSSProperties {
  if (!fondo) return { backgroundColor: '#ffffff' };

  switch (fondo.tipo) {
    case 'color':
      return { backgroundColor: fondo.valor };

    case 'gradiente': {
      const deg = fondo.direccion ?? 135;
      return { background: `linear-gradient(${deg}deg, ${fondo.inicio}, ${fondo.fin})` };
    }

    case 'imagen': {
      const sizeMap: Record<string, string> = {
        cubrir: 'cover',
        contener: 'contain',
        llenar: '100% 100%',
        ninguno: 'auto',
      };
      return {
        backgroundImage: `url(${JSON.stringify(fondo.url)})`,
        backgroundSize: sizeMap[fondo.ajuste ?? 'cubrir'] ?? 'cover',
        backgroundPosition: fondo.posicion ?? 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }
}

// ─── Canvas positioning ───────────────────────────────────────────────────────

const ACTIVITY_POSITION_FALLBACK = { x: 5, y: 5, ancho: 90, alto: 90 };

function getBlockPositionStyle(block: Block): CSSProperties {
  switch (block.tipo) {
    case 'texto': {
      const fb = BLOCK_FALLBACKS.text;
      return {
        position: 'absolute',
        left: `${block.x ?? fb.x}%`,
        top: `${block.y ?? fb.y}%`,
        width: `${block.ancho ?? fb.ancho}%`,
        height: `${block.alto ?? fb.alto}%`,
        zIndex: block.zIndex ?? 1,
      };
    }
    case 'imagen': {
      const fb = BLOCK_FALLBACKS.image;
      const ancho = typeof block.ancho === 'number' ? block.ancho : fb.ancho;
      const alto = typeof block.alto === 'number' ? block.alto : fb.alto;
      return {
        position: 'absolute',
        left: `${block.x ?? fb.x}%`,
        top: `${block.y ?? fb.y}%`,
        width: `${ancho}%`,
        height: `${alto}%`,
        zIndex: block.zIndex ?? 1,
      };
    }
    case 'video': {
      const fb = BLOCK_FALLBACKS.video;
      const ancho = typeof block.ancho === 'number' ? block.ancho : fb.ancho;
      const alto = typeof block.alto === 'number' ? block.alto : fb.alto;
      return {
        position: 'absolute',
        left: `${block.x ?? fb.x}%`,
        top: `${block.y ?? fb.y}%`,
        width: `${ancho}%`,
        height: `${alto}%`,
        zIndex: block.zIndex ?? 1,
      };
    }
    case 'forma': {
      const fb = BLOCK_FALLBACKS.forma;
      return {
        position: 'absolute',
        left: `${block.x ?? fb.x}%`,
        top: `${block.y ?? fb.y}%`,
        width: `${block.ancho ?? fb.ancho}%`,
        height: `${block.alto ?? fb.alto}%`,
        zIndex: block.zIndex ?? 1,
      };
    }
    case 'actividad': {
      if (block.marco) {
        return {
          position: 'absolute',
          left: `${block.marco.izquierdaPct}%`,
          top: `${block.marco.arribaPct}%`,
          width: `${block.marco.anchoPct}%`,
          height: `${block.marco.altoPct}%`,
          zIndex: 1,
        };
      }
      const fb = ACTIVITY_POSITION_FALLBACK;
      return {
        position: 'absolute',
        left: `${fb.x}%`,
        top: `${fb.y}%`,
        width: `${fb.ancho}%`,
        height: `${fb.alto}%`,
        zIndex: 1,
      };
    }
    default:
      return {
        position: 'absolute',
        left: '5%',
        top: '5%',
        width: '90%',
        height: '90%',
        zIndex: 1,
      };
  }
}

function getBlockRawCoords(block: Block): { x: number; y: number; ancho: number; alto: number } {
  switch (block.tipo) {
    case 'texto': {
      const fb = BLOCK_FALLBACKS.text;
      return { x: block.x ?? fb.x, y: block.y ?? fb.y,
               ancho: block.ancho ?? fb.ancho, alto: block.alto ?? fb.alto };
    }
    case 'imagen': {
      const fb = BLOCK_FALLBACKS.image;
      return { x: block.x ?? fb.x, y: block.y ?? fb.y,
               ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
               alto: typeof block.alto === 'number' ? block.alto : fb.alto };
    }
    case 'video': {
      const fb = BLOCK_FALLBACKS.video;
      return { x: block.x ?? fb.x, y: block.y ?? fb.y,
               ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
               alto: typeof block.alto === 'number' ? block.alto : fb.alto };
    }
    case 'forma': {
      const fb = BLOCK_FALLBACKS.forma;
      return { x: block.x ?? fb.x, y: block.y ?? fb.y,
               ancho: block.ancho ?? fb.ancho, alto: block.alto ?? fb.alto };
    }
    case 'actividad': {
      if (block.marco) {
        return {
          x: block.marco.izquierdaPct,
          y: block.marco.arribaPct,
          ancho: block.marco.anchoPct,
          alto: block.marco.altoPct,
        };
      }
      const fb = ACTIVITY_POSITION_FALLBACK;
      return { x: fb.x, y: fb.y, ancho: fb.ancho, alto: fb.alto };
    }
    default: {
      const fb = ACTIVITY_POSITION_FALLBACK;
      return { x: fb.x, y: fb.y, ancho: fb.ancho, alto: fb.alto };
    }
  }
}

// ─── YouTube embed URL ────────────────────────────────────────────────────────

function buildEmbedUrl(url: string, autoplay?: boolean): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const params = new URLSearchParams({ ...(autoplay ? { autoplay: '1' } : {}) });
    return `https://www.youtube.com/embed/${videoId}${params.size ? `?${params}` : ''}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const params = new URLSearchParams({ ...(autoplay ? { autoplay: '1' } : {}) });
    return `https://player.vimeo.com/video/${videoId}${params.size ? `?${params}` : ''}`;
  }
  return url;
}

// ─── Individual block renderers ───────────────────────────────────────────────

const TEXT_ALIGN_MAP: Record<string, CSSProperties['textAlign']> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

function textBlockContenidoIsEmpty(block: TextBlock): boolean {
  const c = block.contenido;
  return c === undefined || c === '';
}

function textBlockFontSizePx(block: TextBlock): number {
  const raw = block.tamanoFuente ?? '';
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]!) : 0;
}

function emptyTextPlaceholderLabel(block: TextBlock): string {
  return textBlockFontSizePx(block) >= 28
    ? 'Haga clic para agregar título'
    : 'Haga clic para agregar texto';
}

/** Estilos opcionales del JSON de texto: solo se añaden si el campo viene definido. */
function textBlockOptionalVisualStyle(block: TextBlock): CSSProperties {
  const out: CSSProperties = {};
  if (block.fuente !== undefined && block.fuente !== '') {
    out.fontFamily = block.fuente;
  }
  if (block.subrayado === true) {
    out.textDecoration = 'underline';
  }
  const opacidad = (block as TextBlock & { opacidad?: number }).opacidad;
  if (opacidad !== undefined && typeof opacidad === 'number') {
    out.opacity = opacidad / 100;
  }
  return out;
}

// ─── Inline text editor ───────────────────────────────────────────────────────

function InlineTextEditor({
  block,
  onCommit,
  onDiscard,
}: {
  block: TextBlock;
  onCommit: (text: string) => void;
  onDiscard: () => void;
}) {
  const [value, setValue] = useState(block.contenido ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Guards against double-fire from blur + Enter/Escape. */
  const exitedRef = useRef(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  function commit() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onCommit(value);
  }

  function discard() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onDiscard();
  }

  const isEmpty = value === '';

  return (
    <div
      className="relative h-full w-full min-h-0"
      style={
        isEmpty
          ? { border: '2px dashed #aaa', boxSizing: 'border-box' }
          : undefined
      }
    >
      {isEmpty && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
          else if (e.key === 'Escape')          { e.preventDefault(); discard(); }
        }}
        // Prevent click/dblclick from bubbling to BlockNode while editing
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '2px',
          border: 'none',
          outline: 'none',
          background: isEmpty ? 'transparent' : 'rgba(255,255,255,0.05)',
          resize: 'none',
          cursor: 'text',
          fontSize: block.tamanoFuente,
          fontWeight: block.negrita ? 'bold' : 'normal',
          fontStyle: block.cursiva ? 'italic' : 'normal',
          color: block.color ?? 'inherit',
          textAlign: block.alineacion
            ? (TEXT_ALIGN_MAP[block.alineacion] ?? 'left')
            : 'left',
          lineHeight: 'inherit',
          overflowY: 'auto',
          boxSizing: 'border-box',
          zIndex: 1,
          ...textBlockOptionalVisualStyle(block),
        }}
      />
    </div>
  );
}

// ─── RenderText ───────────────────────────────────────────────────────────────

interface RenderTextProps {
  block: TextBlock;
  modo: Modo;
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
}

function RenderText({ block, modo, isEditing, onCommit, onDiscard }: RenderTextProps) {
  if (isEditing && onCommit && onDiscard) {
    return <InlineTextEditor block={block} onCommit={onCommit} onDiscard={onDiscard} />;
  }

  if (modo === 'editor' && textBlockContenidoIsEmpty(block)) {
    return (
      <div
        className="relative box-border h-full min-h-[1.25em] w-full"
        style={{ border: '2px dashed #aaa' }}
      >
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      </div>
    );
  }

  const style: CSSProperties = {
    margin: 0,
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    fontSize: block.tamanoFuente,
    fontWeight: block.negrita ? 'bold' : undefined,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color,
    ...textBlockOptionalVisualStyle(block),
  };
  const tag = block.nivel ? `h${block.nivel}` : 'p';
  return createElement(tag, { style }, block.contenido);
}

function RenderImage({ block, forceFill }: { block: ImageBlock; forceFill?: boolean }) {
  const fitMap: Record<string, CSSProperties['objectFit']> = {
    cubrir: 'cover',
    contener: 'contain',
    llenar: 'fill',
  };

  return (
    <figure style={{ margin: 0, width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt ?? ''}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: forceFill ? 'fill' : (block.ajuste ? fitMap[block.ajuste] : 'fill'),
          borderRadius: block.bordeRedondeado,
        }}
      />
      {block.caption && (
        <figcaption
          style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function RenderVideo({ block }: { block: VideoBlock }) {
  const isYoutube = block.url.includes('youtube') || block.url.includes('youtu.be');

  if (isYoutube) {
    const src = buildEmbedUrl(block.url, block.autoplay);
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <iframe
          src={src}
          title="Video YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  }

  return (
    <video
      src={block.url}
      controls={block.controles ?? true}
      autoPlay={block.autoplay}
      loop={block.bucle}
      muted={block.silenciado}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

function RenderAudio({ block }: { block: AudioBlock }) {
  return (
    <audio
      src={block.url}
      controls={block.controles ?? true}
      autoPlay={block.autoplay}
      loop={block.bucle}
      style={{ width: '100%' }}
    />
  );
}

function RenderCode({ block }: { block: CodeBlock }) {
  return (
    <div style={{ overflow: 'hidden', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
      {block.titulo && (
        <div
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {block.titulo}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#1e1e1e',
          color: '#d4d4d4',
          fontSize: '0.8125rem',
          fontFamily: 'ui-monospace, monospace',
          overflow: 'auto',
          whiteSpace: 'pre',
        }}
      >
        <code>{block.codigo}</code>
      </pre>
    </div>
  );
}

function RenderQuote({ block }: { block: QuoteBlock }) {
  return (
    <blockquote
      style={{
        margin: 0,
        paddingLeft: '1rem',
        borderLeft: '3px solid #d1d5db',
      }}
    >
      <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>{block.texto}</p>
      {(block.autor || block.fuente) && (
        <footer style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>
          {block.autor && <cite style={{ fontStyle: 'normal' }}>{block.autor}</cite>}
          {block.autor && block.fuente && <span> · </span>}
          {block.fuente && <span>{block.fuente}</span>}
        </footer>
      )}
    </blockquote>
  );
}

function RenderDivider({ block }: { block: DividerBlock }) {
  const styleMap: Record<string, string> = {
    solido: 'solid',
    punteado: 'dotted',
    guionado: 'dashed',
  };
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `${block.grosor ?? 1}px ${styleMap[block.estilo ?? 'solido'] ?? 'solid'} ${block.color ?? '#e5e7eb'}`,
        margin: 0,
        width: '100%',
      }}
    />
  );
}

function RenderForma({ block }: { block: FormaBlock }) {
  const formaOpacity =
    block.opacidad !== undefined ? block.opacidad / 100 : 1;

  if (block.forma === 'linea') {
    return (
      <hr
        style={{
          border: 'none',
          borderTop: `${block.grosorBorde ?? 2}px solid ${block.color}`,
          margin: 0,
          width: '100%',
          opacity: formaOpacity,
        }}
      />
    );
  }

  if (block.forma === 'triangulo') {
    return (
      <svg
        viewBox="0 0 100 100"
        style={{ width: '100%', height: '100%', opacity: formaOpacity }}
        preserveAspectRatio="none"
      >
        <polygon
          points="50,0 100,100 0,100"
          fill={block.color}
          stroke={block.colorBorde ?? 'none'}
          strokeWidth={block.grosorBorde ?? 0}
        />
      </svg>
    );
  }

  const baseStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: block.color,
    border: block.grosorBorde ? `${block.grosorBorde}px solid ${block.colorBorde || '#000'}` : 'none',
    boxSizing: 'border-box',
    opacity: formaOpacity,
  };

  if (block.forma === 'circulo') {
    baseStyle.borderRadius = '50%';
  }

  return <div style={baseStyle} />;
}

function RenderActivity({
  block,
  blockId,
  slideId,
  modo,
  isSelected,
  activityCanvasLayout,
  onActivityChange,
  onRemoveBlock,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
}: {
  block: ActivityBlock;
  blockId: string;
  slideId: string;
  modo: 'editor' | 'viewer';
  isSelected: boolean;
  /** Altura acotada en el lienzo cuando la actividad va sola y centrada. */
  activityCanvasLayout?: boolean;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
  /** Callback emitido por el estudiante al responder (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
  liveSocket?: Socket | null;
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
}) {
  const act = block.actividad;
  const syncKey = `${slideId}-${blockId}`;

  if (act.tipo === 'short_answer') {
    if (modo === 'editor') {
      return (
        <ShortAnswerActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return <ShortAnswerViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'quiz_multiple') {
    if (modo === 'editor') {
      return (
        <QuizMultipleActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return <QuizMultipleViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'verdadero_falso') {
    if (modo === 'editor') {
      return (
        <TrueFalseActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return <TrueFalseViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'arrastrar_soltar') {
    if (modo === 'editor') {
      return (
        <DragDropActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return <DragDropActivity actividad={act} modo="viewer" editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'completar_blancos') {
    if (modo === 'editor') {
      return (
        <FillBlanksActivityEditor
          data={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return <FillBlanksViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'emparejar') {
    if (modo === 'editor') {
      return (
        <MatchPairsActivityEditor
          data={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return <MatchPairsViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'ordenar_pasos') {
    if (modo === 'editor') {
      return (
        <OrderStepsActivityEditor
          data={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return <OrderStepsViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'nube_palabras') {
    if (modo === 'editor') {
      return (
        <WordCloudActivityEditor
          data={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return <WordCloudViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'video_interactivo') {
    if (modo === 'editor') {
      return (
        <VideoInteractiveActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          onChange={(updated) => onActivityChange?.(blockId, updated)}
        />
      );
    }
    return <VideoInteractiveActivity actividad={act} modo="viewer" editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'encuesta_viva') {
    if (modo === 'editor') {
      return (
        <LivePollActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          onChange={(updated) => onActivityChange?.(blockId, updated)}
        />
      );
    }
    return <LivePollViewer activity={act} editorSyncKey={syncKey} onResponse={onResponse} variant={variant} />;
  }

  if (act.tipo === 'torneo') {
    if (modo === 'editor') {
      return (
        <TorneoActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return (
      <TorneoViewer
        activity={act}
        variant={variant}
        studentId={viewerStudentId ?? ''}
        studentName={viewerStudentName ?? ''}
        classId={viewerClassId ?? ''}
        editorSyncKey={syncKey}
        liveSocket={torneoSocket ?? liveSocket}
        onAnswer={(payload) => onResponse?.(payload)}
      />
    );
  }

  if (act.tipo === 'escape_room') {
    if (modo === 'editor') {
      return (
        <EscapeRoomActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return (
      <EscapeRoomViewer
        activity={act}
        variant={variant}
        studentId={viewerStudentId ?? ''}
        studentName={viewerStudentName ?? ''}
        classId={viewerClassId ?? ''}
        editorSyncKey={syncKey}
        liveSocket={liveSocket}
        onComplete={undefined}
        onAnswer={(roomId, answer) => onResponse?.({ roomId, answer })}
      />
    );
  }

  const label = ACTIVITY_LABELS[(act as { tipo: keyof typeof ACTIVITY_LABELS }).tipo];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1.5rem',
        border: '2px dashed #f59e0b',
        borderRadius: '0.5rem',
        background: '#fffbeb',
        color: '#92400e',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <span aria-hidden style={{ fontSize: '1.125rem' }}>⚡</span>
      {label}
    </div>
  );
}

// ─── ColumnsBlock — forward-referenced from BlockNode ─────────────────────────

interface RenderColumnsProps {
  block: ColumnsBlock;
  slideId: string;
  modo: Modo;
  selectedId: string | null;
  selectedBlockIds?: string[];
  onBlockClick: (id: string, e?: React.MouseEvent) => void;
  pathPrefix: string;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
  liveSocket?: Socket | null;
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
}

function RenderColumns({
  block,
  slideId,
  modo,
  selectedId,
  selectedBlockIds,
  onBlockClick,
  pathPrefix,
  onActivityChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
}: RenderColumnsProps) {
  let gridCols = `repeat(${block.columnas.length}, 1fr)`;
  if (block.proporcion) {
    const parts = block.proporcion.split(':');
    if (parts.length === block.columnas.length) {
      gridCols = parts.map((n) => `${n.trim()}fr`).join(' ');
    }
  }

  const editorMode = modo === 'editor';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: '1rem',
        width: '100%',
        height: '100%',
      }}
    >
      {block.columnas.map((colBlocks, colIdx) => (
        <div
          key={colIdx}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          {colBlocks.map((innerBlock, blockIdx) => {
            const id = `${pathPrefix}-${colIdx}-${blockIdx}`;
            const isInnerSelected = editorMode && (
              selectedBlockIds && selectedBlockIds.length > 0
                ? selectedBlockIds.includes(id)
                : selectedId === id
            );
            return (
              <BlockNode
                key={id}
                block={innerBlock}
                blockId={id}
                slideId={slideId}
                isSelected={isInnerSelected}
                modo={modo}
                selectedId={selectedId}
                selectedBlockIds={selectedBlockIds}
                onClick={(e) => onBlockClick(id, e)}
                onBlockClick={onBlockClick}
                pathPrefix={id}
                onActivityChange={onActivityChange}
                onRemoveBlock={onRemoveBlock}
                onDuplicateBlock={onDuplicateBlock}
                onCopyBlock={onCopyBlock}
                onResponse={onResponse}
                variant={variant}
                liveSocket={liveSocket}
                torneoSocket={torneoSocket}
                viewerStudentId={viewerStudentId}
                viewerStudentName={viewerStudentName}
                viewerClassId={viewerClassId}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

const BLOCK_TOOLBAR_GAP_PX = 4;

/** Barra de acciones del bloque en `document.body` para evitar recorte por overflow del canvas. */
function BlockActionToolbarPortal({
  blockRef,
  visible,
  children,
}: {
  blockRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    const el = blockRef.current;
    if (!el || !visible) {
      setStyle(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setStyle({
      position: 'fixed',
      top: rect.top - BLOCK_TOOLBAR_GAP_PX,
      left: rect.left + rect.width / 2,
      transform: 'translate(-50%, -100%)',
      zIndex: 1000,
    });
  }, [blockRef, visible]);

  useLayoutEffect(() => {
    updatePosition();
    if (!visible) return;

    const el = blockRef.current;
    if (!el) return;

    const ro = new ResizeObserver(updatePosition);
    ro.observe(el);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, updatePosition, blockRef]);

  if (!visible || !style || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Opciones del bloque"
      style={style}
      className="flex items-center gap-1 rounded-2xl border border-[#e5e7eb] bg-white px-2 py-1.5 shadow-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── BlockNode ────────────────────────────────────────────────────────────────

interface BlockNodeProps {
  block: Block;
  blockId: string;
  slideId: string;
  isSelected: boolean;
  modo: Modo;
  selectedId: string | null;
  selectedBlockIds?: string[];
  onClick: (e?: React.MouseEvent) => void;
  onBlockClick: (id: string, e?: React.MouseEvent) => void;
  pathPrefix: string;
  /** Absolute-position style applied to the wrapper div (top-level blocks only). */
  positionStyle?: CSSProperties;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  /** Slide dedicado a actividad(es): el editor de respuesta corta usa layout de lienzo acotado. */
  activityCanvasLayout?: boolean;
  /** Callback emitido por el estudiante al responder (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  /** Contraste de viewers de actividad según luminancia del fondo del slide. */
  variant?: 'dark' | 'light';
  /** Socket en vivo (viewer estudiante) — actividades como torneo escuchan eventos aquí. */
  liveSocket?: Socket | null;
  /** Namespace `/live` para eventos del torneo (opcional; si no, se usa `liveSocket`). */
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  currentCoords?: { x: number; y: number; ancho: number; alto: number };
  onResize?: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onResizeEnd?: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  /** ID of the block currently in inline-text-edit mode (null if none). */
  editingId?: string | null;
  /** Enter inline-edit mode for a TextBlock (double-click in editor). */
  onEditStart?: (blockId: string) => void;
  /** Commit the edited text and persist (Enter / blur). */
  onEditCommit?: (blockId: string, newText: string) => void;
  /** Discard changes and exit inline-edit mode (Escape). */
  onEditCancel?: () => void;
  /** True while this block is being resized for live visual feedback tweaks. */
  isResizing?: boolean;
  /** Position of this block in the slide's block array — used for staggered entry animation in viewer mode. */
  blockIndex?: number;
}

function BlockNode({
  block,
  blockId,
  slideId,
  isSelected,
  modo,
  selectedId,
  selectedBlockIds,
  onClick,
  onBlockClick,
  pathPrefix,
  positionStyle,
  onActivityChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  activityCanvasLayout,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
  canvasRef,
  currentCoords,
  onResize,
  onResizeEnd,
  editingId,
  onEditStart,
  onEditCommit,
  onEditCancel,
  isResizing,
  blockIndex,
}: BlockNodeProps) {
  const isViewerMode = modo === 'viewer' || modo === 'preview';
  const activityBlockForRender: ActivityBlock | null =
    block.tipo === 'actividad' ? (blockForActivityRender(block) as ActivityBlock) : null;

  const editorMode = modo === 'editor';
  const isFormBlock = block.tipo === 'actividad' && editorMode;
  // Normalize 'preview' to 'viewer' for activity renderers
  const activityModo: 'editor' | 'viewer' = editorMode ? 'editor' : 'viewer';

  const isTextEditing = editorMode && block.tipo === 'texto' && editingId === blockId;
  const blockRef = useRef<HTMLDivElement>(null);
  const showActionToolbar =
    editorMode &&
    isSelected &&
    !isFormBlock &&
    !isTextEditing &&
    (!!onRemoveBlock || !!onDuplicateBlock || !!onCopyBlock);

  function renderContent() {
    switch (block.tipo) {
      case 'texto':
        return (
          <RenderText
            block={block}
            modo={modo}
            isEditing={isTextEditing}
            onCommit={onEditCommit ? (text) => onEditCommit(blockId, text) : undefined}
            onDiscard={onEditCancel}
          />
        );
      case 'imagen':    return <RenderImage block={block} forceFill={isResizing} />;
      case 'video':     return <RenderVideo block={block} />;
      case 'audio':     return <RenderAudio block={block} />;
      case 'actividad':
        return activityBlockForRender ? (
          <RenderActivity
            block={activityBlockForRender}
            blockId={blockId}
            slideId={slideId}
            modo={activityModo}
            isSelected={isSelected}
            activityCanvasLayout={activityCanvasLayout}
            onActivityChange={onActivityChange}
            onRemoveBlock={onRemoveBlock}
            onResponse={onResponse}
            variant={variant}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
          />
        ) : null;
      case 'codigo':    return <RenderCode block={block} />;
      case 'cita':      return <RenderQuote block={block} />;
      case 'separador': return <RenderDivider block={block} />;
      case 'forma':     return <RenderForma block={block} />;
      case 'columnas':
        return (
          <RenderColumns
            block={block}
            slideId={slideId}
            modo={modo}
            selectedId={selectedId}
            selectedBlockIds={selectedBlockIds}
            onBlockClick={onBlockClick}
            pathPrefix={pathPrefix}
            onActivityChange={onActivityChange}
            onRemoveBlock={onRemoveBlock}
            onResponse={onResponse}
            variant={variant}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
          />
        );
    }
  }

  const animationStyle: CSSProperties =
    isViewerMode && blockIndex !== undefined
      ? {
          animation: 'lumina-block-in 400ms ease-out both',
          animationDelay: `${blockIndex * 80}ms`,
        }
      : {};

  return (
    <>
    <div
      ref={blockRef}
      role={editorMode && !isFormBlock && !isTextEditing ? 'button' : undefined}
      tabIndex={editorMode && !isFormBlock && !isTextEditing ? 0 : undefined}
      aria-pressed={editorMode && !isTextEditing ? isSelected : undefined}
      data-block-id={blockId}
      style={{ ...positionStyle, ...animationStyle }}
      onClick={
        editorMode && !isTextEditing
          ? (e) => { e.stopPropagation(); onClick(e); }
          : undefined
      }
      onDoubleClick={
        editorMode && block.tipo === 'texto' && !isTextEditing
          ? (e) => { e.stopPropagation(); onEditStart?.(blockId); }
          : undefined
      }
      onKeyDown={
        editorMode && !isFormBlock && !isTextEditing
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        editorMode && 'relative group',
        editorMode && !isFormBlock && !isTextEditing && 'cursor-pointer outline-none rounded-sm',
        editorMode && !isFormBlock && !isTextEditing && 'hover:ring-2 hover:ring-blue-500/40',
        editorMode && isTextEditing && 'cursor-text outline-none rounded-sm',
        isFormBlock && 'min-h-0 max-w-full cursor-default',
        editorMode && isSelected && !isFormBlock && 'ring-2 ring-blue-500 ring-offset-1',
        !editorMode && 'overflow-hidden max-w-full max-h-full',
      )}
    >
      {renderContent()}
      {editorMode && isSelected && !isFormBlock && canvasRef && currentCoords && onResize && onResizeEnd && (
        <ResizeHandles
          blockId={blockId}
          x={currentCoords.x}
          y={currentCoords.y}
          ancho={currentCoords.ancho}
          alto={currentCoords.alto}
          lockAspectRatio={block.tipo === 'imagen' ? !!block.lockAspectRatio : false}
          canvasRef={canvasRef}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      )}
    </div>
    <BlockActionToolbarPortal blockRef={blockRef} visible={showActionToolbar}>
      {!!onCopyBlock && block.tipo !== 'actividad' && (
        <button
          type="button"
          aria-label="Copiar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onCopyBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          title="Copiar (Ctrl+C)"
        >
          <Copy className="size-3.5" />
        </button>
      )}
      {!!onDuplicateBlock && block.tipo !== 'actividad' && (
        <button
          type="button"
          aria-label="Duplicar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          title="Duplicar (Ctrl+D)"
        >
          <Copy className="size-3.5" />
        </button>
      )}
      {!!onRemoveBlock && (
        <button
          type="button"
          aria-label="Eliminar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-red-600"
          title="Eliminar (Supr o Backspace)"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </BlockActionToolbarPortal>
    </>
  );
}

// ─── SlideRenderer ────────────────────────────────────────────────────────────

export interface SlideRendererProps {
  slide: Slide;
  /** `'editor'` shows click-selection borders; `'viewer'`/`'preview'` are purely presentational. */
  modo: Modo;
  /**
   * Ref al marco del lienzo (misma caja que `canvasRef` en `CanvasArea`) para medir resize/drag.
   * Si no se pasa, se usa un ref interno en la raíz del renderer.
   */
  canvasRef?: RefObject<HTMLDivElement | null>;
  /** Called with the block's index-path string when a block is selected in editor mode. */
  onBlockSelect?: (blockId: string, e?: React.MouseEvent) => void;
  selectedBlockId?: string | null;
  selectedBlockIds?: string[];
  /** Persiste cambios de una actividad (PATCH vía el padre). */
  onActivityChange?: (blockId: string, activity: Activity) => void;
  /** Elimina un bloque del slide (p. ej. actividad equivocada). */
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  /** Callback emitido por el estudiante al responder una actividad (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  className?: string;
  /**
   * Si existe, sustituye `useUpdateSlide` para resize/texto: permite historial deshacer/rehacer en el padre.
   */
  onPersistSlide?: (args: {
    previousBloques: Block[];
    content: Record<string, unknown>;
  }) => Promise<boolean>;
  /** Llamado al terminar un resize de bloque (p. ej. limpiar guías de snap del lienzo). */
  onResizeInteractionEnd?: () => void;
  /**
   * Llamado en cada frame de resize con las coordenadas provisionales brutas.
   * Puede devolver coordenadas ajustadas (snapped) que SlideRenderer usará para el
   * live preview. Si no se proporciona, se usan las coords brutas sin snap.
   */
  onResizeMove?: (
    blockId: string,
    rawCoords: { x: number; y: number; ancho: number; alto: number },
  ) => { x: number; y: number; ancho: number; alto: number };
  /**
   * Variante visual de los viewers de actividad.
   * Si se omite, se calcula con la luminancia de `slide.fondo` vía `getSlideVariant`.
   */
  variant?: 'dark' | 'light';
  /** En modo viewer, permite llenar el contenedor padre sin forzar 16:9. */
  viewerFill?: boolean;
  /** Socket.IO del viewer en vivo (p. ej. torneo). */
  liveSocket?: Socket | null;
  /** Socket al namespace `/live` para eventos del torneo (viewer). */
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
}

export function SlideRenderer({
  slide,
  modo,
  canvasRef: canvasRefProp,
  onBlockSelect,
  selectedBlockId: selectedBlockIdProp,
  selectedBlockIds: selectedBlockIdsProp,
  onActivityChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onResponse,
  className,
  onPersistSlide,
  onResizeInteractionEnd,
  onResizeMove,
  variant: variantProp,
  viewerFill = false,
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId: viewerClassIdProp,
}: SlideRendererProps) {
  const [selectedIdState, setSelectedIdState] = useState<string | null>(null);
  const selectedId = selectedBlockIdProp !== undefined ? selectedBlockIdProp : selectedIdState;

  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [resizingCoords, setResizingCoords] = useState<Record<string, { x: number; y: number; ancho: number; alto: number }>>({});
  const internalCanvasRef = useRef<HTMLDivElement | null>(null);
  const measureCanvasRef = canvasRefProp ?? internalCanvasRef;

  const params = useParams();
  const classId = params.id as string;
  const viewerClassIdResolved = viewerClassIdProp ?? classId;
  const updateSlide = useUpdateSlide(classId);

  const bgStyle = buildBackgroundStyle(slide.fondo);
  const variant =
    variantProp ?? getSlideVariant(slideBackgroundString(slide.fondo));
  const editorMode = modo === 'editor';

  const handleResize = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    const snapped = onResizeMove ? onResizeMove(blockId, coords) : coords;
    setResizingCoords((prev) => ({ ...prev, [blockId]: snapped }));
  }, [onResizeMove]);

  const handleResizeEnd = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    // Apply snap to the final commit coords so the saved position matches the guide.
    const finalCoords = onResizeMove ? onResizeMove(blockId, coords) : coords;

    setResizingCoords((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });

    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const blocks = slide.bloques ? [...slide.bloques] : [];
    const nextBlocks = updateBlockAtPath(blocks, blockId, (b) => {
      const nextBase: Block = {
        ...b,
        x: finalCoords.x,
        y: finalCoords.y,
        ancho: finalCoords.ancho,
        alto: finalCoords.alto,
      } as Block;
      if (b.tipo === 'imagen') {
        return { ...nextBase, ajuste: 'llenar' } as Block;
      }
      return nextBase;
    });

    const updatedContent = mergeRendererSlideState(slide, { bloques: nextBlocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;

    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
    onResizeInteractionEnd?.();
  }, [slide, updateSlide, onPersistSlide, onResizeInteractionEnd, onResizeMove]);

  // ─── Inline text editing ──────────────────────────────────────────────────

  function handleEditStart(blockId: string) {
    if (!editorMode || editingId === blockId) return;
    setEditingId(blockId);
    setSelectedIdState(blockId);
    onBlockSelect?.(blockId);
  }

  const handleEditCommit = useCallback((blockId: string, newText: string) => {
    setEditingId(null);
    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const blocks = slide.bloques ? [...slide.bloques] : [];
    const blockIndex = parseInt(blockId, 10);
    const block = blocks[blockIndex];
    if (!block || block.tipo !== 'texto' || block.contenido === newText) return;
    blocks[blockIndex] = { ...block, contenido: newText } as Block;
    const updatedContent = mergeRendererSlideState(slide, { bloques: blocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;
    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
  }, [slide, updateSlide, onPersistSlide]);

  function handleEditCancel() {
    setEditingId(null);
  }

  // ─── Block selection / canvas deselect ────────────────────────────────────

  function handleBlockClick(blockId: string, e?: React.MouseEvent) {
    if (!editorMode) return;
    setSelectedIdState(blockId);
    onBlockSelect?.(blockId, e);
  }

  function handleCanvasClick() {
    if (editorMode) {
      setSelectedIdState(null);
      setEditingId(null);
      onBlockSelect?.('');
    }
  }

  const blocks = slide.bloques ?? [];

  // ─── Preview mode: scaled-down thumbnail ──────────────────────────────────
  // Render a fixed 1280×720 virtual canvas and scale it to fit the thumbnail
  // container. This ensures fonts, images, and block positions are all
  // proportionally correct — identical to how PowerPoint / Canva do it.
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0);

  useLayoutEffect(() => {
    if (modo !== 'preview') return;
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setPreviewScale(el.clientWidth / 1280);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [modo]);

  if (modo === 'preview') {
    return (
      <div
        ref={previewContainerRef}
        className={cn('relative overflow-hidden', className)}
        style={{ aspectRatio: '16 / 9' }}
      >
        {previewScale > 0 && (
          <div
            style={{
              ...bgStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1280,
              height: 720,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            {blocks.map((block, index) => {
              const blockId = String(index);
              return (
                <BlockNode
                  key={blockId}
                  block={block}
                  blockId={blockId}
                  slideId={slide.id}
                  isSelected={false}
                  modo="preview"
                  selectedId={null}
                  onClick={() => {}}
                  onBlockClick={() => {}}
                  pathPrefix={blockId}
                  positionStyle={getBlockPositionStyle(block)}
                  canvasRef={measureCanvasRef}
                  currentCoords={{ x: 0, y: 0, ancho: 0, alto: 0 }}
                  onResize={() => {}}
                  onResizeEnd={() => {}}
                  editingId={null}
                  variant={variant}
                  blockIndex={index}
                  liveSocket={liveSocket}
                  torneoSocket={torneoSocket}
                  viewerStudentId={viewerStudentId}
                  viewerStudentName={viewerStudentName}
                  viewerClassId={viewerClassIdResolved}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Editor / viewer mode ─────────────────────────────────────────────────
  return (
    <div
      className={cn(editorMode ? 'overflow-visible' : 'overflow-hidden', className)}
      style={{
        ...bgStyle,
        ...(editorMode
          ? {
              width: '100%',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'visible',
            }
          : viewerFill
            ? {
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }
            : {
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
              }),
      }}
      onClick={handleCanvasClick}
      ref={canvasRefProp ? undefined : internalCanvasRef}
    >
      {/* key={slide.id} forces full remount of blocks on slide change → re-triggers entry animation */}
      {blocks.map((block, index) => {
        const blockId = String(index);
        const posStyleObj = getBlockPositionStyle(block);
        const currentCoords = resizingCoords[blockId] ?? getBlockRawCoords(block);

        const posStyle = resizingCoords[blockId] ? {
          position: 'absolute' as const,
          left: `${currentCoords.x}%`,
          top: `${currentCoords.y}%`,
          width: `${currentCoords.ancho}%`,
          height: `${currentCoords.alto}%`,
          zIndex: (block as { zIndex?: number }).zIndex ?? 1,
        } : posStyleObj;

        const isBlockSelected = editorMode && (
          selectedBlockIdsProp && selectedBlockIdsProp.length > 0
            ? selectedBlockIdsProp.includes(blockId)
            : selectedId === blockId
        );

        return (
          <BlockNode
            key={`${slide.id}-${blockId}`}
            block={block}
            blockId={blockId}
            slideId={slide.id}
            isSelected={isBlockSelected}
            modo={modo}
            selectedId={selectedId}
            selectedBlockIds={selectedBlockIdsProp}
            onClick={(e) => handleBlockClick(blockId, e)}
            onBlockClick={(id, e) => handleBlockClick(id, e)}
            pathPrefix={blockId}
            positionStyle={posStyle}
            onActivityChange={onActivityChange}
            onRemoveBlock={editorMode ? onRemoveBlock : undefined}
            onDuplicateBlock={editorMode ? onDuplicateBlock : undefined}
            onCopyBlock={editorMode ? onCopyBlock : undefined}
            onResponse={onResponse}
            canvasRef={measureCanvasRef}
            currentCoords={currentCoords}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            editingId={editingId}
            onEditStart={editorMode ? handleEditStart : undefined}
            onEditCommit={editorMode ? handleEditCommit : undefined}
            onEditCancel={editorMode ? handleEditCancel : undefined}
            isResizing={Boolean(resizingCoords[blockId])}
            variant={variant}
            blockIndex={index}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassIdResolved}
          />
        );
      })}

      {blocks.length === 0 && editorMode && (
        <div className="flex h-full items-center justify-center text-sm text-neutral-400 select-none pointer-events-none">
          Sin bloques — agrega contenido desde el panel lateral
        </div>
      )}
    </div>
  );
}
