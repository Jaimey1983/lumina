'use client';

// Etapa G · G2b — único motor de interacción del lienzo (react-moveable +
// @lumina/canvas-align). La ruta histórica (dnd-kit block-drag +
// <ResizeHandles> + snapLines + <SpacingIndicators>) se retiró de
// canvas-area.tsx — este componente es ahora el único camino para
// mover/redimensionar/rotar bloques en el lienzo del editor principal.
//
// Contrato del editor (`.cursorrules`): leer (getBlockPos) → transformar
// (computeSnap / computeNewCoords) → clamp (clampDragCorner, dentro de
// computeSnap) → persistir (onCommit) → historial (lo hace canvas-area).
//
// NOTA DE DX (no de producto, ver AGENTS.md ficha G2b) — bajo `next dev` (no
// `next build && next start`) el control-box de `<Moveable>` puede rendir
// desalineado del rect real del bloque (~15-20 % más grande), tanto en
// bloques con `columnas: 2` como en texto plano. Verificado exhaustivamente
// contra un build de producción (selección fresca, drag en vivo, zoom
// 50–200 %, grupo, actividades con `marco`): el ratio da 1.0000 exacto en
// TODOS los casos — es un artefacto exclusivo de Turbopack/Fast Refresh en
// modo dev, no un bug del motor de interacción ni de producción. Si ves esto
// mientras trabajás con `next dev`, no es un bug nuevo — no reabrir la
// investigación; probar en `next build && next start` para confirmar.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Moveable, {
  type OnDrag,
  type OnDragEnd,
  type OnDragGroupStart,
  type OnDragStart,
  type OnResize,
  type OnResizeEnd,
  type OnResizeStart,
  type OnRotate,
  type OnRotateEnd,
  type OnRotateStart,
} from 'react-moveable';

import type { Block, SlideGuias } from '@lumina/types/slide';
import {
  computeSnap,
  blockRotation,
  snapResizeSize,
  AlignmentOverlay,
  describeAlignmentAnnouncement,
  type SnapLine,
  type Measurement,
  type AlignRect,
} from '@lumina/canvas-align';

import {
  getBlockPos,
  isBlockCanvasLocked,
  withPosition,
  withRect,
  withRotation,
  clampDragCorner,
} from '@/hooks/use-block-drag';
import { computeNewCoords, type ResizeHandleDir } from '../lib/resize-coords';
import { getBlockResizeMinDim } from '../lib/block-resize-min-dim';
import { snapAngle } from '../lib/rotate-coords';

export interface CanvasMoveableProps {
  /** Elemento del lienzo en coordenadas % (SLIDE_SURFACE). Los bloques tienen `data-block-id`. */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Bloques efectivos (liveBloques → committed → servidor). */
  blocks: Block[];
  /** Índices (top-level) seleccionados. */
  selectedIndices: number[];
  /** Zoom del lienzo (1 = 100 %). */
  zoom: number;
  guias?: SlideGuias | null;
  /** true mientras Alt está pulsado — desactiva el imán. */
  snapSuppressedRef?: RefObject<boolean>;
  /** Preview por frame (sin persistir ni historial). */
  onLiveChange?: (next: Block[]) => void;
  /** Commit al soltar — canvas-area persiste + registra historial. */
  onCommit: (next: Block[]) => void;
}

const MOVEABLE_DIRECTIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/**
 * Selector del bloque de primer nivel en el lienzo.
 *
 * `data-block-id` se reutiliza dentro de `clip-group` (SlideRenderer anidado
 * en modo viewer) y en columnas: `querySelector('[data-block-id="1"]')`
 * puede devolver un hijo interno de una máscara en vez del bloque
 * seleccionado. El control-box de Moveable queda entonces en otro rectángulo
 * — síntoma: "el cuadro de selección aparece apartado, como si hubiera 2
 * bloques" (el `ring` de CSS sigue en el bloque real; Moveable apunta al
 * nodo equivocado).
 *
 * Contrato: solo los BlockNode posicionados del editor (no miniatura, no
 * viewer anidado) marcan `data-canvas-target`.
 */
export function canvasTopLevelSelector(index: number | string): string {
  return `[data-canvas-target="${index}"]`;
}

function dirFromMoveable(direction: number[]): ResizeHandleDir {
  const [x, y] = direction;
  if (y < 0 && x < 0) return 'NW';
  if (y < 0 && x > 0) return 'NE';
  if (y > 0 && x < 0) return 'SW';
  if (y > 0 && x > 0) return 'SE';
  if (y < 0) return 'N';
  if (y > 0) return 'S';
  if (x < 0) return 'W';
  return 'E';
}

/**
 * Contrato: un control interno que gestiona su propio puntero (p. ej. los
 * nodos del editor de contorno Paper.js de una máscara de recorte, o el
 * marcador de un hotspot) se marca con `data-moveable-ignore` en el DOM.
 *
 * `<Moveable target={…}>` (react-moveable) cubre TODO el bloque — sin este
 * guard, cualquier pointerdown dentro de él, incluido el de un manejador
 * interno, arranca un drag/resize/rotate del bloque completo en vez de
 * llegar al control interno (síntoma: "al mover desde el manejador de la
 * máscara se mueve toda la imagen"). Este helper deja que el control interno
 * gane siempre frente al gesto del lienzo — no es un caso especial de
 * clip-group: cualquier widget con controles internos puede optar por el
 * mismo atributo.
 */
function isMoveableIgnored(e: { inputEvent?: unknown }): boolean {
  const target = (e.inputEvent as { target?: unknown } | null | undefined)?.target;
  return target instanceof Element && target.closest('[data-moveable-ignore]') != null;
}

interface DragOrigin {
  index: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  rot: number;
}

export function CanvasMoveable({
  canvasRef,
  blocks,
  selectedIndices,
  zoom,
  guias,
  snapSuppressedRef,
  onLiveChange,
  onCommit,
}: CanvasMoveableProps) {
  const [targets, setTargets] = useState<HTMLElement[]>([]);
  const moveableRef = useRef<Moveable | null>(null);
  const [guides, setGuides] = useState<SnapLine[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [activeRect, setActiveRect] = useState<AlignRect | null>(null);
  const [activeRotation, setActiveRotation] = useState<number | undefined>(undefined);

  // G5 — accesibilidad: `aria-live` que anuncia el resultado del snap al
  // soltar (drag/resize/rotate end). El overlay visual es `aria-hidden`
  // (decorativo); esto es lo que un lector de pantalla recibe en su lugar.
  // Espejos en ref de `guides`/`measurements`/`activeRotation`: `commit()` los
  // lee al soltar, y como es un `useCallback` con pocas deps (no reincluye
  // esos 3 estados para no recrearse en cada frame de drag), leerlos del
  // estado directo sería una clausura vieja.
  const [announcement, setAnnouncement] = useState('');
  const guidesRef = useRef<SnapLine[]>([]);
  const measurementsRef = useRef<Measurement[]>([]);
  const activeRotationRef = useRef<number | undefined>(undefined);

  const originsRef = useRef<DragOrigin[]>([]);
  const liveBlocksRef = useRef<Block[]>(blocks);
  liveBlocksRef.current = blocks;

  // Índices arrastrables (no bloqueados) — canvasLocked queda fuera.
  const activeIndices = useMemo(
    () =>
      selectedIndices.filter(
        (i) => blocks[i] && !isBlockCanvasLocked(blocks[i]),
      ),
    [selectedIndices, blocks],
  );

  // Resolver los nodos DOM de la selección dentro del lienzo.
  //
  // Contrato: esta es una proyección (índices seleccionados → nodos DOM), no
  // debe producir una actualización de estado cuando el resultado lógico es
  // el mismo. `blocks`/`activeIndices` cambian de referencia en cada frame de
  // drag (nueva posición ⇒ nuevo array) sin que los nodos DOM afectados
  // (mismo `data-block-id`, mismo orden) cambien realmente — si `setTargets`
  // emitiera un array nuevo en cada corrida, cada frame de drag dispararía un
  // re-render adicional de este componente cuyo único efecto sería volver a
  // disparar este mismo efecto, en cascada, durante el propio drag
  // (exactamente el patrón que dispara "Maximum update depth exceeded").
  // La guarda de igualdad hace que el efecto sea un no-op cuando nada
  // relevante cambió, sin depender de que el emisor (`canvas-area.tsx`) sea
  // perfectamente estable.
  const targetsRef = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const surface = canvasRef.current;
    const next = !surface || activeIndices.length === 0
      ? []
      : activeIndices
          .map((i) => surface.querySelector<HTMLElement>(canvasTopLevelSelector(i)))
          .filter((el): el is HTMLElement => el != null);

    const prev = targetsRef.current;
    const sameLength = prev.length === next.length;
    const sameElements = sameLength && prev.every((el, i) => el === next[i]);
    if (sameElements) return;

    targetsRef.current = next;
    setTargets(next);
  }, [canvasRef, activeIndices, blocks]);

  // El control-box de react-moveable se congela con el rect que midió al
  // montar/al cambiar `target`; si en ese instante el layout todavía no
  // asentó (p. ej. `aspect-video` recién calculado, fuentes cargando), el
  // control-box queda desalineado del bloque real. `useResizeObserver` (en
  // el <Moveable> de abajo) lo mantiene watcheando cambios de tamaño reales
  // del target (p. ej. contenido que crece/encoge tras cargar); esto más
  // `updateRect()` un frame después de que cambie `target` cubre el caso de
  // montaje/selección nueva. Ninguno de los dos resuelve el caso de
  // `columnas` documentado como RIESGO ACEPTADO arriba.
  useEffect(() => {
    if (targets.length === 0) return;
    const id = requestAnimationFrame(() => moveableRef.current?.updateRect());
    return () => cancelAnimationFrame(id);
  }, [targets]);

  const rectPx = useCallback(() => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r && r.width > 0 ? r : null;
  }, [canvasRef]);

  const captureOrigins = useCallback(
    (e?: OnDragStart | OnDragGroupStart | OnResizeStart | OnRotateStart) => {
      if (e && isMoveableIgnored(e)) {
        // El pointerdown originó dentro de un control interno (p. ej. un nodo
        // del editor de máscara) — cede el gesto y no arranca el drag/resize/
        // rotate del bloque completo.
        e.stopAble();
        return;
      }
      originsRef.current = activeIndices.map((index) => {
        const p = getBlockPos(blocks[index]);
        return {
          index,
          x: p.x,
          y: p.y,
          ancho: p.ancho,
          alto: p.alto,
          rot: blockRotation(blocks[index]),
        };
      });
    },
    [activeIndices, blocks],
  );

  const applyGuides = useCallback((g: SnapLine[]) => {
    guidesRef.current = g;
    setGuides(g);
  }, []);
  const applyMeasurements = useCallback((m: Measurement[]) => {
    measurementsRef.current = m;
    setMeasurements(m);
  }, []);
  const applyActiveRotation = useCallback((r: number | undefined) => {
    activeRotationRef.current = r;
    setActiveRotation(r);
  }, []);

  const clearOverlay = useCallback(() => {
    applyGuides([]);
    applyMeasurements([]);
    setActiveRect(null);
    applyActiveRotation(undefined);
  }, [applyGuides, applyMeasurements, applyActiveRotation]);

  const applyToBlocks = useCallback(
    (mut: Map<number, Block>): Block[] =>
      liveBlocksRef.current.map((b, i) => mut.get(i) ?? b),
    [],
  );

  // ─── Drag ────────────────────────────────────────────────────────────────
  const handleDrag = useCallback(
    (e: OnDrag) => {
      const rect = rectPx();
      const origins = originsRef.current;
      if (!rect || origins.length === 0) return;
      const dxPct = (e.dist[0] / rect.width) * 100;
      const dyPct = (e.dist[1] / rect.height) * 100;
      const enabled = !snapSuppressedRef?.current;

      const mut = new Map<number, Block>();

      if (origins.length === 1) {
        const o = origins[0];
        const { rect: snapped, guides: g, measurements: m } = computeSnap(
          o.x + dxPct,
          o.y + dyPct,
          o.ancho,
          o.alto,
          o.index,
          liveBlocksRef.current,
          { guias, enabled, zoom, rotacionDeg: o.rot },
        );
        mut.set(o.index, withPosition(liveBlocksRef.current[o.index], snapped.x, snapped.y));
        applyGuides(g);
        applyMeasurements(m);
        setActiveRect({ x: snapped.x, y: snapped.y, ancho: o.ancho, alto: o.alto });
        applyActiveRotation(o.rot % 360 !== 0 ? o.rot : undefined);
      } else {
        // Grupo: traslación + clamp por bloque, sin overlay (G2b lo enriquece).
        for (const o of origins) {
          const { x, y } = clampDragCorner(o.x + dxPct, o.y + dyPct, o.ancho, o.alto);
          mut.set(o.index, withPosition(liveBlocksRef.current[o.index], x, y));
        }
      }

      onLiveChange?.(applyToBlocks(mut));
    },
    [rectPx, snapSuppressedRef, guias, zoom, onLiveChange, applyToBlocks, applyGuides, applyMeasurements, applyActiveRotation],
  );

  // ─── Resize ──────────────────────────────────────────────────────────────
  const handleResize = useCallback(
    (e: OnResize) => {
      const rect = rectPx();
      const origins = originsRef.current;
      if (!rect || origins.length !== 1) return;
      const o = origins[0];
      const dir = dirFromMoveable(e.direction);
      const dxPct = (e.dist[0] / rect.width) * 100;
      const dyPct = (e.dist[1] / rect.height) * 100;
      const enabled = !snapSuppressedRef?.current;
      const minDim = getBlockResizeMinDim(liveBlocksRef.current[o.index].tipo);

      let next = computeNewCoords(
        dir,
        o.x,
        o.y,
        o.ancho,
        o.alto,
        dxPct,
        dyPct,
        Boolean(e.inputEvent?.shiftKey),
        minDim,
      );

      // Snap de tamaño a vecinos / fracciones (solo si el origen no se mueve).
      if ((dir === 'E' || dir === 'S' || dir === 'SE') && enabled) {
        const peerPos = liveBlocksRef.current
          .filter((_, i) => i !== o.index)
          .map(getBlockPos);
        const sized = snapResizeSize(next.ancho, next.alto, peerPos, { zoom, enabled });
        next = { ...next, ancho: sized.ancho, alto: sized.alto };
      }

      const { rect: snapped, guides: g, measurements: m } = computeSnap(
        next.x,
        next.y,
        next.ancho,
        next.alto,
        o.index,
        liveBlocksRef.current,
        { guias, enabled, zoom, rotacionDeg: o.rot },
      );

      const mut = new Map<number, Block>();
      mut.set(
        o.index,
        withRect(liveBlocksRef.current[o.index], snapped.x, snapped.y, next.ancho, next.alto),
      );
      applyGuides(g);
      applyMeasurements(m);
      setActiveRect({ x: snapped.x, y: snapped.y, ancho: next.ancho, alto: next.alto });
      applyActiveRotation(o.rot % 360 !== 0 ? o.rot : undefined);
      onLiveChange?.(applyToBlocks(mut));
    },
    [rectPx, snapSuppressedRef, guias, zoom, onLiveChange, applyToBlocks, applyGuides, applyMeasurements, applyActiveRotation],
  );

  // ─── Rotate ──────────────────────────────────────────────────────────────
  const handleRotate = useCallback(
    (e: OnRotate) => {
      const origins = originsRef.current;
      if (origins.length !== 1) return;
      const o = origins[0];
      const snapped = snapAngle(e.rotation, { shiftKey: Boolean(e.inputEvent?.shiftKey) });
      const mut = new Map<number, Block>();
      mut.set(o.index, withRotation(liveBlocksRef.current[o.index], snapped));
      setActiveRect({ x: o.x, y: o.y, ancho: o.ancho, alto: o.alto });
      applyActiveRotation(snapped % 360 !== 0 ? snapped : undefined);
      applyGuides([]);
      applyMeasurements([]);
      onLiveChange?.(applyToBlocks(mut));
    },
    [onLiveChange, applyToBlocks, applyActiveRotation, applyGuides, applyMeasurements],
  );

  const commit = useCallback(() => {
    setAnnouncement(
      describeAlignmentAnnouncement(
        guidesRef.current,
        measurementsRef.current,
        activeRotationRef.current,
      ),
    );
    onCommit(liveBlocksRef.current);
    clearOverlay();
    originsRef.current = [];
  }, [onCommit, clearOverlay]);

  const handleDragEnd = useCallback((_e: OnDragEnd) => commit(), [commit]);
  const handleResizeEnd = useCallback((_e: OnResizeEnd) => commit(), [commit]);
  const handleRotateEnd = useCallback((_e: OnRotateEnd) => commit(), [commit]);

  // Región `aria-live` siempre montada (no depende de `targets` — un
  // commit puede ir seguido de una deselección, y la región no debe
  // desmontarse antes de que el lector de pantalla llegue a leerla).
  const liveRegion = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  if (targets.length === 0) return liveRegion;

  const single = targets.length === 1;

  return (
    <>
      {liveRegion}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <AlignmentOverlay
          guides={guides}
          measurements={measurements}
          activeRect={activeRect}
          zoom={zoom}
          rotationDeg={activeRotation}
        />
      </div>
      <Moveable
        ref={moveableRef}
        target={single ? targets[0] : targets}
        zoom={zoom}
        useResizeObserver
        origin={false}
        draggable
        resizable={single}
        rotatable={single}
        renderDirections={single ? MOVEABLE_DIRECTIONS : []}
        throttleDrag={0}
        throttleResize={0}
        throttleRotate={0}
        onDragStart={captureOrigins}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragGroupStart={captureOrigins}
        onDragGroup={({ events }) => events[0] && handleDrag(events[0])}
        onDragGroupEnd={handleDragEnd}
        onResizeStart={captureOrigins}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        onRotateStart={captureOrigins}
        onRotate={handleRotate}
        onRotateEnd={handleRotateEnd}
      />
    </>
  );
}
