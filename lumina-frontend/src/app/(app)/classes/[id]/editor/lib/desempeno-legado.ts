/**
 * Lectura de `Class.desempeno` (Json legado, congelado desde la Etapa J —
 * "se congela, no se migra"). Las clases creadas antes de existir el modelo
 * relacional (`Desempeno`/`desempenoId`, J6.1) siguen mostrando este campo
 * tal cual al abrir el editor; no hay UI para generar uno nuevo en este
 * formato (el modal de creación se retiró en J6.6 — el camino vigente es la
 * pestaña «Desempeños» del curso + el modal de clase de J6.3).
 */
export interface DesempenoGenerado {
  tipo: string;
  enunciado: string;
  /**
   * Escala de valoración de REFERENCIA (Decreto 1290) para calificar el
   * desempeño completo — NO son indicadores de desempeño reales (J4). Ver
   * `indicadoresDeDesempeno` para los indicadores observables distintos.
   */
  indicadores: {
    superior: string;
    alto: string;
    basico: string;
    bajo: string;
  };
  /**
   * Indicadores de desempeño reales (J4) — 3 a 5 enunciados observables y
   * distintos entre sí, del tipo pedagógico de `tipo` (D3).
   */
  indicadoresDeDesempeno: string[];
  area: string;
  grado: string;
  tema: string;
  actividadesSugeridas: string[];
}

function buildActividadesSimuladas(
  tipo: string,
  tema: string,
  area: string,
): string[] {
  if (tipo === 'Cognitivo') {
    return [
      `Mapa conceptual grupal sobre ${tema} en ${area} con corrección entre pares.`,
      `Lectura breve + preguntas de inferencia y justificación oral.`,
      `Análisis de un caso vinculado a ${tema} con puesta en común.`,
      `Juego de roles para argumentar distintas perspectivas del tema.`,
      `Autoevaluación con rúbrica alineada a los cuatro indicadores.`,
    ];
  }
  if (tipo === 'Procedimental') {
    return [
      `Demostración docente y práctica guiada del procedimiento clave de ${tema}.`,
      `Taller en parejas: resolver 3 situaciones tipo con retroalimentación.`,
      `Estación de práctica autónoma con lista de verificación paso a paso.`,
      `Mini reto aplicado: usar ${tema} en un contexto del aula o del hogar.`,
      `Revisión cruzada usando los criterios del nivel alto y superior.`,
    ];
  }
  return [
    `Reflexión escrita: valoración personal frente a ${tema}.`,
    `Acuerdos de trabajo en equipo relacionados con el propósito de ${area}.`,
    `Simulación o dramatización para practicar la actitud esperada.`,
    `Círculo de cierre: reconocimientos y compromisos para la siguiente clase.`,
  ];
}

export function withActividadesSugeridas(d: DesempenoGenerado): DesempenoGenerado {
  const raw = d.actividadesSugeridas;
  if (Array.isArray(raw) && raw.length >= 3) {
    const cleaned = raw
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 5);
    if (cleaned.length >= 3) {
      return { ...d, actividadesSugeridas: cleaned };
    }
  }
  return {
    ...d,
    actividadesSugeridas: buildActividadesSimuladas(d.tipo, d.tema, d.area),
  };
}
