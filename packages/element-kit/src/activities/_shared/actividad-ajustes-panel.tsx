'use client';

/**
 * U8 — panel común de ajustes de una actividad (etapa U / DU3).
 *
 * El mismo panel para toda actividad que ya usa el `ActivityShell`: calificación, tiempo e
 * intentos, orden, retroalimentación, sonido y aspecto. Solo muestra lo que el tipo soporta
 * (`CapacidadesAjustes`) y **escribe únicamente `ajustes`**: los campos propios de cada
 * actividad (`configuracion`, `retroalimentacion`…) no se tocan jamás. Los valores que se ven
 * salen de `normalizarAjustes`, así que un slide viejo muestra lo que su viewer ya hacía.
 *
 * Ninguna actividad lee de acá nada que no esté en `CAPACIDADES_AJUSTES`.
 */
import type { ReactNode } from 'react';
import type { Activity, ActivityEstilo, ActivityRetroMomento, ActivitySettings } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { FieldHelp } from '@lumina/ui/field-help';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';

import { capacidadesDe, seccionesVisibles, type CapacidadesAjustes } from './activity-ajustes-capacidades.js';
import { ESTILOS_ACTIVIDAD, normalizarAjustes } from './activity-settings.js';

// ─── Escritura (pura) ─────────────────────────────────────────────────────────

/** Devuelve la actividad con `parche` mezclado en `ajustes`. Todo lo demás queda idéntico. */
export function escribirAjustes<T extends Activity>(actividad: T, parche: ActivitySettings): T {
  return { ...actividad, ajustes: { ...actividad.ajustes, ...parche } };
}

/** Quita `ajustes`: la actividad vuelve a comportarse según sus campos propios. */
export function restablecerAjustes<T extends Activity>(actividad: T): T {
  const copia = { ...actividad } as T & { ajustes?: ActivitySettings };
  delete copia.ajustes;
  return copia;
}

// ─── Valores por defecto al encender un límite ────────────────────────────────

export const TIEMPO_POR_DEFECTO_SEG = 60;
const TIEMPO_MIN_SEG = 5;
const TIEMPO_MAX_SEG = 3600;
const OPCIONES_INTENTOS = [1, 2, 3, 5] as const;

const ETIQUETA_RETRO: Readonly<Record<ActivityRetroMomento, string>> = {
  inmediata: 'Al responder',
  al_final: 'Al terminar',
  ninguna: 'Sin mensaje',
};

const ETIQUETA_ESTILO: Readonly<Record<ActivityEstilo, string>> = {
  escolar: 'Escolar',
  examen: 'Examen',
  arcade: 'Arcade',
  minimal: 'Minimal',
  pizarra: 'Pizarra',
};

// ─── Piezas ───────────────────────────────────────────────────────────────────

function Fila({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-1">{children}</div>;
}

function Interruptor({
  id,
  etiqueta,
  checked,
  onChange,
  ayuda,
}: {
  id: string;
  etiqueta: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ayuda?: ReactNode;
}) {
  return (
    <Fila>
      <span className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-xs font-normal">
          {etiqueta}
        </Label>
        {ayuda ? <FieldHelp label={etiqueta}>{ayuda}</FieldHelp> : null}
      </span>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
    </Fila>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export interface ActividadAjustesPanelProps<T extends Activity = Activity> {
  actividad: T;
  onChange: (actividad: T) => void;
  /** Por defecto, las del tipo (`capacidadesDe`). Sin capacidades no se dibuja nada. */
  capacidades?: CapacidadesAjustes | null;
  /** Prefijo de los ids y de la memoria de las secciones plegables. */
  idBase?: string;
}

export function ActividadAjustesPanel<T extends Activity>({
  actividad,
  onChange,
  capacidades: capacidadesProp,
  idBase,
}: ActividadAjustesPanelProps<T>) {
  const capacidades = capacidadesProp === undefined ? capacidadesDe(actividad.tipo) : capacidadesProp;
  if (!capacidades) return null;

  const r = normalizarAjustes(actividad);
  const ver = seccionesVisibles(capacidades);
  const base = idBase ?? `ajustes-${actividad.tipo}`;
  const escribir = (parche: ActivitySettings) => onChange(escribirAjustes(actividad, parche));
  const clave = (sec: string) => `actividad.${actividad.tipo}.ajustes.${sec}`;
  const hayAjustesPropios = actividad.ajustes !== undefined && Object.keys(actividad.ajustes).length > 0;

  const conTiempo = r.tiempoLimiteSeg !== null;

  return (
    <div className="flex flex-col gap-1" data-actividad-ajustes>
      {ver.calificacion && (
        <CollapsibleSection title="Calificación" storageKey={clave('calificacion')}>
          <Interruptor
            id={`${base}-nota`}
            etiqueta="Mostrar la nota al terminar"
            checked={r.mostrarNota}
            onChange={(v) => escribir({ mostrarNota: v })}
          />
        </CollapsibleSection>
      )}

      {ver.tiempoEIntentos && (
        <CollapsibleSection title="Tiempo e intentos" storageKey={clave('tiempo')}>
          {capacidades.tiempo && (
            <>
              <Interruptor
                id={`${base}-tiempo`}
                etiqueta="Límite de tiempo"
                checked={conTiempo}
                onChange={(v) => escribir({ tiempoLimiteSeg: v ? TIEMPO_POR_DEFECTO_SEG : null })}
              />
              {conTiempo && (
                <Fila>
                  <Label htmlFor={`${base}-segundos`} className="text-xs font-normal">
                    Segundos
                  </Label>
                  <input
                    id={`${base}-segundos`}
                    type="number"
                    min={TIEMPO_MIN_SEG}
                    max={TIEMPO_MAX_SEG}
                    value={r.tiempoLimiteSeg ?? TIEMPO_POR_DEFECTO_SEG}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) {
                        escribir({ tiempoLimiteSeg: Math.min(TIEMPO_MAX_SEG, Math.max(TIEMPO_MIN_SEG, Math.round(n))) });
                      }
                    }}
                    className="h-7 w-20 rounded border border-border bg-background px-2 text-right text-xs"
                  />
                </Fila>
              )}
            </>
          )}
          {capacidades.intentos && (
            <Fila>
              <Label htmlFor={`${base}-intentos`} className="text-xs font-normal">
                Intentos
              </Label>
              <select
                id={`${base}-intentos`}
                value={r.intentos === null ? 'ilimitados' : String(r.intentos)}
                onChange={(e) => escribir({ intentos: e.target.value === 'ilimitados' ? null : Number(e.target.value) })}
                className="h-7 rounded border border-border bg-background px-2 text-xs"
              >
                <option value="ilimitados">Ilimitados</option>
                {OPCIONES_INTENTOS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Fila>
          )}
        </CollapsibleSection>
      )}

      {ver.vidas && (
        <CollapsibleSection title="Vidas" storageKey={clave('vidas')}>
          <Interruptor
            id={`${base}-vidas`}
            etiqueta="Limitar las vidas"
            checked={r.vidas !== null}
            onChange={(v) => escribir({ vidas: v ? 3 : null })}
          />
          {r.vidas !== null && (
            <Fila>
              <Label htmlFor={`${base}-nvidas`} className="text-xs font-normal">
                Vidas
              </Label>
              <input
                id={`${base}-nvidas`}
                type="number"
                min={1}
                max={20}
                value={r.vidas}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) escribir({ vidas: Math.min(20, Math.max(1, Math.round(n))) });
                }}
                className="h-7 w-20 rounded border border-border bg-background px-2 text-right text-xs"
              />
            </Fila>
          )}
        </CollapsibleSection>
      )}

      {ver.pistas && (
        <CollapsibleSection title="Pistas" storageKey={clave('pistas')}>
          <Fila>
            <Label htmlFor={`${base}-pistas`} className="text-xs font-normal">
              Pistas disponibles
            </Label>
            <select
              id={`${base}-pistas`}
              value={r.pistas.cantidad === null ? 'ilimitadas' : String(r.pistas.cantidad)}
              onChange={(e) =>
                escribir({
                  pistas: {
                    ...actividad.ajustes?.pistas,
                    cantidad: e.target.value === 'ilimitadas' ? null : Number(e.target.value),
                  },
                })
              }
              className="h-7 rounded border border-border bg-background px-2 text-xs"
            >
              <option value="0">Ninguna</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="ilimitadas">Ilimitadas</option>
            </select>
          </Fila>
        </CollapsibleSection>
      )}

      {ver.orden && (
        <CollapsibleSection title="Orden" storageKey={clave('orden')}>
          {capacidades.barajar && (
            <Interruptor
              id={`${base}-barajar`}
              etiqueta="Barajar"
              checked={r.barajar}
              onChange={(v) => escribir({ barajar: v })}
            />
          )}
          {(capacidades.semilla || (capacidades.barajar && r.barajar)) && (
            <Interruptor
              id={`${base}-mismo-orden`}
              etiqueta="Mismo orden para todos"
              checked={r.semilla !== null}
              onChange={(v) => escribir({ semilla: v ? Math.floor(Math.random() * 1_000_000_000) : null })}
              ayuda={
                <>
                  <p>
                    Normalmente cada alumno ve las piezas en un orden distinto. Con esta opción toda la clase ve
                    el mismo orden.
                  </p>
                  <p>Sirve para comentar una partida entre todos o para revisar el resultado de un alumno.</p>
                </>
              }
            />
          )}
        </CollapsibleSection>
      )}

      {ver.retroalimentacion && (
        <CollapsibleSection title="Retroalimentación" storageKey={clave('retro')}>
          {(capacidades.retroalimentacion?.length ?? 0) > 0 && (
            <div role="group" aria-label="Cuándo avisar si acertó" className="flex gap-1 py-1">
              {capacidades.retroalimentacion!.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={r.retroalimentacion === m ? 'primary' : 'outline'}
                  className="h-7 flex-1 text-[11px]"
                  aria-pressed={r.retroalimentacion === m}
                  onClick={() => escribir({ retroalimentacion: m })}
                >
                  {ETIQUETA_RETRO[m]}
                </Button>
              ))}
            </div>
          )}
          {capacidades.mostrarSolucion && (
            <Interruptor
              id={`${base}-solucion`}
              etiqueta="Mostrar la explicación"
              checked={r.mostrarSolucion}
              onChange={(v) => escribir({ mostrarSolucion: v })}
              ayuda={<p>Muestra la explicación que escribiste debajo de la respuesta, también cuando el alumno acierta.</p>}
            />
          )}
        </CollapsibleSection>
      )}

      {ver.sonidoYAspecto && (
        <CollapsibleSection title="Sonido y aspecto" storageKey={clave('aspecto')}>
          {capacidades.sonido && (
            <Interruptor
              id={`${base}-sonido`}
              etiqueta="Sonidos"
              checked={r.sonido}
              onChange={(v) => escribir({ sonido: v })}
            />
          )}
          {capacidades.estilo && (
            <div role="group" aria-label="Aspecto" className="grid grid-cols-3 gap-1 py-1">
              {ESTILOS_ACTIVIDAD.map((e) => (
                <Button
                  key={e}
                  type="button"
                  size="sm"
                  variant={r.estilo === e ? 'primary' : 'outline'}
                  className="h-7 text-[11px]"
                  aria-pressed={r.estilo === e}
                  onClick={() => escribir({ estilo: e })}
                >
                  {ETIQUETA_ESTILO[e]}
                </Button>
              ))}
            </div>
          )}
        </CollapsibleSection>
      )}

      {hayAjustesPropios && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 h-7 self-start text-[11px] text-muted-foreground"
          onClick={() => onChange(restablecerAjustes(actividad))}
        >
          Restablecer ajustes
        </Button>
      )}
    </div>
  );
}
