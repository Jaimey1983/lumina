'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { parseRespuestaNumerica, validarExpresionAlgebraica } from '@lumina/scoring';
import type { ProblemaPaso, ProblemaPasosActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import {
  PROBLEMA_MAX_PASOS,
  PROBLEMA_MAX_PISTAS_POR_PASO,
  PROBLEMA_MIN_PASOS,
  describirToleranciaPaso,
  normalizarProblemaPasos,
  pasoVacio,
} from './problema-pasos-config.js';

interface ProblemaPasosPropertiesProps {
  actividad: ProblemaPasosActivity;
  onChange: (actividad: ProblemaPasosActivity) => void;
}

const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';

/** Aviso sobre la respuesta modelo de un paso (la misma comprobación que usa el scoring). */
function problemaDeRespuesta(p: ProblemaPaso): string | null {
  if (!p.respuesta.trim()) return 'Falta la respuesta modelo.';
  if (p.modo === 'algebraico') {
    const m = validarExpresionAlgebraica(p.respuesta);
    return m ? `No se puede leer la expresión: ${m}` : null;
  }
  return parseRespuestaNumerica(p.respuesta) === null ? 'La respuesta modelo no es un número.' : null;
}

function mover<T>(lista: T[], desde: number, hacia: number): T[] {
  if (hacia < 0 || hacia >= lista.length) return lista;
  const sig = [...lista];
  const [x] = sig.splice(desde, 1);
  sig.splice(hacia, 0, x!);
  return sig;
}

export function ProblemaPasosProperties({ actividad, onChange }: ProblemaPasosPropertiesProps) {
  const act = useMemo(() => normalizarProblemaPasos(actividad), [actividad]);
  const emitir = (parche: Partial<ProblemaPasosActivity>) => onChange({ ...act, ...parche });
  const cambiarPaso = (id: string, parche: Partial<ProblemaPaso>) =>
    emitir({ pasos: act.pasos.map((p) => (p.id === id ? { ...p, ...parche } : p)) });

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="pp-enunciado" className="text-[11px]">
          Enunciado
        </Label>
        <Textarea id="pp-enunciado" value={act.enunciado} rows={3} className="text-xs" onChange={(e) => emitir({ enunciado: e.target.value })} />
        <p className="text-[10px] text-muted-foreground">{'Las fórmulas van entre \\( y \\): \\(x^2\\).'}</p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="pp-imagen" className="text-[11px]">
          Imagen (opcional)
        </Label>
        <input id="pp-imagen" type="text" value={act.imagen ?? ''} placeholder="URL de la imagen" className={CAMPO} onChange={(e) => emitir({ imagen: e.target.value || undefined })} />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[11px]">
        <input type="checkbox" checked={act.secuencial} onChange={(e) => emitir({ secuencial: e.target.checked })} />
        Mostrar un paso a la vez (se comprueba cada uno antes de pasar al siguiente)
      </label>

      <section aria-label="Pasos" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Pasos ({act.pasos.length}/{PROBLEMA_MAX_PASOS})
        </h4>
        {act.pasos.map((p, n) => {
          const problema = problemaDeRespuesta(p);
          const esperado = p.modo === 'numerico' ? parseRespuestaNumerica(p.respuesta) : null;
          return (
            <div key={p.id} className="flex flex-col gap-1.5 rounded border border-border bg-muted/40 p-2">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Paso {n + 1}</span>
                <span className="flex-1" />
                <Button type="button" variant="ghost" size="icon" className="size-6" aria-label={`Subir paso ${n + 1}`} disabled={n === 0} onClick={() => emitir({ pasos: mover(act.pasos, n, n - 1) })}>
                  <ArrowUp className="size-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-6" aria-label={`Bajar paso ${n + 1}`} disabled={n === act.pasos.length - 1} onClick={() => emitir({ pasos: mover(act.pasos, n, n + 1) })}>
                  <ArrowDown className="size-3" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-red-600" aria-label={`Quitar paso ${n + 1}`} disabled={act.pasos.length <= PROBLEMA_MIN_PASOS} onClick={() => emitir({ pasos: act.pasos.filter((x) => x.id !== p.id) })}>
                  <Trash2 className="size-3" />
                </Button>
              </div>

              <Textarea aria-label={`Instrucción del paso ${n + 1}`} value={p.instruccion} rows={2} className="text-xs" placeholder="¿Qué se pide en este paso?" onChange={(e) => cambiarPaso(p.id, { instruccion: e.target.value })} />

              <div className="flex gap-2">
                <select aria-label={`Tipo de respuesta del paso ${n + 1}`} value={p.modo} className={`${CAMPO} w-32`} onChange={(e) => cambiarPaso(p.id, { modo: e.target.value as ProblemaPaso['modo'] })}>
                  <option value="numerico">Número</option>
                  <option value="algebraico">Expresión</option>
                </select>
                <input type="text" aria-label={`Respuesta modelo del paso ${n + 1}`} value={p.respuesta} placeholder={p.modo === 'algebraico' ? 'Ej. 2(x+1)' : 'Ej. 15 o 3/4'} className={CAMPO} onChange={(e) => cambiarPaso(p.id, { respuesta: e.target.value })} />
              </div>
              {problema ? (
                <p role="alert" className="text-[10px] text-red-700">
                  {problema}
                </p>
              ) : null}

              {p.modo === 'numerico' && (
                <>
                  <div className="flex gap-2">
                    <input type="number" min={0} step="any" aria-label={`Tolerancia del paso ${n + 1}`} value={p.tolerancia ?? ''} placeholder="Tolerancia" className={CAMPO} onChange={(e) => cambiarPaso(p.id, { tolerancia: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} />
                    <select aria-label={`Tipo de tolerancia del paso ${n + 1}`} value={p.toleranciaTipo ?? 'absoluta'} className={`${CAMPO} w-32`} onChange={(e) => cambiarPaso(p.id, { toleranciaTipo: e.target.value as ProblemaPaso['toleranciaTipo'] })}>
                      <option value="absoluta">Absoluta</option>
                      <option value="porcentual">Porcentual (%)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{describirToleranciaPaso(p, esperado)}</p>
                  <input type="text" aria-label={`Unidad del paso ${n + 1}`} value={p.unidad ?? ''} placeholder="Unidad (opcional): m², $, km/h" className={CAMPO} onChange={(e) => cambiarPaso(p.id, { unidad: e.target.value || undefined })} />
                </>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">Pistas (se revelan en orden)</span>
                {p.pistas.map((t, k) => (
                  <div key={k} className="flex items-center gap-1">
                    <input type="text" aria-label={`Pista ${k + 1} del paso ${n + 1}`} value={t} placeholder={`Pista ${k + 1}`} className={CAMPO} onChange={(e) => cambiarPaso(p.id, { pistas: p.pistas.map((x, j) => (j === k ? e.target.value : x)) })} />
                    <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" aria-label={`Subir pista ${k + 1} del paso ${n + 1}`} disabled={k === 0} onClick={() => cambiarPaso(p.id, { pistas: mover(p.pistas, k, k - 1) })}>
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground hover:text-red-600" aria-label={`Quitar pista ${k + 1} del paso ${n + 1}`} onClick={() => cambiarPaso(p.id, { pistas: p.pistas.filter((_, j) => j !== k) })}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="h-6 gap-1 text-[10px]" disabled={p.pistas.length >= PROBLEMA_MAX_PISTAS_POR_PASO} onClick={() => cambiarPaso(p.id, { pistas: [...p.pistas, ''] })}>
                  <Plus className="size-3" /> Agregar pista al paso {n + 1}
                </Button>
              </div>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[11px]" disabled={act.pasos.length >= PROBLEMA_MAX_PASOS} onClick={() => emitir({ pasos: [...act.pasos, pasoVacio()] })}>
          <Plus className="size-3" /> Agregar paso
        </Button>
      </section>
    </div>
  );
}
