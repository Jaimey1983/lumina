'use client';

import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeToolbar, type NodeProps } from '@lumina/editor-shared/graph-editor';
import type { DiagramaNodoForma } from '@lumina/types/slide';
import { cn } from '@lumina/ui/lib/utils';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface DiagramaShapeNodeData {
  label?: string;
  sublabel?: string;
  body?: string;
  accent?: string;
  highlighted?: boolean;
  forma?: DiagramaNodoForma;
  icono?: string;
  imagen?: string;
  isRoot?: boolean;
  subtipo?: string;
  blockId?: string;
  [key: string]: unknown;
}

const iconCache = new Map<string, React.ComponentType<{ className?: string }> | null>();

function getIconComponent(name: string): React.ComponentType<{ className?: string }> | null {
  if (iconCache.has(name)) {
    return iconCache.get(name) ?? null;
  }
  const pascalName = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const rawIcons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = rawIcons[pascalName] ?? null;
  iconCache.set(name, IconComponent);
  return IconComponent;
}

/** Renderiza un icono dinámico de lucide-react si existe */
function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const IconComponent = getIconComponent(name);
  if (!IconComponent) return null;
  return React.createElement(IconComponent, { className });
}

export function DiagramaShapeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as DiagramaShapeNodeData;
  const accent = nodeData.accent ?? 'var(--primary, #2563EB)';
  const forma = nodeData.forma ?? (nodeData.isRoot ? 'root' : nodeData.subtipo === 'mapa_mental' ? 'chip' : 'rounded');

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || '');

  useEffect(() => {
    setLabelValue(nodeData.label || '');
  }, [nodeData.label]);

  const commitInlineEdit = () => {
    setIsEditing(false);
    const trimmed = labelValue.trim();
    if (trimmed && trimmed !== nodeData.label && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lumina-diagrama-node-update', {
          detail: { id, etiqueta: trimmed, blockId: nodeData.blockId },
        }),
      );
    }
  };

  // Handles estándar en las 4 direcciones
  const handles = (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/70 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-muted-foreground/70 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-muted-foreground/70 !border-background hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/70 !border-background hover:!scale-125 transition-transform"
      />
    </>
  );

  // Toolbar contextual flotante al seleccionar el nodo
  const toolbar = (
    <NodeToolbar
      isVisible={selected && !isEditing}
      position={Position.Top}
      className="flex items-center gap-1 rounded-lg border border-border/80 bg-card/95 px-1.5 py-1 shadow-md backdrop-blur-xs text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        type="button"
        title="Editar texto (o doble clic)"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted text-foreground text-[11px] font-medium"
      >
        <Edit2 className="h-3 w-3 text-muted-foreground" />
        <span>Editar</span>
      </button>

      <button
        type="button"
        title="Añadir nodo hijo conectado"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lumina-diagrama-add-child', {
                detail: { parentId: id, blockId: nodeData.blockId },
              }),
            );
          }
        }}
        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <Plus className="h-3 w-3" />
        <span>Hijo</span>
      </button>

      {!nodeData.isRoot && (
        <button
          type="button"
          title="Eliminar nodo"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('lumina-diagrama-delete-node', {
                  detail: { id, blockId: nodeData.blockId },
                }),
              );
            }
          }}
          className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </NodeToolbar>
  );

  // Input de edición inline compartido
  const inlineInput = (
    <input
      autoFocus
      type="text"
      value={labelValue}
      onChange={(e) => setLabelValue(e.target.value)}
      onBlur={commitInlineEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commitInlineEdit();
        if (e.key === 'Escape') {
          setLabelValue(nodeData.label || '');
          setIsEditing(false);
        }
      }}
      className="w-full bg-background border border-primary rounded px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-hidden"
    />
  );

  // 1. Forma: Raíz / Destacada
  if (forma === 'root') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative rounded-xl px-4 py-2.5 shadow-md border-2 bg-card text-card-foreground transition-all min-w-[150px] max-w-[220px]',
          (selected || nodeData.highlighted) && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg',
        )}
        style={{ borderColor: accent }}
      >
        {toolbar}
        {handles}
        <div className="flex items-center gap-2">
          {nodeData.icono && <DynamicIcon name={nodeData.icono} className="h-4 w-4 shrink-0 text-primary" />}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              inlineInput
            ) : (
              <div className="text-xs font-bold text-foreground leading-snug break-words cursor-text">
                {nodeData.label || 'Idea Principal'}
              </div>
            )}
            {nodeData.body && (
              <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                {nodeData.body}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Forma: Chip / Píldora compacta
  if (forma === 'chip') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative rounded-full px-3 py-1.5 shadow-2xs border bg-card text-card-foreground transition-all flex items-center gap-1.5 min-w-[100px] max-w-[180px]',
          selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        )}
        style={{ borderColor: accent, borderLeftWidth: 4 }}
      >
        {toolbar}
        {handles}
        {nodeData.icono && <DynamicIcon name={nodeData.icono} className="h-3.5 w-3.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            inlineInput
          ) : (
            <div className="text-[11px] font-medium text-foreground leading-tight truncate cursor-text">
              {nodeData.label}
            </div>
          )}
          {nodeData.body && (
            <div className="text-[10px] text-muted-foreground leading-none truncate mt-0.5">
              {nodeData.body}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Forma: Rombo (Decisión)
  if (forma === 'diamond') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className="relative flex items-center justify-center w-[120px] h-[90px]"
      >
        {toolbar}
        {handles}
        <svg
          viewBox="0 0 120 90"
          className={cn(
            'absolute inset-0 w-full h-full drop-shadow-2xs',
            selected && 'filter drop-shadow-[0_0_4px_var(--primary)]',
          )}
        >
          <polygon
            points="60,2 118,45 60,88 2,45"
            className="fill-card stroke-2"
            style={{ stroke: accent }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center p-2 text-center max-w-[80px]">
          {isEditing ? (
            inlineInput
          ) : (
            <span className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 cursor-text">
              {nodeData.label}
            </span>
          )}
          {nodeData.body && (
            <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
              {nodeData.body}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Forma: Píldora / Terminador
  if (forma === 'pill') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative rounded-full px-4 py-1.5 shadow-xs border-2 bg-card text-card-foreground transition-all flex items-center justify-center gap-1.5 min-w-[110px]',
          selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        )}
        style={{ borderColor: accent }}
      >
        {toolbar}
        {handles}
        {nodeData.icono && <DynamicIcon name={nodeData.icono} className="h-3.5 w-3.5 shrink-0 text-primary" />}
        {isEditing ? (
          inlineInput
        ) : (
          <span className="text-xs font-semibold text-foreground leading-tight cursor-text">
            {nodeData.label}
          </span>
        )}
      </div>
    );
  }

  // 5. Forma: Paralelogramo
  if (forma === 'parallelogram') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative rounded border-2 bg-card text-card-foreground shadow-xs transition-all min-w-[130px] p-2.5 -skew-x-12',
          selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        )}
        style={{ borderColor: accent }}
      >
        {toolbar}
        {handles}
        <div className="skew-x-12 flex flex-col items-start gap-0.5">
          {isEditing ? (
            inlineInput
          ) : (
            <span className="text-xs font-semibold text-foreground leading-tight cursor-text">
              {nodeData.label}
            </span>
          )}
          {nodeData.body && (
            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2 mt-0.5">
              {nodeData.body}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 6. Forma: Tarjeta con Icono
  if (forma === 'card-icon') {
    return (
      <div
        onDoubleClick={() => setIsEditing(true)}
        className={cn(
          'relative rounded-lg border-2 bg-card text-card-foreground shadow-xs transition-all min-w-[150px] p-2 flex items-center gap-2.5',
          selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        )}
        style={{ borderColor: accent }}
      >
        {toolbar}
        {handles}
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-2xs"
          style={{ backgroundColor: accent }}
        >
          {nodeData.icono ? (
            <DynamicIcon name={nodeData.icono} className="h-4 w-4 text-white" />
          ) : (
            nodeData.label?.charAt(0) || '•'
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            inlineInput
          ) : (
            <div className="text-xs font-semibold text-foreground truncate cursor-text">
              {nodeData.label}
            </div>
          )}
          {nodeData.sublabel && (
            <div className="text-[10px] text-primary font-medium truncate">
              {nodeData.sublabel}
            </div>
          )}
          {nodeData.body && (
            <div className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
              {nodeData.body}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7. Por defecto: Rectángulo con esquinas suaves (rounded / rect)
  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={cn(
        'relative rounded-lg border-2 bg-card text-card-foreground shadow-xs transition-shadow min-w-[130px] max-w-[200px] p-2',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      style={{ borderColor: accent }}
    >
      {toolbar}
      {handles}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        {isEditing ? (
          inlineInput
        ) : (
          <span className="text-xs font-semibold text-foreground truncate cursor-text">
            {nodeData.label}
          </span>
        )}
      </div>
      {nodeData.body && (
        <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2 block">
          {nodeData.body}
        </span>
      )}
    </div>
  );
}

export const DIAGRAMA_NODE_TYPES = {
  diagramaShapeNode: DiagramaShapeNode,
};
