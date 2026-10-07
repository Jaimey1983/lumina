'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { partesDeLatex } from '@lumina/editor-shared/rich-text/latex-render';
import { getBlockAtPath } from '@lumina/editor-shared/slide-block-path';
import { ArrowDown, ArrowUp, Copy, Pencil, Plus } from 'lucide-react';
import { Button } from '@lumina/ui/button';
import { FieldHelp } from '@lumina/ui/field-help';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import {
  EVENTOS_DE_ENTORNO,
  estadosPersonalizadosPorBloque,
  sinMarcaDePlantilla,
} from '@lumina/interactions';
import type { ContextoValidacion, ReferenciaRota } from '@lumina/interactions';
import type { Capa, Regla } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import {
  alternarRegla,
  aplicarPlantilla,
  conIdsCandidatos,
  crearContextoDescripcion,
  describirRegla,
  duplicarReglaDeBloque,
  guardarRegla,
  moverReglaDeBloque,
  quitarRegla,
  tipoDeElemento,
} from '../../lib/interacciones';
import type { PlantillaElegida } from '../../lib/interacciones';
import { useClassVariables } from '../../lib/class-variables-context';
import { RuleBuilder } from './rule-builder/rule-builder';

/**
 * Etapa K / K7b — «Interacciones» de un bloque: plantillas (no un constructor
 * libre), lista de las reglas del bloque y aviso de referencias rotas.
 */

export interface InteractionsPanelProps {
  bloques: Block[];
  /** Ruta del bloque seleccionado (`"2"`; las anidadas llevan guiones). */
  blockPath: string;
  slideId: string;
  /** Slides del mazo, para elegir destinos. */
  slidesDelMazo: { id: string; titulo: string }[];
  referenciasRotas: ReferenciaRota[];
  /** Capas del slide activo (destinos de «abrir/cerrar capa» en el constructor). */
  capas?: readonly Capa[];
  onApplyBloques: (next: Block[]) => Promise<boolean>;
}

type Plantilla = 'boton-navega' | 'refuerzo' | 'revelar';

const select =
  'h-8 w-full rounded-md border border-border bg-background px-2 text-xs';

const nuevoIdDeRegla = (): string => `r_${crypto.randomUUID()}`;

const etiquetaTipo = (b: Block): string =>
  elementRegistry.obtener(tipoDeElemento(b))?.catalogo?.nombre ?? b.tipo;

const idDe = (b: Block): string | undefined => {
  const id = (b as { id?: unknown }).id;
  return typeof id === 'string' && id !== '' ? id : undefined;
};

export function InteractionsPanel({
  bloques,
  blockPath,
  slideId,
  slidesDelMazo,
  referenciasRotas,
  capas = [],
  onApplyBloques,
}: InteractionsPanelProps) {
  const block = getBlockAtPath(bloques, blockPath);
  const nested = blockPath.includes('-');
  const ownerIndex = nested ? -1 : Number(blockPath);
  const eventos = useMemo(
    () => (block ? (elementRegistry.obtener(tipoDeElemento(block))?.eventos ?? []) : []),
    [block],
  );

  // N5: además de los del elemento, se ofrecen los eventos de entorno (cambio de
  // variable, tecla, temporizador, salir del slide), que cualquier dueño puede usar.
  const eventosConstructor = useMemo(
    () => (eventos.length === 0 ? eventos : [...new Set([...eventos, ...EVENTOS_DE_ENTORNO])]),
    [eventos],
  );

  const plantillas = useMemo(() => {
    const out: { id: Plantilla; nombre: string }[] = [];
    if (eventos.includes('clic') || eventos.includes('fin_contador')) {
      out.push({
        id: 'boton-navega',
        nombre: eventos.includes('fin_contador')
          ? 'Al terminar, llevar a otro slide'
          : 'Un botón que lleva a otro slide',
      });
    }
    if (eventos.includes('respuesta_incorrecta')) {
      out.push({ id: 'refuerzo', nombre: 'Ir a un slide de refuerzo si falla' });
    }
    if (eventos.includes('visitado')) {
      out.push({ id: 'revelar', nombre: 'Revelar un elemento al visitar todo' });
    }
    return out;
  }, [eventos]);

  const [abierto, setAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState<Plantilla | ''>('');
  const [destino, setDestino] = useState<'siguiente' | 'anterior' | 'slide'>('siguiente');
  const [slideDestino, setSlideDestino] = useState('');
  const [hotspots, setHotspots] = useState<number[]>([]);
  const [objetivo, setObjetivo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState<{
    regla: Regla;
    esNueva: boolean;
    idAnterior?: string;
  } | null>(null);

  const variables = useClassVariables();
  // Los ids candidatos se generan UNA vez por selección: el constructor ofrece estos
  // destinos y `guardarRegla` solo persiste los que la regla nombra.
  const candidatos = useMemo(() => conIdsCandidatos(bloques), [bloques]);
  const descripcion = useMemo(
    () =>
      crearContextoDescripcion({
        variables,
        bloques: candidatos,
        capas,
        slidesDelMazo,
        etiquetaTipo,
      }),
    [variables, candidatos, capas, slidesDelMazo],
  );
  const opciones = useMemo(
    () => ({
      variables,
      bloques: candidatos.map((b, i) => ({
        id: idDe(b) ?? '',
        etiqueta: `${etiquetaTipo(b)} (elemento ${i + 1})`,
        respondible: (elementRegistry.obtener(tipoDeElemento(b))?.eventos ?? []).includes(
          'respuesta_correcta',
        ),
        ocultoInicial: (b as { ocultoInicial?: boolean }).ocultoInicial === true,
        estados: (b.estadosPersonalizados ?? []).map((e) => ({ id: e.id, nombre: e.nombre })),
      })),
      slides: slidesDelMazo,
      capas: capas.map((c) => ({ id: c.id, nombre: c.nombre })),
      partes:
        block && (block as { tipo?: string }).tipo === 'ecuacion'
          ? partesDeLatex((block as { latex?: string }).latex ?? '')
          : [],
    }),
    [variables, candidatos, capas, slidesDelMazo, block],
  );
  const validacion = useMemo<ContextoValidacion>(
    () => ({
      variables,
      bloqueIds: new Set(candidatos.map((b) => idDe(b) ?? '').filter((x) => x !== '')),
      slideIds: new Set([...slidesDelMazo.map((s) => s.id), slideId]),
      capaIds: new Set(capas.map((c) => c.id)),
      estadosPersonalizados: estadosPersonalizadosPorBloque([{ bloques: candidatos, capas: [] }]),
    }),
    [variables, candidatos, slidesDelMazo, slideId, capas],
  );

  if (!block) return null;

  if (nested) {
    return (
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Label className="text-xs font-medium">Interacciones</Label>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          No disponibles dentro de otro elemento.
          <FieldHelp label="Interacciones">
            <p>
              Las interacciones solo se pueden poner en elementos del slide, no dentro de otro
              elemento (como una columna).
            </p>
          </FieldHelp>
        </p>
      </div>
    );
  }

  const reglas = block.disparadores ?? [];
  const bloqueId = idDe(block);
  const rotasDelBloque = new Set(
    referenciasRotas
      .filter((r) => r.slideId === slideId && (r.bloqueId === undefined || r.bloqueId === bloqueId))
      .map((r) => r.reglaId),
  );
  const rotasDelSlide = referenciasRotas.filter((r) => r.slideId === slideId);

  const otrosVisitables = bloques
    .map((b, i) => ({ b, i }))
    .filter(
      ({ b, i }) =>
        i !== ownerIndex && (elementRegistry.obtener(tipoDeElemento(b))?.eventos ?? []).includes('visitado'),
    );
  const posiblesObjetivos = bloques
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => i !== ownerIndex && !hotspots.includes(i));

  const aplicar = async (next: Block[], ok: string) => {
    setOcupado(true);
    try {
      const guardado = await onApplyBloques(next);
      if (guardado) toast.success(ok);
      else toast.error('No se pudo guardar la interacción');
      return guardado;
    } finally {
      setOcupado(false);
    }
  };

  const construir = (): PlantillaElegida | string => {
    if (plantilla === 'boton-navega') {
      const evento = eventos.includes('fin_contador') ? 'fin_contador' : 'clic';
      if (destino === 'slide') {
        if (!slideDestino) return 'Elige el slide al que debe ir.';
        return { tipo: 'boton-navega', evento, destino: { tipo: 'slide', slideId: slideDestino } };
      }
      return { tipo: 'boton-navega', evento, destino: { tipo: destino } };
    }
    if (plantilla === 'refuerzo') {
      if (!slideDestino) return 'Elige el slide de refuerzo.';
      return { tipo: 'refuerzo', slideRefuerzoId: slideDestino };
    }
    if (plantilla === 'revelar') {
      if (objetivo === '') return 'Elige qué elemento se revela.';
      return {
        tipo: 'revelar',
        hotspotIndices: [ownerIndex, ...hotspots],
        objetivoIndex: Number(objetivo),
      };
    }
    return 'Elige una plantilla.';
  };

  const onAnadir = async () => {
    const elegida = construir();
    if (typeof elegida === 'string') {
      toast.error(elegida);
      return;
    }
    const ok = await aplicar(aplicarPlantilla(bloques, ownerIndex, elegida), 'Interacción añadida');
    if (ok) {
      setAbierto(false);
      setPlantilla('');
      setHotspots([]);
      setObjetivo('');
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <Label className="text-xs font-medium">Interacciones</Label>

      {rotasDelSlide.length > 0 ? (
        <div
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900"
        >
          <p className="font-medium">
            {rotasDelSlide.length === 1
              ? 'Hay 1 interacción con una referencia rota.'
              : `Hay ${rotasDelSlide.length} interacciones con referencias rotas.`}
          </p>
          <ul className="mt-1 list-disc pl-4">
            {rotasDelSlide.slice(0, 5).map((r) => (
              <li key={`${r.reglaId}-${r.codigo}`}>{r.mensaje}</li>
            ))}
          </ul>
          <p className="mt-1">Bórralas o corrígelas: mientras tanto no se ejecutan bien.</p>
        </div>
      ) : null}

      {reglas.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Este elemento no tiene interacciones.
        </p>
      ) : (
        <ul className="space-y-2">
          {reglas.map((r, k) => (
            <li key={r.id} className="space-y-1 rounded-md border border-border p-2">
              <p className="text-[11px]">{describirRegla(r, descripcion)}</p>
              {rotasDelBloque.has(r.id) ? (
                <p className="text-[11px] font-medium text-amber-700">
                  Apunta a algo que ya no existe.
                </p>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="flex items-center gap-2 text-[11px]">
                  <Switch
                    checked={r.activa}
                    onCheckedChange={(v) =>
                      void aplicar(alternarRegla(bloques, ownerIndex, r.id, v), 'Interacción actualizada')
                    }
                    disabled={ocupado}
                  />
                  Activa
                </label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subir (se ejecuta antes)"
                    title="Se ejecutan en este orden: de arriba hacia abajo"
                    className="h-7 w-7"
                    disabled={ocupado || k === 0}
                    onClick={() =>
                      void aplicar(moverReglaDeBloque(bloques, ownerIndex, r.id, -1), 'Orden actualizado')
                    }
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Bajar (se ejecuta después)"
                    className="h-7 w-7"
                    disabled={ocupado || k === reglas.length - 1}
                    onClick={() =>
                      void aplicar(moverReglaDeBloque(bloques, ownerIndex, r.id, 1), 'Orden actualizado')
                    }
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Editar interacción"
                    className="h-7 w-7"
                    disabled={ocupado}
                    onClick={() =>
                      setEditando({ regla: structuredClone(r), esNueva: false, idAnterior: r.id })
                    }
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Duplicar interacción"
                    className="h-7 w-7"
                    disabled={ocupado}
                    onClick={() =>
                      void aplicar(
                        duplicarReglaDeBloque(bloques, ownerIndex, r.id, nuevoIdDeRegla()),
                        'Interacción duplicada',
                      )
                    }
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    disabled={ocupado}
                    onClick={() =>
                      void aplicar(quitarRegla(bloques, ownerIndex, r.id), 'Interacción eliminada')
                    }
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {reglas.length > 1 ? (
            <li className="text-[11px] text-muted-foreground">
              Las interacciones se ejecutan en el orden de la lista, de arriba hacia abajo.
            </li>
          ) : null}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full gap-1 text-xs"
        disabled={ocupado || eventos.length === 0}
        onClick={() =>
          setEditando({
            regla: {
              id: nuevoIdDeRegla(),
              evento: eventos[0] ?? 'clic',
              condiciones: [],
              acciones: [],
              activa: true,
            },
            esNueva: true,
          })
        }
      >
        <Plus className="size-3.5" />
        Regla nueva
      </Button>

      {plantillas.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Sin plantillas para este elemento.
          <FieldHelp label="Plantillas de interacción">
            <p>
              Este tipo de elemento todavía no tiene plantillas de interacción (sí puedes armar una
              regla nueva).
            </p>
          </FieldHelp>
        </p>
      ) : !abierto ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => {
            setAbierto(true);
            setPlantilla(plantillas[0]?.id ?? '');
          }}
        >
          Usar una plantilla
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-border p-2">
          <Label className="text-xs">Plantilla</Label>
          <select
            className={select}
            value={plantilla}
            onChange={(e) => setPlantilla(e.target.value as Plantilla)}
          >
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          {plantilla === 'boton-navega' ? (
            <>
              <Label className="text-xs">Ir a</Label>
              <select
                className={select}
                value={destino}
                onChange={(e) => setDestino(e.target.value as typeof destino)}
              >
                <option value="siguiente">El siguiente slide</option>
                <option value="anterior">El slide anterior</option>
                <option value="slide">Un slide en concreto…</option>
              </select>
            </>
          ) : null}

          {(plantilla === 'boton-navega' && destino === 'slide') || plantilla === 'refuerzo' ? (
            <>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">
                  {plantilla === 'refuerzo' ? 'Slide de refuerzo' : 'Slide'}
                </Label>
                {plantilla === 'refuerzo' ? (
                  <FieldHelp label="Slide de refuerzo">
                    <p>
                      Este resultado cuenta para el indicador de la clase, no para el slide de
                      refuerzo. La nota la sigue calculando Lumina como siempre.
                    </p>
                  </FieldHelp>
                ) : null}
              </div>
              <select
                className={select}
                value={slideDestino}
                onChange={(e) => setSlideDestino(e.target.value)}
              >
                <option value="">Elige un slide…</option>
                {slidesDelMazo.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titulo}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {plantilla === 'revelar' ? (
            <>
              <Label className="text-xs">También deben visitarse</Label>
              {otrosVisitables.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No hay más hotspots en el slide: se revelará al visitar este.
                </p>
              ) : (
                <ul className="space-y-1">
                  {otrosVisitables.map(({ i }) => (
                    <li key={i}>
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="checkbox"
                          checked={hotspots.includes(i)}
                          onChange={(e) =>
                            setHotspots((h) =>
                              e.target.checked ? [...h, i] : h.filter((x) => x !== i),
                            )
                          }
                        />
                        Elemento {i + 1}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <Label className="text-xs">Elemento que se revela</Label>
              <select
                className={select}
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
              >
                <option value="">Elige un elemento…</option>
                {posiblesObjetivos.map(({ b, i }) => (
                  <option key={i} value={i}>
                    Elemento {i + 1} ({b.tipo})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                El elemento elegido empezará oculto y aparecerá al visitar todos los demás.
              </p>
            </>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 flex-1 text-xs"
              disabled={ocupado}
              onClick={() => void onAnadir()}
            >
              Añadir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {editando ? (
        <RuleBuilder
          abierto
          regla={editando.regla}
          esNueva={editando.esNueva}
          eventos={eventosConstructor}
          opciones={opciones}
          origen={{ tipo: 'bloque', bloqueId: idDe(candidatos[ownerIndex]!) ?? '', slideId }}
          validacion={validacion}
          descripcion={descripcion}
          guardando={ocupado}
          onCerrar={() => setEditando(null)}
          onGuardar={async (regla, ocultarAlEmpezar) => {
            // Una regla de plantilla que se edita deja de serlo: así reaplicar no la pisa.
            const final = editando.esNueva ? regla : sinMarcaDePlantilla(regla, nuevoIdDeRegla());
            const next = guardarRegla(bloques, candidatos, ownerIndex, final, {
              idAnterior: editando.idAnterior,
              ocultarAlEmpezar,
            });
            const ok = await aplicar(next, editando.esNueva ? 'Regla creada' : 'Regla actualizada');
            if (ok) setEditando(null);
          }}
        />
      ) : null}
    </div>
  );
}
