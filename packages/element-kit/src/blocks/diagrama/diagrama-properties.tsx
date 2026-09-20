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
  BookOpen,
  FileText,
  Triangle,
  Palette,
  Filter,
  Disc,
  Grid,
  Sliders,
  Spline,
  ChevronDown,
} from 'lucide-react';
import type {
  Block,
  DiagramaArista,
  DiagramaBlock,
  DiagramaGrafoBlock,
  DiagramaNodo,
  DiagramaNodoForma,
  DiagramaPaletaId,
  DiagramaSubtipo,
} from '@lumina/types/slide';
import {
  computeDagreLayout,
  type GraphEdge,
  type GraphNode,
} from '@lumina/editor-shared/graph-editor';
import { layoutCebolla, layoutEmbudo, layoutPiramide, layoutRadial } from './layout-pedagogico.js';
import { outlineToDiagrama } from './diagrama-outline-parser.js';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { Badge } from '@lumina/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lumina/ui/collapsible';
import { cn } from '@lumina/ui/lib/utils';
import {
  normalizeDiagramaBlock,
  layoutCronologiaLineal,
  createDefaultFrayerBlock,
  createDefaultIshikawaBlock,
  createDefaultCicloBlock,
  createDefaultMatriz2x2Block,
  createDefaultTablaTBlock,
  createDefaultArbolProblemasBlock,
  createDefaultEisenhowerBlock,
  createDefaultEmpatiaBlock,
} from './diagrama-defaults.js';
import { PALETAS_DIAGRAMA, aplicarPaletaADiagrama } from './diagrama-temas.js';

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

const FORMAS_CONFIG: Array<{ forma: DiagramaNodoForma; label: string }> = [
  { forma: 'root', label: 'Raíz' },
  { forma: 'rounded', label: 'Tarjeta' },
  { forma: 'chip', label: 'Chip' },
  { forma: 'diamond', label: 'Rombo' },
  { forma: 'pill', label: 'Píldora' },
  { forma: 'parallelogram', label: 'Paralelogramo' },
  { forma: 'card-icon', label: 'Icono' },
  { forma: 'trapezoid', label: 'Trapecio' },
  { forma: 'inverted-trapezoid', label: 'Trapecio Invertido' },
  { forma: 'triangle', label: 'Triángulo' },
  { forma: 'circle', label: 'Círculo' },
];

// `piramide`/`embudo`/`cebolla` NO están acá — `handleLoadTemplate` los
// resuelve con exactamente los mismos `createDefault*Block` que ya
// disparan los botones base de "Tipo de Diagrama" (mismo contenido, mismo
// layout, sin ninguna diferencia): mostrarlos también acá era el mismo
// elemento duplicado dos veces en el panel ("Pirámide" y "Pirámide de
// Bloom" con idéntico resultado). Estas 8 sí son plantillas reales — un
// `subtipo` base con contenido/forma propios que el botón base no ofrece.
const TEMPLATES_CONFIG = [
  { id: 'frayer', label: 'Modelo Frayer', desc: 'Concepto + 4 cuadrantes' },
  { id: 'ishikawa', label: 'Ishikawa', desc: 'Causa y Efecto' },
  { id: 'arbol_problemas', label: 'Árbol de Problemas', desc: 'Causas, tronco y efectos' },
  { id: 'eisenhower', label: 'Matriz Eisenhower', desc: 'Urgente vs Importante' },
  { id: 'empatia', label: 'Mapa de Empatía', desc: 'Design Thinking pedagógico' },
  { id: 'ciclo', label: 'Ciclo PDCA', desc: 'Bucle continuo' },
  { id: 'matriz2x2', label: 'Matriz 2×2', desc: 'Prioridades' },
  { id: 'tabla_t', label: 'Tabla T', desc: 'Pros y Contras' },
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
  { subtipo: 'piramide', label: 'Pirámide', Icon: Triangle, nodeLabel: 'Nivel' },
  { subtipo: 'embudo', label: 'Embudo', Icon: Filter, nodeLabel: 'Etapa' },
  { subtipo: 'cebolla', label: 'Cebolla', Icon: Disc, nodeLabel: 'Capa' },
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
  const [outlineText, setOutlineText] = useState('');
  // Colapsada por defecto: es una lista larga (8 plantillas) de uso
  // ocasional — mostrarla siempre abierta era buena parte del "desorden"
  // del panel (siempre visible junto a Tipo de Diagrama, Paleta y Estilo).
  const [plantillasOpen, setPlantillasOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalBlock(block);
    }
  }, [block]);

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

  // ─── Cambio de Subtipo con Re-Layout Automático ───
  const handleSubtipoChange = (newSubtipo: Exclude<DiagramaSubtipo, 'venn'>) => {
    if (!grafoBlock) return;
    const isDirected = newSubtipo === 'flujo' || newSubtipo === 'organigrama';
    let nextNodos: DiagramaNodo[] = [...grafoBlock.nodos];
    let nextAristas: DiagramaArista[] = grafoBlock.aristas.map((a) => ({
      ...a,
      dirigida: isDirected,
    }));

    if (newSubtipo === 'mapa_mental') {
      nextNodos = layoutRadial(nextNodos, nextAristas);
    } else if (newSubtipo === 'piramide') {
      const { nodos: pNodes, aristas: pEdges } = layoutPiramide(nextNodos, nextAristas);
      nextNodos = pNodes;
      nextAristas = pEdges;
    } else if (newSubtipo === 'embudo') {
      const { nodos: eNodes, aristas: eEdges } = layoutEmbudo(nextNodos, nextAristas);
      nextNodos = eNodes;
      nextAristas = eEdges;
    } else if (newSubtipo === 'cebolla') {
      const { nodos: cNodes, aristas: cEdges } = layoutCebolla(nextNodos, nextAristas);
      nextNodos = cNodes;
      nextAristas = cEdges;
    } else if (newSubtipo === 'cronologia') {
      const { nodos: cNodes, aristas: cEdges } = layoutCronologiaLineal(nextNodos);
      nextNodos = cNodes;
      nextAristas = cEdges;
    } else {
      // flujo / organigrama / mapa_conceptual
      const graphNodes: GraphNode[] = nextNodos.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.etiqueta,
        body: n.cuerpo,
        accent: (n.estilo?.color as string) ?? '#2563EB',
      }));
      const graphEdges: GraphEdge[] = nextAristas.map((a) => ({
        id: a.id,
        source: a.desdeId,
        target: a.haciaId,
      }));
      const laidOut = computeDagreLayout(graphNodes, graphEdges, {
        direction: 'TB',
      });
      const posMap = new Map(laidOut.map((l) => [l.id, l]));
      nextNodos = nextNodos.map((n) => {
        const p = posMap.get(n.id);
        return p ? { ...n, x: p.x, y: p.y } : n;
      });
    }

    commitChange(
      finalizeGrafo({
        ...grafoBlock,
        subtipo: newSubtipo,
        nodos: nextNodos,
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
    // Sufijo determinista: mayor secuencia numérica ya usada + 1 (evita
    // colisión tras borrar un nodo). Sin `Date.now()` — impuro en render para
    // el React Compiler y colisionable en dos altas dentro del mismo ms.
    const maxSeq = grafoBlock.nodos.reduce((max, n) => {
      const seq = Number(n.id.split('-').pop());
      return Number.isFinite(seq) && seq > max ? seq : max;
    }, 0);
    const newNodeId = `nodo-${currentSubtipo}-${Math.max(count, maxSeq + 1)}`;
    const rootNode = grafoBlock.nodos[0] || { x: 200, y: 150 };

    let newX = 200;
    let newY = 150;

    if (currentSubtipo === 'piramide') {
      const newNode: DiagramaNodo = {
        id: newNodeId,
        etiqueta: `Nivel ${count}`,
        cuerpo: 'Descripción del nivel',
        x: 200,
        y: 200,
        forma: 'trapezoid',
      };
      const { nodos: pNodes, aristas: pEdges } = layoutPiramide([...grafoBlock.nodos, newNode]);
      commitChange({ ...grafoBlock, nodos: pNodes, aristas: pEdges }, true);
      return;
    } else if (currentSubtipo === 'embudo') {
      const newNode: DiagramaNodo = {
        id: newNodeId,
        etiqueta: `Etapa ${count}`,
        cuerpo: 'Descripción de la etapa',
        x: 200,
        y: 200,
        forma: 'inverted-trapezoid',
      };
      const { nodos: eNodes, aristas: eEdges } = layoutEmbudo([...grafoBlock.nodos, newNode]);
      commitChange({ ...grafoBlock, nodos: eNodes, aristas: eEdges }, true);
      return;
    } else if (currentSubtipo === 'cebolla') {
      const newNode: DiagramaNodo = {
        id: newNodeId,
        etiqueta: `Capa ${count}`,
        cuerpo: 'Influencia o alcance',
        x: 200,
        y: 200,
        forma: 'circle',
      };
      const { nodos: cNodes, aristas: cEdges } = layoutCebolla([...grafoBlock.nodos, newNode]);
      commitChange({ ...grafoBlock, nodos: cNodes, aristas: cEdges }, true);
      return;
    } else if (currentSubtipo === 'organigrama') {
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

    if (currentSubtipo === 'piramide') {
      const nextNodos = grafoBlock.nodos.filter((n) => n.id !== nodeId);
      const { nodos: pNodes, aristas: pEdges } = layoutPiramide(nextNodos);
      commitChange({ ...grafoBlock, nodos: pNodes, aristas: pEdges }, true);
      return;
    }

    if (currentSubtipo === 'embudo') {
      const nextNodos = grafoBlock.nodos.filter((n) => n.id !== nodeId);
      const { nodos: eNodes, aristas: eEdges } = layoutEmbudo(nextNodos);
      commitChange({ ...grafoBlock, nodos: eNodes, aristas: eEdges }, true);
      return;
    }

    if (currentSubtipo === 'cebolla') {
      const nextNodos = grafoBlock.nodos.filter((n) => n.id !== nodeId);
      const { nodos: cNodes, aristas: cEdges } = layoutCebolla(nextNodos);
      commitChange({ ...grafoBlock, nodos: cNodes, aristas: cEdges }, true);
      return;
    }

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

  const handleNodeFormaChange = (nodeId: string, forma: DiagramaNodoForma) => {
    if (!grafoBlock) return;
    const nextNodos = grafoBlock.nodos.map((n) =>
      n.id === nodeId ? { ...n, forma } : n,
    );
    commitChange({ ...grafoBlock, nodos: nextNodos }, true);
  };

  const handleEdgeTrazadoChange = (
    edgeId: string,
    tipoTrazado: DiagramaArista['tipoTrazado'],
  ) => {
    if (!grafoBlock) return;
    const nextAristas = grafoBlock.aristas.map((a) =>
      a.id === edgeId ? { ...a, tipoTrazado } : a,
    );
    commitChange({ ...grafoBlock, aristas: nextAristas }, true);
  };

  const handleGlobalEdgeTrazado = (tipoTrazado: DiagramaArista['tipoTrazado']) => {
    if (!grafoBlock) return;
    const nextAristas = grafoBlock.aristas.map((a) => ({ ...a, tipoTrazado }));
    commitChange({ ...grafoBlock, aristas: nextAristas }, true);
  };

  const handleGlobalEdgeEstilo = (estiloLinea: DiagramaArista['estiloLinea']) => {
    if (!grafoBlock) return;
    const nextAristas = grafoBlock.aristas.map((a) => ({ ...a, estiloLinea }));
    commitChange({ ...grafoBlock, aristas: nextAristas }, true);
  };

  const handleFondoChange = (fondo: 'puntos' | 'cuadricula' | 'vacio') => {
    if (!grafoBlock) return;
    const opciones = { ...(grafoBlock.opciones ?? {}), fondo };
    commitChange({ ...grafoBlock, opciones }, true);
  };

  const handleAutoLayout = () => {
    if (!grafoBlock) return;

    if (currentSubtipo === 'mapa_mental') {
      const reordered = layoutRadial(grafoBlock.nodos, grafoBlock.aristas);
      commitChange({ ...grafoBlock, nodos: reordered }, true);
      return;
    }

    if (currentSubtipo === 'cronologia') {
      commitChange(finalizeGrafo(grafoBlock), true);
      return;
    }

    if (currentSubtipo === 'piramide') {
      const { nodos: pNodes, aristas: pEdges } = layoutPiramide(grafoBlock.nodos, grafoBlock.aristas);
      commitChange({ ...grafoBlock, nodos: pNodes, aristas: pEdges }, true);
      return;
    }

    if (currentSubtipo === 'embudo') {
      const { nodos: eNodes, aristas: eEdges } = layoutEmbudo(grafoBlock.nodos, grafoBlock.aristas);
      commitChange({ ...grafoBlock, nodos: eNodes, aristas: eEdges }, true);
      return;
    }

    if (currentSubtipo === 'cebolla') {
      const { nodos: cNodes, aristas: cEdges } = layoutCebolla(grafoBlock.nodos, grafoBlock.aristas);
      commitChange({ ...grafoBlock, nodos: cNodes, aristas: cEdges }, true);
      return;
    }

    const graphNodes: GraphNode[] = grafoBlock.nodos.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      label: n.etiqueta,
      body: n.cuerpo,
      accent: (n.estilo?.color as string) ?? '#2563EB',
    }));
    const graphEdges: GraphEdge[] = grafoBlock.aristas.map((a) => ({
      id: a.id,
      source: a.desdeId,
      target: a.haciaId,
    }));

    const laidOut = computeDagreLayout(graphNodes, graphEdges, {
      direction: currentSubtipo === 'flujo' || currentSubtipo === 'organigrama' ? 'TB' : 'TB',
    });

    const posMap = new Map(laidOut.map((l) => [l.id, l]));
    const nextNodos = grafoBlock.nodos.map((n) => {
      const p = posMap.get(n.id);
      return p ? { ...n, x: p.x, y: p.y } : n;
    });

    commitChange({ ...grafoBlock, nodos: nextNodos }, true);
  };

  const handleLoadTemplate = (templateId: string) => {
    const coords = {
      id: localBlock.id,
      x: localBlock.x,
      y: localBlock.y,
      ancho: localBlock.ancho,
      alto: localBlock.alto,
    };
    let newBlock: DiagramaBlock;
    if (templateId === 'frayer') newBlock = createDefaultFrayerBlock(coords);
    else if (templateId === 'ishikawa') newBlock = createDefaultIshikawaBlock(coords);
    else if (templateId === 'arbol_problemas') newBlock = createDefaultArbolProblemasBlock(coords);
    else if (templateId === 'eisenhower') newBlock = createDefaultEisenhowerBlock(coords);
    else if (templateId === 'empatia') newBlock = createDefaultEmpatiaBlock(coords);
    else if (templateId === 'ciclo') newBlock = createDefaultCicloBlock(coords);
    else if (templateId === 'matriz2x2') newBlock = createDefaultMatriz2x2Block(coords);
    else if (templateId === 'tabla_t') newBlock = createDefaultTablaTBlock(coords);
    else return;

    commitChange(newBlock, true);
  };

  const handleGenerateOutline = () => {
    if (!grafoBlock || !outlineText.trim()) return;

    const { nodos, aristas } = outlineToDiagrama(outlineText, currentSubtipo);
    if (nodos.length === 0) return;

    // Si es mapa mental, aplicar distribución radial; si no, dagre jerárquico
    let positionedNodes = nodos;
    if (currentSubtipo === 'mapa_mental') {
      positionedNodes = layoutRadial(nodos, aristas);
    } else {
      const graphNodes: GraphNode[] = nodos.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.etiqueta,
        body: n.cuerpo,
        accent: (n.estilo?.color as string) ?? '#2563EB',
      }));
      const graphEdges: GraphEdge[] = aristas.map((a) => ({
        id: a.id,
        source: a.desdeId,
        target: a.haciaId,
      }));
      const laidOut = computeDagreLayout(graphNodes, graphEdges, { direction: 'TB' });
      const posMap = new Map(laidOut.map((l) => [l.id, l]));
      positionedNodes = nodos.map((n) => {
        const p = posMap.get(n.id);
        return p ? { ...n, x: p.x, y: p.y } : n;
      });
    }

    commitChange(
      {
        ...grafoBlock,
        nodos: positionedNodes,
        aristas,
      },
      true,
    );
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Auto-Organizar con Layout Inteligente */}
      {grafoBlock && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-foreground text-xs leading-tight">Auto-Organizar</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {currentSubtipo === 'mapa_mental' ? 'Distribución radial 360°' : 'Alineación jerárquica'}
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleAutoLayout}
            className="h-7 text-xs px-2.5"
          >
            Organizar
          </Button>
        </div>
      )}

      {/* Selector de Subtipo */}
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
                <span className="min-w-0 text-[11px] leading-tight break-words">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Paletas Armónicas */}
      {grafoBlock && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paleta de Colores
              </Label>
            </div>
            {grafoBlock.opciones?.paleta && (
              <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 h-4 font-mono">
                {PALETAS_DIAGRAMA[grafoBlock.opciones.paleta]?.nombre.split(' ')[0] ?? 'Auto'}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(PALETAS_DIAGRAMA) as DiagramaPaletaId[]).map((paletaKey) => {
              const pal = PALETAS_DIAGRAMA[paletaKey];
              const isSelected = grafoBlock.opciones?.paleta === paletaKey;
              return (
                <button
                  key={paletaKey}
                  type="button"
                  title={pal.descripcion}
                  onClick={() => {
                    const themed = aplicarPaletaADiagrama(grafoBlock, paletaKey);
                    commitChange(themed, true);
                  }}
                  className={cn(
                    'flex flex-col gap-1 rounded-md border p-1.5 text-left transition-all hover:bg-muted/50',
                    isSelected
                      ? 'border-primary ring-1 ring-primary/40 bg-primary/5 shadow-2xs'
                      : 'border-border/60 bg-card/60',
                  )}
                >
                  <span className="text-[10px] font-medium text-foreground truncate">{pal.nombre}</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: pal.acentoPrincipal }}
                    />
                    <div className="flex -space-x-1 overflow-hidden">
                      {pal.colores.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full border border-background shrink-0"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Configuración Visual Global: Fondo de Lienzo y Trazo de Conectores */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Sliders className="h-3 w-3 text-muted-foreground" />
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estilo Visual Global
              </Label>
            </div>

            {/* Fondo de Lienzo */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Grid className="h-3 w-3" /> Fondo
              </span>
              <div className="flex items-center gap-1">
                {(['puntos', 'cuadricula', 'vacio'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFondoChange(f)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all capitalize',
                      (grafoBlock.opciones?.fondo ?? 'puntos') === f
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {f === 'puntos' ? 'Puntos' : f === 'cuadricula' ? 'Cuadrícula' : 'Vacío'}
                  </button>
                ))}
              </div>
            </div>

            {/* Trazado Global de Conectores */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Spline className="h-3 w-3" /> Conexiones
              </span>
              <div className="flex items-center gap-1">
                {(['smoothstep', 'bezier', 'straight'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleGlobalEdgeTrazado(t)}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    title={`Aplicar trazado ${t === 'smoothstep' ? 'curva ortogonal' : t === 'bezier' ? 'bézier fluido' : 'línea recta'} a todas las conexiones`}
                  >
                    {t === 'smoothstep' ? 'Ortogonal' : t === 'bezier' ? 'Fluida' : 'Recta'}
                  </button>
                ))}
              </div>
            </div>

            {/* Estilo de Línea Global */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Línea</span>
              <div className="flex items-center gap-1">
                {(['solida', 'discontinua', 'punteada'] as const).map((estilo) => (
                  <button
                    key={estilo}
                    type="button"
                    onClick={() => handleGlobalEdgeEstilo(estilo)}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all capitalize"
                    title={`Aplicar línea ${estilo} a todas las conexiones`}
                  >
                    {estilo === 'solida' ? 'Sólida' : estilo === 'discontinua' ? 'Guiones' : 'Puntos'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plantillas Pedagógicas — colapsada por defecto (ver plantillasOpen) */}
      <Collapsible open={plantillasOpen} onOpenChange={setPlantillasOpen} className="space-y-2 border-t border-border pt-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-1.5 text-left">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plantillas Pedagógicas
            </Label>
          </span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', plantillasOpen && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATES_CONFIG.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleLoadTemplate(tpl.id)}
                className="flex flex-col items-start rounded border border-border/70 bg-card/60 p-2 text-left hover:bg-primary/5 hover:border-primary/50 transition-all"
              >
                <span className="font-semibold text-foreground text-[11px]">{tpl.label}</span>
                <span className="text-[9px] text-muted-foreground line-clamp-1">{tpl.desc}</span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Modo Esquema (Texto / Markdown) */}
      {grafoBlock && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Modo Esquema (Texto / Markdown)
            </Label>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Escribe ideas con sangría (2 espacios o guiones) para generar el diagrama al instante.
          </p>
          <Textarea
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder={`Idea Principal\n  Rama 1\n    Detalle A\n  Rama 2\n    Detalle B`}
            rows={5}
            className="text-xs font-mono resize-none leading-relaxed bg-muted/20"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!outlineText.trim()}
            onClick={handleGenerateOutline}
            className="w-full h-7 text-xs font-medium"
          >
            <Sparkles className="mr-1.5 h-3 w-3 text-primary" />
            Generar desde Esquema
          </Button>
        </div>
      )}

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

                  {/* Selector de forma del nodo */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5">
                    {FORMAS_CONFIG.map((f) => (
                      <button
                        key={f.forma}
                        type="button"
                        onClick={() => handleNodeFormaChange(nodo.id, f.forma)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] border transition-all shrink-0',
                          (nodo.forma ?? (isRoot ? 'root' : 'rounded')) === f.forma
                            ? 'border-primary bg-primary text-primary-foreground font-semibold'
                            : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70',
                        )}
                      >
                        {f.label}
                      </button>
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

                  {/* Selector de trazado */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {(['smoothstep', 'bezier', 'straight'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleEdgeTrazadoChange(arista.id, t)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] border transition-all',
                          (arista.tipoTrazado ?? 'smoothstep') === t
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                        )}
                      >
                        {t === 'smoothstep' ? 'Curva' : t === 'bezier' ? 'Bézier' : 'Recta'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
