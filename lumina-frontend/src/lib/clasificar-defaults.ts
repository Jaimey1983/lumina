import { ClasificarActivity } from '@/types/slide.types';

export function createDefaultClasificar(): ClasificarActivity {
  return {
    tipo: 'clasificar',
    configuracion: {
      columnas: 3,
      colorCategorias: ['#2563EB', '#16A34A', '#DC2626', '#D97706'],
      permitirReintento: true,
    },
    categorias: [
      { id: 'cat-1', nombre: 'Categoría 1' },
      { id: 'cat-2', nombre: 'Categoría 2' },
      { id: 'cat-3', nombre: 'Categoría 3' },
    ],
    items: [
      { id: 'item-1', texto: 'Elemento 1', categoriaId: 'cat-1' },
      { id: 'item-2', texto: 'Elemento 2', categoriaId: 'cat-1' },
      { id: 'item-3', texto: 'Elemento 3', categoriaId: 'cat-2' },
      { id: 'item-4', texto: 'Elemento 4', categoriaId: 'cat-2' },
      { id: 'item-5', texto: 'Elemento 5', categoriaId: 'cat-3' },
      { id: 'item-6', texto: 'Elemento 6', categoriaId: 'cat-3' },
    ],
  };
}
