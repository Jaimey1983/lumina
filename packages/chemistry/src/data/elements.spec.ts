import { describe, expect, it } from 'vitest';
import { getAllElements, getElementBySymbol, getElementsMetadata } from './elements.js';

describe('elements dataset', () => {
  it('tiene 118 elementos', () => {
    expect(getAllElements()).toHaveLength(118);
    expect(getElementsMetadata().elementCount).toBe(118);
  });

  it('incluye metadatos IUPAC', () => {
    expect(getElementsMetadata().sourceVersion).toMatch(/IUPAC/);
  });

  it('resuelve Fe', () => {
    const fe = getElementBySymbol('Fe');
    expect(fe?.name).toBe('Hierro');
    expect(fe?.z).toBe(26);
  });

  it('asigna el grupo IUPAC correcto (La/Ac = 3, bloque f = null)', () => {
    const grupo = (sym: string) => getElementBySymbol(sym)?.group;
    expect(grupo('H')).toBe(1);
    expect(grupo('He')).toBe(18);
    expect(grupo('B')).toBe(13);
    expect(grupo('Zn')).toBe(12);
    expect(grupo('La')).toBe(3);
    expect(grupo('Ac')).toBe(3);
    expect(grupo('Hf')).toBe(4);
    expect(grupo('Og')).toBe(18);
    for (const sym of ['Ce', 'Gd', 'Lu', 'Th', 'U', 'Lr']) expect(grupo(sym)).toBeNull();
  });

  it('no repite (período, grupo) en el cuerpo principal', () => {
    const celdas = getAllElements()
      .filter((e) => e.group !== null)
      .map((e) => `${e.period}:${e.group}`);
    expect(new Set(celdas).size).toBe(celdas.length);
    expect(celdas).toHaveLength(90);
  });

  it('fija la categoría de los 118 elementos', () => {
    const porCategoria = (cat: string) =>
      getAllElements()
        .filter((e) => e.category === cat)
        .map((e) => e.symbol);
    expect(porCategoria('metalloid')).toEqual(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);
    expect(porCategoria('nonmetal')).toEqual(['H', 'C', 'N', 'O', 'P', 'S', 'Se']);
    expect(porCategoria('post_transition')).toEqual([
      'Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Po', 'Nh', 'Fl', 'Mc', 'Lv',
    ]);
    expect(porCategoria('halogen')).toEqual(['F', 'Cl', 'Br', 'I', 'At', 'Ts']);
    expect(porCategoria('noble_gas')).toEqual(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
    expect(porCategoria('lanthanide')).toHaveLength(15);
    expect(porCategoria('actinide')).toHaveLength(15);
    expect(porCategoria('transition_metal')).toHaveLength(38);
  });

  it('usa los nombres en español correctos', () => {
    expect(getElementBySymbol('Zn')?.name).toBe('Zinc');
    expect(getElementBySymbol('Er')?.name).toBe('Erbio');
    expect(getElementBySymbol('Ta')?.name).toBe('Tántalo');
  });

  it('incluye fusión, ebullición y descubridor', () => {
    const hg = getElementBySymbol('Hg');
    expect(hg?.meltK).toBeCloseTo(234.32, 1);
    expect(hg?.boilK).toBeCloseTo(629.88, 1);
    expect(getElementBySymbol('Au')?.discoveredBy).toBe('Conocido desde la antigüedad');
    expect(getElementBySymbol('Og')?.meltK ?? null).toBeNull();
  });
});
