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
  Download,
  Grid,
  Sliders,
  Spline,
  PenTool,
  Undo2,
} from 'lucide-react';
import type {
  Block,
  DiagramaArista,
  DiagramaAristaEstiloLinea,
  DiagramaBlock,
  DiagramaEscena,
  DiagramaEstilo,
  DiagramaGrafoBlock,
  DiagramaNodo,
  DiagramaNodoForma,
  DiagramaPaletaId,
  DiagramaRelleno,
  DiagramaSubtipo,
  DiagramaVennBlock,
} from '@lumina/types/slide';
import {
  organizarGrafo,
  resolverDensidad,
  resolverDireccion,
  tieneLayoutPropio,
  type DensidadLayout,
  type DireccionLayout,
} from './diagrama-dagre.js';
import { NOMBRE_CONJUNTO_MAX, sanitizeEstilo } from './diagrama-defaults.js';
import { descargarBlob, exportarDiagrama, nombreArchivo, svgAPng, type FormatoExportacion, type TemaExportacion } from './diagrama-export.js';
import { layoutCebolla, layoutEmbudo, layoutPiramide } from './layout-pedagogico.js';
import { outlineToDiagrama } from './diagrama-outline-parser.js';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';
import { Badge } from '@lumina/ui/badge';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { FieldHelp } from '@lumina/ui/field-help';
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
import { escenaASvg, normalizarEscena, type Escena } from '@lumina/drawing';
import { EditorLibreModal } from '../../elements/dibujo/editor/editor-libre-modal.js';
import { diagramaAEscena } from './diagrama-escena.js';

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
  { forma: 'rect', label: 'Rectángulo' },
  { forma: 'ellipse', label: 'Elipse' },
  { forma: 'hexagon', label: 'Hexágono' },
];

type TrazadoEditable = NonNullable<DiagramaArista['tipoTrazado']>;

const TRAZADO_GLOBAL: Record<TrazadoEditable, string> = {
  smoothstep: 'Curva',
  orthogonal: 'Ortogonal',
  bezier: 'Fluida',
  straight: 'Recta',
};

const TRAZADO_ARISTA: Record<TrazadoEditable, string> = {
  smoothstep: 'Curva',
  orthogonal: 'Ángulo recto',
  bezier: 'Bézier',
  straight: 'Recta',
};

const TRAZADO_TITULO: Record<TrazadoEditable, string> = {
  smoothstep: 'de esquinas redondeadas',
  orthogonal: 'en ángulo recto',
  bezier: 'bézier fluido',
  straight: 'de línea recta',
};

// Opciones de la sección «Estilo». `undefined` = «Automático»: no se guarda nada
// y el diagrama usa el aspecto propio de su subtipo.
const RELLENO_OPCIONES: Array<{ valor: DiagramaRelleno | undefined; label: string }> = [
  { valor: undefined, label: 'Automático' },
  { valor: 'contorno', label: 'Contorno' },
  { valor: 'tintado', label: 'Tintado' },
  { valor: 'solido', label: 'Sólido' },
];

const GROSOR_OPCIONES: Array<{ valor: number | undefined; label: string }> = [
  { valor: undefined, label: 'Auto' },
  { valor: 1, label: 'Fino' },
  { valor: 2.5, label: 'Medio' },
  { valor: 4, label: 'Grueso' },
];

const PATRON_OPCIONES: Array<{ valor: DiagramaAristaEstiloLinea | undefined; label: string }> = [
  { valor: undefined, label: 'Auto' },
  { valor: 'solida', label: 'Sólida' },
  { valor: 'discontinua', label: 'Guiones' },
  { valor: 'punteada', label: 'Puntos' },
];

const DIRECCION_OPCIONES: Array<{ valor: DireccionLayout; label: string; descripcion: string }> = [
  { valor: 'TB', label: 'Arriba → abajo', descripcion: 'Jerárquica de arriba hacia abajo' },
  { valor: 'LR', label: 'Izq. → der.', descripcion: 'Jerárquica de izquierda a derecha' },
  { valor: 'BT', label: 'Abajo → arriba', descripcion: 'Jerárquica de abajo hacia arriba' },
  { valor: 'RL', label: 'Der. → izq.', descripcion: 'Jerárquica de derecha a izquierda' },
  { valor: 'radial', label: 'Radial', descripcion: 'Distribución radial 360°' },
];

const DENSIDAD_OPCIONES: Array<{ valor: DensidadLayout; label: string }> = [
  { valor: 'compacta', label: 'Compacta' },
  { valor: 'normal', label: 'Normal' },
  { valor: 'amplia', label: 'Amplia' },
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

function DiagramaPropertiesClasico({
  block,
  applyNow,
  onEditarLibre,
}: DiagramaPropertiesProps & { onEditarLibre: () => void }) {
  const [localBlock, setLocalBlock] = useState<DiagramaBlock>(block);
  const [outlineText, setOutlineText] = useState('');
  // Opciones de exportación: solo viven en el panel, no se guardan en el bloque.
  const [exportTema, setExportTema] = useState<TemaExportacion>('claro');
  const [exportFondo, setExportFondo] = useState(true);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
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
    // `dirigida` explícita (decisión del docente por arista) se conserva; solo las
    // que no la tienen toman el valor por defecto del subtipo destino.
    let nextAristas: DiagramaArista[] = grafoBlock.aristas.map((a) => ({
      ...a,
      dirigida: a.dirigida ?? isDirected,
    }));

    if (newSubtipo === 'piramide') {
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
      // mapa_mental / flujo / organigrama / mapa_conceptual: según dirección y densidad del diagrama
      nextNodos = organizarGrafo(nextNodos, nextAristas, newSubtipo, grafoBlock.opciones);
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

  // ─── Exportar (PNG / SVG) ───
  const handleExportar = async (formato: FormatoExportacion) => {
    if (!grafoBlock || exportando) return;
    setExportando(formato);
    setExportError(null);
    try {
      await exportarDiagrama(grafoBlock, formato, { tema: exportTema, fondo: exportFondo });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'No se pudo exportar el diagrama.');
    } finally {
      setExportando(null);
    }
  };

  // ─── Disposición (opciones.direccionLayout / opciones.densidad) ───
  const direccionActual = resolverDireccion(grafoBlock?.opciones, currentSubtipo);
  const densidadActual = resolverDensidad(grafoBlock?.opciones);
  const disposicionPropia = tieneLayoutPropio(currentSubtipo);

  const commitDisposicion = (cambio: { direccionLayout?: DireccionLayout; densidad?: DensidadLayout }) => {
    if (!grafoBlock) return;
    commitChange({ ...grafoBlock, opciones: { ...(grafoBlock.opciones ?? {}), ...cambio } }, true);
  };

  // ─── Estilo del diagrama (opciones.estilo) ───
  // Una confirmación por clic: cada control es discreto, nunca se escribe por fotograma.
  const estiloActual: DiagramaEstilo = grafoBlock?.opciones?.estilo ?? {};

  const commitEstilo = (estilo: DiagramaEstilo) => {
    if (!grafoBlock) return;
    const opciones = { ...(grafoBlock.opciones ?? {}) };
    delete opciones.estilo;
    const limpio = sanitizeEstilo(estilo);
    if (limpio) opciones.estilo = limpio;
    commitChange(
      { ...grafoBlock, opciones: Object.keys(opciones).length > 0 ? opciones : undefined },
      true,
    );
  };

  const commitConector = (cambio: NonNullable<DiagramaEstilo['conector']>) =>
    commitEstilo({ ...estiloActual, conector: { ...estiloActual.conector, ...cambio } });

  // ─── Nombres de los conjuntos (Venn) ───
  const handleNombreConjunto = (indice: number, nombre: string) => {
    if (grafoBlock) return;
    const venn = localBlock as DiagramaVennBlock;
    const nombresConjuntos = Array.from({ length: venn.conjuntos }, (_, i) =>
      i === indice ? nombre : (venn.nombresConjuntos?.[i] ?? ''),
    );
    commitChange({ ...venn, nombresConjuntos });
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

    const nextNodos = organizarGrafo(grafoBlock.nodos, grafoBlock.aristas, currentSubtipo, grafoBlock.opciones);

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

    // Dirección y densidad del diagrama (radial para el mapa mental, salvo que se elija otra)
    const positionedNodes = organizarGrafo(nodos, aristas, currentSubtipo, grafoBlock.opciones);

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
      {/* Edición libre: convierte el diagrama en un dibujo que se puede cambiar por completo. */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-2 shadow-2xs" data-diagrama-edicion-libre="">
        <div className="flex items-start gap-2">
          <PenTool className="mt-0.5 h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="font-semibold text-foreground text-xs leading-tight">Edición libre</div>
            <div className="text-[10px] text-muted-foreground leading-snug">
              Mueve, cambia de forma, gira, agrupa y alinea las figuras como en un editor de dibujo. El diagrama original se conserva hasta que hagas un cambio.
            </div>
          </div>
        </div>
        <Button type="button" size="sm" variant="primary" onClick={onEditarLibre} className="h-7 w-full text-xs">
          Editar libremente
        </Button>
      </div>

      {/* Auto-Organizar con Layout Inteligente */}
      {grafoBlock && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-foreground text-xs leading-tight">Auto-Organizar</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {tieneLayoutPropio(currentSubtipo)
                  ? 'Alineación jerárquica'
                  : (DIRECCION_OPCIONES.find((d) => d.valor === direccionActual)?.descripcion ?? 'Alineación jerárquica')}
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

      {/* Disposición: hacia dónde crece el diagrama y cuánto se separan los nodos. Se aplica con «Organizar». */}
      {grafoBlock && (
        <CollapsibleSection
          title="Disposición"
          icon={Network}
          defaultOpen={false}
          storageKey="diagrama.disposicion"
          className="border-t border-border pt-3"
        >
          <div className="space-y-3 text-[11px]">
            {disposicionPropia && (
              <p className="text-muted-foreground">Este tipo de diagrama tiene su propia disposición.</p>
            )}
            <div className="space-y-1">
              <span className="text-muted-foreground">Dirección</span>
              <div className="flex flex-wrap items-center gap-1">
                {DIRECCION_OPCIONES.map(({ valor, label, descripcion }) => (
                  <button
                    key={valor}
                    type="button"
                    disabled={disposicionPropia}
                    title={descripcion}
                    aria-pressed={!disposicionPropia && direccionActual === valor}
                    onClick={() => commitDisposicion({ direccionLayout: valor })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all disabled:opacity-50 disabled:pointer-events-none',
                      !disposicionPropia && direccionActual === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Densidad</span>
              <div className="flex items-center gap-1">
                {DENSIDAD_OPCIONES.map(({ valor, label }) => (
                  <button
                    key={valor}
                    type="button"
                    disabled={disposicionPropia || direccionActual === 'radial'}
                    aria-pressed={!disposicionPropia && densidadActual === valor}
                    onClick={() => commitDisposicion({ densidad: valor })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all disabled:opacity-50 disabled:pointer-events-none',
                      !disposicionPropia && densidadActual === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!disposicionPropia && (
              <p className="text-[10px] text-muted-foreground">Se aplica al pulsar «Organizar».</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Selector de Subtipo */}
      <CollapsibleSection
        title="Tipo de Diagrama"
        storageKey="diagrama.tipo"
        badge={subtipoMeta.label}
      >
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
      </CollapsibleSection>

      {/* Selector de Paletas Armónicas (+ Estilo Visual Global, mismo bloque) */}
      {grafoBlock && (
        <CollapsibleSection
          title="Paleta de Colores"
          icon={Palette}
          defaultOpen={false}
          storageKey="diagrama.paleta"
          badge={
            grafoBlock.opciones?.paleta
              ? (PALETAS_DIAGRAMA[grafoBlock.opciones.paleta]?.nombre.split(' ')[0] ?? 'Auto')
              : undefined
          }
          className="border-t border-border pt-3"
        >
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
                {(['smoothstep', 'orthogonal', 'bezier', 'straight'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleGlobalEdgeTrazado(t)}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    title={`Aplicar trazado ${TRAZADO_TITULO[t]} a todas las conexiones`}
                  >
                    {TRAZADO_GLOBAL[t]}
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
        </CollapsibleSection>
      )}

      {/* Estilo del diagrama: relleno, sombra y conector por defecto (opciones.estilo) */}
      {grafoBlock && (
        <CollapsibleSection
          title="Estilo"
          icon={Sliders}
          defaultOpen={false}
          storageKey="diagrama.estilo"
          badge={grafoBlock.opciones?.estilo ? 'Personalizado' : undefined}
          className="border-t border-border pt-3"
        >
          <div className="space-y-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aspecto de las formas
              </span>
              <FieldHelp label="Estilo del diagrama">
                <p>
                  <strong>Contorno</strong>: fondo de tarjeta y borde de color. <strong>Tintado</strong>: el
                  color de cada nodo se mezcla suave con el fondo. <strong>Sólido</strong>: fondo del color
                  del nodo y texto con contraste.
                </p>
                <p>
                  El conector es el valor por defecto: una conexión con trazado, grosor o línea propios
                  (por ejemplo, aplicados desde «Estilo Visual Global») conserva los suyos.
                </p>
              </FieldHelp>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Relleno</span>
              <div className="flex flex-wrap items-center gap-1">
                {RELLENO_OPCIONES.map(({ valor, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={estiloActual.relleno === valor}
                    onClick={() => commitEstilo({ ...estiloActual, relleno: valor })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      estiloActual.relleno === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Sombra</span>
              <div className="flex items-center gap-1">
                {([
                  { sombra: undefined, label: 'Con sombra' },
                  { sombra: false, label: 'Sin sombra' },
                ] as const).map(({ sombra, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={estiloActual.sombra === sombra}
                    onClick={() => commitEstilo({ ...estiloActual, sombra })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      estiloActual.sombra === sombra
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Spline className="h-3 w-3" /> Conector · trazado
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {([undefined, 'smoothstep', 'orthogonal', 'bezier', 'straight'] as const).map((t) => (
                  <button
                    key={t ?? 'auto'}
                    type="button"
                    aria-pressed={estiloActual.conector?.trazado === t}
                    onClick={() => commitConector({ trazado: t })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      estiloActual.conector?.trazado === t
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {t ? TRAZADO_GLOBAL[t] : 'Auto'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Conector · grosor</span>
              <div className="flex flex-wrap items-center gap-1">
                {GROSOR_OPCIONES.map(({ valor, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={estiloActual.conector?.grosor === valor}
                    onClick={() => commitConector({ grosor: valor })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      estiloActual.conector?.grosor === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Conector · línea</span>
              <div className="flex flex-wrap items-center gap-1">
                {PATRON_OPCIONES.map(({ valor, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={estiloActual.conector?.patron === valor}
                    onClick={() => commitConector({ patron: valor })}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      estiloActual.conector?.patron === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {grafoBlock.opciones?.estilo && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => commitEstilo({})}>
                Restablecer estilo
              </Button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Exportar el diagrama como imagen (PNG o SVG), sin los controles del lienzo */}
      {grafoBlock && (
        <CollapsibleSection
          title="Exportar"
          icon={Download}
          defaultOpen={false}
          storageKey="diagrama.exportar"
          className="border-t border-border pt-3"
        >
          <div className="space-y-3 text-[11px]">
            <div className="space-y-1">
              <span className="text-muted-foreground">Tema de la imagen</span>
              <div className="flex items-center gap-1">
                {([['claro', 'Claro'], ['oscuro', 'Oscuro']] as const).map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={exportTema === valor}
                    onClick={() => setExportTema(valor)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      exportTema === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Fondo</span>
              <div className="flex items-center gap-1">
                {([[true, 'Con fondo'], [false, 'Transparente']] as const).map(([valor, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={exportFondo === valor}
                    onClick={() => setExportFondo(valor)}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] border transition-all',
                      exportFondo === valor
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['png', 'svg'] as const).map((formato) => (
                <Button
                  key={formato}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={grafoBlock.nodos.length === 0 || exportando !== null}
                  onClick={() => void handleExportar(formato)}
                  className="h-7 text-xs px-2.5"
                >
                  {exportando === formato ? 'Exportando…' : `Descargar ${formato.toUpperCase()}`}
                </Button>
              ))}
            </div>
            {exportError && (
              <p role="alert" className="text-[10px] text-destructive">
                {exportError}
              </p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Plantillas Pedagógicas — colapsada por defecto (ver plantillasOpen) */}
      <CollapsibleSection
        title="Plantillas Pedagógicas"
        icon={BookOpen}
        defaultOpen={false}
        storageKey="diagrama.plantillas"
        badge={TEMPLATES_CONFIG.length}
        className="border-t border-border pt-3"
      >
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
      </CollapsibleSection>

      {/* Modo Esquema (Texto / Markdown) */}
      {grafoBlock && (
        <CollapsibleSection
          title="Modo Esquema (Texto / Markdown)"
          icon={FileText}
          defaultOpen={false}
          storageKey="diagrama.esquema"
          className="border-t border-border pt-3"
        >
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
        </CollapsibleSection>
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

      {/* Venn: nombre de cada conjunto (por defecto A, B, C) */}
      {!grafoBlock && (
        <CollapsibleSection title="Conjuntos" storageKey="diagrama.conjuntos">
          <div className="space-y-1.5">
            {Array.from({ length: (localBlock as DiagramaVennBlock).conjuntos }, (_, i) => {
              const letra = ['A', 'B', 'C'][i];
              return (
                <div key={letra} className="flex items-center gap-2">
                  <Label htmlFor={`venn-conjunto-${letra}`} className="w-16 shrink-0 text-[11px] text-muted-foreground">
                    Conjunto {letra}
                  </Label>
                  <Input
                    id={`venn-conjunto-${letra}`}
                    value={(localBlock as DiagramaVennBlock).nombresConjuntos?.[i] ?? ''}
                    placeholder={letra}
                    maxLength={NOMBRE_CONJUNTO_MAX}
                    onChange={(e) => handleNombreConjunto(i, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* 3. Gestión de Nodos / Elementos */}
      {grafoBlock && (
        <CollapsibleSection
          title="Nodos"
          icon={Network}
          storageKey="diagrama.nodos"
          badge={grafoBlock.nodos.length}
          className="border-t border-border pt-3"
        >
          <div className="flex justify-end">
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
        </CollapsibleSection>
      )}

      {/* 4. Conexiones y Proposiciones (Aristas) */}
      {grafoBlock && grafoBlock.aristas.length > 0 && (
        <CollapsibleSection
          title="Conexiones"
          icon={Share2}
          defaultOpen={false}
          storageKey="diagrama.conexiones"
          badge={grafoBlock.aristas.length}
          className="border-t border-border pt-3"
        >
          {currentSubtipo === 'mapa_conceptual' && (
            <span className="text-[10px] text-muted-foreground italic">
              Palabras de enlace
            </span>
          )}

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
                    {(['smoothstep', 'orthogonal', 'bezier', 'straight'] as const).map((t) => (
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
                        {TRAZADO_ARISTA[t]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}


// ─── Diagrama editado como dibujo libre (W5b) ─────────────────────────────────

/** Panel de un diagrama que ya es un dibujo libre: lo clásico (nodos, paletas, disposición) ya no se aplica. */
function DiagramaPropertiesEscena({
  block,
  applyNow,
  onEditar,
}: {
  block: DiagramaBlock;
  applyNow: DiagramaPropertiesProps['applyNow'];
  onEditar: () => void;
}) {
  const [titulo, setTitulo] = useState(block.titulo ?? '');
  const [descripcion, setDescripcion] = useState(block.descripcionAccesible ?? '');
  const [confirmando, setConfirmando] = useState(false);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const temporizador = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!temporizador.current) {
      setTitulo(block.titulo ?? '');
      setDescripcion(block.descripcionAccesible ?? '');
    }
  }, [block.titulo, block.descripcionAccesible]);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const aplicar = (cambio: Partial<Pick<DiagramaBlock, 'titulo' | 'descripcionAccesible'>>) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      void applyNow((b) => (b.tipo === 'diagrama' && (b as DiagramaBlock).id === block.id ? ({ ...b, ...cambio } as Block) : b));
    }, 300);
  };

  const volverAlOriginal = () => {
    setConfirmando(false);
    void applyNow((b) => {
      if (b.tipo !== 'diagrama' || (b as DiagramaBlock).id !== block.id) return b;
      const { escena: _descartada, ...resto } = b as DiagramaBlock;
      return resto as Block;
    });
  };

  const exportar = async (formato: FormatoExportacion) => {
    if (exportando) return;
    setExportando(formato);
    setExportError(null);
    try {
      const escena: Escena = { ...normalizarEscena(block.escena), fondo: normalizarEscena(block.escena).fondo ?? '#FFFFFF' };
      const { svg, ancho, alto } = escenaASvg(escena, { modo: 'claro', titulo: titulo || 'Diagrama' });
      const blob = formato === 'svg' ? new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }) : await svgAPng(svg, ancho, alto);
      descargarBlob(blob, nombreArchivo({ titulo }, formato));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'No se pudo exportar el dibujo.');
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="space-y-5 text-xs" data-diagrama-panel-escena="">
      <div className="space-y-2">
        <Button type="button" size="sm" variant="primary" onClick={onEditar} className="h-8 w-full text-xs">
          <PenTool /> Editar dibujo
        </Button>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Este diagrama se edita como dibujo libre. También puedes abrir el editor con doble clic sobre él.
        </p>
      </div>

      <div className="space-y-2">
        <div className="space-y-1.5">
          <Label htmlFor="diagrama-escena-titulo" className="text-xs">
            Título
          </Label>
          <Input
            id="diagrama-escena-titulo"
            value={titulo}
            maxLength={120}
            onChange={(e) => {
              setTitulo(e.target.value);
              aplicar({ titulo: e.target.value });
            }}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diagrama-escena-descripcion" className="text-xs">
            Descripción para lectores de pantalla
          </Label>
          <Textarea
            id="diagrama-escena-descripcion"
            value={descripcion}
            maxLength={500}
            rows={3}
            placeholder="Cuenta con palabras qué muestra el dibujo."
            onChange={(e) => {
              setDescripcion(e.target.value);
              aplicar({ descripcionAccesible: e.target.value });
            }}
            className="resize-none text-xs"
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className="font-semibold text-foreground">Descargar</div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={exportando !== null} onClick={() => void exportar('svg')} className="h-7 flex-1 text-xs">
            <Download /> SVG
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={exportando !== null} onClick={() => void exportar('png')} className="h-7 flex-1 text-xs">
            <Download /> PNG
          </Button>
        </div>
        {exportError ? <p className="text-[10px] text-destructive">{exportError}</p> : null}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        {confirmando ? (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-2">
            <p className="text-[11px] text-foreground leading-snug">Se pierden los cambios hechos en el dibujo y vuelve el diagrama original. ¿Seguro?</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="destructive" onClick={volverAlOriginal} className="h-7 flex-1 text-xs">
                Sí, volver
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmando(false)} className="h-7 flex-1 text-xs">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmando(true)} className="h-7 w-full text-xs text-muted-foreground">
            <Undo2 /> Volver al diagrama original
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Panel de propiedades de Diagramas. El editor libre se monta aquí (y no dentro de cada panel) para
 * que siga abierto cuando el primer cambio convierte el diagrama en dibujo y el panel se reemplaza.
 */
export function DiagramaProperties(props: DiagramaPropertiesProps) {
  const { block, applyNow } = props;
  const [escenaAbierta, setEscenaAbierta] = useState<Escena | null>(null);

  const abrir = () => setEscenaAbierta(block.escena ? normalizarEscena(block.escena) : diagramaAEscena(block));
  const guardar = (escena: Escena) => {
    void applyNow((b) => (b.tipo === 'diagrama' && (b as DiagramaBlock).id === block.id ? ({ ...b, escena: escena as unknown as DiagramaEscena } as Block) : b));
  };

  return (
    <>
      {block.escena ? (
        <DiagramaPropertiesEscena block={block} applyNow={applyNow} onEditar={abrir} />
      ) : (
        <DiagramaPropertiesClasico {...props} onEditarLibre={abrir} />
      )}
      <EditorLibreModal
        abierto={escenaAbierta !== null}
        escena={escenaAbierta ?? normalizarEscena({})}
        {...(block.titulo ? { titulo: block.titulo } : {})}
        onCambio={guardar}
        onCerrar={() => setEscenaAbierta(null)}
      />
    </>
  );
}
