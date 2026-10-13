'use client';

/**
 * Viewer de Emparejar sobre el `ActivityShell` (U9b.3).
 *
 * Se une tocando: un lado izquierdo y luego su pareja de la derecha (ya era así; ahora cada
 * lado es un botón operable con teclado, con `aria-pressed` y anuncios `aria-live`). Lo que
 * sale hacia `@lumina/scoring` NO cambió: el arreglo `[{ leftId, rightId }]` en el orden en que
 * se hicieron las parejas, por `onResponse`. El resultado se muestra en el lugar («¡Respuesta
 * enviada!»), no en un diálogo, como siempre.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EmparejaLado, MatchPairs } from '@lumina/types/slide';

import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { AnuncioTocarColocar } from '../_shared/activity-tap-place.js';
import { barajar } from '../_shared/barajar.js';
import { RenderLado } from './emparejar-shared.js';
import { etiquetaLado, ladoTieneImagen } from './emparejar-config.js';
import styles from './emparejar.module.css';

interface EmparejarViewerProps {
  actividad: MatchPairs;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}

interface Pareja {
  leftId: string;
  rightId: string;
}
type LadoDerecho = { id: string; lado: EmparejaLado };

/** Nombre hablado de un lado: su texto, o «imagen» si solo tiene imagen. */
const nombreLado = (lado: EmparejaLado) => (etiquetaLado(lado) === '[Imagen]' ? 'imagen' : etiquetaLado(lado));

interface CuerpoProps {
  actividad: MatchPairs;
  derechos: LadoDerecho[];
  isDark: boolean;
  ctx: ActivityShellContext;
  enviada: boolean;
  parejas: Pareja[];
  setParejas: React.Dispatch<React.SetStateAction<Pareja[]>>;
  onEnviar: () => void;
}

function Cuerpo({ actividad, derechos, isDark, ctx, enviada, parejas, setParejas, onEnviar }: CuerpoProps) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const bloqueado = enviada || ctx.sesion.fase !== 'jugando';
  const { setProgreso } = ctx;
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';

  useEffect(() => {
    setProgreso(parejas.length);
  }, [parejas.length, setProgreso]);

  const izquierdoDe = (id: string) => actividad.pares.find((p) => p.id === id)?.izquierda;

  const alTocarIzquierdo = (id: string, lado: EmparejaLado) => {
    if (bloqueado) return;
    if (parejas.some((m) => m.leftId === id)) {
      setParejas((prev) => prev.filter((m) => m.leftId !== id));
      setAnuncio(`Quitaste la pareja de ${nombreLado(lado)}.`);
      return;
    }
    if (elegido === id) {
      setElegido(null);
      setAnuncio(`Cancelaste la elección de ${nombreLado(lado)}.`);
    } else {
      setElegido(id);
      setAnuncio(`Elegiste ${nombreLado(lado)}. Ahora elige su pareja en la otra columna.`);
    }
  };

  const alTocarDerecho = (rightId: string, lado: EmparejaLado) => {
    if (bloqueado || !elegido || parejas.some((m) => m.rightId === rightId)) return;
    const izq = izquierdoDe(elegido);
    setParejas((prev) => {
      const filtradas = prev.filter((m) => m.leftId !== elegido && m.rightId !== rightId);
      return [...filtradas, { leftId: elegido, rightId }];
    });
    setAnuncio(`Emparejaste ${izq ? nombreLado(izq) : ''} con ${nombreLado(lado)}.`);
    setElegido(null);
  };

  const claseDe = (extra: string[]) => extra.filter(Boolean).join(' ');

  return (
    <div className={claseDe([styles.tarjeta, isDark ? styles.oscuro : styles.claro])}>
      {actividad.instruccion && <p className={styles.instruccion}>{actividad.instruccion}</p>}

      <div className={styles.columnas}>
        <div className={styles.columna}>
          {actividad.pares.map((p) => {
            const idx = parejas.findIndex((m) => m.leftId === p.id);
            const unido = idx !== -1;
            const elegidoAhora = elegido === p.id;
            const nombre = nombreLado(p.izquierda);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={unido ? undefined : elegidoAhora}
                aria-label={unido ? `${nombre}, emparejado (pareja ${idx + 1}). Pulsa para quitar la pareja.` : undefined}
                disabled={bloqueado}
                onClick={() => alTocarIzquierdo(p.id, p.izquierda)}
                className={claseDe([
                  styles.lado,
                  ladoTieneImagen(p.izquierda) ? styles.conImagen : '',
                  elegidoAhora ? styles.elegido : unido ? styles.unido : '',
                ])}
              >
                <span className={styles.contenido}>
                  <RenderLado lado={p.izquierda} textClassName={isDark ? styles.textoClaro : undefined} />
                </span>
                {unido && <span className={styles.insignia}>{idx + 1}</span>}
              </button>
            );
          })}
        </div>

        <div className={styles.columna}>
          {derechos.map((r) => {
            const idx = parejas.findIndex((m) => m.rightId === r.id);
            const unido = idx !== -1;
            const nombre = nombreLado(r.lado);
            return (
              <button
                key={r.id}
                type="button"
                aria-label={unido ? `${nombre}, emparejado (pareja ${idx + 1})` : undefined}
                aria-disabled={unido || !elegido || undefined}
                disabled={bloqueado}
                onClick={() => alTocarDerecho(r.id, r.lado)}
                className={claseDe([
                  styles.lado,
                  ladoTieneImagen(r.lado) ? styles.conImagen : '',
                  unido ? styles.unido : '',
                  !unido && !elegido ? styles.sinElegir : '',
                ])}
              >
                {unido && <span className={styles.insignia}>{idx + 1}</span>}
                <span className={styles.contenido}>
                  <RenderLado lado={r.lado} textClassName={isDark ? styles.textoClaro : undefined} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <AnuncioTocarColocar anuncio={anuncio} />

      {enviada ? (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <div className={styles.acciones}>
          <button
            type="button"
            className={styles.enviar}
            disabled={bloqueado || parejas.length !== actividad.pares.length}
            onClick={onEnviar}
          >
            Enviar
          </button>
        </div>
      )}
      {sinTiempo && (
        <p role="status" className={styles.tiempo}>
          Se acabó el tiempo.
        </p>
      )}
    </div>
  );
}

export function EmparejarViewer({ actividad, editorSyncKey, onResponse, variant = 'light' }: EmparejarViewerProps) {
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  const semilla = ajustes.semilla;
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  const mezclar = useCallback(
    () =>
      barajar(
        (actividad?.pares ?? []).map((p) => ({ id: p.id, lado: p.derecha })),
        semilla,
        0,
      ),
    [actividad?.pares, semilla],
  );
  const [derechos, setDerechos] = useState<LadoDerecho[]>([]);
  const [parejas, setParejas] = useState<Pareja[]>([]);
  const [enviada, setEnviada] = useState(false);
  // Cada cambio de slide o de pares (p. ej. al editar) es una corrida nueva, también para el shell.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!actividad?.pares) return;
    setDerechos(mezclar());
    setParejas([]);
    setEnviada(false);
    setVersion((v) => v + 1);
  }, [actividad?.pares, editorSyncKey, mezclar]);

  if (!actividad) return null;

  const enviar = (ctx: ActivityShellContext) => {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    setEnviada(true);
    const ok =
      actividad.pares.length > 0 &&
      parejas.length === actividad.pares.length &&
      parejas.every((m) => m.leftId === m.rightId);
    feedback.emitir(ok ? 'acierto' : 'error', { movimiento: false });
    onResponse?.(parejas);
    ctx.completar();
  };

  return (
    <ActivityShell key={version} ajustes={ajustes} total={actividad.pares.length} resultado="ninguno">
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          derechos={derechos}
          isDark={variant === 'dark'}
          ctx={ctx}
          enviada={enviada}
          parejas={parejas}
          setParejas={setParejas}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}
