'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@lumina/ui/button';
import { FieldHelp } from '@lumina/ui/field-help';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import {
  MAX_ESTADOS_PERSONALIZADOS,
  RANGOS_APARIENCIA,
  aparienciaDeEstado,
  razonDeContraste,
  usosDeEstado,
} from '@lumina/interactions';
import type { ReglaAplicable } from '@lumina/interactions';
import type { AparienciaEstado } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

import { aparienciaACss } from '@/lib/apariencia-estado';
import {
  ESTADOS_EDITABLES,
  conAparienciaDeEstado,
  conAparienciaDePersonalizado,
  conEstadoPersonalizado,
  etiquetaDeEstado,
  renombrarEstadoPersonalizado,
  sinEstadoPersonalizado,
} from '../../lib/estados-bloque';

/**
 * N6 — «Estados» de un bloque: apariencia por estado (normal, hover, presionado,
 * visitado, seleccionado, deshabilitado) y estados personalizados. Solo se ve en
 * los modos con runtime; el editor y las miniaturas no cambian.
 */

export interface BlockStatesSectionProps {
  block: Block;
  /** Reglas de todo el mazo: para impedir borrar un estado en uso. */
  reglas: readonly ReglaAplicable[];
  tituloDeSlide?: (slideId: string) => string | undefined;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

const campo =
  'h-8 w-full rounded-md border border-border bg-background px-2 text-xs';

const AA = 4.5;

export function BlockStatesSection({
  block,
  reglas,
  tituloDeSlide,
  applyNow,
}: BlockStatesSectionProps) {
  const personalizados = block.estadosPersonalizados ?? [];
  const cantidadEstados =
    Object.values(block.apariencias ?? {}).filter((a) => a && Object.keys(a).length > 0).length +
    personalizados.length;
  const [elegido, setElegido] = useState<string>('hover');
  const [nuevo, setNuevo] = useState('');
  const [renombre, setRenombre] = useState('');
  const [colorTexto, setColorTexto] = useState('#111827');
  const [aviso, setAviso] = useState<string | null>(null);

  // Si el estado elegido era personalizado y ya no existe, se vuelve a «hover».
  const esPersonalizado = personalizados.some((e) => e.id === elegido);
  const valido = esPersonalizado || ESTADOS_EDITABLES.some((e) => e === elegido);
  const estado = valido ? elegido : 'hover';
  const actual: AparienciaEstado = aparienciaDeEstado(block, estado) ?? {};
  const bloqueId = (block as { id?: string }).id;

  const fijar = (parche: Partial<AparienciaEstado>, quitar: (keyof AparienciaEstado)[] = []) => {
    const siguiente: AparienciaEstado = { ...actual, ...parche };
    for (const k of quitar) delete siguiente[k];
    void applyNow((b) =>
      personalizados.some((e) => e.id === estado)
        ? conAparienciaDePersonalizado(b, estado, siguiente)
        : conAparienciaDeEstado(b, estado as never, siguiente),
    );
  };

  const razon = useMemo(
    () => (actual.fondo === undefined ? undefined : razonDeContraste(actual.fondo, colorTexto)),
    [actual.fondo, colorTexto],
  );

  const crear = () => {
    const id = `est_${crypto.randomUUID().slice(0, 8)}`;
    const r = conEstadoPersonalizado(block, id, nuevo);
    if ('error' in r && r.error !== undefined) {
      setAviso(r.error);
      return;
    }
    setAviso(null);
    setNuevo('');
    setElegido(id);
    void applyNow((b) => {
      const res = conEstadoPersonalizado(b, id, nuevo);
      return 'bloque' in res ? res.bloque : b;
    });
  };

  const renombrar = () => {
    const r = renombrarEstadoPersonalizado(block, estado, renombre);
    if ('error' in r && r.error !== undefined) {
      setAviso(r.error);
      return;
    }
    setAviso(null);
    setRenombre('');
    void applyNow((b) => {
      const res = renombrarEstadoPersonalizado(b, estado, renombre);
      return 'bloque' in res ? res.bloque : b;
    });
  };

  const borrar = () => {
    const usos =
      bloqueId === undefined ? [] : usosDeEstado(reglas, bloqueId, estado);
    if (usos.length > 0) {
      const donde = [
        ...new Set(usos.map((u) => (u.bloqueId ? `${tituloDeSlide?.(u.slideId) ?? u.slideId} (un bloque)` : (tituloDeSlide?.(u.slideId) ?? u.slideId)))),
      ];
      setAviso(
        `No se puede borrar este estado: lo usan reglas en ${donde.join(', ')}. Quita primero esas reglas.`,
      );
      return;
    }
    setAviso(null);
    setElegido('hover');
    void applyNow((b) => sinEstadoPersonalizado(b, estado));
    toast.success('Estado borrado');
  };

  const nombreDe = personalizados.find((e) => e.id === estado)?.nombre;

  return (
    <CollapsibleSection
      title="Estados (apariencia)"
      defaultOpen={false}
      storageKey="props.estados"
      badge={cantidadEstados > 0 ? `${cantidadEstados} ${cantidadEstados === 1 ? 'estado' : 'estados'}` : undefined}
      forceOpen={cantidadEstados > 0}
      className="mt-4 border-t border-border pt-4"
    >
      <div className="space-y-3" data-testid="block-states-section">
        <div className="flex items-center justify-end">
          <FieldHelp label="Estados (apariencia)">
            <p>
              Cómo se ve el elemento en cada estado. Solo se aplica cuando la clase se reproduce; el
              editor no cambia. Es solo aspecto: <strong>no afecta la nota</strong>.
            </p>
          </FieldHelp>
        </div>

        <select
          aria-label="Estado a editar"
          value={estado}
          onChange={(e) => {
            setElegido(e.target.value);
            setAviso(null);
          }}
          className={campo}
        >
          {ESTADOS_EDITABLES.map((e) => (
            <option key={e} value={e}>
              {etiquetaDeEstado(e)}
            </option>
          ))}
          {personalizados.length > 0 ? (
            <optgroup label="Personalizados">
              {personalizados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>

        <div className="space-y-2">
          <Rango
            etiqueta="Opacidad"
            valor={actual.opacidad}
            rango={RANGOS_APARIENCIA.opacidad}
            paso={0.05}
            porDefecto={1}
            onChange={(v) => (v === undefined ? fijar({}, ['opacidad']) : fijar({ opacidad: v }))}
          />
          <Rango
            etiqueta="Tamaño"
            valor={actual.escala}
            rango={RANGOS_APARIENCIA.escala}
            paso={0.05}
            porDefecto={1}
            onChange={(v) => (v === undefined ? fijar({}, ['escala']) : fijar({ escala: v }))}
          />
          <Rango
            etiqueta="Brillo"
            valor={actual.brillo}
            rango={RANGOS_APARIENCIA.brillo}
            paso={0.05}
            porDefecto={1}
            onChange={(v) => (v === undefined ? fijar({}, ['brillo']) : fijar({ brillo: v }))}
          />
          <Rango
            etiqueta="Sombra"
            valor={actual.sombra}
            rango={RANGOS_APARIENCIA.sombra}
            paso={1}
            porDefecto={0}
            onChange={(v) => (v === undefined ? fijar({}, ['sombra']) : fijar({ sombra: v }))}
          />
          <Color
            etiqueta="Color de fondo"
            valor={actual.fondo}
            onChange={(v) => (v === undefined ? fijar({}, ['fondo']) : fijar({ fondo: v }))}
          />
          <Color
            etiqueta="Color de borde"
            valor={actual.borde}
            onChange={(v) => (v === undefined ? fijar({}, ['borde']) : fijar({ borde: v }))}
          />
        </div>

        <div className="space-y-1" aria-label="Vista previa del estado">
          <div
            data-testid="estado-vista-previa"
            className="flex h-12 items-center justify-center rounded-md border border-dashed border-border text-sm"
            style={{ ...aparienciaACss(actual), color: colorTexto }}
          >
            Aa — vista previa
          </div>
          {actual.fondo !== undefined ? (
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground" htmlFor="estado-color-texto">
                Color del texto
              </label>
              <input
                id="estado-color-texto"
                type="color"
                value={colorTexto}
                onChange={(e) => setColorTexto(e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border border-border"
              />
              {razon !== undefined ? (
                <span
                  data-testid="estado-contraste"
                  className={razon >= AA ? 'text-[11px] text-green-700' : 'text-[11px] text-amber-700'}
                  role={razon >= AA ? undefined : 'status'}
                >
                  Contraste {razon.toFixed(1)}:1 {razon >= AA ? '(cumple AA)' : '(bajo: el mínimo AA es 4.5:1)'}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {esPersonalizado ? (
          <div className="space-y-2 rounded-md border border-border p-2">
            <p className="text-[11px] text-muted-foreground">
              Estado personalizado «{nombreDe}». Se asigna desde una regla con «poner en…».
            </p>
            <div className="flex gap-1">
              <input
                aria-label="Nuevo nombre del estado"
                value={renombre}
                onChange={(e) => setRenombre(e.target.value)}
                placeholder="Nuevo nombre"
                maxLength={40}
                className={campo}
              />
              <Button type="button" size="sm" variant="outline" onClick={renombrar} disabled={renombre.trim() === ''}>
                Renombrar
              </Button>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={borrar}>
              <Trash2 className="mr-1 size-3.5" aria-hidden /> Borrar estado
            </Button>
          </div>
        ) : null}

        <div className="space-y-1">
          <div className="flex gap-1">
            <input
              aria-label="Nombre del estado personalizado"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Estado nuevo (p. ej. Correcto)"
              maxLength={40}
              className={campo}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={crear}
              disabled={nuevo.trim() === '' || personalizados.length >= MAX_ESTADOS_PERSONALIZADOS}
            >
              <Plus className="mr-1 size-3.5" aria-hidden /> Crear
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {personalizados.length}/{MAX_ESTADOS_PERSONALIZADOS} estados personalizados.
          </p>
        </div>

        {aviso ? (
          <p role="alert" className="text-[11px] text-red-600">
            {aviso}
          </p>
        ) : null}
      </div>
    </CollapsibleSection>
  );
}

function Rango({
  etiqueta,
  valor,
  rango,
  paso,
  porDefecto,
  onChange,
}: {
  etiqueta: string;
  valor: number | undefined;
  rango: { min: number; max: number };
  paso: number;
  porDefecto: number;
  onChange: (v: number | undefined) => void;
}) {
  const id = `estado-${etiqueta.toLowerCase()}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-24 shrink-0 text-[11px] text-muted-foreground">
        {etiqueta}
      </label>
      <input
        id={id}
        type="range"
        min={rango.min}
        max={rango.max}
        step={paso}
        value={valor ?? porDefecto}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
      />
      <span className="w-8 text-right text-[11px] tabular-nums">{valor ?? '—'}</span>
      <button
        type="button"
        className="text-[11px] text-muted-foreground underline disabled:opacity-40"
        disabled={valor === undefined}
        onClick={() => onChange(undefined)}
        aria-label={`Quitar ${etiqueta.toLowerCase()}`}
      >
        ×
      </button>
    </div>
  );
}

function Color({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const id = `estado-${etiqueta.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-24 shrink-0 text-[11px] text-muted-foreground">
        {etiqueta}
      </label>
      <input
        id={id}
        type="color"
        value={valor !== undefined && valor.length === 7 ? valor : '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-border"
      />
      <span className="flex-1 text-[11px] tabular-nums">{valor ?? 'sin cambio'}</span>
      <button
        type="button"
        className="text-[11px] text-muted-foreground underline disabled:opacity-40"
        disabled={valor === undefined}
        onClick={() => onChange(undefined)}
        aria-label={`Quitar ${etiqueta.toLowerCase()}`}
      >
        ×
      </button>
    </div>
  );
}
