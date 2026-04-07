import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateDesempenoDto } from './dto/generate-desempeno.dto';

// ─── Tipos ────────────────────────────────────────────────

export interface DbaItem {
  id: string;
  area: string;
  grado: string;
  enunciado: string;
  codigo: string;
}

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

// ─── Banco de DBA simulados ───────────────────────────────

const DBA_BANCO: DbaItem[] = [
  // Matemáticas — Grado 5
  {
    id: 'mat-5-01',
    area: 'Matemáticas',
    grado: '5',
    enunciado:
      'Resuelve y formula problemas de multiplicación y división con números naturales.',
    codigo: 'MAT.5.01',
  },
  {
    id: 'mat-5-02',
    area: 'Matemáticas',
    grado: '5',
    enunciado:
      'Interpreta y usa fracciones en contextos de medición y repartición equitativa.',
    codigo: 'MAT.5.02',
  },
  {
    id: 'mat-5-03',
    area: 'Matemáticas',
    grado: '5',
    enunciado:
      'Identifica, describe y argumenta patrones y regularidades en secuencias numéricas.',
    codigo: 'MAT.5.03',
  },
  {
    id: 'mat-5-04',
    area: 'Matemáticas',
    grado: '5',
    enunciado:
      'Calcula perímetros y áreas de figuras planas en situaciones del entorno.',
    codigo: 'MAT.5.04',
  },
  // Lenguaje — Grado 5
  {
    id: 'len-5-01',
    area: 'Lenguaje',
    grado: '5',
    enunciado:
      'Produce textos escritos coherentes y con intención comunicativa definida.',
    codigo: 'LEN.5.01',
  },
  {
    id: 'len-5-02',
    area: 'Lenguaje',
    grado: '5',
    enunciado:
      'Lee con fluidez y comprende textos narrativos, descriptivos e informativos.',
    codigo: 'LEN.5.02',
  },
  {
    id: 'len-5-03',
    area: 'Lenguaje',
    grado: '5',
    enunciado:
      'Identifica la estructura y propósito comunicativo de diferentes tipos de texto.',
    codigo: 'LEN.5.03',
  },
  // Ciencias Naturales — Grado 5
  {
    id: 'cn-5-01',
    area: 'Ciencias Naturales',
    grado: '5',
    enunciado:
      'Explica la función de los órganos del cuerpo humano y su relación con los sistemas.',
    codigo: 'CN.5.01',
  },
  {
    id: 'cn-5-02',
    area: 'Ciencias Naturales',
    grado: '5',
    enunciado:
      'Describe el ciclo del agua y su importancia para los ecosistemas.',
    codigo: 'CN.5.02',
  },
  {
    id: 'cn-5-03',
    area: 'Ciencias Naturales',
    grado: '5',
    enunciado:
      'Reconoce la cadena alimentaria y las relaciones entre productores y consumidores.',
    codigo: 'CN.5.03',
  },
  // Ciencias Sociales — Grado 5
  {
    id: 'cs-5-01',
    area: 'Ciencias Sociales',
    grado: '5',
    enunciado:
      'Ubica en el mapa político de Colombia sus departamentos, capitales y regiones naturales.',
    codigo: 'CS.5.01',
  },
  {
    id: 'cs-5-02',
    area: 'Ciencias Sociales',
    grado: '5',
    enunciado:
      'Identifica los procesos de independencia de Colombia y sus causas históricas.',
    codigo: 'CS.5.02',
  },
  {
    id: 'cs-5-03',
    area: 'Ciencias Sociales',
    grado: '5',
    enunciado:
      'Comprende los derechos y deberes del ciudadano colombiano establecidos en la Constitución.',
    codigo: 'CS.5.03',
  },
  // Matemáticas — Grado 9
  {
    id: 'mat-9-01',
    area: 'Matemáticas',
    grado: '9',
    enunciado:
      'Resuelve sistemas de ecuaciones lineales mediante métodos algebraicos y gráficos.',
    codigo: 'MAT.9.01',
  },
  {
    id: 'mat-9-02',
    area: 'Matemáticas',
    grado: '9',
    enunciado:
      'Aplica los conceptos de función lineal y cuadrática en la resolución de problemas.',
    codigo: 'MAT.9.02',
  },
  {
    id: 'mat-9-03',
    area: 'Matemáticas',
    grado: '9',
    enunciado:
      'Usa razones trigonométricas para calcular medidas en triángulos rectángulos.',
    codigo: 'MAT.9.03',
  },
  // Lenguaje — Grado 9
  {
    id: 'len-9-01',
    area: 'Lenguaje',
    grado: '9',
    enunciado:
      'Analiza textos literarios identificando recursos narrativos, estilísticos y contexto histórico.',
    codigo: 'LEN.9.01',
  },
  {
    id: 'len-9-02',
    area: 'Lenguaje',
    grado: '9',
    enunciado:
      'Produce textos argumentativos con tesis, argumentos y conclusión bien estructurados.',
    codigo: 'LEN.9.02',
  },
  {
    id: 'len-9-03',
    area: 'Lenguaje',
    grado: '9',
    enunciado:
      'Comprende e interpreta textos académicos y científicos de mediana complejidad.',
    codigo: 'LEN.9.03',
  },
];

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

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class CurriculumService {
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY') ?? '',
    });
  }

  // ── 1. Consultar DBA del banco ─────────────────────────────

  getDba(area: string, grado: string): DbaItem[] {
    const areaLower = area.toLowerCase();
    const gradoLower = grado.toLowerCase();

    const results = DBA_BANCO.filter(
      (d) =>
        d.area.toLowerCase().includes(areaLower) &&
        d.grado.toLowerCase() === gradoLower,
    );

    // Si no hay coincidencias exactas, devolver primeros 3 del banco como muestra
    if (!results.length) {
      return DBA_BANCO.slice(0, 3).map((d) => ({ ...d, area, grado }));
    }

    return results;
  }

  // ── 2. Generar desempeño con OpenAI (con fallback) ─────────

  async generateDesempeno(dto: GenerateDesempenoDto): Promise<DesempenoResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
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
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1200,
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const parsed = JSON.parse(raw) as Record<string, unknown>;

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
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
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
