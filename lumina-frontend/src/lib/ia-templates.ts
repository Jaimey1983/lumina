export type PlantillaPedagogica = 'expositiva' | 'inductiva' | 'repaso' | 'libre';

export interface PlantillaConfig {
  id: PlantillaPedagogica;
  nombre: string;
  descripcion: string;
  /** Descripción de la estructura para inyectar en el prompt. */
  estructura: string;
  /** Número de slides sugerido. */
  slideCount: number;
}

export const PLANTILLAS: PlantillaConfig[] = [
  {
    id: 'libre',
    nombre: 'Libre',
    descripcion: 'La IA define la estructura según el tema',
    estructura: 'Estructura libre según el contenido del tema',
    slideCount: 6,
  },
  {
    id: 'expositiva',
    nombre: 'Expositiva',
    descripcion: 'Presentación directa de contenido con actividad al final',
    estructura:
      'Slide 1: Portada y objetivos → Slides 2-N: Contenido por subtemas → Slide N-1: Actividad de verificación → Slide N: Cierre y conclusiones',
    slideCount: 7,
  },
  {
    id: 'inductiva',
    nombre: 'Inductiva',
    descripcion: 'Parte de un caso o ejemplo concreto hacia el concepto general',
    estructura:
      'Slide 1: Portada → Slide 2: Caso o situación problema → Slide 3: Preguntas de exploración → Slide 4-5: Desarrollo del concepto desde el caso → Slide 6: Actividad de aplicación → Slide 7: Generalización y cierre',
    slideCount: 7,
  },
  {
    id: 'repaso',
    nombre: 'Repaso',
    descripcion: 'Revisión rápida de conceptos ya vistos con actividades de refuerzo',
    estructura:
      'Slide 1: Portada y temas a repasar → Slides 2-4: Preguntas rápidas con respuestas inmediatas → Slide 5: Actividad de verificación → Slide 6: Resumen visual de conceptos clave',
    slideCount: 6,
  },
];
