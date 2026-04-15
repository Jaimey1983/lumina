'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Columns2,
  MessageSquare,
  Minus,
  Quote,
  Sparkles,
  Video,
  Volume2,
  MousePointer2,
  Target,
  Timer,
  MonitorPlay,
  Film,
  QrCode,
  BarChart,
  Table,
} from 'lucide-react';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import type { Block } from '@/types/slide.types';
import {
  appendBlockToSlideContent,
  getSlideContentRecord,
  mergeSlideContent,
  sanitizeSlideContentForPersistence,
} from '@/lib/class-slide-normalize';
import { SLIDE_TIMER_PER_SLIDE_OPTIONS } from '@/lib/slide-timer-resolve';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { ImagesElementPanel } from './images-element-panel';
import { ShapesPanel } from './shapes-panel';
import { TextFormatPanel } from './text-format-panel';
import { LayoutPanel } from '../layout-panel';
import type { SlidePersistedLayoutKey } from '../templates-panel';

// ─── Shared UI ────────────────────────────────────────────────────────────────

function PanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function InsertBtn({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto w-full justify-start gap-2 py-2 text-left text-xs font-normal"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      {label}
    </Button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FlyoutLeftPanelsProps {
  panel: string;
  apiSlide: ApiSlide | null;
  /** Contenido completo a persistir en PATCH (merge del JSON `content`). */
  onCommitContent: (content: Record<string, unknown>) => void;
  /** POST de un slide nuevo cuyo contenido es solo la actividad (no modifica el slide actual). */
  onCreateActivitySlide: (content: Record<string, unknown>, title: string) => void;
  slides: { id: string; order: number; title: string; type: string }[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  desempenoEnunciado?: string;
  busy?: boolean;
  slideHasActivity?: boolean;
  onApplyLayout: (layoutKey: SlidePersistedLayoutKey) => void;
  applyLayoutPending?: boolean;
}

type ContentPanelProps = {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
  slideHasActivity?: boolean;
};

// ─── Panels ───────────────────────────────────────────────────────────────────

function ElementosPanel({ apiSlide, onCommitContent, disabled, slideHasActivity }: ContentPanelProps) {
  const add = (block: Block) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, block));
    toast.success('Elemento añadido');
  };

  const disabledNonText = disabled || !!slideHasActivity;

  return (
    <ScrollArea className="h-full min-h-0 bg-white dark:bg-zinc-900">
      <div className="space-y-4 p-3 pr-2">
        {slideHasActivity && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Solo puedes agregar texto (título) a este slide.
          </p>
        )}
        <TextFormatPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} />
        <ImagesElementPanel
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          disabled={disabledNonText}
        />
        <ShapesPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabledNonText} />
        <PanelSection title="Multimedia">
          <InsertBtn
            label="Video (YouTube)"
            icon={Video}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'video',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                plataforma: 'youtube',
                controles: true,
              })
            }
          />
          <InsertBtn
            label="Audio"
            icon={Volume2}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'audio',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                controles: true,
              })
            }
          />
        </PanelSection>
        <PanelSection title="Estructura">
          <InsertBtn
            label="Separador"
            icon={Minus}
            disabled={disabledNonText}
            onClick={() => add({ tipo: 'separador' })}
          />
          <InsertBtn
            label="Cita"
            icon={Quote}
            disabled={disabledNonText}
            onClick={() => add({ tipo: 'cita', texto: 'Texto de la cita', autor: 'Autor' })}
          />
          <InsertBtn
            label="Dos columnas (vacías)"
            icon={Columns2}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'columnas',
                columnas: [[{ tipo: 'texto', contenido: 'Columna izquierda' }], [{ tipo: 'texto', contenido: 'Columna derecha' }]],
                proporcion: '1:1',
              })
            }
          />
        </PanelSection>
      </div>
    </ScrollArea>
  );
}

function ActividadesInsertPanel({ apiSlide, onCommitContent, disabled, slideHasActivity }: ContentPanelProps) {
  const addBlock = (tipo: string, subtipo: string) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, { tipo, subtipo } as unknown as Block));
    toast.info('Próximamente');
  };

  const allDisabled = disabled || !!slideHasActivity;

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-4 p-3 pr-2">
        {slideHasActivity && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Elimina la actividad para agregar otros elementos.
          </p>
        )}
        <PanelSection title="Interacción">
          <InsertBtn label="Botón" icon={MousePointer2} disabled={allDisabled} onClick={() => addBlock('interactivo', 'boton')} />
          <InsertBtn label="Hotspot" icon={Target} disabled={allDisabled} onClick={() => addBlock('interactivo', 'hotspot')} />
          <InsertBtn label="Tooltip emergente" icon={MessageSquare} disabled={allDisabled} onClick={() => addBlock('interactivo', 'tooltip')} />
          <InsertBtn label="Contador / temporizador" icon={Timer} disabled={allDisabled} onClick={() => addBlock('interactivo', 'contador')} />
          <InsertBtn label="Barra de progreso" icon={Columns2} disabled={allDisabled} onClick={() => addBlock('interactivo', 'progreso')} />
        </PanelSection>

        <PanelSection title="Multimedia">
          <InsertBtn label="Iframe embebido" icon={MonitorPlay} disabled={allDisabled} onClick={() => addBlock('interactivo', 'iframe')} />
          <InsertBtn label="GIF animado" icon={Film} disabled={allDisabled} onClick={() => addBlock('interactivo', 'gif')} />
          <InsertBtn label="Código QR" icon={QrCode} disabled={allDisabled} onClick={() => addBlock('interactivo', 'qr')} />
        </PanelSection>

        <PanelSection title="Datos">
          <InsertBtn label="Gráfico de barras" icon={BarChart} disabled={allDisabled} onClick={() => addBlock('interactivo', 'grafico_barras')} />
          <InsertBtn label="Tabla de datos" icon={Table} disabled={allDisabled} onClick={() => addBlock('interactivo', 'tabla')} />
        </PanelSection>
      </div>
    </ScrollArea>
  );
}

function FondoPanel({ apiSlide, onCommitContent, disabled }: ContentPanelProps) {
  const c = getSlideContentRecord(apiSlide);
  const fondo = c.fondo as { tipo?: string; valor?: string; inicio?: string; fin?: string; url?: string } | undefined;
  const [hex, setHex] = useState(
    fondo?.tipo === 'color' && fondo.valor ? fondo.valor : '#ffffff',
  );
  const [imgUrl, setImgUrl] = useState(fondo?.tipo === 'imagen' && fondo.url ? fondo.url : '');

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-4 p-3 pr-2">
        <PanelSection title="Color sólido">
          <div className="flex gap-2">
            <Input
              type="color"
              className="h-9 w-14 cursor-pointer p-1"
              value={hex.startsWith('#') ? hex : `#${hex}`}
              onChange={(e) => setHex(e.target.value)}
              disabled={disabled}
            />
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={disabled}
              onClick={() => {
                onCommitContent(mergeSlideContent(apiSlide, { fondo: { tipo: 'color', valor: hex } }));
                toast.success('Fondo actualizado');
              }}
            >
              Aplicar color
            </Button>
          </div>
        </PanelSection>
        <PanelSection title="Gradiente rápido">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { inicio: '#0ea5e9', fin: '#6366f1', label: 'Azul' },
              { inicio: '#f97316', fin: '#ec4899', label: 'Atardecer' },
              { inicio: '#22c55e', fin: '#14b8a6', label: 'Verde' },
              { inicio: '#18181b', fin: '#3f3f46', label: 'Oscuro' },
            ].map((g) => (
              <Button
                key={g.label}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={disabled}
                onClick={() => {
                  onCommitContent(
                    mergeSlideContent(apiSlide, {
                      fondo: { tipo: 'gradiente', inicio: g.inicio, fin: g.fin, direccion: 135 },
                    }),
                  );
                  toast.success('Gradiente aplicado');
                }}
              >
                {g.label}
              </Button>
            ))}
          </div>
        </PanelSection>
        <PanelSection title="Imagen de fondo">
          <Label htmlFor="fondo-url" className="text-xs text-muted-foreground">
            URL
          </Label>
          <Input
            id="fondo-url"
            placeholder="https://…"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            disabled={disabled}
            className="text-xs"
          />
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={disabled || !imgUrl.trim()}
            onClick={() => {
              onCommitContent(
                mergeSlideContent(apiSlide, {
                  fondo: { tipo: 'imagen', url: imgUrl.trim(), ajuste: 'cubrir' },
                }),
              );
              toast.success('Imagen de fondo aplicada');
            }}
          >
            Aplicar imagen
          </Button>
        </PanelSection>
      </div>
    </ScrollArea>
  );
}

function IaPanel({ desempenoEnunciado }: { desempenoEnunciado?: string }) {
  return (
    <div className="space-y-3 p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3">
        <Sparkles className="size-5 shrink-0 text-primary" />
        <p>
          La generación con IA (clase, actividades, mejoras de slide) se conectará al backend de curriculum. Mientras tanto
          puedes usar el modal de desempeño y las actividades sugeridas.
        </p>
      </div>
      {desempenoEnunciado && (
        <div className="rounded-md border border-border bg-background p-2">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Desempeño actual</p>
          <p className="line-clamp-6 text-xs leading-snug text-foreground">{desempenoEnunciado}</p>
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => toast.info('Generación con IA próximamente')}
      >
        Generar borrador (próximamente)
      </Button>
    </div>
  );
}

function PaginasPanel({
  slides,
  activeSlideIndex,
  onSelectSlide,
  apiSlide,
  onCommitContent,
  busy,
}: Pick<
  FlyoutLeftPanelsProps,
  'slides' | 'activeSlideIndex' | 'onSelectSlide' | 'apiSlide' | 'onCommitContent' | 'busy'
>) {
  const c = apiSlide ? getSlideContentRecord(apiSlide) : {};
  const rawTimer = c.timer;
  const selectValue =
    rawTimer === undefined || rawTimer === null || rawTimer === ''
      ? 'inherit'
      : String(rawTimer);

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-1 p-3 pr-2">
        {apiSlide && (
          <PanelSection title="Temporizador (en vivo)" className="mb-3">
            <Label className="text-[11px] text-muted-foreground">Tiempo del slide</Label>
            <Select
              value={selectValue}
              disabled={busy}
              onValueChange={(v) => {
                const base = getSlideContentRecord(apiSlide);
                const next: Record<string, unknown> = { ...base };
                if (v === 'inherit') {
                  delete next.timer;
                } else {
                  next.timer = Number(v);
                }
                const sanitized = sanitizeSlideContentForPersistence(next) ?? next;
                onCommitContent(sanitized);
              }}
            >
              <SelectTrigger className="h-8 text-xs" size="sm">
                <SelectValue placeholder="Usar tiempo global" />
              </SelectTrigger>
              <SelectContent>
                {SLIDE_TIMER_PER_SLIDE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Vacío = usa el temporizador global de la clase. 0 = sin temporizador en este slide.
            </p>
          </PanelSection>
        )}

        <p className="mb-2 text-xs text-muted-foreground">
          {slides.length} slide{slides.length === 1 ? '' : 's'} en esta clase.
        </p>
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectSlide(idx)}
            className={cn(
              'flex w-full items-start gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors',
              idx === activeSlideIndex
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-transparent bg-muted/30 hover:bg-muted/60',
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-background text-xs font-medium tabular-nums text-muted-foreground">
              {idx + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-medium">{s.title || `Slide ${idx + 1}`}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{s.type}</span>
            </span>
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground opacity-50" aria-hidden />
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function FlyoutLeftPanels(props: FlyoutLeftPanelsProps) {
  const {
    panel,
    apiSlide,
    onCommitContent,
    slides,
    activeSlideIndex,
    onSelectSlide,
    desempenoEnunciado,
    busy,
    slideHasActivity,
    onApplyLayout,
    applyLayoutPending,
  } = props;
  const disabled = !apiSlide || busy;

  switch (panel) {
    case 'elementos':
      return <ElementosPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} slideHasActivity={slideHasActivity} />;
    case 'actividades':
      return <ActividadesInsertPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} slideHasActivity={slideHasActivity} />;
    case 'layout':
      return (
        <LayoutPanel
          apiSlide={apiSlide}
          disabled={disabled}
          onApplyLayout={onApplyLayout}
          applyLayoutPending={applyLayoutPending}
        />
      );
    case 'fondo':
      return (
        <FondoPanel
          key={apiSlide?.id ?? 'no-slide'}
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          disabled={disabled}
        />
      );
    case 'ia':
      return <IaPanel desempenoEnunciado={desempenoEnunciado} />;
    case 'paginas':
      return (
        <PaginasPanel
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={onSelectSlide}
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          busy={busy}
        />
      );
    default:
      return null;
  }
}
