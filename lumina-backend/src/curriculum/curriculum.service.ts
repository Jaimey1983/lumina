import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  loadCurriculum,
  findMatchingUnit,
  listUnidadesCuradas,
  listUnidadesPorComponente,
  listSubprocesosPorComponente,
  AREAS_LABELS,
  GRADOS_TODOS,
  EBC_COMPONENTES,
  ICFES_COMPETENCIAS,
  type AreaCurricular,
  type GradoEscolar,
  type CurriculumData as CurriculumUnitData,
  type UnidadCurricular,
  type EscalaValoracionPorTipo,
} from '@lumina/curriculum-data';
import type { Desempeno } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { LLM_MODELS } from '../ai-features/ai-provider.types';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';
import { CreateDesempenoDto } from './dto/create-desempeno.dto';
import { GenerateIndicadoresClaseDto } from './dto/generate-indicadores-clase.dto';

// ─── Tipos ────────────────────────────────────────────────

export interface DesempenoResult {
  enunciado: string;
  tipo: string;
  area: string;
  grado: string;
  tema: string;
  /**
   * Escala de valoración de REFERENCIA para calificar el desempeño completo
   * (Decreto 1290: Superior/Alto/Básico/Bajo) — NO son indicadores de
   * desempeño reales (J4). Se mantiene el nombre de campo `indicadores` sin
   * cambios porque esta forma ya está persistida tal cual en `Class.desempeno`
   * (JSON libre, sin DTO tipado) para clases existentes — renombrar la clave
   * exigiría migrar datos ya guardados; la corrección de nomenclatura se hizo
   * donde no tiene ese costo: la etiqueta de UI (`new-class-modal.tsx`) y este
   * comentario. Ver `packages/scoring/src/grade-bands.ts` para la escala real
   * de valoración numérica de un estudiante — este campo es solo texto de
   * referencia para planeación, no participa del cálculo de notas.
   */
  indicadores: {
    superior: string;
    alto: string;
    basico: string;
    bajo: string;
  };
  /**
   * Indicadores de desempeño REALES (J4) — 3 a 5 enunciados observables y
   * DISTINTOS entre sí (verbo + contenido + condición), del tipo pedagógico
   * de `tipo` (D3). Cuando hay una unidad curada real (match literal o
   * semántico), son `unidad.evidencias_aprendizaje` tal cual — ya están
   * escritos así en el dataset. Si no, los genera Gemini (prompt) o, sin
   * `GEMINI_API_KEY`, una plantilla determinista por banco de verbos (D3).
   */
  indicadoresDeDesempeno: string[];
  actividadesSugeridas: string[];
}

// ─── Indicadores de desempeño reales — banco de verbos (D3) ───

const VERBOS_POR_TIPO: Record<
  'cognitivo' | 'procedimental' | 'actitudinal',
  string[]
> = {
  cognitivo: [
    'Identifica',
    'Explica',
    'Analiza',
    'Compara',
    'Argumenta',
    'Sustenta',
  ],
  procedimental: [
    'Aplica',
    'Utiliza',
    'Desarrolla',
    'Resuelve',
    'Diseña',
    'Construye',
  ],
  actitudinal: [
    'Respeta',
    'Participa',
    'Reconoce',
    'Asume',
    'Coopera',
    'Demuestra',
  ],
};

/**
 * Fallback determinista de indicadores de desempeño reales — sin llamar a
 * Gemini. 4 enunciados DISTINTOS (verbo distinto de `VERBOS_POR_TIPO` +
 * contenido + condición), no 4 niveles de intensidad del mismo enunciado
 * (esa confusión es justamente la que J4 corrige).
 */
function buildIndicadoresFallback(dto: GenerateDesempenoDto): string[] {
  const tipoKey = resolveTipoKey(dto.tipo) ?? 'cognitivo';
  const [v1, v2, v3, v4] = VERBOS_POR_TIPO[tipoKey];
  return [
    `${v1} los conceptos fundamentales de ${dto.tema} en situaciones cotidianas de ${dto.area}.`,
    `${v2} ${dto.tema} para resolver una situación propuesta en clase, propia del grado ${dto.grado}.`,
    `${v3} relaciones entre ${dto.tema} y otros contenidos ya trabajados en ${dto.area}.`,
    `${v4} lo aprendido sobre ${dto.tema} en una producción propia (oral, escrita o gráfica).`,
  ];
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
    indicadoresDeDesempeno: buildIndicadoresFallback(dto),
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
 * `EscalaValoracionPorTipo` en minúsculas (`cognitivo`) — estos dos helpers
 * traducen entre ambos vocabularios sin tocar ninguno de los dos.
 */
function resolveAreaCurricular(areaInput: string): AreaCurricular | null {
  const needle = areaInput.trim().toLowerCase();
  const entry = Object.entries(AREAS_LABELS).find(
    ([, label]) => label.toLowerCase() === needle,
  );
  return entry ? (entry[0] as AreaCurricular) : null;
}

function resolveTipoKey(
  tipoInput: string,
): keyof EscalaValoracionPorTipo | null {
  const key = tipoInput.trim().toLowerCase();
  return key === 'cognitivo' || key === 'procedimental' || key === 'actitudinal'
    ? key
    : null;
}

function buildDesempenoFromUnit(
  unidad: UnidadCurricular,
  tipoKey: keyof EscalaValoracionPorTipo,
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
    // `evidencias_aprendizaje` del dataset YA son indicadores de desempeño
    // reales (enunciados observables distintos, no niveles de intensidad) —
    // se usan tal cual, sin generar nada. Fallback determinista solo si la
    // unidad curada no trae evidencias (no debería pasar con contenido real).
    indicadoresDeDesempeno: unidad.evidencias_aprendizaje.length
      ? unidad.evidencias_aprendizaje
      : buildIndicadoresFallback(dto),
    actividadesSugeridas: unidad.actividades_sugeridas.length
      ? unidad.actividades_sugeridas.map(
          (a) => `${a.descripcion} [Tipo: ${a.tipo}]`,
        )
      : buildActividadesFallback(dto),
  };
}

/**
 * Extrae y parsea el primer objeto JSON BALANCEADO de una respuesta de texto
 * de Gemini, descartando todo lo que venga después de su `}` de cierre real.
 *
 * Necesario porque `gemini-2.5-flash-lite` con `responseMimeType:
 * 'application/json'` puede emitir el JSON correcto y, acto seguido, entrar
 * en un loop de repetición degenerada (fragmentos sueltos del final de la
 * respuesta, con `}` de más) — confirmado en vivo, reproducible: 3/3
 * llamadas idénticas devolvieron `{"enunciado": "..."}` seguido de basura
 * como `.\"}\nprocesos.\"}\n}` o 15 repeticiones de `ada.\"}\n.\"}\n...`. Un
 * `lastIndexOf('}')` ingenuo (la implementación anterior) agarra uno de esos
 * `}` sueltos de la basura en vez del que de verdad cierra el objeto, y el
 * slice resultante queda con sintaxis rota → `JSON.parse` vuelve a fallar →
 * se pierde una respuesta que en realidad SÍ era válida.
 *
 * Este parser cuenta llaves desde el primer `{`, respetando el contenido de
 * los strings (para que un `}` dentro de un valor de texto no descuadre el
 * conteo) y para en cuanto encuentra el `}` que balancea exactamente ese
 * primer `{` — todo lo posterior (markdown, basura, repetición) se ignora
 * sin más intentos. `null` si no hay ningún objeto JSON balanceado.
 */
function extractJsonObject(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ─── Entrada 1 (Etapa J / J6.2) — desempeño de CURSO, sin unidad/tema ──
// aún elegido. Estrategia distinta de `generateDesempeno` (Entrada 2): no
// hay un `tema` para matchear contra una unidad puntual — la entrada es
// componente EBC + competencia ICFES (catálogo fijo, J6.0). Si el dataset
// curado tiene unidades de ese componente en esa área/grado, sus
// `dba_enunciado` se usan como contexto real para que Gemini sintetice un
// desempeño de curso más amplio que cualquier DBA individual (sin
// grounding — ya hay contenido MEN real como base, no hace falta buscar en
// internet); si no hay contenido curado, se recurre a grounding igual que
// `generateDesempeno` para temas fuera del dataset. Sin `GEMINI_API_KEY`,
// fallback determinista en los dos casos.

function normalizarEtiqueta(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function buildFallbackDesempenoCurso(params: {
  areaLabel: string;
  grado: string;
  componenteLabel: string;
  competenciaLabel: string;
}): string {
  const { areaLabel, grado, componenteLabel, competenciaLabel } = params;
  return `Desarrollar la competencia de ${competenciaLabel} en el componente de ${componenteLabel}, propio de ${areaLabel} de grado ${grado}, mediante situaciones de aprendizaje que permitan al estudiante avanzar de manera progresiva en su comprensión y aplicación a lo largo del curso.`;
}

// ─── Entrada 2 (Etapa J / J6.3) — indicadores de CLASE a partir del camino ──
// DBA/evidencias o EBC/subprocesos elegido por el docente (excluyentes). Los
// 3 tipos pedagógicos (cognitivo/procedimental/actitudinal, D3) se generan
// juntos en una sola llamada — más barato que 3 llamadas y coherente entre
// sí (mismo contexto, misma pasada).

export interface UnidadDbaParaClase {
  unidadId: number;
  titulo: string;
  evidenciasAprendizaje: string[];
}

export interface IndicadoresClaseResult {
  cognitivo: string[];
  procedimental: string[];
  actitudinal: string[];
}

/**
 * Fallback determinista por tipo pedagógico — mismo banco de verbos que
 * `buildIndicadoresFallback` (D3), pero contextualizado con el contenido
 * curricular elegido (evidencia o subproceso) en vez del `tema` libre de
 * `generateDesempeno`.
 */
function buildIndicadorClaseFallback(
  tipo: 'cognitivo' | 'procedimental' | 'actitudinal',
  contexto: string,
): string[] {
  const [v1, v2, v3, v4] = VERBOS_POR_TIPO[tipo];
  return [
    `${v1} los elementos clave de "${contexto}" durante el desarrollo de la clase.`,
    `${v2} lo trabajado sobre "${contexto}" en una actividad propuesta por el docente.`,
    `${v3} relaciones entre "${contexto}" y lo visto previamente en la clase.`,
    `${v4} lo aprendido sobre "${contexto}" en una producción propia (oral, escrita o gráfica).`,
  ];
}

function sanitizeIndicadoresArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5);
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class CurriculumService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
  ) {}

  /**
   * `grounded: true` activa la herramienta de búsqueda de Google en Gemini
   * (`google_search`) para que la respuesta se apoye en información real de
   * internet, no solo en el conocimiento propio del modelo — para cuando ni
   * el match literal (`findMatchingUnit`) ni el semántico
   * (`buildFromSemanticMatch`) encontraron nada en el dataset curricular.
   * La API de Gemini no admite `responseMimeType: 'application/json'` junto
   * con `google_search` — por eso `forceJson` se apaga automáticamente
   * cuando `grounded` está activo; el JSON se sigue pidiendo por prompt (los
   * llamadores ya limpian los ```json ... ``` que Gemini a veces agrega).
   */
  private async callGemini(
    systemInstruction: string,
    userMessage: string,
    options: {
      maxOutputTokens?: number;
      grounded?: boolean;
      temperature?: number;
    } = {},
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return '';

    const {
      maxOutputTokens = 2000,
      grounded = false,
      temperature = 0.7,
    } = options;

    const model = LLM_MODELS.GEMINI;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: Record<string, unknown> = {
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
        temperature,
        maxOutputTokens,
        ...(grounded ? {} : { responseMimeType: 'application/json' }),
      },
      ...(grounded ? { tools: [{ google_search: {} }] } : {}),
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

  /**
   * Si el match literal falló (p. ej. "la noticia" contra una unidad de
   * "medios de comunicación" — relacionados, pero sin substring en común),
   * le pide a Gemini que asocie el tema con alguna unidad curada por
   * significado, no por texto. Una llamada corta y barata (no genera
   * contenido, solo clasifica) — si acierta, se reusa el contenido curado
   * real igual que en el match literal; si no hay ninguna razonable, sigue
   * la cadena hacia la generación con búsqueda en internet.
   */
  private async buildFromSemanticMatch(
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
    const candidatas = listUnidadesCuradas(data);
    if (!candidatas.length) return null;

    const system = `Eres un clasificador curricular ESTRICTO. Dado un tema o subtema de clase, determinás a cuál de las unidades curriculares dadas corresponde — pero SOLO si el tema es un caso concreto, una parte o una manifestación específica del contenido de esa unidad. Una palabra en común (p. ej. "gramatical", "texto", "comunicación") NO es un match — tiene que ser el mismo contenido pedagógico real.
Ejemplo de match VÁLIDO: "la noticia" → unidad sobre "medios de comunicación" (la noticia ES uno de los medios/formatos que la unidad trata explícitamente).
Ejemplos de NO-match (devolver -1, con la razón por la que un clasificador descuidado se equivocaría):
- "el cómic" contra una unidad sobre "producción escrita en general" — ambos son "tipos de texto", pero la unidad no trata el cómic como género.
- "reglas de uso de mayúsculas y minúsculas" (ortografía) contra una unidad que menciona "concordancia gramatical" — comparten la palabra "gramatical", pero ortografía (mayúsculas) y concordancia (género/número) son contenidos distintos; esa unidad NO enseña mayúsculas.
Ante cualquier duda, preferí devolver -1 antes que forzar una asociación por palabras en común.
Respondés SIEMPRE con JSON puro: {"unidad_id": <number>}, usando -1 si ninguna unidad aplica con certeza razonable. No inventes un id que no esté en la lista.`;

    const user = `Tema/subtema de clase: "${dto.tema}"

Unidades disponibles:
${candidatas
  .map(
    (u) =>
      `id=${u.unidad_id}: "${u.unidad_titulo}" — temas: ${u.temas.join(', ')} — subtemas: ${u.subtemas.join(', ')}`,
  )
  .join('\n')}`;

    try {
      const raw = await this.callGemini(system, user, {
        maxOutputTokens: 100,
        temperature: 0,
      });
      const parsed = extractJsonObject(raw) as { unidad_id?: unknown } | null;
      const id = typeof parsed?.unidad_id === 'number' ? parsed.unidad_id : -1;
      if (id < 0) return null;
      const unidad = candidatas.find((u) => u.unidad_id === id);
      if (!unidad) return null;
      return buildDesempenoFromUnit(unidad, tipoKey, dto);
    } catch {
      return null;
    }
  }

  async generateDesempeno(dto: GenerateDesempenoDto): Promise<DesempenoResult> {
    const curadoLiteral = await this.buildFromCuratedDataset(dto);
    if (curadoLiteral) return curadoLiteral;

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return buildFallbackDesempeno(dto);
    }

    const curadoSemantico = await this.buildFromSemanticMatch(dto);
    if (curadoSemantico) return curadoSemantico;

    const system = `Eres un experto en diseño curricular colombiano basado en los Estándares Básicos de Competencias del MEN.
Tu especialidad es redactar desempeños de aprendizaje siguiendo la estructura: Verbo de acción + Contenido + Condición + Finalidad.
Tenés disponible búsqueda en Google — usala para fundamentar el desempeño y los indicadores en información real y confiable sobre el tema, especialmente si no coincide con ningún contenido curricular ya cargado.
Respondes SIEMPRE en español y devuelves ÚNICAMENTE el objeto JSON pedido, sin texto antes ni después, sin bloques de código markdown.`;

    const user = `Genera UN desempeño de aprendizaje para:
- Área: ${dto.area}
- Grado: ${dto.grado}
- Tema: ${dto.tema}
- Tipo de desempeño: ${dto.tipo}

El desempeño debe seguir la estructura colombiana: "Verbo de acción + Contenido + Condición + Finalidad".

Genera también una escala de valoración de REFERENCIA (superior, alto, básico, bajo) para calificar el desempeño completo, coherente con el sistema de evaluación colombiano (escala 1.0 a 5.0). Esto NO son indicadores — son 4 niveles de intensidad del MISMO desempeño.

Genera ADEMÁS entre 3 y 5 INDICADORES DE DESEMPEÑO reales — enunciados observables y DISTINTOS entre sí (cada uno con verbo + contenido + condición propios, NO una reescritura del mismo enunciado en distinta intensidad). Ejemplo de 3 indicadores válidos y distintos entre sí para un desempeño sobre "la célula": "Identifica las partes principales de la célula en un esquema", "Compara célula animal y vegetal señalando semejanzas y diferencias", "Explica la función de la membrana celular con sus palabras".

Devuelve JSON con esta estructura exacta:
{
  "enunciado": "string — el desempeño completo con la estructura: verbo + contenido + condición + finalidad",
  "indicadores": {
    "superior": "string — escala de valoración de referencia, nivel superior (4.6 - 5.0)",
    "alto": "string — escala de valoración de referencia, nivel alto (4.0 - 4.5)",
    "basico": "string — escala de valoración de referencia, nivel básico (3.0 - 3.9)",
    "bajo": "string — escala de valoración de referencia, nivel bajo (1.0 - 2.9)"
  },
  "indicadoresDeDesempeno": ["string — indicador observable 1", "string — indicador observable 2 (distinto del 1)", "..."],
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
      const raw = await this.callGemini(system, user, {
        maxOutputTokens: 1200,
        grounded: true,
      });
      const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
      if (!parsed) {
        return buildFallbackDesempeno(dto);
      }

      const enunciado = parsed['enunciado'];
      const indicadores = parsed['indicadores'];
      const actRaw = parsed['actividadesSugeridas'];
      const indDesempenoRaw = parsed['indicadoresDeDesempeno'];

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

      let indicadoresDeDesempeno: string[] = buildIndicadoresFallback(dto);
      if (Array.isArray(indDesempenoRaw)) {
        const fromAi = indDesempenoRaw
          .filter(
            (x): x is string => typeof x === 'string' && x.trim().length > 0,
          )
          .map((s) => s.trim())
          .slice(0, 5);
        if (fromAi.length >= 3) {
          indicadoresDeDesempeno = fromAi;
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
        indicadoresDeDesempeno,
        actividadesSugeridas,
      };
    } catch {
      return buildFallbackDesempeno(dto);
    }
  }

  // ── 3. Entrada 1 (J6.2) — Desempeño de CURSO ─────────────

  /**
   * Redacta el enunciado del desempeño de curso. Separado de
   * `generateDesempeno` a propósito (J6, "Decisiones cerradas" — estrategia
   * de IA distinta): acá no hay un `tema`/unidad puntual, solo componente +
   * competencia; cuando hay unidades curadas de ese componente se le pasan
   * como contexto real (sin grounding), y solo se recurre a `google_search`
   * cuando el área/componente no tiene contenido curado todavía.
   */
  private async buildEnunciadoDesempenoCurso(params: {
    area: AreaCurricular;
    grado: GradoEscolar;
    componenteLabel: string;
    competenciaLabel: string;
  }): Promise<string> {
    const { area, grado, componenteLabel, competenciaLabel } = params;
    const areaLabel = AREAS_LABELS[area];
    const fallback = () =>
      buildFallbackDesempenoCurso({
        areaLabel,
        grado,
        componenteLabel,
        competenciaLabel,
      });

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return fallback();

    const data = await loadCurriculum(area, grado);
    const unidadesDelComponente = data
      ? listUnidadesCuradas(data).filter(
          (u) =>
            normalizarEtiqueta(u.ebc_factor) ===
            normalizarEtiqueta(componenteLabel),
        )
      : [];

    const tieneContextoCurado = unidadesDelComponente.length > 0;

    const system = tieneContextoCurado
      ? `Eres un experto en diseño curricular colombiano (MEN). Redactas UN desempeño de aprendizaje AMPLIO, a nivel de curso completo (no de una sola clase), que integre el componente y la competencia dados, apoyándote en los DBA reales que se te entregan como referencia. Estructura: Verbo de acción + Contenido + Condición + Finalidad. Respondes SIEMPRE con JSON puro: {"enunciado": "string"}, sin texto adicional ni bloques de código.`
      : `Eres un experto en diseño curricular colombiano basado en los Estándares Básicos de Competencias del MEN. Redactas UN desempeño de aprendizaje AMPLIO, a nivel de curso completo, que integre el componente y la competencia dados. Estructura: Verbo de acción + Contenido + Condición + Finalidad. Tenés disponible búsqueda en Google — usala para fundamentar el desempeño en los Estándares Básicos de Competencias reales del MEN para esta área y grado. Respondes SIEMPRE en español y devuelves ÚNICAMENTE el objeto JSON pedido: {"enunciado": "string"}, sin texto antes ni después, sin bloques de código markdown.`;

    const contexto = tieneContextoCurado
      ? `\n\nDBA de referencia de este componente en este grado:\n${unidadesDelComponente
          .map((u) => `- DBA ${u.dba_asociados.join(',')}: ${u.dba_enunciado}`)
          .join('\n')}`
      : '';

    const user = `Área: ${areaLabel}
Grado: ${grado}
Componente EBC: ${componenteLabel}
Competencia ICFES: ${competenciaLabel}${contexto}

Redacta el desempeño de curso.`;

    try {
      const raw = await this.callGemini(system, user, {
        maxOutputTokens: 400,
        temperature: tieneContextoCurado ? 0.5 : 0.7,
        grounded: !tieneContextoCurado,
      });
      const parsed = extractJsonObject(raw) as { enunciado?: unknown } | null;
      if (
        parsed &&
        typeof parsed.enunciado === 'string' &&
        parsed.enunciado.trim().length > 0
      ) {
        return parsed.enunciado.trim();
      }
      return fallback();
    } catch {
      return fallback();
    }
  }

  /**
   * `POST /curriculum/courses/:courseId/desempenos` — genera y persiste un
   * `Desempeno` de curso (Entrada 1). `componenteEbc`/`competenciaIcfes`
   * llegan como códigos del catálogo (J6.0) — acá se valida que pertenezcan
   * al ÁREA del curso (el DTO solo valida que existan en ALGÚN área, ver
   * `create-desempeno.dto.ts`). `area`/`grado` se leen de `Course`, nunca se
   * vuelven a pedir (D4).
   */
  async generateDesempenoCurso(
    courseId: string,
    dto: CreateDesempenoDto,
    userId: string,
    userRole: string,
  ): Promise<Desempeno> {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'courseSettings',
    );

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { area: true, grado: true },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (!course.area || !course.grado) {
      throw new BadRequestException(
        'El curso no tiene área/grado configurados — no se puede generar un desempeño (J1).',
      );
    }
    if (!(course.area in AREAS_LABELS)) {
      throw new BadRequestException(
        `Área curricular desconocida: ${course.area}`,
      );
    }
    const area = course.area as AreaCurricular;
    const grado = course.grado as GradoEscolar;

    const componenteItem = EBC_COMPONENTES[area].find(
      (c) => c.codigo === dto.componenteEbc,
    );
    if (!componenteItem) {
      throw new BadRequestException(
        `El componente EBC "${dto.componenteEbc}" no pertenece al área ${AREAS_LABELS[area]}.`,
      );
    }
    const competenciaItem = ICFES_COMPETENCIAS[area].find(
      (c) => c.codigo === dto.competenciaIcfes,
    );
    if (!competenciaItem) {
      throw new BadRequestException(
        `La competencia ICFES "${dto.competenciaIcfes}" no pertenece al área ${AREAS_LABELS[area]}.`,
      );
    }

    const enunciado = await this.buildEnunciadoDesempenoCurso({
      area,
      grado,
      componenteLabel: componenteItem.label,
      competenciaLabel: competenciaItem.label,
    });

    return this.prisma.desempeno.create({
      data: {
        courseId,
        area: course.area,
        grado: course.grado,
        componenteEbc: dto.componenteEbc,
        competenciaIcfes: dto.competenciaIcfes,
        enunciado,
      },
    });
  }

  /** `GET /curriculum/courses/:courseId/desempenos` — lista los `Desempeno` del curso. */
  async listDesempenosCurso(
    courseId: string,
    userId: string,
    userRole: string,
  ): Promise<Desempeno[]> {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    return this.prisma.desempeno.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * `DELETE /curriculum/courses/:courseId/desempenos/:desempenoId` — borra
   * un `Desempeno` de curso. Seguro incluso si alguna `Class` ya lo
   * referencia: la FK es `onDelete: SetNull` (J6.1) — la clase no se borra,
   * solo pierde la referencia.
   */
  async removeDesempenoCurso(
    courseId: string,
    desempenoId: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: true }> {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'courseSettings',
    );
    const desempeno = await this.prisma.desempeno.findUnique({
      where: { id: desempenoId },
      select: { courseId: true },
    });
    if (!desempeno || desempeno.courseId !== courseId) {
      throw new NotFoundException('Desempeño no encontrado en este curso');
    }
    await this.prisma.desempeno.delete({ where: { id: desempenoId } });
    return { success: true };
  }

  // ── 4. Entrada 2 (J6.3) — camino DBA/EBC + indicadores de CLASE ──

  /** Carga un `Desempeno` verificando que pertenezca al curso — 404 si no. */
  private async loadDesempenoOrThrow(
    courseId: string,
    desempenoId: string,
  ): Promise<Desempeno> {
    const desempeno = await this.prisma.desempeno.findUnique({
      where: { id: desempenoId },
    });
    if (!desempeno || desempeno.courseId !== courseId) {
      throw new NotFoundException('Desempeño no encontrado en este curso');
    }
    return desempeno;
  }

  private componenteLabelDe(desempeno: Desempeno): string | null {
    const area = desempeno.area as AreaCurricular;
    return (
      EBC_COMPONENTES[area]?.find((c) => c.codigo === desempeno.componenteEbc)
        ?.label ?? null
    );
  }

  /**
   * `GET /curriculum/courses/:courseId/desempenos/:desempenoId/unidades-dba`
   * — unidades curadas (DBA) del componente del `Desempeno`, cada una con
   * sus `evidencias_aprendizaje` (camino DBA, J6.3: solo evidencias, nunca
   * subprocesos — ver "Decisiones cerradas" en `AGENTS.md`).
   */
  async listUnidadesDbaParaDesempeno(
    courseId: string,
    desempenoId: string,
    userId: string,
    userRole: string,
  ): Promise<UnidadDbaParaClase[]> {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    const desempeno = await this.loadDesempenoOrThrow(courseId, desempenoId);
    const componenteLabel = this.componenteLabelDe(desempeno);
    if (!componenteLabel) return [];
    const data = await loadCurriculum(
      desempeno.area as AreaCurricular,
      desempeno.grado as GradoEscolar,
    );
    if (!data) return [];
    return listUnidadesPorComponente(data, componenteLabel).map((u) => ({
      unidadId: u.unidad_id,
      titulo: u.unidad_titulo,
      evidenciasAprendizaje: u.evidencias_aprendizaje,
    }));
  }

  /**
   * `GET /curriculum/courses/:courseId/desempenos/:desempenoId/subprocesos-ebc`
   * — todos los subprocesos EBC del componente del `Desempeno` (camino EBC,
   * J6.3: la lista completa, sin filtrar por si tienen o no un DBA que los
   * respalde — es el único camino donde aparecen los que ningún DBA cubre).
   */
  async listSubprocesosEbcParaDesempeno(
    courseId: string,
    desempenoId: string,
    userId: string,
    userRole: string,
  ): Promise<string[]> {
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, userRole);
    const desempeno = await this.loadDesempenoOrThrow(courseId, desempenoId);
    const componenteLabel = this.componenteLabelDe(desempeno);
    if (!componenteLabel) return [];
    const data = await loadCurriculum(
      desempeno.area as AreaCurricular,
      desempeno.grado as GradoEscolar,
    );
    if (!data) return [];
    return listSubprocesosPorComponente(data, componenteLabel);
  }

  /**
   * Redacta los 3 indicadores (cognitivo/procedimental/actitudinal) a partir
   * del desempeño + el contenido curricular elegido (evidencias o
   * subprocesos). Sin `GEMINI_API_KEY`, fallback determinista por tipo
   * (D3), contextualizado con el primer ítem elegido.
   */
  private async buildIndicadoresClase(params: {
    enunciadoDesempeno: string;
    contextoItems: string[];
  }): Promise<IndicadoresClaseResult> {
    const { enunciadoDesempeno, contextoItems } = params;
    const contextoRepresentativo =
      contextoItems[0] ?? 'el contenido de la clase';
    const fallback = (): IndicadoresClaseResult => ({
      cognitivo: buildIndicadorClaseFallback(
        'cognitivo',
        contextoRepresentativo,
      ),
      procedimental: buildIndicadorClaseFallback(
        'procedimental',
        contextoRepresentativo,
      ),
      actitudinal: buildIndicadorClaseFallback(
        'actitudinal',
        contextoRepresentativo,
      ),
    });

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return fallback();

    const system = `Eres un experto en diseño curricular colombiano (MEN). A partir de un desempeño de aprendizaje y del contenido curricular seleccionado para UNA clase puntual, redactas entre 3 y 5 INDICADORES DE DESEMPEÑO reales por cada uno de los 3 tipos pedagógicos: cognitivo, procedimental, actitudinal. Cada indicador es un enunciado observable (verbo + contenido + condición) y DEBE ser distinto de los demás dentro del mismo tipo — nunca una reescritura del mismo enunciado en otra intensidad. Respondes SIEMPRE con JSON puro: {"cognitivo": ["..."], "procedimental": ["..."], "actitudinal": ["..."]}, sin texto adicional ni bloques de código.`;

    const user = `Desempeño del curso: ${enunciadoDesempeno}

Contenido curricular seleccionado para esta clase:
${contextoItems.map((s) => `- ${s}`).join('\n')}

Redacta los indicadores de esta clase puntual.`;

    try {
      const raw = await this.callGemini(system, user, {
        maxOutputTokens: 900,
        temperature: 0.6,
      });
      const parsed = extractJsonObject(raw) as Record<string, unknown> | null;
      if (!parsed) return fallback();
      const fb = fallback();
      const cognitivo = sanitizeIndicadoresArray(parsed['cognitivo']);
      const procedimental = sanitizeIndicadoresArray(parsed['procedimental']);
      const actitudinal = sanitizeIndicadoresArray(parsed['actitudinal']);
      return {
        cognitivo: cognitivo.length >= 3 ? cognitivo : fb.cognitivo,
        procedimental:
          procedimental.length >= 3 ? procedimental : fb.procedimental,
        actitudinal: actitudinal.length >= 3 ? actitudinal : fb.actitudinal,
      };
    } catch {
      return fallback();
    }
  }

  /**
   * `POST /curriculum/courses/:courseId/desempenos/:desempenoId/generar-indicadores`
   * — valida la exclusividad DBA/EBC (J6, "Decisiones cerradas") y genera
   * los 3 indicadores de la clase. No persiste nada — el frontend confirma
   * el borrador junto con la creación de la `Class` (J6.3, `UpdateClassCurricularContextDto`).
   */
  async generateIndicadoresClase(
    courseId: string,
    desempenoId: string,
    dto: GenerateIndicadoresClaseDto,
    userId: string,
    userRole: string,
  ): Promise<IndicadoresClaseResult> {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'classEditor',
    );
    const desempeno = await this.loadDesempenoOrThrow(courseId, desempenoId);

    if (dto.caminoCurricular === 'dba') {
      if (!dto.dbaSeleccionado) {
        throw new BadRequestException('Falta la selección de DBA/evidencias.');
      }
      if (dto.ebcSeleccionado) {
        throw new BadRequestException(
          'DBA y EBC son excluyentes — no se pueden combinar (J6).',
        );
      }
    } else {
      if (!dto.ebcSeleccionado) {
        throw new BadRequestException('Falta la selección de subprocesos EBC.');
      }
      if (dto.dbaSeleccionado) {
        throw new BadRequestException(
          'DBA y EBC son excluyentes — no se pueden combinar (J6).',
        );
      }
    }

    const contextoItems =
      dto.caminoCurricular === 'dba'
        ? dto.dbaSeleccionado.evidenciasElegidas
        : dto.ebcSeleccionado.subprocesosElegidos;

    if (contextoItems.length === 0) {
      throw new BadRequestException(
        'Elegí al menos una evidencia o subproceso antes de generar los indicadores.',
      );
    }

    return this.buildIndicadoresClase({
      enunciadoDesempeno: desempeno.enunciado,
      contextoItems,
    });
  }
}
