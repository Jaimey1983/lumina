'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Columns2,
  Minus,
  Quote,
  Sparkles,
  Video,
  Volume2,
} from 'lucide-react';
import Link from 'next/link';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { cn } from '@/lib/utils';
import type { WidgetTipo } from '@/components/widgets/shared/widget-registry';

import {
  useContentAssistant,
  useGenerateFromDocument,
  useRefineStructure,
  type ContentAssistantResult,
  type GeneratedSlideStructure,
} from '@/hooks/api/use-ai';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  useAiSettings,
  useSetPreferredAiProvider,
} from '@/hooks/api/use-ai-settings';
import {
  AiPreferredProviderSelect,
  describeAiResolvedStatus,
} from '@/components/ai/ai-preferred-select';
import { useCurriculumLoader } from '@/hooks/use-curriculum-loader';
import { PLANTILLAS, type PlantillaPedagogica } from '@/lib/ia-templates';
import { AREAS_LABELS, GRADOS_PRIMARIA, GRADOS_BACHILLERATO } from '@/data/curriculum/index';
import type { AreaCurricular, GradoEscolar, CurriculumData, UnidadCurricular } from '@/types/curriculum.types';
import { ImagesElementPanel } from './images-element-panel';
import { ShapesPanel } from './shapes-panel';
import { ClipMasksPanel } from './clip-masks-panel';
import { WidgetsInsertPanel } from './widgets-insert-panel';
import { LayoutPanel } from '../layout-panel';
import {
  buildTemplateTextBlock,
  type SlidePersistedLayoutKey,
} from '../templates-panel';

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
  /** Inserta widgets desde el flyout izquierdo. */
  onAddWidget?: (type: WidgetTipo) => void;
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
        <ImagesElementPanel
          apiSlide={apiSlide}
          onCommitContent={onCommitContent}
          disabled={disabledNonText}
        />
        <ShapesPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabledNonText} />
        <ClipMasksPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabledNonText} />
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

const PLACEHOLDER_SLIDE_IMG =
  'https://placehold.co/480x360/e5e7eb/94a3b8/png?text=Imagen';

function buildSlideContextoCurricular(
  curriculumData: CurriculumData,
  topicKeywords: string,
): { bloques: Block[]; layout: SlidePersistedLayoutKey; titulo: string } | null {
  if (!curriculumData?.unidades?.length) return null;

  const keywords = topicKeywords.toLowerCase().split(/\s+/).filter((k) => k.length > 3);

  let unidadSeleccionada: UnidadCurricular = curriculumData.unidades[0]!;
  let maxScore = 0;

  for (const unidad of curriculumData.unidades) {
    const searchable = [
      ...unidad.temas,
      ...unidad.subtemas,
      ...unidad.palabras_clave,
      unidad.unidad_titulo,
      unidad.dba_enunciado,
    ].join(' ').toLowerCase();

    const score = keywords.filter((k) => searchable.includes(k)).length;
    if (score > maxScore) {
      maxScore = score;
      unidadSeleccionada = unidad;
    }
  }

  const u = unidadSeleccionada;
  const bloques: Block[] = [];

  bloques.push(buildTemplateTextBlock('Contexto Curricular', 5, 3, 90, 10, 24, 'centro'));

  const encabezado = [
    `${curriculumData.asignatura} · Grado ${curriculumData.grado}°`,
    `Referente: ${curriculumData.referente_normativo}`,
    `Unidad: ${u.unidad_titulo}`,
  ].join('\n');
  bloques.push(buildTemplateTextBlock(encabezado, 5, 15, 90, 12, 14, 'centro'));

  bloques.push(buildTemplateTextBlock(
    `DBA ${u.dba_asociados.join(', ')}:\n${u.dba_enunciado}`,
    5, 29, 90, 18, 14,
  ));

  bloques.push(buildTemplateTextBlock(
    `EBC — ${u.ebc_factor}:\n${u.ebc_estandar}`,
    5, 49, 90, 12, 13,
  ));

  bloques.push(buildTemplateTextBlock(
    `Nivel Bloom: ${u.nivel_cognitivo.nivel} · Verbos: ${u.nivel_cognitivo.verbo_bloom.join(', ')}`,
    5, 63, 55, 8, 13,
  ));

  bloques.push(buildTemplateTextBlock(
    `Temas: ${u.temas.join(' · ')}`,
    5, 72, 90, 8, 13,
  ));

  bloques.push(buildTemplateTextBlock(
    `Desempeño básico: ${u.indicadores_desempeno.cognitivo.basico}`,
    5, 82, 90, 12, 12,
  ));

  return {
    bloques,
    layout: 'titulo_y_contenido',
    titulo: `Contexto curricular — ${curriculumData.asignatura} ${curriculumData.grado}°`,
  };
}

function layoutDesdeSlideIA(
  slide: GeneratedSlideStructure | { tipo?: string; type?: string },
): SlidePersistedLayoutKey {
  // Esquema nuevo: usa campo `tipo`
  const tipo = ((slide as GeneratedSlideStructure).tipo
    ?? (slide as any).type
    ?? '') as string;

  switch (tipo) {
    case 'portada':
      return 'titulo_centrado_subtitulo';
    case 'exploracion':
      return 'pantalla_completa';
    case 'concepto':
      return 'titulo_y_contenido';
    case 'ejemplo':
      // imagen_derecha si Gemini sugirió imagen, titulo_y_contenido si no
      return (slide as GeneratedSlideStructure).contenido?.imagen_sugerida
        ? 'imagen_derecha'
        : 'titulo_y_contenido';
    case 'estructura':
      // dos_columnas si hay tabla, titulo_y_contenido si no
      return (slide as GeneratedSlideStructure).contenido?.tabla
        ? 'dos_columnas'
        : 'titulo_y_contenido';
    case 'comparacion':
      return 'dos_columnas';
    case 'actividad':
      return 'titulo_y_contenido';
    case 'cierre':
      return 'titulo_y_contenido';
    // Esquema antiguo: mapear COVER → titulo_centrado_subtitulo
    case 'COVER':
      return 'titulo_centrado_subtitulo';
    case 'ACTIVITY':
      return 'titulo_y_contenido';
    case 'IMAGE':
      return 'imagen_derecha';
    default:
      return 'titulo_y_contenido';
  }
}

function buildBloquesDesdeSlideIA(slide: GeneratedSlideStructure): Block[] {
  const { tipo, title } = slide;

  // ── Guard: si contenido es null/undefined, usar fallback básico ──────────
  if (!slide.contenido) {
    return [buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32)];
  }
  const contenido = slide.contenido;
  const bloques: Block[] = [];

  // ── 1. PORTADA → titulo_centrado_subtitulo ─────────────────────────────
  if (tipo === 'portada') {
    bloques.push(buildTemplateTextBlock(title ?? '', 10, 20, 80, 22, 36, 'centro'));
    if (contenido.texto_principal) {
      bloques.push(buildTemplateTextBlock(contenido.texto_principal, 15, 48, 70, 15, 18, 'centro'));
    }
    return bloques;
  }

  // ── 2. EXPLORACIÓN → pregunta grande centrada ───────────────────────────
  if (tipo === 'exploracion') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 12, 24, 'centro'));
    const pregunta = contenido.pregunta_reflexion ?? contenido.texto_principal ?? '';
    if (pregunta) {
      bloques.push(buildTemplateTextBlock(pregunta, 8, 20, 84, 50, 22, 'centro'));
    }
    if (contenido.instruccion_docente) {
      bloques.push(buildTemplateTextBlock(`Docente: ${contenido.instruccion_docente}`, 5, 75, 90, 18, 13));
    }
    return bloques;
  }

  // ── 3. CONCEPTO → titulo_y_contenido ────────────────────────────────────
  if (tipo === 'concepto') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32));
    const partes: string[] = [];
    if (contenido.texto_principal) partes.push(contenido.texto_principal);
    if (contenido.ejemplo) partes.push(`\nEjemplo: ${contenido.ejemplo}`);
    if (contenido.pregunta_reflexion) partes.push(`\n💭 ${contenido.pregunta_reflexion}`);
    if (partes.length > 0) {
      bloques.push(buildTemplateTextBlock(partes.join(''), 5, 20, 90, 72, 18));
    }
    return bloques;
  }

  // ── 4. EJEMPLO → imagen_derecha si hay imagen, titulo_y_contenido si no ─
  if (tipo === 'ejemplo') {
    if (contenido.imagen_sugerida) {
      bloques.push(buildTemplateTextBlock(title ?? '', 5, 10, 48, 14, 28));
      const textoEjemplo = [
        contenido.texto_principal ?? '',
        contenido.ejemplo ? `\nEjemplo: ${contenido.ejemplo}` : '',
        contenido.pregunta_reflexion ? `\n💭 ${contenido.pregunta_reflexion}` : '',
      ].filter(Boolean).join('');
      if (textoEjemplo) {
        bloques.push(buildTemplateTextBlock(textoEjemplo, 5, 26, 48, 64, 16));
      }
      bloques.push({
        tipo: 'imagen',
        url: PLACEHOLDER_SLIDE_IMG,
        x: 55, y: 10, ancho: 40, alto: 80,
        ajuste: 'contener',
      } as Block);
    } else {
      bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32));
      const texto = [
        contenido.texto_principal ?? '',
        contenido.ejemplo ? `\nEjemplo: ${contenido.ejemplo}` : '',
        contenido.pregunta_reflexion ? `\n💭 ${contenido.pregunta_reflexion}` : '',
      ].filter(Boolean).join('');
      if (texto) {
        bloques.push(buildTemplateTextBlock(texto, 5, 20, 90, 72, 18));
      }
    }
    return bloques;
  }

  // ── 5. ESTRUCTURA → dos_columnas si hay tabla, titulo_y_contenido si no ─
  if (tipo === 'estructura') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 28));
    if (contenido.tabla) {
      const colIzq = contenido.tabla.encabezados.join('\n');
      const colDer = contenido.tabla.filas.map((f) => f[0] ?? '').join('\n');
      bloques.push(buildTemplateTextBlock(colIzq, 5, 20, 44, 72, 16));
      bloques.push(buildTemplateTextBlock(colDer, 51, 20, 44, 72, 16));
    } else {
      const texto = [
        contenido.texto_principal ?? '',
        contenido.lista_items ? '\n' + contenido.lista_items.map((i) => `• ${i}`).join('\n') : '',
      ].filter(Boolean).join('');
      if (texto) {
        bloques.push(buildTemplateTextBlock(texto, 5, 20, 90, 72, 18));
      }
    }
    return bloques;
  }

  // ── 6. COMPARACIÓN → dos_columnas ────────────────────────────────────────
  if (tipo === 'comparacion') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 10, 24));
    if (contenido.tabla && contenido.tabla.filas.length >= 1) {
      const col1 = contenido.tabla.filas.map((f) => `${f[0] ?? ''}`).join('\n');
      const col2 = contenido.tabla.filas.map((f) => `${f[1] ?? ''}`).join('\n');
      const header1 = contenido.tabla.encabezados[0] ?? 'Columna 1';
      const header2 = contenido.tabla.encabezados[1] ?? 'Columna 2';
      bloques.push(buildTemplateTextBlock(`${header1}\n\n${col1}`, 5, 15, 44, 80, 16));
      bloques.push(buildTemplateTextBlock(`${header2}\n\n${col2}`, 51, 15, 44, 80, 16));
    } else {
      bloques.push(buildTemplateTextBlock(contenido.texto_principal ?? '', 5, 15, 44, 80, 16));
      bloques.push(buildTemplateTextBlock(contenido.ejemplo ?? '', 51, 15, 44, 80, 16));
    }
    return bloques;
  }

  // ── 7. ACTIVIDAD → titulo_y_contenido ────────────────────────────────────
  if (tipo === 'actividad') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32));
    const desc = slide.actividad_lumina?.descripcion ?? contenido.texto_principal ?? '';
    const preguntas = slide.actividad_lumina?.preguntas_ejemplo ?? [];
    const texto = [
      desc,
      preguntas.length > 0
        ? '\n\nPreguntas:\n' + preguntas.map((p, i) => `${i + 1}. ${p}`).join('\n')
        : '',
    ].filter(Boolean).join('');
    if (texto) {
      bloques.push(buildTemplateTextBlock(texto, 5, 20, 90, 72, 18));
    }
    return bloques;
  }

  // ── 8. CIERRE → titulo_y_contenido ───────────────────────────────────────
  if (tipo === 'cierre') {
    bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32));
    const partes: string[] = [];
    if (contenido.texto_principal) partes.push(contenido.texto_principal);
    if (contenido.lista_items?.length) {
      partes.push('\n' + contenido.lista_items.map((i) => `✅ ${i}`).join('\n'));
    }
    if (contenido.conexion_dba) partes.push(`\n📚 DBA: ${contenido.conexion_dba}`);
    if (contenido.instruccion_docente) partes.push(`\nTarea: ${contenido.instruccion_docente}`);
    if (partes.length > 0) {
      bloques.push(buildTemplateTextBlock(partes.join(''), 5, 20, 90, 72, 16));
    }
    return bloques;
  }

  // ── Fallback → titulo_y_contenido ────────────────────────────────────────
  bloques.push(buildTemplateTextBlock(title ?? '', 5, 3, 90, 15, 32));
  if (contenido.texto_principal) {
    bloques.push(buildTemplateTextBlock(contenido.texto_principal, 5, 20, 90, 72, 18));
  }
  return bloques;
}

function IaProviderBar() {
  const { data } = useAiSettings();
  const setPreferred = useSetPreferredAiProvider();
  if (!data) return null;

  return (
    <div className="mb-3 space-y-1.5 rounded-md border border-border bg-muted/30 px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] leading-snug text-muted-foreground">
          {data.resolvedProvider
            ? `Usando ${describeAiResolvedStatus(data)}`
            : 'Sin proveedor disponible'}
        </p>
        <Link
          href="/profile#ai-keys"
          className="shrink-0 text-[10px] font-medium text-primary hover:underline"
        >
          Claves
        </Link>
      </div>
      <AiPreferredProviderSelect
        settings={data}
        size="sm"
        disabled={setPreferred.isPending}
        onChange={(provider) => {
          setPreferred.mutate(provider, {
            onError: (err) =>
              toast.error(apiErrorMessage(err, 'No se pudo cambiar el proveedor.')),
          });
        }}
      />
    </div>
  );
}

function IaPanel({
  desempenoEnunciado,
  onCreateActivitySlide,
}: {
  desempenoEnunciado?: string;
  onCreateActivitySlide?: (content: Record<string, unknown>, title: string) => void;
}) {
  // ── Estado del formulario ─────────────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [plantilla, setPlantilla] = useState<PlantillaPedagogica>('libre');
  const [area, setArea] = useState<AreaCurricular | ''>('');
  const [grado, setGrado] = useState<GradoEscolar | ''>('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  // ── Estado del documento ──────────────────────────────────────────────────
  const [docTexto, setDocTexto] = useState('');
  const [docTopico, setDocTopico] = useState('');
  const [leyendoPDF, setLeyendoPDF] = useState(false);

  // ── Último resultado ──────────────────────────────────────────────────────
  const [resultado, setResultado] = useState<ContentAssistantResult | null>(null);
  const [ultimaFuente, setUltimaFuente] = useState<'clase' | 'documento'>('clase');

  // ── Modo conversacional ───────────────────────────────────────────────────
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [refinementInput, setRefinementInput] = useState('');

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const {
    curriculumData,
    curriculumContext,
    loading: loadingCurriculum,
    error: errorCurriculum,
    load: loadDba,
    clear: clearDba,
  } = useCurriculumLoader();
  const { mutate: generateClase, isPending: pendingClase } = useContentAssistant();
  const { mutate: generateDoc, isPending: pendingDoc } = useGenerateFromDocument();
  const { mutate: refine, isPending: pendingRefine } = useRefineStructure();

  const plantillaConfig = PLANTILLAS.find((p) => p.id === plantilla) ?? PLANTILLAS[0];

  // ── Cargar DBA cuando cambia área/grado ───────────────────────────────────
  const handleAreaChange = (v: string) => {
    setArea(v as AreaCurricular);
    if (v && grado) loadDba(v as AreaCurricular, grado as GradoEscolar);
    else clearDba();
  };
  const handleGradoChange = (v: string) => {
    setGrado(v as GradoEscolar);
    if (area && v) loadDba(area as AreaCurricular, v as GradoEscolar);
    else clearDba();
  };

  // ── Leer PDF con FileReader ───────────────────────────────────────────────
  const handlePDFFile = useCallback((file: File) => {
    if (file.type === 'application/pdf') {
      setLeyendoPDF(true);
      // Para PDF usamos FileReader con readAsText — extrae texto plano si el PDF no está escaneado
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) ?? '';
        // Limpiar caracteres no imprimibles comunes en PDFs
        const cleaned = text
          .replace(/[^\x20-\x7E\n\r\táéíóúÁÉÍÓÚñÑüÜ¿¡]/g, ' ')
          .replace(/\s{3,}/g, ' ')
          .trim();
        setDocTexto(cleaned);
        setLeyendoPDF(false);
      };
      reader.onerror = () => {
        setDocTexto('');
        setLeyendoPDF(false);
        toast.error('No se pudo leer el PDF. Intenta pegando el texto directamente.');
      };
      reader.readAsText(file);
    } else {
      // .txt u otros
      const reader = new FileReader();
      reader.onload = (e) => setDocTexto((e.target?.result as string) ?? '');
      reader.readAsText(file);
    }
  }, []);

  // ── Insertar resultado en el editor ──────────────────────────────────────
  const handleInsertar = useCallback(
    (res: ContentAssistantResult) => {
      if (!res.structure?.slides?.length) {
        toast.error('La estructura generada no tiene slides');
        return;
      }

      const keywords = ultimaFuente === 'documento' ? docTopico : topic;
      let slidesCreadosCount = 0;

      res.structure.slides.forEach((slide, index) => {
        const esEsquemaNuevo = 'contenido' in slide && slide.contenido !== undefined;

        let bloques: Block[];
        if (esEsquemaNuevo) {
          bloques = buildBloquesDesdeSlideIA(slide as GeneratedSlideStructure);
        } else {
          const s = slide as any;
          bloques = [
            buildTemplateTextBlock(s.title ?? '', 5, 3, 90, 15, 32),
            buildTemplateTextBlock(
              (s.bulletPoints ?? []).map((bp: string) => `• ${bp}`).join('\n'),
              5, 20, 90, 72, 18,
            ),
          ];
        }

        const titulo = (slide as any).title ?? 'Slide';
        const layoutKey = layoutDesdeSlideIA(slide);
        const content: Record<string, unknown> = { bloques, layout: layoutKey };
        onCreateActivitySlide?.(content, titulo);
        slidesCreadosCount++;

        // Después de la portada (índice 0), insertar slide curricular si hay datos DBA
        if (index === 0 && curriculumData) {
          const slideCurricular = buildSlideContextoCurricular(curriculumData, keywords);
          if (slideCurricular) {
            onCreateActivitySlide?.(
              { bloques: slideCurricular.bloques, layout: slideCurricular.layout },
              slideCurricular.titulo,
            );
            slidesCreadosCount++;
          }
        }
      });

      toast.success(`${slidesCreadosCount} slides creados`);
      setResultado(null);
      setConversationHistory([]);
    },
    [onCreateActivitySlide, curriculumData, topic, docTopico, ultimaFuente],
  );

  // ── Generar desde tema ────────────────────────────────────────────────────
  const handleGenerarClase = () => {
    if (!topic.trim()) return;
    setConversationHistory([]);
    // Inyectar plantilla pedagógica en el topic cuando no es libre
    const effectiveTopic =
      plantilla !== 'libre'
        ? `${topic.trim()}\n\nEstructura pedagógica requerida: ${plantillaConfig.estructura}`
        : topic.trim();
    generateClase(
      {
        topic: effectiveTopic,
        slideCount: plantillaConfig.slideCount,
        level,
      },
      {
        onSuccess: (data) => {
          setResultado(data);
          setUltimaFuente('clase');
        },
        onError: (err) => toast.error(apiErrorMessage(err, 'Error al generar. Verifica tu conexión.')),
      },
    );
  };

  // ── Generar desde documento ───────────────────────────────────────────────
  const handleGenerarDesdeDoc = () => {
    if (!docTexto.trim()) return;
    setConversationHistory([]);
    generateDoc(
      {
        documentText: docTexto.trim(),
        topic: docTopico.trim() || undefined,
        grade: grado || undefined,
        subject: area ? AREAS_LABELS[area] : undefined,
        slideCount: plantillaConfig.slideCount,
        level,
        curriculumContext: curriculumContext ?? undefined,
      },
      {
        onSuccess: (data) => {
          setResultado(data);
          setUltimaFuente('documento');
        },
        onError: (err) => toast.error(apiErrorMessage(err, 'Error al generar desde el documento.')),
      },
    );
  };

  // ── Refinamiento conversacional ───────────────────────────────────────────
  const handleRefinar = () => {
    if (!refinementInput.trim() || !resultado) return;
    const instruction = refinementInput.trim();
    setRefinementInput('');
    // Agregar mensaje del usuario al historial
    const newHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: instruction },
    ];
    setConversationHistory(newHistory);
    refine(
      {
        currentStructure: resultado.structure as unknown as Record<string, unknown>,
        instruction,
        conversationHistory: newHistory,
      },
      {
        onSuccess: (data) => {
          // Actualizar resultado con la nueva estructura
          setResultado((prev) => (prev ? { ...prev, structure: data.structure } : prev));
          // Agregar respuesta de la IA al historial
          setConversationHistory((prev) => [
            ...prev,
            {
              role: 'assistant' as const,
              content: `Aplicado: "${instruction}". La clase ahora tiene ${data.structure.slides?.length ?? 0} slides.`,
            },
          ]);
        },
        onError: (err) => {
          toast.error(apiErrorMessage(err, 'No se pudo aplicar el ajuste. Intenta de nuevo.'));
          // Revertir el mensaje del usuario del historial
          setConversationHistory((prev) => prev.slice(0, -1));
        },
      },
    );
  };

  // ── Pantalla de resultado ─────────────────────────────────────────────────
  if (resultado) {
    const keyConcepts =
      ultimaFuente === 'documento'
        ? ((resultado.structure as { keyConceptsExtracted?: string[] })
            .keyConceptsExtracted ?? [])
        : [];
    return (
      <ScrollArea className="h-full min-h-0">
        <div className="space-y-3 p-3">
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">{resultado.structure.title}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{resultado.structure.description}</p>
          </div>
          {/* Conceptos extraídos (solo desde documento) */}
          {keyConcepts.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Conceptos identificados
              </p>
              <div className="flex flex-wrap gap-1">
                {keyConcepts.slice(0, 8).map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">⏱ {resultado.structure.estimatedDuration}</p>
          {resultado.structure.learningObjectives.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Objetivos</p>
              <ul className="space-y-0.5">
                {resultado.structure.learningObjectives.map((obj, i) => (
                  <li key={i} className="text-[11px] leading-snug text-foreground">
                    • {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Slides ({resultado.structure.slides.length})
            </p>
            <div className="space-y-1">
              {resultado.structure.slides.map((s) => (
                <div
                  key={s.order}
                  className="flex items-start gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold tabular-nums text-muted-foreground">
                    {s.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-foreground leading-tight">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">{s.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ── Modo conversacional ── */}
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ajustar con IA
            </p>
            {/* Historial de ajustes */}
            {conversationHistory.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {conversationHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-[11px] leading-snug',
                      msg.role === 'user'
                        ? 'bg-primary/10 text-primary ml-4'
                        : 'bg-muted/50 text-muted-foreground mr-4',
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
            {/* Input de instrucción */}
            <div className="flex gap-1.5">
              <Input
                placeholder='Ej: "quita el slide 3", "hazlo más simple", "agrega una actividad de repaso"'
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !pendingRefine && handleRefinar()}
                className="text-xs h-8 flex-1"
                disabled={pendingRefine}
              />
              <Button
                type="button"
                size="sm"
                className="h-8 px-2.5"
                disabled={!refinementInput.trim() || pendingRefine}
                onClick={handleRefinar}
              >
                {pendingRefine ? (
                  <span className="text-[10px]">...</span>
                ) : (
                  <Sparkles className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleInsertar(resultado)}
            >
              Insertar en editor
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setResultado(null)}
            >
              Nueva
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
        <IaProviderBar />
        <Tabs defaultValue="clase">
          <TabsList className="w-full mb-3 h-auto">
            <TabsTrigger value="clase" className="flex-1 text-[11px] px-1 py-1.5 truncate">
              Desde tema
            </TabsTrigger>
            <TabsTrigger value="documento" className="flex-1 text-[11px] px-1 py-1.5 truncate">
              Desde doc.
            </TabsTrigger>
          </TabsList>

          {/* ── Pestaña: Desde tema ── */}
          <TabsContent value="clase" className="space-y-3 mt-0">
            {/* Plantilla pedagógica */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Plantilla pedagógica</Label>
              <Select value={plantilla} onValueChange={(v) => setPlantilla(v as PlantillaPedagogica)}>
                <SelectTrigger className="h-8 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANTILLAS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="ml-1 text-muted-foreground">— {p.descripcion}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plantilla !== 'libre' && (
                <p className="text-[10px] text-muted-foreground leading-snug">{plantillaConfig.estructura}</p>
              )}
            </div>
            {/* Área y grado (DBA) */}
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Área</Label>
                <Select value={area} onValueChange={handleAreaChange}>
                  <SelectTrigger className="h-8 text-xs w-full" size="sm">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREAS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Grado</Label>
                <Select value={grado} onValueChange={handleGradoChange}>
                  <SelectTrigger className="h-8 text-xs w-full" size="sm">
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Primaria
                    </div>
                    {GRADOS_PRIMARIA.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">Grado {g}°</SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-t mt-1 pt-2">
                      Bachillerato
                    </div>
                    {GRADOS_BACHILLERATO.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">Grado {g}°</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Indicador DBA cargado */}
            {loadingCurriculum && (
              <p className="text-[10px] text-muted-foreground">Cargando contexto DBA...</p>
            )}
            {curriculumData && !loadingCurriculum && Array.isArray(curriculumData.unidades) && (
              <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1.5 dark:bg-green-950/30">
                <div className="size-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] text-green-700 dark:text-green-400">
                  {curriculumData.unidades.length} unidades DBA cargadas — la clase se alineará al MEN
                </p>
              </div>
            )}
            {errorCurriculum && <p className="text-[10px] text-amber-600">{errorCurriculum}</p>}
            {/* Tema */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tema de la clase</Label>
              <Input
                placeholder={
                  desempenoEnunciado ? 'O escribe un tema personalizado…' : 'Ej: La célula eucariota, Grado 7'
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerarClase()}
                className="text-xs"
              />
            </div>
            {/* Nivel */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nivel</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                <SelectTrigger className="h-8 text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner" className="text-xs">
                    Básico (primaria)
                  </SelectItem>
                  <SelectItem value="intermediate" className="text-xs">
                    Intermedio (secundaria)
                  </SelectItem>
                  <SelectItem value="advanced" className="text-xs">
                    Avanzado (media)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {desempenoEnunciado && (
              <div className="rounded-md border border-border bg-muted/30 p-2">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Desempeño
                </p>
                <p className="line-clamp-3 text-[11px] leading-snug text-foreground">{desempenoEnunciado}</p>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              className="w-full gap-2"
              disabled={!topic.trim() || pendingClase}
              onClick={handleGenerarClase}
            >
              <Sparkles className="size-3.5" />
              {pendingClase ? 'Generando…' : 'Generar clase'}
            </Button>
          </TabsContent>

          {/* ── Pestaña: Desde documento ── */}
          <TabsContent value="documento" className="space-y-3 mt-0">
            {/* Upload de PDF */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Subir archivo</Label>
              <FileUpload
                accept=".pdf,.txt"
                maxSizeMB={5}
                label="Arrastra un PDF o TXT"
                sublabel="El texto se extrae automáticamente"
                onFile={handlePDFFile}
                onClear={() => setDocTexto('')}
                disabled={leyendoPDF}
              />
              {leyendoPDF && <p className="text-[10px] text-muted-foreground">Leyendo PDF...</p>}
            </div>
            {/* O pegar texto */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">O pega el texto directamente</Label>
              <Textarea
                placeholder="Pega aquí el contenido del documento, apuntes, o texto del libro..."
                value={docTexto}
                onChange={(e) => setDocTexto(e.target.value)}
                rows={5}
                className="text-xs resize-none"
              />
              {docTexto.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-right">
                  {docTexto.length.toLocaleString()} caracteres
                  {docTexto.length > 6000 && ' (se usarán los primeros 6.000)'}
                </p>
              )}
            </div>
            {/* Tema opcional */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tema enfocado (opcional)</Label>
              <Input
                placeholder="Enfoca en un aspecto específico del documento"
                value={docTopico}
                onChange={(e) => setDocTopico(e.target.value)}
                className="text-xs"
              />
            </div>
            {/* Área y grado reutilizados */}
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Área (opcional)</Label>
                <Select value={area} onValueChange={handleAreaChange}>
                  <SelectTrigger className="h-8 text-xs w-full" size="sm">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREAS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Grado (opcional)</Label>
                <Select value={grado} onValueChange={handleGradoChange}>
                  <SelectTrigger className="h-8 text-xs w-full" size="sm">
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADOS_BACHILLERATO.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">
                        Grado {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {curriculumData && !loadingCurriculum && Array.isArray(curriculumData.unidades) && (
              <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1.5 dark:bg-green-950/30">
                <div className="size-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] text-green-700 dark:text-green-400">
                  Contexto DBA cargado — alineación MEN activa
                </p>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              className="w-full gap-2"
              disabled={!docTexto.trim() || pendingDoc || leyendoPDF}
              onClick={handleGenerarDesdeDoc}
            >
              <Sparkles className="size-3.5" />
              {pendingDoc ? 'Analizando documento…' : 'Generar desde documento'}
            </Button>
            <p className="text-[10px] leading-snug text-muted-foreground">
              La IA analizará el documento y creará una clase basada en su contenido. Los PDFs
              escaneados (solo imagen) no pueden extraerse — usa texto copiado en ese caso.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
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
    onAddWidget,
  } = props;
  const disabled = !apiSlide || busy;

  switch (panel) {
    case 'elementos':
      return <ElementosPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabled} slideHasActivity={slideHasActivity} />;
    case 'widgets':
      return (
        <WidgetsInsertPanel
          disabled={disabled}
          slideHasActivity={slideHasActivity}
          onAddWidget={onAddWidget}
        />
      );
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
      return (
        <IaPanel
          desempenoEnunciado={desempenoEnunciado}
          onCreateActivitySlide={props.onCreateActivitySlide}
        />
      );
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
