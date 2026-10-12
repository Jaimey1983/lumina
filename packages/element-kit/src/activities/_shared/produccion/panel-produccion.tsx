'use client';

/**
 * U12.3 — panel de producción de una actividad (etapa U): revisión (¿se puede jugar?), importar una
 * lista pegada, verla como la verá el alumno y, si el anfitrión lo provee, generarla con IA.
 *
 * No guarda nada por su cuenta: todo cambio sale por `onChange` con la actividad completa (la misma
 * forma de siempre), y «Deshacer» devuelve la anterior a la última importación o generación.
 */
import { useMemo, useState } from 'react';
import { elementRegistry } from '@lumina/element-kit-core';
import type { ElementDefinition } from '@lumina/element-kit-core';
import type { Activity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import { useGeneradorActividad } from './generacion.js';
import type { ModoImportacion } from './importacion.js';
import { importadorDe, importarTexto } from './importadores.js';
import { parsearTabla } from './tabla.js';
import { resumirProblemas } from './problemas.js';
import { validarActividad } from './validacion.js';

export interface PanelProduccionProps<A extends Activity> {
  readonly actividad: A;
  readonly onChange: (actividad: A) => void;
}

const MAX_FILAS_VISIBLES = 5;

function textoResumen(errores: number, avisos: number): string {
  if (errores === 0 && avisos === 0) return 'Todo en orden: se puede jugar.';
  const partes: string[] = [];
  if (errores > 0) partes.push(errores === 1 ? '1 problema que impide jugar' : `${errores} problemas que impiden jugar`);
  if (avisos > 0) partes.push(`${avisos} ${avisos === 1 ? 'aviso' : 'avisos'}`);
  return partes.join(' y ') + '.';
}

export function PanelProduccion<A extends Activity>({ actividad, onChange }: PanelProduccionProps<A>) {
  const problemas = useMemo(() => validarActividad(actividad), [actividad]);
  const resumen = resumirProblemas(problemas);
  const importador = importadorDe(actividad.tipo);
  const generador = useGeneradorActividad();
  const puedeGenerar = !!generador && generador.soporta(actividad.tipo);

  const [texto, setTexto] = useState('');
  const [modo, setModo] = useState<ModoImportacion>('agregar');
  const [previa, setPrevia] = useState<A | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [verComoAlumno, setVerComoAlumno] = useState(false);
  const [reinicios, setReinicios] = useState(0);
  const [instrucciones, setInstrucciones] = useState('');
  const [generando, setGenerando] = useState(false);

  const lectura = useMemo(
    () => (importador && texto.trim() ? importarTexto(actividad, texto, modo) : null),
    [importador, actividad, texto, modo],
  );
  const filasPegadas = useMemo(() => (texto.trim() ? parsearTabla(texto).length : 0), [texto]);

  const aplicarImportacion = () => {
    if (!lectura || lectura.leidas === 0) return;
    setPrevia(actividad);
    onChange(lectura.actividad);
    setMensaje(
      `Se importaron ${lectura.leidas} ${lectura.leidas === 1 ? 'fila' : 'filas'}` +
        (lectura.descartadas.length ? ` y ${lectura.descartadas.length} no se pudieron leer.` : '.'),
    );
    setTexto('');
  };

  const deshacer = () => {
    if (!previa) return;
    onChange(previa);
    setPrevia(null);
    setMensaje('Se deshizo el último cambio.');
  };

  const generar = async () => {
    if (!generador) return;
    setGenerando(true);
    setMensaje('');
    try {
      const r = await generador.generar({ tipo: actividad.tipo, actividadActual: actividad, instrucciones });
      if (r.ok) {
        setPrevia(actividad);
        onChange(r.actividad as A);
        setMensaje('La actividad se generó. Revísala antes de usarla.');
      } else {
        setMensaje(r.mensaje);
      }
    } catch {
      setMensaje('No se pudo generar la actividad.');
    } finally {
      setGenerando(false);
    }
  };

  const Viewer = useMemo(() => {
    const def = elementRegistry.obtener(actividad.tipo) as ElementDefinition<A, Record<string, unknown>> | undefined;
    return def?.Viewer;
  }, [actividad.tipo]);

  const id = `produccion-${actividad.tipo}`;

  return (
    <div className="flex flex-col gap-1" data-panel-produccion>
      <p role="status" aria-live="polite" className="sr-only">
        {mensaje || textoResumen(resumen.errores, resumen.avisos)}
      </p>

      <CollapsibleSection
        title="Revisión"
        storageKey={`${id}.revision`}
        badge={resumen.errores + resumen.avisos > 0 ? resumen.errores + resumen.avisos : undefined}
        forceOpen={resumen.errores > 0}
      >
        <p className="text-xs text-muted-foreground">{textoResumen(resumen.errores, resumen.avisos)}</p>
        {problemas.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-1" aria-label="Problemas de la actividad">
            {problemas.map((p, i) => (
              <li
                key={`${p.nivel}-${i}`}
                className={
                  p.nivel === 'error'
                    ? 'rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800'
                    : 'rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800'
                }
              >
                <span className="font-semibold">{p.nivel === 'error' ? 'No se puede jugar' : 'Aviso'}</span>
                {p.campo ? ` · ${p.campo}` : ''}: {p.mensaje}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {importador && (
        <CollapsibleSection title={`Importar ${importador.titulo.toLowerCase()}`} storageKey={`${id}.importar`} defaultOpen={false}>
          <p className="text-xs text-muted-foreground">{importador.formato}</p>
          <Label htmlFor={`${id}-texto`} className="mt-2 text-[11px]">
            Pega tu lista (una fila por ítem)
          </Label>
          <Textarea
            id={`${id}-texto`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            className="mt-1 text-xs"
            placeholder={importador.ejemplo}
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setTexto(importador.ejemplo)}>
              Usar el ejemplo
            </Button>
            <fieldset className="flex items-center gap-3 text-[11px]">
              <legend className="sr-only">Qué hacer con lo importado</legend>
              {(['agregar', 'reemplazar'] as const).map((m) => (
                <label key={m} className="flex items-center gap-1">
                  <input type="radio" name={`${id}-modo`} checked={modo === m} onChange={() => setModo(m)} />
                  {m === 'agregar' ? 'Agregar' : 'Reemplazar'}
                </label>
              ))}
            </fieldset>
          </div>

          {lectura && (
            <div className="mt-2 text-xs" data-vista-previa-importacion>
              <p>
                {filasPegadas} {filasPegadas === 1 ? 'fila pegada' : 'filas pegadas'} · se leerán{' '}
                <strong>{lectura.leidas}</strong>
                {lectura.descartadas.length > 0 && <> · <strong>{lectura.descartadas.length}</strong> no se pueden leer</>}
              </p>
              {lectura.descartadas.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5" aria-label="Filas que no se pueden leer">
                  {lectura.descartadas.slice(0, MAX_FILAS_VISIBLES).map((d) => (
                    <li key={d.fila} className="text-amber-800">
                      Fila {d.fila}: {d.motivo}
                    </li>
                  ))}
                  {lectura.descartadas.length > MAX_FILAS_VISIBLES && (
                    <li className="text-muted-foreground">…y {lectura.descartadas.length - MAX_FILAS_VISIBLES} más.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <Button type="button" size="sm" className="h-7 text-[11px]" disabled={!lectura || lectura.leidas === 0} onClick={aplicarImportacion}>
              {modo === 'agregar' ? 'Agregar a la actividad' : 'Reemplazar el contenido'}
            </Button>
          </div>
        </CollapsibleSection>
      )}

      {puedeGenerar && (
        <CollapsibleSection title="Generar con IA" storageKey={`${id}.ia`} defaultOpen={false}>
          <Label htmlFor={`${id}-ia`} className="text-[11px]">
            ¿Qué quieres que genere?
          </Label>
          <Textarea
            id={`${id}-ia`}
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            rows={3}
            className="mt-1 text-xs"
            placeholder="Tema, cantidad, nivel…"
          />
          <Button type="button" size="sm" className="mt-1.5 h-7 text-[11px]" disabled={generando} onClick={() => void generar()}>
            {generando ? 'Generando…' : 'Generar'}
          </Button>
          <p className="mt-1 text-[10px] text-muted-foreground">Reemplaza el contenido actual; puedes deshacerlo.</p>
        </CollapsibleSection>
      )}

      {Viewer && (
        <CollapsibleSection title="Ver como alumno" storageKey={`${id}.vista`} defaultOpen={false}>
          {!verComoAlumno ? (
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setVerComoAlumno(true)}>
              Probar la actividad
            </Button>
          ) : (
            <>
              <div className="mb-1.5 flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setReinicios((n) => n + 1)}>
                  Reiniciar
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setVerComoAlumno(false)}>
                  Cerrar
                </Button>
              </div>
              <div className="relative h-80 w-full overflow-hidden rounded-md border border-border" data-vista-alumno>
                <Viewer
                  key={reinicios}
                  estado={actividad}
                  config={{ editorSyncKey: `vista-${reinicios}`, variant: 'light', onResponse: () => undefined }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Es una prueba: nada de lo que respondas se guarda.</p>
            </>
          )}
        </CollapsibleSection>
      )}

      {previa && (
        <div className="px-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={deshacer}>
            Deshacer el último cambio
          </Button>
        </div>
      )}
    </div>
  );
}
