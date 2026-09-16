import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  loadCurriculum,
  findMatchingUnit,
  AREAS_LABELS,
  GRADOS_TODOS,
  type AreaCurricular,
  type GradoEscolar,
  type CurriculumData as CurriculumUnitData,
  type UnidadCurricular,
  type IndicadoresDesempeno,
} from '@lumina/curriculum-data';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';

// ─── Tipos ────────────────────────────────────────────────

export interface DesempenoResult {
  enunciado: string;
  tipo: string;
  area: string;
  grado: string;
  tema: string;
  indicadores: {
    superior: string;
    alto: string;
    basico: string;
    bajo: string;
  };
  actividadesSugeridas: string[];
}

// ─── Fallback hardcodeado ─────────────────────────────────

function buildActividadesFallback(dto: GenerateDesempenoDto): string[] {
  const { tema, area, grado, tipo } = dto;
  if (tipo === 'Cognitivo') {
    return [
      `Los estudiantes de grado ${grado} responden preguntas de comprensión sobre "${tema}" en ${area} [Tipo: Quiz opción múltiple]`,
      `Lectura guiada sobre "${tema}" seguida de completar oraciones clave del concepto [Tipo: Llenar espacios]`,
      `Los estudiantes emparejan conceptos y definiciones fundamentales de "${tema}" en ${area} [Tipo: Emparejar]`,
      `Clasificar afirmaciones sobre "${tema}" como verdaderas o falsas con justificación breve [Tipo: Verdadero/Falso]`,
      `Los estudiantes escriben con sus palabras la idea principal de "${tema}" para grado ${grado} [Tipo: Respuesta corta]`,
    ];
  }
  if (tipo === 'Procedimental') {
    return [
      `Ordenar los pasos del procedimiento de "${tema}" en ${area} para grado ${grado} [Tipo: Ordenar pasos]`,
      `Arrastrar cada etapa de "${tema}" a su posición correcta en el diagrama del proceso [Tipo: Drag & Drop]`,
      `Los estudiantes resuelven un ejercicio aplicado de "${tema}" y explican su razonamiento [Tipo: Respuesta corta]`,
      `Video demostrativo de "${tema}" con preguntas de verificación en puntos clave [Tipo: Video interactivo]`,
      `Completar el procedimiento de "${tema}" insertando los términos técnicos faltantes [Tipo: Llenar espacios]`,
    ];
  }
  return [
    `Encuesta anónima: ¿cómo se sienten los estudiantes de grado ${grado} frente a "${tema}" en ${area}? [Tipo: Encuesta en vivo]`,
    `Nube de palabras: cada estudiante escribe la primera palabra que asocia con "${tema}" [Tipo: Nube de palabras]`,
    `Los estudiantes indican si están de acuerdo o no con afirmaciones actitudinales sobre "${tema}" [Tipo: Verdadero/Falso]`,
    `Respuesta escrita: ¿qué compromiso personal asumes respecto a "${tema}" en ${area}? [Tipo: Respuesta corta]`,
    `Emparejar situaciones cotidianas del grado ${grado} con las actitudes positivas asociadas a "${tema}" [Tipo: Emparejar]`,
  ];
}

function buildFallbackDesempeno(dto: GenerateDesempenoDto): DesempenoResult {
  return {
    enunciado: `Analizar los conceptos fundamentales de ${dto.tema} mediante el estudio de casos del entorno, para desarrollar pensamiento crítico en ${dto.area} de grado ${dto.grado}.`,
    tipo: dto.tipo,
    area: dto.area,
    grado: dto.grado,
    tema: dto.tema,
    indicadores: {
      superior: `Crea y sustenta de forma autónoma propuestas innovadoras sobre ${dto.tema}, estableciendo relaciones complejas con otros conceptos del área.`,
      alto: `Aplica correctamente los conceptos de ${dto.tema} en situaciones nuevas y explica el proceso seguido con argumentos sólidos.`,
      basico: `Comprende los conceptos básicos de ${dto.tema} y los aplica en situaciones guiadas con apoyo del docente.`,
      bajo: `Identifica con dificultad los conceptos elementales de ${dto.tema} y requiere acompañamiento constante para avanzar.`,
    },
    actividadesSugeridas: buildActividadesFallback(dto),
  };
}

// ─── Dataset curado (J3 — prioridad sobre Gemini/fallback) ────

/**
 * `dto.area`/`dto.tipo` llegan en español "humano" (p. ej. "Matemáticas",
 * "Cognitivo") — el mismo vocabulario que ya usa el prompt de Gemini y el
 * fallback de plantilla (no se cambia, D6 dice que el modal hereda del curso
 * pero el resto de la cadena no cambia de forma). El dataset curricular
 * (`@lumina/curriculum-data`) usa claves normalizadas (`matematicas`) e
 * `IndicadoresDesempeno` en minúsculas (`cognitivo`) — estos dos helpers
 * traducen entre ambos vocabularios sin tocar ninguno de los dos.
 */
function resolveAreaCurricular(areaInput: string): AreaCurricular | null {
  const needle = areaInput.trim().toLowerCase();
  const entry = Object.entries(AREAS_LABELS).find(
    ([, label]) => label.toLowerCase() === needle,
  );
  return entry ? (entry[0] as AreaCurricular) : null;
}

function resolveTipoKey(tipoInput: string): keyof IndicadoresDesempeno | null {
  const key = tipoInput.trim().toLowerCase();
  return key === 'cognitivo' || key === 'procedimental' || key === 'actitudinal'
    ? key
    : null;
}

function buildDesempenoFromUnit(
  unidad: UnidadCurricular,
  tipoKey: keyof IndicadoresDesempeno,
  dto: GenerateDesempenoDto,
): DesempenoResult {
  const niveles = unidad.indicadores_desempeno[tipoKey];
  return {
    enunciado: unidad.dba_enunciado,
    tipo: dto.tipo,
    area: dto.area,
    grado: dto.grado,
    tema: dto.tema,
    indicadores: {
      superior: niveles.superior,
      alto: niveles.alto,
      basico: niveles.basico,
      bajo: niveles.bajo,
    },
    actividadesSugeridas: unidad.actividades_sugeridas.length
      ? unidad.actividades_sugeridas.map(
          (a) => `${a.descripcion} [Tipo: ${a.tipo}]`,
        )
      : buildActividadesFallback(dto),
  };
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class CurriculumService {
  constructor(private readonly config: ConfigService) {}

  private async callGemini(
    systemInstruction: string,
    userMessage: string,
    maxOutputTokens = 2000,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return '';

    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (data.error) {
      throw new Error(data.error.message ?? 'Error de Gemini');
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  // ── 1. Consultar la unidad curricular real (dataset único, J2) ──

  /**
   * `GET /curriculum/:area/:grado` — unidad curricular real del dataset
   * único (`@lumina/curriculum-data`, D1/D2), o `null` si el área/grado son
   * válidos pero todavía no tienen JSON (no debería pasar: las 55
   * combinaciones existen, curadas o placeholder). Área/grado inválidos →
   * 400, para distinguir "no está cargado todavía" (D1, placeholder válido)
   * de "esa combinación no existe" (error del llamador).
   */
  async getCurriculumUnit(
    area: string,
    grado: string,
  ): Promise<CurriculumUnitData | null> {
    if (!(area in AREAS_LABELS)) {
      throw new BadRequestException(`Área curricular desconocida: ${area}`);
    }
    if (!GRADOS_TODOS.includes(grado as GradoEscolar)) {
      throw new BadRequestException(`Grado escolar desconocido: ${grado}`);
    }
    return loadCurriculum(area as AreaCurricular, grado as GradoEscolar);
  }

  // ── 2. Generar desempeño: dataset curado > Gemini > fallback ─

  /**
   * Antes de improvisar (Gemini o plantilla), busca si el tema ya coincide
   * con una unidad curada real del dataset único (J2/J3, D6) — si la hay, la
   * usa como base y ni siquiera llama a Gemini. `null` si el área/grado no
   * son del dataset MEN (p. ej. "Educación Física", fuera de las 5 áreas),
   * si esa combinación no tiene contenido curado todavía (D1, placeholder),
   * o si el tipo de desempeño no matchea los 3 tipos pedagógicos (D3).
   */
  private async buildFromCuratedDataset(
    dto: GenerateDesempenoDto,
  ): Promise<DesempenoResult | null> {
    const area = resolveAreaCurricular(dto.area);
    const tipoKey = resolveTipoKey(dto.tipo);
    const grado = dto.grado.trim();
    if (!area || !tipoKey || !GRADOS_TODOS.includes(grado as GradoEscolar)) {
      return null;
    }
    const data = await loadCurriculum(area, grado as GradoEscolar);
    if (!data) return null;
    const unidad = findMatchingUnit(data, dto.tema);
    if (!unidad) return null;
    return buildDesempenoFromUnit(unidad, tipoKey, dto);
  }

  async generateDesempeno(dto: GenerateDesempenoDto): Promise<DesempenoResult> {
    const curado = await this.buildFromCuratedDataset(dto);
    if (curado) return curado;

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return buildFallbackDesempeno(dto);
    }

    const system = `Eres un experto en diseño curricular colombiano basado en los Estándares Básicos de Competencias del MEN.
Tu especialidad es redactar desempeños de aprendizaje siguiendo la estructura: Verbo de acción + Contenido + Condición + Finalidad.
Respondes SIEMPRE en español y devuelves ÚNICAMENTE JSON válido.`;

    const user = `Genera UN desempeño de aprendizaje para:
- Área: ${dto.area}
- Grado: ${dto.grado}
- Tema: ${dto.tema}
- Tipo de desempeño: ${dto.tipo}

El desempeño debe seguir la estructura colombiana: "Verbo de acción + Contenido + Condición + Finalidad".
Genera también 4 indicadores de desempeño (superior, alto, básico, bajo) coherentes con el sistema de evaluación colombiano (escala 1.0 a 5.0).

Devuelve JSON con esta estructura exacta:
{
  "enunciado": "string — el desempeño completo con la estructura: verbo + contenido + condición + finalidad",
  "indicadores": {
    "superior": "string — desempeño para nivel superior (4.6 - 5.0)",
    "alto": "string — desempeño para nivel alto (4.0 - 4.5)",
    "basico": "string — desempeño para nivel básico (3.0 - 3.9)",
    "bajo": "string — desempeño para nivel bajo (1.0 - 2.9)"
  },
  "actividadesSugeridas": ["string", "..."]
}
Para "actividadesSugeridas" genera EXACTAMENTE 5 actividades de aula ESPECÍFICAS para el tema "${dto.tema}" en ${dto.area} de grado ${dto.grado}, tipo ${dto.tipo}.
Reglas obligatorias para cada actividad:
1. Debe mencionar explícitamente "${dto.tema}" y ser adecuada para grado ${dto.grado}.
2. Debe estar alineada al tipo ${dto.tipo} (Cognitivo=comprensión/análisis, Procedimental=práctica/aplicación, Actitudinal=valores/actitudes).
3. Debe terminar con la etiqueta del tipo de actividad interactiva de la plataforma Lumina que se usaría, en formato: [Tipo: <nombre>].
Los tipos disponibles en Lumina son ÚNICAMENTE estos (elige el más apropiado para cada actividad):
- Quiz opción múltiple
- Verdadero/Falso
- Llenar espacios
- Respuesta corta
- Drag & Drop
- Emparejar
- Ordenar pasos
- Video interactivo
- Encuesta en vivo
- Nube de palabras
Ejemplo de formato correcto: "Los estudiantes identifican las partes de la célula arrastrando cada etiqueta a su lugar correspondiente [Tipo: Drag & Drop]"
No uses ningún tipo de actividad fuera de la lista anterior.`;

    try {
      const raw = await this.callGemini(system, user, 1200);

      // Gemini a veces envuelve el JSON en ```json ... ``` aunque se pida JSON puro
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      const enunciado = parsed['enunciado'];
      const indicadores = parsed['indicadores'];
      const actRaw = parsed['actividadesSugeridas'];

      if (
        typeof enunciado !== 'string' ||
        indicadores === null ||
        typeof indicadores !== 'object' ||
        Array.isArray(indicadores)
      ) {
        return buildFallbackDesempeno(dto);
      }

      const ind = indicadores as Record<string, unknown>;

      let actividadesSugeridas: string[] = buildActividadesFallback(dto);
      if (Array.isArray(actRaw)) {
        const fromAi = actRaw
          .filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0,
          )
          .map((s) => s.trim())
          .slice(0, 5);
        if (fromAi.length >= 3) {
          actividadesSugeridas = fromAi;
        }
      }

      return {
        enunciado,
        tipo: dto.tipo,
        area: dto.area,
        grado: dto.grado,
        tema: dto.tema,
        indicadores: {
          superior:
            typeof ind['superior'] === 'string'
              ? ind['superior']
              : buildFallbackDesempeno(dto).indicadores.superior,
          alto:
            typeof ind['alto'] === 'string'
              ? ind['alto']
              : buildFallbackDesempeno(dto).indicadores.alto,
          basico:
            typeof ind['basico'] === 'string'
              ? ind['basico']
              : buildFallbackDesempeno(dto).indicadores.basico,
          bajo:
            typeof ind['bajo'] === 'string'
              ? ind['bajo']
              : buildFallbackDesempeno(dto).indicadores.bajo,
        },
        actividadesSugeridas,
      };
    } catch {
      return buildFallbackDesempeno(dto);
    }
  }
}
