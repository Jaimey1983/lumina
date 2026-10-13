'use client';

import { useMemo, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ClozeBancoActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';

import {
  CLOZE_MAX_BLANCOS,
  CLOZE_MAX_DISTRACTORES,
  generarIdCloze,
  idsEnTexto,
  normalizarClozeBanco,
} from './cloze-banco-config.js';

interface ClozeBancoPropertiesProps {
  actividad: ClozeBancoActivity;
  onChange: (actividad: ClozeBancoActivity) => void;
}

const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';

export function ClozeBancoProperties({ actividad, onChange }: ClozeBancoPropertiesProps) {
  // El editor conserva todos los huecos (también los que ya no están en el texto) para poder corregirlos.
  const act = useMemo(() => normalizarClozeBanco(actividad, false), [actividad]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const emitir = (parche: Partial<ClozeBancoActivity>) => onChange({ ...act, ...parche });

  const enTexto = useMemo(() => idsEnTexto(act.texto), [act.texto]);
  // Primero los que aparecen en el texto (en su orden), luego los huérfanos.
  const ordenados = useMemo(() => {
    const enOrden = enTexto.flatMap((id) => act.blancos.filter((b) => b.id === id));
    const huerfanos = act.blancos.filter((b) => !enTexto.includes(b.id));
    return [...enOrden, ...huerfanos];
  }, [act.blancos, enTexto]);

  const agregarHueco = () => {
    if (act.blancos.length >= CLOZE_MAX_BLANCOS) return;
    const id = generarIdCloze();
    const marcador = `{{blank:${id}}}`;
    const area = areaRef.current;
    const pos = area ? area.selectionStart : act.texto.length;
    const texto = act.texto.slice(0, pos) + marcador + act.texto.slice(pos);
    emitir({ texto, blancos: [...act.blancos, { id, respuesta: '' }] });
  };

  const cambiarRespuesta = (id: string, respuesta: string) =>
    emitir({ blancos: act.blancos.map((b) => (b.id === id ? { ...b, respuesta } : b)) });

  const quitarHueco = (id: string) =>
    emitir({
      // El marcador se reemplaza por «___» para no dejar la frase rota (como en completar_blancos).
      texto: act.texto.split(`{{blank:${id}}}`).join('___'),
      blancos: act.blancos.filter((b) => b.id !== id),
    });

  const cambiarDistractor = (i: number, valor: string) =>
    emitir({ distractores: act.distractores.map((d, n) => (n === i ? valor : d)) });
  const quitarDistractor = (i: number) => emitir({ distractores: act.distractores.filter((_, n) => n !== i) });
  const agregarDistractor = () => {
    if (act.distractores.length >= CLOZE_MAX_DISTRACTORES) return;
    emitir({ distractores: [...act.distractores, ''] });
  };

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="cb-texto" className="text-[11px]">
          Texto
        </Label>
        <textarea
          id="cb-texto"
          ref={areaRef}
          value={act.texto}
          onChange={(e) => emitir({ texto: e.target.value })}
          rows={5}
          placeholder="Escribe el texto y marca cada hueco con {{blank:id}} (o usa «Agregar hueco»)."
          className={CAMPO}
        />
        <p className="text-[10px] text-muted-foreground">
          Coloca el cursor donde va el hueco y pulsa «Agregar hueco»: se inserta el marcador y su respuesta.
        </p>
      </div>

      <section aria-label="Huecos" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Huecos ({act.blancos.length}/{CLOZE_MAX_BLANCOS})
        </h4>
        {ordenados.map((b, n) => (
          <div key={b.id} className="flex flex-col gap-1 rounded border border-border bg-muted/40 p-2">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{n + 1}.</span>
              <input
                type="text"
                aria-label={`Respuesta del hueco ${n + 1}`}
                value={b.respuesta}
                onChange={(e) => cambiarRespuesta(b.id, e.target.value)}
                placeholder="Palabra correcta"
                className={CAMPO}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
                aria-label={`Quitar hueco ${n + 1}`}
                onClick={() => quitarHueco(b.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            {!enTexto.includes(b.id) && (
              <p className="text-[10px] text-muted-foreground">Este hueco no aparece en el texto: no se jugará.</p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          disabled={act.blancos.length >= CLOZE_MAX_BLANCOS}
          onClick={agregarHueco}
        >
          <Plus className="size-3" /> Agregar hueco
        </Button>
      </section>

      <section aria-label="Distractores" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Distractores ({act.distractores.length}/{CLOZE_MAX_DISTRACTORES})
        </h4>
        <p className="text-[10px] text-muted-foreground">Palabras del banco que no son respuesta de ningún hueco.</p>
        {act.distractores.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              aria-label={`Distractor ${i + 1}`}
              value={d}
              onChange={(e) => cambiarDistractor(i, e.target.value)}
              placeholder="Palabra que despista"
              className={CAMPO}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              aria-label={`Quitar distractor ${i + 1}`}
              onClick={() => quitarDistractor(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          disabled={act.distractores.length >= CLOZE_MAX_DISTRACTORES}
          onClick={agregarDistractor}
        >
          <Plus className="size-3" /> Agregar distractor
        </Button>
      </section>
    </div>
  );
}
