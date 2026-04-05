'use client';

import { createElement, CSSProperties, useState } from 'react';
import { Trash2 } from 'lucide-react';

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
import { FillBlanksActivityEditor } from './activities/fill-blanks';
import { MatchPairsActivityEditor } from './activities/match-pairs';
import { OrderStepsActivityEditor } from './activities/order-steps';
import { WordCloudActivityEditor } from './activities/word-cloud';

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
      minHeight: 0,
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
    minHeight: 0,
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
  slideId,
  modo,
  isSelected,
  activityCanvasLayout,
  onActivityChange,
  onRemoveBlock,
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
}) {
  const act = block.actividad;

  if (act.tipo === 'short_answer') {
    if (modo === 'editor') {
      return (
        <ShortAnswerActivityEditor
          editorSyncKey={`${slideId}-${blockId}`}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    // VIEWER
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-base font-medium text-foreground">{act.question}</p>
        {act.hint && (
          <p className="text-xs text-muted-foreground">💡 {act.hint}</p>
        )}
        <textarea
          className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Escribe tu respuesta aquí…"
          maxLength={act.maxLength ?? 200}
          readOnly
        />
        {act.maxLength && (
          <p className="text-right text-xs text-muted-foreground">
            Máx. {act.maxLength} caracteres
          </p>
        )}
      </div>
    );
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
    return (
      <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Vista previa no disponible aún
      </div>
    );
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
    return (
      <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Vista previa no disponible aún
      </div>
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
    return (
      <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Vista previa no disponible aún
      </div>
    );
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
  slideId: string;
  modo: 'editor' | 'viewer';
  selectedId: string | null;
  onBlockClick: (id: string) => void;
  pathPrefix: string;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
}

function RenderColumns({
  block,
  slideId,
  modo,
  selectedId,
  onBlockClick,
  pathPrefix,
  onActivityChange,
  onRemoveBlock,
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
                slideId={slideId}
                isSelected={selectedId === id}
                modo={modo}
                selectedId={selectedId}
                onClick={() => onBlockClick(id)}
                onBlockClick={onBlockClick}
                pathPrefix={id}
                onActivityChange={onActivityChange}
                onRemoveBlock={onRemoveBlock}
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
  slideId: string;
  isSelected: boolean;
  modo: 'editor' | 'viewer';
  selectedId: string | null;
  onClick: () => void;
  onBlockClick: (id: string) => void;
  pathPrefix: string;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
  /** Slide dedicado a actividad(es): el editor de respuesta corta usa layout de lienzo acotado. */
  activityCanvasLayout?: boolean;
}

function BlockNode({
  block,
  blockId,
  slideId,
  isSelected,
  modo,
  selectedId,
  onClick,
  onBlockClick,
  pathPrefix,
  onActivityChange,
  onRemoveBlock,
  activityCanvasLayout,
}: BlockNodeProps) {
  const activityBlockForRender: ActivityBlock | null =
    block.tipo === 'actividad' ? (blockForActivityRender(block) as ActivityBlock) : null;

  function renderContent() {
    switch (block.tipo) {
      case 'texto':     return <RenderText block={block} />;
      case 'imagen':    return <RenderImage block={block} />;
      case 'video':     return <RenderVideo block={block} />;
      case 'audio':     return <RenderAudio block={block} />;
      case 'actividad':
        return activityBlockForRender ? (
          <RenderActivity
            block={activityBlockForRender}
            blockId={blockId}
            slideId={slideId}
            modo={modo}
            isSelected={isSelected}
            activityCanvasLayout={activityCanvasLayout}
            onActivityChange={onActivityChange}
            onRemoveBlock={onRemoveBlock}
          />
        ) : null;
      case 'codigo':    return <RenderCode block={block} />;
      case 'cita':      return <RenderQuote block={block} />;
      case 'separador': return <RenderDivider block={block} />;
      case 'columnas':
        return (
          <RenderColumns
            block={block}
            slideId={slideId}
            modo={modo}
            selectedId={selectedId}
            onBlockClick={onBlockClick}
            pathPrefix={pathPrefix}
            onActivityChange={onActivityChange}
            onRemoveBlock={onRemoveBlock}
          />
        );
    }
  }

  const editorMode = modo === 'editor';
  const isFormBlock = block.tipo === 'actividad' && editorMode;

  return (
    <div
      role={editorMode && !isFormBlock ? 'button' : undefined}
      tabIndex={editorMode && !isFormBlock ? 0 : undefined}
      aria-pressed={editorMode ? isSelected : undefined}
      data-block-id={blockId}
      onClick={editorMode ? onClick : undefined}
      onKeyDown={
        editorMode && !isFormBlock
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
        editorMode && !isFormBlock && 'cursor-pointer outline-none rounded-sm',
        editorMode && !isFormBlock && 'hover:ring-1 hover:ring-primary/40',
        isFormBlock && 'min-h-0 max-w-full cursor-default',
        isSelected && !isFormBlock && 'ring-1 ring-primary/50',
      )}
    >
      {renderContent()}
      {editorMode && !!onRemoveBlock && (
        <button
          type="button"
          aria-label="Eliminar bloque"
          onClick={(e) => { e.stopPropagation(); onRemoveBlock(blockId); }}
          className={cn(
            'absolute top-1 right-1 z-10 size-6',
            'flex items-center justify-center rounded',
            'bg-destructive/80 hover:bg-destructive text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity',
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
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
  /** Elimina un bloque del slide (p. ej. actividad equivocada). */
  onRemoveBlock?: (blockId: string) => void;
  className?: string;
}

export function SlideRenderer({
  slide,
  modo,
  onBlockSelect,
  onActivityChange,
  onRemoveBlock,
  className,
}: SlideRendererProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bgStyle = buildBackgroundStyle(slide.fondo);
  const layoutStyle = buildLayoutStyle(slide.diseno);

  function handleBlockClick(blockId: string) {
    if (modo !== 'editor') return;
    setSelectedId(blockId);
    onBlockSelect?.(blockId);
  }

  const blocks = slide.bloques ?? [];
  const topLevelActivityIndices = blocks
    .map((b, i) => (b.tipo === 'actividad' ? i : -1))
    .filter((i) => i >= 0);
  const topLevelTextIndices = blocks
    .map((b, i) => (b.tipo === 'texto' ? i : -1))
    .filter((i) => i >= 0);
  const isActivityExclusiveSlide = topLevelActivityIndices.length > 0;

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden', className)}
      style={bgStyle}
    >
      {isActivityExclusiveSlide ? (
        <div className="relative flex h-full min-h-0 min-w-0 w-full items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="flex w-full max-w-xl min-h-0 flex-col items-stretch justify-center gap-6">
            {topLevelTextIndices.map((index) => {
              const blockId = String(index);
              const block = blocks[index]!;
              return (
                <BlockNode
                  key={blockId}
                  block={block}
                  blockId={blockId}
                  slideId={slide.id}
                  isSelected={modo === 'editor' && selectedId === blockId}
                  modo={modo}
                  selectedId={selectedId}
                  onClick={() => handleBlockClick(blockId)}
                  onBlockClick={handleBlockClick}
                  pathPrefix={blockId}
                  onActivityChange={onActivityChange}
                  onRemoveBlock={onRemoveBlock}
                />
              );
            })}
            {topLevelActivityIndices.map((index) => {
              const blockId = String(index);
              const block = blocks[index]!;
              return (
                <BlockNode
                  key={blockId}
                  block={block}
                  blockId={blockId}
                  slideId={slide.id}
                  isSelected={modo === 'editor' && selectedId === blockId}
                  modo={modo}
                  selectedId={selectedId}
                  onClick={() => handleBlockClick(blockId)}
                  onBlockClick={handleBlockClick}
                  pathPrefix={blockId}
                  onActivityChange={onActivityChange}
                  onRemoveBlock={onRemoveBlock}
                  activityCanvasLayout
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative h-full min-h-0 min-w-0 w-full" style={layoutStyle}>
          {blocks.map((block, index) => {
            const blockId = String(index);
            return (
              <BlockNode
                key={blockId}
                block={block}
                blockId={blockId}
                slideId={slide.id}
                isSelected={modo === 'editor' && selectedId === blockId}
                modo={modo}
                selectedId={selectedId}
                onClick={() => handleBlockClick(blockId)}
                onBlockClick={handleBlockClick}
                pathPrefix={blockId}
                onActivityChange={onActivityChange}
                onRemoveBlock={onRemoveBlock}
              />
            );
          })}

          {blocks.length === 0 && modo === 'editor' && (
            <div className="flex min-h-32 items-center justify-center text-sm text-neutral-400 select-none pointer-events-none">
              Sin bloques — agrega contenido desde el panel lateral
            </div>
          )}
        </div>
      )}
    </div>
  );
}
