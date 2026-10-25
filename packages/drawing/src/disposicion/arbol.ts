// ─── Disposición en árbol (Y13) ───────────────────────────────────────────────
// Puro. Cada padre queda centrado respecto de sus hijos; los niveles son columnas (o filas) y los hermanos se apilan.

import { bosqueDe, type AristaDisposicion, type NodoDisposicion, type OpcionesBosque, type Posiciones } from './grafo.js';

export type OrientacionArbol = 'derecha' | 'abajo';

export interface OpcionesArbol extends OpcionesBosque {
  orientacion?: OrientacionArbol;
  /**
   * Cómo se acomoda cada caja dentro de la columna (o fila) de su nivel: `centro` (por defecto, lo de siempre) o `inicio`, que alinea el
   * borde de entrada —el izquierdo con `derecha`, el de arriba con `abajo`— de todas las cajas del nivel (Y37a).
   */
  alinear?: 'centro' | 'inicio';
  /**
   * Sobre qué se centra un padre en el eje cruzado: `bloque` (por defecto, lo de siempre) lo centra sobre **todo lo que ocupan sus hijos
   * con sus descendientes**; `hijos` lo centra sobre el punto medio entre el **primer y el último hijo** (el abanico de conectores
   * queda simétrico aunque el primer subárbol sea más ancho que el último) (Y37a).
   */
  centrar?: 'bloque' | 'hijos';
  /** Espeja el eje principal: los hijos quedan antes que su padre (flujo hacia arriba o hacia la izquierda) (Y37a). */
  invertir?: boolean;
  /** Separación entre niveles. */
  separacionNiveles?: number;
  /** Separación entre hermanos (y entre árboles). */
  separacionHermanos?: number;
}

/** Cada árbol del bosque, uno tras otro. Las esquinas son relativas a (0, 0) y no se anclan: de eso se ocupa quien llama. */
export function disponerArbol(nodos: readonly NodoDisposicion[], aristas: readonly AristaDisposicion[], opciones: OpcionesArbol = {}): Posiciones {
  const orientacion = opciones.orientacion ?? 'derecha';
  const sepNiveles = opciones.separacionNiveles ?? 80;
  const sepHermanos = opciones.separacionHermanos ?? 30;
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const alinear = opciones.alinear ?? 'centro';
  const centrar = opciones.centrar ?? 'bloque';
  const { raices, hijos } = bosqueDe(nodos, aristas, opciones.ordenHermanos ? { ordenHermanos: opciones.ordenHermanos } : {});
  // Eje principal: el de la profundidad; cruzado: el de los hermanos.
  const principal = (n: NodoDisposicion): number => (orientacion === 'derecha' ? n.ancho : n.alto);
  const cruzado = (n: NodoDisposicion): number => (orientacion === 'derecha' ? n.alto : n.ancho);

  // Lo que ocupa cada subárbol en el eje cruzado: lo mayor entre el propio nodo y sus hijos juntos. Con `centrar: 'hijos'` el bloque puede
  // crecer hacia un lado (el padre cae donde cae el punto medio entre el primer y el último hijo), así que se guardan también dónde queda
  // el centro del nodo y dónde empiezan sus hijos, ambos desde el inicio del bloque.
  const bloque = new Map<string, number>();
  const centroEnBloque = new Map<string, number>();
  const inicioHijos = new Map<string, number>();
  const medir = (id: string): number => {
    const n = porId.get(id) as NodoDisposicion;
    const hs = hijos.get(id) ?? [];
    const propio = cruzado(n);
    if (centrar === 'bloque') {
      const delosHijos = hs.reduce((suma, h) => suma + medir(h), 0) + Math.max(0, hs.length - 1) * sepHermanos;
      const total = Math.max(propio, delosHijos);
      bloque.set(id, total);
      return total;
    }
    if (hs.length === 0) {
      bloque.set(id, propio);
      centroEnBloque.set(id, propio / 2);
      inicioHijos.set(id, 0);
      return propio;
    }
    let cursor = 0;
    let primero = 0;
    let ultimo = 0;
    hs.forEach((h, i) => {
      const b = medir(h);
      const c = cursor + (centroEnBloque.get(h) as number);
      if (i === 0) primero = c;
      ultimo = c;
      cursor += b + sepHermanos;
    });
    const total = cursor - sepHermanos;
    const medio = (primero + ultimo) / 2;
    const izquierda = Math.min(0, medio - propio / 2);
    const derecha = Math.max(total, medio + propio / 2);
    bloque.set(id, derecha - izquierda);
    centroEnBloque.set(id, medio - izquierda);
    inicioHijos.set(id, -izquierda);
    return derecha - izquierda;
  };

  // El grosor de cada nivel (lo más ancho que hay en él), para alinear las columnas.
  const grosorNivel: number[] = [];
  const profundidades = new Map<string, number>();
  const nivelar = (id: string, nivel: number): void => {
    profundidades.set(id, nivel);
    grosorNivel[nivel] = Math.max(grosorNivel[nivel] ?? 0, principal(porId.get(id) as NodoDisposicion));
    for (const h of hijos.get(id) ?? []) nivelar(h, nivel + 1);
  };
  for (const r of raices) {
    medir(r);
    nivelar(r, 0);
  }
  const inicioNivel: number[] = [];
  let acumulado = 0;
  for (let i = 0; i < grosorNivel.length; i++) {
    inicioNivel[i] = acumulado;
    acumulado += (grosorNivel[i] ?? 0) + sepNiveles;
  }

  const posiciones: Posiciones = new Map();
  const colocar = (id: string, inicioCruzado: number): void => {
    const n = porId.get(id) as NodoDisposicion;
    const nivel = profundidades.get(id) ?? 0;
    const mio = bloque.get(id) as number;
    const cruce = centrar === 'bloque' ? inicioCruzado + (mio - cruzado(n)) / 2 : inicioCruzado + (centroEnBloque.get(id) as number) - cruzado(n) / 2;
    // Centrado dentro de la columna de su nivel.
    const eje = (inicioNivel[nivel] ?? 0) + (alinear === 'centro' ? ((grosorNivel[nivel] ?? 0) - principal(n)) / 2 : 0);
    posiciones.set(id, orientacion === 'derecha' ? { x: eje, y: cruce } : { x: cruce, y: eje });
    const hs = hijos.get(id) ?? [];
    const total = hs.reduce((suma, h) => suma + (bloque.get(h) as number), 0) + Math.max(0, hs.length - 1) * sepHermanos;
    let cursor = centrar === 'bloque' ? inicioCruzado + (mio - total) / 2 : inicioCruzado + (inicioHijos.get(id) as number);
    for (const h of hs) {
      colocar(h, cursor);
      cursor += (bloque.get(h) as number) + sepHermanos;
    }
  };
  let cursorRaices = 0;
  for (const r of raices) {
    colocar(r, cursorRaices);
    cursorRaices += (bloque.get(r) as number) + sepHermanos * 2;
  }
  if (opciones.invertir) {
    // Espejo del eje principal: x' = extensión − (x + ancho) (o y' con `abajo`). Los bordes alineados pasan al lado contrario.
    let extension = 0;
    for (const [id, p] of posiciones) {
      const n = porId.get(id) as NodoDisposicion;
      extension = Math.max(extension, orientacion === 'derecha' ? p.x + n.ancho : p.y + n.alto);
    }
    for (const [id, p] of posiciones) {
      const n = porId.get(id) as NodoDisposicion;
      posiciones.set(id, orientacion === 'derecha' ? { x: extension - (p.x + n.ancho), y: p.y } : { x: p.x, y: extension - (p.y + n.alto) });
    }
  }
  return posiciones;
}
