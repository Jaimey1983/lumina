'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import type { VariableDef, VariableTipo, VariableValor } from '@lumina/types/interaction';
import {
  MAX_VARIABLES,
  usosDeVariable,
  validarVariables,
  type ReglaAplicable,
} from '@lumina/interactions';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumina/ui/select';
import { Switch } from '@lumina/ui/switch';

/**
 * Variables de clase del motor de interacción (Etapa K / K6, D3).
 *
 * Trabaja sobre un BORRADOR local y guarda con un botón (no por cada tecla: cada
 * guardado es un PATCH de la clase). El id de una variable se genera una sola
 * vez y nunca se edita (D13); el nombre es solo una etiqueta. Borrar o cambiar
 * el tipo de una variable que alguna regla usa está BLOQUEADO y se dice dónde se
 * usa: nunca se deja una regla huérfana en silencio.
 */
export interface VariablesPanelProps {
  variables: VariableDef[];
  /** Reglas aplanadas de todo el mazo (`recolectarReglas`). */
  reglas: ReglaAplicable[];
  /** Título legible de un slide, para decir dónde se usa una variable. */
  tituloDeSlide?: (slideId: string) => string;
  onSave: (next: VariableDef[]) => void;
  isSaving?: boolean;
}

const TIPOS: Array<{ value: VariableTipo; label: string }> = [
  { value: 'numero', label: 'Número' },
  { value: 'texto', label: 'Texto' },
  { value: 'booleano', label: 'Sí / No' },
];

function valorPorDefecto(tipo: VariableTipo): VariableValor {
  return tipo === 'numero' ? 0 : tipo === 'booleano' ? false : '';
}

function nuevaVariable(existentes: readonly VariableDef[]): VariableDef {
  let n = existentes.length + 1;
  const nombres = new Set(existentes.map((v) => v.nombre.trim().toLowerCase()));
  while (nombres.has(`variable ${n}`)) n += 1;
  return {
    id: crypto.randomUUID(),
    nombre: `Variable ${n}`,
    tipo: 'numero',
    valorInicial: 0,
  };
}

export function VariablesPanel({
  variables,
  reglas,
  tituloDeSlide,
  onSave,
  isSaving = false,
}: VariablesPanelProps) {
  const [borrador, setBorrador] = useState<VariableDef[]>(variables);
  const [aviso, setAviso] = useState<string | null>(null);

  // Si cambia lo guardado (otra pestaña, recarga), el borrador se re-sincroniza
  // solo mientras no haya cambios locales sin guardar.
  const [base, setBase] = useState(variables);
  if (variables !== base) {
    setBase(variables);
    if (JSON.stringify(borrador) === JSON.stringify(base)) setBorrador(variables);
  }

  const errores = useMemo(() => validarVariables(borrador), [borrador]);
  const sucio = JSON.stringify(borrador) !== JSON.stringify(variables);

  const usos = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const v of variables) {
      const lista = usosDeVariable(reglas, v.id).map((u) => {
        const donde = tituloDeSlide?.(u.slideId) ?? u.slideId;
        return u.bloqueId ? `${donde} (un bloque)` : donde;
      });
      mapa.set(v.id, [...new Set(lista)]);
    }
    return mapa;
  }, [variables, reglas, tituloDeSlide]);

  const cambiar = (id: string, parche: Partial<VariableDef>) => {
    setAviso(null);
    setBorrador((prev) => prev.map((v) => (v.id === id ? { ...v, ...parche } : v)));
  };

  const borrar = (v: VariableDef) => {
    const donde = usos.get(v.id) ?? [];
    if (donde.length > 0) {
      setAviso(
        `No se puede borrar «${v.nombre}»: la usan reglas en ${donde.join(', ')}. Quita primero esas reglas.`,
      );
      return;
    }
    setAviso(null);
    setBorrador((prev) => prev.filter((x) => x.id !== v.id));
  };

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="variables-panel">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Las variables guardan datos del alumno mientras recorre la clase (intentos, puntos de
        juego, si ya vio algo). Son de flujo: <strong>no cambian la nota</strong>. Cada alumno
        tiene las suyas.
      </p>

      {borrador.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          Esta clase todavía no tiene variables.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {borrador.map((v) => {
          const enUso = (usos.get(v.id) ?? []).length > 0;
          return (
            <li key={v.id} className="flex flex-col gap-2 rounded-md border border-border p-2">
              <div className="flex items-center gap-1">
                <Input
                  aria-label="Nombre de la variable"
                  value={v.nombre}
                  maxLength={200}
                  onChange={(e) => cambiar(v.id, { nombre: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={`Borrar ${v.nombre}`}
                  onClick={() => borrar(v)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={v.tipo}
                  disabled={enUso}
                  onValueChange={(t) =>
                    cambiar(v.id, {
                      tipo: t as VariableTipo,
                      valorInicial: valorPorDefecto(t as VariableTipo),
                    })
                  }
                >
                  <SelectTrigger aria-label="Tipo de la variable" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <Label className="shrink-0 text-xs text-muted-foreground">Empieza en</Label>
                  {v.tipo === 'booleano' ? (
                    <Switch
                      aria-label="Valor inicial"
                      checked={v.valorInicial === true}
                      onCheckedChange={(c) => cambiar(v.id, { valorInicial: c })}
                    />
                  ) : v.tipo === 'numero' ? (
                    <Input
                      aria-label="Valor inicial"
                      type="number"
                      value={typeof v.valorInicial === 'number' ? v.valorInicial : 0}
                      onChange={(e) =>
                        cambiar(v.id, {
                          valorInicial: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <Input
                      aria-label="Valor inicial"
                      value={typeof v.valorInicial === 'string' ? v.valorInicial : ''}
                      maxLength={200}
                      onChange={(e) => cambiar(v.id, { valorInicial: e.target.value })}
                    />
                  )}
                </div>
              </div>
              {enUso && (
                <p className="text-[11px] text-muted-foreground">
                  En uso en: {(usos.get(v.id) ?? []).join(', ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {aviso && (
        <p role="alert" className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
          {aviso}
        </p>
      )}
      {errores.length > 0 && (
        <ul role="alert" className="list-disc pl-4 text-xs text-destructive">
          {errores.map((e, i) => (
            <li key={i}>{e.mensaje}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={borrador.length >= MAX_VARIABLES}
          onClick={() => {
            setAviso(null);
            setBorrador((prev) => [...prev, nuevaVariable(prev)]);
          }}
        >
          <Plus className="mr-1 size-4" aria-hidden />
          Añadir variable
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!sucio || errores.length > 0 || isSaving}
          onClick={() => onSave(borrador)}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
