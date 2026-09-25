import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, Role, SlideType, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const TEMPLATE_PATH = join(
  __dirname,
  '..',
  'src',
  'help-guide',
  'templates',
  'welcome-teacher.json',
);

interface TemplateSlide {
  order: number;
  type: keyof typeof SlideType;
  title: string;
  content: unknown;
}

interface TemplateFile {
  templateKey: string;
  title: string;
  description?: string;
  background?: string;
  slides: TemplateSlide[];
}

/**
 * Seed idempotente de "Guía de Lumina" (X.2) — upsert por `templateKey`.
 * `templateVersion` sube solo cuando cambia el hash del JSON versionado, así
 * dos ejecuciones seguidas con el mismo contenido no tocan nada (Regla 7 —
 * el test de contrato del frontend valida ese mismo JSON contra el esquema
 * vigente de bloques antes de que llegue acá).
 *
 * REQUIERE que ya exista un SUPERADMIN (`npx ts-node prisma/seed-superadmin.ts`)
 * — a propósito, no se crea uno nuevo acá para no terminar con dos cuentas
 * de sistema inconsistentes entre sí.
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as unknown as never);

  try {
    const superadmin = await prisma.user.findFirst({
      where: { role: Role.SUPERADMIN, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!superadmin) {
      throw new Error(
        'No se encontró ningún SUPERADMIN. Ejecuta primero: npx ts-node --project tsconfig.json prisma/seed-superadmin.ts',
      );
    }

    const raw = readFileSync(TEMPLATE_PATH, 'utf-8');
    const template = JSON.parse(raw) as TemplateFile;
    const contentHash = createHash('sha256').update(raw).digest('hex');
    // `Class.templateVersion` es `Int` en Postgres (32 bits CON signo, máximo
    // 2147483647) — 8 hex chars son 32 bits SIN signo y pueden desbordarlo
    // (bug real encontrado corriendo el seed contra una DB real). Enmascarar
    // a 31 bits mantiene el propósito (detectar cambio de contenido) con
    // colisión ~1/2^31, insignificante para este uso.
    const version = parseInt(contentHash.slice(0, 8), 16) & 0x7fffffff;

    const existing = await prisma.class.findUnique({
      where: { templateKey: template.templateKey },
      select: { id: true, templateVersion: true },
    });

    if (existing && existing.templateVersion === version) {
      console.log(
        `\n✔  "${template.title}" ya está al día (v${version}) — sin cambios.`,
      );
      return;
    }

    if (existing) {
      // Reemplazo completo de slides: se borran y se recrean dentro de la
      // misma escritura (no hay slides de usuario que preservar — la clase
      // es de solo lectura, solo el seed la toca).
      await prisma.slide.deleteMany({ where: { classId: existing.id } });
      await prisma.class.update({
        where: { id: existing.id },
        data: {
          title: template.title,
          description: template.description,
          background: template.background ?? 'none',
          templateVersion: version,
          slides: {
            create: template.slides.map((s) => ({
              order: s.order,
              type: s.type as SlideType,
              title: s.title,
              content: s.content as Prisma.InputJsonValue,
            })),
          },
        },
      });
      console.log(
        `\n✔  "${template.title}" actualizada a v${version} (clase ${existing.id}).`,
      );
      return;
    }

    const created = await prisma.class.create({
      data: {
        title: template.title,
        description: template.description,
        code: `HELP-GUIDE-${template.templateKey}`,
        codigo: `HELPGUIDE${version}`,
        courseId: null,
        authorId: superadmin.id,
        modoEntrega: 'presentacion',
        status: 'PUBLISHED',
        background: template.background ?? 'none',
        isSystemTemplate: true,
        templateKey: template.templateKey,
        templateVersion: version,
        slides: {
          create: template.slides.map((s) => ({
            order: s.order,
            type: s.type as SlideType,
            title: s.title,
            content: s.content as Prisma.InputJsonValue,
          })),
        },
      },
    });
    console.log(
      `\n✔  "${template.title}" creada como clase de sistema v${version} (${created.id}), dueño ${superadmin.email}.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
