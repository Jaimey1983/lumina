'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
import { diagramaToGraphModel } from './diagrama-bridge.js';
import { VennSvg } from './venn-svg.js';
import { DIAGRAMA_NODE_TYPES } from './diagrama-shape-node.js';
import { formasConHijos, normalizarEscena, type Escena } from '@lumina/drawing';
import { DibujoSvg } from './libre/dibujo-render.js';
import { ListaAccesible } from './libre/accesibilidad.js';
import { elementoBajo } from './libre/eventos.js';
import { alternar, anuncioDeRama, aplicarPlegadoLocal, SIN_ALTERNADAS } from './libre/plegado-visor.js';
import type { ElementRuntimeConfig } from '@lumina/element-kit-core';
import { Skeleton } from '@lumina/ui/skeleton';
import { cn } from '@lumina/ui/lib/utils';

const GraphCanvas = dynamic(
  () => import('@lumina/editor-shared/graph-editor').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
  },
);

interface DiagramaViewerProps {
  block: DiagramaBlock;
  isThumbnail?: boolean;
  className?: string;
  /**
   * Motor de interacción (etapa K). Con él, un clic emite `clic` y, si el diagrama es un dibujo libre y el clic cae
   * sobre un elemento, `parte_clic` con `{ parte: id }`. Sin motor o en miniatura no emite nada.
   */
  emitir?: ElementRuntimeConfig['emitir'];
}

export function DiagramaViewer({
  block,
  isThumbnail = false,
  className,
  emitir,
}: DiagramaViewerProps) {
  const { titulo, descripcionAccesible } = block;

  const isVenn = block.subtipo === 'venn';
  const vennBlock = isVenn ? (block as DiagramaVennBlock) : null;
  const isGrafo = !isVenn;
  const grafoBlock = isGrafo ? (block as DiagramaGrafoBlock) : null;

  const model = useMemo(() => {
    if (!grafoBlock) return { nodes: [], edges: [] };
    return diagramaToGraphModel(grafoBlock);
  }, [grafoBlock]);

  // Un diagrama editado como dibujo libre se ve con su escena; los nodos y aristas quedan guardados como el original.
  const escena = useMemo(() => (block.escena ? normalizarEscena(block.escena) : null), [block.escena]);

  // Plegar y desplegar ramas (Y38c): el estudiante abre y cierra lo que quiera, solo en memoria. Parte de lo que dejó el docente y se
  // descarta si cambia la escena del bloque (otro diagrama o uno guardado de nuevo); al volver a abrir el visor, vuelve a lo del docente.
  const [local, setLocal] = useState<{ origen: Escena | null; alternadas: ReadonlySet<string> }>({ origen: escena, alternadas: SIN_ALTERNADAS });
  const alternadas = local.origen === escena ? local.alternadas : SIN_ALTERNADAS;
  const escenaVista = useMemo(() => (escena ? aplicarPlegadoLocal(escena, alternadas) : null), [escena, alternadas]);
  const conRamas = useMemo(() => (escena ? formasConHijos(escena).size > 0 : false), [escena]);
  const [anuncioRama, setAnuncioRama] = useState('');
  const puedePlegar = escena !== null && !isThumbnail && conRamas;
  const alternarRama = (id: string): void => {
    if (!escena || !puedePlegar) return;
    const nuevas = alternar(alternadas, id);
    setLocal({ origen: escena, alternadas: nuevas });
    setAnuncioRama(anuncioDeRama(aplicarPlegadoLocal(escena, nuevas), id));
  };

  const motor = isThumbnail ? undefined : emitir;
  const alClic =
    motor || puedePlegar
      ? (e: React.MouseEvent<HTMLElement>): void => {
          // El marcador de una rama es un control del visor, no una parte del diagrama: no emite nada (DY83).
          const marcador = puedePlegar ? (e.target as Element | null)?.closest?.('[data-colapsar-id]') : null;
          if (marcador) {
            alternarRama(marcador.getAttribute('data-colapsar-id') ?? '');
            return;
          }
          if (!motor) return;
          motor('clic');
          const id = escena ? elementoBajo(e.target) : null;
          if (id) motor('parte_clic', { parte: id });
        }
      : undefined;
  const alElegir = motor
    ? (id: string): void => {
        motor('clic');
        motor('parte_clic', { parte: id });
      }
    : undefined;

  return (
    <figure
      role="region"
      aria-label={titulo || 'Diagrama'}
      data-diagrama-interactivo={motor ? '' : undefined}
      onClick={alClic}
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-background/50 p-2 shadow-xs border border-border/40',
        motor && escena && '[&_[data-elemento-id]]:cursor-pointer',
        puedePlegar && '[&_[data-colapsar-id]]:cursor-pointer',
        className,
      )}
    >
      {titulo && !isThumbnail && (
        <figcaption className="px-2 pt-1 pb-1.5 text-center text-sm font-semibold tracking-tight text-foreground">
          {titulo}
        </figcaption>
      )}

      {descripcionAccesible && (
        <div className="sr-only" aria-live="polite">
          {descripcionAccesible}
        </div>
      )}

      {puedePlegar && (
        <div className="sr-only" aria-live="polite" data-rama-anuncio="">
          {anuncioRama}
        </div>
      )}

      <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-md">
        {escenaVista ? (
          <>
            <DibujoSvg escena={escenaVista} titulo={titulo || 'Diagrama'} {...(isThumbnail ? {} : { indicadoresRama: 'todos' as const })} />
            {!isThumbnail && (
              <ListaAccesible
                escena={escenaVista}
                {...(alElegir ? { onElegir: alElegir } : {})}
                {...(puedePlegar ? { onAlternarRama: alternarRama } : {})}
              />
            )}
          </>
        ) : isVenn && vennBlock ? (
          <VennSvg block={vennBlock} />
        ) : isGrafo && grafoBlock && grafoBlock.nodos.length > 0 ? (
          <GraphCanvas
            model={model}
            interactive={false}
            positionAuthority="model"
            nodeTypes={DIAGRAMA_NODE_TYPES}
            fitView={true}
            showControls={false}
            showMiniMap={false}
            showBackground={!isThumbnail && grafoBlock.opciones?.fondo !== 'vacio'}
            backgroundVariant={
              grafoBlock.opciones?.fondo === 'cuadricula'
                ? ('lines' as const)
                : ('dots' as const)
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Diagrama sin datos
          </div>
        )}
      </div>
    </figure>
  );
}
