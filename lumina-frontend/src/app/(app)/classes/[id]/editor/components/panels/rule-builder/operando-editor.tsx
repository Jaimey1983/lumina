'use client';

import type { ClaveSistema, Operando } from '@lumina/types/interaction';
import { CLAVES_SISTEMA, CLAVES_SISTEMA_ETIQUETA } from '@lumina/interactions';

import { Aviso, inputCls, selectCls, useOpciones } from './campos';
import {
  ESTADOS,
  ETIQUETA_KIND,
  kindDeOperando,
  operandoPorDefecto,
} from './modelo';
import type { OperandoKind } from './modelo';

export interface OperandoEditorProps {
  value: Operando;
  onChange: (o: Operando) => void;
  /** Clases de operando que se ofrecen. */
  kinds: readonly OperandoKind[];
  /** Ruta del campo para pintar sus avisos (`acciones.0.valor`). */
  campo: string;
  etiqueta: string;
}

export function OperandoEditor({ value, onChange, kinds, campo, etiqueta }: OperandoEditorProps) {
  const { variables, bloques } = useOpciones();
  const kind = kindDeOperando(value);
  // Si el operando actual no está entre los permitidos (p. ej. cambió el lado izquierdo), se muestra igual.
  const ofrecidos = kinds.includes(kind) ? kinds : [kind, ...kinds];
  const respondibles = bloques.filter((b) => b.respondible);

  const idsParaKind = (k: OperandoKind): readonly string[] =>
    (k === 'respuesta_correcta' ? respondibles : bloques).map((b) => b.id);

  return (
    <div className="space-y-1" data-campo={campo}>
      <select
        aria-label={`${etiqueta}: tipo de dato`}
        className={selectCls}
        value={kind}
        onChange={(e) => {
          const k = e.target.value as OperandoKind;
          onChange(operandoPorDefecto(k, variables, idsParaKind(k)));
        }}
      >
        {ofrecidos.map((k) => (
          <option key={k} value={k}>
            {ETIQUETA_KIND[k]}
          </option>
        ))}
      </select>

      {value.tipo === 'literal' && typeof value.valor === 'number' ? (
        <input
          aria-label={`${etiqueta}: número`}
          type="number"
          className={inputCls}
          value={Number.isFinite(value.valor) ? value.valor : ''}
          onChange={(e) =>
            onChange({ tipo: 'literal', valor: e.target.value === '' ? Number.NaN : Number(e.target.value) })
          }
        />
      ) : null}
      {value.tipo === 'literal' && typeof value.valor === 'string' ? (
        <input
          aria-label={`${etiqueta}: texto`}
          className={inputCls}
          value={value.valor}
          maxLength={200}
          onChange={(e) => onChange({ tipo: 'literal', valor: e.target.value })}
        />
      ) : null}
      {value.tipo === 'literal' && typeof value.valor === 'boolean' ? (
        <select
          aria-label={`${etiqueta}: sí o no`}
          className={selectCls}
          value={value.valor ? 'si' : 'no'}
          onChange={(e) => onChange({ tipo: 'literal', valor: e.target.value === 'si' })}
        >
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
      ) : null}

      {value.tipo === 'variable' ? (
        <select
          aria-label={`${etiqueta}: variable`}
          className={selectCls}
          value={value.variableId}
          onChange={(e) => onChange({ tipo: 'variable', variableId: e.target.value })}
        >
          <option value="">Elige una variable…</option>
          {variables.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre} ({v.tipo})
            </option>
          ))}
        </select>
      ) : null}

      {value.tipo === 'estado_bloque' || value.tipo === 'respuesta_correcta' ? (
        <select
          aria-label={`${etiqueta}: elemento`}
          className={selectCls}
          value={value.bloqueId}
          onChange={(e) => onChange({ ...value, bloqueId: e.target.value })}
        >
          <option value="">Elige un elemento…</option>
          {(value.tipo === 'respuesta_correcta' ? respondibles : bloques).map((b) => (
            <option key={b.id} value={b.id}>
              {b.etiqueta}
            </option>
          ))}
        </select>
      ) : null}

      {value.tipo === 'sistema' ? (
        <>
          <select
            aria-label={`${etiqueta}: dato del sistema`}
            className={selectCls}
            value={value.clave}
            onChange={(e) => onChange({ tipo: 'sistema', clave: e.target.value as ClaveSistema })}
          >
            {CLAVES_SISTEMA.map((c) => (
              <option key={c} value={c}>
                {CLAVES_SISTEMA_ETIQUETA[c]}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Los datos del sistema todavía no los entrega la clase: una condición que los use no se
            cumple hasta que se activen.
          </p>
        </>
      ) : null}
      <Aviso campo={campo} />
    </div>
  );
}

export { ESTADOS };
