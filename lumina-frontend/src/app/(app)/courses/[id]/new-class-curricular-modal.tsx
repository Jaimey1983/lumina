'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  useCreateClass,
  usePublishClass,
  type UpdateClassInput,
} from '@/hooks/api/use-classes';
import {
  useDesempenosCurso,
  useUnidadesDbaParaDesempeno,
  useSubprocesosEbcParaDesempeno,
  useGenerarIndicadoresClase,
  useIndicadoresGuardados,
  useGuardarIndicadores,
  type CaminoCurricular,
  type IndicadoresClase,
} from '@/hooks/api/use-desempenos';
import { EBC_COMPONENTES, ICFES_COMPETENCIAS, type AreaCurricular } from '@lumina/curriculum-data';

import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Textarea } from '@lumina/ui/textarea';
import { Checkbox } from '@lumina/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@lumina/ui/radio-group';
import {
  Dialog,
  DialogBody,
  DialogContent,
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

// ─── Motor curricular único (Etapa J / J6.3, Entrada 2) ────────────────────────
// Modal NUEVO — reemplaza, dentro de `course-detail-client.tsx`, el modal
// local viejo (solo título+estado). El modal legado
// `classes/[id]/new-class-modal.tsx` (post-creación, desde el editor,
// genera un desempeño por clase desde texto libre) NO se toca acá — sigue
// siendo el flujo vigente hasta que J6.6 lo retire (Regla 7: paridad de
// test probada antes de borrarlo).

const SIN_DESEMPENO = '__sin_desempeno__';

interface NewClassCurricularModalProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toggleInSet<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}

function ChecklistSeleccionable({
  items,
  selected,
  onToggle,
  emptyLabel,
}: {
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input p-3 text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
      {items.map((item) => (
        <label key={item} className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={selected.has(item)}
            onCheckedChange={() => onToggle(item)}
            className="mt-0.5"
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

const TIPOS_INDICADOR: Array<{ key: keyof IndicadoresClase; label: string }> = [
  { key: 'cognitivo', label: 'Cognitivo' },
  { key: 'procedimental', label: 'Procedimental' },
  { key: 'actitudinal', label: 'Actitudinal' },
];

export function NewClassCurricularModal({
  courseId,
  open,
  onOpenChange,
}: NewClassCurricularModalProps) {
  const createClass = useCreateClass(courseId);
  const publishClass = usePublishClass(courseId);
  const { data: desempenos = [] } = useDesempenosCurso(courseId);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [desempenoId, setDesempenoId] = useState<string>(SIN_DESEMPENO);
  const [camino, setCamino] = useState<CaminoCurricular | null>(null);
  const [selectedUnidadId, setSelectedUnidadId] = useState<number | null>(null);
  const [selectedEvidencias, setSelectedEvidencias] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSubprocesos, setSelectedSubprocesos] = useState<Set<string>>(
    new Set(),
  );
  // Borrador de la última tanda generada con IA — editable antes de
  // guardarla en el banco reutilizable del desempeño.
  const [borrador, setBorrador] = useState<IndicadoresClase | null>(null);
  // Composite key `${tipo}\u0000${enunciado}` → incluido en la selección
  // final de ESTA clase (guardados reutilizados + recién generados).
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveDesempenoId =
    desempenoId === SIN_DESEMPENO ? null : desempenoId;
  const desempenoElegido = desempenos.find((d) => d.id === effectiveDesempenoId);

  const { data: unidadesDba = [] } = useUnidadesDbaParaDesempeno(
    courseId,
    camino === 'dba' ? effectiveDesempenoId : null,
  );
  const { data: subprocesosEbc = [] } = useSubprocesosEbcParaDesempeno(
    courseId,
    camino === 'ebc' ? effectiveDesempenoId : null,
  );
  const generarIndicadores = useGenerarIndicadoresClase(
    courseId,
    effectiveDesempenoId,
  );
  // Banco reutilizable del desempeño (seguimiento a J6.3) — indicadores ya
  // guardados por esta u otra clase del mismo curso, disponibles para
  // reutilizar sin volver a generarlos con IA.
  const { data: indicadoresGuardados = [] } = useIndicadoresGuardados(
    courseId,
    effectiveDesempenoId,
  );
  const guardarIndicadores = useGuardarIndicadores(
    courseId,
    effectiveDesempenoId,
  );

  const unidadElegida = unidadesDba.find((u) => u.unidadId === selectedUnidadId);
  const evidenciasDisponibles = unidadElegida?.evidenciasAprendizaje ?? [];

  useEffect(() => {
    if (open) {
      setTitle('');
      setStatus('draft');
      setDesempenoId(SIN_DESEMPENO);
      setCamino(null);
      setSelectedUnidadId(null);
      setSelectedEvidencias(new Set());
      setSelectedSubprocesos(new Set());
      setBorrador(null);
      setSeleccionados(new Set());
    }
  }, [open]);

  // Cambiar de camino o de unidad DBA reinicia la selección de contexto y el
  // borrador de indicadores — ya no corresponden al nuevo contexto elegido.
  // El banco guardado del desempeño NO se pierde (vive en el servidor, es
  // reutilizable entre clases), solo la selección puntual de esta clase.
  function handleCaminoChange(next: CaminoCurricular) {
    setCamino(next);
    setSelectedUnidadId(null);
    setSelectedEvidencias(new Set());
    setSelectedSubprocesos(new Set());
    setBorrador(null);
    setSeleccionados(new Set());
  }

  function handleUnidadChange(unidadId: number) {
    setSelectedUnidadId(unidadId);
    setSelectedEvidencias(new Set());
    setBorrador(null);
    setSeleccionados(new Set());
  }

  function indicadorKey(tipo: keyof IndicadoresClase, enunciado: string) {
    return `${tipo}\u0000${enunciado}`;
  }

  function toggleSeleccionado(tipo: keyof IndicadoresClase, enunciado: string) {
    setSeleccionados((prev) => toggleInSet(prev, indicadorKey(tipo, enunciado)));
  }

  const contextoSeleccionado =
    camino === 'dba'
      ? [...selectedEvidencias]
      : camino === 'ebc'
        ? [...selectedSubprocesos]
        : [];
  const canGenerarIndicadores =
    !!camino &&
    (camino === 'dba' ? selectedUnidadId != null : true) &&
    contextoSeleccionado.length > 0;

  async function handleGenerarIndicadores() {
    if (!camino || !canGenerarIndicadores) return;
    try {
      const result = await generarIndicadores.mutateAsync({
        caminoCurricular: camino,
        ...(camino === 'dba'
          ? {
              dbaSeleccionado: {
                unidadId: selectedUnidadId!,
                evidenciasElegidas: [...selectedEvidencias],
              },
            }
          : { ebcSeleccionado: { subprocesosElegidos: [...selectedSubprocesos] } }),
      });
      setBorrador(result);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudieron generar los indicadores'));
    }
  }

  function updateBorrador(tipo: keyof IndicadoresClase, index: number, value: string) {
    setBorrador((prev) => {
      if (!prev) return prev;
      const siguiente = [...prev[tipo]];
      siguiente[index] = value;
      return { ...prev, [tipo]: siguiente };
    });
  }

  // El borrador se identifica por posición (el texto es editable); al
  // marcarlo, la clave real usada en `seleccionados` es la del texto vigente
  // en ese momento — así queda unificado con los indicadores del banco
  // guardado sin necesitar dos mecanismos de selección distintos.
  function toggleBorrador(tipo: keyof IndicadoresClase, index: number) {
    const enunciado = borrador?.[tipo][index]?.trim();
    if (!enunciado) return;
    toggleSeleccionado(tipo, enunciado);
  }

  // Grupos disponibles para elegir: el banco guardado del desempeño + el
  // borrador recién generado (si lo hay), sin repetir texto dentro del
  // mismo tipo.
  const gruposDisponibles = TIPOS_INDICADOR.map(({ key, label }) => {
    const deGuardados = indicadoresGuardados
      .filter((i) => i.tipo === key)
      .map((i) => ({ enunciado: i.enunciado, editable: false, indexBorrador: -1 }));
    const textosGuardados = new Set(deGuardados.map((i) => i.enunciado));
    const deBorrador = (borrador?.[key] ?? [])
      .map((enunciado, indexBorrador) => ({ enunciado, editable: true, indexBorrador }))
      .filter((i) => i.enunciado.trim().length > 0 && !textosGuardados.has(i.enunciado));
    return { key, label, items: [...deGuardados, ...deBorrador] };
  });
  const hayIndicadoresParaElegir = gruposDisponibles.some((g) => g.items.length > 0);

  const requiresIndicadores = !!effectiveDesempenoId;
  const canSubmit =
    title.trim().length > 0 && (!requiresIndicadores || seleccionados.size > 0);

  /** Agrupa por tipo los indicadores marcados en `seleccionados`. */
  function indicadoresFinales(): IndicadoresClase {
    const resultado: IndicadoresClase = {
      cognitivo: [],
      procedimental: [],
      actitudinal: [],
    };
    for (const grupo of gruposDisponibles) {
      resultado[grupo.key] = grupo.items
        .filter((i) => seleccionados.has(indicadorKey(grupo.key, i.enunciado)))
        .map((i) => i.enunciado);
    }
    return resultado;
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const created = await createClass.mutateAsync({
        title: title.trim(),
        courseId,
      });
      if (status === 'published') {
        await publishClass.mutateAsync(created.id);
      }
      if (effectiveDesempenoId && camino && seleccionados.size > 0) {
        const indicadoresElegidos = indicadoresFinales();
        // Persistir en el banco reutilizable (dedupe por texto en el
        // servicio) antes de asociarlos a la clase — así quedan disponibles
        // para elegir de nuevo al crear otra clase del mismo curso.
        try {
          await guardarIndicadores.mutateAsync(indicadoresElegidos);
        } catch {
          // No bloquea la creación de la clase si falla el guardado del
          // banco — los indicadores igual quedan asociados a esta clase.
        }
        const payload: UpdateClassInput = {
          desempenoId: effectiveDesempenoId,
          caminoCurricular: camino,
          ...(camino === 'dba'
            ? {
                dbaSeleccionado: {
                  unidadId: selectedUnidadId!,
                  evidenciasElegidas: [...selectedEvidencias],
                },
              }
            : {
                ebcSeleccionado: { subprocesosElegidos: [...selectedSubprocesos] },
              }),
          indicadores: indicadoresElegidos,
          contextoClase: {
            indicadoresAbordados: [
              ...indicadoresElegidos.cognitivo,
              ...indicadoresElegidos.procedimental,
              ...indicadoresElegidos.actitudinal,
            ],
            temas: [],
            subtemas: [],
          },
        };
        await api.patch(`/classes/${created.id}`, payload);
      }
      toast.success('Clase creada');
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al crear la clase'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isPending =
    isSubmitting || createClass.isPending || publishClass.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva clase</DialogTitle>
        </DialogHeader>

        <DialogBody className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          {/* ── Datos básicos ──────────────────────────────────────────── */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="space-y-1.5">
              <label className="text-[0.8125rem] font-medium leading-none">
                Título
              </label>
              <Input
                placeholder="Título de la clase"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.8125rem] font-medium leading-none">
                Estado
              </label>
              <select
                className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
              </select>
            </div>
          </div>

          {/* ── Desempeño del curso (Entrada 1, J6.2) ──────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[0.8125rem] font-medium leading-none">
              Desempeño del curso
            </label>
            <Select value={desempenoId} onValueChange={setDesempenoId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un desempeño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_DESEMPENO}>
                  Sin desempeño (configurar después)
                </SelectItem>
                {desempenos.map((d) => {
                  const area = d.area as AreaCurricular;
                  const componenteLabel =
                    EBC_COMPONENTES[area]?.find((c) => c.codigo === d.componenteEbc)
                      ?.label ?? d.componenteEbc;
                  const competenciaLabel =
                    ICFES_COMPETENCIAS[area]?.find(
                      (c) => c.codigo === d.competenciaIcfes,
                    )?.label ?? d.competenciaIcfes;
                  return (
                    <SelectItem key={d.id} value={d.id}>
                      {componenteLabel} · {competenciaLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {desempenos.length === 0 && (
              <p className="text-[10px] leading-snug text-muted-foreground">
                Este curso todavía no tiene desempeños generados — se pueden
                crear desde la pestaña &quot;Desempeños&quot; del curso.
              </p>
            )}
            {desempenoElegido && (
              <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                {desempenoElegido.enunciado}
              </p>
            )}
          </div>

          {/* ── Camino curricular EXCLUYENTE (J6) ──────────────────────── */}
          {effectiveDesempenoId && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1.5">
                <p className="text-[0.8125rem] font-medium leading-none">
                  Camino curricular
                </p>
                <RadioGroup
                  value={camino ?? ''}
                  onValueChange={(v) => handleCaminoChange(v as CaminoCurricular)}
                  className="grid-flow-col justify-start gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="dba" id="camino-dba" />
                    <label htmlFor="camino-dba" className="text-sm">
                      DBA (evidencias de aprendizaje)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ebc" id="camino-ebc" />
                    <label htmlFor="camino-ebc" className="text-sm">
                      EBC (subprocesos del componente)
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {camino === 'dba' && (
                <div className="space-y-2">
                  <label className="text-[0.8125rem] font-medium leading-none">
                    Unidad (DBA)
                  </label>
                  <Select
                    value={selectedUnidadId != null ? String(selectedUnidadId) : ''}
                    onValueChange={(v) => handleUnidadChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegí una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDba.map((u) => (
                        <SelectItem key={u.unidadId} value={String(u.unidadId)}>
                          {u.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedUnidadId != null && (
                    <>
                      <p className="text-[0.8125rem] font-medium leading-none">
                        Evidencias de aprendizaje
                      </p>
                      <ChecklistSeleccionable
                        items={evidenciasDisponibles}
                        selected={selectedEvidencias}
                        onToggle={(item) =>
                          setSelectedEvidencias((prev) => toggleInSet(prev, item))
                        }
                        emptyLabel="Esta unidad no tiene evidencias registradas."
                      />
                    </>
                  )}
                </div>
              )}

              {camino === 'ebc' && (
                <div className="space-y-2">
                  <p className="text-[0.8125rem] font-medium leading-none">
                    Subprocesos del componente
                  </p>
                  <ChecklistSeleccionable
                    items={subprocesosEbc}
                    selected={selectedSubprocesos}
                    onToggle={(item) =>
                      setSelectedSubprocesos((prev) => toggleInSet(prev, item))
                    }
                    emptyLabel="Este componente no tiene subprocesos registrados en el dataset."
                  />
                </div>
              )}

              {camino && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!canGenerarIndicadores || generarIndicadores.isPending}
                  onClick={handleGenerarIndicadores}
                >
                  {generarIndicadores.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generando indicadores...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generar indicadores con IA
                    </>
                  )}
                </Button>
              )}

              {hayIndicadoresParaElegir && (
                <div className="space-y-3">
                  <p className="text-[0.8125rem] font-medium leading-none">
                    Indicadores de esta clase
                  </p>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Marcá los que va a abordar esta clase puntual — solo esos
                    van a aparecer en el panel de IA del editor. Los que
                    dejes sin marcar quedan igual guardados en el banco del
                    desempeño, listos para otra clase.
                  </p>
                  {gruposDisponibles.map(({ key, label, items }) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="space-y-1.5">
                        <p className="text-[0.8125rem] font-medium leading-none">
                          {label}
                        </p>
                        <div className="space-y-1.5">
                          {items.map((item) =>
                            item.editable ? (
                              <div key={`borrador-${item.indexBorrador}`} className="flex items-start gap-2">
                                <Checkbox
                                  className="mt-2"
                                  checked={seleccionados.has(indicadorKey(key, item.enunciado))}
                                  onCheckedChange={() => toggleBorrador(key, item.indexBorrador)}
                                />
                                <Textarea
                                  rows={2}
                                  variant="sm"
                                  value={item.enunciado}
                                  onChange={(e) => {
                                    const anterior = item.enunciado;
                                    updateBorrador(key, item.indexBorrador, e.target.value);
                                    // Si el texto viejo estaba marcado, mover la marca al texto nuevo.
                                    setSeleccionados((prev) => {
                                      const k = indicadorKey(key, anterior);
                                      if (!prev.has(k)) return prev;
                                      const next = new Set(prev);
                                      next.delete(k);
                                      next.add(indicadorKey(key, e.target.value));
                                      return next;
                                    });
                                  }}
                                  className="flex-1 resize-none"
                                />
                              </div>
                            ) : (
                              <label
                                key={item.enunciado}
                                className="flex items-start gap-2 text-sm"
                              >
                                <Checkbox
                                  className="mt-0.5"
                                  checked={seleccionados.has(indicadorKey(key, item.enunciado))}
                                  onCheckedChange={() => toggleSeleccionado(key, item.enunciado)}
                                />
                                <span>{item.enunciado}</span>
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear clase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
