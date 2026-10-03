import { describe, expect, it } from 'vitest';
import {
  generarMapaDeIds,
  limpiarReferenciasABloque,
  limpiarReferenciasASlide,
  reglasConReferenciasRotas,
  remapearIds,
} from '@lumina/interactions';
import type { Regla } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';

import {
  alternarRegla,
  aplicarPlantilla,
  conIdsCandidatos,
  crearContextoDescripcion,
  describirRegla,
  duplicarReglaDeBloque,
  guardarRegla,
  moverReglaDeBloque,
  quitarRegla,
  tipoDeElemento,
} from './interacciones';

const b = (tipo: string, extra: object = {}) => ({ tipo, ...extra }) as unknown as Block;
const idDe = (x: Block) => (x as { id?: string }).id;
const slideDe = (bloques: Block[], id = 's1') => ({ id, bloques });

describe('aplicarPlantilla (K7b)', () => {
  it('«botón navega» asigna id al botón (D8-a), crea la regla y quita la acción legada', () => {
    const bloques = [b('boton', { accion: 'siguiente' }), b('texto')];
    const out = aplicarPlantilla(bloques, 0, {
      tipo: 'boton-navega',
      evento: 'clic',
      destino: { tipo: 'slide', slideId: 's2' },
    });
    expect(idDe(out[0]!)).toBeTruthy();
    expect(idDe(out[1]!)).toBeUndefined(); // el resto no cambia
    expect(out[0]!.disparadores).toHaveLength(1);
    expect((out[0] as { accion: string }).accion).toBe('ninguna'); // no navega dos veces
    expect(reglasConReferenciasRotas([slideDe(out), { id: 's2' }], [])).toEqual([]);
  });

  it('no toca la acción URL del botón', () => {
    const out = aplicarPlantilla([b('boton', { accion: 'url', url: 'https://x' })], 0, {
      tipo: 'boton-navega',
      evento: 'clic',
      destino: { tipo: 'siguiente' },
    });
    expect((out[0] as { accion: string }).accion).toBe('url');
  });

  it('el contador pasa de alTerminar a una regla fin_contador', () => {
    const out = aplicarPlantilla([b('contador', { alTerminar: 'siguiente' })], 0, {
      tipo: 'boton-navega',
      evento: 'fin_contador',
      destino: { tipo: 'siguiente' },
    });
    expect((out[0] as { alTerminar: string }).alTerminar).toBe('ninguna');
    expect(out[0]!.disparadores?.[0]?.evento).toBe('fin_contador');
  });

  it('reaplicar la plantilla reemplaza la regla (no duplica)', () => {
    const una = aplicarPlantilla([b('boton')], 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
    const dos = aplicarPlantilla(una, 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'anterior' } });
    expect(dos[0]!.disparadores).toHaveLength(1);
    expect(dos[0]!.disparadores?.[0]?.acciones).toEqual([{ tipo: 'anterior' }]);
  });

  it('«refuerzo» pone la regla en la actividad', () => {
    const out = aplicarPlantilla([b('actividad')], 0, { tipo: 'refuerzo', slideRefuerzoId: 's9' });
    expect(out[0]!.disparadores?.[0]?.evento).toBe('respuesta_incorrecta');
    expect(reglasConReferenciasRotas([slideDe(out), { id: 's9' }], [])).toEqual([]);
  });

  it('«revelar» reparte una regla por hotspot y da ids a todos los que intervienen', () => {
    const bloques = [b('hotspot'), b('hotspot'), b('texto'), b('texto')];
    const out = aplicarPlantilla(bloques, 0, { tipo: 'revelar', hotspotIndices: [0, 1], objetivoIndex: 2 });
    expect([0, 1, 2].every((i) => idDe(out[i]!))).toBe(true);
    expect(idDe(out[3]!)).toBeUndefined();
    expect(out[0]!.disparadores).toHaveLength(1);
    expect(out[1]!.disparadores).toHaveLength(1);
    expect(out[2]!.disparadores).toBeUndefined();
    expect(reglasConReferenciasRotas([slideDe(out)], [])).toEqual([]);
  });

  it('no muta los bloques de entrada', () => {
    const bloques = [b('boton')];
    const antes = JSON.stringify(bloques);
    aplicarPlantilla(bloques, 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
    expect(JSON.stringify(bloques)).toBe(antes);
  });
});

describe('quitar / alternar', () => {
  const base = aplicarPlantilla([b('boton')], 0, { tipo: 'boton-navega', evento: 'clic', destino: { tipo: 'siguiente' } });
  const reglaId = base[0]!.disparadores![0]!.id;
  it('alterna activa sin tocar nada más', () => {
    const off = alternarRegla(base, 0, reglaId, false);
    expect(off[0]!.disparadores?.[0]?.activa).toBe(false);
  });
  it('quitar la última regla elimina el campo disparadores', () => {
    const out = quitarRegla(base, 0, reglaId);
    expect('disparadores' in out[0]!).toBe(false);
  });
});

describe('tipoDeElemento (N0: las actividades se registran por el tipo de la actividad)', () => {
  it('un bloque de actividad se identifica por actividad.tipo', () => {
    expect(tipoDeElemento(b('actividad', { actividad: { tipo: 'verdadero_falso' } }))).toBe('verdadero_falso');
  });
  it('los demás bloques se identifican por su propio tipo', () => {
    expect(tipoDeElemento(b('boton'))).toBe('boton');
    expect(tipoDeElemento(b('hotspot'))).toBe('hotspot');
  });
  it('una actividad sin tipo no revienta', () => {
    expect(tipoDeElemento(b('actividad'))).toBe('actividad');
  });
});

const ctxDe = (bloques: Block[]) =>
  crearContextoDescripcion({
    variables: [{ id: 'v1', nombre: 'intentos', tipo: 'numero', valorInicial: 0 }],
    bloques,
    capas: [{ id: 'c1', nombre: 'Ayuda' }],
    slidesDelMazo: [{ id: 's2', titulo: 'Slide 2 — Refuerzo' }],
    etiquetaTipo: (x) => (x.tipo === 'boton' ? 'Botón' : x.tipo),
  });

describe('describirRegla con el contexto del editor (N3)', () => {
  it('nombra slide, variable, bloque y capa; la plantilla de refuerzo sigue legible', () => {
    const base = aplicarPlantilla([b('actividad')], 0, { tipo: 'refuerzo', slideRefuerzoId: 's2' });
    expect(describirRegla(base[0]!.disparadores![0]!, ctxDe(base))).toBe(
      'Cuando se responde mal → ir a Slide 2 — Refuerzo',
    );
    const bloques = conIdsCandidatos([b('boton')]);
    const r: Regla = {
      id: 'r',
      evento: 'clic',
      activa: true,
      condiciones: [],
      acciones: [
        { tipo: 'sumar_variable', variableId: 'v1', cantidad: 1 },
        { tipo: 'abrir_capa', capaId: 'c1' },
        { tipo: 'ocultar', bloqueId: idDe(bloques[0]!)! },
      ],
      sino: [{ tipo: 'alternar_variable', variableId: 'v_borrada' }],
    };
    expect(describirRegla(r, ctxDe(bloques))).toBe(
      'Cuando se hace clic → sumar 1 a «intentos», abrir la capa «Ayuda», ocultar Botón (elemento 1); si no → invertir «(eliminado)» (sí/no)',
    );
  });
});

describe('«revelar» marca el objetivo como oculto al empezar (N3)', () => {
  it('solo el objetivo recibe ocultoInicial, no los hotspots ni los demás', () => {
    const out = aplicarPlantilla([b('hotspot'), b('hotspot'), b('texto'), b('texto')], 0, {
      tipo: 'revelar',
      hotspotIndices: [0, 1],
      objetivoIndex: 2,
    });
    expect((out[2] as { ocultoInicial?: boolean }).ocultoInicial).toBe(true);
    expect([0, 1, 3].every((i) => !('ocultoInicial' in out[i]!))).toBe(true);
  });
});

const reglaBuilder = (bloquePistaId: string, botonId: string): Regla => ({
  id: 'r_docente',
  evento: 'clic',
  activa: true,
  condiciones: [
    {
      tipo: 'o',
      condiciones: [
        { tipo: 'comparacion', operador: '>=', izquierda: { tipo: 'variable', variableId: 'v1' }, derecha: { tipo: 'literal', valor: 3 } },
        { tipo: 'comparacion', operador: '==', izquierda: { tipo: 'estado_bloque', bloqueId: botonId }, derecha: { tipo: 'literal', valor: 'visitado' } },
      ],
    },
  ],
  acciones: [{ tipo: 'mostrar', bloqueId: bloquePistaId }],
  sino: [{ tipo: 'sumar_variable', variableId: 'v1', cantidad: 1 }],
});

describe('guardarRegla (N3)', () => {
  const armar = () => {
    const bloques = [b('boton'), b('texto'), b('texto')];
    const cand = conIdsCandidatos(bloques);
    const regla = reglaBuilder(idDe(cand[1]!)!, idDe(cand[0]!)!);
    return { bloques, cand, regla };
  };

  it('da id solo al dueño y a lo que la regla nombra; el resto queda igual', () => {
    const { bloques, cand, regla } = armar();
    const out = guardarRegla(bloques, cand, 0, regla, { ocultarAlEmpezar: [idDe(cand[1]!)!] });
    expect(idDe(out[0]!)).toBe(idDe(cand[0]!));
    expect(idDe(out[1]!)).toBe(idDe(cand[1]!));
    expect(out[2]).toBe(bloques[2]); // ni referencia nueva: intacto
    expect(idDe(out[2]!)).toBeUndefined();
    expect((out[1] as { ocultoInicial?: boolean }).ocultoInicial).toBe(true);
    expect(out[0]!.disparadores).toEqual([regla]);
    expect(reglasConReferenciasRotas([slideDe(out)], [{ id: 'v1', nombre: 'i', tipo: 'numero', valorInicial: 0 }])).toEqual([]);
  });

  it('editar reemplaza en su sitio (incluso si cambia el id) y no duplica', () => {
    const { bloques, cand, regla } = armar();
    const una = guardarRegla(bloques, cand, 0, regla);
    const editada = { ...regla, id: 'r_nuevo', activa: false };
    const dos = guardarRegla(una, conIdsCandidatos(una), 0, editada, { idAnterior: 'r_docente' });
    expect(dos[0]!.disparadores).toEqual([editada]);
  });

  it('no muta la entrada', () => {
    const { bloques, cand, regla } = armar();
    const antes = JSON.stringify(bloques);
    guardarRegla(bloques, cand, 0, regla);
    expect(JSON.stringify(bloques)).toBe(antes);
  });

  it('duplicar copia la regla justo después con id nuevo; mover cambia el orden', () => {
    const { bloques, cand, regla } = armar();
    const una = guardarRegla(bloques, cand, 0, regla);
    const dup = duplicarReglaDeBloque(una, 0, 'r_docente', 'r_copia');
    expect(dup[0]!.disparadores!.map((r) => r.id)).toEqual(['r_docente', 'r_copia']);
    expect(dup[0]!.disparadores![1]!.sino).toEqual(regla.sino);
    const sube = moverReglaDeBloque(dup, 0, 'r_copia', -1);
    expect(sube[0]!.disparadores!.map((r) => r.id)).toEqual(['r_copia', 'r_docente']);
    expect(moverReglaDeBloque(sube, 0, 'r_copia', -1)[0]!.disparadores!.map((r) => r.id)).toEqual([
      'r_copia',
      'r_docente',
    ]);
  });
});

describe('integridad referencial con una regla de constructor (los 3 gestos de K7b)', () => {
  const vars = [{ id: 'v1', nombre: 'i', tipo: 'numero' as const, valorInicial: 0 }];
  const montar = () => {
    const bloques = [b('boton'), b('texto')];
    const cand = conIdsCandidatos(bloques);
    const regla: Regla = {
      ...reglaBuilder(idDe(cand[1]!)!, idDe(cand[0]!)!),
      sino: [{ tipo: 'ir_a_slide', slideId: 's2' }],
    };
    const out = guardarRegla(bloques, cand, 0, regla);
    return { out, idBoton: idDe(out[0]!)!, idPista: idDe(out[1]!)! };
  };

  it('borrar el bloque objetivo desactiva la regla y se avisa; no queda colgante sin aviso', () => {
    const { out, idPista } = montar();
    const slide = { id: 's1', bloques: out };
    const r = limpiarReferenciasABloque(slide, idPista);
    expect(r.eliminadas.length + r.desactivadas.length).toBeGreaterThan(0);
    const sinPista = { ...r.resultado, bloques: r.resultado.bloques!.filter((x) => idDe(x) !== idPista) };
    // La regla mezcla la pista con otra acción: no se reescribe en silencio. Se desactiva
    // y queda marcada hasta que el docente la corrija (criterio de K7b).
    const regla = sinPista.bloques![0]!.disparadores![0]!;
    expect(regla.activa).toBe(false);
    const rotas = reglasConReferenciasRotas([sinPista, { id: 's2' }], vars);
    expect(rotas.some((x) => x.reglaId === regla.id && x.codigo === 'bloque_inexistente')).toBe(true);
  });

  it('duplicar el slide remapea ids de bloque (también dentro de condiciones y «si no»)', () => {
    const { out, idBoton } = montar();
    const slide = { id: 's1', bloques: out };
    const mapa = generarMapaDeIds(slide, (() => { let n = 0; return () => `n${n++}`; })());
    const copia = remapearIds(slide, mapa);
    const reglaCopia = copia.bloques![0]!.disparadores![0]!;
    expect(JSON.stringify(reglaCopia)).not.toContain(idBoton);
    expect(reglasConReferenciasRotas([copia, { id: 's2' }], vars)).toEqual([]);
  });

  it('borrar el slide al que va el «si no» desactiva o elimina la regla', () => {
    const { out } = montar();
    const r = limpiarReferenciasASlide([{ id: 's1', bloques: out }, { id: 's2' }], 's2');
    expect(r.eliminadas.length + r.desactivadas.length).toBe(1);
  });

  it('pegar un bloque no copia las reglas (el bloque pegado va sin disparadores)', async () => {
    const { bloqueParaPegar } = await import('@lumina/interactions');
    const { out } = montar();
    const { bloque, teniaInteracciones } = bloqueParaPegar(out[0]!, 'id_nuevo');
    expect(bloque.disparadores).toBeUndefined();
    expect((bloque as { id?: string }).id).toBe('id_nuevo');
    expect(teniaInteracciones).toBe(true);
  });
});
