import { describe, expect, it } from 'vitest';
import { crearEstadoInicial } from './estado.js';
import { procesarEvento } from './motor.js';
import {
  fusionarReglas,
  plantillaBotonNavega,
  plantillaDeRegla,
  plantillaIrARefuerzo,
  plantillaRevelarAlVisitarTodo,
} from './plantillas.js';
import type { ResultadoPlantilla } from './plantillas.js';
import { bloque, slide } from './prueba-utils.js';
import { contextoDesdeSlides } from './recolectar.js';
import type { ReglaAplicable } from './tipos.js';
import { validarReglas } from './validar.js';

/** Monta las reglas de una plantilla en un slide `s1` y la valida con `validarReglas`. */
function montar(r: ResultadoPlantilla, ids: string[], extraSlides: string[] = []) {
  const bloques = ids.map((id) => {
    const propias = r.reglas.filter((x) => x.bloqueId === id).map((x) => x.regla);
    return bloque(id, propias.length ? { disparadores: propias } : {});
  });
  const slides = [slide('s1', { bloques }), ...extraSlides.map((s) => slide(s))];
  const aplicables: ReglaAplicable[] = r.reglas.map(({ bloqueId, regla }) => ({
    regla,
    origen: { tipo: 'bloque', bloqueId, slideId: 's1' },
  }));
  return { slides, aplicables, ctx: contextoDesdeSlides(r.variables, slides) };
}

describe('plantillas (K7b)', () => {
  it('«Un botón que lleva a…» genera una regla válida para cada destino', () => {
    for (const destino of [
      { tipo: 'slide', slideId: 's2' } as const,
      { tipo: 'siguiente' } as const,
      { tipo: 'anterior' } as const,
    ]) {
      const r = plantillaBotonNavega({ bloqueId: 'btn', destino });
      const { aplicables, ctx } = montar(r, ['btn'], ['s2']);
      expect(validarReglas(aplicables, ctx)).toEqual([]);
      expect(r.reglas[0]?.regla.evento).toBe('clic');
    }
  });

  it('el botón ejecuta la navegación en el motor', () => {
    const r = plantillaBotonNavega({
      bloqueId: 'btn',
      destino: { tipo: 'slide', slideId: 's2' },
    });
    const { aplicables } = montar(r, ['btn'], ['s2']);
    const res = procesarEvento(
      aplicables,
      crearEstadoInicial([]),
      { tipo: 'clic', bloqueId: 'btn', slideId: 's1' },
      { variables: [] },
    );
    expect(res.efectos).toEqual([
      { tipo: 'navegar', destino: { tipo: 'slide', slideId: 's2' } },
    ]);
  });

  it('«Ir a refuerzo si falla» solo reacciona a la respuesta incorrecta', () => {
    const r = plantillaIrARefuerzo({ bloqueId: 'quiz', slideRefuerzoId: 's2' });
    const { aplicables, ctx } = montar(r, ['quiz'], ['s2']);
    expect(validarReglas(aplicables, ctx)).toEqual([]);
    const corre = (tipo: 'respuesta_correcta' | 'respuesta_incorrecta') =>
      procesarEvento(
        aplicables,
        crearEstadoInicial([]),
        { tipo, bloqueId: 'quiz', slideId: 's1' },
        { variables: [] },
      ).efectos;
    expect(corre('respuesta_correcta')).toEqual([]);
    expect(corre('respuesta_incorrecta')).toHaveLength(1);
  });

  describe('«Revelar al visitar todo»', () => {
    const r = plantillaRevelarAlVisitarTodo({
      hotspotIds: ['h1', 'h2', 'h3'],
      objetivoId: 'premio',
    });

    it('pone una regla en cada hotspot y es válida', () => {
      expect(r.reglas.map((x) => x.bloqueId)).toEqual(['h1', 'h2', 'h3']);
      const { aplicables, ctx } = montar(r, ['h1', 'h2', 'h3', 'premio']);
      expect(validarReglas(aplicables, ctx)).toEqual([]);
    });

    it('solo muestra el objetivo cuando el último hotspot se visita', () => {
      const { aplicables } = montar(r, ['h1', 'h2', 'h3', 'premio']);
      let estado = crearEstadoInicial([]);
      for (const h of ['h1', 'h2']) {
        const res = procesarEvento(
          aplicables,
          estado,
          { tipo: 'visitado', bloqueId: h, slideId: 's1' },
          { variables: [] },
        );
        estado = res.estado;
        expect(estado.visibles.premio).toBeUndefined();
      }
      const fin = procesarEvento(
        aplicables,
        estado,
        { tipo: 'visitado', bloqueId: 'h3', slideId: 's1' },
        { variables: [] },
      );
      expect(fin.estado.visibles.premio).toBe(true);
    });

    it('ignora duplicados, vacíos y al objetivo como hotspot; sin hotspots no genera nada', () => {
      const x = plantillaRevelarAlVisitarTodo({
        hotspotIds: ['h1', 'h1', '', 'premio'],
        objetivoId: 'premio',
      });
      expect(x.reglas.map((y) => y.bloqueId)).toEqual(['h1']);
      expect(
        plantillaRevelarAlVisitarTodo({ hotspotIds: [], objetivoId: 'p' }).reglas,
      ).toEqual([]);
    });
  });

  it('los ids son deterministas y reaplicar una plantilla no duplica reglas', () => {
    const args = { bloqueId: 'btn', destino: { tipo: 'siguiente' } as const };
    const a = plantillaBotonNavega(args);
    const b = plantillaBotonNavega(args);
    expect(a).toEqual(b);
    const ya = a.reglas.map((x) => x.regla);
    const distinta = plantillaBotonNavega({ bloqueId: 'btn', destino: { tipo: 'anterior' } });
    const fusion = fusionarReglas(ya, distinta.reglas.map((x) => x.regla));
    expect(fusion).toHaveLength(1);
    expect(fusion[0]?.acciones).toEqual([{ tipo: 'anterior' }]);
  });

  it('fusionarReglas conserva el orden y agrega las nuevas al final', () => {
    const base = plantillaBotonNavega({ bloqueId: 'a', destino: { tipo: 'siguiente' } }).reglas[0]!.regla;
    const otra = plantillaBotonNavega({ bloqueId: 'b', destino: { tipo: 'siguiente' } }).reglas[0]!.regla;
    expect(fusionarReglas([base], [otra]).map((r) => r.id)).toEqual([base.id, otra.id]);
    expect(fusionarReglas(undefined, [base])).toEqual([base]);
  });

  it('plantillaDeRegla reconoce los ids de plantilla', () => {
    expect(plantillaDeRegla('tpl:refuerzo:q1')).toBe('refuerzo');
    expect(plantillaDeRegla('legacy-boton-accion')).toBeNull();
  });
});
