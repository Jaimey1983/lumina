'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getBlockAtPath } from '@lumina/editor-shared/slide-block-path';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import type { ReferenciaRota } from '@lumina/interactions';
import type { Block } from '@lumina/types/slide';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import {
  alternarRegla,
  aplicarPlantilla,
  describirRegla,
  quitarRegla,
  tipoDeElemento,
} from '../../lib/interacciones';
import type { PlantillaElegida } from '../../lib/interacciones';

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
  onApplyBloques: (next: Block[]) => Promise<boolean>;
}

type Plantilla = 'boton-navega' | 'refuerzo' | 'revelar';

const select =
  'h-8 w-full rounded-md border border-border bg-background px-2 text-xs';

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
  onApplyBloques,
}: InteractionsPanelProps) {
  const block = getBlockAtPath(bloques, blockPath);
  const nested = blockPath.includes('-');
  const ownerIndex = nested ? -1 : Number(blockPath);
  const eventos = useMemo(
    () => (block ? (elementRegistry.obtener(tipoDeElemento(block))?.eventos ?? []) : []),
    [block],
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

  const tituloSlide = (id: string) =>
    slidesDelMazo.find((s) => s.id === id)?.titulo ?? 'un slide que ya no existe';
  const nombreBloque = (id: string) => {
    const i = bloques.findIndex((x) => idDe(x) === id);
    return i < 0 ? 'un elemento que ya no existe' : `el elemento ${i + 1}`;
  };

  if (!block) return null;

  if (nested) {
    return (
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Label className="text-xs font-medium">Interacciones</Label>
        <p className="text-[11px] text-muted-foreground">
          Las interacciones solo se pueden poner en elementos del slide, no dentro de otro
          elemento (como una columna).
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
          {reglas.map((r) => (
            <li key={r.id} className="space-y-1 rounded-md border border-border p-2">
              <p className="text-[11px]">{describirRegla(r, tituloSlide, nombreBloque)}</p>
              {rotasDelBloque.has(r.id) ? (
                <p className="text-[11px] font-medium text-amber-700">
                  Apunta a algo que ya no existe.
                </p>
              ) : null}
              <div className="flex items-center justify-between">
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
            </li>
          ))}
        </ul>
      )}

      {plantillas.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Este tipo de elemento todavía no tiene plantillas de interacción.
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
          Añadir interacción
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
              <Label className="text-xs">
                {plantilla === 'refuerzo' ? 'Slide de refuerzo' : 'Slide'}
              </Label>
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

          {plantilla === 'refuerzo' ? (
            <p className="text-[11px] text-muted-foreground">
              Este resultado cuenta para el indicador de la clase, no para el slide de refuerzo.
              La nota la sigue calculando Lumina como siempre.
            </p>
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
                Por ahora el elemento se ve desde el principio: «ocultarlo al empezar» llega con
                las capas y la visibilidad inicial.
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
    </div>
  );
}
