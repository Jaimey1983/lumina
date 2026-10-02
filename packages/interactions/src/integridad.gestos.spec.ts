import { describe, expect, it } from 'vitest';
import {
  bloqueParaPegar,
  generarMapaDeIds,
  limpiarReferenciasABloque,
  limpiarReferenciasASlide,
  remapearIds,
  reglasConReferenciasRotas,
} from './integridad.js';
import type { SlideMotor } from './integridad.js';
import {
  plantillaBotonNavega,
  plantillaIrARefuerzo,
  plantillaRevelarAlVisitarTodo,
} from './plantillas.js';
import type { ResultadoPlantilla } from './plantillas.js';
import { bloque, slide } from './prueba-utils.js';
import type { Block } from '@lumina/types/slide';

/** Reparte las reglas de una plantilla en los `disparadores` de sus bloques dueños. */
function aplicar(slides: SlideMotor[], r: ResultadoPlantilla): SlideMotor[] {
  return slides.map((s) => ({
    ...s,
    bloques: s.bloques?.map((b) => {
      const propias = r.reglas
        .filter((x) => x.bloqueId === (b as { id?: string }).id)
        .map((x) => x.regla);
      return propias.length
        ? ({ ...b, disparadores: [...(b.disparadores ?? []), ...propias] } as Block)
        : b;
    }),
  }));
}

/**
 * Mazo: 3 slides, 6 bloques.
 *   s1: btn (botón → s2) · quiz (si falla → refuerzo s3)
 *   s2: h1, h2 (hotspots) y premio — «revelar al visitar todo»
 *   s3: volver (botón → s3: «intentar otra vez», una referencia a SÍ MISMO)
 */
function mazo(): SlideMotor[] {
  let slides: SlideMotor[] = [
    slide('s1', { bloques: [bloque('btn'), bloque('quiz')] }),
    slide('s2', { bloques: [bloque('h1'), bloque('h2'), bloque('premio')] }),
    slide('s3', { bloques: [bloque('volver')] }),
  ];
  slides = aplicar(slides, plantillaBotonNavega({ bloqueId: 'btn', destino: { tipo: 'slide', slideId: 's2' } }));
  slides = aplicar(slides, plantillaIrARefuerzo({ bloqueId: 'quiz', slideRefuerzoId: 's3' }));
  slides = aplicar(slides, plantillaRevelarAlVisitarTodo({ hotspotIds: ['h1', 'h2'], objetivoId: 'premio' }));
  slides = aplicar(slides, plantillaBotonNavega({ bloqueId: 'volver', destino: { tipo: 'slide', slideId: 's3' } }));
  return slides;
}

const contador = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('integridad referencial: los gestos del editor no dejan referencias rotas', () => {
  it('el mazo de partida está sano', () => {
    expect(reglasConReferenciasRotas(mazo(), [])).toEqual([]);
  });

  it('duplicar slide: ids nuevos, reglas internas remapeadas y autorreferencia reapuntada a la copia', () => {
    const slides = mazo();
    const nuevoId = contador();
    const original = slides[2]!;
    const mapa = generarMapaDeIds(original, nuevoId);
    // Fase 1 (antes del alta en el servidor): ids de bloque/regla nuevos; la regla
    // `volver → s3` sigue apuntando al ORIGINAL (un id que existe).
    const copiaFase1 = { ...remapearIds(original, mapa), id: 'copia-sin-id-aun' };
    const fase1 = [...slides, copiaFase1];
    expect(reglasConReferenciasRotas(fase1, [])).toEqual([]);
    // Fase 2 (segundo PATCH con el id definitivo): se reapunta a la copia.
    const copiaFinal = { ...remapearIds(copiaFase1, { slides: { s3: 's3-copia' } }), id: 's3-copia' };
    const fase2 = [...slides, copiaFinal];
    expect(reglasConReferenciasRotas(fase2, [])).toEqual([]);
    const regla = copiaFinal.bloques?.[0]?.disparadores?.[0];
    expect(regla?.acciones).toEqual([{ tipo: 'ir_a_slide', slideId: 's3-copia' }]);
    // el original sigue apuntando a sí mismo
    expect(slides[2]?.bloques?.[0]?.disparadores?.[0]?.acciones).toEqual([
      { tipo: 'ir_a_slide', slideId: 's3' },
    ]);
  });

  it('duplicar un slide con reglas internas no repite ids de bloque ni de regla en el mazo', () => {
    const slides = mazo();
    const mapa = generarMapaDeIds(slides[1]!, contador());
    const copia = { ...remapearIds(slides[1]!, mapa), id: 's2-copia' };
    expect(reglasConReferenciasRotas([...slides, copia], [])).toEqual([]);
    // la copia reacciona a SUS hotspots y revela SU premio
    const r = copia.bloques?.[0]?.disparadores?.[0];
    expect(r?.acciones).toEqual([{ tipo: 'mostrar', bloqueId: mapa.bloques.premio }]);
  });

  it('pegar un bloque: no hereda disparadores', () => {
    const slides = mazo();
    const btn = slides[0]!.bloques![0]!;
    const { bloque: pegado, teniaInteracciones } = bloqueParaPegar(btn, 'btn-pegado');
    expect(teniaInteracciones).toBe(true);
    const s1 = { ...slides[0]!, bloques: [...slides[0]!.bloques!, pegado] };
    expect(reglasConReferenciasRotas([s1, slides[1]!, slides[2]!], [])).toEqual([]);
    expect(pegado.disparadores).toBeUndefined();
  });

  it('borrar bloque: las reglas cuyo único objetivo era el bloque se van', () => {
    const slides = mazo();
    // Se borra «premio»: las reglas de h1 y h2 solo apuntaban a él.
    const s2 = slides[1]!;
    const sinPremio = { ...s2, bloques: s2.bloques!.filter((b) => (b as { id?: string }).id !== 'premio') };
    const r = limpiarReferenciasABloque(sinPremio, 'premio');
    expect(r.eliminadas).toHaveLength(2);
    expect(reglasConReferenciasRotas([slides[0]!, r.resultado, slides[2]!], [])).toEqual([]);
  });

  it('borrar slide: la regla que iba a ese slide se va', () => {
    const slides = mazo();
    // Se borra s3 (refuerzo): `quiz` solo iba allí.
    const restantes = slides.filter((s) => s.id !== 's3');
    const r = limpiarReferenciasASlide(restantes, 's3');
    expect(r.eliminadas).toHaveLength(1);
    expect(r.slidesCambiados).toEqual(['s1']);
    expect(reglasConReferenciasRotas(r.resultado, [])).toEqual([]);
  });

  it('el recorrido completo (duplicar, pegar, borrar bloque, borrar slide) termina con reglasConReferenciasRotas == []', () => {
    let slides = mazo();
    const nuevoId = contador();

    // 1) duplicar s3 (con autorreferencia) y reapuntar en el «segundo guardado»
    const m3 = generarMapaDeIds(slides[2]!, nuevoId);
    const c3 = remapearIds({ ...slides[2]!, id: 's3-copia' }, { ...m3, slides: { s3: 's3-copia' } });
    slides = [...slides, c3];

    // 2) duplicar s2 (sus hotspots y su premio tienen ids nuevos)
    const m2 = generarMapaDeIds(slides[1]!, nuevoId);
    const c2 = remapearIds({ ...slides[1]!, id: 's2-copia' }, m2);
    slides = [...slides, c2];

    // 3) pegar `btn` en s1
    const { bloque: pegado } = bloqueParaPegar(slides[0]!.bloques![0]!, nuevoId());
    slides = [{ ...slides[0]!, bloques: [...slides[0]!.bloques!, pegado] }, ...slides.slice(1)];
    expect(reglasConReferenciasRotas(slides, [])).toEqual([]);

    // 4) borrar `premio` del s2 original
    slides = slides.map((s) =>
      s.id === 's2'
        ? limpiarReferenciasABloque(
            { ...s, bloques: s.bloques!.filter((b) => (b as { id?: string }).id !== 'premio') },
            'premio',
          ).resultado
        : s,
    );
    expect(reglasConReferenciasRotas(slides, [])).toEqual([]);

    // 5) borrar el slide de refuerzo original (s3): `quiz` solo iba allí
    slides = limpiarReferenciasASlide(
      slides.filter((s) => s.id !== 's3'),
      's3',
    ).resultado;
    expect(reglasConReferenciasRotas(slides, [])).toEqual([]);

    // 6) borrar la copia de s3 y s2 original: `btn` (→ s2) ya no tiene destino
    slides = limpiarReferenciasASlide(
      slides.filter((s) => s.id !== 's2'),
      's2',
    ).resultado;
    expect(reglasConReferenciasRotas(slides, [])).toEqual([]);
  });
});
