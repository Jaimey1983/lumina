import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { StudentFeedbackDto } from './dto/student-feedback.dto';
import { ClassSummaryDto } from './dto/class-summary.dto';
import { ContentAssistantDto } from './dto/content-assistant.dto';
import { EvaluateResponseDto } from './dto/evaluate-response.dto';

// ─── Helpers ──────────────────────────────────────────────

const STAFF_ROLES = ['ADMIN', 'SUPERADMIN', 'TEACHER', 'TEACHER_ASSISTANT', 'DEPARTMENT_HEAD'];

function assertStaff(role: string) {
  if (!STAFF_ROLES.includes(role)) {
    throw new ForbiddenException('Solo el personal docente puede usar las funciones de IA');
  }
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class AiFeaturesService {
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY') ?? '',
    });
  }

  // ── Guard: verifica que la API key esté configurada ────────

  private assertApiKey() {
    if (!this.config.get<string>('OPENAI_API_KEY')) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY no está configurada en las variables de entorno',
      );
    }
  }

  // ── Wrapper seguro para llamadas a OpenAI ─────────────────

  private async callOpenAI(
    system: string,
    user: string,
    jsonMode = false,
  ): Promise<string> {
    this.assertApiKey();
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        temperature: 0.7,
        max_tokens: 2000,
      });
      return response.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      const msg = err?.message ?? 'Error desconocido';
      throw new ServiceUnavailableException(`OpenAI no disponible: ${msg}`);
    }
  }

  // ── 1. Generar preguntas de quiz ───────────────────────────

  async generateQuiz(dto: GenerateQuizDto, userId: string, userRole: string) {
    assertStaff(userRole);
    const count = dto.count ?? 5;
    const type = dto.type ?? 'MultipleChoice';

    const system = `Eres un asistente educativo experto en crear preguntas de evaluación.
Responde SIEMPRE en español. Devuelve ÚNICAMENTE JSON válido con la estructura indicada.`;

    const user = `Genera ${count} preguntas de tipo "${type}" en español basadas en el siguiente texto o tema:

"${dto.text}"

Devuelve un objeto JSON con la estructura:
{
  "questions": [
    {
      "question": "string",
      "options": ["opción A", "opción B", "opción C", "opción D"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

Para TrueFalse, options debe ser ["Verdadero", "Falso"] con correctIndex 0 o 1.
Para FillInTheBlanks, options es [] y correctIndex es -1; incluye en question el espacio con "____".`;

    const raw = await this.callOpenAI(system, user, true);
    try {
      const parsed = JSON.parse(raw);
      return {
        type,
        count: parsed.questions?.length ?? 0,
        questions: parsed.questions ?? [],
      };
    } catch {
      throw new ServiceUnavailableException('OpenAI devolvió una respuesta inválida');
    }
  }

  // ── 2. Retroalimentación personalizada por estudiante ──────

  async getStudentFeedback(
    courseId: string,
    dto: StudentFeedbackDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'grades');

    // Cargar datos del estudiante para el período
    const [student, course, period, entries, selfEval, peerEvals] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.studentId },
        select: { id: true, name: true, lastName: true },
      }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { name: true },
      }),
      this.prisma.period.findUnique({
        where: { id: dto.periodId },
        select: { id: true, name: true },
      }),
      this.prisma.gradeEntry.findMany({
        where: { userId: dto.studentId, periodId: dto.periodId },
        select: {
          score: true,
          feedback: true,
          activity: {
            select: {
              name: true,
              maxScore: true,
              weight: true,
              indicator: {
                select: {
                  name: true,
                  aspect: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.selfEvaluation.findUnique({
        where: {
          userId_courseId_periodId: { userId: dto.studentId, courseId, periodId: dto.periodId },
        },
        select: { score: true, feedback: true },
      }),
      this.prisma.peerEvaluation.findMany({
        where: { evaluatedId: dto.studentId, courseId, periodId: dto.periodId },
        select: { score: true, feedback: true },
      }),
    ]);

    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (!period) throw new NotFoundException('Período no encontrado');

    // Construir resumen de desempeño
    const entryLines = entries.map((e) => {
      const pct = ((e.score / e.activity.maxScore) * 5).toFixed(2);
      return `- ${e.activity.indicator.aspect.name} > ${e.activity.indicator.name} > ${e.activity.name}: ${e.score}/${e.activity.maxScore} (nota sobre 5: ${pct})${e.feedback ? ` — comentario: "${e.feedback}"` : ''}`;
    });

    const peerAvg =
      peerEvals.length > 0
        ? (peerEvals.reduce((s, p) => s + p.score, 0) / peerEvals.length).toFixed(2)
        : 'sin datos';

    const summary = [
      `Estudiante: ${student.name} ${student.lastName}`,
      `Curso: ${course?.name ?? courseId}`,
      `Período: ${period.name}`,
      ``,
      `Calificaciones por actividad:`,
      ...(entryLines.length ? entryLines : ['  (sin calificaciones registradas)']),
      ``,
      `Autoevaluación: ${selfEval ? `${selfEval.score}/5` : 'sin datos'}`,
      `Coevaluación (promedio): ${peerAvg}/5`,
    ].join('\n');

    const system = `Eres un docente experto en educación personalizada. Tu rol es generar retroalimentación constructiva, motivadora y específica para cada estudiante en español. Sé empático, preciso y orientado a la mejora.`;

    const userMsg = `Basándote en el siguiente desempeño del estudiante, genera una retroalimentación personalizada en español que:
1. Resalte los puntos fuertes identificados
2. Señale áreas de mejora con sugerencias concretas
3. Proponga una meta alcanzable para el siguiente período
4. Use un tono motivador y constructivo

Desempeño:
${summary}

Devuelve JSON con:
{
  "studentName": "string",
  "period": "string",
  "strengths": ["array de fortalezas identificadas"],
  "improvements": ["array de áreas de mejora con sugerencias concretas"],
  "nextGoal": "string — meta para el siguiente período",
  "overallMessage": "string — mensaje motivador personalizado de 2-3 oraciones"
}`;

    const raw = await this.callOpenAI(system, userMsg, true);
    try {
      const parsed = JSON.parse(raw);
      return {
        studentId: dto.studentId,
        courseId,
        periodId: dto.periodId,
        feedback: parsed,
      };
    } catch {
      throw new ServiceUnavailableException('OpenAI devolvió una respuesta inválida');
    }
  }

  // ── 3. Resumen automático de clase (slides) ────────────────

  async summarizeClass(
    courseId: string,
    dto: ClassSummaryDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(courseId, userId, userRole, 'classEditor');

    const cls = await this.prisma.class.findFirst({
      where: { id: dto.classId, courseId },
      select: {
        id: true,
        title: true,
        description: true,
        slides: {
          orderBy: { order: 'asc' },
          select: { order: true, type: true, title: true, content: true },
        },
      },
    });

    if (!cls) throw new NotFoundException('Clase no encontrada en este curso');
    if (!cls.slides.length) throw new BadRequestException('La clase no tiene slides para resumir');

    const slidesText = cls.slides
      .map((s) => {
        const contentStr =
          s.content && typeof s.content === 'object'
            ? JSON.stringify(s.content).slice(0, 500)
            : '';
        return `Slide ${s.order} [${s.type}] — Título: "${s.title}"${contentStr ? `\nContenido: ${contentStr}` : ''}`;
      })
      .join('\n\n');

    const system = `Eres un asistente educativo experto en resumir contenido pedagógico en español de forma clara y estructurada.`;

    const userMsg = `Genera un resumen completo de la siguiente clase educativa en español.

Clase: "${cls.title}"
${cls.description ? `Descripción: ${cls.description}` : ''}

Slides:
${slidesText}

Devuelve JSON con:
{
  "title": "string — título de la clase",
  "overview": "string — resumen general en 2-3 oraciones",
  "keyPoints": ["array de puntos clave aprendidos"],
  "slidesSummary": [
    { "order": 1, "title": "string", "summary": "string — resumen de ese slide" }
  ],
  "learningObjectives": ["array de objetivos de aprendizaje inferidos"]
}`;

    const raw = await this.callOpenAI(system, userMsg, true);
    try {
      const parsed = JSON.parse(raw);
      return {
        classId: dto.classId,
        courseId,
        summary: parsed,
      };
    } catch {
      throw new ServiceUnavailableException('OpenAI devolvió una respuesta inválida');
    }
  }

  // ── 4. Asistente de contenido (estructura de clase) ────────

  async contentAssistant(dto: ContentAssistantDto, userId: string, userRole: string) {
    assertStaff(userRole);
    const slideCount = dto.slideCount ?? 6;
    const level = dto.level ?? 'intermediate';

    const system = `Eres un diseñador instruccional experto en educación. Creas estructuras de clases pedagógicamente sólidas en español, adaptadas al nivel del estudiante.`;

    const userMsg = `Diseña la estructura completa de una clase educativa sobre el siguiente tema en español.

Tema: "${dto.topic}"
Nivel: ${level === 'beginner' ? 'principiante' : level === 'advanced' ? 'avanzado' : 'intermedio'}
Cantidad de slides: ${slideCount}

Devuelve JSON con:
{
  "title": "string — título atractivo para la clase",
  "description": "string — descripción de 2-3 oraciones de qué aprenderá el estudiante",
  "learningObjectives": ["array de 3-5 objetivos de aprendizaje en infinitivo"],
  "slides": [
    {
      "order": 1,
      "type": "COVER | CONTENT | ACTIVITY | VIDEO | IMAGE",
      "title": "string — título del slide",
      "bulletPoints": ["array de puntos clave a cubrir en este slide"],
      "suggestedContent": "string — sugerencia de contenido o actividad"
    }
  ],
  "suggestedActivities": ["array de actividades complementarias sugeridas"],
  "estimatedDuration": "string — duración estimada de la clase"
}

El primer slide debe ser de tipo COVER. Al menos uno debe ser ACTIVITY.`;

    const raw = await this.callOpenAI(system, userMsg, true);
    try {
      const parsed = JSON.parse(raw);
      return {
        topic: dto.topic,
        level,
        structure: parsed,
      };
    } catch {
      throw new ServiceUnavailableException('OpenAI devolvió una respuesta inválida');
    }
  }

  // ── 5. Evaluación de respuestas libres ─────────────────────

  async evaluateResponse(dto: EvaluateResponseDto, userId: string, userRole: string) {
    assertStaff(userRole);
    const maxScore = dto.maxScore ?? 5;

    const system = `Eres un evaluador educativo experto. Evalúas respuestas de estudiantes de forma objetiva, justa y constructiva en español.`;

    const userMsg = `Evalúa la siguiente respuesta de un estudiante en español.

Pregunta: "${dto.question}"
${dto.rubric ? `Rúbrica de evaluación: "${dto.rubric}"` : ''}
Respuesta del estudiante: "${dto.studentResponse}"
Puntuación máxima: ${maxScore}

Devuelve JSON con:
{
  "score": number (entre 0 y ${maxScore}, puede ser decimal),
  "percentage": number (0 a 100),
  "qualitativeGrade": "string (Excelente/Bueno/Aceptable/Insuficiente/Deficiente)",
  "strengths": ["array de aspectos positivos identificados"],
  "weaknesses": ["array de aspectos a mejorar"],
  "feedback": "string — retroalimentación específica y constructiva de 2-3 oraciones",
  "suggestedAnswer": "string — respuesta modelo o elementos que debería contener"
}

Sé estricto pero justo. La puntuación debe reflejar objetivamente la calidad de la respuesta.`;

    const raw = await this.callOpenAI(system, userMsg, true);
    try {
      const parsed = JSON.parse(raw);
      return {
        question: dto.question,
        maxScore,
        evaluation: parsed,
      };
    } catch {
      throw new ServiceUnavailableException('OpenAI devolvió una respuesta inválida');
    }
  }
}
