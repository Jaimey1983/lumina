import { AbrirCajaActivity } from '@/types/slide.types'

export function createDefaultAbrirCaja(): AbrirCajaActivity {
  return {
    tipo: 'abrir_caja',
    configuracion: {
      filas: 2,
      columnas: 3,
      colorCaja: '#2563EB',
      animacionApertura: 'flip',
    },
    cajas: [
      { id: 'caja-1', etiqueta: 'Caja 1', contenido: { texto: '¡Sorpresa!', esCorrecta: true  } },
      { id: 'caja-2', etiqueta: 'Caja 2', contenido: { texto: 'Intenta otra', esCorrecta: false } },
      { id: 'caja-3', etiqueta: 'Caja 3', contenido: { texto: '¡Sorpresa!', esCorrecta: true  } },
      { id: 'caja-4', etiqueta: 'Caja 4', contenido: { texto: 'Intenta otra', esCorrecta: false } },
      { id: 'caja-5', etiqueta: 'Caja 5', contenido: { texto: '¡Sorpresa!', esCorrecta: true  } },
      { id: 'caja-6', etiqueta: 'Caja 6', contenido: { texto: 'Intenta otra', esCorrecta: false } },
    ],
  }
}
