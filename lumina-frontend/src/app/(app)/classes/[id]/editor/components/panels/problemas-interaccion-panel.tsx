'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

import type { ContextoDescripcion, ProblemaInteraccion, ReglaAplicable } from '@lumina/interactions';
import { describirRegla } from '@lumina/interactions';
import type { VariableDef } from '@lumina/types/interaction';
import { Button } from '@lumina/ui/button';

import { reglasPorId } from '../../lib/simulador';

/**
 * Etapa N / N8 — «Problemas de interacción». Lista lo que está mal armado en las
 * reglas del mazo, con un salto al elemento o slide afectado. NO bloquea el
 * guardado (como K7b): es un aviso para que el docente lo corrija cuando quiera.
 */

export interface ProblemasInteraccionPanelProps {
  problemas: readonly ProblemaInteraccion[];
  reglas: readonly ReglaAplicable[];
  variables: readonly VariableDef[];
  descripcion: ContextoDescripcion;
  /** Lleva al slide (y al bloque, si lo hay) donde está el problema. */
  onIr: (slideId: string, bloqueId?: string) => void;
}

const TITULO: Record<ProblemaInteraccion['codigo'], string> = {
  referencia_rota: 'Referencia rota',
  evento_imposible: 'Nunca se dispara',
  variable_sin_uso: 'Variable sin uso',
  ciclo_potencial: 'Posible ciclo',
};

export function ProblemasInteraccionPanel({
  problemas,
  reglas,
  variables,
  descripcion,
  onIr,
}: ProblemasInteraccionPanelProps) {
  const porId = reglasPorId(reglas);
  if (problemas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 text-center" data-testid="problemas-interaccion">
        <CheckCircle2 className="size-6 text-emerald-600" aria-hidden />
        <p className="text-xs text-muted-foreground">No se encontraron problemas en las interacciones.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2 p-3" data-testid="problemas-interaccion">
      {problemas.map((p, i) => {
        const regla = p.reglaId !== undefined ? porId.get(p.reglaId)?.regla : undefined;
        const variable = p.variableId !== undefined ? variables.find((v) => v.id === p.variableId) : undefined;
        const Icono = p.severidad === 'error' ? XCircle : AlertTriangle;
        return (
          <li key={`${p.codigo}:${p.reglaId ?? p.variableId ?? ''}:${i}`} className="rounded-md border border-border p-2">
            <div className="flex items-start gap-1.5">
              <Icono
                className={p.severidad === 'error' ? 'mt-0.5 size-3.5 shrink-0 text-red-600' : 'mt-0.5 size-3.5 shrink-0 text-amber-600'}
                aria-hidden
              />
              <div className="min-w-0 text-[11px] leading-snug">
                <p className="text-xs font-semibold">
                  {TITULO[p.codigo]}
                  {variable ? ` · «${variable.nombre}»` : ''}
                </p>
                {regla ? <p className="text-muted-foreground">{describirRegla(regla, descripcion)}</p> : null}
                <p>{p.mensaje}</p>
                {p.slideId !== undefined ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-[11px] text-primary underline-offset-2 hover:underline"
                    onClick={() => onIr(p.slideId as string, p.bloqueId)}
                  >
                    Ir a {p.bloqueId !== undefined ? 'este elemento' : 'este slide'}
                    {descripcion.tituloSlide(p.slideId) ? ` (${descripcion.tituloSlide(p.slideId)})` : ''}
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
