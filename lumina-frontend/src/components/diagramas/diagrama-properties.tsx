'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Eye,
  Network,
  Share2,
  GitMerge,
  Milestone,
  Workflow,
  Sparkles,
} from 'lucide-react';
import type {
  Block,
  DiagramaArista,
  DiagramaBlock,
  DiagramaGrafoBlock,
  DiagramaNodo,
  DiagramaSubtipo,
} from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeDiagramaBlock } from './diagrama-defaults';

interface DiagramaPropertiesProps {
  block: DiagramaBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
}

const COLOR_OPTIONS = [
  '#2563EB', // Azul
  '#059669', // Verde
  '#D97706', // Ámbar
  '#7C3AED', // Violeta
  '#DC2626', // Rojo
  '#0891B2', // Cian
  '#DB2777', // Rosa
];

const SUBTIPOS_CONFIG: Array<{
  subtipo: Exclude<DiagramaSubtipo, 'venn'>;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  nodeLabel: string;
}> = [
  { subtipo: 'mapa_mental', label: 'Mapa Mental', Icon: Brain, nodeLabel: 'Rama' },
  { subtipo: 'organigrama', label: 'Organigrama', Icon: Network, nodeLabel: 'Área / Cargo' },
  { subtipo: 'mapa_conceptual', label: 'Mapa Conceptual', Icon: Workflow, nodeLabel: 'Concepto' },
  { subtipo: 'flujo', label: 'Flujo', Icon: GitMerge, nodeLabel: 'Paso' },
  { subtipo: 'cronologia', label: 'Cronología', Icon: Milestone, nodeLabel: 'Evento' },
];

/** Cronología: normaliza para reimponer el eje lineal y la cadena de conectores. */
function finalizeGrafo(block: DiagramaGrafoBlock): DiagramaGrafoBlock {
  return block.subtipo === 'cronologia'
    ? (normalizeDiagramaBlock(block) as DiagramaGrafoBlock)
    : block;
}

export function DiagramaProperties({
  block,
  applyNow,
}: DiagramaPropertiesProps) {
  const [localBlock, setLocalBlock] = useState<DiagramaBlock>(block);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalBlock(block);
  }, [block.id]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const commitChange = (updated: DiagramaBlock, immediate = false) => {
    setLocalBlock(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (immediate) {
      void applyNow((b) =>
        b.tipo === 'diagrama' && (b as DiagramaBlock).id === updated.id ? updated : b,
      );
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      void applyNow((b) =>
        b.tipo === 'diagrama' && (b as DiagramaBlock).id === updated.id ? updated : b,
      );
    }, 300);
  };

  const isGrafo = localBlock.subtipo !== 'venn';
  const grafoBlock = isGrafo ? (localBlock as DiagramaGrafoBlock) : null;
  const currentSubtipo = grafoBlock?.subtipo ?? 'mapa_mental';
  const subtipoMeta = SUBTIPOS_CONFIG.find((s) => s.subtipo === currentSubtipo) ?? SUBTIPOS_CONFIG[0];

  // ─── Cambio de Subtipo ───
  const handleSubtipoChange = (newSubtipo: Exclude<DiagramaSubtipo, 'venn'>) => {
    if (!grafoBlock) return;
    const isDirected = newSubtipo === 'flujo' || newSubtipo === 'organigrama';
    const nextAristas = grafoBlock.aristas.map((a) => ({
      ...a,
      dirigida: isDirected,
    }));

    commitChange(
      finalizeGrafo({
        ...grafoBlock,
        subtipo: newSubtipo,
        aristas: nextAristas,
      }),
      true,
    );
  };

  // ─── Título y Accesibilidad ───
  const handleTitleChange = (titulo: string) => {
    commitChange({ ...localBlock, titulo });
  };

  const handleA11yChange = (descripcionAccesible: string) => {
    commitChange({ ...localBlock, descripcionAccesible });
  };

  // ─── Gestión de Nodos ───
  const handleNodeLabelChange = (nodeId: string, etiqueta: string) => {
    if (!grafoBlock) return;
    const nextNodos = grafoBlock.nodos.map((n) =>
      n.id === nodeId ? { ...n, etiqueta } : n,
    );
    commitChange({ ...grafoBlock, nodos: nextNodos });
  };

  const handleNodeBodyChange = (nodeId: string, cuerpo: string) => {
    if (!grafoBlock) return;
    const nextNodos = grafoBlock.nodos.map((n) =>
      n.id === nodeId ? { ...n, cuerpo } : n,
    );
    commitChange({ ...grafoBlock, nodos: nextNodos });
  };

  const handleNodeColorChange = (nodeId: string, color: string) => {
    if (!grafoBlock) return;
    const nextNodos = grafoBlock.nodos.map((n) =>
      n.id === nodeId ? { ...n, estilo: { ...(n.estilo ?? {}), color } } : n,
    );
    commitChange({ ...grafoBlock, nodos: nextNodos }, true);
  };

  const handleAddNode = () => {
    if (!grafoBlock) return;

    const count = grafoBlock.nodos.length + 1;
    const newNodeId = `nodo-${currentSubtipo}-${Date.now()}`;
    const rootNode = grafoBlock.nodos[0] || { x: 200, y: 150 };

    let newX = 200;
    let newY = 150;

    if (currentSubtipo === 'organigrama') {
      newX = 100 + ((count - 1) % 3) * 160;
      newY = 130 + Math.floor((count - 1) / 3) * 110;
    } else if (currentSubtipo === 'flujo') {
      newX = rootNode.x;
      newY = 20 + count * 80;
    } else if (currentSubtipo === 'cronologia') {
      // Se coloca al final del eje; `finalizeGrafo` reparte y reconecta.
      const lastNode = grafoBlock.nodos[grafoBlock.nodos.length - 1] ?? { x: 0 };
      newX = lastNode.x + 150;
      newY = 150;
    } else {
      const angle = (count * 60 * Math.PI) / 180;
      const distance = 160;
      newX = Math.round(rootNode.x + distance * Math.cos(angle));
      newY = Math.round(rootNode.y + distance * Math.sin(angle));
    }

    const color = COLOR_OPTIONS[(count - 1) % COLOR_OPTIONS.length];

    const newNode: DiagramaNodo = {
      id: newNodeId,
      etiqueta: `${subtipoMeta.nodeLabel} ${count}`,
      cuerpo: currentSubtipo === 'flujo' ? 'Acción a realizar' : 'Descripción',
      x: newX,
      y: newY,
      estilo: { color },
    };

    const newAristas: DiagramaArista[] = [...grafoBlock.aristas];
    if (grafoBlock.nodos.length > 0) {
      const lastNode = grafoBlock.nodos[grafoBlock.nodos.length - 1];
      const sourceNode = currentSubtipo === 'flujo' ? lastNode : grafoBlock.nodos[0];

      newAristas.push({
        id: `arista-${sourceNode.id}-${newNodeId}`,
        desdeId: sourceNode.id,
        haciaId: newNodeId,
        etiqueta: currentSubtipo === 'mapa_conceptual' ? 'conecta con' : undefined,
        dirigida: currentSubtipo === 'flujo' || currentSubtipo === 'organigrama',
      });
    }

    commitChange(
      finalizeGrafo({
        ...grafoBlock,
        nodos: [...grafoBlock.nodos, newNode],
        aristas: newAristas,
      }),
      true,
    );
  };

  const handleRemoveNode = (nodeId: string) => {
    if (!grafoBlock || grafoBlock.nodos.length <= 1) return;

    const nextNodos = grafoBlock.nodos.filter((n) => n.id !== nodeId);
    const nextAristas = grafoBlock.aristas.filter(
      (a) => a.desdeId !== nodeId && a.haciaId !== nodeId,
    );

    commitChange(
      finalizeGrafo({
        ...grafoBlock,
        nodos: nextNodos,
        aristas: nextAristas,
      }),
      true,
    );
  };

  // ─── Gestión de Aristas ───
  const handleEdgeLabelChange = (edgeId: string, etiqueta: string) => {
    if (!grafoBlock) return;
    const nextAristas = grafoBlock.aristas.map((a) =>
      a.id === edgeId ? { ...a, etiqueta } : a,
    );
    commitChange({ ...grafoBlock, aristas: nextAristas });
  };

  const handleRemoveEdge = (edgeId: string) => {
    if (!grafoBlock) return;
    const nextAristas = grafoBlock.aristas.filter((a) => a.id !== edgeId);
    commitChange({ ...grafoBlock, aristas: nextAristas }, true);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Selector de Subtipo */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tipo de Diagrama
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          {SUBTIPOS_CONFIG.map(({ subtipo, label, Icon }) => {
            const isSelected = currentSubtipo === subtipo;
            return (
              <button
                key={subtipo}
                type="button"
                onClick={() => handleSubtipoChange(subtipo)}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[11px] leading-tight truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Título y Accesibilidad */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Título del Diagrama</Label>
          <Input
            value={localBlock.titulo || ''}
            placeholder="Ej: Organigrama Institucional"
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <Label className="text-[11px] text-muted-foreground">Descripción Accesible (A11y)</Label>
          </div>
          <Textarea
            value={localBlock.descripcionAccesible || ''}
            placeholder="Descripción para lectores de pantalla..."
            onChange={(e) => handleA11yChange(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
        </div>
      </div>

      {/* 3. Gestión de Nodos / Elementos */}
      {grafoBlock && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nodos ({grafoBlock.nodos.length})
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNode}
              className="h-6 px-2 text-[10px]"
            >
              <Plus className="mr-1 h-3 w-3" /> {subtipoMeta.nodeLabel}
            </Button>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {grafoBlock.nodos.map((nodo, idx) => {
              const isRoot = idx === 0 || nodo.estilo?.destacado === true;
              const nodeColor =
                typeof nodo.estilo?.color === 'string'
                  ? nodo.estilo.color
                  : isRoot
                    ? '#2563EB'
                    : '#059669';

              return (
                <div
                  key={nodo.id}
                  className="rounded-md border border-border/80 bg-background/60 p-2 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: nodeColor }}
                      />
                      <input
                        type="text"
                        value={nodo.etiqueta}
                        onChange={(e) => handleNodeLabelChange(nodo.id, e.target.value)}
                        placeholder="Etiqueta del nodo"
                        className="w-full bg-transparent font-medium text-xs text-foreground focus:outline-hidden"
                      />
                    </div>
                    {isRoot ? (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                        {currentSubtipo === 'organigrama' ? 'Líder' : currentSubtipo === 'flujo' ? 'Inicio' : 'Raíz'}
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveNode(nodo.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        title="Eliminar nodo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={nodo.cuerpo || ''}
                    onChange={(e) => handleNodeBodyChange(nodo.id, e.target.value)}
                    placeholder="Detalles o descripción..."
                    className="w-full rounded border border-border/50 bg-muted/20 px-1.5 py-0.5 text-[11px] text-muted-foreground focus:outline-hidden"
                  />

                  {/* Selector de color */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleNodeColorChange(nodo.id, c)}
                        className={cn(
                          'h-3 w-3 rounded-full transition-transform',
                          nodeColor === c && 'ring-2 ring-primary ring-offset-1 scale-110',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Conexiones y Proposiciones (Aristas) */}
      {grafoBlock && grafoBlock.aristas.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Conexiones ({grafoBlock.aristas.length})
              </span>
            </div>
            {currentSubtipo === 'mapa_conceptual' && (
              <span className="text-[10px] text-muted-foreground italic">
                Palabras de enlace
              </span>
            )}
          </div>

          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {grafoBlock.aristas.map((arista) => {
              const desdeNodo = grafoBlock.nodos.find((n) => n.id === arista.desdeId);
              const haciaNodo = grafoBlock.nodos.find((n) => n.id === arista.haciaId);

              return (
                <div
                  key={arista.id}
                  className="rounded border border-border/60 bg-muted/20 p-1.5 space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-muted-foreground">
                      <strong className="text-foreground">{desdeNodo?.etiqueta || arista.desdeId}</strong>
                      {' → '}
                      <strong className="text-foreground">{haciaNodo?.etiqueta || arista.haciaId}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEdge(arista.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      title="Eliminar conexión"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Edición de texto/proposición en arista */}
                  <input
                    type="text"
                    value={arista.etiqueta || ''}
                    onChange={(e) => handleEdgeLabelChange(arista.id, e.target.value)}
                    placeholder={
                      currentSubtipo === 'mapa_conceptual'
                        ? 'Ej: está compuesto por...'
                        : currentSubtipo === 'flujo'
                          ? 'Ej: Sí / No...'
                          : 'Etiqueta opcional...'
                    }
                    className="w-full rounded border border-border/40 bg-background px-1.5 py-0.5 text-[10px] text-foreground focus:outline-hidden"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
