import type { ElementPreset } from "@lumina/element-kit-core";
import type { AccordionEstado } from "./accordion-types.js";

export const ACCORDION_PRESETS: readonly ElementPreset<AccordionEstado>[] = [
  {
    id: "preguntas-frecuentes",
    label: "Preguntas Frecuentes (FAQ)",
    description: "Modo exclusivo con tarjetas estilizadas para resolver dudas comunes",
    patch: {
      tituloWidget: "Preguntas Frecuentes",
      subtituloWidget: "Respuestas claras a las dudas más habituales sobre el tema",
      instruccion: "Haz clic en una pregunta para ver la respuesta detallada.",
      configuracion: {
        modo: "exclusivo",
        permitirColapsarTodo: true,
        estiloVisual: "tarjetas",
        posicionIcono: "derecha",
        tamanoIcono: "md",
        animacionExpandir: true,
        mostrarTituloWidget: true,
        mostrarSubtitulo: true,
        mostrarInstruccion: true,
        mostrarImagenes: false,
        secciones: [
          {
            id: "faq-1",
            titulo: "¿Cuál es el objetivo principal de este módulo?",
            contenido:
              "Comprender los fundamentos teóricos y dominar las herramientas prácticas que te permitirán analizar problemas complejos de forma sistemática.",
            abiertoPorDefecto: true,
          },
          {
            id: "faq-2",
            titulo: "¿Qué requisitos previos son necesarios?",
            contenido:
              "Haber completado la introducción general y disponer de acceso a la plataforma con los permisos estándar de estudiante.",
            abiertoPorDefecto: false,
          },
          {
            id: "faq-3",
            titulo: "¿Cómo se evalúa el progreso?",
            contenido:
              "A través de actividades prácticas integradas, retos de autoevaluación y la entrega del proyecto final.",
            abiertoPorDefecto: false,
          },
        ],
      },
    } as unknown as Partial<AccordionEstado>,
  },
  {
    id: "glosario-conceptos",
    label: "Glosario de Conceptos",
    description: "Modo múltiple con separadores minimalistas para explorar definiciones",
    patch: {
      tituloWidget: "Glosario Temático",
      subtituloWidget: "Términos fundamentales y sus definiciones clave",
      instruccion: "Expande los términos que desees repasar o comparar entre sí.",
      configuracion: {
        modo: "multiple",
        permitirColapsarTodo: true,
        estiloVisual: "separadores",
        posicionIcono: "derecha",
        tamanoIcono: "sm",
        animacionExpandir: true,
        mostrarTituloWidget: true,
        mostrarSubtitulo: true,
        mostrarInstruccion: true,
        mostrarImagenes: false,
        secciones: [
          {
            id: "glo-1",
            titulo: "Epistemología",
            contenido:
              "Rama de la filosofía que estudia los principios, fundamentos, extensión y métodos del conocimiento humano.",
            abiertoPorDefecto: false,
          },
          {
            id: "glo-2",
            titulo: "Heurística",
            contenido:
              "Conjunto de técnicas o métodos para resolver problemas prácticos mediante el descubrimiento, la creatividad o el pensamiento lateral.",
            abiertoPorDefecto: false,
          },
          {
            id: "glo-3",
            titulo: "Sesgo de confirmación",
            contenido:
              "Tendencia a favorecer, buscar, interpretar y recordar la información que confirma las propias creencias o hipótesis previas.",
            abiertoPorDefecto: false,
          },
        ],
      },
    } as unknown as Partial<AccordionEstado>,
  },
  {
    id: "pasos-procedimiento",
    label: "Pasos de Procedimiento",
    description: "Contenedor bordeado con chevron a la izquierda para guías metódicas",
    patch: {
      tituloWidget: "Guía de Procedimiento",
      subtituloWidget: "Secuencia metódica de pasos a seguir",
      instruccion: "Revisa cada fase en orden para garantizar la ejecución correcta.",
      configuracion: {
        modo: "exclusivo",
        permitirColapsarTodo: false,
        estiloVisual: "bordeado",
        posicionIcono: "izquierda",
        tamanoIcono: "md",
        animacionExpandir: true,
        mostrarTituloWidget: true,
        mostrarSubtitulo: true,
        mostrarInstruccion: true,
        mostrarImagenes: false,
        secciones: [
          {
            id: "paso-1",
            titulo: "Fase 1: Diagnóstico inicial y recolección de datos",
            contenido:
              "Identificar las variables críticas, registrar mediciones de línea base y documentar cualquier anomalía previa a la intervención.",
            abiertoPorDefecto: true,
          },
          {
            id: "paso-2",
            titulo: "Fase 2: Planificación y modelado de alternativas",
            contenido:
              "Diseñar las posibles rutas de acción ponderando costos, tiempos estimados y riesgos asociados a cada alternativa.",
            abiertoPorDefecto: false,
          },
          {
            id: "paso-3",
            titulo: "Fase 3: Implementación y validación empírica",
            contenido:
              "Ejecutar la solución seleccionada en un entorno controlado y verificar los indicadores de desempeño frente a los objetivos.",
            abiertoPorDefecto: false,
          },
        ],
      },
    } as unknown as Partial<AccordionEstado>,
  },
  {
    id: "modulos-ilustrados",
    label: "Módulos Ilustrados",
    description: "Tarjetas amplias preparadas para acompañar explicaciones con imágenes",
    patch: {
      tituloWidget: "Módulos de Aprendizaje",
      subtituloWidget: "Unidades temáticas con recursos visuales de soporte",
      instruccion: "Abre cada módulo para visualizar su descripción y material gráfico.",
      configuracion: {
        modo: "multiple",
        permitirColapsarTodo: true,
        estiloVisual: "tarjetas",
        posicionIcono: "derecha",
        tamanoIcono: "md",
        animacionExpandir: true,
        mostrarTituloWidget: true,
        mostrarSubtitulo: true,
        mostrarInstruccion: true,
        mostrarImagenes: true,
        secciones: [
          {
            id: "mod-1",
            titulo: "Unidad 1: Estructura celular y organelos",
            contenido:
              "La célula constituye la unidad básica estructural y funcional de los seres vivos. La membrana plasmática delimita la célula y regula el intercambio con el medio exterior.",
            imagenUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop&q=80",
            imagenAlt: "Estructura microscópica celular",
            abiertoPorDefecto: true,
          },
          {
            id: "mod-2",
            titulo: "Unidad 2: Metabolismo y energía celular",
            contenido:
              "Procesos bioquímicos acoplados mediante los cuales los organismos transforman energía para sus funciones vitales básicas a través de la respiración celular y la síntesis de ATP.",
            imagenUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80",
            imagenAlt: "Reacción química luminosa de energía",
            abiertoPorDefecto: false,
          },
        ],
      },
    } as unknown as Partial<AccordionEstado>,
  },
];
