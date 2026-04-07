import 'dotenv/config';
import { PrismaClient, Role, SlideType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const TEACHER_EMAIL = 'demo@lumina.edu.co';
const STUDENT_EMAIL = 'estudiante@lumina.edu.co';
const PLAIN_PASSWORD = 'Demo1234!';
const COURSE_CODE = 'CNAT5-2026';
const CLASS_CODE = 'CICLAGUA1';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    // ── 1. Buscar docente demo ─────────────────────────────────────────────
    const teacher = await prisma.user.findUnique({ where: { email: TEACHER_EMAIL } });
    if (!teacher) {
      throw new Error(
        `No se encontró el usuario ${TEACHER_EMAIL}. Ejecuta primero: npx ts-node --project tsconfig.json prisma/seed-test-user.ts`,
      );
    }
    console.log(`\n✔  Docente encontrado: ${teacher.name} ${teacher.lastName} (${teacher.id})`);

    // ── 2. Curso "Ciencias Naturales 5°" ──────────────────────────────────
    let course = await prisma.course.findFirst({ where: { code: COURSE_CODE } });
    let courseCreated = false;
    if (!course) {
      course = await prisma.course.create({
        data: {
          name: 'Ciencias Naturales 5°',
          description: 'Curso de Ciencias Naturales para grado 5° — Institución Educativa Demo',
          code: COURSE_CODE,
          teacher: { connect: { id: teacher.id } },
        },
      });
      courseCreated = true;
    }

    // ── 3. Clase "El ciclo del agua" con 2 slides ─────────────────────────
    let classRecord = await prisma.class.findFirst({ where: { code: CLASS_CODE } });
    let classCreated = false;
    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          title: 'El ciclo del agua',
          description: 'Grado: 5 | Área: Ciencias Naturales',
          code: CLASS_CODE,
          course: { connect: { id: course.id } },
          slides: {
            create: [
              {
                order: 1,
                type: SlideType.COVER,
                title: 'El ciclo del agua',
                content: {
                  background: '#e8f4fd',
                  subtitle: 'Explorando el movimiento del agua en la naturaleza',
                  autor: 'Docente Demo',
                  grado: '5°',
                  area: 'Ciencias Naturales',
                } as any,
              },
              {
                order: 2,
                type: SlideType.CONTENT,
                title: '¿Qué es el ciclo del agua?',
                content: {
                  body: 'El ciclo del agua es el proceso continuo por el que el agua circula entre la Tierra y la atmósfera mediante evaporación, condensación y precipitación.',
                  bullets: [
                    'Evaporación: el sol calienta el agua y la convierte en vapor.',
                    'Condensación: el vapor sube y se acumula formando nubes.',
                    'Precipitación: el agua cae en forma de lluvia, nieve o granizo.',
                    'Escorrentía: el agua regresa a ríos, lagos y océanos.',
                  ],
                  preguntaReflexion: '¿Por qué es importante el ciclo del agua para los seres vivos?',
                } as any,
              },
            ],
          },
        },
      });
      classCreated = true;
    }

    // ── 4. Estudiante de prueba ────────────────────────────────────────────
    let student = await prisma.user.findUnique({ where: { email: STUDENT_EMAIL } });
    let studentCreated = false;
    if (!student) {
      const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 10);
      student = await prisma.user.create({
        data: {
          name: 'Estudiante',
          lastName: 'Demo',
          email: STUDENT_EMAIL,
          password: hashedPassword,
          role: Role.STUDENT,
        },
      });
      studentCreated = true;
    }

    // ── 5. Matricular estudiante en el curso ──────────────────────────────
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
    });
    let enrollmentCreated = false;
    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          user: { connect: { id: student.id } },
          course: { connect: { id: course.id } },
        },
      });
      enrollmentCreated = true;
    }

    // ── Resumen ────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════');
    console.log('   RESUMEN — DATOS DE DEMOSTRACIÓN LUMINA');
    console.log('══════════════════════════════════════════════════════');

    console.log(`\n  [CURSO]`);
    console.log(`   Nombre : ${course.name}`);
    console.log(`   Código : ${course.code}`);
    console.log(`   ID     : ${course.id}`);
    console.log(`   Estado : ${courseCreated ? 'CREADO' : 'ya existía'}`);

    console.log(`\n  [CLASE]`);
    console.log(`   Título : ${classRecord.title}`);
    console.log(`   Código : ${classRecord.code}`);
    console.log(`   ID     : ${classRecord.id}`);
    console.log(`   Slides : ${classCreated ? '2 slides creados (COVER + CONTENT)' : 'ya existía'}`);
    console.log(`   Estado : ${classCreated ? 'CREADA' : 'ya existía'}`);

    console.log(`\n  [ESTUDIANTE]`);
    console.log(`   Nombre : ${student.name} ${student.lastName}`);
    console.log(`   Email  : ${STUDENT_EMAIL}`);
    console.log(`   ID     : ${student.id}`);
    console.log(`   Estado : ${studentCreated ? 'CREADO' : 'ya existía'}`);

    console.log(`\n  [MATRÍCULA]`);
    console.log(`   Estudiante → Curso : ${enrollmentCreated ? 'CREADA' : 'ya existía'}`);

    console.log('\n──────────────────────────────────────────────────────');
    console.log('   Credenciales de acceso (texto plano)');
    console.log('──────────────────────────────────────────────────────');
    console.log(`   Docente    →  email: ${TEACHER_EMAIL}  /  password: ${PLAIN_PASSWORD}`);
    console.log(`   Estudiante →  email: ${STUDENT_EMAIL}  /  password: ${PLAIN_PASSWORD}`);
    console.log('══════════════════════════════════════════════════════\n');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
