import { describe, expect, it } from 'vitest';
import { cambiarEstilo, duplicar } from './edicion.js';
import { copiar, pegar, validarFragmento, type Fragmento } from './portapapeles.js';
import type { Escena } from '../tipos.js';
import { escena, forma, getForma } from './util-pruebas.js';

const conLista = (): Escena =>
  escena(
    forma('A', 0, 0, 100, 60, { texto: 'Uno\nDos', estiloTexto: { vinetas: 'puntos', alineacionH: 'derecha' } }),
    forma('B', 300, 0, 100, 60, { texto: 'Uno\nDos', estiloTexto: { vinetas: 'numeros' } }),
    forma('C', 600, 0, 100, 60, { texto: 'Sin lista' }),
  );

describe('la lista de un texto sobrevive a las operaciones de la escena', () => {
  it('la escena de prueba de verdad tiene los campos (que las demás pruebas no sean vacías)', () => {
    const e = conLista();
    expect(getForma(e, 'A').estiloTexto).toMatchObject({ vinetas: 'puntos', alineacionH: 'derecha' });
    expect(getForma(e, 'B').estiloTexto.vinetas).toBe('numeros');
    expect('vinetas' in getForma(e, 'C').estiloTexto).toBe(false);
  });

  it('copiar y pegar, también como JSON del portapapeles del sistema', () => {
    const e = conLista();
    const f = copiar(e, ['A', 'B', 'C']) as Fragmento;
    const viaJson = validarFragmento(JSON.parse(JSON.stringify(f))) as Fragmento;
    for (const frag of [f, viaJson]) {
      const { escena: pegada } = pegar(escena(), frag);
      const [a, b, c] = pegada.elementos as Array<ReturnType<typeof getForma>>;
      expect(a?.estiloTexto.vinetas).toBe('puntos');
      expect(a?.estiloTexto.alineacionH).toBe('derecha');
      expect(b?.estiloTexto.vinetas).toBe('numeros');
      expect(c && 'vinetas' in c.estiloTexto).toBe(false);
    }
  });

  it('duplicar', () => {
    const e = conLista();
    const { escena: dup, ids } = duplicar(e, ['A', 'B', 'C']);
    expect(ids.map((id) => getForma(dup, id).estiloTexto.vinetas)).toEqual(['puntos', 'numeros', undefined]);
  });

  it('poner y quitar la lista con cambiarEstilo: quitar no deja la clave', () => {
    const e = conLista();
    const con = cambiarEstilo(e, ['C'], { estiloTexto: { vinetas: 'numeros' } });
    expect(getForma(con, 'C').estiloTexto.vinetas).toBe('numeros');
    const sin = cambiarEstilo(con, ['A', 'C'], { estiloTexto: { vinetas: undefined } });
    expect('vinetas' in getForma(sin, 'A').estiloTexto).toBe(false);
    expect('vinetas' in getForma(sin, 'C').estiloTexto).toBe(false);
    expect(getForma(sin, 'B').estiloTexto.vinetas).toBe('numeros'); // lo que no se eligió no cambia
    expect(getForma(sin, 'A').estiloTexto.alineacionH).toBe('derecha'); // la alineación se conservó
  });

  it('ponerle lista a un texto no cambia su texto: la marca no se guarda en él', () => {
    const con = cambiarEstilo(conLista(), ['C'], { estiloTexto: { vinetas: 'puntos' } });
    expect(getForma(con, 'C').texto).toBe('Sin lista');
  });
});
