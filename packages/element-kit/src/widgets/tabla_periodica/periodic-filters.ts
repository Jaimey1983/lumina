import type { ElementCategory, PeriodicElement } from '@lumina/chemistry';
import type {
  TablaPeriodicaBloque,
  TablaPeriodicaFiltroCategoria,
} from '@lumina/types/widget';

const METAL_CATEGORIES = new Set<ElementCategory>([
  'alkali_metal',
  'alkaline_earth',
  'transition_metal',
  'post_transition',
  'lanthanide',
  'actinide',
]);

export function categoriaVisible(
  el: PeriodicElement,
  filtro: TablaPeriodicaFiltroCategoria,
): boolean {
  if (filtro === 'todos') return true;
  if (filtro === 'metaloide') return el.category === 'metalloid';
  if (filtro === 'gas_noble') return el.category === 'noble_gas';
  if (filtro === 'no_metal') {
    return el.category === 'nonmetal' || el.category === 'halogen';
  }
  return METAL_CATEGORIES.has(el.category);
}

export function bloqueElemento(el: PeriodicElement): TablaPeriodicaBloque {
  if (el.z >= 57 && el.z <= 71) return 'f';
  if (el.z >= 89 && el.z <= 103) return 'f';
  if (el.category === 'transition_metal') return 'd';
  if (el.category === 'lanthanide' || el.category === 'actinide') return 'f';
  if (el.category === 'alkali_metal' || el.category === 'alkaline_earth') return 's';
  return 'p';
}

export function bloqueVisible(el: PeriodicElement, filtro: TablaPeriodicaBloque): boolean {
  if (filtro === 'todos') return true;
  return bloqueElemento(el) === filtro;
}
