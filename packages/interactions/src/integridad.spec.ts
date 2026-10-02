import { describe, expect, it } from 'vitest';
import {
  bloqueParaPegar,
  generarMapaDeIds,
  limpiarReferenciasABloque,
  limpiarReferenciasASlide,
  referenciasA,
  reglasConReferenciasRotas,
  remapearIds,
} from './integridad.js';
import { bloque, lit, regla, slide } from './prueba-utils.js';

const conReglas = (id: string, disparadores: ReturnType<typeof regla>[]) =>
  bloque(id, { disparadores });

describe('reglasConReferenciasRotas', () => {
  it('un mazo sano devuelve []', () => {
    const s = slide('s1', {
      bloques: [
        conReglas('a', [regla('r1', 'clic', [{ tipo: 'mostrar', bloqueId: 'b' }])]),
        bloque('b'),
      ],
    });
    expect(reglasConReferenciasRotas([s], [])).toEqual([]);
  });

  it('detecta bloque, slide, capa y variable inexistentes y dice dónde vive la regla', () => {
    const s = slide('s1', {
      bloques: [
        conReglas('a', [
          regla('r-bloque', 'clic', [{ tipo: 'mostrar', bloqueId: 'nada' }]),
          regla('r-slide', 'clic', [{ tipo: 'ir_a_slide', slideId: 'nada' }]),
          regla('r-capa', 'clic', [{ tipo: 'abrir_capa', capaId: 'nada' }]),
          regla('r-var', 'clic', [{ tipo: 'sumar_variable', variableId: 'nada', cantidad: 1 }]),
        ]),
      ],
    });
    const rotas = reglasConReferenciasRotas([s], []);
    expect(rotas.map((r) => [r.reglaId, r.codigo])).toEqual([
      ['r-bloque', 'bloque_inexistente'],
      ['r-slide', 'slide_inexistente'],
      ['r-capa', 'capa_inexistente'],
      ['r-var', 'variable_inexistente'],
    ]);
    expect(rotas.every((r) => r.slideId === 's1' && r.bloqueId === 'a')).toBe(true);
  });

  it('avisa de reglas en un bloque sin id (se ignoran en silencio)', () => {
    const s = slide('s1', {
      bloques: [bloque(undefined, { disparadores: [regla('huerfana', 'clic', [{ tipo: 'siguiente' }])] })],
    });
    expect(reglasConReferenciasRotas([s], []).map((r) => r.codigo)).toEqual(['dueno_sin_id']);
  });

  it('avisa de ids de regla repetidos entre slides', () => {
    const r = regla('igual', 'al_entrar_slide', [{ tipo: 'siguiente' }]);
    const rotas = reglasConReferenciasRotas(
      [slide('s1', { reglas: [r] }), slide('s2', { reglas: [r] })],
      [],
    );
    expect(rotas.map((x) => x.codigo)).toEqual(['regla_duplicada']);
  });
});

describe('referenciasA', () => {
  const slides = [
    slide('s1', {
      bloques: [
        conReglas('a', [regla('propia', 'clic', [{ tipo: 'mostrar', bloqueId: 'a' }])]),
        conReglas('b', [regla('ajena', 'clic', [{ tipo: 'mostrar', bloqueId: 'a' }])]),
      ],
      reglas: [regla('de-slide', 'al_entrar_slide', [{ tipo: 'ir_a_slide', slideId: 's2' }])],
    }),
    slide('s2', {
      bloques: [conReglas('c', [regla('vuelve', 'clic', [{ tipo: 'ir_a_slide', slideId: 's1' }])])],
    }),
  ];
  it('lista las reglas ajenas que mencionan un bloque, no las que viven en él', () => {
    expect(referenciasA(slides, { tipo: 'bloque', id: 'a' }).map((r) => r.reglaId)).toEqual(['ajena']);
  });
  it('lista las reglas de otros slides que apuntan al slide, no las del propio slide', () => {
    expect(referenciasA(slides, { tipo: 'slide', id: 's2' }).map((r) => r.reglaId)).toEqual(['de-slide']);
    expect(referenciasA(slides, { tipo: 'slide', id: 's1' }).map((r) => r.reglaId)).toEqual(['vuelve']);
  });
  it('también ve los operandos de las condiciones', () => {
    const s = slide('s1', {
      bloques: [
        conReglas('b', [
          regla('cond', 'clic', [{ tipo: 'siguiente' }], [
            { tipo: 'comparacion', operador: '==', izquierda: { tipo: 'estado_bloque', bloqueId: 'a' }, derecha: lit('visitado') },
          ]),
        ]),
      ],
    });
    expect(referenciasA([s], { tipo: 'bloque', id: 'a' }).map((r) => r.reglaId)).toEqual(['cond']);
  });
});

describe('limpiarReferenciasABloque', () => {
  const base = () =>
    slide('s1', {
      bloques: [
        conReglas('b', [
          regla('solo-a', 'clic', [{ tipo: 'mostrar', bloqueId: 'a' }]),
          regla('mixta', 'clic', [{ tipo: 'mostrar', bloqueId: 'a' }, { tipo: 'siguiente' }]),
          regla('con-condicion', 'clic', [{ tipo: 'siguiente' }], [
            { tipo: 'comparacion', operador: '==', izquierda: { tipo: 'respuesta_correcta', bloqueId: 'a' }, derecha: lit(true) },
          ]),
          regla('ajena', 'clic', [{ tipo: 'siguiente' }]),
        ]),
      ],
      reglas: [regla('de-slide', 'al_entrar_slide', [{ tipo: 'ocultar', bloqueId: 'a' }])],
    });

  it('borra las reglas cuyo único objetivo era el bloque y desactiva las que lo mezclan', () => {
    const r = limpiarReferenciasABloque(base(), 'a');
    expect(r.eliminadas.sort()).toEqual(['de-slide', 'solo-a']);
    expect(r.desactivadas.sort()).toEqual(['con-condicion', 'mixta']);
    const disp = r.resultado.bloques?.[0]?.disparadores ?? [];
    expect(disp.map((x) => [x.id, x.activa])).toEqual([
      ['mixta', false],
      ['con-condicion', false],
      ['ajena', true],
    ]);
    expect(r.resultado.reglas).toEqual([]);
  });

  it('lo desactivado sigue marcado como referencia rota (no se pierde en silencio)', () => {
    const r = limpiarReferenciasABloque(base(), 'a');
    const rotas = reglasConReferenciasRotas([r.resultado], []);
    expect(rotas.map((x) => x.reglaId).sort()).toEqual(['con-condicion', 'mixta']);
  });

  it('no toca el slide si nada lo referencia (misma identidad)', () => {
    const s = base();
    const r = limpiarReferenciasABloque(s, 'inexistente');
    expect(r.resultado).toBe(s);
    expect(r.eliminadas).toEqual([]);
  });

  it('limpia también las reglas de los bloques de una capa', () => {
    const s = slide('s1', {
      capas: [{ id: 'c1', nombre: 'c', bloques: [conReglas('x', [regla('r', 'clic', [{ tipo: 'mostrar', bloqueId: 'a' }])])] }],
    });
    const r = limpiarReferenciasABloque(s, 'a');
    expect(r.eliminadas).toEqual(['r']);
    expect(r.resultado.capas?.[0]?.bloques[0]?.disparadores).toEqual([]);
  });
});

describe('limpiarReferenciasASlide', () => {
  it('borra o desactiva según el objetivo y avisa qué slides cambiaron', () => {
    const slides = [
      slide('s1', {
        bloques: [
          conReglas('a', [
            regla('refuerzo', 'respuesta_incorrecta', [{ tipo: 'ir_a_slide', slideId: 's9' }]),
            regla('mixta', 'clic', [{ tipo: 'ir_a_slide', slideId: 's9' }, { tipo: 'siguiente' }]),
          ]),
        ],
      }),
      slide('s2', { bloques: [bloque('z')] }),
    ];
    const r = limpiarReferenciasASlide(slides, 's9');
    expect(r.eliminadas).toEqual(['refuerzo']);
    expect(r.desactivadas).toEqual(['mixta']);
    expect(r.slidesCambiados).toEqual(['s1']);
    expect(r.resultado[1]).toBe(slides[1]);
  });
});

describe('duplicar: generarMapaDeIds + remapearIds', () => {
  const contador = () => {
    let n = 0;
    return () => `nuevo-${++n}`;
  };
  const original = () =>
    slide('s1', {
      bloques: [
        conReglas('h1', [
          regla('tpl:revelar:t:h1', 'visitado', [{ tipo: 'mostrar', bloqueId: 't' }], [
            { tipo: 'comparacion', operador: '==', izquierda: { tipo: 'estado_bloque', bloqueId: 'h1' }, derecha: lit('visitado') },
          ]),
        ]),
        bloque('t'),
      ],
      capas: [{ id: 'capa', nombre: 'c', bloques: [bloque('cb')] }],
      reglas: [regla('abre', 'al_entrar_slide', [{ tipo: 'abrir_capa', capaId: 'capa' }])],
    });

  it('regenera ids de bloque, capa y regla y remapea las referencias internas', () => {
    const s = original();
    const mapa = generarMapaDeIds(s, contador());
    const copia = remapearIds(s, mapa);
    const ids = (copia.bloques ?? []).map((b) => (b as { id?: string }).id);
    expect(ids).toEqual([mapa.bloques.h1, mapa.bloques.t]);
    expect(copia.capas?.[0]?.id).toBe(mapa.capas.capa);
    expect(copia.reglas?.[0]?.acciones).toEqual([{ tipo: 'abrir_capa', capaId: mapa.capas.capa }]);
    const r = copia.bloques?.[0]?.disparadores?.[0];
    expect(r?.acciones).toEqual([{ tipo: 'mostrar', bloqueId: mapa.bloques.t }]);
    // el id de la regla de plantilla se rehace sobre los ids nuevos
    expect(r?.id).toBe(`tpl:revelar:${mapa.bloques.t}:${mapa.bloques.h1}`);
    // ningún id viejo sobrevive en la copia
    expect(JSON.stringify(copia)).not.toMatch(/"(h1|t|cb|capa)"/);
  });

  it('el original no se muta', () => {
    const s = original();
    const antes = JSON.stringify(s);
    remapearIds(s, generarMapaDeIds(s, contador()));
    expect(JSON.stringify(s)).toBe(antes);
  });

  it('conserva las referencias a otros slides y solo reapunta las del mapa de slides', () => {
    const s = slide('s1', {
      bloques: [
        conReglas('a', [
          regla('self', 'clic', [{ tipo: 'ir_a_slide', slideId: 's1' }]),
          regla('otro', 'clic', [{ tipo: 'ir_a_slide', slideId: 's7' }]),
        ]),
      ],
    });
    const copia = remapearIds(s, { slides: { s1: 'copia-s1' } });
    const acciones = copia.bloques?.[0]?.disparadores?.map((r) => r.acciones[0]);
    expect(acciones).toEqual([
      { tipo: 'ir_a_slide', slideId: 'copia-s1' },
      { tipo: 'ir_a_slide', slideId: 's7' },
    ]);
  });

  it('las reglas con id sin bloque dentro reciben id nuevo (no chocan con el original)', () => {
    const s = original();
    const mapa = generarMapaDeIds(s, contador());
    expect(mapa.reglas.abre).toMatch(/^nuevo-/);
    expect(mapa.reglas.abre).not.toBe('abre');
  });
});

describe('bloqueParaPegar', () => {
  it('quita los disparadores, pone id nuevo y avisa si había interacciones', () => {
    const origen = bloque('a', { disparadores: [regla('r', 'clic', [{ tipo: 'siguiente' }])], estado: 'visitado' });
    const { bloque: b, teniaInteracciones } = bloqueParaPegar(origen, 'copia');
    expect((b as { id: string }).id).toBe('copia');
    expect(b.disparadores).toBeUndefined();
    expect('disparadores' in b).toBe(false);
    expect(teniaInteracciones).toBe(true);
    expect(origen.disparadores).toHaveLength(1);
  });
  it('sin disparadores no avisa', () => {
    expect(bloqueParaPegar(bloque('a'), 'x').teniaInteracciones).toBe(false);
  });
});

