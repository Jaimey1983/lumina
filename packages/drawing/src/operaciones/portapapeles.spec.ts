import { describe, expect, it } from 'vitest';
import { conectarFormas, existeConector } from '../conectores/enlazar.js';
import { LIMITES } from '../normalizar.js';
import type { Escena, Forma, Linea } from '../tipos.js';
import { cajaDeFragmento, copiar, FORMATO_FRAGMENTO, MAX_ELEMENTOS_FRAGMENTO, pegar, validarFragmento, VERSION_FRAGMENTO, type Fragmento } from './portapapeles.js';
import { escena, forma, getForma, getGrupo, getLinea, grupo, linea, texto } from './util-pruebas.js';

const trio = (): Escena => {
  let e = escena(forma('A', 0, 0), forma('B', 200, 0), forma('C', 400, 0));
  e = conectarFormas(e, 'A', 'B');
  return conectarFormas(e, 'B', 'C');
};
const formas = (e: Escena): Forma[] => e.elementos.filter((x): x is Forma => x.tipo === 'forma');
const lineas = (e: Escena): Linea[] => e.elementos.filter((x): x is Linea => x.tipo === 'linea');
const fragmento = (e: Escena, ids: string[]): Fragmento => copiar(e, ids) as Fragmento;

describe('copiar', () => {
  it('sin nada elegido, o con ids que no existen, no hay fragmento', () => {
    const e = trio();
    expect(copiar(e, [])).toBeNull();
    expect(copiar(e, ['no-existe'])).toBeNull();
  });

  it('un trío conectado: las tres formas y sus dos conectores, en orden de apilado', () => {
    const f = fragmento(trio(), ['A', 'B', 'C']);
    expect(f.formato).toBe(FORMATO_FRAGMENTO);
    expect(f.version).toBe(VERSION_FRAGMENTO);
    expect(f.elementos.map((x) => x.tipo)).toEqual(['forma', 'forma', 'forma', 'linea', 'linea']);
  });

  it('los conectores entre formas copiadas viajan aunque no estén elegidos; los que salen fuera no', () => {
    const f = fragmento(trio(), ['A', 'B']);
    expect(f.elementos.filter((x) => x.tipo === 'linea')).toHaveLength(1); // A→B sí, B→C no
    expect(f.elementos.map((x) => x.id)).not.toContain('C');
  });

  it('un conector elegido con un extremo fuera se copia con ese extremo suelto', () => {
    const e = trio();
    const l = lineas(e).find((x) => x.destino?.elementoId === 'C') as Linea; // B→C
    const f = fragmento(e, [l.id]);
    expect(f.elementos).toHaveLength(1);
    const copia = f.elementos[0] as Linea;
    expect(copia.origen).toBeUndefined();
    expect(copia.destino).toBeUndefined();
  });

  it('un grupo lleva a sus hijos; elegir el grupo y un hijo no repite el hijo', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), grupo('g', ['a', 'b']), forma('x', 500, 0));
    expect(fragmento(e, ['g']).elementos.map((x) => x.id).sort()).toEqual(['a', 'b', 'g']);
    expect(fragmento(e, ['g', 'a']).elementos).toHaveLength(3);
  });

  it('lo bloqueado se puede copiar', () => {
    const e = escena(forma('a', 0, 0, 100, 60, { bloqueado: true }));
    expect(fragmento(e, ['a']).elementos).toHaveLength(1);
  });

  it('el fragmento es una copia: cambiarlo no toca la escena', () => {
    const e = trio();
    const f = fragmento(e, ['A']);
    (f.elementos[0] as Forma).transformacion.x = 999;
    expect(getForma(e, 'A').transformacion.x).toBe(0);
  });
});

describe('pegar', () => {
  it('copiar y pegar un trío conserva forma, estilo, texto y topología, con ids nuevos', () => {
    const base = escena(
      forma('A', 0, 0, 100, 60, { texto: 'Uno', estilo: { relleno: { tipo: 'color', color: '#aabbcc' } } }),
      forma('B', 200, 0, 100, 60, { texto: 'Dos', forma: 'rombo' }),
      forma('C', 400, 0, 100, 60, { texto: 'Tres' }),
    );
    let e = conectarFormas(base, 'A', 'B');
    e = conectarFormas(e, 'B', 'C');
    const r = pegar(e, fragmento(e, ['A', 'B', 'C']), { desplazamiento: { x: 20, y: 20 } });
    expect(r.escena.elementos).toHaveLength(10);
    const nuevas = formas(r.escena).slice(3);
    expect(nuevas.map((f) => f.texto)).toEqual(['Uno', 'Dos', 'Tres']);
    expect(nuevas[1]?.forma).toBe('rombo');
    expect(nuevas[0]?.estilo.relleno).toEqual(formas(e)[0]?.estilo.relleno);
    // Ids únicos en toda la escena.
    const ids = r.escena.elementos.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Los conectores de las copias van entre las copias, no a los originales.
    const [a2, b2, c2] = nuevas.map((f) => f.id) as [string, string, string];
    expect(existeConector(r.escena, a2, b2)).toBe(true);
    expect(existeConector(r.escena, b2, c2)).toBe(true);
    expect(existeConector(r.escena, a2, 'B')).toBe(false);
    // Los originales no cambian.
    expect(existeConector(r.escena, 'A', 'B')).toBe(true);
    expect(getForma(r.escena, 'A').transformacion.x).toBe(0);
  });

  it('las copias quedan al frente y en el mismo orden relativo', () => {
    const e = trio();
    const r = pegar(e, fragmento(e, ['C', 'A']), { desplazamiento: { x: 10, y: 10 } });
    const nuevas = r.escena.elementos.slice(e.elementos.length);
    expect(nuevas.filter((x) => x.tipo === 'forma').map((x) => (x as Forma).transformacion.x)).toEqual([10, 410]); // A antes que C: como en el original
  });

  it('desplazamiento, mismo sitio y centro', () => {
    const e = escena(forma('A', 100, 100, 200, 100));
    const f = fragmento(e, ['A']);
    expect(getForma(pegar(e, f).escena, 'A-copia').transformacion).toMatchObject({ x: 100, y: 100 });
    expect(getForma(pegar(e, f, { desplazamiento: { x: 20, y: 30 } }).escena, 'A-copia').transformacion).toMatchObject({ x: 120, y: 130 });
    const c = getForma(pegar(e, f, { centro: { x: 500, y: 300 } }).escena, 'A-copia').transformacion;
    expect(c.x + c.ancho / 2).toBeCloseTo(500, 5);
    expect(c.y + c.alto / 2).toBeCloseTo(300, 5);
  });

  it('pegar dos veces no repite ids ni se superpone con un desplazamiento distinto', () => {
    const e = escena(forma('A', 0, 0));
    const f = fragmento(e, ['A']);
    const uno = pegar(e, f, { desplazamiento: { x: 20, y: 20 } });
    const dos = pegar(uno.escena, f, { desplazamiento: { x: 40, y: 40 } });
    const ids = dos.escena.elementos.map((x) => x.id);
    expect(new Set(ids).size).toBe(3);
    expect(formas(dos.escena).map((x) => x.transformacion.x)).toEqual([0, 20, 40]);
  });

  it('lo pegado sale desbloqueado, aunque lo copiado lo estuviera', () => {
    const e = escena(forma('a', 0, 0, 100, 60, { bloqueado: true }), forma('b', 200, 0, 100, 60, { bloqueado: true }), grupo('g', ['a', 'b'], { bloqueado: true }));
    const r = pegar(e, fragmento(e, ['g']), { desplazamiento: { x: 20, y: 20 } });
    const nuevos = r.escena.elementos.slice(3);
    expect(nuevos).toHaveLength(3);
    expect(nuevos.every((x) => x.bloqueado === false)).toBe(true);
    expect(r.escena.elementos[0]?.bloqueado).toBe(true); // el original sigue bloqueado
  });

  it('un grupo se pega con sus hijos remapeados y deja elegido solo el grupo', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), grupo('g', ['a', 'b']));
    const r = pegar(e, fragmento(e, ['g']), { desplazamiento: { x: 20, y: 20 } });
    expect(r.ids).toHaveLength(1);
    const g2 = getGrupo(r.escena, r.ids[0] as string);
    expect(g2.hijos).toHaveLength(2);
    expect(g2.hijos.every((h) => r.escena.elementos.some((x) => x.id === h) && !['a', 'b'].includes(h))).toBe(true);
  });

  it('lo elegido tras pegar son los elementos de primer nivel, sin los conectores que siguen a sus dos formas', () => {
    const e = trio();
    const r = pegar(e, fragmento(e, ['A', 'B', 'C']), { desplazamiento: { x: 20, y: 20 } });
    expect(r.ids).toHaveLength(3);
    expect(r.ids.every((id) => r.escena.elementos.find((x) => x.id === id)?.tipo === 'forma')).toBe(true);
    // Un conector suelto pegado solo sí queda elegido.
    const suelto = escena(linea('L', [[0, 0], [100, 100]]));
    const s = pegar(suelto, fragmento(suelto, ['L']), { desplazamiento: { x: 20, y: 20 } });
    expect(s.ids).toHaveLength(1);
  });

  it('un extremo que apunta fuera del fragmento queda suelto: nunca se pega a una forma de la escena de destino', () => {
    // Fragmento «de otra escena»: su conector nombra a «A», que no viene en el fragmento…
    const hostil = validarFragmento({
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      elementos: [{ id: 'L', tipo: 'linea', puntos: [{ x: 0, y: 0 }, { x: 50, y: 50 }], origen: { elementoId: 'A', puerto: 1 }, destino: { elementoId: 'B', puerto: 3 } }],
    }) as Fragmento;
    // …y en la escena de destino sí existe una «A».
    const destino = escena(forma('A', 0, 0), forma('B', 200, 0));
    const l = lineas(pegar(destino, hostil, { desplazamiento: { x: 10, y: 10 } }).escena)[0] as Linea;
    expect(l.origen).toBeUndefined();
    expect(l.destino).toBeUndefined();
  });

  it('también sin pasar por el validador: pegar nunca une un extremo a una forma que no viene en el fragmento', () => {
    const crudo = {
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      elementos: [{ ...(escena(linea('L', [[0, 0], [50, 50]])).elementos[0] as Linea), origen: { elementoId: 'A', puerto: 1 }, destino: { elementoId: 'B', puerto: 3 } }],
    } as Fragmento;
    const destino = escena(forma('A', 0, 0), forma('B', 200, 0));
    const l = lineas(pegar(destino, crudo, { desplazamiento: { x: 10, y: 10 } }).escena)[0] as Linea;
    expect(l.origen).toBeUndefined();
    expect(l.destino).toBeUndefined();
  });

  it('un fragmento vacío no cambia nada', () => {
    const e = trio();
    const r = pegar(e, { formato: FORMATO_FRAGMENTO, version: VERSION_FRAGMENTO, elementos: [] });
    expect(r.escena).toBe(e);
    expect(r.motivo).toBe('vacio');
  });

  it('si la escena no admite más elementos, no pega y lo dice', () => {
    const casi = escena(...Array.from({ length: LIMITES.elementos - 1 }, (_, i) => forma(`f${i}`, i, 0)));
    expect(casi.elementos).toHaveLength(LIMITES.elementos - 1);
    const f = fragmento(trio(), ['A', 'B']); // 3 elementos (2 formas y 1 conector)
    const r = pegar(casi, f);
    expect(r.escena).toBe(casi);
    expect(r.motivo).toBe('demasiados');
    expect(r.ids).toEqual([]);
  });

  it('el límite de elementos de la escena es exacto: cabe justo, y uno más no', () => {
    const f = fragmento(trio(), ['A', 'B']); // 3 elementos
    const justo = escena(...Array.from({ length: LIMITES.elementos - 3 }, (_, i) => forma(`f${i}`, i, 0)));
    expect(pegar(justo, f).escena.elementos).toHaveLength(LIMITES.elementos);
    const pasado = escena(...Array.from({ length: LIMITES.elementos - 2 }, (_, i) => forma(`f${i}`, i, 0)));
    expect(pegar(pasado, f).motivo).toBe('demasiados');
  });

  it('texto y líneas sueltas también se pegan', () => {
    const e = escena(texto('t', 0, 0, { texto: 'Nota' }), linea('l', [[0, 0], [100, 0]], { fin: 'flecha' }));
    const r = pegar(e, fragmento(e, ['t', 'l']), { desplazamiento: { x: 20, y: 20 } });
    expect(r.escena.elementos).toHaveLength(4);
    expect(getLinea(r.escena, 'l-copia').puntos[0]).toEqual({ x: 20, y: 20 });
    expect(getLinea(r.escena, 'l-copia').fin).toBe('flecha');
  });
});

describe('cajaDeFragmento', () => {
  it('envuelve a todo el fragmento', () => {
    const e = escena(forma('a', 100, 50, 100, 60), forma('b', 400, 300, 50, 50));
    expect(cajaDeFragmento(fragmento(e, ['a', 'b']))).toEqual({ x: 100, y: 50, ancho: 350, alto: 300 });
  });
});

describe('validarFragmento (lo que viene del portapapeles no es de fiar)', () => {
  const bueno = (): Record<string, unknown> => ({ ...fragmento(trio(), ['A', 'B']) });

  it('un fragmento válido pasa y sale normalizado', () => {
    const v = validarFragmento(JSON.parse(JSON.stringify(bueno())));
    expect(v?.elementos).toHaveLength(3);
  });

  it('rechaza lo que no es un objeto', () => {
    for (const x of [null, undefined, 'texto', 42, true, [], [bueno()]]) expect(validarFragmento(x)).toBeNull();
  });

  it('rechaza otro formato, otra versión, o sin elementos', () => {
    expect(validarFragmento({ ...bueno(), formato: 'otra-cosa' })).toBeNull();
    expect(validarFragmento({ ...bueno(), version: 2 })).toBeNull();
    expect(validarFragmento({ ...bueno(), version: '1' })).toBeNull();
    expect(validarFragmento({ ...bueno(), elementos: [] })).toBeNull();
    expect(validarFragmento({ ...bueno(), elementos: 'no' })).toBeNull();
    const { elementos: _quitado, ...sin } = bueno();
    expect(validarFragmento(sin)).toBeNull();
  });

  it('el límite es de 500 elementos: 500 pasa y 501 no', () => {
    const f = (n: number) => ({
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      elementos: Array.from({ length: n }, (_, i) => forma(`f${i}`, i, 0)),
    });
    expect(validarFragmento(f(MAX_ELEMENTOS_FRAGMENTO))?.elementos).toHaveLength(500);
    expect(validarFragmento(f(MAX_ELEMENTOS_FRAGMENTO + 1))).toBeNull();
  });

  it('rechaza ids repetidos, ids que no son texto y elementos de un tipo desconocido', () => {
    const f = (elementos: unknown[]) => ({ formato: FORMATO_FRAGMENTO, version: VERSION_FRAGMENTO, elementos });
    expect(validarFragmento(f([forma('a', 0, 0), forma('a', 10, 10)]))).toBeNull();
    expect(validarFragmento(f([{ ...forma('a', 0, 0), id: 7 }]))).toBeNull();
    expect(validarFragmento(f([{ ...forma('a', 0, 0), id: '' }]))).toBeNull();
    expect(validarFragmento(f([forma('a', 0, 0), { id: 'x', tipo: 'script', codigo: 'alert(1)' }]))).toBeNull();
    expect(validarFragmento(f([forma('a', 0, 0), null]))).toBeNull();
    expect(validarFragmento(f([forma('a', 0, 0), 'cadena']))).toBeNull();
  });

  it('números hostiles (NaN, Infinity, enormes) acaban normalizados, nunca rompen la escena', () => {
    const v = validarFragmento({
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      elementos: [{ ...forma('a', 0, 0), transformacion: { x: Number.NaN, y: Infinity, ancho: -Infinity, alto: 1e308, rotacion: Number.NaN } }],
    });
    expect(v).not.toBeNull();
    const t = (v?.elementos[0] as Forma).transformacion;
    for (const n of Object.values(t)) expect(Number.isFinite(n)).toBe(true);
    // Y pegarlo deja una escena sana.
    const r = pegar(escena(), v as Fragmento);
    for (const el of r.escena.elementos) for (const n of Object.values((el as Forma).transformacion)) expect(Number.isFinite(n)).toBe(true);
  });

  it('un __proto__ hostil no contamina nada', () => {
    const texto = `{"formato":"${FORMATO_FRAGMENTO}","version":${VERSION_FRAGMENTO},"__proto__":{"contaminado":true},"elementos":[{"id":"a","tipo":"forma","forma":"rectangulo","__proto__":{"contaminado":true},"constructor":{"prototype":{"contaminado":true}},"transformacion":{"x":0,"y":0,"ancho":100,"alto":60,"rotacion":0}}]}`;
    const v = validarFragmento(JSON.parse(texto));
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'contaminado')).toBe(false);
    expect(v?.elementos).toHaveLength(1);
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
  });

  it('una cadena enorme en el texto se recorta, no revienta', () => {
    const v = validarFragmento({
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      elementos: [{ ...forma('a', 0, 0), texto: 'x'.repeat(5_000_000) }],
    });
    expect(((v?.elementos[0] as Forma).texto ?? '').length).toBeLessThanOrEqual(LIMITES.texto);
  });

  it('un objeto con getters que lanzan no tumba al validador', () => {
    const malo = {
      formato: FORMATO_FRAGMENTO,
      version: VERSION_FRAGMENTO,
      get elementos(): unknown {
        throw new Error('no se puede leer');
      },
    };
    expect(validarFragmento(malo)).toBeNull();
  });
});
