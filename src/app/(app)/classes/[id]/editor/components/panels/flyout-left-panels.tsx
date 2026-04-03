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

// ─── Activity templates ───────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

function quizTemplate(): Activity {
  return {
    tipo: 'quiz_multiple',
    pregunta: 'Nueva pregunta',
    opciones: [
      { id: uid(), texto: 'Opción correcta', esCorrecta: true },
      { id: uid(), texto: 'Opción incorrecta', esCorrecta: false },
    ],
  };
}

function trueFalseTemplate(): Activity {
  return {
    tipo: 'verdadero_falso',
    afirmacion: 'Nueva afirmación',
    respuestaCorrecta: true,
  };
}

function shortAnswerTemplate(): Activity {
  return {
    tipo: 'short_answer',
    question: 'Nueva pregunta',
    expectedAnswer: '',
    caseSensitive: false,
    maxLength: 200,
  };
}

function dragDropTemplate(): Activity {
  const i1 = uid();
  const i2 = uid();
  const z1 = uid();
  const z2 = uid();
  return {
    tipo: 'arrastrar_soltar',
    instruccion: 'Arrastra cada elemento a su zona',
    items: [
      { id: i1, texto: 'Elemento 1' },
      { id: i2, texto: 'Elemento 2' },
    ],
    zonas: [
      { id: z1, etiqueta: 'Zona A', itemsCorrectos: [i1] },
      { id: z2, etiqueta: 'Zona B', itemsCorrectos: [i2] },
    ],
  };
}

function matchPairsTemplate(): Activity {
  const p = uid();
  return {
    tipo: 'emparejar',
    instruccion: 'Relaciona cada par',
    pares: [
      { id: p, izquierda: 'Término', derecha: 'Definición' },
      { id: uid(), izquierda: 'Concepto B', derecha: 'Significado B' },
    ],
  };
}

function orderStepsTemplate(): Activity {
  return {
    tipo: 'ordenar_pasos',
    instruccion: 'Ordena los pasos',
    pasos: [
      { id: uid(), contenido: 'Primer paso', ordenCorrecto: 1 },
      { id: uid(), contenido: 'Segundo paso', ordenCorrecto: 2 },
      { id: uid(), contenido: 'Tercer paso', ordenCorrecto: 3 },
    ],
  };
}

function livePollTemplate(): Activity {
  return {
    tipo: 'encuesta_viva',
    pregunta: '¿Qué opinas?',
    opciones: [
      { id: uid(), texto: 'Opción A' },
      { id: uid(), texto: 'Opción B' },
      { id: uid(), texto: 'Opción C' },
    ],
  };
}

function wordCloudTemplate(): Activity {
  return {
    tipo: 'nube_palabras',
    instruccion: 'Escribe una palabra clave',
  };
}

function videoInteractiveTemplate(): Activity {
  return {
    tipo: 'video_interactivo',
    urlVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    plataforma: 'youtube',
    preguntas: [],
  };
}

function fillBlanksTemplate(): Activity {
  const b = uid();
  return {
    tipo: 'completar_blancos',
    texto: `Completa: el agua hierve a {{blank:${b}}} °C.`,
    blancos: [{ id: b, respuesta: '100' }],
  };
}

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

function ActividadesInsertPanel({
  onCreateActivitySlide,
  disabled,
}: {
  onCreateActivitySlide: (content: Record<string, unknown>, title: string) => void;
  disabled?: boolean;
}) {
  const add = (act: Activity, title: string) => {
    const block: Block = { tipo: 'actividad', actividad: act };
    onCreateActivitySlide(buildContentDocumentForNewActivitySlide(block), title);
    toast.success('Nuevo slide solo con la actividad');
  };

  return (
    <ScrollArea className="h-full min-h-0">
      <div className="space-y-1 p-3 pr-2">
        <p className="mb-2 text-xs text-muted-foreground">
          Se crea un slide nuevo al final; el slide que estés viendo no se modifica.
        </p>
        <InsertBtn label="Quiz opción múltiple" icon={LayoutGrid} disabled={disabled} onClick={() => add(quizTemplate(), 'Quiz opción múltiple')} />
        <InsertBtn label="Verdadero / falso" icon={LayoutGrid} disabled={disabled} onClick={() => add(trueFalseTemplate(), 'Verdadero / falso')} />
        <InsertBtn label="Respuesta corta" icon={MessageSquare} disabled={disabled} onClick={() => add(shortAnswerTemplate(), 'Respuesta corta')} />
        <InsertBtn label="Completar blancos" icon={LayoutGrid} disabled={disabled} onClick={() => add(fillBlanksTemplate(), 'Completar blancos')} />
        <InsertBtn label="Arrastrar y soltar" icon={LayoutGrid} disabled={disabled} onClick={() => add(dragDropTemplate(), 'Arrastrar y soltar')} />
        <InsertBtn label="Emparejar" icon={LayoutGrid} disabled={disabled} onClick={() => add(matchPairsTemplate(), 'Emparejar')} />
        <InsertBtn label="Ordenar pasos" icon={LayoutGrid} disabled={disabled} onClick={() => add(orderStepsTemplate(), 'Ordenar pasos')} />
        <InsertBtn label="Video interactivo" icon={Video} disabled={disabled} onClick={() => add(videoInteractiveTemplate(), 'Video interactivo')} />
        <InsertBtn label="Encuesta en vivo" icon={LayoutGrid} disabled={disabled} onClick={() => add(livePollTemplate(), 'Encuesta en vivo')} />
        <InsertBtn label="Nube de palabras" icon={LayoutGrid} disabled={disabled} onClick={() => add(wordCloudTemplate(), 'Nube de palabras')} />
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
      return <ActividadesInsertPanel onCreateActivitySlide={onCreateActivitySlide} disabled={busy} />;
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
