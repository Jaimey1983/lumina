import { describe, expect, it } from 'vitest';
import type {
  AbrirCajaActivity,
  Activity,
  AhorcadoActivity,
  AnagramaActivity,
  ClasificarActivity,
  CrucigramaActivity,
  DragDrop,
  MatchPairs,
  MemoriaActivity,
  OrderSteps,
  PuzzlePalabrasActivity,
  RuletaActivity,
  SopaLetrasActivity,
  WordCloud,
} from '@lumina/types/slide';

import { createDefaultAbrirCaja } from '../../abrir-caja/abrir-caja-defaults.js';
import { createDefaultAhorcado } from '../../ahorcado/ahorcado-defaults.js';
import { createDefaultAnagrama } from '../../anagrama/anagrama-defaults.js';
import { createDefaultClasificar } from '../../clasificar/clasificar-defaults.js';
import { createDefaultCrucigrama } from '../../crucigrama/crucigrama-defaults.js';
import { createDefaultMemoria } from '../../memoria/memoria-defaults.js';
import { createDefaultPuzzlePalabras } from '../../puzzle-palabras/puzzle-palabras-defaults.js';
import { createDefaultSopaLetras } from '../../sopa-letras/sopa-letras-defaults.js';
import { dragDropTemplate, matchPairsTemplate, orderStepsTemplate, wordCloudTemplate } from '../../_classic/activity-templates.js';
import { importadorDe, importarTexto, tiposImportables } from './importadores.js';
import { validarActividad } from './validacion.js';

const nueva = <A,>(f: () => unknown): A => structuredClone(f()) as A;
const ruleta = (): RuletaActivity => ({
  tipo: 'ruleta',
  configuracion: { colores: ['#fff'], sonido: true, duracionGiro: 3000, mostrarGanador: true },
  items: [{ id: 'a', texto: 'Uno' }, { id: 'b', texto: 'Dos' }],
});

describe('cobertura de importadores', () => {
  it('hay importador para los 20 tipos con contenido en lista', () => {
    expect(tiposImportables()).toHaveLength(20);
  });
  it('el ejemplo de cada importador de listas se lee entero y deja una actividad sin errores', () => {
    const bases: Record<string, Activity> = {
      emparejar: nueva(matchPairsTemplate),
      memoria: nueva(createDefaultMemoria),
      ordenar_pasos: nueva(orderStepsTemplate),
      ruleta: ruleta(),
      nube_palabras: nueva(wordCloudTemplate),
      sopa_letras: nueva(createDefaultSopaLetras),
      anagrama: nueva(createDefaultAnagrama),
      puzzle_palabras: nueva(createDefaultPuzzlePalabras),
      crucigrama: nueva(createDefaultCrucigrama),
      ahorcado: nueva(createDefaultAhorcado),
      clasificar: nueva(createDefaultClasificar),
      arrastrar_soltar: nueva(dragDropTemplate),
      abrir_caja: nueva(createDefaultAbrirCaja),
    };
    for (const [tipo, base] of Object.entries(bases)) {
      const imp = importadorDe(tipo as never)!;
      expect(imp.formato.length, tipo).toBeGreaterThan(10);
      const r = importarTexto(base, imp.ejemplo, 'reemplazar');
      expect(r.descartadas, tipo).toEqual([]);
      expect(r.leidas, tipo).toBeGreaterThan(0);
      expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error'), tipo).toEqual([]);
    }
  });
});

describe('pares: emparejar y memoria', () => {
  it('emparejar: pares con los dos lados; respeta el máximo de 8', () => {
    const a = nueva<MatchPairs>(matchPairsTemplate);
    const filas = Array.from({ length: 10 }, (_, i) => `L${i};R${i}`).join('\n');
    const r = importarTexto(a, `Izquierda;Derecha\n${filas}\nsolo izquierda;`, 'reemplazar');
    expect(r.actividad.pares).toHaveLength(8);
    expect(r.actividad.pares[0]).toMatchObject({ izquierda: { texto: 'L0' }, derecha: { texto: 'R0' } });
    expect(r.leidas).toBe(8);
    expect(r.descartadas.map((d) => d.motivo)).toEqual(['Se superó el máximo de 8.', 'Se superó el máximo de 8.', 'Cada par necesita los dos lados.']);
  });
  it('emparejar en modo agregar cuenta los pares que ya había contra el máximo', () => {
    const a = nueva<MatchPairs>(matchPairsTemplate);
    const hay = a.pares.length;
    const r = importarTexto(a, Array.from({ length: 10 }, (_, i) => `x${i};y${i}`).join('\n'), 'agregar');
    expect(r.actividad.pares).toHaveLength(8);
    expect(r.leidas).toBe(8 - hay);
  });
  it('memoria: pares de cartas con emoji, tildes y Ñ', () => {
    const r = importarTexto(nueva<MemoriaActivity>(createDefaultMemoria), 'Carta 1;Carta 2\nÑandú;🦤\nniño;boy', 'reemplazar');
    expect(r.actividad.pares.map((p) => [p.lado1.texto, p.lado2.texto])).toEqual([['Ñandú', '🦤'], ['niño', 'boy']]);
    expect(r.actividad.configuracion).toEqual(createDefaultMemoria().configuracion);
  });
});

describe('ordenar_pasos', () => {
  it('numera 1..n en el orden pegado', () => {
    const r = importarTexto(nueva<OrderSteps>(orderStepsTemplate), 'Paso\nA\nB\nC', 'reemplazar');
    expect(r.actividad.pasos.map((p) => [p.contenido, p.ordenCorrecto])).toEqual([['A', 1], ['B', 2], ['C', 3]]);
  });
  it('agregar deja lo viejo primero (por su orden) y renumera', () => {
    const a = nueva<OrderSteps>(orderStepsTemplate);
    a.pasos = [{ id: 'x', contenido: 'Segundo', ordenCorrecto: 5 }, { id: 'y', contenido: 'Primero', ordenCorrecto: 2 }];
    const r = importarTexto(a, 'Tercero', 'agregar').actividad;
    expect(r.pasos.map((p) => [p.contenido, p.ordenCorrecto])).toEqual([['Primero', 1], ['Segundo', 2], ['Tercero', 3]]);
  });
});

describe('ruleta y nube de palabras', () => {
  it('ruleta: hasta 12; repetidas se descartan', () => {
    const r = importarTexto(ruleta(), 'Opciones\n' + Array.from({ length: 12 }, (_, i) => `n${i}`).join('\n') + '\nuno\nN3', 'agregar');
    expect(r.actividad.items).toHaveLength(12);
    expect(r.descartadas.map((d) => d.motivo)).toContain('Ya está en la lista.');
    expect(r.descartadas.map((d) => d.motivo)).toContain('Se superó el máximo de 12.');
  });
  it('nube: palabras iniciales sin repetir (ignora mayúsculas)', () => {
    const r = importarTexto(nueva<WordCloud>(wordCloudTemplate), 'Agua\nagua\nEnergía', 'reemplazar');
    expect(r.actividad.palabrasIniciales).toEqual(['Agua', 'Energía']);
    expect(r.descartadas).toEqual([{ fila: 2, motivo: 'Ya está en la lista.', texto: 'agua' }]);
  });
});

describe('juegos de palabras', () => {
  it('sopa: guarda en mayúsculas como el editor, con pista opcional, y descarta lo injugable y repetido', () => {
    const a = { ...nueva<SopaLetrasActivity>(createDefaultSopaLetras), grid: [['A']] };
    const r = importarTexto(a, 'volcán;Montaña\n123\nVOLCAN\nniño', 'reemplazar');
    expect(r.actividad.palabras).toEqual([{ texto: 'VOLCÁN', pista: 'Montaña' }, { texto: 'NIÑO' }]);
    expect(r.actividad.grid).toBeUndefined();
    expect(r.descartadas.map((d) => d.motivo)).toEqual(['No tiene letras jugables.', 'Ya está en la lista.']);
    expect(r.actividad.configuracion).toEqual(a.configuracion);
  });
  it('anagrama: palabra y pista', () => {
    const r = importarTexto(nueva<AnagramaActivity>(createDefaultAnagrama), 'mariposa;Insecto\ncasa', 'reemplazar');
    expect(r.actividad.palabras).toEqual([{ texto: 'MARIPOSA', pista: 'Insecto' }, { texto: 'CASA' }]);
  });
  it('puzzle de palabras: oraciones de al menos 2 palabras, tal como se escriben', () => {
    const r = importarTexto(nueva<PuzzlePalabrasActivity>(createDefaultPuzzlePalabras), 'Oración;Pista\nEl sol sale;Amanecer\nHola', 'reemplazar');
    expect(r.actividad.oraciones).toEqual([{ texto: 'El sol sale', pista: 'Amanecer' }]);
    expect(r.descartadas[0]!.motivo).toBe('Necesita al menos 2 palabras para tener algo que ordenar.');
  });
  it('sopa y anagrama respetan el máximo de 20', () => {
    const filas = Array.from({ length: 22 }, (_, i) => `palabra${String.fromCharCode(97 + (i % 26))}${'x'.repeat(i)}`).join('\n');
    const a = importarTexto(nueva<AnagramaActivity>(createDefaultAnagrama), filas, 'reemplazar');
    expect(a.actividad.palabras).toHaveLength(20);
    expect(a.descartadas).toHaveLength(2);
  });
  it('ahorcado: usa la primera fila, normaliza la palabra y limpia la pista anterior si no viene', () => {
    const base = nueva<AhorcadoActivity>(createDefaultAhorcado);
    base.configuracion.pista = 'vieja';
    const r = importarTexto(base, 'Palabra;Pista;Categoría\nmurciélago;Mamífero que vuela;Animales\notra', 'reemplazar');
    expect(r.actividad.configuracion).toMatchObject({ palabra: 'MURCIELAGO', pista: 'Mamífero que vuela', categoria: 'Animales', maxIntentos: base.configuracion.maxIntentos });
    expect(r.descartadas.map((d) => d.fila)).toEqual([3]);
    const r2 = importarTexto(base, 'niño', 'reemplazar');
    expect(r2.actividad.configuracion.palabra).toBe('NIÑO');
    expect(r2.actividad.configuracion.pista).toBeUndefined();
  });
  it('ahorcado: fila sin letras jugables se descarta y no cambia nada', () => {
    const base = nueva<AhorcadoActivity>(createDefaultAhorcado);
    const r = importarTexto(base, '12345', 'reemplazar');
    expect(r.leidas).toBe(0);
    expect(r.actividad).toEqual(base);
  });
  it('crucigrama: palabras en filas separadas, sin choques, y las nuevas van debajo de las que ya había', () => {
    const base = nueva<CrucigramaActivity>(createDefaultCrucigrama);
    const r = importarTexto(base, 'sol;Estrella\nluna;Satélite', 'reemplazar');
    expect(r.actividad.palabras.map((p) => [p.texto, p.fila, p.columna, p.direccion])).toEqual([
      ['SOL', 0, 0, 'horizontal'],
      ['LUNA', 2, 0, 'horizontal'],
    ]);
    expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error')).toEqual([]);
    const mas = importarTexto(r.actividad, 'mar;Agua salada', 'agregar').actividad;
    expect(mas.palabras.at(-1)).toMatchObject({ texto: 'MAR', fila: 4 });
    expect(mas.palabras.slice(0, 2)).toEqual(r.actividad.palabras);
  });
});

describe('categorías: clasificar y arrastrar y soltar', () => {
  it('clasificar crea las categorías y reparte los elementos (ignora acentos al reconocerlas)', () => {
    const r = importarTexto(nueva<ClasificarActivity>(createDefaultClasificar), 'Elemento;Categoría\nPerro;Mamíferos\nÁguila;Aves\nGato;mamiferos', 'reemplazar');
    expect(r.actividad.categorias.map((c) => c.nombre)).toEqual(['Mamíferos', 'Aves']);
    const porId = new Map(r.actividad.categorias.map((c) => [c.id, c.nombre]));
    expect(r.actividad.items.map((i) => [i.texto, porId.get(i.categoriaId)])).toEqual([
      ['Perro', 'Mamíferos'],
      ['Águila', 'Aves'],
      ['Gato', 'Mamíferos'],
    ]);
    expect(r.actividad.configuracion).toEqual(createDefaultClasificar().configuracion);
  });
  it('clasificar: máximo 4 categorías y 24 elementos', () => {
    const cinco = ['a', 'b', 'c', 'd', 'e'].map((c, i) => `x${i};cat ${c}`).join('\n');
    const r = importarTexto(nueva<ClasificarActivity>(createDefaultClasificar), cinco, 'reemplazar');
    expect(r.actividad.categorias).toHaveLength(4);
    expect(r.descartadas[0]!.motivo).toBe('Superaría las 4 categorías.');
    const muchos = Array.from({ length: 26 }, (_, i) => `e${i};una`).join('\n');
    const m = importarTexto(nueva<ClasificarActivity>(createDefaultClasificar), muchos, 'reemplazar');
    expect(m.actividad.items).toHaveLength(24);
    expect(m.descartadas).toHaveLength(2);
  });
  it('clasificar en modo agregar reutiliza las categorías existentes por nombre', () => {
    const base = nueva<ClasificarActivity>(createDefaultClasificar);
    const nombre = base.categorias[0]!.nombre;
    const r = importarTexto(base, `Nuevo;${nombre.toUpperCase()}`, 'agregar');
    expect(r.actividad.categorias).toEqual(base.categorias);
    expect(r.actividad.items.at(-1)).toMatchObject({ texto: 'Nuevo', categoriaId: base.categorias[0]!.id });
  });
  it('arrastrar y soltar: zonas e ids consistentes', () => {
    const r = importarTexto(nueva<DragDrop>(dragDropTemplate), 'Perro;Animales\nRoble;Plantas\nGato;animales\nincompleta', 'reemplazar');
    expect(r.actividad.zonas.map((z) => z.etiqueta)).toEqual(['Animales', 'Plantas']);
    const texto = new Map(r.actividad.items.map((i) => [i.id, i.texto]));
    expect(r.actividad.zonas.map((z) => z.itemsCorrectos.map((id) => texto.get(id)))).toEqual([['Perro', 'Gato'], ['Roble']]);
    expect(r.descartadas).toHaveLength(1);
    expect(validarActividad(r.actividad).filter((p) => p.nivel === 'error')).toEqual([]);
  });
  it('arrastrar y soltar en modo agregar no cambia las zonas anteriores salvo la que recibe el elemento', () => {
    const a = nueva<DragDrop>(dragDropTemplate);
    const copia = structuredClone(a);
    const r = importarTexto(a, `Nuevo;${a.zonas[1]!.etiqueta}`, 'agregar').actividad;
    expect(a).toEqual(copia);
    expect(r.zonas[0]).toEqual(copia.zonas[0]);
    expect(r.zonas[1]!.itemsCorrectos).toHaveLength(copia.zonas[1]!.itemsCorrectos.length + 1);
  });
});

describe('abrir_caja', () => {
  it('etiqueta, contenido y correcta opcional', () => {
    const r = importarTexto(nueva<AbrirCajaActivity>(createDefaultAbrirCaja), 'Etiqueta;Contenido;Correcta\nCaja 1;Bogotá;*\nCaja 2;Lima;no\nCaja 3;Un dato\nCaja 4;', 'reemplazar');
    expect(r.actividad.cajas.map((c) => [c.etiqueta, c.contenido.texto, c.contenido.esCorrecta])).toEqual([
      ['Caja 1', 'Bogotá', true],
      ['Caja 2', 'Lima', false],
      ['Caja 3', 'Un dato', undefined],
    ]);
    expect('esCorrecta' in r.actividad.cajas[2]!.contenido).toBe(false);
    expect(r.descartadas[0]!.motivo).toBe('La caja necesita contenido.');
  });
  it('máximo 12 cajas', () => {
    const r = importarTexto(nueva<AbrirCajaActivity>(createDefaultAbrirCaja), Array.from({ length: 14 }, (_, i) => `c${i};t${i}`).join('\n'), 'reemplazar');
    expect(r.actividad.cajas).toHaveLength(12);
    expect(r.descartadas).toHaveLength(2);
  });
});
