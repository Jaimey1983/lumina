import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const EMAIL = process.env.SUPERADMIN_EMAIL ?? 'superadmin@lumina.edu.co';
const PLAIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? 'Super1234!';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as unknown as never);

  try {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (existing) {
      const updated = await prisma.user.update({
        where: { email: EMAIL },
        data: {
          role: Role.SUPERADMIN,
          isActive: true,
          deletedAt: null,
          password: await bcrypt.hash(PLAIN_PASSWORD, 10),
        },
      });
      console.log(`\n✔  Usuario existente promovido a SUPERADMIN (${updated.id}).`);
    } else {
      const user = await prisma.user.create({
        data: {
          name: 'Super',
          lastName: 'Admin',
          email: EMAIL,
          password: await bcrypt.hash(PLAIN_PASSWORD, 10),
          role: Role.SUPERADMIN,
        },
      });
      console.log(`\n✔  SUPERADMIN creado (${user.id}).`);
    }

    console.log('\n─── Credenciales ─────────────────────────────────');
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Password: ${PLAIN_PASSWORD}`);
    console.log(`   Rol:      SUPERADMIN`);
    console.log('──────────────────────────────────────────────────\n');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
