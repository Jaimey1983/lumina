import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAuthorizationService } from '../common/course-authorization.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { StudentFeedbackDto } from './dto/student-feedback.dto';
import { ClassSummaryDto } from './dto/class-summary.dto';
import { ContentAssistantDto } from './dto/content-assistant.dto';
import { EvaluateResponseDto } from './dto/evaluate-response.dto';
import { GenerateFromDocumentDto } from './dto/generate-from-document.dto';
import { RefineStructureDto } from './dto/refine-structure.dto';
import { AiKeysService } from './ai-keys.service';
import { parseLlmJsonObject } from './ai-json';
import { assertAiStaff } from './ai-staff';
import { anonymizeStudentLabel } from './ai-pii';

/*
ESQUEMA DE SALIDA — contentAssistant y generateFromDocument:
{
  "title": "string — título atractivo de la clase",
  "description": "string — descripción de 2-3 oraciones",
  "learningObjectives": ["string — objetivo en infinitivo"],
  "estimatedDuration": "string — ej: 45 minutos",
  "slides": [
    {
      "order": 1,
      "tipo": "portada | exploracion | concepto | ejemplo | estructura | comparacion | actividad | cierre",
      "title": "string — título del slide",
      "contenido": {
        "texto_principal": "string — párrafo explicativo de 3-5 oraciones con el concepto central",
        "pregunta_reflexion": "string | null — pregunta para el estudiante (obligatoria en tipo exploracion)",
        "ejemplo": "string | null — ejemplo concreto, preferiblemente colombiano",
        "cita": "string | null — cita o fragmento textual para analizar (tipo bloque)",
        "tabla": {
          "encabezados": ["string"],
          "filas": [["string"]]
        } | null,
        "lista_items": ["string"] | null,
        "imagen_sugerida": "string | null — descripción precisa de imagen: 'Fotografía de la laguna de Iguaque, Boyacá, Colombia'",
        "instruccion_docente": "string | null — nota metodológica para el docente",
        "conexion_dba": "string | null — solo en slide de cierre, citar el DBA textualmente"
      },
      "actividad_lumina": {
        "tipo": "quiz_multiple | verdadero_falso | completar_blancos | emparejar | ordenar | sopa_letras | null",
        "descripcion": "string — descripción breve de la actividad",
        "preguntas_ejemplo": ["string — 2-3 preguntas de ejemplo"]
      } | null
    }
  ],
  "suggestedActivities": ["string"],
  "dba_conexion": "string — cita literal del DBA que cubre esta clase"
}
*/

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class AiFeaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseAuth: CourseAuthorizationService,
    private readonly aiKeys: AiKeysService,
  ) {}

  private async completeParsed(
    userId: string,
    system: string,
    user: string,
  ): Promise<Record<string, unknown>> {
    return parseLlmJsonObject(
      await this.aiKeys.completeForUser(userId, system, user),
    );
  }

  /** Compleción JSON vía proveedor activo (BYOK o Gemini de plataforma). */
  private async callLlmJson(
    userId: string,
    system: string,
    user: string,
  ): Promise<Record<string, unknown>> {
    const parsed = await this.completeParsed(userId, system, user);
    if (!Object.keys(parsed).length) {
      throw new ServiceUnavailableException(
        'La IA devolvió una respuesta inválida',
      );
    }
    return parsed;
  }

  // ── 1. Generar preguntas de quiz ───────────────────────────

  async generateQuiz(dto: GenerateQuizDto, userId: string, userRole: string) {
    assertAiStaff(userRole);
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

    const parsed = await this.completeParsed(userId, system, user);
    const questions = parsed['questions'];
    const qList = Array.isArray(questions) ? questions : [];
    return {
      type,
      count: qList.length,
      questions: qList,
    };
  }

  // ── 2. Retroalimentación personalizada por estudiante ──────

  async getStudentFeedback(
    courseId: string,
    dto: StudentFeedbackDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'grades',
    );

    // Cargar datos del estudiante para el período
    const [student, course, period, entries, selfEval, peerEvals] =
      await Promise.all([
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
                performanceIndicator: {
                  select: {
                    competenceType: true,
                    achievement: {
                      select: {
                        code: true,
                        aspect: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.selfEvaluation.findUnique({
          where: {
            userId_courseId_periodId: {
              userId: dto.studentId,
              courseId,
              periodId: dto.periodId,
            },
          },
          select: { score: true, feedback: true },
        }),
        this.prisma.peerEvaluation.findMany({
          where: {
            evaluatedId: dto.studentId,
            courseId,
            periodId: dto.periodId,
          },
          select: { score: true, feedback: true },
        }),
      ]);

    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (!period) throw new NotFoundException('Período no encontrado');

    // Construir resumen de desempeño
    const entryLines = entries.map((e) => {
      const pct = ((e.score / e.activity.maxScore) * 5).toFixed(2);
      return `- ${e.activity.performanceIndicator.achievement.aspect.name} > ${e.activity.performanceIndicator.achievement.code} > ${e.activity.name}: ${e.score}/${e.activity.maxScore} (nota sobre 5: ${pct})${e.feedback ? ` — comentario: "${e.feedback}"` : ''}`;
    });

    const peerAvg =
      peerEvals.length > 0
        ? (
            peerEvals.reduce((s, p) => s + p.score, 0) / peerEvals.length
          ).toFixed(2)
        : 'sin datos';

    const summary = [
      `Estudiante: ${anonymizeStudentLabel(student.name, student.lastName)}`,
      `Curso: ${course?.name ?? courseId}`,
      `Período: ${period.name}`,
      ``,
      `Calificaciones por actividad:`,
      ...(entryLines.length
        ? entryLines
        : ['  (sin calificaciones registradas)']),
      ``,
      `Autoevaluación: ${selfEval ? `${selfEval.score}/5` : 'sin datos'}`,
      `Coevaluación (promedio): ${peerAvg}/5`,
    ].join('\n');

    const system = `Eres un docente experto en educación personalizada. Tu rol es generar retroalimentación constructiva, motivadora y específica en español. Sé empático, preciso y orientado a la mejora. No inventes apellidos, documentos, correos ni datos de contacto.`;

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

    const feedback = await this.callLlmJson(userId, system, userMsg);
    return {
      studentId: dto.studentId,
      courseId,
      periodId: dto.periodId,
      feedback,
    };
  }

  // ── 3. Resumen automático de clase (slides) ────────────────

  async summarizeClass(
    courseId: string,
    dto: ClassSummaryDto,
    userId: string,
    userRole: string,
  ) {
    await this.courseAuth.assertStaffCanManageCourse(
      courseId,
      userId,
      userRole,
      'classEditor',
    );

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
    if (!cls.slides.length)
      throw new BadRequestException('La clase no tiene slides para resumir');

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

    const summary = await this.callLlmJson(userId, system, userMsg);
    return { classId: dto.classId, courseId, summary };
  }

  // ── 4. Asistente de contenido (estructura de clase) ────────

  async contentAssistant(
    dto: ContentAssistantDto,
    userId: string,
    userRole: string,
  ) {
    assertAiStaff(userRole);
    const slideCount = dto.slideCount ?? 6;
    const level = dto.level ?? 'intermediate';

    const system = `Eres un diseñador instruccional experto en educación colombiana.
Creas clases interactivas pedagógicamente sólidas, contextualizadas en la realidad
colombiana, alineadas con los DBA y EBC del Ministerio de Educación Nacional (MEN).

PRINCIPIOS DIDÁCTICOS OBLIGATORIOS:
1. Progresión inductiva: empieza con una pregunta o situación que genere curiosidad
   ANTES de dar definiciones. El estudiante debe querer saber, no recibir pasivamente.
2. Contenido real: cada slide tiene párrafos explicativos completos (3-5 oraciones),
   no listas de palabras sueltas.
3. Contextualización colombiana: usa ejemplos de Colombia — regiones, culturas,
   personajes históricos, ecosistemas, autores, eventos. Nunca ejemplos genéricos
   o exclusivamente europeos/norteamericanos.
4. Fragmentos para analizar: en clases de lenguaje, ciencias sociales o humanidades,
   incluye al menos un texto, cita o fragmento real para que el estudiante analice,
   no solo "aprenda sobre" él.
5. Nivel Bloom: si el contexto curricular indica el nivel Bloom del DBA, el slide
   de actividad debe operar en ese nivel (no solo recordar si el DBA pide analizar).
6. Imágenes precisas: cuando sugieres imagen, describe con precisión:
   "Fotografía de la sierra nevada de Santa Marta" no "imagen de una montaña".
7. Voz del estudiante: incluye al menos una pregunta de reflexión por slide de
   contenido — el estudiante responde antes de recibir más información.
8. Cierre curricular: el último slide conecta explícitamente con el DBA o EBC
   y propone una tarea alineada a las evidencias de aprendizaje.

RESTRICCIONES:
- NUNCA generes listas de bullets como único contenido de un slide
- NUNCA uses ejemplos de países ajenos a Colombia si existe un equivalente colombiano
- NUNCA repitas el mismo tipo de slide dos veces seguidas
- El slide tipo "portada" siempre es el primero
- El slide tipo "actividad" contiene una actividad Lumina concreta, no solo descripción
- El slide tipo "cierre" siempre es el último

Responde ÚNICAMENTE con el JSON especificado. Sin texto adicional, sin markdown.`;

    const nivelTexto =
      level === 'beginner'
        ? 'básico (educación primaria, 6-11 años)'
        : level === 'advanced'
          ? 'avanzado (educación media, 15-17 años)'
          : 'intermedio (educación secundaria, 12-14 años)';

    const curriculumSection = dto.curriculumContext
      ? `\nCONTEXTO CURRICULAR DBA/EBC (MEN Colombia):\n${dto.curriculumContext}\n\nUSA este contexto para alinear objetivos, ejemplos y actividades con los DBA indicados.`
      : '';

    const plantillaSection = dto.plantillaEstructura
      ? `\nESTRUCTURA PEDAGÓGICA REQUERIDA:\n${dto.plantillaEstructura}\nSigue este orden de tipos de slide estrictamente.`
      : '';

    const userMsg = `Diseña una clase educativa completa sobre el siguiente tema.

Tema: "${dto.topic}"
Nivel educativo: ${nivelTexto}
Número de slides: ${slideCount}
${curriculumSection}
${plantillaSection}

INSTRUCCIONES ESPECÍFICAS:
- El primer slide es SIEMPRE tipo "portada" con título atractivo y objetivo visible
- El segundo slide es SIEMPRE tipo "exploracion" con una pregunta detonadora potente
  que genere curiosidad ANTES de enseñar el concepto
- Incluye al menos UN ejemplo concreto de Colombia o latinoamérica
- Si el tema lo permite, incluye un fragmento de texto real para analizar (tipo "cita")
- El slide de actividad debe especificar el tipo Lumina exacto y preguntas de ejemplo
- El último slide es SIEMPRE tipo "cierre" con síntesis, tarea y conexión DBA

Devuelve ÚNICAMENTE el siguiente JSON (sin texto previo, sin markdown, sin backticks):
{
  "title": "título atractivo de la clase",
  "description": "descripción de 2-3 oraciones de qué aprenderá el estudiante",
  "learningObjectives": ["objetivo 1 en infinitivo", "objetivo 2", "objetivo 3"],
  "estimatedDuration": "XX minutos",
  "slides": [
    {
      "order": 1,
      "tipo": "portada",
      "title": "título del slide",
      "contenido": {
        "texto_principal": "párrafo explicativo de 3-5 oraciones",
        "pregunta_reflexion": null,
        "ejemplo": null,
        "cita": null,
        "tabla": null,
        "lista_items": null,
        "imagen_sugerida": "descripción precisa de imagen sugerida",
        "instruccion_docente": null,
        "conexion_dba": null
      },
      "actividad_lumina": null
    }
  ],
  "suggestedActivities": ["actividad complementaria 1", "actividad 2"],
  "dba_conexion": "cita literal del DBA que cubre esta clase o null si no aplica"
}`;

    const structure = await this.callLlmJson(userId, system, userMsg);
    return { topic: dto.topic, level, structure };
  }

  // ── 5. Evaluación de respuestas libres ─────────────────────

  async evaluateResponse(
    dto: EvaluateResponseDto,
    userId: string,
    userRole: string,
  ) {
    assertAiStaff(userRole);
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

    const evaluation = await this.callLlmJson(userId, system, userMsg);
    return { question: dto.question, maxScore, evaluation };
  }

  // ── 6. Generación de clase desde documento ─────────────────────────────────

  async generateFromDocument(
    dto: GenerateFromDocumentDto,
    userId: string,
    userRole: string,
  ) {
    assertAiStaff(userRole);
    const slideCount = dto.slideCount ?? 6;
    const level = dto.level ?? 'intermediate';

    // Truncar el texto del documento para no exceder el contexto de Gemini
    const maxDocChars = 6000;
    const docText =
      dto.documentText.length > maxDocChars
        ? dto.documentText.slice(0, maxDocChars) + '\n[... documento truncado ...]'
        : dto.documentText;

    const system = `Eres un diseñador instruccional experto en educación colombiana.
Tu tarea es analizar un documento educativo y construir una clase interactiva
pedagógicamente sólida a partir de su contenido.

PRINCIPIOS DIDÁCTICOS OBLIGATORIOS:
1. Extrae los conceptos clave del documento — no inventes contenido que no esté allí
2. Reorganiza pedagógicamente: el orden del documento no es necesariamente el mejor
   orden didáctico. Empieza con lo que genera curiosidad, no con definiciones
3. Usa los ejemplos y datos del documento, no ejemplos genéricos externos
4. Contextualiza en Colombia si el documento lo permite
5. Incluye al menos un fragmento textual del documento para que el estudiante analice
6. El slide de actividad debe derivarse del contenido real del documento
7. Identifica y lista los conceptos clave extraídos (keyConceptsExtracted)

RESTRICCIONES:
- NUNCA inventes información que no esté en el documento
- NUNCA generes listas de bullets como único contenido
- Responde ÚNICAMENTE con el JSON especificado`;

    const nivelTexto =
      level === 'beginner'
        ? 'básico (educación primaria, 6-11 años)'
        : level === 'advanced'
          ? 'avanzado (educación media, 15-17 años)'
          : 'intermedio (educación secundaria, 12-14 años)';

    const curriculumSection = dto.curriculumContext
      ? `\nCONTEXTO CURRICULAR (DBA/EBC del MEN):\n${dto.curriculumContext}\n`
      : '';

    const gradeSection = dto.grade
      ? `Grado: ${dto.grade}${dto.subject ? ` — ${dto.subject}` : ''}`
      : '';

    const userMsg = `Analiza el siguiente documento y diseña una clase educativa completa.
${gradeSection}
${dto.topic ? `Enfoque temático: "${dto.topic}"` : ''}
Nivel educativo: ${nivelTexto}
Cantidad de slides: ${slideCount}
${curriculumSection}
DOCUMENTO:
---
${docText}
---

Devuelve ÚNICAMENTE este JSON (sin texto previo, sin markdown, sin backticks):
{
  "title": "título atractivo basado en el documento",
  "description": "descripción de 2-3 oraciones",
  "learningObjectives": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "estimatedDuration": "XX minutos",
  "keyConceptsExtracted": ["concepto 1 del documento", "concepto 2", "concepto 3"],
  "documentSummary": "resumen de 3-4 oraciones del documento analizado",
  "slides": [
    {
      "order": 1,
      "tipo": "portada | exploracion | concepto | ejemplo | estructura | comparacion | actividad | cierre",
      "title": "título del slide",
      "contenido": {
        "texto_principal": "párrafo de 3-5 oraciones con contenido real del documento",
        "pregunta_reflexion": "pregunta para el estudiante o null",
        "ejemplo": "ejemplo concreto del documento o null",
        "cita": "fragmento textual del documento para analizar o null",
        "tabla": null,
        "lista_items": null,
        "imagen_sugerida": "descripción precisa o null",
        "instruccion_docente": "nota metodológica o null",
        "conexion_dba": "solo en cierre: cita literal del DBA o null"
      },
      "actividad_lumina": {
        "tipo": "quiz_multiple | verdadero_falso | completar_blancos | emparejar | ordenar | sopa_letras",
        "descripcion": "descripción de la actividad",
        "preguntas_ejemplo": ["pregunta 1", "pregunta 2"]
      }
    }
  ],
  "suggestedActivities": ["actividad complementaria 1"],
  "dba_conexion": "cita literal del DBA o null"
}`;

    const structure = await this.callLlmJson(userId, system, userMsg);
    return {
      topic: dto.topic ?? 'Desde documento',
      grade: dto.grade,
      subject: dto.subject,
      level,
      structure,
    };
  }

  // ── 7. Refinamiento conversacional de estructura ────────────────────────────

  async refineStructure(
    dto: RefineStructureDto,
    userId: string,
    userRole: string,
  ) {
    assertAiStaff(userRole);

    const system = `Eres un diseñador instruccional experto en educación colombiana.
Tu tarea es MODIFICAR una estructura de clase existente según las instrucciones del docente.
Responde SIEMPRE con la estructura completa actualizada en JSON — nunca solo los cambios.
Mantén el mismo esquema JSON de la estructura original.`;

    // Construir historial conversacional para Gemini (máximo 6 turnos anteriores
    // para no exceder contexto)
    const historyLines = dto.conversationHistory
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Docente' : 'IA'}: ${h.content}`)
      .join('\n');

    const userMsg = `ESTRUCTURA ACTUAL DE LA CLASE:
${JSON.stringify(dto.currentStructure, null, 2).slice(0, 4000)}
${historyLines ? `HISTORIAL DE AJUSTES ANTERIORES:\n${historyLines}\n` : ''}
NUEVA INSTRUCCIÓN DEL DOCENTE: "${dto.instruction}"

Aplica la instrucción y devuelve la estructura completa actualizada con el mismo formato JSON:
{
  "title": "string",
  "description": "string",
  "learningObjectives": ["..."],
  "slides": [{ "order": 1, "type": "...", "title": "...", "bulletPoints": ["..."], "suggestedContent": "..." }],
  "suggestedActivities": ["..."],
  "estimatedDuration": "string"
}

Si la instrucción es ambigua, interpreta la intención pedagógica más probable.
Si pide eliminar slides, renumera los restantes desde 1.`;

    const structure = await this.callLlmJson(userId, system, userMsg);
    return { structure, instruction: dto.instruction };
  }
}
