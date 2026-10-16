import { describe, expect, it } from 'vitest';

import { normalizarEscena } from '../normalizar.js';
import { TIPOS_FORMA, type Escena } from '../tipos.js';
import { resolverColor } from './colores.js';
import { escaparXml, escenaANodos, escenaASvg, puntoDePuerto, serializarNodo, type NodoSvg } from './render.js';
import { ajustarTexto, INTERLINEADO, lineasDeTexto } from './texto.js';

// ─── Ayudas ───────────────────────────────────────────────────────────────────

const escena = (elementos: unknown[], extra: Record<string, unknown> = {}): Escena => normalizarEscena({ ancho: 800, alto: 600, fondo: null, elementos, ...extra });

const forma = (id: string, extra: Record<string, unknown> = {}) => ({
  tipo: 'forma',
  id,
  forma: 'rectangulo',
  transformacion: { x: 100, y: 50, ancho: 200, alto: 100, rotacion: 0 },
  ...extra,
});

/** Recorre el árbol y devuelve todos los nodos con esa etiqueta. */
function buscar(nodos: NodoSvg[], tag: string): NodoSvg[] {
  return nodos.flatMap((n) => [...(n.tag === tag ? [n] : []), ...buscar(n.hijos ?? [], tag)]);
}

/** Comprobación mínima de que un XML está bien formado: etiquetas balanceadas y atributos entre comillas. */
function bienFormado(xml: string): boolean {
  const pila: string[] = [];
  const re = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/g;
  let ultimo = 0;
  for (const m of xml.matchAll(re)) {
    const entre = xml.slice(ultimo, m.index);
    if (/[<>]/.test(entre)) return false;
    ultimo = (m.index ?? 0) + m[0].length;
    if (m[4] === '/') continue;
    if (m[1] === '/') {
      if (pila.pop() !== m[2]) return false;
    } else pila.push(m[2]);
  }
  return pila.length === 0 && !/[<>]/.test(xml.slice(ultimo));
}

// ─── Colores ──────────────────────────────────────────────────────────────────

describe('resolverColor', () => {
  it('descompone un hex de 3, 6 y 8 dígitos', () => {
    expect(resolverColor('#abc', 'css')).toEqual({ color: '#AABBCC', opacidad: 1 });
    expect(resolverColor('#0f172a', 'css')).toEqual({ color: '#0F172A', opacidad: 1 });
    expect(resolverColor('#00000080', 'css')).toEqual({ color: '#000000', opacidad: 0.5 });
    expect(resolverColor('#FF000000', 'css').opacidad).toBe(0);
  });

  it('deja los tokens tal cual en modo css y los resuelve por tema en un archivo', () => {
    expect(resolverColor('var(--primary)', 'css')).toEqual({ color: 'var(--primary)', opacidad: 1 });
    expect(resolverColor('var(--primary)', 'claro').color).toBe('#2563EB');
    expect(resolverColor('var(--primary)', 'oscuro').color).toBe('#60A5FA');
    expect(resolverColor('var(--background)', 'oscuro').color).toBe('#0F172A');
  });

  it('un token desconocido cae a un gris y nunca queda sin resolver', () => {
    expect(resolverColor('var(--no-existe)', 'claro')).toEqual({ color: '#64748B', opacidad: 1 });
  });
});

// ─── Texto ────────────────────────────────────────────────────────────────────

describe('lineasDeTexto', () => {
  it('parte por palabras en el ancho disponible', () => {
    expect(lineasDeTexto('uno dos tres cuatro', 80, 10, false)).toEqual(['uno dos tres', 'cuatro']);
    expect(lineasDeTexto('uno dos tres cuatro', 50, 10, false)).toEqual(['uno dos', 'tres', 'cuatro']);
  });

  it('respeta los saltos de línea y conserva las líneas vacías', () => {
    expect(lineasDeTexto('a\n\nb', 1000, 10, false)).toEqual(['a', '', 'b']);
    expect(lineasDeTexto('a\r\nb', 1000, 10, false)).toEqual(['a', 'b']);
  });

  it('parte una palabra más larga que la línea, salvo que se pida lo contrario', () => {
    expect(lineasDeTexto('supercalifragilistico', 50, 10, false).length).toBeGreaterThan(1);
    expect(lineasDeTexto('supercalifragilistico', 50, 10, false, false)).toEqual(['supercalifragilistico']);
  });

  it('una palabra larga sin partir no deja una línea vacía delante, ni al inicio ni en medio', () => {
    expect(lineasDeTexto('supercalifragilistico y más', 50, 10, false, false)).toEqual(['supercalifragilistico', 'y más']);
    expect(lineasDeTexto('a supercalifragilistico', 50, 10, false, false)).toEqual(['a', 'supercalifragilistico']);
    expect(lineasDeTexto('supercalifragilistico', 50, 10, false, false).every((l) => l !== '')).toBe(true);
  });

  it('un texto vacío da una línea vacía y un ancho de 0 no entra en bucle', () => {
    expect(lineasDeTexto('', 100, 10, false)).toEqual(['']);
    expect(lineasDeTexto('hola mundo', 0, 10, false).length).toBeGreaterThan(0);
  });
});

describe('ajustarTexto', () => {
  it('no cambia el tamaño si el texto ya cabe', () => {
    expect(ajustarTexto('Hola', 200, 60, 16, false)).toEqual({ tamano: 16, lineas: ['Hola'] });
  });

  it('reduce la letra hasta que quepa sin partir palabras', () => {
    const r = ajustarTexto('Paralelogramo', 70, 30, 16, true);
    expect(r.tamano).toBeLessThan(16);
    expect(r.lineas).toEqual(['Paralelogramo']);
    expect(r.lineas.length * r.tamano * INTERLINEADO).toBeLessThanOrEqual(30);
  });

  it('usa más líneas antes que una letra diminuta cuando hay alto', () => {
    const r = ajustarTexto('Rectángulo redondeado', 90, 60, 16, true);
    expect(r.lineas).toEqual(['Rectángulo', 'redondeado']);
  });

  it('nunca baja del mínimo; si no cabe, parte las palabras', () => {
    const r = ajustarTexto('Estrellísimamente larga', 20, 10, 16, true, 8);
    expect(r.tamano).toBe(8);
    expect(r.lineas.length).toBeGreaterThan(1);
  });

  it('un mínimo mayor que el tamaño se limita al tamaño', () => {
    expect(ajustarTexto('Hola', 200, 60, 6, false, 8).tamano).toBe(6);
  });
});

// ─── Serialización ────────────────────────────────────────────────────────────

describe('serialización', () => {
  it('escapa los cinco caracteres especiales', () => {
    expect(escaparXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });

  it('un nodo sin contenido es autocerrado y con contenido lleva etiqueta de cierre', () => {
    expect(serializarNodo({ tag: 'rect', attrs: { width: 5 } })).toBe('<rect width="5"/>');
    expect(serializarNodo({ tag: 'g', attrs: {}, hijos: [{ tag: 'text', attrs: { x: 1 }, texto: 'a<b' }] })).toBe('<g><text x="1">a&lt;b</text></g>');
  });

  it('escapa los atributos', () => {
    expect(serializarNodo({ tag: 'g', attrs: { 'data-x': '"><script>' } })).toBe('<g data-x="&quot;&gt;&lt;script&gt;"/>');
  });
});

// ─── Escena ───────────────────────────────────────────────────────────────────

describe('escenaANodos', () => {
  it('una escena vacía no dibuja nada', () => {
    expect(escenaANodos(escena([])).nodos).toEqual([]);
  });

  it('devuelve el tamaño de la escena', () => {
    const r = escenaANodos(escena([], { ancho: 1234, alto: 567 }));
    expect([r.ancho, r.alto]).toEqual([1234, 567]);
  });

  it('dibuja el fondo si lo hay y se puede omitir', () => {
    const e = escena([], { fondo: '#F8FAFC' });
    expect(escenaANodos(e).nodos).toEqual([{ tag: 'rect', attrs: { width: 800, height: 600, fill: '#F8FAFC' } }]);
    expect(escenaANodos(e, { fondo: false }).nodos).toEqual([]);
  });

  it('un grupo no se dibuja, sus hijos sí, y el orden de apilado se conserva', () => {
    const e = escena([forma('a'), forma('b'), forma('c'), { tipo: 'grupo', id: 'g', hijos: ['a', 'b'] }]);
    const ids = escenaANodos(e).nodos.map((n) => n.attrs['data-elemento-id']);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('no dibuja lo oculto ni los hijos de un grupo oculto', () => {
    const e = escena([forma('a', { oculto: true }), forma('b'), forma('c'), { tipo: 'grupo', id: 'g', oculto: true, hijos: ['b', 'c'] }, forma('d')]);
    expect(escenaANodos(e).nodos.map((n) => n.attrs['data-elemento-id'])).toEqual(['d']);
  });

  it('un grupo anidado oculto oculta a todos sus descendientes', () => {
    const e = escena([forma('a'), forma('b'), forma('c'), { tipo: 'grupo', id: 'interno', hijos: ['a', 'b'] }, { tipo: 'grupo', id: 'externo', oculto: true, hijos: ['interno', 'c'] }]);
    expect(escenaANodos(e).nodos).toEqual([]);
  });

  it('una forma lleva su transformación, su trazado y su estilo', () => {
    const e = escena([forma('a', { transformacion: { x: 10.5, y: 20, ancho: 100, alto: 50, rotacion: 90 }, estilo: { relleno: { tipo: 'solido', color: '#FF0000' }, contorno: { color: '#00FF00', grosor: 3 }, opacidad: 0.5 } })]);
    const [g] = escenaANodos(e).nodos;
    expect(g.attrs).toMatchObject({ 'data-elemento-id': 'a', transform: 'translate(10.5 20) rotate(90 50 25)', opacity: 0.5 });
    const path = g.hijos?.[0];
    expect(path).toMatchObject({ tag: 'path' });
    expect(path?.attrs).toMatchObject({ d: 'M0,0 L100,0 L100,50 L0,50 Z', fill: '#FF0000', stroke: '#00FF00', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  });

  it('sin rotación el transform es solo la traslación y sin opacidad no hay atributo', () => {
    const [g] = escenaANodos(escena([forma('a')])).nodos;
    expect(g.attrs.transform).toBe('translate(100 50)');
    expect(g.attrs).not.toHaveProperty('opacity');
  });

  it('un contorno de grosor 0 se quita y un relleno ninguno queda en none', () => {
    const [g] = escenaANodos(escena([forma('a', { estilo: { relleno: { tipo: 'ninguno' }, contorno: { grosor: 0 } } })])).nodos;
    expect(g.hijos?.[0].attrs).toMatchObject({ fill: 'none', stroke: 'none' });
    expect(g.hijos?.[0].attrs).not.toHaveProperty('stroke-width');
  });

  it('los patrones de línea producen su trazo discontinuo', () => {
    const attrs = (patron: string) =>
      escenaANodos(escena([forma('a', { estilo: { contorno: { grosor: 2, patron } } })])).nodos[0].hijos?.[0].attrs ?? {};
    expect(attrs('solido')).not.toHaveProperty('stroke-dasharray');
    expect(attrs('guiones')['stroke-dasharray']).toBe('6 4');
    expect(attrs('puntos')).toMatchObject({ 'stroke-dasharray': '0.01 4.4', 'stroke-linecap': 'round' });
  });

  it('un color con alfa se convierte en color + opacidad', () => {
    const [g] = escenaANodos(escena([forma('a', { estilo: { relleno: { tipo: 'solido', color: '#00000080' } } })])).nodos;
    expect(g.hijos?.[0].attrs).toMatchObject({ fill: '#000000', 'fill-opacity': 0.5 });
  });

  it('los tokens quedan como variables en pantalla y se resuelven en un archivo', () => {
    const e = escena([forma('a', { estilo: { relleno: { tipo: 'solido', color: 'var(--primary)' }, contorno: { color: 'var(--foreground)', grosor: 2 } } })]);
    expect(serializarNodo(escenaANodos(e, { modo: 'css' }).nodos[0])).toContain('fill="var(--primary)"');
    for (const modo of ['claro', 'oscuro'] as const) {
      expect(serializarNodo(escenaANodos(e, { modo }).nodos[0])).not.toContain('var(');
    }
  });

  it('un degradado define su gradiente con dos paradas y el relleno apunta a él', () => {
    const e = escena([forma('a', { estilo: { relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 0 } } })]);
    const nodos = escenaANodos(e).nodos;
    expect(nodos[0].tag).toBe('defs');
    const [grad] = buscar(nodos, 'linearGradient');
    expect(grad.hijos).toHaveLength(2);
    expect(grad.attrs).toMatchObject({ x1: 0, y1: 0.5, x2: 1, y2: 0.5 });
    const path = buscar(nodos, 'path')[0];
    expect(path.attrs.fill).toBe(`url(#${grad.attrs.id})`);
  });

  it('un ángulo de 90° va de arriba hacia abajo', () => {
    const e = escena([forma('a', { estilo: { relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 90 } } })]);
    expect(buscar(escenaANodos(e).nodos, 'linearGradient')[0].attrs).toMatchObject({ x1: 0.5, y1: 0, x2: 0.5, y2: 1 });
  });

  it('una sombra define su filtro y la forma lo usa', () => {
    const e = escena([forma('a', { estilo: { sombra: { color: '#00000040', desenfoque: 8, dx: 1, dy: 3 } } })]);
    const nodos = escenaANodos(e).nodos;
    const [sombra] = buscar(nodos, 'feDropShadow');
    expect(sombra.attrs).toMatchObject({ dx: 1, dy: 3, stdDeviation: 4, 'flood-color': '#000000', 'flood-opacity': 0.25 });
    const filtro = buscar(nodos, 'filter')[0];
    expect(buscar(nodos, 'path')[0].attrs.filter).toBe(`url(#${filtro.attrs.id})`);
  });

  it('sin degradados ni sombras no hay <defs>', () => {
    expect(buscar(escenaANodos(escena([forma('a'), forma('b')])).nodos, 'defs')).toEqual([]);
  });

  it('los ids internos son únicos dentro de la escena y llevan el prefijo (sanitizado)', () => {
    const degradado = { relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 0 }, sombra: { color: '#000000' } };
    const e = escena([forma('a', { estilo: degradado }), forma('b', { estilo: degradado })]);
    const ids = [...buscar(escenaANodos(e, { prefijoIds: 'mi dibujo!' }).nodos, 'linearGradient'), ...buscar(escenaANodos(e, { prefijoIds: 'mi dibujo!' }).nodos, 'filter')].map((n) => String(n.attrs.id));
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(id).toMatch(/^midibujo-/);
    const otra = buscar(escenaANodos(e, { prefijoIds: 'otro' }).nodos, 'linearGradient').map((n) => String(n.attrs.id));
    expect(otra.every((id) => !ids.includes(id))).toBe(true);
  });

  it('el texto de una forma sale como <text> dentro de la forma', () => {
    const [g] = escenaANodos(escena([forma('a', { texto: 'Hola & adiós' })])).nodos;
    const textos = buscar([g], 'text');
    expect(textos.map((t) => t.texto)).toEqual(['Hola & adiós']);
    expect(textos[0].attrs).toMatchObject({ 'text-anchor': 'middle', 'font-weight': 400 });
  });

  it('negrita, cursiva, subrayado, color y fuente del texto', () => {
    const [g] = escenaANodos(escena([forma('a', { texto: 'x', estiloTexto: { negrita: true, cursiva: true, subrayado: true, color: '#FF0000', fuente: 'Georgia', tamano: 20 } })])).nodos;
    expect(buscar([g], 'text')[0].attrs).toMatchObject({ 'font-weight': 700, 'font-style': 'italic', 'text-decoration': 'underline', fill: '#FF0000', 'font-family': 'Georgia' });
  });

  it('la alineación horizontal y vertical colocan el texto', () => {
    const y = (alineacionV: string) => buscar(escenaANodos(escena([forma('a', { texto: 'x', estiloTexto: { alineacionV } })])).nodos, 'text')[0].attrs.y as number;
    expect(y('arriba')).toBeLessThan(y('medio'));
    expect(y('medio')).toBeLessThan(y('abajo'));
    const x = (alineacionH: string) => buscar(escenaANodos(escena([forma('a', { texto: 'x', estiloTexto: { alineacionH } })])).nodos, 'text')[0];
    expect(x('izquierda').attrs['text-anchor']).toBe('start');
    expect(x('derecha').attrs['text-anchor']).toBe('end');
    expect(x('izquierda').attrs.x).toBeLessThan(x('centro').attrs.x as number);
    expect(x('centro').attrs.x).toBeLessThan(x('derecha').attrs.x as number);
  });

  it('un texto largo en una forma pequeña se reduce en vez de partir las palabras', () => {
    const tam = (texto: string) => buscar(escenaANodos(escena([forma('a', { transformacion: { x: 0, y: 0, ancho: 80, alto: 40 }, texto, estiloTexto: { tamano: 16 } })])).nodos, 'text').map((t) => t.attrs['font-size'] as number);
    expect(tam('Hola')[0]).toBe(16);
    expect(Math.max(...tam('Paralelogramo'))).toBeLessThan(16);
  });

  it('el elemento de texto dibuja su caja solo si tiene relleno o contorno', () => {
    const sin = escenaANodos(escena([{ tipo: 'texto', id: 't', texto: 'Hola' }])).nodos[0];
    expect(buscar([sin], 'rect')).toHaveLength(0);
    expect(buscar([sin], 'text')[0].texto).toBe('Hola');
    const con = escenaANodos(escena([{ tipo: 'texto', id: 't', texto: 'Hola', estilo: { relleno: { tipo: 'solido', color: '#FFFF00' } } }])).nodos[0];
    expect(buscar([con], 'rect')).toHaveLength(1);
  });

  it('el texto largo de un elemento de texto se parte en varias líneas sin reducirse', () => {
    const textos = buscar(escenaANodos(escena([{ tipo: 'texto', id: 't', texto: 'uno dos tres cuatro cinco seis siete', transformacion: { x: 0, y: 0, ancho: 90, alto: 40 }, estiloTexto: { tamano: 16 } }])).nodos, 'text');
    expect(textos.length).toBeGreaterThan(1);
    expect(new Set(textos.map((t) => t.attrs['font-size']))).toEqual(new Set([16]));
  });

  it('el nombre o la descripción pasan a <title> para lectores de pantalla (la descripción gana)', () => {
    const t = (extra: Record<string, unknown>) => buscar([escenaANodos(escena([forma('a', extra)])).nodos[0]], 'title').map((n) => n.texto);
    expect(t({})).toEqual([]);
    expect(t({ nombre: 'Decisión' })).toEqual(['Decisión']);
    expect(t({ nombre: 'Decisión', descripcion: 'Rombo de decisión' })).toEqual(['Rombo de decisión']);
  });

  it('dibuja las 21 formas sin error', () => {
    const e = escena(TIPOS_FORMA.map((f, i) => forma(`f${i}`, { forma: f, texto: f })));
    expect(escenaANodos(e).nodos).toHaveLength(TIPOS_FORMA.length);
  });
});

// ─── Puertos y líneas ─────────────────────────────────────────────────────────

describe('puntoDePuerto', () => {
  const f = (rotacion: number) => escena([forma('a', { forma: 'rombo', transformacion: { x: 100, y: 50, ancho: 200, alto: 100, rotacion } })]).elementos[0];
  const rombo = (rot: number) => f(rot) as Extract<Escena['elementos'][number], { tipo: 'forma' }>;

  it('sin rotación es la posición local más la de la forma', () => {
    expect(puntoDePuerto(rombo(0), 0)).toEqual({ x: 200, y: 50 });
    expect(puntoDePuerto(rombo(0), 1)).toEqual({ x: 300, y: 100 });
    expect(puntoDePuerto(rombo(0), 2)).toEqual({ x: 200, y: 150 });
    expect(puntoDePuerto(rombo(0), 3)).toEqual({ x: 100, y: 100 });
  });

  it('la rotación gira el puerto alrededor del centro de la forma', () => {
    const p = puntoDePuerto(rombo(90), 0); // el puerto de arriba pasa a la derecha
    expect(p.x).toBeCloseTo(250, 6);
    expect(p.y).toBeCloseTo(100, 6);
    const q = puntoDePuerto(rombo(180), 1);
    expect(q.x).toBeCloseTo(100, 6);
    expect(q.y).toBeCloseTo(100, 6);
  });

  it('un puerto inexistente cae al primero', () => {
    expect(puntoDePuerto(rombo(0), 99)).toEqual(puntoDePuerto(rombo(0), 0));
  });
});

describe('líneas', () => {
  const linea = (extra: Record<string, unknown> = {}) => ({ tipo: 'linea', id: 'l', puntos: [{ x: 0, y: 0 }, { x: 100, y: 50 }], ...extra });
  const grupo = (elementos: unknown[]) => buscar(escenaANodos(escena(elementos)).nodos, 'g').find((g) => g.attrs['data-elemento-id'] === 'l') as NodoSvg;

  it('sin conexiones usa sus propios puntos', () => {
    expect(buscar([grupo([linea({ fin: 'ninguno' })])], 'path')[0].attrs.d).toBe('M0,0 L100,50');
  });

  it('con conexiones los extremos son los puertos de las formas', () => {
    const e = [forma('a'), forma('b', { transformacion: { x: 400, y: 300, ancho: 100, alto: 100, rotacion: 0 } }), linea({ origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 }, fin: 'ninguno' })];
    expect(buscar([grupo(e)], 'path')[0].attrs.d).toBe('M300,100 L400,350');
  });

  it('una conexión a una forma oculta o inexistente conserva el punto propio', () => {
    const e = [linea({ origen: { elementoId: 'fantasma', puerto: 0 }, fin: 'ninguno' })];
    expect(buscar([grupo(e)], 'path')[0].attrs.d).toBe('M0,0 L100,50');
  });

  it('el trazado ortogonal hace un codo recto y el curvo usa una cúbica', () => {
    const d = (trazado: string) => buscar([grupo([linea({ trazado, fin: 'ninguno' })])], 'path')[0].attrs.d as string;
    expect(d('ortogonal')).toBe('M0,0 L50,0 L50,50 L100,50');
    expect(d('ortogonal')).not.toMatch(/[CQA]/);
    expect(d('curvo')).toBe('M0,0 C50,0 50,50 100,50');
  });

  it('el codo cambia de sentido si la línea es más vertical que horizontal', () => {
    const d = buscar([grupo([linea({ trazado: 'ortogonal', puntos: [{ x: 0, y: 0 }, { x: 20, y: 100 }], fin: 'ninguno' })])], 'path')[0].attrs.d;
    expect(d).toBe('M0,0 L0,50 L20,50 L20,100');
  });

  it('una línea curva con varios puntos pasa por todos', () => {
    const d = buscar([grupo([linea({ trazado: 'curvo', puntos: [{ x: 0, y: 0 }, { x: 50, y: 80 }, { x: 100, y: 0 }], fin: 'ninguno' })])], 'path')[0].attrs.d as string;
    expect(d.match(/C/g)).toHaveLength(2);
    expect(d).toContain('50,80');
    expect(d.endsWith('100,0')).toBe(true);
  });

  it.each([
    ['ninguno', 0, 0],
    ['flecha', 1, 0],
    ['flecha-abierta', 0, 1],
    ['circulo', 0, 0],
    ['rombo', 1, 0],
  ])('el extremo %s dibuja su marca', (tipo, poligonos, abiertos) => {
    const g = grupo([linea({ fin: tipo })]);
    expect(buscar([g], 'polygon')).toHaveLength(poligonos);
    expect(buscar([g], 'path')).toHaveLength(1 + abiertos);
    expect(buscar([g], 'circle')).toHaveLength(tipo === 'circulo' ? 1 : 0);
  });

  it('por defecto una línea lleva flecha al final y nada al inicio', () => {
    const g = grupo([linea()]);
    expect(buscar([g], 'polygon')).toHaveLength(1);
  });

  it('una flecha en cada extremo da dos marcas', () => {
    expect(buscar([grupo([linea({ inicio: 'flecha', fin: 'flecha' })])], 'polygon')).toHaveLength(2);
  });

  it('la punta de la flecha coincide con el extremo de la línea', () => {
    const [flecha] = buscar([grupo([linea({ fin: 'flecha' })])], 'polygon');
    expect(String(flecha.attrs.points).startsWith('100,50 ')).toBe(true);
  });

  it('una etiqueta dibuja su fondo y su texto en el punto medio', () => {
    const g = grupo([linea({ texto: 'Sí', fin: 'ninguno', trazado: 'recto' })]);
    expect(buscar([g], 'text').map((t) => t.texto)).toEqual(['Sí']);
    const [fondo] = buscar([g], 'rect');
    const centroX = (fondo.attrs.x as number) + (fondo.attrs.width as number) / 2;
    expect(centroX).toBeCloseTo(50, 0);
  });

  it('el estilo del trazo se aplica: color, grosor y guiones', () => {
    const [path] = buscar([grupo([linea({ fin: 'ninguno', estilo: { contorno: { color: '#DC2626', grosor: 4, patron: 'guiones' } } })])], 'path');
    expect(path.attrs).toMatchObject({ fill: 'none', stroke: '#DC2626', 'stroke-width': 4, 'stroke-dasharray': '12 8', 'stroke-linecap': 'round' });
  });

  it('un grosor de 0 se dibuja con 1 (una línea invisible no tiene sentido)', () => {
    const [path] = buscar([grupo([linea({ fin: 'ninguno', estilo: { contorno: { grosor: 0 } } })])], 'path');
    expect(path.attrs['stroke-width']).toBe(1);
  });
});

// ─── Documento SVG ────────────────────────────────────────────────────────────

describe('escenaASvg', () => {
  const completa = escena([forma('a', { texto: 'A & B < C', estilo: { relleno: { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 45 }, sombra: { color: '#00000040' } } }), forma('b', { nombre: 'Segunda "forma"' }), { tipo: 'linea', id: 'l', puntos: [{ x: 0, y: 0 }, { x: 5, y: 5 }], origen: { elementoId: 'a', puerto: 1 }, destino: { elementoId: 'b', puerto: 3 }, texto: 'a<b' }, { tipo: 'texto', id: 't', texto: '<script>alert(1)</script>' }], { fondo: '#FFFFFF' });

  it('es un SVG bien formado con las medidas de la escena', () => {
    const { svg, ancho, alto } = escenaASvg(completa, { modo: 'claro' });
    expect(bienFormado(svg)).toBe(true);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain(`width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"`);
    expect(svg).toContain('role="img"');
  });

  it('escapa el texto y no deja pasar etiquetas', () => {
    const { svg } = escenaASvg(completa, { modo: 'claro', titulo: '<b>x</b>', descripcion: 'a & b' });
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<b>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('<title>&lt;b&gt;x&lt;/b&gt;</title>');
    expect(svg).toContain('<desc>a &amp; b</desc>');
    expect(bienFormado(svg)).toBe(true);
  });

  it('el título por defecto es «Dibujo» y sin descripción no hay <desc>', () => {
    const { svg } = escenaASvg(escena([]));
    expect(svg).toContain('<title>Dibujo</title>');
    expect(svg).not.toContain('<desc>');
  });

  it('con tema claro u oscuro el archivo no depende de variables CSS y trae su tipografía', () => {
    for (const modo of ['claro', 'oscuro'] as const) {
      const { svg } = escenaASvg(completa, { modo });
      expect(svg).not.toContain('var(');
      expect(svg).toContain('font-family=');
    }
    expect(escenaASvg(completa, { modo: 'css' }).svg).not.toContain('font-family="system-ui');
  });

  it('tantos grupos de elemento como elementos visibles', () => {
    const { svg } = escenaASvg(completa, { modo: 'claro' });
    expect(svg.match(/data-elemento-id=/g)).toHaveLength(4);
  });

  it('es determinista: la misma escena da el mismo archivo', () => {
    expect(escenaASvg(completa, { modo: 'claro' }).svg).toBe(escenaASvg(completa, { modo: 'claro' }).svg);
  });

  it('formato exacto de una escena mínima', () => {
    const e = escena([forma('a', { transformacion: { x: 0, y: 0, ancho: 10, alto: 10, rotacion: 0 }, estilo: { relleno: { tipo: 'solido', color: '#FFFFFF' }, contorno: { color: '#000000', grosor: 1 } } })], { ancho: 100, alto: 100 });
    expect(escenaASvg(e, { modo: 'claro' }).svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" role="img" font-family="system-ui, -apple-system, &quot;Segoe UI&quot;, Roboto, sans-serif">' +
        '<title>Dibujo</title>' +
        '<g data-elemento-id="a" transform="translate(0 0)"><path d="M0,0 L10,0 L10,10 L0,10 Z" fill="#FFFFFF" stroke="#000000" stroke-width="1" stroke-linejoin="round"/></g>' +
        '</svg>',
    );
  });

  it('2000 elementos se dibujan sin demorar', () => {
    const muchos = escena(Array.from({ length: 2000 }, (_, i) => forma(`f${i}`, { forma: TIPOS_FORMA[i % TIPOS_FORMA.length], texto: `Forma ${i}` })));
    const inicio = performance.now();
    const { svg } = escenaASvg(muchos, { modo: 'claro' });
    expect(performance.now() - inicio).toBeLessThan(2500);
    expect(bienFormado(svg)).toBe(true);
  });
});
