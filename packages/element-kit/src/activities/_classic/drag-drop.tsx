'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, GripVertical, Plus, Trash2 } from 'lucide-react';

import type { DragDrop, DragDropItem, DragDropZone } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lumina/ui/select';
import { cn } from '@lumina/ui/lib/utils';
import { wrapActivityDraftResponse } from '@lumina/scoring';
import { useActivityEditor } from '@lumina/editor-shared/use-activity-editor';

import { colisionPorPuntero } from '../_shared/activity-colisiones.js';
import { ActivityDndRoot } from '../_shared/activity-dnd-root.js';
import { useActivityFeedback } from '../_shared/activity-feedback.js';
import { normalizarAjustes } from '../_shared/activity-settings.js';
import { ActivityShell, type ActivityShellContext } from '../_shared/activity-shell.js';
import { AnuncioTocarColocar, ModoEntradaToggle } from '../_shared/activity-tap-place.js';
import {
  useContenedorSoltable,
  usePiezaArrastrable,
  useUbicarElementos,
} from '../_shared/ubicar-elementos.js';
import styles from './drag-drop.module.css';

/** Soltar manda el puntero (no el área de la pieza): las zonas pequeñas aciertan a la primera. */
const COLISIONES = colisionPorPuntero();

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  actividad: DragDrop;
  modo: 'editor' | 'viewer';
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorView({ actividad }: { actividad: DragDrop }) {
  return (
    <div className="@container/dd space-y-4 rounded-lg border border-border bg-white p-4 shadow-lumina-xs">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Arrastrar y soltar
        </span>
        {actividad.puntos !== undefined && (
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {actividad.puntos} pts
          </span>
        )}
      </div>

      <p className="text-sm">{actividad.instruccion}</p>

      <div className="grid grid-cols-1 gap-4 @lg/dd:grid-cols-2">
        {/* Items column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Elementos
          </p>
          <div className="space-y-1.5">
            {actividad.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs"
              >
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" />
                {item.texto}
              </div>
            ))}
          </div>
        </div>

        {/* Zones column */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zonas
          </p>
          <div className="space-y-2">
            {actividad.zonas.map((zone) => (
              <div key={zone.id} className="rounded-md border border-dashed border-border p-2.5">
                <p className="mb-1.5 text-xs font-medium">{zone.etiqueta}</p>
                {zone.itemsCorrectos.map((itemId) => {
                  const item = actividad.items.find((i) => i.id === itemId);
                  return item ? (
                    <div
                      key={itemId}
                      className="flex items-center gap-1.5 text-xs text-green-700"
                    >
                      <CheckCircle className="size-3 shrink-0" />
                      {item.texto}
                    </div>
                  ) : null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Viewer (sobre el ActivityShell, U9b.6) ──────────────────────────────────────
//
// Antes usaba el arrastre nativo de HTML5 (sin teclado ni táctil). Ahora usa dnd-kit
// (`ActivityDndRoot`: ratón, táctil, teclado y anuncios en español) y un modo «tocar y colocar».
// Lo que sale hacia `@lumina/scoring` NO cambió: BORRADORES `wrapActivityDraftResponse([{ itemId,
// zoneId }])` en cada colocación y la respuesta final sin envolver al enviar.

/** Destino de «sin ubicar» en el evento de arrastre; las zonas usan su propio `id`. */
const ID_DISPONIBLES = 'disponibles';

type Ubicaciones = Record<string, string | null>;

const sinUbicar = (items: DragDropItem[]): Ubicaciones => Object.fromEntries(items.map((i) => [i.id, null]));

/**
 * Coloca `itemId` en `destino` (`id` de zona o `disponibles`). Devuelve el estado nuevo, o `null`
 * si se rechaza (zona llena, o el elemento no existe).
 */
function colocar(
  actual: Ubicaciones,
  actividad: DragDrop,
  itemId: string,
  destino: string,
): { siguiente: Ubicaciones; motivoRechazo?: undefined } | { siguiente: null; motivoRechazo: 'llena' | 'desconocido' } {
  if (!(itemId in actual)) return { siguiente: null, motivoRechazo: 'desconocido' };
  if (destino === ID_DISPONIBLES) return { siguiente: { ...actual, [itemId]: null } };
  const zona = actividad.zonas.find((z) => z.id === destino);
  if (!zona) return { siguiente: null, motivoRechazo: 'desconocido' };
  const ocupadas = actividad.items.filter((i) => actual[i.id] === destino).length;
  if (zona.capacidadMaxima !== undefined && ocupadas >= zona.capacidadMaxima) {
    return { siguiente: null, motivoRechazo: 'llena' };
  }
  return { siguiente: { ...actual, [itemId]: destino } };
}

function Ficha({
  item,
  bloqueado,
  arrastrando,
  elegida,
  isDark,
  propsTocar,
}: {
  item: DragDropItem;
  bloqueado: boolean;
  arrastrando: boolean;
  elegida: boolean;
  isDark: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
}) {
  const { attributes, listeners, setNodeRef } = usePiezaArrastrable(item.id, item.texto, bloqueado);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        styles.ficha,
        isDark ? styles.fichaOscura : styles.fichaClara,
        bloqueado && styles.fichaBloqueada,
        arrastrando && styles.fichaArrastrada,
        elegida && styles.fichaElegida,
      )}
      {...(bloqueado ? {} : { ...listeners, ...attributes })}
      {...propsTocar}
    >
      <GripVertical className={styles.asa} aria-hidden />
      {item.texto}
    </div>
  );
}

function Zona({
  id,
  etiqueta,
  resaltar,
  isDark,
  propsTocar,
  children,
  className,
}: {
  id: string;
  etiqueta: string;
  resaltar: boolean;
  isDark: boolean;
  propsTocar?: React.HTMLAttributes<HTMLElement>;
  children: React.ReactNode;
  className: string;
}) {
  const { setNodeRef, isOver } = useContenedorSoltable(id, etiqueta);
  return (
    <div
      ref={setNodeRef}
      {...propsTocar}
      aria-label={propsTocar ? etiqueta : undefined}
      className={cn(
        className,
        isDark ? styles.zonaOscura : styles.zonaClara,
        (resaltar || isOver) && styles.zonaActiva,
      )}
    >
      {children}
    </div>
  );
}

interface CuerpoProps {
  actividad: DragDrop;
  isDark: boolean;
  ctx: ActivityShellContext;
  ubicaciones: Ubicaciones;
  setUbicaciones: React.Dispatch<React.SetStateAction<Ubicaciones>>;
  enviada: boolean;
  onBorrador: (u: Ubicaciones) => void;
  onEnviar: () => void;
}

function Cuerpo({ actividad, isDark, ctx, ubicaciones, setUbicaciones, enviada, onBorrador, onEnviar }: CuerpoProps) {
  const bloqueado = enviada || ctx.sesion.fase !== 'jugando';
  const sinTiempo = !enviada && ctx.sesion.motivoFin === 'sin_tiempo';
  const { setProgreso } = ctx;
  const [aviso, setAviso] = useState('');

  const sueltos = actividad.items.filter((i) => ubicaciones[i.id] === null);
  const colocados = actividad.items.length - sueltos.length;

  const nombreZona = useCallback(
    (id: string) =>
      id === ID_DISPONIBLES ? 'elementos disponibles' : actividad.zonas.find((z) => z.id === id)?.etiqueta || 'una zona',
    [actividad.zonas],
  );

  const aplicar = useCallback(
    (itemId: string, destino: string) => {
      if (bloqueado) return;
      const r = colocar(ubicaciones, actividad, itemId, destino);
      if (r.siguiente === null) {
        if (r.motivoRechazo === 'llena') setAviso(`${nombreZona(destino)} está llena: no caben más elementos.`);
        return;
      }
      setAviso('');
      setUbicaciones(r.siguiente);
      // Informa el estado intermedio para que el modo autónomo lo capture al avanzar.
      onBorrador(r.siguiente);
    },
    [bloqueado, ubicaciones, actividad, nombreZona, setUbicaciones, onBorrador],
  );

  const ubicar = useUbicarElementos({
    bloqueado,
    items: actividad.items,
    nombreContenedor: nombreZona,
    ubicados: colocados,
    aplicar,
    setProgreso,
  });
  const { activo, entrada, tocar, tocarColocar, textoDe } = ubicar;

  const ficha = (item: DragDropItem) => (
    <Ficha
      key={item.id}
      item={item}
      bloqueado={bloqueado}
      arrastrando={activo === item.id}
      elegida={tocarColocar.seleccionado === item.id}
      isDark={isDark}
      propsTocar={ubicar.propsPieza(item.id)}
    />
  );
  const fantasma = activo ? textoDe(activo) : undefined;

  return (
    <div className={cn(styles.tarjeta, isDark ? styles.oscuro : styles.claro)}>
      <p className={styles.instruccion}>{actividad.instruccion}</p>
      <div className={styles.herramientas}>
        <ModoEntradaToggle modo={entrada.modo} onAlternar={entrada.alternar} />
      </div>

      <ActivityDndRoot
        arrastreActivo={!tocar}
        colisiones={COLISIONES}
        onDragStart={ubicar.alEmpezar}
        onDragEnd={ubicar.alSoltar}
        overlay={fantasma ? <div className={styles.fantasma}>{fantasma}</div> : null}
      >
        {/* Elementos sin ubicar */}
        <Zona
          id={ID_DISPONIBLES}
          etiqueta="Elementos disponibles"
          resaltar={!!activo && !enviada}
          isDark={isDark}
          propsTocar={ubicar.propsContenedor(ID_DISPONIBLES)}
          className={styles.disponibles}
        >
          <p className={styles.rotulo}>Elementos disponibles</p>
          <div className={styles.fichas}>
            {sueltos.map(ficha)}
            {sueltos.length === 0 && <p className={styles.vacio}>Todos los elementos están ubicados</p>}
          </div>
        </Zona>

        {/* Zonas destino */}
        <div className={styles.zonas}>
          {actividad.zonas.map((zona) => {
            const dentro = actividad.items.filter((i) => ubicaciones[i.id] === zona.id);
            return (
              <Zona
                key={zona.id}
                id={zona.id}
                etiqueta={zona.etiqueta || 'Zona'}
                resaltar={!!activo && !enviada}
                isDark={isDark}
                propsTocar={ubicar.propsContenedor(zona.id)}
                className={styles.zona}
              >
                <p className={styles.etiquetaZona}>{zona.etiqueta}</p>
                <div className={styles.fichasZona}>
                  {dentro.map(ficha)}
                  {dentro.length === 0 && <span className={styles.vacio}>Suelta aquí</span>}
                </div>
              </Zona>
            );
          })}
        </div>
      </ActivityDndRoot>
      <AnuncioTocarColocar anuncio={aviso || tocarColocar.anuncio} />
      {/* El lector de pantalla ya lo oye por la región `aria-live` de arriba. */}
      {aviso && (
        <p aria-hidden className={styles.aviso}>
          {aviso}
        </p>
      )}

      {!enviada ? (
        <button type="button" className={styles.enviar} onClick={onEnviar} disabled={bloqueado || sueltos.length > 0}>
          Enviar
        </button>
      ) : (
        <div role="status" className={styles.enviada}>
          <span aria-hidden>✓</span> ¡Respuesta enviada!
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

function ViewerView({
  actividad,
  editorSyncKey,
  onResponse,
  variant = 'light',
}: {
  actividad: DragDrop;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
}) {
  // ubicaciones: itemId → zoneId | null (null = sin ubicar)
  const [ubicaciones, setUbicaciones] = useState<Ubicaciones>(() => sinUbicar(actividad.items));
  const [enviada, setEnviada] = useState(false);
  // Cada cambio de slide o de elementos (p. ej. al editar) es una corrida nueva, también para el shell.
  const [version, setVersion] = useState(0);
  const ajustes = useMemo(() => normalizarAjustes(actividad), [actividad]);
  const feedback = useActivityFeedback({ sonido: ajustes.sonido });

  useEffect(() => {
    setUbicaciones(sinUbicar(actividad.items));
    setEnviada(false);
    setVersion((v) => v + 1);
  }, [editorSyncKey, actividad.items]);

  const resultado = useCallback(
    (u: Ubicaciones) => actividad.items.map((i) => ({ itemId: i.id, zoneId: u[i.id] ?? null })),
    [actividad.items],
  );
  const emitirBorrador = useCallback(
    (u: Ubicaciones) => onResponse?.(wrapActivityDraftResponse(resultado(u))),
    [onResponse, resultado],
  );

  const enviar = (ctx: ActivityShellContext) => {
    if (enviada || ctx.sesion.fase !== 'jugando') return;
    setEnviada(true);
    // Nota: la da `@lumina/scoring`; acá solo el sonido de envío (como siempre).
    feedback.emitir('acierto', { sonido: 'submit', movimiento: false });
    onResponse?.(resultado(ubicaciones));
    ctx.completar();
  };

  return (
    <ActivityShell key={version} ajustes={ajustes} total={actividad.items.length} resultado="ninguno">
      {(ctx) => (
        <Cuerpo
          actividad={actividad}
          isDark={variant === 'dark'}
          ctx={ctx}
          ubicaciones={ubicaciones}
          setUbicaciones={setUbicaciones}
          enviada={enviada}
          onBorrador={emitirBorrador}
          onEnviar={() => enviar(ctx)}
        />
      )}
    </ActivityShell>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DragDropActivity({ actividad, modo, editorSyncKey, onResponse, variant }: Props) {
  return modo === 'editor'
    ? <EditorView actividad={actividad} />
    : <ViewerView actividad={actividad} editorSyncKey={editorSyncKey} onResponse={onResponse} variant={variant} />;
}

// ─── Activity Editor ──────────────────────────────────────────────────────────

const DEFAULTS: DragDrop = {
  tipo: 'arrastrar_soltar',
  instruccion: '',
  items: [],
  zonas: [],
};

function normalize(a: DragDrop | null | undefined): DragDrop {
  if (!a) return { ...DEFAULTS };
  return { ...DEFAULTS, ...a, tipo: 'arrastrar_soltar' };
}

interface EditorProps {
  editorSyncKey: string;
  activity: DragDrop | null;
  onChange: (a: DragDrop) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

export function DragDropActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: EditorProps) {
  const { local, setLocal, flush, commitImmediate, schedulePersist } = useActivityEditor<DragDrop>({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });

  function updateImmediate(partial: Partial<DragDrop>) {
    commitImmediate({ ...local, ...partial, tipo: 'arrastrar_soltar' });
  }

  function updateText(partial: Partial<DragDrop>) {
    const next = { ...local, ...partial, tipo: 'arrastrar_soltar' as const };
    setLocal(next);
    schedulePersist(next);
  }

  // --- Elementos ---
  function addItem() {
    const nextItem: DragDropItem = { id: crypto.randomUUID(), texto: '' };
    updateImmediate({ items: [...local.items, nextItem] });
  }

  function updateItemText(id: string, texto: string) {
    const nextItems = local.items.map((i) => (i.id === id ? { ...i, texto } : i));
    setLocal({ ...local, items: nextItems, tipo: 'arrastrar_soltar' });
    schedulePersist({ ...local, items: nextItems, tipo: 'arrastrar_soltar' });
  }

  function removeItem(id: string) {
    const nextItems = local.items.filter((i) => i.id !== id);
    // Removerlo también de las zonas
    const nextZonas = local.zonas.map((z) => ({
      ...z,
      itemsCorrectos: z.itemsCorrectos.filter((iId) => iId !== id),
    }));
    updateImmediate({ items: nextItems, zonas: nextZonas });
  }

  function changeItemZone(itemId: string, zoneId: string | 'none') {
    const nextZonas = local.zonas.map((z) => {
      // sacarlo de todas partes primero
      const itemsCorrectos = z.itemsCorrectos.filter((id) => id !== itemId);
      // agregarlo si es la zona seleccionada
      if (z.id === zoneId) {
        itemsCorrectos.push(itemId);
      }
      return { ...z, itemsCorrectos };
    });
    updateImmediate({ zonas: nextZonas });
  }

  function getItemZoneId(itemId: string) {
    const zone = local.zonas.find((z) => z.itemsCorrectos.includes(itemId));
    return zone ? zone.id : 'none';
  }

  // --- Zonas ---
  function addZone() {
    const nextZone: DragDropZone = { id: crypto.randomUUID(), etiqueta: '', itemsCorrectos: [] };
    updateImmediate({ zonas: [...local.zonas, nextZone] });
  }

  function updateZoneLabel(id: string, etiqueta: string) {
    const nextZonas = local.zonas.map((z) => (z.id === id ? { ...z, etiqueta } : z));
    setLocal({ ...local, zonas: nextZonas, tipo: 'arrastrar_soltar' });
    schedulePersist({ ...local, zonas: nextZonas, tipo: 'arrastrar_soltar' });
  }

  function removeZone(id: string) {
    const nextZonas = local.zonas.filter((z) => z.id !== id);
    updateImmediate({ zonas: nextZonas });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(60vh,400px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Arrastrar y soltar
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios de texto se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="@container/dd min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">Instrucción</Label>
          <Input
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            className="h-8 text-xs"
            placeholder="Ej: Arrastra cada animal a su hábitat..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 @lg/dd:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Elementos</Label>
            <div className="space-y-1.5">
              {local.items.map((item, idx) => (
                <div key={item.id} className="flex gap-1.5">
                  <Input
                    value={item.texto}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    onBlur={flush}
                    className="h-8 min-w-0 flex-1 text-xs"
                    placeholder={`Elemento ${idx + 1}`}
                  />
                  <Select
                    value={getItemZoneId(item.id)}
                    onValueChange={(zoneId) => changeItemZone(item.id, zoneId)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-[7.5rem] shrink-0 text-xs"
                      title="Zona destino"
                    >
                      <SelectValue placeholder="Zona…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {local.zonas.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.etiqueta || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-1 h-8 text-xs w-full"
            >
              <Plus className="mr-1.5 size-3" /> Agregar elemento
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium">Zonas destino</Label>
            <div className="space-y-1.5">
              {local.zonas.map((zone, idx) => (
                <div key={zone.id} className="flex gap-1.5">
                  <Input
                    value={zone.etiqueta}
                    onChange={(e) => updateZoneLabel(zone.id, e.target.value)}
                    onBlur={flush}
                    className="h-8 text-xs flex-1 min-w-0"
                    placeholder={`Zona ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeZone(zone.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addZone}
              className="mt-1 h-8 text-xs w-full"
            >
              <Plus className="mr-1.5 size-3" /> Agregar zona
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
