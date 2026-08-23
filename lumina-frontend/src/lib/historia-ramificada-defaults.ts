import { HistoriaRamificadaActivity } from '@/types/slide.types'

export function createDefaultHistoriaRamificada(): HistoriaRamificadaActivity {
  return {
    tipo: 'historia_ramificada',
    configuracion: {
      mostrarProgreso: true,
      permitirRetroceder: false,
      tema: 'neutro',
    },
    nodoInicial: 'nodo-inicio',
    nodos: [
      {
        id: 'nodo-inicio',
        tipo: 'narracion',
        titulo: 'Inicio',
        contenido: { texto: 'Era una noche oscura y tormentosa. ¿Qué harás?' },
        opciones: [
          { id: 'op-1a', texto: 'Entrar al castillo', esCorrecta: true },
          { id: 'op-1b', texto: 'Regresar al pueblo' },
        ],
        editorX: 250,
        editorY: 50,
      },
      {
        id: 'nodo-castillo',
        tipo: 'decision',
        titulo: 'El castillo',
        contenido: { texto: 'Encuentras dos puertas. Una roja y una azul.' },
        opciones: [
          { id: 'op-2a', texto: 'Puerta roja' },
          { id: 'op-2b', texto: 'Puerta azul' },
        ],
        editorX: 100,
        editorY: 220,
      },
      {
        id: 'nodo-pueblo',
        tipo: 'final_malo',
        titulo: 'Fin',
        contenido: { texto: 'Regresaste al pueblo. La aventura termina aquí.' },
        editorX: 400,
        editorY: 220,
      },
      {
        id: 'nodo-final-bueno',
        tipo: 'final_bueno',
        titulo: '¡Victoria!',
        contenido: { texto: '¡Encontraste el tesoro escondido!' },
        editorX: 100,
        editorY: 390,
      },
    ],
    conexiones: [
      { id: 'con-1', desdeNodoId: 'nodo-inicio',    opcionId: 'op-1a', haciaNodoId: 'nodo-castillo' },
      { id: 'con-2', desdeNodoId: 'nodo-inicio',    opcionId: 'op-1b', haciaNodoId: 'nodo-pueblo' },
      { id: 'con-3', desdeNodoId: 'nodo-castillo',  opcionId: 'op-2a', haciaNodoId: 'nodo-final-bueno' },
    ],
  }
}
