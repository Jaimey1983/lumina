'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface DesempenoGenerado {
  tipo: string;
  enunciado: string;
  indicadores: {
    superior: string;
    alto: string;
    basico: string;
    bajo: string;
  };
  area: string;
  grado: string;
  tema: string;
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
  return {
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
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewClassModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (desempeno: DesempenoGenerado) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewClassModal({
  classId: _classId,
  isOpen,
  onClose,
  onConfirm,
}: NewClassModalProps) {
  // Form
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
    }
  }, [isOpen]);

  const canGenerate = !!area && !!grado && !!tema.trim() && !!tipo;

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setDraft(null);
    try {
      const { data } = await api.post<DesempenoGenerado>(
        '/curriculum/generate-desempeno',
        { area, grado, tema: tema.trim(), tipo },
      );
      setDraft(data);
    } catch {
      // Endpoint not yet available — use mock data to unblock frontend development
      setDraft(buildMock(area, grado, tema.trim(), tipo));
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

  function handleConfirm() {
    if (!draft) return;
    onConfirm(draft);
  }

  function handleOpenChange(open: boolean) {
    if (!open) onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
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

            {/* Tema */}
            <div className="space-y-1.5">
              <label className="text-[0.8125rem] font-medium leading-none">
                Tema
              </label>
              <Input
                placeholder="Ej: Fracciones equivalentes, El Sistema Solar, La célula..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canGenerate) handleGenerate();
                }}
              />
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

              {/* Indicadores — 2×2 grid */}
              <div className="space-y-1.5">
                <p className="text-[0.8125rem] font-medium leading-none">
                  Indicadores de desempeño
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
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!draft}>
            Confirmar y abrir editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
