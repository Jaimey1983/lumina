import { describe, expect, it } from 'vitest';
import type {
  AbrirCajaActivity,
  Activity,
  AhorcadoActivity,
  AnagramaActivity,
  ClasificarActivity,
  CrucigramaActivity,
  EscapeRoomActivity,
  GlobosActivity,
  HistoriaRamificadaActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  PuzzlePalabrasActivity,
  RuletaActivity,
  SopaLetrasActivity,
  TopoActivity,
  TorneoActivity,
} from '@lumina/types/slide';

import { createDefaultAbrirCaja } from '../../abrir-caja/abrir-caja-defaults.js';
import { createDefaultAhorcado } from '../../ahorcado/ahorcado-defaults.js';
import { createDefaultAnagrama } from '../../anagrama/anagrama-defaults.js';
import { createDefaultClasificar } from '../../clasificar/clasificar-defaults.js';
import { createDefaultCrucigrama } from '../../crucigrama/crucigrama-defaults.js';
import { createDefaultEscapeRoom } from '../../escape-room/escape-room-defaults.js';
import { createDefaultGlobos } from '../../globos/globos-defaults.js';
import { createDefaultHistoriaRamificada } from '../../historia-ramificada/historia-ramificada-defaults.js';
import { createDefaultMemoria } from '../../memoria/memoria-defaults.js';
import { createDefaultPuzzleImagen } from '../../puzzle-imagen/puzzle-imagen-defaults.js';
import { createDefaultPuzzlePalabras } from '../../puzzle-palabras/puzzle-palabras-defaults.js';
import { createDefaultSopaLetras } from '../../sopa-letras/sopa-letras-defaults.js';
import { createDefaultTopo } from '../../topo/topo-defaults.js';
import { createDefaultTorneo } from '../../torneo/torneo-defaults.js';
import { tiposValidables, validarActividad } from './validacion.js';

const errores = (a: Activity) => validarActividad(a).filter((p) => p.nivel === 'error').map((p) => p.mensaje);
const avisos = (a: Activity) => validarActividad(a).filter((p) => p.nivel === 'aviso').map((p) => p.mensaje);
const nueva = <A extends Activity>(f: () => Activity): A => structuredClone(f()) as A;

describe('Grupo 4 — despacho y valores por defecto', () => {
  it('cubre las 34 actividades', () => {
    expect(tiposValidables().sort()).toEqual(
      [
        'quiz_multiple', 'verdadero_falso', 'short_answer', 'respuesta_matematica', 'completar_blancos',
        'arrastrar_soltar', 'emparejar', 'ordenar_pasos', 'video_interactivo', 'encuesta_viva', 'nube_palabras',
        'balancear_ecuacion', 'ubicar_elemento', 'formular_compuesto', 'clasificar', 'memoria', 'puzzle_imagen',
        'sopa_letras', 'crucigrama', 'anagrama', 'ahorcado', 'puzzle_palabras', 'abrir_caja', 'globos', 'topo',
        'historia_ramificada', 'ruleta', 'torneo', 'escape_room', 'relacionar_lineas', 'problema_pasos', 'etiquetar_imagen', 'linea_tiempo', 'cloze_banco',
      ].sort(),
    );
  });
  it('lo que el editor crea por defecto no tiene errores (se puede jugar al instante)', () => {
    const defaults: Activity[] = [
      createDefaultClasificar(), createDefaultMemoria(), createDefaultSopaLetras(), createDefaultCrucigrama(),
      createDefaultAnagrama(), createDefaultAhorcado(), createDefaultPuzzlePalabras(), createDefaultAbrirCaja(),
      createDefaultGlobos(), createDefaultTopo(), createDefaultTorneo(),
      createDefaultEscapeRoom(),
    ] as Activity[];
    for (const d of defaults) expect(errores(d), d.tipo).toEqual([]);
  });
  it('hallazgo: la historia de ejemplo trae la opción «Puerta azul» sin destino, y la validación lo señala', () => {
    expect(errores(createDefaultHistoriaRamificada())).toEqual(['La opción «Puerta azul» no lleva a ningún nodo.']);
  });
  it('un puzzle de imagen nuevo nace sin imagen y lo avisa', () => {
    expect(errores(nueva<PuzzleImagenActivity>(createDefaultPuzzleImagen))).toEqual(['Falta la imagen del puzzle.']);
  });
});

describe('clasificar', () => {
  it('categorías y elementos', () => {
    const a = nueva<ClasificarActivity>(createDefaultClasificar);
    a.categorias = [{ id: 'c1', nombre: '' }];
    a.items = [{ id: 'i1', texto: '', categoriaId: 'nada' }];
    const e = errores(a);
    expect(e).toContain('Necesita al menos 2 categorías.');
    expect(e).toContain('La categoría no tiene nombre.');
    expect(e).toContain('No tiene texto ni imagen.');
    expect(e).toContain('Su categoría correcta no existe.');
    a.items = [];
    expect(errores(a)).toContain('No tiene elementos para clasificar.');
  });
  it('categoría sin elementos y pocos elementos son avisos', () => {
    const a = nueva<ClasificarActivity>(createDefaultClasificar);
    a.categorias = [{ id: 'c1', nombre: 'A' }, { id: 'c2', nombre: 'B' }];
    a.items = [{ id: 'i1', texto: 'x', categoriaId: 'c1' }];
    expect(errores(a)).toEqual([]);
    expect(avisos(a)).toContain('La categoría «B» no tiene ningún elemento.');
    expect(avisos(a).some((m) => m.startsWith('Con menos de'))).toBe(true);
  });
});

describe('memoria', () => {
  it('pares insuficientes, carta vacía, cartas iguales', () => {
    const a = nueva<MemoriaActivity>(createDefaultMemoria);
    a.pares = [{ id: 'p1', lado1: { texto: 'A' }, lado2: {} }];
    expect(errores(a)).toEqual(['Necesita al menos 2 pares.', 'Tiene una carta vacía.']);
    a.pares = [
      { id: 'p1', lado1: { texto: 'Sol' }, lado2: { texto: 'sol' } },
      { id: 'p2', lado1: { texto: 'A' }, lado2: { imagen: 'a.png' } },
    ];
    expect(errores(a)).toEqual([]);
    expect(avisos(a)).toEqual(['Las dos cartas dicen lo mismo.']);
  });
});

describe('sopa_letras', () => {
  const base = () => {
    const a = nueva<SopaLetrasActivity>(createDefaultSopaLetras);
    a.configuracion.filas = 10;
    a.configuracion.columnas = 10;
    a.configuracion.direcciones = ['horizontal', 'vertical'];
    a.palabras = [{ texto: 'casa' }, { texto: 'perro' }, { texto: 'niño' }];
    return a;
  };
  it('una sopa bien armada no tiene problemas', () => {
    expect(validarActividad(base())).toEqual([]);
  });
  it('sin palabras, sin direcciones y palabra que no cabe', () => {
    const a = base();
    a.palabras = [{ texto: 'electroencefalografista' }, { texto: '1234' }, { texto: 'sol' }];
    a.configuracion.direcciones = [];
    const e = errores(a);
    expect(e).toContain('No hay ninguna dirección permitida para las palabras.');
    expect(e).toContain('«ELECTROENCEFALOGRAFISTA» no cabe en la grilla (tiene 23 letras).');
    expect(e).toContain('No tiene letras jugables.');
    a.palabras = [];
    expect(errores(a)).toContain('No tiene palabras.');
  });
  it('la Ñ cuenta como letra; grilla demasiado llena y palabras repetidas', () => {
    const a = base();
    a.configuracion.filas = 10;
    a.configuracion.columnas = 10;
    a.palabras = Array.from({ length: 7 }, (_, i) => ({ texto: 'abcdefghi'.slice(0, 9) + i }));
    a.palabras = a.palabras.map((p, i) => ({ texto: `PALABRAÑ${'X'.repeat(i)}` }));
    expect(avisos(a)).toContain('La grilla queda muy llena: puede que alguna palabra no se pueda colocar.');
    a.palabras = [{ texto: 'sol' }, { texto: 'SOL' }, { texto: 'luz' }];
    expect(avisos(a)).toContain('Palabras repetidas: SOL.');
    a.configuracion.filas = 3;
    expect(avisos(a).some((m) => m.startsWith('La grilla debe medir'))).toBe(true);
  });
});

describe('crucigrama', () => {
  const pal = (id: string, texto: string, direccion: 'horizontal' | 'vertical', fila: number, columna: number) => ({
    id, texto, pista: 'p', direccion, fila, columna,
  });
  it('cruce correcto: sin problemas', () => {
    const a = nueva<CrucigramaActivity>(createDefaultCrucigrama);
    a.palabras = [pal('a', 'SOL', 'horizontal', 0, 0), pal('b', 'SAL', 'vertical', 0, 0)];
    expect(validarActividad(a)).toEqual([]);
  });
  it('letras que chocan y palabras que no se cruzan', () => {
    const a = nueva<CrucigramaActivity>(createDefaultCrucigrama);
    a.palabras = [pal('a', 'SOL', 'horizontal', 0, 0), pal('b', 'RIO', 'vertical', 0, 0)];
    expect(errores(a)).toEqual(['Dos palabras exigen letras distintas (S / R) en la fila 1, columna 1.']);
    a.palabras = [pal('a', 'SOL', 'horizontal', 0, 0), pal('b', 'SAL', 'vertical', 5, 5)];
    expect(avisos(a)).toEqual(['Las palabras no se cruzan en ningún punto.']);
  });
  it('vacía, sin texto, sin pista, fuera del tablero e ids repetidos', () => {
    const a = nueva<CrucigramaActivity>(createDefaultCrucigrama);
    a.palabras = [];
    expect(errores(a)).toEqual(['No tiene palabras.']);
    a.palabras = [{ ...pal('a', '', 'horizontal', -1, 0), pista: '' }, pal('a', 'SOL', 'horizontal', 0, 0)];
    const e = errores(a);
    expect(e).toContain('No tiene texto.');
    expect(e).toContain('Está fuera del tablero (fila o columna negativa).');
    expect(e).toContain('Hay palabras con el mismo identificador.');
    expect(avisos(a)).toContain('Sin pista.');
  });
});

describe('anagrama, ahorcado y puzzle_palabras', () => {
  it('anagrama: sin letras, una letra, letras iguales y pista faltante', () => {
    const a = nueva<AnagramaActivity>(createDefaultAnagrama);
    a.configuracion.mostrarPista = true;
    a.palabras = [{ texto: '123' }, { texto: 'a', pista: 'x' }, { texto: 'aaa', pista: 'x' }, { texto: 'sol' }];
    expect(errores(a)).toEqual(['No tiene letras jugables.']);
    expect(avisos(a)).toEqual([
      'Se muestran pistas pero esta palabra no tiene.',
      'No hay otro orden posible para sus letras.',
      'No hay otro orden posible para sus letras.',
      'Se muestran pistas pero esta palabra no tiene.',
    ]);
    a.palabras = [];
    expect(errores(a)).toEqual(['No tiene palabras.']);
  });
  it('ahorcado: sin letras, signos que se quitan e intentos fuera de rango', () => {
    const a = nueva<AhorcadoActivity>(createDefaultAhorcado);
    a.configuracion.palabra = '123';
    expect(errores(a)).toEqual(['La palabra no tiene letras jugables.']);
    a.configuracion.palabra = 'MURCIELAGO2';
    a.configuracion.maxIntentos = 2;
    expect(errores(a)).toEqual([]);
    expect(avisos(a)).toEqual(['Se quitarán tildes, números o signos al jugar.', 'Los intentos deben estar entre 4 y 10.']);
    a.configuracion.palabra = 'NIÑO';
    a.configuracion.maxIntentos = 6;
    expect(validarActividad(a)).toEqual([]);
  });
  it('puzzle_palabras: oración de una palabra y pista faltante', () => {
    const a = nueva<PuzzlePalabrasActivity>(createDefaultPuzzlePalabras);
    a.configuracion.mostrarPista = true;
    a.oraciones = [{ texto: 'Hola', pista: 'x' }, { texto: 'El sol brilla' }];
    expect(errores(a)).toEqual(['Necesita al menos 2 palabras para tener algo que ordenar.']);
    expect(avisos(a)).toEqual(['Se muestran pistas pero esta oración no tiene.']);
    a.oraciones = [];
    expect(errores(a)).toEqual(['No tiene oraciones.']);
  });
});

describe('abrir_caja', () => {
  it('pocas cajas, cuadrícula chica, caja vacía y ninguna correcta', () => {
    const a = nueva<AbrirCajaActivity>(createDefaultAbrirCaja);
    a.configuracion.filas = 2;
    a.configuracion.columnas = 2;
    a.cajas = [{ id: 'c1', etiqueta: '1', contenido: {} }];
    expect(errores(a)).toEqual(['Necesita al menos 2 cajas.', 'La caja está vacía por dentro.']);
    a.cajas = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, etiqueta: `${i}`, contenido: { texto: 'x', esCorrecta: false } }));
    expect(errores(a)).toEqual(['Hay 5 cajas pero la cuadrícula solo tiene 4 lugares.']);
    expect(avisos(a)).toEqual(['Ninguna caja está marcada como correcta.']);
  });
});

describe('globos y topo', () => {
  const preg = (n: number, correcta: boolean) => ({
    id: 'q',
    enunciado: '¿?',
    opciones: Array.from({ length: n }, (_, i) => ({ texto: `o${i}`, correcta: correcta && i === 0 })),
  });
  it('globos: sin preguntas, pocas opciones, sin correcta y sin vidas', () => {
    const a = nueva<GlobosActivity>(createDefaultGlobos);
    a.preguntas = [];
    expect(errores(a)).toEqual(['No tiene preguntas.']);
    a.preguntas = [{ ...preg(2, false), enunciado: '' }];
    a.configuracion.vidas = 0;
    const e = errores(a);
    expect(e).toContain('Falta el enunciado.');
    expect(e).toContain('Necesita al menos 3 opciones.');
    expect(e).toContain('Ninguna opción está marcada como correcta.');
    expect(e).toContain('Debe haber al menos 1 vida.');
  });
  it('topo: más opciones que huecos es un error; con espacio no', () => {
    const a = nueva<TopoActivity>(createDefaultTopo);
    a.configuracion.filas = 2;
    a.configuracion.columnas = 3;
    a.preguntas = [preg(7, true)];
    expect(errores(a)).toEqual(['Tiene 7 opciones pero la cuadrícula solo tiene 6 huecos.']);
    a.preguntas = [preg(4, true)];
    expect(validarActividad(a)).toEqual([]);
    a.preguntas = [{ ...preg(3, true), opciones: [{ texto: '', correcta: true }, { texto: 'b', correcta: false }] }];
    expect(avisos(a)).toEqual(['Hay opciones sin texto.']);
  });
});

describe('historia_ramificada', () => {
  const nodo = (id: string, tipo: HistoriaRamificadaActivity['nodos'][number]['tipo'], opciones?: { id: string; texto: string }[]) => ({
    id, tipo, titulo: id, contenido: { texto: id }, opciones, editorX: 0, editorY: 0,
  });
  const base = (): HistoriaRamificadaActivity => ({
    ...nueva<HistoriaRamificadaActivity>(createDefaultHistoriaRamificada),
    nodoInicial: 'n1',
    nodos: [
      nodo('n1', 'decision', [{ id: 'o1', texto: 'Izquierda' }, { id: 'o2', texto: 'Derecha' }]),
      nodo('f1', 'final_bueno'),
      nodo('f2', 'final_malo'),
    ],
    conexiones: [
      { id: 'c1', desdeNodoId: 'n1', opcionId: 'o1', haciaNodoId: 'f1' },
      { id: 'c2', desdeNodoId: 'n1', opcionId: 'o2', haciaNodoId: 'f2' },
    ],
  });
  it('una historia completa no tiene problemas', () => {
    expect(validarActividad(base())).toEqual([]);
  });
  it('inicial inexistente, conexión rota y opción sin destino', () => {
    const a = base();
    a.nodoInicial = 'nada';
    a.conexiones = [
      { id: 'c1', desdeNodoId: 'n1', opcionId: 'o1', haciaNodoId: 'fantasma' },
      { id: 'c2', desdeNodoId: 'n1', opcionId: 'zzz', haciaNodoId: 'f2' },
    ];
    const e = errores(a);
    expect(e).toContain('El nodo inicial no existe.');
    expect(e).toContain('Hay una conexión que apunta a un nodo que no existe.');
    expect(e).toContain('Una conexión sale de una opción que ya no existe.');
    expect(e).toContain('La opción «Derecha» no lleva a ningún nodo.');
  });
  it('huérfanos, callejones y finales con salida son avisos', () => {
    const a = base();
    a.nodos.push(nodo('h', 'narracion'), nodo('m', 'narracion'));
    a.conexiones.push({ id: 'c3', desdeNodoId: 'f1', opcionId: 'x', haciaNodoId: 'm' });
    expect(avisos(a)).toContain('Nunca se llega a este nodo desde el inicio.');
    expect(avisos(a)).toContain('Es un final pero tiene salidas.');
    expect(avisos(a)).toContain('No tiene salida: la historia se detiene aquí.');
    a.conexiones = [];
    a.nodos = [nodo('n1', 'narracion')];
    expect(avisos(a)).toContain('Desde el inicio no se puede llegar a ningún final.');
  });
  it('decisión con una sola opción; ids repetidos; sin nodos', () => {
    const a = base();
    a.nodos[0] = nodo('n1', 'pregunta', [{ id: 'o1', texto: 'Única' }]);
    expect(errores(a)).toContain('Necesita al menos 2 opciones.');
    a.nodos.push(nodo('f1', 'final_bueno'));
    expect(errores(a)).toContain('Hay nodos con el mismo identificador.');
    a.nodos = [];
    expect(errores(a)).toEqual(['No tiene nodos.']);
  });
});

describe('ruleta, torneo y escape_room', () => {
  it('ruleta: menos de 2 opciones, vacías y repetidas', () => {
    const a = { tipo: 'ruleta', configuracion: { colores: [], sonido: true, duracionGiro: 3000, mostrarGanador: true }, items: [{ id: '1', texto: 'A' }] } as RuletaActivity;
    expect(errores(a)).toEqual(['Necesita al menos 2 opciones.']);
    a.items = [{ id: '1', texto: 'A' }, { id: '2', texto: 'a' }, { id: '3', texto: '' }];
    expect(avisos(a)).toEqual(['Hay opciones sin texto.', 'Opciones repetidas: «a».']);
  });
  it('torneo: respuesta que no es opción, pocas opciones y tiempo corto', () => {
    const a = nueva<TorneoActivity>(createDefaultTorneo);
    a.preguntas = [{ enunciado: '', opciones: ['A', '', ''], correcta: 'Z', tiempoSegundos: 3 }];
    a.puntosBase = -1;
    const e = errores(a);
    expect(e).toContain('Falta el enunciado.');
    expect(e).toContain('Necesita al menos 2 opciones con texto.');
    expect(e).toContain('La respuesta correcta no es una de las opciones.');
    expect(e).toContain('Los puntos base no pueden ser negativos.');
    expect(avisos(a)).toEqual(['El tiempo es muy corto (menos de 5 segundos).']);
    a.preguntas = [];
    expect(errores(a)).toEqual(['No tiene preguntas.']);
  });
  it('escape_room: desafío y respuesta vacíos, correcta fuera de las opciones y código no numérico', () => {
    const a = nueva<EscapeRoomActivity>(createDefaultEscapeRoom);
    const sala = a.salas[0]!;
    a.salas = [
      { ...sala, desafio: '', respuestaCorrecta: '', tipoRespuesta: 'texto' },
      { ...sala, id: 's2', tipoRespuesta: 'opcion_multiple', opciones: ['A', 'B'], respuestaCorrecta: 'C' },
      { ...sala, id: 's3', tipoRespuesta: 'codigo', respuestaCorrecta: 'abc', intentosMaximos: 0 },
    ];
    const e = errores(a);
    expect(e).toContain('Falta el desafío.');
    expect(e).toContain('Falta la respuesta correcta.');
    expect(e).toContain('La respuesta correcta no es una de las opciones.');
    expect(e).toContain('El código debe ser numérico.');
    expect(avisos(a)).toContain('Los intentos máximos no son válidos (se usarán 3).');
    a.salas = [];
    expect(errores(a)).toEqual(['No tiene salas.']);
  });
});
