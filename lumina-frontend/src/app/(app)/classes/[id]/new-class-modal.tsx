'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { useUpdateClass } from '@/hooks/api/use-classes';
import { useCourse } from '@/hooks/api/use-course';
import { cn } from '@/lib/utils';
import {
  AREAS_LABELS,
  type AreaCurricular,
  type CurriculumData,
} from '@lumina/curriculum-data';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Textarea } from '@lumina/ui/textarea';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lumina/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@lumina/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@lumina/ui/command';

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface DesempenoGenerado {
  tipo: string;
  enunciado: string;
  /**
   * Escala de valoración de REFERENCIA (Decreto 1290) para calificar el
   * desempeño completo — NO son indicadores de desempeño reales (J4). Ver
   * `indicadoresDeDesempeno` para los indicadores observables distintos.
   */
  indicadores: {
    superior: string;
    alto: string;
    basico: string;
    bajo: string;
  };
  /**
   * Indicadores de desempeño reales (J4) — 3 a 5 enunciados observables y
   * distintos entre sí, del tipo pedagógico de `tipo` (D3).
   */
  indicadoresDeDesempeno: string[];
  area: string;
  grado: string;
  tema: string;
  actividadesSugeridas: string[];
}

// ─── Form options ─────────────────────────────────────────────────────────────

const AREAS = [
  'Matemáticas',
  'Ciencias Naturales',
  'Lenguaje',
  'Ciencias Sociales',
  'Inglés',
  'Educación Física',
  'Arte',
  'Tecnología',
] as const;

const GRADOS = Array.from({ length: 11 }, (_, i) => `${i + 1}°`);

const TIPOS = ['Cognitivo', 'Procedimental', 'Actitudinal'] as const;

// ─── Indicator config ─────────────────────────────────────────────────────────

const INDICATORS: Array<{
  key: keyof DesempenoGenerado['indicadores'];
  label: string;
  labelClass: string;
  badgeClass: string;
}> = [
  {
    key: 'superior',
    label: 'Superior',
    labelClass: 'text-green-700 dark:text-green-400',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  {
    key: 'alto',
    label: 'Alto',
    labelClass: 'text-blue-700 dark:text-blue-400',
    badgeClass:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    key: 'basico',
    label: 'Básico',
    labelClass: 'text-amber-700 dark:text-amber-500',
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    key: 'bajo',
    label: 'Bajo',
    labelClass: 'text-red-700 dark:text-red-400',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
];

// ─── Actividades simuladas (si el API no envía el campo) ─────────────────────

function buildActividadesSimuladas(
  tipo: string,
  tema: string,
  area: string,
): string[] {
  if (tipo === 'Cognitivo') {
    return [
      `Mapa conceptual grupal sobre ${tema} en ${area} con corrección entre pares.`,
      `Lectura breve + preguntas de inferencia y justificación oral.`,
      `Análisis de un caso vinculado a ${tema} con puesta en común.`,
      `Juego de roles para argumentar distintas perspectivas del tema.`,
      `Autoevaluación con rúbrica alineada a los cuatro indicadores.`,
    ];
  }
  if (tipo === 'Procedimental') {
    return [
      `Demostración docente y práctica guiada del procedimiento clave de ${tema}.`,
      `Taller en parejas: resolver 3 situaciones tipo con retroalimentación.`,
      `Estación de práctica autónoma con lista de verificación paso a paso.`,
      `Mini reto aplicado: usar ${tema} en un contexto del aula o del hogar.`,
      `Revisión cruzada usando los criterios del nivel alto y superior.`,
    ];
  }
  return [
    `Reflexión escrita: valoración personal frente a ${tema}.`,
    `Acuerdos de trabajo en equipo relacionados con el propósito de ${area}.`,
    `Simulación o dramatización para practicar la actitud esperada.`,
    `Círculo de cierre: reconocimientos y compromisos para la siguiente clase.`,
  ];
}

export function withActividadesSugeridas(d: DesempenoGenerado): DesempenoGenerado {
  const raw = d.actividadesSugeridas;
  if (Array.isArray(raw) && raw.length >= 3) {
    const cleaned = raw
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 5);
    if (cleaned.length >= 3) {
      return { ...d, actividadesSugeridas: cleaned };
    }
  }
  return {
    ...d,
    actividadesSugeridas: buildActividadesSimuladas(d.tipo, d.tema, d.area),
  };
}

// ─── Indicadores de desempeño reales simulados (J4, mismo banco de verbos
// determinista que `buildIndicadoresFallback` en curriculum.service.ts) ──────

const VERBOS_POR_TIPO_SIMULADO: Record<string, [string, string, string, string]> = {
  Cognitivo: ['Identifica', 'Explica', 'Analiza', 'Compara'],
  Procedimental: ['Aplica', 'Utiliza', 'Desarrolla', 'Resuelve'],
  Actitudinal: ['Respeta', 'Participa', 'Reconoce', 'Asume'],
};

function buildIndicadoresDeDesempenoSimulados(
  tipo: string,
  tema: string,
  area: string,
  grado: string,
): string[] {
  const [v1, v2, v3, v4] =
    VERBOS_POR_TIPO_SIMULADO[tipo] ?? VERBOS_POR_TIPO_SIMULADO.Cognitivo;
  return [
    `${v1} los conceptos fundamentales de ${tema} en situaciones cotidianas de ${area}.`,
    `${v2} ${tema} para resolver una situación propuesta en clase, propia del grado ${grado}.`,
    `${v3} relaciones entre ${tema} y otros contenidos ya trabajados en ${area}.`,
    `${v4} lo aprendido sobre ${tema} en una producción propia (oral, escrita o gráfica).`,
  ];
}

export function withIndicadoresDeDesempeno(d: DesempenoGenerado): DesempenoGenerado {
  const raw = d.indicadoresDeDesempeno;
  if (Array.isArray(raw) && raw.length >= 3) {
    const cleaned = raw
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 5);
    if (cleaned.length >= 3) {
      return { ...d, indicadoresDeDesempeno: cleaned };
    }
  }
  return {
    ...d,
    indicadoresDeDesempeno: buildIndicadoresDeDesempenoSimulados(
      d.tipo,
      d.tema,
      d.area,
      d.grado,
    ),
  };
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function buildMock(
  area: string,
  grado: string,
  tema: string,
  tipo: string,
): DesempenoGenerado {
  const verbo =
    tipo === 'Cognitivo'
      ? 'comprende y analiza'
      : tipo === 'Procedimental'
        ? 'aplica y desarrolla procedimientos para trabajar con'
        : 'valora y asume una actitud crítica frente a';
  return withActividadesSugeridas(
    withIndicadoresDeDesempeno({
      tipo,
      area,
      grado,
      tema,
      enunciado: `El estudiante ${verbo} los conceptos fundamentales de "${tema}" en el área de ${area}, integrando saberes propios del grado ${grado} para construir aprendizajes significativos en su contexto.`,
      indicadores: {
        superior: `Analiza de manera autónoma los conceptos de "${tema}", establece relaciones con situaciones del entorno real y propone soluciones creativas, sustentando sus argumentos con rigor y originalidad.`,
        alto: `Comprende y aplica los conceptos de "${tema}" en contextos conocidos, demuestra dominio de los contenidos del grado ${grado} y resuelve situaciones con seguridad y fluidez.`,
        basico: `Identifica los conceptos esenciales de "${tema}" y los aplica en situaciones sencillas con orientación del docente, alcanzando los mínimos requeridos para el grado ${grado}.`,
        bajo: `Presenta dificultades para comprender y aplicar los conceptos de "${tema}", requiere acompañamiento permanente y no alcanza los desempeños mínimos establecidos para el grado ${grado}.`,
      },
      indicadoresDeDesempeno: [],
      actividadesSugeridas: [],
    }),
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewClassModalProps {
  classId: string;
  /**
   * Curso dueño de la clase — J3 (D4/D6): si el curso ya tiene `area`/`grado`
   * (J1), el modal los hereda y deja de pedirlos; solo pregunta tema (+
   * tipo). Si el curso no los tiene (curso legado, creado antes de J1, o con
   * un área fuera de las 5 del dataset MEN), se degrada al selector manual
   * de siempre — no bloquea al docente.
   */
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (desempeno: DesempenoGenerado) => void;
  /** When true the modal cannot be dismissed until onConfirm is called. */
  required?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewClassModal({
  classId,
  courseId,
  isOpen,
  onClose,
  onConfirm,
  required = false,
}: NewClassModalProps) {
  const updateClass = useUpdateClass(classId, '');
  const { data: course } = useCourse(courseId);

  // Contexto heredado del curso (J1/J3) — `grado` ya viene en dígitos
  // ("5", no "5°") porque así lo guarda `Course.grado` desde J1.
  const courseArea = course?.area ?? null;
  const courseGrado = course?.grado ?? null;
  const inheritedAreaLabel = courseArea
    ? (AREAS_LABELS[courseArea as AreaCurricular] ?? courseArea)
    : null;
  const hasInheritedContext = !!inheritedAreaLabel && !!courseGrado;

  // Plan de área real (J2) para el desplegable de temas/subtemas — el mismo
  // endpoint que ya expone GET /curriculum/:area/:grado. Solo se pide con
  // contexto heredado (el picker manual no tiene área/grado normalizados
  // hasta que el docente elige, y ese caso no es el foco de esta mejora).
  const { data: curriculumUnit } = useQuery({
    queryKey: ['curriculum-unit', courseArea, courseGrado],
    queryFn: async () => {
      const { data } = await api.get<CurriculumData>(
        `/curriculum/${courseArea}/${courseGrado}`,
      );
      return data;
    },
    enabled: hasInheritedContext,
    staleTime: Infinity,
  });

  // Temas + subtemas de las unidades curadas (sin placeholders, D1), sin
  // duplicados — el docente elige uno o escribe el suyo (D6: "si no está,
  // buscar semántico/internet" ya lo resuelve el backend, J3-seguimiento).
  const temaOptions = useMemo(() => {
    if (!curriculumUnit?.unidades) return [];
    const seen = new Set<string>();
    const opciones: string[] = [];
    for (const u of curriculumUnit.unidades) {
      if (u.unidad_titulo.trim().toLowerCase().startsWith('placeholder')) continue;
      for (const s of [u.unidad_titulo, ...u.temas, ...u.subtemas]) {
        const v = s.trim();
        const key = v.toLowerCase();
        if (v && !seen.has(key)) {
          seen.add(key);
          opciones.push(v);
        }
      }
    }
    return opciones;
  }, [curriculumUnit]);

  const [temaPopoverOpen, setTemaPopoverOpen] = useState(false);

  // Form (solo se usa si el curso NO tiene área/grado — fallback manual)
  const [area, setArea] = useState('');
  const [grado, setGrado] = useState('');
  const [tema, setTema] = useState('');
  const [tipo, setTipo] = useState('');

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<DesempenoGenerado | null>(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setArea('');
      setGrado('');
      setTema('');
      setTipo('');
      setDraft(null);
      setTemaPopoverOpen(false);
    }
  }, [isOpen]);

  const effectiveArea = hasInheritedContext ? inheritedAreaLabel! : area;
  // El picker manual usa "5°" (formato histórico de UI); el heredado ya es
  // "5" (formato del dataset, J1). Se envía siempre sin el símbolo de grado.
  const effectiveGrado = (hasInheritedContext ? courseGrado! : grado).replace(
    '°',
    '',
  );

  const canGenerate =
    !!effectiveArea && !!effectiveGrado && !!tema.trim() && !!tipo;

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setDraft(null);
    try {
      const { data } = await api.post<DesempenoGenerado>(
        '/curriculum/generate-desempeno',
        { area: effectiveArea, grado: effectiveGrado, tema: tema.trim(), tipo },
      );
      setDraft(withActividadesSugeridas(withIndicadoresDeDesempeno(data)));
    } catch {
      // Endpoint not yet available — use mock data to unblock frontend development
      setDraft(buildMock(effectiveArea, effectiveGrado, tema.trim(), tipo));
    } finally {
      setIsGenerating(false);
    }
  }

  function updateEnunciado(value: string) {
    setDraft((p) => (p ? { ...p, enunciado: value } : p));
  }

  function updateIndicador(
    key: keyof DesempenoGenerado['indicadores'],
    value: string,
  ) {
    setDraft((p) =>
      p ? { ...p, indicadores: { ...p.indicadores, [key]: value } } : p,
    );
  }

  function updateIndicadorDeDesempeno(index: number, value: string) {
    setDraft((p) => {
      if (!p) return p;
      const siguiente = [...p.indicadoresDeDesempeno];
      siguiente[index] = value;
      return { ...p, indicadoresDeDesempeno: siguiente };
    });
  }

  function handleConfirm() {
    if (!draft) return;
    updateClass.mutate(
      { desempeno: draft },
      {
        onSuccess: () => {
          onConfirm(draft);
        },
        onError: () => {
          toast.error('No se pudo guardar el desempeño en el servidor');
        },
      },
    );
  }

  function handleOpenChange(open: boolean) {
    if (!open && required) return;
    if (!open) onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl"
        showCloseButton={!required}
        onInteractOutside={required ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={required ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>Configurar contexto curricular</DialogTitle>
          <DialogDescription>
            Completa los campos para generar el desempeño de aprendizaje con IA
            antes de abrir el editor de slides.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">

          {/* ── Form fields ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {hasInheritedContext ? (
              /* Heredado del curso (J1/J3) — ya no se vuelve a preguntar. */
              <div className="space-y-1.5">
                <label className="text-[0.8125rem] font-medium leading-none">
                  Área y grado del curso
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {inheritedAreaLabel}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    Grado {courseGrado}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Área */}
                <div className="space-y-1.5">
                  <label className="text-[0.8125rem] font-medium leading-none">
                    Área
                  </label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grado */}
                <div className="space-y-1.5">
                  <label className="text-[0.8125rem] font-medium leading-none">
                    Grado
                  </label>
                  <Select value={grado} onValueChange={setGrado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADOS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Tema */}
            <div className="space-y-1.5">
              <label className="text-[0.8125rem] font-medium leading-none">
                Tema
              </label>
              {temaOptions.length > 0 ? (
                <Popover open={temaPopoverOpen} onOpenChange={setTemaPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8.5 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring"
                    >
                      <span
                        className={cn(
                          'truncate text-left',
                          !tema && 'text-muted-foreground',
                        )}
                      >
                        {tema || 'Elegí un tema del plan de área o escribí el tuyo...'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-(--radix-popover-trigger-width) p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Buscar o escribir un tema..."
                        value={tema}
                        onValueChange={setTema}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canGenerate) {
                            setTemaPopoverOpen(false);
                            handleGenerate();
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty className="px-3 py-2 text-xs text-muted-foreground">
                          Sin coincidencias en el plan de área — se puede escribir
                          un tema propio; la IA busca la asociación o genera con
                          información de internet.
                        </CommandEmpty>
                        <CommandGroup heading="Temas y subtemas del plan de área">
                          {temaOptions.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={(v) => {
                                setTema(v);
                                setTemaPopoverOpen(false);
                              }}
                            >
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  placeholder="Ej: Fracciones equivalentes, El Sistema Solar, La célula..."
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canGenerate) handleGenerate();
                  }}
                />
              )}
            </div>

            {/* Tipo de desempeño */}
            <div className="space-y-1.5">
              <label className="text-[0.8125rem] font-medium leading-none">
                Tipo de desempeño
              </label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Generate button ────────────────────────────────────────────── */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generando desempeño e indicadores...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generar con IA
              </>
            )}
          </Button>

          {/* ── Preview section ────────────────────────────────────────────── */}
          {draft && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              {/* Divider heading */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Desempeño generado
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-1.5">
                {[draft.area, draft.grado, draft.tipo].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Enunciado */}
              <div className="space-y-1.5">
                <label className="text-[0.8125rem] font-medium leading-none">
                  Enunciado del desempeño
                </label>
                <Textarea
                  rows={3}
                  value={draft.enunciado}
                  onChange={(e) => updateEnunciado(e.target.value)}
                  className="resize-none"
                />
              </div>

              {/* Indicadores de desempeño reales (J4) — enunciados observables
                  distintos entre sí, NO niveles de intensidad. */}
              <div className="space-y-1.5">
                <p className="text-[0.8125rem] font-medium leading-none">
                  Indicadores de desempeño
                </p>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Enunciados observables — cada uno distinto, no una reescritura
                  del mismo desempeño en otra intensidad.
                </p>
                <div className="space-y-2">
                  {draft.indicadoresDeDesempeno.map((ind, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-2 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <Textarea
                        rows={2}
                        variant="sm"
                        value={ind}
                        onChange={(e) => updateIndicadorDeDesempeno(i, e.target.value)}
                        className="flex-1 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Escala de valoración de referencia (Decreto 1290) — NO son
                  indicadores de desempeño (J4); son niveles de intensidad del
                  MISMO desempeño, para calificar el conjunto. */}
              <div className="space-y-1.5">
                <p className="text-[0.8125rem] font-medium leading-none">
                  Escala de valoración de referencia
                </p>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Niveles de intensidad del desempeño completo (Superior/Alto/
                  Básico/Bajo) para orientar la calificación — no son
                  indicadores distintos.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {INDICATORS.map(({ key, label, labelClass, badgeClass }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                            badgeClass,
                          )}
                        >
                          {label}
                        </span>
                        <span className={cn('text-[10px] font-medium', labelClass)}>
                          {label}
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        variant="sm"
                        value={draft.indicadores[key]}
                        onChange={(e) => updateIndicador(key, e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actividades sugeridas */}
              <div className="space-y-1.5">
                <p className="text-[0.8125rem] font-medium leading-none">
                  Actividades sugeridas
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                  {draft.actividadesSugeridas.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {!required && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleConfirm} disabled={!draft || updateClass.isPending}>
            {updateClass.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar y abrir editor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
