'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Columns2,
  ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  MessageSquare,
  Minus,
  Quote,
  Sparkles,
  Type,
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
import type { Activity, Block } from '@/types/slide.types';
import {
  applyLayoutPreset,
  appendBlockToSlideContent,
  buildContentDocumentForNewActivitySlide,
  getSlideContentRecord,
  mergeSlideContent,
} from '@/lib/class-slide-normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
}

type ContentPanelProps = {
  apiSlide: ApiSlide | null;
  onCommitContent: (content: Record<string, unknown>) => void;
  disabled?: boolean;
};

// ─── Panels ───────────────────────────────────────────────────────────────────

function ElementosPanel({ apiSlide, onCommitContent, disabled }: ContentPanelProps) {
  const add = (block: Block) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, block));
    toast.success('Elemento añadido');
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-4 p-3 pr-2">
        <PanelSection title="Básico">
          <InsertBtn
            label="Texto"
            icon={Type}
            disabled={disabled}
            onClick={() => add({ tipo: 'texto', contenido: 'Escribe aquí…' })}
          />
          <InsertBtn
            label="Imagen (marcador)"
            icon={ImageIcon}
            disabled={disabled}
            onClick={() =>
              add({
                tipo: 'imagen',
                url: 'https://placehold.co/640x360/e2e8f0/64748b?text=Imagen',
                alt: 'Descripción',
              })
            }
          />
          <InsertBtn
            label="Video (YouTube)"
            icon={Video}
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
            onClick={() => add({ tipo: 'separador' })}
          />
          <InsertBtn
            label="Cita"
            icon={Quote}
            disabled={disabled}
            onClick={() => add({ tipo: 'cita', texto: 'Texto de la cita', autor: 'Autor' })}
          />
          <InsertBtn
            label="Dos columnas (vacías)"
            icon={Columns2}
            disabled={disabled}
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

function ActividadesInsertPanel({ apiSlide, onCommitContent, disabled }: ContentPanelProps) {
  const addBlock = (tipo: string, subtipo: string) => {
    onCommitContent(appendBlockToSlideContent(apiSlide, { tipo, subtipo } as unknown as Block));
    toast.info('Próximamente');
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-4 p-3 pr-2">
        <PanelSection title="Interacción">
          <InsertBtn label="Botón" icon={MousePointer2} disabled={disabled} onClick={() => addBlock('interactivo', 'boton')} />
          <InsertBtn label="Hotspot" icon={Target} disabled={disabled} onClick={() => addBlock('interactivo', 'hotspot')} />
          <InsertBtn label="Tooltip emergente" icon={MessageSquare} disabled={disabled} onClick={() => addBlock('interactivo', 'tooltip')} />
          <InsertBtn label="Contador / temporizador" icon={Timer} disabled={disabled} onClick={() => addBlock('interactivo', 'contador')} />
          <InsertBtn label="Barra de progreso" icon={Columns2} disabled={disabled} onClick={() => addBlock('interactivo', 'progreso')} />
        </PanelSection>

        <PanelSection title="Multimedia">
          <InsertBtn label="Iframe embebido" icon={MonitorPlay} disabled={disabled} onClick={() => addBlock('interactivo', 'iframe')} />
          <InsertBtn label="GIF animado" icon={Film} disabled={disabled} onClick={() => addBlock('interactivo', 'gif')} />
          <InsertBtn label="Código QR" icon={QrCode} disabled={disabled} onClick={() => addBlock('interactivo', 'qr')} />
        </PanelSection>

        <PanelSection title="Datos">
          <InsertBtn label="Gráfico de barras" icon={BarChart} disabled={disabled} onClick={() => addBlock('interactivo', 'grafico_barras')} />
          <InsertBtn label="Tabla de datos" icon={Table} disabled={disabled} onClick={() => addBlock('interactivo', 'tabla')} />
        </PanelSection>
      </div>
    </ScrollArea>
  );
}

const LAYOUT_LABELS: { key: string; label: string }[] = [
  { key: 'en_blanco', label: 'En blanco' },
  { key: 'titulo_centrado', label: 'Título centrado' },
  { key: 'titulo_y_contenido', label: 'Título + contenido' },
  { key: 'dos_columnas', label: 'Dos columnas' },
  { key: 'imagen_derecha', label: 'Imagen a la derecha' },
  { key: 'imagen_izquierda', label: 'Imagen a la izquierda' },
  { key: 'tres_columnas', label: 'Tres columnas' },
  { key: 'pantalla_completa', label: 'Pantalla completa' },
];

function LayoutPanel({ apiSlide, onCommitContent, disabled }: ContentPanelProps) {
  const current =
    typeof getSlideContentRecord(apiSlide).layout === 'string'
      ? (getSlideContentRecord(apiSlide).layout as string)
      : 'titulo_y_contenido';

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-2 p-3 pr-2">
        <p className="text-xs text-muted-foreground">
          Afecta la cuadrícula y alineación del contenido del slide (ver `diseno` en JSON).
        </p>
        {LAYOUT_LABELS.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            variant={current === key ? 'secondary' : 'outline'}
            size="sm"
            className="h-auto w-full justify-start gap-2 py-2 text-left text-xs font-normal"
            disabled={disabled}
            onClick={() => {
              onCommitContent(applyLayoutPreset(apiSlide, key));
              toast.success('Layout aplicado');
            }}
          >
            <LayoutTemplate className="size-3.5 shrink-0 text-muted-foreground" />
            {label}
          </Button>
        ))}
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
}: Pick<FlyoutLeftPanelsProps, 'slides' | 'activeSlideIndex' | 'onSelectSlide'>) {
  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-1 p-3 pr-2">
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
    onCreateActivitySlide,
    slides,
    activeSlideIndex,
    onSelectSlide,
    desempenoEnunciado,
    busy,
  } = props;
  const disabled = !apiSlide || busy;

  switch (panel) {
    case 'elementos':
      return <ElementosPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} />;
    case 'actividades':
      return <ActividadesInsertPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} />;
    case 'layout':
      return <LayoutPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} />;
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
      return <PaginasPanel slides={slides} activeSlideIndex={activeSlideIndex} onSelectSlide={onSelectSlide} />;
    default:
      return null;
  }
}
