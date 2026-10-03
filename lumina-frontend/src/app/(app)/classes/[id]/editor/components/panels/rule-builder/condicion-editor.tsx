'use client';

import { Trash2 } from 'lucide-react';
import type { Condicion, OperadorComparacion } from '@lumina/types/interaction';
import { Button } from '@lumina/ui/button';
import {
  actualizarCondicion,
  agregarCondicion,
  alternarGrupo,
  alternarNegacion,
  quitarCondicion,
} from '@lumina/interactions';
import type { RutaCondicion } from '@lumina/interactions';

import { Aviso, selectCls, useOpciones } from './campos';
import { OperandoEditor } from './operando-editor';
import {
  ETIQUETA_OPERADOR,
  KINDS_IZQUIERDA,
  KINDS_NUMERICOS,
  condicionPorDefecto,
  kindsParaDerecha,
  operadoresPara,
  tipoDe,
} from './modelo';
import type { CondicionKind } from './modelo';

interface ListaProps {
  condiciones: readonly Condicion[];
  onChange: (c: Condicion[]) => void;
}

/** Raíz de las condiciones de una regla: todas deben cumplirse (Y implícito). */
export function ArbolDeCondiciones({ condiciones, onChange }: ListaProps) {
  return (
    <div className="space-y-2">
      {condiciones.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Sin condiciones: la regla se ejecuta siempre que ocurra el evento.
        </p>
      ) : (
        <>
          {condiciones.length > 1 ? (
            <p className="text-[11px] text-muted-foreground">
              Deben cumplirse <strong>todas</strong> estas condiciones.
            </p>
          ) : null}
          {condiciones.map((c, i) => (
            <Nodo key={i} c={c} ruta={[i]} raiz={condiciones} onChange={onChange} />
          ))}
        </>
      )}
      <AgregarCondicion
        onAgregar={(c) => onChange(agregarCondicion(condiciones, [], c))}
      />
    </div>
  );
}

function AgregarCondicion({ onAgregar }: { onAgregar: (c: Condicion) => void }) {
  const { variables, bloques } = useOpciones();
  const ids = bloques.map((b) => b.id);
  const nueva = (k: CondicionKind) => onAgregar(condicionPorDefecto(k, variables, ids));
  return (
    <div className="flex flex-wrap gap-1">
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => nueva('comparacion')}>
        + Condición
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => nueva('entre')}>
        + Entre dos valores
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => nueva('grupo_o')}>
        + Grupo «o»
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => nueva('grupo_y')}>
        + Grupo «y»
      </Button>
    </div>
  );
}

interface NodoProps {
  c: Condicion;
  ruta: RutaCondicion;
  raiz: readonly Condicion[];
  onChange: (c: Condicion[]) => void;
}

/**
 * Convierte la ruta del árbol en el `campo` que usa `validarRegla`. Hay que ir
 * mirando el tipo de cada nodo: bajo un grupo se escribe `.condiciones.j` y bajo
 * un «no», `.condicion`.
 */
export function campoPara(raiz: readonly Condicion[], ruta: RutaCondicion): string {
  let campo = `condiciones.${ruta[0] ?? 0}`;
  let actual: Condicion | undefined = raiz[ruta[0] ?? 0];
  for (const i of ruta.slice(1)) {
    if (!actual) break;
    if (actual.tipo === 'no') {
      campo += '.condicion';
      actual = actual.condicion;
    } else if (actual.tipo === 'y' || actual.tipo === 'o') {
      campo += `.condiciones.${i}`;
      actual = actual.condiciones[i];
    } else break;
  }
  return campo;
}

function Nodo({ c, ruta, raiz, onChange }: NodoProps) {
  const { variables } = useOpciones();
  const campo = campoPara(raiz, ruta);
  const set = (fn: (x: Condicion) => Condicion) => onChange(actualizarCondicion(raiz, ruta, fn));

  const cabecera = (titulo: string) => (
    <div className="flex items-center justify-between gap-1">
      <span className="text-[11px] font-medium">{titulo}</span>
      <div className="flex items-center gap-1">
        {c.tipo !== 'no' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px]"
            onClick={() => onChange(alternarNegacion(raiz, ruta))}
          >
            Negar
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Quitar condición"
          className="h-6 w-6 text-destructive"
          onClick={() => onChange(quitarCondicion(raiz, ruta))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );

  if (c.tipo === 'no') {
    return (
      <div className="space-y-1 rounded-md border border-dashed border-border p-2" data-campo={campo}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium">NO se cumple que…</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px]"
            onClick={() => onChange(alternarNegacion(raiz, ruta))}
          >
            Quitar el «no»
          </Button>
        </div>
        <Nodo c={c.condicion} ruta={[...ruta, 0]} raiz={raiz} onChange={onChange} />
      </div>
    );
  }

  if (c.tipo === 'y' || c.tipo === 'o') {
    return (
      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2" data-campo={campo}>
        <div className="flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px]"
            aria-label="Cambiar entre «y» y «o»"
            onClick={() => onChange(alternarGrupo(raiz, ruta))}
          >
            {c.tipo === 'y' ? 'Se cumplen TODAS (y)' : 'Se cumple ALGUNA (o)'}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => onChange(alternarNegacion(raiz, ruta))}
            >
              Negar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar grupo"
              className="h-6 w-6 text-destructive"
              onClick={() => onChange(quitarCondicion(raiz, ruta))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {c.condiciones.map((h, j) => (
          <Nodo key={j} c={h} ruta={[...ruta, j]} raiz={raiz} onChange={onChange} />
        ))}
        <AgregarCondicion onAgregar={(n) => onChange(agregarCondicion(raiz, ruta, n))} />
        <Aviso campo={campo} />
      </div>
    );
  }

  if (c.tipo === 'entre') {
    return (
      <div className="space-y-1 rounded-md border border-border p-2" data-campo={campo}>
        {cabecera('Está entre dos valores')}
        <OperandoEditor
          etiqueta="Valor"
          campo={`${campo}.valor`}
          kinds={KINDS_NUMERICOS}
          value={c.valor}
          onChange={(valor) => set((x) => (x.tipo === 'entre' ? { ...x, valor } : x))}
        />
        <OperandoEditor
          etiqueta="Desde"
          campo={`${campo}.desde`}
          kinds={KINDS_NUMERICOS}
          value={c.desde}
          onChange={(desde) => set((x) => (x.tipo === 'entre' ? { ...x, desde } : x))}
        />
        <OperandoEditor
          etiqueta="Hasta"
          campo={`${campo}.hasta`}
          kinds={KINDS_NUMERICOS}
          value={c.hasta}
          onChange={(hasta) => set((x) => (x.tipo === 'entre' ? { ...x, hasta } : x))}
        />
        <p className="text-[11px] text-muted-foreground">Incluye los dos extremos.</p>
      </div>
    );
  }

  // comparación
  const tipoIzq = tipoDe(c.izquierda, variables);
  const operadores = operadoresPara(tipoIzq);
  const operador: OperadorComparacion = operadores.includes(c.operador) ? c.operador : operadores[0]!;
  return (
    <div className="space-y-1 rounded-md border border-border p-2" data-campo={campo}>
      {cabecera('Comparar')}
      <OperandoEditor
        etiqueta="Dato"
        campo={`${campo}.izquierda`}
        kinds={KINDS_IZQUIERDA}
        value={c.izquierda}
        onChange={(izquierda) =>
          set((x) => {
            if (x.tipo !== 'comparacion') return x;
            const nuevoTipo = tipoDe(izquierda, variables);
            const ops = operadoresPara(nuevoTipo);
            return {
              ...x,
              izquierda,
              operador: ops.includes(x.operador) ? x.operador : ops[0]!,
              // Si cambió el tipo, el lado derecho anterior ya no es comparable: se reinicia.
              derecha:
                nuevoTipo === tipoIzq
                  ? x.derecha
                  : nuevoTipo === 'numero'
                    ? { tipo: 'literal', valor: 0 }
                    : nuevoTipo === 'booleano'
                      ? { tipo: 'literal', valor: true }
                      : { tipo: 'literal', valor: nuevoTipo === 'texto' ? '' : 'visitado' },
            };
          })
        }
      />
      <select
        aria-label="Operador"
        className={selectCls}
        value={operador}
        onChange={(e) =>
          set((x) =>
            x.tipo === 'comparacion' ? { ...x, operador: e.target.value as OperadorComparacion } : x,
          )
        }
      >
        {operadores.map((o) => (
          <option key={o} value={o}>
            {ETIQUETA_OPERADOR[o]}
          </option>
        ))}
      </select>
      {tipoIzq === 'texto' && c.izquierda.tipo === 'estado_bloque' ? (
        <select
          aria-label="Estado"
          className={selectCls}
          value={c.derecha.tipo === 'literal' ? String(c.derecha.valor) : 'visitado'}
          onChange={(e) =>
            set((x) =>
              x.tipo === 'comparacion'
                ? { ...x, derecha: { tipo: 'literal', valor: e.target.value } }
                : x,
            )
          }
        >
          <option value="normal">normal</option>
          <option value="visitado">visitado</option>
          <option value="seleccionado">seleccionado</option>
          <option value="deshabilitado">deshabilitado</option>
        </select>
      ) : (
        <OperandoEditor
          etiqueta="Valor"
          campo={`${campo}.derecha`}
          kinds={kindsParaDerecha(tipoIzq)}
          value={c.derecha}
          onChange={(derecha) => set((x) => (x.tipo === 'comparacion' ? { ...x, derecha } : x))}
        />
      )}
    </div>
  );
}
