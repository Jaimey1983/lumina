import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { QueryAchievementDto } from './dto/query-achievement.dto';
import {
  AchievementScope,
  CompetenceType,
  CompetenceScope,
  Prisma,
} from '@prisma/client';
import { LLM_MODELS } from '../ai-features/ai-provider.types';

const COMPETENCE_TYPES_AUTO = [
  CompetenceType.COGNITIVE,
  CompetenceType.METHODOLOGICAL,
  CompetenceType.INTERPERSONAL,
  CompetenceType.INSTRUMENTAL,
] as const;

/**
 * Fallback determinista por tipo de competencia (J5) — reemplaza el
 * `['','','','']` que se guardaba en `PerformanceIndicator.statement`
 * cuando Gemini no está disponible o falla (a diferencia de Pieza 1,
 * `generatePIStatements` nunca tuvo plantilla de respaldo — guardaba
 * indicadores VACÍOS en producción). Cada plantilla es un enunciado
 * observable real y distinto de los otros 3, no una reescritura del logro
 * en distinta intensidad — el mismo error conceptual que corrigió J4 en
 * Pieza 1, acá aplicado al eje de competencias de Edu (COG/MET/INT/INS,
 * NO el eje pedagógico Cognitivo/Procedimental/Actitudinal de D3 — son
 * ejes distintos, J4).
 */
const FALLBACK_INDICADOR_POR_COMPETENCIA: Record<
  CompetenceType,
  (statement: string) => string
> = {
  COGNITIVE: (s) =>
    `Explica con sus propias palabras los conceptos centrales de: "${s}".`,
  METHODOLOGICAL: (s) =>
    `Organiza un procedimiento claro, paso a paso, para abordar: "${s}".`,
  INTERPERSONAL: (s) =>
    `Participa activamente y coopera con sus compañeros al trabajar en: "${s}".`,
  INSTRUMENTAL: (s) =>
    `Utiliza las herramientas o recursos adecuados para desarrollar: "${s}".`,
  SUBJECT_SPECIFIC: (s) =>
    `Profundiza en los aspectos disciplinares específicos de: "${s}".`,
};

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly config: ConfigService,
  ) {}

  private async callGemini(
    systemInstruction: string,
    userMessage: string,
    maxOutputTokens = 2000,
  ): Promise<string> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) return '';

    const model = LLM_MODELS.GEMINI;
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

  async create(
    courseId: string,
    dto: CreateAchievementDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );

    // Verify structure exists
    const structure = await this.prisma.gradebookStructure.findUnique({
      where: { courseId },
      select: { id: true },
    });
    if (!structure) {
      throw new NotFoundException(
        'No existe estructura de calificación para este curso',
      );
    }

    // Verify aspect belongs to this course
    const aspect = await this.prisma.aspect.findUnique({
      where: { id: dto.aspectId },
      select: {
        id: true,
        structureId: true,
        structure: { select: { courseId: true } },
      },
    });
    if (!aspect || aspect.structure.courseId !== courseId) {
      throw new NotFoundException('Aspecto no encontrado en este curso');
    }

    // Verify period belongs to course
    const period = await this.prisma.period.findFirst({
      where: { id: dto.periodId, courseId },
      select: { id: true },
    });
    if (!period) {
      throw new NotFoundException('Período no encontrado en este curso');
    }

    // Check unique code per course
    const existing = await this.prisma.achievement.findUnique({
      where: { code_courseId: { code: dto.code, courseId } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un logro con el código "${dto.code}" en este curso`,
      );
    }

    // Generate PI statements via Gemini if available
    const piStatements = await this.generatePIStatements(dto.statement);

    // Create achievement + 4 PIs in a transaction
    const achievement = await this.prisma.$transaction(async (tx) => {
      const ach = await tx.achievement.create({
        data: {
          code: dto.code,
          statement: dto.statement,
          scope: dto.scope ?? AchievementScope.SPECIFIC,
          courseId,
          aspectId: dto.aspectId,
          periodId: dto.periodId,
        },
        select: {
          id: true,
          code: true,
          statement: true,
          scope: true,
          courseId: true,
          aspectId: true,
          periodId: true,
          createdAt: true,
        },
      });

      // Create 4 default PIs
      await tx.performanceIndicator.createMany({
        data: COMPETENCE_TYPES_AUTO.map((ct, i) => ({
          statement: piStatements[i] ?? '',
          competenceType: ct,
          competenceScope: CompetenceScope.GENERAL,
          weight: 0.25,
          achievementId: ach.id,
        })),
      });

      return ach;
    });

    return this.findOne(courseId, achievement.id, userId, role);
  }

  async findAll(
    courseId: string,
    query: QueryAchievementDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const where: Prisma.AchievementWhereInput = { courseId };
    if (query.aspectId) where.aspectId = query.aspectId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.scope) where.scope = query.scope;

    return this.prisma.achievement.findMany({
      where,
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
        aspect: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
        _count: { select: { performanceIndicators: true } },
      },
      orderBy: [{ aspectId: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(
    courseId: string,
    achievementId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.verifyCourseReadAccess(courseId, userId, role);

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
        aspect: { select: { id: true, name: true } },
        period: { select: { id: true, name: true } },
        performanceIndicators: {
          select: {
            id: true,
            statement: true,
            competenceType: true,
            competenceScope: true,
            subject: true,
            weight: true,
            createdAt: true,
            activities: {
              select: {
                id: true,
                name: true,
                weight: true,
                maxScore: true,
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { competenceType: 'asc' },
        },
      },
    });

    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    return achievement;
  }

  async update(
    courseId: string,
    achievementId: string,
    dto: UpdateAchievementDto,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, courseId: true, code: true },
    });
    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    if (dto.code && dto.code !== achievement.code) {
      const existing = await this.prisma.achievement.findUnique({
        where: { code_courseId: { code: dto.code, courseId } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un logro con el código "${dto.code}" en este curso`,
        );
      }
    }

    return this.prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.statement !== undefined && { statement: dto.statement }),
        ...(dto.scope !== undefined && { scope: dto.scope }),
      },
      select: {
        id: true,
        code: true,
        statement: true,
        scope: true,
        courseId: true,
        aspectId: true,
        periodId: true,
        createdAt: true,
      },
    });
  }

  async remove(
    courseId: string,
    achievementId: string,
    userId: string,
    role: string,
  ) {
    await this.courseAuth.assertCourseExists(courseId);
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      role,
      'gradebook',
    );

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, courseId: true },
    });
    if (!achievement || achievement.courseId !== courseId) {
      throw new NotFoundException('Logro no encontrado en este curso');
    }

    // Check if any GradeEntry is associated via PIs and Activities
    const gradeCount = await this.prisma.gradeEntry.count({
      where: {
        activity: {
          performanceIndicator: { achievementId },
        },
      },
    });
    if (gradeCount > 0) {
      throw new ConflictException(
        'No se puede eliminar el logro: tiene calificaciones registradas',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete activities under PIs
      const pis = await tx.performanceIndicator.findMany({
        where: { achievementId },
        select: { id: true },
      });
      for (const pi of pis) {
        await tx.activity.deleteMany({
          where: { performanceIndicatorId: pi.id },
        });
      }
      await tx.performanceIndicator.deleteMany({ where: { achievementId } });
      await tx.achievement.delete({ where: { id: achievementId } });
    });

    return { message: 'Logro eliminado correctamente' };
  }

  /**
   * Genera un indicador REAL por cada tipo de competencia de
   * `COMPETENCE_TYPES_AUTO` (J5) — enunciados observables distintos entre
   * sí, no 4 reescrituras del mismo logro en distinta intensidad (esa
   * confusión ya la corrigió J4 en Pieza 1). Nunca devuelve strings vacíos:
   * sin `GEMINI_API_KEY`, o si Gemini falla/devuelve algo inválido para un
   * tipo puntual, ese tipo cae a `FALLBACK_INDICADOR_POR_COMPETENCIA`
   * (fallback por-elemento, no por-lote — un solo tipo mal generado no tira
   * el resto).
   */
  private async generatePIStatements(
    achievementStatement: string,
  ): Promise<string[]> {
    const fallback = COMPETENCE_TYPES_AUTO.map((ct) =>
      FALLBACK_INDICADOR_POR_COMPETENCIA[ct](achievementStatement),
    );
    if (!this.config.get<string>('GEMINI_API_KEY')) {
      return fallback;
    }
    try {
      const content = await this.callGemini(
        'Eres un asistente pedagógico especializado en el sistema educativo colombiano. Generas indicadores de logro que son enunciados OBSERVABLES y DISTINTOS entre sí — cada uno describe un comportamiento concreto del estudiante, no una variación de intensidad del mismo enunciado. Responde en español, máximo 150 caracteres por indicador.',
        `Para el siguiente logro: "${achievementStatement}"

Genera exactamente 4 indicadores de logro DISTINTOS entre sí, uno por cada tipo de competencia:
1. Cognitivo (comprensión/análisis del contenido)
2. Metodológico (organización de un proceso o procedimiento)
3. Interpersonal (colaboración, comunicación con otros)
4. Instrumental (uso de herramientas, recursos o técnicas)

Ejemplo de 4 indicadores VÁLIDOS y distintos para un logro sobre "el ciclo del agua": ["Explica las fases del ciclo del agua con sus propias palabras", "Organiza un experimento paso a paso para representar la evaporación", "Comparte sus hallazgos con el grupo y escucha otras interpretaciones", "Usa un diagrama o maqueta para representar el ciclo del agua"].
Ejemplo INVÁLIDO (rechazar este patrón): ["Comprende el ciclo del agua de forma básica", "Comprende el ciclo del agua de forma satisfactoria", "Comprende el ciclo del agua de forma sobresaliente", "Comprende el ciclo del agua de forma excepcional"] — son 4 niveles del MISMO enunciado, no 4 indicadores distintos.

Responde SOLO con un JSON array de 4 strings en este orden: [cognitivo, metodológico, interpersonal, instrumental]. Sin explicaciones adicionales, sin bloques de código markdown.`,
        500,
      );

      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed: unknown = cleaned ? JSON.parse(cleaned) : null;
      if (!Array.isArray(parsed) || parsed.length !== 4) {
        return fallback;
      }
      return parsed.map((s: unknown, i) =>
        typeof s === 'string' && s.trim().length > 0
          ? s.trim().slice(0, 150)
          : fallback[i],
      );
    } catch {
      return fallback;
    }
  }
}
