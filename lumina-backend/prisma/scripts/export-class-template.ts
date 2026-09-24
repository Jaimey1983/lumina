import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Exporta una clase real (autorada a mano en el editor de Lumina, NO la
 * clase de sistema) a un JSON con la misma forma que espera
 * `seed-help-guide.ts` — Paso 3 de la ficha X.2: el contenido se autora en
 * el editor, no a mano en JSON.
 *
 * Uso: npx ts-node --project tsconfig.json prisma/scripts/export-class-template.ts <classId> <templateKey>
 */
async function main() {
  const [classId, templateKey] = process.argv.slice(2);
  if (!classId || !templateKey) {
    console.error(
      'Uso: export-class-template.ts <classId> <templateKey>\n' +
        'Ej.: npx ts-node --project tsconfig.json prisma/scripts/export-class-template.ts cabc123 welcome-teacher',
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as unknown as never);

  try {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        title: true,
        description: true,
        background: true,
        slides: {
          select: { order: true, type: true, title: true, content: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!cls) {
      throw new Error(`No se encontró la clase ${classId}.`);
    }

    const out = {
      templateKey,
      title: cls.title,
      description: cls.description ?? undefined,
      background: cls.background ?? 'none',
      slides: cls.slides,
    };

    const outPath = join(
      __dirname,
      '..',
      '..',
      'src',
      'help-guide',
      'templates',
      `${templateKey}.json`,
    );
    writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
    console.log(`\n✔  Exportado a ${outPath}. Revisa el diff antes de commitear.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
