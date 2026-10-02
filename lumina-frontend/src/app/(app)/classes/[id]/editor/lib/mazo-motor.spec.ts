import { describe, expect, it } from 'vitest';
import { reglasConReferenciasRotas } from '@lumina/interactions';
import type { Block } from '@lumina/types/slide';
import type { Regla } from '@lumina/types/interaction';

import {
  comoSlideMotor,
  contenidoParaCopia,
  dependenciasDeSlide,
  limpiarMazoTrasBorrarSlide,
  limpiarSlideTrasBorrarBloque,
  reapuntarACopia,
} from './mazo-motor';

const regla = (id: string, evento: Regla['evento'], acciones: Regla['acciones']): Regla => ({
  id,
  evento,
  condiciones: [],
  acciones,
  activa: true,
});
const bloque = (id: string, extra: object = {}) =>
  ({ tipo: 'texto', contenido: 'x', id, ...extra }) as unknown as Block;

const contador = () => {
  let n = 0;
  return () => `n${++n}`;
};

describe('editor: duplicar y borrar slides sin referencias rotas (K7b)', () => {
  // s3 se refiere a sí mismo; s1 manda a s3 como refuerzo.
  const s1 = {
    id: 's1',
    content: {
      layout: 'x',
      bloques: [
        bloque('quiz', { disparadores: [regla('tpl:refuerzo:quiz', 'respuesta_incorrecta', [{ tipo: 'ir_a_slide', slideId: 's3' }])] }),
      ],
    },
  };
  const s3 = {
    id: 's3',
    content: {
      layout: 'y',
      fondo: { tipo: 'color', valor: '#fff' },
      bloques: [
        bloque('otra', { disparadores: [regla('tpl:boton-navega:otra', 'clic', [{ tipo: 'ir_a_slide', slideId: 's3' }])] }),
      ],
    },
  };
  const mazo = () => [s1, s3].map((s) => comoSlideMotor(s.id, s.content));

  it('duplicar: la copia tiene ids propios y, tras el segundo guardado, apunta a sí misma', () => {
    const copiaInicial = contenidoParaCopia(s3.content, 's3', contador());
    expect(copiaInicial.layout).toBe('y');
    expect(copiaInicial.fondo).toEqual(s3.content.fondo);
    const fase1 = [...mazo(), comoSlideMotor('copia', copiaInicial)];
    expect(reglasConReferenciasRotas(fase1, [])).toEqual([]);

    const { contenido, cambio } = reapuntarACopia(copiaInicial, 's3', 'copia');
    expect(cambio).toBe(true);
    const copiaFinal = comoSlideMotor('copia', contenido);
    const r = copiaFinal.bloques?.[0]?.disparadores?.[0];
    expect(r?.acciones).toEqual([{ tipo: 'ir_a_slide', slideId: 'copia' }]);
    expect(reglasConReferenciasRotas([...mazo(), copiaFinal], [])).toEqual([]);
    // el original no se tocó
    expect(JSON.stringify(s3.content)).toContain('"slideId":"s3"');
  });

  it('un slide sin autorreferencias no necesita segundo guardado', () => {
    const { cambio } = reapuntarACopia(contenidoParaCopia(s1.content, 's1', contador()), 's1', 'c');
    expect(cambio).toBe(false);
  });

  it('borrar slide: avisa de quién depende y limpia solo los slides afectados', () => {
    expect(dependenciasDeSlide(mazo(), 's3').map((d) => d.reglaId)).toEqual(['tpl:refuerzo:quiz']);
    const r = limpiarMazoTrasBorrarSlide([s1, s3], 's3');
    expect(r.eliminadas).toEqual(['tpl:refuerzo:quiz']);
    expect(r.cambios.map((c) => c.slideId)).toEqual(['s1']);
    expect(r.cambios[0]?.contenido.layout).toBe('x');
    const restantes = [comoSlideMotor('s1', r.cambios[0]!.contenido)];
    expect(reglasConReferenciasRotas(restantes, [])).toEqual([]);
  });

  it('borrar bloque: solo devuelve `reglas` de slide si cambiaron', () => {
    const conReglaDeSlide = limpiarSlideTrasBorrarBloque(
      's1',
      [],
      { reglas: [regla('r', 'al_entrar_slide', [{ tipo: 'ocultar', bloqueId: 'gone' }])] },
      'gone',
    );
    expect(conReglaDeSlide.reglas).toEqual([]);
    expect(conReglaDeSlide.eliminadas).toEqual(['r']);
    const sinCambio = limpiarSlideTrasBorrarBloque('s1', [], {}, 'gone');
    expect(sinCambio.reglas).toBeUndefined();
  });
});
