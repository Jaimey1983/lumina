'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleSlash, Info, RotateCcw, Trash2, X } from 'lucide-react';

import { describirRegla } from '@lumina/interactions';
import type { ContextoDescripcion, ReglaAplicable } from '@lumina/interactions';
import type { VariableDef, VariableValor } from '@lumina/types/interaction';
import { Button } from '@lumina/ui/button';
import { FieldHelp } from '@lumina/ui/field-help';
import { Input } from '@lumina/ui/input';
import { Switch } from '@lumina/ui/switch';

import type { RegistroEvento } from '@/lib/interaction-runtime';
import { cn } from '@/lib/utils';
import {
  ETIQUETA_RESULTADO,
  describirEventoRegistrado,
  pasosVisibles,
  reglasPorId,
} from '../../lib/simulador';

/**
 * Etapa N / N8 — «Probar reglas». Solo vive en la VISTA PREVIA del docente.
 * Muestra, evento por evento, qué reglas corrieron y POR QUÉ las demás no, y
 * deja fijar el valor de una variable para probar un caso. Nada de lo que se
 * haga aquí se guarda ni toca la nota: es estado de la prueba, en memoria.
 */

export interface RulesSimulatorProps {
  registros: readonly RegistroEvento[];
  reglas: readonly ReglaAplicable[];
  variables: readonly VariableDef[];
  /** Valor actual de cada variable en la prueba. */
  valores: Readonly<Record<string, VariableValor>>;
  descripcion: ContextoDescripcion;
  onFijarVariable: (variableId: string, valor: VariableValor) => void;
  onReiniciar: () => void;
  onLimpiar: () => void;
  onCerrar: () => void;
}

function IconoResultado({ resultado }: { resultado: string }) {
  if (resultado === 'disparada' || resultado === 'sino') {
    return <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />;
  }
  if (resultado === 'condicion_rota' || resultado === 'ciclo_cortado') {
    return <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />;
  }
  return <CircleSlash className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />;
}

function CampoVariable({
  def,
  valor,
  onFijar,
}: {
  def: VariableDef;
  valor: VariableValor | undefined;
  onFijar: (valor: VariableValor) => void;
}) {
  // El campo es de texto libre mientras se escribe; se aplica al salir o con Intro.
  const [borrador, setBorrador] = useState<string | null>(null);
  if (def.tipo === 'booleano') {
    return (
      <Switch
        aria-label={`Valor de ${def.nombre}`}
        checked={valor === true}
        onCheckedChange={onFijar}
      />
    );
  }
  const mostrado = borrador ?? String(valor ?? '');
  const aplicar = () => {
    if (borrador === null) return;
    if (def.tipo === 'numero') {
      const n = Number(borrador);
      if (borrador.trim() !== '' && Number.isFinite(n)) onFijar(n);
    } else {
      onFijar(borrador);
    }
    setBorrador(null);
  };
  return (
    <Input
      aria-label={`Valor de ${def.nombre}`}
      className="h-7 w-28 text-xs"
      type={def.tipo === 'numero' ? 'number' : 'text'}
      value={mostrado}
      maxLength={200}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={aplicar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') aplicar();
        if (e.key === 'Escape') setBorrador(null);
      }}
    />
  );
}

export function RulesSimulator({
  registros,
  reglas,
  variables,
  valores,
  descripcion,
  onFijarVariable,
  onReiniciar,
  onLimpiar,
  onCerrar,
}: RulesSimulatorProps) {
  const [verTodos, setVerTodos] = useState(false);
  const porId = useMemo(() => reglasPorId(reglas), [reglas]);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: 'end' });
  }, [registros.length]);

  return (
    <aside
      aria-label="Probar reglas"
      data-testid="rules-simulator"
      className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-white/10 bg-card text-foreground"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <h2 className="text-xs font-bold text-primary">Probar reglas</h2>
        <Button type="button" variant="ghost" size="icon" className="size-6" aria-label="Cerrar" onClick={onCerrar}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 flex gap-1.5 rounded-md bg-muted p-2 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Es una prueba: lo que cambies aquí no se guarda ni afecta la nota de nadie.
        </p>

        <section aria-label="Variables" className="mb-4">
          <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Variables
          </h3>
          {variables.length === 0 ? (
            <p className="text-xs text-muted-foreground">Esta clase no tiene variables.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {variables.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate" title={v.nombre}>{v.nombre}</span>
                  <CampoVariable
                    key={`${v.id}:${String(valores[v.id])}`}
                    def={v}
                    valor={valores[v.id]}
                    onFijar={(valor) => onFijarVariable(v.id, valor)}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onReiniciar}>
              <RotateCcw className="size-3" aria-hidden />
              Reiniciar prueba
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onLimpiar} disabled={registros.length === 0}>
              <Trash2 className="size-3" aria-hidden />
              Limpiar lista
            </Button>
          </div>
        </section>

        <section aria-label="Eventos">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qué pasó</h3>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Switch aria-label="Ver también las reglas que no coincidieron" checked={verTodos} onCheckedChange={setVerTodos} />
              Ver todas
            </label>
          </div>
          {registros.length === 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Todavía no hay eventos.
              <FieldHelp label="Simulador">
                <p>
                  Usa la clase como lo haría un alumno: cada evento aparecerá aquí con las reglas
                  que corrieron.
                </p>
              </FieldHelp>
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {registros.map((r) => {
                const pasos = pasosVisibles(r, verTodos);
                return (
                  <li key={r.id} className="rounded-md border border-border p-2" data-testid="simulador-evento">
                    <p className="text-xs font-semibold">{describirEventoRegistrado(r, descripcion)}</p>
                    {pasos.length === 0 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {r.pasos.length === 0
                          ? 'Ninguna regla escucha este evento.'
                          : 'Ninguna regla reaccionó (activa «Ver todas» para ver por qué).'}
                      </p>
                    ) : (
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {pasos.map((p, i) => {
                          const regla = porId.get(p.reglaId)?.regla;
                          return (
                            <li key={`${p.reglaId}:${i}`} className="flex gap-1.5 text-[11px] leading-snug">
                              <IconoResultado resultado={p.resultado} />
                              <div className="min-w-0">
                                <p className={cn('font-medium', p.profundidad > 0 && 'italic')}>
                                  {ETIQUETA_RESULTADO[p.resultado]}
                                  {p.profundidad > 0 ? ' (encadenada)' : ''}
                                </p>
                                {regla ? (
                                  <p className="text-muted-foreground">{describirRegla(regla, descripcion)}</p>
                                ) : null}
                                <p>{p.motivo}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {r.avisos.length > 0 ? (
                      <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-amber-700">
                        {r.avisos.map((a, i) => (
                          <li key={i}>⚠ {a.mensaje}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={fin} />
        </section>
      </div>
    </aside>
  );
}
