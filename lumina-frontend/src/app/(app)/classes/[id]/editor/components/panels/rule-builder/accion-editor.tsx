'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { Accion, AccionTipo, VariableTipo } from '@lumina/types/interaction';
import { Button } from '@lumina/ui/button';
import { moverEnLista, quitarDeLista, reemplazarEnLista } from '@lumina/interactions';

import { Aviso, esEstadoDeBloque, inputCls, selectCls, useOpciones } from './campos';
import { OperandoEditor } from './operando-editor';
import {
  ESTADOS,
  ETIQUETA_ACCION,
  GRUPOS_ACCION,
  accionPorDefecto,
  tipoDeVariablePara,
} from './modelo';
import type { OperandoKind } from './modelo';

const KINDS_NUMERO: readonly OperandoKind[] = ['literal_numero', 'variable', 'sistema'];
const KINDS_TEXTO: readonly OperandoKind[] = ['literal_texto', 'variable'];

function kindsAsignar(tipo: VariableTipo | undefined): readonly OperandoKind[] {
  if (tipo === 'numero') return KINDS_NUMERO;
  if (tipo === 'texto') return ['literal_texto', 'variable', 'estado_bloque'];
  if (tipo === 'booleano') return ['literal_booleano', 'variable', 'respuesta_correcta'];
  return [...KINDS_NUMERO, 'literal_texto', 'literal_booleano'];
}

export interface ListaDeAccionesProps {
  acciones: readonly Accion[];
  onChange: (a: Accion[]) => void;
  /** `acciones` o `sino`: prefijo de los campos para los avisos. */
  prefijo: 'acciones' | 'sino';
  vacio: string;
}

export function ListaDeAcciones({ acciones, onChange, prefijo, vacio }: ListaDeAccionesProps) {
  const { variables, bloques, slides, capas } = useOpciones();
  const ctx = {
    variables,
    bloqueIds: bloques.map((b) => b.id),
    slideIds: slides.map((s) => s.id),
    capaIds: capas.map((c) => c.id),
  };
  return (
    <div className="space-y-2">
      {acciones.length === 0 ? <p className="text-[11px] text-muted-foreground">{vacio}</p> : null}
      {acciones.map((a, i) => (
        <AccionEditor
          key={i}
          a={a}
          campo={`${prefijo}.${i}`}
          onChange={(n) => onChange(reemplazarEnLista(acciones, i, n))}
          onQuitar={() => onChange(quitarDeLista(acciones, i))}
          onSubir={i > 0 ? () => onChange(moverEnLista(acciones, i, i - 1)) : undefined}
          onBajar={i < acciones.length - 1 ? () => onChange(moverEnLista(acciones, i, i + 1)) : undefined}
        />
      ))}
      <label className="block text-[11px]">
        <span className="sr-only">Añadir acción</span>
        <select
          aria-label="Añadir acción"
          className={selectCls}
          value=""
          onChange={(e) => {
            if (e.target.value === '') return;
            onChange([...acciones, accionPorDefecto(e.target.value as AccionTipo, ctx)]);
          }}
        >
          <option value="">+ Añadir acción…</option>
          {GRUPOS_ACCION.map((g) => (
            <optgroup key={g.titulo} label={g.titulo}>
              {g.tipos.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_ACCION[t]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}

interface AccionEditorProps {
  a: Accion;
  campo: string;
  onChange: (a: Accion) => void;
  onQuitar: () => void;
  onSubir?: () => void;
  onBajar?: () => void;
}

function AccionEditor({ a, campo, onChange, onQuitar, onSubir, onBajar }: AccionEditorProps) {
  const { variables, bloques, slides, capas } = useOpciones();
  const ctx = {
    variables,
    bloqueIds: bloques.map((b) => b.id),
    slideIds: slides.map((s) => s.id),
    capaIds: capas.map((c) => c.id),
  };
  const filtroTipo = tipoDeVariablePara(a.tipo);
  const variablesOfrecidas = filtroTipo ? variables.filter((v) => v.tipo === filtroTipo) : variables;

  const selVariable = (valor: string, set: (id: string) => void) => (
    <>
      <select
        aria-label="Variable"
        className={selectCls}
        value={valor}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Elige una variable…</option>
        {variablesOfrecidas.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombre} ({v.tipo})
          </option>
        ))}
      </select>
      <Aviso campo={`${campo}.variableId`} />
    </>
  );
  const selBloque = (valor: string, set: (id: string) => void) => (
    <>
      <select
        aria-label="Elemento"
        className={selectCls}
        value={valor}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Elige un elemento…</option>
        {bloques.map((b) => (
          <option key={b.id} value={b.id}>
            {b.etiqueta}
          </option>
        ))}
      </select>
      <Aviso campo={`${campo}.bloqueId`} />
    </>
  );

  return (
    <div className="space-y-1 rounded-md border border-border p-2" data-campo={campo}>
      <div className="flex items-center gap-1">
        <select
          aria-label="Tipo de acción"
          className={selectCls}
          value={a.tipo}
          onChange={(e) => onChange(accionPorDefecto(e.target.value as AccionTipo, ctx))}
        >
          {GRUPOS_ACCION.map((g) => (
            <optgroup key={g.titulo} label={g.titulo}>
              {g.tipos.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_ACCION[t]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Button type="button" variant="ghost" size="icon" aria-label="Subir acción" className="h-7 w-7" disabled={!onSubir} onClick={onSubir}>
          <ArrowUp className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Bajar acción" className="h-7 w-7" disabled={!onBajar} onClick={onBajar}>
          <ArrowDown className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Quitar acción" className="h-7 w-7 text-destructive" onClick={onQuitar}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {a.tipo === 'ir_a_slide' ? (
        <>
          <select
            aria-label="Slide"
            className={selectCls}
            value={a.slideId}
            onChange={(e) => onChange({ ...a, slideId: e.target.value })}
          >
            <option value="">Elige un slide…</option>
            {slides.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titulo}
              </option>
            ))}
          </select>
          <Aviso campo={`${campo}.slideId`} />
        </>
      ) : null}

      {a.tipo === 'mostrar' || a.tipo === 'ocultar' ? selBloque(a.bloqueId, (bloqueId) => onChange({ ...a, bloqueId })) : null}

      {a.tipo === 'cambiar_estado' ? (
        <>
          {selBloque(a.bloqueId, (bloqueId) => onChange({ ...a, bloqueId }))}
          <select
            aria-label="Nuevo estado"
            className={selectCls}
            value={a.estado}
            onChange={(e) =>
              esEstadoDeBloque(e.target.value, bloques.find((x) => x.id === a.bloqueId)) &&
              onChange({ ...a, estado: e.target.value })
            }
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
            {(bloques.find((x) => x.id === a.bloqueId)?.estados ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
            {!esEstadoDeBloque(a.estado, bloques.find((x) => x.id === a.bloqueId)) ? (
              <option value={a.estado}>(estado eliminado)</option>
            ) : null}
          </select>
        </>
      ) : null}

      {a.tipo === 'abrir_capa' || a.tipo === 'cerrar_capa' ? (
        <>
          <select
            aria-label="Capa"
            className={selectCls}
            value={a.capaId}
            onChange={(e) => onChange({ ...a, capaId: e.target.value })}
          >
            <option value="">Elige una capa…</option>
            {capas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {capas.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Este slide todavía no tiene capas.</p>
          ) : null}
          <Aviso campo={`${campo}.capaId`} />
        </>
      ) : null}

      {a.tipo === 'asignar_variable' ? (
        <>
          {selVariable(a.variableId, (variableId) => onChange(accionConVariable(a, variableId, variables)))}
          <OperandoEditor
            etiqueta="Valor"
            campo={`${campo}.valor`}
            kinds={kindsAsignar(variables.find((v) => v.id === a.variableId)?.tipo)}
            value={a.valor}
            onChange={(valor) => onChange({ ...a, valor })}
          />
        </>
      ) : null}

      {a.tipo === 'sumar_variable' ? (
        <>
          {selVariable(a.variableId, (variableId) => onChange({ ...a, variableId }))}
          <input
            aria-label="Cantidad a sumar"
            type="number"
            className={inputCls}
            value={Number.isFinite(a.cantidad) ? a.cantidad : ''}
            onChange={(e) =>
              onChange({ ...a, cantidad: e.target.value === '' ? Number.NaN : Number(e.target.value) })
            }
          />
          <Aviso campo={`${campo}.cantidad`} />
        </>
      ) : null}

      {a.tipo === 'restar_variable' || a.tipo === 'multiplicar_variable' || a.tipo === 'dividir_variable' ? (
        <>
          {selVariable(a.variableId, (variableId) => onChange({ ...a, variableId }))}
          <OperandoEditor
            etiqueta="Cantidad"
            campo={`${campo}.cantidad`}
            kinds={KINDS_NUMERO}
            value={a.cantidad}
            onChange={(cantidad) => onChange({ ...a, cantidad })}
          />
          {a.tipo === 'dividir_variable' ? (
            <p className="text-[11px] text-muted-foreground">
              Si el divisor vale cero, la variable no cambia.
            </p>
          ) : null}
        </>
      ) : null}

      {a.tipo === 'limpiar_variable' ? (
        <>
          {selVariable(a.variableId, (variableId) => onChange({ ...a, variableId }))}
          <p className="text-[11px] text-muted-foreground">Vuelve a su valor inicial.</p>
        </>
      ) : null}

      {a.tipo === 'concatenar_variable' ? (
        <>
          {selVariable(a.variableId, (variableId) => onChange({ ...a, variableId }))}
          <OperandoEditor
            etiqueta="Texto"
            campo={`${campo}.texto`}
            kinds={[...KINDS_TEXTO, 'literal_numero']}
            value={a.texto}
            onChange={(texto) => onChange({ ...a, texto })}
          />
        </>
      ) : null}

      {a.tipo === 'alternar_variable'
        ? selVariable(a.variableId, (variableId) => onChange({ ...a, variableId }))
        : null}
    </div>
  );
}

/** Al cambiar la variable de «asignar», el valor anterior puede ser de otro tipo: se reinicia. */
function accionConVariable(
  a: Extract<Accion, { tipo: 'asignar_variable' }>,
  variableId: string,
  variables: readonly { id: string; tipo: VariableTipo }[],
): Accion {
  const t = variables.find((v) => v.id === variableId)?.tipo;
  const valor =
    t === 'texto'
      ? { tipo: 'literal' as const, valor: '' }
      : t === 'booleano'
        ? { tipo: 'literal' as const, valor: true }
        : { tipo: 'literal' as const, valor: 0 };
  return { ...a, variableId, valor };
}
