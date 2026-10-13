import type { ProblemaPasosActivity } from '@lumina/types/slide';

export function createDefaultProblemaPasos(): ProblemaPasosActivity {
  return {
    tipo: 'problema_pasos',
    enunciado: 'Un terreno rectangular mide 5 m de base y 3 m de alto. Se quiere cubrir con pasto que cuesta $2.000 el m².',
    secuencial: true,
    pasos: [
      {
        id: 'paso-1',
        instruccion: '¿Cuál es el área del terreno?',
        modo: 'numerico',
        respuesta: '15',
        unidad: 'm²',
        pistas: ['El área de un rectángulo es base × altura.', 'Multiplica 5 por 3.'],
      },
      {
        id: 'paso-2',
        instruccion: '¿Cuánto cuesta cubrir todo el terreno?',
        modo: 'numerico',
        respuesta: '30000',
        unidad: '$',
        pistas: ['Multiplica el área por el precio de cada m².'],
      },
      {
        id: 'paso-3',
        instruccion: 'Si el terreno fuera un cuadrado de lado x, escribe el costo en función de x.',
        modo: 'algebraico',
        respuesta: '2000x^2',
        pistas: ['El área de un cuadrado es lado por lado.'],
      },
    ],
  };
}
