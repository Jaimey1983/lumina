'use client';

import { parseEquation } from '@lumina/chemistry';
import type {
  BalancearEcuacionActivity,
  FormularCompuestoActivity,
  UbicarElementoActivity,
} from '@lumina/types/slide';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { cn } from '@lumina/ui/lib/utils';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import styles from './quimica.module.css';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ─── Balancear ecuación ─────────────────────────────────────────────────────

export function balancearEcuacionTemplate(): BalancearEcuacionActivity {
  return {
    tipo: 'balancear_ecuacion',
    instruccion: 'Ajusta los coeficientes para balancear la ecuación.',
    ecuacion: 'H2 + O2 -> H2O',
  };
}

function BalancearEditorInner({
  activity,
  onChange,
  editorSyncKey,
}: {
  activity: BalancearEcuacionActivity;
  onChange: (a: BalancearEcuacionActivity) => void;
  editorSyncKey: string;
}) {
  const normalize = (a: BalancearEcuacionActivity | null | undefined) =>
    a?.tipo === 'balancear_ecuacion' ? a : balancearEcuacionTemplate();
  const { local, schedulePersist, flush } = useActivityEditor({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });
  return (
    <div className="flex flex-col gap-2 p-3 text-sm">
      <Label>Ecuación (sin coeficientes)</Label>
      <Input
        value={local.ecuacion}
        onChange={(e) => schedulePersist({ ...local, ecuacion: e.target.value })}
        onBlur={flush}
      />
      <Label>Instrucción</Label>
      <Textarea
        value={local.instruccion ?? ''}
        onChange={(e) => schedulePersist({ ...local, instruccion: e.target.value })}
        onBlur={flush}
        rows={2}
      />
    </div>
  );
}

export function BalancearEcuacionEditor(props: {
  editorSyncKey: string;
  activity: BalancearEcuacionActivity | null;
  onChange: (a: BalancearEcuacionActivity) => void;
}) {
  return (
    <BalancearEditorInner
      editorSyncKey={props.editorSyncKey}
      activity={props.activity ?? balancearEcuacionTemplate()}
      onChange={props.onChange}
    />
  );
}

function BalancearCuerpo({
  activity,
  isDark,
  ctx,
  species,
  coeffs,
  sent,
  onBump,
  onSubmit,
}: {
  activity: BalancearEcuacionActivity;
  isDark: boolean;
  ctx: ActivityShellContext;
  species: string[];
  coeffs: number[];
  sent: boolean;
  onBump: (i: number, delta: number) => void;
  onSubmit: () => void;
}) {
  const bloqueado = sent || ctx.sesion.fase !== 'jugando';
  const sinTiempo = !sent && ctx.sesion.motivoFin === 'sin_tiempo';
  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      {activity.instruccion && <p className={styles.instruccion}>{activity.instruccion}</p>}
      <div className={styles.ecuacion}>
        {species.map((sp, i) => (
          <span key={sp + i} className={styles.especie}>
            <button
              type="button"
              className={styles.paso}
              aria-label={`Quitar uno a ${sp}`}
              disabled={bloqueado}
              onClick={() => onBump(i, -1)}
            >
              <Minus className="h-3 w-3" aria-hidden />
            </button>
            <span className={styles.coeficiente} data-coeficiente>
              {coeffs[i] ?? 1}
            </span>
            <button
              type="button"
              className={styles.paso}
              aria-label={`Sumar uno a ${sp}`}
              disabled={bloqueado}
              onClick={() => onBump(i, 1)}
            >
              <Plus className="h-3 w-3" aria-hidden />
            </button>
            <span>{sp}</span>
            {i < species.length - 1 && <span className={styles.mas}>+</span>}
          </span>
        ))}
      </div>
      {sent ? (
        <p role="status" className={styles.enviada}>
          Respuesta enviada.
        </p>
      ) : (
        <button
          type="button"
          className={styles.enviar}
          onClick={onSubmit}
          disabled={bloqueado || coeffs.some((c) => c <= 0)}
        >
          Enviar coeficientes
        </button>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function BalancearEcuacionViewer({
  activity,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  activity: BalancearEcuacionActivity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  const parsed = useMemo(() => {
    try {
      return parseEquation(activity.ecuacion);
    } catch {
      return null;
    }
  }, [activity.ecuacion]);
  const species = useMemo(() => {
    if (!parsed) return [];
    return [...parsed.reactants, ...parsed.products].map((s) => s.rawFormula);
  }, [parsed]);
  const [coeffs, setCoeffs] = useState<number[]>(() => species.map(() => 1));
  const [sent, setSent] = useState(false);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  useEffect(() => {
    setCoeffs(species.map(() => 1));
    setSent(false);
  }, [editorSyncKey, activity.ecuacion, species.length]);

  const bump = (i: number, delta: number) => {
    setCoeffs((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, (next[i] ?? 1) + delta);
      return next;
    });
  };

  const submit = (ctx: ActivityShellContext) => {
    if (sent || ctx.sesion.fase !== 'jugando' || coeffs.some((c) => c <= 0)) return;
    setSent(true);
    // La nota la da `@lumina/scoring`: acá solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.({ coefficients: coeffs });
    ctx.completar();
  };

  if (!parsed) {
    return <p className={styles.error}>La ecuación del docente no es válida.</p>;
  }

  return (
    <ActivityShell
      // Cambiar de slide o de ecuación reinicia también la sesión del shell.
      key={`${editorSyncKey ?? 'be'}|${activity.ecuacion}`}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <BalancearCuerpo
          activity={activity}
          isDark={variant === 'dark'}
          ctx={ctx}
          species={species}
          coeffs={coeffs}
          sent={sent}
          onBump={bump}
          onSubmit={() => submit(ctx)}
        />
      )}
    </ActivityShell>
  );
}

// ─── Ubicar elemento ─────────────────────────────────────────────────────────

export function ubicarElementoTemplate(): UbicarElementoActivity {
  return {
    tipo: 'ubicar_elemento',
    instruccion: 'Indica el periodo y el grupo de cada elemento.',
    elementos: [
      { id: 'e1', symbol: 'Na', periodo: 3, grupo: 1 },
      { id: 'e2', symbol: 'Cl', periodo: 3, grupo: 17 },
    ],
  };
}

export function UbicarElementoEditor(props: {
  editorSyncKey: string;
  activity: UbicarElementoActivity | null;
  onChange: (a: UbicarElementoActivity) => void;
}) {
  const normalize = (a: UbicarElementoActivity | null | undefined) =>
    a?.tipo === 'ubicar_elemento' ? a : ubicarElementoTemplate();
  const { local, schedulePersist, flush } = useActivityEditor({
    data: props.activity,
    editorSyncKey: props.editorSyncKey,
    normalize,
    onChange: props.onChange,
  });
  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <Textarea
        value={local.instruccion ?? ''}
        onChange={(e) => schedulePersist({ ...local, instruccion: e.target.value })}
        onBlur={flush}
        rows={2}
        placeholder="Instrucción"
      />
      {local.elementos.map((el, idx) => (
        <div key={el.id} className="grid grid-cols-4 gap-2 rounded border p-2">
          <Input
            value={el.symbol}
            onChange={(e) => {
              const elementos = [...local.elementos];
              elementos[idx] = { ...el, symbol: e.target.value };
              schedulePersist({ ...local, elementos });
            }}
            onBlur={flush}
            placeholder="Símbolo"
          />
          <Input
            type="number"
            value={el.periodo}
            onChange={(e) => {
              const elementos = [...local.elementos];
              elementos[idx] = { ...el, periodo: Number(e.target.value) };
              schedulePersist({ ...local, elementos });
            }}
            onBlur={flush}
            placeholder="Periodo"
          />
          <Input
            type="number"
            value={el.grupo}
            onChange={(e) => {
              const elementos = [...local.elementos];
              elementos[idx] = { ...el, grupo: Number(e.target.value) };
              schedulePersist({ ...local, elementos });
            }}
            onBlur={flush}
            placeholder="Grupo"
          />
        </div>
      ))}
    </div>
  );
}

type Ubicaciones = Record<string, { periodo: number; grupo: number }>;

function UbicarCuerpo({
  activity,
  ctx,
  answers,
  sent,
  onAnswer,
  onSubmit,
}: {
  activity: UbicarElementoActivity;
  ctx: ActivityShellContext;
  answers: Ubicaciones;
  sent: boolean;
  onAnswer: (id: string, campo: 'periodo' | 'grupo', valor: number) => void;
  onSubmit: () => void;
}) {
  const bloqueado = sent || ctx.sesion.fase !== 'jugando';
  const sinTiempo = !sent && ctx.sesion.motivoFin === 'sin_tiempo';
  return (
    <div className={cn(styles.tarjeta, styles.claro)}>
      {activity.instruccion && <p className={styles.instruccion}>{activity.instruccion}</p>}
      {activity.elementos.map((el) => (
        <div key={el.id} className={styles.ubicacion}>
          <span className={styles.simbolo}>{el.symbol}</span>
          <Input
            type="number"
            min={1}
            max={7}
            placeholder="Periodo"
            aria-label={`Periodo de ${el.symbol}`}
            disabled={bloqueado}
            value={answers[el.id]?.periodo ?? ''}
            onChange={(e) => onAnswer(el.id, 'periodo', Number(e.target.value))}
          />
          <Input
            type="number"
            min={1}
            max={18}
            placeholder="Grupo"
            aria-label={`Grupo de ${el.symbol}`}
            disabled={bloqueado}
            value={answers[el.id]?.grupo ?? ''}
            onChange={(e) => onAnswer(el.id, 'grupo', Number(e.target.value))}
          />
        </div>
      ))}
      {sent ? (
        <p role="status" className={styles.enviada}>
          Respuesta enviada.
        </p>
      ) : (
        <button type="button" className={styles.enviar} disabled={bloqueado} onClick={onSubmit}>
          Enviar ubicaciones
        </button>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function UbicarElementoViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: UbicarElementoActivity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [answers, setAnswers] = useState<Ubicaciones>({});
  const [sent, setSent] = useState(false);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  useEffect(() => {
    setAnswers({});
    setSent(false);
  }, [editorSyncKey]);

  const submit = (ctx: ActivityShellContext) => {
    if (sent || ctx.sesion.fase !== 'jugando') return;
    setSent(true);
    // La nota la da `@lumina/scoring`: acá solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    const placements = activity.elementos.map((el) => ({
      id: el.id,
      periodo: answers[el.id]?.periodo ?? 0,
      grupo: answers[el.id]?.grupo ?? 0,
    }));
    onResponse?.({ placements });
    ctx.completar();
  };

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'ue'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <UbicarCuerpo
          activity={activity}
          ctx={ctx}
          answers={answers}
          sent={sent}
          onAnswer={(id, campo, valor) =>
            setAnswers((a) => ({
              ...a,
              [id]: { periodo: a[id]?.periodo ?? 0, grupo: a[id]?.grupo ?? 0, [campo]: valor },
            }))
          }
          onSubmit={() => submit(ctx)}
        />
      )}
    </ActivityShell>
  );
}

// ─── Formular compuesto ──────────────────────────────────────────────────────

export function formularCompuestoTemplate(): FormularCompuestoActivity {
  return {
    tipo: 'formular_compuesto',
    instruccion: 'Escribe la fórmula de cada compuesto.',
    preguntas: [
      { id: 'q1', enunciado: 'Óxido de calcio', formula: 'CaO' },
      { id: 'q2', enunciado: 'Cloruro de sodio', formula: 'NaCl' },
    ],
  };
}

export function FormularCompuestoEditor(props: {
  editorSyncKey: string;
  activity: FormularCompuestoActivity | null;
  onChange: (a: FormularCompuestoActivity) => void;
}) {
  const normalize = (a: FormularCompuestoActivity | null | undefined) =>
    a?.tipo === 'formular_compuesto' ? a : formularCompuestoTemplate();
  const { local, schedulePersist, flush } = useActivityEditor({
    data: props.activity,
    editorSyncKey: props.editorSyncKey,
    normalize,
    onChange: props.onChange,
  });
  return (
    <div className="flex flex-col gap-2 p-3 text-sm">
      <Textarea
        value={local.instruccion ?? ''}
        onChange={(e) => schedulePersist({ ...local, instruccion: e.target.value })}
        onBlur={flush}
        rows={2}
      />
      {local.preguntas.map((q, idx) => (
        <div key={q.id} className="grid grid-cols-2 gap-2 rounded border p-2">
          <Input
            value={q.enunciado}
            onChange={(e) => {
              const preguntas = [...local.preguntas];
              preguntas[idx] = { ...q, enunciado: e.target.value };
              schedulePersist({ ...local, preguntas });
            }}
            onBlur={flush}
          />
          <Input
            value={q.formula}
            onChange={(e) => {
              const preguntas = [...local.preguntas];
              preguntas[idx] = { ...q, formula: e.target.value };
              schedulePersist({ ...local, preguntas });
            }}
            onBlur={flush}
            placeholder="Fórmula modelo"
          />
        </div>
      ))}
    </div>
  );
}

function FormularCuerpo({
  activity,
  ctx,
  answers,
  sent,
  onAnswer,
  onSubmit,
}: {
  activity: FormularCompuestoActivity;
  ctx: ActivityShellContext;
  answers: Record<string, string>;
  sent: boolean;
  onAnswer: (id: string, valor: string) => void;
  onSubmit: () => void;
}) {
  const bloqueado = sent || ctx.sesion.fase !== 'jugando';
  const sinTiempo = !sent && ctx.sesion.motivoFin === 'sin_tiempo';
  return (
    <div className={cn(styles.tarjeta, styles.claro)}>
      {activity.instruccion && <p className={styles.instruccion}>{activity.instruccion}</p>}
      {activity.preguntas.map((q) => (
        <div key={q.id} className={styles.pregunta}>
          <Label htmlFor={`fc-${q.id}`}>{q.enunciado}</Label>
          <Input
            id={`fc-${q.id}`}
            disabled={bloqueado}
            value={answers[q.id] ?? ''}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            placeholder="Fórmula"
          />
        </div>
      ))}
      {sent ? (
        <p role="status" className={styles.enviada}>
          Respuesta enviada.
        </p>
      ) : (
        <button type="button" className={styles.enviar} disabled={bloqueado} onClick={onSubmit}>
          Enviar fórmulas
        </button>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function FormularCompuestoViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: FormularCompuestoActivity;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const ajustes = useMemo(() => normalizarAjustes(activity), [activity]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  useEffect(() => {
    setAnswers({});
    setSent(false);
  }, [editorSyncKey]);

  const submit = (ctx: ActivityShellContext) => {
    if (sent || ctx.sesion.fase !== 'jugando') return;
    setSent(true);
    // La nota la da `@lumina/scoring`: acá solo el sonido de envío.
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.({ answers });
    ctx.completar();
  };

  return (
    <ActivityShell
      // Cambiar de slide reinicia también la sesión del shell.
      key={editorSyncKey ?? 'fc'}
      ajustes={ajustes}
      resultado="ninguno"
    >
      {(ctx) => (
        <FormularCuerpo
          activity={activity}
          ctx={ctx}
          answers={answers}
          sent={sent}
          onAnswer={(id, valor) => setAnswers((a) => ({ ...a, [id]: valor }))}
          onSubmit={() => submit(ctx)}
        />
      )}
    </ActivityShell>
  );
}
