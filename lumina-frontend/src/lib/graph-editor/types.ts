/**
 * graph-core — modelo de grafo agnóstico de presentación y de dominio.
 *
 * Lo consumen:
 *  - Historia ramificada (Capa 1): actividad G4 con nodos/opciones/conexiones.
 *  - Bloques `diagrama` del canvas (Capa 7+): mapa mental, organigrama, flujo…
 *  - Mapa de progreso Edu (Capa 9): nodos = clases del curso.
 *
 * El bridge (`lumina-rf-bridge.ts`) traduce esto ↔ estructuras de
 * `@xyflow/react`. El dominio (Historia, bloque `diagrama`) mantiene su propio
 * JSON y sólo habla con graph-core a través de `GraphModel`.
 *
 * Regla: graph-core NO conoce «opciones», «tipo de nodo pedagógico» ni el
 * contrato del slide. Todo eso viaja en `GraphNode.meta` / `GraphEdge.meta`,
 * que el bridge preserva sin interpretar.
 */

export interface GraphNode {
  id: string;
  /** Posición en el lienzo de React Flow (coordenadas de mundo, sin escala). */
  x: number;
  y: number;
  /** Texto principal — p. ej. etiqueta de tipo o título corto. */
  label?: string;
  /** Segunda línea — título / subtítulo. */
  sublabel?: string;
  /** Cuerpo largo; la tarjeta lo trunca a 2 líneas. */
  body?: string;
  /** Color de acento (borde + badge). Cualquier color CSS. */
  accent?: string;
  /** Realce visual (p. ej. nodo inicial de la historia). */
  highlighted?: boolean;
  /** Carga libre del consumidor. El bridge la copia tal cual. */
  meta?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** `true` dibuja punta de flecha en el destino. */
  directed?: boolean;
  /** Carga libre del consumidor. El bridge la copia tal cual. */
  meta?: Record<string, unknown>;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Parche de posición emitido durante el drag (una entrada por nodo movido). */
export interface GraphNodePositionPatch {
  id: string;
  x: number;
  y: number;
}

/** Intento de conexión reportado por el lienzo; el consumidor decide si crea arista. */
export interface GraphConnectAttempt {
  source: string;
  target: string;
}

/**
 * Quién manda en la posición al re-sincronizar el modelo con React Flow:
 *  - `'rf'`    (default): React Flow es la verdad tras el sembrado inicial.
 *              El drag manda; el modelo sólo aporta posición a nodos nuevos.
 *  - `'model'`: el modelo manda siempre (necesario para auto-layout: dagre,
 *              layout jerárquico, reposición programática).
 */
export type GraphPositionAuthority = 'rf' | 'model';
