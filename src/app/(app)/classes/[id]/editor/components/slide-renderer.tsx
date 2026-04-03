'use client';

import { createElement, CSSProperties, useState } from 'react';

import type {
  Activity,
  ActivityBlock,
  AudioBlock,
  Background,
  Block,
  CodeBlock,
  ColumnsBlock,
  DividerBlock,
  ImageBlock,
  Layout,
  LayoutPadding,
  QuoteBlock,
  Slide,
  TextBlock,
  VideoBlock,
} from '@/types/slide.types';
import { cn } from '@/lib/utils';

import { ShortAnswerActivityEditor } from './activities/short-answer';

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
};

// ─── Background → CSS ─────────────────────────────────────────────────────────

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

// ─── Layout → CSS ─────────────────────────────────────────────────────────────

const H_ALIGN_MAP: Record<string, string> = {
  izquierda: 'flex-start',
  centro: 'center',
  derecha: 'flex-end',
};

const V_ALIGN_MAP: Record<string, string> = {
  inicio: 'flex-start',
  centro: 'center',
  fin: 'flex-end',
};

function resolvePadding(relleno: Layout['relleno']): string {
  if (relleno === undefined) return '2rem';
  if (typeof relleno === 'number') return `${relleno}px`;
  const p = relleno as LayoutPadding;
  return `${p.arriba}px ${p.derecha}px ${p.abajo}px ${p.izquierda}px`;
}

function buildLayoutStyle(diseno?: Layout): CSSProperties {
  const padding = resolvePadding(diseno?.relleno);
  const gap = diseno?.brecha !== undefined ? `${diseno.brecha}px` : '0.75rem';
  const hAlign = diseno?.alineacionHorizontal ? (H_ALIGN_MAP[diseno.alineacionHorizontal] ?? 'stretch') : 'stretch';
  const vAlign = diseno?.alineacionVertical ? (V_ALIGN_MAP[diseno.alineacionVertical] ?? 'flex-start') : 'flex-start';

  if (diseno?.columnas && diseno.columnas > 1) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${diseno.columnas}, 1fr)`,
      gap,
      alignItems: vAlign,
      justifyItems: hAlign,
      padding,
      height: '100%',
      boxSizing: 'border-box',
    };
  }

  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: vAlign,
    alignItems: hAlign,
    gap,
    padding,
    height: '100%',
    boxSizing: 'border-box',
  };
}

// ─── Individual block renderers ───────────────────────────────────────────────

const TEXT_ALIGN_MAP: Record<string, CSSProperties['textAlign']> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

function RenderText({ block }: { block: TextBlock }) {
  const style: CSSProperties = {
    margin: 0,
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    fontSize: block.tamanoFuente,
    fontWeight: block.negrita ? 'bold' : undefined,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color,
  };
  const tag = block.nivel ? `h${block.nivel}` : 'p';
  return createElement(tag, { style }, block.contenido);
}

function RenderImage({ block }: { block: ImageBlock }) {
  const fitMap: Record<string, CSSProperties['objectFit']> = {
    cubrir: 'cover',
    contener: 'contain',
    llenar: 'fill',
  };

  return (
    <figure style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt ?? ''}
        style={{
          display: 'block',
          width: block.ancho ?? '100%',
          height: block.alto ?? 'auto',
          objectFit: block.ajuste ? fitMap[block.ajuste] : 'contain',
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
  const width = block.ancho ?? '100%';

  if (block.plataforma === 'youtube') {
    const match = block.url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    const videoId = match?.[1] ?? '';
    const params = new URLSearchParams({ ...(block.autoplay ? { autoplay: '1' } : {}) });
    const src = `https://www.youtube.com/embed/${videoId}${params.size ? `?${params}` : ''}`;
    return (
      <div style={{ width, position: 'relative', aspectRatio: '16/9' }}>
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

  if (block.plataforma === 'vimeo') {
    const match = block.url.match(/vimeo\.com\/(\d+)/);
    const videoId = match?.[1] ?? '';
    const params = new URLSearchParams({ ...(block.autoplay ? { autoplay: '1' } : {}) });
    const src = `https://player.vimeo.com/video/${videoId}${params.size ? `?${params}` : ''}`;
    return (
      <div style={{ width, position: 'relative', aspectRatio: '16/9' }}>
        <iframe
          src={src}
          title="Video Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  }

  // Native / direct URL
  return (
    <video
      src={block.url}
      controls={block.controles ?? true}
      autoPlay={block.autoplay}
      loop={block.bucle}
      muted={block.silenciado}
      style={{ display: 'block', width, height: block.alto ?? 'auto' }}
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
      }}
    />
  );
}

function RenderActivity({
  block,
  blockId,
  modo,
  onActivityChange,
}: {
  block: ActivityBlock;
  blockId: string;
  modo: 'editor' | 'viewer';
  onActivityChange?: (blockId: string, activity: Activity) => void;
}) {
  const act = block.actividad;

  if (act.tipo === 'short_answer') {
    if (modo === 'editor') {
      return (
        <ShortAnswerActivityEditor
          activity={act}
          onChange={(a) => onActivityChange?.(blockId, a)}
        />
      );
    }
    return (
      <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Vista previa no disponible aún
      </div>
    );
  }

  const label = ACTIVITY_LABELS[act.tipo];
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
  modo: 'editor' | 'viewer';
  selectedId: string | null;
  onBlockClick: (id: string) => void;
  pathPrefix: string;
  onActivityChange?: (blockId: string, activity: Activity) => void;
}

function RenderColumns({
  block,
  modo,
  selectedId,
  onBlockClick,
  pathPrefix,
  onActivityChange,
}: RenderColumnsProps) {
  let gridCols = `repeat(${block.columnas.length}, 1fr)`;
  if (block.proporcion) {
    const parts = block.proporcion.split(':');
    if (parts.length === block.columnas.length) {
      gridCols = parts.map((n) => `${n.trim()}fr`).join(' ');
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: '1rem',
        width: '100%',
      }}
    >
      {block.columnas.map((colBlocks, colIdx) => (
        <div
          key={colIdx}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          {colBlocks.map((innerBlock, blockIdx) => {
            const id = `${pathPrefix}-${colIdx}-${blockIdx}`;
            return (
              <BlockNode
                key={id}
                block={innerBlock}
                blockId={id}
                isSelected={selectedId === id}
                modo={modo}
                selectedId={selectedId}
                onClick={() => onBlockClick(id)}
                onBlockClick={onBlockClick}
                pathPrefix={id}
                onActivityChange={onActivityChange}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── BlockNode ────────────────────────────────────────────────────────────────

interface BlockNodeProps {
  block: Block;
  blockId: string;
  isSelected: boolean;
  modo: 'editor' | 'viewer';
  selectedId: string | null;
  onClick: () => void;
  onBlockClick: (id: string) => void;
  pathPrefix: string;
  onActivityChange?: (blockId: string, activity: Activity) => void;
}

function BlockNode({
  block,
  blockId,
  isSelected,
  modo,
  selectedId,
  onClick,
  onBlockClick,
  pathPrefix,
  onActivityChange,
}: BlockNodeProps) {
  function renderContent() {
    switch (block.tipo) {
      case 'texto':     return <RenderText block={block} />;
      case 'imagen':    return <RenderImage block={block} />;
      case 'video':     return <RenderVideo block={block} />;
      case 'audio':     return <RenderAudio block={block} />;
      case 'actividad':
        return (
          <RenderActivity
            block={block}
            blockId={blockId}
            modo={modo}
            onActivityChange={onActivityChange}
          />
        );
      case 'codigo':    return <RenderCode block={block} />;
      case 'cita':      return <RenderQuote block={block} />;
      case 'separador': return <RenderDivider block={block} />;
      case 'columnas':
        return (
          <RenderColumns
            block={block}
            modo={modo}
            selectedId={selectedId}
            onBlockClick={onBlockClick}
            pathPrefix={pathPrefix}
            onActivityChange={onActivityChange}
          />
        );
    }
  }

  const editorMode = modo === 'editor';

  return (
    <div
      role={editorMode ? 'button' : undefined}
      tabIndex={editorMode ? 0 : undefined}
      aria-pressed={editorMode ? isSelected : undefined}
      data-block-id={blockId}
      onClick={editorMode ? onClick : undefined}
      onKeyDown={
        editorMode
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        editorMode && 'cursor-pointer outline-none rounded-sm',
        editorMode && 'hover:ring-2 hover:ring-primary/40 hover:ring-offset-1',
        isSelected && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      {renderContent()}
    </div>
  );
}

// ─── SlideRenderer ────────────────────────────────────────────────────────────

export interface SlideRendererProps {
  slide: Slide;
  /** `'editor'` shows click-selection borders; `'viewer'` is purely presentational. */
  modo: 'editor' | 'viewer';
  /** Called with the block's index-path string when a block is selected in editor mode. */
  onBlockSelect?: (blockId: string) => void;
  /** Persiste cambios de una actividad (PATCH vía el padre). */
  onActivityChange?: (blockId: string, activity: Activity) => void;
  className?: string;
}

export function SlideRenderer({ slide, modo, onBlockSelect, onActivityChange, className }: SlideRendererProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bgStyle = buildBackgroundStyle(slide.fondo);
  const layoutStyle = buildLayoutStyle(slide.diseno);

  function handleBlockClick(blockId: string) {
    if (modo !== 'editor') return;
    setSelectedId(blockId);
    onBlockSelect?.(blockId);
  }

  const blocks = slide.bloques ?? [];

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={bgStyle}
    >
      <div style={layoutStyle}>
        {blocks.map((block, index) => {
          const blockId = String(index);
          return (
            <BlockNode
              key={blockId}
              block={block}
              blockId={blockId}
              isSelected={modo === 'editor' && selectedId === blockId}
              modo={modo}
              selectedId={selectedId}
              onClick={() => handleBlockClick(blockId)}
              onBlockClick={handleBlockClick}
              pathPrefix={blockId}
              onActivityChange={onActivityChange}
            />
          );
        })}

        {blocks.length === 0 && modo === 'editor' && (
          <div className="flex min-h-32 items-center justify-center text-sm text-neutral-400 select-none pointer-events-none">
            Sin bloques — agrega contenido desde el panel lateral
          </div>
        )}
      </div>
    </div>
  );
}
