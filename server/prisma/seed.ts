import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const referralCode = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: 'admin' },
    });
    console.log(`Updated admin user: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'admin',
        profile: {
          create: {
            fullName: 'Admin',
            referralCode,
          },
        },
      },
    });
    console.log(`Created admin user: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
