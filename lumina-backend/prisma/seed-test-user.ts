import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const EMAIL = 'demo@lumina.edu.co';
const PLAIN_PASSWORD = 'Demo1234!';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (existing) {
      console.log('\n✔  El usuario ya existe — no se creó uno nuevo.');
      console.log(`   ID:    ${existing.id}`);
    } else {
      const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 10);

      const user = await prisma.user.create({
        data: {
          name: 'Docente',
          lastName: 'Demo',
          email: EMAIL,
          password: hashedPassword,
          role: Role.TEACHER,
        },
      });

      console.log('\n✔  Usuario de prueba creado exitosamente.');
      console.log(`   ID:    ${user.id}`);
    }

    console.log('\n─── Credenciales de acceso ───────────────────────');
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Password: ${PLAIN_PASSWORD}`);
    console.log(`   Rol:      TEACHER`);
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
