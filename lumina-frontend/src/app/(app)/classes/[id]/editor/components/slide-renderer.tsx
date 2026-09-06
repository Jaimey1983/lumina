'use client';

import {
  createElement,
  CSSProperties,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Copy, Pencil, Lock, LockOpen, Ungroup } from 'lucide-react';
import { useParams } from 'next/navigation';


import { useUpdateSlide } from '@/hooks/api/use-classes';
import {
  isUnimplementedInteractiveStub,
  mergeRendererSlideState,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { ResizeHandles } from './resize-handles';
import { RenderClipGroup } from './render-clip-group';
import { getBlockResizeMinDim } from '../lib/block-resize-min-dim';
import { useBlockAnimations } from '@/hooks/use-block-animations';
import { withRect, withRotation, isBlockCanvasLocked, isBlockCanvasPositionable, getBlockPos, blockPosToStyle } from '@/hooks/use-block-drag';

import type {
  Activity,
  ActivityBlock,
  AudioBlock,
  Background,
  Block,
  CodeBlock,
  ColumnsBlock,
  ClipGroupBlock,
  DividerBlock,
  FlipCardsWidget,
  ImageBlock,
  QuoteBlock,
  Slide,
  TabsWidget,
  CarouselWidget,
  ClickRevealWidget,
  PopupWidget,
  TimelineWidget,
  DiagramaBlock,
  HotspotWidget,
  TooltipWidget,
  TextBlock,
  VideoBlock,
} from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { cn } from '@/lib/utils';
import { hasMediaSrc } from '@/lib/media-url';
import { FONT_CORE_FAMILIES, collectFontFamiliesFromValue, resolveFontFamily } from '@/lib/font-catalog';
import { typographyFromTextBlock, typographyToCss } from '@/lib/typography';
import { ensureGoogleFonts } from '@/components/editor/google-fonts-loader';
import { getSlideVariant } from '@/lib/slide-variant';
import {
  backgroundColorSample,
  backgroundToCssStyle,
} from '@/lib/slide-background';
import { BackgroundImageLayer } from './background-image-layer';

import { ShortAnswerActivityEditor, ShortAnswerViewer } from './activities/short-answer';
import { FillBlanksActivityEditor, FillBlanksViewer } from './activities/fill-blanks';
import { EmparejarEditor } from '@/components/activities/emparejar/emparejar-editor';
import { EmparejarViewer } from '@/components/activities/emparejar/emparejar-viewer';
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
import {
  EscapeRoomViewer,
  bloquesVisiblesDeSala,
} from '@/components/viewers/escape-room-viewer';
import type { FlipCardsInnerSelection } from '@/components/widgets/flip-cards/flip-cards-config';
import { FlipCardsEditor } from '@/components/widgets/flip-cards/flip-cards-editor';
import { FlipCardsViewer } from '@/components/widgets/flip-cards/flip-cards-viewer';
import type { TabsInnerSelection } from '@/components/widgets/tabs/tabs-config';
import { TabsEditor } from '@/components/widgets/tabs/tabs-editor';
import { TabsViewer } from '@/components/widgets/tabs/tabs-viewer';
import type { CarouselInnerSelection } from '@/components/widgets/carousel/carousel-config';
import { CarouselEditor } from '@/components/widgets/carousel/carousel-editor';
import { CarouselViewer } from '@/components/widgets/carousel/carousel-viewer';
import type { ClickRevealInnerSelection, PopupInnerSelection, HotspotInnerSelection } from '@/types/widget.types';
import { ClickRevealEditor } from '@/components/widgets/click-reveal/click-reveal-editor';
import { ClickRevealViewer } from '@/components/widgets/click-reveal/click-reveal-viewer';
import { PopupEditor } from '@/components/widgets/popup/popup-editor';
import { PopupViewer } from '@/components/widgets/popup/popup-viewer';
import { HotspotEditor } from '@/components/widgets/hotspot/hotspot-editor';
import { HotspotViewer } from '@/components/widgets/hotspot/hotspot-viewer';
import { TooltipEditor } from '@/components/widgets/tooltip/tooltip-editor';
import { TooltipViewer } from '@/components/widgets/tooltip/tooltip-viewer';
import { BotonEditor } from '@/components/widgets/boton/boton-editor';
import { BotonViewer } from '@/components/widgets/boton/boton-viewer';
import { ContadorEditor } from '@/components/widgets/contador/contador-editor';
import { ContadorViewer } from '@/components/widgets/contador/contador-viewer';
import { ProgresoEditor } from '@/components/widgets/progreso/progreso-editor';
import { ProgresoViewer } from '@/components/widgets/progreso/progreso-viewer';
import {
  isEditingPopupOverlay,
  mergedPopupConfig,
} from '@/components/widgets/popup/popup-config';
import { syncPopupBlockSizeFromTriggerPx } from '@/lib/popup-defaults';
import { clampPopupTriggerPx, POPUP_TRIGGER_PX_MAX, POPUP_TRIGGER_PX_MIN } from '@/lib/popup-trigger-size';
import { SlideCanvasRootContext } from '@/components/widgets/shared/slide-canvas-root-context';
import { isWidgetTipo } from '@/components/widgets/shared/widget-registry';
import type { TimelineInnerSelection } from '@/components/widgets/timeline/timeline-config';
import { TimelineEditor } from '@/components/widgets/timeline/timeline-editor';
import { TimelineViewer } from '@/components/widgets/timeline/timeline-viewer';
import { ClasificarEditor } from '@/components/activities/clasificar/clasificar-editor';
import { ClasificarViewer } from '@/components/activities/clasificar/clasificar-viewer';
import { MemoriaEditor } from '@/components/activities/memoria/memoria-editor';
import { MemoriaViewer } from '@/components/activities/memoria/memoria-viewer';
import { PuzzleImagenEditor } from '@/components/activities/puzzle-imagen/puzzle-imagen-editor';
import { PuzzleImagenViewer } from '@/components/activities/puzzle-imagen/puzzle-imagen-viewer';
import { AbrirCajaEditor } from '@/components/activities/abrir-caja/abrir-caja-editor';
import { AbrirCajaViewer } from '@/components/activities/abrir-caja/abrir-caja-viewer';
import { AnagramaEditor } from '@/components/activities/anagrama/anagrama-editor';
import { AnagramaViewer } from '@/components/activities/anagrama/anagrama-viewer';
import { AhorcadoEditor } from '@/components/activities/ahorcado/ahorcado-editor';
import { AhorcadoViewer } from '@/components/activities/ahorcado/ahorcado-viewer';
import { PuzzlePalabrasEditor } from '@/components/activities/puzzle-palabras/puzzle-palabras-editor';
import { PuzzlePalabrasViewer } from '@/components/activities/puzzle-palabras/puzzle-palabras-viewer';
import { SopaLetrasEditor } from '@/components/activities/sopa-letras/sopa-letras-editor';
import { SopaLetrasViewer } from '@/components/activities/sopa-letras/sopa-letras-viewer';
import { CrucigramaEditor } from '@/components/activities/crucigrama/crucigrama-editor';
import { CrucigramaViewer } from '@/components/activities/crucigrama/crucigrama-viewer';
import type {
  ClasificarActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  SopaLetrasActivity,
  CrucigramaActivity,
  AbrirCajaActivity,
  AnagramaActivity,
  AhorcadoActivity,
  PuzzlePalabrasActivity,
  MatchPairs,
  GlobosActivity,
  TopoActivity,
} from '@/types/slide.types';

import { GlobosEditor } from '@/components/activities/globos/globos-editor';
import { GlobosViewer } from '@/components/activities/globos/globos-viewer';
import { TopoEditor } from '@/components/activities/topo/topo-editor';
import { TopoViewer } from '@/components/activities/topo/topo-viewer';
import { RuletaEditor } from '@/components/widgets/ruleta/ruleta-editor';
import { RuletaViewer } from '@/components/widgets/ruleta/ruleta-viewer';
import { normalizeRuletaBlock } from '@/components/widgets/ruleta/ruleta-defaults';
import { GraficoEditor } from '@/components/graficos/grafico-editor';
import { GraficoViewer } from '@/components/graficos/grafico-viewer';
import { DiagramaEditor } from '@/components/diagramas/diagrama-editor';
import { DiagramaViewer } from '@/components/diagramas/diagrama-viewer';
import { HistoriaRamificadaEditor } from '@/components/activities/historia-ramificada/historia-ramificada-editor';
import { HistoriaRamificadaViewer } from '@/components/activities/historia-ramificada/historia-ramificada-viewer';

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
  clasificar: 'Actividad · Clasificar',
  globos: 'Actividad · Globos',
  topo: 'Actividad · Topo',
  ruleta: 'Actividad · Ruleta',
  memoria: 'Actividad · Memoria',
  puzzle_imagen: 'Actividad · Puzzle de imagen',
  sopa_letras: 'Actividad · Sopa de letras',
  crucigrama: 'Actividad · Crucigrama',
  anagrama: 'Actividad · Anagrama',
  ahorcado: 'Actividad · Ahorcado',
  puzzle_palabras: 'Actividad · Puzzle de palabras',
  abrir_caja: 'Actividad · Abrir caja',
  historia_ramificada: 'Actividad · Historia ramificada',
};

// ─── Background → CSS (see `@/lib/slide-background`) ─────────────────────────

// ─── Canvas positioning ───────────────────────────────────────────────────────

function getBlockPositionStyle(block: Block): CSSProperties {
  return blockPosToStyle(block);
}

function getBlockRawCoords(block: Block): { x: number; y: number; ancho: number; alto: number } {
  return getBlockPos(block);
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
    : 'Haga clic para editar · Shift+Enter para confirmar';
}

/** Estilos opcionales del JSON de texto: solo se añaden si el campo viene definido. */
function textBlockOptionalVisualStyle(block: TextBlock): CSSProperties {
  const out: CSSProperties = {
    ...typographyToCss(typographyFromTextBlock(block)),
  };
  if (block.fuente !== undefined && block.fuente !== '') {
    out.fontFamily = resolveFontFamily(block.fuente);
  }
  if (block.subrayado === true) {
    out.textDecoration = 'underline';
  }
  if (block.interlineado !== undefined) {
    out.lineHeight = block.interlineado;
  }
  if (block.espaciadoLetras !== undefined) {
    out.letterSpacing = `${block.espaciadoLetras}px`;
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
          if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); commit(); }
          else if (e.key === 'Escape')         { e.preventDefault(); discard(); }
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

  const isList = block.lista === 'vinetas' || block.lista === 'numeros';
  const style: CSSProperties = {
    margin: 0,
    whiteSpace: isList ? 'normal' : 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    fontSize: block.tamanoFuente,
    fontWeight: block.negrita ? 'bold' : undefined,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color,
    ...textBlockOptionalVisualStyle(block),
    ...(isList
      ? {
          paddingLeft: '1.2em',
          listStyleType: block.lista === 'numeros' ? 'decimal' : 'disc',
        }
      : {}),
  };
  const tag = isList
    ? block.lista === 'numeros'
      ? 'ol'
      : 'ul'
    : block.nivel
      ? `h${block.nivel}`
      : 'p';
  const children = isList
    ? (block.contenido ?? '').split('\n').map((line, i) =>
        createElement('li', { key: i }, line === '' ? '\u00a0' : line),
      )
    : block.contenido;
  return createElement(tag, { style }, children);
}

function RenderImage({ block, forceFill }: { block: ImageBlock; forceFill?: boolean }) {
  const fitMap: Record<string, CSSProperties['objectFit']> = {
    cubrir: 'cover',
    contener: 'contain',
    llenar: 'fill',
  };

  if (!hasMediaSrc(block.url)) {
    return (
      <figure
        style={{
          margin: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e2e8f0',
          color: '#64748b',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '0.5rem',
        }}
      >
        Sin imagen
      </figure>
    );
  }

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

function RenderVideo({
  block,
  isThumbnail = false,
  editorMode = false,
}: {
  block: VideoBlock;
  isThumbnail?: boolean;
  /** En el editor, el `<iframe>`/`<video>` no debe capturar el pointer: si no,
   *  el bloque nunca se selecciona (ni aparece la barra flotante) ni se arrastra. */
  editorMode?: boolean;
}) {
  const isYoutube = block.url.includes('youtube') || block.url.includes('youtu.be');

  if (isThumbnail) {
    if (isYoutube) {
      const ytMatch = block.url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      );
      const videoId = ytMatch?.[1];
      if (videoId) {
        return (
          <img
            src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        );
      }
    }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          width="28%"
          height="28%"
          fill="white"
          opacity={0.85}
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }

  if (isYoutube) {
    const src = buildEmbedUrl(block.url, block.autoplay);
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <iframe
          src={src}
          title="Video YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: editorMode ? 'none' : undefined,
          }}
        />
        {editorMode && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, cursor: 'inherit' }} />
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        src={block.url}
        controls={block.controles ?? true}
        autoPlay={block.autoplay}
        loop={block.bucle}
        muted={block.silenciado}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: editorMode ? 'none' : undefined,
        }}
      />
      {editorMode && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, cursor: 'inherit' }} />
      )}
    </div>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <hr
        style={{
          border: 'none',
          borderTop: `${block.grosor ?? 2}px ${styleMap[block.estilo ?? 'solido'] ?? 'solid'} ${block.color ?? '#64748b'}`,
          margin: 0,
          width: '100%',
        }}
      />
    </div>
  );
}

/** Mismo fondo que aplica `EscapeRoomSalaCanvas` cuando el autor no elige uno. */
const ESCAPE_ROOM_SALA_FONDO_DEFAULT = { tipo: 'color', valor: '#1e1b4b' } as const;

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
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
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

  // TODO(migración-etapa-5): este `switch` por `act.tipo` es el "segundo registro"
  // de actividades. E2.5 ya publicó estas 10 como `ElementDefinition` en
  // `@lumina/element-kit` (quiz_multiple, verdadero_falso, completar_blancos,
  // arrastrar_soltar, emparejar, ordenar_pasos, video_interactivo, short_answer,
  // encuesta_viva, nube_palabras). E5 debe reemplazar todo este bloque por un
  // dispatch desde `elementRegistry` y borrarlo. Ticket: LUM-E5-CLASICAS ·
  // fecha objetivo: 2026-11-30.
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
    return (
      <QuizMultipleViewer
        activity={act}
        editorSyncKey={syncKey}
        onResponse={onResponse}
        variant={variant}
        liveSocket={torneoSocket ?? liveSocket}
        quizBlockId={blockId}
        classId={viewerClassId}
        studentId={viewerStudentId}
        studentName={viewerStudentName}
      />
    );
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
    const emparejarAct = act as MatchPairs;
    if (modo === 'editor') {
      return (
        <EmparejarEditor
          actividad={emparejarAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <EmparejarViewer
        actividad={emparejarAct}
        editorSyncKey={syncKey}
        onResponse={onResponse}
        variant={variant}
      />
    );
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
        slideId={slideId}
        editorSyncKey={syncKey}
        liveSocket={liveSocket}
        onComplete={(puntos, timeMs) =>
          // Canal propio de cierre: estos puntos son gamificación narrativa, no
          // una nota 0–5, así que nunca deben alimentar `activity:complete`.
          onResponse?.({ tipo: 'escape_room:finished', puntos, timeMs })
        }
        onAnswer={(roomId, answer, correct, intento) =>
          onResponse?.({ roomId, answer, correct, intento })
        }
        renderSalaCanvas={(sala) => (
          <SlideRenderer
            slide={{
              id: `${slideId}-sala-${sala.id}`,
              order: 0,
              type: 'CONTENT',
              title: sala.nombre,
              bloques: bloquesVisiblesDeSala(sala),
              fondo: sala.fondo ?? ESCAPE_ROOM_SALA_FONDO_DEFAULT,
              content: null,
            }}
            modo="viewer"
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
            liveSocket={liveSocket}
            className="h-full w-full"
          />
        )}
      />
    );
  }

  if (act.tipo === 'historia_ramificada') {
    if (modo === 'editor') {
      return (
        <HistoriaRamificadaEditor
          actividad={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return (
      <HistoriaRamificadaViewer
        actividad={act}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'clasificar') {
    const clasificarAct = act as ClasificarActivity;
    if (modo === 'editor') {
      return (
        <ClasificarEditor
          actividad={clasificarAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <ClasificarViewer
        actividad={clasificarAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'memoria') {
    const memoriaAct = act as MemoriaActivity;
    if (modo === 'editor') {
      return (
        <MemoriaEditor
          actividad={memoriaAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <MemoriaViewer
        actividad={memoriaAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'puzzle_imagen') {
    const puzzleAct = act as PuzzleImagenActivity;
    if (modo === 'editor') {
      return (
        <PuzzleImagenEditor
          actividad={puzzleAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <PuzzleImagenViewer
        actividad={puzzleAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'sopa_letras') {
    const sopaAct = act as SopaLetrasActivity;
    if (modo === 'editor') {
      return (
        <SopaLetrasEditor
          actividad={sopaAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <SopaLetrasViewer
        actividad={sopaAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'crucigrama') {
    const crucigramaAct = act as CrucigramaActivity;
    if (modo === 'editor') {
      return (
        <CrucigramaEditor
          actividad={crucigramaAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <CrucigramaViewer
        actividad={crucigramaAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'abrir_caja') {
    const abrirCajaAct = act as AbrirCajaActivity;
    if (modo === 'editor') {
      return (
        <AbrirCajaEditor
          actividad={abrirCajaAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <AbrirCajaViewer
        actividad={abrirCajaAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'anagrama') {
    const anagramaAct = act as AnagramaActivity;
    if (modo === 'editor') {
      return (
        <AnagramaEditor
          actividad={anagramaAct}
        />
      );
    }
    return (
      <AnagramaViewer
        actividad={anagramaAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'ahorcado') {
    const ahorcadoAct = act as AhorcadoActivity;
    if (modo === 'editor') {
      return (
        <AhorcadoEditor
          actividad={ahorcadoAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <AhorcadoViewer
        actividad={ahorcadoAct}
        editorSyncKey={syncKey}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'puzzle_palabras') {
    const puzzlePalabrasAct = act as PuzzlePalabrasActivity;
    if (modo === 'editor') {
      return (
        <PuzzlePalabrasEditor
          actividad={puzzlePalabrasAct}
        />
      );
    }
    return (
      <PuzzlePalabrasViewer
        actividad={puzzlePalabrasAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'globos') {
    const globosAct = act as GlobosActivity;
    if (modo === 'editor') {
      return (
        <GlobosEditor
          actividad={globosAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <GlobosViewer
        actividad={globosAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'topo') {
    const topoAct = act as TopoActivity;
    if (modo === 'editor') {
      return (
        <TopoEditor
          actividad={topoAct}
          isSelected={isSelected}
        />
      );
    }
    return (
      <TopoViewer
        actividad={topoAct}
        onComplete={onResponse}
      />
    );
  }

  if (act.tipo === 'ruleta') {
    const widget = normalizeRuletaBlock(block);
    if (modo === 'editor') {
      return <RuletaEditor block={widget} />;
    }
    return <RuletaViewer block={widget} />;
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
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  onFlipCardsInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  tabsInnerSelection?: TabsInnerSelection | null;
  onTabsInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  carouselInnerSelection?: CarouselInnerSelection | null;
  onCarouselInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  onClickRevealInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  popupInnerSelection?: PopupInnerSelection | null;
  onPopupInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  onHotspotInnerSelectionChange?: (selection: HotspotInnerSelection | null) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  timelineInnerSelection?: TimelineInnerSelection | null;
  onTimelineInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
  onDiagramaChange?: (blockId: string, block: DiagramaBlock) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onToggleCanvasLock?: (blockId: string) => void;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
  liveSocket?: Socket | null;
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
  isThumbnail?: boolean;
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
  onFlipCardsChange,
  flipCardsInnerSelection,
  onFlipCardsInnerSelectionChange,
  onTabsChange,
  tabsInnerSelection,
  onTabsInnerSelectionChange,
  onCarouselChange,
  carouselInnerSelection,
  onCarouselInnerSelectionChange,
  onClickRevealChange,
  clickRevealInnerSelection,
  onClickRevealInnerSelectionChange,
  onPopupChange,
  popupInnerSelection,
  onPopupInnerSelectionChange,
  onHotspotChange,
  hotspotInnerSelection,
  onHotspotInnerSelectionChange,
  onTimelineChange,
  timelineInnerSelection,
  onTimelineInnerSelectionChange,
  onDiagramaChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onToggleCanvasLock,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
  isThumbnail,
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
                onFlipCardsChange={onFlipCardsChange}
                flipCardsInnerSelection={flipCardsInnerSelection}
                onFlipCardsInnerSelectionChange={onFlipCardsInnerSelectionChange}
                onTabsChange={onTabsChange}
                tabsInnerSelection={tabsInnerSelection}
                onTabsInnerSelectionChange={onTabsInnerSelectionChange}
                onCarouselChange={onCarouselChange}
                carouselInnerSelection={carouselInnerSelection}
                onCarouselInnerSelectionChange={onCarouselInnerSelectionChange}
                onClickRevealChange={onClickRevealChange}
                clickRevealInnerSelection={clickRevealInnerSelection}
                onClickRevealInnerSelectionChange={onClickRevealInnerSelectionChange}
                onPopupChange={onPopupChange}
                popupInnerSelection={popupInnerSelection}
                onPopupInnerSelectionChange={onPopupInnerSelectionChange}
                onHotspotChange={onHotspotChange}
                hotspotInnerSelection={hotspotInnerSelection}
                onHotspotInnerSelectionChange={onHotspotInnerSelectionChange}
                onTimelineChange={onTimelineChange}
                timelineInnerSelection={timelineInnerSelection}
                onTimelineInnerSelectionChange={onTimelineInnerSelectionChange}
                onDiagramaChange={onDiagramaChange}
                onRemoveBlock={onRemoveBlock}
                onDuplicateBlock={onDuplicateBlock}
                onCopyBlock={onCopyBlock}
                onToggleCanvasLock={onToggleCanvasLock}
                onResponse={onResponse}
                variant={variant}
                liveSocket={liveSocket}
                torneoSocket={torneoSocket}
                viewerStudentId={viewerStudentId}
                viewerStudentName={viewerStudentName}
                viewerClassId={viewerClassId}
                isThumbnail={isThumbnail}
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
      setStyle((prev) => (prev === null ? prev : null));
      return;
    }
    const rect = el.getBoundingClientRect();
    const top = rect.top - BLOCK_TOOLBAR_GAP_PX;
    const left = rect.left + rect.width / 2;
    setStyle((prev) => {
      if (
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.position === 'fixed'
      ) {
        return prev;
      }
      return {
        position: 'fixed',
        top,
        left,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
      };
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
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  onFlipCardsInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  tabsInnerSelection?: TabsInnerSelection | null;
  onTabsInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  carouselInnerSelection?: CarouselInnerSelection | null;
  onCarouselInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  onClickRevealInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  popupInnerSelection?: PopupInnerSelection | null;
  onPopupInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  onHotspotInnerSelectionChange?: (selection: HotspotInnerSelection | null) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  timelineInnerSelection?: TimelineInnerSelection | null;
  onTimelineInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
  onDiagramaChange?: (blockId: string, block: DiagramaBlock) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onToggleCanvasLock?: (blockId: string) => void;
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
  /** Miniatura del panel lateral: render simplificado de widgets e imágenes. */
  isThumbnail?: boolean;
  /** Bloque clip-group en modo edición interna (pan/escala de imagen). */
  clipGroupInnerEditId?: string | null;
  onClipGroupInnerEditChange?: (blockId: string | null) => void;
  onClipGroupChange?: (blockId: string, block: ClipGroupBlock) => void;
  onUngroupClipGroup?: (blockId: string) => void;
  isLiveDragging?: boolean;
  rotacion?: number;
  onRotate?: (blockId: string, angle: number) => void;
  onRotateEnd?: (blockId: string, angle: number) => void;
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
  onFlipCardsChange,
  flipCardsInnerSelection,
  onFlipCardsInnerSelectionChange,
  onTabsChange,
  tabsInnerSelection,
  onTabsInnerSelectionChange,
  onCarouselChange,
  carouselInnerSelection,
  onCarouselInnerSelectionChange,
  onClickRevealChange,
  clickRevealInnerSelection,
  onClickRevealInnerSelectionChange,
  onPopupChange,
  popupInnerSelection,
  onPopupInnerSelectionChange,
  onHotspotChange,
  hotspotInnerSelection,
  onHotspotInnerSelectionChange,
  onTimelineChange,
  timelineInnerSelection,
  onTimelineInnerSelectionChange,
  onDiagramaChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onToggleCanvasLock,
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
  isThumbnail = false,
  clipGroupInnerEditId = null,
  onClipGroupInnerEditChange,
  onClipGroupChange,
  onUngroupClipGroup,
  isLiveDragging = false,
  rotacion,
  onRotate,
  onRotateEnd,
}: BlockNodeProps) {
  const isViewerMode = modo === 'viewer' || modo === 'preview';
  const activityBlockForRender: ActivityBlock | null =
    block.tipo === 'actividad' ? (blockForActivityRender(block) as ActivityBlock) : null;

  const editorMode = modo === 'editor';
  const isFormBlock = block.tipo === 'actividad' && editorMode;
  // Normalize 'preview' to 'viewer' for activity renderers
  const activityModo: 'editor' | 'viewer' = editorMode ? 'editor' : 'viewer';

  const isTextEditing = editorMode && block.tipo === 'texto' && editingId === blockId;
  const isWidgetBlock = editorMode && isWidgetTipo(block.tipo);
  const isInteractiveStub = isUnimplementedInteractiveStub(block);
  const canvasLocked = isBlockCanvasLocked(block);
  const canvasPositionable = isBlockCanvasPositionable(block);
  const isBlockButtonShell =
    editorMode && !isFormBlock && !isTextEditing && !isWidgetBlock && !isInteractiveStub;
  const blockRef = useRef<HTMLDivElement>(null);
  const showActionToolbar =
    editorMode &&
    isSelected &&
    !isFormBlock &&
    !isTextEditing &&
    (!!onRemoveBlock ||
      !!onDuplicateBlock ||
      !!onCopyBlock ||
      !!onToggleCanvasLock ||
      !!onUngroupClipGroup ||
      block.tipo === 'popup');

  const popupOverlayEditing =
    block.tipo === 'popup' &&
    isSelected &&
    isEditingPopupOverlay(popupInnerSelection ?? null);

  const clipInnerEdit =
    block.tipo === 'clip-group' && clipGroupInnerEditId === blockId;

  useBlockAnimations(blockRef, block.animaciones, isViewerMode);

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
      case 'video':     return <RenderVideo block={block} isThumbnail={isThumbnail} editorMode={editorMode} />;
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
            onFlipCardsChange={onFlipCardsChange}
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
      // TODO(migración-etapa-5): retirar el dispatch legacy de clip-group en slide-renderer.tsx
      // al conectar ElementRegistry. El bloque está en `@lumina/element-kit`
      // (`clipGroupDefinition`, E4.3) y el editor de nodos Paper.js en
      // `elements/clip-group/paper-editor` (`PaperNodeEditor`, E4.4) — E5 monta
      // ese sub-panel sin envolver `RenderClipGroup`.
      // RIESGO ACEPTADO (E4.5 §2): la paridad del kit para `clip-group` es
      // render-smoke — jsdom no rinde el `<canvas>` de Paper.js. E5 NO borra este
      // case sin cobertura de integración real (Playwright CT o similar) que
      // compare la salida visible legacy vs kit del editor de nodos.
      // Ticket LUM-E5-CANVAS-BLOCKS, fecha 2026-12-31.
      case 'clip-group':
        return (
          <RenderClipGroup
            block={block}
            editorMode={editorMode}
            isSelected={isSelected}
            innerEdit={clipInnerEdit}
            renderComposicion={(bloques) => (
              <SlideRenderer
                slide={{
                  id: `${slideId}-clip-${blockId}`,
                  order: 0,
                  type: 'CONTENT',
                  title: '',
                  bloques,
                  content: null,
                }}
                modo="viewer"
                viewerFill
                variant={variant}
                liveSocket={liveSocket}
                torneoSocket={torneoSocket}
                viewerStudentId={viewerStudentId}
                viewerStudentName={viewerStudentName}
                viewerClassId={viewerClassId}
                isThumbnail={isThumbnail}
                className="h-full w-full"
              />
            )}
            onEnterInnerEdit={
              editorMode &&
              (block.contenido.tipo === 'imagen' ||
                (block.contenido.tipo === 'composicion' &&
                  block.contenido.fill?.tipo === 'imagen'))
                ? () => onClipGroupInnerEditChange?.(blockId)
                : undefined
            }
            onContentCommit={
              onClipGroupChange && block.contenido.tipo === 'imagen'
                ? (patch) => {
                    const c = block.contenido;
                    if (c.tipo !== 'imagen') return;
                    onClipGroupChange(blockId, {
                      ...block,
                      contenido: { ...c, ...patch },
                    });
                  }
                : undefined
            }
            onFillCommit={
              onClipGroupChange &&
              block.contenido.tipo === 'composicion' &&
              block.contenido.fill?.tipo === 'imagen'
                ? (patch) => {
                    const c = block.contenido;
                    if (c.tipo !== 'composicion' || c.fill?.tipo !== 'imagen') {
                      return;
                    }
                    onClipGroupChange(blockId, {
                      ...block,
                      contenido: { ...c, fill: { ...c.fill, ...patch } },
                    });
                  }
                : undefined
            }
            onShapeCommit={
              onClipGroupChange
                ? (clipShape) => {
                    onClipGroupChange(blockId, {
                      ...block,
                      clipShape,
                    });
                  }
                : undefined
            }
          />
        );
      case 'flip-cards':
        return editorMode ? (
          <FlipCardsEditor
            block={block}
            onChange={(updated) => onFlipCardsChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? flipCardsInnerSelection ?? null : null
            }
            onInnerSelectionChange={onFlipCardsInnerSelectionChange}
          />
        ) : (
          <FlipCardsViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'tabs':
        return editorMode ? (
          <TabsEditor
            block={block}
            onChange={(updated) => onTabsChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? tabsInnerSelection ?? null : null
            }
            onInnerSelectionChange={onTabsInnerSelectionChange}
          />
        ) : (
          <TabsViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'carousel':
        return editorMode ? (
          <CarouselEditor
            block={block}
            onChange={(updated) => onCarouselChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? carouselInnerSelection ?? null : null
            }
            onInnerSelectionChange={onCarouselInnerSelectionChange}
          />
        ) : (
          <CarouselViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'click-reveal':
        return editorMode ? (
          <ClickRevealEditor
            block={block}
            onChange={(updated) => onClickRevealChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? clickRevealInnerSelection ?? null : null
            }
            onInnerSelectionChange={onClickRevealInnerSelectionChange}
          />
        ) : (
          <ClickRevealViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'popup':
        return editorMode ? (
          <PopupEditor
            block={block}
            onChange={(updated) => onPopupChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? popupInnerSelection ?? null : null
            }
            onInnerSelectionChange={onPopupInnerSelectionChange}
          />
        ) : (
          <PopupViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'hotspot':
        return editorMode ? (
          <HotspotEditor
            block={block}
            onChange={(updated) => onHotspotChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? hotspotInnerSelection ?? null : null
            }
            onInnerSelectionChange={onHotspotInnerSelectionChange}
          />
        ) : (
          <HotspotViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'tooltip':
        return editorMode ? (
          <TooltipEditor
            block={block}
            onEnsureBlockSelected={() => onClick()}
            isSelected={selectedId === blockId}
          />
        ) : (
          <TooltipViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'boton':
        return editorMode ? (
          <BotonEditor
            block={block}
            onEnsureBlockSelected={() => onClick()}
          />
        ) : (
          <BotonViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'contador':
        return editorMode ? (
          <ContadorEditor
            block={block}
            onEnsureBlockSelected={() => onClick()}
          />
        ) : (
          <ContadorViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'progreso':
        return editorMode ? (
          <ProgresoEditor
            block={block}
            onEnsureBlockSelected={() => onClick()}
          />
        ) : (
          <ProgresoViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'ruleta':
        return editorMode ? (
          <RuletaEditor
            block={block}
            onEnsureBlockSelected={() => onClick()}
          />
        ) : (
          <RuletaViewer block={block} />
        );
      // TODO(migración-etapa-5): reconectar `grafico` desde ElementRegistry
      // (`graficoDefinition` en @lumina/element-kit) y borrar este case.
      // RIESGO ACEPTADO (E4.5 §2): la paridad del kit para `grafico` es
      // render-smoke — el chart Recharts se carga con `next/dynamic` y en jsdom
      // rinde `null`. E5 NO borra este case sin cobertura de integración real
      // que compare el chart legacy vs kit.
      // Ticket: LUM-E5-CANVAS-BLOCKS · 2026-12-31.
      case 'grafico':
        return editorMode ? (
          <GraficoEditor
            block={block}
            isSelected={selectedId === blockId}
            onEnsureBlockSelected={() => onClick()}
          />
        ) : (
          <GraficoViewer block={block} isThumbnail={isThumbnail} />
        );
      // TODO(migración-etapa-5): retirar el dispatch legacy de diagrama en slide-renderer.tsx
      // al conectar ElementRegistry.
      // RIESGO ACEPTADO (E4.5 §2): la paridad del kit para `diagrama` cubre el
      // Venn (SVG real) pero el grafo usa `GraphCanvas` vía `next/dynamic` →
      // render-smoke en jsdom. E5 NO borra este case sin cobertura de
      // integración real del grafo legacy vs kit.
      // Ticket LUM-E5-CANVAS-BLOCKS, fecha 2026-12-31.
      case 'diagrama':
        return editorMode ? (
          <DiagramaEditor
            block={block}
            isSelected={selectedId === blockId}
            onEnsureBlockSelected={() => onClick()}
            onChange={(updated) => onDiagramaChange?.(blockId, updated)}
          />
        ) : (
          <DiagramaViewer block={block} isThumbnail={isThumbnail} />
        );
      case 'timeline':
        return editorMode ? (
          <TimelineEditor
            block={block}
            onChange={(updated) => onTimelineChange?.(blockId, updated)}
            onEnsureBlockSelected={() => onClick()}
            innerSelection={
              selectedId === blockId ? timelineInnerSelection ?? null : null
            }
            onInnerSelectionChange={onTimelineInnerSelectionChange}
          />
        ) : (
          <TimelineViewer widget={block} isThumbnail={isThumbnail} />
        );
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
            onFlipCardsChange={onFlipCardsChange}
            flipCardsInnerSelection={flipCardsInnerSelection}
            onFlipCardsInnerSelectionChange={onFlipCardsInnerSelectionChange}
            onTabsChange={onTabsChange}
            tabsInnerSelection={tabsInnerSelection}
            onTabsInnerSelectionChange={onTabsInnerSelectionChange}
            onCarouselChange={onCarouselChange}
            carouselInnerSelection={carouselInnerSelection}
            onCarouselInnerSelectionChange={onCarouselInnerSelectionChange}
            onClickRevealChange={onClickRevealChange}
            clickRevealInnerSelection={clickRevealInnerSelection}
            onClickRevealInnerSelectionChange={onClickRevealInnerSelectionChange}
            onPopupChange={onPopupChange}
            popupInnerSelection={popupInnerSelection}
            onPopupInnerSelectionChange={onPopupInnerSelectionChange}
            onHotspotChange={onHotspotChange}
            hotspotInnerSelection={hotspotInnerSelection}
            onHotspotInnerSelectionChange={onHotspotInnerSelectionChange}
            onTimelineChange={onTimelineChange}
            timelineInnerSelection={timelineInnerSelection}
            onTimelineInnerSelectionChange={onTimelineInnerSelectionChange}
            onDiagramaChange={onDiagramaChange}
            onRemoveBlock={onRemoveBlock}
            onResponse={onResponse}
            variant={variant}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
            isThumbnail={isThumbnail}
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
      role={isBlockButtonShell ? 'button' : undefined}
      tabIndex={isBlockButtonShell ? 0 : undefined}
      aria-pressed={editorMode && !isTextEditing ? isSelected : undefined}
      data-block-id={blockId}
      data-live-dragging={isLiveDragging ? 'true' : undefined}
      style={{
        ...positionStyle,
        ...animationStyle,
        ...(isLiveDragging ? { opacity: 1, visibility: 'visible' as const } : {}),
      }}
      onClick={
        editorMode && !isTextEditing && !isInteractiveStub
          ? (e) => { e.stopPropagation(); onClick(e); }
          : undefined
      }
      onDoubleClick={
        editorMode && block.tipo === 'texto' && !isTextEditing
          ? (e) => { e.stopPropagation(); onEditStart?.(blockId); }
          : undefined
      }
      onKeyDown={
        isBlockButtonShell
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
        isBlockButtonShell && 'cursor-pointer outline-none rounded-sm',
        isBlockButtonShell && 'hover:ring-2 hover:ring-blue-500/40',
        editorMode && isTextEditing && 'cursor-text outline-none rounded-sm',
        isFormBlock && 'min-h-0 max-w-full cursor-default',
        editorMode && isSelected && 'ring-2 ring-blue-500 ring-offset-1',
        editorMode && canvasLocked && isSelected && 'ring-amber-500/90',
        editorMode && isLiveDragging && 'z-20 opacity-100 shadow-lg ring-2 ring-[#2563EB]/50',
        isInteractiveStub && 'pointer-events-none',
        !editorMode && block.tipo !== 'hotspot' && block.tipo !== 'tooltip' && 'overflow-hidden max-w-full max-h-full',
        !editorMode && block.tipo === 'actividad' && 'min-h-0',
        !editorMode &&
          (block.tipo === 'actividad' ||
            block.tipo === 'timeline' ||
            block.tipo === 'click-reveal' ||
            block.tipo === 'popup' ||
            block.tipo === 'flip-cards' ||
            block.tipo === 'tabs' ||
            block.tipo === 'carousel' ||
            block.tipo === 'contador' ||
            block.tipo === 'ruleta' ||
            block.tipo === 'grafico' ||
            block.tipo === 'diagrama') &&
          'flex h-full min-h-0 w-full flex-col',
      )}
    >
      {renderContent()}
      {editorMode &&
        isSelected &&
        !clipInnerEdit &&
        !popupOverlayEditing &&
        !canvasLocked &&
        canvasRef &&
        currentCoords &&
        onResize &&
        onResizeEnd && (
        <ResizeHandles
          blockId={blockId}
          x={currentCoords.x}
          y={currentCoords.y}
          ancho={currentCoords.ancho}
          alto={currentCoords.alto}
          rotacion={rotacion}
          lockAspectRatio={block.tipo === 'imagen' ? !!block.lockAspectRatio : false}
          minDim={getBlockResizeMinDim(block.tipo)}
          canvasRef={canvasRef}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          onRotate={onRotate}
          onRotateEnd={onRotateEnd}
        />
      )}
    </div>
    <BlockActionToolbarPortal blockRef={blockRef} visible={showActionToolbar}>
      {block.tipo === 'popup' && onPopupInnerSelectionChange && !popupOverlayEditing ? (
        <button
          type="button"
          aria-label="Editar contenido del popup"
          title="Editar contenido del popup"
          onClick={(e) => {
            e.stopPropagation();
            onPopupInnerSelectionChange({ kind: 'overlay' });
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
      {!!onToggleCanvasLock && canvasPositionable && (
        <button
          type="button"
          aria-label={canvasLocked ? 'Desbloquear posición' : 'Fijar posición y tamaño'}
          title={canvasLocked ? 'Desbloquear posición' : 'Fijar posición y tamaño'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCanvasLock(blockId);
          }}
          className={cn(
            'flex size-7 items-center justify-center rounded-lg p-1.5',
            canvasLocked
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]',
          )}
        >
          {canvasLocked ? (
            <Lock className="size-3.5" />
          ) : (
            <LockOpen className="size-3.5" />
          )}
        </button>
      )}
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
      {!!onUngroupClipGroup &&
        block.tipo === 'clip-group' &&
        block.contenido.tipo === 'composicion' && (
          <button
            type="button"
            aria-label="Desagrupar máscara"
            title="Desagrupar máscara — devuelve los elementos al lienzo"
            onClick={(e) => {
              e.stopPropagation();
              onUngroupClipGroup(blockId);
            }}
            className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          >
            <Ungroup className="size-3.5" />
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
  /** Persiste cambios de un widget flip-cards (PATCH vía el padre). */
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  /** Selección interna del widget flip-cards (texto/imagen) para el panel contextual. */
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  onFlipCardsInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
  /** Persiste cambios de un widget tabs (PATCH vía el padre). */
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  tabsInnerSelection?: TabsInnerSelection | null;
  onTabsInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
  /** Persiste cambios de un widget carousel (PATCH vía el padre). */
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  carouselInnerSelection?: CarouselInnerSelection | null;
  onCarouselInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
  /** Persiste cambios de un widget click-reveal (PATCH vía el padre). */
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  onClickRevealInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  popupInnerSelection?: PopupInnerSelection | null;
  onPopupInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  onHotspotInnerSelectionChange?: (selection: HotspotInnerSelection | null) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  timelineInnerSelection?: TimelineInnerSelection | null;
  onTimelineInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
  onDiagramaChange?: (blockId: string, block: DiagramaBlock) => void;
  /** Elimina un bloque del slide (p. ej. actividad equivocada). */
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onToggleCanvasLock?: (blockId: string) => void;
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
  /** Miniatura del panel lateral (SlideCanvasThumb). No confundir con modo preview escalado. */
  isThumbnail?: boolean;
  /** Id de índice (`"0"`) del bloque en drag live — preview visible, sin opacity 0. */
  draggingBlockId?: string | null;
  clipGroupInnerEditId?: string | null;
  onClipGroupInnerEditChange?: (blockId: string | null) => void;
  onClipGroupChange?: (blockId: string, block: ClipGroupBlock) => void;
  /** Desagrupa un `clip-group` de composición (reemplaza el bloque por sus hijos). */
  onUngroupClipGroup?: (blockId: string) => void;
}

export function SlideRenderer({
  slide,
  modo,
  canvasRef: canvasRefProp,
  onBlockSelect,
  selectedBlockId: selectedBlockIdProp,
  selectedBlockIds: selectedBlockIdsProp,
  onActivityChange,
  onFlipCardsChange,
  flipCardsInnerSelection,
  onFlipCardsInnerSelectionChange,
  onTabsChange,
  tabsInnerSelection,
  onTabsInnerSelectionChange,
  onCarouselChange,
  carouselInnerSelection,
  onCarouselInnerSelectionChange,
  onClickRevealChange,
  clickRevealInnerSelection,
  onClickRevealInnerSelectionChange,
  onPopupChange,
  popupInnerSelection,
  onPopupInnerSelectionChange,
  onHotspotChange,
  hotspotInnerSelection,
  onHotspotInnerSelectionChange,
  onTimelineChange,
  timelineInnerSelection,
  onTimelineInnerSelectionChange,
  onDiagramaChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onToggleCanvasLock,
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
  isThumbnail = false,
  draggingBlockId = null,
  clipGroupInnerEditId = null,
  onClipGroupInnerEditChange,
  onClipGroupChange,
  onUngroupClipGroup,
}: SlideRendererProps) {
  const [selectedIdState, setSelectedIdState] = useState<string | null>(null);
  const selectedId = selectedBlockIdProp !== undefined ? selectedBlockIdProp : selectedIdState;
  const slideFonts = useMemo(
    () => [...FONT_CORE_FAMILIES, ...collectFontFamiliesFromValue(slide)],
    [slide],
  );
  useEffect(() => {
    ensureGoogleFonts(slideFonts);
  }, [slideFonts]);

  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [resizingCoords, setResizingCoords] = useState<Record<string, { x: number; y: number; ancho: number; alto: number }>>({});
  const [rotatingAngles, setRotatingAngles] = useState<Record<string, number>>({});
  const [slideCanvasRoot, setSlideCanvasRoot] = useState<HTMLElement | null>(null);
  const internalCanvasRef = useRef<HTMLDivElement | null>(null);
  const measureCanvasRef = canvasRefProp ?? internalCanvasRef;

  const bindSlideRootRef = useCallback((node: HTMLDivElement | null) => {
    setSlideCanvasRoot(node);
    if (!canvasRefProp) {
      internalCanvasRef.current = node;
    }
  }, [canvasRefProp]);

  const params = useParams();
  const classId = params.id as string;
  const viewerClassIdResolved = viewerClassIdProp ?? classId;
  const updateSlide = useUpdateSlide(classId);

  const bgStyle = backgroundToCssStyle(slide.fondo);
  const variant =
    variantProp ?? getSlideVariant(backgroundColorSample(slide.fondo));
  const editorMode = modo === 'editor';

  const handleRotate = useCallback((blockId: string, angle: number) => {
    const blocks = slide.bloques ?? [];
    const block = blocks[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) return;
    setRotatingAngles((prev) => ({ ...prev, [blockId]: angle }));
  }, [slide.bloques]);

  const handleRotateEnd = useCallback((blockId: string, angle: number) => {
    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const block = (slide.bloques ?? [])[Number(blockId)];
    setRotatingAngles((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
    if (!block || isBlockCanvasLocked(block)) return;

    const nextBlocks = updateBlockAtPath(previousBloques, blockId, (b) => {
      return withRotation(b, angle);
    });

    const updatedContent = mergeRendererSlideState(slide, { bloques: nextBlocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;

    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
  }, [slide, updateSlide, onPersistSlide]);

  const handleResize = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    const blocks = slide.bloques ?? [];
    const block = blocks[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) return;
    const snapped = onResizeMove ? onResizeMove(blockId, coords) : coords;
    setResizingCoords((prev) => ({ ...prev, [blockId]: snapped }));
  }, [onResizeMove, slide.bloques]);

  const handleResizeEnd = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    const block = (slide.bloques ?? [])[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) {
      setResizingCoords((prev) => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
      return;
    }
    // Apply snap to the final commit coords so the saved position matches the guide.
    const finalCoords = onResizeMove ? onResizeMove(blockId, coords) : coords;

    setResizingCoords((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });

    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const nextBlocks = updateBlockAtPath(previousBloques, blockId, (b) => {
      if (b.tipo === 'popup') {
        const popupBlock = b as PopupWidget;
        const canvas = measureCanvasRef.current;
        const cfg = mergedPopupConfig(popupBlock);
        const isIcon = cfg.triggerVisual === 'icono';
        let triggerAnchoPx = cfg.triggerAnchoPx ?? 48;
        let triggerAltoPx = cfg.triggerAltoPx ?? 48;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const wPx = (finalCoords.ancho / 100) * rect.width;
          const hPx = (finalCoords.alto / 100) * rect.height;
          if (isIcon) {
            const side = clampPopupTriggerPx(Math.round((wPx + hPx) / 2));
            triggerAnchoPx = side;
            triggerAltoPx = side;
          } else {
            triggerAnchoPx = clampPopupTriggerPx(Math.round(wPx));
            triggerAltoPx = clampPopupTriggerPx(Math.round(hPx));
          }
        }
        return syncPopupBlockSizeFromTriggerPx({
          ...popupBlock,
          x: finalCoords.x,
          y: finalCoords.y,
          configuracion: {
            ...popupBlock.configuracion,
            triggerAnchoPx,
            triggerAltoPx,
          },
        });
      }

      const resized = withRect(
        b,
        finalCoords.x,
        finalCoords.y,
        finalCoords.ancho,
        finalCoords.alto,
      );
      if (b.tipo === 'imagen') {
        return { ...resized, ajuste: 'llenar' } as Block;
      }
      return resized;
    });

    const updatedContent = mergeRendererSlideState(slide, { bloques: nextBlocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;

    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
    onResizeInteractionEnd?.();
  }, [slide, updateSlide, onPersistSlide, onResizeInteractionEnd, onResizeMove, measureCanvasRef]);

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

  function handleCanvasClick(e: React.MouseEvent) {
    if (!editorMode) return;
    if ((e.target as HTMLElement).closest('[data-popup-overlay-portal]')) return;
    setSelectedIdState(null);
    setEditingId(null);
    onBlockSelect?.('');
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
      <SlideCanvasRootContext.Provider value={slideCanvasRoot}>
      <div
        ref={previewContainerRef}
        className={cn('relative overflow-hidden', className)}
        style={{ aspectRatio: '16 / 9' }}
      >
        {previewScale > 0 && (
          <div
            ref={bindSlideRootRef}
            data-slide-root
            className="canvas-slide"
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
            {slide.fondo?.tipo === 'imagen' && typeof slide.fondo.rotacion === 'number' && slide.fondo.rotacion % 360 !== 0 && (
              <BackgroundImageLayer fondo={slide.fondo} />
            )}
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
            isThumbnail={isThumbnail}
            clipGroupInnerEditId={clipGroupInnerEditId}
            onClipGroupInnerEditChange={onClipGroupInnerEditChange}
            onClipGroupChange={onClipGroupChange}
          />
              );
            })}
          </div>
        )}
      </div>
      </SlideCanvasRootContext.Provider>
    );
  }

  // ─── Editor / viewer mode ─────────────────────────────────────────────────
  return (
    <SlideCanvasRootContext.Provider value={slideCanvasRoot}>
    <div
      data-slide-root
      className={cn('canvas-slide', editorMode ? 'overflow-visible' : 'overflow-hidden', className)}
      style={{
        ...bgStyle,
        ...(editorMode
          ? {
              position: 'relative',
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
      ref={bindSlideRootRef}
    >
      {slide.fondo?.tipo === 'imagen' && typeof slide.fondo.rotacion === 'number' && slide.fondo.rotacion % 360 !== 0 && (
        <BackgroundImageLayer fondo={slide.fondo} className="rounded-md" />
      )}
      {/* key={slide.id} forces full remount of blocks on slide change → re-triggers entry animation */}
      {blocks.map((block, index) => {
        const blockId = String(index);
        const posStyleObj = getBlockPositionStyle(block);
        const currentCoords = resizingCoords[blockId] ?? getBlockRawCoords(block);
        const currentRot = rotatingAngles[blockId] !== undefined
          ? rotatingAngles[blockId]
          : (block as { rotacion?: number }).rotacion ?? (block.tipo === 'actividad' ? block.marco?.rotacion : undefined);

        const posStyle = resizingCoords[blockId] ? {
          position: 'absolute' as const,
          left: `${currentCoords.x}%`,
          top: `${currentCoords.y}%`,
          width: `${currentCoords.ancho}%`,
          height: `${currentCoords.alto}%`,
          zIndex: (block as { zIndex?: number }).zIndex ?? 1,
          transform: currentRot ? `rotate(${currentRot}deg)` : undefined,
          transformOrigin: currentRot ? 'center center' : undefined,
        } : rotatingAngles[blockId] !== undefined ? {
          ...posStyleObj,
          transform: `rotate(${rotatingAngles[blockId]}deg)`,
          transformOrigin: 'center center',
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
            rotacion={currentRot}
            onRotate={handleRotate}
            onRotateEnd={handleRotateEnd}
            onActivityChange={onActivityChange}
            onFlipCardsChange={onFlipCardsChange}
            flipCardsInnerSelection={flipCardsInnerSelection}
            onFlipCardsInnerSelectionChange={onFlipCardsInnerSelectionChange}
            onTabsChange={onTabsChange}
            tabsInnerSelection={tabsInnerSelection}
            onTabsInnerSelectionChange={onTabsInnerSelectionChange}
            onCarouselChange={onCarouselChange}
            carouselInnerSelection={carouselInnerSelection}
            onCarouselInnerSelectionChange={onCarouselInnerSelectionChange}
            onClickRevealChange={onClickRevealChange}
            clickRevealInnerSelection={clickRevealInnerSelection}
            onClickRevealInnerSelectionChange={onClickRevealInnerSelectionChange}
            onPopupChange={onPopupChange}
            popupInnerSelection={popupInnerSelection}
            onPopupInnerSelectionChange={onPopupInnerSelectionChange}
            onHotspotChange={onHotspotChange}
            hotspotInnerSelection={hotspotInnerSelection}
            onHotspotInnerSelectionChange={onHotspotInnerSelectionChange}
            onTimelineChange={onTimelineChange}
            timelineInnerSelection={timelineInnerSelection}
            onTimelineInnerSelectionChange={onTimelineInnerSelectionChange}
            onDiagramaChange={onDiagramaChange}
            onRemoveBlock={editorMode ? onRemoveBlock : undefined}
            onDuplicateBlock={editorMode ? onDuplicateBlock : undefined}
            onCopyBlock={editorMode ? onCopyBlock : undefined}
            onToggleCanvasLock={editorMode ? onToggleCanvasLock : undefined}
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
            isThumbnail={isThumbnail}
            clipGroupInnerEditId={clipGroupInnerEditId}
            onClipGroupInnerEditChange={onClipGroupInnerEditChange}
            onClipGroupChange={editorMode ? onClipGroupChange : undefined}
            onUngroupClipGroup={editorMode ? onUngroupClipGroup : undefined}
            isLiveDragging={draggingBlockId === blockId}
          />
        );
      })}

      {blocks.length === 0 && editorMode && (
        <div className="flex h-full items-center justify-center text-sm text-neutral-400 select-none pointer-events-none">
          Sin bloques — agrega contenido desde el panel lateral
        </div>
      )}
    </div>
    </SlideCanvasRootContext.Provider>
  );
}
