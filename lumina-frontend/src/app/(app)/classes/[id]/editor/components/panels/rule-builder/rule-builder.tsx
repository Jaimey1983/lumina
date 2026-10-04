'use client';

import { useMemo, useState } from 'react';

import type { Regla, EventoTipo } from '@lumina/types/interaction';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Switch } from '@lumina/ui/switch';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@lumina/ui/dialog';
import {
  TECLAS_PERMITIDAS,
  TEMPORIZADOR_MAX_S,
  TEMPORIZADOR_MIN_S,
  cambiarEvento,
  nombreEvento,
  validarRegla,
} from '@lumina/interactions';
import type { ContextoValidacion, ContextoDescripcion, OrigenRegla } from '@lumina/interactions';
import { describirRegla } from '@lumina/interactions';

import { ListaDeAcciones } from './accion-editor';
import { AvisosContext, Aviso, OpcionesContext, inputCls, selectCls } from './campos';
import type { OpcionesBuilder } from './campos';
import { ArbolDeCondiciones } from './condicion-editor';

/**
 * Etapa N / N3 — editor de UNA regla: evento, condiciones Y/O/NO anidadas,
 * acciones y «si no». No escribe nada ejecutable (D5): edita el árbol de datos.
 */

export interface RuleBuilderProps {
  abierto: boolean;
  /** Regla inicial (copia de trabajo; el padre decide el id si es nueva). */
  regla: Regla;
  esNueva: boolean;
  /** Eventos que el elemento dueño puede emitir. */
  eventos: readonly EventoTipo[];
  opciones: OpcionesBuilder;
  origen: OrigenRegla;
  /** Universo de ids reales para `validarRegla`. */
  validacion: ContextoValidacion;
  descripcion: ContextoDescripcion;
  guardando?: boolean;
  /** `ocultarAlEmpezar`: bloques que el docente pidió ocultar al empezar (objetivos de «mostrar»). */
  onGuardar: (regla: Regla, ocultarAlEmpezar: string[]) => void;
  onCerrar: () => void;
}

export function RuleBuilder(props: RuleBuilderProps) {
  const { abierto, onCerrar } = props;
  return (
    <Dialog open={abierto} onOpenChange={(o) => (o ? undefined : onCerrar())}>
      {/* Por encima de la barra flotante del bloque (EDITOR_Z.blockActionsBar = 1050). */}
      <DialogPortal>
        <DialogOverlay className="z-[1190]" />
        <DialogContent overlay={false} className="z-[1200] flex max-h-[85vh] max-w-xl flex-col p-6">
          {abierto ? <Contenido {...props} /> : null}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

function Contenido({
  regla: inicial,
  esNueva,
  eventos,
  opciones,
  origen,
  validacion,
  descripcion,
  guardando,
  onGuardar,
  onCerrar,
}: RuleBuilderProps) {
  const [regla, setRegla] = useState<Regla>(inicial);
  const [ocultar, setOcultar] = useState<Set<string>>(() => new Set());
  // Un objetivo que ya empieza oculto no hace falta marcarlo de nuevo.
  const yaOcultos = useMemo(
    () => new Set(opciones.bloques.filter((x) => x.ocultoInicial).map((x) => x.id)),
    [opciones.bloques],
  );

  const avisos = useMemo(
    () => validarRegla(regla, origen, validacion, { eventosPermitidos: eventos }),
    [regla, origen, validacion, eventos],
  );
  const texto = useMemo(() => describirRegla(regla, descripcion), [regla, descripcion]);

  const objetivosMostrar = useMemo(() => {
    const ids = new Set<string>();
    for (const a of regla.acciones) if (a.tipo === 'mostrar' && a.bloqueId) ids.add(a.bloqueId);
    for (const a of regla.sino ?? []) if (a.tipo === 'mostrar' && a.bloqueId) ids.add(a.bloqueId);
    return [...ids];
  }, [regla]);

  const sino = regla.sino ?? [];

  return (
    <OpcionesContext.Provider value={opciones}>
      <AvisosContext.Provider value={avisos}>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-base font-semibold">
            {esNueva ? 'Regla nueva' : 'Editar regla'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cuando ocurra el evento y se cumplan las condiciones, se hacen las acciones; si no se
            cumplen, las de «si no».
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="grow space-y-4 overflow-y-auto pr-1">
          <section className="space-y-1">
            <Label className="text-xs font-medium">1. Cuando…</Label>
            <select
              aria-label="Evento"
              className={selectCls}
              value={regla.evento}
              onChange={(e) =>
                setRegla(cambiarEvento(regla, e.target.value as EventoTipo, opciones.variables[0]?.id))
              }
            >
              {(eventos.includes(regla.evento) ? eventos : [regla.evento, ...eventos]).map((e) => (
                <option key={e} value={e}>
                  Cuando {nombreEvento(e)}
                </option>
              ))}
            </select>
            <Aviso campo="evento" />
            {regla.evento === 'cambio_variable' ? (
              <select
                aria-label="Variable observada"
                className={selectCls}
                value={typeof regla.parametro === 'string' ? regla.parametro : ''}
                onChange={(e) => setRegla({ ...regla, parametro: e.target.value })}
              >
                <option value="">Elige la variable…</option>
                {opciones.variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            ) : null}
            {regla.evento === 'tecla' ? (
              <select
                aria-label="Tecla"
                className={selectCls}
                value={typeof regla.parametro === 'string' ? regla.parametro : ''}
                onChange={(e) => setRegla({ ...regla, parametro: e.target.value })}
              >
                {Object.entries(TECLAS_PERMITIDAS).map(([codigo, etiqueta]) => (
                  <option key={codigo} value={codigo}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            ) : null}
            {regla.evento === 'temporizador' ? (
              <label className="flex items-center gap-2 text-xs">
                Segundos en el slide
                <input
                  type="number"
                  aria-label="Segundos"
                  className={inputCls}
                  min={TEMPORIZADOR_MIN_S}
                  max={TEMPORIZADOR_MAX_S}
                  step={1}
                  value={typeof regla.parametro === 'number' ? regla.parametro : ''}
                  onChange={(e) => {
                    const n = e.target.value === '' ? undefined : Number(e.target.value);
                    setRegla(n === undefined ? { ...regla, parametro: undefined } : { ...regla, parametro: n });
                  }}
                />
              </label>
            ) : null}
            <Aviso campo="parametro" />
            {regla.evento === 'tecla' ? (
              <p className="text-[11px] text-muted-foreground">
                Un atajo de teclado nunca debe ser la única forma de hacer algo: dale también un botón.
              </p>
            ) : null}
          </section>

          <section className="space-y-1">
            <Label className="text-xs font-medium">2. Solo si… (opcional)</Label>
            <ArbolDeCondiciones
              condiciones={regla.condiciones}
              onChange={(condiciones) => setRegla({ ...regla, condiciones })}
            />
          </section>

          <section className="space-y-1">
            <Label className="text-xs font-medium">3. Entonces…</Label>
            <ListaDeAcciones
              prefijo="acciones"
              acciones={regla.acciones}
              vacio="Añade lo que debe pasar."
              onChange={(acciones) => setRegla({ ...regla, acciones })}
            />
            <Aviso campo="acciones" />
          </section>

          <section className="space-y-1">
            <Label className="text-xs font-medium">4. Si no… (opcional)</Label>
            <p className="text-[11px] text-muted-foreground">
              Se hace cuando el evento ocurre y las condiciones NO se cumplen. Si una condición está
              rota (por ejemplo, usa una variable borrada), no se hace nada.
            </p>
            <ListaDeAcciones
              prefijo="sino"
              acciones={sino}
              vacio="No hay acciones «si no»."
              onChange={(a) => {
                const { sino: _omit, ...resto } = regla;
                void _omit;
                setRegla(a.length > 0 ? { ...resto, sino: a } : resto);
              }}
            />
          </section>

          {objetivosMostrar.length > 0 ? (
            <section className="space-y-1">
              <Label className="text-xs font-medium">Elementos que se muestran</Label>
              {objetivosMostrar.map((id) => {
                const etiqueta = opciones.bloques.find((b) => b.id === id)?.etiqueta ?? id;
                return (
                  <label key={id} className="flex items-center gap-2 text-[11px]">
                    <input
                      type="checkbox"
                      checked={yaOcultos.has(id) || ocultar.has(id)}
                      disabled={yaOcultos.has(id)}
                      onChange={(e) =>
                        setOcultar((prev) => {
                          const n = new Set(prev);
                          if (e.target.checked) n.add(id);
                          else n.delete(id);
                          return n;
                        })
                      }
                    />
                    Ocultar «{etiqueta}» al empezar el slide
                    {yaOcultos.has(id) ? ' (ya empieza oculto)' : ''}
                  </label>
                );
              })}
            </section>
          ) : null}

          <section className="space-y-1 rounded-md bg-muted/40 p-2">
            <Label className="text-xs font-medium">Así queda</Label>
            <p className="text-[11px]">{texto}</p>
          </section>

          <label className="flex items-center gap-2 text-[11px]">
            <Switch
              checked={regla.activa}
              onCheckedChange={(activa) => setRegla({ ...regla, activa })}
            />
            Regla activa
          </label>
        </DialogBody>

        <DialogFooter className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-destructive" role="status">
            {avisos.length > 0
              ? avisos.length === 1
                ? 'Hay 1 cosa por corregir.'
                : `Hay ${avisos.length} cosas por corregir.`
              : ''}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={avisos.length > 0 || guardando}
              onClick={() =>
                onGuardar(
                  regla,
                  [...ocultar].filter((id) => objetivosMostrar.includes(id)),
                )
              }
            >
              Guardar regla
            </Button>
          </div>
        </DialogFooter>
      </AvisosContext.Provider>
    </OpcionesContext.Provider>
  );
}
